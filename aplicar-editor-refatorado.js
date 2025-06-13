/**
 * Script para aplicar o editor refatorado a todas as páginas HTML
 * Remove o editor antigo e aplica o novo editor modular
 */

const fs = require('fs');
const path = require('path');

// Configurações
const WORKSPACE_PATH = './';
const EDITOR_SCRIPTS = `
    <!-- Editor Refatorado - Módulos (ordem importante) -->
    <script src="assets/js/editor/editor-utils.js"></script>
    <script src="assets/js/editor/editor-storage.js"></script>
    <script src="assets/js/editor/editor-ui.js"></script>
    <script src="assets/js/editor/editor-text.js"></script>
    <script src="assets/js/editor/editor-image.js"></script>
    <script src="assets/js/editor/editor-carousel.js"></script>
    <script src="assets/js/editor/editor-core.js"></script>
    <script src="assets/js/editor-refatorado.js"></script>`;

const OLD_EDITOR_PATTERN = /<script[^>]*src="[^"]*editor\.js"[^>]*><\/script>/gi;

function findHtmlFiles(dir) {
    const files = [];
    
    function scanDirectory(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Ignorar diretórios específicos
                if (!['node_modules', '.git', 'backups'].includes(item)) {
                    scanDirectory(fullPath);
                }
            } else if (stat.isFile() && item.endsWith('.html')) {
                files.push(fullPath);
            }
        }
    }
    
    scanDirectory(dir);
    return files;
}

function processHtmlFile(filePath) {
    console.log(`Processando: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Verificar se já tem editor antigo
        if (OLD_EDITOR_PATTERN.test(content)) {
            console.log(`  ✅ Editor antigo encontrado, substituindo...`);
            
            // Remover editor antigo
            content = content.replace(OLD_EDITOR_PATTERN, '');
            
            // Encontrar posição ideal para inserir novos scripts (antes do </body>)
            const bodyEndIndex = content.lastIndexOf('</body>');
            
            if (bodyEndIndex !== -1) {
                // Inserir novos scripts antes do </body>
                content = content.substring(0, bodyEndIndex) + 
                         '\n' + EDITOR_SCRIPTS + '\n' + 
                         content.substring(bodyEndIndex);
                modified = true;
            } else {
                console.log(`  ⚠️ Tag </body> não encontrada em ${filePath}`);
            }
        } else {
            console.log(`  ℹ️ Editor antigo não encontrado, verificando se precisa adicionar...`);
            
            // Verificar se já tem os novos scripts
            if (!content.includes('editor-refatorado.js')) {
                const bodyEndIndex = content.lastIndexOf('</body>');
                
                if (bodyEndIndex !== -1) {
                    content = content.substring(0, bodyEndIndex) + 
                             '\n' + EDITOR_SCRIPTS + '\n' + 
                             content.substring(bodyEndIndex);
                    modified = true;
                    console.log(`  ✅ Editor refatorado adicionado`);
                } else {
                    console.log(`  ⚠️ Tag </body> não encontrada em ${filePath}`);
                }
            } else {
                console.log(`  ✅ Editor refatorado já presente`);
            }
        }
        
        // Salvar arquivo se foi modificado
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  💾 Arquivo atualizado: ${filePath}`);
        }
        
        return { success: true, modified };
        
    } catch (error) {
        console.error(`  ❌ Erro ao processar ${filePath}:`, error.message);
        return { success: false, error: error.message };
    }
}

function main() {
    console.log('🚀 Iniciando aplicação do editor refatorado...\n');
    
    // Verificar se os arquivos do editor existem
    const editorFiles = [
        'assets/js/editor/editor-utils.js',
        'assets/js/editor/editor-storage.js',
        'assets/js/editor/editor-ui.js',
        'assets/js/editor/editor-text.js',
        'assets/js/editor/editor-image.js',
        'assets/js/editor/editor-carousel.js',
        'assets/js/editor/editor-core.js',
        'assets/js/editor-refatorado.js'
    ];
    
    const missingFiles = editorFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.error('❌ Arquivos do editor não encontrados:');
        missingFiles.forEach(file => console.error(`   - ${file}`));
        console.error('\nCertifique-se de que todos os módulos do editor foram criados.');
        process.exit(1);
    }
    
    console.log('✅ Todos os arquivos do editor encontrados\n');
    
    // Encontrar arquivos HTML
    const htmlFiles = findHtmlFiles(WORKSPACE_PATH);
    console.log(`📁 Encontrados ${htmlFiles.length} arquivos HTML\n`);
    
    // Processar cada arquivo
    let processed = 0;
    let modified = 0;
    let errors = 0;
    
    for (const file of htmlFiles) {
        const result = processHtmlFile(file);
        processed++;
        
        if (result.success) {
            if (result.modified) {
                modified++;
            }
        } else {
            errors++;
        }
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(50));
    console.log(`📄 Arquivos processados: ${processed}`);
    console.log(`✏️ Arquivos modificados: ${modified}`);
    console.log(`❌ Erros: ${errors}`);
    
    if (errors === 0) {
        console.log('\n🎉 Editor refatorado aplicado com sucesso a todas as páginas!');
        console.log('\n📝 Próximos passos:');
        console.log('1. Teste as páginas no navegador');
        console.log('2. Verifique se o editor está funcionando');
        console.log('3. Teste as funcionalidades (texto, imagem, carrossel)');
    } else {
        console.log('\n⚠️ Alguns arquivos tiveram problemas. Verifique os erros acima.');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main, processHtmlFile, findHtmlFiles }; 