// /home/Wilder/capsula/frontend/src/components/EditCapsulePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // CORREÇÃO: useAuth agora vem do contexto
import api from '../services/api'; // CORREÇÃO: Importando a instância do Axios

const EditCapsulePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Não precisamos mais do 'token' diretamente aqui, pois a instância 'api' já o gerencia via interceptor.
  const { user, logout } = useAuth(); // Apenas 'user' para verificação de auth e 'logout' para sair.

  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moods, setMoods] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [capsuleDate, setCapsuleDate] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [mediaFiles, setMediaFiles] = useState([]);
  const [newUploadFiles, setNewUploadFiles] = useState([]);
  const [uploadingNewMedia, setUploadingNewMedia] = useState(false);
  const fileInputRef = useRef(null);

  const [displayMediaUrls, setDisplayMediaUrls] = useState({});

  // LOG DE VERIFICAÇÃO DE EXECUÇÃO
  console.log('EditCapsulePage: COMPONENTE CARREGADO (versão com h1 de teste).');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('EditCapsulePage: Iniciando busca de dados para a cápsula:', id);

        // CORREÇÃO: Substituindo apiRequest por api.get
        const moodsResponse = await api.get('/api/moods');
        setMoods(moodsResponse.data.moods || []); // Axios retorna dados em .data
        console.log('EditCapsulePage: Humores carregados:', moodsResponse.data.moods.length);

        // CORREÇÃO: Substituindo apiRequest por api.get
        const tagsResponse = await api.get('/api/tags');
        setTags(tagsResponse.data.tags || []); // Axios retorna dados em .data
        console.log('EditCapsulePage: Tags carregadas:', tagsResponse.data.tags.length);

        // CORREÇÃO: Substituindo apiRequest por api.get
        const capsuleResponse = await api.get(`/api/capsules/${id}`);
        const capsuleData = capsuleResponse.data.capsule; // Axios retorna dados em .data

        setCapsule(capsuleData);
        console.log('EditCapsulePage: Dados da cápsula carregados:', capsuleData.title);

        setTitle(capsuleData.title);
        setDescription(capsuleData.description || '');
        setSelectedMood(capsuleData.mood_id || '');
        setCapsuleDate(capsuleData.capsule_date ? new Date(capsuleData.capsule_date).toISOString().slice(0, 16) : '');
        setLocation(capsuleData.location || '');
        setLatitude(capsuleData.latitude || '');
        setLongitude(capsuleData.longitude || '');
        setIsPrivate(capsuleData.is_private || false);
        setSelectedTags(capsuleData.tags ? capsuleData.tags.map(tag => tag.id) : []); // Garante que selectedTags é array de IDs
        setMediaFiles(capsuleData.media_files || []);
        console.log('EditCapsulePage: Mídias da cápsula inicializadas:', (capsuleData.media_files || []).length);

      } catch (err) {
        console.error('EditCapsulePage: ERRO ao carregar dados para edição:', err);
        // CORREÇÃO: Tratamento de erro aprimorado para Axios
        let errorMessage = 'Erro desconhecido ao carregar dados.';
        if (err.response) {
            errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
            if (err.response.status === 401) { // Não autorizado, sessão expirada
                logout(); // Chama a função de logout
            }
        } else if (err.request) { // Requisição feita, mas sem resposta
            errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
        } else { // Algo aconteceu ao configurar a requisição
            errorMessage = err.message;
        }
        setError(`Erro ao carregar cápsula: ${errorMessage}`);
        if (errorMessage.includes('não encontrada') || errorMessage.includes('acesso negado')) {
          alert('Cápsula não encontrada ou você não tem permissão para editá-la.');
          navigate('/capsulas');
        }
      } finally {
        setLoading(false);
        console.log('EditCapsulePage: Finalizada a busca inicial de dados.');
      }
    };
    // Adiciona 'user' e 'logout' como dependências para garantir re-fetch se necessário após login/logout
    useEffect(() => {
      fetchAllData();
    }, [id, navigate, user, logout]);
  }, [id, navigate, user, logout]);

  useEffect(() => {
    const fetchMediaBlobs = async () => {
      console.log('EditCapsulePage: Iniciando fetch de blobs para mídias existentes.');
      const newDisplayMediaUrls = {};
      for (const media of mediaFiles) {
        // Verifica se já temos o URL para a mídia atual
        if (displayMediaUrls[media.id]) {
            newDisplayMediaUrls[media.id] = displayMediaUrls[media.id];
            continue; // Pula se já tiver URL
        }

        if (media.file_type === 'image' || media.file_type === 'video' || media.file_type === 'audio') {
          try {
            // CORREÇÃO: Substituindo apiRequest por api.get com responseType: 'blob'
            const response = await api.get(`/api/media/${media.id}`, { responseType: 'blob' });
            const blob = response.data; // Axios coloca o Blob em .data quando responseType é 'blob'
            const url = URL.createObjectURL(blob);
            newDisplayMediaUrls[media.id] = url;
            console.log(`EditCapsulePage: Blob de mídia ${media.id} carregado e URL criada.`);
          } catch (err) {
            console.error(`EditCapsulePage: ERRO ao carregar blob para mídia ${media.id}:`, err);
            // Fallback para erro se o carregamento do blob falhar (placeholders SVG)
            newDisplayMediaUrls[media.id] = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50%25\' x=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\' font-size=\'40\'%3E%E2%9D%8C%3C/text%3E%3C/svg%3E';
          }
        } else {
             // Placeholder para tipos não suportados
            newDisplayMediaUrls[media.id] = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50%25\' x=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\' font-size=\'40\'%3E%E2%9A%A0%EF%B8%8F%3C/text%3E%3C/svg%3E';
        }
      }
      setDisplayMediaUrls(prev => ({...prev, ...newDisplayMediaUrls})); // Atualiza mantendo URLs existentes
      console.log('EditCapsulePage: Concluído fetch de blobs para mídias.');
    };

    if (mediaFiles.length > 0) {
      // Pequena otimização: evite buscar blobs se já tiver todos os necessários
      const allBlobsFetched = mediaFiles.every(media => displayMediaUrls[media.id] || ! (media.file_type === 'image' || media.file_type === 'video' || media.file_type === 'audio'));
      if (!allBlobsFetched) {
        fetchMediaBlobs();
      }
    }
    return () => {
      console.log('EditCapsulePage: Revogando Object URLs.');
      // Cria uma cópia dos URLs no momento da limpeza para evitar problemas de closure stale
      const currentUrlsToRevoke = Object.values(displayMediaUrls);
      currentUrlsToRevoke.forEach(url => {
          if (url && url.startsWith('blob:')) { // Revoga apenas se for uma URL de blob
              URL.revokeObjectURL(url);
          }
      });
    };
  }, [mediaFiles, displayMediaUrls]); // 'displayMediaUrls' adicionado para que a função de limpeza tenha acesso aos URLs mais recentes.

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteMedia = async (mediaId) => {
      console.log('handleDeleteMedia: Função chamada para mediaId:', mediaId);
      if (!window.confirm('Tem certeza que deseja remover esta mídia da cápsula?')) {
          console.log('handleDeleteMedia: Exclusão cancelada pelo usuário.');
          return;
      }

      setError('');
      try {
          console.log('handleDeleteMedia: Iniciando api.delete para mídia:', mediaId);
          // CORREÇÃO: Substituindo apiRequest por api.delete
          // Assumindo que o endpoint é /api/media/:id para DELETE
          await api.delete(`/api/media/${mediaId}`);
          console.log('handleDeleteMedia: api.delete bem-sucedida. Atualizando estado local.');

          setMediaFiles(prevMedia => prevMedia.filter(media => media.id !== mediaId));
          setDisplayMediaUrls(prevUrls => {
              const newUrls = { ...prevUrls };
              if (newUrls[mediaId] && newUrls[mediaId].startsWith('blob:')) {
                  URL.revokeObjectURL(newUrls[mediaId]); // Revoga a Blob URL para a mídia excluída
              }
              delete newUrls[mediaId];
              return newUrls;
          });
          alert('Mídia removida com sucesso!');
      } catch (err) {
          console.error('handleDeleteMedia: ERRO ao remover mídia (frontend catch):', err);
          let errorMessage = 'Erro desconhecido ao remover mídia.';
          if (err.response) {
              errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
              if (err.response.status === 401) { logout(); }
          } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
          setError(`Erro ao remover mídia: ${errorMessage}`);
          alert(`Erro ao remover mídia: ${errorMessage}`);
      }
  };

  const handleNewFileUpload = (event) => {
      console.log('handleNewFileUpload: Arquivos selecionados para upload:', event.target.files);
      setNewUploadFiles(Array.from(event.target.files));
  };

  const handleDeleteCapsule = async () => {
      console.log('handleDeleteCapsule: Função chamada para capsuleId:', id);
      if (!window.confirm("ATENÇÃO: Tem certeza que deseja EXCLUIR esta cápsula e TODA a sua mídia? Esta ação é IRREVERSÍVEL!")) {
          console.log('handleDeleteCapsule: Exclusão de cápsula cancelada pelo usuário.');
          return;
      }

      setLoading(true);
      setError('');

      try {
          console.log('handleDeleteCapsule: Iniciando api.delete para cápsula:', id);
          // CORREÇÃO: Substituindo apiRequest por api.delete
          await api.delete(`/api/capsules/${id}`);
          console.log('handleDeleteCapsule: api.delete bem-sucedida. Redirecionando.');
          alert('Cápsula excluída com sucesso!');
          navigate('/capsulas');
      } catch (err) {
          console.error('handleDeleteCapsule: ERRO ao excluir cápsula (frontend catch):', err);
          let errorMessage = 'Erro desconhecido ao excluir cápsula.';
          if (err.response) {
              errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
              if (err.response.status === 401) { logout(); }
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
    console.log('handleSubmit: Formulário enviado. Iniciando atualização da cápsula.');

    // Validações básicas
    if (!selectedMood) {
        setError('Por favor, selecione um humor.');
        setLoading(false);
        return;
    }
    if (!title) {
        setError('Por favor, insira um título.');
        setLoading(false);
        return;
    }

    const updatedCapsule = {
      title,
      description,
      mood_id: selectedMood,
      capsule_date: capsuleDate,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      is_private: isPrivate,
      tag_ids: selectedTags,
    };

    try {
      console.log('handleSubmit: Atualizando metadados da cápsula...');
      // CORREÇÃO: Substituindo apiRequest por api.put
      // Axios envia o objeto diretamente como JSON no corpo para PUT/POST
      await api.put(`/api/capsules/${id}`, updatedCapsule);
      console.log('handleSubmit: Metadados da cápsula atualizados com sucesso.');

      if (newUploadFiles.length > 0) {
        setUploadingNewMedia(true);
        console.log('handleSubmit: Iniciando upload de novas mídias...');
        const formData = new FormData();
        newUploadFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('capsule_id', id); // ID da cápsula que está sendo editada

        // CORREÇÃO: Substituindo apiRequest por api.post
        const uploadResponse = await api.post(`/api/media/upload`, formData);
        const newMediaList = uploadResponse.data?.media_files || []; // Axios retorna dados em .data
        setMediaFiles(prevMedia => [...prevMedia, ...newMediaList]);
        const newDisplayUrls = { ...displayMediaUrls };
        for (const media of newMediaList) {
            if (media.file_type === 'image' || media.file_type === 'video' || media.file_type === 'audio') {
                try {
                    // CORREÇÃO: Substituindo apiRequest por api.get com responseType: 'blob'
                    const response = await api.get(`/api/media/${media.id}`, { responseType: 'blob' });
                    const blob = response.data; // Axios coloca o Blob em .data
                    newDisplayUrls[media.id] = URL.createObjectURL(blob);
                } catch (err) {
                    console.error(`ERRO ao carregar blob para nova mídia ${media.id}:`, err);
                    newDisplayUrls[media.id] = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50%25\' x=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\' font-size=\'40\'%3E%E2%9D%8C%3C/text%3E%3C/svg%3E';
                }
            }
        }
        setDisplayMediaUrls(prev => ({...prev, ...newDisplayUrls})); // Atualiza mantendo URLs existentes

        setNewUploadFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Limpa o input de arquivo
        }
        alert('Novas mídias adicionadas à cápsula!');
        console.log('handleSubmit: Upload de novas mídias concluído.');
      }

      alert('Cápsula atualizada com sucesso!');
      navigate('/capsulas');
      console.log('handleSubmit: Operação de salvamento completa. Redirecionando.');

    } catch (err) {
      console.error('handleSubmit: ERRO na atualização da cápsula ou upload de mídias:', err);
      let errorMessage = 'Erro desconhecido na operação.';
      if (err.response) {
          errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
          if (err.response.status === 401) { logout(); }
      } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
      setError(`Erro: ${errorMessage}`);
      alert(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
      setUploadingNewMedia(false);
      console.log('handleSubmit: Processo finalizado.');
    }
  };

  // Funções de renderização condicional (loading, error)
  if (loading && capsule === null) {
    return (
      <div className="app-container">
        <h1>TESTE DE CARREGAMENTO: ESPERANDO DADOS...</h1> {/* TESTE VISUAL */}
        <nav className="navbar">
          <div className="navbar-content">
            <div className="nav-brand"><h1>Capsula</h1></div>
            <div className="nav-menu">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/criar-capsula" className="nav-link">Nova Cápsula</Link>
              <Link to="/capsulas" className="nav-link">Minhas Cápsulas</Link>
              <button onClick={logout} className="nav-link">Sair</button>
            </div>
          </div>
        </nav>
        <div className="main-container" style={{ textAlign: 'center', padding: '3rem' }}>
          Carregando dados da cápsula para edição...
        </div>
      </div>
    );
  }

  if (error && capsule === null) {
    return (
      <div className="app-container">
        <h1>TESTE DE CARREGAMENTO: ERRO INICIAL!</h1> {/* TESTE VISUAL */}
        <nav className="navbar">
          <div className="navbar-content">
            <div className="nav-brand"><h1>Capsula</h1></div>
            <div className="nav-menu">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/criar-capsula" className="nav-link">Nova Cápsula</Link>
              <Link to="/capsulas" className="nav-link">Minhas Cápsulas</Link>
              <button onClick={logout} className="nav-link">Sair</button>
            </div>
          </div>
        </nav>
        <div className="main-container">
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            {error}
            <button onClick={() => navigate('/capsulas')} style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
              Voltar para Cápsulas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 style={{ color: 'purple', textAlign: 'center', padding: '1rem' }}>🎉 ESTA É A NOVA VERSÃO! 🎉</h1> {/* TESTE VISUAL */}
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="nav-brand">
            <h1>Capsula</h1>
          </div>
          <div className="nav-menu">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/criar-capsula" className="nav-link">Nova Cápsula</Link>
            <Link to="/capsulas" className="nav-link active">Minhas Cápsulas</Link>
            <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#2d3748', margin: 0, fontSize: '2rem' }}>Editar Cápsula: {capsule?.title}</h2>
          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', flexGrow: 1, marginLeft: '1rem' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <form onSubmit={handleSubmit}>
            {/* Título */}
            <div className="form-group">
              <label htmlFor="title">Título da Cápsula <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Descrição */}
            <div className="form-group">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                name="description"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Humores */}
            <div className="form-group">
              <label>Como você se sente? <span style={{ color: 'red' }}>*</span></label>
              <div className="mood-grid">
                {moods.map(mood => (
                  <div
                    key={mood.id}
                    className={`mood-item ${selectedMood === mood.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(mood.id)}
                  >
                    <span className="mood-emoji">{mood.emoji}</span>
                    <span className="mood-name">{mood.name}</span>
                  </div>
                ))}
              </div>
              {!selectedMood && <p style={{ color: 'red', fontSize: '0.875rem' }}>Por favor, selecione um humor.</p>}
            </div>

            {/* Tags */}
            <div className="form-group">
              <label>Tags</label>
              <div className="mood-grid">
                {tags.map(tag => (
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

            {/* Data e Hora */}
            <div className="form-group">
              <label htmlFor="capsuleDate">Data e Hora da Memória</label>
              <input
                type="datetime-local"
                id="capsuleDate"
                name="capsuleDate"
                className="form-input"
                value={capsuleDate}
                onChange={(e) => setCapsuleDate(e.target.value)}
              />
            </div>

            {/* Localização */}
            <div className="form-group">
              <label htmlFor="location">Localização</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Latitude e Longitude (Opcional) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="latitude">Latitude</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  step="any"
                />
              </div>
              <div className="form-group">
                <label htmlFor="longitude">Longitude</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  className="form-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  step="any"
                />
              </div>
            </div>

            {/* Checkbox de Privado */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ marginRight: '0.5rem', width: '20px', height: '20px' }}
              />
              <label htmlFor="isPrivate" style={{ marginBottom: 0 }}>Tornar esta cápsula privada</label>
            </div>

            {/* SEÇÃO DE MÍDIA EXISTENTE E NOVA MÍDIA */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                <h3>Mídias Atuais</h3>
                {mediaFiles.length === 0 && <p>Nenhuma mídia nesta cápsula ainda.</p>}
                {mediaFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        {mediaFiles.map(media => (
                            <div key={media.id} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden', width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {/* Renderiza mídia usando URL de objeto ou placeholder */}
                                {(media.file_type === 'image' && displayMediaUrls[media.id]) ? (
                                    <img
                                        src={displayMediaUrls[media.id]}
                                        alt={media.original_filename}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                ) : (media.file_type === 'video' && displayMediaUrls[media.id]) ? (
                                    <video controls style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}>
                                        <source src={displayMediaUrls[media.id]} type={media.mime_type} />
                                        Seu navegador não suporta o elemento de vídeo.
                                    </video>
                                ) : (media.file_type === 'audio' && displayMediaUrls[media.id]) ? (
                                    <audio controls style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}>
                                        <source src={displayMediaUrls[media.id]} type={media.mime_type} />
                                        Seu navegador não suporta o elemento de áudio.
                                    </audio>
                                ) : ( // Fallback para tipos não suportados ou mídias não carregadas ainda
                                    <p style={{ margin: 0, padding: '0.5rem', fontSize: '0.875rem', textAlign: 'center', color: '#a0aec0' }}>{media.file_type}: {media.original_filename} (Carregando...)</p>
                                )}

                                <button
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
                        ))}
                    </div>
                )}

                <h3 style={{ marginTop: '2rem' }}>Adicionar Novas Mídias</h3>
                <div className="form-group">
                    <label htmlFor="mediaUpload">Selecione arquivos para adicionar</label>
                    <input
                        type="file"
                        id="mediaUpload"
                        name="mediaUpload"
                        className="form-input"
                        multiple
                        onChange={handleNewFileUpload}
                        accept="image/*,audio/*,video/*"
                        ref={fileInputRef}
                    />
                    {newUploadFiles.length > 0 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4a5568' }}>
                            Arquivos selecionados: {newUploadFiles.map(file => file.name).join(', ')}
                        </div>
                    )}
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                        A imagem será automaticamente otimizada e redimensionada para uma dimensão máxima de 800px (mantendo a proporção original) e comprimida.
                    </p>
                    {uploadingNewMedia && <p style={{ color: '#4299e1', fontSize: '0.875rem' }}>Fazendo upload de novas mídias...</p>}
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="form-actions" style={{ marginTop: '2rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={loading || uploadingNewMedia || !selectedMood || !title}>
                {loading || uploadingNewMedia ? 'Processando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/capsulas')}
                disabled={loading || uploadingNewMedia}
              >
                Cancelar
              </button>
              <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteCapsule}
                  disabled={loading || uploadingNewMedia}
                  style={{ marginLeft: '1rem' }}
              >
                  {loading && !uploadingNewMedia ? 'Excluindo...' : 'Excluir Cápsula'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCapsulePage;