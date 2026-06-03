# Blueprint & Arquitetura SaaS - Gestão para Pequenos Negócios

## 1. Posicionamento e Nomes
**Posicionamento:** "O sistema operacional do negócio premium. Feito para operar. Feito para crescer."  
**Conceito:** Eliminar a barreira entre ERP corporativo e caderninho de anotações. Um sistema onde a UI parece um app de consumidor premium (Apple, Stripe, Linear), mas o núcleo tem solidez empresarial.

**10 Opções de Nomes:**
1. **Origem OS** (Forte, remete a rastreabilidade e fundação)
2. **Nuclea** (O centro do negócio)
3. **Nexus Gestão** (Ponto de conexão)
4. **Vértice Business** (Ponto elevado, clareza)
5. **Lógika SaaS** (Processos lógicos simplificados)
6. **Aura OS** (Leveza, presença)
7. **Prisma Hub** (Múltiplas facetas do negócio convergindo)
8. **Base ERP** (Sólido, não pretensioso)
9. **Klaro OS** (Clareza financeira e de estoque)
10. **Síntese Gestão** (O essencial resumido)

---

## 2. Diagnóstico da Arquitetura Anterior
- **O que estava bom:** A escolha da UI limpa e o uso de Tailwind + Lucide para uma estética premium, a divisão conceitual inicial (Cloud vs Self-hosted) e o reconhecimento da COFCOF como caso de uso 0.
- **O que estava genérico/arriscado:** Salto prematuro para o código antes de estipular o modelo Multi-tenant (SaaS). A consignação foi tratada como core universal, quando na verdade é uma *Feature Flag* (módulo ativável apenas para contas aderentes). A arquitetura visual começou a ser feita sem considerar a distinção brutal entre o layout PWA Mobile (Caixa/Estoque na rua) e o ERP Desktop (Relatórios/Financeiro num monitor grande).

---

## 3. Módulos, Submódulos e Navegação Final
A arquitetura de informação obedece a módulos base (Sempre ativos) e módulos de expansão (Configuráveis via plano ou necessidade).

**Navegação Principal (Sidebar/Bottom):**
- **Painel Central (Dashboard):** Visão Executiva (Vendas, Lucro, Inadimplência, Alertas Críticos).
- **Vendas & PDV:** Pedidos B2B, Frente de Caixa Rápida (Touch), Clientes, Orçamentos.
- **Estoque & Catálogo:** Produtos, Variações (Tamanhos/Pesos), Lotes/Valididades, Movimentações, Fornecedores.
- **Financeiro:** Contas a Pagar/Receber, Extrato (Fluxo de Caixa), Centro de Custos, DRE Gerencial Móvel.
- **Produção (Módulo Ativável):** Ordens de Produção, Fichas Técnicas, Baixa de Insumos.
- **Consignações (Módulo Ativável):** Remessas, Conferências de Giro, Acerto Financeiro.
- **Pessoas & Custos (Módulo Ativável):** Equipe, Folha de Custos Interna (Não contábil).
- **Contábil/Fiscal:** Pré-notas, Resumo Mensal, Área de Transferência do Contador (Export DRM).
- **Ajustes:** Conta, Feature Flags, Assinatura (SaaS), Permissões de Usuários.

---

## 4. MVP, Fase 2 e Fase 3

**MVP (Mínimo Produto Vendável - Mês 1):**
*O necessário para uma loja pequena trocar a planilha pelo sistema hoje e pagar por isso.*
1. Tenant base (1 empresa, usuários básicos).
2. Catálogo (Produtos simples, preços, custo base).
3. PDV / Registro de Vendas.
4. Financeiro Mínimo (Pagar/Receber atrelado às vendas).
5. (Para a COFCOF: Estoque Manual Simples).

**Fase 2 (Nichos Premium - Mês 2-3):**
*O que atrai clientes complexos (Torrefações, Padarias artesanais).*
1. Módulo de Consignação Completo (Acertos vinculados ao financeiro).
2. Produção & Fichas Técnicas (Controle de perda/rendimento de quebra de grão, por exemplo).
3. Gestão de Lotes C/ Códigos Rastreáveis (Integração QR premissa COFCOF).

**Fase 3 (SaaS Scaling):**
*Automação pesada e conformidade.*
1. Emissão Fiscal (PlugNotas / Focus NFE) automatizada no final da venda.
2. Integração PIX Automática para recebimento PDV.
3. Portal do Contador.

---

