/**
 * Script para processar todas as páginas HTML no diretório atual
 * 
 * Este script:
 * 1. Encontra todos os arquivos HTML no diretório atual e subdiretórios
 * 2. Adiciona atributos data-key a elementos editáveis
 * 3. Adiciona referência ao editor.js no final de cada arquivo
 */

const fs = require('fs');
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