# 🔧 HARDEM Editor - Sistema de Banco de Dados

## 📋 Visão Geral

Este sistema implementa um novo método de armazenamento para o HARDEM Editor usando banco de dados MariaDB, resolvendo as limitações de armazenamento em arquivos JSON.

## ✨ Principais Melhorias

- **Armazenamento Otimizado**: Imagens e textos salvos no banco de dados
- **Gestão de Imagens**: Sistema automático de otimização e thumbnails
- **Backup Inteligente**: Sistema de backup incremental
- **Painel de Administração**: Interface web para gerenciar conteúdo
- **Escalabilidade**: Suporte para milhares de imagens e textos

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

- MariaDB/MySQL instalado
- PHP 7.4 ou superior
- Extensões PHP: PDO, PDO_MySQL, GD
- Servidor web (Apache/Nginx)

### 2. Configuração do Banco de Dados

#### Passo 1: Executar o Script SQL
```sql
-- Execute o arquivo install-database.sql no seu MariaDB
mysql -u root -p123 < install-database.sql
```

#### Passo 2: Verificar Instalação
- Acesse `test-database.php` no navegador
- Verifique se todas as conexões estão funcionando
- Confirme se as tabelas foram criadas

### 3. Estrutura de Arquivos Criados

```
📁 Projeto/
├── 📁 config/
│   └── database.php                 # Configurações do banco
├── 📁 classes/
│   ├── Database.php                 # Classe de conexão
│   └── ImageManager.php            # Gerenciador de imagens
├── 📁 uploads/                     # Diretório de upload (criado automaticamente)
│   └── 📁 images/
│       ├── 📁 original/           # Imagens originais
│       ├── 📁 optimized/          # Imagens otimizadas
│       └── 📁 thumbnails/         # Miniaturas
├── install-database.sql            # Script de instalação do BD
├── save-database.php              # Nova versão do save.php
├── admin-panel.html               # Painel de administração
├── test-database.php              # Teste de funcionamento
└── README-database-setup.md       # Este arquivo
```

## 🎯 Como Usar

### 1. Testando o Sistema

1. **Teste de Conexão**: Acesse `test-database.php`
2. **Teste de Salvamento**: Use `test-save.html` mas modifique para apontar para `save-database.php`
3. **Painel Admin**: Acesse `admin-panel.html` para gerenciar dados

### 2. Configurando o Editor

Para usar o novo sistema, modifique seus arquivos JavaScript para apontar para `save-database.php` em vez de `save.php`:

```javascript
// Antes
fetch('save.php', {
    method: 'POST',
    body: formData
});

// Depois  
fetch('save-database.php', {
    method: 'POST',
    body: formData
});
```

### 3. Usando o Painel de Administração

O painel permite:
- 📊 **Estatísticas**: Visualizar total de imagens, textos e backups
- 🖼️ **Gerenciar Imagens**: Ver, organizar e excluir imagens
- 📝 **Gerenciar Textos**: Editar e organizar conteúdo textual
- 💾 **Backups**: Criar e gerenciar backups do sistema
- ⚙️ **Configurações**: Monitorar status do sistema

## 📊 Estrutura do Banco de Dados

### Tabela `imagens`
```sql
- id: Chave primária
- nome_arquivo: Nome do arquivo
- nome_original: Nome original do upload
- tipo_mime: Tipo MIME da imagem
- tamanho: Tamanho em bytes
- largura/altura: Dimensões da imagem
- urls: Caminhos para original, otimizada e thumbnail
- hash_md5: Hash para evitar duplicatas
- alt_text/descricao: Dados de acessibilidade
```

### Tabela `textos`
```sql
- id: Chave primária
- chave: Identificador único do texto
- conteudo: Conteúdo do texto
- pagina: Página onde o texto aparece
- tipo: Tipo de conteúdo (texto, título, etc.)
- versao: Controle de versão
```

