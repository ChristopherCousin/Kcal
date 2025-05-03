// Módulo central de la aplicación - Coordina los diferentes componentes

import { initMobileNav, navigateTo } from './mobile-nav.js';
import { showToast } from '../utils/ui-helpers.js';
import { initPhotoHandler } from './photo-handler.js';

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
    
    // Inicializar el manejador de fotos
    initPhotoHandler();
    
    // Manejar el redimensionamiento de la ventana
    window.addEventListener('resize', handleResize);
    
    // Cargar datos guardados y mostrar contenido apropiado
    loadSavedEntries();
    
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
 * Carga las entradas de comida guardadas en localStorage
 */
function loadSavedEntries() {
    try {
        // Obtener entradas guardadas
        const entries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
        
        // Si no hay entradas, no hacer nada
        if (entries.length === 0) {
            return;
        }
        
        console.log(`Cargando ${entries.length} entradas guardadas`);
        
        // Inicializar contadores
        let totalKcal = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        // Obtener lista de entradas
        const entriesList = document.getElementById('entriesList');
        if (!entriesList) return;
        
        // Limpiar lista
        entriesList.innerHTML = '';
        
        // Filtrar solo entradas de hoy (simplificado)
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = entries.filter(entry => 
            entry.timestamp.split('T')[0] === today
        );
        
        // Si no hay entradas de hoy, mostrar mensaje
        if (todayEntries.length === 0) {
            entriesList.innerHTML = '<li class="no-entries">No has añadido ninguna comida hoy.</li>';
            return;
        }
        
        // Ordenar por timestamp (más reciente primero)
        todayEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Añadir entradas a la lista y sumar totales
        todayEntries.forEach(entry => {
            // Sumar a los totales
            totalKcal += entry.calories || 0;
            totalProtein += entry.macros.protein || 0;
            totalCarbs += entry.macros.carbs || 0;
            totalFat += entry.macros.fat || 0;
            
            // Crear elemento de lista
            const listItem = document.createElement('li');
            listItem.className = 'entry-item';
            listItem.dataset.id = entry.id;
            
            // Formato de hora
            const timestamp = new Date(entry.timestamp);
            const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Crear contenido HTML
            listItem.innerHTML = `
                <div class="entry-thumbnail">
                    <img src="${entry.imageUrl}" alt="Comida">
                </div>
                <div class="entry-content">
                    <div class="entry-header">
                        <h4>${entry.foods.join(', ').substring(0, 30)}${entry.foods.join(', ').length > 30 ? '...' : ''}</h4>
                        <span class="entry-time">${timeStr}</span>
                    </div>
                    <div class="entry-macros">
                        <span class="entry-macro">${entry.calories} kcal</span>
                        <span class="entry-macro">P: ${entry.macros.protein}g</span>
                        <span class="entry-macro">C: ${entry.macros.carbs}g</span>
                        <span class="entry-macro">G: ${entry.macros.fat}g</span>
                    </div>
                </div>
                <button class="entry-delete" data-id="${entry.id}">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            `;
            
            // Añadir a la lista
            entriesList.appendChild(listItem);
            
            // Añadir evento para borrar
            const deleteButton = listItem.querySelector('.entry-delete');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    deleteEntry(entry.id);
                });
            }
        });
        
        // Actualizar totales en la UI
        document.getElementById('kcalTotal').textContent = totalKcal;
        document.getElementById('proteinTotal').textContent = totalProtein;
        document.getElementById('carbTotal').textContent = totalCarbs;
        document.getElementById('fatTotal').textContent = totalFat;
        
        // Actualizar barras de progreso
        updateProgressBars();
        
    } catch (error) {
        console.error('Error al cargar entradas guardadas:', error);
    }
}

/**
 * Actualiza las barras de progreso en base a los valores actuales
 */
function updateProgressBars() {
    // Obtener valores actuales
    const currentKcal = parseInt(document.getElementById('kcalTotal').textContent || '0');
    const goalKcal = parseInt(document.getElementById('kcalGoal').textContent || '0');
    
    // Si no hay objetivo, intentar obtenerlo de localStorage
    let goal = goalKcal;
    if (goal === 0) {
        try {
            const userGoals = JSON.parse(localStorage.getItem('userGoals') || '{}');
            goal = userGoals.calories || 2000; // Valor por defecto si no hay dato
            document.getElementById('kcalGoal').textContent = goal;
        } catch (error) {
            console.error('Error al obtener objetivo de calorías:', error);
        }
    }
    
    // Calcular porcentaje
    const percentage = goal > 0 ? Math.min(Math.round((currentKcal / goal) * 100), 100) : 0;
    
    // Actualizar UI
    document.getElementById('kcalPercentage').textContent = percentage;
    
    // Actualizar anillo de progreso
    const mainRing = document.getElementById('mainGoalRing');
    if (mainRing) {
        const circumference = 2 * Math.PI * 70; // radio = 70
        mainRing.style.strokeDasharray = circumference;
        const offset = circumference - (percentage / 100) * circumference;
        mainRing.style.strokeDashoffset = offset;
    }
    
    // Actualizar barras de macros
    updateMacroProgressBars();
}

