// Supabase Edge Function para análisis de comida y cálculos nutricionales usando OpenAI

// Esta función debe desplegarse en Supabase Edge Functions
// Instala Supabase CLI y ejecuta: supabase functions deploy analyze-food

// Importar tipos de Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Configura aquí tu API key de OpenAI (establécela como variable de entorno en Supabase)
// Para configurarla: supabase secrets set OPENAI_API_KEY=sk-tu-clave-secreta
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Configura el modelo de OpenAI
const OPENAI_MODEL = 'gpt-4o';

// Interfaz para la estructura de la petición de análisis de imagen
interface AnalyzeImageRequest {
  image: string; // Base64 de la imagen
  prompt: string; // Prompt para análisis
}

// Interfaz para la estructura de la petición de cálculo nutricional
interface NutritionCalculationRequest {
  nutritionCalculation: boolean; // Indicador de que es un cálculo nutricional
  prompt: string; // Prompt para el cálculo
  profileData?: any; // Datos del perfil de usuario
}

// Función principal para manejar solicitudes
serve(async (req: Request) => {
  // Configurar CORS para permitir solicitudes desde tu dominio
  const headers = {
    'Access-Control-Allow-Origin': '*', // Cambia esto a tu dominio en producción
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Manejar solicitudes OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Verificar API key de OpenAI
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada como variable de entorno');
    }

    // Obtener y validar el cuerpo de la petición
    const requestData = await req.json();
    
    // Determinar el tipo de solicitud (análisis de imagen o cálculo nutricional)
    const isNutritionCalculation = requestData.nutritionCalculation === true;
    
    if (isNutritionCalculation) {
      console.log("[SUPABASE] Procesando solicitud de cálculo nutricional");
      // Solicitud de cálculo nutricional
      return await handleNutritionCalculation(requestData, headers);
    } else {
      console.log("[SUPABASE] Procesando solicitud de análisis de imagen");
      // Solicitud de análisis de imagen
      if (!requestData.image) {
        throw new Error('Se requiere una imagen para el análisis');
      }
      return await handleImageAnalysis(requestData, headers);
    }
  } catch (error) {
    // Manejar errores
    console.error('[SUPABASE] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Maneja solicitudes de análisis de imágenes de comida
 * @param requestData Datos de la solicitud
 * @param headers Cabeceras HTTP para la respuesta
 * @returns Respuesta con los resultados del análisis
 */
async function handleImageAnalysis(requestData: AnalyzeImageRequest, headers: HeadersInit) {
  console.log("[SUPABASE] Preparando análisis de imagen");
  
  // Crear el sistema y prompt para OpenAI
  const systemPrompt = 'Eres un experto en nutrición que analiza fotos de comida para calcular calorías y macronutrientes.';
  const userPrompt = requestData.prompt || 'Analiza esta imagen de comida e identifica los alimentos, calorías aproximadas y macronutrientes.';

  console.log("[SUPABASE] Enviando imagen a OpenAI para análisis");
  
  // Llamar a la API de OpenAI
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${requestData.image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
    }),
  });

  // Verificar respuesta de OpenAI
  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.json();
    throw new Error(`Error de OpenAI: ${errorData.error?.message || 'Error desconocido'}`);
  }

  // Procesar respuesta de OpenAI
  const openaiData = await openaiResponse.json();
  const content = openaiData.choices[0].message.content;

  console.log("[SUPABASE] Análisis de imagen completado exitosamente");
  
  // Devolver respuesta al cliente
  return new Response(
    JSON.stringify({ success: true, content }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

/**
 * Maneja solicitudes de cálculo de objetivos nutricionales
 * @param requestData Datos de la solicitud
 * @param headers Cabeceras HTTP para la respuesta
 * @returns Respuesta con los resultados del cálculo nutricional
 */
async function handleNutritionCalculation(requestData: NutritionCalculationRequest, headers: HeadersInit) {
  console.log("[SUPABASE] Preparando cálculo de objetivos nutricionales");
  
  // Crear el sistema y prompt para OpenAI
  const systemPrompt = 'Eres un nutricionista y entrenador personal experto especializado en cálculos metabólicos precisos y planes nutricionales personalizados. Proporciona valores basados en la ciencia más actualizada de nutrición deportiva. Responde siempre en formato JSON.';
  const userPrompt = requestData.prompt;

  console.log("[SUPABASE] Enviando solicitud a OpenAI para cálculo nutricional");
  
  // Llamar a la API de OpenAI (solo con texto, sin imagen)
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.2,
    }),
  });

  // Verificar respuesta de OpenAI
  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.json();
    throw new Error(`Error de OpenAI para nutrición: ${errorData.error?.message || 'Error desconocido'}`);
  }

  // Procesar respuesta de OpenAI
  const openaiData = await openaiResponse.json();
  const content = openaiData.choices[0].message.content;

  console.log("[SUPABASE] Cálculo nutricional completado exitosamente");
  
  // Devolver respuesta al cliente
  return new Response(
    JSON.stringify({ success: true, content }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
} 