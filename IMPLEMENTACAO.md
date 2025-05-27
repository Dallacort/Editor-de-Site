# 📦 Implementação do HARDEM Editor em Todo o Site

## 🚀 **Instalação Rápida**

### 1. Adicionar o Script em Todas as Páginas
```html
<!-- Antes de </body> em TODAS as páginas -->
<script src="assets/js/editor.js"></script>
```

### 2. Marcar Elementos Editáveis
```html
<!-- Textos -->
<h1 data-key="titulo_principal">Título Editável</h1>
<p data-key="descricao_empresa">Descrição editável</p>

<!-- Imagens -->
<img src="imagem.jpg" data-key="logo_empresa" alt="Logo">

<!-- Links e Botões -->
<a href="#" data-key="botao_contato">Entre em Contato</a>
<button data-key="btn_servicos">Nossos Serviços</button>

<!-- Backgrounds (automático) -->
<section style="background-image: url(bg.jpg)">Conteúdo</section>
```

## 🎯 **Funcionamento Automático**

### ✅ **O que é Detectado Automaticamente:**
- Todos os elementos com `data-key`
- Títulos (h1-h6), parágrafos (p), spans, links (a), botões
- Imagens com `data-key`
- Backgrounds via CSS
- Slides de carrossel (.swiper-slide)
- Elementos com classes: .title, .subtitle, .description, .content, .text, .editable

### ✅ **Funcionalidades Ativas:**
- **Modo WordPress**: Clique em qualquer elemento → painel abre automaticamente
- **Painel contextual**: Mostra apenas o elemento selecionado
- **Persistência**: localStorage + exportação JSON
- **Modo estático**: Pausa animações para edição
- **Interface clean**: 280px, sem efeitos visuais desnecessários

## 🔧 **Controles do Editor**

| Botão | Função |
|-------|--------|
| 🔓 Ativar Edição | Liga/desliga modo de edição |
| ⚙️ Painel | Abre/fecha painel lateral |
| ⏸️ Pausar | Pausa animações e carrosséis |
| 💾 Salvar | Salva no localStorage |
| 🔄 Restaurar | Volta para última versão salva |
| 🚨 Reset | Limpa tudo e volta ao original |

## 📱 **Responsividade**
- **Desktop**: Painel 280px fixo à direita
- **Mobile**: Painel fullscreen com max-width 320px
- **Toolbar**: Altura 50px (desktop) / 44px (mobile)

## 🎨 **Personalização**

### Excluir Elementos da Edição:
```html
<h1 data-no-edit>Título não editável</h1>
```

### Elementos Sempre Editáveis:
```html
<div class="editable">Sempre editável</div>
```

## 💾 **Integração com Backend (Futuro)**

O sistema está preparado para integração com `save.php`:

```php
<?php
// save.php
if ($_POST['action'] === 'save_content') {
    $data = json_decode($_POST['data'], true);
    // Processar e salvar $data['content']
    echo json_encode(['success' => true]);
}
?>
```

## 🚨 **Troubleshooting**

### Editor não aparece:
1. Verificar se `editor.js` está carregando
2. Verificar console para erros
3. Testar em página simples primeiro

### Elementos não são detectados:
1. Adicionar `data-key="nome_unico"`
2. Verificar se não tem `data-no-edit`
3. Verificar se elemento não está dentro de iframe

### Painel não abre:
1. Verificar se está em modo de edição
2. Clicar diretamente no elemento
3. Verificar se elemento tem conteúdo

## ✅ **Checklist de Implementação**

- [ ] Script adicionado em todas as páginas
- [ ] Elementos principais marcados com `data-key`
- [ ] Testado em desktop e mobile
- [ ] Verificado funcionamento de carrosséis
- [ ] Testado salvamento e restauração
- [ ] Documentado para equipe

## 🎯 **Resultado Final**

Sistema de edição visual completo que funciona em **qualquer página** do site, com interface **modo WordPress**, persistência automática e preparado para publicação futura. 