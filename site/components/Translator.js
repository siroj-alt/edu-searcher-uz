'use client';
import { useEffect } from 'react';
import { LANG_KEY, tr } from '../lib/i18n';

const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'svg', 'SVG']);
const ATTRS = ['placeholder', 'aria-label', 'title'];

// React allaqachon "jonlantirgan" elementlargina tarjima qilinadi (aks holda gidratsiya xatosi bo'ladi)
const live = (el) => { const ks = Object.keys(el); for (let i = 0; i < ks.length; i++) if (ks[i].startsWith('__reactFiber$')) return true; return false; };
const skipEl = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { if (SKIP.has(e.tagName) || e.isContentEditable || e.hasAttribute('data-notr') || e.hidden) return true; } return false; };

export function getLang() {
  try { return localStorage.getItem(LANG_KEY) === 'ru' ? 'ru' : 'uz'; } catch { return 'uz'; }
}

// Ruscha rejimda sahifa matnlarini lug'at bo'yicha almashtiradi va yangi paydo bo'lgan matnlarni ham kuzatadi
export default function Translator() {
  useEffect(() => {
    let obs = null, timer = null, tries = 0;
    const pending = new Set();
    const done = () => document.documentElement.classList.remove('i18n-wait');

    const doText = (n) => {
      const p = n.parentElement;
      if (!p || skipEl(p)) return;
      if (!live(p)) { pending.add(n); return; }
      const v = n.nodeValue; const r = tr(v);
      if (r != null && r !== v) n.nodeValue = r;
    };
    const doEl = (el) => {
      if (skipEl(el)) return;
      if (!live(el)) { pending.add(el); return; }
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v) { const r = tr(v); if (r != null && r !== v) el.setAttribute(a, r); }
      }
    };
    const walk = (root) => {
      if (root.nodeType === 3) return doText(root);
      if (root.nodeType !== 1) return;
      if (ATTRS.some((a) => root.hasAttribute(a))) doEl(root);
      root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(doEl);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (/[A-Za-z]/.test(t.nodeValue) ? 1 : 3) });
      let t; while ((t = w.nextNode())) doText(t);
    };
    const doTitle = () => {
      const parts = document.title.split(' | ');
      const out = parts.map((p) => tr(p) ?? p).join(' | ');
      if (out !== document.title) document.title = out;
    };
    const retry = () => {
      timer = null;
      const list = [...pending]; pending.clear();
      for (const n of list) if (n.isConnected) (n.nodeType === 3 ? doText(n) : doEl(n));
      if (pending.size && tries++ < 40) timer = setTimeout(retry, 250);
    };
    const start = () => {
      document.documentElement.lang = 'ru';
      walk(document.body); doTitle(); done();
      if (pending.size) timer = setTimeout(retry, 200);
      let q = [], raf = 0;
      obs = new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === 'characterData') q.push(m.target);
          else if (m.type === 'attributes') q.push(m.target);
          else m.addedNodes.forEach((x) => q.push(x));
        }
        if (!raf) raf = requestAnimationFrame(() => {
          raf = 0; const l = q; q = [];
          for (const n of l) if (n.isConnected) (n.nodeType === 1 && l.length && n.tagName !== 'TITLE' ? walk(n) : n.nodeType === 3 ? doText(n) : null);
          doTitle();
          if (pending.size && !timer) { tries = 0; timer = setTimeout(retry, 200); }
        });
      });
      obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      const head = document.querySelector('title');
      if (head) obs.observe(head, { childList: true, characterData: true, subtree: true });
    };

    const on = () => { if (!obs) start(); };
    if (getLang() === 'ru') on(); else done();
    const h = (e) => { if (e.detail === 'ru') on(); };
    window.addEventListener('es-lang', h);
    return () => { window.removeEventListener('es-lang', h); obs?.disconnect(); clearTimeout(timer); };
  }, []);
  return null;
}
