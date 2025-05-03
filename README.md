# Kcal - Seguimiento Nutricional con IA

Aplicación web progresiva (PWA) para seguimiento nutricional diario mediante análisis de fotografías con GPT-4o, optimizada para móviles.

## 🌟 Demo

Accede a la versión en vivo: [https://christophercousin.github.io/calories-web](https://christophercousin.github.io/calories-web)

![Vista previa de la aplicación](img/preview.jpg)

## 🚀 Características

- **Interfaz optimizada para móviles**: Diseño tipo app nativa con navegación inferior
- **Análisis automático de fotos**: Identificación de alimentos y cálculo nutricional mediante GPT-4o
- **Seguimiento visual**: Progreso diario de calorías y macronutrientes con visualizaciones intuitivas
- **Diseño PWA**: Instalable como aplicación en dispositivos móviles
- **Funcionamiento offline**: Almacenamiento local y sincronización inteligente

## 🏗️ Estructura del Proyecto

```
Kcal/
├── index.html                # Documento HTML principal
├── manifest.json             # Configuración para PWA
├── service-worker.js         # Service Worker para caché y offline
├── css/                      # Estilos CSS
│   ├── main.css              # Importaciones de todos los estilos
│   ├── base/                 # Estilos base (variables, reset)
│   ├── components/           # Componentes de UI
│   │   ├── mobile-nav.css    # Navegación inferior móvil
│   │   ├── entries.css       # Diseño de entradas del diario
│   │   └── ...
│   └── layout/               # Estilos de layout
├── js/                       # JavaScript
│   ├── main.js               # Punto de entrada principal
│   ├── modules/              # Módulos funcionales
│   │   ├── app.js            # Controlador principal 
│   │   ├── mobile-nav.js     # Navegación móvil
│   │   ├── photo-handler.js  # Gestión de fotos y análisis
│   │   └── ...
│   ├── services/             # Servicios externos
│   │   ├── openai-service.js # Comunicación con API de OpenAI
│   │   └── ...
│   └── utils/                # Utilidades
└── img/                      # Imágenes e iconos
    ├── icons/                # Iconos para PWA
    └── ...
```

## 🧠 Integración con GPT-4o

La aplicación utiliza GPT-4o para dos funcionalidades principales:

1. **Análisis de fotografías de comida**:
   - Identificación automática de alimentos
   - Estimación de calorías y macronutrientes
   - Recomendaciones personalizadas

2. **Cálculos nutricionales personalizados**:
   - Estimación de requerimientos calóricos
   - Distribución óptima de macronutrientes según objetivos
   - Sugerencias adaptadas al perfil del usuario

## 💻 Desarrollo Local

Para ejecutar el proyecto en modo desarrollo:

1. Clona el repositorio:
   ```
   git clone https://github.com/christophercousin/calories-web.git
   cd calories-web/Kcal
   ```

2. Inicia un servidor local:
   ```
   # Con Node.js
   npx http-server
   
   # Con Python
   python -m http.server
   ```

3. Accede a `http://localhost:8000` en tu navegador

## 🔧 Configuración de API

Para utilizar la funcionalidad de análisis de imágenes, necesitas configurar tu clave API de OpenAI:

1. Crea un archivo `js/utils/api-config.js` con el siguiente contenido:
   ```javascript
   // Configuración de APIs
   export const OPENAI_CONFIG = {
     API_KEY: 'tu-api-key-aquí'
   };
   
   export const AI_PROVIDER = 'OPENAI';
   ```

2. Reemplaza `'tu-api-key-aquí'` con tu clave API de OpenAI

## 📱 Uso como PWA

La aplicación puede instalarse como una PWA en dispositivos móviles:

1. Accede a la URL en un navegador compatible (Chrome, Safari, etc.)
2. En Chrome: toca en el menú (⋮) y selecciona "Añadir a pantalla de inicio"
3. En Safari: toca en el icono de compartir y selecciona "Añadir a pantalla de inicio"

## 📚 Recursos y Documentación

- [Documentación de OpenAI API](https://platform.openai.com/docs/overview)
- [MDN Web Docs - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 📝 Licencia

Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE para más detalles. 