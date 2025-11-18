// scripts.js - VERSÃO CORRIGIDA PARA HISTÓRIAS
console.log('🔧 scripts.js está carregando...');

class ApiConfig {
    static getBaseUrl() {
        // Usar SEMPRE o Railway diretamente - removendo o proxy Netlify
        return 'https://arandua1-production.up.railway.app';
    }
    
    static async fetch(endpoint, options = {}) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            mode: 'cors',
            signal: controller.signal,
            ...options
        });
        
        clearTimeout(timeoutId);
        
        console.log(`📡 Response Status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro HTTP:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error('❌ Timeout na requisição');
            throw new Error('Timeout: Servidor não respondeu em 10 segundos');
        }
        
        console.error('❌ Erro de fetch:', error);
        throw error;
    }
}}

let currentUser = null;
let allPosts = [];
let isInSearchMode = false;
let isCreatingPost = false;
let selectedCategories = [];
let allCategories = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Carregado - Iniciando aplicação...');
    
    currentUser = getLoggedInUser();
    
    if (currentUser) {
        console.log('✅ Usuário logado:', currentUser);
        initializeApp();
    } else {
        console.log('❌ Usuário não logado - redirecionando...');
        window.location.href = '../Tela_Login/tela_login.html';
    }
});

function getLoggedInUser() {
    const userInfo = sessionStorage.getItem('arandua_current_user');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            // Verificar se tem a flag isLoggedIn OU se tem dados básicos do usuário
            if (user.isLoggedIn || (user.id && user.nome)) {
                return user;
            }
        } catch (error) {
            console.error('Erro ao parsear usuário:', error);
        }
    }
    return null;
}

async function initializeApp() {
    console.log('🚀 Inicializando aplicação...');
    
    try {
        // AGUARDAR DOM completamente pronto
        if (document.readyState !== 'complete') {
            console.log('⏳ Aguardando DOM completo...');
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }
        
        console.log('✅ DOM completamente carregado');
        
        // DEBUG: Verificar elementos críticos
        debugDOM();
        
        // Configuração básica primeiro
        setupBasicUI();
        setupDropdown();
        setupModal();
        
        // Aguardar renderização
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Configuração restante
        setupSearch();
        setupCategoryFilter();
        setupGlobalEventListeners();
        updateActiveCategoriesDisplay();
        preventLinkReload();
        
        // Aguardar mais um pouco
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // CARREGAR POSTS POR ÚLTIMO
        console.log('📚 Iniciando carregamento de posts...');
        await loadPosts();
        
        console.log('✅ Aplicação inicializada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showNotification('Erro ao carregar aplicação: ' + error.message, 'error');
        
        // Tentar carregar posts mesmo com erro
        setTimeout(() => {
            console.log('🔄 Tentativa de recuperação...');
            loadPosts();
        }, 1000);
    }
}

function setupBasicUI() {
    console.log('🔧 Configurando UI básica...');
    
    // Configurar usuário
    if (currentUser) {
        const userButton = document.getElementById('userButton');
        const userName = document.getElementById('userName');
        
        if (userButton) {
            const userNameElement = userButton.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.nome || 'Usuário';
            } else {
                console.warn('⚠️ Elemento .user-name não encontrado no userButton');
            }
        } else {
            console.warn('⚠️ userButton não encontrado');
        }
        
        if (userName) {
            userName.textContent = currentUser.nome || 'Usuário';
        } else {
            console.warn('⚠️ userName não encontrado');
        }
        
        console.log('✅ Usuário configurado:', currentUser.nome);
    } else {
        console.error('❌ currentUser não definido');
    }
}

// ===== INTERFACE DO USUÁRIO =====
function setupUserInterface() {
    const userButton = document.getElementById('userButton');
    const userName = document.getElementById('userName');
    
    if (userButton && currentUser) {
        const userNameElement = userButton.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = currentUser.nome || 'Usuário';
        }
        
        if (userName) {
            userName.textContent = currentUser.nome || 'Usuário';
        }
        
        console.log('✅ Interface do usuário configurada:', currentUser.nome);
    }
}

// ===== WEBSOCKET PARA ATUALIZAÇÕES EM TEMPO REAL =====


function updateLikeCount(postId, likeCount) {
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    if (likeBtn) {
        const likeCountElement = likeBtn.querySelector('.like-count');
        if (likeCountElement) {
            likeCountElement.textContent = likeCount;
        }
    }
}

function updateCommentCount(postId, increment = true) {
    const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"]`);
    if (commentBtn) {
        const commentText = commentBtn.querySelector('.comment-text');
        if (commentText) {
            // Implementar contador de comentários se necessário
        }
    }
}

// ===== DROPDOWN =====
function setupDropdown() {
    const userButton = document.getElementById('userButton');
    const dropdownMenu = document.getElementById('userDropdown');
    const userArea = document.querySelector('.user-area');

    if (userButton && dropdownMenu && userArea) {
        console.log('🔧 Configurando dropdown do usuário...');
        
        userButton.addEventListener('click', function(e) {
            e.preventDefault(); // ✅ ADICIONAR
            e.stopPropagation();
            console.log('🎯 Dropdown clicado, estado atual:', dropdownMenu.classList.contains('hidden'));
            
            const isHidden = dropdownMenu.classList.contains('hidden');
            
            if (isHidden) {
                dropdownMenu.classList.remove('hidden');
                userArea.classList.add('active');
                console.log('✅ Dropdown aberto');
            } else {
                dropdownMenu.classList.add('hidden');
                userArea.classList.remove('active');
                console.log('❌ Dropdown fechado');
            }
        });

        document.addEventListener('click', function(e) {
            if (!userArea.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                userArea.classList.remove('active');
            }
        });

        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });

    } else {
        console.error('❌ Elementos do dropdown não encontrados');
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const userArea = document.querySelector('.user-area');
    
    if (dropdown && userArea) {
        const isHidden = dropdown.classList.contains('hidden');
        
        if (isHidden) {
            dropdown.classList.remove('hidden');
            userArea.classList.add('active');
        } else {
            dropdown.classList.add('hidden');
            userArea.classList.remove('active');
        }
    }
}

function handleLogout() {
    console.log('🚪 Fazendo logout...');
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// ===== MODAL DE CRIAÇÃO DE HISTÓRIA =====
function setupModal() {
    const fabButton = document.getElementById('fabButton');
    const modal = document.getElementById('postCreationModal');
    const cancelButton = document.getElementById('cancelPostBtn');
    const postForm = document.getElementById('postForm');
    const contentInput = document.getElementById('postContent');

    if (fabButton) {
        fabButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.classList.remove('hidden');
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.preventDefault();
                closeModal();
            }
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createStory();
        });
    }

    if (contentInput) {
        contentInput.addEventListener('input', updateCharacterCount);
    }

    setupImagePreview();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

function openModal() {
    console.log('📖 Abrindo modal de criação de história...');
    const modal = document.getElementById('postCreationModal');
    if (modal) {
        modal.classList.remove('hidden');
        const titleInput = document.getElementById('postTitle');
        if (titleInput) titleInput.focus();
    }
}

function closeModal() {
    console.log('📖 Fechando modal...');
    const modal = document.getElementById('postCreationModal');
    const form = document.getElementById('postForm');
    
    if (modal) modal.classList.add('hidden');
    if (form) {
        form.reset();
        updateCharacterCount();
    }
    
    removeImage();
}

function updateCharacterCount() {
    const contentInput = document.getElementById('postContent');
    const charCount = document.getElementById('charCount');
    
    if (contentInput && charCount) {
        const count = contentInput.value.length;
        charCount.textContent = count;
        
        if (count > 5000) {
            charCount.style.color = '#f44336';
        } else if (count > 3000) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#666';
        }
    }
}

// ===== REVERTIDO: createStory para versão anterior (sem compressImage) =====

