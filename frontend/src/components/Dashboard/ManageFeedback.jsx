// tiffin-frontend/src/components/Dashboard/ManageFeedback.jsx
import React, { useEffect, useState } from "react";
import { deleteFeedback, getAllFeedback } from "../../services/api";

export default function ManageFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("all");

  const load = async () => {
    try {
      const data = await getAllFeedback();
      const feedbackList = Array.isArray(data) ? data : [];
      setFeedback(feedbackList);
      setFilteredFeedback(feedbackList);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setFeedback([]);
      setFilteredFeedback([]);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete feedback?")) return;
    await deleteFeedback(id);
    load();
  };

  const handleRatingFilter = (rating) => {
    setRatingFilter(rating);
    if (rating === "all") {
      setFilteredFeedback(feedback);
    } else {
      setFilteredFeedback(feedback.filter(f => f.rating === parseInt(rating)));
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Feedback</h2>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Filter by Rating:</label>
        <select
          value={ratingFilter}
          onChange={(e) => handleRatingFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
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
          {filteredFeedback.map(f => (
            <tr key={f.feedback_id} className="border-b hover:bg-gray-50">
              <td className="p-3">{f.username}</td>
              <td className="p-3">
                <span className="flex items-center">
                  {f.rating} ⭐
                </span>
              </td>
              <td className="p-3">{f.comment}</td>
              <td className="p-3">{new Date(f.created_at).toLocaleString()}</td>
              <td className="p-3">
                <button
                  onClick={() => remove(f.feedback_id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition duration-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredFeedback.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No feedback found.</p>
      )}
    </div>
  );
}
