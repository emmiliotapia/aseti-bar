import React, { useState } from 'react';
import LoginPinView from './views/LoginPinView';
import CajaView from './views/CajaView';
import AdminView from './views/AdminView';

function App() {
  // 'login' | 'caja' | 'admin'
  const [vistaActual, setVistaActual] = useState('login');
  const [usuarioActivo, setUsuarioActivo] = useState(null);

  const handleLoginSuccess = (usuario) => {
    setUsuarioActivo(usuario);
    if (usuario.rol === 'admin') {
      // El admin puede ir directamente a caja o al panel
      setVistaActual('caja');
    } else {
      // El cajero siempre entra directo a la terminal de cobro
      setVistaActual('caja');
    }
  };

  const handleLogout = () => {
    setUsuarioActivo(null);
    setVistaActual('login');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0B0C10]">
      {vistaActual === 'login' && (
        <LoginPinView onLoginSuccess={handleLoginSuccess} />
      )}

      {vistaActual === 'caja' && (
        <CajaView
          usuario={usuarioActivo}
          onSwitchToAdmin={() => setVistaActual('admin')}
          onLogout={handleLogout}
        />
      )}

      {vistaActual === 'admin' && (
        <AdminView
          usuario={usuarioActivo}
          onBackToCaja={() => setVistaActual('caja')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
