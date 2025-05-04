// Módulo para el reconocimiento de alimentos con IA

import { uploadedPhotoFile, dailyEntries } from './data.js';
import { analyzeImageWithAI } from '../utils/api-services.js';
import { updateUI } from './ui.js';
import { showToast } from '../utils/ui-helpers.js';
import { OPENAI_CONFIG, GOOGLE_CLOUD_CONFIG, AI_PROVIDER } from '../utils/api-config.js';

// Variable local para almacenar los resultados del último análisis
let lastAnalysisResults = [];

/**
 * Analiza una foto con IA (OpenAI o Google Vision)
 * @returns {Promise<Array>} - Promesa que resuelve con los alimentos detectados
 */
export async function analyzeFoodPhoto() {
    if (!uploadedPhotoFile) {
        showToast('No hay ninguna foto para analizar.', 'warning');
        return [];
    }
    
    try {
        // Mostrar indicador de carga
        updateAnalysisLoadingState(true);
        
        // Verificar configuración de API
        if (AI_PROVIDER === 'OPENAI' && OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
            showToast('No has configurado la API key de OpenAI. Revisa api-config.js', 'error');
            updateAnalysisLoadingState(false);
            return [];
        }
        if (AI_PROVIDER === 'GOOGLE_VISION' && GOOGLE_CLOUD_CONFIG.VISION_API_KEY === 'TU_API_KEY_AQUI') {
            showToast('No has configurado la API key de Google Vision. Revisa api-config.js', 'error');
            updateAnalysisLoadingState(false);
            return [];
        }
        
        // Enviar la imagen a la API seleccionada
        console.log(`Analizando imagen con ${AI_PROVIDER}...`);
        const detectedFoods = await analyzeImageWithAI(uploadedPhotoFile);
        
        if (!detectedFoods || detectedFoods.length === 0) {
            showToast('No se detectaron alimentos en la imagen. Intenta con otra foto.', 'warning');
            updateAnalysisLoadingState(false);
            return [];
        }
        
        // Guardar resultados localmente
        lastAnalysisResults = detectedFoods;
        
        // Actualizar UI con resultados
        updateFoodAnalysisUI(detectedFoods);
        
        // Ocultar indicador de carga
        updateAnalysisLoadingState(false);
        
        return detectedFoods;
    } catch (error) {
        console.error('Error al analizar alimentos con IA:', error);
        showToast('Error al analizar la imagen. Inténtalo de nuevo.', 'error');
        
        // Ocultar indicador de carga en caso de error
        updateAnalysisLoadingState(false);
        
        return [];
    }
}

/**
 * Actualiza la interfaz con los resultados del análisis
 * @param {Array} detectedFoods - Array de alimentos detectados
 */
function updateFoodAnalysisUI(detectedFoods) {
    const aiResultContent = document.getElementById('aiResultContent');
    const detectedFoodsList = document.getElementById('detectedFoodsList');
    const aiAnalyzedImage = document.getElementById('aiAnalyzedImage');
    const aiLabels = document.querySelector('.ai-labels');
    const aiKcalEl = document.getElementById('aiKcal');
    const aiProteinEl = document.getElementById('aiProtein');
    const aiCarbEl = document.getElementById('aiCarb');
    const aiFatEl = document.getElementById('aiFat');
    const aiAnalysisProvider = document.getElementById('aiAnalysisProvider');
    
    // Mostrar el proveedor de IA usado
    if (aiAnalysisProvider) {
        if (AI_PROVIDER === 'SUPABASE') {
            aiAnalysisProvider.textContent = 'Supabase + OpenAI';
        } else {
            aiAnalysisProvider.textContent = AI_PROVIDER === 'OPENAI' ? 'OpenAI Vision' : 'Google Cloud Vision';
        }
    }
    
    if (!detectedFoods || detectedFoods.length === 0) {
        showToast('No se detectaron alimentos en la imagen.', 'warning');
        aiResultContent.querySelector('.ai-tip').innerHTML = `
            <span class="material-symbols-rounded">lightbulb</span>
            <p>Consejo: Intenta con una imagen más clara y cercana de la comida.</p>
        `;
        return;
    }
    
    // Mostrar imagen analizada con etiquetas
    if (uploadedPhotoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            aiAnalyzedImage.src = e.target.result;
            
            // Añadir etiquetas a la imagen
            aiLabels.innerHTML = '';
            detectedFoods.forEach((food, index) => {
                // Crear etiquetas sobre la imagen
                const label = document.createElement('div');
                label.className = 'ai-label';
                
                // Si tenemos información de posición, usarla
                if (food.position) {
                    const vertices = food.position.normalizedVertices;
                    // Convertir coordenadas normalizadas (0-1) a porcentajes
                    const top = Math.min(...vertices.map(v => v.y)) * 100;
                    const left = Math.min(...vertices.map(v => v.x)) * 100;
                    label.style.top = `${top}%`;
                    label.style.left = `${left}%`;
                } else {
                    // Si no hay posición, distribuir etiquetas
                    label.style.top = `${20 + (index * 20)}%`;
                    label.style.left = `${15 + (index * 10)}%`;
                }
                
                // Crear el contenido de la etiqueta
                const foodName = document.createElement('span');
                foodName.textContent = food.name;
                
                // Si tenemos información de confianza, mostrarla
                if (food.confidence) {
                    const confidence = document.createElement('span');
                    confidence.className = 'confidence';
                    confidence.textContent = `${food.confidence}%`;
                    foodName.appendChild(confidence);
                }
                
                label.appendChild(foodName);
                aiLabels.appendChild(label);
            });
        };
        reader.readAsDataURL(uploadedPhotoFile);
    }
    
    // Actualizar lista de alimentos detectados
    detectedFoodsList.innerHTML = '';
    
    // Añadir encabezado explicativo si hay alimentos detectados
    if (detectedFoods && detectedFoods.length > 0) {
        // Asegurarse que el contenedor de la lista sea visible
        detectedFoodsList.style.display = 'block';
        
        detectedFoods.forEach(food => {
            const li = document.createElement('li');
            li.className = 'detected-food-item';
            li.innerHTML = `
                <div class="food-name-container">
                    <span class="food-name">${food.name}</span>
                    <span class="food-portion">${food.portion}</span>
                </div>
                <div class="food-macros">
                    <span class="food-macro kcal">${food.macros.kcal} kcal</span>
                    <span class="food-macro protein">${food.macros.protein}g P</span>
                    <span class="food-macro carbs">${food.macros.carb}g C</span>
                    <span class="food-macro fat">${food.macros.fat}g G</span>
                </div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${food.confidence}%"></div>
                    <span class="confidence-text">${food.confidence}% certeza</span>
                </div>
            `;
            detectedFoodsList.appendChild(li);
        });
    } else {
        // Mostrar mensaje de que no hay alimentos detectados
        detectedFoodsList.innerHTML = '<p class="empty-list">No se detectaron alimentos en la imagen.</p>';
    }
    
    // Calcular y mostrar nutrición total
    const nutritionTotal = detectedFoods.reduce((total, food) => {
        total.kcal += food.macros.kcal;
        total.protein += food.macros.protein;
        total.carb += food.macros.carb;
        total.fat += food.macros.fat;
        return total;
    }, { kcal: 0, protein: 0, carb: 0, fat: 0 });
    
    aiKcalEl.textContent = nutritionTotal.kcal;
    aiProteinEl.textContent = `${nutritionTotal.protein.toFixed(1)}g`;
    aiCarbEl.textContent = `${nutritionTotal.carb.toFixed(1)}g`;
    aiFatEl.textContent = `${nutritionTotal.fat.toFixed(1)}g`;
    
    // Actualizar consejo nutricional
    updateNutritionalTip(nutritionTotal);
    
    // Verificar si la lista puede hacer scroll después de añadir elementos
    setTimeout(() => {
        checkIfListCanScroll(detectedFoodsList);
    }, 100);
}

