// scripts.js - CORRIGIDO para cadastro - VERSÃO FINAL
class ApiConfig {
    static getBaseUrl() {
        // Se estiver no Railway (produção)
        if (window.location.hostname.includes('railway') || 
            window.location.hostname.includes('arandua1') ||
            window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1') {
            return 'https://arandua1-production.up.railway.app';
        }
        // Se estiver localmente
        else {
            return 'http://localhost:3000';
        }
    }

    // Método para fazer fetch automaticamente
    static async fetch(endpoint, options = {}) {
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}${endpoint}`;
        
        console.log(`🌐 Fetching: ${url}`);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('Página de cadastro carregada');
    setupCadastroFunctionality();
});

function setupCadastroFunctionality() {
    const botaoCadastrar = document.getElementById("cadastro_bt");
    const form = document.querySelector('form');

    // REMOVER TODOS OS EVENT LISTENERS EXISTENTES PRIMEIRO
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
    }

    if (botaoCadastrar) {
        const newButton = botaoCadastrar.cloneNode(true);
        botaoCadastrar.parentNode.replaceChild(newButton, botaoCadastrar);
    }

    // CONFIGURAR NOVOS EVENT LISTENERS
    const newForm = document.querySelector('form');
    const newButton = document.getElementById("cadastro_bt");

    if (newForm) {
        newForm.addEventListener('submit', function(e) {
            console.log('Form submit prevenido');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleCadastro();
            return false;
        });
    }

    if (newButton) {
        newButton.addEventListener("click", function(e) {
            console.log('Botão click prevenido');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleCadastro();
            return false;
        });

        // Também prevenir qualquer outro comportamento
        newButton.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });
    }

    // Configurar os botões de mostrar/ocultar senha
    setupPasswordButtons();
}

function setupPasswordButtons() {
    const senhaInput = document.getElementById('senha');
    const confSenhaInput = document.getElementById('confsenha');

    // Configurar toggles de senha de forma mais robusta
    const toggleSenha = document.querySelector('button[onclick*="senha"]');
    const toggleConfSenha = document.querySelector('button[onclick*="confsenha"]');

    // Remover os onclick antigos e usar event listeners
    if (toggleSenha) {
        toggleSenha.removeAttribute('onclick');
        toggleSenha.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePasswordVisibility(senhaInput, toggleSenha);
        });
    }

    if (toggleConfSenha) {
        toggleConfSenha.removeAttribute('onclick');
        toggleConfSenha.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePasswordVisibility(confSenhaInput, toggleConfSenha);
        });
    }
}

function togglePasswordVisibility(input, toggleEl) {
    if (!input) return;
    const isNowText = input.type === 'password';
    input.type = isNowText ? 'text' : 'password';

    if (toggleEl) {
        const icon = toggleEl.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye', !isNowText);
            icon.classList.toggle('fa-eye-slash', isNowText);
        }
    }
}

// Função antiga mantida para compatibilidade com HTML
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
        const isNowText = input.type === 'password';
        input.type = isNowText ? 'text' : 'password';
        icon.classList.toggle('fa-eye', !isNowText);
        icon.classList.toggle('fa-eye-slash', isNowText);
    }
}

async function handleCadastro() {
    console.log('Iniciando processo de cadastro...');

    // Pega os valores dos campos
    const nome = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confsenha = document.getElementById("confsenha").value;

    // Validação
    if (!validateCadastroInputs(nome, email, senha, confsenha)) {
        return;
    }

    showLoading(true);

    try {
        const novoUsuario = {
            nome: nome,
            senha: senha,
            email: email || null,
            ft_perfil: null
        };

        console.log('Enviando para API:', novoUsuario);

         const dados = await ApiConfig.fetch('/usuarios', {
            method: "POST",
            body: JSON.stringify(novoUsuario)
        });

        if (dados) {
            await handleCadastroSucesso(dados, nome);
        } else {
            handleCadastroErro(dados.message || 'Erro ao criar usuário');
        }
    } catch (erro) {
        console.error("Erro ao enviar requisição:", erro);
        showError("❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
    } finally {
        showLoading(false);
    }
}

function validateCadastroInputs(nome, email, senha, confsenha) {
    if (!nome || !senha) {
        showError("⚠️ Nome e senha são obrigatórios.");
        return false;
    }

    if (nome.length < 3) {
        showError("❌ O nome de usuário deve ter pelo menos 3 caracteres.");
        document.getElementById("usuario").focus();
        return false;
    }

    if (senha.length < 6) {
        showError("❌ A senha deve ter pelo menos 6 caracteres.");
        document.getElementById("senha").focus();
        return false;
    }

    if (senha !== confsenha) {
        showError("❌ As senhas não coincidem.");
        document.getElementById("confsenha").focus();
        return false;
    }

    if (email && !isValidEmail(email)) {
        showError("❌ Por favor, insira um email válido.");
        document.getElementById("email").focus();
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function handleCadastroSucesso(dados, nome) {
    console.log('Cadastro bem-sucedido:', dados);
    
    showSuccess("✅ Cadastro realizado com sucesso! Redirecionando...");
    
    const userInfo = {
        id: dados.id || dados.lastID || Date.now(),
        nome: nome,
        email: document.getElementById("email").value.trim() || null,
        num_postagens: 0,
        foto_perfil: null,
        loginTime: new Date().toISOString()
    };
    
    console.log('Salvando usuário no sessionStorage:', userInfo);
    
    sessionStorage.setItem('arandua_current_user', JSON.stringify(userInfo));
    
    const saved = sessionStorage.getItem('arandua_current_user');
    console.log('Verificação - Dados salvos:', saved ? JSON.parse(saved) : 'Falha ao salvar');
    
    // Redirecionar com timeout
    setTimeout(() => {
        console.log('Redirecionando para home...');
        window.location.href = '../Tela_inicial/inicio.html';
    }, 1500);
}

function handleCadastroErro(mensagem) {
    console.error('Erro no cadastro:', mensagem);
    showError(`❌ ${mensagem}`);
    
    document.getElementById("senha").value = '';
    document.getElementById("confsenha").value = '';
    document.getElementById("senha").focus();
}

function showLoading(show) {
    const cadastroButton = document.getElementById("cadastro_bt");
    if (cadastroButton) {
        if (show) {
            cadastroButton.innerHTML = '<div class="loading-spinner"></div> Cadastrando...';
            cadastroButton.disabled = true;
        } else {
            cadastroButton.innerHTML = 'Cadastrar';
            cadastroButton.disabled = false;
        }
    }
}

function showError(message) {
    removeExistingMessages();
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
    
    const cadastroButton = document.getElementById("cadastro_bt");
    if (cadastroButton && cadastroButton.parentNode) {
        cadastroButton.parentNode.insertBefore(errorDiv, cadastroButton);
    }
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccess(message) {
    removeExistingMessages();
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
    
    const cadastroButton = document.getElementById("cadastro_bt");
    if (cadastroButton && cadastroButton.parentNode) {
        cadastroButton.parentNode.insertBefore(successDiv, cadastroButton);
    }
}

function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

// Adicionar CSS para o loading spinner
const style = document.createElement('style');
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
    
    /* Garantir que o botão não tenha comportamento padrão */
    #cadastro_bt {
        cursor: pointer;
    }
    
    #cadastro_bt:focus {
        outline: none;
    }
`;
document.head.appendChild(style);

// Prevenir qualquer comportamento padrão globalmente
document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && form.contains(document.getElementById('cadastro_bt'))) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Submit global prevenido');
        return false;
    }
});

console.log('Script de cadastro carregado com prevenção de recarregamento');