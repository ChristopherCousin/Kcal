// Módulo para gestionar eventos y listeners

import { 
    selectPortion, 
    addQuickFood, 
    handlePhotoUpload, 
    resetPhotoUpload, 
    analyzePhotoWithAI, 
    searchFoods, 
    addSelectedFood, 
    updateNutritionPreview 
} from './food-tracking.js';

import { 
    openGoalModal, 
    closeGoalModal, 
    closeMealOptionsModal, 
    closeAIAnalysisModal, 
    openMealOptionsModal, 
    confirmAIFood, 
    openNutritionPlanModal, 
    closeNutritionPlanModal, 
    generatePlan, 
    openProgressAnalysisModal, 
    closeProgressAnalysisModal 
} from './modals.js';

import { 
    saveGoals, 
    calculateRecommendedGoals, 
    userGoals,
    userProfile,
    selectedFood, 
    setSelectedFood 
} from './data.js';

import { 
    switchTab, 
    debounce, 
    showToast 
} from '../utils/ui-helpers.js';

import { updateUI } from './ui.js';
import { analyzeFoodPhoto, addDetectedFoodsToJournal } from './food-recognition.js';
import { calculateGoals } from './calculator.js';
import { updateCalculatorResults } from './ui.js';

/**
 * Sets up all event listeners for the app.
 */
