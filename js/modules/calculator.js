/**
 * Módulo para cálculos de nutrición y metas
 */

import { calculateNutritionGoals } from '../services/nutrition-api.js';
import { showToast } from '../utils/ui-helpers.js';

/**
 * Cálculo local de BMR (NO USAR - Solo para identificar fuente del problema)
 */
export function calculateBMR(gender, age, weight, height) {
    console.error('⚠️⚠️⚠️ SE INTENTÓ USAR CALCULO LOCAL DE BMR - TRAZA:');
    console.trace();
    
    // Forzar error para detectar quién está llamando a esta función
    throw new Error('CÁLCULO LOCAL DE BMR NO PERMITIDO - USA LA API');
}

/**
 * Cálculo local de calorías de mantenimiento (NO USAR - Solo para identificar fuente del problema)
 */
export function calculateMaintenance(bmr, activity) {
    console.error('⚠️⚠️⚠️ SE INTENTÓ USAR CALCULO LOCAL DE MAINTENANCE - TRAZA:');
    console.trace();
    
    // Forzar error para detectar quién está llamando a esta función
    throw new Error('CÁLCULO LOCAL DE MANTENIMIENTO NO PERMITIDO - USA LA API');
}

/**
 * Cálculo local de calorías objetivo (NO USAR - Solo para identificar fuente del problema)
 */
export function calculateGoalCalories(maintenance, goal) {
    console.error('⚠️⚠️⚠️ SE INTENTÓ USAR CALCULO LOCAL DE GOAL CALORIES - TRAZA:');
    console.trace();
    
    // Forzar error para detectar quién está llamando a esta función
    throw new Error('CÁLCULO LOCAL DE CALORÍAS OBJETIVO NO PERMITIDO - USA LA API');
}

/**
 * Calcula todos los objetivos nutricionales para un perfil.
 * Esta función envuelve la llamada a la API y verifica que se está usando correctamente.
 */
export async function calculateGoals(profile) {
    console.log('[CALCULATOR.JS] Iniciando cálculo de objetivos para:', profile);
    
    // Verificar que tenemos todos los datos necesarios
    if (!profile.gender || !profile.age || !profile.weight || !profile.height || !profile.activity) {
        console.error('[CALCULATOR.JS] Datos de perfil incompletos:', profile);
        throw new Error('Datos de perfil incompletos para el cálculo');
    }
    
    try {
        // Llamar al servicio de nutrición
        console.log('[CALCULATOR.JS] Llamando a servicio de nutrición (API) para obtener recomendaciones');
        const recommendations = await calculateNutritionGoals(profile);
        
        // Verificar respuesta
        if (!recommendations.bmr || !recommendations.maintenance || !recommendations.goalCalories) {
            console.error('[CALCULATOR.JS] Respuesta incompleta de la API:', recommendations);
            throw new Error('Respuesta incompleta del servicio de nutrición');
        }
        
        console.log('[CALCULATOR.JS] Recomendaciones recibidas correctamente:', recommendations);
        return recommendations;
    } catch (error) {
        console.error('[CALCULATOR.JS] Error al calcular objetivos:', error);
        showToast('Error al calcular objetivos: ' + error.message, 'error');
        throw error;
    }
} 