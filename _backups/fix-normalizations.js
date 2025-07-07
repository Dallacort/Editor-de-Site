/**
 * Script para corrigir problemas de normalização de imagens no HARDEM Editor
 * Este script verifica e corrige elementos que deveriam estar normalizados
 * mas não estão exibindo corretamente os estilos de normalização
 */

(function() {
    // Configurações
    const DEBUG = true; // Ativar logs detalhados
    const AUTO_FIX = true; // Aplicar correções automaticamente
    
    // Contadores
    let elementsChecked = 0;
    let elementsFixed = 0;
    let elementsFailed = 0;
    
    /**
     * Função de log com suporte a níveis
     */
    function log(message, level = 'info') {
        if (!DEBUG && level === 'debug') return;
        
        const prefix = {
            'info': '📝',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'debug': '🔍'
        }[level] || '📝';
        
        console.log(`${prefix} ${message}`);
    }
    
    /**
     * Verifica se um elemento tem dados de normalização
     */
    function hasNormalizationData(element) {
        // Verificar atributos data-
        const isNormalized = element.getAttribute('data-normalized') === 'true';
        const hasTargetWidth = element.hasAttribute('data-target-width');
        const hasTargetHeight = element.hasAttribute('data-target-height');
        
        // Verificar propriedades
        let hasPropertiesNormalization = false;
        try {
            const propertiesAttr = element.getAttribute('data-properties');
            if (propertiesAttr) {
                const properties = JSON.parse(propertiesAttr);
                hasPropertiesNormalization = properties && 
                                           properties.normalization && 
                                           properties.normalization.normalized === true;
            }
        } catch (e) {
            log(`Erro ao parsear data-properties: ${e.message}`, 'debug');
        }
        
        // Verificar contentMap se disponível
        let hasContentMapNormalization = false;
        try {
            const dataKey = element.getAttribute('data-key');
            if (dataKey && window.hardemEditor && window.hardemEditor.contentMap) {
                const content = window.hardemEditor.contentMap[dataKey];
                if (content) {
                    hasContentMapNormalization = 
                        (content.normalization && content.normalization.normalized === true) ||
                        (content.properties && 
                         content.properties.normalization && 
                         content.properties.normalization.normalized === true);
                }
            }
        } catch (e) {
            log(`Erro ao verificar contentMap: ${e.message}`, 'debug');
        }
        
        return isNormalized || hasTargetWidth || hasTargetHeight || 
               hasPropertiesNormalization || hasContentMapNormalization;
    }
    
    /**
     * Verifica se os estilos de normalização estão aplicados corretamente
     */
    function hasCorrectNormalizationStyles(element) {
        const computedStyle = window.getComputedStyle(element);
        
        // Obter dimensões alvo
        const targetWidth = element.getAttribute('data-target-width');
        const targetHeight = element.getAttribute('data-target-height');
        
        // Se não tiver dimensões alvo, não podemos verificar
        if (!targetWidth || !targetHeight) {
            return false;
        }
        
        // Verificar se as dimensões estão aplicadas
        const hasCorrectWidth = computedStyle.width === `${targetWidth}px`;
        const hasCorrectHeight = computedStyle.height === `${targetHeight}px`;
        
        // Verificações específicas para imagens
        if (element.tagName.toLowerCase() === 'img') {
            const hasCorrectObjectFit = computedStyle.objectFit === 'cover';
            return hasCorrectWidth && hasCorrectHeight && hasCorrectObjectFit;
        }
        
        // Verificações para elementos com background-image
        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
            const hasCorrectBgSize = computedStyle.backgroundSize === 'cover';
            return hasCorrectWidth && hasCorrectHeight && hasCorrectBgSize;
        }
        
        return hasCorrectWidth && hasCorrectHeight;
    }
    
    /**
     * Aplica estilos de normalização a um elemento
     */
    function applyNormalizationStyles(element) {
        try {
            // Obter dimensões alvo
            let targetWidth = element.getAttribute('data-target-width');
            let targetHeight = element.getAttribute('data-target-height');
            
            // Se não tiver dimensões nos atributos, tentar obter das propriedades
            if (!targetWidth || !targetHeight) {
                try {
                    const propertiesAttr = element.getAttribute('data-properties');
                    if (propertiesAttr) {
                        const properties = JSON.parse(propertiesAttr);
                        if (properties && properties.normalization) {
                            targetWidth = properties.normalization.target_width;
                            targetHeight = properties.normalization.target_height;
                        }
                    }
                } catch (e) {
                    log(`Erro ao parsear propriedades: ${e.message}`, 'error');
                }
            }
            
            // Se ainda não tiver dimensões, tentar obter do contentMap
            if ((!targetWidth || !targetHeight) && window.hardemEditor && window.hardemEditor.contentMap) {
                const dataKey = element.getAttribute('data-key');
                if (dataKey) {
                    const content = window.hardemEditor.contentMap[dataKey];
                    if (content) {
                        const normalization = content.normalization || 
                                           (content.properties && content.properties.normalization);
                        if (normalization) {
                            targetWidth = normalization.target_width;
                            targetHeight = normalization.target_height;
                        }
                    }
                }
            }
            
            // Se ainda não tiver dimensões, não podemos aplicar
            if (!targetWidth || !targetHeight) {
                log(`Elemento sem dimensões alvo: ${element.tagName} [data-key=${element.getAttribute('data-key')}]`, 'warning');
                return false;
            }
            
            // Aplicar estilos com !important para garantir
            element.style.setProperty('width', `${targetWidth}px`, 'important');
            element.style.setProperty('height', `${targetHeight}px`, 'important');
            
            // Aplicar estilos específicos para imagens
            if (element.tagName.toLowerCase() === 'img') {
                element.style.setProperty('object-fit', 'cover', 'important');
                element.style.setProperty('object-position', 'center', 'important');
                element.style.setProperty('display', 'block', 'important');
            } 
            // Aplicar estilos para elementos com background
            else if (window.getComputedStyle(element).backgroundImage !== 'none') {
                element.style.setProperty('background-size', 'cover', 'important');
                element.style.setProperty('background-position', 'center', 'important');
                element.style.setProperty('background-repeat', 'no-repeat', 'important');
            }
            
            // Garantir que o atributo data-normalized esteja presente
            element.setAttribute('data-normalized', 'true');
            
            // Atualizar atributos de dimensão se não existirem
            if (!element.hasAttribute('data-target-width')) {
                element.setAttribute('data-target-width', targetWidth);
            }
            if (!element.hasAttribute('data-target-height')) {
                element.setAttribute('data-target-height', targetHeight);
            }
            
            return true;
        } catch (e) {
            log(`Erro ao aplicar estilos: ${e.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Verifica e corrige elementos normalizados
     */
    function checkAndFixNormalizedElements() {
        // Encontrar todos os elementos que deveriam estar normalizados
        const normalizedElements = document.querySelectorAll('[data-normalized="true"], [data-target-width], [data-target-height]');
        
        log(`Encontrados ${normalizedElements.length} elementos com atributos de normalização`, 'info');
        
        // Verificar cada elemento
        normalizedElements.forEach(element => {
            elementsChecked++;
            
            // Verificar se tem dados de normalização
            if (!hasNormalizationData(element)) {
                log(`Elemento sem dados de normalização completos: ${element.tagName}`, 'debug');
                return;
            }
            
            // Verificar se os estilos estão aplicados corretamente
            if (!hasCorrectNormalizationStyles(element)) {
                log(`Elemento com estilos incorretos: ${element.tagName} [data-key=${element.getAttribute('data-key')}]`, 'warning');
                
                // Aplicar correção se AUTO_FIX estiver ativado
                if (AUTO_FIX) {
                    if (applyNormalizationStyles(element)) {
                        elementsFixed++;
                        log(`Elemento corrigido: ${element.tagName} [data-key=${element.getAttribute('data-key')}]`, 'success');
                    } else {
                        elementsFailed++;
                        log(`Falha ao corrigir elemento: ${element.tagName} [data-key=${element.getAttribute('data-key')}]`, 'error');
                    }
                }
            } else {
                log(`Elemento já normalizado corretamente: ${element.tagName} [data-key=${element.getAttribute('data-key')}]`, 'debug');
            }
        });
        
        // Exibir resumo
        log(`\n===== RESUMO DA VERIFICAÇÃO =====`, 'info');
        log(`Elementos verificados: ${elementsChecked}`, 'info');
        log(`Elementos corrigidos: ${elementsFixed}`, 'success');
        log(`Elementos com falha: ${elementsFailed}`, 'error');
        log(`================================\n`, 'info');
    }
    
    /**
     * Verifica se o CSS de normalização está carregado
     */
    function checkNormalizationCSS() {
        const cssLoaded = Array.from(document.styleSheets).some(sheet => {
            try {
                return sheet.href && (
                    sheet.href.includes('image-normalization-styles.css') ||
                    sheet.href.includes('assets/css/image-normalization-styles.css')
                );
            } catch (e) {
                return false;
            }
        });
        
        if (cssLoaded) {
            log('CSS de normalização carregado corretamente', 'success');
            return true;
        } else {
            log('CSS de normalização não encontrado!', 'error');
            log('Tentando injetar CSS de normalização...', 'warning');
            
            // Tentar injetar o CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'assets/css/image-normalization-styles.css';
            document.head.appendChild(link);
            
            log('CSS de normalização injetado. Verifique se o arquivo existe no caminho correto.', 'info');
            return false;
        }
    }
    
    /**
     * Função principal
     */
    function init() {
        log('Iniciando verificação de normalizações...', 'info');
        
        // Verificar se o CSS está carregado
        const cssLoaded = checkNormalizationCSS();
        
        // Verificar e corrigir elementos
        checkAndFixNormalizedElements();
        
        // Adicionar classe de debug se necessário
        if (DEBUG) {
            document.body.classList.add('hardem-debug');
        }
        
        log('Verificação concluída!', 'success');
    }
    
    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();