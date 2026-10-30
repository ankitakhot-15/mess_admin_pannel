import { useEffect, useState } from 'react';

export const idOf = (x) => x?._id ?? x?.id;
export const asList = (d) => (Array.isArray(d) ? d : d?.items || d?.users || d?.orders || d?.plans || d?.mavshis || []);
export const money = (n) => (n == null ? '-' : `₹${Number(n).toLocaleString('en-IN')}`);

/** Runs `fn` whenever `deps` change. Returns data/meta/loading/error + reload(). */
export function useApi(fn, deps = []) {
  const [s, setS] = useState({ data: null, meta: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setS((p) => ({ ...p, loading: true, error: '' }));
    fn()
      .then((r) => live && setS({ data: r.data, meta: r.meta, loading: false, error: '' }))
      .catch((e) => live && setS((p) => ({ ...p, loading: false, error: e.message })));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...s, reload: () => setTick((t) => t + 1) };
}
