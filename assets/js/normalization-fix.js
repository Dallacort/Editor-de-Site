/**
 * HARDEM Editor - Correção de Normalização de Imagens
 * Este script corrige problemas de normalização de imagens que não estão sendo aplicadas visualmente
 * @version 1.0.0
 */

(function() {
    // Executar quando o DOM estiver pronto
    function init() {
        console.log('🔧 HARDEM: Iniciando correção de normalização de imagens...');
        
        // Verificar se o CSS está carregado, se não estiver, injetar
        checkAndLoadCSS();
        
        // Corrigir elementos normalizados
        fixNormalizedElements();
    }
    
    // Verificar e carregar CSS se necessário
    function checkAndLoadCSS() {
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
        
        if (!cssLoaded) {
            console.log('⚠️ HARDEM: CSS de normalização não encontrado, injetando...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'assets/css/image-normalization-styles.css';
            document.head.appendChild(link);
        }
    }
    
    // Corrigir elementos normalizados
    function fixNormalizedElements() {
        // Encontrar todos os elementos que deveriam estar normalizados
        const normalizedElements = document.querySelectorAll('[data-normalized="true"], [data-target-width], [data-target-height]');
        let fixedCount = 0;
        
        console.log(`🔍 HARDEM: Encontrados ${normalizedElements.length} elementos com atributos de normalização`);
        
        // Processar cada elemento
        normalizedElements.forEach(element => {
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
                } catch (e) {}
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
            
            // Se tiver dimensões, aplicar estilos
            if (targetWidth && targetHeight) {
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
                
                fixedCount++;
            }
        });
        
        console.log(`✅ HARDEM: ${fixedCount} elementos corrigidos`);
    }
    
    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Também executar quando a página estiver totalmente carregada (para imagens e recursos externos)
    window.addEventListener('load', fixNormalizedElements);
})();