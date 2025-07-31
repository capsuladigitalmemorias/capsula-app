import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Adicionado: includeAssets para garantir que o Workbox saiba sobre todos os seus assets estáticos.
      // Isso ajuda na geração do pré-cache e no comportamento de runtimeCaching.
      includeAssets: [
        'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg',
        // Inclui todos os arquivos de imagem comuns e outros assets da pasta 'static'
        'static/**/*.{png,jpg,jpeg,svg,gif,webp,ico}',
        // Inclui outros assets que podem estar na raiz ou em 'assets/' do build
        '**/*.{png,jpg,jpeg,svg,gif,webp,ico,css,js,json,webmanifest,woff2?|ttf|eot}'
      ],
      manifest: {
        name: "Capsula",
        short_name: "Capsula",
        description: "Live Intensely Preserve Forever",
        theme_color: "#14213d",
        background_color: "#ffffff",
        start_url: "/",
        display: "standalone",
        scope: "/",
        lang: "pt-BR",
        orientation: "portrait",
        icons: [
          {
            src: "/static/icons/capsula-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/static/icons/capsula-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        screenshots: [
          {
            src: "/static/screenshots/capsula-desktop.png",
            sizes: "1200x800",
            type: "image/png",
            label: "Tela principal",
            form_factor: "wide"
          },
          {
            src: "/static/screenshots/capsula-mobile.png",
            sizes: "414x896",
            type: "image/png",
            label: "Tela principal (mobile)",
            form_factor: "narrow"
          }
        ],
        shortcuts: [
          {
            name: "Criar Cápsula",
            short_name: "Nova Cápsula",
            description: "Crie uma nova cápsula de memória",
            url: "/capsules/new",
            icons: [
              {
                src: "/static/icons/capsula-icon-96.png",
                sizes: "96x96",
                type: "image/png"
              }
            ]
          },
          {
            name: "Ver Cápsulas",
            short_name: "Minhas Cápsulas",
            description: "Veja todas as suas cápsulas",
            url: "/capsules",
            icons: [
              {
                src: "/static/icons/capsula-icon-96.png",
                sizes: "96x96",
                type: "image/png"
              }
            ]
          }
        ],
        prefer_related_applications: false
      },
      workbox: {
        // 'navigateFallback' deve sempre apontar para o seu index.html em SPAs.
        // Ele é usado para rotas que o SW não reconhece (ex: /about quando não tem arquivo about.html).
        navigateFallback: 'index.html',

        // ESSA É A ALTERAÇÃO MAIS CRÍTICA: navigateFallbackDenylist
        // Impede que o Service Worker aplique o navigateFallback a URLs que correspondem a padrões de assets.
        // Se uma URL de asset (como uma imagem) não é tratada por uma regra de runtimeCaching,
        // o navigateFallback poderia erroneamente tentar servir o index.html para ela.
        navigateFallbackDenylist: [
          /^\/admin/, // Exclui URLs que começam com /admin
          /\/api\//,   // Exclui URLs que contêm /api/ (já estava aqui)
          // Adicionado: Padrões para todos os tipos de arquivos estáticos comuns
          // que NUNCA devem ser tratados como uma "navegação" que leva ao index.html.
          // Isso inclui imagens, CSS, JS, JSON, webmanifests, e fontes.
          // A flag 'i' no final da regex torna-a case-insensitive.
          // O `(?:\?.*)?` permite que a URL tenha query parameters (ex: .png?v=123)
          /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|json|webmanifest|woff2?|ttf|eot)(?:\?.*)?$/i,
        ],
        // globDirectory e globPatterns são para pré-cache. Eles definem quais arquivos do diretório de build ('dist')
        // serão adicionados ao cache do Service Worker na instalação.
        globDirectory: 'dist',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,wasm,json}', // Inclui arquivos comuns
          'index.html', // Garante que o index.html seja pré-cacheado
        ],
        runtimeCaching: [
            // Regra para qualquer arquivo PNG.
            // A ordem das regras é importante: as mais específicas devem vir primeiro.
            {
                urlPattern: /\.png$/, // Esta regex casa com qualquer URL que termine em .png
                handler: 'StaleWhileRevalidate', // Estratégia: serve do cache se disponível, e revalida na rede em segundo plano.
                options: {
                    cacheName: 'capsula-image-cache', // Nome do cache para imagens
                    expiration: {
                        maxEntries: 50, // Limite de 50 imagens no cache para evitar que ele cresça muito
                        maxAgeSeconds: 60 * 60 * 24 * 30, // Imagens cacheadas por 30 dias
                    },
                    cacheableResponse: {
                        statuses: [0, 200], // Permite cachear respostas opacas (de cross-origin) e respostas HTTP 200 OK
                    },
                },
            },
            // Regra para requisições da API de mídia.
            // 'NetworkOnly' garante que essas requisições sempre vão para a rede.
            {
                urlPattern: ({ url }) => url.pathname.startsWith('/api/media/'),
                handler: 'NetworkOnly',
                options: {
                    cacheName: 'api-media-cache', // Nome do cache (mesmo que NetworkOnly não cacheie, é bom ter)
                },
            },
            // Regra fallback para outros recursos da mesma origem.
            // Esta deve ser uma das últimas regras, para pegar o que não foi pego pelas regras específicas.
            {
                urlPattern: ({ url }) => url.origin === self.location.origin &&
                                         !url.pathname.startsWith('/api/media/'), // Exclui URLs da API de mídia (já tratada)
                // Não precisa excluir `.png` aqui, pois a regra `.png$` acima é mais específica e será processada primeiro.
                handler: 'NetworkFirst', // Estratégia: tenta a rede primeiro, se falhar, tenta o cache.
                options: {
                    cacheName: 'static-resources-fallback',
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
        ],
        cleanupOutdatedCaches: true, // Remove caches antigos automaticamente
        skipWaiting: true, // Força a ativação do novo SW imediatamente
        clientsClaim: true, // Permite que o novo SW controle os clientes assim que ativado
      }
    })
  ],
  build: {
    outDir: 'dist', // Diretório de saída do build
    assetsDir: 'assets', // Diretório para assets dentro de outDir
    rollupOptions: {
      output: {
        manualChunks: undefined, // Deixa o Rollup decidir a divisão de chunks
      },
    },
  },
  server: {
    host: '0.0.0.0', // Permite acesso externo ao servidor de desenvolvimento
    port: 5173, // Porta do servidor de desenvolvimento
  },
});