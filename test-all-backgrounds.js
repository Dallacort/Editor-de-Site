// Script para testar detecção de background images em toda a página
// Execute no console do navegador

console.log('🧪 Teste de Background Images - Página Completa...');

// Função para análise completa da página
function analyzeAllBackgrounds() {
    console.log('📊 Analisando backgrounds em toda a página...');
    
    const allElements = document.querySelectorAll('*');
    let totalBackgrounds = 0;
    let editableBackgrounds = 0;
    
    const backgroundData = [];
    
    allElements.forEach((element, index) => {
        // Pular elementos do editor
        if (element.closest('.hardem-editor-toolbar') || 
            element.closest('.hardem-editor-sidepanel')) {
            return;
        }
        
        const computedStyle = window.getComputedStyle(element);
        const bgImage = computedStyle.backgroundImage;
        
        if (bgImage && bgImage !== 'none') {
            totalBackgrounds++;
            
            const isGradient = bgImage.includes('gradient');
            const isEditable = !isGradient && element.classList.contains('hardem-editable-element');
            
            if (!isGradient) {
                editableBackgrounds++;
            }
            
            backgroundData.push({
                element: element,
                tagName: element.tagName,
                className: element.className,
                dataKey: element.getAttribute('data-key'),
                backgroundImage: bgImage,
                isGradient: isGradient,
                isEditable: isEditable,
                position: {
                    top: element.offsetTop,
                    left: element.offsetLeft,
                    width: element.offsetWidth,
                    height: element.offsetHeight
                }
            });
        }
    });
    
    console.log(`📈 Resultados da análise:`);
    console.log(`   Total de elementos com background: ${totalBackgrounds}`);
    console.log(`   Backgrounds editáveis (não-gradient): ${editableBackgrounds}`);
    console.log(`   Backgrounds detectados pelo editor: ${document.querySelectorAll('.hardem-editable-element[title*="Background"]').length}`);
    
    // Mostrar detalhes dos backgrounds não-gradient
    const nonGradientBgs = backgroundData.filter(bg => !bg.isGradient);
    console.group('🖼️ Backgrounds Editáveis Detectados:');
    nonGradientBgs.forEach((bg, index) => {
        console.log(`${index + 1}. ${bg.tagName}${bg.className ? '.' + bg.className.split(' ').join('.') : ''}`, {
            dataKey: bg.dataKey,
            isEditable: bg.isEditable,
            dimensions: `${bg.position.width}x${bg.position.height}`,
            element: bg.element
        });
    });
    console.groupEnd();
    
    return backgroundData;
}

// Função para testar clique em background específico
function testBackgroundElement(index = 0) {
    const editableBackgrounds = document.querySelectorAll('.hardem-editable-element[title*="Background"]');
    
    if (!editableBackgrounds[index]) {
        console.log(`❌ Background editável ${index} não encontrado`);
        console.log(`Disponíveis: ${editableBackgrounds.length} backgrounds`);
        return;
    }
    
    if (!window.hardemEditor || !window.hardemEditor.editMode) {
        console.log('⚠️ Editor não está ativo. Ativando...');
        window.hardemEditor.toggleEditMode();
        
        setTimeout(() => {
            testBackgroundElement(index);
        }, 1000);
        return;
    }
    
    const element = editableBackgrounds[index];
    console.log(`🎯 Testando background ${index}:`, element);
    
    // Destacar elemento
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.outline = '3px solid #f39c12';
    element.style.outlineOffset = '5px';
    
    // Simular clique
    setTimeout(() => {
        element.click();
        
        setTimeout(() => {
            const panel = document.getElementById('hardem-panel-content');
            if (panel && panel.innerHTML.includes('Background Image:')) {
                console.log('✅ Background apareceu no painel!');
            } else {
                console.log('❌ Background não apareceu no painel');
            }
            
            // Remover destaque
            element.style.outline = '';
            element.style.outlineOffset = '';
        }, 500);
    }, 1000);
}

// Função para listar todos os backgrounds editáveis
function listEditableBackgrounds() {
    const editableBackgrounds = document.querySelectorAll('.hardem-editable-element[title*="Background"]');
    console.log(`📋 ${editableBackgrounds.length} backgrounds editáveis encontrados:`);
    
    editableBackgrounds.forEach((element, index) => {
        const dataKey = element.getAttribute('data-key');
        const tagName = element.tagName;
        const className = element.className;
        
        console.log(`${index}: ${tagName}${className ? '.' + className.split(' ').join('.') : ''} (${dataKey})`);
    });
    
    return editableBackgrounds;
}

// Executar análise
const backgroundData = analyzeAllBackgrounds();

// Expor funções globalmente
window.analyzeAllBackgrounds = analyzeAllBackgrounds;
window.testBackgroundElement = testBackgroundElement;
window.listEditableBackgrounds = listEditableBackgrounds;

console.log('🧪 Comandos disponíveis:');
console.log('   analyzeAllBackgrounds() - Análise completa');
console.log('   listEditableBackgrounds() - Listar editáveis');
console.log('   testBackgroundElement(0) - Testar background específico'); 