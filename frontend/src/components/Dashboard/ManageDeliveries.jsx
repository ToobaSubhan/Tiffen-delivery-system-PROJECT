// tiffin-frontend/src/components/Dashboard/ManageDeliveries.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from '../../Context/AuthContext';
const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ManageDeliveries = () => {
  const { user, token } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");

  // Load deliveries and riders
  useEffect(() => {
    loadDeliveries();
    loadRiders();
  }, []);

  // Role-based access check
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> Admin privileges required to manage deliveries.
        </div>
      </div>
    );
  }

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load deliveries');
      }
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading deliveries:", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRiders = async () => {
    try {
      const res = await fetch(`${API}/riders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load riders');
      }
      const data = await res.json();
      setRiders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading riders:", error);
      setRiders([]);
    }
  };

  // Filter deliveries by status and search term
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesStatus = filterStatus === "all" || delivery.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = !searchTerm ||
      delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.order_id?.toString().includes(searchTerm) ||
      delivery.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Assign rider to delivery
  const assignRider = async (deliveryId, riderId) => {
    if (!riderId) {
      setAlertType('error');
      setAlertMessage('Please select a rider to assign.');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`${API}/deliveries/assign-rider`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_id: deliveryId, rider_id: riderId })
      });

      if (res.ok) {
        setAlertType('success');
        setAlertMessage('Rider assigned successfully.');
        loadDeliveries();
        setShowAssignModal(false);
        setSelectedRider("");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to assign rider');
      }
    } catch (error) {
      console.error("Error assigning rider:", error);
      setAlertType('error');
      setAlertMessage(`Error assigning rider: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Update delivery status
  const updateStatus = async (deliveryId, newStatus) => {
    try {
      setUpdating(true);
      const res = await fetch(`${API}/deliveries/update-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_id: deliveryId, status: newStatus })
      });

      if (res.ok) {
        setAlertType('success');
        setAlertMessage('Delivery status updated successfully.');
        loadDeliveries();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setAlertType('error');
      setAlertMessage(`Error updating status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "assigned": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "picked_up": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "on_way": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "assigned": return "🟡";
      case "picked_up": return "📦";
      case "on_way": return "🚚";
      case "delivered": return "✅";
      case "cancelled": return "❌";
      default: return "❓";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Deliveries</h2>
        <p className="text-gray-600">Monitor and manage all delivery operations</p>
        {alertMessage && (
          <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${alertType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {alertMessage}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">🟡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {deliveries.filter(d => d.status?.toLowerCase() === 'assigned').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🚚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">
                {deliveries.filter(d => d.status?.toLowerCase() === 'in transit').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {deliveries.filter(d => d.status?.toLowerCase() === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filterStatus === "all"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilterStatus("all")}
            >
              All ({deliveries.length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filterStatus === "assigned"
                  ? "bg-yellow-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilterStatus("assigned")}
            >
              Assigned ({deliveries.filter(d => d.status?.toLowerCase() === 'assigned').length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filterStatus === "picked_up"
                  ? "bg-indigo-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilterStatus("picked_up")}
            >
              Picked Up ({deliveries.filter(d => d.status?.toLowerCase() === 'picked_up').length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filterStatus === "on_way"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilterStatus("on_way")}
            >
              In Transit ({deliveries.filter(d => d.status?.toLowerCase() === 'on_way').length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filterStatus === "delivered"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilterStatus("delivered")}
            >
              Delivered ({deliveries.filter(d => d.status?.toLowerCase() === 'delivered').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer, order ID, or address..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Order Details</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Delivery Info</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Rider</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.delivery_id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">#{delivery.order_id}</div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(delivery.delivery_date || delivery.delivery_time)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{delivery.customer_name || "N/A"}</div>
                      <div className="text-sm text-gray-500">{delivery.customer_phone || "N/A"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900 truncate">{delivery.address || "N/A"}</div>
                      <div className="text-sm text-gray-500">
                        {delivery.delivery_time ? `Scheduled: ${formatDateTime(delivery.delivery_time)}` : "Not scheduled"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {delivery.rider_name ? (
                        <div>
                          <div className="font-medium text-gray-900">{delivery.rider_name}</div>
                          <div className="text-sm text-gray-500">{delivery.rider_phone || ""}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                        <span className="mr-1">{getStatusIcon(delivery.status)}</span>
                        {delivery.status || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowAssignModal(true);
                        }}
                        disabled={updating}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Assign Rider
                      </button>

                      <select
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                        value={delivery.status || ""}
                        onChange={(e) => updateStatus(delivery.delivery_id, e.target.value)}
                        disabled={updating}
                      >
                        <option value="assigned">Assigned</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="on_way">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowDetailsModal(true);
                        }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Try adjusting your search or filters." : "No deliveries match the selected criteria."}
          </p>
        </div>
      )}

      {/* Assign Rider Modal */}
      {showAssignModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Assign Rider</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900">Order #{selectedDelivery.order_id}</h4>
                <p className="text-sm text-gray-600">Customer: {selectedDelivery.customer_name || "N/A"}</p>
                <p className="text-sm text-gray-600">Address: {selectedDelivery.address || "N/A"}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Rider
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                >
                  <option value="">Choose a rider...</option>
                  {riders.map((rider) => (
                    <option key={rider.rider_id} value={rider.rider_id}>
                      {`${rider.first_name || ''} ${rider.last_name || ''}`.trim() || 'Unnamed Rider'} - {rider.phone || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignRider(selectedDelivery.delivery_id, selectedRider)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 disabled:opacity-50"
                  disabled={updating || !selectedRider}
                >
                  {updating ? "Assigning..." : "Assign Rider"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Order ID:</span>
                  <span className="ml-2 text-gray-900">#{selectedDelivery.order_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <span className="ml-2 text-gray-900">{selectedDelivery.customer_name || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-900">{selectedDelivery.customer_phone || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <span className="ml-2 text-gray-900">{selectedDelivery.address || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rider:</span>
                  <span className="ml-2 text-gray-900">{selectedDelivery.rider_name || "Not assigned"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedDelivery.status)}`}>
                    {getStatusIcon(selectedDelivery.status)} {selectedDelivery.status || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Delivery Date:</span>
                  <span className="ml-2 text-gray-900">{formatDateTime(selectedDelivery.delivery_date || selectedDelivery.delivery_time)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Delivery Time:</span>
                  <span className="ml-2 text-gray-900">{formatDateTime(selectedDelivery.delivery_time)}</span>
                </div>
                {selectedDelivery.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Notes:</span>
                    <span className="ml-2 text-gray-900">{selectedDelivery.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDeliveries;
