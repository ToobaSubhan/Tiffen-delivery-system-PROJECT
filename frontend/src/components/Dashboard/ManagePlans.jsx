// src/components/Dashboard/ManagePlans.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ManagePlans = () => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    plan_name: '',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch(`${API}/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load plans');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.plan_name.trim()) {
      newErrors.plan_name = 'Plan name is required';
    }

    if (!form.price_per_day || isNaN(form.price_per_day) || parseFloat(form.price_per_day) <= 0) {
      newErrors.price_per_day = 'Valid daily price is required';
    }

    if (!form.price_per_week || isNaN(form.price_per_week) || parseFloat(form.price_per_week) <= 0) {
      newErrors.price_per_week = 'Valid weekly price is required';
    }

    if (!form.price_per_month || isNaN(form.price_per_month) || parseFloat(form.price_per_month) <= 0) {
      newErrors.price_per_month = 'Valid monthly price is required';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPlan = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const planData = {
        plan_name: form.plan_name.trim(),
        description: form.description.trim(),
        price_per_day: parseFloat(form.price_per_day),
        price_per_week: parseFloat(form.price_per_week),
        price_per_month: parseFloat(form.price_per_month)
      };

      const res = await fetch(`${API}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add plan');
      }

      setForm({
        plan_name: '',
        price_per_day: '',
        price_per_week: '',
        price_per_month: '',
        description: ''
      });
      setErrors({});
      await loadPlans();
    } catch (error) {
      console.error('Error adding plan:', error);
      alert(`Failed to add plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API}/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete plan');
      }

      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Meal Plans</h2>
        <p className="text-gray-600">Create and manage meal plan offerings for customers</p>
      </div>

      {/* Add Plan Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Meal Plan</h3>
        <form onSubmit={addPlan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Breakfast Plan"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.plan_name ? 'border-red-500' : 'border-gray-300'
              }`}
              value={form.plan_name}
              onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
            />
            {errors.plan_name && (
              <p className="text-red-500 text-sm mt-1">{errors.plan_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Price (₨) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="50.00"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.price_per_day ? 'border-red-500' : 'border-gray-300'
              }`}
              value={form.price_per_day}
              onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
            />
            {errors.price_per_day && (
              <p className="text-red-500 text-sm mt-1">{errors.price_per_day}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Price (₨) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="300.00"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.price_per_week ? 'border-red-500' : 'border-gray-300'
              }`}
              value={form.price_per_week}
              onChange={(e) => setForm({ ...form, price_per_week: e.target.value })}
            />
            {errors.price_per_week && (
              <p className="text-red-500 text-sm mt-1">{errors.price_per_week}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Price (Rs) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="999.00"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.price_per_month ? 'border-red-500' : 'border-gray-300'
              }`}
              value={form.price_per_month}
              onChange={(e) => setForm({ ...form, price_per_month: e.target.value })}
            />
            {errors.price_per_month && (
              <p className="text-red-500 text-sm mt-1">{errors.price_per_month}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              placeholder="Describe the meal plan..."
              rows="3"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Plan...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.plan_id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <h3 className="text-white text-xl font-bold">{plan.plan_name}</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">{plan.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Daily:</span>
                  <span className="font-semibold text-gray-900">₨{plan.price_per_day}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Weekly:</span>
                  <span className="font-semibold text-gray-900">₨{plan.price_per_week}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Monthly:</span>
                  <span className="font-semibold text-gray-900">₨{plan.price_per_month}</span>
                </div>
              </div>

              <button
                onClick={() => deletePlan(plan.plan_id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Delete Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No meal plans</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new meal plan.</p>
        </div>
      )}
    </div>
  );
};

export default ManagePlans;
