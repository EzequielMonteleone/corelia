import {GlobalRole} from '@prisma/client';
import {findUserById} from './userService.js';
import {buildingIsOpen} from '../lib/buildingAccess.js';
import {asBuildingRole, type ChatActor} from '../lib/chatAccess.js';

export async function loadChatActor(userId: string): Promise<ChatActor | null> {
  const user = await findUserById(userId);
  if (!user || !user.isActive || user.deleted) return null;

  const buildings: ChatActor['buildings'] = [];
  for (const membership of user.buildingUsers) {
    if (!buildingIsOpen(membership.building)) continue;
    const role = asBuildingRole(membership.role.name);
    if (!role) continue;
    buildings.push({
      id: membership.buildingId,
      name: membership.building.name,
      role,
    });
  }

  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    globalRole:
      user.globalRole === GlobalRole.SUPERADMIN ? 'SUPERADMIN' : 'USER',
    buildings,
    units: user.userUnits.map(link => ({
      id: link.unitId,
      name: link.unit.name,
      buildingId: link.unit.buildingId,
      relationType: link.relationType,
    })),
  };
}
