export const spanishTranslations = {
    navbar: {
        systemName: 'Sistema de Contabilidad Portugués',
        logout: 'Cerrar Sesión',
        userRole: 'Función'
    },
    sidebar: {
        title: 'Contas-PT',
        subtitle: 'Sistema de Contabilidad',
        navigation: {
            dashboard: 'Panel de Control',
            invoices: 'Facturas',
            expenses: 'Gastos',
            payments: 'Pagos',
            clients: 'Clientes',
            suppliers: 'Proveedores',
            documents: 'Documentos',
            banking: 'Bancos',
            vat: 'IVA',
            saft: 'SAF-T',
            reports: 'Informes',
            aiAssistant: 'Asistente IA',
            cloudDrives: 'Almacenamiento en la Nube',
            webhooks: 'Webhooks',
            admin: 'Administrador',
            profile: 'Perfil'
        },
        footer: {
            copyright: '© 2025 Contas-PT',
            version: 'v2.0 - Next.js'
        }
    },
    dashboard: {
        title: 'Panel de Control',
        subtitle: 'Visión general de tu negocio',
        lastUpdate: 'Última actualización',
        whatsappFiles: 'Archivos de WhatsApp',
        tryAgain: 'Intentar de nuevo',
        errorLoading: 'Error al cargar',
        metrics: {
            invoices: {
                title: 'Facturas',
                subtitle: 'Facturas procesadas'
            },
            expenses: {
                title: 'Gastos',
                subtitle: 'Gastos registrados'
            },
            documents: {
                title: 'Documentos',
                processed: 'Procesados',
                pending: 'Pendientes'
            },
            clients: {
                title: 'Clientes',
                subtitle: 'Clientes registrados'
            },
            totalRevenue: {
                title: 'Ingresos Totales',
                thisMonth: 'Este mes',
                subtitle: 'Ingresos del mes'
            },
            totalExpenses: {
                title: 'Gastos Totales',
                thisMonth: 'Este mes',
                subtitle: 'Gastos del mes'
            },
            netProfit: {
                title: 'Beneficio Neto',
                thisMonth: 'Este mes',
                subtitle: 'Beneficio del mes'
            },
            processingStatus: {
                title: 'Estado del Procesamiento',
                successRate: 'Tasa de Éxito',
                processed: 'Procesados',
                pending: 'Pendientes'
            },
            monthlySummary: {
                title: 'Resumen Mensual',
                monthlyRevenue: 'Ingresos Mensuales',
                monthlyExpenses: 'Gastos Mensuales',
                monthlyProfit: 'Beneficio Mensual'
            }
        }
    },
    invoices: {
        title: 'Facturas',
        subtitle: 'Gestiona tus facturas',
        searchPlaceholder: 'Buscar facturas...',
        newInvoice: 'Nueva Factura',
        export: 'Exportar',
        addInvoice: 'Añadir Factura',
        noInvoices: 'No hay facturas',
        totalInvoices: 'Total de Facturas',
        totalValue: 'Valor Total',
        table: {
            fileName: 'Archivo',
            nif: 'NIF',
            vat: 'IVA',
            total: 'Total',
            paymentType: 'Tipo de Pago',
            issueDate: 'Fecha de Emisión',
            status: 'Estado',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles de la Factura',
            submitLabel: 'Guardar Factura',
            clientName: 'Nombre del Cliente',
            clientEmail: 'Email del Cliente',
            clientTaxId: 'NIF del Cliente',
            baseAmount: 'Importe Base',
            vatRate: 'Tasa de IVA',
            description: 'Descripción',
            paymentType: 'Tipo de Pago',
            supplier: 'Proveedor',
            summary: 'Resumen',
            autoCompleteHint: 'Escribe para buscar...',
            clientFound: 'Cliente encontrado',
            close: 'Cerrar'
        },
        status: {
            paid: 'Pagada',
            sent: 'Enviada',
            draft: 'Borrador',
            overdue: 'Vencida'
        },
        paymentTypes: {
            bankTransfer: 'Transferencia Bancaria',
            card: 'Tarjeta',
            supplierCredit: 'Crédito de Proveedor'
        },
        errors: {
            loadError: 'Error al cargar facturas',
            saveError: 'Error al guardar factura',
            deleteError: 'Error al eliminar factura',
            exportError: 'No hay facturas para exportar'
        }
    },
    expenses: {
        title: 'Gastos',
        subtitle: 'Gestiona tus gastos',
        searchPlaceholder: 'Buscar gastos...',
        newExpense: 'Nuevo Gasto',
        export: 'Exportar',
        addExpense: 'Añadir Gasto',
        noExpenses: 'No hay gastos',
        totalExpenses: 'Total de Gastos',
        totalValue: 'Valor Total',
        table: {
            fileName: 'Archivo',
            vendor: 'Proveedor',
            amount: 'Importe',
            date: 'Fecha',
            category: 'Categoría',
            description: 'Descripción',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Gasto',
            close: 'Cerrar'
        },
        categories: {
            office: 'Oficina',
            travel: 'Viajes',
            meals: 'Comidas',
            transport: 'Transporte',
            marketing: 'Marketing',
            other: 'Otros'
        },
        vatRates: {
            exempt: '0% (Exento)',
            reduced: '6% (Reducido)',
            intermediate: '13% (Intermedio)',
            normal: '23% (Normal)'
        },
        errors: {
            loadError: 'Error al cargar gastos',
            saveError: 'Error al guardar gasto',
            deleteError: 'Error al eliminar gasto',
            exportError: 'No hay gastos para exportar'
        }
    },
    payments: {
        title: 'Pagos',
        subtitle: 'Gestiona tus pagos',
        searchPlaceholder: 'Buscar pagos...',
        newPayment: 'Nuevo Pago',
        export: 'Exportar',
        addPayment: 'Añadir Pago',
        noPayments: 'No hay pagos',
        totalPayments: 'Total de Pagos',
        totalValue: 'Valor Total',
        table: {
            invoice: 'Factura',
            amount: 'Importe',
            date: 'Fecha',
            method: 'Método',
            status: 'Estado',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Pago',
            close: 'Cerrar'
        },
        types: {
            income: 'Ingreso',
            expense: 'Gasto'
        },
        methods: {
            credit: 'Crédito',
            bank_transfer: 'Transferencia Bancaria',
            card: 'Tarjeta',
            cash: 'Efectivo'
        },
        status: {
            pending: 'Pendiente',
            completed: 'Completado',
            failed: 'Fallido',
            cancelled: 'Cancelado'
        },
        errors: {
            loadError: 'Error al cargar pagos',
            saveError: 'Error al guardar pago',
            deleteError: 'Error al eliminar pago',
            exportError: 'No hay pagos para exportar'
        }
    },
    clients: {
        title: 'Clientes',
        subtitle: 'Gestiona tus clientes',
        searchPlaceholder: 'Buscar clientes...',
        newClient: 'Nuevo Cliente',
        export: 'Exportar',
        addClient: 'Añadir Cliente',
        noClients: 'No hay clientes',
        totalClients: 'Total de Clientes',
        activeClients: 'Clientes Activos',
        table: {
            name: 'Nombre',
            email: 'Email',
            phone: 'Teléfono',
            address: 'Dirección',
            nif: 'NIF',
            status: 'Estado',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Cliente',
            close: 'Cerrar'
        },
        form: {
            title: 'Nuevo Cliente',
            name: 'Nombre',
            email: 'Email',
            phone: 'Teléfono',
            address: 'Dirección',
            nif: 'NIF',
            isActive: 'Activo',
            save: 'Guardar',
            cancel: 'Cancelar'
        },
        errors: {
            loadError: 'Error al cargar clientes',
            saveError: 'Error al guardar cliente',
            deleteError: 'Error al eliminar cliente',
            exportError: 'No hay clientes para exportar'
        }
    },
    suppliers: {
        title: 'Proveedores',
        subtitle: 'Gestiona tus proveedores',
        searchPlaceholder: 'Buscar proveedores...',
        newSupplier: 'Nuevo Proveedor',
        export: 'Exportar',
        addSupplier: 'Añadir Proveedor',
        noSuppliers: 'No hay proveedores',
        totalSuppliers: 'Total de Proveedores',
        activeSuppliers: 'Proveedores Activos',
        table: {
            name: 'Nombre',
            email: 'Email',
            phone: 'Teléfono',
            address: 'Dirección',
            nif: 'NIF',
            status: 'Estado',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Proveedor',
            close: 'Cerrar'
        },
        form: {
            title: 'Nuevo Proveedor',
            name: 'Nombre',
            email: 'Email',
            phone: 'Teléfono',
            address: 'Dirección',
            nif: 'NIF',
            isActive: 'Activo',
            save: 'Guardar',
            cancel: 'Cancelar'
        },
        errors: {
            loadError: 'Error al cargar proveedores',
            saveError: 'Error al guardar proveedor',
            deleteError: 'Error al eliminar proveedor',
            exportError: 'No hay proveedores para exportar'
        }
    },
    documents: {
        title: 'Documentos',
        subtitle: 'Gestiona tus documentos',
        searchPlaceholder: 'Buscar documentos...',
        uploadDocument: 'Subir Documento',
        noDocuments: 'No hay documentos',
        totalDocuments: 'Total de Documentos',
        processedDocuments: 'Documentos Procesados',
        table: {
            name: 'Nombre',
            type: 'Tipo',
            date: 'Fecha',
            size: 'Tamaño',
            format: 'Formato',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Documento',
            close: 'Cerrar'
        },
        fileTypes: {
            pdf: 'PDF',
            doc: 'DOC',
            docx: 'DOCX',
            jpg: 'JPG',
            png: 'PNG',
            txt: 'TXT',
            xml: 'XML'
        },
        documentTypes: {
            invoice: 'Factura',
            receipt: 'Recibo',
            contract: 'Contrato',
            report: 'Informe',
            other: 'Otro'
        },
        errors: {
            loadError: 'Error al cargar documentos',
            uploadError: 'Error al subir documento',
            deleteError: 'Error al eliminar documento'
        }
    },
    banking: {
        title: 'Bancos',
        subtitle: 'Gestiona tus cuentas bancarias',
        searchPlaceholder: 'Buscar bancos...',
        newBank: 'Nuevo Banco',
        export: 'Exportar',
        addBank: 'Añadir Banco',
        noBanks: 'No hay bancos',
        totalBanks: 'Total de Bancos',
        totalBalance: 'Saldo Total',
        table: {
            name: 'Nombre',
            accountNumber: 'Número de Cuenta',
            balance: 'Saldo',
            currency: 'Moneda',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Banco',
            close: 'Cerrar'
        },
        transactionTypes: {
            credit: 'Crédito',
            debit: 'Débito',
            transfer: 'Transferencia'
        },
        form: {
            title: 'Nuevo Banco',
            name: 'Nombre del Banco',
            accountNumber: 'Número de Cuenta',
            balance: 'Saldo Inicial',
            currency: 'Moneda',
            save: 'Guardar',
            cancel: 'Cancelar'
        },
        errors: {
            loadError: 'Error al cargar bancos',
            saveError: 'Error al guardar banco',
            deleteError: 'Error al eliminar banco',
            exportError: 'No hay bancos para exportar'
        }
    },
    vat: {
        title: 'IVA',
        subtitle: 'Gestiona el IVA',
        searchPlaceholder: 'Buscar registros de IVA...',
        newVatRecord: 'Nuevo Registro IVA',
        export: 'Exportar',
        noVatRecords: 'No hay registros de IVA',
        totalVatCollected: 'IVA Cobrado Total',
        totalVatPaid: 'IVA Pagado Total',
        table: {
            period: 'Período',
            sales: 'Ventas',
            purchases: 'Compras',
            vatCollected: 'IVA Cobrado',
            vatPaid: 'IVA Pagado',
            netVat: 'IVA Neto',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del IVA',
            close: 'Cerrar'
        },
        errors: {
            loadError: 'Error al cargar registros de IVA',
            saveError: 'Error al guardar registro de IVA',
            deleteError: 'Error al eliminar registro de IVA',
            exportError: 'No hay registros de IVA para exportar'
        }
    },
    saft: {
        title: 'SAF-T',
        subtitle: 'Archivo de Seguridad de Facturas',
        generateSaft: 'Generar SAF-T',
        downloadSaft: 'Descargar SAF-T',
        noSaftFiles: 'No hay archivos SAF-T',
        totalSaftFiles: 'Total de Archivos SAF-T',
        lastGenerated: 'Último Generado',
        table: {
            period: 'Período',
            status: 'Estado',
            generatedDate: 'Fecha de Generación',
            fileSize: 'Tamaño del Archivo',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del SAF-T',
            close: 'Cerrar'
        },
        errors: {
            loadError: 'Error al cargar archivos SAF-T',
            generateError: 'Error al generar SAF-T',
            downloadError: 'Error al descargar SAF-T'
        }
    },
    reports: {
        title: 'Informes',
        subtitle: 'Genera informes de tu negocio',
        generateReport: 'Generar Informe',
        export: 'Exportar',
        noReports: 'No hay informes',
        totalReports: 'Total de Informes',
        lastGenerated: 'Último Generado',
        table: {
            name: 'Nombre',
            type: 'Tipo',
            period: 'Período',
            generatedDate: 'Fecha de Generación',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Informe',
            close: 'Cerrar'
        },
        reportTypes: {
            title: 'Tipos de Informe',
            financial: {
                name: 'Informe Financiero',
                description: 'Ingresos, gastos y beneficios',
                generate: 'Generar'
            },
            invoices: {
                name: 'Informe de Facturas',
                description: 'Facturas emitidas y recibidas',
                generate: 'Generar'
            },
            expenses: {
                name: 'Informe de Gastos',
                description: 'Análisis de gastos por categoría',
                generate: 'Generar'
            },
            clients: {
                name: 'Informe de Clientes',
                description: 'Análisis de clientes y ventas',
                generate: 'Generar'
            },
            suppliers: {
                name: 'Informe de Proveedores',
                description: 'Análisis de proveedores y compras',
                generate: 'Generar'
            }
        },
        errors: {
            loadError: 'Error al cargar informes',
            generateError: 'Error al generar informe',
            exportError: 'Error al exportar informe'
        }
    },
    aiAssistant: {
        title: 'Asistente IA',
        subtitle: 'Chatea con tu asistente de IA',
        placeholder: 'Escribe tu mensaje aquí...',
        send: 'Enviar',
        clear: 'Limpiar',
        noMessages: 'No hay mensajes',
        thinking: 'Pensando...',
        error: 'Error al enviar mensaje',
        features: {
            fastResponse: 'Respuesta rápida',
            portugueseContext: 'Contexto portugués',
            specializedAI: 'IA especializada',
            pdfAnalysis: 'Análisis de PDF/imágenes'
        },
        errors: {
            sendError: 'Error al enviar mensaje',
            loadError: 'Error al cargar mensajes'
        }
    },
    cloudDrives: {
        title: 'Almacenamiento en la Nube',
        subtitle: 'Gestiona tus archivos en la nube',
        connectDrive: 'Conectar Drive',
        loading: 'Cargando configuración...',
        metrics: {
            totalFiles: 'Total de Archivos',
            totalSize: 'Tamaño Total',
            lastSync: 'Última Sincronización',
            connectedDrives: 'Drives Conectados'
        },
        messages: {
            dropboxSuccess: 'Dropbox conectado con éxito',
            googleDriveSuccess: 'Google Drive conectado con éxito',
            oneDriveSuccess: 'OneDrive conectado con éxito',
            disconnectSuccess: 'Proveedor desconectado con éxito',
            dropboxConnected: 'Dropbox conectado con éxito',
            googleDriveConnected: 'Google Drive conectado con éxito',
            oneDriveConnected: 'OneDrive conectado con éxito'
        },
        noDrives: 'No hay drives conectados',
        table: {
            name: 'Nombre',
            type: 'Tipo',
            status: 'Estado',
            lastSync: 'Última Sincronización',
            actions: 'Acciones'
        },
        errors: {
            loadError: 'Error al cargar drives',
            connectError: 'Error al conectar drive',
            disconnectError: 'Error al desconectar drive'
        }
    },
    webhooks: {
        title: 'Webhooks',
        subtitle: 'Gestiona tus webhooks',
        addWebhook: 'Añadir Webhook',
        noWebhooks: 'No hay webhooks',
        totalWebhooks: 'Total de Webhooks',
        activeWebhooks: 'Webhooks Activos',
        table: {
            name: 'Nombre',
            url: 'URL',
            events: 'Eventos',
            status: 'Estado',
            lastTriggered: 'Último Disparo',
            actions: 'Acciones'
        },
        modal: {
            title: 'Detalles del Webhook',
            close: 'Cerrar'
        },
        errors: {
            loadError: 'Error al cargar webhooks',
            saveError: 'Error al guardar webhook',
            deleteError: 'Error al eliminar webhook'
        }
    },
    admin: {
        title: 'Administrador',
        subtitle: 'Configuración del sistema',
        users: {
            title: 'Usuarios',
            addUser: 'Añadir Usuario',
            noUsers: 'No hay usuarios',
            totalUsers: 'Total de Usuarios',
            activeUsers: 'Usuarios Activos',
            table: {
                name: 'Nombre',
                email: 'Email',
                role: 'Rol',
                status: 'Estado',
                lastLogin: 'Último Acceso',
                actions: 'Acciones'
            },
            modal: {
                title: 'Detalles del Usuario',
                close: 'Cerrar'
            },
            errors: {
                loadError: 'Error al cargar usuarios',
                saveError: 'Error al guardar usuario',
                deleteError: 'Error al eliminar usuario'
            }
        },
        companies: {
            title: 'Empresas',
            addCompany: 'Añadir Empresa',
            noCompanies: 'No hay empresas',
            totalCompanies: 'Total de Empresas',
            activeCompanies: 'Empresas Activas',
            table: {
                name: 'Nombre',
                nif: 'NIF',
                users: 'Usuarios',
                documents: 'Documentos',
                storage: 'Almacenamiento',
                status: 'Estado',
                actions: 'Acciones'
            },
            modal: {
                title: 'Detalles de la Empresa',
                close: 'Cerrar'
            },
            errors: {
                loadError: 'Error al cargar empresas',
                saveError: 'Error al guardar empresa',
                deleteError: 'Error al eliminar empresa'
            }
        }
    }
}
