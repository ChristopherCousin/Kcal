# Kcal - Seguimiento Nutricional

Aplicación web para seguimiento nutricional, con enfoque en la experiencia de usuario y simplicidad.

## Características

- **Seguimiento de macronutrientes**: Proteínas, carbohidratos y grasas
- **Tres modos de entrada**:
  - Entrada rápida de alimentos
  - Simulación de análisis de fotos de comida
  - Búsqueda de alimentos en base de datos
- **Comidas comunes preestablecidas**: Opciones rápidas para desayuno, comida, cena y snacks
- **Visualización intuitiva**: Anillos de progreso para seguimiento diario
- **Calculadora de objetivos**: Basada en la fórmula Mifflin-St Jeor

## Estructura del Proyecto

```
Kcal/
├── index.html                # Documento HTML principal
├── style.css                 # Estilos CSS globales
├── js/                       # Carpeta de archivos JavaScript
│   ├── main.js               # Punto de entrada principal
│   ├── modules/              # Módulos funcionales
│   │   ├── data.js           # Gestión de datos y almacenamiento
│   │   ├── events.js         # Gestión de eventos
│   │   ├── food-tracking.js  # Lógica de seguimiento de alimentos
│   │   ├── modals.js         # Gestión de ventanas modales
│   │   └── ui.js             # Actualización de interfaz
│   └── utils/                # Utilidades
│       └── ui-helpers.js     # Funciones auxiliares de UI
└── img/                      # Imágenes (opcional)
```

## Módulos JavaScript

- **main.js**: Inicializa la aplicación y coordina la carga de otros módulos
- **data.js**: Gestiona el estado, almacenamiento local y cálculos básicos
- **events.js**: Configura todos los event listeners de la aplicación
- **food-tracking.js**: Maneja la lógica de seguimiento de alimentos
- **modals.js**: Controla las ventanas modales (objetivos, análisis, etc.)
- **ui.js**: Maneja la actualización visual de la interfaz
- **ui-helpers.js**: Funciones auxiliares para la interfaz (toast, anillos, etc.)

## Cómo Usarlo

1. Abre `index.html` en tu navegador
2. Configura tus objetivos nutricionales
3. Añade comidas usando cualquiera de los tres métodos disponibles
4. Visualiza tu progreso en los anillos y el resumen diario

## Desarrollo

Para extender la funcionalidad:

1. **Conectar con API real**: Reemplazar las funciones simuladas (por ejemplo, `simulateSearchResults`) con llamadas a APIs reales como Open Food Facts.
2. **Implementar persistencia real**: Sustituir `localStorage` por una base de datos real.
3. **Añadir análisis de imágenes**: Integrar un servicio de reconocimiento de imágenes real.

## Dependencias

Actualmente la aplicación es puro JavaScript, CSS y HTML, sin dependencias externas. 