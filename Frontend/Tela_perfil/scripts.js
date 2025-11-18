// profile.js - CORRIGIDO para carregamento de imagem - PORTUGUÊS

class ApiConfig {
    static obterUrlBase() {
        // Verificar se estamos em produção (Netlify)
        if (window.location.hostname.includes('netlify.app') || 
            window.location.hostname.includes('railway')) {
            return 'https://arandua1-production.up.railway.app';
        } 
        // Verificar se estamos em desenvolvimento local
        else if (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        // Fallback para produção
        else {
            return 'https://arandua1-production.up.railway.app';
        }
    }
    
    static async fazerRequisicao(endpoint, opcoes = {}) {
        const urlBase = this.obterUrlBase();
        const url = `${urlBase}${endpoint}`;
        
        console.log(`🌐 Requisição API: ${opcoes.method || 'GET'} ${url}`);
        console.log(`📍 Ambiente: ${window.location.hostname}`);
        
        try {
            const resposta = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...opcoes.headers
                },
                ...opcoes
            });
            
            console.log(`📡 Status da Resposta: ${resposta.status}`);
            
            if (!resposta.ok) {
                const textoErro = await resposta;
                console.error('❌ Erro HTTP:', resposta.status, textoErro);
                throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);
            }
            
            return resposta;
        } catch (erro) {
            console.error('❌ Erro de fetch:', erro);
            throw erro;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    const usuarioLogado = obterUsuarioLogado();
    
    if (!usuarioLogado) {
        window.location.href = '../Tela_Login/tela_login.html';
        return;
    }
    // Verificar se estamos no mobile
    const ehMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 É mobile?', ehMobile);

    configurarInterfaceUsuario(usuarioLogado);
    carregarPerfilUsuario(usuarioLogado);
    configurarFuncionalidadesPerfil(usuarioLogado);
    configurarBotaoVoltar();
});

// Função para obter o usuário logado do sessionStorage
function obterUsuarioLogado() {
    const infoUsuario = sessionStorage.getItem('arandua_current_user');
    if (infoUsuario) {
        try {
            const usuario = JSON.parse(infoUsuario);
            // Verificar se tem a flag isLoggedIn OU se tem dados básicos do usuário
            if (usuario.isLoggedIn || (usuario.id && usuario.nome)) {
                return usuario;
            }
        } catch (erro) {
            console.error('Erro ao analisar usuário:', erro);
        }
    }
    return null;
}

// Configurar a interface do usuário
function configurarInterfaceUsuario(usuario) {
    const botaoUsuario = document.getElementById('userButton');
    if (botaoUsuario) {
        botaoUsuario.textContent = usuario.nome || usuario.username;
    }
    configurarDropdownUsuario();
}

// Configurar botão de voltar
function configurarBotaoVoltar() {
    const botaoVoltar = document.getElementById('backButton');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', function() {
            window.location.href = '../Tela_inicial/inicio.html';
        });
    }
}

// Carregar dados do perfil do usuário
async function carregarPerfilUsuario(usuario) {
    try {
        console.log('Carregando perfil do usuário ID:', usuario.id);
        
        const urlBase = ApiConfig.obterUrlBase();
        
        // TIMEOUT para evitar espera longa
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

        const resposta = await fetch(`${urlBase}/usuarios/${usuario.id}`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!resposta.ok) {
            throw new Error(`Erro ${resposta.status} ao carregar perfil`);
        }

        const dadosUsuario = await resposta.json();
        console.log('✅ Dados do usuário carregados:', dadosUsuario);
        preencherFormularioPerfil(dadosUsuario);
        
    } catch (erro) {
        console.error('❌ Erro ao carregar perfil:', erro);
        
        if (erro.name === 'AbortError') {
            mostrarNotificacao('⏰ Tempo de carregamento esgotado', 'erro');
        } else {
            mostrarNotificacao('Erro ao carregar dados do perfil', 'erro');
        }
        
        // Usar dados do sessionStorage IMEDIATAMENTE como fallback
        const usuarioFallback = obterUsuarioLogado();
        if (usuarioFallback) {
            console.log('🔄 Usando dados do sessionStorage como fallback');
            preencherFormularioPerfil(usuarioFallback);
        }
    }
}

