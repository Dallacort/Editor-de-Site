// Script para testar detecção de background images em slides
// Execute no console do navegador

console.log('🧪 Teste de Background Images em Slides...');

// Função para testar detecção de backgrounds
function testBackgroundDetection() {
    const slides = document.querySelectorAll('.swiper-slide');
    console.log(`📊 Encontrados ${slides.length} slides para análise`);
    
    slides.forEach((slide, index) => {
        console.group(`🧩 Slide ${index + 1}:`);
        
        // Verificar background do próprio slide
        const slideStyle = window.getComputedStyle(slide);
        const slideBg = slideStyle.backgroundImage;
        
        if (slideBg && slideBg !== 'none') {
            console.log('🖼️ Background do slide:', slideBg);
        }
        
        // Verificar backgrounds de elementos filhos
        const allElements = slide.querySelectorAll('*');
        let bgCount = 0;
        
        allElements.forEach((el, elIndex) => {
            const elStyle = window.getComputedStyle(el);
            const elBg = elStyle.backgroundImage;
            
            if (elBg && elBg !== 'none' && !elBg.includes('gradient')) {
                console.log(`🖼️ Background ${bgCount + 1}:`, {
                    element: el,
                    tagName: el.tagName,
                    dataKey: el.getAttribute('data-key'),
                    backgroundImage: elBg
                });
                bgCount++;
            }
        });
        
        console.log(`📈 Total de backgrounds: ${bgCount}`);
        console.groupEnd();
    });
}

// Função para forçar clique em slide e verificar painel
function testSlidePanel(slideIndex = 0) {
    const slides = document.querySelectorAll('.swiper-slide');
    
    if (!slides[slideIndex]) {
        console.log(`❌ Slide ${slideIndex} não encontrado`);
        return;
    }
    
    if (!window.hardemEditor || !window.hardemEditor.editMode) {
        console.log('⚠️ Editor não está ativo. Ativando...');
        window.hardemEditor.toggleEditMode();
        
        setTimeout(() => {
            testSlidePanel(slideIndex);
        }, 1000);
        return;
    }
    
    console.log(`🎯 Testando slide ${slideIndex}...`);
    slides[slideIndex].click();
    
    setTimeout(() => {
        const panel = document.getElementById('hardem-panel-content');
        if (panel && panel.innerHTML.includes('Background:')) {
            console.log('✅ Background detectado no painel!');
        } else {
            console.log('❌ Background não detectado no painel');
        }
    }, 500);
}

// Executar testes
testBackgroundDetection();

// Expor funções globalmente
window.testBackgroundDetection = testBackgroundDetection;
window.testSlidePanel = testSlidePanel;

console.log('🧪 Para testar painel do slide, execute: testSlidePanel(0)'); 