# 🎯 Eficiência em Ação — Frontend

Frontend Angular do sistema **Eficiência em Ação (EFA)**, desenvolvido para gerenciar as metas do **Prêmio CNJ de Qualidade**. Integra-se com a **Polvo API** (Spring Boot) e utiliza **Keycloak** para autenticação SSO com autorização baseada em roles.

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

---

## 🛠 Tecnologias

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Angular** | 19+ | Framework SPA (standalone components) |
| **TypeScript** | 5.x | Tipagem estática |
| **PrimeNG** | 21+ | Biblioteca de componentes UI (Dialog, Select, InputNumber, DatePicker, Card, Tag) |
| **PrimeFlex** | 4.x | Sistema de grid e utilitários CSS (formgrid, col-12, md:col-6) |
| **SCSS** | - | Pré-processador CSS com design tokens |
| **Keycloak JS** | latest | Autenticação SSO via OAuth2/OIDC |
| **keycloak-angular** | latest | Integração Keycloak + Angular |
| **RxJS** | 7.x | Programação reativa (Observables) |
| **xlsx** | latest | Leitura de planilhas Excel/CSV para importação em lote |

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
│   │       │   ├── meta-list/             # Grid de cards + paginação
│   │       │   ├── meta-estrutural-modal/  # Modal de edição/visualização
│   │       │   └── meta-importacao/        # Importação em lote (Excel/CSV)
│   │       ├── models/
│   │       │   └── meta.model.ts          # Interfaces (Meta, Page, Eixo, Setor, Historico)
│   │       └── services/
│   │           ├── meta.ts                # CRUD + histórico (JaVers)
│   │           ├── eixo.service.ts        # GET eixos temáticos
│   │           └── setor.service.ts       # GET setores responsáveis
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
ng serve --proxy-config proxy.conf.json
```

Acesse: **http://localhost:4200**

O proxy redireciona `/api/*` → `http://localhost:8081` automaticamente.

### Build de Produção

```bash
ng build
```

Output gerado em `dist/efa-frontend/`.

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
- Botão **"Nova Meta"** visível apenas para coordenadores
- Botões de ação no footer do card: **Visualizar**, **Editar**, **Excluir** (apenas coordenadores)

### 📝 Modal de Edição/Criação

O modal abre como dialog PrimeNG e oferece dois modos:

#### Modo Formulário (Edição/Criação)

- **Header gradiente** escuro com ícone e título contextual
- **Campos organizados em seções**:
  - **Título** (obrigatório) e **Descrição**
  - **Classificação Estrutural**: Eixo Temático, Setor Responsável (dropdowns populados via API), Artigo
  - **Status** (dropdown): Pendente, Não se Aplica, Em Andamento, Parcialmente Cumprida, Totalmente Cumprida, Não Cumprida
  - **Ciclo e Prazos**: Ano do Ciclo (obrigatório), Deadline (datepicker)
  - **Execução e Resultados** (visível apenas quando status ≠ Pendente/NA): Pontos Aplicáveis, Teto Estimado, Estimativa Real, Pontos Atingidos
  - **Auditoria e Monitoramento**: Nível de Dificuldade (dropdown: Sem dificuldades, Em alerta, Situação crítica), Evidências para Auditoria (textarea), Observações (textarea)
- **Validação reativa dinâmica**:
  - Status de conclusão (Totalmente/Parcialmente Cumprida, Não Cumprida) → `evidenciasAuditoria` torna-se obrigatório com mínimo de 20 caracteres
  - Asterisco `*` vermelho dinâmico + hint informativo aparece/desaparece conforme o status
  - Pontos Atingidos auto-preenchidos conforme o status
- **Permissões por Role (Coordenador)**:
  - Ao editar, campos administrativos (Título, Descrição, Artigo, Eixo, Setor, Ciclo, Prazo, Pontos Aplicáveis) ficam travados
  - Informações exibidas em **hero card** azul com chips e badge dourado de pontos
  - Coordenador pode alterar: Status, campos de Execução e Auditoria

#### Modo Visualização (Readonly)

- Dashboard visual com:
  - Título e status em badge estilizado
  - Info cards com Setor, Prazo, Pontos Aplicáveis
  - Seção condicional de Estimativas (Em Andamento)
  - Seção condicional de Resultados Oficiais (Cumprida/Não Cumprida)
  - Descrição opcional

### 📥 Importação em Lote (`/metas/importar`)

- Upload de arquivo **Excel (.xlsx, .xls) ou CSV**
- Leitura client-side com biblioteca `xlsx`
- Extração dinâmica das colunas do arquivo
- Mapeamento manual de colunas → campos da Meta
- Envio em lote para a API

### 🧭 Navbar

- Logo **"Eficiência em Ação"** com link para home
- Links de navegação com indicador ativo (underline dourado)
- Barra dourada decorativa via gradiente
- Botão **Entrar** (login Keycloak) / **Sair** (logout)
- Exibe nome de usuário + badge de role (ex: "COORDENADOR" em dourado)

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
  eixoNome?: string;                 // Populado pelo backend
  setorNome?: string;                // Populado pelo backend
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
| `isCoordenador()` | Atalho para `hasRole('COORDENADOR')` |
| `getToken()` | Retorna o token JWT atual |
| `updateToken(s)` | Renova o token se expirar em `s` segundos |

### Autorização — Role COORDENADOR

Ações protegidas no frontend (ocultando UI) e no backend (validando token):

- **Criar meta** — botão "Nova Meta" visível apenas para coordenadores
- **Editar meta** — botão "Editar" visível apenas para coordenadores
- **Excluir meta** — botão "Excluir" visível apenas para coordenadores
- **Importar metas** — rota protegida por `coordenadorGuard`
- **Campos restritos** — Coordenador não pode editar campos administrativos ao editar

### Interceptor HTTP

O `authInterceptor` é um interceptor funcional que automaticamente:
1. Verifica se o usuário está logado
2. Renova o token se necessário
3. Anexa `Authorization: Bearer <token>` em toda requisição

---

## 🔌 Integração com a API

### Endpoints Consumidos

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `GET` | `/api/metas?page=X&size=Y` | Público | Lista metas (paginado) |
| `GET` | `/api/metas/{id}` | Público | Busca meta por ID |
| `GET` | `/api/metas/{id}/historico` | Público | Histórico de alterações (JaVers) |
| `POST` | `/api/metas` | COORDENADOR | Cria nova meta |
| `PUT` | `/api/metas/{id}` | COORDENADOR | Atualiza meta existente |
| `DELETE` | `/api/metas/{id}` | COORDENADOR | Exclui meta |
| `GET` | `/api/eixos` | Público | Lista eixos temáticos |
| `GET` | `/api/setores` | Público | Lista setores |

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
| `/metas` | MetaList | — | Grid de cards com paginação |
| `/metas/importar` | MetaImportação | coordenadorGuard | Upload de planilhas Excel/CSV |

> **Nota**: Criação e edição de metas são feitas via modal (dialog PrimeNG), não por rotas.

---

## 📝 Licença

Projeto interno — TJPB.
