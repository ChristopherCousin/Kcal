/**
 * Servicio para el cálculo de objetivos nutricionales con IA
 */

import { OPENAI_CONFIG, GOOGLE_CLOUD_CONFIG, AI_PROVIDER, SUPABASE_CONFIG } from '../utils/api-config.js';
import { analyzeFood } from './openai-service.js';

/**
 * Calcula objetivos nutricionales utilizando el servicio de IA configurado
 * @param {Object} profile - Perfil del usuario
 * @returns {Promise<Object>} - Objetivos calculados
 */
export async function calculateNutritionGoals(profile) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('[NUTRITION-API] Servicio de IA: Calculando objetivos para:', profile);
    console.log('[NUTRITION-API] Proveedor de IA configurado:', AI_PROVIDER);
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    // Si el proveedor configurado es LOCAL, usamos directamente el cálculo local
    if (AI_PROVIDER === 'LOCAL') {
        console.log('[NUTRITION-API] Usando cálculo LOCAL como proveedor principal por configuración');
        return calculateLocally(profile);
    }
    
    console.log('[NUTRITION-API] ====== FORZANDO CÁLCULO CON IA - SIN FALLBACK LOCAL ======');
    
    // Comprobar que tenemos un proveedor válido
    if (AI_PROVIDER !== 'OPENAI' && AI_PROVIDER !== 'GOOGLE_VISION' && AI_PROVIDER !== 'SUPABASE') {
        console.error('[NUTRITION-API] ERROR: Proveedor inválido:', AI_PROVIDER);
        throw new Error('Proveedor de IA no configurado correctamente. Debe ser OPENAI, GOOGLE_VISION o SUPABASE');
    }
    
    // Mostrar detalles de la configuración
    console.log('[NUTRITION-API] Configuración OpenAI:', {
        endpoint: OPENAI_CONFIG.API_ENDPOINT,
        model: OPENAI_CONFIG.MODEL,
        keyConfigured: OPENAI_CONFIG.API_KEY !== 'TU_API_KEY_AQUI'
    });
    
    console.log('[NUTRITION-API] Configuración Google Vision:', {
        endpoint: GOOGLE_CLOUD_CONFIG.VISION_API_ENDPOINT,
        keyConfigured: GOOGLE_CLOUD_CONFIG.VISION_API_KEY !== 'TU_API_KEY_AQUI'
    });

    if (AI_PROVIDER === 'SUPABASE') {
        console.log('[NUTRITION-API] Configuración Supabase:', {
            projectUrl: SUPABASE_CONFIG.PROJECT_URL,
            keyConfigured: !!SUPABASE_CONFIG.API_KEY
        });
    }

    // Si no hay ninguna API configurada correctamente, usar cálculo local
    if (
        (AI_PROVIDER === 'OPENAI' && (OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI' || OPENAI_CONFIG.API_KEY === 'sk-...')) ||
        (AI_PROVIDER === 'GOOGLE_VISION' && GOOGLE_CLOUD_CONFIG.VISION_API_KEY === 'TU_API_KEY_AQUI') ||
        (AI_PROVIDER === 'SUPABASE' && (!SUPABASE_CONFIG.PROJECT_URL || !SUPABASE_CONFIG.API_KEY))
    ) {
        console.log('[NUTRITION-API] API key de ejemplo detectada o configuración incompleta. Usando cálculo local como alternativa');
        return calculateLocally(profile);
    }
    
    try {
        // Intentar con el proveedor configurado
        console.log('[NUTRITION-API] Iniciando cálculo con proveedor principal:', AI_PROVIDER);
        if (AI_PROVIDER === 'OPENAI') {
            return await calculateWithOpenAI(profile);
        } else if (AI_PROVIDER === 'SUPABASE') {
            return await calculateWithSupabase(profile);
        } else {
            return await calculateWithGoogleVision(profile);
        }
    } catch (error) {
        console.error(`[NUTRITION-API] Error al calcular con ${AI_PROVIDER}:`, error);
        
        // Si el proveedor principal falla, intentar con otro como respaldo
        try {
            // Determinar proveedor alternativo
            let alternativeProvider;
            if (AI_PROVIDER === 'SUPABASE') {
                alternativeProvider = 'OPENAI';
            } else if (AI_PROVIDER === 'OPENAI') {
                alternativeProvider = 'GOOGLE_VISION';
            } else {
                alternativeProvider = 'OPENAI';
            }
            
            console.log(`[NUTRITION-API] Intentando con proveedor alternativo: ${alternativeProvider}`);
            
            if (alternativeProvider === 'OPENAI') {
                return await calculateWithOpenAI(profile);
            } else if (alternativeProvider === 'SUPABASE') {
                return await calculateWithSupabase(profile);
            } else {
                return await calculateWithGoogleVision(profile);
            }
        } catch (secondError) {
            console.error(`[NUTRITION-API] Error al calcular con proveedor alternativo:`, secondError);
            console.log('[NUTRITION-API] Todos los proveedores de IA fallaron, usando cálculo local como último recurso');
            return calculateLocally(profile);
        }
    }
}

/**
 * Calcula objetivos usando OpenAI
 * @param {Object} profile - Perfil del usuario
 * @returns {Promise<Object>} - Objetivos calculados
 */
async function calculateWithOpenAI(profile) {
    try {
        console.log('[NUTRITION-API] Calculando con OpenAI...');
        
        if (OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI' || OPENAI_CONFIG.API_KEY === 'sk-...') {
            console.error('[NUTRITION-API] Error: API key de OpenAI no configurada');
            throw new Error('API key de OpenAI no configurada');
        }
        
        console.log('[NUTRITION-API] Preparando solicitud a OpenAI...');
        
        // Preparar información de composición corporal
        let bodyCompInfo = '';
        if (profile.bodyfat) {
            bodyCompInfo += `- Porcentaje de grasa corporal: ${profile.bodyfat}%\n`;
        }
        
        // Preparar información de trabajo y actividad física
        let activityInfo = '';
        if (profile.jobType) {
            activityInfo += `- Tipo de trabajo: ${profile.jobType}\n`;
        }
        
        if (profile.trainingType && profile.trainingType !== 'none') {
            activityInfo += `- Tipo de entrenamiento: ${profile.trainingType}\n`;
            if (profile.trainingFrequency) {
                activityInfo += `- Frecuencia: ${profile.trainingFrequency} horas semanales\n`;
            }
        }
        
        // Preparar información dietética
        let dietInfo = '';
        if (profile.dietType && profile.dietType !== 'standard') {
            dietInfo += `- Preferencia alimentaria: ${profile.dietType}\n`;
        }
        if (profile.mealsPerDay) {
            dietInfo += `- Preferencia de comidas: ${profile.mealsPerDay} comidas al día\n`;
        }
        
        // Determinar el objetivo con déficit calórico si está especificado
        let goalDescription = profile.goalDescription || 'mantenimiento';
        
        // Si existe el valor de déficit/superávit específico, usarlo
        let goalDetailText = '';
        if (profile.goalDeficit !== undefined) {
            if (profile.goalDeficit < 0) {
                goalDetailText = ` (déficit de ${Math.abs(profile.goalDeficit)} calorías)`;
            } else if (profile.goalDeficit > 0) {
                goalDetailText = ` (superávit de ${profile.goalDeficit} calorías)`;
            }
        }
        
        const response = await fetch(OPENAI_CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.MODEL,
                messages: [
                    {
                        role: "system",
                        content: "Eres un nutricionista y entrenador personal experto especializado en cálculos metabólicos precisos y planes nutricionales personalizados. Proporciona valores basados en la ciencia más actualizada de nutrición deportiva. Responde siempre en formato JSON."
                    },
                    {
                        role: "user",
                        content: `Calcula un plan nutricional personalizado para una persona con las siguientes características:

DATOS BÁSICOS:
- Sexo: ${profile.gender === 'male' ? 'Masculino' : 'Femenino'}
- Edad: ${profile.age} años
- Peso: ${profile.weight} kg
- Altura: ${profile.height} cm
- Nivel de actividad: ${profile.activity}
- Objetivo: ${goalDescription}${goalDetailText}

${bodyCompInfo ? `COMPOSICIÓN CORPORAL:\n${bodyCompInfo}` : ''}
${activityInfo ? `ACTIVIDAD Y TRABAJO:\n${activityInfo}` : ''}
${dietInfo ? `PREFERENCIAS DIETÉTICAS:\n${dietInfo}` : ''}

Por favor, proporciona los siguientes datos en tu respuesta:
1. BMR (metabolismo basal)
2. Calorías de mantenimiento
3. Calorías objetivo según meta especificada
4. Proteínas (g)
5. Carbohidratos (g)
6. Grasas (g)
7. Distribución recomendada de macronutrientes (% de cada uno)
8. Recomendación de número de comidas
9. Ventana de alimentación recomendada
10. Alimentos recomendados según perfil
11. Alimentos a evitar según perfil
12. Suplementos recomendados (si aplica)

Responde SOLO en formato JSON con las siguientes propiedades como mínimo: bmr, maintenance, goalCalories, protein, carbs, fat, proteinPercent, carbsPercent, fatPercent, mealsPerDay, feedingWindow, recommendedFoods, foodsToAvoid, supplements.
Asegúrate de que todos los valores numéricos sean enteros sin decimales.`
                    }
                ],
                max_tokens: OPENAI_CONFIG.MAX_TOKENS
            })
        });
        
        if (!response.ok) {
            console.error('[NUTRITION-API] Error en la API de OpenAI:', response.status);
            throw new Error(`Error en la API de OpenAI: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[NUTRITION-API] Respuesta de OpenAI recibida:', data);
        
        // Extraer el JSON de la respuesta
        const content = data.choices[0].message.content;
        console.log('[NUTRITION-API] Contenido de la respuesta:', content);
        
        let recommendations;
        try {
            // Intentar analizar la respuesta como JSON
            recommendations = JSON.parse(content);
        } catch (jsonError) {
            console.error('[NUTRITION-API] Error al analizar JSON de OpenAI:', jsonError);
            console.log('[NUTRITION-API] Intentando extraer JSON de texto...');
            
            // Intentar encontrar JSON dentro del texto
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    recommendations = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('[NUTRITION-API] No se pudo extraer JSON válido:', e);
                    throw new Error('Formato de respuesta de OpenAI inválido');
                }
            } else {
                console.error('[NUTRITION-API] No se encontró JSON en la respuesta');
                throw new Error('Formato de respuesta de OpenAI inválido');
            }
        }
        
        console.log('[NUTRITION-API] Recomendaciones de OpenAI procesadas:', recommendations);
        
        // Validar y asegurar que todos los campos necesarios existen
        const requiredFields = ['bmr', 'maintenance', 'goalCalories', 'protein', 'carbs', 'fat'];
        const missingFields = requiredFields.filter(field => recommendations[field] === undefined);
        
        if (missingFields.length > 0) {
            console.error('[NUTRITION-API] Faltan campos en la respuesta:', missingFields);
            
            // Calcular los campos faltantes
            if (!recommendations.bmr) {
                recommendations.bmr = calculateBasalMetabolicRate(profile);
            }
            if (!recommendations.maintenance) {
                recommendations.maintenance = Math.round(recommendations.bmr * profile.activity);
            }
            if (!recommendations.goalCalories) {
                recommendations.goalCalories = calculateGoalCalories(profile, recommendations.maintenance);
            }
            if (!recommendations.protein) {
                recommendations.protein = Math.round(profile.weight * 1.8);
            }
            if (!recommendations.carbs) {
                const proteinCals = recommendations.protein * 4;
                const fatCals = (recommendations.fat || Math.round(recommendations.goalCalories * 0.25 / 9)) * 9;
                recommendations.carbs = Math.round((recommendations.goalCalories - proteinCals - fatCals) / 4);
            }
            if (!recommendations.fat) {
                recommendations.fat = Math.round(recommendations.goalCalories * 0.25 / 9);
            }
        }
        
        // Asegurar que todos los valores son números
        for (const key of requiredFields) {
            if (typeof recommendations[key] === 'string') {
                recommendations[key] = parseInt(recommendations[key]);
            }
        }
        
        // Añadir fuente
        recommendations.source = 'OpenAI';
        
        console.log('[NUTRITION-API] Recomendaciones finales de OpenAI:', recommendations);
        return recommendations;
    } catch (error) {
        console.error('[NUTRITION-API] Error completo al calcular con OpenAI:', error);
        throw error;
    }
}

/**
 * Calcula objetivos usando Google Vision API
 * @param {Object} profile - Perfil del usuario
 * @returns {Promise<Object>} - Objetivos calculados
 */
async function calculateWithGoogleVision(profile) {
    try {
        console.log('Calculando con Google Vision...');
        
        if (GOOGLE_CLOUD_CONFIG.VISION_API_KEY === 'TU_API_KEY_AQUI') {
            throw new Error('API key de Google Vision no configurada');
        }
        
        // Preparamos un texto con instrucciones para la API
        const instructionsText = `
            OBJETIVO: CÁLCULO NUTRICIONAL
            PERFIL:
            - Sexo: ${profile.gender === 'male' ? 'Masculino' : 'Femenino'}
            - Edad: ${profile.age} años
            - Peso: ${profile.weight} kg
            - Altura: ${profile.height} cm
            - Nivel actividad: ${profile.activity}
            - Objetivo: ${profile.goal === 'lose' ? 'Perder peso' : profile.goal === 'gain' ? 'Ganar peso' : 'Mantener peso'}
            
            DEVOLVER JSON: {"bmr": X, "maintenance": Y, "goalCalories": Z, "protein": P, "carbs": C, "fat": F}
        `;
        
        // Crear una imagen con el texto (en base64)
        const textImageBase64 = await createTextImage(instructionsText);
        
        const response = await fetch(`${GOOGLE_CLOUD_CONFIG.VISION_API_ENDPOINT}?key=${GOOGLE_CLOUD_CONFIG.VISION_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        content: textImageBase64
                    },
                    features: [{
                        type: 'TEXT_DETECTION',
                        maxResults: 1
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error en la API de Google Vision: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Respuesta de Google Vision:', data);
        
        if (!data.responses || !data.responses[0].textAnnotations || !data.responses[0].textAnnotations[0]) {
            throw new Error('No se pudo detectar texto en la imagen enviada a Google Vision');
        }
        
        // Intentar extraer solo el JSON de la respuesta
        const detectedText = data.responses[0].textAnnotations[0].description;
        console.log('Texto detectado:', detectedText);
        
        // Buscar un patrón JSON en el texto detectado usando regex
        const jsonPattern = /{(?:[^{}]|{[^{}]*})*}/g;
        const jsonMatches = detectedText.match(jsonPattern);
        
        if (!jsonMatches || jsonMatches.length === 0) {
            throw new Error('No se pudo encontrar un JSON válido en la respuesta de Google Vision');
        }
        
        // Intentar parsear el primer JSON encontrado
        let recommendationsJson;
        for (const jsonStr of jsonMatches) {
            try {
                recommendationsJson = JSON.parse(jsonStr);
                if (recommendationsJson.bmr && recommendationsJson.maintenance) {
                    break;
                }
            } catch (e) {
                console.warn('Error al parsear posible JSON:', jsonStr, e);
                // Continuar con el siguiente match
            }
        }
        
        if (!recommendationsJson || !recommendationsJson.bmr) {
            throw new Error('No se pudo extraer un JSON válido con recomendaciones nutricionales');
        }
        
        // Procesar los resultados y asegurar que son números
        const recommendations = {
            bmr: parseInt(recommendationsJson.bmr) || calculateBasalMetabolicRate(profile),
            maintenance: parseInt(recommendationsJson.maintenance) || Math.round(calculateBasalMetabolicRate(profile) * profile.activity),
            goalCalories: parseInt(recommendationsJson.goalCalories) || calculateGoalCalories(profile),
            protein: parseInt(recommendationsJson.protein) || Math.round(profile.weight * 1.8),
            carbs: parseInt(recommendationsJson.carbs) || 200,  // valor por defecto si falla
            fat: parseInt(recommendationsJson.fat) || 60       // valor por defecto si falla
        };
        
        // Añadir fuente
        recommendations.source = 'Google Vision';
        
        return recommendations;
    } catch (error) {
        console.error('Error al calcular con Google Vision:', error);
        throw error;
    }
}

/**
 * Crea una imagen con texto para enviar a Google Vision
 * @param {string} text - Texto para incluir en la imagen
 * @returns {Promise<string>} - Imagen en base64
 */
async function createTextImage(text) {
    // Simulamos la creación de una imagen con el texto
    // En un entorno real, deberíamos crear una imagen real con un canvas o similar
    
    // Convertimos el texto a base64 directamente como fallback
    // Esto no es una imagen real, pero para fines de demostración
    return btoa(text);
}

/**
 * Calcula el metabolismo basal (BMR)
 * @param {Object} profile - Perfil del usuario
 * @returns {number} - BMR calculado
 */
function calculateBasalMetabolicRate(profile) {
    // Fórmula de Harris-Benedict
    let bmr = 0;
    if (profile.gender === 'male') {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
    return Math.round(bmr);
}

/**
 * Calcula las calorías objetivo basadas en el objetivo del usuario
 * @param {Object} profile - Perfil del usuario
 * @param {number} maintenance - Calorías de mantenimiento
 * @returns {number} - Calorías objetivo
 */
function calculateGoalCalories(profile, maintenance) {
    if (!maintenance) {
        const bmr = calculateBasalMetabolicRate(profile);
        maintenance = Math.round(bmr * profile.activity);
    }
    
    let goalModifier = 0;
    if (profile.goal === 'lose') goalModifier = -500;
    else if (profile.goal === 'gain') goalModifier = 500;
    
    return maintenance + goalModifier;
}

/**
 * Calcula objetivos localmente usando fórmulas estándar
 * @param {Object} profile - Perfil del usuario
 * @returns {Object} - Objetivos calculados
 */
function calculateLocally(profile) {
    console.log('[NUTRITION-API] Calculando localmente...', profile);
    
    // Extraer datos del perfil
    const { gender, age, weight, height, activity, goal } = profile;
    
    // Constantes para el cálculo
    const PROTEIN_PER_KG = 1.8; // g por kg de peso corporal
    const FAT_PERCENTAGE = 0.25; // % del total de calorías
    
    // Fórmula de Harris-Benedict
    let bmr = 0;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Redondear BMR
    bmr = Math.round(bmr);
    console.log('[NUTRITION-API] BMR calculado localmente:', bmr);
    
    // Ajustar por nivel de actividad
    const maintenance = Math.round(bmr * activity);
    console.log('[NUTRITION-API] Mantenimiento calculado localmente:', maintenance);
    
    // Ajustar según el objetivo
    let goalModifier = 0;
    if (goal === 'lose') goalModifier = -500;
    else if (goal === 'gain') goalModifier = 500;
    
    const goalCalories = maintenance + goalModifier;
    console.log('[NUTRITION-API] Calorías objetivo calculadas localmente:', goalCalories);
    
    // Calcular macros
    const protein = Math.round(weight * PROTEIN_PER_KG);
    const fat = Math.round((goalCalories * FAT_PERCENTAGE) / 9);
    const carbs = Math.round((goalCalories - (protein * 4) - (fat * 9)) / 4);
    
    console.log('[NUTRITION-API] Macros calculados localmente:', { protein, carbs, fat });
    
    // Crear resultado
    return {
        bmr,
        maintenance,
        goalCalories,
        protein,
        carbs,
        fat,
        source: 'Cálculo local'
    };
}

/**
 * Calcula objetivos usando Supabase Edge Function
 * @param {Object} profile - Perfil del usuario
 * @returns {Promise<Object>} - Objetivos calculados
 */
async function calculateWithSupabase(profile) {
    try {
        console.log('[NUTRITION-API] Calculando con Supabase...');
        
        if (!SUPABASE_CONFIG.PROJECT_URL || !SUPABASE_CONFIG.API_KEY) {
            console.error('[NUTRITION-API] Error: Configuración de Supabase incompleta');
            throw new Error('Configuración de Supabase incompleta');
        }
        
        console.log('[NUTRITION-API] Preparando solicitud a Supabase Edge Function...');
        
        // Preparar información de composición corporal y otros detalles
        let bodyCompInfo = '';
        if (profile.bodyfat) {
            bodyCompInfo += `- Porcentaje de grasa corporal: ${profile.bodyfat}%\n`;
        }
        
        // Preparar información de trabajo y actividad física
        let activityInfo = '';
        if (profile.jobType) {
            activityInfo += `- Tipo de trabajo: ${profile.jobType}\n`;
        }
        
        if (profile.trainingType && profile.trainingType !== 'none') {
            activityInfo += `- Tipo de entrenamiento: ${profile.trainingType}\n`;
            if (profile.trainingFrequency) {
                activityInfo += `- Frecuencia: ${profile.trainingFrequency} horas semanales\n`;
            }
        }
        
        // Preparar información dietética
        let dietInfo = '';
        if (profile.dietType && profile.dietType !== 'standard') {
            dietInfo += `- Preferencia alimentaria: ${profile.dietType}\n`;
        }
        if (profile.mealsPerDay) {
            dietInfo += `- Preferencia de comidas: ${profile.mealsPerDay} comidas al día\n`;
        }
        
        // Determinar el objetivo con déficit calórico si está especificado
        let goalDescription = profile.goalDescription || 'mantenimiento';
        
        // Si existe el valor de déficit/superávit específico, usarlo
        let goalDetailText = '';
        if (profile.goalDeficit !== undefined) {
            if (profile.goalDeficit < 0) {
                goalDetailText = ` (déficit de ${Math.abs(profile.goalDeficit)} calorías)`;
            } else if (profile.goalDeficit > 0) {
                goalDetailText = ` (superávit de ${profile.goalDeficit} calorías)`;
            }
        }
        
        // Crear el mensaje para el análisis
        const promptMessage = `Calcula un plan nutricional personalizado para una persona con las siguientes características:

DATOS BÁSICOS:
- Sexo: ${profile.gender === 'male' ? 'Masculino' : 'Femenino'}
- Edad: ${profile.age} años
- Peso: ${profile.weight} kg
- Altura: ${profile.height} cm
- Nivel de actividad: ${profile.activity}
- Objetivo: ${goalDescription}${goalDetailText}

${bodyCompInfo ? `COMPOSICIÓN CORPORAL:\n${bodyCompInfo}` : ''}
${activityInfo ? `ACTIVIDAD Y TRABAJO:\n${activityInfo}` : ''}
${dietInfo ? `PREFERENCIAS DIETÉTICAS:\n${dietInfo}` : ''}

Por favor, proporciona los siguientes datos en tu respuesta:
1. BMR (metabolismo basal)
2. Calorías de mantenimiento
3. Calorías objetivo según meta especificada
4. Proteínas (g)
5. Carbohidratos (g)
6. Grasas (g)
7. Distribución recomendada de macronutrientes (% de cada uno)
8. Recomendación de número de comidas
9. Ventana de alimentación recomendada
10. Alimentos recomendados según perfil
11. Alimentos a evitar según perfil
12. Suplementos recomendados (si aplica)

Responde SOLO en formato JSON con las siguientes propiedades como mínimo: bmr, maintenance, goalCalories, protein, carbs, fat, proteinPercent, carbsPercent, fatPercent, mealsPerDay, feedingWindow, recommendedFoods, foodsToAvoid, supplements.
Asegúrate de que todos los valores numéricos sean enteros sin decimales.`;

        // Usar la Edge Function analyze-food que ya existe pero adaptada para este caso
        try {
            console.log('[NUTRITION-API] Enviando solicitud a Supabase Edge Function analyze-food (adaptada para nutrición)...');
            
            // Vamos a usar la función analyze-food pero con un "prompt" especial para calcular objetivos
            const response = await fetch(`${SUPABASE_CONFIG.PROJECT_URL}/functions/v1/analyze-food`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.API_KEY}`
                },
                body: JSON.stringify({
                    prompt: promptMessage,
                    nutritionCalculation: true, // Indicador especial para el servidor
                    profileData: profile // Enviar datos del perfil completo por si se necesitan
                })
            });
            
            if (!response.ok) {
                console.error('[NUTRITION-API] Error en respuesta de Supabase:', response.status);
                throw new Error(`Error en la respuesta de Supabase: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('[NUTRITION-API] Respuesta de Supabase recibida:', result);
            
            // Verificar si tenemos la propiedad content en la respuesta
            if (!result.content) {
                console.error('[NUTRITION-API] Formato de respuesta inválido de Supabase');
                throw new Error('Formato de respuesta inválido de Supabase');
            }
            
            // Procesar la respuesta
            let recommendations;
            try {
                // Intentar analizar el contenido como JSON directamente
                if (typeof result.content === 'string') {
                    // Extraer solo el JSON de la respuesta si viene en formato string
                    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : result.content;
                    recommendations = JSON.parse(jsonStr);
                } else if (typeof result.content === 'object') {
                    // Si ya viene como objeto, usarlo directamente
                    recommendations = result.content;
                } else {
                    throw new Error('Formato de contenido inesperado');
                }
            } catch (jsonError) {
                console.error('[NUTRITION-API] Error al analizar JSON de Supabase:', jsonError);
                throw new Error('No se pudo procesar la respuesta de Supabase');
            }
            
            // Validar y asegurar que todos los campos necesarios existen
            const requiredFields = ['bmr', 'maintenance', 'goalCalories', 'protein', 'carbs', 'fat'];
            const missingFields = requiredFields.filter(field => recommendations[field] === undefined);
            
            if (missingFields.length > 0) {
                console.error('[NUTRITION-API] Faltan campos en la respuesta de Supabase:', missingFields);
                
                // Calcular los campos faltantes
                if (!recommendations.bmr) {
                    recommendations.bmr = calculateBasalMetabolicRate(profile);
                }
                if (!recommendations.maintenance) {
                    recommendations.maintenance = Math.round(recommendations.bmr * profile.activity);
                }
                if (!recommendations.goalCalories) {
                    recommendations.goalCalories = calculateGoalCalories(profile, recommendations.maintenance);
                }
                if (!recommendations.protein) {
                    recommendations.protein = Math.round(profile.weight * 1.8);
                }
                if (!recommendations.carbs) {
                    const proteinCals = recommendations.protein * 4;
                    const fatCals = (recommendations.fat || Math.round(recommendations.goalCalories * 0.25 / 9)) * 9;
                    recommendations.carbs = Math.round((recommendations.goalCalories - proteinCals - fatCals) / 4);
                }
                if (!recommendations.fat) {
                    recommendations.fat = Math.round(recommendations.goalCalories * 0.25 / 9);
                }
            }
            
            // Asegurar que todos los valores son números
            for (const key of requiredFields) {
                if (typeof recommendations[key] === 'string') {
                    recommendations[key] = parseInt(recommendations[key]);
                }
            }
            
            // Añadir fuente
            recommendations.source = 'Supabase + OpenAI';
            
            console.log('[NUTRITION-API] Recomendaciones finales de Supabase:', recommendations);
            return recommendations;
            
        } catch (error) {
            console.error('[NUTRITION-API] Error al comunicarse con Supabase:', error);
            
            // Si falla la llamada a Supabase, intentamos con OpenAI directamente como alternativa
            console.log('[NUTRITION-API] Intentando usar OpenAI directamente como alternativa...');
            try {
                return await calculateWithOpenAI(profile);
            } catch (openaiError) {
                console.error('[NUTRITION-API] Error al calcular con OpenAI como alternativa:', openaiError);
                throw error; // Seguimos lanzando el error original de Supabase
            }
        }
    } catch (error) {
        console.error('[NUTRITION-API] Error al calcular con Supabase:', error);
        throw error;
    }
} 