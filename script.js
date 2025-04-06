// --- DOM Elements ---
const foodInput = document.getElementById('foodInput');
const submitFoodButton = document.getElementById('submitFood');
const entriesListEl = document.getElementById('entriesList');
const aiCommentTextEl = document.getElementById('aiCommentText');
const goalStatusEl = document.getElementById('goalStatus');

// Macro Elements (Specific divs for Name, Total, Goal)
const macroElements = {
    kcal: {
        name: document.querySelector('.macro-row:nth-child(1) .macro-name'), // Less robust selector, might need IDs
        total: document.getElementById('kcalTotal'),
        goal: document.getElementById('kcalGoal'),
        progress: document.getElementById('kcalProgress'),
        percent: document.getElementById('kcalPercent')
    },
    protein: {
        name: document.querySelector('.macro-row:nth-child(2) .macro-name'),
        total: document.getElementById('proteinTotal'),
        goal: document.getElementById('proteinGoal'),
        progress: document.getElementById('proteinProgress'),
        percent: document.getElementById('proteinPercent')
    },
    carb: {
        name: document.querySelector('.macro-row:nth-child(3) .macro-name'),
        total: document.getElementById('carbTotal'),
        goal: document.getElementById('carbGoal'),
        progress: document.getElementById('carbProgress'),
        percent: document.getElementById('carbPercent')
    },
    fat: {
        name: document.querySelector('.macro-row:nth-child(4) .macro-name'),
        total: document.getElementById('fatTotal'),
        goal: document.getElementById('fatGoal'),
        progress: document.getElementById('fatProgress'),
        percent: document.getElementById('fatPercent')
    }
};

// Modal Elements
const goalModal = document.getElementById('goalModal');
const editGoalsButton = document.getElementById('editGoalsButton');
const closeGoalModalButton = document.getElementById('closeGoalModal');
const saveGoalsButton = document.getElementById('saveGoalsButton');
const goalKcalInput = document.getElementById('goalKcal');
const goalProteinInput = document.getElementById('goalProtein');
const goalCarbInput = document.getElementById('goalCarb');
const goalFatInput = document.getElementById('goalFat');

// --- State --- (Loaded/Saved in localStorage)
let userGoals = { kcal: null, protein: null, carb: null, fat: null };
let dailyEntries = []; // Array of food entry objects
let isLoading = true; // Flag to manage initial loading state

// --- Functions ---

/**
 * Shows a temporary message to the user (e.g., for errors or success).
 * In a real app, use a dedicated toast/notification component.
 * @param {string} message - The message to display.
 * @param {string} type - 'error' or 'success' (influences styling/alert type).
 */
function showToast(message, type = 'error') {
    // Simple alert for now, replace with a proper UI element later
    alert(`${type === 'error' ? 'Error:' : 'Éxito:'} ${message}`);
}

/**
 * Opens the goal setting modal with animation trigger.
 */
function openGoalModal() {
    goalKcalInput.value = userGoals.kcal || '';
    goalProteinInput.value = userGoals.protein || '';
    goalCarbInput.value = userGoals.carb || '';
    goalFatInput.value = userGoals.fat || '';
    goalModal.style.display = 'block';
    // Trigger reflow for animation
    goalModal.offsetWidth; 
    goalModal.querySelector('.modal-content').style.animation = 'slideIn 0.3s ease-out';
    goalModal.style.animation = 'fadeIn 0.3s ease-out';
}

/**
 * Closes the goal setting modal smoothly.
 */
function closeGoalModal() {
    goalModal.style.animation = 'fadeOut 0.3s ease-out forwards';
    goalModal.querySelector('.modal-content').style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
        goalModal.style.display = 'none';
        // Reset animations for next time
        goalModal.style.animation = '';
         goalModal.querySelector('.modal-content').style.animation = '';
    }, 300); // Match animation duration
}

/**
 * Saves the goals, adds loading state feedback.
 */
