// inicio.js - VERSÃO EM PORTUGUÊS
console.log('🔧 inicio.js está carregando...');

class ApiConfig {
    static obterUrlBase() {
        const hostname = window.location.hostname;
        
        console.log('🔍 Hostname detectado:', hostname);
        if (hostname.includes('netlify.app')) {
            // Se estiver no aranduaa.netlify.app, usar a API do Railway
            return 'https://arandua1-production.up.railway.app/api';
        } 
        //Verificar se estamos no domínio de produção
        else if (hostname === 'aranduaa.netlify.app' || hostname === 'arandua1.netlify.app') {
            return 'https://arandua1-production.up.railway.app/api';
        }
        else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else {
            // Fallback para produção
            return 'https://arandua1-production.up.railway.app/api';
        }
    }
    
    static async fazerRequisicao(endpoint, opcoes = {}) {
        const urlBase = this.obterUrlBase();
        const url = `${urlBase}${endpoint}`;
        
        console.log(`🌐 Requisição API: ${opcoes.method || 'GET'} ${url}`);
        
        // ✅ OTIMIZAÇÃO: Configurações de performance
        const configsOtimizadas = {
            // Prioridade baixa para requisições não críticas
            priority: 'low',
            // Timeout de 8 segundos
            signal: AbortSignal.timeout(8000),
            // Manter conexão viva
            keepalive: true,
            ...opcoes
        };
        
        try {
            const inicio = Date.now();
            const resposta = await fetch(url, configsOtimizadas);
            const duracao = Date.now() - inicio;
            
            console.log(`⏱️ Requisição concluída em ${duracao}ms: ${url}`);
            
            // Log de requisições lentas
            if (duracao > 1000) {
                console.warn(`🐌 Requisição lenta: ${duracao}ms para ${url}`);
            }
            
            return resposta;
        } catch (erro) {
            console.error('❌ Erro na requisição:', erro);
            throw erro;
        }
    }
}

class ApiCache {
    static cache = new Map();
    static timeout = 60000; // 1 minuto
    
    static set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    static get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Verificar se expirou
        if (Date.now() - item.timestamp > this.timeout) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    static clear() {
        this.cache.clear();
    }
}

let usuarioAtual = null;
let todasPostagens = [];
let estaNoModoPesquisa = false;
let estaCriandoPost = false;
let categoriasSelecionadas = [];
let todasCategorias = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Carregado - Iniciando aplicação...');
    
    usuarioAtual = obterUsuarioLogado();
    
    if (usuarioAtual) {
        console.log('✅ Usuário logado:', usuarioAtual);
        inicializarAplicacao();
    } else {
        console.log('❌ Usuário não logado - redirecionando...');
        window.location.href = '../Tela_Login/tela_login.html';
    }
});

function obterUsuarioLogado() {
    try {
        const dadosUsuario = sessionStorage.getItem('arandua_current_user');
        if (dadosUsuario) {
            const analisado = JSON.parse(dadosUsuario);
            return analisado.user || analisado;
        }
    } catch (erro) {
        console.error('❌ Erro ao obter usuário:', erro);
    }
    return null;
}

async function inicializarAplicacao() {
    console.log('🚀 Inicializando aplicação...');
    
    try {
        // AGUARDAR DOM completamente pronto
        if (document.readyState !== 'complete') {
            console.log('⏳ Aguardando DOM completo...');
            await new Promise(resolver => {
                if (document.readyState === 'complete') {
                    resolver();
                } else {
                    window.addEventListener('load', resolver, { once: true });
                }
            });
        }
        
        console.log('✅ DOM completamente carregado');
        
        // DEBUG: Verificar elementos críticos
        depurarDOM();
        
        // Configuração básica primeiro
        configurarInterfaceBasica();
        configurarDropdown();
        configurarModal();
        
        // Aguardar renderização
        await new Promise(resolver => setTimeout(resolver, 50));
        
        // Configuração restante
        configurarPesquisa();
        configurarFiltroCategorias();
        configurarOuvintesEventosGlobais();
        atualizarExibicaoCategoriasAtivas();
        prevenirRecarregamentoLinks();
        preCarregarRecursos();
        
        // Aguardar mais um pouco
        await new Promise(resolver => setTimeout(resolver, 100));
        
        // CARREGAR POSTS POR ÚLTIMO
        console.log('📚 Iniciando carregamento de posts...');
        await carregarPostagens();
        
        console.log('✅ Aplicação inicializada com sucesso');
        
    } catch (erro) {
        console.error('❌ Erro na inicialização:', erro);
        mostrarErroCarregamento('Falha ao inicializar a aplicação: ' + erro.message);
        
        // Tentar carregar posts mesmo com erro
        setTimeout(() => {
            console.log('🔄 Tentativa de recuperação...');
            carregarPostagens();
        }, 2000);
    }
}

function configurarInterfaceBasica() {
    console.log('🔧 Configurando UI básica...');
    
    // Configurar usuário
    if (usuarioAtual) {
        const botaoUsuario = document.getElementById('userButton');
        const nomeUsuario = document.getElementById('userName');
        
        if (botaoUsuario) {
            const elementoNomeUsuario = botaoUsuario.querySelector('.user-name');
            if (elementoNomeUsuario) {
                elementoNomeUsuario.textContent = usuarioAtual.nome || 'Usuário';
            } else {
                console.warn('⚠️ Elemento .user-name não encontrado no userButton');
            }
        } else {
            console.warn('⚠️ userButton não encontrado');
        }
        
        if (nomeUsuario) {
            nomeUsuario.textContent = usuarioAtual.nome || 'Usuário';
        } else {
            console.warn('⚠️ userName não encontrado');
        }
        
        console.log('✅ Usuário configurado:', usuarioAtual.nome);
    } else {
        console.error('❌ usuarioAtual não definido');
    }
}

async function preCarregarRecursos() {
    const recursos = [
        '/api/categorias',
        '/api/usuario/perfil'
    ];
    
    // Pré-carregar em segundo plano
    recursos.forEach(url => {
        fetch(url, { priority: 'low' })
            .then(res => res.json())
            .then(dados => {
                ApiCache.set(url, dados);
                console.log(`✅ Pré-carregado: ${url}`);
            })
            .catch(erro => console.log(`⚠️ Falha no pré-carregamento: ${url}`));
    });
}

// ===== DROPDOWN =====
function configurarDropdown() {
    const botaoUsuario = document.getElementById('userButton');
    const menuDropdown = document.getElementById('userDropdown');
    const areaUsuario = document.querySelector('.user-area');

    if (botaoUsuario && menuDropdown && areaUsuario) {
        console.log('🔧 Configurando dropdown do usuário...');
        
        botaoUsuario.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Dropdown clicado, estado atual:', menuDropdown.classList.contains('hidden'));
            
            const estaOculto = menuDropdown.classList.contains('hidden');
            
            if (estaOculto) {
                menuDropdown.classList.remove('hidden');
                areaUsuario.classList.add('active');
                console.log('✅ Dropdown aberto');
            } else {
                menuDropdown.classList.add('hidden');
                areaUsuario.classList.remove('active');
                console.log('❌ Dropdown fechado');
            }
        });

        document.addEventListener('click', function(e) {
            if (!areaUsuario.contains(e.target)) {
                menuDropdown.classList.add('hidden');
                areaUsuario.classList.remove('active');
            }
        });

        menuDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

    } else {
        console.error('❌ Elementos do dropdown não encontrados');
    }
}

function alternarDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const areaUsuario = document.querySelector('.user-area');
    
    if (dropdown && areaUsuario) {
        const estaOculto = dropdown.classList.contains('hidden');
        
        if (estaOculto) {
            dropdown.classList.remove('hidden');
            areaUsuario.classList.add('active');
        } else {
            dropdown.classList.add('hidden');
            areaUsuario.classList.remove('active');
        }
    }
}

function manipularLogout() {
    console.log('🚪 Fazendo logout...');
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// ===== MODAL DE CRIAÇÃO DE HISTÓRIA =====
function configurarModal() {
    const botaoFab = document.getElementById('fabButton');
    const modal = document.getElementById('postCreationModal');
    const botaoCancelar = document.getElementById('cancelPostBtn');
    const formularioPost = document.getElementById('postForm');
    const inputConteudo = document.getElementById('postContent');

    if (botaoFab) {
        botaoFab.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.classList.remove('hidden');
        });
    }

    if (botaoCancelar) {
        botaoCancelar.addEventListener('click', (e) => {
            e.preventDefault();
            fecharModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.preventDefault();
                fecharModal();
            }
        });
    }

    if (formularioPost) {
        formularioPost.addEventListener('submit', async (e) => {
            e.preventDefault();
            await criarHistoria();
        });
    }

    if (inputConteudo) {
        inputConteudo.addEventListener('input', atualizarContadorCaracteres);
    }

    configurarPreviaImagem();
}

function arquivoParaBase64(arquivo) {
    return new Promise((resolver, rejeitar) => {
        const leitor = new FileReader();
        leitor.readAsDataURL(arquivo);
        leitor.onload = () => {
            const base64 = leitor.result.split(',')[1];
            resolver(base64);
        };
        leitor.onerror = erro => rejeitar(erro);
    });
}

function abrirModal() {
    console.log('📖 Abrindo modal de criação de história...');
    const modal = document.getElementById('postCreationModal');
    if (modal) {
        modal.classList.remove('hidden');
        const inputTitulo = document.getElementById('postTitle');
        if (inputTitulo) inputTitulo.focus();
    }
}

function fecharModal() {
    console.log('📖 Fechando modal...');
    const modal = document.getElementById('postCreationModal');
    const formulario = document.getElementById('postForm');
    
    if (modal) modal.classList.add('hidden');
    if (formulario) {
        formulario.reset();
        atualizarContadorCaracteres();
    }
    
    removerImagem();
}

function atualizarContadorCaracteres() {
    const inputConteudo = document.getElementById('postContent');
    const contadorCaracteres = document.getElementById('charCount');
    
    if (inputConteudo && contadorCaracteres) {
        const contagem = inputConteudo.value.length;
        contadorCaracteres.textContent = contagem;
        
        if (contagem > 5000) {
            contadorCaracteres.style.color = '#f44336';
        } else if (contagem > 3000) {
            contadorCaracteres.style.color = '#ff9800';
        } else {
            contadorCaracteres.style.color = '#666';
        }
    }
}

function comprimirImagem(arquivo, opcoes = {}) {
    const {
        maxWidth = 800,
        maxHeight = 600,
        quality = 0.7,
        maxSizeMB = 1,
        outputFormat = 'jpeg'
    } = opcoes;

    return new Promise((resolver, rejeitar) => {
        console.log(`🖼️ Compressão avançada: ${arquivo.name} (${(arquivo.size / 1024 / 1024).toFixed(2)} MB)`);

        // Se a imagem já é pequena, não comprime
        if (arquivo.size <= maxSizeMB * 1024 * 1024) {
            console.log('📦 Imagem já está dentro do tamanho limite, convertendo diretamente...');
            arquivoParaBase64(arquivo).then(resolver).catch(rejeitar);
            return;
        }

        const leitor = new FileReader();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        leitor.onload = function(e) {
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                let qualidadeAtual = quality;

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
                const comprimirComQualidade = (qualidade) => {
                    const tipoMime = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
                    const base64Comprimido = canvas.toDataURL(tipoMime, qualidade);
                    const dadosBase64 = base64Comprimido.split(',')[1];
                    const tamanhoMB = (dadosBase64.length * 0.75) / 1024 / 1024;

                    console.log(`🎯 Qualidade ${qualidade}: ${tamanhoMB.toFixed(2)} MB`);

                    if (tamanhoMB > maxSizeMB && qualidade > 0.3) {
                        return comprimirComQualidade(qualidade - 0.1);
                    }

                    return dadosBase64;
                };

                const base64Final = comprimirComQualidade(qualidadeAtual);
                console.log(`✅ Compressão final: ${(base64Final.length / 1024 / 1024).toFixed(2)} MB`);
                resolver(base64Final);
            };

            img.onerror = rejeitar;
            img.src = e.target.result;
        };

        leitor.onerror = rejeitar;
        leitor.readAsDataURL(arquivo);
    });
}

