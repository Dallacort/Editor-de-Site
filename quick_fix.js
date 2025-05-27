// Script para corrigir problema do [object Object] - Execute no console do navegador

console.log('🚨 Iniciando correção de emergência...');

// 1. Limpar localStorage corrompido
localStorage.removeItem('siteContent');
console.log('✅ localStorage limpo');

// 2. Encontrar e corrigir elementos com [object Object]
const corruptedElements = document.querySelectorAll('*');
let fixedCount = 0;

corruptedElements.forEach(element => {
    if (element.textContent && element.textContent.includes('[object Object]')) {
        // Se o elemento tiver data-key, tentar restaurar do atributo original
        const dataKey = element.getAttribute('data-key');
        if (dataKey) {
            console.log(`🔧 Corrigindo elemento: ${dataKey}`);
            // Remover conteúdo corrompido - será restaurado no próximo reload
            if (element.children.length === 0) {
                element.textContent = `[${dataKey}]`; // Placeholder temporário
            }
            fixedCount++;
        }
    }
});

console.log(`✅ ${fixedCount} elementos corrigidos`);

// 3. Recarregar a página para restaurar conteúdo original
console.log('🔄 Recarregando página em 2 segundos...');
setTimeout(() => {
    window.location.reload();
}, 2000); 