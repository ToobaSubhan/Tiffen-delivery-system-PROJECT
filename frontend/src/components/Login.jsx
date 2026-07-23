import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { loginUser } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.user, res.token);
      navigate(res.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="mb-4 text-red-600" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="mt-4 text-center">
          <span>Don't have an account? </span>
          <a href="/register" className="text-primary font-semibold hover:underline">Register</a>
        </div>
      </form>
    </section>
  );
};

export default Login;
