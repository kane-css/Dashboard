import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom';
import '../ownercss/Sidebar.css';


export default function Sidebar() {
  const tabs = [
    { label: 'Dashboard Overview', path: '/dashboard' },
    { label: 'View Inventory & Edit', path: '/inventory' },
    { label: 'Top Customized Parts', path: '/customized' },
    { label: 'Edit Shop Profile', path: '/profile' },
    { label: 'Account Settings', path: '/settings' }
  ];

  const toggleDarkMode = () => {
    document.body.classList.toggle('dark');
  };

  return (
    <aside className="sidebar">
      <div className="profile-icon">
       <FontAwesomeIcon icon={faUser} className="user-icon" />
      </div>
      <h2 className="owner-title">OWNER</h2>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `sidebar-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <button className="toggle-btn" onClick={toggleDarkMode} style={{ marginTop: 'auto' }}>
        🌓
      </button>
    </aside>
  );
}
