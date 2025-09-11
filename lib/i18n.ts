export type Language = 'pt' | 'en' | 'fr'

export interface Translations {
    // Navbar
    navbar: {
        systemName: string
        logout: string
        userRole: string
    }

    // Sidebar
    sidebar: {
        title: string
        subtitle: string
        navigation: {
            dashboard: string
            invoices: string
            expenses: string
            payments: string
            clients: string
            suppliers: string
            documents: string
            banking: string
            vat: string
            saft: string
            reports: string
            aiAssistant: string
            cloudDrives: string
            webhooks: string
            admin: string
            profile: string
        }
        footer: {
            copyright: string
            version: string
        }
    }

    // Dashboard
    dashboard: {
        title: string
        subtitle: string
        lastUpdate: string
        whatsappFiles: string
        tryAgain: string
        errorLoading: string

        metrics: {
            invoices: {
                title: string
                subtitle: string
            }
            expenses: {
                title: string
                subtitle: string
            }
            documents: {
                title: string
                processed: string
                pending: string
            }
            clients: {
                title: string
                subtitle: string
            }
            totalRevenue: {
                title: string
                thisMonth: string
                subtitle: string
            }
            totalExpenses: {
                title: string
                thisMonth: string
                subtitle: string
            }
            netProfit: {
                title: string
                thisMonth: string
                subtitle: string
            }
            processingStatus: {
                title: string
                successRate: string
                processed: string
                pending: string
            }
            monthlySummary: {
                title: string
                monthlyRevenue: string
                monthlyExpenses: string
                monthlyProfit: string
            }
        }
    }

    // Invoices
    invoices: {
        title: string
        subtitle: string
        searchPlaceholder: string
        newInvoice: string
        export: string
        noInvoices: string
        totalInvoices: string
        totalValue: string

        table: {
            fileName: string
            nif: string
            vat: string
            total: string
            paymentType: string
            issueDate: string
            status: string
            actions: string
        }

        modal: {
            title: string
            submitLabel: string
            clientName: string
            clientEmail: string
            clientTaxId: string
            baseAmount: string
            vatRate: string
            description: string
            paymentType: string
            supplier: string
            summary: string
            autoCompleteHint: string
            clientFound: string
        }

        status: {
            paid: string
            sent: string
            draft: string
            overdue: string
        }

        paymentTypes: {
            bankTransfer: string
            card: string
            supplierCredit: string
        }

        errors: {
            clientNameRequired: string
            taxIdRequired: string
            amountRequired: string
            vatRateInvalid: string
            createError: string
            exportError: string
        }
    }

    // Expenses
    expenses: {
        title: string
        subtitle: string
        searchPlaceholder: string
        newExpense: string
        export: string
        noExpenses: string
        totalExpenses: string
        totalValue: string

        table: {
            vendor: string
            total: string
            vat: string
            category: string
            date: string
            deductible: string
            actions: string
        }

        modal: {
            title: string
            submitLabel: string
            vendor: string
            amount: string
            vatRate: string
            category: string
            receiptNumber: string
            description: string
        }

        vatRates: {
            exempt: string
            reduced: string
            intermediate: string
            normal: string
        }

        deductible: {
            yes: string
            no: string
        }

        errors: {
            vendorRequired: string
            amountRequired: string
            categoryRequired: string
            vatRateInvalid: string
            createError: string
            exportError: string
        }
    }

    // Payments
    payments: {
        title: string
        subtitle: string
        searchPlaceholder: string
        registerPayment: string
        export: string
        noPayments: string
        totalPayments: string
        totalValue: string
        loading: string

        metrics: {
            monthlyIncome: string
            pendingPayments: string
            collectionRate: string
        }

        table: {
            description: string
            amount: string
            type: string
            date: string
            reference: string
            status: string
            actions: string
        }

        modal: {
            title: string
            submitLabel: string
            paymentType: string
            method: string
            description: string
            amount: string
            reference: string
            notes: string
            summary: string
        }

        types: {
            income: string
            expense: string
        }

        methods: {
            transfer: string
            cash: string
            card: string
            check: string
        }

        status: {
            completed: string
            pending: string
            failed: string
        }

        errors: {
            descriptionRequired: string
            amountRequired: string
            typeInvalid: string
            methodInvalid: string
            createError: string
            exportError: string
        }
    }

    // Clients
    clients: {
        title: string
        subtitle: string
        searchPlaceholder: string
        newClient: string
        noClients: string
        totalClients: string
        clientsFound: string

        table: {
            client: string
            contact: string
            nif: string
            location: string
            created: string
        }

        modal: {
            title: string
            submitLabel: string
            name: string
            email: string
            phone: string
            taxId: string
            address: string
            postalCode: string
            city: string
        }

        errors: {
            nameRequired: string
            createError: string
        }
    }

    // Suppliers
    suppliers: {
        title: string
        subtitle: string
        newSupplier: string
        editSupplier: string
        listTitle: string
        searchPlaceholder: string
        noSuppliersFound: string
        noSuppliersRegistered: string
        tryAdjustingSearch: string
        startAddingSupplier: string
        addSupplier: string
        form: {
            companyName: string
            companyNameRequired: string
            companyNamePlaceholder: string
            taxId: string
            taxIdPlaceholder: string
            email: string
            emailPlaceholder: string
            phone: string
            phonePlaceholder: string
            address: string
            addressPlaceholder: string
            postalCode: string
            postalCodePlaceholder: string
            city: string
            cityPlaceholder: string
            contactPerson: string
            contactPersonPlaceholder: string
            paymentTerms: string
            paymentTermsPlaceholder: string
            notes: string
            notesPlaceholder: string
        }
        card: {
            taxId: string
            contact: string
            terms: string
        }
        validation: {
            nameRequired: string
            saveError: string
            deleteConfirm: string
            deleteError: string
        }
    }

    // Documents
    documents: {
        title: string
        subtitle: string
        newDocument: string
        searchPlaceholder: string
        export: string
        metrics: {
            totalDocuments: string
            pending: string
            completed: string
            failed: string
        }
        table: {
            status: string
            filename: string
            type: string
            size: string
            documentType: string
            uploadDate: string
            confidence: string
            actions: string
        }
        status: {
            completed: string
            processing: string
            pending: string
            failed: string
        }
        form: {
            filename: string
            filenameRequired: string
            filenamePlaceholder: string
            fileType: string
            fileTypeRequired: string
            fileSize: string
            fileSizeRequired: string
            fileSizePlaceholder: string
            documentType: string
            documentTypeRequired: string
            selectPlaceholder: string
            summary: string
            file: string
            type: string
            document: string
            size: string
        }
        fileTypes: {
            pdf: string
            doc: string
            docx: string
            jpg: string
            png: string
            txt: string
            xml: string
        }
        documentTypes: {
            invoice: string
            receipt: string
            contract: string
            report: string
            other: string
        }
        validation: {
            filenameRequired: string
            fileTypeRequired: string
            documentTypeRequired: string
            fileSizeValid: string
            createError: string
            deleteConfirm: string
            deleteError: string
            exportError: string
            noDocumentsToExport: string
        }
        loading: string
        noDocumentsFound: string
        totalDocuments: string
        processingProgress: string
    }

    // Banking
    banking: {
        title: string
        subtitle: string
        newTransaction: string
        searchPlaceholder: string
        export: string
        metrics: {
            currentBalance: string
            totalCredits: string
            totalDebits: string
            transactions: string
        }
        table: {
            type: string
            description: string
            amount: string
            date: string
            balance: string
            category: string
            actions: string
        }
        transactionTypes: {
            credit: string
            debit: string
            transfer: string
        }
        form: {
            transactionType: string
            transactionTypeRequired: string
            amount: string
            amountRequired: string
            amountPlaceholder: string
            description: string
            descriptionRequired: string
            descriptionPlaceholder: string
            category: string
            categoryRequired: string
            categoryPlaceholder: string
            reference: string
            referencePlaceholder: string
            summary: string
            type: string
            value: string
            newBalance: string
        }
        validation: {
            descriptionRequired: string
            amountValid: string
            categoryRequired: string
            createError: string
            exportError: string
            noTransactionsToExport: string
        }
        loading: string
        noTransactionsFound: string
        totalTransactions: string
        finalBalance: string
    }

