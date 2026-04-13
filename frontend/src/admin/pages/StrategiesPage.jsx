import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

const parseIndicators = (item) =>
  String(item?.indicators_list || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export default function StrategiesPage() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await apiAdminFetchJson('/api/admin/strategies');
      setItems(res.strategies || []);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить стратегии');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => items.find((item) => String(item.id) === String(selectedId)) || null,
    [items, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setForm(null);
      return;
    }
    setForm({
      id: selected.id,
      name: selected.name || '',
      icon: selected.icon || '',
      allowed_timeframes: selected.allowed_timeframes || '',
      is_system: Number(selected.is_system) === 1,
      usage_count: Number(selected.usage_count || 0),
      indicators: parseIndicators(selected),
    });
  }, [selected]);

  const openCard = (id) => {
    setSelectedId(id);
    setError('');
    setStatus('');
  };

  const closeCard = () => {
    setSelectedId(null);
    setForm(null);
    setError('');
    setStatus('');
  };

  const save = async () => {
    if (!form) return;
    setError('');
    setStatus('');
    try {
      await apiAdminFetchJson('/api/admin/strategies/update', {
        method: 'POST',
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          icon: form.icon,
          allowed_timeframes: form.allowed_timeframes || '',
          is_system: form.is_system,
        }),
      });
      setStatus(`Стратегия ${form.id} сохранена`);
      await load();
    } catch (e) {
      setError(e.message || 'Не удалось сохранить стратегию');
    }
  };

  const remove = async () => {
    if (!form || Number(form.id) === 1) return;
    setError('');
    setStatus('');
    try {
      await apiAdminFetchJson('/api/admin/strategies/delete', {
        method: 'POST',
        body: JSON.stringify({ id: form.id }),
      });
      setStatus(`Стратегия ${form.id} удалена`);
      await load();
      closeCard();
    } catch (e) {
      setError(e.message || 'Не удалось удалить стратегию');
    }
  };

  if (selected && form) {
    return (
      <div className="admin-card">
        <div className="admin-row-between">
          <h3 className="admin-section-title">Карточка стратегии</h3>
          <button className="admin-btn-outline" onClick={closeCard}>
            ← К списку
          </button>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {status ? <div className="admin-success">{status}</div> : null}

        <div className="admin-field">
          <label className="admin-label">Название</label>
          <input
            className="admin-input"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Иконка</label>
          <input
            className="admin-input"
            value={form.icon}
            onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Таймфреймы</label>
          <input
            className="admin-input"
            value={form.allowed_timeframes}
            onChange={(e) => setForm((prev) => ({ ...prev, allowed_timeframes: e.target.value }))}
          />
        </div>

        <div className="admin-row-between">
          <label className="admin-muted">
            <input
              type="checkbox"
              checked={form.is_system}
              onChange={(e) => setForm((prev) => ({ ...prev, is_system: e.target.checked }))}
            />{' '}
            Системная стратегия
          </label>
          <div className="admin-muted">Используют: {form.usage_count}</div>
        </div>

        <div className="admin-field">
          <label className="admin-label">Подключённые индикаторы</label>
          <div className="admin-chip-list">
            {form.indicators.length ? (
              form.indicators.map((indicator) => (
                <span key={indicator} className="admin-chip">
                  {indicator}
                </span>
              ))
            ) : (
              <span className="admin-muted">Индикаторы не подключены</span>
            )}
          </div>
        </div>

        <div className="admin-row-actions">
          <button className="admin-btn" onClick={save}>
            Сохранить
          </button>
          {Number(form.id) !== 1 ? (
            <button className="admin-btn-outline danger" onClick={remove}>
              Удалить
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h3 className="admin-section-title">Стратегии</h3>
      {error ? <div className="admin-error">{error}</div> : null}
      {status ? <div className="admin-success">{status}</div> : null}

      <div className="admin-entity-list">
        {items.map((item) => {
          const indicators = parseIndicators(item);
          return (
            <button
              key={item.id}
              className="admin-entity-card"
              type="button"
              onClick={() => openCard(item.id)}
            >
              <div className="admin-entity-head">
                <div className="admin-entity-title">
                  <span className="admin-state-icon">{item.icon || '📌'}</span>
                  <span>{item.name || `Стратегия ${item.id}`}</span>
                </div>
                <span className="admin-entity-gear">⚙️</span>
              </div>
              <div className="admin-entity-meta">
                ID: {item.id} | Таймфреймы: {item.allowed_timeframes || '-'} | Используют: {item.usage_count || 0}
              </div>
              <div className="admin-chip-list">
                {indicators.length ? (
                  indicators.map((indicator) => (
                    <span key={`${item.id}-${indicator}`} className="admin-chip">
                      {indicator}
                    </span>
                  ))
                ) : (
                  <span className="admin-muted">Индикаторы не подключены</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!items.length ? <div className="admin-muted">Нет стратегий</div> : null}
    </div>
  );
}

