    function renderGastos() {
      const listEl = document.getElementById('gastos-list');
      const propFiltro = document.getElementById('filtro-gasto-prop').value;
      const catFiltro = document.getElementById('filtro-gasto-cat').value;

      let list = expenses.slice();
      if (propFiltro) list = list.filter(e => e.propertyId === propFiltro);
      if (catFiltro) list = list.filter(e => e.categoria === catFiltro);

      if (list.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No hay gastos registrados con estos filtros.</div>';
        return;
      }

      listEl.innerHTML = list.reverse().map(e => {
        const prop = properties.find(p => p.id === e.propertyId);
        const res = bookings.find(b => b.id === e.bookingId);
        return `
          <div class="list-card">
            <div class="list-card-header">
              <div>
                <div class="list-card-title">${e.categoria} - ${fmtMonto(e.importe)}</div>
                <div class="list-card-sub">${prop ? prop.nombre : 'Propiedad general'} &bull; ${formatFechaAR(e.fecha)}</div>
                ${e.descripcion ? `<div style="font-size:0.78rem; color:#cbd5e1; margin-top:0.2rem;">${e.descripcion}</div>` : ''}
                ${res ? `<div style="font-size:0.75rem; color:#a78bfa; margin-top:0.2rem;"> Asoc. a reserva: ${res.huesped || 'Reserva'} (${res.fechaEntrada})</div>` : '<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">Gasto Fijo / General</div>'}
              </div>
              <button class="btn btn-danger btn-sm" onclick="eliminarGasto('${e.id}')">X</button>
            </div>
          </div>
        `;
      }).join('');
    }

    // ==========================================
    // RENDER PROPIEDADES
    // ==========================================

    function abrirArchivoGastos() {
      const inp = document.getElementById('buscar-gasto-input');
      if (inp) inp.value = '';
      renderArchivoGastos();
      document.getElementById('modal-archivo-gastos').classList.add('open');
    }

    function renderArchivoGastos() {
      const listEl = document.getElementById('archivo-gastos-list');
      const totalEl = document.getElementById('archivo-gastos-total');
      if (!listEl) return;
      const q = (document.getElementById('buscar-gasto-input')?.value || '').trim().toLowerCase();

      const filtrados = expenses.filter(e => {
        if (!q) return true;
        const p = properties.find(x => x.id === e.propertyId);
        return (e.categoria || '').toLowerCase().includes(q) ||
               (e.descripcion || '').toLowerCase().includes(q) ||
               (p ? p.nombre.toLowerCase().includes(q) : false) ||
               formatFechaAR(e.fecha).toLowerCase().includes(q);
      }).sort((a, b) => b.fecha.localeCompare(a.fecha));

      const suma = filtrados.reduce((s, e) => s + (e.importe || 0), 0);
      if (totalEl) totalEl.textContent = `Total filtrado (${filtrados.length} registros): ${fmtMonto(suma)}`;

      if (filtrados.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding:1.5rem;">No se encontraron gastos registrados.</div>';
        return;
      }

      listEl.innerHTML = filtrados.map(e => {
        const p = properties.find(x => x.id === e.propertyId);
        const res = e.bookingId ? bookings.find(b => b.id === e.bookingId) : null;
        return `
          <div class="list-card" style="padding:0.8rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
              <div>
                <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">${e.categoria}</div>
                <div style="font-size:0.76rem; color:var(--text-muted);">${p ? p.nombre : 'General'} • ${formatFechaAR(e.fecha)}</div>
                ${e.descripcion ? `<div style="font-size:0.75rem; color:var(--text-main); margin-top:2px;">${e.descripcion}</div>` : ''}
                ${res ? `<div style="font-size:0.72rem; color:var(--accent-primary); margin-top:2px;">Reserva: ${res.huesped || 'Sin nombre'}</div>` : ''}
              </div>
              <div style="font-weight:800; color:#f87171; font-size:0.92rem;">-${fmtMonto(e.importe || 0)}</div>
            </div>
          </div>
        `;
      }).join('');
    }


    function abrirModalGasto() {
      if (properties.length === 0) {
        alert('Debés crear al menos un alojamiento antes de registrar gastos.');
        switchTab('propiedades');
        return;
      }
      document.getElementById('gas-id').value = '';
      document.getElementById('gas-importe').value = '';
      document.getElementById('gas-fecha').value = new Date().toISOString().substring(0, 10);
      document.getElementById('gas-desc').value = '';
      document.getElementById('gasto-modal-title').textContent = 'Registrar Gasto';
      actualizarSelectReservaGasto();
      document.getElementById('modal-gasto').classList.add('open');
    }

    function asociarGastoReserva(bookingId, propertyId) {
      abrirModalGasto();
      document.getElementById('gas-propiedad').value = propertyId;
      actualizarSelectReservaGasto();
      document.getElementById('gas-reserva').value = bookingId;
    }

    function guardarGasto(e) {
      e.preventDefault();
      const id = document.getElementById('gas-id').value || 'gas_' + Date.now();
      const propertyId = document.getElementById('gas-propiedad').value;
      const bookingId = document.getElementById('gas-reserva').value;
      const categoria = document.getElementById('gas-categoria').value;
      const importe = parseFloat(document.getElementById('gas-importe').value) || 0;
      const fecha = document.getElementById('gas-fecha').value;
      const descripcion = document.getElementById('gas-desc').value.trim();

      const data = { id, propertyId, bookingId, categoria, importe, fecha, descripcion };
      const idx = expenses.findIndex(x => x.id === id);

      if (idx !== -1) expenses[idx] = data;
      else expenses.push(data);

      guardarDatos();
      cerrarModal('modal-gasto');
      renderDashboard();
      renderGastos();
      renderReservas();
    }

    function eliminarGasto(id) { mostrarConfirmacion('¿Eliminar este gasto?', () => {
      expenses = expenses.filter(e => e.id !== id);
      guardarDatos();
      renderDashboard();
      renderGastos();
      renderReservas();
    }, 'Eliminar Gasto'); }

    // ==========================================
    // ACCIONES CRUD (PROPIEDADES)
    // ==========================================

window.RentaRent.gastos = { renderGastos, abrirModalGasto, asociarGastoReserva, guardarGasto, eliminarGasto, abrirArchivoGastos, renderArchivoGastos };
