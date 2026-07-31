-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 31, 2026 at 01:27 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ecom_order`
--

-- --------------------------------------------------------

--
-- Table structure for table `deliveryassignments`
--

CREATE TABLE `deliveryassignments` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `deliveryBoyId` int(11) NOT NULL,
  `status` enum('ASSIGNED','PICKED','OUT_FOR_DELIVERY','DELIVERED','FAILED','REASSIGNED') DEFAULT 'ASSIGNED',
  `reason` varchar(255) DEFAULT NULL,
  `cashDeposited` tinyint(1) DEFAULT 0 COMMENT 'True if delivery boy has handed over COD cash to Admin',
  `depositedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deliveryboys`
--

CREATE TABLE `deliveryboys` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `state` varchar(255) NOT NULL DEFAULT 'Chhattisgarh',
  `city` varchar(255) NOT NULL DEFAULT 'Raipur',
  `assignedAreas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`assignedAreas`)),
  `maxOrders` int(11) NOT NULL DEFAULT 100,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `id` int(11) NOT NULL,
  `orderId` int(11) DEFAULT NULL,
  `productId` int(11) DEFAULT NULL,
  `vendorId` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` float DEFAULT NULL,
  `status` enum('PENDING','PACKED','DELIVERED','OUT_FOR_DELIVERY','CANCELLED','RETURNED') DEFAULT 'PENDING',
  `refundStatus` enum('NONE','REQUESTED','APPROVED','REJECTED','PICKUP_SCHEDULED','CANCELLED','RETURNED','CREDITED','COMPLETED') DEFAULT 'NONE',
  `returnReason` varchar(255) DEFAULT NULL,
  `refundMethod` enum('ORIGINAL_SOURCE','BANK_TRANSFER','WAREHOUSE_COLLECT') DEFAULT NULL,
  `bankDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bankDetails`)),
  `returnDropMethod` enum('DELIVERY_BOY','WAREHOUSE_DROP') DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `amount` float NOT NULL,
  `orderDate` datetime NOT NULL,
  `shippingCharge` float NOT NULL DEFAULT 0,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`address`)),
  `assignedArea` varchar(255) NOT NULL,
  `status` enum('PROCESSING','PACKED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','PARTIALLY_CANCELLED','RETURN_REQUESTED') DEFAULT 'PROCESSING',
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `paymentMethod` varchar(255) NOT NULL,
  `payment` tinyint(1) DEFAULT 0,
  `codPaymentMode` enum('CASH','QR') DEFAULT NULL,
  `utrNumber` varchar(255) DEFAULT NULL,
  `date` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipping_rates`
--

CREATE TABLE `shipping_rates` (
  `id` int(11) NOT NULL,
  `areaName` varchar(255) NOT NULL,
  `rate` float NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `deliveryassignments`
--
ALTER TABLE `deliveryassignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`),
  ADD KEY `deliveryBoyId` (`deliveryBoyId`);

--
-- Indexes for table `deliveryboys`
--
ALTER TABLE `deliveryboys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shipping_rates`
--
ALTER TABLE `shipping_rates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `areaName` (`areaName`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `deliveryassignments`
--
ALTER TABLE `deliveryassignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `deliveryboys`
--
ALTER TABLE `deliveryboys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `shipping_rates`
--
ALTER TABLE `shipping_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `deliveryassignments`
--
ALTER TABLE `deliveryassignments`
  ADD CONSTRAINT `deliveryassignments_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `deliveryassignments_ibfk_2` FOREIGN KEY (`deliveryBoyId`) REFERENCES `deliveryboys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
