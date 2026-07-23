// tiffin-frontend/src/components/Dashboard/ManageMenu.jsx
import React, { useEffect, useState } from 'react';
import {
  getAllMenuItems,
  getTodayMenuAdmin,
  addItemToTodayMenu,
  removeItemFromTodayMenu,
  updateMenuItemQuantity,
  uploadMenuItemImage
} from '../../services/api';
import { MenuCardSkeleton } from '../ui/Skeleton';

const ManageMenu = () => {
  const [items, setItems] = useState([]);
  const [todayMenu, setTodayMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState(null);
  const [editQty, setEditQty] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([loadItems(), loadTodayMenu()]);
    setLoading(false);
  };

  const loadItems = async () => {
    try {
      const data = await getAllMenuItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTodayMenu = async () => {
    try {
      const data = await getTodayMenuAdmin();
      if (Array.isArray(data)) {
        setTodayMenu(data);
        const init = {};
        data.forEach((d) => (init[d.daily_menu_id] = d.available_quantity));
        setEditQty(init);
      } else {
        console.error('Invalid data format:', data);
        setTodayMenu([]);
        setEditQty({});
      }
    } catch (err) {
      console.error('Error loading today menu:', err);
      setTodayMenu([]);
      setEditQty({});
    }
  };

  const addToToday = async (item_id) => {
    setAddingItemId(item_id);
    try {
      await addItemToTodayMenu({ item_id, quantity: 50 });
      await loadTodayMenu();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingItemId(null);
    }
  };

  const removeFromToday = async (daily_menu_id) => {
    if (!window.confirm('Remove this item?')) return;
    try {
      await removeItemFromTodayMenu(daily_menu_id);
      await loadTodayMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateQuantity = async (daily_menu_id) => {
    const qty = Number(editQty[daily_menu_id]);
    if (!Number.isInteger(qty) || qty < 0) return alert('Invalid quantity');

    try {
      await updateMenuItemQuantity(daily_menu_id, { available_quantity: qty });
      await loadTodayMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const isAdded = (item_id) => Array.isArray(todayMenu) && todayMenu.some((t) => t.item_id === item_id);

  const uploadImage = async (item_id, file) => {
    try {
      await uploadMenuItemImage(item_id, file);
      alert('Image uploaded successfully!');
      loadItems();
      loadTodayMenu();
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6 sm:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-64 rounded bg-gray-200" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <MenuCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Manage Today&apos;s Menu</h1>
          <p className="mt-2 text-sm text-gray-600">Curate the menu for today and keep quantities in sync.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Menu</h2>
              <span className="text-sm text-gray-500">{todayMenu.length} items</span>
            </div>

            <div className="space-y-3">
              {Array.isArray(todayMenu) && todayMenu.map((entry) => (
                <div key={entry.daily_menu_id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{entry.item_name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{entry.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-white px-2 py-1">{entry.category}</span>
                        <span className="rounded-full bg-white px-2 py-1">{entry.calories} cal</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm"
                          value={editQty[entry.daily_menu_id] ?? ''}
                          onChange={(e) => setEditQty({ ...editQty, [entry.daily_menu_id]: e.target.value })}
                        />
                        <button
                          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                          onClick={() => updateQuantity(entry.daily_menu_id)}
                        >
                          Save
                        </button>
                      </div>
                      <button
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                        onClick={() => removeFromToday(entry.daily_menu_id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add Items</h2>
              <span className="text-sm text-gray-500">{items.length} available</span>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.item_id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">{item.category}</p>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.item_name} className="mt-3 h-24 w-24 rounded-xl object-cover" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-3 block text-sm text-gray-600"
                        onChange={(e) => uploadImage(item.item_id, e.target.files[0])}
                      />
                    </div>
                    <button
                      onClick={() => addToToday(item.item_id)}
                      disabled={isAdded(item.item_id) || addingItemId === item.item_id}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                        isAdded(item.item_id) || addingItemId === item.item_id ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {addingItemId === item.item_id ? 'Adding...' : isAdded(item.item_id) ? 'Added' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManageMenu;
