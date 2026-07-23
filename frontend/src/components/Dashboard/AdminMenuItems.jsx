//Dashboard/AdminMenuItems.jsx
import React, { useEffect, useState } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND = API.replace('/api','');

const AdminMenuItems = () => {
  const token = localStorage.getItem("token");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");

  // FORM FIELDS
  const [form, setForm] = useState({
    item_name: "",
    description: "",
    category: "veg",
    cuisine_type: "",
    price: "",
    is_available: 1,
  });

  // LOAD ITEMS
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(`${API}/menu-admin/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  // OPEN ADD MODAL
  const openAddModal = () => {
    setEditing(null);
    setForm({
      item_name: "",
      description: "",
      category: "veg",
      cuisine_type: "",
      price: "",
      is_available: 1,
    });
    setModal(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (item) => {
    setEditing(item.item_id);
    setForm(item);
    setModal(true);
  };

  // SAVE ITEM
  const saveItem = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API}/menu-admin/items/${editing}`
      : `${API}/menu-admin/items`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    alert(data.message);
    setModal(false);
    fetchItems();
  };

  // DELETE ITEM
  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    const res = await fetch(`${API}/menu-admin/items/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    alert(data.message);
    fetchItems();
  };

  // IMAGE UPLOAD
  const uploadImage = async (item_id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("item_id", item_id);

    const res = await fetch(`${API}/menu-admin/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
    fetchItems();
  };

  // TOGGLE AVAILABILITY
  const toggleAvailability = async (item) => {
    await fetch(`${API}/menu-admin/toggle-availability/${item.item_id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchItems();
  };

  // FILTERED ITEMS
  const filteredItems = items
    .filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => filterCategory === "all" || i.category === filterCategory)
    .filter(i =>
      filterAvailability === "all" ||
      (filterAvailability === "available" ? i.is_available : !i.is_available)
    );

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <section className="p-8 min-h-screen bg-red-50">
      <h1 className="text-3xl font-bold mb-6">Admin — Manage Menu Items</h1>

      <button
        className="px-4 py-2 bg-red-600 text-white rounded mb-6"
        onClick={openAddModal}
      >
        + Add New Item
      </button>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          className="border p-2 rounded w-1/3"
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded"
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
        </select>

        <select
          className="border p-2 rounded"
          onChange={(e) => setFilterAvailability(e.target.value)}
        >
          <option value="all">All Items</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-red-600 text-white text-left">
            <th className="p-3">Image</th>
            <th className="p-3">Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Cuisine</th>
            <th className="p-3">Price</th>
            <th className="p-3">Available</th>
            <th className="p-3"></th>
          </tr>
        </thead>

        <tbody>
          {filteredItems.map(item => (
            <tr key={item.item_id} className="border-b">
              <td className="p-3">
                {item.image_url ? (
                  <img
                    src={(item.image_url || '').startsWith('http') ? item.image_url : `${BACKEND}${item.image_url}`}
                    className="w-14 h-14 rounded object-cover"
                    alt=""
                  />
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </td>

              <td className="p-3 font-semibold">{item.item_name}</td>
              <td className="p-3">{item.category}</td>
              <td className="p-3">{item.cuisine_type}</td>
              <td className="p-3">Rs. {item.price}</td>

              {/* Availability Toggle */}
              <td className="p-3">
                <button
                  className={`px-3 py-1 rounded text-white ${
                    item.is_available ? "bg-green-600" : "bg-gray-500"
                  }`}
                  onClick={() => toggleAvailability(item)}
                >
                  {item.is_available ? "Available" : "Unavailable"}
                </button>
              </td>

              <td className="p-3 flex gap-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteItem(item.item_id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>

                <label className="px-3 py-1 bg-gray-700 text-white rounded cursor-pointer">
                  Upload
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => uploadImage(item.item_id, e.target.files[0])}
                  />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">

            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit Item" : "Add Item"}
            </h2>

            <input
              type="text"
              placeholder="Item Name"
              className="w-full border p-2 mb-3"
              value={form.item_name}
              onChange={(e) =>
                setForm({ ...form, item_name: e.target.value })
              }
            />

            <textarea
              placeholder="Description"
              className="w-full border p-2 mb-3"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <select
              className="w-full border p-2 mb-3"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
            </select>

            <input
              type="text"
              placeholder="Cuisine Type"
              className="w-full border p-2 mb-3"
              value={form.cuisine_type}
              onChange={(e) =>
                setForm({ ...form, cuisine_type: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Price"
              className="w-full border p-2 mb-3"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <button
              className="px-4 py-2 bg-green-600 text-white rounded w-full"
              onClick={saveItem}
            >
              Save
            </button>

            <button
              className="px-4 py-2 bg-gray-400 text-white rounded w-full mt-2"
              onClick={() => setModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminMenuItems;
