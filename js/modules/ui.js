// Módulo para gestionar la interfaz de usuario

import { userGoals, userProfile, dailyEntries, isLoading, calculateTotals, deleteFoodEntry } from './data.js';
import { updateRing } from '../utils/ui-helpers.js';

/**
 * Updates the UI based on current state.
 */
export function updateUI() {
    if (isLoading) return;

    const totals = calculateTotals();
    const goalsAreSet = userGoals.kcal && userGoals.kcal > 0;
    
    const kcalTotalEl = document.getElementById('kcalTotal');
    const proteinTotalEl = document.getElementById('proteinTotal');
    const carbTotalEl = document.getElementById('carbTotal');
    const fatTotalEl = document.getElementById('fatTotal');
    const kcalGoalEl = document.getElementById('kcalGoal');
    const kcalRing = document.getElementById('kcalRing');
    const proteinRing = document.getElementById('proteinRing');
    const carbRing = document.getElementById('carbRing');
    const fatRing = document.getElementById('fatRing');
    const goalStatusEl = document.getElementById('goalStatus');
    const aiCommentTextEl = document.getElementById('aiCommentText');
    
    // Update totals display
    kcalTotalEl.textContent = Math.round(totals.kcal);
    proteinTotalEl.textContent = Math.round(totals.protein * 10) / 10;
    carbTotalEl.textContent = Math.round(totals.carb * 10) / 10;
    fatTotalEl.textContent = Math.round(totals.fat * 10) / 10;
    
    // Update rings
    if (goalsAreSet) {
        kcalGoalEl.textContent = userGoals.kcal;
        const kcalPercent = (totals.kcal / userGoals.kcal) * 100;
        const proteinPercent = (totals.protein / userGoals.protein) * 100;
        const carbPercent = (totals.carb / userGoals.carb) * 100;
        const fatPercent = (totals.fat / userGoals.fat) * 100;
        
        updateRing(kcalRing, kcalPercent, true);
        updateRing(proteinRing, proteinPercent, true);
        updateRing(carbRing, carbPercent, true);
        updateRing(fatRing, fatPercent, true);
        
        // Update goal status
        const kcalDifference = totals.kcal - userGoals.kcal;
        const diffThreshold = userGoals.kcal * 0.1; // 10% threshold
        
        if (totals.kcal > 0) {
            if (kcalDifference < -diffThreshold) {
                goalStatusEl.textContent = 'Déficit';
                goalStatusEl.className = 'goal-status deficit';
            } else if (kcalDifference > diffThreshold) {
                goalStatusEl.textContent = 'Superávit';
                goalStatusEl.className = 'goal-status surplus';
            } else {
                goalStatusEl.textContent = 'Equilibrio';
                goalStatusEl.className = 'goal-status';
            }
        } else {
            goalStatusEl.textContent = 'Comienza';
            goalStatusEl.className = 'goal-status';
        }
    } else {
        // Reset rings when no goals set
        kcalGoalEl.textContent = '--';
        updateRing(kcalRing, 0);
        updateRing(proteinRing, 0);
        updateRing(carbRing, 0);
        updateRing(fatRing, 0);
        
        goalStatusEl.textContent = 'Sin objetivos';
        goalStatusEl.className = 'goal-status';
    }

    // Render entries list
    renderEntriesList();
    
    // Render history list
    renderHistoryList();
    
    // Update AI comment
    aiCommentTextEl.textContent = generateAiComment(totals, userGoals);
}

/**
 * Renders the entries list.
 */
function renderEntriesList() {
    const entriesListEl = document.getElementById('entriesList');
    entriesListEl.innerHTML = '';

    if (dailyEntries.length === 0) {
        entriesListEl.innerHTML = '<li class="no-entries">No has añadido ninguna comida hoy.</li>';
        return;
    }

    dailyEntries.forEach(entry => {
        const li = document.createElement('li');
        li.dataset.entryId = entry.id;
        
        if (entry.source) {
            li.title = `Fuente: ${entry.source}`;
        }

        const entryDetails = document.createElement('div');
        entryDetails.className = 'entry-details';

        const descriptionEl = document.createElement('span');
        descriptionEl.className = 'entry-description';
        descriptionEl.textContent = entry.description;

        const macrosEl = document.createElement('span');
        macrosEl.className = 'entry-macros';
        
        // Handle potentially missing macros
        const kcal = entry.macros?.kcal ?? '?';
        const p = entry.macros?.protein ?? '?';
        const c = entry.macros?.carb ?? '?';
        const f = entry.macros?.fat ?? '?';
        
        macrosEl.textContent = `${kcal} kcal · P: ${p}g · C: ${c}g · G: ${f}g`;

        entryDetails.appendChild(descriptionEl);
        entryDetails.appendChild(macrosEl);

        const actionsEl = document.createElement('div');
        actionsEl.className = 'entry-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-entry-btn';
        deleteBtn.innerHTML = '<span class="material-symbols-rounded">delete</span>';
        deleteBtn.title = 'Eliminar entrada';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm(`¿Eliminar "${entry.description.substring(0, 30)}${entry.description.length > 30 ? '...' : ''}"?`)) {
                deleteFoodEntry(entry.id);
            }
        });

        actionsEl.appendChild(deleteBtn);
        li.appendChild(entryDetails);
        li.appendChild(actionsEl);
        entriesListEl.appendChild(li);
    });
}

