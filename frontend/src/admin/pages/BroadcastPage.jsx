import { useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

export default function BroadcastPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const message = text.trim();
    if (!message) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiAdminFetchJson('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ text: message }),
      });
      setResult(res.result || null);
      setText('');
    } catch (e) {
      setError(e.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <h3 className="admin-section-title">Broadcast</h3>
      <textarea
        className="admin-textarea"
        rows={8}
        placeholder="Write a message for all users..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="admin-row-between">
        <div className="admin-muted">The message will be sent to every user from the users table.</div>
        <button className="admin-btn" onClick={handleSend} disabled={loading || !text.trim()}>
          {loading ? 'Sending...' : 'Start broadcast'}
        </button>
      </div>

      {error ? <div className="admin-error">{error}</div> : null}
      {result ? (
        <div className="admin-result">
          <div>Total: <strong>{result.total}</strong></div>
          <div>Sent: <strong>{result.sent}</strong></div>
          <div>Failed: <strong>{result.failed}</strong></div>
        </div>
      ) : null}
    </div>
  );
}
