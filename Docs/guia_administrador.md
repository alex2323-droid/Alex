# Guía de Administrador

## Visión General
El rol de administrador es responsable de configurar las métricas globales del sistema y asegurar que los servicios subyacentes estén operando correctamente.

## Configuración de Entorno
Asegúrese de establecer correctamente las variables de entorno en su despliegue o archivo `.env`:

- `GEMINI_API_KEY`: Requerida para que el módulo de "Insights" (análisis inteligente de datos) funcione.
- Credenciales de Firebase: Asegúrese de que el archivo `firebase-applet-config.json` tenga el proyecto y la configuración correcta.

## Base de Datos (Firestore)
- Monitoree las cuotas y lecturas/escrituras en Firebase console.
- Administre los permisos de seguridad (Reglas de Firestore) para restringir el acceso a usuarios autenticados o con roles específicos.
