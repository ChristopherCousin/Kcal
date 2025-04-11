// Módulo para gestionar ventanas modales

import { userProfile, userGoals, currentMealType, COMMON_MEALS } from './data.js';
import { addCommonMeal } from './food-tracking.js';
import { showToast } from '../utils/ui-helpers.js';
import { analyzeFoodPhoto, addDetectedFoodsToJournal } from './food-recognition.js';
import { generateNutritionPlan, analyzeProgressAndActivity } from './ai-coaching.js';

/**
 * Opens the goal setting modal.
 */
function openGoalModal() {
    const goalModal = document.getElementById('goalModal');
    const userAgeInput = document.getElementById('userAge');
    const userSexInput = document.getElementById('userSex');
    const userWeightInput = document.getElementById('userWeight');
    const userHeightInput = document.getElementById('userHeight');
    const userActivityLevelInput = document.getElementById('userActivityLevel');
    const userGoalInput = document.getElementById('userGoal');
    const goalKcalInput = document.getElementById('goalKcal');
    const goalProteinInput = document.getElementById('goalProtein');
    const goalCarbInput = document.getElementById('goalCarb');
    const goalFatInput = document.getElementById('goalFat');

    // Pre-fill fields if profile exists
    if (userProfile.age) userAgeInput.value = userProfile.age;
    if (userProfile.sex) userSexInput.value = userProfile.sex;
    if (userProfile.weight) userWeightInput.value = userProfile.weight;
    if (userProfile.height) userHeightInput.value = userProfile.height;
    if (userProfile.activityLevel) userActivityLevelInput.value = userProfile.activityLevel;
    if (userProfile.goal) userGoalInput.value = userProfile.goal;

    // Pre-fill goals if they exist
    if (userGoals.kcal) goalKcalInput.value = userGoals.kcal;
    if (userGoals.protein) goalProteinInput.value = userGoals.protein;
    if (userGoals.carb) goalCarbInput.value = userGoals.carb;
    if (userGoals.fat) goalFatInput.value = userGoals.fat;

    // Usar la función global para cambiar el estado visual
    if (window.updateAppVisualState) {
        window.updateAppVisualState('goals');
    } else {
        // Fallback por si la función no está disponible
        goalModal.style.display = 'block';
    }
}

/**
 * Closes the goal modal.
 */
function closeGoalModal() {
    // Usar la función global para cambiar el estado visual
    if (window.updateAppVisualState) {
        window.updateAppVisualState('calculator');
    } else {
        // Fallback por si la función no está disponible
        const goalModal = document.getElementById('goalModal');
        goalModal.style.display = 'none';
    }
}

/**
 * Opens the AI analysis modal and starts the analysis.
 */
function openAIAnalysisModal() {
    const aiAnalysisModal = document.getElementById('aiAnalysisModal');
    const aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    const aiResultContent = document.getElementById('aiResultContent');
    
    // Reset y mostrar modal
    aiLoadingIndicator.style.display = 'flex';
    aiResultContent.style.display = 'none';
    aiAnalysisModal.style.display = 'block';
    
    // Iniciar análisis real con Vision API
    analyzeFoodPhoto().catch(error => {
        console.error('Error en análisis de foto:', error);
        showToast('Error al analizar la imagen. Inténtalo de nuevo.', 'error');
    });
}

/**
 * Closes the AI analysis modal.
 */
function closeAIAnalysisModal() {
    const aiAnalysisModal = document.getElementById('aiAnalysisModal');
    aiAnalysisModal.style.display = 'none';
}

/**
 * Opens the meal options modal.
 * @param {string} mealType - The type of meal (breakfast, lunch, dinner, or snack)
 */
