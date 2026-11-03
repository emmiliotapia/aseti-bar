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
  Loader2
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
  const [mesaSeleccionada, setMesaSeleccionada] = useState(12);
  const [busqueda, setBusqueda] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [notaOrden, setNotaOrden] = useState('');

  const esAdmin = usuario?.rol === 'admin';

  // Cargar catálogo desde SQLite vía FastAPI
  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      const data = await api.getProductos();
      setProductos(data);
    } catch (err) {
      console.error("Error al cargar productos", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

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
    setTicketItems(prev =>
      prev
        .map(item => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter(item => item.cantidad > 0)
    );
  };

  const limpiarTicket = () => setTicketItems([]);

  const subtotal = ticketItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const total = subtotal;

  const productosFiltrados = productos.filter(p => {
    const coincideCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const coincideBusq = busqueda.trim() === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusq;
  });

  // Registro real en backend y base de datos SQLite
  const ejecutarCobro = async (metodo) => {
    if (ticketItems.length === 0 || cobrando) return;
    setCobrando(true);
    try {
      const payload = {
        total,
        metodo_pago: metodo,
        cajero_id: usuario?.nombre || "Cajero",
        partidas: ticketItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad
        }))
      };

      await api.registrarTicket(payload);
      setCobroExitoso(true);
      setTimeout(() => {
        setTicketItems([]);
        setCobroExitoso(false);
        setCobrando(false);
      }, 1200);
    } catch (err) {
      alert("Error al procesar cobro en base de datos: " + err.message);
      setCobrando(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0C10] text-[#C5C6C7] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* 1. SIDEBAR LATERAL: CAJERO VS ADMIN */}
      <aside className="w-64 bg-[#14171E] border-r border-[#1F2833] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#9E7D3B] flex items-center justify-center text-[#0B0C10] font-black font-['Syne'] text-lg shadow-[0_0_15px_rgba(197,160,89,0.3)]">
              A
            </div>
            <div>
              <h1 className="font-['Syne'] font-extrabold text-base tracking-wider text-white">
                ASETI <span className="text-[#C5A059]">BAR</span>
              </h1>
              <p className="text-[10px] font-['JetBrains_Mono'] tracking-widest text-[#8E9297] uppercase">
                {esAdmin ? 'Modo Administrador' : 'Modo Caja Activa'}
              </p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Navegación">
            <button
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              <LayoutDashboard size={18} />
              <span>Punto de Venta</span>
            </button>

            {esAdmin && (
              <>
                <div className="pt-3 pb-1 px-3 text-[10px] font-mono uppercase tracking-widest text-[#8E9297] border-t border-[#1F2833]">
                  Panel Admin
                </div>

                <button
                  onClick={() => onSwitchToAdmin('catalogo')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <UtensilsCrossed size={18} />
                  <span>Catálogo & Menú</span>
                </button>

                <button
                  onClick={() => onSwitchToAdmin('corte')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <Receipt size={18} />
                  <span>Cortes X & Z</span>
                </button>

                <button
                  onClick={() => onSwitchToAdmin('cajeros')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <Users size={18} />
                  <span>Gestión de Cajeros</span>
                </button>

                <button
                  onClick={() => onSwitchToAdmin('configuracion')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#C5A059] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 rounded-xl border border-[#C5A059]/30 transition active:scale-95 cursor-pointer"
            >
              <Shield size={14} />
              <span>Cambiar Usuario</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400/90 hover:text-red-400 hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-900/30 transition active:scale-95 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. CATÁLOGO TÁCTIL */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#0B0C10] border-r border-[#1F2833]">
        <header className="h-20 px-8 bg-[#14171E] border-b border-[#1F2833] flex items-center justify-between gap-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9297]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar un trago, platillo o cerveza..."
              className="w-full h-12 pl-11 pr-4 bg-[#0B0C10] border border-[#1F2833] focus:border-[#C5A059] rounded-2xl text-xs text-white placeholder-[#8E9297] outline-none transition shadow-inner"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              aria-label="Refrescar catálogo"
              onClick={cargarCatalogo}
              className="w-12 h-12 rounded-2xl bg-[#0B0C10] border border-[#1F2833] flex items-center justify-center text-[#8E9297] hover:text-[#C5A059] transition active:scale-95 cursor-pointer"
              title="Refrescar catálogo"
            >
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-[#1F2833]">
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-white font-['Syne'] font-extrabold text-sm ${
                esAdmin ? 'bg-amber-950/40 border-amber-500/50 text-amber-400' : 'bg-[#1F2833] border-[#C5A059]/40'
              }`}>
                {usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">{usuario?.nombre || 'Cajero'}</div>
                <div className={`text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold ${
                  esAdmin ? 'text-amber-400' : 'text-[#C5A059]'
                }`}>
                  {usuario?.cargo || (esAdmin ? 'Administrador' : 'Cajero')}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-7">
          {/* Selector de Categorías */}
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
                    className={`h-20 min-w-[120px] px-4 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-100 active:scale-95 cursor-pointer shadow-md ${
                      isActive
                        ? "bg-[#C5A059] border-[#C5A059] text-[#0B0C10] shadow-[0_6px_20px_rgba(197,160,89,0.3)] font-black"
                        : "bg-[#14171E] border-[#1F2833] text-[#8E9297] hover:border-[#2C3540] hover:text-white"
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="text-xs uppercase font-bold">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-['Syne'] font-bold text-base text-white tracking-wide">
                Nuestras sugerencias y catálogo
              </h2>
              <span className="font-['JetBrains_Mono'] text-xs text-[#8E9297]">
                {productosFiltrados.length} productos disponibles
              </span>
            </div>

            {cargando ? (
              <div className="py-20 flex flex-col items-center justify-center text-[#8E9297] space-y-3">
                <Loader2 size={36} className="animate-spin text-[#C5A059]" />
                <span className="text-xs font-mono">Cargando productos desde base de datos...</span>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="py-16 text-center text-[#8E9297] text-sm">
                No hay productos en esta categoría. Puedes agregarlos desde el Catálogo Admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4.5">
                {productosFiltrados.map(prod => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl bg-[#14171E] border border-[#1F2833] flex flex-col justify-between gap-3 shadow-lg hover:border-[#C5A059]/40 transition-all"
                  >
                    <div className="h-28 w-full rounded-xl bg-gradient-to-br from-[#1F2833]/80 to-[#0B0C10] border border-[#1F2833] flex items-center justify-center text-4xl shadow-inner">
                      <span>{prod.emoji || "🍺"}</span>
                    </div>

                    <div className="space-y-1 text-center">
                      <h3 className="font-bold text-sm text-white line-clamp-1">{prod.nombre}</h3>
                      <p className="text-[11px] text-[#8E9297] line-clamp-1">{prod.descripcion || prod.categoria}</p>
                      <div className="font-['JetBrains_Mono'] font-extrabold text-base text-[#C5A059] pt-1">
                        ${prod.precio.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => agregarProducto(prod)}
                      className="w-full h-11 flex items-center justify-center gap-1.5 bg-[#C5A059] active:bg-[#D4AF37] text-[#0B0C10] font-black text-xs tracking-wider uppercase rounded-xl shadow-[0_4px_14px_rgba(197,160,89,0.2)] transition active:scale-95 cursor-pointer"
                    >
                      <Plus size={16} strokeWidth={3} />
                      <span>Agregar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. TICKET / COMANDA */}
      <aside className="w-[420px] bg-[#14171E] flex flex-col h-full shrink-0 border-l border-[#1F2833]">
        <div className="p-6 border-b border-[#1F2833] space-y-4 shrink-0 bg-[#1F2833]/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-lg text-white tracking-wide">
                Comanda en Curso
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#C5A059]">Mesa {mesaSeleccionada}</span>
                <span className="text-[#8E9297] text-xs">• Barra Principal</span>
              </div>
            </div>

            {ticketItems.length > 0 && (
              <button
                onClick={limpiarTicket}
                aria-label="Vaciar comanda"
                className="p-2.5 rounded-xl bg-red-950/20 active:bg-red-900/40 border border-red-900/40 text-red-400 transition active:scale-95 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0C10] rounded-xl border border-[#1F2833]">
            <button
              onClick={() => setModalidad('mesa')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'mesa' ? 'bg-[#1F2833] text-white shadow-sm border border-[#2C3540]' : 'text-[#8E9297]'
              }`}
            >
              En Mesa
            </button>
            <button
              onClick={() => setModalidad('barra')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'barra' ? 'bg-[#1F2833] text-white shadow-sm border border-[#2C3540]' : 'text-[#8E9297]'
              }`}
            >
              En Barra
            </button>
            <button
              onClick={() => setModalidad('llevar')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'llevar' ? 'bg-[#1F2833] text-white shadow-sm border border-[#2C3540]' : 'text-[#8E9297]'
              }`}
            >
              Para Llevar
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
                  <div className="text-[11px] font-['JetBrains_Mono'] text-[#8E9297] mt-0.5">
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
                  <span className="w-6 text-center font-['JetBrains_Mono'] font-bold text-xs text-white">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => modificarCantidad(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-[#1F2833] active:bg-[#C5A059] active:text-[#0B0C10] text-white active:scale-95"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="w-20 text-right font-['JetBrains_Mono'] font-extrabold text-sm text-[#C5A059]">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-[#0B0C10] border-t border-[#1F2833] space-y-4 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#14171E] rounded-xl border border-[#1F2833]">
            <Edit3 size={14} className="text-[#8E9297]" />
            <input
              type="text"
              value={notaOrden}
              onChange={(e) => setNotaOrden(e.target.value)}
              placeholder="Agregar nota a la orden..."
              className="w-full bg-transparent text-xs text-white placeholder-[#8E9297] outline-none"
            />
          </div>

          <div className="space-y-1.5 text-xs text-[#8E9297] pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#1F2833] text-sm text-white font-bold items-baseline">
              <span className="uppercase tracking-wider font-['Syne']">Total a Pagar</span>
              <span className="font-['JetBrains_Mono'] text-2xl font-black text-[#C5A059]">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {cobroExitoso && (
            <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-400 font-bold text-xs animate-pulse">
              <CheckCircle2 size={16} />
              <span>¡Comanda guardada en SQLite!</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => ejecutarCobro("tarjeta")}
              disabled={ticketItems.length === 0 || cobrando}
              className="w-full h-13 flex items-center justify-center gap-2 bg-[#1F2833] active:bg-[#2C3540] disabled:opacity-30 disabled:cursor-not-allowed border border-[#2C3540] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <CreditCard size={17} className="text-[#C5A059]" />
              <span>{cobrando ? "Procesando..." : "Cobrar con Tarjeta"}</span>
            </button>

            <button
              onClick={() => ejecutarCobro("efectivo")}
              disabled={ticketItems.length === 0 || cobrando}
              className="w-full h-15 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] active:from-[#9E7D3B] active:to-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed text-[#0B0C10] font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_6px_22px_rgba(197,160,89,0.3)] transition active:scale-95 cursor-pointer"
            >
              <Banknote size={20} />
              <span>{cobrando ? "Registrando Venta..." : "Cobrar en Efectivo"}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
