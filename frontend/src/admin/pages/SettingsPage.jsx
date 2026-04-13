import { useCallback, useEffect, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

export default function SettingsPage({ adminUser }) {
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [admins, setAdmins] = useState([]);
  const [grantId, setGrantId] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [settingsRes, adminsRes] = await Promise.all([
        apiAdminFetchJson('/api/admin/settings'),
        apiAdminFetchJson('/api/admin/admins'),
      ]);
      const ai = settingsRes?.settings?.ai || {};
      setModel(ai.model || 'gpt-4o-mini');
      setSystemPrompt(ai.system_prompt || '');
      setAdmins(adminsRes.admins || []);
    } catch (e) {
      setError(e.message || 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await apiAdminFetchJson('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          ai: {
            model: model.trim(),
            system_prompt: systemPrompt,
          },
        }),
      });
      setStatus('Settings saved');
    } catch (e) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const grantAdmin = async () => {
    const userId = Number(grantId);
    if (!userId) return;

    setError('');
    setStatus('');

    try {
      await apiAdminFetchJson('/api/admin/admins/grant', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      setGrantId('');
      setStatus(`Admin access granted: ${userId}`);
      await loadAll();
    } catch (e) {
      setError(e.message || 'Failed to grant admin');
    }
  };

  const revokeAdmin = async (userId) => {
    setError('');
    setStatus('');

    try {
      await apiAdminFetchJson('/api/admin/admins/revoke', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      setStatus(`Admin access revoked: ${userId}`);
      await loadAll();
    } catch (e) {
      setError(e.message || 'Failed to revoke admin');
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <h3 className="admin-section-title">AI settings</h3>
        <div className="admin-field">
          <label className="admin-label">Model</label>
          <input className="admin-input" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-label">System prompt</label>
          <textarea
            className="admin-textarea"
            rows={8}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
        <button className="admin-btn" onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">Grant admin access</h3>
        <div className="admin-inline-form">
          <input
            className="admin-input"
            inputMode="numeric"
            placeholder="Enter user_id"
            value={grantId}
            onChange={(e) => setGrantId(e.target.value.replace(/\D/g, ''))}
          />
          <button className="admin-btn" onClick={grantAdmin}>Grant</button>
        </div>

        <h4 className="admin-subtitle">Current admins</h4>
        <div className="admin-list">
          {admins.map((item) => (
            <div className="admin-list-row" key={item.user_id}>
              <span>
                {item.first_name || item.username || 'Admin'} | {item.user_id}
              </span>
              <button
                className="admin-btn-outline"
                disabled={Number(item.user_id) === Number(adminUser?.user_id)}
                onClick={() => revokeAdmin(item.user_id)}
              >
                Revoke
              </button>
            </div>
          ))}
          {admins.length === 0 ? <div className="admin-muted">No admins in list</div> : null}
        </div>
      </div>

      {error ? <div className="admin-error">{error}</div> : null}
      {status ? <div className="admin-success">{status}</div> : null}
    </div>
  );
}
