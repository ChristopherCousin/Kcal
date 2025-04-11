// Módulo para asesoramiento nutricional personalizado con IA

import { OPENAI_CONFIG, API_PROXY } from '../utils/api-config.js';
import { userProfile, userGoals, dailyEntries } from './data.js';
import { showToast } from '../utils/ui-helpers.js';

// Almacena el último plan generado
let lastGeneratedPlan = null;

/**
 * Genera un plan nutricional personalizado basado en los datos del usuario
 * @param {Object} options - Opciones para la generación del plan
 * @returns {Promise<Object>} - Promesa que resuelve con el plan generado
 */
export async function generateNutritionPlan(options = {}) {
    // Verificar si tenemos los datos necesarios
    if (!userProfile || !userGoals) {
        showToast('Necesitas configurar tu perfil y objetivos primero', 'warning');
        return null;
    }
    
    // Verificar API key
    if (OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
        showToast('Necesitas configurar tu API key de OpenAI', 'error');
        return null;
    }
    
    try {
        // Mostrar indicador de carga
        updateLoadingState(true);
        
        // Recopilar datos del usuario y sus actividades
        const userData = {
            profile: userProfile,
            goals: userGoals,
            activityPattern: options.activityPattern || {},
            dietaryPreferences: options.dietaryPreferences || [],
            foodAllergies: options.foodAllergies || []
        };
        
        // Obtener historial reciente de alimentos
        const recentFoods = dailyEntries.slice(-20).map(entry => entry.description);
        
        // Incluir preferencias del usuario
        const weekdayActivity = options.weekdayActivity || userData.profile.activityLevel;
        const weekendActivity = options.weekendActivity || (userData.profile.activityLevel === 'alta' ? 'moderada' : userData.profile.activityLevel);
        
        // Generar prompt específico para el plan nutricional
        const prompt = `
        Como nutricionista experto, crea un plan nutricional personalizado basado en los siguientes datos:
        
        PERFIL DEL USUARIO:
        - Género: ${userData.profile.gender}
        - Edad: ${userData.profile.age} años
        - Peso: ${userData.profile.weight} kg
        - Altura: ${userData.profile.height} cm
        - Nivel de actividad entre semana: ${weekdayActivity}
        - Nivel de actividad en fin de semana: ${weekendActivity}
        - Objetivo: ${userData.goals.goal}
        - Calorías diarias objetivo: ${userData.goals.calories} kcal

        ${userData.dietaryPreferences.length > 0 ? `PREFERENCIAS DIETÉTICAS: ${userData.dietaryPreferences.join(', ')}` : ''}
        ${userData.foodAllergies.length > 0 ? `ALERGIAS ALIMENTARIAS: ${userData.foodAllergies.join(', ')}` : ''}
        
        ${recentFoods.length > 0 ? `ALIMENTOS CONSUMIDOS RECIENTEMENTE: ${recentFoods.join(', ')}` : ''}
        
        INSTRUCCIONES:
        1. Crea un plan que tenga en cuenta diferentes niveles de actividad entre días laborables y fines de semana.
        2. Distribuye las calorías y macronutrientes de manera diferente según la actividad diaria.
        3. Sugiere comidas específicas para cada día, teniendo en cuenta las preferencias y alergias.
        4. Proporciona consejos específicos para seguir este plan.
        
        Por favor, proporciona una respuesta SOLO en formato JSON con la siguiente estructura exacta:
        {
          "weekdayPlan": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "meals": [
              {
                "name": string,
                "foods": array of strings,
                "macros": { "kcal": number, "protein": number, "carbs": number, "fat": number }
              }
            ]
          },
          "weekendPlan": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "meals": [
              {
                "name": string,
                "foods": array of strings,
                "macros": { "kcal": number, "protein": number, "carbs": number, "fat": number }
              }
            ]
          },
          "tips": array of strings
        }`;
        
        // Construir petición para OpenAI
        const requestBody = {
            model: OPENAI_CONFIG.MODEL.replace('-vision-preview', ''), // Usar modelo de texto
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };
        
        // Realizar petición a la API
        const apiUrl = API_PROXY.ENABLED ? API_PROXY.URL : OPENAI_CONFIG.API_ENDPOINT;
        
        let response;
        if (API_PROXY.ENABLED) {
            // Si usamos un proxy, enviamos solo lo necesario
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service: 'openai_chat',
                    prompt: prompt
                })
            });
        } else {
            // Petición directa a OpenAI (solo para desarrollo)
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_CONFIG.API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error en OpenAI API:', errorData);
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extraer la respuesta del contenido
        let nutritionPlan;
        try {
            // Intentar analizar la respuesta como JSON
            const content = data.choices[0].message.content;
            // Extraer solo el objeto JSON si está entre ``` o contenido extra
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                              content.match(/```([\s\S]*?)```/) || 
                              content.match(/{[\s\S]*?}/);
                               
            const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '') : content;
            nutritionPlan = JSON.parse(jsonString);
        } catch (error) {
            console.error('Error al parsear respuesta JSON:', error);
            throw new Error('Formato de respuesta no válido');
        }
        
        // Guardar el plan generado
        lastGeneratedPlan = nutritionPlan;
        
        // Ocultar indicador de carga
        updateLoadingState(false);
        
        return nutritionPlan;
    } catch (error) {
        console.error('Error al generar plan nutricional:', error);
        showToast('Error al generar el plan nutricional', 'error');
        
        // Ocultar indicador de carga en caso de error
        updateLoadingState(false);
        
        return null;
    }
}

