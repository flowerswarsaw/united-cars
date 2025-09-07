export interface AuctionLocation {
  id: string
  auctionHouse: 'copart' | 'iaa' | 'manheim' | 'adesa'
  state: string
  city: string
  locationName: string
  active: boolean
}

export const auctionLocations: AuctionLocation[] = [
  // Copart locations (sample - key ones)
  { id: 'copart_tx_abilene', auctionHouse: 'copart', state: 'TX', city: 'Abilene', locationName: 'Abilene', active: true },
  { id: 'copart_ca_adelanto', auctionHouse: 'copart', state: 'CA', city: 'Adelanto', locationName: 'Adelanto', active: true },
  { id: 'copart_oh_akron', auctionHouse: 'copart', state: 'OH', city: 'Akron', locationName: 'Akron', active: true },
  { id: 'copart_ny_albany', auctionHouse: 'copart', state: 'NY', city: 'Albany', locationName: 'Albany', active: true },
  { id: 'copart_nm_albuquerque', auctionHouse: 'copart', state: 'NM', city: 'Albuquerque', locationName: 'Albuquerque', active: true },
  { id: 'copart_ga_atlanta_east', auctionHouse: 'copart', state: 'GA', city: 'Atlanta', locationName: 'Atlanta East', active: true },
  { id: 'copart_ga_atlanta_south', auctionHouse: 'copart', state: 'GA', city: 'Atlanta', locationName: 'Atlanta South', active: true },
  { id: 'copart_tx_austin', auctionHouse: 'copart', state: 'TX', city: 'Austin', locationName: 'Austin', active: true },
  { id: 'copart_ca_bakersfield', auctionHouse: 'copart', state: 'CA', city: 'Bakersfield', locationName: 'Bakersfield', active: true },
  { id: 'copart_md_baltimore', auctionHouse: 'copart', state: 'MD', city: 'Baltimore', locationName: 'Baltimore', active: true },
  { id: 'copart_al_birmingham', auctionHouse: 'copart', state: 'AL', city: 'Birmingham', locationName: 'Birmingham', active: true },
  { id: 'copart_ma_boston_shirley', auctionHouse: 'copart', state: 'MA', city: 'Shirley', locationName: 'Boston - Shirley', active: true },
  { id: 'copart_co_denver', auctionHouse: 'copart', state: 'CO', city: 'Denver', locationName: 'Denver', active: true },
  { id: 'copart_mi_detroit', auctionHouse: 'copart', state: 'MI', city: 'Detroit', locationName: 'Detroit', active: true },
  { id: 'copart_tx_dallas', auctionHouse: 'copart', state: 'TX', city: 'Dallas', locationName: 'Dallas', active: true },
  { id: 'copart_tx_ft_worth', auctionHouse: 'copart', state: 'TX', city: 'Fort Worth', locationName: 'Fort Worth', active: true },
  { id: 'copart_tx_houston', auctionHouse: 'copart', state: 'TX', city: 'Houston', locationName: 'Houston', active: true },
  { id: 'copart_fl_jacksonville', auctionHouse: 'copart', state: 'FL', city: 'Jacksonville', locationName: 'Jacksonville', active: true },
  { id: 'copart_nv_las_vegas', auctionHouse: 'copart', state: 'NV', city: 'Las Vegas', locationName: 'Las Vegas', active: true },
  { id: 'copart_ca_los_angeles', auctionHouse: 'copart', state: 'CA', city: 'Los Angeles', locationName: 'Los Angeles', active: true },
  { id: 'copart_fl_miami_north', auctionHouse: 'copart', state: 'FL', city: 'Miami', locationName: 'Miami North', active: true },
  { id: 'copart_fl_miami_south', auctionHouse: 'copart', state: 'FL', city: 'Miami', locationName: 'Miami South', active: true },
  { id: 'copart_ny_new_york', auctionHouse: 'copart', state: 'NY', city: 'New York', locationName: 'New York', active: true },
  { id: 'copart_fl_orlando', auctionHouse: 'copart', state: 'FL', city: 'Orlando', locationName: 'Orlando', active: true },
  { id: 'copart_pa_philadelphia', auctionHouse: 'copart', state: 'PA', city: 'Philadelphia', locationName: 'Philadelphia', active: true },
  { id: 'copart_az_phoenix', auctionHouse: 'copart', state: 'AZ', city: 'Phoenix', locationName: 'Phoenix', active: true },
  { id: 'copart_or_portland', auctionHouse: 'copart', state: 'OR', city: 'Portland', locationName: 'Portland', active: true },
  { id: 'copart_ca_sacramento', auctionHouse: 'copart', state: 'CA', city: 'Sacramento', locationName: 'Sacramento', active: true },
  { id: 'copart_ca_san_diego', auctionHouse: 'copart', state: 'CA', city: 'San Diego', locationName: 'San Diego', active: true },
  { id: 'copart_wa_seattle', auctionHouse: 'copart', state: 'WA', city: 'Seattle', locationName: 'Seattle', active: true },
  { id: 'copart_fl_tampa', auctionHouse: 'copart', state: 'FL', city: 'Tampa', locationName: 'Tampa', active: true },

  // IAA locations (sample - key ones)
  { id: 'iaa_tx_abilene', auctionHouse: 'iaa', state: 'TX', city: 'Abilene', locationName: 'Abilene', active: true },
  { id: 'iaa_ca_ace_carson', auctionHouse: 'iaa', state: 'CA', city: 'Carson', locationName: 'Ace - Carson', active: true },
  { id: 'iaa_ca_ace_perris', auctionHouse: 'iaa', state: 'CA', city: 'Perris', locationName: 'Ace - Perris', active: true },
  { id: 'iaa_ga_atlanta', auctionHouse: 'iaa', state: 'GA', city: 'Atlanta', locationName: 'Atlanta', active: true },
  { id: 'iaa_tx_austin', auctionHouse: 'iaa', state: 'TX', city: 'Austin', locationName: 'Austin', active: true },
  { id: 'iaa_md_baltimore', auctionHouse: 'iaa', state: 'MD', city: 'Baltimore', locationName: 'Baltimore', active: true },
  { id: 'iaa_al_birmingham', auctionHouse: 'iaa', state: 'AL', city: 'Birmingham', locationName: 'Birmingham', active: true },
  { id: 'iaa_ma_boston', auctionHouse: 'iaa', state: 'MA', city: 'Boston', locationName: 'Boston', active: true },
  { id: 'iaa_ny_long_island', auctionHouse: 'iaa', state: 'NY', city: 'Long Island', locationName: 'Long Island', active: true },
  { id: 'iaa_nc_charlotte', auctionHouse: 'iaa', state: 'NC', city: 'Charlotte', locationName: 'Charlotte', active: true },
  { id: 'iaa_il_chicago_south', auctionHouse: 'iaa', state: 'IL', city: 'Chicago', locationName: 'Chicago South', active: true },
  { id: 'iaa_oh_cincinnati', auctionHouse: 'iaa', state: 'OH', city: 'Cincinnati', locationName: 'Cincinnati', active: true },
  { id: 'iaa_tx_dallas', auctionHouse: 'iaa', state: 'TX', city: 'Dallas', locationName: 'Dallas', active: true },
  { id: 'iaa_co_denver', auctionHouse: 'iaa', state: 'CO', city: 'Denver', locationName: 'Denver', active: true },
  { id: 'iaa_mi_detroit', auctionHouse: 'iaa', state: 'MI', city: 'Detroit', locationName: 'Detroit', active: true },
  { id: 'iaa_tx_houston', auctionHouse: 'iaa', state: 'TX', city: 'Houston', locationName: 'Houston', active: true },
  { id: 'iaa_in_indianapolis', auctionHouse: 'iaa', state: 'IN', city: 'Indianapolis', locationName: 'Indianapolis', active: true },
  { id: 'iaa_fl_jacksonville', auctionHouse: 'iaa', state: 'FL', city: 'Jacksonville', locationName: 'Jacksonville', active: true },
  { id: 'ks_kansas_city', auctionHouse: 'iaa', state: 'KS', city: 'Kansas City', locationName: 'Kansas City', active: true },
  { id: 'iaa_nv_las_vegas', auctionHouse: 'iaa', state: 'NV', city: 'Las Vegas', locationName: 'Las Vegas', active: true },
  { id: 'iaa_ca_los_angeles', auctionHouse: 'iaa', state: 'CA', city: 'Los Angeles', locationName: 'Los Angeles', active: true },
  { id: 'iaa_tn_memphis', auctionHouse: 'iaa', state: 'TN', city: 'Memphis', locationName: 'Memphis', active: true },
  { id: 'iaa_fl_miami', auctionHouse: 'iaa', state: 'FL', city: 'Miami', locationName: 'Miami', active: true },
  { id: 'iaa_wi_milwaukee', auctionHouse: 'iaa', state: 'WI', city: 'Milwaukee', locationName: 'Milwaukee', active: true },
  { id: 'iaa_mn_minneapolis', auctionHouse: 'iaa', state: 'MN', city: 'Minneapolis', locationName: 'Minneapolis', active: true },
  { id: 'iaa_tn_nashville', auctionHouse: 'iaa', state: 'TN', city: 'Nashville', locationName: 'Nashville', active: true },
  { id: 'iaa_la_new_orleans', auctionHouse: 'iaa', state: 'LA', city: 'New Orleans', locationName: 'New Orleans', active: true },
  { id: 'iaa_fl_orlando', auctionHouse: 'iaa', state: 'FL', city: 'Orlando', locationName: 'Orlando', active: true },
  { id: 'iaa_pa_philadelphia', auctionHouse: 'iaa', state: 'PA', city: 'Philadelphia', locationName: 'Philadelphia', active: true },
  { id: 'iaa_az_phoenix', auctionHouse: 'iaa', state: 'AZ', city: 'Phoenix', locationName: 'Phoenix', active: true },
  { id: 'iaa_or_portland', auctionHouse: 'iaa', state: 'OR', city: 'Portland', locationName: 'Portland', active: true },
  { id: 'iaa_nc_raleigh', auctionHouse: 'iaa', state: 'NC', city: 'Raleigh', locationName: 'Raleigh', active: true },
  { id: 'iaa_ca_sacramento', auctionHouse: 'iaa', state: 'CA', city: 'Sacramento', locationName: 'Sacramento', active: true },
  { id: 'iaa_ut_salt_lake_city', auctionHouse: 'iaa', state: 'UT', city: 'Salt Lake City', locationName: 'Salt Lake City', active: true },
  { id: 'iaa_tx_san_antonio', auctionHouse: 'iaa', state: 'TX', city: 'San Antonio', locationName: 'San Antonio', active: true },
  { id: 'iaa_ca_san_diego', auctionHouse: 'iaa', state: 'CA', city: 'San Diego', locationName: 'San Diego', active: true },
  { id: 'iaa_wa_seattle', auctionHouse: 'iaa', state: 'WA', city: 'Seattle', locationName: 'Seattle', active: true },
  { id: 'iaa_mo_st_louis', auctionHouse: 'iaa', state: 'MO', city: 'St. Louis', locationName: 'St. Louis', active: true },
  { id: 'iaa_fl_tampa', auctionHouse: 'iaa', state: 'FL', city: 'Tampa', locationName: 'Tampa', active: true },

  // Manheim locations (major ones)
  { id: 'manheim_ga_atlanta', auctionHouse: 'manheim', state: 'GA', city: 'Atlanta', locationName: 'Atlanta', active: true },
  { id: 'manheim_ca_riverside', auctionHouse: 'manheim', state: 'CA', city: 'Riverside', locationName: 'Riverside', active: true },
  { id: 'manheim_tx_dallas', auctionHouse: 'manheim', state: 'TX', city: 'Dallas', locationName: 'Dallas', active: true },
  { id: 'manheim_fl_orlando', auctionHouse: 'manheim', state: 'FL', city: 'Orlando', locationName: 'Orlando', active: true },
  { id: 'manheim_pa_pennsylvania', auctionHouse: 'manheim', state: 'PA', city: 'Manheim', locationName: 'Pennsylvania', active: true },
  { id: 'manheim_ny_newburgh', auctionHouse: 'manheim', state: 'NY', city: 'Newburgh', locationName: 'New York', active: true },

  // ADESA locations (major ones)
  { id: 'adesa_ga_atlanta', auctionHouse: 'adesa', state: 'GA', city: 'Atlanta', locationName: 'Atlanta', active: true },
  { id: 'adesa_ca_los_angeles', auctionHouse: 'adesa', state: 'CA', city: 'Los Angeles', locationName: 'Los Angeles', active: true },
  { id: 'adesa_tx_dallas', auctionHouse: 'adesa', state: 'TX', city: 'Dallas', locationName: 'Dallas', active: true },
  { id: 'adesa_fl_orlando', auctionHouse: 'adesa', state: 'FL', city: 'Orlando', locationName: 'Orlando', active: true }
]