async function criarHistoria() {
    if (estaCriandoPost) return;
    estaCriandoPost = true;

    console.log('🔍 DEBUG: Iniciando criação de história...');

    // Coletar dados do formulário
    const inputTitulo = document.getElementById('postTitle');
    const inputCategoria = document.getElementById('postCategory');
    const inputConteudo = document.getElementById('postContent');
    const inputTags = document.getElementById('postTags');
    const inputImagem = document.getElementById('postImage');

    const titulo = inputTitulo ? inputTitulo.value.trim() : '';
    const categoria = inputCategoria ? inputCategoria.value : '';
    const conteudo = inputConteudo ? inputConteudo.value.trim() : '';
    const tags = inputTags ? inputTags.value.trim() : '';

    // Validações
    if (!titulo || titulo.length < 2) {
        mostrarNotificacao('❌ Título deve ter pelo menos 2 caracteres', 'error');
        estaCriandoPost = false;
        return;
    }

    if (!categoria) {
        mostrarNotificacao('❌ Selecione uma categoria', 'error');
        estaCriandoPost = false;
        return;
    }

    if (!conteudo || conteudo.length < 5) {
        mostrarNotificacao('❌ Conteúdo deve ter pelo menos 5 caracteres', 'error');
        estaCriandoPost = false;
        return;
    }

    let idUsuario = usuarioAtual?.id;
    if (!idUsuario) {
        mostrarNotificacao('❌ Usuário não identificado', 'error');
        estaCriandoPost = false;
        return;
    }

    let imagemBase64 = null;
    if (inputImagem && inputImagem.files[0]) {
        try {
            const arquivo = inputImagem.files[0];
            console.log(`🖼️ Processando imagem: ${arquivo.name}, ${(arquivo.size / 1024 / 1024).toFixed(2)} MB`);
            
            // 🔥 USAR COMPRESSÃO AQUI
            if (arquivo.type.startsWith('image/')) {
                mostrarNotificacao('📦 Comprimindo imagem...', 'info');
                imagemBase64 = await comprimirImagem(arquivo);
                console.log(`✅ Imagem comprimida: ${imagemBase64 ? (imagemBase64.length / 1024 / 1024).toFixed(2) + ' MB' : 'null'}`);
            } else {
                mostrarNotificacao('❌ Arquivo não é uma imagem válida', 'error');
                estaCriandoPost = false;
                return;
            }
        } catch (err) {
            console.error('❌ Erro ao comprimir imagem:', err);
            mostrarNotificacao('❌ Erro ao processar imagem', 'error');
            estaCriandoPost = false;
            return;
        }
    }

    const dadosHistoria = {
        id_usuario: parseInt(idUsuario),
        titulo: titulo,
        conteudo: conteudo,
        categoria: categoria,
        tags: tags
    };

    // Adicionar imagem apenas se existir
    if (imagemBase64) {
        dadosHistoria.imagem_capa = imagemBase64;
    }

    console.log('📤 Dados que serão enviados:', {
        ...dadosHistoria,
        imagem_capa: imagemBase64 ? `[IMAGEM: ${imagemBase64.length} caracteres]` : 'null'
    });

    try {
        const urlBase = ApiConfig.obterUrlBase();
        const resposta = await fetch(`${urlBase}/historias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosHistoria)
        });

        if (resposta.ok) {
            const novaHistoria = await resposta.json();
            console.log('✅ História criada com sucesso:', novaHistoria);
            mostrarNotificacao('✅ História publicada com sucesso!', 'success');
            adicionarNovaHistoriaAoFeed(novaHistoria);
            fecharModal();
        } else {
            const textoErro = await resposta;
            console.error('❌ Erro do servidor:', resposta.status, textoErro);
            mostrarNotificacao(`❌ Erro ao publicar: ${textoErro}`, 'error');
        }
    } catch (erro) {
        console.error('❌ Erro de rede ao criar história:', erro);
        mostrarNotificacao('❌ Erro de conexão ao publicar história', 'error');
    } finally {
        estaCriandoPost = false;
    }
}

// ===== CARREGAMENTO DE POSTAGENS/HISTÓRIAS =====

function depurarDOM() {
    console.log('🔍 DEBUG DOM:');
    console.log('📍 Elemento .content:', document.querySelector('.content'));
    console.log('📍 Elemento #userButton:', document.getElementById('userButton'));
    console.log('📍 Elemento #fabButton:', document.getElementById('fabButton'));
    console.log('📍 Elemento #postCreationModal:', document.getElementById('postCreationModal'));
    console.log('📍 Todos os elementos com classe "post":', document.querySelectorAll('.post').length);
    console.log('📍 HTML do .content:', document.querySelector('.content')?.innerHTML?.substring(0, 200) + '...');
}

async function carregarPostagens() {
    try {
        console.log('📚 Iniciando carregamento de histórias...');

        const urlBase = ApiConfig.obterUrlBase();
        console.log('🌐 URL base:', urlBase);
        
        console.log('🔄 Fazendo requisição para /historias...');
        const resposta = await fetch(`${urlBase}/historias`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        console.log('📡 Status da resposta:', resposta.status);
        console.log('📡 Response ok?', resposta.ok);

        if (!resposta.ok) {
            let textoErro = 'Erro desconhecido';
            try {
                textoErro = await resposta;
            } catch {
                textoErro = 'Não foi possível ler o erro';
            }
            
            console.error('❌ Erro HTTP completo:', {
                status: resposta.status,
                statusText: resposta.statusText,
                textoErro: textoErro,
                url: `${urlBase}/historias`
            });
            
            throw new Error(`Erro ${resposta.status}: ${resposta.statusText || 'Servidor não respondeu corretamente'}`);
        }

        console.log('✅ Resposta OK, processando JSON...');
        const historias = await resposta.json();
        console.log(`✅ ${historias.length} histórias carregadas com sucesso`);
        
        // Validar estrutura dos dados
        if (!Array.isArray(historias)) {
            console.error('❌ Dados recebidos não são um array:', typeof historias);
            throw new Error('Formato de dados inválido da API');
        }

        todasPostagens = historias;
        renderizarPostagens(historias);
        
        return historias;
        
    } catch (erro) {
        console.error('❌ Erro detalhado ao carregar histórias:', {
            message: erro.message,
            name: erro.name,
            stack: erro.stack,
            url: `${ApiConfig.obterUrlBase()}/historias`
        });
        
        mostrarErroCarregamento(erro.message);
        
        // Retorna array vazio para não quebrar a aplicação
        return [];
    }
}

function mostrarErroCarregamento(mensagem) {
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) return;

    areaConteudo.innerHTML = `
        <div class="erro-carregamento">
            <div class="erro-icone">⚠️</div>
            <h3>Erro ao carregar histórias</h3>
            <p>${mensagem}</p>
            <button onclick="carregarPostagens()" class="botao-tentar-novamente">
                Tentar Novamente
            </button>
            <button onclick="testarConexaoManual()" class="botao-tentar-novamente" style="margin-left: 10px; background: #666;">
                Testar Conexão
            </button>
        </div>
    `;
}

// ===== RENDERIZAÇÃO =====

function depurarAtributosDados() {
    console.log('🔍 DEBUG: Verificando data attributes...');
    
    const posts = document.querySelectorAll('.post, .story-item');
    console.log(`📊 Total de posts encontrados: ${posts.length}`);
    
    posts.forEach((post, index) => {
        const postId = post.dataset.postId;
        const botaoCurtir = post.querySelector('.like-btn');
        const botaoComentar = post.querySelector('.comment-btn');
        
        console.log(`📝 Post ${index + 1}:`, {
            element: post.className,
            postId: postId,
            botaoCurtirTemId: botaoCurtir ? botaoCurtir.dataset.postId : 'N/A',
            botaoComentarTemId: botaoComentar ? botaoComentar.dataset.postId : 'N/A',
            secaoComentarios: document.getElementById(`comments-${postId}`) ? 'EXISTS' : 'MISSING'
        });
    });
}

function renderizarPostagens(postagens) {
    console.log('🎨 DEBUG: Renderizando posts...', postagens);
    
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) {
        console.error('❌ Área de conteúdo não encontrada para renderização');
        // Tentar encontrar alternativas
        const alternativas = document.querySelector('main, body');
        if (alternativas) {
            console.log('🔄 Usando elemento alternativo:', alternativas.tagName);
            renderizarPostagensParaElemento(postagens, alternativas);
        }
        return;
    }

    console.log('✅ Área de conteúdo encontrada, limpando...');
    limparConteudoPosts();

    if (!postagens || postagens.length === 0) {
        console.log('📭 Nenhuma postagem para renderizar');
        mostrarMensagemVazia();
        return;
    }

    console.log(`🖼️ Renderizando ${postagens.length} postagem(ns)`);
    
    const temHistorias = postagens.some(post => post.titulo);
    console.log('📖 Tem histórias?', temHistorias);
    
    if (temHistorias) {
        renderizarHistorias(postagens);
    } else {
        renderizarPostsSimples(postagens);
    }
    
    // DEBUG: Verificar resultado
    setTimeout(() => {
        depurarAtributosDados();
    }, 500);
}

function renderizarHistorias(historias) {
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) return;

    // DEBUG: Verificar as histórias antes de renderizar
    depurarHistorias(historias);

    historias.forEach(historia => {
        const elementoHistoria = criarElementoHistoria(historia);
        areaConteudo.appendChild(elementoHistoria);
    });
}

function renderizarPostsSimples(postagens) {
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) return;

    postagens.forEach(post => {
        const elementoPost = criarElementoPost(post);
        areaConteudo.appendChild(elementoPost);
    });
}

function criarElementoHistoria(historia) {
    console.log('🛠️ Criando elemento para história:', historia.id_historia || historia.id);
    
    const elementoHistoria = document.createElement('div');
    elementoHistoria.className = 'post chat-item message-bubble story-item';
    elementoHistoria.dataset.postId = historia.id_historia || historia.id;

    const ehAutor = usuarioAtual && usuarioAtual.id == historia.id_usuario;
    const categoria = historia.categoria || 'outros';
    const postId = historia.id_historia || historia.id;
    elementoHistoria.dataset.postId = postId;
    
    // Processamento das tags
    let tags = [];
    
    if (historia.tags) {
        console.log('   🔍 Processando tags...');
        
        if (typeof historia.tags === 'string') {
            const tagsBrutas = historia.tags.trim();
            
            if (tagsBrutas.startsWith('[') && tagsBrutas.endsWith(']')) {
                try {
                    tags = JSON.parse(tagsBrutas)
                        .map(t => String(t).trim())
                        .filter(t => t && t !== 'null' && t !== 'undefined' && t !== '');
                } catch (e) {
                    tags = tagsBrutas.replace(/[\[\]"]/g, '')
                                 .split(',')
                                 .map(t => t.trim())
                                 .filter(t => t);
                }
            } else {
                tags = tagsBrutas.split(',')
                             .map(t => t.trim())
                             .filter(t => t);
            }
        } else if (Array.isArray(historia.tags)) {
            tags = historia.tags.map(t => String(t).trim())
                               .filter(t => t);
        }
    }

    const dadosImagem = historia.imagem_capa || historia.imagem;
    let urlImagem = null;

    if (dadosImagem) {
        urlImagem = obterUrlImagem(dadosImagem);
    }

    let htmlImagem = '';
    if (urlImagem) {
        htmlImagem = `
            <div class="story-image">
                <img src="${urlImagem}" alt="Capa da história: ${historia.titulo}" />
            </div>
        `;
    }

    // Gerar HTML das tags
    let htmlTags = '';
    if (tags && tags.length > 0) {
        const conteudoTags = tags.map(tag => {
            const tagLimpa = tag.replace(/^#+/, '').trim();
            if (!tagLimpa) return '';
            
            return `<span class="story-tag" data-tag="${tagLimpa}">#${tagLimpa}</span>`;
        }).filter(tag => tag !== '').join('');
        
        if (conteudoTags) {
            htmlTags = `
                <div class="story-tags">
                    ${conteudoTags}
                </div>
            `;
        }
    }

    // HTML completo da história
    elementoHistoria.innerHTML = `
        <div class="story-header">
            <div class="bubble-header">
                <div class="user-info-group">
                    <div class="avatar" data-user-id="${historia.id_usuario}">
                        <!-- Avatar será preenchido pelo JavaScript -->
                    </div>
                    <span class="username">${historia.autor || 'Usuário'}</span>
                </div>
                ${ehAutor ? '<button type="button" class="btn-deletar">🗑️ Deletar</button>' : ''}
            </div>
            
            <div class="story-meta">
                <span class="story-category ${categoria}">${obterNomeExibicaoCategoria(categoria)}</span>
                ${historia.tempo_leitura ? `<span class="reading-time">⏱️ ${historia.tempo_leitura} min</span>` : ''}
            </div>
        </div>
        
        <h3 class="story-title">${historia.titulo || 'História sem título'}</h3>

        ${htmlImagem}
        
        <div class="story-content">
            <p>${historia.conteudo || ''}</p>
        </div>
        
        ${htmlTags}
        
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

    const elementoAvatar = elementoHistoria.querySelector('.avatar');
    renderizarAvatarSimples(elementoAvatar, { 
        id: historia.id_usuario, 
        nome: historia.autor,
        foto_perfil: historia.foto_perfil_autor 
    });
    
    const botaoCurtir = elementoHistoria.querySelector('.like-btn');
    const botaoComentar = elementoHistoria.querySelector('.comment-btn');
    const botaoEnviarComentario = elementoHistoria.querySelector('.submit-comment');
    
    if (botaoCurtir) botaoCurtir.dataset.postId = postId;
    if (botaoComentar) botaoComentar.dataset.postId = postId;
    if (botaoEnviarComentario) botaoEnviarComentario.dataset.postId = postId;

    return elementoHistoria;
}

function criarElementoPost(post) {
    const elementoPost = document.createElement('div');
    elementoPost.className = 'post chat-item message-bubble';
    elementoPost.dataset.postId = post.id_historia;

    const ehAutor = usuarioAtual && usuarioAtual.id == post.id_usuario;

    elementoPost.innerHTML = `
        <div class="bubble-header">
            <div class="user-info-group">
                <div class="avatar" data-user-id="${post.id_usuario}">
                    <!-- Avatar será preenchido pelo JavaScript -->
                </div>
                <span class="username">${post.autor || 'Usuário'}</span>
            </div>
            ${ehAutor ? '<button type="button" class="btn-deletar">🗑️ Deletar</button>' : ''}
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

    const elementoAvatar = elementoPost.querySelector('.avatar');
    renderizarAvatarSimples(elementoAvatar, { 
        id: post.id_usuario, 
        nome: post.autor,
        foto_perfil: post.foto_perfil_autor 
    });

    return elementoPost;
}

