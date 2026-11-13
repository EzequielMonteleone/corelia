import {isAxiosError} from 'axios';

export function errorCode(error: unknown): string {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (typeof code === 'string') return code;
    if (error.code) return error.code;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'UNKNOWN';
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Probá de nuevo en unos minutos.',
  UNAUTHENTICATED: 'Tu sesión expiró. Iniciá sesión nuevamente.',
  INSUFFICIENT_PERMISSIONS: 'No tenés permiso para realizar esta acción.',
  USER_NOT_FOUND: 'No se encontró el usuario.',
  BUILDING_NOT_FOUND: 'No se encontró el edificio.',
  UNIT_NOT_FOUND: 'No se encontró la unidad.',
  UNIT_NOT_LINKED: 'La unidad no está vinculada a tu cuenta.',
  UNIT_NOT_IN_BUILDING: 'La unidad no pertenece a este edificio.',
  EXPENSE_PERIOD_NOT_FOUND: 'No se encontró el período de expensas.',
  EXPENSE_NOT_FOUND: 'No se encontró la expensa.',
  PAYMENT_NOT_FOUND: 'No se encontró el pago.',
  PERIOD_CLOSED: 'El período está cerrado.',
  EXPENSE_ALREADY_PAID: 'La expensa ya está paga.',
  EXPENSE_HAS_PAYMENTS: 'La expensa tiene pagos asociados.',
  AMOUNT_EXCEEDS_BALANCE: 'El monto supera el saldo pendiente.',
  INVALID_AMOUNT: 'El monto ingresado no es válido.',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual no coincide.',
  CURRENT_PASSWORD_REQUIRED: 'Ingresá tu contraseña actual para cambiarla.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
  EMAIL_ALREADY_EXISTS: 'Ese email ya está en uso.',
  OWNER_UNITS_REQUIRED: 'El propietario necesita al menos una unidad.',
  ROOMER_SINGLE_UNIT_REQUIRED: 'El inquilino necesita una unidad.',
  OWNER_CAN_ASSIGN_ONLY_OWN_UNITS: 'Solo podés asignar tus propias unidades.',
  ADMIN_CANNOT_HAVE_UNITS: 'Un administrador no puede tener unidades asignadas.',
  INVALID_ROLE_NAME: 'El rol seleccionado no es válido.',
  MISSING_REQUIRED_FIELDS: 'Faltan campos obligatorios.',
  INVALID_PAYLOAD: 'Los datos enviados no son válidos.',
  PLATE_TAKEN: 'La patente ya está registrada.',
  INVALID_HOUSEHOLD: 'Revisá los datos ingresados.',
  INVALID_CLAIM: 'Revisá los datos del reclamo.',
  AMENITY_NOT_FOUND: 'No se encontró el amenity.',
  AMENITY_HAS_RESERVATIONS: 'El amenity tiene reservas y no se puede eliminar.',
  AMENITY_OR_NAME_REQUIRED: 'Elegí un amenity o ingresá un nombre.',
  BUILDING_AMENITY_NOT_FOUND: 'No se encontró el amenity del edificio.',
  SLOT_UNAVAILABLE: 'Ese horario ya no está disponible.',
  SLOT_OUTSIDE_HOURS: 'El horario está fuera del horario de uso.',
  SLOT_IN_PAST: 'No podés reservar un horario pasado.',
  SLOT_TOO_FAR: 'La reserva es demasiado lejana.',
  AMENITY_DISABLED: 'El amenity está deshabilitado.',
  UNIT_ALREADY_BOOKED: 'La unidad ya tiene una reserva en ese horario.',
  INVALID_TITLE: 'El título no es válido.',
  INVALID_BODY: 'El contenido no es válido.',
  INVALID_KIND: 'El tipo de documento no es válido.',
  DOCUMENT_NOT_FOUND: 'No se encontró el documento.',
  CHAT_NOT_CONFIGURED: 'El asistente no está configurado en el servidor.',
  THREAD_NOT_FOUND: 'La conversación ya no existe.',
  MESSAGE_REQUIRED: 'Escribí un mensaje.',
  PERIOD_REQUIRED: 'Ingresá el nombre del período.',
  INVALID_STATUS: 'El estado no es válido.',
  INVALID_EXPORT_FORMAT: 'El formato de exportación no es válido.',
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Revisá tu conexión.',
  ECONNABORTED: 'La solicitud tardó demasiado. Intentá nuevamente.',
  UNKNOWN: 'Ocurrió un error inesperado.',
};

export function errorMessage(error: unknown): string {
  const code = errorCode(error);
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN;
}

export function isNetworkError(error: unknown) {
  return isAxiosError(error) && !error.response;
}

export function axiosStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