function saveGoals() {
    const kcal = parseInt(goalKcalInput.value) || 0;
    const protein = parseInt(goalProteinInput.value) || 0;
    const carb = parseInt(goalCarbInput.value) || 0;
    const fat = parseInt(goalFatInput.value) || 0;

    if (kcal <= 500 || protein <= 10 || carb <= 10 || fat <= 5) { // Basic sanity check
        showToast('Valores de objetivos parecen demasiado bajos. Por favor, revísalos.', 'error');
        return;
    }

    // Visual feedback: disable button
    saveGoalsButton.disabled = true;
    saveGoalsButton.textContent = 'Guardando...';

    // Simulate saving delay (replace with actual API call if needed)
    setTimeout(() => {
        userGoals = { kcal, protein, carb, fat };
        localStorage.setItem('userGoals', JSON.stringify(userGoals));
        closeGoalModal();
        updateUI();
        showToast('Objetivos guardados correctamente.', 'success');
        console.log('Goals saved:', userGoals);

        // Restore button state
        saveGoalsButton.disabled = false;
        saveGoalsButton.textContent = 'Guardar Objetivos';
    }, 300); // Short delay for visual feedback
}

/**
 * Loads data, handles initial state and prompts.
 */
function loadData() {
    isLoading = true;
    const savedGoals = localStorage.getItem('userGoals');
    let goalsLoaded = false;
    if (savedGoals) {
        try {
            const parsedGoals = JSON.parse(savedGoals);
            if (parsedGoals && parsedGoals.kcal > 0 && parsedGoals.protein > 0 && parsedGoals.carb > 0 && parsedGoals.fat > 0) {
                userGoals = parsedGoals;
                goalsLoaded = true;
                console.log("Loaded goals from localStorage:", userGoals);
            }
        } catch (error) {
            console.error("Failed to parse saved goals:", error);
            localStorage.removeItem('userGoals');
        }
    }

    if (!goalsLoaded) {
        // Delay opening modal slightly to allow page render
        setTimeout(openGoalModal, 500);
    }

    const savedEntries = localStorage.getItem('dailyEntries');
    if (savedEntries) {
        try {
            dailyEntries = JSON.parse(savedEntries);
            console.log("Loaded entries from localStorage:", dailyEntries);
        } catch (error) {
            console.error("Failed to parse saved entries:", error);
            localStorage.removeItem('dailyEntries');
            dailyEntries = [];
        }
    }
    isLoading = false;
    updateUI();
}

/**
 * Calculates total macros from the dailyEntries array.
 * @returns {object} - Object with total kcal, protein, carb, fat.
 */
function calculateTotals() {
    return dailyEntries.reduce((totals, entry) => {
        totals.kcal += entry.macros.kcal;
        totals.protein += entry.macros.protein;
        totals.carb += entry.macros.carb;
        totals.fat += entry.macros.fat;
        return totals;
    }, { kcal: 0, protein: 0, carb: 0, fat: 0 });
}

/**
 * Simulates calling an AI API to estimate macros from food description.
 * Includes basic estimation for carbs and fats.
 * @param {string} description - The food description text.
 * @returns {object} - Estimated { kcal, protein, carb, fat } or null if error.
 */
