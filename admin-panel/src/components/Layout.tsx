import React from 'react';
import { apiService } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'purchases', label: 'Purchases', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#1e293b',
        borderBottom: '2px solid #eab308',
        padding: '1rem 2rem',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#eab308',
          }}>
            🎮 Sejal Admin Panel
          </h1>

          <button
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '0.5rem',
          padding: '0 2rem',
        }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                padding: '1rem 1.5rem',
                background: currentPage === item.id ? '#0f172a' : 'transparent',
                border: 'none',
                borderBottom: currentPage === item.id ? '3px solid #eab308' : '3px solid transparent',
                color: currentPage === item.id ? '#eab308' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container">
        {children}
      </main>
    </div>
  );
};
