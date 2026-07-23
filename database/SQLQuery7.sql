IF DB_ID('TiffinDeliverySystem') IS NULL
    CREATE DATABASE TiffinDeliverySystem;
GO

USE TiffinDeliverySystem;

IF OBJECT_ID('Customers','U') IS NOT NULL DROP TABLE Customers;
GO

CREATE TABLE Customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    address TEXT NOT NULL,
    pincode VARCHAR(10),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    registration_date DATE DEFAULT GETDATE(),
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);
GO

IF OBJECT_ID('Customer_Addresses','U') IS NOT NULL DROP TABLE Customer_Addresses;
GO

CREATE TABLE Customer_Addresses (
    address_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BIT DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);
GO

IF OBJECT_ID('Meal_Plans','U') IS NOT NULL DROP TABLE Meal_Plans;
GO

CREATE TABLE Meal_Plans (
    plan_id INT IDENTITY(1,1) PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10,2),
    price_per_week DECIMAL(10,2),
    price_per_month DECIMAL(10,2),
    is_available BIT DEFAULT 1
);
GO

CREATE TABLE Daily_Menu (
    daily_menu_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL,
    menu_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    available_quantity INT DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id) ON DELETE CASCADE
);

IF OBJECT_ID('Subscriptions','U') IS NOT NULL DROP TABLE Subscriptions;
GO

CREATE TABLE Subscriptions (
    subscription_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    subscription_type VARCHAR(20) CHECK (subscription_type IN ('daily','weekly','monthly')),
    status VARCHAR(20) CHECK (status IN ('active','paused','cancelled','expired')) DEFAULT 'active',
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (plan_id) REFERENCES Meal_Plans(plan_id)
);
GO

IF OBJECT_ID('Menu_Items','U') IS NOT NULL DROP TABLE Menu_Items;
GO

CREATE TABLE Menu_Items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) CHECK (category IN ('breakfast','lunch','dinner')),
    cuisine_type VARCHAR(50),
    price DECIMAL(10,2),
    ingredients TEXT,
    calories INT,
    image_url VARCHAR(255),
    is_available BIT DEFAULT 1
);
GO

IF OBJECT_ID('Orders','U') IS NOT NULL DROP TABLE Orders;
GO

CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    subscription_id INT,
    order_date DATETIME DEFAULT GETDATE(),
    delivery_date DATE,
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast','lunch','dinner')),
    total_amount DECIMAL(10,2),
    status VARCHAR(30) CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')) DEFAULT 'pending',
    special_instructions TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (subscription_id) REFERENCES Subscriptions(subscription_id)
);
GO

IF OBJECT_ID('Order_Items','U') IS NOT NULL DROP TABLE Order_Items;
GO

CREATE TABLE Order_Items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price_at_time DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id)
);
GO

IF OBJECT_ID('Riders','U') IS NOT NULL DROP TABLE Riders;
GO

CREATE TABLE Riders (
    rider_id INT IDENTITY(1,1) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    vehicle_number VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('available','busy','offline')) DEFAULT 'available'
);
GO

IF OBJECT_ID('Deliveries','U') IS NOT NULL DROP TABLE Deliveries;
GO

CREATE TABLE Deliveries (
    delivery_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    rider_id INT,
    delivery_time DATETIME,
    status VARCHAR(30) CHECK (status IN ('assigned','picked_up','on_way','delivered')),
    customer_rating INT CHECK (customer_rating BETWEEN 1 AND 5),
    feedback TEXT,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (rider_id) REFERENCES Riders(rider_id)
);
GO

IF OBJECT_ID('Payments','U') IS NOT NULL DROP TABLE Payments;
GO

CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    subscription_id INT,
    amount DECIMAL(10,2),
    payment_date DATE DEFAULT GETDATE(),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash','card','upi','net_banking')),
    status VARCHAR(20) CHECK (status IN ('pending','completed','failed')) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    FOREIGN KEY (subscription_id) REFERENCES Subscriptions(subscription_id)
);
GO

UPDATE Customers 
SET role = 'admin'
WHERE email = 'admin@gmail.com';

