/**
 * HARDEM Editor.js - Sistema de Edição Visual Completo
 * Permite edição inline e via painel lateral de qualquer template HTML
 * @version 1.0.0
 * @author HARDEM Editor Team
 */

class HardemEditor {
    constructor() {
        // Estado do editor
        this.editMode = false;
        this.staticMode = false;
        this.contentMap = {};
        this.sidePanel = null;
        this.toolbar = null;
        this.currentElement = null;
        this.mutationObserver = null;
        this.debouncedSetupEditableElements = this.debounce(() => {
            if (this.editMode) { // Só executar se ainda estiver em modo de edição
                console.log("HARDEM Editor: Executando setupEditableElements via debounce.");
                this.setupEditableElements(document.body);
            }
        }, 300); // 300ms delay, ajuste conforme necessário
        
        // Seletores de elementos editáveis
        this.editableSelectors = [
            '[data-key]',
            'h1:not([data-no-edit])',
            'h2:not([data-no-edit])',
            'h3:not([data-no-edit])',
            'h4:not([data-no-edit])',
            'h5:not([data-no-edit])',
            'h6:not([data-no-edit])',
            'p:not([data-no-edit])',
            'span:not([data-no-edit])',
            'a:not([data-no-edit])',
            'button:not([data-no-edit])',
            'div.title:not([data-no-edit])',
            'div.subtitle:not([data-no-edit])',
            'div.description:not([data-no-edit])',
            'div.content:not([data-no-edit])',
            'div.text:not([data-no-edit])',
            'li:not([data-no-edit])',
            'td:not([data-no-edit])',
            'th:not([data-no-edit])',
            'label:not([data-no-edit])',
            'figcaption:not([data-no-edit])',
            '.editable:not([data-no-edit])'
        ];

        this.init();
    }

    /**
     * Inicialização do editor
     */
    init() {
        // Verificar se há dados corrompidos no localStorage
        this.checkAndCleanCorruptedData();
        
        this.createStyles();
        this.createToolbar();
        this.createSidePanel();
        // Mover setupMutationObserver e bindEvents para antes de loadContent
        this.setupMutationObserver(); 
        this.bindEvents();
        // Chamar loadContent mais tarde na inicialização
        this.loadContent(); 
        
        console.log('🎯 HARDEM Editor iniciado com sucesso!');
    }

