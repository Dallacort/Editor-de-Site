/**
 * HARDEM Editor Refatorado - Arquivo Principal
 * Carrega todos os módulos do editor de forma organizada
 * @version 2.0.0
 * @author HARDEM Editor Team
 */

(function() {
    'use strict';
    
    console.log('🚀 Iniciando HARDEM Editor Refatorado...');
    
    // Verificar se todos os módulos foram carregados
    function checkModules() {
        const requiredModules = [
            'HardemEditorCore',
            'HardemEditorUI', 
            'HardemTextEditor',
            'HardemImageEditor',
            'HardemCarouselEditor',
            'HardemEditorStorage',
            'HardemEditorUtils'
        ];
        
        const missingModules = requiredModules.filter(module => typeof window[module] === 'undefined');
        
        if (missingModules.length > 0) {
            console.error('❌ Módulos não encontrados:', missingModules);
            console.error('Certifique-se de que todos os arquivos do editor foram carregados:');
            console.error('- editor-core.js');
            console.error('- editor-ui.js'); 
            console.error('- editor-text.js');
            console.error('- editor-image.js');
            console.error('- editor-carousel.js');
            console.error('- editor-storage.js');
            console.error('- editor-utils.js');
            return false;
        }
        
        return true;
    }
    
    // Inicializar editor quando DOM estiver pronto
    function initEditor() {
        if (!checkModules()) {
            setTimeout(initEditor, 100); // Tentar novamente após 100ms
            return;
        }
        
        try {
            window.hardemEditor = new HardemEditorCore();
            console.log('✅ HARDEM Editor Refatorado iniciado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar editor:', error);
        }
    }
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditor);
    } else {
        initEditor();
    }
    
})(); 