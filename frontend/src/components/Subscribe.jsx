// Subscribe.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMealPlans, createSubscription } from "../services/api";
import { useAuth } from "../Context/AuthContext";

const Subscribe = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const plans = await getMealPlans();
        const foundPlan = plans.find(p => p.plan_id === parseInt(planId));
        if (foundPlan) {
          setPlan(foundPlan);
        } else {
          setError("Plan not found. Please select a valid plan.");
        }
      } catch (err) {
        setError("Failed to load plan details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  const getPlanIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "veg": return "🥗";
      case "non-veg": return "🍖";
      default: return "🍱";
    }
  };

  const getBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "veg": return "bg-green-600";
      case "non-veg": return "bg-red-600";
      default: return "bg-gray-500";
    }
  };

  const validateStartDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    return selectedDate >= today;
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!startDate) {
      setError("Please select a start date.");
      return;
    }

    if (!validateStartDate(startDate)) {
      setError("Start date must be today or in the future.");
      return;
    }

    setSubmitting(true);
    try {
      const formattedDate = new Date(startDate).toISOString().split('T')[0];
      await createSubscription(plan.plan_id, formattedDate);
      setSuccess("Subscription created successfully! Redirecting to dashboard...");
      setTimeout(() => {
  navigate("/dashboard");
}, 1200);
    } catch (err) {
      setError(err.message || "Failed to create subscription. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // If user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to subscribe to a meal plan.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Plan Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The selected plan could not be found."}</p>
          <button
            onClick={() => navigate("/plans")}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/plans")}
            className="flex items-center text-red-600 hover:text-red-700 transition mb-4"
          >
            <span className="mr-2">←</span> Back to Plans
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Subscribe to Your Plan</h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-4xl mr-3">{getPlanIcon(plan.plan_type)}</span>
                <h2 className="text-2xl font-bold text-gray-800">{plan.plan_name}</h2>
              </div>
              <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${getBadgeColor(plan.plan_type)}`}>
                {plan.plan_type?.toUpperCase() || "GENERAL"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-red-600">₨{plan.price_per_month}</p>
                <p className="text-sm text-gray-600">per month</p>
              </div>

              <p className="text-gray-700">{plan.description}</p>

              <div className="flex justify-between text-sm text-gray-600">
                <span>🍽️ {plan.meals_per_day} meals per day</span>
                <span>📅 {plan.duration_type || "Monthly"}</span>
              </div>
            </div>
          </div>

          {/* Subscription Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Choose Start Date</h3>

            <form onSubmit={handleSubscribe}>
              <div className="mb-6">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Select today or a future date</p>
              </div>

              {/* Subscription Summary */}
              {startDate && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Subscription Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{plan.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">₨{plan.price_per_month}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{new Date(startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Subscription...
                  </>
                ) : (
                  "Confirm Subscription"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
