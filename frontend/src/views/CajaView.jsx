import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  Grid,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Coffee,
  Beer,
  Wine,
  Pizza,
  Flame,
  Cookie,
  CreditCard,
  Banknote,
  Edit3
} from 'lucide-react';

const CATEGORIAS_CONFIG = [
  { id: 'Todos', label: 'Todo', icon: Grid },
  { id: 'Cervezas', label: 'Cervezas', icon: Beer },
  { id: 'Destilados', label: 'Destilados', icon: Wine },
  { id: 'Cocina', label: 'Cocina', icon: Pizza },
  { id: 'Snacks', label: 'Snacks', icon: Cookie },
  { id: 'Sin Alcohol', label: 'Bebidas', icon: Coffee },
];

const PRODUCTOS_CATALOGO = [
  {
    id: 1,
    nombre: "Corona Extra 355ml",
    precio: 48.0,
    categoria: "Cervezas",
    emoji: "🍺",
    desc: "Cerveza clara bien fría"
  },
  {
    id: 2,
    nombre: "Victoria Clara 355ml",
    precio: 48.0,
    categoria: "Cervezas",
    emoji: "🍻",
    desc: "Sabor tradicional de malta"
  },
  {
    id: 3,
    nombre: "Tequila Dobel Diamante",
    precio: 140.0,
    categoria: "Destilados",
    emoji: "🥃",
    desc: "Copa servida o en las rocas"
  },
  {
    id: 4,
    nombre: "Mezcal 400 Conejos Joven",
    precio: 130.0,
    categoria: "Destilados",
    emoji: "🍹",
    desc: "Con naranja y sal de gusano"
  },
  {
    id: 5,
    nombre: "Burger Doble ASETI",
    precio: 155.0,
    categoria: "Cocina",
    emoji: "🍔",
    desc: "200g res, queso cheddar fundido"
  },
  {
    id: 6,
    nombre: "Papas Gajo Trufadas",
    precio: 75.0,
    categoria: "Cocina",
    emoji: "🍟",
    desc: "Con parmesano y alioli artesanal"
  },
  {
    id: 7,
    nombre: "Pizza Pepperoni Artesanal",
    precio: 165.0,
    categoria: "Cocina",
    emoji: "🍕",
    desc: "Masa madre y mozzarella fresca"
  },
  {
    id: 8,
    nombre: "Alitas Hot BBQ (8 pzas)",
    precio: 140.0,
    categoria: "Cocina",
    emoji: "🍗",
    desc: "Bañadas en salsa casera ahumada"
  },
  {
    id: 9,
    nombre: "Nachos Arrachera Grill",
    precio: 135.0,
    categoria: "Snacks",
    emoji: "🧀",
    desc: "Totopos, guacamole y queso cheddar"
  },
  {
    id: 10,
    nombre: "Whisky JW Black Label",
    precio: 165.0,
    categoria: "Destilados",
    emoji: "🥃",
    desc: "Copa doble con hielo premium"
  },
  {
    id: 11,
    nombre: "Gin Hendrick's Botanic",
    precio: 155.0,
    categoria: "Destilados",
    emoji: "🍸",
    desc: "Con tónica y pepino fresco"
  },
  {
    id: 12,
    nombre: "Agua Mineral Topo Chico",
    precio: 40.0,
    categoria: "Sin Alcohol",
    emoji: "🥤",
    desc: "Vidrio 355ml extra con gas"
  },
];

