'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Xarita: Yandex Xaritalar JS API 2.1 (ObjectManager: minglab nuqta ham silliq ishlaydi).
// Yandex yuklanmasa, OpenStreetMap (Leaflet, canvas) zaxira sifatida ishlaydi.
// Xarita bir marta yaratiladi; filtr o'zgarganda faqat nuqtalar yangilanadi.
const YKEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || '';
const UZ = [41.2, 64.6];
const ACCENT = '#0F7B55';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const popHtml = (p) => {
  const rating = p.rating ? `<span class="pst">★ ${Number(p.rating).toFixed(1)}</span>` : '';
  const route = `https://yandex.uz/maps/?rtext=~${p.lat}%2C${p.lng}&rtt=auto`;
  return `<div class="pop" data-center="${esc(p.centerId)}"><b>${esc(p.name)}</b>${rating}<small>${esc(p.address)}</small>` +
    `<a href="/centers/${esc(p.centerId)}">Batafsil →</a><a href="${route}" target="_blank" rel="noopener noreferrer">Yo'l ko'rsatish</a></div>`;
};
const meHtml = (acc) => `<div class="pop"><b>Siz shu yerdasiz</b><small>Aniqlik: ~${Math.round(acc)} m</small></div>`;
function km(a, b) {
  const R = 6371, t = Math.PI / 180, dLat = (b[0] - a[0]) * t, dLng = (b[1] - a[1]) * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const zoomFor = (acc) => (acc > 3000 ? 12 : acc > 800 ? 14 : 16);
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 760;
const valid = (points) => points.filter((p) => p.lat != null && p.lng != null);

let yPromise = null;
function loadYandex() {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  if (window.ymaps && window.ymaps.Map) return Promise.resolve(window.ymaps);
  if (!yPromise) {
    yPromise = new Promise((resolve, reject) => {
      const fail = (e) => { clearTimeout(timer); yPromise = null; reject(e); };
      const timer = setTimeout(() => fail(new Error('timeout')), 12000);
      const s = document.createElement('script');
      s.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU' + (YKEY ? '&apikey=' + encodeURIComponent(YKEY) : '');
      s.async = true;
      s.onload = () => {
        if (!window.ymaps) return fail(new Error("ymaps yo'q"));
        window.ymaps.ready(() => { clearTimeout(timer); resolve(window.ymaps); }, fail);
      };
      s.onerror = () => fail(new Error('yuklanmadi'));
      document.head.appendChild(s);
    });
  }
  return yPromise;
}

function drawYandex(ymaps, el, first, full) {
  const map = new ymaps.Map(el, {
    center: first.userPos || first.center || UZ,
    zoom: first.userPos || first.center ? first.zoom : 6,
    controls: []
  }, {
    suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true, suppressObsoleteBrowserNotifier: true,
    minZoom: 5, maxZoom: 19, autoFitToViewport: 'always'
  });
  // Sahifa ichidagi xaritada g'ildirak sahifani aylantiradi; bir marta bosilgach xarita kattalashadi.
  if (!full) {
    map.behaviors.disable('scrollZoom');
    map.events.once('click', () => map.behaviors.enable('scrollZoom'));
  }

  const om = new ymaps.ObjectManager({ clusterize: true, gridSize: 64, clusterDisableClickZoom: false, clusterHasBalloon: false });
  om.objects.options.set({ preset: 'islands#dotIcon', iconColor: ACCENT });
  om.clusters.options.set({ preset: 'islands#invertedGreenClusterIcons' });
  map.geoObjects.add(om);
  const extra = new ymaps.GeoObjectCollection();
  map.geoObjects.add(extra);

  let pts = [];
  function setData({ points, userPos, center, zoom, padLeft }, fit) {
    pts = valid(points);
    om.removeAll();
    om.add({
      type: 'FeatureCollection',
      features: pts.map((p, i) => ({
        type: 'Feature', id: i,
        geometry: { type: 'Point', coordinates: [p.lat, p.lng] },
        properties: { balloonContent: popHtml(p), hintContent: esc(p.name) },
        options: { iconColor: p.color || ACCENT }
      }))
    });
    extra.removeAll();
    if (userPos) {
      extra.add(new ymaps.Placemark(userPos,
        { hintContent: 'Siz shu yerdasiz', balloonContent: '<div class="pop"><b>Siz shu yerdasiz</b></div>' },
        { preset: 'islands#geolocationIcon', iconColor: '#228BE6' }));
    }
    if (!fit) return;
    const n = pts.length + (userPos ? 1 : 0);
    if (n > 1) {
      const all = pts.map((p) => [p.lat, p.lng]);
      if (userPos) all.push(userPos);
      let la0 = 90, la1 = -90, lo0 = 180, lo1 = -180;
      for (const [a, b] of all) { if (a < la0) la0 = a; if (a > la1) la1 = a; if (b < lo0) lo0 = b; if (b > lo1) lo1 = b; }
      map.setBounds([[la0, lo0], [la1, lo1]], { checkZoomRange: true, zoomMargin: [70, 40, isMobile() ? 110 : 40, isMobile() ? 30 : padLeft], duration: 300 })
        .then(() => { if (map.getZoom() > 15) map.setZoom(15, { duration: 200 }); });
    } else if (pts.length === 1) {
      map.setCenter([pts[0].lat, pts[0].lng], 15, { duration: 300 });
    } else if (center) {
      map.setCenter(center, zoom, { duration: 300 });
    }
  }
  setData(first, true);

  let me = null, ring = null;
  return {
    setData,
    zoom: (d) => map.setZoom(map.getZoom() + d, { duration: 220, checkZoomRange: true }),
    fit: () => map.container.fitToViewport(),
    destroy: () => map.destroy(),
    showMe(c, acc) {
      if (me) map.geoObjects.remove(me);
      if (ring) map.geoObjects.remove(ring);
      ring = new ymaps.Circle([c, Math.max(acc, 25)], {}, {
        fillColor: '#228BE622', strokeColor: '#228BE6', strokeOpacity: 0.6, strokeWidth: 1, interactivityModel: 'default#transparent'
      });
      me = new ymaps.Placemark(c, { hintContent: 'Siz shu yerdasiz', balloonContent: meHtml(acc) },
        { preset: 'islands#geolocationIcon', iconColor: '#228BE6', zIndex: 2000 });
      map.geoObjects.add(ring); map.geoObjects.add(me);
      map.setCenter(c, zoomFor(acc), { duration: 800, checkZoomRange: true });
    },
    ipLocate: () => ymaps.geolocation.get({ provider: 'yandex', mapStateAutoApply: false })
      .then((r) => r.geoObjects.get(0).geometry.getCoordinates())
  };
}

// Zaxira: OpenStreetMap. Nuqtalar canvas'da chiziladi, shuning uchun minglab nuqtada ham sekinlashmaydi.
async function drawLeaflet(el, first, full) {
  const mod = await import('leaflet');
  const L = mod.default || mod;
  const map = L.map(el, {
    zoomControl: false, scrollWheelZoom: !!full, preferCanvas: true, zoomSnap: 0.5, wheelPxPerZoomLevel: 90,
    inertia: true, inertiaDeceleration: 2600, tapTolerance: 20, minZoom: 5
  }).setView(first.userPos || first.center || UZ, first.userPos || first.center ? first.zoom : 6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, updateWhenZooming: false, keepBuffer: 3, crossOrigin: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  const renderer = L.canvas({ padding: 0.5, tolerance: 6 });
  const layer = L.layerGroup().addTo(map);
  let you = null;

  function setData({ points, userPos, center, zoom, padLeft }, fit) {
    layer.clearLayers();
    const bounds = [];
    for (const p of valid(points)) {
      L.circleMarker([p.lat, p.lng], { renderer, radius: 7, color: '#fff', weight: 2, fillColor: p.color || ACCENT, fillOpacity: 1 })
        .bindPopup(popHtml(p)).addTo(layer);
      bounds.push([p.lat, p.lng]);
    }
    if (you) { you.remove(); you = null; }
    if (userPos) {
      you = L.circleMarker(userPos, { radius: 9, color: '#fff', weight: 3, fillColor: '#228BE6', fillOpacity: 1 })
        .addTo(map).bindPopup('<div class="pop"><b>Siz shu yerdasiz</b></div>');
      bounds.push(userPos);
    }
    if (!fit) return;
    if (bounds.length > 1) {
      map.fitBounds(bounds, { paddingTopLeft: [isMobile() ? 30 : padLeft, 60], paddingBottomRight: [30, isMobile() ? 110 : 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (center) {
      map.setView(center, zoom);
    }
  }
  setData(first, true);
  if (!full) map.once('click', () => map.scrollWheelZoom.enable());

  let me = null, ring = null;
  return {
    setData,
    zoom: (d) => (d > 0 ? map.zoomIn() : map.zoomOut()),
    fit: () => map.invalidateSize(),
    destroy: () => map.remove(),
    showMe(c, acc) {
      if (me) me.remove();
      if (ring) ring.remove();
      ring = L.circle(c, { radius: Math.max(acc, 25), color: '#228BE6', weight: 1, opacity: 0.6, fillOpacity: 0.12, interactive: false }).addTo(map);
      me = L.circleMarker(c, { radius: 9, color: '#fff', weight: 3, fillColor: '#228BE6', fillOpacity: 1 }).addTo(map).bindPopup(meHtml(acc));
      map.flyTo(c, zoomFor(acc), { duration: 0.9 });
    },
    ipLocate: () => Promise.reject(new Error('no ip'))
  };
}

const LOC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';

export default function MapView({ points = [], userPos = null, center = null, zoom = 12, padLeft = 50, className = '', full = false }) {
  const box = useRef(null);
  const el = useRef(null);
  const api = useRef(null);
  const toastTimer = useRef(null);
  const latest = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const key = points.map((p) => p.id).join(',') + '|' + (userPos ? userPos.join(',') : '') + '|' + (center ? center.join(',') : '');
  latest.current = { points, userPos, center, zoom, padLeft };

  // Xarita bir marta yaratiladi (sahifa ichida bo'lsa, ko'rinishga yaqinlashganda)
  useEffect(() => {
    let dead = false, io = null;
    const start = () => {
      if (dead || api.current) return;
      const done = (a, engine) => {
        if (dead) { a.destroy(); return; }
        api.current = a; el.current.dataset.engine = engine; box.current.dataset.engine = engine; setReady(true);
      };
      loadYandex()
        .then((ymaps) => { if (!dead && el.current) done(drawYandex(ymaps, el.current, latest.current, full), 'yandex'); })
        .catch(async (e) => {
          if (dead || !el.current) return;
          console.warn('[EduSearcher] Yandex xaritasi yuklanmadi, zaxira xarita ishlatilmoqda:', e && e.message);
          try { done(await drawLeaflet(el.current, latest.current, full), 'leaflet'); } catch (err) { console.error(err); }
        });
    };
    if (full || !('IntersectionObserver' in window)) start();
    else {
      io = new IntersectionObserver((ents) => { if (ents.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '400px 0px' });
      io.observe(box.current);
    }
    const onResize = () => api.current && api.current.fit();
    window.addEventListener('resize', onResize);
    return () => {
      dead = true;
      if (io) io.disconnect();
      window.removeEventListener('resize', onResize);
      if (api.current) { api.current.destroy(); api.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtr o'zgarsa: xarita qayta yaratilmaydi, faqat nuqtalar almashadi
  const firstKey = useRef(key);
  useEffect(() => {
    if (key === firstKey.current) return;
    firstKey.current = key;
    if (api.current) api.current.setData(latest.current, true);
  }, [key]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function say(t) {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), t.err ? 6000 : 9000);
  }

  function found(c, acc) {
    if (!api.current) return;
    api.current.showMe(c, acc);
    const pts = valid(points);
    if (!pts.length) return say({ text: 'Siz shu yerdasiz' });
    let best = null, bd = Infinity;
    for (const p of pts) { const d = km(c, [p.lat, p.lng]); if (d < bd) { bd = d; best = p; } }
    say({ text: 'Sizga eng yaqin markaz:', name: best.name, dist: bd < 1 ? Math.round(bd * 1000) + ' m' : bd.toFixed(1) + ' km', href: '/centers/' + best.centerId });
  }

  function locate() {
    if (busy || !api.current) return;
    const viaIp = (msg) => api.current.ipLocate()
      .then((c) => found(c, 3000))
      .catch(() => say({ text: msg, err: true }));
    if (!navigator.geolocation) return viaIp('Brauzeringiz joylashuvni aniqlay olmaydi.');
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); found([p.coords.latitude, p.coords.longitude], p.coords.accuracy || 50); },
      (e) => {
        setBusy(false);
        if (e.code === 1) say({ text: 'Joylashuvga ruxsat berilmadi. Brauzer sozlamalarida bu sayt uchun joylashuvga ruxsat bering.', err: true });
        else viaIp("Aniq joylashuv topilmadi, taxminiy joyingiz ko'rsatildi.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  return (
    <div ref={box} className={'leaf ' + className + (ready ? ' ready' : '')}>
      <div ref={el} className="leaf-map" />
      <div className="mzoom">
        <button type="button" onClick={() => api.current && api.current.zoom(1)} disabled={!ready} aria-label="Yaqinlashtirish">+</button>
        <button type="button" onClick={() => api.current && api.current.zoom(-1)} disabled={!ready} aria-label="Uzoqlashtirish">−</button>
      </div>
      <button type="button" className={'myloc' + (busy ? ' busy' : '')} onClick={locate} disabled={!ready} title="Men turgan joy" aria-label="Men turgan joy">
        <i dangerouslySetInnerHTML={{ __html: LOC_ICON }} /><span>{busy ? 'Aniqlanmoqda...' : 'Men turgan joy'}</span>
      </button>
      {toast && (
        <div className={'maptoast' + (toast.err ? ' err' : '')} role="status">
          <span>{toast.text}{toast.name ? <> <b>{toast.name}</b> · {toast.dist}</> : null}</span>
          {toast.href ? <a href={toast.href}>Ko'rish →</a> : null}
          <button type="button" onClick={() => setToast(null)} aria-label="Yopish">×</button>
        </div>
      )}
    </div>
  );
}
