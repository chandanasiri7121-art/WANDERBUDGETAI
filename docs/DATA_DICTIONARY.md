# Data Dictionary: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Table: `users`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `user_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique system user ID |
| `reg_no` | VARCHAR(50) | NO | UNIQUE | - | Student Registration / Admin ID |
| `full_name` | VARCHAR(150) | NO | - | - | User full legal name |
| `email` | VARCHAR(150) | NO | UNIQUE | - | Email address used for login |
| `password_hash` | VARCHAR(255) | NO | - | - | Bcrypt hashed password (10 rounds) |
| `role` | VARCHAR(50) | NO | CHECK (`role` IN ('TRAVELER', 'ADMIN')) | 'TRAVELER' | User security authorization role |
| `home_currency` | VARCHAR(10) | NO | - | 'INR' | Base domestic currency |
| `oauth_provider`| VARCHAR(50) | YES | 'LOCAL', 'GOOGLE' | 'LOCAL' | Identity provider method |
| `created_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Registration timestamp |

---

## 2. Table: `destinations`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `destination_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique destination ID |
| `city_name` | VARCHAR(100) | NO | UNIQUE(`city_name`, `country_name`) | - | City name (e.g., Tokyo, Paris) |
| `country_name` | VARCHAR(100) | NO | UNIQUE(`city_name`, `country_name`) | - | Country name (e.g., Japan, France) |
| `currency_code` | VARCHAR(10) | NO | - | - | ISO-4217 code (JPY, EUR, INR) |
| `currency_symbol`| VARCHAR(10)| NO | - | '₹' | Display symbol (¥, €, $) |
| `description` | TEXT | YES | - | NULL | Travel overview summary |
| `image_url` | VARCHAR(500) | YES | - | NULL | CDN image preview |
| `created_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Last modification timestamp |

---

## 3. Table: `cost_of_living_indices`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `cost_index_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique cost index ID |
| `destination_id` | INT | NO | UNIQUE, FK $\rightarrow$ `destinations(destination_id)` | - | 1:1 link to destination |
| `accommodation_budget_night` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Dorm / Hostel price per night (local) |
| `accommodation_standard_night` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | 3-Star Hotel price per night (local) |
| `accommodation_luxury_night` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | 5-Star Resort price per night (local) |
| `meal_budget_day` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Street / Budget dining per day (local) |
| `meal_standard_day` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Mid-tier restaurant dining per day |
| `meal_luxury_day` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Fine dining cost per day |
| `transit_pass_day` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Daily public transit pass cost |
| `taxi_per_km` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Taxi / rideshare fare per km |
| `exchange_rate_to_inr` | DECIMAL(12,4) | NO | CHECK (value > 0) | 1.0 | Real-time exchange rate to 1 Local Unit |
| `source` | VARCHAR(100) | NO | - | 'LIVE_WEB_SEARCH_AI' | Data benchmarking source |
| `confidence_score`| DECIMAL(4,2) | NO | CHECK (0.0 to 1.0) | 0.95 | Reliability metric |
| `last_synced_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Timestamp of web benchmark sync |

---

## 4. Table: `attractions`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `attraction_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique attraction ID |
| `destination_id` | INT | NO | FK $\rightarrow$ `destinations(destination_id)` | - | City hosting this attraction |
| `name` | VARCHAR(200) | NO | - | - | Attraction title |
| `category` | VARCHAR(100) | NO | Historical, Nature, Culture, Theme Park | - | Genre classification |
| `ticket_price_local` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | 0.00 | Admission fee in local currency |
| `ticket_price_inr` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | 0.00 | Admission fee normalized to INR |
| `avg_duration_hours`| DECIMAL(4,1) | NO | CHECK (value > 0) | 2.5 | Recommended visiting duration |
| `recommended_style` | VARCHAR(50) | NO | BUDGET, STANDARD, LUXURY, ALL | 'ALL' | Traveler style compatibility |
| `image_url` | VARCHAR(500) | YES | - | NULL | Landmark photo |
| `description` | TEXT | YES | - | NULL | Description and visiting tips |

---

