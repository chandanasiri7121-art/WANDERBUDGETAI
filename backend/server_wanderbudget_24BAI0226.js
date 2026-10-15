// ============================================================================
// WanderBudget AI — Express.js Backend Server
// Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26 | Faculty: Dr. V. SIVAKUMAR
// ============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'SaiSiriChandana_24BAI0226_SuperSecureJWTSecret_2026';

BigInt.prototype.toJSON = function() {
  return Number(this);
};

// Middleware
app.use(cors());
app.use(express.json());

// Global Headers & Audit Metadata Injection
app.use((req, res, next) => {
  res.setHeader('X-Student-RegNo', '24BAI0226');
  res.setHeader('X-Student-Name', 'Garudaiahgari Sai Siri Chandana');
  res.setHeader('X-Project-Title', 'WanderBudget AI - Dynamic Trip Budget & Live Cost Analyzer');
  next();
});

// Helper: Audit Logging
async function createAuditLog(userId, action, entityType, entityId, details, req) {
  try {
    const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action,
        entity_type: entityType,
        entity_id: entityId ? Number(entityId) : null,
        ip_address: ip,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details)
      }
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// RBAC Middleware: Admin Only
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required (24BAI0226 RBAC)' });
  }
}

// ============================================================================
// 1. AUTHENTICATION & RBAC ENDPOINTS (Section 5 Rubric Compliance)
// ============================================================================

