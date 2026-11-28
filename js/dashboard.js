    function cambiarPeriodo(periodo, el) {
      periodoFiltro = periodo;
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderDashboard();
    }

    // HELPER MONEDA & FECHAS

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

      // Lazy-init: renderGraficoDashboard solo al abrir pestaña Gráficos
    }

    // GRAFICO SIMPLE DASHBOARD

window.RentaRent.dashboard = { renderDashboard, cambiarPeriodo };
