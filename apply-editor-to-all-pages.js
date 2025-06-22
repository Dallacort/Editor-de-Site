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

// Verifica se o arquivo já tem a referência ao editor-refatorado.js
function hasEditorScript(content) {
    return content.includes('assets/js/editor-refatorado.js') || 
           content.includes('editor-refatorado.js') ||
           content.includes('assets/js/editor/editor-core.js') ||
           content.includes('assets/js/editor/editor-ui.js');
}

// Remove referências antigas do editor
function removeOldEditorReferences(content) {
    // Remove TODAS as referências ao editor-refatorado.js (incluindo duplicatas)
    content = content.replace(/\s*<!-- Editor Refatorado Script -->\s*\n?\s*<script src="assets\/js\/editor-refatorado\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor-refatorado\.js"><\/script>\s*\n?/g, '');
    
    // Remove TODAS as referências aos módulos individuais
    content = content.replace(/\s*<!-- Editor Refatorado Scripts -->\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-core\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-ui\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-text\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-image\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-carousel\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-storage\.js"><\/script>\s*\n?/g, '');
    content = content.replace(/\s*<script src="assets\/js\/editor\/editor-utils\.js"><\/script>\s*\n?/g, '');
    
    // Remove comentários antigos do editor
    content = content.replace(/\s*<!-- Editor Script -->\s*\n?/g, '');
    content = content.replace(/\s*<!-- Editor Refatorado - Módulos \(ordem importante\) -->\s*\n?/g, '');
    
    return content;
}

// Adiciona o script editor-refatorado.js ao final do body
function addEditorScript(content) {
    // Se já tem o script, não faz nada
    if (hasEditorScript(content)) {
        return content;
    }

    // Remove referências antigas primeiro
    content = removeOldEditorReferences(content);

    // Encontra o fechamento do body
    const bodyCloseIndex = content.lastIndexOf('</body>');
    
    if (bodyCloseIndex === -1) {
        console.error('Não foi possível encontrar o fechamento do body');
        return content;
    }

    // Scripts do editor que precisam ser carregados
    const editorScripts = `
    <!-- Editor Refatorado Scripts -->
    <script src="assets/js/editor/editor-core.js"></script>
    <script src="assets/js/editor/editor-ui.js"></script>
    <script src="assets/js/editor/editor-text.js"></script>
    <script src="assets/js/editor/editor-image.js"></script>
    <script src="assets/js/editor/editor-carousel.js"></script>
    <script src="assets/js/editor/editor-storage.js"></script>
    <script src="assets/js/editor/editor-utils.js"></script>
    <script src="assets/js/editor-refatorado.js"></script>
`;

    // Adiciona os scripts antes do fechamento do body
    const newContent = 
        content.substring(0, bodyCloseIndex) + 
        editorScripts + 
        content.substring(bodyCloseIndex);
    
    return newContent;
}

// Processa cada arquivo
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = addEditorScript(content);
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Editor script adicionado a ${filePath}`);
        } else {
            console.log(`⏭️ Arquivo ${filePath} já tem o script ou não pôde ser modificado`);
        }
    } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
}

// Função principal
function main() {
    console.log('Iniciando adição do editor-refatorado.js a todas as páginas...');
    
    pagesToEdit.forEach(page => {
        const filePath = path.join(__dirname, page);
        
        if (fs.existsSync(filePath)) {
            processFile(filePath);
        } else {
            console.warn(`⚠️ Arquivo ${page} não encontrado`);
        }
    });
    
    console.log('Processo concluído!');
}

// Executa o script
main(); 