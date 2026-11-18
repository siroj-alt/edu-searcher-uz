'use client';
import { useState } from 'react';

// Telefon sozlamalaridagi kabi yoqish/o'chirish tugmasi.
// Bosilganda darhol o'tadi; server xato qaytarsa (onChange false qaytarsa yoki xato tashlasa) avvalgi holatiga qaytadi.
export default function Switch({ checked, onChange, label = '', sub = '', disabled = false, ariaLabel = '' }) {
  const [opt, setOpt] = useState(null);
  const [busy, setBusy] = useState(false);
  const val = opt ?? !!checked;
  async function click() {
    if (disabled || busy) return;
    const next = !val;
    setOpt(next); setBusy(true);
    try { navigator.vibrate?.(8); } catch {}
    try { await onChange(next); } catch {}
    setBusy(false); setOpt(null);
  }
  return (
    <button type="button" role="switch" aria-checked={val} aria-label={label ? undefined : ariaLabel} aria-busy={busy || undefined}
      className={'sw' + (label ? ' sw-row' : '') + (busy ? ' busy' : '')} onClick={click} disabled={disabled}>
      {label ? <span className="sw-l"><b>{label}</b>{sub ? <small>{sub}</small> : null}</span> : null}
      <span className="sw-track" aria-hidden="true"><span className="sw-knob" /></span>
    </button>
  );
}
