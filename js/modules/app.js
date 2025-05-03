// Módulo central de la aplicación - Coordina los diferentes componentes

import { initMobileNav, navigateTo } from './mobile-nav.js';
import { showToast } from '../utils/ui-helpers.js';

/**
 * Inicializa la aplicación con enfoque móvil
 */
export function initApp() {
    console.log('Inicializando la aplicación con enfoque móvil');
    
    // Detectar si es un dispositivo móvil y configurar la interfaz adecuadamente
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('is-mobile', isMobile);
    
    // Inicializar la navegación móvil
    initMobileNav();
    
    // Manejar el redimensionamiento de la ventana
    window.addEventListener('resize', handleResize);
    
    // Inicialmente mostrar la pantalla de seguimiento
    const savedData = loadSavedData();
    
    if (savedData.hasGoals) {
        // Si hay datos guardados, ir a la pantalla de seguimiento
        navigateTo('tracking');
    } else {
        // Si no hay datos, mostrar el modal de configuración inicial
        showOnboarding();
    }
}

/**
 * Maneja el redimensionamiento de la ventana
 */
function handleResize() {
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('is-mobile', isMobile);
}

/**
 * Carga los datos guardados en localStorage
 * @returns {Object} Información sobre los datos guardados
 */
function loadSavedData() {
    const hasProfile = localStorage.getItem('userProfile') !== null;
    const hasGoals = localStorage.getItem('userGoals') !== null;
    
    return {
        hasProfile,
        hasGoals
    };
}

/**
 * Muestra la pantalla de onboarding para nuevos usuarios
 */
function showOnboarding() {
    console.log('Mostrando onboarding para configuración inicial');
    
    // Mostrar modal de objetivos con mensaje personalizado
    const goalModal = document.getElementById('goalModal');
    
    if (goalModal) {
        // Actualizar texto para enfatizar el uso diario
        const modalHeader = goalModal.querySelector('.modal-header h2');
        if (modalHeader) {
            modalHeader.textContent = 'Configuración inicial';
        }
        
        // Añadir mensaje introductorio
        const modalBody = goalModal.querySelector('.modal-body');
        if (modalBody) {
            const introMessage = document.createElement('div');
            introMessage.className = 'intro-message';
            introMessage.innerHTML = `
                <p>¡Bienvenido a Kcal!</p>
                <p>Completa tu información para comenzar a hacer seguimiento de tus comidas diarias con fotos.</p>
            `;
            modalBody.insertBefore(introMessage, modalBody.firstChild);
        }
        
        // Mostrar el modal
        goalModal.style.display = 'block';
    }
}

/**
 * Redirige al usuario a una sección específica
 * @param {string} page - Identificador de la página
 */
export function goToPage(page) {
    navigateTo(page);
} 