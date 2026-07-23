// tiffin-frontend/src/components/Dashboard/AdminDashboard.jsx - UPDATED COMPLETE VERSION
// tiffin-frontend/src/components/Dashboard/AdminDashboard.jsx - UPDATED
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAdminAnalytics, 
  getAdminRecentOrders, 
  getAdminSubscriptionStats 
} from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    weeklyActive: 0,
    activeRiders: 0,
    topItems: [],
    growth: { current: 0, previous: 0, growth_percentage: 0 }
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [analyticsData, recentOrdersData, subscriptionData] = await Promise.all([
          getAdminAnalytics(),
          getAdminRecentOrders(5),
          getAdminSubscriptionStats()
        ]);
        
        console.log('Dashboard response:', {
          analytics: analyticsData,
          orders: recentOrdersData,
          subs: subscriptionData
        });
        
        // Check if data structure is correct
        if (analyticsData && analyticsData.success) {
          setStats({
            orders: analyticsData.data?.orders || 0,
            revenue: analyticsData.data?.revenue || 0,
            totalUsers: analyticsData.data?.totalUsers || 0,
            activeSubscriptions: analyticsData.data?.activeSubscriptions || 0,
            weeklyActive: analyticsData.data?.weeklyActive || 0,
            activeRiders: analyticsData.data?.activeRiders || 0,
            topItems: analyticsData.data?.topItems || [],
            growth: analyticsData.data?.growth || { current: 0, previous: 0, growth_percentage: 0 }
          });
        } else {
          // Fallback for old API structure
          setStats({
            orders: analyticsData?.orders || 0,
            revenue: analyticsData?.revenue || 0,
            totalUsers: analyticsData?.totalUsers || 0,
            activeSubscriptions: analyticsData?.activeSubscriptions || 0,
            weeklyActive: analyticsData?.weeklyActive || 0,
            activeRiders: analyticsData?.activeRiders || 0,
            topItems: analyticsData?.topItems || [],
            growth: analyticsData?.growth || { current: 0, previous: 0, growth_percentage: 0 }
          });
        }

        // Recent orders
        if (recentOrdersData && recentOrdersData.success) {
          setRecentOrders(recentOrdersData.orders || []);
        } else {
          setRecentOrders(recentOrdersData || []);
        }

        // Subscription stats
        if (subscriptionData && subscriptionData.success) {
          setSubscriptionStats(subscriptionData.plans || []);
        } else {
          setSubscriptionStats(subscriptionData || []);
        }

        setError(null);
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
        setError(`Failed to load dashboard data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4">
          <p>⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
        
        {/* Fallback dashboard with links even if API fails */}
        <h1 className="text-3xl font-bold mb-6">Admin Control Panel</h1>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/admin/operations" className="p-4 bg-white rounded shadow hover:shadow-lg">Manage Menu Items</Link>
          <Link to="/admin/operations" className="p-4 bg-white rounded shadow hover:shadow-lg">Weekly Menu Schedule</Link>
          <Link to="/admin/operations" className="p-4 bg-white rounded shadow hover:shadow-lg">Today's Menu</Link>
          <Link to="/admin/operations" className="p-4 bg-white rounded shadow hover:shadow-lg">Meal Plans</Link>
          <Link to="/admin/users" className="p-4 bg-white rounded shadow hover:shadow-lg">Customers</Link>
          <Link to="/admin/deliveries" className="p-4 bg-white rounded shadow hover:shadow-lg">Deliveries</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Control Panel</h1>

      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Orders (30d)</div>
          <div className="text-2xl font-bold mt-1">{stats.orders.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center">
            <span className={`mr-1 ${stats.growth.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.growth.growth_percentage >= 0 ? '↗' : '↘'}
            </span>
            {stats.growth.growth_percentage >= 0 ? '+' : ''}{stats.growth.growth_percentage}%
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Revenue (30d)</div>
          <div className="text-2xl font-bold mt-1">Rs{stats.revenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Total revenue</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="text-2xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Registered</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Active Subs</div>
          <div className="text-2xl font-bold mt-1">{stats.activeSubscriptions.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Active subscriptions</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Active Riders</div>
          <div className="text-2xl font-bold mt-1">{stats.activeRiders.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Delivery riders</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Weekly Menus</div>
          <div className="text-2xl font-bold mt-1">{stats.weeklyActive.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Active schedules</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2">
          {/* Recent Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/admin/orders" className="text-sm text-red-600 hover:text-red-800">
                View All →
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.order_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">#{order.order_id}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-sm">{order.customer_name}</div>
                            <div className="text-xs text-gray-500">{order.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{order.order_date}</td>
                        <td className="py-3 px-4 font-medium text-sm">Rs{order.total_amount}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent orders found
              </div>
            )}
          </div>

          {/* Top Ordered Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items (Last 30 Days)</h3>
            
            {stats.topItems.length > 0 ? (
              <div className="space-y-3">
                {stats.topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-3 w-6 text-center">#{index + 1}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                        <p className="text-sm text-gray-600">{item.count} orders</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-500">No order data available for the last 30 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div>
          {/* Subscription Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
            
            {subscriptionStats.length > 0 ? (
              <div className="space-y-4">
                {subscriptionStats.map((plan) => (
                  <div key={plan.plan_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{plan.plan_name}</span>
                      <span>{plan.active_count} subs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(plan.active_count / stats.activeSubscriptions) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Rs{plan.price}/month • Rs{plan.monthly_revenue} revenue
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Active</span>
                    <span>{stats.activeSubscriptions}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No subscription data available
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.growth.growth_percentage >= 0 ? '+' : ''}{stats.growth.growth_percentage}%
                </div>
                <div className="text-sm text-gray-600">Order Growth</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.orders > 0 ? (stats.revenue / stats.orders).toFixed(0) : 0}
                </div>
                <div className="text-sm text-gray-600">Avg. Order Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN LINKS GRID - KEEP ALL YOUR PAGES */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
<Link to="/admin/operations" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
  <div className="flex items-center">
    <div className="p-2 bg-red-100 rounded-lg mr-4">
      <span className="text-red-600 text-xl">🍽️</span>
    </div>
    <div>
      <h3 className="font-semibold text-gray-900">Menu & Plans</h3>
      <p className="text-sm text-gray-600 mt-1">Menu items, today's menu, weekly schedule & meal plans</p>
    </div>
  </div>
</Link>

        {/* Orders & Deliveries */}
        <Link to="/admin/deliveries" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <span className="text-yellow-600">📦</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Orders & Deliveries</h3>
              <p className="text-sm text-gray-600 mt-1">View and manage orders/deliveries</p>
            </div>
          </div>
        </Link>

        {/* Feedback & Complaints */}
        <Link to="/admin/feedback" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg mr-4">
              <span className="text-pink-600">⭐</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Customer Feedback</h3>
              <p className="text-sm text-gray-600 mt-1">View customer feedback</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/complaints" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <span className="text-orange-600">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Complaints</h3>
              <p className="text-sm text-gray-600 mt-1">Handle customer complaints</p>
            </div>
          </div>
        </Link>

        {/* Users & Riders */}
        <Link to="/admin/users" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg mr-4">
              <span className="text-teal-600">👥</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Customers</h3>
              <p className="text-sm text-gray-600 mt-1">Manage customer accounts</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/riders" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg mr-4">
              <span className="text-cyan-600">🏍️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Riders</h3>
              <p className="text-sm text-gray-600 mt-1">Manage delivery riders</p>
            </div>
          </div>
        </Link>

        {/* Payments & Analytics */}
        <Link to="/admin/payments" className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-lime-100 rounded-lg mr-4">
              <span className="text-lime-600">💰</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payments</h3>
              <p className="text-sm text-gray-600 mt-1">View payment transactions</p>
            </div>
          </div>
        </Link>

        {/* Analytics */}
        <div className="p-6 bg-white rounded-lg shadow-sm border bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-4">
              <span className="text-gray-600">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Analytics & Reports</h3>
              <p className="text-sm text-gray-600 mt-1">You're viewing analytics now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            All Systems Operational
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium">API Status</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Backend services are running normally</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium">Database</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Connected and responding</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium">Last Updated</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;