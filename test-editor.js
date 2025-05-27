// Script de teste para verificar o HARDEM Editor
// Execute no console do navegador: copy(testEditor.js) e cole

console.log('🧪 Teste do HARDEM Editor iniciado...');

// 1. Verificar se o editor existe
if (window.hardemEditor) {
    console.log('✅ Editor encontrado:', window.hardemEditor);
} else {
    console.log('❌ Editor não encontrado!');
    return;
}

// 2. Testar modo de edição
const toggleBtn = document.getElementById('hardem-toggle-edit');
if (toggleBtn) {
    console.log('✅ Botão toggle encontrado');
    console.log('Estado atual:', window.hardemEditor.editMode ? 'ATIVO' : 'INATIVO');
} else {
    console.log('❌ Botão toggle não encontrado!');
}

// 3. Verificar elementos editáveis se modo estiver ativo
if (window.hardemEditor.editMode) {
    const editableElements = document.querySelectorAll('.hardem-editable-element');
    console.log(`✅ ${editableElements.length} elementos editáveis encontrados`);
    
    // Testar primeiro elemento
    if (editableElements.length > 0) {
        const firstElement = editableElements[0];
        console.log('Primeiro elemento editável:', firstElement);
        console.log('Data-key:', firstElement.getAttribute('data-key'));
        console.log('Conteúdo:', firstElement.textContent.slice(0, 50) + '...');
    }
} else {
    console.log('⚠️ Modo de edição não está ativo. Ative primeiro.');
}

// 4. Verificar carrosséis e slides
const swipers = document.querySelectorAll('.swiper');
console.log(`🎠 ${swipers.length} carrosséis encontrados`);

swipers.forEach((swiper, index) => {
    const slides = swiper.querySelectorAll('.swiper-slide');
    console.log(`  Carrossel ${index + 1}: ${slides.length} slides`);
    
    slides.forEach((slide, slideIndex) => {
        const slideElements = slide.querySelectorAll('[data-key]');
        console.log(`    Slide ${slideIndex + 1}: ${slideElements.length} elementos editáveis`);
    });
});

// 5. Verificar localStorage
const saved = localStorage.getItem('siteContent');
if (saved) {
    try {
        const parsed = JSON.parse(saved);
        console.log(`💾 ${Object.keys(parsed).length} itens salvos no localStorage`);
    } catch (e) {
        console.log('❌ Dados do localStorage corrompidos');
    }
} else {
    console.log('📭 Nenhum dado salvo no localStorage');
}

console.log('🧪 Teste concluído!');

// Função helper para ativar edição automaticamente
window.testEditMode = function() {
    if (!window.hardemEditor.editMode) {
        document.getElementById('hardem-toggle-edit').click();
        setTimeout(() => {
            console.log('✅ Modo de edição ativado automaticamente!');
            const editableElements = document.querySelectorAll('.hardem-editable-element');
            console.log(`🎯 ${editableElements.length} elementos agora editáveis`);
        }, 1000);
    }
};

// Função helper para testar slide específico
window.testSlide = function(slideIndex = 0) {
    const slides = document.querySelectorAll('.swiper-slide');
    if (slides[slideIndex]) {
        console.log(`🧩 Testando slide ${slideIndex}:`, slides[slideIndex]);
        if (window.hardemEditor.editMode) {
            slides[slideIndex].click();
            console.log('Slide clicado! Verifique o painel lateral.');
        } else {
            console.log('⚠️ Ative o modo de edição primeiro.');
        }
    } else {
        console.log(`❌ Slide ${slideIndex} não encontrado.`);
    }
}; 