function mockEstimateMacros(description) {
    description = description.toLowerCase();
    let est = { kcal: 0, protein: 0, carb: 0, fat: 0 };

    // --- Protein Sources (adjusted some values for realism) ---
    if (description.includes('pollo') || description.includes('chicken')) { est.kcal += 165; est.protein += 31; est.fat += 4; } // Per 100g cooked breast
    if (description.includes('pescado blanco') || description.includes('white fish')) { est.kcal += 110; est.protein += 24; est.fat += 1.5; } // E.g., Cod, cooked
    if (description.includes('salmón') || description.includes('salmon')) { est.kcal += 208; est.protein += 20; est.fat += 13; } // Per 100g cooked
    if (description.includes('ternera') || description.includes('beef')) { est.kcal += 250; est.protein += 26; est.fat += 15; } // Generic lean cut, cooked
    if (description.includes('huevo') || description.includes('egg')) { est.kcal += 78; est.protein += 6; est.fat += 5; est.carb += 0.6; } // Large egg
    if (description.includes('lentejas') || description.includes('lentils')) { est.kcal += 116; est.protein += 9; est.carb += 20; est.fat += 0.4; } // Per 100g cooked
    if (description.includes('tofu')) { est.kcal += 76; est.protein += 8; est.fat += 5; est.carb += 3; } // Per 100g firm
    if (description.includes('queso curado') || description.includes('hard cheese')) { est.kcal += 120; est.protein += 7; est.fat += 10; est.carb += 1;} // ~30g portion
    if (description.includes('yogur griego') || description.includes('greek yogurt')) { est.kcal += 130; est.protein += 11; est.carb += 6; est.fat += 7;} // 100g plain full fat
    if (description.includes('leche entera') || description.includes('whole milk')) { est.kcal += 60; est.protein += 3; est.carb += 5; est.fat += 3.5; } // Per 100ml

    // --- Carb Sources ---
    if (description.includes('arroz blanco') || description.includes('white rice')) { est.kcal += 130; est.carb += 28; est.protein += 3; est.fat += 0.3; } // Per 100g cooked
    if (description.includes('pan blanco') || description.includes('white bread')) { est.kcal += 75; est.carb += 14; est.protein += 2.5; est.fat += 1; } // 1 slice
    if (description.includes('pasta')) { est.kcal += 158; est.carb += 31; est.protein += 6; est.fat += 1; } // Per 100g cooked
    if (description.includes('patata cocida') || description.includes('boiled potato')) { est.kcal += 87; est.carb += 20; est.protein += 2; est.fat += 0.1; } // Per 100g
    if (description.includes('avena') || description.includes('oats')) { est.kcal += 150; est.carb += 27; est.protein += 5; est.fat += 3; } // ~40g dry portion
    if (description.includes('manzana') || description.includes('apple')) { est.kcal += 95; est.carb += 25; est.protein += 0.5; est.fat += 0.3; } // Medium apple
    if (description.includes('plátano') || description.includes('banana')) { est.kcal += 105; est.carb += 27; est.protein += 1.3; est.fat += 0.4; } // Medium banana
    if (description.includes('cereal azucarado') || description.includes('sugary cereal')) { est.kcal += 110; est.protein += 1.5; est.carb += 25; est.fat += 0.5; } // ~30g portion

    // --- Fat Sources ---
    if (description.includes('aceite oliva') || description.includes('olive oil')) { est.kcal += 120; est.fat += 14; } // 1 tbsp
    if (description.includes('aguacate') || description.includes('avocado')) { est.kcal += 160; est.fat += 15; est.carb += 9; est.protein += 2; } // Half medium avocado
    if (description.includes('almendras') || description.includes('almonds')) { est.kcal += 164; est.fat += 14; est.carb += 6; est.protein += 6; } // ~28g handful
    if (description.includes('mantequilla') || description.includes('butter')) { est.kcal += 102; est.fat += 11.5; est.protein += 0.1; } // 1 tbsp

    // --- Vegetables ---
    if (description.includes('ensalada mixta') || description.includes('mixed salad') || description.includes('brócoli') || description.includes('broccoli') || description.includes('espinacas') || description.includes('spinach')) { est.kcal += 30; est.carb += 6; est.protein += 2; est.fat += 0.3; } // Generic large portion, no dressing

    // --- Drinks / Other ---
    if (description.includes('café solo') || description.includes('black coffee')) { est.kcal += 2; }
    if (description.includes('refresco cola') || description.includes('cola soda')) { est.kcal += 140; est.carb += 39; } // Can
    if (description.includes('azúcar blanco') || description.includes('white sugar')) { est.kcal += 16; est.carb += 4;} // 1 tsp

    // Add variation based on quantity keywords (simple approach)
    if (description.includes('poco') || description.includes('light') || description.includes('pequeño')) { est = multiplyMacros(est, 0.7); }
    if (description.includes('mucho') || description.includes('grande') || description.includes('doble')) { est = multiplyMacros(est, 1.5); }
    // Specific quantity matching (basic)
    const gramsMatch = description.match(/(\d+)\s*g/);
    if (gramsMatch && gramsMatch[1] && est.kcal > 0) {
        const baseWeight = 100; // Assume base estimates are per 100g (needs refinement)
        const multiplier = parseInt(gramsMatch[1]) / baseWeight;
        if (multiplier > 0 && multiplier < 5) { // Avoid crazy multipliers
             est = multiplyMacros(est, multiplier);
        }
    }

    // Add slight random variation only if some base values were added
    if (est.kcal > 10) { // Only vary if substantial amount detected
        est.kcal *= (1 + (Math.random() - 0.5) * 0.1); // +/- 5% random variation
        est.protein *= (1 + (Math.random() - 0.5) * 0.1);
        est.carb *= (1 + (Math.random() - 0.5) * 0.1);
        est.fat *= (1 + (Math.random() - 0.5) * 0.1);
    }

    // Final rounding and non-negative check
    est.kcal = Math.max(0, Math.round(est.kcal));
    est.protein = Math.max(0, Math.round(est.protein * 10) / 10);
    est.carb = Math.max(0, Math.round(est.carb * 10) / 10);
    est.fat = Math.max(0, Math.round(est.fat * 10) / 10);

    // Handle no match
    if (est.kcal === 0 && description.trim() !== '') {
        console.warn("No specific food matched, adding minimal estimate.");
        return { kcal: 50, protein: 2, carb: 5, fat: 2 }; // Minimal fallback
    }
    if (description.trim() === '') return null;

    console.log(`Mock API: Final Estimated K:${est.kcal}, P:${est.protein}g, C:${est.carb}g, F:${est.fat}g for "${description}"`);
    return est;
}

