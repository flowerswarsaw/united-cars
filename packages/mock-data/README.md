# Mock Data Layer

## Purpose
This mock data layer allows us to develop and test the entire application without database dependencies.

## Architecture
- All data is stored in memory
- Supports full CRUD operations
- Maintains exact API response formats
- Can be easily swapped for real database later

## Usage
```typescript
import { mockDB } from '@united-cars/mock-data';

// Get all vehicles
const vehicles = await mockDB.vehicles.findMany();

// Get single vehicle
const vehicle = await mockDB.vehicles.findById('vehicle-1');

// Create vehicle
const newVehicle = await mockDB.vehicles.create(data);

// Update vehicle
const updated = await mockDB.vehicles.update('vehicle-1', data);

// Delete vehicle
await mockDB.vehicles.delete('vehicle-1');
```

## Data Structure
- Users (admin, dealer, ops)
- Organizations (admin-org, dealer-org)
- Vehicles (12 demo vehicles with various statuses)
- Invoices, Payments, Claims, Services, Titles
- All relationships maintained in memory