function compressImage(file, options = {}) {
    const {
        maxWidth = 800,
        maxHeight = 600,
        quality = 0.7,
        maxSizeMB = 1,
        outputFormat = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        console.log(`🖼️ Compressão avançada: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        // Se a imagem já é pequena, não comprime
        if (file.size <= maxSizeMB * 1024 * 1024) {
            console.log('📦 Imagem já está dentro do tamanho limite, convertendo diretamente...');
            fileToBase64(file).then(resolve).catch(reject);
            return;
        }

        const reader = new FileReader();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        reader.onload = function(e) {
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                let currentQuality = quality;

                // Redimensionar se necessário
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                // Preencher fundo branco para PNG transparentes
                if (outputFormat === 'jpeg') {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Tentar diferentes qualidades se necessário
                const compressWithQuality = (quality) => {
                    const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
                    const compressedBase64 = canvas.toDataURL(mimeType, quality);
                    const base64Data = compressedBase64.split(',')[1];
                    const sizeMB = (base64Data.length * 0.75) / 1024 / 1024; // Aproximação do tamanho

                    console.log(`🎯 Qualidade ${quality}: ${sizeMB.toFixed(2)} MB`);

                    if (sizeMB > maxSizeMB && quality > 0.3) {
                        return compressWithQuality(quality - 0.1);
                    }

                    return base64Data;
                };

                const finalBase64 = compressWithQuality(currentQuality);
                console.log(`✅ Compressão final: ${(finalBase64.length / 1024 / 1024).toFixed(2)} MB`);
                resolve(finalBase64);
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function createStory() {
    if (isCreatingPost) return;
    isCreatingPost = true;

    console.log('🔍 DEBUG: Iniciando criação de história...');

    // Coletar dados do formulário
    const titleInput = document.getElementById('postTitle');
    const categoryInput = document.getElementById('postCategory');
    const contentInput = document.getElementById('postContent');
    const tagsInput = document.getElementById('postTags');
    const imageInput = document.getElementById('postImage');

    const title = titleInput ? titleInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const tags = tagsInput ? tagsInput.value.trim() : '';

    // Validações
    if (!title || title.length < 2) {
        showNotification('❌ Título deve ter pelo menos 2 caracteres', 'error');
        isCreatingPost = false;
        return;
    }

    if (!category) {
        showNotification('❌ Selecione uma categoria', 'error');
        isCreatingPost = false;
        return;
    }

    if (!content || content.length < 5) {
        showNotification('❌ Conteúdo deve ter pelo menos 5 caracteres', 'error');
        isCreatingPost = false;
        return;
    }

    let userId = currentUser?.id;
    if (!userId) {
        showNotification('❌ Usuário não identificado', 'error');
        isCreatingPost = false;
        return;
    }

    let imageBase64 = null;
    if (imageInput && imageInput.files[0]) {
        try {
            const file = imageInput.files[0];
            console.log(`🖼️ Processando imagem: ${file.name}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            
            // 🔥 USAR COMPRESSÃO AQUI
            if (file.type.startsWith('image/')) {
                showNotification('📦 Comprimindo imagem...', 'info');
                imageBase64 = await compressImage(file);
                console.log(`✅ Imagem comprimida: ${imageBase64 ? (imageBase64.length / 1024 / 1024).toFixed(2) + ' MB' : 'null'}`);
            } else {
                showNotification('❌ Arquivo não é uma imagem válida', 'error');
                isCreatingPost = false;
                return;
            }
        } catch (err) {
            console.error('❌ Erro ao comprimir imagem:', err);
            showNotification('❌ Erro ao processar imagem', 'error');
            isCreatingPost = false;
            return;
        }
    }

    const storyData = {
        id_usuario: parseInt(userId),
        titulo: title,
        conteudo: content,
        categoria: category,
        tags: tags
    };

    // Adicionar imagem apenas se existir
    if (imageBase64) {
        storyData.imagem_capa = imageBase64;
    }

    console.log('📤 Dados que serão enviados:', {
        ...storyData,
        imagem_capa: imageBase64 ? `[IMAGEM: ${imageBase64.length} caracteres]` : 'null'
    });

    try {
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/historias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(storyData)
        });

        if (response.ok) {
            const newStory = await response.json();
            console.log('✅ História criada com sucesso:', newStory);
            showNotification('✅ História publicada com sucesso!', 'success');
            addNewStoryToFeed(newStory);
            closeModal();
        } else {
            const errorText = await response.text();
            console.error('❌ Erro do servidor:', response.status, errorText);
            showNotification(`❌ Erro ao publicar: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('❌ Erro de rede ao criar história:', error);
        showNotification('❌ Erro de conexão ao publicar história', 'error');
    } finally {
        isCreatingPost = false;
    }
}

// ===== CARREGAMENTO DE POSTAGENS/HISTÓRIAS =====

function debugDOM() {
    console.log('🔍 DEBUG DOM:');
    console.log('📍 Elemento .content:', document.querySelector('.content'));
    console.log('📍 Elemento #userButton:', document.getElementById('userButton'));
    console.log('📍 Elemento #fabButton:', document.getElementById('fabButton'));
    console.log('📍 Elemento #postCreationModal:', document.getElementById('postCreationModal'));
    console.log('📍 Todos os elementos com classe "post":', document.querySelectorAll('.post').length);
    console.log('📍 HTML do .content:', document.querySelector('.content')?.innerHTML?.substring(0, 200) + '...');
}

async function loadPosts() {
    try {
        console.log('📚 Iniciando carregamento de histórias...');

        debugDOM();
        
        const baseUrl = ApiConfig.getBaseUrl();
        console.log('🌐 URL base definitiva:', baseUrl);
        
        // Testar primeiro se o servidor está respondendo
        console.log('🔍 Testando conexão com o servidor...');
        const testResponse = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!testResponse.ok) {
            throw new Error(`Servidor não está respondendo: ${testResponse.status}`);
        }
        
        console.log('✅ Servidor está respondendo, carregando histórias...');
        
        const response = await ApiConfig.fetch('/historias', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const historias = await response.json();
        console.log(`✅ ${historias.length} histórias carregadas com sucesso`);
        
        allPosts = historias;
        renderPosts(historias);
        
        return historias;
        
    } catch (error) {
        console.error('❌ Erro ao carregar histórias:', error);
        
        // Mostrar erro específico para o usuário
        let errorMessage = 'Erro ao carregar histórias';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '❌ Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('404')) {
            errorMessage = '❌ Servidor indisponível no momento. Tente novamente mais tarde.';
        } else if (error.message.includes('CORS')) {
            errorMessage = '❌ Erro de configuração do servidor.';
        }
        
        showNotification(errorMessage, 'error');
        
        // Carregar dados de exemplo como fallback
        loadSampleData();
        
        return [];
    }
}

// Função de fallback com dados de exemplo
function loadSampleData() {
    console.log('📝 Carregando dados de exemplo...');
    
    const samplePosts = [
        {
            id_historia: 1,
            id: 1,
            titulo: "Bem-vindo ao Aranduá!",
            conteudo: "Esta é uma história de exemplo enquanto configuramos a conexão com o servidor. Em breve você verá as histórias reais aqui!",
            categoria: "outros",
            id_usuario: 1,
            autor: "Sistema",
            num_curtidas: 5,
            data_criacao: new Date().toISOString(),
            imagem_capa: null
        },
        {
            id_historia: 2,
            id: 2,
            titulo: "Como usar a plataforma",
            conteudo: "Clique no botão '+' para criar sua primeira história. Você pode filtrar por categorias e interagir com as histórias de outros usuários.",
            categoria: "conhecimentos", 
            id_usuario: 1,
            autor: "Sistema",
            num_curtidas: 3,
            data_criacao: new Date().toISOString(),
            imagem_capa: null
        }
    ];
    
    allPosts = samplePosts;
    renderPosts(samplePosts);
    showNotification('📝 Modo demonstração: dados de exemplo carregados', 'info');
}

// ===== RENDERIZAÇÃO =====

function debugDataAttributes() {
    console.log('🔍 DEBUG: Verificando data attributes...');
    
    const posts = document.querySelectorAll('.post, .story-item');
    console.log(`📊 Total de posts encontrados: ${posts.length}`);
    
    posts.forEach((post, index) => {
        const postId = post.dataset.postId;
        const likeBtn = post.querySelector('.like-btn');
        const commentBtn = post.querySelector('.comment-btn');
        
        console.log(`📝 Post ${index + 1}:`, {
            element: post.className,
            postId: postId,
            likeBtnHasId: likeBtn ? likeBtn.dataset.postId : 'N/A',
            commentBtnHasId: commentBtn ? commentBtn.dataset.postId : 'N/A',
            commentsSection: document.getElementById(`comments-${postId}`) ? 'EXISTS' : 'MISSING'
        });
    });
}

function renderPosts(postagens) {
    console.log('🎨 DEBUG: Renderizando posts...', postagens);
    
    const contentArea = document.querySelector('.content');
    if (!contentArea) {
        console.error('❌ Área de conteúdo não encontrada para renderização');
        // Tentar encontrar alternativas
        const alternatives = document.querySelector('main, body');
        if (alternatives) {
            console.log('🔄 Usando elemento alternativo:', alternatives.tagName);
            renderPostsToElement(postagens, alternatives);
        }
        return;
    }

    console.log('✅ Área de conteúdo encontrada, limpando...');
    clearPostContent();

    if (!postagens || postagens.length === 0) {
        console.log('📭 Nenhuma postagem para renderizar');
        showEmptyMessage();
        return;
    }

    console.log(`🖼️ Renderizando ${postagens.length} postagem(ns)`);
    
    const hasStories = postagens.some(post => post.titulo);
    console.log('📖 Tem histórias?', hasStories);
    
    if (hasStories) {
        renderStories(postagens);
    } else {
        renderSimplePosts(postagens);
    }
    
    // DEBUG: Verificar resultado
    setTimeout(() => {
        debugDataAttributes();
    }, 500);
}

function renderStories(historias) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;

    // DEBUG: Verificar as histórias antes de renderizar
    debugStories(historias);

    historias.forEach(historia => {
        const storyElement = createStoryElement(historia);
        contentArea.appendChild(storyElement);
    });
}

function renderSimpleAvatar(element, user, size = 'normal') {
    if (!element) {
        console.warn('⚠️ Elemento do avatar não existe');
        return;
    }
    
    console.log('🎯 Renderizando avatar SIMPLES:', {
        temElemento: !!element,
        user: user,
        temNome: !!user?.nome,
        temFoto: !!user?.foto_perfil
    });
    
    // 🎯 CORREÇÃO: Dados mínimos garantidos
    const userName = user?.nome || 'Usuário';
    const userFoto = user?.foto_perfil || user?.foto_perfil_autor || user?.ft_perfil;
    
    // 🎯 CORREÇÃO: Avatar padrão SEMPRE funciona
    const initials = userName.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const colorIndex = user?.id ? user.id % colors.length : Math.floor(Math.random() * colors.length);
    
    // Tamanhos
    const sizePx = size === 'x-small' ? '24px' : size === 'small' ? '32px' : '40px';
    const fontSize = size === 'x-small' ? '10px' : size === 'small' ? '12px' : '14px';
    
    // 🎯 CORREÇÃO: Tentar imagem apenas se existir realmente
    if (userFoto && userFoto.length > 10) {
        let imageUrl = userFoto;
        
        // Garantir que base64 tem prefixo
        if (userFoto.length > 100 && !userFoto.startsWith('data:')) {
            imageUrl = `data:image/jpeg;base64,${userFoto}`;
        }
        
        console.log('🖼️ Tentando carregar imagem do avatar:', imageUrl.substring(0, 30) + '...');
        
        element.innerHTML = `
            <img src="${imageUrl}" alt="${userName}" 
                 style="width: ${sizePx}; height: ${sizePx}; border-radius: 50%; object-fit: cover;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display: none; width: ${sizePx}; height: ${sizePx}; border-radius: 50%; background: ${colors[colorIndex]}; 
                       display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${fontSize};">
                ${initials}
            </div>
        `;
    } else {
        // 🎯 CORREÇÃO: Avatar padrão direto
        console.log('📝 Usando avatar padrão para:', userName);
        element.innerHTML = `
            <div style="width: ${sizePx}; height: ${sizePx}; border-radius: 50%; background: ${colors[colorIndex]}; 
                       display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${fontSize};">
                ${initials}
            </div>
        `;
    }
}

// 🎯 NOVA FUNÇÃO: Avatar padrão para fallback
function showFallbackAvatar(element, user, size = 'normal') {
    const initials = user?.nome ? user.nome.charAt(0).toUpperCase() : 'U';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const colorIndex = user?.id ? user.id % colors.length : Math.floor(Math.random() * colors.length);
    
    // 🎯 CORREÇÃO: Tamanhos específicos para comentários
    const sizes = {
        'x-small': { size: '24px', fontSize: '10px' },
        'small': { size: '32px', fontSize: '12px' },
        'normal': { size: '40px', fontSize: '14px' },
        'large': { size: '48px', fontSize: '16px' }
    };
    
    const { size: pxSize, fontSize } = sizes[size] || sizes.normal;
    
    element.innerHTML = `
        <div style="
            width: ${pxSize}; 
            height: ${pxSize}; 
            border-radius: 50%; 
            background: ${colors[colorIndex]}; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold;
            font-size: ${fontSize};
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
            ${initials}
        </div>
    `;
    console.log('✅ Avatar padrão criado com iniciais:', initials);
}

// 🎯 NOVA FUNÇÃO: Buscar imagem específica para comentários
function getProfileImageForComment(user) {
    if (!user) {
        console.log('❌ Usuário não definido em getProfileImageForComment');
        return null;
    }
    
    console.log('🔍 Buscando imagem para comentário:', user.nome);
    
    // 🎯 CORREÇÃO: Tentar em ordem de prioridade para comentários
    const foto = user.foto_perfil || user.foto_perfil_autor || user.ft_perfil || user.imagem_perfil || user.avatar;
    
    if (!foto) {
        console.log('📭 Nenhuma foto encontrada para o usuário nos comentários');
        return null;
    }
    
    // 🎯 CORREÇÃO: Verificar se é uma URL válida
    if (foto.startsWith('http') || foto.startsWith('data:')) {
        console.log('✅ Imagem URL encontrada para comentário');
        return foto;
    }
    
    // 🎯 CORREÇÃO: Se é base64, garantir o prefixo
    if (foto.length > 100 && !foto.startsWith('data:')) {
        console.log('✅ Imagem base64 encontrada, adicionando prefixo');
        return `data:image/jpeg;base64,${foto}`;
    }
    
    // 🎯 CORREÇÃO: Se parece ser base64 mas tem prefixo errado
    if (foto.length > 100 && foto.startsWith('data:')) {
        console.log('✅ Imagem base64 com prefixo já');
        return foto;
    }
    
    console.log('❌ Formato de imagem não reconhecido para comentário:', foto.substring(0, 50));
    return null;
}

function createStoryElement(historia) {
    console.log('🛠️ Criando elemento para história:', historia.id_historia || historia.id);
    console.log('   📋 Tags recebidas:', historia.tags);
    
    const storyElement = document.createElement('div');
    storyElement.className = 'post chat-item message-bubble story-item';
    storyElement.dataset.postId = historia.id_historia || historia.id;

    const isAuthor = currentUser && currentUser.id == historia.id_usuario;
    const category = historia.categoria || 'outros';
    const postId = historia.id_historia || historia.id;
    storyElement.dataset.postId = postId;
    
    // ===== PROCESSAMENTO DAS TAGS - VERSÃO MAIS ROBUSTA =====
    let tags = [];
    
    if (historia.tags) {
        console.log('   🔍 Processando tags...');
        
        if (typeof historia.tags === 'string') {
            // Se for string, tentar diferentes métodos de parsing
            const rawTags = historia.tags.trim();
            
            if (rawTags.startsWith('[') && rawTags.endsWith(']')) {
                // Tentar parsear como JSON array
                try {
                    tags = JSON.parse(rawTags)
                        .map(t => String(t).trim())
                        .filter(t => t && t !== 'null' && t !== 'undefined' && t !== '');
                    console.log('   ✅ Tags parseadas como JSON:', tags);
                } catch (e) {
                    console.log('   ❌ Falha ao parsear JSON, usando split por vírgula');
                    tags = rawTags.replace(/[\[\]"]/g, '') // Remove colchetes e aspas
                                 .split(',')
                                 .map(t => t.trim())
                                 .filter(t => t && t !== 'null' && t !== 'undefined');
                }
            } else {
                // Split simples por vírgula
                tags = rawTags.split(',')
                             .map(t => t.trim())
                             .filter(t => t && t !== 'null' && t !== 'undefined');
                console.log('   ✅ Tags parseadas com split:', tags);
            }
        } else if (Array.isArray(historia.tags)) {
            // Se já for array
            tags = historia.tags.map(t => String(t).trim())
                               .filter(t => t && t !== 'null' && t !== 'undefined');
            console.log('   ✅ Tags como array processado:', tags);
        } else {
            console.log('   ❌ Tipo de tags não reconhecido:', typeof historia.tags);
        }
    } else {
        console.log('   📭 Nenhuma tag encontrada na história');
    }
    
    console.log('   🎯 Tags finais:', tags);

    const imagemData = historia.imagem_capa || historia.imagem;
    let imageUrl = null;

    if (imagemData) {
        imageUrl = getImageUrl(imagemData);
    }

    let imageHTML = '';
    if (imageUrl) {
        imageHTML = `
            <div class="story-image">
                <img src="${imageUrl}" alt="Capa da história: ${historia.titulo}" />
            </div>
        `;
    }

    // ===== GERAR HTML DAS TAGS =====
    let tagsHTML = '';
    if (tags && tags.length > 0) {
        const tagsContent = tags.map(tag => {
            // Limpar a tag - remover # duplicados e espaços
            const cleanTag = tag.replace(/^#+/, '').trim();
            if (!cleanTag) return '';
            
            return `<span class="story-tag" data-tag="${cleanTag}">#${cleanTag}</span>`;
        }).filter(tag => tag !== '').join('');
        
        if (tagsContent) {
            tagsHTML = `
                <div class="story-tags">
                    ${tagsContent}
                </div>
            `;
            console.log('   ✅ HTML das tags gerado');
        } else {
            console.log('   📭 Nenhuma tag válida após limpeza');
        }
    } else {
        console.log('   📭 Nenhuma tag para exibir');
    }

    // ===== HTML COMPLETO DA HISTÓRIA =====
     storyElement.innerHTML = `
        <div class="story-header">
            <div class="bubble-header">
                <div class="user-info-group">
                    <div class="avatar" data-user-id="${historia.id_usuario}">
                        <!-- Avatar será preenchido pelo JavaScript -->
                    </div>
                    <span class="username">${historia.autor || 'Usuário'}</span>
                </div>
                ${isAuthor ? '<button type="button" class="btn-deletar">🗑️ Deletar</button>' : ''}
            </div>
            
            <div class="story-meta">
                <span class="story-category ${category}">${getCategoryDisplayName(category)}</span>
                ${historia.tempo_leitura ? `<span class="reading-time">⏱️ ${historia.tempo_leitura} min</span>` : ''}
            </div>
        </div>
        
        <h3 class="story-title">${historia.titulo || 'História sem título'}</h3>

        ${imageHTML}
        
        <div class="story-content">
            <p>${historia.conteudo || ''}</p>
        </div>
        
        ${tagsHTML}
        
        <div class="post-actions">
            <button type="button" class="action-btn like-btn" data-post-id="${historia.id_historia || historia.id}">
                <span class="like-icon">🤍</span>
                <span class="like-count">${historia.num_curtidas || 0}</span>
            </button>
            
            <button type="button" class="action-btn comment-btn" data-post-id="${historia.id_historia || historia.id}">
                <span class="comment-icon">💬</span>
                <span class="comment-text">Comentar</span>
            </button>
        </div>
        
        <!-- 🎯 CORREÇÃO: Estrutura corrigida da seção de comentários -->
        <div class="comments-section" id="comments-${historia.id_historia || historia.id}" style="display: none;">
            <div class="comments-list">
                <!-- Comentários serão carregados aqui -->
            </div>
            <div class="add-comment">
                <textarea class="comment-input" placeholder="Escreva um comentário..." rows="2"></textarea>
                <button type="button" class="submit-comment" data-post-id="${historia.id_historia || historia.id}">
                    Comentar
                </button>
            </div>
        </div>
    `;

    // DEBUG: Verificar se o HTML foi inserido
    console.log('   📄 HTML gerado contém tags?', storyElement.innerHTML.includes('story-tags'));
    console.log('   📄 Conteúdo das tags no HTML:', storyElement.querySelector('.story-tags')?.innerHTML || 'NÃO ENCONTRADO');

    const avatarElement = storyElement.querySelector('.avatar');
    renderSimpleAvatar(avatarElement, { 
        id: historia.id_usuario, 
        nome: historia.autor,
        foto_perfil: historia.foto_perfil_autor 
    });
    const likeBtn = storyElement.querySelector('.like-btn');
    const commentBtn = storyElement.querySelector('.comment-btn');
    const submitCommentBtn = storyElement.querySelector('.submit-comment');
    
    if (likeBtn) likeBtn.dataset.postId = postId;
    if (commentBtn) commentBtn.dataset.postId = postId;
    if (submitCommentBtn) submitCommentBtn.dataset.postId = postId;

    return storyElement;
}

