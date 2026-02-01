import React, { useState } from 'react';

export const Settings: React.FC = () => {
  const [defaultGames, setDefaultGames] = useState(3);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to backend or env variable
    localStorage.setItem('defaultFreeGames', defaultGames.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308', marginBottom: '2rem' }}>
        System Settings
      </h2>

      {saved && (
        <div className="alert alert-success mb-3">
          Settings saved successfully!
        </div>
      )}

      <div className="card" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f1f5f9' }}>
          Default Free Games
        </h3>

        <div className="form-group">
          <label className="form-label">
            Number of free games for new users
          </label>
          <input
            type="number"
            className="form-input"
            value={defaultGames}
            onChange={(e) => setDefaultGames(parseInt(e.target.value) || 0)}
            min="0"
            max="100"
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            New users will start with this many free games
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary">
          💾 Save Settings
        </button>
      </div>

      <div className="card mt-4" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f1f5f9' }}>
          Backend Information
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div>
            <strong style={{ color: '#eab308' }}>API URL:</strong>
            <div style={{ color: '#94a3b8', marginTop: '0.25rem', wordBreak: 'break-all' }}>
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}
            </div>
          </div>
          <div>
            <strong style={{ color: '#eab308' }}>Environment:</strong>
            <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
              {import.meta.env.MODE}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f1f5f9' }}>
          About
        </h3>
        <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
          <strong style={{ color: '#eab308' }}>Trivia Game Admin Panel</strong>
          <br />
          Version 1.0.0
          <br /><br />
          Manage users, categories, questions, and system settings for your trivia game.
        </p>
      </div>
    </div>
  );
};
