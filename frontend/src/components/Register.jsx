import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(form);
      setSuccess("Registration successful! Please login.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <div className="mb-4 text-red-600" role="alert">{error}</div>}
        {success && <div className="mb-4 text-green-600" role="alert">{success}</div>}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="new-password" />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="text" value={form.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input id="address" name="address" type="text" value={form.address} onChange={handleChange} />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
        <div className="mt-4 text-center">
          <span>Already have an account? </span>
          <a href="/login" className="text-primary font-semibold hover:underline">Login</a>
        </div>
      </form>
    </section>
  );
};

export default Register;