// Função de debug para verificar as histórias
function debugStories(historias) {
    console.log('🔍 DEBUG: Analisando estruturas das histórias:');
    historias.forEach((historia, index) => {
        console.log(`📖 História ${index + 1}:`, {
            id: historia.id_historia || historia.id,
            titulo: historia.titulo,
            tags: historia.tags,
            tipoTags: typeof historia.tags,
            temTags: !!historia.tags,
            tagsLength: historia.tags ? historia.tags.length : 0
        });
        
        // Verificar se há tags e como estão formatadas
        if (historia.tags) {
            console.log('   📋 Conteúdo das tags:', historia.tags);
            
            if (typeof historia.tags === 'string') {
                const parsedTags = historia.tags.split(',').map(t => t.trim()).filter(t => t);
                console.log('   🎯 Tags parseadas:', parsedTags);
            } else if (Array.isArray(historia.tags)) {
                console.log('   🎯 Tags como array:', historia.tags);
            }
        }
    });
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post chat-item message-bubble';
    postElement.dataset.postId = post.id_historia;

    const isAuthor = currentUser && currentUser.id == post.id_usuario;

    postElement.innerHTML = `
        <div class="bubble-header">
            <div class="user-info-group">
                <div class="avatar" data-user-id="${post.id_usuario}">
                    <!-- Avatar será preenchido pelo JavaScript -->
                </div>
                <span class="username">${post.autor || 'Usuário'}</span>
            </div>
            ${isAuthor ? '<button type="button" class="btn-deletar">🗑️ Deletar</button>' : ''}
        </div>
        
        <p class="message-text">${post.conteudo || ''}</p>
        
        ${post.imagem_capa ? `
            <div class="post-image">
                <img src="data:image/jpeg;base64,${post.imagem_capa}" alt="Imagem da história" />
            </div>
        ` : ''}
        
        <div class="post-actions">
            <button type="button" class="action-btn like-btn" data-post-id="${post.id_historia}">
                <span class="like-icon">🤍</span>
                <span class="like-count">${post.num_curtidas || 0}</span>
            </button>
            
            <button type="button" class="action-btn comment-btn" data-post-id="${post.id_historia}">
                <span class="comment-icon">💬</span>
                <span class="comment-text">Comentar</span>
            </button>
        </div>
        
        <div class="comments-section" id="comments-${post.id_historia}" style="display: none;">
            <div class="comments-list"></div>
            <div class="add-comment">
                <textarea class="comment-input" placeholder="Escreva um comentário..." rows="2"></textarea>
                <button type="button" class="submit-comment" data-post-id="${post.id_historia}">
                    Comentar
                </button>
            </div>
        </div>
    `;

    const avatarElement = postElement.querySelector('.avatar');
    renderSimpleAvatar(avatarElement, { 
        id: post.id_usuario, 
        nome: post.autor,
        foto_perfil: post.foto_perfil_autor 
    });

    return postElement;
}

// ===== CORREÇÃO DOS AVATARES =====
function renderSimpleAvatar(element, user, size = 'normal') {
    if (!element) {
        console.error('❌ Elemento do avatar não existe');
        return;
    }
    
    console.log('🖼️ Renderizando avatar:', {
        user: user,
        temNome: !!user?.nome,
        temFoto: !!user?.foto_perfil,
        size: size
    });
    
    // 🎯 CORREÇÃO: Buscar a imagem de forma mais agressiva
    const imageUrl = getProfileImage(user);
    
    if (imageUrl) {
        console.log('✅ Carregando imagem do avatar:', imageUrl.substring(0, 50) + '...');
        element.innerHTML = `<img src="${imageUrl}" alt="${user.nome || 'Usuário'}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" 
                             onerror="this.style.display='none'" />`;
    } else {
        // 🎯 CORREÇÃO: Avatar padrão MELHORADO
        const initials = user?.nome ? user.nome.charAt(0).toUpperCase() : 'U';
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const colorIndex = user?.id ? user.id % colors.length : 0;
        
        element.innerHTML = `
            <div style="
                width: 100%; 
                height: 100%; 
                border-radius: 50%; 
                background: ${colors[colorIndex]}; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold;
                font-size: ${size === 'x-small' ? '10px' : size === 'small' ? '12px' : '14px'};
            ">
                ${initials}
            </div>
        `;
        console.log('✅ Avatar padrão criado com iniciais:', initials);
    }
}

function renderAllCommentAvatars() {
    console.log('🔄 Renderizando todos os avatares dos comentários...');
    
    const avatarElements = document.querySelectorAll('[data-comment-avatar="true"]');
    console.log(`🔍 Encontrados ${avatarElements.length} avatares para renderizar`);
    
    avatarElements.forEach((avatarElement, index) => {
        const userId = avatarElement.dataset.userId;
        const commentElement = avatarElement.closest('.comment-item');
        
        if (commentElement) {
            // 🎯 CORREÇÃO: Tentar obter dados do usuário do elemento de comentário
            const authorElement = commentElement.querySelector('.comment-author');
            const authorName = authorElement ? authorElement.textContent.trim() : 'Usuário';
            
            const userData = {
                id: userId,
                nome: authorName,
                // 🎯 CORREÇÃO: Buscar foto de perfil de atributos data
                foto_perfil: commentElement.dataset.userAvatar || null
            };
            
            // 🎯 CORREÇÃO: Determinar tamanho baseado na classe
            const sizeClass = avatarElement.className.includes('x-small') ? 'x-small' : 
                            avatarElement.className.includes('small') ? 'small' : 'normal';
            
            console.log(`🖼️ Renderizando avatar ${index + 1}:`, {
                userId: userId,
                author: authorName,
                size: sizeClass
            });
            
            renderSimpleAvatar(avatarElement, userData, sizeClass);
        }
    });
    
    console.log('✅ Todos os avatares dos comentários renderizados');
}

function getProfileImage(user) {
    if (!user) {
        console.log('❌ Usuário não definido em getProfileImage');
        return null;
    }
    
    console.log('🔍 Buscando imagem para:', user.nome);
    
    // Tentar em ordem de prioridade
    const foto = user.foto_perfil || user.foto_perfil_autor || user.ft_perfil || user.imagem_perfil;
    
    if (!foto) {
        console.log('📭 Nenhuma foto encontrada para o usuário');
        return null;
    }
    
    if (foto.startsWith('http') || foto.startsWith('data:')) {
        console.log('✅ Imagem URL encontrada');
        return foto;
    }
    
    if (foto.length > 100) {
        console.log('✅ Imagem base64 encontrada');
        return `data:image/jpeg;base64,${foto}`;
    }
    
    console.log('❌ Formato de imagem não reconhecido:', foto.substring(0, 50));
    return null;
}

function getImageUrl(imageData) {
    if (!imageData) {
        return null;
    }

    if (imageData.startsWith('http')) {
        return imageData;
    }

    if (imageData.startsWith('data:')) {
        return imageData;
    }

    if (imageData.length > 100) {
        return `data:image/jpeg;base64,${imageData}`;
    }

    return null;
}

// ===== CORREÇÃO DO FILTRO POR CATEGORIA =====
function setupCategoryFilter() {
    const filterToggle = document.getElementById('categoryFilterToggle');
    const filterOptions = document.getElementById('categoryFilterOptions');
    const applyFilterBtn = document.getElementById('applyFilterBtn');

    if (filterToggle && filterOptions) {
        loadCategories();
        
        filterToggle.addEventListener('click', function(e) {
            e.preventDefault(); // ✅ ADICIONAR
            e.stopPropagation();
            filterOptions.classList.toggle('hidden');
        });

        // Event listener para aplicar filtro
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', function(e) {
                e.preventDefault(); // ✅ ADICIONAR
                e.stopPropagation();
                applyCategoryFilters();
            });
        }

        // Event listener para checkboxes
        setTimeout(() => {
            const categoryCheckboxes = document.getElementById('categoryCheckboxes');
            if (categoryCheckboxes) {
                categoryCheckboxes.addEventListener('change', function(e) {
                    if (e.target.type === 'checkbox') {
                        const category = e.target.value;
                        const isChecked = e.target.checked;
                        
                        if (isChecked) {
                            if (!selectedCategories.includes(category)) {
                                selectedCategories.push(category);
                            }
                        } else {
                            selectedCategories = selectedCategories.filter(cat => cat !== category);
                        }
                        
                        updateActiveCategoriesDisplay();
                    }
                });
            }
        }, 100);

    } else {
        console.error('❌ Elementos do filtro de categoria não encontrados');
    }
}

function loadCategories() {
    console.log('📂 Carregando categorias...');
    
    allCategories = [
        { id: 1, nome: 'criaturas', icone: '📖', cor: '#4CAF50' },
        { id: 2, nome: 'festas', icone: '🎉', cor: '#9C27B0' },
        { id: 3, nome: 'conhecimentos', icone: '🧠', cor: '#2196F3' },
        { id: 4, nome: 'costumes', icone: '👥', cor: '#FF9800' },
        { id: 5, nome: 'historia', icone: '🏛️', cor: '#795548' },
        { id: 6, nome: 'arte', icone: '🎨', cor: '#E91E63' },
        { id: 7, nome: 'culinaria', icone: '🍲', cor: '#FF5722' },
        { id: 8, nome: 'outros', icone: '📌', cor: '#607D8B' }
    ];
    
    renderCategoryCheckboxes();
    console.log(`✅ ${allCategories.length} categorias carregadas`);
}

function renderCategoryCheckboxes() {
    const container = document.getElementById('categoryCheckboxes');
    
    if (!container) {
        console.error('❌ Container de categorias não encontrado');
        return;
    }
    
    if (!allCategories || allCategories.length === 0) {
        container.innerHTML = '<div class="no-categories">Nenhuma categoria disponível</div>';
        return;
    }
    
    const checkboxesHTML = allCategories.map(categoria => {
        const nome = categoria.nome || 'unknown';
        const icone = categoria.icone || '📁';
        const displayName = getCategoryDisplayName(nome);
        
        return `
            <label class="category-checkbox">
                <input type="checkbox" value="${nome}" ${selectedCategories.includes(nome) ? 'checked' : ''}>
                <span class="category-icon">${icone}</span>
                <span class="category-name">${displayName}</span>
            </label>
        `;
    }).join('');
    
    container.innerHTML = checkboxesHTML;
    
    // Adicionar event listeners para as checkboxes
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const category = this.value;
            if (this.checked) {
                if (!selectedCategories.includes(category)) {
                    selectedCategories.push(category);
                }
            } else {
                selectedCategories = selectedCategories.filter(cat => cat !== category);
            }
        });
    });
}

function applyCategoryFilters() {
    const filterOptions = document.getElementById('categoryFilterOptions');
    if (filterOptions) {
        filterOptions.classList.add('hidden');
    }
    
    console.log('🔍 Aplicando filtros para categorias:', selectedCategories);
    
    // Atualizar display antes de aplicar filtros
    updateActiveCategoriesDisplay();
    
    if (selectedCategories.length === 0) {
        renderPosts(allPosts);
        showNotification('📚 Mostrando todas as categorias', 'success');
    } else {
        filterPostsLocally();
    }
}

function filterPostsLocally() {
    if (!allPosts || allPosts.length === 0) {
        showNotification('Nenhuma história para filtrar', 'info');
        return;
    }
    
    const filtered = allPosts.filter(post => 
        selectedCategories.includes(post.categoria)
    );
    
    console.log(`📊 Filtro local: ${filtered.length} de ${allPosts.length} histórias`);
    
    if (filtered.length === 0) {
        showNotification('Nenhuma história encontrada nas categorias selecionadas', 'info');
    } else {
        showNotification(`📚 ${filtered.length} história(s) encontrada(s) em ${selectedCategories.length} categoria(s)`, 'success');
    }
    
    renderPosts(filtered);
}

