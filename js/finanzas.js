// ==========================================
// MODULO FINANZAS & ANALISIS ECONOMICO
// ==========================================
let excelSortCol = 'fecha';
let excelSortDir = 'desc';

function calcularRentabilidadReserva(reservaId) {
  const b = bookings.find(x => x.id === reservaId);
  if (!b) return { bruto: 0, comisiones: 0, limpieza: 0, otrosGastos: 0, totalGastos: 0, neto: 0, margen: 0 };

  const bruto = b.importeCobrado || 0;
  const relExpenses = expenses.filter(e => e.bookingId === reservaId);

  let comisiones = 0, limpieza = 0, otrosGastos = 0;
  relExpenses.forEach(e => {
    const cat = (e.categoria || '').toLowerCase();
    if (cat.includes('comis')) comisiones += e.importe;
    else if (cat.includes('limp')) limpieza += e.importe;
    else otrosGastos += e.importe;
  });

  const totalGastos = comisiones + limpieza + otrosGastos;
  const neto = bruto - totalGastos;
  const margen = bruto > 0 ? Math.round((neto / bruto) * 100) : 0;
  return { bruto, comisiones, limpieza, otrosGastos, totalGastos, neto, margen };
}

function calcularResumenPropiedad(propId, desde, hasta, diasPeriodo = 30) {
  const res = bookings.filter(b => b.propertyId === propId && b.fechaEntrada >= desde && b.fechaEntrada <= hasta);
  const gas = expenses.filter(e => e.propertyId === propId && e.fecha >= desde && e.fecha <= hasta);

  let nochesOcupadas = 0;
  let ingresosBrutos = 0;
  let comisiones = 0;
  res.forEach(b => {
    nochesOcupadas += calcularNoches(b.fechaEntrada, b.fechaSalida);
    ingresosBrutos += (b.importeCobrado || 0);
  });

  const gastosPorCategoria = {};
  let gastosTotales = 0;
  gas.forEach(e => {
    const imp = e.importe || 0;
    gastosTotales += imp;
    if ((e.categoria || '').toLowerCase().includes('comis')) comisiones += imp;
    gastosPorCategoria[e.categoria] = (gastosPorCategoria[e.categoria] || 0) + imp;
  });

  const ingresosNetos = ingresosBrutos - comisiones;
  const balanceNeto = ingresosBrutos - gastosTotales;
  const cantidadReservas = res.length;
  const promedioEstadia = cantidadReservas > 0 ? +(nochesOcupadas / cantidadReservas).toFixed(1) : 0;
  const ocupacionPct = diasPeriodo > 0 ? Math.min(100, Math.round((nochesOcupadas / diasPeriodo) * 100)) : 0;
  const rentabilidadPct = ingresosBrutos > 0 ? Math.round((balanceNeto / ingresosBrutos) * 100) : 0;

  return {
    cantidadReservas, nochesOcupadas, promedioEstadia, ocupacionPct,
    ingresosBrutos, comisiones, ingresosNetos,
    gastosTotales, gastosPorCategoria,
    balanceNeto, rentabilidadPct
  };
}

