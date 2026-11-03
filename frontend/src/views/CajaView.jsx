import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Settings, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Sparkles,
  Search,
  X
} from 'lucide-react';

// Catálogo simulado representativo de un Bar/Restobar de alto flujo
const PRODUCTOS_MOCK = [
  // Cervezas
  { id: 1, nombre: "Corona Extra 355ml", precio: 48.0, categoria: "Cervezas", code: "CER-01" },
  { id: 2, nombre: "Victoria Clara 355ml", precio: 48.0, categoria: "Cervezas", code: "CER-02" },
  { id: 3, nombre: "Modelo Especial 355ml", precio: 52.0, categoria: "Cervezas", code: "CER-03" },
  { id: 4, nombre: "Negra Modelo 355ml", precio: 55.0, categoria: "Cervezas", code: "CER-04" },
  { id: 5, nombre: "Stella Artois 330ml", precio: 65.0, categoria: "Cervezas", code: "CER-05" },
  { id: 6, nombre: "Michelada Cubana Prep.", precio: 25.0, categoria: "Cervezas", code: "CER-06" },
  
  // Destilados y Copas
  { id: 7, nombre: "Tequila Dobel Diamante", precio: 140.0, categoria: "Destilados", code: "DST-01" },
  { id: 8, nombre: "Mezcal 400 Conejos Joven", precio: 130.0, categoria: "Destilados", code: "DST-02" },
  { id: 9, nombre: "Whisky JW Black Label", precio: 165.0, categoria: "Destilados", code: "DST-03" },
  { id: 10, nombre: "Gin Hendrick's Tonic", precio: 155.0, categoria: "Destilados", code: "DST-04" },
  { id: 11, nombre: "Vodka Grey Goose", precio: 150.0, categoria: "Destilados", code: "DST-05" },
  { id: 12, nombre: "Ron Zacapa 23 Años", precio: 180.0, categoria: "Destilados", code: "DST-06" },

  // Alimentos y Botanas
  { id: 13, nombre: "Nachos Supremos con Arrachera", precio: 135.0, categoria: "Cocina", code: "COC-01" },
  { id: 14, nombre: "Alitas Hot BBQ (8 pzas)", precio: 140.0, categoria: "Cocina", code: "COC-02" },
  { id: 15, nombre: "Papas a la Francesa Trufadas", precio: 85.0, categoria: "Cocina", code: "COC-03" },
  { id: 16, nombre: "Hamburguesa Smash Doble", precio: 160.0, categoria: "Cocina", code: "COC-04" },
  { id: 17, nombre: "Guacamole Rústico con Totopos", precio: 95.0, categoria: "Cocina", code: "COC-05" },
  
  // Sin Alcohol / Mezcladores
  { id: 18, nombre: "Agua Mineral Topo Chico", precio: 40.0, categoria: "Sin Alcohol", code: "BEB-01" },
  { id: 19, nombre: "Refresco Lata 355ml", precio: 35.0, categoria: "Sin Alcohol", code: "BEB-02" },
  { id: 20, nombre: "Red Bull Energy Drink", precio: 75.0, categoria: "Sin Alcohol", code: "BEB-03" },
  { id: 21, nombre: "Limonada Natural Fría", precio: 45.0, categoria: "Sin Alcohol", code: "BEB-04" },
];