INSERT INTO Menu_Items (item_name, description, category, cuisine_type, price, ingredients, calories, image_url) VALUES
('Masala Dosa', 'Crispy dosa with potato filling and chutney', 'breakfast', 'South Indian', 60.00, 'Rice flour, potatoes, onions, spices', 350, '/uploads/dosa.jpg'),
('Idli Sambar', 'Steamed rice cakes with lentil soup', 'breakfast', 'South Indian', 50.00, 'Rice, urad dal, vegetables, spices', 250, '/uploads/idli.jpg'),
('Paneer Butter Masala', 'Cottage cheese in rich tomato gravy', 'lunch', 'North Indian', 120.00, 'Paneer, tomatoes, cream, spices', 450, '/uploads/paneer.jpg'),
('Chicken Biryani', 'Fragrant rice with chicken pieces and spices', 'lunch', 'Hyderabadi', 150.00, 'Rice, chicken, onions, spices, saffron', 600, '/uploads/biryani.jpg'),
('Dal Tadka', 'Tempered lentil soup with spices', 'lunch', 'North Indian', 80.00, 'Lentils, tomatoes, spices, ghee', 300, '/uploads/dal.jpg'),
('Vegetable Pulao', 'Fragrant rice with mixed vegetables', 'lunch', 'North Indian', 90.00, 'Rice, mixed vegetables, spices', 350, '/uploads/pulao.jpg'),
('Chicken Curry', 'Spicy chicken curry with rice', 'dinner', 'North Indian', 140.00, 'Chicken, tomatoes, spices, rice', 550, '/uploads/chicken_curry.jpg'),
('Fish Curry', 'Tangy fish curry with rice', 'dinner', 'Kerala', 130.00, 'Fish, coconut milk, spices, rice', 500, '/uploads/fish_curry.jpg'),
('Palak Paneer', 'Spinach and cottage cheese curry', 'dinner', 'North Indian', 110.00, 'Spinach, paneer, spices', 400, '/uploads/palak_paneer.jpg');

INSERT INTO Daily_Menu (item_id, menu_date, available_quantity) VALUES
(1, CAST(GETDATE() AS DATE), 50),  -- Masala Dosa
(2, CAST(GETDATE() AS DATE), 40),  -- Idli Sambar
(3, CAST(GETDATE() AS DATE), 30),  -- Paneer Butter Masala
(4, CAST(GETDATE() AS DATE), 25),  -- Chicken Biryani
(5, CAST(GETDATE() AS DATE), 35),  -- Dal Tadka
(6, CAST(GETDATE() AS DATE), 45),  -- Vegetable Pulao
(7, CAST(GETDATE() AS DATE), 20),  -- Chicken Curry
(8, CAST(GETDATE() AS DATE), 15),  -- Fish Curry
(9, CAST(GETDATE() AS DATE), 25);  -- Palak Paneer

CREATE TABLE Weekly_Menu (
  weekly_menu_id INT IDENTITY(1,1) PRIMARY KEY,
  weekday VARCHAR(10) NOT NULL,          -- e.g. Monday, Tuesday...
  item_id INT NOT NULL,                  -- FK to Menu_Items.item_id
  price DECIMAL(8,2) NULL,
  available_quantity INT DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE()
);

-- optional: sample seed (adjust item_ids to existing items)
INSERT INTO Weekly_Menu (weekday, item_id, price, available_quantity)
VALUES
('Monday', 1, 60, 50),
('Monday', 2, 80, 50),
('Tuesday', 3, 120, 50);

-- Insert Meal Plans
INSERT INTO Meal_Plans (plan_name, description, price_per_day, price_per_week, price_per_month) VALUES
('Breakfast Plan', 'Healthy breakfast delivered daily', 50.00, 300.00, 999.00),
('Lunch Plan', 'Complete lunch with 2 main courses, 3 chapatis, rice, and salad', 100.00, 600.00, 2499.00),
('Dinner Plan', 'Light and healthy dinner', 90.00, 500.00, 1999.00),
('Full Day Plan', 'Breakfast + Lunch + Dinner', 220.00, 1300.00, 3299.00);
GO

-- Insert Riders
INSERT INTO Riders (first_name, last_name, phone, vehicle_number) VALUES
('Raj', 'Kumar', '9876543210', 'MH01AB1234'),
('Suresh', 'Patil', '9876543211', 'MH01CD5678'),
('Priya', 'Sharma', '9876543212', 'MH01EF9012');
GO

-- Check if password column exists, if not add it
IF COL_LENGTH('dbo.Customers','password') IS NULL
BEGIN
    ALTER TABLE dbo.Customers
    ADD password VARCHAR(255) NULL;
    PRINT 'Password column added successfully to Customers table';
END
ELSE
BEGIN
    PRINT 'Password column already exists in Customers table';
END
GO

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'password';
GO
