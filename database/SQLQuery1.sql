-- Remove old hard-coded constraint
ALTER TABLE Menu_Items 
DROP CONSTRAINT CK__Menu_Item__categ__5FB337D6;

-- Create Categories table
CREATE TABLE Categories (
  category_id   INT IDENTITY(1,1) PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL UNIQUE,
  created_at    DATETIME DEFAULT GETDATE()
);

-- Seed existing categories
INSERT INTO Categories (category_name) VALUES 
  ('breakfast'), ('lunch'), ('dinner'), ('snack');