import React, { useState } from 'react';
import CajaView from './views/CajaView';
import AdminView from './views/AdminView';

function App() {
  const [currentView, setCurrentView] = useState('caja'); // 'caja' | 'admin'

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0B0B0C]">
      {currentView === 'caja' ? (
        <CajaView onSwitchToAdmin={() => setCurrentView('admin')} />
      ) : (
        <AdminView onBackToCaja={() => setCurrentView('caja')} />
      )}
    </div>
  );
}

export default App;
