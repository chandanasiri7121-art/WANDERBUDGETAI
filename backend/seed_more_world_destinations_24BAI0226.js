// ============================================================================
// WanderBudget AI — Global World Destinations Expanded Seeder
// Expands PostgreSQL database to 100+ premier travel destinations worldwide
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MORE_WORLD_DESTINATIONS = [
  // --- ASIA ---
  {
    city_name: 'Bangkok',
    country_name: 'Thailand',
    currency_code: 'THB',
    currency_symbol: '฿',
    description: 'Vibrant capital of Thailand famous for ornate shrines, bustling river canals, and legendary street food markets.',
    image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 600,
      accommodation_standard_night: 2200,
      accommodation_luxury_night: 6500,
      meal_budget_day: 300,
      meal_standard_day: 750,
      meal_luxury_day: 2200,
      transit_pass_day: 150,
      taxi_per_km: 15,
      exchange_rate_to_inr: 2.35
    },
    attractions: [
      { name: 'Grand Palace & Wat Phra Kaew (Emerald Buddha)', category: 'Sacred Palace Complex', ticket_price_local: 500, ticket_price_inr: 1175, avg_duration_hours: 3.0 },
      { name: 'Wat Arun (Temple of Dawn) Chao Phraya Ferry', category: 'Riverside Temple', ticket_price_local: 100, ticket_price_inr: 235, avg_duration_hours: 2.0 },
      { name: 'Wat Pho (Giant Reclining Buddha)', category: 'Historic Buddhist Temple', ticket_price_local: 200, ticket_price_inr: 470, avg_duration_hours: 2.0 },
      { name: 'Chatuchak Weekend Market & Street Food Safari', category: 'World Famous Market', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 3.5 }
    ]
  },
  {
    city_name: 'Phuket',
    country_name: 'Thailand',
    currency_code: 'THB',
    currency_symbol: '฿',
    description: 'Thailand’s largest island with rainforested, mountainous interior and stunning Andaman Sea beaches.',
    image_url: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 700,
      accommodation_standard_night: 2600,
      accommodation_luxury_night: 8500,
      meal_budget_day: 350,
      meal_standard_day: 900,
      meal_luxury_day: 2600,
      transit_pass_day: 200,
      taxi_per_km: 25,
      exchange_rate_to_inr: 2.35
    },
    attractions: [
      { name: 'Phi Phi Islands Speedboat & Maya Bay Tour', category: 'Island Excursion', ticket_price_local: 1800, ticket_price_inr: 4230, avg_duration_hours: 7.0 },
      { name: 'Big Buddha of Phuket on Nakkerd Hills', category: 'Sacred Monument', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Phang Nga Bay & James Bond Island Kayaking', category: 'Marine Wonder', ticket_price_local: 1600, ticket_price_inr: 3760, avg_duration_hours: 6.0 },
      { name: 'Old Phuket Town Sino-Portuguese Heritage Walk', category: 'Cultural Walk', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 }
    ]
  },
  {
    city_name: 'Osaka',
    country_name: 'Japan',
    currency_code: 'JPY',
    currency_symbol: '¥',
    description: 'Japan’s street food and comedy capital, known for modern architecture, neon-lit nightlife, and hearty culinary delights.',
    image_url: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 4500,
      accommodation_standard_night: 13000,
      accommodation_luxury_night: 35000,
      meal_budget_day: 1800,
      meal_standard_day: 4200,
      meal_luxury_day: 12000,
      transit_pass_day: 800,
      taxi_per_km: 300,
      exchange_rate_to_inr: 0.55
    },
    attractions: [
      { name: 'Osaka Castle & Park Citadel', category: 'Feudal Castle', ticket_price_local: 600, ticket_price_inr: 330, avg_duration_hours: 2.5 },
      { name: 'Dotonbori Glico Sign & Street Food Tasting', category: 'Food & Culture Walk', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Universal Studios Japan (Super Nintendo World)', category: 'Theme Park', ticket_price_local: 8600, ticket_price_inr: 4730, avg_duration_hours: 8.0 },
      { name: 'Umeda Sky Building Floating Garden Observatory', category: 'Skyline Observatory', ticket_price_local: 1500, ticket_price_inr: 825, avg_duration_hours: 1.5 }
    ]
  },
  {
    city_name: 'Shanghai',
    country_name: 'China',
    currency_code: 'CNY',
    currency_symbol: '¥',
    description: 'China’s biggest city and global financial hub, featuring the iconic colonial Bund and futuristic Pudong skyline.',
    image_url: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 220,
      accommodation_standard_night: 650,
      accommodation_luxury_night: 1800,
      meal_budget_day: 80,
      meal_standard_day: 220,
      meal_luxury_day: 650,
      transit_pass_day: 25,
      taxi_per_km: 5,
      exchange_rate_to_inr: 11.5
    },
    attractions: [
      { name: 'The Bund Waterfront Promenade', category: 'Historic Skyline Walk', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Shanghai Tower 118th Floor Observation Deck', category: 'Megatall Skyscraper', ticket_price_local: 180, ticket_price_inr: 2070, avg_duration_hours: 2.0 },
      { name: 'Yu Garden & Yuyuan Bazaar', category: 'Ming Dynasty Classical Garden', ticket_price_local: 40, ticket_price_inr: 460, avg_duration_hours: 2.5 },
      { name: 'Zhujiajiao Ancient Water Town Gondola Tour', category: 'Historic Canal Town', ticket_price_local: 80, ticket_price_inr: 920, avg_duration_hours: 4.0 }
    ]
  },
  {
    city_name: 'Beijing',
    country_name: 'China',
    currency_code: 'CNY',
    currency_symbol: '¥',
    description: 'China’s historic capital spanning 3 millennia of imperial history, home to ancient palaces and the Great Wall.',
    image_url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 200,
      accommodation_standard_night: 600,
      accommodation_luxury_night: 1700,
      meal_budget_day: 75,
      meal_standard_day: 200,
      meal_luxury_day: 600,
      transit_pass_day: 25,
      taxi_per_km: 5,
      exchange_rate_to_inr: 11.5
    },
    attractions: [
      { name: 'Forbidden City (Palace Museum)', category: 'Imperial Palace', ticket_price_local: 60, ticket_price_inr: 690, avg_duration_hours: 4.0 },
      { name: 'Mutianyu Great Wall Cable Car & Toboggan', category: 'World Wonder Trek', ticket_price_local: 160, ticket_price_inr: 1840, avg_duration_hours: 6.0 },
      { name: 'Temple of Heaven Imperial Sacrificial Complex', category: 'UNESCO World Heritage', ticket_price_local: 34, ticket_price_inr: 391, avg_duration_hours: 2.5 },
      { name: 'Summer Palace & Kunming Lake Boating', category: 'Imperial Royal Garden', ticket_price_local: 30, ticket_price_inr: 345, avg_duration_hours: 3.5 }
    ]
  },
  {
    city_name: 'Kathmandu',
    country_name: 'Nepal',
    currency_code: 'NPR',
    currency_symbol: '₨',
    description: 'Himalayan valley capital steeped in ancient Hindu temples, Buddhist stupas, and gateway to Mount Everest.',
    image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 1500,
      accommodation_standard_night: 4500,
      accommodation_luxury_night: 15000,
      meal_budget_day: 700,
      meal_standard_day: 1800,
      meal_luxury_day: 4800,
      transit_pass_day: 350,
      taxi_per_km: 70,
      exchange_rate_to_inr: 0.625
    },
    attractions: [
      { name: 'Swayambhunath Monkey Temple', category: 'Sacred Hilltop Stupa', ticket_price_local: 200, ticket_price_inr: 125, avg_duration_hours: 2.0 },
      { name: 'Boudhanath Stupa Mandala Walk', category: 'UNESCO Buddhist Stupa', ticket_price_local: 400, ticket_price_inr: 250, avg_duration_hours: 2.0 },
      { name: 'Pashupatinath Temple Ghats & Aarti', category: 'Sacred Shiva Temple', ticket_price_local: 1000, ticket_price_inr: 625, avg_duration_hours: 2.5 },
      { name: 'Kathmandu Durbar Square & Kumari Ghar', category: 'Ancient Palace Square', ticket_price_local: 1000, ticket_price_inr: 625, avg_duration_hours: 2.5 }
    ]
  },
  {
    city_name: 'Colombo',
    country_name: 'Sri Lanka',
    currency_code: 'LKR',
    currency_symbol: 'Rs',
    description: 'Island metropolis blending colonial fort architecture, Buddhist temples, and Indian Ocean coastal breezes.',
    image_url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 5000,
      accommodation_standard_night: 16000,
      accommodation_luxury_night: 45000,
      meal_budget_day: 2000,
      meal_standard_day: 5500,
      meal_luxury_day: 15000,
      transit_pass_day: 1000,
      taxi_per_km: 180,
      exchange_rate_to_inr: 0.28
    },
    attractions: [
      { name: 'Gangaramaya Buddhist Temple & Seema Malaka', category: 'Historic Lakeside Temple', ticket_price_local: 400, ticket_price_inr: 112, avg_duration_hours: 2.0 },
      { name: 'Galle Face Green Sunset Promenade', category: 'Oceanfront Park', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'National Museum of Colombo', category: 'National Heritage', ticket_price_local: 1200, ticket_price_inr: 336, avg_duration_hours: 2.5 },
      { name: 'Pettah Floating Market & Red Mosque (Jami Ul-Alfar)', category: 'Market & Mosque', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 }
    ]
  },
  {
    city_name: 'Siem Reap',
    country_name: 'Cambodia',
    currency_code: 'USD',
    currency_symbol: '$',
    description: 'Gateway to Angkor Wat, the largest religious temple monument complex on earth and ancient Khmer capital.',
    image_url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 18,
      accommodation_standard_night: 55,
      accommodation_luxury_night: 180,
      meal_budget_day: 10,
      meal_standard_day: 25,
      meal_luxury_day: 65,
      transit_pass_day: 15,
      taxi_per_km: 2,
      exchange_rate_to_inr: 83.5
    },
    attractions: [
      { name: 'Angkor Wat Sunrise & Archaeological Park 1-Day Pass', category: 'UNESCO World Wonder', ticket_price_local: 37, ticket_price_inr: 3089, avg_duration_hours: 8.0 },
      { name: 'Bayon Temple (Giant Smiling Stone Faces)', category: 'Ancient Khmer Temple', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Ta Prohm (Tomb Raider Jungle Tree Temple)', category: 'Jungle Ruin Temple', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Tonle Sap Floating Village Boat Tour', category: 'Lake Eco Tour', ticket_price_local: 20, ticket_price_inr: 1670, avg_duration_hours: 3.5 }
    ]
  },

  // --- OCEANIA ---
  {
    city_name: 'Sydney',
    country_name: 'Australia',
    currency_code: 'AUD',
    currency_symbol: 'A$',
    description: 'Iconic harbor city famous for Sydney Opera House, Sydney Harbour Bridge, and world-class surfing beaches.',
    image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 55,
      accommodation_standard_night: 180,
      accommodation_luxury_night: 450,
      meal_budget_day: 30,
      meal_standard_day: 75,
      meal_luxury_day: 190,
      transit_pass_day: 12,
      taxi_per_km: 3.2,
      exchange_rate_to_inr: 54.5
    },
    attractions: [
      { name: 'Sydney Opera House Guided Architectural Tour', category: 'Architectural Icon', ticket_price_local: 43, ticket_price_inr: 2343, avg_duration_hours: 1.5 },
      { name: 'Sydney Harbour Bridge Pylon Lookout & Walk', category: 'Harbor Panorama', ticket_price_local: 19, ticket_price_inr: 1035, avg_duration_hours: 2.0 },
      { name: 'Bondi to Coogee Coastal Cliff Walk', category: 'Ocean Coastal Walk', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 3.0 },
      { name: 'Manly Ferry Harbor Cruise & Beach', category: 'Ferry Harbor Tour', ticket_price_local: 8, ticket_price_inr: 436, avg_duration_hours: 3.0 }
    ]
  },
  {
    city_name: 'Auckland',
    country_name: 'New Zealand',
    currency_code: 'NZD',
    currency_symbol: 'NZ$',
    description: 'The City of Sails, set between two harbors and surrounded by extinct volcanic cones and pristine vineyards.',
    image_url: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 50,
      accommodation_standard_night: 165,
      accommodation_luxury_night: 420,
      meal_budget_day: 28,
      meal_standard_day: 70,
      meal_luxury_day: 180,
      transit_pass_day: 12,
      taxi_per_km: 3.0,
      exchange_rate_to_inr: 50.8
    },
    attractions: [
      { name: 'Sky Tower Observation Deck & SkyWalk', category: 'Skyline Observatory', ticket_price_local: 32, ticket_price_inr: 1625, avg_duration_hours: 2.0 },
      { name: 'Waiheke Island Ferry & Wine Tasting Tour', category: 'Island Vineyard Excursion', ticket_price_local: 42, ticket_price_inr: 2133, avg_duration_hours: 6.0 },
      { name: 'Mount Eden (Maungawhau) Volcanic Crater Hike', category: 'Volcanic Peak', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Hobbiton Movie Set Day Tour (Matamata)', category: 'Movie Set Excursion', ticket_price_local: 89, ticket_price_inr: 4521, avg_duration_hours: 7.0 }
    ]
  },

  // --- EUROPE ---
  {
    city_name: 'Madrid',
    country_name: 'Spain',
    currency_code: 'EUR',
    currency_symbol: '€',
    description: 'Spain’s royal capital known for elegant boulevards, expansive manicured parks, and the Prado art museum.',
    image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 45,
      accommodation_standard_night: 135,
      accommodation_luxury_night: 350,
      meal_budget_day: 22,
      meal_standard_day: 55,
      meal_luxury_day: 140,
      transit_pass_day: 8,
      taxi_per_km: 1.8,
      exchange_rate_to_inr: 90.5
    },
    attractions: [
      { name: 'Prado National Museum (Velázquez & Goya)', category: 'World Art Museum', ticket_price_local: 15, ticket_price_inr: 1357, avg_duration_hours: 3.0 },
      { name: 'Royal Palace of Madrid (Palacio Real)', category: 'Royal Historic Palace', ticket_price_local: 14, ticket_price_inr: 1267, avg_duration_hours: 2.5 },
      { name: 'El Retiro Park & Crystal Palace Boat Row', category: 'Royal Park & Lake', ticket_price_local: 6, ticket_price_inr: 543, avg_duration_hours: 2.0 },
      { name: 'Plaza Mayor & Mercado de San Miguel Tapas', category: 'Plaza & Culinary', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 }
    ]
  },
  {
    city_name: 'Dublin',
    country_name: 'Ireland',
    currency_code: 'EUR',
    currency_symbol: '€',
    description: 'Ireland’s historic literary and pub capital, famous for Trinity College, Georgian squares, and warm Celtic hospitality.',
    image_url: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 55,
      accommodation_standard_night: 160,
      accommodation_luxury_night: 400,
      meal_budget_day: 26,
      meal_standard_day: 65,
      meal_luxury_day: 160,
      transit_pass_day: 10,
      taxi_per_km: 2.2,
      exchange_rate_to_inr: 90.5
    },
    attractions: [
      { name: 'Guinness Storehouse Experience & Gravity Bar', category: 'Iconic Brewery', ticket_price_local: 26, ticket_price_inr: 2353, avg_duration_hours: 2.5 },
      { name: 'Trinity College Old Library & Book of Kells', category: 'Historic University', ticket_price_local: 18, ticket_price_inr: 1629, avg_duration_hours: 2.0 },
      { name: 'Temple Bar Cultural Quarter & Live Folk Music', category: 'Cultural District', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Cliffs of Moher & Galway Wild Atlantic Tour', category: 'Coastal Cliffs Day Trip', ticket_price_local: 65, ticket_price_inr: 5882, avg_duration_hours: 9.0 }
    ]
  },
  {
    city_name: 'Edinburgh',
    country_name: 'United Kingdom',
    currency_code: 'GBP',
    currency_symbol: '£',
    description: 'Scotland’s majestic capital with its dramatic volcanic castle rock, medieval Old Town, and neoclassical New Town.',
    image_url: 'https://images.unsplash.com/photo-1506377585622-be77d028ec7f?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 48,
      accommodation_standard_night: 150,
      accommodation_luxury_night: 380,
      meal_budget_day: 24,
      meal_standard_day: 60,
      meal_luxury_day: 150,
      transit_pass_day: 9,
      taxi_per_km: 2.2,
      exchange_rate_to_inr: 106.0
    },
    attractions: [
      { name: 'Edinburgh Castle on Castle Rock Citadel', category: 'Historic Royal Fortress', ticket_price_local: 19.5, ticket_price_inr: 2067, avg_duration_hours: 3.0 },
      { name: 'Royal Mile Historic Stroll & St Giles Cathedral', category: 'Medieval Thoroughfare', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Arthur’s Seat Volcanic Peak Panoramic Hike', category: 'Volcanic Hilltop View', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Palace of Holyroodhouse (Monarch Residence)', category: 'Royal Palace', ticket_price_local: 18, ticket_price_inr: 1908, avg_duration_hours: 2.0 }
    ]
  },
  {
    city_name: 'Stockholm',
    country_name: 'Sweden',
    currency_code: 'SEK',
    currency_symbol: 'kr',
    description: 'Scandinavian gem spread over 14 Baltic islands, known for Gamla Stan, royal palaces, and pristine archipelagos.',
    image_url: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 550,
      accommodation_standard_night: 1600,
      accommodation_luxury_night: 4200,
      meal_budget_day: 250,
      meal_standard_day: 650,
      meal_luxury_day: 1700,
      transit_pass_day: 90,
      taxi_per_km: 25,
      exchange_rate_to_inr: 7.9
    },
    attractions: [
      { name: 'Vasa Museum (Intact 17th Century Warship)', category: 'Maritime Museum', ticket_price_local: 170, ticket_price_inr: 1343, avg_duration_hours: 2.5 },
      { name: 'Gamla Stan (Old Town) & Royal Palace Guard Change', category: 'Historic Island', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'ABBA The Museum & Swedish Music Hall', category: 'Music Experience', ticket_price_local: 250, ticket_price_inr: 1975, avg_duration_hours: 2.0 },
      { name: 'Stockholm Archipelago Boat Excursion', category: 'Baltic Archipelago Cruise', ticket_price_local: 320, ticket_price_inr: 2528, avg_duration_hours: 3.5 }
    ]
  },
  {
    city_name: 'Copenhagen',
    country_name: 'Denmark',
    currency_code: 'DKK',
    currency_symbol: 'kr',
    description: 'Danish design capital famed for colorful Nyhavn canal, cycling culture, Michelin restaurants, and Tivoli Gardens.',
    image_url: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 400,
      accommodation_standard_night: 1200,
      accommodation_luxury_night: 3200,
      meal_budget_day: 180,
      meal_standard_day: 480,
      meal_luxury_day: 1300,
      transit_pass_day: 70,
      taxi_per_km: 18,
      exchange_rate_to_inr: 12.1
    },
    attractions: [
      { name: 'Tivoli Gardens Historic Amusement Park', category: 'Theme Park', ticket_price_local: 145, ticket_price_inr: 1754, avg_duration_hours: 4.0 },
      { name: 'Nyhavn Waterfront Canal Boat Cruise', category: 'Canal Cruise', ticket_price_local: 95, ticket_price_inr: 1149, avg_duration_hours: 1.5 },
      { name: 'Amalienborg Palace Royal Residence', category: 'Royal Residence', ticket_price_local: 120, ticket_price_inr: 1452, avg_duration_hours: 2.0 },
      { name: 'The Little Mermaid Statue & Kastellet Citadel', category: 'Harbor Landmark', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 1.5 }
    ]
  },
  {
    city_name: 'Milan',
    country_name: 'Italy',
    currency_code: 'EUR',
    currency_symbol: '€',
    description: 'Italy’s fashion and design powerhouse, home to the breathtaking Gothic Duomo and Da Vinci’s Last Supper.',
    image_url: 'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 50,
      accommodation_standard_night: 155,
      accommodation_luxury_night: 420,
      meal_budget_day: 25,
      meal_standard_day: 65,
      meal_luxury_day: 165,
      transit_pass_day: 9,
      taxi_per_km: 2.0,
      exchange_rate_to_inr: 90.5
    },
    attractions: [
      { name: 'Duomo di Milano Rooftop Terraces Cathedral Walk', category: 'Gothic Cathedral', ticket_price_local: 16, ticket_price_inr: 1448, avg_duration_hours: 2.5 },
      { name: 'Santa Maria delle Grazie (Da Vinci Last Supper)', category: 'Renaissance Masterpiece', ticket_price_local: 15, ticket_price_inr: 1357, avg_duration_hours: 1.5 },
      { name: 'Galleria Vittorio Emanuele II & La Scala Opera', category: 'Historic Arcade', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Sforza Castle & Parco Sempione Grounds', category: 'Renaissance Fortress', ticket_price_local: 5, ticket_price_inr: 452, avg_duration_hours: 2.5 }
    ]
  },
  {
    city_name: 'Santorini',
    country_name: 'Greece',
    currency_code: 'EUR',
    currency_symbol: '€',
    description: 'Cycladic volcanic island famous for whitewashed cliffside towns, blue-domed churches, and fiery Aegean sunsets.',
    image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 55,
      accommodation_standard_night: 175,
      accommodation_luxury_night: 520,
      meal_budget_day: 28,
      meal_standard_day: 70,
      meal_luxury_day: 180,
      transit_pass_day: 10,
      taxi_per_km: 2.5,
      exchange_rate_to_inr: 90.5
    },
    attractions: [
      { name: 'Oia Village Sunset Caldera Viewpoint', category: 'Iconic Sunset Spot', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Santorini Volcanic Caldera & Hot Springs Cruise', category: 'Catamaran Sailing', ticket_price_local: 45, ticket_price_inr: 4072, avg_duration_hours: 5.0 },
      { name: 'Red Beach & Akrotiri Prehistoric Minoan Ruins', category: 'Prehistoric Archaeology', ticket_price_local: 12, ticket_price_inr: 1086, avg_duration_hours: 2.5 },
      { name: 'Fira to Oia Caldera Rim Cliff Hike', category: 'Scenic Coastal Hike', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 3.5 }
    ]
  },

  // --- AMERICAS ---
  {
    city_name: 'Toronto',
    country_name: 'Canada',
    currency_code: 'CAD',
    currency_symbol: 'CA$',
    description: 'Canada’s bustling economic capital on Lake Ontario, home to the CN Tower and multicultural culinary scenes.',
    image_url: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 60,
      accommodation_standard_night: 180,
      accommodation_luxury_night: 420,
      meal_budget_day: 30,
      meal_standard_day: 75,
      meal_luxury_day: 190,
      transit_pass_day: 12,
      taxi_per_km: 2.5,
      exchange_rate_to_inr: 61.5
    },
    attractions: [
      { name: 'CN Tower Main Observation Deck & Glass Floor', category: 'Iconic Tower', ticket_price_local: 43, ticket_price_inr: 2644, avg_duration_hours: 2.0 },
      { name: 'Niagara Falls Day Tour from Toronto', category: 'World Wonder Excursion', ticket_price_local: 75, ticket_price_inr: 4612, avg_duration_hours: 8.0 },
      { name: 'Royal Ontario Museum (ROM Crystal)', category: 'Natural History & Art', ticket_price_local: 23, ticket_price_inr: 1414, avg_duration_hours: 3.0 },
      { name: 'Toronto Islands Ferry & Skyline Beach Park', category: 'Island Park & Ferry', ticket_price_local: 9, ticket_price_inr: 553, avg_duration_hours: 3.0 }
    ]
  },
  {
    city_name: 'Chicago',
    country_name: 'United States',
    currency_code: 'USD',
    currency_symbol: '$',
    description: 'The Windy City on Lake Michigan, famed for bold skyscraper architecture, deep-dish pizza, and Millennium Park.',
    image_url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 65,
      accommodation_standard_night: 195,
      accommodation_luxury_night: 480,
      meal_budget_day: 32,
      meal_standard_day: 80,
      meal_luxury_day: 200,
      transit_pass_day: 10,
      taxi_per_km: 2.8,
      exchange_rate_to_inr: 83.5
    },
    attractions: [
      { name: 'Chicago Architecture River Cruise', category: 'Architectural River Boat', ticket_price_local: 45, ticket_price_inr: 3757, avg_duration_hours: 1.5 },
      { name: 'Millennium Park (Cloud Gate "The Bean")', category: 'Public Art Plaza', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 1.5 },
      { name: 'Skydeck Chicago at Willis Tower (The Ledge)', category: 'Skyscraper Observation', ticket_price_local: 35, ticket_price_inr: 2922, avg_duration_hours: 2.0 },
      { name: 'Art Institute of Chicago', category: 'World Class Art Museum', ticket_price_local: 32, ticket_price_inr: 2672, avg_duration_hours: 3.0 }
    ]
  },
  {
    city_name: 'Las Vegas',
    country_name: 'United States',
    currency_code: 'USD',
    currency_symbol: '$',
    description: 'The Entertainment Capital of the World in the Mojave Desert, famous for lavish resort spectacles and 24-hour excitement.',
    image_url: 'https://images.unsplash.com/photo-1581351123004-757df051db8e?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 50,
      accommodation_standard_night: 160,
      accommodation_luxury_night: 450,
      meal_budget_day: 30,
      meal_standard_day: 75,
      meal_luxury_day: 220,
      transit_pass_day: 8,
      taxi_per_km: 2.5,
      exchange_rate_to_inr: 83.5
    },
    attractions: [
      { name: 'Bellagio Fountains Spectacular & Conservatory', category: 'Musical Water Show', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 1.0 },
      { name: 'High Roller Observation Wheel at The LINQ', category: 'Giant Ferris Wheel', ticket_price_local: 32, ticket_price_inr: 2672, avg_duration_hours: 1.0 },
      { name: 'Grand Canyon West Rim & Skywalk Day Tour', category: 'Canyon Wonder Tour', ticket_price_local: 110, ticket_price_inr: 9185, avg_duration_hours: 9.0 },
      { name: 'Fremont Street Experience Downtown Light Canopy', category: 'Light Show Promenade', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 }
    ]
  },
  {
    city_name: 'Buenos Aires',
    country_name: 'Argentina',
    currency_code: 'ARS',
    currency_symbol: '$',
    description: 'The Paris of South America, known for passionate tango dancing, grand European architecture, and world-class steakhouses.',
    image_url: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 25000,
      accommodation_standard_night: 75000,
      accommodation_luxury_night: 220000,
      meal_budget_day: 12000,
      meal_standard_day: 30000,
      meal_luxury_day: 85000,
      transit_pass_day: 3000,
      taxi_per_km: 800,
      exchange_rate_to_inr: 0.088
    },
    attractions: [
      { name: 'Teatro Colón Guided Opera House Tour', category: 'Historic Opera House', ticket_price_local: 12000, ticket_price_inr: 1056, avg_duration_hours: 1.5 },
      { name: 'La Boca Caminito Colorful Street & Tango', category: 'Cultural District', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 },
      { name: 'Recoleta Cemetery (Evita Perón Mausoleum)', category: 'Historic Monumental Cemetery', ticket_price_local: 5000, ticket_price_inr: 440, avg_duration_hours: 2.0 },
      { name: 'Plaza de Mayo & Casa Rosada Presidential Balcony', category: 'Historic Plaza', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 1.5 }
    ]
  },
  {
    city_name: 'Cusco',
    country_name: 'Peru',
    currency_code: 'PEN',
    currency_symbol: 'S/',
    description: 'Ancient capital of the Inca Empire nestled in the Andes mountains, world gateway to the lost citadel of Machu Picchu.',
    image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 70,
      accommodation_standard_night: 220,
      accommodation_luxury_night: 600,
      meal_budget_day: 35,
      meal_standard_day: 90,
      meal_luxury_day: 240,
      transit_pass_day: 15,
      taxi_per_km: 4,
      exchange_rate_to_inr: 22.4
    },
    attractions: [
      { name: 'Machu Picchu Lost Inca Citadel Expedition & Train', category: 'UNESCO Wonder of the World', ticket_price_local: 152, ticket_price_inr: 3404, avg_duration_hours: 10.0 },
      { name: 'Sacsayhuamán Megalithic Fortress Ruins', category: 'Inca Archaeological Complex', ticket_price_local: 70, ticket_price_inr: 1568, avg_duration_hours: 3.0 },
      { name: 'Plaza de Armas & Cusco Cathedral', category: 'Colonial Historic Center', ticket_price_local: 25, ticket_price_inr: 560, avg_duration_hours: 2.0 },
      { name: 'Rainbow Mountain (Vinicunca) High Altitude Trek', category: 'Natural Mountain Wonder', ticket_price_local: 80, ticket_price_inr: 1792, avg_duration_hours: 8.0 }
    ]
  },

  // --- MIDDLE EAST & AFRICA ---
  {
    city_name: 'Abu Dhabi',
    country_name: 'United Arab Emirates',
    currency_code: 'AED',
    currency_symbol: 'د.إ',
    description: 'Capital of the UAE, known for majestic Sheikh Zayed Grand Mosque, futuristic cultural museums, and luxury desert resorts.',
    image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 180,
      accommodation_standard_night: 480,
      accommodation_luxury_night: 1300,
      meal_budget_day: 70,
      meal_standard_day: 180,
      meal_luxury_day: 480,
      transit_pass_day: 25,
      taxi_per_km: 4.5,
      exchange_rate_to_inr: 22.7
    },
    attractions: [
      { name: 'Sheikh Zayed Grand Mosque Architectural Tour', category: 'Grand Monumental Mosque', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Louvre Abu Dhabi Floating Dome Art Museum', category: 'Universal Museum', ticket_price_local: 63, ticket_price_inr: 1430, avg_duration_hours: 3.0 },
      { name: 'Ferrari World Abu Dhabi (Formula Rossa Coaster)', category: 'Thrilling Theme Park', ticket_price_local: 345, ticket_price_inr: 7831, avg_duration_hours: 6.0 },
      { name: 'Qasr Al Watan Presidential Palace Tour', category: 'Presidential Palace', ticket_price_local: 65, ticket_price_inr: 1475, avg_duration_hours: 2.0 }
    ]
  },
  {
    city_name: 'Doha',
    country_name: 'Qatar',
    currency_code: 'QAR',
    currency_symbol: 'ر.ق',
    description: 'Glittering Gulf capital combining futuristic skyline architecture with traditional bedouin heritage and dhow cruises.',
    image_url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 170,
      accommodation_standard_night: 450,
      accommodation_luxury_night: 1200,
      meal_budget_day: 65,
      meal_standard_day: 170,
      meal_luxury_day: 450,
      transit_pass_day: 20,
      taxi_per_km: 4.0,
      exchange_rate_to_inr: 22.9
    },
    attractions: [
      { name: 'Souq Waqif Traditional Bazaars & Falcon Market', category: 'Heritage Market', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.5 },
      { name: 'Museum of Islamic Art (I.M. Pei Architectural Gem)', category: 'Islamic Art & Culture', ticket_price_local: 50, ticket_price_inr: 1145, avg_duration_hours: 2.5 },
      { name: 'Doha Corniche Sunset Dhow Boat Cruise', category: 'Harbor Boat Cruise', ticket_price_local: 60, ticket_price_inr: 1374, avg_duration_hours: 2.0 },
      { name: 'Katara Cultural Village & Amphitheatre', category: 'Cultural Complex', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0 }
    ]
  },
  {
    city_name: 'Nairobi',
    country_name: 'Kenya',
    currency_code: 'KES',
    currency_symbol: 'KSh',
    description: 'Safari capital of Africa, unique for having a wildlife national park harboring lions and rhinos right against its skyline.',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    cost_index: {
      accommodation_budget_night: 3500,
      accommodation_standard_night: 11000,
      accommodation_luxury_night: 30000,
      meal_budget_day: 1500,
      meal_standard_day: 4000,
      meal_luxury_day: 11000,
      transit_pass_day: 600,
      taxi_per_km: 150,
      exchange_rate_to_inr: 0.65
    },
    attractions: [
      { name: 'Nairobi National Park Big Four Game Safari Drive', category: 'Wildlife Safari', ticket_price_local: 4300, ticket_price_inr: 2795, avg_duration_hours: 5.0 },
      { name: 'David Sheldrick Wildlife Trust Elephant Orphanage', category: 'Conservation Sanctuary', ticket_price_local: 1500, ticket_price_inr: 975, avg_duration_hours: 1.5 },
      { name: 'Giraffe Centre Endangered Rothschild Feeding Platform', category: 'Wildlife Sanctuary', ticket_price_local: 1500, ticket_price_inr: 975, avg_duration_hours: 1.5 },
      { name: 'Karen Blixen Museum & Coffee Garden Walk', category: 'Historical Museum', ticket_price_local: 1200, ticket_price_inr: 780, avg_duration_hours: 2.0 }
    ]
  }
];

