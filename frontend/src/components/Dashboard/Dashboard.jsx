// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { getUserSubscriptions } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { DashboardSkeleton } from '../ui/Skeleton';

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
  }, [user, navigate]);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-red-100 bg-white/90 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">FreshMeal</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Welcome back, {user?.name || 'User'}!</h1>
              <p className="mt-2 text-sm text-gray-600">Your meal plan activity is neatly organized below.</p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {subscriptions.length > 0 ? `${subscriptions.length} active plan${subscriptions.length > 1 ? 's' : ''}` : 'No active plan yet'}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Subscriptions</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{subscriptions.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Next Delivery</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">Tomorrow</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Estimated Spend</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">₹0</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Subscriptions</h2>
            <button className="text-sm font-medium text-red-600 hover:text-red-700" onClick={handleBrowsePlans}>Browse plans</button>
          </div>

          {subscriptions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {subscriptions.map((sub) => (
                <div key={sub.subscription_id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{sub.plan_name}</h3>
                      <p className="mt-1 text-sm text-gray-600">Status: {sub.status}</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                      {sub.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">Amount: Rs{sub.price_per_month || sub.price || 0}/month</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
              No active subscriptions yet. <a href="/" className="font-semibold text-red-600">Browse our meal plans</a> to get started.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700" onClick={handleBrowsePlans}>
            Browse More Plans
          </button>
          <button className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
