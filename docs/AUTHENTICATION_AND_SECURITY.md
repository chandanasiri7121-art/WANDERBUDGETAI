# Authentication, Role-Based Access Control & Security: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Single Users Table RBAC Architecture
As explicitly mandated in the project specification:
> *"Maintain all users in a single Users table. Do NOT create separate tables such as Admin, Student, Faculty, Manager. Use a Role or RoleID column to distinguish user permissions."*

WanderBudget AI maintains all system identities inside the single `users` table:
```prisma
model User {
  user_id        Int            @id @default(autoincrement())
  reg_no         String         @unique @db.VarChar(50) // Student Reg or Admin ID
  full_name      String         @db.VarChar(150)
  email          String         @unique @db.VarChar(150)
  password_hash  String         @db.VarChar(255)
  role           String         @default("TRAVELER") @db.VarChar(50) // 'TRAVELER' or 'ADMIN'
  home_currency  String         @default("INR") @db.VarChar(10)
  oauth_provider String?        @default("LOCAL") @db.VarChar(50) // 'LOCAL' or 'GOOGLE'
  created_at     DateTime       @default(now())

  trips          Trip[]
  expenses       TripExpense[]
  audit_logs     AuditLog[]

  @@index([email])
  @@index([reg_no])
  @@map("users")
}
```

### Roles Supported:
1. **`TRAVELER` (Student / Tourist)**:
   * Can explore destination cost indices worldwide.
   * Can create, customize, and edit their personal trips.
   * Can schedule itinerary places and log real-time travel expenses.
   * Receives automated budget alerts when category thresholds are crossed.
2. **`ADMIN` (Faculty / System Administrator)**:
   * Access to privileged Admin Dashboard and System Health telemetry.
   * Management of destination master records and cost-of-living benchmarks.
   * Full inspection access to system audit logs, database connection pools, and raw query explainers.

---

## 2. Authentication Flow: JWT & Google OAuth 2.0

### A. JWT Authentication
* Users authenticate using Registration Number (`reg_no`) or Email and password.
* Passwords are verified against the stored hash using `bcryptjs.compare`.
* Upon successful verification, a cryptographically signed JSON Web Token (JWT) is issued with a 24-hour expiration payload:
```javascript
const token = jwt.sign(
  {
    user_id: user.user_id,
    reg_no: user.reg_no,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

### B. Google OAuth 2.0 Integration
* Users can sign in using Google Single Sign-On (SSO).
* Upon token receipt, the backend verifies the Google profile and either connects the existing account or provisions a new traveler record inside the single `users` table with `oauth_provider = 'GOOGLE'`.
* An immutable audit log entry is recorded into `audit_logs` tracking the login timestamp and IP address.

---

## 3. Role-Based Route Guards (Express.js Middleware)

```javascript
// Middleware: Verify JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Middleware: Require ADMIN Role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied: Admin privileges required', 
      user_role: req.user?.role 
    });
  }
  next();
}
```

---

## 4. Cryptographic Security & SQL Injection Prevention

1. **Password Hashing (BCrypt)**:
   * Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs.hash(password, 10)` before insertion.
2. **SQL Injection Prevention**:
   * All database queries are executed via **Prisma ORM** which strictly parameterizes inputs through PostgreSQL binary protocols.
   * Raw SQL queries for views and stored procedures explicitly use parameterized inputs (`$1`, `$2`), preventing SQL injection attacks entirely.
3. **Secrets Management**:
   * Sensitive secrets (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) are stored in `.env` and loaded using `dotenv`.
   * `.env` is explicitly ignored in `.gitignore`, preventing leaks to version control.
