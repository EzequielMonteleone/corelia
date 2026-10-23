import {parseHm, zonedClock} from './zonedTime.js';

export type SlotAmenityRules = {
  isEnabled: boolean;
  slotMinutes: number;
  openTime: string;
  closeTime: string;
};

export type SlotValidationCode =
  | 'AMENITY_DISABLED'
  | 'INVALID_HOURS'
  | 'SLOT_OUTSIDE_HOURS'
  | null;

/** Returns an error code if the slot is invalid, or null if OK. */
export function validateReservationSlot(
  amenity: SlotAmenityRules,
  startsAt: Date,
  endsAt: Date,
): SlotValidationCode {
  if (!amenity.isEnabled) return 'AMENITY_DISABLED';

  const open = parseHm(amenity.openTime);
  const close = parseHm(amenity.closeTime);
  if (open === null || close === null || open >= close) {
    return 'INVALID_HOURS';
  }

  const startClock = zonedClock(startsAt);
  const endClock = zonedClock(endsAt);
  if (startClock.day !== endClock.day) return 'SLOT_OUTSIDE_HOURS';
  if (startClock.minutes < open || endClock.minutes > close) {
    return 'SLOT_OUTSIDE_HOURS';
  }
  if ((startClock.minutes - open) % amenity.slotMinutes !== 0) {
    return 'SLOT_OUTSIDE_HOURS';
  }
  if (endClock.minutes - startClock.minutes !== amenity.slotMinutes) {
    return 'SLOT_OUTSIDE_HOURS';
  }
  return null;
}

/** True when the unit already holds a confirmed booking that overlaps this slot. */
export function unitAlreadyBookedInSlot(existingOverlapForUnit: number): boolean {
  return existingOverlapForUnit >= 1;
}
