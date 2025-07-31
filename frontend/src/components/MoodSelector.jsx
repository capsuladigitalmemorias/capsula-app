import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import apiConfig from '../apiConfig';

const MoodSelector = ({ selectedMoodId, onMoodSelect, required = false }) => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- ALTERAÇÃO: Lógica para buscar os HUMORES corrigida ---
  useEffect(() => {
    const fetchMoods = async () => {
      setLoading(true);
      try {
        const response = await apiConfig.apiRequest('/api/moods');
        if (response.success && response.data) {
          // O backend retorna { moods: [...] }
          setMoods(response.data.moods || []);
          setError('');
        } else {
          console.error('Falha ao buscar humores:', response.message);
          setError('Erro ao carregar humores');
          setMoods([]);
        }
      } catch (error) {
        console.error('Erro ao buscar humores:', error);
        setError('Erro ao carregar humores');
        setMoods([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMoods();
  }, []);

  const handleMoodClick = (mood) => {
    onMoodSelect(mood);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        Carregando humores...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
        {error}
        <button 
          type="button"
          onClick={fetchMoods}
          style={{
            display: 'block',
            margin: '1rem auto',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- SEU JSX COMPLETO E INTACTO ESTÁ ABAIXO ---
  return (
    <div>
      <h4 style={{ 
        fontSize: '1rem', 
        fontWeight: '500', 
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        😊 Como você está se sentindo? {required && <span style={{ color: '#dc2626' }}>*</span>}
      </h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '12px'
      }}>
        {moods.length === 0 && !loading && !error ? (
          <p style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            fontSize: '0.875rem',
            padding: '2rem',
            gridColumn: '1 / -1'
          }}>
            Nenhum humor disponível
          </p>
        ) : (
          moods.map((mood) => (
            <div
              key={mood.id}
              onClick={() => handleMoodClick(mood)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 12px',
                border: '2px solid',
                borderColor: selectedMoodId === mood.id ? '#3b82f6' : '#e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: selectedMoodId === mood.id ? 'rgba(59, 130, 246, 0.1)' : 'white',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedMoodId !== mood.id) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMoodId !== mood.id) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <span style={{
                fontSize: '2rem',
                marginBottom: '8px',
                display: 'block'
              }}>
                {mood.emoji}
              </span>
              <span style={{
                fontSize: '0.85rem',
                textAlign: 'center',
                color: '#4a5568',
                fontWeight: '500',
                lineHeight: '1.2'
              }}>
                {mood.name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoodSelector;