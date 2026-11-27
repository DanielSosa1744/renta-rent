    function renderGraficoDashboard() {
      const ctx = document.getElementById('chartDashboard');
      if (!ctx) return;

      const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const currentYear = new Date().getFullYear();

      const ingPorMes = new Array(12).fill(0);
      const gasPorMes = new Array(12).fill(0);
      const netoPorMes = new Array(12).fill(0);

      bookings.forEach(b => {
        if (b.fechaEntrada.startsWith(currentYear.toString())) {
          const m = parseInt(b.fechaEntrada.substring(5, 7), 10) - 1;
          if (m >= 0 && m < 12) ingPorMes[m] += b.importeCobrado;
        }
      });

      expenses.forEach(e => {
        if (e.fecha.startsWith(currentYear.toString())) {
          const m = parseInt(e.fecha.substring(5, 7), 10) - 1;
          if (m >= 0 && m < 12) gasPorMes[m] += e.importe;
        }
      });

      for (let i = 0; i < 12; i++) {
        netoPorMes[i] = ingPorMes[i] - gasPorMes[i];
      }

      if (chartDashInstance) chartDashInstance.destroy();

      if (typeof Chart !== 'undefined') {
        chartDashInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: mesesLabels,
            datasets: [
              { label: 'Ganancia Neta', data: netoPorMes, backgroundColor: '#10b981', borderRadius: 6 },
              { label: 'Gastos', data: gasPorMes, backgroundColor: '#ef4444', borderRadius: 6 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
            },
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }

    // ==========================================
    // RENDER RESERVAS
    // ==========================================

    function renderReporte() {
      const anio = document.getElementById('rep-anio').value || new Date().getFullYear().toString();
      const propId = document.getElementById('rep-prop').value;

      let bList = bookings.filter(b => b.fechaEntrada.startsWith(anio));
      let eList = expenses.filter(e => e.fecha.startsWith(anio));

      if (propId) {
        bList = bList.filter(b => b.propertyId === propId);
        eList = eList.filter(e => e.propertyId === propId);
      }

      const ing = bList.reduce((s, b) => s + b.importeCobrado, 0);
      const gas = eList.reduce((s, e) => s + e.importe, 0);
      const neto = ing - gas;

      document.getElementById('rep-total-ingres').textContent = fmtMonto(ing);
      document.getElementById('rep-total-gastos').textContent = fmtMonto(gas);
      document.getElementById('rep-total-neto').textContent = fmtMonto(neto);

      // Desglose por categorias
      const catTotals = {};
      eList.forEach(e => {
        catTotals[e.categoria] = (catTotals[e.categoria] || 0) + e.importe;
      });

      const desgloseEl = document.getElementById('rep-cat-desglose');
      const cats = Object.keys(catTotals);
      if (cats.length === 0) {
        desgloseEl.innerHTML = '<div class="empty-state">Sin gastos registrados en este período.</div>';
      } else {
        desgloseEl.innerHTML = cats.map(c => {
          const m = catTotals[c];
          const pct = gas > 0 ? ((m / gas) * 100).toFixed(1) : 0;
          return `
            <div style="background:rgba(15,23,42,0.4); padding:0.6rem 0.8rem; border-radius:8px; margin-bottom:0.4rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;">
                <span>${c}</span>
                <span>${fmtMonto(m)} (${pct}%)</span>
              </div>
              <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; margin-top:0.4rem; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:var(--accent-primary);"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // ==========================================
    // ACCIONES CRUD (RESERVAS)
    // ==========================================

    function exportarCSV() {
      let csv = 'Tipo,ID,Propiedad,FechaEntrada/Fecha,FechaSalida/Cat,Canal/Detalle,Importe\n';
      bookings.forEach(b => {
        const p = properties.find(x => x.id === b.propertyId);
        csv += `Reserva,${b.id},"${p ? p.nombre : ''}",${b.fechaEntrada},${b.fechaSalida},${b.canal},${b.importeCobrado}\n`;
      });
      expenses.forEach(e => {
        const p = properties.find(x => x.id === e.propertyId);
        csv += `Gasto,${e.id},"${p ? p.nombre : ''}",${formatFechaAR(e.fecha)},"${e.categoria}","${e.descripcion || ''}",${e.importe}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_RentaRent_${new Date().toISOString().substring(0, 10)}.csv`;
      a.click();
    }

    function exportarPDF() { window.print(); }

    // ---- MODO CLARO / OSCURO ----

window.RentaRent.reportes = { renderGraficoDashboard, renderReporte, exportarCSV, exportarPDF };
