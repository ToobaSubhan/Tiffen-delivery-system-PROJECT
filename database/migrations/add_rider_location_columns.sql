-- Adds rider live tracking columns to Riders table
-- Run this migration in SQL Server.

ALTER TABLE Riders ADD current_lat DECIMAL(10,7) NULL;
ALTER TABLE Riders ADD current_lng DECIMAL(10,7) NULL;
ALTER TABLE Riders ADD location_updated_at DATETIME NULL;

