// Script de debug para carrossel
// Execute no console do navegador

console.log('🧪 Debug do Carrossel...');

function debugCarousel() {
    const slides = document.querySelectorAll('.swiper-slide');
    console.log(`🎠 Encontrados ${slides.length} slides`);
    
    slides.forEach((slide, index) => {
        console.group(`🧩 Slide ${index + 1}:`);
        
        // Verificar o slide em si
        const slideStyle = window.getComputedStyle(slide);
        const slideBg = slideStyle.backgroundImage;
        
        console.log('Background do slide:', slideBg);
        console.log('Classe editável:', slide.classList.contains('hardem-editable-element'));
        console.log('Data-key:', slide.getAttribute('data-key'));
        
        // Verificar elementos filhos
        const childElements = slide.querySelectorAll('*');
        let bgCount = 0;
        
        childElements.forEach(child => {
            const childStyle = window.getComputedStyle(child);
            const childBg = childStyle.backgroundImage;
            
            if (childBg && childBg !== 'none' && !childBg.includes('gradient')) {
                console.log(`🖼️ Background ${bgCount + 1}:`, {
                    element: child,
                    tagName: child.tagName,
                    className: child.className,
                    dataKey: child.getAttribute('data-key'),
                    backgroundImage: childBg
                });
                bgCount++;
            }
        });
        
        console.log(`Total backgrounds no slide: ${bgCount}`);
        console.groupEnd();
    });
}

function testSlideClick(slideIndex = 0) {
    const slides = document.querySelectorAll('.swiper-slide');
    
    if (!slides[slideIndex]) {
        console.log(`❌ Slide ${slideIndex} não encontrado`);
        return;
    }
    
    console.log(`🎯 Testando clique no slide ${slideIndex}...`);
    
    // Ativar modo de edição se não estiver
    if (!window.hardemEditor?.editMode) {
        console.log('Ativando modo de edição...');
        window.hardemEditor?.toggleEditMode();
        
        setTimeout(() => {
            testSlideClick(slideIndex);
        }, 1000);
        return;
    }
    
    const slide = slides[slideIndex];
    slide.click();
    
    setTimeout(() => {
        const panel = document.getElementById('hardem-panel-content');
        if (panel) {
            console.log('📋 Conteúdo do painel:', panel.innerHTML.substring(0, 200) + '...');
            
            if (panel.innerHTML.includes('Background:')) {
                console.log('✅ Background detectado no painel!');
            } else {
                console.log('❌ Background não detectado no painel');
            }
        }
    }, 500);
}

// Executar debug
debugCarousel();

// Expor funções
window.debugCarousel = debugCarousel;
window.testSlideClick = testSlideClick;

console.log('🧪 Use testSlideClick(0) para testar o primeiro slide'); 