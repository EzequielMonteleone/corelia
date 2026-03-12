export interface Unit {
  id: string;
  buildingId: string;
  name: string;
  floor?: string | null;
  coefficient?: number | null;
}
