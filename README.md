# Kcal - Seguimiento Nutricional

Aplicación web progresiva (PWA) para seguimiento nutricional diario mediante fotografías, con enfoque en la experiencia de usuario móvil y simplicidad.

## Características

- **Interfaz optimizada para móviles**: Diseño tipo app nativa con navegación inferior
- **Entrada de alimentos con foto**: Análisis automático de fotos de comida mediante GPT-4 Vision
- **Seguimiento de macronutrientes**: Proteínas, carbohidratos y grasas
- **Visualización intuitiva**: Anillos de progreso para seguimiento diario
- **Diseño PWA**: Instalable como aplicación en dispositivos móviles
- **Funcionamiento offline**: Gracias a la implementación de Service Workers

## Estructura del Proyecto

```
Kcal/
├── index.html                # Documento HTML principal
├── manifest.json             # Configuración para PWA
├── service-worker.js         # Service Worker para caché y offline
├── css/                      # Carpeta de estilos CSS
│   ├── main.css              # Importaciones de todos los estilos
│   ├── styles.css            # Estilos globales
│   ├── base/                 # Estilos base (variables, reset)
│   ├── components/           # Componentes de UI
│   │   ├── mobile-nav.css    # Navegación inferior móvil
│   │   ├── mobile.css        # Optimizaciones móviles
│   │   └── ...
│   └── layout/               # Estilos de layout
├── js/                       # Carpeta de archivos JavaScript
│   ├── main.js               # Punto de entrada principal
│   ├── modules/              # Módulos funcionales
│   │   ├── app.js            # Controlador principal de la aplicación
│   │   ├── mobile-nav.js     # Navegación móvil
│   │   ├── data.js           # Gestión de datos
│   │   └── ...
│   ├── services/             # Servicios externos
│   └── utils/                # Utilidades
└── img/                      # Imágenes e iconos
    ├── icons/                # Iconos para PWA
    └── ...
```

## Mejoras Implementadas

1. **Transformación a PWA**:
   - Manifest para instalación en dispositivos
   - Service Worker para funcionamiento offline
   - Iconos para diferentes tamaños de pantalla

2. **Experiencia Móvil Optimizada**:
   - Navegación inferior estilo app nativa
   - Botón de cámara prominente para rápido acceso
   - UI adaptada para uso con una mano
   - Rendimiento optimizado para dispositivos móviles

3. **Flujo Simplificado**:
   - Enfoque en la captura de fotos de comida
   - Priorización del seguimiento diario sobre la calculadora
   - Reducción de pasos para registrar alimentos

## Cómo Usar

1. Abre la aplicación en un navegador móvil (Chrome recomendado)
2. Si deseas instalarla, usa la opción "Añadir a pantalla de inicio"
3. Configura tus objetivos nutricionales
4. Usa el botón de cámara para tomar fotos de tus comidas
5. Visualiza tu progreso diario en la pantalla principal

## Desarrollo

Para ejecutar el proyecto en modo desarrollo:

1. Clona el repositorio
2. Abre el directorio del proyecto
3. Inicia un servidor local (por ejemplo: `npx http-server` o `python -m http.server`)
4. Accede a `http://localhost:8000` en tu navegador

## Próximas Mejoras

- Integración completa con GPT-4 Vision para análisis de alimentos
- Visualización mejorada del historial con imágenes de comidas
- Personalización de objetivos basada en patrones de alimentación
- Sincronización con la nube

## Dependencias

La aplicación usa JavaScript vanilla, CSS y HTML, con las siguientes características avanzadas:
- Service Workers para funcionalidad offline
- Web Storage API para almacenamiento local
- (Pendiente) Integración con OpenAI API para análisis de imágenes 