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
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminView({ usuario, onBackToCaja, onLogout }) {
  const [tabActiva, setTabActiva] = useState('catalogo'); // 'catalogo' | 'corte' | 'cajeros' | 'configuracion'
  
  // Estados para Catálogo (ABM Productos)
  const [productos, setProductos] = useState([]);
  const [cargandoProd, setCargandoProd] = useState(false);
  const [modalProd, setModalProd] = useState(false);
  const [editandoProdId, setEditandoProdId] = useState(null);
  const [formProd, setFormProd] = useState({
    nombre: '',
    precio: '',
    categoria: 'Cervezas',
    descripcion: '',
    emoji: '🍺',
    color_boton: '#14171E'
  });

  // Estados para Cortes X & Z
  const [corteData, setCorteData] = useState(null);
  const [cargandoCorte, setCargandoCorte] = useState(false);

  // Estados para Cajeros
  const [cajeros, setCajeros] = useState([]);
  const [modalCajero, setModalCajero] = useState(false);
  const [formCajero, setFormCajero] = useState({
    nombre: '',
    pin: '',
    rol: 'cajero',
    cargo: 'Personal de Barra'
  });

  // Estados para Configuración
  const [config, setConfig] = useState({
    nombre_negocio: 'ASETI BAR',
    encabezado: '',
    pie_ticket: '',
    impresora_ip: '192.168.1.200',
    impresora_puerto: '9100'
  });
  const [mensajeExito, setMensajeExito] = useState('');

  // 1. CARGA INICIAL
  const cargarProductos = async () => {
    setCargandoProd(true);
    try {
      const data = await api.getProductos();
      setProductos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoProd(false);
    }
  };

  const cargarCajeros = async () => {
    try {
      const data = await api.getUsuarios();
      setCajeros(data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const data = await api.getConfig();
      if (data && Object.keys(data).length > 0) {
        setConfig(prev => ({ ...prev, ...data }));
      }
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
    cargarProductos();
    cargarCajeros();
    cargarConfiguracion();
    cargarCorteActual();
  }, []);

  // 2. ACCIONES CATÁLOGO (ABM)
  const abrirModalNuevoProd = () => {
    setEditandoProdId(null);
    setFormProd({
      nombre: '',
      precio: '',
      categoria: 'Cervezas',
      descripcion: '',
      emoji: '🍺',
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
      color_boton: prod.color_boton || '#14171E'
    });
    setModalProd(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formProd,
        precio: parseFloat(formProd.precio) || 0
      };

      if (editandoProdId) {
        await api.updateProducto(editandoProdId, payload);
      } else {
        await api.createProducto(payload);
      }

      setModalProd(false);
      cargarProductos();
      notificar("¡Producto guardado correctamente en SQLite!");
    } catch (err) {
      alert("Error al guardar producto: " + err.message);
    }
  };

  const eliminarProducto = async (id) => {
    if (confirm("¿Estás seguro de eliminar este producto del menú?")) {
      await api.deleteProducto(id);
      cargarProductos();
      notificar("Producto eliminado del catálogo");
    }
  };

  // 3. ACCIONES CAJEROS
  const guardarCajero = async (e) => {
    e.preventDefault();
    try {
      await api.createUsuario(formCajero);
      setModalCajero(false);
      setFormCajero({ nombre: '', pin: '', rol: 'cajero', cargo: 'Personal de Barra' });
      cargarCajeros();
      notificar("¡Cajero registrado con éxito!");
    } catch (err) {
      alert(err.message);
    }
  };

  const eliminarCajero = async (id) => {
    if (confirm("¿Eliminar acceso de este usuario?")) {
      await api.deleteUsuario(id);
      cargarCajeros();
      notificar("Usuario eliminado");
    }
  };

  // 4. ACCIONES CORTES
  const ejecutarCorteZ = async () => {
    if (confirm("¿Confirma cerrar formalmente el turno actual? Esta acción sellará las ventas acumuladas.")) {
      try {
        const res = await api.postCorteZ();
        setCorteData(res);
        notificar("¡Corte Z ejecutado y turno cerrado con éxito!");
      } catch (err) {
        alert("Error al ejecutar Corte Z: " + err.message);
      }
    }
  };

  // 5. ACCIONES CONFIG
  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    try {
      await api.saveConfig(config);
      notificar("¡Ajustes de sistema y hardware guardados!");
    } catch (err) {
      alert("Error al guardar configuración: " + err.message);
    }
  };

  const notificar = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0C10] text-[#C5C6C7] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-[#14171E] border-r border-[#1F2833] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#9E7D3B] flex items-center justify-center text-[#0B0C10] font-black font-['Syne'] text-lg shadow-[0_0_15px_rgba(197,160,89,0.3)]">
              A
            </div>
            <div>
              <h1 className="font-['Syne'] font-extrabold text-base tracking-wider text-white">
                ADMIN <span className="text-[#C5A059]">PANEL</span>
              </h1>
              <p className="text-[10px] font-['JetBrains_Mono'] tracking-widest text-[#8E9297] uppercase">
                {usuario?.nombre || 'Administrador'}
              </p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Navegación Admin">
            <button
              onClick={() => setTabActiva('catalogo')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'catalogo'
                  ? 'bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)]'
                  : 'text-[#8E9297] hover:bg-[#1F2833] hover:text-white'
              }`}
            >
              <UtensilsCrossed size={18} />
              <span>Catálogo & Menú</span>
            </button>

            <button
              onClick={() => { setTabActiva('corte'); cargarCorteActual(); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                tabActiva === 'corte'
                  ? 'bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)]'
                  : 'text-[#8E9297] hover:bg-[#1F2833] hover:text-white'
              }`}
            >
              <BarChart3 size={18} />
              <span>Cortes X & Z</span>
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
              <span>Gestión de Cajeros</span>
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
            className="w-full flex items-center justify-center gap-2 p-3 bg-[#1F2833] hover:bg-[#2C3540] border border-[#2C3540] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} className="text-[#C5A059]" />
            <span>Volver a Punto de Venta</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-950/20 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 overflow-y-auto p-10 bg-[#0B0C10]">
        
        {mensajeExito && (
          <div className="mb-6 flex items-center gap-2 p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-emerald-400 font-bold text-xs animate-fade-in">
            <CheckCircle2 size={16} />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* ========================================================
            TAB 1: ABM DE CATÁLOGO & MENÚ (AGREGAR / EDITAR / ELIMINAR)
            ======================================================== */}
        {tabActiva === 'catalogo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Catálogo de Productos y Botones POS</h2>
                <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                  Administración visual y precios en SQLite (Cero inventarios)
                </p>
              </div>

              <button
                onClick={abrirModalNuevoProd}
                className="h-12 px-5 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(197,160,89,0.25)]"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Grid de Productos Administrables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {productos.map(p => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-[#14171E] border border-[#1F2833] flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl p-2.5 rounded-xl bg-[#0B0C10] border border-[#1F2833]">{p.emoji || "🍺"}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#8E9297] px-2 py-1 bg-[#1F2833] rounded-md font-semibold">
                      {p.categoria}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{p.nombre}</h3>
                    <p className="text-[11px] text-[#8E9297] line-clamp-1 mt-0.5">{p.descripcion || "Sin descripción"}</p>
                    <div className="font-['JetBrains_Mono'] font-black text-lg text-[#C5A059] mt-2">
                      ${p.precio.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#1F2833]">
                    <button
                      onClick={() => abrirModalEditarProd(p)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[#1F2833] hover:bg-[#2C3540] text-xs font-bold text-white rounded-lg transition active:scale-95"
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
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

        {/* ========================================================
            TAB 2: CORTES X Y Z
            ======================================================== */}
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
                <span>Calculando corte en tiempo real...</span>
              </div>
            ) : corteData ? (
              <>
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Efectivo</span>
                    <div className="text-3xl font-extrabold font-['JetBrains_Mono'] text-white">
                      ${corteData.total_efectivo?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Tarjeta</span>
                    <div className="text-3xl font-extrabold font-['JetBrains_Mono'] text-[#C5A059]">
                      ${corteData.total_tarjeta?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8E9297]">Total en Caja (Inc. Fondo)</span>
                    <div className="text-3xl font-extrabold font-['JetBrains_Mono'] text-emerald-400">
                      ${corteData.efectivo_en_caja?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Turno #{corteData.turno_id} Activo</h3>
                      <p className="text-xs text-[#8E9297]">
                        Cajero: <strong className="text-white">{corteData.cajero}</strong> | Tickets: <strong className="text-[#C5A059]">{corteData.total_tickets}</strong>
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
                No hay ningún turno abierto actualmente.
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: GESTIÓN DE CAJEROS
            ======================================================== */}
        {tabActiva === 'cajeros' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Gestión de Cajeros y Roles</h2>
                <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                  Control de PINs de acceso táctil
                </p>
              </div>
              <button
                onClick={() => setModalCajero(true)}
                className="h-11 px-4 bg-[#C5A059] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Nuevo Cajero</span>
              </button>
            </div>

            <div className="bg-[#14171E] border border-[#1F2833] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0C10] text-[#8E9297] font-mono uppercase tracking-wider border-b border-[#1F2833]">
                  <tr>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Cargo</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">PIN Táctil</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2833]">
                  {cajeros.map(c => (
                    <tr key={c.id} className="hover:bg-[#1F2833]/40">
                      <td className="p-4 font-bold text-white">{c.nombre}</td>
                      <td className="p-4 text-[#8E9297]">{c.cargo}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase ${
                          c.rol === 'admin' ? 'bg-amber-950/60 text-amber-400 border border-amber-600/40' : 'bg-[#1F2833] text-[#C5C6C7]'
                        }`}>
                          {c.rol}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#C5A059]">•••• ({c.pin})</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => eliminarCajero(c.id)}
                          className="text-xs text-red-400 hover:underline font-bold"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CONFIGURACIÓN
            ======================================================== */}
        {tabActiva === 'configuracion' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Configuración del Sistema</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                Datos fiscales, pie de ticket e impresora ESC/POS
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

      {/* ========================================================
          MODAL: NUEVO / EDITAR PRODUCTO (CATÁLOGO ABM)
          ======================================================== */}
      {modalProd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-4">
              <h3 className="font-['Syne'] font-bold text-lg text-white">
                {editandoProdId ? 'Editar Producto' : 'Nuevo Producto para Menú'}
              </h3>
              <button
                onClick={() => setModalProd(false)}
                className="p-1 rounded-lg text-[#8E9297] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formProd.nombre}
                  onChange={e => setFormProd({ ...formProd, nombre: e.target.value })}
                  placeholder="Ej. Cerveza Artesanal 355ml"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                />
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
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Emoji Visual</label>
                  <input
                    type="text"
                    value={formProd.emoji}
                    onChange={e => setFormProd({ ...formProd, emoji: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs text-center text-lg outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Categoría</label>
                <select
                  value={formProd.categoria}
                  onChange={e => setFormProd({ ...formProd, categoria: e.target.value })}
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                >
                  <option value="Cervezas">Cervezas</option>
                  <option value="Destilados">Destilados</option>
                  <option value="Cocina">Cocina</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Sin Alcohol">Sin Alcohol</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={formProd.descripcion}
                  onChange={e => setFormProd({ ...formProd, descripcion: e.target.value })}
                  placeholder="Ej. Servida bien fría en tarro"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalProd(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8E9297] hover:bg-[#1F2833]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  {editandoProdId ? 'Actualizar' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: NUEVO CAJERO
          ======================================================== */}
      {modalCajero && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-4">
              <h3 className="font-['Syne'] font-bold text-lg text-white">Nuevo Cajero / Usuario</h3>
              <button onClick={() => setModalCajero(false)} className="text-[#8E9297] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCajero} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formCajero.nombre}
                  onChange={e => setFormCajero({ ...formCajero, nombre: e.target.value })}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">PIN (4 Dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={formCajero.pin}
                    onChange={e => setFormCajero({ ...formCajero, pin: e.target.value })}
                    placeholder="4321"
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Rol</label>
                  <select
                    value={formCajero.rol}
                    onChange={e => setFormCajero({ ...formCajero, rol: e.target.value })}
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                  >
                    <option value="cajero">Cajero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Cargo</label>
                <input
                  type="text"
                  value={formCajero.cargo}
                  onChange={e => setFormCajero({ ...formCajero, cargo: e.target.value })}
                  placeholder="Ej. Barra Noche"
                  className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCajero(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8E9297] hover:bg-[#1F2833]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
