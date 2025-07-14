// HARDEM Editor - Persistência do modo edição ao navegar
(function() {
    // Não rodar em páginas administrativas
    var adminPages = ['admin.html', 'admin-panel.html'];
    var path = window.location.pathname.split('/').pop();
    if (adminPages.includes(path)) return;

    function isEditMode() {
        return new URLSearchParams(window.location.search).get('edit') === 'true';
    }

    // Se já está em modo edição, garantir que o parâmetro nunca suma
    function ensureEditParam() {
        var url = new URL(window.location.href);
        if (url.searchParams.get('edit') !== 'true') {
            url.searchParams.set('edit', 'true');
            window.location.replace(url.toString());
        }
    }

    // Só ativa a persistência se estiver em modo edição
    if (isEditMode()) {
        // Sempre garantir o parâmetro na URL
        window.addEventListener('popstate', ensureEditParam);
        window.addEventListener('hashchange', ensureEditParam);
        setInterval(ensureEditParam, 500); // Reforço extra para navegação JS
    } else {
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        var links = document.querySelectorAll('a[href]');
        links.forEach(function(link) {
            var href = link.getAttribute('href');
            // Ignorar links externos, âncoras e javascript:void(0)
            if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('javascript:')) return;
            // Já tem edit=true na URL de destino
            if (/([?&])edit=true(?![\w])/i.test(href)) return;
            // Não adicionar em links para páginas admin
            if (adminPages.some(function(admin) { return href.indexOf(admin) !== -1; })) return;
            // Separar hash se existir
            var hash = '';
            if (href.includes('#')) {
                hash = href.substring(href.indexOf('#'));
                href = href.substring(0, href.indexOf('#'));
            }
            // Adicionar ?edit=true ou &edit=true
            if (href.includes('?')) {
                href = href + '&edit=true';
            } else {
                href = href + '?edit=true';
            }
            // Garantir que não fique duplicado
            href = href.replace(/([?&])edit=true(&edit=true)+/g, '$1edit=true');
            link.setAttribute('href', href + hash);
        });
    });
})(); 