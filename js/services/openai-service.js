// Servicio para comunicación con OpenAI API
import { OPENAI_CONFIG, AI_PROVIDER } from '../utils/api-config.js';
import { showToast } from '../utils/ui-helpers.js';

/**
 * Analiza una imagen de comida utilizando GPT-4o
 * @param {string} imageBase64 - Imagen en formato base64
 * @returns {Promise<Object>} - Resultado del análisis
 */
export async function analyzeFood(imageBase64) {
    // Verificar si está configurado para usar OpenAI
    if (AI_PROVIDER !== 'OPENAI' || OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
        // Si no está configurado, simular el análisis para desarrollo
        console.log('API no configurada, usando simulación de análisis');
        return simulateFoodAnalysis();
    }
    
    try {
        const prompt = createFoodAnalysisPrompt();
        
        // Preparar la solicitud para OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un experto en nutrición que analiza fotos de comida para calcular calorías y macronutrientes.'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { 
                                type: 'image_url', 
                                image_url: { 
                                    url: `data:image/jpeg;base64,${imageBase64}` 
                                } 
                            }
                        ]
                    }
                ],
                max_tokens: 800,
                temperature: 0.2
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        return parseFoodAnalysisResponse(result.choices[0].message.content);
        
    } catch (error) {
        console.error('Error al analizar la imagen:', error);
        showToast('Error al analizar la imagen. Intentando modo de respaldo...', 'error');
        
        // En caso de error, volver al modo simulado
        return simulateFoodAnalysis();
    }
}

/**
 * Crea el prompt optimizado para análisis de comida
 * @returns {string} - Prompt para GPT-4o
 */
function createFoodAnalysisPrompt() {
    return `
Analiza esta imagen de comida y proporciona la siguiente información en formato JSON:

1. Identifica los alimentos presentes en la imagen.
2. Calcula las calorías aproximadas.
3. Estima macronutrientes: proteínas, carbohidratos y grasas (en gramos).
4. Indica si es adecuada para algún objetivo específico (pérdida de peso, ganancia muscular, etc.).

Por favor, proporciona solo el objeto JSON con esta estructura exacta, sin texto adicional:
{
  "foods": [lista de alimentos identificados],
  "calories": número total de calorías,
  "macros": {
    "protein": gramos de proteína,
    "carbs": gramos de carbohidratos,
    "fat": gramos de grasa
  },
  "bestFor": "objetivo para el que esta comida es más adecuada"
}`;
}

/**
 * Procesa la respuesta del análisis de comida
 * @param {string} responseText - Texto de respuesta de GPT-4o
 * @returns {Object} - Datos estructurados del análisis
 */
function parseFoodAnalysisResponse(responseText) {
    try {
        // Extraer solo el JSON de la respuesta
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        
        // Parsear el JSON
        const data = JSON.parse(jsonStr);
        
        return {
            foods: data.foods || [],
            calories: data.calories || 0,
            macros: {
                protein: data.macros?.protein || 0,
                carbs: data.macros?.carbs || 0,
                fat: data.macros?.fat || 0
            },
            bestFor: data.bestFor || 'Sin recomendación específica'
        };
    } catch (error) {
        console.error('Error al procesar la respuesta:', error);
        return {
            foods: ['No se pudo identificar los alimentos'],
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0 },
            bestFor: 'Sin información'
        };
    }
}

/**
 * Función de respaldo que simula el análisis para desarrollo
 * @returns {Object} - Datos simulados de análisis
 */
function simulateFoodAnalysis() {
    // Crear 1-3 segundos de retraso artificial para simular el análisis
    return new Promise(resolve => {
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
            // Generar datos simulados
            const options = [
                {
                    foods: ['Ensalada de pollo', 'Aguacate', 'Tomate'],
                    calories: 450,
                    macros: { protein: 32, carbs: 15, fat: 28 },
                    bestFor: 'Pérdida de peso'
                },
                {
                    foods: ['Pasta con salsa', 'Pan', 'Queso parmesano'],
                    calories: 680,
                    macros: { protein: 22, carbs: 92, fat: 18 },
                    bestFor: 'Ganancia muscular'
                },
                {
                    foods: ['Bowl de açaí', 'Plátano', 'Granola', 'Miel'],
                    calories: 520,
                    macros: { protein: 8, carbs: 86, fat: 12 },
                    bestFor: 'Energía pre-entrenamiento'
                }
            ];
            
            // Seleccionar aleatoriamente uno de los ejemplos
            const randomIndex = Math.floor(Math.random() * options.length);
            resolve(options[randomIndex]);
        }, delay);
    });
} 