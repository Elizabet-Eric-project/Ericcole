import { useCallback, useEffect, useState } from 'react';
import { apiAdminFetchJson } from '../../lib/api';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async (currentSearch = '') => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        limit: '100',
        offset: '0',
        search: currentSearch.trim(),
      });
      const res = await apiAdminFetchJson(`/api/admin/users?${query.toString()}`);
      setUsers(res.users || []);
      setTotal(Number(res.total || 0));
    } catch (e) {
      setError(e.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers('');
  }, [loadUsers]);

  const onSubmit = (e) => {
    e.preventDefault();
    loadUsers(search);
  };

  return (
    <div className="admin-card">
      <div className="admin-row-between">
        <h3 className="admin-section-title">Пользователи</h3>
        <div className="admin-muted">Всего: {total}</div>
      </div>

      <form className="admin-inline-form" onSubmit={onSubmit}>
        <input
          className="admin-input"
          placeholder="ID / username / имя"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="admin-btn" type="submit">Найти</button>
      </form>

      {error ? <div className="admin-error">{error}</div> : null}
      {loading ? <div className="admin-muted">Загрузка...</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Имя</th>
              <th>Режим</th>
              <th>Стратегия</th>
              <th>Админ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.username || '-'}</td>
                <td>{user.first_name || '-'}</td>
                <td>{user.mode || '-'}</td>
                <td>{user.strategy_name || user.strategy_id || '-'}</td>
                <td>{Number(user.is_admin) === 1 ? 'Да' : 'Нет'}</td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-muted">Пользователи не найдены</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
