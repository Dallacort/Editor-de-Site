/**
 * HARDEM Editor Core - Módulo Principal
 * Gerencia estado, inicialização e coordenação entre módulos
 * @version 1.0.0
 */

class HardemEditorCore {
    constructor() {
        // Estado do editor
        this.editMode = false;
        this.contentMap = {};
        this.sidePanel = null;
        this.toolbar = null;
        this.currentElement = null;
        this.mutationObserver = null;
        this.isProcessingElements = false;
        this.contentHasLoaded = false; // Flag para prevenir cargas duplas
        
        this.debouncedSetupEditableElements = this.debounce(() => {
            if (this.editMode && !this.isProcessingElements) {
                console.log("🔧 HARDEM Editor: Executando setupEditableElements via debounce (editMode ativo).");
                this.isProcessingElements = true;
                this.textEditor.setupEditableElements(document.body);
                setTimeout(() => {
                    this.isProcessingElements = false;
                }, 100);
            } else if (!this.editMode) {
                console.log("⏸️ HARDEM Editor: setupEditableElements ignorado (editMode inativo).");
            }
        }, 300);
        
        // Seletores de elementos editáveis
        this.editableSelectors = [
            '[data-key]',
            // Contadores - devem ser reconhecidos como um elemento único
            'h1.counter.title:not([data-no-edit]):not(.hardem-counter-element):not([data-hardem-processed])',
            'h2.counter.title:not([data-no-edit]):not(.hardem-counter-element):not([data-hardem-processed])',
            'h3.counter.title:not([data-no-edit]):not(.hardem-counter-element):not([data-hardem-processed])',
            'h4.counter.title:not([data-no-edit]):not(.hardem-counter-element):not([data-hardem-processed])',
            'h5.counter.title:not([data-no-edit]):not(.hardem-counter-element):not([data-hardem-processed])',
            'h6.counter.title:not([data-no-edit]):not(.hardem-counter-element):not([data-hardem-processed])',
            // Headers tradicionais
            'h1:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            'h2:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            'h3:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            'h4:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            'h5:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            'h6:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            // Textos
            'p:not([data-no-edit]):not([data-hardem-processed])',
            'span:not([data-no-edit]):not(.odometer):not([data-hardem-processed])',
            'a:not([data-no-edit]):not([data-hardem-processed])',
            'button:not([data-no-edit]):not([data-hardem-processed])',
            // Classes específicas de texto
            'div.title:not([data-no-edit]):not(.counter):not([data-hardem-processed])',
            'div.subtitle:not([data-no-edit]):not([data-hardem-processed])',
            'div.description:not([data-no-edit]):not([data-hardem-processed])',
            'div.content:not([data-no-edit]):not([data-hardem-processed])',
            'div.text:not([data-no-edit]):not([data-hardem-processed])',
            'div.disc:not([data-no-edit]):not([data-hardem-processed])',
            'div.details:not([data-no-edit]):not([data-hardem-processed])',
            'div.inner-content:not([data-no-edit]):not([data-hardem-processed])',
            // Elementos de footer com background
            'footer:not([data-no-edit]):not([data-hardem-processed])',
            'footer *:not([data-no-edit]):not([data-hardem-processed])',
            '.footer:not([data-no-edit]):not([data-hardem-processed])',
            '.footer *:not([data-no-edit]):not([data-hardem-processed])',
            '.rts-footer:not([data-no-edit]):not([data-hardem-processed])',
            '.rts-footer *:not([data-no-edit]):not([data-hardem-processed])',
            // Elementos com background
            '[style*="background"]:not([data-no-edit]):not([data-hardem-processed])',
            '[class*="bg"]:not([data-no-edit]):not([data-hardem-processed])',
            '.bg_image:not([data-no-edit]):not([data-hardem-processed])',
            // Outros elementos
            'li:not([data-no-edit]):not([data-hardem-processed])',
            'td:not([data-no-edit]):not([data-hardem-processed])',
            'th:not([data-no-edit]):not([data-hardem-processed])',
            'label:not([data-no-edit]):not([data-hardem-processed])',
            'figcaption:not([data-no-edit]):not([data-hardem-processed])',
            '.editable:not([data-no-edit]):not([data-hardem-processed])',
            // Estatísticas e números
            '.ss:not([data-no-edit]):not([data-hardem-processed])',
            '.statistics:not([data-no-edit]):not([data-hardem-processed])',
            '.number:not([data-no-edit]):not([data-hardem-processed])',
            '.count:not([data-no-edit]):not([data-hardem-processed])'
        ];

        this.init();
    }

