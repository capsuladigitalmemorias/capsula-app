import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Importando o componente Navbar universal
import Navbar from '../components/Navbar';

import { FaCamera, FaVolumeUp } from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im'; // Ícone de spinner

// Importe o CapsuleModal aqui
import CapsuleModal from '../components/CapsuleModal';

// IMPORTE O NOVO ARQUIVO CSS DO DASHBOARD
import './Dashboard.css';

// Array de frases inspiradoras
const inspirationalQuotes = [
    "Viva intensamente, preserve para sempre.",
    "Cada momento é uma cápsula de tempo esperando para ser preservada.",
    "As memórias são os tesouros que guardamos para toda a vida.",
    "Capture o hoje, reviva amanhã.",
    "Pequenos momentos, grandes memórias.",
    "A vida é feita de momentos que merecem ser lembrados.",
    "Preserve suas histórias, elas são o que te define.",
    "Memórias são a única moeda que se valoriza com o tempo.",
    "Guarde não apenas fotos, mas sentimentos.",
    "O tempo passa, mas as memórias ficam.",
    "A sua vida ficará ainda mais rica a partir do momento que você começar a colecionar boas memórias.",
    "Nosso momento nesta Terra é limitado. Aproveite cada instante como se ele fosse o último.",
    "Seja a sua melhor versão e conquiste o mundo com o seu jeitinho particular!",
    "A espontaneidade e as surpresas da vida é o que a tornam interessante.",
    "A vida pode ser bela. Para isso, devemos sempre buscar nos pequenos detalhes a perfeição de cada instante.",
    "Sonhe, se jogue, arrisque tudo que puder, viva!",
    "A beleza de sonhar por uma vida melhor é de graça e pode colocar os seus objetivos no caminho certo.",
    "Nossas vidas são definidas por oportunidades, inclusive aquelas que perdemos.",
    "O homem que mais viveu não é aquele que completou mais anos, mas aquele que experimentou a vida com mais intensidade.",
    "A vida é 10% do que nos ocorre e 90% de como reagimos.",
    "Esteja presente em cada momento da sua vida, antes que estes momentos se tornem apenas lembranças.",
    "Ria da vida, não se lamente por ela.",
    "Não conte os dias da sua vida, deixe que a vida os conte por você.",
    "Encontrar beleza na simplicidade das coisas ao nosso redor é o segredo da vida.",
    "Assuma a responsabilidade sobre seus próprios ombros e saiba que você é o criador do seu destino.",
    "A vida pode não ser um conto de fadas, mas é repleta de pequenos milagres para quem pensa positivamente.",
    "O que não provoca minha morte faz com que eu fique mais forte.",
    "Tente mover o mundo – o primeiro passo será mover a si mesmo.",
    "Somos feitos de carne e osso, mas temos de viver como se fôssemos de ferro.",
    "Aprenda como se você fosse viver para sempre. Viva como se você fosse morrer amanhã.",
    "Não há que ser forte. Há que ser flexível.",
    "As lembranças podem aquecer a alma, mas também podem despedaçá-la.",
    "A minha fé, nas densas trevas, resplandece mais viva.",
    "O segredo da força está na vontade.",
    "A força sem inteligência é como o movimento sem direção.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Acredite que você pode e você já estará no meio do caminho.",
    "Não espere. O momento nunca será o ideal.",
    "O maior erro que você pode cometer é ter medo de cometer um erro.",
    "Se você pode sonhar, você pode realizar.",
    "O sucesso, na maioria das vezes, é a soma de pequenos esforços repetidos dia após dia.",
    "Não tenha medo de desistir do bom para buscar o ótimo.",
    "Não tenha medo de falhar, tenha medo de não tentar.",
    "A maneira de começar é parar de falar e começar a fazer.",
    "Existe um momento na vida de cada pessoa que é possível sonhar e realizar nossos sonhos… e esse momento tão fugaz chama-se presente e tem a duração do tempo que passa.",
    "É mais fácil obter o que se deseja com um sorriso do que à ponta da espada.",
    "Enquanto a cor da pele for mais importante que o brilho dos olhos, haverá guerra.",
    "Viver é a coisa mais rara do mundo. A maioria das pessoas apenas existe.",
    "Preocupe-se mais com a sua consciência do que com sua reputação. Porque sua consciência é o que você é, e a sua reputação é o que os outros pensam de você. E o que os outros pensam, é problema deles.",
    "As mais lindas palavras de amor são ditas no silêncio de um olhar.",
    "O verdadeiro amor nunca se desgasta. Quanto mais se dá mais se tem.",
    "Triste época! É mais fácil desintegrar um átomo do que um preconceito.",
    "A dúvida é o princípio da sabedoria.",
    "Nossa maior fraqueza está em desistir. O caminho mais certo de vencer é tentar mais uma vez.",
    "Não é o mais forte que sobrevive, nem o mais inteligente, mas o que melhor se adapta às mudanças.",
    "A maneira mais fácil e mais segura de vivermos honradamente consiste em sermos, na realidade, o que parecemos ser.",
    "O mais feliz dos felizes é aquele que faz os outros felizes.",
    "O que é mais difícil não é escrever muito; é dizer tudo, escrevendo pouco.",
    "Nunca saberás o que é suficiente enquanto não souberes o que é mais que suficiente.",
];

