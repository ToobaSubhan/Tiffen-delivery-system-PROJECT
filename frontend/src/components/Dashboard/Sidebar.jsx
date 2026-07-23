import React from 'react';
import { Link } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/operations', label: 'Operations Hub' },
  { to: '/admin/deliveries', label: 'Deliveries' },
  { to: '/admin/riders', label: 'Riders' },
  { to: '/admin/feedback', label: 'Customer Feedback' },
  { to: '/admin/complaints', label: 'Complaints' },
  { to: '/admin/payments', label: 'Payments' },
];

const Sidebar = () => {
  return (
    <aside className="h-screen w-72 border-r border-red-100 bg-gradient-to-b from-red-50 to-white p-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">FreshMeal</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">Admin Panel</h2>
        <p className="mt-2 text-sm text-gray-600">Manage operations from one place.</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-red-100 hover:text-red-700"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