/**
 * Renders the history list of calculations.
 */
function renderHistoryList() {
    const historyListEl = document.getElementById('history-list');
    historyListEl.innerHTML = '';

    // Get history from localStorage
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');

    if (history.length === 0) {
        historyListEl.innerHTML = '<div class="no-history">No hay cálculos guardados.</div>';
        return;
    }

    // Sort history by date (most recent first)
    history.sort((a, b) => b.id - a.id);

    history.forEach(calc => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const historyDetails = document.createElement('div');
        historyDetails.className = 'history-details';
        historyDetails.innerHTML = `
            <span>${calc.date}</span><br>
            <strong>${calc.goal} kcal</strong>
            (P: ${calc.macros.protein}g, C: ${calc.macros.carbs}g, G: ${calc.macros.fat}g)
        `;
        
        historyItem.appendChild(historyDetails);
        historyListEl.appendChild(historyItem);
    });
}

/**
 * Generates a personalized comment based on current macros.
 * @param {Object} totals - Current macro totals
 * @param {Object} goals - User goals
 * @returns {string} - The AI comment
 */
function generateAiComment(totals, goals) {
    if (!goals || !goals.kcal || goals.kcal <= 0) {
        return "Define tus objetivos diarios para recibir consejos personalizados.";
    }
    
    if (totals.kcal === 0) {
        if (userProfile && userProfile.weight) {
            return `¡Hola! Tus objetivos ya están listos. Añade tu primera comida para empezar a seguir tu nutrición.`;
        } else {
            return "Añade tu primera comida para ver cómo vas y recibir consejos.";
        }
    }

    const percentages = {
        kcal: goals.kcal > 0 ? (totals.kcal / goals.kcal) * 100 : 0,
        protein: goals.protein > 0 ? (totals.protein / goals.protein) * 100 : 0,
        carb: goals.carb > 0 ? (totals.carb / goals.carb) * 100 : 0,
        fat: goals.fat > 0 ? (totals.fat / goals.fat) * 100 : 0,
    };

    // Determine goal type
    let goalType = 'mantenimiento';
    if (userProfile.goal) {
        if (userProfile.goal < 0) goalType = 'déficit';
        else if (userProfile.goal > 0) goalType = 'superávit';
    }

    let comments = [];

    // Analyze calories
    if (percentages.kcal > 115) {
        comments.push(`⚠️ Calorías muy altas (${Math.round(percentages.kcal)}%). ${goalType === 'superávit' ? '¡Excelente para tu objetivo!' : 'Considera reducir un poco mañana.'}`);
    } else if (percentages.kcal > 105) {
        comments.push(`🎯 Calorías un poco altas (${Math.round(percentages.kcal)}%). ${goalType === 'superávit' ? '¡Bien!' : 'Ojo con los extras.'}`);
    } else if (percentages.kcal < 60) {
        comments.push(`📉 Calorías bajas (${Math.round(percentages.kcal)}%). ${goalType === 'déficit' ? 'Asegúrate de no restringir demasiado.' : 'Considera añadir algo más.'}`);
    } else if (percentages.kcal < 80) {
        comments.push(`📊 Aún tienes margen para ${goalType === 'déficit' ? 'algún snack saludable.' : 'añadir más alimentos nutritivos.'}`);
    }

    // Analyze protein
    if (percentages.protein < 70) {
        comments.push(`💪 Proteína baja (${Math.round(percentages.protein)}%). Buenas fuentes: pollo, pescado, huevos, tofu, legumbres.`);
    } else if (percentages.protein > 130 && comments.length < 2) {
        comments.push(`🥩 Proteína alta (${Math.round(percentages.protein)}%). ¡Genial para mantener/ganar músculo!`);
    }

    // Analyze carbs
    if (percentages.carb < 70 && comments.length < 2) {
        comments.push(`🍚 Carbohidratos bajos (${Math.round(percentages.carb)}%). Para más energía añade: arroz, patata, fruta, avena.`);
    }

    // Analyze fat
    if (percentages.fat < 70 && comments.length < 2) {
        comments.push(`🥑 Grasas saludables bajas (${Math.round(percentages.fat)}%). Fuentes recomendadas: aguacate, frutos secos, aceite de oliva.`);
    }

    // All macros balanced
    if (comments.length === 0) {
        if (percentages.kcal > 90 && percentages.kcal < 110 &&
            percentages.protein > 90 && percentages.carb > 85 && percentages.fat > 85) {
            return `🏆 ¡Excelente! Todos tus macros están perfectamente equilibrados. ¡Sigue así!`;
        } else {
            return `👍 Tu nutrición va por buen camino. La constancia es clave para alcanzar tus objetivos.`;
        }
    }

    return comments[0];
} 