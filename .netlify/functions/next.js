// Función Netlify para Next.js
const { createRequestHandler } = require('@netlify/plugin-nextjs')

const handler = createRequestHandler({
    // Configuración específica para Netlify
    config: {
        // Ruta al directorio .next
        distDir: '.next',
        // Habilitar funciones serverless
        serverless: true,
    },
})

exports.handler = handler
