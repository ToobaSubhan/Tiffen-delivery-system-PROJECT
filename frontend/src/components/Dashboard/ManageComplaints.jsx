// tiffin-frontend/src/components/Dashboard/ManageComplaints.jsx
import React, { useEffect, useState } from "react";
import { deleteFeedback, getAllFeedback } from "../../services/api";

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      const data = await getAllFeedback();
      const complaintData = Array.isArray(data) ? data.filter(f => f.rating <= 2) : [];
      setComplaints(complaintData);
      setFilteredComplaints(complaintData);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
      setFilteredComplaints([]);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete complaint?")) return;
    await deleteFeedback(id);
    load();
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    if (status === "all") {
      setFilteredComplaints(complaints);
    } else {
      // For now, all complaints are active. Could add status field later
      setFilteredComplaints(complaints);
    }
  };

  const markResolved = async (id) => {
    // For now, just show alert. Could implement status update later
    alert("Complaint marked as resolved (feature to be implemented)");
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Complaints</h2>
      <p className="text-gray-600 mb-6">Manage customer complaints and low-rated feedback</p>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="all">All Complaints</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-yellow-800 font-medium">Showing complaints with ratings 1-2 stars</span>
        </div>
      </div>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-red-600 text-white">
            <th className="p-3">User</th>
            <th className="p-3">Rating</th>
            <th className="p-3">Comment</th>
            <th className="p-3">Date</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredComplaints.map(c => (
            <tr key={c.feedback_id} className="border-b hover:bg-gray-50">
              <td className="p-3">{c.username}</td>
              <td className="p-3">
                <span className="flex items-center text-red-600 font-semibold">
                  {c.rating} ⭐
                </span>
              </td>
              <td className="p-3">{c.comment}</td>
              <td className="p-3">{new Date(c.created_at).toLocaleString()}</td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => markResolved(c.feedback_id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  Resolve
                </button>
                <button
                  onClick={() => remove(c.feedback_id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
          <p className="mt-1 text-sm text-gray-500">Great! No low-rated feedback at this time.</p>
        </div>
      )}
    </div>
  );
}
