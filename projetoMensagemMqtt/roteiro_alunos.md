# Roteiro do aluno — passo a passo (Copilot Agent Mode)

## Antes de tudo: como o Copilot vai trabalhar nesta prática

Nesta prática você **não vai copiar código nem criar arquivos na mão**. Você vai
usar o **Agent Mode** do GitHub Copilot. Nesse modo, o Copilot:

- **Cria e edita os arquivos sozinho** — você vê o que ele propôs (um diff) e
  clica em **Keep** (manter) para aceitar.
- **Roda comandos no terminal sozinho** (instalar dependências, verificar erros)
  — você vê o comando e clica em **Continue / Allow** para autorizar.
- **Lê os erros e se corrige** quando você pede.

Seu papel é **orientar e aprovar**: ativar o agente certo, apontar os documentos
e revisar o que ele faz. Pense em você como o revisor humano do time.

> **Importante:** sempre confira o diff antes de clicar em Keep, e leia o comando
> antes de clicar em Continue. Aprovar sem ler é o jeito mais fácil de deixar
> passar um erro.

---

## Os dois lugares onde você trabalha

> **TERMINAL** — linha de comando dentro do VS Code (quando precisar você mesmo digitar algo)
> **CHAT** — painel do Copilot Chat, onde você conversa com os agentes

Na maior parte do tempo você fica no **CHAT**. O Copilot é quem usa o terminal.

---

## O que você vai construir

O app **MensagemMQTT**: um mensageiro com **várias conversas**. Cada conversa é
uma "sala" (um tópico MQTT). Você cria conversas, envia e recebe mensagens em
tempo real, e o histórico fica salvo no celular (SQLite). Duas pessoas na mesma
conversa conversam de verdade.

Tecnologias: **React Native + Expo** (mobile), **SQLite** (dados locais) e
**MQTT** (mensagens em tempo real, sem servidor próprio).

---

## O que vem no projeto e o que você vai gerar

O material do projeto está em um arquivo **`.zip` disponível no Portal UNIPAM**.
Você vai baixá-lo, descompactar e **arrastar os arquivos para dentro do seu
Codespace** (Etapa 1). O código do app é o que **você vai gerar** com o Copilot
durante a prática.

**Vem no `.zip` (não mexa, só consulte):**
- `docs/` — as especificações que os agentes vão seguir.
- `prompts/` — as personas dos agentes.
- `.github/` — instruções automáticas do Copilot (`copilot-instructions.md`).
- `.devcontainer/` — configuração do ambiente do Codespace.
- `README.md`, `CLAUDE.md`, `roteiro_alunos.md`, `roteiro_alunos_v1.1.md`.

> **⚠️ As pastas `.github` e `.devcontainer` começam com ponto — são ocultas.** Ao
> descompactar e arrastar, confirme que elas foram junto (pode ser preciso ativar
> "mostrar arquivos ocultos" no seu sistema). Sem elas o projeto ainda funciona,
> mas você perde o piloto automático do Copilot (`.github`) e a configuração de
> ambiente (`.devcontainer`).

**Você vai gerar (e enviar no final, na Etapa 8):**
- `src/`, `App.tsx`, `package.json`, `tsconfig.json` e demais arquivos do Expo.
- O `docs/08_log_de_evolucao.md` atualizado pelo Agente Documentador.

> Você não comita `node_modules/`: o projeto Expo já cria um `.gitignore` que
> ignora essa pasta automaticamente.

---

## Visão geral das etapas

| Etapa | Nome | Quem faz |
|---|---|---|
| 1 | Abrir o Codespace e trazer os arquivos do projeto | Você (navegador + Portal UNIPAM) |
| 2 | Criar o projeto Expo | Copilot (Agent Mode) |
| 3 | Gerar o back-end (dados + mensageria) | Agente Back-end |
| 4 | Gerar o front-end (telas) | Agente Front-end |
| 5 | Validar com QA | Agente QA |
| 6 | Registrar no log | Agente Documentador |
| 7 | Rodar no celular (build EAS) | Você + Copilot |
| 8 | Fazer commit | Você + Copilot |

---

## Etapa 1 — Abrir o Codespace e trazer os arquivos do projeto

> **Onde:** navegador (GitHub) + Portal UNIPAM

**1.1 — Crie/abra o seu Codespace** como você já faz nas outras práticas. Aguarde
o VS Code abrir no navegador e a barra de status azul aparecer embaixo.

