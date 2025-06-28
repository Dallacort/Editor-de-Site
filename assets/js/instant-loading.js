/**
 * HARDEM - Sistema de Loading Screen
 * Controla a exibição e ocultação da tela de loading
 */

(function() {
    'use strict';

    // Função para esconder o loading
    function hideLoading() {
        document.body.classList.add('hardem-content-loaded');
        setTimeout(() => {
            const loading = document.getElementById('hardem-instant-loading');
            if (loading) {
                loading.classList.add('hardem-loading-hidden');
            }
        }, 300);
    }

    // Função para mostrar o loading
    function showLoading() {
        document.body.classList.remove('hardem-content-loaded');
        const loading = document.getElementById('hardem-instant-loading');
        if (loading) {
            loading.classList.remove('hardem-loading-hidden');
        }
    }

    // Esconder loading quando a página carregar
    if (document.readyState === 'complete') {
        hideLoading();
    } else {
        window.addEventListener('load', hideLoading);
    }

    // Se o editor estiver ativo, aguardar ele carregar
    document.addEventListener('hardem-editor-content-loaded', hideLoading);

    // Exportar funções para uso global
    window.hardemLoading = {
        show: showLoading,
        hide: hideLoading
    };
})(); 