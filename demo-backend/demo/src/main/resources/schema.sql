 DROP TABLE IF EXISTS payments;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'practitioner', 'admin') NOT NULL,
    bio TEXT NULL,
    reset_token_hash VARCHAR(64) NULL,
    reset_token_expiry TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token_hash'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(64) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token_expiry'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS recommendation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symptom VARCHAR(255) NOT NULL,
    suggested_therapy VARCHAR(255) NOT NULL,
    source_api VARCHAR(100) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (timestamp)
);

CREATE TABLE IF NOT EXISTS notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (created_at)
);

CREATE TABLE IF NOT EXISTS practitioner_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL,
    specialization VARCHAR(50) NOT NULL,
    experience_years INT NULL,
    verification_status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    rating DECIMAL(2,1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (license_number)
);

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'practitioner_profile' AND COLUMN_NAME = 'experience_years'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE practitioner_profile ADD COLUMN experience_years INT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS practitioner_available_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    practitioner_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('AVAILABLE', 'BOOKED', 'CANCELLED') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (practitioner_id, available_date, start_time)
);

CREATE TABLE IF NOT EXISTS therapy_session (
    id INT PRIMARY KEY AUTO_INCREMENT,
    practitioner_id INT NOT NULL,
    user_id INT NOT NULL,
    date DATETIME NOT NULL,
    status ENUM('booked', 'completed', 'cancelled') NOT NULL DEFAULT 'booked',
    notes TEXT,
    calendar_added TINYINT(1) NOT NULL DEFAULT 0,
    reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INT DEFAULT 0,
    image_url VARCHAR(1000),
    practitioner_id BIGINT NULL
);

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE products ADD COLUMN image_url VARCHAR(1000) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'practitioner_id'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE products ADD COLUMN practitioner_id BIGINT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url'
);
SET @sql = IF(@exists = 1,
    'ALTER TABLE products MODIFY COLUMN image_url VARCHAR(1000) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    phone VARCHAR(20) NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (product_id)
);

CREATE TABLE IF NOT EXISTS wishlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
    INDEX (user_id),
    INDEX (product_id)
);

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'address_line1'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN address_line1 VARCHAR(255) NOT NULL DEFAULT ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'address_line2'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN address_line2 VARCHAR(255)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'city'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'state'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN state VARCHAR(100) NOT NULL DEFAULT ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'postal_code'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN postal_code VARCHAR(20) NOT NULL DEFAULT ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'country'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT ''India''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'phone'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(64),
    card_last4 VARCHAR(4),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    practitioner_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (practitioner_id)
);

CREATE TABLE IF NOT EXISTS product_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    media_url VARCHAR(500),
    media_type VARCHAR(20),
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (product_id)
);

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_review' AND COLUMN_NAME = 'media_url'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE product_review ADD COLUMN media_url VARCHAR(500)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_review' AND COLUMN_NAME = 'media_type'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE product_review ADD COLUMN media_type VARCHAR(20)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS question (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS answer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    practitioner_id INT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (question_id),
    INDEX (practitioner_id)
);

-- Seed Data for Testing
-- DELETE FROM users;

INSERT IGNORE INTO practitioner_available_slots (practitioner_id, available_date, start_time, end_time, status) VALUES 
(1, CURDATE(), '09:00:00', '10:00:00', 'AVAILABLE'),
(1, CURDATE(), '10:00:00', '11:00:00', 'AVAILABLE'),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', 'AVAILABLE');

-- NOTE:
-- Product catalog is now generated at application startup based on existing practitioners'
-- specializations (see ProductCatalogStartupReseed / ProductCatalogService).
-- The old seed catalog was removed intentionally.

-- Wallet additions
SET @exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'practitioner_profile' AND COLUMN_NAME = 'balance'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE practitioner_profile ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'practitioner_id'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE products ADD COLUMN practitioner_id INT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure every existing product has an image URL (frontend serves these under /public/product-images)
-- Also refresh previously auto-assigned /product-images/*.svg placeholders so image choice can evolve
-- with improved name-based mapping.
UPDATE products
SET image_url = CASE
    WHEN LOWER(IFNULL(name, '')) LIKE '%supplement%' OR LOWER(IFNULL(name, '')) LIKE '%omega%' OR LOWER(IFNULL(name, '')) LIKE '%vitamin%' THEN '/product-images/supplement.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%hydration%' OR LOWER(IFNULL(name, '')) LIKE '%electrolyte%' OR LOWER(IFNULL(name, '')) LIKE '%ors%' THEN '/product-images/hydration.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%planner%' OR LOWER(IFNULL(name, '')) LIKE '%journal%' THEN '/product-images/planner.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%kit%' OR LOWER(IFNULL(name, '')) LIKE '%starter%' THEN '/product-images/kit.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%thermometer%' THEN '/product-images/thermometer.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%monitor%' OR LOWER(IFNULL(name, '')) LIKE '%blood pressure%' OR LOWER(IFNULL(name, '')) LIKE '%bp%' THEN '/product-images/monitor.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%glucometer%' OR LOWER(IFNULL(name, '')) LIKE '%glucose%' THEN '/product-images/glucometer.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%sleeve%' OR LOWER(IFNULL(name, '')) LIKE '%compression%' THEN '/product-images/sleeve.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%brace%' OR LOWER(IFNULL(name, '')) LIKE '%belt%' OR LOWER(IFNULL(name, '')) LIKE '%support%' THEN '/product-images/brace.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%splint%' OR LOWER(IFNULL(name, '')) LIKE '%stabilizer%' THEN '/product-images/splint.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%workbook%' THEN '/product-images/workbook.svg'
    WHEN LOWER(IFNULL(name, '')) LIKE '%cards%' THEN '/product-images/cards.svg'
    WHEN LOWER(IFNULL(category, '')) LIKE '%infectious%' THEN '/product-images/infectious.svg'
    WHEN LOWER(IFNULL(category, '')) LIKE '%internal medicine%' THEN '/product-images/internal_medicine.svg'
    WHEN LOWER(IFNULL(category, '')) LIKE '%family medicine%' THEN '/product-images/family_medicine.svg'
    WHEN LOWER(IFNULL(category, '')) LIKE '%ortho%' THEN '/product-images/orthopedic.svg'
    WHEN LOWER(IFNULL(category, '')) LIKE '%hand surgery%' THEN '/product-images/hand_surgery.svg'
    WHEN LOWER(IFNULL(category, '')) LIKE '%social worker%' OR LOWER(IFNULL(category, '')) LIKE '%clinical%' THEN '/product-images/mental_health.svg'
    ELSE '/product-images/general.svg'
END
    WHERE image_url IS NULL
       OR image_url = ''
       OR image_url IN (
           '/product-images/general.svg',
           '/product-images/infectious.svg',
           '/product-images/internal_medicine.svg',
           '/product-images/family_medicine.svg',
           '/product-images/orthopedic.svg',
           '/product-images/hand_surgery.svg',
           '/product-images/mental_health.svg',
           '/product-images/supplement.svg',
           '/product-images/hydration.svg',
           '/product-images/planner.svg',
           '/product-images/kit.svg',
           '/product-images/thermometer.svg',
           '/product-images/monitor.svg',
           '/product-images/glucometer.svg',
           '/product-images/sleeve.svg',
           '/product-images/brace.svg',
           '/product-images/splint.svg',
           '/product-images/workbook.svg',
           '/product-images/cards.svg'
       );