function aplicarFiltroGlobalFinanzas(preset, btnEl) {
  globalFilter.preset = preset;
  if (btnEl) {
    document.querySelectorAll('#fin-filter-bar .period-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  const customWrap = document.getElementById('fin-custom-dates');
  if (customWrap) customWrap.style.display = (preset === 'personalizado') ? 'flex' : 'none';
  if (preset === 'personalizado') {
    globalFilter.desde = document.getElementById('fin-desde')?.value || '';
    globalFilter.hasta = document.getElementById('fin-hasta')?.value || '';
  }
  renderFinanzasModulo();
}

function ordenarExcelPor(col) {
  if (excelSortCol === col) excelSortDir = (excelSortDir === 'asc' ? 'desc' : 'asc');
  else { excelSortCol = col; excelSortDir = 'asc'; }
  renderGrillaExcel();
}

function renderFinanzasModulo() {
  const rango = getRangoFechas(globalFilter.preset, globalFilter.desde, globalFilter.hasta);
  const propFiltro = document.getElementById('fin-prop-filtro')?.value || '';

  // 1. Consolidado Economico por Propiedad
  const consEl = document.getElementById('fin-consolidado-list');
  if (consEl) {
    let totIng = 0, totGas = 0, totRes = 0;
    const props = propFiltro ? properties.filter(p => p.id === propFiltro) : properties;
    let html = props.map(p => {
      const r = calcularResumenPropiedad(p.id, rango.desde, rango.hasta, rango.dias);
      totIng += r.ingresosBrutos;
      totGas += r.gastosTotales;
      totRes += r.balanceNeto;
      return `
        <div class="list-card" style="padding:0.9rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
            <strong style="font-size:0.95rem;">${p.nombre}</strong>
            <span class="prop-status-badge ${p.activa === false ? 'inactiva' : 'activa'}">${p.activa === false ? 'Inactiva' : 'Activa'}</span>
          </div>
          <div class="profit-breakdown" style="margin-top:0.25rem;">
            <div class="profit-row"><span>Ingresos (${r.cantidadReservas} res / ${r.nochesOcupadas}n • ${r.ocupacionPct}% ocup.):</span><span style="color:#38bdf8;font-weight:700;">${fmtMonto(r.ingresosBrutos)}</span></div>
            <div class="profit-row"><span>Gastos totales:</span><span style="color:#f87171;">-${fmtMonto(r.gastosTotales)}</span></div>
            <div class="profit-row net"><span>Resultado Neto (${r.rentabilidadPct}%):</span><span>${fmtMonto(r.balanceNeto)}</span></div>
          </div>
        </div>
      `;
    }).join('');

    // Gastos generales sin propiedad
    if (!propFiltro) {
      const genGas = expenses.filter(e => !e.propertyId && e.fecha >= rango.desde && e.fecha <= rango.hasta).reduce((s, e) => s + (e.importe || 0), 0);
      if (genGas > 0) {
        totGas += genGas;
        totRes -= genGas;
        html += `<div class="list-card" style="padding:0.75rem;"><div class="profit-row"><span>Gastos Generales (sin propiedad):</span><span style="color:#f87171;">-${fmtMonto(genGas)}</span></div></div>`;
      }
    }

    html += `
      <div class="metric-card highlight" style="margin-top:0.5rem;">
        <div class="metric-label">TOTAL GENERAL (${formatFechaAR(rango.desde)} al ${formatFechaAR(rango.hasta)})</div>
        <div style="display:flex;justify-content:space-between;margin-top:0.4rem;font-size:0.85rem;">
          <span>Ingresos: <strong style="color:#38bdf8;">${fmtMonto(totIng)}</strong></span>
          <span>Gastos: <strong style="color:#f87171;">-${fmtMonto(totGas)}</strong></span>
        </div>
        <div class="metric-value net" style="margin-top:0.3rem;">${fmtMonto(totRes)}</div>
      </div>
    `;
    consEl.innerHTML = html;
  }

  renderGrillaExcel();
}

function renderGrillaExcel() {
  const tbody = document.getElementById('fin-excel-tbody');
  const consTotEl = document.getElementById('fin-consolidado-totales');
  if (!tbody) return;

  const rango = getRangoFechas(globalFilter.preset, globalFilter.desde, globalFilter.hasta);
  const propFiltro = document.getElementById('fin-prop-filtro')?.value || '';
  const q = (document.getElementById('fin-excel-search')?.value || '').trim().toLowerCase();
  const canalFiltro = document.getElementById('fin-canal-filtro')?.value || '';

  let rows = bookings
    .filter(b => b.fechaEntrada >= rango.desde && b.fechaEntrada <= rango.hasta)
    .filter(b => !propFiltro || b.propertyId === propFiltro)
    .filter(b => !canalFiltro || b.canal === canalFiltro)
    .map(b => {
      const p = properties.find(x => x.id === b.propertyId);
      const rent = calcularRentabilidadReserva(b.id);
      const noches = calcularNoches(b.fechaEntrada, b.fechaSalida);
      const total = b.costoTotal || b.importeCobrado || 0;
      const pagado = b.importeCobrado || 0;
      const estado = (total > 0 && pagado < total) ? 'Seña' : 'Pagado';
      return {
        id: b.id,
        fecha: b.fechaEntrada,
        propiedad: p ? p.nombre : 'Propiedad',
        huesped: b.huesped || 'Sin nombre',
        canal: b.canal || '-',
        checkin: b.fechaEntrada,
        checkout: b.fechaSalida,
        noches,
        ingreso: rent.bruto,
        gasto: rent.totalGastos,
        resultado: rent.neto,
        estado
      };
    });

  if (q) {
    rows = rows.filter(r =>
      r.propiedad.toLowerCase().includes(q) ||
      r.huesped.toLowerCase().includes(q) ||
      r.canal.toLowerCase().includes(q) ||
      formatFechaAR(r.fecha).includes(q)
    );
  }

  rows.sort((a, b) => {
    const va = a[excelSortCol], vb = b[excelSortCol];
    const cmp = (typeof va === 'number') ? (va - vb) : String(va).localeCompare(String(vb));
    return excelSortDir === 'asc' ? cmp : -cmp;
  });

  if (consTotEl) {
    const sumIng = rows.reduce((s, r) => s + r.ingreso, 0);
    const sumGas = rows.reduce((s, r) => s + r.gasto, 0);
    const sumRes = rows.reduce((s, r) => s + r.resultado, 0);
    const sumNoches = rows.reduce((s, r) => s + r.noches, 0);
    consTotEl.innerHTML = `Reservas: <strong>${rows.length}</strong> | Noches: <strong>${sumNoches}</strong> | Ingresos: <strong style="color:#38bdf8;">${fmtMonto(sumIng)}</strong> | Gastos: <strong style="color:#f87171;">-${fmtMonto(sumGas)}</strong> | Neto: <strong style="color:var(--accent-primary);">${fmtMonto(sumRes)}</strong>`;
  }

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:1rem;">Sin registros para los filtros seleccionados.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${formatFechaAR(r.fecha)}</td>
      <td>${r.propiedad}</td>
      <td>${r.huesped}</td>
      <td>${r.canal}</td>
      <td>${formatFechaAR(r.checkin)}</td>
      <td>${formatFechaAR(r.checkout)}</td>
      <td>${r.noches}</td>
      <td style="color:#38bdf8;font-weight:700;">${fmtMonto(r.ingreso)}</td>
      <td style="color:#f87171;">-${fmtMonto(r.gasto)}</td>
      <td style="color:var(--accent-primary);font-weight:800;">${fmtMonto(r.resultado)}</td>
      <td>${r.estado}</td>
      <td style="display:flex;gap:0.3rem;"><button type="button" class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;font-size:0.72rem;" onclick="generarTicketReserva('${r.id}')">Ver</button><button type="button" class="btn btn-danger btn-sm" style="padding:0.2rem 0.45rem;font-size:0.72rem;" onclick="eliminarReserva('${r.id}')">X</button></td>
    </tr>
  `).join('');
}

function exportarExcelCSV() {
  const rango = getRangoFechas(globalFilter.preset, globalFilter.desde, globalFilter.hasta);
  const propFiltro = document.getElementById('fin-prop-filtro')?.value || '';
  const canalFiltro = document.getElementById('fin-canal-filtro')?.value || '';
  const rows = bookings
    .filter(b => b.fechaEntrada >= rango.desde && b.fechaEntrada <= rango.hasta)
    .filter(b => !propFiltro || b.propertyId === propFiltro)
    .filter(b => !canalFiltro || b.canal === canalFiltro);

  let csv = '\uFEFFFecha;Propiedad;Huésped;Canal;Check-in;Check-out;Noches;Ingreso;Gasto;Resultado;Estado\r\n';
  rows.forEach(b => {
    const p = properties.find(x => x.id === b.propertyId);
    const rent = calcularRentabilidadReserva(b.id);
    const noches = calcularNoches(b.fechaEntrada, b.fechaSalida);
    const total = b.costoTotal || b.importeCobrado || 0;
    const pagado = b.importeCobrado || 0;
    const estado = (total > 0 && pagado < total) ? 'Seña' : 'Pagado';
    csv += `${formatFechaAR(b.fechaEntrada)};"${p ? p.nombre : 'Propiedad'}";"${b.huesped || 'Sin nombre'}";${b.canal};${formatFechaAR(b.fechaEntrada)};${formatFechaAR(b.fechaSalida)};${noches};${rent.bruto};${rent.totalGastos};${rent.neto};${estado}\r\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Planilla_Finanzas_RentaRent_${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
}

window.RentaRent.finanzas = { calcularRentabilidadReserva, calcularResumenPropiedad, aplicarFiltroGlobalFinanzas, ordenarExcelPor, renderFinanzasModulo, renderGrillaExcel, exportarExcelCSV };
