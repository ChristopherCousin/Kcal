// Servicios de API para reconocimiento de alimentos y obtención de datos nutricionales

import { GOOGLE_CLOUD_CONFIG, NUTRITION_API_CONFIG, OPENAI_CONFIG, AI_PROVIDER, API_PROXY, SUPABASE_CONFIG } from './api-config.js';
import { showToast } from './ui-helpers.js';
import { analyzeFood } from '../services/openai-service.js';

/**
 * Convierte una imagen a formato Base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - Promesa que resuelve con la imagen en Base64
 */
export function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result;
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Determina qué API usar para analizar la imagen
 * @param {File} imageFile - Archivo de imagen
 * @returns {Promise<Array>} - Promesa que resuelve con los alimentos detectados
 */
export async function analyzeImageWithAI(imageFile) {
    // Verificar si se ha configurado una API key
    if (AI_PROVIDER === 'OPENAI' && OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI' && 
        (AI_PROVIDER !== 'SUPABASE' || !SUPABASE_CONFIG.API_KEY)) {
        showToast('Error: Debes configurar tu API key de OpenAI en api-config.js', 'error');
        throw new Error('API key de OpenAI no configurada');
    } else if (AI_PROVIDER === 'GOOGLE_VISION' && GOOGLE_CLOUD_CONFIG.VISION_API_KEY === 'TU_API_KEY_AQUI') {
        showToast('Error: Debes configurar tu API key de Google Vision en api-config.js', 'error');
        throw new Error('API key de Google Vision no configurada');
    }
    
    // Usar la API seleccionada
    if (AI_PROVIDER === 'SUPABASE') {
        // Convertir imagen a Base64
        const imageData = await imageToBase64(imageFile);
        // Extraer solo la parte de base64 sin el prefijo de data URL
        const base64Data = imageData.split(',')[1];
        
        // Usar el servicio de Supabase
        const result = await analyzeFood(base64Data);
        
        // Convertir respuesta de Supabase al formato que espera la aplicación
        return convertSupabaseResponseToStandardFormat(result);
    } else if (AI_PROVIDER === 'OPENAI') {
        return analyzeImageWithOpenAI(imageFile);
    } else {
        return analyzeImageWithVision(imageFile);
    }
}

/**
 * Convierte la respuesta de Supabase al formato estándar usado por la aplicación
 * @param {Object} supabaseResult - Resultado del análisis de Supabase
 * @returns {Array} - Array con el formato esperado por la aplicación
 */
function convertSupabaseResponseToStandardFormat(supabaseResult) {
    if (!supabaseResult || !supabaseResult.foods) {
        return [];
    }
    
    return supabaseResult.foods.map(food => ({
        name: food,
        portion: 'porción estimada',
        confidence: 90, // Valor por defecto
        macros: {
            kcal: Math.round(supabaseResult.calories / supabaseResult.foods.length),
            protein: Math.round(supabaseResult.macros.protein / supabaseResult.foods.length),
            carb: Math.round(supabaseResult.macros.carbs / supabaseResult.foods.length),
            fat: Math.round(supabaseResult.macros.fat / supabaseResult.foods.length)
        }
    }));
}

/**
 * Envía una imagen a OpenAI (GPT-4 Vision) para análisis de alimentos
 * @param {File} imageFile - Archivo de imagen a analizar
 * @returns {Promise<Array>} - Promesa que resuelve con los alimentos detectados
 */
async function analyzeImageWithOpenAI(imageFile) {
    try {
        // Convertir imagen a Base64
        const imageBase64 = await imageToBase64(imageFile);
        
        // Instrucciones específicas para el análisis de alimentos
        const prompt = `Analiza esta imagen de comida en detalle. Por favor identifica todos los alimentos presentes, 
        e incluye la siguiente información para cada uno:
        1. Nombre exacto del alimento
        2. Porción estimada en gramos (sé lo más preciso posible)
        3. Valores nutricionales por porción:
           - Calorías (kcal)
           - Proteínas (g)
           - Carbohidratos (g)
           - Grasas (g)
        4. Nivel de confianza en la identificación (porcentaje)
        
        Si la imagen no contiene comida, por favor indícalo claramente.
        
        Responde SOLO en formato JSON con el siguiente esquema exactamente:
        {
          "isFood": boolean,
          "message": string (opcional, solo si no es comida),
          "foods": [
            {
              "name": string,
              "portion": string,
              "confidence": number (0-100),
              "macros": {
                "kcal": number,
                "protein": number,
                "carb": number,
                "fat": number
              }
            }
          ]
        }`;
        
        // Construir petición para OpenAI
        const requestBody = {
            model: OPENAI_CONFIG.MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageBase64
                            }
                        }
                    ]
                }
            ],
            max_tokens: OPENAI_CONFIG.MAX_TOKENS
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
                    imageBase64,
                    prompt
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
        let jsonResponse;
        try {
            // Intentar analizar la respuesta como JSON
            const content = data.choices[0].message.content;
            // Extraer solo el objeto JSON si está entre ``` o contenido extra
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                               content.match(/```([\s\S]*?)```/) || 
                               content.match(/{[\s\S]*?}/);
                               
            const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '') : content;
            jsonResponse = JSON.parse(jsonString);
        } catch (error) {
            console.error('Error al parsear respuesta JSON:', error);
            throw new Error('Formato de respuesta no válido');
        }
        
        // Verificar si la imagen es de comida
        if (!jsonResponse.isFood) {
            return []; // Devolver array vacío si no es comida
        }
        
        // Devolver los alimentos detectados
        return jsonResponse.foods;
        
    } catch (error) {
        console.error('Error al analizar imagen con OpenAI:', error);
        throw error;
    }
}

/**
 * Envía una imagen a Google Cloud Vision API para análisis
 * @param {File} imageFile - Archivo de imagen a analizar
 * @returns {Promise<Array>} - Promesa que resuelve con los objetos detectados
 */
export async function analyzeImageWithVision(imageFile) {
    try {
        // Convertir imagen a Base64
        const imageBase64 = await imageToBase64(imageFile);
        // Extraer solo la parte de datos del Base64
        const base64Data = imageBase64.split(',')[1];
        
        // Construir petición para Vision API
        const requestBody = {
            requests: [
                {
                    image: {
                        content: base64Data
                    },
                    features: [
                        {
                            type: 'LABEL_DETECTION',
                            maxResults: 15
                        },
                        {
                            type: 'OBJECT_LOCALIZATION',
                            maxResults: 15
                        }
                    ]
                }
            ]
        };
        
        // Determinar URL de la API
        const apiUrl = API_PROXY.ENABLED 
            ? API_PROXY.URL 
            : `${GOOGLE_CLOUD_CONFIG.VISION_API_ENDPOINT}?key=${GOOGLE_CLOUD_CONFIG.VISION_API_KEY}`;
        
        // Realizar petición a la API
        let response;
        if (API_PROXY.ENABLED) {
            // Si usamos un proxy, enviamos solo lo necesario
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service: 'google_vision',
                    imageBase64: base64Data
                })
            });
        } else {
            // Petición directa a Google Vision
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Procesar respuesta para extraer alimentos
        const processedFoods = processFoodFromVisionResponse(data);
        
        // Si no se detectaron alimentos, consultar a GPT para una segunda opinión
        if (processedFoods.length === 0 && AI_PROVIDER === 'GOOGLE_VISION' && OPENAI_CONFIG.API_KEY !== 'TU_API_KEY_AQUI') {
            console.log('No se detectaron alimentos con Vision API, consultando a GPT...');
            return analyzeImageWithOpenAI(imageFile);
        }
        
        return processedFoods;
        
    } catch (error) {
        console.error('Error al analizar imagen con Vision API:', error);
        throw error;
    }
}

/**
 * Procesa la respuesta de Vision API para extraer alimentos
 * @param {Object} visionResponse - Respuesta de Vision API
 * @returns {Array} - Array de alimentos detectados
 */
function processFoodFromVisionResponse(visionResponse) {
    try {
        // Obtener las etiquetas de la respuesta
        const labels = visionResponse.responses[0].labelAnnotations || [];
        const objects = visionResponse.responses[0].localizedObjectAnnotations || [];
        
        // Crear lista con todas las etiquetas (para verificar si hay comida)
        const allLabels = labels.map(label => label.description.toLowerCase());
        
        // Verificar si hay alguna etiqueta relacionada con comida
        const hasFoodLabel = allLabels.some(label => isFoodCategory(label));
        
        // Si no hay etiquetas de comida, devolver array vacío
        if (!hasFoodLabel) {
            console.log('No se detectaron alimentos en la imagen');
            return [];
        }
        
        // Filtrar solo las etiquetas relacionadas con comida
        const foodLabels = labels.filter(label => {
            const description = label.description.toLowerCase();
            return isFoodCategory(description);
        });
        
        // Filtrar objetos relacionados con comida
        const foodObjects = objects.filter(obj => {
            const name = obj.name.toLowerCase();
            return isFoodCategory(name);
        });
        
        // Combinar etiquetas y objetos para obtener mejor precisión
        const detectedFoods = [];
        
        // Procesar etiquetas de comida (máximo 5 para evitar falsos positivos)
        foodLabels.slice(0, 5).forEach(label => {
            const existingIndex = detectedFoods.findIndex(
                food => food.name.toLowerCase() === label.description.toLowerCase()
            );
            
            if (existingIndex === -1) {
                detectedFoods.push({
                    name: formatFoodName(label.description),
                    confidence: Math.round(label.score * 100),
                    position: null,
                    portion: estimateDefaultPortion(label.description),
                    macros: null
                });
            }
        });
        
        // Añadir información de posición desde objetos detectados
        foodObjects.forEach(obj => {
            const existingIndex = detectedFoods.findIndex(
                food => food.name.toLowerCase() === obj.name.toLowerCase()
            );
            
            if (existingIndex !== -1) {
                // Actualizar posición si el alimento ya existe
                detectedFoods[existingIndex].position = obj.boundingPoly;
            } else {
                // Añadir nuevo alimento con posición
                detectedFoods.push({
                    name: formatFoodName(obj.name),
                    confidence: Math.round(obj.score * 100),
                    position: obj.boundingPoly,
                    portion: estimateDefaultPortion(obj.name),
                    macros: null
                });
            }
        });
        
        // Estimar macronutrientes basados en datos predefinidos
        // En una app real, aquí harías una llamada a una API nutricional
        detectedFoods.forEach(food => {
            food.macros = estimateNutritionValues(food.name, food.portion);
        });
        
        // Ordenar por nivel de confianza
        return detectedFoods.sort((a, b) => b.confidence - a.confidence);
        
    } catch (error) {
        console.error('Error al procesar datos de Vision API:', error);
        return [];
    }
}

/**
 * Verifica si una etiqueta corresponde a una categoría de alimento
 * @param {string} label - Etiqueta a verificar
 * @returns {boolean} - True si es comida, false en caso contrario
 */
function isFoodCategory(label) {
    // Lista de categorías específicas de alimentos (más estricta)
    const foodCategories = [
        'food', 'meal', 'dish', 'cuisine', 'breakfast', 'lunch', 'dinner',
        'fruit', 'vegetable', 'meat', 'fish', 'bread', 'rice', 'pasta',
        'dairy', 'cheese', 'yogurt', 'milk', 'egg', 'chicken', 'beef', 'pork',
        'seafood', 'grain', 'nut', 'legume', 'dessert', 
        
        // Términos en español
        'comida', 'alimento', 'plato', 'desayuno', 'almuerzo', 'cena',
        'fruta', 'verdura', 'carne', 'pescado', 'pan', 'arroz', 'pasta',
        'lácteo', 'queso', 'yogur', 'leche', 'huevo', 'pollo', 'ternera',
        'cerdo', 'marisco', 'cereal', 'nuez', 'legumbre', 'postre'
    ];
    
    // Lista de términos a excluir (para evitar falsos positivos)
    const excludeTerms = [
        'person', 'people', 'human', 'car', 'vehicle', 'building', 'furniture',
        'electronic', 'gadget', 'landscape', 'persona', 'gente', 'humano',
        'coche', 'vehículo', 'edificio', 'mueble', 'electrónico', 'paisaje'
    ];
    
    // Si contiene un término de exclusión, no es comida
    if (excludeTerms.some(term => label.includes(term))) {
        return false;
    }
    
    // Verificar si contiene alguna categoría de comida
    return foodCategories.some(category => label.includes(category));
}

