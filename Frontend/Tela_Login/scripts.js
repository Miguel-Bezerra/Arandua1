// scripts.js

// URL base da API - ajuste conforme sua configuração
class ApiConfig {
    static obterUrlBase() {
        // Para desenvolvimento local (Live Server na porta 5500)
        if (window.location.hostname === '127.0.0.1' && window.location.port === '5500') {
            return 'https://arandua1-production.up.railway.app';
        }
        // Para desenvolvimento local na porta 3000
        else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        // Para produção
        else {
            return 'https://arandua1-production.up.railway.app';
        }
    }
    
    static async fazerRequisicao(endpoint, opcoes = {}) {
        const urlBase = this.obterUrlBase();
        
        console.log(`🌐 Fazendo requisição para: ${urlBase}${endpoint}`);
        
        try {
            const resposta = await fetch(`${urlBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...opcoes.headers
                },
                ...opcoes,
                // Adicionar modo 'cors' explicitamente
                mode: 'cors',
                credentials: 'include' // Se estiver usando cookies/sessions
            });

            console.log(`📡 Status: ${resposta.status}, OK: ${resposta.ok}`);

            if (!resposta.ok) {
                // Tentar obter mensagem de erro do servidor
                let mensagemErro = `Erro ${resposta.status}`;
                try {
                    const dadosErro = await resposta.json();
                    mensagemErro = dadosErro.message || dadosErro.error || mensagemErro;
                } catch {
                    const textoErro = await resposta;
                    mensagemErro = textoErro || mensagemErro;
                }
                
                throw new Error(mensagemErro);
            }

            return await resposta.json();
        } catch (erro) {
            console.error(`❌ Erro na requisição ${endpoint}:`, erro);
            
            // Tratamento específico para erro de CORS
            if (erro.message.includes('Failed to fetch') || erro.message.includes('CORS')) {
                throw new Error('Erro de conexão. Verifique se o servidor está online e acessível.');
            }
            
            throw erro;
        }
    }
}

function mostrarMensagemBancoDadosIndisponivel() {
    const mensagemExistente = document.getElementById('mensagem-banco-indisponivel');
    if (mensagemExistente) return;

    const mensagem = document.createElement('div');
    mensagem.id = 'mensagem-banco-indisponivel';
    mensagem.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            font-family: Arial, sans-serif;
        ">
            <div style="font-weight: bold; margin-bottom: 5px;">⚡ Serviço Temporariamente Instável</div>
            <div style="font-size: 14px; opacity: 0.9;">
                Estamos com instabilidade técnica. Tente novamente em alguns instantes.
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="margin-top: 8px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                Entendi
            </button>
        </div>
    `;
    document.body.appendChild(mensagem);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - configurando eventos...');
    
    // Configurar funcionalidade do olho para mostrar/esconder senha
    configurarVisibilidadeSenha();
    
    // Configurar o evento de login
    configurarFuncionalidadeLogin();
});

// Configurar mostrar/esconder senha
function configurarVisibilidadeSenha() {
    const inputSenha = document.getElementById('senha');
    const botaoToggle = document.getElementById('togglePassword');
    const iconeOlho = botaoToggle.querySelector('i');

    console.log('Configurando visibilidade da senha...');

    if (botaoToggle && inputSenha && iconeOlho) {
        botaoToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botão do olho clicado');
            
            if (inputSenha.type === 'password') {
                inputSenha.type = 'text';
                iconeOlho.classList.remove('fa-eye');
                iconeOlho.classList.add('fa-eye-slash');
            } else {
                inputSenha.type = 'password';
                iconeOlho.classList.remove('fa-eye-slash');
                iconeOlho.classList.add('fa-eye');
            }
        });
    } else {
        console.error('Elementos não encontrados:', {
            botaoToggle: !!botaoToggle,
            inputSenha: !!inputSenha,
            iconeOlho: !!iconeOlho
        });
    }
}

// Configurar funcionalidade de login
function configurarFuncionalidadeLogin() {
    const botaoLogin = document.getElementById('loginButton');

    console.log('Configurando funcionalidade de login...');

    if (botaoLogin) {
        botaoLogin.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botão de login clicado');
            manipularLogin();
        });
    } else {
        console.error('Botão de login não encontrado');
    }

    // Permitir login pressionando Enter
    const inputSenha = document.getElementById('senha');
    const inputUsuario = document.getElementById('usuario');

    if (inputSenha && inputUsuario) {
        [inputUsuario, inputSenha].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('Enter pressionado');
                    manipularLogin();
                }
            });
        });
    } else {
        console.error('Inputs não encontrados:', {
            inputUsuario: !!inputUsuario,
            inputSenha: !!inputSenha
        });
    }
}

