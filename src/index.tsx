
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useRegisterSW } from 'virtual:pwa-register/react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

function PwaWrapper() {
  useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Registration Error:', error);
    },
  });

  return <App />;
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PwaWrapper />
  </React.StrictMode>
);
