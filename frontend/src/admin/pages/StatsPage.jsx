import { useEffect, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    apiAdminFetchJson('/api/admin/stats')
      .then((res) => {
        if (!mounted) return;
        setStats(res.stats || null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || 'Failed to load statistics');
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div className="admin-card admin-muted">{error}</div>;
  }

  if (!stats) {
    return <div className="admin-card admin-muted">Loading statistics...</div>;
  }

  const modeEntries = Object.entries(stats.mode_breakdown || {});

  return (
    <div className="admin-grid">
      <div className="admin-card admin-metric">
        <div className="admin-metric-label">Total users</div>
        <div className="admin-metric-value">{stats.users_total}</div>
      </div>

      <div className="admin-card admin-metric">
        <div className="admin-metric-label">Active admins</div>
        <div className="admin-metric-value">{stats.admins_total}</div>
      </div>

      <div className="admin-card admin-metric">
        <div className="admin-metric-label">Active analyses</div>
        <div className="admin-metric-value">{stats.active_analyses}</div>
      </div>

      <div className="admin-card admin-metric">
        <div className="admin-metric-label">AI chats</div>
        <div className="admin-metric-value">{stats.chats_total}</div>
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">Users by mode</h3>
        {modeEntries.length === 0 ? (
          <div className="admin-muted">No data</div>
        ) : (
          <div className="admin-list">
            {modeEntries.map(([mode, count]) => (
              <div className="admin-list-row" key={mode}>
                <span>{mode}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">User growth (last 7 days)</h3>
        {(stats.users_growth_7d || []).length === 0 ? (
          <div className="admin-muted">No data for this period</div>
        ) : (
          <div className="admin-list">
            {stats.users_growth_7d.map((item) => (
              <div className="admin-list-row" key={item.date}>
                <span>{item.date}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
