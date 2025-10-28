-- Gossip Project Database Initialization
-- Compatible with MySQL 5.7 and 8.0

-- Create database
CREATE DATABASE IF NOT EXISTS gossip_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gossip_db;

-- Groups table: stores group information
CREATE TABLE IF NOT EXISTS `groups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `group_number` INT NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_completed` (`is_completed`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entries table: stores user input records
CREATE TABLE IF NOT EXISTS `entries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `group_id` INT NOT NULL,
  `user_identifier` VARCHAR(255) NOT NULL,
  `text_content` TEXT NOT NULL,
  `added_text` VARCHAR(500) DEFAULT NULL,
  `solfege` VARCHAR(500) DEFAULT NULL,
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `position_in_group` TINYINT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_entries_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table: stores administrator accounts
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin account (username: admin, password: 123456)
INSERT INTO `admins` (`username`, `password`) VALUES ('admin', '123456');

-- Initialize group_number counter
INSERT INTO `groups` (`group_number`, `is_completed`, `created_at`) 
VALUES (1, 0, NOW());

