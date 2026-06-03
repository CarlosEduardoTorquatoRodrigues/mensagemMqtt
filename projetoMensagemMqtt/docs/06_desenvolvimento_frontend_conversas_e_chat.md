# Front-end: módulo de conversas e chat
Status: PRONTO PARA VALIDAÇÃO

> Escopo deste módulo: as três telas do app (Ajustes, Conversas, Chat), os
> componentes visuais e a integração com a camada de dados e o `MqttService`.
> Consome os contratos do `04` como verdade absoluta.

---

## 1. Contexto

O app tem três telas, alternadas por estado (`useState` no `App.tsx`), sem
React Navigation. Toda a estilização é com `StyleSheet`. Sem NativeWind.

Fluxo:
1. Na primeira abertura (sem `settings`), abre a tela **Ajustes** para o usuário
   informar o apelido (broker já pré-preenchido).
2. Depois, a tela inicial é **Conversas**.
3. Tocar numa conversa abre o **Chat**; o botão voltar retorna às Conversas.
4. Um ícone/botão de Ajustes leva à tela de Ajustes a qualquer momento.

A conexão MQTT é estabelecida uma vez quando há `settings` válidos, e o app
assina o tópico de cada conversa salva. Mensagens recebidas são roteadas para a
conversa pelo tópico, salvas via `MessageRepository` e refletidas na tela.

---

## 2. Contrato consumido
Origem: `docs/04_contratos_de_api.md` (APROVADO). As telas usam os repositórios
e o `MqttService` exatamente como definidos. Não criam acesso direto ao banco
nem ao cliente MQTT.

---

## 3. O que deve ser gerado

| Arquivo | Responsabilidade |
|---|---|
| `src/hooks/useMqtt.ts` | Hook que conecta uma vez, assina os tópicos das conversas, expõe `status` e `sendMessage`, descarta o eco da própria mensagem (`payload.clientId` igual ao próprio — RN04), e oferece `subscribe`/`unsubscribe` para quando uma conversa é criada ou excluída. **Captura qualquer falha de `connect` (try/catch / `.catch`) e apenas seta `status = 'error'` — nunca deixa o erro derrubar o app (RNF07).** |
| `src/components/StatusIndicator.tsx` | Mostra o `ConnectionStatus` com cor e rótulo |
| `src/components/ConversationItem.tsx` | Item da lista de conversas (nome + tópico); permite excluir (toque longo) |
| `src/components/MessageBubble.tsx` | Balão de mensagem, alinhado por `direction` |
| `src/components/NewConversationModal.tsx` | Formulário (nome + tópico) para criar conversa, com validação RN08 |
| `src/screens/SettingsScreen.tsx` | Edita apelido, host, porta e SSL. Valida o host (RN11: sem espaços/esquema) antes de salvar. **Deve ser sempre acessível, inclusive com status `error`**, para o usuário corrigir um broker errado |
| `src/screens/ConversationsScreen.tsx` | Lista conversas, status, botão nova conversa, Ajustes e exclusão de conversa (RF11). O botão **Ajustes funciona mesmo com a conexão em `error`** |
| `src/screens/ChatScreen.tsx` | Histórico + envio de mensagem de uma conversa (bloqueia corpo vazio — RN09). Envolve o conteúdo em **`KeyboardAvoidingView`** para o teclado **não cobrir o `TextInput`**; lista de mensagens em `FlatList` com `keyboardShouldPersistTaps="handled"`, rolando para a última mensagem |
| `App.tsx` (raiz) | Importa `./src/polyfills`, controla a tela atual por estado e injeta o `useMqtt` |

---

## 4. Experiência esperada
- **Status:** sempre visível na tela de Conversas e de Chat. Verde = conectado,
  amarelo = conectando/reconectando, vermelho = desconectado/erro.
- **Carregamento:** listas mostram indicador enquanto carregam do SQLite.
- **Envio:** ao enviar, a mensagem aparece imediatamente à direita (`sent`) e é
  publicada no tópico; o campo de texto é limpo.
- **Recebimento:** mensagem de outro participante aparece à esquerda (`received`)
  com o apelido do remetente.
