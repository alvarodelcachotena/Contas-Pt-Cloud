import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = request.headers.get('x-tenant-id') || '1'
    const action = searchParams.get('action')
    
    if (action === 'generate') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      if (!startDate || !endDate) {
        return NextResponse.json({ 
          error: 'Start date and end date are required for SAFT generation' 
        }, { status: 400 })
      }
      
      // Fetch data for SAFT export
      const [invoicesResult, expensesResult, clientsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('tenant_id', tenantId)
          .gte('issue_date', startDate)
          .lte('issue_date', endDate),
        supabase
          .from('expenses')
          .select('*')
          .eq('tenant_id', tenantId)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate),
        supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', tenantId)
      ])
      
      if (invoicesResult.error || expensesResult.error || clientsResult.error) {
        return NextResponse.json({ 
          error: 'Failed to fetch data for SAFT generation' 
        }, { status: 500 })
      }
      
      const saftData = {
        header: {
          auditFileVersion: '1.04_01',
          companyID: tenantId,
          taxRegistrationNumber: '123456789', // Should come from tenant data
          taxAccountingBasis: 'F', // Faturação
          companyName: 'Empresa Teste',
          fiscalYear: new Date(startDate).getFullYear(),
          startDate,
          endDate,
          currencyCode: 'EUR',
          dateCreated: new Date().toISOString().split('T')[0],
          taxEntity: 'Global',
          productCompanyTaxID: '123456789',
          softwareCertificateNumber: '0',
          productID: 'Contas-PT/1.0',
          productVersion: '1.0'
        },
        masterFiles: {
          generalLedgerAccounts: [],
          customers: clientsResult.data?.map(client => ({
            customerID: client.id,
            accountID: `C${client.id}`,
            customerTaxID: client.tax_id,
            companyName: client.name,
            billingAddress: {
              addressDetail: client.address || '',
              city: '',
              postalCode: '',
              country: 'PT'
            }
          })) || []
        },
        sourceDocuments: {
          salesInvoices: {
            numberOfEntries: invoicesResult.data?.length || 0,
            totalDebit: invoicesResult.data?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,
            totalCredit: 0,
            invoice: invoicesResult.data?.map(invoice => ({
              invoiceNo: invoice.number,
              documentStatus: {
                invoiceStatus: invoice.status === 'paid' ? 'F' : 'N',
                invoiceStatusDate: invoice.created_at,
                sourceID: 'Sistema',
                sourceBilling: 'P'
              },
              hash: '',
              hashControl: '1',
              period: new Date(invoice.issue_date).getMonth() + 1,
              invoiceDate: invoice.issue_date,
              invoiceType: 'FT',
              specialRegimes: {
                selfBillingIndicator: 0,
                cashVATSchemeIndicator: 0,
                thirdPartiesBillingIndicator: 0
              },
              sourceID: 'Sistema',
              systemEntryDate: invoice.created_at,
              customerID: invoice.client_name,
              line: [{
                lineNumber: 1,
                productCode: 'SERV',
                productDescription: invoice.description || 'Serviços',
                quantity: 1,
                unitOfMeasure: 'UN',
                unitPrice: parseFloat(invoice.amount || '0'),
                taxPointDate: invoice.issue_date,
                description: invoice.description || 'Serviços',
                debitAmount: parseFloat(invoice.amount || '0'),
                tax: {
                  taxType: 'IVA',
                  taxCountryRegion: 'PT',
                  taxCode: 'NOR',
                  taxPercentage: parseFloat(invoice.vat_rate || '23')
                },
                taxExemptionReason: ''
              }],
              documentTotals: {
                taxPayable: parseFloat(invoice.vat_amount || '0'),
                netTotal: parseFloat(invoice.amount || '0'),
                grossTotal: parseFloat(invoice.total_amount || '0')
              }
            })) || []
          }
        }
      }
      
      // Create SAFT export record
      const { data: saftExport, error: exportError } = await supabase
        .from('saft_exports')
        .insert({
          tenant_id: parseInt(tenantId),
          start_date: startDate,
          end_date: endDate,
          file_path: `saft_${tenantId}_${startDate}_${endDate}.xml`,
          status: 'completed',
          export_data: saftData
        })
        .select()
        .single()
      
      if (exportError) {
        console.error('Error creating SAFT export:', exportError)
        return NextResponse.json({ error: 'Failed to create SAFT export' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        saftData,
        exportId: saftExport.id
      })
    }
    
    // Get SAFT export history
    const { data: exports, error } = await supabase
      .from('saft_exports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching SAFT exports:', error)
      return NextResponse.json({ error: 'Failed to fetch SAFT exports' }, { status: 500 })
    }

    const formattedExports = exports?.map(exp => ({
      id: exp.id,
      startDate: exp.start_date,
      endDate: exp.end_date,
      filePath: exp.file_path,
      status: exp.status,
      createdAt: exp.created_at
    })) || []

    return NextResponse.json(formattedExports)
  } catch (error) {
    console.error('SAFT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}