/** Helper to multiply all macros in an object */
function multiplyMacros(macros, multiplier) {
    return {
        kcal: macros.kcal * multiplier,
        protein: macros.protein * multiplier,
        carb: macros.carb * multiplier,
        fat: macros.fat * multiplier,
    };
}

/**
 * Adds a food entry with loading feedback.
 */
function addFoodEntry() {
    const description = foodInput.value.trim();
    if (!description) {
        showToast("Por favor, describe qué has comido.", 'error');
        return;
    }
    if (!userGoals.kcal) {
        showToast("Establece tus objetivos antes de añadir comidas.", 'error');
        openGoalModal();
        return;
    }

    // Visual feedback
    submitFoodButton.disabled = true;
    submitFoodButton.textContent = 'Analizando...';

    // Simulate processing
    setTimeout(() => {
        const estimatedMacros = mockEstimateMacros(description);

        if (estimatedMacros && estimatedMacros.kcal > 0) { // Check if estimation seems valid
            const newEntry = {
                id: Date.now(),
                description: description,
                macros: estimatedMacros
            };
            dailyEntries.push(newEntry);
            localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
            updateUI();
            foodInput.value = ''; // Clear input only on success
            // Optional: scroll to the new entry if list is long
            entriesListEl.scrollTop = entriesListEl.scrollHeight;
        } else {
            showToast("No se pudo estimar macros para esa descripción. Intenta ser más específico (ej: '150g pollo plancha').", 'error');
        }

        // Restore button
        submitFoodButton.disabled = false;
        submitFoodButton.textContent = 'Añadir Comida';
    }, 350); // Simulate analysis time
}

/**
 * Deletes a food entry with visual feedback (e.g., fade out).
 * @param {number} entryId - The ID of the entry to delete.
 */