/**
 * Formatea el nombre del alimento para mejor presentación
 * @param {string} name - Nombre a formatear
 * @returns {string} - Nombre formateado
 */
function formatFoodName(name) {
    // Convertir primera letra a mayúscula
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Estima una porción por defecto basada en el tipo de alimento
 * @param {string} foodName - Nombre del alimento
 * @returns {string} - Porción estimada
 */
function estimateDefaultPortion(foodName) {
    const name = foodName.toLowerCase();
    
    if (name.includes('arroz') || name.includes('pasta') || name.includes('rice')) {
        return '100g';
    } else if (name.includes('pollo') || name.includes('chicken') || 
               name.includes('carne') || name.includes('meat')) {
        return '150g';
    } else if (name.includes('fruta') || name.includes('fruit')) {
        return '80g';
    } else if (name.includes('verdura') || name.includes('vegetable')) {
        return '80g';
    } else if (name.includes('pan') || name.includes('bread')) {
        return '50g';
    } else {
        return '100g'; // Porción por defecto
    }
}

/**
 * Estima valores nutricionales basados en datos precompilados
 * En una app real, esto conectaría con una API nutricional
 * @param {string} foodName - Nombre del alimento
 * @param {string} portion - Porción estimada
 * @returns {Object} - Valores nutricionales estimados
 */
function estimateNutritionValues(foodName, portion) {
    const name = foodName.toLowerCase();
    const portionValue = parseInt(portion);
    
    // Base de datos simplificada (por 100g)
    const nutritionDB = {
        // Frutas
        'manzana': { kcal: 52, protein: 0.3, carb: 14, fat: 0.2 },
        'plátano': { kcal: 89, protein: 1.1, carb: 23, fat: 0.3 },
        'naranja': { kcal: 43, protein: 0.9, carb: 8.3, fat: 0.1 },
        
        // Verduras
        'brócoli': { kcal: 34, protein: 2.8, carb: 6, fat: 0.4 },
        'zanahoria': { kcal: 41, protein: 0.9, carb: 10, fat: 0.2 },
        'tomate': { kcal: 18, protein: 0.9, carb: 3.9, fat: 0.2 },
        
        // Proteínas
        'pollo': { kcal: 165, protein: 31, carb: 0, fat: 3.6 },
        'carne': { kcal: 250, protein: 26, carb: 0, fat: 15 },
        'pescado': { kcal: 130, protein: 22, carb: 0, fat: 5 },
        'huevo': { kcal: 155, protein: 13, carb: 1.1, fat: 11 },
        
        // Carbohidratos
        'arroz': { kcal: 130, protein: 2.7, carb: 28, fat: 0.3 },
        'pasta': { kcal: 158, protein: 5.8, carb: 30, fat: 0.9 },
        'pan': { kcal: 265, protein: 9, carb: 49, fat: 3.2 },
        'patata': { kcal: 77, protein: 2, carb: 17, fat: 0.1 },
        
        // Lácteos
        'leche': { kcal: 42, protein: 3.4, carb: 5, fat: 1 },
        'yogurt': { kcal: 59, protein: 3.6, carb: 4.7, fat: 3.3 },
        'queso': { kcal: 402, protein: 25, carb: 1.3, fat: 33 },
    };
    
    // Buscar coincidencia parcial en la base de datos
    let nutrition = null;
    for (const [key, value] of Object.entries(nutritionDB)) {
        if (name.includes(key)) {
            nutrition = value;
            break;
        }
    }
    
    // Si no hay coincidencia, usar valores por defecto
    if (!nutrition) {
        nutrition = { kcal: 100, protein: 5, carb: 15, fat: 3 };
    }
    
    // Ajustar según la porción
    const multiplier = portionValue / 100;
    return {
        kcal: Math.round(nutrition.kcal * multiplier),
        protein: +(nutrition.protein * multiplier).toFixed(1),
        carb: +(nutrition.carb * multiplier).toFixed(1),
        fat: +(nutrition.fat * multiplier).toFixed(1)
    };
} 