// Função de debug para verificar as histórias
function depurarHistorias(historias) {
    console.log('🔍 DEBUG: Analisando estruturas das histórias:');
    historias.forEach((historia, index) => {
        console.log(`📖 História ${index + 1}:`, {
            id: historia.id_historia || historia.id,
            titulo: historia.titulo,
            tags: historia.tags,
            tipoTags: typeof historia.tags,
            temTags: !!historia.tags
        });
    });
}

// ===== AVATARES =====
function renderizarAvatarSimples(elemento, usuario, tamanho = 'normal') {
    if (!elemento) {
        console.error('❌ Elemento do avatar não existe');
        return;
    }
    
    const urlImagem = obterImagemPerfil(usuario);
    
    if (urlImagem) {
        elemento.innerHTML = `<img src="${urlImagem}" alt="${usuario.nome || 'Usuário'}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" 
                             onerror="this.style.display='none'" />`;
    } else {
        const iniciais = usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';
        const cores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const indiceCor = usuario?.id ? usuario.id % cores.length : 0;
        
        elemento.innerHTML = `
            <div style="
                width: 100%; 
                height: 100%; 
                border-radius: 50%; 
                background: ${cores[indiceCor]}; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold;
                font-size: ${tamanho === 'x-small' ? '10px' : tamanho === 'small' ? '12px' : '14px'};
            ">
                ${iniciais}
            </div>
        `;
    }
}

function obterImagemPerfil(usuario) {
    if (!usuario) {
        return null;
    }
    
    const foto = usuario.foto_perfil || usuario.foto_perfil_autor || usuario.ft_perfil || usuario.imagem_perfil;
    
    if (!foto) {
        return null;
    }
    
    if (foto.startsWith('http') || foto.startsWith('data:')) {
        return foto;
    }
    
    if (foto.length > 100) {
        return `data:image/jpeg;base64,${foto}`;
    }
    
    return null;
}

function obterUrlImagem(dadosImagem) {
    if (!dadosImagem) {
        return null;
    }

    if (dadosImagem.startsWith('http')) {
        return dadosImagem;
    }

    if (dadosImagem.startsWith('data:')) {
        return dadosImagem;
    }

    if (dadosImagem.length > 100) {
        return `data:image/jpeg;base64,${dadosImagem}`;
    }

    return null;
}

// ===== FILTRO POR CATEGORIA =====
function configurarFiltroCategorias() {
    const alternarFiltro = document.getElementById('categoryFilterToggle');
    const opcoesFiltro = document.getElementById('categoryFilterOptions');
    const botaoAplicarFiltro = document.getElementById('applyFilterBtn');

    if (alternarFiltro && opcoesFiltro) {
        carregarCategorias();
        
        alternarFiltro.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            opcoesFiltro.classList.toggle('hidden');
        });

        if (botaoAplicarFiltro) {
            botaoAplicarFiltro.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                aplicarFiltrosCategoria();
            });
        }

        setTimeout(() => {
            const caixasCategoria = document.getElementById('categoryCheckboxes');
            if (caixasCategoria) {
                caixasCategoria.addEventListener('change', function(e) {
                    if (e.target.type === 'checkbox') {
                        const categoria = e.target.value;
                        const estaMarcado = e.target.checked;
                        
                        if (estaMarcado) {
                            if (!categoriasSelecionadas.includes(categoria)) {
                                categoriasSelecionadas.push(categoria);
                            }
                        } else {
                            categoriasSelecionadas = categoriasSelecionadas.filter(cat => cat !== categoria);
                        }
                        
                        atualizarExibicaoCategoriasAtivas();
                    }
                });
            }
        }, 100);

    } else {
        console.error('❌ Elementos do filtro de categoria não encontrados');
    }
}

function carregarCategorias() {
    console.log('📂 Carregando categorias...');
    
    todasCategorias = [
        { id: 1, nome: 'criaturas', icone: '📖', cor: '#4CAF50' },
        { id: 2, nome: 'festas', icone: '🎉', cor: '#9C27B0' },
        { id: 3, nome: 'conhecimentos', icone: '🧠', cor: '#2196F3' },
        { id: 4, nome: 'costumes', icone: '👥', cor: '#FF9800' },
        { id: 5, nome: 'historia', icone: '🏛️', cor: '#795548' },
        { id: 6, nome: 'arte', icone: '🎨', cor: '#E91E63' },
        { id: 7, nome: 'culinaria', icone: '🍲', cor: '#FF5722' },
        { id: 8, nome: 'outros', icone: '📌', cor: '#607D8B' }
    ];
    
    renderizarCaixasCategoria();
    console.log(`✅ ${todasCategorias.length} categorias carregadas`);
}

function renderizarCaixasCategoria() {
    const container = document.getElementById('categoryCheckboxes');
    
    if (!container) {
        console.error('❌ Container de categorias não encontrado');
        return;
    }
    
    if (!todasCategorias || todasCategorias.length === 0) {
        container.innerHTML = '<div class="no-categories">Nenhuma categoria disponível</div>';
        return;
    }
    
    const htmlCaixas = todasCategorias.map(categoria => {
        const nome = categoria.nome || 'unknown';
        const icone = categoria.icone || '📁';
        const nomeExibicao = obterNomeExibicaoCategoria(nome);
        
        return `
            <label class="category-checkbox">
                <input type="checkbox" value="${nome}" ${categoriasSelecionadas.includes(nome) ? 'checked' : ''}>
                <span class="category-icon">${icone}</span>
                <span class="category-name">${nomeExibicao}</span>
            </label>
        `;
    }).join('');
    
    container.innerHTML = htmlCaixas;
    
    const caixas = container.querySelectorAll('input[type="checkbox"]');
    caixas.forEach(caixa => {
        caixa.addEventListener('change', function() {
            const categoria = this.value;
            if (this.checked) {
                if (!categoriasSelecionadas.includes(categoria)) {
                    categoriasSelecionadas.push(categoria);
                }
            } else {
                categoriasSelecionadas = categoriasSelecionadas.filter(cat => cat !== categoria);
            }
        });
    });
}

function aplicarFiltrosCategoria() {
    const opcoesFiltro = document.getElementById('categoryFilterOptions');
    if (opcoesFiltro) {
        opcoesFiltro.classList.add('hidden');
    }
    
    console.log('🔍 Aplicando filtros para categorias:', categoriasSelecionadas);
    
    atualizarExibicaoCategoriasAtivas();
    
    if (categoriasSelecionadas.length === 0) {
        renderizarPostagens(todasPostagens);
        const mensagemVazia = document.querySelector('.nenhuma-historia, .empty-feed-message, .estado-vazio');
        if (mensagemVazia) {
            console.log('🗑️ Removendo mensagem de feed vazio');
            mensagemVazia.remove();
        }
        mostrarNotificacao('📚 Mostrando todas as categorias', 'success');
    } else {
        filtrarPostsLocalmente();
    }
}

function filtrarPostsLocalmente() {
    if (!todasPostagens || todasPostagens.length === 0) {
        mostrarNotificacao('Nenhuma história para filtrar', 'info');
        return;
    }
    
    const filtrados = todasPostagens.filter(post => 
        categoriasSelecionadas.includes(post.categoria)
    );
    
    console.log(`📊 Filtro local: ${filtrados.length} de ${todasPostagens.length} histórias`);
    
    if (filtrados.length === 0) {
        mostrarNotificacao('Nenhuma história encontrada nas categorias selecionadas', 'info');
    } else {
        mostrarNotificacao(`📚 ${filtrados.length} história(s) encontrada(s) em ${categoriasSelecionadas.length} categoria(s)`, 'success');
    }
    
    renderizarPostagens(filtrados);
}

function removerCategoria(categoria) {
    categoriasSelecionadas = categoriasSelecionadas.filter(cat => cat !== categoria);
    
    const caixa = document.querySelector(`input[value="${categoria}"]`);
    if (caixa) {
        caixa.checked = false;
    }

    const mensagemVazia = document.querySelector('.nenhuma-historia, .empty-feed-message, .estado-vazio');
    if (mensagemVazia) {
        console.log('🗑️ Removendo mensagem de feed vazio');
        mensagemVazia.remove();
    }
    
    aplicarFiltrosCategoria();
}

function obterNomeExibicaoCategoria(categoria) {
    const categoriaObj = todasCategorias.find(c => c.nome === categoria);
    
    if (categoriaObj && categoriaObj.nome) {
        return categoriaObj.nome.charAt(0).toUpperCase() + categoriaObj.nome.slice(1);
    }
    
    const mapaFallback = {
        'criaturas': 'Criaturas',
        'festas': 'Festas', 
        'conhecimentos': 'Conhecimentos',
        'costumes': 'Costumes',
        'historia': 'História',
        'arte': 'Arte',
        'culinaria': 'Culinária',
        'outros': 'Outros'
    };
    
    return mapaFallback[categoria] || categoria;
}