function removeCategory(category) {
    selectedCategories = selectedCategories.filter(cat => cat !== category);
    
    const checkbox = document.querySelector(`input[value="${category}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    applyCategoryFilters();
}

function getCategoryDisplayName(category) {
    const categoria = allCategories.find(c => c.nome === category);
    
    if (categoria && categoria.nome) {
        return categoria.nome.charAt(0).toUpperCase() + categoria.nome.slice(1);
    }
    
    const fallbackMap = {
        'criaturas': 'Criaturas',
        'festas': 'Festas', 
        'conhecimentos': 'Conhecimentos',
        'costumes': 'Costumes',
        'historia': 'História',
        'arte': 'Arte',
        'culinaria': 'Culinária',
        'outros': 'Outros'
    };
    
    return fallbackMap[category] || category;
}

// ===== FUNÇÕES PARA CATEGORIAS ATIVAS =====

function updateActiveCategoriesDisplay() {
    const activeCategoriesContainer = document.getElementById('activeCategories');
    const filterToggle = document.getElementById('categoryFilterToggle');
    
    if (!activeCategoriesContainer || !filterToggle) {
        console.log('❌ Elementos do display de categorias ativas não encontrados');
        return;
    }
    
    // Limpar container
    activeCategoriesContainer.innerHTML = '';
    
    if (selectedCategories.length === 0) {
        // Mostrar texto padrão quando não há categorias selecionadas
        activeCategoriesContainer.innerHTML = `
            <span class="filter-placeholder">Todas as categorias</span>
        `;
        
        // Atualizar texto do botão de filtro
        const filterText = filterToggle.querySelector('.filter-text');
        if (filterText) {
            filterText.textContent = 'Filtrar por Categoria';
        }
        
        return;
    }
    
    // Adicionar badge para cada categoria selecionada
    selectedCategories.forEach(category => {
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'active-category-badge';
        categoryBadge.innerHTML = `
            ${getCategoryDisplayName(category)}
            <button type="button" class="remove-category-btn" onclick="removeCategory('${category}')">
                ✕
            </button>
        `;
        activeCategoriesContainer.appendChild(categoryBadge);
    });
    
    // Atualizar texto do botão de filtro
    const filterText = filterToggle.querySelector('.filter-text');
    if (filterText) {
        filterText.textContent = `Filtrando (${selectedCategories.length})`;
    }
    
    console.log('✅ Display de categorias atualizado:', selectedCategories);
}

// ===== FUNÇÃO PARA CRIAR ELEMENTOS DE PESQUISA =====

function createSearchElements() {
    const header = document.querySelector('header, .header, .top-bar');
    
    if (!header) {
        console.error('❌ Cabeçalho não encontrado para adicionar pesquisa');
        return;
    }
    
    const searchHTML = `
        <div class="search-container" style="margin: 10px 0;">
            <div class="search-box" style="display: flex; align-items: center; background: white; border-radius: 20px; padding: 5px 15px; border: 1px solid #ddd; max-width: 400px; margin: 0 auto;">
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Buscar histórias, autores, categorias..."
                    style="flex: 1; border: none; outline: none; padding: 8px 0; font-size: 14px;"
                >
                <button type="button" id="searchClearBtn" class="hidden" style="background: none; border: none; cursor: pointer; padding: 5px; margin-right: 5px; color: #666;">
                    ✕
                </button>
                <button type="button" id="searchActionBtn" style="background: none; border: none; cursor: pointer; padding: 5px; color: var(--primary-brown);">
                    🔍
                </button>
            </div>
        </div>
    `;
    
    header.insertAdjacentHTML('beforeend', searchHTML);
    console.log('✅ Elementos de pesquisa criados dinamicamente');
}

// Removido bloco solto que causava ReferenceError (foi retirado)

// ===== NOVA FUNÇÃO: setupSearch =====
function setupSearch() {
	// aguarda elementos que podem ser inseridos dinamicamente
	setTimeout(() => {
		const searchInput = document.getElementById('searchInput');
		const searchClearBtn = document.getElementById('searchClearBtn');
		const searchActionBtn = document.getElementById('searchActionBtn');

		console.log('🔍 setupSearch elementos:', {
			searchInput: !!searchInput,
			searchClearBtn: !!searchClearBtn,
			searchActionBtn: !!searchActionBtn
		});

		if (!searchInput) {
			// fallback: tentar configurar via seletor alternativo depois
			console.warn('⚠️ Input de pesquisa não encontrado no DOM. SetupSearch abortado.');
			setupSearchFallback();
			return;
		}

		let searchTimeout = null;

		function updateClearVisibility() {
			if (!searchClearBtn) return;
			if (searchInput.value.trim().length > 0) searchClearBtn.classList.remove('hidden');
			else searchClearBtn.classList.add('hidden');
		}

		searchInput.addEventListener('input', function (e) {
			const term = e.target.value.trim();
			updateClearVisibility();

			clearTimeout(searchTimeout);
			if (term.length === 0) {
				restoreFullFeed();
				return;
			}
			if (term.length < 2) return;

			searchTimeout = setTimeout(() => performSearch(term), 450);
		});

		if (searchClearBtn) {
			searchClearBtn.addEventListener('click', function (e) {
				e.preventDefault(); e.stopPropagation();
				searchInput.value = '';
				updateClearVisibility();
				searchInput.focus();
				restoreFullFeed();
			});
		}

		if (searchActionBtn) {
			searchActionBtn.addEventListener('click', async function (e) {
				e.preventDefault(); e.stopPropagation();
				const term = searchInput.value.trim();
				if (term) await performSearch(term);
			});
		}

		searchInput.addEventListener('keypress', async function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				const term = searchInput.value.trim();
				if (term) await performSearch(term);
			}
		});
	}, 100);
}

// Fallback caso os elementos não sejam encontrados pelos IDs
function setupSearchFallback() {
    console.log('🔄 Tentando configuração alternativa de pesquisa...');
    
    // Tentar encontrar elementos por classe ou outros atributos
    const searchInput = document.querySelector('input[type="text"]');
    const searchClearBtn = document.querySelector('.search-clear-btn, .clear-btn');
    const searchActionBtn = document.querySelector('.search-action-btn, .search-btn');
    
    if (searchInput) {
        console.log('✅ Input de pesquisa encontrado via seletor alternativo');
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (term.length < 2) {
                if (term.length === 0) {
                    restoreFullFeed();
                }
                return;
            }
            
            searchTimeout = setTimeout(() => {
                performSearch(term);
            }, 500);
        });
        
        searchInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const term = searchInput.value.trim();
                if (term) {
                    await performSearch(term);
                }
            }
        });
        
        // Se encontrou o botão de ação, adicionar evento
        if (searchActionBtn) {
            searchActionBtn.addEventListener('click', async function() {
                const term = searchInput.value.trim();
                if (term) {
                    await performSearch(term);
                }
            });
        }
        
    } else {
        console.warn('⚠️ Sistema de pesquisa não pôde ser configurado');
        showNotification('⚠️ Funcionalidade de pesquisa não disponível', 'info');
    }
}

async function performSearch(searchTerm) {
    console.log('🔍 Executando pesquisa:', searchTerm);
    
    try {
        if (!allPosts || allPosts.length === 0) {
            console.log('📭 Nenhuma história disponível para pesquisa');
            showNotification('📭 Nenhuma história disponível para pesquisa', 'info');
            return;
        }
        
         const contentArea = document.querySelector('.content');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="search-loading" style="text-align: center; padding: 60px 20px;">
                    <p style="color: var(--text-muted); font-size: 16px;">Buscando por "<strong>${searchTerm}</strong>"...</p>
                </div>
            `;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('📊 Total de posts para pesquisar:', allPosts.length);
        
        const resultados = allPosts.filter(post => {
            const searchLower = searchTerm.toLowerCase();
            const temTitulo = post.titulo && post.titulo.toLowerCase().includes(searchLower);
            const temConteudo = post.conteudo && post.conteudo.toLowerCase().includes(searchLower);
            const temAutor = post.autor && post.autor.toLowerCase().includes(searchLower);
            const temCategoria = post.categoria && post.categoria.toLowerCase().includes(searchLower);
            
            return temTitulo || temConteudo || temAutor || temCategoria;
        });
        
        console.log(`✅ ${resultados.length} resultado(s) encontrado(s)`);
        
        displaySearchResults(resultados, searchTerm);
        
    } catch (error) {
        console.error('❌ Erro na pesquisa:', error);
        showNotification('❌ Erro ao realizar pesquisa: ' + error.message, 'error');
        restoreFullFeed();
    }
}

function displaySearchResults(resultados, searchTerm) {
    const contentArea = document.querySelector('.content');
    if (!contentArea) {
        console.error('❌ Área de conteúdo não encontrada');
        return;
    }
    
    clearPostContent();
    
    if (resultados.length === 0) {
        contentArea.innerHTML = `
            <div class="no-results-message">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🔍</div>
                    <h3 style="color: var(--text-dark); margin-bottom: 10px; font-size: 24px;">
                        Nenhum resultado encontrado
                    </h3>
                    <p style="color: var(--text-muted); margin-bottom: 25px; font-size: 16px;">
                        Não encontramos nada para "<strong style="color: var(--primary-brown);">${searchTerm}</strong>"
                    </p>
                    <button type="button" onclick="restoreFullFeed()" class="clear-search-btn large">
                        <span style="margin-right: 8px;">↩️</span>
                        Voltar para todas as histórias
                    </button>
                </div>
            </div>
        `;
    } else {
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'search-results-header';
        resultsHeader.innerHTML = `
            <div class="results-info">
                <h3>🔍 ${resultados.length} resultado(s) para "${searchTerm}"</h3>
                <p class="results-subtitle">Encontramos essas histórias relacionadas à sua pesquisa</p>
            </div>
            <button type="button" onclick="restoreFullFeed()" class="clear-search-btn">
                <span>✕</span>
                Limpar pesquisa
            </button>
        `;
        contentArea.appendChild(resultsHeader);
        
        resultados.forEach(post => {
            try {
                const postElement = post.titulo ? createStoryElement(post) : createPostElement(post);
                highlightSearchTerms(postElement, searchTerm);
                contentArea.appendChild(postElement);
            } catch (error) {
                console.error('❌ Erro ao renderizar post:', error);
            }
        });
        
        showNotification(`✅ ${resultados.length} história(s) encontrada(s) para "${searchTerm}"`, 'success');
    }
    
    console.log('📊 Resultados exibidos com sucesso');
}

function highlightSearchTerms(element, searchTerm) {
    if (!element || !searchTerm) return;
    
    const searchLower = searchTerm.toLowerCase();
    const textElements = element.querySelectorAll('.story-title, .story-content, .message-text, .username');
    
    textElements.forEach(el => {
        const originalHTML = el.innerHTML;
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        const highlighted = originalHTML.replace(regex, '<mark class="search-highlight">$1</mark>');
        el.innerHTML = highlighted;
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== SISTEMA DE RESPOSTAS =====

async function handleReplyToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🔍 handleReplyToggle chamado');
    
    const replyBtn = event.target.closest('.reply-btn');
    if (!replyBtn) {
        console.error('❌ Botão de resposta não encontrado');
        return;
    }
    
    const commentId = replyBtn.dataset.commentId;
    console.log('💬 Toggle resposta para comentário:', commentId);
    
    if (!commentId) {
        console.error('❌ commentId não encontrado');
        return;
    }
    
    // 🎯 CORREÇÃO: Buscar a seção de resposta de forma mais robusta
    let replySection = document.getElementById(`reply-${commentId}`);
    
    if (!replySection) {
        console.log('🔄 Seção de resposta não encontrada pelo ID, tentando criar...');
        
        // Tentar encontrar o comentário primeiro
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            // Verificar se já existe uma seção de resposta no comentário
            replySection = commentElement.querySelector('.reply-section');
            
            if (!replySection) {
                console.log('📝 Criando seção de resposta dinamicamente...');
                // Criar a seção de resposta dinamicamente
                const newReplySection = document.createElement('div');
                newReplySection.className = 'reply-section';
                newReplySection.id = `reply-${commentId}`;
                newReplySection.style.display = 'none';
                
                // 🎯 CORREÇÃO: Garantir que o botão tenha o data-comment-id correto
                newReplySection.innerHTML = `
                    <div class="add-reply">
                        <textarea class="reply-input" placeholder="Escreva uma resposta..." rows="2"></textarea>
                        <div class="reply-buttons">
                            <button type="button" class="submit-reply" data-comment-id="${commentId}">
                                Responder
                            </button>
                            <button type="button" class="cancel-reply" data-comment-id="${commentId}">
                                Cancelar
                            </button>
                        </div>
                    </div>
                `;
                
                // Inserir após as ações do comentário
                const commentActions = commentElement.querySelector('.comment-actions');
                if (commentActions) {
                    commentActions.parentNode.insertBefore(newReplySection, commentActions.nextSibling);
                } else {
                    // Fallback: inserir no final do comentário
                    commentElement.appendChild(newReplySection);
                }
                
                replySection = newReplySection;
                console.log('✅ Seção de resposta criada dinamicamente');
            }
        }
    }
    
    if (!replySection) {
        console.error('❌ Não foi possível encontrar ou criar a seção de resposta');
        showNotification('❌ Erro: não foi possível acessar a seção de resposta', 'error');
        return;
    }
    
    if (replySection.style.display === 'none') {
        replySection.style.display = 'block';
        const replyInput = replySection.querySelector('.reply-input');
        if (replyInput) {
            replyInput.focus();
            // Auto-expand textarea
            replyInput.style.height = 'auto';
            replyInput.style.height = (replyInput.scrollHeight) + 'px';
        }
        console.log('✅ Seção de resposta aberta');
    } else {
        replySection.style.display = 'none';
        console.log('❌ Seção de resposta fechada');
    }
}

async function handleReplySubmit(event, commentId) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🔍 handleReplySubmit chamado com commentId:', commentId);
    
    if (!currentUser) {
        showNotification('🔒 Faça login para responder', 'error');
        return;
    }
    
    // 🎯 CORREÇÃO: Garantir que commentId existe
    if (!commentId) {
        console.error('❌ commentId é undefined no handleReplySubmit');
        showNotification('❌ Erro: ID do comentário não encontrado', 'error');
        return;
    }
    
    console.log('🎯 Processando resposta para comentário:', commentId);
    
    // 🎯 CORREÇÃO: Buscar a seção de resposta de forma mais robusta
    let replySection = document.getElementById(`reply-${commentId}`);
    
    if (!replySection) {
        console.log('🔄 Seção de resposta não encontrada pelo ID, tentando buscar pelo DOM...');
        
        // Tentar encontrar a seção de resposta de outras formas
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"][data-comment-type="main"]`);
        if (commentElement) {
            replySection = commentElement.querySelector('.reply-section');
            console.log('🔍 Seção encontrada via querySelector:', !!replySection);
        }
        
        if (!replySection) {
            console.error('❌ Seção de resposta não encontrada de nenhuma forma');
            showNotification('❌ Erro: seção de resposta não encontrada', 'error');
            return;
        }
    }
    
    const replyInput = replySection.querySelector('.reply-input');
    if (!replyInput) {
        console.error('❌ Campo de resposta não encontrado');
        return;
    }
    
    const replyText = replyInput.value.trim();
    
    console.log('📝 Texto da resposta:', replyText);
    
    // Validações
    if (!replyText) {
        showNotification('📝 Digite uma resposta', 'error');
        replyInput.focus();
        return;
    }
    
    if (replyText.length < 2) {
        showNotification('📝 A resposta precisa ter pelo menos 2 caracteres', 'error');
        replyInput.focus();
        return;
    }
    
    try {
        // Encontrar postId de forma robusta
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"][data-comment-type="main"]`);
        if (!commentElement) throw new Error('Comentário pai não encontrado');
        
        const commentsSection = commentElement.closest('.comments-section');
        if (!commentsSection) throw new Error('Seção de comentários não encontrada');
        
        const postId = commentsSection.id.replace('comments-', '');
        
        if (!postId) throw new Error('ID da história não encontrado');
        
        console.log('📤 Enviando resposta para o servidor:', {
            postId: postId,
            commentId: commentId,
            replyText: replyText,
            userId: currentUser.id
        });
        
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_historia: parseInt(postId),
                id_usuario: parseInt(currentUser.id),
                conteudo: replyText,
                id_comentario_pai: parseInt(commentId) // 🎯 ESSENCIAL: Marcar como resposta
            })
        });

        console.log('📡 Status da resposta:', response.status);

        if (response.ok) {
            const newReply = await response.json();
            console.log('✅ Resposta criada pelo servidor:', newReply);
            
            // 🎯 CORREÇÃO: Garantir que temos todos os dados necessários
            const replyData = {
                id_comentario: newReply.id,
                id_comentario_pai: parseInt(commentId), // Garantir que está marcado como resposta
                id_usuario: currentUser.id,
                conteudo: replyText,
                autor: currentUser.nome,
                data_comentario: new Date().toISOString(),
                num_curtidas: 0,
                isReply: true
            };
            
            // Adicionar a resposta à UI
            addNewReplyToUI(commentId, replyData);
            
            // Limpar e fechar
            replyInput.value = '';
            closeReplySection(commentId);
            
            showNotification('💬 Resposta adicionada!', 'success');
            
        } else {
            const errorText = await response.text();
            console.error('❌ Erro do servidor:', errorText);
            throw new Error(errorText || 'Erro ao enviar resposta');
        }
    } catch (error) {
        console.error('❌ Erro ao responder:', error);
        showNotification('❌ Erro ao responder: ' + error.message, 'error');
    }
}


