import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// AGREGADO: Importamos el registro del Service Worker (PWA)
// Si ves una línea roja aquí en el editor, IGNÓRALA, funcionará al compilar.
import { registerSW } from 'virtual:pwa-register';

// AGREGADO: Configuración para que la app se actualice y funcione offline
const updateSW = registerSW({
  onNeedRefresh() {
    // Si hay una nueva versión, preguntamos al usuario si quiere actualizar
    if (confirm('Nueva versión de Manufy disponible. ¿Recargar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Manufy está lista para trabajar sin conexión');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);