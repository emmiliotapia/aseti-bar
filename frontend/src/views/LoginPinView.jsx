import React, { useState } from 'react';
import { Delete, KeyRound, ShieldAlert, User, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPinView({ onLoginSuccess }) {
  const [usuarioInput, setUsuarioInput] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleDigit = (digit) => {
    if (pin.length < 4 && !cargando) {
      const nuevoPin = pin + digit;
      setPin(nuevoPin);
      setErrorMsg('');

      if (nuevoPin.length === 4) {
        if (!usuarioInput.trim()) {
          setErrorMsg('Escriba primero el usuario');
          return;
        }
        ejecutarLogin(usuarioInput.trim(), nuevoPin);
      }
    }
  };

  const handleBackspace = () => {
    if (!cargando) {
      setPin(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    if (!cargando) {
      setPin('');
      setErrorMsg('');
    }
  };

  const ejecutarLogin = async (user, pinCode) => {
    setCargando(true);
    try {
      const usuarioLogueado = await api.login(user, pinCode);
      onLoginSuccess(usuarioLogueado);
    } catch (err) {
      setErrorMsg(err.message || 'Usuario o PIN incorrecto');
      setTimeout(() => {
        setPin('');
        setCargando(false);
      }, 700);
    }
  };

  const TECLAS = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', 'DEL'
  ];

  return (
    <div className="w-screen min-h-screen bg-[#070A0E] text-[#E5E7EB] font-['Plus_Jakarta_Sans'] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto relative">
      <div className="absolute top-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#E76F51]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm bg-[#0B0F15] border border-[#1A2330] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center relative z-10 space-y-4 my-auto">
        
        <div className="flex flex-col items-center space-y-2 text-center w-full">
          <div className="w-full h-16 rounded-2xl bg-[#070A0E] border border-[#1A2330] p-2 flex items-center justify-center shadow-inner group">
            <img 
              src="/logo-pos-blanco.png" 
              alt="MAREJADA – Café, Cocina, Bar" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
            />
          </div>
        </div>

        {/* Campo para Escribir el Usuario */}
        <div className="w-full space-y-1">
          <label className="text-[11px] font-mono uppercase text-[#9CA3AF] block">Usuario / Mesero</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              autoFocus
              value={usuarioInput}
              onChange={(e) => setUsuarioInput(e.target.value)}
              placeholder="Ej. emilio, carlos, admin"
              className="w-full h-11 pl-10 pr-3 bg-[#070A0E] border border-[#1A2330] focus:border-[#E76F51] rounded-xl text-xs text-white placeholder-[#6B7280] outline-none transition"
            />
          </div>
        </div>

        {/* Indicadores de PIN */}
        <div className="flex items-center gap-3 py-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                pin.length > index
                  ? "bg-[#E76F51] scale-125 shadow-[0_0_12px_rgba(231,111,81,0.8)]"
                  : "bg-[#1B3B4B] border border-[#264653]"
              }`}
            />
          ))}
        </div>

        {errorMsg ? (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-300 font-bold bg-red-950/40 px-3 py-2 rounded-xl border border-red-800/50 w-full text-center">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        ) : (
          <div className="h-6 text-[10px] text-[#93A8AC] text-center font-mono">
            * El personal requiere asistencia autorizada del Admin hoy
          </div>
        )}

        {/* Teclado Táctil */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {TECLAS.map((tecla) => {
            if (tecla === 'DEL') {
              return (
                <button
                  key={tecla}
                  onClick={handleBackspace}
                  disabled={cargando}
                  className="h-14 rounded-xl bg-[#1B3B4B] active:bg-[#264653] border border-[#264653] text-[#E76F51] font-bold flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
                  aria-label="Borrar"
                >
                  <Delete size={20} />
                </button>
              );
            }

            if (tecla === 'C') {
              return (
                <button
                  key={tecla}
                  onClick={handleClear}
                  disabled={cargando}
                  className="h-14 rounded-xl bg-[#1B3B4B] active:bg-[#264653] border border-[#264653] text-[#93A8AC] font-mono font-bold text-sm flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
                  aria-label="Limpiar"
                >
                  C
                </button>
              );
            }

            return (
              <button
                key={tecla}
                onClick={() => handleDigit(tecla)}
                disabled={cargando}
                className="h-14 rounded-xl bg-[#0C1821] active:bg-[#E76F51] active:text-[#0C1821] border border-[#264653] active:border-[#E76F51] text-[#F4EBD9] font-mono font-extrabold text-xl flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
              >
                {tecla}
              </button>
            );
          })}
        </div>

        <div className="w-full pt-2 border-t border-[#264653]/60 flex items-center justify-between text-[10px] font-mono text-[#93A8AC]">
          <span>emilio : 1234</span>
          <span>admin : 9999</span>
          <span>carlos : 1111</span>
        </div>

      </div>
    </div>
  );
}