// ===== FUNÇÕES UTILITÁRIAS =====

function formatCommentDate(dateString) {
    if (!dateString) return 'Agora';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours} h`;
        if (diffDays < 7) return `${diffDays} d`;
        
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return 'Agora';
    }
}

function preventLinkReload() {
    // Prevenir comportamento padrão em links que são botões
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href="#"], a[href="javascript:void(0)"]');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

function smoothUpdate(element, callback) {
    element.style.transition = 'all 0.3s ease';
    callback();
}

function updateElementWithAnimation(element, newContent) {
    smoothUpdate(element, () => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.innerHTML = newContent;
            element.style.opacity = '1';
        }, 300);
    });
}

function clearPostContent() {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;
    
    const elementsToRemove = contentArea.querySelectorAll(
        '.post, .empty-feed-message, .search-results-header, .no-results-message, .empty-state, .search-loading'
    );
    elementsToRemove.forEach(el => el.remove());

    if (contentArea.children.length === 0 && contentArea.innerHTML.includes('search-loading')) {
        contentArea.innerHTML = '';
    }
}

function restoreFullFeed() {
    console.log('🔄 Restaurando feed completo...');
    
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (searchClearBtn) {
        searchClearBtn.classList.add('hidden');
    }
    
    selectedCategories = [];
    updateActiveCategoriesDisplay();
    
    loadPosts();
}

function showEmptyMessage() {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;

    contentArea.innerHTML = '';
    
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-feed-message';
    emptyMessage.innerHTML = `
        <div class="empty-state">
            <h3>📭 Nenhuma história ainda</h3>
            <p>Seja o primeiro a compartilhar algo!</p>
            <button type="button" onclick="openModal()" class="test-button">
                ✍️ Criar Primeira História
            </button>
        </div>
    `;
    
    contentArea.appendChild(emptyMessage);
    
    ensureFabButton();
}

function ensureFabButton() {
    const contentArea = document.querySelector('.content');
    const fabButton = document.getElementById('fabButton');
    
    if (fabButton && !contentArea.contains(fabButton)) {
        contentArea.appendChild(fabButton);
    }
}

function handleButtonClick(button, originalEvent) {
    console.log('🔄 Processando botão:', button.className, button.id, button.dataset);
    
    // Mapeamento de botões para suas funções
    const buttonHandlers = {
        // ===== DROPDOWN USUÁRIO =====
        'userButton': () => {
            console.log('👤 Toggle dropdown usuário');
            toggleDropdown();
        },
        
        // ===== LIKES =====
        'like-btn': () => {
            const postId = button.dataset.postId;
            console.log('❤️ Curtida nuclear para post:', postId);
            if (postId) {
                handlePostLike(button, postId);
            } else {
                console.error('❌ postId não encontrado no botão like');
                showNotification('❌ Erro: ID da história não encontrado', 'error');
            }
        },
        
        // ===== COMENTÁRIOS =====
        'comment-btn': () => {
            const postId = button.dataset.postId;
            console.log('💬 Toggle comentários:', postId);
            if (postId) {
                handleCommentToggle(postId);
            } else {
                console.error('❌ postId não encontrado no botão comment');
            }
        },
        
        'submit-comment': () => {
            const postId = button.dataset.postId;
            console.log('📝 Enviar comentário:', postId);
            if (postId) {
                handleCommentSubmit(postId);
            } else {
                console.error('❌ postId não encontrado no botão submit-comment');
                showNotification('❌ Erro: ID da história não encontrado', 'error');
            }
        },
        
        // ===== MODAL CRIAÇÃO =====
        'fabButton': () => {
            console.log('📖 Abrir modal de criação');
            openModal();
        },
        
        'cancelPostBtn': () => {
            console.log('📖 Fechar modal de criação');
            closeModal();
        },
        
        // ===== CATEGORIAS =====
        'categoryFilterToggle': () => {
            console.log('🏷️ Toggle filtro de categorias');
            const filterOptions = document.getElementById('categoryFilterOptions');
            if (filterOptions) filterOptions.classList.toggle('hidden');
        },
        
        'applyFilterBtn': () => {
            console.log('🔍 Aplicar filtros de categoria');
            applyCategoryFilters();
        },
        
        // ===== LOGOUT =====
        'logoutBtn': () => {
            console.log('🚪 Logout usuário');
            handleLogout();
        },
        
        // ===== PESQUISA =====
        'searchActionBtn': () => {
            console.log('🔍 Executar pesquisa');
            const searchInput = document.getElementById('searchInput');
            if (searchInput?.value.trim()) {
                performSearch(searchInput.value.trim());
            } else {
                showNotification('🔍 Digite algo para pesquisar', 'info');
            }
        },
        
        'searchClearBtn': () => {
            console.log('🧹 Limpar pesquisa');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            restoreFullFeed();
        },
        
        // ===== DELEÇÕES =====
        'btn-deletar': () => {
            console.log('🗑️ Deletar post');
            const postElement = button.closest('.post');
            const postId = postElement?.dataset.postId;
            if (postId) {
                handleDeletePost(postId);
            } else {
                console.error('❌ postId não encontrado para deleção');
                showNotification('❌ Erro: ID da história não encontrado', 'error');
            }
        },
        
        'btn-deletar-comentario': () => {
            console.log('🗑️ Deletar comentário');
            const commentElement = button.closest('.comment, .comment-reply');
            const commentId = commentElement?.dataset.commentId;
            if (commentId) {
                handleDeleteCommentNuclear(commentId, commentElement);
            } else {
                console.error('❌ commentId não encontrado para deleção');
                showNotification('❌ Erro: ID do comentário não encontrado', 'error');
            }
        },
        
        // ===== RESPOSTAS =====
        'reply-btn': () => {
            const commentId = button.dataset.commentId;
            console.log('💬 Toggle resposta para comentário:', commentId);
            if (commentId) {
                handleReplyToggle(commentId);
            } else {
                console.error('❌ commentId não encontrado no botão reply');
            }
        },
        
        'submit-reply': () => {
            const commentId = button.dataset.commentId;
            console.log('📝 Enviar resposta para comentário:', commentId);
            if (commentId) {
                handleReplySubmit(commentId);
            } else {
                console.error('❌ commentId não encontrado no botão submit-reply');
                showNotification('❌ Erro: ID do comentário não encontrado', 'error');
            }
        },
        
        'cancel-reply': () => {
            const commentId = button.dataset.commentId;
            console.log('❌ Cancelar resposta para comentário:', commentId);
            if (commentId) {
                const replySection = document.getElementById(`reply-${commentId}`);
                if (replySection) {
                    replySection.style.display = 'none';
                    const replyInput = replySection.querySelector('.reply-input');
                    if (replyInput) replyInput.value = '';
                }
            }
        },
        
        // ===== BOTÕES DE INTERFACE =====
        'test-button': () => {
            console.log('✨ Botão de teste clicado');
            openModal();
        },
        
        'clear-search-btn': () => {
            console.log('🧹 Limpar pesquisa (botão interno)');
            restoreFullFeed();
        },
        
        // ===== CATEGORIAS ATIVAS =====
        'remove-category-btn': () => {
            console.log('🏷️ Remover categoria ativa');
            const categoryBadge = button.closest('.active-category-badge');
            const categoryName = categoryBadge?.textContent?.trim().replace('✕', '').trim();
            if (categoryName) {
                removeCategory(categoryName);
            }
        }
    };
    
    // Encontrar handler pelo className ou ID
    for (const [key, handler] of Object.entries(buttonHandlers)) {
        if (button.classList.contains(key) || button.id === key) {
            console.log(`✅ Handler encontrado: ${key}`);
            handler();
            return;
        }
    }
    
    // Fallback para botões com data attributes
    if (button.dataset.postId) {
        if (button.classList.contains('like-btn')) {
            console.log('🔄 Fallback like:', button.dataset.postId);
            handlePostLike(button, button.dataset.postId);
        } else if (button.classList.contains('comment-btn')) {
            console.log('🔄 Fallback comment toggle:', button.dataset.postId);
            handleCommentToggle(button.dataset.postId);
        } else if (button.classList.contains('submit-comment')) {
            console.log('🔄 Fallback comment submit:', button.dataset.postId);
            handleCommentSubmit(button.dataset.postId);
        }
    }
    
    if (button.dataset.commentId) {
        if (button.classList.contains('reply-btn')) {
            console.log('🔄 Fallback reply toggle:', button.dataset.commentId);
            handleReplyToggle(button.dataset.commentId);
        } else if (button.classList.contains('submit-reply')) {
            console.log('🔄 Fallback reply submit:', button.dataset.commentId);
            handleReplySubmit(button.dataset.commentId);
        }
    }
    
    console.log('❌ Nenhum handler encontrado para o botão:', button.className, button.id);
}

// ===== SISTEMA DE IMAGENS =====
function setupImagePreview() {
    const imageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const imageLabel = document.querySelector('.image-upload-btn');

    if (imageLabel && imageInput) {
        imageLabel.addEventListener('click', (e) => {
            e.preventDefault();
            imageInput.click();
        });
    }

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Preview da imagem">
                            <button type="button" class="remove-image-btn" onclick="removeImage()">
                                ✕
                            </button>
                        </div>
                    `;
                    imagePreview.style.display = 'block';
                    
                    const uploadText = document.querySelector('.upload-text');
                    if (uploadText) {
                        uploadText.textContent = 'Alterar Imagem';
                    }
                };
                reader.readAsDataURL(file);
            } else if (file) {
                showNotification(' Por favor, selecione uma imagem válida', 'error');
                removeImage();
            }
        });
    }
}

function removeImage() {
    const imageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadText = document.querySelector('.upload-text');
    
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.innerHTML = '';
        imagePreview.style.display = 'none';
    }
    if (uploadText) {
        uploadText.textContent = 'Escolher Imagem';
    }
}

