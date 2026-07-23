// tiffin-frontend/src/components/Menu/TodayMenu.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { getTodayMeals } from "../../services/api";

const TodayMenu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodayMeals();
  }, []);

  const fetchTodayMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTodayMeals();

      console.log("Raw API data:", data); // Debug log

      // Transform data with correct field mapping
      const transformedMeals = Array.isArray(data)
        ? data.map(item => ({
            id: item.id || item.daily_menu_id,
            item_id: item.item_id,
            meal_name: item.meal_name || item.item_name || "Unnamed Meal",
            description: item.description || "No description available",
            meal_type: (item.meal_type || item.category || "lunch").toLowerCase(),
            price: item.price || 0,
            ingredients: Array.isArray(item.ingredients) 
              ? item.ingredients 
              : (item.ingredients ? item.ingredients.split(',').map(i => i.trim()) : []),
            calories: item.calories || 0,
            image: item.image || item.image_url, // Use 'image' field from backend
            available_quantity: item.available_quantity || 0
          }))
        : [];
      
      console.log("Transformed meals:", transformedMeals); // Debug log
      setMeals(transformedMeals);
    } catch (error) {
      console.error("Error fetching today's meals:", error);
      setError("Failed to load today's menu. Please try again later.");
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  // Group meals by category
  const groupedMeals = meals.reduce((acc, meal) => {
    const category = meal.meal_type;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(meal);
    return acc;
  }, {});

  // Meal type configurations
  const mealTypeConfig = {
    breakfast: {
      title: "Breakfast",
      icon: "🌅",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      bgColor: "bg-yellow-50"
    },
    lunch: {
      title: "Lunch",
      icon: "☀️",
      color: "bg-green-100 text-green-800 border-green-200",
      bgColor: "bg-green-50"
    },
    dinner: {
      title: "Dinner",
      icon: "🌙",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      bgColor: "bg-blue-50"
    }
  };

  const formatCategoryTitle = (category) => {
    if (!category) return 'Menu';
    return category
      .split(/[-_ ]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryConfig = (category) => {
    if (mealTypeConfig[category]) return mealTypeConfig[category];
    return {
      title: formatCategoryTitle(category),
      icon: '🍽️',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      bgColor: 'bg-indigo-50'
    };
  };

  const MealCard = ({ meal }) => {
    const config = getCategoryConfig(meal.meal_type);

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden border border-gray-100">
        {/* Meal Type Badge */}
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
            {config.icon} {config.title}
          </span>
          <span className="text-lg font-bold text-gray-900">Rs{meal.price}</span>
        </div>

        {/* Image - FIXED: Use meal.image */}
        {meal.image ? (
          <div className="w-full h-48 bg-gray-200 overflow-hidden">
            <img
              src={meal.image}
              alt={meal.meal_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
              }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}

        <div className="p-6">
          {/* Meal Name - FIXED: Use meal.meal_name */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{meal.meal_name}</h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{meal.description}</p>

          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients:</h4>
              <div className="flex flex-wrap gap-1">
                {meal.ingredients.slice(0, 4).map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {ingredient}
                  </span>
                ))}
                {meal.ingredients.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{meal.ingredients.length - 4} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients:</h4>
              <p className="text-gray-500 text-xs">Not specified</p>
            </div>
          )}

          {/* Calories & Availability */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-1">🔥</span>
              <span className="font-medium">{meal.calories} calories</span>
            </div>

            {/* Availability indicator */}
            <div className="flex items-center text-sm">
              <span className={`w-2 h-2 rounded-full mr-2 ${
                meal.available_quantity > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className={`font-medium ${
                meal.available_quantity > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {meal.available_quantity > 0 ? 'Available' : 'Sold Out'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MealSection = ({ type, meals: sectionMeals, config }) => {
    if (!sectionMeals || sectionMeals.length === 0) {
      return (
        <div className={`rounded-xl p-8 text-center ${config.bgColor} border-2 border-dashed border-gray-300`}>
          <div className="text-4xl mb-4">{config.icon}</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No {config.title.toLowerCase()} scheduled today</h3>
          <p className="text-gray-500">Check back later for today's {config.title.toLowerCase()} options.</p>
        </div>
      );
    }

    return (
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <span className="text-3xl mr-3">{config.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
          <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            {sectionMeals.length} item{sectionMeals.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sectionMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading today's menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTodayMeals}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Today's Menu
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fresh meals prepared for you today
            </p>

            {user && (
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {meals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No meals scheduled for today</h2>
            <p className="text-gray-600 text-lg mb-8">
              We're working on preparing delicious meals for tomorrow. Check back soon!
            </p>
            <button
              onClick={fetchTodayMeals}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Refresh Menu
            </button>
          </div>
        ) : (
          <div>
            {/* Display meals grouped by category */}
            {Object.keys(groupedMeals).length > 0 ? (
              <>
                {Object.entries(groupedMeals).map(([category, mealsForCategory]) => (
                  <MealSection
                    key={category}
                    type={category}
                    meals={mealsForCategory}
                    config={getCategoryConfig(category)}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Meals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Menu Summary</h3>
                  <p className="text-gray-600">
                    Total {meals.length} item{meals.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {meals.filter(m => m.meal_type === 'breakfast').length}
                    </div>
                    <div className="text-sm text-gray-600">Breakfast</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {meals.filter(m => m.meal_type === 'lunch').length}
                    </div>
                    <div className="text-sm text-gray-600">Lunch</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {meals.filter(m => m.meal_type === 'dinner').length}
                    </div>
                    <div className="text-sm text-gray-600">Dinner</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs opacity-75">
          <div>Total meals: {meals.length}</div>
          <div>Categories: {Object.keys(groupedMeals).join(', ')}</div>
          <button 
            onClick={() => console.log('Meals data:', meals)}
            className="mt-2 text-blue-300 hover:text-blue-100"
          >
            Console Log Data
          </button>
        </div>
      )}
    </div>
  );
};

export default TodayMenu;