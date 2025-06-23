/**
 * HARDEM Editor - Unificação de Sistema de Imagens
 * Versão 1.1 - Correção de Diferenças entre Modo Edição e Visualização
 * 
 * PROBLEMA IDENTIFICADO:
 * - Ambos os modos estão usando URLs serve-image.php
 * - Precisamos interceptar e converter para base64 no modo visualização
 * - No modo edição, as imagens deveriam já estar em base64 no contentMap
 */

(function() {
    'use strict';
    
    console.log('🖼️ Inicializando unificação de sistema de imagens...');
    
    const isEditMode = window.location.search.includes('edit=true');
    const mode = isEditMode ? 'EDIÇÃO' : 'VISUALIZAÇÃO';
    console.log(`🔍 Modo detectado: ${mode}`);
    
    if (!isEditMode) {
        console.log('👁️ Modo visualização - configurando unificação de imagens');
        setupImageUnification();
    } else {
        console.log('✏️ Modo edição - configurando interceptação de carregamento');
        setupEditModeImageFix();
    }
    
    function setupImageUnification() {
        // Aguardar editor-manager estar disponível
        const checkEditorManager = () => {
            if (window.editorManager) {
                console.log('📦 Editor-manager encontrado, configurando interceptação...');
                interceptImageLoading();
            } else {
                setTimeout(checkEditorManager, 500);
            }
        };
        
        checkEditorManager();
    }
    
    function setupEditModeImageFix() {
        // No modo edição, interceptar quando o editor carregar o contentMap
        const checkEditor = () => {
            if (typeof window.hardemEditor !== 'undefined' && 
                window.hardemEditor.storage && 
                window.hardemEditor.contentMap) {
                
                console.log('📦 Editor encontrado, verificando imagens no contentMap...');
                fixImagesInContentMap();
                
            } else {
                setTimeout(checkEditor, 1000);
            }
        };
        
        checkEditor();
    }
    
    function fixImagesInContentMap() {
        const contentMap = window.hardemEditor.contentMap;
        let urlsFound = 0;
        let converted = 0;
        
        console.log('🔄 Verificando imagens no contentMap do editor...');
        
        Object.keys(contentMap).forEach(key => {
            const content = contentMap[key];
            
            // Verificar imagens src
            if (content && content.src && content.src.includes('serve-image.php')) {
                urlsFound++;
                console.log(`🔗 URL encontrada no contentMap: ${key} -> ${content.src}`);
                
                // Converter para base64
                urlToBase64(content.src).then(base64 => {
                    if (base64) {
                        contentMap[key].src = base64;
                        console.log(`✅ Imagem convertida no contentMap: ${key}`);
                        converted++;
                        
                        // Atualizar elemento no DOM se existir
                        const element = document.querySelector(`[data-key="${key}"]`);
                        if (element && element.tagName.toLowerCase() === 'img') {
                            element.src = base64;
                        }
                    }
                }).catch(error => {
                    console.warn(`⚠️ Erro ao converter imagem ${key}:`, error);
                });
            }
            
            // Verificar backgrounds
            if (content && content.backgroundImage && content.backgroundImage.includes('serve-image.php')) {
                urlsFound++;
                console.log(`🎨 Background URL encontrada no contentMap: ${key} -> ${content.backgroundImage}`);
                
                // Converter para base64
                urlToBase64(content.backgroundImage).then(base64 => {
                    if (base64) {
                        contentMap[key].backgroundImage = base64;
                        console.log(`✅ Background convertido no contentMap: ${key}`);
                        converted++;
                        
                        // Atualizar elemento no DOM se existir
                        const element = document.querySelector(`[data-key="${key}"]`);
                        if (element) {
                            element.style.setProperty('background-image', `url("${base64}")`, 'important');
                        }
                    }
                }).catch(error => {
                    console.warn(`⚠️ Erro ao converter background ${key}:`, error);
                });
            }
        });
        
        if (urlsFound > 0) {
            console.log(`🔄 Encontradas ${urlsFound} URLs para conversão no modo edição`);
        } else {
            console.log('✅ Todas as imagens já estão em base64 no contentMap');
        }
    }
    
    function interceptImageLoading() {
        // Interceptar o preloadContentForVisitors
        if (window.editorManager.preloadContentForVisitors) {
            const originalPreload = window.editorManager.preloadContentForVisitors;
            
            window.editorManager.preloadContentForVisitors = function() {
                console.log('🔄 Interceptando preloadContentForVisitors...');
                
                const pageKey = this.getPageKey();
                console.log('⚡ Carregando conteúdo unificado para visitantes...');
                
                fetch(`load-database.php?page=${encodeURIComponent(pageKey)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success && result.data) {
                        console.log('🔄 Convertendo URLs para base64...');
                        convertUrlsToBase64(result.data).then(unifiedData => {
                            console.log('⚡ Aplicando conteúdo unificado para visitantes');
                            this.applyContentInstantly(unifiedData);
                            
                            // Remover loading após aplicar conteúdo
                            setTimeout(() => {
                                this.removeInstantLoading();
                            }, 100);
                        });
                    } else {
                        // Remover loading mesmo se não há conteúdo
                        this.removeInstantLoading();
                    }
                })
                .catch(error => {
                    console.log('⚠️ Erro ao carregar conteúdo unificado:', error);
                    // Remover loading em caso de erro
                    this.removeInstantLoading();
                });
            };
            
            console.log('✅ Interceptação de preloadContentForVisitors configurada');
        }
    }
    
    async function convertUrlsToBase64(contentMap) {
        console.log('🔄 Iniciando conversão de URLs para base64...');
        
        const promises = [];
        const convertedMap = { ...contentMap };
        
        Object.keys(convertedMap).forEach(key => {
            const content = convertedMap[key];
            
            // Converter imagens src
            if (content && content.src && content.src.includes('serve-image.php')) {
                console.log(`🖼️ Convertendo imagem: ${key}`);
                const promise = urlToBase64(content.src).then(base64 => {
                    if (base64) {
                        convertedMap[key].src = base64;
                        console.log(`✅ Imagem convertida: ${key}`);
                    }
                }).catch(error => {
                    console.warn(`⚠️ Erro ao converter imagem ${key}:`, error);
                });
                promises.push(promise);
            }
            
            // Converter backgrounds
            if (content && content.backgroundImage && content.backgroundImage.includes('serve-image.php')) {
                console.log(`🎨 Convertendo background: ${key}`);
                const promise = urlToBase64(content.backgroundImage).then(base64 => {
                    if (base64) {
                        convertedMap[key].backgroundImage = base64;
                        console.log(`✅ Background convertido: ${key}`);
                    }
                }).catch(error => {
                    console.warn(`⚠️ Erro ao converter background ${key}:`, error);
                });
                promises.push(promise);
            }
        });
        
        // Aguardar todas as conversões
        await Promise.all(promises);
        
        console.log(`✅ Conversão concluída: ${promises.length} imagens processadas`);
        return convertedMap;
    }
    
    function urlToBase64(url) {
        return new Promise((resolve, reject) => {
            // Criar uma imagem temporária para carregar a URL
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
            
            img.onload = function() {
                try {
                    // Criar canvas para converter a imagem
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Desenhar a imagem no canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // Converter para base64
                    const base64 = canvas.toDataURL('image/jpeg', 0.9);
                    resolve(base64);
                    
                } catch (error) {
                    console.error('Erro ao converter para base64:', error);
                    reject(error);
                }
            };
            
            img.onerror = function() {
                console.error('Erro ao carregar imagem:', url);
                reject(new Error('Falha ao carregar imagem'));
            };
            
            // Iniciar carregamento
            img.src = url;
        });
    }
    
    // ===========================================
    // FUNÇÕES GLOBAIS PARA DEBUG E TESTE
    // ===========================================
    
    window.hardemTestImageUnification = function() {
        console.log('🧪 Testando unificação de imagens...');
        
        // Carregar dados do banco
        const pageKey = window.editorManager ? window.editorManager.getPageKey() : 'siteContent_index.html';
        
        return fetch(`load-database.php?page=${encodeURIComponent(pageKey)}`)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                console.log(`📦 Dados carregados: ${Object.keys(result.data).length} elementos`);
                
                let imagesCount = 0;
                let backgroundsCount = 0;
                let serveImageUrls = 0;
                let base64Images = 0;
                
                Object.entries(result.data).forEach(([key, content]) => {
                    if (content.src) {
                        imagesCount++;
                        if (content.src.includes('serve-image.php')) {
                            serveImageUrls++;
                            console.log(`🔗 URL: ${key} -> ${content.src}`);
                        } else if (content.src.startsWith('data:')) {
                            base64Images++;
                            console.log(`📄 Base64: ${key} -> ${content.src.substring(0, 50)}...`);
                        }
                    }
                    
                    if (content.backgroundImage) {
                        backgroundsCount++;
                        if (content.backgroundImage.includes('serve-image.php')) {
                            serveImageUrls++;
                            console.log(`🎨 Background URL: ${key} -> ${content.backgroundImage}`);
                        } else if (content.backgroundImage.startsWith('data:')) {
                            base64Images++;
                            console.log(`🎨 Background Base64: ${key} -> ${content.backgroundImage.substring(0, 50)}...`);
                        }
                    }
                });
                
                console.log('📊 Análise de imagens:');
                console.log(`   Total de imagens: ${imagesCount}`);
                console.log(`   Total de backgrounds: ${backgroundsCount}`);
                console.log(`   URLs serve-image.php: ${serveImageUrls}`);
                console.log(`   Imagens base64: ${base64Images}`);
                
                return {
                    totalElements: Object.keys(result.data).length,
                    imagesCount,
                    backgroundsCount,
                    serveImageUrls,
                    base64Images,
                    needsUnification: serveImageUrls > 0
                };
                
            } else {
                console.log('❌ Erro ao carregar dados:', result.message);
                return { error: result.message };
            }
        })
        .catch(error => {
            console.error('❌ Erro na requisição:', error);
            return { error: error.message };
        });
    };
    
    window.hardemConvertSingleImage = function(url) {
        console.log(`🔄 Convertendo imagem individual: ${url}`);
        
        return urlToBase64(url).then(base64 => {
            console.log(`✅ Conversão concluída: ${base64.substring(0, 50)}...`);
            return base64;
        }).catch(error => {
            console.error(`❌ Erro na conversão: ${error.message}`);
            throw error;
        });
    };
    
    window.hardemForceImageReload = function() {
        console.log('🔄 Forçando recarregamento unificado de imagens...');
        
        if (isEditMode) {
            // Modo edição: corrigir contentMap
            if (typeof window.hardemEditor !== 'undefined' && window.hardemEditor.contentMap) {
                fixImagesInContentMap();
                console.log('✅ Correção de imagens no contentMap iniciada');
            } else {
                console.log('❌ Editor não disponível');
            }
        } else {
            // Modo visualização: recarregar com conversão
            if (window.editorManager && window.editorManager.preloadContentForVisitors) {
                window.editorManager.preloadContentForVisitors();
                console.log('✅ Recarregamento com conversão iniciado');
            } else {
                console.log('❌ Editor-manager não disponível');
            }
        }
    };
    
    // Função para converter URLs específicas manualmente
    window.hardemConvertAllImages = function() {
        console.log('🔄 Convertendo todas as imagens manualmente...');
        
        if (isEditMode && typeof window.hardemEditor !== 'undefined') {
            fixImagesInContentMap();
            console.log('✅ Conversão no modo edição iniciada');
        } else {
            // Converter imagens visíveis no DOM
            const images = document.querySelectorAll('img[src*="serve-image.php"]');
            const backgrounds = document.querySelectorAll('[style*="serve-image.php"]');
            
            console.log(`🔄 Encontradas ${images.length} imagens e ${backgrounds.length} backgrounds para converter`);
            
            images.forEach(img => {
                urlToBase64(img.src).then(base64 => {
                    img.src = base64;
                    console.log(`✅ Imagem convertida: ${img.getAttribute('data-key')}`);
                }).catch(error => {
                    console.warn(`⚠️ Erro ao converter imagem:`, error);
                });
            });
        }
    };
    
    console.log('✅ Sistema de unificação de imagens inicializado');
    
})(); 