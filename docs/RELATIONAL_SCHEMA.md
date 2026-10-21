# Relational Schema: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
`24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Faculty In-Charge  

---

## 1. Relational Schema Representation
Below is the formal relational schema representation where **Primary Keys** are denoted with `[PK]` and bolded, and **Foreign Keys** are denoted with `[FK]` indicating the referenced table.

### 1. `users`
> **users** (**user_id** [PK], reg_no [UK], full_name, email [UK], password_hash, role, home_currency, oauth_provider, created_at)
* *Primary Key:* `user_id`
* *Unique Keys:* `reg_no`, `email`
* *Constraints:* `role IN ('TRAVELER', 'ADMIN')`

---

### 2. `destinations`
> **destinations** (**destination_id** [PK], city_name, country_name, currency_code, currency_symbol, description, image_url, created_at, updated_at)
* *Primary Key:* `destination_id`
* *Unique Key:* `(city_name, country_name)`

---

### 3. `cost_of_living_indices`
> **cost_of_living_indices** (**cost_index_id** [PK], *destination_id* [FK to destinations.destination_id], accommodation_budget_night, accommodation_standard_night, accommodation_luxury_night, meal_budget_day, meal_standard_day, meal_luxury_day, transit_pass_day, taxi_per_km, exchange_rate_to_inr, source, confidence_score, last_synced_at)
* *Primary Key:* `cost_index_id`
* *Foreign Key:* `destination_id` references `destinations(destination_id)` ON DELETE CASCADE
* *Unique Key:* `destination_id` (enforces 1:1 relationship)

---

### 4. `attractions`
> **attractions** (**attraction_id** [PK], *destination_id* [FK to destinations.destination_id], name, category, ticket_price_local, ticket_price_inr, avg_duration_hours, recommended_style, image_url, description)
* *Primary Key:* `attraction_id`
* *Foreign Key:* `destination_id` references `destinations(destination_id)` ON DELETE CASCADE

---

### 5. `trips`
> **trips** (**trip_id** [PK], *user_id* [FK to users.user_id], *destination_id* [FK to destinations.destination_id], title, start_date, end_date, duration_days, travel_style, group_size, total_budget_inr, total_spent_inr, status, created_at, updated_at)
* *Primary Key:* `trip_id`
* *Foreign Keys:*
  * `user_id` references `users(user_id)` ON DELETE CASCADE
  * `destination_id` references `destinations(destination_id)` ON DELETE RESTRICT
* *Constraints:* `travel_style IN ('BUDGET', 'STANDARD', 'LUXURY')`, `duration_days > 0`, `group_size > 0`

---

### 6. `trip_places`
> **trip_places** (**trip_place_id** [PK], *trip_id* [FK to trips.trip_id], *attraction_id* [FK to attractions.attraction_id], planned_day, estimated_cost_inr, notes)
* *Primary Key:* `trip_place_id`
* *Foreign Keys:*
  * `trip_id` references `trips(trip_id)` ON DELETE CASCADE
  * `attraction_id` references `attractions(attraction_id)` ON DELETE CASCADE

---

### 7. `budget_categories`
> **budget_categories** (**category_id** [PK], category_code [UK], category_name, icon)
* *Primary Key:* `category_id`
* *Unique Key:* `category_code`

---

### 8. `trip_budget_breakdowns`
> **trip_budget_breakdowns** (**breakdown_id** [PK], *trip_id* [FK to trips.trip_id], *category_id* [FK to budget_categories.category_id], allocated_amount_inr, spent_amount_inr)
* *Primary Key:* `breakdown_id`
* *Foreign Keys:*
  * `trip_id` references `trips(trip_id)` ON DELETE CASCADE
  * `category_id` references `budget_categories(category_id)` ON DELETE RESTRICT
* *Unique Key:* `(trip_id, category_id)`

---

### 9. `trip_expenses`
> **trip_expenses** (**expense_id** [PK], *trip_id* [FK to trips.trip_id], *category_id* [FK to budget_categories.category_id], *user_id* [FK to users.user_id], expense_name, amount_inr, currency_code, amount_original, expense_date, payment_method, receipt_url, notes, created_at)
* *Primary Key:* `expense_id`
* *Foreign Keys:*
  * `trip_id` references `trips(trip_id)` ON DELETE CASCADE
  * `category_id` references `budget_categories(category_id)` ON DELETE RESTRICT
  * `user_id` references `users(user_id)` ON DELETE CASCADE
* *Constraints:* `amount_inr >= 0`, `payment_method IN ('CARD', 'CASH', 'UPI', 'FOREX')`

---

### 10. `budget_alerts`
> **budget_alerts** (**alert_id** [PK], *trip_id* [FK to trips.trip_id], *category_id* [FK to budget_categories.category_id], alert_type, message, threshold_pct, is_resolved, created_at)
* *Primary Key:* `alert_id`
* *Foreign Keys:*
  * `trip_id` references `trips(trip_id)` ON DELETE CASCADE
  * `category_id` references `budget_categories(category_id)` ON DELETE SET NULL

---

### 11. `audit_logs`
> **audit_logs** (**log_id** [PK], *user_id* [FK to users.user_id], action, entity_type, entity_id, ip_address, details, timestamp)
* *Primary Key:* `log_id`
* *Foreign Key:* `user_id` references `users(user_id)` ON DELETE SET NULL
