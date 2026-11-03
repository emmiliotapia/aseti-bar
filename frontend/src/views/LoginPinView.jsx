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
    <div className="w-screen h-screen bg-[#0B0C10] text-[#C5C6C7] font-['Plus_Jakarta_Sans'] flex flex-col items-center justify-center p-6 select-none overflow-hidden relative">
      <div className="absolute top-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm bg-[#14171E] border border-[#1F2833] rounded-3xl p-7 shadow-2xl flex flex-col items-center relative z-10 space-y-4">
        
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#9E7D3B] flex items-center justify-center text-[#0B0C10] shadow-[0_0_20px_rgba(197,160,89,0.35)]">
            <KeyRound size={24} strokeWidth={2.5} />
          </div>
          <h1 className="font-['Syne'] font-extrabold text-2xl text-white tracking-wider pt-1">
            ASETI <span className="text-[#C5A059]">BAR</span>
          </h1>
          <p className="text-[11px] font-['JetBrains_Mono'] tracking-widest text-[#8E9297] uppercase">
            Acceso Personal Autorizado
          </p>
        </div>

        {/* Campo para Escribir el Usuario */}
        <div className="w-full space-y-1">
          <label className="text-[11px] font-mono uppercase text-[#8E9297] block">Usuario / Mesero</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9297]" />
            <input
              type="text"
              autoFocus
              value={usuarioInput}
              onChange={(e) => setUsuarioInput(e.target.value)}
              placeholder="Ej. emilio, carlos, admin"
              className="w-full h-11 pl-10 pr-3 bg-[#0B0C10] border border-[#1F2833] focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-[#8E9297] outline-none transition"
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
                  ? "bg-[#C5A059] scale-125 shadow-[0_0_10px_rgba(197,160,89,0.8)]"
                  : "bg-[#1F2833] border border-[#2C3540]"
              }`}
            />
          ))}
        </div>

        {errorMsg ? (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold bg-red-950/30 px-3 py-2 rounded-xl border border-red-900/40 w-full text-center">
            <ShieldAlert size={16} className="shrink-0" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        ) : (
          <div className="h-6 text-[10px] text-[#8E9297] text-center font-mono">
            * El cajero/mesero requiere pase de lista previo del Admin
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
                  className="h-14 rounded-xl bg-[#1F2833] active:bg-[#2C3540] border border-[#2C3540] text-red-400 font-bold flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
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
                  className="h-14 rounded-xl bg-[#1F2833] active:bg-[#2C3540] border border-[#2C3540] text-[#8E9297] font-mono font-bold text-sm flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
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
                className="h-14 rounded-xl bg-[#14171E] active:bg-[#C5A059] active:text-[#0B0C10] border border-[#1F2833] active:border-[#C5A059] text-white font-mono font-extrabold text-xl flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
              >
                {tecla}
              </button>
            );
          })}
        </div>

        <div className="w-full pt-2 border-t border-[#1F2833]/60 flex items-center justify-between text-[10px] font-mono text-[#8E9297]">
          <span>emilio : 1234</span>
          <span>admin : 9999</span>
          <span>carlos : 1111</span>
        </div>

      </div>
    </div>
  );
}
