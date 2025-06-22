const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Lista de páginas HTML para processar
const pagesToScan = [
    'index.html',
    '404.html',
    'about.html',
    'account.html',
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

// Elementos que devem ser editáveis e receber data-key
const editableSelectors = [
    // Títulos
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    
    // Parágrafos e textos
    'p',
    
    // Spans e labels
    'span:not(.odometer):not(.counter)',
    
    // Classes comuns para textos
    '.title:not(.counter)', '.subtitle', '.disc', '.details', '.description',
    
    // Botões e links com texto
    '.rts-btn', 'a.read-more-btn', 'a.read-more-narrow', 'button:not(.close-icon-menu)',
    
    // Links com texto (excluindo vazios e scripts)
    'a:not([href^="javascript"]):not([href^="#"]):not(:empty)',
    
    // Listas com texto
    'li:not(:has(ul)):not(:has(ol)):not(:empty)',
    
    // Legendas e textos de imagens
    'figcaption', '.caption', '.image-caption',
    
    // Imagens
    'img[src]:not([src=""])'
];

// Função para adicionar data-keys a elementos
function addDataKeys($, pageBaseName) {
    let textCounter = 1;
    let imageCounter = 1;
    let buttonCounter = 1;
    let listCounter = 1;
    let labelCounter = 1;
    let linkCounter = 1;

    // Adiciona data-key a cada tipo de elemento
    editableSelectors.forEach(selector => {
        $(selector).each(function() {
            // Pula se já tem data-key
            if ($(this).attr('data-key')) {
                return;
            }

            const element = $(this);
            const tagName = element.prop('tagName').toLowerCase();
            
            // Ignora elementos vazios ou sem conteúdo textual (exceto imagens)
            if (tagName !== 'img' && element.text().trim() === '') {
                return;
            }
            
            // Determina um prefixo com base no tipo de elemento e contexto
            let prefix = '';
            let counter = 1;
            
            // Determina o contexto baseado nos ancestrais
            let context = 'content';
            if (element.closest('.banner-area, .banner-inner-content-one, .rts-banner-area').length) {
                context = 'banner';
            } else if (element.closest('.about-company-service-area, .about-inner-area-content-one, .rts-about-area').length) {
                context = 'about';
            } else if (element.closest('.fun-facts-area, .rts-fun-facts-area').length) {
                context = 'facts';
            } else if (element.closest('.service-section-area, .single-service-one, .rts-service-area').length) {
                context = 'service';
            } else if (element.closest('.why-choose-us-area, .single-choose-us-one').length) {
                context = 'why_choose';
            } else if (element.closest('.portfolio-team-area-bg, .project-area-start-1, .rts-project-area').length) {
                context = 'project';
            } else if (element.closest('.rts-team-area-start, .single-team-single-area, .rts-team-area').length) {
                context = 'team';
            } else if (element.closest('.rts-testimonials-area, .single-testimonials-area-one').length) {
                context = 'testimonial';
            } else if (element.closest('.cta-area-wrapper, .rts-call-to-action').length) {
                context = 'cta';
            } else if (element.closest('.rts-blog-area, .rts-blog-card-one').length) {
                context = 'blog';
            } else if (element.closest('.rts-footer-area, footer').length) {
                context = 'footer';
            } else if (element.closest('header, .header').length) {
                context = 'header';
            } else if (element.closest('nav, .nav-area').length) {
                context = 'nav';
            }
            
            // Determina o prefixo baseado no tipo de elemento
            if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || 
                tagName === 'h4' || tagName === 'h5' || tagName === 'h6' ||
                element.hasClass('title')) {
                prefix = 'title';
                counter = textCounter++;
            } else if (tagName === 'p' || element.hasClass('disc') || element.hasClass('details')) {
                prefix = 'text';
                counter = textCounter++;
            } else if (tagName === 'span' || element.hasClass('subtitle')) {
                prefix = 'label';
                counter = labelCounter++;
            } else if (tagName === 'img') {
                prefix = 'image';
                counter = imageCounter++;
            } else if (tagName === 'a' && (element.hasClass('rts-btn') || element.text().trim().length > 0)) {
                if (element.hasClass('rts-btn') || tagName === 'button') {
                    prefix = 'button';
                    counter = buttonCounter++;
                } else {
                    prefix = 'link';
                    counter = linkCounter++;
                }
            } else if (tagName === 'button' || element.hasClass('rts-btn')) {
                prefix = 'button';
                counter = buttonCounter++;
            } else if (tagName === 'li') {
                prefix = 'list_item';
                counter = listCounter++;
            } else if (tagName === 'figcaption') {
                prefix = 'caption';
                counter = labelCounter++;
            } else {
                prefix = 'content';
                counter = textCounter++;
            }
            
            // Gera um data-key único para o elemento
            const dataKey = `${pageBaseName}_${context}_${prefix}_${counter}`;
            element.attr('data-key', dataKey);
        });
    });

    return $;
}

