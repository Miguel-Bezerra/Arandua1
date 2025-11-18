// scripts.js - CORRIGIDO para cadastro - VERSÃO FINAL - PORTUGUÊS
class ApiConfig {
    static obterUrlBase() {
        // Se estiver no Railway (produção)
        if (window.location.hostname.includes('railway') || 
            window.location.hostname.includes('arandua1') ||
            window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1') {
            return 'https://arandua1-production.up.railway.app/api';
        }
        // Se estiver localmente
        else {
            return 'http://localhost:3000';
        }
    }

    // Método para fazer fetch automaticamente
    static async fazerRequisicao(endpoint, opcoes = {}) {
        const urlBase = this.obterUrlBase();
        const url = `${urlBase}${endpoint}`;
        
        console.log(`🌐 Fazendo requisição: ${url}`);
        
        try {
            const resposta = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...opcoes.headers
                },
                ...opcoes
            });
            
            if (!resposta.ok) {
                throw new Error(`Erro HTTP! status: ${resposta.status}`);
            }
            
            return await resposta.json();
        } catch (erro) {
            console.error('❌ Erro na API:', erro);
            throw erro;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('Página de cadastro carregada');
    configurarFuncionalidadeCadastro();
});

function configurarFuncionalidadeCadastro() {
    const botaoCadastrar = document.getElementById("cadastro_bt");
    const formulario = document.querySelector('form');

    // REMOVER TODOS OS EVENT LISTENERS EXISTENTES PRIMEIRO
    if (formulario) {
        const novoFormulario = formulario.cloneNode(true);
        formulario.parentNode.replaceChild(novoFormulario, formulario);
    }

    if (botaoCadastrar) {
        const novoBotao = botaoCadastrar.cloneNode(true);
        botaoCadastrar.parentNode.replaceChild(novoBotao, botaoCadastrar);
    }

    // CONFIGURAR NOVOS EVENT LISTENERS
    const novoFormulario = document.querySelector('form');
    const novoBotao = document.getElementById("cadastro_bt");

    if (novoFormulario) {
        novoFormulario.addEventListener('submit', function(e) {
            console.log('Submit do formulário prevenido');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            manipularCadastro();
            return false;
        });
    }

    if (novoBotao) {
        novoBotao.addEventListener("click", function(e) {
            console.log('Clique no botão prevenido');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            manipularCadastro();
            return false;
        });

        // Também prevenir qualquer outro comportamento
        novoBotao.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });
    }

    // Configurar os botões de mostrar/ocultar senha
    configurarBotoesSenha();
}

function configurarBotoesSenha() {
    const inputSenha = document.getElementById('senha');
    const inputConfSenha = document.getElementById('confsenha');

    // Configurar toggles de senha de forma mais robusta
    const toggleSenha = document.querySelector('button[onclick*="senha"]');
    const toggleConfSenha = document.querySelector('button[onclick*="confsenha"]');

    // Remover os onclick antigos e usar event listeners
    if (toggleSenha) {
        toggleSenha.removeAttribute('onclick');
        toggleSenha.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            alternarVisibilidadeSenha(inputSenha, toggleSenha);
        });
    }

    if (toggleConfSenha) {
        toggleConfSenha.removeAttribute('onclick');
        toggleConfSenha.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            alternarVisibilidadeSenha(inputConfSenha, toggleConfSenha);
        });
    }
}

function alternarVisibilidadeSenha(input, elementoToggle) {
    if (!input) return;
    const agoraTexto = input.type === 'password';
    input.type = agoraTexto ? 'text' : 'password';

    if (elementoToggle) {
        const icone = elementoToggle.querySelector('i');
        if (icone) {
            icone.classList.toggle('fa-eye', !agoraTexto);
            icone.classList.toggle('fa-eye-slash', agoraTexto);
        }
    }
}

// Função antiga mantida para compatibilidade com HTML
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icone = document.getElementById(iconId);
    if (input && icone) {
        const agoraTexto = input.type === 'password';
        input.type = agoraTexto ? 'text' : 'password';
        icone.classList.toggle('fa-eye', !agoraTexto);
        icone.classList.toggle('fa-eye-slash', agoraTexto);
    }
}