// Função principal de login
async function manipularLogin() {
    console.log('🔐 Iniciando processo de login...');

    // Pega os valores dos campos corretos
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    // Usar a função de validação correta
    if (!validarInputsLogin(usuario, senha)) {
        return;
    }

    mostrarCarregamento(true);

    try {
        const dadosLogin = {
            usuario: usuario,
            senha: senha
        };

        console.log('📤 Enviando dados para login:', { usuario: usuario, senha: '***' });

        const urlBase = ApiConfig.obterUrlBase();
        console.log('🌐 URL base:', urlBase);

        // TIMEOUT para evitar espera infinita
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const resposta = await fetch(`${urlBase}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosLogin),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 Status da resposta:', resposta.status);
        console.log('📡 Headers da resposta:', Object.fromEntries(resposta.headers.entries()));

        if (!resposta.ok) {
            let textoErro = 'Erro desconhecido';
            try {
                textoErro = await resposta;
            } catch {
                textoErro = 'Não foi possível ler o erro';
            }
            
            console.error('❌ Erro HTTP:', resposta.status, textoErro);
            
            if (resposta.status === 401) {
                throw new Error('Usuário ou senha incorretos');
            } else if (resposta.status === 404) {
                throw new Error('Serviço de login não encontrado');
            } else {
                throw new Error(`Erro ${resposta.status}: ${textoErro}`);
            }
        }

        // Processar resposta - CORREÇÃO: sempre tentar como JSON primeiro
        let dadosResposta;
        const contentType = resposta.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            dadosResposta = await resposta.json();
        } else {
            // Se não for JSON, tentar como texto e depois parsear
            const textoResposta = await resposta;
            console.log('📄 Resposta como texto:', textoResposta);
            
            try {
                dadosResposta = JSON.parse(textoResposta);
            } catch (parseError) {
                // Se não for JSON válido, criar estrutura básica
                dadosResposta = {
                    message: textoResposta,
                    success: resposta.ok
                };
            }
        }
        
        console.log('✅ Resposta do servidor processada:', dadosResposta);
        
        // Chamar função de sucesso com os dados
        await manipularLoginSucesso(dadosResposta, usuario);

    } catch (erro) {
        console.error("❌ Erro durante o login:", erro);
        
        if (erro.name === 'AbortError') {
            mostrarErro("⏰ Tempo de conexão esgotado. Tente novamente.");
        } else if (erro.message.includes('CORS') || erro.message.includes('Failed to fetch')) {
            mostrarErro("🌐 Erro de conexão. Verifique se o servidor está online.");
        } else {
            mostrarErro(`❌ ${erro.message}`);
        }
        
        // Limpar senha em caso de erro
        document.getElementById("senha").value = '';
        document.getElementById("senha").focus();
    } finally {
        mostrarCarregamento(false);
    }
}

// Função de validação corrigida
function validarInputsLogin(usuario, senha) {
    if (!usuario || !senha) {
        mostrarErro("⚠️ Usuário e senha são obrigatórios.");
        return false;
    }

    // Remover validação de email, pois pode ser usuário ou email
    if (usuario.includes('@')) {
        // Se parece email, validar formato
        if (!validarEmail(usuario)) {
            mostrarErro("❌ Por favor, insira um email válido.");
            document.getElementById("usuario").focus();
            return false;
        }
    }

    if (senha.length < 6) {
        mostrarErro("❌ A senha deve ter pelo menos 6 caracteres.");
        document.getElementById("senha").focus();
        return false;
    }

    return true;
}

function validarEmail(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
}

// Tentar fazer login via API
async function tentarLogin(usuario, senha) {
    try {
        console.log('🔐 Tentando fazer login via /login...');
        
        const urlBase = ApiConfig.obterUrlBase();
        console.log('🔗 URL da API:', urlBase);
        
        const resposta = await fetch(`${urlBase}/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario, senha })
        });

        console.log('📡 Status da resposta:', resposta.status);

        if (!resposta.ok) {
            if (resposta.status === 500) {
                console.error('❌ Erro 500 - provavelmente problema na rota /login');
                const textoErro = await resposta;
                console.error('❌ Detalhes do erro:', textoErro);
                throw new Error('Erro interno no servidor - verifique o console do servidor');
            }
            
            const dadosErro = await resposta.json();
            return {
                sucesso: false,
                mensagem: dadosErro.mensagem || `Erro ${resposta.status} no login`
            };
        }

        const dados = await resposta.json();
        console.log('✅ Resposta do login:', dados);

        if (dados.sucesso) {
            return {
                sucesso: true,
                usuario: dados.usuario
            };
        } else {
            return {
                sucesso: false,
                mensagem: dados.mensagem || 'Erro no login'
            };
        }

    } catch (erro) {
        console.error('❌ Erro na requisição de login:', erro);
        
        // Se for erro de rede, tentar método alternativo
        if (erro.message.includes('Failed to fetch') || erro.message.includes('Network')) {
            console.log('🔄 Tentando método alternativo devido a erro de rede...');
            return await tentarLoginAlternativo(usuario, senha);
        }
        
        throw new Error('Não foi possível conectar com o servidor: ' + erro.message);
    }
}

