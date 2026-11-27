    function cambiarPeriodo(periodo, el) {
      periodoFiltro = periodo;
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderDashboard();
    }

    // HELPER MONEDA & FECHAS

    function calcularRentabilidadReserva(reservaId) {
      const b = bookings.find(x => x.id === reservaId);
      if (!b) return { bruto: 0, comisiones: 0, limpieza: 0, otrosGastos: 0, totalGastos: 0, neto: 0, margen: 0 };

      const resExpenses = expenses.filter(e => e.bookingId === reservaId);
      const bruto = b.importeCobrado || 0;

      let comisiones = 0;
      let limpieza = 0;
      let otrosGastos = 0;

      resExpenses.forEach(e => {
        if (e.categoria.includes('Comisión')) comisiones += e.importe;
        else if (e.categoria === 'Limpieza' || e.categoria === 'Lavandería') limpieza += e.importe;
        else otrosGastos += e.importe;
      });

      const totalGastos = comisiones + limpieza + otrosGastos;
      const neto = bruto - totalGastos;
      const margen = bruto > 0 ? ((neto / bruto) * 100).toFixed(1) : 0;

      return { bruto, comisiones, limpieza, otrosGastos, totalGastos, neto, margen };
    }

    // ==========================================
    // RENDER DASHBOARD
    // ==========================================
    const GIFTCARD_GRADIENTS = [
      'linear-gradient(135deg, #7fc0d6 0%, #4b94ad 100%)',
      'linear-gradient(135deg, #50A88E 0%, #37826c 100%)',
      'linear-gradient(135deg, #45B6C5 0%, #278a99 100%)',
      'linear-gradient(135deg, #247D94 0%, #16596b 100%)',
      'linear-gradient(135deg, #135069 0%, #0a3447 100%)',
      'linear-gradient(135deg, #3293a8 0%, #1d6375 100%)'
    ];


    function renderDashboard() {
      renderGiftcards();
      const hoy = new Date();
      const mesActual = hoy.toISOString().substring(0, 7);
      const anioActual = hoy.getFullYear();

      let resFiltradas = bookings.slice();
      let expFiltradas = expenses.slice();

      if (periodoFiltro === 'mes') {
        resFiltradas = resFiltradas.filter(b => b.fechaEntrada.startsWith(mesActual));
        expFiltradas = expFiltradas.filter(e => e.fecha.startsWith(mesActual));
      } else if (periodoFiltro === 'anio') {
        resFiltradas = resFiltradas.filter(b => b.fechaEntrada.startsWith(anioActual.toString()));
        expFiltradas = expFiltradas.filter(e => e.fecha.startsWith(anioActual.toString()));
      } else if (periodoFiltro === 'trimestre') {
        const mesNum = hoy.getMonth() + 1;
        const qMeses = mesNum <= 3 ? ['01','02','03'] : mesNum <= 6 ? ['04','05','06'] : mesNum <= 9 ? ['07','08','09'] : ['10','11','12'];
        resFiltradas = resFiltradas.filter(b => qMeses.some(m => b.fechaEntrada.startsWith(`${anioActual}-${m}`)));
        expFiltradas = expFiltradas.filter(e => qMeses.some(m => e.fecha.startsWith(`${anioActual}-${m}`)));
      }

      const totalIngresos = resFiltradas.reduce((s, b) => s + b.importeCobrado, 0);
      const totalGastos = expFiltradas.reduce((s, e) => s + e.importe, 0);
      const beneficioNeto = totalIngresos - totalGastos;

      // Días ocupados
      let diasOcupados = 0;
      resFiltradas.forEach(b => {
        diasOcupados += calcularNoches(b.fechaEntrada, b.fechaSalida);
      });

      const diasPeriodo = periodoFiltro === 'mes' ? 30 : periodoFiltro === 'trimestre' ? 90 : 365;
      const capacidadTotalDias = Math.max(1, properties.length) * diasPeriodo;
      const ocupacionPct = Math.min(100, Math.round((diasOcupados / capacidadTotalDias) * 100));
      const adr = diasOcupados > 0 ? Math.round(totalIngresos / diasOcupados) : 0;

      document.getElementById('dash-neto').textContent = fmtMonto(beneficioNeto);
      document.getElementById('dash-ingresos').textContent = fmtMonto(totalIngresos);
      document.getElementById('dash-gastos').textContent = fmtMonto(totalGastos);
      document.getElementById('dash-res-cant').textContent = `${resFiltradas.length} reservas`;
      document.getElementById('dash-ocupacion').textContent = `${ocupacionPct}%`;
      document.getElementById('dash-dias-sub').textContent = `${diasOcupados} noches reservadas`;
      document.getElementById('dash-adr').textContent = fmtMonto(adr);

      // Render proximas reservas (sin reservas pasadas)
      const listEl = document.getElementById('dash-reservas-list');
      const hoyStr = new Date().toISOString().substring(0, 10);
      const ultimas = bookings
        .filter(b => b.fechaSalida >= hoyStr)
        .sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada))
        .slice(0, 6);
      if (ultimas.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No hay próximas reservas. Tocá + para agregar una.</div>';
      } else {
        listEl.innerHTML = ultimas.map(b => {
          const prop = properties.find(p => p.id === b.propertyId);
          return `
            <div class="list-card" onclick="editarReserva('${b.id}')" style="cursor:pointer; padding:0.85rem 1rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <div>
                  <div class="list-card-title" style="font-size:0.95rem;">${prop ? prop.nombre : 'Propiedad'}</div>
                  <div class="list-card-sub" style="margin-top:0.15rem;">${b.huesped || 'Reserva sin nombre'}</div>
                </div>
                <div style="text-align:right; font-size:0.8rem; font-weight:700; color:var(--accent-primary);">
                  ${formatFechaAR(b.fechaEntrada)}<br><span style="color:var(--text-muted); font-weight:500;">al ${formatFechaAR(b.fechaSalida)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Lazy-init: renderGraficoDashboard() se ejecuta al abrir la pestaña Gráficos
    }

    // GRAFICO SIMPLE DASHBOARD

window.RentaRent.dashboard = { renderDashboard, cambiarPeriodo, calcularRentabilidadReserva, abrirDetalleIngresos, abrirDetalleGastos };

    function abrirDetalleIngresos() {
      const listEl = document.getElementById('detalle-ingresos-list');
      const totalEl = document.getElementById('detalle-ingresos-total');
      if (!listEl) return;
      const lista = bookings.slice().sort((a, b) => b.fechaEntrada.localeCompare(a.fechaEntrada));
      const suma = lista.reduce((s, b) => s + (b.importeCobrado || 0), 0);
      if (totalEl) totalEl.textContent = `Total Ingresos (${lista.length} reservas): ${fmtMonto(suma)}`;
      if (lista.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No hay movimientos de ingresos registrados.</div>';
      } else {
        listEl.innerHTML = lista.map(b => {
          const p = properties.find(x => x.id === b.propertyId);
          const totalRes = b.costoTotal || b.importeCobrado || 0;
          const pagado = b.importeCobrado || 0;
          const resta = Math.max(0, totalRes - pagado);
          return `
            <div class="list-card" style="padding:0.85rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                <div>
                  <div style="font-weight:800; font-size:0.92rem; color:var(--text-main);">${p ? p.nombre : 'Propiedad'}</div>
                  <div style="font-size:0.78rem; color:var(--text-muted);">${b.huesped || 'Reserva sin nombre'} • ${b.canal}</div>
                  <div style="font-size:0.74rem; color:var(--text-muted);">${formatFechaAR(b.fechaEntrada)} a ${formatFechaAR(b.fechaSalida)}</div>
                  ${resta > 0 ? `<div style="font-size:0.74rem; color:var(--accent-warning); font-weight:700; margin-top:2px;">Resta pagar: ${fmtMonto(resta)}</div>` : ''}
                </div>
                <div style="text-align:right; font-weight:800; color:#38bdf8; font-size:0.95rem;">+${fmtMonto(pagado)}</div>
              </div>
            </div>
          `;
        }).join('');
      }
      switchTab('ingresos-detalle');
    }

    function abrirDetalleGastos() {
      const listEl = document.getElementById('detalle-gastos-list');
      const totalEl = document.getElementById('detalle-gastos-total');
      if (!listEl) return;
      const lista = expenses.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
      const suma = lista.reduce((s, e) => s + (e.importe || 0), 0);
      if (totalEl) totalEl.textContent = `Total Gastos (${lista.length} movimientos): -${fmtMonto(suma)}`;
      if (lista.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No hay movimientos de gastos registrados.</div>';
      } else {
        listEl.innerHTML = lista.map(e => {
          const p = properties.find(x => x.id === e.propertyId);
          return `
            <div class="list-card" style="padding:0.85rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                <div>
                  <div style="font-weight:800; font-size:0.9rem; color:var(--text-main);">${e.categoria}</div>
                  <div style="font-size:0.78rem; color:var(--text-muted);">${p ? p.nombre : 'General'} • ${formatFechaAR(e.fecha)}</div>
                  ${e.descripcion ? `<div style="font-size:0.75rem; color:var(--text-main); margin-top:2px;">${e.descripcion}</div>` : ''}
                </div>
                <div style="font-weight:800; color:#f87171; font-size:0.95rem;">-${fmtMonto(e.importe || 0)}</div>
              </div>
            </div>
          `;
        }).join('');
      }
      switchTab('gastos-detalle');
    }
