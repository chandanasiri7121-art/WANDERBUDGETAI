// ============================================================================
// WanderBudget AI — Database Seed Script
// Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting WanderBudget AI Seeding (24BAI0226) ---');

  // 1. Seed Budget Categories
  const categoriesData = [
    { category_code: 'ACCOMMODATION', category_name: 'Hotels & Accommodation', icon: 'Hotel' },
    { category_code: 'FOOD', category_name: 'Food & Dining', icon: 'Utensils' },
    { category_code: 'SIGHTSEEING', category_name: 'Attractions & Sightseeing', icon: 'Camera' },
    { category_code: 'TRANSIT', category_name: 'Local Transport & Cabs', icon: 'Bus' },
    { category_code: 'BUFFER', category_name: 'Emergency & Buffer Fund', icon: 'ShieldAlert' },
    { category_code: 'MISC', category_name: 'Shopping & Miscellaneous', icon: 'ShoppingBag' }
  ];

  for (const cat of categoriesData) {
    await prisma.budgetCategory.upsert({
      where: { category_code: cat.category_code },
      update: cat,
      create: cat
    });
  }
  console.log('✔ Budget categories seeded');

  // 2. Seed Users
  const studentPassword = await bcrypt.hash('Traveler@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const travelerUser = await prisma.user.upsert({
    where: { reg_no: '24BAI0226' },
    update: {},
    create: {
      reg_no: '24BAI0226',
      full_name: 'Garudaiahgari Sai Siri Chandana',
      email: 'saisirichandana.g2024@vitstudent.ac.in',
      password_hash: studentPassword,
      role: 'TRAVELER',
      home_currency: 'INR'
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { reg_no: 'ADMIN_24BAI0226' },
    update: {},
    create: {
      reg_no: 'ADMIN_24BAI0226',
      full_name: 'Garudaiahgari Sai Siri Chandana (System Admin)',
      email: 'admin.wanderbudget@vit.ac.in',
      password_hash: adminPassword,
      role: 'ADMIN',
      home_currency: 'INR'
    }
  });
  console.log('✔ Users seeded (Traveler: 24BAI0226, Admin: ADMIN_24BAI0226)');

  // 3. Seed Destinations with Cost of Living Indices & Attractions
  const destinationsData = [
    {
      city_name: 'Tokyo',
      country_name: 'Japan',
      currency_code: 'JPY',
      currency_symbol: '¥',
      description: 'Futuristic metropolis blending historic shrines, world-class culinary art, and high-speed rail.',
      image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      cost_index: {
        accommodation_budget_night: 4500,     // ~2,500 INR
        accommodation_standard_night: 14000,  // ~7,800 INR
        accommodation_luxury_night: 40000,    // ~22,000 INR
        meal_budget_day: 2200,                // ~1,200 INR
        meal_standard_day: 6500,              // ~3,600 INR
        meal_luxury_day: 18000,               // ~10,000 INR
        transit_pass_day: 1000,               // ~560 INR (Tokyo Subway 24h)
        taxi_per_km: 450,
        exchange_rate_to_inr: 0.56,
        source: 'LIVE_WEB_SEARCH_AI'
      },
      attractions: [
        { name: 'Tokyo Skytree Observatory', category: 'Observation Deck', ticket_price_local: 3100, ticket_price_inr: 1736, avg_duration_hours: 2.0, recommended_style: 'ALL' },
        { name: 'TeamLab Planets Immersive Digital Art', category: 'Modern Art', ticket_price_local: 3800, ticket_price_inr: 2128, avg_duration_hours: 2.5, recommended_style: 'ALL' },
        { name: 'Senso-ji Temple & Asakusa Market', category: 'Culture & Heritage', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0, recommended_style: 'BUDGET' },
        { name: 'Shinjuku Gyoen National Garden', category: 'Nature & Parks', ticket_price_local: 500, ticket_price_inr: 280, avg_duration_hours: 1.5, recommended_style: 'ALL' },
        { name: 'Akihabara Electric Town Tour', category: 'Pop Culture & Gaming', ticket_price_local: 1200, ticket_price_inr: 672, avg_duration_hours: 3.0, recommended_style: 'ALL' }
      ]
    },
    {
      city_name: 'Paris',
      country_name: 'France',
      currency_code: 'EUR',
      currency_symbol: '€',
      description: 'The City of Light famed for haute cuisine, the Eiffel Tower, art museums, and bohemian boulevards.',
      image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      cost_index: {
        accommodation_budget_night: 45,       // ~4,000 INR
        accommodation_standard_night: 130,    // ~11,700 INR
        accommodation_luxury_night: 350,      // ~31,500 INR
        meal_budget_day: 25,                  // ~2,250 INR
        meal_standard_day: 65,                // ~5,850 INR
        meal_luxury_day: 180,                 // ~16,200 INR
        transit_pass_day: 9.5,                // ~855 INR (Navigo Day Pass)
        taxi_per_km: 2.1,
        exchange_rate_to_inr: 90.50,
        source: 'LIVE_WEB_SEARCH_AI'
      },
      attractions: [
        { name: 'Louvre Museum Entrance', category: 'Art & History', ticket_price_local: 22, ticket_price_inr: 1991, avg_duration_hours: 3.5, recommended_style: 'ALL' },
        { name: 'Eiffel Tower Summit Access', category: 'Landmark', ticket_price_local: 35.3, ticket_price_inr: 3194, avg_duration_hours: 2.5, recommended_style: 'ALL' },
        { name: 'Palace of Versailles Full Estate', category: 'Royal Heritage', ticket_price_local: 32, ticket_price_inr: 2896, avg_duration_hours: 4.0, recommended_style: 'STANDARD' },
        { name: 'Seine River Sunset Cruise', category: 'Sightseeing', ticket_price_local: 18, ticket_price_inr: 1629, avg_duration_hours: 1.5, recommended_style: 'ALL' },
        { name: 'Montmartre & Sacré-Cœur Walking Tour', category: 'Culture & Views', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0, recommended_style: 'BUDGET' }
      ]
    },
    {
      city_name: 'Bali',
      country_name: 'Indonesia',
      currency_code: 'IDR',
      currency_symbol: 'Rp',
      description: 'Tropical paradise known for volcanic forested mountains, iconic rice paddies, beaches and coral reefs.',
      image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      cost_index: {
        accommodation_budget_night: 220000,    // ~1,166 INR
        accommodation_standard_night: 650000,   // ~3,445 INR
        accommodation_luxury_night: 2500000,   // ~13,250 INR
        meal_budget_day: 120000,               // ~636 INR
        meal_standard_day: 350000,             // ~1,855 INR
        meal_luxury_day: 950000,               // ~5,035 INR
        transit_pass_day: 80000,               // ~424 INR (Scooter rental/day)
        taxi_per_km: 7500,
        exchange_rate_to_inr: 0.0053,
        source: 'LIVE_WEB_SEARCH_AI'
      },
      attractions: [
        { name: 'Uluwatu Temple & Kecak Fire Dance', category: 'Cultural Performance', ticket_price_local: 150000, ticket_price_inr: 795, avg_duration_hours: 2.5, recommended_style: 'ALL' },
        { name: 'Tegallalang Rice Terraces & Swing', category: 'Nature & Scenery', ticket_price_local: 100000, ticket_price_inr: 530, avg_duration_hours: 2.0, recommended_style: 'ALL' },
        { name: 'Mount Batur Sunrise Trek', category: 'Adventure & Hiking', ticket_price_local: 450000, ticket_price_inr: 2385, avg_duration_hours: 5.0, recommended_style: 'STANDARD' },
        { name: 'Sacred Monkey Forest Sanctuary Ubud', category: 'Wildlife Sanctuary', ticket_price_local: 80000, ticket_price_inr: 424, avg_duration_hours: 1.5, recommended_style: 'ALL' },
        { name: 'Nusa Penida Island Day Tour', category: 'Island Excursion', ticket_price_local: 700000, ticket_price_inr: 3710, avg_duration_hours: 8.0, recommended_style: 'ALL' }
      ]
    },
    {
      city_name: 'Goa',
      country_name: 'India',
      currency_code: 'INR',
      currency_symbol: '₹',
      description: 'Sun-drenched coastal state renowned for Arabian Sea beaches, Portuguese architecture, and vibrant shacks.',
      image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      cost_index: {
        accommodation_budget_night: 1200,      // 1,200 INR
        accommodation_standard_night: 3800,    // 3,800 INR
        accommodation_luxury_night: 14000,     // 14,000 INR
        meal_budget_day: 700,                  // 700 INR
        meal_standard_day: 1800,               // 1,800 INR
        meal_luxury_day: 5500,                 // 5,500 INR
        transit_pass_day: 450,                 // 450 INR (Scooter / bike rental)
        taxi_per_km: 35,
        exchange_rate_to_inr: 1.0,
        source: 'LIVE_WEB_SEARCH_AI'
      },
      attractions: [
        { name: 'Dudhsagar Waterfalls Jeep Safari', category: 'Adventure & Nature', ticket_price_local: 1800, ticket_price_inr: 1800, avg_duration_hours: 5.0, recommended_style: 'ALL' },
        { name: 'Fort Aguada & Lighthouse Viewpoint', category: 'Heritage Fort', ticket_price_local: 50, ticket_price_inr: 50, avg_duration_hours: 1.5, recommended_style: 'ALL' },
        { name: 'Grand Island Scuba Diving & Snorkeling', category: 'Water Sports', ticket_price_local: 2800, ticket_price_inr: 2800, avg_duration_hours: 4.5, recommended_style: 'STANDARD' },
        { name: 'Basilica of Bom Jesus Heritage Tour', category: 'UNESCO Heritage', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 1.5, recommended_style: 'BUDGET' },
        { name: 'Mandovi River Sunset Cruise with Goan Folk Dance', category: 'Cruise', ticket_price_local: 500, ticket_price_inr: 500, avg_duration_hours: 2.0, recommended_style: 'ALL' }
      ]
    },
    {
      city_name: 'Zurich',
      country_name: 'Switzerland',
      currency_code: 'CHF',
      currency_symbol: 'CHF',
      description: 'Alpine banking powerhouse on Lake Zurich, offering pristine mountain vistas, Swiss chocolate, and luxury living.',
      image_url: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80',
      cost_index: {
        accommodation_budget_night: 70,        // ~6,650 INR
        accommodation_standard_night: 210,     // ~19,950 INR
        accommodation_luxury_night: 600,       // ~57,000 INR
        meal_budget_day: 35,                   // ~3,325 INR
        meal_standard_day: 90,                 // ~8,550 INR
        meal_luxury_day: 240,                  // ~22,800 INR
        transit_pass_day: 14,                  // ~1,330 INR (Zürich Card)
        taxi_per_km: 4.5,
        exchange_rate_to_inr: 95.0,
        source: 'LIVE_WEB_SEARCH_AI'
      },
      attractions: [
        { name: 'Mount Uetliberg Top of Zurich Train & View', category: 'Alpine View', ticket_price_local: 18, ticket_price_inr: 1710, avg_duration_hours: 3.0, recommended_style: 'ALL' },
        { name: 'Lindt Home of Chocolate Interactive Tour', category: 'Culinary Museum', ticket_price_local: 17, ticket_price_inr: 1615, avg_duration_hours: 2.0, recommended_style: 'ALL' },
        { name: 'Lake Zurich Cruise & Promenade', category: 'Lake Cruise', ticket_price_local: 12, ticket_price_inr: 1140, avg_duration_hours: 2.0, recommended_style: 'ALL' },
        { name: 'Swiss National Museum', category: 'History & Culture', ticket_price_local: 13, ticket_price_inr: 1235, avg_duration_hours: 2.5, recommended_style: 'ALL' },
        { name: 'Altstadt (Old Town) Historic Guided Walk', category: 'Walking Tour', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 2.0, recommended_style: 'BUDGET' }
      ]
    },
    {
      city_name: 'Manali',
      country_name: 'India',
      currency_code: 'INR',
      currency_symbol: '₹',
      description: 'Himalayan resort town on the Beas River, famed for snow-capped peaks, Solang Valley sports, and pine forests.',
      image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
      cost_index: {
        accommodation_budget_night: 900,       // 900 INR
        accommodation_standard_night: 2800,    // 2,800 INR
        accommodation_luxury_night: 9500,      // 9,500 INR
        meal_budget_day: 550,                  // 550 INR
        meal_standard_day: 1400,               // 1,400 INR
        meal_luxury_day: 3500,                 // 3,500 INR
        transit_pass_day: 600,                 // 600 INR (Local cab/rental share)
        taxi_per_km: 25,
        exchange_rate_to_inr: 1.0,
        source: 'LIVE_WEB_SEARCH_AI'
      },
      attractions: [
        { name: 'Solang Valley Paragliding & Adventure Hub', category: 'Extreme Sports', ticket_price_local: 2500, ticket_price_inr: 2500, avg_duration_hours: 4.0, recommended_style: 'ALL' },
        { name: 'Rohtang Pass Snow Excursion Permit', category: 'Snow Mountain Pass', ticket_price_local: 1200, ticket_price_inr: 1200, avg_duration_hours: 6.0, recommended_style: 'STANDARD' },
        { name: 'Hadimba Devi Ancient Temple in Cedar Forest', category: 'Heritage Temple', ticket_price_local: 20, ticket_price_inr: 20, avg_duration_hours: 1.0, recommended_style: 'ALL' },
        { name: 'Jogini Waterfall Trek & Vashisht Hot Springs', category: 'Nature Trek', ticket_price_local: 0, ticket_price_inr: 0, avg_duration_hours: 3.5, recommended_style: 'BUDGET' },
        { name: 'Old Manali Cafe Crawl & Riverside Stroll', category: 'Food & Culture', ticket_price_local: 600, ticket_price_inr: 600, avg_duration_hours: 2.5, recommended_style: 'ALL' }
      ]
    }
  ];

  for (const destData of destinationsData) {
    const { cost_index, attractions, ...destFields } = destData;
    const dest = await prisma.destination.upsert({
      where: {
        city_name_country_name: {
          city_name: destFields.city_name,
          country_name: destFields.country_name
        }
      },
      update: destFields,
      create: destFields
    });

    // Upsert cost index
    await prisma.costOfLivingIndex.upsert({
      where: { destination_id: dest.destination_id },
      update: { ...cost_index },
      create: { ...cost_index, destination_id: dest.destination_id }
    });

    // Upsert attractions
    for (const attr of attractions) {
      const existing = await prisma.attraction.findFirst({
        where: { destination_id: dest.destination_id, name: attr.name }
      });
      if (existing) {
        await prisma.attraction.update({
          where: { attraction_id: existing.attraction_id },
          data: attr
        });
      } else {
        await prisma.attraction.create({
          data: { ...attr, destination_id: dest.destination_id }
        });
      }
    }
  }
  console.log(`✔ Seeded ${destinationsData.length} destinations with live cost indices and attractions`);

  // 4. Seed a Sample Dynamic Trip for Student Traveler
  const tokyoDest = await prisma.destination.findFirst({ where: { city_name: 'Tokyo' } });
  const sampleTrip = await prisma.trip.create({
    data: {
      user_id: travelerUser.user_id,
      destination_id: tokyoDest.destination_id,
      title: 'Tokyo 5-Day Tech & Cultural Odyssey',
      duration_days: 5,
      travel_style: 'STANDARD',
      group_size: 2,
      total_budget_inr: 95000,
      total_spent_inr: 12500,
      status: 'PLANNING'
    }
  });

  const categories = await prisma.budgetCategory.findMany();
  const catMap = Object.fromEntries(categories.map(c => [c.category_code, c.category_id]));

  // Breakdown
  const sampleBreakdown = [
    { category_id: catMap['ACCOMMODATION'], allocated_amount_inr: 39000, spent_amount_inr: 8000 },
    { category_id: catMap['FOOD'], allocated_amount_inr: 36000, spent_amount_inr: 3500 },
    { category_id: catMap['SIGHTSEEING'], allocated_amount_inr: 7700, spent_amount_inr: 1000 },
    { category_id: catMap['TRANSIT'], allocated_amount_inr: 5600, spent_amount_inr: 0 },
    { category_id: catMap['BUFFER'], allocated_amount_inr: 6700, spent_amount_inr: 0 }
  ];

  for (const b of sampleBreakdown) {
    if (b.category_id) {
      await prisma.tripBudgetBreakdown.create({
        data: { trip_id: sampleTrip.trip_id, ...b }
      });
    }
  }

  // Sample Expenses
  await prisma.tripExpense.create({
    data: {
      trip_id: sampleTrip.trip_id,
      category_id: catMap['ACCOMMODATION'],
      user_id: travelerUser.user_id,
      expense_name: 'Shinjuku Hotel Deposit (2 nights)',
      amount_inr: 8000,
      currency_code: 'JPY',
      amount_original: 14285,
      payment_method: 'CARD',
      notes: 'Initial booking advance via Agoda'
    }
  });

  await prisma.tripExpense.create({
    data: {
      trip_id: sampleTrip.trip_id,
      category_id: catMap['FOOD'],
      user_id: travelerUser.user_id,
      expense_name: 'Ichiran Ramen Dinner for 2',
      amount_inr: 3500,
      currency_code: 'JPY',
      amount_original: 6250,
      payment_method: 'CASH',
      notes: 'Dinner after flight arrival'
    }
  });

  await prisma.tripExpense.create({
    data: {
      trip_id: sampleTrip.trip_id,
      category_id: catMap['SIGHTSEEING'],
      user_id: travelerUser.user_id,
      expense_name: 'Tokyo Skytree Fast Pass',
      amount_inr: 1000,
      currency_code: 'JPY',
      amount_original: 1785,
      payment_method: 'UPI',
      notes: 'Advance booking slot'
    }
  });

  // Seed Audit Log
  await prisma.auditLog.create({
    data: {
      user_id: travelerUser.user_id,
      action: 'TRIP_BUDGET_CREATED',
      entity_type: 'TRIP',
      entity_id: sampleTrip.trip_id,
      ip_address: '127.0.0.1',
      details: 'Created Tokyo 5-Day Standard trip with 95,000 INR dynamic budget'
    }
  });

  console.log('✔ Sample trip, budget breakdown, and expenses seeded successfully');
  console.log('--- WanderBudget AI Seeding Finished (24BAI0226) ---');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
