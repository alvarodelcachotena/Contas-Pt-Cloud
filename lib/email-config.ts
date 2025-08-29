const nodemailer = require('nodemailer')

// Configuración para Gmail
export const emailConfig = {
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'tu-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'tu-contraseña-de-aplicacion'
    }
}

// Crear transporter
export const createTransporter = () => {
    return nodemailer.createTransport(emailConfig)
}

// Función para generar PDF de factura (simulada por ahora)
export const generateInvoicePDF = (invoiceData: any, client: any) => {
    // Aquí puedes integrar con una librería como jsPDF o Puppeteer
    // Por ahora retornamos HTML que se puede convertir a PDF
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fatura ${invoiceData.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .invoice-details { margin: 20px 0; }
        .client-info { margin: 20px 0; }
        .items { margin: 20px 0; }
        .total { text-align: right; font-weight: bold; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FATURA</h1>
        <h2>${invoiceData.number}</h2>
        <p>Data: ${invoiceData.issue_date}</p>
        <p>Vencimento: ${invoiceData.due_date}</p>
      </div>
      
      <div class="client-info">
        <h3>Cliente:</h3>
        <p><strong>Nome:</strong> ${client.name}</p>
        <p><strong>Email:</strong> ${client.email}</p>
        <p><strong>NIF:</strong> ${client.nif}</p>
      </div>
      
      <div class="items">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor Base</th>
              <th>IVA (${invoiceData.vat_rate}%)</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoiceData.description}</td>
              <td>€${invoiceData.amount.toFixed(2)}</td>
              <td>€${invoiceData.vat_amount.toFixed(2)}</td>
              <td>€${invoiceData.total_amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="total">
        <p><strong>Total a Pagar: €${invoiceData.total_amount.toFixed(2)}</p>
        <p><strong>Termos de Pagamento:</strong> ${invoiceData.payment_terms}</p>
      </div>
    </body>
    </html>
  `
}