// ===== FUNÇÕES PARA CATEGORIAS ATIVAS =====

function atualizarExibicaoCategoriasAtivas() {
    const containerCategoriasAtivas = document.getElementById('activeCategories');
    const alternarFiltro = document.getElementById('categoryFilterToggle');
    
    if (!containerCategoriasAtivas || !alternarFiltro) {
        console.log('❌ Elementos do display de categorias ativas não encontrados');
        return;
    }
    
    containerCategoriasAtivas.innerHTML = '';
    
    if (categoriasSelecionadas.length === 0) {
        containerCategoriasAtivas.innerHTML = `
            <span class="filter-placeholder">Todas as categorias</span>
        `;
        
        const textoFiltro = alternarFiltro.querySelector('.filter-text');
        if (textoFiltro) {
            textoFiltro.textContent = 'Filtrar por Categoria';
        }
        
        return;
    }
    
    categoriasSelecionadas.forEach(categoria => {
        const crachaCategoria = document.createElement('span');
        crachaCategoria.className = 'active-category-badge';
        crachaCategoria.innerHTML = `
            ${obterNomeExibicaoCategoria(categoria)}
            <button type="button" class="remove-category-btn" onclick="removerCategoria('${categoria}')">
                ✕
            </button>
        `;
        containerCategoriasAtivas.appendChild(crachaCategoria);
    });
    
    const textoFiltro = alternarFiltro.querySelector('.filter-text');
    if (textoFiltro) {
        textoFiltro.textContent = `Filtrando (${categoriasSelecionadas.length})`;
    }
    
    console.log('✅ Display de categorias atualizado:', categoriasSelecionadas);
}

// ===== PESQUISA =====
function configurarPesquisa() {
    setTimeout(() => {
        const inputPesquisa = document.getElementById('searchInput');
        const botaoLimparPesquisa = document.getElementById('searchClearBtn');
        const botaoAcaoPesquisa = document.getElementById('searchActionBtn');

        console.log('🔍 configurarPesquisa elementos:', {
            inputPesquisa: !!inputPesquisa,
            botaoLimparPesquisa: !!botaoLimparPesquisa,
            botaoAcaoPesquisa: !!botaoAcaoPesquisa
        });

        if (!inputPesquisa) {
            configurarPesquisaFallback();
            return;
        }

        let timeoutPesquisa = null;

        function atualizarVisibilidadeLimpar() {
            if (!botaoLimparPesquisa) return;
            if (inputPesquisa.value.trim().length > 0) botaoLimparPesquisa.classList.remove('hidden');
            else botaoLimparPesquisa.classList.add('hidden');
        }

        inputPesquisa.addEventListener('input', function(e) {
            const termo = e.target.value.trim();
            atualizarVisibilidadeLimpar();

            clearTimeout(timeoutPesquisa);
            if (termo.length === 0) {
                restaurarFeedCompleto();
                return;
            }
            if (termo.length < 2) return;

            timeoutPesquisa = setTimeout(() => realizarPesquisa(termo), 450);
        });

        if (botaoLimparPesquisa) {
            botaoLimparPesquisa.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                inputPesquisa.value = '';
                atualizarVisibilidadeLimpar();
                inputPesquisa.focus();
                restaurarFeedCompleto();
            });
        }

        if (botaoAcaoPesquisa) {
            botaoAcaoPesquisa.addEventListener('click', async function(e) {
                e.preventDefault(); e.stopPropagation();
                const termo = inputPesquisa.value.trim();
                if (termo) await realizarPesquisa(termo);
            });
        }

        inputPesquisa.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const termo = inputPesquisa.value.trim();
                if (termo) await realizarPesquisa(termo);
            }
        });
    }, 100);
}

function configurarPesquisaFallback() {
    console.log('🔄 Tentando configuração alternativa de pesquisa...');
    
    const inputPesquisa = document.querySelector('input[type="text"]');
    const botaoLimparPesquisa = document.querySelector('.search-clear-btn, .clear-btn');
    const botaoAcaoPesquisa = document.querySelector('.search-action-btn, .search-btn');
    
    if (inputPesquisa) {
        console.log('✅ Input de pesquisa encontrado via seletor alternativo');
        
        let timeoutPesquisa;
        
        inputPesquisa.addEventListener('input', function(e) {
            const termo = e.target.value.trim();
            
            clearTimeout(timeoutPesquisa);
            
            if (termo.length < 2) {
                if (termo.length === 0) {
                    restaurarFeedCompleto();
                }
                return;
            }
            
            timeoutPesquisa = setTimeout(() => {
                realizarPesquisa(termo);
            }, 500);
        });
        
        inputPesquisa.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const termo = inputPesquisa.value.trim();
                if (termo) {
                    await realizarPesquisa(termo);
                }
            }
        });
        
        if (botaoAcaoPesquisa) {
            botaoAcaoPesquisa.addEventListener('click', async function() {
                const termo = inputPesquisa.value.trim();
                if (termo) {
                    await realizarPesquisa(termo);
                }
            });
        }
        
    } else {
        console.warn('⚠️ Sistema de pesquisa não pôde ser configurado');
        mostrarNotificacao('⚠️ Funcionalidade de pesquisa não disponível', 'info');
    }
}

async function realizarPesquisa(termoPesquisa) {
    console.log('🔍 Executando pesquisa:', termoPesquisa);
    
    try {
        if (!todasPostagens || todasPostagens.length === 0) {
            console.log('📭 Nenhuma história disponível para pesquisa');
            mostrarNotificacao('📭 Nenhuma história disponível para pesquisa', 'info');
            return;
        }
        
         const areaConteudo = document.querySelector('.content');
        if (areaConteudo) {
            areaConteudo.innerHTML = `
                <div class="search-loading" style="text-align: center; padding: 60px 20px;">
                    <p style="color: var(--text-muted); font-size: 16px;">Buscando por "<strong>${termoPesquisa}</strong>"...</p>
                </div>
            `;
        }
        
        await new Promise(resolver => setTimeout(resolver, 300));
        
        console.log('📊 Total de posts para pesquisar:', todasPostagens.length);
        
        const resultados = todasPostagens.filter(post => {
            const termoMinusculo = termoPesquisa.toLowerCase();
            const temTitulo = post.titulo && post.titulo.toLowerCase().includes(termoMinusculo);
            const temConteudo = post.conteudo && post.conteudo.toLowerCase().includes(termoMinusculo);
            const temAutor = post.autor && post.autor.toLowerCase().includes(termoMinusculo);
            const temCategoria = post.categoria && post.categoria.toLowerCase().includes(termoMinusculo);
            
            return temTitulo || temConteudo || temAutor || temCategoria;
        });
        
        console.log(`✅ ${resultados.length} resultado(s) encontrado(s)`);
        
        exibirResultadosPesquisa(resultados, termoPesquisa);
        
    } catch (erro) {
        console.error('❌ Erro na pesquisa:', erro);
        mostrarNotificacao('❌ Erro ao realizar pesquisa: ' + erro.message, 'error');
        restaurarFeedCompleto();
    }
}

function exibirResultadosPesquisa(resultados, termoPesquisa) {
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) {
        console.error('❌ Área de conteúdo não encontrada');
        return;
    }
    
    limparConteudoPosts();
    
    if (resultados.length === 0) {
        areaConteudo.innerHTML = `
            <div class="no-results-message">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🔍</div>
                    <h3 style="color: var(--text-dark); margin-bottom: 10px; font-size: 24px;">
                        Nenhum resultado encontrado
                    </h3>
                    <p style="color: var(--text-muted); margin-bottom: 25px; font-size: 16px;">
                        Não encontramos nada para "<strong style="color: var(--primary-brown);">${termoPesquisa}</strong>"
                    </p>
                    <button type="button" onclick="restaurarFeedCompleto()" class="clear-search-btn large">
                        <span style="margin-right: 8px;">↩️</span>
                        Voltar para todas as histórias
                    </button>
                </div>
            </div>
        `;
    } else {
        const cabecalhoResultados = document.createElement('div');
        cabecalhoResultados.className = 'search-results-header';
        cabecalhoResultados.innerHTML = `
            <div class="results-info">
                <h3>🔍 ${resultados.length} resultado(s) para "${termoPesquisa}"</h3>
                <p class="results-subtitle">Encontramos essas histórias relacionadas à sua pesquisa</p>
            </div>
            <button type="button" onclick="restaurarFeedCompleto()" class="clear-search-btn">
                <span>✕</span>
                Limpar pesquisa
            </button>
        `;
        areaConteudo.appendChild(cabecalhoResultados);
        
        resultados.forEach(post => {
            try {
                const elementoPost = post.titulo ? criarElementoHistoria(post) : criarElementoPost(post);
                destacarTermosPesquisa(elementoPost, termoPesquisa);
                areaConteudo.appendChild(elementoPost);
            } catch (erro) {
                console.error('❌ Erro ao renderizar post:', erro);
            }
        });
        
        mostrarNotificacao(`✅ ${resultados.length} história(s) encontrada(s) para "${termoPesquisa}"`, 'success');
    }
    
    console.log('📊 Resultados exibidos com sucesso');
}

function destacarTermosPesquisa(elemento, termoPesquisa) {
    if (!elemento || !termoPesquisa) return;
    
    const termoMinusculo = termoPesquisa.toLowerCase();
    const elementosTexto = elemento.querySelectorAll('.story-title, .story-content, .message-text, .username');
    
    elementosTexto.forEach(el => {
        const htmlOriginal = el.innerHTML;
        const regex = new RegExp(`(${ escaparRegex(termoPesquisa)})`, 'gi');
        const destacado = htmlOriginal.replace(regex, '<mark class="search-highlight">$1</mark>');
        el.innerHTML = destacado;
    });
}

function escaparRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== SISTEMA DE RESPOSTAS =====

async function manipularAlternarResposta(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    
    console.log('🔍 manipularAlternarResposta chamado');
    
    const botaoResponder = evento.target.closest('.reply-btn');
    if (!botaoResponder) {
        console.error('❌ Botão de resposta não encontrado');
        return;
    }
    
    const idComentario = botaoResponder.dataset.commentId;
    console.log('💬 Toggle resposta para comentário:', idComentario);
    
    if (!idComentario) {
        console.error('❌ idComentario não encontrado');
        return;
    }
    
    let secaoResposta = document.getElementById(`reply-${idComentario}`);
    
    if (!secaoResposta) {
        console.log('🔄 Seção de resposta não encontrada pelo ID, tentando criar...');
        
        const elementoComentario = document.querySelector(`[data-comment-id="${idComentario}"]`);
        if (elementoComentario) {
            secaoResposta = elementoComentario.querySelector('.reply-section');
            
            if (!secaoResposta) {
                console.log('📝 Criando seção de resposta dinamicamente...');
                const novaSecaoResposta = document.createElement('div');
                novaSecaoResposta.className = 'reply-section';
                novaSecaoResposta.id = `reply-${idComentario}`;
                novaSecaoResposta.style.display = 'none';
                
                novaSecaoResposta.innerHTML = `
                    <div class="add-reply">
                        <textarea class="reply-input" placeholder="Escreva uma resposta..." rows="2"></textarea>
                        <div class="reply-buttons">
                            <button type="button" class="submit-reply" data-comment-id="${idComentario}">
                                Responder
                            </button>
                            <button type="button" class="cancel-reply" data-comment-id="${idComentario}">
                                Cancelar
                            </button>
                        </div>
                    </div>
                `;
                
                const acoesComentario = elementoComentario.querySelector('.comment-actions');
                if (acoesComentario) {
                    acoesComentario.parentNode.insertBefore(novaSecaoResposta, acoesComentario.nextSibling);
                } else {
                    elementoComentario.appendChild(novaSecaoResposta);
                }
                
                secaoResposta = novaSecaoResposta;
                console.log('✅ Seção de resposta criada dinamicamente');
            }
        }
    }
    
    if (!secaoResposta) {
        console.error('❌ Não foi possível encontrar ou criar a seção de resposta');
        mostrarNotificacao('❌ Erro: não foi possível acessar a seção de resposta', 'error');
        return;
    }
    
    if (secaoResposta.style.display === 'none') {
        secaoResposta.style.display = 'block';
        const inputResposta = secaoResposta.querySelector('.reply-input');
        if (inputResposta) {
            inputResposta.focus();
            inputResposta.style.height = 'auto';
            inputResposta.style.height = (inputResposta.scrollHeight) + 'px';
        }
        console.log('✅ Seção de resposta aberta');
    } else {
        secaoResposta.style.display = 'none';
        console.log('❌ Seção de resposta fechada');
    }
}