function deleteFoodEntry(entryId) {
    const entryElement = entriesListEl.querySelector(`li[data-entry-id="${entryId}"]`);
    if (entryElement) {
        entryElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        entryElement.style.opacity = '0';
        entryElement.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            dailyEntries = dailyEntries.filter(entry => entry.id !== entryId);
            localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
            updateUI(); // This will re-render the list without the faded element
        }, 300); // Match animation duration
    } else {
        // Fallback if element not found (shouldn't happen normally)
        dailyEntries = dailyEntries.filter(entry => entry.id !== entryId);
        localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
        updateUI();
    }
}

/**
 * Renders the list with improved styling and delete buttons.
 */
function renderEntriesList() {
    entriesListEl.innerHTML = ''; // Clear existing list

    if (dailyEntries.length === 0) {
        entriesListEl.innerHTML = '<li class="no-entries">Aún no has añadido nada hoy.</li>';
         // Add specific styling for this case if needed in CSS
        return;
    }

    dailyEntries.forEach(entry => {
        const li = document.createElement('li');
        li.dataset.entryId = entry.id;
        // Use textContent for security against XSS in descriptions
        const descriptionSpan = document.createElement('span');
        descriptionSpan.className = 'entry-description';
        descriptionSpan.textContent = entry.description;

        const macrosSpan = document.createElement('span');
        macrosSpan.className = 'entry-macros';
        macrosSpan.textContent = `Kcal: ${entry.macros.kcal}, P: ${entry.macros.protein}g, C: ${entry.macros.carb}g, F: ${entry.macros.fat}g`;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'entry-details';
        detailsDiv.appendChild(descriptionSpan);
        detailsDiv.appendChild(macrosSpan);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'button button-danger delete-entry-btn'; // Use correct classes
        deleteButton.title = 'Eliminar entrada';
        deleteButton.innerHTML = '🗑️'; // Emoji or icon font
        deleteButton.addEventListener('click', handleDeleteClick);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'entry-actions';
        actionsDiv.appendChild(deleteButton);

        li.appendChild(detailsDiv);
        li.appendChild(actionsDiv);
        entriesListEl.appendChild(li);
    });
}

/**
 * Handles delete click, preventing default if necessary.
 * @param {Event} event
 */
function handleDeleteClick(event) {
    event.preventDefault(); // Good practice for button clicks
    const entryId = parseInt(event.target.closest('li').dataset.entryId);
    // Use a more modern confirmation dialog if possible, or style a custom one
    if (confirm(`¿Seguro que quieres eliminar esta entrada?\n(${event.target.closest('li').querySelector('.entry-description').textContent})`)) {
         deleteFoodEntry(entryId);
    }
}

/**
 * Updates a single macro's UI elements, using the stored references.
 * @param {string} macro - 'kcal', 'protein', 'carb', 'fat'
 * @param {number} current - Current value.
 * @param {number} goal - Goal value.
 */
function updateMacroUI(macro, current, goal) {
    const els = macroElements[macro];
    if (!els) return;

    const currentRounded = (macro === 'kcal') ? Math.round(current) : Math.round(current * 10) / 10;
    const unit = (macro === 'kcal') ? '' : ' g';

    els.total.textContent = `${currentRounded}${unit}`;
    els.goal.textContent = goal ? `${goal}${unit}` : 'N/A';

    if (goal && goal > 0) {
        const percent = (current / goal) * 100;
        const displayPercent = Math.min(100, Math.max(0, percent));

        // Prevent layout shift by setting width even if 0
        els.progress.style.width = `${displayPercent}%`; 
        els.percent.textContent = `${Math.round(percent)}%`;

        els.progress.classList.remove('warning', 'danger');
        if (percent > 110) {
            els.progress.classList.add('danger');
        } else if (percent > 100) {
            els.progress.classList.add('warning');
        }
    } else {
        els.progress.style.width = '0%';
        els.percent.textContent = '- %';
        els.progress.classList.remove('warning', 'danger');
    }
}

/**
 * Main UI update function.
 */
