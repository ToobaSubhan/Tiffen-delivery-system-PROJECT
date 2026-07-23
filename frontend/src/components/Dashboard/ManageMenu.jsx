// tiffin-frontend/src/components/Dashboard/ManageMenu.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import {
  getAllMenuItems,
  getTodayMenuAdmin,
  addItemToTodayMenu,
  removeItemFromTodayMenu,
  updateMenuItemQuantity,
  uploadMenuItemImage
} from '../../services/api';

const ManageMenu = () => {
  const { user } = useAuth();

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
        data.forEach(d => (init[d.daily_menu_id] = d.available_quantity));
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
    if (!Number.isInteger(qty) || qty < 0) return alert("Invalid quantity");

    try {
      await updateMenuItemQuantity(daily_menu_id, { available_quantity: qty });
      await loadTodayMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const isAdded = (item_id) => Array.isArray(todayMenu) && todayMenu.some(t => t.item_id === item_id);

  // 🔥 NEW — Image Upload Function
  const uploadImage = async (item_id, file) => {
    try {
      await uploadMenuItemImage(item_id, file);
      alert("Image uploaded successfully!");
      loadItems();
      loadTodayMenu();
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <section className="p-8 min-h-screen bg-red-50">
      <h1 className="text-3xl font-bold mb-6">Admin — Manage Today&apos;s Menu</h1>

      <div className="grid md:grid-cols-2 gap-8">

        {/* LEFT SIDE — TODAY MENU */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Today's Menu</h2>

          {Array.isArray(todayMenu) && todayMenu.map(entry => (
            <div key={entry.daily_menu_id} className="border rounded p-3 flex justify-between gap-3">

              <div>
                <h3 className="font-bold">{entry.item_name}</h3>
                <p className="text-sm">{entry.description}</p>
                <p className="text-sm">Category: {entry.category}</p>
                <p className="text-sm">Ingredients: {entry.ingredients}</p>
                <p className="text-sm">Calories: {entry.calories}</p>

                {entry.image_url && (
                  <img
                    src={entry.image_url}
                    alt="menu"
                    className="w-24 h-24 rounded mt-2 object-cover border"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    className="w-20 border p-1 rounded"
                    value={editQty[entry.daily_menu_id]}
                    onChange={(e) =>
                      setEditQty({ ...editQty, [entry.daily_menu_id]: e.target.value })
                    }
                  />
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={() => updateQuantity(entry.daily_menu_id)}
                  >
                    Save
                  </button>
                </div>

                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => removeFromToday(entry.daily_menu_id)}
                >
                  Remove
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* RIGHT SIDE — ADD ITEMS */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Add Items to Today</h2>

          {items.map(item => (
            <div key={item.item_id} className="border rounded p-3 flex justify-between">

              <div>
                <h3 className="font-bold">{item.item_name}</h3>
                <p className="text-sm">{item.description}</p>
                <p className="text-sm">Category: {item.category}</p>

                {/* 🔥 Preview Image */}
                {item.image_url && (
                  <img src={item.image_url} alt={item.item_name} className="w-24 h-24 rounded mt-2 object-cover border" />
                )}

                {/* 🔥 Upload Image */}
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2"
                  onChange={(e) => uploadImage(item.item_id, e.target.files[0])}
                />
              </div>

              <div>
                <button
                  onClick={() => addToToday(item.item_id)}
                  disabled={isAdded(item.item_id)}
                  className={`px-3 py-1 rounded text-white ${
                    isAdded(item.item_id) ? "bg-gray-400" : "bg-red-600"
                  }`}
                >
                  {isAdded(item.item_id) ? "Added" : "Add"}
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ManageMenu;