async function manipularEnviarResposta(evento, idComentario) {
    evento.preventDefault();
    evento.stopPropagation();
    
    console.log('🔍 manipularEnviarResposta chamado com idComentario:', idComentario);
    
    if (!usuarioAtual) {
        mostrarNotificacao('🔒 Faça login para responder', 'error');
        return;
    }
    
    if (!idComentario) {
        console.error('❌ idComentario é undefined no manipularEnviarResposta');
        mostrarNotificacao('❌ Erro: ID do comentário não encontrado', 'error');
        return;
    }
    
    console.log('🎯 Processando resposta para comentário:', idComentario);
    
    let secaoResposta = document.getElementById(`reply-${idComentario}`);
    
    if (!secaoResposta) {
        console.log('🔄 Seção de resposta não encontrada pelo ID, tentando buscar pelo DOM...');
        
        const elementoComentario = document.querySelector(`[data-comment-id="${idComentario}"][data-comment-type="main"]`);
        if (elementoComentario) {
            secaoResposta = elementoComentario.querySelector('.reply-section');
            console.log('🔍 Seção encontrada via querySelector:', !!secaoResposta);
        }
        
        if (!secaoResposta) {
            console.error('❌ Seção de resposta não encontrada de nenhuma forma');
            mostrarNotificacao('❌ Erro: seção de resposta não encontrada', 'error');
            return;
        }
    }
    
    const inputResposta = secaoResposta.querySelector('.reply-input');
    if (!inputResposta) {
        console.error('❌ Campo de resposta não encontrado');
        return;
    }
    
    const textoResposta = inputResposta.value.trim();
    
    console.log('📝 Texto da resposta:', textoResposta);
    
    if (!textoResposta) {
        mostrarNotificacao('📝 Digite uma resposta', 'error');
        inputResposta.focus();
        return;
    }
    
    if (textoResposta.length < 2) {
        mostrarNotificacao('📝 A resposta precisa ter pelo menos 2 caracteres', 'error');
        inputResposta.focus();
        return;
    }
    
    try {
        const elementoComentario = document.querySelector(`[data-comment-id="${idComentario}"][data-comment-type="main"]`);
        if (!elementoComentario) throw new Error('Comentário pai não encontrado');
        
        const secaoComentarios = elementoComentario.closest('.comments-section');
        if (!secaoComentarios) throw new Error('Seção de comentários não encontrada');
        
        const idPost = secaoComentarios.id.replace('comments-', '');
        
        if (!idPost) throw new Error('ID da história não encontrado');
        
        console.log('📤 Enviando resposta para o servidor:', {
            idPost: idPost,
            idComentario: idComentario,
            textoResposta: textoResposta,
            idUsuario: usuarioAtual.id
        });
        
        const urlBase = ApiConfig.obterUrlBase();
        const resposta = await fetch(`${urlBase}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_historia: parseInt(idPost),
                id_usuario: parseInt(usuarioAtual.id),
                conteudo: textoResposta,
                id_comentario_pai: parseInt(idComentario)
            })
        });

        console.log('📡 Status da resposta:', resposta.status);

        if (resposta.ok) {
            const novaResposta = await resposta.json();
            console.log('✅ Resposta criada pelo servidor:', novaResposta);
            
            const dadosResposta = {
                id_comentario: novaResposta.id,
                id_comentario_pai: parseInt(idComentario),
                id_usuario: usuarioAtual.id,
                conteudo: textoResposta,
                autor: usuarioAtual.nome,
                data_comentario: new Date().toISOString(),
                num_curtidas: 0,
                isReply: true
            };
            
            adicionarNovaRespostaNaUI(idComentario, dadosResposta);
            
            inputResposta.value = '';
            fecharSecaoResposta(idComentario);
            
            mostrarNotificacao('💬 Resposta adicionada!', 'success');
            
        } else {
            const textoErro = await resposta;
            console.error('❌ Erro do servidor:', textoErro);
            throw new Error(textoErro || 'Erro ao enviar resposta');
        }
    } catch (erro) {
        console.error('❌ Erro ao responder:', erro);
        mostrarNotificacao('❌ Erro ao responder: ' + erro.message, 'error');
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====

function formatarDataComentario(dataString) {
    if (!dataString) return 'Agora';
    
    try {
        const data = new Date(dataString);
        const agora = new Date();
        const diffMs = agora - data;
        const diffMinutos = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);
        
        if (diffMinutos < 1) return 'Agora';
        if (diffMinutos < 60) return `${diffMinutos} min`;
        if (diffHoras < 24) return `${diffHoras} h`;
        if (diffDias < 7) return `${diffDias} d`;
        
        return data.toLocaleDateString('pt-BR');
    } catch (erro) {
        return 'Agora';
    }
}

function prevenirRecarregamentoLinks() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href="#"], a[href="javascript:void(0)"]');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

function atualizacaoSuave(elemento, callback) {
    elemento.style.transition = 'all 0.3s ease';
    callback();
}

function atualizarElementoComAnimacao(elemento, novoConteudo) {
    atualizacaoSuave(elemento, () => {
        elemento.style.opacity = '0';
        setTimeout(() => {
            elemento.innerHTML = novoConteudo;
            elemento.style.opacity = '1';
        }, 300);
    });
}

function limparConteudoPosts() {
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) return;
    
    const elementosParaRemover = areaConteudo.querySelectorAll(
        '.post, .empty-feed-message, .search-results-header, .no-results-message, .empty-state, .search-loading'
    );
    elementosParaRemover.forEach(el => el.remove());

    if (areaConteudo.children.length === 0 && areaConteudo.innerHTML.includes('search-loading')) {
        areaConteudo.innerHTML = '';
    }
}

function restaurarFeedCompleto() {
    console.log('🔄 Restaurando feed completo...');
    
    const inputPesquisa = document.getElementById('searchInput');
    const botaoLimparPesquisa = document.getElementById('searchClearBtn');
    
    if (inputPesquisa) {
        inputPesquisa.value = '';
    }
    
    if (botaoLimparPesquisa) {
        botaoLimparPesquisa.classList.add('hidden');
    }
    
    categoriasSelecionadas = [];
    atualizarExibicaoCategoriasAtivas();
    
    carregarPostagens();
}

function mostrarMensagemVazia() {
    const areaConteudo = document.querySelector('.content');
    if (!areaConteudo) return;

    areaConteudo.innerHTML = '';
    
    const mensagemVazia = document.createElement('div');
    mensagemVazia.className = 'nenhuma-historia';
    mensagemVazia.innerHTML = `
        <div class="estado-vazio">
            <h3>Nenhuma história encontrada</h3>
            <p>Seja o primeiro a compartilhar uma história!</p>
            <button type="button" onclick="abrirModal()" class="botao-tentar-novamente">
                Criar Primeira História
            </button>
        </div>
    `;
    
    areaConteudo.appendChild(mensagemVazia);
    
    garantirBotaoFab();
}

function garantirBotaoFab() {
    const areaConteudo = document.querySelector('.content');
    const botaoFab = document.getElementById('fabButton');
    
    if (botaoFab && !areaConteudo.contains(botaoFab)) {
        areaConteudo.appendChild(botaoFab);
    }
}

// ===== SISTEMA DE IMAGENS =====
function configurarPreviaImagem() {
    const inputImagem = document.getElementById('postImage');
    const previaImagem = document.getElementById('imagePreview');
    const rotuloImagem = document.querySelector('.image-upload-btn');

    if (rotuloImagem && inputImagem) {
        rotuloImagem.addEventListener('click', (e) => {
            e.preventDefault();
            inputImagem.click();
        });
    }

    if (inputImagem && previaImagem) {
        inputImagem.addEventListener('change', function(e) {
            const arquivo = e.target.files[0];
            if (arquivo && arquivo.type.startsWith('image/')) {
                const leitor = new FileReader();
                leitor.onload = function(e) {
                    previaImagem.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Preview da imagem">
                            <button type="button" class="remove-image-btn" onclick="removerImagem()">
                                ✕
                            </button>
                        </div>
                    `;
                    previaImagem.style.display = 'block';
                    
                    const textoUpload = document.querySelector('.upload-text');
                    if (textoUpload) {
                        textoUpload.textContent = 'Alterar Imagem';
                    }
                };
                leitor.readAsDataURL(arquivo);
            } else if (arquivo) {
                mostrarNotificacao(' Por favor, selecione uma imagem válida', 'error');
                removerImagem();
            }
        });
    }
}

function removerImagem() {
    const inputImagem = document.getElementById('postImage');
    const previaImagem = document.getElementById('imagePreview');
    const textoUpload = document.querySelector('.upload-text');
    
    if (inputImagem) inputImagem.value = '';
    if (previaImagem) {
        previaImagem.innerHTML = '';
        previaImagem.style.display = 'none';
    }
    if (textoUpload) {
        textoUpload.textContent = 'Escolher Imagem';
    }
}