    // VAT
    vat: {
        title: string
        subtitle: string
        newDeclaration: string
        metrics: {
            vatToPay: string
            currentPeriod: string
            vatCollected: string
            thisMonth: string
            vatPaid: string
            declarations: string
            thisYear: string
        }
        declarations: {
            title: string
            searchPlaceholder: string
            period: string
            sales: string
            purchases: string
            vatCollected: string
            vatPaid: string
            vatDue: string
            status: string
        }
        status: {
            paid: string
            pending: string
        }
        loading: string
    }

    // SAF-T
    saft: {
        title: string
        subtitle: string
        generateSaft: string
        metrics: {
            reportsGenerated: string
            totalRecords: string
            lastReport: string
            currentStatus: string
        }
        status: {
            updated: string
            completed: string
            processing: string
            pending: string
            error: string
            unknown: string
        }
        info: {
            title: string
            description: string
            periodicity: string
            format: string
            encoding: string
        }
        reports: {
            title: string
            period: string
            type: string
            generationDate: string
            records: string
            size: string
            status: string
            actions: string
        }
        requirements: {
            title: string
            companyData: string
            chartOfAccounts: string
            customersSuppliers: string
            productsServices: string
            salesDocuments: string
            purchaseDocuments: string
            accountingMovements: string
            xmlValidation: string
        }
    }

    // Reports
    reports: {
        title: string
        subtitle: string
        exportAll: string
        quickStats: {
            revenue: string
            expenses: string
            profit: string
            margin: string
        }
        reportTypes: {
            title: string
            financial: {
                name: string
                description: string
                generate: string
            }
            invoices: {
                name: string
                description: string
                generate: string
            }
            expenses: {
                name: string
                description: string
                generate: string
            }
            clients: {
                name: string
                description: string
                generate: string
            }
            vat: {
                name: string
                description: string
                generate: string
            }
            assets: {
                name: string
                description: string
                generate: string
            }
        }
        recentReports: {
            title: string
            searchPlaceholder: string
            name: string
            type: string
            date: string
            size: string
            format: string
            actions: string
        }
    }
}

