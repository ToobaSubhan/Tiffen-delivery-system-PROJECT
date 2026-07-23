import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { loginUser } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
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
    <section className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl">
        <div className="hidden w-1/2 bg-gradient-to-br from-red-600 to-red-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-3xl font-extrabold">FreshMeal</div>
            <h2 className="mt-8 text-4xl font-semibold leading-tight">Fresh meals, delivered daily.</h2>
            <p className="mt-4 max-w-sm text-red-50/90">Enjoy healthy, chef-made tiffin plans without the daily stress.</p>
          </div>
          <ul className="space-y-3 text-sm text-red-50/90">
            <li className="flex items-center gap-2">✓ Fresh ingredients every morning</li>
            <li className="flex items-center gap-2">✓ Flexible daily meal plans</li>
            <li className="flex items-center gap-2">✓ Fast delivery and easy tracking</li>
          </ul>
        </div>

        <div className="flex w-full items-center justify-center bg-white p-6 sm:p-10 lg:w-1/2">
          <form className="w-full max-w-md animate-fade-in" onSubmit={handleSubmit}>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500">Sign in to continue your FreshMeal routine.</p>
            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</div>}

            <div className="mt-8 space-y-5">
              <div className="group relative">
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="email" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Email address</label>
              </div>

              <div className="group relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required autoComplete="current-password" className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 pr-10 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="password" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Password</label>
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-3 text-sm font-semibold text-gray-500">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <button className="mt-8 flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Logging in...</span>
              ) : (
                'Login'
              )}
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account? <Link to="/register" className="font-semibold text-red-600 hover:underline">Create one</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
