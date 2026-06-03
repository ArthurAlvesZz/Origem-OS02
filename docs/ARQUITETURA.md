# Arquitetura GestãoOS

## 1. Arquitetura Recomendada
Para suportar o modelo híbrido (Cloud SaaS e Self-Hosted local) com segurança, a arquitetura deve ser baseada em microsserviços desacoplados:

- **GestãoOS Client (Frontend)**: PWA web construído em React/TypeScript. Pode ser instalado via navegador ou empacotado. Capaz de se conectar a múltiplas instâncias de servidor através de "Perfis de Conexão".
- **GestãoOS Server (Backend API)**: Uma API REST/GraphQL (ex: Node.js/Express, NestJS ou Go) responsável pela lógica de negócios, validações, segurança e comunicação com o banco. O cliente **NUNCA** se conecta diretamente ao banco.
- **GestãoOS Launcher**: Um executável desktop (Tauri ou Electron) responsável por hospedar e gerenciar o Server e o Banco de Dados em ambientes Self-Hosted. Ele encapsula o servidor web, gerencia backups, fornece a interface de status (IP, Porta, Logs) e gera os meios de acesso (QR Codes/Links de pareamento) públicos ou locais.
- **Database**: PostgreSQL. Robusto, Open Source e fácil de empacotar em ambientes locais (via Docker ou binários) e escalar no Cloud (AWS RDS, Neon).

## 2. Diagrama Textual dos Componentes
```text
[ GESTÃO OS CLIENT (PWA/Mobile/Desktop) ]
        |
        | (HTTPS / WSS para tempo real) -> Usa Tokens JWT / Pareamento
        v
[ GESTÃO OS SERVER / API GATEWAY ] --> Autenticação, Rate Limiting, Auditoria
        |
        | (Conexão TCP Segura, na rede interna/docker)
        v
[ POSTGRESQL DATABASE ] --> Multi-tenant (Cloud) ou Single-tenant (Self-hosted)
        |
[ LAUNCHER DAEMON ] --> Orquestra Backup, Resiliência, Logs e Túneis Cloudflare
```

## 3. Modos de Acesso & Fluxo de Conexão
1. **Local LAN**: Servidor expõe na porta via HTTPS (certificados locais auto-assinados via mkcert ou trusts). App conecta via `https://192.168.0.x:porta`.
2. **Remoto Privado**: Cliente loga na mesma VPN (Tailscale/ZeroTier). O Launcher detecta a malha e fornece o IP privado para pareamento na mesma VPN.
3. **Remoto Público Seguro**: O Launcher levanta um túnel (`Cloudflare Tunnel`), expondo a instância numa URL (ex: `https://cliente-cafe.gestaoos.net`) sem abrir portas físicas no roteador do usuário.
4. **Cloud SaaS**: O GestaõOS hospeda a aplicação multi-tenant.

**Fluxo de Conexão (Pareamento)**:
1. O Launcher exibe um QR Code temporário (TTL 5 mins) com os dados: `URL do Servidor`, `Server Fingerprint`, e um `Pairing Token`.
2. O App Cliente escaneia o QR Code.
3. O App envia o `Pairing Token` via requests HTTP.
4. O Server valida e retorna um `Refresh Token` e um `Access Token` criptografados, autenticando o dispostivo.

## 4. Instalação e Orquestração Self-Hosted
- O usuário baixa o _Launcher GestãoOS.exe/.dmg_.
- Ao iniciar, o Launcher verifica pré-requisitos (Docker ou baixa binários standalone do Postgres e Node).
- Inicia os processos em _background daemon_.
- Uma interface local (localhost:porta) guiada pede os dados do dono (Admin) e criar a base.
- O Launcher gerencia os túneis Cloudflare para dar acesso fora da loja.

## 5. Fluxo de Backup e Restore
- **Backup**: O Launcher roda CRON jobs locais realizando `pg_dump`. O arquivo é compactado, criptografado com a senha do Admin e salvo localmente ou enviado para a nuvem da GestãoOS (como benefício premium).
- **Restore**: Pelo Launcher, o usuário faz o upload do arquivo `.enc`, digita a senha de segurança (KMS ou passphrase local). O Launcher faz p `pg_restore` e reinicia o backend.

