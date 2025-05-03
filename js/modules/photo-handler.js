// Módulo para manejar la captura y análisis de fotos de comida
import { analyzeFood } from '../services/openai-service.js';
import { showToast } from '../utils/ui-helpers.js';

// Referencias a elementos DOM
let uploadZone, foodPhotoInput, photoPreview, previewImage;
let analyzeButton, retakeButton, aiAnalysisModal;
let aiLoadingIndicator, aiResultContent;
let detectedFoodsList, confirmAiButton;
let analyzedImageElement;

// Datos del análisis actual
let currentAnalysisResult = null;

/**
 * Inicializa el módulo de manejo de fotos
 */
export function initPhotoHandler() {
    console.log('Inicializando módulo de manejo de fotos');
    
    // Obtener referencias a elementos DOM
    uploadZone = document.getElementById('uploadZone');
    foodPhotoInput = document.getElementById('foodPhotoInput');
    photoPreview = document.getElementById('photoPreview');
    previewImage = document.getElementById('previewImage');
    analyzeButton = document.getElementById('analyzePhoto');
    retakeButton = document.getElementById('retakePhoto');
    aiAnalysisModal = document.getElementById('aiAnalysisModal');
    aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    aiResultContent = document.getElementById('aiResultContent');
    detectedFoodsList = document.getElementById('detectedFoodsList');
    confirmAiButton = document.getElementById('confirmAiButton');
    analyzedImageElement = document.getElementById('aiAnalyzedImage');
    
    // Configurar event listeners
    if (uploadZone) {
        uploadZone.addEventListener('click', triggerFileUpload);
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('drop', handleFileDrop);
    }
    
    if (foodPhotoInput) {
        foodPhotoInput.addEventListener('change', handleFileSelected);
    }
    
    if (retakeButton) {
        retakeButton.addEventListener('click', resetPhotoCapture);
    }
    
    if (analyzeButton) {
        analyzeButton.addEventListener('click', handleAnalyzePhoto);
    }
    
    if (confirmAiButton) {
        confirmAiButton.addEventListener('click', saveAnalysisResult);
    }
    
    // Event listeners para modales
    const closeAnalysisModalBtn = document.getElementById('closeAnalysisModal');
    if (closeAnalysisModalBtn) {
        closeAnalysisModalBtn.addEventListener('click', () => {
            aiAnalysisModal.style.display = 'none';
        });
    }
}

/**
 * Abre el selector de archivos cuando se hace clic en la zona de carga
 */
function triggerFileUpload() {
    foodPhotoInput.click();
}

/**
 * Maneja el evento de arrastrar sobre la zona de carga
 * @param {Event} e - Evento de arrastre
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.add('drag-over');
}

/**
 * Maneja el evento de soltar archivos en la zona de carga
 * @param {Event} e - Evento de soltar
 */
function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        foodPhotoInput.files = e.dataTransfer.files;
        handleFileSelected();
    }
}

/**
 * Maneja la selección de un archivo de imagen
 */
