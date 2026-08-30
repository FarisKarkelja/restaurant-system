# Serviqo - Restaurant Table Ordering & Management System
## Table of Contents
- [Description](#description)
- [Languages and Technologies Used](#languages-and-technologies-used)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Description
Serviqo is a full-stack restaurant management system built for the Software Engineering course. It enables customers to browse a digital menu and place orders directly from their table via a unique table token, while staff manage orders, tables, and waiter/bill requests through an admin panel. The system includes a live analytics dashboard for order and revenue insights.

## Languages and Technologies Used
- PHP (Flight micro-framework)
- JavaScript (vanilla, Vite-bundled)
- HTML5 / CSS3
- MySQL
- JWT authentication (firebase/php-jwt)
- PHPUnit (backend unit tests)
- Selenium with Python/pytest (end-to-end tests)

## Features
1. **Table-Based Ordering:**
   - Customers access the menu via a unique table token
   - Place orders directly without needing an account
2. **Menu Management:**
   - Admin CRUD for menu categories and items
   - Trending items surfaced automatically
3. **Order Management:**
   - Live order tracking and status updates
   - Order statistics and active order views
4. **Table & Assignment Management:**
   - Table status tracking
   - Waiter-to-table assignment system
5. **Service Requests:**
   - Customers can call a waiter or request the bill from their table
   - Staff view and resolve pending requests
6. **Authentication & Roles:**
   - JWT-based authentication
   - Role-based access for staff, admin, and customer flows
7. **Analytics Dashboard:**
   - Revenue trends, peak hours, average order value, and popular items
   - Real-time updates via an event bus pattern (Observer) that refreshes analytics as new orders arrive
8. **Testing:**
   - PHPUnit tests covering analytics strategies, JWT tokens, and password hashing
   - Selenium E2E test suite covering login, registration, cart, menu filters, and admin navigation

## Installation
1. Clone the repository:
```bash
   git clone https://github.com/FarisKarkelja/restaurant-system.git
   cd restaurant-system
```
2. **Backend setup:**
```bash
   cd backend
   composer install
   cp .env.example .env   # configure DB credentials
```
   Import the database schema:
```bash
   mysql -u <user> -p <database> < ../database/scheme/serviqo.sql
```
   Start the PHP built-in server:
```bash
   php -S localhost:8000
```
3. **Frontend setup:**
```bash
   cd ..
   npm install
   npm run dev
```
   The frontend runs on `http://localhost:5173` and expects the API at `http://localhost:8000`.

## Usage
- Customers scan a table's QR code (or visit its token URL) to view the menu and place orders.
- Staff log in through the admin panel to manage orders, tables, requests, and view analytics.
- Run backend tests:
```bash
  cd tests/backend && composer install && ./vendor/bin/phpunit
```
- Run Selenium E2E tests:
```bash
  cd tests/selenium && pip install -r requirements.txt && pytest
```

## Contributing
If you'd like to contribute to this project, please follow these guidelines:
1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## License
This project is not licensed.

## Acknowledgements
- [Flight PHP Framework](https://flightphp.com/)
- [Vite](https://vitejs.dev/)
- [PHPUnit](https://phpunit.de/)
- [Selenium](https://www.selenium.dev/)
- [Stack Overflow](https://stackoverflow.com/)
- University materials and resources