export function setupEventListeners() {
    // Goal Modal
    const editGoalsButton = document.getElementById('editGoalsButton');
    const closeGoalModalButton = document.getElementById('closeGoalModal');
    const calculateGoalsButton = document.getElementById('calculateGoalsButton');
    const saveGoalsButton = document.getElementById('saveGoalsButton');
    
    editGoalsButton.addEventListener('click', openGoalModal);
    closeGoalModalButton.addEventListener('click', closeGoalModal);
    calculateGoalsButton.addEventListener('click', async function() {
        console.log('Botón de calcular en el modal pulsado');
        // Obtener valores del formulario
        const userSex = document.getElementById('userSex').value;
        const userAge = parseInt(document.getElementById('userAge').value);
        const userWeight = parseFloat(document.getElementById('userWeight').value);
        const userHeight = parseInt(document.getElementById('userHeight').value);
        const userActivityLevel = parseFloat(document.getElementById('userActivityLevel').value);
        const userGoal = document.getElementById('userGoal').value;
        
        if (!userAge || !userWeight || !userHeight) {
            showToast('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            document.getElementById('goalModalLoading').style.display = 'flex';
            
            // Asegurarnos de que tenemos un indicador de IA
            let aiIndicator = document.getElementById('aiCalculationIndicator');
            if (!aiIndicator) {
                // Crear el indicador si no existe
                aiIndicator = document.createElement('div');
                aiIndicator.id = 'aiCalculationIndicator';
                aiIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                aiIndicator.style.color = '#fff';
                aiIndicator.style.padding = '10px 15px';
                aiIndicator.style.borderRadius = '5px';
                aiIndicator.style.position = 'fixed';
                aiIndicator.style.bottom = '20px';
                aiIndicator.style.right = '20px';
                aiIndicator.style.zIndex = '9999';
                aiIndicator.style.fontWeight = 'bold';
                aiIndicator.style.display = 'none';
                document.body.appendChild(aiIndicator);
            }
            
            // Mostrar que estamos usando IA
            showToast('Calculando con IA. Esto puede tomar unos segundos...', 'info');
            
            console.log('Llamando a calculateRecommendedGoals desde el modal');
            const recommendations = await calculateRecommendedGoals({
                gender: userSex,
                age: userAge,
                weight: userWeight,
                height: userHeight,
                activity: userActivityLevel,
                goal: userGoal
            });
            
            console.log('Recomendaciones recibidas:', recommendations);
            
            // Actualizar valores en el formulario
            document.getElementById('goalKcal').value = recommendations.goalCalories;
            document.getElementById('goalProtein').value = recommendations.protein;
            document.getElementById('goalCarb').value = recommendations.carbs;
            document.getElementById('goalFat').value = recommendations.fat;
            
            // Mostrar mensaje según la fuente
            showToast(`Objetivos calculados con ${recommendations.source}. Puedes ajustarlos si lo deseas.`, 'success');
        } catch (error) {
            console.error('Error al calcular objetivos:', error);
            showToast('Error al calcular objetivos: ' + error.message, 'error');
        } finally {
            // Ocultar indicador de carga
            document.getElementById('goalModalLoading').style.display = 'none';
        }
    });
    saveGoalsButton.addEventListener('click', saveGoals);
    
    // Botón para regresar a la calculadora desde la pantalla de seguimiento
    const returnToCalculatorButton = document.getElementById('returnToCalculatorBtn');
    if (returnToCalculatorButton) {
        returnToCalculatorButton.addEventListener('click', function() {
            if (window.updateAppVisualState) {
                window.updateAppVisualState('calculator');
                showToast('Volviendo a la calculadora', 'info');
            }
        });
    }
    
    // Analysis Modal
    const closeAnalysisModalButton = document.getElementById('closeAnalysisModal');
    const confirmAiButton = document.getElementById('confirmAiButton');
    const adjustAiButton = document.getElementById('adjustAiButton');
    
    closeAnalysisModalButton.addEventListener('click', closeAIAnalysisModal);
    confirmAiButton.addEventListener('click', confirmAIFood);
    
    // Currently this button isn't functional, as we would need a full AI infrastructure to adjust
    adjustAiButton.addEventListener('click', () => {
        alert('Esta funcionalidad estaría disponible en una versión futura con IA completa.');
        closeAIAnalysisModal();
    });
    
    // Meal Modal
    const closeMealModalButton = document.getElementById('closeMealModal');
    const customMealButton = document.getElementById('customMealButton');
    const quickFoodInput = document.getElementById('quickFoodInput');
    
    closeMealModalButton.addEventListener('click', closeMealOptionsModal);
    customMealButton.addEventListener('click', () => {
        closeMealOptionsModal();
        quickFoodInput.focus();
    });
    
    // Calculator Form
    const calculatorForm = document.getElementById('calculator-form');
    const calculateButton = document.getElementById('calculate-button');
    const recalculateButton = document.getElementById('recalculate-button');
    const saveButton = document.getElementById('save-button');
    
    console.log('Inicializando manejador del formulario, calculatorForm:', calculatorForm, 'calculateButton:', calculateButton);
    
    if (calculateButton) {
        calculateButton.addEventListener('click', async function() {
            // Recoger datos básicos del formulario
            const gender = document.getElementById('gender').value;
            const age = parseInt(document.getElementById('age').value);
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseInt(document.getElementById('height').value, 10);
            const activityLevelElement = document.getElementById('activity-level');
            
            // Añadir comprobación de nulidad
            if (!activityLevelElement) {
                console.error('[EVENTS.JS] Error: No se encontró el elemento con id "activity-level". Verifica el HTML.');
                showToast('ERROR INTERNO: FALTA EL SELECTOR DE NIVEL DE ACTIVIDAD.', 'error');
                return; // Salir temprano si el elemento no existe
            }
            
            const activity = parseFloat(activityLevelElement.options[activityLevelElement.selectedIndex].value);
            
            // Obtener el valor del objetivo seleccionado (ahora es un radio button)
            const goalRadios = document.querySelectorAll('input[name="goal"]');
            let goal = null;
            for (const radio of goalRadios) {
                if (radio.checked) {
                    goal = radio.value;
                    break;
                }
            }

            // Validar datos básicos obligatorios
            if (!gender || isNaN(age) || isNaN(weight) || isNaN(height) || isNaN(activity) || !goal) {
                showToast('Por favor, completa todos los campos requeridos.', 'warning');
                return;
            }

            // Recoger datos de composición corporal (opcionales)
            const bodyfat = parseFloat(document.getElementById('bodyfat')?.value || 0);
            
            // Recoger datos de trabajo
            const jobTypeEl = document.getElementById('job-type');
            const jobType = jobTypeEl ? jobTypeEl.value : 'sedentary';
            
            // Recoger datos de entrenamiento (opcionales)
            const trainingTypeEl = document.getElementById('training-type');
            const trainingType = trainingTypeEl ? trainingTypeEl.value : 'none';
            const trainingFrequency = parseInt(document.getElementById('training-frequency')?.value || 0);
            
            // Recoger preferencias dietéticas
            const dietTypeEl = document.getElementById('diet-type');
            const dietType = dietTypeEl ? dietTypeEl.value : 'standard';
            
            const mealsPerDayEl = document.getElementById('meals-per-day');
            const mealsPerDay = mealsPerDayEl ? mealsPerDayEl.value : '3';

            // Construir el perfil completo
            const currentProfileData = { 
                gender, 
                age, 
                weight, 
                height, 
                activity, 
                goal,
                // Datos adicionales
                bodyfat: bodyfat || null,
                jobType,
                trainingType,
                trainingFrequency,
                dietType,
                mealsPerDay
            };

            // Mostrar indicador de carga
            const loadingIndicator = document.getElementById('calculationLoadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
            }
            
            try {
                // Calcular objetivos con IA usando el perfil completo
                showToast('Calculando con IA. Esto puede tomar unos segundos...', 'info');
                
                // Calcular recomendaciones
                const userGoalsData = await calculateRecommendedGoals(currentProfileData);
                
                // Actualizar perfil del usuario
                Object.assign(userProfile, {
                    gender,
                    age,
                    weight,
                    height,
                    activityLevel: activity,
                    goal,
                    bodyfat,
                    jobType,
                    trainingType,
                    trainingFrequency,
                    dietType,
                    mealsPerDay
                });
                
                // Guardar perfil en localStorage
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                
                // Actualizar UI con los resultados
                updateCalculatorResults(userGoalsData);
                
                // Ocultar indicador de carga
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Registrar en historial
                const calculation = {
                    date: new Date().toISOString(),
                    gender,
                    age,
                    weight,
                    height,
                    activity,
                    goal,
                    ...userGoalsData
                };
                
                // Guardar en localStorage
                const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
                history.push(calculation);
                localStorage.setItem('calculationHistory', JSON.stringify(history));
                
                // Mostrar panel de resultados
                switchToResults();
                
                // Notificar al usuario del éxito
                showToast(`SUCCESS: Objetivos calculados con ${userGoalsData.source}. Haz clic en "Guardar Resultados" para confirmar.`, 'success');
                
            } catch (error) {
                console.error('Error al calcular objetivos:', error);
                
                // Ocultar indicador de carga
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Mostrar mensaje de error
                showToast('Error al calcular objetivos: ' + error.message, 'error');
            }
        });
    } else {
        console.error('No se encontró el botón de calcular');
    }
    
    if (recalculateButton) {
        recalculateButton.addEventListener('click', function() {
            // Usar la función global para cambiar el estado visual
            if (window.updateAppVisualState) {
                window.updateAppVisualState('calculator');
            } else {
                // Fallback por si la función no está disponible
                document.getElementById('results-card').style.display = 'none';
                document.getElementById('calculator-card').style.display = 'block';
            }
        });
    }
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            // Save calculation to history
            const bmr = document.getElementById('bmr-value').textContent;
            const maintenance = document.getElementById('maintenance-value').textContent;
            const goalCalories = document.getElementById('goal-value').textContent;
            const proteinGrams = parseInt(document.getElementById('protein-grams').textContent);
            const carbsGrams = parseInt(document.getElementById('carbs-grams').textContent);
            const fatGrams = parseInt(document.getElementById('fat-grams').textContent);
            
            // Actualizar userGoals sin reasignar la variable completa
            userGoals.kcal = parseInt(goalCalories);
            userGoals.protein = proteinGrams;
            userGoals.carb = carbsGrams;
            userGoals.fat = fatGrams;
            
            // Guardar objetivos en localStorage
            localStorage.setItem('userGoals', JSON.stringify(userGoals));
            
            // Guardar en historial
            const calculation = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                bmr: parseInt(bmr),
                maintenance: parseInt(maintenance),
                goal: parseInt(goalCalories),
                macros: {
                    protein: proteinGrams,
                    carbs: carbsGrams,
                    fat: fatGrams
                }
            };
            
            // Save to localStorage
            const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
            history.push(calculation);
            localStorage.setItem('calculationHistory', JSON.stringify(history));
            
            showToast('Cálculo guardado como objetivo y añadido al historial.', 'success');
            
            // Usar la función global para cambiar el estado visual
            if (window.updateAppVisualState) {
                // Primero cambiamos a 'tracking' para asegurar que los elementos existan
                window.updateAppVisualState('tracking');
                
                // Esperamos un momento para que el DOM se actualice antes de actualizar la UI
                setTimeout(() => {
                    try {
                        console.log('Actualizando UI después de guardar resultados');
                        updateUI();
                    } catch (error) {
                        console.error('Error al actualizar UI:', error);
                    }
                }, 100);
            } else {
                // Fallback por si la función no está disponible
                document.getElementById('history-card').style.display = 'block';
                document.getElementById('tracking-panel').style.display = 'block';
                
                // Intentar actualizar la UI después de que los elementos sean visibles
                setTimeout(() => updateUI(), 100);
            }
        });
    }
    
    // Clear History Button
    const clearHistoryButton = document.getElementById('clear-history-button');
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres borrar todo el historial de cálculos?')) {
                localStorage.removeItem('calculationHistory');
                showToast('Historial borrado correctamente.', 'success');
                
                // Actualizar UI
                updateUI();
            }
        });
    }
    
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Portion Buttons
    const portionButtons = document.querySelectorAll('.portion-btn');
    
    portionButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectPortion(button);
        });
    });
    
    // Tracking Panel buttons
    const addFoodButton = document.getElementById('add-food-button');
    const addFavoritesButton = document.getElementById('add-favorites-button');
    const addManualButton = document.getElementById('add-manual-button');
    const addBarcodeButton = document.getElementById('add-barcode-button');
    const closeFoodTabsButton = document.getElementById('close-food-tabs');
    
    addFoodButton.addEventListener('click', function() {
        if (window.updateAppVisualState) {
            window.updateAppVisualState('tracking');
        }
        document.getElementById('food-tabs').style.display = 'block';
        // Ir directamente a la pestaña de foto
        switchTab('photo');
        
        // Preparar la zona de subida
        resetPhotoUpload();
    });
    
    addFavoritesButton.addEventListener('click', function() {
        if (window.updateAppVisualState) {
            window.updateAppVisualState('tracking');
        }
        document.getElementById('food-tabs').style.display = 'block';
        // Ir directamente a la pestaña de favoritos
        switchTab('favorites');
    });
    
    addManualButton.addEventListener('click', function() {
        if (window.updateAppVisualState) {
            window.updateAppVisualState('tracking');
        }
        document.getElementById('food-tabs').style.display = 'block';
        // Ir directamente a la pestaña manual
        switchTab('quick');
    });
    
    addBarcodeButton.addEventListener('click', function() {
        if (window.updateAppVisualState) {
            window.updateAppVisualState('tracking');
        }
        document.getElementById('food-tabs').style.display = 'block';
        // Ir directamente a la pestaña de escaneo
        switchTab('scan');
    });
    
    closeFoodTabsButton.addEventListener('click', function() {
        document.getElementById('food-tabs').style.display = 'none';
    });
    
    // Quick Add
    const addQuickFoodButton = document.getElementById('addQuickFood');
    
    addQuickFoodButton.addEventListener('click', addQuickFood);
    quickFoodInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addQuickFood();
        }
    });
    
    // Photo Upload
    const uploadZone = document.getElementById('uploadZone');
    const foodPhotoInput = document.getElementById('foodPhotoInput');
    const retakePhotoButton = document.getElementById('retakePhoto');
    const analyzePhotoButton = document.getElementById('analyzePhoto');
    
    uploadZone.addEventListener('click', () => {
        foodPhotoInput.click();
    });
    
    foodPhotoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handlePhotoUpload(e.target.files[0]);
        }
    });
    
    // Drag and drop for photos
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary-color)';
        uploadZone.style.backgroundColor = 'rgba(41, 182, 246, 0.05)';
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
        uploadZone.style.backgroundColor = '';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.backgroundColor = '';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handlePhotoUpload(e.dataTransfer.files[0]);
        }
    });
    
    retakePhotoButton.addEventListener('click', resetPhotoUpload);
    analyzePhotoButton.addEventListener('click', analyzePhotoWithAI);
    
    // Search
    const foodSearchInput = document.getElementById('foodSearchInput');
    const backToSearchButton = document.getElementById('backToSearch');
    const searchResults = document.getElementById('searchResults');
    const searchDetails = document.getElementById('searchDetails');
    
    foodSearchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            searchFoods(query);
        } else {
            searchResults.innerHTML = '';
        }
    }, 300));
    
    backToSearchButton.addEventListener('click', () => {
        searchDetails.classList.add('hidden');
        searchResults.classList.remove('hidden');
        setSelectedFood(null);
    });
    
    // Quantity buttons
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    const foodQuantityInput = document.getElementById('foodQuantity');
    
    quantityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const input = document.getElementById('foodQuantity');
            let value = parseInt(input.value) || 100;
            
            if (action === 'increase') {
                value += 10;
            } else if (action === 'decrease') {
                value = Math.max(10, value - 10);
            }
            
            input.value = value;
            
            // Update preview if food selected
            if (selectedFood) {
                updateNutritionPreview(selectedFood, value);
            }
        });
    });
    
    foodQuantityInput.addEventListener('input', () => {
        if (selectedFood) {
            const quantity = parseInt(foodQuantityInput.value) || 100;
            updateNutritionPreview(selectedFood, quantity);
        }
    });
    
    const addSearchedFoodButton = document.getElementById('addSearchedFood');
    addSearchedFoodButton.addEventListener('click', addSelectedFood);
    
    // Configurar event listeners para la IA de nutrición
    setupAINutritionEventListeners();
}