**1.2 — Baixe o projeto no Portal UNIPAM:** baixe o arquivo
`projetoMensagemMqtt.zip` e **descompacte** no seu computador.

**1.3 — Arraste os arquivos para o Codespace:** selecione **todo o conteúdo** da
pasta descompactada — **incluindo as pastas ocultas `.github` e `.devcontainer`** —
e arraste para dentro do explorador de arquivos do VS Code, na raiz do Codespace.
Confirme o upload se o VS Code pedir.

> **Pastas ocultas:** se o seu sistema esconde arquivos que começam com ponto,
> ative "mostrar arquivos ocultos" **antes** de arrastar — senão `.github` e
> `.devcontainer` ficam de fora. Depois, confira no explorador do VS Code se as
> duas aparecem.

> **Checkpoint:** você vê `docs/`, `prompts/`, `.github/` e `.devcontainer/` no
> explorador do Codespace? Sim → próxima etapa.

---

## Etapa 2 — Criar o projeto Expo (o Copilot faz)

> **Onde:** CHAT

Aqui você já usa o Agent Mode para o Copilot montar a base do projeto.

**2.1 — Abra o Copilot Chat** (ícone 💬 na barra lateral) e **selecione o modo
`Agent`** no seletor de modo no topo do painel do chat.

> **Node 20+ (confira antes):** rode `node -v` no terminal. Precisa ser **20 ou
> superior** — o `create-expo-app` falha no Node 18 com `ReferenceError: File is
> not defined`. Se aparecer `v18`, rode `nvm install 20 && nvm use 20` e siga.
> *(O `.devcontainer` fixa o Node 20, mas só vale se o Codespace for criado/recriado
> com ele presente. Como aqui você trouxe os arquivos para um Codespace já em
> operação, o caminho direto é o `nvm` — a menos que use "Rebuild Container".)*

**2.2 — Envie esta mensagem:**
```
Você está em Agent Mode neste Codespace. Crie a base de um projeto Expo com
TypeScript NESTA pasta (sem criar subpasta), preservando os arquivos docs/ e
prompts/ que já existem. Em seguida instale as dependências do projeto.

Rode os comandos no terminal você mesmo, nesta ordem:
1. npx create-expo-app@latest . --template blank-typescript
   (se perguntar se continua com a pasta não-vazia, responda que sim)
2. npm install expo@~54.0.0
3. npx expo install --fix
4. npx expo install expo-sqlite expo-crypto
5. npm install mqtt buffer
6. npx expo install react-native-web react-dom @expo/metro-runtime
7. npx expo install jest-expo
8. npm install --save-dev @testing-library/react-native react-test-renderer@19.1.0
9. Crie o arquivo metro.config.js na raiz do projeto com EXATAMENTE o conteúdo do
   quadro que vou colar a seguir (necessário para o expo-sqlite funcionar na web).

Os passos 2 e 3 fixam o projeto na Expo SDK 54 (o create-expo-app vem na SDK
mais nova; nós voltamos para a 54). O passo 6 habilita o preview no navegador
(tecla "w" na Etapa 4). Os passos 7 e 8 instalam o ferramental de teste correto
para React Native (use `@testing-library/react-native`, NUNCA `@testing-library/react`,
que é do React web e exige react@18). Use sempre `npx expo install` (nunca fixe
versão na mão) para o Expo escolher a versão compatível com a SDK. Ao final,
confirme que App.tsx, package.json, tsconfig.json e metro.config.js existem e que
o package.json mostra "expo": "~54.0.0".
```

**Conteúdo do `metro.config.js`** (cole logo abaixo da mensagem, no mesmo envio):
````
metro.config.js:
```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite na web usa WebAssembly (wa-sqlite): habilita .wasm como asset.
config.resolver.assetExts.push('wasm');

// Headers exigidos pelo SharedArrayBuffer (usado pelo wa-sqlite na web).
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
```
````

> **Por que SDK 54?** É a versão estável adotada no projeto. Sem os passos 2 e 3,
> o app seria criado na SDK mais recente, que pode divergir da que a turma usa.
> *Validado em teste de fumaça: SDK 54 (react-native 0.81, expo-sqlite 16,
> expo-crypto 15, mqtt 5.15) — `tsc` limpo, e `metro.config.js` validado com
> `expo export -p web` empacotando o `wa-sqlite.wasm`.*

