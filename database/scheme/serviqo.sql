-- MySQL dump 10.13  Distrib 8.3.0, for Win64 (x86_64)
--
-- Host: localhost    Database: serviqo
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bill_requests`
--

DROP TABLE IF EXISTS `bill_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `table_id` int(10) unsigned NOT NULL,
  `status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_bill_req_table` (`table_id`),
  CONSTRAINT `fk_bill_req_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_requests`
--

LOCK TABLES `bill_requests` WRITE;
/*!40000 ALTER TABLE `bill_requests` DISABLE KEYS */;
INSERT INTO `bill_requests` VALUES (1,1,'resolved','2026-05-23 18:50:31','2026-05-23 19:49:44'),(2,1,'resolved','2026-06-05 14:01:20','2026-06-05 14:01:31'),(3,1,'pending','2026-06-05 15:06:42',NULL);
/*!40000 ALTER TABLE `bill_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Starters','Light bites to begin your meal',1,1,'2026-04-29 19:22:36'),(2,'Mains','Hearty main course dishes',2,1,'2026-04-29 19:22:36'),(3,'Desserts','Sweet endings',3,1,'2026-04-29 19:22:36'),(4,'Drinks','Beverages and refreshments',4,1,'2026-04-29 19:22:36');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `is_vegan` tinyint(1) NOT NULL DEFAULT 0,
  `is_vegetarian` tinyint(1) NOT NULL DEFAULT 0,
  `is_halal` tinyint(1) NOT NULL DEFAULT 0,
  `is_gluten_free` tinyint(1) NOT NULL DEFAULT 0,
  `is_spicy` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_menu_items_category` (`category_id`),
  CONSTRAINT `fk_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,1,'Bruschetta','Grilled bread with tomatoes, garlic and fresh basil',6.50,'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop&auto=format',1,1,1,1,0,0,'2026-04-29 19:22:36'),(2,1,'Soup of the Day','Ask your waiter for today\'s selection',5.00,'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop&auto=format',1,0,0,0,0,0,'2026-04-29 19:22:36'),(3,1,'Chicken Wings','Crispy wings with your choice of sauce',8.90,'https://images.unsplash.com/photo-1578875858391-50798bc2ffee?w=400&h=300&fit=crop&auto=format',1,0,0,1,1,1,'2026-04-29 19:22:36'),(4,2,'Grilled Salmon','With seasonal vegetables and lemon butter sauce',18.90,'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&auto=format',1,0,0,0,1,0,'2026-04-29 19:22:36'),(5,2,'Beef Tenderloin','200 g fillet with truffle mashed potato',26.00,'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop&auto=format',1,0,0,1,1,0,'2026-04-29 19:22:36'),(6,2,'Pasta Primavera','Fresh vegetables tossed in garlic olive oil',14.50,'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop&auto=format',1,1,1,1,0,0,'2026-04-29 19:22:36'),(7,2,'Margherita Pizza','Classic tomato and mozzarella, thin crust',13.00,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&auto=format',1,0,1,1,0,0,'2026-04-29 19:22:36'),(8,3,'Tiramisu','Classic Italian dessert with espresso and mascarpone',7.00,'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&auto=format',1,0,1,0,0,0,'2026-04-29 19:22:36'),(9,3,'Creme Brulee','Vanilla custard with caramelised sugar crust',6.50,'https://images.unsplash.com/photo-1432139438709-ee8369449944?w=400&h=300&fit=crop&auto=format',1,0,1,0,1,0,'2026-04-29 19:22:36'),(10,4,'Sparkling Water','500 ml bottle',2.50,'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop&auto=format',1,1,1,1,1,0,'2026-04-29 19:22:36'),(11,4,'Craft Lemonade','Freshly squeezed with mint and ice',4.00,'https://images.unsplash.com/photo-1513558003720-343f3a99d97b?w=400&h=300&fit=crop&auto=format',1,1,1,1,1,0,'2026-04-29 19:22:36'),(12,4,'House Wine','Red or white - ask your waiter (glass)',7.00,'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop&auto=format',1,1,1,0,1,0,'2026-04-29 19:22:36'),(13,1,'Caesar Salad','Romaine lettuce, parmesan, croutons and Caesar dressing',8.50,'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop&auto=format',1,0,1,0,0,0,'2026-06-05 07:49:07'),(14,1,'Garlic Mushrooms','Sauteed button mushrooms in garlic butter and fresh herbs',7.50,'https://images.unsplash.com/photo-1733940501793-7e7a15c253f6?w=400&h=300&fit=crop&auto=format',1,0,1,0,1,0,'2026-06-05 07:49:07'),(15,1,'Spring Rolls','Crispy vegetable rolls served with sweet chili dipping sauce',7.00,'https://images.unsplash.com/photo-1515022376298-7333f33e704b?w=400&h=300&fit=crop&auto=format',1,1,1,0,0,0,'2026-06-05 07:49:07'),(16,1,'Calamari','Golden fried squid rings with aioli and lemon',9.50,'https://images.unsplash.com/photo-1548077447-17749375af3a?w=400&h=300&fit=crop&auto=format',1,0,0,0,0,0,'2026-06-05 07:49:07'),(17,1,'Caprese Salad','Fresh mozzarella, tomatoes and basil drizzled with olive oil',9.00,'https://images.unsplash.com/photo-1676300185089-8781af127fee?w=400&h=300&fit=crop&auto=format',1,0,1,0,1,0,'2026-06-05 07:49:07'),(18,2,'Classic Beef Burger','Beef patty, cheddar, lettuce, tomato and house sauce in brioche',15.50,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&auto=format',1,0,0,1,0,0,'2026-06-05 07:49:07'),(19,2,'Mushroom Risotto','Creamy arborio rice with wild mushrooms, parmesan and truffle',16.00,'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&auto=format',1,0,1,0,1,0,'2026-06-05 07:49:07'),(20,2,'Chicken Alfredo','Penne pasta in creamy parmesan sauce with grilled chicken',16.50,'https://images.unsplash.com/photo-1748012199672-2a94ab9cbb19?w=400&h=300&fit=crop&auto=format',1,0,0,1,0,0,'2026-06-05 07:49:07'),(21,2,'Fish & Chips','Beer-battered cod fillet with thick-cut fries and tartar sauce',17.00,'https://images.unsplash.com/photo-1722105344016-0df8537c1799?w=400&h=300&fit=crop&auto=format',1,0,0,0,0,0,'2026-06-05 07:49:07'),(23,2,'Vegetable Stir Fry','Seasonal vegetables wok-tossed in soy and ginger sauce with rice',13.50,'https://images.unsplash.com/photo-1464500650248-1a4b45debb9f?w=400&h=300&fit=crop&auto=format',1,1,1,1,1,1,'2026-06-05 07:49:07'),(24,2,'Lamb Chops','Herb-marinated lamb chops with roasted potatoes and mint sauce',28.00,'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=300&fit=crop&auto=format',1,0,0,1,1,0,'2026-06-05 07:49:07'),(25,3,'Chocolate Lava Cake','Warm dark chocolate cake with a molten centre, vanilla ice cream',8.00,'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&auto=format',1,0,1,0,0,0,'2026-06-05 07:49:07'),(26,3,'New York Cheesecake','Baked vanilla cheesecake on a buttery biscuit base',7.50,'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop&auto=format',1,0,1,0,0,0,'2026-06-05 07:49:07'),(27,3,'Ice Cream Sundae','Three scoops with chocolate sauce, whipped cream and a wafer',6.00,'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&auto=format',1,0,1,0,1,0,'2026-06-05 07:49:07'),(28,3,'Fruit Tart','Crisp pastry shell filled with custard cream and fresh berries',7.00,'https://images.unsplash.com/photo-1554674150-6fa0bd04b558?w=400&h=300&fit=crop&auto=format',1,0,1,0,0,0,'2026-06-05 07:49:07'),(29,4,'Fresh Orange Juice','Freshly squeezed, served chilled',4.50,'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop&auto=format',1,1,1,1,1,0,'2026-06-05 07:49:07'),(30,4,'Espresso','Double shot of our house-blend espresso',3.00,'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop&auto=format',1,1,1,1,1,0,'2026-06-05 07:49:07'),(31,4,'Classic Mojito','White rum, fresh mint, lime juice, sugar and soda water',9.00,'https://images.unsplash.com/photo-1753263453239-fef8e92b5040?w=400&h=300&fit=crop&auto=format',1,1,1,0,1,0,'2026-06-05 07:49:07'),(32,4,'Elderflower Spritz','Elderflower cordial with sparkling water and cucumber',4.50,'https://images.unsplash.com/photo-1633933108592-8efcf681806d?w=400&h=300&fit=crop&auto=format',1,1,1,1,1,0,'2026-06-05 07:49:07'),(33,2,'Grilled Chicken','Herb-marinated chicken breast with roasted vegetables and lemon sauce',16.50,'https://images.unsplash.com/photo-1567121938596-6d9d015d348b?w=400&h=300&fit=crop&auto=format',1,0,0,1,1,0,'2026-06-05 07:57:07'),(34,1,'Selenium Burger 1780672056','Added by Selenium automated test',12.99,NULL,1,0,0,0,0,0,'2026-06-05 15:07:55'),(35,1,'Selenium Burger 1780672349','Added by Selenium automated test',12.99,NULL,1,0,0,0,0,0,'2026-06-05 15:12:50'),(36,1,'Selenium Burger 1780672608','Added by Selenium automated test',12.99,NULL,1,0,0,0,0,0,'2026-06-05 15:17:07');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `menu_item_id` int(10) unsigned NOT NULL,
  `quantity` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_menu_item` (`menu_item_id`),
  CONSTRAINT `fk_order_items_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,2,6.50,NULL),(2,1,4,1,18.90,NULL),(3,2,8,1,7.00,NULL),(4,2,10,1,2.50,NULL),(5,2,11,1,4.00,NULL),(6,3,11,1,4.00,NULL),(7,4,8,1,7.00,NULL),(8,4,9,1,6.50,NULL),(9,4,11,1,4.00,NULL),(10,4,25,1,8.00,NULL),(11,4,28,1,7.00,NULL),(12,5,13,1,8.50,NULL),(13,5,16,1,9.50,NULL),(14,6,1,1,6.50,NULL),(15,7,1,1,6.50,NULL),(16,8,1,1,6.50,NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `table_id` int(10) unsigned NOT NULL,
  `status` enum('pending','confirmed','preparing','served','paid','cancelled') NOT NULL DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_orders_table` (`table_id`),
  CONSTRAINT `fk_orders_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'served',31.90,NULL,'2026-05-23 20:06:07','2026-05-23 20:13:59'),(2,1,'served',13.50,NULL,'2026-05-23 20:13:43','2026-06-04 16:54:23'),(3,1,'served',4.00,NULL,'2026-06-05 07:26:13','2026-06-05 07:26:29'),(4,1,'served',32.50,NULL,'2026-06-05 12:09:35','2026-06-05 14:01:08'),(5,1,'served',18.00,NULL,'2026-06-05 14:01:39','2026-06-05 14:01:46'),(6,1,'pending',6.50,NULL,'2026-06-05 15:06:04','2026-06-05 15:06:04'),(7,1,'pending',6.50,NULL,'2026-06-05 15:10:19','2026-06-05 15:10:19'),(8,1,'pending',6.50,NULL,'2026-06-05 15:15:10','2026-06-05 15:15:10');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `table_assignments`
--

DROP TABLE IF EXISTS `table_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `table_assignments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `table_id` int(10) unsigned NOT NULL,
  `waiter_id` int(10) unsigned NOT NULL,
  `assigned_by` int(10) unsigned DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ta_table` (`table_id`),
  KEY `fk_ta_waiter` (`waiter_id`),
  KEY `fk_ta_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_ta_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ta_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ta_waiter` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table_assignments`
--

LOCK TABLES `table_assignments` WRITE;
/*!40000 ALTER TABLE `table_assignments` DISABLE KEYS */;
INSERT INTO `table_assignments` VALUES (4,3,5,4,'2026-06-04 16:53:10'),(5,7,7,4,'2026-06-04 16:53:19'),(6,1,6,4,'2026-06-04 16:53:25'),(7,2,6,4,'2026-06-04 16:53:29'),(8,5,7,4,'2026-06-04 18:00:46'),(9,8,5,4,'2026-06-05 08:07:05'),(10,4,7,4,'2026-06-05 13:35:28');
/*!40000 ALTER TABLE `table_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `table_number` smallint(5) unsigned NOT NULL,
  `capacity` tinyint(3) unsigned NOT NULL DEFAULT 4,
  `qr_token` varchar(64) NOT NULL,
  `status` enum('available','occupied','reserved') NOT NULL DEFAULT 'available',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tables_number` (`table_number`),
  UNIQUE KEY `uq_tables_token` (`qr_token`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,1,2,'a3f8c2d1e4b7f09a6c5e2d8b1f4a7c0e3d6b9f2a5c8e1d4b7f0a3c6e9d2b5','occupied'),(2,2,4,'b7e1d4a0f3c6b9e2d5a8f1c4b7e0d3a6f9c2b5e8d1a4f7c0b3e6d9a2f5c8','available'),(3,3,4,'c1f5a8d2b6e9c3f7a1d4b8e2c6f0a3d7b1e5c9f2a6d0b4e8c1f5a9d3b7e0','reserved'),(4,4,6,'d4b8e1c5f9a2d6b0e3c7f1a4d8b2e6c0f3a7d1b5e9c3f7a0d4b8e2c6f0a1','available'),(5,5,2,'e9c2f6a3d7b1e5c9f0a4d8b2e6c1f5a9d3b7e0c4f8a1d5b9e3c7f2a6d0b4','reserved'),(6,6,4,'505764c2a8577a9fb4424f81d16c7a4616c0af41e1886741809d3b6d17902023','available'),(7,7,6,'559db725caa571662ee0e8a6987852021de65d761568413d5280a6ef9672fcca','occupied'),(8,8,2,'627cb00e663ea10debfd20f732e1cfbc66c6bc2ac4d51e0a56ccbbec283141d2','available');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Waiter','User') NOT NULL DEFAULT 'User',
  `failed_attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@serviqo.com','$2y$10$gpaWreB9yfFdlwn0RJWDIedAugu1w8Y37xetPD.rotbw2vPOpsDx2','Admin',0,NULL,'2026-04-29 19:22:36'),(4,'Tarik Hodzic','tarik.hodzic@stu.ibu.edu.ba','$2y$10$.775N7Qsd4tW6GxfZ64x1u50H6P6cdDnG2Uy.oS6RObV4jgBFyiS.','Admin',0,NULL,'2026-06-04 16:38:18'),(5,'John Smith','john@serviqo.com','$2y$10$bd01QmB8Y7ZeUyQagzozXuTbHGVQIfUW4UlHjgDvlBipoNCrswjsK','Waiter',0,NULL,'2026-06-04 16:42:00'),(6,'Sarah Jones','sarah@serviqo.com','$2y$10$GJavHkq/S4GQDljRrxjZPOaQhGSGjcOglwHakDfZsFfGo4aOgPEBm','Waiter',0,NULL,'2026-06-04 16:42:00'),(7,'Marco Rossi','marco@serviqo.com','$2y$10$5MuDOvBYI3CL8IEVAKtI4.wtADhEpYHvsFi1Km2EN0ZHCgT7Yr64K','Waiter',0,NULL,'2026-06-04 16:42:01'),(8,'Tester','tester@serviqo.com','$2y$10$onY5Gn7xiWOHbxAHeSmss.b02aDj009LTdEvJ5aEpUKjjUPfpFVmC','Admin',0,NULL,'2026-06-05 14:45:45'),(9,'Selenium Tester','selenium_1780671898@test.com','$2y$10$ZboRJQBbIxKA1K5MBQb.1e/syqPOT5rJqzhsYLFsv5Gr7wwAiJNki','User',0,NULL,'2026-06-05 15:05:05'),(10,'Selenium Tester','selenium_1780672159@test.com','$2y$10$Wo8W/0E5voCZNd8LNrLjoeSK49jYjtZHAVO96E33IfhfFkRCSlLe6','User',0,NULL,'2026-06-05 15:09:26'),(11,'Selenium Tester','selenium_1780672447@test.com','$2y$10$O4IZS/WG5vrnKwnNT.ccoOjHdexLkki29MY/JKs0zSiaCKpFg8XTq','User',0,NULL,'2026-06-05 15:14:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waiter_requests`
--

DROP TABLE IF EXISTS `waiter_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waiter_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `table_id` int(10) unsigned NOT NULL,
  `status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_waiter_req_table` (`table_id`),
  CONSTRAINT `fk_waiter_req_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waiter_requests`
--

LOCK TABLES `waiter_requests` WRITE;
/*!40000 ALTER TABLE `waiter_requests` DISABLE KEYS */;
INSERT INTO `waiter_requests` VALUES (1,2,'resolved','2026-05-23 18:38:33','2026-05-23 18:38:43'),(2,1,'resolved','2026-05-23 18:50:30','2026-05-23 19:49:45'),(3,1,'resolved','2026-06-05 14:01:21','2026-06-05 14:01:30'),(4,1,'pending','2026-06-05 15:07:15',NULL);
/*!40000 ALTER TABLE `waiter_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'serviqo'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-05 19:10:25
