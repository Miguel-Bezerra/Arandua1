// scripts.js - ATUALIZADO com funcionalidade de recuperação de senha
class ApiConfig {
    static getBaseUrl() {
        if (window.location.hostname.includes('railway') || 
            window.location.hostname !== 'localhost') {
            return 'https://arandua1-production.up.railway.app';
        } else {
            return 'http://localhost:3000';
        }
    }
    
    static async fetch(endpoint, options = {}) {
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}${endpoint}`;
        
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        return response;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('Página carregada - verificando qual página é...');
    
    // Verificar qual página estamos e configurar accordingly
    if (document.getElementById('cadastro_bt')) {
        console.log('Configurando página de cadastro...');
        setupCadastroFunctionality();
    } else if (document.getElementById('loginButton')) {
        console.log('Configurando página de login...');
        setupLoginFunctionality();
    } else if (document.getElementById('confirmarButton')) {
        console.log('Configurando página de recuperação de senha...');
        setupRecuperacaoFunctionality();
    }
    
    checkExistingLogin();
});

// ===== FUNCIONALIDADE DE RECUPERAÇÃO DE SENHA =====
function setupRecuperacaoFunctionality() {
    const confirmarButton = document.getElementById("confirmarButton");
    
    if (confirmarButton) {
        confirmarButton.addEventListener("click", handleRecuperacaoSenha);
    }

    // Permitir confirmação com Enter
    const inputs = document.querySelectorAll('.recuperar-box input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRecuperacaoSenha();
            }
        });
    });

    // Configurar os botões de mostrar/ocultar senha
    setupPasswordButtonsRecuperacao();
}

function setupPasswordButtonsRecuperacao() {
    // Configurar para nova senha
    const toggleNovaSenha = document.querySelectorAll('.recuperar-box .submit-eye')[0];
    const novaSenhaInput = document.getElementById('novaSenha');
    
    if (toggleNovaSenha && novaSenhaInput) {
        toggleNovaSenha.addEventListener('click', (e) => {
            e.preventDefault();
            togglePasswordVisibility(novaSenhaInput, toggleNovaSenha.querySelector('i'));
        });
    }

    // Configurar para confirmar senha
    const toggleConfirmarSenha = document.querySelectorAll('.recuperar-box .submit-eye')[1];
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    
    if (toggleConfirmarSenha && confirmarSenhaInput) {
        toggleConfirmarSenha.addEventListener('click', (e) => {
            e.preventDefault();
            togglePasswordVisibility(confirmarSenhaInput, toggleConfirmarSenha.querySelector('i'));
        });
    }
}

async function handleRecuperacaoSenha() {
    console.log('Iniciando processo de recuperação de senha...');

    // Pega os valores dos campos
    const email = document.getElementById("email").value.trim();
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    // Validação
    if (!validateRecuperacaoInputs(email, novaSenha, confirmarSenha)) {
        return;
    }

    showLoadingRecuperacao(true);

    try {
        // Primeiro, buscar o usuário pelo email
        const usuariosResponse = await ApiConfig.fetch('/usuarios');
        const usuarios = await usuariosResponse.json();
        
        const usuario = usuarios.find(user => user.email === email);
        
        if (!usuario) {
            showErrorRecuperacao("❌ Email não encontrado. Verifique o email informado.");
            return;
        }

        // Atualizar a senha do usuário
        const usuarioAtualizado = {
            ...usuario,
            senha: novaSenha
        };

        console.log('Atualizando senha do usuário:', usuarioAtualizado);

        const resposta = await ApiConfig.fetch(`/usuarios/${usuario.id_usuario}`, {
            method: "PUT",
            body: JSON.stringify(usuarioAtualizado),
        });
        if (resposta.ok) {
            await handleRecuperacaoSucesso();
        } else {
            const dados = await resposta.json();
            handleRecuperacaoErro(dados.message || 'Erro ao atualizar senha');
        }
    } catch (erro) {
        console.error("Erro ao enviar requisição:", erro);
        showErrorRecuperacao("❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
    } finally {
        showLoadingRecuperacao(false);
    }
}

function validateRecuperacaoInputs(email, novaSenha, confirmarSenha) {
    if (!email) {
        showErrorRecuperacao("⚠️ Email é obrigatório.");
        document.getElementById("email").focus();
        return false;
    }

    if (!isValidEmail(email)) {
        showErrorRecuperacao("❌ Por favor, insira um email válido.");
        document.getElementById("email").focus();
        return false;
    }

    if (!novaSenha) {
        showErrorRecuperacao("⚠️ Nova senha é obrigatória.");
        document.getElementById("novaSenha").focus();
        return false;
    }

    if (novaSenha.length < 6) {
        showErrorRecuperacao("❌ A senha deve ter pelo menos 6 caracteres.");
        document.getElementById("novaSenha").focus();
        return false;
    }

    if (novaSenha !== confirmarSenha) {
        showErrorRecuperacao("❌ As senhas não coincidem.");
        document.getElementById("confirmarSenha").focus();
        return false;
    }

    return true;
}

async function handleRecuperacaoSucesso() {
    console.log('Senha atualizada com sucesso!');
    
    showSuccessRecuperacao("✅ Senha atualizada com sucesso! Redirecionando para o login...");
    
    setTimeout(() => {
        window.location.href = '../Tela_login/login.html';
    }, 3000);
}

function handleRecuperacaoErro(mensagem) {
    console.error('Erro na recuperação:', mensagem);
    showErrorRecuperacao(`❌ ${mensagem}`);
    
    // Limpar campos de senha em caso de erro
    document.getElementById("novaSenha").value = '';
    document.getElementById("confirmarSenha").value = '';
    document.getElementById("novaSenha").focus();
}

function showLoadingRecuperacao(show) {
    const confirmarButton = document.getElementById("confirmarButton");
    if (confirmarButton) {
        if (show) {
            confirmarButton.innerHTML = '<div class="loading-spinner"></div> Atualizando...';
            confirmarButton.disabled = true;
        } else {
            confirmarButton.innerHTML = 'CONFIRMAR';
            confirmarButton.disabled = false;
        }
    }
}

function showErrorRecuperacao(message) {
    removeExistingMessagesRecuperacao();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #ff6b6b;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
    `;
    