function updateUI() {
    if (isLoading) return; // Prevent updates during initial load potentially before goals are checked

     const goalsAreSet = userGoals.kcal && userGoals.kcal > 0;

    if (!goalsAreSet) {
        aiCommentTextEl.textContent = "Define tus objetivos diarios haciendo clic en '🎯 Editar Objetivos' para empezar.";
        renderEntriesList();
        // Clear or hide progress sections
        Object.keys(macroElements).forEach(macro => updateMacroUI(macro, 0, null));
        goalStatusEl.textContent = '';
        goalStatusEl.className = 'goal-status';
        return;
    }

    const totals = calculateTotals();

    // Update macro displays
    Object.keys(macroElements).forEach(macro => {
        updateMacroUI(macro, totals[macro], userGoals[macro]);
    });

    // Update Goal Status
    const kcalDifference = totals.kcal - userGoals.kcal;
    if (totals.kcal > 0) { // Only show status if entries exist
        const diffThreshold = userGoals.kcal * 0.1; // 10% threshold for deficit/surplus status
        if (kcalDifference < -diffThreshold) {
             goalStatusEl.textContent = 'Déficit';
             goalStatusEl.className = 'goal-status deficit';
        } else if (kcalDifference > diffThreshold) {
            goalStatusEl.textContent = 'Superávit';
            goalStatusEl.className = 'goal-status surplus';
        } else {
             goalStatusEl.textContent = 'Mantenimiento';
             goalStatusEl.className = 'goal-status';
        }
    } else {
        goalStatusEl.textContent = '';
        goalStatusEl.className = 'goal-status';
    }

    renderEntriesList();
    aiCommentTextEl.textContent = generateAiComment(totals, userGoals);
}

/**
 * Generates a more context-aware AI comment based on totals and goals.
 * @param {object} totals - Current totals { kcal, protein, carb, fat }.
 * @param {object} goals - User goals { kcal, protein, carb, fat }.
 * @returns {string} - An AI-generated tip/comment.
 */
