import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMealPlans } from "../services/api";
import { useAuth } from "../Context/AuthContext";

const MealPlans = () => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getMealPlans();
        setPlans(data);
        setFilteredPlans(data);
      } catch (err) {
        setError("Failed to load meal plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredPlans(plans);
    } else {
      const filtered = plans.filter(plan => {
        if (activeFilter === "Veg") return plan.plan_type?.toLowerCase() === "veg";
        if (activeFilter === "Non-Veg") return plan.plan_type?.toLowerCase() === "non-veg";
        if (activeFilter === "Weekly") return plan.duration_type?.toLowerCase() === "weekly";
        if (activeFilter === "Monthly") return plan.duration_type?.toLowerCase() === "monthly";
        return true;
      });
      setFilteredPlans(filtered);
    }
  }, [activeFilter, plans]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading meal plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-red-500 to-red-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Perfect Meal Plan
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Discover delicious, nutritious meal plans tailored to your lifestyle. From vegetarian delights to hearty non-veg options, we have something for everyone.
          </p>
        </div>
      </section>

      {/* Filtering Options */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {["All", "Veg", "Non-Veg", "Weekly", "Monthly"].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  activeFilter === filter
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Meal Plans Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No plans found for the selected filter.</p>
              <button
                onClick={() => setActiveFilter("All")}
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition"
              >
                Show All Plans
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredPlans.map(plan => (
                <div
                  key={plan.plan_id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden"
                >
                  {/* Badge */}
                  <div className="relative">
                    <span
                      className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold text-white rounded-full ${getBadgeColor(plan.plan_type)}`}
                    >
                      {plan.plan_type?.toUpperCase() || "GENERAL"}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Icon and Title */}
                    <div className="flex items-center mb-4">
                      <span className="text-4xl mr-3">{getPlanIcon(plan.plan_type)}</span>
                      <h3 className="text-xl font-bold text-gray-800">{plan.plan_name}</h3>
                    </div>

                    {/* Price */}
                    <p className="text-2xl font-bold text-red-600 mb-4">
                      ₨{plan.price_per_month}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </p>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Plan Details */}
                    <div className="flex justify-between text-sm text-gray-500 mb-6">
                      <span>🍽️ {plan.meals_per_day} meals/day</span>
                      <span>📅 {plan.duration_type || "Monthly"}</span>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
                      onClick={() =>
                        user
                          ? navigate(`/subscribe/${plan.plan_id}`)
                          : navigate("/login")
                      }
                    >
                      {user ? "Subscribe Now" : "Login to Subscribe"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Need Help Choosing a Plan?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Our team is here to help you find the perfect meal plan for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300"
            >
              View Today’s Menu
            </Link>
            <Link
              to="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-red-600 transition duration-300"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MealPlans;
