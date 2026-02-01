import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Purchase {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  productId: string;
  productName: string;
  gamesAdded: number;
  price: number;
  isUnlimited: boolean;
  platform: string;
  transactionId: string;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getAllPurchases();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.userDisplayName && purchase.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = filterPlatform === 'all' || purchase.platform === filterPlatform;
    const matchesType = filterType === 'all' || 
      (filterType === 'unlimited' && purchase.isUnlimited) ||
      (filterType === 'pack' && !purchase.isUnlimited);
    
    return matchesSearch && matchesPlatform && matchesType;
  });

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalPurchases = purchases.length;
  const unlimitedPurchases = purchases.filter(p => p.isUnlimited).length;
  const packPurchases = purchases.filter(p => !p.isUnlimited).length;
  const totalGamesSold = purchases.filter(p => !p.isUnlimited).reduce((sum, p) => sum + p.gamesAdded, 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading purchases...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
          Purchase History
        </h2>
        <button onClick={loadPurchases} className="btn btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-3">{error}</div>
      )}

      {/* Statistics */}
      <div className="card mb-3">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
              {totalPurchases}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Purchases</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              ${totalRevenue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Revenue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {unlimitedPurchases}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Unlimited</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {packPurchases}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Game Packs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {totalGamesSold}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Games Sold</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by user email, name, product, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-input"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
            <option value="web">Web</option>
          </select>
          <select
            className="form-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="unlimited">Unlimited</option>
            <option value="pack">Game Packs</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Product</th>
                <th>Type</th>
                <th>Games</th>
                <th>Price</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {purchases.length === 0 
                      ? 'No purchases found. Purchases will appear here once users make purchases.'
                      : 'No purchases match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(purchase.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {purchase.userDisplayName || purchase.userEmail}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {purchase.userEmail}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {purchase.productId}
                      </div>
                    </td>
                    <td>
                      {purchase.isUnlimited ? (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#10b981',
                          color: '#fff',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          UNLIMITED
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#3b82f6',
                          color: '#fff',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          PACK
                        </span>
                      )}
                    </td>
                    <td>
                      {purchase.isUnlimited ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>∞</span>
                      ) : (
                        <span style={{ fontWeight: 'bold', color: '#eab308' }}>
                          +{purchase.gamesAdded}
                        </span>
                      )}
                    </td>
                    <td>
                      {purchase.price > 0 ? (
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                          ${purchase.price.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: purchase.platform === 'ios' ? '#000' : 
                                   purchase.platform === 'android' ? '#3ddc84' : '#334155',
                        color: '#fff',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {purchase.platform || 'ios'}
                      </span>
                    </td>
                    <td>
                      {purchase.verified ? (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#10b981',
                          color: '#fff',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          ✓ Verified
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#f59e0b',
                          color: '#fff',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem', 
                        color: '#64748b',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {purchase.transactionId}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
