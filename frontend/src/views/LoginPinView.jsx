import React, { useState } from 'react';
import { Delete, KeyRound, ShieldAlert, Sparkles, User, ShieldCheck } from 'lucide-react';

export default function LoginPinView({ onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Simulación de usuarios registrados en el sistema (según skills/sqlite-pos-rules.md)
  const USUARIOS_DEMO = [
    { id: 1, nombre: "Emilio Tapia", pin: "1234", rol: "cajero", cargo: "Cajero de Barra" },
    { id: 2, nombre: "Admin Sistema", pin: "9999", rol: "admin", cargo: "Administrador General" },
  ];

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nuevoPin = pin + digit;
      setPin(nuevoPin);
      setErrorMsg('');

      if (nuevoPin.length === 4) {
        verificarPin(nuevoPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verificarPin = (pinIngresado) => {
    const usuarioEncontrado = USUARIOS_DEMO.find(u => u.pin === pinIngresado);
    if (usuarioEncontrado) {
      onLoginSuccess(usuarioEncontrado);
    } else {
      setErrorMsg('PIN Incorrecto. Intente nuevamente.');
      setTimeout(() => {
        setPin('');
      }, 500);
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
      {/* Fondo decorativo sutil con gradiente */}
      <div className="absolute top-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Tarjeta Central de Acceso */}
      <div className="w-full max-w-sm bg-[#14171E] border border-[#1F2833] rounded-3xl p-8 shadow-2xl flex flex-col items-center relative z-10 space-y-6">
        
        {/* Logo / Encabezado */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#9E7D3B] flex items-center justify-center text-[#0B0C10] shadow-[0_0_20px_rgba(197,160,89,0.35)]">
            <KeyRound size={28} strokeWidth={2.5} />
          </div>
          <h1 className="font-['Syne'] font-extrabold text-2xl text-white tracking-wider pt-1">
            ASETI <span className="text-[#C5A059]">BAR</span>
          </h1>
          <p className="text-xs font-['JetBrains_Mono'] tracking-widest text-[#8E9297] uppercase">
            Acceso por Código PIN
          </p>
        </div>

        {/* Indicadores de PIN (4 dígitos) */}
        <div className="flex items-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const activo = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  activo
                    ? "bg-[#C5A059] scale-125 shadow-[0_0_12px_rgba(197,160,89,0.8)]"
                    : "bg-[#1F2833] border border-[#2C3540]"
                }`}
              />
            );
          })}
        </div>

        {/* Mensaje de Error */}
        {errorMsg ? (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/40 animate-shake">
            <ShieldAlert size={14} />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="h-7 text-[11px] text-[#8E9297] flex items-center gap-1">
            <span>Ingrese su clave de 4 dígitos</span>
          </div>
        )}

        {/* Teclado Numérico Táctil (Swiss Grid Ergonomic) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {TECLAS.map((tecla) => {
            if (tecla === 'DEL') {
              return (
                <button
                  key={tecla}
                  onClick={handleBackspace}
                  className="h-16 rounded-2xl bg-[#1F2833] active:bg-[#2C3540] border border-[#2C3540] text-red-400 font-bold flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
                  aria-label="Borrar dígito"
                >
                  <Delete size={22} />
                </button>
              );
            }

            if (tecla === 'C') {
              return (
                <button
                  key={tecla}
                  onClick={handleClear}
                  className="h-16 rounded-2xl bg-[#1F2833] active:bg-[#2C3540] border border-[#2C3540] text-[#8E9297] font-['JetBrains_Mono'] font-bold text-base flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
                  aria-label="Limpiar todo"
                >
                  C
                </button>
              );
            }

            return (
              <button
                key={tecla}
                onClick={() => handleDigit(tecla)}
                className="h-16 rounded-2xl bg-[#14171E] active:bg-[#C5A059] active:text-[#0B0C10] border border-[#1F2833] active:border-[#C5A059] text-white font-['JetBrains_Mono'] font-extrabold text-2xl flex items-center justify-center transition-all duration-75 active:scale-95 cursor-pointer shadow-md"
              >
                {tecla}
              </button>
            );
          })}
        </div>

        {/* Pistas Rápidas para Desarrollo / Demo */}
        <div className="w-full pt-2 border-t border-[#1F2833]/60 flex items-center justify-between text-[10px] font-mono text-[#8E9297]">
          <span className="flex items-center gap-1">
            <User size={12} className="text-[#C5A059]" /> Cajero: 1234
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-amber-400" /> Admin: 9999
          </span>
        </div>

      </div>
    </div>
  );
}