    const confirmarButton = document.getElementById("confirmarButton");
    if (confirmarButton && confirmarButton.parentNode) {
        confirmarButton.parentNode.insertBefore(errorDiv, confirmarButton);
    }
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccessRecuperacao(message) {
    removeExistingMessagesRecuperacao();
    const successDiv = document.createElement('div');
    successDiv.className = 'message success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        background: #51cf66;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
    `;
    
    const confirmarButton = document.getElementById("confirmarButton");
    if (confirmarButton && confirmarButton.parentNode) {
        confirmarButton.parentNode.insertBefore(successDiv, confirmarButton);
    }
}

function removeExistingMessagesRecuperacao() {
    const existingMessages = document.querySelectorAll('.recuperar-box .message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

// ===== FUNCIONALIDADE DE LOGIN (se ainda não existir) =====
function setupLoginFunctionality() {
    const loginButton = document.getElementById("loginButton");
    
    if (loginButton) {
        loginButton.addEventListener("click", handleLogin);
    }

    // Configurar toggle de senha para login
    const togglePassword = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha');
    
    if (togglePassword && senhaInput) {
        togglePassword.addEventListener('click', (e) => {
            e.preventDefault();
            togglePasswordVisibility(senhaInput, togglePassword.querySelector('i'));
        });
    }

    // Permitir login com Enter
    const inputs = document.querySelectorAll('.login-box input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    });
}

async function handleLogin() {
    console.log('Iniciando processo de login...');

    const nome = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!nome || !senha) {
        showErrorLogin("⚠️ Usuário e senha são obrigatórios.");
        return;
    }

    showLoadingLogin(true);

    try {
        const resposta = await ApiConfig.fetch('/usuarios');
        const usuarios = await resposta.json();
        
        const usuario = usuarios.find(user => user.nome === nome && user.senha === senha);
        
        if (usuario) {
            await handleLoginSucesso(usuario);
        } else {
            handleLoginErro("❌ Usuário ou senha incorretos.");
        }
    } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        showErrorLogin("❌ Erro ao conectar com o servidor.");
    } finally {
        showLoadingLogin(false);
    }
}

async function handleLoginSucesso(usuario) {
    console.log('Login bem-sucedido:', usuario);
    
    // Salvar informações do usuário no sessionStorage
    const userInfo = {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        num_postagens: usuario.num_postagens || 0,
        foto_perfil: usuario.foto_perfil,
        loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('arandua_current_user', JSON.stringify(userInfo));
    
    showSuccessLogin("✅ Login realizado com sucesso! Redirecionando...");
    
    setTimeout(() => {
        window.location.href = '../Tela_inicial/inicio.html';
    }, 2000);
}

function handleLoginErro(mensagem) {
    showErrorLogin(mensagem);
    document.getElementById("senha").value = '';
    document.getElementById("senha").focus();
}

function showLoadingLogin(show) {
    const loginButton = document.getElementById("loginButton");
    if (loginButton) {
        if (show) {
            loginButton.innerHTML = '<div class="loading-spinner"></div> Entrando...';
            loginButton.disabled = true;
        } else {
            loginButton.innerHTML = 'ENTRAR';
            loginButton.disabled = false;
        }
    }
}

function showErrorLogin(message) {
    removeExistingMessagesLogin();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #ff6b6b;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
    `;
    
    const loginButton = document.getElementById("loginButton");
    if (loginButton && loginButton.parentNode) {
        loginButton.parentNode.insertBefore(errorDiv, loginButton);
    }
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccessLogin(message) {
    removeExistingMessagesLogin();
    const successDiv = document.createElement('div');
    successDiv.className = 'message success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        background: #51cf66;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
    `;
    
    const loginButton = document.getElementById("loginButton");
    if (loginButton && loginButton.parentNode) {
        loginButton.parentNode.insertBefore(successDiv, loginButton);
    }
}

function removeExistingMessagesLogin() {
    const existingMessages = document.querySelectorAll('.login-box .message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

// ===== FUNÇÕES GLOBAIS =====
function togglePasswordVisibility(input, icon) {
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function checkExistingLogin() {
    const currentUser = sessionStorage.getItem('arandua_current_user');
    if (currentUser && !window.location.href.includes('login.html') && !window.location.href.includes('cadastro.html') && !window.location.href.includes('recuperar.html')) {
        console.log('Usuário já está logado, redirecionando...');
        window.location.href = '../Tela_inicial/inicio.html';
    }
}

// Adicionar CSS para o loading spinner (se ainda não existir)
if (!document.querySelector('style[data-loading-spinner]')) {
    const style = document.createElement('style');
    style.setAttribute('data-loading-spinner', 'true');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
}