-- ============================================================
--  Serviqo Restaurant System — Database Schema
--  Database : serviqo
--  Charset  : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS serviqo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE serviqo;

-- ------------------------------------------------------------
-- 1. users
--    Staff and admin accounts. Customers are anonymous (QR).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100)    NOT NULL,
    email      VARCHAR(150)    NOT NULL,
    password   VARCHAR(255)    NOT NULL,
    role       ENUM('Admin','User') NOT NULL DEFAULT 'User',
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. categories
--    Menu sections (Starters, Mains, Desserts, Drinks, …).
--    display_order drives the sort in the UI filter tabs.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)  NOT NULL,
    description   TEXT,
    display_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. tables
--    Physical restaurant tables. qr_token is embedded in the
--    QR code customers scan; status tracks occupancy.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables (
    id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    table_number SMALLINT UNSIGNED NOT NULL,
    capacity     TINYINT UNSIGNED NOT NULL DEFAULT 4,
    qr_token     VARCHAR(64)      NOT NULL,
    status       ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
    PRIMARY KEY (id),
    UNIQUE KEY uq_tables_number (table_number),
    UNIQUE KEY uq_tables_token  (qr_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. menu_items
--    Every food and drink item. Drinks are just another
--    category — no separate table needed.
--    unit_price stored in DECIMAL to avoid floating-point drift.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
    id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    category_id  INT UNSIGNED  NOT NULL,
    name         VARCHAR(150)  NOT NULL,
    description  TEXT,
    price        DECIMAL(10,2) NOT NULL,
    image_url    VARCHAR(255),
    is_available TINYINT(1)    NOT NULL DEFAULT 1,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_menu_items_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. orders
--    One order per table visit. total_price is a denormalised
--    cache — recomputed whenever order_items change.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    table_id    INT UNSIGNED  NOT NULL,
    status      ENUM('pending','confirmed','preparing','served','paid','cancelled')
                              NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes       TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_table
        FOREIGN KEY (table_id) REFERENCES tables(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. order_items
--    Line items within an order. unit_price is a snapshot of
--    the price at order time so future price edits don't alter
--    historical bills.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    order_id     INT UNSIGNED     NOT NULL,
    menu_item_id INT UNSIGNED     NOT NULL,
    quantity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
    unit_price   DECIMAL(10,2)   NOT NULL,
    notes        VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  Seed data
-- ============================================================

-- Admin user  (password: Admin1234)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@serviqo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin');

-- Categories
INSERT INTO categories (name, description, display_order) VALUES
('Starters',  'Light bites to begin your meal',   1),
('Mains',     'Hearty main course dishes',         2),
('Desserts',  'Sweet endings',                     3),
('Drinks',    'Beverages and refreshments',        4);

-- Menu items
INSERT INTO menu_items (category_id, name, description, price) VALUES
-- Starters (category 1)
(1, 'Bruschetta',       'Grilled bread with tomatoes, garlic and fresh basil',   6.50),
(1, 'Soup of the Day',  'Ask your waiter for today\'s selection',                5.00),
(1, 'Chicken Wings',    'Crispy wings with your choice of sauce',                8.90),
-- Mains (category 2)
(2, 'Grilled Salmon',   'With seasonal vegetables and lemon butter sauce',      18.90),
(2, 'Beef Tenderloin',  '200 g fillet with truffle mashed potato',              26.00),
(2, 'Pasta Primavera',  'Fresh vegetables tossed in garlic olive oil',          14.50),
(2, 'Margherita Pizza', 'Classic tomato and mozzarella, thin crust',            13.00),
-- Desserts (category 3)
(3, 'Tiramisu',         'Classic Italian dessert with espresso and mascarpone',  7.00),
(3, 'Creme Brulee',      'Vanilla custard with caramelised sugar crust',          6.50),
-- Drinks (category 4)
(4, 'Sparkling Water',  '500 ml bottle',                                         2.50),
(4, 'Craft Lemonade',   'Freshly squeezed with mint and ice',                    4.00),
(4, 'House Wine',       'Red or white - ask your waiter (glass)',                7.00);

-- Restaurant tables with pre-generated QR tokens
INSERT INTO tables (table_number, capacity, qr_token) VALUES
(1, 2, 'a3f8c2d1e4b7f09a6c5e2d8b1f4a7c0e3d6b9f2a5c8e1d4b7f0a3c6e9d2b5'),
(2, 4, 'b7e1d4a0f3c6b9e2d5a8f1c4b7e0d3a6f9c2b5e8d1a4f7c0b3e6d9a2f5c8'),
(3, 4, 'c1f5a8d2b6e9c3f7a1d4b8e2c6f0a3d7b1e5c9f2a6d0b4e8c1f5a9d3b7e0'),
(4, 6, 'd4b8e1c5f9a2d6b0e3c7f1a4d8b2e6c0f3a7d1b5e9c3f7a0d4b8e2c6f0a1'),
(5, 2, 'e9c2f6a3d7b1e5c9f0a4d8b2e6c1f5a9d3b7e0c4f8a1d5b9e3c7f2a6d0b4');
