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
const cheerio = require('cheerio');

// Diretório raiz
const rootDir = __dirname;

// Lista para armazenar todos os arquivos HTML encontrados
const htmlFiles = [];

// Elementos que devem ser editáveis e receber data-key
const editableSelectors = [
    // Títulos
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    
    // Parágrafos e textos
    'p', 'p.disc', 'p.details', 'p.description', 'p.location', 'p.desig',
    
    // Spans e labels
    'span', 'span.pre', 'span.title', 'span.subtitle', 'span.pp', 'span.time',
    
    // Classes comuns para textos
    '.title', '.subtitle', '.disc', '.details', '.description', 
    
    // Botões e links
    '.rts-btn', 'a.read-more-btn', 'a.read-more-narrow', 'button',
    
    // Textos em links
    'a:not([href^="javascript"]):not([href^="#"]):contains("")', 'a.title',
    
    // Listas
    'li:not(:has(ul)):not(:has(ol))', 'li a:not([href^="javascript"]):not([href^="#"])',
    
    // Legendas e textos de imagens
    'figcaption', '.caption', '.image-caption',
    
    // Textos em cards e blocos
    '.info h5', '.info p', '.inner h5', '.inner p', '.inner-content h2', '.inner-content p',
    
    // Imagens
    'img'
];

// Função para adicionar data-key a elementos
function addDataKeys($, pageBaseName) {
    let counter = 1;

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
            let context = '';
            
            // Determina o contexto baseado nos ancestrais
            if (element.closest('.banner-area').length || element.closest('.banner-inner-content-one').length) {
                context = 'banner';
            } else if (element.closest('.about-company-service-area').length || element.closest('.about-inner-area-content-one').length) {
                context = 'about';
            } else if (element.closest('.fun-facts-area').length) {
                context = 'facts';
            } else if (element.closest('.service-section-area').length || element.closest('.single-service-one').length) {
                context = 'service';
            } else if (element.closest('.why-choose-us-area').length || element.closest('.single-choose-us-one').length) {
                context = 'why_choose';
            } else if (element.closest('.portfolio-team-area-bg').length || element.closest('.project-area-start-1').length) {
                context = 'portfolio';
            } else if (element.closest('.rts-team-area-start').length || element.closest('.single-team-single-area').length) {
                context = 'team';
            } else if (element.closest('.rts-testimonials-area').length || element.closest('.single-testimonials-area-one').length) {
                context = 'testimonial';
            } else if (element.closest('.cta-area-wrapper').length) {
                context = 'cta';
            } else if (element.closest('.rts-blog-area').length || element.closest('.rts-blog-card-one').length) {
                context = 'blog';
            } else if (element.closest('.rts-footer-area').length) {
                context = 'footer';
            } else if (element.closest('header').length) {
                context = 'header';
            } else if (element.closest('nav').length) {
                context = 'nav';
            } else {
                context = 'content';
            }
            
            // Determina o prefixo baseado no tipo de elemento
            if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || 
                tagName === 'h4' || tagName === 'h5' || tagName === 'h6' ||
                element.hasClass('title')) {
                prefix = 'title';
            } else if (tagName === 'p') {
                prefix = 'text';
            } else if (tagName === 'span') {
                prefix = 'label';
            } else if (tagName === 'img') {
                prefix = 'image';
            } else if (tagName === 'a' || tagName === 'button' || element.hasClass('rts-btn')) {
                prefix = 'button';
            } else if (tagName === 'li') {
                prefix = 'list_item';
            } else if (tagName === 'figcaption') {
                prefix = 'caption';
            } else {
                prefix = 'content';
            }
            
            // Gera um data-key único para o elemento
            const dataKey = `${pageBaseName}_${context}_${prefix}_${counter}`;
            element.attr('data-key', dataKey);
            counter++;
        });
    });

    return $;
}

// Verifica se o arquivo já tem a referência ao editor.js
function hasEditorScript(content) {
    return content.includes('assets/js/editor.js');
}

// Adiciona o script editor.js ao final do body
function addEditorScript(content) {
    // Se já tem o script, não faz nada
    if (hasEditorScript(content)) {
        return content;
    }

    // Encontra o fechamento do body
    const bodyCloseIndex = content.lastIndexOf('</body>');
    
    if (bodyCloseIndex === -1) {
        console.error('Não foi possível encontrar o fechamento do body');
        return content;
    }

    // Adiciona o script antes do fechamento do body
    const newContent = 
        content.substring(0, bodyCloseIndex) + 
        '\n    <!-- Editor Script -->\n    <script src="assets/js/editor.js"></script>\n' + 
        content.substring(bodyCloseIndex);
    
    return newContent;
}

// Função para encontrar todos os arquivos HTML recursivamente
function findHtmlFiles(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && !file.startsWith('node_modules')) {
            // Se for um diretório (exceto .git, node_modules, etc), entra recursivamente
            findHtmlFiles(filePath);
        } else if (file.endsWith('.html')) {
            // Se for um arquivo HTML, adiciona à lista
            htmlFiles.push(filePath);
        }
    });
}

// Processa cada arquivo HTML
function processFile(filePath) {
    try {
        // Lê o conteúdo do arquivo
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Carrega o conteúdo com Cheerio
        const $ = cheerio.load(content);
        
        // Extrai o nome base do arquivo sem extensão
        const pageBaseName = path.basename(filePath, '.html');
        
        // Adiciona data-keys
        addDataKeys($, pageBaseName);
        
        // Converte de volta para string
        let updatedContent = $.html();
        
        // Adiciona script do editor
        updatedContent = addEditorScript(updatedContent);
        
        // Salva o arquivo modificado
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Arquivo ${filePath} processado com sucesso`);
        
    } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
}

// Função principal
function main() {
    console.log('🔍 Procurando arquivos HTML...');
    
    // Encontra todos os arquivos HTML
    findHtmlFiles(rootDir);
    
    console.log(`🔎 Encontrados ${htmlFiles.length} arquivos HTML`);
    
    // Processa cada arquivo
    console.log('⚙️ Processando arquivos...');
    htmlFiles.forEach((file, index) => {
        console.log(`[${index + 1}/${htmlFiles.length}] Processando: ${file}`);
        processFile(file);
    });
    
    console.log('✅ Processo concluído!');
}

// Executa o script
main(); 