import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { getMealPlans } from '../services/api';

// ── Scroll reveal hook ────────────────────────────────────────────────────────
const useScrollReveal = (threshold = 0.1) => {
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

const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded-2xl animate-pulse ${className}`} />
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPlanEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('full'))      return '🌟';
  if (n.includes('breakfast')) return '🌅';
  if (n.includes('lunch'))     return '☀️';
  if (n.includes('dinner'))    return '🌙';
  return '🍱';
};

const getPlanFeatures = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('full'))      return ['Breakfast + Lunch + Dinner', 'All-day coverage', 'Best value plan', 'Priority delivery'];
  if (n.includes('breakfast')) return ['Morning meal by 8 AM', 'Light & nutritious', 'Perfect energy start', 'Fresh daily'];
  if (n.includes('lunch'))     return ['Midday meal by 12 PM', '2 main courses', 'Rice & chapati included', 'Most popular'];
  if (n.includes('dinner'))    return ['Evening meal by 7 PM', 'Light & wholesome', 'Great for families', 'Fresh daily'];
  return ['Fresh ingredients', 'Daily delivery', 'Chef crafted', 'No preservatives'];
};

const isPopular = (name = '') => name.toLowerCase().includes('full');

// ── Component ─────────────────────────────────────────────────────────────────
const MealPlans = () => {
  const { user } = useAuth();

  const [plans, setPlans]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [billing, setBilling]         = useState('monthly');

  const [plansRef, plansVisible] = useScrollReveal();
  const [tableRef, tableVisible] = useScrollReveal();
  const [ctaRef,   ctaVisible]   = useScrollReveal();

  useEffect(() => {
    getMealPlans()
      .then(d => setPlans(Array.isArray(d) ? d : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Full Day'];

  const filtered = plans.filter(p =>
    activeFilter === 'All' || p.plan_name?.toLowerCase().includes(activeFilter.toLowerCase())
  );

  const getPrice = (plan) => {
    if (billing === 'weekly') return plan.price_per_week;
    if (billing === 'daily')  return plan.price_per_day;
    return plan.price_per_month;
  };

  const priceSuffix = billing === 'weekly' ? '/week' : billing === 'daily' ? '/day' : '/month';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════ HERO ══ */}
      <section className="bg-gradient-to-br from-white via-rose-50 to-red-50 py-8 pt-18">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
             style={{ animation: 'fadeUp .6s ease-out both' }}>
          <p className="text-red-600 font-semibold text-xs uppercase tracking-widest mb-4">
            Our Plans
          </p>
          <h1 className="text-5xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
            Choose your perfect{' '}
            <span className="text-red-600">meal plan</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">
            From light breakfasts to complete day plans — fresh, chef-crafted, delivered daily.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════ STICKY FILTER + BILLING ══ */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4
                        flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                            transition-all duration-200 active:scale-95 flex-shrink-0
                            ${activeFilter === f
                              ? 'bg-red-600 text-white shadow-md shadow-red-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Billing toggle */}
          <div className="flex-shrink-0 flex items-center bg-gray-100 rounded-full p-1 gap-0.5">
            {['daily', 'weekly', 'monthly'].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize
                            transition-all duration-200
                            ${billing === b
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ PLAN CARDS ══ */}
      <section ref={plansRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <div className="h-1.5 bg-gray-100" />
                  <div className="p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="space-y-2 pt-2">
                      {[1,2,3,4].map(j => <Skeleton key={j} className="h-3 w-4/5" />)}
                    </div>
                    <Skeleton className="h-12 w-full mt-4 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-400 font-medium text-lg">No plans match this filter.</p>
              <button onClick={() => setActiveFilter('All')}
                className="mt-5 px-6 py-2.5 bg-red-50 text-red-600 rounded-full font-semibold
                           hover:bg-red-100 transition-colors duration-200 active:scale-95">
                Show all plans
              </button>
            </div>
          ) : (
            <div className={`grid gap-8 ${
              filtered.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
              filtered.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
              filtered.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {filtered.map((plan, i) => {
                const popular = isPopular(plan.plan_name);
                return (
                  <div key={plan.plan_id}
                       className={`relative flex flex-col bg-white rounded-3xl border-2
                                   transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl
                                   overflow-hidden
                                   ${popular
                                     ? 'border-red-500 shadow-xl shadow-red-100'
                                     : 'border-gray-100 hover:border-red-100'}
                                   ${plansVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                       style={{ transitionDelay: `${i * 80}ms` }}>

                    {/* popular badge */}
                    {popular && (
                      <span className="absolute -top-px left-0 right-0 text-center
                                       bg-red-600 text-white text-[11px] font-bold py-1.5 tracking-wide">
                        ⭐ MOST POPULAR
                      </span>
                    )}

                    {/* top accent line */}
                    <div className={`h-1.5 flex-shrink-0 mt-${popular ? '7' : '0'}
                                     ${popular ? 'bg-red-600' : 'bg-gray-100'}`} />

                    <div className="p-8 flex flex-col flex-1">
                      {/* icon + name */}
                      <div className="flex items-start gap-3 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                                         text-2xl flex-shrink-0
                                         ${popular ? 'bg-red-50' : 'bg-gray-50'}`}>
                          {getPlanEmoji(plan.plan_name)}
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                            {plan.plan_name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">
                            {plan.subscription_type || 'Monthly'} subscription
                          </p>
                        </div>
                      </div>

                      {/* price */}
                      <div className="mb-5">
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-extrabold text-gray-900">
                            Rs{getPrice(plan) ?? '—'}
                          </span>
                          <span className="text-gray-400 text-sm mb-1">{priceSuffix}</span>
                        </div>
                        {billing !== 'monthly' && plan.price_per_month && (
                          <p className="text-xs text-gray-400 mt-1">
                            Rs{plan.price_per_month}/month
                          </p>
                        )}
                      </div>

                      {/* description */}
                      <p className="text-sm text-gray-500 leading-relaxed mb-6 min-h-[40px]">
                        {plan.description || 'Fresh, chef-crafted meals delivered daily to your door.'}
                      </p>

                      {/* features */}
                      <ul className="space-y-2.5 mb-8 flex-1">
                        {getPlanFeatures(plan.plan_name).map((feat, fi) => (
                          <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-600">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full
                                             flex items-center justify-center text-[10px] font-bold
                                             ${popular
                                               ? 'bg-red-100 text-red-600'
                                               : 'bg-gray-100 text-gray-500'}`}>
                              ✓
                            </span>
                            {feat}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link to={user ? `/subscribe/${plan.plan_id}` : '/login'}
                        className={`block w-full text-center py-3.5 rounded-full
                                    font-bold text-sm transition-all duration-200 active:scale-95
                                    ${popular
                                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                                      : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                        {user ? 'Subscribe Now' : 'Login to Subscribe'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════ COMPARISON TABLE ══ */}
      <section ref={tableRef} className="py-16 bg-gray-50">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                         transition-all duration-700
                         ${tableVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <p className="text-red-600 font-semibold text-xs uppercase tracking-widest mb-3">Compare</p>
            <h2 className="text-3xl font-extrabold text-gray-900">What's included in each plan</h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-8 py-5 font-bold text-gray-900 text-base w-1/3">
                    Feature
                  </th>
                  {['Breakfast', 'Lunch', 'Dinner', 'Full Day'].map(h => (
                    <th key={h} className={`px-6 py-5 font-bold text-center
                                            ${h === 'Full Day' ? 'text-red-600' : 'text-gray-700'}`}>
                      {h}
                      {h === 'Full Day' && (
                        <span className="block text-[10px] font-semibold text-red-400 mt-0.5">
                          Best Value
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Morning meal (by 8 AM)',    true,  false, false, true ],
                  ['Afternoon meal (by 12 PM)', false, true,  false, true ],
                  ['Evening meal (by 7 PM)',    false, false, true,  true ],
                  ['Daily fresh delivery',      true,  true,  true,  true ],
                  ['Chef crafted recipes',      true,  true,  true,  true ],
                  ['Local fresh ingredients',   true,  true,  true,  true ],
                  ['Customisable requests',     false, true,  true,  true ],
                ].map(([label, ...vals]) => (
                  <tr key={label} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-8 py-4 text-gray-600 font-medium">{label}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} className="px-6 py-4 text-center">
                        {v
                          ? <span className="inline-flex items-center justify-center
                                             w-6 h-6 bg-green-100 text-green-600
                                             rounded-full text-xs font-bold">✓</span>
                          : <span className="inline-flex items-center justify-center
                                             w-6 h-6 bg-gray-100 text-gray-300
                                             rounded-full text-xs">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ BOTTOM CTA ══ */}
      <section ref={ctaRef} className="py-24 bg-white">
        <div className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center
                         transition-all duration-700
                         ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-5xl mb-6">🤔</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Not sure which plan to pick?
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed max-w-lg mx-auto">
            Start with our <strong className="text-gray-900">Lunch Plan</strong> — our most popular
            starter. You can always upgrade or switch later at no extra cost.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/menu"
              className="px-7 py-3.5 bg-red-50 text-red-600 font-bold rounded-full
                         hover:bg-red-100 active:scale-95 transition-all duration-200">
              Browse Today's Menu First
            </Link>
            <Link to={user ? '/dashboard' : '/register'}
              className="px-7 py-3.5 bg-red-600 text-white font-bold rounded-full
                         hover:bg-red-700 active:scale-95 transition-all duration-200
                         shadow-lg shadow-red-200">
              {user ? 'Go to Dashboard →' : 'Get Started →'}
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MealPlans;