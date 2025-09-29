import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWhatsAppUsers() {
    console.log('🔍 Verificando tabla whatsapp_authorized_users...');

    try {
        const { data, error } = await supabase
            .from('whatsapp_authorized_users')
            .select('*');

        if (error) {
            console.log('❌ Error al consultar la tabla:', error.message);
            console.log('💡 Necesitas ejecutar el script SQL primero');
            return;
        }

        console.log('✅ Tabla encontrada');
        console.log('📱 Números registrados:');

        if (data && data.length > 0) {
            data.forEach(user => {
                console.log(`  - ${user.phone_number} (${user.display_name}) - ${user.is_active ? 'Activo' : 'Inactivo'}`);
            });
        } else {
            console.log('  ⚠️ No hay números registrados');
        }

    } catch (err) {
        console.log('❌ Error:', err.message);
    }
}

checkWhatsAppUsers();
