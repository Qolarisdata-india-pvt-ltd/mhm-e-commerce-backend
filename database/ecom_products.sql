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
-- Database: `ecom_products`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(12, 'Electronics', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(13, 'Clothing', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(14, 'Fresh & Daily Essentials', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(15, 'Snacks & Ready-to-Eat', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(16, 'Beverages', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(17, 'Staples & Cooking Essentials', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(18, 'Packaged & Branded Foods', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(19, 'Sweets & Desserts', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(20, 'Healthy & Organic', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(21, 'Baby Food', '2026-07-30 10:58:29', '2026-07-30 10:58:29'),
(22, 'Combos & Offers', '2026-07-30 10:58:29', '2026-07-30 10:58:29');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` float NOT NULL,
  `description` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `totalStock` int(11) DEFAULT 0,
  `reservedStock` int(11) DEFAULT 0,
  `warehouseStock` int(11) DEFAULT 0,
  `availableStock` int(11) DEFAULT 0,
  `vendorId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CategoryId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `description`, `images`, `totalStock`, `reservedStock`, `warehouseStock`, `availableStock`, `vendorId`, `createdAt`, `updatedAt`, `CategoryId`) VALUES
(3, 'Wireless Headphones', 2500, 'High quality noise-cancelling headphones.', '[\"https://img.freepik.com/premium-photo/photo-wireless-headphones_1029469-18128.jpg\"]', 50, 0, 40, 50, 2, '2026-07-30 10:58:30', '2026-07-30 10:58:30', 12),
(4, 'Cotton T-Shirt', 500, 'Comfortable 100% cotton t-shirt.', '[\"https://th.bing.com/th/id/OIP.uUHWw_qUuuPphnghYUcjjgHaJQ?w=208&h=260&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3\"]', 100, 0, 50, 100, 2, '2026-07-30 10:58:30', '2026-07-30 10:58:30', 13);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CategoryId` (`CategoryId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
