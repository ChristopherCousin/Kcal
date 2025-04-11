// Archivo principal que coordina la inicialización de la aplicación

// Importar módulos
import { setupEventListeners } from './modules/events.js';
import { loadData } from './modules/data.js';
import { showToast } from './utils/ui-helpers.js';
import { GOOGLE_CLOUD_CONFIG, OPENAI_CONFIG, AI_PROVIDER } from './utils/api-config.js';
import * as debug from './utils/debug.js'; // Importar el módulo de depuración

console.error('MAIN.JS - IMPORTACIÓN DE MÓDULOS COMPLETADA');
console.error('DEBUG MODULE LOADED:', debug);

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("[MAIN.JS] Inicializando aplicación...");
    
    // Configuración global para mostrar errores no capturados
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('[ERROR GLOBAL] Error no capturado:', message);
        console.error('[ERROR GLOBAL] Archivo:', source);
        console.error('[ERROR GLOBAL] Línea:', lineno, 'Columna:', colno);
        console.error('[ERROR GLOBAL] Error objeto:', error);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        return false; // Permite que el error se propague
    };
    
    // Interceptar errores en promesas no manejadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('[ERROR PROMESA] Promesa rechazada no manejada:', event.reason);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    });

    console.log("[MAIN.JS] Verificando configuración de API...");
    
    // Verificar configuración de API
    if (AI_PROVIDER === 'OPENAI' && OPENAI_CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
        console.warn('[MAIN.JS] ⚠️ Debes configurar tu API key de OpenAI en utils/api-config.js para usar todas las funcionalidades de IA.');
    } else if (AI_PROVIDER === 'GOOGLE_VISION' && GOOGLE_CLOUD_CONFIG.VISION_API_KEY === 'TU_API_KEY_AQUI') {
        console.warn('[MAIN.JS] ⚠️ Debes configurar tu API key de Google Cloud Vision en utils/api-config.js para usar la detección automática de alimentos.');
    }
    
    // Inicializar eventos primero
    console.log("[MAIN.JS] Inicializando event listeners...");
    setupEventListeners();
    
    // Esperar un breve momento para que todo se inicialice correctamente antes de cargar datos
    console.log("[MAIN.JS] Esperando inicialización completa antes de cargar datos...");
    
    setTimeout(() => {
        console.log("[MAIN.JS] Cargando datos desde localStorage...");
        // Cargar datos de localStorage (esto también maneja la redirección si hay objetivos)
        loadData();
        
        console.log(`[MAIN.JS] 🚀 Datos cargados! Comprobando persistencia de datos...`);
        // Verificar que tenemos datos en localStorage para diagnóstico
        const hasProfile = localStorage.getItem('userProfile') !== null;
        const hasGoals = localStorage.getItem('userGoals') !== null;
        console.log(`[MAIN.JS] ✓ Perfil guardado: ${hasProfile}, Objetivos guardados: ${hasGoals}`);
    }, 100);
    
    // Mensaje de bienvenida para desarrollo
    console.log(`[MAIN.JS] 🚀 App inicializada! Versión con IA: usando ${AI_PROVIDER} para análisis de alimentos.`);
    
    // Si las APIs están configuradas, mostrar mensaje
    if ((AI_PROVIDER === 'OPENAI' && OPENAI_CONFIG.API_KEY !== 'TU_API_KEY_AQUI') || 
        (AI_PROVIDER === 'GOOGLE_VISION' && GOOGLE_CLOUD_CONFIG.VISION_API_KEY !== 'TU_API_KEY_AQUI')) {
        console.log('[MAIN.JS] ✅ API configurada correctamente.');
    }
    
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
});

// Exportar funciones que necesitan ser accesibles globalmente
export { showToast }; 