// Método alternativo de login
async function tentarLoginAlternativo(usuario, senha) {
    try {
        console.log('Tentando método alternativo de login...');
        
        const respostaUsuarios = await ApiConfig.fazerRequisicao('/usuarios');
        const usuarios = await respostaUsuarios.json();
        
        // Tentar por nome
        const usuarioPorNome = usuarios.find(user => 
            user.nome === usuario && user.senha === senha
        );
        if (usuarioPorNome) {
            return {
                sucesso: true,
                usuario: {
                    id: usuarioPorNome.id_usuario,
                    nome: usuarioPorNome.nome,
                    email: usuarioPorNome.email,
                    num_postagens: usuarioPorNome.num_postagens || 0
                }
            };
        }

        // Tentar por email
        const usuarioPorEmail = usuarios.find(user => 
            user.email === usuario && user.senha === senha
        );
        if (usuarioPorEmail) {
            return {
                sucesso: true,
                usuario: {
                    id: usuarioPorEmail.id_usuario,
                    nome: usuarioPorEmail.nome,
                    email: usuarioPorEmail.email,
                    num_postagens: usuarioPorEmail.num_postagens || 0
                }
            };
        }

        return {
            sucesso: false,
            mensagem: 'Usuário ou senha incorretos'
        };
    } catch (erro) {
        console.error('Erro no método alternativo de login:', erro);
        throw new Error('Não foi possível conectar com o servidor');
    }
}

