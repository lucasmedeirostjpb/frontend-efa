# 🎯 Eficiência em Ação — Frontend

Frontend Angular do sistema **Eficiência em Ação (EFA)**, desenvolvido para gerenciar os requisitos do **Prêmio CNJ de Qualidade** (denominados "Metas" no código). Integra-se com a **Polvo API** (Spring Boot) e utiliza **Keycloak** para autenticação SSO com autorização baseada em roles (DIGOV, COORDENADOR e Delegados).

---

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [Funcionalidades](#-funcionalidades)
- [Modelo de Dados](#-modelo-de-dados)
- [Segurança e Controle de Acesso](#-segurança-e-controle-de-acesso)
- [Integração com a API](#-integração-com-a-api)
- [Paleta de Cores](#-paleta-de-cores)
- [Rotas](#-rotas)
- [Funcionamento Detalhado](#-funcionamento-detalhado)
- [Matriz de Features por Role](#-matriz-de-features-por-role)
- [Notas Técnicas](#-notas-técnicas)

---

## 🛠 Tecnologias

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Angular** | 21.1+ | Framework SPA (standalone components, signals-ready) |
| **TypeScript** | 5.9+ | Tipagem estática e type safety |
| **PrimeNG** | 21.1+ | Biblioteca de componentes UI (Dialog, Table, Select, FileUpload, InputNumber, DatePicker, Card, Tag, Tabs) |
| **PrimeFlex** | 4.x | Sistema de grid e utilitários CSS (formgrid, col-12, md:col-6) |
| **@primeuix/themes** | 2.0+ | Tema customizável para PrimeNG |
| **SCSS** | - | Pré-processador CSS com design tokens e variáveis |
| **Keycloak JS** | 26.2+ | Cliente JavaScript para autenticação SSO |
| **keycloak-angular** | 21.0+ | Integração Keycloak + Angular (guards, interceptors) |
| **RxJS** | 7.8+ | Programação reativa (Observables, Subjects) |
| **xlsx** | 0.18+ | Leitura e parsing de planilhas Excel/CSV para importação em lote |
| **Vitest** | 4.0+ | Framework de testes unitários (alternativa ao Jasmine/Karma) |

---

## 🏗 Arquitetura

```
┌──────────────────────────────────────────────────────┐
│                     Browser                           │
│                                                       │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │  Navbar   │  │ MetaList  │  │ MetaEstruturalModal│  │
│  │          │  │ (Cards)   │  │ (Edição/Readonly) │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│       │              │                  │             │
│       │    ┌─────────┴──────────────────┘             │
│       │    │     ┌───────────────────┐                │
│       │    │     │ MetaImportação    │                │
│       │    │     │ (Upload Excel)    │                │
│       │    │     └────────┬──────────┘                │
│       └────┼──────────────┤                           │
│            ▼              ▼                           │
│     ┌─────────────┐ ┌──────────────┐                  │
│     │ MetaService │ │ Eixo/Setor   │                  │
│     │ (HttpClient)│ │ Services     │                  │
│     └──────┬──────┘ └──────┬───────┘                  │
│            └───────┬───────┘                          │
│                    ▼                                  │
│          ┌──────────────────┐                         │
│          │ Auth Interceptor │                         │
│          │ (Bearer Token)   │                         │
│          └────────┬─────────┘                         │
└───────────────────┼───────────────────────────────────┘
                    ▼
       ┌─────────────────────────┐
       │   Polvo API (8081)      │
       │   Spring Boot + JaVers  │
       └─────────────────────────┘
                    ▲
       ┌─────────────────────────┐
       │   Keycloak (8080)       │
       │   OAuth2 / OIDC         │
       └─────────────────────────┘
```

O frontend segue uma arquitetura em camadas:

1. **Camada de Modelo** — Interfaces TypeScript refletindo o contrato REST (`Meta`, `Eixo`, `Setor`, `Page<T>`, `HistoricoAlteracao`)
2. **Camada de Serviço** — `MetaService` (CRUD + histórico), `EixoService`, `SetorService`, `Auth` (Keycloak)
3. **Camada de Interceptação** — `authInterceptor` anexa JWT automaticamente em todas as requisições
4. **Camada de Apresentação** — Componentes standalone (Navbar, MetaList, MetaEstruturalModal, MetaImportação)

---

## 📁 Estrutura de Pastas

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   └── auth.ts                    # Wrapper do Keycloak
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts        # Injeta Bearer Token
│   │   └── guards/
│   │       └── coordenador.guard.ts       # Guard de rota para COORDENADOR
│   │
│   ├── modules/
│   │   └── meta/
│   │       ├── components/
│   │       │   ├── meta-list/                      # Grid de cards + paginação
│   │       │   ├── meta-estrutural-modal/          # Modal de edição/visualização (3 abas)
│   │       │   ├── meta-importacao/                # Importação em lote (Excel/CSV)
│   │       │   └── gerenciar-delegacoes-modal/     # Gerenciamento de delegações de coordenador
│   │       ├── models/
│   │       │   ├── meta.model.ts                   # Interfaces (Meta, Page, Historico)
│   │       │   └── delegacao.model.ts              # Interface Delegacao
│   │       └── services/
│   │           ├── meta.ts                         # CRUD + histórico (JaVers)
│   │           ├── eixo.service.ts                 # GET eixos temáticos
│   │           ├── setor.service.ts                # GET setores responsáveis
│   │           ├── coordenador.service.ts          # GET coordenadores
│   │           └── delegacao.service.ts            # CRUD de delegações
│   │
│   ├── shared/
│   │   └── components/
│   │       └── navbar/                    # Barra de navegação global
│   │
│   ├── app.ts                             # Componente raiz
│   ├── app.html                           # Template raiz (<router-outlet>)
│   ├── app.scss                           # Estilos raiz
│   ├── app.config.ts                      # Providers (HttpClient, Router, Keycloak)
│   └── app.routes.ts                      # Rotas principais
│
├── environments/
│   ├── environment.ts                     # Config de desenvolvimento
│   └── environment.prod.ts               # Config de produção
│
└── scss/
    └── styles.scss                        # Estilos globais (reset, tipografia, scrollbar)
```

---

## ⚙ Configuração

### Pré-requisitos

- **Node.js** 18+ (testado com v24)
- **npm** 9+
- **Angular CLI** (`npm install -g @angular/cli`)
- **Keycloak** rodando (ex: `localhost:8080`)
- **Polvo API** rodando (ex: `localhost:8081`)

### Variáveis de Ambiente

Edite `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: '',  // vazio para usar o proxy em dev
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'tjpb-polvo',
    clientId: 'polvo-app'
  }
};
```

### Instalação

```bash
cd frontend/efa-frontend
npm install
```

---

## 🚀 Execução

### Desenvolvimento

```bash
npm start
```

Acesse: **http://localhost:4200**

O proxy redireciona `/api/*` → `http://localhost:8081` automaticamente.

### Build de Produção

```bash
npm run build:prod
```

Output gerado em `dist/efa-frontend/`.

> Em produção, configure o proxy reverso para rotear `/api` para o backend e preencha `src/environments/environment.prod.ts` com a URL pública do Keycloak.

---

## 🎯 Funcionalidades

### 📋 Listagem de Metas (`/metas`)

- Grid responsivo de cards (1-4 colunas conforme viewport)
- Cada card exibe:
  - **Setor** e **Eixo Temático** como badges
  - **Status** com badge colorido (Pendente, Em Andamento, Totalmente Cumprida, etc.)
  - **Título** da meta (truncado em 2 linhas)
  - **Referência do Artigo** (ex: Art. 5º)
  - **Pontos Aplicáveis** e métricas condicionais:
    - *Em Andamento* → Teto Estimado + Estimativa Real
    - *Cumprida/Não Cumprida* → Pontos Atingidos
  - **Prazo** (deadline formatado)
- **Paginação** com controles Anterior/Próximo
- Estados visuais: spinner de loading, container de erro com retry, lista vazia
- Hover effect com elevação e barra dourada de destaque
- Botão **"Nova Meta"** visível apenas para DIGOV
- Botões de ação no footer do card: **Visualizar**, **Editar**, **Excluir** (apenas DIGOV)

### 📝 Modal de Edição/Criação (3 Abas)

O modal abre como dialog PrimeNG e oferece três abas para diferentes contextos:

#### **Aba 1: Editar Preenchimento** (Acompanhamento)

Disponível para **COORDENADOR** (suas metas) e **Delegados** (metas delegadas):
- **Hero Card** com informações estruturais (título, descrição, artigo, eixo, setor, ciclo, prazo) — apenas leitura
- **Campos editáveis**:
  - Status (dropdown)
  - Execução e Resultados: Pontos Aplicáveis, Teto Estimado, Estimativa Real, Pontos Atingidos
  - Auditoria: Nível de Dificuldade, Evidências para Auditoria, Observações
- **Validação reativa dinâmica**:
  - Status de conclusão (Totalmente/Parcialmente Cumprida, Não Cumprida) → `evidenciasAuditoria` torna-se obrigatório com mínimo de 20 caracteres
  - Asterisco `*` vermelho dinâmico + hint informativo aparece/desaparece conforme o status
  - Pontos Atingidos auto-preenchidos conforme o status

#### **Aba 2: Editar Estrutura**

Disponível apenas para **DIGOV**:
- **Header gradiente** escuro com ícone e título contextual
- **Campos estruturais completos**:
  - Título (obrigatório) e Descrição
  - Classificação: Eixo Temático, Setor Responsável, Coordenador Responsável (dropdowns populados via API), Artigo
  - Status (dropdown completo)
  - Ciclo e Prazos: Ano do Ciclo (obrigatório), Deadline (datepicker)
  - Execução e Resultados: Todos os campos de pontuação e estimativas
  - Auditoria e Monitoramento: Nível de Dificuldade, Evidências, Observações

#### **Aba 3: Histórico** (JaVers Audit)

Disponível para todos os usuários autenticados:
- **Rastreamento de alterações** via JaVers backend
- Lista cronológica de mudanças com:
  - Autor da alteração
  - Data e hora
  - Tipo de mudança (CRIACAO, ATUALIZACAO, EXCLUSAO)
  - Campos alterados com valores anteriores e novos
- Campos técnicos automaticamente ocultados

#### Modo Visualização (Readonly)

- Dashboard visual com:
  - Título e status em badge estilizado
  - Info cards com Setor, Prazo, Pontos Aplicáveis
  - Seção condicional de Estimativas (Em Andamento)
  - Seção condicional de Resultados Oficiais (Cumprida/Não Cumprida)
  - Descrição opcional

### 📥 Importação em Lote (`/metas/importar`)

**Acesso**: Apenas DIGOV (protegido por `digovGuard`)

- **Upload Inteligente**: Suporte a arquivos Excel (.xlsx, .xls) e CSV
- **Mapeamento Dinâmico em 2 Etapas**:
  1. Upload do arquivo e extração de headers
  2. Interface visual para mapear colunas origem → campos do sistema
- **Auto-detecção de Colunas**: Matching fuzzy automático com nomes de campos
- **Sanitização de Dados**: 
  - Limpeza automática de símbolos monetários (R$) e espaços
  - Conversão inteligente de formatos de data (DD/MM/YYYY → ISO 8601)
  - Tratamento de campos inválidos (converte `-` ou vazios para null)
  - Normalização de valores numéricos (vírgula → ponto decimal)
- **Processamento em Lote**: Envio de todos os registros em uma única transação para a API (`POST /api/metas/batch`)
- **Auto-criação Estrutural**: Eixos e Setores são criados automaticamente no backend se identificados apenas pelo nome
- **Feedback Visual**: Toast de sucesso/erro e redirecionamento automático para listagem

### 👥 Gerenciamento de Delegações

**Acesso**: Apenas COORDENADOR

- **Ponto de Entrada**: Botão "Meus Assessores / Delegações" na navbar
- **Modal de Gerenciamento** (`GerenciarDelegacoesModal`):
  - **Listar delegações atuais**: Tabela com email e nome dos delegados
  - **Adicionar delegado**: 
    - Campos: Email (validado) e Nome
    - Validação completa: email format, max lengths, normalização
  - **Remover delegado**: Delete por ID com confirmação
- **Controle de Acesso por Delegação**:
  - Delegados aparecem em `meta.delegadosEmails[]`
  - Sistema verifica automaticamente se usuário logado pode editar via `Auth.podeEditarMeta()`
  - Delegados podem editar apenas a aba de **Preenchimento** (não Estrutura)

### 🧭 Navbar

- Logo **"Eficiência em Ação"** com link para home
- Links de navegação com indicador ativo (underline dourado)
- Barra dourada decorativa via gradiente
- **[Se COORDENADOR]** Botão: "Meus Assessores / Delegações"
- **Botão Entrar** (login Keycloak) / **Sair** (logout)
- Exibe nome de usuário + badge de role:
  - Badge dourado "DIGOV" para role DIGOV
  - Badge azul "Coordenador" para role COORDENADOR

---

## 📊 Modelo de Dados

```typescript
interface Meta {
  id: string;
  titulo: string;                    // Obrigatório
  descricao: string;
  data_criacao: string | Date;
  status: string;                    // Enum: PENDENTE, NAO_SE_APLICA, EM_ANDAMENTO, etc.
  eixoId: number;                    // FK → Eixo
  setorId: number;                   // FK → Setor
  coordenadorId?: number;            // FK → Coordenador
  eixoNome?: string;                 // Populado pelo backend
  setorNome?: string;                // Populado pelo backend
  coordenadorNome?: string;          // Populado pelo backend
  artigo: string;                    // Ex: "Art. 5º"
  anoCiclo: number;                  // Ex: 2025
  deadline: string | Date;
  pMaximo: number;                   // Pontos aplicáveis
  estimativaReal: number;
  tetoEstimado: number;
  pontosAtingidos: number;
  nivelDificuldade?: string;         // Enum: SEM_DIFICULDADES, EM_ALERTA, SITUACAO_CRITICA
  evidenciasAuditoria?: string;      // Obrigatório quando status = conclusão (min 20 chars)
  observacoes?: string;
  delegadosEmails?: string[];        // Lista de emails de delegados com acesso de edição
}

interface Delegacao {
  id: number;
  delegadoEmail: string;             // Email do assessor/delegado
  delegadoNome: string;              // Nome do assessor/delegado
}

interface HistoricoAlteracao {
  autor: string;                     // Username do usuário que fez a alteração
  dataHora: string | Date;           // Timestamp da alteração
  tipoMudanca: string;               // CRIACAO, ATUALIZACAO, EXCLUSAO
  camposAlterados: CampoAlterado[];  // Lista de campos modificados
}

interface CampoAlterado {
  nomeCampo: string;                 // Nome técnico do campo
  valorAnterior: any;                // Valor antes da alteração
  valorNovo: any;                    // Valor após a alteração
}
```

**Status possíveis**: `PENDENTE` | `NAO_SE_APLICA` | `EM_ANDAMENTO` | `PARCIALMENTE_CUMPRIDA` | `TOTALMENTE_CUMPRIDA` | `NAO_CUMPRIDA`

**Nível de Dificuldade**: `SEM_DIFICULDADES` | `EM_ALERTA` | `SITUACAO_CRITICA`

---

## 🔐 Segurança e Controle de Acesso

### Autenticação — Keycloak

O `Auth` service encapsula o Keycloak JS adapter:

| Método | Descrição |
|--------|-----------|
| `init()` | Inicializa Keycloak com `check-sso` silencioso |
| `login()` | Redireciona para tela de login do Keycloak |
| `logout()` | Encerra sessão e redireciona para a home |
| `isLoggedIn()` | Verifica se o usuário está autenticado |
| `getUsername()` | Retorna o `preferred_username` do token |
| `hasRole(role)` | Verifica roles no `resource_access` e `realm_access` |
| `isDigov()` | Atalho para `hasRole('DIGOV')` |
| `isCoordenador()` | Atalho para `hasRole('COORDENADOR')` |
| `getToken()` | Retorna o token JWT atual |
| `updateToken(s)` | Renova o token se expirar em `s` segundos |
| `podeEditarMeta(meta)` | Verifica se usuário pode editar a meta (ver abaixo) |

### Autorização — Roles e Delegação

O sistema implementa três níveis de controle de acesso:

#### **1. DIGOV** (Administrador)
- Acesso total a todas as funcionalidades
- Pode editar **Estrutura** e **Preenchimento** de qualquer meta
- Pode criar, deletar e importar metas
- Único role com acesso à importação em lote

#### **2. COORDENADOR** (Responsável por Metas)
- Pode editar apenas **Preenchimento** de suas próprias metas
- Campos estruturais (título, eixo, setor, etc.) ficam travados
- Pode gerenciar suas próprias delegações (adicionar/remover assessores)
- Acesso ao modal "Meus Assessores / Delegações"

#### **3. DELEGADO** (Assessor do Coordenador)
- Pode editar **Preenchimento** de metas delegadas a ele
- Verificado via `meta.delegadosEmails[]`
- Não pode gerenciar outras delegações
- Não tem acesso à importação ou exclusão

### Lógica de Permissão de Edição

```typescript
// Implementado em Auth.podeEditarMeta(meta: Meta): boolean
// Retorna true se:
// 1. Usuário é DIGOV (acesso total), OU
// 2. Usuário é COORDENADOR e é o responsável pela meta, OU
// 3. Email do usuário está em meta.delegadosEmails[] (é delegado)
```

### Proteção de Rotas (Guards)

Ações protegidas no frontend (ocultando UI) e no backend (validando token):

| Ação | DIGOV | COORDENADOR | Delegado | Público |
|------|-------|-------------|----------|---------|
| **Ver metas** | ✅ Todas | ✅ Próprias | ✅ Delegadas | ❌ |
| **Criar meta** | ✅ | ❌ | ❌ | ❌ |
| **Editar estrutura** | ✅ | ❌ | ❌ | ❌ |
| **Editar preenchimento** | ✅ | ✅ Próprias | ✅ Delegadas | ❌ |
| **Excluir meta** | ✅ | ❌ | ❌ | ❌ |
| **Importar metas** | ✅ | ❌ | ❌ | ❌ |
| **Ver histórico** | ✅ | ✅ | ✅ | ❌ |
| **Gerenciar delegações** | ❌ | ✅ Próprias | ❌ | ❌ |

### Guards Implementados

- **`digovGuard`**: Protege rota `/metas/importar` — apenas DIGOV
- **`coordenadorGuard`**: Disponível para uso futuro — verifica role COORDENADOR

### Interceptor HTTP

O `authInterceptor` é um interceptor funcional que automaticamente:
1. Verifica se o usuário está logado
2. Renova o token se necessário (validade mínima de 30s)
3. Anexa `Authorization: Bearer <token>` em toda requisição HTTP

---

## 🔌 Integração com a API

### Endpoints Consumidos

#### **Metas (Requisitos)**

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `GET` | `/api/metas/all` | Autenticado | Lista todas as metas (sem paginação) |
| `GET` | `/api/metas?page=X&size=Y` | Autenticado | Lista metas (paginado) |
| `GET` | `/api/metas/{id}` | Autenticado | Busca meta por ID |
| `GET` | `/api/metas/{id}/historico` | Autenticado | Histórico de alterações (JaVers) |
| `POST` | `/api/metas` | DIGOV | Cria nova meta |
| `POST` | `/api/metas/batch` | DIGOV | Cria metas em lote (Importação) |
| `PUT` | `/api/metas/{id}` | DIGOV | Atualiza meta (estrutura completa) |
| `PUT` | `/api/metas/{id}/acompanhamento` | COORDENADOR/Delegado | Atualiza apenas preenchimento/acompanhamento |
| `DELETE` | `/api/metas/{id}` | DIGOV | Exclui meta |

#### **Delegações**

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `GET` | `/api/coordenadores/me/delegacoes` | COORDENADOR | Lista delegações do coordenador logado |
| `POST` | `/api/coordenadores/me/delegacoes` | COORDENADOR | Adiciona novo delegado |
| `DELETE` | `/api/coordenadores/me/delegacoes/{id}` | COORDENADOR | Remove delegação por ID |

#### **Dados Auxiliares**

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `GET` | `/api/eixos` | Público | Lista eixos temáticos |
| `GET` | `/api/setores` | Público | Lista setores responsáveis |
| `GET` | `/api/coordenadores` | DIGOV | Lista coordenadores (para dropdowns) |

### Proxy de Desenvolvimento

```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Em produção, configure um proxy reverso (Nginx, Apache) para rotear `/api` para o backend.

---

## 🎨 Paleta de Cores

| Variável | Hex | Uso |
|----------|-----|-----|
| `$secondary-color` | `#00296b` | Fundos escuros premium, títulos |
| `$primary-color` | `#003f88` | Gradientes, focus rings, links |
| `$tertiary-color` | `#00509d` | Gradientes secundários, badges |
| `$accent-color` | `#fdc500` | Destaques dourados, ícones, barra decorativa |
| `$highlight-color` | `#ffd500` | Gradientes dourados, hover states |

### Design System

- **Tipografia**: Inter (Google Fonts) — pesos 300–900
- **Componentes UI**: PrimeNG com overrides SCSS customizados
- **Grid**: PrimeFlex (formgrid, col-12, md:col-6)
- **Inputs**: Focus ring azul (`0 0 0 3px rgba(#00509d, 0.12)`)
- **Backdrop**: Frosted glass (`backdrop-filter: blur(8px) saturate(1.2)`)
- **Animações**: Micro-interações em hover, fade-in para validações

---

## 📄 Rotas

| Rota | Componente | Guard | Descrição |
|------|------------|-------|-----------|
| `/` | (redirect) | — | Redireciona para `/metas` |
| `/metas` | MetaList | — | Grid de cards com paginação e agrupamento |
| `/metas/importar` | MetaImportação | digovGuard | Upload de planilhas Excel/CSV (apenas DIGOV) |

> **Nota**: Criação, edição e visualização de metas são feitas via modais (dialog PrimeNG), não por rotas. O gerenciamento de delegações também ocorre via modal acessível pela navbar.

---

## � Matriz de Features por Role

| Feature | Público | COORDENADOR | Delegado | DIGOV |
|---------|---------|-------------|----------|-------|
| **Autenticação** | Login obrigatório | ✅ | ✅ | ✅ |
| **Ver lista de requisitos** | ❌ | ✅ Próprios | ✅ Delegados | ✅ Todos |
| **Ver detalhes (readonly)** | ❌ | ✅ | ✅ | ✅ |
| **Ver histórico (JaVers)** | ❌ | ✅ | ✅ | ✅ |
| **Criar requisito** | ❌ | ❌ | ❌ | ✅ |
| **Editar estrutura** | ❌ | ❌ | ❌ | ✅ |
| **Editar preenchimento** | ❌ | ✅ Próprios | ✅ Delegados | ✅ Todos |
| **Deletar requisito** | ❌ | ❌ | ❌ | ✅ |
| **Importação em lote** | ❌ | ❌ | ❌ | ✅ |
| **Gerenciar delegações** | ❌ | ✅ Próprias | ❌ | ❌ |
| **Adicionar delegado** | ❌ | ✅ | ❌ | ❌ |
| **Remover delegado** | ❌ | ✅ | ❌ | ❌ |

## 🔧 Notas Técnicas

### Terminologia

- **Interface do Usuário**: Utiliza "Requisito" / "Requisitos"
- **Código/API**: Mantém nomenclatura técnica "Meta" / "Metas"
- **Rotas**: `/metas` (técnico)
- **Endpoints**: `/api/metas` (técnico)

### Separação Estrutura vs Preenchimento

O sistema separa edições em dois contextos:

1. **Estrutura** (DIGOV apenas):
   - Campos: título, descrição, art igo, eixo, setor, coordenador, ciclo, deadline, pontos aplicáveis
   - Endpoint: `PUT /api/metas/{id}`
   - Aba: "Editar Estrutura"

2. **Preenchimento** (COORDENADOR/Delegado):
   - Campos: status, estimativas, pontos atingidos, nível de dificuldade, evidências, observações
   - Endpoint: `PUT /api/metas/{id}/acompanhamento`
   - Aba: "Editar Preenchimento"

### JaVers Audit Trail

- Todas as alterações são rastreadas automaticamente pelo backend
- Frontend exibe histórico em aba dedicada no modal
- Campos técnicos (updatedat, id, etc.) são filtrados automaticamente
- Exibe: autor, timestamp, tipo de mudança, campos alterados com valores antes/depois

### Change Detection Strategy

- Componentes principais usam `ChangeDetectionStrategy.OnPush` para melhor performance
- Signals não está ativamente em uso (Angular 21+ ready)
- Detecção de mudanças é trigada por @Input/@Output e manualmente em observables

### Validação Dinâmica

O formulário de metas ajusta validações conforme o status:

- **Status EM_ANDAMENTO**: Requer `tetoEstimado` e `estimativaReal`
- **Status TOTALMENTE_CUMPRIDA**: `pontosAtingidos` = `pMaximo` (auto)
- **Status NAO_CUMPRIDA**: `pontosAtingidos` = 0 (auto)
- **Status conclusivo** (CUMPRIDA/PARCIAL/NAO_CUMPRIDA): Requer `evidenciasAuditoria` ≥ 20 caracteres

### Enriquecimento de Dados

O frontend mantém mapas locais para enriquecer dados quando necessário:

```typescript
// Mapeamento Eixos
1 → 'Produtividade'
2 → 'Celeridade'
3 → 'Inovação e Qualidade'
4 → 'Sustentabilidade'

// Mapeamento Setores
1 → 'Gabinete'
2 → 'Tecnologia da Informação'
3 → 'Gestão de Pessoas'
4 → 'Administrativo'
```

---

## �📝 Licença

Projeto interno — TJPB.
[// ------------------------------------------------------------]
# 🧩 Funcionamento Detalhado

## Fluxo Principal

1. **Login**: Usuário acessa o sistema e autentica via Keycloak (SSO). O botão "Entrar" aparece na navbar se não autenticado.

2. **Listagem de Requisitos**: Após login, a rota `/metas` exibe um grid de cards paginados, cada um representando um requisito (meta).

3. **Visualização/Edição**: 
   - Ao clicar em "Visualizar" ou "Editar", abre-se um modal (PrimeNG Dialog) com 3 abas:
     - **Editar Preenchimento**: Para COORDENADOR e Delegados (apenas suas metas)
     - **Editar Estrutura**: Para DIGOV (todas as metas)
     - **Histórico**: Para todos (rastreamento JaVers)

4. **Criação de Requisito**: DIGOV pode criar novos requisitos via botão "Nova Meta", abrindo o modal em modo de criação.

5. **Importação em Lote**: DIGOV acessa `/metas/importar` para importar requisitos via Excel/CSV, com mapeamento dinâmico de colunas.

6. **Gerenciamento de Delegações**: 
   - COORDENADOR clica em "Meus Assessores / Delegações" na navbar
   - Abre modal para adicionar/remover delegados
   - Delegados ganham acesso de edição de preenchimento nas metas do coordenador

7. **Permissões Dinâmicas**: 
   - Ações de criar, editar, excluir e importar são protegidas por roles (DIGOV, COORDENADOR)
   - Sistema verifica automaticamente se usuário é delegado ao avaliar permissões de edição
   - Validação no frontend (UI oculta) e backend (token JWT validado)

8. **Logout**: Usuário pode sair pelo botão "Sair", encerrando a sessão no Keycloak.

## Principais Componentes

- **Navbar**: Barra superior com logo, links, login/logout, nome e role do usuário, botão de delegações (COORDENADOR)

- **MetaList**: Grid de cards de metas com:
  - Paginação
  - Badges de status, setor e eixo
  - Botões de ação condicionais por role
  - Estados de loading/erro/vazio

- **MetaEstruturalModal**: Modal de edição/visualização com 3 abas:
  - **Aba Preenchimento**: Form com hero card (info estrutural) + campos de acompanhamento
  - **Aba Estrutura**: Form completo (apenas DIGOV)
  - **Aba Histórico**: Timeline de alterações (JaVers)

- **GerenciarDelegacoesModal**: Modal de gerenciamento de delegações:
  - Tabela de delegados atuais
  - Form para adicionar novo delegado (email + nome)
  - Ações de remover delegação

- **MetaImportacao**: Tela de upload de planilhas:
  - Etapa 1: Upload arquivo
  - Etapa 2: Mapeamento visual de colunas
  - Sanitização automática
  - Processamento em lote

- **Guards**: Protegem rotas por role (digovGuard)

- **Services**: Abstraem chamadas HTTP, autenticação e manipulação de dados

## Integração e Comunicação

- **API Polvo**: Todas as operações CRUD, histórico, importação e delegações são feitas via endpoints REST

- **Keycloak**: Autenticação OAuth2/OIDC, gestão de roles (DIGOV, COORDENADOR) e tokens JWT

- **Interceptor**: Anexa JWT automaticamente em todas as requisições, renova token quando necessário (validade mínima 30s)

- **Proxy**: Em desenvolvimento, `/api` é redirecionado automaticamente para o backend local via proxy.conf.json

## Animações e UX

- **Modal**: Animação customizada ao fechar (fade-out, slide-down), animação padrão ao abrir

- **Cards**: Elevação e barra dourada decorativa em hover

- **Inputs**: Focus ring azul com efeito de elevação, micro-interações suaves

- **Validação**: Feedback visual dinâmico, hints informativos e asteriscos vermelhos para campos obrigatórios

- **Tabs**: Navegação suave entre abas do modal com indicadores visuais

## Acessibilidade

- **WCAG AA**: Contraste adequado, gestão de foco, ARIA labels, navegação por teclado

- **AXE checks**: Todos os componentes passam em testes de acessibilidade automáticos

- **Responsividade**: Layout adaptável de 1 a 4 colunas conforme viewport

- **Feedback**: Modals com title e labels adequados, mensagens de erro claras

## Dicas de Uso

- Para importar requisitos, use planilhas com colunas nomeadas conforme o modelo de dados (ex: "Título", "Eixo", "Setor")

- Campos obrigatórios são marcados com asterisco vermelho (`*`) e possuem hints explicativos

- DIGOV tem acesso completo a funcionalidades administrativas; COORDENADOR gerencia apenas suas metas

- Delegados devem ser adicionados via email pelo coordenador e ganham acesso automático às metas delegadas

- Para customizar estilos, edite `scss/styles.scss` e tokens de design em `_variables.scss`

- Para alterar endpoints ou configuração do Keycloak, edite `environment.ts` e `environment.prod.ts`

## Troubleshooting

- **Login não funciona**: Verifique se o Keycloak está rodando e se a URL/realm/clientId em `environment.ts` estão corretos

- **Importação falha**: Revise o formato da planilha e certifique-se de que colunas obrigatórias (título, eixo, setor, deadline, pMaximo) estão preenchidas

- **Erros de build**: Cheque dependências no `package.json` e limites de bundle size em `angular.json`

- **Token expirado**: O interceptor deve renovar automaticamente; se não funcionar, faça logout/login manual

- **Delegação não funciona**: Verifique se o email do delegado foi adicionado corretamente e se o usuário está autenticado com esse email no Keycloak

---

Para dúvidas técnicas, consulte o código fonte e a documentação inline nos serviços e modelos.