### Tabela `pagina_imagens`
```sql
- Relaciona imagens com páginas específicas
- Controla posição e contexto das imagens
- Permite propriedades personalizadas (JSON)
```

### Tabela `backups`
```sql
- Registra todos os backups criados
- Tipos: completo, incremental, imagens, textos
- Controle de status e integridade
```

## 🔧 Configurações Avançadas

### Otimização de Performance

1. **Índices de Banco**: Já incluídos no script SQL
2. **Cache de Imagens**: Implementado automaticamente
3. **Compressão**: Imagens otimizadas automaticamente

### Configurações PHP Recomendadas

```php
// No php.ini ou .htaccess
post_max_size = 200M
upload_max_filesize = 200M
memory_limit = 1024M
max_execution_time = 600
max_input_vars = 10000
```

### Configurações MariaDB Recomendadas

```sql
-- Para melhor performance
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_allowed_packet = 200M;
```

## 🛡️ Segurança

### Implementações de Segurança

- ✅ **Prepared Statements**: Proteção contra SQL Injection
- ✅ **Validação de Arquivos**: Verificação de tipos MIME
- ✅ **Hash MD5**: Detecção de duplicatas
- ✅ **Sanitização**: Dados limpos antes do armazenamento
- ✅ **Logs de Auditoria**: Registro de todas as ações

### Recomendações Adicionais

1. Configure firewall para proteger porta do MySQL (3306)
2. Use conexões SSL entre PHP e MariaDB
3. Implemente autenticação no painel admin
4. Configure backup automático do banco

## 🔍 Troubleshooting

### Problemas Comuns

**1. Erro de Conexão com Banco**
- Verifique se MariaDB está rodando
- Confirme usuário/senha em `config/database.php`
- Teste conexão com `test-database.php`

**2. Erro de Upload de Imagens**
- Verifique permissões da pasta `uploads/`
- Confirme configurações PHP (upload_max_filesize)
- Verifique espaço em disco

**3. Painel Admin não Carrega Dados**
- Crie o arquivo `api-admin.php` (não incluído nesta versão)
- Verifique console do navegador para erros JavaScript
- Confirme se todas as tabelas foram criadas

**4. Performance Lenta**
- Otimize tabelas: `OPTIMIZE TABLE imagens, textos;`
- Verifique índices do banco
- Considere aumentar innodb_buffer_pool_size

### Logs e Monitoramento

- **Log do Sistema**: `hardem-editor.log`
- **Logs MariaDB**: `/var/log/mysql/error.log`
- **Logs PHP**: Verifique error_log do servidor

## 📈 Monitoramento

### Métricas Importantes

- Total de imagens armazenadas
- Espaço utilizado em disco
- Tempo de resposta das consultas
- Frequência de backups
- Erros de conexão

### Comandos Úteis MariaDB

```sql
-- Ver tamanho das tabelas
SELECT 
    table_name AS 'Tabela',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamanho MB'
FROM information_schema.TABLES 
WHERE table_schema = 'hardem_editor';

-- Ver estatísticas de uso
SELECT 
    COUNT(*) as total_imagens,
    SUM(tamanho) as tamanho_total_bytes,
    AVG(tamanho) as tamanho_medio_bytes
FROM imagens 
WHERE status = 'ativo';
```

## 🔄 Migração do Sistema Antigo

Se você já tem dados no sistema antigo (arquivos JSON), será necessário criar um script de migração. O script deve:

1. Ler arquivos JSON existentes em `backups/`
2. Extrair imagens base64 e convertê-las para arquivos
3. Inserir textos na tabela `textos`
4. Inserir imagens na tabela `imagens`
5. Criar relacionamentos em `pagina_imagens`

## 📞 Suporte

Para suporte e dúvidas:
- Verifique primeiro o arquivo `test-database.php`
- Consulte os logs em `hardem-editor.log`
- Teste cada componente individualmente

---

**Versão**: 3.0.0  
**Data**: 2024  
**Autor**: HARDEM Editor Team 