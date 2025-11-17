// profile.js - CORRIGIDO para carregamento de imagem

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

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    const loggedInUser = getLoggedInUser();
    
    if (!loggedInUser) {
        window.location.href = '../Tela_Login/tela_login.html';
        return;
    }

    setupUserInterface(loggedInUser);
    loadUserProfile(loggedInUser);
    setupProfileFunctionality(loggedInUser);
    setupBackButton();
});

// Função para obter o usuário logado do sessionStorage
function getLoggedInUser() {
    const userInfo = sessionStorage.getItem('arandua_current_user');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            if (user.isLoggedIn) {
                return user;
            }
        } catch (error) {
            console.error('Erro ao parsear usuário:', error);
        }
    }
    return null;
}

// Configurar a interface do usuário
function setupUserInterface(user) {
    const userButton = document.getElementById('userButton');
    if (userButton) {
        userButton.textContent = user.nome || user.username;
    }
    setupUserDropdown();
}

// Configurar botão de voltar
function setupBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = '../Tela_inicial/inicio.html';
        });
    }
}

// Carregar dados do perfil do usuário
async function loadUserProfile(user) {
    try {
        console.log('Carregando perfil do usuário ID:', user.id);
        const response = await ApiConfig.fetch(`/usuarios/${user.id}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar perfil');
        }

        const userData = await response.json();
        console.log('Dados do usuário carregados:', userData);
        populateProfileForm(userData);
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showNotification('Erro ao carregar dados do perfil', 'error');
    }
}

// Preencher formulário com dados do usuário
function populateProfileForm(userData) {
    document.getElementById('profileName').value = userData.nome || '';
    document.getElementById('profileEmail').value = userData.email || '';
    
    console.log('Preenchendo formulário:', {
        nome: userData.nome,
        email: userData.email,
        temFoto: !!userData.ft_perfil,
        tipoFoto: typeof userData.ft_perfil,
        valorFoto: userData.ft_perfil ? userData.ft_perfil.substring(0, 50) + '...' : 'null'
    });
    
    // Carregar preview da foto de perfil se existir
    if (userData.ft_perfil) {
        console.log('Carregando foto de perfil existente');
        loadProfileImagePreview(userData.ft_perfil);
    } else {
        console.log('Nenhuma foto de perfil encontrada');
        // Mostrar imagem padrão
        showDefaultProfileImage();
    }
}

// Mostrar imagem de perfil padrão
function showDefaultProfileImage() {
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imagePreview && imagePreviewContainer) {
        // Criar uma imagem padrão usando SVG com cor marrom do tema
        const defaultImageSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#b36a1f">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
            </svg>
        `;
        
        // Converter SVG para data URL
        const svgBlob = new Blob([defaultImageSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        imagePreview.src = url;
        imagePreviewContainer.classList.remove('hidden');
        
        console.log('Imagem padrão carregada');
    }
}

// Carregar preview da imagem de perfil - FUNÇÃO CORRIGIDA
function loadProfileImagePreview(imageData) {
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    console.log('Carregando preview da imagem:', {
        temDados: !!imageData,
        tipo: typeof imageData,
        inicio: imageData ? imageData.substring(0, 30) : 'null'
    });
    
    if (imagePreview && imagePreviewContainer) {
        // Se a imageData for null, undefined ou string vazia
        if (!imageData) {
            console.log('Sem dados de imagem, mostrando padrão');
            showDefaultProfileImage();
            return;
        }
        
        // Se a imageData já for uma URL de data (base64)
        if (imageData.startsWith('data:')) {
            console.log('Imagem já está em formato data URL');
            imagePreview.src = imageData;
            imagePreviewContainer.classList.remove('hidden');
            console.log('Preview da imagem carregado com sucesso (data URL)');
            return;
        }
        
        // Se a imageData for uma URL externa
        if (imageData.startsWith('http')) {
            console.log('Imagem é uma URL externa');
            imagePreview.src = imageData;
            imagePreview.onload = function() {
                imagePreviewContainer.classList.remove('hidden');
                console.log('Preview da imagem carregado com sucesso (URL externa)');
            };
            imagePreview.onerror = function() {
                console.error('Erro ao carregar imagem da URL externa');
                showDefaultProfileImage();
            };
            return;
        }
        
        // Se a imageData for uma string base64 sem o prefixo
        if (typeof imageData === 'string' && imageData.length > 100) {
            console.log('Imagem parece ser base64 sem prefixo, tentando adicionar prefixo');
            // Tentar diferentes formatos
            const formats = ['image/jpeg', 'image/png', 'image/gif'];
            let loaded = false;
            
            for (let format of formats) {
                const testUrl = `data:${format};base64,${imageData}`;
                const testImage = new Image();
                
                testImage.onload = function() {
                    if (!loaded) {
                        loaded = true;
                        console.log(`Imagem carregada com sucesso no formato ${format}`);
                        imagePreview.src = testUrl;
                        imagePreviewContainer.classList.remove('hidden');
                    }
                };
                
                testImage.onerror = function() {
                    console.log(`Formato ${format} falhou`);
                };
                
                testImage.src = testUrl;
            }
            
            // Se nenhum formato funcionar após um tempo, mostrar padrão
            setTimeout(() => {
                if (!loaded) {
                    console.log('Nenhum formato de imagem funcionou, mostrando padrão');
                    showDefaultProfileImage();
                }
            }, 1000);
            
            return;
        }
        
        // Se chegou aqui, não conseguiu carregar a imagem
        console.log('Não foi possível carregar a imagem, mostrando padrão');
        showDefaultProfileImage();
        
    } else {
        console.error('Elementos de preview não encontrados:', {
            imagePreview: !!imagePreview,
            imagePreviewContainer: !!imagePreviewContainer
        });
    }
}

// Configurar funcionalidades do perfil
function setupProfileFunctionality(user) {
    const profileForm = document.getElementById('profileForm');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const profileImageUpload = document.getElementById('profileImageUpload');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const imagePreview = document.getElementById('imagePreview');
    const imageUploadLabel = document.querySelector('label[for="profileImageUpload"]');

    console.log('Configurando funcionalidades do perfil...');

    // Submeter formulário
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUserProfile(user);
    });

    // Cancelar edição
    cancelProfileBtn.addEventListener('click', () => {
        window.location.href = '../Tela_inicial/inicio.html';
    });

    // Upload de imagem
    if (profileImageUpload && imageUploadLabel) {
        console.log('Configurando upload de imagem...');
        
        // Clique no label para abrir o file input
        imageUploadLabel.addEventListener('click', function(e) {
            e.preventDefault();
            profileImageUpload.click();
        });

        profileImageUpload.addEventListener('change', function(e) {
            console.log('Arquivo selecionado:', e.target.files[0]);
            const file = e.target.files[0];
            if (file) {
                // Validar tipo de arquivo
                if (!file.type.startsWith('image/')) {
                    showNotification('Por favor, selecione apenas imagens (JPG, PNG, GIF)', 'error');
                    return;
                }

                // Validar tamanho do arquivo (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('A imagem deve ter menos de 5MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    console.log('Imagem carregada com sucesso');
                    imagePreview.src = e.target.result;
                    document.getElementById('imagePreviewContainer').classList.remove('hidden');
                    // Resetar o flag de remoção se o usuário adicionar nova imagem
                    document.getElementById('removeProfileImage').value = 'false';
                };
                reader.onerror = function(error) {
                    console.error('Erro ao ler arquivo:', error);
                    showNotification('Erro ao carregar imagem', 'error');
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.error('Elementos de upload de imagem não encontrados');
    }

    // Remover imagem
    if (removeImageBtn) {
        console.log('Configurando botão de remover imagem...');
        removeImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Removendo imagem...');
            showDefaultProfileImage();
            profileImageUpload.value = '';
            // Marcar para remover a imagem do perfil
            document.getElementById('removeProfileImage').value = 'true';
            showNotification('Imagem removida - será salva ao confirmar', 'success');
        });
    } else {
        console.error('Elemento removeImageBtn não encontrado');
    }
}

// Atualizar perfil do usuário
async function updateUserProfile(user) {
    const nome = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const senha = document.getElementById('profilePassword').value;
    const confirmarSenha = document.getElementById('profileConfirmPassword').value;
    const profileImageUpload = document.getElementById('profileImageUpload');
    const removeProfileImage = document.getElementById('removeProfileImage').value === 'true';

    console.log('Atualizando perfil:', { 
        nome, 
        email: email || null, 
        senhaFornecida: !!senha, 
        removeProfileImage,
        novaImagem: !!profileImageUpload.files[0]
    });

    // Validações
    if (!nome) {
        showNotification('O nome é obrigatório', 'error');
        return;
    }

    // Validação de senha apenas se o usuário preencher algum campo de senha
    if (senha || confirmarSenha) {
        if (!senha) {
            showNotification('Preencha a nova senha', 'error');
            return;
        }
        
        if (!confirmarSenha) {
            showNotification('Confirme a nova senha', 'error');
            return;
        }
        
        if (senha !== confirmarSenha) {
            showNotification('As senhas não coincidem', 'error');
            return;
        }

        if (senha.length < 6) {
            showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
    }

    // Preparar dados para atualização
    const updateData = {
        nome: nome,
        email: email || null
    };

    // Apenas incluir senha se for fornecida
    if (senha) {
        updateData.senha = senha;
        console.log('Incluindo nova senha na atualização');
    }

    // Processar imagem de perfil
    if (removeProfileImage) {
        updateData.ft_perfil = null;
        console.log('Removendo foto de perfil');
    } else if (profileImageUpload.files[0]) {
        try {
            console.log('Processando nova imagem...');
            const imageBase64 = await convertImageToBase64(profileImageUpload.files[0]);
            updateData.ft_perfil = imageBase64;
            console.log('Imagem convertida para Base64');
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            showNotification('Erro ao processar imagem', 'error');
            return;
        }
    }
    // Se não for remover nem adicionar nova imagem, não enviar ft_perfil (manter atual)

    console.log('Dados para atualização:', { 
        ...updateData, 
        ft_perfil: updateData.ft_perfil ? 'BASE64_DATA' : updateData.ft_perfil 
    });

    // Fazer requisição para atualizar usuário
    try {
        const response = await ApiConfig.fetch(`/usuarios/${user.id}`, {
            method: "PUT",
            body: JSON.stringify(updateData),
        });

        const data = await response.json();
        console.log('Resposta da API:', data);

        if (response.ok) {
            // Atualizar dados do usuário no sessionStorage
            const updatedUser = {
                ...user,
                nome: nome,
                email: email
            };
            sessionStorage.setItem('arandua_current_user', JSON.stringify(updatedUser));
            
            showNotification('Perfil atualizado com sucesso!', 'success');
            
            // Redirecionar após breve delay
            setTimeout(() => {
                window.location.href = '../Tela_inicial/inicio.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Erro ao atualizar perfil');
        }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showNotification(error.message || 'Erro ao atualizar perfil', 'error');
    }
}

// Converter imagem para Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// Configurar dropdown do usuário
function setupUserDropdown() {
    const userButton = document.getElementById('userButton');
    const dropdown = document.getElementById('userDropdown');
    
    console.log('Configurando dropdown:', { userButton: !!userButton, dropdown: !!dropdown });
    
    if (userButton && dropdown) {
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão de usuário clicado');
            dropdown.classList.toggle('hidden');
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userButton.contains(e.target) && !dropdown.contains(e.target)) {
                console.log('Fechando dropdown (clique fora)');
                dropdown.classList.add('hidden');
            }
        });
        
        // Prevenir que cliques no dropdown fechem ele
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Configurar ações do dropdown
        setupDropdownActions();
    } else {
        console.error('Elementos do dropdown não encontrados');
    }
}

// Configurar ações do dropdown
function setupDropdownActions() {
    const dropdownLinks = document.querySelectorAll('#userDropdown a');
    console.log('Links do dropdown encontrados:', dropdownLinks.length);
    
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.getAttribute('data-action');
            console.log('Ação do dropdown:', action);
            
            // Fechar dropdown
            document.getElementById('userDropdown').classList.add('hidden');
            
            if (action === 'edit-profile') {
                // Já estamos na página de edição, não fazer nada
                console.log('Já na página de edição');
            } else if (action === 'about') {
                window.location.href = '../Tela_sobre/sobre.html';
            } else if (action === 'logout') {
                logoutUser();
            }
        });
    });
}

// Fazer logout
function logoutUser() {
    sessionStorage.removeItem('arandua_current_user');
    window.location.href = '../Tela_Login/tela_login.html';
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });

    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Animação de entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Adicionar estilos dinâmicos
const dynamicStyles = `
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

const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);