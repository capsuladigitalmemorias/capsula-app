// frontend/src/components/ScrollToTop.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente utilitário que rola a janela para o topo
 * sempre que a rota do React Router muda.
 * Deve ser colocado dentro do BrowserRouter.
 */
function ScrollToTop() {
  // Obtém o objeto de localização do React Router, que contém informações sobre a URL atual.
  const { pathname } = useLocation();

  // Este efeito será executado toda vez que o 'pathname' (caminho da URL) mudar.
  useEffect(() => {
      console.log('ScrollToTop ativado para o caminho:', pathname);
    // Rola a janela para as coordenadas (0,0), ou seja, para o topo e para a esquerda.
    window.scrollTo(0, 0);

    // Opcional: Se você quiser uma rolagem suave, pode usar:
    // window.scrollTo({
    //   top: 0,
    //   behavior: 'smooth'
    // });

  }, [pathname]); // A dependência '[pathname]' garante que o efeito seja re-executado apenas quando a rota muda.

  // Este componente não renderiza nenhum elemento HTML visível.
  return null;
}

export default ScrollToTop;