// tiffin-frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';

import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import MealPlans from './components/MealPlans';
import Subscribe from './components/Subscribe';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import DeliveryHistory from './components/Dashboard/DeliveryHistory';
import ManageUsers from './components/Dashboard/ManageUsers';
import ManageDeliveries from './components/Dashboard/ManageDeliveries';
import ManageFeedback from './components/Dashboard/ManageFeedback';
import ManageComplaints from './components/Dashboard/ManageComplaints';

import RiderShareLocation from './components/RiderShareLocation';

import TodayMenu from "./components/Menu/TodayMenu";
import AdminOperations from './components/Dashboard/AdminOperations.jsx';
import Riders from './components/Dashboard/Riders';
import Payments from './components/Dashboard/Payments';
import HomePage from './components/HomePage';
import RoleRoute from './components/RoleRoute';


function App() {
  return (
    <AuthProvider>         {/* IMPORTANT – keep this */}
      <Router>
        <Header />

        <div className="pt-16">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/plans" element={<MealPlans />} />
          <Route path="/plans/:planId" element={<MealPlans />} />
          <Route path="/subscribe/:planId" element={<Subscribe />} />
          <Route path="/menu" element={<TodayMenu />} />
          <Route path="/mealplans" element={<MealPlans />} />

          {/* User Dashboard — only 'user' role can access */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRole="user">
                <UserDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/history"
            element={
              <RoleRoute allowedRole="user">
                <DeliveryHistory />
              </RoleRoute>
            }
          />
          {/* Admin Pages — only 'admin' role can access */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRole="admin">
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/operations"
            element={
              <RoleRoute allowedRole="admin">
                <AdminOperations />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <RoleRoute allowedRole="admin">
                <AdminOperations />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRole="admin">
                <ManageUsers />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/deliveries"
            element={
              <RoleRoute allowedRole="admin">
                <ManageDeliveries />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <RoleRoute allowedRole="admin">
                <ManageFeedback />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <RoleRoute allowedRole="admin">
                <ManageComplaints />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/menu"
            element={
              <RoleRoute allowedRole="admin">
                <AdminOperations />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/menu-items"
            element={
              <RoleRoute allowedRole="admin">
                <AdminOperations />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/weekly-schedule"
            element={
              <RoleRoute allowedRole="admin">
                <AdminOperations />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/riders"
            element={
              <RoleRoute allowedRole="admin">
                <Riders />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <RoleRoute allowedRole="admin">
                <Payments />
              </RoleRoute>
            }
          />

          <Route path="/payments" element={<Payments />} />

          {/* Rider: share location (no auth/login required) */}
          <Route path="/rider/share/:riderId" element={<RiderShareLocation />} />
        </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
