// Módulo para manejar datos y almacenamiento

import { updateUI } from './ui.js';
import { openGoalModal } from './modals.js';
import { showToast } from '../utils/ui-helpers.js';

// --- State ---
export let userProfile = { 
    age: null, 
    sex: null, 
    weight: null, 
    height: null, 
    activityLevel: null, 
    goal: null 
};

export let userGoals = { 
    kcal: null, 
    protein: null, 
    carb: null, 
    fat: null 
};

export let dailyEntries = []; // Array of food entry objects
export let isLoading = true; // Flag to manage initial loading state
export let selectedFood = null; // Currently selected food from search
export let uploadedPhotoFile = null; // Photo file for analysis
export let currentMealType = ''; // For the meal selection modal

// --- Constants ---
export const PROTEIN_PER_KG = 1.8; // g per kg body weight (adjustable)
export const FAT_PERCENTAGE = 0.25; // % of total kcal (adjustable)

// Common meals for quick selection
export const COMMON_MEALS = {
    breakfast: [
        { name: 'Tostadas', icon: '🍞', macros: { kcal: 250, protein: 8, carb: 30, fat: 10 } },
        { name: 'Yogur con fruta', icon: '🥣', macros: { kcal: 200, protein: 15, carb: 25, fat: 5 } },
        { name: 'Huevos revueltos', icon: '🍳', macros: { kcal: 300, protein: 18, carb: 5, fat: 22 } },
        { name: 'Avena con plátano', icon: '🥣', macros: { kcal: 350, protein: 10, carb: 60, fat: 7 } },
        { name: 'Café con leche', icon: '☕', macros: { kcal: 80, protein: 4, carb: 6, fat: 4 } },
        { name: 'Tortilla francesa', icon: '🍳', macros: { kcal: 220, protein: 14, carb: 2, fat: 16 } }
    ],
    lunch: [
        { name: 'Ensalada mixta', icon: '🥗', macros: { kcal: 180, protein: 5, carb: 15, fat: 10 } },
        { name: 'Pollo con arroz', icon: '🍗', macros: { kcal: 450, protein: 35, carb: 45, fat: 12 } },
        { name: 'Pasta boloñesa', icon: '🍝', macros: { kcal: 550, protein: 25, carb: 70, fat: 15 } },
        { name: 'Lentejas', icon: '🥘', macros: { kcal: 380, protein: 20, carb: 60, fat: 4 } },
        { name: 'Sándwich mixto', icon: '🥪', macros: { kcal: 320, protein: 15, carb: 30, fat: 16 } },
        { name: 'Salmón con verduras', icon: '🐟', macros: { kcal: 400, protein: 30, carb: 10, fat: 25 } }
    ],
    dinner: [
        { name: 'Tortilla de patatas', icon: '🍳', macros: { kcal: 350, protein: 14, carb: 30, fat: 18 } },
        { name: 'Sopa de verduras', icon: '🍲', macros: { kcal: 150, protein: 6, carb: 20, fat: 5 } },
        { name: 'Pescado al horno', icon: '🐟', macros: { kcal: 280, protein: 30, carb: 5, fat: 15 } },
        { name: 'Ensalada césar', icon: '🥗', macros: { kcal: 300, protein: 15, carb: 10, fat: 22 } },
        { name: 'Tofu salteado', icon: '🥢', macros: { kcal: 320, protein: 18, carb: 15, fat: 20 } },
        { name: 'Revuelto de champiñones', icon: '🍄', macros: { kcal: 250, protein: 12, carb: 8, fat: 18 } }
    ],
    snack: [
        { name: 'Manzana', icon: '🍎', macros: { kcal: 90, protein: 0.5, carb: 22, fat: 0.3 } },
        { name: 'Frutos secos', icon: '🥜', macros: { kcal: 180, protein: 6, carb: 6, fat: 15 } },
        { name: 'Barrita proteica', icon: '🍫', macros: { kcal: 200, protein: 15, carb: 20, fat: 5 } },
        { name: 'Yogur griego', icon: '🥛', macros: { kcal: 130, protein: 12, carb: 5, fat: 6 } },
        { name: 'Plátano', icon: '🍌', macros: { kcal: 110, protein: 1, carb: 27, fat: 0.4 } },
        { name: 'Batido proteico', icon: '🥤', macros: { kcal: 150, protein: 25, carb: 3, fat: 2 } }
    ]
};

/**
 * Loads data from localStorage.
 */
export function loadData() {
    isLoading = true;
    let goalsLoaded = false;

    // Load User Profile
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            const parsedProfile = JSON.parse(savedProfile);
            if (parsedProfile) {
                userProfile = parsedProfile;
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error);
            localStorage.removeItem('userProfile');
        }
    }

    // Load User Goals
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
        try {
            const parsedGoals = JSON.parse(savedGoals);
            if (parsedGoals && parsedGoals.kcal > 0) {
                userGoals = parsedGoals;
                goalsLoaded = true;
            }
        } catch (error) {
            console.error("Error al cargar objetivos:", error);
            localStorage.removeItem('userGoals');
        }
    }

    // Load Daily Entries
    const savedEntries = localStorage.getItem('dailyEntries');
    if (savedEntries) {
        try {
            dailyEntries = JSON.parse(savedEntries) || [];
        } catch (error) {
            console.error("Error al cargar entradas:", error);
            localStorage.removeItem('dailyEntries');
            dailyEntries = [];
        }
    }

    isLoading = false;
    updateUI();
    
    // IMPORTANTE: Desactivamos la apertura automática del modal ya que está causando conflictos
    // El usuario puede usar el botón "Editar objetivos" cuando lo desee
    
    // Marcar que la aplicación ya se ha cargado al menos una vez
    localStorage.setItem('hasLoadedBefore', 'true');
}

