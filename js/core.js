window.RentaRent = window.RentaRent || {};

let globalFilter = {
  preset: 'mes',
  desde: '',
  hasta: '',
  propertyId: ''
};

function fmtMonto(amount) {
  return '$' + Math.round(amount || 0).toLocaleString('es-AR');
}

function calcularNoches(f1, f2) {
  if (!f1 || !f2) return 0;
  const d1 = new Date(f1);
  const d2 = new Date(f2);
  const diff = d2 - d1;
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function formatFechaAR(isoStr) {
  if (!isoStr || !isoStr.includes('-')) return isoStr || '--/--/----';
  const [y, m, d] = isoStr.split('-');
  return `${d}-${m}-${y}`;
}

function getRangoFechas(preset, customDesde, customHasta) {
  const hoy = new Date();
  const toISO = (dt) => dt.toISOString().substring(0, 10);
  const y = hoy.getFullYear();
  const m = hoy.getMonth();

  if (preset === 'hoy') {
    const s = toISO(hoy);
    return { desde: s, hasta: s, dias: 1 };
  }
  if (preset === 'semana') {
    const day = hoy.getDay() || 7;
    const ini = new Date(hoy);
    ini.setDate(hoy.getDate() - day + 1);
    const fin = new Date(ini);
    fin.setDate(ini.getDate() + 6);
    return { desde: toISO(ini), hasta: toISO(fin), dias: 7 };
  }
  if (preset === 'mes') {
    const ini = new Date(y, m, 1);
    const fin = new Date(y, m + 1, 0);
    return { desde: toISO(ini), hasta: toISO(fin), dias: fin.getDate() };
  }
  if (preset === 'mes_anterior') {
    const ini = new Date(y, m - 1, 1);
    const fin = new Date(y, m, 0);
    return { desde: toISO(ini), hasta: toISO(fin), dias: fin.getDate() };
  }
  if (preset === 'anio') {
    return { desde: `${y}-01-01`, hasta: `${y}-12-31`, dias: 365 };
  }
  if (preset === '12meses') {
    const ini = new Date(y, m - 11, 1);
    const fin = new Date(y, m + 1, 0);
    return { desde: toISO(ini), hasta: toISO(fin), dias: 365 };
  }
  if (preset === 'trimestre') {
    const qStart = Math.floor(m / 3) * 3;
    const ini = new Date(y, qStart, 1);
    const fin = new Date(y, qStart + 3, 0);
    return { desde: toISO(ini), hasta: toISO(fin), dias: 90 };
  }
  if (preset === 'personalizado') {
    const d1 = customDesde || '1900-01-01';
    const d2 = customHasta || '2100-12-31';
    const n = Math.max(1, calcularNoches(d1, d2) + 1);
    return { desde: d1, hasta: d2, dias: n };
  }
  return { desde: '1900-01-01', hasta: '2100-12-31', dias: 365 };
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('rentarent_theme_v1', isLight ? 'light' : 'dark');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = isLight ? '🌙' : '☀️';
}

(function initThemeAndDatePickers() {
  if (localStorage.getItem('rentarent_theme_v1') === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = '🌙';
  }
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    const openCal = () => {
      if (typeof inp.showPicker === 'function') {
        try { inp.showPicker(); } catch (e) {}
      }
    };
    inp.addEventListener('click', openCal);
    inp.addEventListener('focus', openCal);
  });
})();

window.RentaRent.core = { fmtMonto, calcularNoches, formatFechaAR, getRangoFechas, toggleTheme, globalFilter };

(function initBackHandler() {
  history.replaceState({ root: true }, '');
  history.pushState({ app: true }, '');
  document.addEventListener('click', (e) => {
    if (e.target.closest('.giftcard') || e.target.closest('[onclick*="abrirModal"]') || e.target.closest('[onclick*="abrirHistorial"]')) {
      history.pushState({ modal: true }, '');
    }
  });
  window.addEventListener('popstate', () => {
    const openModals = Array.from(document.querySelectorAll('.modal-overlay.open'));
    if (openModals.length > 0) {
      openModals[openModals.length - 1].classList.remove('open');
      history.pushState({ app: true }, '');
      return;
    }
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id !== 'tab-dashboard') {
      if (typeof switchTab === 'function') switchTab('dashboard');
      history.pushState({ app: true }, '');
      return;
    }
    history.pushState({ app: true }, '');
  });
})();
