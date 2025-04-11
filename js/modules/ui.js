// Módulo para gestionar la interfaz de usuario

import { userGoals, userProfile, dailyEntries, isLoading, calculateTotals, deleteFoodEntry } from './data.js';
import { updateRing } from '../utils/ui-helpers.js';

/**
 * Updates the UI with the current app state.
 */
export function updateUI() {
    // Si estamos en medio de la carga, no actualizar la UI todavía
    if (isLoading) {
        console.log('updateUI: Skipping UI update during loading');
        return;
    }

    console.log('updateUI: Actualizando interfaz de usuario');
    
    try {
        // Calcular totales diarios
        const totals = calculateTotals();
        
        // Actualizar valores de macros solo si los elementos existen
        const elements = {
            kcalTotalEl: document.getElementById('kcalTotal'),
            kcalGoalEl: document.getElementById('kcalGoal'),
            kcalPercentageEl: document.getElementById('kcalPercentage'),
            proteinTotalEl: document.getElementById('proteinTotal'),
            carbTotalEl: document.getElementById('carbTotal'),
            fatTotalEl: document.getElementById('fatTotal'),
            mainGoalRing: document.getElementById('mainGoalRing'),
            proteinProgressBar: document.getElementById('proteinProgressBar'),
            carbProgressBar: document.getElementById('carbProgressBar'),
            fatProgressBar: document.getElementById('fatProgressBar'),
            goalStatusEl: document.getElementById('goalStatus'),
            goalTypeEl: document.getElementById('goalTypeText'),
            aiCommentTextEl: document.getElementById('aiCommentText')
        };
        
        // Comprobar qué elementos existen y actualizar solo esos
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.log(`updateUI: Elemento ${key} no encontrado en el DOM`);
            }
        }
        
        // Actualizar valores básicos si existen
        if (elements.kcalTotalEl) elements.kcalTotalEl.textContent = Math.round(totals.kcal);
        if (elements.proteinTotalEl) elements.proteinTotalEl.textContent = Math.round(totals.protein);
        if (elements.carbTotalEl) elements.carbTotalEl.textContent = Math.round(totals.carb);
        if (elements.fatTotalEl) elements.fatTotalEl.textContent = Math.round(totals.fat);
        
        // Actualizar barras de progreso si existen y hay objetivos
        if (elements.proteinProgressBar && userGoals.protein)
            elements.proteinProgressBar.style.width = `${Math.min(100, (totals.protein / userGoals.protein) * 100)}%`;
        if (elements.carbProgressBar && userGoals.carb)
            elements.carbProgressBar.style.width = `${Math.min(100, (totals.carb / userGoals.carb) * 100)}%`;
        if (elements.fatProgressBar && userGoals.fat)
            elements.fatProgressBar.style.width = `${Math.min(100, (totals.fat / userGoals.fat) * 100)}%`;
        
        // Establecer tipo de objetivo
        if (elements.goalTypeEl) {
            if (userProfile.goal) {
                if (userProfile.goal < 0) elements.goalTypeEl.textContent = 'déficit';
                else if (userProfile.goal > 0) elements.goalTypeEl.textContent = 'volumen';
                else elements.goalTypeEl.textContent = 'mantenimiento';
            } else {
                elements.goalTypeEl.textContent = 'sin meta';
            }
        }
        
        // Si hay objetivos establecidos, actualizar anillos y estado
        if (userGoals && userGoals.kcal && userGoals.kcal > 0) {
            if (elements.kcalGoalEl) elements.kcalGoalEl.textContent = Math.round(userGoals.kcal);
            
            const kcalPercent = (totals.kcal / userGoals.kcal) * 100;
            if (elements.kcalPercentageEl) elements.kcalPercentageEl.textContent = Math.round(kcalPercent);
            
            // Actualizar anillo solo si existe
            if (elements.mainGoalRing) {
                console.log('updateUI: Actualizando mainGoalRing');
                updateRing(elements.mainGoalRing, kcalPercent, true);
            }
            
            // Actualizar estado del objetivo
            if (elements.goalStatusEl) {
                if (kcalPercent > 90) {
                    elements.goalStatusEl.textContent = 'Completo';
                    elements.goalStatusEl.className = 'goal-badge success';
                } else if (kcalPercent > 70) {
                    elements.goalStatusEl.textContent = 'Avanzado';
                    elements.goalStatusEl.className = 'goal-badge warning';
                } else {
                    elements.goalStatusEl.textContent = 'En progreso';
                    elements.goalStatusEl.className = 'goal-badge';
                }
            }
        } else {
            // Sin objetivos establecidos
            if (elements.kcalGoalEl) elements.kcalGoalEl.textContent = '--';
            
            // Poner anillo a 0 solo si existe
            if (elements.mainGoalRing) {
                console.log('updateUI: Reseteando mainGoalRing a 0');
                updateRing(elements.mainGoalRing, 0);
            }
            
            if (elements.goalStatusEl) {
                elements.goalStatusEl.textContent = 'Sin objetivos';
                elements.goalStatusEl.className = 'goal-badge';
            }
        }
        
        // Intentar renderizar las listas solo si estamos en la página correcta
        try {
            renderEntriesList();
            renderHistoryList();
        } catch (error) {
            console.log('updateUI: No se pudieron renderizar las listas:', error.message);
        }
        
        // Actualizar comentario de IA
        if (elements.aiCommentTextEl) {
            try {
                elements.aiCommentTextEl.textContent = generateAiComment(totals, userGoals);
            } catch (error) {
                console.log('updateUI: Error al generar comentario IA:', error.message);
            }
        }
        
        console.log('updateUI: Interfaz actualizada correctamente');
    } catch (error) {
        console.error('updateUI: Error al actualizar la interfaz:', error);
    }
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

