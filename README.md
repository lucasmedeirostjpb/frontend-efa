# 🎯 Eficiência em Ação — Frontend

Frontend Angular do sistema **Eficiência em Ação**, desenvolvido para gerenciar as metas do Prêmio CNJ de Qualidade. Integra-se com a **Polvo API** (Spring Boot) e utiliza **Keycloak** para autenticação e autorização baseada em roles.

---

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [Funcionalidades](#-funcionalidades)
- [Segurança e Controle de Acesso](#-segurança-e-controle-de-acesso)
- [Integração com a API](#-integração-com-a-api)
- [Proxy de Desenvolvimento](#-proxy-de-desenvolvimento)

---

## 🛠 Tecnologias

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Angular** | 19+ | Framework SPA (standalone components, 2025 style guide) |
| **TypeScript** | 5.x | Tipagem estática |
| **PrimeNG** | 21+ | Biblioteca de componentes UI |
| **SCSS** | - | Pré-processador CSS para estilos |
| **Keycloak JS** | latest | Autenticação SSO via OAuth2/OIDC |
| **keycloak-angular** | latest | Integração Keycloak + Angular |
| **RxJS** | 7.x | Programação reativa (Observables) |

---

## 🏗 Arquitetura

```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│                                                   │
│  ┌─────────┐   ┌───────────┐   ┌──────────────┐  │
│  │ Navbar  │   │ MetaList  │   │  MetaForm    │  │
│  │         │   │ (GET)     │   │(GET/POST/PUT)│  │
│  └────┬────┘   └─────┬─────┘   └──────┬───────┘  │
│       │              │                │           │
│       └──────────────┼────────────────┘           │
│                      ▼                            │
│              ┌──────────────┐                     │
│              │  MetaService │                     │
│              │  (HttpClient)│                     │
│              └──────┬───────┘                     │
│                     ▼                             │
│           ┌──────────────────┐                    │
│           │ Auth Interceptor │                    │
│           │ (Bearer Token)   │                    │
│           └────────┬─────────┘                    │
└────────────────────┼─────────────────────────────┘
                     ▼
        ┌────────────────────────┐
        │   Polvo API (8081)     │
        │   Spring Boot          │
        └────────────────────────┘
                     ▲
        ┌────────────────────────┐
        │   Keycloak (8080)      │
        │   OAuth2 / OIDC        │
        └────────────────────────┘
```

O frontend segue uma arquitetura em camadas:

1. **Camada de Modelo** — Interfaces TypeScript refletindo o contrato REST
2. **Camada de Serviço** — `MetaService` (HTTP) e `Auth` (Keycloak)
3. **Camada de Interceptação** — `authInterceptor` anexa JWT automaticamente
4. **Camada de Apresentação** — Componentes standalone (Navbar, MetaList, MetaForm)

---

## 📁 Estrutura de Pastas

```
src/
├── app/
│   ├── core/                   # Serviços core (Auth, Interceptors)
│   │   ├── services/
│   │   │   └── auth.ts
│   │   └── interceptors/
│   │       └── auth.interceptor.ts
│   ├── modules/                # Módulos e features da aplicação
│   │   └── meta/
│   │       ├── components/     # Componentes da feature (meta-list, meta-form)
│   │       ├── models/         # Interfaces e Tipos
│   │       └── services/       # Serviços locais da feature
│   ├── shared/                 # Blocos reutilizáveis genéricos
│   │   └── components/
│   │       └── navbar/
│   ├── app.ts                  # Componente raiz
│   ├── app.html                # Template raiz
│   ├── app.config.ts           # Providers (HttpClient, Router, Keycloak)
│   └── app.routes.ts           # Definição de rotas principais
├── environments/               # Configurações de dev/prod (API URL, Keycloak)
│   ├── environment.ts
│   └── environment.prod.ts
└── scss/                       # Estilos globais, temas PrimeNG e variáveis locais
    ├── _variables.scss
    └── styles.scss
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

Edite `src/app/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: '',  // vazio para usar o proxy em dev
  keycloak: {
    url: 'http://localhost:8080',      // URL do Keycloak
    realm: 'tjpb-polvo',              // Realm configurado
    clientId: 'polvo-app'             // Client ID do frontend
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

### Desenvolvimento (com proxy para evitar CORS)

```bash
ng serve --proxy-config proxy.conf.json
```

Acesse: **http://localhost:4200**

O proxy redireciona `/api/*` → `http://localhost:8081` automaticamente.

### Build de Produção

```bash
ng build
```

O output será gerado em `dist/efa-frontend/`.

---

## 🎯 Funcionalidades

### Listagem de Metas (`/metas`)

- **Acesso público** — não requer autenticação
- Exibe metas em grid de cards com:
  - Título e descrição
  - Data de criação formatada (`dd/MM/yyyy`)
  - Badge de status: `✓ Concluída` (verde) ou `◷ Pendente` (amarelo)
- Estados visuais: loading (spinner), erro (com retry), lista vazia
- Botão "Nova Meta" visível **apenas** para coordenadores

### Formulário de Meta (`/metas/nova` e `/metas/editar/:id`)

- **Modo criação**: formulário limpo, envia `POST /api/metas`
- **Modo edição**: busca dados frescos na API via `GET /api/metas/{id}` (Single Source of Truth), envia `PUT /api/metas/{id}`
  - Funciona em acesso direto pela URL (F5) — não depende de navegação interna
  - Redireciona para `/metas` se a meta não for encontrada (404)
- Campos:
  - **Título** — obrigatório, máx. 255 caracteres
  - **Descrição** — opcional, máx. 2000 caracteres
  - **Concluída** — toggle switch (booleano)
- Validação com mensagens de erro inline
- Botão de salvar **visível apenas** para coordenadores
- Redirecionamento automático para listagem após sucesso

### Barra de Navegação

- Logo "Eficiência em Ação" com link para a home
- Link de navegação para lista de metas
- Botão **Entrar** (login via Keycloak) / **Sair** (logout)
- Exibe nome do usuário e badge "Coordenador" quando autenticado

---

## 🔐 Segurança e Controle de Acesso

### Autenticação — Keycloak

O `AuthService` (`services/auth.ts`) encapsula o Keycloak JS adapter:

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

As ações de escrita (criar, editar, salvar) são protegidas no frontend:

```html
<!-- Só renderiza se o usuário tiver a role COORDENADOR -->
@if (auth.isCoordenador()) {
  <button class="btn btn-primary">Nova Meta</button>
}
```

> **Nota**: A proteção é feita tanto no frontend (ocultando botões) quanto no backend (validando roles no token JWT). O frontend não substitui a segurança do servidor.

### Interceptor HTTP

O `authInterceptor` (`interceptors/auth.interceptor.ts`) é um interceptor funcional que:

1. Verifica se o usuário está logado
2. Renova o token se necessário (`updateToken`)
3. Anexa o header `Authorization: Bearer <token>` na requisição

---

## 🔌 Integração com a API

### Modelo de Dados

```typescript
interface Meta {
  id: number;           // Gerado pelo banco
  titulo: string;       // Obrigatório
  descricao: string;    // Opcional
  concluida: boolean;   // Default: false
  data_criacao: string | Date;  // Gerenciado pelo banco
}
```

### Endpoints Consumidos

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| `GET` | `/api/metas` | Público | Lista todas as metas |
| `GET` | `/api/metas/{id}` | Público | Busca meta por ID (edição) |
| `POST` | `/api/metas` | COORDENADOR | Cria uma nova meta |
| `PUT` | `/api/metas/{id}` | COORDENADOR | Atualiza meta existente |

### MetaService

```typescript
listar(): Observable<Meta[]>                    // GET /api/metas
buscarPorId(id: number): Observable<Meta>       // GET /api/metas/{id}
criar(meta: Partial<Meta>): Observable<Meta>    // POST /api/metas
atualizar(id, meta): Observable<Meta>           // PUT /api/metas/{id}
```

---

## 🔀 Proxy de Desenvolvimento

O arquivo `proxy.conf.json` redireciona chamadas da API para o backend, evitando problemas de CORS durante o desenvolvimento:

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

**Uso**: `ng serve --proxy-config proxy.conf.json`

Em produção, configure o proxy reverso (Nginx, Apache) para rotear `/api` para o backend.

---

## 📄 Rotas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | (redirect) | Redireciona para `/metas` |
| `/metas` | MetaList | Listagem pública de metas |
| `/metas/nova` | MetaForm | Formulário de criação |
| `/metas/editar/:id` | MetaForm | Formulário de edição |

---

## 📝 Licença

Projeto interno — TJPB.
