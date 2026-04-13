import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

const ACCESS_STORAGE_KEY = 'admin_system_access_enabled';

export default function SettingsPage({ adminUser }) {
  const [activeSection, setActiveSection] = useState('menu');
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [admins, setAdmins] = useState([]);
  const [grantId, setGrantId] = useState('');

  const [streamEnabled, setStreamEnabled] = useState(false);
  const [streamScope, setStreamScope] = useState('all');
  const [streamStrategyId, setStreamStrategyId] = useState('');
  const [streamSignal, setStreamSignal] = useState('BUY');
  const [streamStrategies, setStreamStrategies] = useState([]);

  const [systemAccessEnabled, setSystemAccessEnabled] = useState(true);

  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ACCESS_STORAGE_KEY);
      if (saved === '0') {
        setSystemAccessEnabled(false);
      }
    } catch {
      // ignore
    }
  }, []);

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
      setStreamStrategies(settingsRes?.settings?.stream_strategies || []);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить настройки');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveSettings = async (source = 'all') => {
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
          },
        }),
      });

      if (source === 'ai') {
        setStatus('Настройки AI чата сохранены');
      } else if (source === 'streams') {
        setStatus('Настройки стримов сохранены');
      } else {
        setStatus('Настройки сохранены');
      }
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

  const toggleSystemAccess = () => {
    const next = !systemAccessEnabled;
    setSystemAccessEnabled(next);
    setError('');
    setStatus(next ? 'Доступ к системе включен (frontend fallback)' : 'Доступ к системе выключен (frontend fallback)');
    try {
      window.localStorage.setItem(ACCESS_STORAGE_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
  };

  const cards = useMemo(
    () => [
      {
        key: 'streams',
        icon: '📡',
        title: 'Стримы',
        subtitle: streamEnabled ? 'Режим включен' : 'Режим выключен',
      },
      {
        key: 'ai',
        icon: '🤖',
        title: 'AI чат',
        subtitle: `Модель: ${model || '-'}`,
      },
      {
        key: 'access',
        icon: systemAccessEnabled ? '✅' : '⛔',
        title: 'Доступ к системе',
        subtitle: systemAccessEnabled ? 'Доступ открыт' : 'Доступ ограничен',
      },
      {
        key: 'admins',
        icon: '🛡️',
        title: 'Выдать админку',
        subtitle: `Текущих админов: ${admins.length}`,
      },
    ],
    [admins.length, model, streamEnabled, systemAccessEnabled]
  );

  const goMenu = () => {
    setActiveSection('menu');
    setError('');
    setStatus('');
  };

  if (activeSection === 'menu') {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h3 className="admin-section-title">Настройки</h3>
          <div className="admin-muted">Откройте карточку нужного раздела</div>

          <div className="admin-settings-menu-grid">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                className="admin-settings-menu-card"
                onClick={() => setActiveSection(card.key)}
              >
                <div className="admin-settings-menu-head">
                  <span className="admin-settings-menu-icon">{card.icon}</span>
                  <span className="admin-settings-menu-title">{card.title}</span>
                </div>
                <div className="admin-settings-menu-subtitle">{card.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {status ? <div className="admin-success">{status}</div> : null}
      </div>
    );
  }

  if (activeSection === 'ai') {
    return (
      <div className="admin-card admin-settings-detail">
        <div className="admin-row-between">
          <h3 className="admin-section-title">AI чат</h3>
          <button className="admin-btn-outline" onClick={goMenu}>← К карточкам</button>
        </div>

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

        <div className="admin-row-actions">
          <button className="admin-btn" onClick={() => saveSettings('ai')} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить AI чат'}
          </button>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {status ? <div className="admin-success">{status}</div> : null}
      </div>
    );
  }

  if (activeSection === 'streams') {
    return (
      <div className="admin-card admin-settings-detail">
        <div className="admin-row-between">
          <h3 className="admin-section-title">Стримы</h3>
          <button className="admin-btn-outline" onClick={goMenu}>← К карточкам</button>
        </div>

        <div className="admin-field">
          <label className="admin-label">Режим</label>
          <label className="admin-muted">
            <input
              type="checkbox"
              checked={streamEnabled}
              onChange={(e) => setStreamEnabled(e.target.checked)}
            />{' '}
            {streamEnabled ? 'Включен (анализ берёт сигнал из настроек стрима)' : 'Выключен'}
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

        <div className="admin-row-actions">
          <button className="admin-btn" onClick={() => saveSettings('streams')} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить стримы'}
          </button>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {status ? <div className="admin-success">{status}</div> : null}
      </div>
    );
  }

  if (activeSection === 'access') {
    return (
      <div className="admin-card admin-settings-detail">
        <div className="admin-row-between">
          <h3 className="admin-section-title">Доступ к системе</h3>
          <button className="admin-btn-outline" onClick={goMenu}>← К карточкам</button>
        </div>

        <div className="admin-field">
          <label className="admin-label">Режим доступа</label>
          <label className="admin-muted">
            <input
              type="checkbox"
              checked={systemAccessEnabled}
              onChange={toggleSystemAccess}
            />{' '}
            {systemAccessEnabled ? 'Доступ открыт' : 'Доступ ограничен'}
          </label>
        </div>

        <div className="admin-muted">
          Сейчас это временный frontend fallback. Когда подключим backend и БД под доступ, логика автоматически переедет сюда.
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {status ? <div className="admin-success">{status}</div> : null}
      </div>
    );
  }

  return (
    <div className="admin-card admin-settings-detail">
      <div className="admin-row-between">
        <h3 className="admin-section-title">Выдать админку</h3>
        <button className="admin-btn-outline" onClick={goMenu}>← К карточкам</button>
      </div>

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

      {error ? <div className="admin-error">{error}</div> : null}
      {status ? <div className="admin-success">{status}</div> : null}
    </div>
  );
}
