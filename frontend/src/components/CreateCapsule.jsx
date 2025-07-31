// CÓDIGO COMPLETO E FINAL PARA /home/Wilder/capsula/frontend/src/components/CreateCapsule.jsx
// VERSÃO SEM DEFINIÇÃO LOCAL DE content-wrapper (ela virá do CSS global)

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import Navbar from './Navbar'; // Importando o componente Navbar universal

const CreateCapsulePage = () => { // O nome do componente é CreateCapsulePage
  const { capsuleId } = useParams();
  const navigate = useNavigate();

  const isEditing = !!capsuleId;

  const [capsule, setCapsule] = useState(null); // Só para edição
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moods, setMoods] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]); // Array of numbers

  // Estados para o formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [capsuleDate, setCapsuleDate] = useState('');
  const [localizacao, setLocalizacao] = useState(''); // NOVO: Estado para o campo de localização

  // Estados para nova mídia
  const [imageToUpload, setImageToUpload] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const imageInputRef = useRef(null);

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [audioTimer, setAudioTimer] = useState(0);
  const audioTimerIntervalRef = useRef(null);

  const [uploadingNewMedia, setUploadingNewMedia] = useState(false);

  // Mídias existentes para edição
  const [mediaFiles, setMediaFiles] = useState([]);
  const [displayMediaUrls, setDisplayMediaUrls] = useState({});

  console.log(`[CreateCapsulePage] COMPONENTE CARREGADO. Modo: ${isEditing ? 'Edição' : 'Criação'}.`);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('[CreateCapsulePage] Iniciando busca de dados iniciais (humores, tags).');

        const moodsResponse = await api.get('/api/moods');
        setMoods(Array.isArray(moodsResponse.data?.moods) ? moodsResponse.data.moods : []);
        console.log('[CreateCapsulePage] Humores carregados:', Array.isArray(moodsResponse.data?.moods) ? moodsResponse.data.moods : 'Não é um array, definido como vazio');

        const tagsResponse = await api.get('/api/tags');
        setTags(Array.isArray(tagsResponse.data?.tags) ? tagsResponse.data.tags : []);
        console.log('[CreateCapsulePage] Tags carregadas:', Array.isArray(tagsResponse.data?.tags) ? tagsResponse.data.tags : 'Não é um array, definido como vazio');

        if (isEditing) {
          console.log('[CreateCapsulePage] Modo Edição. Buscando dados da cápsula:', capsuleId);
          const capsuleResponse = await api.get(`/api/capsules/${capsuleId}`);
          setCapsule(capsuleResponse.data?.capsule);
          console.log('[CreateCapsulePage] Cápsula carregada:', capsuleResponse.data?.capsule);

          const fetchedCapsule = capsuleResponse.data?.capsule;
          if (fetchedCapsule) {
            setTitle(fetchedCapsule.title);
            setDescription(fetchedCapsule.description || '');
            setSelectedMood(fetchedCapsule.mood_id || null);
            setCapsuleDate(fetchedCapsule.capsule_date ? new Date(fetchedCapsule.capsule_date).toISOString().slice(0, 16) : '');
            setSelectedTags(Array.isArray(fetchedCapsule.tags) ? fetchedCapsule.tags.map(tag => Number(tag.id)) : []);
            setLocalizacao(fetchedCapsule.location || ''); // NOVO: Define a localização se estiver editando

            const filteredMedia = Array.isArray(fetchedCapsule.media_files)
                ? fetchedCapsule.media_files.filter(media => media.file_type === 'image' || media.file_type === 'audio')
                : [];
            setMediaFiles(filteredMedia);
            console.log('[CreateCapsulePage] Dados da cápsula e mídias inicializadas:', filteredMedia.length);
          } else {
              setError('Dados da cápsula não encontrados.');
              navigate('/capsulas');
              return;
          }
        } else {
          console.log('[CreateCapsulePage] Modo Criação. Inicializando formulário vazio.');
          const now = new Date();
          const year = now.getFullYear();
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const day = now.getDate().toString().padStart(2, '0');
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          setCapsuleDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        }

      } catch (err) {
        console.error('[CreateCapsulePage] ERRO ao carregar dados:', err);
        let errorMessage = 'Erro desconhecido ao carregar dados.';
        if (err.response) {
            errorMessage = err.response.data?.message || `Erro HTTP: ${err.response.status}`;
        } else if (err.request) {
            errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
        } else {
            errorMessage = err.message;
        }
        setError(`Erro ao carregar: ${errorMessage}`);
        if (isEditing && (errorMessage.includes('não encontrada') || errorMessage.includes('acesso negado'))) {
          alert('Cápsula não encontrada ou você não tem permissão para editá-la.');
          navigate('/capsulas');
        }
      } finally {
        setLoading(false);
        console.log('[CreateCapsulePage] Finalizada a busca inicial de dados.');
      }
    };
    fetchInitialData();
  }, [capsuleId, isEditing, navigate]);

  useEffect(() => {
    const fetchMediaBlobs = async () => {
      console.log('[CreateCapsulePage] Iniciando fetch de blobs para mídias existentes.');
      const newDisplayMediaUrls = {};
      for (const media of mediaFiles) {
        if (media.file_type === 'image' || media.file_type === 'audio') {
          try {
            if (typeof media.id === 'number' && !isNaN(media.id) && media.id !== null) {
              const response = await api.get(`/api/media/${media.id}`, { responseType: 'blob' });
              const blob = response.data;
              const url = URL.createObjectURL(blob);
              newDisplayMediaUrls[media.id] = url;
              console.log(`[CreateCapsulePage] Blob de mídia ${media.id} carregado e URL criada: ${url}`);
            } else {
              console.warn(`[CreateCapsulePage] Mídia com ID inválido (${media.id}). Pulando fetch de blob.`);
              newDisplayMediaUrls[media.id] = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50%25' x='50%25' text-anchor='middle' dominant-baseline='middle' font-size='40'%3E%E2%9A%A0%EF%B8%8F%3C/text%3E%3C/svg%3E`;
            }
          } catch (err) {
            console.error(`[CreateCapsulePage] ERRO ao carregar blob para mídia ${media.id}:`, err);
            newDisplayMediaUrls[media.id] = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50%25' x='50%25' text-anchor='middle' dominant-baseline='middle' font-size='40'%3E%E2%9D%8C%3C/text%3E%3C/svg%3E`;
          }
        }
      }
      setDisplayMediaUrls(prevUrls => ({ ...prevUrls, ...newDisplayMediaUrls }));
      console.log('[CreateCapsulePage] Concluído fetch de blobs para mídias.');
    };

    if (Array.isArray(mediaFiles) && mediaFiles.length > 0) {
      const allBlobsFetched = mediaFiles.every(media => displayMediaUrls.hasOwnProperty(media.id) || media.id === null);
      if (!allBlobsFetched) {
        fetchMediaBlobs();
      }
    }
  }, [mediaFiles, displayMediaUrls]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
        console.log('[Cleanup] imagePreviewUrl revogada.');
      }
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
        console.log('[Cleanup] audioUrl revogada.');
      }
    };
  }, [imagePreviewUrl, audioUrl]);

  const handleTagToggle = (tagId) => {
    console.log(`[handleTagToggle] Clicked tag ID: ${tagId}. Type: ${typeof tagId}. Current selectedTags:`, selectedTags);
    setSelectedTags(prev => {
      const isSelected = prev.includes(tagId);
      let newState;
      if (isSelected) {
        newState = prev.filter(id => id !== tagId);
      } else {
        newState = [...prev, tagId];
      }
      console.log(`[handleTagToggle] New selectedTags state:`, newState);
      return newState;
    });
  };

  const handleDeleteMedia = async (mediaId) => {
      console.log('[handleDeleteMedia] Função chamada para mediaId:', mediaId);
      if (!window.confirm('Tem certeza que deseja remover esta mídia da cápsula?')) {
          console.log('[handleDeleteMedia] Exclusão cancelada pelo usuário.');
          return;
      }

      setError('');
      try {
          console.log('[handleDeleteMedia] Iniciando api.delete para mídia:', mediaId);
          await api.delete(`/api/media/delete/${mediaId}`);
          console.log('[handleDeleteMedia] api.delete bem-sucedida. Atualizando estado local.');

          setMediaFiles(prevMedia => {
            const updatedMedia = prevMedia.filter(media => media.id !== mediaId);
            return updatedMedia;
          });

          setDisplayMediaUrls(prevUrls => {
              const newUrls = { ...prevUrls };
              if (newUrls[mediaId] && newUrls[mediaId].startsWith('blob:')) {
                  URL.revokeObjectURL(newUrls[mediaId]);
              }
              delete newUrls[mediaId];
              console.log(`[handleDeleteMedia] Removida URL de display para ${mediaId}.`);
              return newUrls;
          });
          alert('Mídia removida com sucesso!');
          console.log('[handleDeleteMedia] Usuário permanece na página de edição.');

      } catch (err) {
          console.error('[handleDeleteMedia] ERRO ao remover mídia (frontend catch):', err);
          let errorMessage = 'Erro desconhecido ao remover mídia.';
          if (err.response) {
              errorMessage = err.response.data?.message || `Erro HTTP: ${err.response.status}`;
          } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
          setError(`Erro ao remover mídia: ${errorMessage}`);
          alert(`Erro ao remover mídia: ${errorMessage}`);
      }
  };

  const handleImageUpload = (event) => {
      const file = event.target.files[0];
      setImageToUpload(file || null);
      console.log('[handleImageUpload] Arquivo de imagem selecionado:', file ? file.name : 'Nenhum');

      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        console.log('[handleImageUpload] URL de prévia anterior revogada.');
      }
      if (file) {
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
        console.log('[handleImageUpload] Nova URL de prévia criada:', url);
      } else {
        setImagePreviewUrl(null);
      }
  };

  const startRecording = async () => {
    console.log('[startRecording] Tentando iniciar gravação...');
    try {
      clearRecording();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      setRecorder(mediaRecorder);
      console.log('[startRecording] MediaRecorder e stream obtidos.');

      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
        console.log(`[ondataavailable] Chunk de áudio coletado. Tamanho do chunk: ${event.data.size}`);
      };

      mediaRecorder.onstop = () => {
        console.log('[onstop] Gravação parada. Criando Blob...');
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        console.log('[onstop] Audio Blob criado:', blob, 'URL:', url);

        stream.getTracks().forEach(track => track.stop());
        console.log('[onstop] Stream de áudio liberada.');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioTimer(0);

      clearInterval(audioTimerIntervalRef.current);
      audioTimerIntervalRef.current = setInterval(() => {
        setAudioTimer(prevTime => {
          const newTime = prevTime + 1;
          console.log(`[audioTimer] Tempo: ${newTime}s`);
          if (newTime >= 40) {
            stopRecording();
            return 40;
          }
          return newTime;
        });
      }, 1000);
      console.log('[startRecording] Gravação iniciada. Timer iniciado.');
    } catch (err) {
      console.error('[startRecording] ERRO ao iniciar gravação:', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    console.log('[stopRecording] Tentando parar gravação...');
    if (recorder && isRecording) {
      recorder.stop();
      clearInterval(audioTimerIntervalRef.current);
      setIsRecording(false);
      console.log('[stopRecording] Gravação parada pelo usuário ou timer. Timer e estado atualizados.');
    } else {
      console.log('[stopRecording] Nenhum gravador ativo ou já parado.');
    }
  };

  const clearRecording = () => {
    console.log('[clearRecording] Limpando gravação...');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      console.log('[clearRecording] URL de áudio da gravação atual revogada.');
    }
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      console.log('[clearRecording] Recorder parado durante a limpeza.');
    }
    if (recorder && recorder.stream) {
      recorder.stream.getTracks().forEach(track => track.stop());
      console.log('[clearRecording] Stream do microfone liberada.');
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setAudioTimer(0);
    clearInterval(audioTimerIntervalRef.current);
    setIsRecording(false);
    console.log('[clearRecording] Gravação resetada e limpa.');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteCapsule = async () => {
      console.log('[handleDeleteCapsule] Função chamada para capsuleId:', capsuleId);
      if (!window.confirm('ATENÇÃO: Tem certeza que deseja EXCLUIR esta cápsula e TODA a sua mídia? Esta ação é IRREVERSÍVEL!')) {
          console.log('[handleDeleteCapsule] Exclusão de cápsula cancelada pelo usuário.');
          return;
      }

      setLoading(true);
      setError('');

      try {
          console.log('[handleDeleteCapsule] Iniciando api.delete para cápsula:', capsuleId);
          await api.delete(`/api/capsules/${capsuleId}`);
          console.log('[handleDeleteCapsule] api.delete bem-sucedida. Redirecionando.');
          alert('Cápsula excluída com sucesso!');
          navigate('/capsulas');
      } catch (err) {
          console.error('[handleDeleteCapsule] ERRO ao excluir cápsula (frontend catch):', err);
          let errorMessage = 'Erro desconhecido ao excluir cápsula.';
          if (err.response) {
              errorMessage = err.response.data?.message || `Erro HTTP: ${err.response.status}`;
          } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
          setError(`Erro ao excluir cápsula: ${errorMessage}`);
          alert(`Erro ao excluir cápsula: ${errorMessage}`);
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log(`[handleSubmit] Formulário enviado. Modo: ${isEditing ? 'Edição' : 'Criação'}.`);

    if (selectedMood === null) {
        setError('Por favor, selecione um humor.');
        setLoading(false);
        return;
    }
    if (!title) {
        setError('Por favor, insira um título.');
        setLoading(false);
        return;
    }

    const payload = {
      title,
      description,
      mood_id: selectedMood,
      capsule_date: capsuleDate,
      tag_ids: selectedTags,
      location: localizacao, // NOVO: Adiciona o campo de localização ao payload
    };

    try {
      let apiEndpoint = '/api/capsules';
      let httpMethod = 'post';
      let successMessage = 'Cápsula criada com sucesso!';
      let redirectPath = '/capsulas';

      if (isEditing) {
        apiEndpoint = `/api/capsules/${capsuleId}`;
        httpMethod = 'put';
        successMessage = 'Cápsula atualizada com sucesso!';
        redirectPath = `/capsulas`;
      }

      console.log(`[handleSubmit] Enviando dados da cápsula para ${apiEndpoint} com método ${httpMethod.toUpperCase()}...`);
      const responseCapsule = await api({
        url: apiEndpoint,
        method: httpMethod,
        data: payload,
      });

      const capsuleData = responseCapsule.data?.capsule;

      if (!capsuleData || !capsuleData.id) {
          throw new Error('ID da cápsula não retornado na resposta.');
      }

      console.log(`[handleSubmit] Operação de ${isEditing ? 'edição' : 'criação'} de cápsula bem-sucedida. ID da cápsula: ${capsuleData.id}`);

      if (imageToUpload || audioBlob) {
        setUploadingNewMedia(true);
        console.log('[handleSubmit] Iniciando upload de novas mídias...');
        const formData = new FormData();

        if (imageToUpload) {
            formData.append('files', imageToUpload);
            console.log('[handleSubmit] Adicionado imagem ao FormData.');
        }
        if (audioBlob) {
            console.log(`[handleSubmit] AudioBlob presente. Tamanho: ${audioBlob.size}, Tipo: ${audioBlob.type}`);
            // Usa 'location' para o nome do arquivo, mas o backend não usa isso para nomear no disco
            formData.append('files', audioBlob, `gravacao_audio_${Date.now()}.webm`);
            console.log('[handleSubmit] Audio Blob adicionado ao FormData.');
        }

        formData.append('capsule_id', capsuleData.id);

        for (let pair of formData.entries()) {
            console.log(`[handleSubmit] FormData entry: ${pair[0]} - ${pair[1] instanceof File || pair[1] instanceof Blob ? `File/Blob (Name: ${pair[1].name || 'N/A'}, Type: ${pair[1].type || 'N/A'}, Size: ${pair[1].size || 'N/A'})` : pair[1]}`);
        }

        console.log('[handleSubmit] Enviando FormData para /api/media/upload...');
        const uploadResponse = await api.post(`/api/media/upload`, formData);
        console.log('[handleSubmit] Resposta do upload de mídias:', uploadResponse.data);

        const newMediaList = Array.isArray(uploadResponse.data?.media_files) ? uploadResponse.data.media_files : [];
        setMediaFiles(prevMedia => [...prevMedia, ...newMediaList]);
        console.log('[handleSubmit] Mídias existentes atualizadas com novas mídias.');

        const newDisplayUrls = { ...displayMediaUrls };
        for (const media of newMediaList) {
            if ((media.file_type === 'image' || media.file_type === 'audio') && media.id && media.id !== 'null') {
                try {
                    const response = await api.get(`/api/media/${media.id}`, { responseType: 'blob' });
                    const blob = response.data;
                    newDisplayUrls[media.id] = URL.createObjectURL(blob);
                    console.log(`[handleSubmit] URL de display criada para nova mídia ${media.id}.`);
                } catch (err) {
                    console.error(`[handleSubmit] ERRO ao carregar blob para nova mídia ${media.id}:`, err);
                    newDisplayUrls[media.id] = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50%25' x='50%25' text-anchor='middle' dominant-baseline='middle' font-size='40'%3E%E2%9D%8C%3C/text%3E%3C/svg%3E`;
                }
            } else {
                console.warn(`[handleSubmit] Mídia sem ID válido ou com ID nulo para pré-carregamento de URL:`, media);
            }
        }
        setDisplayMediaUrls(prevUrls => ({ ...prevUrls, ...newDisplayUrls }));

        setImageToUpload(null);
        setImagePreviewUrl(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
        clearRecording();
        console.log('[handleSubmit] Inputs de mídia e gravação limpos.');

        alert('Novas mídias adicionadas à cápsula!');
        console.log('[handleSubmit] Upload de novas mídias concluído.');
      }

      alert(successMessage);
      console.log(`[handleSubmit] Navegando para: ${redirectPath}`);
      navigate(redirectPath);
      console.log('[handleSubmit] Processo finalizado.');

    } catch (err) {
      console.error('[handleSubmit] ERRO na operação da cápsula ou upload de mídias:', err);
      let errorMessage = 'Erro desconhecido na operação.';
      if (err.response) {
          errorMessage = err.response.data?.message || `Erro HTTP: ${err.response.status}`;
      } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
      setError(`Erro: ${errorMessage}`);
      alert(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
      setUploadingNewMedia(false);
    }
  };

  // Removendo a Navbar dos blocos de loading e erro para que ela sempre apareça
  if (loading && (isEditing ? capsule === null : true)) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content-wrapper">
          <div className="content-wrapper" style={{ textAlign: 'center' }}>
            {isEditing ? 'Carregando dados da cápsula para edição...' : 'Preparando formulário de criação...'}
          </div>
        </div>
      </div>
    );
  }

  if (isEditing && error && capsule === null) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content-wrapper">
          <div className="content-wrapper">
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              {error}
              <button onClick={() => navigate('/capsulas')} style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                Voltar para Cápsulas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasExistingImage = mediaFiles.some(media => media.file_type === 'image');
  const hasExistingAudio = mediaFiles.some(media => media.file_type === 'audio');

  const isImageReadyForUpload = imageToUpload !== null;
  const isAudioReadyForUpload = audioBlob !== null;

  return (
    <div className="app-container">
      <Navbar />

     <div className="main-content-wrapper">
     {/* Cabeçalho da página (título) - dentro do content-wrapper */}
     <div className="content-wrapper page-header">
     <h2 className="page-title"> {isEditing ? `Editar Cápsula: ${capsule?.title}` : 'Criar Nova Cápsula ✨'}
     </h2>
     {error && (
    <div className="page-header-error-message" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem' }}>
    {error}
    </div>
    )}
    </div>

        {/* O restante do formulário também deve estar dentro de um content-wrapper para alinhar */}
        <div className="content-wrapper">
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                <label htmlFor="capsuleDate">Data e Hora da Memória</label>
                <input
                  type="datetime-local"
                  id="capsuleDate"
                  name="capsuleDate"
                  className="form-input"
                  value={capsuleDate}
                  onChange={(e) => setCapsuleDate(e.target.value)}
                  style={{ display: 'block', minWidth: 0, width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                <label htmlFor="title">Título da Cápsula <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ display: 'block', minWidth: 0, width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                <label htmlFor="localizacao">Localização (Opcional):</label> {/* NOVO: Campo de localização */}
                <input
                  type="text"
                  id="localizacao"
                  name="localizacao"
                  className="form-input"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  placeholder="Ex: Paris, Torre Eiffel"
                  style={{ display: 'block', minWidth: 0, width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                <label htmlFor="description">Descrição</label>
                <ReactQuill
                  className="description-editor"
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  placeholder="Descreva sua memória com mais detalhes..."
                  modules={{
                      toolbar: [
                          [{ 'header': [1, 2, false] }],
                          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          [{ 'indent': '-1' }, { 'indent': '+1' }],
                          ['link'],
                          [{ 'align': [] }],
                          ['clean']
                      ],
                  }}
                  formats={[
                      'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
                      'list', 'bullet', 'indent', 'link', 'align'
                  ]}
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              {/* Humores */}
              <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                <label>Como você se sente? <span style={{ color: 'red' }}>*</span></label>
                <div className="mood-grid">
                  {console.log('Rendering moods. Type:', typeof moods, 'Value:', moods)}
                  {Array.isArray(moods) && moods.map(mood => (
                    <div
                      key={mood.id}
                      className={`mood-item ${selectedMood === mood.id ? 'selected' : ''}`}
                      onClick={() => {
                        console.log(`[Mood Click] Clicado: ${mood.id}. SelectedMood antes: ${selectedMood}`);
                        setSelectedMood(mood.id);
                        console.log(`[Mood Click] setSelectedMood para: ${mood.id}`);
                      }}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-name">{mood.name}</span>
                    </div>
                  ))}
                </div>
                {selectedMood === null && <p style={{ color: 'red', fontSize: '0.875rem' }}>Por favor, selecione um humor.</p>}
              </div>

              {/* Tags */}
              <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                <label>Tags</label>
                <div className="mood-grid">
                  {console.log('Rendering tags. Type:', typeof tags, 'Value:', tags)}
                  {Array.isArray(tags) && tags.map(tag => (
                    <div
                      key={tag.id}
                      className={`mood-item ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <span className="mood-name">{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO DE MÍDIA */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                  <h3>Mídias</h3>
                  {isEditing && Array.isArray(mediaFiles) && mediaFiles.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                          {console.log('Rendering mediaFiles. Type:', typeof mediaFiles, 'Value:', mediaFiles)}
                          {mediaFiles.map(media => (
                              (media.file_type === 'image' || media.file_type === 'audio') && (
                                  <div key={media.id} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden', width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                      {(media.file_type === 'image' && displayMediaUrls[media.id]) ? (
                                          <img
                                              src={displayMediaUrls[media.id]}
                                              alt={media.original_filename}
                                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                          />
                                      ) : (media.file_type === 'audio' && displayMediaUrls[media.id]) ? (
                                          <audio controls src={displayMediaUrls[media.id]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}></audio>
                                      ) : (
                                          <p style={{ margin: 0, padding: '0.5rem', fontSize: '0.875rem', textAlign: 'center', color: '#a0aec0' }}>
                                            {media.file_type === 'image' ? 'Imagem' : media.file_type === 'audio' ? 'Áudio' : media.file_type}: {media.original_filename} (Carregando...)
                                          </p>
                                      )}

                                      <button
                                          type="button"
                                          onClick={() => handleDeleteMedia(media.id)}
                                          style={{
                                              position: 'absolute',
                                              top: '0.25rem',
                                              right: '0.25rem',
                                              background: 'rgba(255, 0, 0, 0.7)',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '50%',
                                              width: '24px',
                                              height: '24px',
                                              display: 'flex',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                              cursor: 'pointer',
                                              fontSize: '0.75rem',
                                              fontWeight: 'bold',
                                              zIndex: 10
                                          }}
                                          title="Remover mídia"
                                      >
                                          X
                                      </button>
                                  </div>
                              )
                          ))}
                      </div>
                  )}
                  {isEditing && Array.isArray(mediaFiles) && mediaFiles.length === 0 && !isImageReadyForUpload && !isAudioReadyForUpload && <p>Nenhuma mídia nesta cápsula ainda.</p>}

                  {(!hasExistingImage && !imageToUpload) && (
                    <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                        <label htmlFor="imageUpload">Adicionar Imagem (Máx. 1)</label>
                        <input
                            type="file"
                            id="imageUpload"
                            name="imageUpload"
                            className="form-input"
                            onChange={handleImageUpload}
                            accept="image/*"
                            ref={imageInputRef}
                            style={{ display: 'block', minWidth: 0, width: '100%' }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                            A imagem será automaticamente otimizada e redimensionada para uma dimensão máxima de 800px (mantendo a proporção original) e comprimida.
                        </p>
                    </div>
                  )}
                  {imageToUpload && (
<div style={{
  marginTop: '1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  width: '200px',
  minHeight: '150px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxSizing: 'border-box',
  padding: '5px',
  flexShrink: 0,
  backgroundColor: '#f8f8f8'
}}>
  {imagePreviewUrl && (
    <img
      src={imagePreviewUrl}
      alt="Prévia da imagem selecionada"
      style={{
        maxWidth: '100%',
        maxHeight: '120px',
        objectFit: 'contain',
        marginTop: '5px',
        marginBottom: '5px'
      }}
    />
  )}
  <div style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#4a5568', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
    <span style={{ wordBreak: 'break-all', flexGrow: 1, overflow: 'hidden' }}>{imageToUpload.name}</span>
    <button type="button" onClick={() => { setImageToUpload(null); setImagePreviewUrl(null); if (imageInputRef.current) imageInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2em', marginLeft: '5px' }}>&times;</button>
  </div>
</div>
)}

                  {(!hasExistingAudio && !isRecording && !audioBlob) && (
                    <div className="form-group" style={{ boxSizing: 'border-box', width: '100%' }}>
                        <label>Gravar Áudio (Máx. 40 segundos)</label>
                        <button type="button" onClick={startRecording} className="btn btn-secondary">
                            Iniciar Gravação
                        </button>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                            O áudio deve ter no máximo 40 segundos.
                        </p>
                    </div>
                  )}
                  {isRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <p style={{ margin: 0, color: 'red' }}>Gravando... {formatTime(audioTimer)}</p>
                        <button type="button" onClick={stopRecording} className="btn btn-danger">
                            Parar Gravação
                        </button>
                    </div>
                  )}
                  {audioBlob && (
                      <div style={{ marginTop: '1rem' }}>
                          <audio controls src={audioUrl} style={{ width: '100%' }}></audio>
                          <button type="button" onClick={clearRecording} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                              Limpar Gravação
                          </button>
                      </div>
                  )}

                  {uploadingNewMedia && <p style={{ color: '#4299e1', fontSize: '0.875rem' }}>Fazendo upload de novas mídias...</p>}
              </div>

              <div className="form-actions" style={{ marginTop: '2rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={loading || uploadingNewMedia || selectedMood === null || !title || isRecording}>
                  {loading || uploadingNewMedia ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Criar Cápsula')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/capsulas')}
                  disabled={loading || uploadingNewMedia}
                >
                  Cancelar
                </button>
                {isEditing && (
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteCapsule}
                        disabled={loading || uploadingNewMedia}
                        style={{ marginLeft: '1rem' }}
                    >
                        {loading && !uploadingNewMedia ? 'Excluindo...' : 'Excluir Cápsula'}
                    </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* BLOCO <style jsx> COM ESTILOS DO CABEÇALHO E MEDIA QUERIES */}
      <style jsx>{`
        /* Estilos para o contêiner do cabeçalho da página */
        .main-content-wrapper .page-header {
          display: flex;
          justify-content: center; /* AJUSTADO: Centraliza o h2 e o erro div como um bloco */
          align-items: center; /* AJUSTADO: Alinha os itens verticalmente ao centro */
          flex-wrap: wrap; /* AJUSTADO: Permite quebra de linha em telas menores */
          margin-bottom: 2rem;
          margin-top: 0.05rem;
        }

        /* Estilos para o título da página */
        .page-title {
          color: #2d3748;
          margin: 0;
          font-size: 1.3rem;
          text-align: center; /* AJUSTADO: Centraliza o texto dentro do h2 */
        }

        /* Novo estilo para a mensagem de erro no cabeçalho */
        .page-header-error-message {
            margin-left: 1rem; /* Espaço entre o título e a mensagem de erro (desktop) */
            /* As cores e paddings já vêm do estilo inline, que são bons para a cor do erro */
        }


        /* Estilos base para o ReactQuill */
        .description-editor {
          height: 200px; /* Mantém a altura fixa do editor */
          margin-bottom: 50px; /* Margem padrão para desktop */
        }

        /* VAI AQUI: ESTILOS DE FONTE GLOBAIS PARA O EDITOR (APLICAM-SE A DESKTOP E MOBILE) */
        .description-editor .ql-container {
          font-size: 16px; /* Aumenta a fonte base do container do Quill para todos os tamanhos */
        }

        .description-editor .ql-editor {
          font-size: 16px; /* Garante que a fonte do conteúdo editável seja 16px para todos os tamanhos */
          /* Se você quiser um min-height específico para desktop, coloque aqui */
          /* ex: min-height: 100px; */
        }


        /* Regras para telas menores (smartphones) - APENAS AJUSTES ESPECÍFICOS DE MOBILE */
        @media (max-width: 768px) {
          /* ... (seus estilos existentes para cabeçalho e erro em mobile) ... */

          .description-editor {
            /* Aumenta a margem inferior do editor para dar mais espaço em mobile */
            margin-bottom: 100px;
          }

          .description-editor .ql-editor {
            min-height: 150px; /* Opcional: Garante uma altura mínima MAIOR para o editor em mobile */
          }

          /* Opcional: Adicionar um pouco mais de espaçamento entre todos os form-groups em mobile */
          .form-group {
              margin-bottom: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateCapsulePage;