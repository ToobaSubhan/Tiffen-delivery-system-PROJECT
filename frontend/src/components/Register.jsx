import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const passwordStrength = useMemo(() => {
    const value = form.password;
    if (!value) return { label: 'Weak', color: 'bg-gray-200' };
    const score = [/.{8,}/.test(value), /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
    if (score >= 3) return { label: 'Strong', color: 'bg-green-500' };
    if (score >= 2) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Weak', color: 'bg-red-500' };
  }, [form.password]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const passwordsMatch = form.password && form.password === form.password;
  const formValid = form.firstName && form.lastName && emailValid && form.password.length >= 8 && form.phone && form.address;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
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
            <h2 className="mt-8 text-4xl font-semibold leading-tight">Join thousands eating better every day.</h2>
            <p className="mt-4 max-w-sm text-red-50/90">Create your account to unlock daily healthy meals and a smoother delivery experience.</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-white p-6 sm:p-10 lg:w-1/2">
          <form className="w-full max-w-md animate-fade-in" onSubmit={handleSubmit}>
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-500">Start your FreshMeal journey in a few seconds.</p>
            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</div>}
            {success && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600" role="alert">{success}</div>}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="group relative sm:col-span-1">
                <input id="firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} required className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="firstName" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">First name</label>
              </div>
              <div className="group relative sm:col-span-1">
                <input id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} required className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="lastName" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Last name</label>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="group relative">
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="email" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Email address</label>
                {form.email && <div className={`mt-2 text-sm ${emailValid ? 'text-green-600' : 'text-red-500'}`}>{emailValid ? '✓ Valid email format' : '✕ Enter a valid email address'}</div>}
              </div>

              <div className="group relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required autoComplete="new-password" className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 pr-10 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="password" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Password</label>
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-3 text-sm font-semibold text-gray-500">{showPassword ? 'Hide' : 'Show'}</button>
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full ${passwordStrength.color}`} style={{ width: form.password ? '100%' : '0%' }} />
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Strength: {passwordStrength.label}</div>
                </div>
              </div>

              <div className="group relative">
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="phone" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Phone number</label>
              </div>

              <div className="group relative">
                <input id="address" name="address" type="text" value={form.address} onChange={handleChange} required className="peer w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 pb-3 pt-2 text-base text-gray-700 outline-none transition focus:border-red-500" placeholder=" " />
                <label htmlFor="address" className="pointer-events-none absolute left-0 top-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-red-500">Address</label>
              </div>
            </div>

            <button className="mt-8 flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300" type="submit" disabled={loading || !formValid} aria-busy={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating account...</span>
              ) : (
                'Create account'
              )}
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="font-semibold text-red-600 hover:underline">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;