// Manipular login bem-sucedido
async function manipularLoginSucesso(resposta, usuario, senha) {
    try {
        console.log('✅ Login bem-sucedido, processando resposta...');
        console.log('📦 Resposta completa do servidor:', resposta);
        
        // 🎯 CORREÇÃO: Verificar múltiplos formatos de resposta
        let dadosUsuario;
        
        if (resposta && typeof resposta === 'object') {
            // Se a resposta já é um objeto JSON
            dadosUsuario = resposta;
            
            console.log('🔍 Estrutura da resposta:', {
                temSuccess: 'success' in resposta,
                temUser: 'user' in resposta,
                temId: 'id' in resposta,
                temUsuario: 'usuario' in resposta,
                chaves: Object.keys(resposta)
            });
            
        } else {
            // Tentar parsear se for string
            try {
                dadosUsuario = JSON.parse(resposta);
            } catch (parseError) {
                console.error('❌ Não foi possível parsear a resposta:', parseError);
                throw new Error('Formato de resposta inválido do servidor');
            }
        }
        
        console.log('📊 Dados do usuário recebidos:', dadosUsuario);

        // 🎯 CORREÇÃO: Validação flexível dos dados
        let infoUsuario = {};
        
        // Formato 1: Resposta com success e user
        if (dadosUsuario.success && dadosUsuario.user) {
            console.log('✅ Formato 1: success + user');
            infoUsuario = {
                id: dadosUsuario.user.id || dadosUsuario.user.id_usuario,
                nome: dadosUsuario.user.nome || usuario,
                usuario: usuario,
                email: dadosUsuario.user.email || null,
                ft_perfil: dadosUsuario.user.foto_perfil || dadosUsuario.user.ft_perfil || null,
                num_postagens: dadosUsuario.user.num_postagens || 0,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
        }
        // Formato 2: Resposta direta com dados do usuário
        else if (dadosUsuario.id || dadosUsuario.id_usuario) {
            console.log('✅ Formato 2: dados diretos');
            infoUsuario = {
                id: dadosUsuario.id || dadosUsuario.id_usuario,
                nome: dadosUsuario.nome || usuario,
                usuario: usuario,
                email: dadosUsuario.email || null,
                ft_perfil: dadosUsuario.foto_perfil || dadosUsuario.ft_perfil || null,
                num_postagens: dadosUsuario.num_postagens || 0,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
        }
        // Formato 3: Resposta com message (sucesso mas estrutura diferente)
        else if (dadosUsuario.message && dadosUsuario.id) {
            console.log('✅ Formato 3: message + id');
            infoUsuario = {
                id: dadosUsuario.id,
                nome: dadosUsuario.nome || usuario,
                usuario: usuario,
                email: dadosUsuario.email || null,
                ft_perfil: dadosUsuario.foto_perfil || dadosUsuario.ft_perfil || null,
                num_postagens: dadosUsuario.num_postagens || 0,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
        }
        // Formato 4: Tentativa com dados mínimos
        else if (usuario) {
            console.log('⚠️ Formato 4: usando dados mínimos com nome de usuário');
            infoUsuario = {
                id: Date.now(), // ID temporário
                nome: usuario,
                usuario: usuario,
                email: null,
                ft_perfil: null,
                num_postagens: 0,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
        }
        else {
            console.error('❌ Estrutura de dados não reconhecida:', dadosUsuario);
            throw new Error('Estrutura de resposta do servidor não reconhecida');
        }

        // 🎯 VALIDAÇÃO FINAL: Garantir que temos pelo menos um ID e nome
        if (!infoUsuario.id || !infoUsuario.nome) {
            console.error('❌ Dados essenciais faltando após processamento:', infoUsuario);
            throw new Error('Dados do usuário incompletos na resposta do servidor');
        }

        console.log('💾 Salvando usuário no sessionStorage:', infoUsuario);
        
        // Salvar no sessionStorage
        sessionStorage.setItem('arandua_current_user', JSON.stringify(infoUsuario));
        
        // Verificar se salvou corretamente
        const salvo = sessionStorage.getItem('arandua_current_user');
        if (!salvo) {
            throw new Error('Falha ao salvar dados do usuário no navegador');
        }
        
        console.log('✅ Usuário salvo com sucesso:', JSON.parse(salvo));
        
        // Mostrar feedback
        mostrarSucesso("✅ Login realizado com sucesso! Redirecionando...");
        
        // Redirecionar após breve delay
        setTimeout(() => {
            console.log('🔄 Redirecionando para página inicial...');
            window.location.href = '../Tela_inicial/inicio.html';
        }, 1000);
        
    } catch (erro) {
        console.error('❌ Erro ao processar login:', erro);
        
        // 🎯 CORREÇÃO: Mensagens de erro mais específicas
        if (erro.message.includes('Estrutura de resposta')) {
            mostrarErro(`❌ Problema no formato da resposta do servidor. Tente novamente.`);
        } else if (erro.message.includes('Dados do usuário incompletos')) {
            mostrarErro(`❌ Servidor retornou dados incompletos. Contate o suporte.`);
        } else {
            mostrarErro(`❌ Erro ao processar login: ${erro.message}`);
        }
        
        // Limpar dados de login em caso de erro
        sessionStorage.removeItem('arandua_current_user');
    }
}

// Manipular login falho
function manipularLoginFalha(mensagem = 'Usuário ou senha incorretos. Tente novamente.') {
    console.log('Login falhou:', mensagem);
    mostrarErro(mensagem);
    
    // Limpar campo de senha
    document.getElementById('senha').value = '';
    document.getElementById('senha').focus();
    
    // Adicionar animação de shake nos inputs
    tremerInputs();
}

// Mostrar/Esconder loading
function mostrarCarregamento(mostrar) {
    const botaoLogin = document.getElementById('loginButton');
    
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

// Mostrar mensagem de erro
function mostrarErro(mensagem) {
    // Remover mensagens anteriores
    removerMensagensExistentes();
    
    const divErro = document.createElement('div');
    divErro.className = 'message error-message';
    divErro.textContent = mensagem;
    
    // Inserir antes do botão de login
    const botaoLogin = document.getElementById('loginButton');
    if (botaoLogin && botaoLogin.parentNode) {
        botaoLogin.parentNode.insertBefore(divErro, botaoLogin);
    }
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (divErro.parentNode) {
            divErro.parentNode.removeChild(divErro);
        }
    }, 5000);
}

// Mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
    removerMensagensExistentes();
    
    const divSucesso = document.createElement('div');
    divSucesso.className = 'message success-message';
    divSucesso.textContent = mensagem;
    
    const botaoLogin = document.getElementById('loginButton');
    if (botaoLogin && botaoLogin.parentNode) {
        botaoLogin.parentNode.insertBefore(divSucesso, botaoLogin);
    }
}

// Remover mensagens existentes
function removerMensagensExistentes() {
    const mensagensExistentes = document.querySelectorAll('.message');
    mensagensExistentes.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

// Animação de shake nos inputs
function tremerInputs() {
    const inputs = [
        document.getElementById('usuario'),
        document.getElementById('senha')
    ];
    
    inputs.forEach(input => {
        if (input) {
            input.classList.add('shake');
            setTimeout(() => {
                input.classList.remove('shake');
            }, 500);
        }
    });
}

// Adicionar estilos dinâmicos
const estilosDinamicos = `
    .password-container {
        position: relative;
        display: flex;
        align-items: center;
    }
    
    .password-container input {
        flex: 1;
        padding-right: 40px;
    }
    
    .password-toggle {
        position: absolute;
        right: 10px;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 5px;
    }
    
    .password-toggle:hover {
        color: #333;
    }
    
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
        padding: 12px;
        margin: 10px 0;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
    }
    
    .error-message {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
    }
    
    .success-message {
        background-color: #e8f5e8;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
    }
    
    .shake {
        animation: shake 0.5s linear;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }
`;

// Adicionar estilos ao documento
const folhaEstilo = document.createElement('style');
folhaEstilo.textContent = estilosDinamicos;
document.head.appendChild(folhaEstilo);

// ===== FUNÇÕES AUXILIARES PARA OUTRAS PÁGINAS =====

// Verificar se usuário está logado
function verificarUsuarioLogado() {
    const infoUsuario = sessionStorage.getItem('arandua_current_user');
    if (!infoUsuario) {
        return false;
    }
    
    try {
        const usuario = JSON.parse(infoUsuario);
        return usuario.isLoggedIn === true;
    } catch {
        return false;
    }
}

// Fazer logout
function fazerLogout() {
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// Obter usuário atual
function obterUsuarioAtual() {
    const infoUsuario = sessionStorage.getItem('arandua_current_user');
    if (infoUsuario) {
        try {
            return JSON.parse(infoUsuario);
        } catch {
            return null;
        }
    }
    return null;
}

// Verificar autenticação e redirecionar se não estiver logado
function requererAutenticacao() {
    if (!verificarUsuarioLogado()) {
        window.location.href = '../Tela_Login/tela_login.html';
        return false;
    }
    return true;
}

// Fazer requisições autenticadas
async function fazerRequisicaoAutenticada(url, opcoes = {}) {
    const usuario = obterUsuarioAtual();
    if (!usuario) {
        throw new Error('Usuário não autenticado');
    }

    const opcoesPadrao = {
        headers: {
            'Content-Type': 'application/json',
            'User-Id': usuario.id
        },
        ...opcoes
    };

    const resposta = await fetch(url, opcoesPadrao);
    return resposta;
}

// Debug da configuração
console.log('🔧 Configuração carregada:');
console.log('📍 URL atual:', window.location.href);
console.log('🔗 URL da API:', ApiConfig.obterUrlBase());
console.log('👤 Classe ApiConfig disponível:', typeof ApiConfig);

// Teste rápido da API
async function testarConexaoAPI() {
    try {
        const urlBase = ApiConfig.obterUrlBase();
        console.log('🧪 Testando conexão com:', urlBase);
        
        const resposta = await fetch(urlBase);
        console.log('✅ API respondendo:', resposta.status);
        return true;
    } catch (erro) {
        console.error('❌ API não disponível:', erro);
        return false;
    }
}



// Executar teste quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    testarConexaoAPI();
});