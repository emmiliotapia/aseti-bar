import React, { useState } from 'react';
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
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminView({ usuario, onBackToCaja, onLogout }) {
  const [tabActiva, setTabActiva] = useState('corte'); // 'corte' | 'catalogo' | 'cajeros' | 'configuracion'
  
  // Datos simulados de cajeros
  const [cajeros, setCajeros] = useState([
    { id: 1, nombre: "Emilio Tapia", pin: "1234", rol: "cajero", cargo: "Cajero de Barra" },
    { id: 2, nombre: "Admin Sistema", pin: "9999", rol: "admin", cargo: "Administrador General" },
  ]);

  // Configuración de negocio y hardware (ESC/POS)
  const [config, setConfig] = useState({
    nombreNegocio: "ASETI BAR",
    ipImpresora: "192.168.1.200",
    puertoImpresora: "9100",
    pieTicket: "¡Gracias por su visita a ASETI BAR!",
    encabezado: "Calle Principal #123, Centro"
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const guardarConfig = (e) => {
    e.preventDefault();
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0C10] text-[#C5C6C7] font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      
      {/* Sidebar de Navegación del Administrador */}
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
              onClick={() => setTabActiva('corte')}
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
            <span>Volver a Caja</span>
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

      {/* Área Principal de Contenido del Administrador */}
      <main className="flex-1 overflow-y-auto p-10 bg-[#0B0C10]">
        
        {/* TAB 1: CORTES X Y Z */}
        {tabActiva === 'corte' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Módulos de Arqueo y Cierre</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                Auditoría instantánea sin inventarios
              </p>
            </div>

            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-3 gap-5">
              <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Efectivo</span>
                <div className="text-3xl font-extrabold font-['JetBrains_Mono'] text-white">$1,850.00</div>
              </div>
              <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#8E9297]">Ventas Tarjeta</span>
                <div className="text-3xl font-extrabold font-['JetBrains_Mono'] text-[#C5A059]">$2,430.00</div>
              </div>
              <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#8E9297]">Gran Total Turno</span>
                <div className="text-3xl font-extrabold font-['JetBrains_Mono'] text-emerald-400">$4,280.00</div>
              </div>
            </div>

            {/* Botones de Corte X y Corte Z */}
            <div className="p-6 bg-[#14171E] border border-[#1F2833] rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Operaciones de Caja</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="p-5 rounded-2xl bg-[#1F2833] active:bg-[#2C3540] border border-[#2C3540] text-left space-y-2 cursor-pointer transition active:scale-95"
                >
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>Imprimir Corte X</span>
                    <Printer size={20} className="text-[#C5A059]" />
                  </div>
                  <p className="text-xs text-[#8E9297] leading-relaxed">
                    Lectura parcial para arqueo en turno activo sin sellar ni cerrar la caja.
                  </p>
                </button>

                <button
                  className="p-5 rounded-2xl bg-amber-950/30 active:bg-amber-900/50 border border-amber-600/40 text-left space-y-2 cursor-pointer transition active:scale-95"
                >
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>Ejecutar Corte Z</span>
                    <ShieldCheck size={20} className="text-amber-400" />
                  </div>
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    Cierre de turno definitivo, conciliación de efectivo y sellado del turno en base de datos.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTIÓN DE CAJEROS */}
        {tabActiva === 'cajeros' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Gestión de Cajeros y Roles</h2>
                <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                  Control de PINs de acceso táctil
                </p>
              </div>
              <button className="h-11 px-4 bg-[#C5A059] text-[#0B0C10] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer active:scale-95">
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
                        <button className="text-xs text-[#C5A059] hover:underline font-bold">Editar PIN</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURACIÓN DE NEGOCIO Y HARDWARE */}
        {tabActiva === 'configuracion' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="font-['Syne'] font-extrabold text-2xl text-white">Configuración del Sistema</h2>
              <p className="text-xs font-mono text-[#8E9297] uppercase tracking-wider mt-1">
                Datos fiscales, pie de ticket e impresora ESC/POS
              </p>
            </div>

            {guardadoExitoso && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-400 font-bold text-xs">
                ¡Configuración guardada correctamente!
              </div>
            )}

            <form onSubmit={guardarConfig} className="space-y-5 bg-[#14171E] border border-[#1F2833] rounded-2xl p-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#C5A059]">Datos del Negocio</h3>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={config.nombreNegocio}
                    onChange={e => setConfig({ ...config, nombreNegocio: e.target.value })}
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
              </div>

              <div className="space-y-4 pt-4 border-t border-[#1F2833]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#C5A059]">Impresora Térmica ESC/POS</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">IP de Red</label>
                    <input
                      type="text"
                      value={config.ipImpresora}
                      onChange={e => setConfig({ ...config, ipImpresora: e.target.value })}
                      className="w-full bg-[#0B0C10] border border-[#1F2833] rounded-xl p-3 text-white text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#8E9297] block mb-1">Puerto (Default 9100)</label>
                    <input
                      type="text"
                      value={config.puertoImpresora}
                      onChange={e => setConfig({ ...config, puertoImpresora: e.target.value })}
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
    </div>
  );
}
