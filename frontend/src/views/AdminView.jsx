import React, { useState } from 'react';
import { ArrowLeft, Plus, DollarSign, Calendar, Clock, BarChart3 } from 'lucide-react';

export default function AdminView({ onBackToCaja }) {
  const [tab, setTab] = useState('corte'); // 'corte' | 'catalogo'

  return (
    <div className="flex h-screen w-screen bg-[#0B0B0C] text-[#EDEDED] font-sans overflow-hidden">
      {/* Sidebar de Navegación Admin */}
      <div className="w-64 bg-[#121214] border-r border-[#27272A] flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
            <span className="font-bold text-lg tracking-wider text-white">ADMIN POS</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setTab('corte')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition cursor-pointer ${
                tab === 'corte'
                  ? 'bg-[#D4AF37] text-[#0B0B0C] font-bold'
                  : 'text-[#A1A1AA] hover:bg-[#1A1A1E] hover:text-white'
              }`}
            >
              <BarChart3 size={18} />
              <span>Corte de Turno</span>
            </button>
            <button
              onClick={() => setTab('catalogo')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition cursor-pointer ${
                tab === 'catalogo'
                  ? 'bg-[#D4AF37] text-[#0B0B0C] font-bold'
                  : 'text-[#A1A1AA] hover:bg-[#1A1A1E] hover:text-white'
              }`}
            >
              <Plus size={18} />
              <span>ABM Catálogo</span>
            </button>
          </nav>
        </div>

        <button
          onClick={onBackToCaja}
          className="flex items-center justify-center gap-2 p-3 bg-[#1A1A1E] hover:bg-[#27272A] border border-[#27272A] rounded-xl text-white font-medium transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={18} className="text-[#D4AF37]" />
          <span>Volver a Caja</span>
        </button>
      </div>

      {/* Contenido Principal Admin */}
      <div className="flex-1 p-8 overflow-y-auto">
        {tab === 'corte' && (
          <div className="max-w-4xl space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">Reporte de Corte de Caja</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#121214] border border-[#27272A] rounded-2xl">
                <span className="text-xs uppercase font-mono text-[#A1A1AA]">Gran Total</span>
                <div className="text-3xl font-bold font-mono text-[#D4AF37] mt-2">$0.00</div>
              </div>
              <div className="p-6 bg-[#121214] border border-[#27272A] rounded-2xl">
                <span className="text-xs uppercase font-mono text-[#A1A1AA]">Total Tickets</span>
                <div className="text-3xl font-bold font-mono text-white mt-2">0</div>
              </div>
              <div className="p-6 bg-[#121214] border border-[#27272A] rounded-2xl">
                <span className="text-xs uppercase font-mono text-[#A1A1AA]">Efectivo Esperado</span>
                <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">$0.00</div>
              </div>
            </div>

            <div className="p-6 bg-[#121214] border border-[#27272A] rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-white">Consultar por Rango</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#A1A1AA] uppercase font-mono block mb-1">Fecha / Hora Inicio</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A1AA] uppercase font-mono block mb-1">Fecha / Hora Fin</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <button className="px-6 py-3 bg-[#D4AF37] hover:bg-[#CA8A04] text-[#0B0B0C] font-bold rounded-xl transition cursor-pointer active:scale-95">
                Generar Corte
              </button>
            </div>
          </div>
        )}

        {tab === 'catalogo' && (
          <div className="max-w-4xl space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">ABM de Botones / Catálogo</h2>
            <div className="p-6 bg-[#121214] border border-[#27272A] rounded-2xl space-y-4">
              <p className="text-[#A1A1AA] text-sm">
                Configuración rápida de productos para el catálogo táctil (nombre, precio, categoría). Sin inventarios.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

