    function renderReservas() {
      const listEl = document.getElementById('reservas-list');
      const propFiltro = document.getElementById('filtro-reserva-prop').value;

      const hoyStr = new Date().toISOString().substring(0, 10);
      let list = bookings.filter(b => b.fechaSalida >= hoyStr);
      if (propFiltro) list = list.filter(b => b.propertyId === propFiltro);

      if (list.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No hay reservas creadas para los filtros seleccionados.</div>';
        return;
      }

      listEl.innerHTML = list.sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada)).map(b => {
        const prop = properties.find(p => p.id === b.propertyId);
        const rent = calcularRentabilidadReserva(b.id);
        const canalClass = `channel-${b.canal.toLowerCase()}`;
        const noches = calcularNoches(b.fechaEntrada, b.fechaSalida);

        return `
          <div class="list-card">
            <div class="list-card-header">
              <div>
                <div class="list-card-title">${prop ? prop.nombre : 'Propiedad'}</div>
                <div class="list-card-sub" style="font-weight:600; color:var(--text-main); margin-top:2px;">${b.huesped || 'Reserva sin nombre'}</div>
                <div class="list-card-sub" style="margin-top:2px;">${formatFechaAR(b.fechaEntrada)} a ${formatFechaAR(b.fechaSalida)} (${noches} noches)</div>
              </div>
              <span class="channel-badge ${canalClass}">${b.canal}</span>
            </div>
            
            <div class="profit-breakdown">
              <div class="profit-row"><span>Costo Total Reserva:</span> <span>${fmtMonto(b.costoTotal || rent.bruto)}</span></div>
              <div class="profit-row"><span>Seña / Pagado:</span> <span style="color:var(--accent-primary);">${fmtMonto(rent.bruto)}</span></div>
              <div class="profit-row"><span>Resta Pagar:</span> <span style="color:var(--accent-warning); font-weight:700;">${fmtMonto(Math.max(0, (b.costoTotal || rent.bruto) - rent.bruto))}</span></div>
              <div class="profit-row"><span>Comisión Canal:</span> <span style="color:#f87171;">-${fmtMonto(rent.comisiones)}</span></div>
              <div class="profit-row"><span>Limpieza / Lavandería:</span> <span style="color:#f87171;">-${fmtMonto(rent.limpieza)}</span></div>
              ${rent.otrosGastos > 0 ? `<div class="profit-row"><span>Otros Gastos Reserva:</span> <span style="color:#f87171;">-${fmtMonto(rent.otrosGastos)}</span></div>` : ''}
              <div class="profit-row net">
                <span>Ganancia Real de la Reserva:</span>
                <span>${fmtMonto(rent.neto)}</span>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.4rem; margin-top:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="asociarGastoReserva('${b.id}', '${b.propertyId}')">+ Gasto</button>
              <button class="btn btn-secondary btn-sm" onclick="editarReserva('${b.id}')">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarReserva('${b.id}')">Eliminar</button>
            </div>
          </div>
        `;
      }).join('');
    }

    // ==========================================
    // RENDER GASTOS
    // ==========================================

    function abrirModalReserva() {
      if (properties.length === 0) {
        alert('Debés crear al menos un alojamiento antes de registrar una reserva.');
        switchTab('propiedades');
        return;
      }
      document.getElementById('res-id').value = '';
      document.getElementById('res-huesped').value = '';
      document.getElementById('res-canal').value = '';
      document.getElementById('res-entrada').value = new Date().toISOString().substring(0, 10);
      document.getElementById('res-salida').value = '';
      document.getElementById('res-importe').value = '';
      document.getElementById('reserva-modal-title').textContent = 'Nueva Reserva';
      resCalFecha = new Date(); resCalFecha.setDate(1); resSelectStep = 0; document.getElementById('res-entrada-lbl').textContent = formatFechaAR(document.getElementById('res-entrada').value); document.getElementById('res-salida-lbl').textContent = formatFechaAR(document.getElementById('res-salida').value); renderResCalendario(); document.getElementById('res-costo-total').value = ''; setTipoPagoReserva('total'); document.getElementById('modal-reserva').classList.add('open');
    }

    let tipoPagoReserva = 'total';

    function setTipoPagoReserva(tipo) {
      tipoPagoReserva = tipo;
      const btnT = document.getElementById('btn-pago-total');
      const btnP = document.getElementById('btn-pago-parcial');
      const row = document.getElementById('res-pago-parcial-row');
      if (btnT) btnT.classList.toggle('active', tipo === 'total');
      if (btnP) btnP.classList.toggle('active', tipo === 'parcial');
      if (row) row.style.display = (tipo === 'parcial') ? 'grid' : 'none';
      if (tipo === 'total') {
        const total = Math.max(0, parseFloat(document.getElementById('res-costo-total').value) || 0);
        document.getElementById('res-importe').value = total || '';
      }
      actualizarRestaPagar();
    }

    function actualizarRestaPagar() {
      const inpTotal = document.getElementById('res-costo-total');
      const inpSena = document.getElementById('res-importe');
      let total = parseFloat(inpTotal.value) || 0;
      let sena = parseFloat(inpSena.value) || 0;
      if (total < 0) { total = 0; inpTotal.value = ''; }
      if (sena < 0) { sena = 0; inpSena.value = ''; }
      if (total > 0 && sena > total) {
        sena = total;
        inpSena.value = total;
      }
      const resta = Math.max(0, total - sena);
      const grp = document.getElementById('res-resta-group');
      const el = document.getElementById('res-resta-pagar');
      if (grp) grp.style.display = (total > 0 && sena < total) ? 'block' : 'none';
      if (el) el.textContent = fmtMonto(resta);
    }

