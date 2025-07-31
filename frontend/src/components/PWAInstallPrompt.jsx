// src/components/PWAInstallPrompt.jsx
import React, { useEffect, useState } from 'react';

function isIosSafari() {
  // Detecta iOS e Safari (web-app-capable)
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    /safari/i.test(navigator.userAgent) &&
    !/crios|fxios|opera|opr\//i.test(navigator.userAgent)
  );
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  // Detectar Android/Desktop para receber o evento do Chrome
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Exibir instrução para iOS
  const isIOS = isIosSafari();

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // opcional: lidar com o resultado aqui
      setDeferredPrompt(null);
    }
  };

  if (isIOS) {
    // iOS: mostrar um botão discreto
    return null;
  }

  // Android/Desktop: botão de instalar PWA
  if (deferredPrompt) {
    return (
      <button
        style={{ position: "fixed", bottom: 24, right: 16, zIndex: 1000 }}
        onClick={handleInstallClick}
      >
        Instalar app
      </button>
    );
  }

  // Caso não haja nada para exibir
  return null;
};

export default PWAInstallPrompt;