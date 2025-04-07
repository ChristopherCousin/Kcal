// Archivo principal que coordina la inicialización de la aplicación

// Importar módulos
import { setupEventListeners } from './modules/events.js';
import { loadData } from './modules/data.js';
import { showToast } from './utils/ui-helpers.js';

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing app...");
    setupEventListeners();
    loadData();
});

// Exportar funciones que necesitan ser accesibles globalmente
export { showToast }; 