export default function CajaView({ onSwitchToAdmin }) {
  const [ticketItems, setTicketItems] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [modalidad, setModalidad] = useState('barra'); // 'barra' | 'mesa' | 'llevar'
  const [mesaSeleccionada, setMesaSeleccionada] = useState(12);
  const [busqueda, setBusqueda] = useState('');
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [notaOrden, setNotaOrden] = useState('');

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

  const productosFiltrados = PRODUCTOS_CATALOGO.filter(p => {
    const coincideCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const coincideBusq = busqueda.trim() === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusq;
  });

  const ejecutarCobro = (metodo) => {
    if (ticketItems.length === 0) return;
    setCobroExitoso(true);
    setTimeout(() => {
      setTicketItems([]);
      setCobroExitoso(false);
    }, 1200);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0C10] text-[#C5C6C7] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* ========================================================
          1. SIDEBAR LATERAL ULTRA-FINO (ESTILO MODERNO)
          ======================================================== */}
      <aside className="w-64 bg-[#14171E] border-r border-[#1F2833] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Logo ASETI BAR */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#9E7D3B] flex items-center justify-center text-[#0B0C10] font-black font-['Syne'] text-lg shadow-[0_0_15px_rgba(197,160,89,0.3)]">
              A
            </div>
            <div>
              <h1 className="font-['Syne'] font-extrabold text-base tracking-wider text-white">
                ASETI <span className="text-[#C5A059]">BAR</span>
              </h1>
              <p className="text-[10px] font-['JetBrains_Mono'] tracking-widest text-[#8E9297] uppercase">
                Obsidian POS v1.0
              </p>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="space-y-1.5" aria-label="Navegación principal">
            <button
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-[#C5A059] text-[#0B0C10] shadow-[0_4px_16px_rgba(197,160,89,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              <LayoutDashboard size={18} />
              <span>Punto de Venta</span>
            </button>

            <button
              onClick={onSwitchToAdmin}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Receipt size={18} />
              <span>Cortes de Turno</span>
            </button>

            <button
              onClick={onSwitchToAdmin}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <UtensilsCrossed size={18} />
              <span>Catálogo & Menú</span>
            </button>

            <button
              onClick={onSwitchToAdmin}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Users size={18} />
              <span>Cajeros y Roles</span>
            </button>

            <button
              onClick={onSwitchToAdmin}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <BarChart3 size={18} />
              <span>Reportes</span>
            </button>

            <button
              onClick={onSwitchToAdmin}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-[#8E9297] hover:bg-[#1F2833] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Settings size={18} />
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        {/* Cierre de Sesión / Turno */}
        <button
          onClick={onSwitchToAdmin}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400/80 hover:text-red-400 hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-900/30 transition active:scale-95 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* ========================================================
          2. CONTENIDO PRINCIPAL (HEADER + CATEGORÍAS + GRID PRODUCTOS)
          ======================================================== */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#0B0C10] border-r border-[#1F2833]">
        
        {/* Header Superior: Buscador y Perfil */}
        <header className="h-20 px-8 bg-[#14171E] border-b border-[#1F2833] flex items-center justify-between gap-6 shrink-0">
          {/* Barra de Búsqueda Táctil */}
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

          {/* Notificaciones y Perfil de Usuario */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Notificaciones del sistema"
              className="w-12 h-12 rounded-2xl bg-[#0B0C10] border border-[#1F2833] flex items-center justify-center text-[#8E9297] hover:text-[#C5A059] transition active:scale-95 cursor-pointer"
            >
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-[#1F2833]">
              <div className="w-11 h-11 rounded-2xl bg-[#1F2833] border border-[#C5A059]/40 flex items-center justify-center text-white font-['Syne'] font-extrabold text-sm">
                ET
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">Emilio Tapia</div>
                <div className="text-[10px] font-['JetBrains_Mono'] text-[#C5A059] uppercase tracking-wider font-semibold">Cajero Líder</div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Container para Catálogo */}
        <div className="flex-1 overflow-y-auto p-8 space-y-7">
          
          {/* Selector de Categorías con Iconos (Como en el Diseño de Referencia) */}
          <div className="space-y-3">
            <h2 className="font-['Syne'] font-bold text-base text-white tracking-wide">
              Categorías
            </h2>

            <div className="grid grid-cols-6 gap-3.5">
              {CATEGORIAS_CONFIG.map(cat => {
                const IconComponent = cat.icon;
                const isActive = categoriaActiva === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id)}
                    className={`h-22 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-100 active:scale-95 cursor-pointer shadow-md ${
                      isActive
                        ? "bg-[#C5A059] border-[#C5A059] text-[#0B0C10] shadow-[0_6px_20px_rgba(197,160,89,0.3)] font-black"
                        : "bg-[#14171E] border-[#1F2833] text-[#8E9297] hover:border-[#2C3540] hover:text-white"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-[#0B0C10]/15' : 'bg-[#0B0C10]'}`}>
                      <IconComponent size={20} className={isActive ? 'text-[#0B0C10]' : 'text-[#C5A059]'} />
                    </div>
                    <span className="text-xs tracking-wide uppercase font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Productos Tipo Card Táctil con Botón Integrado */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-['Syne'] font-bold text-base text-white tracking-wide">
                Nuestras sugerencias y catálogo
              </h2>
              <span className="font-['JetBrains_Mono'] text-xs text-[#8E9297]">
                {productosFiltrados.length} productos disponibles
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {productosFiltrados.map(prod => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-[#14171E] border border-[#1F2833] flex flex-col justify-between gap-3 shadow-lg hover:border-[#C5A059]/40 transition-all"
                >
                  {/* Imagen / Emoji Representativo */}
                  <div className="h-28 w-full rounded-xl bg-gradient-to-br from-[#1F2833]/80 to-[#0B0C10] border border-[#1F2833] flex items-center justify-center text-4xl shadow-inner">
                    <span>{prod.emoji}</span>
                  </div>

                  {/* Información */}
                  <div className="space-y-1 text-center">
                    <h3 className="font-bold text-sm text-white line-clamp-1">{prod.nombre}</h3>
                    <p className="text-[11px] text-[#8E9297] line-clamp-1">{prod.desc}</p>
                    <div className="font-['JetBrains_Mono'] font-extrabold text-base text-[#C5A059] pt-1">
                      ${prod.precio.toFixed(2)}
                    </div>
                  </div>

                  {/* Botón Táctil de Agregar (Estilo + Ajouter del mockup) */}
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
          </div>
        </div>
      </section>

      {/* ========================================================
          3. PANEL LATERAL DERECHO: TICKET / COMMANDE EN COURS
          ======================================================== */}
      <aside className="w-[420px] bg-[#14171E] flex flex-col h-full shrink-0 border-l border-[#1F2833]">
        
        {/* Cabecera del Pedido */}
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
                title="Limpiar todo"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Selector de Modalidad (En Sala / Para Llevar / Domicilio) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0C10] rounded-xl border border-[#1F2833]">
            <button
              onClick={() => setModalidad('mesa')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'mesa'
                  ? 'bg-[#1F2833] text-white shadow-sm border border-[#2C3540]'
                  : 'text-[#8E9297] hover:text-white'
              }`}
            >
              En Mesa
            </button>
            <button
              onClick={() => setModalidad('barra')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'barra'
                  ? 'bg-[#1F2833] text-white shadow-sm border border-[#2C3540]'
                  : 'text-[#8E9297] hover:text-white'
              }`}
            >
              En Barra
            </button>
            <button
              onClick={() => setModalidad('llevar')}
              className={`py-2 text-[11px] font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
                modalidad === 'llevar'
                  ? 'bg-[#1F2833] text-white shadow-sm border border-[#2C3540]'
                  : 'text-[#8E9297] hover:text-white'
              }`}
            >
              Para Llevar
            </button>
          </div>
        </div>

        {/* Lista de Partidas Seleccionadas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {ticketItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8E9297] space-y-2 opacity-60">
              <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#1F2833]">
                <UtensilsCrossed size={36} className="text-[#C5A059]" />
              </div>
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

                {/* Controles de Cantidad */}
                <div className="flex items-center gap-1 bg-[#14171E] p-1 rounded-lg border border-[#1F2833]">
                  <button
                    onClick={() => modificarCantidad(item.id, -1)}
                    aria-label={`Reducir ${item.nombre}`}
                    className="w-7 h-7 flex items-center justify-center rounded bg-[#1F2833] active:bg-[#C5A059] active:text-[#0B0C10] text-white active:scale-95"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center font-['JetBrains_Mono'] font-bold text-xs text-white">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => modificarCantidad(item.id, 1)}
                    aria-label={`Aumentar ${item.nombre}`}
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

        {/* Sección de Resumen y Acciones Finales */}
        <div className="p-6 bg-[#0B0C10] border-t border-[#1F2833] space-y-4 shrink-0">
          
          {/* Nota opcional para cocina/barra */}
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

          {/* Desglose Matemático */}
          <div className="space-y-1.5 text-xs text-[#8E9297] pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Servicio / IVA (0%)</span>
              <span className="font-mono text-white">$0.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#1F2833] text-sm text-white font-bold items-baseline">
              <span className="uppercase tracking-wider font-['Syne']">Total a Pagar</span>
              <span className="font-['JetBrains_Mono'] text-2xl font-black text-[#C5A059]">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Feedback de Cobro */}
          {cobroExitoso && (
            <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-400 font-bold text-xs animate-pulse">
              <CheckCircle2 size={16} />
              <span>¡Comanda cobrada e impresa!</span>
            </div>
          )}

          {/* Botones de Acción (Enregistrer / Encaisser adaptados a Obsidian & Gold) */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => ejecutarCobro("tarjeta")}
              disabled={ticketItems.length === 0}
              className="w-full h-13 flex items-center justify-center gap-2 bg-[#1F2833] active:bg-[#2C3540] disabled:opacity-30 disabled:cursor-not-allowed border border-[#2C3540] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <CreditCard size={17} className="text-[#C5A059]" />
              <span>Cobrar con Tarjeta</span>
            </button>

            <button
              onClick={() => ejecutarCobro("efectivo")}
              disabled={ticketItems.length === 0}
              className="w-full h-15 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] active:from-[#9E7D3B] active:to-[#C5A059] disabled:opacity-30 disabled:cursor-not-allowed text-[#0B0C10] font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_6px_22px_rgba(197,160,89,0.3)] transition active:scale-95 cursor-pointer"
            >
              <Banknote size={20} />
              <span>Cobrar en Efectivo (Encaisser)</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
