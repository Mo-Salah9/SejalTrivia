import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';
import { Purchases } from './pages/Purchases';
import { Layout } from './components/Layout';
import { apiService } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = apiService.getToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.clearToken();
    setIsAuthenticated(false);
    setCurrentPage('users');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {currentPage === 'users' && <Users />}
      {currentPage === 'categories' && <Categories />}
      {currentPage === 'purchases' && <Purchases />}
      {currentPage === 'settings' && <Settings />}
    </Layout>
  );
}

export default App;
