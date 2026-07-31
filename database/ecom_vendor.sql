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
-- Database: `ecom_vendor`
--

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `businessName` varchar(255) NOT NULL,
  `businessType` varchar(255) NOT NULL,
  `businessDescription` text DEFAULT NULL,
  `yearsInBusiness` int(11) NOT NULL,
  `businessAddress` text NOT NULL,
  `aadharNumber` varchar(255) NOT NULL,
  `panNumber` varchar(255) NOT NULL,
  `gstNumber` varchar(255) DEFAULT NULL,
  `bankAccountHolderName` varchar(255) NOT NULL,
  `bankAccountNumber` varchar(255) NOT NULL,
  `bankIFSC` varchar(255) NOT NULL,
  `bankName` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `email`, `phone`, `password`, `businessName`, `businessType`, `businessDescription`, `yearsInBusiness`, `businessAddress`, `aadharNumber`, `panNumber`, `gstNumber`, `bankAccountHolderName`, `bankAccountNumber`, `bankIFSC`, `bankName`, `status`, `createdAt`, `updatedAt`) VALUES
(2, 'Test Vendor', 'vendor@test.com', '9876543210', '$2b$10$T1IK2qeYTPQt7p4OcDsCZea/p6ePdPITgRaKFHnD9n25sJtb8vlqu', 'SuperMart Retail', 'Electronics & Fashion', 'A trusted local business providing quality goods.', 5, '456 Market Square, Vijay Nagar, Indore', '[Aadhaar Redacted]', 'ABCDE1234F', '23AAAAA0000A1Z5', 'Test Vendor Store', '0000123456789', 'HDFC0001234', 'HDFC Bank', 'APPROVED', '2026-07-30 10:53:18', '2026-07-30 10:53:18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
