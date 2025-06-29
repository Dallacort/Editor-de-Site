/**
 * Script para aplicar a correção de normalização em todas as páginas HTML
 * Este script adiciona a referência ao script de correção em todos os arquivos HTML
 */

const fs = require('fs');
const path = require('path');

// Configurações
const rootDir = __dirname;
const scriptPath = '<script src="assets/js/normalization-fix.js"></script>';
const insertBeforePattern = '</body>';

// Contador de arquivos processados
let filesProcessed = 0;
let filesModified = 0;
let errors = 0;

// Função para processar um arquivo HTML
function processHtmlFile(filePath) {
    try {
        // Ler o conteúdo do arquivo
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar se o script já está incluído
        if (content.includes('normalization-fix.js')) {
            console.log(`✓ Script já incluído em: ${filePath}`);
            return;
        }
        
        // Inserir o script antes do fechamento do body
        const newContent = content.replace(insertBeforePattern, `    ${scriptPath}\n${insertBeforePattern}`);
        
        // Verificar se houve alteração
        if (content === newContent) {
            console.log(`⚠ Não foi possível inserir o script em: ${filePath}`);
            return;
        }
        
        // Salvar o arquivo modificado
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Script adicionado em: ${filePath}`);
        filesModified++;
    } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error.message);
        errors++;
    } finally {
        filesProcessed++;
    }
}

// Função para percorrer diretórios recursivamente
function processDirectory(dirPath) {
    // Ler o conteúdo do diretório
    const items = fs.readdirSync(dirPath);
    
    // Processar cada item
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            // Ignorar diretórios específicos
            if (item === 'node_modules' || item === '.git') continue;
            
            // Processar subdiretório
            processDirectory(itemPath);
        } else if (stats.isFile() && item.endsWith('.html')) {
            // Processar arquivo HTML
            processHtmlFile(itemPath);
        }
    }
}

// Função principal
function main() {
    console.log('Iniciando aplicação da correção de normalização...');
    console.log(`Diretório raiz: ${rootDir}`);
    console.log(`Script a ser inserido: ${scriptPath}`);
    console.log('-------------------------------------------');
    
    // Processar o diretório raiz
    processDirectory(rootDir);
    
    // Exibir resumo
    console.log('-------------------------------------------');
    console.log(`Processamento concluído!`);
    console.log(`Arquivos processados: ${filesProcessed}`);
    console.log(`Arquivos modificados: ${filesModified}`);
    console.log(`Erros encontrados: ${errors}`);
}

// Executar o script
main();