> **Por que o `metro.config.js`?** Na web, o `expo-sqlite` não usa SQLite nativo —
> usa uma versão em WebAssembly (`wa-sqlite`). O Metro só empacota o `.wasm` e
> serve os headers que ele exige com esse arquivo de configuração. Sem ele, o
> bundle da web falha em `Unable to resolve ... wa-sqlite.wasm`.

**2.3 — Conforme o Copilot trabalha:** cada vez que ele pedir para rodar um
comando, leia e clique em **Continue / Allow**. Ele vai executar tudo e mostrar a
saída.

> **Checkpoint:** o Copilot confirmou que `App.tsx` e `package.json` existem e que
> as dependências foram instaladas? Sim → próxima etapa.

---

## Etapa 3 — Gerar o back-end (dados + mensageria)

> **Onde:** CHAT

Agora você ativa o **Agente Back-end**. Ele vai criar os arquivos de tipos, banco,
repositórios e o serviço MQTT — tudo direto no workspace.

**3.1 — Abra um chat novo** (botão **+**) e renomeie para
`Agente Back-end — Dados e Mensageria`. Confirme que o modo está em **Agent**.

**3.2 — Cole o conteúdo de `prompts/agente_backend.md`** como primeira mensagem.
(Dica: você pode também escrever `#file:prompts/agente_backend.md` para o Copilot
ler o arquivo.)

**3.3 — Na mesma mensagem, anexe os documentos de contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/03_modelagem_banco_e_dados.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_dados_e_mensageria.md
```

**3.4 — Na mesma mensagem, dê a tarefa:**
```
Você está em Agent Mode. Crie os arquivos diretamente no workspace seguindo
estritamente os contratos do docs/04. Implemente nesta ordem:

1. src/polyfills.ts, src/config.ts, src/types/index.ts
2. src/database/database.ts
3. src/repositories/settingsRepository.ts, conversationRepository.ts, messageRepository.ts
4. src/services/mqttService.ts
5. Os testes das seções 5.1 e 5.2 do docs/05.

Ao final, rode `npx tsc --noEmit` e corrija o que aparecer sem alterar o docs/04.
Se encontrar ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**3.5 — Conforme o Copilot avança:**
- Cada arquivo proposto aparece como diff → confira e clique **Keep**.
- Cada comando aparece no terminal → leia e clique **Continue**.
- Quando ele rodar `npx tsc --noEmit`, deixe ele corrigir sozinho os erros.

> **Checkpoint da Etapa 3:**
> - [ ] Arquivos criados em `src/types`, `src/database`, `src/repositories`, `src/services`
> - [ ] `npx tsc --noEmit` terminou sem erro
> - [ ] Testes criados

---

## Etapa 4 — Gerar o front-end (telas)

> **Onde:** CHAT

**4.1 — Chat novo** (botão **+**), renomeado para
`Agente Front-end — Conversas e Chat`. Modo **Agent**.

> **Por que um chat novo?** Cada agente tem um papel só. Começar limpo gasta menos
> tokens e o Copilot fica mais preciso.

**4.2 — Cole `prompts/agente_frontend.md`** como primeira mensagem.

**4.3 — Anexe o contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/06_desenvolvimento_frontend_conversas_e_chat.md
```

**4.4 — Dê a tarefa:**
```
Você está em Agent Mode. Crie os arquivos diretamente no workspace. Use apenas
StyleSheet (sem NativeWind) e troca de tela por useState (sem React Navigation).
As telas consomem os repositórios e o MqttService do docs/04, sem acessar banco
ou cliente MQTT diretamente. Implemente nesta ordem:

1. src/hooks/useMqtt.ts
2. src/components/StatusIndicator.tsx, MessageBubble.tsx, ConversationItem.tsx, NewConversationModal.tsx
3. src/screens/SettingsScreen.tsx, ConversationsScreen.tsx, ChatScreen.tsx
4. App.tsx (importando ./src/polyfills na primeira linha)
5. Os testes das seções 5.1 e 5.2 do docs/06.

Ao final, rode `npx tsc --noEmit` e corrija o que aparecer sem alterar o docs/04.
Se encontrar ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**4.5 — Aprove os diffs (Keep) e os comandos (Continue).**

**4.6 — Veja o app rodando.** Peça ao Copilot:
```
Rode `npx expo start` e me diga como abrir no navegador.
```
No terminal do Expo, pressione a tecla **`w`** para abrir no navegador. Para parar: `Ctrl+C`.

