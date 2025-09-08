// Script para verificar la configuración de Dropbox
import { loadEnvStrict } from '../lib/env-loader.js'

// Cargar variables de entorno
loadEnvStrict()

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE DROPBOX')
console.log('========================================')
console.log('')

// Verificar variables de entorno
console.log('📋 VARIABLES DE ENTORNO:')
console.log(`   DROPBOX_CLIENT_ID: ${process.env.DROPBOX_CLIENT_ID ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   DROPBOX_CLIENT_SECRET: ${process.env.DROPBOX_CLIENT_SECRET ? '✅ Configurada' : '❌ No configurada'}`)

if (process.env.DROPBOX_CLIENT_ID) {
    console.log(`   CLIENT_ID (primeros 10 chars): ${process.env.DROPBOX_CLIENT_ID.substring(0, 10)}...`)
}

if (process.env.DROPBOX_CLIENT_SECRET) {
    console.log(`   CLIENT_SECRET (primeros 10 chars): ${process.env.DROPBOX_CLIENT_SECRET.substring(0, 10)}...`)
}

console.log('')

// Verificar configuración en la base de datos
console.log('📊 VERIFICANDO CONFIGURACIÓN EN BASE DE DATOS:')

try {
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: configs, error } = await supabase
        .from('cloud_drive_configs')
        .select('*')
        .eq('provider', 'dropbox')
        .eq('is_active', true)

    if (error) {
        console.error('❌ Error consultando base de datos:', error)
    } else {
        console.log(`   Configuraciones encontradas: ${configs?.length || 0}`)

        if (configs && configs.length > 0) {
            configs.forEach((config, index) => {
                console.log(`   Config ${index + 1}:`)
                console.log(`     Tenant ID: ${config.tenant_id}`)
                console.log(`     Folder Path: ${config.folder_path}`)
                console.log(`     Access Token: ${config.access_token ? '✅ Presente' : '❌ Ausente'}`)
                console.log(`     Refresh Token: ${config.refresh_token ? '✅ Presente' : '❌ Ausente'}`)
                console.log(`     Created: ${config.created_at}`)
            })
        }
    }

} catch (error) {
    console.error('❌ Error verificando base de datos:', error)
}

console.log('')
console.log('💡 INSTRUCCIONES PARA CONFIGURAR DROPBOX:')
console.log('1. Ve a https://www.dropbox.com/developers/apps')
console.log('2. Crea una nueva aplicación')
console.log('3. Selecciona "Scoped access"')
console.log('4. Selecciona "Full Dropbox"')
console.log('5. Copia el App Key y App Secret')
console.log('6. Añade las variables a tu archivo .env:')
console.log('   DROPBOX_CLIENT_ID=tu_app_key')
console.log('   DROPBOX_CLIENT_SECRET=tu_app_secret')
console.log('7. En Netlify, añade las mismas variables en Environment variables')
console.log('8. Haz un nuevo deploy')