/**
 * Actualiza la interfaz de usuario con los resultados del cálculo
 * @param {Object} results - Resultados del cálculo con los datos nutricionales
 */
export function updateCalculatorResults(results) {
    if (!results) {
        console.error('Error: No se proporcionaron resultados para actualizar la UI');
        return;
    }

    console.log('Actualizando UI con resultados detallados:', results);
    
    // Valores principales
    document.getElementById('bmr-value').textContent = results.bmr;
    document.getElementById('maintenance-value').textContent = results.maintenance;
    document.getElementById('goal-value').textContent = results.goalCalories;
    
    // Macronutrientes básicos
    document.getElementById('protein-grams').textContent = results.protein;
    document.getElementById('carbs-grams').textContent = results.carbs;
    document.getElementById('fat-grams').textContent = results.fat;
    
    // Calcular porcentajes si no vienen en los resultados
    const proteinPercent = results.proteinPercent || 
        Math.round((results.protein * 4 / results.goalCalories) * 100);
    const carbsPercent = results.carbsPercent || 
        Math.round((results.carbs * 4 / results.goalCalories) * 100);
    const fatPercent = results.fatPercent || 
        Math.round((results.fat * 9 / results.goalCalories) * 100);
    
    // Actualizar barras de macros
    document.getElementById('protein-bar').style.width = `${proteinPercent}%`;
    document.getElementById('carbs-bar').style.width = `${carbsPercent}%`;
    document.getElementById('fat-bar').style.width = `${fatPercent}%`;
    
    // Actualizar porcentajes en texto
    document.getElementById('protein-percent').textContent = proteinPercent;
    document.getElementById('carbs-percent').textContent = carbsPercent;
    document.getElementById('fat-percent').textContent = fatPercent;
    
    // Si hay información adicional de la IA, mostrarla
    const resultCard = document.getElementById('results-card');
    
    // Buscar o crear la sección de recomendaciones avanzadas
    let advancedSection = document.getElementById('advanced-recommendations');
    if (!advancedSection && (results.recommendedFoods || results.foodsToAvoid || results.supplements)) {
        advancedSection = document.createElement('div');
        advancedSection.id = 'advanced-recommendations';
        advancedSection.className = 'advanced-recommendations';
        
        // Crear título de la sección
        const advancedTitle = document.createElement('h3');
        advancedTitle.textContent = 'Recomendaciones Personalizadas';
        advancedSection.appendChild(advancedTitle);
        
        // Añadir al final de la tarjeta de resultados, pero antes de los botones
        const buttonRow = resultCard.querySelector('.button-row');
        resultCard.insertBefore(advancedSection, buttonRow);
        
        // Estilos dinámicos para la nueva sección
        const style = document.createElement('style');
        style.textContent = `
            .advanced-recommendations {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
            }
            .recommendation-section {
                margin-bottom: 15px;
            }
            .recommendation-section h4 {
                margin-bottom: 8px;
                color: #2E7D32;
            }
            .recommendation-list {
                list-style-type: none;
                padding-left: 0;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 0;
            }
            .recommendation-item {
                background-color: #E8F5E9;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
                color: #1B5E20;
            }
            .avoid-item {
                background-color: #FFEBEE;
                color: #B71C1C;
            }
            .supplement-item {
                background-color: #E3F2FD;
                color: #0D47A1;
            }
            @media (max-width: 768px) {
                .recommendation-list {
                    flex-direction: column;
                    gap: 5px;
                }
                .recommendation-item {
                    width: fit-content;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Actualizar las secciones avanzadas si existen
    if (advancedSection) {
        // Limpiar contenido previo, pero mantener el título
        const title = advancedSection.querySelector('h3');
        advancedSection.innerHTML = '';
        advancedSection.appendChild(title);
        
        // Alimentos recomendados
        if (results.recommendedFoods) {
            const foodsSection = createRecommendationSection(
                'Alimentos recomendados', 
                Array.isArray(results.recommendedFoods) 
                    ? results.recommendedFoods 
                    : results.recommendedFoods.split(',').map(food => food.trim())
            );
            advancedSection.appendChild(foodsSection);
        }
        
        // Alimentos a evitar
        if (results.foodsToAvoid) {
            const avoidSection = createRecommendationSection(
                'Alimentos a limitar', 
                Array.isArray(results.foodsToAvoid) 
                    ? results.foodsToAvoid 
                    : results.foodsToAvoid.split(',').map(food => food.trim()),
                'avoid-item'
            );
            advancedSection.appendChild(avoidSection);
        }
        
        // Suplementos recomendados
        if (results.supplements) {
            const supplementsSection = createRecommendationSection(
                'Suplementos a considerar', 
                Array.isArray(results.supplements) 
                    ? results.supplements 
                    : results.supplements.split(',').map(supp => supp.trim()),
                'supplement-item'
            );
            advancedSection.appendChild(supplementsSection);
        }
        
        // Distribución de comidas
        if (results.mealsPerDay || results.feedingWindow) {
            const mealsSection = document.createElement('div');
            mealsSection.className = 'recommendation-section';
            
            const mealsTitle = document.createElement('h4');
            mealsTitle.textContent = 'Patrón de alimentación';
            mealsSection.appendChild(mealsTitle);
            
            const mealInfo = document.createElement('p');
            mealInfo.innerHTML = results.mealsPerDay 
                ? `<strong>Comidas recomendadas:</strong> ${results.mealsPerDay} al día<br>` 
                : '';
            mealInfo.innerHTML += results.feedingWindow 
                ? `<strong>Ventana de alimentación:</strong> ${results.feedingWindow}` 
                : '';
            
            mealsSection.appendChild(mealInfo);
            advancedSection.appendChild(mealsSection);
        }
    }
    
    console.log('UI actualizada correctamente con resultados detallados');
}

/**
 * Crea una sección de recomendaciones para la UI
 * @param {string} title - Título de la sección
 * @param {Array} items - Lista de elementos a mostrar
 * @param {string} itemClass - Clase adicional para los elementos
 * @returns {HTMLElement} - Elemento DOM de la sección
 */
function createRecommendationSection(title, items, itemClass = '') {
    const section = document.createElement('div');
    section.className = 'recommendation-section';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    
    const list = document.createElement('ul');
    list.className = 'recommendation-list';
    
    // Filtrar elementos vacíos y limitar a 10 elementos
    items = items.filter(item => item && item.trim()).slice(0, 10);
    
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = `recommendation-item ${itemClass}`;
        listItem.textContent = item.trim();
        list.appendChild(listItem);
    });
    
    section.appendChild(list);
    return section;
} 