> **Se a web reclamar do banco (`wa-sqlite.wasm` / SharedArrayBuffer):** confirme
> que o `metro.config.js` da Etapa 2 existe e reinicie com cache limpo:
> `npx expo start -c`, depois `w`.
>
> **Se mesmo assim a web falhar no banco:** o suporte do `expo-sqlite` na web é
> experimental e depende de isolamento de origem, que nem sempre funciona atrás do
> proxy do Codespace. Nesse caso, teste no **Expo Go** (celular): rode
> `npx expo start --tunnel`, instale o app **Expo Go** e escaneie o QR code — no
> celular o SQLite é nativo e não precisa de nada disso.

> **Checkpoint da Etapa 4:**
> - [ ] Telas criadas em `src/screens` e componentes em `src/components`
> - [ ] `App.tsx` atualizado, importando `./src/polyfills` na 1ª linha
> - [ ] `npx tsc --noEmit` sem erro
> - [ ] App abre sem tela branca

---

## Etapa 5 — Validar com QA

> **Onde:** CHAT

**5.1 — Chat novo**, renomeado para `Agente QA — Módulo Broker`. Modo **Agent**.

**5.2 — Cole `prompts/agente_qa.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/02_requisitos_e_regras_de_negocio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_dados_e_mensageria.md
#file:docs/06_desenvolvimento_frontend_conversas_e_chat.md
#file:docs/07_plano_de_testes.md
```

**5.3 — Tarefa:**
```
Você está em Agent Mode (apenas leitura de código e execução de testes; não
corrija código). Execute o plano do docs/07 nesta ordem:
1. Testes de arquitetura (seção 1) — rode buscas no código para confirmar uma
   conexão única, ausência de NativeWind e de React Navigation.
2. Testes de back-end (seção 2) — rode `npm test` (Jest/jest-expo; nunca vitest).
3. Testes de front-end (seção 3.1 e 3.2) — também com `npm test`.
Para cada falha: ID do teste, severidade (CRÍTICO/ALTO/MÉDIO/BAIXO) e passo a
passo. Ao final, recomende aprovação ou rejeição. Atualize o docs/07 com os
resultados.
```

**5.4 — Se o QA apontar falhas:** abra o chat do agente responsável (back-end ou
front-end), descreva a falha e peça a correção:
```
Corrija esta falha mantendo os contratos do docs/04: [descreva a falha]
```
Depois volte ao chat do QA e peça reavaliação.

---

## Etapa 6 — Registrar no log

> **Onde:** CHAT

**6.1 — Chat novo**, renomeado para `Agente Documentador`. Modo **Agent**.

**6.2 — Cole `prompts/agente_documentador.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/08_log_de_evolucao.md
```

**6.3 — Tarefa:**
```
Você está em Agent Mode. Atualize o docs/08_log_de_evolucao.md com o ciclo
concluído: back-end (dados e mensageria), front-end (conversas e chat) e o
resultado real do QA. Use a data de hoje e o validador [seu nome]. Edite o
arquivo diretamente e me mostre o diff.
```

Confira o diff e clique **Keep**.

---

## Etapa 7 — Rodar no celular (build EAS)

> **Onde:** CHAT + TERMINAL

Para instalar no seu celular de verdade (não só no navegador), use o EAS Build.