/**
 * Configura los event listeners relacionados con IA y análisis nutricional
 */
function setupAINutritionEventListeners() {
    // Botones para abrir los modales de IA
    const nutritionPlanBtn = document.getElementById('nutritionPlanBtn');
    const progressAnalysisBtn = document.getElementById('progressAnalysisBtn');
    
    // Botones dentro del modal de plan nutricional
    const generatePlanBtn = document.getElementById('generatePlanBtn');
    const closeNutritionPlanBtn = document.getElementById('closeNutritionPlanBtn');
    const backToPlanFormBtn = document.getElementById('backToPlanFormBtn');
    
    // Botones dentro del modal de análisis de progreso
    const closeProgressAnalysisBtn = document.getElementById('closeProgressAnalysisBtn');
    
    // Event listeners para abrir modales de IA
    if (nutritionPlanBtn) {
        nutritionPlanBtn.addEventListener('click', () => {
            openNutritionPlanModal();
        });
    }
    
    if (progressAnalysisBtn) {
        progressAnalysisBtn.addEventListener('click', () => {
            openProgressAnalysisModal();
        });
    }
    
    // Event listeners para el modal de plan nutricional
    if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', () => {
            generatePlan();
        });
    }
    
    if (closeNutritionPlanBtn) {
        closeNutritionPlanBtn.addEventListener('click', () => {
            closeNutritionPlanModal();
        });
    }
    
    if (backToPlanFormBtn) {
        backToPlanFormBtn.addEventListener('click', () => {
            const planForm = document.getElementById('planForm');
            const planResults = document.getElementById('planResults');
            
            if (planForm) planForm.style.display = 'block';
            if (planResults) planResults.style.display = 'none';
        });
    }
    
    // Event listeners para el modal de análisis de progreso
    if (closeProgressAnalysisBtn) {
        closeProgressAnalysisBtn.addEventListener('click', () => {
            closeProgressAnalysisModal();
        });
    }
    
    // Configurar eventos para análisis con IA de alimentos
    const analyzePhotoBtn = document.getElementById('analyzePhotoBtn');
    const confirmAIFoodBtn = document.getElementById('confirmAIFood');
    const closeAIAnalysisBtn = document.getElementById('closeAIAnalysisBtn');
    
    if (analyzePhotoBtn) {
        analyzePhotoBtn.addEventListener('click', () => {
            analyzePhotoWithAI();
        });
    }
    
    if (confirmAIFoodBtn) {
        confirmAIFoodBtn.addEventListener('click', () => {
            confirmAIFood();
        });
    }
    
    if (closeAIAnalysisBtn) {
        closeAIAnalysisBtn.addEventListener('click', () => {
            closeAIAnalysisModal();
        });
    }
}

/**
 * Cambia la vista a los resultados
 */
function switchToResults() {
    document.getElementById('results-card').style.display = 'block';
    document.getElementById('calculator-card').style.display = 'none';
} 