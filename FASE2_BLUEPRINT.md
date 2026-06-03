# Blueprint Técnico Fase 2 - GestãoOS (Backend e Banco de Dados)

## 1. Arquitetura Backend Recomendada

Para um sistema de gestão ERP/PDV, a arquitetura ideal é um **Monolito Modular** baseado em **Node.js com TypeScript**, utilizando **Express** (ou Fastify) e **Prisma ORM** para interação com PostgreSQL. 
Microsserviços adicionariam complexidade desnecessária de deploy e latência de rede. O monolito modular isola os domínios no código, mantendo a simplicidade de orquestração.

### Estrutura de Diretórios por Domínios:
```text
/server
  /src
    /modules
      /auth
      /tenants
      /users
      /products
      /inventory
      /orders
      /consignments
      /production
      /finance
    /shared
      /middlewares
      /utils
      /errors
      /database
```

## 2. Modelo Multiempresa (Multi-Tenant)

O sistema suportará duas modalidades sem alterar o código básico:
1. **Cloud (SaaS Multi-tenant)**: Múltiplas empresas compartilham a mesma instância do banco e aplicação. A separação lógica é feita via coluna `tenant_id`.
2. **Self-hosted (Single/Multi-tenant)**: O cliente hospeda sua própria instância. Por padrão, cria-se um único `tenant_id` (ex: `tenant_1`) e todos os dados pertencem a ele.

- **Regra de Ouro**: Absolutamente TODAS as tabelas de negócio (produtos, pedidos, clientes) **devem** ter um campo `tenant_id`.
- O isolamento é garantido na camada de banco de dados (usando RLS - Row Level Security do Postgres) ou em middleware rigoroso no ORM que intercepta as queries injetando `where: { tenantId }`.

## 3. Schema do Banco de Dados (PostgreSQL)

Visão macro das tabelas e relacionamentos utilizando `UUID` como chave primária.

**Core & Auth**
- `tenants` (id, name, document, plan, status, created_at)
- `users` (id, name, email, password_hash, created_at)
- `tenant_users` (tenant_id, user_id, role, status) - *Permite que um usuário acesse múltiplas empresas se for SaaS*
- `roles` e `permissions` (Opcional, ou usar enum estático no código)

**Cadastros**
- `customers` (id, tenant_id, type [B2B/B2C], name, document, email, phone)
- `partners` (id, tenant_id, name, document, default_term_days)
- `products` (id, tenant_id, sku, name, category, description, unit, unit_cost, unit_price, active, min_stock, is_input)

**Estoque & Lotes**
- `lots` (id, tenant_id, product_id, code, initial_qty, current_qty, manufactured_at, expiry_date)
- `stock_movements` (id, tenant_id, product_id, movement_type [Entrada/Saída/Ajuste/Perda], qty, reason, user_id, created_at)

**Vendas (Comercial)**
- `orders` (id, tenant_id, customer_id, order_date, subtotal, discount, total, payment_method, status, notes)
- `order_items` (id, order_id, product_id, qty, unit_price, unit_cost, discount, total)

**Consignações**
- `consignments` (id, tenant_id, partner_id, sent_date, due_date, status, expected_total, sold_total, notes)
- `consignment_items` (id, consignment_id, product_id, qty_sent, unit_price, qty_sold, qty_returned, qty_lost)
- `consignment_settlements` (id, consignment_id, settled_date, total_paid, payment_method)

**Produção (Torrefação/Montagem)**
- `production_batches` (id, tenant_id, batch_code, date, final_product_id, status, initial_weight, final_weight, total_cost, yield_percent, user_id)
- `production_inputs` (id, batch_id, product_id, qty, unit_cost)
- `production_extra_costs` (id, batch_id, description, amount)

**Financeiro**
- `financial_transactions` (id, tenant_id, type [Receita/Despesa], status [Agendado/Efetivado], category, description, amount, date, payment_method, reference_id)
- `cost_centers` (Opcional, para gestão mais avançada)

**Infra & Auditoria**
- `audit_logs` (id, tenant_id, user_id, action, table_name, record_id, old_data, new_data, ip, timestamp)
- `app_settings` (tenant_id, key, value) - Ex: { "receipt_message": "Obrigado!" }


## 4. Contratos REST (Endpoints)

Base URL: `/api/v1`

**Auth**
- `POST /auth/login` -> `{ email, password }` Retorna JWT (ou seta HttpOnly Cookie).
- `POST /auth/refresh` -> Atualiza token de acesso.
- `GET /auth/me` -> Retorna contexto do usuário e seu tenant atual.

**Produtos**
- `GET /products` -> Lista produtos ativos do tenant.
- `POST /products` -> Cria produto.
- `PUT /products/:id` -> Atualiza produto.

**Estoque**
- `POST /inventory/movements` -> `{ productId, qty, type, reason }`
- `GET /inventory/movements` -> Extrato de movimentos.
- `GET /inventory/low-stock` -> Retorna alertas.

**Vendas (Comercial)**
- `POST /orders` -> Cria pedido e dispara debitos no estoque e lançamentos no financeiro via camada de serviço.
- `GET /orders/:id` -> Detalhes da venda.

**Consignação**
- `POST /consignments` -> Gera remessa e deduz estoque.
- `POST /consignments/:id/settlements` -> Realiza o acerto (gera order das vendas, estorna itens devolvidos/perdidos).

