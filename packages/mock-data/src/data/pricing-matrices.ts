// Pricing matrices data including towing rules with proper relationships

export interface Port {
  id: string;
  name: string;
  state: string;
  country: string;
  code: string;
}

export interface AuctionLocation {
  id: string;
  auction: 'COPART' | 'IAA' | 'MANHEIM' | 'ADESA';
  code: string;
  name: string;
  state: string;
  country: string;
  preferredPortId: string | null;
}

export interface VehicleType {
  id: string;
  key: string;
  name: string;
  category: 'regular' | 'oversize' | 'small' | 'specialty';
  multiplier: number;
}

export interface TowingMatrix {
  id: string;
  auctionLocationId: string;
  deliveryPortId: string;
  vehicleTypeId: string;
  price: number;
  active: boolean;
  updatedAt: Date;
}

export interface TowingRoute {
  id: string;
  auctionLocationId: string;
  deliveryPortId: string;
  basePrice: number;
  active: boolean;
  vehiclePrices: {
    [vehicleTypeId: string]: number;
  };
}

// Ports data
export const ports: Port[] = [
  { id: 'port-ny-nj', name: 'Newark/New York', state: 'NJ', country: 'US', code: 'USNWK' },
  { id: 'port-savannah', name: 'Savannah', state: 'GA', country: 'US', code: 'USSAV' },
  { id: 'port-houston', name: 'Houston', state: 'TX', country: 'US', code: 'USHOU' },
  { id: 'port-los-angeles', name: 'Los Angeles', state: 'CA', country: 'US', code: 'USLAX' },
  { id: 'port-seattle', name: 'Seattle', state: 'WA', country: 'US', code: 'USSEA' },
  { id: 'port-jacksonville', name: 'Jacksonville', state: 'FL', country: 'US', code: 'USJAX' },
  { id: 'port-baltimore', name: 'Baltimore', state: 'MD', country: 'US', code: 'USBAL' },
  { id: 'port-miami', name: 'Miami', state: 'FL', country: 'US', code: 'USMIA' },
  { id: 'port-norfolk', name: 'Norfolk', state: 'VA', country: 'US', code: 'USNFK' },
  { id: 'port-chicago', name: 'Chicago', state: 'IL', country: 'US', code: 'USCHI' },
];

// Vehicle types with multipliers
export const vehicleTypes: VehicleType[] = [
  { id: 'vt-sedan', key: 'SEDAN', name: 'Sedan', category: 'regular', multiplier: 1.0 },
  { id: 'vt-suv', key: 'SUV', name: 'SUV', category: 'regular', multiplier: 1.2 },
  { id: 'vt-bigsuv', key: 'BIGSUV', name: 'Big SUV', category: 'oversize', multiplier: 1.5 },
  { id: 'vt-pickup', key: 'PICKUP', name: 'Pickup Truck', category: 'regular', multiplier: 1.15 },
  { id: 'vt-van', key: 'VAN', name: 'Van', category: 'oversize', multiplier: 1.3 },
  { id: 'vt-motorcycle', key: 'MOTORCYCLE', name: 'Motorcycle', category: 'small', multiplier: 0.7 },
  { id: 'vt-atv', key: 'ATV', name: 'ATV', category: 'small', multiplier: 0.8 },
  { id: 'vt-boat', key: 'BOAT', name: 'Boat', category: 'specialty', multiplier: 2.0 },
  { id: 'vt-rv', key: 'RV', name: 'RV', category: 'specialty', multiplier: 2.5 },
  { id: 'vt-coupe', key: 'COUPE', name: 'Coupe', category: 'regular', multiplier: 1.0 },
  { id: 'vt-hatchback', key: 'HATCHBACK', name: 'Hatchback', category: 'regular', multiplier: 1.0 },
  { id: 'vt-convertible', key: 'CONVERTIBLE', name: 'Convertible', category: 'regular', multiplier: 1.1 },
  { id: 'vt-wagon', key: 'WAGON', name: 'Wagon', category: 'regular', multiplier: 1.1 },
  { id: 'vt-truck', key: 'TRUCK', name: 'Truck', category: 'regular', multiplier: 1.25 },
];