## 6. Fluxo de Troca de Servidor/Base
- O Client possui um _"Gerenciador de Perfis"_.
- No Storage Local/IndexedDB, há as chaves: `{ profileId: 'loja-centro', url: 'https://...', refreshToken: '...', fingerprint: '...' }`
- Ao trocar o perfil na UI, as instâncias instanciam o Adapter do Repositório apontando para a nova BaseURL.

## 7. Estrutura de Pastas Sugerida
```
/gestaoos/
  /apps/
    /client       -> Frontend React PWA (UI, Components, Domain)
    /server       -> Backend Node.ts (Routes, Controllers, Services)
    /launcher     -> Aplicativo Desktop Tauri (Rust/TS)
  /packages/
    /core         -> Contratos de API, Tipos TypeScript compartilhados (DTOs)
    /eslint...
```

## 8. Contratos Iniciais de API (Padrão Repositório)
Usaremos interfaces para isolar a UI da origem de dados:
```ts
interface IOrderRepository {
  getOrders(filters?: OrderFilters): Promise<Order[]>;
  createOrder(order: CreateOrderDTO): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
}
// Implementações: MockOrderRepository, ApiOrderRepository
```

## 9. Modelo de Segurança
- **Rede**: Nem o Cloud nem o Launcher expõem o Postgres para internet. Apenas as rotas da API via HTTPS estão acessíveis.
- **Auth**: Baseado em JWT (Access de curto tempo + Refresh HTTP-Only).
- **Auditoria**: Log de rastreio em todas as rotas de mutação (`userId`, `action`, `metadata`).
- **Fingerprinting**: Prevê ataque de _man-in-the-middle_ em instalações locais.

## 10. Plano de Migração (Mocks -> API)
1. Criar camada `src/repositories/interfaces`: `IOrders`, `IInventory`, `IFinancial`.
2. Encapsular a lógica atual do `src/domain/*` dentro de implementações `Mock*Repository`.
3. Inserir injeção de dependência via Contexto React ou Singleton (ex: `currentRepo = MockRepo`).
4. Atualizar os Controllers (Actions/Thunks/Hooks) para depender estritamente da Interface.
5. Mais tarde, criar o backend e implementar o `ApiOrderRepository`.

## 11. Decisão: Firebase vs Supabase vs Postgres Próprio
**Decisão**: PostgreSQL Próprio.

**Justificativa**:
- O GestãoOS precisa ser hospedável _offline_ (self-hosted local, para lojas e fazendas isoladas sem internet ou com queda).
- **Firebase** é 100% Cloud. Inviabiliza local/self-hosted.
- **Supabase** é denso demais para rodar localmente na máquina do cliente comum (exige vários containers massivos, como GoTrue, Realtime, Kong, Storage). É focado em DEV local, não em Produção Local.
- Um **Postgres limpo + API Própria** (Node ou Go) tem um _footprint_ de memória ínfimo (menos de 200MB num setup base via binários), perfeito para rodar até em um caixa antigo na fazenda usando o Launcher. O Launcher cuidará da infraestrutura.

## 12. Próximo Prompt
Copie e cole o prompt abaixo no chat para iniciarmos a migração para a arquitetura de repositórios no Client, sem criar backend ainda.

***
**PRÓXIMO PROMPT SUGERIDO:**
> Olá Arquiteto! Seguindo a recomendação, vamos criar a camada de Adapters/Repository Injection no Client. 
> 1. Crie a estrutura `/src/repositories/interfaces` e defina as interfaces para IOrderRepository, IInventoryRepository, e IFinancialRepository.
> 2. Mova a lógica dos mocks em `/src/domain/` para `/src/repositories/mocks/`.
> 3. Crie um `RepositoryProvider` ou injetor global.
> 4. Refatore a Home e o PDV para buscar tudo usando `repo.orders.getOrders()` ao invés de importar o mock diretamente.
> Mantenha tudo funcional em memória.
