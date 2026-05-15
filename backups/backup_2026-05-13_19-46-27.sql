-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: bocchongsoc
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_accounts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountHolder` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_accounts`
--

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_activities`
--

DROP TABLE IF EXISTS `customer_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_activities` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `customer_activities_customerId_fkey` (`customerId`),
  CONSTRAINT `customer_activities_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_activities`
--

LOCK TABLES `customer_activities` WRITE;
/*!40000 ALTER TABLE `customer_activities` DISABLE KEYS */;
INSERT INTO `customer_activities` VALUES ('cmobmu4ah0009ermv57zzqk9p','cmobmdu1g000610h2md9017sg','note_added','Thêm ghi chú nội bộ','Kh',NULL,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-04-23 15:24:30.906'),('cmobn01i7000fermvm65u5vig','cmobmdu1g000610h2md9017sg','note_added','Thêm ghi chú nội bộ','Khach kho tinh, goi sau 10h sang',NULL,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-04-23 15:29:07.231');
/*!40000 ALTER TABLE `customer_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_follow_ups`
--

DROP TABLE IF EXISTS `customer_follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_follow_ups` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `dueDate` datetime(3) NOT NULL,
  `type` enum('call','email','visit','quote','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'call',
  `status` enum('pending','completed','cancelled','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_follow_ups_customerId_fkey` (`customerId`),
  CONSTRAINT `customer_follow_ups_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_follow_ups`
--

