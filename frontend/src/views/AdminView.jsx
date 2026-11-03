import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  Plus, 
  Users, 
  Settings, 
  LogOut, 
  Printer, 
  Save, 
  ShieldCheck, 
  UtensilsCrossed, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Receipt,
  UserCheck,
  UserX
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminView({ usuario, onBackToCaja, onLogout }) {
  const [tabActiva, setTabActiva] = useState('asistencia');
  
  // Catálogo
  const [productos, setProductos] = useState([]);
  const [modalProd, setModalProd] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [editandoProdId, setEditandoProdId] = useState(null);
  const [formProd, setFormProd] = useState({
    nombre: '',
    precio: '',
    categoria: 'Cervezas',
    descripcion: '',
    emoji: '🍺',
    imagen_url: '',
    color_boton: '#14171E'
  });

  // Cortes X & Z
  const [corteData, setCorteData] = useState(null);
  const [cargandoCorte, setCargandoCorte] = useState(false);

  // Reportes
  const [reporte, setReporte] = useState(null);

  // Cajeros / Meseros
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    usuario: '',
    pin: '',
    rol: 'mesero',
    cargo: 'Mesero de Sala'
  });

  // Historial Asistencias
  const [asistencias, setAsistencias] = useState([]);

  // Configuración
  const [config, setConfig] = useState({
    nombre_negocio: 'ASETI BAR',
    encabezado: '',
    pie_ticket: '',
    impresora_ip: '192.168.1.200',
    impresora_puerto: '9100'
  });
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarTodo = async () => {
    try {
      const [p, u, c, rep, asis] = await Promise.all([
        api.getProductos(),
        api.getUsuarios(),
        api.getConfig(),
        api.getReporteVentas(),
        api.getAsistencias()
      ]);
      setProductos(p);
      setUsuariosLista(u);
      if (c) setConfig(prev => ({ ...prev, ...c }));
      setReporte(rep);
      setAsistencias(asis);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarCorteActual = async () => {
    setCargandoCorte(true);
    try {
      const data = await api.getCorteX();
      setCorteData(data);
    } catch (err) {
      setCorteData(null);
    } finally {
      setCargandoCorte(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    cargarCorteActual();
  }, []);

  // TOGGLE DE ASISTENCIA POR EL ADMINISTRADOR (PASE DE LISTA)
  const alternarAsistenciaAdmin = async (user, nuevoEstado) => {
    try {
      await api.autorizarAsistencia(user.id, nuevoEstado, usuario?.nombre || "Admin");
      const [u, asis] = await Promise.all([api.getUsuarios(), api.getAsistencias()]);
      setUsuariosLista(u);
      setAsistencias(asis);
      notificar(`${user.nombre} ha sido ${nuevoEstado ? 'habilitado para operar en el POS' : 'deshabilitado'}`);
    } catch (err) {
      alert("Error al actualizar asistencia: " + err.message);
    }
  };

  // PRODUCTOS
  const abrirModalNuevoProd = () => {
    setEditandoProdId(null);
    setFormProd({
      nombre: '',
      precio: '',
      categoria: 'Cervezas',
      descripcion: '',
      emoji: '🍺',
      imagen_url: '',
      color_boton: '#14171E'
    });
    setModalProd(true);
  };

  const abrirModalEditarProd = (prod) => {
    setEditandoProdId(prod.id);
    setFormProd({
      nombre: prod.nombre,
      precio: prod.precio,
      categoria: prod.categoria,
      descripcion: prod.descripcion || '',
      emoji: prod.emoji || '🍺',
      imagen_url: prod.imagen_url || '',
      color_boton: prod.color_boton || '#14171E'
    });
    setModalProd(true);
  };

  const handleSubirArchivoFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
    try {
      const res = await api.uploadFoto(file);
      setFormProd(prev => ({ ...prev, imagen_url: res.url }));
      notificar("¡Foto subida con éxito!");
    } catch (err) {
      alert("Error al subir foto: " + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formProd, precio: parseFloat(formProd.precio) || 0 };
      if (editandoProdId) {
        await api.updateProducto(editandoProdId, payload);
      } else {
        await api.createProducto(payload);
      }
      setModalProd(false);
      const data = await api.getProductos();
      setProductos(data);
      notificar("¡Producto y foto actualizados!");
    } catch (err) {
      alert(err.message);
    }
  };

  const eliminarProducto = async (id) => {
    if (confirm("¿Eliminar este producto?")) {
      await api.deleteProducto(id);
      const data = await api.getProductos();
      setProductos(data);
      notificar("Producto eliminado");
    }
  };

  // USUARIOS
  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
      await api.createUsuario(formUsuario);
      setModalUsuario(false);
      setFormUsuario({ nombre: '', usuario: '', pin: '', rol: 'mesero', cargo: 'Mesero de Sala' });
      const data = await api.getUsuarios();
      setUsuariosLista(data);
      notificar("¡Usuario registrado con éxito!");
    } catch (err) {
      alert(err.message);
    }
  };

  const eliminarUsuario = async (id) => {
    if (confirm("¿Eliminar a este colaborador?")) {
      await api.deleteUsuario(id);
      const data = await api.getUsuarios();
      setUsuariosLista(data);
      notificar("Usuario eliminado");
    }
  };

  // CORTES
  const ejecutarCorteZ = async () => {
    if (confirm("¿Cerrar y sellar definitivamente el turno actual?")) {
      try {
        const res = await api.postCorteZ();
        setCorteData(res);
        notificar("¡Corte Z ejecutado con éxito!");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // CONFIGURACIÓN
  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    try {
      await api.saveConfig(config);
      notificar("¡Configuración guardada!");
    } catch (err) {
      alert(err.message);
    }
  };

  const notificar = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0C1821] text-[#F4EBD9] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-[#0B0F15] border-r border-[#151D28] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <div className="px-1 py-1">
            <div className="w-full h-14 rounded-2xl bg-[#070A0E] border border-[#1A2330] p-2 flex items-center justify-center shadow-inner group">
              <img 
                src="/logo-pos-blanco.png" 
                alt="MAREJADA – Café, Cocina, Bar" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" 
              />
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Navegación Admin">
            <button
              onClick={() => setTabActiva('asistencia')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'asistencia'
                  ? 'bg-[#E76F51] text-[#0C1821] shadow-[0_4px_16px_rgba(231,111,81,0.25)] font-black'
                  : 'text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white'
              }`}
            >
              <Clock size={18} />
              <span>Pase de Asistencia</span>
            </button>

            <button
              onClick={() => setTabActiva('catalogo')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'catalogo'
                  ? 'bg-[#E76F51] text-[#0C1821] shadow-[0_4px_16px_rgba(231,111,81,0.25)] font-black'
                  : 'text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white'
              }`}
            >
              <UtensilsCrossed size={18} />
              <span>Catálogo & Fotos</span>
            </button>

            <button
              onClick={() => { setTabActiva('corte'); cargarCorteActual(); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'corte'
                  ? 'bg-[#E76F51] text-[#0C1821] shadow-[0_4px_16px_rgba(231,111,81,0.25)] font-black'
                  : 'text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white'
              }`}
            >
              <Receipt size={18} />
              <span>Cortes X & Z</span>
            </button>

            <button
              onClick={() => { setTabActiva('reportes'); cargarTodo(); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'reportes'
                  ? 'bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)]'
                  : 'text-[#8E9297] hover:bg-[#1F2833] hover:text-white'
              }`}
            >
              <TrendingUp size={18} />
              <span>Reportes de Venta</span>
            </button>

            <button
              onClick={() => setTabActiva('cajeros')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'cajeros'
                  ? 'bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)]'
                  : 'text-[#8E9297] hover:bg-[#1F2833] hover:text-white'
              }`}
            >
              <Users size={18} />
              <span>Cajeros & Meseros</span>
            </button>

            <button
              onClick={() => setTabActiva('configuracion')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'configuracion'
                  ? 'bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)]'
                  : 'text-[#8E9297] hover:bg-[#1F2833] hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        <div className="space-y-2">
          <button
            onClick={onBackToCaja}
            className="w-full flex items-center justify-center gap-2 p-3.5 bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B0C10] rounded-xl font-extrabold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
          >
            <ArrowLeft size={16} strokeWidth={3} />
            <span>Cobrar en Terminal</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-[#8E9297] hover:text-red-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <LogOut size={15} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 overflow-y-auto p-10 bg-[#0B0C10]">
        
        {mensajeExito && (
          <div className="mb-6 flex items-center gap-2 p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-emerald-400 font-bold text-xs">
            <CheckCircle2 size={16} />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* 1. PASE DE ASISTENCIA / HABILITACIÓN DE ACCESO POR EL ADMIN */}
        {tabActiva === 'asistencia' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Pase de Lista y Asistencia</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                El Administrador autoriza qué meseros y cajeros pueden ingresar a laborar en el POS hoy
              </p>
            </div>

            <div className="bg-[#14171E] border border-[#1F2833] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0C10] text-[#8E9297] font-mono uppercase tracking-wider border-b border-[#1F2833]">
                  <tr>
                    <th className="p-4">Colaborador</th>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Rol / Cargo</th>
                    <th className="p-4">Estado de Acceso</th>
                    <th className="p-4 text-right">Acción de Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2833]">
                  {usuariosLista.filter(u => u.rol !== 'admin').map(u => (
                    <tr key={u.id} className="hover:bg-[#1F2833]/40">
                      <td className="p-4 font-bold text-white">{u.nombre}</td>
                      <td className="p-4 font-mono text-[#C5A059]">{u.usuario}</td>
                      <td className="p-4 text-[#8E9297]">{u.cargo} ({u.rol})</td>
                      <td className="p-4">
                        {u.activo_hoy ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-500/40">
                            <UserCheck size={14} />
                            <span>Asistencia Activa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-950/40 text-red-400 border border-red-900/40">
                            <UserX size={14} />
                            <span>Bloqueado (Sin Pase)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {u.activo_hoy ? (
                          <button
                            onClick={() => alternarAsistenciaAdmin(u, false)}
                            className="px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                          >
                            Dar Salida
                          </button>
                        ) : (
                          <button
                            onClick={() => alternarAsistenciaAdmin(u, true)}
                            className="px-4 py-2 bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B0C10] font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                          >
                            Dar Entrada (Habilitar)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Historial de Movimientos de Asistencia */}
            <div className="space-y-3 pt-4">
              <h3 className="font-['Syne'] font-bold text-base text-white">Historial de Registros</h3>
              <div className="bg-[#14171E] border border-[#1F2833] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0C10] text-[#8E9297] font-mono uppercase tracking-wider border-b border-[#1F2833]">
                    <tr>
                      <th className="p-3.5">Colaborador</th>
                      <th className="p-3.5">Movimiento</th>
                      <th className="p-3.5">Autorizado Por</th>
                      <th className="p-3.5 text-right">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2833]">
                    {asistencias.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[#8E9297]">
                          Sin registros de asistencia aún.
                        </td>
                      </tr>
                    ) : (
                      asistencias.slice(0, 8).map(a => (
                        <tr key={a.id}>
                          <td className="p-3.5 font-bold text-white">{a.usuario}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                              a.tipo === 'entrada' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-amber-950/60 text-amber-400'
                            }`}>
                              {a.tipo}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#8E9297] font-mono">{a.autorizado_por}</td>
                          <td className="p-3.5 text-right font-mono text-[#8E9297]">
                            {new Date(a.fecha_hora).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. CATÁLOGO CON FOTOS */}
        {tabActiva === 'catalogo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Catálogo & Fotografías</h2>
                <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                  Agrega fotos para una interfaz visual y atractiva
                </p>
              </div>

              <button
                onClick={abrirModalNuevoProd}
                className="h-12 px-5 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Nuevo Producto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {productos.map(p => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#14171E] border border-[#1F2833] flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div className="h-32 w-full rounded-xl bg-gradient-to-br from-[#1F2833] to-[#0B0C10] border border-[#1F2833] overflow-hidden flex items-center justify-center relative">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-4xl">{p.emoji || "🍺"}</span>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                      {p.categoria}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{p.nombre}</h3>
                    <p className="text-[11px] text-[#8E9297] line-clamp-1 mt-0.5">{p.descripcion || "Sin descripción"}</p>
                    <div className="font-mono font-black text-lg text-[#C5A059] mt-1.5">
                      ${p.precio.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#1F2833]">
                    <button
                      onClick={() => abrirModalEditarProd(p)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[#1F2833] hover:bg-[#2C3540] text-xs font-bold text-white rounded-lg transition active:scale-95"
                    >
                      <Edit2 size={13} />
                      <span>Editar / Foto</span>
                    </button>
                    <button
                      onClick={() => eliminarProducto(p.id)}
                      className="h-9 px-3 flex items-center justify-center bg-red-950/20 hover:bg-red-900/40 text-red-400 rounded-lg transition active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. REPORTES BÁSICOS DE VENTAS */}
        {tabActiva === 'reportes' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Reportes Básicos de Ventas</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                Resumen financiero histórico y productos estrella
              </p>
            </div>

            {reporte && (
              <>
                <div className="grid grid-cols-2 gap-5">
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Totales Acumuladas</span>
                    <div className="text-4xl font-extrabold font-mono text-[#C5A059]">
                      ${reporte.gran_total?.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Tickets Cobrados</span>
                    <div className="text-4xl font-extrabold font-mono text-white">
                      {reporte.total_tickets}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Top 5 Más Vendidos</h3>
                    <div className="space-y-2.5">
                      {reporte.top_productos.map((tp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-[#0B0C10] rounded-xl border border-[#1F2833]">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{tp.emoji}</span>
                            <span className="text-xs font-bold text-white">{tp.nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-[#C5A059]">{tp.unidades} uds</span>
                            <span className="text-[10px] text-[#8E9297] block">${tp.monto.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Últimos Tickets</h3>
                    <div className="space-y-2">
                      {reporte.ultimos_tickets.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-[#0B0C10] rounded-xl border border-[#1F2833] text-xs">
                          <div>
                            <span className="font-bold text-white">Ticket #{t.id}</span>
                            <span className="text-[10px] text-[#8E9297] block">{t.cajero} • {t.metodo}</span>
                          </div>
                          <span className="font-mono font-bold text-[#C5A059]">${t.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. CORTES X Y Z */}
        {tabActiva === 'corte' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Módulos de Arqueo y Cierre</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                Auditoría instantánea sin inventarios
              </p>
            </div>

            {cargandoCorte ? (
              <div className="py-12 flex items-center justify-center gap-2 text-[#8E9297]">
                <Loader2 size={24} className="animate-spin text-[#C5A059]" />
                <span>Calculando corte...</span>
              </div>
            ) : corteData ? (
              <>
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Efectivo</span>
                    <div className="text-3xl font-extrabold font-mono text-white">
                      ${corteData.total_efectivo?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Tarjeta</span>
                    <div className="text-3xl font-extrabold font-mono text-[#C5A059]">
                      ${corteData.total_tarjeta?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Total en Caja (Inc. Fondo)</span>
                    <div className="text-3xl font-extrabold font-mono text-emerald-400">
                      ${corteData.efectivo_en_caja?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Turno #{corteData.turno_id} Activo</h3>
                      <p className="text-xs text-[#8E9297]">
                        Fondo Inicial: <strong className="text-white">${corteData.fondo_inicial}</strong> | Cajero: <strong className="text-white">{corteData.cajero}</strong>
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold uppercase">
                      Turno Abierto
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => alert("Comando de impresión ESC/POS Corte X enviado.")}
                      className="p-5 rounded-2xl bg-[#1F2833] active:bg-[#2C3540] border border-[#2C3540] text-left space-y-2 cursor-pointer transition active:scale-95"
                    >
                      <div className="flex items-center justify-between text-white font-bold">
                        <span>Imprimir Arqueo (Corte X)</span>
                        <Printer size={20} className="text-[#C5A059]" />
                      </div>
                      <p className="text-xs text-[#8E9297]">
                        Lectura parcial sin sellar ni cerrar la sesión activa.
                      </p>
                    </button>

                    <button
                      onClick={ejecutarCorteZ}
                      className="p-5 rounded-2xl bg-amber-950/30 active:bg-amber-900/50 border border-amber-600/40 text-left space-y-2 cursor-pointer transition active:scale-95"
                    >
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>Cierre Definitivo (Corte Z)</span>
                        <ShieldCheck size={20} className="text-amber-400" />
                      </div>
                      <p className="text-xs text-amber-200/70">
                        Cierra y sella el turno en base de datos.
                      </p>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-[#8E9297] bg-[#14171E] rounded-2xl border border-[#1F2833]">
                No hay turno abierto actualmente.
              </div>
            )}
          </div>
        )}

        {/* 5. GESTIÓN DE CAJEROS & MESEROS */}
        {tabActiva === 'cajeros' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Cajeros, Meseros y Personal</h2>
                <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                  Control de usuarios y PINs de acceso táctil
                </p>
              </div>
              <button
                onClick={() => setModalUsuario(true)}
                className="h-11 px-4 bg-[#C5A059] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Nuevo Personal</span>
              </button>
            </div>

            <div className="bg-[#14171E] border border-[#1F2833] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0C10] text-[#8E9297] font-mono uppercase tracking-wider border-b border-[#1F2833]">
                  <tr>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Cargo</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">PIN</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2833]">
                  {usuariosLista.map(u => (
                    <tr key={u.id} className="hover:bg-[#1F2833]/40">
                      <td className="p-4 font-bold text-white">{u.nombre}</td>
                      <td className="p-4 font-mono text-[#C5A059]">{u.usuario}</td>
                      <td className="p-4 text-[#8E9297]">{u.cargo}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase ${
                          u.rol === 'admin' ? 'bg-amber-950/60 text-amber-400 border border-amber-600/40' :
                          u.rol === 'mesero' ? 'bg-blue-950/60 text-blue-400 border border-blue-600/40' : 'bg-[#1F2833] text-[#C5C6C7]'
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">•••• ({u.pin})</td>
                      <td className="p-4 text-right">
                        {u.rol !== 'admin' && (
                          <button
                            onClick={() => eliminarUsuario(u.id)}
                            className="text-xs text-red-400 hover:underline font-bold"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. CONFIGURACIÓN */}
        {tabActiva === 'configuracion' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Configuración del Sistema</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                Datos comerciales e impresora térmica ESC/POS
              </p>
            </div>

            <form onSubmit={guardarConfiguracion} className="space-y-5 bg-[#14171E] border border-[#1F2833] rounded-2xl p-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#C5A059]">Datos del Negocio</h3>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={config.nombre_negocio}
                    onChange={e => setConfig({ ...config, nombre_negocio: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Encabezado de Ticket</label>
                  <input
                    type="text"
                    value={config.encabezado}
                    onChange={e => setConfig({ ...config, encabezado: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Pie de Ticket</label>
                  <input
                    type="text"
                    value={config.pie_ticket}
                    onChange={e => setConfig({ ...config, pie_ticket: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#1F2833]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#C5A059]">Impresora Térmica ESC/POS</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">IP de Red</label>
                    <input
                      type="text"
                      value={config.impresora_ip}
                      onChange={e => setConfig({ ...config, impresora_ip: e.target.value })}
                      className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Puerto (Default 9100)</label>
                    <input
                      type="text"
                      value={config.impresora_puerto}
                      onChange={e => setConfig({ ...config, impresora_puerto: e.target.value })}
                      className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1F2833] flex justify-end">
                <button
                  type="submit"
                  className="h-12 px-6 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
                >
                  <Save size={16} />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* MODAL: PRODUCTO CON FOTOGRAFÍA */}
      {modalProd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-3">
              <h3 className="font-['Syne'] font-bold text-lg text-white">
                {editandoProdId ? 'Editar Producto & Fotografía' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setModalProd(false)} className="text-[#8E9297] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formProd.nombre}
                  onChange={e => setFormProd({ ...formProd, nombre: e.target.value })}
                  placeholder="Ej. Cerveza Artesanal IPA"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Fotografía del Producto</label>
                <div className="space-y-2">
                  {/* Botón para subir archivo desde la computadora o celular */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 h-10 px-3 bg-[#1F2833] hover:bg-[#2C3540] border border-dashed border-[#C5A059]/60 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white cursor-pointer active:scale-95 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSubirArchivoFoto}
                        className="hidden"
                      />
                      {subiendoFoto ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-[#C5A059]" />
                          <span>Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} className="text-[#C5A059]" />
                          <span>Subir Foto desde tu Equipo</span>
                        </>
                      )}
                    </label>

                    {formProd.imagen_url && (
                      <div className="relative group">
                        <img
                          src={formProd.imagen_url}
                          alt="preview"
                          className="w-10 h-10 rounded-xl object-cover border-2 border-[#C5A059]"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormProd(prev => ({ ...prev, imagen_url: '' }))}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shadow"
                          title="Quitar foto"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* O pegar enlace URL directo */}
                  <input
                    type="url"
                    value={formProd.imagen_url}
                    onChange={e => setFormProd({ ...formProd, imagen_url: e.target.value })}
                    placeholder="O pega una URL: https://images.unsplash.com/..."
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-[11px] outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Precio ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formProd.precio}
                    onChange={e => setFormProd({ ...formProd, precio: e.target.value })}
                    placeholder="45.00"
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Emoji Alternativo</label>
                  <input
                    type="text"
                    value={formProd.emoji}
                    onChange={e => setFormProd({ ...formProd, emoji: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-center text-lg outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Categoría</label>
                <select
                  value={formProd.categoria}
                  onChange={e => setFormProd({ ...formProd, categoria: e.target.value })}
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                >
                  <option value="Cervezas">Cervezas</option>
                  <option value="Destilados">Destilados</option>
                  <option value="Cocina">Cocina</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Sin Alcohol">Sin Alcohol</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Descripción</label>
                <input
                  type="text"
                  value={formProd.descripcion}
                  onChange={e => setFormProd({ ...formProd, descripcion: e.target.value })}
                  placeholder="Ej. Servida bien fría"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalProd(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8E9297] hover:bg-[#1F2833]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  {editandoProdId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO USUARIO (CAJERO / MESERO) */}
      {modalUsuario && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-3">
              <h3 className="font-['Syne'] font-bold text-lg text-white">Nuevo Colaborador</h3>
              <button onClick={() => setModalUsuario(false)} className="text-[#8E9297] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarUsuario} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formUsuario.nombre}
                  onChange={e => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  value={formUsuario.usuario}
                  onChange={e => setFormUsuario({ ...formUsuario, usuario: e.target.value })}
                  placeholder="Ej. juanp"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">PIN (4 Dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={formUsuario.pin}
                    onChange={e => setFormUsuario({ ...formUsuario, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Rol</label>
                  <select
                    value={formUsuario.rol}
                    onChange={e => setFormUsuario({ ...formUsuario, rol: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                  >
                    <option value="mesero">Mesero</option>
                    <option value="cajero">Cajero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Cargo</label>
                <input
                  type="text"
                  value={formUsuario.cargo}
                  onChange={e => setFormUsuario({ ...formUsuario, cargo: e.target.value })}
                  placeholder="Ej. Terraza y Mesas"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalUsuario(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8E9297] hover:bg-[#1F2833]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
