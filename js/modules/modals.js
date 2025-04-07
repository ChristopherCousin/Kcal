// Módulo para gestionar ventanas modales

import { userProfile, userGoals, currentMealType, COMMON_MEALS } from './data.js';
import { addCommonMeal } from './food-tracking.js';
import { showToast } from '../utils/ui-helpers.js';

/**
 * Opens the goal setting modal.
 */
export function openGoalModal() {
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
export function closeGoalModal() {
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
 * Opens the AI analysis modal and starts the analysis simulation.
 */
export function openAIAnalysisModal() {
    const aiAnalysisModal = document.getElementById('aiAnalysisModal');
    const aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    const aiResultContent = document.getElementById('aiResultContent');
    
    // Reset and show modal
    aiLoadingIndicator.style.display = 'flex';
    aiResultContent.style.display = 'none';
    aiAnalysisModal.style.display = 'block';
    
    // Simulate AI analysis (would be replaced with real API call)
    setTimeout(() => {
        simulateAIFoodDetection();
    }, 2000);
}

/**
 * Closes the AI analysis modal.
 */
export function closeAIAnalysisModal() {
    const aiAnalysisModal = document.getElementById('aiAnalysisModal');
    aiAnalysisModal.style.display = 'none';
}

/**
 * Opens the meal options modal.
 * @param {string} mealType - The type of meal (breakfast, lunch, dinner, or snack)
 */
export function openMealOptionsModal(mealType) {
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
export function closeMealOptionsModal() {
    const mealOptionsModal = document.getElementById('mealOptionsModal');
    mealOptionsModal.style.display = 'none';
}

/**
 * Simulates AI food detection from an uploaded photo.
 * In a real app, this would call a food recognition API.
 */
function simulateAIFoodDetection() {
    const aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    const aiResultContent = document.getElementById('aiResultContent');
    const detectedFoodsList = document.getElementById('detectedFoodsList');
    const aiKcalEl = document.getElementById('aiKcal');
    const aiProteinEl = document.getElementById('aiProtein');
    const aiCarbEl = document.getElementById('aiCarb');
    const aiFatEl = document.getElementById('aiFat');
    
    // Sample detected foods (would come from API)
    const detectedFoods = [
        { name: "Ensalada de tomate", confidence: 92 },
        { name: "Pollo a la plancha", confidence: 88 },
        { name: "Arroz blanco", confidence: 76 }
    ];
    
    // Sample nutritional values (would come from API)
    const nutritionEstimate = {
        kcal: 450,
        protein: 35,
        carb: 40,
        fat: 12
    };
    
    // Update detected foods list
    detectedFoodsList.innerHTML = '';
    detectedFoods.forEach(food => {
        const li = document.createElement('li');
        li.innerHTML = `${food.name} <span class="confidence-score">${food.confidence}%</span>`;
        detectedFoodsList.appendChild(li);
    });
    
    // Update nutrition values
    aiKcalEl.textContent = nutritionEstimate.kcal;
    aiProteinEl.textContent = `${nutritionEstimate.protein}g`;
    aiCarbEl.textContent = `${nutritionEstimate.carb}g`;
    aiFatEl.textContent = `${nutritionEstimate.fat}g`;
    
    // Hide loading, show results
    aiLoadingIndicator.style.display = 'none';
    aiResultContent.style.display = 'block';
}

/**
 * Adds the food detected by AI to the daily entries.
 */
export function confirmAIFood() {
    const aiKcalEl = document.getElementById('aiKcal');
    const aiProteinEl = document.getElementById('aiProtein');
    const aiCarbEl = document.getElementById('aiCarb');
    const aiFatEl = document.getElementById('aiFat');
    const detectedFoodsList = document.getElementById('detectedFoodsList');
    
    // Extract the detected food names
    const foodItems = Array.from(detectedFoodsList.children).map(li => 
        li.textContent.split(' ').slice(0, -1).join(' ')
    );
    
    // Extract the nutrition values
    const kcal = parseInt(aiKcalEl.textContent) || 0;
    const protein = parseFloat(aiProteinEl.textContent) || 0;
    const carb = parseFloat(aiCarbEl.textContent) || 0;
    const fat = parseFloat(aiFatEl.textContent) || 0;
    
    // This would normally call the appropriate function from food-tracking.js
    // But for now we'll just show a success message
    showToast(`Alimentos añadidos: ${foodItems.join(', ')}`, 'success');
    closeAIAnalysisModal();
} 