// ===== NOTIFICAÇÕES =====
function showNotification(message, type = 'success') {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// ===== EVENT LISTENERS GLOBAIS =====
function setupGlobalEventListeners() {
    console.log('🔧 Configurando event listeners globais...');
    
    // Listener global para TODAS as interações - SEM PREVENÇÃO GLOBAL
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        console.log('🎯 Click global capturado:', target);
        
        // Deleção de posts
        if (target.closest('.btn-deletar')) {
            e.preventDefault();
            e.stopPropagation();
            const postElement = target.closest('.post');
            const postId = postElement.dataset.postId;
            console.log('🗑️ Deletar post:', postId);
            handleDeletePost(e);
            return;
        }
        
        // Curtir posts
        if (target.closest('.like-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const likeBtn = target.closest('.like-btn');
            const postId = likeBtn.dataset.postId;
            console.log('❤️ Curtir post:', postId);
            handlePostLike(likeBtn, postId, e);
            return;
        }
        
        // Comentários
        if (target.closest('.comment-btn')) {
    e.preventDefault();
    e.stopPropagation();
    
    const commentBtn = target.closest('.comment-btn');
    let postId = commentBtn.dataset.postId;
    
    console.log('💬 Botão de comentário clicado, postId:', postId);
    
    // 🎯 CORREÇÃO: Se não tem postId, tentar encontrar do elemento pai
        if (!postId) {
            const postElement = commentBtn.closest('.post, .story-item');
            if (postElement) {
                postId = postElement.dataset.postId;
                console.log('🔄 PostId recuperado do elemento pai:', postId);
            }
        }
        
        if (postId) {
            handleCommentToggle(e);
        } else {
            console.error('❌ Não foi possível encontrar postId para comentário');
            showNotification('❌ Erro: Não foi possível carregar comentários', 'error');
        }
        return;
        }
        
        // Enviar comentários

        if (target.closest('.submit-comment')) {
            e.preventDefault();
            e.stopPropagation();
            const submitBtn = target.closest('.submit-comment');
            const postId = submitBtn.dataset.postId;
            console.log('📝 Enviar comentário:', postId);
            handleCommentSubmit(postId);
            return;
        }
        
        // Curtir comentários
        if (target.closest('.comment-like-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const likeBtn = target.closest('.comment-like-btn');
            const commentId = likeBtn.dataset.commentId;
            console.log('💖 Curtir comentário:', commentId);
            handleCommentLike(e);
            return;
        }
        
        // Deleção de comentários
        if (target.closest('.btn-deletar-comentario')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🗑️ Deletar comentário detectado');
            handleDeleteComment(e);
            return;
        }
        
        // Respostas
        if (target.closest('.reply-btn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('↩️ Toggle resposta');
            handleReplyToggle(e); // 🎯 USAR handleReplyToggle
            return;
        }

        if (target.closest('.submit-reply')) {
    e.preventDefault();
    e.stopPropagation();
    console.log('📝 Enviar resposta - evento capturado');
    
    const submitBtn = target.closest('.submit-reply');
    const commentId = submitBtn.dataset.commentId;
    
    console.log('🔍 Dados do botão submit-reply:', {
        commentId: commentId,
        dataset: submitBtn.dataset,
        html: submitBtn.outerHTML
    });
    
    if (commentId) {
        handleReplySubmit(e, commentId);
    } else {
        console.error('❌ commentId não encontrado no botão submit-reply');
        
        // 🎯 CORREÇÃO: Tentar recuperar o commentId do contexto
        const replySection = submitBtn.closest('.reply-section');
        if (replySection) {
            const idFromSection = replySection.id.replace('reply-', '');
            if (idFromSection) {
                console.log('🔄 Recuperando commentId da seção:', idFromSection);
                handleReplySubmit(e, idFromSection);
                return;
            }
        }
        
        showNotification('❌ Erro: ID do comentário não encontrado', 'error');
        }
        return;
    }

        if (target.closest('.cancel-reply')) {
            e.preventDefault();
            e.stopPropagation();
            const cancelBtn = target.closest('.cancel-reply');
            const commentId = cancelBtn.dataset.commentId;
            console.log('❌ Cancelar resposta para comentário:', commentId);
            
            // 🎯 CORREÇÃO: BUSCAR A SEÇÃO DE RESPOSTA DE FORMA ROBUSTA
            let replySection = document.getElementById(`reply-${commentId}`);
            if (!replySection) {
                const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentElement) {
                    replySection = commentElement.querySelector('.reply-section');
                }
            }
            
            if (replySection) {
                replySection.style.display = 'none';
                const replyInput = replySection.querySelector('.reply-input');
                if (replyInput) replyInput.value = '';
                console.log('✅ Resposta cancelada');
            }
            return;
        }
        
        // FAB Button
        if (target.closest('#fabButton')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📖 Abrir modal de criação');
            openModal();
            return;
        }
        
        // Filtro de categorias
        if (target.closest('#categoryFilterToggle')) {
            e.preventDefault();
            e.stopPropagation();
            const filterOptions = document.getElementById('categoryFilterOptions');
            if (filterOptions) {
                filterOptions.classList.toggle('hidden');
            }
            return;
        }
        
        if (target.closest('#applyFilterBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 Aplicar filtros');
            applyCategoryFilters();
            return;
        }
        
        // Logout
        if (target.closest('#logoutBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Logout');
            handleLogout();
            return;
        }
        
        // Limpar pesquisa
        if (target.closest('#searchClearBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            restoreFullFeed();
            return;
        }
        
        // Botão de pesquisa
        if (target.closest('#searchActionBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                performSearch(searchInput.value.trim());
            }
            return;
        }
        
        // Botão de cancelar no modal
        if (target.closest('#cancelPostBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fechar modal');
            closeModal();
            return;
        }
        
        // Remover imagem
        if (target.closest('.remove-image-btn')) {
            e.preventDefault();
            e.stopPropagation();
            removeImage();
            return;
        }
        
        // Remover categoria
        if (target.closest('.remove-category-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const badge = target.closest('.active-category-badge');
            const categoryName = badge.textContent.trim().replace('✕', '').trim();
            const category = allCategories.find(cat => 
                getCategoryDisplayName(cat.nome) === categoryName
            );
            if (category) {
                removeCategory(category.nome);
            }
            return;
        }
    });

    // Prevenir submit apenas em formulários de comentário/resposta
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        // Permitir formulário de criação de post
        if (form.id === 'postForm') {
            return;
        }
        
        // Prevenir apenas em formulários de comentário/resposta
        if (form.closest('.add-comment') || form.closest('.add-reply')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚫 Submit de comentário/resposta prevenido');
        }
    });

    // Prevenir enter em inputs de comentário/resposta
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target.classList.contains('comment-input') || 
                target.classList.contains('reply-input')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });
}

function setupClickCapturePrevention() {
    // Se já foi instalado, não reinstala
    if (setupClickCapturePrevention._installed) return;
    setupClickCapturePrevention._installed = true;

    document.addEventListener('click', function capturePrevent(e) {
        try {
            const target = e.target;
            const clickable = target.closest('button, a, input[type="submit"]');
            
            if (!clickable) return;

            // Apenas prevenir em links vazios que podem causar recarregamento
            if (clickable.tagName === 'A') {
                const href = clickable.getAttribute('href');
                if (!href || href === '#' || href === 'javascript:void(0)') {
                    e.preventDefault();
                }
            }
            
            // NÃO prevenir em botões normais - deixar os event handlers funcionarem
            // A prevenção será feita apenas nos handlers específicos quando necessário
            
        } catch (err) {
            console.error('setupClickCapturePrevention error:', err);
        }
    }, true); // capture phase
}

// ===== FUNÇÕES DE INTERAÇÃO (mantidas para compatibilidade) =====
async function handleDeletePost(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const postElement = event.target.closest('.post');
    const postId = postElement.dataset.postId;

    if (!confirm('Tem certeza que deseja deletar esta história?')) {
        return;
    }
    
    try {
        // CORREÇÃO: Usar fetch diretamente para melhor controle
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/historias/${postId}`, {
            method: 'DELETE'
        });

        console.log('📡 Status da resposta:', response.status);

        if (response.ok) {
            showNotification('✅ História deletada com sucesso!', 'success');
            
            // Remover da UI imediatamente
            postElement.style.opacity = '0';
            postElement.style.transform = 'translateX(-100%)';
            postElement.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                if (postElement.parentNode) {
                    postElement.parentNode.removeChild(postElement);
                }
                
                // Atualizar array local
                allPosts = allPosts.filter(post => 
                    (post.id_historia || post.id) != postId
                );
                
                // Se não há mais posts, mostrar mensagem
                const remainingPosts = document.querySelectorAll('.post');
                if (remainingPosts.length === 0) {
                    showEmptyMessage();
                }
            }, 300);
            
        } else {
            const errorText = await response.text();
            console.error('❌ Erro do servidor:', errorText);
            throw new Error(errorText || 'Erro ao deletar história');
        }
    } catch (error) {
        console.error('❌ Erro ao deletar história:', error);
        showNotification('❌ Erro ao deletar história: ' + error.message, 'error');
    }
}

async function handlePostLike(likeBtn, postId) {
    console.log('❤️ DEBUG: Iniciando curtida...', postId);

    // Se postId não veio como parâmetro, tentar obter do dataset do botão
    if (!postId) {
        postId = likeBtn.dataset.postId;
        console.log('🔍 PostId obtido do dataset:', postId);
    }
    
    if (!currentUser) {
        showNotification('🔒 Faça login para curtir', 'error');
        return;
    }

    // VERIFICAR SE OS IDs EXISTEM
    if (!postId || !currentUser.id) {
        console.error('❌ IDs faltando:', { postId, userId: currentUser.id });
        showNotification('❌ Erro: IDs não encontrados', 'error');
        return;
    }
    
    try {
        const baseUrl = ApiConfig.getBaseUrl();
        
        // 1. Verificar estado atual
        const checkResponse = await fetch(`${baseUrl}/curtidas/${postId}/${currentUser.id}`);
        if (!checkResponse.ok) {
            throw new Error(`HTTP ${checkResponse.status}: ${await checkResponse.text()}`);
        }
        const estadoReal = await checkResponse.json();
        
        // 2. Executar ação contrária
        const acao = estadoReal.curtiu ? 'DELETE' : 'POST';
        const response = await fetch(`${baseUrl}/curtidas`, {
            method: acao,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_historia: parseInt(postId), 
                id_usuario: parseInt(currentUser.id)
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // 3. Atualizar UI
        const likeIcon = likeBtn.querySelector('.like-icon');
        const likeCount = likeBtn.querySelector('.like-count');
        let currentCount = parseInt(likeCount.textContent) || 0;
        
        if (acao === 'POST') {
            likeIcon.textContent = '❤️';
            likeCount.textContent = currentCount + 1;
            likeBtn.classList.add('liked');
            showNotification('❤️ Curtida adicionada!', 'success');
        } else {
            likeIcon.textContent = '🤍';
            likeCount.textContent = Math.max(0, currentCount - 1);
            likeBtn.classList.remove('liked');
            showNotification('💔 Curtida removida', 'success');
        }
        
        console.log('❤️ DEBUG: Curtida processada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao curtir:', error);
        showNotification('❌ Erro ao curtir: ' + error.message, 'error');
    }
}

function updatePostInArray(postId, liked) {
    const postIndex = allPosts.findIndex(post => 
        (post.id_historia || post.id) == postId
    );
    
    if (postIndex !== -1) {
        const currentLikes = allPosts[postIndex].num_curtidas || 0;
        allPosts[postIndex].num_curtidas = liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        console.log('📊 DEBUG: Array atualizado - novos likes:', allPosts[postIndex].num_curtidas);
    }
}


function updateLikeButton(likeBtn, liked) {
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCount = likeBtn.querySelector('.like-count');
    let currentCount = parseInt(likeCount.textContent) || 0;
    
    if (liked) {
        likeIcon.textContent = '❤️';
        likeCount.textContent = currentCount + 1;
        likeBtn.classList.add('liked');
        likeBtn.dataset.liked = 'true';
    } else {
        likeIcon.textContent = '🤍';
        likeCount.textContent = Math.max(0, currentCount - 1);
        likeBtn.classList.remove('liked');
        likeBtn.dataset.liked = 'false';
    }
}

async function safeParseResponse(response) {
    try {
        const text = await response;
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch (err) {
            return { message: text };
        }
    } catch (err) {
        return {};
    }
}

async function handleCommentToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('💬 DEBUG handleCommentToggle: Iniciando...');
    
    const commentBtn = event.target.closest('.comment-btn');
    if (!commentBtn) {
        console.error('❌ Botão de comentário não encontrado');
        return;
    }
    
    // 🎯 CORREÇÃO: Obter postId de forma mais robusta
    let postId = commentBtn.dataset.postId;
    
    // Se não encontrou no dataset, tentar outras formas
    if (!postId) {
        console.log('🔄 PostId não encontrado no dataset, tentando alternativas...');
        
        // Tentar encontrar pelo elemento pai mais próximo
        const postElement = commentBtn.closest('.post, .story-item');
        if (postElement) {
            postId = postElement.dataset.postId;
            console.log('✅ PostId encontrado no elemento pai:', postId);
        }
        
        // Se ainda não encontrou, tentar pelo ID do botão
        if (!postId && commentBtn.id) {
            const idFromButton = commentBtn.id.replace('comment-btn-', '');
            if (idFromButton) {
                postId = idFromButton;
                console.log('✅ PostId encontrado no ID do botão:', postId);
            }
        }
    }
    
    console.log('🎯 PostId final:', postId);
    
    if (!postId) {
        console.error('❌ Não foi possível determinar o postId');
        showNotification('❌ Erro: Não foi possível carregar comentários', 'error');
        return;
    }
    
    const commentsSection = document.getElementById(`comments-${postId}`);
    
    if (!commentsSection) {
        console.error('❌ Seção de comentários não encontrada para post:', postId);
        return;
    }
    
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        console.log('🔍 Carregando comentários hierárquicos para post:', postId);
        await loadCommentsWithReplies(postId);
    } else {
        commentsSection.style.display = 'none';
        console.log('❌ Comentários fechados para post:', postId);
    }
}

async function handleCommentSubmit(postId) {
    console.log('💬 DEBUG: Iniciando comentário...', postId);

    // Se postId não veio como parâmetro, tentar obter do botão que foi clicado
     if (!postId || postId === 'undefined') {
        console.log('🔄 PostId não fornecido, tentando obter do contexto...');
        
        // Tentar encontrar o postId do comentário que está sendo enviado
        const activeCommentSection = document.querySelector('.comments-section[style*="display: block"]');
        if (activeCommentSection) {
            postId = activeCommentSection.id.replace('comments-', '');
            console.log('✅ PostId encontrado da seção ativa:', postId);
        }
        
        // Tentar do botão de submit
        if (!postId) {
            const submitBtn = document.querySelector('.submit-comment[data-post-id]');
            if (submitBtn) {
                postId = submitBtn.dataset.postId;
                console.log('✅ PostId encontrado do botão submit:', postId);
            }
        }
    }
    
    // 🎯 CORREÇÃO: Validação rigorosa do postId
    if (!postId || postId === 'undefined' || postId === 'null') {
        console.error('❌ PostId inválido após todas as tentativas:', postId);
        showNotification('❌ Erro: Não foi possível identificar a história', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('🔒 Faça login para comentar', 'error');
        return;
    }

    // VERIFICAR SE OS IDs EXISTEM
    if (!postId || !currentUser.id) {
        console.error('❌ IDs faltando:', { postId, userId: currentUser.id });
        showNotification('❌ Erro: IDs não encontrados', 'error');
        return;
    }
    
    // CORREÇÃO: Buscar o input de forma mais robusta
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (!commentsSection) {
        console.error('❌ Seção de comentários não encontrada para post:', postId);
        showNotification('❌ Erro: seção de comentários não encontrada', 'error');
        return;
    }
    
    const commentInput = commentsSection.querySelector('.comment-input');
    if (!commentInput) {
        console.error('❌ Campo de comentário não encontrado');
        showNotification('❌ Erro: campo de comentário não encontrado', 'error');
        return;
    }
    
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        showNotification('📝 Digite um comentário', 'error');
        commentInput.focus();
        return;
    }
    
    try {
        console.log('📤 Enviando comentário:', commentText);
        
        //Usar fetch diretamente
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_historia: parseInt(postId),
                id_usuario: parseInt(currentUser.id),
                conteudo: commentText
            })
        });

        console.log('📡 Status da resposta:', response.status);

        if (response.ok) {
            const newComment = await response.json();
            console.log('✅ Comentário criado:', newComment);
            addNewCommentToUI(postId, newComment);
            commentInput.value = ''; // Limpar o input
            showNotification('💬 Comentário adicionado!', 'success');
        } else {
            const errorText = await response.text();
            console.error('❌ Erro do servidor:', errorText);
            throw new Error(errorText || 'Erro ao enviar comentário');
        }
    } catch (error) {
        console.error('❌ Erro ao comentar:', error);
        showNotification('❌ Erro ao comentar: ' + error.message, 'error');
    }
}

async function debugCommentHierarchy(postId) {
    try {
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/historias/${postId}/comentarios`);
        
        if (response.ok) {
            const todosComentarios = await response.json();
            
            console.log('🔍 DEBUG HIERARQUIA DE COMENTÁRIOS:');
            console.log(`📊 Total de comentários: ${todosComentarios.length}`);
            
            const comentariosPrincipais = todosComentarios.filter(c => !c.id_comentario_pai);
            const respostas = todosComentarios.filter(c => c.id_comentario_pai);
            
            console.log(`💬 Comentários principais: ${comentariosPrincipais.length}`);
            console.log(`↪️ Respostas: ${respostas.length}`);
            
            // Verificar se as respostas têm pais válidos
            respostas.forEach(resposta => {
                const paiExiste = todosComentarios.some(c => c.id_comentario === resposta.id_comentario_pai);
                console.log(`   Resposta ${resposta.id_comentario} → Pai ${resposta.id_comentario_pai}: ${paiExiste ? '✅' : '❌ NÃO ENCONTRADO'}`);
            });
        }
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

function displayOrganizedComments(postId, comments) {
    const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
    if (!commentsList) {
        console.error('❌ Lista de comentários não encontrada');
        return;
    }
    
    commentsList.innerHTML = '';
    
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
        return;
    }
    
    comments.forEach(commentData => {
        try {
            const commentElement = createMainCommentElement(commentData);
            commentsList.appendChild(commentElement);
            
            // Adicionar respostas se existirem
            if (commentData.replies && commentData.replies.length > 0) {
                const repliesContainer = commentElement.querySelector('.replies-container');
                if (repliesContainer) {
                    commentData.replies.forEach(reply => {
                        const replyElement = createReplyElement(reply, commentData.autor);
                        repliesContainer.appendChild(replyElement);
                    });
                }
            }
        } catch (error) {
            console.error('❌ Erro ao criar comentário:', error);
        }
    });
    
}

