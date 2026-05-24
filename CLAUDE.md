@AGENTS.md

# MilhasCRM — Contexto do Projeto

## Localização
- **Pasta local:** `C:\Users\thico\crm-milhas`
- **Repositório GitHub:** https://github.com/thicobm17-cmd/crm-milhas
- **Deploy:** Railway (em configuração)

---

## Quem é o Thiago (dono do projeto)
Thiago é um **assessor de milhas** — um profissional que gerencia os programas de fidelidade de seus clientes, funcionando como um "gestor de investimentos, só que de milhas e viagens". Ele **não compra nem vende milhas diretamente**: ele assessora clientes, maximizando o uso das milhas que eles já têm.

**Modelo de negócio:**
- Cobra uma **fee mensal** de assessoria por cliente
- Cobra uma **fee por emissão** (cada passagem emitida com milhas)
- O valor entregue é medido pela **economia gerada**: quanto o cliente economizou usando milhas em vez de pagar o preço cheio da passagem

**Fórmula da economia:**
```
economia = preço de mercado da passagem − taxas pagas − fee cobrada ao cliente
```

---

## O que é o MilhasCRM
Um CRM completo e personalizado para gestores de milhas, com os seguintes módulos:

| Módulo | Função |
|---|---|
| **Dashboard** | KPIs: economia total gerada, clientes ativos, emissões, receita mensal. Gráfico top clientes. |
| **Clientes** | Cadastro completo, programas de fidelidade por cliente, saldo de milhas, histórico de emissões, meta de economia, ROI da assessoria |
| **Emissões** | Registro de passagens emitidas com milhas. Cálculo automático de economia. |
| **Financeiro** | Receitas (fees), despesas, lucro líquido, contas a pagar/receber |
| **Metas** | Acompanhamento da meta de economia por cliente e visão consolidada da carteira |
| **Configurações** | Perfil do gestor |

**Programas de fidelidade suportados:**
- LATAM Pass (cor: #e3373c)
- Smiles / GOL (cor: #f97316)
- TudoAzul (cor: #2563eb)
- Livelo (cor: #8b5cf6)
- Outro (cor: #6b7280)

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL via Railway |
| ORM | Prisma 5 |
| Autenticação | NextAuth v5 (JWT, credentials) |
| UI | Tailwind CSS + shadcn/ui (via @base-ui/react) |
| Gráficos | Recharts |
| Hash de senha | bcryptjs |
| Deploy | Railway (app + PostgreSQL no mesmo projeto) |

---

## Estrutura de Pastas

```
crm-milhas/
├── app/
│   ├── (app)/                  # Páginas protegidas (requer login)
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── clientes/           # Lista, novo, [id] (detalhe)
│   │   ├── emissoes/           # Lista, nova emissão
│   │   ├── financeiro/         # Receitas e despesas
│   │   ├── metas/              # Metas de economia
│   │   ├── configuracoes/      # Perfil do gestor
│   │   └── layout.tsx          # Layout com sidebar
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── cadastro/           # POST: criar gestor
│   │   ├── clientes/           # GET: listar, POST: criar
│   │   ├── emissoes/           # POST: registrar emissão
│   │   ├── contas-programas/   # POST: adicionar programa ao cliente
│   │   ├── transacoes/         # POST: registrar transação financeira
│   │   ├── programas/          # GET: listar programas
│   │   └── perfil/             # PATCH: atualizar perfil
│   ├── login/                  # Página de login
│   ├── cadastro/               # Página de cadastro
│   └── page.tsx                # Redireciona para /dashboard ou /login
├── components/
│   ├── layout/Sidebar.tsx      # Sidebar de navegação
│   ├── dashboard/              # Gráficos do dashboard
│   ├── clientes/               # AdicionarContaForm
│   ├── financeiro/             # NovaTransacaoForm
│   ├── configuracoes/          # PerfilForm
│   └── ui/                     # Componentes shadcn/ui
├── lib/
│   ├── auth.ts                 # Configuração NextAuth
│   ├── db.ts                   # Singleton Prisma Client
│   ├── queries.ts              # Funções de query reutilizáveis
│   └── utils.ts                # formatCurrency, formatMilhas, calcROI...
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── seed.ts                 # Seed: insere os 5 programas de fidelidade
├── types/
│   ├── index.ts                # Tipos globais
│   └── next-auth.d.ts          # Extensão do tipo Session (adiciona user.id)
├── middleware.ts               # Proteção de rotas via NextAuth
├── railway.toml                # Config de deploy Railway
└── .nvmrc                      # Node.js 20 (requisito do Next.js 16)
```

---

## Banco de Dados (Prisma Schema)

| Tabela | Descrição |
|---|---|
| `gestores` | Usuários do sistema (email + senha bcrypt) |
| `programas` | Catálogo fixo: LATAM, Smiles, TudoAzul, Livelo, Outro |
| `clientes` | Clientes de cada gestor (fee, meta, dados pessoais) |
| `contas_programas` | Qual cliente tem qual programa e quantas milhas |
| `emissoes` | Passagens emitidas (origem, destino, milhas, preço mercado, taxas, fee) |
| `transacoes` | Financeiro: receitas, despesas, fees cobradas |

**Multi-tenant:** cada query filtra por `gestorId = session.user.id`. Não há RLS no banco — a isolação é feita na camada da aplicação.

---

## Variáveis de Ambiente

### Local (`.env.local`)
```
DATABASE_URL="postgresql://user:password@localhost:5432/crm_milhas"
AUTH_SECRET="string-base64-gerada-com-openssl"
```

### Railway (Variables do serviço)
```
DATABASE_URL     → deve ser referência: ${{Postgres.DATABASE_URL}}
AUTH_SECRET      → gerado com: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NODE_VERSION     → 20
```

---

## Deploy Railway — Status Atual

**Comandos de deploy (`railway.toml`):**
```
prisma db push --accept-data-loss → sincroniza o schema sem exigir migrations
prisma db seed                    → sincroniza os programas de fidelidade
npm start                         → inicia o Next.js em produção
```

**Checklist:**
- [x] Código no GitHub
- [x] Projeto criado no Railway
- [x] PostgreSQL adicionado (Online)
- [x] AUTH_SECRET configurado
- [ ] NODE_VERSION=20 configurado (em andamento — build falhava com Node 18)
- [ ] Primeiro deploy bem-sucedido
- [ ] URL pública gerada

---

## Observações Importantes para o Codex/IA

1. **shadcn/ui neste projeto usa `@base-ui/react`** (não Radix UI tradicional). `DialogTrigger` não tem `asChild`. `Select.onValueChange` recebe `string | null`.

2. **`economia` não é coluna no banco** — é calculada na aplicação: `precoMercado - taxasPagas - feeCobrado`.

3. **`auth()` é do NextAuth v5** (não v4). A sessão tem `session.user.id` (configurado via callback JWT).

4. **Prisma 5** (não 7). O Prisma 7 tem breaking changes e não funciona com este schema.

5. **Build:** `prisma generate && next build`. TypeScript errors são ignorados no build (`ignoreBuildErrors: true`) — o código funciona, apenas tem alguns `implicit any` em lambdas.

6. **Seed é obrigatório** — sem rodar o seed, a tabela `programas` fica vazia e o sistema não funciona corretamente.

7. **Railway sem migrations:** este projeto ainda não tem arquivos em `prisma/migrations`. Enquanto isso for verdade, não use `prisma migrate deploy` no start command; use `prisma db push --accept-data-loss`.
