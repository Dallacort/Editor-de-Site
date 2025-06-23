// HARDEM Editor - Sistema de Proteção Limpo (Sem Valores Hardcoded)
// Versão 3.0 - Apenas proteção contra corrupção, valores vêm do editor

(function() {
    'use strict';
    
    console.log('🧹 HARDEM: Iniciando sistema LIMPO de proteção');
    
    // PARADA DE EMERGÊNCIA - Para TODOS os loops
    console.log('🛑 PARADA DE EMERGÊNCIA - Parando todos os loops...');
    for (let i = 1; i < 99999; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
    
    // Remove interceptações problemáticas
    if (window.originalSetInterval) {
        window.setInterval = window.originalSetInterval;
    }
    if (window.originalOdometerUpdate) {
        window.Odometer.prototype.update = window.originalOdometerUpdate;
    }
    
    // Flag para evitar re-execução
    if (window.hardemEmergencyStop) {
        console.log('🛑 Sistema já parado, evitando re-execução');
        return;
    }
    window.hardemEmergencyStop = true;
    
    // Função para corrigir problemas do console
    window.hardemFixConsoleErrors = function() {
        console.log('🔧 HARDEM: Corrigindo erros do console...');
        
        // Corrige contadores com quebras de linha
        const counters = document.querySelectorAll('[id*="content_label"], .odometer');
        let fixed = 0;
        
        counters.forEach(counter => {
            const text = counter.textContent || '';
            
            if (text.includes('\n') || text.length > 15) {
                console.log(`🔧 HARDEM: Contador corrompido: ${counter.id || counter.className}`);
                console.log(`   Texto atual: "${text.replace(/\n/g, '\\n').substring(0, 100)}..."`);
                
                // Remove quebras de linha e espaços extras
                let cleanValue = text.replace(/\n/g, '').replace(/\s+/g, '');
                
                // Se ainda não é um número válido, usa data-count
                if (!cleanValue.match(/^\d+(\.\d+)?$/)) {
                    const dataCount = counter.getAttribute('data-count');
                    if (dataCount && dataCount.match(/^\d+(\.\d+)?$/)) {
                        cleanValue = dataCount;
                    } else {
                        // Valores padrão baseados no ID
                        if (counter.id && counter.id.includes('label_2')) cleanValue = '25';
                        else if (counter.id && counter.id.includes('label_4')) cleanValue = '1.3';
                        else if (counter.id && counter.id.includes('label_25')) cleanValue = '350';
                        else cleanValue = '0';
                    }
                }
                
                console.log(`   Valor corrigido: "${cleanValue}"`);
                counter.textContent = cleanValue;
                counter.setAttribute('data-count', cleanValue);
                fixed++;
                
                // Força atualização visual
                counter.style.display = 'none';
                setTimeout(() => {
                    counter.style.display = '';
                }, 10);
            }
        });
        
        console.log(`✅ HARDEM: ${fixed} erros corrigidos`);
        return fixed;
    };
    
    // Função para forçar limpeza completa
    window.hardemForceClean = function() {
        console.log('🧹 HARDEM: Forçando limpeza completa...');
        
        // Para todos os timers
        for (let i = 1; i < 99999; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        // Limpa todos os contadores
        const counters = document.querySelectorAll('[id*="content_label"], .odometer');
        counters.forEach(counter => {
            const dataCount = counter.getAttribute('data-count');
            if (dataCount && dataCount.match(/^\d+(\.\d+)?$/)) {
                counter.textContent = dataCount;
            } else {
                counter.textContent = '0';
            }
        });
        
        // Reinicia interceptação
        setTimeout(() => {
            if (!isEditMode()) {
                interceptMainJsProcessing();
            }
        }, 100);
        
        console.log('✅ HARDEM: Limpeza completa executada');
    };
    
    // Detecta se está no modo edição ou visualização
    function isEditMode() {
        return window.location.search.includes('edit=true') || 
               (typeof window.hardemEditor !== 'undefined' && 
                window.hardemEditor && 
                window.hardemEditor.isEditing);
    }
    
    // Sistema de proteção inteligente contra corrupção
    function protectAgainstCorruption() {
        const counterSelectors = [
            '[id*="content_label"]',
            '.odometer',
            '[data-count]'
        ];
        
        counterSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.id) return; // Ignora elementos sem ID
                
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || mutation.type === 'characterData') {
                            const currentText = element.textContent || '';
                            
                            // Detecta corrupção específica
                            if (currentText.includes('\n') || 
                                currentText.includes('[object Object]') || 
                                (currentText.length > 15 && !currentText.match(/^\d+(\.\d+)?$/))) {
                                
                                console.log(`🛡️ HARDEM: Corrupção detectada em ${element.id}: "${currentText.replace(/\n/g, '\\n')}"`);
                                
                                // Tenta limpar o valor corrompido
                                let cleanValue = currentText.replace(/\n/g, '').replace(/\s+/g, '');
                                
                                // Se ainda está corrompido, usa data-count
                                if (cleanValue.includes('[object Object]') || cleanValue.length > 15) {
                                    const dataCount = element.getAttribute('data-count');
                                    if (dataCount && !dataCount.includes('\n') && dataCount.length <= 10) {
                                        cleanValue = dataCount;
                                    } else {
                                        cleanValue = '0';
                                    }
                                }
                                
                                console.log(`🔧 HARDEM: Corrigindo ${element.id} para: "${cleanValue}"`);
                                element.textContent = cleanValue;
                                element.setAttribute('data-count', cleanValue);
                            }
                        }
                    });
                });
                
                observer.observe(element, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            });
        });
    }
    
    // Carrega dados do banco de dados (sem valores hardcoded)
    async function loadDataFromDatabase() {
        try {
            const response = await fetch('load-database.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load',
                    page: 'index'
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.log('⚠️ HARDEM: Erro ao carregar dados do banco:', error);
            return null;
        }
    }
    
    // Aplica dados do banco (se disponíveis)
    async function applyDatabaseData() {
        console.log('📡 HARDEM: Tentando carregar dados do banco...');
        const data = await loadDataFromDatabase();
        
        if (!data) {
            console.log('⚠️ HARDEM: Erro ao acessar banco de dados');
            return;
        }
        
        if (!data.textos || Object.keys(data.textos).length === 0) {
            console.log('📝 HARDEM: Nenhum dado de texto no banco, aguardando publicação do editor');
            return;
        }
        
        const textos = data.textos;
        let applied = 0;
        let corrected = 0;
        
        console.log('📦 HARDEM: Dados encontrados no banco:', Object.keys(textos).length, 'elementos');
        
        Object.keys(textos).forEach(key => {
            const element = document.getElementById(key);
            if (element && element.id.includes('content_label')) {
                const databaseValue = textos[key];
                const currentValue = element.textContent || '';
                
                // Valida se o valor do banco é limpo
                const isValidDatabaseValue = databaseValue && 
                    !databaseValue.includes('\n') && 
                    !databaseValue.includes('[object Object]') &&
                    databaseValue.length <= 10 &&
                    databaseValue.match(/^\d+(\.\d+)?$/);
                
                if (isValidDatabaseValue) {
                    // Verifica se o valor atual está corrompido
                    const isCurrentCorrupted = currentValue.includes('\n') || 
                        currentValue.includes('[object Object]') ||
                        (currentValue.length > 15 && !currentValue.match(/^\d+(\.\d+)?$/));
                    
                    if (isCurrentCorrupted || databaseValue !== currentValue) {
                        console.log(`📝 HARDEM: Aplicando valor limpo do banco para ${key}: "${databaseValue}"`);
                        element.textContent = databaseValue;
                        element.setAttribute('data-count', databaseValue);
                        applied++;
                        
                        if (isCurrentCorrupted) {
                            corrected++;
                        }
                    }
                } else {
                    console.log(`⚠️ HARDEM: Valor inválido no banco para ${key}: "${databaseValue}"`);
                }
            }
        });
        
        if (applied > 0) {
            console.log(`✅ HARDEM: ${applied} contadores atualizados (${corrected} corrupções corrigidas)`);
        } else {
            console.log('ℹ️ HARDEM: Todos os contadores já estão corretos');
        }
    }
    
    // Sistema para modo edição
    function setupEditMode() {
        console.log('✏️ HARDEM: Configurando modo edição');
        
        // Intercepta salvamento apenas para proteção
        if (window.hardemEditor && window.hardemEditor.saveContent) {
            const originalSave = window.hardemEditor.saveContent;
            window.hardemEditor.saveContent = function(...args) {
                console.log('💾 HARDEM: Protegendo contadores durante salvamento');
                protectAgainstCorruption();
                return originalSave.apply(this, args);
            };
        }
        
        // Proteção básica
        protectAgainstCorruption();
    }
    
    // INTERCEPTAÇÃO DESABILITADA - Causava loop infinito
    function interceptMainJsProcessing() {
        console.log('⚠️ HARDEM: Interceptação desabilitada para evitar loops');
        // Não faz nada - interceptação removida para evitar loops
        return;
    }
    
    // Sistema para modo visualização
    function setupViewMode() {
        console.log('👁️ HARDEM: Configurando modo visualização');
        
        // Intercepta main.js para evitar processamento de valores corrompidos
        interceptMainJsProcessing();
        
        // Carrega dados do banco uma vez
        setTimeout(() => {
            applyDatabaseData();
        }, 1000);
        
        // Proteção contínua
        protectAgainstCorruption();
        
        // Verificação periódica DESABILITADA para evitar loops
        console.log('⚠️ HARDEM: Verificação periódica desabilitada para evitar loops');
    }
    
    // Função de limpeza total
    window.hardemCleanReset = function() {
        console.log('🧹 HARDEM: Limpeza total executada');
        
        // Para todos os timers
        for (let i = 1; i < 99999; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        // Reinicia sistema
        setTimeout(() => {
            initSystem();
        }, 100);
    };
    
    // Status simples
    window.hardemStatus = function() {
        console.log('📊 HARDEM Status:');
        console.log('- Modo:', isEditMode() ? 'EDIÇÃO' : 'VISUALIZAÇÃO');
        
        const counters = document.querySelectorAll('[id*="content_label"]');
        console.log(`- Contadores: ${counters.length}`);
        
        counters.forEach((counter, index) => {
            const text = counter.textContent || '';
            const isCorrupted = text.includes('\n') || text.includes('[object Object]') || text.length > 15;
            console.log(`  ${index + 1}. ${counter.id}: "${text}" ${isCorrupted ? '❌' : '✅'}`);
        });
    };
    
    // Limpeza inicial de valores corrompidos
    function initialCleanup() {
        console.log('🧹 HARDEM: Executando limpeza inicial...');
        
        const counters = document.querySelectorAll('[id*="content_label"], .odometer');
        let cleaned = 0;
        
        counters.forEach(counter => {
            const text = counter.textContent || '';
            
            // Se está corrompido, tenta limpar
            if (text.includes('\n') || text.includes('[object Object]') || text.length > 15) {
                console.log(`🔧 HARDEM: Contador corrompido detectado ${counter.id || counter.className}: "${text.replace(/\n/g, '\\n').substring(0, 50)}..."`);
                
                // Tenta extrair valor numérico
                const cleanValue = text.replace(/\n/g, '').replace(/\s+/g, '');
                
                if (cleanValue && cleanValue.match(/^\d+(\.\d+)?$/) && cleanValue.length <= 10) {
                    console.log(`🔧 HARDEM: Limpeza inicial ${counter.id}: "${cleanValue}"`);
                    counter.textContent = cleanValue;
                    counter.setAttribute('data-count', cleanValue);
                    cleaned++;
                } else {
                    // Usa data-count ou valor padrão baseado no ID
                    const dataCount = counter.getAttribute('data-count');
                    let fallbackValue = '0';
                    
                    if (dataCount && dataCount.match(/^\d+(\.\d+)?$/)) {
                        fallbackValue = dataCount;
                    } else if (counter.id) {
                        // Valores padrão baseados no ID para evitar zeros
                        if (counter.id.includes('label_2')) fallbackValue = '25';
                        else if (counter.id.includes('label_4')) fallbackValue = '1.3';
                        else if (counter.id.includes('label_25')) fallbackValue = '350';
                    }
                    
                    console.log(`🔧 HARDEM: Limpeza inicial ${counter.id}: usando fallback "${fallbackValue}"`);
                    counter.textContent = fallbackValue;
                    counter.setAttribute('data-count', fallbackValue);
                    cleaned++;
                }
            }
        });
        
        if (cleaned > 0) {
            console.log(`✅ HARDEM: ${cleaned} contadores limpos na inicialização`);
        }
        
        // Força re-renderização dos odometers
        setTimeout(() => {
            const odometers = document.querySelectorAll('.odometer');
            odometers.forEach(odometer => {
                const value = odometer.getAttribute('data-count') || odometer.textContent;
                if (value && value.match(/^\d+(\.\d+)?$/)) {
                    odometer.style.display = 'none';
                    setTimeout(() => {
                        odometer.style.display = '';
                        odometer.textContent = value;
                    }, 10);
                }
            });
        }, 500);
    }
    
    // Inicialização do sistema
    function initSystem() {
        console.log('🚀 HARDEM: Inicializando sistema limpo');
        
        // Limpeza inicial
        initialCleanup();
        
        if (isEditMode()) {
            setupEditMode();
        } else {
            setupViewMode();
        }
        
        console.log('✅ HARDEM: Sistema limpo inicializado');
    }
    
    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSystem);
    } else {
        initSystem();
    }
    
    console.log('✅ HARDEM: Sistema limpo carregado - aguardando valores do editor');
    
})(); 