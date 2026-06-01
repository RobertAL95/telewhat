# 🟢 Flym Messenger - Web Client (Frontend)

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)
![MUI](https://img.shields.io/badge/Material--UI-v5-007FFF?style=for-the-badge&logo=mui)
![WebSockets](https://img.shields.io/badge/WebSockets-Native-orange?style=for-the-badge)

### 🌍 Languages / Idiomas / Idiomas
* [🇬🇧 English](#-english)
* [🇪🇸 Español](#-español)
* [🇧🇷 Português](#-português)

---

## 🇬🇧 ENGLISH

Flym Messenger is a high-performance, real-time instant messaging web client. Inspired by the efficiency of systems like WhatsApp Web and Telegram, this frontend is engineered to handle persistent connections, optimistic UI updates, and maximum cryptographic security.

### 🏗️ General Architecture & Design Patterns

The project utilizes **Next.js 15 (App Router)** to leverage modern routing and hybrid rendering. However, since it is a highly interactive application (a disguised Single Page Application), the heavy lifting is done on the client side (`'use client'`), delegating state management to a highly decoupled ecosystem of native **React Contexts**.

#### 1. Provider & Context Segregation Pattern
To prevent unnecessary re-renders and strictly follow the Single Responsibility Principle (SRP), the global state is not monolithic. It is divided into three primary providers:
* **`AuthProvider`:** Exclusively manages user identity and session lifecycle (Tokens and background refreshes).
* **`SocketContext`:** Holds the WebSocket instance (Singleton pattern) and exposes the unified transmission API.
* **`GlobalContext`:** Acts as the business domain engine (Chats, Messages, Notifications).

#### 2. Reducer Pattern (Flux-like)
Inside the `GlobalContext`, we use `useReducer` instead of multiple `useState` hooks. This allows for predictable handling of complex state transitions:
* **`ADD_MESSAGE` Action:** Injects a message into the UI optimistically (before the server acknowledges it), improving the user's perceived latency to 0ms.
* **`SET_MESSAGES` Action:** Synchronizes the historical chat buffer downloaded from MongoDB upon entering a chat room.

#### 3. Interceptor Pattern (Network Decorator)
Implemented in `libs/apiClient.ts`. Since system security relies on `HttpOnly` cookies rather than `localStorage` (to mitigate XSS attacks prior to E2EE implementation), we built a wrapper around the native Fetch API.
* **Workflow:** If a request triggers a `401 Unauthorized`, the interceptor pauses the original request, makes a silent background call to `/auth/refresh`, waits for the new cookie injection, and retries the original request without disrupting the user experience.

### 📂 Main Directory Structure

The project skips the traditional `src/` directory to adopt a flat and clean root-level structure, fully embracing Next.js 15 App Router standards:

```text
/ (Project Root)
├── app/                  # Next.js App Router (Routes, Layouts, and Pages: /chat, /Auth)
├── components/           # UI Components (ChatWindow, Sidebar, MessageBubble)
├── context/              # State managers via React Context (Auth, Global, Socket)
├── libs/                 # Core utilities (apiClient interceptor, Auth functions)
└── utils/                # Secondary helpers and reusable logic (deviceDetector)
⚙️ Key Technical Implementations
Optimistic UI & Duplicate Control: When a user sends a message, ChatWindow instantly injects the chat bubble by generating a temporary ID (_id: Date.now()). When the WebSocket server broadcasts the real message saved in MongoDB, the GlobalContext dynamically evaluates if the sender matches to prevent rendering the same message twice (Ghosting).

Security & Identity: * Zero LocalStorage: The frontend is blind to access tokens. Requests use credentials: 'include' so the browser securely attaches HTTP-only cookies.

Persistent Friend ID: The backend injects a short, unique identifier per user. The frontend hydrates this identity on initial render to link the user with the server's global Redis Pub/Sub channel.

🇪🇸 ESPAÑOL
Flym Messenger es un cliente web de mensajería instantánea en tiempo real de alto rendimiento. Inspirado en la eficiencia de WhatsApp Web y Telegram, este frontend está diseñado para manejar conexiones persistentes, actualizaciones de UI optimistas y máxima seguridad criptográfica.

🏗️ Arquitectura General y Patrones de Diseño
El proyecto utiliza Next.js 15 (App Router) para aprovechar el enrutamiento moderno y el renderizado híbrido. Sin embargo, dado que es una aplicación altamente interactiva (Single Page Application encubierta), el peso de la lógica recae fuertemente en el cliente ('use client'), delegando el manejo de estado a un ecosistema altamente desacoplado de React Contexts.

1. Patrón Provider & Context Segregation
Para evitar renderizados innecesarios y mantener el principio de responsabilidad única (SRP), el estado global no es monolítico. Está dividido en tres proveedores principales:

AuthProvider: Maneja exclusivamente la identidad del usuario y el ciclo de vida de la sesión (Tokens y Refrescos).

SocketContext: Mantiene la instancia del WebSocket (Patrón Singleton) y expone la API de transmisión.

GlobalContext: Actúa como el motor del dominio del negocio (Chats, Mensajes, Notificaciones).

2. Patrón Reducer (Estilo Flux)
En el GlobalContext, utilizamos useReducer en lugar de múltiples useState. Esto permite manejar transiciones de estado complejas de forma predecible:

Acción ADD_MESSAGE: Inyecta un mensaje en la interfaz de forma optimista (antes de que el servidor responda), mejorando la percepción de latencia del usuario a 0ms.

Acción SET_MESSAGES: Sincroniza el historial descargado de MongoDB al entrar a una sala.

3. Patrón Interceptor (Decorador de red)
Implementado en libs/apiClient.ts. Dado que la seguridad del sistema se basa en cookies HttpOnly y no en localStorage (para mitigar ataques XSS previo a la implementación de E2EE), creamos un "wrapper" sobre la API Fetch nativa.

Flujo: Si una petición lanza un 401 Unauthorized, el interceptor pausa la petición original, hace un llamado silencioso a /auth/refresh, espera la inyección de la nueva cookie, y reintenta la petición original sin que la UI se entere.

📂 Estructura de Directorios Principal
El proyecto omite el directorio src/ tradicional para adoptar una estructura plana y limpia en la raíz, aprovechando al máximo los estándares de Next.js 15 con el App Router:

Plaintext
/ (Raíz del proyecto)
├── app/                  # Next.js App Router (Rutas, Layouts y Páginas: /chat, /Auth)
├── components/           # Componentes UI (ChatWindow, Sidebar, MessageBubble)
├── context/              # Gestores de estado mediante React Context (Auth, Global, Socket)
├── libs/                 # Utilidades core (Interceptor apiClient, funciones de Auth)
└── utils/                # Helpers secundarios y lógica reutilizable (deviceDetector)
⚙️ Implementaciones Técnicas Destacadas
UI Optimista y Control de Duplicados: Cuando un usuario envía un mensaje, el ChatWindow inyecta instantáneamente la burbuja de chat generándole un ID temporal (_id: Date.now()). Cuando el servidor de WebSockets hace el broadcast del mensaje real guardado en MongoDB, el GlobalContext evalúa dinámicamente si el emisor coincide para evitar pintar el mismo mensaje dos veces (Ghosting).

Autenticación y Seguridad:

Cero LocalStorage: El frontend es ciego a los tokens de acceso. Las solicitudes usan credentials: 'include' para que el navegador adjunte las cookies seguras.

Friend ID (Identidad Persistente): El backend inyecta un identificador corto y único por usuario. El frontend hidrata esta identidad en el renderizado inicial para enlazar al usuario con el canal global de Redis del servidor.

🇧🇷 PORTUGUÊS
Flym Messenger é um cliente web de mensagens instantâneas em tempo real de alto desempenho. Inspirado na eficiência de sistemas como WhatsApp Web e Telegram, este frontend foi projetado para lidar com conexões persistentes, atualizações otimistas de UI e máxima segurança criptográfica.

🏗️ Arquitetura Geral e Padrões de Projeto
O projeto utiliza Next.js 15 (App Router) para alavancar o roteamento moderno e a renderização híbrida. No entanto, por ser uma aplicação altamente interativa (uma Single Page Application disfarçada), a maior parte da lógica é executada no cliente ('use client'), delegando o gerenciamento de estado a um ecossistema altamente desacoplado de React Contexts.

1. Padrão Provider & Context Segregation
Para evitar re-renderizações desnecessárias e manter o Princípio de Responsabilidade Única (SRP), o estado global não é monolítico. Ele é dividido em três provedores principais:

AuthProvider: Gerencia exclusivamente a identidade do usuário e o ciclo de vida da sessão (Tokens e atualizações em segundo plano).

SocketContext: Mantém a instância do WebSocket (Padrão Singleton) e expõe a API unificada de transmissão.

GlobalContext: Atua como o motor de domínio de negócios (Chats, Mensagens, Notificações).

2. Padrão Reducer (Estilo Flux)
No GlobalContext, utilizamos useReducer em vez de múltiplos useState. Isso permite gerenciar transições complexas de estado de forma previsível:

Ação ADD_MESSAGE: Injeta uma mensagem na interface de forma otimista (antes do servidor confirmar), melhorando a latência percebida pelo usuário para 0ms.

Ação SET_MESSAGES: Sincroniza o histórico baixado do MongoDB ao entrar em uma sala de bate-papo.

3. Padrão Interceptor (Decorador de Rede)
Implementado em libs/apiClient.ts. Como a segurança do sistema depende de cookies HttpOnly em vez de localStorage (para mitigar ataques XSS antes da implementação do E2EE), criamos um "wrapper" para a API Fetch nativa.

Fluxo: Se uma requisição retornar 401 Unauthorized, o interceptor pausa a requisição original, faz uma chamada silenciosa para /auth/refresh, aguarda a injeção do novo cookie e tenta novamente a requisição original sem interromper a interface do usuário.

📂 Estrutura de Diretórios Principal
O projeto pula o diretório tradicional src/ para adotar uma estrutura plana e limpa na raiz, aproveitando ao máximo os padrões do Next.js 15 com o App Router:

Plaintext
/ (Raiz do Projeto)
├── app/                  # Next.js App Router (Rotas, Layouts e Páginas: /chat, /Auth)
├── components/           # Componentes UI (ChatWindow, Sidebar, MessageBubble)
├── context/              # Gerenciadores de estado via React Context (Auth, Global, Socket)
├── libs/                 # Utilitários core (Interceptor apiClient, funções de Auth)
└── utils/                # Helpers secundários e lógica reutilizável (deviceDetector)
⚙️ Principais Implementações Técnicas
UI Otimista e Controle de Duplicatas: Quando um usuário envia uma mensagem, o ChatWindow injeta instantaneamente a bolha de chat gerando um ID temporário (_id: Date.now()). Quando o servidor WebSocket transmite a mensagem real salva no MongoDB, o GlobalContext avalia dinamicamente se o remetente coincide para evitar renderizar a mesma mensagem duas vezes (Ghosting).

Segurança e Identidade:

Zero LocalStorage: O frontend é cego aos tokens de acesso. As requisições usam credentials: 'include' para que o navegador anexe os cookies de forma segura.

Friend ID (Identidade Persistente): O backend injeta um identificador curto e único por usuário. O frontend hidrata essa identidade na renderização inicial para vincular o usuário ao canal global Pub/Sub do Redis no servidor.
 assíncrono para a nuvem (Cloudinary) após criptografia local.

Presença em Tempo Real Avançada: Indicadores de "Digitando..." e recibos de leitura (Ticks azuis) controlados por eventos efêmeros de WebSockets.
