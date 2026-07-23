import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 bg-red-100 h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <ul className="space-y-2">
        <li>
          <Link
            to="/admin"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/admin/operations"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Operations Hub
          </Link>
        </li>
        <li>
          <Link
            to="/admin/deliveries"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Deliveries
          </Link>
        </li>
        <li>
          <Link
            to="/admin/riders"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Riders
          </Link>
        </li>
        <li>
          <Link
            to="/admin/feedback"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Customer Feedback
          </Link>
        </li>
        <li>
          <Link
            to="/admin/complaints"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Complaints
          </Link>
        </li>
        <li>
          <Link
            to="/admin/payments"
            className="block px-4 py-2 hover:bg-red-200 rounded"
          >
            Payments
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
