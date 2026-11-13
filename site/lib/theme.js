// Mavzu (yorug'/qorong'u) sozlamasi: server va mijoz uchun umumiy
export const THEME_KEY = 'es-theme';

// Sahifa chizilishidan oldin ishlaydigan skript: oq "chaqnash" bo'lmasligi uchun
export const THEME_SCRIPT = `(function(){try{var k='${THEME_KEY}',s=localStorage.getItem(k),m=window.matchMedia('(prefers-color-scheme: dark)'),t=s||(m.matches?'dark':'light');document.documentElement.dataset.theme=t;if(s)document.addEventListener('DOMContentLoaded',function(){var c=t==='dark'?'#07130E':'#F5FAF7';document.querySelectorAll('meta[name="theme-color"]').forEach(function(x){x.setAttribute('content',c)})});if(!s&&m.addEventListener)m.addEventListener('change',function(e){if(!localStorage.getItem(k)){var n=e.matches?'dark':'light';document.documentElement.dataset.theme=n;window.dispatchEvent(new CustomEvent('es-theme',{detail:n}));}});}catch(e){document.documentElement.dataset.theme='light';}})();`;
