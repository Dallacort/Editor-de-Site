/**
 * HARDEM - Correção Definitiva dos Contadores
 * Bloqueia completamente o reprocessamento de contadores
 */

(function() {
    'use strict';
    
    // Controle de contadores processados
    let processedCounters = new Set();
    let systemInitialized = false;
    
    // Função para processar um contador uma única vez
    function processCounterOnce(element) {
        const $element = $(element);
        const dataKey = $element.attr('data-key');
        
        if (processedCounters.has(dataKey)) {
            return false; // Já foi processado
        }
        
        // Marcar como processado
        processedCounters.add(dataKey);
        $element.addClass('odometer-processed');
        
        // Obter valor final correto
        let finalValue;
        const currentText = $element.text().trim();
        
        // Verificar se tem dados salvos no editor
        if (window.hardemEditor && window.hardemEditor.contentMap && dataKey && 
            window.hardemEditor.contentMap[dataKey] && 
            window.hardemEditor.contentMap[dataKey].isCounter && 
            window.hardemEditor.contentMap[dataKey].counterValue !== undefined) {
            
            finalValue = window.hardemEditor.contentMap[dataKey].counterValue;
            
        } else if (window.hardemEditor && window.hardemEditor.contentMap && dataKey && 
                   window.hardemEditor.contentMap[dataKey] && 
                   window.hardemEditor.contentMap[dataKey].text) {
            
            finalValue = window.hardemEditor.contentMap[dataKey].text;
            
        } else if (currentText && currentText !== '00' && currentText !== '0' && !currentText.includes('\n')) {
            // Usar texto atual se não tem quebras de linha
            finalValue = currentText;
            
        } else {
            // Fallback para data-count
            finalValue = $element.attr('data-count') || '0';
        }
        
        // Processar como número
        if (typeof finalValue === 'string') {
            finalValue = finalValue.replace(',', '.');
        }
        
        const numericValue = parseFloat(finalValue);
        if (!isNaN(numericValue)) {
            finalValue = numericValue.toString();
        }
        
        // Aplicar animação do odometer apenas uma vez
        $element.html(finalValue);
        
        return true; // Processado com sucesso
    }
    
    // Função para processar todos os contadores visíveis
    function processAllVisibleCounters() {
        let processedCount = 0;
        
        $('.odometer').each(function() {
            if (isInViewport(this)) {
                if (processCounterOnce(this)) {
                    processedCount++;
                }
            }
        });
        
        return processedCount;
    }
    
    // Função para verificar se elemento está visível
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Interceptar e bloquear todas as funções de contador do main.js
    function interceptMainJsCounters() {
        // Interceptar qualquer função de odometer
        if (typeof window.triggerOdometer === 'function') {
            window.triggerOdometer = function(element) {
                // Só processar se não foi processado ainda
                const $element = $(element);
                const dataKey = $element.attr('data-key');
                
                if (processedCounters.has(dataKey)) {
                    return; // Já processado, não fazer nada
                }
                
                processCounterOnce(element);
            };
        }
        
        // Interceptar handleOdometer se existir
        if (typeof window.handleOdometer === 'function') {
            window.handleOdometer = function() {
                // Função desabilitada
                return;
            };
        }
        
        // Bloquear todos os listeners de scroll relacionados a contadores
        $(window).off('scroll.odometer scroll.counter');
        
        // Remover listeners de scroll que chamam handleOdometer
        const originalOn = $.fn.on;
        $.fn.on = function(events, ...args) {
            if (typeof events === 'string' && events.includes('scroll')) {
                // Verificar se é relacionado a contadores
                const handler = args[args.length - 1];
                if (typeof handler === 'function') {
                    const handlerStr = handler.toString();
                    if (handlerStr.includes('odometer') || handlerStr.includes('handleOdometer') || 
                        handlerStr.includes('triggerOdometer')) {
                        // Bloquear este listener
                        return this;
                    }
                }
            }
            return originalOn.apply(this, [events, ...args]);
        };
        
        // Interceptar diretamente o jQuery scroll handler
        const $window = $(window);
        const originalScrollHandlers = $._data(window, 'events');
        
        if (originalScrollHandlers && originalScrollHandlers.scroll) {
            // Remover handlers de scroll relacionados a contadores
            originalScrollHandlers.scroll = originalScrollHandlers.scroll.filter(handler => {
                const handlerStr = handler.handler.toString();
                return !(handlerStr.includes('odometer') || handlerStr.includes('handleOdometer') || 
                        handlerStr.includes('triggerOdometer'));
            });
        }
    }
    
    // Inicializar sistema
    function initializeSystem() {
        if (systemInitialized) return;
        
        systemInitialized = true;
        
        // Interceptar funções do main.js
        interceptMainJsCounters();
        
        // Processar contadores visíveis uma única vez
        const processedCount = processAllVisibleCounters();
        
        if (processedCount > 0) {
        }
        
        // Observar novos contadores que possam aparecer
        const observer = new MutationObserver(() => {
            $('.odometer').each(function() {
                const dataKey = $(this).attr('data-key');
                if (!processedCounters.has(dataKey) && isInViewport(this)) {
                    processCounterOnce(this);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Função pública para resetar um contador
    window.resetCounter = function(dataKey) {
        processedCounters.delete(dataKey);
        $(`.odometer[data-key="${dataKey}"]`).removeClass('odometer-processed odometer-triggered');
    };
    
    // Função pública para resetar todos os contadores
    window.resetAllCounters = function() {
        processedCounters.clear();
        $('.odometer').removeClass('odometer-processed odometer-triggered');
        systemInitialized = false;
    };
    
    // Inicializar quando jQuery estiver disponível
    if (typeof $ !== 'undefined') {
        $(document).ready(function() {
            // Aguardar um pouco para garantir que o main.js carregou
            setTimeout(initializeSystem, 100);
        });
    }
    
    // Se o editor estiver ativo
    document.addEventListener('hardem-editor-content-loaded', function() {
        setTimeout(initializeSystem, 100);
    });
    
    // Garantir que o sistema seja inicializado mesmo se os eventos acima falharem
    window.addEventListener('load', function() {
        setTimeout(initializeSystem, 200);
    });
    
})(); 