window.RentaRent = window.RentaRent || {};

    function fmtMonto(amount) {
      return '$' + (amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function calcularNoches(f1, f2) {
      if (!f1 || !f2) return 0;
      const d1 = new Date(f1);
      const d2 = new Date(f2);
      const diff = d2 - d1;
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }

    // POBLAR SELECTS PROPIEDADES

    function formatFechaAR(isoStr) {
      if (!isoStr || !isoStr.includes('-')) return isoStr || '--/--/----';
      const [y, m, d] = isoStr.split('-');
      return `${d}-${m}-${y}`;
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
    // ---- PERMISO DE USO 15 DIAS + CLAVE CR (POSPUESTO POST-INTRO) ----

window.RentaRent.core = { fmtMonto, calcularNoches, formatFechaAR, toggleTheme };
