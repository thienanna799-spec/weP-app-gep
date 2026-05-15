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
INSERT INTO `bank_accounts` VALUES ('cmp3qej5r002qhqf81g02oxqt','vpbank','0889128836','bach đồng','',1,1,'2026-05-13 07:21:55.072','2026-05-13 07:21:55.072');
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_logs`
--

DROP TABLE IF EXISTS `contact_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `result` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `method` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `recordingUrl` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `contact_logs_orderId_fkey` (`orderId`),
  CONSTRAINT `contact_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_logs`
--

LOCK TABLES `contact_logs` WRITE;
/*!40000 ALTER TABLE `contact_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_logs` ENABLE KEYS */;
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
/*!40000 ALTER TABLE `customer_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_pricing`
--

DROP TABLE IF EXISTS `customer_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_pricing` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `updatedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedByName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_pricing_customerId_sku_key` (`customerId`,`sku`),
  CONSTRAINT `customer_pricing_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_pricing`
--

LOCK TABLES `customer_pricing` WRITE;
/*!40000 ALTER TABLE `customer_pricing` DISABLE KEYS */;
INSERT INTO `customer_pricing` VALUES ('cmp2cnopd000a6o6lmdi9vwgg','cmp1z3cio000p13hf70x6atlv','BWP-TK-WHITE-20inch × 100m',460,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.362','2026-05-12 08:09:21.362'),('cmp2cnopk000c6o6lfgrnenmn','cmp1z3cio000p13hf70x6atlv','BWP-TK-BLACK-20inch × 100m',460,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.368','2026-05-12 08:09:21.368'),('cmp2cnopn000e6o6lzod7kilq','cmp1z3chp000e13hfi1h5zw0o','BWP-TK-WHITE-20inch × 100m',450,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.372','2026-05-12 08:09:21.372'),('cmp2cnopq000g6o6ld3uyxflq','cmp1z3ci3000i13hf1px6tyh5','BWP-TH-WHITE-20inch × 100m',430,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.375','2026-05-12 08:09:21.375'),('cmp2cnopt000i6o6ltqfbpnnt','cmp1z3ci3000i13hf1px6tyh5','PLAIN--BLACK-M',0.73,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.378','2026-05-12 08:09:21.378'),('cmp2cnopw000k6o6lawkj8mu6','cmp1z3ci3000i13hf1px6tyh5','PLAIN--BLACK-L',0.95,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.381','2026-05-12 08:09:21.381'),('cmp2cnopz000m6o6lonjbthoa','cmp1z3ci3000i13hf1px6tyh5','TAPE-TA-CLEAR-2inch × 100m',20,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.383','2026-05-12 08:09:21.383'),('cmp2cnoq2000o6o6lza0sbzzf','cmp1z3ci3000i13hf1px6tyh5','WB-RIM-PAPER-100*150',2640,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.387','2026-05-12 08:09:21.387'),('cmp2cnoq5000q6o6ljgqikk19','cmp1z3ck0001613hf0gyvsff5','BWP-TH-BLACK-20inch × 100m',380,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.390','2026-05-12 08:09:21.390'),('cmp2cnoq8000s6o6l8tjv8fqf','cmp1z3cjx001513hfath2bls7','BWP-TH-BLACK-20inch × 100m',380,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.392','2026-05-12 08:09:21.392'),('cmp2cnoqb000u6o6lmfh3fs8b','cmp1z3cjx001513hfath2bls7','PLAIN--BLACK-XXL',1.5,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.395','2026-05-12 08:09:21.395'),('cmp2cnoqe000w6o6l0nont1mp','cmp1z3cic000l13hf9n2x5ev4','TAPE-TA-CLEAR-2inch × 100m',22,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.398','2026-05-12 08:09:21.398'),('cmp2cnoqh000y6o6lqoqw877d','cmp1z3chu000f13hfgg8df5z4','BWP-TK-WHITE-20inch × 100m',450,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.401','2026-05-12 08:09:21.401'),('cmp2cnoqk00106o6l3m9hqa5v','cmp1z3cjf000z13hfd2ygdflb','BWP-TH-WHITE-40inch × 100m',430,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.405','2026-05-12 08:09:21.405'),('cmp2cnoqn00126o6l4sdm28je','cmp1z3cjx001513hfath2bls7','TAPE-TA-CLEAR-2inch × 100m',20,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.407','2026-05-12 08:09:21.407'),('cmp2cnoqq00146o6lwzfpc2f7','cmp1z3ck0001613hf0gyvsff5','TAPE-TA-CLEAR-2inch × 100m',20,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.410','2026-05-12 08:09:21.410'),('cmp2cnoqt00166o6lofvq135t','cmp1z3ck0001613hf0gyvsff5','PLAIN--BLACK-S',0.42,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.414','2026-05-12 08:09:21.414'),('cmp2cnoqw00186o6ljciwcys4','cmp1z3ckd001b13hf3uxr7m1h','BWP-TH-BLACK-20inch × 100m',380,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.417','2026-05-12 08:09:21.417'),('cmp2cnoqz001a6o6l0qta9nxw','cmp1z3ckd001b13hf3uxr7m1h','TAPE-TA-CLEAR-2inch × 100m',20,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.420','2026-05-12 08:09:21.420'),('cmp2cnor3001c6o6ljwu40acu','cmp1z3ckd001b13hf3uxr7m1h','WB-RIM-PAPER-100*150',2600,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.423','2026-05-12 08:09:21.423'),('cmp2cnor6001e6o6lp1cpsnog','cmp1z3ck0001613hf0gyvsff5','WB-RIM-PAPER-100*150',2600,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.427','2026-05-12 08:09:21.427'),('cmp2cnor9001g6o6lfi70p0no','cmp1z3cjx001513hfath2bls7','WB-RIM-PAPER-100*150',2600,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.430','2026-05-12 08:09:21.430'),('cmp2cnord001i6o6l878t7qcc','cmp1z3ckd001b13hf3uxr7m1h','PLAIN--BLACK-S',0.42,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.433','2026-05-12 08:09:21.433'),('cmp2cnorg001k6o6l44vfcbmk','cmp1z3ckd001b13hf3uxr7m1h','PLAIN--BLACK-M',0.73,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.436','2026-05-12 08:09:21.436'),('cmp2cnorj001m6o6ln9j89cgc','cmp1z3ckd001b13hf3uxr7m1h','PLAIN--BLACK-L',0.95,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.439','2026-05-12 08:09:21.439'),('cmp2cnorn001o6o6lpksnsib5','cmp1z3ckd001b13hf3uxr7m1h','PLAIN--BLACK-XL',1.1,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.443','2026-05-12 08:09:21.443'),('cmp2cnorq001q6o6lew4wa0mh','cmp1z3cjx001513hfath2bls7','PLAIN--BLACK-S',0.42,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.446','2026-05-12 08:09:21.446'),('cmp2cnort001s6o6l41lcmvwk','cmp1z3cjx001513hfath2bls7','PLAIN--BLACK-M',0.73,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.450','2026-05-12 08:09:21.450'),('cmp2cnorx001u6o6l6zwjmb79','cmp1z3cjx001513hfath2bls7','PLAIN--BLACK-L',0.95,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.453','2026-05-12 08:09:21.453'),('cmp2cnos0001w6o6lrm608h07','cmp1z3cjx001513hfath2bls7','PLAIN--BLACK-XL',1.1,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.457','2026-05-12 08:09:21.457'),('cmp2cnos4001y6o6l2g8swcmp','cmp1z3cic000l13hf9n2x5ev4','BWP-TH-BLACK-20inch × 100m',390,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.460','2026-05-12 08:09:21.460'),('cmp2cnos700206o6luc0uf2su','cmp1z3ci0000h13hfborhc2u9','PLAIN--BLACK-L',0.95,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.464','2026-05-12 08:09:21.464'),('cmp2cnosb00226o6ls60hbpqj','cmp1z3ci0000h13hfborhc2u9','PLAIN--BLACK-S',0.42,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.467','2026-05-12 08:09:21.467'),('cmp2cnose00246o6lmdpnzc3o','cmp1z3ci0000h13hfborhc2u9','PLAIN--BLACK-M',0.73,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.470','2026-05-12 08:09:21.470'),('cmp2cnosh00266o6lzhwl8a5c','cmp1z3ci0000h13hfborhc2u9','BWP-TH-BLACK-20inch × 100m',380,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.473','2026-05-12 08:09:21.473'),('cmp2cnosk00286o6l39wbu70w','cmp1z3chl000d13hfgvffiuga','BWP-TH-BLACK-20inch × 100m',370,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.476','2026-05-12 08:09:21.476'),('cmp2cnosn002a6o6lo05r6bpq','cmp1z3chl000d13hfgvffiuga','BWP-TH-WHITE-20inch × 100m',410,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.480','2026-05-12 08:09:21.480'),('cmp2cnosr002c6o6lqc9ks1ua','cmp1z3chl000d13hfgvffiuga','TAPE-TA-CLEAR-2inch × 200m',37,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.483','2026-05-12 08:09:21.483'),('cmp2cnosu002e6o6lmf0vplww','cmp1z3ci0000h13hfborhc2u9','WB-RIM-PAPER-100*150',2600,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.486','2026-05-12 08:09:21.486'),('cmp2cnosy002g6o6lc4mgviz6','cmp1z3cii000n13hfd77kdseb','TAPE-TA-CLEAR-2inch × 100m',20,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.490','2026-05-12 08:09:21.490'),('cmp2cnot1002i6o6l8mu2zhmg','cmp1z3cii000n13hfd77kdseb','BWP-TH-BLACK-40inch × 100m',380,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.493','2026-05-12 08:09:21.493'),('cmp2cnot4002k6o6lti8xdvee','cmp1z3ci9000k13hfg1dkuhkj','BWP-TH-BLACK-20inch × 100m',390,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.497','2026-05-12 08:09:21.497'),('cmp2cnot7002m6o6llvjktm2t','cmp1z3cii000n13hfd77kdseb','TAPE-TA-CLEAR-2inch × 200m',39,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.500','2026-05-12 08:09:21.500'),('cmp2cnota002o6o6lm32x3s7s','cmp1z3ck0001613hf0gyvsff5','TAPE-TA-CLEAR-2inch × 200m',39,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.503','2026-05-12 08:09:21.503'),('cmp2cnotd002q6o6l5a1swirm','cmp1z3ck0001613hf0gyvsff5','PLAIN--BLACK-M',0.73,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.505','2026-05-12 08:09:21.505'),('cmp2cnoth002s6o6l1zrvncef','cmp1z3cjr001313hf7c7qj0r4','BWP-TH-BLACK-20inch × 100m',380,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.509','2026-05-12 08:09:21.509'),('cmp2cnotn002u6o6ll5n1hwv6','cmp1z3ck6001813hf79ycf2gz','BWP-TH-WHITE-20inch × 100m',420,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.516','2026-05-12 08:09:21.516'),('cmp2cnotr002w6o6lxxsrusxv','cmp1z3ck6001813hf79ycf2gz','BWP-TH-BLACK-20inch × 100m',400,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.520','2026-05-12 08:09:21.520'),('cmp2cnotx002y6o6lahijvfn1','cmp1z3ciq000q13hfz9tfosjq','BWP-TK-WHITE-40inch × 100m',450,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.525','2026-05-12 08:09:21.525'),('cmp2cnou100306o6lhq8r1fmu','cmp1z3ciq000q13hfz9tfosjq','BWP-TK-BLACK-40inch × 100m',430,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.529','2026-05-12 08:09:21.529'),('cmp2cnou500326o6lwlkt851n','cmp1z3ciq000q13hfz9tfosjq','TAPE-TA-CLEAR-2inch × 200m',39,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.534','2026-05-12 08:09:21.534'),('cmp2cnoua00346o6li78qy8uv','cmp1z3cjr001313hf7c7qj0r4','PLAIN--BLACK-S',0.42,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.538','2026-05-12 08:09:21.538'),('cmp2cnoud00366o6liz55uq4a','cmp1z3ck6001813hf79ycf2gz','WB-RIM-PAPER-100*150',2640,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.541','2026-05-12 08:09:21.541'),('cmp2cnoug00386o6lug1zw90o','cmp1z3cjo001213hfakd3lqe7','PLAIN--BLACK-M',0.75,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.545','2026-05-12 08:09:21.545'),('cmp2cnouk003a6o6lwfymjeh7','cmp1z3cjo001213hfakd3lqe7','PLAIN--BLACK-L',1,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.548','2026-05-12 08:09:21.548'),('cmp2cnoun003c6o6lgo9ucl1t','cmp1z3cjo001213hfakd3lqe7','BWP-TH-WHITE-20inch × 100m',430,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.551','2026-05-12 08:09:21.551'),('cmp2cnouq003e6o6l34trkhvd','cmp1z3ci6000j13hfxzl0mk70','PLAIN--BLACK-M',0.7,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.555','2026-05-12 08:09:21.555'),('cmp2cnout003g6o6lnyf6db1d','cmp1z3ci6000j13hfxzl0mk70','PLAIN--BLACK-L',0.9,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.558','2026-05-12 08:09:21.558'),('cmp2cnoux003i6o6l3dqkomfz','cmp1z3ci6000j13hfxzl0mk70','PLAIN--BLACK-XL',1.1,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.561','2026-05-12 08:09:21.561'),('cmp2cnov0003k6o6l0ny5zuqr','cmp1z3ckb001a13hf2ub40hqt','BWP-TH-BLACK-40inch × 100m',400,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.564','2026-05-12 08:09:21.564'),('cmp2cnov3003m6o6lixb8auc5','cmp1z3ckb001a13hf2ub40hqt','WB-RIM-PAPER-100*150',2640,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.567','2026-05-12 08:09:21.567'),('cmp2cnov6003o6o6llw3sztyr','cmp1z3ckd001b13hf3uxr7m1h','TAPE-TA-CLEAR-2inch × 200m',39,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.570','2026-05-12 08:09:21.570'),('cmp2cnov9003q6o6lozzpozms','cmp1z3ck0001613hf0gyvsff5','PLAIN--BLACK-XL',1.1,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 08:09:21.573','2026-05-12 08:09:21.573');
/*!40000 ALTER TABLE `customer_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_subsku_status`
--

DROP TABLE IF EXISTS `customer_subsku_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_subsku_status` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subSku` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_subsku_status_customerId_subSku_key` (`customerId`,`subSku`),
  CONSTRAINT `customer_subsku_status_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_subsku_status`
--

LOCK TABLES `customer_subsku_status` WRITE;
/*!40000 ALTER TABLE `customer_subsku_status` DISABLE KEYS */;
INSERT INTO `customer_subsku_status` VALUES ('cmp2fo4qm00406o6lqi8kbkdt','cmp1z3ckd001b13hf3uxr7m1h','PP-PLAIN-BLACK-M-23×41',1);
/*!40000 ALTER TABLE `customer_subsku_status` ENABLE KEYS */;
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
  `name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateOfOrigin` datetime(3) DEFAULT NULL,
  `recipientName` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupName` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupChatLink` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operatingPlatform` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerCharacteristics` text COLLATE utf8mb4_unicode_ci,
  `gipCode` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product` text COLLATE utf8mb4_unicode_ci,
  `operationalStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `boss` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cessationDate` datetime(3) DEFAULT NULL,
  `tag` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `googleMapsLink` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerType` enum('ca_nhan','doanh_nghiep') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ca_nhan',
  `company` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPerson` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredPayment` enum('cod','bank_transfer','credit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod',
  `bankAccountNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankAccountHolder` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegramChatId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `creditLimit` double NOT NULL DEFAULT '0',
  `creditDays` int NOT NULL DEFAULT '30',
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
INSERT INTO `customers` VALUES ('cmp1z3ch3000a13hfy2ucihti','MÃ KHÁCH HÀNG','TÊN KHÁCH HÀNG','SĐT',NULL,'ĐỊA CHỈ',NULL,'TÊN NGƯỜI NHẬN','TÊN NHÓM',NULL,'NỀN TẢNG HOẠT ĐỘNG','ĐẶC ĐIỂM KHÁCH HÀNG','MÃ GIP ( nếu có)','SẢN PHẨM','active','BOSS',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,'GHI CHÚ',0,0,30,0,0,'2026-05-12 01:49:37.383','2026-05-12 10:52:35.282'),('cmp1z3ch9000b13hfm85xs49s','-3','-4','',NULL,'','1899-12-28 00:00:00.000','-5','-6',NULL,'-7','-8','-9','-10','active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,'-12',0,0,30,0,0,'2026-05-12 01:49:37.389','2026-05-12 10:44:33.872'),('cmp1z3chh000c13hfn859h2m5','CUS00000','Warehouse','9554684386/09991799273',NULL,'Arnel\'s Warehouse 66 Mulawinan St, Valenzuela, Metro Manila, Philippines','2025-07-25 00:00:00.000','Ce Tejero','David 9054927175',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,0,0,30,0,0,'2026-05-12 01:49:37.397','2026-05-13 08:30:03.955'),('cmp1z3chl000d13hfgvffiuga','CUS00001','GIP Main','9854697853',NULL,'85B san Andres karuhatan rd. Valenzuela ,Karuhatan Road, Valenzuela City, Metro Manila','2025-07-25 00:00:00.000','Kristoffer',NULL,NULL,'Telegram',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.401','2026-05-12 01:49:37.401'),('cmp1z3chp000e13hfi1h5zw0o','CUS00002','GIP113.1','9613090766',NULL,'Larry Wearhouse - 236y Deparo & Kabatuhan Road , Barangay 168, Coloocan City, Metro Manila','2025-08-01 00:00:00.000','Mr. Anh',NULL,NULL,'Mess','Chuyên mua bọc chống sốc trắng, khách quan tâm về chất lượng bọc chống sốc khá nhiều, Về khách hàng này thì trước đó khá tiềm năng, sau vẫn k ok về chất lượng bọc chống sốc trắng nên thôi','GIP 113',NULL,'inactive','Hoàng Vũ Hiệp',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.406','2026-05-12 01:49:37.406'),('cmp1z3chu000f13hfgg8df5z4','CUS00003','GIP113.2','9514532789',NULL,'38C General Tinio Bagong Barrio West Caloocan, Metro Manila, Philippines','2025-08-01 00:00:00.000','Jason',NULL,NULL,'Mess',NULL,'GIP 113',NULL,'active','Mr Chuyen 9514532789 36b General Tinio, Bagong Barrio West, Caloocan, 1400 Metro Manila',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.410','2026-05-12 01:49:37.410'),('cmp1z3chx000g13hf7o88n9lm','CUS00004','GIP15.1','9618694964',NULL,'Arnel\'s Warehouse 66 Mulawinan St, Valenzuela Metro Manila, Philippines','2025-08-01 00:00:00.000','TNT','GIP 15.1 - NVL đóng hàng',NULL,'Mess','- Chuyên mua bọc chống sốc đen, trung bình 1 tháng 1 xe \r\n- Tháng 12 đã mua thêm các sp khác đi kèm, đánh giá chung ổn','GIP 15',NULL,'active','Lê Nhật Linh - Khải Hoàn vận hành',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.413','2026-05-12 01:49:37.413'),('cmp1z3ci0000h13hfborhc2u9','CUS00005','GIP15.2','9086434464',NULL,'VV6J+2F7, Daungan, Guiguinto, Bulacan, Philippines','2025-08-01 00:00:00.000','Mr. Ronald','GIP 15.2 - NVL đóng hàng',NULL,'Mess','- SP khách sử dụng: Bọc chống sốc đen\r\n- Nhu cầu trung bình 1 tháng khoảng 800-1000 cuộn, khách mua đều, duy trì lượng đơn ổn định 1 tuần thường là 2 chuyến\r\n- Làm việc dễ chịu, không gắt, lượng đơn ổn định các tháng cuối năm và dự kiến sẽ giảm vào tháng 2\r\n- Đã báo giá thêm các sản phẩm đi kèm tuy nhiên không cạnh tranh được về giá các sp khác, khách có nhận thử mẫu băng dính và giấy in\r\n- Khách trừ quỹ','GIP 15',NULL,'active','Lê Nhật Linh',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,'https://www.google.com/maps/place/MIDC+industrial+park/@14.8600374,120.878598,1332m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3396536f3f0f151f:0xe3e0612af5708141!8m2!3d14.8600322!4d120.8811783!16s%2Fg%2F11s47cyc2c?entry=tts&g_ep=EgoyMDI1MDgwNC4wIPu8ASoASAFQAw%3D%3D&skid=2e3a97ff-5819-4c8a-aac3-13a90433d21a',1,0,30,0,0,'2026-05-12 01:49:37.417','2026-05-12 01:49:37.417'),('cmp1z3ci3000i13hf1px6tyh5','CUS00006','GIP6','9323176977',NULL,'66 Mulawinan St., Brgy. Lawang Bato, Valenzuela City, Metro Manila','2025-08-01 00:00:00.000','Renjel','BUBBLE WRAP GIP 6',NULL,'Mess','- SP khách sử dụng: Bọc chống sốc trắng\r\n- Nhu cầu trung bình 1 tháng khoảng 30-400 cuộn, khách mua đều, duy trì lượng đơn ổn định 1 tuần thường là 1 chuyến\r\n- Làm việc nhanh, ủng hộ tất cả các sp đi kèm như băng dính, giấy in , túi đóng hàng ...\r\n- Khách trừ quỹ','GIP 6',NULL,'active','Đới Duy Khánh',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.420','2026-05-12 01:49:37.420'),('cmp1z3ci6000j13hfxzl0mk70','CUS00007','GPX','9298914538',NULL,'66 Mulawinan St, Valenzuela, Metro Manila, Philippines','2025-09-18 00:00:00.000','David',NULL,NULL,'Zalo',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,'Dừng hoạt động',1,0,30,0,0,'2026-05-12 01:49:37.423','2026-05-12 01:49:37.423'),('cmp1z3ci9000k13hfg1dkuhkj','CUS00009','GIP235','9273140336',NULL,'Block 3, Warehouse 1, Baliuag Industrial Subdivision, Pulilan, 3006 Bulacan','2025-10-09 00:00:00.000','Kenneth',NULL,NULL,'Telegram','Khách hàng đánh giá chất lượng và giá cả bên mình k hề rẻ',NULL,NULL,'active','đi được 1 lô , tạm mẫu đen bên Malabon',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.426','2026-05-12 01:49:37.426'),('cmp1z3cic000l13hf9n2x5ev4','CUS00010','GIP42','9957542822',NULL,'Blk 6 Lot 15 Poly land industrial brgy. Iba meycauayan bulacan','2025-10-23 00:00:00.000','Bianca',NULL,NULL,'Mess','- Cảm thấy phù hợp với chất lượng nhà Pampagan, bắt đầu sử dụng từ 20.11.2025\r\n- Trung bình 1 tháng đi 1 đơn\r\n- Thanh toán trực tiếp, nhanh gọn\r\n- Chỉ mới sử dụng mình bọc chống sốc , chưa dùng thêm các sp khác đi kèm, đã test thử giấy in loại cuộn','GIP 42',NULL,'active','Khuất Văn Quỳnh, Hải',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.428','2026-05-12 01:49:37.428'),('cmp1z3cif000m13hf25k507qv','CUS00011','GG','9159572813',NULL,'9457094245 / BLK 8 LOT 8 & 9 MANGO ST, FRANVILLE 2, BRGY. 175, CAMARIN, NORTH CALOOCAN CITY','2025-11-14 00:00:00.000','Julito','GGPH x Supplier',NULL,'Zalo','- SP khách sử dụng: Túi bóng đóng hàng\r\n- Khách thường xuyên mua túi đóng hàng và các sp đi kèm, tuy nhiên tiêu thụ bọc chống sốc thấp, khách thường đi 15 cuộn bọc chống sốc 1 lần kèm các sp khác, Lợi nhuận từ khách này khá ổn điọnh \r\n- Hầu như các đơn xuất từ kho đi, mình chịu phí ship do hàng nhỏ k chiếm diện tích và lợi nhuận cũng ổn định hơn khách mua bọc chống sốc',NULL,NULL,'active','Dương Đỗ',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.431','2026-05-12 01:49:37.431'),('cmp1z3cii000n13hfd77kdseb','CUS00012','Fitz Gerard','9308347609',NULL,'230 Pearl Street & Opal Street, Phase 5 Sta. Lucia Village, Punturin Valenzuela City, Metro Manila 1447','2025-11-14 00:00:00.000','JB Bombeo','GEP-BBWRAP-12',NULL,'Mess','Mua mẫu 380 bên mình, đánh giá ổn, thanh toán nhanh, tiếp cận thêm xem các sản phẩm khác và lượng tiêu thụ trung bình 1 tháng của khách ntn',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.434','2026-05-12 01:49:37.434'),('cmp1z3cil000o13hfwsgtjq1y','CUS00014','Lee Estavillo','9190076746',NULL,'Estavillo Enterprises \r\nB6A L17 Napoli St. Trails of Maia Alta, Dalig, Antipolo','2025-11-18 00:00:00.000','Lee Estavillo',NULL,NULL,'Mess','Gửi 2 loại sp, 1 cuộn full size loại 320 và 0,5 cuộn loại 380 - khách hàng này deal giá khá sát sườn, khó chốt - nếu ok thì sẽ lấy hàng bên TT superlier',NULL,NULL,'inactive',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.438','2026-05-12 01:49:37.438'),('cmp1z3cio000p13hf70x6atlv','CUS00015','A Trường','9064259700',NULL,'27 Biglang Awa, Novaliches, Quezon City, Metro Manila, Philippines','2025-11-24 00:00:00.000','Denver','GEP-BBWRAP-15',NULL,'Mess','Gửi hàng test xong lên đơn cho họ vào ngày mai',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.440','2026-05-12 01:49:37.440'),('cmp1z3ciq000q13hfz9tfosjq','CUS00016','Hưng Trần','9388662069',NULL,'2354 G.Del PilarSan Andres Bukid, Manila, 1004 Metro Manila, Philippines','2025-11-24 00:00:00.000','Jayson','GEP-BBWRAP-16',NULL,'Mess',NULL,NULL,NULL,'active','Hưng Trần, Thành Tín',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.443','2026-05-12 01:49:37.443'),('cmp1z3cit000r13hfejmjvyd0','CUS00017','Ryan','09688554587/09927139947',NULL,'WH7 #1 national road l, brgy. PAJO, MEYCAUAYAN BULACAN','2025-11-24 00:00:00.000','Ryan',NULL,NULL,'Mess','người kết nối',NULL,NULL,'inactive',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.446','2026-05-12 01:49:37.446'),('cmp1z3ciw000s13hf8babmgj5','CUS00018','GIP50','9567352742',NULL,'288 NAVA ST. BARANGAY 132 BALUT TONDO MANILA','2025-11-25 00:00:00.000','Edward','GEP-BBWRAP-18',NULL,'Mess','Check phí ship cho khách thì khá cao, đang hướng khách đi hàng với số lượng cuộn lớn',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.448','2026-05-12 01:49:37.448'),('cmp1z3ciz000t13hfmbhav2jo','CUS00019','Nadine Luceña','9283371558',NULL,'3096 Paliparan Rd, Dasmariñas, Cavite, Philippines\r\nhttps://maps.app.goo.gl/gdaQNG4kuEr1QRhr5','2025-12-02 00:00:00.000','Champion Andeng',NULL,NULL,'Mess','charge 4000 peso of shipping ( per truck) but we will share with u 50% so \r\n- bubber wrap black 380 peso / 1 roll + 2000 shipping feee \r\n- bubber white is white is 400 peso /1 roll + 2000 shipping fee \r\n- Tape is 22peso / 1 pcs / 100metters ( ship with white bubber wrap )',NULL,NULL,'inactive','Đã gửi mẫu test cho khách hàng, hiện tại với giá NVL mình cung cấp thì khách hàng muốn mình hỗ trợ về chi phí vận chuyển - về giá cả này không đảm bảo được chi phí vận hành bên mình - Tạm dừng',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.451','2026-05-12 01:49:37.451'),('cmp1z3cj1000u13hf27y8f1fh','CUS00020','VISION E-COMMERCE TRADING CORP','9531449297',NULL,'2525 Tomas Mapua St., Brgy. 209, Tondo, Manila','2025-12-02 00:00:00.000','Tori / Manuel','GEP-BBWRAP-20',NULL,'Mess','Khách ở xa, mua được 2 lần r, chuyên bọc chống sốc đen nhà Pampagan - giá 350 peso',NULL,NULL,'active','Đã đặt đơn, 04.12 check lại',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.454','2026-05-12 01:49:37.454'),('cmp1z3cj4000v13hfqy5edi9j','CUS00021','Phan Quoc Thinh','9954492840',NULL,'39 Camelot st,Kingsville court,Mambugan,Antipolo','2025-12-08 00:00:00.000','James Phan','GEP-BBWRAP-21',NULL,'Mess','Chê bọc chống sốc mùi, đã gt thêm sp khác ( nhà PP k bị mùi, ổn định hơn) nhưng khách chưa chốt',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.456','2026-05-12 01:49:37.456'),('cmp1z3cj6000w13hfv7nh9lui','CUS00022','James smith','9658048615',NULL,'19 Kaimito, Quezon City, Metro Manila, Philippines','2025-12-09 00:00:00.000','James Roa','GEP-BBWRAP-22',NULL,'Mess','Lượng đơn nhỏ, có thể chịu phí ship',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.459','2026-05-12 01:49:37.459'),('cmp1z3cj9000x13hf4yu619z0','CUS00023','Khách vãng lai','',NULL,'','2025-12-12 00:00:00.000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.461','2026-05-12 01:49:37.461'),('cmp1z3cjc000y13hfowchkorw','CUS00024','Reggie Frias','',NULL,'khách ở Cavite, khách quan tâm đến việc free ship, chưa có thông tin cụ thể','2025-12-13 00:00:00.000','Reggie Frias',NULL,NULL,'Mess','charge 4000 peso of shipping ( per truck) but we will share with u 50% so \r\n- bubber wrap black 380 peso / 1 roll + 2000 shipping feee \r\n- bubber white is white is 400 peso /1 roll + 2000 shipping fee \r\n- Tape is 22peso / 1 pcs / 100metters ( ship with white bubber wrap )',NULL,NULL,'active','chưa gửi mẫu test',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.464','2026-05-12 01:49:37.464'),('cmp1z3cjf000z13hfd2ygdflb','CUS00025','Shaira Mariz Torres','9617407079',NULL,'Lot 5T RIS 1 Industrial Complex Guiguinto Bulacan','2025-12-13 00:00:00.000','Shaira Mariz Torres','GEP-BBWRAP-25',NULL,'Mess','mẫu trắng full cuộn',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.468','2026-05-12 01:49:37.468'),('cmp1z3cji001013hf5b64hght','CUS00026','Jeena','',NULL,'San Fernando, Pampanga - chưa có thông tin cụ thể','2025-12-13 00:00:00.000',NULL,'GEP',NULL,'Mess','Khách thường mua 30 cuộn bọc chống sốc và băng dính',NULL,NULL,'active','khách có vẻ ưng, đợi khách phản hồi',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.470','2026-05-12 01:49:37.470'),('cmp1z3cjl001113hfbxjqt7q8','CUS00027','Sarah','9669902675',NULL,'Warehouse 1, C5 Rd, C. Joaquin St, Guiguinto, Bulacan','2025-12-13 00:00:00.000','Riri',NULL,NULL,'Mess','Dùng loại cắt đôi, Mua hàng bắt đầu từ tháng 12, đang xem xét, khách thanh toán chậm',NULL,NULL,'active','Gửi mẫu test cho khách',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.473','2026-05-12 01:49:37.473'),('cmp1z3cjo001213hfakd3lqe7','CUS00028','GIP 30','9812007318',NULL,'Mia: 09198466434 . 33 Damong Maliit Road, Novaliches Proper, Quezon City, Metro Manila, Metro Manila, 0328','2025-12-22 00:00:00.000','Jerome',NULL,NULL,'Zalo','Khách này trung bình 1 tháng đặt 3 lần, mỗi lần cách nhau khoảng 10 ngày',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.476','2026-05-12 01:49:37.476'),('cmp1z3cjr001313hf7c7qj0r4','CUS00029','Jimmy','9070601571',NULL,'Plaridel 3, 9023 Bluebell, Bayan Luma, Imus, Cavite, Philippines','2025-12-22 00:00:00.000','Rey Asilo',NULL,NULL,'Mess',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.479','2026-05-12 01:49:37.479'),('cmp1z3cju001413hfrvjpl9ef','CUS00030','GIP 5','9551443183',NULL,'No. 1 Silangan ST Teresa heights, barangay Pasong Putik, Quezon cityy','2025-12-23 00:00:00.000','Ryan Secillano',NULL,NULL,'Zalo',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.482','2026-05-12 01:49:37.482'),('cmp1z3cjx001513hfath2bls7','CUS00031','TNT-FB','9485818960',NULL,'Arnel\'s Warehouse 66 Mulawinan St, Valenzuela Metro Manila, Philippines','2025-12-30 00:00:00.000','TNT-FB','NVL- GIP 15.1 KHẢI HOÀN',NULL,'Telegram','Tách theo quỹ khác nhau','GIP 15',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.485','2026-05-12 01:49:37.485'),('cmp1z3ck0001613hf0gyvsff5','CUS00032','TNT-ECOM','9485818960',NULL,'Arnel\'s Warehouse 66 Mulawinan St, Valenzuela Metro Manila, Philippines','2025-12-30 00:00:00.000','TNT-ECOM','NVL- GIP 15.1 KHẢI HOÀN',NULL,'Telegram',NULL,'GIP 15',NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'bank_transfer','0889128836','vpbank','bach đồng',NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.488','2026-05-13 08:31:04.011'),('cmp1z3ck3001713hflceyr226','CUS00033','Tine eve','9634872202',NULL,'1770 rizal avenue, barangay east bajac bajac, olongapo city, zambales','2026-01-05 00:00:00.000','Vince Dela Cruz','GEP-BBWRAP-33',NULL,'Mess',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.491','2026-05-12 01:49:37.491'),('cmp1z3ck6001813hf79ycf2gz','CUS00034','GIP 28','9068770212',NULL,'B1 Luwasan, Beverly Homes Phase 3, Loma De Gato, Marilao, Bulacan (09481974327 - Egie Nemi )','2026-01-10 00:00:00.000','Joe - NEMI',NULL,NULL,'Zalo','diện tích kho bé, 1 lần đặt có 10-15 cuộn',NULL,NULL,'active','- 0985 979 7472 - Joe Nemi)',NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.494','2026-05-12 01:49:37.494'),('cmp1z3ck8001913hfry8ftfrs','CUS00035','Joy Ate','9152054279',NULL,'Blk 26, lot 4, Aster Street T.S Cruz Subdivision, Almanza Dos, Las Pinas, Metro manila','2026-02-03 00:00:00.000','Joy Ate',NULL,NULL,'Mess','diện tích kho bé, 1 lần đặt có 10-15 cuộn',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.497','2026-05-12 01:49:37.497'),('cmp1z3ckb001a13hf2ub40hqt','CUS00036','JAY AR CULANCULAN','9126744077',NULL,'(Tarlac bodega pang masa) Brgy, Santa Rosa Rd, Sitio Maligaya, Maliwalo, Tarlac City, Tarlac, Philippines','2026-03-20 00:00:00.000','JAY AR CULANCULAN',NULL,NULL,'Mess',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'cod',NULL,NULL,NULL,NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.499','2026-05-12 01:49:37.499'),('cmp1z3ckd001b13hf3uxr7m1h','CUS00037','TNT - FACECOM','9485818960',NULL,'Arnel\'s Warehouse 66 Mulawinan St, Valenzuela Metro Manila, Philippines','2026-04-07 00:00:00.000','TNT - FACECOM',NULL,NULL,'Telegram',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,NULL,'ca_nhan',NULL,NULL,NULL,'bank_transfer','0889128836','vpbank','bach đồng',NULL,NULL,1,0,30,0,0,'2026-05-12 01:49:37.502','2026-05-13 08:25:15.100'),('cmp3sx3jd005nhqf8aajqw5hq','KH-0039','zdfa','976548','bachsydonggiphn@gmail.com','365746',NULL,'','','','','','','','active','',NULL,'','','','','ca_nhan','','','','bank_transfer','0889128836','vpbank','bach đồng','36','',0,0,30,0,0,'2026-05-13 08:32:18.944','2026-05-13 08:41:27.399'),('cmp3t8mn3000266it1j2xi5m7','CUS00038','dfg','45687','','4567',NULL,'','','','','','','','active','',NULL,'','','','','ca_nhan','','','','bank_transfer','0889128836','vpbank','bach đồng','5467','',0,0,30,0,0,'2026-05-13 08:41:18.495','2026-05-13 08:41:32.011');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_fuel_entries`
--

DROP TABLE IF EXISTS `daily_fuel_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_fuel_entries` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dailyLogId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fuelKm` double DEFAULT NULL,
  `fuelKmPhoto` longtext COLLATE utf8mb4_unicode_ci,
  `fuelCost` double DEFAULT NULL,
  `fuelCostPhoto` longtext COLLATE utf8mb4_unicode_ci,
  `fuelPricePerLiter` double DEFAULT NULL,
  `fuelPricePhoto` longtext COLLATE utf8mb4_unicode_ci,
  `fuelVolume` double DEFAULT NULL,
  `fuelNotes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `daily_fuel_entries_dailyLogId_fkey` (`dailyLogId`),
  CONSTRAINT `daily_fuel_entries_dailyLogId_fkey` FOREIGN KEY (`dailyLogId`) REFERENCES `daily_vehicle_logs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_fuel_entries`
--

LOCK TABLES `daily_fuel_entries` WRITE;
/*!40000 ALTER TABLE `daily_fuel_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_fuel_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_vehicle_logs`
--

DROP TABLE IF EXISTS `daily_vehicle_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_vehicle_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logDate` date NOT NULL,
  `vehicleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plateNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startKm` double DEFAULT NULL,
  `startKmPhoto` longtext COLLATE utf8mb4_unicode_ci,
  `checkInTime` datetime(3) DEFAULT NULL,
  `endKm` double DEFAULT NULL,
  `endKmPhoto` longtext COLLATE utf8mb4_unicode_ci,
  `checkOutTime` datetime(3) DEFAULT NULL,
  `totalKm` double DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_vehicle_logs_vehicleId_logDate_key` (`vehicleId`,`logDate`),
  KEY `daily_vehicle_logs_driverId_fkey` (`driverId`),
  CONSTRAINT `daily_vehicle_logs_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `daily_vehicle_logs_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_vehicle_logs`
--

LOCK TABLES `daily_vehicle_logs` WRITE;
/*!40000 ALTER TABLE `daily_vehicle_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_vehicle_logs` ENABLE KEYS */;
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
-- Table structure for table `delivery_proofs`
--

DROP TABLE IF EXISTS `delivery_proofs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_proofs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileUrl` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `uploadedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `delivery_proofs_orderId_fkey` (`orderId`),
  CONSTRAINT `delivery_proofs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_proofs`
--

LOCK TABLES `delivery_proofs` WRITE;
/*!40000 ALTER TABLE `delivery_proofs` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_proofs` ENABLE KEYS */;
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
  `idCardPhoto` longtext COLLATE utf8mb4_unicode_ci,
  `idCardPhotoBack` longtext COLLATE utf8mb4_unicode_ci,
  `licensePhoto` longtext COLLATE utf8mb4_unicode_ci,
  `licensePhotoBack` longtext COLLATE utf8mb4_unicode_ci,
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
-- Table structure for table `import_batches`
--

DROP TABLE IF EXISTS `import_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `import_batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subSku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specification` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otherSpecs` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `costPrice` double DEFAULT NULL,
  `quantity` int NOT NULL,
  `supplier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `nhapKho` double NOT NULL DEFAULT '0',
  `xuatKho` double NOT NULL DEFAULT '0',
  `tonKho` double NOT NULL DEFAULT '0',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `import_batches`
--

LOCK TABLES `import_batches` WRITE;
/*!40000 ALTER TABLE `import_batches` DISABLE KEYS */;
INSERT INTO `import_batches` VALUES ('cmp1z5mbd001f13hf04ylpoyd','BWP','BWP-TH-BLACK-4inch × 100m','TT-BWP-BLACK-Half×60-3,3','Half×60','BLACK','3.3',320,0,'TT','Half | Thông số khác: 3.3',190,183.5,6.5,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.449'),('cmp1z5mbi001g13hfvimr0zyr','BWP','BWP-TK-BLACK-4inch × 100m','TT-BWP-BLACK-Half×55-3,7','Half×55','BLACK','3.7',350,0,'TT','Half | Thông số khác: 3.7',101,84,17,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.455'),('cmp1z5mbl001h13hfo86k4m7r','BWP','BWP-TK-BLACK-4inch × 100m','PP-BWP-BLACK-Half×70-3,7','Half×70','BLACK','3.7',350,0,'PP','3/23/26 | Half | Thông số khác: 3.7',2602,2596,6,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.458'),('cmp1z5mbq001i13hf0yhl3x72','BWP','BWP-TK-BLACK-4inch × 100m','PP-BWP-BLACK-Full×70-3,7','Full×70','BLACK','3.7',350,0,'PP','3/23/26 | Whole | Thông số khác: 3.7',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.462'),('cmp1z5mbs001j13hfkqb1l6z8','BWP','BWP-TH-WHITE-4inch × 100m','ML-BWP-WHITE-Full×60-3,4','Full×60','WHITE','3.4',390,0,'ML','3/29/26 | Whole | Thông số khác: 3.4',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.464'),('cmp1z5mbu001k13hfxyv6kf7w','BWP','BWP-TK-WHITE-4inch × 100m','ML-BWP-WHITE-Full×60-3,9','Full×60','WHITE','3.9',420,0,'ML','3/20/26 | Whole | Thông số khác: 3.9',30,22,8,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.466'),('cmp1z5mbw001l13hfl0o0wlrc','BWP','BWP-TH-BLACK-4inch × 100m','ML-BWP-BLACK-Full×60-3,4','Full×60','BLACK','3.4',350,0,'ML','3/27/26 | Whole | Thông số khác: 3.4',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.468'),('cmp1z5mbx001m13hfb4btrciw','BWP','BWP-TK-BLACK-4inch × 100m','ML-BWP-BLACK-Full×60-3,9','Full×60','BLACK','3.9',390,0,'ML','3/27/26 | Whole | Thông số khác: 3.9',30,1,29,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.470'),('cmp1z5mby001n13hf623ecr2m','BWP','BWP-TH-WHITE-4inch × 100m','ML-BWP-WHITE-Half×60-3,4','Half×60','WHITE','3.4',390,0,'ML','3/20/26 | Half | Thông số khác: 3.4',394,364,30,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.471'),('cmp1z5mc0001o13hfqytrzjy5','BWP','BWP-TK-WHITE-4inch × 100m','ML-BWP-WHITE-Half×60-3,9','Half×60','WHITE','3.9',420,0,'ML','3/20/26 | Half | Thông số khác: 3.9',1078,1078,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.472'),('cmp1z5mc1001p13hft68zgky1','BWP','BWP-TH-BLACK-4inch × 100m','ML-BWP-BLACK-Half×60-3,4','Half×60','BLACK','3.4',350,0,'ML','3/27/26 | Half | Thông số khác: 3.4',749,749,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.474'),('cmp1z5mc2001q13hf1gujy1lr','BWP','BWP-TK-BLACK-4inch × 100m','ML-BWP-BLACK-Half×60-3,9','Half×60','BLACK','3.9',390,0,'ML','3/27/26 | Half | Thông số khác: 3.9',90,90,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.475'),('cmp1z5mc4001r13hfcfxu68rq','BWP','BWP-TK-BLACK-4inch × 100m','RO-BWP-BLACK-Full×80-4','Full×80','BLACK','4',500,0,'RO','3/20/26 | Whole | Thông số khác: 4',100,100,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.476'),('cmp1z5mc5001s13hfybdr17wk','BWP','BWP-TH-WHITE-4inch × 100m','RO-BWP-WHITE-Full×80-4,7','Full×80','WHITE','4.7',560,0,'RO','Whole | Thông số khác: 4.7',50,0,50,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.478'),('cmp1z5mc7001t13hfsq8xocil','BWP','BWP-TK-SILVER-4inch × 100m','RO-BWP-SILVER-Half×80-4,9','Half×80','SILVER','4.9',480,0,'RO','Half | Thông số khác: 4.9',50,50,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.479'),('cmp1z5mc8001u13hfp0qb7lzp','BWP','BWP-TH-WHITE-4inch × 100m','RO-BWP-WHITE-Half×80-4,7','Half×80','WHITE','4.7',560,0,'RO','Half | Thông số khác: 4.7',50,16,34,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.480'),('cmp1z5mc9001v13hfzn9gasjo','PLAIN','PLAIN--BLACK-S','ML-PLAIN-BLACK-S-18×30','S','BLACK','18×30',0.35,0,'ML','Có giá mới rồi, xử lý sau khi hết tồn cũ | 1000 | Thông số khác: 18×30',531000,391000,140000,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.482'),('cmp1z5mcb001w13hfs4s3ap32','PLAIN','PLAIN--BLACK-M','ML-PLAIN-BLACK-M-25×41','M','BLACK','25×41',0.62,0,'ML','Có giá mới rồi, xử lý sau khi hết tồn cũ | 500 | Thông số khác: 25×41',1380500,966500,414000,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.483'),('cmp1z5mcc001x13hf50ojj6tc','PLAIN','PLAIN--BLACK-L','ML-PLAIN-BLACK-L-28×46','L','BLACK','28×46',0.82,0,'ML','Có giá mới rồi, xử lý sau khi hết tồn cũ | 500 | Thông số khác: 28×46',636000,363000,273000,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.484'),('cmp1z5mcd001y13hfpqeltccq','PLAIN','PLAIN--BLACK-XL','ML-PLAIN-BLACK-XL-31×51','XL','BLACK','31×51',0.95,0,'ML','Có giá mới rồi, xử lý sau khi hết tồn cũ | 500 | Thông số khác: 31×51',335500,235500,100000,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.485'),('cmp1z5mce001z13hfmzmmn3q3','PLAIN','PLAIN--BLACK-XXL','ML-PLAIN-BLACK-XXL-39*50','XXL','BLACK','39*50',1.25,0,'ML','Có giá mới rồi, xử lý sau khi hết tồn cũ | 500 | Thông số khác: 39*50',160000,70000,90000,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.487'),('cmp1z5mcg002013hfuulc03xb','PLAIN','PLAIN--BLACK-S','PP-PLAIN-BLACK-S-18×31','S','BLACK','18×31',0.38,0,'PP','1000 | Thông số khác: 18×31',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.488'),('cmp1z5mch002113hfqi6j2yy6','PLAIN','PLAIN--BLACK-M','PP-PLAIN-BLACK-M-23×41','M','BLACK','23×41',0.66,0,'PP','500 | Thông số khác: 23×41',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.490'),('cmp1z5mci002213hf3j0xhr86','PLAIN','PLAIN--BLACK-L','PP-PLAIN-BLACK-L-30×45','L','BLACK','30×45',0.86,0,'PP','500 | Thông số khác: 30×45',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.491'),('cmp1z5mck002313hf0rianivu','PLAIN','PLAIN--BLACK-XL','PP-PLAIN-BLACK-XL-30×51','XL','BLACK','30×51',1,0,'PP','500 | Thông số khác: 30×51',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.492'),('cmp1z5mcn002413hfkon2q0x4','TAPE','TAPE-TA-CLEAR-2inch × 100m','PP-TAPE-CLEAR-5×70-120','5×70','CLEAR','120',21,0,'PP','120 | Thông số khác: 120',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.496'),('cmp1z5mcp002513hf0wnvuh0f','TAPE','TAPE-TA-CLEAR-2inch × 100m','ML-TAPE-CLEAR-5×70-120','5×70','CLEAR','120',18,0,'ML','120 | Thông số khác: 120',120,24,96,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.498'),('cmp1z5mcr002613hfci8y4i6t','TAPE','TAPE-TA-CLEAR-2inch × 200m','ML-TAPE-CLEAR-5×130-72','5×130','CLEAR','72',35,0,'ML','72 | Thông số khác: 72',72,10,62,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.499'),('cmp1z5mct002713hf81m4t17c','TAPE','TAPE-TA-CLEAR-2inch × 100m','RY-TAPE-CLEAR-5×70-144','5×70','CLEAR','144',17.6,0,'RY','giá mới đc deal 15.12.2025 | 144 | Thông số khác: 144',53280,22752,30528,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.501'),('cmp1z5mcu002813hfhphldxk6','TAPE','TAPE-TA-CLEAR-2inch × 200m','RY-TAPE-CLEAR-5×150-90','5×150','CLEAR','90',35.2,0,'RY','giá mới đc deal 15.12.2025 | 90 | Thông số khác: 90',14850,12150,2700,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.502'),('cmp1z5mcv002913hfe6dckw0f','TAPE','TAPE-TA-CLEAR-2inch × 200m','TT-TAPE-CLEAR-5×170-72','5×170','CLEAR','72',34,0,'TT','72 | Thông số khác: 72',3960,3896,64,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.504'),('cmp1z5mcx002a13hf85d6348z','WB','WB-RIM-PAPER-100*150','PP-WB-RIM-100×150-2×5000','100×150','RIM','2×5000',2600,0,'PP','10000 | Thông số khác: 2×5000',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.505'),('cmp1z5mcy002b13hfgg3mm3k0','WB','WB-RIM-PAPER-100*150','PP-WB-RIM-100×150-8×2000','100×150','RIM','8×2000',4160,0,'PP','10000 | Thông số khác: 8×2000',2,2,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.506'),('cmp1z5mcz002c13hf1xxjyjmm','WB','WB-RIM-PAPER-100*150','PP-WB-RIM-100×150-5×2000','100×150','RIM','5×2000',2100,0,'PP','10000 | Thông số khác: 5×2000',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.508'),('cmp1z5md1002d13hfwalw7m7k','WB','WB-ROLL-PAPER-100*150','PP-WB-ROLL-100×150-30×500','100×150','ROLL','30×500',125,0,'PP','3750 | 30 | Thông số khác: 30×500',0,0,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.509'),('cmp1z5md2002e13hfac69vkju','WB','WB-RIM-PAPER-100*150','ML-WB-RIM-100×150-2×5000','100×150','RIM','2×5000',2300,0,'ML','giá mới dc deal 17.12.2025 | 10000 | Thông số khác: 2×5000',470,428,42,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.510'),('cmp1z5md4002f13hfirx4o8uw','WB','WB-RIM-PAPER-100*150','ML-WB-RIM-100×150-30*500','100×150','RIM','30*500',3600,0,'ML','10000 | Thông số khác: 30*500',1,0,1,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.512'),('cmp1z5md5002g13hf9cqgyegq','WB','WB-ROLL-PAPER-100*150','ML-WB-ROLL-100×150-36×500','100×150','ROLL','36×500',120,0,'ML','4320 | 36 | Thông số khác: 36×500',11,1,10,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.513'),('cmp1z5md6002h13hfbog1l1ec','WB','WB-ROLL-PAPER-100*150','ML-WB-ROLL-100×150-24×500','100×150','ROLL','24×500',120,0,'ML','2880 | 24 | Thông số khác: 24×500',240,240,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.515'),('cmp1z5md8002i13hf3uypo5xr','WB','WB-2RIM-PAPER-100*150','TT-WB-RIM-100×150-2×5000','100×150','RIM','2×5000',2300,0,'TT','10000 | Thông số khác: 2×5000',50,50,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.516'),('cmp1z5md9002j13hfq2r3yt55','WB','WB-ROLL-PAPER-100*150','TT-WB-ROLL-100×150-24×500','100×150','ROLL','24×500',118,0,'TT','2832 | 24 | Thông số khác: 24×500',240,240,0,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.517'),('cmp1z5mda002k13hfs0itbiub','TAPE','TAPE-TA-FRAGILE-2inch × 100m','ML-TAPE-FRAGILE-5×70-120','5×70','FRAGILE','120',35,0,'ML','120 | Thông số khác: 120',360,120,240,'nbjeSZkVLbP92o68qImdqmigHQ42','Dong Bach','2026-05-12 01:51:23.519');
/*!40000 ALTER TABLE `import_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internal_transfers`
--

DROP TABLE IF EXISTS `internal_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internal_transfers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `fromLocation` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toLocation` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `internal_transfers_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internal_transfers`
--

LOCK TABLES `internal_transfers` WRITE;
/*!40000 ALTER TABLE `internal_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `internal_transfers` ENABLE KEYS */;
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
  `imageUrl` longtext COLLATE utf8mb4_unicode_ci,
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
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'telegram',
  `recipient` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `relatedId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relatedType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error` text COLLATE utf8mb4_unicode_ci,
  `sentAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocr_audit_logs`
--

DROP TABLE IF EXISTS `ocr_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocr_audit_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referenceId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documentType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imageUrl` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `declaredValue` decimal(15,2) NOT NULL,
  `extractedValue` decimal(15,2) DEFAULT NULL,
  `differenceValue` decimal(15,2) DEFAULT NULL,
  `rawOcrText` longtext COLLATE utf8mb4_unicode_ci,
  `imageHash` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confidenceScore` double DEFAULT NULL,
  `riskLevel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fraudReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ocrProvider` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipelineStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `retryCount` int NOT NULL DEFAULT '0',
  `reviewStatus` enum('pending','approved','rejected','escalated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `auditTaskId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_audit_logs`
--

LOCK TABLES `ocr_audit_logs` WRITE;
/*!40000 ALTER TABLE `ocr_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocr_audit_logs` ENABLE KEYS */;
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
  `subSku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `reference` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `paidAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `recordedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recordedByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payments_orderId_fkey` (`orderId`),
  CONSTRAINT `payments_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
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
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subSku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specification` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stockQuantity` int NOT NULL DEFAULT '1',
  `length` double NOT NULL,
  `weight` double NOT NULL,
  `height` double DEFAULT NULL,
  `diameter` double DEFAULT NULL,
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
  `sourceType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'production',
  `supplier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importBatchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_rolls_code_key` (`code`),
  UNIQUE KEY `product_rolls_qrCode_key` (`qrCode`),
  KEY `product_rolls_creator_fkey` (`creator`),
  KEY `product_rolls_orderId_fkey` (`orderId`),
  KEY `product_rolls_productionOrderId_fkey` (`productionOrderId`),
  KEY `product_rolls_materialId_fkey` (`materialId`),
  KEY `product_rolls_importBatchId_fkey` (`importBatchId`),
  CONSTRAINT `product_rolls_creator_fkey` FOREIGN KEY (`creator`) REFERENCES `users` (`uid`) ON UPDATE CASCADE,
  CONSTRAINT `product_rolls_importBatchId_fkey` FOREIGN KEY (`importBatchId`) REFERENCES `import_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
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
  `rollLength` double NOT NULL DEFAULT '0',
  `rollWeight` double NOT NULL DEFAULT '0',
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `machineArea` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `deadline` datetime(3) DEFAULT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
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
/*!40000 ALTER TABLE `production_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materialName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` double NOT NULL,
  `unitPrice` double NOT NULL,
  `receivedQty` double NOT NULL DEFAULT '0',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'kg',
  PRIMARY KEY (`id`),
  KEY `purchase_order_items_purchaseOrderId_fkey` (`purchaseOrderId`),
  CONSTRAINT `purchase_order_items_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_logs`
--

DROP TABLE IF EXISTS `purchase_order_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `purchase_order_logs_purchaseOrderId_fkey` (`purchaseOrderId`),
  CONSTRAINT `purchase_order_logs_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_logs`
--

LOCK TABLES `purchase_order_logs` WRITE;
/*!40000 ALTER TABLE `purchase_order_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','pending_approval','approved','ordered','partially_received','received','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `totalAmount` double NOT NULL DEFAULT '0',
  `paidAmount` double NOT NULL DEFAULT '0',
  `expectedDate` datetime(3) DEFAULT NULL,
  `receivedDate` datetime(3) DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_orders_code_key` (`code`),
  KEY `purchase_orders_supplierId_fkey` (`supplierId`),
  CONSTRAINT `purchase_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_requests`
--

DROP TABLE IF EXISTS `return_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_requests` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shippingOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `resolution` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refundAmount` double NOT NULL DEFAULT '0',
  `refundMethod` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refundedAt` datetime(3) DEFAULT NULL,
  `refundNote` text COLLATE utf8mb4_unicode_ci,
  `reshipOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processedByName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolvedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_requests_code_key` (`code`),
  KEY `return_requests_orderId_fkey` (`orderId`),
  CONSTRAINT `return_requests_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_requests`
--

LOCK TABLES `return_requests` WRITE;
/*!40000 ALTER TABLE `return_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_requests` ENABLE KEYS */;
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
-- Table structure for table `stocktake_items`
--

DROP TABLE IF EXISTS `stocktake_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktake_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stocktakeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rollCode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expectedQty` int NOT NULL DEFAULT '1',
  `actualQty` int NOT NULL DEFAULT '0',
  `difference` int NOT NULL DEFAULT '0',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'missing',
  `note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `stocktake_items_stocktakeId_fkey` (`stocktakeId`),
  CONSTRAINT `stocktake_items_stocktakeId_fkey` FOREIGN KEY (`stocktakeId`) REFERENCES `stocktakes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktake_items`
--

LOCK TABLES `stocktake_items` WRITE;
/*!40000 ALTER TABLE `stocktake_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktake_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocktakes`
--

DROP TABLE IF EXISTS `stocktakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktakes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `warehouse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdByName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stocktakes_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktakes`
--

LOCK TABLES `stocktakes` WRITE;
/*!40000 ALTER TABLE `stocktakes` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `contactPerson` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankAccount` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int DEFAULT '5',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_config`
--

LOCK TABLES `system_config` WRITE;
/*!40000 ALTER TABLE `system_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfer_items`
--

DROP TABLE IF EXISTS `transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `internalTransferId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rollCode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transfer_items_internalTransferId_fkey` (`internalTransferId`),
  CONSTRAINT `transfer_items_internalTransferId_fkey` FOREIGN KEY (`internalTransferId`) REFERENCES `internal_transfers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfer_items`
--

LOCK TABLES `transfer_items` WRITE;
/*!40000 ALTER TABLE `transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `transfer_items` ENABLE KEYS */;
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
INSERT INTO `user_activity_logs` VALUES ('cmp1z3ckj001d13hf61k8a25y','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Import customers (Excel v2)','Khách hàng',NULL,'Imported 38 new, updated 0 existing customers from Excel (CRM v2)','2026-05-12 01:49:37.507'),('cmp2cnpxq003s6o6l3n9jfyp3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Import pricing (Excel)','Khách hàng',NULL,'Imported pricing: 63 success, 0 skipped, 0 errors','2026-05-12 08:09:22.958'),('cmp3qej61002shqf8lp4say28','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Thêm tài khoản ngân hàng','Thanh toán','cmp3qej5r002qhqf81g02oxqt','Thêm TK: vpbank - 0889128836','2026-05-13 07:21:55.081'),('cmp3sx3js005phqf8bk81f1k2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Tạo khách hàng','Khách hàng','cmp3sx3jd005nhqf8aajqw5hq','Tạo khách hàng: zdfa (KH-0039)','2026-05-13 08:32:20.537'),('cmp3t8mnc000466it2unmi4wk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Tạo khách hàng','Khách hàng','cmp3t8mn3000266it1j2xi5m7','Tạo khách hàng: dfg (CUS00038)','2026-05-13 08:41:18.504');
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
INSERT INTO `user_login_logs` VALUES ('cmp1yypl5000213hfr8ua3b6s','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 01:46:01.097',NULL,'success'),('cmp1yyvcx000413hfzmkng8r7','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 01:46:08.578',NULL,'success'),('cmp1yyxpy000613hfgazevyu4','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 01:46:11.639',NULL,'success'),('cmp1yzzts000813hfk0ws7ayf','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 01:47:01.024',NULL,'success'),('cmp1zfhe0002m13hfba1r4gmk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 01:59:03.625',NULL,'success'),('cmp1zgtiz002o13hfsjih615t','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 02:00:06.011',NULL,'success'),('cmp1zitju0001o84ms5d4kba0','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 02:01:39.354',NULL,'success'),('cmp1znstq0004o84mstea7a4j','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 02:05:31.694',NULL,'success'),('cmp1zovy30006o84mt6jlns2q','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 02:06:22.396',NULL,'success'),('cmp2buxix0008o84mutidlg7d','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:46:59.769',NULL,'success'),('cmp2bvrfu000ao84mkcrm1xy5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:47:38.538',NULL,'success'),('cmp2bvytd000co84mcze0miwb','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:47:48.097',NULL,'success'),('cmp2bw2ym000eo84mdbq6gw6f','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:47:53.471',NULL,'success'),('cmp2bwiim000go84mvet0ytzw','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:48:13.631',NULL,'success'),('cmp2bwr5h000io84mt8rgfija','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:48:24.821',NULL,'success'),('cmp2bx8nd000ko84m2rj0sd8c','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:48:47.497',NULL,'success'),('cmp2bxr1l000mo84mz1k1yeok','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:49:11.337',NULL,'success'),('cmp2bxzzv000oo84mt74yba4b','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:49:22.939',NULL,'success'),('cmp2by5u1000qo84m4wshopzu','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:49:30.506',NULL,'success'),('cmp2by96g000so84mv42y35kb','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:49:34.840',NULL,'success'),('cmp2bykpg000uo84m2eyaoecn','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:49:49.780',NULL,'success'),('cmp2byt8z000wo84mv3d14bw5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:50:00.852',NULL,'success'),('cmp2bzosm000yo84mzo6r5qhm','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:50:41.734',NULL,'success'),('cmp2bzp4q0010o84mqhuam9cn','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:50:42.170',NULL,'success'),('cmp2c01zh0012o84m1jbolw9m','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:50:58.829',NULL,'success'),('cmp2c0pwp0014o84m7klrp9pk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:51:29.833',NULL,'success'),('cmp2c1gn90016o84mbnw7rseu','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:52:04.485',NULL,'success'),('cmp2c3d1p0018o84mys1cmim3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:53:33.133',NULL,'success'),('cmp2c3ja5001ao84myik55bhc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:53:41.214',NULL,'success'),('cmp2c3ou8001co84m1r28dflz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:53:48.417',NULL,'success'),('cmp2c3tcl001eo84m1dpetwoz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:53:54.261',NULL,'success'),('cmp2c41dp001go84mr3pdec6b','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:54:04.669',NULL,'success'),('cmp2c7gfx001io84mtqc5z3a3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:56:44.158',NULL,'success'),('cmp2c7i17001ko84m411ft2xj','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:56:46.220',NULL,'success'),('cmp2c7zip001mo84m8llbdfqj','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:08.882',NULL,'success'),('cmp2c800v001oo84m76tf2dyh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:09.535',NULL,'success'),('cmp2c80v2001qo84mxbwgt50o','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:10.622',NULL,'success'),('cmp2c81p4001so84mcnjw6fya','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:11.705',NULL,'success'),('cmp2c82hy001uo84mx633y0ap','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:12.742',NULL,'success'),('cmp2c83ha001wo84mwxm6bwar','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:14.015',NULL,'success'),('cmp2c87q4001yo84maav2n1ed','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:19.516',NULL,'success'),('cmp2c8cdd0020o84mqgdhbx5s','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:25.537',NULL,'success'),('cmp2c8ofd0022o84mxinp6o8r','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:41.161',NULL,'success'),('cmp2c8w090024o84mv0bg9e1z','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 07:57:50.985',NULL,'success'),('cmp2cckwy00016o6leuk0xryq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 08:00:43.235',NULL,'success'),('cmp2cd47k00036o6ldefqswdu','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 08:01:08.240',NULL,'success'),('cmp2ce75s00056o6lyzfvp8k7','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 08:01:58.720',NULL,'success'),('cmp2cefh100076o6lducsptsz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 08:02:09.493',NULL,'success'),('cmp2cop0x003u6o6loxkgef47','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 08:10:08.434',NULL,'success'),('cmp2ezp2r003w6o6lpl3rtzfl','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:14:40.947',NULL,'success'),('cmp2fe06j003y6o6l4mxrif6b','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:25:48.523',NULL,'success'),('cmp2friro00426o6lrr1ckseq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:36:19.140',NULL,'success'),('cmp2fsol900446o6l0jvedfo4','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:37:13.341',NULL,'success'),('cmp2fsq4s00466o6lz4p008di','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:37:15.341',NULL,'success'),('cmp2fuwzl00486o6llne9axqc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:38:57.537',NULL,'success'),('cmp2fuxc2004a6o6lirqbbyl9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 09:38:57.987',NULL,'success'),('cmp2hy79a004c6o6lex5sahf0','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:37:30.046',NULL,'success'),('cmp2i2jgj004e6o6l6zvslift','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:40:52.483',NULL,'success'),('cmp2i314x004g6o6l0wxvpzps','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:41:15.393',NULL,'success'),('cmp2i48yc004i6o6l8k99l7vh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:42:12.181',NULL,'success'),('cmp2i4sp4004k6o6lexcx8pqi','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:42:37.768',NULL,'success'),('cmp2i635d004m6o6lcl52jv2l','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:43:37.970',NULL,'success'),('cmp2i6vkq004o6o6l0y40b77l','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:44:14.810',NULL,'success'),('cmp2iff0q00015f1rugc26ywc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:50:53.258',NULL,'success'),('cmp2ig3wq00035f1rq964pwkh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:51:25.515',NULL,'success'),('cmp2ig42800055f1rfbhnw2op','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:51:25.712',NULL,'success'),('cmp2igmhe00075f1rxc8gvf66','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:51:49.586',NULL,'success'),('cmp2igpp500095f1rndt50tnk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:51:53.754',NULL,'success'),('cmp2igvz1000b5f1r8y9gt1hf','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:52:01.885',NULL,'success'),('cmp2ihpbt000d5f1rj9fe9akr','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:52:39.930',NULL,'success'),('cmp2ikdog000f5f1ryjhsljv9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:54:44.800',NULL,'success'),('cmp2inskx0001sdyktrv7gz8e','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-12 10:57:24.081',NULL,'success'),('cmp3eadhs0001lzojznm5p7gz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 01:42:45.712',NULL,'success'),('cmp3ebi9v0003lzoj22a6f9cd','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 01:43:38.563',NULL,'success'),('cmp3ebkku0005lzojvbrxtks7','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 01:43:41.550',NULL,'success'),('cmp3gx9s90001q8wzcuepf9rc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 02:56:33.225',NULL,'success'),('cmp3gxd6o0003q8wztg4ep4yz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 02:56:37.632',NULL,'success'),('cmp3hsacm0001f4exy9o3iu4u','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 03:20:40.294',NULL,'success'),('cmp3hwj6o0001hqf8cmbb0mcp','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 03:23:58.368',NULL,'success'),('cmp3ihklf0003hqf890igg1ii','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 03:40:19.971',NULL,'success'),('cmp3ijaec0005hqf8o5gkbu8h','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 03:41:40.068',NULL,'success'),('cmp3izm9x0007hqf8zcj7c400','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 03:54:21.957',NULL,'success'),('cmp3jgrrj0009hqf8ajcjn4z8','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:07:42.223',NULL,'success'),('cmp3jmn0n000bhqf8b1q9tuag','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:12:16.007',NULL,'success'),('cmp3jmpy9000dhqf8kw9vvcn3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:12:19.810',NULL,'success'),('cmp3js1yl000fhqf8y65mux2h','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:16:28.654',NULL,'success'),('cmp3js64g000hhqf8z55eunkc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:16:34.048',NULL,'success'),('cmp3jurmy000jhqf8iuw0y2cd','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:18:35.242',NULL,'success'),('cmp3jv00b000lhqf8zrzzxgzd','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:18:46.092',NULL,'success'),('cmp3jvzbn000nhqf8nekg7c14','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:19:31.860',NULL,'success'),('cmp3kia1l000phqf8sgx7iqko','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:36:52.186',NULL,'success'),('cmp3kimq4000rhqf8b1379gam','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:37:08.621',NULL,'success'),('cmp3kjtbm000thqf89nflaup7','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:38:03.826',NULL,'success'),('cmp3kkr31000vhqf8cuz4c1pk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:38:47.581',NULL,'success'),('cmp3klxoo000xhqf8q3qpdkq4','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:39:42.792',NULL,'success'),('cmp3km0x0000zhqf809cgwcgp','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:39:46.980',NULL,'success'),('cmp3km3rp0011hqf89cvmig2z','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:39:50.677',NULL,'success'),('cmp3kmktz0013hqf81njc0lk2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:40:12.791',NULL,'success'),('cmp3kpe460015hqf89j71eawe','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:42:24.054',NULL,'success'),('cmp3kpjyn0017hqf8w640xzgc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:42:31.631',NULL,'success'),('cmp3kppny0019hqf8r72j942f','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:42:39.022',NULL,'success'),('cmp3kwxpp001bhqf8btn2x51o','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:48:16.045',NULL,'success'),('cmp3l54mv001dhqf84rit9m9i','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:54:38.264',NULL,'success'),('cmp3l89ym001fhqf8x0g7bvdt','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:57:05.135',NULL,'success'),('cmp3l8glq001hhqf8h26rc5c2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:57:13.742',NULL,'success'),('cmp3l99w4001jhqf89tbs7192','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 04:57:51.701',NULL,'success'),('cmp3ld3gj001lhqf8tq6c3boq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 05:00:49.988',NULL,'success'),('cmp3lfa60001nhqf8i108sav9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 05:02:31.993',NULL,'success'),('cmp3lffzh001phqf8zol4mlpk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 05:02:39.534',NULL,'success'),('cmp3lg66z001rhqf8j294noab','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 05:03:13.499',NULL,'success'),('cmp3olu0y001thqf8kxd0fz3p','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:31:36.515',NULL,'success'),('cmp3opbd2001vhqf8c5k6ub8i','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:34:18.950',NULL,'success'),('cmp3ou60u001xhqf8lh7hu5i3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:38:05.311',NULL,'success'),('cmp3ozkyh001zhqf8rt6x8at8','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:42:17.945',NULL,'success'),('cmp3ozyyz0021hqf8iagfa2cz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:42:36.107',NULL,'success'),('cmp3p5j2a0023hqf8280deflm','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:46:55.426',NULL,'success'),('cmp3p94b70025hqf8fw5kaua5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:49:42.931',NULL,'success'),('cmp3pbn3w0027hqf8vxh82pic','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:51:40.605',NULL,'success'),('cmp3pcnbu0029hqf8etm9lah9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 06:52:27.547',NULL,'success'),('cmp3pmxub002bhqf87v8sogni','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:00:27.732',NULL,'success'),('cmp3pqxtl002dhqf8u5g29l15','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:03:34.329',NULL,'success'),('cmp3psmlw002fhqf8seueau8v','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:04:53.109',NULL,'success'),('cmp3psswc002hhqf82i4xcozh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:05:01.261',NULL,'success'),('cmp3pywrj002jhqf8884sdw5u','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:09:46.207',NULL,'success'),('cmp3q8e8h002lhqf83imxwhi3','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:17:08.753',NULL,'success'),('cmp3q8hgt002nhqf8ykp6dohq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:17:12.941',NULL,'success'),('cmp3qdk5t002phqf8hgtu6u69','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:21:09.713',NULL,'success'),('cmp3qim1g002uhqf8g11z9n50','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:25:05.429',NULL,'success'),('cmp3qps41002whqf8qcebhpc5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:30:39.890',NULL,'success'),('cmp3qqier002yhqf80q9z7nwu','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:31:13.972',NULL,'success'),('cmp3qqre50030hqf8x999hlh2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:31:25.614',NULL,'success'),('cmp3qqwvr0032hqf8k4uihxkt','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:31:32.728',NULL,'success'),('cmp3qroik0034hqf8y5v865xx','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:32:08.540',NULL,'success'),('cmp3qs15u0036hqf89m6k66o2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:32:24.930',NULL,'success'),('cmp3qs6070038hqf87o1cx89p','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:32:31.207',NULL,'success'),('cmp3qs9wi003ahqf8lhdwdtyu','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:32:36.259',NULL,'success'),('cmp3qscx9003chqf8n68fuidx','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:32:40.173',NULL,'success'),('cmp3qsk77003ehqf89b57kxjh','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:32:49.603',NULL,'success'),('cmp3qtct9003ghqf8x4jdehr4','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:33:26.685',NULL,'success'),('cmp3qtmnd003ihqf8ws8iygpq','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:33:39.434',NULL,'success'),('cmp3quj9e003khqf8m548s3il','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:34:21.698',NULL,'success'),('cmp3qukod003mhqf8i06a5tzk','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:34:23.533',NULL,'success'),('cmp3qung9003ohqf83acu06as','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:34:27.130',NULL,'success'),('cmp3qyqrf003qhqf80b9e6ko5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:37:38.043',NULL,'success'),('cmp3qyvoz003shqf8i64omk1w','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:37:44.435',NULL,'success'),('cmp3qyxfd003uhqf88ueomtsz','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:37:46.681',NULL,'success'),('cmp3qyyzu003whqf8ocxnrt90','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:37:48.714',NULL,'success'),('cmp3qzcs1003yhqf8jyc6br3r','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:38:06.577',NULL,'success'),('cmp3qzf2o0040hqf80lnsd066','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:38:09.553',NULL,'success'),('cmp3qzjpt0042hqf8atic11qo','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:38:15.569',NULL,'success'),('cmp3qzvg50044hqf800w4vbx7','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:38:30.774',NULL,'success'),('cmp3r04lv0046hqf8gvn6tl8b','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:38:42.643',NULL,'success'),('cmp3r6x5s0048hqf8jw0be2n4','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:43:59.584',NULL,'success'),('cmp3rajto004ahqf8mkzkelf5','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:46:48.924',NULL,'success'),('cmp3rgaf6004chqf89gpijc81','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:51:16.675',NULL,'success'),('cmp3rh92n004ehqf86f6mdx8f','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:52:01.584',NULL,'success'),('cmp3rmgyr004ghqf8paohuhz7','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:56:05.091',NULL,'success'),('cmp3rrak2004ihqf8tcegtnql','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 07:59:50.066',NULL,'success'),('cmp3rvhy6004khqf81jz450yo','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:03:06.271',NULL,'success'),('cmp3ryya5004mhqf8ty1s94at','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:05:47.406',NULL,'success'),('cmp3s43uy004ohqf8co150b56','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:09:47.914',NULL,'success'),('cmp3s7yos004qhqf8paa50ykc','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:12:47.837',NULL,'success'),('cmp3s80zt004shqf83hiu8njm','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:12:50.825',NULL,'success'),('cmp3s82tm004uhqf8plods70g','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:12:53.194',NULL,'success'),('cmp3s84a4004whqf837dnvhw1','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:12:55.085',NULL,'success'),('cmp3s8c90004yhqf8qx55plwy','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:13:05.412',NULL,'success'),('cmp3s8eph0050hqf874dnj77g','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:13:08.597',NULL,'success'),('cmp3s8itx0052hqf8aq1hif1d','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:13:13.942',NULL,'success'),('cmp3s8qn50054hqf8ad4dxuzj','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:13:24.066',NULL,'success'),('cmp3shflo0056hqf8600fthu9','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:20:09.660',NULL,'success'),('cmp3sk72i0058hqf8mb82h1pg','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:22:18.571',NULL,'success'),('cmp3sl381005ahqf8uosnqjxw','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:23:00.241',NULL,'success'),('cmp3snj2b005chqf8ql16mvhj','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:24:54.084',NULL,'success'),('cmp3snrno005ehqf8chix3gvo','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:25:05.220',NULL,'success'),('cmp3so1qi005ghqf8s2ts8p55','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:25:18.283',NULL,'success'),('cmp3ssop1005ihqf83w57z89g','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:28:54.661',NULL,'success'),('cmp3stnc7005khqf8pxc0t9yl','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:29:39.559',NULL,'success'),('cmp3su8z0005mhqf8ld3vo9eg','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:30:07.596',NULL,'success'),('cmp3t84e5000166itqjj7nnd2','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:40:54.846',NULL,'success'),('cmp3te3410001waatgxye3wnx','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:45:33.122',NULL,'success'),('cmp3tf4qt0003waatw8lbya61','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-05-13 08:46:21.893',NULL,'success');
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
INSERT INTO `users` VALUES ('cmp1yypkz000013hfrmy3vmmo','nbjeSZkVLbP92o68qImdqmigHQ42','bachsydonggiphn@gmail.com','Dong Bach','https://lh3.googleusercontent.com/a/ACg8ocIROSjudUStx2GqFQDILbHiQx1g7i3KUh9PZZOz-8p7HA3fPD80=s96-c','super_admin','active',NULL,NULL,NULL,'2026-05-13 08:46:20.288','2026-05-12 01:46:01.092','2026-05-13 08:46:20.289');
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
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime(3) NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost` double NOT NULL,
  `mileage` double NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `receiptUrl` text COLLATE utf8mb4_unicode_ci,
  `damagePhotoUrl` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `vehicle_maintenances_vehicleId_fkey` (`vehicleId`),
  KEY `vehicle_maintenances_driverId_fkey` (`driverId`),
  CONSTRAINT `vehicle_maintenances_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
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
  `activeLogId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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

-- Dump completed on 2026-05-13  8:48:19
