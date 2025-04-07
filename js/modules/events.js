// Módulo para gestionar eventos y listeners

import { selectPortion, addQuickFood, handlePhotoUpload, resetPhotoUpload, analyzePhotoWithAI, searchFoods, addSelectedFood, updateNutritionPreview } from './food-tracking.js';
import { openGoalModal, closeGoalModal, closeMealOptionsModal, closeAIAnalysisModal, openMealOptionsModal, confirmAIFood } from './modals.js';
import { saveGoals, calculateRecommendedGoals, selectedFood } from './data.js';
import { switchTab, debounce, showToast } from '../utils/ui-helpers.js';
import { updateUI } from './ui.js';

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
    calculateGoalsButton.addEventListener('click', calculateRecommendedGoals);
    saveGoalsButton.addEventListener('click', saveGoals);
    
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
        calculateButton.addEventListener('click', function() {
            console.log('¡Botón de cálculo pulsado!');
            
            // Get form values
            const gender = document.getElementById('gender').value;
            const age = parseInt(document.getElementById('age').value);
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseInt(document.getElementById('height').value);
            const activity = parseFloat(document.getElementById('activity').value);
            const goal = document.getElementById('goal').value;
            
            console.log('Valores recogidos:', { gender, age, weight, height, activity, goal });
            
            // Validate input
            if (!age || !weight || !height) {
                showToast('Por favor, completa todos los campos.', 'error');
                return;
            }
            
            // Calculate BMR using Mifflin-St Jeor formula
            let bmr;
            if (gender === 'male') {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }
            
            // Calculate maintenance calories
            const maintenance = Math.round(bmr * activity);
            
            // Calculate goal calories
            let goalCalories = maintenance;
            if (goal === 'lose') {
                goalCalories = Math.round(maintenance * 0.8);
            } else if (goal === 'gain') {
                goalCalories = Math.round(maintenance * 1.15);
            }
            
            console.log('Cálculos:', { bmr, maintenance, goalCalories });
            
            // Calculate macros
            const protein = Math.round(weight * 1.8); // 1.8g per kg bodyweight
            const proteinCalories = protein * 4;
            const fatCalories = goalCalories * 0.25; // 25% from fat
            const fat = Math.round(fatCalories / 9);
            const carbsCalories = goalCalories - proteinCalories - fatCalories;
            const carbs = Math.round(carbsCalories / 4);
            
            // Update the percentages
            const proteinPercent = Math.round((proteinCalories / goalCalories) * 100);
            const carbsPercent = Math.round((carbsCalories / goalCalories) * 100);
            const fatPercent = Math.round((fatCalories / goalCalories) * 100);
            
            // Update UI
            console.log('Actualizando UI con resultados');
            try {
                document.getElementById('bmr-value').textContent = Math.round(bmr);
                document.getElementById('maintenance-value').textContent = maintenance;
                document.getElementById('goal-value').textContent = goalCalories;
                
                // Update macros
                document.getElementById('protein-percent').textContent = proteinPercent;
                document.getElementById('carbs-percent').textContent = carbsPercent;
                document.getElementById('fat-percent').textContent = fatPercent;
                
                document.getElementById('protein-grams').textContent = protein;
                document.getElementById('carbs-grams').textContent = carbs;
                document.getElementById('fat-grams').textContent = fat;
                
                // Update macro bars
                document.getElementById('protein-bar').style.width = `${proteinPercent}%`;
                document.getElementById('protein-bar').textContent = `${proteinPercent}%`;
                
                document.getElementById('carbs-bar').style.width = `${carbsPercent}%`;
                document.getElementById('carbs-bar').textContent = `${carbsPercent}%`;
                
                document.getElementById('fat-bar').style.width = `${fatPercent}%`;
                document.getElementById('fat-bar').textContent = `${fatPercent}%`;
                
                // Usar la función global para cambiar el estado visual
                if (window.updateAppVisualState) {
                    window.updateAppVisualState('results');
                } else {
                    // Fallback por si la función no está disponible
                    document.getElementById('calculator-card').style.display = 'none';
                    document.getElementById('results-card').style.display = 'block';
                }
                
                console.log('Resultados mostrados correctamente');
            } catch (error) {
                console.error('Error al actualizar UI:', error);
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
            
            const calculation = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                bmr: parseInt(bmr),
                maintenance: parseInt(maintenance),
                goal: parseInt(goalCalories),
                macros: {
                    protein: parseInt(document.getElementById('protein-grams').textContent),
                    carbs: parseInt(document.getElementById('carbs-grams').textContent),
                    fat: parseInt(document.getElementById('fat-grams').textContent)
                }
            };
            
            // Save to localStorage
            const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
            history.push(calculation);
            localStorage.setItem('calculationHistory', JSON.stringify(history));
            
            showToast('Cálculo guardado en el historial.', 'success');
            
            // Usar la función global para cambiar el estado visual
            if (window.updateAppVisualState) {
                window.updateAppVisualState('tracking');
            } else {
                // Fallback por si la función no está disponible
                document.getElementById('history-card').style.display = 'block';
                document.getElementById('tracking-panel').style.display = 'block';
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
    
    // Botón principal para añadir alimentos
    const addFoodButton = document.getElementById('add-food-button');
    if (addFoodButton) {
        addFoodButton.addEventListener('click', () => {
            const foodTabs = document.getElementById('food-tabs');
            if (foodTabs) {
                // Asegurarnos de que el tab rápido esté activo
                const quickTab = document.querySelector('.tab-button[data-tab="quick"]');
                if (quickTab) {
                    const allTabs = document.querySelectorAll('.tab-button');
                    allTabs.forEach(tab => tab.classList.remove('active'));
                    quickTab.classList.add('active');
                    
                    const allContents = document.querySelectorAll('.tab-content');
                    allContents.forEach(content => content.classList.remove('active'));
                    const quickContent = document.getElementById('quick');
                    if (quickContent) quickContent.classList.add('active');
                }
                
                // Enfocar automáticamente el campo de entrada
                const quickFoodInput = document.getElementById('quickFoodInput');
                if (quickFoodInput) {
                    setTimeout(() => quickFoodInput.focus(), 100);
                }
                
                // Asegurar que se muestre el panel de pestañas
                foodTabs.style.display = 'block';
            }
        });
    }
    
    // Botón para cerrar el panel de pestañas
    const closeFoodTabsButton = document.getElementById('close-food-tabs');
    if (closeFoodTabsButton) {
        closeFoodTabsButton.addEventListener('click', () => {
            const foodTabs = document.getElementById('food-tabs');
            if (foodTabs) {
                foodTabs.style.display = 'none';
            }
        });
    }
    
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
        window.selectedFood = null;
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
            if (window.selectedFood) {
                updateNutritionPreview(window.selectedFood, value);
            }
        });
    });
    
    foodQuantityInput.addEventListener('input', () => {
        if (window.selectedFood) {
            const quantity = parseInt(foodQuantityInput.value) || 100;
            updateNutritionPreview(window.selectedFood, quantity);
        }
    });
    
    const addSearchedFoodButton = document.getElementById('addSearchedFood');
    addSearchedFoodButton.addEventListener('click', addSelectedFood);
} 