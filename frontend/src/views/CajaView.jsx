import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Coffee,
  Beer,
  Wine,
  Pizza,
  Cookie,
  CreditCard,
  Banknote,
  Edit3,
  Shield,
  Grid,
  Loader2,
  DollarSign,
  UserCheck,
  Save,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';

const ICON_MAP = {
  'Cervezas': Beer,
  'Destilados': Wine,
  'Cocina': Pizza,
  'Snacks': Cookie,
  'Sin Alcohol': Coffee,
};

export default function CajaView({ usuario, onSwitchToAdmin, onLogout }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ticketItems, setTicketItems] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [modalidad, setModalidad] = useState('barra');
  const [mesaSeleccionada, setMesaSeleccionada] = useState(1);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState(usuario?.nombre || 'General');
  const [usuariosPersonal, setUsuariosPersonal] = useState([]);
  const [modalMesas, setModalMesas] = useState(false);
  const [modalMeseros, setModalMeseros] = useState(false);
  const [modalCuentasAbiertas, setModalCuentasAbiertas] = useState(false);
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [cuentaActivaId, setCuentaActivaId] = useState(null);
  const [guardandoCuenta, setGuardandoCuenta] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [notaOrden, setNotaOrden] = useState('');

  // Turno activo y modal de fondo inicial
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [modalFondo, setModalFondo] = useState(false);
  const [fondoInput, setFondoInput] = useState('1000');

  // Modal de Cobro & Cálculo de Cambio & Ticket Previo
  const [modalCobro, setModalCobro] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('efectivo'); // 'efectivo' | 'tarjeta'
  const [montoRecibido, setMontoRecibido] = useState('');
  const [propinaSeleccionada, setPropinaSeleccionada] = useState(0); // 0 | 10 | 15 | 20 | personalizado
  const [montoPropina, setMontoPropina] = useState(0); // Valor numérico calculado de la propina
  const [ultimosDigitosTarjeta, setUltimosDigitosTarjeta] = useState(''); // Cotejo de tarjeta
  const [numAutorizacion, setNumAutorizacion] = useState(''); // Número de voucher / autorización opcional
  const [ticketFinalizado, setTicketFinalizado] = useState(null); // Para mostrar vista previa o imprimir ticket tras cobro

  // Modal de Autorización por NIP de Admin (para Cancelar/Borrar Comanda)
  const [modalAuthAdmin, setModalAuthAdmin] = useState(false);
  const [pinAdminInput, setPinAdminInput] = useState('');
  const [accionPendienteAdmin, setAccionPendienteAdmin] = useState(null); // callback de borrado
  const [errorAuthAdmin, setErrorAuthAdmin] = useState('');

  const esAdmin = usuario?.rol === 'admin';

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      const [prodsData, usrsData] = await Promise.all([
        api.getProductos(),
        api.getUsuarios().catch(() => [])
      ]);
      setProductos(prodsData);
      setUsuariosPersonal(usrsData);
    } catch (err) {
      console.error("Error al cargar productos o usuarios", err);
    } finally {
      setCargando(false);
    }
  };

  const verificarTurno = async () => {
    try {
      const t = await api.getTurnoActivo();
      if (!t) {
        // Tanto admin como cajero ven el modal si no hay turno abierto
        setModalFondo(true);
      } else {
        setTurnoActivo(t);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cargarCuentasAbiertas = async () => {
    try {
      const data = await api.getCuentasAbiertas();
      setCuentasAbiertas(data || []);
    } catch (err) {
      console.error("Error al cargar cuentas abiertas", err);
    }
  };

  useEffect(() => {
    cargarCatalogo();
    verificarTurno();
    cargarCuentasAbiertas();
  }, []);

  const nombreMesaActual = modalidad === 'barra' ? 'Barra' : (modalidad === 'llevar' ? 'Para Llevar' : `Mesa ${mesaSeleccionada}`);

  const cargarCuentaDeMesa = async (mesaNombre) => {
    try {
      const cuenta = await api.getCuentaPorMesa(mesaNombre);
      if (cuenta && cuenta.partidas && cuenta.partidas.length > 0) {
        setCuentaActivaId(cuenta.id);
        setMeseroSeleccionado(cuenta.mesero);
        setNotaOrden(cuenta.nota || '');
        setTicketItems(cuenta.partidas.map(p => ({
          id: p.producto_id,
          nombre: p.nombre,
          precio: p.precio,
          cantidad: p.cantidad
        })));
      } else {
        setCuentaActivaId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const seleccionarMesaYRecuperar = (num) => {
    // Al cambiar de mesa, se limpia la pantalla y se carga la cuenta propia de esa mesa (si la tiene)
    setMesaSeleccionada(num);
    setModalidad('mesa');
    setModalMesas(false);
    setTicketItems([]);
    setNotaOrden('');
    setCuentaActivaId(null);
    cargarCuentaDeMesa(`Mesa ${num}`);
  };

  const cambiarModalidadYLimpiar = (nuevaModalidad) => {
    // Al cambiar a barra o para llevar, se limpia la comanda y se aísla la cuenta
    setModalidad(nuevaModalidad);
    setTicketItems([]);
    setNotaOrden('');
    setCuentaActivaId(null);
    const nombreCuenta = nuevaModalidad === 'barra' ? 'Barra' : 'Para Llevar';
    cargarCuentaDeMesa(nombreCuenta);
  };

  const solicitarAutorizacionAdminParaLimpiar = () => {
    if (ticketItems.length === 0) return;
    
    // Si el usuario actual ya es Admin, se limpia directamente
    if (esAdmin) {
      if (window.confirm("¿Confirmas limpiar toda la comanda actual?")) {
        setTicketItems([]);
        setNotaOrden('');
        setCuentaActivaId(null);
      }
      return;
    }

    // Si es cajero o mesero, se exige NIP de Admin para auditar
    setPinAdminInput('');
    setErrorAuthAdmin('');
    setAccionPendienteAdmin(() => () => {
      setTicketItems([]);
      setNotaOrden('');
      setCuentaActivaId(null);
    });
    setModalAuthAdmin(true);
  };

  const ejecutarVerificacionAdmin = async () => {
    try {
      await api.verificarPinAdmin(pinAdminInput);
      if (accionPendienteAdmin) {
        accionPendienteAdmin();
      }
      setModalAuthAdmin(false);
      setPinAdminInput('');
      setAccionPendienteAdmin(null);
    } catch (err) {
      setErrorAuthAdmin(err.message || "PIN no autorizado");
      setPinAdminInput('');
    }
  };

  const guardarComandaEnCuenta = async () => {
    if (ticketItems.length === 0) return;
    setGuardandoCuenta(true);
    try {
      const payload = {
        mesa: nombreMesaActual,
        mesero: meseroSeleccionado || usuario?.nombre || "General",
        cajero: usuario?.nombre || "Cajero",
        nota: notaOrden,
        partidas: ticketItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad
        }))
      };
      await api.guardarCuenta(payload);
      await cargarCuentasAbiertas();
      setCobroExitoso(true);
      setTimeout(() => setCobroExitoso(false), 2500);
    } catch (err) {
      alert("Error al guardar cuenta abierta: " + err.message);
    } finally {
      setGuardandoCuenta(false);
    }
  };

  const abrirCuentaDesdeModal = (c) => {
    setCuentaActivaId(c.id);
    if (c.mesa.startsWith('Mesa ')) {
      const n = parseInt(c.mesa.replace('Mesa ', '')) || 1;
      setMesaSeleccionada(n);
      setModalidad('mesa');
    } else if (c.mesa === 'Barra') {
      setModalidad('barra');
    } else {
      setModalidad('llevar');
    }
    setMeseroSeleccionado(c.mesero);
    setNotaOrden(c.nota || '');
    setTicketItems(c.partidas.map(p => ({
      id: p.producto_id,
      nombre: p.nombre,
      precio: p.precio,
      cantidad: p.cantidad
    })));
    setModalCuentasAbiertas(false);
  };

  const iniciarTurnoConFondo = async (e) => {
    e.preventDefault();
    try {
      const fondo = parseFloat(fondoInput) || 0;
      const nuevo = await api.abrirTurno(usuario.id, fondo);
      setTurnoActivo(nuevo);
      setModalFondo(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];

  const agregarProducto = (producto) => {
    setTicketItems(prev => {
      const idx = prev.findIndex(item => item.id === producto.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const modificarCantidad = (id, delta) => {
    // Si la cantidad llega a 0 (eliminación de producto de la comanda), se requiere auditar si no es admin
    const itemActual = ticketItems.find(it => it.id === id);
    if (itemActual && itemActual.cantidad + delta <= 0) {
      if (esAdmin) {
        setTicketItems(prev => prev.filter(it => it.id !== id));
        return;
      }
      // Solicitar NIP de Administrador para auditar borrado de artículo
      setPinAdminInput('');
      setErrorAuthAdmin('');
      setAccionPendienteAdmin(() => () => {
        setTicketItems(prev => prev.filter(it => it.id !== id));
      });
      setModalAuthAdmin(true);
      return;
    }

    setTicketItems(prev =>
      prev
        .map(item => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter(item => item.cantidad > 0)
    );
  };

  const limpiarTicket = () => setTicketItems([]);

  const subtotal = ticketItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const totalConPropina = subtotal + montoPropina;
  const total = totalConPropina;

  const seleccionarPorcentajePropina = (pct) => {
    setPropinaSeleccionada(pct);
    const calculada = Math.round((subtotal * (pct / 100)) * 10) / 10;
    setMontoPropina(calculada);
    if (metodoSeleccionado === 'efectivo') {
      setMontoRecibido((subtotal + calculada).toString());
    }
  };

  const productosFiltrados = productos.filter(p => {
    const coincideCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const coincideBusq = busqueda.trim() === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusq;
  });

  const abrirCobroModal = (metodo) => {
    if (ticketItems.length === 0) return;
    setMetodoSeleccionado(metodo);
    setPropinaSeleccionada(0);
    setMontoPropina(0);
    setMontoRecibido(subtotal.toString());
    setUltimosDigitosTarjeta('');
    setNumAutorizacion('');
    setModalCobro(true);
  };

  const handleCobroTecladoDigit = (d) => {
    if (metodoSeleccionado === 'efectivo') {
      if (d === '.' && montoRecibido.includes('.')) return;
      setMontoRecibido(prev => (prev === '0' || prev === total.toString() ? d : prev + d));
    } else {
      if (ultimosDigitosTarjeta.length < 4) {
        setUltimosDigitosTarjeta(prev => prev + d);
      }
    }
  };

  const handleCobroTecladoBackspace = () => {
    if (metodoSeleccionado === 'efectivo') {
      setMontoRecibido(prev => prev.slice(0, -1) || '0');
    } else {
      setUltimosDigitosTarjeta(prev => prev.slice(0, -1));
    }
  };

  const handleCobroTecladoClear = () => {
    if (metodoSeleccionado === 'efectivo') {
      setMontoRecibido('0');
    } else {
      setUltimosDigitosTarjeta('');
    }
  };

  const procesarVentaFinal = async () => {
    if (cobrando) return;
    const pagado = parseFloat(montoRecibido) || total;
    if (metodoSeleccionado === 'efectivo' && pagado < total) {
      alert("El monto recibido es menor al total a pagar.");
      return;
    }

    setCobrando(true);
    try {
      const payload = {
        total,
        propina: montoPropina,
        metodo_pago: metodoSeleccionado,
        cajero_id: meseroSeleccionado || usuario?.nombre || "Cajero",
        turno_id: turnoActivo?.id || null,
        mesa: nombreMesaActual,
        mesero: meseroSeleccionado || usuario?.nombre || "General",
        cuenta_id: cuentaActivaId,
        partidas: ticketItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad
        }))
      };

      const resTicket = await api.registrarTicket(payload);
      await cargarCuentasAbiertas();
      
      const cambioCalculado = metodoSeleccionado === 'efectivo' ? Math.max(0, pagado - total) : 0;
      
      setTicketFinalizado({
        id: resTicket.id,
        items: [...ticketItems],
        subtotal,
        propina: montoPropina,
        total,
        pagado,
        cambio: cambioCalculado,
        metodo: metodoSeleccionado,
        cajero: usuario?.nombre || "Cajero",
        mesero: meseroSeleccionado,
        modalidad,
        fecha: new Date().toLocaleTimeString(),
        mesa: nombreMesaActual,
        nota: notaOrden,
        tarjeta_digitos: metodoSeleccionado === 'tarjeta' ? ultimosDigitosTarjeta : null,
        autorizacion: metodoSeleccionado === 'tarjeta' ? numAutorizacion : null
      });

      setModalCobro(false);
      setTicketItems([]);
      setCuentaActivaId(null);
      setNotaOrden('');
      setCobrando(false);
    } catch (err) {
      alert("Error al procesar cobro: " + err.message);
      setCobrando(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#070A0E] text-[#D1D5DB] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* SIDEBAR */}
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

          <nav className="space-y-1.5" aria-label="Navegación">
            <button
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-[#E76F51] text-[#070A0E] shadow-[0_4px_16px_rgba(231,111,81,0.25)] transition active:scale-95 cursor-pointer font-black"
            >
              <LayoutDashboard size={18} />
              <span>Punto de Venta</span>
            </button>

            {/* Acceso Directo a Cuentas Abiertas */}
            <button
              onClick={() => {
                cargarCuentasAbiertas();
                setModalCuentasAbiertas(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-[#111722] hover:bg-[#182130] text-[#E5E7EB] border border-[#1A2330] transition active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <FolderOpen size={18} className="text-[#E9C46A]" />
                <span>Cuentas Abiertas</span>
              </div>
              {cuentasAbiertas.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#E9C46A] text-[#0C1821] text-[10px] font-black flex items-center justify-center font-mono">
                  {cuentasAbiertas.length}
                </span>
              )}
            </button>

            {esAdmin && (
              <>
                <div className="pt-3 pb-1 px-3 text-[10px] font-mono uppercase tracking-widest text-[#93A8AC] border-t border-[#264653]">
                  Panel Admin
                </div>

                <button
                  onClick={() => onSwitchToAdmin('catalogo')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <UtensilsCrossed size={18} />
                  <span>Catálogo & Fotos</span>
                </button>

                <button
                  onClick={() => onSwitchToAdmin('corte')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <Receipt size={18} />
                  <span>Cortes X & Z</span>
                </button>

                <button
                  onClick={() => onSwitchToAdmin('cajeros')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <Users size={18} />
                  <span>Cajeros & Meseros</span>
                </button>

                <button
                  onClick={() => onSwitchToAdmin('configuracion')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#93A8AC] hover:bg-[#1B3B4B] hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <Settings size={18} />
                  <span>Configuración</span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="space-y-2">
          {!esAdmin && (
            <button
              onClick={() => onLogout()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#E9C46A] bg-[#E9C46A]/10 hover:bg-[#E9C46A]/20 rounded-xl border border-[#E9C46A]/30 transition active:scale-95 cursor-pointer"
            >
              <Shield size={14} />
              <span>Cambiar Usuario</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-300 hover:text-red-200 hover:bg-red-950/30 rounded-xl border border-transparent hover:border-red-900/40 transition active:scale-95 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CATÁLOGO PRINCIPAL */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#070A0E] border-r border-[#151D28]">
        <header className="h-20 px-8 bg-[#0B0F15] border-b border-[#151D28] flex items-center justify-between gap-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar un trago, platillo, café o cerveza..."
              className="w-full h-12 pl-11 pr-4 bg-[#070A0E] border border-[#1A2330] focus:border-[#E76F51] rounded-2xl text-xs text-[#E5E7EB] placeholder-[#6B7280] outline-none transition shadow-inner"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalFondo(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#070A0E] hover:bg-[#111722] border border-[#1A2330] text-xs font-mono transition cursor-pointer active:scale-95"
              title="Abrir o consultar turno"
            >
              <span className="text-[#6B7280]">Turno:</span>
              <span className="font-bold text-[#E9C46A]">
                {turnoActivo ? `#${turnoActivo.id} ($${turnoActivo.fondo_inicial})` : '⚠️ Abrir Turno'}
              </span>
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-[#151D28]">
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-white font-['Syne'] font-extrabold text-sm ${
                esAdmin ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : 'bg-[#111722] border-[#E9C46A]/40 text-[#E9C46A]'
              }`}>
                {usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#E5E7EB] leading-tight">{usuario?.nombre || 'Usuario'}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#E9C46A] font-semibold">
                  {usuario?.cargo || usuario?.rol}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-7">
          <div className="space-y-3">
            <h2 className="font-['Syne'] font-bold text-base text-white tracking-wide">Categorías</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {categorias.map(cat => {
                const IconComponent = ICON_MAP[cat] || Grid;
                const isActive = categoriaActiva === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`h-20 min-w-[120px] px-4 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-md ${
                      isActive
                        ? "bg-[#E76F51] border-[#E76F51] text-[#070A0E] shadow-[0_6px_20px_rgba(231,111,81,0.35)] font-black"
                        : "bg-[#0B0F15] border-[#151D28] text-[#9CA3AF] hover:border-[#E9C46A]/50 hover:text-white"
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="text-xs uppercase font-bold">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-['Syne'] font-bold text-base text-white tracking-wide">
                Menú y Especialidades Marejada
              </h2>
              <span className="font-['JetBrains_Mono'] text-xs text-[#93A8AC]">
                {productosFiltrados.length} productos disponibles
              </span>
            </div>

            {cargando ? (
              <div className="py-20 flex flex-col items-center justify-center text-[#93A8AC] space-y-3">
                <Loader2 size={36} className="animate-spin text-[#E9C46A]" />
                <span className="text-xs font-mono">Cargando menú...</span>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="py-16 text-center text-[#93A8AC] text-sm">
                No hay productos en esta categoría.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4.5">
                {productosFiltrados.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => agregarProducto(prod)}
                    className="p-3.5 rounded-2xl bg-[#0B0F15] active:bg-[#111722] border border-[#151D28] hover:border-[#E9C46A]/50 active:border-[#E76F51] flex flex-col justify-between gap-3 shadow-lg active:scale-95 transition-all text-left cursor-pointer overflow-hidden group select-none"
                  >
                    {/* Foto o Emoji */}
                    <div className="h-32 w-full rounded-xl bg-gradient-to-br from-[#111722] to-[#070A0E] border border-[#151D28] overflow-hidden flex items-center justify-center relative">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-4xl pointer-events-none">{prod.emoji || "🍺"}</span>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs font-mono text-[10px] text-white">
                        {prod.categoria}
                      </div>
                    </div>

                    <div className="space-y-0.5 text-center w-full">
                      <h3 className="font-bold text-sm text-[#F4EBD9] line-clamp-1">{prod.nombre}</h3>
                      <p className="text-[11px] text-[#93A8AC] line-clamp-1">{prod.descripcion || prod.categoria}</p>
                      <div className="font-['JetBrains_Mono'] font-extrabold text-base text-[#E9C46A] pt-1">
                        ${prod.precio.toFixed(2)}
                      </div>
                    </div>

                    {/* Botón visual de confirmación */}
                    <div
                      className="w-full h-11 flex items-center justify-center gap-1.5 bg-[#E76F51] group-active:bg-[#C85A3D] text-[#0C1821] font-black text-xs tracking-wider uppercase rounded-xl shadow-[0_4px_14px_rgba(231,111,81,0.25)] transition"
                    >
                      <Plus size={16} strokeWidth={3} />
                      <span>Agregar</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* COMANDA / TICKET */}
      <aside className="w-[420px] bg-[#0B0F15] flex flex-col h-full shrink-0 border-l border-[#151D28]">
        <div className="p-6 border-b border-[#151D28] space-y-4 shrink-0 bg-[#070A0E]/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-lg text-white tracking-wide">
                Comanda en Curso
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-bold text-[#E9C46A]">
                  {modalidad === 'mesa' ? `Mesa ${mesaSeleccionada}` : modalidad === 'barra' ? 'Barra' : 'Para Llevar'}
                </span>
                <span className="text-[#9CA3AF] text-xs">• {meseroSeleccionado}</span>
              </div>
            </div>

            {ticketItems.length > 0 && (
              <button
                type="button"
                onClick={solicitarAutorizacionAdminParaLimpiar}
                className="p-2.5 rounded-xl bg-red-950/30 active:bg-red-900/40 border border-red-900/40 text-red-300 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Auditoría requerida para cancelar o limpiar comanda"
              >
                <Trash2 size={16} />
                <span className="text-[10px] font-mono uppercase font-bold text-red-400">Auditar</span>
              </button>
            )}
          </div>

          {/* Modalidad de Consumo */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#070A0E] rounded-xl border border-[#151D28]">
            <button
              onClick={() => {
                setModalidad('mesa');
                setModalMesas(true);
              }}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'mesa' ? 'bg-[#111722] text-white shadow-sm border border-[#1A2330]' : 'text-[#9CA3AF]'
              }`}
            >
              En Mesa
            </button>
            <button
              onClick={() => cambiarModalidadYLimpiar('barra')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'barra' ? 'bg-[#111722] text-white shadow-sm border border-[#1A2330]' : 'text-[#9CA3AF]'
              }`}
            >
              En Barra
            </button>
            <button
              onClick={() => cambiarModalidadYLimpiar('llevar')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'llevar' ? 'bg-[#111722] text-white shadow-sm border border-[#1A2330]' : 'text-[#9CA3AF]'
              }`}
            >
              Para Llevar
            </button>
          </div>

          {/* Botones de Selección Rápida: Mesa y Mesero */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalMesas(true)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#070A0E] border border-[#151D28] hover:border-[#E9C46A]/50 transition cursor-pointer text-left active:scale-95"
            >
              <div>
                <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block leading-none">Mesa</span>
                <span className="font-['JetBrains_Mono'] text-sm font-black text-white">
                  {modalidad === 'mesa' ? `#${mesaSeleccionada}` : 'Cambiar'}
                </span>
              </div>
              <Grid size={15} className="text-[#E9C46A]" />
            </button>

            <button
              type="button"
              onClick={() => setModalMeseros(true)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0C1821] border border-[#264653] hover:border-[#E9C46A]/50 transition cursor-pointer text-left active:scale-95"
            >
              <div className="truncate mr-1">
                <span className="text-[10px] uppercase font-mono text-[#93A8AC] block leading-none">Mesero</span>
                <span className="text-xs font-bold text-white truncate block">
                  {meseroSeleccionado}
                </span>
              </div>
              <UserCheck size={15} className="text-[#E9C46A] shrink-0" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {ticketItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8E9297] space-y-2 opacity-60">
              <p className="text-xs font-mono uppercase tracking-widest text-center">
                Comanda vacía
              </p>
            </div>
          ) : (
            ticketItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0C10] border border-[#1F2833]"
              >
                <div className="flex-1 mr-2 min-w-0">
                  <div className="font-bold text-xs text-white truncate">{item.nombre}</div>
                  <div className="text-[11px] font-mono text-[#8E9297] mt-0.5">
                    ${item.precio.toFixed(2)} c/u
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#14171E] p-1 rounded-lg border border-[#1F2833]">
                  <button
                    onClick={() => modificarCantidad(item.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-[#1F2833] active:bg-[#C5A059] active:text-[#0B0C10] text-white active:scale-95"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-xs text-white">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => modificarCantidad(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-[#1F2833] active:bg-[#C5A059] active:text-[#0B0C10] text-white active:scale-95"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="w-20 text-right font-mono font-extrabold text-sm text-[#C5A059]">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-[#0B0F15] border-t border-[#151D28] space-y-4 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#070A0E] rounded-xl border border-[#1A2330]">
            <Edit3 size={14} className="text-[#6B7280]" />
            <input
              type="text"
              value={notaOrden}
              onChange={(e) => setNotaOrden(e.target.value)}
              placeholder="Agregar nota a la comanda..."
              className="w-full bg-transparent text-xs text-white placeholder-[#6B7280] outline-none"
            />
          </div>

          <div className="space-y-1.5 text-xs text-[#9CA3AF] pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#151D28] text-sm text-white font-bold items-baseline">
              <span className="uppercase tracking-wider font-['Syne']">Total a Pagar</span>
              <span className="font-['JetBrains_Mono'] text-2xl font-black text-[#E9C46A]">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {cobroExitoso && (
            <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 font-bold text-xs animate-pulse">
              <CheckCircle2 size={16} />
              <span>¡Comanda guardada en cuenta con éxito!</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            {/* Guardar Comanda en Cuenta Abierta */}
            <button
              onClick={guardarComandaEnCuenta}
              disabled={ticketItems.length === 0 || guardandoCuenta || cobrando}
              className="w-full h-11 flex items-center justify-center gap-2 bg-[#070A0E] hover:bg-[#111722] active:bg-[#182130] disabled:opacity-30 disabled:cursor-not-allowed border border-[#E9C46A]/50 rounded-xl text-[#E9C46A] font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <Save size={16} />
              <span>{guardandoCuenta ? "Guardando..." : "Guardar en Cuenta Abierta"}</span>
            </button>

            <button
              onClick={() => abrirCobroModal("tarjeta")}
              disabled={ticketItems.length === 0 || cobrando}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[#111722] active:bg-[#182130] disabled:opacity-30 disabled:cursor-not-allowed border border-[#1A2330] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <CreditCard size={17} className="text-[#E9C46A]" />
              <span>Cobrar con Tarjeta</span>
            </button>

            <button
              onClick={() => abrirCobroModal("efectivo")}
              disabled={ticketItems.length === 0 || cobrando}
              className="w-full h-14 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#E76F51] to-[#D48C46] active:from-[#C85A3D] active:to-[#E76F51] disabled:opacity-30 disabled:cursor-not-allowed text-[#0C1821] font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_6px_22px_rgba(231,111,81,0.3)] transition active:scale-95 cursor-pointer"
            >
              <Banknote size={20} />
              <span>Cobro en Efectivo / Cambio</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MODAL INICIO DE TURNO (FONDO INICIAL DE CAJA) */}
      {modalFondo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-5 shadow-2xl relative">
            {turnoActivo && (
              <button
                onClick={() => setModalFondo(false)}
                className="absolute top-4 right-4 text-[#8E9297] hover:text-white"
              >
                ✕
              </button>
            )}

            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                <DollarSign size={24} />
              </div>
              <h3 className="font-['Syne'] font-extrabold text-xl text-white pt-2">
                {turnoActivo ? `Turno #${turnoActivo.id} Activo` : 'Apertura de Turno'}
              </h3>
              <p className="text-xs text-[#8E9297]">
                {turnoActivo 
                  ? `Turno abierto por ${turnoActivo.usuario_nombre} con fondo de $${turnoActivo.fondo_inicial.toFixed(2)}`
                  : 'Ingresa el fondo inicial de efectivo en caja para comenzar a cobrar'}
              </p>
            </div>

            {!turnoActivo ? (
              <form onSubmit={iniciarTurnoConFondo} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Fondo de Caja ($)</label>
                  <input
                    type="number"
                    step="50"
                    required
                    value={fondoInput}
                    onChange={e => setFondoInput(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-2xl font-mono font-bold text-center outline-none focus:border-[#C5A059]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-13 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer active:scale-95 transition"
                >
                  Abrir Turno y Empezar
                </button>
              </form>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setModalFondo(false)}
                  className="w-full h-11 bg-[#1F2833] hover:bg-[#2C3540] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Continuar Cobrando
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE COBRO INTERACTIVO: CÁLCULO DE PAGO Y CAMBIO
          ======================================================== */}
      {modalCobro && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#14171E] border border-[#1F2833] rounded-3xl p-7 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-3">
              <div>
                <h3 className="font-['Syne'] font-extrabold text-xl text-white">
                  Procesar Cobro de Cuenta
                </h3>
                <p className="text-xs text-[#8E9297]">
                  Mesa {mesaSeleccionada} • {ticketItems.length} artículos en comanda
                </p>
              </div>
              <button
                onClick={() => setModalCobro(false)}
                className="w-8 h-8 rounded-full bg-[#1F2833] text-[#8E9297] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Selector de Método de Pago */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMetodoSeleccionado('efectivo');
                  setMontoRecibido(total.toString());
                }}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition active:scale-95 ${
                  metodoSeleccionado === 'efectivo'
                    ? 'bg-[#E76F51] border-[#E76F51] text-[#0C1821] shadow-[0_4px_16px_rgba(231,111,81,0.35)] font-black'
                    : 'bg-[#0C1821] border-[#264653] text-[#93A8AC] hover:text-white'
                }`}
              >
                <Banknote size={24} />
                <span className="font-bold text-xs uppercase tracking-wider">Pago en Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMetodoSeleccionado('tarjeta');
                  setMontoRecibido(total.toString());
                }}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition active:scale-95 ${
                  metodoSeleccionado === 'tarjeta'
                    ? 'bg-[#E76F51] border-[#E76F51] text-[#0C1821] shadow-[0_4px_16px_rgba(231,111,81,0.35)] font-black'
                    : 'bg-[#0C1821] border-[#264653] text-[#93A8AC] hover:text-white'
                }`}
              >
                <CreditCard size={24} />
                <span className="font-bold text-xs uppercase tracking-wider">Pago con Tarjeta</span>
              </button>
            </div>

            {/* Selector de Propina Sugerida */}
            <div className="space-y-2 bg-[#0C1821] p-3.5 rounded-2xl border border-[#264653]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono uppercase text-[#93A8AC] font-bold">Ofrecer Propina</span>
                <span className="font-mono font-bold text-[#E9C46A]">
                  {montoPropina > 0 ? `+$${montoPropina.toFixed(2)} (${propinaSeleccionada}%)` : 'Sin propina'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '0%', val: 0 },
                  { label: '10%', val: 10 },
                  { label: '15%', val: 15 },
                  { label: '20%', val: 20 },
                ].map(op => (
                  <button
                    key={op.val}
                    type="button"
                    onClick={() => seleccionarPorcentajePropina(op.val)}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer active:scale-95 ${
                      propinaSeleccionada === op.val
                        ? 'bg-[#E9C46A] border-[#E9C46A] text-[#0C1821] shadow-md'
                        : 'bg-[#1B3B4B] border-[#264653] text-[#F4EBD9] hover:bg-[#264653]'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total a Pagar y Desglose */}
            <div className="p-4 bg-[#0C1821] rounded-2xl border border-[#264653] space-y-1">
              <div className="flex justify-between text-xs text-[#93A8AC] font-mono">
                <span>Consumo:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {montoPropina > 0 && (
                <div className="flex justify-between text-xs text-[#E9C46A] font-mono">
                  <span>Propina voluntaria ({propinaSeleccionada}%):</span>
                  <span>+${montoPropina.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1 border-t border-[#264653]">
                <span className="text-xs font-mono uppercase text-[#F4EBD9] font-bold">Total a Cobrar</span>
                <span className="text-3xl font-black font-['JetBrains_Mono'] text-[#E9C46A]">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cálculo de Efectivo y Cambio */}
            {metodoSeleccionado === 'efectivo' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-[#8E9297] block mb-1">
                    ¿Con cuánto paga el cliente?
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={montoRecibido}
                    onChange={e => setMontoRecibido(e.target.value)}
                    placeholder="Monto entregado"
                    className="w-full bg-[#0B0C10] border-2 border-[#1F2833] focus:border-[#C5A059] rounded-2xl p-3.5 text-2xl font-mono font-bold text-white text-center outline-none"
                  />
                </div>

                {/* Botones de Denominaciones Rápidas */}
                <div className="flex gap-2">
                  {[50, 100, 200, 500, 1000].map(den => (
                    <button
                      key={den}
                      type="button"
                      onClick={() => setMontoRecibido(den.toString())}
                      className="flex-1 py-2 rounded-xl bg-[#1F2833] hover:bg-[#2C3540] active:scale-95 text-white font-mono text-xs font-bold transition cursor-pointer border border-[#2C3540]"
                    >
                      ${den}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMontoRecibido(total.toString())}
                    className="px-3 py-2 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-mono text-xs font-bold hover:bg-[#C5A059]/30 active:scale-95 transition cursor-pointer"
                  >
                    Exacto
                  </button>
                </div>

                {/* Visualizador de Cambio */}
                <div className="p-4 bg-[#14171E] rounded-2xl border border-[#1F2833] flex justify-between items-baseline">
                  <span className="text-xs font-mono uppercase text-[#8E9297] font-bold">Cambio a Entregar</span>
                  <span className={`text-3xl font-black font-['JetBrains_Mono'] ${
                    (parseFloat(montoRecibido) || 0) >= total ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    ${Math.max(0, (parseFloat(montoRecibido) || 0) - total).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Campo y Cotejo para Pago con Tarjeta */}
            {metodoSeleccionado === 'tarjeta' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-[#8E9297] block mb-1">
                    Cotejo de Tarjeta (Últimos 4 dígitos del plástico o voucher)
                  </label>
                  <div className="flex items-center justify-center gap-3 bg-[#0B0C10] border-2 border-[#1F2833] rounded-2xl p-3.5">
                    <span className="text-xl font-mono text-[#8E9297] tracking-widest">•••• •••• ••••</span>
                    <input
                      type="text"
                      maxLength={4}
                      readOnly
                      value={ultimosDigitosTarjeta}
                      placeholder="XXXX"
                      className="w-24 bg-transparent font-['JetBrains_Mono'] font-black text-2xl text-[#C5A059] tracking-widest text-center outline-none"
                    />
                  </div>
                  {ultimosDigitosTarjeta.length < 4 && (
                    <p className="text-[11px] text-amber-400/80 font-mono text-center mt-1.5">
                      Ingresa los 4 dígitos para autorizar el cobro
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#8E9297] block mb-1">
                    Nº Autorización / Voucher (Opcional)
                  </label>
                  <input
                    type="text"
                    value={numAutorizacion}
                    onChange={e => setNumAutorizacion(e.target.value)}
                    placeholder="Ej. AUT-89410"
                    className="w-full bg-[#0B0C10] border border-[#1F2833] focus:border-[#C5A059] rounded-xl p-2.5 text-sm font-mono text-white text-center outline-none"
                  />
                </div>
              </div>
            )}

            {/* TECLADO NUMÉRICO TÁCTIL EN PANTALLA */}
            <div className="bg-[#0B0C10] p-3 rounded-2xl border border-[#1F2833] space-y-2">
              <div className="text-[10px] font-mono uppercase text-[#8E9297] text-center tracking-widest font-bold">
                {metodoSeleccionado === 'efectivo' ? 'Teclado de Efectivo' : 'Teclado para Cotejo de Tarjeta'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleCobroTecladoDigit(d)}
                    className="h-12 rounded-xl bg-[#1F2833] hover:bg-[#2C3540] active:scale-95 text-white font-mono font-black text-lg transition border border-[#2C3540]/60 flex items-center justify-center cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCobroTecladoClear}
                  className="h-12 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition border border-red-900/40 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleCobroTecladoDigit('0')}
                  className="h-12 rounded-xl bg-[#1F2833] hover:bg-[#2C3540] active:scale-95 text-white font-mono font-black text-lg transition border border-[#2C3540]/60 flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleCobroTecladoBackspace}
                  className="h-12 rounded-xl bg-[#1F2833] hover:bg-[#2C3540] text-[#C5A059] font-mono font-bold text-xs uppercase tracking-wider transition border border-[#2C3540]/60 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  ⌫
                </button>
              </div>
            </div>

            {/* Confirmar Cobro */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalCobro(false)}
                className="flex-1 h-13 rounded-2xl bg-[#1F2833] hover:bg-[#2C3540] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  cobrando ||
                  (metodoSeleccionado === 'efectivo' && (parseFloat(montoRecibido) || 0) < total) ||
                  (metodoSeleccionado === 'tarjeta' && ultimosDigitosTarjeta.length < 4)
                }
                onClick={procesarVentaFinal}
                className="flex-2 h-13 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] active:from-[#9E7D3B] active:to-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed text-[#0B0C10] font-black text-sm uppercase tracking-wider shadow-[0_6px_22px_rgba(197,160,89,0.3)] transition active:scale-95 cursor-pointer"
              >
                {cobrando ? "Registrando..." : "Confirmar e Imprimir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TICKET PREVIO / VISTA PREVIA DEL TICKET FINAL
          ======================================================== */}
      {ticketFinalizado && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white text-black font-mono rounded-3xl p-6 space-y-4 shadow-2xl relative select-text">
            
            {/* Cabecera Ticket Físico */}
            <div className="text-center space-y-1.5 border-b-2 border-dashed border-gray-300 pb-4">
              <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border border-gray-300">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-extrabold text-xl tracking-tight">MAREJADA</h4>
              <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-widest">Café • Cocina • Bar</p>
              <p className="text-[11px] text-gray-500">Costa Esmeralda • Barra & Salón</p>
              <div className="text-[11px] text-gray-500 pt-1">
                Ticket #{ticketFinalizado.id} • {ticketFinalizado.mesa}
              </div>
              <div className="text-[11px] text-gray-500">
                Mesero: <span className="font-bold">{ticketFinalizado.mesero}</span> • Caja: {ticketFinalizado.cajero}
              </div>
            </div>

            {/* Partidas */}
            <div className="space-y-1.5 text-xs border-b-2 border-dashed border-gray-300 py-3">
              {ticketFinalizado.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-semibold">{it.cantidad}x {it.nombre}</span>
                  <span className="font-bold">${(it.precio * it.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totales y Cambio */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal alimentos y bebidas:</span>
                <span>${(ticketFinalizado.subtotal || ticketFinalizado.total).toFixed(2)}</span>
              </div>
              {ticketFinalizado.propina > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Propina voluntaria:</span>
                  <span>+${ticketFinalizado.propina.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold pt-1 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>${ticketFinalizado.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Método de pago:</span>
                <span className="uppercase font-bold">{ticketFinalizado.metodo}</span>
              </div>
              {ticketFinalizado.metodo === 'tarjeta' && ticketFinalizado.tarjeta_digitos && (
                <div className="flex justify-between text-gray-700">
                  <span>Tarjeta:</span>
                  <span className="font-bold tracking-widest">•••• {ticketFinalizado.tarjeta_digitos}</span>
                </div>
              )}
              {ticketFinalizado.metodo === 'tarjeta' && ticketFinalizado.autorizacion && (
                <div className="flex justify-between text-gray-700">
                  <span>Autorización:</span>
                  <span className="font-bold">{ticketFinalizado.autorizacion}</span>
                </div>
              )}
              {ticketFinalizado.metodo === 'efectivo' && (
                <>
                  <div className="flex justify-between text-gray-700">
                    <span>Efectivo recibido:</span>
                    <span>${ticketFinalizado.pagado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-emerald-700 pt-1 border-t border-gray-200">
                    <span>CAMBIO:</span>
                    <span>${ticketFinalizado.cambio.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-[10px] text-gray-500 pt-2 border-t-2 border-dashed border-gray-300">
              Sabor a mar, fuego y café. ¡Gracias por su visita a MAREJADA!
            </div>

            {/* Botón para Cerrar o Mandar a Imprimir */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setTicketFinalizado(null);
                  setTicketItems([]);
                  setNotaOrden('');
                  setCuentaActivaId(null);
                }}
                className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition active:scale-95 cursor-pointer font-sans"
              >
                Finalizar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SELECCIÓN DE MESA (MATRIZ TÁCTIL)
          ======================================================== */}
      {modalMesas && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-3">
              <div>
                <h3 className="font-['Syne'] font-extrabold text-xl text-white">
                  Asignar Mesa
                </h3>
                <p className="text-xs text-[#8E9297]">
                  Selecciona la mesa para esta comanda
                </p>
              </div>
              <button
                onClick={() => setModalMesas(false)}
                className="w-8 h-8 rounded-full bg-[#1F2833] text-[#8E9297] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Matriz de Mesas (1 a 16 + Barra) */}
            <div className="grid grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto p-1">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(num => {
                const cuentaMesa = cuentasAbiertas.find(ca => ca.mesa === `Mesa ${num}`);
                const tieneCuenta = !!cuentaMesa;
                return (
                  <button
                    key={num}
                    type="button"
                    data-mesa={num}
                    onClick={() => seleccionarMesaYRecuperar(num)}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center border font-mono transition cursor-pointer active:scale-95 relative ${
                      modalidad === 'mesa' && mesaSeleccionada === num
                        ? 'bg-[#C5A059] border-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.35)]'
                        : tieneCuenta
                        ? 'bg-amber-950/20 border-amber-500/60 text-amber-300 hover:border-amber-400'
                        : 'bg-[#0B0C10] border-[#1F2833] text-white hover:border-[#C5A059]/50'
                    }`}
                  >
                    {tieneCuenta && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                    <span className="text-[10px] uppercase text-opacity-80">Mesa</span>
                    <span className="text-xl font-black">{num}</span>
                    {tieneCuenta && (
                      <span className="text-[9px] font-bold text-amber-300">
                        ${cuentaMesa.total.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2833]">
              <button
                type="button"
                onClick={() => {
                  setModalMesas(false);
                  cambiarModalidadYLimpiar('barra');
                }}
                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  modalidad === 'barra'
                    ? 'bg-[#C5A059] border-[#C5A059] text-[#0B0C10]'
                    : 'bg-[#1F2833] border-[#2C3540] text-white'
                }`}
              >
                🍸 En Barra
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMesas(false);
                  cambiarModalidadYLimpiar('llevar');
                }}
                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  modalidad === 'llevar'
                    ? 'bg-[#C5A059] border-[#C5A059] text-[#0B0C10]'
                    : 'bg-[#1F2833] border-[#2C3540] text-white'
                }`}
              >
                🥡 Para Llevar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SELECCIÓN DE MESERO / CAJERO RESPONSABLE
          ======================================================== */}
      {modalMeseros && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-3">
              <div>
                <h3 className="font-['Syne'] font-extrabold text-xl text-white">
                  Asignar Mesero
                </h3>
                <p className="text-xs text-[#8E9297]">
                  ¿Quién atiende esta orden?
                </p>
              </div>
              <button
                onClick={() => setModalMeseros(false)}
                className="w-8 h-8 rounded-full bg-[#1F2833] text-[#8E9297] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {usuariosPersonal.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setMeseroSeleccionado(u.nombre);
                    setModalMeseros(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition cursor-pointer active:scale-95 ${
                    meseroSeleccionado === u.nombre
                      ? 'bg-[#C5A059] border-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.3)]'
                      : 'bg-[#0B0C10] border-[#1F2833] text-white hover:border-[#C5A059]/40'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-sm">{u.nombre}</div>
                    <div className={`text-[10px] font-mono uppercase ${
                      meseroSeleccionado === u.nombre ? 'text-[#0B0C10]/80 font-bold' : 'text-[#8E9297]'
                    }`}>
                      {u.cargo || u.rol}
                    </div>
                  </div>
                  {meseroSeleccionado === u.nombre && (
                    <CheckCircle2 size={18} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: LISTADO GENERAL DE CUENTAS ABIERTAS
          ======================================================== */}
      {modalCuentasAbiertas && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#14171E] border border-[#1F2833] rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2833] pb-3">
              <div>
                <h3 className="font-['Syne'] font-extrabold text-xl text-white">
                  Cuentas Abiertas en Servicio
                </h3>
                <p className="text-xs text-[#8E9297]">
                  {cuentasAbiertas.length === 0 ? "No hay cuentas activas" : `${cuentasAbiertas.length} comanda(s) activas`}
                </p>
              </div>
              <button
                onClick={() => setModalCuentasAbiertas(false)}
                className="w-8 h-8 rounded-full bg-[#1F2833] text-[#8E9297] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {cuentasAbiertas.length === 0 ? (
              <div className="text-center py-10 text-[#8E9297] space-y-2">
                <FolderOpen size={36} className="mx-auto opacity-40 text-[#C5A059]" />
                <p className="text-xs font-mono uppercase tracking-widest">
                  No hay cuentas pendientes por cobrar
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto p-1">
                {cuentasAbiertas.map(c => (
                  <div
                    key={c.id}
                    data-cuenta-mesa={c.mesa}
                    onClick={() => abrirCuentaDesdeModal(c)}
                    className="p-4 rounded-2xl bg-[#0B0C10] border border-[#1F2833] hover:border-[#C5A059] transition cursor-pointer active:scale-98 flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-['JetBrains_Mono'] font-extrabold text-white text-base">
                          {c.mesa}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#1F2833] text-[10px] font-mono text-[#C5A059] font-bold">
                          {c.mesero}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8E9297]">
                        {c.partidas.length} artículos {c.nota ? `• "${c.nota}"` : ''}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-['JetBrains_Mono'] text-lg font-black text-[#C5A059]">
                        ${c.total.toFixed(2)}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                        Cargar comanda →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: AUTORIZACIÓN POR NIP DE ADMINISTRADOR (AUDITORÍA)
          ======================================================== */}
      {modalAuthAdmin && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#142430] border-2 border-red-500/60 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setModalAuthAdmin(false);
                setPinAdminInput('');
                setAccionPendienteAdmin(null);
              }}
              className="absolute top-4 right-4 text-[#93A8AC] hover:text-white"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/40 border border-red-500/60 flex items-center justify-center text-red-400">
                <Shield size={24} />
              </div>
              <h3 className="font-['Syne'] font-extrabold text-xl text-white pt-1">
                Auditoría Requerida
              </h3>
              <p className="text-xs text-[#93A8AC]">
                Ingresa el <span className="text-[#E9C46A] font-bold">NIP de Administrador</span> para autorizar la cancelación o borrado en la comanda
              </p>
            </div>

            {/* Input PIN Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    pinAdminInput.length > idx
                      ? "bg-red-400 scale-125 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                      : "bg-[#1B3B4B] border border-[#264653]"
                  }`}
                />
              ))}
            </div>

            {errorAuthAdmin && (
              <div className="text-xs text-red-400 font-bold bg-red-950/40 border border-red-900/50 p-2 rounded-xl text-center">
                {errorAuthAdmin}
              </div>
            )}

            {/* Teclado Táctil */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    if (pinAdminInput.length < 4) {
                      const nextPin = pinAdminInput + d;
                      setPinAdminInput(nextPin);
                      setErrorAuthAdmin('');
                    }
                  }}
                  className="h-12 rounded-xl bg-[#0C1821] hover:bg-[#1B3B4B] active:bg-red-950/40 text-white font-mono font-bold text-lg border border-[#264653] flex items-center justify-center cursor-pointer active:scale-95 transition"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinAdminInput('')}
                className="h-12 rounded-xl bg-[#1B3B4B] hover:bg-[#264653] text-[#93A8AC] font-mono font-bold text-xs uppercase flex items-center justify-center cursor-pointer active:scale-95"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinAdminInput.length < 4) {
                    setPinAdminInput(prev => prev + '0');
                    setErrorAuthAdmin('');
                  }
                }}
                className="h-12 rounded-xl bg-[#0C1821] hover:bg-[#1B3B4B] text-white font-mono font-bold text-lg border border-[#264653] flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinAdminInput(prev => prev.slice(0, -1))}
                className="h-12 rounded-xl bg-[#1B3B4B] hover:bg-[#264653] text-[#E76F51] font-mono font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
              >
                ⌫
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={pinAdminInput.length !== 4}
                onClick={ejecutarVerificacionAdmin}
                className="w-full h-12 bg-red-600 active:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                Autorizar Borrado
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