**Produção**
- `POST /production` -> Cria lote de torra (deduz grão cru).
- `POST /production/:id/finalize` -> Finaliza lote e injeta café torrado no estoque.

**Financeiro**
- `POST /finance/transactions` -> Cria receita/despesa.
- `GET /finance/summary` -> Retorna DRE e saldos resumidos.


## 5. Segurança & Auditoria

1. **Autenticação**: Sessão baseada em JWT, idealmente trafegada em HttpOnly Cookies (mitiga XSS). Refresh tokens rotacionados. 
2. **Senha**: Bcrypt ou Argon2 para hash.
3. **Auditoria (`audit_logs`)**: Middleware que intercepta toda mutação (POST, PUT, DELETE, PATCH) e grava o estado anterior e atual (JSONB). Essencial para controle de estoque e estornos.
4. **Proteção Cruzada de Tenant**: O token de acesso contém o `tenantId`. O middleware injeta `req.tenantId`. O repositório só executa `where: { tenantId: req.tenantId }`.
5. **Rate Limit e CORS**: Padrão na borda.


## 6. Mapeamento de Migração (Repository Client)

No cliente preexistente, alteraremos o Provider para instanciar a versão API no modo "production" da API.
- `ApiProductRepository.ts` -> Chamas `fetch('/api/v1/products')`
- `ApiInventoryRepository.ts` -> Chama `fetch('/api/v1/inventory/movements')`
- `ApiOrderRepository.ts` -> Chama `fetch('/api/v1/orders')`
- `ApiConsignmentRepository.ts` -> Chama `fetch('/api/v1/consignments')`
- `ApiProductionRepository.ts` -> Chama `fetch('/api/v1/production')`
- `ApiFinancialRepository.ts` -> Chama `fetch('/api/v1/finance/transactions')`


## 7. Estratégia de Identificadores e Sincronização

- **Formato**: Utilizamos `UUID v4` (ou NanoID) gerados **no cliente** (se precisarmos dar suporte offline no futuro) ou no backend (modo online estrito). Para a Fase 2, deixaremos o Backend gerar os UUIDs para garantir unicidade, mas usando o formato padronizado.
- **Soft Delete**: `deleted_at: timestamp`. Entidades nunca são deletadas fisicamente (`DELETE` em cascata é desabilitado na maioria das regras de negócio), preservando integridade referencial.
- **Concorrência**: Implementar um campo `version` (inteiro) nas tabelas cruciais (como controle de saldo de lotes). Se dois usuários tentam finalizar produção/venda simulânea, dá erro de concorrência (`version mismatch`).


## 8. Plano de Implementação da Fase 2

A implementação deve ser estritamente sequencial para evitar retrabalho de relacionamentos:
1. **Fundação**: Setup Express + TypeScript + Prisma.
2. **Database**: Criação do esquema inicial de PostgreSQL e migrações (Tenants, Users).
3. **Módulo Middlewares**: Auth (JWT), Tenant Injector, Error Handler.
4. **Módulo Catálogo**: CRUD de produtos (sem dependências).
5. **Módulo Estoque**: Movement logs e somatório de consolidação (depende de Produtos e Users).
6. **Módulo Financeiro**: Contas a pagar, fluxo base.
7. **Módulo Pedidos (Comercial)**: Orquestração (cria order -> chama estoque -> chama financeiro).
8. **Módulo Produção**: Criação de lote -> consome insumos -> gera produto.
9. **Módulo Consignação**: Workflows avançados misturando Estoque e Venda temporária.
10. **Integração no Client App**: Alterar `RepositoryProvider.tsx` de Mock para API.


## 9. Riscos a Mitigar

1. **Assimetria de Transação (Estoque/Financeiro)**: Quando uma Venda ocorre, 3 domínios são afetados (Venda, Estoque, Financeiro). Falhas no meio ("partial write") quebram a contabilidade. Mitigação: Uso obrigatório de `Database Transactions` via ORM (`prisma.$transaction`).
2. **Dados Financeiros Sensíveis**: Acessos indevidos. Mitigação: Roles e RLS (Self-hosted garante isolamento físico).
3. **Suporte Multiempresa**: Vazamento de dados em queries esquecidas: Mitigação: Criação de funções encapsuladas no Prisma Extensions para forçar filtro de tenant por default.


## 10. Próximo Prompt Sugerido

Quando quiser prosseguir para colocar as fundações em código (sem refatorar tudo de uma vez), copie e cole o prompt abaixo:

---

**Prompt para inicializar a Fase 2:**

> "Você atuará como um Full-stack Arch, vamos dar o primeiro passo da Fase 2.
>
> 1. Setup Backend: Crie a estrutura base para a API Node.js/TypeScript Express no diretório `/server`. Adicione o `package.json`, `tsconfig.json` e o `server.ts` de bootstrap configurado para porta 4000 ou a recomendada.
> 2. Rotas Base e Health Check: Crie um controller básico com endpoint `/api/health`.
> 3. Conexão Simulada em Memória para o Auth (DUMMY): Crie um endpoint de Dummy Login para injetarmos JWT apenas estrutural. 
> 4. Scripts e Build: Ajuste o Root `package.json` para que `npm run dev` inicie o frontend Vite (3000) e o backend Node (4000) em paralelo (usando concurrently se precisar), ou implemente a orquestração para um setup Full-stack real.
>
> Não crie schemas de DB nem ORM real ainda. Foque apensas em montar o runtime do backend acoplado rodando liso e responder aos health checks pingados pelo Front."

---