function openMealOptionsModal(mealType) {
    const mealOptionsModal = document.getElementById('mealOptionsModal');
    const mealTypeHeaderEl = document.getElementById('mealTypeHeader');
    const commonMealsGridEl = document.getElementById('commonMealsGrid');
    
    // Set header text based on meal type
    let headerText;
    switch (mealType) {
        case 'breakfast': headerText = 'Elige tu desayuno'; break;
        case 'lunch': headerText = 'Elige tu comida'; break;
        case 'dinner': headerText = 'Elige tu cena'; break;
        case 'snack': headerText = 'Elige tu snack'; break;
        default: headerText = 'Elige tu comida';
    }
    
    mealTypeHeaderEl.textContent = headerText;
    
    // Populate grid with meal options
    commonMealsGridEl.innerHTML = '';
    const mealOptions = COMMON_MEALS[mealType] || [];
    
    mealOptions.forEach(meal => {
        const mealItem = document.createElement('div');
        mealItem.className = 'common-meal-item';
        mealItem.innerHTML = `
            <span class="common-meal-icon">${meal.icon}</span>
            <span class="common-meal-name">${meal.name}</span>
        `;
        
        mealItem.addEventListener('click', () => {
            addCommonMeal(meal);
        });
        
        commonMealsGridEl.appendChild(mealItem);
    });
    
    // Show modal
    mealOptionsModal.style.display = 'block';
}

/**
 * Closes the meal options modal.
 */
function closeMealOptionsModal() {
    const mealOptionsModal = document.getElementById('mealOptionsModal');
    mealOptionsModal.style.display = 'none';
}

/**
 * Adds the food detected by AI to the daily entries.
 */
function confirmAIFood() {
    // Usar la función del nuevo módulo
    addDetectedFoodsToJournal();
    closeAIAnalysisModal();
}

/**
 * Closes the nutrition plan modal.
 */
function closeNutritionPlanModal() {
    const planModal = document.getElementById('nutritionPlanModal');
    if (planModal) {
        planModal.style.display = 'none';
    }
}

/**
 * Abre el modal para generar un plan nutricional personalizado
 */
function openNutritionPlanModal() {
    const planModal = document.getElementById('nutritionPlanModal');
    const planForm = document.getElementById('planForm');
    const planResults = document.getElementById('planResults');
    const planLoading = document.getElementById('aiCoachLoadingIndicator');
    
    if (!planModal) {
        console.error('El modal de plan nutricional no existe en el DOM');
        return;
    }
    
    // Mostrar el modal y configurar la vista inicial
    planModal.style.display = 'block';
    planForm.style.display = 'block';
    planResults.style.display = 'none';
    
    if (planLoading) {
        planLoading.style.display = 'none';
    }
    
    // Pre-rellenar con datos del usuario si existen
    if (userProfile && userGoals) {
        const weekdayActivitySelect = document.getElementById('weekdayActivity');
        const weekendActivitySelect = document.getElementById('weekendActivity');
        
        if (weekdayActivitySelect) {
            weekdayActivitySelect.value = userProfile.activityLevel || 'moderada';
        }
        if (weekendActivitySelect) {
            weekendActivitySelect.value = userProfile.activityLevel === 'alta' ? 'moderada' : 
                                          userProfile.activityLevel === 'moderada' ? 'baja' : 
                                          userProfile.activityLevel || 'baja';
        }
    }
}

/**
 * Genera un plan nutricional basado en los datos del formulario
 */