- **Erros / broker inválido (RNF07):** se a conexão falhar (endereço errado ou
  inacessível), o app **não trava nem mostra tela de erro sem saída** — o status
  vai para `error` (indicador vermelho) e o usuário **continua conseguindo abrir os
  Ajustes** para corrigir o broker e tentar de novo. Campos vazios nos Ajustes
  mostram mensagem clara.
- **Host inválido (RN11):** o formulário de Ajustes bloqueia host com espaços ou
  com esquema (`ws://`, `wss://`, `http://`) antes de salvar, com aviso.
- **Teclado não cobre o campo de digitação:** na tela de Chat, ao focar o
  `TextInput`, o teclado do celular **não pode sobrepor** o campo — o conteúdo sobe
  com `KeyboardAvoidingView` (behavior por plataforma) e a lista rola para a última
  mensagem. O usuário sempre vê o que está digitando e o botão enviar.
- **Conversa duplicada:** tentar criar conversa com tópico já existente mostra
  aviso (vindo do `AppError TOPIC_ALREADY_EXISTS`).
- **Tópico inválido (RN08):** o formulário bloqueia tópico vazio, com espaços ou
  com os curingas `#`/`+`, mostrando aviso antes de chamar o repositório.
- **Mensagem vazia (RN09):** o botão enviar não publica corpo vazio ou só com espaços.
- **Excluir conversa (RF11):** toque longo na conversa pede confirmação; ao
  confirmar, o app chama `conversationRepository.delete`, faz `unsubscribe` do
  tópico e remove a conversa da lista.

---

## 5. Testes obrigatórios

### 5.0 Convenção de testes (obrigatória)
- **Runner = Jest (preset `jest-expo`). Rode com `npm test` (ou `npx jest`).**
  **NUNCA use Vitest** (`npx vitest`): ele não aplica o transform de React
  Native/Expo e quebra com `SyntaxError: Unexpected token 'typeof'`.
- O `package.json` deve ter `"scripts": { "test": "jest" }` e a config
  `"jest": { "preset": "jest-expo" }`.
- Use **`@testing-library/react-native`** (`render`, `screen`, `fireEvent`,
  `waitFor`). **Nunca** `@testing-library/react` (é do React web e exige react@18 —
  conflita com o react@19 do projeto) e **nunca** `react-test-renderer` cru
  acessando `.root`.
- Faça **`jest.mock`** das dependências assíncronas para nenhuma tela tocar
  banco/MQTT de verdade no teste: `expo-sqlite`, `expo-crypto`, o pacote `mqtt`,
  os repositórios (`settingsRepository`, `conversationRepository`,
  `messageRepository`) e o hook `useMqtt`. Sem isso os efeitos assíncronos rodam
  durante o teste e causam `Can't access .root on unmounted test renderer`.
- Componentes puros (`StatusIndicator`, `MessageBubble`) testam só renderização;
  telas envolvem efeitos/interações em `waitFor`/`act`.
- Preset do Jest: `jest-expo`. Dependências (instaladas na Etapa 2 do roteiro):
  `jest-expo`, `@testing-library/react-native`, `react-test-renderer@19.1.0`.

### 5.1 Testes de renderização
| Caso | Verificação |
|---|---|
| `StatusIndicator` | Renderiza rótulo/cor corretos para cada status |
| `MessageBubble` `sent` | Alinha à direita |
| `MessageBubble` `received` | Alinha à esquerda e mostra o `sender` |
| `ConversationsScreen` vazia | Mostra estado vazio ("nenhuma conversa") |
| `ConversationsScreen` com itens | Renderiza a lista de conversas |

