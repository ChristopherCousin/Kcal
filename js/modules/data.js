// Módulo para manejar datos y almacenamiento

import { updateUI } from './ui.js';
import { openGoalModal } from './modals.js';
import { showToast } from '../utils/ui-helpers.js';
import { calculateNutritionGoals } from '../services/nutrition-api.js';

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

/**
 * Updates the uploaded photo file reference
 * @param {File|null} file - The file to set, or null to clear
 */
export function setUploadedPhotoFile(file) {
    uploadedPhotoFile = file;
}

/**
 * Clears the uploaded photo file
 */
export function clearUploadedPhotoFile() {
    uploadedPhotoFile = null;
}

/**
 * Updates the selected food
 * @param {Object|null} food - The food object to set, or null to clear
 */
export function setSelectedFood(food) {
    selectedFood = food;
}

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
    console.log("[DATA.JS] Iniciando carga de datos desde localStorage...");
    isLoading = true;
    let goalsLoaded = false;
    let entriesLoaded = false;
    let appInitialized = false;
    
    try {
        // Load User Profile
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                const parsedProfile = JSON.parse(savedProfile);
                if (parsedProfile) {
                    userProfile = parsedProfile;
                    console.log("[DATA.JS] Perfil cargado:", userProfile);
                }
            } catch (error) {
                console.error("[DATA.JS] Error al cargar perfil:", error);
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
                    console.log("[DATA.JS] Objetivos cargados:", userGoals);
                }
            } catch (error) {
                console.error("[DATA.JS] Error al cargar objetivos:", error);
                localStorage.removeItem('userGoals');
            }
        }

        // Load Daily Entries
        const savedEntries = localStorage.getItem('dailyEntries');
        if (savedEntries) {
            try {
                dailyEntries = JSON.parse(savedEntries) || [];
                entriesLoaded = dailyEntries.length > 0;
                console.log(`[DATA.JS] ${dailyEntries.length} entradas cargadas`);
            } catch (error) {
                console.error("[DATA.JS] Error al cargar entradas:", error);
                localStorage.removeItem('dailyEntries');
                dailyEntries = [];
            }
        }

        // Load app initialization state
        appInitialized = localStorage.getItem('hasLoadedBefore') === 'true';
        
        isLoading = false;
        
        // Primero actualizar la UI con los datos cargados
        updateUI();
        
        // Luego decidir a qué pantalla redirigir basado en los datos cargados
        console.log(`[DATA.JS] Decidiendo pantalla inicial - Objetivos: ${goalsLoaded}, Perfil: ${!!userProfile?.weight}`);
        
        // Si tenemos objetivos configurados y datos de perfil, ir a pantalla de seguimiento
        if (goalsLoaded && userProfile && userProfile.weight) {
            console.log('[DATA.JS] Objetivos y perfil cargados, redirigiendo a pantalla de seguimiento...');
            // Usando setTimeout para asegurar que la UI esté lista
            setTimeout(() => {
                if (window.updateAppVisualState) {
                    window.updateAppVisualState('tracking');
                    console.log('[DATA.JS] Redirigido a pantalla de seguimiento');
                    // Solo mostrar toast si ya había datos guardados previamente
                    if (appInitialized) {
                        showToast('Bienvenido de nuevo. Tus datos están listos.', 'success');
                    }
                } else {
                    console.error('[DATA.JS] ERROR: updateAppVisualState no disponible');
                }
            }, 300);
        } else {
            // Si no hay objetivos, mostrar la calculadora
            setTimeout(() => {
                if (window.updateAppVisualState) {
                    window.updateAppVisualState('calculator');
                    console.log('[DATA.JS] Redirigido a calculadora (sin objetivos)');
                }
            }, 300);
            
            // Verificar si la app ya ha sido inicializada antes
            if (!appInitialized && !goalsLoaded) {
                console.log('[DATA.JS] Primera ejecución de la app. Sugerimos configurar objetivos.');
                // Mostrar toast sugiriendo configurar objetivos
                setTimeout(() => {
                    showToast('Bienvenido a Kcal. Configura tus objetivos para empezar.', 'info');
                }, 1000);
            }
        }
    } catch (error) {
        console.error("[DATA.JS] Error crítico durante carga de datos:", error);
        // Forzar vista de calculadora en caso de error
        setTimeout(() => {
            if (window.updateAppVisualState) {
                window.updateAppVisualState('calculator');
            }
        }, 300);
    }
    
    // Marcar que la aplicación ya se ha cargado al menos una vez
    localStorage.setItem('hasLoadedBefore', 'true');
    
    console.log("[DATA.JS] Carga de datos finalizada");
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
 * Calcula y proporciona recomendaciones de objetivos nutricionales personalizados
 * basados en el perfil del usuario utilizando IA cuando sea posible.
 * @param {Object} profile - Perfil completo del usuario
 * @returns {Promise<Object>} - Objetivos calculados
 */