// Preencher formulário com dados do usuário
function preencherFormularioPerfil(dadosUsuario) {
    // Preencher campos básicos primeiro (mais rápido)
    document.getElementById('profileName').value = dadosUsuario.nome || '';
    document.getElementById('profileEmail').value = dadosUsuario.email || '';
    
    // Carregar imagem em segundo plano (não bloquear a UI)
    setTimeout(() => {
        if (dadosUsuario.ft_perfil) {
            carregarPreviewImagemPerfil(dadosUsuario.ft_perfil);
        } else {
            mostrarImagemPerfilPadrao();
        }
    }, 100);
}

// Mostrar imagem de perfil padrão
function mostrarImagemPerfilPadrao() {
    const containerPreview = document.getElementById('imagePreviewContainer');
    const previewImagem = document.getElementById('imagePreview');
    
    if (previewImagem && containerPreview) {
        // Criar uma imagem padrão usando SVG com cor marrom do tema
        const imagemPadraoSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#b36a1f">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
            </svg>
        `;
        
        // Converter SVG para data URL
        const blobSVG = new Blob([imagemPadraoSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blobSVG);
        
        previewImagem.src = url;
        containerPreview.classList.remove('hidden');
        
        console.log('Imagem padrão carregada');
    }
}

// Carregar preview da imagem de perfil
function carregarPreviewImagemPerfil(dadosImagem) {
    const previewImagem = document.getElementById('imagePreview');
    const containerPreview = document.getElementById('imagePreviewContainer');
    
    if (!previewImagem || !containerPreview) return;
    
    // Se não há dados de imagem, mostrar padrão IMEDIATAMENTE
    if (!dadosImagem) {
        mostrarImagemPerfilPadrao();
        return;
    }
    
    // Otimização: Se já for uma URL de data, usar diretamente
    if (dadosImagem.startsWith('data:')) {
        previewImagem.src = dadosImagem;
        containerPreview.classList.remove('hidden');
        return;
    }
    
    // Otimização: Se for URL externa, carregar com timeout
    if (dadosImagem.startsWith('http')) {
        const imagem = new Image();
        imagem.onload = function() {
            previewImagem.src = dadosImagem;
            containerPreview.classList.remove('hidden');
        };
        imagem.onerror = function() {
            mostrarImagemPerfilPadrao();
        };
        imagem.src = dadosImagem;
        
        // Timeout para imagem externa
        setTimeout(() => {
            if (previewImagem.src !== dadosImagem) {
                mostrarImagemPerfilPadrao();
            }
        }, 3000);
        return;
    }
    
    // Para base64 sem prefixo, processar rapidamente
    if (typeof dadosImagem === 'string' && dadosImagem.length > 100) {
        // Tentar apenas JPEG e PNG (mais comuns)
        const formatos = ['image/jpeg', 'image/png'];
        
        const tentarFormato = (indice) => {
            if (indice >= formatos.length) {
                mostrarImagemPerfilPadrao();
                return;
            }
            
            const urlTeste = `data:${formatos[indice]};base64,${dadosImagem}`;
            const imagemTeste = new Image();
            
            imagemTeste.onload = function() {
                previewImagem.src = urlTeste;
                containerPreview.classList.remove('hidden');
            };
            
            imagemTeste.onerror = function() {
                tentarFormato(indice + 1);
            };
            
            imagemTeste.src = urlTeste;
        };
        
        tentarFormato(0);
        return;
    }
    
    // Fallback rápido
    mostrarImagemPerfilPadrao();
}

// Configurar funcionalidades do perfil
function configurarFuncionalidadesPerfil(usuario) {
    const formularioPerfil = document.getElementById('profileForm');
    const botaoCancelar = document.getElementById('cancelProfileBtn');
    const uploadImagem = document.getElementById('profileImageUpload');
    const botaoRemoverImagem = document.getElementById('removeImageBtn');
    const previewImagem = document.getElementById('imagePreview');
    const labelUpload = document.querySelector('label[for="profileImageUpload"]');

    console.log('Configurando funcionalidades do perfil...');

    // Submeter formulário
    formularioPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        await atualizarPerfilUsuario(usuario);
    });

    // Cancelar edição
    botaoCancelar.addEventListener('click', () => {
        window.location.href = '../Tela_inicial/inicio.html';
    });

    // Upload de imagem
    if (uploadImagem && labelUpload) {
        console.log('Configurando upload de imagem...');
        
        // Clique no label para abrir o file input
        labelUpload.addEventListener('click', function(e) {
            e.preventDefault();
            uploadImagem.click();
        });

        uploadImagem.addEventListener('change', function(e) {
            console.log('Arquivo selecionado:', e.target.files[0]);
            const arquivo = e.target.files[0];
            if (arquivo) {
                // Validar tipo de arquivo
                if (!arquivo.type.startsWith('image/')) {
                    mostrarNotificacao('Por favor, selecione apenas imagens (JPG, PNG, GIF)', 'erro');
                    return;
                }

                // Validar tamanho do arquivo (5MB)
                if (arquivo.size > 5 * 1024 * 1024) {
                    mostrarNotificacao('A imagem deve ter menos de 5MB', 'erro');
                    return;
                }

                const leitor = new FileReader();
                leitor.onload = function(e) {
                    console.log('Imagem carregada com sucesso');
                    previewImagem.src = e.target.result;
                    document.getElementById('imagePreviewContainer').classList.remove('hidden');
                    // Resetar o flag de remoção se o usuário adicionar nova imagem
                    document.getElementById('removeProfileImage').value = 'false';
                };
                leitor.onerror = function(erro) {
                    console.error('Erro ao ler arquivo:', erro);
                    mostrarNotificacao('Erro ao carregar imagem', 'erro');
                };
                leitor.readAsDataURL(arquivo);
            }
        });
    } else {
        console.error('Elementos de upload de imagem não encontrados');
    }

    // Remover imagem
    if (botaoRemoverImagem) {
        console.log('Configurando botão de remover imagem...');
        botaoRemoverImagem.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Removendo imagem...');
            mostrarImagemPerfilPadrao();
            uploadImagem.value = '';
            // Marcar para remover a imagem do perfil
            document.getElementById('removeProfileImage').value = 'true';
            mostrarNotificacao('Imagem removida - será salva ao confirmar', 'sucesso');
        });
    } else {
        console.error('Elemento botaoRemoverImagem não encontrado');
    }
}

// Atualizar perfil do usuário
async function atualizarPerfilUsuario(usuario) {
    const nome = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const senha = document.getElementById('profilePassword').value;
    const confirmarSenha = document.getElementById('profileConfirmPassword').value;
    const uploadImagem = document.getElementById('profileImageUpload');
    const removerImagem = document.getElementById('removeProfileImage').value === 'true';

    // Validações RÁPIDAS
    if (!nome) {
        mostrarNotificacao('O nome é obrigatório', 'erro');
        return;
    }

    if (senha || confirmarSenha) {
        if (!senha || !confirmarSenha || senha !== confirmarSenha || senha.length < 6) {
            if (!senha) mostrarNotificacao('Preencha a nova senha', 'erro');
            else if (!confirmarSenha) mostrarNotificacao('Confirme a nova senha', 'erro');
            else if (senha !== confirmarSenha) mostrarNotificacao('As senhas não coincidem', 'erro');
            else if (senha.length < 6) mostrarNotificacao('A senha deve ter pelo menos 6 caracteres', 'erro');
            return;
        }
    }

    // Preparar dados para atualização
    const dadosAtualizacao = {
        nome: nome,
        email: email || null
    };

    // Apenas incluir senha se for fornecida
    if (senha) {
        dadosAtualizacao.senha = senha;
    }

    // Processar imagem de perfil de forma ASSÍNCRONA e RÁPIDA
    if (removerImagem) {
        dadosAtualizacao.ft_perfil = null;
    } else if (uploadImagem.files[0]) {
        try {
            // Limitar tamanho da imagem ANTES de processar
            const arquivo = uploadImagem.files[0];
            if (arquivo.size > 2 * 1024 * 1024) { // 2MB max
                mostrarNotificacao('Imagem muito grande. Máximo 2MB.', 'erro');
                return;
            }
            
            const imagemBase64 = await converterImagemParaBase64(arquivo);
            if (imagemBase64.startsWith('data:')) {
                dadosAtualizacao.ft_perfil = imagemBase64.split(',')[1];
            }
        } catch (erro) {
            console.error('❌ Erro ao processar imagem:', erro);
            mostrarNotificacao('Erro ao processar imagem', 'erro');
            return;
        }
    }

    try {
        const urlBase = ApiConfig.obterUrlBase();
        
        // TIMEOUT para update
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const resposta = await fetch(`${urlBase}/usuarios/${usuario.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosAtualizacao),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!resposta.ok) {
            const textoErro = await resposta;
            throw new Error(`HTTP ${resposta.status}: ${textoErro}`);
        }

        const dados = await resposta.json();

        // Atualizar session storage IMEDIATAMENTE
        atualizarSessaoUsuario({
            nome: dadosAtualizacao.nome,
            email: dadosAtualizacao.email,
            ft_perfil: dadosAtualizacao.ft_perfil
        });

        mostrarNotificacao('✅ Perfil atualizado com sucesso!', 'sucesso');

        // Redirecionar mais rápido
        setTimeout(() => {
            window.location.href = '../Tela_inicial/inicio.html';
        }, 800); // Reduzido de 1500 para 800ms

    } catch (erro) {
        console.error('❌ Erro na API:', erro);
        
        if (erro.name === 'AbortError') {
            mostrarNotificacao('⏰ Tempo de atualização esgotado', 'erro');
        } else {
            // Fallback rápido
            atualizarSessaoUsuario({
                nome: dadosAtualizacao.nome,
                email: dadosAtualizacao.email,
                ft_perfil: dadosAtualizacao.ft_perfil
            });
            mostrarNotificacao('✅ Alterações salvas localmente', 'sucesso');
            setTimeout(() => {
                window.location.href = '../Tela_inicial/inicio.html';
            }, 800);
        }
    }
}

