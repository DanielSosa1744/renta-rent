const GIFTCARD_GRADIENTS = ['linear-gradient(135deg, #7fc0d6 0%, #4b94ad 100%)', 'linear-gradient(135deg, #50A88E 0%, #37826c 100%)', 'linear-gradient(135deg, #45B6C5 0%, #278a99 100%)', 'linear-gradient(135deg, #247D94 0%, #16596b 100%)', 'linear-gradient(135deg, #135069 0%, #0a3447 100%)', 'linear-gradient(135deg, #3293a8 0%, #1d6375 100%)'];
    function renderGiftcards() {
      const grid = document.getElementById('dash-giftcards-grid');
      if (!grid) return;
      grid.innerHTML = '';

      if (properties.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:1rem;">No hay alojamientos. Crea uno con "+ Nuevo Alojamiento".</div>';
        return;
      }

      const mesActual = new Date().toISOString().substring(0, 7);
      const hoyG = new Date().toISOString().substring(0, 10);

      properties.forEach((p, idx) => {
        const card = document.createElement('div');
        card.onclick = () => abrirModalPropDetalle(p.id);

        if (p.modalidad === 'largo_plazo') {
          const meses = p.mesesContrato || ((p.aniosContrato || 2) * 12);
          const pagos = Array.isArray(p.pagosMensuales) ? p.pagosMensuales : [];
          const mesPagado = pagos.some(pg => pg.mes === mesActual);
          const mensual = p.valorMensual || 0;
          card.className = 'giftcard giftcard-lp';
          card.innerHTML = `
            <div>
              <div class="giftcard-top">
                <span class="giftcard-badge giftcard-lp-badge">🏢 LARGO PLAZO • ${meses}m</span>
                <button type="button" class="giftcard-lp-btn" onclick="event.stopPropagation(); abrirModalContratoLP('${p.id}')">📄 Contrato</button>
              </div>
              <div class="giftcard-title">${p.nombre}</div>
              <div class="giftcard-sub">${p.direccion || 'Sin dirección'}</div>
              <div class="giftcard-lp-tenant">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">👤 ${p.inquilinoNombre || 'Sin inquilino asignado'}</span>
                <span style="font-weight:700;color:${mesPagado ? '#34d399' : '#fbbf24'};white-space:nowrap;">${mesPagado ? '✅ Mes al día' : '⏳ Pendiente'}</span>
              </div>
            </div>
            <div class="giftcard-stats" style="border-top-color:rgba(255,198,79,0.22);">
              <span>Cobros: ${pagos.length}/${meses} • ${p.ajusteFrecuencia || 'Semestral'} (${p.ajusteIndice || 'ICL'})</span>
              <span class="giftcard-amount" style="color:#ffd470;">${fmtMonto(mensual)}/mes</span>
            </div>
          `;
        } else {
          const propBookings = bookings.filter(b => b.propertyId === p.id && b.fechaSalida >= hoyG);
          const totalIng = propBookings.reduce((s, b) => s + (b.importeCobrado || 0), 0);
          const grad = GIFTCARD_GRADIENTS[idx % GIFTCARD_GRADIENTS.length];
          card.className = 'giftcard';
          card.style.background = grad;
          card.innerHTML = `
            <div>
              <div class="giftcard-top">
                <span class="giftcard-badge">${p.tipo || 'Alojamiento'}</span>
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
        }
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

      const tempWrap = document.getElementById('prop-det-temporario-wrap');
      const lpWrap = document.getElementById('prop-det-largo-plazo-wrap');
      if (p.modalidad === 'largo_plazo') {
        if (tempWrap) tempWrap.style.display = 'none';
        if (lpWrap) lpWrap.style.display = 'block';
        renderDetalleLargoPlazo(p);
      } else {
        if (tempWrap) tempWrap.style.display = 'block';
        if (lpWrap) lpWrap.style.display = 'none';
        renderCalendarioPropiedad();
        renderReservasPropiedad();
      }
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
  const mesesInput = Math.max(1, parseInt(document.getElementById('prop-meses-contrato')?.value, 10) || 1);
  const fIni = document.getElementById('prop-fecha-inicio')?.value;
  const fFin = document.getElementById('prop-fecha-fin')?.value;
  if (fIni && fFin && fFin > fIni) {
    const [y1, m1, d1] = fIni.split('-').map(Number);
    const [y2, m2, d2] = fFin.split('-').map(Number);
    const meses = (y2 - y1) * 12 + (m2 - m1) + (d2 >= d1 ? 0 : -1);
    if (meses >= 1) return meses;
  }
  return mesesInput;
}

function recalcularIngresoPotencialLargoPlazo(recalcFin = false) {
  const mesesInput = Math.max(1, parseInt(document.getElementById('prop-meses-contrato')?.value, 10) || 1);
  const mensual = Math.max(0, parseFloat(document.getElementById('prop-valor-mensual')?.value) || 0);
  const fIniEl = document.getElementById('prop-fecha-inicio');
  const fFinEl = document.getElementById('prop-fecha-fin');

  if (recalcFin && fIniEl && fIniEl.value && fFinEl) {
    const [y, m, d] = fIniEl.value.split('-').map(Number);
    const finDate = new Date(y, (m - 1) + mesesInput, d);
    const yyyy = finDate.getFullYear();
    const mm = String(finDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finDate.getDate()).padStart(2, '0');
    fFinEl.value = `${yyyy}-${mm}-${dd}`;
  }

  const meses = recalcFin ? mesesInput : calcularMesesContratoPropiedad();
  const ingresoAnual = mensual * Math.min(12, meses);
  const ingresoTotal = mensual * meses;

  const mesesEl = document.getElementById('prop-pot-meses');
  const anualEl = document.getElementById('prop-pot-anual');
  const totalEl = document.getElementById('prop-pot-total');
  const labelAnios = meses >= 12 ? ` (${(meses / 12).toFixed(meses % 12 === 0 ? 0 : 1)} años)` : '';
  if (mesesEl) mesesEl.textContent = `${meses} ${meses === 1 ? 'mes' : 'meses'}${labelAnios}`;
  if (anualEl) anualEl.textContent = fmtMonto(ingresoAnual);
  if (totalEl) totalEl.textContent = fmtMonto(ingresoTotal);
}

function abrirModalPropiedad() {
  document.getElementById('prop-id').value = '';
  document.getElementById('prop-nombre').value = '';
  document.getElementById('prop-direccion').value = '';
  document.getElementById('prop-tipo').value = 'Apartamento';
  const mSel = document.getElementById('prop-modalidad'); if (mSel) mSel.value = 'temporario';
  const mesInp = document.getElementById('prop-meses-contrato'); if (mesInp) mesInp.value = 24;
  const vInp = document.getElementById('prop-valor-mensual'); if (vInp) vInp.value = '';
  const fIni = document.getElementById('prop-fecha-inicio'); if (fIni) fIni.value = new Date().toISOString().substring(0, 10);
  const fFin = document.getElementById('prop-fecha-fin'); if (fFin) fFin.value = '';
  const ajSel = document.getElementById('prop-ajuste-frecuencia'); if (ajSel) ajSel.value = 'Semestral';
  const indSel = document.getElementById('prop-ajuste-indice'); if (indSel) indSel.value = 'ICL';
  const depInp = document.getElementById('prop-deposito'); if (depInp) depInp.value = '';
  const iNom = document.getElementById('prop-inq-nombre'); if (iNom) iNom.value = '';
  const iDni = document.getElementById('prop-inq-dni'); if (iDni) iDni.value = '';
  const iTel = document.getElementById('prop-inq-tel'); if (iTel) iTel.value = '';
  const iMail = document.getElementById('prop-inq-email'); if (iMail) iMail.value = '';
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
  const mesesContrato = Math.max(1, parseInt(document.getElementById('prop-meses-contrato')?.value, 10) || 1);
  const valorMensual = Math.max(0, parseFloat(document.getElementById('prop-valor-mensual')?.value) || 0);
  const fechaInicioContrato = document.getElementById('prop-fecha-inicio')?.value || '';
  const fechaFinContrato = document.getElementById('prop-fecha-fin')?.value || '';
  const ajusteFrecuencia = document.getElementById('prop-ajuste-frecuencia')?.value || 'Semestral';
  const ajusteIndice = document.getElementById('prop-ajuste-indice')?.value || 'ICL';
  const depositoGarantia = Math.max(0, parseFloat(document.getElementById('prop-deposito')?.value) || 0);
  const inquilinoNombre = (document.getElementById('prop-inq-nombre')?.value || '').trim();
  const inquilinoDni = (document.getElementById('prop-inq-dni')?.value || '').trim();
  const inquilinoTel = (document.getElementById('prop-inq-tel')?.value || '').trim();
  const inquilinoEmail = (document.getElementById('prop-inq-email')?.value || '').trim();
  const meses = calcularMesesContratoPropiedad();
  const ingresoPotencial = modalidad === 'largo_plazo' ? valorMensual * meses : 0;

  const idx = properties.findIndex(p => p.id === id);
  const existing = idx !== -1 ? properties[idx] : {};
  const data = {
    activa: true,
    tarifaBase: 0,
    notas: '',
    pagosMensuales: [],
    ...existing,
    id,
    nombre,
    direccion,
    tipo,
    modalidad,
    mesesContrato,
    aniosContrato: Math.max(1, Math.round(mesesContrato / 12)),
    valorMensual,
    fechaInicioContrato,
    fechaFinContrato,
    ajusteFrecuencia,
    ajusteIndice,
    depositoGarantia,
    inquilinoNombre,
    inquilinoDni,
    inquilinoTel,
    inquilinoEmail,
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
  const mesesDef = p.mesesContrato || ((p.aniosContrato || 2) * 12);
  document.getElementById('prop-id').value = p.id;
  document.getElementById('prop-nombre').value = p.nombre;
  document.getElementById('prop-direccion').value = p.direccion || '';
  document.getElementById('prop-tipo').value = p.tipo || 'Apartamento';
  const mSel = document.getElementById('prop-modalidad'); if (mSel) mSel.value = p.modalidad || 'temporario';
  const mesInp = document.getElementById('prop-meses-contrato'); if (mesInp) mesInp.value = mesesDef;
  const vInp = document.getElementById('prop-valor-mensual'); if (vInp) vInp.value = p.valorMensual || '';
  const fIni = document.getElementById('prop-fecha-inicio'); if (fIni) fIni.value = p.fechaInicioContrato || new Date().toISOString().substring(0, 10);
  const fFin = document.getElementById('prop-fecha-fin'); if (fFin) fFin.value = p.fechaFinContrato || '';
  const ajSel = document.getElementById('prop-ajuste-frecuencia'); if (ajSel) ajSel.value = p.ajusteFrecuencia || 'Semestral';
  const indSel = document.getElementById('prop-ajuste-indice'); if (indSel) indSel.value = p.ajusteIndice || 'ICL';
  const depInp = document.getElementById('prop-deposito'); if (depInp) depInp.value = p.depositoGarantia || '';
  const iNom = document.getElementById('prop-inq-nombre'); if (iNom) iNom.value = p.inquilinoNombre || '';
  const iDni = document.getElementById('prop-inq-dni'); if (iDni) iDni.value = p.inquilinoDni || '';
  const iTel = document.getElementById('prop-inq-tel'); if (iTel) iTel.value = p.inquilinoTel || '';
  const iMail = document.getElementById('prop-inq-email'); if (iMail) iMail.value = p.inquilinoEmail || '';
  toggleCamposLargoPlazo();
  recalcularIngresoPotencialLargoPlazo(!p.fechaFinContrato);
  document.getElementById('prop-modal-title').textContent = 'Editar Alojamiento';
  document.getElementById('modal-propiedad').classList.add('open');
}

function renderDetalleLargoPlazo(p) {
  const inqBox = document.getElementById('lp-det-inquilino-box');
  const meses = p.mesesContrato || ((p.aniosContrato || 2) * 12);
  const pagos = Array.isArray(p.pagosMensuales) ? p.pagosMensuales : [];
  const totalCobrado = pagos.reduce((s, pg) => s + (pg.monto || 0), 0);
  const potencial = p.ingresoPotencial || ((p.valorMensual || 0) * meses);

  if (inqBox) {
    inqBox.innerHTML = `
      <div class="profit-row"><span>Inquilino:</span><strong>${p.inquilinoNombre || 'Sin asignar'} ${p.inquilinoDni ? '(' + p.inquilinoDni + ')' : ''}</strong></div>
      <div class="profit-row"><span>Contacto:</span><span>${p.inquilinoTel || 'Sin tel.'}${p.inquilinoEmail ? ' • ' + p.inquilinoEmail : ''}</span></div>
      <div class="profit-row"><span>Período (${meses} meses):</span><span>${p.fechaInicioContrato ? formatFechaAR(p.fechaInicioContrato) : '-'} → ${p.fechaFinContrato ? formatFechaAR(p.fechaFinContrato) : '-'}</span></div>
      <div class="profit-row"><span>Ajuste / Depósito:</span><span>${p.ajusteFrecuencia || 'Semestral'} (${p.ajusteIndice || 'ICL'}) • Dep: ${fmtMonto(p.depositoGarantia || 0)}</span></div>
      <div class="profit-row net"><span>Cobrado vs Potencial:</span><span>${fmtMonto(totalCobrado)} / ${fmtMonto(potencial)}</span></div>
    `;
  }

  const mesInp = document.getElementById('lp-pago-mes');
  const montoInp = document.getElementById('lp-pago-monto');
  if (mesInp && !mesInp.value) mesInp.value = new Date().toISOString().substring(0, 7);
  if (montoInp) montoInp.value = p.valorMensual || '';

  const listEl = document.getElementById('lp-pagos-list');
  if (!listEl) return;
  if (pagos.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:0.9rem;font-size:0.82rem;">Aún no registraste cobros mensuales para este contrato.</div>';
    return;
  }
  const sorted = [...pagos].sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
  listEl.innerHTML = sorted.map(pg => `
    <div class="list-item" style="padding:0.55rem 0.75rem;">
      <div>
        <div style="font-weight:700;font-size:0.85rem;color:var(--text-main);">Mes ${pg.mes}</div>
        <div style="font-size:0.74rem;color:var(--text-muted);">Cobrado: ${pg.fechaPago ? formatFechaAR(pg.fechaPago) : '-'}${pg.nota ? ' • ' + pg.nota : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <span style="font-weight:800;color:#34d399;font-size:0.9rem;">${fmtMonto(pg.monto || 0)}</span>
        <button type="button" class="btn btn-danger btn-sm" style="padding:0.15rem 0.45rem;" onclick="eliminarPagoMensualLP('${p.id}','${pg.id}')">&times;</button>
      </div>
    </div>
  `).join('');
}

function registrarPagoMensualLP() {
  const p = properties.find(x => x.id === propDetalleActualId);
  if (!p) return;
  const mes = document.getElementById('lp-pago-mes')?.value;
  const monto = Math.max(0, parseFloat(document.getElementById('lp-pago-monto')?.value) || 0);
  const nota = (document.getElementById('lp-pago-nota')?.value || '').trim();
  if (!mes || monto <= 0) {
    if (typeof mostrarAlerta === 'function') mostrarAlerta('Ingresá un mes y un monto válido.', 'Datos incompletos');
    return;
  }
  if (!Array.isArray(p.pagosMensuales)) p.pagosMensuales = [];
  p.pagosMensuales.push({
    id: 'pago_' + Date.now(),
    mes,
    monto,
    nota,
    fechaPago: new Date().toISOString().substring(0, 10)
  });
  const notaInp = document.getElementById('lp-pago-nota');
  if (notaInp) notaInp.value = '';
  guardarDatos();
  renderDetalleLargoPlazo(p);
  renderGiftcards();
  renderPropiedades();
}

function eliminarPagoMensualLP(propId, pagoId) {
  const p = properties.find(x => x.id === propId);
  if (!p || !Array.isArray(p.pagosMensuales)) return;
  p.pagosMensuales = p.pagosMensuales.filter(pg => pg.id !== pagoId);
  guardarDatos();
  renderDetalleLargoPlazo(p);
  renderGiftcards();
  renderPropiedades();
}

let contratoPropIdActual = null;
function abrirModalContratoLP(propId) {
  contratoPropIdActual = propId || propDetalleActualId;
  const p = properties.find(x => x.id === contratoPropIdActual);
  if (!p) return;
  try {
    const savedLoc = JSON.parse(localStorage.getItem('rr_locador_info') || '{}');
    const lNom = document.getElementById('con-locador-nombre');
    const lDni = document.getElementById('con-locador-dni');
    const lCiu = document.getElementById('con-ciudad');
    if (lNom && savedLoc.nombre) lNom.value = savedLoc.nombre;
    if (lDni && savedLoc.dni) lDni.value = savedLoc.dni;
    if (lCiu && savedLoc.ciudad) lCiu.value = savedLoc.ciudad;
  } catch (e) {}
  generarTextoContratoLP();
  document.getElementById('modal-contrato-lp').classList.add('open');
}

function generarTextoContratoLP() {
  const p = properties.find(x => x.id === contratoPropIdActual);
  if (!p) return;
  const tipoCon = document.getElementById('con-tipo')?.value || 'vivienda';
  const ciudad = (document.getElementById('con-ciudad')?.value || '').trim() || 'Ciudad Autónoma de Buenos Aires';
  const locadorNom = (document.getElementById('con-locador-nombre')?.value || '').trim() || '[NOMBRE Y APELLIDO DEL LOCADOR]';
  const locadorDni = (document.getElementById('con-locador-dni')?.value || '').trim() || '[DNI / CUIT LOCADOR]';

  try {
    localStorage.setItem('rr_locador_info', JSON.stringify({
      nombre: locadorNom.startsWith('[') ? '' : locadorNom,
      dni: locadorDni.startsWith('[') ? '' : locadorDni,
      ciudad
    }));
  } catch (e) {}

  const locatarioNom = p.inquilinoNombre || '[NOMBRE Y APELLIDO DEL INQUILINO]';
  const locatarioDni = p.inquilinoDni || '[DNI / CUIT INQUILINO]';
  const meses = p.mesesContrato || ((p.aniosContrato || 2) * 12);
  const fIni = p.fechaInicioContrato ? formatFechaAR(p.fechaInicioContrato) : '[FECHA INICIO]';
  const fFin = p.fechaFinContrato ? formatFechaAR(p.fechaFinContrato) : '[FECHA FIN]';
  const canon = fmtMonto(p.valorMensual || 0);
  const deposito = fmtMonto(p.depositoGarantia || 0);
  const freq = p.ajusteFrecuencia || 'Semestral';
  const indice = p.ajusteIndice || 'ICL';
  const destino = tipoCon === 'comercial' ? 'uso comercial / profesional' : 'vivienda familiar permanente';
  const hoyTxt = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  const texto = `CONTRATO DE LOCACIÓN (${tipoCon === 'comercial' ? 'COMERCIAL' : 'VIVIENDA'} - CCyC / DNU 70/2023)

En ${ciudad}, a los ${hoyTxt}, entre ${locadorNom}, DNI/CUIT ${locadorDni} (en adelante "EL LOCADOR"), y ${locatarioNom}, DNI/CUIT ${locatarioDni} (en adelante "EL LOCATARIO"), convienen celebrar el presente Contrato de Locación sujeto a las siguientes cláusulas:

PRIMERA - OBJETO: EL LOCADOR da en locación a EL LOCATARIO el inmueble "${p.nombre}" (${p.tipo || 'Inmueble'}), sito en ${p.direccion || '[DIRECCIÓN DEL INMUEBLE]'}, en buen estado de conservación y funcionamiento.

SEGUNDA - PLAZO: El plazo de la presente locación se fija en ${meses} meses, comenzando el ${fIni} y finalizando el ${fFin}, fecha en la cual EL LOCATARIO deberá restituir el inmueble libre de ocupantes y en las mismas condiciones recibidas.

TERCERA - PRECIO Y FORMA DE PAGO: El canon locativo mensual se pacta en la suma de ${canon}, pagadero por mes adelantado del 1 al 10 de cada mes mediante transferencia bancaria o el medio acordado entre las partes.

CUARTA - ACTUALIZACIÓN DEL CANON: Las partes acuerdan libremente que el valor locativo se actualizará de forma ${freq} tomando como referencia el índice ${indice}.

QUINTA - DEPÓSITO EN GARANTÍA: En garantía del cumplimiento de sus obligaciones, EL LOCATARIO entrega la suma de ${deposito}, la cual será reintegrada al finalizar el contrato previa verificación del estado del inmueble y cancelación de servicios.

SEXTA - DESTINO: El inmueble será destinado exclusivamente a ${destino}, quedando prohibida su sublocación o cesión total o parcial sin autorización escrita de EL LOCADOR.

SÉPTIMA - SERVICIOS Y EXPENSAS: Serán a cargo de EL LOCATARIO el pago de los servicios de energía eléctrica, gas, agua, internet y expensas ordinarias que correspondan al inmueble durante la vigencia del contrato.

OCTAVA - JURISDICCIÓN: Para cualquier divergencia derivada del presente contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de ${ciudad}.

En prueba de conformidad, se firman dos (2) ejemplares de un mismo tenor y a un solo efecto.


_________________________                    _________________________
       EL LOCADOR                                  EL LOCATARIO
${locadorNom}                                ${locatarioNom}`;

  const ta = document.getElementById('contrato-lp-texto');
  if (ta) ta.value = texto;
}

function copiarContratoLP() {
  const ta = document.getElementById('contrato-lp-texto');
  if (!ta) return;
  navigator.clipboard?.writeText(ta.value).then(() => {
    if (typeof mostrarAlerta === 'function') mostrarAlerta('Contrato copiado al portapapeles.', 'Copiado');
  }).catch(() => {
    ta.select();
    document.execCommand('copy');
  });
}

function descargarContratoLP() {
  const ta = document.getElementById('contrato-lp-texto');
  const p = properties.find(x => x.id === contratoPropIdActual);
  if (!ta) return;
  const blob = new Blob([ta.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Contrato_${(p?.nombre || 'Alquiler').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function imprimirContratoLP() {
  const ta = document.getElementById('contrato-lp-texto');
  if (!ta) return;
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  const escaped = ta.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  w.document.write(`<!DOCTYPE html><html><head><title>Contrato de Alquiler</title><style>body{font-family:Georgia,serif;padding:36px;line-height:1.55;font-size:13px;color:#111;white-space:pre-wrap;}</style></head><body>${escaped}<script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close();
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

window.RentaRent.propiedades = {
  renderGiftcards,
  abrirModalPropDetalle,
  renderReservasPropiedad,
  renderPropiedades,
  abrirModalPropiedad,
  guardarPropiedad,
  editarPropiedad,
  eliminarPropiedad,
  duplicarPropiedad,
  toggleEstadoPropiedad,
  toggleCamposLargoPlazo,
  recalcularIngresoPotencialLargoPlazo,
  registrarPagoMensualLP,
  eliminarPagoMensualLP,
  abrirModalContratoLP,
  generarTextoContratoLP,
  copiarContratoLP,
  descargarContratoLP,
  imprimirContratoLP
};