    /**
     * Inicialização do editor
     */
    init() {
        // Verificar se há dados corrompidos no localStorage
        this.checkAndCleanCorruptedData();
        
        // Inicializar módulos
        this.ui = new HardemEditorUI(this);
        this.textEditor = new HardemTextEditor(this);
        this.imageEditor = new HardemImageEditor(this);
        this.carouselEditor = new HardemCarouselEditor(this);
        this.storage = new HardemEditorStorage(this);
        this.utils = new HardemEditorUtils(this);
        
        // Configurar interface
        this.ui.createStyles();
        this.ui.createToolbar();
        this.ui.createSidePanel();
        
        // Configurar observadores e eventos
        this.setupMutationObserver();
        this.bindEvents();
        
        console.log('HARDEM Editor iniciado com sucesso!');
        
        // Inicializar com edição desativada
        this.editMode = false;
        
        // Aguardar DOM estar completamente carregado antes de carregar conteúdo
        this.waitForDOMAndLoadContent();
        
        // O botão será habilitado pelo editor-manager.js quando conectar à toolbar
    }

    /**
     * Aguardar DOM estar pronto e carregar conteúdo
     */
    waitForDOMAndLoadContent() {
        const loadContent = () => {
            if (this.contentHasLoaded) return; // Prevenir cargas duplas
            
            console.log('📄 DOM completamente carregado, iniciando carregamento de conteúdo...');
            this.storage.loadContent().then(() => {
                this.contentHasLoaded = true; // Marcar como carregado
                
                // NOVO: Detectar contadores automaticamente após carregar conteúdo
                if (this.textEditor && this.textEditor.detectAndSetupCounters) {
                    console.log('🔢 Detectando contadores após carregamento...');
                    this.textEditor.detectAndSetupCounters();
                }
                
                console.log('✅ Conteúdo carregado e contadores configurados');
            }).catch(error => {
                console.error('❌ Erro ao carregar conteúdo:', error);
            });
        };

        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadContent);
        } else {
            loadContent();
        }

        // Fallback com timeout
        setTimeout(() => {
            if (!this.contentHasLoaded) {
                console.log('⏰ Timeout: Forçando carregamento de conteúdo...');
                loadContent();
            }
        }, 2000);
    }

    /**
     * Verificar e limpar dados corrompidos
     */
    checkAndCleanCorruptedData() {
        try {
            // Obter chave específica da página
            const path = window.location.pathname;
            const fileName = path.split('/').pop() || 'index.html';
            const pageKey = `siteContent_${fileName}`;
            
            const saved = localStorage.getItem(pageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Verificar se há objetos [object Object] corrompidos
                for (const [key, value] of Object.entries(parsed)) {
                    if (typeof value === 'string' && value.includes('[object Object]')) {
                        console.warn(`Dados corrompidos detectados para ${key}, removendo...`);
                        delete parsed[key];
                    }
                }
                localStorage.setItem(pageKey, JSON.stringify(parsed));
                console.log(`🔧 Dados verificados para página: ${pageKey}`);
            }
        } catch (error) {
            console.warn('Dados do localStorage corrompidos, limpando...', error);
            const path = window.location.pathname;
            const fileName = path.split('/').pop() || 'index.html';
            const pageKey = `siteContent_${fileName}`;
            localStorage.removeItem(pageKey);
        }
    }

    /**
     * Reset de emergência - limpar tudo
     */
    emergencyReset() {
        if (confirm('RESET DE EMERGÊNCIA: Isso vai limpar todos os dados salvos desta página e recarregar. Continuar?')) {
            // Limpar overlays presos
            document.querySelectorAll('.hardem-processing-overlay').forEach(el => el.remove());
            
            // Limpar dados específicos da página atual
            const path = window.location.pathname;
            const fileName = path.split('/').pop() || 'index.html';
            const pageKey = `siteContent_${fileName}`;
            localStorage.removeItem(pageKey);
            
            sessionStorage.clear();
            this.contentMap = {};
            console.log(`Reset de emergência executado para: ${pageKey}`);
            location.reload();
        }
    }

    /**
     * Limpar elementos "presos" (função de emergência)
     */
    clearStuckOverlays() {
        // Remover overlays de processamento presos
        const overlays = document.querySelectorAll('.hardem-processing-overlay, .hardem-editor-overlay');
        overlays.forEach(overlay => overlay.remove());
        
        // Remover elementos selecionados
        const selected = document.querySelectorAll('.hardem-selected');
        selected.forEach(el => el.classList.remove('hardem-selected'));
        
        // Fechar painéis
        this.ui.closeSidePanel();
        
        // Limpar fila de imagens se houver problema
        if (this.imageEditor && typeof this.imageEditor.clearProcessingQueue === 'function') {
            this.imageEditor.clearProcessingQueue();
        }
        
        this.ui.showAlert('🧹 Elementos presos removidos!', 'success');
        console.log('🧹 Limpeza de emergência executada');
    }

    /**
     * Resetar sistema de imagens (função de emergência)
     */
    resetImageProcessing() {
        if (this.imageEditor && typeof this.imageEditor.resetImageSystem === 'function') {
            this.imageEditor.resetImageSystem();
        } else {
            this.ui.showAlert('⚠️ Sistema de imagens não disponível', 'warning');
        }
    }

    /**
     * Obter estatísticas do sistema
     */
    getSystemStats() {
        const stats = {
            contentMapSize: Object.keys(this.contentMap).length,
            editMode: this.editMode,
            hasImageEditor: !!this.imageEditor,
            hasTextEditor: !!this.textEditor
        };
        
        // Adicionar stats de imagens se disponível
        if (this.imageEditor && typeof this.imageEditor.getSystemStats === 'function') {
            stats.imageSystem = this.imageEditor.getSystemStats();
        }
        
        console.log('📊 Estatísticas do sistema:', stats);
        return stats;
    }

    /**
     * Testar ambiente PHP e diagnosticar problemas
     */
    async testPHPEnvironment() {
        try {
            this.ui.showAlert('🔧 Testando ambiente PHP...', 'info', 0);
            
            const response = await fetch('test-save.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('🔧 Resposta do teste PHP:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('🔧 Resultado do teste PHP:', data);
            
            // Remover alerta de teste
            const testAlerts = document.querySelectorAll('.editor-alert');
            testAlerts.forEach(alert => {
                if (alert.textContent.includes('Testando ambiente PHP')) {
                    alert.remove();
                }
            });
            
            // Mostrar resultados
            if (data.success) {
                let message = `✅ PHP funcionando! Versão: ${data.php_info.php_version}`;
                let alertType = 'success';
                
                if (data.recommendations && data.recommendations.length > 0) {
                    alertType = 'warning';
                    message = `⚠️ PHP funcionando mas com problemas detectados`;
                    
                    // Mostrar recomendações detalhadas
                    setTimeout(() => {
                        this.ui.showDetailedErrorAlert(
                            'Problemas no Ambiente PHP',
                            `PHP ${data.php_info.php_version} funcionando, mas há problemas de configuração:`,
                            data.recommendations
                        );
                    }, 1000);
                }
                
                this.ui.showAlert(message, alertType);
                
                // Log informações úteis
                console.log('📋 Informações do PHP:', {
                    version: data.php_info.php_version,
                    memory_limit: data.php_info.memory_limit,
                    writable: data.php_info.is_writable,
                    save_php_exists: data.save_php.exists
                });
                
            } else {
                this.ui.showAlert('❌ Erro no teste PHP: ' + data.message, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao testar PHP:', error);
            
            // Remover alerta de teste
            const testAlerts = document.querySelectorAll('.editor-alert');
            testAlerts.forEach(alert => {
                if (alert.textContent.includes('Testando ambiente PHP')) {
                    alert.remove();
                }
            });
            
            // Análise do tipo de erro
            if (error.message.includes('404')) {
                this.ui.showDetailedErrorAlert(
                    'Arquivo test-save.php Não Encontrado',
                    'O arquivo de teste não foi encontrado no servidor.',
                    [
                        'Verifique se o arquivo test-save.php existe na pasta',
                        'Certifique-se de estar executando via servidor web',
                        'Não abra o HTML diretamente no navegador'
                    ]
                );
            } else if (error.message.includes('Failed to fetch')) {
                this.ui.showDetailedErrorAlert(
                    'Servidor Web Não Disponível',
                    'Não foi possível conectar com o servidor web.',
                    [
                        'Execute o projeto via servidor web (XAMPP, WAMP, Apache)',
                        'Use: php -S localhost:8000 (servidor PHP embutido)',
                        'Não abra o arquivo HTML diretamente'
                    ]
                );
            } else {
                this.ui.showAlert(`❌ Erro no teste PHP: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Configurar observer de mutações do DOM
     */
    setupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        this.mutationObserver = new MutationObserver((mutations) => {
            if (!this.editMode || this.isProcessingElements) return;

            let shouldSetupElements = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        // Ignorar nós do editor e nós que já foram processados
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            !this.utils.isEditorElement(node) &&
                            !node.classList.contains('hardem-editable-element') &&
                            !node.classList.contains('hardem-counter-element') &&
                            !node.hasAttribute('data-hardem-processed') &&
                            !node.closest('.hardem-editor-toolbar') &&
                            !node.closest('.hardem-editor-sidepanel') &&
                            // NOVO: Ignorar mudanças em contadores (animação odometer)
                            !node.closest('.counter.title') &&
                            !node.classList.contains('odometer') &&
                            !node.closest('.odometer') &&
                            // NOVO: Ignorar mudanças em elementos com animação
                            !node.closest('[data-aos]') &&
                            !node.classList.contains('aos-animate')) {
                            shouldSetupElements = true;
                        }
                    });
                }
                
                // NOVO: Ignorar mudanças de atributos em contadores
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    if (target.classList.contains('odometer') || 
                        target.closest('.counter.title') ||
                        target.hasAttribute('data-aos') ||
                        target.classList.contains('hardem-counter-element')) {
                        return; // Ignorar mudanças de atributos em contadores
                    }
                }
            });

            if (shouldSetupElements) {
                this.debouncedSetupEditableElements();
            }
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true, // Monitorar atributos mas com filtros
            attributeFilter: ['class', 'data-key', 'data-hardem-processed'], // Apenas atributos relevantes
            characterData: false
        });
    }

    /**
     * Vinculação de eventos principais
     */
    bindEvents() {
        // Toggle do modo de edição - agora conectado via editor-manager
        // O botão hardem-toggle-edit é conectado pelo editor-manager.js

        // Painel lateral
        const openPanelBtn = document.getElementById('hardem-open-panel-btn');
        if (openPanelBtn) {
            openPanelBtn.addEventListener('click', () => {
            this.ui.toggleSidePanel();
        });
        }

        const closePanelBtn = document.getElementById('hardem-close-panel');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
            this.ui.closeSidePanel();
        });
        }

        // Salvar e restaurar
        const saveBtn = document.getElementById('hardem-save-content');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
            this.storage.saveContent();
        });
        }

        // Visualizar página
        const previewBtn = document.getElementById('hardem-preview-mode');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
            this.togglePreviewMode();
        });
        }

        // Scroll inteligente no painel (verificar se existe)
        if (this.ui && this.ui.sidepanel) {
            this.ui.sidepanel.addEventListener('wheel', (e) => {
            e.stopPropagation();
        });
        }

        // Tecla de emergência para limpar overlays (ESC)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearStuckOverlays();
            }
        });
    }

    /**
     * Alternar modo de edição
     */
    toggleEditMode() {
        const previousState = this.editMode;
        this.editMode = !this.editMode;
        
        console.log(`🔄 Alternando modo de edição: ${previousState ? 'ATIVO' : 'INATIVO'} → ${this.editMode ? 'ATIVO' : 'INATIVO'}`);
        
        if (this.editMode) {
            console.log('✅ Ativando modo de edição...');
            
            // Adicionar classe ao body para indicar modo de edição
            document.body.classList.add('hardem-editor-active');
            
            // Ativar edição de texto
            if (this.textEditor && this.textEditor.setupEditableElements) {
                console.log(`📝 Chamando setupEditableElements... (editMode: ${this.editMode})`);
                this.textEditor.setupEditableElements(document.body);
                console.log('📝 Editor de texto ativado');
            } else {
                console.error('❌ textEditor ou setupEditableElements não encontrado');
            }
            
            // Ativar edição de imagens
            if (this.imageEditor && this.imageEditor.setupImageEditing) {
                this.imageEditor.setupImageEditing();
                console.log('🖼️ Editor de imagens ativado');
            } else {
                console.warn('⚠️ imageEditor ou setupImageEditing não encontrado');
            }
            
            // Ativar edição de carrosséis
            if (this.carouselEditor && this.carouselEditor.setupCarouselEditing) {
                this.carouselEditor.setupCarouselEditing();
                console.log('🎠 Editor de carrosséis ativado');
            } else {
                console.warn('⚠️ carouselEditor ou setupCarouselEditing não encontrado');
            }
            
            // Mostrar controles específicos do modo de edição
            if (this.ui) {
                // A toolbar permanece sempre visível
                const toolbar = document.getElementById('hardem-editor-toolbar');
                if (toolbar) {
                    toolbar.style.display = 'flex';
                    console.log('🔧 Toolbar sempre visível');
                }
                
                // Mostrar botões específicos do modo de edição
                this.showEditingControls();
                
                const sidePanel = document.querySelector('.hardem-editor-sidepanel');
                if (sidePanel) {
                    sidePanel.style.display = 'block';
                    console.log('📋 Painel lateral disponível');
                } else {
                    console.warn('⚠️ Painel lateral não encontrado');
                }
            } else {
                console.error('❌ UI do editor não encontrada');
            }
            
        } else {
            console.log('❌ Desativando modo de edição...');
            
            // Desativar edição
            if (this.ui && this.ui.disableEditing) {
                this.ui.disableEditing();
                console.log('🚫 Edição desativada');
            }
            
            // Ocultar apenas controles específicos do modo de edição (toolbar permanece visível)
            this.hideEditingControls();
            
            const sidePanel = document.querySelector('.hardem-editor-sidepanel');
            if (sidePanel) {
                sidePanel.style.display = 'none';
                console.log('📋 Painel lateral oculto');
            }
            
            // Remover classe do body
            document.body.classList.remove('hardem-editor-active');
            
            // Remover seleções ativas
            document.querySelectorAll('.hardem-selected').forEach(el => {
                el.classList.remove('hardem-selected');
            });
        }
        
        console.log(`✅ Modo de edição: ${this.editMode ? 'ATIVO' : 'INATIVO'}`);
        
        // Verificar se há elementos editáveis após ativação
        if (this.editMode) {
            setTimeout(() => {
                const editableElements = document.querySelectorAll('.hardem-editable');
                console.log(`🔍 Elementos editáveis encontrados após ativação: ${editableElements.length}`);
                if (editableElements.length === 0) {
                    console.warn('⚠️ Nenhum elemento editável foi configurado! Pode haver um problema na configuração.');
                }
            }, 500);
        }
    }

    /**
     * Sair da edição e voltar para página normal
     */
    togglePreviewMode() {
        const confirmed = confirm(
            '🚪 Sair da Edição\n\n' +
            'Isso irá:\n' +
            '• Fechar o modo de edição\n' +
            '• Voltar para a página normal\n' +
            '• Alterações não salvas serão perdidas\n\n' +
            'Deseja continuar?'
        );
        
        if (confirmed) {
            // Remover parâmetro ?edit=true da URL
            const url = new URL(window.location);
            url.searchParams.delete('edit');
            
            // Redirecionar para página normal
            window.location.href = url.toString();
        }
    }

    /**
     * Publicar alterações (salva e aplica para usuários finais)
     */
    async publishChanges() {
        const publishBtn = document.getElementById('hardem-publish-changes');
        if (!publishBtn) {
            // Se o botão não existe, apenas salvar o conteúdo
            console.log('Botão de publicação não encontrado, salvando conteúdo...');
            await this.storage.saveContent();
            return;
        }
        
        const originalContent = publishBtn.innerHTML;
        
        // Verificar se há alterações para publicar
        if (Object.keys(this.contentMap).length === 0) {
            this.ui.showAlert('⚠️ Nenhuma alteração encontrada para publicar', 'warning');
            return;
        }
        
        // Confirmar publicação
        const confirmed = confirm(
            '🚀 PUBLICAR ALTERAÇÕES\n\n' +
            'Isso irá:\n' +
            '• Salvar todas as alterações no servidor\n' +
            '• Aplicar mudanças para todos os usuários\n' +
            '• Tornar o conteúdo visível no site público\n\n' +
            'Deseja continuar?'
        );
        
        if (!confirmed) return;
        
        try {
            // Indicar processamento
            publishBtn.innerHTML = '⏳';
            publishBtn.disabled = true;
            
            this.ui.showProcessingMessage('📤 Publicando alterações...');
            
            // Salvar as alterações no servidor
            const saveResult = await this.storage.saveContent();
            
            if (saveResult) {
                // Aguardar um pouco para garantir que o servidor processou
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Forçar limpeza de cache do navegador
                const cacheKey = this.storage.getPageKey();
                localStorage.removeItem(cacheKey);
                
                // Forçar recarregamento completo da página sem cache
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('_t', Date.now()); // Cache buster
                
                // Sucesso
                publishBtn.innerHTML = '✅';
                publishBtn.classList.add('success');
                
                this.ui.showAlert(
                    '🚀 Alterações publicadas com sucesso!\n' +
                    'O conteúdo foi atualizado e está visível para todos os usuários.\n' +
                    'A página será recarregada para aplicar as mudanças.',
                    'success',
                    3000
                );
                
                // Recarregar página após 3 segundos para aplicar mudanças
                setTimeout(() => {
                    window.location.reload(true);
                }, 3000);
                
            } else {
                throw new Error('Falha ao salvar alterações no servidor');
            }
            
        } catch (error) {
            console.error('Erro ao publicar:', error);
            
            publishBtn.innerHTML = '❌';
            publishBtn.classList.add('error');
            
            this.ui.showAlert(
                '❌ Erro ao publicar alterações.\n' +
                'Verifique a conexão com o servidor e tente novamente.',
                'error'
            );
            
            // Resetar botão após 3 segundos
            setTimeout(() => {
                publishBtn.innerHTML = originalContent;
                publishBtn.classList.remove('error');
                publishBtn.disabled = false;
            }, 3000);
        }
    }

    /**
     * Selecionar elemento para edição
     */
    selectElement(element) {
        this.currentElement = element;
        
        // Remover seleção anterior
        document.querySelectorAll('.hardem-selected').forEach(el => {
            el.classList.remove('hardem-selected');
        });
        
        // Adicionar seleção atual
        element.classList.add('hardem-selected');
        
        // Abrir painel lateral
        this.ui.openSidePanel();
        
        // Popular painel com dados do elemento
        this.ui.populateSidePanel(element);
        
        console.log('Elemento selecionado:', element);
    }

    /**
     * Função utilitária debounce
     */
    debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    /**
     * Configurar accordion do painel
     */
    setupAccordion() {
        const sectionHeaders = document.querySelectorAll('.hardem-editor-section-header');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                const isCollapsed = section.classList.contains('collapsed');
                
                if (isCollapsed) {
                    section.classList.remove('collapsed');
                } else {
                    section.classList.add('collapsed');
                }
            });
        });
    }

    /**
     * Destacar elemento na página
     */
    highlightElement(element) {
        // Remover highlight anterior
        document.querySelectorAll('.hardem-highlight-element').forEach(el => {
            el.classList.remove('hardem-highlight-element');
        });
        
        // Adicionar estilo de destaque temporário se não existir
        if (!document.getElementById('hardem-highlight-style')) {
            const style = document.createElement('style');
            style.id = 'hardem-highlight-style';
            style.innerHTML = `
                .hardem-highlight-element {
                    outline: 3px solid #e74c3c !important;
                    outline-offset: 2px !important;
                    animation: hardem-pulse 1s infinite;
                }
                @keyframes hardem-pulse {
                    0% { outline-color: #e74c3c; }
                    50% { outline-color: #c0392b; }
                    100% { outline-color: #e74c3c; }
                }
            `;
            document.head.appendChild(style);
        }
        
        element.classList.add('hardem-highlight-element');
        
        // Scroll para o elemento
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Remover highlight após 3 segundos
        setTimeout(() => {
            element.classList.remove('hardem-highlight-element');
        }, 3000);
    }

    /**
     * Extrair apenas o texto direto do elemento (sem textos de filhos e sem HTML decorativo)
     */
    getDirectTextContent(element) {
        // Clonar o elemento para não modificar o original
        const clone = element.cloneNode(true);
        
        // Remover elementos decorativos do editor
        const decorativeElements = clone.querySelectorAll('.hardem-image-overlay, .hardem-upload-btn');
        decorativeElements.forEach(el => el.remove());
        
        // Remover todos os elementos filhos com data-key (são elementos editáveis separados)
        const childElements = clone.querySelectorAll('[data-key]');
        childElements.forEach(child => {
            // Se não é o próprio elemento, remover
            if (child !== clone) {
                child.remove();
            }
        });
        
        // Remover outros elementos filhos que não são texto puro
        const allChildren = clone.querySelectorAll('*');
        allChildren.forEach(child => {
            // Se o elemento filho não tem data-key e é apenas formatação (b, i, strong, em, etc.)
            const isFormatting = ['b', 'i', 'strong', 'em', 'u', 'mark', 'small', 'sub', 'sup'].includes(child.tagName.toLowerCase());
            
            if (!child.getAttribute('data-key') && isFormatting) {
                // Manter formatação simples, substituir por seu texto
                const textNode = document.createTextNode(child.textContent || '');
                child.parentNode.replaceChild(textNode, child);
            } else if (!child.getAttribute('data-key') && !isFormatting) {
                // Remover elementos não-formatação que não têm data-key
                child.remove();
            }
        });
        
        return clone.textContent.trim() || element.textContent.trim();
    }

    /**
     * Neutralizar efeitos problemáticos em elementos editáveis
     */
    neutralizeElementEffects(element) {
        // Salvar estilos originais para restauração posterior
        if (!element.hasAttribute('data-original-styles-saved')) {
            const originalTransform = element.style.transform;
            const originalTransition = element.style.transition;
            const originalAnimation = element.style.animation;
            
            element.setAttribute('data-original-transform', originalTransform || '');
            element.setAttribute('data-original-transition', originalTransition || '');
            element.setAttribute('data-original-animation', originalAnimation || '');
            element.setAttribute('data-original-styles-saved', 'true');
        }
        
        // Aplicar neutralização apenas quando em modo de edição
        if (this.editMode) {
            // Cancelar transformações
            element.style.setProperty('transform', 'none', 'important');
            element.style.setProperty('-webkit-transform', 'none', 'important');
            
            // Cancelar animações
            element.style.setProperty('animation', 'none', 'important');
            element.style.setProperty('-webkit-animation', 'none', 'important');
            element.style.setProperty('animation-play-state', 'paused', 'important');
            
            // Simplificar transições
            element.style.setProperty('transition', 'outline 0.2s ease, background 0.2s ease', 'important');
            
            // Garantir opacidade normal
            element.style.setProperty('opacity', '1', 'important');
            
            // Para elementos com background-image, garantir estabilidade
            if (element.classList.contains('bg_image') || element.style.backgroundImage) {
                element.style.setProperty('background-size', 'cover', 'important');
                element.style.setProperty('background-position', 'center center', 'important');
                element.style.setProperty('background-attachment', 'scroll', 'important');
            }
        }
    }

    /**
     * Restaurar efeitos originais quando sair do modo de edição
     */
    restoreElementEffects(element) {
        if (element.hasAttribute('data-original-styles-saved')) {
            const originalTransform = element.getAttribute('data-original-transform');
            const originalTransition = element.getAttribute('data-original-transition');
            const originalAnimation = element.getAttribute('data-original-animation');
            
            // Restaurar estilos originais
            if (originalTransform) {
                element.style.transform = originalTransform;
            } else {
                element.style.removeProperty('transform');
            }
            
            if (originalTransition) {
                element.style.transition = originalTransition;
            } else {
                element.style.removeProperty('transition');
            }
            
            if (originalAnimation) {
                element.style.animation = originalAnimation;
            } else {
                element.style.removeProperty('animation');
            }
            
            // Remover propriedades forçadas
            element.style.removeProperty('-webkit-transform');
            element.style.removeProperty('-webkit-animation');
            element.style.removeProperty('opacity');
        }
    }

    /**
     * Mostrar controles específicos do modo de edição
     */
    showEditingControls() {
        // Mostrar botões específicos do modo de edição
        const editingButtons = [
            'hardem-open-panel',
            'hardem-save-content', 
            'hardem-preview-mode',
            'hardem-publish-changes',
            'hardem-reload-content'
        ];
        
        editingButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.style.display = 'flex';
            }
        });
        
        console.log('🔧 Controles de edição exibidos');
    }

    /**
     * Ocultar controles específicos do modo de edição
     */
    hideEditingControls() {
        // Ocultar botões específicos do modo de edição (mas manter o toggle)
        const editingButtons = [
            'hardem-open-panel',
            'hardem-save-content', 
            'hardem-preview-mode',
            'hardem-publish-changes',
            'hardem-reload-content'
        ];
        
        editingButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.style.display = 'none';
            }
        });
        
        console.log('🔧 Controles de edição ocultos (toolbar permanece visível)');
    }

    /**
     * Destruir editor
     */
    destroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Remover elementos da interface
        const toolbar = document.getElementById('hardem-editor-toolbar');
        const styles = document.getElementById('hardem-editor-styles');
        
        if (toolbar) toolbar.remove();
        if (styles) styles.remove();
        if (this.sidePanel) this.sidePanel.remove();
        
        // Restaurar estado original
        document.body.style.paddingTop = '0';
        
        console.log('Editor destruído');
    }
}

// Expor classe globalmente
window.HardemEditorCore = HardemEditorCore; 