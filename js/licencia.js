    window.iniciarLicenciaPostIntro = function initLicenciaCR() {
      const TRIAL_KEY = 'rentarent_trial_start_v1';
      const LICENSE_KEY = 'rentarent_license_cr_v1';
      const DEVICE_KEY = 'rentarent_device_id_v1';
      const TRIAL_DAYS = 15;

      if (localStorage.getItem(LICENSE_KEY)) return;

      let deviceId = localStorage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = 'RR-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        localStorage.setItem(DEVICE_KEY, deviceId);
      }

      let start = parseInt(localStorage.getItem(TRIAL_KEY), 10);
      if (!start || isNaN(start)) {
        start = Date.now();
        localStorage.setItem(TRIAL_KEY, String(start));
      }

      const elapsedDays = Math.floor((Date.now() - start) / 86400000);
      const remainingDays = Math.max(0, TRIAL_DAYS - elapsedDays);

      function mostrarModalLicencia(bloqueado) {
        if (document.getElementById('cr-license-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'cr-license-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,25,49,0.96);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML = `
          <div style="background:#1A3D63;border:1px solid rgba(179,207,229,0.22);border-radius:20px;padding:28px 24px;max-width:380px;width:100%;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);">
            <h2 style="color:#F6FAFD;font-size:1.25rem;margin-bottom:8px;font-weight:800;">Activación RentaRent</h2>
            <p style="color:#B3CFE5;font-size:0.88rem;margin-bottom:14px;">
              ${bloqueado ? 'El período de prueba de 15 días ha finalizado. Ingresa tu clave CR para continuar.' : `Te quedan ${remainingDays} días de prueba. Ingresa tu clave CR para activar.`}
            </p>
            <div style="background:#0A1931;border:1px solid rgba(179,207,229,0.2);border-radius:12px;padding:10px 12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <div style="text-align:left;">
                <div style="font-size:0.7rem;color:#B3CFE5;text-transform:uppercase;">Nº de Equipo</div>
                <div id="cr-device-id" style="font-family:monospace;font-size:0.95rem;font-weight:800;color:#F6FAFD;">${deviceId}</div>
              </div>
              <button type="button" id="cr-copy-device" style="padding:6px 10px;border-radius:8px;border:1px solid rgba(179,207,229,0.25);background:#1A3D63;color:#F6FAFD;font-size:0.78rem;font-weight:600;cursor:pointer;">Copiar</button>
            </div>
            <input id="cr-key-input" type="text" placeholder="Clave CR (ej. CR-XXXXXX)" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(179,207,229,0.25);background:#0A1931;color:#F6FAFD;font-size:1rem;margin-bottom:10px;outline:none;box-sizing:border-box;text-transform:uppercase;" />
            <div id="cr-key-error" style="color:#f87171;font-size:0.82rem;margin-bottom:10px;display:none;">Ingresa una clave CR válida (mínimo 6 caracteres, iniciando con CR).</div>
            <button id="cr-key-btn" style="width:100%;padding:12px;border-radius:12px;border:none;background:#10b981;color:#fff;font-size:0.95rem;font-weight:700;cursor:pointer;">Activar Licencia</button>
            ${bloqueado ? '' : '<button id="cr-key-later" style="width:100%;margin-top:8px;padding:10px;border-radius:12px;border:1px solid rgba(179,207,229,0.25);background:transparent;color:#B3CFE5;font-size:0.85rem;cursor:pointer;">Continuar en prueba</button>'}
          </div>
        `;
        document.body.appendChild(overlay);

        const inp = document.getElementById('cr-key-input');
        const btn = document.getElementById('cr-key-btn');
        const err = document.getElementById('cr-key-error');
        const later = document.getElementById('cr-key-later');
        const copyDevBtn = document.getElementById('cr-copy-device');
        if (copyDevBtn) {
          copyDevBtn.addEventListener('click', () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(deviceId).then(() => { copyDevBtn.textContent = 'Copiado'; });
            }
          });
        }

        function validar() {
          const val = (inp.value || '').trim().toUpperCase();
          if (val.startsWith('CR') && val.length >= 6) {
            localStorage.setItem(LICENSE_KEY, val);
            overlay.remove();
            const badge = document.getElementById('trial-badge-btn');
            if (badge) badge.remove();
          } else {
            err.style.display = 'block';
            inp.focus();
          }
        }

        btn.addEventListener('click', validar);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') validar(); });
        if (later) later.addEventListener('click', () => overlay.remove());
        setTimeout(() => inp.focus(), 100);
      }

      if (remainingDays <= 0) {
        mostrarModalLicencia(true);
      } else {
        const themeBtn = document.getElementById('theme-toggle-btn');
        const header = themeBtn ? themeBtn.parentElement : document.querySelector('.app-header');
        if (header) {
          const badge = document.createElement('button');
          badge.id = 'trial-badge-btn';
          badge.className = 'btn btn-secondary btn-sm';
          badge.style.cssText = 'font-size:0.75rem; padding:0.35rem 0.65rem; margin-left:0.4rem; white-space:nowrap;';
          badge.textContent = `Prueba: ${remainingDays}d`;
          badge.title = 'Activar con clave CR';
          badge.onclick = () => mostrarModalLicencia(false);
          header.appendChild(badge);
        }
      }
    };
    // ---- LAUNCHER PWA (INSTALAR EN TELEFONO) ----
    let deferredInstallPrompt = null;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = document.getElementById('install-pwa-btn');
      const themeBtn = document.getElementById('theme-toggle-btn');
      if (btn) {
        btn.style.display = 'inline-flex';
        if (themeBtn) themeBtn.style.marginLeft = '0';
      }
    });

    function instalarPWA() {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => {
          deferredInstallPrompt = null;
          const btn = document.getElementById('install-pwa-btn');
          if (btn) btn.style.display = 'none';
        });
      } else {
        alert('Para instalar en tu teléfono:\n\n• En Android (Chrome): Toca el menú ⋮ → "Instalar aplicación".\n• En iPhone (Safari): Toca Compartir → "Agregar a pantalla de inicio".');
      }
    }

window.RentaRent.licencia = { iniciarLicenciaPostIntro, instalarPWA };
