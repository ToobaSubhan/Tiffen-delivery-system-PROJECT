import React, { useEffect, useState } from "react";
import { useAuth } from '../../Context/AuthContext';
const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Riders = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("available");
  const [editingRider, setEditingRider] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await fetch(`${API}/riders`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.error('Failed to load riders', await res.text());
      setList([]);
      return;
    }
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setVehicleNumber("");
    setStatus("available");
    setEditingRider(null);
  };

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setMessage('First name and last name are required.');
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
      vehicle_number: vehicleNumber.trim() || null,
      status
    };

    const url = editingRider ? `${API}/riders/${editingRider.rider_id}` : `${API}/riders`;
    const method = editingRider ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.message || 'Failed to save rider');
      return;
    }

    setMessage(editingRider ? 'Rider updated successfully.' : 'Rider added successfully.');
    resetForm();
    load();
  };

  const edit = (rider) => {
    setEditingRider(rider);
    setFirstName(rider.first_name || '');
    setLastName(rider.last_name || '');
    setPhone(rider.phone || '');
    setVehicleNumber(rider.vehicle_number || '');
    setStatus(rider.status || 'available');
    setMessage('');
  };

  const remove = async (id) => {
    const res = await fetch(`${API}/riders/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || 'Failed to delete rider');
      return;
    }
    setMessage('Rider removed successfully.');
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Riders</h2>

      {message && (
        <div className="mb-4 rounded-lg border px-4 py-3 text-sm text-gray-800 bg-gray-50 border-gray-200">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            placeholder="Vehicle number"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          onClick={save}
        >
          {editingRider ? 'Update Rider' : 'Add Rider'}
        </button>
        {editingRider && (
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(list) && list.map((rider) => (
              <tr key={rider.rider_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${rider.first_name} ${rider.last_name}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.phone || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.vehicle_number || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    rider.status === 'available' ? 'bg-green-100 text-green-800' :
                    rider.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rider.status || 'offline'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => edit(rider)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => remove(rider.rider_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Riders;
