import {formatHm, parseHm, zonedClock, zonedDateTime} from './zonedTime.js';

export const RESERVATION_PAST_GRACE_MS = 60_000;
export const RESERVATION_MAX_DAYS_AHEAD = 60;
export const RESERVATION_MAX_NOTES = 500;

export type ReservationWindowCode =
  | 'SLOT_IN_PAST'
  | 'SLOT_TOO_FAR'
  | 'NOTES_TOO_LONG'
  | null;

/** Past grace, how far ahead a booking may start, and the note cap. */
export function reservationWindow(input: {
  startsAt: Date;
  notes?: string | null;
  now?: number;
}): ReservationWindowCode {
  const now = input.now ?? Date.now();
  if (Number.isNaN(input.startsAt.getTime())) return 'SLOT_IN_PAST';
  if (input.startsAt.getTime() < now - RESERVATION_PAST_GRACE_MS) return 'SLOT_IN_PAST';
  const horizon = RESERVATION_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  if (input.startsAt.getTime() > now + horizon) return 'SLOT_TOO_FAR';
  const notes = input.notes?.trim() || '';
  if (notes.length > RESERVATION_MAX_NOTES) return 'NOTES_TOO_LONG';
  return null;
}

export function amenityDaySlots(input: {
  day: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  maxConcurrent: number;
  takenStarts: Date[];
  now?: number;
}): {time: string; past: boolean; full: boolean}[] {
  const open = parseHm(input.openTime);
  const close = parseHm(input.closeTime);
  if (open === null || close === null || input.slotMinutes <= 0) return [];
  const now = input.now ?? Date.now();
  const slots: {time: string; past: boolean; full: boolean}[] = [];
  for (
    let cursor = open;
    cursor + input.slotMinutes <= close;
    cursor += input.slotMinutes
  ) {
    const time = formatHm(cursor);
    const startsAt = zonedDateTime(input.day, time);
    const taken = input.takenStarts.filter(start => {
      const clock = zonedClock(start);
      return clock.day === input.day && formatHm(clock.minutes) === time;
    }).length;
    slots.push({
      time,
      past: startsAt.getTime() < now - RESERVATION_PAST_GRACE_MS,
      full: taken >= input.maxConcurrent,
    });
  }
  return slots;
}

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