    /**
     * Verificar e limpar dados corrompidos
     */
    checkAndCleanCorruptedData() {
        try {
            const saved = localStorage.getItem('siteContent');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Verificar se há objetos [object Object] corrompidos
                for (const [key, value] of Object.entries(parsed)) {
                    if (typeof value === 'string' && value.includes('[object Object]')) {
                        console.warn(`Dados corrompidos detectados para ${key}, removendo...`);
                        delete parsed[key];
                    }
                }
                localStorage.setItem('siteContent', JSON.stringify(parsed));
            }
        } catch (error) {
            console.warn('Dados do localStorage corrompidos, limpando...', error);
            localStorage.removeItem('siteContent');
        }
    }

    /**
     * Reset de emergência - limpar tudo
     */
    emergencyReset() {
        if (confirm('🚨 RESET DE EMERGÊNCIA: Isso vai limpar todos os dados salvos e recarregar a página. Continuar?')) {
            localStorage.removeItem('siteContent');
            sessionStorage.clear();
            this.contentMap = {};
            console.log('🚨 Reset de emergência executado!');
            location.reload();
        }
    }

    /**
     * Criação dos estilos CSS do editor
     */
    createStyles() {
        const styles = `
            <style id="hardem-editor-styles">
                /* ===== TOOLBAR SUPERIOR ===== */
                .hardem-editor-toolbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    padding: 8px 15px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
                    z-index: 999999;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: white;
                    border-bottom: 2px solid #3498db;
                    height: 50px;
                    box-sizing: border-box;
                }

                .hardem-editor-toolbar h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #ecf0f1;
                }

                .hardem-editor-controls {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .hardem-editor-btn {
                    background: #3498db;
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-height: 32px;
                    box-sizing: border-box;
                    white-space: nowrap;
                }

                .hardem-editor-btn:hover {
                    background: #2980b9;
                    transform: translateY(-1px);
                }

                .hardem-editor-btn.active {
                    background: #e74c3c;
                    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3);
                }

                .hardem-editor-btn.success {
                    background: #27ae60;
                }

                .hardem-editor-btn.success:hover {
                    background: #229954;
                }

                .hardem-editor-btn.warning {
                    background: #f39c12;
                }

                .hardem-editor-btn.warning:hover {
                    background: #e67e22;
                }

                .hardem-editor-status {
                    background: #34495e;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid #576574;
                    min-height: 32px;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                }

                /* ===== PAINEL LATERAL ===== */
                .hardem-editor-sidepanel {
                    position: fixed;
                    top: 50px;
                    right: -280px;
                    width: 280px;
                    height: calc(100vh - 50px);
                    background: #f9f9f9;
                    border-left: 1px solid #ddd;
                    z-index: 999998;
                    transition: transform 0.3s ease;
                    overflow-y: auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                }

                .hardem-editor-sidepanel.visible {
                    transform: translateX(-280px);
                }

                .hardem-editor-sidepanel-header {
                    padding: 12px;
                    background: white;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .hardem-editor-sidepanel-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }

                .hardem-editor-close-panel {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                    border-radius: 3px;
                    transition: background 0.2s ease;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hardem-editor-close-panel:hover {
                    background: #e9ecef;
                    color: #333;
                }

                .hardem-editor-sidepanel-content {
                    padding: 12px;
                    gap: 10px;
                    display: flex;
                    flex-direction: column;
                }

                .hardem-editor-field {
                    margin-bottom: 10px;
                }

                .hardem-editor-field label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: normal;
                    color: #666;
                    font-size: 13px;
                }

                .hardem-editor-field input,
                .hardem-editor-field textarea {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                    background: white;
                }

                .hardem-editor-field input:focus,
                .hardem-editor-field textarea:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
                }

                .hardem-editor-field textarea {
                    resize: vertical;
                    min-height: 60px;
                }

                .hardem-editor-image-preview {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    margin-top: 6px;
                    border: 1px solid #ddd;
                    background: white;
                }

                /* ===== SEÇÕES COLAPSÁVEIS ===== */
                .hardem-editor-section {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    background: white;
                    overflow: hidden;
                }

                .hardem-editor-section-header {
                    padding: 10px 12px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #ddd;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 500;
                    color: #333;
                    font-size: 13px;
                    transition: background 0.2s ease;
                }

                .hardem-editor-section-header:hover {
                    background: #e9ecef;
                }

                .hardem-editor-section-header .toggle-icon {
                    font-size: 12px;
                    color: #666;
                    transition: transform 0.2s ease;
                }

                .hardem-editor-section.collapsed .toggle-icon {
                    transform: rotate(-90deg);
                }

                .hardem-editor-section-content {
                    padding: 12px;
                    border-top: none;
                    transition: max-height 0.3s ease;
                    overflow: hidden;
                }

                .hardem-editor-section.collapsed .hardem-editor-section-content {
                    display: none;
                }

                /* ===== BOTÕES OTIMIZADOS ===== */
                .hardem-editor-btn-primary {
                    background: #28a745;
                    border: none;
                    color: white;
                    padding: 8px 14px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    width: 100%;
                    margin-top: 6px;
                }

                .hardem-editor-btn-primary:hover {
                    background: #218838;
                    transform: translateY(-1px);
                }

                .hardem-editor-btn-secondary {
                    background: #007bff;
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    width: 100%;
                    margin-top: 4px;
                }

                .hardem-editor-btn-secondary:hover {
                    background: #0056b3;
                }

                .hardem-editor-btn-outline {
                    background: transparent;
                    border: 1px solid #ddd;
                    color: #666;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    width: 100%;
                    margin-top: 4px;
                }

                .hardem-editor-btn-outline:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                    color: #495057;
                }

                /* ===== INDICADORES PARA DIFERENTES TIPOS ===== */
                .hardem-editor-type-text {
                    border-left: 3px solid #007bff;
                    background: #f8f9ff;
                }

                .hardem-editor-type-image {
                    border-left: 3px solid #dc3545;
                    background: #fff5f5;
                }

                .hardem-editor-type-background {
                    border-left: 3px solid #6f42c1;
                    background: #f8f5ff;
                }

                /* ===== INFORMAÇÕES COMPACTAS ===== */
                .hardem-editor-info {
                    background: #f8f9fa;
                    padding: 8px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 10px;
                    border: 1px solid #e9ecef;
                }

                /* ===== MODO DE EDIÇÃO ===== */
                body.hardem-edit-mode {
                    padding-top: 50px !important;
                }

                /* Manter animações normais, pausar apenas efeitos que atrapalham a edição */
                .hardem-editable-element {
                    cursor: pointer;
                    /* Não forçar position relative para evitar problemas de layout */
                }

                .hardem-editable-element:hover {
                    outline: 2px dashed #3498db;
                    outline-offset: 2px;
                    /* Evitar transformações que podem causar deslocamento */
                    transform: none !important;
                    transition: none !important;
                }

                .hardem-editable-element.editing {
                    outline: 2px solid #e74c3c;
                    outline-offset: 2px;
                    transform: none !important;
                    transition: none !important;
                }

                .hardem-editable-element[contenteditable="true"] {
                    outline: 2px solid #27ae60;
                    outline-offset: 2px;
                    transform: none !important;
                    transition: none !important;
                }

                /* ===== OVERLAYS DE IMAGEM ===== */
                .hardem-image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    cursor: pointer;
                    z-index: 10;
                }

                .hardem-editable-element:hover .hardem-image-overlay {
                    opacity: 1;
                }

                .hardem-upload-btn {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }

                .hardem-upload-btn:hover {
                    background: #2980b9;
                    transform: scale(1.05);
                }

                /* ===== INDICADORES ===== */
                /* Indicador de data-key removido - não é mais necessário */

                /* ===== ALERTAS ===== */
                .hardem-editor-alert {
                    position: fixed;
                    top: 90px;
                    right: 20px;
                    background: #e74c3c;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 999999;
                    font-size: 14px;
                    font-weight: 500;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
                }

                .hardem-editor-alert.show {
                    transform: translateX(0);
                }

                .hardem-editor-alert.success {
                    background: #27ae60;
                    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
                }

                /* ===== RESPONSIVO ===== */
                @media (max-width: 768px) {
                    .hardem-editor-toolbar {
                        padding: 6px 10px;
                        flex-direction: row;
                        flex-wrap: wrap;
                        gap: 8px;
                        height: auto;
                        min-height: 44px;
                    }

                    .hardem-editor-toolbar h3 {
                        font-size: 12px;
                        order: 1;
                    }

                    .hardem-editor-controls {
                        order: 2;
                        width: 100%;
                        justify-content: center;
                    }

                    .hardem-editor-sidepanel {
                        width: 100%;
                        right: -100%;
                        max-width: 320px;
                        top: 44px;
                        height: calc(100vh - 44px);
                    }

                    .hardem-editor-sidepanel.visible {
                        transform: translateX(-100%);
                    }

                    .hardem-editor-sidepanel-content {
                        padding: 10px;
                    }

                    .hardem-editor-btn {
                        padding: 5px 8px;
                        font-size: 11px;
                        min-height: 28px;
                        gap: 3px;
                    }

                    .hardem-editor-status {
                        padding: 5px 8px;
                        font-size: 10px;
                        min-height: 28px;
                    }

                    .hardem-editor-section-header {
                        padding: 8px 10px;
                        font-size: 12px;
                    }

                    body.hardem-edit-mode {
                        padding-top: 44px !important;
                    }
                }

                /* ===== ANIMAÇÕES ===== */
                @keyframes hardemFadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .hardem-editor-toolbar {
                    animation: hardemFadeIn 0.5s ease;
                }

                /* ===== HIGHLIGHT ELEMENT ===== */
                .hardem-highlight-element {
                    outline: 3px solid #f39c12 !important;
                    outline-offset: 5px !important;
                    box-shadow: 0 0 20px rgba(243, 156, 18, 0.3) !important;
                    transition: all 0.3s ease !important;
                }

                /* ===== MODO ESTÁTICO ===== */
                body.hardem-static-mode * {
                    /* Pausar a maioria das transições e animações */
                    transition-property: none !important;
                    transition-duration: 0s !important;
                    animation-play-state: paused !important;
                    animation-name: none !important;
                    /* Desativar interações do mouse por padrão no modo estático */
                    pointer-events: none !important;
                }

                /* Permitir que elementos editáveis e a UI do editor ainda funcionem e sejam interativos */
                body.hardem-static-mode .hardem-editable-element,
                body.hardem-static-mode .hardem-editable-element *,
                body.hardem-static-mode .hardem-editor-toolbar,
                body.hardem-static-mode .hardem-editor-toolbar *,
                body.hardem-static-mode .hardem-editor-sidepanel,
                body.hardem-static-mode .hardem-editor-sidepanel *,
                body.hardem-static-mode .hardem-editor-alert,
                body.hardem-static-mode .hardem-editor-alert *,
                body.hardem-static-mode #hardem-editor-styles /* Evitar que os próprios estilos do editor sejam afetados */
                {
                    transition-property: all !important; /* Restaura transições para a UI */
                    transition-duration: initial !important; /* Restaura duração original */
                    /* Não forçar animation-play-state: running aqui; deixar pausado pelo seletor '*' do static-mode */
                    /* As animações da UI do editor (toolbar, sidepanel fade-in) são geralmente controladas por classes ou JS e não seriam afetadas pelo 'paused' do '*' se forem bem definidas */
                    animation-name: initial !important; /* Para que não herde 'none' do '*' e permita animações específicas da UI se houver */
                    pointer-events: auto !important; /* Essencial: reativa interações do mouse */
                }

                body.hardem-static-mode .hardem-editable-element * { /* Filhos de elementos editáveis */
                    pointer-events: auto !important; /* Reativa interações */
                     /* Não forçar animation-play-state: running aqui */
                    animation-name: initial !important; /* Para que não herde 'none' do '*' */
                    /* Transições para filhos de elementos editáveis geralmente não são necessárias, a menos que tenham seu próprio feedback de edição */
                    /* transition-property: initial !important; */ /* Pode ser muito permissivo */
                    /* transition-duration: initial !important; */
                }

                /* Manter Swiper e Owl Carousel navegáveis se necessário (caso a pausa via JS não seja suficiente) */
                /* Mas o pointer-events: none no '*' deve cuidar da maioria dos casos de hover indesejado */
                body.hardem-static-mode .swiper {
                    /* pointer-events: auto !important; /* Se precisar que o container do swiper seja clicável */
                }

                body.hardem-static-mode .swiper-wrapper {
                    transition: none !important;
                    transform: none !important;
                }

                body.hardem-static-mode .swiper-slide {
                    transition: none !important;
                }

                /* Pausar apenas animações automáticas específicas */
                body.hardem-static-mode .swiper-autoplay,
                body.hardem-static-mode .carousel-auto,
                body.hardem-static-mode .auto-scroll {
                    animation-play-state: paused !important;
                    animation-duration: 0s !important;
                    transition: none !important;
                }

                body.hardem-static-mode .owl-carousel {
                    pointer-events: none !important;
                    transition: none !important;
                }

                /* Manter animações de hover e interação */
                body.hardem-static-mode *:hover {
                    /* Permitir efeitos de hover normais */
                }

                /* Pausar apenas modals automáticos */
                body.hardem-static-mode .modal.auto-show,
                body.hardem-static-mode .popup.auto-show,
                body.hardem-static-mode .overlay.auto-show {
                    display: none !important;
                }

                /* Manter animações de fade e slide normais */
                body.hardem-static-mode .fade:not(.auto-animate),
                body.hardem-static-mode .slide:not(.auto-animate),
                body.hardem-static-mode .zoom:not(.auto-animate) {
                    /* Manter animações manuais */
                }

                /* ===== PROTEÇÃO CONTRA DESLOCAMENTOS ===== */
                /* Evitar que elementos editáveis sejam afetados por transformações externas */
                .hardem-editable-element {
                    /* Proteger contra transformações que podem causar deslocamento */
                    backface-visibility: hidden !important;
                    -webkit-backface-visibility: hidden !important;
                    /* Garantir que o elemento mantenha sua posição */
                    will-change: auto !important;
                    /* Cancelar qualquer transformação externa */
                    transform: none !important;
                    /* Cancelar animações que podem causar problemas */
                    animation: none !important;
                    -webkit-animation: none !important;
                }

                /* Evitar problemas com background-attachment em elementos editáveis */
                .hardem-editable-element[style*="background-image"],
                .hardem-editable-element.bg_image {
                    background-attachment: scroll !important;
                    /* Garantir que o background não se mova */
                    background-size: cover !important;
                    background-position: center center !important;
                }

                /* Proteger contra efeitos de hover externos durante edição */
                body.hardem-edit-mode .hardem-editable-element,
                body.hardem-edit-mode .hardem-editable-element:hover,
                body.hardem-edit-mode .hardem-editable-element:focus,
                body.hardem-edit-mode .hardem-editable-element:active {
                    /* Cancelar TODAS as transformações externas */
                    transform: none !important;
                    -webkit-transform: none !important;
                    -moz-transform: none !important;
                    -ms-transform: none !important;
                    /* Cancelar transições que podem causar problemas */
                    transition: outline 0.2s ease, background 0.2s ease !important;
                    -webkit-transition: outline 0.2s ease, background 0.2s ease !important;
                    /* Cancelar animações */
                    animation: none !important;
                    -webkit-animation: none !important;
                    /* Cancelar filtros que podem causar problemas */
                    filter: none !important;
                    -webkit-filter: none !important;
                    /* Garantir opacidade normal */
                    opacity: 1 !important;
                    /* Cancelar escalas */
                    scale: none !important;
                    -webkit-scale: none !important;
                }

                /* Proteção específica para elementos com background-image */
                body.hardem-edit-mode .hardem-editable-element.bg_image,
                body.hardem-edit-mode .hardem-editable-element[style*="background-image"] {
                    /* Garantir que o background permaneça estável */
                    background-size: cover !important;
                    background-position: center center !important;
                    background-repeat: no-repeat !important;
                    background-attachment: scroll !important;
                }

                /* Proteção contra AOS e outras bibliotecas de animação */
                body.hardem-edit-mode .hardem-editable-element[data-aos],
                body.hardem-edit-mode .hardem-editable-element.aos-animate {
                    /* Cancelar animações AOS */
                    transform: none !important;
                    opacity: 1 !important;
                    transition: outline 0.2s ease, background 0.2s ease !important;
                }

                /* Proteção contra classes específicas que podem causar problemas */
                body.hardem-edit-mode .hardem-editable-element.single-right-content,
                body.hardem-edit-mode .hardem-editable-element.single-right-content:hover {
                    transform: none !important;
                    scale: none !important;
                    animation: none !important;
                }

                body.hardem-static-mode .hardem-editable-element * { /* Inclui filhos de elementos editáveis */
                    pointer-events: auto !important; /* Reativa interações */
                    animation-play-state: running !important;
                    animation-name: initial !important; /* Restaura nome da animação original */
                    transition-property: all !important; /* Restaura todas as transições */
                    transition-duration: initial !important; /* Restaura duração original */
                }

                /* 
                  Para elementos NÃO editáveis e NÃO UI do editor, quando em MODO ESTÁTICO:
                  Se, apesar do pointer-events: none, um hover for acionado (ex: via JS ou especificidade), 
                  tentamos neutralizar seus efeitos visuais comuns de overlay.
                */
                body.hardem-static-mode *:not(.hardem-editable-element):not([class*="hardem-editor-"]):not(html):not(body):hover,
                body.hardem-static-mode *:not(.hardem-editable-element):not([class*="hardem-editor-"]):not(html):not(body):focus-within {
                    opacity: inherit !important; /* Tenta manter a opacidade do estado não-hover */
                    visibility: inherit !important; /* Tenta manter a visibilidade do estado não-hover */
                    transform: none !important; /* Remove transformações */
                    z-index: auto !important; /* Evita que ganhe prioridade de empilhamento */
                    /* Se o overlay usa display: block/none, esta regra pode precisar ser mais específica 
                       para a classe do overlay, forçando display: none. Mas isso é muito direcionado sem saber a classe. */
                }

                /* 
                  Tentativa mais forte de esconder overlays que aparecem no hover 
                  (comum em cards, portfólios etc.) 
                */
                body.hardem-static-mode *:not([class*="hardem-editor-"]):not(.hardem-editable-element) > *[style*="position: absolute"]:hover,
                body.hardem-static-mode *:not([class*="hardem-editor-"]):not(.hardem-editable-element) > *:hover [style*="position: absolute"],
                body.hardem-static-mode *:not([class*="hardem-editor-"]):not(.hardem-editable-element) [class*="overlay"]:hover,
                body.hardem-static-mode *:not([class*="hardem-editor-"]):not(.hardem-editable-element) [class*="caption"]:hover {
                    display: none !important; 
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                /* 
                  Para botões gerais (não do editor) e elementos comumente usados como botões customizados,
                  forçar a pausa de animações e transições no modo estático.
                */
                body.hardem-static-mode button:not([class*="hardem-editor-"]):not(.hardem-editable-element button),
                body.hardem-static-mode a[class*="btn"]:not([class*="hardem-editor-"]):not(.hardem-editable-element a),
                body.hardem-static-mode div[class*="btn"]:not([class*="hardem-editor-"]):not(.hardem-editable-element div),
                body.hardem-static-mode input[type="button"]:not([class*="hardem-editor-"]):not(.hardem-editable-element input),
                body.hardem-static-mode input[type="submit"]:not([class*="hardem-editor-"]):not(.hardem-editable-element input)
                {
                    animation-play-state: paused !important;
                    animation-name: none !important;
                    transition-property: none !important;
                    transform: none !important; /* Reseta transformações de hover/active */
                    background-image: none !important; /* Remove gradientes de background que podem ser animados */
                }

                /* Regra específica e agressiva para data-aos no modo estático */
                body.hardem-static-mode [data-aos] {
                    animation-name: none !important;
                    animation-duration: 0s !important;
                    animation-play-state: paused !important; 
                    transition-property: none !important; /* Também para transições, caso AOS use */
                    transition-duration: 0s !important;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Criação da barra de ferramentas superior
     */
    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'hardem-editor-toolbar';
        this.toolbar.innerHTML = `
            <h3>🔧 HARDEM Editor</h3>
            <div class="hardem-editor-controls">
                <div class="hardem-editor-status">
                    <span id="hardem-edit-status">Visualizando</span>
                </div>
                <button id="hardem-toggle-edit" class="hardem-editor-btn">
                    🔓 Ativar Edição
                </button>
                <button id="hardem-open-panel" class="hardem-editor-btn">
                    ⚙️ Painel
                </button>
                <button id="hardem-toggle-static" class="hardem-editor-btn">
                    ⏸️ Pausar
                </button>
                <button id="hardem-save-content" class="hardem-editor-btn success">
                    💾 Salvar
                </button>
                <button id="hardem-emergency-reset" class="hardem-editor-btn" style="background: #e74c3c;">
                    🚨 Reset
                </button>
            </div>
        `;
        
        document.body.appendChild(this.toolbar);
        document.body.classList.add('hardem-edit-mode');
    }

    /**
     * Criação do painel lateral
     */
    createSidePanel() {
        this.sidePanel = document.createElement('div');
        this.sidePanel.className = 'hardem-editor-sidepanel';
        this.sidePanel.innerHTML = `
            <div class="hardem-editor-sidepanel-header">
                <h3 class="hardem-editor-sidepanel-title">Editor de Conteúdo</h3>
                <button class="hardem-editor-close-panel" id="hardem-close-panel">✕</button>
            </div>
            <div class="hardem-editor-sidepanel-content" id="hardem-panel-content">
                <p style="text-align: center; color: #7f8c8d; margin-top: 50px;">
                    Selecione um elemento para editá-lo
                </p>
            </div>
        `;
        
        document.body.appendChild(this.sidePanel);
    }

    /**
     * Configuração do MutationObserver para elementos dinâmicos
     */
    setupMutationObserver() {
        this.mutationObserver = new MutationObserver((mutations) => {
            let relevantChange = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            !node.closest('.hardem-editor-toolbar') &&
                            !node.closest('.hardem-editor-sidepanel') &&
                            !node.classList.contains('hardem-editable-element') && // Evitar elementos já processados
                            !node.closest('.hardem-editable-element')) { // Evitar filhos de elementos já processados que podem ser adicionados pelo editor
                            relevantChange = true;
                            break;
                        }
                    }
                }
                if (relevantChange) break;
            }

            if (relevantChange && this.editMode) { // Só acionar se estiver em modo de edição
                console.log("HARDEM Editor: Mudança relevante detectada no DOM.");
                this.debouncedSetupEditableElements();
            }
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false, 
            characterData: false
        });
    }

    /**
     * Vinculação de eventos
     */
    bindEvents() {
        // Toggle do modo de edição
        document.getElementById('hardem-toggle-edit').addEventListener('click', () => {
            this.toggleEditMode();
        });

        // Painel lateral
        document.getElementById('hardem-open-panel').addEventListener('click', () => {
            this.toggleSidePanel();
        });

        document.getElementById('hardem-close-panel').addEventListener('click', () => {
            this.closeSidePanel();
        });

        // Salvar e restaurar
        document.getElementById('hardem-save-content').addEventListener('click', () => {
            this.saveContent();
        });

    

        // Reset de emergência
        document.getElementById('hardem-emergency-reset').addEventListener('click', () => {
            this.emergencyReset();
        });

        // Scroll inteligente no painel
        this.sidePanel.addEventListener('wheel', (e) => {
            e.stopPropagation();
        });

        // Fechar painel ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.sidePanel.classList.contains('visible') && 
                !this.sidePanel.contains(e.target) && 
                !e.target.closest('.hardem-editor-toolbar')) {
                if (!e.target.closest('.hardem-editable-element')) {
                    this.closeSidePanel();
                }
            }
        });

        // Modo estático
        document.getElementById('hardem-toggle-static').addEventListener('click', () => {
            this.toggleStaticMode();
        });
    }

    /**
     * Ativar/desativar modo de edição
     */
    toggleEditMode() {
        this.editMode = !this.editMode;
        const toggleBtn = document.getElementById('hardem-toggle-edit');
        const statusSpan = document.getElementById('hardem-edit-status');
        
        if (this.editMode) {
            toggleBtn.innerHTML = '🔒 Desativar Edição';
            toggleBtn.classList.add('active');
            statusSpan.textContent = 'Editando';
            console.log("HARDEM Editor: Modo de edição ativado. Chamando setupEditableElements diretamente.");
            this.setupEditableElements(); // Chamada direta aqui
            this.showAlert('Modo de edição ativado!', 'success');

            // Se o modo estático (pause) estiver ativo, reforçar a pausa das bibliotecas JS
            if (this.staticMode) {
                console.log("HARDEM Editor: Modo Edição ativado com Modo Estático. Reforçando pausa das bibliotecas JS com delay...");
                // Adicionar um pequeno delay para garantir que o setupEditableElements concluiu qualquer reativação
                setTimeout(() => {
                    console.log("HARDEM Editor: Executando _updateAnimationLibrariesState(true) após delay.");
                    this._updateAnimationLibrariesState(true);
                }, 100); // 100ms de delay, pode ser ajustado
            }

        } else {
            toggleBtn.innerHTML = '🔓 Ativar Edição';
            toggleBtn.classList.remove('active');
            statusSpan.textContent = 'Visualizando';
            this.disableEditing();
            this.closeSidePanel();
            this.showAlert('Modo de edição desativado!', 'success');

            // Se o modo estático (pause) NÃO estiver ativo, garantir que as bibliotecas JS sejam resumidas
            // (Caso tivessem sido pausadas por alguma lógica específica do modo edição, o que não é o caso aqui, mas é seguro)
            if (!this.staticMode) {
                console.log("HARDEM Editor: Modo Edição desativado sem Modo Estático. Tentando resumir bibliotecas JS.");
                this._updateAnimationLibrariesState(false);
            }
        }
    }

    /**
     * Configurar elementos editáveis
     */
    setupEditableElements(container = document) {
        if (!this.editMode) return;

        // Desconectar temporariamente o observer para evitar auto-triggering
        if (this.mutationObserver) this.mutationObserver.disconnect();

        console.log('🔧 Configurando elementos editáveis...', container === document.body ? '(Document Body)' : container);

        // Textos editáveis
        let textCount = 0;
        this.editableSelectors.forEach(selector => {
            try {
                const elements = container.querySelectorAll(selector);
                console.log(`Selector "${selector}": ${elements.length} elementos encontrados`);
                
                elements.forEach(element => {
                    // Evitar elementos do editor
                    if (!element.closest('.hardem-editor-toolbar') && 
                        !element.closest('.hardem-editor-sidepanel') &&
                        !element.classList.contains('hardem-editable-element')) {
                        this.makeTextElementEditable(element);
                        textCount++;
                    }
                });
            } catch (error) {
                console.warn(`Erro ao processar selector ${selector}:`, error);
            }
        });

        // Imagens editáveis
        let imageCount = 0;
        try {
            const images = container.querySelectorAll('img[data-key]');
            console.log(`Imagens com data-key: ${images.length} encontradas`);
            
            images.forEach(image => {
                if (!image.closest('.hardem-editor-toolbar') && 
                    !image.closest('.hardem-editor-sidepanel')) {
                    this.makeImageEditable(image);
                    imageCount++;
                }
            });
        } catch (error) {
            console.warn('Erro ao processar imagens:', error);
        }

        // Background Images editáveis em toda a página
        let backgroundCount = 0;
        try {
            const allElements = container.querySelectorAll('*');
            console.log(`Verificando backgrounds em ${allElements.length} elementos...`);
            
            allElements.forEach(element => {
                // Evitar elementos do editor
                if (element.closest('.hardem-editor-toolbar') || 
                    element.closest('.hardem-editor-sidepanel') ||
                    element.classList.contains('hardem-editable-element')) {
                    return;
                }
                
                // IMPORTANTE: Evitar slides de carrossel - eles têm tratamento especial
                if (element.closest('.swiper') || element.classList.contains('swiper-slide')) {
                    return;
                }
                
                const computedStyle = window.getComputedStyle(element);
                const bgImage = computedStyle.backgroundImage;
                
                // Verificar se tem background-image válido (não gradient)
                if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
                    this.makeBackgroundImageEditable(element);
                    backgroundCount++;
                }
            });
            
            console.log(`Background images encontradas: ${backgroundCount}`);
        } catch (error) {
            console.warn('Erro ao processar background images:', error);
        }

        // Carrosséis editáveis (mantido para compatibilidade)
        this.setupCarouselEditing(container);

        console.log(`✅ Configuração concluída: ${textCount} textos, ${imageCount} imagens, ${backgroundCount} backgrounds editáveis`);
    
        // Reconectar o observer
        if (this.mutationObserver) {
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
        }
    }

    /**
     * Tornar elemento de texto editável
     */
    makeTextElementEditable(element) {
        // Evitar elementos do próprio editor
        if (element.closest('.hardem-editor-toolbar') || 
            element.closest('.hardem-editor-sidepanel') ||
            element.classList.contains('hardem-editable-element')) {
            return;
        }
        
        element.classList.add('hardem-editable-element');
        
        const dataKey = element.getAttribute('data-key') || this.generateDataKey(element);
        element.setAttribute('data-key', dataKey);
        
        // Não forçar position relative para evitar problemas de layout
        // O elemento manterá sua posição original
        
        // Indicador de data-key removido - não é mais necessário pois já aparece no painel

        // Tooltip
        element.title = `Editar: ${dataKey}`;

        // Eventos de edição inline - usar arrow functions para manter contexto
        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startInlineEditing(element);
        };

        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectElement(element);
        };

        element.addEventListener('dblclick', handleDoubleClick);
        element.addEventListener('click', handleClick);
        
        // Neutralizar efeitos problemáticos
        this.neutralizeElementEffects(element);
        
        console.log(`✅ Elemento editável: ${dataKey}`);
    }

    /**
     * Tornar imagem editável
     */
    makeImageEditable(image) {
        if (image.classList.contains('hardem-editable-element')) return;
        
        image.classList.add('hardem-editable-element');
        
        const dataKey = image.getAttribute('data-key') || this.generateDataKey(image);
        image.setAttribute('data-key', dataKey);

        // Container da imagem
        const container = image.parentElement;
        container.style.position = 'relative';

        // Overlay de upload
        const overlay = document.createElement('div');
        overlay.className = 'hardem-image-overlay';
        overlay.innerHTML = `
            <button class="hardem-upload-btn">
                📤 Upload Imagem
            </button>
        `;
        
        container.appendChild(overlay);

        // Evento de upload
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadImage(image);
        });

        // Evento de clique para painel lateral
        image.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectElement(image);
        });
    }

    /**
     * Configurar edição de carrossel
     */
    setupCarouselEditing(container = document) {
        const swipers = container.querySelectorAll('.swiper');
        swipers.forEach(swiper => {
            const slides = swiper.querySelectorAll('.swiper-slide');
            slides.forEach(slide => {
                // Textos no slide
                const textElements = slide.querySelectorAll(this.editableSelectors.join(','));
                textElements.forEach(el => this.makeTextElementEditable(el));

                // Imagens no slide
                const images = slide.querySelectorAll('img[data-key]');
                images.forEach(img => this.makeImageEditable(img));

                // Background images
                if (slide.style.backgroundImage) {
                    this.makeBackgroundImageEditable(slide);
                }
            });
        });
    }

    /**
     * Tornar background image editável
     */
    makeBackgroundImageEditable(element) {
        // Ignorar elementos do editor
        if (this.isEditorElement(element)) return;
        
        if (element.classList.contains('hardem-editable-element')) return;
        
        element.classList.add('hardem-editable-element');
        
        const dataKey = element.getAttribute('data-key') || this.generateDataKey(element);
        element.setAttribute('data-key', dataKey);

        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectElement(element);
        });

        element.title = `Editar Background: ${dataKey}`;
        
        this.neutralizeElementEffects(element);
        
        console.log(`🖼️ Background editável: ${dataKey} (${element.tagName})`);
    }

    /**
     * Iniciar edição inline de texto
     */
    startInlineEditing(element) {
        const originalContent = element.innerHTML;
        
        element.classList.add('editing');
        element.contentEditable = true;
        element.focus();

        // Selecionar todo o texto
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const finishEditing = () => {
            element.contentEditable = false;
            element.classList.remove('editing');
            
            // Verificar se o campo está vazio
            if (!element.textContent.trim()) {
                element.innerHTML = originalContent;
                this.showAlert('Esse campo não pode ficar vazio!', 'error');
                return;
            }

            // Salvar alteração
            const dataKey = element.getAttribute('data-key');
            this.contentMap[dataKey] = element.textContent || element.innerText;
            this.showAlert('Texto atualizado!', 'success');
        };

        // Eventos para finalizar edição
        element.addEventListener('blur', finishEditing, { once: true });
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                element.blur();
            }
            if (e.key === 'Escape') {
                element.innerHTML = originalContent;
                element.blur();
            }
        });
    }

    /**
     * Selecionar elemento para edição no painel (modo WordPress)
     */
    selectElement(element) {
        this.currentElement = element;
        
        // Abrir painel automaticamente (modo WordPress)
        this.openSidePanel();
        this.populateSidePanel(element);
        
        // Destacar elemento selecionado
        document.querySelectorAll('.hardem-highlight-element').forEach(el => {
            el.classList.remove('hardem-highlight-element');
        });
        element.classList.add('hardem-highlight-element');
        
        // Scroll suave para o elemento se necessário
        const elementRect = element.getBoundingClientRect();
        const isVisible = elementRect.top >= 0 && elementRect.bottom <= window.innerHeight;
        
        if (!isVisible) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
        
        console.log(`🎯 Elemento selecionado: ${element.getAttribute('data-key') || element.tagName}`);
    }

    /**
     * Popular painel lateral com campos de edição
     */
    populateSidePanel(element) {
        const content = document.getElementById('hardem-panel-content');
        const dataKey = element.getAttribute('data-key');
        const tagName = element.tagName.toLowerCase();
        
        // Verificar se é um slide de carrossel
        if (element.classList.contains('swiper-slide')) {
            this.populateCarouselSlidePanel(element, content);
            return;
        }
        
        // Verificar se é um elemento com background-image
        const computedStyle = window.getComputedStyle(element);
        const backgroundImage = computedStyle.backgroundImage;
        const hasBackgroundImage = backgroundImage && backgroundImage !== 'none' && !backgroundImage.includes('gradient');

        let panelHTML = `
            <div class="hardem-editor-info">
                <strong>Data-key:</strong> ${dataKey}<br>
                <strong>Elemento:</strong> &lt;${tagName}&gt;${element.className ? '.' + element.className.split(' ').join('.') : ''}
            </div>
        `;

        if (tagName === 'img') {
            // Seção de edição de imagem normal
            panelHTML += `
                <div class="hardem-editor-section hardem-editor-type-image">
                    <div class="hardem-editor-section-header">
                        <span>Imagem</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <div class="hardem-editor-field">
                            <label>Preview:</label>
                            <img src="${element.src}" class="hardem-editor-image-preview" alt="Preview">
                        </div>
                        <div class="hardem-editor-field">
                            <label>Texto Alternativo:</label>
                            <input type="text" id="hardem-alt-text" value="${element.alt}" placeholder="Descrição da imagem">
                        </div>
                        <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadImageFromPanel()">
                            Trocar Imagem
                        </button>
                    </div>
                </div>
            `;
        } else if (hasBackgroundImage) {
            // Seção de edição de background image
            const bgUrl = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
            const imageSrc = bgUrl ? bgUrl[1] : '';
            
            panelHTML += `
                <div class="hardem-editor-section hardem-editor-type-background">
                    <div class="hardem-editor-section-header">
                        <span>Background</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <div class="hardem-editor-field">
                            <label>Preview:</label>
                            ${imageSrc ? `<img src="${imageSrc}" class="hardem-editor-image-preview" alt="Background Preview">` : '<p style="color: #999;">Preview não disponível</p>'}
                        </div>
                        <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadBackgroundFromPanel()">
                            Trocar Background
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Seção de edição de texto
            const textContent = this.getDirectTextContent(element);
            
            panelHTML += `
                <div class="hardem-editor-section hardem-editor-type-text">
                    <div class="hardem-editor-section-header">
                        <span>Conteúdo de Texto</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <div class="hardem-editor-field">
                            <label>Texto atual:</label>
                            <div style="background: #f8f9fa; padding: 6px 8px; border-radius: 4px; font-size: 12px; color: #666; margin-bottom: 6px; border: 1px solid #e9ecef;">
                                "${textContent || 'Sem texto'}"
                            </div>
                        </div>
                        <div class="hardem-editor-field">
                            <label>Novo conteúdo:</label>
                            <textarea id="hardem-text-content" rows="3" placeholder="Digite o novo conteúdo...">${textContent}</textarea>
                        </div>
                    </div>
                </div>
            `;
        }

        // Seção de ações
        panelHTML += `
            <div class="hardem-editor-section">
                <div class="hardem-editor-section-header">
                    <span>Ações</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="hardem-editor-section-content">
                    <button class="hardem-editor-btn-primary" onclick="window.hardemEditor.applyPanelChanges()">
                        Aplicar Alterações
                    </button>
                    <button class="hardem-editor-btn-outline" onclick="window.hardemEditor.highlightElement()">
                        Destacar Elemento
                    </button>
                </div>
            </div>
        `;

        content.innerHTML = panelHTML;
        
        // Adicionar funcionalidade de accordion
        this.setupAccordion();
    }

    /**
     * Popular painel lateral para slides de carrossel
     */
    populateCarouselSlidePanel(slideElement, content) {
        const slideDataKey = slideElement.getAttribute('data-key') || 'slide_sem_key';
        
        // Encontrar todos os elementos com data-key dentro do slide
        const editableElements = slideElement.querySelectorAll('[data-key]');
        
        // Encontrar elementos com background-image (incluindo o próprio slide)
        const backgroundElements = [];
        
        // Verificar o próprio slide
        const slideStyle = window.getComputedStyle(slideElement);
        const slideBgImage = slideStyle.backgroundImage;
        if (slideBgImage && slideBgImage !== 'none' && !slideBgImage.includes('gradient')) {
            backgroundElements.push({
                element: slideElement,
                dataKey: slideElement.getAttribute('data-key') || 'slide_background',
                backgroundImage: slideBgImage
            });
        }
        
        // Verificar elementos filhos com background-image
        const allElements = slideElement.querySelectorAll('*');
        allElements.forEach(el => {
            const bgImage = window.getComputedStyle(el).backgroundImage;
            if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
                const dataKey = el.getAttribute('data-key') || this.generateDataKey(el);
                el.setAttribute('data-key', dataKey);
                backgroundElements.push({
                    element: el,
                    dataKey: dataKey,
                    backgroundImage: bgImage
                });
            }
        });
        
        const totalElements = editableElements.length + backgroundElements.length;
        
        let panelHTML = `
            <div class="hardem-editor-info">
                <strong>Slide:</strong> ${slideDataKey}<br>
                <strong>Contexto:</strong> Carrossel<br>
                <strong>Elementos:</strong> ${editableElements.length} editáveis, ${backgroundElements.length} backgrounds
            </div>
        `;

        if (totalElements === 0) {
            panelHTML += `
                <div style="text-align: center; color: #999; padding: 20px;">
                    Nenhum elemento editável encontrado neste slide.
                </div>
            `;
        } else {
            let elementIndex = 0;
            
            // Seção de backgrounds
            if (backgroundElements.length > 0) {
                panelHTML += `
                    <div class="hardem-editor-section hardem-editor-type-background">
                        <div class="hardem-editor-section-header">
                            <span>Backgrounds (${backgroundElements.length})</span>
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="hardem-editor-section-content">
                `;
                
                backgroundElements.forEach((bgInfo) => {
                    const bgUrl = bgInfo.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
                    const imageSrc = bgUrl ? bgUrl[1] : '';
                    
                    panelHTML += `
                        <div class="hardem-editor-field" style="border: 1px solid #6f42c1; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
                            <label style="color: #6f42c1; font-weight: 500;">Background</label>
                            <div style="background: #f8f5ff; padding: 4px 6px; border-radius: 3px; font-size: 11px; color: #666; margin: 4px 0;">
                                Data-key: ${bgInfo.dataKey}
                            </div>
                            <div style="background: #f8f5ff; padding: 4px 6px; border-radius: 3px; font-size: 11px; color: #666; margin: 4px 0;">
                                Elemento: &lt;${bgInfo.element.tagName.toLowerCase()}&gt;
                            </div>
                            ${imageSrc ? `<img src="${imageSrc}" class="hardem-editor-image-preview" alt="Background Preview">` : '<p style="color: #999; margin: 5px 0;">Preview não disponível</p>'}
                            <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadSlideBackground(${elementIndex})" style="background: #6f42c1;">
                                Trocar Background
                            </button>
                        </div>
                    `;
                    elementIndex++;
                });
                
                panelHTML += `
                        </div>
                    </div>
                `;
            }
            
            // Seção de imagens
            const imageElements = Array.from(editableElements).filter(el => el.tagName.toLowerCase() === 'img');
            if (imageElements.length > 0) {
                panelHTML += `
                    <div class="hardem-editor-section hardem-editor-type-image">
                        <div class="hardem-editor-section-header">
                            <span>Imagens (${imageElements.length})</span>
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="hardem-editor-section-content">
                `;
                
                imageElements.forEach((element) => {
                    const elementDataKey = element.getAttribute('data-key');
                    
                    panelHTML += `
                        <div class="hardem-editor-field" style="border: 1px solid #dc3545; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
                            <label style="color: #dc3545; font-weight: 500;">Imagem</label>
                            <div style="background: #fff5f5; padding: 4px 6px; border-radius: 3px; font-size: 11px; color: #666; margin: 4px 0;">
                                Data-key: ${elementDataKey}
                            </div>
                            <img src="${element.src}" class="hardem-editor-image-preview" alt="Preview">
                            <div style="margin: 6px 0;">
                                <label style="font-size: 11px; color: #666;">Texto alternativo atual:</label>
                                <div style="background: #f8f9fa; padding: 4px 6px; border-radius: 3px; font-size: 11px; margin: 2px 0;">
                                    "${element.alt || 'Sem texto alternativo'}"
                                </div>
                            </div>
                            <input type="text" id="slide-alt-${elementIndex}" value="${element.alt || ''}" placeholder="Novo texto alternativo" style="margin: 6px 0;">
                            <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadSlideImage(${elementIndex})">
                                Trocar Imagem
                            </button>
                        </div>
                    `;
                    elementIndex++;
                });
                
                panelHTML += `
                        </div>
                    </div>
                `;
            }
            
            // Seção de textos
            const textElements = Array.from(editableElements).filter(el => el.tagName.toLowerCase() !== 'img');
            if (textElements.length > 0) {
                panelHTML += `
                    <div class="hardem-editor-section hardem-editor-type-text">
                        <div class="hardem-editor-section-header">
                            <span>Textos (${textElements.length})</span>
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="hardem-editor-section-content">
                `;
                
                textElements.forEach((element) => {
                    const elementDataKey = element.getAttribute('data-key');
                    const elementTag = element.tagName.toLowerCase();
                    const elementType = elementTag === 'h1' || elementTag === 'h2' || elementTag === 'h3' || 
                                      elementTag === 'h4' || elementTag === 'h5' || elementTag === 'h6' ? 'Título' : 
                                      elementTag === 'p' ? 'Parágrafo' : 'Texto';
                    const textContent = this.getDirectTextContent(element);
                    
                    panelHTML += `
                        <div class="hardem-editor-field" style="border: 1px solid #007bff; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
                            <label style="color: #007bff; font-weight: 500;">${elementType}</label>
                            <div style="background: #f8f9ff; padding: 4px 6px; border-radius: 3px; font-size: 11px; color: #666; margin: 4px 0;">
                                Data-key: ${elementDataKey}
                            </div>
                            <div style="background: #f8f9fa; padding: 4px 6px; border-radius: 3px; font-size: 11px; color: #666; margin: 4px 0;">
                                Atual: "${textContent || 'Sem texto'}"
                            </div>
                            <textarea id="slide-text-${elementIndex}" rows="2" placeholder="Digite o novo conteúdo...">${textContent}</textarea>
                        </div>
                    `;
                    elementIndex++;
                });
                
                panelHTML += `
                        </div>
                    </div>
                `;
            }

            // Seção de ações
            panelHTML += `
                <div class="hardem-editor-section">
                    <div class="hardem-editor-section-header">
                        <span>Ações</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <button class="hardem-editor-btn-primary" onclick="window.hardemEditor.applySlideChanges()">
                            Aplicar Todas as Alterações
                        </button>
                        <button class="hardem-editor-btn-outline" onclick="window.hardemEditor.highlightElement()">
                            Destacar Slide
                        </button>
                    </div>
                </div>
            `;
        }

        content.innerHTML = panelHTML;
        
        // Armazenar referência dos elementos para uso posterior
        this.currentSlideElements = Array.from(editableElements);
        this.currentSlideBackgrounds = backgroundElements;
        
        // Adicionar funcionalidade de accordion
        this.setupAccordion();
    }

    /**
     * Aplicar alterações do painel
     */
    applyPanelChanges() {
        if (!this.currentElement) return;

        const tagName = this.currentElement.tagName.toLowerCase();
        const dataKey = this.currentElement.getAttribute('data-key');

        if (tagName === 'img') {
            const altText = document.getElementById('hardem-alt-text')?.value;
            if (altText !== undefined) {
                this.currentElement.alt = altText;
                this.contentMap[dataKey] = {
                    src: this.currentElement.src,
                    alt: altText
                };
            }
        } else {
            const textContent = document.getElementById('hardem-text-content')?.value;
            if (textContent !== undefined) {
                if (!textContent.trim()) {
                    this.showAlert('O conteúdo não pode ficar vazio!', 'error');
                    return;
                }
                this.currentElement.textContent = textContent;
                this.contentMap[dataKey] = textContent;
            }
        }

        this.showAlert('Alterações aplicadas!', 'success');
    }

    /**
     * Aplicar alterações de todos os elementos do slide
     */
    applySlideChanges() {
        if ((!this.currentSlideElements || this.currentSlideElements.length === 0) && 
            (!this.currentSlideBackgrounds || this.currentSlideBackgrounds.length === 0)) {
            this.showAlert('Nenhum elemento de slide para atualizar!', 'error');
            return;
        }

        let updatedCount = 0;
        let elementIndex = 0;
        
        // Primeiro, processar backgrounds (se houver)
        if (this.currentSlideBackgrounds) {
            this.currentSlideBackgrounds.forEach((bgInfo) => {
                // Backgrounds são apenas visuais, não há campos para atualizar além do upload
                // Mas contamos eles no índice
                elementIndex++;
            });
        }
        
        // Depois, processar elementos normais
        if (this.currentSlideElements) {
            this.currentSlideElements.forEach((element) => {
                const elementTag = element.tagName.toLowerCase();
                const dataKey = element.getAttribute('data-key');
                
                if (elementTag === 'img') {
                    // Atualizar alt da imagem
                    const altInput = document.getElementById(`slide-alt-${elementIndex}`);
                    if (altInput && altInput.value !== element.alt) {
                        element.alt = altInput.value;
                        this.contentMap[dataKey] = {
                            src: element.src,
                            alt: altInput.value
                        };
                        updatedCount++;
                    }
                    elementIndex++;
                } else {
                    // Atualizar texto
                    const textArea = document.getElementById(`slide-text-${elementIndex}`);
                    if (textArea && textArea.value.trim()) {
                        if (textArea.value !== element.textContent) {
                            element.textContent = textArea.value;
                            this.contentMap[dataKey] = textArea.value;
                            updatedCount++;
                        }
                    } else if (textArea && !textArea.value.trim()) {
                        this.showAlert(`Campo "${dataKey}" não pode ficar vazio!`, 'error');
                        return;
                    }
                    elementIndex++;
                }
            });
        }

        if (updatedCount > 0) {
            this.showAlert(`${updatedCount} elemento(s) do slide atualizados!`, 'success');
        } else {
            this.showAlert('Nenhuma alteração detectada.', 'success');
        }
    }

    /**
     * Upload de imagem
     */
    uploadImage(imgElement) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const newSrc = e.target.result;
                
                // Preview antes de aplicar
                if (confirm('Deseja substituir a imagem atual?')) {
                    imgElement.src = newSrc;
                    const dataKey = imgElement.getAttribute('data-key');
                    this.contentMap[dataKey] = {
                        src: newSrc,
                        alt: imgElement.alt
                    };
                    this.showAlert('Imagem atualizada!', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    }

    /**
     * Upload de imagem pelo painel
     */
    uploadImageFromPanel() {
        if (!this.currentElement || this.currentElement.tagName.toLowerCase() !== 'img') return;
        this.uploadImage(this.currentElement);
        
        // Atualizar preview no painel
        setTimeout(() => {
            const preview = document.querySelector('.hardem-editor-image-preview');
            if (preview) {
                preview.src = this.currentElement.src;
            }
        }, 100);
    }

    /**
     * Upload de background image pelo painel
     */
    uploadBackgroundFromPanel() {
        if (!this.currentElement) return;
        this.uploadBackgroundImage(this.currentElement);
        
        // Atualizar preview no painel após upload
        setTimeout(() => {
            this.populateSidePanel(this.currentElement);
        }, 500);
    }

    /**
     * Upload de background image
     */
    uploadBackgroundImage(element) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const newSrc = e.target.result;
                
                if (confirm('Deseja substituir o background atual?')) {
                    element.style.backgroundImage = `url(${newSrc})`;
                    const dataKey = element.getAttribute('data-key');
                    this.contentMap[dataKey] = {
                        backgroundImage: newSrc
                    };
                    this.showAlert('Background atualizado!', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    }

    /**
     * Upload de imagem específica do slide
     */
    uploadSlideImage(index) {
        if (!this.currentSlideElements || !this.currentSlideElements[index]) {
            this.showAlert('Elemento não encontrado!', 'error');
            return;
        }

        const imgElement = this.currentSlideElements[index];
        if (imgElement.tagName.toLowerCase() !== 'img') {
            this.showAlert('Elemento não é uma imagem!', 'error');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const newSrc = e.target.result;
                
                if (confirm('Deseja substituir esta imagem do slide?')) {
                    imgElement.src = newSrc;
                    const dataKey = imgElement.getAttribute('data-key');
                    this.contentMap[dataKey] = {
                        src: newSrc,
                        alt: imgElement.alt
                    };
                    
                    // Atualizar preview no painel
                    const preview = document.querySelector(`#slide-alt-${index}`).previousElementSibling;
                    if (preview && preview.tagName.toLowerCase() === 'img') {
                        preview.src = newSrc;
                    }
                    
                    this.showAlert('Imagem do slide atualizada!', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    }

    /**
     * Upload de background image específica do slide
     */
    uploadSlideBackground(index) {
        if (!this.currentSlideBackgrounds || !this.currentSlideBackgrounds[index]) {
            this.showAlert('Background não encontrado!', 'error');
            return;
        }

        const bgInfo = this.currentSlideBackgrounds[index];
        const element = bgInfo.element;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const newSrc = e.target.result;
                
                if (confirm('Deseja substituir este background do slide?')) {
                    // Atualizar background-image
                    element.style.backgroundImage = `url(${newSrc})`;
                    
                    // Salvar no contentMap
                    const dataKey = bgInfo.dataKey;
                    this.contentMap[dataKey] = {
                        backgroundImage: newSrc
                    };
                    
                    // Atualizar preview no painel
                    const previews = document.querySelectorAll('.hardem-editor-image-preview');
                    previews.forEach(preview => {
                        if (preview.alt === 'Background Preview' && preview.style.border.includes('#9b59b6')) {
                            preview.src = newSrc;
                        }
                    });
                    
                    this.showAlert('Background do slide atualizado!', 'success');
                    
                    // Reabrir o painel para mostrar a nova imagem
                    setTimeout(() => {
                        this.populateCarouselSlidePanel(this.currentElement, document.getElementById('hardem-panel-content'));
                    }, 500);
                }
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    }

    /**
     * Desabilitar edição
     */
    disableEditing() {
        document.querySelectorAll('.hardem-editable-element').forEach(element => {
            element.classList.remove('hardem-editable-element', 'editing', 'hardem-highlight-element');
            element.contentEditable = false;
            element.removeAttribute('title');
            
            // Restaurar efeitos originais
            this.restoreElementEffects(element);
            
            // Indicador de data-key removido - não há mais necessidade de limpeza

            // Remover overlays
            const overlay = element.querySelector('.hardem-image-overlay');
            if (overlay) overlay.remove();
        });
    }

    /**
     * Abrir painel lateral
     */
    openSidePanel() {
        this.sidePanel.classList.add('visible');
    }

    /**
     * Fechar painel lateral
     */
    closeSidePanel() {
        this.sidePanel.classList.remove('visible');
        
        // Remover destaque do elemento
        document.querySelectorAll('.hardem-highlight-element').forEach(el => {
            el.classList.remove('hardem-highlight-element');
        });
        
        this.currentElement = null;
    }

    /**
     * Toggle painel lateral
     */
    toggleSidePanel() {
        if (this.sidePanel.classList.contains('visible')) {
            this.closeSidePanel();
        } else {
            this.openSidePanel();
        }
    }

    /**
     * Salvar conteúdo no localStorage e servidor
     */
    saveContent() {
        try {
            // Salvar no localStorage primeiro (backup local)
            localStorage.setItem('siteContent', JSON.stringify(this.contentMap));
            
            // Preparar dados para envio ao servidor
            const saveData = {
                contentMap: this.contentMap,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            // Tentar salvar no servidor
            fetch('save.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(saveData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    this.showAlert(`✅ ${data.message}`, 'success');
                    console.log('💾 Conteúdo salvo no servidor:', data);
                } else {
                    this.showAlert(`❌ Erro no servidor: ${data.message}`, 'error');
                    console.error('Erro do servidor:', data);
                }
            })
            .catch(error => {
                console.warn('Servidor não disponível, usando apenas localStorage:', error);
                this.showAlert('💾 Conteúdo salvo localmente (servidor offline)', 'success');
            });
            
            console.log('💾 Conteúdo salvo localmente:', this.contentMap);
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showAlert('❌ Erro ao salvar conteúdo!', 'error');
        }
    }

    /**
     * Carregar conteúdo do localStorage
     */
    loadContent() {
        try {
            const saved = localStorage.getItem('siteContent');
            if (saved) {
                const parsedContent = JSON.parse(saved);
                if (typeof parsedContent === 'object' && parsedContent !== null) {
                    this.contentMap = parsedContent;
                    console.log('📂 Conteúdo carregado do localStorage:', this.contentMap);
                    
                    if (Object.keys(this.contentMap).length > 0) {
                        // Primeira tentativa após 500ms
                        setTimeout(() => {
                            console.log("HardemEditor: Primeira tentativa de aplicar conteúdo");
                            this.applyLoadedContent();
                            
                            // Segunda tentativa após 1.5s
                            setTimeout(() => {
                                console.log("HardemEditor: Segunda tentativa de aplicar conteúdo");
                                this.applyLoadedContent();
                                
                                // Terceira tentativa após 3s
                                setTimeout(() => {
                                    console.log("HardemEditor: Terceira tentativa de aplicar conteúdo");
                                    this.applyLoadedContent();
                                    
                                    // Verificação final
                                    this.verifyBackgroundsApplied();
                                }, 1500);
                            }, 1500);
                        }, 500);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar conteúdo:', error);
            localStorage.removeItem('siteContent');
            this.contentMap = {};
        }
    }

    /**
     * Verificar se os backgrounds foram aplicados corretamente
     */
    verifyBackgroundsApplied() {
        console.log("HardemEditor: Verificando backgrounds aplicados...");
        
        Object.entries(this.contentMap).forEach(([dataKey, content]) => {
            if (typeof content === 'object' && content !== null && content.backgroundImage) {
                const element = document.querySelector(`[data-key="${dataKey}"]`);
                
                if (!element) {
                    console.warn(`HardemEditor: Elemento ainda não encontrado para ${dataKey}`);
                    // Tentar buscar por outros atributos ou classes específicas
                    const possibleElements = document.querySelectorAll('*');
                    possibleElements.forEach(el => {
                        // Ignorar elementos do editor
                        if (this.isEditorElement(el)) return;
                        
                        if (!el.hasAttribute('data-key')) {
                            const computedStyle = window.getComputedStyle(el);
                            if (computedStyle.backgroundImage.includes(content.backgroundImage.substring(0, 20))) {
                                console.log(`HardemEditor: Encontrado elemento sem data-key com background correspondente`);
                                el.setAttribute('data-key', dataKey);
                                this.ensureBackgroundApplied(el, content.backgroundImage);
                            }
                        }
                    });
                } else if (!this.isEditorElement(element)) {
                    const computedStyle = window.getComputedStyle(element);
                    if (!computedStyle.backgroundImage.includes('data:image')) {
                        console.log(`HardemEditor: Reaplicando background para ${dataKey}`);
                        this.ensureBackgroundApplied(element, content.backgroundImage);
                    }
                }
            }
        });
    }

    /**
     * Aplicar conteúdo carregado
     */
    applyLoadedContent() {
        console.log("HardemEditor: Executando applyLoadedContent");
        
        Object.entries(this.contentMap).forEach(([dataKey, content]) => {
            let element = document.querySelector(`[data-key="${dataKey}"]`);
            
            // Se não encontrar pelo data-key, tentar encontrar por outros meios
            if (!element && typeof content === 'object' && content.backgroundImage) {
                console.log(`HardemEditor: Tentando encontrar elemento para ${dataKey} por outros meios`);
                
                // Procurar em todos os elementos que podem ter background
                document.querySelectorAll('*').forEach(el => {
                    // Ignorar elementos do editor
                    if (this.isEditorElement(el)) return;
                    
                    if (!el.hasAttribute('data-key')) {
                        const computedStyle = window.getComputedStyle(el);
                        // Se o elemento tem background e não tem data-key, pode ser nosso alvo
                        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
                            el.setAttribute('data-key', dataKey);
                            element = el;
                            console.log(`HardemEditor: Elemento encontrado e marcado com data-key ${dataKey}`);
                        }
                    }
                });
            }

            // Verificar se o elemento encontrado não é parte do editor
            if (element && this.isEditorElement(element)) {
                console.log(`HardemEditor: Ignorando elemento do editor para ${dataKey}`);
                return;
            }

            if (!element) {
                console.warn(`HardemEditor: Elemento não encontrado para dataKey: ${dataKey}`);
                return;
            }

            try {
                if (element.tagName.toLowerCase() === 'img') {
                    if (typeof content === 'object' && content !== null) {
                        if (content.src) element.src = content.src;
                        if (content.alt) element.alt = content.alt;
                    }
                } else if (typeof content === 'object' && content !== null && content.backgroundImage) {
                    console.log(`HardemEditor: Aplicando background para ${dataKey}`);
                    this.ensureBackgroundApplied(element, content.backgroundImage);
                } else if (typeof content === 'string' && content.trim()) {
                    element.textContent = content;
                }
            } catch (error) {
                console.warn(`Erro ao aplicar conteúdo para ${dataKey}:`, error);
            }
        });
    }

    /**
     * Aplicar background com garantia
     * @param {HTMLElement} element - Elemento para aplicar o background
     * @param {string} backgroundImage - URL da imagem em formato data URL
     */
    ensureBackgroundApplied(element, backgroundImage) {
        if (!element || !backgroundImage) return;

        console.log(`HardemEditor: Garantindo aplicação de background`);
        console.log(`- Elemento:`, element.tagName);
        console.log(`- Background URL (início):`, backgroundImage.substring(0, 50) + "...");

        // Limpar qualquer background existente
        element.style.removeProperty('background-image');
        
        // Aplicar o novo background de várias formas
        const bgUrl = `url("${backgroundImage}")`;
        
        // Método 1: Direto
        element.style.backgroundImage = bgUrl;
        
        // Método 2: Com !important
        element.style.setProperty('background-image', bgUrl, 'important');
        
        // Método 3: Via CSS inline completo
        const bgStyles = `
            background-image: ${bgUrl} !important;
            background-repeat: no-repeat !important;
            background-position: center center !important;
            background-size: cover !important;
        `;
        element.setAttribute('style', element.getAttribute('style') + ';' + bgStyles);
        
        // Forçar repaint
        void element.offsetHeight;
        
        // Verificar se foi aplicado
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(element);
            console.log(`- Background computado:`, computedStyle.backgroundImage);
            
            // Se ainda não foi aplicado, tentar uma última vez
            if (!computedStyle.backgroundImage.includes(backgroundImage.substring(0, 20))) {
                console.warn(`- Background não detectado, tentando novamente...`);
                element.style.cssText += bgStyles;
            }
        }, 100);

        // Marcar como processado
        element.setAttribute('data-bg-processed', 'true');
    }

    /**
     * Mostrar alerta
     */
    showAlert(message, type = 'error') {
        const alert = document.createElement('div');
        alert.className = `hardem-editor-alert ${type === 'success' ? 'success' : ''}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => alert.classList.add('show'), 100);
        
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    /**
     * Gerar data-key único
     */
    generateDataKey(element) {
        const tagName = element.tagName.toLowerCase();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `${tagName}_${timestamp}_${random}`;
    }

    /**
     * Destruir editor
     */
    destroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Resetar modo estático se ativo
        if (this.staticMode) {
            this.toggleStaticMode();
        }
        
        this.disableEditing();
        
        if (this.toolbar) this.toolbar.remove();
        if (this.sidePanel) this.sidePanel.remove();
        
        document.getElementById('hardem-editor-styles')?.remove();
        
        document.body.classList.remove('hardem-edit-mode', 'hardem-static-mode');
        
        console.log('🗑️ HARDEM Editor destruído');
    }

    /**
     * Destacar elemento selecionado
     */
    highlightElement() {
        if (!this.currentElement) return;

        this.currentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

        // Efeito de destaque temporário
        this.currentElement.style.animation = 'hardemFadeIn 0.5s ease 3';
        setTimeout(() => {
            this.currentElement.style.animation = '';
        }, 1500);
    }

    /**
     * Configurar funcionalidade de accordion para seções colapsáveis
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
     * Controla o estado de pausa/resumo das bibliotecas de animação JS.
     * @param {boolean} shouldPause True para pausar, false para resumir.
     */
    _updateAnimationLibrariesState(shouldPause) {
        if (shouldPause) {
            console.log("HARDEM Editor: Pausando bibliotecas de animação JS...");
            // Pausar Swiper carousels
            if (window.Swiper) {
                document.querySelectorAll('.swiper').forEach(swiperEl => {
                    if (swiperEl.swiper) {
                        if (swiperEl.swiper.autoplay && swiperEl.swiper.autoplay.running) {
                            swiperEl.swiper.autoplay.stop();
                        }
                        swiperEl.swiper.disable(); // Desabilita interação do usuário também
                    }
                });
            }
            
            // Pausar animações do AOS (tentativa de parar e manter estado)
            if (window.AOS) {
                document.querySelectorAll('[data-aos]').forEach(el => {
                    el.classList.add('aos-animate'); // Manter estado visual se já animado
                    el.style.setProperty('animation', 'none', 'important');
                    el.style.setProperty('transition', 'none', 'important');
                    // Guardar um sinalizador de que foi pausado por nós
                    el.dataset.hardemAosPaused = 'true';
                });
            }
            
            // Pausar Owl Carousels e outros carrosséis genéricos
            if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
                document.querySelectorAll('.owl-carousel').forEach(el => {
                    const $el = jQuery(el);
                    if ($el.data('owl.carousel')) {
                        try {
                            $el.trigger('stop.owl.autoplay');
                        } catch (e) { console.warn('Erro ao pausar Owl Carousel via jQuery:', e); }
                    }
                });
            }
        } else {
            // Só resumir se o modo estático não estiver ativo (evitar conflito)
            if (this.staticMode) {
                console.log("HARDEM Editor: Modo estático ainda ativo, não resumindo bibliotecas JS.");
                return;
            }
            console.log("HARDEM Editor: Resumindo bibliotecas de animação JS...");
            // Reativar Swiper carousels
            if (window.Swiper) {
                document.querySelectorAll('.swiper').forEach(swiperEl => {
                    if (swiperEl.swiper) {
                        swiperEl.swiper.enable();
                        if (swiperEl.swiper.autoplay) {
                            if(swiperEl.swiper.params.autoplay && swiperEl.swiper.params.autoplay.delay) {
                                swiperEl.swiper.autoplay.start();
                            }
                        }
                    }
                });
            }
            
            // Reativar AOS animations
            if (window.AOS) {
                document.querySelectorAll('[data-aos][data-hardem-aos-paused]').forEach(el => {
                    el.style.removeProperty('animation');
                    el.style.removeProperty('transition');
                    delete el.dataset.hardemAosPaused;
                });
                // Delay refreshHard para garantir que a remoção de estilos foi processada
                setTimeout(() => {
                    window.AOS.refreshHard();
                    console.log("HARDEM Editor: AOS.refreshHard() chamado após resumir.");
                }, 0);
            }
            
            // Reativar Owl Carousels e outros
            if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
                document.querySelectorAll('.owl-carousel').forEach(el => {
                    const $el = jQuery(el);
                    if ($el.data('owl.carousel')) {
                        try {
                            $el.trigger('play.owl.autoplay');
                        } catch (e) { console.warn('Erro ao reativar Owl Carousel via jQuery:', e); }
                    }
                });
            }
        }
    }

    /**
     * Toggle modo estático (pausar animações e carrosséis)
     */
    toggleStaticMode() {
        this.staticMode = !this.staticMode;
        const toggleBtn = document.getElementById('hardem-toggle-static');
        
        if (this.staticMode) {
            // Ativar modo estático
            toggleBtn.innerHTML = '▶️ Ativar Animações'; 
            toggleBtn.classList.add('active');
            document.body.classList.add('hardem-static-mode');
            this._updateAnimationLibrariesState(true); // PAUSAR
            this.showAlert('Animações e interações pausadas! Modo de edição focado.', 'success');
        } else {
            // Desativar modo estático
            toggleBtn.innerHTML = '⏸️ Pausar Animações'; 
            toggleBtn.classList.remove('active');
            document.body.classList.remove('hardem-static-mode');
            this._updateAnimationLibrariesState(false); // RESUMIR
            this.showAlert('Animações e interações reativadas!', 'success');
        }
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
            element.style.setProperty('animation-play-state', 'paused', 'important'); // Reforço
            
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
     * Exportar conteúdo para servidor (save.php)
     */
    exportToServer() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                content: this.contentMap,
                metadata: {
                    userAgent: navigator.userAgent,
                    totalElements: Object.keys(this.contentMap).length,
                    editMode: this.editMode
                }
            };

            // Preparar dados para envio
            const formData = new FormData();
            formData.append('action', 'save_content');
            formData.append('data', JSON.stringify(exportData));

            // Enviar para save.php (implementação futura)
            fetch('save.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.showAlert('Conteúdo publicado com sucesso!', 'success');
                } else {
                    this.showAlert('Erro ao publicar: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.warn('Save.php não encontrado, usando apenas localStorage:', error);
                this.showAlert('Conteúdo salvo localmente (save.php não configurado)', 'success');
            });

            console.log('📤 Dados preparados para exportação:', exportData);
            return exportData;
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showAlert('Erro ao exportar conteúdo!', 'error');
        }
    }

    /**
     * Função Debounce
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
     * Verificar se o elemento é parte do editor
     * @param {HTMLElement} element - Elemento para verificar
     * @returns {boolean} - True se o elemento for parte do editor
     */
    isEditorElement(element) {
        return element.closest('.hardem-editor-toolbar') !== null ||
               element.closest('.hardem-editor-sidepanel') !== null ||
               element.classList.contains('hardem-editor-toolbar') ||
               element.classList.contains('hardem-editor-sidepanel') ||
               element.classList.contains('hardem-editor-btn') ||
               element.classList.contains('hardem-editor-controls') ||
               element.hasAttribute('id') && (
                   element.id.startsWith('hardem-') ||
                   element.id.includes('editor')
               );
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que todos os scripts carregaram
    setTimeout(() => {
        if (!window.hardemEditor) {
            window.hardemEditor = new HardemEditor();
            console.log('🎯 HARDEM Editor inicializado via DOMContentLoaded');
        }
    }, 100);
});

// Backup: também inicializar quando a página carregar completamente
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.hardemEditor) {
            window.hardemEditor = new HardemEditor();
            console.log('🎯 HARDEM Editor inicializado via window.load');
        }
    }, 200);
});

// Backup adicional: inicialização manual se necessário
if (document.readyState === 'loading') {
    // DOM ainda carregando, aguardar DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!window.hardemEditor) {
                window.hardemEditor = new HardemEditor();
                console.log('🎯 HARDEM Editor inicializado via readyState check');
            }
        }, 50);
    });
} else {
    // DOM já carregado, inicializar imediatamente
    setTimeout(() => {
        if (!window.hardemEditor) {
            window.hardemEditor = new HardemEditor();
            console.log('🎯 HARDEM Editor inicializado imediatamente');
        }
    }, 50);
}

// Exportar para uso global
window.HardemEditor = HardemEditor; 