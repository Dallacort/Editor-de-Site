# 🔧 HARDEM Editor - Sistema de Edição Visual Completo

Um editor visual poderoso e moderno que permite editar qualquer template HTML diretamente no navegador, com suporte completo a carrosséis Swiper.js, imagens, textos e backgrounds.

## 🎯 Características Principais

### ✨ **Funcionalidades Implementadas**

- ✅ **Modo de edição ativável** com toggle visual
- ✅ **Edição inline de texto** com proteção contra campos vazios
- ✅ **Upload de imagens** com pré-visualização
- ✅ **Suporte completo a carrossel Swiper.js**
- ✅ **Painel lateral contextual** com scroll independente
- ✅ **Barra superior de ferramentas** fixa
- ✅ **Sistema de salvar/carregar** via localStorage
- ✅ **Indicadores inteligentes** de elementos editáveis
- ✅ **Debug de carrosséis** com relatório detalhado
- ✅ **Mutação do DOM** para elementos dinâmicos
- ✅ **Exportar/Importar** conteúdo em JSON
- ✅ **Interface responsiva** para mobile

---

## 🚀 Como Usar

### 1. **Instalação**

O editor está integrado automaticamente no template HARDEM. Basta abrir qualquer página HTML e o editor será carregado.

```html
<!-- O script já está incluído no index.html -->
<script src="assets/js/editor.js"></script>
```

### 2. **Ativar Modo de Edição**

1. Clique no botão **"🔓 Ativar Edição"** na barra superior
2. Todos os elementos editáveis ficarão destacados
3. Passe o mouse sobre elementos para ver os indicadores de `data-key`

### 3. **Editar Texto (2 formas)**

#### **Edição Inline:**
- **Duplo-clique** em qualquer texto para editar diretamente
- Pressione **Enter** para salvar ou **Escape** para cancelar
- Campos vazios são rejeitados automaticamente

#### **Edição pelo Painel:**
- **Clique simples** em um elemento de texto
- O painel lateral abrirá automaticamente
- Edite no campo de texto e clique **"✅ Aplicar Alterações"**

### 4. **Editar Imagens**

1. **Clique** em uma imagem com `data-key`
2. Aparecerá um overlay com **"📤 Upload Imagem"**
3. Selecione uma nova imagem
4. Confirme a substituição
5. A imagem será convertida para Base64 e salva

### 5. **Editar Carrosséis**

O editor detecta automaticamente carrosséis Swiper e permite editar:
- **Imagens dos slides**
- **Textos com data-key**
- **Backgrounds dos slides**

Use o botão **🎠** no canto inferior direito para debug completo dos carrosséis.

### 6. **Painel Lateral**

- **⚙️ Painel**: Abre/fecha o painel lateral
- **👁️ Destacar Elemento**: Rola até o elemento e o destaca
- **✅ Aplicar Alterações**: Salva as edições feitas no painel

### 7. **Salvar e Gerenciar Conteúdo**

- **💾 Salvar**: Armazena alterações no localStorage
- **🔄 Restaurar**: Volta ao conteúdo original
- **📤 Exportar**: Download do conteúdo em JSON
- **📥 Importar**: Upload de arquivo JSON

---

## 🧩 Elementos Suportados

### **Textos Editáveis:**
```html
<!-- Qualquer elemento com data-key -->
<h1 data-key="titulo_principal">Título Editável</h1>
<p data-key="descricao">Parágrafo editável</p>
<span data-key="subtitulo">Subtítulo editável</span>

<!-- Tags HTML padrão (sem data-no-edit) -->
<h2>Título automático</h2>
<p>Parágrafo automático</p>
<div class="title">Título em div</div>
<div class="disc">Descrição em div</div>
```

### **Imagens Editáveis:**
```html
<!-- Imagens com data-key -->
<img src="imagem.jpg" alt="Alt text" data-key="img_1">

<!-- Imagens em carrossel -->
<div class="swiper-slide" data-key="slide_1">
    <img src="slide1.jpg" data-key="img_slide_1">
</div>
```

### **Backgrounds Editáveis:**
```html
<!-- Elementos com background-image -->
<div class="hero-section" data-key="bg_hero" style="background-image: url('bg.jpg')">
    Conteúdo
</div>
```

### **Carrosséis Suportados:**
```html
<!-- Estrutura Swiper.js -->
<div class="swiper mySwiper">
    <div class="swiper-wrapper">
        <div class="swiper-slide" data-key="slide_1">
            <h3 data-key="text_slide_1">Título do Slide</h3>
            <img src="slide1.jpg" data-key="img_slide_1">
        </div>
    </div>
</div>
```

---

## 🎨 Interface e Controles

### **Barra Superior:**
```
🔧 HARDEM Editor | [Status] | [🔓 Modo] | [⚙️ Painel] | [💾 Salvar] | [🔄 Restaurar] | [📤 Export] | [📥 Import]
```

