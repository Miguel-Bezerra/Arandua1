// scripts.js - ATUALIZADO com funcionalidade de recuperação de senha - PORTUGUÊS
class ApiConfig {
    static obterUrlBase() {
        if (window.location.hostname.includes('railway') || 
            window.location.hostname !== 'localhost') {
            return 'https://arandua1-production.up.railway.app';
        } else {
            return 'http://localhost:3000';
        }
    }
    
    static async fazerRequisicao(endpoint, opcoes = {}) {
        const urlBase = this.obterUrlBase();
        const url = `${urlBase}${endpoint}`;
        
        console.log(`🌐 Requisição API: ${opcoes.method || 'GET'} ${url}`);
        
        const resposta = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...opcoes.headers
            },
            ...opcoes
        });
        
        return resposta;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('Página carregada - verificando qual página é...');
    
    // Verificar qual página estamos e configurar accordingly
    if (document.getElementById('cadastro_bt')) {
        console.log('Configurando página de cadastro...');
        configurarFuncionalidadeCadastro();
    } else if (document.getElementById('loginButton')) {
        console.log('Configurando página de login...');
        configurarFuncionalidadeLogin();
    } else if (document.getElementById('confirmarButton')) {
        console.log('Configurando página de recuperação de senha...');
        configurarFuncionalidadeRecuperacao();
    }
    
    verificarLoginExistente();
});

// ===== FUNCIONALIDADE DE RECUPERAÇÃO DE SENHA =====
function configurarFuncionalidadeRecuperacao() {
    const botaoConfirmar = document.getElementById("confirmarButton");
    
    if (botaoConfirmar) {
        botaoConfirmar.addEventListener("click", manipularRecuperacaoSenha);
    }

    // Permitir confirmação com Enter
    const inputs = document.querySelectorAll('.recuperar-box input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                manipularRecuperacaoSenha();
            }
        });
    });

    // Configurar os botões de mostrar/ocultar senha
    configurarBotoesSenhaRecuperacao();
}

function configurarBotoesSenhaRecuperacao() {
    // Configurar para nova senha
    const toggleNovaSenha = document.querySelectorAll('.recuperar-box .submit-eye')[0];
    const inputNovaSenha = document.getElementById('novaSenha');
    
    if (toggleNovaSenha && inputNovaSenha) {
        toggleNovaSenha.addEventListener('click', (e) => {
            e.preventDefault();
            alternarVisibilidadeSenha(inputNovaSenha, toggleNovaSenha.querySelector('i'));
        });
    }

    // Configurar para confirmar senha
    const toggleConfirmarSenha = document.querySelectorAll('.recuperar-box .submit-eye')[1];
    const inputConfirmarSenha = document.getElementById('confirmarSenha');
    
    if (toggleConfirmarSenha && inputConfirmarSenha) {
        toggleConfirmarSenha.addEventListener('click', (e) => {
            e.preventDefault();
            alternarVisibilidadeSenha(inputConfirmarSenha, toggleConfirmarSenha.querySelector('i'));
        });
    }
}

