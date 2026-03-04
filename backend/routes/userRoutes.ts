import { Router } from "express";
import type { Response, NextFunction } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { findUserById, createUserWithRole } from "../services/userService.js";
import { prisma } from "../prismaClient.js";
import { canCreateRole } from "../utils/rbacHelper.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { buildingId } = req.params;
      const { email, firstName, lastName, phone, password, roleName } = req.body ?? {};

      if (!buildingId) {
        return res.status(400).json({ error: "BUILDING_ID_REQUIRED" });
      }

      if (!email || !firstName || !lastName || !password || !roleName) {
        return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
      }

      if (!req.user?.id) {
        return res.status(401).json({ error: "UNAUTHENTICATED" });
      }

      // 1. Obtener el usuario actual (el que hace la petición)
      const creator = await findUserById(req.user.id);
      if (!creator || !creator.isActive) {
        return res.status(404).json({ error: "CREATOR_NOT_FOUND" });
      }

      // 2. Determinar el rol del creador en el edificio específico
      const creatorBuildingUser = creator.buildingUsers.find(
        (bu: { buildingId: string }) => bu.buildingId === buildingId
      );
      
      const creatorBuildingRoleName = creatorBuildingUser?.role?.name || null;

      // 3. Verificar permisos de creación usando el helper RBAC
      const isAllowed = canCreateRole(
        creator.globalRole,
        creatorBuildingRoleName,
        roleName
      );

      if (!isAllowed) {
        return res.status(403).json({ error: "INSUFFICIENT_PERMISSIONS" });
      }

      // 4. Buscar el ID del rol que se quiere asignar
      const targetRole = await prisma.role.findFirst({
        where: { name: roleName },
      });

      if (!targetRole) {
        return res.status(400).json({ error: "INVALID_ROLE_NAME" });
      }

      // 5. Crear el usuario y asignar el rol en la DB
      const { user, buildingUser } = await createUserWithRole(
        { email, firstName, lastName, phone, passwordPlain: password },
        buildingId as string,
        targetRole.id
      );

      return res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: buildingUser.role.name,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("Unique constraint failed on the fields: (`email`)")) {
        return res.status(400).json({ error: "EMAIL_ALREADY_EXISTS" });
      }
      return next(err);
    }
  }
);

export default router;
