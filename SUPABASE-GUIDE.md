# Guía para configurar Supabase con tu aplicación Kcal

## Requisitos previos
- Una cuenta en [Supabase](https://supabase.com)
- Una cuenta en [OpenAI](https://openai.com) con API key
- Docker Desktop (para desarrollo local)

## Pasos para configuración remota (sin Docker)

### 1. Configurar tu API key de OpenAI en Supabase

1. Inicia sesión en tu panel de control de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `nmxcjhadpequkuuutepa`
3. Ve a "Configuración" → "API" → "Edge Functions"
4. En la sección "Secrets", agrega una nueva con:
   - Nombre: `OPENAI_API_KEY`
   - Valor: tu API key de OpenAI (comienza con `sk-`)

### 2. Desplegar la función Edge desde el panel de control

Si tienes problemas con Docker Desktop, puedes implementar la función directamente desde el panel de control:

1. Ve a "Edge Functions" en el menú lateral
2. Haz clic en "Nuevo"
3. Nombre: `analyze-food`
4. Copia y pega el código de `supabase/functions/analyze-food/index.ts`
5. Haz clic en "Desplegar"

### 3. Verificar la configuración en tu aplicación

Asegúrate de que tu archivo `js/utils/api-config.js` tenga los siguientes valores:

```javascript
// Selecciona qué API de IA usar para análisis de alimentos
export const AI_PROVIDER = 'SUPABASE';

// Configuración para Supabase
export const SUPABASE_CONFIG = {
    PROJECT_URL: 'https://nmxcjhadpequkuuutepa.supabase.co',
    API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5teGNqaGFkcGVxdWt1dXV0ZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTExOTgsImV4cCI6MjA2MTg2NzE5OH0.cGZO0mDjDbUP9fd0mKGd_d6AHlfhB8EPRfgJX9v_m04'
};
```

## Pasos para configuración local (con Docker)

### 1. Iniciar Docker Desktop

Asegúrate de que Docker Desktop esté instalado y en ejecución:
- Busca el icono de Docker en la bandeja del sistema
- Si no está, inicia la aplicación Docker Desktop
- Espera a que esté completamente iniciado (icono verde)

### 2. Configurar Supabase localmente

Una vez que Docker esté funcionando, ejecuta:

```bash
supabase start
```

### 3. Configurar tu API key de OpenAI localmente

```bash
supabase secrets set OPENAI_API_KEY=tu-api-key-de-openai
```

### 4. Implementar la función Edge localmente

```bash
supabase functions serve analyze-food
```

### 5. Actualizar la configuración para desarrollo local

Para pruebas locales, actualiza `js/utils/api-config.js`:

```javascript
export const SUPABASE_CONFIG = {
    PROJECT_URL: 'http://localhost:54321',
    API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMDY2MTk3MCwiZXhwIjoxOTM2MjM3OTcwfQ.RglX-aJdC4mgUc7-AD9BT9SzYQDjAqTZ3KAZNJcmgPA'
};
```

## Solución de problemas

### Docker Desktop no se inicia
- Reinicia Windows y vuelve a intentarlo
- Verifica que la virtualización esté habilitada en la BIOS
- Reinstala Docker Desktop

### Error al desplegar funciones
- Verifica que Docker Desktop esté en ejecución
- Ejecuta `docker ps` para confirmar que Docker responde
- Verifica tus credenciales de Supabase con `supabase login`

### La función no responde correctamente
- Verifica que la API key de OpenAI sea válida
- Revisa los logs en el panel de control de Supabase
- Prueba la función directamente en el panel de Supabase 