## 5. Table: `trips`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `trip_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique trip plan ID |
| `user_id` | INT | NO | FK $\rightarrow$ `users(user_id)` ON DELETE CASCADE | - | Trip creator |
| `destination_id` | INT | NO | FK $\rightarrow$ `destinations(destination_id)` | - | Destination being visited |
| `title` | VARCHAR(200) | NO | - | - | Trip custom name |
| `start_date` | DATE | YES | - | NULL | Tentative commencement date |
| `end_date` | DATE | YES | - | NULL | Tentative conclusion date |
| `duration_days` | INT | NO | CHECK (`duration_days` > 0) | 3 | Total days of trip stay |
| `travel_style` | VARCHAR(50) | NO | CHECK (`travel_style` IN ('BUDGET', 'STANDARD', 'LUXURY')) | 'STANDARD' | Spending style Tier |
| `group_size` | INT | NO | CHECK (`group_size` > 0) | 1 | Number of accompanying travelers |
| `total_budget_inr` | DECIMAL(14,2) | NO | CHECK (`total_budget_inr` $\ge$ 0) | - | Aggregate planned budget in INR |
| `total_spent_inr` | DECIMAL(14,2) | NO | Updated automatically via Trigger | 0.00 | Sum of recorded expenses |
| `status` | VARCHAR(50) | NO | 'PLANNING', 'ACTIVE', 'COMPLETED' | 'PLANNING' | Lifecycle state |
| `created_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Last modification timestamp |

---

## 6. Table: `trip_places`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `trip_place_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique schedule item ID |
| `trip_id` | INT | NO | FK $\rightarrow$ `trips(trip_id)` ON DELETE CASCADE | - | Associated trip plan |
| `attraction_id` | INT | NO | FK $\rightarrow$ `attractions(attraction_id)` | - | Chosen attraction |
| `planned_day` | INT | NO | CHECK (`planned_day` > 0) | 1 | Day number in itinerary |
| `estimated_cost_inr` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Estimated ticket / activity cost |
| `notes` | TEXT | YES | - | NULL | Custom notes or time slot |

---

## 7. Table: `budget_categories`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `category_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique category ID |
| `category_code` | VARCHAR(50) | NO | UNIQUE | - | ACCOMMODATION, FOOD, TRANSIT, etc. |
| `category_name` | VARCHAR(100) | NO | - | - | User-facing title |
| `icon` | VARCHAR(50) | NO | - | 'Tag' | UI icon token |

---

## 8. Table: `trip_budget_breakdowns`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `breakdown_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique breakdown ID |
| `trip_id` | INT | NO | FK $\rightarrow$ `trips(trip_id)` ON DELETE CASCADE | - | Associated trip |
| `category_id` | INT | NO | FK $\rightarrow$ `budget_categories(category_id)` | - | Category classified |
| `allocated_amount_inr` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Calculated allowance from Stored Procedure |
| `spent_amount_inr` | DECIMAL(12,2) | NO | Updated automatically via Trigger | 0.00 | Real-time spent sum |

---

## 9. Table: `trip_expenses`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `expense_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique expense ID |
| `trip_id` | INT | NO | FK $\rightarrow$ `trips(trip_id)` ON DELETE CASCADE | - | Parent trip |
| `category_id` | INT | NO | FK $\rightarrow$ `budget_categories(category_id)` | - | Cost category |
| `user_id` | INT | NO | FK $\rightarrow$ `users(user_id)` ON DELETE CASCADE | - | Traveler who made purchase |
| `expense_name` | VARCHAR(200) | NO | - | - | Item or invoice title |
| `amount_inr` | DECIMAL(12,2) | NO | CHECK (value $\ge$ 0) | - | Final cost in INR |
| `currency_code` | VARCHAR(10) | NO | - | 'INR' | Original currency billed |
| `amount_original`| DECIMAL(12,2)| NO | CHECK (value $\ge$ 0) | - | Original nominal amount |
| `expense_date` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Date & time of transaction |
| `payment_method`| VARCHAR(50) | NO | CARD, CASH, UPI, FOREX | 'CARD' | Settlement method |
| `receipt_url` | VARCHAR(500) | YES | - | NULL | Stored receipt snapshot |
| `notes` | TEXT | YES | - | NULL | Additional comments |
| `created_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Log timestamp |

---

## 10. Table: `budget_alerts`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `alert_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique alert ID |
| `trip_id` | INT | NO | FK $\rightarrow$ `trips(trip_id)` ON DELETE CASCADE | - | Affected trip |
| `category_id` | INT | YES | FK $\rightarrow$ `budget_categories(category_id)` ON DELETE SET NULL | NULL | Category causing overrun (NULL if overall trip) |
| `alert_type` | VARCHAR(50) | NO | WARNING_80_PERCENT, BUDGET_EXCEEDED, TRIP_OVERRUN | - | Classification of alert |
| `message` | TEXT | NO | Generated by Trigger `fn_check_budget_overrun()` | - | Warning message string |
| `threshold_pct` | DECIMAL(10,2)| NO | - | - | Calculated percentage at trigger execution |
| `is_resolved` | BOOLEAN | NO | - | FALSE | Status acknowledgement flag |
| `created_at` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Occurrence timestamp |

---

## 11. Table: `audit_logs`
| Column Name | Data Type | Nullable | Key / Constraints | Default | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `log_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | - | Unique log ID |
| `user_id` | INT | YES | FK $\rightarrow$ `users(user_id)` ON DELETE SET NULL | NULL | Actor executing operation |
| `action` | VARCHAR(100) | NO | LOGIN, CREATE_TRIP, LOG_EXPENSE, etc. | - | Action name |
| `entity_type` | VARCHAR(100) | NO | - | - | Target table / entity |
| `entity_id` | INT | YES | - | NULL | Primary key of modified entity |
| `ip_address` | VARCHAR(100) | YES | - | '127.0.0.1' | Network origin |
| `details` | TEXT | YES | JSON / serialized string | NULL | Audit payload |
| `timestamp` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Forensic timestamp |
