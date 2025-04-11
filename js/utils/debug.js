/**
 * Utilidades de depuración para detectar problemas en el código
 */

/**
 * Analiza todos los scripts cargados en la página para buscar patrones específicos
 * @returns {Object} Información sobre los scripts y patrones encontrados
 */
export function analyzeLoadedScripts() {
    const scripts = document.querySelectorAll('script');
    const results = {
        totalScripts: scripts.length,
        scriptsInfo: [],
        suspiciousPatterns: []
    };
    
    console.error('=================== ANÁLISIS DE SCRIPTS ===================');
    console.error(`Encontrados ${scripts.length} scripts en la página`);
    
    scripts.forEach((script, index) => {
        const src = script.src || 'inline';
        results.scriptsInfo.push({ index, src });
        
        console.error(`Script ${index}: ${src}`);
        
        // Intentar analizar el contenido para scripts con URL
        if (script.src) {
            try {
                fetch(script.src)
                    .then(response => response.text())
                    .then(content => {
                        if (content.includes('BMR') || 
                            content.includes('maintenance') || 
                            content.includes('goalCalories') || 
                            content.includes('Cálculos:')) {
                            
                            const suspicious = {
                                scriptSrc: src,
                                patterns: []
                            };
                            
                            if (content.includes('BMR')) suspicious.patterns.push('BMR');
                            if (content.includes('maintenance')) suspicious.patterns.push('maintenance');
                            if (content.includes('goalCalories')) suspicious.patterns.push('goalCalories');
                            if (content.includes('Cálculos:')) suspicious.patterns.push('Cálculos:');
                            
                            results.suspiciousPatterns.push(suspicious);
                            console.error(`SCRIPT SOSPECHOSO: ${src}`);
                            console.error('Patrones encontrados:', suspicious.patterns);
                        }
                    })
                    .catch(err => console.error(`Error al analizar ${src}:`, err));
            } catch (e) {
                console.error(`No se pudo analizar ${src}:`, e);
            }
        } 
        // Analizar contenido inline
        else if (script.textContent) {
            const content = script.textContent;
            if (content.includes('BMR') || 
                content.includes('maintenance') || 
                content.includes('goalCalories') || 
                content.includes('Cálculos:')) {
                
                const suspicious = {
                    scriptType: 'inline',
                    index,
                    patterns: []
                };
                
                if (content.includes('BMR')) suspicious.patterns.push('BMR');
                if (content.includes('maintenance')) suspicious.patterns.push('maintenance');
                if (content.includes('goalCalories')) suspicious.patterns.push('goalCalories');
                if (content.includes('Cálculos:')) suspicious.patterns.push('Cálculos:');
                
                results.suspiciousPatterns.push(suspicious);
                console.error(`SCRIPT INLINE SOSPECHOSO, #${index}`);
                console.error('Patrones encontrados:', suspicious.patterns);
            }
        }
    });
    
    console.error('=================== FIN ANÁLISIS ===================');
    return results;
}

/**
 * Encuentra todas las funciones globales que coinciden con un patrón
 * @param {string} pattern - Patrón para buscar
 * @returns {Array} - Lista de funciones encontradas
 */
export function findGlobalFunctions(pattern) {
    const found = [];
    
    // Buscar en window
    for (const key in window) {
        try {
            if (typeof window[key] === 'function' && key.includes(pattern)) {
                found.push({
                    name: key,
                    toString: window[key].toString().substring(0, 150) + '...'
                });
            }
        } catch (e) {
            // Algunas propiedades pueden lanzar excepciones al acceder
        }
    }
    
    console.error(`Encontradas ${found.length} funciones globales que coinciden con "${pattern}"`);
    found.forEach(fn => {
        console.error(`Función: ${fn.name}`);
        console.error(`Definición: ${fn.toString}`);
    });
    
    return found;
}

/**
 * Intenta sobrescribir las funciones que puedan estar causando los cálculos locales
 */
export function monkeyPatchCalculationFunctions() {
    let interceptions = 0;
    
    // Función auxiliar para interceptar una función
    const interceptFunction = (obj, propName, msg) => {
        if (typeof obj[propName] === 'function') {
            const original = obj[propName];
            obj[propName] = function() {
                interceptions++;
                console.error(`INTERCEPTADA LLAMADA A ${msg || propName}`);
                console.error('Argumentos:', Array.from(arguments));
                console.trace();
                return original.apply(this, arguments);
            };
            console.error(`Interceptada función ${propName}`);
            return true;
        }
        return false;
    };
    
    // Intentar interceptar las funciones más probables
    const intercepted = [];
    
    if (window.calculateBMR || window.calculateBasalMetabolicRate) {
        if (interceptFunction(window, 'calculateBMR', 'calculateBMR global')) {
            intercepted.push('calculateBMR');
        }
        if (interceptFunction(window, 'calculateBasalMetabolicRate', 'calculateBasalMetabolicRate global')) {
            intercepted.push('calculateBasalMetabolicRate');
        }
    }
    
    // Revisar las propiedades definidas dentro de los módulos de la aplicación
    if (window.appModules) {
        for (const moduleName in window.appModules) {
            const module = window.appModules[moduleName];
            if (module) {
                for (const key in module) {
                    if (
                        key.includes('calculate') || 
                        key.includes('BMR') || 
                        key.includes('maintenance') || 
                        key.includes('goal')
                    ) {
                        if (interceptFunction(module, key, `${moduleName}.${key}`)) {
                            intercepted.push(`${moduleName}.${key}`);
                        }
                    }
                }
            }
        }
    }
    
    console.error(`Interceptadas ${intercepted.length} funciones de cálculo`);
    return {
        intercepted,
        getInterceptions: () => interceptions
    };
}

// Al cargar este módulo, ejecutar automáticamente
(function() {
    console.error('=================== DEBUG.JS CARGADO ===================');
    // Monkey patch de console.log para detectar mensajes relevantes
    const originalConsoleLog = console.log;
    console.log = function() {
        const args = Array.from(arguments);
        const message = args.join(' ');
        
        if (message.includes('Cálculos:')) {
            console.error('===== INTERCEPTADO MENSAJE "Cálculos:" =====');
            console.error('Mensaje completo:', args);
            console.error('Stack trace:');
            console.trace();
            console.error('===========================================');
        }
        
        return originalConsoleLog.apply(console, arguments);
    };
    
    // Registrar la función de depuración globalmente para llamarla desde la consola
    window.debugAnalyzeScripts = analyzeLoadedScripts;
    window.debugFindFunctions = findGlobalFunctions;
    window.debugPatchFunctions = monkeyPatchCalculationFunctions;
    
    // Primera intercepción del Math.round (solo registrando ciertos valores)
    const originalMathRound = Math.round;
    Math.round = function(x) {
        // BMR típicamente está entre 1000-3000, mantenimiento entre 1500-4000
        if (typeof x === 'number' && x > 1000 && x < 4000) {
            console.error(`Math.round llamado con valor ${x}`);
            console.trace();
        }
        return originalMathRound(x);
    };
    
    console.error('Debug tools instalados: debugAnalyzeScripts(), debugFindFunctions(), debugPatchFunctions()');
})(); 