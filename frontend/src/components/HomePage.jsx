import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { getMealPlans, getTodayMeals } from '../services/api';

const BACKEND = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [mealPlans, setMealPlans]   = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(true);

  useEffect(() => {
    getMealPlans()
      .then(d => setMealPlans((Array.isArray(d) ? d : []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoadingPlans(false));

    getTodayMeals()
      .then(d => setTodayMeals(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => {})
      .finally(() => setLoadingMeals(false));
  }, []);

  const imgSrc = (meal) => {
    const raw = meal.image_url || meal.image || '';
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${BACKEND}${raw}`;
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500 text-white">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-white/10 rounded-full" />

        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-full mb-6 tracking-wide">
            🍱 Fresh • Homemade • Daily
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 drop-shadow-md">
            Meals That Feel<br />
            <span className="text-yellow-300">Like Home</span>
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10">
            Subscribe to nutritious, chef-crafted tiffin meals delivered hot to your door — every single day.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/plans"
              className="bg-white text-red-600 font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all">
              Browse Meal Plans
            </Link>
            <Link to="/menu"
              className="border-2 border-white text-white font-bold px-8 py-3.5 rounded-full hover:bg-white hover:text-red-600 transition-all">
              Today's Menu
            </Link>
            {isAuthenticated && (
              <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                className="bg-yellow-400 text-red-700 font-bold px-8 py-3.5 rounded-full hover:bg-yellow-300 transition-all">
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>

        {/* wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg">
            <path fill="white" d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '500+', label: 'Happy Customers' },
            { num: '4',    label: 'Meal Plans'       },
            { num: '100%', label: 'Fresh Ingredients'},
            { num: '6 AM', label: 'Daily Delivery'   },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-red-600">{s.num}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Why Choose FreshMeal?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Everything you need for healthy daily eating — without the effort.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🥗', title: 'Healthy & Fresh',      desc: 'Organic ingredients, cooked fresh every morning.'        },
              { icon: '⚙️', title: 'Customizable Plans',   desc: 'Breakfast, lunch, dinner or full-day — your choice.'     },
              { icon: '⏰', title: 'On-time Delivery',     desc: 'Hot meals at your door before you get hungry.'           },
              { icon: '💰', title: 'Affordable Pricing',   desc: 'Restaurant quality at home-cooked prices.'               },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 transition-all text-center group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEAL PLANS ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Popular Meal Plans</h2>
            <p className="text-gray-500 mt-3">Pick a plan that fits your lifestyle and budget.</p>
          </div>
          {loadingPlans ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mealPlans.map((plan, i) => (
                <div key={plan.plan_id || i}
                  className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                  {i === 0 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="text-3xl mb-3">
                    {['🍱','🌙','🌅','🍽️'][i] || '🍱'}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.plan_name}</h3>
                  <div className="text-2xl font-extrabold text-red-600 mb-2">
                    Rs{plan.price_per_month}
                    <span className="text-sm font-normal text-gray-400">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 flex-1 mb-4">{plan.description}</p>
                  <div className="flex gap-2 text-xs text-gray-400 mb-4">
                    {plan.meals_per_day && <span>🍽️ {plan.meals_per_day} meals/day</span>}
                    {plan.subscription_type && <span>📅 {plan.subscription_type}</span>}
                  </div>
                  <Link to={`/subscribe/${plan.plan_id}`}
                    className="mt-auto block text-center bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition">
                    Subscribe Now
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link to="/plans" className="text-red-600 font-semibold hover:underline">
              View all plans →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TODAY'S MENU PREVIEW ─────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Today's Menu Preview</h2>
            <p className="text-gray-500 mt-3">See what's being cooked fresh for today.</p>
          </div>
          {loadingMeals ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
            </div>
          ) : todayMeals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🍽️</div>
              <p>No meals added for today yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {todayMeals.map((meal, i) => (
                <div key={meal.daily_menu_id || i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all group">
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    {imgSrc(meal) ? (
                      <img src={imgSrc(meal)} alt={meal.item_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍱</div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-500">
                      {meal.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg mt-1">{meal.item_name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{meal.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-400">🔥 {meal.calories} cal</span>
                      <span className="font-bold text-red-600">Rs{meal.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link to="/menu"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition">
              View Full Menu →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-3">Get started in 3 simple steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {[
              { icon: '📋', step: '01', title: 'Choose Plan',      desc: 'Pick the meal plan that fits your routine.'       },
              { icon: '📅', step: '02', title: 'Set Start Date',   desc: 'Select when you want deliveries to begin.'        },
              { icon: '🚚', step: '03', title: 'Daily Delivery',   desc: 'Fresh meals delivered hot every morning.'         },
              { icon: '📊', step: '04', title: 'Track & Manage',   desc: 'Monitor orders and payments on your dashboard.'   },
            ].map(s => (
              <div key={s.step} className="text-center relative">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-red-400 tracking-widest mb-1">{s.step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">What Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma',  stars: 5, text: '"Amazing service! The meals are always fresh and delicious."'         },
              { name: 'Rahul Verma',   stars: 5, text: '"Convenient and affordable. Perfect for busy professionals."'          },
              { name: 'Anjali Gupta',  stars: 4, text: '"Great variety and excellent customer support. Highly recommended!"'   },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < t.stars ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-orange-500 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Eat Better?</h2>
          <p className="text-white/85 text-lg mb-8">
            Join hundreds of happy customers. Subscribe today and get fresh meals every day.
          </p>
          {isAuthenticated ? (
            <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}
              className="bg-white text-red-600 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition shadow-lg">
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/plans"
                className="bg-white text-red-600 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition shadow-lg">
                Browse Plans
              </Link>
              <Link to="/register"
                className="border-2 border-white text-white font-bold px-10 py-4 rounded-full hover:bg-white hover:text-red-600 transition">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default HomePage;