## 5. Modelo de Dados de Alto Nível (Entity Relationship)
Fundação forte Multi-tenant:
- `Tenant` (Empresa cliente SaaS) -> Modulos Ativos (JSON ou Flags).
- `User` -> Pertence a `Tenant` através de `TenantUser` (Role/Permissões).
- `Product` -> `ProductVariant` -> `StockMovement` (Físico) -> vinculado a `Tenant`.
- `Transaction` (Financeiro unificado) -> Type (Payable/Receivable) -> Status (Pending/Settled).
- `Order` (Venda Geral) -> `OrderItem` -> Gera um recebível no Financeiro.
- `Consignment` -> `ConsignmentItem` -> Ao finalizar (Acerto), gera um `Order` e um `Transaction`.

---

## 6. Arquitetura Universal e Dinâmica de Servidor

**A Regra do "Client Configuration":**
O App React Frontend é construído de forma "Server Agnostic". No *localStorage*, há uma chave `API_BASE_URL`. Se estiver vazia, aponta para `api.origemos.com`. Se a empresa quiser servidor próprio, ela vai em *Segurança > Mudar Servidor* e insere `192.168.0.x:4000`. O front recarrega apontando todos os requests para o servidor local.

- **Cloud SaaS (Padrão de Venda):** Frontend na Vercel Edge. Backend Node/NestJS + Banco Gerenciado PostgreSQL (Supabase/Neon) com segurança RLS (Row Level Security onde todo payload exige o ID do Tenant no JWT).
- **Self-Hosted:** 1 `docker-compose.yml`. Sobe `postgres_db`, `api_server`, `front_app` e `nginx_proxy`.
- **Desktop Launcher (Tauri):** O executável basicamente será um WebView/Browser ultra leve (Tauri) empacotado que monitora se os containers locais estão rodando; se não, ele dá o start e abre o IP `localhost`.

---

## 7. Regras de Segurança, Usuários e RLS
- **Superadmin (Nós):** Controla as plans (Mensalidades SaaS).
- **Owner (Dono do Negócio):** Vê MRR, DRE, contrata/demite sistema.
- **Gerente:** Executa operações, vê relatórios, não altera contas bancárias.
- **Operador/Caixa:** Apenas abre PDV, lança venda cega, não vê totais gerais, relatórios bloqueados.
- **Isolamento de Dados (RLS):** Toda query Prisma ou Drizzle **DEVE** incluir `.where({ tenant_id: user.tenantId })`. Se usar Supabase DB, o RLS cuidará disso invisivelmente.

---

## 8. Abordagem de Riscos
- **Fiscal:** Deixar 100% claro na UI que estimativas não substituem guias DARF ou DAS. Não geraremos regras tributárias de cabeça (ICMS, MVA). O sistema fornece o **XML das Vendas Brutas** para o software do escritório contábil. A automação futura consumirá NFE de plataformas especializadas API.
- **Funcionários:** A tela "Equipe/Custos" é puramente "Gestão de Caixa Interna" (para a COFCOF saber o custo final do produto torrado baseado em X horas a R$Y/hora laborada). Jamais prometa na UI que o sistema fecha Folha no eSocial ou calcula holerite blindado a processos trabalhistas. Título da funcionalidade: *Estimativa de Custos de Pessoal*.

---

## 9. Design System Premium
- **Tipografia:** `Inter` para legibilidade de interface densa. `JetBrains Mono` ou `Geist Mono` APENAS para SKU, código de barras, cifrão de relatórios precisos. Menos fontes com serifa, mais limpeza.
- **Paleta SaaS Base:** Mono (Zinc 50 a Zinc 950). Destructive actions (Red 500 elegante, sem ser chamativo). Confirm (Emerald 600 macio). Warning (Amber 500).
- **Densidade:** Em Desktop, o design precisa de "Density Control" (como o Linear). Muitas colunas precisam caber na tela sem scrolar muito.
- **Inputs:** Sem bordas pesadas e azuis antigos do Bootstrap. Foco com Ring offset sutil (`focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1`).

---

## 10. Fluxos Centrais e UX

1. **Venda Balcão (Mobile PDV):** Navegação inferior -> `PDV` -> Lista produtos em grid grande -> Clica 3 vezes, `Cobrar` -> `PIX` -> `Ok`. Gera `Transaction` paga e abate `StockMovement`.
2. **Consignação de Cafés Especiais:** `Consignações` -> `Nova Remessa` -> Parceiro (Padaria X) -> + 5kg Arábica -> Status: *Aberto*. Fica na tela aguardando a data de expiração piscar. Quando chega: -> `Acerto` -> Preenche = "Vendeu 4, Voltou 1" -> `Finalizar` -> Gera boleto/nota das 4, repõe 1 no estoque.
3. **Contador:** Final de mês -> O dono abre app desktop ou cloud, `Fiscal` -> `Baixar Pacote Contador` -> Um zip com vendas e notas scaneadas vai pro whatsapp de quem ajeita o imposto.