/**
 * Analiza la actividad y progreso del usuario para dar recomendaciones
 * @returns {Promise<Object>} Promesa que resuelve con las recomendaciones
 */
export async function analyzeProgressAndActivity() {
    // Verificar si tenemos los datos necesarios
    if (!userProfile || !userGoals || dailyEntries.length === 0) {
        showToast('Necesitas datos suficientes para analizar progreso', 'warning');
        return null;
    }
    
    // Verificar API key
    if (OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
        showToast('Necesitas configurar tu API key de OpenAI', 'error');
        return null;
    }
    
    try {
        // Mostrar indicador de carga
        updateLoadingState(true);
        
        // Calcular estadísticas de los últimos 7 días
        const last7DaysEntries = dailyEntries.slice(-50); // Tomar los últimos 50 registros para análisis
        
        // Calcular calorías y macros promedio
        const nutritionStats = last7DaysEntries.reduce((stats, entry) => {
            stats.totalCalories += entry.macros.kcal;
            stats.totalProtein += entry.macros.protein;
            stats.totalCarbs += entry.macros.carb;
            stats.totalFat += entry.macros.fat;
            stats.count++;
            return stats;
        }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, count: 0 });
        
        const avgCalories = nutritionStats.count ? Math.round(nutritionStats.totalCalories / nutritionStats.count) : 0;
        const avgProtein = nutritionStats.count ? +(nutritionStats.totalProtein / nutritionStats.count).toFixed(1) : 0;
        const avgCarbs = nutritionStats.count ? +(nutritionStats.totalCarbs / nutritionStats.count).toFixed(1) : 0;
        const avgFat = nutritionStats.count ? +(nutritionStats.totalFat / nutritionStats.count).toFixed(1) : 0;
        
        // Generar prompt para análisis
        const prompt = `
        Como entrenador personal y nutricionista, analiza los datos de este usuario y proporciona recomendaciones:
        
        PERFIL DEL USUARIO:
        - Género: ${userProfile.gender}
        - Edad: ${userProfile.age} años
        - Peso: ${userProfile.weight} kg
        - Altura: ${userProfile.height} cm
        - Nivel de actividad: ${userProfile.activityLevel}
        
        OBJETIVOS:
        - Objetivo principal: ${userGoals.goal}
        - Calorías diarias objetivo: ${userGoals.calories} kcal
        
        CONSUMO RECIENTE (promedio diario):
        - Calorías: ${avgCalories} kcal
        - Proteínas: ${avgProtein} g
        - Carbohidratos: ${avgCarbs} g
        - Grasas: ${avgFat} g
        
        ANÁLISIS REQUERIDO:
        1. Evalúa si el consumo actual se alinea con los objetivos.
        2. Identifica posibles desequilibrios nutricionales.
        3. Proporciona recomendaciones específicas para ajustar la dieta.
        4. Sugiere cambios en la actividad física si es necesario.
        
        Por favor, proporciona tu análisis SOLO en formato JSON con la siguiente estructura exacta:
        {
          "analysisTitle": string,
          "summary": string,
          "alignmentWithGoals": string,
          "nutritionalBalance": string,
          "recommendations": {
            "dietary": [strings],
            "activity": [strings]
          },
          "suggestedMacros": {
            "protein": number,
            "carbs": number,
            "fat": number
          }
        }`;
        
        // Construir petición para OpenAI
        const requestBody = {
            model: OPENAI_CONFIG.MODEL.replace('-vision-preview', ''), // Usar modelo de texto
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        };
        
        // Realizar petición a la API
        const apiUrl = API_PROXY.ENABLED ? API_PROXY.URL : OPENAI_CONFIG.API_ENDPOINT;
        
        let response;
        if (API_PROXY.ENABLED) {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service: 'openai_chat',
                    prompt: prompt
                })
            });
        } else {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_CONFIG.API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extraer la respuesta del contenido
        let analysis;
        try {
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                              content.match(/```([\s\S]*?)```/) || 
                              content.match(/{[\s\S]*?}/);
                               
            const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '') : content;
            analysis = JSON.parse(jsonString);
        } catch (error) {
            console.error('Error al parsear respuesta JSON:', error);
            throw new Error('Formato de respuesta no válido');
        }
        
        // Ocultar indicador de carga
        updateLoadingState(false);
        
        return analysis;
    } catch (error) {
        console.error('Error al analizar progreso:', error);
        showToast('Error al analizar tu progreso', 'error');
        
        // Ocultar indicador de carga en caso de error
        updateLoadingState(false);
        
        return null;
    }
}

/**
 * Actualiza el estado de carga
 * @param {boolean} isLoading - Estado de carga
 */
function updateLoadingState(isLoading) {
    // Actualizar elementos de UI según corresponda
    const loadingIndicator = document.getElementById('aiCoachLoadingIndicator');
    const resultContent = document.getElementById('aiCoachResultContent');
    
    if (loadingIndicator && resultContent) {
        if (isLoading) {
            loadingIndicator.style.display = 'flex';
            resultContent.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            resultContent.style.display = 'block';
        }
    }
}

/**
 * Obtiene el último plan nutricional generado
 * @returns {Object|null} - Plan nutricional o null si no hay
 */
export function getLastGeneratedPlan() {
    return lastGeneratedPlan;
} 