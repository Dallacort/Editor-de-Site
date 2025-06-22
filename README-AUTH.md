# 🔐 Sistema de Autenticação HARDEM Editor

## Visão Geral

Sistema de autenticação implementado para proteger o acesso ao modo de edição do HARDEM Editor. Apenas usuários autenticados podem acessar e modificar o conteúdo do site.

## Credenciais de Acesso

- **Usuário:** `Hardem`
- **Senha:** `Hardem@321`
- **Sessão:** Expira em 1 hora de inatividade

## Arquivos Implementados

### 1. `auth.php` - Backend de Autenticação
- Gerencia sessões PHP
- Valida credenciais
- Controla timeout de sessão
- API REST para login/logout/verificação
- Logs de segurança

### 2. `assets/js/auth.js` - Frontend de Autenticação
- Interface de login modal
- Verificação automática de sessão
- Botão de logout
- Integração com o editor
- Monitoramento de sessão

### 3. `test-auth.html` - Página de Teste
- Interface completa de teste
- Monitoramento em tempo real
- Debug de status do sistema
- Testes de funcionalidades

## Como Funciona

### 1. Fluxo de Autenticação
1. **Carregamento da página**: Sistema verifica se usuário está autenticado
2. **Não autenticado**: Modal de login é exibido automaticamente
3. **Login**: Credenciais são validadas no servidor
4. **Autenticado**: Editor é inicializado em modo de edição
5. **Sessão**: Verificada a cada 5 minutos automaticamente

### 2. Integração com Editor
- O editor só inicializa após autenticação bem-sucedida
- Modo de edição é ativado automaticamente para usuários autenticados
- Logout desativa o modo de edição e exibe novamente o modal

### 3. Segurança
- Sessões com timeout automático (1 hora)
- Logs de tentativas de login
- Validação server-side
- Proteção contra ataques de força bruta (logs)

## Implementação nas Páginas

### Para adicionar em uma página existente:

```html
<!-- Antes dos scripts do editor -->
<script src="assets/js/auth.js"></script>

<!-- Scripts do editor (já modificados) -->
<script src="assets/js/editor/editor-core.js"></script>
<!-- ... outros scripts ... -->
```

### Páginas já implementadas:
- ✅ `index.html` - Página principal
- ✅ `test-auth.html` - Página de teste

## API Endpoints

### POST `/auth.php`

#### Login
```javascript
{
    action: 'login',
    username: 'Hardem',
    password: 'Hardem@321'
}
```

#### Verificar Sessão
```javascript
{
    action: 'check'
}
```

#### Logout
```javascript
{
    action: 'logout'
}
```

## Teste do Sistema

1. **Acesse:** `test-auth.html`
2. **Observe:** Modal de login deve aparecer automaticamente
3. **Login:** Use as credenciais `Hardem` / `Hardem@321`
4. **Verifique:** Status deve mostrar "Autenticado"
5. **Teste:** Edição deve funcionar (duplo clique nos elementos)
6. **Logout:** Clique no botão "Sair" no canto superior direito

## Funcionalidades

### ✅ Implementadas
- [x] Sistema de login modal
- [x] Validação de credenciais
- [x] Controle de sessão
- [x] Integração com editor
- [x] Botão de logout
- [x] Verificação automática de sessão
- [x] Logs de segurança
- [x] Interface de teste
- [x] Timeout automático

### 🔄 Futuras Melhorias
- [ ] Múltiplos usuários
- [ ] Níveis de permissão
- [ ] Recuperação de senha
- [ ] Autenticação 2FA
- [ ] Dashboard administrativo

## Estrutura de Arquivos

```
HARDEM-html/
├── auth.php                 # Backend de autenticação
├── test-auth.html          # Página de teste
├── assets/js/
│   ├── auth.js            # Frontend de autenticação
│   └── editor/
│       └── editor-core.js  # Modificado para aguardar auth
└── index.html             # Modificado com auth
```

## Logs de Segurança

Os logs são gravados no log de erro do PHP e incluem:
- Tentativas de login (sucesso/falha)
- Timestamps de login/logout
- Informações do usuário

## Troubleshooting

### Modal não aparece
- Verifique se `auth.js` está carregado
- Verifique console do navegador para erros

### Login falha
- Verifique credenciais: `Hardem` / `Hardem@321`
- Verifique se PHP está funcionando
- Verifique logs do servidor

### Editor não inicializa
- Verifique se autenticação foi bem-sucedida
- Verifique se scripts do editor estão carregados
- Use `test-auth.html` para debug

### Sessão expira rapidamente
- Padrão: 1 hora de inatividade
- Modificar `SESSION_TIMEOUT` em `auth.php`

## Segurança Adicional

Para produção, considere:
- HTTPS obrigatório
- Senhas mais complexas
- Rate limiting
- Captcha após tentativas falhadas
- Criptografia de senhas no banco
- Logs mais detalhados

---

**Desenvolvido para HARDEM Construction**
*Sistema seguro de edição de conteúdo* 