// Auction locations with preferred ports
export const auctionLocations: AuctionLocation[] = [
  // COPART California - prefer LA Port
  { id: 'loc-copart-fresno-ca', auction: 'COPART', code: 'fresno-ca', name: 'Fresno, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-copart-vallejo-ca', auction: 'COPART', code: 'vallejo-ca', name: 'Vallejo, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-copart-rancho-ca', auction: 'COPART', code: 'rancho-ca', name: 'Rancho Cucamonga, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-copart-sacramento-ca', auction: 'COPART', code: 'sacramento-ca', name: 'Sacramento, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-copart-san-diego-ca', auction: 'COPART', code: 'san-diego-ca', name: 'San Diego, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-copart-los-angeles-ca', auction: 'COPART', code: 'los-angeles-ca', name: 'Los Angeles, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },

  // COPART Texas - prefer Houston Port
  { id: 'loc-copart-houston-tx', auction: 'COPART', code: 'houston-tx', name: 'Houston, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },
  { id: 'loc-copart-dallas-tx', auction: 'COPART', code: 'dallas-tx', name: 'Dallas, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },
  { id: 'loc-copart-austin-tx', auction: 'COPART', code: 'austin-tx', name: 'Austin, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },
  { id: 'loc-copart-san-antonio-tx', auction: 'COPART', code: 'san-antonio-tx', name: 'San Antonio, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },

  // COPART Florida - prefer Jacksonville Port
  { id: 'loc-copart-orlando-fl', auction: 'COPART', code: 'orlando-fl', name: 'Orlando, FL', state: 'FL', country: 'US', preferredPortId: 'port-jacksonville' },
  { id: 'loc-copart-miami-fl', auction: 'COPART', code: 'miami-fl', name: 'Miami, FL', state: 'FL', country: 'US', preferredPortId: 'port-miami' },
  { id: 'loc-copart-tampa-fl', auction: 'COPART', code: 'tampa-fl', name: 'Tampa, FL', state: 'FL', country: 'US', preferredPortId: 'port-jacksonville' },
  { id: 'loc-copart-jacksonville-fl', auction: 'COPART', code: 'jacksonville-fl', name: 'Jacksonville, FL', state: 'FL', country: 'US', preferredPortId: 'port-jacksonville' },

  // COPART Georgia - prefer Savannah Port
  { id: 'loc-copart-atlanta-ga', auction: 'COPART', code: 'atlanta-ga', name: 'Atlanta, GA', state: 'GA', country: 'US', preferredPortId: 'port-savannah' },
  { id: 'loc-copart-savannah-ga', auction: 'COPART', code: 'savannah-ga', name: 'Savannah, GA', state: 'GA', country: 'US', preferredPortId: 'port-savannah' },

  // COPART Northeast - prefer NY/NJ Port
  { id: 'loc-copart-trenton-nj', auction: 'COPART', code: 'trenton-nj', name: 'Trenton, NJ', state: 'NJ', country: 'US', preferredPortId: 'port-ny-nj' },
  { id: 'loc-copart-philadelphia-pa', auction: 'COPART', code: 'philadelphia-pa', name: 'Philadelphia, PA', state: 'PA', country: 'US', preferredPortId: 'port-ny-nj' },
  { id: 'loc-copart-syracuse-ny', auction: 'COPART', code: 'syracuse-ny', name: 'Syracuse, NY', state: 'NY', country: 'US', preferredPortId: 'port-ny-nj' },
  { id: 'loc-copart-albany-ny', auction: 'COPART', code: 'albany-ny', name: 'Albany, NY', state: 'NY', country: 'US', preferredPortId: 'port-ny-nj' },

  // COPART Midwest - prefer Chicago Port
  { id: 'loc-copart-chicago-il', auction: 'COPART', code: 'chicago-il', name: 'Chicago, IL', state: 'IL', country: 'US', preferredPortId: 'port-chicago' },
  { id: 'loc-copart-detroit-mi', auction: 'COPART', code: 'detroit-mi', name: 'Detroit, MI', state: 'MI', country: 'US', preferredPortId: 'port-chicago' },
  { id: 'loc-copart-columbus-oh', auction: 'COPART', code: 'columbus-oh', name: 'Columbus, OH', state: 'OH', country: 'US', preferredPortId: 'port-chicago' },

  // COPART West Coast - prefer Seattle Port
  { id: 'loc-copart-seattle-wa', auction: 'COPART', code: 'seattle-wa', name: 'Seattle, WA', state: 'WA', country: 'US', preferredPortId: 'port-seattle' },
  { id: 'loc-copart-portland-or', auction: 'COPART', code: 'portland-or', name: 'Portland, OR', state: 'OR', country: 'US', preferredPortId: 'port-seattle' },

  // IAA locations
  { id: 'loc-iaa-los-angeles-ca', auction: 'IAA', code: 'los-angeles-ca', name: 'Los Angeles, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-iaa-fresno-ca', auction: 'IAA', code: 'fresno-ca', name: 'Fresno, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-iaa-houston-tx', auction: 'IAA', code: 'houston-tx', name: 'Houston, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },
  { id: 'loc-iaa-dallas-tx', auction: 'IAA', code: 'dallas-tx', name: 'Dallas, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },
  { id: 'loc-iaa-orlando-fl', auction: 'IAA', code: 'orlando-fl', name: 'Orlando, FL', state: 'FL', country: 'US', preferredPortId: 'port-jacksonville' },
  { id: 'loc-iaa-miami-fl', auction: 'IAA', code: 'miami-fl', name: 'Miami, FL', state: 'FL', country: 'US', preferredPortId: 'port-miami' },
  { id: 'loc-iaa-atlanta-ga', auction: 'IAA', code: 'atlanta-ga', name: 'Atlanta, GA', state: 'GA', country: 'US', preferredPortId: 'port-savannah' },
  { id: 'loc-iaa-philadelphia-pa', auction: 'IAA', code: 'philadelphia-pa', name: 'Philadelphia, PA', state: 'PA', country: 'US', preferredPortId: 'port-ny-nj' },
  { id: 'loc-iaa-chicago-il', auction: 'IAA', code: 'chicago-il', name: 'Chicago, IL', state: 'IL', country: 'US', preferredPortId: 'port-chicago' },
  { id: 'loc-iaa-detroit-mi', auction: 'IAA', code: 'detroit-mi', name: 'Detroit, MI', state: 'MI', country: 'US', preferredPortId: 'port-chicago' },
  { id: 'loc-iaa-seattle-wa', auction: 'IAA', code: 'seattle-wa', name: 'Seattle, WA', state: 'WA', country: 'US', preferredPortId: 'port-seattle' },

  // MANHEIM locations
  { id: 'loc-manheim-riverside-ca', auction: 'MANHEIM', code: 'riverside-ca', name: 'Riverside, CA', state: 'CA', country: 'US', preferredPortId: 'port-los-angeles' },
  { id: 'loc-manheim-atlanta-ga', auction: 'MANHEIM', code: 'atlanta-ga', name: 'Atlanta, GA', state: 'GA', country: 'US', preferredPortId: 'port-savannah' },
  { id: 'loc-manheim-dallas-tx', auction: 'MANHEIM', code: 'dallas-tx', name: 'Dallas, TX', state: 'TX', country: 'US', preferredPortId: 'port-houston' },
  { id: 'loc-manheim-orlando-fl', auction: 'MANHEIM', code: 'orlando-fl', name: 'Orlando, FL', state: 'FL', country: 'US', preferredPortId: 'port-jacksonville' },
  { id: 'loc-manheim-pennsylvania-pa', auction: 'MANHEIM', code: 'pennsylvania-pa', name: 'Pennsylvania, PA', state: 'PA', country: 'US', preferredPortId: 'port-ny-nj' },
  { id: 'loc-manheim-newburgh-ny', auction: 'MANHEIM', code: 'newburgh-ny', name: 'Newburgh, NY', state: 'NY', country: 'US', preferredPortId: 'port-ny-nj' },
];

// Initialize towing routes with fixed prices for each vehicle type
const initializeTowingRoutes = (): TowingRoute[] => {
  const routes: TowingRoute[] = [];

  // Key routes with explicit vehicle pricing - no base price, just fixed rates per vehicle
  const routeConfigs = [
    // COPART California to LA Port
    { 
      auctionLocationId: 'loc-copart-fresno-ca', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 280, 'vt-coupe': 280, 'vt-hatchback': 280, 'vt-convertible': 290, 'vt-wagon': 290,
        'vt-suv': 320, 'vt-pickup': 300, 'vt-truck': 330,
        'vt-bigsuv': 380, 'vt-van': 350,
        'vt-motorcycle': 180, 'vt-atv': 200,
        'vt-boat': 450, 'vt-rv': 550
      }
    },
    { 
      auctionLocationId: 'loc-copart-vallejo-ca', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 420, 'vt-coupe': 420, 'vt-hatchback': 420, 'vt-convertible': 430, 'vt-wagon': 430,
        'vt-suv': 480, 'vt-pickup': 450, 'vt-truck': 490,
        'vt-bigsuv': 580, 'vt-van': 520,
        'vt-motorcycle': 280, 'vt-atv': 320,
        'vt-boat': 650, 'vt-rv': 800
      }
    },
    { 
      auctionLocationId: 'loc-copart-rancho-ca', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 180, 'vt-coupe': 180, 'vt-hatchback': 180, 'vt-convertible': 190, 'vt-wagon': 190,
        'vt-suv': 220, 'vt-pickup': 200, 'vt-truck': 230,
        'vt-bigsuv': 280, 'vt-van': 250,
        'vt-motorcycle': 120, 'vt-atv': 140,
        'vt-boat': 350, 'vt-rv': 450
      }
    },
    { 
      auctionLocationId: 'loc-copart-los-angeles-ca', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 120, 'vt-coupe': 120, 'vt-hatchback': 120, 'vt-convertible': 130, 'vt-wagon': 130,
        'vt-suv': 160, 'vt-pickup': 140, 'vt-truck': 170,
        'vt-bigsuv': 200, 'vt-van': 180,
        'vt-motorcycle': 80, 'vt-atv': 100,
        'vt-boat': 280, 'vt-rv': 350
      }
    },
    
    // COPART Texas to Houston Port
    { 
      auctionLocationId: 'loc-copart-houston-tx', 
      deliveryPortId: 'port-houston',
      vehiclePrices: {
        'vt-sedan': 150, 'vt-coupe': 150, 'vt-hatchback': 150, 'vt-convertible': 160, 'vt-wagon': 160,
        'vt-suv': 190, 'vt-pickup': 170, 'vt-truck': 200,
        'vt-bigsuv': 240, 'vt-van': 220,
        'vt-motorcycle': 100, 'vt-atv': 120,
        'vt-boat': 320, 'vt-rv': 400
      }
    },
    { 
      auctionLocationId: 'loc-copart-dallas-tx', 
      deliveryPortId: 'port-houston',
      vehiclePrices: {
        'vt-sedan': 320, 'vt-coupe': 320, 'vt-hatchback': 320, 'vt-convertible': 330, 'vt-wagon': 330,
        'vt-suv': 380, 'vt-pickup': 350, 'vt-truck': 390,
        'vt-bigsuv': 480, 'vt-van': 430,
        'vt-motorcycle': 220, 'vt-atv': 250,
        'vt-boat': 580, 'vt-rv': 720
      }
    },
    { 
      auctionLocationId: 'loc-copart-austin-tx', 
      deliveryPortId: 'port-houston',
      vehiclePrices: {
        'vt-sedan': 190, 'vt-coupe': 190, 'vt-hatchback': 190, 'vt-convertible': 200, 'vt-wagon': 200,
        'vt-suv': 230, 'vt-pickup': 210, 'vt-truck': 240,
        'vt-bigsuv': 290, 'vt-van': 260,
        'vt-motorcycle': 130, 'vt-atv': 150,
        'vt-boat': 380, 'vt-rv': 480
      }
    },
    
    // COPART Florida routes
    { 
      auctionLocationId: 'loc-copart-orlando-fl', 
      deliveryPortId: 'port-jacksonville',
      vehiclePrices: {
        'vt-sedan': 220, 'vt-coupe': 220, 'vt-hatchback': 220, 'vt-convertible': 230, 'vt-wagon': 230,
        'vt-suv': 270, 'vt-pickup': 250, 'vt-truck': 280,
        'vt-bigsuv': 340, 'vt-van': 310,
        'vt-motorcycle': 150, 'vt-atv': 170,
        'vt-boat': 420, 'vt-rv': 520
      }
    },
    { 
      auctionLocationId: 'loc-copart-miami-fl', 
      deliveryPortId: 'port-miami',
      vehiclePrices: {
        'vt-sedan': 150, 'vt-coupe': 150, 'vt-hatchback': 150, 'vt-convertible': 160, 'vt-wagon': 160,
        'vt-suv': 190, 'vt-pickup': 170, 'vt-truck': 200,
        'vt-bigsuv': 240, 'vt-van': 220,
        'vt-motorcycle': 100, 'vt-atv': 120,
        'vt-boat': 320, 'vt-rv': 400
      }
    },
    { 
      auctionLocationId: 'loc-copart-miami-fl', 
      deliveryPortId: 'port-jacksonville',
      vehiclePrices: {
        'vt-sedan': 380, 'vt-coupe': 380, 'vt-hatchback': 380, 'vt-convertible': 390, 'vt-wagon': 390,
        'vt-suv': 450, 'vt-pickup': 420, 'vt-truck': 460,
        'vt-bigsuv': 580, 'vt-van': 520,
        'vt-motorcycle': 260, 'vt-atv': 300,
        'vt-boat': 680, 'vt-rv': 850
      }
    },
    
    // COPART Georgia to Savannah Port
    { 
      auctionLocationId: 'loc-copart-atlanta-ga', 
      deliveryPortId: 'port-savannah',
      vehiclePrices: {
        'vt-sedan': 320, 'vt-coupe': 320, 'vt-hatchback': 320, 'vt-convertible': 330, 'vt-wagon': 330,
        'vt-suv': 380, 'vt-pickup': 350, 'vt-truck': 390,
        'vt-bigsuv': 480, 'vt-van': 430,
        'vt-motorcycle': 220, 'vt-atv': 250,
        'vt-boat': 580, 'vt-rv': 720
      }
    },
    { 
      auctionLocationId: 'loc-copart-savannah-ga', 
      deliveryPortId: 'port-savannah',
      vehiclePrices: {
        'vt-sedan': 120, 'vt-coupe': 120, 'vt-hatchback': 120, 'vt-convertible': 130, 'vt-wagon': 130,
        'vt-suv': 160, 'vt-pickup': 140, 'vt-truck': 170,
        'vt-bigsuv': 200, 'vt-van': 180,
        'vt-motorcycle': 80, 'vt-atv': 100,
        'vt-boat': 280, 'vt-rv': 350
      }
    },
    
    // COPART Northeast to NY/NJ Port
    { 
      auctionLocationId: 'loc-copart-trenton-nj', 
      deliveryPortId: 'port-ny-nj',
      vehiclePrices: {
        'vt-sedan': 160, 'vt-coupe': 160, 'vt-hatchback': 160, 'vt-convertible': 170, 'vt-wagon': 170,
        'vt-suv': 200, 'vt-pickup': 180, 'vt-truck': 210,
        'vt-bigsuv': 250, 'vt-van': 230,
        'vt-motorcycle': 110, 'vt-atv': 130,
        'vt-boat': 340, 'vt-rv': 420
      }
    },
    { 
      auctionLocationId: 'loc-copart-philadelphia-pa', 
      deliveryPortId: 'port-ny-nj',
      vehiclePrices: {
        'vt-sedan': 180, 'vt-coupe': 180, 'vt-hatchback': 180, 'vt-convertible': 190, 'vt-wagon': 190,
        'vt-suv': 220, 'vt-pickup': 200, 'vt-truck': 230,
        'vt-bigsuv': 280, 'vt-van': 250,
        'vt-motorcycle': 120, 'vt-atv': 140,
        'vt-boat': 360, 'vt-rv': 450
      }
    },
    { 
      auctionLocationId: 'loc-copart-syracuse-ny', 
      deliveryPortId: 'port-ny-nj',
      vehiclePrices: {
        'vt-sedan': 280, 'vt-coupe': 280, 'vt-hatchback': 280, 'vt-convertible': 290, 'vt-wagon': 290,
        'vt-suv': 340, 'vt-pickup': 310, 'vt-truck': 350,
        'vt-bigsuv': 420, 'vt-van': 380,
        'vt-motorcycle': 190, 'vt-atv': 220,
        'vt-boat': 520, 'vt-rv': 650
      }
    },
    
    // IAA routes
    { 
      auctionLocationId: 'loc-iaa-los-angeles-ca', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 140, 'vt-coupe': 140, 'vt-hatchback': 140, 'vt-convertible': 150, 'vt-wagon': 150,
        'vt-suv': 180, 'vt-pickup': 160, 'vt-truck': 190,
        'vt-bigsuv': 220, 'vt-van': 200,
        'vt-motorcycle': 90, 'vt-atv': 110,
        'vt-boat': 300, 'vt-rv': 380
      }
    },
    { 
      auctionLocationId: 'loc-iaa-fresno-ca', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 290, 'vt-coupe': 290, 'vt-hatchback': 290, 'vt-convertible': 300, 'vt-wagon': 300,
        'vt-suv': 350, 'vt-pickup': 320, 'vt-truck': 360,
        'vt-bigsuv': 440, 'vt-van': 400,
        'vt-motorcycle': 200, 'vt-atv': 230,
        'vt-boat': 540, 'vt-rv': 680
      }
    },
    { 
      auctionLocationId: 'loc-iaa-houston-tx', 
      deliveryPortId: 'port-houston',
      vehiclePrices: {
        'vt-sedan': 140, 'vt-coupe': 140, 'vt-hatchback': 140, 'vt-convertible': 150, 'vt-wagon': 150,
        'vt-suv': 180, 'vt-pickup': 160, 'vt-truck': 190,
        'vt-bigsuv': 220, 'vt-van': 200,
        'vt-motorcycle': 90, 'vt-atv': 110,
        'vt-boat': 300, 'vt-rv': 380
      }
    },
    { 
      auctionLocationId: 'loc-iaa-dallas-tx', 
      deliveryPortId: 'port-houston',
      vehiclePrices: {
        'vt-sedan': 310, 'vt-coupe': 310, 'vt-hatchback': 310, 'vt-convertible': 320, 'vt-wagon': 320,
        'vt-suv': 370, 'vt-pickup': 340, 'vt-truck': 380,
        'vt-bigsuv': 470, 'vt-van': 420,
        'vt-motorcycle': 210, 'vt-atv': 240,
        'vt-boat': 570, 'vt-rv': 710
      }
    },
    { 
      auctionLocationId: 'loc-iaa-orlando-fl', 
      deliveryPortId: 'port-jacksonville',
      vehiclePrices: {
        'vt-sedan': 210, 'vt-coupe': 210, 'vt-hatchback': 210, 'vt-convertible': 220, 'vt-wagon': 220,
        'vt-suv': 260, 'vt-pickup': 240, 'vt-truck': 270,
        'vt-bigsuv': 330, 'vt-van': 300,
        'vt-motorcycle': 140, 'vt-atv': 160,
        'vt-boat': 410, 'vt-rv': 510
      }
    },
    
    // Cross-country routes (much higher prices)
    { 
      auctionLocationId: 'loc-copart-los-angeles-ca', 
      deliveryPortId: 'port-ny-nj',
      vehiclePrices: {
        'vt-sedan': 1200, 'vt-coupe': 1200, 'vt-hatchback': 1200, 'vt-convertible': 1250, 'vt-wagon': 1250,
        'vt-suv': 1400, 'vt-pickup': 1350, 'vt-truck': 1450,
        'vt-bigsuv': 1700, 'vt-van': 1600,
        'vt-motorcycle': 800, 'vt-atv': 900,
        'vt-boat': 2200, 'vt-rv': 2800
      }
    },
    { 
      auctionLocationId: 'loc-copart-trenton-nj', 
      deliveryPortId: 'port-los-angeles',
      vehiclePrices: {
        'vt-sedan': 1350, 'vt-coupe': 1350, 'vt-hatchback': 1350, 'vt-convertible': 1400, 'vt-wagon': 1400,
        'vt-suv': 1600, 'vt-pickup': 1500, 'vt-truck': 1650,
        'vt-bigsuv': 1950, 'vt-van': 1800,
        'vt-motorcycle': 900, 'vt-atv': 1000,
        'vt-boat': 2500, 'vt-rv': 3200
      }
    },
  ];

  routeConfigs.forEach((config, index) => {
    // Calculate a representative base price (average of sedan/suv for display)
    const basePrice = Math.round((config.vehiclePrices['vt-sedan'] + config.vehiclePrices['vt-suv']) / 2);

    routes.push({
      id: `route-${index + 1}`,
      auctionLocationId: config.auctionLocationId,
      deliveryPortId: config.deliveryPortId,
      basePrice, // Just for display/reference
      active: true,
      vehiclePrices: config.vehiclePrices,
    });
  });

  return routes;
};

export let towingRoutes: TowingRoute[] = initializeTowingRoutes();

// Helper functions for managing the data
export const getTowingRoute = (auctionLocationId: string, deliveryPortId: string): TowingRoute | undefined => {
  return towingRoutes.find(
    route => route.auctionLocationId === auctionLocationId && route.deliveryPortId === deliveryPortId
  );
};

export const updateTowingRoute = (id: string, updates: Partial<TowingRoute>): TowingRoute | null => {
  const index = towingRoutes.findIndex(route => route.id === id);
  if (index === -1) return null;
  
  towingRoutes[index] = { ...towingRoutes[index], ...updates };
  return towingRoutes[index];
};

export const createTowingRoute = (route: Omit<TowingRoute, 'id'>): TowingRoute => {
  const newRoute = {
    ...route,
    id: `route-${Date.now()}`,
  };
  towingRoutes.push(newRoute);
  return newRoute;
};

export const deleteTowingRoute = (id: string): boolean => {
  const index = towingRoutes.findIndex(route => route.id === id);
  if (index === -1) return false;
  
  towingRoutes.splice(index, 1);
  return true;
};

export const getLocationById = (id: string): AuctionLocation | undefined => {
  return auctionLocations.find(loc => loc.id === id);
};

export const getPortById = (id: string): Port | undefined => {
  return ports.find(port => port.id === id);
};

export const getVehicleTypeById = (id: string): VehicleType | undefined => {
  return vehicleTypes.find(vt => vt.id === id);
};

// Function to update preferred port for an auction location
export const updateLocationPreferredPort = (locationId: string, portId: string | null): AuctionLocation | null => {
  const location = auctionLocations.find(loc => loc.id === locationId);
  if (!location) return null;
  
  location.preferredPortId = portId;
  return location;
};

// Function to get all routes for an auction location
export const getRoutesForLocation = (locationId: string): TowingRoute[] => {
  return towingRoutes.filter(route => route.auctionLocationId === locationId);
};

// Function to get all routes to a specific port
export const getRoutesToPort = (portId: string): TowingRoute[] => {
  return towingRoutes.filter(route => route.deliveryPortId === portId);
};