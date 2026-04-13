import { useCallback, useEffect, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

export default function StrategiesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await apiAdminFetchJson('/api/admin/strategies');
      setItems(res.strategies || []);
    } catch (e) {
      setError(e.message || 'Failed to load strategies');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const save = async (item) => {
    setError('');
    setStatus('');
    try {
      await apiAdminFetchJson('/api/admin/strategies/update', {
        method: 'POST',
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          icon: item.icon,
          allowed_timeframes: item.allowed_timeframes || '',
          is_system: Number(item.is_system) === 1,
        }),
      });
      setStatus(`Strategy ${item.id} saved`);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to save strategy');
    }
  };

  const remove = async (id) => {
    setError('');
    setStatus('');
    try {
      await apiAdminFetchJson('/api/admin/strategies/delete', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      setStatus(`Strategy ${id} deleted`);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to delete strategy');
    }
  };

  return (
    <div className="admin-card">
      <h3 className="admin-section-title">Strategies</h3>
      {error ? <div className="admin-error">{error}</div> : null}
      {status ? <div className="admin-success">{status}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Icon</th>
              <th>Timeframes</th>
              <th>System</th>
              <th>Usage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  <input
                    className="admin-input compact"
                    value={item.name || ''}
                    onChange={(e) => updateField(item.id, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="admin-input compact"
                    value={item.icon || ''}
                    onChange={(e) => updateField(item.id, 'icon', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="admin-input compact"
                    value={item.allowed_timeframes || ''}
                    onChange={(e) => updateField(item.id, 'allowed_timeframes', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={Number(item.is_system) === 1}
                    onChange={(e) => updateField(item.id, 'is_system', e.target.checked ? 1 : 0)}
                  />
                </td>
                <td>{item.usage_count || 0}</td>
                <td>
                  <div className="admin-row-actions">
                    <button className="admin-btn-outline" onClick={() => save(item)}>Save</button>
                    {Number(item.id) !== 1 ? (
                      <button className="admin-btn-outline danger" onClick={() => remove(item.id)}>Delete</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-muted">No strategies</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
