// tiffin-frontend/src/components/Dashboard/ManageUsers.jsx
import React, { useEffect, useState } from "react";
import { getAllUsers } from '../../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Customers</h2>

      {users.length === 0 ? (
        <div className="bg-white p-6 rounded shadow">No users found</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id || u.customer_id} className="border-t">
                  <td className="p-3">{u.user_id || u.customer_id}</td>
                  <td className="p-3">{(u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.name) || 'N/A'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone || 'N/A'}</td>
                  <td className="p-3">{u.role || 'customer'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
