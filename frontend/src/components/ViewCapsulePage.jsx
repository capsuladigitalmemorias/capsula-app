// frontend/src/components/ViewCapsulePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // Certifique-se de que este caminho está correto
import { useAuth } from '../context/AuthContext'; // CORREÇÃO: useAuth agora vem do contexto

const ViewCapsulePage = () => {
  const { capsuleId } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para armazenar dados da mídia: { mediaId: { url: string | null, loading: boolean, error: string | null } }
  const [mediaData, setMediaData] = useState({});

  // Ref para rastrear os fetches de mídia que já foram iniciados nesta montagem/atualização.
  // Ajuda a evitar disparar o mesmo fetch várias vezes para o mesmo ID dentro de uma única execução do effect.
  const mediaFetches = useRef({});

  // NOVO LOG: No início do componente, para ver quando ele é renderizado/montado
  console.log(`[ViewCapsulePage - Inicio] Componente ViewCapsulePage montado/renderizado. capsuleId=${capsuleId}`);


  // Função para buscar os detalhes da cápsula
  const fetchCapsuleDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpa erros anteriores

      const apiUrl = `/api/capsules/${capsuleId}`;
      // NOVO LOG: Antes de enviar a requisição GET principal
      console.log(`[ViewCapsulePage - fetchCapsuleDetails] Enviando requisição GET para: ${apiUrl}`);

      // CORREÇÃO AQUI: A forma correta de usar a instância 'api' (Axios)
      const response = await api.get(apiUrl);
      const responseData = response.data; // Os dados estão na propriedade 'data' da resposta do Axios

      // NOVO LOG: Recebeu resposta da API principal
      console.log(`[ViewCapsulePage - fetchCapsuleDetails] Resposta recebida para ${apiUrl}:`, responseData);


      // Assumindo que o backend retorna { success: true, data: { capsule: {...} } }
      // Ou, se retornar { capsule: {...} } diretamente: if (responseData.capsule)
      if (responseData.success && responseData.data && responseData.data.capsule) {
        setCapsule(responseData.data.capsule);
        console.log('[ViewCapsulePage] Dados da CÁPSULA definidos no estado:', responseData.data.capsule);
      } else if (responseData.capsule) { // Caso o backend retorne o objeto da cápsula diretamente em response.data
         setCapsule(responseData.capsule);
         console.log('[ViewCapsulePage] Dados da CÁPSULA definidos no estado (diretamente):', responseData.capsule);
      }
      else {
        setError(responseData.message || 'Detalhes da cápsula não encontrados na resposta.');
        setCapsule(null);
      }

    } catch (error) {
      // NOVO LOG: Capturou um erro na requisição principal
      console.error(`[ViewCapsulePage - fetchCapsuleDetails] ERRO na requisição API ao buscar detalhes da cápsula ${capsuleId}:`, error);
      if (error.response) {
           if (error.response.status === 404) {
                setError('Cápsula não encontrada ou você não tem permissão para visualizá-la.');
           } else if (error.response.status === 401) {
                setError('Sessão expirada ou inválida. Faça login novamente.');
                logout(); // Chama a função de logout do hook de autenticação
           } else if (error.response.status === 403) {
                setError('Acesso negado a esta cápsula.');
           } else {
               setError(`Erro ao carregar detalhes da cápsula: ${error.message || `Erro HTTP ${error.response.status}`}`);
           }
      } else if (error.request) { // O request foi feito, mas não houve resposta (ex: rede offline)
           setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      else { // Algo aconteceu ao configurar a requisição que disparou um erro
          setError(`Erro ao carregar detalhes da cápsula: ${error.message || 'Erro desconhecido'}`);
      }

      setCapsule(null);
      // Limpa estado de mídia em caso de erro na cápsula principal
      setMediaData({});
      // Limpa rastreamento de fetches em andamento - Importante ao resetar a cápsula
      mediaFetches.current = {};

    } finally {
      // NOVO LOG: Finalizou a tentativa de buscar os detalhes da cápsula
      console.log(`[ViewCapsulePage - fetchCapsuleDetails] Finalizou execução da função.`);
      setLoading(false);
    }
  }, [capsuleId, logout]); // Dependência 'logout' para useCallback

  // useEffect principal para disparar o fetch dos detalhes da cápsula
  useEffect(() => {
    // NOVO LOG: Disparou o useEffect principal
    console.log('[ViewCapsulePage - useEffect Principal] useEffect (fetch details) disparado. capsuleId:', capsuleId);
    // Limpa estados anteriores ao carregar uma nova cápsula
    setCapsule(null);
    setError('');
    setMediaData({}); // Limpa estado de mídia antigo
    mediaFetches.current = {}; // Limpa rastreamento de fetches
    setLoading(true);

    if (capsuleId) {
      // NOVO LOG: Vai chamar fetchCapsuleDetails
      console.log(`[ViewCapsulePage - useEffect Principal] capsuleId (${capsuleId}) é válido, chamando fetchCapsuleDetails.`);
      fetchCapsuleDetails();
    } else {
        // NOVO LOG: capsuleId inválido
        console.log('[ViewCapsulePage - useEffect Principal] capsuleId é inválido, não chamando fetchCapsuleDetails.');
        setError('ID da cápsula inválido na URL.');
        setLoading(false);
    }

    // Cleanup para fetchDetails - Limpar loading na desmontagem
     return () => {
        // NOVO LOG: Função de limpeza do useEffect principal
        console.log('[ViewCapsulePage - useEffect Principal] Função de limpeza executada.');
        setLoading(false);
     };

  }, [capsuleId, fetchCapsuleDetails]);


  // useEffect para buscar os arquivos de mídia DEPOIS que os detalhes da cápsula forem carregados
  useEffect(() => {
      // NOVO LOG: Disparou o useEffect de mídia
      console.log('[ViewCapsulePage - useEffect Mídia] useEffect (fetch media) disparado.');

      if (capsule && Array.isArray(capsule.media_files) && capsule.media_files.length > 0) {
          // NOVO LOG: Cápsula e mídia válidas
          console.log('[ViewCapsulePage - useEffect Mídia] Cápsula carregada com mídia. Iniciando/Verificando fetch de mídia...');

          capsule.media_files.forEach(media => {
               const mediaId = media.id;

               // CORREÇÃO: Verifique se o mediaId é válido (não nulo, não indefinido) antes de prosseguir
               if (!mediaId || mediaId === 'null') { // Adicionado 'mediaId === "null"' para casos de string "null"
                   console.warn(`[ViewCapsulePage - useEffect Mídia] Mídia encontrada sem ID válido ou com ID nulo (${mediaId}). Pulando fetch para esta mídia.`, media);
                   setMediaData(prev => ({
                       ...prev,
                       [media.id || media.original_filename || Date.now()]: { url: null, loading: false, error: 'ID da mídia ausente ou inválido.' } // Usar um ID de fallback para o estado
                   }));
                   return; // Pula esta iteração para mídias sem ID válido
               }

               // Verifica se o fetch para esta mídia já foi iniciado OU se já temos a URL de blob (para evitar re-fetch desnecessário)
               // Isso é importante porque setMediaData dispara re-renderizações e, consequentemente, re-execuções desse useEffect
               const currentMediaState = mediaData[mediaId];
               if (mediaFetches.current[mediaId] || (currentMediaState && currentMediaState.url)) {
                   console.log(`[ViewCapsulePage - useEffect Mídia] Fetch para mídia ${mediaId} já iniciado ou URL já disponível. Pulando.`);
                   return;
               }

               console.log(`[ViewCapsulePage - useEffect Mídia] Iniciando fetch para mídia ${mediaId}.`);
               mediaFetches.current[mediaId] = true; // Marca como fetch iniciado

               setMediaData(prev => ({
                   ...prev,
                   [mediaId]: { url: null, loading: true, error: null }
               }));

               const fetchAndProcessMedia = async () => {
                   const mediaUrl = `/api/media/${mediaId}`;
                   // NOVO LOG: Antes de buscar mídia individual
                   console.log(`[ViewCapsulePage - fetchAndProcessMedia] Enviando requisição GET para: ${mediaUrl}`);
                   try {
                       // CORREÇÃO AQUI: Usar mediaUrl e responseType: 'blob' para Axios
                       const response = await api.get(mediaUrl, { responseType: 'blob' });
                       const blob = response.data; // Axios coloca o Blob em response.data quando responseType é 'blob'
                       const blobUrl = URL.createObjectURL(blob);

                       console.log(`[ViewCapsulePage - fetchAndProcessMedia] Mídia ${mediaId} buscada com sucesso. Blob URL criada:`, blobUrl);

                       setMediaData(prev => ({
                           ...prev,
                           [mediaId]: { url: blobUrl, loading: false, error: null }
                       }));

                   } catch (error) {
                       // NOVO LOG: Erro ao buscar mídia individual
                       console.error(`[ViewCapsulePage - fetchAndProcessMedia] ERRO ao buscar mídia ${mediaId}:`, error);
                       setMediaData(prev => {
                             const oldItem = prev[mediaId];
                             if (oldItem && oldItem.url) {
                                 URL.revokeObjectURL(oldItem.url);
                                 console.log(`[ViewCapsulePage - fetchAndProcessMedia] Revogada Blob URL antiga para mídia ${mediaId} no setter de erro.`);
                             }
                           return {
                               ...prev,
                               [mediaId]: {
                                 url: null,
                                 loading: false,
                                 error: `Não foi possível carregar a mídia: ${error.message || 'Erro desconhecido'}`
                               }
                           };
                       });

                   } finally {
                        console.log(`[ViewCapsulePage - fetchAndProcessMedia] Fetch para mídia ${mediaId} finalizado.`);
                   }
               };

               fetchAndProcessMedia();
          });

      } else {
          // NOVO LOG: Cápsula sem mídia
          console.log('[ViewCapsulePage - useEffect Mídia] Cápsula sem arquivos de mídia ou ainda não carregada. Limpando estados de mídia.');
           Object.values(mediaData).forEach(item => {
               if (item.url) {
                   URL.revokeObjectURL(item.url);
               }
           });
           setMediaData({});
           mediaFetches.current = {};
      }

      // Função de limpeza para revogar as Blob URLs quando o componente desmonta ou capsule muda
      return () => {
            console.log('[ViewCapsulePage - useEffect Mídia] Executando limpeza final na desmontagem do efeito...');
            // Cria uma cópia dos URLs no momento da limpeza para evitar problemas de closure stale
            const urlsToRevoke = Object.values(mediaData).map(item => item.url).filter(Boolean);
            urlsToRevoke.forEach(url => {
               console.log('[ViewCapsulePage - useEffect Mídia] Revogando URL na limpeza:', url);
               URL.revokeObjectURL(url);
            });

            // Limpando a ref também ao desmontar o efeito
            mediaFetches.current = {};
            // Limpa o estado de mediaData ao desmontar, para garantir que não haja vazamentos
            setMediaData({});
       };

  }, [capsule, mediaData]); // CORREÇÃO: 'mediaData' adicionado às dependências do useEffect para que a função de limpeza tenha acesso aos URLs mais recentes.
                             // Cuidado com isso: adicionar mediaData aqui pode levar a loops infinitos se setMediaData for chamado incondicionalmente.
                             // A lógica de `if (mediaFetches.current[mediaId] || (currentMediaState && currentMediaState.url))` acima é CRÍTICA por causa disso.


  // --- Funções Auxiliares para Exibir Dados ---
  const formatDate = (dateString) => {
      if (!dateString) return 'Data não informada';
      try {
          return new Date(dateString).toLocaleDateString('pt-BR');
      } catch (e) {
          console.error('Erro ao formatar data:', dateString, e);
          return 'Data inválida';
      }
  };

  const formatDateTime = (dateString) => {
       if (!dateString) return 'Data/Hora não informado';
       try {
           const date = new Date(dateString);
           return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
       } catch (e) {
           console.error('Erro ao formatar data/hora:', dateString, e);
           return 'Data/Hora inválido';
       }
   };

  // --- Renderização Condicional ---
  // Os blocos de renderização de loading, error e !capsule foram mantidos,
  // mas o 'Header' foi simplificado para evitar duplicação.
  const renderNavBar = () => (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="nav-brand"><h1>Capsula</h1></div>
        <div className="nav-menu">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/criar-capsula" className="nav-link">Nova Cápsula</Link>
          <Link to="/capsulas" className="nav-link">Minhas Cápsulas</Link>
          <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>
    </nav>
  );

  const renderContentBox = (content) => (
    <div className="container" style={{ textAlign: 'center', paddingTop: '30px', paddingBottom: '30px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <h2>Detalhes da Cápsula</h2>
        {content}
      </div>
    </div>
  );


  if (loading) {
    console.log('[ViewCapsulePage] Renderizando estado de loading geral.');
    return (
      <div className="app-container">
         {renderNavBar()}
         {renderContentBox(
            <p>Carregando detalhes da cápsula com ID: **{capsuleId}**...</p>
         )}
      </div>
    );
  }

  if (error) {
    console.log('[ViewCapsulePage] Renderizando estado de erro geral:', error);
    return (
      <div className="app-container">
         {renderNavBar()}
         {renderContentBox(
            <>
                <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '0.5rem' }}>
                   <p>{error}</p>
                </div>
                <button onClick={() => navigate('/capsulas')} style={{ marginTop: '20px', padding: '0.75rem 1.5rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                   Voltar para Minhas Cápsulas
                </button>
            </>
         )}
      </div>
    );
  }

  if (!capsule) {
       console.log('[ViewCapsulePage] Renderizando estado de cápsula nula (após loading/error).');
       return (
          <div className="app-container">
             {renderNavBar()}
             {renderContentBox(
                <>
                   <p>Nenhum dado de cápsula disponível para exibição.</p>
                   <button onClick={() => navigate('/capsulas')} style={{ marginTop: '20px', padding: '0.75rem 1.5rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                      Voltar para Minhas Cápsulas
                   </button>
                </>
             )}
          </div>
       );
  }


  console.log('[ViewCapsulePage] Renderizando detalhes da cápsula.');
  console.log('[ViewCapsulePage] Dados atuais da cápsula no momento da renderização:', capsule);
  console.log('[ViewCapsulePage] Estado atual de mediaData no momento da renderização:', mediaData);

  return (
    <div className="app-container">
         {renderNavBar()}

      <div className="container" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
         <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h2 style={{ color: '#2d3748', margin: 0, fontSize: '2rem' }}>{capsule.title}</h2>
                {capsule.mood && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem' }}>{capsule.mood.emoji}</span>
                      <span style={{ fontSize: '1rem', color: '#6b7280' }}>{capsule.mood.name}</span>
                    </div>
                  )}
            </div>

            {/* Descrição */}
            {capsule.description && (
              <div style={{ marginBottom: '2rem', lineHeight: '1.6', color: '#4b5563' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Descrição</h3>
                <p style={{ wordWrap: 'break-word', wordBreak: 'break-all' }}>{capsule.description}</p>
              </div>
            )}

            {/* Tags */}
            {capsule.tags && Array.isArray(capsule.tags) && capsule.tags.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Tags</h3>
                <div>
                  {capsule.tags.map((tag) => (
                    <span
                      key={tag.id}
                      style={{
                        display: 'inline-block',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        marginRight: '0.5rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      # {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mídia */}
            {capsule.media_files && Array.isArray(capsule.media_files) && capsule.media_files.length > 0 && (
                 <div style={{ marginBottom: '2rem' }}>
                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Mídia</h3>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                         {capsule.media_files.map((media) => {
                             const mediaId = media.id;
                             const mediaItemData = mediaData[mediaId] || { url: null, loading: false, error: null };
                             const { url: blobUrl, loading: isLoading, error: mediaError } = mediaItemData;

                             console.log(`[ViewCapsulePage] Mídia ${mediaId}: blobUrl=${blobUrl}, isLoading=${isLoading}, mediaError=${mediaError}`);

                             // CORREÇÃO: Adicionada verificação para ID da mídia ser válido
                             if (!mediaId || mediaId === 'null') {
                                 console.warn(`[ViewCapsulePage] Pulando renderização de mídia com ID inválido: ${mediaId}`, media);
                                 return (
                                     <div key={`invalid-${media.original_filename || Date.now()}`} style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', overflow: 'hidden', maxWidth: '100%', minWidth: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', color: 'orange' }}>
                                         <p>Mídia inválida ou ID ausente: {media.original_filename || 'Desconhecido'}</p>
                                     </div>
                                 );
                             }

                             return (
                             <div key={mediaId} style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', overflow: 'hidden', maxWidth: '100%', minWidth: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                                 {isLoading && <p style={{ padding: '20px' }}>Carregando mídia...</p>}
                                 {mediaError && <p style={{ padding: '20px', color: 'red' }}>{mediaError}</p>}

                                 {!isLoading && blobUrl && (
                                     <>
                                         {media.file_type === 'image' && (
                                             <img
                                                 src={blobUrl}
                                                 alt={media.original_filename}
                                                 style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                                                 onError={(e) => console.error(`[ViewCapsulePage] Erro ao renderizar imagem da Blob URL para mídia ${mediaId}:`, e)}
                                             />
                                         )}
                                         {media.file_type === 'audio' && (
                                             <audio controls style={{ width: '100%', display: 'block' }}>
                                                 <source src={blobUrl} type={media.mime_type} />
                                                 Seu navegador não suporta o elemento de áudio.
                                             </audio>
                                         )}
                                          {media.file_type === 'video' && (
                                             <video controls style={{ width: '100%', display: 'block' }}>
                                                 <source src={blobUrl} type={media.mime_type} />
                                                 Seu navegador não suporta o elemento de vídeo.
                                             </video>
                                         )}
                                     </>
                                 )}
                                  {!isLoading && !blobUrl && !mediaError && (media.file_type === 'image' || media.file_type === 'audio' || media.file_type === 'video') && (
                                       <p style={{ padding: '10px', textAlign: 'center' }}>Mídia não disponível.</p>
                                 )}
                                  {media.file_type === 'unknown' && (
                                      <p style={{ padding: '10px', textAlign: 'center' }}>Arquivo: {media.original_filename} (Tipo desconhecido)</p>
                                  )}
                             </div>
                             );
                         })}
                     </div>
                 </div>
             )}

             <button onClick={() => navigate('/capsulas')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                Voltar para Minhas Cápsulas
             </button>

          </div>
      </div>
    </div>
  );
};

export default ViewCapsulePage;