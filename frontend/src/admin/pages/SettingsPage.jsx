import { useCallback, useEffect, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

export default function SettingsPage({ adminUser }) {
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [admins, setAdmins] = useState([]);
  const [grantId, setGrantId] = useState('');
  const [streamEnabled, setStreamEnabled] = useState(false);
  const [streamScope, setStreamScope] = useState('all');
  const [streamStrategyId, setStreamStrategyId] = useState('');
  const [streamSignal, setStreamSignal] = useState('BUY');
  const [streamMessage, setStreamMessage] = useState('');
  const [streamStrategies, setStreamStrategies] = useState([]);
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

      const streams = settingsRes?.settings?.streams || {};
      setStreamEnabled(Boolean(Number(streams.is_enabled || 0)));
      setStreamScope((streams.scope || 'all') === 'strategy' ? 'strategy' : 'all');
      setStreamStrategyId(
        streams.strategy_id !== null && streams.strategy_id !== undefined
          ? String(streams.strategy_id)
          : ''
      );
      setStreamSignal((streams.forced_signal || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY');
      setStreamMessage(streams.message || '');
      setStreamStrategies(settingsRes?.settings?.stream_strategies || []);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить настройки');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveSettings = async () => {
    if (streamEnabled && streamScope === 'strategy' && !streamStrategyId) {
      setError('Выберите стратегию для стрима');
      return;
    }

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
          streams: {
            is_enabled: streamEnabled,
            scope: streamScope,
            strategy_id: streamScope === 'strategy' ? Number(streamStrategyId) : null,
            forced_signal: streamSignal,
            message: streamMessage,
          },
        }),
      });
      setStatus('Настройки сохранены');
    } catch (e) {
      setError(e.message || 'Не удалось сохранить настройки');
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
      setStatus(`Админка выдана: ${userId}`);
      await loadAll();
    } catch (e) {
      setError(e.message || 'Не удалось выдать админку');
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
      setStatus(`Админка снята: ${userId}`);
      await loadAll();
    } catch (e) {
      setError(e.message || 'Не удалось снять админку');
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <h3 className="admin-section-title">AI настройки</h3>
        <div className="admin-field">
          <label className="admin-label">Модель</label>
          <input className="admin-input" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-label">Системный промпт</label>
          <textarea
            className="admin-textarea"
            rows={8}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">Стримы</h3>
        <div className="admin-field">
          <label className="admin-label">Режим</label>
          <label className="admin-muted">
            <input
              type="checkbox"
              checked={streamEnabled}
              onChange={(e) => setStreamEnabled(e.target.checked)}
            />{' '}
            {streamEnabled ? 'Включен (анализ берет сигнал из настроек стрима)' : 'Выключен'}
          </label>
        </div>

        <div className="admin-field">
          <label className="admin-label">Применять</label>
          <select
            className="admin-input"
            value={streamScope}
            onChange={(e) => setStreamScope(e.target.value)}
          >
            <option value="all">По всем стратегиям</option>
            <option value="strategy">По выбранной стратегии</option>
          </select>
        </div>

        {streamScope === 'strategy' ? (
          <div className="admin-field">
            <label className="admin-label">Стратегия</label>
            <select
              className="admin-input"
              value={streamStrategyId}
              onChange={(e) => setStreamStrategyId(e.target.value)}
            >
              <option value="">Выберите стратегию</option>
              {streamStrategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {(strategy.icon || '📌') + ' ' + strategy.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="admin-field">
          <label className="admin-label">Что скажет система</label>
          <div className="admin-row-actions">
            <button
              className={`admin-btn-outline ${streamSignal === 'BUY' ? 'active' : ''}`}
              onClick={() => setStreamSignal('BUY')}
            >
              BUY
            </button>
            <button
              className={`admin-btn-outline ${streamSignal === 'SELL' ? 'active' : ''}`}
              onClick={() => setStreamSignal('SELL')}
            >
              SELL
            </button>
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-label">Комментарий стрима (опционально)</label>
          <input
            className="admin-input"
            value={streamMessage}
            onChange={(e) => setStreamMessage(e.target.value)}
            placeholder="Например: Работаем только в SELL до конца сессии"
          />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">Выдать админку</h3>
        <div className="admin-inline-form">
          <input
            className="admin-input"
            inputMode="numeric"
            placeholder="Введите user_id"
            value={grantId}
            onChange={(e) => setGrantId(e.target.value.replace(/\D/g, ''))}
          />
          <button className="admin-btn" onClick={grantAdmin}>Выдать</button>
        </div>

        <h4 className="admin-subtitle">Текущие админы</h4>
        <div className="admin-list">
          {admins.map((item) => (
            <div className="admin-list-row" key={item.user_id}>
              <span>
                {item.first_name || item.username || 'Админ'} | {item.user_id}
              </span>
              <button
                className="admin-btn-outline"
                disabled={Number(item.user_id) === Number(adminUser?.user_id)}
                onClick={() => revokeAdmin(item.user_id)}
              >
                Забрать
              </button>
            </div>
          ))}
          {admins.length === 0 ? <div className="admin-muted">Список админов пуст</div> : null}
        </div>
      </div>

      <div className="admin-card">
        <button className="admin-btn" onClick={saveSettings} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить все настройки'}
        </button>
        {error ? <div className="admin-error">{error}</div> : null}
        {status ? <div className="admin-success">{status}</div> : null}
      </div>
    </div>
  );
}