// ===== NOTIFICAÇÕES =====
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacoesAntigas = document.querySelectorAll('.notification');
    notificacoesAntigas.forEach(n => n.remove());

    const notificacao = document.createElement('div');
    notificacao.className = `notification ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.parentNode.removeChild(notificacao);
        }
    }, 3000);
}

// ===== EVENT LISTENERS GLOBAIS =====
function configurarOuvintesEventosGlobais() {
    console.log('🔧 Configurando event listeners globais...');
    
    document.addEventListener('click', function(e) {
        const alvo = e.target;
        
        console.log('🎯 Click global capturado:', alvo);
        
        // Deleção de posts
        if (alvo.closest('.btn-deletar')) {
            e.preventDefault();
            e.stopPropagation();
            const elementoPost = alvo.closest('.post');
            const idPost = elementoPost.dataset.postId;
            console.log('🗑️ Deletar post:', idPost);
            manipularExcluirPost(e);
            return;
        }
        
        // Curtir posts
        if (alvo.closest('.like-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const botaoCurtir = alvo.closest('.like-btn');
            const idPost = botaoCurtir.dataset.postId;
            console.log('❤️ Curtir post:', idPost);
            manipularCurtirPost(botaoCurtir, idPost, e);
            return;
        }
        
        // Comentários
        if (alvo.closest('.comment-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const botaoComentar = alvo.closest('.comment-btn');
            let idPost = botaoComentar.dataset.postId;
            
            console.log('💬 Botão de comentário clicado, idPost:', idPost);
            
            if (!idPost) {
                const elementoPost = botaoComentar.closest('.post, .story-item');
                if (elementoPost) {
                    idPost = elementoPost.dataset.postId;
                    console.log('🔄 PostId recuperado do elemento pai:', idPost);
                }
            }
            
            if (idPost) {
                manipularAlternarComentario(e);
            } else {
                console.error('❌ Não foi possível encontrar idPost para comentário');
                mostrarNotificacao('❌ Erro: Não foi possível carregar comentários', 'error');
            }
            return;
        }
        
        // Enviar comentários
        if (alvo.closest('.submit-comment')) {
            e.preventDefault();
            e.stopPropagation();
            const botaoEnviar = alvo.closest('.submit-comment');
            const idPost = botaoEnviar.dataset.postId;
            console.log('📝 Enviar comentário:', idPost);
            manipularEnviarComentario(idPost);
            return;
        }
        
        // Curtir comentários
        if (alvo.closest('.comment-like-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const botaoCurtirComentario = alvo.closest('.comment-like-btn');
            const idComentario = botaoCurtirComentario.dataset.commentId;
            console.log('💖 Curtir comentário:', idComentario);
            manipularCurtirComentario(e);
            return;
        }
        
        // Deleção de comentários
        if (alvo.closest('.btn-deletar-comentario')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🗑️ Deletar comentário detectado');
            manipularExcluirComentario(e);
            return;
        }
        
        // Respostas
        if (alvo.closest('.reply-btn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('↩️ Toggle resposta');
            manipularAlternarResposta(e);
            return;
        }

        if (alvo.closest('.submit-reply')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Enviar resposta - evento capturado');
            
            const botaoEnviar = alvo.closest('.submit-reply');
            const idComentario = botaoEnviar.dataset.commentId;
            
            console.log('🔍 Dados do botão submit-reply:', {
                idComentario: idComentario,
                dataset: botaoEnviar.dataset
            });
            
            if (idComentario) {
                manipularEnviarResposta(e, idComentario);
            } else {
                console.error('❌ idComentario não encontrado no botão submit-reply');
                
                const secaoResposta = botaoEnviar.closest('.reply-section');
                if (secaoResposta) {
                    const idDaSecao = secaoResposta.id.replace('reply-', '');
                    if (idDaSecao) {
                        console.log('🔄 Recuperando idComentario da seção:', idDaSecao);
                        manipularEnviarResposta(e, idDaSecao);
                        return;
                    }
                }
                
                mostrarNotificacao('❌ Erro: ID do comentário não encontrado', 'error');
            }
            return;
        }

        if (alvo.closest('.cancel-reply')) {
            e.preventDefault();
            e.stopPropagation();
            const botaoCancelar = alvo.closest('.cancel-reply');
            const idComentario = botaoCancelar.dataset.commentId;
            console.log('❌ Cancelar resposta para comentário:', idComentario);
            
            let secaoResposta = document.getElementById(`reply-${idComentario}`);
            if (!secaoResposta) {
                const elementoComentario = document.querySelector(`[data-comment-id="${idComentario}"]`);
                if (elementoComentario) {
                    secaoResposta = elementoComentario.querySelector('.reply-section');
                }
            }
            
            if (secaoResposta) {
                secaoResposta.style.display = 'none';
                const inputResposta = secaoResposta.querySelector('.reply-input');
                if (inputResposta) inputResposta.value = '';
                console.log('✅ Resposta cancelada');
            }
            return;
        }
        
        // FAB Button
        if (alvo.closest('#fabButton')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📖 Abrir modal de criação');
            abrirModal();
            return;
        }
        
        // Filtro de categorias
        if (alvo.closest('#categoryFilterToggle')) {
            e.preventDefault();
            e.stopPropagation();
            const opcoesFiltro = document.getElementById('categoryFilterOptions');
            if (opcoesFiltro) {
                opcoesFiltro.classList.toggle('hidden');
            }
            return;
        }
        
        if (alvo.closest('#applyFilterBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 Aplicar filtros');
            aplicarFiltrosCategoria();
            return;
        }
        
        // Logout
        if (alvo.closest('#logoutBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Logout');
            manipularLogout();
            return;
        }
        
        // Limpar pesquisa
        if (alvo.closest('#searchClearBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const inputPesquisa = document.getElementById('searchInput');
            if (inputPesquisa) {
                inputPesquisa.value = '';
                inputPesquisa.focus();
            }
            restaurarFeedCompleto();
            return;
        }
        
        // Botão de pesquisa
        if (alvo.closest('#searchActionBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const inputPesquisa = document.getElementById('searchInput');
            if (inputPesquisa && inputPesquisa.value.trim()) {
                realizarPesquisa(inputPesquisa.value.trim());
            }
            return;
        }
        
        // Botão de cancelar no modal
        if (alvo.closest('#cancelPostBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fechar modal');
            fecharModal();
            return;
        }
        
        // Remover imagem
        if (alvo.closest('.remove-image-btn')) {
            e.preventDefault();
            e.stopPropagation();
            removerImagem();
            return;
        }
        
        // Remover categoria
        if (alvo.closest('.remove-category-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const cracha = alvo.closest('.active-category-badge');
            const nomeCategoria = cracha.textContent.trim().replace('✕', '').trim();
            const categoria = todasCategorias.find(cat => 
                obterNomeExibicaoCategoria(cat.nome) === nomeCategoria
            );
            if (categoria) {
                removerCategoria(categoria.nome);
            }
            return;
        }
    });

    // Prevenir submit apenas em formulários de comentário/resposta
    document.addEventListener('submit', function(e) {
        const formulario = e.target;
        
        // Permitir formulário de criação de post
        if (formulario.id === 'postForm') {
            return;
        }
        
        // Prevenir apenas em formulários de comentário/resposta
        if (formulario.closest('.add-comment') || formulario.closest('.add-reply')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚫 Submit de comentário/resposta prevenido');
        }
    });

    // Prevenir enter em inputs de comentário/resposta
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const alvo = e.target;
            if (alvo.classList.contains('comment-input') || 
                alvo.classList.contains('reply-input')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });
}

// ===== FUNÇÕES DE INTERAÇÃO =====
async function manipularExcluirPost(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    
    const elementoPost = evento.target.closest('.post');
    const idPost = elementoPost.dataset.postId;

    if (!confirm('Tem certeza que deseja deletar esta história?')) {
        return;
    }
    
    try {
        const urlBase = ApiConfig.obterUrlBase();
        const resposta = await fetch(`${urlBase}/historias/${idPost}`, {
            method: 'DELETE'
        });

        console.log('📡 Status da resposta:', resposta.status);

        if (resposta.ok) {
            mostrarNotificacao('✅ História deletada com sucesso!', 'success');
            
            // Remover da UI imediatamente
            elementoPost.style.opacity = '0';
            elementoPost.style.transform = 'translateX(-100%)';
            elementoPost.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                if (elementoPost.parentNode) {
                    elementoPost.parentNode.removeChild(elementoPost);
                }
                
                // Atualizar array local
                todasPostagens = todasPostagens.filter(post => 
                    (post.id_historia || post.id) != idPost
                );
                
                // Se não há mais posts, mostrar mensagem
                const postsRestantes = document.querySelectorAll('.post');
                if (postsRestantes.length === 0) {
                    mostrarMensagemVazia();
                }
            }, 300);
            
        } else {
            const textoErro = await resposta;
            console.error('❌ Erro do servidor:', textoErro);
            throw new Error(textoErro || 'Erro ao deletar história');
        }
    } catch (erro) {
        console.error('❌ Erro ao deletar história:', erro);
        mostrarNotificacao('❌ Erro ao deletar história: ' + erro.message, 'error');
    }
}

async function manipularCurtirPost(botaoCurtir, idPost) {
    console.log('❤️ DEBUG: Iniciando curtida...', idPost);

    if (!idPost) {
        idPost = botaoCurtir.dataset.postId;
    }
    
    if (!usuarioAtual) {
        mostrarNotificacao('🔒 Faça login para curtir', 'error');
        return;
    }

    if (!idPost || !usuarioAtual.id) {
        console.error('❌ IDs faltando:', { idPost, idUsuario: usuarioAtual.id });
        return;
    }
    
    // ✅ VERIFICAR ESTADO ATUAL ANTES DE QUALQUER AÇÃO
    const iconeCurtir = botaoCurtir.querySelector('.like-icon');
    const contadorCurtidas = botaoCurtir.querySelector('.like-count');
    let contagemAtual = parseInt(contadorCurtidas.textContent) || 0;
    
    const estavaCurtido = iconeCurtir.textContent === '❤️';
    const novaContagem = estavaCurtido ? Math.max(0, contagemAtual - 1) : contagemAtual + 1;
    
    // ✅ ATUALIZAÇÃO OTIMISTA CORRIGIDA
    iconeCurtir.textContent = estavaCurtido ? '🤍' : '❤️';
    contadorCurtidas.textContent = novaContagem;
    
    if (estavaCurtido) {
        botaoCurtir.classList.remove('liked');
    } else {
        botaoCurtir.classList.add('liked');
    }
    
    try {
        const urlBase = ApiConfig.obterUrlBase();
        
        // ✅ VERIFICAR ESTADO REAL NO SERVIDOR ANTES DE TENTAR CURTIR
        console.log('🔍 Verificando estado atual da curtida...');
        const respostaVerificacao = await fetch(`${urlBase}/curtidas/${idPost}/${usuarioAtual.id}`);
        
        if (!respostaVerificacao.ok) {
            throw new Error('Erro ao verificar curtida existente');
        }
        
        const estadoReal = await respostaVerificacao.json();
        console.log('✅ Estado real da curtida:', estadoReal);
        
        // ✅ DETERMINAR A AÇÃO CORRETA BASEADA NO ESTADO REAL
        let acao;
        if (estavaCurtido && estadoReal.curtiu) {
            // Usuário quer remover curtida (já está curtido)
            acao = 'DELETE';
        } else if (!estavaCurtido && !estadoReal.curtiu) {
            // Usuário quer adicionar curtida (não está curtido)
            acao = 'POST';
        } else {
            // ✅ ESTADO INCONSISTENTE - SINCRONIZAR COM SERVIDOR
            console.warn('⚠️ Estado inconsistente, sincronizando com servidor...');
            iconeCurtir.textContent = estadoReal.curtiu ? '❤️' : '🤍';
            contadorCurtidas.textContent = estadoReal.curtiu ? contagemAtual + 1 : Math.max(0, contagemAtual - 1);
            return;
        }
        
        console.log(`🎯 Ação determinada: ${acao} para post ${idPost}`);
        
        // ✅ FAZER A REQUISIÇÃO
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const resposta = await fetch(`${urlBase}/curtidas`, {
            method: acao,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                id_historia: parseInt(idPost), 
                id_usuario: parseInt(usuarioAtual.id)
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            console.error(`❌ Erro ${resposta.status}:`, erroTexto);
            
            if (resposta.status === 400) {
                // ✅ LIDAR ESPECIFICAMENTE COM ERRO 400 (já curtiu/não curtiu)
                const respostaVerificacaoPosErro = await fetch(`${urlBase}/curtidas/${idPost}/${usuarioAtual.id}`);
                if (respostaVerificacaoPosErro.ok) {
                    const estadoPosErro = await respostaVerificacaoPosErro.json();
                    console.log('🔄 Sincronizando estado após erro 400:', estadoPosErro);
                    
                    // Sincronizar UI com estado real do servidor
                    iconeCurtir.textContent = estadoPosErro.curtiu ? '❤️' : '🤍';
                    contadorCurtidas.textContent = estadoPosErro.curtiu ? novaContagem + 1 : Math.max(0, novaContagem - 1);
                    
                    if (estadoPosErro.curtiu) {
                        botaoCurtir.classList.add('liked');
                    } else {
                        botaoCurtir.classList.remove('liked');
                    }
                }
                return;
            }
            throw new Error(`HTTP ${resposta.status}: ${erroTexto}`);
        }
        
        console.log('✅ Curtida processada com sucesso');
        
    } catch (erro) {
        console.error('❌ Erro ao curtir:', erro);
        
        // ✅ REVERSÃO MAIS INTELIGENTE
        if (erro.name === 'AbortError') {
            mostrarNotificacao('⏰ Tempo esgotado ao curtir', 'error');
        } else {
            mostrarNotificacao('❌ Erro ao curtir: ' + erro.message, 'error');
        }
        
        // ✅ SINCRONIZAR COM SERVIDOR APÓS ERRO
        try {
            const urlBase = ApiConfig.obterUrlBase();
            const respostaSincronizacao = await fetch(`${urlBase}/curtidas/${idPost}/${usuarioAtual.id}`);
            if (respostaSincronizacao.ok) {
                const estadoAtual = await respostaSincronizacao.json();
                console.log('🔄 Sincronizando estado após erro:', estadoAtual);
                
                iconeCurtir.textContent = estadoAtual.curtiu ? '❤️' : '🤍';
                contadorCurtidas.textContent = estadoAtual.curtiu ? contagemAtual : Math.max(0, contagemAtual - 1);
                
                if (estadoAtual.curtiu) {
                    botaoCurtir.classList.add('liked');
                } else {
                    botaoCurtir.classList.remove('liked');
                }
            }
        } catch (erroSinc) {
            console.error('❌ Erro na sincronização:', erroSinc);
            // Reverter para estado anterior em caso de falha na sincronização
            iconeCurtir.textContent = estavaCurtido ? '❤️' : '🤍';
            contadorCurtidas.textContent = contagemAtual;
            
            if (estavaCurtido) {
                botaoCurtir.classList.add('liked');
            } else {
                botaoCurtir.classList.remove('liked');
            }
        }
    }
}

async function manipularAlternarComentario(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    
    console.log('💬 DEBUG manipularAlternarComentario: Iniciando...');
    
    const botaoComentar = evento.target.closest('.comment-btn');
    if (!botaoComentar) {
        console.error('❌ Botão de comentário não encontrado');
        return;
    }
    
    let idPost = botaoComentar.dataset.postId;
    
    if (!idPost) {
        console.log('🔄 PostId não encontrado no dataset, tentando alternativas...');
        
        const elementoPost = botaoComentar.closest('.post, .story-item');
        if (elementoPost) {
            idPost = elementoPost.dataset.postId;
            console.log('✅ PostId encontrado no elemento pai:', idPost);
        }
        
        if (!idPost && botaoComentar.id) {
            const idDoBotao = botaoComentar.id.replace('comment-btn-', '');
            if (idDoBotao) {
                idPost = idDoBotao;
                console.log('✅ PostId encontrado no ID do botão:', idPost);
            }
        }
    }
    
    console.log('🎯 PostId final:', idPost);
    
    if (!idPost) {
        console.error('❌ Não foi possível determinar o postId');
        mostrarNotificacao('❌ Erro: Não foi possível carregar comentários', 'error');
        return;
    }
    
    const secaoComentarios = document.getElementById(`comments-${idPost}`);
    
    if (!secaoComentarios) {
        console.error('❌ Seção de comentários não encontrada para post:', idPost);
        return;
    }
    
    if (secaoComentarios.style.display === 'none') {
        secaoComentarios.style.display = 'block';
        console.log('🔍 Carregando comentários hierárquicos para post:', idPost);
        await carregarComentariosComRespostas(idPost);
    } else {
        secaoComentarios.style.display = 'none';
        console.log('❌ Comentários fechados para post:', idPost);
    }
}

async function manipularEnviarComentario(idPost) {
    console.log('💬 DEBUG: Iniciando comentário...', idPost);

    if (!idPost || idPost === 'undefined') {
        console.log('🔄 PostId não fornecido, tentando obter do contexto...');
        
        const secaoComentarioAtiva = document.querySelector('.comments-section[style*="display: block"]');
        if (secaoComentarioAtiva) {
            idPost = secaoComentarioAtiva.id.replace('comments-', '');
            console.log('✅ PostId encontrado da seção ativa:', idPost);
        }
        
        if (!idPost) {
            const botaoEnviar = document.querySelector('.submit-comment[data-post-id]');
            if (botaoEnviar) {
                idPost = botaoEnviar.dataset.postId;
                console.log('✅ PostId encontrado do botão submit:', idPost);
            }
        }
    }
    
    if (!idPost || idPost === 'undefined' || idPost === 'null') {
        console.error('❌ PostId inválido após todas as tentativas:', idPost);
        mostrarNotificacao('❌ Erro: Não foi possível identificar a história', 'error');
        return;
    }
    
    if (!usuarioAtual) {
        mostrarNotificacao('🔒 Faça login para comentar', 'error');
        return;
    }

    if (!idPost || !usuarioAtual.id) {
        console.error('❌ IDs faltando:', { idPost, idUsuario: usuarioAtual.id });
        mostrarNotificacao('❌ Erro: IDs não encontrados', 'error');
        return;
    }
    
    const secaoComentarios = document.getElementById(`comments-${idPost}`);
    if (!secaoComentarios) {
        console.error('❌ Seção de comentários não encontrada para post:', idPost);
        mostrarNotificacao('❌ Erro: seção de comentários não encontrada', 'error');
        return;
    }
    
    const inputComentario = secaoComentarios.querySelector('.comment-input');
    if (!inputComentario) {
        console.error('❌ Campo de comentário não encontrado');
        mostrarNotificacao('❌ Erro: campo de comentário não encontrado', 'error');
        return;
    }
    
    const textoComentario = inputComentario.value.trim();
    
    if (!textoComentario) {
        mostrarNotificacao('📝 Digite um comentário', 'error');
        inputComentario.focus();
        return;
    }
    
    try {
        console.log('📤 Enviando comentário:', textoComentario);
        
        const urlBase = ApiConfig.obterUrlBase();
        const resposta = await fetch(`${urlBase}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_historia: parseInt(idPost),
                id_usuario: parseInt(usuarioAtual.id),
                conteudo: textoComentario
            })
        });

        console.log('📡 Status da resposta:', resposta.status);

        if (resposta.ok) {
            const novoComentario = await resposta.json();
            console.log('✅ Comentário criado:', novoComentario);
            adicionarNovoComentarioNaUI(idPost, novoComentario);
            inputComentario.value = '';
            mostrarNotificacao('💬 Comentário adicionado!', 'success');
        } else {
            const textoErro = await resposta;
            console.error('❌ Erro do servidor:', textoErro);
            throw new Error(textoErro || 'Erro ao enviar comentário');
        }
    } catch (erro) {
        console.error('❌ Erro ao comentar:', erro);
        mostrarNotificacao('❌ Erro ao comentar: ' + erro.message, 'error');
    }
}