### 5.2 Testes de comportamento
| Caso | Verificação |
|---|---|
| Criar conversa | Submeter o modal adiciona a conversa à lista |
| Tópico duplicado | Submeter tópico existente mostra aviso e não duplica |
| Tópico inválido (RN08) | Tópico vazio, com espaço ou com `#`/`+` é bloqueado com aviso |
| Excluir conversa (RF11) | Toque longo + confirmação remove a conversa, seu histórico e faz `unsubscribe` |
| Enviar mensagem | A mensagem aparece na lista e o campo é limpo |
| Mensagem vazia (RN09) | Botão enviar não publica corpo vazio/só espaços |
| Abrir conversa | Mostra o histórico daquela conversa |
| Salvar Ajustes inválidos | Campo vazio bloqueia o salvamento com mensagem |
| Host inválido (RN11) | Host com espaço ou com `ws://`/`wss://` é bloqueado com aviso |
| Broker inválido não derruba (RNF07) | Com broker errado, o status fica `error`, o app continua de pé e o botão Ajustes ainda abre a tela de Ajustes |

### 5.3 Validação manual
1. Abrir o app (Expo web com a tecla `w`, ou Expo Go no celular).
2. Definir apelido na primeira abertura.
3. Criar a conversa `Sala 1` com tópico `mensagemmqtt/sala1`.
4. Em um segundo app (outra aba/dispositivo) com a mesma conversa/tópico, trocar
   mensagens e confirmar recebimento em tempo real.
5. Fechar e reabrir o app; confirmar que o histórico persiste.
6. Nos Ajustes, digitar um broker **errado de propósito** (ex.: trocar um ponto do
   host) e salvar: confirmar que o app **não trava**, o status vira `error` e dá
   para **voltar aos Ajustes e corrigir** o endereço, reconectando em seguida.
7. No celular (Expo Go), abrir uma conversa e tocar no campo de digitação:
   confirmar que **o teclado não cobre o `TextInput`** — o campo e o botão enviar
   continuam visíveis e a lista de mensagens fica acima do teclado.

---

## 6. Critérios de aceite

| Critério | Como verificar |
|---|---|
| App abre sem tela branca | Expo web ou Expo Go |
| Apelido pedido na primeira abertura | Fluxo de primeira execução |
| Status exibido corretamente | Indicador muda conforme a conexão |
| Envio/recebimento em tempo real | Duas instâncias na mesma conversa |
| Sem duplicação de mensagem própria | `clientId` filtra o eco |
| Histórico persiste | Reabrir o app mantém as mensagens |
| Teclado não cobre o campo (Chat) | No celular, ao digitar, o `TextInput` e o botão enviar continuam visíveis |
| Compila sem erro de TS | `npx tsc --noEmit` sem saída |
| Sem NativeWind / sem React Navigation | Inspeção: só `StyleSheet` e `useState` |

---

## 7. Como usar este módulo no Copilot (Agent Mode)

> O Copilot cria os arquivos e roda os comandos. Você revisa e aprova.

**Passo 1 — Copilot Chat em modo `Agent`.** Novo chat, renomeado para
`Agente Front-end — Conversas e Chat`.

**Passo 2 — Cole `prompts/agente_frontend.md`** (ou `#file:prompts/agente_frontend.md`).

**Passo 3 — Anexe o contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/06_desenvolvimento_frontend_conversas_e_chat.md
```

**Passo 4 — Dê a tarefa:**
```
Você está em Agent Mode. Crie os arquivos diretamente no workspace. Use apenas
StyleSheet (sem NativeWind) e troca de tela por useState (sem React Navigation).
Consuma os repositórios e o MqttService do docs/04 sem acessar banco ou cliente
MQTT diretamente. Implemente, nesta ordem:

1. src/hooks/useMqtt.ts
2. src/components/StatusIndicator.tsx, MessageBubble.tsx, ConversationItem.tsx, NewConversationModal.tsx
3. src/screens/SettingsScreen.tsx, ConversationsScreen.tsx, ChatScreen.tsx
4. App.tsx (importando ./src/polyfills na primeira linha)
5. Os testes das seções 5.1 e 5.2.

Ao final, rode `npx tsc --noEmit` e corrija o que aparecer sem alterar os
contratos do docs/04. Se encontrar ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**Passo 5 — Aprove os diffs (Keep) e os comandos (Continue) conforme o Copilot avança.**

**Passo 6 — Rode o app (`npx expo start`, tecla `w`) e valide pela seção 6.**
