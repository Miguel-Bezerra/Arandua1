const URL_BASE_API = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    const usuarioLogado = obterUsuarioLogado();
    
    if (!usuarioLogado) {
        window.location.href = '../Tela_Login/tela_login.html';
        return;
    }

    configurarInterfaceUsuario(usuarioLogado);
    configurarBotaoVoltar();
    configurarDropdownUsuario();
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

// Configurar dropdown do usuário
function configurarDropdownUsuario() {
    const botaoUsuario = document.getElementById('userButton');
    const dropdown = document.getElementById('userDropdown');
    
    console.log('Configurando dropdown:', { 
        botaoUsuario: !!botaoUsuario, 
        dropdown: !!dropdown 
    });
    
    if (botaoUsuario && dropdown) {
        botaoUsuario.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão de usuário clicado');
            // Usar toggle na classe hidden
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
            
            // Obter ação do data-action ou do href
            let acao = this.getAttribute('data-action');
            const href = this.getAttribute('href');
            
            console.log('Ação do dropdown:', { acao, href });
            
            // Se não tem data-action, determinar pela URL
            if (!acao) {
                if (href.includes('perfil.html')) {
                    acao = 'edit-profile';
                } else if (href.includes('sobre.html')) {
                    acao = 'about';
                } else if (href === '#' || href.includes('logout')) {
                    acao = 'logout';
                }
            }
            
            // Fechar dropdown
            document.getElementById('userDropdown').classList.add('hidden');
            
            // Executar ação baseada no tipo
            if (acao === 'edit-profile') {
                console.log('🔄 Indo para editar perfil...');
                window.location.href = '../Tela_perfil/perfil.html';
            } else if (acao === 'about') {
                console.log('ℹ️ Já na página sobre');
                // Já estamos na página sobre, não fazer nada
            } else if (acao === 'logout') {
                console.log('🚪 Fazendo logout...');
                fazerLogout();
            } else {
                // Fallback: seguir o link normalmente
                console.log('🔗 Seguindo link normalmente:', href);
                if (href && href !== '#') {
                    window.location.href = href;
                }
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

// Adicionar estilos dinâmicos para a página about
const estilosDinamicos = `
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
        z-index: 100;
    }

    .back-button:hover {
        background: var(--primary-brown);
    }

    .about-page-content {
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        min-height: calc(100vh - 80px);
    }

    .about-card {
        background: var(--bubble-bg);
        border-radius: 15px;
        padding: 40px;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        position: relative;
        margin-top: 40px;
    }

    .about-text-content h2 {
        color: var(--primary-brown);
        margin-bottom: 20px;
        text-align: center;
        font-size: 24px;
    }

    .about-text-content p {
        color: var(--text-dark);
        line-height: 1.6;
        margin-bottom: 15px;
        text-align: justify;
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

    .hidden {
        display: none !important;
    }

    .notification {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
`;

// Adicionar estilos ao documento
const folhaEstilo = document.createElement('style');
folhaEstilo.textContent = estilosDinamicos;
document.head.appendChild(folhaEstilo);