async function carregarComentariosComRespostas(idPost) {
    if (!idPost || idPost === 'undefined' || idPost === 'null') {
        console.error('❌ PostId inválido:', idPost);
        mostrarNotificacao('❌ Erro: ID da história inválido', 'error');
        return;
    }
    
    console.log('💬 Carregando comentários hierárquicos para post:', idPost);
    
    try {
        const urlBase = ApiConfig.obterUrlBase();
        console.log('🌐 URL base:', urlBase);
        
        const resposta = await fetch(`${urlBase}/historias/${idPost}/comentarios-com-respostas`);
        
        console.log('📡 Status da resposta:', resposta.status);
        
        if (resposta.ok) {
            const comentariosOrganizados = await resposta.json();
            console.log(`💬 ${comentariosOrganizados.length} comentários principais carregados com respostas`);
            
            exibirComentariosOrganizados(idPost, comentariosOrganizados);
            
        } else if (resposta.status === 404) {
            console.log('🔄 Rota hierárquica não encontrada, usando rota tradicional...');
            await carregarComentariosComRespostasFallback(idPost);
        } else {
            throw new Error(`HTTP ${resposta.status}: ${await resposta}`);
        }
        
    } catch (erro) {
        console.error('❌ Erro ao carregar comentários:', erro);
        
        console.log('🔄 Tentando fallback para carregamento normal...');
        await carregarComentariosComRespostasFallback(idPost);
    }
}

async function carregarComentariosComRespostasFallback(idPost) {
    if (!idPost || idPost === 'undefined') {
        console.error('❌ PostId inválido no fallback:', idPost);
        return;
    }
    
    try {
        const urlBase = ApiConfig.obterUrlBase();
        const resposta = await fetch(`${urlBase}/historias/${idPost}/comentarios`);
        
        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}: Erro ao carregar comentários (fallback)`);
        }
        
        const todosComentarios = await resposta.json();
        console.log(`🔄 Fallback: ${todosComentarios.length} comentários carregados`);
        
        const comentariosPrincipais = todosComentarios.filter(comentario => 
            !comentario.id_comentario_pai || comentario.id_comentario_pai === null
        );
        
        const respostas = todosComentarios.filter(comentario => 
            comentario.id_comentario_pai && comentario.id_comentario_pai !== null
        );

        console.log(`📊 Fallback - Principais: ${comentariosPrincipais.length}, Respostas: ${respostas.length}`);

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

        exibirComentariosOrganizados(idPost, comentariosOrganizados);
        
    } catch (erro) {
        console.error('❌ Erro no fallback também:', erro);
        
        const listaComentarios = document.querySelector(`#comments-${idPost} .comments-list`);
        if (listaComentarios) {
            listaComentarios.innerHTML = `
                <div class="error-message">
                    <p>❌ Erro ao carregar comentários: ${erro.message}</p>
                    <button onclick="carregarComentariosComRespostas('${idPost}')" class="retry-btn">
                        🔄 Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}

function exibirComentariosOrganizados(idPost, comentarios) {
    const listaComentarios = document.querySelector(`#comments-${idPost} .comments-list`);
    if (!listaComentarios) {
        console.error('❌ Lista de comentários não encontrada');
        return;
    }
    
    listaComentarios.innerHTML = '';
    
    if (!comentarios || comentarios.length === 0) {
        listaComentarios.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
        return;
    }
    
    comentarios.forEach(dadosComentario => {
        try {
            const elementoComentario = criarElementoComentarioPrincipal(dadosComentario);
            listaComentarios.appendChild(elementoComentario);
            
            if (dadosComentario.replies && dadosComentario.replies.length > 0) {
                const containerRespostas = elementoComentario.querySelector('.replies-container');
                if (containerRespostas) {
                    dadosComentario.replies.forEach(resposta => {
                        const elementoResposta = criarElementoResposta(resposta, dadosComentario.autor);
                        containerRespostas.appendChild(elementoResposta);
                    });
                }
            }
        } catch (erro) {
            console.error('❌ Erro ao criar comentário:', erro);
        }
    });
    
}

function criarElementoComentarioPrincipal(comentario) {
    const divComentario = document.createElement('div');
    divComentario.className = 'comment-item main-comment';
    divComentario.dataset.commentId = comentario.id_comentario;
    divComentario.dataset.commentType = 'main';
    
    const ehAutor = usuarioAtual && usuarioAtual.id == comentario.id_usuario;
    const nomeAutor = comentario.autor || 'Usuário';
    
    divComentario.innerHTML = `
        <div class="comment-avatar">
            <div class="avatar small" data-user-id="${comentario.id_usuario}"></div>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${nomeAutor}</span>
                <span class="comment-date">${formatarDataComentario(comentario.data_criacao)}</span>
                ${ehAutor ? '<button type="button" class="btn-deletar-comentario">🗑️</button>' : ''}
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
            
            <div class="replies-container" id="replies-${comentario.id_comentario}">
                <!-- Respostas serão adicionadas aqui -->
            </div>
        </div>
    `;
    
    const elementoAvatar = divComentario.querySelector('.avatar');
    if (elementoAvatar) {
        const dadosUsuario = {
            id: comentario.id_usuario,
            nome: nomeAutor,
            foto_perfil: comentario.foto_perfil_autor
        };
        renderizarAvatarSimples(elementoAvatar, dadosUsuario, 'small');
    } else {
        console.error('❌ Elemento do avatar não encontrado no comentário');
    }
    
    return divComentario;
}

function criarElementoResposta(resposta, nomeAutorPai = '') {
    const divResposta = document.createElement('div');
    divResposta.className = 'comment-item reply-comment';
    divResposta.dataset.commentId = resposta.id_comentario;
    divResposta.dataset.commentType = 'reply';
    divResposta.dataset.parentCommentId = resposta.id_comentario_pai || 'unknown';
    
    const ehAutor = usuarioAtual && usuarioAtual.id == resposta.id_usuario;
    const nomeAutor = resposta.autor || 'Usuário';
    const menciona = nomeAutorPai ? `@${nomeAutorPai} ` : '';
    
    divResposta.innerHTML = `
        <div class="comment-avatar">
            <div class="avatar x-small" data-user-id="${resposta.id_usuario}"></div>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${nomeAutor}</span>
                <span class="comment-date">${formatarDataComentario(resposta.data_criacao)}</span>
                ${ehAutor ? '<button type="button" class="btn-deletar-comentario">🗑️</button>' : ''}
            </div>
            <div class="comment-text">
                <p>${menciona}${resposta.conteudo || ''}</p>
            </div>
            <div class="comment-actions">
                <button type="button" class="comment-like-btn" data-comment-id="${resposta.id_comentario}">
                    <span class="comment-like-icon">🤍</span>
                    <span class="comment-like-count">${resposta.num_curtidas || 0}</span>
                </button>
            </div>
        </div>
    `;
    
    const elementoAvatar = divResposta.querySelector('.avatar');
    if (elementoAvatar) {
        const dadosUsuario = {
            id: resposta.id_usuario,
            nome: nomeAutor,
            foto_perfil: resposta.foto_perfil_autor
        };
        renderizarAvatarSimples(elementoAvatar, dadosUsuario, 'x-small');
    }
    
    return divResposta;
}

async function manipularExcluirComentario(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    
    console.log('🗑️ Iniciando deleção de comentário/resposta');
    
    const botaoDeletar = evento.target.closest('.btn-deletar-comentario');
    if (!botaoDeletar) {
        console.log('❌ Botão de deletar não encontrado');
        return;
    }
    
    const elementoComentario = botaoDeletar.closest('.comment-item');
    if (!elementoComentario) {
        console.log('❌ Elemento do comentário não encontrado');
        return;
    }
    
    const idComentario = elementoComentario.dataset.commentId;
    const tipoComentario = elementoComentario.dataset.commentType;
    
    console.log('🔍 Dados do comentário:', {
        idComentario: idComentario,
        tipoComentario: tipoComentario,
        element: elementoComentario
    });
    
    if (!idComentario) {
        console.error('❌ ID do comentário não encontrado');
        mostrarNotificacao('❌ Erro: ID do comentário não encontrado', 'error');
        return;
    }

    const mensagem = tipoComentario === 'reply' 
        ? 'Tem certeza que deseja deletar esta resposta?' 
        : 'Tem certeza que deseja deletar este comentário?';

    if (confirm(mensagem)) {
        console.log(`🔄 Deletando ${tipoComentario}...`);
        
        try {
            const urlBase = ApiConfig.obterUrlBase();
            const resposta = await fetch(`${urlBase}/comentarios/${idComentario}`, {
                method: 'DELETE'
            });

            console.log('📡 Status da resposta:', resposta.status);

            if (resposta.ok) {
                console.log(`✅ ${tipoComentario === 'reply' ? 'Resposta' : 'Comentário'} deletado com sucesso`);
                mostrarNotificacao(`✅ ${tipoComentario === 'reply' ? 'Resposta' : 'Comentário'} deletado com sucesso!`, 'success');
                
                elementoComentario.style.opacity = '0';
                elementoComentario.style.transform = 'translateX(-100%)';
                elementoComentario.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    if (elementoComentario.parentNode) {
                        elementoComentario.parentNode.removeChild(elementoComentario);
                    }
                    
                    if (tipoComentario === 'main') {
                        const listaComentarios = document.querySelector('.comments-list');
                        if (listaComentarios && listaComentarios.children.length === 0) {
                            listaComentarios.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
                        }
                    }
                    
                    if (tipoComentario === 'reply') {
                        const idComentarioPai = elementoComentario.dataset.parentCommentId;
                        const containerRespostas = document.getElementById(`replies-${idComentarioPai}`);
                        if (containerRespostas && containerRespostas.children.length === 0) {
                            containerRespostas.style.display = 'none';
                        }
                    }
                    
                }, 300);
                
            } else {
                const textoErro = await resposta;
                console.error('❌ Erro na resposta:', textoErro);
                throw new Error(`Erro ${resposta.status}: ${textoErro}`);
            }
        } catch (erro) {
            console.error(`❌ Erro ao deletar ${tipoComentario}:`, erro);
            mostrarNotificacao(`❌ Erro ao deletar ${tipoComentario}: ` + erro.message, 'error');
        }
    }
}

