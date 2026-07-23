# Tiffin Delivery System

A full-stack web application for a tiffin meal subscription and delivery platform. Customers can browse meal plans, subscribe to services, and track deliveries, while admins can manage users, meal plans, deliveries, riders, feedback, complaints, payments, and weekly menus.

## Features

- User registration and login
- Meal plan browsing and subscriptions
- Admin dashboard for managing users, deliveries, plans, and menus
- Rider location sharing and delivery tracking
- Feedback and complaint management
- Payments and analytics support
- Image upload support for menu items

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Create React App

### Backend
- Node.js
- Express.js
- JWT authentication
- bcrypt for password hashing
- Multer for file uploads
- Microsoft SQL Server

## Project Structure

- frontend/ - React client application
- backend/ - Express REST API server
- database/ - SQL scripts and migration files

## Prerequisites

Make sure you have the following installed:

- Node.js (v18 or higher recommended)
- npm
- Microsoft SQL Server
- Git

## Installation

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   cd TiffinDeliverySystem
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

## Environment Configuration

Create a `.env` file inside the `backend` folder with the following variables:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
DB_SERVER=localhost
DB_NAME=TiffinDeliverySystem
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433
JWT_SECRET=your_secret_key
```

> Replace the database values with your own SQL Server configuration.

## Database Setup

1. Create a SQL Server database named `TiffinDeliverySystem`.
2. Run the SQL scripts in the `database/` folder as needed for your environment.

## Running the Application

### Start the backend
```bash
cd backend
npm run dev
```

The backend will run on:
- http://localhost:5000

### Start the frontend
```bash
cd frontend
npm start
```

The frontend will run on:
- http://localhost:3000

## API Health Check

You can verify the backend is running by visiting:

- http://localhost:5000/api/health

## Useful Notes

- Uploaded files are served from the `/uploads` directory.
- The frontend connects to the backend through the Express API routes defined in the `backend` folder.
- If you encounter database connection issues, verify your SQL Server credentials and server name in the backend `.env` file.

## License

This project is intended for educational and demonstration purposes.