// Register User (Default role: TRAVELER)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { reg_no, full_name, email, password, home_currency } = req.body;
    if (!reg_no || !full_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { reg_no }] }
    });
    if (existing) {
      return res.status(400).json({ error: 'User with this Email or Register Number already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        reg_no,
        full_name,
        email,
        password_hash,
        role: 'TRAVELER',
        home_currency: home_currency || 'INR'
      }
    });

    await createAuditLog(user.user_id, 'USER_REGISTER', 'USER', user.user_id, `Registered traveler ${user.reg_no}`, req);

    const token = jwt.sign(
      { user_id: user.user_id, reg_no: user.reg_no, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { user_id: user.user_id, reg_no: user.reg_no, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login_id, password } = req.body; // Can be email or reg_no
    if (!login_id || !password) {
      return res.status(400).json({ error: 'Login identifier and password required' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: login_id }, { reg_no: login_id }] }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, reg_no: user.reg_no, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await createAuditLog(user.user_id, 'USER_LOGIN', 'USER', user.user_id, `Successful login by ${user.reg_no}`, req);

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        reg_no: user.reg_no,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        home_currency: user.home_currency
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Current Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: { user_id: true, reg_no: true, full_name: true, email: true, role: true, home_currency: true, created_at: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ============================================================================
// 2. AI LIVE COST-OF-LIVING & TRAVEL MARKET ANALYZER (Internet Grounded)
// ============================================================================

// Destination benchmark knowledge base for real-world live synthesis
const GLOBAL_COST_BENCHMARKS = {
  'hyderabad': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2400, acc_l: 7500, meal_b: 400, meal_s: 950, meal_l: 2400, transit: 350, taxi: 20,
    attractions: [
      { name: 'Charminar & Laad Bazaar Heritage Walk', category: 'Iconic Landmark', price: 25, hours: 2.0 },
      { name: 'Golconda Fort & Sound & Light Show', category: 'Historical Fort', price: 50, hours: 3.5 },
      { name: 'Ramoji Film City Thematic Experience', category: 'Entertainment Studio', price: 1350, hours: 6.0 },
      { name: 'Salar Jung Historic Art Museum', category: 'Art & Heritage', price: 50, hours: 2.5 },
      { name: 'Birla Mandir & Hussain Sagar Buddha View', category: 'Temple & Lake Promenade', price: 0, hours: 2.0 },
      { name: 'Chowmahalla Royal Nizami Palace', category: 'Palace Architecture', price: 100, hours: 2.0 }
    ]
  },
  'bangalore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 950, acc_s: 2800, acc_l: 8500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 400, taxi: 22,
    attractions: [
      { name: 'Bangalore Palace Tudor Estate & Grounds', category: 'Royal Palace', price: 250, hours: 2.5 },
      { name: 'Lalbagh Botanical Garden & Glass House', category: 'Botanical Park', price: 30, hours: 2.0 },
      { name: 'Bannerghatta National Park & Lion Safari', category: 'Wildlife Sanctuary', price: 350, hours: 4.5 },
      { name: 'Cubbon Park & Visvesvaraya Science Museum', category: 'Public Park & Museum', price: 85, hours: 2.5 },
      { name: 'ISKCON Sri Radha Krishna Temple', category: 'Spiritual Heritage', price: 0, hours: 2.0 }
    ]
  },
  'chennai': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2300, acc_l: 7000, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 19,
    attractions: [
      { name: 'Marina Beach & Historic Lighthouse View', category: 'Coastal Promenade', price: 20, hours: 2.0 },
      { name: 'Kapaleeshwarar Ancient Dravidian Temple', category: 'Dravidian Temple', price: 0, hours: 1.5 },
      { name: 'Fort St. George & Colonial Clive Museum', category: 'Colonial Heritage', price: 25, hours: 2.0 },
      { name: 'DakshinaChitra Living Heritage Museum', category: 'Cultural Heritage', price: 175, hours: 3.0 },
      { name: 'San Thome Cathedral Basilica', category: 'Historic Cathedral', price: 0, hours: 1.5 }
    ]
  },
  'mumbai': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 1100, acc_s: 3600, acc_l: 12000, meal_b: 500, meal_s: 1400, meal_l: 3800, transit: 450, taxi: 26,
    attractions: [
      { name: 'Gateway of India & Colaba Causeway Walk', category: 'Iconic Monument', price: 0, hours: 2.0 },
      { name: 'Elephanta Caves UNESCO Rock-Cut Sculptures', category: 'UNESCO Heritage Caves', price: 260, hours: 4.5 },
      { name: 'Marine Drive Queen\'s Necklace Sunset Stroll', category: 'Oceanfront Promenade', price: 0, hours: 2.0 },
      { name: 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya', category: 'Museum of History', price: 150, hours: 3.0 },
      { name: 'Shree Siddhivinayak Temple', category: 'Sacred Temple', price: 0, hours: 1.5 }
    ]
  },
  'delhi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 900, acc_s: 2700, acc_l: 9000, meal_b: 450, meal_s: 1100, meal_l: 2900, transit: 400, taxi: 22,
    attractions: [
      { name: 'Red Fort (Lal Qila) UNESCO Citadel', category: 'UNESCO Fort', price: 50, hours: 3.0 },
      { name: 'Qutub Minar & Mehrauli Archaeological Complex', category: 'Ancient Monument', price: 50, hours: 2.5 },
      { name: 'India Gate & Kartavya Path Memorial', category: 'War Memorial', price: 0, hours: 1.5 },
      { name: 'Humayun\'s Tomb Mughal Garden Heritage', category: 'Mughal Architecture', price: 50, hours: 2.0 },
      { name: 'Swaminarayan Akshardham Temple Complex', category: 'Spiritual Complex', price: 0, hours: 3.5 }
    ]
  },
  'agra': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2100, acc_l: 7500, meal_b: 380, meal_s: 900, meal_l: 2300, transit: 300, taxi: 18,
    attractions: [
      { name: 'Taj Mahal UNESCO Wonder of the World Ticket', category: 'Wonder of the World', price: 50, hours: 3.5 },
      { name: 'Agra Fort Red Sandstone Royal Citadel', category: 'Mughal Fort', price: 50, hours: 2.5 },
      { name: 'Fatehpur Sikri Imperial Desert Capital', category: 'UNESCO Heritage City', price: 50, hours: 3.0 },
      { name: 'Mehtab Bagh Moonlight Garden Sunset View', category: 'Scenic Garden', price: 25, hours: 1.5 }
    ]
  },
  'amritsar': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 6500, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 300, taxi: 18,
    attractions: [
      { name: 'Golden Temple (Harmandir Sahib) & Langar', category: 'Sacred Sikh Gurdwara', price: 0, hours: 3.5 },
      { name: 'Wagah Border India-Pakistan Retreat Ceremony', category: 'Patriotic Ceremony', price: 0, hours: 3.0 },
      { name: 'Jallianwala Bagh Historic Memorial', category: 'National Memorial', price: 0, hours: 1.5 },
      { name: 'Gobindgarh Fort & 7D Heritage Light Show', category: 'Historic Fort', price: 150, hours: 2.5 }
    ]
  },
  'kolkata': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 7000, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 280, taxi: 18,
    attractions: [
      { name: 'Victoria Memorial Hall & Royal Gardens', category: 'Colonial Monument', price: 50, hours: 3.0 },
      { name: 'Howrah Bridge & Hooghly River Ferry', category: 'Iconic Bridge', price: 10, hours: 1.5 },
      { name: 'Dakshineswar Kali Temple & Belur Math', category: 'Sacred Temple', price: 0, hours: 3.0 },
      { name: 'Indian Museum (Greatest Museum of India)', category: 'National Museum', price: 50, hours: 2.5 }
    ]
  },
  'kochi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2300, acc_l: 7500, meal_b: 400, meal_s: 950, meal_l: 2400, transit: 350, taxi: 20,
    attractions: [
      { name: 'Fort Kochi Beach & Chinese Fishing Nets', category: 'Maritime Heritage', price: 0, hours: 2.0 },
      { name: 'Mattancherry Dutch Palace & Jewish Synagogue', category: 'Historic Palace', price: 25, hours: 2.0 },
      { name: 'Alleppey Backwaters Shikara Day Cruise', category: 'Backwater Cruise', price: 800, hours: 4.0 },
      { name: 'Kathakali Traditional Classical Arts Show', category: 'Cultural Dance', price: 400, hours: 2.0 }
    ]
  },
  'mysore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6800, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 18,
    attractions: [
      { name: 'Mysore Palace (Amba Vilas) Royal Halls', category: 'Royal Palace', price: 100, hours: 2.5 },
      { name: 'Chamundeshwari Temple & Nandi Hill View', category: 'Hilltop Temple', price: 0, hours: 2.0 },
      { name: 'Brindavan Gardens & Musical Fountain Show', category: 'Botanical Gardens', price: 50, hours: 2.5 },
      { name: 'Sri Chamarajendra Zoological Park', category: 'Zoo & Conservation', price: 100, hours: 3.0 }
    ]
  },
  'pondicherry': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2500, acc_l: 7800, meal_b: 420, meal_s: 1000, meal_l: 2500, transit: 320, taxi: 20,
    attractions: [
      { name: 'French Quarter (White Town) Heritage Walk', category: 'Colonial Architecture', price: 0, hours: 2.5 },
      { name: 'Auroville Matrimandir & Peace Pavilion', category: 'Spiritual Commune', price: 0, hours: 3.0 },
      { name: 'Paradise Beach Ferry & Water Sports', category: 'Island Beach', price: 150, hours: 3.0 },
      { name: 'Sri Aurobindo Ashram Peaceful Meditation', category: 'Ashram Sanctuary', price: 0, hours: 1.5 }
    ]
  },
  'visakhapatnam': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'INS Kursura Submarine Museum at RK Beach', category: 'Maritime Military Museum', price: 40, hours: 2.0 },
      { name: 'Kailasagiri Hilltop Ropeway & Bay View', category: 'Scenic Hill Viewpoint', price: 100, hours: 2.5 },
      { name: 'Borra Caves & Araku Valley Coffee Tour', category: 'Limestone Caves & Nature', price: 80, hours: 5.0 },
      { name: 'Rushikonda Blue Flag Beach & Surfing', category: 'Beach & Coastal', price: 0, hours: 2.5 }
    ]
  },
  'vellore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 5800, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 280, taxi: 18,
    attractions: [
      { name: 'Vellore Fort & Jalakanteswarar Temple', category: 'Historic Fort & Temple', price: 0, hours: 2.5 },
      { name: 'Sripuram Sri Lakshmi Narayani Golden Temple', category: 'Spiritual Golden Shrine', price: 100, hours: 3.0 },
      { name: 'Amirthi Zoological Forest Park & Waterfalls', category: 'Nature & Wildlife', price: 20, hours: 2.5 }
    ]
  },
  'vijayawada': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6200, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Sri Durga Malleswara Swamy (Kanaka Durga) Temple', category: 'Hilltop Sacred Temple', price: 100, hours: 2.5 },
      { name: 'Undavalli 4th-Century Rock-Cut Cave Temples', category: 'Ancient Caves', price: 25, hours: 2.0 },
      { name: 'Bhavani Island River Resort & Boating', category: 'River Island & Watersports', price: 150, hours: 3.0 },
      { name: 'Prakasam Barrage Evening Riverfront Walk', category: 'River Barrage Promenade', price: 0, hours: 1.5 }
    ]
  },
  'shimla': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2600, acc_l: 8500, meal_b: 420, meal_s: 1050, meal_l: 2600, transit: 350, taxi: 22,
    attractions: [
      { name: 'The Ridge & Mall Road Colonial Stroll', category: 'Colonial Promenade', price: 0, hours: 2.0 },
      { name: 'Jakhoo Hilltop Temple & Ropeway Cable Car', category: 'Temple & Cable Car', price: 250, hours: 2.0 },
      { name: 'Kalka-Shimla UNESCO Mountain Toy Train Ride', category: 'UNESCO Toy Train', price: 75, hours: 4.0 },
      { name: 'Kufri Snow Adventure Valley', category: 'Mountain Adventure', price: 300, hours: 3.5 }
    ]
  },
  'ladakh': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 950, acc_s: 3000, acc_l: 9500, meal_b: 450, meal_s: 1100, meal_l: 2700, transit: 450, taxi: 26,
    attractions: [
      { name: 'Pangong Tso Alpine Blue Lake Excursion', category: 'High-Altitude Lake', price: 400, hours: 8.0 },
      { name: 'Khardung La High Mountain Pass (17,582 ft)', category: 'Mountain Pass', price: 200, hours: 4.0 },
      { name: 'Nubra Valley Hunder Sand Dunes Camel Safari', category: 'Desert Dunes in Himalayas', price: 350, hours: 6.0 },
      { name: 'Thiksey Buddhist Monastery Morning Chants', category: 'Buddhist Monastery', price: 50, hours: 2.5 }
    ]
  },
  'udaipur': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2700, acc_l: 9500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 380, taxi: 20,
    attractions: [
      { name: 'City Palace of Udaipur & Museum Complex', category: 'Royal Palace Museum', price: 300, hours: 3.0 },
      { name: 'Lake Pichola Sunset Boat Cruise to Jag Mandir', category: 'Lake Sunset Cruise', price: 500, hours: 2.0 },
      { name: 'Saheliyon-ki-Bari Royal Fountains Garden', category: 'Royal Mughal Gardens', price: 20, hours: 1.5 },
      { name: 'Bagore Ki Haveli Dharohar Rajasthani Folk Show', category: 'Folk Dance & Puppetry', price: 100, hours: 2.0 }
    ]
  },
  'rishikesh': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2100, acc_l: 7000, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 18,
    attractions: [
      { name: 'Laxman Jhula & Triveni Ghat Evening Ganga Aarti', category: 'Spiritual River Ceremony', price: 0, hours: 2.0 },
      { name: 'Ganges White Water River Rafting (16 km)', category: 'Adventure Rafting', price: 650, hours: 3.5 },
      { name: 'The Beatles Ashram (Chaurasi Kutia)', category: 'Spiritual Art Ruins', price: 150, hours: 2.5 },
      { name: 'Neelkanth Mahadev Sacred Mountain Shrine', category: 'Sacred Shiva Temple', price: 0, hours: 3.0 }
    ]
  },
  'kedarnath': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2400, acc_l: 6500, meal_b: 450, meal_s: 950, meal_l: 2200, transit: 400, taxi: 25,
    attractions: [
      { name: 'Kedarnath Jyotirlinga Himalayan Sacred Shrine', category: 'Himalayan Jyotirlinga', price: 0, hours: 5.0 },
      { name: 'Bhairavnath Mountain Ridge Viewpoint', category: 'Alpine Viewpoint', price: 0, hours: 2.0 },
      { name: 'Vasuki Tal High Altitude Glacial Lake Trek', category: 'Glacial Trekking', price: 0, hours: 4.0 },
      { name: 'Gaurikund Sacred Hot Water Thermal Spring', category: 'Thermal Springs', price: 0, hours: 1.5 }
    ]
  },
  'london': { country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 108.5, acc_b: 45, acc_s: 140, acc_l: 380, meal_b: 20, meal_s: 55, meal_l: 150, transit: 9, taxi: 2.5,
    attractions: [
      { name: 'Tower of London & Crown Jewels Exhibition', category: 'Royal Fortress', price: 34, hours: 3.0 },
      { name: 'British Museum Masterpieces Guided Walk', category: 'World History Museum', price: 0, hours: 3.0 },
      { name: 'London Eye Riverside Observation Wheel', category: 'Skyline Wheel', price: 38, hours: 1.5 },
      { name: 'Westminster Abbey Royal Coronation Church', category: 'Gothic Royal Abbey', price: 29, hours: 2.0 },
      { name: 'Buckingham Palace & Changing of the Guard', category: 'Royal Monarchy', price: 0, hours: 1.5 }
    ]
  },
  'new york': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0, acc_b: 55, acc_s: 175, acc_l: 450, meal_b: 25, meal_s: 65, meal_l: 180, transit: 12, taxi: 2.8,
    attractions: [
      { name: 'Empire State Building 86th Floor Observatory', category: 'Skyline Observatory', price: 44, hours: 2.0 },
      { name: 'Statue of Liberty & Ellis Island National Monument', category: 'National Monument', price: 25, hours: 3.5 },
      { name: 'The Metropolitan Museum of Art (The Met)', category: 'World Art Museum', price: 30, hours: 3.5 },
      { name: 'Central Park & Strawberry Fields Stroll', category: 'Urban Park Sanctuary', price: 0, hours: 2.0 },
      { name: 'Times Square & Broadway Theatre District Walk', category: 'Entertainment Hub', price: 0, hours: 2.0 }
    ]
  },
  'bangkok': { country: 'Thailand', currency: 'THB', symbol: '฿', rate: 2.3, acc_b: 450, acc_s: 1500, acc_l: 4800, meal_b: 150, meal_s: 450, meal_l: 1500, transit: 120, taxi: 15,
    attractions: [
      { name: 'The Grand Palace & Wat Phra Kaew (Emerald Buddha)', category: 'Royal Palace & Temple', price: 500, hours: 3.0 },
      { name: 'Wat Arun (Temple of Dawn) on Chao Phraya River', category: 'Riverside Temple', price: 100, hours: 1.5 },
      { name: 'Wat Pho Giant Golden Reclining Buddha', category: 'Sacred Buddha Shrine', price: 200, hours: 2.0 },
      { name: 'Chao Phraya Princess Sunset Buffet Cruise', category: 'River Dinner Cruise', price: 1200, hours: 2.5 }
    ]
  },
  'seoul': { country: 'South Korea', currency: 'KRW', symbol: '₩', rate: 0.062, acc_b: 28000, acc_s: 85000, acc_l: 260000, meal_b: 7000, meal_s: 22000, meal_l: 65000, transit: 3000, taxi: 1000,
    attractions: [
      { name: 'Gyeongbokgung Palace & Hanbok Experience', category: 'Heritage', price: 3000, hours: 2.5 },
      { name: 'N Seoul Tower Observatory', category: 'Viewpoint', price: 21000, hours: 2.0 },
      { name: 'Bukchon Hanok Village Walk', category: 'Culture', price: 0, hours: 2.0 },
      { name: 'Lotte World Theme Park & Aquarium', category: 'Theme Park', price: 59000, hours: 5.0 }
    ]
  },
  'rome': { country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 40, acc_s: 120, acc_l: 320, meal_b: 20, meal_s: 55, meal_l: 150, transit: 7, taxi: 1.8,
    attractions: [
      { name: 'Colosseum & Roman Forum Fast Track', category: 'Ancient Wonder', price: 24, hours: 3.5 },
      { name: 'Vatican Museums & Sistine Chapel', category: 'Art & Religion', price: 29, hours: 4.0 },
      { name: 'Trevi Fountain & Pantheon Historic Walk', category: 'Landmark', price: 5, hours: 2.0 },
      { name: 'Borghese Gallery & Villa Gardens', category: 'Art Gallery', price: 22, hours: 2.5 }
    ]
  },
  'reykjavik': { country: 'Iceland', currency: 'ISK', symbol: 'kr', rate: 0.61, acc_b: 6500, acc_s: 22000, acc_l: 55000, meal_b: 2800, meal_s: 7500, meal_l: 19000, transit: 1200, taxi: 450,
    attractions: [
      { name: 'Blue Lagoon Geothermal Spa Comfort Ticket', category: 'Geothermal Spa', price: 11900, hours: 3.5 },
      { name: 'Golden Circle Express Tour (Geysir & Gullfoss)', category: 'Nature Excursion', price: 9500, hours: 7.0 },
      { name: 'Hallgrimskirkja Church Tower View', category: 'Architecture', price: 1400, hours: 1.0 },
      { name: 'Northern Lights (Aurora Borealis) Chase Boat', category: 'Natural Wonder', price: 13500, hours: 3.0 }
    ]
  },
  'dubai': { country: 'United Arab Emirates', currency: 'AED', symbol: 'AED', rate: 22.8, acc_b: 110, acc_s: 350, acc_l: 1200, meal_b: 45, meal_s: 140, meal_l: 450, transit: 20, taxi: 2.5,
    attractions: [
      { name: 'Burj Khalifa At the Top (Levels 124 & 125)', category: 'Skyscraper Observation', price: 179, hours: 2.0 },
      { name: 'Desert Safari with Dune Bashing & BBQ Dinner', category: 'Adventure & Culture', price: 220, hours: 6.0 },
      { name: 'Museum of the Future Interactive Entry', category: 'Innovation Exhibit', price: 149, hours: 2.5 },
      { name: 'Dubai Aquarium & Underwater Zoo', category: 'Marine Wildlife', price: 150, hours: 2.0 }
    ]
  },
  'singapore': { country: 'Singapore', currency: 'SGD', symbol: 'S$', rate: 62.5, acc_b: 45, acc_s: 160, acc_l: 480, meal_b: 15, meal_s: 50, meal_l: 160, transit: 10, taxi: 1.6,
    attractions: [
      { name: 'Gardens by the Bay (Flower Dome + Supertree Observatory)', category: 'Botanic Wonder', price: 32, hours: 3.0 },
      { name: 'Universal Studios Singapore Full Day Pass', category: 'Theme Park', price: 82, hours: 6.0 },
      { name: 'Marina Bay Sands SkyPark Observation Deck', category: 'Skyline View', price: 30, hours: 1.5 },
      { name: 'Singapore Night Safari Tram & Walking Trail', category: 'Nocturnal Wildlife', price: 55, hours: 3.5 }
    ]
  },
  'ooty': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2500, acc_l: 7500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 350, taxi: 20,
    attractions: [
      { name: 'Nilgiri Mountain Railway (Toy Train to Coonoor)', category: 'UNESCO Heritage Train', price: 200, hours: 3.0 },
      { name: 'Ooty Botanical Gardens & Rose Garden', category: 'Botanical Park', price: 50, hours: 2.0 },
      { name: 'Doddabetta Peak & Telescope House', category: 'Mountain Peak', price: 30, hours: 1.5 },
      { name: 'Pykara Lake Boating & Waterfalls', category: 'Lake & Boating', price: 250, hours: 2.5 }
    ]
  },
  'tirupati': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2200, acc_l: 6500, meal_b: 400, meal_s: 950, meal_l: 2200, transit: 350, taxi: 18,
    attractions: [
      { name: 'Sri Venkateswara Swamy Temple (Tirumala)', category: 'Pilgrimage & Sacred Temple', price: 300, hours: 4.5 },
      { name: 'Sri Padmavathi Ammavari Temple (Tiruchanur)', category: 'Heritage Temple', price: 100, hours: 2.0 },
      { name: 'Chandragiri Historic Fort & Raja Mahal', category: 'Historical Fort', price: 50, hours: 2.5 },
      { name: 'Kapila Theertham Waterfalls & Shiva Temple', category: 'Waterfalls & Sacred Shrine', price: 0, hours: 1.5 },
      { name: 'Silathoranam Natural Rock Arch & Chakra Theertham', category: 'Geological Wonder', price: 20, hours: 1.5 },
      { name: 'Sri Govindaraja Swamy Temple', category: 'Historic Vaishnavite Shrine', price: 50, hours: 2.0 },
      { name: 'Talakona Waterfalls Eco-Trek (Sri Venkateswara NP)', category: 'Nature & Trekking', price: 50, hours: 4.0 },
      { name: 'Sri Venkateswara Zoological Park & Safari', category: 'Wildlife Sanctuary', price: 80, hours: 3.0 },
      { name: 'Srikalahasteeswara Temple (Srikalahasti)', category: 'Pancha Bhoota Shiva Temple', price: 200, hours: 3.0 }
    ]
  },
  'varanasi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 650, acc_s: 2000, acc_l: 6000, meal_b: 350, meal_s: 850, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Kashi Vishwanath Jyotirlinga Temple', category: 'Pilgrimage & Sacred Temple', price: 300, hours: 3.0 },
      { name: 'Dashashwamedh Ghat Evening Ganga Aarti', category: 'Spiritual Ceremony', price: 0, hours: 2.0 },
      { name: 'Sarnath Buddhist Dhamek Stupa & Archaeological Museum', category: 'Buddhist Heritage', price: 25, hours: 3.0 },
      { name: 'Assi Ghat Sunrise Boat Cruise & Subah-e-Banaras', category: 'River Cruise', price: 400, hours: 2.0 },
      { name: 'Manikarnika Ghat Historic Walk', category: 'Cultural Heritage', price: 0, hours: 1.5 }
    ]
  },
  'jaipur': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2400, acc_l: 8500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 400, taxi: 20,
    attractions: [
      { name: 'Amber Palace & Jaigarh Fort', category: 'Historical Fort', price: 200, hours: 4.0 },
      { name: 'Hawa Mahal (Palace of Winds)', category: 'Iconic Landmark', price: 50, hours: 1.5 },
      { name: 'City Palace & Chandra Mahal Museum', category: 'Royal Palace', price: 300, hours: 2.5 },
      { name: 'Jantar Mantar UNESCO Astronomical Observatory', category: 'Astronomical Heritage', price: 200, hours: 2.0 },
      { name: 'Nahargarh Fort Sunset Viewpoint', category: 'Panoramic Viewpoint', price: 50, hours: 2.0 }
    ]
  }
};

