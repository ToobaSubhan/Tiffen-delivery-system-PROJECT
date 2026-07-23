import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import {
  getUserPayments,
  getAdminPayments,
  updatePaymentStatus as apiUpdatePaymentStatus,
  completePayment as apiCompletePayment,
  payPayment as apiPayPayment,
  sendClientLog
} from '../../services/api';

const Payments = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, failed
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    filterPayments();
  }, [payments, filter]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Log start
      try { sendClientLog({ type: 'payments_load_start', message: 'Loading payments', meta: { isAdmin } }).catch?.(() => {}); } catch(e) { /* ignore */ }

      const data = isAdmin ? await getAdminPayments() : await getUserPayments();
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      setPayments(list);

      // Log success
      try { sendClientLog({ type: 'payments_load_success', message: 'Loaded payments', meta: { count: list.length } }).catch?.(() => {}); } catch(e) { /* ignore */ }

      if (!list.length) console.info('Payments: empty list returned', data);
    } catch (err) {
      console.error('Load payments error:', err);
      // Log error
      try { sendClientLog({ type: 'payments_load_error', message: err?.message || String(err), meta: {} }).catch?.(() => {}); } catch(e) { /* ignore */ }
      showToast(`Failed to load payments: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    if (filter === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(p => p.status === filter));
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      // Log intent
      try { sendClientLog({ type: 'update_status_start', message: 'Updating payment status', meta: { paymentId, newStatus } }).catch?.(() => {}); } catch(e) {}

      if (newStatus === 'completed') {
        // Admin completes using dedicated endpoint
        await apiCompletePayment(paymentId);
      } else {
        await apiUpdatePaymentStatus(paymentId, newStatus);
      }

      // Update local state without full reload
      setPayments(prev => prev.map(p => p.payment_id === paymentId ? { ...p, status: newStatus, paid_at: newStatus === 'completed' ? new Date().toISOString() : p.paid_at } : p));
      // Notify dashboard in case it needs to refresh pending count
      if (newStatus === 'completed') {
        try { window.dispatchEvent(new CustomEvent('paymentsUpdated', { detail: { paymentId } })); } catch (e) { /* ignore */ }
      }

      try { sendClientLog({ type: 'update_status_success', message: 'Payment status updated', meta: { paymentId, newStatus } }).catch?.(() => {}); } catch(e) {}

      showToast('Payment status updated successfully!', 'success');
    } catch (err) {
      console.error('Update payment status error:', err);
      try { sendClientLog({ type: 'update_status_error', message: err?.message || String(err), meta: { paymentId, newStatus } }).catch?.(() => {}); } catch(e) {}
      showToast(`Failed to update payment status: ${err.message}`, 'error');
    }
  };

  const payNow = async (paymentId) => {
    try {
      // Log start
      try { sendClientLog({ type: 'pay_start', message: 'User initiated pay', meta: { paymentId } }).catch?.(() => {}); } catch (e) {}

      // Allow owner to pay their pending payment
      await apiPayPayment(paymentId);
      setPayments(prev => prev.map(p => p.payment_id === paymentId ? { ...p, status: 'completed', paid_at: new Date().toISOString() } : p));
      // Notify other parts of the app (dashboard) that payments changed
      try { window.dispatchEvent(new CustomEvent('paymentsUpdated', { detail: { paymentId } })); } catch (e) { /* ignore */ }

      // Log success
      try { sendClientLog({ type: 'pay_success', message: 'Payment completed', meta: { paymentId } }).catch?.(() => {}); } catch (e) {}

      showToast('Payment successful!', 'success');
    } catch (err) {
      console.error('Pay now error:', err);
      try { sendClientLog({ type: 'pay_error', message: err?.message || String(err), meta: { paymentId } }).catch?.(() => {}); } catch (e) {}
      showToast(`Payment failed: ${err.message}`, 'error');
    }
  };
  const viewPaymentDetails = async (paymentId) => {
    try {
      try { sendClientLog({ type: 'view_payment', message: 'Viewing payment details', meta: { paymentId } }).catch?.(() => {}); } catch(e) {}
      // Find locally first to avoid extra fetch
      const local = payments.find(p => p.payment_id === paymentId);
      if (local) {
        setSelectedPayment(local);
        setShowModal(true);
        return;
      }

      // Fallback to fetching if not found locally
      const res = await fetch(`/api/payments/${paymentId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load payment details');
      setSelectedPayment(data.data);
      setShowModal(true);
    } catch (err) {
      console.error('View payment details error:', err);
      try { sendClientLog({ type: 'view_payment_error', message: err?.message || String(err), meta: { paymentId } }).catch?.(() => {}); } catch(e) {}
      showToast(`Failed to load payment details: ${err.message}`, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'net_banking': return '🏦';
      default: return '💰';
    }
  };

  const getSummaryStats = () => {
    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    const totalAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return { total, completed, pending, failed, totalAmount };
  };

  const stats = getSummaryStats();

  const formatDate = (d) => {
    if (!d) return 'N/A';
    const t = new Date(d);
    if (Number.isNaN(t.getTime())) return 'N/A';
    return t.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading payments...</div>
      </div>
    );
  }

  return (
    <section className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Payments Management</h2>
          <button
            onClick={() => { try { sendClientLog({ type: 'refresh_click', message: 'User clicked Refresh' }).catch?.(() => {}); } catch(e){}; loadPayments(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Payments</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">₨{stats.totalAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700">Filter by Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <div className="text-sm text-gray-500">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.payment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{payment.payment_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.customer_name || (isAdmin ? 'N/A' : 'You')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.customer_email || (isAdmin ? 'N/A' : '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.plan_name}
                        <div className="text-xs text-gray-500">
                          {payment.subscription_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₨{(parseFloat(payment.amount) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="mr-2">{getPaymentMethodIcon(payment.payment_method)}</span>
                        {(payment.payment_method || 'N/A').replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.created_at || payment.payment_date || payment.paid_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewPaymentDetails(payment.payment_id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            👁️ View
                          </button>
                          {payment.status === 'pending' && (
                            (() => {
                              // Determine ownership defensively: if payment.customer_id exists, compare; otherwise, assume non-admin view means owner
                              const isOwner = payment.customer_id ? (payment.customer_id === user?.id) : (!isAdmin);
                              if (isOwner) {
                                return (
                                  <button
                                    onClick={() => payNow(payment.payment_id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Pay Now
                                  </button>
                                );
                              }

                              if (isAdmin) {
                                return (
                                  <>
                                    <button
                                      onClick={() => updatePaymentStatus(payment.payment_id, 'completed')}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      ✅ Mark as Paid
                                    </button>
                                    <button
                                      onClick={() => updatePaymentStatus(payment.payment_id, 'failed')}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      ❌ Reject
                                    </button>
                                  </>
                                );
                              }

                              // Not owner and not admin -> no actions
                              return null;
                            })()
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Details Modal */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Payment Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Payment Information</h4>
                    <div className="space-y-2">
                      <p><strong>ID:</strong> #{selectedPayment.payment_id}</p>
                      <p><strong>Amount:</strong> ₨{(parseFloat(selectedPayment.amount) || 0).toFixed(2)}</p>
                      <p><strong>Method:</strong> {(selectedPayment.payment_method || 'N/A').replace('_', ' ').toUpperCase()}</p>
                      <p><strong>Date:</strong> {formatDate(selectedPayment.created_at || selectedPayment.payment_date || selectedPayment.paid_at)}</p>
                      <p><strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedPayment.status)}`}>
                          {selectedPayment.status?.toUpperCase()}
                        </span>
                      </p>
                      {selectedPayment.transaction_id && (
                        <p><strong>Transaction ID:</strong> {selectedPayment.transaction_id}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Customer Information</h4>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {selectedPayment.customer_name || 'N/A'}</p>
                      <p><strong>Email:</strong> {selectedPayment.customer_email || 'N/A'}</p>
                      {selectedPayment.customer_phone ? (
                        <p><strong>Phone:</strong> {selectedPayment.customer_phone}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-2">Subscription Details</h4>
                    <div className="space-y-2">
                      <p><strong>Plan:</strong> {selectedPayment.plan_name || 'N/A'}</p>
                      <p><strong>Type:</strong> {selectedPayment.subscription_type || 'N/A'}</p>
                      <p><strong>Start Date:</strong> {formatDate(selectedPayment.start_date)}</p>
                      {selectedPayment.end_date && (
                        <p><strong>End Date:</strong> {formatDate(selectedPayment.end_date)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPayment.status === 'pending' && (
                  <div className="mt-6 flex gap-4">
                    {(() => {
                      const isOwner = selectedPayment?.customer_id ? (selectedPayment.customer_id === user?.id) : (!isAdmin);
                      if (isOwner) {
                        return (
                          <button
                            onClick={() => {
                              payNow(selectedPayment.payment_id);
                              setShowModal(false);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            💳 Pay Now
                          </button>
                        );
                      }

                      if (isAdmin) {
                        return (
                          <>
                            <button
                              onClick={() => {
                                updatePaymentStatus(selectedPayment.payment_id, 'completed');
                                setShowModal(false);
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              ✅ Mark as Paid
                            </button>
                            <button
                              onClick={() => {
                                updatePaymentStatus(selectedPayment.payment_id, 'failed');
                                setShowModal(false);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              ❌ Reject Payment
                            </button>
                          </>
                        );
                      }

                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.message}
        </div>
      )}
    </section>
  );
};

export default Payments;