### **Estados Visuais:**
- **Azul tracejado**: Elemento editável (hover)
- **Verde sólido**: Elemento sendo editado
- **Vermelho sólido**: Elemento em modo inline
- **Laranja destacado**: Elemento selecionado no painel

### **Indicadores:**
- **Tooltip**: Mostra `data-key` do elemento
- **Overlay de imagem**: Botão de upload aparece no hover
- **Indicador flutuante**: Exibe "Editar: nome_da_chave"

---

## 🔧 Debug e Desenvolvimento

### **Console do Debug:**
```javascript
// Acessar o editor globalmente
window.hardemEditor

// Debug de carrosséis (também via botão 🎠)
window.hardemEditor.debugCarousels()

// Verificar conteúdo salvo
console.log(window.hardemEditor.contentMap)

// Destruir editor
window.hardemEditor.destroy()
```

### **Estrutura de Dados:**
```javascript
// Exemplo do contentMap salvo
{
    "text_19": "Let's Build Future Home Together",
    "img_5": {
        "src": "data:image/jpeg;base64,/9j/4AAQ...",
        "alt": "Banner image"
    },
    "slide_1": "...",
    "bg_hero": {
        "backgroundImage": "data:image/jpeg;base64,..."
    }
}
```

---

## 📱 Responsividade

- **Desktop**: Interface completa com painel lateral
- **Tablet**: Painel adaptado
- **Mobile**: Painel em tela cheia, botões compactos

---

## 🛡️ Proteções e Validações

1. **Campos vazios**: Restaura conteúdo original automaticamente
2. **Imagens grandes**: Convertidas para Base64 (cuidado com tamanho)
3. **Conflitos**: MutationObserver evita duplicação de elementos
4. **Scroll inteligente**: Painel lateral não interfere na rolagem da página
5. **Elementos protegidos**: Use `data-no-edit` para evitar edição

---

## 🔌 Integração com Backend

### **Salvar via API:**
```javascript
// Modificar o método saveContent() em editor.js
saveContent() {
    // Em vez de localStorage, enviar para o servidor
    fetch('/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.contentMap)
    })
    .then(response => response.json())
    .then(data => {
        this.showAlert('Conteúdo salvo no servidor!', 'success');
    })
    .catch(error => {
        this.showAlert('Erro ao salvar!', 'error');
    });
}
```

### **Exemplo PHP (save.php):**
```php
<?php
if ($_POST) {
    $content = json_decode(file_get_contents('php://input'), true);
    file_put_contents('content.json', json_encode($content, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
}
?>
```

---

## 🎯 Casos de Uso

### **Para Desenvolvedores:**
- Permitir clientes editarem conteúdo sem acesso ao código
- Prototipagem rápida de conteúdo
- Testes A/B de textos e imagens

### **Para Clientes:**
- Atualizar textos e imagens facilmente
- Visualizar mudanças em tempo real
- Não quebrar o layout do site

### **Para Agências:**
- Entregar sites editáveis
- Reduzir solicitações de alterações
- Maior autonomia para o cliente

---

## ⚠️ Limitações e Cuidados

1. **Tamanho de imagens**: Base64 pode deixar o localStorage pesado
2. **Elementos dinâmicos**: Alguns elementos podem precisar de refresh
3. **CSS personalizado**: Estilos inline podem sobrescrever CSS
4. **Performance**: Muitos elementos editáveis podem impactar a performance
5. **Compatibilidade**: Testado em navegadores modernos (Chrome, Firefox, Safari, Edge)

---

## 🆕 Funcionalidades Futuras

- [ ] Upload direto para servidor/CDN
- [ ] Histórico de versões (undo/redo)
- [ ] Editor de texto rico (WYSIWYG)
- [ ] Edição de cores e estilos
- [ ] Sistema de permissões
- [ ] Edição colaborativa em tempo real
- [ ] API REST completa
- [ ] Plugin para WordPress

---

## 📞 Suporte

Para dúvidas, problemas ou sugestões:

1. Verifique o console do navegador para erros
2. Use o debug de carrossel para investigar problemas
3. Teste em modo privado para descartar conflitos de cache
4. Verifique se todos os elementos têm `data-key` únicos

---

## 🎉 Conclusão

O **HARDEM Editor** é uma solução completa e moderna para edição visual de templates HTML. Com interface intuitiva, funcionalidades robustas e código limpo, permite que qualquer pessoa edite conteúdo sem conhecimento técnico.

**Principais benefícios:**
- ⚡ **Rápido**: Edição em tempo real
- 🎨 **Visual**: Interface moderna e responsiva
- 🛡️ **Seguro**: Validações e proteções
- 🔧 **Flexível**: Funciona com qualquer template HTML
- 📱 **Responsivo**: Suporte completo mobile

**Desenvolvido com amor para a comunidade HARDEM! 🚀** 