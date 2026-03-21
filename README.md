# B3 Enterprise Loan Tracking System

Complete loan tracking platform for a small finance business, with:

- Node.js + Express backend (JWT auth, MVC structure)
- MySQL database
- React Native mobile app (CLI) with drawer navigation

## Project Structure

```
b3-loan-tracker/
	backend/
		sql/schema.sql
		src/
			config/
			controllers/
			middleware/
			routes/
			services/
			utils/
			app.js
			server.js
	mobile/
		src/
			api/
			components/
			context/
			navigation/
			screens/
			theme/
		App.js
```

## Core Features Implemented

- Admin authentication with JWT (`POST /api/auth/login`)
- Secure API routes using auth middleware
- Customer management: add, edit, delete, list, search
- Loan management with auto calculations:
	- Simple interest = $(P \times R \times T)/100$
	- Total payable = principal + interest
	- EMI = total / duration
- Payment tracking with transaction-safe updates:
	- Add payment
	- Fetch payment history per loan
	- Auto update loan `paid` and `balance`
- Overdue system:
	- Due date = `start_date + duration months`
	- Overdue days calculated for unpaid overdue loans
	- Dedicated overdue list endpoint
- Dashboard metrics:
	- Total customers
	- Total loan amount
	- Total collected
	- Total profit (interest earned proportionally)
	- Total overdue amount
	- Total outstanding balance
- Reports:
	- Monthly collection report
	- Customer-wise loan report

## Backend Setup (Node.js + Express)

1. Configure MySQL and create schema:

```bash
cd backend
mysql -u root -p < sql/schema.sql
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Update `.env` values:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`

Note: `ADMIN_PASSWORD_HASH` accepts either a bcrypt hash (recommended) or plain text for local bootstrap.

4. Install and run backend:

```bash
npm install
npm run dev
```

Server starts on `http://localhost:5000` by default.

## Mobile Setup (React Native CLI)

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Start Metro:

```bash
npm start
```

3. Run app:

```bash
npm run android
# or
npm run ios
```

4. In login screen, set API Base URL:

- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://localhost:5000/api`
- Physical device: `http://<YOUR_LOCAL_IP>:5000/api`

## API Endpoints

### Auth

- `POST /api/auth/login`

### Customers

- `POST /api/customers`
- `GET /api/customers?search=`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Loans

- `POST /api/loans`
- `GET /api/loans?search=`
- `GET /api/loans/overdue`

### Payments

- `POST /api/payments`
- `GET /api/payments/:loanId`

### Dashboard

- `GET /api/dashboard`

### Reports

- `GET /api/reports/monthly-collections`
- `GET /api/reports/customer/:customerId`

All routes except login require header:

```bash
Authorization: Bearer <token>
```

## Mobile Screens

- Login Screen
- Dashboard Screen
- Customer List Screen
- Add Customer Screen
- Loan Details Screen
- Payment Screen
- Overdue Screen

## Notes for Production Hardening

- Replace default admin password/hash immediately.
- Set strict CORS origin allowlist.
- Add HTTPS termination (reverse proxy/load balancer).
- Add centralized logging and monitoring.
- Add DB backup/restore policy.
- Add test coverage (unit + integration + API contract tests).