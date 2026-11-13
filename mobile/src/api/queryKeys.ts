export const queryKeys = {
  profile: ['users', 'me'] as const,
  users: ['users'] as const,
  user: (id: string | null) => ['users', id] as const,
  userAudit: (id: string | null) => ['users', id, 'audit-logs'] as const,
  roles: ['roles'] as const,
  permissions: ['permissions'] as const,
  buildings: ['buildings'] as const,
  building: (id: string | null) => ['buildings', id] as const,
  buildingUnitsRoot: ['building-units'] as const,
  buildingUnits: (buildingId: string | null) =>
    ['building-units', buildingId] as const,
  buildingAmenitiesRoot: ['building-amenities'] as const,
  buildingAmenities: (buildingId: string | null) =>
    ['building-amenities', buildingId] as const,
  reservationsRoot: ['reservations'] as const,
  reservations: (
    buildingId: string | null,
    amenityId: string | null,
    from: string | null,
    to: string | null,
  ) => ['reservations', buildingId, amenityId, from, to] as const,
  expensePeriodsRoot: ['expense-periods'] as const,
  expensePeriods: (buildingId: string | null) =>
    ['expense-periods', buildingId] as const,
  collectionSummaryRoot: ['collection-summary'] as const,
  collectionSummary: (buildingId: string | null) =>
    ['collection-summary', buildingId] as const,
  expensePeriod: (periodId: string | null) =>
    ['expense-period-detail', periodId] as const,
  expensePeriodRoot: ['expense-period-detail'] as const,
  expensePeriodAuditRoot: ['expense-period-audit-logs'] as const,
  expensePeriodAudit: (periodId: string | null) =>
    ['expense-period-audit-logs', periodId] as const,
  claimsRoot: ['claims'] as const,
  claims: (
    buildingId: string | null,
    unitId: string | null,
    amenityId: string | null,
  ) => ['claims', buildingId, unitId, amenityId] as const,
  documentsRoot: ['documents'] as const,
  documents: (buildingId: string | null) => ['documents', buildingId] as const,
  documentRoot: ['document'] as const,
  document: (buildingId: string | null, documentId: string | null) =>
    ['document', buildingId, documentId] as const,
  householdRoot: ['household'] as const,
  household: (unitId: string | null) => ['household', unitId] as const,
  chatThread: ['chat', 'thread'] as const,
  notificationsRoot: ['notifications'] as const,
  notifications: ['notifications'] as const,
} as const;
