// Funciones de utilidad para la interfaz de usuario

/**
 * Shows a temporary message to the user (e.g., for errors or success).
 * Replace with a proper toast notification library later.
 * @param {string} message - The message to display.
 * @param {string} type - 'error', 'success', 'info', or 'warning' (influences styling).
 * @param {number} duration - How long to show the message (in ms).
 */
export function showToast(message, type = 'error', duration = 3000) {
    // Log to console for debugging
    console.log(`TOAST ${type.toUpperCase()}: ${message}`);
    
    // Verificar si hay un toast existente y eliminarlo
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        toast.remove();
    });

    // Crear el elemento toast
    const feedbackEl = document.createElement('div');
    feedbackEl.className = `toast ${type}`;
    feedbackEl.textContent = message;
    
    // Aplicar estilos según el tipo
    let bgColor;
    switch(type) {
        case 'success':
            bgColor = '#66bb6a'; // Verde
            break;
        case 'info':
            bgColor = '#29b6f6'; // Azul
            break;
        case 'warning':
            bgColor = '#ffa726'; // Naranja
            break;
        case 'error':
        default:
            bgColor = '#ef5350'; // Rojo
    }
    
    // Establecer estilos avanzados para garantizar visibilidad
    Object.assign(feedbackEl.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        backgroundColor: bgColor,
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000', // Valor muy alto para estar por encima de todo
        fontWeight: 'bold',
        maxWidth: '90%',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        fontSize: '0.9rem'
    });

    // Añadir al body
    document.body.appendChild(feedbackEl);

    // Asegurar que se pueda ver independientemente del contenido de la página
    requestAnimationFrame(() => {
        // Fade in con pequeño retraso para asegurar que los estilos se aplican
        setTimeout(() => { 
            feedbackEl.style.opacity = '1';
        }, 10);

        // Fade out y eliminar
        setTimeout(() => {
            feedbackEl.style.opacity = '0';
            setTimeout(() => {
                if (feedbackEl.parentNode) {
                    feedbackEl.remove();
                }
            }, 300);
        }, duration);
    });
}

/**
 * Updates a progress ring based on percentage.
 * @param {HTMLElement} ringElement - The SVG circle element
 * @param {number} percent - Percentage to fill (0-100)
 * @param {boolean} animate - Whether to animate the transition
 */
export function updateRing(ringElement, percent, animate = false) {
    // Verificar que el elemento exista antes de intentar modificarlo
    if (!ringElement) {
        console.warn('updateRing: El elemento del anillo no existe');
        return;
    }
    
    const RING_CIRCUMFERENCE = 439.822; // 2 * PI * 70 (radio del anillo SVG)
    const cappedPercent = Math.min(100, Math.max(0, percent));
    const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * cappedPercent / 100);
    
    if (animate) {
        ringElement.style.transition = 'stroke-dashoffset 0.5s ease-in-out';
    } else {
        ringElement.style.transition = 'none';
    }
    
    ringElement.style.strokeDashoffset = offset;
    
    // Color coding based on percentage
    if (cappedPercent > 100) {
        ringElement.style.stroke = '#ef5350'; // Red when over
    } else if (cappedPercent > 90) {
        ringElement.style.stroke = '#66bb6a'; // Green when close to target
    } else if (cappedPercent < 30) {
        ringElement.style.stroke = '#29b6f6'; // Blue when low
    } else {
        ringElement.style.stroke = '#29b6f6'; // Default
    }
}

/**
 * Debounce function to limit how often a function is called.
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Switches active tab in the UI.
 * @param {string} tabId - ID of the tab to switch to
 */
export function switchTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Update active button
    tabButtons.forEach(button => {
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Show active content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
} 