async function salvarPerfilLocalmente(usuario, dadosAtualizacao) {
    try {
        console.log('💾 Salvando perfil localmente (fallback)...');
        
        // Salvar no localStorage
        const perfilUsuario = {
            ...dadosAtualizacao,
            id: usuario.id,
            ultimaAtualizacao: new Date().toISOString()
        };
        
        localStorage.setItem(`perfil_usuario_${usuario.id}`, JSON.stringify(perfilUsuario));
        
        // Atualizar sessionStorage
        const usuarioAtualizado = {
            ...usuario,
            nome: dadosAtualizacao.nome,
            email: dadosAtualizacao.email,
            ft_perfil: dadosAtualizacao.ft_perfil
        };
        sessionStorage.setItem('arandua_current_user', JSON.stringify(usuarioAtualizado));
        
        console.log('✅ Perfil salvo localmente com sucesso');
        return { sucesso: true, mensagem: 'Perfil salvo localmente' };
        
    } catch (erro) {
        console.error('❌ Erro ao salvar localmente:', erro);
        throw new Error('Não foi possível salvar o perfil');
    }
}

// Converter imagem para Base64
function converterImagemParaBase64(arquivo) {
    return new Promise((resolver, rejeitar) => {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            resolver(e.target.result);
        };
        leitor.onerror = function(erro) {
            rejeitar(erro);
        };
        leitor.readAsDataURL(arquivo);
    });
}

