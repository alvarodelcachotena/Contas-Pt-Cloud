// Test script para verificar la API del dashboard
const fetch = require('node-fetch');

async function testDashboardAPI() {
    try {
        console.log('🧪 Probando API del dashboard...');

        const response = await fetch('http://localhost:3000/api/dashboard/metrics', {
            headers: {
                'x-tenant-id': '1'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en la API:', response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ API funcionando correctamente!');
        console.log('📊 Datos recibidos:', JSON.stringify(data, null, 2));

        // Verificar que los datos coincidan con lo esperado
        console.log('\n🔍 Verificación de datos:');
        console.log(`📄 Faturas: ${data.totalInvoices} (esperado: 5)`);
        console.log(`💸 Despesas: ${data.totalExpenses} (esperado: 6)`);
        console.log(`📋 Documentos: ${data.totalDocuments} (esperado: 11)`);
        console.log(`👥 Clientes: ${data.totalClients} (esperado: 3)`);
        console.log(`💰 Receita: €${data.totalRevenue} (esperado: €12177.00)`);
        console.log(`💸 Despesas Total: €${data.totalExpenseAmount} (esperado: €4150.00)`);
        console.log(`💚 Lucro: €${data.netProfit} (esperado: €8027.00)`);

    } catch (error) {
        console.error('❌ Error al probar la API:', error.message);
    }
}

// Ejecutar la prueba
testDashboardAPI();






