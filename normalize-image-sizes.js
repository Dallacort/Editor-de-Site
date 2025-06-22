/**
 * HARDEM - Script de Normalização de Tamanhos de Imagens
 * Normaliza todas as imagens para o mesmo tamanho do background principal
 * @version 1.0.0
 */

(function() {
    'use strict';

    console.log('🔧 Iniciando normalização automática de imagens...');

    // Verificar se o editor está disponível
    if (typeof window.hardemEditor === 'undefined' || !window.hardemEditor.imageEditor) {
        console.error('❌ Editor Hardem não encontrado! Certifique-se de que o editor está carregado.');
        return;
    }

    const imageEditor = window.hardemEditor.imageEditor;

    /**
     * Função principal de normalização
     */
    function normalizeAllImages() {
        try {
            // Executar normalização
            imageEditor.normalizeAllImageSizes();
            
            // Mostrar relatório
            setTimeout(() => {
                showNormalizationReport();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro durante normalização:', error);
            alert('Erro durante a normalização: ' + error.message);
        }
    }

    /**
     * Mostrar relatório de normalização
     */
    function showNormalizationReport() {
        const normalizedImages = document.querySelectorAll('[data-normalized="true"]');
        const totalImages = document.querySelectorAll('img:not([data-no-edit])').length;
        const totalBackgrounds = document.querySelectorAll('[style*="background-image"]:not([data-no-edit])').length;
        
        const report = `
📊 RELATÓRIO DE NORMALIZAÇÃO:
✅ Elementos normalizados: ${normalizedImages.length}
📷 Total de imagens: ${totalImages}
🎨 Total de backgrounds: ${totalBackgrounds}
📐 Dimensões aplicadas: ${imageEditor.defaultImageDimensions ? 
    `${imageEditor.defaultImageDimensions.width}x${imageEditor.defaultImageDimensions.height}` : 
    'Não definidas'}
        `;
        
        console.log(report);
        
        // Mostrar modal com relatório se UI disponível
        if (window.hardemEditor && window.hardemEditor.ui) {
            window.hardemEditor.ui.showAlert(
                `Normalização concluída! ${normalizedImages.length} elementos foram normalizados.`, 
                'success'
            );
        }
    }

    /**
     * Função para normalizar apenas imagens existentes (versão individual)
     */
    function normalizeExistingImagesOnly() {
        console.log('🎯 Iniciando normalização individual de imagens existentes...');
        
        const images = document.querySelectorAll('img:not([data-no-edit])');
        const backgrounds = document.querySelectorAll('[style*="background-image"]:not([data-no-edit])');
        
        let processedCount = 0;
        
        // Normalizar cada imagem individualmente
        images.forEach(img => {
            if (imageEditor.isValidImage && imageEditor.isValidImage(img)) {
                // Detectar dimensões atuais da imagem
                const rect = img.getBoundingClientRect();
                const targetDims = {
                    width: Math.max(rect.width, 300),
                    height: Math.max(rect.height, 200),
                    element: img
                };
                
                imageEditor.normalizeIndividualImage(img, targetDims);
                processedCount++;
            }
        });
        
        // Normalizar cada background individualmente
        backgrounds.forEach(bg => {
            if (imageEditor.hasValidBackgroundImage && imageEditor.hasValidBackgroundImage(bg)) {
                // Detectar dimensões atuais do background
                const rect = bg.getBoundingClientRect();
                const targetDims = {
                    width: Math.max(rect.width, 300),
                    height: Math.max(rect.height, 200),
                    element: bg
                };

                imageEditor.normalizeIndividualImage(bg, targetDims);
                processedCount++;
            }
        });
        
        console.log(`✅ ${processedCount} elementos normalizados individualmente`);
        showNormalizationReport();
    }

    /**
     * Função para aplicar dimensões específicas
     */
    function normalizeToSpecificDimensions(width, height) {
        const targetDimensions = {
            width: parseInt(width),
            height: parseInt(height),
            element: null
        };

        // Atualizar configurações
        imageEditor.updateImageResizeSettings(targetDimensions);
        
        // Normalizar imagens existentes
        imageEditor.normalizeExistingImages(targetDimensions);
        
        console.log(`🎯 Imagens normalizadas para: ${width}x${height}px`);
        showNormalizationReport();
    }

    /**
     * Interface via console
     */
    window.hardemNormalize = {
        // Normalização completa
        all: normalizeAllImages,
        
        // Apenas imagens existentes
        existing: normalizeExistingImagesOnly,
        
        // Dimensões específicas
        toDimensions: normalizeToSpecificDimensions,
        
        // Relatório atual
        report: showNormalizationReport,
        
        // Normalizar elemento específico por seletor
        element: function(selector, width = null, height = null) {
            const element = document.querySelector(selector);
            if (!element) {
                console.error(`❌ Elemento não encontrado: ${selector}`);
                return;
            }
            
            let targetDims = null;
            if (width && height) {
                targetDims = { width: parseInt(width), height: parseInt(height), element: element };
            }
            
            imageEditor.normalizeIndividualImage(element, targetDims);
            console.log(`✅ Elemento normalizado: ${selector}`);
        },
        
        // Remover normalização de elemento específico
        remove: function(selector) {
            const element = document.querySelector(selector);
            if (!element) {
                console.error(`❌ Elemento não encontrado: ${selector}`);
                return;
            }
            
            if (imageEditor.removeIndividualNormalization) {
                imageEditor.removeIndividualNormalization(element);
                console.log(`✅ Normalização removida: ${selector}`);
            } else {
                console.error('❌ Função de remoção não disponível');
            }
        },

        // Resetar todas as normalizações (versão melhorada)
        reset: function() {
            const normalized = document.querySelectorAll('[data-normalized="true"]');
            
            normalized.forEach(el => {
                if (imageEditor.removeIndividualNormalization) {
                    imageEditor.removeIndividualNormalization(el);
                } else {
                    // Fallback para método antigo
                el.removeAttribute('data-normalized');
                el.removeAttribute('data-target-width');
                el.removeAttribute('data-target-height');
                    el.removeAttribute('data-normalize-id');
                
                if (el.tagName.toLowerCase() === 'img') {
                    el.style.width = '';
                    el.style.height = '';
                    el.style.objectFit = '';
                    el.style.objectPosition = '';
                    }
                }
            });
            
            // Remover containers criados (compatibilidade)
            const containers = document.querySelectorAll('.hardem-image-container');
            containers.forEach(container => {
                const img = container.querySelector('img');
                if (img) {
                    container.parentNode.insertBefore(img, container);
                    container.remove();
                }
            });
            
            console.log(`🔄 ${normalized.length} normalizações resetadas`);
        },
        
        // Informações de uso
        help: function() {
            console.log(`
🔧 HARDEM - Normalização de Imagens (Sistema Individual)

COMANDOS DISPONÍVEIS:

📋 NORMALIZAÇÃO:
• hardemNormalize.existing() - Normalizar imagens individualmente (RECOMENDADO)
• hardemNormalize.all() - Normalizar todas com mesmas dimensões (CUIDADO!)
• hardemNormalize.element(selector, width, height) - Normalizar elemento específico
• hardemNormalize.toDimensions(width, height) - Usar dimensões específicas globais

🔧 CONTROLE:
• hardemNormalize.remove(selector) - Remover normalização de elemento específico
• hardemNormalize.reset() - Resetar todas as normalizações
• hardemNormalize.report() - Mostrar relatório atual
• hardemNormalize.help() - Mostrar esta ajuda

✅ EXEMPLOS SEGUROS (INDIVIDUAL):
hardemNormalize.existing()                    // Normalizar cada imagem com suas dimensões
hardemNormalize.element('img.hero', 1200, 600) // Normalizar imagem específica
hardemNormalize.remove('img.hero')            // Remover normalização específica

⚠️ EXEMPLOS GLOBAIS (CUIDADO):
hardemNormalize.all()                         // Aplica mesmas dimensões para TODAS
hardemNormalize.toDimensions(1200, 800)       // Força dimensões para TODAS

🔄 LIMPEZA:
hardemNormalize.reset()                       // Remove todas as normalizações
            `);
        }
    };

    // Auto-executar se solicitado via parâmetro URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto-normalize') === 'true') {
        console.log('🚀 Auto-normalizando imagens...');
        setTimeout(normalizeAllImages, 1000);
    }

    // Mostrar instruções
    console.log(`
🎯 Sistema de Normalização Individual de Imagens carregado!

✅ RECOMENDADO - Normalização individual:
hardemNormalize.existing()

⚠️ CUIDADO - Normalização global (afeta todas):
hardemNormalize.all()

📖 Para ver todos os comandos:
hardemNormalize.help()
    `);

})(); 