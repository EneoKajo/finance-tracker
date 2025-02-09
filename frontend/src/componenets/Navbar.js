import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  BarChart2, 
  Target, 
  User,
  Menu,
  X
} from 'lucide-react';
import '../styles/Navbar.css';
import ProfileModal from './ProfileModal';
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    { path: '/', icon: <Home size={24} />, text: 'Dashboard' },
    { path: '/transactions', icon: <Receipt size={24} />, text: 'Transactions' },
    { path: '/analytics', icon: <BarChart2 size={24} />, text: 'Analytics' },
    { path: '/goals', icon: <Target size={24} />, text: 'Goals' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="desktop-nav">
        <div className="profile-section">
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="nav-item"
          >
            <User size={24} />
            <span className="nav-text">Profile</span>
          </button>
        </div>
        <div className="nav-items">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-text">{item.text}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="mobile-nav">
        <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <button 
          onClick={() => setIsProfileModalOpen(true)} 
          className="mobile-profile"
        >
          <User size={24} />
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Profile Modal - single instance outside of nav components */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;