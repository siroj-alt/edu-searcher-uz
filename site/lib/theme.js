// Mavzu (yorug'/qorong'u) sozlamasi: server va mijoz uchun umumiy
export const THEME_KEY = 'es-theme';

// Sahifa chizilishidan oldin ishlaydigan skript: birinchi ochilishda doim yorug' rejim, foydalanuvchi tanlasa o'sha saqlanadi
export const THEME_SCRIPT = `(function(){try{var k='${THEME_KEY}',s=localStorage.getItem(k),t=s==='dark'?'dark':'light';document.documentElement.dataset.theme=t;var c=t==='dark'?'#07130E':'#F5FAF7';var f=function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(x){x.setAttribute('content',c)})};f();document.addEventListener('DOMContentLoaded',f);}catch(e){document.documentElement.dataset.theme='light';}})();`;
