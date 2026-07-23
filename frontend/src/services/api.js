const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const request = async (url, method = "GET", body = null, auth = false, isForm = false) => {
  const headers = {};

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isForm) headers["Content-Type"] = "application/json";

  const options = { method, headers };

  if (body) options.body = isForm ? body : JSON.stringify(body);

  const response = await fetch(`${API_BASE}${url}`, options);

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  if (response.status === 204) return {};

  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) throw new Error("Something went wrong. Please try again.");
    return {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const getAdminAnalytics = () => request("/admin-analytics", "GET", null, true);
export const getUserDashboardStats = () =>request("/admin-analytics/user-dashboard", "GET", null, true);
export const getWeeklyMenu = () => request("/weekly-menu/public", "GET");

export const loginUser = (credentials) => request("/login", "POST", credentials);
export const registerUser = (userData) => request("/register", "POST", userData);

export const getMealPlans = () => request("/meal-plans", "GET");

export const createSubscription = (planId, startDate) =>
  request("/subscriptions", "POST", { plan_id: planId, start_date: startDate }, true);
export const getUserSubscriptions = () => request("/subscriptions", "GET", null, true);

export const getUserDeliveries = () => request("/deliveries/user", "GET", null, true);

export const submitFeedback = (rating, comment) => request("/feedback", "POST", { rating, comment }, true);
export const getAllFeedback = () => request("/feedback", "GET", null, true);
export const deleteFeedback = (feedbackId) => request(`/feedback/${feedbackId}`, "DELETE", null, true);

export const getTodayMeals = () => request("/menu/today", "GET");

export const getAllMenuItems = () => request("/menu-admin/items", "GET", null, true);
export const addMenuItem = (itemData) => request("/menu-admin/items", "POST", itemData, true);
export const getTodayMenuAdmin = () => request("/menu-admin/today", "GET", null, true);
export const addItemToTodayMenu = (data) => request("/menu-admin/add", "POST", data, true);
export const removeItemFromTodayMenu = (dailyMenuId) => request(`/menu-admin/remove/${dailyMenuId}`, "DELETE", null, true);
export const updateMenuItemQuantity = (dailyMenuId, data) => request(`/menu-admin/update-quantity/${dailyMenuId}`, "PUT", data, true);

export const uploadMenuItemImage = (itemId, file) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("item_id", itemId);
  return request("/menu-admin/upload-image", "POST", formData, true, true);
};

// Payments API
export const createPayment = (subscriptionId, amount, method) =>
  request("/payments", "POST", { subscription_id: subscriptionId, amount, payment_method: method }, true);
export const getUserPayments = () => request("/payments/user", "GET", null, true);
export const getAdminPayments = () => request("/payments/admin", "GET", null, true);
export const completePayment = (paymentId) => request(`/payments/${paymentId}/complete`, "PUT", null, true);
export const payPayment = (paymentId) => request(`/payments/${paymentId}/pay`, "POST", null, true);
export const updatePaymentStatus = (paymentId, status) => request(`/payments/${paymentId}/status`, "PUT", { status }, true);

// Client-side logging (sends small structured logs to the backend for debugging)
export const sendClientLog = (payload) => request('/logs', 'POST', payload, true);
export const getAdminDashboardData = () => request("/admin-analytics", "GET", null, true);
export const getAdminRecentOrders = (limit = 5) => request(`/admin-analytics/recent-orders?limit=${limit}`, "GET", null, true);
export const getAdminSubscriptionStats = () => request("/admin-analytics/subscription-stats", "GET", null, true);

export const addMealPlan = (planData) => request("/meal-plans", "POST", planData, true);
export const updateMealPlan = (planId, planData) => request(`/meal-plans/${planId}`, "PUT", planData, true);
export const deleteMealPlan = (planId) => request(`/meal-plans/${planId}`, "DELETE", null, true);

export const getAllUsers = () => request("/users", "GET", null, true);
export const updateUser = (userId, userData) => request(`/users/${userId}`, "PUT", userData, true);
export const deleteUser = (userId) => request(`/users/${userId}`, "DELETE", null, true);

export const getAllDeliveries = () => request("/deliveries", "GET", null, true);
export const updateDeliveryStatus = (deliveryId, status) => request(`/deliveries/${deliveryId}`, "PUT", { status }, true);

// Rider live location
export const submitRiderLocationUpdate = (riderId, latitude, longitude) =>
  request(`/rider-locations/update`, "POST", { rider_id: riderId, latitude, longitude }, false);

export const getRiderLiveLocation = (riderId) =>
  request(`/rider-locations/${riderId}`, "GET", null, true);



