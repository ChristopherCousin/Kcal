// Funciones de utilidad para la interfaz de usuario

/**
 * Shows a temporary message to the user (e.g., for errors or success).
 * Replace with a proper toast notification library later.
 * @param {string} message - The message to display.
 * @param {string} type - 'error' or 'success' (influences styling/alert type).
 * @param {number} duration - How long to show the message (in ms).
 */
export function showToast(message, type = 'error', duration = 3000) {
    // Simple alert for now, replace with a proper UI element later
    console.log(`${type.toUpperCase()}: ${message}`);
    // Basic visual feedback (can be improved)
    const feedbackEl = document.createElement('div');
    feedbackEl.className = `toast ${type}`;
    feedbackEl.textContent = message;
    document.body.appendChild(feedbackEl);

    // Center and style it minimally
    feedbackEl.style.position = 'fixed';
    feedbackEl.style.bottom = '20px';
    feedbackEl.style.left = '50%';
    feedbackEl.style.transform = 'translateX(-50%)';
    feedbackEl.style.padding = '10px 20px';
    feedbackEl.style.backgroundColor = type === 'error' ? '#ef5350' : '#29b6f6';
    feedbackEl.style.color = 'white';
    feedbackEl.style.borderRadius = '5px';
    feedbackEl.style.zIndex = '2000';
    feedbackEl.style.opacity = '0';
    feedbackEl.style.transition = 'opacity 0.5s ease';

    // Fade in
    setTimeout(() => { feedbackEl.style.opacity = '1'; }, 10);

    // Fade out and remove
    setTimeout(() => {
        feedbackEl.style.opacity = '0';
        setTimeout(() => { feedbackEl.remove(); }, 500);
    }, duration);
}

/**
 * Updates a progress ring based on percentage.
 * @param {HTMLElement} ringElement - The SVG circle element
 * @param {number} percent - Percentage to fill (0-100)
 * @param {boolean} animate - Whether to animate the transition
 */
export function updateRing(ringElement, percent, animate = false) {
    const RING_CIRCUMFERENCE = 339.292; // 2 * PI * 54 (radius)
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