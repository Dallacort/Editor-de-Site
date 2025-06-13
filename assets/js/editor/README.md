# HARDEM Editor Refatorado

## 📁 Estrutura dos Arquivos

O editor foi refatorado e dividido em módulos menores para facilitar o desenvolvimento e manutenção:

```
assets/js/editor/
├── editor-core.js      # Módulo principal - gerencia estado e coordenação
├── editor-ui.js        # Interface do usuário - toolbar e painel lateral
├── editor-text.js      # Edição de texto - edição inline e elementos de texto
├── editor-image.js     # Edição de imagens - upload e edição de imagens/backgrounds
├── editor-carousel.js  # Edição de carrosséis - gerenciamento de sliders
├── editor-storage.js   # Armazenamento - salvamento e carregamento
├── editor-utils.js     # Utilitários - funções auxiliares compartilhadas
└── README.md          # Esta documentação
```

## 🚀 Como Usar

### 1. Incluir os Arquivos

Inclua todos os módulos na sua página HTML **na ordem correta**:

```html
<!-- Módulos do Editor (ordem importante) -->
<script src="assets/js/editor/editor-utils.js"></script>
<script src="assets/js/editor/editor-storage.js"></script>
<script src="assets/js/editor/editor-ui.js"></script>
<script src="assets/js/editor/editor-text.js"></script>
<script src="assets/js/editor/editor-image.js"></script>
<script src="assets/js/editor/editor-carousel.js"></script>
<script src="assets/js/editor/editor-core.js"></script>

<!-- Arquivo principal (inicia tudo) -->
<script src="assets/js/editor-refatorado.js"></script>
```

### 2. Inicialização Automática

O editor será iniciado automaticamente quando o DOM estiver pronto. Você pode acessá-lo via:

```javascript
// Instância global do editor
window.hardemEditor
```

## 🎯 Funcionalidades Mantidas

Todas as funcionalidades do editor original foram mantidas:

### ✏️ Edição de Texto
- Edição inline (duplo-clique)
- Edição via painel lateral
- Suporte a todos os elementos de texto (h1-h6, p, span, div, etc.)

### 🖼️ Edição de Imagens
- Upload de imagens (duplo-clique)
- Edição de backgrounds
- Redimensionamento automático
- Suporte via painel lateral

### 🎠 Edição de Carrossel
- Gerenciamento de slides
- Upload de imagens de slide
- Upload de backgrounds de slide
- Visualização e reset

### 💾 Armazenamento
- Salvamento automático no localStorage
- Exportação para servidor (save.php)
- Sistema de backup
- Restauração de conteúdo

## 🔧 Estrutura dos Módulos

### HardemEditorCore
**Responsabilidade**: Gerenciamento geral do editor
- Estado global do editor
- Inicialização dos módulos
- Coordenação entre componentes
- Observer de mutações do DOM

### HardemEditorUI
**Responsabilidade**: Interface do usuário
- Criação da toolbar
- Gerenciamento do painel lateral
- Estilos CSS
- Alertas e overlays

### HardemTextEditor
**Responsabilidade**: Edição de texto
- Configuração de elementos editáveis
- Edição inline
- Manipulação de cliques
- Detecção de sobreposição

### HardemImageEditor
**Responsabilidade**: Edição de imagens
- Upload de imagens
- Edição de backgrounds
- Processamento de arquivos
- Redimensionamento

### HardemCarouselEditor
**Responsabilidade**: Edição de carrosséis
- Detecção de carrosséis
- Gerenciamento de slides
- Upload para slides
- Visualização

### HardemEditorStorage
**Responsabilidade**: Armazenamento de dados
- Salvamento no localStorage
- Carregamento de conteúdo
- Exportação para servidor
- Sistema de backup

### HardemEditorUtils
**Responsabilidade**: Utilitários compartilhados
- Geração de data-keys
- Utilitários de DOM
- Validações
- Helpers diversos

## 🛠️ Desenvolvimento

### Adicionar Nova Funcionalidade
1. Identifique o módulo apropriado
2. Adicione o método no módulo
3. Se necessário, exponha via `this.core` para outros módulos

### Modificar Interface
- Edite `editor-ui.js` para mudanças na toolbar/painel
- Edite os estilos CSS no método `createStyles()`

### Adicionar Novo Tipo de Elemento
1. Adicione seletor em `editableSelectors` no core
2. Crie método específico no módulo apropriado
3. Teste a funcionalidade

### Debug
- Abra o console do navegador
- Verifique os logs do editor
- Use `window.hardemEditor` para inspecionar estado

## 🔗 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Frameworks**: Funciona com qualquer framework ou HTML puro
- **Dependências**: Nenhuma dependência externa

## 📝 Migração do Editor Original

Se você estava usando o `editor.js` original:

1. **Remova** a inclusão do `editor.js` antigo
2. **Adicione** os novos módulos conforme mostrado acima
3. **Mantenha** o `save.php` se estiver usando
4. **Dados salvos** serão mantidos automaticamente

## 🐛 Solução de Problemas

### Editor não inicia
- Verifique se todos os arquivos foram incluídos
- Verifique a ordem dos arquivos
- Abra o console para ver erros

### Funcionalidade não funciona
- Verifique se o elemento tem `data-no-edit` 
- Verifique se não é um elemento do próprio editor
- Teste em modo de edição ativo

### Conteúdo não salva
- Verifique se há erros no console
- Teste o localStorage do navegador
- Verifique se o `save.php` está configurado

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Teste com HTML simples primeiro
3. Documente o erro com detalhes 