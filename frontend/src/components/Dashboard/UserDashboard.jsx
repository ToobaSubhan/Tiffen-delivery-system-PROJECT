// tiffin-frontend/src/components/Dashboard/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import {
  getUserSubscriptions,
  getTodayMeals,
  getUserDeliveries,
  getUserDashboardStats,
  getWeeklyMenu,
  submitFeedback
} from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import { DashboardSkeleton } from "../ui/Skeleton";

const DEFAULT_STATS = {
  activeSubscription: null,
  todayDeliveries: 0,
  monthDeliveries: 0,
  pendingPayments: 0,
};

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [subscriptions, setSubscriptions] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
  }, [user, navigate]);

  // Helpers
  const normalizeToArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.menu)) return data.menu;
    if (Array.isArray(data.meals)) return data.meals;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    // Find first array property
    for (const key of Object.keys(data || {})) {
      if (Array.isArray(data[key])) return data[key];
    }
    return [];
  };

  const safeFormatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN");
  };

  // Load all dashboard data sequentially and resiliently
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);

      try {
        // 1) Subscriptions (PRIMARY source of truth)
        try {
          const subsRaw = await getUserSubscriptions();
          const subs = normalizeToArray(subsRaw);
          if (isMounted) setSubscriptions(subs);
        } catch (err) {
          // If subscriptions fail, keep empty array but continue loading other endpoints
          console.error("Failed to load subscriptions:", err);
          if (isMounted) setSubscriptions([]);
        }

        // 2) Dashboard stats (optional)
        // If this fails, we fall back to DEFAULT_STATS and continue
        try {
          const stats = await getUserDashboardStats();
          if (isMounted) setDashboardStats({ ...DEFAULT_STATS, ...(stats || {}) });
        } catch (err) {
          console.warn("Dashboard stats not available, using defaults.");
          if (isMounted) setDashboardStats(DEFAULT_STATS);
        }

        // 3) Today's meals
        try {
          const mealsRaw = await getTodayMeals();
          const meals = normalizeToArray(mealsRaw);
          if (isMounted) setTodayMeals(meals);
        } catch (err) {
          console.error("Failed to load today's meals:", err);
          if (isMounted) setTodayMeals([]);
        }

        // 4) Deliveries
        try {
          const deliveriesRaw = await getUserDeliveries();
          const dvs = normalizeToArray(deliveriesRaw);
          if (isMounted) setDeliveries(dvs);
        } catch (err) {
          console.error("Failed to load deliveries:", err);
          if (isMounted) setDeliveries([]);
        }

        // 5) Weekly menu (may be array OR { menu: [] })
        try {
          const weeklyRaw = await getWeeklyMenu();
          const menu = normalizeToArray(weeklyRaw);
          if (isMounted) setWeeklyMenu(menu);
        } catch (err) {
          console.error("Failed to load weekly menu:", err);
          if (isMounted) setWeeklyMenu([]);
        }
      } finally {
        // Ensure loading always resolves
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();

    // Listen for payment updates to refresh pending payments count
    const onPaymentsUpdated = () => {
      if (isMounted) loadDashboardData();
    };

    window.addEventListener('paymentsUpdated', onPaymentsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('paymentsUpdated', onPaymentsUpdated);
    };
  }, [user]);

  // Feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackMessage("");

    try {
      await submitFeedback(feedbackRating, feedbackComment);
      setFeedbackMessage("Thank you for your feedback!");
      setFeedbackComment("");
      setFeedbackRating(5);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setFeedbackMessage("Failed to submit feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const activeSubscription = subscriptions.find((sub) => sub?.status === "active") || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name || user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Here's your meal subscription overview</p>
        </div>

        {/* Dashboard Overview Cards - FIXED with real data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Subscription */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscription</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeSubscription ? activeSubscription.plan_name : 'None'}
                </p>
                <p className="text-sm text-gray-500">
                  {activeSubscription ? `Rs${activeSubscription.price}/month` : 'Not subscribed'}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Deliveries */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.todayDeliveries}
                </p>
                <p className="text-sm text-gray-500">Scheduled for today</p>
              </div>
            </div>
          </div>

          {/* This Month Deliveries */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.monthDeliveries}
                </p>
                <p className="text-sm text-gray-500">Total deliveries</p>
              </div>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.pendingPayments}
                </p>
                <p className="text-sm text-gray-500">Awaiting payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Menu Section - FIXED field names */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Today's Menu</h2>
            <Link to="/menu" className="text-red-600 hover:text-red-800 text-sm font-medium">
              View Full Menu →
            </Link>
          </div>
          
          {todayMeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {todayMeals.slice(0, 3).map((meal, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {meal.category || meal.meal_type || 'Meal'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {meal.meal_name || meal.item_name || 'Meal'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {meal.description || ''}
                  </p>
                  
                  {/* Image - FIXED with proper URL handling */}
                  {meal.image && (
                    <img
                      src={meal.image}
                      alt={meal.meal_name || meal.item_name || 'Meal'}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                      }}
                    />
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{(meal.calories || meal.cal || 'N/A')} cal</span>
                    <span className="font-bold text-red-600">Rs{(meal.price ?? meal.price_per_item) || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No meals scheduled for today</p>
              <button
                onClick={() => navigate("/plans")}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Browse Plans
              </button>
            </div>
          )}
        </div>

        {/* Subscription Section - FIXED with real data */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Subscription</h2>
          {activeSubscription ? (
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{activeSubscription.plan_name}</h3>
                  <p className="text-gray-600">Rs{activeSubscription.price}/month</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeSubscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {activeSubscription.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-lg font-semibold">{activeSubscription.subscription_type || 'Monthly'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="text-lg font-semibold">
                    {safeFormatDate(activeSubscription.start_date)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="text-lg font-semibold">
                    {activeSubscription.end_date ? safeFormatDate(activeSubscription.end_date) : 'Ongoing'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold capitalize">{activeSubscription.status}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Pause Subscription
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Change Meal Type
                </button>
                <button
                  onClick={() => navigate("/plans")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have an active subscription yet.</p>
              <button
                onClick={() => navigate("/plans")}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Subscribe Now
              </button>
            </div>
          )}
        </div>

        {/* Deliveries Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Deliveries</h2>
            <Link to="/history" className="text-red-600 hover:text-red-800 text-sm font-medium">
              View All →
            </Link>
          </div>

          {deliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveries.slice(0, 5).map((delivery) => {
                    const statusClass = {
                      assigned: 'bg-blue-100 text-blue-700',
                      picked_up: 'bg-purple-100 text-purple-700',
                      'in transit': 'bg-orange-100 text-orange-700',
                      delivered: 'bg-green-100 text-green-700',
                      cancelled: 'bg-red-100 text-red-700',
                    }[delivery.status] || 'bg-gray-100 text-gray-700';

                    return (
                      <tr key={delivery.delivery_id || delivery.order_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {safeFormatDate(delivery.delivery_date || delivery.order_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {delivery.plan_name || 'Standard'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                            {delivery.status || 'assigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs{delivery.total_amount || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No deliveries yet. Deliveries are generated automatically each morning for active subscriptions.</p>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Share Your Feedback</h2>
            <p className="text-sm text-gray-500 mt-1">Rate your experience and help us improve.</p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <span className="text-sm text-gray-500">{feedbackRating} / 5</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      feedbackRating >= star
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-red-500 hover:text-red-500'
                    }`}
                  >
                    <span className="text-lg">★</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                rows={4}
                placeholder="Tell us how we can improve"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>

            {feedbackMessage && (
              <p className="text-sm text-gray-600">{feedbackMessage}</p>
            )}
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => navigate("/plans")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Browse More Plans
          </button>
          <button
            onClick={() => navigate("/menu")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Today's Menu
          </button>
          {/* User-only Payments Link */}
          {user?.role !== 'admin' && (
            <button
              onClick={() => navigate('/payments')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              View My Payments
            </button>
          )}
          <button
            onClick={logout}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;