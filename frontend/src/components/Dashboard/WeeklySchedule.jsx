// src/components/Dashboard/WeeklySchedule.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND = API.replace('/api','');

const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const WeeklySchedule = () => {
  const token = localStorage.getItem('token');
  const [items, setItems] = useState([]); // available items to schedule
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ weekday: 'Monday', item_id: '', price: '', available_quantity: 50 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allItems, weekly] = await Promise.all([
        fetch(`${API}/menu-admin/items`, { headers: { Authorization: `Bearer ${token}` }}).then(r => r.json()),
        fetch(`${API}/weekly-menu`, { headers: { Authorization: `Bearer ${token}` }}).then(r => r.json())
      ]);
      setItems(Array.isArray(allItems) ? allItems : []);
      // Convert grouped data to flat array for frontend use
      const flatSchedule = [];
      if (weekly.success && weekly.data) {
        Object.keys(weekly.data).forEach(day => {
          if (Array.isArray(weekly.data[day])) {
            flatSchedule.push(...weekly.data[day]);
          }
        });
      }
      setSchedule(flatSchedule);
    } catch (err) {
      console.error(err);
      alert('Failed to load weekly schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.item_id) return alert('select item');

    // Convert form values to proper types
    const payload = {
      weekday: form.weekday,
      item_id: parseInt(form.item_id, 10),
      price: form.price ? parseFloat(form.price) : null,
      available_quantity: parseInt(form.available_quantity, 10) || 0
    };

    try {
      const res = await fetch(`${API}/weekly-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add item');
      }

      await loadData();
      setForm({ ...form, item_id: '', price:'', available_quantity:50 });
      alert('Item added successfully!');
    } catch (err) {
      console.error(err);
      alert(`Failed to add: ${err.message}`);
    }
  };

  const handleToggleActive = async (id, active) => {
    try {
      await fetch(`${API}/weekly-menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !active })
      });
      await loadData();
    } catch (err) { console.error(err); alert('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete schedule item?')) return;
    try {
      await fetch(`${API}/weekly-menu/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      await loadData();
    } catch (err) { console.error(err); alert('Failed'); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <section className="p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Weekly Menu Scheduling</h2>

      <form onSubmit={handleAdd} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="p-2 border rounded" value={form.weekday} onChange={e=>setForm({...form, weekday:e.target.value})}>
          {weekdays.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="p-2 border rounded" value={form.item_id} onChange={e=>setForm({...form, item_id: e.target.value})}>
          <option value="">Select item</option>
          {items.map(i => <option key={i.item_id} value={i.item_id}>{i.item_name} — {i.category}</option>)}
        </select>

        <input type="number" placeholder="Price" className="p-2 border rounded" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
        <input type="number" placeholder="Qty" className="p-2 border rounded" value={form.available_quantity} onChange={e=>setForm({...form, available_quantity:e.target.value})} />

        <div className="md:col-span-4">
          <button className="px-4 py-2 bg-red-600 text-white rounded">Add to Weekly Schedule</button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {weekdays.map(day => (
          <div key={day} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">{day}</h3>
            <ul className="space-y-2">
              {schedule.filter(s => s.weekday === day).length === 0 && <li className="text-gray-500">No items scheduled.</li>}
              {schedule.filter(s => s.weekday === day).map(s => (
                <li key={s.weekly_menu_id} className="flex justify-between items-center border rounded p-2">
                  <div className="flex items-center gap-3">
                    {s.image_url ? <img src={(s.image_url || '').startsWith('http') ? s.image_url : `${BACKEND}${s.image_url}`} alt="" className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-gray-100 rounded" />}
                    <div>
                      <div className="font-semibold">{s.item_name}</div>
                      <div className="text-sm text-gray-600">Rs. {s.price} • Qty: {s.available_quantity}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button className={`px-2 py-1 rounded ${s.is_active ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`} onClick={()=>handleToggleActive(s.weekly_menu_id, s.is_active)} >
                      {s.is_active ? 'Active' : 'Off'}
                    </button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>handleDelete(s.weekly_menu_id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeeklySchedule;