async function manipularRecuperacaoSenha() {
    console.log('Iniciando processo de recuperação de senha...');

    // Pega os valores dos campos
    const email = document.getElementById("email").value.trim();
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    // Validação
    if (!validarInputsRecuperacao(email, novaSenha, confirmarSenha)) {
        return;
    }

    mostrarCarregamentoRecuperacao(true);

    try {
        // Primeiro, buscar o usuário pelo email
        const respostaUsuarios = await ApiConfig.fazerRequisicao('/usuarios');
        const usuarios = await respostaUsuarios.json();
        
        const usuario = usuarios.find(user => user.email === email);
        
        if (!usuario) {
            mostrarErroRecuperacao("❌ Email não encontrado. Verifique o email informado.");
            return;
        }

        // Atualizar a senha do usuário
        const usuarioAtualizado = {
            ...usuario,
            senha: novaSenha
        };

        console.log('Atualizando senha do usuário:', usuarioAtualizado);

        const resposta = await ApiConfig.fazerRequisicao(`/usuarios/${usuario.id_usuario}`, {
            method: "PUT",
            body: JSON.stringify(usuarioAtualizado),
        });
        if (resposta.ok) {
            await manipularRecuperacaoSucesso();
        } else {
            const dados = await resposta.json();
            manipularRecuperacaoErro(dados.message || 'Erro ao atualizar senha');
        }
    } catch (erro) {
        console.error("Erro ao enviar requisição:", erro);
        mostrarErroRecuperacao("❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
    } finally {
        mostrarCarregamentoRecuperacao(false);
    }
}

function validarInputsRecuperacao(email, novaSenha, confirmarSenha) {
    if (!email) {
        mostrarErroRecuperacao("⚠️ Email é obrigatório.");
        document.getElementById("email").focus();
        return false;
    }

    if (!validarEmail(email)) {
        mostrarErroRecuperacao("❌ Por favor, insira um email válido.");
        document.getElementById("email").focus();
        return false;
    }

    if (!novaSenha) {
        mostrarErroRecuperacao("⚠️ Nova senha é obrigatória.");
        document.getElementById("novaSenha").focus();
        return false;
    }

    if (novaSenha.length < 6) {
        mostrarErroRecuperacao("❌ A senha deve ter pelo menos 6 caracteres.");
        document.getElementById("novaSenha").focus();
        return false;
    }

    if (novaSenha !== confirmarSenha) {
        mostrarErroRecuperacao("❌ As senhas não coincidem.");
        document.getElementById("confirmarSenha").focus();
        return false;
    }

    return true;
}

async function manipularRecuperacaoSucesso() {
    console.log('Senha atualizada com sucesso!');
    
    mostrarSucessoRecuperacao("✅ Senha atualizada com sucesso! Redirecionando para o login...");
    
    setTimeout(() => {
        window.location.href = '../Tela_login/login.html';
    }, 3000);
}

function manipularRecuperacaoErro(mensagem) {
    console.error('Erro na recuperação:', mensagem);
    mostrarErroRecuperacao(`❌ ${mensagem}`);
    
    // Limpar campos de senha em caso de erro
    document.getElementById("novaSenha").value = '';
    document.getElementById("confirmarSenha").value = '';
    document.getElementById("novaSenha").focus();
}

function mostrarCarregamentoRecuperacao(mostrar) {
    const botaoConfirmar = document.getElementById("confirmarButton");
    if (botaoConfirmar) {
        if (mostrar) {
            botaoConfirmar.innerHTML = '<div class="loading-spinner"></div> Atualizando...';
            botaoConfirmar.disabled = true;
        } else {
            botaoConfirmar.innerHTML = 'CONFIRMAR';
            botaoConfirmar.disabled = false;
        }
    }
}

function mostrarErroRecuperacao(mensagem) {
    removerMensagensExistentesRecuperacao();
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
    
    const botaoConfirmar = document.getElementById("confirmarButton");
    if (botaoConfirmar && botaoConfirmar.parentNode) {
        botaoConfirmar.parentNode.insertBefore(divErro, botaoConfirmar);
    }
    
    setTimeout(() => {
        if (divErro.parentNode) {
            divErro.parentNode.removeChild(divErro);
        }
    }, 5000);
}

function mostrarSucessoRecuperacao(mensagem) {
    removerMensagensExistentesRecuperacao();
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
    
    const botaoConfirmar = document.getElementById("confirmarButton");
    if (botaoConfirmar && botaoConfirmar.parentNode) {
        botaoConfirmar.parentNode.insertBefore(divSucesso, botaoConfirmar);
    }
}

function removerMensagensExistentesRecuperacao() {
    const mensagensExistentes = document.querySelectorAll('.recuperar-box .message');
    mensagensExistentes.forEach(mensagem => {
        if (mensagem.parentNode) {
            mensagem.parentNode.removeChild(mensagem);
        }
    });
}

// ===== FUNCIONALIDADE DE LOGIN =====
function configurarFuncionalidadeLogin() {
    const botaoLogin = document.getElementById("loginButton");
    
    if (botaoLogin) {
        botaoLogin.addEventListener("click", manipularLogin);
    }

    // Configurar toggle de senha para login
    const toggleSenha = document.getElementById('togglePassword');
    const inputSenha = document.getElementById('senha');
    
    if (toggleSenha && inputSenha) {
        toggleSenha.addEventListener('click', (e) => {
            e.preventDefault();
            alternarVisibilidadeSenha(inputSenha, toggleSenha.querySelector('i'));
        });
    }

    // Permitir login com Enter
    const inputs = document.querySelectorAll('.login-box input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                manipularLogin();
            }
        });
    });
}