/**
 * Verifica si una lista puede hacer scroll y aplica una clase correspondiente
 * @param {HTMLElement} listElement - Elemento de lista a verificar
 */
function checkIfListCanScroll(listElement) {
    if (!listElement) return;
    
    // Si la altura del contenido es mayor que la altura visible, puede hacer scroll
    const canScroll = listElement.scrollHeight > listElement.clientHeight;
    
    if (canScroll) {
        listElement.classList.add('can-scroll');
    } else {
        listElement.classList.remove('can-scroll');
    }
}

/**
 * Actualiza el estado de carga durante el análisis
 * @param {boolean} isLoading - Estado de carga
 */
function updateAnalysisLoadingState(isLoading) {
    const aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    const aiResultContent = document.getElementById('aiResultContent');
    
    if (isLoading) {
        aiLoadingIndicator.style.display = 'flex';
        aiResultContent.style.display = 'none';
    } else {
        aiLoadingIndicator.style.display = 'none';
        aiResultContent.style.display = 'block';
    }
}

/**
 * Actualiza el consejo nutricional basado en los resultados
 * @param {Object} nutritionTotal - Totales nutricionales
 */
function updateNutritionalTip(nutritionTotal) {
    const mealPurposeEl = document.getElementById('mealPurpose');
    
    // Determinar el propósito principal de la comida
    let purpose = '';
    let explanation = '';
    
    if (nutritionTotal.protein > 25 && nutritionTotal.protein / nutritionTotal.kcal > 0.12) {
        purpose = 'Ganancia muscular';
        explanation = 'Alto en proteínas';
    } else if (nutritionTotal.carb > 50 && nutritionTotal.carb / nutritionTotal.kcal > 0.5) {
        purpose = 'Energía pre-entrenamiento';
        explanation = 'Rico en carbohidratos';
    } else if (nutritionTotal.fat > 20 && nutritionTotal.fat / nutritionTotal.kcal > 0.35) {
        purpose = 'Dieta cetogénica';
        explanation = 'Alto en grasas saludables';
    } else if (nutritionTotal.kcal < 300) {
        purpose = 'Snack ligero';
        explanation = 'Bajo en calorías';
    } else {
        purpose = 'Comida equilibrada';
        explanation = 'Nutrientes bien distribuidos';
    }
    
    mealPurposeEl.textContent = purpose;
    mealPurposeEl.setAttribute('data-explanation', explanation);
}

/**
 * Añade los alimentos detectados al diario
 */
export function addDetectedFoodsToJournal() {
    if (!lastAnalysisResults || lastAnalysisResults.length === 0) {
        showToast('No hay alimentos detectados para añadir.', 'warning');
        return;
    }
    
    // Crear entradas para cada alimento detectado
    lastAnalysisResults.forEach(food => {
        const newEntry = {
            id: Date.now() + Math.floor(Math.random() * 1000), // Asegurar IDs únicos
            description: `${food.name} (${food.portion})`,
            macros: {
                kcal: food.macros.kcal,
                protein: food.macros.protein,
                carb: food.macros.carb,
                fat: food.macros.fat
            },
            source: `Análisis IA (${AI_PROVIDER})`
        };
        
        dailyEntries.push(newEntry);
    });
    
    // Guardar en localStorage y actualizar UI
    localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
    updateUI();
    
    // Mostrar mensaje de éxito
    const foodNames = lastAnalysisResults.map(food => food.name).join(', ');
    showToast(`Alimentos añadidos: ${foodNames}`, 'success');
} 