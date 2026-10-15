const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

const WORLD_DESTINATIONS = [
  // ==========================================
  // EUROPE
  // ==========================================
  {
    city: 'Rome', country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'The Eternal City with thousands of years of ancient Roman ruins, Renaissance art, and the Vatican.',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    acc_b: 40, acc_s: 120, acc_l: 320, meal_b: 20, meal_s: 55, meal_l: 150, transit: 7, taxi: 1.8,
    attractions: [
      { name: 'Colosseum & Roman Forum Fast Track', category: 'Ancient Wonder', price: 24, hours: 3.5 },
      { name: 'Vatican Museums & Sistine Chapel', category: 'Art & Religion', price: 29, hours: 4.0 },
      { name: 'Trevi Fountain & Pantheon Historic Walk', category: 'Landmark', price: 5, hours: 2.0 },
      { name: 'Borghese Gallery & Villa Gardens', category: 'Art Gallery', price: 22, hours: 2.5 }
    ]
  },
  {
    city: 'Barcelona', country: 'Spain', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Catalonia\'s vibrant capital famous for Antoni Gaudí architecture, golden beaches, and gothic quarters.',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
    acc_b: 35, acc_s: 110, acc_l: 290, meal_b: 18, meal_s: 48, meal_l: 135, transit: 6.5, taxi: 1.6,
    attractions: [
      { name: 'Sagrada Família Basilica Tower Access', category: 'Gaudí Architecture', price: 36, hours: 2.5 },
      { name: 'Park Güell Monumental Zone Guided Tour', category: 'Iconic Park', price: 13, hours: 2.0 },
      { name: 'Casa Batlló Immersive 10D Experience', category: 'Modernist Mansion', price: 29, hours: 2.0 },
      { name: 'Gothic Quarter (Barri Gòtic) Walking Trail', category: 'Historic Quarter', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Amsterdam', country: 'Netherlands', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'The Venice of the North celebrated for its 17th-century canal rings, world-class museums, and cycling.',
    image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80',
    acc_b: 42, acc_s: 130, acc_l: 340, meal_b: 22, meal_s: 58, meal_l: 155, transit: 8.5, taxi: 2.1,
    attractions: [
      { name: 'Rijksmuseum Dutch Masters Guided Entry', category: 'Art & History Museum', price: 25, hours: 3.5 },
      { name: 'Van Gogh Museum Masterpieces Tour', category: 'Art Gallery', price: 22, hours: 2.5 },
      { name: 'Amsterdam UNESCO Canal Ring Boat Cruise', category: 'Scenic Canal Cruise', price: 18, hours: 1.5 },
      { name: 'Anne Frank House Historic Exhibition', category: 'Historic Memorial', price: 16, hours: 2.0 }
    ]
  },
  {
    city: 'Venice', country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Floating city built on 118 small islands connected by canals and bridges.',
    image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80',
    acc_b: 45, acc_s: 140, acc_l: 380, meal_b: 24, meal_s: 62, meal_l: 165, transit: 9.5, taxi: 3.0,
    attractions: [
      { name: 'St. Mark\'s Basilica & Golden Pala d\'Oro', category: 'Byzantine Cathedral', price: 15, hours: 2.0 },
      { name: 'Doge\'s Palace & Bridge of Sighs Access', category: 'Gothic Palace', price: 30, hours: 2.5 },
      { name: 'Grand Canal Traditional Gondola Ride', category: 'Gondola Cruise', price: 35, hours: 1.0 },
      { name: 'Rialto Bridge & Fish Market Stroll', category: 'Historic Bridge', price: 0, hours: 1.5 }
    ]
  },
  {
    city: 'Prague', country: 'Czech Republic', currency: 'CZK', symbol: 'Kč', rate: 3.65,
    desc: 'The City of a Hundred Spires known for its Old Town Square, Baroque churches, and medieval Astronomical Clock.',
    image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80',
    acc_b: 650, acc_s: 1900, acc_l: 5200, meal_b: 280, meal_s: 750, meal_l: 2100, transit: 120, taxi: 30,
    attractions: [
      { name: 'Prague Castle & St. Vitus Cathedral Complex', category: 'Medieval Castle', price: 250, hours: 3.5 },
      { name: 'Charles Bridge Historic Statues Walk', category: 'Historic Bridge', price: 0, hours: 1.5 },
      { name: 'Old Town Astronomical Clock & Hall Tower', category: 'Astronomical Clock', price: 250, hours: 2.0 },
      { name: 'Vltava River Panoramic Sightseeing Cruise', category: 'River Cruise', price: 350, hours: 1.5 }
    ]
  },
  {
    city: 'Vienna', country: 'Austria', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Imperial capital shaped by Mozart, Beethoven, the Habsburgs, and majestic palaces.',
    image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80',
    acc_b: 38, acc_s: 115, acc_l: 310, meal_b: 20, meal_s: 52, meal_l: 140, transit: 8.0, taxi: 1.9,
    attractions: [
      { name: 'Schönbrunn Palace Grand Imperial Tour', category: 'Imperial Palace', price: 26, hours: 3.0 },
      { name: 'St. Stephen\'s Cathedral & South Tower Climb', category: 'Gothic Cathedral', price: 12, hours: 2.0 },
      { name: 'Belvedere Palace (Klimt\'s The Kiss)', category: 'Baroque Palace & Art', price: 18, hours: 2.5 },
      { name: 'Hofburg Imperial Apartments & Sisi Museum', category: 'Habsburg Palace', price: 17, hours: 2.0 }
    ]
  },
  {
    city: 'Athens', country: 'Greece', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Cradle of Western civilization dominated by 5th-century BC landmarks like the Acropolis.',
    image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=800&q=80',
    acc_b: 30, acc_s: 90, acc_l: 250, meal_b: 16, meal_s: 42, meal_l: 115, transit: 6.0, taxi: 1.4,
    attractions: [
      { name: 'Acropolis & Parthenon Archaeological Site', category: 'Ancient Wonder', price: 20, hours: 3.0 },
      { name: 'Acropolis Museum Masterpieces Gallery', category: 'Archaeological Museum', price: 15, hours: 2.5 },
      { name: 'Plaka Historic Neighborhood & Anafiotika Walk', category: 'Historic Quarter', price: 0, hours: 2.0 },
      { name: 'Temple of Olympian Zeus & Hadrian\'s Arch', category: 'Ancient Ruins', price: 8, hours: 1.5 }
    ]
  },
  {
    city: 'Berlin', country: 'Germany', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Germany\'s capital known for its art scene, modern history, and landmarks from the Cold War.',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
    acc_b: 35, acc_s: 105, acc_l: 280, meal_b: 18, meal_s: 48, meal_l: 130, transit: 7.5, taxi: 2.0,
    attractions: [
      { name: 'Brandenburg Gate & Pariser Platz Stroll', category: 'National Monument', price: 0, hours: 1.5 },
      { name: 'Reichstag Building Glass Dome & Parliament Access', category: 'Historic Parliament', price: 0, hours: 2.0 },
      { name: 'Museum Island (Pergamon & Neues Museum Pass)', category: 'UNESCO Museum Complex', price: 24, hours: 4.0 },
      { name: 'East Side Gallery & Berlin Wall Memorial', category: 'Historical Memorial', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Florence', country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Birthplace of the Renaissance housing masterpieces by Michelangelo, Da Vinci, and Brunelleschi.',
    image: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
    acc_b: 38, acc_s: 115, acc_l: 310, meal_b: 19, meal_s: 50, meal_l: 140, transit: 6.5, taxi: 1.7,
    attractions: [
      { name: 'Uffizi Gallery Renaissance Masterpieces Tour', category: 'World Art Gallery', price: 25, hours: 3.5 },
      { name: 'Florence Duomo & Brunelleschi\'s Dome Climb', category: 'Renaissance Cathedral', price: 20, hours: 2.5 },
      { name: 'Galleria dell\'Accademia (Michelangelo\'s David)', category: 'Sculpture Museum', price: 16, hours: 2.0 },
      { name: 'Ponte Vecchio Medieval Bridge & Piazzale Sunset', category: 'Historic Bridge', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Budapest', country: 'Hungary', currency: 'HUF', symbol: 'Ft', rate: 0.23,
    desc: 'Queen of the Danube bisected by the river, renowned for mineral thermal spas and 19th-century architecture.',
    image: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80',
    acc_b: 9500, acc_s: 28000, acc_l: 75000, meal_b: 4500, meal_s: 12000, meal_l: 32000, transit: 1800, taxi: 450,
    attractions: [
      { name: 'Hungarian Parliament Building Guided Interior Tour', category: 'Gothic Revival Parliament', price: 6000, hours: 2.0 },
      { name: 'Széchenyi Thermal Bath Full Day Spa Ticket', category: 'Historic Thermal Bath', price: 10500, hours: 4.0 },
      { name: 'Buda Castle & Fisherman\'s Bastion Panorama', category: 'Medieval Fortress', price: 1200, hours: 3.0 },
      { name: 'Danube Evening Sightseeing Cruise with Welcome Drink', category: 'River Cruise', price: 5500, hours: 1.5 }
    ]
  },
  {
    city: 'Lisbon', country: 'Portugal', currency: 'EUR', symbol: '€', rate: 90.5,
    desc: 'Coastal capital of Portugal renowned for pastel-colored buildings, Fado music, and historic yellow trams.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    acc_b: 30, acc_s: 90, acc_l: 240, meal_b: 15, meal_s: 40, meal_l: 110, transit: 6.0, taxi: 1.4,
    attractions: [
      { name: 'Belém Tower UNESCO Maritime Fortress', category: 'Maritime Monument', price: 8, hours: 2.0 },
      { name: 'Jerónimos Monastery Manueline Masterpiece', category: 'Historic Monastery', price: 12, hours: 2.5 },
      { name: 'Historic Tram 28 Scenic Hills Route', category: 'Heritage Transit', price: 3, hours: 1.5 },
      { name: 'Castelo de São Jorge Panoramic Viewpoint', category: 'Moorish Castle', price: 15, hours: 2.0 }
    ]
  },

  // ==========================================
  // ASIA & PACIFIC
  // ==========================================
  {
    city: 'Kyoto', country: 'Japan', currency: 'JPY', symbol: '¥', rate: 0.56,
    desc: 'Former imperial capital of Japan famed for thousands of classical Buddhist temples, shrines, and traditional wooden houses.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    acc_b: 3500, acc_s: 11000, acc_l: 32000, meal_b: 1500, meal_s: 4500, meal_l: 12000, transit: 700, taxi: 350,
    attractions: [
      { name: 'Fushimi Inari Taisha (10,000 Torii Gates Trail)', category: 'Shinto Shrine', price: 0, hours: 3.0 },
      { name: 'Kinkaku-ji (Golden Pavilion) Zen Temple', category: 'Zen Temple', price: 500, hours: 2.0 },
      { name: 'Arashiyama Bamboo Grove & Tenryu-ji Temple', category: 'Natural Wonder', price: 500, hours: 2.5 },
      { name: 'Gion Historic Geisha District Walking Tour', category: 'Cultural Quarter', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Hanoi', country: 'Vietnam', currency: 'VND', symbol: '₫', rate: 0.0034,
    desc: 'Vietnam\'s thousand-year-old capital known for French-colonial architecture, street food culture, and lakes.',
    image: 'https://images.unsplash.com/photo-1509030450996-93d0774a3f5a?auto=format&fit=crop&w=800&q=80',
    acc_b: 350000, acc_s: 1100000, acc_l: 3200000, meal_b: 150000, meal_s: 400000, meal_l: 1100000, transit: 80000, taxi: 15000,
    attractions: [
      { name: 'Halong Bay UNESCO World Heritage Day Cruise', category: 'Scenic Limestone Bay', price: 950000, hours: 8.0 },
      { name: 'Hanoi Old Quarter Street Food & Cyclo Tour', category: 'Culinary Walk', price: 250000, hours: 3.0 },
      { name: 'Temple of Literature (First University of Vietnam)', category: 'Confucian Temple', price: 30000, hours: 2.0 },
      { name: 'Ho Chi Minh Mausoleum & One Pillar Pagoda', category: 'National Monument', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Kuala Lumpur', country: 'Malaysia', currency: 'MYR', symbol: 'RM', rate: 19.5,
    desc: 'Modern metropolis crowned by the world-famous Petronas Twin Towers, night markets, and Batu Caves.',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
    acc_b: 65, acc_s: 200, acc_l: 600, meal_b: 25, meal_s: 70, meal_l: 200, transit: 15, taxi: 3.0,
    attractions: [
      { name: 'Petronas Twin Towers Skybridge & 86th Floor', category: 'Twin Skyscrapers', price: 80, hours: 2.0 },
      { name: 'Batu Caves Murugan Statue & 272 Rainbow Steps', category: 'Hindu Cave Temple', price: 0, hours: 2.5 },
      { name: 'KL Tower (Menara KL) Sky Deck & Box View', category: 'Observation Tower', price: 60, hours: 1.5 },
      { name: 'Jalan Alor Famous Night Street Food Market', category: 'Food Market', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Hong Kong', country: 'Hong Kong', currency: 'HKD', symbol: 'HK$', rate: 10.8,
    desc: 'Dazzling skyscraper skyline where East meets West, harbor ferries, and mountain peaks.',
    image: 'https://images.unsplash.com/photo-1506970845346-22b00a297ba7?auto=format&fit=crop&w=800&q=80',
    acc_b: 280, acc_s: 850, acc_l: 2500, meal_b: 90, meal_s: 260, meal_l: 750, transit: 30, taxi: 9.0,
    attractions: [
      { name: 'Victoria Peak Historic Tram & Sky Terrace 428', category: 'Skyline Tram', price: 99, hours: 2.5 },
      { name: 'Tian Tan (Big Buddha) & Po Lin Monastery Cable Car', category: 'Giant Buddha & Cable Car', price: 235, hours: 4.0 },
      { name: 'Star Ferry Victoria Harbour Sunset Crossing', category: 'Heritage Ferry', price: 5, hours: 1.0 },
      { name: 'Hong Kong Disneyland Resort Day Pass', category: 'Theme Park', price: 639, hours: 6.0 }
    ]
  },
  {
    city: 'Taipei', country: 'Taiwan', currency: 'TWD', symbol: 'NT$', rate: 2.65,
    desc: 'Dynamic tech metropolis famous for night markets, thermal hot springs, and Taipei 101.',
    image: 'https://images.unsplash.com/photo-1508247967583-7d982ea01526?auto=format&fit=crop&w=800&q=80',
    acc_b: 850, acc_s: 2600, acc_l: 7500, meal_b: 250, meal_s: 700, meal_l: 2000, transit: 100, taxi: 25,
    attractions: [
      { name: 'Taipei 101 Observatory (89th Floor High-Speed Lift)', category: 'Skyscraper Observatory', price: 600, hours: 2.0 },
      { name: 'National Palace Museum Imperial Treasures', category: 'Imperial Art Museum', price: 350, hours: 3.5 },
      { name: 'Shilin Night Market Michelin Bib Gourmand Trail', category: 'Night Street Food', price: 0, hours: 2.5 },
      { name: 'Jiufen Mountain Old Village & Tea House Excursion', category: 'Heritage Mountain Town', price: 200, hours: 4.0 }
    ]
  },

  // ==========================================
  // AMERICAS
  // ==========================================
  {
    city: 'San Francisco', country: 'United States', currency: 'USD', symbol: '$', rate: 84.0,
    desc: 'Iconic hilly California city known for the Golden Gate Bridge, cable cars, and Alcatraz Island.',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80',
    acc_b: 55, acc_s: 180, acc_l: 450, meal_b: 25, meal_s: 68, meal_l: 185, transit: 12, taxi: 3.0,
    attractions: [
      { name: 'Golden Gate Bridge Walk & Vista Point Lookout', category: 'Iconic Bridge', price: 0, hours: 2.5 },
      { name: 'Alcatraz Island Penitentiary Ferry & Audio Tour', category: 'Historic Penitentiary', price: 45, hours: 3.5 },
      { name: 'Fisherman\'s Wharf & Pier 39 Sea Lions', category: 'Harbour Promenade', price: 0, hours: 2.0 },
      { name: 'Historic Cable Car Ride (Powell-Hyde Line)', category: 'Heritage Cable Car', price: 8, hours: 1.0 }
    ]
  },
  {
    city: 'Los Angeles', country: 'United States', currency: 'USD', symbol: '$', rate: 84.0,
    desc: 'Entertainment capital of the world with Hollywood studios, Beverly Hills, and Pacific beaches.',
    image: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=800&q=80',
    acc_b: 55, acc_s: 175, acc_l: 440, meal_b: 24, meal_s: 65, meal_l: 180, transit: 11, taxi: 2.8,
    attractions: [
      { name: 'Universal Studios Hollywood Theme Park & Studio Tour', category: 'Movie Studio Theme Park', price: 109, hours: 7.0 },
      { name: 'Santa Monica Pier & Venice Beach Boardwalk', category: 'Oceanfront Pier', price: 0, hours: 3.0 },
      { name: 'Griffith Observatory & Hollywood Sign Viewpoint', category: 'Observatory & Landmark', price: 0, hours: 2.5 },
      { name: 'Hollywood Walk of Fame & TCL Chinese Theatre', category: 'Celebrity Walkway', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Vancouver', country: 'Canada', currency: 'CAD', symbol: 'C$', rate: 61.5,
    desc: 'Pacific coastal city surrounded by dramatic mountains, lush rainforests, and vibrant multicultural food.',
    image: 'https://images.unsplash.com/photo-1559511260-66a65e0982d5?auto=format&fit=crop&w=800&q=80',
    acc_b: 48, acc_s: 155, acc_l: 395, meal_b: 22, meal_s: 55, meal_l: 150, transit: 10, taxi: 2.3,
    attractions: [
      { name: 'Stanley Park Seawall & Totem Poles Bike Tour', category: 'Urban Forest Park', price: 0, hours: 3.0 },
      { name: 'Capilano Suspension Bridge Park & Treetops', category: 'Suspension Bridge', price: 65, hours: 2.5 },
      { name: 'Granville Island Public Market & Artisan Walk', category: 'Public Market', price: 0, hours: 2.0 },
      { name: 'Grouse Mountain Skyride & Peak Panorama', category: 'Mountain Resort', price: 75, hours: 3.5 }
    ]
  },
  {
    city: 'Rio de Janeiro', country: 'Brazil', currency: 'BRL', symbol: 'R$', rate: 15.2,
    desc: 'Marvelous City famed for Copacabana beach, Christ the Redeemer, samba rhythms, and Carnival.',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80',
    acc_b: 95, acc_s: 300, acc_l: 850, meal_b: 45, meal_s: 120, meal_l: 340, transit: 18, taxi: 4.5,
    attractions: [
      { name: 'Christ the Redeemer & Corcovado Cog Train', category: 'Wonder of the World', price: 110, hours: 3.0 },
      { name: 'Sugarloaf Mountain (Pão de Açúcar) Cable Car', category: 'Cable Car Viewpoint', price: 150, hours: 2.5 },
      { name: 'Copacabana & Ipanema Famous Beach Walk', category: 'World Famous Beach', price: 0, hours: 2.5 },
      { name: 'Selarón Steps (Escadaria Selarón) Lapa Tour', category: 'Ceramic Mosaic Art', price: 0, hours: 1.5 }
    ]
  },
  {
    city: 'Cancun', country: 'Mexico', currency: 'MXN', symbol: '$', rate: 4.3,
    desc: 'Caribbean resort jewel famous for turquoise waters, white sand beaches, and ancient Mayan ruins.',
    image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80',
    acc_b: 400, acc_s: 1400, acc_l: 4500, meal_b: 200, meal_s: 550, meal_l: 1600, transit: 60, taxi: 18,
    attractions: [
      { name: 'Chichen Itza UNESCO Mayan Pyramid Guided Tour', category: 'Wonder of the World', price: 614, hours: 5.0 },
      { name: 'Xcaret Eco-Archaeological Theme Park Day Pass', category: 'Eco Theme Park', price: 2100, hours: 7.0 },
      { name: 'Isla Mujeres Catamaran Cruise & Snorkeling', category: 'Catamaran Reef Cruise', price: 1200, hours: 5.0 },
      { name: 'Playa Delfines (El Mirador) Lookout Beach', category: 'Public Beach', price: 0, hours: 2.0 }
    ]
  },

  // ==========================================
  // MIDDLE EAST & AFRICA
  // ==========================================
  {
    city: 'Cairo', country: 'Egypt', currency: 'EGP', symbol: 'E£', rate: 1.75,
    desc: 'Sprawling capital along the Nile, home to the Great Pyramids of Giza and ancient pharaonic treasures.',
    image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80',
    acc_b: 650, acc_s: 2000, acc_l: 6500, meal_b: 250, meal_s: 700, meal_l: 2000, transit: 70, taxi: 15,
    attractions: [
      { name: 'Great Pyramids of Giza & Great Sphinx Entry', category: 'Wonder of Ancient World', price: 540, hours: 4.0 },
      { name: 'The Grand Egyptian Museum (GEM) Antiquities', category: 'World Museum of Antiquities', price: 450, hours: 3.5 },
      { name: 'Khan el-Khalili Historic Medieval Bazaar', category: '14th-Century Souq', price: 0, hours: 2.5 },
      { name: 'Felucca Traditional Sailboat Cruise on the Nile', category: 'Nile Sailing', price: 300, hours: 1.5 }
    ]
  },
  {
    city: 'Istanbul', country: 'Turkey', currency: 'TRY', symbol: '₺', rate: 2.45,
    desc: 'Transcontinental metropolis bridging Europe and Asia across the Bosphorus Strait.',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    acc_b: 600, acc_s: 1800, acc_l: 5500, meal_b: 220, meal_s: 600, meal_l: 1800, transit: 65, taxi: 18,
    attractions: [
      { name: 'Hagia Sophia Grand Mosque Historical Tour', category: 'Byzantine Architectural Wonder', price: 850, hours: 2.5 },
      { name: 'Topkapi Palace & Imperial Harem Access', category: 'Ottoman Imperial Palace', price: 1500, hours: 3.5 },
      { name: 'Bosphorus Sunset Sightseeing Cruise', category: 'Intercontinental Cruise', price: 450, hours: 2.0 },
      { name: 'Grand Bazaar & Spice Market Heritage Walk', category: 'Historic Covered Market', price: 0, hours: 2.5 }
    ]
  },
  {
    city: 'Cape Town', country: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 4.8,
    desc: 'Port city crowned by Table Mountain, Atlantic coastlines, and Cape Peninsula penguins.',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
    acc_b: 350, acc_s: 1100, acc_l: 3200, meal_b: 160, meal_s: 420, meal_l: 1200, transit: 50, taxi: 12,
    attractions: [
      { name: 'Table Mountain Aerial Cableway Return Ticket', category: 'Mountain Cableway', price: 420, hours: 3.0 },
      { name: 'Boulders Beach African Penguin Colony', category: 'Wildlife Penguin Sanctuary', price: 190, hours: 2.0 },
      { name: 'Cape of Good Hope & Cape Point Nature Reserve', category: 'Historic Oceanic Cape', price: 376, hours: 4.0 },
      { name: 'V&A Waterfront Promenade & Robben Island Ferry', category: 'Harbour Promenade', price: 0, hours: 2.5 }
    ]
  },
  {
    city: 'Marrakech', country: 'Morocco', currency: 'MAD', symbol: 'DH', rate: 8.5,
    desc: 'Historic imperial city of mosques, palaces, lush gardens, and bustling vibrant medinas.',
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80',
    acc_b: 220, acc_s: 700, acc_l: 2100, meal_b: 95, meal_s: 260, meal_l: 750, transit: 25, taxi: 6.0,
    attractions: [
      { name: 'Jardin Majorelle & Yves Saint Laurent Museum', category: 'Botanical Sanctuary', price: 150, hours: 2.0 },
      { name: 'Bahia Palace 19th-Century Islamic Architecture', category: 'Islamic Royal Palace', price: 70, hours: 2.0 },
      { name: 'Jemaa el-Fnaa Medina Square Street Performance', category: 'UNESCO Cultural Square', price: 0, hours: 2.5 },
      { name: 'Koutoubia Mosque Gardens & Historic Minaret', category: 'Historic Mosque Gardens', price: 0, hours: 1.5 }
    ]
  },

  // ==========================================
  // OCEANIA
  // ==========================================
  {
    city: 'Melbourne', country: 'Australia', currency: 'AUD', symbol: 'A$', rate: 55.5,
    desc: 'Australia\'s cultural hub known for coffee culture, hidden laneways, street art, and coastal roads.',
    image: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=800&q=80',
    acc_b: 48, acc_s: 150, acc_l: 390, meal_b: 22, meal_s: 55, meal_l: 150, transit: 10, taxi: 2.4,
    attractions: [
      { name: 'Great Ocean Road & 12 Apostles Day Tour', category: 'Scenic Coastal Wonder', price: 145, hours: 8.0 },
      { name: 'Melbourne Skydeck (88th Floor Southern View)', category: 'Skydeck Observatory', price: 38, hours: 2.0 },
      { name: 'Royal Botanic Gardens Victoria Guided Walk', category: 'Botanical Gardens', price: 0, hours: 2.5 },
      { name: 'Hosier Lane Street Art & Laneway Coffee Trail', category: 'Street Art & Laneways', price: 0, hours: 2.0 }
    ]
  },
  {
    city: 'Queenstown', country: 'New Zealand', currency: 'NZD', symbol: 'NZ$', rate: 51.5,
    desc: 'Adventure capital of the world set against the dramatic Southern Alps on Lake Wakatipu.',
    image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80',
    acc_b: 52, acc_s: 165, acc_l: 430, meal_b: 24, meal_s: 60, meal_l: 165, transit: 10, taxi: 2.8,
    attractions: [
      { name: 'Milford Sound UNESCO Glacier Fjord Cruise', category: 'Glacier Fjord Cruise', price: 165, hours: 8.0 },
      { name: 'Skyline Queenstown Gondola & Gravity Luge', category: 'Mountain Gondola & Luge', price: 73, hours: 3.0 },
      { name: 'TSS Earnslaw Vintage Steamship Cruise & Farm', category: 'Vintage Steamship Cruise', price: 99, hours: 3.5 },
      { name: 'Queenstown Gardens & Lake Wakatipu Peninsula', category: 'Alpine Lake Peninsula', price: 0, hours: 2.0 }
    ]
  }
];

async function seedWorld() {
  console.log('Seeding World Destinations across Europe, Asia, Americas, Africa & Oceania...');

  for (const d of WORLD_DESTINATIONS) {
    try {
      const dest = await prisma.destination.upsert({
        where: {
          city_name_country_name: {
            city_name: d.city,
            country_name: d.country
          }
        },
        update: {
          currency_code: d.currency,
          currency_symbol: d.symbol,
          description: d.desc,
          image_url: d.image
        },
        create: {
          city_name: d.city,
          country_name: d.country,
          currency_code: d.currency,
          currency_symbol: d.symbol,
          description: d.desc,
          image_url: d.image
        }
      });

      await prisma.costOfLivingIndex.upsert({
        where: { destination_id: dest.destination_id },
        update: {
          accommodation_budget_night: d.acc_b,
          accommodation_standard_night: d.acc_s,
          accommodation_luxury_night: d.acc_l,
          meal_budget_day: d.meal_b,
          meal_standard_day: d.meal_s,
          meal_luxury_day: d.meal_l,
          transit_pass_day: d.transit,
          taxi_per_km: d.taxi,
          exchange_rate_to_inr: d.rate,
          source: 'GLOBAL_TRAVEL_INDEX_AI',
          confidence_score: 0.98,
          last_synced_at: new Date()
        },
        create: {
          destination_id: dest.destination_id,
          accommodation_budget_night: d.acc_b,
          accommodation_standard_night: d.acc_s,
          accommodation_luxury_night: d.acc_l,
          meal_budget_day: d.meal_b,
          meal_standard_day: d.meal_s,
          meal_luxury_day: d.meal_l,
          transit_pass_day: d.transit,
          taxi_per_km: d.taxi,
          exchange_rate_to_inr: d.rate,
          source: 'GLOBAL_TRAVEL_INDEX_AI',
          confidence_score: 0.98
        }
      });

      for (const attr of d.attractions) {
        const ticketInr = Math.round(attr.price * d.rate);
        const existingAttr = await prisma.attraction.findFirst({
          where: { destination_id: dest.destination_id, name: attr.name }
        });
        if (!existingAttr) {
          await prisma.attraction.create({
            data: {
              destination_id: dest.destination_id,
              name: attr.name,
              category: attr.category,
              ticket_price_local: attr.price,
              ticket_price_inr: ticketInr,
              avg_duration_hours: attr.hours,
              recommended_style: 'ALL'
            }
          });
        }
      }
      console.log(`[SEEDED] ${d.city}, ${d.country} (${d.currency}) with ${d.attractions.length} spots`);
    } catch (err) {
      console.error(`Error seeding ${d.city}:`, err.message);
    }
  }

  // Also fix Ongole and Puri to India
  try {
    const fixDests = await prisma.destination.findMany({
      where: { OR: [{ city_name: 'Ongole' }, { city_name: 'Puri' }] }
    });
    for (const fd of fixDests) {
      await prisma.destination.update({
        where: { destination_id: fd.destination_id },
        data: { country_name: 'India', currency_code: 'INR', currency_symbol: '₹' }
      });
      await prisma.costOfLivingIndex.updateMany({
        where: { destination_id: fd.destination_id },
        data: { exchange_rate_to_inr: 1.0 }
      });
      console.log(`[FIXED] Updated ${fd.city_name} to India (INR)`);
    }
  } catch (e) {
    console.error('Error fixing Ongole/Puri:', e.message);
  }

  const total = await prisma.destination.count();
  console.log(`\nDONE! Total destinations in database now: ${total}`);
}

seedWorld().catch(console.error).finally(() => prisma.$disconnect());