/**
 * Actualiza las barras de progreso para los macronutrientes
 */
function updateMacroProgressBars() {
    try {
        // Obtener valores actuales
        const currentProtein = parseInt(document.getElementById('proteinTotal').textContent || '0');
        const currentCarbs = parseInt(document.getElementById('carbTotal').textContent || '0');
        const currentFat = parseInt(document.getElementById('fatTotal').textContent || '0');
        
        // Intentar obtener objetivos de macros
        const userGoals = JSON.parse(localStorage.getItem('userGoals') || '{}');
        
        // Objetivos de macros (usar valores por defecto si no existen)
        const proteinGoal = userGoals.protein || 150;
        const carbsGoal = userGoals.carbs || 200;
        const fatGoal = userGoals.fat || 70;
        
        // Calcular porcentajes
        const proteinPercentage = Math.min(Math.round((currentProtein / proteinGoal) * 100), 100);
        const carbsPercentage = Math.min(Math.round((currentCarbs / carbsGoal) * 100), 100);
        const fatPercentage = Math.min(Math.round((currentFat / fatGoal) * 100), 100);
        
        // Actualizar barras
        const proteinBar = document.getElementById('proteinProgressBar');
        const carbsBar = document.getElementById('carbProgressBar');
        const fatBar = document.getElementById('fatProgressBar');
        
        if (proteinBar) proteinBar.style.width = `${proteinPercentage}%`;
        if (carbsBar) carbsBar.style.width = `${carbsPercentage}%`;
        if (fatBar) fatBar.style.width = `${fatPercentage}%`;
        
    } catch (error) {
        console.error('Error al actualizar barras de macros:', error);
    }
}

/**
 * Elimina una entrada de comida
 * @param {number} id - ID de la entrada a eliminar
 */
function deleteEntry(id) {
    try {
        // Obtener entradas existentes
        const entries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
        
        // Encontrar la entrada a eliminar
        const entryIndex = entries.findIndex(entry => entry.id === parseInt(id));
        
        if (entryIndex === -1) {
            showToast('Entrada no encontrada', 'error');
            return;
        }
        
        // Obtener la entrada para restar sus valores
        const entry = entries[entryIndex];
        
        // Restar del total
        const currentKcal = parseInt(document.getElementById('kcalTotal').textContent || '0');
        const currentProtein = parseInt(document.getElementById('proteinTotal').textContent || '0');
        const currentCarbs = parseInt(document.getElementById('carbTotal').textContent || '0');
        const currentFat = parseInt(document.getElementById('fatTotal').textContent || '0');
        
        document.getElementById('kcalTotal').textContent = currentKcal - entry.calories;
        document.getElementById('proteinTotal').textContent = currentProtein - entry.macros.protein;
        document.getElementById('carbTotal').textContent = currentCarbs - entry.macros.carbs;
        document.getElementById('fatTotal').textContent = currentFat - entry.macros.fat;
        
        // Actualizar barras
        updateProgressBars();
        
        // Eliminar del array
        entries.splice(entryIndex, 1);
        
        // Guardar en localStorage
        localStorage.setItem('foodEntries', JSON.stringify(entries));
        
        // Eliminar de la UI
        const listItem = document.querySelector(`.entry-item[data-id="${id}"]`);
        if (listItem) {
            listItem.remove();
        }
        
        // Si no hay más entradas, mostrar mensaje
        if (entries.length === 0) {
            const entriesList = document.getElementById('entriesList');
            if (entriesList) {
                entriesList.innerHTML = '<li class="no-entries">No has añadido ninguna comida hoy.</li>';
            }
        }
        
        showToast('Entrada eliminada', 'success');
        
    } catch (error) {
        console.error('Error al eliminar entrada:', error);
        showToast('Error al eliminar la entrada', 'error');
    }
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
            // Verificar si ya existe un mensaje introductorio
            if (!modalBody.querySelector('.intro-message')) {
                const introMessage = document.createElement('div');
                introMessage.className = 'intro-message';
                introMessage.innerHTML = `
                    <p>¡Bienvenido a Kcal!</p>
                    <p>Completa tu información para comenzar a hacer seguimiento de tus comidas diarias con fotos.</p>
                `;
                modalBody.insertBefore(introMessage, modalBody.firstChild);
            }
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