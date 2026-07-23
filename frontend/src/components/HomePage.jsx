import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { getMealPlans, getTodayMeals } from '../services/api';

// ── Reusable scroll-reveal hook ──────────────────────────────────────────────
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

const revealClass = (visible, delay = 0) =>
  `transition-all duration-700 ease-out ${delay ? `delay-[${delay}ms]` : ''} ${
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
  }`;

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded-2xl animate-pulse ${className}`} />
);

// ── Main component ────────────────────────────────────────────────────────────
const HomePage = () => {
  const { user } = useAuth();

  const [plans, setPlans]           = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);
  const [plansLoading, setPlansLoading]   = useState(true);
  const [mealsLoading, setMealsLoading]   = useState(true);

  useEffect(() => {
    getMealPlans()
      .then(d => setPlans(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));

    getTodayMeals()
      .then(d => {
        const arr = Array.isArray(d) ? d : d?.meals ?? d?.data ?? d?.items ?? [];
        setTodayMeals(arr.slice(0, 3));
      })
      .catch(() => setTodayMeals([]))
      .finally(() => setMealsLoading(false));
  }, []);

  const [featRef, featVisible]   = useScrollReveal();
  const [plansRef, plansVisible] = useScrollReveal();
  const [menuRef, menuVisible]   = useScrollReveal();
  const [stepsRef, stepsVisible] = useScrollReveal();
  const [ctaRef, ctaVisible]     = useScrollReveal();

  // ── Data ──────────────────────────────────────────────────────────────────
  const features = [
    { icon: '🥗', title: 'Fresh Ingredients',  desc: 'Sourced daily from local farms for maximum nutrition and flavour.' },
    { icon: '👨‍🍳', title: 'Chef Crafted',       desc: 'Every meal prepared by experienced chefs using homemade recipes.' },
    { icon: '🚚', title: 'On-Time Delivery',   desc: 'Reliable delivery at your doorstep by 8 AM every morning.' },
    { icon: '💸', title: 'Affordable Plans',   desc: 'Quality meals that fit your budget, starting at ₹999/month.' },
  ];

  const steps = [
    { n: '01', title: 'Choose Your Plan',  desc: 'Browse plans and pick the one that fits your lifestyle.' },
    { n: '02', title: 'Set Start Date',    desc: 'Pick a convenient start date for your subscription.' },
    { n: '03', title: 'We Cook & Pack',    desc: 'Our chefs prepare your fresh meal with care every day.' },
    { n: '04', title: 'Get It Delivered',  desc: 'Your meal arrives fresh at your door every morning.' },
  ];

  const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=70';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════ HERO ══ */}
      <section className="min-h-screen bg-gradient-to-br from-white via-rose-50 to-red-50 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24
                        grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Text ── */}
          <div style={{ animation: 'fadeUp .6s ease-out both' }}>
            <span className="inline-flex items-center gap-2 px-4 py-2
                             bg-white border border-red-100 text-red-600
                             text-sm font-semibold rounded-full mb-8 shadow-sm">
              🍱 Fresh • Homemade • Daily
            </span>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
              Healthy meals
              <br />that feel{' '}
              <span className="text-red-600 relative inline-block">
                effortless
                {/* hand-drawn underline */}
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 220 6" fill="none">
                  <path d="M2 4 Q55 0 110 3.5 Q165 7 218 2"
                        stroke="#DC2626" strokeWidth="3"
                        fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
              Subscribe to chef-crafted tiffin meals delivered fresh to your door, every single day.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/plans"
                className="px-7 py-3.5 bg-red-600 text-white font-semibold rounded-full
                           hover:bg-red-700 active:scale-95 transition-all duration-200
                           shadow-lg shadow-red-200 hover:shadow-xl">
                Browse Meal Plans
              </Link>

              <Link to="/menu"
                className="px-7 py-3.5 bg-white text-red-600 font-semibold rounded-full
                           border-2 border-red-100 hover:border-red-300
                           active:scale-95 transition-all duration-200">
                Today's Menu →
              </Link>

              {user && (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="px-7 py-3.5 bg-gray-900 text-white font-semibold rounded-full
                             hover:bg-gray-800 active:scale-95 transition-all duration-200">
                  Dashboard →
                </Link>
              )}
            </div>
          </div>

          {/* ── Image ── */}
          <div className="relative flex justify-center lg:justify-end"
               style={{ animation: 'floatUpDown 3s ease-in-out infinite' }}>
            <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px]">
              {/* tinted background blob */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-200 to-rose-100
                              rounded-[40px] rotate-6 opacity-40" />
              {/* main image card */}
              <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
                     alt="Fresh bowl meal"
                     className="w-full h-full object-cover" />
              </div>
              {/* floating badge — top right */}
              <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl px-4 py-3
                              flex items-center gap-2.5">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Rating</p>
                  <p className="text-sm font-extrabold text-gray-900">4.9 / 5</p>
                </div>
              </div>
              {/* floating badge — bottom left */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-4 py-3
                              flex items-center gap-2.5">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Delivery</p>
                  <p className="text-sm font-extrabold text-gray-900">By 8 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ WHY CHOOSE US ══ */}
      <section ref={featRef} className="py-24 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${revealClass(featVisible)}`}>
          <div className="text-center mb-16">
            <p className="text-red-600 font-semibold text-xs uppercase tracking-widest mb-3">Why Us</p>
            <h2 className="text-4xl font-extrabold text-gray-900">
              Crafted with care,{' '}
              <span className="text-red-600">delivered with love</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i}
                   className="group p-8 bg-white rounded-3xl border border-gray-100
                              hover:border-red-100 hover:shadow-2xl hover:-translate-y-2
                              transition-all duration-300 cursor-default"
                   style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2
                               group-hover:text-red-600 transition-colors duration-200">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ MEAL PLANS SECTION ══ */}
      <section ref={plansRef} className="py-24 bg-gray-50">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${revealClass(plansVisible)}`}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-4">
            <div>
              <p className="text-red-600 font-semibold text-xs uppercase tracking-widest mb-3">Plans</p>
              <h2 className="text-4xl font-extrabold text-gray-900">
                Choose your perfect{' '}
                <span className="text-red-600">meal plan</span>
              </h2>
            </div>
            <Link to="/plans"
              className="text-sm font-semibold text-red-600 hover:text-red-700
                         transition-colors duration-200 whitespace-nowrap flex items-center gap-1">
              View all plans →
            </Link>
          </div>

          {plansLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-3xl p-8 space-y-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-12 w-full mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div key={plan.plan_id}
                     className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300
                                 hover:-translate-y-2 hover:shadow-2xl
                                 ${i === 1
                                   ? 'border-red-500 shadow-xl shadow-red-100'
                                   : 'border-gray-100 hover:border-red-100'}`}>
                  {i === 1 && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2
                                     bg-red-600 text-white text-xs font-bold
                                     px-5 py-1.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.plan_name}</h3>
                  <p className="text-sm text-gray-400 mb-6 min-h-[40px]">
                    {plan.description || 'Fresh meals delivered daily.'}
                  </p>
                  <div className="mb-8">
                    <span className="text-4xl font-extrabold text-gray-900">Rs{plan.price_per_month}</span>
                    <span className="text-gray-400 text-sm"> /month</span>
                  </div>
                  <Link to={`/subscribe/${plan.plan_id}`}
                    className={`block w-full text-center py-3.5 rounded-full font-semibold
                                transition-all duration-200 active:scale-95
                                ${i === 1
                                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    Subscribe Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════ TODAY'S MENU PREVIEW ══ */}
      <section ref={menuRef} className="py-24 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${revealClass(menuVisible)}`}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-4">
            <div>
              <p className="text-red-600 font-semibold text-xs uppercase tracking-widest mb-3">Menu</p>
              <h2 className="text-4xl font-extrabold text-gray-900">
                What's on the menu{' '}
                <span className="text-red-600">today</span>
              </h2>
            </div>
            <Link to="/menu"
              className="text-sm font-semibold text-red-600 hover:text-red-700
                         transition-colors duration-200 whitespace-nowrap">
              View full menu →
            </Link>
          </div>

          {mealsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-3xl overflow-hidden border border-gray-100">
                  <Skeleton className="h-52 rounded-none" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : todayMeals.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🍽️</p>
              <p className="text-gray-400 font-medium">Today's menu will be available soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {todayMeals.map((meal, i) => (
                <div key={i}
                     className="group bg-white rounded-3xl overflow-hidden border border-gray-100
                                hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img
                      src={meal.image_url || meal.image || fallbackImg}
                      alt={meal.item_name || meal.meal_name || 'Meal'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = fallbackImg; }}
                    />
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm
                                     text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
                      {meal.category || meal.meal_type || 'Meal'}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {meal.item_name || meal.meal_name || 'Meal'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {meal.description || ''}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">🔥 {meal.calories || '—'} cal</span>
                      <span className="text-base font-bold text-red-600">Rs{meal.price || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ HOW IT WORKS ══ */}
      <section ref={stepsRef} className="py-24 bg-gray-50">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${revealClass(stepsVisible)}`}>
          <div className="text-center mb-16">
            <p className="text-red-600 font-semibold text-xs uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl font-extrabold text-gray-900">
              How it <span className="text-red-600">works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
            {/* connector line — large screens only */}
            <div className="hidden lg:block absolute top-8 left-[13%] right-[13%]
                            h-px bg-red-100 z-0" />

            {steps.map((s, i) => (
              <div key={i}
                   className="relative z-10 flex flex-col items-center text-center"
                   style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-16 h-16 bg-red-600 text-white rounded-2xl
                                flex items-center justify-center text-xl font-extrabold
                                mb-6 shadow-lg shadow-red-200">
                  {s.n}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ FINAL CTA ══ */}
      <section ref={ctaRef} className="py-24 bg-white">
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${revealClass(ctaVisible)}`}>
          <div className="bg-gradient-to-br from-red-600 to-red-700
                          rounded-[40px] p-14 sm:p-20 text-center text-white
                          shadow-2xl shadow-red-200">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Start eating better <br />
              <span className="text-red-200">today.</span>
            </h2>
            <p className="text-red-100 text-lg mb-10 max-w-md mx-auto">
              Join thousands of happy customers enjoying fresh, homemade tiffin meals every day.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/plans"
                className="px-8 py-4 bg-white text-red-600 font-bold rounded-full
                           hover:bg-red-50 active:scale-95 transition-all duration-200 shadow-lg">
                Browse Plans
              </Link>
              <Link to="/register"
                className="px-8 py-4 bg-red-500 text-white font-bold rounded-full
                           border-2 border-red-400 hover:bg-red-400
                           active:scale-95 transition-all duration-200">
                Create Account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FOOTER ══ */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-2xl font-extrabold text-white">
            Fresh<span className="text-red-500">Meal</span>
          </span>
          <div className="flex items-center gap-8">
            {[['/', 'Home'], ['/plans', 'Meal Plans'], ['/menu', 'Menu'], ['/register', 'Sign Up']].map(([to, label]) => (
              <Link key={to} to={to}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                {label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-gray-600">© 2025 FreshMeal.</p>
        </div>
      </footer>

      {/* ── Global keyframes (injected once) ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;