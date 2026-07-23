
import React from "react";
import { useAuth } from "../Context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="relative w-full backdrop-blur-md bg-white/70 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-6 text-3xl font-extrabold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent border-none cursor-pointer hover:opacity-80 transition"
        >
          FreshMeal
        </button>

        {/* Menu */}
        <ul className="hidden md:flex items-center space-x-8 text-gray-700 font-medium text-lg">
          <li>
            <Link to="/" className="hover:text-red-600 transition">Home</Link>
          </li>

          <li><a href="/plans" className="hover:text-red-600 transition">Meal Plans</a></li>

          <li><Link to="/menu" className="hover:text-red-600 transition">Today's Menu</Link></li>

          {user ? (
            <>
              {/* ADMIN ONLY LINK */}
              {user.role === "admin" && (
                <li>
                  <Link
                    to="/admin"
                    className="hover:text-red-600 transition font-semibold text-red-600"
                  >
                    Admin Panel
                  </Link>
                </li>
              )}

              {/* Dashboard link: only user role should see it */}
              {user.role !== "admin" && (
                <li>
                  <Link to="/dashboard" className="hover:text-red-600 transition">
                    Dashboard
                  </Link>
                </li>
              )}

              <button 
                onClick={handleLogout}
                className="px-5 py-2 border-2 border-red-600 rounded-lg text-red-600 font-semibold hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="hover:text-red-600 transition">
                  Login
                </Link>
              </li>

              <Link 
                to="/register" 
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Header;