// Processa cada arquivo HTML
function processFile(filePath) {
    try {
        console.log(`🔄 Escaneando ${path.basename(filePath)}...`);
        
        // Lê o conteúdo do arquivo
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Carrega o conteúdo com Cheerio
        const $ = cheerio.load(content);
        
        // Extrai o nome base do arquivo sem extensão
        const pageBaseName = path.basename(filePath, '.html');
        
        // Conta elementos existentes com data-key
        const existingElements = $('[data-key]').length;
        
        // Adiciona data-keys aos elementos que não possuem
        addDataKeys($, pageBaseName);
        
        // Conta novos elementos com data-key
        const totalElements = $('[data-key]').length;
        const newElements = totalElements - existingElements;
        
        // Converte de volta para string
        let updatedContent = $.html();
        
        // Salva o arquivo modificado se houve mudanças
        if (newElements > 0) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`  ✅ ${newElements} novos data-keys adicionados (total: ${totalElements})`);
            return { processed: true, newElements, totalElements };
        } else {
            console.log(`  ⏭️ Nenhum novo elemento encontrado (total: ${totalElements})`);
            return { processed: false, newElements: 0, totalElements };
        }
        
    } catch (error) {
        console.error(`  ❌ Erro ao processar ${path.basename(filePath)}:`, error.message);
        return { processed: false, newElements: 0, totalElements: 0, error: true };
    }
}

// Função principal
function main() {
    console.log('🚀 Iniciando escaneamento de elementos em todas as páginas...');
    console.log(`📋 Total de páginas a escanear: ${pagesToScan.length}\n`);
    
    let processedCount = 0;
    let errorCount = 0;
    let totalNewElements = 0;
    let totalExistingElements = 0;
    
    pagesToScan.forEach(page => {
        const filePath = path.join(__dirname, page);
        
        if (fs.existsSync(filePath)) {
            const result = processFile(filePath);
            
            if (result.error) {
                errorCount++;
            } else {
                processedCount++;
                totalNewElements += result.newElements;
                totalExistingElements += result.totalElements;
            }
        } else {
            console.warn(`⚠️ Arquivo ${page} não encontrado`);
            errorCount++;
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL DE ESCANEAMENTO');
    console.log('='.repeat(50));
    console.log(`✅ Páginas processadas com sucesso: ${processedCount}`);
    console.log(`❌ Páginas com erro: ${errorCount}`);
    console.log(`📄 Total de páginas: ${pagesToScan.length}`);
    console.log(`🆕 Novos data-keys adicionados: ${totalNewElements}`);
    console.log(`📝 Total de elementos com data-key: ${totalExistingElements}`);
    console.log('\n🎉 Escaneamento concluído!');
    
    if (totalNewElements > 0) {
        console.log('\n📝 Próximos passos:');
        console.log('1. Teste as páginas no navegador');
        console.log('2. Verifique se o editor está reconhecendo os novos elementos');
        console.log('3. Teste as funcionalidades de edição');
    }
}

// Executa o script
main(); 