# Sistema de Edição para o Template Hardem

Este projeto implementa um sistema de edição in-line para o template HTML Hardem, permitindo que usuários editem textos e imagens diretamente no navegador sem precisar modificar o código fonte.

## Funcionalidades

- Edição in-line de textos (títulos, parágrafos, botões, etc.)
- Upload e substituição de imagens
- Salvamento automático das alterações
- Identificação de elementos editáveis através de data-keys
- Visualização dos data-keys durante a edição
- Tratamento especial para links (evita navegação durante a edição)
- Compatível com todos os navegadores modernos

## Como Usar

### Para Usuários Finais

1. Abra qualquer página do site no navegador
2. Clique no botão "🔧 Modo de Edição" no canto superior direito da tela
3. Os elementos editáveis ficarão destacados com uma borda azul
4. Para editar texto:
   - Clique no texto e faça as alterações desejadas
   - Cada elemento editável mostrará sua chave de identificação (data-key)
5. Para editar imagens:
   - Clique na imagem e um overlay aparecerá
   - Use o botão "📤 Upload" para substituir a imagem
   - Use o botão "🗑️ Remover" para remover a imagem
6. Clique no botão "💾 Salvar Alterações" para salvar todas as modificações
7. Clique novamente em "🔧 Modo de Edição" para sair do modo de edição

### Para Desenvolvedores

#### Estrutura do Projeto

- `assets/js/editor.js`: Script principal do editor
- `apply-editor-to-all-pages.js`: Script Node.js para adicionar o editor a todas as páginas
- `add-data-keys.js`: Script Node.js para adicionar atributos data-key a elementos editáveis
- `process-all-pages.js`: Script Node.js para processar automaticamente todas as páginas HTML

#### Requisitos para Scripts de Automação

- Node.js 14+ instalado
- Cheerio (`npm install cheerio`)

#### Comandos

```bash
# Instalar dependências e configurar o projeto
npm install

# Adicionar referência ao editor.js em todas as páginas listadas
npm run add-editor

# Adicionar atributos data-key a elementos editáveis nas páginas listadas
npm run add-keys

# Processar automaticamente TODAS as páginas HTML no projeto (recomendado)
npm run process-all

# Executar toda a configuração (instalar, adicionar keys e adicionar editor)
npm run setup

# Iniciar servidor local para testar
npm run serve
```

O script `process-all-pages.js` é o mais completo e recomendado, pois:
1. Encontra automaticamente TODAS as páginas HTML no projeto
2. Adiciona atributos data-key a elementos editáveis
3. Adiciona a referência ao editor.js no final de cada página

#### Quais Elementos São Editáveis?

O sistema adiciona automaticamente atributos data-key aos seguintes tipos de elementos:

- Títulos: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Parágrafos: `p`, `p.disc`, `p.details`, etc.
- Textos em spans: `span`, `span.pre`, `span.title`, etc.
- Botões e links: `.rts-btn`, `a.read-more-btn`, etc.
- Itens de lista: `li` (que não contêm sublistas)
- Legendas de imagens: `figcaption`, `.caption`
- Imagens: `img`

#### Como Integrar com Backend

O sistema está preparado para integração com backend. No método `saveChanges()` do arquivo `editor.js`, você encontrará o comentário:

```javascript
// Aqui seria o ponto de integração com um backend
// Exemplo: enviar this.contentMap para uma API
```

Para implementar a integração:

1. Crie uma API REST para receber e salvar o conteúdo
2. Modifique o método `saveChanges()` para enviar os dados para sua API
3. Implemente autenticação conforme necessário

Exemplo de integração com API REST:

```javascript
// Enviar dados para a API
fetch('/api/save-content', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(this.contentMap)
})
.then(response => response.json())
.then(data => {
    alert('Alterações salvas com sucesso!');
})
.catch(error => {
    console.error('Erro ao salvar alterações:', error);
    alert('Erro ao salvar alterações. Tente novamente.');
});
```

## Funcionamento Técnico

O sistema utiliza atributos `data-key` para identificar elementos editáveis. Cada elemento editável possui uma chave única que é usada para mapear as alterações.

Quando o usuário salva as alterações, o sistema cria um mapa com todos os valores:

```javascript
{
    "banner_title": "Novo título do banner",
    "banner_description": "Nova descrição do banner",
    "about_image": {
        "src": "data:image/jpeg;base64,...",
        "alt": "Imagem sobre nós"
    }
}
```

Este mapa é salvo no localStorage do navegador e pode ser enviado para um backend para persistência permanente.

## Personalização

Você pode personalizar o sistema de edição modificando o arquivo `editor.js`:

- Altere o estilo dos botões e overlays
- Adicione novos tipos de elementos editáveis
- Implemente validação de conteúdo
- Adicione suporte para formatação de texto (rich text)

## Limitações Atuais

- Não há autenticação de usuários
- As alterações são salvas apenas no localStorage (sem persistência real)
- Não há histórico de alterações
- Não há suporte para formatação de texto avançada

## Próximos Passos

- [ ] Implementar autenticação de usuários
- [ ] Criar API REST para persistência de dados
- [ ] Adicionar histórico de alterações
- [ ] Implementar editor de texto avançado
- [ ] Adicionar suporte para múltiplos idiomas 