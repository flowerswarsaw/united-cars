export interface Region {
  code: string;
  name: string;
  cities?: string[];
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2 country code
  name: string;
  regions?: Region[];
}

export interface CountryRegionData {
  countries: Country[];
}

// Helper function to get region display name from code
export const getRegionDisplayName = (countryCode: string, regionCode: string): string => {
  if (!countryCode || !regionCode) return regionCode || '';

  const country = COUNTRIES_REGIONS.countries.find(c => c.code === countryCode);
  if (!country?.regions) return regionCode;

  const region = country.regions.find(r => r.code === regionCode);
  return region ? region.name : regionCode;
};

// Helper function to get cities by country and region code
export const getCitiesByRegion = (countryCode: string, regionCode: string): string[] => {
  if (!countryCode || !regionCode) return [];

  const country = COUNTRIES_REGIONS.countries.find(c => c.code === countryCode);
  if (!country?.regions) return [];

  const region = country.regions.find(r => r.code === regionCode);
  return region?.cities || [];
};

// Helper function to check if a region has predefined cities
export const hasCities = (countryCode: string, regionCode: string): boolean => {
  const cities = getCitiesByRegion(countryCode, regionCode);
  return cities.length > 0;
};

// Comprehensive country and region data
export const COUNTRIES_REGIONS: CountryRegionData = {
  countries: [
    {
      code: 'US',
      name: 'United States',
      regions: [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona', cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise'] },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'] },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida', cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral'] },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois', cities: ['Chicago', 'Aurora', 'Joliet', 'Naperville', 'Rockford', 'Elgin', 'Peoria', 'Springfield', 'Waukegan', 'Cicero'] },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri', cities: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'Blue Springs'] },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey', cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton', 'Matawan'] },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York', cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica'] },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania', cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Manheim'] },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas', cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock'] },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' },
      ],
    },
    {
      code: 'PL',
      name: 'Poland',
      regions: [
        { code: 'lower-silesian', name: 'Lower Silesian', cities: ['Wrocław', 'Wałbrzych', 'Legnica', 'Jelenia Góra', 'Lubin', 'Głogów', 'Świdnica', 'Bolesławiec', 'Oleśnica', 'Kłodzko'] },
        { code: 'kuyavian-pomeranian', name: 'Kuyavian-Pomeranian' },
        { code: 'lublin', name: 'Lublin' },
        { code: 'lubusz', name: 'Lubusz' },
        { code: 'lodz', name: 'Łódź' },
        { code: 'lesser-poland', name: 'Lesser Poland' },
        { code: 'masovian', name: 'Masovian', cities: ['Warsaw', 'Radom', 'Płock', 'Siedlce', 'Pruszków', 'Legionowo', 'Ostrołęka', 'Piaseczno', 'Piastów', 'Marki'] },
        { code: 'opole', name: 'Opole' },
        { code: 'subcarpathian', name: 'Subcarpathian' },
        { code: 'podlaskie', name: 'Podlaskie' },
        { code: 'pomeranian', name: 'Pomeranian' },
        { code: 'silesian', name: 'Silesian', cities: ['Katowice', 'Częstochowa', 'Sosnowiec', 'Gliwice', 'Zabrze', 'Bytom', 'Bielsko-Biała', 'Ruda Śląska', 'Rybnik', 'Tychy'] },
        { code: 'holy-cross', name: 'Holy Cross' },
        { code: 'warmian-masurian', name: 'Warmian-Masurian' },
        { code: 'greater-poland', name: 'Greater Poland', cities: ['Poznań', 'Kalisz', 'Piła', 'Konin', 'Ostrów Wielkopolski', 'Gniezno', 'Leszno', 'Śrem', 'Turek', 'Jarocin'] },
        { code: 'west-pomeranian', name: 'West Pomeranian' },
      ],
    },
    {
      code: 'DE',
      name: 'Germany',
      regions: [
        { code: 'BW', name: 'Baden-Württemberg' },
        { code: 'BY', name: 'Bavaria' },
        { code: 'BE', name: 'Berlin' },
        { code: 'BB', name: 'Brandenburg' },
        { code: 'HB', name: 'Bremen' },
        { code: 'HH', name: 'Hamburg' },
        { code: 'HE', name: 'Hesse' },
        { code: 'MV', name: 'Mecklenburg-Vorpommern' },
        { code: 'NI', name: 'Lower Saxony' },
        { code: 'NW', name: 'North Rhine-Westphalia' },
        { code: 'RP', name: 'Rhineland-Palatinate' },
        { code: 'SL', name: 'Saarland' },
        { code: 'SN', name: 'Saxony' },
        { code: 'ST', name: 'Saxony-Anhalt' },
        { code: 'SH', name: 'Schleswig-Holstein' },
        { code: 'TH', name: 'Thuringia' },
      ],
    },
    {
      code: 'CA',
      name: 'Canada',
      regions: [
        { code: 'AB', name: 'Alberta' },
        { code: 'BC', name: 'British Columbia' },
        { code: 'MB', name: 'Manitoba' },
        { code: 'NB', name: 'New Brunswick' },
        { code: 'NL', name: 'Newfoundland and Labrador' },
        { code: 'NS', name: 'Nova Scotia' },
        { code: 'ON', name: 'Ontario' },
        { code: 'PE', name: 'Prince Edward Island' },
        { code: 'QC', name: 'Quebec' },
        { code: 'SK', name: 'Saskatchewan' },
        { code: 'NT', name: 'Northwest Territories' },
        { code: 'NU', name: 'Nunavut' },
        { code: 'YT', name: 'Yukon' },
      ],
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      regions: [
        { code: 'ENG', name: 'England' },
        { code: 'SCT', name: 'Scotland' },
        { code: 'WLS', name: 'Wales' },
        { code: 'NIR', name: 'Northern Ireland' },
      ],
    },
    {
      code: 'FR',
      name: 'France',
      regions: [
        { code: 'ARA', name: 'Auvergne-Rhône-Alpes' },
        { code: 'BFC', name: 'Bourgogne-Franche-Comté' },
        { code: 'BRE', name: 'Brittany' },
        { code: 'CVL', name: 'Centre-Val de Loire' },
        { code: 'COR', name: 'Corsica' },
        { code: 'GES', name: 'Grand Est' },
        { code: 'HDF', name: 'Hauts-de-France' },
        { code: 'IDF', name: 'Île-de-France' },
        { code: 'NOR', name: 'Normandy' },
        { code: 'NAQ', name: 'Nouvelle-Aquitaine' },
        { code: 'OCC', name: 'Occitania' },
        { code: 'PDL', name: 'Pays de la Loire' },
        { code: 'PAC', name: 'Provence-Alpes-Côte d\'Azur' },
      ],
    },
    {
      code: 'AU',
      name: 'Australia',
      regions: [
        { code: 'NSW', name: 'New South Wales' },
        { code: 'QLD', name: 'Queensland' },
        { code: 'SA', name: 'South Australia' },
        { code: 'TAS', name: 'Tasmania' },
        { code: 'VIC', name: 'Victoria' },
        { code: 'WA', name: 'Western Australia' },
        { code: 'ACT', name: 'Australian Capital Territory' },
        { code: 'NT', name: 'Northern Territory' },
      ],
    },
    // Countries without predefined regions - users can enter custom text
    { code: 'AD', name: 'Andorra' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AI', name: 'Anguilla' },
    { code: 'AL', name: 'Albania' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AO', name: 'Angola' },
    { code: 'AQ', name: 'Antarctica' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AS', name: 'American Samoa' },
    { code: 'AT', name: 'Austria' },
    { code: 'AW', name: 'Aruba' },
    { code: 'AX', name: 'Åland Islands' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BI', name: 'Burundi' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BL', name: 'Saint Barthélemy' },
    { code: 'BM', name: 'Bermuda' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BQ', name: 'Caribbean Netherlands' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BV', name: 'Bouvet Island' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BZ', name: 'Belize' },
    { code: 'CC', name: 'Cocos Islands' },
    { code: 'CD', name: 'Democratic Republic of the Congo' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'CG', name: 'Republic of the Congo' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'CI', name: 'Ivory Coast' },
    { code: 'CK', name: 'Cook Islands' },
    { code: 'CL', name: 'Chile' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CV', name: 'Cape Verde' },
    { code: 'CW', name: 'Curaçao' },
    { code: 'CX', name: 'Christmas Island' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EE', name: 'Estonia' },
    { code: 'EG', name: 'Egypt' },
    { code: 'EH', name: 'Western Sahara' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'ES', name: 'Spain' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FI', name: 'Finland' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FK', name: 'Falkland Islands' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'FO', name: 'Faroe Islands' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GE', name: 'Georgia' },
    { code: 'GF', name: 'French Guiana' },
    { code: 'GG', name: 'Guernsey' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GI', name: 'Gibraltar' },
    { code: 'GL', name: 'Greenland' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'GR', name: 'Greece' },
    { code: 'GS', name: 'South Georgia' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GU', name: 'Guam' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HM', name: 'Heard Island' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HR', name: 'Croatia' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HU', name: 'Hungary' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IM', name: 'Isle of Man' },
    { code: 'IN', name: 'India' },
    { code: 'IO', name: 'British Indian Ocean Territory' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IR', name: 'Iran' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IT', name: 'Italy' },
    { code: 'JE', name: 'Jersey' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JO', name: 'Jordan' },
    { code: 'JP', name: 'Japan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KM', name: 'Comoros' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'KP', name: 'North Korea' },
    { code: 'KR', name: 'South Korea' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KY', name: 'Cayman Islands' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LY', name: 'Libya' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MD', name: 'Moldova' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MF', name: 'Saint Martin' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'ML', name: 'Mali' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'MO', name: 'Macao' },
    { code: 'MP', name: 'Northern Mariana Islands' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MS', name: 'Montserrat' },
    { code: 'MT', name: 'Malta' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MV', name: 'Maldives' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MX', name: 'Mexico' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NC', name: 'New Caledonia' },
    { code: 'NE', name: 'Niger' },
    { code: 'NF', name: 'Norfolk Island' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NO', name: 'Norway' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NU', name: 'Niue' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'OM', name: 'Oman' },
    { code: 'PA', name: 'Panama' },
    { code: 'PE', name: 'Peru' },
    { code: 'PF', name: 'French Polynesia' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PM', name: 'Saint Pierre and Miquelon' },
    { code: 'PN', name: 'Pitcairn' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'PS', name: 'Palestine' },
    { code: 'PT', name: 'Portugal' },
    { code: 'PW', name: 'Palau' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RE', name: 'Réunion' },
    { code: 'RO', name: 'Romania' },
    { code: 'RS', name: 'Serbia' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SE', name: 'Sweden' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SH', name: 'Saint Helena' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SJ', name: 'Svalbard and Jan Mayen' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SM', name: 'San Marino' },
    { code: 'SN', name: 'Senegal' },
    { code: 'SO', name: 'Somalia' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ST', name: 'São Tomé and Príncipe' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'SX', name: 'Sint Maarten' },
    { code: 'SY', name: 'Syria' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'TC', name: 'Turks and Caicos Islands' },
    { code: 'TD', name: 'Chad' },
    { code: 'TF', name: 'French Southern Territories' },
    { code: 'TG', name: 'Togo' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TK', name: 'Tokelau' },
    { code: 'TL', name: 'East Timor' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UM', name: 'United States Minor Outlying Islands' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VG', name: 'British Virgin Islands' },
    { code: 'VI', name: 'United States Virgin Islands' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'WF', name: 'Wallis and Futuna' },
    { code: 'WS', name: 'Samoa' },
    { code: 'YE', name: 'Yemen' },
    { code: 'YT', name: 'Mayotte' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },
  ],
};

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES_REGIONS.countries.find(country => country.code === code);
}

export function getRegionsByCountryCode(countryCode: string): Region[] {
  const country = getCountryByCode(countryCode);
  return country?.regions || [];
}

export function getRegionByCode(countryCode: string, regionCode: string): Region | undefined {
  const regions = getRegionsByCountryCode(countryCode);
  return regions.find(region => region.code === regionCode);
}

export function hasRegions(countryCode: string): boolean {
  const country = getCountryByCode(countryCode);
  return !!(country?.regions && country.regions.length > 0);
}

export function searchCountries(query: string): Country[] {
  if (!query.trim()) return COUNTRIES_REGIONS.countries;

  const searchTerm = query.toLowerCase().trim();
  return COUNTRIES_REGIONS.countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm)
  );
}

export function searchRegions(countryCode: string, query: string): Region[] {
  const regions = getRegionsByCountryCode(countryCode);
  if (!query.trim()) return regions;

  const searchTerm = query.toLowerCase().trim();
  return regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm) ||
    region.code.toLowerCase().includes(searchTerm)
  );
}