export const translations: Record<Language, Translations> = {
    pt: {
        navbar: {
            systemName: 'Sistema de Contabilidade Português',
            logout: 'Sair',
            userRole: 'Função'
        },
        sidebar: {
            title: 'Contas-PT',
            subtitle: 'Sistema de Contabilidade',
            navigation: {
                dashboard: 'Dashboard',
                invoices: 'Faturas',
                expenses: 'Despesas',
                payments: 'Pagamentos',
                clients: 'Clientes',
                suppliers: 'Fornecedores',
                documents: 'Documentos',
                banking: 'Bancos',
                vat: 'IVA',
                saft: 'SAF-T',
                reports: 'Relatórios',
                aiAssistant: 'Assistente IA',
                cloudDrives: 'Drives na Nuvem',
                webhooks: 'Webhooks',
                admin: 'Admin',
                profile: 'Perfil'
            },
            footer: {
                copyright: '© 2025 Contas-PT',
                version: 'v2.0 - Next.js'
            }
        },
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Visão geral do seu negócio',
            lastUpdate: 'Última atualização',
            whatsappFiles: 'Archivos WhatsApp',
            tryAgain: 'Tentar novamente',
            errorLoading: 'Erro ao carregar dashboard',

            metrics: {
                invoices: {
                    title: 'Faturas',
                    subtitle: 'Total de faturas'
                },
                expenses: {
                    title: 'Despesas',
                    subtitle: 'Total de despesas'
                },
                documents: {
                    title: 'Documentos',
                    processed: 'processados',
                    pending: 'pendentes'
                },
                clients: {
                    title: 'Clientes',
                    subtitle: 'Total de clientes'
                },
                totalRevenue: {
                    title: 'Receita Total',
                    thisMonth: 'Este mês',
                    subtitle: 'Todas as faturas pagas'
                },
                totalExpenses: {
                    title: 'Despesas Total',
                    thisMonth: 'Este mês',
                    subtitle: 'Todas as despesas'
                },
                netProfit: {
                    title: 'Lucro Líquido',
                    thisMonth: 'Este mês',
                    subtitle: 'Receita - Despesas'
                },
                processingStatus: {
                    title: 'Status de Processamento',
                    successRate: 'Taxa de Sucesso',
                    processed: 'processados',
                    pending: 'pendentes'
                },
                monthlySummary: {
                    title: 'Resumo Mensal',
                    monthlyRevenue: 'Receita do Mês',
                    monthlyExpenses: 'Despesas do Mês',
                    monthlyProfit: 'Lucro do Mês'
                }
            }
        },

        // Invoices
        invoices: {
            title: 'Faturas',
            subtitle: 'Gestão e emissão de faturas',
            searchPlaceholder: 'Procurar faturas...',
            newInvoice: 'Nova Fatura',
            export: 'Exportar',
            noInvoices: 'Nenhuma fatura encontrada',
            totalInvoices: 'Total',
            totalValue: 'Valor Total',

            table: {
                fileName: 'Nombre del archivo',
                nif: 'NIF',
                vat: 'IVA',
                total: 'Total',
                paymentType: 'Tipo Pagamento',
                issueDate: 'Data Emissão',
                status: 'Estado',
                actions: 'Ações'
            },

            modal: {
                title: 'Nova Fatura',
                submitLabel: 'Criar Fatura',
                clientName: 'Nome do Cliente',
                clientEmail: 'Email do Cliente',
                clientTaxId: 'NIF do Cliente',
                baseAmount: 'Valor Base (€)',
                vatRate: 'Taxa de IVA (%)',
                description: 'Descrição da Fatura',
                paymentType: 'Tipo de Pagamento',
                supplier: 'Fornecedor',
                summary: 'Resumo da Fatura',
                autoCompleteHint: 'Digite o nome para auto-completar os dados',
                clientFound: 'Cliente encontrado'
            },

            status: {
                paid: 'Pago',
                sent: 'Enviado',
                draft: 'Rascunho',
                overdue: 'Vencido'
            },

            paymentTypes: {
                bankTransfer: 'Transferência Bancária',
                card: 'Cartão',
                supplierCredit: 'Crédito de Fornecedor'
            },

            errors: {
                clientNameRequired: 'Nome do cliente é obrigatório',
                taxIdRequired: 'NIF do cliente é obrigatório',
                amountRequired: 'Valor deve ser um número válido',
                vatRateInvalid: 'Taxa de IVA inválida. Use 6, 13 ou 23',
                createError: 'Erro ao criar fatura',
                exportError: 'Não há faturas para exportar'
            }
        },

        // Expenses
        expenses: {
            title: 'Despesas',
            subtitle: 'Gestão e controlo de despesas',
            searchPlaceholder: 'Procurar despesas...',
            newExpense: 'Nova Despesa',
            export: 'Exportar',
            noExpenses: 'Nenhuma despesa encontrada',
            totalExpenses: 'Total',
            totalValue: 'Valor Total',

            table: {
                vendor: 'Fornecedor',
                total: 'Total',
                vat: 'IVA',
                category: 'Categoria',
                date: 'Data',
                deductible: 'Dedutível',
                actions: 'Ações'
            },

            modal: {
                title: 'Nova Despesa',
                submitLabel: 'Criar Despesa',
                vendor: 'Nome do Fornecedor',
                amount: 'Valor (€)',
                vatRate: 'Taxa de IVA',
                category: 'Categoria',
                receiptNumber: 'Número do Recibo',
                description: 'Descrição'
            },

            vatRates: {
                exempt: '0% (Isento)',
                reduced: '6% (Reduzida)',
                intermediate: '13% (Intermédia)',
                normal: '23% (Normal)'
            },

            deductible: {
                yes: 'Sim',
                no: 'Não'
            },

            errors: {
                vendorRequired: 'Nome do fornecedor é obrigatório',
                amountRequired: 'Valor deve ser um número válido',
                categoryRequired: 'Categoria é obrigatória',
                vatRateInvalid: 'Taxa de IVA inválida. Use 0, 6, 13 ou 23',
                createError: 'Erro ao criar despesa',
                exportError: 'Não há despesas para exportar'
            }
        },

        // Payments
        payments: {
            title: 'Pagamentos',
            subtitle: 'Gestão de pagamentos e recebimentos',
            searchPlaceholder: 'Procurar pagamentos...',
            registerPayment: 'Registar Pagamento',
            export: 'Exportar',
            noPayments: 'Nenhum pagamento registado',
            totalPayments: 'Total',
            totalValue: 'Valor Total',
            loading: 'Carregando...',

            metrics: {
                monthlyIncome: 'Recebimentos do Mês',
                pendingPayments: 'Pagamentos Pendentes',
                collectionRate: 'Taxa de Recebimento'
            },

            table: {
                description: 'Descrição',
                amount: 'Valor',
                type: 'Tipo',
                date: 'Data',
                reference: 'Referência',
                status: 'Estado',
                actions: 'Ações'
            },

            modal: {
                title: 'Registar Pagamento',
                submitLabel: 'Registar',
                paymentType: 'Tipo de Pagamento',
                method: 'Método de Pagamento',
                description: 'Descrição',
                amount: 'Valor (€)',
                reference: 'Referência',
                notes: 'Notas',
                summary: 'Resumo'
            },

            types: {
                income: 'Recebimento',
                expense: 'Pagamento'
            },

            methods: {
                transfer: 'Transferência',
                cash: 'Dinheiro',
                card: 'Cartão',
                check: 'Cheque'
            },

            status: {
                completed: 'Completado',
                pending: 'Pendente',
                failed: 'Falhado'
            },

            errors: {
                descriptionRequired: 'Descrição é obrigatória',
                amountRequired: 'Valor deve ser um número válido',
                typeInvalid: 'Tipo de pagamento inválido',
                methodInvalid: 'Método de pagamento inválido',
                createError: 'Erro ao registar pagamento',
                exportError: 'Não há pagamentos para exportar'
            }
        },

        // Clients
        clients: {
            title: 'Clientes',
            subtitle: 'Gerir informações dos clientes',
            searchPlaceholder: 'Pesquisar clientes...',
            newClient: 'Novo Cliente',
            noClients: 'Nenhum cliente encontrado',
            totalClients: 'Total',
            clientsFound: 'cliente(s) encontrado(s)',

            table: {
                client: 'Cliente',
                contact: 'Contacto',
                nif: 'NIF',
                location: 'Localização',
                created: 'Criado'
            },

            modal: {
                title: 'Novo Cliente',
                submitLabel: 'Criar Cliente',
                name: 'Nome',
                email: 'Email',
                phone: 'Telefone',
                taxId: 'NIF',
                address: 'Morada',
                postalCode: 'Código Postal',
                city: 'Cidade'
            },

            errors: {
                nameRequired: 'Nome é obrigatório',
                createError: 'Erro ao criar cliente'
            }
        },

        // Suppliers
        suppliers: {
            title: 'Fornecedores',
            subtitle: 'Gerir informações dos fornecedores',
            newSupplier: 'Novo Fornecedor',
            editSupplier: 'Editar Fornecedor',
            listTitle: 'Lista de Fornecedores',
            searchPlaceholder: 'Pesquisar fornecedores...',
            noSuppliersFound: 'Nenhum fornecedor encontrado',
            noSuppliersRegistered: 'Nenhum fornecedor registado',
            tryAdjustingSearch: 'Tente ajustar os termos de pesquisa',
            startAddingSupplier: 'Comece por adicionar o seu primeiro fornecedor',
            addSupplier: 'Adicionar Fornecedor',
            form: {
                companyName: 'Nome da Empresa',
                companyNameRequired: 'Nome da Empresa *',
                companyNamePlaceholder: 'Nome da empresa',
                taxId: 'NIF',
                taxIdPlaceholder: 'Número de identificação fiscal',
                email: 'Email',
                emailPlaceholder: 'email@empresa.com',
                phone: 'Telefone',
                phonePlaceholder: '+351 123 456 789',
                address: 'Morada',
                addressPlaceholder: 'Rua, número, andar',
                postalCode: 'Código Postal',
                postalCodePlaceholder: '1234-567',
                city: 'Cidade',
                cityPlaceholder: 'Lisboa',
                contactPerson: 'Pessoa de Contacto',
                contactPersonPlaceholder: 'Nome da pessoa de contacto',
                paymentTerms: 'Termos de Pagamento',
                paymentTermsPlaceholder: 'Ex: 30 dias',
                notes: 'Notas',
                notesPlaceholder: 'Notas adicionais sobre o fornecedor'
            },
            card: {
                taxId: 'NIF',
                contact: 'Contacto',
                terms: 'Termos'
            },
            validation: {
                nameRequired: 'Nome é obrigatório',
                saveError: 'Erro ao salvar fornecedor',
                deleteConfirm: 'Tem certeza de que deseja eliminar este fornecedor?',
                deleteError: 'Erro ao eliminar fornecedor'
            }
        },

        // Documents
        documents: {
            title: 'Documentos',
            subtitle: 'Gestão de documentos e arquivos',
            newDocument: 'Novo Documento',
            searchPlaceholder: 'Procurar documentos...',
            export: 'Exportar',
            metrics: {
                totalDocuments: 'Total Documentos',
                pending: 'Pendentes',
                completed: 'Completados',
                failed: 'Falharam'
            },
            table: {
                status: 'Status',
                filename: 'Nome do Arquivo',
                type: 'Tipo',
                size: 'Tamanho',
                documentType: 'Tipo de Documento',
                uploadDate: 'Data de Upload',
                confidence: 'Confiança',
                actions: 'Ações'
            },
            status: {
                completed: 'Completado',
                processing: 'Processando',
                pending: 'Pendente',
                failed: 'Falhou'
            },
            form: {
                filename: 'Nome do Arquivo',
                filenameRequired: 'Nome do Arquivo *',
                filenamePlaceholder: 'exemplo.pdf',
                fileType: 'Tipo de Arquivo',
                fileTypeRequired: 'Tipo de Arquivo *',
                fileSize: 'Tamanho (bytes)',
                fileSizeRequired: 'Tamanho (bytes) *',
                fileSizePlaceholder: '1024',
                documentType: 'Tipo de Documento',
                documentTypeRequired: 'Tipo de Documento *',
                selectPlaceholder: 'Selecione...',
                summary: 'Resumo',
                file: 'Arquivo',
                type: 'Tipo',
                document: 'Documento',
                size: 'Tamanho'
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
                invoice: 'Fatura',
                receipt: 'Recibo',
                contract: 'Contrato',
                report: 'Relatório',
                other: 'Outro'
            },
            validation: {
                filenameRequired: 'Nome do arquivo é obrigatório',
                fileTypeRequired: 'Tipo de arquivo é obrigatório',
                documentTypeRequired: 'Tipo de documento é obrigatório',
                fileSizeValid: 'Tamanho do arquivo deve ser um número válido',
                createError: 'Erro ao criar documento',
                deleteConfirm: 'Tem certeza que deseja excluir este documento?',
                deleteError: 'Erro ao excluir documento',
                exportError: 'Erro ao exportar documentos',
                noDocumentsToExport: 'Não há documentos para exportar'
            },
            loading: 'Carregando...',
            noDocumentsFound: 'Nenhum documento encontrado',
            totalDocuments: 'Total',
            processingProgress: 'Processamento'
        },

        // Banking
        banking: {
            title: 'Bancário',
            subtitle: 'Gestão de transações bancárias',
            newTransaction: 'Nova Transação',
            searchPlaceholder: 'Procurar transações...',
            export: 'Exportar',
            metrics: {
                currentBalance: 'Saldo Atual',
                totalCredits: 'Total Créditos',
                totalDebits: 'Total Débitos',
                transactions: 'Transações'
            },
            table: {
                type: 'Tipo',
                description: 'Descrição',
                amount: 'Valor',
                date: 'Data',
                balance: 'Saldo',
                category: 'Categoria',
                actions: 'Ações'
            },
            transactionTypes: {
                credit: 'Crédito',
                debit: 'Débito',
                transfer: 'Transferência'
            },
            form: {
                transactionType: 'Tipo de Transação',
                transactionTypeRequired: 'Tipo de Transação *',
                amount: 'Valor (€)',
                amountRequired: 'Valor (€) *',
                amountPlaceholder: '0.00',
                description: 'Descrição',
                descriptionRequired: 'Descrição *',
                descriptionPlaceholder: 'Descrição da transação',
                category: 'Categoria',
                categoryRequired: 'Categoria *',
                categoryPlaceholder: 'Ex: Receitas, Despesas, Serviços',
                reference: 'Referência',
                referencePlaceholder: 'Referência (opcional)',
                summary: 'Resumo',
                type: 'Tipo',
                value: 'Valor',
                newBalance: 'Novo Saldo'
            },
            validation: {
                descriptionRequired: 'Descrição é obrigatória',
                amountValid: 'Valor deve ser um número válido',
                categoryRequired: 'Categoria é obrigatória',
                createError: 'Erro ao criar transação bancária',
                exportError: 'Erro ao exportar transações bancárias',
                noTransactionsToExport: 'Não há transações para exportar'
            },
            loading: 'Carregando...',
            noTransactionsFound: 'Nenhuma transação encontrada',
            totalTransactions: 'Total',
            finalBalance: 'Saldo Final'
        },

        // VAT
        vat: {
            title: 'IVA',
            subtitle: 'Gestão de declarações e pagamentos de IVA',
            newDeclaration: 'Nova Declaração',
            metrics: {
                vatToPay: 'IVA a Pagar',
                currentPeriod: 'Período atual',
                vatCollected: 'IVA Cobrado',
                thisMonth: 'Este mês',
                vatPaid: 'IVA Pago',
                declarations: 'Declarações',
                thisYear: 'Este ano'
            },
            declarations: {
                title: 'Declarações de IVA',
                searchPlaceholder: 'Pesquisar declarações...',
                period: 'Período',
                sales: 'Vendas',
                purchases: 'Compras',
                vatCollected: 'IVA Cobrado',
                vatPaid: 'IVA Pago',
                vatDue: 'IVA Devido',
                status: 'Estado'
            },
            status: {
                paid: 'Pago',
                pending: 'Pendente'
            },
            loading: 'Carregando...'
        },

        // SAF-T
        saft: {
            title: 'SAF-T',
            subtitle: 'Standard Audit File for Tax - Ficheiro normalizado de auditoria fiscal',
            generateSaft: 'Gerar SAFT',
            metrics: {
                reportsGenerated: 'Relatórios Gerados',
                totalRecords: 'Registos Totais',
                lastReport: 'Último Relatório',
                currentStatus: 'Estado Atual'
            },
            status: {
                updated: 'Atualizado',
                completed: 'Concluído',
                processing: 'Processando',
                pending: 'Pendente',
                error: 'Erro',
                unknown: 'Desconhecido'
            },
            info: {
                title: 'Sobre SAF-T (PT)',
                description: 'O SAF-T (PT) é um ficheiro normalizado de auditoria fiscal exigido pela Autoridade Tributária portuguesa. Contém toda a informação contabilística e fiscal da empresa num formato XML estruturado, facilitando as auditorias e verificações fiscais.',
                periodicity: 'Anual',
                format: 'XML',
                encoding: 'UTF-8'
            },
            reports: {
                title: 'Relatórios SAF-T',
                period: 'Período',
                type: 'Tipo',
                generationDate: 'Data Geração',
                records: 'Registos',
                size: 'Tamanho',
                status: 'Estado',
                actions: 'Ações'
            },
            requirements: {
                title: 'Requisitos SAF-T',
                companyData: 'Dados de identificação da empresa',
                chartOfAccounts: 'Tabela de contas (Plano Oficial de Contabilidade)',
                customersSuppliers: 'Clientes e fornecedores',
                productsServices: 'Produtos e serviços',
                salesDocuments: 'Documentos de venda (faturas, recibos)',
                purchaseDocuments: 'Documentos de compra',
                accountingMovements: 'Movimentos contabilísticos',
                xmlValidation: 'Validação XML (Schema XSD)'
            }
        },

        // Reports
        reports: {
            title: 'Relatórios',
            subtitle: 'Análises e relatórios financeiros',
            exportAll: 'Exportar Tudo',
            quickStats: {
                revenue: 'Receitas',
                expenses: 'Despesas',
                profit: 'Lucro',
                margin: 'Margem'
            },
            reportTypes: {
                title: 'Tipos de Relatório',
                financial: {
                    name: 'Relatório Financeiro',
                    description: 'Receitas, despesas and lucros',
                    generate: 'Gerar'
                },
                invoices: {
                    name: 'Relatório de Faturas',
                    description: 'Faturas emitidas e recebidas',
                    generate: 'Gerar'
                },
                expenses: {
                    name: 'Relatório de Despesas',
                    description: 'Análise de gastos por categoria',
                    generate: 'Gerar'
                },
                clients: {
                    name: 'Relatório de Clientes',
                    description: 'Performance de clientes',
                    generate: 'Gerar'
                },
                vat: {
                    name: 'Relatório de IVA',
                    description: 'Resumo de IVA a pagar/receber',
                    generate: 'Gerar'
                },
                assets: {
                    name: 'Relatório de Ativos',
                    description: 'Inventário e depreciação',
                    generate: 'Gerar'
                }
            },
            recentReports: {
                title: 'Relatórios Recentes',
                searchPlaceholder: 'Pesquisar relatórios...',
                name: 'Nome',
                type: 'Tipo',
                date: 'Data',
                size: 'Tamanho',
                format: 'Formato',
                actions: 'Ações'
            }
        }
    },

    en: {
        navbar: {
            systemName: 'Portuguese Accounting System',
            logout: 'Logout',
            userRole: 'Role'
        },
        sidebar: {
            title: 'Contas-PT',
            subtitle: 'Accounting System',
            navigation: {
                dashboard: 'Dashboard',
                invoices: 'Invoices',
                expenses: 'Expenses',
                payments: 'Payments',
                clients: 'Clients',
                suppliers: 'Suppliers',
                documents: 'Documents',
                banking: 'Banking',
                vat: 'VAT',
                saft: 'SAF-T',
                reports: 'Reports',
                aiAssistant: 'AI Assistant',
                cloudDrives: 'Cloud Drives',
                webhooks: 'Webhooks',
                admin: 'Admin',
                profile: 'Profile'
            },
            footer: {
                copyright: '© 2025 Contas-PT',
                version: 'v2.0 - Next.js'
            }
        },
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Overview of your business',
            lastUpdate: 'Last update',
            whatsappFiles: 'WhatsApp Files',
            tryAgain: 'Try again',
            errorLoading: 'Error loading dashboard',

            metrics: {
                invoices: {
                    title: 'Invoices',
                    subtitle: 'Total invoices'
                },
                expenses: {
                    title: 'Expenses',
                    subtitle: 'Total expenses'
                },
                documents: {
                    title: 'Documents',
                    processed: 'processed',
                    pending: 'pending'
                },
                clients: {
                    title: 'Clients',
                    subtitle: 'Total clients'
                },
                totalRevenue: {
                    title: 'Total Revenue',
                    thisMonth: 'This month',
                    subtitle: 'All paid invoices'
                },
                totalExpenses: {
                    title: 'Total Expenses',
                    thisMonth: 'This month',
                    subtitle: 'All expenses'
                },
                netProfit: {
                    title: 'Net Profit',
                    thisMonth: 'This month',
                    subtitle: 'Revenue - Expenses'
                },
                processingStatus: {
                    title: 'Processing Status',
                    successRate: 'Success Rate',
                    processed: 'processed',
                    pending: 'pending'
                },
                monthlySummary: {
                    title: 'Monthly Summary',
                    monthlyRevenue: 'Monthly Revenue',
                    monthlyExpenses: 'Monthly Expenses',
                    monthlyProfit: 'Monthly Profit'
                }
            }
        },

        // Invoices
        invoices: {
            title: 'Invoices',
            subtitle: 'Invoice management and issuance',
            searchPlaceholder: 'Search invoices...',
            newInvoice: 'New Invoice',
            export: 'Export',
            noInvoices: 'No invoices found',
            totalInvoices: 'Total',
            totalValue: 'Total Value',

            table: {
                fileName: 'File Name',
                nif: 'NIF',
                vat: 'VAT',
                total: 'Total',
                paymentType: 'Payment Type',
                issueDate: 'Issue Date',
                status: 'Status',
                actions: 'Actions'
            },

            modal: {
                title: 'New Invoice',
                submitLabel: 'Create Invoice',
                clientName: 'Client Name',
                clientEmail: 'Client Email',
                clientTaxId: 'Client NIF',
                baseAmount: 'Base Amount (€)',
                vatRate: 'VAT Rate (%)',
                description: 'Invoice Description',
                paymentType: 'Payment Type',
                supplier: 'Supplier',
                summary: 'Invoice Summary',
                autoCompleteHint: 'Type name to auto-complete data',
                clientFound: 'Client found'
            },

            status: {
                paid: 'Paid',
                sent: 'Sent',
                draft: 'Draft',
                overdue: 'Overdue'
            },

            paymentTypes: {
                bankTransfer: 'Bank Transfer',
                card: 'Card',
                supplierCredit: 'Supplier Credit'
            },

            errors: {
                clientNameRequired: 'Client name is required',
                taxIdRequired: 'Client NIF is required',
                amountRequired: 'Amount must be a valid number',
                vatRateInvalid: 'Invalid VAT rate. Use 6, 13 or 23',
                createError: 'Error creating invoice',
                exportError: 'No invoices to export'
            }
        },

        // Expenses
        expenses: {
            title: 'Expenses',
            subtitle: 'Expense management and control',
            searchPlaceholder: 'Search expenses...',
            newExpense: 'New Expense',
            export: 'Export',
            noExpenses: 'No expenses found',
            totalExpenses: 'Total',
            totalValue: 'Total Value',

            table: {
                vendor: 'Vendor',
                total: 'Total',
                vat: 'VAT',
                category: 'Category',
                date: 'Date',
                deductible: 'Deductible',
                actions: 'Actions'
            },

            modal: {
                title: 'New Expense',
                submitLabel: 'Create Expense',
                vendor: 'Vendor Name',
                amount: 'Amount (€)',
                vatRate: 'VAT Rate',
                category: 'Category',
                receiptNumber: 'Receipt Number',
                description: 'Description'
            },

            vatRates: {
                exempt: '0% (Exempt)',
                reduced: '6% (Reduced)',
                intermediate: '13% (Intermediate)',
                normal: '23% (Normal)'
            },

            deductible: {
                yes: 'Yes',
                no: 'No'
            },

            errors: {
                vendorRequired: 'Vendor name is required',
                amountRequired: 'Amount must be a valid number',
                categoryRequired: 'Category is required',
                vatRateInvalid: 'Invalid VAT rate. Use 0, 6, 13 or 23',
                createError: 'Error creating expense',
                exportError: 'No expenses to export'
            }
        },

        // Payments
        payments: {
            title: 'Payments',
            subtitle: 'Payment and receipt management',
            searchPlaceholder: 'Search payments...',
            registerPayment: 'Register Payment',
            export: 'Export',
            noPayments: 'No payments registered',
            totalPayments: 'Total',
            totalValue: 'Total Value',
            loading: 'Loading...',

            metrics: {
                monthlyIncome: 'Monthly Income',
                pendingPayments: 'Pending Payments',
                collectionRate: 'Collection Rate'
            },

            table: {
                description: 'Description',
                amount: 'Amount',
                type: 'Type',
                date: 'Date',
                reference: 'Reference',
                status: 'Status',
                actions: 'Actions'
            },

            modal: {
                title: 'Register Payment',
                submitLabel: 'Register',
                paymentType: 'Payment Type',
                method: 'Payment Method',
                description: 'Description',
                amount: 'Amount (€)',
                reference: 'Reference',
                notes: 'Notes',
                summary: 'Summary'
            },

            types: {
                income: 'Income',
                expense: 'Expense'
            },

            methods: {
                transfer: 'Transfer',
                cash: 'Cash',
                card: 'Card',
                check: 'Check'
            },

            status: {
                completed: 'Completed',
                pending: 'Pending',
                failed: 'Failed'
            },

            errors: {
                descriptionRequired: 'Description is required',
                amountRequired: 'Amount must be a valid number',
                typeInvalid: 'Invalid payment type',
                methodInvalid: 'Invalid payment method',
                createError: 'Error registering payment',
                exportError: 'No payments to export'
            }
        },

        // Clients
        clients: {
            title: 'Clients',
            subtitle: 'Manage client information',
            searchPlaceholder: 'Search clients...',
            newClient: 'New Client',
            noClients: 'No clients found',
            totalClients: 'Total',
            clientsFound: 'client(s) found',

            table: {
                client: 'Client',
                contact: 'Contact',
                nif: 'NIF',
                location: 'Location',
                created: 'Created'
            },

            modal: {
                title: 'New Client',
                submitLabel: 'Create Client',
                name: 'Name',
                email: 'Email',
                phone: 'Phone',
                taxId: 'NIF',
                address: 'Address',
                postalCode: 'Postal Code',
                city: 'City'
            },

            errors: {
                nameRequired: 'Name is required',
                createError: 'Error creating client'
            }
        },

        // Suppliers
        suppliers: {
            title: 'Suppliers',
            subtitle: 'Manage supplier information',
            newSupplier: 'New Supplier',
            editSupplier: 'Edit Supplier',
            listTitle: 'Suppliers List',
            searchPlaceholder: 'Search suppliers...',
            noSuppliersFound: 'No suppliers found',
            noSuppliersRegistered: 'No suppliers registered',
            tryAdjustingSearch: 'Try adjusting search terms',
            startAddingSupplier: 'Start by adding your first supplier',
            addSupplier: 'Add Supplier',
            form: {
                companyName: 'Company Name',
                companyNameRequired: 'Company Name *',
                companyNamePlaceholder: 'Company name',
                taxId: 'Tax ID',
                taxIdPlaceholder: 'Tax identification number',
                email: 'Email',
                emailPlaceholder: 'email@company.com',
                phone: 'Phone',
                phonePlaceholder: '+351 123 456 789',
                address: 'Address',
                addressPlaceholder: 'Street, number, floor',
                postalCode: 'Postal Code',
                postalCodePlaceholder: '1234-567',
                city: 'City',
                cityPlaceholder: 'Lisbon',
                contactPerson: 'Contact Person',
                contactPersonPlaceholder: 'Contact person name',
                paymentTerms: 'Payment Terms',
                paymentTermsPlaceholder: 'Ex: 30 days',
                notes: 'Notes',
                notesPlaceholder: 'Additional notes about the supplier'
            },
            card: {
                taxId: 'Tax ID',
                contact: 'Contact',
                terms: 'Terms'
            },
            validation: {
                nameRequired: 'Name is required',
                saveError: 'Error saving supplier',
                deleteConfirm: 'Are you sure you want to delete this supplier?',
                deleteError: 'Error deleting supplier'
            }
        },

        // Documents
        documents: {
            title: 'Documents',
            subtitle: 'Document and file management',
            newDocument: 'New Document',
            searchPlaceholder: 'Search documents...',
            export: 'Export',
            metrics: {
                totalDocuments: 'Total Documents',
                pending: 'Pending',
                completed: 'Completed',
                failed: 'Failed'
            },
            table: {
                status: 'Status',
                filename: 'Filename',
                type: 'Type',
                size: 'Size',
                documentType: 'Document Type',
                uploadDate: 'Upload Date',
                confidence: 'Confidence',
                actions: 'Actions'
            },
            status: {
                completed: 'Completed',
                processing: 'Processing',
                pending: 'Pending',
                failed: 'Failed'
            },
            form: {
                filename: 'Filename',
                filenameRequired: 'Filename *',
                filenamePlaceholder: 'example.pdf',
                fileType: 'File Type',
                fileTypeRequired: 'File Type *',
                fileSize: 'Size (bytes)',
                fileSizeRequired: 'Size (bytes) *',
                fileSizePlaceholder: '1024',
                documentType: 'Document Type',
                documentTypeRequired: 'Document Type *',
                selectPlaceholder: 'Select...',
                summary: 'Summary',
                file: 'File',
                type: 'Type',
                document: 'Document',
                size: 'Size'
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
                invoice: 'Invoice',
                receipt: 'Receipt',
                contract: 'Contract',
                report: 'Report',
                other: 'Other'
            },
            validation: {
                filenameRequired: 'Filename is required',
                fileTypeRequired: 'File type is required',
                documentTypeRequired: 'Document type is required',
                fileSizeValid: 'File size must be a valid number',
                createError: 'Error creating document',
                deleteConfirm: 'Are you sure you want to delete this document?',
                deleteError: 'Error deleting document',
                exportError: 'Error exporting documents',
                noDocumentsToExport: 'No documents to export'
            },
            loading: 'Loading...',
            noDocumentsFound: 'No documents found',
            totalDocuments: 'Total',
            processingProgress: 'Processing'
        },

        // Banking
        banking: {
            title: 'Banking',
            subtitle: 'Banking transaction management',
            newTransaction: 'New Transaction',
            searchPlaceholder: 'Search transactions...',
            export: 'Export',
            metrics: {
                currentBalance: 'Current Balance',
                totalCredits: 'Total Credits',
                totalDebits: 'Total Debits',
                transactions: 'Transactions'
            },
            table: {
                type: 'Type',
                description: 'Description',
                amount: 'Amount',
                date: 'Date',
                balance: 'Balance',
                category: 'Category',
                actions: 'Actions'
            },
            transactionTypes: {
                credit: 'Credit',
                debit: 'Debit',
                transfer: 'Transfer'
            },
            form: {
                transactionType: 'Transaction Type',
                transactionTypeRequired: 'Transaction Type *',
                amount: 'Amount (€)',
                amountRequired: 'Amount (€) *',
                amountPlaceholder: '0.00',
                description: 'Description',
                descriptionRequired: 'Description *',
                descriptionPlaceholder: 'Transaction description',
                category: 'Category',
                categoryRequired: 'Category *',
                categoryPlaceholder: 'Ex: Revenue, Expenses, Services',
                reference: 'Reference',
                referencePlaceholder: 'Reference (optional)',
                summary: 'Summary',
                type: 'Type',
                value: 'Value',
                newBalance: 'New Balance'
            },
            validation: {
                descriptionRequired: 'Description is required',
                amountValid: 'Amount must be a valid number',
                categoryRequired: 'Category is required',
                createError: 'Error creating banking transaction',
                exportError: 'Error exporting banking transactions',
                noTransactionsToExport: 'No transactions to export'
            },
            loading: 'Loading...',
            noTransactionsFound: 'No transactions found',
            totalTransactions: 'Total',
            finalBalance: 'Final Balance'
        },

        // VAT
        vat: {
            title: 'VAT',
            subtitle: 'VAT declarations and payment management',
            newDeclaration: 'New Declaration',
            metrics: {
                vatToPay: 'VAT to Pay',
                currentPeriod: 'Current period',
                vatCollected: 'VAT Collected',
                thisMonth: 'This month',
                vatPaid: 'VAT Paid',
                declarations: 'Declarations',
                thisYear: 'This year'
            },
            declarations: {
                title: 'VAT Declarations',
                searchPlaceholder: 'Search declarations...',
                period: 'Period',
                sales: 'Sales',
                purchases: 'Purchases',
                vatCollected: 'VAT Collected',
                vatPaid: 'VAT Paid',
                vatDue: 'VAT Due',
                status: 'Status'
            },
            status: {
                paid: 'Paid',
                pending: 'Pending'
            },
            loading: 'Loading...'
        },

        // SAF-T
        saft: {
            title: 'SAF-T',
            subtitle: 'Standard Audit File for Tax - Standardized tax audit file',
            generateSaft: 'Generate SAF-T',
            metrics: {
                reportsGenerated: 'Reports Generated',
                totalRecords: 'Total Records',
                lastReport: 'Last Report',
                currentStatus: 'Current Status'
            },
            status: {
                updated: 'Updated',
                completed: 'Completed',
                processing: 'Processing',
                pending: 'Pending',
                error: 'Error',
                unknown: 'Unknown'
            },
            info: {
                title: 'About SAF-T (PT)',
                description: 'SAF-T (PT) is a standardized tax audit file required by the Portuguese Tax Authority. It contains all accounting and tax information of the company in a structured XML format, facilitating tax audits and verifications.',
                periodicity: 'Annual',
                format: 'XML',
                encoding: 'UTF-8'
            },
            reports: {
                title: 'SAF-T Reports',
                period: 'Period',
                type: 'Type',
                generationDate: 'Generation Date',
                records: 'Records',
                size: 'Size',
                status: 'Status',
                actions: 'Actions'
            },
            requirements: {
                title: 'SAF-T Requirements',
                companyData: 'Company identification data',
                chartOfAccounts: 'Chart of accounts (Official Accounting Plan)',
                customersSuppliers: 'Customers and suppliers',
                productsServices: 'Products and services',
                salesDocuments: 'Sales documents (invoices, receipts)',
                purchaseDocuments: 'Purchase documents',
                accountingMovements: 'Accounting movements',
                xmlValidation: 'XML validation (XSD Schema)'
            }
        },

        // Reports
        reports: {
            title: 'Reports',
            subtitle: 'Financial analysis and reports',
            exportAll: 'Export All',
            quickStats: {
                revenue: 'Revenue',
                expenses: 'Expenses',
                profit: 'Profit',
                margin: 'Margin'
            },
            reportTypes: {
                title: 'Report Types',
                financial: {
                    name: 'Financial Report',
                    description: 'Revenue, expenses and profits',
                    generate: 'Generate'
                },
                invoices: {
                    name: 'Invoice Report',
                    description: 'Issued and received invoices',
                    generate: 'Generate'
                },
                expenses: {
                    name: 'Expense Report',
                    description: 'Spending analysis by category',
                    generate: 'Generate'
                },
                clients: {
                    name: 'Client Report',
                    description: 'Client performance',
                    generate: 'Generate'
                },
                vat: {
                    name: 'VAT Report',
                    description: 'VAT to pay/receive summary',
                    generate: 'Generate'
                },
                assets: {
                    name: 'Assets Report',
                    description: 'Inventory and depreciation',
                    generate: 'Generate'
                }
            },
            recentReports: {
                title: 'Recent Reports',
                searchPlaceholder: 'Search reports...',
                name: 'Name',
                type: 'Type',
                date: 'Date',
                size: 'Size',
                format: 'Format',
                actions: 'Actions'
            }
        }
    },

    fr: {
        navbar: {
            systemName: 'Système de Comptabilité Portugais',
            logout: 'Déconnexion',
            userRole: 'Rôle'
        },
        sidebar: {
            title: 'Contas-PT',
            subtitle: 'Système de Comptabilité',
            navigation: {
                dashboard: 'Tableau de bord',
                invoices: 'Factures',
                expenses: 'Dépenses',
                payments: 'Paiements',
                clients: 'Clients',
                suppliers: 'Fournisseurs',
                documents: 'Documents',
                banking: 'Banque',
                vat: 'TVA',
                saft: 'SAF-T',
                reports: 'Rapports',
                aiAssistant: 'Assistant IA',
                cloudDrives: 'Disques Cloud',
                webhooks: 'Webhooks',
                admin: 'Admin',
                profile: 'Profil'
            },
            footer: {
                copyright: '© 2025 Contas-PT',
                version: 'v2.0 - Next.js'
            }
        },
        dashboard: {
            title: 'Tableau de bord',
            subtitle: 'Aperçu de votre entreprise',
            lastUpdate: 'Dernière mise à jour',
            whatsappFiles: 'Fichiers WhatsApp',
            tryAgain: 'Réessayer',
            errorLoading: 'Erreur lors du chargement du tableau de bord',

            metrics: {
                invoices: {
                    title: 'Factures',
                    subtitle: 'Total des factures'
                },
                expenses: {
                    title: 'Dépenses',
                    subtitle: 'Total des dépenses'
                },
                documents: {
                    title: 'Documents',
                    processed: 'traités',
                    pending: 'en attente'
                },
                clients: {
                    title: 'Clients',
                    subtitle: 'Total des clients'
                },
                totalRevenue: {
                    title: 'Revenus Totaux',
                    thisMonth: 'Ce mois',
                    subtitle: 'Toutes les factures payées'
                },
                totalExpenses: {
                    title: 'Dépenses Totales',
                    thisMonth: 'Ce mois',
                    subtitle: 'Toutes les dépenses'
                },
                netProfit: {
                    title: 'Bénéfice Net',
                    thisMonth: 'Ce mois',
                    subtitle: 'Revenus - Dépenses'
                },
                processingStatus: {
                    title: 'Statut de Traitement',
                    successRate: 'Taux de Réussite',
                    processed: 'traités',
                    pending: 'en attente'
                },
                monthlySummary: {
                    title: 'Résumé Mensuel',
                    monthlyRevenue: 'Revenus du Mois',
                    monthlyExpenses: 'Dépenses du Mois',
                    monthlyProfit: 'Bénéfice du Mois'
                }
            }
        },

        // Invoices
        invoices: {
            title: 'Factures',
            subtitle: 'Gestion et émission de factures',
            searchPlaceholder: 'Rechercher des factures...',
            newInvoice: 'Nouvelle Facture',
            export: 'Exporter',
            noInvoices: 'Aucune facture trouvée',
            totalInvoices: 'Total',
            totalValue: 'Valeur Totale',

            table: {
                fileName: 'Nom du Fichier',
                nif: 'NIF',
                vat: 'TVA',
                total: 'Total',
                paymentType: 'Type de Paiement',
                issueDate: 'Date d\'Émission',
                status: 'Statut',
                actions: 'Actions'
            },

            modal: {
                title: 'Nouvelle Facture',
                submitLabel: 'Créer Facture',
                clientName: 'Nom du Client',
                clientEmail: 'Email du Client',
                clientTaxId: 'NIF du Client',
                baseAmount: 'Montant de Base (€)',
                vatRate: 'Taux de TVA (%)',
                description: 'Description de la Facture',
                paymentType: 'Type de Paiement',
                supplier: 'Fournisseur',
                summary: 'Résumé de la Facture',
                autoCompleteHint: 'Tapez le nom pour auto-compléter les données',
                clientFound: 'Client trouvé'
            },

            status: {
                paid: 'Payé',
                sent: 'Envoyé',
                draft: 'Brouillon',
                overdue: 'En Retard'
            },

            paymentTypes: {
                bankTransfer: 'Virement Bancaire',
                card: 'Carte',
                supplierCredit: 'Crédit Fournisseur'
            },

            errors: {
                clientNameRequired: 'Le nom du client est obligatoire',
                taxIdRequired: 'Le NIF du client est obligatoire',
                amountRequired: 'Le montant doit être un nombre valide',
                vatRateInvalid: 'Taux de TVA invalide. Utilisez 6, 13 ou 23',
                createError: 'Erreur lors de la création de la facture',
                exportError: 'Aucune facture à exporter'
            }
        },

        // Expenses
        expenses: {
            title: 'Dépenses',
            subtitle: 'Gestion et contrôle des dépenses',
            searchPlaceholder: 'Rechercher des dépenses...',
            newExpense: 'Nouvelle Dépense',
            export: 'Exporter',
            noExpenses: 'Aucune dépense trouvée',
            totalExpenses: 'Total',
            totalValue: 'Valeur Totale',

            table: {
                vendor: 'Fournisseur',
                total: 'Total',
                vat: 'TVA',
                category: 'Catégorie',
                date: 'Date',
                deductible: 'Déductible',
                actions: 'Actions'
            },

            modal: {
                title: 'Nouvelle Dépense',
                submitLabel: 'Créer Dépense',
                vendor: 'Nom du Fournisseur',
                amount: 'Montant (€)',
                vatRate: 'Taux de TVA',
                category: 'Catégorie',
                receiptNumber: 'Numéro de Reçu',
                description: 'Description'
            },

            vatRates: {
                exempt: '0% (Exonéré)',
                reduced: '6% (Réduit)',
                intermediate: '13% (Intermédiaire)',
                normal: '23% (Normal)'
            },

            deductible: {
                yes: 'Oui',
                no: 'Non'
            },

            errors: {
                vendorRequired: 'Le nom du fournisseur est obligatoire',
                amountRequired: 'Le montant doit être un nombre valide',
                categoryRequired: 'La catégorie est obligatoire',
                vatRateInvalid: 'Taux de TVA invalide. Utilisez 0, 6, 13 ou 23',
                createError: 'Erreur lors de la création de la dépense',
                exportError: 'Aucune dépense à exporter'
            }
        },

        // Payments
        payments: {
            title: 'Paiements',
            subtitle: 'Gestion des paiements et recettes',
            searchPlaceholder: 'Rechercher des paiements...',
            registerPayment: 'Enregistrer Paiement',
            export: 'Exporter',
            noPayments: 'Aucun paiement enregistré',
            totalPayments: 'Total',
            totalValue: 'Valeur Totale',
            loading: 'Chargement...',

            metrics: {
                monthlyIncome: 'Revenus du Mois',
                pendingPayments: 'Paiements en Attente',
                collectionRate: 'Taux de Recouvrement'
            },

            table: {
                description: 'Description',
                amount: 'Montant',
                type: 'Type',
                date: 'Date',
                reference: 'Référence',
                status: 'Statut',
                actions: 'Actions'
            },

            modal: {
                title: 'Enregistrer Paiement',
                submitLabel: 'Enregistrer',
                paymentType: 'Type de Paiement',
                method: 'Méthode de Paiement',
                description: 'Description',
                amount: 'Montant (€)',
                reference: 'Référence',
                notes: 'Notes',
                summary: 'Résumé'
            },

            types: {
                income: 'Recette',
                expense: 'Dépense'
            },

            methods: {
                transfer: 'Virement',
                cash: 'Espèces',
                card: 'Carte',
                check: 'Chèque'
            },

            status: {
                completed: 'Terminé',
                pending: 'En Attente',
                failed: 'Échoué'
            },

            errors: {
                descriptionRequired: 'La description est obligatoire',
                amountRequired: 'Le montant doit être un nombre valide',
                typeInvalid: 'Type de paiement invalide',
                methodInvalid: 'Méthode de paiement invalide',
                createError: 'Erreur lors de l\'enregistrement du paiement',
                exportError: 'Aucun paiement à exporter'
            }
        },

        // Clients
        clients: {
            title: 'Clients',
            subtitle: 'Gérer les informations des clients',
            searchPlaceholder: 'Rechercher des clients...',
            newClient: 'Nouveau Client',
            noClients: 'Aucun client trouvé',
            totalClients: 'Total',
            clientsFound: 'client(s) trouvé(s)',

            table: {
                client: 'Client',
                contact: 'Contact',
                nif: 'NIF',
                location: 'Localisation',
                created: 'Créé'
            },

            modal: {
                title: 'Nouveau Client',
                submitLabel: 'Créer Client',
                name: 'Nom',
                email: 'Email',
                phone: 'Téléphone',
                taxId: 'NIF',
                address: 'Adresse',
                postalCode: 'Code Postal',
                city: 'Ville'
            },

            errors: {
                nameRequired: 'Le nom est obligatoire',
                createError: 'Erreur lors de la création du client'
            }
        },

        // Suppliers
        suppliers: {
            title: 'Fournisseurs',
            subtitle: 'Gérer les informations des fournisseurs',
            newSupplier: 'Nouveau Fournisseur',
            editSupplier: 'Modifier le Fournisseur',
            listTitle: 'Liste des Fournisseurs',
            searchPlaceholder: 'Rechercher des fournisseurs...',
            noSuppliersFound: 'Aucun fournisseur trouvé',
            noSuppliersRegistered: 'Aucun fournisseur enregistré',
            tryAdjustingSearch: 'Essayez d\'ajuster les termes de recherche',
            startAddingSupplier: 'Commencez par ajouter votre premier fournisseur',
            addSupplier: 'Ajouter un Fournisseur',
            form: {
                companyName: 'Nom de l\'Entreprise',
                companyNameRequired: 'Nom de l\'Entreprise *',
                companyNamePlaceholder: 'Nom de l\'entreprise',
                taxId: 'NIF',
                taxIdPlaceholder: 'Numéro d\'identification fiscale',
                email: 'Email',
                emailPlaceholder: 'email@entreprise.com',
                phone: 'Téléphone',
                phonePlaceholder: '+351 123 456 789',
                address: 'Adresse',
                addressPlaceholder: 'Rue, numéro, étage',
                postalCode: 'Code Postal',
                postalCodePlaceholder: '1234-567',
                city: 'Ville',
                cityPlaceholder: 'Lisbonne',
                contactPerson: 'Personne de Contact',
                contactPersonPlaceholder: 'Nom de la personne de contact',
                paymentTerms: 'Conditions de Paiement',
                paymentTermsPlaceholder: 'Ex: 30 jours',
                notes: 'Notes',
                notesPlaceholder: 'Notes supplémentaires sur le fournisseur'
            },
            card: {
                taxId: 'NIF',
                contact: 'Contact',
                terms: 'Conditions'
            },
            validation: {
                nameRequired: 'Le nom est obligatoire',
                saveError: 'Erreur lors de la sauvegarde du fournisseur',
                deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce fournisseur ?',
                deleteError: 'Erreur lors de la suppression du fournisseur'
            }
        },

        // Documents
        documents: {
            title: 'Documents',
            subtitle: 'Gestion des documents et fichiers',
            newDocument: 'Nouveau Document',
            searchPlaceholder: 'Rechercher des documents...',
            export: 'Exporter',
            metrics: {
                totalDocuments: 'Total Documents',
                pending: 'En Attente',
                completed: 'Terminés',
                failed: 'Échoués'
            },
            table: {
                status: 'Statut',
                filename: 'Nom du Fichier',
                type: 'Type',
                size: 'Taille',
                documentType: 'Type de Document',
                uploadDate: 'Date de Téléchargement',
                confidence: 'Confiance',
                actions: 'Actions'
            },
            status: {
                completed: 'Terminé',
                processing: 'En Cours',
                pending: 'En Attente',
                failed: 'Échoué'
            },
            form: {
                filename: 'Nom du Fichier',
                filenameRequired: 'Nom du Fichier *',
                filenamePlaceholder: 'exemple.pdf',
                fileType: 'Type de Fichier',
                fileTypeRequired: 'Type de Fichier *',
                fileSize: 'Taille (octets)',
                fileSizeRequired: 'Taille (octets) *',
                fileSizePlaceholder: '1024',
                documentType: 'Type de Document',
                documentTypeRequired: 'Type de Document *',
                selectPlaceholder: 'Sélectionner...',
                summary: 'Résumé',
                file: 'Fichier',
                type: 'Type',
                document: 'Document',
                size: 'Taille'
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
                invoice: 'Facture',
                receipt: 'Reçu',
                contract: 'Contrat',
                report: 'Rapport',
                other: 'Autre'
            },
            validation: {
                filenameRequired: 'Le nom du fichier est obligatoire',
                fileTypeRequired: 'Le type de fichier est obligatoire',
                documentTypeRequired: 'Le type de document est obligatoire',
                fileSizeValid: 'La taille du fichier doit être un nombre valide',
                createError: 'Erreur lors de la création du document',
                deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce document ?',
                deleteError: 'Erreur lors de la suppression du document',
                exportError: 'Erreur lors de l\'exportation des documents',
                noDocumentsToExport: 'Aucun document à exporter'
            },
            loading: 'Chargement...',
            noDocumentsFound: 'Aucun document trouvé',
            totalDocuments: 'Total',
            processingProgress: 'Traitement'
        },

        // Banking
        banking: {
            title: 'Bancaire',
            subtitle: 'Gestion des transactions bancaires',
            newTransaction: 'Nouvelle Transaction',
            searchPlaceholder: 'Rechercher des transactions...',
            export: 'Exporter',
            metrics: {
                currentBalance: 'Solde Actuel',
                totalCredits: 'Total Crédits',
                totalDebits: 'Total Débits',
                transactions: 'Transactions'
            },
            table: {
                type: 'Type',
                description: 'Description',
                amount: 'Montant',
                date: 'Date',
                balance: 'Solde',
                category: 'Catégorie',
                actions: 'Actions'
            },
            transactionTypes: {
                credit: 'Crédit',
                debit: 'Débit',
                transfer: 'Transfert'
            },
            form: {
                transactionType: 'Type de Transaction',
                transactionTypeRequired: 'Type de Transaction *',
                amount: 'Montant (€)',
                amountRequired: 'Montant (€) *',
                amountPlaceholder: '0.00',
                description: 'Description',
                descriptionRequired: 'Description *',
                descriptionPlaceholder: 'Description de la transaction',
                category: 'Catégorie',
                categoryRequired: 'Catégorie *',
                categoryPlaceholder: 'Ex: Revenus, Dépenses, Services',
                reference: 'Référence',
                referencePlaceholder: 'Référence (optionnel)',
                summary: 'Résumé',
                type: 'Type',
                value: 'Valeur',
                newBalance: 'Nouveau Solde'
            },
            validation: {
                descriptionRequired: 'La description est obligatoire',
                amountValid: 'Le montant doit être un nombre valide',
                categoryRequired: 'La catégorie est obligatoire',
                createError: 'Erreur lors de la création de la transaction bancaire',
                exportError: 'Erreur lors de l\'exportation des transactions bancaires',
                noTransactionsToExport: 'Aucune transaction à exporter'
            },
            loading: 'Chargement...',
            noTransactionsFound: 'Aucune transaction trouvée',
            totalTransactions: 'Total',
            finalBalance: 'Solde Final'
        },

        // VAT
        vat: {
            title: 'TVA',
            subtitle: 'Gestion des déclarations et paiements de TVA',
            newDeclaration: 'Nouvelle Déclaration',
            metrics: {
                vatToPay: 'TVA à Payer',
                currentPeriod: 'Période actuelle',
                vatCollected: 'TVA Collectée',
                thisMonth: 'Ce mois',
                vatPaid: 'TVA Payée',
                declarations: 'Déclarations',
                thisYear: 'Cette année'
            },
            declarations: {
                title: 'Déclarations de TVA',
                searchPlaceholder: 'Rechercher des déclarations...',
                period: 'Période',
                sales: 'Ventes',
                purchases: 'Achats',
                vatCollected: 'TVA Collectée',
                vatPaid: 'TVA Payée',
                vatDue: 'TVA Due',
                status: 'Statut'
            },
            status: {
                paid: 'Payé',
                pending: 'En Attente'
            },
            loading: 'Chargement...'
        },

        // SAF-T
        saft: {
            title: 'SAF-T',
            subtitle: 'Standard Audit File for Tax - Fichier normalisé d\'audit fiscal',
            generateSaft: 'Générer SAF-T',
            metrics: {
                reportsGenerated: 'Rapports Générés',
                totalRecords: 'Total Enregistrements',
                lastReport: 'Dernier Rapport',
                currentStatus: 'Statut Actuel'
            },
            status: {
                updated: 'Mis à Jour',
                completed: 'Terminé',
                processing: 'En Cours',
                pending: 'En Attente',
                error: 'Erreur',
                unknown: 'Inconnu'
            },
            info: {
                title: 'À propos de SAF-T (PT)',
                description: 'Le SAF-T (PT) est un fichier normalisé d\'audit fiscal requis par l\'Autorité Fiscale portugaise. Il contient toutes les informations comptables et fiscales de l\'entreprise dans un format XML structuré, facilitant les audits et vérifications fiscales.',
                periodicity: 'Annuel',
                format: 'XML',
                encoding: 'UTF-8'
            },
            reports: {
                title: 'Rapports SAF-T',
                period: 'Période',
                type: 'Type',
                generationDate: 'Date de Génération',
                records: 'Enregistrements',
                size: 'Taille',
                status: 'Statut',
                actions: 'Actions'
            },
            requirements: {
                title: 'Exigences SAF-T',
                companyData: 'Données d\'identification de l\'entreprise',
                chartOfAccounts: 'Plan de comptes (Plan Comptable Officiel)',
                customersSuppliers: 'Clients et fournisseurs',
                productsServices: 'Produits et services',
                salesDocuments: 'Documents de vente (factures, reçus)',
                purchaseDocuments: 'Documents d\'achat',
                accountingMovements: 'Mouvements comptables',
                xmlValidation: 'Validation XML (Schéma XSD)'
            }
        },

        // Reports
        reports: {
            title: 'Rapports',
            subtitle: 'Analyses et rapports financiers',
            exportAll: 'Tout Exporter',
            quickStats: {
                revenue: 'Revenus',
                expenses: 'Dépenses',
                profit: 'Profit',
                margin: 'Marge'
            },
            reportTypes: {
                title: 'Types de Rapport',
                financial: {
                    name: 'Rapport Financier',
                    description: 'Revenus, dépenses et profits',
                    generate: 'Générer'
                },
                invoices: {
                    name: 'Rapport de Factures',
                    description: 'Factures émises et reçues',
                    generate: 'Générer'
                },
                expenses: {
                    name: 'Rapport de Dépenses',
                    description: 'Analyse des dépenses par catégorie',
                    generate: 'Générer'
                },
                clients: {
                    name: 'Rapport de Clients',
                    description: 'Performance des clients',
                    generate: 'Générer'
                },
                vat: {
                    name: 'Rapport de TVA',
                    description: 'Résumé de TVA à payer/recevoir',
                    generate: 'Générer'
                },
                assets: {
                    name: 'Rapport d\'Actifs',
                    description: 'Inventaire et dépréciation',
                    generate: 'Générer'
                }
            },
            recentReports: {
                title: 'Rapports Récents',
                searchPlaceholder: 'Rechercher des rapports...',
                name: 'Nom',
                type: 'Type',
                date: 'Date',
                size: 'Taille',
                format: 'Format',
                actions: 'Actions'
            }
        }
    }
}

export const getLanguageFlag = (language: Language): string => {
    const flags = {
        pt: '🇵🇹',
        en: '🇬🇧',
        fr: '🇫🇷'
    }
    return flags[language]
}

export const getLanguageName = (language: Language): string => {
    const names = {
        pt: 'Português',
        en: 'English',
        fr: 'Français'
    }
    return names[language]
}