async function loadComments(postId) {
    try {
        console.log('💬 DEBUG FRONTEND: Carregando comentários para post:', postId);
        
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/historias/${postId}/comentarios`);
        
        console.log('💬 DEBUG FRONTEND: Status da resposta:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const comentarios = await response.json();
        console.log(`💬 DEBUG FRONTEND: ${comentarios.length} comentários carregados`);
        
        displayComments(postId, comentarios);
        
    } catch (error) {
        console.error('💬 DEBUG FRONTEND: Erro completo ao carregar comentários:', error);
        displayComments(postId, []);
    }
}

async function loadCommentsWithReplies(postId) {
    // 🎯 CORREÇÃO: Validar postId
    if (!postId || postId === 'undefined' || postId === 'null') {
        console.error('❌ PostId inválido:', postId);
        showNotification('❌ Erro: ID da história inválido', 'error');
        return;
    }
    
    console.log('💬 Carregando comentários hierárquicos para post:', postId);
    
    try {
        const baseUrl = ApiConfig.getBaseUrl();
        console.log('🌐 URL base:', baseUrl);
        
        // 🎯 CORREÇÃO: Tentar a nova rota hierárquica primeiro
        const response = await fetch(`${baseUrl}/historias/${postId}/comentarios-com-respostas`);
        
        console.log('📡 Status da resposta:', response.status);
        
        if (response.ok) {
            const comentariosOrganizados = await response.json();
            console.log(`💬 ${comentariosOrganizados.length} comentários principais carregados com respostas`);
            
            displayOrganizedComments(postId, comentariosOrganizados);
            
        } else if (response.status === 404) {
            // Se a rota nova não existe, usar a rota tradicional
            console.log('🔄 Rota hierárquica não encontrada, usando rota tradicional...');
            await loadCommentsWithRepliesFallback(postId);
        } else {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar comentários:', error);
        
        // Fallback: tentar carregar da forma antiga
        console.log('🔄 Tentando fallback para carregamento normal...');
        await loadCommentsWithRepliesFallback(postId);
    }
}

// Fallback para compatibilidade
async function loadCommentsWithRepliesFallback(postId) {
    // 🎯 CORREÇÃO: Validar postId no fallback também
    if (!postId || postId === 'undefined') {
        console.error('❌ PostId inválido no fallback:', postId);
        return;
    }
    
    try {
        const baseUrl = ApiConfig.getBaseUrl();
        const response = await fetch(`${baseUrl}/historias/${postId}/comentarios`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Erro ao carregar comentários (fallback)`);
        }
        
        const todosComentarios = await response.json();
        console.log(`🔄 Fallback: ${todosComentarios.length} comentários carregados`);
        
        // Separar manualmente comentários principais de respostas
        const comentariosPrincipais = todosComentarios.filter(comment => 
            !comment.id_comentario_pai || comment.id_comentario_pai === null
        );
        
        const respostas = todosComentarios.filter(comment => 
            comment.id_comentario_pai && comment.id_comentario_pai !== null
        );

        console.log(`📊 Fallback - Principais: ${comentariosPrincipais.length}, Respostas: ${respostas.length}`);

        // Organizar respostas sob seus comentários pais
        const comentariosOrganizados = comentariosPrincipais.map(comentario => {
            const respostasDoComentario = respostas.filter(resposta => 
                resposta.id_comentario_pai === comentario.id_comentario
            );

            return {
                ...comentario,
                isMainComment: true,
                replies: respostasDoComentario.map(resposta => ({
                    ...resposta,
                    isReply: true,
                    parentAuthorName: comentario.autor
                }))
            };
        });

        displayOrganizedComments(postId, comentariosOrganizados);
        
    } catch (error) {
        console.error('❌ Erro no fallback também:', error);
        
        // Mostrar mensagem de erro na seção de comentários
        const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
        if (commentsList) {
            commentsList.innerHTML = `
                <div class="error-message">
                    <p>❌ Erro ao carregar comentários: ${error.message}</p>
                    <button onclick="loadCommentsWithReplies('${postId}')" class="retry-btn">
                        🔄 Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}

function createCommentElement(comentario) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.dataset.commentId = comentario.id_comentario;
    
    const isAuthor = currentUser && currentUser.id == comentario.id_usuario;
    
    // 🎯 CORREÇÃO: Estrutura HTML corrigida para comentários principais
    commentDiv.innerHTML = `
        <div class="comment-avatar">
            <div class="avatar small" data-user-id="${comentario.id_usuario}"></div>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${comentario.autor || 'Usuário'}</span>
                <span class="comment-date">${formatCommentDate(comentario.data_criacao)}</span>
                ${isAuthor ? '<button type="button" class="btn-deletar-comentario">🗑️</button>' : ''}
            </div>
            <div class="comment-text">
                <p>${comentario.conteudo || ''}</p>
            </div>
            <div class="comment-actions">
                <button type="button" class="comment-like-btn" data-comment-id="${comentario.id_comentario}">
                    <span class="comment-like-icon">🤍</span>
                    <span class="comment-like-count">${comentario.num_curtidas || 0}</span>
                </button>
                <button type="button" class="reply-btn" data-comment-id="${comentario.id_comentario}">
                    <span class="reply-icon">↩️</span>
                    <span class="reply-text">Responder</span>
                </button>
            </div>
            
            <!-- 🎯 CORREÇÃO: Seção de resposta SEMPRE incluída -->
            <div class="reply-section" id="reply-${comentario.id_comentario}" style="display: none;">
                <div class="add-reply">
                    <textarea class="reply-input" placeholder="Escreva uma resposta..." rows="2"></textarea>
                    <div class="reply-buttons">
                        <button type="button" class="submit-reply" data-comment-id="${comentario.id_comentario}">
                            Responder
                        </button>
                        <button type="button" class="cancel-reply" data-comment-id="${comentario.id_comentario}">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 🎯 CORREÇÃO: Container para respostas -->
            <div class="replies-container" id="replies-${comentario.id_comentario}">
                <!-- Respostas serão adicionadas aqui -->
            </div>
        </div>
    `;
    
    // 🎯 CORREÇÃO: Renderizar avatar IMEDIATAMENTE
    const avatarElement = commentDiv.querySelector('.avatar');
    if (avatarElement) {
        const userData = {
            id: comentario.id_usuario,
            nome: comentario.autor,
            foto_perfil: comentario.foto_perfil_autor
        };
        renderSimpleAvatar(avatarElement, userData, 'small');
    }
    
    return commentDiv;
}

function createMainCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item main-comment';
    commentDiv.dataset.commentId = comment.id_comentario;
    commentDiv.dataset.commentType = 'main';
    
    const isAuthor = currentUser && currentUser.id == comment.id_usuario;
    
    // 🎯 CORREÇÃO: Garantir que temos dados básicos
    const authorName = comment.autor || 'Usuário';
    
    commentDiv.innerHTML = `
        <div class="comment-avatar">
            <div class="avatar small" data-user-id="${comment.id_usuario}"></div>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${authorName}</span>
                <span class="comment-date">${formatCommentDate(comment.data_criacao)}</span>
                ${isAuthor ? '<button type="button" class="btn-deletar-comentario">🗑️</button>' : ''}
            </div>
            <div class="comment-text">
                <p>${comment.conteudo || ''}</p>
            </div>
            <div class="comment-actions">
                <button type="button" class="comment-like-btn" data-comment-id="${comment.id_comentario}">
                    <span class="comment-like-icon">🤍</span>
                    <span class="comment-like-count">${comment.num_curtidas || 0}</span>
                </button>
                <button type="button" class="reply-btn" data-comment-id="${comment.id_comentario}">
                    <span class="reply-icon">↩️</span>
                    <span class="reply-text">Responder</span>
                </button>
            </div>
            
            <div class="reply-section" id="reply-${comment.id_comentario}" style="display: none;">
                <div class="add-reply">
                    <textarea class="reply-input" placeholder="Escreva uma resposta..." rows="2"></textarea>
                    <div class="reply-buttons">
                        <button type="button" class="submit-reply" data-comment-id="${comment.id_comentario}">
                            Responder
                        </button>
                        <button type="button" class="cancel-reply" data-comment-id="${comment.id_comentario}">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="replies-container" id="replies-${comment.id_comentario}">
                <!-- Respostas serão adicionadas aqui -->
            </div>
        </div>
    `;
    
    // 🎯 CORREÇÃO: Renderizar avatar IMEDIATAMENTE com dados SIMPLES
    const avatarElement = commentDiv.querySelector('.avatar');
    if (avatarElement) {
        const userData = {
            id: comment.id_usuario,
            nome: authorName,
            foto_perfil: comment.foto_perfil_autor
        };
        renderSimpleAvatar(avatarElement, userData, 'small');
    } else {
        console.error('❌ Avatar element not found in comment');
    }
    
    return commentDiv;
}

// CORREÇÃO: Função garantida para criar respostas
function createReplyElement(reply, parentAuthorName = '') {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'comment-item reply-comment';
    replyDiv.dataset.commentId = reply.id_comentario;
    replyDiv.dataset.commentType = 'reply';
    replyDiv.dataset.parentCommentId = reply.id_comentario_pai || 'unknown';
    
    const isAuthor = currentUser && currentUser.id == reply.id_usuario;
    
    // 🎯 CORREÇÃO: Garantir dados básicos
    const authorName = reply.autor || 'Usuário';
    const mention = parentAuthorName ? `@${parentAuthorName} ` : '';
    
    replyDiv.innerHTML = `
        <div class="comment-avatar">
            <div class="avatar x-small" data-user-id="${reply.id_usuario}"></div>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${authorName}</span>
                <span class="comment-date">${formatCommentDate(reply.data_criacao)}</span>
                ${isAuthor ? '<button type="button" class="btn-deletar-comentario">🗑️</button>' : ''}
            </div>
            <div class="comment-text">
                <p>${mention}${reply.conteudo || ''}</p>
            </div>
            <div class="comment-actions">
                <button type="button" class="comment-like-btn" data-comment-id="${reply.id_comentario}">
                    <span class="comment-like-icon">🤍</span>
                    <span class="comment-like-count">${reply.num_curtidas || 0}</span>
                </button>
            </div>
        </div>
    `;
    
    // 🎯 CORREÇÃO: Renderizar avatar IMEDIATAMENTE com dados SIMPLES
    const avatarElement = replyDiv.querySelector('.avatar');
    if (avatarElement) {
        const userData = {
            id: reply.id_usuario,
            nome: authorName,
            foto_perfil: reply.foto_perfil_autor
        };
        renderSimpleAvatar(avatarElement, userData, 'x-small');
    }
    
    return replyDiv;
}

async function handleDeleteComment(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🗑️ Iniciando deleção de comentário/resposta');
    
    const deleteBtn = event.target.closest('.btn-deletar-comentario');
    if (!deleteBtn) {
        console.log('❌ Botão de deletar não encontrado');
        return;
    }
    
    // 🎯 CORREÇÃO: Encontrar o elemento correto
    const commentElement = deleteBtn.closest('.comment-item');
    if (!commentElement) {
        console.log('❌ Elemento do comentário não encontrado');
        return;
    }
    
    const commentId = commentElement.dataset.commentId;
    const commentType = commentElement.dataset.commentType; // 'main' ou 'reply'
    
    console.log('🔍 Dados do comentário:', {
        commentId: commentId,
        commentType: commentType,
        element: commentElement
    });
    
    if (!commentId) {
        console.error('❌ ID do comentário não encontrado');
        showNotification('❌ Erro: ID do comentário não encontrado', 'error');
        return;
    }

    const message = commentType === 'reply' 
        ? 'Tem certeza que deseja deletar esta resposta?' 
        : 'Tem certeza que deseja deletar este comentário?';

    if (confirm(message)) {
        console.log(`🔄 Deletando ${commentType}...`);
        
        try {
            const baseUrl = ApiConfig.getBaseUrl();
            const response = await fetch(`${baseUrl}/comentarios/${commentId}`, {
                method: 'DELETE'
            });

            console.log('📡 Status da resposta:', response.status);

            if (response.ok) {
                console.log(`✅ ${commentType === 'reply' ? 'Resposta' : 'Comentário'} deletado com sucesso`);
                showNotification(`✅ ${commentType === 'reply' ? 'Resposta' : 'Comentário'} deletado com sucesso!`, 'success');
                
                // 🎯 CORREÇÃO: Animação de remoção
                commentElement.style.opacity = '0';
                commentElement.style.transform = 'translateX(-100%)';
                commentElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    if (commentElement.parentNode) {
                        commentElement.parentNode.removeChild(commentElement);
                    }
                    
                    // 🎯 CORREÇÃO: Se era um comentário principal, verificar se a lista ficou vazia
                    if (commentType === 'main') {
                        const commentsList = document.querySelector('.comments-list');
                        if (commentsList && commentsList.children.length === 0) {
                            commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
                        }
                    }
                    
                    // 🎯 CORREÇÃO: Se era uma resposta, verificar se o container de respostas ficou vazio
                    if (commentType === 'reply') {
                        const parentCommentId = commentElement.dataset.parentCommentId;
                        const repliesContainer = document.getElementById(`replies-${parentCommentId}`);
                        if (repliesContainer && repliesContainer.children.length === 0) {
                            repliesContainer.style.display = 'none';
                        }
                    }
                    
                }, 300);
                
            } else {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao deletar ${commentType}:`, error);
            showNotification(`❌ Erro ao deletar ${commentType}: ` + error.message, 'error');
        }
    }
}

