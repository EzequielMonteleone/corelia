import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  unitAlreadyBookedInSlot,
  validateReservationSlot,
} from './reservationRules.js';
import {zonedDateTime} from './zonedTime.js';

const amenity = {
  isEnabled: true,
  slotMinutes: 60,
  openTime: '08:00',
  closeTime: '22:00',
};

describe('validateReservationSlot', () => {
  it('accepts a slot aligned to open hours', () => {
    const startsAt = zonedDateTime('2026-10-23', '10:00');
    const endsAt = zonedDateTime('2026-10-23', '11:00');
    assert.equal(validateReservationSlot(amenity, startsAt, endsAt), null);
  });

  it('rejects disabled amenities', () => {
    const startsAt = zonedDateTime('2026-10-23', '10:00');
    const endsAt = zonedDateTime('2026-10-23', '11:00');
    assert.equal(
      validateReservationSlot({...amenity, isEnabled: false}, startsAt, endsAt),
      'AMENITY_DISABLED',
    );
  });

  it('rejects slots outside open hours', () => {
    const startsAt = zonedDateTime('2026-10-23', '07:00');
    const endsAt = zonedDateTime('2026-10-23', '08:00');
    assert.equal(
      validateReservationSlot(amenity, startsAt, endsAt),
      'SLOT_OUTSIDE_HOURS',
    );
  });

  it('rejects misaligned slot starts', () => {
    const startsAt = zonedDateTime('2026-10-23', '10:30');
    const endsAt = zonedDateTime('2026-10-23', '11:30');
    assert.equal(
      validateReservationSlot(amenity, startsAt, endsAt),
      'SLOT_OUTSIDE_HOURS',
    );
  });

  it('rejects wrong duration', () => {
    const startsAt = zonedDateTime('2026-10-23', '10:00');
    const endsAt = zonedDateTime('2026-10-23', '12:00');
    assert.equal(
      validateReservationSlot(amenity, startsAt, endsAt),
      'SLOT_OUTSIDE_HOURS',
    );
  });

  it('rejects invalid open/close window', () => {
    const startsAt = zonedDateTime('2026-10-23', '10:00');
    const endsAt = zonedDateTime('2026-10-23', '11:00');
    assert.equal(
      validateReservationSlot(
        {...amenity, openTime: '22:00', closeTime: '08:00'},
        startsAt,
        endsAt,
      ),
      'INVALID_HOURS',
    );
  });
});

describe('unitAlreadyBookedInSlot', () => {
  it('is false when the unit has no overlapping booking', () => {
    assert.equal(unitAlreadyBookedInSlot(0), false);
  });

  it('is true when the unit already has an overlapping booking', () => {
    assert.equal(unitAlreadyBookedInSlot(1), true);
    assert.equal(unitAlreadyBookedInSlot(2), true);
  });
});