function handleFileSelected() {
    if (foodPhotoInput.files && foodPhotoInput.files[0]) {
        const file = foodPhotoInput.files[0];
        
        // Verificar si el archivo es una imagen
        if (!file.type.match('image.*')) {
            showToast('Por favor, selecciona una imagen válida', 'error');
            return;
        }
        
        // Mostrar la vista previa
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadZone.style.display = 'none';
            photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Reinicia el proceso de captura de foto
 */
function resetPhotoCapture() {
    uploadZone.style.display = 'block';
    photoPreview.style.display = 'none';
    previewImage.src = '';
    foodPhotoInput.value = '';
}

/**
 * Maneja el análisis de la foto seleccionada
 */
async function handleAnalyzePhoto() {
    if (!previewImage.src) {
        showToast('Por favor, selecciona una imagen primero', 'warning');
        return;
    }
    
    try {
        // Mostrar el modal de análisis
        aiAnalysisModal.style.display = 'block';
        aiLoadingIndicator.style.display = 'block';
        aiResultContent.style.display = 'none';
        
        // Convertir la imagen a base64
        const imageBase64 = await getBase64FromUrl(previewImage.src);
        
        // Actualizar la imagen en el modal
        if (analyzedImageElement) {
            analyzedImageElement.src = previewImage.src;
        }
        
        // Analizar la imagen
        currentAnalysisResult = await analyzeFood(imageBase64);
        
        // Mostrar los resultados
        displayAnalysisResults(currentAnalysisResult);
        
    } catch (error) {
        console.error('Error al analizar la foto:', error);
        showToast('Error al analizar la imagen', 'error');
        
        // Ocultar el modal en caso de error grave
        aiAnalysisModal.style.display = 'none';
    }
}

/**
 * Convierte una URL de imagen a base64
 * @param {string} url - URL de la imagen
 * @returns {Promise<string>} - String en formato base64
 */
async function getBase64FromUrl(url) {
    // Extraer solo la parte base64 de una URL de datos
    if (url.startsWith('data:image')) {
        return url.split(',')[1];
    }
    
    // Si es una URL normal, descargar y convertir
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error al convertir imagen a base64:', error);
        throw error;
    }
}

/**
 * Muestra los resultados del análisis
 * @param {Object} results - Resultados del análisis
 */
function displayAnalysisResults(results) {
    // Ocultar indicador de carga y mostrar contenido
    aiLoadingIndicator.style.display = 'none';
    aiResultContent.style.display = 'block';
    
    // Actualizar valores en la UI
    document.getElementById('aiKcal').textContent = results.calories;
    document.getElementById('aiProtein').textContent = `${results.macros.protein}g`;
    document.getElementById('aiCarb').textContent = `${results.macros.carbs}g`;
    document.getElementById('aiFat').textContent = `${results.macros.fat}g`;
    document.getElementById('mealPurpose').textContent = results.bestFor;
    
    // Actualizar lista de alimentos detectados
    if (detectedFoodsList) {
        detectedFoodsList.innerHTML = '';
        results.foods.forEach(food => {
            const li = document.createElement('li');
            li.textContent = food;
            detectedFoodsList.appendChild(li);
        });
    }
    
    // Ajustar la barra de confianza (simulado)
    const confidenceBar = document.querySelector('.ai-confidence-fill');
    if (confidenceBar) {
        confidenceBar.style.width = '85%';
    }
}

/**
 * Guarda los resultados del análisis actual
 */
function saveAnalysisResult() {
    if (!currentAnalysisResult) {
        showToast('No hay resultados para guardar', 'error');
        return;
    }
    
    try {
        // Preparar objeto para guardar
        const foodEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            imageUrl: previewImage.src,
            foods: currentAnalysisResult.foods,
            calories: currentAnalysisResult.calories,
            macros: currentAnalysisResult.macros,
            bestFor: currentAnalysisResult.bestFor
        };
        
        // Obtener entradas existentes o inicializar array vacío
        const existingEntries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
        
        // Añadir nueva entrada
        existingEntries.push(foodEntry);
        
        // Guardar en localStorage
        localStorage.setItem('foodEntries', JSON.stringify(existingEntries));
        
        // Actualizar UI del diario
        updateDailyIntake(foodEntry);
        
        // Mostrar mensaje de éxito
        showToast('Comida añadida con éxito', 'success');
        
        // Cerrar el modal y reiniciar
        aiAnalysisModal.style.display = 'none';
        resetPhotoCapture();
        
        // Volver a la pantalla principal
        navigateToTrackingScreen();
        
    } catch (error) {
        console.error('Error al guardar el análisis:', error);
        showToast('Error al guardar los datos', 'error');
    }
}

/**
 * Actualiza los contadores de ingesta diaria
 * @param {Object} entry - Entrada de comida
 */