function guardarReserva(e) {
      e.preventDefault();
      const id = document.getElementById('res-id').value || 'res_' + Date.now();
      const propertyId = document.getElementById('res-propiedad').value;
      const huesped = document.getElementById('res-huesped').value.trim();
      const fechaEntrada = document.getElementById('res-entrada').value;
      const fechaSalida = document.getElementById('res-salida').value;
      const canal = document.getElementById('res-canal').value;
      if (!canal) { mostrarAlerta('Por favor elige un canal.'); return; }
      const costoTotal = Math.max(0, parseFloat(document.getElementById('res-costo-total').value) || 0);
      let importeCobrado = (tipoPagoReserva === 'total')
        ? costoTotal
        : Math.max(0, parseFloat(document.getElementById('res-importe').value) || 0);
      if (costoTotal > 0 && importeCobrado > costoTotal) importeCobrado = costoTotal;

      if (fechaSalida <= fechaEntrada) {
        mostrarAlerta('La fecha de salida debe ser posterior a la fecha de entrada.');
        return;
      }

      const idx = bookings.findIndex(b => b.id === id);
      const data = { id, propertyId, huesped, fechaEntrada, fechaSalida, canal, costoTotal, importeCobrado };

      if (idx !== -1) bookings[idx] = data;
      else bookings.push(data);

      guardarDatos();
      cerrarModal('modal-reserva');
      poblarSelectsPropiedades();
      renderDashboard();
      renderReservas();
    }

    const TICKETS_KEY = 'rentarent_tickets_v1';


    function abrirArchivoTickets() {
      const inp = document.getElementById('buscar-ticket-input');
      if (inp) inp.value = '';
      renderArchivoTickets();
      document.getElementById('modal-archivo-tickets').classList.add('open');
    }

    function renderArchivoTickets() {
      const listEl = document.getElementById('archivo-tickets-list');
      if (!listEl) return;
      const q = (document.getElementById('buscar-ticket-input')?.value || '').trim().toLowerCase();
      const lista = obtenerArchivoTickets().filter(t => {
        if (!q) return true;
        return (t.numero || '').toLowerCase().includes(q) ||
               (t.huesped || '').toLowerCase().includes(q) ||
               (t.propiedad || '').toLowerCase().includes(q) ||
               (t.fechaEntrada || '').toLowerCase().includes(q) ||
               (t.texto || '').toLowerCase().includes(q);
      });

      if (lista.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding:1.5rem;">No se encontraron tickets archivados.</div>';
        return;
      }

      listEl.innerHTML = lista.map(t => `
        <div class="list-card" style="padding:0.8rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
            <div>
              <div style="font-weight:800; font-size:0.9rem; color:var(--text-main);">Comprobante N° ${t.numero}</div>
              <div style="font-size:0.78rem; color:var(--text-muted);">${t.propiedad} • ${t.huesped}</div>
              <div style="font-size:0.74rem; color:var(--text-muted);">Entrada: ${t.fechaEntrada} • Emitido: ${t.fechaCreacion}</div>
            </div>
            <div style="display:flex; gap:0.35rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="copiarTicketArchivo('${t.id}', this)">Copiar</button>
              <button type="button" class="btn btn-danger btn-sm" onclick="eliminarTicketArchivo('${t.id}')">X</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    function copiarTicketArchivo(id, btnEl) {
      const t = obtenerArchivoTickets().find(x => x.id === id);
      if (!t) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t.texto).then(() => {
          if (btnEl) btnEl.textContent = 'Copiado';
        });
      }
    }

    function eliminarTicketArchivo(id) {
      const lista = obtenerArchivoTickets().filter(x => x.id !== id);
      localStorage.setItem(TICKETS_KEY, JSON.stringify(lista));
      renderArchivoTickets();
    }


    function abrirHistorialReservas() {
      const listEl = document.getElementById('historial-reservas-list');
      if (!listEl) return;
      const hoyStr = new Date().toISOString().substring(0, 10);
      const pasadas = bookings
        .filter(b => b.fechaSalida < hoyStr)
        .sort((a, b) => b.fechaSalida.localeCompare(a.fechaSalida));

      if (pasadas.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding:1.5rem;">No hay reservas pasadas en el historial.</div>';
      } else {
        listEl.innerHTML = pasadas.map(b => {
          const p = properties.find(x => x.id === b.propertyId);
          const noches = calcularNoches(b.fechaEntrada, b.fechaSalida);
          return `
            <div class="list-card" style="padding:0.8rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:800; font-size:0.9rem; color:var(--text-main);">${p ? p.nombre : 'Propiedad'}</div>
                  <div style="font-size:0.78rem; color:var(--text-muted);">${b.huesped || 'Reserva sin nombre'} • ${b.canal}</div>
                  <div style="font-size:0.74rem; color:var(--text-muted);">${formatFechaAR(b.fechaEntrada)} a ${formatFechaAR(b.fechaSalida)} (${noches}n)</div>
                </div>
                <div style="font-weight:800; color:var(--accent-primary); font-size:0.95rem;">${fmtMonto(b.importeCobrado || 0)}</div>
              </div>
            </div>
          `;
        }).join('');
      }
      document.getElementById('modal-historial-reservas').classList.add('open');
    }


    function obtenerSiguienteNroTicket() {
      let seq = parseInt(localStorage.getItem('rentarent_ticket_seq_v1') || '0', 10) + 1;
      localStorage.setItem('rentarent_ticket_seq_v1', String(seq));
      return String(seq).padStart(6, '0');
    }

    function obtenerFechaHoraTicket() {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    }

    function generarTicketDesdeForm() {
      const id = document.getElementById('res-id').value || 'res_' + Date.now();
      const propId = document.getElementById('res-propiedad').value;
      const p = properties.find(x => x.id === propId);
      const huesped = document.getElementById('res-huesped').value.trim();
      const fechaEntrada = document.getElementById('res-entrada').value;
      const fechaSalida = document.getElementById('res-salida').value;
      const canal = document.getElementById('res-canal').value;
      const total = parseFloat(document.getElementById('res-costo-total').value) || 0;
      const sena = parseFloat(document.getElementById('res-importe').value) || 0;
      const resta = Math.max(0, total - sena);
      const noches = (fechaEntrada && fechaSalida) ? calcularNoches(fechaEntrada, fechaSalida) : 0;

      if (fechaEntrada && fechaSalida && fechaSalida > fechaEntrada) {
        const idx = bookings.findIndex(b => b.id === id);
        const data = { id, propertyId: propId, huesped, fechaEntrada, fechaSalida, canal, costoTotal: total, importeCobrado: sena };
        if (idx !== -1) bookings[idx] = data;
        else bookings.push(data);
        guardarDatos();
        poblarSelectsPropiedades();
        renderDashboard();
        renderReservas();
      }
      cerrarModal('modal-reserva');

      const compNum = obtenerSiguienteNroTicket();
      const fechaHora = obtenerFechaHoraTicket();
      const senaFinal = (tipoPagoReserva === 'total') ? total : sena;
      const restaFinal = Math.max(0, total - senaFinal);
      const texto = [
        `*RentaRent*`,
        ``,
        `COMPROBANTE DE RESERVA N° ${compNum}`,
        `${fechaHora}`,
        `----------------------------------------`,
        `Alojamiento: ${p ? p.nombre : 'Propiedad'}`,
        p && p.direccion ? `Dirección: ${p.direccion}` : null,
        `Huésped: ${huesped || 'Sin especificar'}`,
        ` (${noches} ${noches === 1 ? 'noche' : 'noches'})`,
        `Check-in:  ${formatFechaAR(fechaEntrada)}`,
        `Check-out: ${formatFechaAR(fechaSalida)}`,
        `Canal: ${canal}`,
        `----------------------------------------`,
        `Costo Total: ${fmtMonto(total)}`,
        restaFinal === 0 ? `PAGADO` : `Seña: ${fmtMonto(senaFinal)}`,
        restaFinal > 0 ? `Resta Pagar: ${fmtMonto(restaFinal)}` : null
      ].filter(Boolean).join('\n');

      document.getElementById('ticket-texto').value = texto; guardarTicketEnArchivo(compNum, p ? p.nombre : 'Propiedad', typeof huesped !== 'undefined' ? huesped : (b ? b.huesped : ''), typeof fechaEntrada !== 'undefined' ? fechaEntrada : (b ? b.fechaEntrada : ''), texto);
      const btn = document.getElementById('btn-copiar-ticket');
      if (btn) btn.textContent = 'Copiar Ticket';
      document.getElementById('modal-ticket').classList.add('open');
    }

    function generarTicketReserva(id) {
      const b = bookings.find(x => x.id === id);
      if (!b) return;
      const p = properties.find(x => x.id === b.propertyId);
      const noches = calcularNoches(b.fechaEntrada, b.fechaSalida);
      const total = b.costoTotal || b.importeCobrado || 0;
      const sena = b.importeCobrado || 0;
      const resta = Math.max(0, total - sena);

      const compNum = obtenerSiguienteNroTicket();
      const fechaHora = obtenerFechaHoraTicket();
      const texto = [
        `*RentaRent*`,
        ``,
        `COMPROBANTE DE RESERVA N° ${compNum}`,
        `${fechaHora}`,
        `----------------------------------------`,
        `Alojamiento: ${p ? p.nombre : 'Propiedad'}`,
        p && p.direccion ? `Dirección: ${p.direccion}` : null,
        `Huésped: ${b.huesped || 'Sin especificar'}`,
        ` (${noches} ${noches === 1 ? 'noche' : 'noches'})`,
        `Check-in:  ${formatFechaAR(b.fechaEntrada)}`,
        `Check-out: ${formatFechaAR(b.fechaSalida)}`,
        `Canal: ${b.canal}`,
        `----------------------------------------`,
        `Costo Total: ${fmtMonto(total)}`,
        resta === 0 ? `PAGADO` : `Seña: ${fmtMonto(sena)}`,
        resta > 0 ? `Resta Pagar: ${fmtMonto(resta)}` : null
      ].filter(Boolean).join('\n');

      document.getElementById('ticket-texto').value = texto; guardarTicketEnArchivo(compNum, p ? p.nombre : 'Propiedad', typeof huesped !== 'undefined' ? huesped : (b ? b.huesped : ''), typeof fechaEntrada !== 'undefined' ? fechaEntrada : (b ? b.fechaEntrada : ''), texto);
      const btn = document.getElementById('btn-copiar-ticket');
      if (btn) btn.textContent = 'Copiar Ticket';
      document.getElementById('modal-ticket').classList.add('open');
    }

    function copiarTicket() {
      const ta = document.getElementById('ticket-texto');
      const btn = document.getElementById('btn-copiar-ticket');
      if (!ta) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(() => {
          if (btn) btn.textContent = 'Ticket Copiado';
        });
      } else {
        ta.select();
        document.execCommand('copy');
        if (btn) btn.textContent = 'Ticket Copiado';
      }
    }

    function editarReserva(id) {
      const b = bookings.find(x => x.id === id);
      if (!b) return;
      document.getElementById('res-id').value = b.id;
      document.getElementById('res-propiedad').value = b.propertyId;
      document.getElementById('res-huesped').value = b.huesped || '';
      document.getElementById('res-entrada').value = b.fechaEntrada;
      document.getElementById('res-salida').value = b.fechaSalida; document.getElementById('res-entrada-lbl').textContent = formatFechaAR(b.fechaEntrada); document.getElementById('res-salida-lbl').textContent = formatFechaAR(b.fechaSalida); if (b.fechaEntrada) { const [y,m] = b.fechaEntrada.split('-'); resCalFecha = new Date(parseInt(y), parseInt(m)-1, 1); } renderResCalendario();
      document.getElementById('res-canal').value = b.canal;
      document.getElementById('res-costo-total').value = b.costoTotal || ''; document.getElementById('res-importe').value = b.importeCobrado || ''; const esParcial = (b.costoTotal > 0 && (b.importeCobrado || 0) < b.costoTotal); setTipoPagoReserva(esParcial ? 'parcial' : 'total');
      document.getElementById('reserva-modal-title').textContent = 'Editar Reserva';
      resSelectStep = 0;
      document.getElementById('modal-reserva').classList.add('open');
    }

    function eliminarReserva(id) { mostrarConfirmacion('¿Eliminar esta reserva? Se conservarán los gastos pero se desvincularán.', () => {
      bookings = bookings.filter(b => b.id !== id);
      expenses.forEach(e => { if (e.bookingId === id) e.bookingId = ''; }, 'Eliminar Reserva'); });
      guardarDatos();
      poblarSelectsPropiedades();
      renderDashboard();
      renderReservas();
    }

    // ==========================================
    // ACCIONES CRUD (GASTOS)
    // ==========================================

window.RentaRent.reservas = { renderReservas, abrirModalReserva, guardarReserva, editarReserva, eliminarReserva, setTipoPagoReserva, actualizarRestaPagar, abrirHistorialReservas, generarTicketDesdeForm, generarTicketReserva, copiarTicket, abrirArchivoTickets, renderArchivoTickets };
