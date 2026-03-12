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
  amenity: Amenity;
}

export interface BuildingAmenitiesResponse {
  catalog: Amenity[];
  amenities: BuildingAmenity[];
}
