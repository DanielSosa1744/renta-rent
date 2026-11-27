let resCalFecha = new Date();
let resSelectStep = 0;

function renderCalendarioMensual(grid, label, fechaRef, renderDiaFn) {
  if (!grid || !label) return;
  const year = fechaRef.getFullYear();
  const month = fechaRef.getMonth();
  label.textContent = fechaRef.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay === 0 ? 6 : firstDay - 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const hoyStr = new Date().toISOString().substring(0, 10);

  grid.innerHTML = '';
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    grid.appendChild(renderDiaFn(d, dateStr, hoyStr));
  }
}

    function destacarReservaEnCalendario(bookingId) {
      highlightedBookingId = (highlightedBookingId === bookingId) ? null : bookingId;
      if (highlightedBookingId) {
        const b = bookings.find(x => x.id === highlightedBookingId);
        if (b && b.fechaEntrada) {
          const [y, m] = b.fechaEntrada.split('-');
          calFechaActual = new Date(parseInt(y), parseInt(m) - 1, 1);
        }
      }
      renderCalendarioPropiedad();
      renderReservasPropiedad();
    }


    function cambiarMesCalendario(delta) {
      calFechaActual.setMonth(calFechaActual.getMonth() + delta);
      renderCalendarioPropiedad();
    }


    function cambiarMesResCal(delta) {
      resCalFecha.setMonth(resCalFecha.getMonth() + delta);
      renderResCalendario();
    }

    function seleccionarFechaRes(dateStr) {
      const inpIn = document.getElementById('res-entrada');
      const inpOut = document.getElementById('res-salida');
      const propId = document.getElementById('res-propiedad').value;
      const editId = document.getElementById('res-id').value;
      const propBookings = bookings.filter(b => b.propertyId === propId && b.id !== editId);

      if (resSelectStep === 0 || !inpIn.value || dateStr <= inpIn.value) {
        inpIn.value = dateStr;
        inpOut.value = '';
        resSelectStep = 1;
      } else {
        const haySuperposicion = propBookings.some(b => inpIn.value < b.fechaSalida && dateStr > b.fechaEntrada);
        if (haySuperposicion) {
          mostrarAlerta('Las fechas seleccionadas se superponen con una reserva existente de este alojamiento.', 'Fechas ocupadas');
          return;
        }
        inpOut.value = dateStr;
        resSelectStep = 0;
      }
      document.getElementById('res-entrada-lbl').textContent = formatFechaAR(inpIn.value);
      document.getElementById('res-salida-lbl').textContent = formatFechaAR(inpOut.value);
      renderResCalendario();
    }

    function renderResCalendario() {
      const grid = document.getElementById('res-cal-grid');
      const label = document.getElementById('res-cal-month-label');
      if (!grid || !label) return;

      const year = resCalFecha.getFullYear();
      const month = resCalFecha.getMonth();
      label.textContent = resCalFecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

      const firstDay = new Date(year, month, 1).getDay();
      const offset = (firstDay === 0 ? 6 : firstDay - 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const ent = document.getElementById('res-entrada').value;
      const sal = document.getElementById('res-salida').value;
      const propId = document.getElementById('res-propiedad').value;
      const editId = document.getElementById('res-id').value;
      const propBookings = bookings.filter(b => b.propertyId === propId && b.id !== editId);
      const hoyStr = new Date().toISOString().substring(0, 10);

      grid.innerHTML = '';
      for (let i = 0; i < offset; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day empty';
        grid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'cal-day' + (dateStr < hoyStr ? ' past' : ' clickable');
        if (dateStr === hoyStr) cell.classList.add('today');

        const existingIn = propBookings.some(b => b.fechaEntrada === dateStr);
        const existingOut = propBookings.some(b => b.fechaSalida === dateStr);
        const existingBook = propBookings.find(b => dateStr >= b.fechaEntrada && dateStr < b.fechaSalida);

        const hasIn = existingIn || (ent && dateStr === ent);
        const hasOut = existingOut || (sal && dateStr === sal);

        if (hasIn && hasOut) {
          cell.classList.add('checkin-checkout');
        } else if (hasIn) {
          cell.classList.add('checkin');
        } else if (hasOut) {
          cell.classList.add('checkout');
        } else if (ent && sal && dateStr > ent && dateStr < sal) {
          cell.classList.add('in-range');
        } else if (existingBook) {
          const ch = (existingBook.canal || '').toLowerCase();
          if (ch.includes('airbnb')) cell.classList.add('booked-airbnb');
          else if (ch.includes('booking')) cell.classList.add('booked-booking');
          else cell.classList.add('booked-directo');
        }

        if (existingBook) cell.title = `Ocupado: ${existingBook.huesped} (${existingBook.canal})`;
        cell.textContent = d;
        if (dateStr >= hoyStr) {
          cell.onclick = () => seleccionarFechaRes(dateStr);
        }
        grid.appendChild(cell);
      }
    }

    function renderCalendarioPropiedad() {
      const grid = document.getElementById('prop-det-calendario');
      const label = document.getElementById('cal-month-label');
      if (!grid || !label) return;

      const year = calFechaActual.getFullYear();
      const month = calFechaActual.getMonth();
      const monthName = calFechaActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      label.textContent = monthName;

      const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
      const offset = (firstDay === 0 ? 6 : firstDay - 1); // Lunes=0
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const propBookings = bookings.filter(b => b.propertyId === propDetalleActualId);
      const hoyStr = new Date().toISOString().substring(0, 10);

      grid.innerHTML = '';
      for (let i = 0; i < offset; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day empty';
        grid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'cal-day' + (dateStr < hoyStr ? ' past' : '');
        if (dateStr === hoyStr) cell.classList.add('today');

        const isCheckIn = propBookings.some(b => b.fechaEntrada === dateStr);
        const isCheckOut = propBookings.some(b => b.fechaSalida === dateStr);
        const booking = propBookings.find(b => dateStr >= b.fechaEntrada && dateStr < b.fechaSalida);

        if (isCheckIn && isCheckOut) {
          cell.classList.add('checkin-checkout');
        } else if (isCheckIn) {
          cell.classList.add('checkin');
        } else if (isCheckOut) {
          cell.classList.add('checkout');
        } else if (booking) {
          const ch = (booking.canal || '').toLowerCase();
          if (ch.includes('airbnb')) cell.classList.add('booked-airbnb');
          else if (ch.includes('booking')) cell.classList.add('booked-booking');
          else cell.classList.add('booked-directo');
        }
        if (booking) cell.title = `${booking.huesped} (${booking.canal})`;

        if (highlightedBookingId) {
          const hb = propBookings.find(b => b.id === highlightedBookingId);
          if (hb && dateStr >= hb.fechaEntrada && dateStr <= hb.fechaSalida) {
            cell.classList.add('highlighted-booking');
          } else {
            cell.classList.add('dimmed');
          }
        }

        cell.textContent = d;
        grid.appendChild(cell);
      }
    }


window.RentaRent.calendario = { renderCalendarioMensual, renderCalendarioPropiedad, renderResCalendario, cambiarMesCalendario, cambiarMesResCal, seleccionarFechaRes, destacarReservaEnCalendario };
