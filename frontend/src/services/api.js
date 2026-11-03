const API_BASE = 'http://127.0.0.1:8000';

export const api = {
  // Autenticación
  login: async (pin) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error de autenticación');
    }
    return res.json();
  },

  // Catálogo (Productos)
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

  // Cajeros / Usuarios
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
      throw new Error(err.detail || 'Error al crear usuario');
    }
    return res.json();
  },
  updateUsuario: async (id, data) => {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteUsuario: async (id) => {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Turnos y Cortes
  getTurnoActivo: async () => {
    const res = await fetch(`${API_BASE}/turnos/activo`);
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

  // Ventas (Ticket)
  registrarTicket: async (data) => {
    const res = await fetch(`${API_BASE}/ventas/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar ticket');
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
