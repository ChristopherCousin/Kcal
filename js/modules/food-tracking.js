// Módulo para gestionar el seguimiento de alimentos

import { dailyEntries, selectedFood, uploadedPhotoFile, currentMealType } from './data.js';
import { updateUI } from './ui.js';
import { closeAIAnalysisModal, closeMealOptionsModal, openAIAnalysisModal } from './modals.js';
import { showToast, switchTab } from '../utils/ui-helpers.js';

// Selected portion size multiplier
let selectedPortionSize = 'normal'; // can be 'small', 'normal', 'large'
const portionSizeMultipliers = {
    'small': 0.7,
    'normal': 1.0,
    'large': 1.3
};

/**
 * Updates the selected portion size.
 * @param {HTMLElement} button - The selected portion button
 */
export function selectPortion(button) {
    const portionButtons = document.querySelectorAll('.portion-btn');
    
    // Remove active class from all buttons
    portionButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected button
    button.classList.add('active');
    
    // Update selected portion size
    selectedPortionSize = button.dataset.size;
}

/**
 * Adds a quick food entry based on input and selected portion.
 */
export function addQuickFood() {
    const quickFoodInput = document.getElementById('quickFoodInput');
    const description = quickFoodInput.value.trim();
    
    if (!description) {
        showToast('Por favor, introduce una descripción de la comida.', 'warning');
        return;
    }
    
    // Very rough estimate based on description and portion size
    // In a real app, this could be estimated based on natural language processing
    const baseKcal = Math.floor(Math.random() * 200) + 100; // random value between 100-300
    const multiplier = portionSizeMultipliers[selectedPortionSize];
    
    const portionText = selectedPortionSize === 'normal' ? '' : ` (porción ${selectedPortionSize})`;
    
    const newEntry = {
        id: Date.now(),
        description: description + portionText,
        macros: {
            kcal: Math.round(baseKcal * multiplier),
            protein: Math.round((baseKcal * 0.2 / 4) * multiplier * 10) / 10, // ~20% from protein
            carb: Math.round((baseKcal * 0.5 / 4) * multiplier * 10) / 10,    // ~50% from carbs
            fat: Math.round((baseKcal * 0.3 / 9) * multiplier * 10) / 10      // ~30% from fat
        },
        source: 'Entrada rápida'
    };
    
    dailyEntries.push(newEntry);
    localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
    
    // Clear input and update UI
    quickFoodInput.value = '';
    updateUI();
    showToast('Comida añadida a tu diario.', 'success');
}

/**
 * Adds a common meal selection from predefined options.
 * @param {Object} meal - The meal object
 */
export function addCommonMeal(meal) {
    const newEntry = {
        id: Date.now(),
        description: meal.name,
        macros: { ...meal.macros }, // Clone to avoid modifying the original
        source: `Comida común (${currentMealType})`
    };
    
    dailyEntries.push(newEntry);
    localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
    updateUI();
    
    closeMealOptionsModal();
    showToast(`${meal.name} añadido a tu diario.`, 'success');
}

/**
 * Handles photo upload for food tracking.
 * @param {File} file - The uploaded photo file
 */
export function handlePhotoUpload(file) {
    const uploadZone = document.getElementById('uploadZone');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    
    if (!file.type.match('image.*')) {
        showToast('El archivo seleccionado no es una imagen.', 'error');
        return;
    }
    
    // Store file for later
    uploadedPhotoFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        uploadZone.style.display = 'none';
        photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

/**
 * Resets the photo upload area.
 */
export function resetPhotoUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const photoPreview = document.getElementById('photoPreview');
    const foodPhotoInput = document.getElementById('foodPhotoInput');
    
    uploadZone.style.display = 'flex';
    photoPreview.style.display = 'none';
    foodPhotoInput.value = '';
    uploadedPhotoFile = null;
}

/**
 * Simulates analyzing a photo with AI.
 */
export function analyzePhotoWithAI() {
    if (!uploadedPhotoFile) {
        showToast('No hay ninguna foto para analizar.', 'warning');
        return;
    }
    
    openAIAnalysisModal();
}

/**
 * Searches for foods in the database.
 * @param {string} query - Search query
 */
export function searchFoods(query) {
    const searchResults = document.getElementById('searchResults');
    
    // This should be replaced with a real API call to Open Food Facts or similar
    // For now, we'll simulate results
    searchResults.innerHTML = '<div class="search-loading">Buscando...</div>';
    
    setTimeout(() => {
        const results = simulateSearchResults(query);
        displaySearchResults(results);
    }, 600);
}

/**
 * Simulates food search results.
 * @param {string} query - Search query
 * @returns {Array} - Array of food objects
 */
