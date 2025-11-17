// about.js - Funcionalidades para a página Sobre

const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    const loggedInUser = getLoggedInUser();
    
    if (!loggedInUser) {
        window.location.href = '../Tela_Login/tela_login.html';
        return;
    }

    setupUserInterface(loggedInUser);
    setupBackButton();
    setupUserDropdown();
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

// Configurar dropdown do usuário
function setupUserDropdown() {
    const userButton = document.getElementById('userButton');
    const dropdown = document.getElementById('userDropdown');
    
    console.log('Configurando dropdown:', { 
        userButton: !!userButton, 
        dropdown: !!dropdown 
    });
    
    if (userButton && dropdown) {
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão de usuário clicado');
            // Use toggle na classe hidden
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
                window.location.href = '../Tela_perfil/perfil.html';
            } else if (action === 'about') {
                // Já estamos na página sobre, não fazer nada
                console.log('Já na página sobre');
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

// Adicionar estilos dinâmicos para a página about
const dynamicStyles = `
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
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);