---
name: seguridad
description: >
  Revisa autorización de una capacidad nueva de Corelia antes de darla por
  terminada. Use when adding a route, a service write, a chat tool, a
  permission flag, or when the user asks about security, permisos, IDOR,
  quién puede ver o escribir, or whether an endpoint is safe.
---

# Seguridad

El permiso vive en `backend/lib/` y se vuelve a chequear en el servicio. Seguí `security.mdc` y la tabla de `reuse.mdc`. No copies la condición en la ruta ni en la pantalla.

## Al agregar una capacidad

1. Buscá la función en `backend/lib/`. Si no existe, creala ahí con `*.test.ts`. `lib/` no importa Prisma.
2. La ruta lleva `authMiddleware`, lee params y delega. No consulta Prisma ni compara `Admin`, `Owner` o `Roomer`.
3. El servicio carga la fila y llama a la regla con el `buildingId` de esa fila. Un `buildingId` del body solo sirve para rechazar si no coincide.
4. La pantalla lee el flag (`canCreate`, `canManage`, `canDelete`). No recalcula el rol.
5. Un tool de chat que escribe prepara un borrador. Confirmar vuelve a correr la misma regla. El tool de confirmación no escribe.
6. El texto que carga una persona se valida con tope en `lib/` y se renderiza como texto.

## Qué tiene que fallar el test

- Otra persona del mismo edificio, con un vínculo que no coincide con su rol.
- Un id de otro edificio: el mismo código que si el id no existe (`UNIT_NOT_FOUND`, `AMENITY_NOT_FOUND`). Quien no entra al edificio recibe `INSUFFICIENT_PERMISSIONS` y la búsqueda no corre.
- El admin no pasa por una regla de residente. `unitAccess` no sirve para crear un reclamo.
- El superadmin administra sin ser residente, y no crea un reclamo de unidad o amenity si no tiene ese vínculo.

## Reclamos

| Pregunta | Función |
| --- | --- |
| ¿Crea en esta unidad? | `claimCreateAccess` |
| ¿Crea en este amenity? | `claimAmenityAccess` |
| ¿Qué lista ve y qué puede crear? | `claimListScope` |
| ¿Cambia estado o respuesta? | `canManageClaim` |
| ¿Confirma este borrador? | `claimDraftConfirmAccess` |

Un reclamo de amenity lo ven los residentes de ese edificio. Un reclamo de unidad lo ven el residente con el vínculo que coincide y quien administra el edificio.
