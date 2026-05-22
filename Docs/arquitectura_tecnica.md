# Arquitectura Técnica

## Tecnologías Utilizadas
- **Frontend**: React, Vite, Tailwind CSS
- **Backend / BaaS**: Firebase (Firestore para base de datos, Authentication para usuarios)
- **Inteligencia Artificial**: Google Gemini API (para análisis y recomendaciones de pedidos)
- **Gestión de Estado**: React Hooks

## Estructura del Sistema
El sistema sigue una arquitectura de Single Page Application (SPA), donde el frontend se comunica directamente con los servicios de Firebase y la API de Gemini.

- Autenticación gestionada por Firebase Auth
- Datos de clientes y pedidos almacenados en Cloud Firestore
- Interfaz reactiva adaptada para diferentes dispositivos
