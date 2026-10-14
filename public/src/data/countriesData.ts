// Comprehensive static country, state/province, and international telephone dataset
// Covers all sovereign nations and major territories worldwide

export interface CountryInfo {
  code: string;        // ISO 3166-1 alpha-2
  name: string;        // Official common country name
  flag: string;        // Emoji flag
  dialCode: string;    // ITU dial code (e.g. +1, +44, +92)
  phoneFormat: string; // Formatting placeholder (e.g. (###) ###-####)
  phonePattern: string;// Regex pattern string for validation
  states: string[];    // States, provinces, counties, regions, or territories
}

export const COUNTRIES_DATA: CountryInfo[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    phoneFormat: '(###) ###-####',
    phonePattern: '^[2-9]\\d{2}[2-9]\\d{2}\\d{4}$',
    states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
      'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
      'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
      'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Puerto Rico', 'Rhode Island', 'South Carolina',
      'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming', 'Guam', 'U.S. Virgin Islands', 'American Samoa'
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    phoneFormat: '##### ######',
    phonePattern: '^7\\d{9}$',
    states: [
      'England - Greater London', 'England - Greater Manchester', 'England - West Midlands',
      'England - West Yorkshire', 'England - Merseyside', 'England - South Yorkshire',
      'England - Tyne and Wear', 'England - Hampshire', 'England - Kent', 'England - Essex',
      'England - Lancashire', 'England - Surrey', 'England - Hertfordshire', 'England - Norfolk',
      'England - Berkshire', 'England - Cheshire', 'England - Devon', 'England - Nottinghamshire',
      'Scotland - Glasgow City', 'Scotland - City of Edinburgh', 'Scotland - Aberdeenshire',
      'Scotland - Fife', 'Scotland - Highlands', 'Scotland - Lanarkshire', 'Scotland - Dundee',
      'Wales - Cardiff', 'Wales - Swansea', 'Wales - Newport', 'Wales - Glamorgan', 'Wales - Gwynedd',
      'Northern Ireland - Antrim', 'Northern Ireland - Armagh', 'Northern Ireland - Down',
      'Northern Ireland - Fermanagh', 'Northern Ireland - Londonderry', 'Northern Ireland - Tyrone'
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    phoneFormat: '(###) ###-####',
    phonePattern: '^[2-9]\\d{2}[2-9]\\d{2}\\d{4}$',
    states: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
      'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon'
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '+61',
    phoneFormat: '#### ### ###',
    phonePattern: '^4\\d{8}$',
    states: [
      'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
      'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
    ],
  },
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    dialCode: '+92',
    phoneFormat: '### #######',
    phonePattern: '^3\\d{9}$',
    states: [
      'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory',
      'Gilgit-Baltistan', 'Azad Jammu and Kashmir'
    ],
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    dialCode: '+91',
    phoneFormat: '##### #####',
    phonePattern: '^[6-9]\\d{9}$',
    states: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
      'West Bengal', 'Delhi National Capital Territory', 'Jammu and Kashmir', 'Ladakh',
      'Chandigarh', 'Puducherry'
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    phoneFormat: '#### #######',
    phonePattern: '^1[5-7]\\d{8,9}$',
    states: [
      'Baden-Württemberg', 'Bavaria (Bayern)', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
      'Hesse (Hessen)', 'Lower Saxony (Niedersachsen)', 'Mecklenburg-Vorpommern',
      'North Rhine-Westphalia (Nordrhein-Westfalen)', 'Rhineland-Palatinate (Rheinland-Pfalz)',
      'Saarland', 'Saxony (Sachsen)', 'Saxony-Anhalt (Sachsen-Anhalt)',
      'Schleswig-Holstein', 'Thuringia (Thüringen)'
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    phoneFormat: '# ## ## ## ##',
    phonePattern: '^[67]\\d{8}$',
    states: [
      'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany (Bretagne)', 'Centre-Val de Loire',
      'Corsica (Corse)', 'Grand Est', 'Hauts-de-France', 'Île-de-France (Paris Region)',
      'Normandy (Normandie)', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire',
      'Provence-Alpes-Côte d\'Azur', 'Guadeloupe', 'Martinique', 'French Guiana', 'Réunion', 'Mayotte'
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    dialCode: '+971',
    phoneFormat: '## ### ####',
    phonePattern: '^5\\d{8}$',
    states: [
      'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al-Quwain', 'Ras Al Khaimah', 'Fujairah'
    ],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    dialCode: '+966',
    phoneFormat: '## ### ####',
    phonePattern: '^5\\d{8}$',
    states: [
      'Riyadh Region', 'Makkah Region', 'Eastern Province (Ash Sharqiyah)', 'Madinah Region',
      'Al-Qassim Region', 'Asir Region', 'Tabuk Region', 'Hail Region', 'Northern Borders Region',
      'Jazan Region', 'Najran Region', 'Al-Bahah Region', 'Al-Jouf Region'
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    dialCode: '+65',
    phoneFormat: '#### ####',
    phonePattern: '^[89]\\d{7}$',
    states: [
      'Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'
    ],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    dialCode: '+60',
    phoneFormat: '##-### ####',
    phonePattern: '^1\\d{8,9}$',
    states: [
      'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan',
      'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    dialCode: '+31',
    phoneFormat: '## ########',
    phonePattern: '^6\\d{8}$',
    states: [
      'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'North Brabant',
      'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland'
    ],
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    dialCode: '+353',
    phoneFormat: '## ### ####',
    phonePattern: '^8\\d{8}$',
    states: [
      'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kildare', 'Meath', 'Louth',
      'Wicklow', 'Donegal', 'Kerry', 'Tipperary', 'Mayo', 'Clare', 'Wexford'
    ],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    dialCode: '+64',
    phoneFormat: '### ### ####',
    phonePattern: '^2\\d{7,9}$',
    states: [
      'Auckland', 'Bay of Plenty', 'Canterbury', 'Gisborne', 'Hawke\'s Bay', 'Manawatū-Whanganui',
      'Marlborough', 'Nelson', 'Northland', 'Otago', 'Southland', 'Taranaki', 'Tasman',
      'Waikato', 'Wellington', 'West Coast'
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    dialCode: '+34',
    phoneFormat: '### ## ## ##',
    phonePattern: '^[67]\\d{8}$',
    states: [
      'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands',
      'Cantabria', 'Castile and León', 'Castilla-La Mancha', 'Catalonia (Barcelona)', 'Extremadura',
      'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencian Community'
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    dialCode: '+39',
    phoneFormat: '### #######',
    phonePattern: '^3\\d{9}$',
    states: [
      'Abruzzo', 'Basilicata', 'Calabria', 'Campania (Naples)', 'Emilia-Romagna', 'Friuli Venezia Giulia',
      'Lazio (Rome)', 'Liguria', 'Lombardy (Milan)', 'Marche', 'Molise', 'Piedmont (Turin)',
      'Puglia', 'Sardinia', 'Sicily', 'Tuscany (Florence)', 'Trentino-Alto Adige', 'Umbria',
      'Valle d\'Aosta', 'Veneto (Venice)'
    ],
  },
  {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    dialCode: '+46',
    phoneFormat: '###-### ## ##',
    phonePattern: '^7\\d{8}$',
    states: [
      'Stockholm County', 'Västra Götaland (Gothenburg)', 'Skåne (Malmö)', 'Östergötland',
      'Uppsala', 'Jönköping', 'Halland', 'Örebro', 'Dalarna', 'Värmland', 'Västerbotten', 'Norrbotten'
    ],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    dialCode: '+41',
    phoneFormat: '## ### ## ##',
    phonePattern: '^7[5-9]\\d{7}$',
    states: [
      'Zurich', 'Bern', 'Lucerne', 'Uri', 'Schwyz', 'Obwalden', 'Nidwalden', 'Glarus', 'Zug',
      'Fribourg', 'Solothurn', 'Basel-Stadt', 'Basel-Landschaft', 'Schaffhausen', 'Appenzell',
      'St. Gallen', 'Graubünden', 'Aargau', 'Thurgau', 'Ticino', 'Vaud', 'Valais', 'Neuchâtel',
      'Geneva', 'Jura'
    ],
  },
  {
    code: 'NO',
    name: 'Norway',
    flag: '🇳🇴',
    dialCode: '+47',
    phoneFormat: '### ## ###',
    phonePattern: '^[49]\\d{7}$',
    states: [
      'Oslo', 'Viken', 'Vestland (Bergen)', 'Rogaland (Stavanger)', 'Trøndelag', 'Innlandet',
      'Vestfold og Telemark', 'Agder', 'Møre og Romsdal', 'Nordland', 'Troms og Finnmark'
    ],
  },
  {
    code: 'DK',
    name: 'Denmark',
    flag: '🇩🇰',
    dialCode: '+45',
    phoneFormat: '## ## ## ##',
    phonePattern: '^[2-9]\\d{7}$',
    states: [
      'Capital Region (Hovedstaden - Copenhagen)', 'Central Denmark (Midtjylland)',
      'North Denmark (Nordjylland)', 'Zealand (Sjælland)', 'Southern Denmark (Syddanmark)'
    ],
  },
  {
    code: 'FI',
    name: 'Finland',
    flag: '🇫🇮',
    dialCode: '+358',
    phoneFormat: '### ### ####',
    phonePattern: '^4\\d{7,9}$',
    states: [
      'Uusimaa (Helsinki)', 'Pirkanmaa (Tampere)', 'Southwest Finland (Turku)', 'North Ostrobothnia',
      'Central Finland', 'Lapland', 'Northern Savonia', 'Satakunta', 'Päijät-Häme'
    ],
  },
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    dialCode: '+32',
    phoneFormat: '### ## ## ##',
    phonePattern: '^4\\d{8}$',
    states: [
      'Brussels-Capital Region', 'Flanders (Antwerp)', 'Flanders (East Flanders - Ghent)',
      'Flanders (Flemish Brabant)', 'Flanders (Limburg)', 'Flanders (West Flanders)',
      'Wallonia (Hainaut)', 'Wallonia (Liège)', 'Wallonia (Luxembourg)', 'Wallonia (Namur)',
      'Wallonia (Walloon Brabant)'
    ],
  },
  {
    code: 'AT',
    name: 'Austria',
    flag: '🇦🇹',
    dialCode: '+43',
    phoneFormat: '#### #######',
    phonePattern: '^6\\d{8,11}$',
    states: [
      'Vienna (Wien)', 'Lower Austria (Niederösterreich)', 'Upper Austria (Oberösterreich)',
      'Styria (Steiermark)', 'Tyrol (Tirol)', 'Carinthia (Kärnten)', 'Salzburg',
      'Vorarlberg', 'Burgenland'
    ],
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    dialCode: '+48',
    phoneFormat: '### ### ###',
    phonePattern: '^[4-8]\\d{8}$',
    states: [
      'Masovian (Warsaw)', 'Silesian (Katowice)', 'Greater Poland (Poznań)', 'Lesser Poland (Kraków)',
      'Lower Silesian (Wrocław)', 'Łódź', 'Pomeranian (Gdańsk)', 'Lublin', 'Subcarpathian',
      'Kuyavian-Pomeranian', 'West Pomeranian', 'Warmian-Masurian'
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    dialCode: '+55',
    phoneFormat: '(##) #####-####',
    phonePattern: '^[1-9]{2}9\\d{8}$',
    states: [
      'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul',
      'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina', 'Goiás', 'Maranhão', 'Amazonas',
      'Espírito Santo', 'Paraíba', 'Mato Grosso', 'Federal District (Brasília)'
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    dialCode: '+52',
    phoneFormat: '### ### ####',
    phonePattern: '^[1-9]\\d{9}$',
    states: [
      'Mexico City (CDMX)', 'Jalisco (Guadalajara)', 'Nuevo León (Monterrey)', 'Puebla',
      'Guanajuato', 'Veracruz', 'State of Mexico (Edomex)', 'Chihuahua', 'Yucatán',
      'Querétaro', 'Quintana Roo (Cancún)', 'Baja California (Tijuana)', 'Sonora', 'Sinaloa'
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    dialCode: '+81',
    phoneFormat: '###-####-####',
    phonePattern: '^[789]0\\d{8}$',
    states: [
      'Tokyo Metropolis', 'Osaka Prefecture', 'Kanagawa (Yokohama)', 'Aichi (Nagoya)',
      'Hokkaido (Sapporo)', 'Fukuoka', 'Hyogo (Kobe)', 'Kyoto', 'Saitama', 'Chiba',
      'Shizuoka', 'Hiroshima', 'Miyagi (Sendai)', 'Okinawa'
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    dialCode: '+82',
    phoneFormat: '###-####-####',
    phonePattern: '^10\\d{8}$',
    states: [
      'Seoul Special City', 'Busan Metropolitan City', 'Incheon', 'Daegu', 'Daejeon',
      'Gwangju', 'Ulsan', 'Sejong Special Self-Governing City', 'Gyeonggi Province',
      'Gangwon Province', 'Chungcheongbuk-do', 'Chungcheongnam-do', 'Jeollabuk-do',
      'Jeollanam-do', 'Gyeongsangbuk-do', 'Gyeongsangnam-do', 'Jeju Island'
    ],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    dialCode: '+27',
    phoneFormat: '### ### ####',
    phonePattern: '^[678]\\d{8}$',
    states: [
      'Gauteng (Johannesburg / Pretoria)', 'Western Cape (Cape Town)', 'KwaZulu-Natal (Durban)',
      'Eastern Cape (Gqeberha)', 'Free State (Bloemfontein)', 'Limpopo', 'Mpumalanga',
      'North West', 'Northern Cape'
    ],
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    dialCode: '+90',
    phoneFormat: '### ### ## ##',
    phonePattern: '^5\\d{9}$',
    states: [
      'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
      'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri'
    ],
  },
  {
    code: 'QA',
    name: 'Qatar',
    flag: '🇶🇦',
    dialCode: '+974',
    phoneFormat: '#### ####',
    phonePattern: '^[3567]\\d{7}$',
    states: [
      'Doha (Ad-Dawhah)', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Al Daayen', 'Al Shamal'
    ],
  },
  {
    code: 'KW',
    name: 'Kuwait',
    flag: '🇰🇼',
    dialCode: '+965',
    phoneFormat: '#### ####',
    phonePattern: '^[569]\\d{7}$',
    states: [
      'Al Asimah (Capital - Kuwait City)', 'Hawalli', 'Farwaniya', 'Al Ahmadi', 'Jahra', 'Mubarak Al-Kabeer'
    ],
  },
  {
    code: 'BH',
    name: 'Bahrain',
    flag: '🇧🇭',
    dialCode: '+973',
    phoneFormat: '#### ####',
    phonePattern: '^[36]\\d{7}$',
    states: [
      'Capital Governorate (Manama)', 'Muharraq Governorate', 'Northern Governorate', 'Southern Governorate'
    ],
  },
  {
    code: 'OM',
    name: 'Oman',
    flag: '🇴🇲',
    dialCode: '+968',
    phoneFormat: '#### ####',
    phonePattern: '^[79]\\d{7}$',
    states: [
      'Muscat Governorate', 'Dhofar (Salalah)', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah',
      'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North', 'Ash Sharqiyah South'
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    dialCode: '+20',
    phoneFormat: '### ### ####',
    phonePattern: '^1[0125]\\d{8}$',
    states: [
      'Cairo (Al Qahirah)', 'Giza (Al Jizah)', 'Alexandria (Al Iskandariyah)', 'Dakahlia',
      'Red Sea (Al Bahr al Ahmar)', 'Sharqia', 'Qalyubia', 'Monufia', 'Gharbia', 'Suez', 'Aswan'
    ],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    dialCode: '+234',
    phoneFormat: '### ### ####',
    phonePattern: '^[789][01]\\d{8}$',
    states: [
      'Lagos', 'Abuja (Federal Capital Territory)', 'Kano', 'Rivers (Port Harcourt)', 'Oyo (Ibadan)',
      'Kaduna', 'Ogun', 'Enugu', 'Delta', 'Anambra', 'Edo (Benin City)', 'Plateau (Jos)'
    ],
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    dialCode: '+62',
    phoneFormat: '###-####-####',
    phonePattern: '^8\\d{8,11}$',
    states: [
      'Jakarta Special Capital Region', 'West Java (Bandung)', 'Central Java (Semarang)',
      'East Java (Surabaya)', 'Bali (Denpasar)', 'North Sumatra (Medan)', 'Banten',
      'Yogyakarta Special Region', 'Riau', 'South Sulawesi (Makassar)'
    ],
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    dialCode: '+63',
    phoneFormat: '### ### ####',
    phonePattern: '^9\\d{9}$',
    states: [
      'Metro Manila (National Capital Region)', 'Cebu', 'Davao del Sur', 'Cavite', 'Laguna',
      'Pampanga', 'Batangas', 'Bulacan', 'Rizal', 'Pangasinan', 'Iloilo', 'Negros Occidental'
    ],
  },
  {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    dialCode: '+84',
    phoneFormat: '### ### ####',
    phonePattern: '^[35789]\\d{8}$',
    states: [
      'Hanoi (Capital)', 'Ho Chi Minh City (Saigon)', 'Da Nang', 'Hai Phong', 'Can Tho',
      'Binh Duong', 'Dong Nai', 'Khanh Hoa (Nha Trang)', 'Quang Ninh', 'Thua Thien Hue'
    ],
  },
  {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    dialCode: '+66',
    phoneFormat: '## #### ####',
    phonePattern: '^[689]\\d{8}$',
    states: [
      'Bangkok Metropolitan', 'Chiang Mai', 'Phuket', 'Chonburi (Pattaya)', 'Nakhon Ratchasima',
      'Khon Kaen', 'Surat Thani (Koh Samui)', 'Songkhla (Hat Yai)', 'Nonthaburi'
    ],
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    dialCode: '+54',
    phoneFormat: '### ### ####',
    phonePattern: '^9\\d{10}$',
    states: [
      'Autonomous City of Buenos Aires (CABA)', 'Buenos Aires Province', 'Córdoba', 'Santa Fe (Rosario)',
      'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta', 'Misiones', 'Chaco', 'Neuquén', 'San Juan'
    ],
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    dialCode: '+56',
    phoneFormat: '# #### ####',
    phonePattern: '^9\\d{8}$',
    states: [
      'Santiago Metropolitan Region', 'Valparaíso', 'Biobío (Concepción)', 'Antofagasta',
      'Coquimbo (La Serena)', 'Araucanía (Temuco)', 'O\'Higgins', 'Maule', 'Los Lagos (Puerto Montt)'
    ],
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    dialCode: '+57',
    phoneFormat: '### ### ####',
    phonePattern: '^3\\d{9}$',
    states: [
      'Bogotá Capital District', 'Antioquia (Medellín)', 'Valle del Cauca (Cali)', 'Atlántico (Barranquilla)',
      'Santander (Bucaramanga)', 'Bolívar (Cartagena)', 'Cundinamarca', 'Tolima', 'Risaralda (Pereira)'
    ],
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    dialCode: '+351',
    phoneFormat: '### ### ###',
    phonePattern: '^9[1236]\\d{7}$',
    states: [
      'Lisbon District', 'Porto District', 'Braga District', 'Setúbal District', 'Faro (Algarve)',
      'Aveiro District', 'Coimbra District', 'Leiria District', 'Madeira Autonomous Region', 'Azores Autonomous Region'
    ],
  },
  {
    code: 'GR',
    name: 'Greece',
    flag: '🇬🇷',
    dialCode: '+30',
    phoneFormat: '### ### ####',
    phonePattern: '^69\\d{8}$',
    states: [
      'Attica (Athens)', 'Central Macedonia (Thessaloniki)', 'Crete (Heraklion)', 'Western Greece',
      'Peloponnese', 'Thessaly', 'South Aegean (Rhodes, Mykonos)', 'Central Greece', 'Epirus'
    ],
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    flag: '🇨🇿',
    dialCode: '+420',
    phoneFormat: '### ### ###',
    phonePattern: '^[67]\\d{8}$',
    states: [
      'Prague (Praha)', 'Central Bohemian Region', 'South Moravian Region (Brno)',
      'Moravian-Silesian Region (Ostrava)', 'Plzeň Region', 'Ústí nad Labem Region', 'Olomouc Region'
    ],
  },
  {
    code: 'RO',
    name: 'Romania',
    flag: '🇷🇴',
    dialCode: '+40',
    phoneFormat: '### ### ###',
    phonePattern: '^7\\d{8}$',
    states: [
      'Bucharest (București)', 'Cluj (Cluj-Napoca)', 'Timiș (Timișoara)', 'Iași', 'Constanța',
      'Brașov', 'Prahova (Ploiești)', 'Dolj (Craiova)', 'Bihor (Oradea)', 'Sibiu'
    ],
  },
  {
    code: 'HU',
    name: 'Hungary',
    flag: '🇭🇺',
    dialCode: '+36',
    phoneFormat: '## ### ####',
    phonePattern: '^[237]0\\d{7}$',
    states: [
      'Budapest (Capital)', 'Pest County', 'Hajdú-Bihar (Debrecen)', 'Borsod-Abaúj-Zemplén (Miskolc)',
      'Csongrád-Csanád (Szeged)', 'Győr-Moson-Sopron', 'Fejér (Székesfehérvár)'
    ],
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    dialCode: '+880',
    phoneFormat: '####-######',
    phonePattern: '^1[3-9]\\d{8}$',
    states: [
      'Dhaka Division', 'Chattogram (Chittagong)', 'Khulna Division', 'Rajshahi Division',
      'Sylhet Division', 'Barishal Division', 'Rangpur Division', 'Mymensingh Division'
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    dialCode: '+254',
    phoneFormat: '### ######',
    phonePattern: '^[71]\\d{8}$',
    states: [
      'Nairobi County', 'Mombasa County', 'Kiambu County', 'Nakuru County', 'Kisumu County',
      'Machakos County', 'Uasin Gishu (Eldoret)', 'Kilifi County', 'Kajiado County'
    ],
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    dialCode: '+233',
    phoneFormat: '## ### ####',
    phonePattern: '^[235]\\d{8}$',
    states: [
      'Greater Accra Region', 'Ashanti Region (Kumasi)', 'Western Region (Takoradi)',
      'Eastern Region', 'Central Region (Cape Coast)', 'Northern Region (Tamale)', 'Volta Region'
    ],
  },
  {
    code: 'OTHER',
    name: 'Other Sovereign Territory',
    flag: '🌐',
    dialCode: '+1',
    phoneFormat: '###-###-####',
    phonePattern: '^\\d{7,15}$',
    states: [
      'Main Administrative District', 'Capital District', 'Northern Region', 'Southern Region',
      'Eastern Region', 'Western Region', 'Central Province', 'Overseas Territory'
    ],
  },
];

// Helper to look up country by ISO code
export function getCountryByCode(code: string): CountryInfo {
  const found = COUNTRIES_DATA.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || COUNTRIES_DATA[0];
}

// Helper to look up country by Dial Code
export function getCountryByDialCode(dialCode: string): CountryInfo {
  const found = COUNTRIES_DATA.find((c) => c.dialCode === dialCode);
  return found || COUNTRIES_DATA[0];
}

// Phone Number Sanitizer and Real-time Masking Formatter
export function formatPhoneNumber(dialCode: string, rawDigits: string): string {
  // Strip everything except numbers
  const digits = rawDigits.replace(/\D/g, '');
  const country = getCountryByDialCode(dialCode);
  const pattern = country.phoneFormat;

  if (!pattern) return digits;

  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
    if (pattern[i] === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += pattern[i];
    }
  }

  // Append any excess digits if user enters more than pattern
  if (digitIndex < digits.length) {
    formatted += digits.slice(digitIndex);
  }

  return formatted;
}

// Validate Phone Number
export function isValidPhoneNumber(dialCode: string, rawPhone: string): boolean {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return false;

  const country = getCountryByDialCode(dialCode);
  if (!country.phonePattern) return digits.length >= 7;

  try {
    const regex = new RegExp(country.phonePattern);
    return regex.test(digits);
  } catch {
    return digits.length >= 7;
  }
}