// Configurar dropdown do usuário
function configurarDropdownUsuario() {
    const botaoUsuario = document.getElementById('userButton');
    const dropdown = document.getElementById('userDropdown');
    
    console.log('Configurando dropdown:', { botaoUsuario: !!botaoUsuario, dropdown: !!dropdown });
    
    if (botaoUsuario && dropdown) {
        botaoUsuario.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão de usuário clicado');
            dropdown.classList.toggle('hidden');
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!botaoUsuario.contains(e.target) && !dropdown.contains(e.target)) {
                console.log('Fechando dropdown (clique fora)');
                dropdown.classList.add('hidden');
            }
        });
        
        // Prevenir que cliques no dropdown fechem ele
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Configurar ações do dropdown
        configurarAcoesDropdown();
    } else {
        console.error('Elementos do dropdown não encontrados');
    }
}

// Configurar ações do dropdown
function configurarAcoesDropdown() {
    const linksDropdown = document.querySelectorAll('#userDropdown a');
    console.log('Links do dropdown encontrados:', linksDropdown.length);
    
    linksDropdown.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const acao = this.getAttribute('data-action');
            console.log('Ação do dropdown:', acao);
            
            // Fechar dropdown
            document.getElementById('userDropdown').classList.add('hidden');
            
            if (acao === 'edit-profile') {
                // Já estamos na página de edição, não fazer nada
                console.log('Já na página de edição');
            } else if (acao === 'about') {
                window.location.href = '../Tela_sobre/sobre.html';
            } else if (acao === 'logout') {
                fazerLogout();
            }
        });
    });
}