/**
 * Calculates total macros from entries.
 * @returns {Object} - Totals object
 */
export function calculateTotals() {
    return dailyEntries.reduce((totals, entry) => {
        // Ensure macros exist and are numbers
        totals.kcal += Number(entry.macros?.kcal) || 0;
        totals.protein += Number(entry.macros?.protein) || 0;
        totals.carb += Number(entry.macros?.carb) || 0;
        totals.fat += Number(entry.macros?.fat) || 0;
        return totals;
    }, { kcal: 0, protein: 0, carb: 0, fat: 0 });
}

/**
 * Saves user profile and goals.
 */
export function saveGoals() {
    // Get goals from inputs
    const goalKcalInput = document.getElementById('goalKcal');
    const goalProteinInput = document.getElementById('goalProtein');
    const goalCarbInput = document.getElementById('goalCarb');
    const goalFatInput = document.getElementById('goalFat');
    const userAgeInput = document.getElementById('userAge');
    const userSexInput = document.getElementById('userSex');
    const userWeightInput = document.getElementById('userWeight');
    const userHeightInput = document.getElementById('userHeight');
    const userActivityLevelInput = document.getElementById('userActivityLevel');
    const userGoalInput = document.getElementById('userGoal');

    const kcal = parseInt(goalKcalInput.value) || 0;
    const protein = parseInt(goalProteinInput.value) || 0;
    const carb = parseInt(goalCarbInput.value) || 0;
    const fat = parseInt(goalFatInput.value) || 0;

    // Basic validation
    if (kcal < 500 || protein < 10 || carb < 10 || fat < 5) {
        showToast('Valores de objetivos demasiado bajos. Por favor, revísalos.', 'error');
        return;
    }

    // Get profile data
    const age = parseInt(userAgeInput.value) || null;
    const sex = userSexInput.value || null;
    const weight = parseFloat(userWeightInput.value) || null;
    const height = parseInt(userHeightInput.value) || null;
    const activityLevel = parseFloat(userActivityLevelInput.value) || null;
    const goal = parseInt(userGoalInput.value) || null;

    // Save to state and localStorage
    userGoals = { kcal, protein, carb, fat };
    userProfile = { age, sex, weight, height, activityLevel, goal };

    localStorage.setItem('userGoals', JSON.stringify(userGoals));
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    // Close modal and update UI
    if (window.updateAppVisualState) {
        window.updateAppVisualState('calculator');
    } else {
        const goalModal = document.getElementById('goalModal');
        goalModal.style.display = 'none';
    }
    updateUI();
    showToast('Objetivos guardados correctamente.', 'success');
}

/**
 * Deletes a food entry with animation.
 * @param {number} entryId - The ID of the entry to delete
 */
export function deleteFoodEntry(entryId) {
    const entriesListEl = document.getElementById('entriesList');
    const entryElement = entriesListEl.querySelector(`li[data-entry-id="${entryId}"]`);
    
    if (entryElement) {
        // Add fade-out animation
        entryElement.style.opacity = '0';
        entryElement.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            // Remove from array and update storage
            dailyEntries = dailyEntries.filter(entry => entry.id !== entryId);
            localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
            updateUI();
        }, 300);
    } else {
        // Fallback if element not found
        dailyEntries = dailyEntries.filter(entry => entry.id !== entryId);
        localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
        updateUI();
    }
}

/**
 * Calculates recommended goals based on user profile.
 * Uses Mifflin-St Jeor formula for BMR.
 */
export function calculateRecommendedGoals() {
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

    const age = parseInt(userAgeInput.value);
    const sex = userSexInput.value;
    const weight = parseFloat(userWeightInput.value);
    const height = parseInt(userHeightInput.value);
    const activityLevel = parseFloat(userActivityLevelInput.value);
    const goalModifier = parseInt(userGoalInput.value);

    if (!age || !sex || !weight || !height || !activityLevel || goalModifier === null) {
        showToast('Por favor, completa todos los campos de la calculadora.', 'warning');
        return;
    }
    
    if (age < 15 || age > 100 || weight < 30 || height < 100) {
        showToast('Valores poco realistas. Por favor, revísalos.', 'warning');
        return;
    }

    // Mifflin-St Jeor BMR Formula
    let bmr;
    if (sex === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Total Daily Energy Expenditure
    const tdee = bmr * activityLevel;

    // Adjust TDEE based on goal
    const targetKcal = Math.round(tdee + goalModifier);

    // Calculate Macros
    const targetProtein = Math.round(weight * PROTEIN_PER_KG);
    const kcalFromProtein = targetProtein * 4;

    const kcalFromFat = targetKcal * FAT_PERCENTAGE;
    const targetFat = Math.round(kcalFromFat / 9);

    const kcalFromCarbs = targetKcal - kcalFromProtein - kcalFromFat;
    const targetCarb = Math.round(kcalFromCarbs / 4);

    // Sanity check
    if (targetKcal < 1200 || targetProtein < 30 || targetCarb < 30 || targetFat < 15) {
        showToast('Los objetivos calculados parecen muy bajos. Considera ajustar tu perfil.', 'warning');
    }

    // Fill in the manual input fields
    goalKcalInput.value = targetKcal;
    goalProteinInput.value = targetProtein;
    goalCarbInput.value = targetCarb;
    goalFatInput.value = targetFat;

    showToast('Objetivos calculados. Haz clic en "Guardar Objetivos" para confirmar.', 'success');
} 