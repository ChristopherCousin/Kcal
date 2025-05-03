// Módulo para gestionar la navegación móvil

/**
 * Inicializa la navegación móvil y configura los event listeners
 */
export function initMobileNav() {
    const navItems = document.querySelectorAll('.mobile-nav .nav-item');
    const cameraButton = document.getElementById('cameraButton');
    
    // Manejar clicks en los items de navegación
    navItems.forEach(item => {
        if (!item.querySelector('.camera-button')) { // Ignorar el botón de cámara
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover clase 'active' de todos los items
                navItems.forEach(i => i.classList.remove('active'));
                
                // Añadir clase 'active' al elemento clicado
                item.classList.add('active');
                
                // Obtener la página destino
                const page = item.getAttribute('data-page');
                navigateTo(page);
            });
        }
    });
    
    // Manejar click en el botón de cámara
    if (cameraButton) {
        cameraButton.addEventListener('click', () => {
            openCamera();
        });
    }
}

/**
 * Navega a una sección específica de la aplicación
 * @param {string} page - Identificador de la página destino
 */
export function navigateTo(page) {
    // Configurar la aplicación para mostrar la página correcta
    console.log(`Navegando a: ${page}`);
    
    // Ocultar todas las secciones
    hideAllSections();
    
    // Mostrar la sección correspondiente
    switch (page) {
        case 'tracking':
            // Mostrar la pantalla de seguimiento/diario
            showTrackingPanel();
            break;
        case 'history':
            // Mostrar el historial
            showHistoryPanel();
            break;
        case 'search':
            // Mostrar búsqueda de alimentos
            showSearchPanel();
            break;
        case 'profile':
            // Mostrar perfil y configuración
            showProfilePanel();
            break;
        default:
            // Por defecto, mostrar seguimiento
            showTrackingPanel();
    }
    
    // Añadir clase para animación de transición
    const mainContent = document.querySelector('.main-container');
    if (mainContent) {
        mainContent.classList.add('page-transition');
        setTimeout(() => {
            mainContent.classList.remove('page-transition');
        }, 300);
    }
}

/**
 * Oculta todas las secciones principales de la aplicación
 */
function hideAllSections() {
    const sections = [
        document.getElementById('calculator-card'),
        document.getElementById('results-card'),
        document.getElementById('history-card'),
        document.getElementById('tracking-panel'),
        document.getElementById('food-tabs')
    ];
    
    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

/**
 * Muestra el panel de seguimiento diario
 */
function showTrackingPanel() {
    const trackingPanel = document.getElementById('tracking-panel');
    const historyCard = document.getElementById('history-card');
    
    if (trackingPanel) trackingPanel.style.display = 'block';
    if (historyCard) historyCard.style.display = 'none';
    
    // Actualizar título de la página
    updatePageTitle('Seguimiento Diario');
}

/**
 * Muestra el panel de historial
 */
function showHistoryPanel() {
    const historyCard = document.getElementById('history-card');
    const trackingPanel = document.getElementById('tracking-panel');
    
    if (historyCard) historyCard.style.display = 'block';
    if (trackingPanel) trackingPanel.style.display = 'none';
    
    // Actualizar título de la página
    updatePageTitle('Historial');
}

/**
 * Muestra el panel de búsqueda de alimentos
 */
function showSearchPanel() {
    const foodTabs = document.getElementById('food-tabs');
    if (foodTabs) {
        foodTabs.style.display = 'block';
        
        // Seleccionar la pestaña de búsqueda
        const searchTab = document.querySelector('.tab-button[data-tab="search"]');
        if (searchTab) {
            searchTab.click();
        }
    }
    
    // Actualizar título de la página
    updatePageTitle('Buscar Alimentos');
}

/**
 * Muestra el panel de perfil y configuración
 */
function showProfilePanel() {
    // Abrir el modal de objetivos como pantalla de perfil temporal
    const goalModal = document.getElementById('goalModal');
    if (goalModal) goalModal.style.display = 'block';
    
    // Actualizar título de la página
    updatePageTitle('Mi Perfil');
}

/**
 * Abre la cámara para tomar una foto de comida
 */
function openCamera() {
    // Mostrar panel de tabs y seleccionar la pestaña de foto
    const foodTabs = document.getElementById('food-tabs');
    if (foodTabs) {
        foodTabs.style.display = 'block';
        
        // Seleccionar la pestaña de foto
        const photoTab = document.querySelector('.tab-button[data-tab="photo"]');
        if (photoTab) {
            photoTab.click();
        }
        
        // Simular click en la zona de upload para abrir la cámara
        setTimeout(() => {
            const uploadZone = document.getElementById('uploadZone');
            if (uploadZone) {
                uploadZone.click();
            }
        }, 100);
    }
}

/**
 * Actualiza el título mostrado en la aplicación
 * @param {string} title - Nuevo título
 */
function updatePageTitle(title) {
    // Si hay un elemento de título en la página, actualizarlo
    const pageTitle = document.querySelector('.app-subtitle');
    if (pageTitle) {
        pageTitle.textContent = title;
    }
} 