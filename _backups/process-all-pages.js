/**
 * Script para processar todas as páginas HTML no diretório atual
 * 
 * Este script:
 * 1. Encontra todos os arquivos HTML no diretório atual e subdiretórios
 * 2. Adiciona atributos data-key a elementos editáveis
 * 3. Adiciona referência ao editor.js no final de cada arquivo
 */

const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const { execSync } = require('child_process');

// Lista de páginas HTML para processar
const pagesToProcess = [
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

// Função para aplicar o scanner em uma página
function processPage(pageFile) {
    try {
        console.log(`🔄 Processando ${pageFile}...`);
        
        // Executa o aplicar-editor-refatorado.js para a página específica
        const command = `node aplicar-editor-refatorado.js "${pageFile}"`;
        execSync(command, { stdio: 'inherit' });
        
        console.log(`✅ ${pageFile} processado com sucesso!`);
        
        // Pequena pausa entre processamentos
        return new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
        console.error(`❌ Erro ao processar ${pageFile}:`, error.message);
    }
}

// Função principal
async function main() {
    console.log('🚀 Iniciando processamento de todas as páginas...');
    console.log(`📋 Total de páginas a processar: ${pagesToProcess.length}`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const page of pagesToProcess) {
        const filePath = path.join(__dirname, page);
        
        if (fs.existsSync(filePath)) {
            try {
                await processPage(page);
                processedCount++;
            } catch (error) {
                console.error(`❌ Erro ao processar ${page}:`, error.message);
                errorCount++;
            }
        } else {
            console.warn(`⚠️ Arquivo ${page} não encontrado`);
            errorCount++;
        }
    }
    
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`✅ Páginas processadas com sucesso: ${processedCount}`);
    console.log(`❌ Páginas com erro: ${errorCount}`);
    console.log(`📄 Total de páginas: ${pagesToProcess.length}`);
    console.log('\n🎉 Processamento concluído!');
}

// Executa o script
main().catch(console.error);

console.log('🔄 Iniciando adição de loading screen em todas as páginas...');

// Encontrar todos os arquivos HTML no diretório atual
const files = fs.readdirSync('.')
    .filter(file => file.endsWith('.html'));

let processedCount = 0;

files.forEach(file => {
    console.log(`Processando: ${file}`);
    
    try {
        const html = fs.readFileSync(file, 'utf8');
        const $ = cheerio.load(html);
        
        // Verificar se já tem o CSS de loading
        let hasLoadingCss = false;
        $('link').each(function() {
            if ($(this).attr('href') === 'assets/css/instant-loading.css') {
                hasLoadingCss = true;
            }
        });
        
        // Adicionar CSS de loading se não existir
        if (!hasLoadingCss) {
            $('head').append('\n    <!-- NOVO: Loading instantâneo -->\n    <link rel="stylesheet" href="assets/css/instant-loading.css">');
        }
        
        // Verificar se já tem o script de loading
        let hasLoadingScript = false;
        $('script').each(function() {
            if ($(this).attr('src') === 'assets/js/instant-loading.js') {
                hasLoadingScript = true;
            }
        });
        
        // Adicionar script de loading se não existir
        if (!hasLoadingScript) {
            $('body').append('\n    <!-- NOVO: Script de loading -->\n    <script src="assets/js/instant-loading.js"></script>');
        }
        
        // Adicionar classe de loading no body
        $('body').addClass('hardem-loading-active');
        
        // Verificar se já tem o HTML do loading
        if (!$('#hardem-instant-loading').length) {
            // Adicionar HTML do loading no início do body
            const loadingHtml = `
    <!-- NOVO: Loading screen instantâneo -->
    <div id="hardem-instant-loading">
        <div class="hardem-loading-spinner"></div>
        <div class="hardem-loading-text">Carregando conteúdo...</div>
        <div class="hardem-loading-subtitle">Aguarde enquanto restauramos suas edições</div>
    </div>

    <!-- Wrapper para todo o conteúdo -->
    <div class="hardem-content">`;
            
            // Mover todo o conteúdo existente para dentro do wrapper
            const $content = $('body').children().not('#hardem-instant-loading, .hardem-content');
            $('body').prepend(loadingHtml);
            $('.hardem-content').append($content);
            
            // Fechar a div do wrapper antes do </body>
            $('body').append('\n    </div><!-- .hardem-content -->');
            
            processedCount++;
            console.log(`✅ Loading screen adicionada em: ${file}`);
        }
        
        // Salvar o arquivo
        fs.writeFileSync(file, $.html());
        
    } catch (error) {
        console.error(`❌ Erro ao processar ${file}:`, error);
    }
});

console.log(`\n🎉 Loading screen adicionada em ${processedCount} páginas!`); 