async function handleDeleteReply(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🗑️ Clique detectado no botão de deletar resposta');
    
    const deleteBtn = event.target.closest('.btn-deletar-resposta');
    if (!deleteBtn) {
        console.log('❌ Botão de deletar resposta não encontrado');
        return;
    }
    
    const replyElement = deleteBtn.closest('.comment-reply');
    if (!replyElement) {
        console.log('❌ Elemento da resposta não encontrado');
        return;
    }
    
    const replyId = replyElement.dataset.commentId;
    console.log('🔍 ID da resposta:', replyId);
    
    if (!replyId) {
        console.error('❌ ID da resposta não encontrado no dataset');
        showNotification('❌ Erro: ID da resposta não encontrado', 'error');
        return;
    }

    if (confirm('Tem certeza que deseja deletar esta resposta?')) {
        console.log('🔄 Enviando requisição para deletar resposta...');
        
        try {
            const response = await fetch(`${API_BASE_URL}/comentarios/${replyId}`, {
                method: 'DELETE'
            });

            console.log('📡 Resposta do servidor:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Resposta deletada com sucesso:', result);
                showNotification('✅ Resposta deletada com sucesso!', 'success');
                
                // Animação de remoção
                replyElement.style.opacity = '0';
                replyElement.style.transform = 'translateX(-100%)';
                replyElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    replyElement.remove();
                    
                    // Verificar se o comentário pai ficou sem respostas
                    const parentComment = replyElement.closest('.comment');
                    if (parentComment) {
                        const repliesContainer = parentComment.querySelector('.comment-replies');
                        if (repliesContainer && repliesContainer.children.length === 0) {
                            repliesContainer.remove();
                        }
                    }
                    
                }, 300);
                
            } else {
                const errorText = await response;
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Erro ao deletar resposta:', error);
            showNotification('❌ Erro ao deletar resposta: ' + error.message, 'error');
        }
    }
}

async function handleCommentLike(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentUser) {
        showNotification('🔒 Faça login para curtir comentários', 'error');
        return;
    }

    const likeBtn = event.target.closest('.comment-like-btn');
    const commentId = likeBtn.dataset.commentId;
    
    console.log('💖 Curtindo comentário ID:', commentId);
    
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCount = likeBtn.querySelector('.like-count');
    let currentCount = parseInt(likeCount.textContent) || 0;
    
    if (likeIcon.textContent === '🤍') {
        likeIcon.textContent = '❤️';
        likeCount.textContent = currentCount + 1;
        showNotification('💖 Comentário curtido!', 'success');
    } else {
        likeIcon.textContent = '🤍';
        likeCount.textContent = Math.max(0, currentCount - 1);
        showNotification('💔 Curtida removida do comentário', 'success');
    }
}

// ===== FUNÇÕES DE ATUALIZAÇÃO EM TEMPO REAL =====

function addNewStoryToFeed(newStory) {
    console.log('🚀 SOLUÇÃO SIMPLES: Recarregar todo o feed');
    
    // Solução mais garantida: recarregar tudo
    loadPosts();
    
    // Mostrar mensagem de sucesso
    showNotification('✅ História publicada com sucesso!', 'success');
    
    // Fechar modal
    closeModal();
}

function updateLikeUI(likeBtn, liked) {
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCount = likeBtn.querySelector('.like-count');
    let currentCount = parseInt(likeCount.textContent) || 0;
    
    if (liked) {
        likeIcon.textContent = '❤️';
        likeCount.textContent = currentCount + 1;
        likeBtn.classList.add('liked');
        likeBtn.dataset.liked = 'true';
    } else {
        likeIcon.textContent = '🤍';
        likeCount.textContent = Math.max(0, currentCount - 1);
        likeBtn.classList.remove('liked');
        likeBtn.dataset.liked = 'false';
    }
}

function addNewCommentToUI(postId, comment) {
    console.log('🚀 SOLUÇÃO NUCLEAR: Recarregando TODOS os comentários');
    
    // 1. Limpar input
    const commentInput = document.querySelector(`#comments-${postId} .comment-input`);
    if (commentInput) commentInput.value = '';
    
    // 2. Recarregar comentários do servidor
    loadCommentsWithReplies(postId);
    
    // 3. Mostrar feedback
    showNotification('💬 Comentário adicionado!', 'success');
}


// ===== VERSÃO OTIMIZADA PARA RESPOSTAS =====
function addNewReplyToUI(commentId, reply) {
    console.log('🎯 Adicionando nova resposta à UI:', { commentId, reply });
    
    // 🎯 CORREÇÃO: Garantir que temos todos os dados necessários
    if (!reply.id_comentario_pai) {
        reply.id_comentario_pai = parseInt(commentId);
    }
    if (!reply.autor && currentUser) {
        reply.autor = currentUser.nome;
    }
    if (!reply.id_usuario && currentUser) {
        reply.id_usuario = currentUser.id;
    }
    if (!reply.isReply) {
        reply.isReply = true;
    }
    
    console.log('📋 Dados da resposta processados:', reply);
    
    // 🎯 CORREÇÃO: Encontrar comentário pai de forma precisa
    const parentComment = document.querySelector(`[data-comment-id="${commentId}"][data-comment-type="main"]`);
    if (!parentComment) {
        console.error('❌ Comentário pai não encontrado para ID:', commentId);
        
        // Tentar fallback: recarregar todos os comentários
        const commentsSection = document.querySelector('.comments-section');
        if (commentsSection) {
            const postId = commentsSection.id.replace('comments-', '');
            loadCommentsWithReplies(postId);
        }
        return;
    }
    
    // 🎯 CORREÇÃO: Buscar nome do autor pai
    const parentAuthorElement = parentComment.querySelector('.comment-author');
    const parentAuthorName = parentAuthorElement ? parentAuthorElement.textContent.trim() : '';
    
    // 🎯 CORREÇÃO: Encontrar ou criar container de respostas
    let repliesContainer = document.getElementById(`replies-${commentId}`);
    if (!repliesContainer) {
        console.log('📦 Criando container de respostas...');
        repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        repliesContainer.id = `replies-${commentId}`;
        
        // Inserir após a seção de resposta
        const replySection = parentComment.querySelector('.reply-section');
        if (replySection) {
            replySection.parentNode.insertBefore(repliesContainer, replySection.nextSibling);
        } else {
            // Fallback: inserir após as ações
            const commentActions = parentComment.querySelector('.comment-actions');
            if (commentActions) {
                commentActions.parentNode.insertBefore(repliesContainer, commentActions.nextSibling);
            }
        }
    }
    
    // 🎯 CORREÇÃO: Mostrar container se estava escondido
    repliesContainer.style.display = 'block';
    
    // 🎯 CORREÇÃO: Criar elemento de resposta com menção ao autor pai
    const replyElement = createReplyElement(reply, parentAuthorName);
    repliesContainer.appendChild(replyElement);
    
    // 🎯 CORREÇÃO: Fechar seção de resposta
    closeReplySection(commentId);
    
    console.log('✅ Resposta adicionada com sucesso à UI');
}

function addSingleReplyToContainer(container, reply, parentAuthorName) {
    console.log('🎯 Adicionando resposta ao container:', {
        autor: reply.autor,
        parentAuthorName: parentAuthorName
    });
    
    // 🎯 CHAMAR createReplyElement com os dados GARANTIDOS
    const replyHTML = createReplyElement(reply, parentAuthorName);
    container.insertAdjacentHTML('beforeend', replyHTML);
    
    // 🎯 CORREÇÃO: RENDERIZAR O AVATAR IMEDIATAMENTE
    const newReply = container.lastElementChild;
    
    // Encontrar o elemento do avatar
    const avatarElement = newReply.querySelector('.avatar');
    if (avatarElement) {
        console.log('🖼️ Renderizando avatar para:', reply.autor);
        
        // 🎯 DADOS COMPLETOS DO USUÁRIO PARA O AVATAR
        const userData = {
            id: reply.id_usuario,
            nome: reply.autor,
            foto_perfil: reply.foto_perfil_autor || reply.foto_perfil || null
        };
        
        renderSimpleAvatar(avatarElement, userData, 'x-small');
    } else {
        console.error('❌ Elemento do avatar não encontrado na resposta');
    }
    
    // 🎯 VERIFICAR se o nome do usuário foi renderizado
    const usernameElement = newReply.querySelector('.username');
    if (usernameElement) {
        console.log('✅ Nome de usuário renderizado:', usernameElement.textContent);
    } else {
        console.error('❌ Elemento do username não encontrado');
    }
    
    // Animação
    newReply.style.opacity = '0';
    setTimeout(() => {
        newReply.style.transition = 'opacity 0.3s ease';
        newReply.style.opacity = '1';
    }, 10);
    
    console.log('✅ Resposta adicionada com sucesso');
}

function closeReplySection(commentId) {
    console.log('🔒 Fechando seção de resposta para comentário:', commentId);
    
    const replySection = document.getElementById(`reply-${commentId}`);
    if (replySection) {
        replySection.style.display = 'none';
        const replyInput = replySection.querySelector('.reply-input');
        if (replyInput) {
            replyInput.value = '';
            // Resetar altura do textarea
            replyInput.style.height = 'auto';
        }
        console.log('✅ Seção de resposta fechada');
    } else {
        console.log('ℹ️ Seção de resposta não encontrada para fechar');
    }
}

function addReplyToNewContainer(container, reply, commentElement) {
    // Buscar nome do autor pai
    const parentAuthorElement = commentElement.querySelector('.username');
    const parentAuthorName = parentAuthorElement ? parentAuthorElement.textContent.trim() : '';
    
    // 🎯 CORREÇÃO: Usar a MESMA função de criação
    const replyHTML = createReplyElement(reply, parentAuthorName);
    container.innerHTML = replyHTML;
    
    // Renderizar avatar
    const avatarElement = container.querySelector('.avatar');
    if (avatarElement) {
        renderSimpleAvatar(avatarElement, {
            id: reply.id_usuario,
            nome: reply.autor,
            foto_perfil: reply.foto_perfil_autor
        }, 'x-small');
    }
    
    console.log('✅ Resposta adicionada em novo container');
}

function addReplyToExistingContainer(container, reply, commentId) {
    // Buscar nome do autor pai
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const parentAuthorElement = commentElement ? commentElement.querySelector('.username') : null;
    const parentAuthorName = parentAuthorElement ? parentAuthorElement.textContent.trim() : '';
    
    // 🎯 CORREÇÃO: Usar a MESMA função de criação
    const replyHTML = createReplyElement(reply, parentAuthorName);
    
    // Adicionar ao final do container
    container.insertAdjacentHTML('beforeend', replyHTML);
    
    // Renderizar avatar do novo elemento
    const newReply = container.lastElementChild;
    const avatarElement = newReply.querySelector('.avatar');
    if (avatarElement) {
        renderSimpleAvatar(avatarElement, {
            id: reply.id_usuario,
            nome: reply.autor,
            foto_perfil: reply.foto_perfil_autor
        }, 'x-small');
    }
    
    // Animação
    newReply.style.opacity = '0';
    setTimeout(() => {
        newReply.style.transition = 'opacity 0.3s ease';
        newReply.style.opacity = '1';
    }, 10);
    
    console.log('✅ Resposta adicionada em container existente');
}

function debugReplyCreation(commentId, reply, parentAuthorName) {
    console.log('🔍 DEBUG REPLY CREATION:');
    console.log('📍 commentId:', commentId);
    
    // 🎯 CORREÇÃO: Verificar se reply existe antes de acessar propriedades
    if (!reply) {
        console.error('❌ reply está undefined ou null');
        return;
    }
    
    console.log('📍 reply data:', {
        id: reply.id_comentario || reply.id || 'N/A',
        autor: reply.autor || 'N/A',
        conteudo: reply.conteudo ? reply.conteudo.substring(0, 50) + '...' : 'N/A',
        parent_autor_nome: reply.parent_autor_nome || 'N/A'
    });
    
    console.log('📍 parentAuthorName parameter:', parentAuthorName || 'N/A');
    
    // Verificar elemento do comentário pai
    const parentComment = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (parentComment) {
        const parentAuthor = parentComment.querySelector('.username');
        console.log('📍 parent author from DOM:', parentAuthor?.textContent || 'N/A');
    } else {
        console.log('📍 parent comment not found in DOM');
    }
    
    // Testar a criação do elemento
    try {
        const testElement = createReplyElement(reply, parentAuthorName);
        console.log('📍 generated HTML:', testElement);
        console.log('📍 has @ mention:', testElement.includes('@'));
    } catch (error) {
        console.error('❌ Error generating test element:', error);
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

console.log('🎉 scripts.js carregado com sucesso!');