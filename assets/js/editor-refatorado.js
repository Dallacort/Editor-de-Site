/**
 * HARDEM Editor Refatorado - Arquivo Principal
 * Carrega todos os módulos do editor de forma organizada
 * @version 2.0.0
 * @author HARDEM Editor Team
 */

(function() {
    'use strict';
    
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