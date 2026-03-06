import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  superAdminOnly,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
} from '../services/roleService.js';

const router = Router();

// Roles
router.get(
  '/',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const roles = await getAllRoles();
      res.json(roles);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {name, description, permissionIds} = req.body;
      const role = await createRole(
        name as string,
        description as string | undefined,
        permissionIds as string[] | undefined,
      );
      res.status(201).json(role);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {name, description, permissionIds} = req.body;
      const role = await updateRole(
        req.params.id as string,
        name as string | undefined,
        description as string | undefined,
        permissionIds as string[] | undefined,
      );
      res.json(role);
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
      await deleteRole(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// Permissions
router.get(
  '/permissions',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const permissions = await getAllPermissions();
      res.json(permissions);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
