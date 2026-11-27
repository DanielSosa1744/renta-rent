    function renderGiftcards() {
      const grid = document.getElementById('dash-giftcards-grid');
      if (!grid) return;
      grid.innerHTML = '';

      if (properties.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:1rem;">No hay alojamientos. Crea uno con "+ Nuevo Alojamiento".</div>';
        return;
      }

      const hoyStr = new Date().toISOString().substring(0, 10);
      properties.forEach((p, idx) => {
        const propBookings = bookings.filter(b => b.propertyId === p.id && b.fechaSalida >= hoyStr);
        const totalIng = propBookings.reduce((s, b) => s + (b.importeCobrado || 0), 0);
        const grad = GIFTCARD_GRADIENTS[idx % GIFTCARD_GRADIENTS.length];

        const card = document.createElement('div');
        card.className = 'giftcard';
        card.style.background = grad;
        card.onclick = () => abrirModalPropDetalle(p.id);
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
      document.getElementById('prop-det-sub').textContent = `${p.tipo || 'Alojamiento'} • ${p.direccion || 'Sin dirección'}`;

      const btnNueva = document.getElementById('prop-det-nueva-res');
      btnNueva.onclick = () => {
        cerrarModal('modal-prop-detalle');
        abrirModalReserva();
        const sel = document.getElementById('res-propiedad');
        if (sel) sel.value = propId;
      };

      const btnHist = document.getElementById('prop-det-historial');
      if (btnHist) {
        btnHist.onclick = () => {
          abrirHistorialReservas(propId);
        };
      }

      const btnEdit = document.getElementById('prop-det-editar');
      if (btnEdit) {
        btnEdit.onclick = () => {
          cerrarModal('modal-prop-detalle');
          editarPropiedad(propId);
        };
      }

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
      const hoyStr = new Date().toISOString().substring(0, 10);
      const propBookings = bookings
        .filter(b => b.propertyId === propDetalleActualId && b.fechaSalida >= hoyStr)
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
        const propBookings = bookings.filter(b => b.propertyId === p.id);
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

    // ==========================================
    // RENDER REPORTES
    // ==========================================

    function abrirModalPropiedad() {
      // FREEMIUM CHECK STRUCT
      if (properties.length >= 1) {
        // En plan gratis se permite 1 propiedad para validación MVP
        // mostramos banner de beneficio Premium
      }
      document.getElementById('prop-id').value = '';
      document.getElementById('prop-nombre').value = '';
      document.getElementById('prop-direccion').value = '';
      document.getElementById('prop-modal-title').textContent = 'Nueva Propiedad';
      document.getElementById('modal-propiedad').classList.add('open');
    }

    function guardarPropiedad(e) {
      e.preventDefault();
      const id = document.getElementById('prop-id').value || 'prop_' + Date.now();
      const nombre = document.getElementById('prop-nombre').value.trim();
      const direccion = document.getElementById('prop-direccion').value.trim();
      const tipo = document.getElementById('prop-tipo').value;

      const idx = properties.findIndex(p => p.id === id);
      const data = { id, nombre, direccion, tipo };

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
      document.getElementById('prop-direccion').value = p.direccion;
      document.getElementById('prop-tipo').value = p.tipo;
      document.getElementById('prop-modal-title').textContent = 'Editar Propiedad';
      document.getElementById('modal-propiedad').classList.add('open');
    }

    function eliminarPropiedad(id) { mostrarConfirmacion('¿Eliminar esta propiedad? Se borrarán sus reservas y gastos asociados.', () => {
      properties = properties.filter(p => p.id !== id);
      bookings = bookings.filter(b => b.propertyId !== id);
      expenses = expenses.filter(e => e.propertyId !== id);
      guardarDatos();
      poblarSelectsPropiedades();
      renderDashboard();
      renderPropiedades();
    }, 'Eliminar Alojamiento'); }

    // MODAL UTILS

window.RentaRent.giftcards = { renderGiftcards, abrirModalPropDetalle, renderReservasPropiedad, renderPropiedades, abrirModalPropiedad, guardarPropiedad, editarPropiedad, eliminarPropiedad };
