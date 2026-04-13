import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

const CHART_W = 760;
const CHART_H = 260;
const CHART_PAD_X = 40;
const CHART_PAD_Y = 24;

const toIsoDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const formatShortDate = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

function buildRangePoints(growthRows, fromDate, toDate) {
  if (!fromDate || !toDate) return [];
  const counts = new Map((growthRows || []).map((row) => [row.date, Number(row.count || 0)]));

  const points = [];
  let cursor = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);

  while (cursor <= end) {
    const iso = toIsoDate(cursor);
    points.push({
      date: iso,
      label: formatShortDate(iso),
      count: counts.get(iso) || 0,
    });
    cursor = shiftDays(cursor, 1);
  }

  return points;
}

function GrowthChart({ points }) {
  if (!points.length) {
    return <div className="admin-muted">Нет данных за выбранный период</div>;
  }

  const innerW = CHART_W - CHART_PAD_X * 2;
  const innerH = CHART_H - CHART_PAD_Y * 2;
  const maxCount = Math.max(1, ...points.map((p) => p.count));
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const graphPoints = points.map((point, idx) => {
    const x = CHART_PAD_X + stepX * idx;
    const y = CHART_PAD_Y + innerH - (point.count / maxCount) * innerH;
    return { ...point, x, y };
  });

  const line = graphPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const area = [
    `${CHART_PAD_X},${CHART_H - CHART_PAD_Y}`,
    ...graphPoints.map((p) => `${p.x},${p.y}`),
    `${CHART_PAD_X + innerW},${CHART_H - CHART_PAD_Y}`,
  ].join(' ');

  return (
    <div className="admin-chart-wrap">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="admin-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(143, 106, 46, 0.35)" />
            <stop offset="100%" stopColor="rgba(143, 106, 46, 0.04)" />
          </linearGradient>
        </defs>

        <line
          x1={CHART_PAD_X}
          y1={CHART_H - CHART_PAD_Y}
          x2={CHART_W - CHART_PAD_X}
          y2={CHART_H - CHART_PAD_Y}
          className="admin-chart-axis"
        />

        {[0, 0.25, 0.5, 0.75, 1].map((k) => {
          const y = CHART_PAD_Y + innerH - innerH * k;
          return (
            <line
              key={k}
              x1={CHART_PAD_X}
              y1={y}
              x2={CHART_W - CHART_PAD_X}
              y2={y}
              className="admin-chart-grid"
            />
          );
        })}

        <polygon points={area} fill="url(#growthFill)" />
        <polyline points={line} className="admin-chart-line" />

        {graphPoints.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="4" className="admin-chart-dot" />
          </g>
        ))}

        {graphPoints.map((point, idx) => {
          const show = graphPoints.length <= 10 || idx % Math.ceil(graphPoints.length / 7) === 0 || idx === graphPoints.length - 1;
          if (!show) return null;
          return (
            <text
              key={`${point.date}-label`}
              x={point.x}
              y={CHART_H - 6}
              textAnchor="middle"
              className="admin-chart-label"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function StatsPage() {
  const now = useMemo(() => new Date(), []);
  const defaultTo = useMemo(() => toIsoDate(now), [now]);
  const defaultFrom = useMemo(() => toIsoDate(shiftDays(now, -6)), [now]);

  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  const loadStats = useCallback(async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (from) query.set('date_from', from);
      if (to) query.set('date_to', to);

      const res = await apiAdminFetchJson(`/api/admin/stats?${query.toString()}`);
      setStats(res.stats || null);

      const apiPeriod = res?.stats?.users_growth_period || {};
      if (apiPeriod.from) setDateFrom(apiPeriod.from);
      if (apiPeriod.to) setDateTo(apiPeriod.to);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(defaultFrom, defaultTo);
  }, [defaultFrom, defaultTo, loadStats]);

  const modeEntries = useMemo(() => Object.entries(stats?.mode_breakdown || {}), [stats]);
  const chartPoints = useMemo(() => buildRangePoints(stats?.users_growth_7d || [], dateFrom, dateTo), [stats, dateFrom, dateTo]);

  const applyRange = () => {
    if (!dateFrom || !dateTo) return;
    loadStats(dateFrom, dateTo);
  };

  const quickRange = (days) => {
    const to = toIsoDate(new Date());
    const from = toIsoDate(shiftDays(new Date(), -(days - 1)));
    setDateFrom(from);
    setDateTo(to);
    loadStats(from, to);
  };

  if (error) {
    return <div className="admin-card admin-error">{error}</div>;
  }

  if (!stats && loading) {
    return <div className="admin-card admin-muted">Загрузка статистики...</div>;
  }

  if (!stats) {
    return <div className="admin-card admin-muted">Нет данных</div>;
  }

  return (
    <div className="admin-stats-layout">
      <section className="admin-stats-metrics">
        <article className="admin-card admin-metric-card">
          <div className="admin-metric-label">Всего пользователей</div>
          <div className="admin-metric-value">{stats.users_total}</div>
        </article>

        <article className="admin-card admin-metric-card">
          <div className="admin-metric-label">Активных админов</div>
          <div className="admin-metric-value">{stats.admins_total}</div>
        </article>

        <article className="admin-card admin-metric-card">
          <div className="admin-metric-label">Активных анализов</div>
          <div className="admin-metric-value">{stats.active_analyses}</div>
        </article>

        <article className="admin-card admin-metric-card">
          <div className="admin-metric-label">AI чатов</div>
          <div className="admin-metric-value">{stats.chats_total}</div>
        </article>
      </section>

      <section className="admin-stats-panels">
        <article className="admin-card admin-chart-card">
          <div className="admin-row-between admin-chart-head">
            <h3 className="admin-section-title">Рост пользователей</h3>
            {loading ? <span className="admin-muted">Обновление...</span> : null}
          </div>

          <div className="admin-date-filter">
            <label className="admin-date-field">
              <span>С</span>
              <input type="date" className="admin-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="admin-date-field">
              <span>По</span>
              <input type="date" className="admin-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            <button className="admin-btn" onClick={applyRange}>Применить</button>
          </div>

          <div className="admin-quick-ranges">
            <button className="admin-btn-outline" onClick={() => quickRange(1)}>Сегодня</button>
            <button className="admin-btn-outline" onClick={() => quickRange(7)}>7 дней</button>
            <button className="admin-btn-outline" onClick={() => quickRange(30)}>30 дней</button>
          </div>

          <GrowthChart points={chartPoints} />
        </article>

        <article className="admin-card">
          <h3 className="admin-section-title">Пользователи по режимам</h3>
          {modeEntries.length === 0 ? (
            <div className="admin-muted">Нет данных</div>
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
        </article>
      </section>
    </div>
  );
}
