import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api';

// Componente para um player de áudio individual
// Componente para um player de áudio individual
const AudioPlayer = ({ src, filename }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    console.log(`[AudioPlayer] useEffect para src: ${src}`);
    if (audio) {
      console.log('[AudioPlayer] Audio element found:', audio);

      const handlePlay = () => {
        setIsPlaying(true);
        console.log('[AudioPlayer] Event: play');
      };
      const handlePause = () => {
        setIsPlaying(false);
        console.log('[AudioPlayer] Event: pause');
      };
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
        // console.log(`[AudioPlayer] Event: timeupdate - Current time: ${audio.currentTime}`); // Pode ser muito verboso
      };
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        console.log(`[AudioPlayer] Event: loadedmetadata - Duration: ${audio.duration}`);
      };
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0; // Resetar para o início
        console.log('[AudioPlayer] Event: ended');
      };
      const handleError = (e) => {
        console.error('[AudioPlayer] Erro de áudio:', e.type, 'Código:', audio.error ? audio.error.code : 'Desconhecido', e);
        setIsPlaying(false);
      };

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Limpeza de event listeners ao desmontar ou trocar src
      return () => {
        console.log(`[AudioPlayer] Cleanup for src: ${src}`);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);

        if (audio) {
          audio.pause(); // Pausar o áudio
          console.log('[AudioPlayer] Audio paused during cleanup.');
          // APENAS REVOGAR O BLOB URL, NÃO REMOVER O SRC DO ELEMENTO
          if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
            console.log(`[AudioPlayer] Blob URL revoked: ${audio.src}`);
          }
        }
      };
    } else {
        console.log('[AudioPlayer] audioRef.current not available yet or is null.');
    }
  }, [src]); // Depende do src para re-configurar listeners se o áudio mudar

  const togglePlayPause = () => {
    const audio = audioRef.current;
    console.log(`[AudioPlayer] togglePlayPause clicked. isPlaying: ${isPlaying}`);
    if (audio) {
      console.log('[AudioPlayer] Audio element in togglePlayPause:', audio, 'Current src:', audio.src);
      if (isPlaying) {
        audio.pause();
      } else {
        // Se a duração ainda não foi carregada (ou é inválida, como Infinity ou 0), força o carregamento de metadados
        if (isNaN(duration) || !isFinite(duration) || duration === 0) {
            console.log('[AudioPlayer] Duration invalid or not finite, attempting audio.load()');
            audio.load();
        }

        audio.play().catch(e => {
            console.error('[AudioPlayer] Erro ao tentar tocar áudio (Promise):', e);
            if (e.name === "NotAllowedError") {
                console.warn("Navegador bloqueou autoplay. O usuário precisa interagir com a página antes de reproduzir.");
            } else if (e.name === "NotSupportedError") {
                console.error("Formato de áudio não suportado ou arquivo corrompido.");
            }
        });
      }
    } else {
        console.log('[AudioPlayer] Audio element not found when togglePlayPause clicked.');
    }
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = e.target.value;
      setCurrentTime(e.target.value);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time) || time < 0) {
      return "--:--"; // Exibe --:-- para duração inválida ou carregando
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Estilo para o background do input range que mostra o progresso
  const rangeBackground = `linear-gradient(to right, #3b82f6 ${((currentTime / duration) * 100) || 0}%, #e2e8f0 ${((currentTime / duration) * 100) || 0}%)`;

  return (
    <div style={{
        padding: '1rem',
        backgroundColor: '#f7f7f7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
    }}>
      <audio
        ref={audioRef}
        src={src}
        style={{ display: 'none' }}
        preload="metadata" // Carrega metadados para saber a duração antes de tocar
      />
      <button
          onClick={togglePlayPause}
          style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '1.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'background-color 0.2s'
          }}
          // CORREÇÃO: Habilita o botão mesmo com duração Infinity, permitindo o clique inicial.
          // Desabilita apenas se não houver SRC ou se a duração for NaN/0 e o áudio não estiver tocando.
          disabled={!src || ((isNaN(duration) || duration === 0) && !isPlaying)}
      >
          {isPlaying ? '❚❚' : '▶'}
      </button>

      <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%'
      }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatTime(currentTime)}</span>
          <input
              type="range"
              min="0"
              // CORREÇÃO: Garante que max seja sempre um número finito. Se Infinity ou NaN, será 0.
              max={isFinite(duration) ? duration : 0}
              value={currentTime}
              onChange={handleProgressChange}
              style={{
                  flexGrow: 1,
                  height: '5px',
                  background: rangeBackground,
                  borderRadius: '5px',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  appearance: 'none'
              }}
              // Desabilita o slider se a duração for inválida (Infinity, NaN, 0)
              disabled={!isFinite(duration) || duration === 0}
          />
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatTime(duration)}</span>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, wordBreak: 'break-all' }}>
        {filename}
      </p>
    </div>
  );
};