export async function calculateRecommendedGoals(profile) {
    console.log("==========================================================");
    console.log("[NUEVA VERSION - DATA.JS] FUNCIÓN ORIGINAL calculateRecommendedGoals LLAMADA");
    console.log("[NUEVA VERSION - DATA.JS] ARCHIVO: js/modules/data.js");
    console.log("[NUEVA VERSION - DATA.JS] Perfil recibido:", profile);
    console.log("==========================================================");
    
    // Para depuración: ver quién llamó a esta función
    try {
        throw new Error("Punto de control: ¿Quién llamó a calculateRecommendedGoals?");
    } catch (error) {
        console.log("Stack trace de quién llamó a calculateRecommendedGoals:", error);
    }
    
    // Si no tenemos un perfil válido, no podemos hacer cálculos
    if (!profile || !profile.gender || !profile.age || !profile.weight || !profile.height) {
        throw new Error("Perfil de usuario incompleto para calcular objetivos");
    }
    
    console.log("[NUEVA VERSIÓN - DATA.JS] Llamando al servicio de IA (calculateNutritionGoals)");
    
    // Construir un perfil completo con los datos adicionales si existen
    const enhancedProfile = {
        ...profile,
        // Datos de composición corporal (si existen)
        bodyfat: profile.bodyfat || null,
        
        // Datos de trabajo y entrenamiento (si existen)
        jobType: profile.jobType || 'sedentary',
        trainingType: profile.trainingType || null,
        trainingFrequency: profile.trainingFrequency || null,
        
        // Preferencias dietéticas (si existen)
        dietType: profile.dietType || 'standard',
        mealsPerDay: profile.mealsPerDay || '3'
    };
    
    // Traducir valor del objetivo según el nuevo selector
    if (profile.goal) {
        switch(profile.goal) {
            case 'lose-fast':
                enhancedProfile.goalDeficit = -1000; // -1kg/semana aproximadamente
                enhancedProfile.goalDescription = 'pérdida de grasa rápida';
                break;
            case 'lose':
                enhancedProfile.goalDeficit = -500; // -0.5kg/semana aproximadamente
                enhancedProfile.goalDescription = 'pérdida de grasa moderada';
                break;
            case 'lose-mild':
                enhancedProfile.goalDeficit = -300; // -0.3kg/semana aproximadamente
                enhancedProfile.goalDescription = 'pérdida de grasa gradual';
                break;
            case 'gain':
                enhancedProfile.goalDeficit = 500; // +0.5kg/semana aproximadamente
                enhancedProfile.goalDescription = 'ganancia muscular moderada';
                break;
            case 'gain-mild':
                enhancedProfile.goalDeficit = 200; // +0.2kg/semana aproximadamente
                enhancedProfile.goalDescription = 'ganancia muscular gradual';
                break;
            default:
                enhancedProfile.goalDeficit = 0; // mantener composición corporal
                enhancedProfile.goalDescription = 'mantenimiento';
        }
    }
    
    console.log("[NUEVA VERSIÓN - DATA.JS] IMPORTANTE: Iniciando llamada a calculateNutritionGoals a las " + new Date().toISOString());
    
    try {
        // Llamar al servicio de IA con el perfil mejorado
        const recommendations = await calculateNutritionGoals(enhancedProfile);
        console.log("[NUEVA VERSIÓN - DATA.JS] Llamada a calculateNutritionGoals completada exitosamente");
        return recommendations;
    } catch (error) {
        console.error("[NUEVA VERSIÓN - DATA.JS] Error al llamar a calculateNutritionGoals:", error);
        throw error;
    }
}

/**
 * Convierte un nivel de actividad numérico a texto
 * @param {number} activityLevel - Nivel de actividad (1.2-1.9)
 * @returns {string} Nombre del nivel de actividad
 */
function getActivityLevelName(activityLevel) {
    if (activityLevel <= 1.2) return 'sedentaria';
    if (activityLevel <= 1.375) return 'ligera';
    if (activityLevel <= 1.55) return 'moderada';
    if (activityLevel <= 1.725) return 'alta';
    return 'muy alta';
}

/**
 * Convierte un modificador de objetivo a nombre
 * @param {number} goalModifier - Modificador de calorías
 * @returns {string} Nombre del objetivo
 */
function getGoalName(goalModifier) {
    if (goalModifier < 0) return 'pérdida de peso';
    if (goalModifier > 0) return 'ganancia de peso';
    return 'mantenimiento';
} 