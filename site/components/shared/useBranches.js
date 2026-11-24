'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const cache = {};
// Markaz filiallari ("Tuman, manzil" ko'rinishida). Bir sahifada bir marta yuklanadi.
export function useBranches(centerId) {
  const [list, setList] = useState(cache[centerId] || null);
  useEffect(() => {
    if (!centerId) return;
    if (cache[centerId]) { setList(cache[centerId]); return; }
    let live = true;
    (async () => {
      const { data } = await supabase.from('branches').select('id,address,district_id').eq('center_id', centerId);
      const ids = [...new Set((data || []).map((b) => b.district_id).filter(Boolean))];
      const ds = ids.length ? await supabase.from('districts').select('id,name').in('id', ids) : { data: [] };
      const dn = Object.fromEntries((ds.data || []).map((d) => [d.id, d.name]));
      const out = (data || []).map((b) => ({ id: b.id, label: [dn[b.district_id], b.address].filter(Boolean).join(', ') || "Manzil ko'rsatilmagan" }))
        .sort((a, b) => a.label.localeCompare(b.label));
      cache[centerId] = out;
      if (live) setList(out);
    })();
    return () => { live = false; };
  }, [centerId]);
  return list;
}
