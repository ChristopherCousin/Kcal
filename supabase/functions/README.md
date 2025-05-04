# Funciones Serverless para Kcal App

Este directorio contiene las Edge Functions para Supabase que se utilizan en la aplicación Kcal.

## Función `analyze-food`

Esta función actúa como un proxy seguro para comunicarse con la API de OpenAI, manteniendo la API key segura en el servidor.

### Cómo desplegar la función:

1. **Instala la CLI de Supabase**:
   ```bash
   npm install -g supabase
   ```

2. **Inicia sesión en Supabase**:
   ```bash
   supabase login
   ```

3. **Vincula tu proyecto de Supabase**:
   ```bash
   supabase link --project-ref nmxcjhadpequkuuutepa
   ```

4. **Configura la API key de OpenAI como variable de entorno secreta**:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-tu-api-key-aqui
   ```

5. **Despliega la función**:
   ```bash
   supabase functions deploy analyze-food
   ```

6. **Configura permisos de la función** (en la interfaz web de Supabase):
   - Ve a Supabase Dashboard > Edge Functions > analyze-food
   - Establece el permiso "Public" para "invoker" (para permitir que todos puedan invocar la función)

### Prueba la función:

Puedes probar la función con el siguiente comando:

```bash
curl -X POST 'https://nmxcjhadpequkuuutepa.supabase.co/functions/v1/analyze-food' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5teGNqaGFkcGVxdWt1dXV0ZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTExOTgsImV4cCI6MjA2MTg2NzE5OH0.cGZO0mDjDbUP9fd0mKGd_d6AHlfhB8EPRfgJX9v_m04' \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "Analiza esta comida", "image": "BASE64_IMAGE_STRING"}'
```

### Importante:

- La API key de OpenAI nunca debe incluirse en el código del frontend.
- Los secretos se almacenan de forma segura en Supabase y solo son accesibles desde la función.
- Para actualizar el secreto, usa el comando `supabase secrets set` nuevamente. 