    function switchTab(tabId, btnEl) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

      document.getElementById('tab-' + tabId).classList.add('active');

      if (btnEl) {
        btnEl.classList.add('active');
      } else {
        const navBtns = document.querySelectorAll('.nav-item');
        const tabNames = ['dashboard', 'reservas', 'gastos', 'propiedades', 'reportes'];
        const idx = tabNames.indexOf(tabId);
        if (idx !== -1 && navBtns[idx]) navBtns[idx].classList.add('active');
      }

      if (tabId === 'dashboard') renderDashboard();
      if (tabId === 'reservas') renderReservas();
      if (tabId === 'gastos') renderGastos();
      if (tabId === 'propiedades') renderPropiedades();
      if (tabId === 'reportes' && typeof renderReporte === 'function') renderReporte();
      if (tabId === 'graficos' && typeof renderGraficoDashboard === 'function') renderGraficoDashboard();
      if (tabId === 'finanzas' && typeof renderFinanzasModulo === 'function') renderFinanzasModulo();
    }


    function poblarSelectsPropiedades() {
      const selects = ['res-propiedad', 'gas-propiedad', 'filtro-reserva-prop', 'filtro-gasto-prop', 'rep-prop', 'fin-prop-filtro'];
      selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const val = sel.value;
        let html = (id.startsWith('filtro') || id.startsWith('rep') || id.startsWith('fin')) ? '<option value="">Todas las propiedades</option>' : '';
        properties.forEach(p => {
          html += `<option value="${p.id}">${p.nombre} (${p.tipo})</option>`;
        });
        sel.innerHTML = html;
        if (val) sel.value = val;
      });
      actualizarSelectReservaGasto();
    }

    function actualizarSelectReservaGasto() {
      const propId = document.getElementById('gas-propiedad').value;
      const resSel = document.getElementById('gas-reserva');
      if (!resSel) return;
      let html = '<option value="">-- Gasto General de Propiedad --</option>';
      const propBookings = bookings.filter(b => b.propertyId === propId);
      propBookings.forEach(b => {
        html += `<option value="${b.id}">Reserva: ${b.huesped || 'Huésped'} (${formatFechaAR(b.fechaEntrada)} a ${formatFechaAR(b.fechaSalida)})</option>`;
      });
      resSel.innerHTML = html;
    }

    function poblarSelectAnios() {
      const repSel = document.getElementById('rep-anio');
      if (!repSel) return;
      const currentYear = new Date().getFullYear();
      let html = '';
      for (let y = currentYear; y >= currentYear - 3; y--) {
        html += `<option value="${y}">${y}</option>`;
      }
      repSel.innerHTML = html;
    }

    // ==========================================
    // RENTABILIDAD POR RESERVA (CORE MVP)
function cerrarModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function mostrarAlerta(mensaje, titulo = 'Aviso') {
  document.getElementById('app-dialog-title').textContent = titulo;
  document.getElementById('app-dialog-msg').textContent = mensaje;
  document.getElementById('app-dialog-cancel').style.display = 'none';
  const okBtn = document.getElementById('app-dialog-ok');
  okBtn.className = 'btn btn-primary';
  okBtn.textContent = 'Aceptar';
  okBtn.onclick = () => cerrarModal('modal-app-dialog');
  document.getElementById('modal-app-dialog').classList.add('open');
}

function mostrarConfirmacion(mensaje, onConfirm, titulo = 'Confirmar acción') {
  document.getElementById('app-dialog-title').textContent = titulo;
  document.getElementById('app-dialog-msg').textContent = mensaje;
  document.getElementById('app-dialog-cancel').style.display = 'inline-flex';
  const okBtn = document.getElementById('app-dialog-ok');
  okBtn.className = 'btn btn-danger';
  okBtn.textContent = 'Confirmar';
  okBtn.onclick = () => {
    cerrarModal('modal-app-dialog');
    if (onConfirm) onConfirm();
  };
  document.getElementById('modal-app-dialog').classList.add('open');
}

window.RentaRent.ui = { switchTab, cerrarModal, mostrarAlerta, mostrarConfirmacion, poblarSelectsPropiedades, actualizarSelectReservaGasto, poblarSelectAnios };