async function seedMoreWorld() {
  console.log(`[Seed More World] Starting insertion of ${MORE_WORLD_DESTINATIONS.length} premier world destinations...`);

  let added = 0;
  for (const item of MORE_WORLD_DESTINATIONS) {
    // Check if destination exists
    const existing = await prisma.destination.findFirst({
      where: { city_name: { equals: item.city_name, mode: 'insensitive' } }
    });

    if (existing) {
      console.log(`- City ${item.city_name} already exists. Skipping.`);
      continue;
    }

    const created = await prisma.destination.create({
      data: {
        city_name: item.city_name,
        country_name: item.country_name,
        currency_code: item.currency_code,
        currency_symbol: item.currency_symbol,
        description: item.description,
        image_url: item.image_url,
        cost_index: {
          create: {
            ...item.cost_index,
            source: 'LIVE_WEB_SEARCH_AI',
            confidence_score: 0.95
          }
        },
        attractions: {
          create: item.attractions.map(a => ({
            name: a.name,
            category: a.category,
            ticket_price_local: a.ticket_price_local,
            ticket_price_inr: a.ticket_price_inr,
            avg_duration_hours: a.avg_duration_hours,
            recommended_style: 'ALL'
          }))
        }
      }
    });

    console.log(`+ Added: ${created.city_name}, ${created.country_name} (${created.currency_code}) with ${item.attractions.length} attractions.`);
    added++;
  }

  const total = await prisma.destination.count();
  console.log(`[Seed More World] Finished! Newly added: ${added}. Total destinations in DB: ${total}`);
}

seedMoreWorld()
  .catch(err => {
    console.error('Fatal seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