**7.1 — Você precisa de uma conta Expo gratuita** ([expo.dev](https://expo.dev)).

**7.2 — Peça ao Copilot:**
```
Em Agent Mode, prepare o build do app para Android com EAS: instale o eas-cli,
rode `eas login` (vou digitar minhas credenciais), configure com `eas build:configure`
e explique o comando de build do perfil de preview.
```

**7.3 — O login e a confirmação do build são interativos** — quando o terminal
pedir, **você** digita suas credenciais Expo. O build roda na nuvem da Expo e, ao
final, gera um link/QR code para instalar o APK no celular.

> **Atalho de teste sem build:** instale o app **Expo Go** no celular e escaneie o
> QR code do `npx expo start`. É mais rápido para testar durante a aula; o build
> EAS é para gerar o app instalável.

---

## Etapa 8 — Fazer commit

> **Onde:** CHAT ou TERMINAL

Agora você envia para o GitHub **o que foi gerado**: o código do app (`src/`,
`App.tsx`, `package.json`, `tsconfig.json`, etc.) e o `docs/08_log_de_evolucao.md`
atualizado. A pasta `node_modules/` fica de fora automaticamente (`.gitignore`).
Os arquivos de `docs/` e `prompts/` já estavam no repositório — você não precisa
reenviá-los.

Peça ao Copilot:
```
Em Agent Mode, faça commit do que geramos com a mensagem:

[backend][frontend] feat: módulo de conversas e chat MQTT v1.0

Camada de dados (SQLite), serviço MQTT de conexão única e telas de Ajustes,
Conversas e Chat. Testes passando. QA: módulo aprovado.
Validação humana: [seu nome].
Referência: docs/08_log_de_evolucao.md.

Depois rode `git push`.
```

> **Checkpoint final:**
> - [ ] `git push` concluído
> - [ ] Arquivos visíveis no GitHub

---

## Erros comuns e como resolver

| Erro | Onde | O que fazer |
|---|---|---|
| `This directory already has files. Continue?` | TERMINAL | É esperado; o Copilot deve responder `y`. Se ele parar, autorize. |
| `ReferenceError: File is not defined` ao criar o projeto | TERMINAL | O Codespace está com Node < 20. Rode `nvm install 20 && nvm use 20` e repita o comando. |
| `Buffer is not defined` | App ao conectar | Confirme que `src/polyfills.ts` existe e é importado na 1ª linha do `App.tsx`. Peça ao Copilot para corrigir. |
| `Cannot find module 'mqtt'` | TERMINAL | Peça: "rode `npm install mqtt buffer` novamente". |
| `npm error 404 No match found for version ...` (ex.: `react-native-web@0.20.8`) | TERMINAL | Versão fixada na mão que não existe. Rode `npx expo install react-native-web react-dom @expo/metro-runtime` — o Expo escolhe a versão certa da SDK. |
| `Unable to resolve "./wa-sqlite/wa-sqlite.wasm"` (Web Bundling failed) | TERMINAL (web) | Falta o `metro.config.js` (Etapa 2, passo 9) com `assetExts.push('wasm')`. Crie-o e rode `npx expo start -c`. Persistindo no runtime, teste no Expo Go (`npx expo start --tunnel`). |
| `ERESOLVE ... peer react@"^18.0.0" from @testing-library/react` | TERMINAL | Pacote de teste errado (do React web). Rode `npm uninstall @testing-library/react` e use `@testing-library/react-native` (Etapa 2, passo 8). Não use `--force`/`--legacy-peer-deps`. |
| `Can't access .root on unmounted test renderer` | TERMINAL (npm test) | Testes de tela sem mock disparam efeitos assíncronos. Use `@testing-library/react-native` (render/screen/waitFor) e faça `jest.mock` de expo-sqlite, mqtt, repositórios e useMqtt. |
| `SyntaxError: Unexpected token 'typeof'` (ao rodar `npx vitest`) | TERMINAL | Runner errado. Este projeto usa **Jest** (`jest-expo`). Rode `npm test` (ou `npx jest`), nunca `npx vitest`. |
| Erro de TypeScript após `tsc` | TERMINAL | Peça ao agente responsável: "corrija este erro sem alterar o docs/04". |
| Tela branca / erro vermelho no app | Navegador / Expo Go | `Ctrl+C`, leia o erro, cole no chat do agente e peça correção. |
| Copilot tentou criar uma conexão por conversa | CHAT | "Isso viola o docs/01: o app usa uma única conexão MQTT. Refaça assinando vários tópicos na mesma conexão." |
| Copilot usou NativeWind ou React Navigation | CHAT | "O projeto proíbe NativeWind e React Navigation. Use StyleSheet e useState." |
| Copilot parou no meio | CHAT | "Continue de onde parou." |
| Tokens acabaram | CHAT | Peça commit, feche os chats e recomece com contexto mínimo (prompt do agente + arquivos da etapa). |

---

## Como economizar tokens do plano Student

| Regra | Por quê |
|---|---|
| Anexe só os `#file:` indicados em cada etapa | Cada arquivo extra ocupa contexto |
| Um chat por agente — feche ao terminar | Histórico acumulado encarece cada mensagem |
| Peça correções específicas | "Corrija a linha X de Y" custa menos que "refaça o arquivo" |
| Deixe o Copilot rodar `tsc` e se corrigir | Evita idas e voltas manuais |
| Chat lento ou errando muito? Feche e abra outro | Recomeçar limpo é mais barato |

---

## Convenção de commits

```
[agente] tipo: descrição curta

Detalhes do que foi gerado.
Validação humana: [seu nome].
Referência: docs/08_log_de_evolucao.md.
```