function generatePlan() {
    // Obtener datos del formulario
    const weekdayActivity = document.getElementById('weekdayActivity').value;
    const weekendActivity = document.getElementById('weekendActivity').value;
    const dietaryPreferences = Array.from(
        document.querySelectorAll('input[name="dietPreference"]:checked')
    ).map(input => input.value);
    
    const allergiesInput = document.getElementById('allergies');
    const allergies = allergiesInput && allergiesInput.value ? 
        allergiesInput.value.split(',').map(item => item.trim()) : [];
    
    // Mostrar interfaz de carga
    const planForm = document.getElementById('planForm');
    const planResults = document.getElementById('planResults');
    const loadingIndicator = document.getElementById('aiCoachLoadingIndicator');
    
    if (planForm) planForm.style.display = 'none';
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    try {
        // Generar plan nutricional
        const plan = generateNutritionPlan({
            weekdayActivity,
            weekendActivity,
            dietaryPreferences,
            foodAllergies: allergies
        }).then(plan => {
            if (!plan) {
                throw new Error('No se pudo generar el plan nutricional');
            }
            
            // Actualizar UI con los resultados
            updatePlanModalUI(plan);
            
            if (planResults) planResults.style.display = 'block';
        }).catch(error => {
            console.error('Error al generar plan:', error);
            showToast('Error al generar el plan nutricional', 'error');
            
            // Volver a mostrar el formulario en caso de error
            if (planForm) planForm.style.display = 'block';
        }).finally(() => {
            // Ocultar indicador de carga
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
    } catch (error) {
        console.error('Error al iniciar generación de plan:', error);
        showToast('Error al generar el plan nutricional', 'error');
        
        // Volver a mostrar el formulario en caso de error
        if (planForm) planForm.style.display = 'block';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

/**
 * Actualiza la interfaz del modal con los datos del plan generado
 * @param {Object} plan - Plan nutricional generado
 */
function updatePlanModalUI(plan) {
    if (!plan) return;
    
    const weekdayPlanContainer = document.getElementById('weekdayPlanContainer');
    const weekendPlanContainer = document.getElementById('weekendPlanContainer');
    const planTipsContainer = document.getElementById('planTipsContainer');
    
    // Actualizar plan de días laborables
    if (weekdayPlanContainer && plan.weekdayPlan) {
        const wp = plan.weekdayPlan;
        weekdayPlanContainer.innerHTML = `
            <div class="plan-summary">
                <h3>Días Laborables</h3>
                <div class="macro-summary">
                    <div class="macro-item">
                        <span class="macro-value">${wp.calories}</span>
                        <span class="macro-label">kcal</span>
                    </div>
                    <div class="macro-item">
                        <span class="macro-value">${wp.protein}g</span>
                        <span class="macro-label">Proteínas</span>
                    </div>
                    <div class="macro-item">
                        <span class="macro-value">${wp.carbs}g</span>
                        <span class="macro-label">Carbos</span>
                    </div>
                    <div class="macro-item">
                        <span class="macro-value">${wp.fat}g</span>
                        <span class="macro-label">Grasas</span>
                    </div>
                </div>
            </div>
            <div class="plan-meals">
                ${wp.meals.map(meal => `
                    <div class="plan-meal">
                        <h4>${meal.name}</h4>
                        <div class="meal-macros">
                            <span>${meal.macros.kcal} kcal</span>
                            <span>${meal.macros.protein}g P</span>
                            <span>${meal.macros.carbs}g C</span>
                            <span>${meal.macros.fat}g G</span>
                        </div>
                        <ul class="meal-foods">
                            ${meal.foods.map(food => `<li>${food}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Actualizar plan de fin de semana
    if (weekendPlanContainer && plan.weekendPlan) {
        const wp = plan.weekendPlan;
        weekendPlanContainer.innerHTML = `
            <div class="plan-summary">
                <h3>Fin de Semana</h3>
                <div class="macro-summary">
                    <div class="macro-item">
                        <span class="macro-value">${wp.calories}</span>
                        <span class="macro-label">kcal</span>
                    </div>
                    <div class="macro-item">
                        <span class="macro-value">${wp.protein}g</span>
                        <span class="macro-label">Proteínas</span>
                    </div>
                    <div class="macro-item">
                        <span class="macro-value">${wp.carbs}g</span>
                        <span class="macro-label">Carbos</span>
                    </div>
                    <div class="macro-item">
                        <span class="macro-value">${wp.fat}g</span>
                        <span class="macro-label">Grasas</span>
                    </div>
                </div>
            </div>
            <div class="plan-meals">
                ${wp.meals.map(meal => `
                    <div class="plan-meal">
                        <h4>${meal.name}</h4>
                        <div class="meal-macros">
                            <span>${meal.macros.kcal} kcal</span>
                            <span>${meal.macros.protein}g P</span>
                            <span>${meal.macros.carbs}g C</span>
                            <span>${meal.macros.fat}g G</span>
                        </div>
                        <ul class="meal-foods">
                            ${meal.foods.map(food => `<li>${food}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Actualizar consejos
    if (planTipsContainer && plan.tips) {
        planTipsContainer.innerHTML = `
            <h3>Consejos Personalizados</h3>
            <ul>
                ${plan.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
    }
}

/**
 * Abre el modal para analizar el progreso del usuario
 */
function openProgressAnalysisModal() {
    // Implementación del modal de análisis de progreso
    const progressModal = document.getElementById('progressAnalysisModal');
    const progressLoading = document.getElementById('progressLoadingIndicator');
    const progressResults = document.getElementById('progressResultsContent');
    
    if (!progressModal) {
        console.error('El modal de análisis de progreso no existe en el DOM');
        return;
    }
    
    // Mostrar modal y configurar estado inicial
    progressModal.style.display = 'block';
    if (progressLoading) progressLoading.style.display = 'flex';
    if (progressResults) progressResults.style.display = 'none';
    
    // Análisis real usando la IA
    analyzeProgressAndActivity().then(analysis => {
        updateProgressAnalysisUI(analysis);
        
        if (progressResults) progressResults.style.display = 'block';
    }).catch(error => {
        console.error('Error al analizar progreso:', error);
        showToast('Error al analizar tus datos', 'error');
    }).finally(() => {
        if (progressLoading) progressLoading.style.display = 'none';
    });
}

/**
 * Cierra el modal de análisis de progreso
 */
function closeProgressAnalysisModal() {
    const progressModal = document.getElementById('progressAnalysisModal');
    if (progressModal) {
        progressModal.style.display = 'none';
    }
}

/**
 * Actualiza la interfaz del modal con los datos del análisis de progreso
 * @param {Object} analysis - Análisis generado por la IA
 */
function updateProgressAnalysisUI(analysis) {
    if (!analysis) return;
    
    const progressSummary = document.getElementById('progressSummary');
    const progressRecommendations = document.getElementById('progressRecommendations');
    const consistencyScore = document.getElementById('consistencyScore');
    
    if (progressSummary && analysis.summary) {
        progressSummary.textContent = analysis.summary;
    }
    
    if (progressRecommendations && analysis.recommendations) {
        progressRecommendations.innerHTML = '';
        
        analysis.recommendations.forEach(rec => {
            const item = document.createElement('li');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="recommendation-icon">
                    <span class="material-symbols-rounded">${rec.icon || 'tips_and_updates'}</span>
                </div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            `;
            progressRecommendations.appendChild(item);
        });
    }
    
    if (consistencyScore && analysis.metrics && analysis.metrics.consistency) {
        const score = analysis.metrics.consistency;
        consistencyScore.textContent = `${score}%`;
        
        const scoreBar = document.querySelector('.consistency-score-bar .score-fill');
        if (scoreBar) {
            scoreBar.style.width = `${score}%`;
            
            // Clase para el color según puntuación
            scoreBar.className = 'score-fill';
            if (score >= 80) {
                scoreBar.classList.add('score-excellent');
            } else if (score >= 60) {
                scoreBar.classList.add('score-good');
            } else if (score >= 40) {
                scoreBar.classList.add('score-average');
            } else {
                scoreBar.classList.add('score-needs-improvement');
            }
        }
    }
}

// Actualizar la exportación al final de todas las definiciones
export {
    openGoalModal,
    closeGoalModal,
    openAIAnalysisModal,
    closeAIAnalysisModal,
    openMealOptionsModal,
    closeMealOptionsModal,
    confirmAIFood,
    openNutritionPlanModal,
    closeNutritionPlanModal,
    generatePlan,
    openProgressAnalysisModal,
    closeProgressAnalysisModal
}; 