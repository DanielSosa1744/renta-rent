    const KEYS = {
      PROPERTIES: 'renta_properties_v1',
      BOOKINGS: 'renta_bookings_v1',
      EXPENSES: 'renta_expenses_v1'
    };

    // ESTADO LOCAL
    let properties = [];
    let bookings = [];
    let expenses = [];
    let periodoFiltro = 'mes'; // 'mes', 'trimestre', 'anio'
    let chartDashInstance = null;

    // INITIALIZATION
    window.addEventListener('DOMContentLoaded', () => {
      cargarDatos();
      if (properties.length === 0) {
        cargarDatosSemilla();
      }
      poblarSelectsPropiedades();
      poblarSelectAnios();
      renderDashboard();
      renderReservas();
      renderGastos();
      renderPropiedades();
      renderReporte();
    });

    // LOCAL STORAGE HANDLERS
    function cargarDatos() {
      try {
        properties = JSON.parse(localStorage.getItem(KEYS.PROPERTIES)) || [];
        bookings = JSON.parse(localStorage.getItem(KEYS.BOOKINGS)) || [];
        expenses = JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
      } catch (e) {
        properties = []; bookings = []; expenses = [];
      }
    }

    function guardarDatos() {
      localStorage.setItem(KEYS.PROPERTIES, JSON.stringify(properties));
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
    }

    // DATOS DE EJEMPLO PARA VALIDACION RAPIDA (6 ALOJAMIENTOS POR DEFECTO)
    function cargarDatosSemilla() {
      properties = [
        { id: 'prop_1', nombre: 'Depto Centro 2B', direccion: 'Av. Libertador 1200, 2B', tipo: 'Apartamento' },
        { id: 'prop_2', nombre: 'Loft Palermo Soho', direccion: 'Honduras 4850', tipo: 'Loft' },
        { id: 'prop_3', nombre: 'Cabaña del Lago', direccion: 'Ruta 40 Km 12', tipo: 'Cabaña' },
        { id: 'prop_4', nombre: 'Studio Recoleta', direccion: 'Av. Alvear 1890', tipo: 'Estudio' },
        { id: 'prop_5', nombre: 'Casa Quinta Norte', direccion: 'Los Robles 340', tipo: 'Casa' },
        { id: 'prop_6', nombre: 'Dúplex Puerto Madero', direccion: 'Juana Manso 750', tipo: 'Dúplex' }
      ];
      const hoy = new Date();
      const mesActual = hoy.toISOString().substring(0, 7);

      bookings = [
        { id: 'res_1', propertyId: 'prop_1', huesped: 'Martín Gómez', fechaEntrada: `${mesActual}-05`, fechaSalida: `${mesActual}-10`, canal: 'Airbnb', importeCobrado: 450000 },
        { id: 'res_2', propertyId: 'prop_1', huesped: 'Laura Rossi', fechaEntrada: `${mesActual}-12`, fechaSalida: `${mesActual}-17`, canal: 'Booking', importeCobrado: 520000 },
        { id: 'res_3', propertyId: 'prop_2', huesped: 'Carlos Méndez', fechaEntrada: `${mesActual}-08`, fechaSalida: `${mesActual}-14`, canal: 'Directo', importeCobrado: 390000 },
        { id: 'res_4', propertyId: 'prop_3', huesped: 'Sofía Castro', fechaEntrada: `${mesActual}-18`, fechaSalida: `${mesActual}-23`, canal: 'Airbnb', importeCobrado: 610000 }
      ];

      expenses = [
        { id: 'gas_1', propertyId: 'prop_1', bookingId: 'res_1', fecha: `${mesActual}-05`, categoria: 'Comisión Airbnb', importe: 67500, descripcion: 'Comisión de plataforma 15%' },
        { id: 'gas_2', propertyId: 'prop_1', bookingId: 'res_1', fecha: `${mesActual}-10`, categoria: 'Limpieza', importe: 25000, descripcion: 'Limpieza check-out' },
        { id: 'gas_3', propertyId: 'prop_1', bookingId: 'res_2', fecha: `${mesActual}-12`, categoria: 'Comisión Booking', importe: 93600, descripcion: 'Comisión de plataforma 18%' },
        { id: 'gas_4', propertyId: 'prop_1', bookingId: '', fecha: `${mesActual}-01`, categoria: 'Servicios', importe: 35000, descripcion: 'Wifi & Luz departamento' }
      ];
      guardarDatos();
    }

    // NAVEGACION TABS

    function obtenerArchivoTickets() {
      try { return JSON.parse(localStorage.getItem(TICKETS_KEY)) || []; }
      catch (e) { return []; }
    }

    function guardarTicketEnArchivo(numero, propiedad, huesped, fechaEntrada, texto) {
      const lista = obtenerArchivoTickets();
      lista.unshift({
        id: 'tkt_' + Date.now(),
        numero,
        propiedad,
        huesped: huesped || 'Sin especificar',
        fechaEntrada: formatFechaAR(fechaEntrada),
        fechaCreacion: new Date().toLocaleDateString('es-AR'),
        texto
      });
      localStorage.setItem(TICKETS_KEY, JSON.stringify(lista));
    }


function migrarDatosRetrocompatibles() {
  properties = properties.map(p => ({ activa: true, tarifaBase: 0, notas: '', ...p }));
  bookings = bookings.map(b => ({ estado: 'confirmada', ...b }));
}
const _origCargarDatos = cargarDatos;
cargarDatos = function() {
  _origCargarDatos();
  migrarDatosRetrocompatibles();
};
window.RentaRent.storage = { KEYS, cargarDatos, guardarDatos, cargarDatosSemilla, obtenerArchivoTickets, guardarTicketEnArchivo };
