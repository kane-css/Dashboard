import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa"; // ✅ Import sun/moon icons
import "../ownercss/Sidebar.css";

export default function Sidebar({ darkMode, setDarkMode }) {
  const tabs = [
    { label: "Dashboard Overview", path: "/dashboard" },
    { label: "View Inventory & Edit", path: "/inventory" },
    { label: "Top Customized Parts", path: "/customized" },
    { label: "Edit Shop Profile", path: "/profile" },
    { label: "Account Settings", path: "/settings" },
  ];

  return (
    <aside className={`sidebar ${darkMode ? "dark" : ""}`}>
      <div className="profile-icon">
        <FontAwesomeIcon icon={faUser} className="user-icon" />
      </div>
      <h2 className="owner-title">OWNER</h2>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `sidebar-tab ${isActive ? "active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* ✅ Dark mode toggle with icon always visible */}
      <button
  className="toggle-btn"
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? (
    <FaMoon size={20} color="#ffffff" />   // white moon in dark mode
  ) : (
    <FaSun size={20} color="#000000" />    // black sun in light mode
  )}
</button>

    </aside>
  );
}
