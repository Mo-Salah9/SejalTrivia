import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  provider: string;
  isAdmin: boolean;
  gamesRemaining: number;
  isUnlimited: boolean;
  totalGamesPlayed: number;
  createdAt: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await apiService.updateUser(editingUser.uid, {
        gamesRemaining: editingUser.gamesRemaining,
        isUnlimited: editingUser.isUnlimited,
        isAdmin: editingUser.isAdmin,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
          Users Management
        </h2>
        <button onClick={loadUsers} className="btn btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-3">{error}</div>
      )}

      <div className="card mb-3">
        <input
          type="text"
          className="form-input"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
              {users.length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Users</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {users.filter(u => u.isUnlimited).length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Unlimited</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {users.filter(u => u.isAdmin).length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Admins</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {users.reduce((acc, u) => acc + u.totalGamesPlayed, 0)}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Games</div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Provider</th>
                <th>Games Left</th>
                <th>Total Played</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.uid}>
                  <td>
                    {user.email}
                    {user.isAdmin && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: '#eab308',
                        color: '#0f172a',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td>{user.displayName || '-'}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: user.provider === 'google' ? '#4285f4' : '#334155',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem'
                    }}>
                      {user.provider}
                    </span>
                  </td>
                  <td>
                    {user.isUnlimited ? (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>∞ Unlimited</span>
                    ) : (
                      <span>{user.gamesRemaining}</span>
                    )}
                  </td>
                  <td>{user.totalGamesPlayed}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit User</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingUser.email}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Games Remaining</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingUser.gamesRemaining}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    gamesRemaining: parseInt(e.target.value) || 0
                  })}
                  disabled={editingUser.isUnlimited}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingUser.isUnlimited}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      isUnlimited: e.target.checked
                    })}
                    style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem' }}
                  />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Unlimited Games</span>
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingUser.isAdmin}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      isAdmin: e.target.checked
                    })}
                    style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem' }}
                  />
                  <span style={{ color: '#eab308', fontWeight: 600 }}>Admin Access</span>
                </label>
              </div>

              <div className="alert alert-info">
                <strong>Total Games Played:</strong> {editingUser.totalGamesPlayed}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveUser} className="btn btn-success">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
