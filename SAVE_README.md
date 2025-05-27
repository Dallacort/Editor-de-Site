# 💾 Sistema de Salvamento - Save.php

## 📋 **Visão Geral**

O `save.php` é responsável por receber as edições do `editor.js` e salvá-las no arquivo `site-content.json`. O sistema funciona com dupla persistência: **localStorage** (backup local) + **servidor** (persistência definitiva).

## 🚀 **Arquivos Criados**

### 1. `save.php` (Raiz do projeto)
- Recebe requisições POST do editor.js
- Salva conteúdo no `site-content.json`
- Cria backups automáticos
- Retorna respostas JSON padronizadas

### 2. `site-content.json` (Criado automaticamente)
- Armazena todas as edições do site
- Inclui metadata (timestamp, IP, user-agent)
- Formato JSON estruturado

### 3. `test-save.html` (Para testes)
- Interface de teste do save.php
- 4 tipos de teste diferentes
- Verificação de funcionamento

## 🔧 **Como Funciona**

### Fluxo de Salvamento:
1. **Editor.js** → Usuário clica em "💾 Salvar"
2. **localStorage** → Salva localmente primeiro (backup)
3. **fetch()** → Envia dados para save.php
4. **save.php** → Processa e salva em site-content.json
5. **Resposta** → Confirma sucesso ou erro

### Estrutura dos Dados Enviados:
```json
{
  "contentMap": {
    "titulo_principal": "Novo título",
    "img_logo": {
      "src": "data:image/...",
      "alt": "Logo"
    },
    "bg_hero": {
      "backgroundImage": "url(nova-imagem.jpg)"
    }
  },
  "url": "https://site.com/pagina.html",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userAgent": "Mozilla/5.0..."
}
```

### Estrutura do Arquivo Salvo:
```json
{
  "contentMap": { /* dados editados */ },
  "metadata": {
    "lastUpdate": "2024-01-15 10:30:00",
    "userAgent": "Mozilla/5.0...",
    "ip": "127.0.0.1",
    "url": "https://site.com/pagina.html",
    "totalElements": 15,
    "version": "1.0.0"
  }
}
```

## 🧪 **Como Testar**

### 1. Teste Básico:
```bash
# Abrir no navegador:
http://localhost/test-save.html

# Clicar em "📝 Teste Básico"
# Deve retornar: ✅ SUCESSO!
```

### 2. Teste via Editor:
```bash
# Abrir qualquer página com editor.js
# Fazer uma edição
# Clicar em "💾 Salvar"
# Verificar se aparece: "✅ Conteúdo salvo no servidor"
```

### 3. Verificar Arquivo:
```bash
# Verificar se foi criado:
site-content.json

# E backups:
site-content-backup-2024-01-15-10-30-00.json
```

## 🔒 **Segurança**

### Configurações Atuais (Desenvolvimento):
- ✅ CORS liberado para localhost
- ✅ Apenas requisições POST aceitas
- ✅ Validação de JSON
- ✅ Tratamento de erros
- ❌ **Sem autenticação** (para testes)

### Para Produção (Implementar depois):
```php
// Adicionar autenticação
if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    sendResponse('error', 'Acesso negado.');
}

// Validar origem
$allowedOrigins = ['https://hardem.com.br'];
if (!in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    sendResponse('error', 'Origem não autorizada.');
}
```

## 📁 **Estrutura de Arquivos**

```
projeto/
├── save.php                    # ← Novo arquivo principal
├── site-content.json          # ← Criado automaticamente
├── site-content-backup-*.json # ← Backups automáticos
├── test-save.html             # ← Página de teste
├── assets/js/editor.js        # ← Atualizado para usar save.php
└── SAVE_README.md             # ← Esta documentação
```

## 🚨 **Troubleshooting**

### Erro: "Arquivo não foi criado"
```bash
# Verificar permissões do diretório:
chmod 755 /caminho/do/projeto
chmod 666 site-content.json  # Se já existir
```

### Erro: "CORS blocked"
```bash
# Verificar se está acessando via localhost
# Não funciona abrindo arquivo diretamente (file://)
# Usar: http://localhost/projeto/
```

### Erro: "fetch failed"
```bash
# Verificar se save.php existe na raiz
# Verificar se servidor PHP está rodando
# Testar: http://localhost/save.php (deve retornar erro de método)
```

### Erro: "JSON inválido"
```bash
# Verificar console do navegador
# Dados podem estar corrompidos no localStorage
# Usar botão "🚨 Reset" no editor
```

## ✅ **Checklist de Implementação**

- [x] save.php criado na raiz
- [x] editor.js atualizado para usar save.php
- [x] test-save.html criado para testes
- [x] Documentação completa
- [ ] Testado em servidor local
- [ ] Verificado funcionamento completo
- [ ] Backups funcionando
- [ ] Pronto para produção

## 🎯 **Próximos Passos**

1. **Testar** o sistema completo
2. **Verificar** se backups estão sendo criados
3. **Implementar** autenticação para produção
4. **Configurar** limpeza automática de backups antigos
5. **Integrar** com sistema de deploy do site

---

**Status**: ✅ Sistema de salvamento implementado e pronto para testes! 