export const shippingPorts = [
  { id: 'ny_port', name: 'New York Port', city: 'New York', state: 'NY' },
  { id: 'nj_port_newark', name: 'Port Newark', city: 'Newark', state: 'NJ' },
  { id: 'ga_savannah', name: 'Savannah Port', city: 'Savannah', state: 'GA' },
  { id: 'fl_jacksonville', name: 'Jacksonville Port', city: 'Jacksonville', state: 'FL' },
  { id: 'tx_houston', name: 'Houston Port', city: 'Houston', state: 'TX' },
  { id: 'ca_los_angeles', name: 'Los Angeles Port', city: 'Los Angeles', state: 'CA' },
  { id: 'ca_long_beach', name: 'Long Beach Port', city: 'Long Beach', state: 'CA' },
  { id: 'wa_seattle', name: 'Seattle Port', city: 'Seattle', state: 'WA' },
  { id: 'wa_tacoma', name: 'Tacoma Port', city: 'Tacoma', state: 'WA' },
  { id: 'md_baltimore', name: 'Baltimore Port', city: 'Baltimore', state: 'MD' }
]

export const vehicleTypes = [
  { id: 'sedan', name: 'Sedan' },
  { id: 'suv', name: 'SUV' },
  { id: 'truck', name: 'Truck' },
  { id: 'coupe', name: 'Coupe' },
  { id: 'hatchback', name: 'Hatchback' },
  { id: 'convertible', name: 'Convertible' },
  { id: 'wagon', name: 'Wagon' },
  { id: 'van', name: 'Van' },
  { id: 'motorcycle', name: 'Motorcycle' }
]

export const getAuctionHouses = () => {
  return [...new Set(auctionLocations.map(loc => loc.auctionHouse))]
}

export const getLocationsByAuctionHouse = (auctionHouse: string) => {
  return auctionLocations
    .filter(loc => loc.auctionHouse === auctionHouse && loc.active)
    .sort((a, b) => a.locationName.localeCompare(b.locationName))
}