const CapsuleModal = ({ capsule, isOpen, onClose }) => {
  // Componente auxiliar para resumo HTML (copiado do Dashboard.jsx)
  const getHtmlSummary = (html, maxLength = 100) => {
    if (!html) return '';

    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'p', 'br', 'ul', 'ol', 'li'];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    let charCount = 0;
    let resultHtml = '';
    const openTags = [];

    const traverseAndAppend = (node) => {
      if (charCount >= maxLength) {
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        const remaining = maxLength - charCount;

        if (text.length > remaining) {
          resultHtml += text.substring(0, remaining);
          charCount = maxLength;
        } else {
          resultHtml += text;
          charCount += text.length;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        if (allowedTags.includes(tagName)) {
          if (tagName !== 'br') {
            resultHtml += `<${tagName}`;
            if (tagName === 'span') {
              const styleAttr = node.getAttribute('style');
              if (styleAttr) {
                resultHtml += ` style="${styleAttr}"`;
              }
            }
            resultHtml += `>`;
            openTags.push(tagName);
          } else {
            resultHtml += `<br>`;
          }

          for (let i = 0; i < node.childNodes.length; i++) {
            traverseAndAppend(node.childNodes[i]);
            if (charCount >= maxLength) break;
          }

          if (tagName !== 'br' && openTags[openTags.length - 1] === tagName) {
            resultHtml += `</${tagName}>`;
            openTags.pop();
          }
        } else {
          for (let i = 0; i < node.childNodes.length; i++) {
            traverseAndAppend(node.childNodes[i]);
            if (charCount >= maxLength) break;
          }
        }
      }
    };

    for (let i = 0; i < body.childNodes.length; i++) {
      traverseAndAppend(body.childNodes[i]);
      if (charCount >= maxLength) break;
    }

    if (charCount >= maxLength) {
      resultHtml += '...';
    }

    while (openTags.length > 0) {
      resultHtml += `</${openTags.pop()}>`;
    }

    return resultHtml;
  };

  const [mediaFiles, setMediaFiles] = useState([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [mediaBlobUrls, setMediaBlobUrls] = useState({});
  const [errorFetchingMedia, setErrorFetchingMedia] = useState('');
  const { logout } = useAuth()

  const fetchMediaBlob = useCallback(async (mediaId) => {
    try {
      const response = await api.get(`/api/media/${mediaId}`, { responseType: 'blob' });
      return URL.createObjectURL(response.data);
    } catch (err) {
      console.error(`Erro ao buscar blob para media ID ${mediaId}:`, err);
      if (err.response && err.response.status === 401) { logout(); }
      throw err;
    }
  }, [logout]);


  const fetchAndProcessMediaFiles = useCallback(async () => {
    setLoadingMedia(true);
    setErrorFetchingMedia('');
    let fetchedMedia = [];
    const newBlobUrls = {};

    try {
      const response = await api.get(`/api/capsules/${capsule.id}/media`);
      fetchedMedia = response.data.media_files || [];
      setMediaFiles(fetchedMedia);

      for (const media of fetchedMedia) {
        if (['image', 'audio', 'video'].includes(media.file_type)) {
          try {
            const blobUrl = await fetchMediaBlob(media.id);
            newBlobUrls[media.id] = blobUrl;
          } catch (mediaError) {
            console.error(`Erro ao carregar Blob para mídia ${media.id}:`, mediaError);
            newBlobUrls[media.id] = null;
            setErrorFetchingMedia(prev => prev + `Erro ao carregar '${media.original_filename}'. `);
          }
        } else {
            newBlobUrls[media.id] = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50%25\' x=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\' font-size=\'40\'%3E%E2%9A%A0%EF%B8%8F%3C/text%3E%3C/svg%3E';
        }
      }
      setMediaBlobUrls(newBlobUrls);

    } catch (err) {
      console.error('Erro ao buscar lista de mídia da cápsula ou processar:', err);
      let errorMessage = 'Erro desconhecido ao carregar mídias.';
      if (err.response) {
          errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
          if (err.response.status === 401) { logout(); }
      } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = 'Erro desconhecido: ' + err.message; }
      setErrorFetchingMedia(`Erro ao carregar as mídias da cápsula: ${errorMessage}`);
      setMediaFiles([]);
      setMediaBlobUrls({});
    } finally {
      setLoadingMedia(false);
    }
  }, [capsule, fetchMediaBlob, logout]);


  useEffect(() => {
    console.log(`[CapsuleModal] isOpen: ${isOpen}, capsule: ${capsule ? capsule.id : 'null'}`);
    if (isOpen && capsule) {
      fetchAndProcessMediaFiles();
    }
    return () => {
        console.log('[CapsuleModal] Cleanup for modal unmount/close or capsule change.');
        Object.values(mediaBlobUrls).forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
                console.log(`[CapsuleModal] Revoking Blob URL: ${url}`);
            }
        });
        setMediaFiles([]);
        setMediaBlobUrls({});
        setErrorFetchingMedia('');
        setLoadingMedia(false);
    };
  }, [isOpen, capsule, fetchAndProcessMediaFiles]);


  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'Z');
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'Z');
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !capsule) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          maxWidth: '48rem',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 0.5rem 0',
              wordBreak: 'break-word'
            }}>
              {capsule.title}
            </h2>
            {capsule.mood && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <span style={{ fontSize: '1.25rem' }}>{capsule.mood.emoji}</span>
                <span>{capsule.mood.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Sections */}
        <div style={{ padding: '1.5rem' }}>
          {/* Description */}
          {capsule.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                📝 Descrição
               </h3>
              <div
                style={{
                  color: '#4b5563',
                  lineHeight: '1.6',
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: capsule.description }}
              />
            </div>
          )}

          {/* Tags */}
          {capsule.tags && capsule.tags.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🏷️ Tags
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {capsule.tags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}


          {/* Media Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              📱 Mídia
            </h3>

            {loadingMedia ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Carregando mídia...</p>
            ) : errorFetchingMedia ? (
                <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorFetchingMedia}</p>
            ) : mediaFiles.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Nenhuma mídia anexada</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {mediaFiles.map((media) => (
                  <div key={media.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                  }}>
                    {mediaBlobUrls[media.id] ? (
                      <>
                        {media.file_type === 'image' && (
                          <img
                            src={mediaBlobUrls[media.id]}
                            alt={media.original_filename}
                            style={{
                              width: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        )}
                        {media.file_type === 'audio' && (
                          <AudioPlayer src={mediaBlobUrls[media.id]} filename={media.original_filename} />
                        )}
                        {media.file_type === 'video' && (
                            <video controls style={{ width: '100%', objectFit: 'contain' }}>
                                <source src={mediaBlobUrls[media.id]} type={media.mime_type} />
                                Seu navegador não suporta o elemento de vídeo.
                            </video>
                        )}
                      </>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626' }}>
                        Erro ao carregar {media.file_type === 'image' ? 'imagem' : (media.file_type === 'audio' ? 'áudio' : 'mídia')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            <div>
              <strong>Data da memória:</strong><br />
              {capsule.capsule_date ? formatDateOnly(capsule.capsule_date) : 'N/A'}
            </div>
            {capsule.location && (
              <div>
                <strong>Localização:</strong><br />
                {capsule.location}
              </div>
            )}
          </div>
        </div>

        {/* Novo botão Fechar no final */}
        <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb',
            marginTop: '1.5rem'
        }}>
            <button
                onClick={onClose}
                style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                Fechar
            </button>
        </div>

      </div>

    </div>
  );
};

export default CapsuleModal;