async function manipularLogin() {
    console.log('Iniciando processo de login...');

    const nome = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!nome || !senha) {
        mostrarErroLogin("⚠️ Usuário e senha são obrigatórios.");
        return;
    }

    mostrarCarregamentoLogin(true);

    try {
        const resposta = await ApiConfig.fazerRequisicao('/usuarios');
        const usuarios = await resposta.json();
        
        const usuario = usuarios.find(user => user.nome === nome && user.senha === senha);
        
        if (usuario) {
            await manipularLoginSucesso(usuario);
        } else {
            manipularLoginErro("❌ Usuário ou senha incorretos.");
        }
    } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        mostrarErroLogin("❌ Erro ao conectar com o servidor.");
    } finally {
        mostrarCarregamentoLogin(false);
    }
}

async function manipularLoginSucesso(usuario) {
    console.log('Login bem-sucedido:', usuario);
    
    // Salvar informações do usuário no sessionStorage
    const infoUsuario = {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        num_postagens: usuario.num_postagens || 0,
        foto_perfil: usuario.foto_perfil,
        loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('arandua_current_user', JSON.stringify(infoUsuario));
    
    mostrarSucessoLogin("✅ Login realizado com sucesso! Redirecionando...");
    
    setTimeout(() => {
        window.location.href = '../Tela_inicial/inicio.html';
    }, 2000);
}

function manipularLoginErro(mensagem) {
    mostrarErroLogin(mensagem);
    document.getElementById("senha").value = '';
    document.getElementById("senha").focus();
}

function mostrarCarregamentoLogin(mostrar) {
    const botaoLogin = document.getElementById("loginButton");
    if (botaoLogin) {
        if (mostrar) {
            botaoLogin.innerHTML = '<div class="loading-spinner"></div> Entrando...';
            botaoLogin.disabled = true;
        } else {
            botaoLogin.innerHTML = 'ENTRAR';
            botaoLogin.disabled = false;
        }
    }
}

function mostrarErroLogin(mensagem) {
    removerMensagensExistentesLogin();
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
    
    const botaoLogin = document.getElementById("loginButton");
    if (botaoLogin && botaoLogin.parentNode) {
        botaoLogin.parentNode.insertBefore(divErro, botaoLogin);
    }
    
    setTimeout(() => {
        if (divErro.parentNode) {
            divErro.parentNode.removeChild(divErro);
        }
    }, 5000);
}

function mostrarSucessoLogin(mensagem) {
    removerMensagensExistentesLogin();
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
    
    const botaoLogin = document.getElementById("loginButton");
    if (botaoLogin && botaoLogin.parentNode) {
        botaoLogin.parentNode.insertBefore(divSucesso, botaoLogin);
    }
}

function removerMensagensExistentesLogin() {
    const mensagensExistentes = document.querySelectorAll('.login-box .message');
    mensagensExistentes.forEach(mensagem => {
        if (mensagem.parentNode) {
            mensagem.parentNode.removeChild(mensagem);
        }
    });
}

// ===== FUNÇÕES GLOBAIS =====
function alternarVisibilidadeSenha(input, icone) {
    if (input.type === 'password') {
        input.type = 'text';
        icone.classList.remove('fa-eye');
        icone.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icone.classList.remove('fa-eye-slash');
        icone.classList.add('fa-eye');
    }
}

function validarEmail(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
}

function verificarLoginExistente() {
    const usuarioAtual = sessionStorage.getItem('arandua_current_user');
    if (usuarioAtual && !window.location.href.includes('login.html') && !window.location.href.includes('cadastro.html') && !window.location.href.includes('recuperar.html')) {
        console.log('Usuário já está logado, redirecionando...');
        window.location.href = '../Tela_inicial/inicio.html';
    }
}

// Adicionar CSS para o loading spinner (se ainda não existir)
if (!document.querySelector('style[data-loading-spinner]')) {
    const estilo = document.createElement('style');
    estilo.setAttribute('data-loading-spinner', 'true');
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
    `;
    document.head.appendChild(estilo);
}