// Fazer logout
function fazerLogout() {
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // Remover notificações existentes
    const notificacoesExistentes = document.querySelectorAll('.notification');
    notificacoesExistentes.forEach(notificacao => {
        if (notificacao.parentNode) {
            notificacao.parentNode.removeChild(notificacao);
        }
    });

    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notification ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'sucesso' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notificacao);
    
    // Animação de entrada
    setTimeout(() => {
        notificacao.style.opacity = '1';
        notificacao.style.transform = 'translateY(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.opacity = '0';
        notificacao.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}

function atualizarSessaoUsuario(novosDadosUsuario) {
    try {
        // Atualizar sessionStorage
        const usuarioAtual = obterUsuarioLogado();
        const usuarioAtualizado = {
            ...usuarioAtual,
            ...novosDadosUsuario,
            ft_perfil: novosDadosUsuario.ft_perfil // Garantir que a foto seja atualizada
        };
        
        sessionStorage.setItem('arandua_current_user', JSON.stringify(usuarioAtualizado));
        console.log('✅ SessionStorage atualizado com nova foto');
        
        // Disparar evento customizado para notificar outras páginas
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
            detail: usuarioAtualizado
        }));
        
    } catch (erro) {
        console.error('❌ Erro ao atualizar sessionStorage:', erro);
    }
}

// Adicionar estilos dinâmicos
const estilosDinamicos = `
    .profile-form {
        max-width: 500px;
        margin: 30px auto;
        padding: 30px;
        background: var(--bubble-bg);
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        position: relative;
    }

    .back-button {
        position: absolute;
        top: 20px;
        left: 20px;
        background: var(--secondary-brown);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: background-color 0.3s;
    }

    .back-button:hover {
        background: var(--primary-brown);
    }

    .profile-form h2 {
        color: var(--primary-brown);
        margin-bottom: 25px;
        text-align: center;
        font-size: 24px;
        margin-top: 0;
        padding-top: 10px;
    }

    .profile-form label {
        display: block;
        margin-bottom: 20px;
        font-weight: 600;
        color: var(--text-dark);
    }

    .profile-form input {
        display: block;
        width: 100%;
        padding: 12px;
        margin-top: 8px;
        border: 2px solid #ddd;
        border-radius: 8px;
        box-sizing: border-box;
        font-size: 16px;
        color: var(--text-dark);
        background: #fff;
        transition: border-color 0.3s;
    }

    .profile-form input:focus {
        outline: none;
        border-color: var(--secondary-brown);
    }

    .image-upload-section {
        margin: 25px 0;
        padding: 20px;
        background: rgba(255,255,255,0.5);
        border-radius: 10px;
        border: 2px dashed #ddd;
    }

    .image-preview-container {
        position: relative;
        margin: 15px 0;
        max-width: 150px;
    }

    .image-preview-container img {
        width: 150px;
        height: 150px;
        object-fit: cover;
        border-radius: 50%;
        border: 3px solid var(--secondary-brown);
        background: var(--primary-brown);
    }

    .remove-image-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: var(--primary-brown);
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s;
    }

    .remove-image-btn:hover {
        background: #7a5230;
    }

    .password-section {
        margin-top: 25px;
        padding-top: 20px;
        border-top: 2px solid #eee;
    }

    .form-note {
        font-size: 14px;
        color: var(--text-muted);
        margin-top: 5px;
        font-style: italic;
    }

    .hidden {
        display: none !important;
    }

    .notification {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    /* Dropdown styles */
    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        min-width: 200px;
        z-index: 1000;
        margin-top: 8px;
    }

    .dropdown-menu ul {
        list-style: none;
        margin: 0;
        padding: 8px 0;
    }

    .dropdown-menu li {
        margin: 0;
    }

    .dropdown-menu a {
        display: block;
        padding: 12px 16px;
        color: #333;
        text-decoration: none;
        transition: background-color 0.2s;
    }

    .dropdown-menu a:hover {
        background-color: #f5f5f5;
    }
`;

const folhaEstilo = document.createElement('style');
folhaEstilo.textContent = estilosDinamicos;
document.head.appendChild(folhaEstilo);