// Array de dicas para criar cápsulas
const capsuleTips = [
    {
        title: "Descreva sensações físicas",
        description: "Inclua como você se sentiu fisicamente: arrepios, calor, frio, textura das coisas que tocou."
    },
    {
        title: "Capture os cheiros",
        description: "Os aromas são poderosos gatilhos de memória. Descreva os cheiros presentes no momento."
    },
    {
        title: "Registre sons e músicas",
        description: "Anote músicas que tocavam, sons ambientes ou conversas marcantes que fizeram parte do momento."
    },
    {
        title: "Detalhe suas emoções",
        description: "Vá além de 'feliz' ou 'triste'. Descreva nuances emocionais e como elas se manifestaram."
    },
    {
        title: "Inclua pequenos detalhes",
        description: "Às vezes, são os pequenos detalhes que tornam uma memória especial e única."
    }
];

// Removendo o componente CapsulaLogo daqui, pois ele não será mais usado diretamente no Dashboard
// Ele estaria dentro do Navbar agora, se fosse o caso.

const Dashboard = () => {
    const [capsules, setCapsules] = useState([]);
    const [latestCapsule, setLatestCapsule] = useState(null);
    const [randomMemory, setRandomMemory] = useState(null);
    const [stats, setStats] = useState({
        this_month: 0,
        this_year: 0,
        total_capsules: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [dailyQuote, setDailyQuote] = useState('');
    const [isFirstLogin, setIsFirstLogin] = useState(false);

    // Novos estados para o CapsuleModal
    const [showCapsuleModal, setShowCapsuleModal] = useState(false);
    const [selectedCapsule, setSelectedCapsule] = useState(null);

    // NOVOS ESTADOS PARA AS URLs DAS IMAGENS NO DASHBOARD
    const [randomMemoryImageUrl, setRandomMemoryImageUrl] = useState(null);
    const [latestCapsuleImageUrl, setLatestCapsuleImageUrl] = useState(null);


    const { user, logout } = useAuth(); // Mantém useAuth aqui para usar 'user.name' e 'logout' no erro
    const navigate = useNavigate();

    // Função para abrir o CapsuleModal
    const openCapsuleModal = (capsule) => {
        setSelectedCapsule(capsule);
        setShowCapsuleModal(true);
    };

    // Função para fechar o CapsuleModal
    const closeCapsuleModal = () => {
        setShowCapsuleModal(false);
        setSelectedCapsule(null); // Limpa a cápsula selecionada ao fechar
    };


    // Buscar estatísticas e cápsulas
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');

            try {
                // Buscar estatísticas
                console.log('Buscando estatísticas...');
                const statsResponse = await api.get('/api/capsules/stats');
                console.log('Resposta das estatísticas:', statsResponse.data);

                // CORREÇÃO: Acessando diretamente statsResponse.data
                if (statsResponse.data) {
                    setStats(statsResponse.data);
                } else {
                    console.error('Falha ao buscar estatísticas: Dados não encontrados ou estrutura inesperada.');
                    setError('Falha ao carregar estatísticas.');
                }

                // Buscar lista de cápsulas
                console.log('Buscando lista de cápsulas...');
                const capsulesResponse = await api.get('/api/capsules');
                console.log('Resposta da busca de cápsulas:', capsulesResponse.data); // Axios retorna os dados em .data


                // === INÍCIO DAS CORREÇÕES ===
                // O backend agora retorna diretamente o array, não { capsules: [...] }
                // Verificamos se capsulesResponse.data é um array diretamente.
                if (capsulesResponse.data && Array.isArray(capsulesResponse.data)) {
                    console.log('Cápsulas recebidas:', capsulesResponse.data);
                    const capsulesList = capsulesResponse.data || []; // Atribui diretamente
                    setCapsules(capsulesList);

                    // Definir a última cápsula criada
                    if (capsulesList.length > 0) {
                        // Ordenar por data de criação (mais recente primeiro)
                        const sortedCapsules = [...capsulesList].sort((a, b) =>
                            new Date(b.created_at) - new Date(a.created_at)
                        );
                        setLatestCapsule(sortedCapsules[0]);

                        // Selecionar uma cápsula aleatória para recordação
                        if (capsulesList.length > 1) {
                            // Excluir a última cápsula para não repetir
                            const memoryCandidates = capsulesList.filter(c => c.id !== sortedCapsules[0].id);

                            // Tentar encontrar uma cápsula de um ano atrás, mesmo dia
                            const today = new Date();
                            const oneYearAgo = new Date(today);
                            oneYearAgo.setFullYear(today.getFullYear() - 1);

                            let foundSpecialMemory = false;

                            // Verificar cápsulas de um ano atrás (mesmo dia)
                            const yearAgoMemories = memoryCandidates.filter(c => {
                                const capsuleDate = new Date(c.created_at + 'Z'); // Adiciona 'Z' para UTC
                                return capsuleDate.getDate() === oneYearAgo.getDate() &&
                                       capsuleDate.getMonth() === oneYearAgo.getMonth();
                            });

                            if (yearAgoMemories.length > 0) {
                                setRandomMemory(yearAgoMemories[0]);
                                foundSpecialMemory = true;
                            }

                            // Se não encontrou, verificar cápsulas do mês passado (mesmo dia)
                            if (!foundSpecialMemory) {
                                const oneMonthAgo = new Date(today);
                                oneMonthAgo.setMonth(today.getMonth() - 1);

                                const monthAgoMemories = memoryCandidates.filter(c => {
                                    const capsuleDate = new Date(c.created_at + 'Z'); // Adiciona 'Z' para UTC
                                    return capsuleDate.getDate() === oneMonthAgo.getDate();
                                });

                                if (monthAgoMemories.length > 0) {
                                    setRandomMemory(monthAgoMemories[0]);
                                    foundSpecialMemory = true;
                                }
                            }

                            // Se ainda não encontrou, escolher uma aleatória
                            if (!foundSpecialMemory) {
                                const randomIndex = Math.floor(Math.random() * memoryCandidates.length);
                                setRandomMemory(memoryCandidates[randomIndex]);
                            }
                        } else { // Se só tem uma cápsula, ela é a última e a aleatória.
                            setRandomMemory(capsulesList[0]);
                        }
                    }
                } else {
                    console.error('Falha ao buscar cápsulas: Dados não encontrados ou estrutura inesperada (esperado array).');
                    setError('Falha ao carregar cápsulas.');
                }
                // === FIM DAS CORREÇÕES ===

            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                // Tratamento de erro aprimorado para Axios
                let errorMessage = 'Erro desconhecido ao carregar dados.';
                if (error.response) {
                    errorMessage = error.response.data.message || `Erro HTTP: ${error.response.status}`;
                    if (error.response.status === 401) { // Não autorizado, sessão expirada
                        logout(); // Chama a função de logout
                    }
                } else if (error.request) { // Requisição feita, mas sem resposta
                    errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
                } else { // Algo aconteceu ao configurar a requisição
                    errorMessage = error.message;
                }
                setError(`Erro ao carregar dados: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger, logout]); // Adicionar refreshTrigger e logout como dependências

    // --- NOVO useEffect para a mensagem de boas-vindas ---
    useEffect(() => {
        // Verifica se o usuário está autenticado e se a flag de primeiro login não existe
        const firstLoginFlag = localStorage.getItem('firstLoginDone');
        if (user && !firstLoginFlag) {
            setIsFirstLogin(true);
            // Marca que o primeiro login (para efeitos da mensagem) foi feito
            localStorage.setItem('firstLoginDone', 'true');
        } else {
            setIsFirstLogin(false);
        }
        // Dependência: 'user' garante que roda depois que o user do useAuth é carregado
    }, [user]);


    // --- NOVO useEffect para carregar a imagem da Recordação Aleatória ---
    useEffect(() => {
        let currentObjectUrl = null; // Variável para armazenar a URL temporária para cleanup
        const fetchRandomMemoryImage = async () => {
            setRandomMemoryImageUrl(null); // Limpa a URL anterior antes de tentar carregar uma nova
            if (randomMemory && hasMediaType(randomMemory, 'image')) {
                const imageMedia = randomMemory.media_files.find(m => m.file_type === 'image');
                if (imageMedia) {
                    try {
                        // CORREÇÃO: Usando api.get com responseType: 'blob' para buscar a imagem
                        const response = await api.get(`/api/media/${imageMedia.id}`, { responseType: 'blob' });
                        currentObjectUrl = URL.createObjectURL(response.data); // O blob está em response.data
                        setRandomMemoryImageUrl(currentObjectUrl);
                    } catch (error) {
                        console.error("Erro ao carregar imagem da recordação aleatória:", error);
                        setRandomMemoryImageUrl(null); // Limpa a URL em caso de erro
                    }
                }
            } else {
                setRandomMemoryImageUrl(null); // Limpa a URL se não houver cápsula ou imagem
            }
        };

        fetchRandomMemoryImage();

        // Função de limpeza para revogar a Object URL e evitar vazamentos de memória
        return () => {
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
                console.log("URL de objeto da recordação aleatória revogada:", currentObjectUrl);
            }
        };
    }, [randomMemory]); // Dependência: executa quando randomMemory muda

    // --- NOVO useEffect para carregar a imagem da Última Cápsula Criada ---
    useEffect(() => {
        let currentObjectUrl = null; // Variável para armazenar a URL temporária para cleanup
        const fetchLatestCapsuleImage = async () => {
            setLatestCapsuleImageUrl(null); // Limpa a URL anterior antes de tentar carregar uma nova
            if (latestCapsule && hasMediaType(latestCapsule, 'image')) {
                const imageMedia = latestCapsule.media_files.find(m => m.file_type === 'image');
                if (imageMedia) {
                    try {
                        // CORREÇÃO: Usando api.get com responseType: 'blob' para buscar a imagem
                        const response = await api.get(`/api/media/${imageMedia.id}`, { responseType: 'blob' });
                        currentObjectUrl = URL.createObjectURL(response.data); // O blob está em response.data
                        setLatestCapsuleImageUrl(currentObjectUrl);
                    } catch (error) {
                        console.error("Erro ao carregar imagem da última cápsula:", error);
                        setLatestCapsuleImageUrl(null); // Limpa a URL em caso de erro
                    }
                }
            } else {
                setLatestCapsuleImageUrl(null); // Limpa a URL se não houver cápsula ou imagem
            }
        };

        fetchLatestCapsuleImage();

        // Função de limpeza para revogar a Object URL e evitar vazamentos de memória
        return () => {
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
                console.log("URL de objeto da última cápsula revogada:", currentObjectUrl);
            }
        };
    }, [latestCapsule]); // Dependência: executa quando latestCapsule muda


    // Selecionar frase do dia baseada na data
    useEffect(() => {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const quoteIndex = dayOfYear % inspirationalQuotes.length;
        setDailyQuote(inspirationalQuotes[quoteIndex]);
    }, []);

    // Não precisamos mais de handleRefresh se a navbar global tiver o botão de refresh,
    // mas mantenho por enquanto caso seja um refresh de conteúdo específico do Dashboard.
    const handleRefresh = () => {
        console.log('Atualizando dados...');
        setRefreshTrigger(prev => prev + 1);
    };

    // Formatar data para exibição
    const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
            // Adiciona 'Z' para garantir que seja interpretado como UTC, assim como no CapsulesPage.jsx
            const date = new Date(dateString + 'Z');
            return date.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'America/Sao_Paulo' // Explicitamente define o fuso horário de Brasília
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return dateString;
        }
    };

    // Verificar se a cápsula tem mídia de um tipo específico
    const hasMediaType = (capsule, type) => {
        return capsule &&
               capsule.media_files &&
               Array.isArray(capsule.media_files) &&
               capsule.media_files.some(media => media.file_type === type);
    };


    // NOVA FUNÇÃO: Gera um resumo HTML truncado e seguro (mantendo formatação)
    const getHtmlSummary = (html, maxLength = 100) => {
        if (!html) return '';

        // Tags HTML permitidas no resumo, incluindo tags de formatação e estrutura básica
        const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'p', 'br', 'ul', 'ol', 'li'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;

        let charCount = 0;
        let resultHtml = '';
        const openTags = []; // Pilha para rastrear tags abertas para fechamento correto

        const traverseAndAppend = (node) => {
            if (charCount >= maxLength) {
                return; // Parar processamento se o tamanho máximo for atingido
            }

            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue || '';
                const remaining = maxLength - charCount;

                if (text.length > remaining) {
                    resultHtml += text.substring(0, remaining);
                    charCount = maxLength; // Atingiu o tamanho máximo
                } else {
                    resultHtml += text;
                    charCount += text.length;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();

                if (allowedTags.includes(tagName)) {
                    if (tagName !== 'br') { // <br> é auto-fechável
                        resultHtml += `<${tagName}`;
                        // Copiar atributos de estilo para <span> e outros atributos necessários
                        if (tagName === 'span') {
                            const styleAttr = node.getAttribute('style');
                            if (styleAttr) {
                                resultHtml += ` style="${styleAttr}"`;
                            }
                        }
                        // Adicionar outros atributos comuns se necessário para a renderização (ex: href para links, src para imgs - mas imgs não são permitidas aqui)
                        resultHtml += `>`;
                        openTags.push(tagName); // Adicionar tag de abertura à pilha
                    } else {
                        resultHtml += `<br>`;
                    }

                    // Processar recursivamente os filhos
                    for (let i = 0; i < node.childNodes.length; i++) {
                        traverseAndAppend(node.childNodes[i]);
                        if (charCount >= maxLength) break; // Interromper se o tamanho máximo for atingido dentro dos filhos
                    }

                    // Fechar a tag se ela foi aberta e ainda está na pilha
                    if (tagName !== 'br' && openTags[openTags.length - 1] === tagName) {
                        resultHtml += `</${tagName}>`;
                        openTags.pop(); // Remover da pilha
                    }
                } else {
                    // Se a tag não for permitida, processar apenas seus filhos (removendo a tag em si)
                    for (let i = 0; i < node.childNodes.length; i++) {
                        traverseAndAppend(node.childNodes[i]);
                        if (charCount >= maxLength) break;
                    }
                }
            }
        };

        // Iniciar a travessia dos filhos do <body>
        for (let i = 0; i < body.childNodes.length; i++) {
            traverseAndAppend(body.childNodes[i]);
            if (charCount >= maxLength) break;
        }

        // Adicionar reticências se a truncação ocorreu
        if (charCount >= maxLength) {
            resultHtml += '...';
        }

        // Fechar quaisquer tags que ainda estejam abertas na pilha (garante HTML válido)
        while (openTags.length > 0) {
            resultHtml += `</${openTags.pop()}>`;
        }

        return resultHtml;
    };


    // Calcular quanto tempo faz desde a criação da cápsula
    const getTimeAgo = (dateString) => {
        if (!dateString) return '';

        try {
            // Adiciona 'Z' para garantir que seja interpretado como UTC
            const date = new Date(dateString + 'Z');
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Ontem';
            if (diffDays < 7) return `${diffDays} dias atrás`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
            return `${Math.floor(diffDays / 365)} anos atrás`;
        } catch (error) {
            console.error('Erro ao calcular tempo:', error);
            return dateString;
        }
    };

    return (
        <div className="app-container"> {/* Usando app-container do GlobalStyles.css */}
            <Navbar /> {/* AQUI ESTÁ A BARRA DE NAVEGAÇÃO UNIVERSAL */}

            <main> {/* Removemos o main-content daqui, pois cada seção terá seu content-wrapper */}
                {/* Mensagem de erro */}
                {error && (
                    <div className="content-wrapper"> {/* Envolve o erro com content-wrapper */}
                        <div className="message-box error"> {/* Use message-box error para consistência */}
                            {error}
                        </div>
                    </div>
                )}

                {/* --- NOVA SEÇÃO: Mensagem de Boas-Vindas --- */}
                <div className="content-wrapper"> {/* Envolve o welcome-card com content-wrapper */}
                    <div className="welcome-card">
                        <h2 className="welcome-card-title">
                            Olá, {user?.name || 'Usuário'}! 👋
                        </h2>
                        <p className="welcome-card-text">
                            {isFirstLogin
                                ? 'Seja bem-vindo(a) ao Capsula! Seu espaço para guardar memórias preciosas.'
                                : 'Que bom te ver de novo! Pronto(a) para preservar mais momentos?'
                            }
                        </p>
                    </div>
                </div>


                {/* Frase do dia - Agora com título */}
                <div className="content-wrapper"> {/* Envolve o quote-card com content-wrapper */}
                    <div className="quote-card">
                        <h3 className="quote-title">
                            Frase do Dia
                        </h3>
                        <div className="quote-content">
                            <p className="quote-text">
                                <span className="quote-mark-open">"</span>
                                {dailyQuote}
                                <span className="quote-mark-close">"</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="content-wrapper"> {/* Envolve o stats-grid com content-wrapper */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📅</div>
                            <p className="stat-label">
                                Este mês
                            </p>
                            <p className="stat-value">
                                {stats.this_month || 0}
                            </p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">🗓️</div>
                            <p className="stat-label">
                                Este ano
                            </p>
                            <p className="stat-value">
                                {stats.this_year || 0}
                            </p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">🎁</div>
                            <p className="stat-label">
                                Total
                            </p>
                            <Link
                                to="/capsulas"
                                className="stat-link"
                            >
                                {stats.total_capsules || 0}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Ações rápidas */}
                <div className="content-wrapper"> {/* Envolve o actions-grid com content-wrapper */}
                    <div className="actions-grid">
                        <div className="action-card interactive-card">
                            <div className="action-icon-bg action-icon-bg-blue">
                                ✨
                            </div>
                            <h3 className="action-title">
                                Nova Cápsula
                            </h3>
                            <p className="action-description">
                                Registre um novo momento especial
                            </p>
                            <Link
                                to="/criar-capsula"
                                className="action-button primary-button"
                            >
                                Criar Cápsula
                            </Link>
                        </div>

                        <div className="action-card interactive-card">
                            <div className="action-icon-bg action-icon-bg-cyan">
                                📚
                            </div>
                            <h3 className="action-title">
                                Minhas Cápsulas
                            </h3>
                            <p className="action-description">
                                Veja todas as suas memórias guardadas
                            </p>
                            <Link
                                to="/capsulas"
                                className="action-button secondary-button"
                            >
                                Ver Todas
                            </Link>
                        </div>
                    </div>
                </div>

                {/* CONTÊINER FLEX PARA "RECORDACÕES" E "ÚLTIMA CÁPSULA" */}
                <div className="content-wrapper"> {/* Envolve o memory-cards-container com content-wrapper */}
                    <div className="memory-cards-container">

                        {/* Recordações - Nova seção (AGORA É UM ITEM FLEX) */}
                        {randomMemory && (
                            <div className="memory-card interactive-card">
                                <h2 className="memory-card-title">
                                    <span className="memory-card-icon">✨</span> Recordação Aleatória
                                </h2>

                                {/* Imagem da Recordação (se existir) */}
                                {hasMediaType(randomMemory, 'image') && (
                                    <div className="memory-card-image-container">
                                        {randomMemoryImageUrl ? (
                                            <img
                                                src={randomMemoryImageUrl}
                                                alt={randomMemory.title}
                                                className="memory-card-image"
                                                onError={(e) => {
                                                    console.error("Erro ao carregar imagem da Recordação Aleatória:", e);
                                                    e.target.src = 'https://via.placeholder.com/800x100?text=Erro+ao+carregar+imagem';
                                                }}
                                            />
                                        ) : (
                                            <div className="image-loading-placeholder">
                                                <ImSpinner2 className="animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Novo div para o conteúdo principal, flexGrow para ocupar espaço */}
                                <div className="memory-card-content">
                                    <div className="memory-card-header">
                                        {randomMemory.mood && (
                                            <span className="memory-mood-emoji">{randomMemory.mood.emoji}</span>
                                        )}
                                        <h3 className="memory-capsule-title">
                                            {randomMemory.title}
                                        </h3>
                                    </div>

                                    {/* AQUI APLICAMOS A NOVA FUNÇÃO getHtmlSummary */}
                                    <div
                                        className="memory-description"
                                        dangerouslySetInnerHTML={{ __html: getHtmlSummary(randomMemory.description, 100) }}
                                    />

                                    <div className="memory-tags-media">
                                        {/* Indicadores de mídia */}
                                        {hasMediaType(randomMemory, 'audio') && (
                                            <span className="media-indicator media-indicator-audio">
                                                <FaVolumeUp /> {/* Ícone de áudio */}
                                            </span>
                                        )}

                                        {hasMediaType(randomMemory, 'image') && (
                                            <span className="media-indicator media-indicator-image">
                                                <FaCamera /> {/* Ícone de câmera */}
                                            </span>
                                        )}

                                        {/* Tags (limitadas a 3) */}
                                        {randomMemory.tags &&
                                           Array.isArray(randomMemory.tags) &&
                                           randomMemory.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={tag.id}
                                                className="tag-item"
                                            >
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div> {/* Fim do div de conteúdo principal */}

                                {/* CONTÊINER ABSOLUTO PARA BOTÕES DA RECORDACÃO ALEATÓRIA */}
                                <div className="memory-card-actions">
                                    {/* BOTÃO REVIVER MEMÓRIA ALTERADO PARA ABRIR O MODAL */}
                                    <button
                                        onClick={() => openCapsuleModal(randomMemory)}
                                        className="action-button primary-button"
                                    >
                                        Reviver Memória
                                    </button>
                                </div> {/* Fim do contêiner absoluto */}
                            </div>
                        )}

                        {/* Última Cápsula (AGORA É UM ITEM FLEX) */}
                        {loading ? (
                            <div className="memory-card card-base">
                                <p className="memory-card-image-loading">Carregando...</p>
                            </div>
                        ) : latestCapsule ? (
                            <div className="memory-card interactive-card">
                                <h2 className="memory-card-title">
                                    <span className="memory-card-icon">📝</span> Última Cápsula
                                </h2>

                                {/* Imagem da cápsula (se existir) */}
                                {hasMediaType(latestCapsule, 'image') && (
                                    <div className="memory-card-image-container">
                                        {latestCapsuleImageUrl ? (
                                            <img
                                                src={latestCapsuleImageUrl}
                                                alt={latestCapsule.title}
                                                className="memory-card-image"
                                                onError={(e) => {
                                                    console.error("Erro ao carregar imagem da Última Cápsula:", e);
                                                    e.target.src = 'https://via.placeholder.com/800x100?text=Erro+ao+carregar+imagem';
                                                }}
                                            />
                                        ) : (
                                            <div className="image-loading-placeholder">
                                                <ImSpinner2 className="animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Novo div para o conteúdo principal, flexGrow para ocupar espaço */}
                                <div className="memory-card-content">
                                    <div className="memory-card-header">
                                        {latestCapsule.mood && (
                                            <span className="memory-mood-emoji">{latestCapsule.mood.emoji}</span>
                                        )}
                                        <h3 className="memory-capsule-title">
                                            {latestCapsule.title}
                                        </h3>
                                        <div className="memory-date">
                                            {formatDate(latestCapsule.created_at)}
                                        </div>
                                    </div>

                                    {/* AQUI APLICAMOS A NOVA FUNÇÃO getHtmlSummary */}
                                    <div
                                        className="memory-description"
                                        dangerouslySetInnerHTML={{ __html: getHtmlSummary(latestCapsule.description, 100) }}
                                    />

                                    <div className="memory-tags-media">
                                        {/* Indicador de áudio */}
                                        {hasMediaType(latestCapsule, 'audio') && (
                                            <span className="media-indicator media-indicator-audio">
                                                <FaVolumeUp /> {/* Ícone de áudio */}
                                            </span>
                                        )}

                                        {hasMediaType(latestCapsule, 'image') && (
                                            <span className="media-indicator media-indicator-image">
                                                <FaCamera /> {/* Ícone de câmera */}
                                            </span>
                                        )}

                                        {/* Tags */}
                                        {latestCapsule.tags &&
                                           Array.isArray(latestCapsule.tags) &&
                                           latestCapsule.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={tag.id}
                                                className="tag-item"
                                            >
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div> {/* Fim do div de conteúdo principal */}

                                {/* CONTÊINER ABSOLUTO PARA BOTÕES DA ÚLTIMA CÁPSULA */}
                                <div className="memory-card-actions">
                                    {/* BOTÃO VER DETALHES ALTERADO PARA ABRIR O MODAL */}
                                    <button
                                        onClick={() => openCapsuleModal(latestCapsule)}
                                        className="action-button primary-button"
                                    >
                                        Ver Detalhes
                                    </button>
                                    <Link
                                        to={`/editar-capsula/${latestCapsule.id}`}
                                        className="action-button secondary-button"
                                    >
                                        Editar
                                    </Link>
                                </div> {/* Fim do contêiner absoluto */}
                            </div>
                        ) : (
                            <div className="no-capsule-card">
                                <h2 className="no-capsule-title">
                                    <span className="no-capsule-icon">📝</span> Última Cápsula
                                </h2>
                                <div className="no-capsule-icon">📝</div>
                                <h3 className="no-capsule-subtitle">
                                    Nenhuma cápsula criada ainda
                                </h3>
                                <p className="no-capsule-description">
                                    Que tal criar sua primeira cápsula de memórias?
                                </p>
                                <Link
                                    to="/criar-capsula"
                                    className="action-button primary-button"
                                >
                                    Criar Primeira Cápsula
                                </Link>
                            </div>
                        )}
                    </div>
                </div> {/* Fim do content-wrapper do memory-cards-container */}


                {/* Dicas para criar cápsulas - Nova seção */}
                <div className="content-wrapper"> {/* Envolve o tips-section com content-wrapper */}
                    <div className="tips-section">
                        <h2 className="tips-title">
                            <span className="tips-icon">💡</span> Dicas para Criar Cápsulas
                        </h2>

                        <div className="tips-card">
                            <div className="tips-list">
                                {capsuleTips.map((tip, index) => (
                                    <div
                                        key={index}
                                        className={`tip-item ${index % 2 === 0 ? 'tip-item-even' : 'tip-item-odd'}`}
                                    >
                                        <h4 className="tip-title">
                                            <span className="tip-number">
                                                {index + 1}
                                            </span>
                                            {tip.title}
                                        </h4>
                                        <p className="tip-description">
                                            {tip.description}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="tips-action">
                                <Link
                                    to="/criar-capsula"
                                    className="action-button primary-button"
                                >
                                    Criar Nova Cápsula
                                </Link>
                            </div>
                        </div>
                    </div>
                </div> {/* Fim do content-wrapper do tips-section */}
            </main>

            {/* Renderiza o CapsuleModal aqui */}
            <CapsuleModal
                isOpen={showCapsuleModal}
                capsule={selectedCapsule}
                onClose={closeCapsuleModal}
            />
        </div>
    );
};

export default Dashboard;