LOCK TABLES `customer_follow_ups` WRITE;
/*!40000 ALTER TABLE `customer_follow_ups` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_notes`
--

DROP TABLE IF EXISTS `customer_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_notes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `customer_notes_customerId_fkey` (`customerId`),
  CONSTRAINT `customer_notes_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_notes`
--

LOCK TABLES `customer_notes` WRITE;
/*!40000 ALTER TABLE `customer_notes` DISABLE KEYS */;
INSERT INTO `customer_notes` VALUES ('cmobmu49u0007ermvgtcaix5f','cmobmdu1g000610h2md9017sg','Kh','nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-04-23 15:24:30.882'),('cmobn01hm000dermvbvddsylc','cmobmdu1g000610h2md9017sg','Khach kho tinh, goi sau 10h sang','nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-04-23 15:29:07.206');
/*!40000 ALTER TABLE `customer_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerType` enum('ca_nhan','doanh_nghiep') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ca_nhan',
  `company` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPerson` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredPayment` enum('cod','bank_transfer','credit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod',
  `telegramChatId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `totalOrders` int NOT NULL DEFAULT '0',
  `totalRevenue` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('cmobk1eaa0006gtcwkt7wgwxy','KH-0001','','','','','','','doanh_nghiep','','','','cod','','',1,0,0,'2026-04-23 14:06:11.601','2026-04-23 14:06:11.601'),('cmobkpi9c000lgtcwnvezp8id','KH-0002','fdgds','0676567575','bachsydonggiphn@gmail.com','sdf','sdf','sdfg','ca_nhan','','','','cod','36784556','xdf',1,0,0,'2026-04-23 14:24:56.497','2026-04-23 14:24:56.497'),('cmobmdu1g000610h2md9017sg','KH-0003','Công ty ABC','0912888777','','123 Lê Lợi','TP. Hồ Chí Minh','','doanh_nghiep','','','','cod','','',1,0,0,'2026-04-23 15:11:51.125','2026-04-23 15:11:51.125');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_logs`
--

DROP TABLE IF EXISTS `delivery_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shippingOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `imageUrl` text COLLATE utf8mb4_unicode_ci,
  `signatureUrl` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `delivery_logs_shippingOrderId_fkey` (`shippingOrderId`),
  CONSTRAINT `delivery_logs_shippingOrderId_fkey` FOREIGN KEY (`shippingOrderId`) REFERENCES `shipping_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_logs`
--

LOCK TABLES `delivery_logs` WRITE;
/*!40000 ALTER TABLE `delivery_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idCard` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `licenseNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `licenseType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `licenseExpiry` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('available','delivering','leave','inactive','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `joinedDate` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `avatar` text COLLATE utf8mb4_unicode_ci,
  `currentVehicleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `drivers_code_key` (`code`),
  UNIQUE KEY `drivers_userId_key` (`userId`),
  KEY `drivers_currentVehicleId_fkey` (`currentVehicleId`),
  CONSTRAINT `drivers_currentVehicleId_fkey` FOREIGN KEY (`currentVehicleId`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `drivers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`uid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fuel_logs`
--

DROP TABLE IF EXISTS `fuel_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fuel_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` double NOT NULL,
  `volume` double NOT NULL DEFAULT '0',
  `mileage` double NOT NULL DEFAULT '0',
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` text COLLATE utf8mb4_unicode_ci,
  `receiptUrl` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fuel_logs_driverId_fkey` (`driverId`),
  KEY `fuel_logs_userId_fkey` (`userId`),
  KEY `fuel_logs_vehicleId_fkey` (`vehicleId`),
  CONSTRAINT `fuel_logs_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fuel_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`uid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fuel_logs_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fuel_logs`
--

LOCK TABLES `fuel_logs` WRITE;
/*!40000 ALTER TABLE `fuel_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `fuel_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gps_logs`
--

DROP TABLE IF EXISTS `gps_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gps_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `gps_logs_driverId_fkey` (`driverId`),
  CONSTRAINT `gps_logs_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gps_logs`
--

LOCK TABLES `gps_logs` WRITE;
/*!40000 ALTER TABLE `gps_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `gps_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_check_results`
--

DROP TABLE IF EXISTS `inventory_check_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_check_results` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actualWarehouse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actualArea` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actualShelf` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actualLayer` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actualSlot` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `inventory_check_results_checkId_fkey` (`checkId`),
  CONSTRAINT `inventory_check_results_checkId_fkey` FOREIGN KEY (`checkId`) REFERENCES `inventory_checks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_check_results`
--

LOCK TABLES `inventory_check_results` WRITE;
/*!40000 ALTER TABLE `inventory_check_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_check_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_checks`
--

DROP TABLE IF EXISTS `inventory_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_checks` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_checks`
--

LOCK TABLES `inventory_checks` WRITE;
/*!40000 ALTER TABLE `inventory_checks` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_checks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_bom_components`
--

DROP TABLE IF EXISTS `material_bom_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_bom_components` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bomId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` double NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `material_bom_components_bomId_fkey` (`bomId`),
  KEY `material_bom_components_materialId_fkey` (`materialId`),
  CONSTRAINT `material_bom_components_bomId_fkey` FOREIGN KEY (`bomId`) REFERENCES `material_boms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `material_bom_components_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_bom_components`
--

LOCK TABLES `material_bom_components` WRITE;
/*!40000 ALTER TABLE `material_bom_components` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_bom_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_boms`
--

DROP TABLE IF EXISTS `material_boms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_boms` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `material_boms_productId_key` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_boms`
--

LOCK TABLES `material_boms` WRITE;
/*!40000 ALTER TABLE `material_boms` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_boms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_transaction_items`
--

DROP TABLE IF EXISTS `material_transaction_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_transaction_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transactionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` double NOT NULL,
  `unitPrice` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `material_transaction_items_transactionId_fkey` (`transactionId`),
  KEY `material_transaction_items_materialId_fkey` (`materialId`),
  CONSTRAINT `material_transaction_items_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `material_transaction_items_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `material_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_transaction_items`
--

LOCK TABLES `material_transaction_items` WRITE;
/*!40000 ALTER TABLE `material_transaction_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_transaction_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_transactions`
--

DROP TABLE IF EXISTS `material_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_transactions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `supplier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referenceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_transactions`
--

LOCK TABLES `material_transactions` WRITE;
/*!40000 ALTER TABLE `material_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currentStock` double NOT NULL DEFAULT '0',
  `minStock` double NOT NULL DEFAULT '0',
  `purchasePrice` double NOT NULL DEFAULT '0',
  `supplier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseLocation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('còn hàng','sắp hết','hết hàng','ngừng sử dụng') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'còn hàng',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `materials_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materials`
--

LOCK TABLES `materials` WRITE;
/*!40000 ALTER TABLE `materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specification` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unitPrice` double NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `order_items_orderId_fkey` (`orderId`),
  CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_logs`
--

DROP TABLE IF EXISTS `order_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldValue` text COLLATE utf8mb4_unicode_ci,
  `newValue` text COLLATE utf8mb4_unicode_ci,
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `order_logs_orderId_fkey` (`orderId`),
  CONSTRAINT `order_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_logs`
--

LOCK TABLES `order_logs` WRITE;
/*!40000 ALTER TABLE `order_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerAddress` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('nháp','chờ duyệt','đã duyệt','từ chối','đang chuẩn bị hàng','chờ xuất kho','đang giao','hoàn thành','hủy') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nháp',
  `priority` enum('thấp','trung bình','cao','khẩn cấp') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trung bình',
  `paymentMethod` enum('cod','bank_transfer','credit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod',
  `bankAccountId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'chua_thanh_toan',
  `note` text COLLATE utf8mb4_unicode_ci,
  `quantity` int NOT NULL,
  `deliveryDeadline` datetime(3) DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalRevenue` double DEFAULT NULL,
  `totalCost` double DEFAULT NULL,
  `profit` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_code_key` (`code`),
  KEY `orders_customerId_fkey` (`customerId`),
  KEY `orders_createdBy_fkey` (`createdBy`),
  KEY `orders_approvedBy_fkey` (`approvedBy`),
  CONSTRAINT `orders_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`uid`),
  CONSTRAINT `orders_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users` (`uid`),
  CONSTRAINT `orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_rolls`
--

DROP TABLE IF EXISTS `product_rolls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_rolls` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qrCode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specification` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `length` double NOT NULL,
  `weight` double NOT NULL,
  `productionDate` datetime(3) NOT NULL,
  `productionOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `positionWarehouse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `positionArea` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `positionShelf` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `positionLayer` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `positionSlot` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('đang sản xuất','trong kho','đã giữ cho đơn hàng','đã xuất kho','lỗi / hỏng','hoàn trả') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'đang sản xuất',
  `creator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `diameter` double DEFAULT NULL,
  `height` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_rolls_code_key` (`code`),
  UNIQUE KEY `product_rolls_qrCode_key` (`qrCode`),
  KEY `product_rolls_creator_fkey` (`creator`),
  KEY `product_rolls_orderId_fkey` (`orderId`),
  KEY `product_rolls_productionOrderId_fkey` (`productionOrderId`),
  KEY `product_rolls_materialId_fkey` (`materialId`),
  CONSTRAINT `product_rolls_creator_fkey` FOREIGN KEY (`creator`) REFERENCES `users` (`uid`) ON UPDATE CASCADE,
  CONSTRAINT `product_rolls_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `product_rolls_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `product_rolls_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `production_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_rolls`
--

LOCK TABLES `product_rolls` WRITE;
/*!40000 ALTER TABLE `product_rolls` DISABLE KEYS */;
INSERT INTO `product_rolls` VALUES ('ROLL-240426124215-DB','ROLL-240426124215-DB','ROLL-240426124215-DB','cmocg08yh0007e59jvrqfry1d','50','50',60,3,'2026-04-24 05:42:15.404','cmocg08yh0007e59jvrqfry1d',NULL,NULL,NULL,NULL,NULL,'trong kho','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,NULL,'2026-04-24 05:42:15.405','2026-04-24 05:45:08.479',NULL,NULL),('ROLL-240426124416-DB','ROLL-240426124416-DB','ROLL-240426124416-DB','cmochjmxe0004z9yku1njwghu','50','50',2,1,'2026-04-24 05:44:16.165','cmochjmxe0004z9yku1njwghu',NULL,NULL,NULL,NULL,NULL,'trong kho','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,NULL,'2026-04-24 05:44:16.166','2026-04-24 05:44:23.560',NULL,NULL);
/*!40000 ALTER TABLE `product_rolls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_order_materials`
--

DROP TABLE IF EXISTS `production_order_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_order_materials` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productionOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `production_order_materials_productionOrderId_fkey` (`productionOrderId`),
  CONSTRAINT `production_order_materials_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `production_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_order_materials`
--

LOCK TABLES `production_order_materials` WRITE;
/*!40000 ALTER TABLE `production_order_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_order_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_orders`
--

DROP TABLE IF EXISTS `production_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productionDate` datetime(3) NOT NULL,
  `creatorId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personInChargeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiredQuantity` int NOT NULL,
  `specs` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('waiting_material','ready','producing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'waiting_material',
  `consumptionRate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetRolls` int NOT NULL,
  `machineArea` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `deadline` datetime(3) DEFAULT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rollLength` double NOT NULL DEFAULT '0',
  `rollWeight` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `production_orders_code_key` (`code`),
  KEY `production_orders_creatorId_fkey` (`creatorId`),
  KEY `production_orders_personInChargeId_fkey` (`personInChargeId`),
  KEY `production_orders_orderId_fkey` (`orderId`),
  CONSTRAINT `production_orders_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`uid`) ON UPDATE CASCADE,
  CONSTRAINT `production_orders_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `production_orders_personInChargeId_fkey` FOREIGN KEY (`personInChargeId`) REFERENCES `users` (`uid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_orders`
--

LOCK TABLES `production_orders` WRITE;
/*!40000 ALTER TABLE `production_orders` DISABLE KEYS */;
INSERT INTO `production_orders` VALUES ('cmobn78wf001hermvg6sq52m2','LSX-20260423-001','2026-04-23 00:00:00.000','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,3,'50','completed',NULL,3,'1','','2026-04-23 00:00:00.000',NULL,'2026-04-23 15:34:43.407','2026-04-23 15:37:09.853',NULL,0,0),('cmobnbgrh0027ermvau00j0gh','LSX-20260423-223800','2026-04-23 00:00:00.000','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,100,'B','cancelled',NULL,5,'','','2026-04-23 00:00:00.000',NULL,'2026-04-23 15:38:00.219','2026-04-23 16:29:14.131',NULL,0,0),('cmobo8d1c003lermv8s42y50a','LSX-20260423-230335','2026-04-23 00:00:00.000','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,1,'50','cancelled',NULL,4,'1','','2026-04-23 00:00:00.000',NULL,'2026-04-23 16:03:35.041','2026-04-23 16:29:11.909',NULL,0,0),('cmocg08yh0007e59jvrqfry1d','LSX-20260424-120105','2026-04-24 00:00:00.000','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,1,'50','completed',NULL,1,'1',NULL,'2026-04-24 00:00:00.000',NULL,'2026-04-24 05:01:05.740','2026-04-24 05:43:13.424','50',60,3),('cmochjmxe0004z9yku1njwghu','LSX-20260424-124409','2026-04-24 00:00:00.000','nbjeSZkVLbP92o68qImdqmigHQ42',NULL,1,'50','waiting_material',NULL,1,'1',NULL,'2026-04-24 00:00:00.000',NULL,'2026-04-24 05:44:09.937','2026-04-24 05:44:09.937','50',2,1);
/*!40000 ALTER TABLE `production_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roll_movements`
--

DROP TABLE IF EXISTS `roll_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roll_movements` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromWarehouse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromArea` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromShelf` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromLayer` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromSlot` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toWarehouse` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toArea` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toShelf` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toLayer` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toSlot` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `roll_movements_rollId_fkey` (`rollId`),
  CONSTRAINT `roll_movements_rollId_fkey` FOREIGN KEY (`rollId`) REFERENCES `product_rolls` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roll_movements`
--

LOCK TABLES `roll_movements` WRITE;
/*!40000 ALTER TABLE `roll_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `roll_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roll_scan_history`
--

DROP TABLE IF EXISTS `roll_scan_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roll_scan_history` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `roll_scan_history_rollId_fkey` (`rollId`),
  CONSTRAINT `roll_scan_history_rollId_fkey` FOREIGN KEY (`rollId`) REFERENCES `product_rolls` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roll_scan_history`
--

LOCK TABLES `roll_scan_history` WRITE;
/*!40000 ALTER TABLE `roll_scan_history` DISABLE KEYS */;
INSERT INTO `roll_scan_history` VALUES ('cmochh6jx0002z9ykyxwrlrn7','ROLL-240426124215-DB','2026-04-24 05:42:15.405','Khởi tạo cuộn thành phẩm','Dong Bach'),('cmochjrqd0005z9yk4fw5kl5c','ROLL-240426124416-DB','2026-04-24 05:44:16.166','Khởi tạo cuộn thành phẩm','Dong Bach'),('cmochjxfr0006z9ykk47c2y8b','ROLL-240426124416-DB','2026-04-24 05:44:23.560','Nhập kho thành phẩm','Dong Bach'),('cmochkc5s0007z9yk4e7ua1xw','ROLL-240426124215-DB','2026-04-24 05:44:42.641','Nhập kho thành phẩm','Dong Bach'),('cmochkw3j000mz9ykhkp3mvj9','ROLL-240426124215-DB','2026-04-24 05:45:08.479','Nhập kho thành phẩm','Dong Bach');
/*!40000 ALTER TABLE `roll_scan_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_order_items`
--

DROP TABLE IF EXISTS `shipping_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_order_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shippingOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qrCode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specification` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'exported',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `shipping_order_items_shippingOrderId_fkey` (`shippingOrderId`),
  KEY `shipping_order_items_rollId_fkey` (`rollId`),
  CONSTRAINT `shipping_order_items_rollId_fkey` FOREIGN KEY (`rollId`) REFERENCES `product_rolls` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `shipping_order_items_shippingOrderId_fkey` FOREIGN KEY (`shippingOrderId`) REFERENCES `shipping_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_order_items`
--

LOCK TABLES `shipping_order_items` WRITE;
/*!40000 ALTER TABLE `shipping_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipping_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_orders`
--

DROP TABLE IF EXISTS `shipping_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerAddress` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalRolls` int NOT NULL,
  `totalQuantity` int NOT NULL DEFAULT '0',
  `status` enum('chờ xuất kho','đang chuẩn bị hàng','đã xuất kho','đã bàn giao cho tài xế','đang giao','giao thành công','giao thất bại','hoàn trả') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chờ xuất kho',
  `assignedDriverId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedDriverName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedVehicle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryDeadline` datetime(3) DEFAULT NULL,
  `shippedAt` datetime(3) DEFAULT NULL,
  `deliveredAt` datetime(3) DEFAULT NULL,
  `failedAt` datetime(3) DEFAULT NULL,
  `failReason` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipping_orders_code_key` (`code`),
  KEY `shipping_orders_orderId_fkey` (`orderId`),
  CONSTRAINT `shipping_orders_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_orders`
--

LOCK TABLES `shipping_orders` WRITE;
/*!40000 ALTER TABLE `shipping_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipping_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity_logs`
--

DROP TABLE IF EXISTS `user_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activity_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referenceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `user_activity_logs_userId_fkey` (`userId`),
  CONSTRAINT `user_activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity_logs`
--

LOCK TABLES `user_activity_logs` WRITE;
/*!40000 ALTER TABLE `user_activity_logs` DISABLE KEYS */;
INSERT INTO `user_activity_logs` VALUES ('cmobk1eb50008gtcwd2aizore','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Tạo khách hàng','Khách hàng','cmobk1eaa0006gtcwkt7wgwxy','Tạo khách hàng:  (KH-0001)','2026-04-23 14:06:11.634'),('cmobkpi9r000ngtcwz8mic6ih','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Tạo khách hàng','Khách hàng','cmobkpi9c000lgtcwnvezp8id','Tạo khách hàng: fdgds (KH-0002)','2026-04-23 14:24:56.511'),('cmobmdu1z000810h21gakq78r','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Tạo khách hàng','Khách hàng','cmobmdu1g000610h2md9017sg','Tạo khách hàng: Công ty ABC (KH-0003)','2026-04-23 15:11:51.143');
/*!40000 ALTER TABLE `user_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_login_logs`
--

DROP TABLE IF EXISTS `user_login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_login_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_unicode_ci,
  `loginAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `logoutAt` datetime(3) DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  PRIMARY KEY (`id`),
  KEY `user_login_logs_userId_fkey` (`userId`),
  CONSTRAINT `user_login_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_login_logs`
--

LOCK TABLES `user_login_logs` WRITE;
/*!40000 ALTER TABLE `user_login_logs` DISABLE KEYS */;
INSERT INTO `user_login_logs` VALUES ('cmobjm84a0002103fng9uh1k5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 13:54:23.770',NULL,'success'),('cmobjmtrz0004103f2erdxrn6','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 13:54:51.839',NULL,'success'),('cmobjo8360006103fbzrw71b9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 13:55:57.042',NULL,'success'),('cmobjt5p10001gtcw2qrk42np','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 13:59:47.221',NULL,'success'),('cmobjtzmu0003gtcw0at5h4al','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:00:26.022',NULL,'success'),('cmobjxvue0005gtcwhh81557c','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:03:27.734',NULL,'success'),('cmobk703b000agtcwsd8b8lb2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:10:33.143',NULL,'success'),('cmobk7z15000cgtcwc75a8tp2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:11:18.426',NULL,'success'),('cmobk8g2t000egtcw6bg4547i','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:11:40.517',NULL,'success'),('cmobk8sff000ggtcw5iyad1sy','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:11:56.523',NULL,'success'),('cmobk97a9000igtcwnc2ac45u','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:12:15.777',NULL,'success'),('cmobkekhq000kgtcw9sa2in4f','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:16:26.174',NULL,'success'),('cmobkvamm000pgtcwzigfmkaq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:29:26.542',NULL,'success'),('cmobkvfrt000rgtcwxqwdctmq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:29:33.209',NULL,'success'),('cmoblv65r000tgtcw72c7j3bm','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:57:20.368',NULL,'success'),('cmoblwta6000vgtcw0h8qxdt8','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:58:36.991',NULL,'success'),('cmoblxoew000xgtcwzmwp7py5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 14:59:17.336',NULL,'success'),('cmobm4ha3000110h2qjil0jhx','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:04:34.684',NULL,'success'),('cmobm57uj000310h2tk8iu50h','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:05:09.115',NULL,'success'),('cmobmcccx000510h2hlutmm5u','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:10:41.553',NULL,'success'),('cmobmmqvi000a10h24k2fr6g4','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:18:46.926',NULL,'success'),('cmobmmr07000c10h2s2ixnzy1','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:18:47.096',NULL,'success'),('cmobmsm720001ermvxvudzzb9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:23:20.794',NULL,'success'),('cmobmsner0003ermvo77q8ue5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:23:22.372',NULL,'success'),('cmobmtc5s0005ermvjflqwkgq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:23:54.449',NULL,'success'),('cmobmzl1h000bermv1pjiih02','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:28:45.894',NULL,'success'),('cmobn248t000hermvn4wp9axg','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:30:44.094',NULL,'success'),('cmobn2dmp000jermv8ddlqfc9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:30:56.258',NULL,'success'),('cmobn6tof001dermve10zcv5b','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:34:23.680',NULL,'success'),('cmobn6ubn001fermvhk06h3hb','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:34:24.515',NULL,'success'),('cmobn8w950023ermvu3za62tc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:36:00.329',NULL,'success'),('cmobna4ty0025ermvbqjvsmyp','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:36:58.103',NULL,'success'),('cmobngsm30029ermv9d18xpgi','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:08.859',NULL,'success'),('cmobngsys002bermvrl3d8m4g','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:09.316',NULL,'success'),('cmobnh2t8002dermv2erfs6vw','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:22.076',NULL,'success'),('cmobnh3oh002fermv0ccpqoqw','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:23.202',NULL,'success'),('cmobnhdm5002hermvb9sx1gqd','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:36.078',NULL,'success'),('cmobnhfny002jermv1wn17vfg','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:38.735',NULL,'success'),('cmobnhowc002lermv61mab6yg','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:50.701',NULL,'success'),('cmobnhpah002nermv7lngm2pv','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:42:51.209',NULL,'success'),('cmobni1h7002permv2zj4edjf','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:43:07.003',NULL,'success'),('cmobni2ed002rermv65oremra','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:43:08.197',NULL,'success'),('cmobnm7r9002termvd6oykofu','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:46:21.765',NULL,'success'),('cmobnm7zq002vermvodhqns04','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:46:22.070',NULL,'success'),('cmobno092002xermv0vgeqeua','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:47:45.351',NULL,'success'),('cmobno09g002zermvfr1rls3c','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:47:45.364',NULL,'success'),('cmobnova30031ermvy18ufy63','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:48:25.564',NULL,'success'),('cmobnovqz0033ermv6ji1ujki','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:48:26.172',NULL,'success'),('cmobnq6tl0035ermvjmkc5x4r','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:49:27.177',NULL,'success'),('cmobnq7mr0037ermvc9sp0t8u','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:49:28.227',NULL,'success'),('cmobnxbue0039ermvlovi481u','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:55:00.279',NULL,'success'),('cmobnxtkx003bermv9yf472xr','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:55:23.266',NULL,'success'),('cmobnydtw003dermvsw3mv3bm','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:55:49.508',NULL,'success'),('cmobnye8n003fermv8sunaqx1','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 15:55:50.040',NULL,'success'),('cmobo4wt0003hermvpga3901b','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:00:54.037',NULL,'success'),('cmobo4wuc003jermvz26n8r81','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:00:54.085',NULL,'success'),('cmoboao1c003nermvxvufphkk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:05:22.608',NULL,'success'),('cmoboaoj3003permvidkwp97w','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:05:23.247',NULL,'success'),('cmoboawpe003rermvpc4wnle9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:05:33.843',NULL,'success'),('cmoboaxry003termvqtr4zzqh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:05:35.230',NULL,'success'),('cmoboh05s003vermv44wyy4gh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:10:18.257',NULL,'success'),('cmoboh06r003xermvunqyd1ik','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:10:18.292',NULL,'success'),('cmobohiuv003zermvl3aqrsae','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:10:42.487',NULL,'success'),('cmobohj4n0041ermvwb9dj28r','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:10:42.840',NULL,'success'),('cmoboqc9f0057ermvavabh2vf','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:17:33.844',NULL,'success'),('cmoboqcn00059ermvmykfqdd6','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:17:34.333',NULL,'success'),('cmoboyt970001ehtcgxp7fblc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:24:09.115',NULL,'success'),('cmobp577p0001e59jsbk4gexo','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 16:29:07.141',NULL,'success'),('cmoc4sp1x0003e59jzmo7mfb3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-23 23:47:17.590',NULL,'success'),('cmocfnxld0005e59j5l4pwgvz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 04:51:31.154',NULL,'success'),('cmocg24gf0009e59j56d3ei40','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:02:33.232',NULL,'success'),('cmocg5upa000be59j3jgxvmkg','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:05:27.214',NULL,'success'),('cmocg7g64000110szuxvieslw','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:06:41.693',NULL,'success'),('cmocgki6s000310szf87k360t','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:16:50.836',NULL,'success'),('cmocgn3cf0001a3lwmq5rnzyn','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:18:51.567',NULL,'success'),('cmocgnlhy0003a3lwu3n4tpvj','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:19:15.094',NULL,'success'),('cmocgnwbm0005a3lw48lc0077','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:19:29.123',NULL,'success'),('cmocgpf5a0007a3lwd84qqnu1','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:20:40.174',NULL,'success'),('cmocgpv4h0009a3lwti6s0n3c','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:21:00.881',NULL,'success'),('cmocgq54d000ba3lw09bn9vue','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:21:13.837',NULL,'success'),('cmocgt6e7000da3lwr6kjtt3m','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:23:35.455',NULL,'success'),('cmochchrj0001z9yk5ppl2w73','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 05:38:36.656',NULL,'success'),('cmocqvi8u000oz9yk1wxn7wki','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-24 10:05:20.287',NULL,'success'),('cmoziro9k0001k7nkh1op2ney','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-10 08:37:06.579',NULL,'success'),('cmozis2tw0003k7nkgsk7skqj','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-10 08:37:25.461',NULL,'success'),('cmoziyoua0005k7nk5zi5vshw','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-10 08:42:33.923',NULL,'success'),('cmozxrbzz0001bc3yjuk1yjht','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-10 15:36:44.924',NULL,'success'),('cmozz20wh0001bqx4027itzzh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-10 16:13:03.377',NULL,'success'),('cmozzk19d0003bqx46tejd4dn','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-10 16:27:03.649',NULL,'success'),('cmp0lmupu0001kw53vyjp0dr6','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-11 02:45:06.685',NULL,'success');
/*!40000 ALTER TABLE `user_login_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` text COLLATE utf8mb4_unicode_ci,
  `role` enum('super_admin','admin','staff','driver','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `status` enum('active','blocked','pending','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_uid_key` (`uid`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmobjm83m0000103f48xz241f','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Dong Bach','https://lh3.googleusercontent.com/a/ACg8ocIROSjudUStx2GqFQDILbHiQx1g7i3KUh9PZZOz-8p7HA3fPD80=s96-c','super_admin','active',NULL,NULL,NULL,'2026-05-11 02:45:06.642','2026-04-23 13:54:23.746','2026-05-11 02:45:06.643');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_maintenances`
--

DROP TABLE IF EXISTS `vehicle_maintenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_maintenances` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost` double NOT NULL,
  `mileage` double NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `vehicle_maintenances_vehicleId_fkey` (`vehicleId`),
  CONSTRAINT `vehicle_maintenances_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_maintenances`
--

LOCK TABLES `vehicle_maintenances` WRITE;
/*!40000 ALTER TABLE `vehicle_maintenances` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_maintenances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plateNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` double NOT NULL,
  `year` int NOT NULL,
  `condition` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registrationDate` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `insuranceExpiry` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currentMileage` double NOT NULL DEFAULT '0',
  `status` enum('available','in_use','maintenance','broken','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicles_plateNumber_key` (`plateNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-13 12:46:22
