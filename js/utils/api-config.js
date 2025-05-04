// Configuración de APIs externas

/**
 * Configuración para APIs de IA
 * 
 * NOTA IMPORTANTE: En producción NUNCA debes incluir claves API directamente en el código frontend.
 * Siempre usa un backend/servidor intermedio para proteger tus claves.
 * Esta implementación es SOLO PARA DEMOSTRACIÓN.
 */

// Selecciona qué API de IA usar para análisis de alimentos
export const AI_PROVIDER = 'SUPABASE'; // Opciones: 'GOOGLE_VISION', 'OPENAI', 'LOCAL', 'SUPABASE'
console.log('======= API PROVIDER CONFIGURADO: ' + AI_PROVIDER + ' =======');

/**
 * Configuración para OpenAI (GPT-4) - YA NO SE USA DIRECTAMENTE
 * Ahora todas las solicitudes a OpenAI pasan por Supabase Edge Functions
 */
export const OPENAI_CONFIG = {
    API_KEY: 'TU_API_KEY_AQUI', // Ya no se usa directamente - Se almacena en Supabase
    API_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o', // Modelo actual recomendado por OpenAI
    MAX_TOKENS: 1000
};

/**
 * Configuración para Google Cloud Vision API
 * 
 * INSTRUCCIONES PARA CONFIGURAR GOOGLE CLOUD VISION API:
 * 
 * 1. Crear una cuenta en Google Cloud Platform (https://cloud.google.com/)
 * 2. Crear un nuevo proyecto en la consola de Google Cloud
 * 3. Habilitar la API de Cloud Vision en: APIs y Servicios > Biblioteca
 * 4. Crear credenciales de API en: APIs y Servicios > Credenciales
 *    - Seleccionar "Crear credenciales" > "Clave de API"
 *    - Copiar la clave generada
 * 5. Reemplazar el valor de VISION_API_KEY abajo con tu clave real
 * 6. (Opcional) Restringir la clave para que solo funcione con la API de Vision
 *    y desde dominios específicos por seguridad
 * 
 * NOTA IMPORTANTE: En una aplicación de producción, la clave de API debería
 * estar en el servidor, no en el cliente. Esta implementación es solo para
 * demostración. El enfoque recomendado es usar una Cloud Function o un
 * backend propio que actúe como intermediario para ocultar la clave de API.
 */
export const GOOGLE_CLOUD_CONFIG = {
    VISION_API_KEY: 'TU_API_KEY_AQUI', // Reemplazar con una API key válida
    VISION_API_ENDPOINT: 'https://vision.googleapis.com/v1/images:annotate',
};

/**
 * Configuración de la base de datos nutricional
 * Podrías usar APIs como:
 * - Open Food Facts (gratuita): https://world.openfoodfacts.org/data
 * - Nutritionix (de pago): https://www.nutritionix.com/
 * - Edamam (de pago): https://developer.edamam.com/food-database-api
 */
export const NUTRITION_API_CONFIG = {
    API_ENDPOINT: 'https://world.openfoodfacts.org/api/v0/product/',
};

/**
 * Configuración para el reconocimiento de volumen/tamaño
 * Esto sería para estimar las porciones de comida
 */
export const PORTION_ESTIMATION_CONFIG = {
    // Factores de conversión aproximados para diferentes alimentos
    // Estos valores serían usados cuando no se puede determinar con precisión
    DEFAULT_DENSITY: {
        'fruta': 0.8, // g/cm³
        'verdura': 0.6,
        'carne': 1.05,
        'pescado': 0.94,
        'pan': 0.35,
        'arroz cocido': 0.7,
        'pasta cocida': 0.8,
        'líquido': 1.0,
    },
};

/**
 * URL del servidor proxy para API calls
 * En producción, deberías tener un servidor propio que actúe como intermediario
 * para proteger tus claves API y manejar la autenticación.
 */
export const API_PROXY = {
    // Si tienes un servidor proxy, configúralo aquí
    // URL: 'https://tu-servidor.com/api/proxy',
    // Si usas Firebase, podrías usar una Cloud Function
    // URL: 'https://us-central1-tu-proyecto.cloudfunctions.net/callVisionApi',
    ENABLED: false, // Cambiar a true si usas un proxy
    URL: ''
};

/**
 * Servidor para cálculos de nutrición basados en AI
 * En producción, deberías tener un servidor que maneje estas solicitudes
 */
export const NUTRITION_AI_SERVER = {
    ENABLED: false,
    URL: 'https://tu-servidor.com/api/calculate-nutrition',
    // Si está deshabilitado, se usará el cálculo local como fallback
}; 

// Configuración para servicios API

// Configuración de Supabase
export const SUPABASE_CONFIG = {
    PROJECT_URL: 'https://nmxcjhadpequkuuutepa.supabase.co',
    API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5teGNqaGFkcGVxdWt1dXV0ZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTExOTgsImV4cCI6MjA2MTg2NzE5OH0.cGZO0mDjDbUP9fd0mKGd_d6AHlfhB8EPRfgJX9v_m04'
};

// Añadir aquí otras configuraciones API si es necesario 