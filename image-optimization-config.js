/**
 * HARDEM Editor - Configurações de Otimização de Imagens
 * Configurações específicas para permitir o máximo de imagens possível
 * @version 1.0.0
 */

const HardemImageOptimization = {
    // Limites de tamanho para diferentes tipos de imagem
    limits: {
        // Imagens normais (mais restritivas)
        normal: {
            maxWidth: 1200,
            maxHeight: 800,
            maxFileSize: 500 * 1024, // 500KB
            quality: 0.65,
            compressionSteps: [0.65, 0.55, 0.45, 0.35, 0.25]
        },
        
        // Backgrounds (um pouco maiores)
        background: {
            maxWidth: 1600,
            maxHeight: 900,
            maxFileSize: 800 * 1024, // 800KB
            quality: 0.6,
            compressionSteps: [0.6, 0.5, 0.4, 0.3, 0.2]
        },
        
        // Slides (específico para carrosséis)
        slide: {
            maxWidth: 1400,
            maxHeight: 800,
            maxFileSize: 600 * 1024, // 600KB
            quality: 0.55,
            compressionSteps: [0.55, 0.45, 0.35, 0.25, 0.15]
        },
        
        // SVGs (otimização especial)
        svg: {
            maxFileSize: 100 * 1024, // 100KB
            compressionLevel: 'maximum'
        }
    },
    
    // Configurações de performance
    performance: {
        maxConcurrentProcessing: 3, // Máximo de imagens processando ao mesmo tempo
        memoryThreshold: 100 * 1024 * 1024, // 100MB limite de memória
        batchSize: 5, // Processar 5 imagens por vez
        delayBetweenBatches: 200, // Pausa entre lotes (ms)
        autoCleanupInterval: 60000 // Limpeza automática a cada 1 minuto
    },
    
    // Configurações de salvamento
    saving: {
        phpPostThreshold: 0.6, // Usar 60% do limite PHP
        autoSaveByParts: true, // Salvar automaticamente por partes
        compressionBeforeSave: true, // Comprimir antes de salvar
        localStorageBackup: true, // Fazer backup local
        maxRetries: 3 // Máximo de tentativas
    },
    
    // Configurações de qualidade baseadas no número de imagens
    dynamicQuality: {
        // Até 10 imagens - qualidade normal
        upTo10: { quality: 0.7, maxSize: 800 * 1024 },
        
        // 11-25 imagens - qualidade média
        upTo25: { quality: 0.6, maxSize: 600 * 1024 },
        
        // 26-50 imagens - qualidade baixa
        upTo50: { quality: 0.5, maxSize: 400 * 1024 },
        
        // 50+ imagens - qualidade muito baixa
        above50: { quality: 0.4, maxSize: 300 * 1024 }
    },
    
    // Configurações de monitoramento
    monitoring: {
        logCompressionRatio: true,
        warnOnLargeFiles: true,
        trackMemoryUsage: true,
        alertOnThresholds: true,
        detailedStats: true
    },
    
    // Formatos suportados
    supportedFormats: {
        input: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        output: 'jpeg', // Sempre converter para JPEG (menor tamanho)
        exceptions: ['svg'] // SVG mantém formato original
    },
    
    // Configurações específicas para diferentes situações
    contexts: {
        // Carregamento inicial (primeira vez)
        initial: {
            maxImagesPerPage: 15,
            aggressiveCompression: false,
            showProgress: true
        },
        
        // Carregamento em lote (múltiplas imagens)
        batch: {
            maxImagesPerPage: 30,
            aggressiveCompression: true,
            showProgress: true,
            batchDelay: 100
        },
        
        // Carregamento de emergência (muitas imagens)
        emergency: {
            maxImagesPerPage: 50,
            aggressiveCompression: true,
            showProgress: true,
            ultraCompression: true,
            batchDelay: 50
        }
    },
    
    // Configurações específicas para dispositivos
    device: {
        // Dispositivos móveis
        mobile: {
            maxWidth: 800,
            maxHeight: 600,
            quality: 0.5,
            maxFileSize: 300 * 1024
        },
        
        // Tablets
        tablet: {
            maxWidth: 1024,
            maxHeight: 768,
            quality: 0.6,
            maxFileSize: 500 * 1024
        },
        
        // Desktop
        desktop: {
            maxWidth: 1366,
            maxHeight: 768,
            quality: 0.65,
            maxFileSize: 800 * 1024
        }
    },
    
    // Configurações avançadas
    advanced: {
        // Usar Web Workers para processamento em background
        useWebWorkers: false, // Desabilitado por compatibilidade
        
        // Usar técnicas avançadas de compressão
        advancedCompression: true,
        
        // Pré-processamento de múltiplas resoluções
        multiResolution: false,
        
        // Cache inteligente
        smartCaching: true,
        
        // Detecção automática de conteúdo
        autoContentDetection: true
    }
};

// Função para obter configuração baseada no número de imagens
HardemImageOptimization.getConfigForImageCount = function(imageCount) {
    if (imageCount <= 10) return this.dynamicQuality.upTo10;
    if (imageCount <= 25) return this.dynamicQuality.upTo25;
    if (imageCount <= 50) return this.dynamicQuality.upTo50;
    return this.dynamicQuality.above50;
};

// Função para detectar dispositivo
HardemImageOptimization.detectDevice = function() {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
};

// Função para obter configuração de contexto
HardemImageOptimization.getContextConfig = function(imageCount) {
    if (imageCount <= 15) return this.contexts.initial;
    if (imageCount <= 30) return this.contexts.batch;
    return this.contexts.emergency;
};

// Função para calcular configuração otimizada
HardemImageOptimization.getOptimizedConfig = function(imageCount, imageType = 'normal') {
    const baseConfig = this.limits[imageType];
    const dynamicConfig = this.getConfigForImageCount(imageCount);
    const deviceConfig = this.device[this.detectDevice()];
    const contextConfig = this.getContextConfig(imageCount);
    
    return {
        maxWidth: Math.min(baseConfig.maxWidth, deviceConfig.maxWidth),
        maxHeight: Math.min(baseConfig.maxHeight, deviceConfig.maxHeight),
        quality: Math.min(baseConfig.quality, dynamicConfig.quality, deviceConfig.quality),
        maxFileSize: Math.min(baseConfig.maxFileSize, dynamicConfig.maxSize, deviceConfig.maxFileSize),
        compressionSteps: baseConfig.compressionSteps,
        aggressiveCompression: contextConfig.aggressiveCompression || false,
        ultraCompression: contextConfig.ultraCompression || false
    };
};

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HardemImageOptimization;
} else if (typeof window !== 'undefined') {
    window.HardemImageOptimization = HardemImageOptimization;
} 