function generateAiComment(totals, goals) {
     if (!goals.kcal || goals.kcal <= 0) {
         return "Define tus objetivos para recibir consejos personalizados.";
     }
     if (totals.kcal === 0 && totals.protein === 0 && totals.carb === 0 && totals.fat === 0) {
        return "¡Hola! 👋 Añade tu primera comida para ver cómo vas y recibir consejos.";
    }

    const perc = {
        kcal: goals.kcal > 0 ? (totals.kcal / goals.kcal) * 100 : 0,
        protein: goals.protein > 0 ? (totals.protein / goals.protein) * 100 : 0,
        carb: goals.carb > 0 ? (totals.carb / goals.carb) * 100 : 0,
        fat: goals.fat > 0 ? (totals.fat / goals.fat) * 100 : 0,
    };

    // Simple goal type estimation
    const goalType = (goals.kcal < 2200) ? 'deficit' : (goals.kcal > 2800) ? 'surplus' : 'maintenance';

    let comments = [];
    let priorities = { deficit: 0, surplus: 0, balance: 0 }; // Simple scoring for advice type

    // --- Analyze Overall Status ---
    if (perc.kcal > 115) {
        comments.push(`⚠️ Calorías muy altas (${Math.round(perc.kcal)}%). Mañana será día de ajustar.`);
        priorities.deficit += 2;
    } else if (perc.kcal > 105) {
        comments.push(`🎯 Calorías un poco altas (${Math.round(perc.kcal)}%). ¡Ojo con los extras!`);
        priorities.deficit += 1;
    }
    if (perc.kcal < 60 && totals.kcal > 0) {
        comments.push(`📉 Calorías bajas (${Math.round(perc.kcal)}%). ${goalType === 'surplus' ? 'Necesitas comer más para tu objetivo.' : 'Recuerda mantener tu energía.'}`);
        priorities.surplus += 2;
    } else if (perc.kcal < 80 && totals.kcal > 0) {
         comments.push(`📊 Calorías algo bajas (${Math.round(perc.kcal)}%). ${goalType === 'surplus' ? 'Añade un snack o aumenta porciones.' : 'Vas bien, pero no te quedes corto/a.'}`);
         priorities.surplus += 1;
    }

    // --- Analyze Macros ---
    if (goals.protein > 0) {
        if (perc.protein < 70 && totals.protein > 0) {
             comments.push(`💪 Proteína baja (${Math.round(perc.protein)}%). Prioriza fuentes como pollo, pescado, huevos, tofu o legumbres.`);
             priorities.balance += 1;
         } else if (perc.protein > 130) {
             comments.push(`🍗 Proteína alta (${Math.round(perc.protein)}%). ¡Genial para músculo! Asegúrate de que carbohidratos y grasas acompañen.`);
             priorities.balance += 1;
         }
    }
    if (goals.carb > 0 && comments.length < 2) { // Limit comments shown
         if (perc.carb < 70 && totals.carb > 0) {
             comments.push(`⚡ Energía (carbs) baja (${Math.round(perc.carb)}%). Considera añadir avena, arroz integral, patata o fruta.`);
             priorities.surplus += 1;
         } else if (perc.carb > 130) {
             comments.push(`🍞 Energía (carbs) alta (${Math.round(perc.carb)}%). ${goalType === 'surplus' ? '¡Perfecto para ganar energía!' : 'Quizás moderar si buscas definición.'}`);
             priorities.deficit += 1;
         }
     }
    if (goals.fat > 0 && comments.length < 2) {
        if (perc.fat < 70 && totals.fat > 0) {
            comments.push(`🥑 Grasas saludables bajas (${Math.round(perc.fat)}%). Importantes: añade aguacate, frutos secos, aceite de oliva.`);
             priorities.balance += 1;
        } else if (perc.fat > 130) {
            comments.push(`🍔 Grasas altas (${Math.round(perc.fat)}%). Modera si no es tu enfoque, prioriza las insaturadas.`);
             priorities.deficit += 1;
        }
    }

    // --- Select Final Comment(s) ---
    if (comments.length === 0) {
        // If everything is roughly balanced
        if (perc.kcal > 85 && perc.protein > 85 && perc.carb > 85 && perc.fat > 85) {
             return `🏆 ¡Excelente! Todos los macros están muy cerca del objetivo. ¡Sigue así!`;
        } else if (totals.kcal > 0) {
            return `👍 Buen progreso general. ¡La constancia es clave! Sigue registrando.`;
        } else {
             // Fallback to initial message if somehow reached here with 0 totals
             return "¡Hola! 👋 Añade tu primera comida para ver cómo vas y recibir consejos.";
        }
    }

    // Simple logic: return the first (most severe) comment, or maybe two if balanced advice needed?
    // For now, just the first seems sufficient to avoid overwhelming the user.
    return comments[0];
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    editGoalsButton.addEventListener('click', openGoalModal);
    closeGoalModalButton.addEventListener('click', closeGoalModal);
    saveGoalsButton.addEventListener('click', saveGoals);
    submitFoodButton.addEventListener('click', addFoodEntry);

    // Delete listeners are added dynamically in renderEntriesList

    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === goalModal) {
            closeGoalModal();
        }
    });

    // Submit food on Enter key
    foodInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            addFoodEntry();
        }
    });
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    setupEventListeners();
    loadData(); // Load data and perform initial UI update
});

// Add CSS for modal fade out animation
const styleSheet = document.styleSheets[0]; // Assuming style.css is the first sheet
try {
     styleSheet.insertRule(`
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `, styleSheet.cssRules.length);
     styleSheet.insertRule(`
         @keyframes slideOut {
             from { transform: translateY(0) scale(1); opacity: 1; }
             to { transform: translateY(-20px) scale(0.98); opacity: 0; }
         }
     `, styleSheet.cssRules.length);
} catch (e) {
     console.warn("Could not insert fadeOut/slideOut rules dynamically:", e);
} 