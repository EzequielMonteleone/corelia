import {GlobalRole} from '@prisma/client';
import type {UserRoleName} from '../types/index.js';

/**
 * Verifica si el usuario creador tiene permisos para asignar un rol específico.
 * @param creatorGlobalRole El GlobalRole del usuario que intenta crear.
 * @param creatorBuildingRoleName El nombre del rol que tiene el creador en ese edificio (si aplica).
 * @param targetRoleName El rol que se desea asignar al nuevo usuario.
 * @returns boolean indicando si la acción es permitida.
 */
export function canCreateRole(
  creatorGlobalRole: GlobalRole,
  creatorBuildingRoleName: string | null,
  targetRoleName: UserRoleName | string,
): boolean {
  // 1. SUPERADMIN puede crear cualquier tipo de rol
  if (creatorGlobalRole === GlobalRole.SUPERADMIN) {
    return true;
  }

  // Si no es superadmin, necesita tener un rol válido en el edificio
  if (!creatorBuildingRoleName) {
    return false;
  }

  // 2. ADMIN puede crear Owner y Roomer
  if (creatorBuildingRoleName === 'Admin') {
    return targetRoleName === 'Owner' || targetRoleName === 'Roomer';
  }

  // 3. OWNER puede crear Roomer
  if (creatorBuildingRoleName === 'Owner') {
    return targetRoleName === 'Roomer';
  }

  // 4. ROOMER no puede crear a nadie
  if (creatorBuildingRoleName === 'Roomer') {
    return false;
  }

  return false;
}
