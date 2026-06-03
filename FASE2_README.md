# Documentação Fase 2 - Setup Backend & API

Este repositório foi evoluído para iniciar a API real e banco de dados via Node.js + Prisma + Express.

## Estrutura do Backend
O app rodará em server.ts (Express) servindo a API na mesma porta que faz fallback para o frontend do Vite.

### Módulos Implementados (Esqueleto API Real):
- **Auth** (`/server/modules/auth`) -> Login, Hash (bcrypt), JWT.
- **Products** (`/server/modules/products`) -> Produtos e validação Zod. Conectado via `ApiProductRepository`.
- **Inventory** (`/server/modules/inventory`) -> Movimentações, resumo de saldos e cálculo dinâmico a partir dos logs. Conectado via `ApiInventoryRepository`.
- **Orders** (`/server/modules/orders`) -> Criação de venda atômica usando Prisma db transaction, afetando simultaneamente Pedido, Itens, Estoque e Lançamento Financeiro com rollback automático em caso de falha (e.g., Venda acima do saldo). Conectado via `ApiOrderRepository`.
- **Finance** (`/server/modules/finance`) -> Gestão no banco real de Contas a Pagar/Receber, Despesas Manuais, Fluxo de Caixa e DRE gerencial a partir de transações. Conectado via `ApiFinancialRepository`.

## Como Iniciar Localmente

### 1. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`.
Certifique-se de configurar a URL do banco PostgreSQL localmente:
```
DATABASE_URL="postgresql://user:password@localhost:5432/gestaoos?schema=public"
JWT_SECRET="super-secret-jwt-key"
```

### 2. Rodar Migration
Para criar as tabelas do blueprint no seu banco de dados local:
```bash
npx prisma migrate dev --name init
```

### 3. Executar o Seed (Popular dados)
Criamos um seed que irá criar a Tenant de demo e o usuário Admin:
```bash
npm run prisma db seed
```
Isto irá gerar o login:
- **Email:** admin@demo.local
- **Senha:** admin123

### 4. Rodar o projeto
Para rodar a aplicação full-stack (Front em dev mode + API local):
```bash
npm run dev
```

## Como Testar a API e o App
1. Ao acessar a aplicação (apenas em ambiente DEV), no canto inferior direito haverá um pequeno painel de QA.
2. Clique no botão **DB MODE: MOCK** para trocá-lo para **DB MODE: API**. A página irá recarregar.
3. Se você não estiver logado, aparecerá um botão **API LOGIN DEMO**. Clique nele. Ele executa o script base e salva o JWT localmente (fazendo login como `admin@demo.local`).
4. Ao ir na tela de **Catálogo**, a tela chamará diretamente de `GET /api/products` (retornando dados do banco).
5. Ao ir na tela de **Estoque**, a lista de movimentos fará fetch em `GET /api/inventory/movements`, extraindo todo o saldo real e transações do banco.

6. Ao criar um **Novo Pedido** na aba Comercial (PDV), será gerada uma transação no banco. O estoque fará baixa imediata. Errar ou tentar vender algo sem estoque agora irá negar a request e avisar na tela.
7. O Cancelamento de Pedido também já funciona via API, com estorno automático de mercadoria para o estoque.
8. A aba **Financeiro** agora lê os Pedidos Efetivados como Receita e Pedidos Pendentes como Constas a Receber (onde poderá dar baixa). Criar Nova Despesa também persiste no banco. Todos os totais, DRE e Fluxo de Caixa baseiam-se em consolidação direta no BD pelo servidor.

## Módulos Atuais
- Mockados: Consignação, Produção, Fiscal. 
- API Real Integrada: Auth, Products, Inventory, Orders, Financial.
