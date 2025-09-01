// Script para probar la API de registro
const testRegistration = async () => {
  try {
    console.log('🧪 Probando API de registro...')
    
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123456',
      companyName: 'Test Company',
      nif: '123456789'
    }

    console.log('📝 Datos de prueba:', { ...testData, password: '[HIDDEN]' })

    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    console.log('📡 Status de respuesta:', response.status)
    console.log('📡 Headers de respuesta:', Object.fromEntries(response.headers.entries()))

    const data = await response.text()
    console.log('📄 Respuesta completa:', data)

    try {
      const jsonData = JSON.parse(data)
      console.log('✅ Respuesta JSON válida:', jsonData)
    } catch (parseError) {
      console.log('❌ Error parseando JSON:', parseError.message)
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error)
  }
}

// Ejecutar la prueba
testRegistration()
