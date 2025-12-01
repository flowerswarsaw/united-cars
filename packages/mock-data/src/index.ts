export * from './types';
export { mockDB } from './mock-db';

// Export data for direct access if needed
export { users, roles, userRoles } from './data/users';
export { organizations } from './data/organizations';
export { vehicles } from './data/vehicles';
export { serviceRequests, insuranceClaims, vehicleIntakes } from './data/services';
export { titles } from './data/titles';
export { packages, packageStatusToTitleStatus } from './data/packages';
export { invoices, paymentIntents } from './data/financial';
export { userProfiles, userPreferences } from './data/user-profiles';
export { companySettings } from './data/company-settings';

// Export pricing matrices data
export {
  ports,
  auctionLocations,
  vehicleTypes,
  towingRoutes,
  getTowingRoute,
  updateTowingRoute,
  createTowingRoute,
  deleteTowingRoute,
  getLocationById,
  getPortById,
  getVehicleTypeById,
  updateLocationPreferredPort,
  getRoutesForLocation,
  getRoutesToPort,
  type Port,
  type AuctionLocation,
  type VehicleType,
  type TowingRoute,
  type TowingMatrix
} from './data/pricing-matrices';

// Enhanced persistence system
export * from './persistence/enhanced-persistence';
export * from './persistence/persistence-service-factory';
export * from './persistence/json-persistence';