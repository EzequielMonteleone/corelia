import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  superAdminOnly,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  findUserById,
  createUserWithRole,
  getAllUsers,
  getUsersByBuildings,
  getRoomersByBuildings,
  updateUser,
  deleteUser,
} from '../services/userService.js';
import {prisma} from '../prismaClient.js';
import {canCreateRole} from '../utils/rbacHelper.js';
import {GlobalRole} from '@prisma/client';

const router = Router();

router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      if (user.globalRole === GlobalRole.SUPERADMIN) {
        const users = await getAllUsers();
        return res.json(users);
      }

      // Admin: users from buildings where they are Admin
      const adminBuildingIds = user.buildingUsers
        .filter(bu => bu.role.name === 'Admin')
        .map(bu => bu.buildingId);

      if (adminBuildingIds.length > 0) {
        const users = await getUsersByBuildings(adminBuildingIds);
        return res.json(users);
      }

      // Owner: only roomers from buildings where they are Owner
      const ownerBuildingIds = user.buildingUsers
        .filter(bu => bu.role.name === 'Owner')
        .map(bu => bu.buildingId);

      if (ownerBuildingIds.length > 0) {
        const users = await getRoomersByBuildings(ownerBuildingIds);
        return res.json(users);
      }

      return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await findUserById(req.params.id as string);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await updateUser(req.params.id as string, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deleteUser(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/building/:buildingId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {buildingId} = req.params;
      const {email, firstName, lastName, phone, password, roleName} =
        req.body ?? {};

      if (!buildingId) {
        return res.status(400).json({error: 'BUILDING_ID_REQUIRED'});
      }

      if (!email || !firstName || !lastName || !password || !roleName) {
        return res.status(400).json({error: 'MISSING_REQUIRED_FIELDS'});
      }

      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const creator = await findUserById(req.user.id);
      if (!creator || !creator.isActive) {
        return res.status(404).json({error: 'CREATOR_NOT_FOUND'});
      }

      const creatorBuildingUser = creator.buildingUsers.find(
        (bu: {buildingId: string}) => bu.buildingId === buildingId,
      );

      const creatorBuildingRoleName = creatorBuildingUser?.role?.name || null;

      const isAllowed = canCreateRole(
        creator.globalRole,
        creatorBuildingRoleName,
        roleName,
      );

      if (!isAllowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const targetRole = await prisma.role.findFirst({
        where: {name: roleName},
      });

      if (!targetRole) {
        return res.status(400).json({error: 'INVALID_ROLE_NAME'});
      }

      const {user, buildingUser} = await createUserWithRole(
        {email, firstName, lastName, phone, passwordPlain: password},
        buildingId as string,
        targetRole.id,
      );

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: buildingUser.role.name,
        },
      });
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes(
          'Unique constraint failed on the fields: (`email`)',
        )
      ) {
        return res.status(400).json({error: 'EMAIL_ALREADY_EXISTS'});
      }
      return next(err);
    }
  },
);

export default router;
