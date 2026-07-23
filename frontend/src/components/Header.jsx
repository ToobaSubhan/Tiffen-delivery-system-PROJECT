import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  // Scroll effect — header gets shadow + white bg after scrolling 10px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative text-sm font-medium transition-colors duration-200 after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:bg-red-600 after:transition-all after:duration-300 ${
      isActive(path)
        ? 'text-red-600 after:w-full'
        : 'text-gray-700 hover:text-red-600 after:w-0 hover:after:w-full'
    }`;

  const mobileNavLinkClass = (path) =>
    `block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
      isActive(path)
        ? 'bg-red-50 text-red-600'
        : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Build nav links based on auth state
  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/plans', label: 'Meal Plans' },
    { to: '/menu', label: "Today's Menu" },
  ];

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Panel' },
  ];

  const authSpecificLinks =
    user?.role === 'admin' ? adminLinks : user ? userLinks : [];

  const allNavLinks = [...publicLinks, ...authSpecificLinks];

  return (
    <header
      ref={menuRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-white/80 backdrop-blur-md py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-extrabold text-red-600 tracking-tight hover:opacity-80 transition-opacity duration-200"
          >
            Fresh<span className="text-gray-900">Meal</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {allNavLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-500 font-medium">
                  Hi, {user.name?.split(' ')[0] || user.first_name || 'User'} 👋
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-red-600 border-2 border-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all duration-200 active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors duration-200 gap-[5px]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block h-[2px] bg-gray-800 transition-all duration-300 origin-center ${
                menuOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'
              }`}
            />
            <span
              className={`block h-[2px] bg-gray-800 transition-all duration-200 ${
                menuOpen ? 'w-0 opacity-0' : 'w-5 opacity-100'
              }`}
            />
            <span
              className={`block h-[2px] bg-gray-800 transition-all duration-300 origin-center ${
                menuOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-1 shadow-lg">

          {/* Nav Links */}
          {allNavLinks.map((link) => (
            <Link key={link.to} to={link.to} className={mobileNavLinkClass(link.to)}>
              {link.label}
            </Link>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-3">
            {user ? (
              <div className="flex items-center justify-between px-4">
                <span className="text-sm text-gray-500 font-medium">
                  Hi, {user.name?.split(' ')[0] || user.first_name || 'User'} 👋
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-red-600 border-2 border-red-600 rounded-full hover:bg-red-50 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3 px-1">
                <Link
                  to="/login"
                  className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-xl hover:border-red-300 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;