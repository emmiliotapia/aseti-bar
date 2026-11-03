const API_BASE = 'http://127.0.0.1:8000';

export const api = {
  // Autenticación por Usuario + PIN
  login: async (usuario, pin) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, pin }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error de autenticación');
    }
    return res.json();
  },

  // Asistencia (Control exclusivo por Admin)
  autorizarAsistencia: async (usuario_id, autorizar, autorizado_por = "Admin") => {
    const res = await fetch(`${API_BASE}/asistencia/autorizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, autorizar, autorizado_por }),
    });
    return res.json();
  },
  getAsistencias: async () => {
    const res = await fetch(`${API_BASE}/asistencia/historial`);
    return res.json();
  },

  // Catálogo (Productos)
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/catalogo/upload-foto`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al subir imagen');
    }
    return res.json();
  },
  getProductos: async () => {
    const res = await fetch(`${API_BASE}/catalogo/productos`);
    return res.json();
  },
  createProducto: async (data) => {
    const res = await fetch(`${API_BASE}/catalogo/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateProducto: async (id, data) => {
    const res = await fetch(`${API_BASE}/catalogo/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteProducto: async (id) => {
    const res = await fetch(`${API_BASE}/catalogo/productos/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Cajeros / Meseros
  getUsuarios: async () => {
    const res = await fetch(`${API_BASE}/usuarios`);
    return res.json();
  },
  createUsuario: async (data) => {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al registrar usuario');
    }
    return res.json();
  },
  deleteUsuario: async (id) => {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Turnos & Fondo Inicial
  getTurnoActivo: async () => {
    const res = await fetch(`${API_BASE}/turnos/activo`);
    return res.json();
  },
  abrirTurno: async (usuario_id, fondo_inicial) => {
    const res = await fetch(`${API_BASE}/turnos/apertura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, fondo_inicial }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al iniciar turno');
    }
    return res.json();
  },
  getCorteX: async () => {
    const res = await fetch(`${API_BASE}/turnos/corte_x`);
    if (!res.ok) throw new Error('No hay turno activo para Corte X');
    return res.json();
  },
  postCorteZ: async () => {
    const res = await fetch(`${API_BASE}/turnos/corte_z`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al generar Corte Z');
    return res.json();
  },

  // Reportes
  getReporteVentas: async () => {
    const res = await fetch(`${API_BASE}/reportes/ventas`);
    return res.json();
  },

  // Ventas (Ticket)
  registrarTicket: async (data) => {
    const res = await fetch(`${API_BASE}/ventas/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar venta');
    return res.json();
  },

  // Cuentas Abiertas (Por Mesa y Mesero)
  getCuentasAbiertas: async () => {
    const res = await fetch(`${API_BASE}/cuentas`);
    return res.json();
  },
  getCuentaPorMesa: async (mesa) => {
    const res = await fetch(`${API_BASE}/cuentas/mesa/${encodeURIComponent(mesa)}`);
    return res.json();
  },
  guardarCuenta: async (data) => {
    const res = await fetch(`${API_BASE}/cuentas/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al guardar comanda en cuenta');
    return res.json();
  },
  cancelarCuenta: async (id) => {
    const res = await fetch(`${API_BASE}/cuentas/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Configuración
  getConfig: async () => {
    const res = await fetch(`${API_BASE}/configuracion`);
    return res.json();
  },
  saveConfig: async (data) => {
    const res = await fetch(`${API_BASE}/configuracion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
