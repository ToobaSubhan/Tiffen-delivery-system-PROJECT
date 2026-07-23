
IF EXISTS (
  SELECT 1 FROM 
  WHERE name = 'FK_Payment_Subscription'
)
ALTER TABLE Payments DROP CONSTRAINT FK_Payment_Subscription;

IF EXISTS (
  SELECT 1 FROM 
  WHERE name = 'FK_Payment_User'
)
ALTER TABLE Payments DROP CONSTRAINT FK_Payment_User;

IF OBJECT_ID('Payments', 'U') IS NOT NULL
DROP TABLE Payments;

CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,

    customer_id INT NOT NULL,
    subscription_id INT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_method VARCHAR(20)
        CHECK (payment_method IN ('cash','card','upi','net_banking'))
        DEFAULT 'cash',

    payment_status VARCHAR(20)
        CHECK (payment_status IN ('pending','completed','failed'))
        DEFAULT 'pending',

    transaction_id VARCHAR(100) NULL,

    paid_at DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Payments_Customers
        FOREIGN KEY (customer_id)
        REFERENCES Customers(customer_id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Payments_Subscriptions
        FOREIGN KEY (subscription_id)
        REFERENCES Subscriptions(subscription_id)
        ON DELETE SET NULL
);
GO

select * from payments

