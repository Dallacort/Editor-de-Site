const fs = require('fs');
const path = require('path');

// Lista de páginas HTML importantes que devem ser editadas
const pagesToEdit = [
    'index.html',
    '404.html',
    'about.html',
    'account.html',
    'admin-panel.html',
    'appoinment.html',
    'blog-details.html',
    'blog-grid.html',
    'blog-list.html',
    'careers.html',
    'cart.html',
    'checkout.html',
    'coming-soon.html',
    'company-history.html',
    'company-story.html',
    'company-values.html',
    'contact.html',
    'faq.html',
    'gallery.html',
    'index-four.html',
    'limpar-dados-antigos.html',
    'our-clients.html',
    'our-office.html',
    'pricing.html',
    'pricing-2.html',
    'privacy-policy.html',
    'project.html',
    'project-card.html',
    'project-card-hover.html',
    'project-details.html',
    'project-details-2.html',
    'project-details-3.html',
    'project-details-gallery.html',
    'project-details-large-image.html',
    'project-four-column.html',
    'project-four-column-wide.html',
    'project-hide-content.html',
    'project-hide-content-col-3.html',
    'project-hide-show.html',
    'project-list.html',
    'project-slider.html',
    'project-slider-2.html',
    'project-slider-3.html',
    'project-slider-hover.html',
    'project-three-column.html',
    'project-three-column-wide.html',
    'project-two-column.html',
    'project-two-column-wide.html',
    'project-zoom-slider.html',
    'safety.html',
    'service.html',
    'service-single.html',
    'service-single-two.html',
    'service-single-three.html',
    'service-single-four.html',
    'service-single-five.html',
    'shop.html',
    'single-product.html',
    'single-product-left.html',
    'single-product-right.html',
    'single-produt-right.html',
    'sustainability.html',
    'team.html',
    'team-details.html',
    'terms-of-condition.html',
    'vision.html',
    'working-process.html',
    'working-process-2.html'
];

function cleanOldScripts(content) {
    // Regex para remover o bloco de scripts antigos inteiros, incluindo comentários
    const oldBlockRegex = /<!--\s*Editor Refatorado Scripts\s*-->[\s\S]*?editor-refatorado\.js"><\/script>/gi;
    content = content.replace(oldBlockRegex, '');
    
    // Regex para remover scripts individuais, caso o bloco não seja encontrado
    const individualScripts = [
        /<!--.*?-->\s*<script\s+src="assets\/js\/editor-refatorado\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor-refatorado\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-core\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-ui\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-text\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-image\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-carousel\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-storage\.js"><\/script>/gi,
        /<script\s+src="assets\/js\/editor\/editor-utils\.js"><\/script>/gi,
        // Também remove o editor-manager para evitar duplicatas
        /<script\s+src="assets\/js\/editor-manager\.js"><\/script>/gi
    ];

    individualScripts.forEach(regex => {
        content = content.replace(regex, '');
    });

    return content;
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // 1. Limpa TODOS os scripts de editor, antigos e o manager (para garantir)
        content = cleanOldScripts(content);

        // 2. Adiciona APENAS o script do editor-manager antes do main.js
        const mainJsScript = 'assets/js/main.js';
        const managerScript = `
    <!-- Inclusão do Gerenciador do Editor Hardem -->
    <script src="assets/js/editor-manager.js"></script>
`;
        
        if (content.includes(mainJsScript)) {
            content = content.replace(mainJsScript, `${managerScript}\n    <script src="${mainJsScript}"></script>`);
        } else if (content.includes('</body>')) {
             content = content.replace('</body>', `${managerScript}\n</body>`);
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Sistema de edição ATUALIZADO em: ${path.basename(filePath)}`);
        } else {
            console.log(`⏭️ Arquivo ${path.basename(filePath)} não precisou de atualização.`);
        }
    } catch (error) {
        console.error(`❌ Erro ao processar ${path.basename(filePath)}:`, error.message);
    }
}

console.log('🚀 Iniciando a GRANDE ATUALIZAÇÃO do sistema de edição...');
console.log('Esta operação vai remover todos os scripts de edição antigos e instalar o novo "editor-manager".');
console.log('---');

pagesToEdit.forEach(page => {
    const filePath = path.join(__dirname, page);
    if (fs.existsSync(filePath)) {
        processFile(filePath);
    } else {
        console.warn(`⚠️ Arquivo ${page} não encontrado, pulando.`);
    }
});

console.log('---');
console.log('🎉 Atualização concluída!'); 