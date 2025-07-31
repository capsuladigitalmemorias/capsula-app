import { useState, useRef, useEffect } from 'react'

const AudioRecorder = ({ onAudioChange, initialAudio = null }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [maxTime] = useState(30) // 30 segundos máximo
  const [micPermission, setMicPermission] = useState('unknown') // 'unknown', 'granted', 'denied'

  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null) // Para armazenar a referência ao stream de mídia

  // Efeito para lidar com initialAudio corretamente
  useEffect(() => {
    if (!initialAudio) return;
    
    // Verifica se initialAudio é uma string (URL) ou um objeto Blob
    if (typeof initialAudio === 'string') {
      // Se for uma string (URL), apenas use-a diretamente
      setAudioUrl(initialAudio);
      // Não temos o objeto Blob, apenas a URL
      setAudioBlob(null);
      
      // Tenta estimar a duração do áudio quando o elemento for carregado
      if (audioRef.current) {
        const handleLoadedMetadata = () => {
          if (audioRef.current && audioRef.current.duration) {
            setRecordingTime(Math.round(audioRef.current.duration));
          }
        };
        
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          }
        };
      }
    } else if (initialAudio instanceof Blob) {
      // Se for um objeto Blob, crie a URL
      setAudioBlob(initialAudio);
      setAudioUrl(URL.createObjectURL(initialAudio));
    }
    
    // Limpeza ao desmontar
    return () => {
      if (audioUrl && audioBlob && typeof audioUrl !== 'string') {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [initialAudio]);

  // Verificar permissão do microfone ao montar o componente
  useEffect(() => {
    // Função para verificar permissão do microfone
    const checkMicrophonePermission = async () => {
      try {
        // Verificar se o navegador suporta a API de permissões
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          
          setMicPermission(permissionStatus.state);
          
          // Adicionar listener para mudanças de permissão
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state);
          };
        }
      } catch (error) {
        console.log('Não foi possível verificar permissão do microfone:', error);
        // Não definimos o estado aqui, deixamos como 'unknown'
      }
    };
    
    checkMicrophonePermission();
    
    // Limpeza ao desmontar
    return () => {
      // Parar qualquer stream ativo
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Limpar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Função para solicitar permissão do microfone de forma segura
  const requestMicrophoneAccess = async (e) => {
    // Importante: prevenir comportamento padrão para evitar redirecionamentos
    if (e) e.preventDefault();
    
    try {
      console.log('Solicitando acesso ao microfone...');
      
      // Solicitar acesso ao microfone com opções específicas
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Armazenar stream para limpeza posterior
      streamRef.current = stream;
      
      // Atualizar estado de permissão
      setMicPermission('granted');
      
      console.log('Acesso ao microfone concedido');
      
      // Iniciar gravação com o stream obtido
      startRecordingWithStream(stream);
      
      return stream;
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      
      // Atualizar estado de permissão se for um erro de permissão
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        alert('Permissão para o microfone foi negada. Por favor, permita o acesso ao microfone nas configurações do seu navegador.');
      } else {
        alert(`Erro ao acessar o microfone: ${error.message || 'Verifique se seu dispositivo tem um microfone funcionando.'}`);
      }
      
      return null;
    }
  };

  // Função para iniciar gravação com um stream já obtido
  const startRecordingWithStream = (stream) => {
    try {
      // *** MUDANÇA AQUI: Priorizando audio/wav para melhor detecção de duração ***
      let mimeType = 'audio/webm;codecs=opus'; // Padrão se nada mais for suportado
      
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) { // MP4 para compatibilidade com iOS, se necessário
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      console.log(`[AudioRecorder] Usando formato de gravação: ${mimeType}`);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Criar blob com o tipo correto
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // *** NOVO LOG AQUI: Verificar duração do Blob recém-criado ***
        const tempAudio = new Audio();
        tempAudio.src = URL.createObjectURL(blob);
        tempAudio.onloadedmetadata = () => {
            console.log(`[AudioRecorder] Duração do Blob criado (local): ${tempAudio.duration}`);
            URL.revokeObjectURL(tempAudio.src); // Limpar URL temporária
        };
        tempAudio.onerror = (e) => {
            console.error('[AudioRecorder] Erro ao carregar metadados do Blob temporário (local):', e);
            URL.revokeObjectURL(tempAudio.src);
        };
        
        // Limpar URL anterior se existir e não for uma string
        if (audioUrl && typeof audioUrl !== 'string') {
          URL.revokeObjectURL(audioUrl);
        }
        
        const newAudioUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(newAudioUrl);
        onAudioChange(blob); // Envia o Blob para o componente pai (CapsuleModal)
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer para controlar tempo máximo
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxTime - 1) {
            stopRecording();
            return maxTime;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao iniciar gravação. Por favor, tente novamente.');
    }
  };

  // Função principal para iniciar gravação
  const startRecording = async (e) => {
    // Importante: prevenir comportamento padrão
    if (e) e.preventDefault();
    
    // Se já estamos gravando, não fazer nada
    if (isRecording) return;
    
    console.log('Iniciando processo de gravação...');
    
    // Se já temos permissão concedida e um stream ativo
    if (micPermission === 'granted' && streamRef.current) {
      console.log('Permissão já concedida, iniciando gravação...');
      startRecordingWithStream(streamRef.current);
    } else {
      // Caso contrário, solicitar permissão
      console.log('Solicitando permissão do microfone...');
      const stream = await requestMicrophoneAccess(e);
      // A função requestMicrophoneAccess já inicia a gravação se bem-sucedida
    }
  };

  const stopRecording = (e) => {
    // Importante: prevenir comportamento padrão
    if (e) e.preventDefault();
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = (e) => {
    if (e) e.preventDefault();
    
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = (e) => {
    if (e) e.preventDefault();
    
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteAudio = (e) => {
    if (e) e.preventDefault();
    
    // Limpar URL anterior se existir e não for uma string
    if (audioUrl && typeof audioUrl !== 'string') {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    onAudioChange(null);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = (e) => {
    if (e) e.preventDefault();
    
    if (audioBlob) {
      // Se temos o objeto Blob
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // *** MUDANÇA AQUI: Usar extensão baseada no mimeType real ***
      let extension = 'bin'; // Fallback
      if (audioBlob.type) {
          const parts = audioBlob.type.split('/');
          if (parts.length > 1) {
              const subType = parts[1];
              if (subType === 'mpeg') extension = 'mp3';
              else if (subType === 'wav') extension = 'wav';
              else if (subType.startsWith('webm')) extension = 'webm';
              else if (subType === 'ogg') extension = 'ogg';
              else if (subType === 'mp4') extension = 'mp4';
              else extension = subType; // Caso raro, usa o subtipo
          }
      }
      a.download = `capsula-audio-${Date.now()}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (audioUrl && typeof audioUrl === 'string') {
      // Se só temos a URL (no caso de edição de áudio já existente do backend)
      const a = document.createElement('a');
      a.href = audioUrl;
      
      // Tenta extrair extensão da URL ou usa um padrão
      let extension = 'mp3'; // Padrão
      const urlPath = new URL(audioUrl).pathname;
      const urlParts = urlPath.split('.');
      if (urlParts.length > 1) {
          const detectedExt = urlParts[urlParts.length - 1];
          if (['mp3', 'wav', 'ogg', 'webm', 'mp4', 'aac'].includes(detectedExt)) {
              extension = detectedExt;
          }
      }
      a.download = `capsula-audio-${Date.now()}.${extension}`;
      
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
          Gravação de Áudio
        </h3>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Máximo: {maxTime}s
        </span>
      </div>

      {/* Controles de Gravação */}
      {!audioUrl && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.75rem',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={recordingTime >= maxTime}
              className="audio-recorder-button"
              style={{
                padding: '1rem',
                borderRadius: '50%',
                border: 'none',
                cursor: recordingTime >= maxTime ? 'not-allowed' : 'pointer',
                backgroundColor: isRecording ? '#ef4444' : '#2563eb',
                color: 'white',
                fontSize: '1.5rem',
                opacity: recordingTime >= maxTime ? 0.5 : 1,
                animation: isRecording ? 'pulse 1s infinite' : 'none'
              }}
            >
              {isRecording ? '⏹️' : '��'}
            </button>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: '0 0 0.25rem 0' }}>
              {isRecording ? 'Gravando...' : 'Clique para gravar'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
              {isRecording ? formatTime(recordingTime) : 'Até 30 segundos'}
            </p>
            
            {micPermission === 'denied' && (
              <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: '0.5rem 0 0 0' }}>
                ⚠️ Permissão de microfone negada. Verifique as configurações do seu navegador.
              </p>
            )}
          </div>

          {/* Barra de progresso durante gravação */}
          {isRecording && (
            <div style={{ width: '100%', maxWidth: '20rem' }}>
              <div style={{
                width: '100%',
                backgroundColor: '#e5e7eb',
                borderRadius: '9999px',
                height: '0.5rem'
              }}>
                <div 
                  style={{
                    backgroundColor: '#ef4444',
                    height: '0.5rem',
                    borderRadius: '9999px',
                    width: `${(recordingTime / maxTime) * 100}%`,
                    transition: 'width 1s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player de Áudio */}
      {audioUrl && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dbeafe',
          borderRadius: '0.75rem',
          border: '1px solid #93c5fd'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="audio-recorder-button"
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <div>
                <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>Áudio gravado</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  {formatTime(recordingTime)} segundos
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={downloadAudio}
                className="audio-recorder-button"
                style={{
                  padding: '0.5rem',
                  color: '#2563eb',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                title="Baixar áudio"
              >
                ⬇️
              </button>
              <button
                onClick={deleteAudio}
                className="audio-recorder-button"
                style={{
                  padding: '0.5rem',
                  color: '#dc2626',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                title="Excluir áudio"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Player HTML5 */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Instruções */}
      <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>
          💡 Dica: Fale próximo ao microfone para melhor qualidade
          {micPermission === 'denied' && ' (Permissão de microfone negada nas configurações do navegador)'}
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default AudioRecorder