function updateDailyIntake(entry) {
    // Actualizar totales en la UI
    const currentKcal = parseInt(document.getElementById('kcalTotal').textContent || '0');
    const currentProtein = parseInt(document.getElementById('proteinTotal').textContent || '0');
    const currentCarbs = parseInt(document.getElementById('carbTotal').textContent || '0');
    const currentFat = parseInt(document.getElementById('fatTotal').textContent || '0');
    
    // Calcular nuevos totales
    const newKcal = currentKcal + entry.calories;
    const newProtein = currentProtein + entry.macros.protein;
    const newCarbs = currentCarbs + entry.macros.carbs;
    const newFat = currentFat + entry.macros.fat;
    
    // Actualizar UI
    document.getElementById('kcalTotal').textContent = newKcal;
    document.getElementById('proteinTotal').textContent = newProtein;
    document.getElementById('carbTotal').textContent = newCarbs;
    document.getElementById('fatTotal').textContent = newFat;
    
    // Actualizar barras de progreso
    updateProgressBars();
    
    // Actualizar lista de entradas
    updateEntriesList(entry);
}

/**
 * Actualiza las barras de progreso
 */
function updateProgressBars() {
    // Obtener valores actuales
    const currentKcal = parseInt(document.getElementById('kcalTotal').textContent || '0');
    const goalKcal = parseInt(document.getElementById('kcalGoal').textContent || '0');
    
    // Calcular porcentaje
    const percentage = goalKcal > 0 ? Math.min(Math.round((currentKcal / goalKcal) * 100), 100) : 0;
    
    // Actualizar UI
    document.getElementById('kcalPercentage').textContent = percentage;
    
    // Actualizar anillo de progreso
    const mainRing = document.getElementById('mainGoalRing');
    if (mainRing) {
        const circumference = 2 * Math.PI * 70; // radio = 70
        const offset = circumference - (percentage / 100) * circumference;
        mainRing.style.strokeDashoffset = offset;
    }
    
    // Actualizar barras de macros (simplificado)
    const proteinBar = document.getElementById('proteinProgressBar');
    const carbsBar = document.getElementById('carbProgressBar');
    const fatBar = document.getElementById('fatProgressBar');
    
    if (proteinBar) proteinBar.style.width = `${Math.min(percentage, 100)}%`;
    if (carbsBar) carbsBar.style.width = `${Math.min(percentage, 100)}%`;
    if (fatBar) fatBar.style.width = `${Math.min(percentage, 100)}%`;
}

/**
 * Actualiza la lista de entradas de comida
 * @param {Object} entry - Nueva entrada de comida
 */
function updateEntriesList(entry) {
    const entriesList = document.getElementById('entriesList');
    
    if (!entriesList) return;
    
    // Eliminar mensaje de "no hay entradas"
    const noEntriesMsg = entriesList.querySelector('.no-entries');
    if (noEntriesMsg) {
        noEntriesMsg.remove();
    }
    
    // Crear nuevo elemento de lista
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
    entriesList.prepend(listItem);
    
    // Añadir evento para borrar
    const deleteButton = listItem.querySelector('.entry-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => deleteEntry(entry.id));
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
        const entryIndex = entries.findIndex(entry => entry.id === id);
        
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
 * Navega a la pantalla de seguimiento
 */
function navigateToTrackingScreen() {
    // Implementación simplificada - actualizamos al módulo de navegación
    const navItem = document.querySelector('.nav-item[data-page="tracking"]');
    if (navItem) {
        navItem.click();
    } else {
        // Fallback si no está el nav
        const trackingPanel = document.getElementById('tracking-panel');
        const historyCard = document.getElementById('history-card');
        const calculatorCard = document.getElementById('calculator-card');
        const resultsCard = document.getElementById('results-card');
        const foodTabs = document.getElementById('food-tabs');
        
        if (trackingPanel) trackingPanel.style.display = 'block';
        if (historyCard) historyCard.style.display = 'none';
        if (calculatorCard) calculatorCard.style.display = 'none';
        if (resultsCard) resultsCard.style.display = 'none';
        if (foodTabs) foodTabs.style.display = 'none';
    }
} 