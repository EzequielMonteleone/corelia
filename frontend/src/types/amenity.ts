export interface Amenity {
  id: string;
  key?: string | null;
  name: string;
  isSystem: boolean;
}

export interface BuildingAmenity {
  id: string;
  buildingId: string;
  amenityId: string;
  isEnabled: boolean;
  slotMinutes: number;
  maxConcurrent: number;
  openTime: string;
  closeTime: string;
  rules?: string | null;
  amenity: Amenity;
}

export interface AmenityReservation {
  id: string;
  buildingAmenityId: string;
  unitId: string;
  startsAt: string;
  endsAt: string;
  status: 'CONFIRMED' | 'CANCELLED';
  notes: string | null;
  mine: boolean;
  unit: {id: string; name: string};
  amenityName: string;
  user: {id: string; firstName: string; lastName: string} | null;
}

export interface BuildingAmenitiesResponse {
  catalog: Amenity[];
  amenities: BuildingAmenity[];
}
