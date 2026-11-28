const GIFTCARD_GRADIENTS = ['linear-gradient(135deg, #7fc0d6 0%, #4b94ad 100%)', 'linear-gradient(135deg, #50A88E 0%, #37826c 100%)', 'linear-gradient(135deg, #45B6C5 0%, #278a99 100%)', 'linear-gradient(135deg, #247D94 0%, #16596b 100%)', 'linear-gradient(135deg, #135069 0%, #0a3447 100%)', 'linear-gradient(135deg, #3293a8 0%, #1d6375 100%)'];
    function renderGiftcards() {
      const grid = document.getElementById('dash-giftcards-grid');
      if (!grid) return;
      grid.innerHTML = '';

      if (properties.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:1rem;">No hay alojamientos. Crea uno con "+ Nuevo Alojamiento".</div>';
        return;
      }

      properties.forEach((p, idx) => {
        const hoyG = new Date().toISOString().substring(0, 10); const propBookings = bookings.filter(b => b.propertyId === p.id && b.fechaSalida >= hoyG);
        const totalIng = propBookings.reduce((s, b) => s + (b.importeCobrado || 0), 0);
        const grad = GIFTCARD_GRADIENTS[idx % GIFTCARD_GRADIENTS.length];

        const card = document.createElement('div');
        card.className = 'giftcard';
        card.style.background = grad;
        card.onclick = () => abrirModalPropDetalle(p.id);
        card.innerHTML = `
          <div>
            <div class="giftcard-top">
              <span class="giftcard-badge">${p.tipo || 'Alojamiento'}${p.modalidad === 'largo_plazo' ? ' • ' + (p.aniosContrato || 2) + '+ años' : ''}</span>
              <span style="font-size:0.75rem;opacity:0.9;">📅</span>
            </div>
            <div class="giftcard-title">${p.nombre}</div>
            <div class="giftcard-sub">${p.direccion || 'Sin dirección'}</div>
          </div>
          <div class="giftcard-stats">
            <span>${propBookings.length} reserva${propBookings.length === 1 ? '' : 's'}</span>
            <span class="giftcard-amount">$${totalIng.toLocaleString('es-AR')}</span>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    let propDetalleActualId = null;
    let calFechaActual = new Date();
    let highlightedBookingId = null;


    function abrirModalPropDetalle(propId) {
      const p = properties.find(x => x.id === propId);
      if (!p) return;
      propDetalleActualId = propId;
      highlightedBookingId = null;
      calFechaActual = new Date();
      calFechaActual.setDate(1);

      document.getElementById('prop-det-nombre').textContent = p.nombre;
      document.getElementById('prop-det-sub').innerHTML = `${p.tipo || 'Alojamiento'} • ${p.direccion || 'Sin dirección'} <span class="prop-status-badge ${p.activa === false ? 'inactiva' : 'activa'}">${p.activa === false ? 'Inactiva' : 'Activa'}</span>`;

      const informeEl = document.getElementById('prop-det-informe');
      if (informeEl && typeof calcularResumenPropiedad === 'function') {
        const rango = getRangoFechas(globalFilter.preset, globalFilter.desde, globalFilter.hasta);
        const r = calcularResumenPropiedad(propId, rango.desde, rango.hasta, rango.dias);
        informeEl.innerHTML = `
          <div class="profit-breakdown" style="margin-bottom:0.75rem;">
            ${p.modalidad === 'largo_plazo' ? `<div class="profit-row" style="color:var(--accent-primary);"><span>Contrato Largo Plazo (${p.aniosContrato || 2} años):</span><strong>${fmtMonto(p.valorMensual || 0)}/mes • Potencial: ${fmtMonto(p.ingresoPotencial || ((p.valorMensual || 0) * 12 * (p.aniosContrato || 2)))}</strong></div>` : ''}
            <div class="profit-row"><span>Reservas / Noches / Prom.:</span><strong>${r.cantidadReservas} res • ${r.nochesOcupadas}n (${r.promedioEstadia}n/res)</strong></div>
            <div class="profit-row"><span>Ocupación / Rentabilidad:</span><strong>${r.ocupacionPct}% ocup. • ${r.rentabilidadPct}% rent.</strong></div>
            <div class="profit-row"><span>Ingresos Brutos / Comis.:</span><span>${fmtMonto(r.ingresosBrutos)} / -${fmtMonto(r.comisiones)}</span></div>
            <div class="profit-row"><span>Gastos Totales:</span><span style="color:#f87171;">-${fmtMonto(r.gastosTotales)}</span></div>
            ${Object.entries(r.gastosPorCategoria).map(([cat,val])=>`<div class="profit-row" style="font-size:0.76rem;padding-left:0.5rem;"><span>• ${cat}:</span><span style="color:#f87171;">-${fmtMonto(val)}</span></div>`).join('')}<div class="profit-row net"><span>Balance Neto:</span><span>${fmtMonto(r.balanceNeto)}</span></div>
          </div>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.75rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="cerrarModal('modal-prop-detalle');editarPropiedad('${propId}')">Editar</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="duplicarPropiedad('${propId}');cerrarModal('modal-prop-detalle')">Duplicar</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="toggleEstadoPropiedad('${propId}')">${p.activa === false ? 'Activar' : 'Desactivar'}</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="cerrarModal('modal-prop-detalle');eliminarPropiedad('${propId}')">Eliminar</button>
          </div>
        `;
      }

      const btnNueva = document.getElementById('prop-det-nueva-res');
      btnNueva.onclick = () => {
        cerrarModal('modal-prop-detalle');
        abrirModalReserva();
        const sel = document.getElementById('res-propiedad');
        if (sel) sel.value = propId;
      };

      const btnDel = document.getElementById('prop-det-eliminar');
      if (btnDel) {
        btnDel.onclick = () => {
          cerrarModal('modal-prop-detalle');
          eliminarPropiedad(propId);
        };
      }

      renderCalendarioPropiedad();
      renderReservasPropiedad();
      document.getElementById('modal-prop-detalle').classList.add('open');
    }


    function renderReservasPropiedad() {
      const list = document.getElementById('prop-det-reservas');
      if (!list) return;
      const propBookings = bookings
        .filter(b => b.propertyId === propDetalleActualId && b.fechaSalida >= new Date().toISOString().substring(0, 10))
        .sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada));

      if (propBookings.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:1rem;font-size:0.85rem;">Sin reservas registradas para este alojamiento.</div>';
        return;
      }

      list.innerHTML = propBookings.map(b => {
        const noches = calcularNoches(b.fechaEntrada, b.fechaSalida);
        const isSel = b.id === highlightedBookingId;
        return `
          <div class="list-item" onclick="destacarReservaEnCalendario('${b.id}')" style="padding:0.65rem 0.8rem; cursor:pointer; ${isSel ? 'border:1px solid #FFC64F; background:rgba(255,198,79,0.12);' : ''}">
            <div>
              <div style="font-weight:700;font-size:0.88rem;color:var(--text-main);">${b.huesped || 'Reserva sin nombre'}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${formatFechaAR(b.fechaEntrada)} → ${formatFechaAR(b.fechaSalida)} (${noches}n) • ${b.canal}</div>
            </div>
            <div style="font-weight:800;color:var(--accent-primary);font-size:0.9rem;">$${(b.importeCobrado || 0).toLocaleString('es-AR')}</div>
          </div>
        `;
      }).join('');
    }


    function renderPropiedades() {
      const listEl = document.getElementById('propiedades-list');
      if (properties.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No tenés alojamientos registrados. Creá tu primera propiedad para empezar.</div>';
        return;
      }

      listEl.innerHTML = properties.map(p => {
        const hoyG = new Date().toISOString().substring(0, 10); const propBookings = bookings.filter(b => b.propertyId === p.id && b.fechaSalida >= hoyG);
        const propExpenses = expenses.filter(e => e.propertyId === p.id);
        const totalIng = propBookings.reduce((s, b) => s + b.importeCobrado, 0);
        const totalGas = propExpenses.reduce((s, e) => s + e.importe, 0);
        const neto = totalIng - totalGas;

        return `
          <div class="list-card">
            <div class="list-card-header">
              <div>
                <div class="list-card-title">${p.nombre}</div>
                <div class="list-card-sub">${p.tipo} &bull; ${p.direccion}</div>
              </div>
              <span class="channel-badge" style="background:rgba(16,185,129,0.2); color:#10b981;">Activo</span>
            </div>

            <div class="profit-breakdown">
              <div class="profit-row"><span>Reservas Totales:</span> <span>${propBookings.length}</span></div>
              <div class="profit-row"><span>Ingresos Totales:</span> <span>${fmtMonto(totalIng)}</span></div>
              <div class="profit-row"><span>Gastos Acumulados:</span> <span style="color:#f87171;">-${fmtMonto(totalGas)}</span></div>
              <div class="profit-row net"><span>Ganancia Histórica Neta:</span> <span>${fmtMonto(neto)}</span></div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.4rem; margin-top:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="editarPropiedad('${p.id}')">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarPropiedad('${p.id}')">Eliminar</button>
            </div>
          </div>
        `;
      }).join('');
    }

function toggleCamposLargoPlazo() {
  const mod = document.getElementById('prop-modalidad')?.value || 'temporario';
  const box = document.getElementById('prop-largo-plazo-fields');
  if (box) box.style.display = (mod === 'largo_plazo') ? 'block' : 'none';
  if (mod === 'largo_plazo') {
    const fIni = document.getElementById('prop-fecha-inicio');
    const fFin = document.getElementById('prop-fecha-fin');
    const recalcFin = fIni && fIni.value && (!fFin || !fFin.value);
    recalcularIngresoPotencialLargoPlazo(recalcFin);
  }
}

function calcularMesesContratoPropiedad() {
  const anios = Math.max(2, parseInt(document.getElementById('prop-anios-contrato')?.value, 10) || 2);
  const fIni = document.getElementById('prop-fecha-inicio')?.value;
  const fFin = document.getElementById('prop-fecha-fin')?.value;
  if (fIni && fFin && fFin > fIni) {
    const [y1, m1, d1] = fIni.split('-').map(Number);
    const [y2, m2, d2] = fFin.split('-').map(Number);
    const meses = (y2 - y1) * 12 + (m2 - m1) + (d2 >= d1 ? 0 : -1);
    if (meses >= 1) return meses;
  }
  return anios * 12;
}

function recalcularIngresoPotencialLargoPlazo(recalcFin = false) {
  const anios = Math.max(2, parseInt(document.getElementById('prop-anios-contrato')?.value, 10) || 2);
  const mensual = Math.max(0, parseFloat(document.getElementById('prop-valor-mensual')?.value) || 0);
  const fIniEl = document.getElementById('prop-fecha-inicio');
  const fFinEl = document.getElementById('prop-fecha-fin');

  if (recalcFin && fIniEl && fIniEl.value && fFinEl) {
    const [y, m, d] = fIniEl.value.split('-').map(Number);
    const finDate = new Date(y + anios, m - 1, d);
    const yyyy = finDate.getFullYear();
    const mm = String(finDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finDate.getDate()).padStart(2, '0');
    fFinEl.value = `${yyyy}-${mm}-${dd}`;
  }

  const meses = calcularMesesContratoPropiedad();
  const ingresoAnual = mensual * 12;
  const ingresoTotal = mensual * meses;

  const mesesEl = document.getElementById('prop-pot-meses');
  const anualEl = document.getElementById('prop-pot-anual');
  const totalEl = document.getElementById('prop-pot-total');
  if (mesesEl) mesesEl.textContent = `${meses} meses (${(meses / 12).toFixed(meses % 12 === 0 ? 0 : 1)} años)`;
  if (anualEl) anualEl.textContent = fmtMonto(ingresoAnual);
  if (totalEl) totalEl.textContent = fmtMonto(ingresoTotal);
}

function abrirModalPropiedad() {
  document.getElementById('prop-id').value = '';
  document.getElementById('prop-nombre').value = '';
  document.getElementById('prop-direccion').value = '';
  document.getElementById('prop-tipo').value = 'Apartamento';
  const mSel = document.getElementById('prop-modalidad'); if (mSel) mSel.value = 'temporario';
  const aInp = document.getElementById('prop-anios-contrato'); if (aInp) aInp.value = 2;
  const vInp = document.getElementById('prop-valor-mensual'); if (vInp) vInp.value = '';
  const fIni = document.getElementById('prop-fecha-inicio'); if (fIni) fIni.value = new Date().toISOString().substring(0, 10);
  const fFin = document.getElementById('prop-fecha-fin'); if (fFin) fFin.value = '';
  const ajSel = document.getElementById('prop-ajuste-frecuencia'); if (ajSel) ajSel.value = 'Semestral';
  const depInp = document.getElementById('prop-deposito'); if (depInp) depInp.value = '';
  toggleCamposLargoPlazo();
  document.getElementById('prop-modal-title').textContent = 'Nuevo Alojamiento';
  document.getElementById('modal-propiedad').classList.add('open');
}

function guardarPropiedad(e) {
  e.preventDefault();
  const id = document.getElementById('prop-id').value || 'prop_' + Date.now();
  const nombre = document.getElementById('prop-nombre').value.trim();
  const direccion = document.getElementById('prop-direccion').value.trim();
  const tipo = document.getElementById('prop-tipo').value;
  const modalidad = document.getElementById('prop-modalidad')?.value || 'temporario';
  const aniosContrato = Math.max(2, parseInt(document.getElementById('prop-anios-contrato')?.value, 10) || 2);
  const valorMensual = Math.max(0, parseFloat(document.getElementById('prop-valor-mensual')?.value) || 0);
  const fechaInicioContrato = document.getElementById('prop-fecha-inicio')?.value || '';
  const fechaFinContrato = document.getElementById('prop-fecha-fin')?.value || '';
  const ajusteFrecuencia = document.getElementById('prop-ajuste-frecuencia')?.value || 'Semestral';
  const depositoGarantia = Math.max(0, parseFloat(document.getElementById('prop-deposito')?.value) || 0);
  const meses = calcularMesesContratoPropiedad();
  const ingresoPotencial = modalidad === 'largo_plazo' ? valorMensual * meses : 0;

  const idx = properties.findIndex(p => p.id === id);
  const existing = idx !== -1 ? properties[idx] : {};
  const data = {
    activa: true,
    tarifaBase: 0,
    notas: '',
    ...existing,
    id,
    nombre,
    direccion,
    tipo,
    modalidad,
    aniosContrato,
    valorMensual,
    fechaInicioContrato,
    fechaFinContrato,
    ajusteFrecuencia,
    depositoGarantia,
    ingresoPotencial
  };

  if (idx !== -1) properties[idx] = data;
  else properties.push(data);

  guardarDatos();
  cerrarModal('modal-propiedad');
  poblarSelectsPropiedades();
  renderDashboard();
  renderPropiedades();
}

function editarPropiedad(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  document.getElementById('prop-id').value = p.id;
  document.getElementById('prop-nombre').value = p.nombre;
  document.getElementById('prop-direccion').value = p.direccion || '';
  document.getElementById('prop-tipo').value = p.tipo || 'Apartamento';
  const mSel = document.getElementById('prop-modalidad'); if (mSel) mSel.value = p.modalidad || 'temporario';
  const aInp = document.getElementById('prop-anios-contrato'); if (aInp) aInp.value = p.aniosContrato || 2;
  const vInp = document.getElementById('prop-valor-mensual'); if (vInp) vInp.value = p.valorMensual || '';
  const fIni = document.getElementById('prop-fecha-inicio'); if (fIni) fIni.value = p.fechaInicioContrato || new Date().toISOString().substring(0, 10);
  const fFin = document.getElementById('prop-fecha-fin'); if (fFin) fFin.value = p.fechaFinContrato || '';
  const ajSel = document.getElementById('prop-ajuste-frecuencia'); if (ajSel) ajSel.value = p.ajusteFrecuencia || 'Semestral';
  const depInp = document.getElementById('prop-deposito'); if (depInp) depInp.value = p.depositoGarantia || '';
  toggleCamposLargoPlazo();
  recalcularIngresoPotencialLargoPlazo(!p.fechaFinContrato);
  document.getElementById('prop-modal-title').textContent = 'Editar Alojamiento';
  document.getElementById('modal-propiedad').classList.add('open');
}

function eliminarPropiedad(id) { mostrarConfirmacion('¿Eliminar esta propiedad? Se eliminarán también todas sus reservas y gastos vinculados.', () => {
  properties = properties.filter(p => p.id !== id);
  bookings = bookings.filter(b => b.propertyId !== id);
  expenses = expenses.filter(e => e.propertyId !== id);
  guardarDatos();
  poblarSelectsPropiedades();
  renderDashboard();
  renderPropiedades();
}, 'Eliminar Alojamiento'); }
function duplicarPropiedad(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  const copia = { ...p, id: 'prop_' + Date.now(), nombre: p.nombre + ' (Copia)' };
  properties.push(copia);
  guardarDatos();
  poblarSelectsPropiedades();
  renderDashboard();
  renderPropiedades();
}

function toggleEstadoPropiedad(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  p.activa = (p.activa === false);
  guardarDatos();
  poblarSelectsPropiedades();
  renderDashboard();
  renderPropiedades();
  abrirModalPropDetalle(id);
}
function guardarTarifaPropiedad() {
  const p = properties.find(x => x.id === propDetalleActualId);
  if (!p) return;
  const val = Math.max(0, parseFloat(document.getElementById('prop-det-tarifa')?.value) || 0);
  p.tarifaBase = val;
  guardarDatos();
  if (typeof mostrarAlerta === 'function') mostrarAlerta('Tarifa sugerida guardada: ' + fmtMonto(val) + ' / noche', 'Tarifa Actualizada');
}
window.RentaRent.propiedades = { renderGiftcards, abrirModalPropDetalle, renderReservasPropiedad, renderPropiedades, abrirModalPropiedad, guardarPropiedad, editarPropiedad, eliminarPropiedad, duplicarPropiedad, toggleEstadoPropiedad };






