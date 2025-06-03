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

                /* ===== PAINEL DE ELEMENTOS SOBREPOSTOS ===== */
                .overlapping-elements-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding-right: 5px;
                }

                .overlapping-element-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .overlapping-element-item:hover {
                    border-color: #3498db;
                    background: #f0f8ff;
                    transform: translateY(-1px);
                }

                .element-icon {
                    font-size: 18px;
                }

                .element-info {
                    flex: 1;
                }

                .element-type {
                    font-size: 12px;
                    color: #666;
                    font-family: monospace;
                }

                .element-preview {
                    font-size: 13px;
                    color: #333;
                    max-width: 180px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .element-indicator {
                    width: 20px;
                    height: 20px;
                    background: #3498db;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: bold;
                }

                /* Desativar efeitos hover em elementos selecionados */
                .hardem-disable-hover,
                .hardem-disable-hover:hover,
                .hardem-disable-hover * {
                    animation: none !important;
                    transition: none !important;
                    transform: none !important;
                }

                .hardem-disable-hover [class*="hidden-content"],
                .hardem-disable-hover [class*="overlay"],
                .hardem-disable-hover [class*="hover"] {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                
                 /* Indicador de processamento */
                .hardem-editor-processing {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    z-index: 999999;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    transition: opacity 0.3s ease;
                }

                .hardem-editor-processing.fade-out {
                    opacity: 0;
                }

                .processing-spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s linear infinite;
                }

                .processing-message {
                    font-size: 14px;
                    font-weight: 500;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
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
        
        // NOVO: Verificar explicitamente se é um container de serviço
        if (this.isServiceMenuContainer(element)) {
            console.log('Ignorando container de serviço:', element);
            return; // Não tornar editável
        }
        
        // Verificar se está no header, para aplicar regras específicas
        const isInHeader = element.closest('header') !== null;
        
        if (isInHeader) {
            // Verificar elementos de navegação que não devem ser editáveis
            if (element.classList.contains('header-bottom') ||
                element.classList.contains('nav-area') || 
                element.classList.contains('main-nav') || 
                element.classList.contains('submenu') ||
                element.classList.contains('rts-mega-menu')) {
                return; // Não tornar editável
            }
            
            // Para links no header, verificar se são links de navegação complexos (com dropdown)
            if (element.tagName === 'A' && (
                element.classList.contains('has-dropdown') || 
                element.querySelector('.rts-mega-menu') || 
                element.querySelector('.submenu'))) {
                
                // Verificar se é um container de dropdown (não deve ser editável)
                if (element.querySelector('.rts-mega-menu') || element.querySelector('.submenu')) {
                    return; // Não tornar editável
                }
            }
        }
        
        element.classList.add('hardem-editable-element');
        
        const dataKey = element.getAttribute('data-key') || this.generateDataKey(element);
        element.setAttribute('data-key', dataKey);
        
        // Tooltip
        element.title = `Editar: ${dataKey}`;

        // Eventos de edição inline - usar arrow functions para manter contexto
        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startInlineEditing(element);
        };

        // Substituir o evento de clique pelo nosso novo manipulador
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleElementClick(e);
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
        // Verificar se é parte de um carrossel primeiro
        if (this.handleCarouselElement(element)) {
            return;
        }
        
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

        // Cabeçalho melhorado com informações mais claras
        let panelHTML = `
            <div class="hardem-editor-info" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">✏️ Editor de Elemento</h3>
                <div style="opacity: 0.9; font-size: 13px;">
                    <strong>Tipo:</strong> ${this.getElementTypeDescription(element)}<br>
                    <strong>Identificador:</strong> ${dataKey}<br>
                    <strong>Localização:</strong> ${this.getElementLocation(element)}
                </div>
            </div>
        `;
        
        if (tagName === 'img') {
            // Seção de edição de imagem normal
            panelHTML += `
                <div class="hardem-editor-section hardem-editor-type-image">
                    <div class="hardem-editor-section-header">
                        <span>🖼️ Edição de Imagem</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <div class="hardem-editor-field">
                            <label>Preview atual:</label>
                            <img src="${element.src}" class="hardem-editor-image-preview" alt="Preview" style="max-width: 100%; border-radius: 4px; border: 1px solid #ddd;">
                        </div>
                        <div class="hardem-editor-field">
                            <label>Texto Alternativo:</label>
                            <input type="text" id="hardem-alt-text" value="${element.alt}" placeholder="Descrição da imagem" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadImageFromPanel()" style="width: 100%; margin-top: 10px;">
                            📸 Trocar Imagem
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
                        <span>🎨 Edição de Background</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <div class="hardem-editor-field">
                            <label>Preview atual:</label>
                            ${imageSrc ? `<img src="${imageSrc}" class="hardem-editor-image-preview" alt="Background Preview" style="max-width: 100%; border-radius: 4px; border: 1px solid #ddd;">` : '<p style="color: #999; margin: 5px 0;">Preview não disponível</p>'}
                        </div>
                        <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadBackgroundFromPanel()" style="width: 100%; margin-top: 10px;">
                            🖼️ Trocar Background
                        </button>
                    </div>
                </div>
            `;
        }

        // Seção de texto se aplicável
        if (this.isTextElement(element)) {
            const textContent = this.getDirectTextContent(element);
            panelHTML += `
                <div class="hardem-editor-section hardem-editor-type-text">
                    <div class="hardem-editor-section-header">
                        <span>📝 Edição de Texto</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="hardem-editor-section-content">
                        <div class="hardem-editor-field">
                            <label>Conteúdo atual:</label>
                            <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px; font-size: 13px; color: #666;">
                                "${textContent || 'Sem texto'}"
                            </div>
                        </div>
                        <div class="hardem-editor-field">
                            <label>Novo conteúdo:</label>
                            <textarea id="hardem-text-content" rows="3" placeholder="Digite o novo texto..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${textContent}</textarea>
                        </div>
                        <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.applyTextChange()" style="width: 100%; margin-top: 10px;">
                            ✅ Aplicar Texto
                        </button>
                    </div>
                </div>
            `;
        }

        // Seção de ações
        panelHTML += `
            <div class="hardem-editor-section">
                <div class="hardem-editor-section-header">
                    <span>⚡ Ações</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="hardem-editor-section-content">
                    <button class="hardem-editor-btn-outline" onclick="window.hardemEditor.highlightElement()" style="width: 100%; margin-bottom: 8px;">
                        📍 Destacar no Site
                    </button>
                    <button class="hardem-editor-btn-primary" onclick="window.hardemEditor.applyPanelChanges()" style="width: 100%; margin-bottom: 8px;">
                        💾 Salvar Alterações
                    </button>
                </div>
            </div>
        `;

        content.innerHTML = panelHTML;
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
                    // Redimensionar a imagem antes de aplicar
                    this.resizeImageToFit(imgElement, newSrc, (resizedImage) => {
                        // Aplicar a imagem redimensionada
                        imgElement.src = resizedImage;
                        
                        const dataKey = imgElement.getAttribute('data-key');
                        this.contentMap[dataKey] = {
                            src: resizedImage,
                            alt: imgElement.alt || ''
                        };
                        
                        this.showAlert('Imagem atualizada com sucesso!', 'success');
                    });
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

            this.showProcessingMessage('Processando imagem...');

            const reader = new FileReader();
            reader.onload = (e) => {
                const newSrc = e.target.result;
                
                // Aplicar o background imediatamente
                element.style.backgroundImage = `url("${newSrc}")`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.style.backgroundRepeat = 'no-repeat';
                
                // Usar a nova função para salvar corretamente
                const dataKey = this.saveBackgroundImage(element, newSrc, {
                    originalFile: file.name,
                    uploadTime: new Date().toISOString()
                });
                
                this.showAlert(`Background atualizado! (${dataKey})`, 'success');
                console.log(`✅ Background salvo com chave única: ${dataKey}`);
                
                // Salvar automaticamente
                this.saveContent();
                
                document.querySelector('.hardem-processing')?.remove();
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
                    // Usar a função de redimensionamento
                    this.resizeImageToFit(imgElement, newSrc, (resizedImage) => {
                        imgElement.src = resizedImage;
                        
                        const dataKey = imgElement.getAttribute('data-key');
                        if (dataKey) {
                            this.contentMap[dataKey] = {
                                src: resizedImage,
                                alt: imgElement.alt || ''
                            };
                        }
                        
                        this.showAlert('Imagem do slide atualizada!', 'success');
                        
                        // Atualizar preview no painel se necessário
                        const previewImg = document.getElementById(`slide-img-preview-${index}`);
                        if (previewImg) {
                            previewImg.src = resizedImage;
                        }
                    });
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
     * Mostrar feedback visual durante o processamento de imagens
     * @param {string} message - Mensagem a ser exibida
     */
    showProcessingMessage(message) {
        const processingDiv = document.createElement('div');
        processingDiv.className = 'hardem-editor-processing';
        processingDiv.innerHTML = `
            <div class="processing-spinner"></div>
            <div class="processing-message">${message}</div>
        `;
        
        document.body.appendChild(processingDiv);
        
        // Retornar função para remover a mensagem
        return () => {
            processingDiv.classList.add('fade-out');
            setTimeout(() => processingDiv.remove(), 500);
        };
    }

    /**
     * Desabilitar edição
     */
    disableEditing() {
        document.querySelectorAll('.hardem-editable-element').forEach(element => {
            element.classList.remove('hardem-editable-element', 'editing', 'hardem-highlight-element');
            element.contentEditable = false;

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

/**
 * Identificar elementos sobrepostos no ponto de clique com tratamento especial para menus de serviço
 * @param {Event} event - O evento de clique
 * @returns {Array} - Array de elementos sobrepostos filtrados
 */
getOverlappingElements(event) {
    const elements = [];
    const elementsFromPoint = document.elementsFromPoint(event.clientX, event.clientY);
    
    // Verificar se estamos em um dropdown de serviço
    const isInServiceMenu = elementsFromPoint.some(el => 
        el.closest('.rts-mega-menu.service-mega-menu-style') !== null);
    
    // Se estamos em um menu de serviço, comportamento especial
    if (isInServiceMenu) {
        // Identificar o elemento específico de serviço que foi clicado
        // (ícone, título ou descrição)
        const clickedElement = event.target;
        
        // NOVO: Ignorar cliques em elementos de fundo no dropdown de serviços
        // Verificar se clicou diretamente na div do serviço ou em um elemento de fundo/container
        if (clickedElement.classList.contains('single-service-menu') || 
            clickedElement.classList.contains('service-mega-menu-style') ||
            clickedElement.classList.contains('rts-mega-menu') ||
            clickedElement.classList.contains('row') ||
            clickedElement.classList.contains('col-lg-12') ||
            clickedElement.classList.contains('container') ||
            (clickedElement.classList.contains('icon') && !clickedElement.querySelector('img')) || // Container de ícone sem imagem
            clickedElement.closest('.service-mega-menu-style') && 
                !clickedElement.classList.contains('title') && 
                !clickedElement.classList.contains('details') && 
                clickedElement.tagName !== 'IMG') {
            
            console.log('Clique ignorado em elemento não editável do menu de serviços');
            return []; // Retorna array vazio para não selecionar nada
        }
        
        // Verificar se o elemento clicado é um componente específico de item de serviço
        if (clickedElement.tagName === 'IMG' && clickedElement.closest('.icon')) {
            // Clicou no ícone do serviço - devolver apenas o ícone
            elements.push(clickedElement);
            return elements;
        }
        
        if (clickedElement.classList.contains('title') ||
            clickedElement.tagName === 'H5' && clickedElement.classList.contains('title')) {
            // Clicou no título do serviço - devolver apenas o título
            elements.push(clickedElement);
            return elements;
        }
        
        if (clickedElement.classList.contains('details') ||
            clickedElement.tagName === 'P' && clickedElement.classList.contains('details')) {
            // Clicou na descrição do serviço - devolver apenas a descrição
            elements.push(clickedElement);
            return elements;
        }
        
        // Se clicou no container da single-service-menu, NÃO selecionar o container
        // Apenas ver se conseguimos encontrar um elemento específico próximo
        if (clickedElement.classList.contains('single-service-menu') ||
            clickedElement.closest('.single-service-menu')) {
            const serviceMenu = clickedElement.classList.contains('single-service-menu') ? 
                clickedElement : clickedElement.closest('.single-service-menu');
            
            // Determinar qual sub-elemento está mais próximo do ponto de clique
            const iconEl = serviceMenu.querySelector('.icon img');
            const titleEl = serviceMenu.querySelector('.title');
            const detailsEl = serviceMenu.querySelector('.details');
            
            // Calcular distâncias para decidir qual elemento foi o alvo pretendido
            const distances = [];
            
            // Função para calcular distância entre dois pontos
            const calculateDistance = (el) => {
                if (!el) return Infinity;
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                return Math.sqrt(
                    Math.pow(centerX - event.clientX, 2) + 
                    Math.pow(centerY - event.clientY, 2)
                );
            };
            
            if (iconEl) distances.push({el: iconEl, dist: calculateDistance(iconEl)});
            if (titleEl) distances.push({el: titleEl, dist: calculateDistance(titleEl)});
            if (detailsEl) distances.push({el: detailsEl, dist: calculateDistance(detailsEl)});
            
            // Ordenar por distância e pegar o mais próximo
            distances.sort((a, b) => a.dist - b.dist);
            
            if (distances.length > 0) {
                // Verificar se está perto o suficiente (limite de proximidade)
                const closestDistance = distances[0].dist;
                if (closestDistance < 50) { // Apenas selecionar se estiver próximo
                    elements.push(distances[0].el);
                    return elements;
                } else {
                    // Se não estiver próximo de nenhum elemento editável específico
                    console.log('Clique muito distante de elementos editáveis específicos');
                    return []; // Não selecionar nada
                }
            }
        }
        
        // Comportamento de fallback - se não conseguir identificar precisamente,
        // verificar explicitamente se é um elemento editável antes de retornar
        if (this.isElementEditable(clickedElement) &&
           !this.isServiceMenuContainer(clickedElement)) { // Nova verificação de container
            elements.push(clickedElement);
            return elements;
        } else {
            // Se não for um elemento explicitamente editável, não retornar nada
            return [];
        }
    }
    
    // Comportamento normal para o resto da página (código original)
    for (const el of elementsFromPoint) {
        // Ignorar elementos do editor
        if (this.isEditorElement(el)) continue;
        
        // Verificar se é um elemento potencialmente editável
        if (el.hasAttribute('data-key') || 
            this.editableSelectors.some(selector => el.matches(selector)) ||
            el.tagName === 'IMG' ||
            (window.getComputedStyle(el).backgroundImage !== 'none' && 
             !window.getComputedStyle(el).backgroundImage.includes('gradient'))) {
            
            // Verificação específica para evitar problema no header
            if (el.tagName === 'A' && el.closest('header') && 
                (el.classList.contains('main-nav') || 
                 el.parentElement.classList.contains('main-nav') || 
                 el.parentElement.classList.contains('submenu'))) {
                
                // Verificar se é um link de navegação com filhos (dropdown)
                if (el.querySelector('.rts-mega-menu') || el.querySelector('.submenu')) {
                    // Ignorar links que servem como containers de dropdown
                    continue;
                }
            }
            
            elements.push(el);
        }
    }
    
    // Filtrar elementos do header que podem causar problemas
    const filteredElements = elements.filter(el => {
        // Nova verificação: Excluir especificamente containers de serviços
        if (this.isServiceMenuContainer(el)) {
            return false;
        }
        
        // Verificar se está no header
        const isInHeader = el.closest('header') !== null;
        
        if (isInHeader) {
            // Não permitir edição de elementos de navegação complexos
            if (el.classList.contains('rts-mega-menu') || 
                el.classList.contains('submenu') || 
                el.classList.contains('wrapper') ||
                el.classList.contains('header-bottom') ||
                el.classList.contains('nav-area')) {
                return false;
            }
            
            // Verificar se é um link com dropdown
            if (el.tagName === 'A' && (
                el.classList.contains('has-dropdown') || 
                el.parentElement.classList.contains('has-dropdown'))) {
                // Verificar se há cliques explícitos neste elemento e não em seus filhos
                const rect = el.getBoundingClientRect();
                const isDirectClick = 
                    event.clientX >= rect.left && 
                    event.clientX <= rect.right && 
                    event.clientY >= rect.top && 
                    event.clientY <= rect.bottom;
                
                // Só permitir se o clique foi diretamente neste elemento
                return isDirectClick;
            }
            
            // Para links simples do header, verificar se tem texto próprio
            if (el.tagName === 'A' && el.textContent.trim()) {
                return true;
            }
            
            // Para elementos de texto no header (spans, h5, etc)
            if (['SPAN', 'H5', 'H4', 'H3', 'H2', 'H1', 'P'].includes(el.tagName) && 
                el.textContent.trim() && 
                !el.querySelector('a') && // Não deve conter links aninhados
                !el.parentElement.classList.contains('rts-mega-menu')) { // Não deve estar em mega-menu
                return true;
            }
            
            // Para imagens no header
            if (el.tagName === 'IMG') {
                return true;
            }
        }
        
        // Manter a lógica existente para elementos fora do header
        return true;
    });
    
    // Limitar a 5 elementos mais externos para evitar elementos muito pequenos/internos
    return filteredElements.slice(0, 5);
}

/**
 * Verifica se um elemento é um container de menu de serviço que não deve ser editável
 * @param {HTMLElement} element - Elemento para verificar
 * @returns {boolean} - True se for um container de serviço
 */
isServiceMenuContainer(element) {
    // Verificar se é um container de serviço não editável
    return (element.classList.contains('single-service-menu') ||
           element.classList.contains('service-mega-menu-style') ||
           element.classList.contains('row') && element.closest('.service-mega-menu-style') ||
           element.classList.contains('col-lg-12') && element.closest('.service-mega-menu-style') ||
           element.classList.contains('container') && element.closest('.service-mega-menu-style') ||
           element.classList.contains('icon') && !element.querySelector('img') && element.closest('.service-mega-menu-style'));
}

/**
 * Modificação necessária também no método makeTextElementEditable para impedir explicitamente
 * que containers de serviços se tornem editáveis
 */
makeTextElementEditable(element) {
    // Evitar elementos do próprio editor
    if (element.closest('.hardem-editor-toolbar') || 
        element.closest('.hardem-editor-sidepanel') ||
        element.classList.contains('hardem-editable-element')) {
        return;
    }
    
    // NOVO: Verificar explicitamente se é um container de serviço
    if (this.isServiceMenuContainer(element)) {
        console.log('Ignorando container de serviço:', element);
        return; // Não tornar editável
    }
    
    // Verificar se está no header, para aplicar regras específicas
    const isInHeader = element.closest('header') !== null;
    
    if (isInHeader) {
        // Verificar elementos de navegação que não devem ser editáveis
        if (element.classList.contains('header-bottom') ||
            element.classList.contains('nav-area') || 
            element.classList.contains('main-nav') || 
            element.classList.contains('submenu') ||
            element.classList.contains('rts-mega-menu')) {
            return; // Não tornar editável
        }
        
        // Para links no header, verificar se são links de navegação complexos (com dropdown)
        if (element.tagName === 'A' && (
            element.classList.contains('has-dropdown') || 
            element.querySelector('.rts-mega-menu') || 
            element.querySelector('.submenu'))) {
            
            // Verificar se é um container de dropdown (não deve ser editável)
            if (element.querySelector('.rts-mega-menu') || element.querySelector('.submenu')) {
                return; // Não tornar editável
            }
        }
    }
    
    element.classList.add('hardem-editable-element');
    
    const dataKey = element.getAttribute('data-key') || this.generateDataKey(element);
    element.setAttribute('data-key', dataKey);
    
    // Tooltip
    element.title = `Editar: ${dataKey}`;

    // Eventos de edição inline - usar arrow functions para manter contexto
    const handleDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.startInlineEditing(element);
    };

    // Substituir o evento de clique pelo nosso novo manipulador
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleElementClick(e);
    };

    element.addEventListener('dblclick', handleDoubleClick);
    element.addEventListener('click', handleClick);
    
    // Neutralizar efeitos problemáticos
    this.neutralizeElementEffects(element);
    
    console.log(`✅ Elemento editável: ${dataKey}`);
}

    /**
     * Verificar se um elemento é seguro para edição direta sem quebrar o layout
     * @param {HTMLElement} element - Elemento para verificar
     * @returns {boolean} - true se for seguro para edição
     */
    isSafeForDirectEdit(element) {
        // Se for o container do serviço inteiro, não é seguro editar diretamente
        if (element.classList.contains('single-service-style-4')) {
            return false;
        }
        
        // Se for o link principal do serviço, não é seguro
        if (element.tagName === 'A' && element.classList.contains('single-service-style-4')) {
            return false;
        }
        
        // Por padrão, outros elementos são considerados seguros
        return true;
    }

    /**
     * Quando um elemento é clicado, verificar se há sobreposições e se é seguro editar
     * @param {Event} event - Evento de clique
     */
    handleElementClick(event) {
        // Impedir comportamento padrão
        event.preventDefault();
        event.stopPropagation();
        
        // Obter elementos sobrepostos usando o método filtrado
        const overlappingElements = this.getOverlappingElements(event);
        
        // Caso especial para overlay de imagens (hidden-content)
        if (event.target.closest('.hidden-content') || event.target.classList.contains('hidden-content')) {
            // Se clicar no overlay, sempre mostrar o painel de sobreposições
            // incluindo tanto o texto do botão quanto a imagem de fundo
            if (overlappingElements.length > 0) {
                this.showOverlappingElementsPanel(overlappingElements);
                return;
            }
        }
        
        // Tratar situação específica de cards de serviço
        const clickedElement = event.target;
        if (clickedElement.classList.contains('single-service-style-4') || 
            (clickedElement.tagName === 'A' && clickedElement.classList.contains('single-service-style-4'))) {
            
            // Encontrar elementos seguros dentro do serviço para edição
            const safeElements = [];
            
            // Adicionar título
            const title = clickedElement.querySelector('h5.title');
            if (title) safeElements.push(title);
            
            // Adicionar descrição
            const desc = clickedElement.querySelector('p.disc');
            if (desc) safeElements.push(desc);
            
            // Adicionar imagem
            const img = clickedElement.querySelector('img');
            if (img) safeElements.push(img);
            
            // Adicionar botão "View Details"
            const viewBtn = clickedElement.querySelector('.hidden-content span');
            if (viewBtn) safeElements.push(viewBtn);
            
            // Se encontramos elementos seguros, mostrar painel de elementos sobrepostos com eles
            if (safeElements.length > 0) {
                this.showOverlappingElementsPanel(safeElements);
                return;
            }
        }
        
        // Forçar exibição de panel para elementos sobrepostos quando há mais de um
        // Isto é uma mudança importante - removemos a verificação isSafeForDirectEdit
        if (overlappingElements.length > 1) {
            this.showOverlappingElementsPanel(overlappingElements);
            return;
        }
        
        // Se houver apenas um elemento, selecionar normalmente
        if (overlappingElements.length === 1) {
            this.selectElement(overlappingElements[0]);
            return;
        }
        
        // Se não há elementos editáveis após a filtragem, informar ao usuário
        if (overlappingElements.length === 0) {
            this.showAlert('Nenhum elemento editável encontrado nesta área.', 'error');
        }
    }

    /**
     * Mostrar painel com elementos sobrepostos
     * @param {Array} elements - Elementos sobrepostos
     */
    showOverlappingElementsPanel(elements) {
        // Abrir painel lateral
        this.openSidePanel();
        
        // Armazenar elementos para uso posterior
        this.overlappingElements = elements;
        
        // Gerar conteúdo do painel
        const content = document.getElementById('hardem-panel-content');
        
        let panelHTML = `
            <div class="hardem-editor-info">
                <strong>Elementos sobrepostos detectados!</strong><br>
                Selecione qual elemento você deseja editar:
            </div>
            <div class="hardem-editor-section">
                <div class="hardem-editor-section-header">
                    <span>Camadas disponíveis (${elements.length})</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="hardem-editor-section-content">
                    <div class="overlapping-elements-list">
        `;
        
        // Adicionar cada elemento à lista
        elements.forEach((element, index) => {
            const elementType = element.tagName.toLowerCase();
            const dataKey = element.getAttribute('data-key') || `elemento-${index + 1}`;
            const hasImage = element.tagName === 'IMG' || element.querySelector('img');
            const hasBackground = window.getComputedStyle(element).backgroundImage !== 'none';
            
            // Identificar o tipo de conteúdo para o ícone
            let icon = '📄';
            if (hasImage) icon = '🖼️';
            else if (hasBackground) icon = '🎨';
            
            // Extrair texto representativo
            let previewText = '';
            if (element.textContent) {
                previewText = element.textContent.trim().substring(0, 20) + (element.textContent.length > 20 ? '...' : '');
            } else if (element.alt) {
                previewText = `Imagem: ${element.alt}`;
            } else if (hasBackground) {
                previewText = 'Background image';
            } else {
                previewText = `${elementType}`;
            }
            
            panelHTML += `
                <div class="overlapping-element-item" data-index="${index}">
                    <div class="element-icon">${icon}</div>
                    <div class="element-info">
                        <div class="element-type">&lt;${elementType}&gt;${element.className ? ' .' + element.className.split(' ')[0] : ''}</div>
                        <div class="element-preview">${previewText}</div>
                    </div>
                    <div class="element-indicator">${index + 1}</div>
                </div>
            `;
        });
        
        panelHTML += `
                    </div>
                    <button class="hardem-editor-btn-outline" style="margin-top: 10px;" 
                            id="highlight-overlapping-elements">
                        Destacar todas as camadas
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar o HTML ao painel
        content.innerHTML = panelHTML;
        
        // Adicionar eventos aos itens da lista
        document.querySelectorAll('.overlapping-element-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const index = parseInt(item.getAttribute('data-index'));
                this.selectElementFromOverlap(index);
            });
        });
        
        // Adicionar evento ao botão de destaque
        document.getElementById('highlight-overlapping-elements')?.addEventListener('click', () => {
            this.highlightOverlappingElements();
        });
    }

    /**
     * Selecionar elemento a partir da lista de sobrepostos
     * @param {number} index - Índice do elemento no array
     */
    selectElementFromOverlap(index) {
        const element = this.overlappingElements[index];
        if (!element) return;
        
        // Desativar animações de hover temporariamente para esse elemento
        this.disableHoverEffects(element);
        
        // Selecionar o elemento
        this.selectElement(element);
    }

    /**
     * Destacar todos os elementos sobrepostos
     */
    highlightOverlappingElements() {
        if (!this.overlappingElements || !this.overlappingElements.length) return;
        
        // Remover destaques existentes
        document.querySelectorAll('.hardem-highlight-element').forEach(el => {
            el.classList.remove('hardem-highlight-element');
        });
        
        // Adicionar destaque a cada elemento com um atraso
        this.overlappingElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('hardem-highlight-element');
                
                // Remover o destaque após um tempo
                setTimeout(() => {
                    element.classList.remove('hardem-highlight-element');
                }, 1000);
            }, index * 500); // Destaque sequencial com 500ms de diferença
        });
    }

    /**
     * Desativar efeitos de hover em um elemento específico
     * @param {Element} element - O elemento alvo
     */
    disableHoverEffects(element) {
        // Adicionar uma classe especial para desativar hover
        element.classList.add('hardem-disable-hover');
        
        // Voltar ao normal após a edição
        setTimeout(() => {
            element.classList.remove('hardem-disable-hover');
        }, 5000); // 5 segundos é tempo suficiente para edição
    }

    /**
     * Redimensiona uma imagem para manter as dimensões desejadas
     * @param {HTMLImageElement} imageElement - Elemento de imagem a ser substituído
     * @param {string} newImageSrc - Nova fonte da imagem (geralmente uma data URL)
     * @param {Function} callback - Função de callback que recebe a imagem redimensionada
     */
    resizeImageToFit(imageElement, newImageSrc, callback) {
        // Salvar as dimensões da imagem original
        const originalWidth = imageElement.naturalWidth || imageElement.width;
        const originalHeight = imageElement.naturalHeight || imageElement.height;
        
        // Verificar se está em uma área de serviços ou outro conjunto padronizado
        const isServiceImage = imageElement.closest('.single-service-style-4') !== null;
        const isPortfolioImage = imageElement.closest('.single-project-area-one') !== null;
        
        // Criar uma nova imagem para obter dimensões do novo arquivo
        const img = new Image();
        img.onload = () => {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            
            // Configurar o canvas para as dimensões desejadas
            if (isServiceImage || isPortfolioImage) {
                // Manter as dimensões exatas da imagem original
                canvas.width = originalWidth;
                canvas.height = originalHeight;
            } else {
                // Para outras imagens, manter pelo menos a proporção
                const aspectRatio = originalWidth / originalHeight;
                const newAspectRatio = img.width / img.height;
                
                if (Math.abs(aspectRatio - newAspectRatio) > 0.1) {
                    // Se a proporção for significativamente diferente
                    canvas.width = originalWidth;
                    canvas.height = originalHeight;
                } else {
                    // Se a proporção for semelhante, ajustar para não perder qualidade
                    const maxDimension = Math.max(originalWidth, originalHeight);
                    if (img.width > maxDimension || img.height > maxDimension) {
                        // Redimensionar imagens grandes
                        const scale = maxDimension / Math.max(img.width, img.height);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                    } else {
                        // Manter tamanho original se for menor
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                }
            }
            
            // Desenhar a imagem com as novas dimensões
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convertê-la para data URL com qualidade adequada
            let resizedImageData;
            try {
                // Tentar usar o formato original (normalmente JPEG para fotos, PNG para transparência)
                const format = newImageSrc.includes('data:image/png') ? 'image/png' : 'image/jpeg';
                resizedImageData = canvas.toDataURL(format, 0.9);  // 0.9 = 90% de qualidade para JPEGs
            } catch (e) {
                // Fallback para JPEG em caso de erro
                resizedImageData = canvas.toDataURL('image/jpeg', 0.9);
            }
            
            // Reportar dimensões para debug
            console.log(`Imagem redimensionada: ${canvas.width}x${canvas.height}`);
            
            // Chamar o callback com a imagem redimensionada
            callback(resizedImageData);
        };
        
        // Se ocorrer erro no carregamento, usar a imagem original
        img.onerror = () => {
            console.error('Erro ao carregar imagem para redimensionamento');
            callback(newImageSrc);
        };
        
        // Iniciar o processo carregando a imagem
        img.src = newImageSrc;
    }

    /**
     * Verificar se o elemento é parte de um carrossel e mostrar painel específico
     */
    handleCarouselElement(element) {
        const carousel = element.closest('.banner-swiper-main-wrapper-four, .swiper');
        if (carousel && carousel.querySelector('.mySwiper-banner-four, .mySwiper-thumbnail')) {
            this.showCarouselManagementPanel(carousel);
            return true;
        }
        return false;
    }

    /**
     * Mostrar painel de gerenciamento completo do carrossel
     */
    showCarouselManagementPanel(carouselContainer) {
        this.currentElement = carouselContainer;
        this.openSidePanel();
        
        const content = document.getElementById('hardem-panel-content');
        
        // Encontrar todas as slides principais e thumbnails
        const mainSlides = carouselContainer.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        const thumbnailSlides = carouselContainer.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
        
        let panelHTML = `
            <div class="hardem-editor-info" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">🎠 Gerenciador de Carrossel</h3>
                <p style="margin: 0; opacity: 0.9; font-size: 13px;">Visualize e edite todas as imagens do carrossel de forma organizada</p>
            </div>
            
            <div class="hardem-editor-section">
                <div class="hardem-editor-section-header">
                    <span>🖼️ Slides Principais (${mainSlides.length})</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="hardem-editor-section-content">
        `;
        
        // Processar slides principais
        mainSlides.forEach((slide, index) => {
            const slideDataKey = slide.getAttribute('data-key') || `slide_main_${index + 1}`;
            slide.setAttribute('data-key', slideDataKey);
            
            // Extrair background das classes CSS
            let backgroundClass = '';
            let backgroundPreview = '';
            if (slide.querySelector('.bg-banner-four')) {
                const bgElement = slide.querySelector('.bg-banner-four');
                if (bgElement.classList.contains('two')) {
                    backgroundClass = 'bg-banner-four two';
                    backgroundPreview = 'assets/images/banner/banner-bg-2.jpg';
                } else if (bgElement.classList.contains('three')) {
                    backgroundClass = 'bg-banner-four three';
                    backgroundPreview = 'assets/images/banner/banner-bg-3.jpg';
                } else if (bgElement.classList.contains('five')) {
                    backgroundClass = 'bg-banner-four five';
                    backgroundPreview = 'assets/images/banner/banner-bg-5.jpg';
                } else {
                    backgroundClass = 'bg-banner-four';
                    backgroundPreview = 'assets/images/banner/banner-bg-1.jpg';
                }
            }
            
            const titleElement = slide.querySelector('.title');
            const discElement = slide.querySelector('.disc');
            const currentTitle = titleElement ? titleElement.textContent : 'Sem título';
            const currentDesc = discElement ? discElement.textContent : 'Sem descrição';
            
            panelHTML += `
                <div class="carousel-slide-item" style="border: 2px solid #667eea; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #f8f9ff;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="background: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px;">
                            ${index + 1}
                        </div>
                        <span style="font-weight: 600; color: #667eea;">Slide Principal ${index + 1}</span>
                    </div>
                    
                    ${backgroundPreview ? `
                        <div style="margin-bottom: 10px;">
                            <label style="font-weight: 500; color: #444; display: block; margin-bottom: 4px;">Background atual:</label>
                            <img src="${backgroundPreview}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;" alt="Background Preview">
                        </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 10px;">
                        <label style="font-weight: 500; color: #444; display: block; margin-bottom: 4px;">Título:</label>
                        <textarea id="slide-title-${index}" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">${currentTitle}</textarea>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="font-weight: 500; color: #444; display: block; margin-bottom: 4px;">Descrição:</label>
                        <textarea id="slide-desc-${index}" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">${currentDesc}</textarea>
                    </div>
                    
                    <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadCarouselSlideBackground(${index})" style="background: #667eea; width: 100%; margin-bottom: 6px;">
                        🖼️ Trocar Background
                    </button>
                    
                    <button class="hardem-editor-btn-outline" onclick="window.hardemEditor.highlightCarouselSlide(${index})" style="width: 100%; font-size: 12px;">
                        📍 Localizar no Site
                    </button>
                </div>
            `;
        });
        
        panelHTML += `
                </div>
            </div>
            
            <div class="hardem-editor-section">
                <div class="hardem-editor-section-header">
                    <span>🖼️ Thumbnails (${thumbnailSlides.length})</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="hardem-editor-section-content">
        `;
        
        // Processar thumbnails
        thumbnailSlides.forEach((thumb, index) => {
            const thumbDataKey = thumb.getAttribute('data-key') || `slide_thumb_${index + 1}`;
            thumb.setAttribute('data-key', thumbDataKey);
            
            const imgElement = thumb.querySelector('img');
            const currentSrc = imgElement ? imgElement.src : '';
            
            panelHTML += `
                <div class="carousel-thumb-item" style="border: 2px solid #28a745; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #f8fff9;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="background: #28a745; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px;">
                            ${index + 1}
                        </div>
                        <span style="font-weight: 600; color: #28a745;">Thumbnail ${index + 1}</span>
                    </div>
                    
                    ${currentSrc ? `
                        <div style="margin-bottom: 10px;">
                            <img src="${currentSrc}" style="width: 100%; max-height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;" alt="Thumbnail Preview">
                        </div>
                    ` : ''}
                    
                    <button class="hardem-editor-btn-secondary" onclick="window.hardemEditor.uploadCarouselThumbnail(${index})" style="background: #28a745; width: 100%; margin-bottom: 6px;">
                        🖼️ Trocar Thumbnail
                    </button>
                    
                    <button class="hardem-editor-btn-outline" onclick="window.hardemEditor.highlightCarouselThumbnail(${index})" style="width: 100%; font-size: 12px;">
                        📍 Localizar no Site
                    </button>
                </div>
            `;
        });
        
        panelHTML += `
                </div>
            </div>
            
            <div class="hardem-editor-section">
                <div class="hardem-editor-section-header">
                    <span>⚡ Ações Rápidas</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="hardem-editor-section-content">
                    <button class="hardem-editor-btn-primary" onclick="window.hardemEditor.applyAllCarouselChanges()" style="width: 100%; margin-bottom: 8px;">
                        ✅ Aplicar Todas as Alterações
                    </button>
                    <button class="hardem-editor-btn-outline" onclick="window.hardemEditor.previewCarousel()" style="width: 100%; margin-bottom: 8px;">
                        👁️ Pré-visualizar Carrossel
                    </button>
                    <button class="hardem-editor-btn-warning" onclick="window.hardemEditor.resetCarouselToDefaults()" style="width: 100%;">
                        🔄 Restaurar Padrões
                    </button>
                </div>
            </div>
        `;
        
        content.innerHTML = panelHTML;
        this.setupAccordion();
        
        console.log('🎠 Painel de carrossel carregado com sucesso!');
    }

    /**
     * Upload de background para slide específico do carrossel
     */
    uploadCarouselSlideBackground(slideIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showProcessingMessage('Processando imagem do slide...');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                
                // Encontrar o slide específico
                const carouselContainer = this.currentElement;
                const slides = carouselContainer.querySelectorAll('.mySwiper-banner-four .swiper-slide');
                const targetSlide = slides[slideIndex];
                
                if (targetSlide) {
                    const bgElement = targetSlide.querySelector('.bg-banner-four');
                    if (bgElement) {
                        // Criar data-key único para esse background
                        const dataKey = `carousel_slide_bg_${slideIndex}`;
                        bgElement.setAttribute('data-key', dataKey);
                        
                        // Aplicar background
                        bgElement.style.backgroundImage = `url(${dataUrl})`;
                        bgElement.style.backgroundSize = 'cover';
                        bgElement.style.backgroundPosition = 'center';
                        bgElement.style.backgroundRepeat = 'no-repeat';
                        
                        // Salvar no contentMap com estrutura correta
                        this.contentMap[dataKey] = {
                            type: 'background',
                            backgroundImage: dataUrl,
                            slideIndex: slideIndex,
                            timestamp: new Date().toISOString()
                        };
                        
                        this.showAlert(`Background do slide ${slideIndex + 1} atualizado!`, 'success');
                        console.log(`🖼️ Background do slide ${slideIndex + 1} salvo:`, dataKey);
                    }
                }
                
                document.querySelector('.hardem-processing')?.remove();
            };
            
            reader.readAsDataURL(file);
        };
        
        input.click();
    }

    /**
     * Corrigir a função de salvar backgrounds múltiplos
     */
    saveBackgroundImage(element, backgroundImage, additionalData = {}) {
        const dataKey = element.getAttribute('data-key') || this.generateDataKey(element);
        element.setAttribute('data-key', dataKey);
        
        // Estrutura correta para backgrounds
        this.contentMap[dataKey] = {
            type: 'background',
            backgroundImage: backgroundImage,
            element: element.tagName.toLowerCase(),
            className: element.className,
            ...additionalData,
            timestamp: new Date().toISOString()
        };
        
        console.log(`💾 Background salvo para ${dataKey}:`, this.contentMap[dataKey]);
        return dataKey;
    }

    /**
     * Upload de thumbnail do carrossel
     */
    uploadCarouselThumbnail(thumbIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showProcessingMessage('Processando thumbnail...');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                
                const carouselContainer = this.currentElement;
                const thumbs = carouselContainer.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
                const targetThumb = thumbs[thumbIndex];
                
                if (targetThumb) {
                    const imgElement = targetThumb.querySelector('img');
                    if (imgElement) {
                        const dataKey = `carousel_thumb_${thumbIndex}`;
                        imgElement.setAttribute('data-key', dataKey);
                        imgElement.src = dataUrl;
                        
                        this.contentMap[dataKey] = {
                            type: 'image',
                            src: dataUrl,
                            alt: imgElement.alt,
                            thumbIndex: thumbIndex,
                            timestamp: new Date().toISOString()
                        };
                        
                        this.showAlert(`Thumbnail ${thumbIndex + 1} atualizado!`, 'success');
                    }
                }
                
                document.querySelector('.hardem-processing')?.remove();
            };
            
            reader.readAsDataURL(file);
        };
        
        input.click();
    }

    /**
     * Aplicar todas as alterações do carrossel
     */
    applyAllCarouselChanges() {
        const carouselContainer = this.currentElement;
        const mainSlides = carouselContainer.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        
        let changesApplied = 0;
        
        // Aplicar mudanças nos slides principais
        mainSlides.forEach((slide, index) => {
            const titleInput = document.getElementById(`slide-title-${index}`);
            const descInput = document.getElementById(`slide-desc-${index}`);
            
            if (titleInput && titleInput.value.trim()) {
                const titleElement = slide.querySelector('.title');
                if (titleElement) {
                    titleElement.textContent = titleInput.value.trim();
                    const titleDataKey = titleElement.getAttribute('data-key') || `slide_title_${index}`;
                    titleElement.setAttribute('data-key', titleDataKey);
                    this.contentMap[titleDataKey] = titleInput.value.trim();
                    changesApplied++;
                }
            }
            
            if (descInput && descInput.value.trim()) {
                const descElement = slide.querySelector('.disc');
                if (descElement) {
                    descElement.textContent = descInput.value.trim();
                    const descDataKey = descElement.getAttribute('data-key') || `slide_desc_${index}`;
                    descElement.setAttribute('data-key', descDataKey);
                    this.contentMap[descDataKey] = descInput.value.trim();
                    changesApplied++;
                }
            }
        });
        
        if (changesApplied > 0) {
            this.showAlert(`✅ ${changesApplied} alterações aplicadas no carrossel!`, 'success');
            this.saveContent();
        } else {
            this.showAlert('ℹ️ Nenhuma alteração encontrada para aplicar.', 'info');
        }
    }

    /**
     * Destacar slide específico
     */
    highlightCarouselSlide(slideIndex) {
        const carouselContainer = this.currentElement;
        const slides = carouselContainer.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        const targetSlide = slides[slideIndex];
        
        if (targetSlide) {
            // Remove highlight de outros elementos
            document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                el.classList.remove('hardem-highlight-element');
            });
            
            // Adiciona highlight ao slide
            targetSlide.classList.add('hardem-highlight-element');
            
            // Scroll para o elemento
            targetSlide.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Remover highlight após 3 segundos
            setTimeout(() => {
                targetSlide.classList.remove('hardem-highlight-element');
            }, 3000);
            
            this.showAlert(`📍 Slide ${slideIndex + 1} destacado!`, 'info');
        }
    }

    /**
     * Destacar thumbnail específico
     */
    highlightCarouselThumbnail(thumbIndex) {
        const carouselContainer = this.currentElement;
        const thumbs = carouselContainer.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
        const targetThumb = thumbs[thumbIndex];
        
        if (targetThumb) {
            document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                el.classList.remove('hardem-highlight-element');
            });
            
            targetThumb.classList.add('hardem-highlight-element');
            targetThumb.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            setTimeout(() => {
                targetThumb.classList.remove('hardem-highlight-element');
            }, 3000);
            
            this.showAlert(`📍 Thumbnail ${thumbIndex + 1} destacado!`, 'info');
        }
    }

    /**
     * Pré-visualizar carrossel (simular clique nos slides)
     */
    previewCarousel() {
        const carouselContainer = this.currentElement;
        const slides = carouselContainer.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        
        if (slides.length === 0) {
            this.showAlert('❌ Nenhum slide encontrado para pré-visualizar!', 'error');
            return;
        }
        
        this.showAlert('🎬 Iniciando pré-visualização do carrossel...', 'info');
        
        let currentSlideIndex = 0;
        const highlightNextSlide = () => {
            // Remove highlight anterior
            document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                el.classList.remove('hardem-highlight-element');
            });
            
            // Destaca slide atual
            const currentSlide = slides[currentSlideIndex];
            currentSlide.classList.add('hardem-highlight-element');
            currentSlide.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            
            if (currentSlideIndex === 0) {
                // Fim da pré-visualização
                setTimeout(() => {
                    document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                        el.classList.remove('hardem-highlight-element');
                    });
                    this.showAlert('✅ Pré-visualização concluída!', 'success');
                }, 1500);
            } else {
                // Continua para o próximo slide
                setTimeout(highlightNextSlide, 1500);
            }
        };
        
        highlightNextSlide();
    }

    /**
     * Restaurar carrossel para configurações padrão
     */
    resetCarouselToDefaults() {
        if (!confirm('🔄 Tem certeza que deseja restaurar o carrossel para as configurações padrão? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        const carouselContainer = this.currentElement;
        const slides = carouselContainer.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        const thumbs = carouselContainer.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
        
        // Textos padrão para os slides
        const defaultTexts = [
            {
                title: "Let's Build Future Home Together",
                description: "We are dedicated to building structures that last and relationships that endure. With a focus on quality, precision, and innovation."
            },
            {
                title: "Excellence in Construction",
                description: "From residential to commercial projects, we deliver exceptional results with attention to detail and professional craftsmanship."
            },
            {
                title: "Your Dream, Our Expertise",
                description: "Transform your vision into reality with our experienced team of construction professionals and innovative building solutions."
            },
            {
                title: "Quality Construction Services",
                description: "Providing comprehensive construction services with commitment to quality, safety, and customer satisfaction."
            }
        ];
        
        // Restaurar textos dos slides
        slides.forEach((slide, index) => {
            const titleElement = slide.querySelector('.title');
            const descElement = slide.querySelector('.disc');
            
            if (titleElement && defaultTexts[index]) {
                titleElement.textContent = defaultTexts[index].title;
                const titleDataKey = titleElement.getAttribute('data-key') || `slide_title_${index}`;
                this.contentMap[titleDataKey] = defaultTexts[index].title;
            }
            
            if (descElement && defaultTexts[index]) {
                descElement.textContent = defaultTexts[index].description;
                const descDataKey = descElement.getAttribute('data-key') || `slide_desc_${index}`;
                this.contentMap[descDataKey] = defaultTexts[index].description;
            }
            
            // Remover backgrounds customizados
            const bgElement = slide.querySelector('.bg-banner-four');
            if (bgElement) {
                bgElement.style.removeProperty('background-image');
                const bgDataKey = bgElement.getAttribute('data-key');
                if (bgDataKey && this.contentMap[bgDataKey]) {
                    delete this.contentMap[bgDataKey];
                }
            }
        });
        
        // Restaurar thumbnails padrão
        const defaultThumbs = [
            'assets/images/banner/09.webp',
            'assets/images/banner/10.webp',
            'assets/images/banner/09.webp',
            'assets/images/banner/10.webp',
            'assets/images/banner/09.webp'
        ];
        
        thumbs.forEach((thumb, index) => {
            const imgElement = thumb.querySelector('img');
            if (imgElement && defaultThumbs[index]) {
                imgElement.src = defaultThumbs[index];
                const thumbDataKey = imgElement.getAttribute('data-key');
                if (thumbDataKey && this.contentMap[thumbDataKey]) {
                    delete this.contentMap[thumbDataKey];
                }
            }
        });
        
        // Salvar alterações
        this.saveContent();
        
        // Recarregar o painel do carrossel
        this.showCarouselManagementPanel(carouselContainer);
        
        this.showAlert('🔄 Carrossel restaurado para configurações padrão!', 'success');
    }

    /**
     * Aplicar mudança de texto do painel
     */
    applyTextChange() {
        const textArea = document.getElementById('hardem-text-content');
        if (!textArea || !this.currentElement) return;
        
        const newText = textArea.value.trim();
        if (!newText) {
            this.showAlert('⚠️ O texto não pode ficar vazio!', 'error');
            return;
        }
        
        this.currentElement.textContent = newText;
        const dataKey = this.currentElement.getAttribute('data-key');
        if (dataKey) {
            this.contentMap[dataKey] = newText;
            this.saveContent();
            this.showAlert('✅ Texto atualizado com sucesso!', 'success');
        }
    }

    /**
     * Obter descrição do tipo de elemento
     */
    getElementTypeDescription(element) {
        const tag = element.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(element);
        const hasBackground = computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none';
        
        if (tag === 'img') return 'Imagem';
        if (hasBackground) return `Elemento com Background (${tag})`;
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'Título';
        if (tag === 'p') return 'Parágrafo';
        if (tag === 'a') return 'Link';
        if (tag === 'button') return 'Botão';
        return `Elemento ${tag}`;
    }

    /**
     * Obter localização do elemento na página
     */
    getElementLocation(element) {
        if (element.closest('.swiper')) return 'Carrossel';
        if (element.closest('header')) return 'Cabeçalho';
        if (element.closest('footer')) return 'Rodapé';
        if (element.closest('.banner')) return 'Banner';
        if (element.closest('.about')) return 'Seção Sobre';
        if (element.closest('.service')) return 'Seção Serviços';
        if (element.closest('.contact')) return 'Seção Contato';
        return 'Conteúdo Principal';
    }

    /**
     * Verificar se é elemento de texto
     */
    isTextElement(element) {
        const tag = element.tagName.toLowerCase();
        return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'div'].includes(tag) && 
               !element.querySelector('img') &&
               element.textContent.trim().length > 0;
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
