import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

// Loads `path` with GET. Returns { data, loading, error, reload, setData }.
// Pass null as path to skip loading.
export default function useApi(path, { params } = {}) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const key = path ? `${path}?${JSON.stringify(params || {})}` : null;

  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.get(path, { params });
      setState({ data: res.data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const setData = (data) => setState((s) => ({ ...s, data }));
  return { ...state, reload: load, setData };
}
