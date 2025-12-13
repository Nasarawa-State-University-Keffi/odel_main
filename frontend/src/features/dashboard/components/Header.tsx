import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";

const Header = () => {
  const location = useLocation();

  const [open, setOpen] = useState(false);      // Mobile menu
  const [dropdown, setDropdown] = useState(false); // Dropdown
  const dropdownRef = useRef(null);

  // Simulated user from cookies
  const storedUserStr = Cookies.get("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};
  const username = storedUser.name || "GUEST";

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    window.location.href = "/login";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="px-4 py-2 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <img
            src="https://ug.nsuk.edu.ng/api/global/logo"
            alt="NSUK Logo"
            className="h-10 w-10"
          />
          <h1 className="text-lg font-semibold">NSUK - Application</h1>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/dashboard"
            className={`text-sm hover:text-teal-600 ${location.pathname === "/dashboard"
                ? "text-teal-600 underline"
                : "text-muted-foreground"
              }`}
          >
            Dashboard
          </Link>

          <Link
            to="/application"
            className={`text-sm hover:text-teal-600 ${location.pathname === "/application"
                ? "text-teal-600 underline"
                : "text-muted-foreground"
              }`}
          >
            Application
          </Link>

          <Link
            to="/data-correction"
            className={`text-sm hover:text-teal-600 ${location.pathname === "/data-correction"
                ? "text-teal-600 underline"
                : "text-muted-foreground"
              }`}
          >
            Data Correction
          </Link>

          {/* DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdown(!dropdown)}
              className="flex items-center gap-1 text-sm font-medium"
            >
              {username.toUpperCase()}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${dropdown ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>

            {dropdown && (
              <div className="absolute right-0 mt-2 bg-white shadow-md border rounded-md w-36 p-2 animate-fadeIn">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* MOBILE BUTTON */}
        <button
          className="md:hidden p-2 rounded-md text-gray-700"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden border-t bg-white px-6 py-4 space-y-4 animate-fadeIn">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className={`block text-sm ${location.pathname === "/dashboard"
                ? "text-teal-600 underline"
                : "text-muted-foreground"
              }`}
          >
            Dashboard
          </Link>

          <Link
            to="/application"
            onClick={() => setOpen(false)}
            className={`block text-sm ${location.pathname === "/application"
                ? "text-teal-600 underline"
                : "text-muted-foreground"
              }`}
          >
            Application
          </Link>

          <Link
            to="/data-correction"
            onClick={() => setOpen(false)}
            className={`block text-sm ${location.pathname === "/data-correction"
                ? "text-teal-600 underline"
                : "text-muted-foreground"
              }`}
          >
            Data Correction
          </Link>

          {/* MOBILE DROPDOWN */}
          <div className="border-t pt-4">
            <button
              onClick={() => setDropdown(!dropdown)}
              className="flex items-center gap-1 text-sm font-medium"
            >
              {username.toUpperCase()}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${dropdown ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>

            {dropdown && (
              <div className="mt-2 bg-white rounded-md border shadow p-2">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