async function manipularCadastro() {
    console.log('Iniciando processo de cadastro...');

    // Pega os valores dos campos
    const nome = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confSenha = document.getElementById("confsenha").value;

    // Validação
    if (!validarInputsCadastro(nome, email, senha, confSenha)) {
        return;
    }

    mostrarCarregamento(true);

    try {
        const novoUsuario = {
            nome: nome,
            senha: senha,
            email: email || null,
            ft_perfil: null
        };

        console.log('Enviando para API:', novoUsuario);

        // TIMEOUT para evitar espera infinita
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

        const urlBase = ApiConfig.obterUrlBase();
        const resposta = await fetch(`${urlBase}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(novoUsuario),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!resposta.ok) {
            const textoErro = await resposta;
            throw new Error(`HTTP ${resposta.status}: ${textoErro}`);
        }

        const dados = await resposta.json();
        
        if (dados) {
            await manipularCadastroSucesso(dados, nome);
        } else {
            manipularCadastroErro(dados?.message || 'Erro ao criar usuário');
        }
    } catch (erro) {
        console.error("Erro ao enviar requisição:", erro);
        if (erro.name === 'AbortError') {
            mostrarErro("⏰ Tempo de conexão esgotado. Tente novamente.");
        } else {
            mostrarErro("❌ Erro ao conectar com o servidor.");
        }
    } finally {
        mostrarCarregamento(false);
    }
}

function validarInputsCadastro(nome, email, senha, confSenha) {
    if (!nome || !senha) {
        mostrarErro("⚠️ Nome e senha são obrigatórios.");
        return false;
    }

    if (nome.length < 3) {
        mostrarErro("❌ O nome de usuário deve ter pelo menos 3 caracteres.");
        document.getElementById("usuario").focus();
        return false;
    }

    if (senha.length < 6) {
        mostrarErro("❌ A senha deve ter pelo menos 6 caracteres.");
        document.getElementById("senha").focus();
        return false;
    }

    if (senha !== confSenha) {
        mostrarErro("❌ As senhas não coincidem.");
        document.getElementById("confsenha").focus();
        return false;
    }

    if (email && !validarEmail(email)) {
        mostrarErro("❌ Por favor, insira um email válido.");
        document.getElementById("email").focus();
        return false;
    }

    return true;
}

function validarEmail(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
}

async function manipularCadastroSucesso(dados, nome) {
    console.log('Cadastro bem-sucedido:', dados);
    
    mostrarSucesso("✅ Cadastro realizado com sucesso!");
    
    const infoUsuario = {
        id: dados.id || dados.lastID || Date.now(),
        nome: nome,
        email: document.getElementById("email").value.trim() || null,
        num_postagens: 0,
        foto_perfil: null,
        loginTime: new Date().toISOString(),
        isLoggedIn: true
    };
    
    // Salvar imediatamente sem delay desnecessário
    sessionStorage.setItem('arandua_current_user', JSON.stringify(infoUsuario));
    
    // Redirecionar mais rápido
    setTimeout(() => {
        window.location.href = '../Tela_inicial/inicio.html';
    }, 800); // Reduzido de 1500 para 800ms
}

function manipularCadastroErro(mensagem) {
    console.error('Erro no cadastro:', mensagem);
    mostrarErro(`❌ ${mensagem}`);
    
    document.getElementById("senha").value = '';
    document.getElementById("confsenha").value = '';
    document.getElementById("senha").focus();
}

function mostrarCarregamento(mostrar) {
    const botaoCadastro = document.getElementById("cadastro_bt");
    if (botaoCadastro) {
        if (mostrar) {
            botaoCadastro.innerHTML = '<div class="loading-spinner"></div> Cadastrando...';
            botaoCadastro.disabled = true;
        } else {
            botaoCadastro.innerHTML = 'Cadastrar';
            botaoCadastro.disabled = false;
        }
    }
}

function mostrarErro(mensagem) {
    removerMensagensExistentes();
    const divErro = document.createElement('div');
    divErro.className = 'message error-message';
    divErro.textContent = mensagem;
    divErro.style.cssText = `
        background: #ff6b6b;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
    `;
    
    const botaoCadastro = document.getElementById("cadastro_bt");
    if (botaoCadastro && botaoCadastro.parentNode) {
        botaoCadastro.parentNode.insertBefore(divErro, botaoCadastro);
    }
    
    setTimeout(() => {
        if (divErro.parentNode) {
            divErro.parentNode.removeChild(divErro);
        }
    }, 5000);
}

function mostrarSucesso(mensagem) {
    removerMensagensExistentes();
    const divSucesso = document.createElement('div');
    divSucesso.className = 'message success-message';
    divSucesso.textContent = mensagem;
    divSucesso.style.cssText = `
        background: #51cf66;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
    `;
    
    const botaoCadastro = document.getElementById("cadastro_bt");
    if (botaoCadastro && botaoCadastro.parentNode) {
        botaoCadastro.parentNode.insertBefore(divSucesso, botaoCadastro);
    }
}

function removerMensagensExistentes() {
    const mensagensExistentes = document.querySelectorAll('.message');
    mensagensExistentes.forEach(mensagem => {
        if (mensagem.parentNode) {
            mensagem.parentNode.removeChild(mensagem);
        }
    });
}

// Adicionar CSS para o loading spinner
const estilo = document.createElement('style');
estilo.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .message {
        transition: all 0.3s ease;
    }
    
    /* Garantir que o botão não tenha comportamento padrão */
    #cadastro_bt {
        cursor: pointer;
    }
    
    #cadastro_bt:focus {
        outline: none;
    }
`;
document.head.appendChild(estilo);

// Prevenir qualquer comportamento padrão globalmente
document.addEventListener('submit', function(e) {
    const formulario = e.target;
    if (formulario && formulario.contains(document.getElementById('cadastro_bt'))) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Submit global prevenido');
        return false;
    }
});

console.log('Script de cadastro carregado com prevenção de recarregamento');