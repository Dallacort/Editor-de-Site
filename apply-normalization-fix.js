/**
 * HARDEM Editor - Script de Aplicação de Normalização
 * Adiciona o arquivo CSS de normalização em todas as páginas HTML
 */

const fs = require('fs');
const path = require('path');

// Função para encontrar todos os arquivos HTML
function findHtmlFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            results = results.concat(findHtmlFiles(filePath));
        } else if (path.extname(file) === '.html') {
            results.push(filePath);
        }
    }
    
    return results;
}

// Função para adicionar o CSS de normalização
function addNormalizationCss(filePath) {
    
        let content = fs.readFileSync(filePath, 'utf8');
        
    // Verificar se o CSS já está incluído
    if (content.includes('image-normalization-styles.css')) {
            return;
        }
        
    // Encontrar onde inserir o novo link CSS
    const cssInsertPoint = content.indexOf('</head>');
    if (cssInsertPoint === -1) {
        return;
    }
    
    // Criar o novo link CSS
    const newCssLink = '    <!-- NOVO: Normalização de imagens -->\n    <link rel="stylesheet" href="assets/css/image-normalization-styles.css">\n';
    
    // Inserir o novo link antes do </head>
    content = content.slice(0, cssInsertPoint) + newCssLink + content.slice(cssInsertPoint);
            
    // Salvar o arquivo
    fs.writeFileSync(filePath, content, 'utf8');
}

// Função principal
function main() {
    
    try {
        // Encontrar todos os arquivos HTML
        const htmlFiles = findHtmlFiles('.');
    
        // Processar cada arquivo
        for (const file of htmlFiles) {
            addNormalizationCss(file);
        }
        
        
    } catch (error) {
        process.exit(1);
    }
}

// Executar
main();