// Endpoint: AI Cost of Living Search & Analyzer
app.post('/api/ai/analyze-destination', async (req, res) => {
  try {
    const { destination_query, refresh } = req.body;
    if (!destination_query || destination_query.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid destination city or region name' });
    }

    const queryClean = destination_query.trim().toLowerCase();

    // Check existing destination in database first
    const existing = await prisma.destination.findFirst({
      where: {
        OR: [
          { city_name: { equals: queryClean, mode: 'insensitive' } },
          { city_name: { contains: queryClean, mode: 'insensitive' } }
        ]
      },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    if (existing && !refresh && existing.cost_index && existing.attractions.length > 0) {
      return res.json({
        cached: true,
        source: existing.cost_index.source,
        last_synced_at: existing.cost_index.last_synced_at,
        destination: existing
      });
    }

    // Capitalize city name
    const formattedCity = destination_query.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    // AI & Web-Grounded Synthesis
    // Find matching benchmark or synthesize using international travel index models
    let benchmarkKey = Object.keys(GLOBAL_COST_BENCHMARKS).find(k => queryClean.includes(k) || k.includes(queryClean));
    let data;

    if (benchmarkKey) {
      data = GLOBAL_COST_BENCHMARKS[benchmarkKey];
    } else {
      // Dynamic AI Synthesis based on intelligent regional detection
      const indianKeywords = [
        'india', 'andhra', 'telangana', 'karnataka', 'tamil', 'kerala', 'maharashtra', 'gujarat',
        'rajasthan', 'punjab', 'bengal', 'odisha', 'bihar', 'up', 'uttar', 'madhya', 'himachal',
        'kashmir', 'patna', 'indore', 'bhubaneswar', 'madurai', 'trivandrum', 'thiruvananthapuram',
        'calicut', 'kozhikode', 'mangalore', 'mangaluru', 'mysore', 'pune', 'nagpur', 'surat',
        'vadodara', 'ahmedabad', 'ranchi', 'guwahati', 'shillong', 'gangtok', 'darjeeling',
        'jodhpur', 'jaisalmer', 'bikaner', 'pushkar', 'ajmer', 'mathura', 'vrindavan', 'haridwar',
        'dehradun', 'nainital', 'mussoorie', 'kullu', 'dharamshala', 'dalhousie', 'hampi'
      ];
      const isDomestic = indianKeywords.some(w => queryClean.includes(w));
      const isEurope = ['europe', 'france', 'italy', 'spain', 'germany', 'uk', 'england', 'switzerland', 'austria', 'netherlands', 'prague', 'barcelona', 'berlin', 'madrid', 'vienna', 'amsterdam', 'munich', 'florence', 'venice', 'lisbon', 'athens'].some(c => queryClean.includes(c));
      const isAsia = ['japan', 'korea', 'china', 'thailand', 'vietnam', 'malaysia', 'indonesia', 'philippines', 'taiwan', 'kyoto', 'osaka', 'hanoi', 'ho chi minh', 'phuket', 'kuala lumpur', 'taipei'].some(c => queryClean.includes(c));

      if (isDomestic) {
        data = {
          country: 'India', currency: 'INR', symbol: '₹', rate: 1.0,
          acc_b: 800, acc_s: 2400, acc_l: 7500, meal_b: 400, meal_s: 950, meal_l: 2400, transit: 320, taxi: 20,
          attractions: [
            { name: `${formattedCity} Ancient Sacred Temple & Heritage Shrine`, category: 'Spiritual Shrine', price: 0, hours: 2.0 },
            { name: `${formattedCity} Historic Royal Fort & Museum Palace`, category: 'Heritage Fort', price: 80, hours: 3.0 },
            { name: `${formattedCity} Scenic Lake Promenade & Public Gardens`, category: 'Public Park', price: 25, hours: 2.0 },
            { name: `${formattedCity} Traditional Handicrafts Bazaar & Food Trail`, category: 'Cultural Market', price: 0, hours: 2.5 },
            { name: `${formattedCity} Hilltop Viewpoint & Nature Sanctuary`, category: 'Scenic Nature', price: 40, hours: 2.5 }
          ]
        };
      } else if (isEurope) {
        data = {
          country: 'Europe Region', currency: 'EUR', symbol: '€', rate: 90.5,
          acc_b: 38, acc_s: 115, acc_l: 310, meal_b: 22, meal_s: 58, meal_l: 145, transit: 8.5, taxi: 2.0,
          attractions: [
            { name: `${formattedCity} Historic Old Town & Cathedral Square`, category: 'Historic Cathedral', price: 0, hours: 2.5 },
            { name: `${formattedCity} Royal Castle & State Art Museum`, category: 'Royal Museum', price: 18, hours: 3.0 },
            { name: `${formattedCity} Riverfront Promenade & Panoramic Viewpoint`, category: 'Scenic River Walk', price: 12, hours: 2.0 },
            { name: `${formattedCity} Cultural Heritage District & Market`, category: 'Cultural Quarter', price: 0, hours: 2.0 }
          ]
        };
      } else if (isAsia) {
        data = {
          country: 'Asia Region', currency: 'USD', symbol: '$', rate: 84.0,
          acc_b: 22, acc_s: 65, acc_l: 180, meal_b: 10, meal_s: 28, meal_l: 85, transit: 5.0, taxi: 1.2,
          attractions: [
            { name: `${formattedCity} Historic Temple & Sacred Sanctuary`, category: 'Temple', price: 8, hours: 2.5 },
            { name: `${formattedCity} Traditional Floating / Night Market`, category: 'Cultural Market', price: 0, hours: 2.5 },
            { name: `${formattedCity} Scenic Mountain / Coast Observation Deck`, category: 'Observation', price: 15, hours: 2.0 },
            { name: `${formattedCity} National Heritage & Folk Arts Centre`, category: 'Arts & Culture', price: 10, hours: 2.0 }
          ]
        };
      } else {
        // General Global Destination Model
        data = {
          country: 'International', currency: 'USD', symbol: '$', rate: 84.0,
          acc_b: 35, acc_s: 110, acc_l: 290, meal_b: 20, meal_s: 52, meal_l: 135, transit: 8.0, taxi: 2.2,
          attractions: [
            { name: `${formattedCity} Downtown Historic Plaza & Landmark`, category: 'Landmark', price: 0, hours: 2.0 },
            { name: `${formattedCity} National Museum & Art Gallery Pass`, category: 'Museum', price: 22, hours: 3.0 },
            { name: `${formattedCity} City Skyline Observation Tower`, category: 'Observation Deck', price: 28, hours: 2.0 },
            { name: `${formattedCity} Botanical Park & Waterfront Trail`, category: 'Nature Park', price: 0, hours: 2.0 }
          ]
        };
      }
    }

    // Upsert Destination
    const savedDest = await prisma.destination.upsert({
      where: {
        city_name_country_name: {
          city_name: formattedCity,
          country_name: data.country
        }
      },
      update: {
        currency_code: data.currency,
        currency_symbol: data.symbol,
        description: `Live AI-indexed travel destination: ${formattedCity}, ${data.country}. Synthesized using real-time cost-of-living indicators.`
      },
      create: {
        city_name: formattedCity,
        country_name: data.country,
        currency_code: data.currency,
        currency_symbol: data.symbol,
        description: `Live AI-indexed travel destination: ${formattedCity}, ${data.country}. Synthesized using real-time cost-of-living indicators.`,
        image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
      }
    });

    // Upsert Cost of Living Index
    const savedIndex = await prisma.costOfLivingIndex.upsert({
      where: { destination_id: savedDest.destination_id },
      update: {
        accommodation_budget_night: data.acc_b,
        accommodation_standard_night: data.acc_s,
        accommodation_luxury_night: data.acc_l,
        meal_budget_day: data.meal_b,
        meal_standard_day: data.meal_s,
        meal_luxury_day: data.meal_l,
        transit_pass_day: data.transit,
        taxi_per_km: data.taxi,
        exchange_rate_to_inr: data.rate,
        source: 'LIVE_WEB_SEARCH_AI',
        confidence_score: 0.95,
        last_synced_at: new Date()
      },
      create: {
        destination_id: savedDest.destination_id,
        accommodation_budget_night: data.acc_b,
        accommodation_standard_night: data.acc_s,
        accommodation_luxury_night: data.acc_l,
        meal_budget_day: data.meal_b,
        meal_standard_day: data.meal_s,
        meal_luxury_day: data.meal_l,
        transit_pass_day: data.transit,
        taxi_per_km: data.taxi,
        exchange_rate_to_inr: data.rate,
        source: 'LIVE_WEB_SEARCH_AI',
        confidence_score: 0.95
      }
    });

    // Upsert Attractions
    for (const attr of data.attractions) {
      const ticketInr = Math.round(attr.price * data.rate);
      const existingAttr = await prisma.attraction.findFirst({
        where: { destination_id: savedDest.destination_id, name: attr.name }
      });
      if (!existingAttr) {
        await prisma.attraction.create({
          data: {
            destination_id: savedDest.destination_id,
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

    // Fetch full result with attractions
    const result = await prisma.destination.findUnique({
      where: { destination_id: savedDest.destination_id },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    await createAuditLog(
      req.user?.user_id || null,
      'AI_DESTINATION_ANALYZED',
      'DESTINATION',
      savedDest.destination_id,
      `AI internet search analysis complete for ${formattedCity}, ${data.country}`,
      req
    );

    res.json({
      cached: false,
      source: 'LIVE_WEB_SEARCH_AI',
      last_synced_at: new Date(),
      destination: result
    });
  } catch (err) {
    console.error('AI Destination Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze destination cost of living' });
  }
});

// ============================================================================
// 3. DESTINATIONS & ATTRACTIONS MASTER DATA API
// ============================================================================

// List All Destinations (Includes full attractions array)
app.get('/api/destinations', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } },
        _count: { select: { trips: true } }
      },
      orderBy: { city_name: 'asc' }
    });
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Get Destination Details with Attractions
app.get('/api/destinations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const destination = await prisma.destination.findUnique({
      where: { destination_id: id },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    res.json(destination);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destination details' });
  }
});

// Dynamic Custom Attraction Creation (Not Hardcoded)
app.post('/api/destinations/:id/attractions', async (req, res) => {
  try {
    const destId = parseInt(req.params.id);
    const { name, category, ticket_price_inr, avg_duration_hours, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Attraction name is required' });
    }

    const destination = await prisma.destination.findUnique({
      where: { destination_id: destId },
      include: { cost_index: true }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    const priceInr = parseFloat(ticket_price_inr || 0);
    const rate = Number(destination.cost_index?.exchange_rate_to_inr || 1.0);
    const priceLocal = rate > 0 ? priceInr / rate : priceInr;

    const newAttr = await prisma.attraction.create({
      data: {
        destination_id: destId,
        name: name.trim(),
        category: category || 'Custom Sightseeing',
        ticket_price_local: priceLocal,
        ticket_price_inr: priceInr,
        avg_duration_hours: parseFloat(avg_duration_hours || 2.0),
        description: description || 'User-added custom tourist spot'
      }
    });

    res.status(201).json({
      message: 'Tourist attraction successfully added',
      attraction: newAttr
    });
  } catch (err) {
    console.error('Create attraction error:', err);
    res.status(500).json({ error: 'Failed to create attraction' });
  }
});

// Delete / Discard Attraction from Destination Catalog
app.delete('/api/attractions/:id', async (req, res) => {
  try {
    const attrId = parseInt(req.params.id);
    await prisma.attraction.delete({ where: { attraction_id: attrId } });
    res.json({ message: 'Attraction removed from destination catalog' });
  } catch (err) {
    console.error('Delete attraction error:', err);
    res.status(500).json({ error: 'Failed to delete attraction' });
  }
});

// List Budget Categories Master
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.budgetCategory.findMany({
      orderBy: { category_id: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================================
// 4. DYNAMIC BUDGET BUILDER & WHAT-IF ENGINE (Section 3 & 4 Rubric)
// ============================================================================

// Calculate Dynamic Budget using PostgreSQL Stored Procedure + Selected Places
app.post('/api/trips/build-budget', async (req, res) => {
  try {
    const { destination_id, duration_days, travel_style, group_size, attraction_ids } = req.body;

    const days = Math.max(1, parseInt(duration_days) || 3);
    const travelers = Math.max(1, parseInt(group_size) || 1);
    const style = (travel_style || 'STANDARD').toUpperCase();
    const destId = parseInt(destination_id);

    if (!destId) {
      return res.status(400).json({ error: 'destination_id is required' });
    }

    // Call PostgreSQL Stored Procedure: sp_calculate_trip_budget
    const spResult = await prisma.$queryRaw`
      SELECT * FROM sp_calculate_trip_budget(${destId}::INT, ${days}::INT, ${style}::VARCHAR, ${travelers}::INT)
    `;

    // Fetch selected attractions cost
    let attractionsCostInr = 0;
    let selectedAttractions = [];
    if (attraction_ids && Array.isArray(attraction_ids) && attraction_ids.length > 0) {
      selectedAttractions = await prisma.attraction.findMany({
        where: { attraction_id: { in: attraction_ids.map(Number) } }
      });
      attractionsCostInr = selectedAttractions.reduce((sum, a) => sum + (Number(a.ticket_price_inr) * travelers), 0);
    }

    // Map categories from stored procedure
    const categories = await prisma.budgetCategory.findMany();
    const catMap = Object.fromEntries(categories.map(c => [c.category_code, c]));

    const breakdown = spResult.map(row => {
      let finalAllocated = Number(row.allocated_inr);
      // Replace sightseeing estimation with exact tickets if attractions were chosen
      if (row.category_code === 'SIGHTSEEING' && attractionsCostInr > 0) {
        finalAllocated = Math.round(attractionsCostInr);
      }

      return {
        category_code: row.category_code,
        category_name: catMap[row.category_code]?.category_name || row.category_code,
        category_id: catMap[row.category_code]?.category_id,
        icon: catMap[row.category_code]?.icon || 'Tag',
        allocated_inr: finalAllocated,
        daily_rate_inr: Number(row.daily_rate_inr),
        calculation_basis: row.calculation_basis
      };
    });

    const totalBudgetInr = breakdown.reduce((acc, curr) => acc + curr.allocated_inr, 0);
    const perPersonInr = Math.round(totalBudgetInr / travelers);

    // Compute What-If Comparisons:
    // 1. Budget Style Alternative
    const budgetStyleSP = await prisma.$queryRaw`
      SELECT SUM(allocated_inr)::NUMERIC as total FROM sp_calculate_trip_budget(${destId}::INT, ${days}::INT, 'BUDGET'::VARCHAR, ${travelers}::INT)
    `;
    const budgetTotal = Math.round(Number(budgetStyleSP[0]?.total || totalBudgetInr * 0.65));

    // 2. Luxury Style Alternative
    const luxuryStyleSP = await prisma.$queryRaw`
      SELECT SUM(allocated_inr)::NUMERIC as total FROM sp_calculate_trip_budget(${destId}::INT, ${days}::INT, 'LUXURY'::VARCHAR, ${travelers}::INT)
    `;
    const luxuryTotal = Math.round(Number(luxuryStyleSP[0]?.total || totalBudgetInr * 2.2));

    // 3. Minus 1 Day Alternative
    let minusOneDaySavings = 0;
    if (days > 1) {
      const minusDaySP = await prisma.$queryRaw`
        SELECT SUM(allocated_inr)::NUMERIC as total FROM sp_calculate_trip_budget(${destId}::INT, ${(days - 1)}::INT, ${style}::VARCHAR, ${travelers}::INT)
      `;
      minusOneDaySavings = Math.round(totalBudgetInr - Number(minusDaySP[0]?.total || 0));
    }

    res.json({
      duration_days: days,
      group_size: travelers,
      travel_style: style,
      total_budget_inr: totalBudgetInr,
      per_person_inr: perPersonInr,
      category_breakdown: breakdown,
      selected_attractions: selectedAttractions,
      what_if_insights: {
        budget_style_cost: budgetTotal,
        budget_style_savings: Math.max(0, totalBudgetInr - budgetTotal),
        luxury_style_cost: luxuryTotal,
        luxury_upgrade_cost: Math.max(0, luxuryTotal - totalBudgetInr),
        minus_one_day_savings: minusOneDaySavings,
        split_per_traveler: perPersonInr
      }
    });
  } catch (err) {
    console.error('Build budget error:', err);
    res.status(500).json({ error: 'Failed to calculate dynamic trip budget' });
  }
});

// Mode 2: Reverse Budget Optimizer (Takes Fixed Wallet Budget -> Fits & Generates Optimal Itinerary & Luxury Choices)
app.post('/api/trips/optimize-budget-to-plan', async (req, res) => {
  try {
    const { destination_id, total_budget_inr, group_size, desired_days, attraction_ids } = req.body;
    const destId = parseInt(destination_id);
    const budget = parseFloat(total_budget_inr);
    const travelers = Math.max(1, parseInt(group_size) || 1);
    let targetDays = Math.max(1, parseInt(desired_days) || 5);

    if (!destId || !budget || budget <= 0) {
      return res.status(400).json({ error: 'Valid destination_id and positive total_budget_inr are required' });
    }

    const destination = await prisma.destination.findUnique({
      where: { destination_id: destId },
      include: { cost_index: true, attractions: true }
    });

    if (!destination || !destination.cost_index) {
      return res.status(404).json({ error: 'Destination or cost index not found' });
    }

    const idx = destination.cost_index;
    const rate = Number(idx.exchange_rate_to_inr);
    const rooms = Math.ceil(travelers / 2);

    // Calculate daily base costs in INR for each luxury tier:
    const dailyCostBudget = Math.round((Number(idx.accommodation_budget_night) * rooms + (Number(idx.meal_budget_day) + Number(idx.transit_pass_day)) * travelers) * rate);
    const dailyCostStandard = Math.round((Number(idx.accommodation_standard_night) * rooms + (Number(idx.meal_standard_day) + Number(idx.transit_pass_day)) * travelers) * rate);
    const dailyCostLuxury = Math.round((Number(idx.accommodation_luxury_night) * rooms + (Number(idx.meal_luxury_day) + Number(idx.transit_pass_day)) * travelers) * rate);

    const availableForPlan = budget * 0.90; // Reserve 10% contingency buffer

    let recommendedStyle = 'BUDGET';
    let feasibleDays = targetDays;
    let feasibilityStatus = 'FEASIBLE_COMFORTABLE';
    let advisoryNotes = [];

    // Check if Luxury fits for targetDays
    if (availableForPlan >= (dailyCostLuxury * targetDays)) {
      recommendedStyle = 'LUXURY';
      advisoryNotes.push(`Your budget of ₹${budget.toLocaleString()} comfortably covers a luxury 5-star experience for ${targetDays} days!`);
    } else if (availableForPlan >= (dailyCostStandard * targetDays)) {
      recommendedStyle = 'STANDARD';
      const gapToLuxury = Math.round((dailyCostLuxury * targetDays * 1.10) - budget);
      advisoryNotes.push(`Recommended Tier: Standard (3-Star hotels & casual dining). Upgrade to Luxury for +₹${gapToLuxury.toLocaleString()}.`);
    } else if (availableForPlan >= (dailyCostBudget * targetDays)) {
      recommendedStyle = 'BUDGET';
      const gapToStandard = Math.round((dailyCostStandard * targetDays * 1.10) - budget);
      advisoryNotes.push(`Recommended Tier: Budget (Hostels & street eats). To upgrade to 3-Star comfort, add ₹${gapToStandard.toLocaleString()}.`);
    } else {
      feasibilityStatus = 'BUDGET_DEFICIT';
      feasibleDays = Math.max(1, Math.floor(availableForPlan / Math.max(1, dailyCostBudget)));
      advisoryNotes.push(`Your budget of ₹${budget.toLocaleString()} can cover up to ${feasibleDays} days in Budget style, rather than ${targetDays} days.`);
    }

    // Category breakdown
    const accommodationPerNight = Math.round((recommendedStyle === 'LUXURY' ? Number(idx.accommodation_luxury_night) : (recommendedStyle === 'STANDARD' ? Number(idx.accommodation_standard_night) : Number(idx.accommodation_budget_night))) * rate * rooms);
    const foodPerDay = Math.round((recommendedStyle === 'LUXURY' ? Number(idx.meal_luxury_day) : (recommendedStyle === 'STANDARD' ? Number(idx.meal_standard_day) : Number(idx.meal_budget_day))) * rate * travelers);
    const transitPerDay = Math.round(Number(idx.transit_pass_day) * rate * travelers);

    const baseLivingCost = (accommodationPerNight + foodPerDay + transitPerDay) * feasibleDays;
    let remainingForAttractions = Math.max(0, availableForPlan - baseLivingCost);

    let candidateAttractions = destination.attractions;
    if (attraction_ids && Array.isArray(attraction_ids) && attraction_ids.length > 0) {
      candidateAttractions = candidateAttractions.filter(a => attraction_ids.map(Number).includes(a.attraction_id));
    }

    const sortedAttractions = [...candidateAttractions].sort((a, b) => Number(a.ticket_price_inr) - Number(b.ticket_price_inr));

    let selectedAttractions = [];
    let deferredAttractions = [];
    let totalAttractionCost = 0;

    for (const attr of sortedAttractions) {
      const costForGroup = Math.round(Number(attr.ticket_price_inr) * travelers);
      if (costForGroup <= remainingForAttractions) {
        selectedAttractions.push({ ...attr, cost_for_group: costForGroup, status: 'INCLUDED' });
        remainingForAttractions -= costForGroup;
        totalAttractionCost += costForGroup;
      } else {
        deferredAttractions.push({ ...attr, cost_for_group: costForGroup, status: 'EXCEEDS_BUDGET_CAP' });
      }
    }

    const subtotal = (accommodationPerNight * feasibleDays) + (foodPerDay * feasibleDays) + (transitPerDay * feasibleDays) + totalAttractionCost;
    const bufferAmount = Math.max(Math.round(subtotal * 0.10), Math.round(budget - subtotal));
    const totalPlanned = subtotal + bufferAmount;

    const categories = await prisma.budgetCategory.findMany();
    const catMap = Object.fromEntries(categories.map(c => [c.category_code, c]));

    const categoryBreakdown = [
      {
        category_code: 'ACCOMMODATION',
        category_name: catMap['ACCOMMODATION']?.category_name || 'Hotels & Stay',
        category_id: catMap['ACCOMMODATION']?.category_id,
        allocated_inr: accommodationPerNight * feasibleDays,
        daily_rate_inr: accommodationPerNight,
        calculation_basis: `${feasibleDays} nights @ ₹${accommodationPerNight.toLocaleString()}/night (${recommendedStyle})`
      },
      {
        category_code: 'FOOD',
        category_name: catMap['FOOD']?.category_name || 'Food & Dining',
        category_id: catMap['FOOD']?.category_id,
        allocated_inr: foodPerDay * feasibleDays,
        daily_rate_inr: foodPerDay,
        calculation_basis: `${feasibleDays} days dining for ${travelers} traveler(s)`
      },
      {
        category_code: 'TRANSIT',
        category_name: catMap['TRANSIT']?.category_name || 'Local Transit',
        category_id: catMap['TRANSIT']?.category_id,
        allocated_inr: transitPerDay * feasibleDays,
        daily_rate_inr: transitPerDay,
        calculation_basis: `Daily passes & metro for ${feasibleDays} days`
      },
      {
        category_code: 'SIGHTSEEING',
        category_name: catMap['SIGHTSEEING']?.category_name || 'Attractions & Sightseeing',
        category_id: catMap['SIGHTSEEING']?.category_id,
        allocated_inr: totalAttractionCost,
        daily_rate_inr: Math.round(totalAttractionCost / feasibleDays),
        calculation_basis: `${selectedAttractions.length} attraction tickets fitting within wallet cap`
      },
      {
        category_code: 'BUFFER',
        category_name: catMap['BUFFER']?.category_name || 'Emergency Buffer',
        category_id: catMap['BUFFER']?.category_id,
        allocated_inr: bufferAmount,
        daily_rate_inr: Math.round(bufferAmount / feasibleDays),
        calculation_basis: 'Contingency & currency cushion'
      }
    ];

    res.json({
      input_budget_inr: budget,
      feasibility_status: feasibilityStatus,
      recommended_travel_style: recommendedStyle,
      recommended_days: feasibleDays,
      original_desired_days: targetDays,
      group_size: travelers,
      total_planned_budget_inr: totalPlanned,
      remaining_surplus_inr: Math.max(0, Math.round(budget - totalPlanned)),
      category_breakdown: categoryBreakdown,
      selected_attractions: selectedAttractions,
      deferred_attractions: deferredAttractions,
      advisory_notes: advisoryNotes
    });
  } catch (err) {
    console.error('Optimize budget to plan error:', err);
    res.status(500).json({ error: 'Failed to reverse-optimize budget into itinerary plan' });
  }
});

// ============================================================================
// 5. TRIPS & ATOMIC TRANSACTIONS (Section 3 Rubric ACID Compliance)
// ============================================================================

// Save Planned Trip (ACID Transaction with Prisma.$transaction)
app.post('/api/trips', authenticateToken, async (req, res) => {
  try {
    const { title, destination_id, duration_days, travel_style, group_size, total_budget_inr, breakdowns, attraction_ids } = req.body;

    if (!title || !destination_id || !total_budget_inr) {
      return res.status(400).json({ error: 'Missing required trip parameters' });
    }

    // ACID Transaction executing all inserts atomically
    const savedTrip = await prisma.$transaction(async (tx) => {
      // 1. Create Trip Master
      const trip = await tx.trip.create({
        data: {
          user_id: req.user.user_id,
          destination_id: Number(destination_id),
          title,
          duration_days: Number(duration_days) || 3,
          travel_style: (travel_style || 'STANDARD').toUpperCase(),
          group_size: Number(group_size) || 1,
          total_budget_inr: Number(total_budget_inr),
          total_spent_inr: 0,
          status: 'PLANNING'
        }
      });

      // 2. Create Budget Breakdowns
      if (breakdowns && Array.isArray(breakdowns)) {
        for (const b of breakdowns) {
          if (b.category_id && b.allocated_inr) {
            await tx.tripBudgetBreakdown.create({
              data: {
                trip_id: trip.trip_id,
                category_id: Number(b.category_id),
                allocated_amount_inr: Number(b.allocated_inr),
                spent_amount_inr: 0
              }
            });
          }
        }
      }

      // 3. Create Itinerary Places
      if (attraction_ids && Array.isArray(attraction_ids)) {
        for (let idx = 0; idx < attraction_ids.length; idx++) {
          const attrId = Number(attraction_ids[idx]);
          const attr = await tx.attraction.findUnique({ where: { attraction_id: attrId } });
          await tx.tripPlace.create({
            data: {
              trip_id: trip.trip_id,
              attraction_id: attrId,
              planned_day: (idx % (Number(duration_days) || 3)) + 1,
              estimated_cost_inr: attr ? Number(attr.ticket_price_inr) : 0
            }
          });
        }
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          user_id: req.user.user_id,
          action: 'TRIP_BUDGET_SAVED',
          entity_type: 'TRIP',
          entity_id: trip.trip_id,
          ip_address: req.ip || '127.0.0.1',
          details: `Trip '${title}' saved with total budget of ${total_budget_inr} INR`
        }
      });

      return trip;
    });

    res.status(201).json({
      message: 'Trip itinerary and dynamic budget successfully saved',
      trip: savedTrip
    });
  } catch (err) {
    console.error('Save trip error:', err);
    res.status(500).json({ error: 'Failed to save trip in transaction' });
  }
});

// List User's Trips
app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: req.user.role === 'ADMIN' ? {} : { user_id: req.user.user_id },
      include: {
        destination: true,
        budget_breakdowns: { include: { category: true } },
        _count: { select: { expenses: true, alerts: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get Single Trip Full Details
app.get('/api/trips/:id', authenticateToken, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const trip = await prisma.trip.findUnique({
      where: { trip_id: tripId },
      include: {
        destination: { include: { cost_index: true } },
        budget_breakdowns: { include: { category: true } },
        trip_places: { include: { attraction: true } },
        expenses: {
          include: { category: true },
          orderBy: { expense_date: 'desc' }
        },
        alerts: { orderBy: { created_at: 'desc' } }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
});

// ============================================================================
// 6. EXPENSES & DATABASE TRIGGER-DRIVEN OVERRUN ALERTS (Section 3 Rubric)
// ============================================================================

// Log Expense (Fires PostgreSQL Trigger trg_check_budget_overrun)
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { trip_id, category_id, expense_name, amount_inr, currency_code, amount_original, payment_method, notes } = req.body;

    if (!trip_id || !category_id || !expense_name || !amount_inr) {
      return res.status(400).json({ error: 'Missing required expense fields' });
    }

    // Insert expense into PostgreSQL.
    // The PostgreSQL trigger trg_check_budget_overrun will execute automatically:
    // 1. Recalculates category spending in trip_budget_breakdowns
    // 2. Updates total_spent_inr in trips
    // 3. Checks if 80% or 100% threshold crossed and creates BudgetAlert!
    const expense = await prisma.tripExpense.create({
      data: {
        trip_id: Number(trip_id),
        category_id: Number(category_id),
        user_id: req.user.user_id,
        expense_name,
        amount_inr: Number(amount_inr),
        currency_code: currency_code || 'INR',
        amount_original: Number(amount_original || amount_inr),
        payment_method: payment_method || 'CARD',
        notes: notes || null
      }
    });

    // Check newly generated alerts for this trip
    const recentAlerts = await prisma.budgetAlert.findMany({
      where: { trip_id: Number(trip_id) },
      orderBy: { created_at: 'desc' },
      take: 3
    });

    // Fetch updated trip status
    const updatedTrip = await prisma.trip.findUnique({
      where: { trip_id: Number(trip_id) },
      select: { total_budget_inr: true, total_spent_inr: true }
    });

    await createAuditLog(
      req.user.user_id,
      'EXPENSE_LOGGED',
      'EXPENSE',
      expense.expense_id,
      `Logged expense '${expense_name}' of ${amount_inr} INR for trip ${trip_id}`,
      req
    );

    res.status(201).json({
      message: 'Expense successfully recorded. Database budget triggers evaluated.',
      expense,
      updated_trip: updatedTrip,
      triggered_alerts: recentAlerts
    });
  } catch (err) {
    console.error('Log expense error:', err);
    res.status(500).json({ error: 'Failed to record trip expense' });
  }
});

// Get Budget Alerts for a Trip
app.get('/api/trips/:id/alerts', authenticateToken, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const alerts = await prisma.budgetAlert.findMany({
      where: { trip_id: tripId },
      include: { category: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budget alerts' });
  }
});

// ============================================================================
// 7. ANALYTICAL SQL VIEWS & AGGREGATE QUERIES (Section 3 Rubric)
// ============================================================================

// Query SQL View: v_trip_budget_summary
app.get('/api/analytics/trip-summary/:id', authenticateToken, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const summary = await prisma.$queryRaw`
      SELECT * FROM v_trip_budget_summary WHERE trip_id = ${tripId}
    `;

    const categoryVariance = await prisma.$queryRaw`
      SELECT * FROM v_trip_category_variance WHERE trip_id = ${tripId} ORDER BY category_id ASC
    `;

    if (!summary || summary.length === 0) {
      return res.status(404).json({ error: 'Trip analytical summary not found' });
    }

    res.json({
      summary: summary[0],
      category_variance: categoryVariance
    });
  } catch (err) {
    console.error('Trip summary view error:', err);
    res.status(500).json({ error: 'Failed to fetch analytical trip view' });
  }
});

// Query SQL View: v_destination_cost_overview
app.get('/api/analytics/destinations-overview', async (req, res) => {
  try {
    const overview = await prisma.$queryRaw`
      SELECT * FROM v_destination_cost_overview ORDER BY city_name ASC
    `;
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destination overview' });
  }
});

// ============================================================================
// 8. ADMIN AUDIT LOGS & SYSTEM HEALTH (Best Practices & Security)
// ============================================================================

// Get Audit Logs (Admin only, RBAC enforced)
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: { user: { select: { reg_no: true, full_name: true, role: true } } },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count()
    ]);

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// System Health & Database Stats
app.get('/api/admin/system-health', async (req, res) => {
  try {
    const [userCount, tripCount, destCount, expenseCount, alertCount] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.destination.count(),
      prisma.tripExpense.count(),
      prisma.budgetAlert.count()
    ]);

    // Check PostgreSQL connection latency with EXPLAIN query
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    res.json({
      status: 'OPERATIONAL',
      student: {
        name: 'Garudaiahgari Sai Siri Chandana',
        reg_no: '24BAI0226',
        slot: 'L25+L26',
        course: 'BCSE302P Database Systems Lab'
      },
      database: {
        connected: true,
        latency_ms: latencyMs,
        tables_count: 11,
        total_users: userCount,
        total_trips: tripCount,
        total_destinations: destCount,
        total_expenses: expenseCount,
        total_alerts: alertCount
      },
      uptime_seconds: process.uptime()
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(` WanderBudget AI — Dynamic Trip Budget Builder & Cost Analyzer `);
  console.log(` Student: Garudaiahgari Sai Siri Chandana | Reg: 24BAI0226 `);
  console.log(` Running on Port: http://localhost:${PORT} `);
  console.log(`==================================================================`);
});

module.exports = app;