export default function CajaView({ onSwitchToAdmin }) {
  const [productos] = useState(PRODUCTOS_MOCK);
  const [ticketItems, setTicketItems] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [cobroExitoso, setCobroExitoso] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];

  // Agregar producto al ticket
  const agregarAlTicket = (producto) => {
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

  // Ajustar cantidad de una partida
  const ajustarCantidad = (id, delta) => {
    setTicketItems(prev =>
      prev
        .map(item => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter(item => item.cantidad > 0)
    );
  };

  // Quitar partida individual
  const eliminarPartida = (id) => {
    setTicketItems(prev => prev.filter(item => item.id !== id));
  };

  // Limpiar todo el ticket
  const limpiarTicket = () => {
    setTicketItems([]);
  };

  // Simular cobro rápido
  const ejecutarCobro = (metodo) => {
    if (ticketItems.length === 0) return;
    setCobroExitoso(true);
    setTimeout(() => {
      setTicketItems([]);
      setCobroExitoso(false);
    }, 1200);
  };

  // Cálculos matemáticos puros
  const totalItems = ticketItems.reduce((acc, item) => acc + item.cantidad, 0);
  const subtotal = ticketItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  // Filtrado de retícula
  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = categoriaActiva === "Todos" || p.categoria === categoriaActiva;
    const coincideBusqueda = busqueda.trim() === "" || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      p.code.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <div className="flex h-screen w-screen bg-[#0B0C10] text-[#C5C6C7] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* ========================================================
          PANEL PRINCIPAL: RETÍCULA SUIZA (SWISS GRID) DE CATÁLOGO
          ======================================================== */}
      <section className="flex-1 flex flex-col min-w-0 border-r border-[#1F2833]">
        
        {/* Barra Superior de Estado y Navegación */}
        <header className="h-20 px-8 bg-[#14171E] border-b border-[#1F2833] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3.5 h-3.5 rounded-xs bg-[#C5A059] rotate-45 shadow-[0_0_12px_rgba(197,160,89,0.5)]"></div>
            <div className="flex items-baseline gap-3">
              <span className="font-['Syne'] font-extrabold text-2xl tracking-wider text-white">
                POS BAR
              </span>
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#C5A059] bg-[#0B0C10] px-2.5 py-1 rounded border border-[#C5A059]/40 tracking-widest uppercase">
                Obsidian Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Buscador táctil rápido */}
            <div className="relative w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9297]" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar botón..."
                className="w-full h-11 pl-10 pr-9 bg-[#0B0C10] border border-[#1F2833] focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-[#8E9297] outline-none transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E9297] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Acceso a Admin */}
            <button
              onClick={onSwitchToAdmin}
              className="flex items-center gap-2.5 h-11 px-4 bg-[#1F2833] active:bg-[#0B0C10] border border-[#2C3540] rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <Settings size={16} className="text-[#C5A059]" />
              <span>Admin</span>
            </button>
          </div>
        </header>

        {/* Retícula Suiza de Categorías (Pestañas de Toque Directo) */}
        <nav className="flex gap-2.5 px-8 py-3.5 bg-[#0B0C10] border-b border-[#1F2833] overflow-x-auto shrink-0">
          {categorias.map(cat => {
            const isActive = categoriaActiva === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`h-13 px-6 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-100 active:scale-95 cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? "bg-[#C5A059] text-[#0B0C10] border-[#C5A059] shadow-[0_4px_16px_rgba(197,160,89,0.25)] font-black"
                    : "bg-[#14171E] text-[#8E9297] border-[#1F2833] active:bg-[#1F2833] active:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>

        {/* Retícula Suiza de Productos (Objetivos Táctiles Grandes h-28+ w-full) */}
        <main className="flex-1 p-6 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[128px]">
          {productosFiltrados.map(prod => (
            <button
              key={prod.id}
              onClick={() => agregarAlTicket(prod)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#14171E] active:bg-[#1F2833] border border-[#1F2833] active:border-[#C5A059] active:scale-95 transition-all duration-75 text-left cursor-pointer shadow-lg overflow-hidden"
            >
              {/* Indicador de Código y Categoría */}
              <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#8E9297]">
                <span className="tracking-widest uppercase">{prod.categoria}</span>
                <span className="font-semibold text-[#8E9297]/60">{prod.code}</span>
              </div>

              {/* Nombre de Producto */}
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-base text-white leading-tight line-clamp-2 my-auto">
                {prod.nombre}
              </div>

              {/* Precio en Retícula Oro */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1F2833]">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E9297]">Precio</span>
                <span className="font-['JetBrains_Mono'] font-extrabold text-xl text-[#C5A059]">
                  ${prod.precio.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </main>
      </section>

      {/* ========================================================
          PANEL LATERAL: TICKET DE COBRO SUIZO (SWISS TICKET PANEL)
          ======================================================== */}
      <aside className="w-[450px] bg-[#14171E] flex flex-col h-full border-l border-[#1F2833] shrink-0">
        
        {/* Cabecera del Ticket */}
        <div className="h-20 px-6 border-b border-[#1F2833] flex items-center justify-between bg-[#1F2833]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0B0C10] border border-[#1F2833]">
              <ShoppingBag className="text-[#C5A059]" size={20} />
            </div>
            <div>
              <h2 className="font-['Syne'] font-extrabold text-lg text-white tracking-wide">Ticket en Curso</h2>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#8E9297]">
                {totalItems} {totalItems === 1 ? 'partida' : 'partidas'} agregadas
              </span>
            </div>
          </div>

          {ticketItems.length > 0 && (
            <button
              onClick={limpiarTicket}
              className="h-10 px-3 flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 bg-red-950/20 active:bg-red-900/40 border border-red-900/40 rounded-xl transition active:scale-95 cursor-pointer"
              title="Vaciar Ticket"
            >
              <Trash2 size={15} />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Partidas de Cobro */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ticketItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8E9297] space-y-3 opacity-60">
              <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#1F2833]">
                <ShoppingBag size={48} strokeWidth={1.2} className="text-[#C5A059]" />
              </div>
              <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-center px-6 leading-relaxed">
                Sin artículos seleccionados<br/>
                <span className="text-[#8E9297]/60 font-sans normal-case text-xs">
                  Pulsa un botón del catálogo para cobrar
                </span>
              </p>
            </div>
          ) : (
            ticketItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0C10] border border-[#1F2833] transition-all"
              >
                {/* Detalle Producto */}
                <div className="flex-1 mr-3 min-w-0">
                  <div className="font-bold text-sm text-white truncate">{item.nombre}</div>
                  <div className="text-[11px] font-['JetBrains_Mono'] text-[#8E9297] mt-0.5">
                    ${item.precio.toFixed(2)} c/u
                  </div>
                </div>

                {/* Modificador Táctil Rápido (Touch Targets Claros) */}
                <div className="flex items-center gap-1.5 bg-[#14171E] p-1 rounded-xl border border-[#1F2833]">
                  <button
                    onClick={() => ajustarCantidad(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1F2833] active:bg-[#C5A059] active:text-[#0B0C10] text-white active:scale-95 transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-7 text-center font-['JetBrains_Mono'] font-extrabold text-sm text-white">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => ajustarCantidad(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1F2833] active:bg-[#C5A059] active:text-[#0B0C10] text-white active:scale-95 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal Partida */}
                <div className="w-24 text-right font-['JetBrains_Mono'] font-extrabold text-base text-[#C5A059] pl-2">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================
            TOTAL Y BOTONES DE COBRO DE ALTO IMPACTO (H-16 W-FULL)
            ======================================================== */}
        <div className="p-6 bg-[#0B0C10] border-t-2 border-[#1F2833] space-y-4 shrink-0">
          
          {/* Mensaje de Cobro Exitoso */}
          {cobroExitoso && (
            <div className="flex items-center justify-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-400 font-bold text-sm animate-pulse">
              <CheckCircle2 size={18} />
              <span>¡Venta registrada con éxito!</span>
            </div>
          )}

          {/* Gran Total Suizo */}
          <div className="p-4 rounded-xl bg-[#14171E] border border-[#1F2833] flex justify-between items-baseline">
            <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#8E9297] font-bold">
              Total Cobro
            </span>
            <span className="font-['JetBrains_Mono'] text-4xl font-black text-[#C5A059] tracking-tight">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Botones Táctiles de Cobro Inmediato (Sin depender de hover states) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => ejecutarCobro("tarjeta")}
              disabled={ticketItems.length === 0}
              className="h-16 w-full flex items-center justify-center gap-2.5 bg-[#1F2833] active:bg-[#2C3540] disabled:opacity-25 disabled:cursor-not-allowed border-2 border-[#2C3540] rounded-2xl text-white font-extrabold text-sm tracking-wider uppercase transition active:scale-95 cursor-pointer shadow-md"
            >
              <CreditCard size={20} className="text-[#C5A059]" />
              <span>Tarjeta</span>
            </button>

            <button
              onClick={() => ejecutarCobro("efectivo")}
              disabled={ticketItems.length === 0}
              className="h-16 w-full flex items-center justify-center gap-2.5 bg-[#C5A059] active:bg-[#D4AF37] disabled:opacity-25 disabled:cursor-not-allowed text-[#0B0C10] font-black text-sm tracking-wider uppercase rounded-2xl shadow-[0_6px_20px_rgba(197,160,89,0.3)] transition active:scale-95 cursor-pointer"
            >
              <Banknote size={22} />
              <span>Efectivo</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
