IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Feedback' AND xtype='U')
CREATE TABLE Feedback (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);
GO

ALTER TABLE Meal_Plans ADD meals_per_day INT NULL;
ALTER TABLE Meal_Plans ADD subscription_type VARCHAR(20) NULL;
ALTER TABLE Meal_Plans ADD duration_type VARCHAR(20) NULL;
ALTER TABLE Meal_Plans ADD plan_type VARCHAR(20) NULL;
