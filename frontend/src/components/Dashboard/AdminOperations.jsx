import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../Context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND = API.replace('/api', '');
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TABS = [
  { key: 'items', label: '🍽️ Menu Items' },
  { key: 'today', label: "📅 Today's Menu" },
  { key: 'weekly', label: '🗓️ Weekly Schedule' },
  { key: 'plans', label: '📋 Meal Plans' },
];

const badge = (ok) =>
  ok
    ? 'bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium'
    : 'bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
const btn = (color = 'red') => `px-4 py-2 rounded-lg text-sm font-medium transition bg-${color}-600 text-white hover:bg-${color}-700 disabled:opacity-50`;

const useCategories = (token) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, [token]);

  return categories;
};

const MenuItemsTab = ({ token }) => {
  const auth = `Bearer ${token}`;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCat] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const baseForm = { item_name: '', description: '', category: 'lunch', cuisine_type: '', price: '', is_available: 1, calories: '' };
  const [form, setForm] = useState(baseForm);

  const categories = useCategories(token);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/menu-admin/items`, { headers: { Authorization: auth } });
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.item_name.trim()) {
      setMsg('plan_name is required');
      return;
    }

    const url = editing ? `${API}/menu-admin/items/${editing}` : `${API}/menu-admin/items`;
    const method = editing ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      ...form,
      price: parseFloat(form.price) || 0,
      calories: parseInt(form.calories, 10) || null,
      // keep ingredients format consistent with backend (comma-separated string)
      ingredients: Array.isArray(form.ingredients)
        ? form.ingredients.join(', ')
        : (form.ingredients || ''),
    }),
    });
    const data = await response.json();
    setMsg(data.message || (response.ok ? 'Saved!' : 'Error'));
    if (response.ok) {
      setModal(false);
      load();
    }
  };

  const toggle = async (id) => {
    await fetch(`${API}/menu-admin/toggle-availability/${id}`, { method: 'PUT', headers: { Authorization: auth } });
    load();
  };

  const del = async (id, plan_name) => {
    if (!window.confirm(`Delete "${plan_name}"?`)) return;
    await fetch(`${API}/menu-admin/items/${id}`, { method: 'DELETE', headers: { Authorization: auth } });
    load();
  };

  const openAdd = () => {
    setEditing(null);
    setForm(baseForm);
    setMsg('');
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item.item_id);
    setForm(item);
    setMsg('');
    setModal(true);
  };

  const categoryOptions = ['all', ...new Set(items.map((item) => item.category).filter(Boolean))];
  const visible = items.filter((item) => {
    const query = search.toLowerCase();
    return (catFilter === 'all' || item.category === catFilter) && (!query || item.item_name?.toLowerCase().includes(query) || item.cuisine_type?.toLowerCase().includes(query));
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" value={catFilter} onChange={(e) => setCat(e.target.value)}>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : cat}</option>
            ))}
          </select>
        </div>
        <button onClick={openAdd} className={btn()}>
          + Add Item
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-red-600 text-white">
              <tr>
                {['Item', 'Category', 'Cuisine', 'Price', 'Cal', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No items found
                  </td>
                </tr>
              )}
              {visible.map((item) => (
                <tr key={item.item_id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.image_url && <img src={`${BACKEND}${item.image_url}`} alt="" className="h-8 w-8 rounded object-cover" />}
                      <span className="font-medium text-gray-800">{item.item_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-gray-600">{item.cuisine_type || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">Rs{item.price}</td>
                  <td className="px-4 py-3 text-gray-500">{item.calories || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(item.item_id)} className={badge(item.is_available)}>
                      {item.is_available ? 'Available' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-200">
                        Edit
                      </button>
                      <button onClick={() => del(item.item_id, item.item_name)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit' : 'Add'} Menu Item</h3>
              <button onClick={() => setModal(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Item name *</label>
                <input className={inp} value={form.item_name || ''} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Chicken Biryani" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
                <select className={inp} value={form.category || (categories[0]?.category_name ?? '')} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Choose category…</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Price (Rs)</label>
                <input className={inp} type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Cuisine Type</label>
                <input className={inp} value={form.cuisine_type || ''} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} placeholder="e.g. Pakistani" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Calories</label>
                <input className={inp} type="number" value={form.calories || ''} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="e.g. 450" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <textarea className={inp} rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description…" />
              </div>

              {/* Image Upload */}
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Item Image</label>
                {form.image_url && (
                  <img
                    src={`${BACKEND}${form.image_url}`}
                    alt="current"
                    className="w-20 h-20 rounded object-cover mb-2"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file || !editing) {
                      setMsg('Save the item first, then upload image');
                      return;
                    }

                    const formData = new FormData();
                    formData.append('image', file);
                    formData.append('item_id', editing);

                    const r = await fetch(`${API}/menu-admin/upload-image`, {
                      method: 'POST',
                      headers: { Authorization: auth },
                      body: formData,
                    });

                    const d = await r.json();
                    if (r.ok) {
                      setMsg('✓ Image uploaded!');
                      load();
                    } else {
                      setMsg(d.message || 'Upload failed');
                    }
                  }}
                />

                {!editing && <p className="text-xs text-gray-400 mt-1">Save item first, then edit to upload image</p>}
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="avail" checked={!!form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-red-600" />
                <label htmlFor="avail" className="text-sm text-gray-700">
                  Available / Visible
                </label>
              </div>
            </div>
            {msg && <p className={`mt-3 text-sm font-medium ${msg.includes('Error') || msg.includes('required') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} className={btn()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TodayMenuTab = ({ token }) => {
  const auth = `Bearer ${token}`;
  const [allItems, setAllItems] = useState([]);
  const [todayMenu, setTodayMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [editQty, setEditQty] = useState({});
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [all, today] = await Promise.all([
      fetch(`${API}/menu-admin/items`, { headers: { Authorization: auth } }).then((r) => r.json()),
      fetch(`${API}/menu-admin/today`, { headers: { Authorization: auth } }).then((r) => r.json()),
    ]);
    setAllItems(Array.isArray(all) ? all : []);
    const list = Array.isArray(today) ? today : [];
    setTodayMenu(list);
    const qtyMap = {};
    list.forEach((item) => {
      qtyMap[item.daily_menu_id] = item.quantity;
    });
    setEditQty(qtyMap);
    setLoading(false);
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const addToToday = async (itemId) => {
    setAddingId(itemId);
    await fetch(`${API}/menu-admin/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ item_id: itemId, quantity: 50 }),
    });
    await load();
    setAddingId(null);
  };

  const removeFromToday = async (dailyMenuId) => {
    await fetch(`${API}/menu-admin/remove/${dailyMenuId}`, { method: 'DELETE', headers: { Authorization: auth } });
    load();
  };

  const updateQty = async (dailyMenuId) => {
    await fetch(`${API}/menu-admin/update-quantity/${dailyMenuId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ quantity: editQty[dailyMenuId] }),
    });
    load();
  };

  const todayIds = new Set(todayMenu.map((entry) => entry.item_id));
  const available = allItems.filter((item) => item.is_available && (!search || item.item_name?.toLowerCase().includes(search.toLowerCase())));
  const grouped = todayMenu.reduce((acc, entry) => {
    const key = entry.category || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  if (loading) return <div className="py-10 text-center text-gray-400">Loading…</div>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h4 className="mb-3 font-semibold text-gray-700">Available Items — click to add to today</h4>
        <input className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {available.map((item) => (
            <div key={item.item_id} className={`flex items-center justify-between rounded-lg border p-3 transition ${todayIds.has(item.item_id) ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white hover:border-red-200'}`}>
              <div>
                <div className="text-sm font-medium text-gray-800">{item.item_name}</div>
                <div className="text-xs capitalize text-gray-500">{item.category} · Rs{item.price}</div>
              </div>
              {todayIds.has(item.item_id) ? (
                <span className="text-xs font-medium text-green-600">✓ Added</span>
              ) : (
                <button onClick={() => addToToday(item.item_id)} disabled={addingId === item.item_id} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                  {addingId === item.item_id ? 'Adding…' : '+ Add'}
                </button>
              )}
            </div>
          ))}
          {available.length === 0 && <p className="py-6 text-center text-gray-400">No items found</p>}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-gray-700">Today's Active Menu ({todayMenu.length} items)</h4>
        {todayMenu.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed py-10 text-center text-gray-400">No items added yet</div>
        ) : (
          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([category, dishes]) => (
              <div key={category}>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-red-600">{category}</div>
                <div className="space-y-2">
                  {dishes.map((entry) => (
                    <div key={entry.daily_menu_id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2">
                      {entry.image_url && (
                      <img src={`${BACKEND}${entry.image_url}`} alt={entry.item_name} className="w-10 h-10 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }} /> )}
                         <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-800">{entry.item_name}</div>
                           <div className="text-xs text-gray-500">Rs{entry.price}</div>
                            </div>
                      <div className="flex items-center gap-1">
                        <input type="number" className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-xs" value={editQty[entry.daily_menu_id] ?? entry.quantity} onChange={(e) => setEditQty({ ...editQty, [entry.daily_menu_id]: parseInt(e.target.value, 10) || 0 })} />
                        <button onClick={() => updateQty(entry.daily_menu_id)} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 transition hover:bg-blue-200">
                          ✓
                        </button>
                        <button onClick={() => removeFromToday(entry.daily_menu_id)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 transition hover:bg-red-200">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WeeklyTab = ({ token }) => {
  const auth = `Bearer ${token}`;
  const [items, setItems] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');
  const [form, setForm] = useState({ item_id: '', price: '', quantity: 50 });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [all, weekly] = await Promise.all([
      fetch(`${API}/menu-admin/items`, { headers: { Authorization: auth } }).then((r) => r.json()),
      fetch(`${API}/weekly-menu`, { headers: { Authorization: auth } }).then((r) => r.json()),
    ]);
    setItems(Array.isArray(all) ? all : []);
    const flat = [];
    if (weekly.success && weekly.data) {
      Object.values(weekly.data).forEach((arr) => {
        if (Array.isArray(arr)) flat.push(...arr);
      });
    } else if (Array.isArray(weekly)) {
      flat.push(...weekly);
    }
    setSchedule(flat);
    setLoading(false);
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const dayItems = schedule.filter((entry) => entry.weekday === activeDay);
  const counts = DAYS.reduce((acc, day) => {
    acc[day] = schedule.filter((entry) => entry.weekday === day).length;
    return acc;
  }, {});

  const addSlot = async () => {
    if (!form.item_id) {
      setMsg('Select an item');
      return;
    }
    setAdding(true);
    setMsg('');
    const response = await fetch(`${API}/weekly-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ weekday: activeDay, item_id: parseInt(form.item_id, 10), price: parseFloat(form.price) || null, quantity: parseInt(form.quantity, 10) || 50 }),
    });
    const data = await response.json();
    setMsg(response.ok ? '✓ Added' : data.message || 'Error');
    if (response.ok) {
      setForm({ item_id: '', price: '', quantity: 50 });
      load();
    }
    setAdding(false);
  };

  const removeSlot = async (id) => {
    await fetch(`${API}/weekly-menu/${id}`, { method: 'DELETE', headers: { Authorization: auth } });
    load();
  };

  if (loading) return <div className="py-10 text-center text-gray-400">Loading…</div>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <button key={day} onClick={() => setActiveDay(day)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeDay === day ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {day.slice(0, 3)}
            {counts[day] > 0 && <span className={`ml-1 rounded-full px-1.5 text-xs ${activeDay === day ? 'bg-red-400 text-white' : 'bg-red-100 text-red-600'}`}>{counts[day]}</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <h4 className="mb-3 font-semibold text-gray-700">Add to {activeDay}</h4>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Item *</label>
              <select className={inp} value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
                <option value="">Choose item…</option>
                {items.filter((item) => item.is_available).map((item) => (
                  <option key={item.item_id} value={item.item_id}>{item.item_name} ({item.category})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Price (Rs)</label>
                <input className={inp} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="blank = item price" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Quantity</label>
                <input className={inp} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
            </div>
            {msg && <p className={`text-sm font-medium ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
            <button onClick={addSlot} disabled={adding} className={btn()}>
              {adding ? 'Adding…' : '+ Add to Schedule'}
            </button>
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-gray-700">{activeDay} Menu ({dayItems.length} items)</h4>
          {dayItems.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed py-10 text-center text-gray-400">Nothing scheduled for {activeDay}</div>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {dayItems.map((entry) => (
                <div key={entry.weekly_menu_id || entry.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{entry.item_name}</div>
                    <div className="text-xs text-gray-500">Rs{entry.price} · Qty: {entry.quantity}</div>
                  </div>
                  <button onClick={() => removeSlot(entry.weekly_menu_id || entry.id)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 transition hover:bg-red-200">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategoriesManager = ({ token }) => {
  const categories = useCategories(token);
  const auth = `Bearer ${token}`;
  const [newCat, setNewCat] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(categories);
  }, [categories]);

  const add = async () => {
    if (!newCat.trim()) return;
    setAdding(true);
    const response = await fetch(`${API}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({ category_name: newCat.trim() }),
    });
    const data = await response.json();
    setMsg(response.ok ? '✓ Added' : data.message || 'Failed to add');
    if (response.ok) {
      setNewCat('');
      const fresh = await fetch(`${API}/categories`, { headers: { Authorization: auth } });
      const freshData = await fresh.json();
      setList(Array.isArray(freshData) ? freshData : []);
    }
    setAdding(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id) => {
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: { Authorization: auth } });
    setList((prev) => prev.filter((c) => c.category_id !== id));
  };

  return (
    <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">📂 Manage Categories</h3>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          placeholder="New category name…"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button
          onClick={add}
          disabled={adding}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          {adding ? '...' : '+ Add'}
        </button>
      </div>
      {msg && (
        <p className={`text-xs mb-2 font-medium ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
          {msg}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {list.map((cat) => (
          <span
            key={cat.category_id}
            className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full"
          >
            {cat.category_name}
            {!['breakfast', 'lunch', 'dinner'].includes(cat.category_name) && (
              <button onClick={() => del(cat.category_id)} className="text-red-400 hover:text-red-600 ml-1 font-bold">
                ×
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

const MealPlansTab = ({ token }) => {
  const auth = `Bearer ${token}`;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const baseForm = { plan_name: '', description: '', price_per_month: '', meals_per_day: '', subscription_type: 'Monthly', plan_type: '', is_available: 1 };
  const [form, setForm] = useState(baseForm);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`${API}/meal-plans`, { headers: { Authorization: auth } });
    const data = await response.json();
    setPlans(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.plan_name.trim() || !form.price_per_month) {
      setMsg('plan_name and price are required');
      return;
    }

    const url = editing ? `${API}/meal-plans/${editing}` : `${API}/meal-plans`;
    const method = editing ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ ...form, price_per_month: parseFloat(form.price_per_month), meals_per_day: parseInt(form.meals_per_day, 10) || null }),
    });
    const data = await response.json();
    setMsg(data.message || (response.ok ? 'Saved!' : 'Error'));
    if (response.ok) {
      setShowForm(false);
      setEditing(null);
      setForm(baseForm);
      load();
    }
  };

  const del = async (id, plan_name) => {
    if (!window.confirm(`Delete plan "${plan_name}"?`)) return;
    await fetch(`${API}/meal-plans/${id}`, { method: 'DELETE', headers: { Authorization: auth } });
    load();
  };

  const openEdit = (plan) => {
    setEditing(plan.plan_id);
    setForm(plan);
    setMsg('');
    setShowForm(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(baseForm);
    setMsg('');
    setShowForm(true);
  };

  if (loading) return <div className="py-10 text-center text-gray-400">Loading…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{plans.length} plans total</span>
        <button onClick={openAdd} className={btn()}>
          + New Plan
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl border border-red-100 bg-gray-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">{editing ? 'Edit' : 'New'} Meal Plan</h4>
            <button onClick={() => setShowForm(false)} className="text-xl leading-none text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Plan plan_name *</label>
              <input className={inp} value={form.plan_name || ''} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} placeholder="e.g. Lunch Plan" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Price/Month (Rs) *</label>
              <input className={inp} type="number" value={form.price_per_month || ''} onChange={(e) => setForm({ ...form, price_per_month: e.target.value })} placeholder="2499" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Meals/Day</label>
              <input className={inp} type="number" value={form.meals_per_day || ''} onChange={(e) => setForm({ ...form, meals_per_day: e.target.value })} placeholder="3" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
              <select className={inp} value={form.subscription_type || 'Monthly'} onChange={(e) => setForm({ ...form, subscription_type: e.target.value })}>
                {['Daily', 'Weekly', 'Monthly'].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Plan Type</label>
              <input className={inp} value={form.plan_type || ''} onChange={(e) => setForm({ ...form, plan_type: e.target.value })} placeholder="e.g. Veg / Non-Veg" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <textarea className={inp} rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="pavail" checked={!!form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-red-600" />
              <label htmlFor="pavail" className="text-sm text-gray-700">
                Available / Visible to users
              </label>
            </div>
          </div>
          {msg && <p className={`mt-2 text-sm font-medium ${msg.includes('Error') || msg.includes('required') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={save} className={btn()}>
              Save Plan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.plan_id} className={`flex flex-col gap-2 rounded-xl border bg-white p-5 transition hover:shadow-md ${!plan.is_available ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-gray-800">{plan.plan_name}</div>
                {plan.plan_type && <div className="mt-0.5 text-xs text-gray-500">{plan.plan_type}</div>}
              </div>
              <span className={badge(plan.is_available)}>{plan.is_available ? 'Active' : 'Hidden'}</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              Rs{plan.price_per_month}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </div>
            <div className="line-clamp-2 text-sm text-gray-600">{plan.description}</div>
            <div className="mt-1 flex gap-3 text-xs text-gray-500">
              {plan.meals_per_day && <span>🍽️ {plan.meals_per_day} meals/day</span>}
              {plan.subscription_type && <span>📅 {plan.subscription_type}</span>}
            </div>
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-2">
              <button onClick={() => openEdit(plan)} className="flex-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-200">
                Edit
              </button>
              <button onClick={() => del(plan.plan_id, plan.plan_name)} className="flex-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminOperations = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu & Plans Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage menu items, today's menu, weekly schedule, and meal plans in one place.</p>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-lg px-4 py-2 text-sm font-medium transition whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <CategoriesManager token={token} />
        {activeTab === 'items' && <MenuItemsTab token={token} />}
        {activeTab === 'today' && <TodayMenuTab token={token} />}
        {activeTab === 'weekly' && <WeeklyTab token={token} />}
        {activeTab === 'plans' && <MealPlansTab token={token} />}
      </div>
    </div>
  );
};

export default AdminOperations;