function simulateSearchResults(query) {
    query = query.toLowerCase();
    const commonFoods = [
        { name: 'Manzana', brand: 'Fruta fresca', macros: { kcal: 52, protein: 0.3, carb: 14, fat: 0.2 } },
        { name: 'Plátano', brand: 'Fruta fresca', macros: { kcal: 89, protein: 1.1, carb: 23, fat: 0.3 } },
        { name: 'Yogur natural', brand: 'Marca blanca', macros: { kcal: 60, protein: 5, carb: 7, fat: 1.5 } },
        { name: 'Huevo', brand: 'Huevos frescos', macros: { kcal: 68, protein: 6, carb: 0.6, fat: 4.8 } },
        { name: 'Pollo a la plancha', brand: 'Carne fresca', macros: { kcal: 165, protein: 31, carb: 0, fat: 3.6 } },
        { name: 'Arroz blanco cocido', brand: 'Cereal', macros: { kcal: 130, protein: 2.7, carb: 28, fat: 0.3 } },
        { name: 'Pan integral', brand: 'Panadería', macros: { kcal: 80, protein: 4, carb: 15, fat: 1 } },
        { name: 'Leche entera', brand: 'Lácteos', macros: { kcal: 65, protein: 3.3, carb: 5, fat: 3.6 } },
        { name: 'Atún natural', brand: 'Conservas', macros: { kcal: 108, protein: 24, carb: 0, fat: 1 } },
        { name: 'Aguacate', brand: 'Fruta fresca', macros: { kcal: 160, protein: 2, carb: 9, fat: 15 } }
    ];
    
    return commonFoods.filter(food => 
        food.name.toLowerCase().includes(query) || 
        food.brand.toLowerCase().includes(query)
    );
}

/**
 * Displays search results in the UI.
 * @param {Array} results - Array of food objects
 */
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No se encontraron resultados</div>';
        return;
    }
    
    results.forEach(food => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="search-result-name">${food.name}</div>
            <div class="search-result-brand">${food.brand} · ${food.macros.kcal} kcal/100g</div>
        `;
        
        resultItem.addEventListener('click', () => {
            showFoodDetails(food);
        });
        
        searchResults.appendChild(resultItem);
    });
}

/**
 * Shows details for a selected food.
 * @param {Object} food - Food object
 */
export function showFoodDetails(food) {
    const searchResults = document.getElementById('searchResults');
    const searchDetails = document.getElementById('searchDetails');
    const selectedFoodNameEl = document.getElementById('selectedFoodName');
    const foodQuantityInput = document.getElementById('foodQuantity');
    
    // Store selected food
    window.selectedFood = food;
    
    searchResults.classList.add('hidden');
    searchDetails.classList.remove('hidden');
    
    selectedFoodNameEl.textContent = food.name;
    updateNutritionPreview(food, parseInt(foodQuantityInput.value) || 100);
}

/**
 * Updates the nutrition preview based on quantity.
 * @param {Object} food - Food object
 * @param {number} quantity - Quantity in grams
 */
export function updateNutritionPreview(food, quantity) {
    const previewKcalEl = document.getElementById('previewKcal');
    const previewProteinEl = document.getElementById('previewProtein');
    const previewCarbEl = document.getElementById('previewCarb');
    const previewFatEl = document.getElementById('previewFat');
    
    const multiplier = quantity / 100; // Food macros are per 100g
    
    previewKcalEl.textContent = Math.round(food.macros.kcal * multiplier);
    previewProteinEl.textContent = `${(food.macros.protein * multiplier).toFixed(1)} g`;
    previewCarbEl.textContent = `${(food.macros.carb * multiplier).toFixed(1)} g`;
    previewFatEl.textContent = `${(food.macros.fat * multiplier).toFixed(1)} g`;
}

/**
 * Adds the selected food from search to daily entries.
 */
export function addSelectedFood() {
    const foodQuantityInput = document.getElementById('foodQuantity');
    
    if (!window.selectedFood) {
        showToast('No hay ningún alimento seleccionado.', 'warning');
        return;
    }
    
    const quantity = parseInt(foodQuantityInput.value) || 100;
    const multiplier = quantity / 100;
    const food = window.selectedFood;
    
    const newEntry = {
        id: Date.now(),
        description: `${food.name} (${quantity}g)`,
        macros: {
            kcal: Math.round(food.macros.kcal * multiplier),
            protein: Math.round(food.macros.protein * multiplier * 10) / 10,
            carb: Math.round(food.macros.carb * multiplier * 10) / 10,
            fat: Math.round(food.macros.fat * multiplier * 10) / 10
        },
        source: food.brand
    };
    
    dailyEntries.push(newEntry);
    localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
    updateUI();
    
    // Reset
    const foodSearchInput = document.getElementById('foodSearchInput');
    const searchResults = document.getElementById('searchResults');
    const searchDetails = document.getElementById('searchDetails');
    
    foodSearchInput.value = '';
    searchResults.innerHTML = '';
    searchDetails.classList.add('hidden');
    searchResults.classList.remove('hidden');
    showToast(`${food.name} añadido.`, 'success');
    
    // Switch back to quick tab
    switchTab('quick');
    
    // Clear selected food
    window.selectedFood = null;
} 