async function manipularCurtirComentario(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    
    console.log('💖 DEBUG: Iniciando curtida de comentário...');
    
    if (!usuarioAtual) {
        mostrarNotificacao('🔒 Faça login para curtir comentários', 'error');
        return;
    }

    const botaoCurtir = evento.target.closest('.comment-like-btn');
    if (!botaoCurtir) {
        console.error('❌ Botão de curtir comentário não encontrado');
        return;
    }
    
    const idComentario = botaoCurtir.dataset.commentId;
    
    console.log('💖 Curtindo comentário ID:', idComentario);
    
    if (!idComentario) {
        console.error('❌ ID do comentário não encontrado');
        return;
    }
    
    // ✅ VERIFICAÇÃO DE SEGURANÇA
    const iconeCurtir = botaoCurtir.querySelector('.comment-like-icon');
    const contadorCurtidas = botaoCurtir.querySelector('.comment-like-count');
    
    if (!iconeCurtir) {
        console.error('❌ Ícone de curtida não encontrado');
        return;
    }
    
    if (!contadorCurtidas) {
        console.error('❌ Contador de curtidas não encontrado');
        return;
    }
    
    let contagemAtual = parseInt(contadorCurtidas.textContent) || 0;
    
    console.log('📊 Estado atual do comentário:', {
        icone: iconeCurtir.textContent,
        contagemAtual: contagemAtual
    });
    
    // ✅ ATUALIZAÇÃO OTIMISTA SEGURA
    if (iconeCurtir.textContent === '🤍') {
        iconeCurtir.textContent = '❤️';
        contadorCurtidas.textContent = contagemAtual + 1;
        console.log('✅ Comentário curtido (otimista)');
    } else {
        iconeCurtir.textContent = '🤍';
        contadorCurtidas.textContent = Math.max(0, contagemAtual - 1);
        console.log('✅ Curtida removida (otimista)');
    }
    
    // ✅ IMPLEMENTAÇÃO DA CURTIDA NO SERVIDOR (quando tiver a rota)
    try {
        const urlBase = ApiConfig.obterUrlBase();
        
        // Verificar se já curtiu
        const respostaVerificacao = await fetch(`${urlBase}/curtidas-comentarios/${idComentario}/${usuarioAtual.id}`);
        
        if (respostaVerificacao.ok) {
            const estadoReal = await respostaVerificacao.json();
            console.log('✅ Estado real da curtida do comentário:', estadoReal);
            
            // Determinar ação
            const acao = estadoReal.curtiu ? 'DELETE' : 'POST';
            console.log(`🎯 Ação para comentário: ${acao}`);
            
            // Fazer a requisição
            const resposta = await fetch(`${urlBase}/curtidas-comentarios`, {
                method: acao,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    id_comentario: parseInt(idComentario), 
                    id_usuario: parseInt(usuarioAtual.id)
                })
            });
            
            if (!resposta.ok) {
                throw new Error(`Erro ${resposta.status} ao curtir comentário`);
            }
            
            console.log('✅ Curtida de comentário processada com sucesso');
            
        } else {
            console.warn('⚠️ Rota de curtida de comentários não disponível');
            // Mostrar feedback visual mesmo sem backend
            mostrarNotificacao('💖 Curtida registrada!', 'success');
        }
        
    } catch (erro) {
        console.error('❌ Erro ao curtir comentário:', erro);
        
        // Reverter em caso de erro
        if (iconeCurtir.textContent === '❤️') {
            iconeCurtir.textContent = '🤍';
            contadorCurtidas.textContent = Math.max(0, contagemAtual - 1);
        } else {
            iconeCurtir.textContent = '❤️';
            contadorCurtidas.textContent = contagemAtual + 1;
        }
        
        // Não mostrar erro se for apenas falta da rota
        if (!erro.message.includes('404') && !erro.message.includes('Failed to fetch')) {
            mostrarNotificacao('❌ Erro ao curtir comentário', 'error');
        }
    }
}

// ===== FUNÇÕES DE ATUALIZAÇÃO EM TEMPO REAL =====

function adicionarNovaHistoriaAoFeed(novaHistoria) {
    console.log('🚀 SOLUÇÃO SIMPLES: Recarregar todo o feed');

    // 1. Remover a mensagem de feed vazio se existir
    const mensagemVazia = document.querySelector('.nenhuma-historia, .empty-feed-message, .estado-vazio');
    if (mensagemVazia) {
        console.log('🗑️ Removendo mensagem de feed vazio');
        mensagemVazia.remove();
    }
    
    // 2. Recarregar todo o feed
    carregarPostagens();
    
    mostrarNotificacao('✅ História publicada com sucesso!', 'success');
    
    fecharModal();
}

function adicionarNovoComentarioNaUI(idPost, comentario) {
    console.log('🚀 SOLUÇÃO NUCLEAR: Recarregando TODOS os comentários');
    
    const inputComentario = document.querySelector(`#comments-${idPost} .comment-input`);
    if (inputComentario) inputComentario.value = '';
    
    carregarComentariosComRespostas(idPost);
    
    mostrarNotificacao('💬 Comentário adicionado!', 'success');
}

function adicionarNovaRespostaNaUI(idComentario, resposta) {
    console.log('🎯 Adicionando nova resposta à UI:', { idComentario, resposta });
    
    if (!resposta.id_comentario_pai) {
        resposta.id_comentario_pai = parseInt(idComentario);
    }
    if (!resposta.autor && usuarioAtual) {
        resposta.autor = usuarioAtual.nome;
    }
    if (!resposta.id_usuario && usuarioAtual) {
        resposta.id_usuario = usuarioAtual.id;
    }
    if (!resposta.isReply) {
        resposta.isReply = true;
    }
    
    console.log('📋 Dados da resposta processados:', resposta);
    
    const comentarioPai = document.querySelector(`[data-comment-id="${idComentario}"][data-comment-type="main"]`);
    if (!comentarioPai) {
        console.error('❌ Comentário pai não encontrado para ID:', idComentario);
        
        const secaoComentarios = document.querySelector('.comments-section');
        if (secaoComentarios) {
            const idPost = secaoComentarios.id.replace('comments-', '');
            carregarComentariosComRespostas(idPost);
        }
        return;
    }
    
    const elementoAutorPai = comentarioPai.querySelector('.comment-author');
    const nomeAutorPai = elementoAutorPai ? elementoAutorPai.textContent.trim() : '';
    
    let containerRespostas = document.getElementById(`replies-${idComentario}`);
    if (!containerRespostas) {
        console.log('📦 Criando container de respostas...');
        containerRespostas = document.createElement('div');
        containerRespostas.className = 'replies-container';
        containerRespostas.id = `replies-${idComentario}`;
        
        const secaoResposta = comentarioPai.querySelector('.reply-section');
        if (secaoResposta) {
            secaoResposta.parentNode.insertBefore(containerRespostas, secaoResposta.nextSibling);
        } else {
            const acoesComentario = comentarioPai.querySelector('.comment-actions');
            if (acoesComentario) {
                acoesComentario.parentNode.insertBefore(containerRespostas, acoesComentario.nextSibling);
            }
        }
    }
    
    containerRespostas.style.display = 'block';
    
    const elementoResposta = criarElementoResposta(resposta, nomeAutorPai);
    containerRespostas.appendChild(elementoResposta);
    
    fecharSecaoResposta(idComentario);
    
    console.log('✅ Resposta adicionada com sucesso à UI');
}

function fecharSecaoResposta(idComentario) {
    console.log('🔒 Fechando seção de resposta para comentário:', idComentario);
    
    const secaoResposta = document.getElementById(`reply-${idComentario}`);
    if (secaoResposta) {
        secaoResposta.style.display = 'none';
        const inputResposta = secaoResposta.querySelector('.reply-input');
        if (inputResposta) {
            inputResposta.value = '';
            inputResposta.style.height = 'auto';
        }
        console.log('✅ Seção de resposta fechada');
    } else {
        console.log('ℹ️ Seção de resposta não encontrada para fechar');
    }
}

console.log('🎉 inicio.js carregado com sucesso!');