const fs = require('fs');
const path = require('path');

// Lista de páginas HTML importantes que devem ser editadas
const pagesToEdit = [
    'about.html', 
    'service.html',
    'service-single.html',
    'service-single-two.html',
    'service-single-three.html',
    'service-single-four.html',
    'service-single-five.html',
    'team.html',
    'team-details.html',
    'contact.html',
    'blog-grid.html',
    'blog-list.html',
    'blog-details.html',
    'project.html',
    'project-details.html',
    'index-two.html',
    'index-three.html',
    'index-four.html',
    'index-five.html',
    'index-six.html',
    'index-seven.html',
    'index-eight.html',
    'index-nine.html',
    'faq.html',
    'company-history.html',
    'company-values.html',
    'our-office.html',
    'vision.html',
    'working-process.html',
    'safety.html',
    'sustainability.html',
    'careers.html',
    'gallery.html',
    'appoinment.html',
    'our-clients.html'
];

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
    console.log('Iniciando adição do editor.js a todas as páginas...');
    
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