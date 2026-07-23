// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { getUserSubscriptions } from '../../services/api';
import { useNavigate } from 'react-router-dom';


const Dashboard = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadSubscriptions();
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      const data = await getUserSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowsePlans = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <div className="dashboard-container"><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.name || 'User'}!</h1>
      
      <div className="dashboard-cards">
        <div className="card">
          <h3>Active Subscriptions</h3>
          <p className="stat">{subscriptions.length}</p>
        </div>
        <div className="card">
          <h3>Next Delivery</h3>
          <p className="stat">Tomorrow</p>
        </div>
        <div className="card">
          <h3>Total Spent</h3>
          <p className="stat">₹0</p>
        </div>
      </div>

      <div className="subscriptions-section">
        <h2>Your Subscriptions</h2>
        {subscriptions.length > 0 ? (
          <div className="subscriptions-list">
            {subscriptions.map(sub => (
              <div key={sub.subscription_id} className="subscription-item">
                <h3>{sub.plan_name}</h3>
                <p>Status: {sub.status}</p>
                <p>Amount: Rs{sub.price_per_month}/month</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No active subscriptions. <a href="/">Browse our meal plans</a></p>
        )}
      </div>

      <div className="quick-actions">
        <button className="btn-primary" onClick={handleBrowsePlans}>
          Browse More Plans
        </button>
        <button className="btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
