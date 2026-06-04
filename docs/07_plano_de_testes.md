# Plano de testes
Status: PRONTO PARA VALIDAÇÃO

## 1. Testes de arquitetura (consistência técnica)
| ID | Verificação | Critério |
|---|---|---|
| A01 | Existe uma única conexão MQTT (sem `Map` de clientes) | Inspeção do `mqttService.ts` |
| A02 | Nenhum uso de NativeWind/Tailwind | Busca por `nativewind`/`tailwind` não retorna nada no código |
| A03 | Nenhum uso de React Navigation | Busca por `@react-navigation` não retorna nada |
| A04 | Telas não acessam banco nem cliente MQTT diretamente | Telas usam só repositórios e `MqttService` |
| A05 | Tipos do `04` implementados sem adições | Comparação `src/types/index.ts` × seção 1 do `04` |
| A06 | `App.tsx` importa `./src/polyfills` na primeira linha | Inspeção do `App.tsx` |

## 2. Testes de back-end
### 2.1 Repositórios — ver casos da seção 5.1 do `05_desenvolvimento_backend_dados_e_mensageria`.
### 2.2 MqttService — ver casos da seção 5.2 do mesmo `05` (cliente mqtt mockado).
### 2.3 *(v1.1)* `deleteByConversation` — ver seção 5.1 do `05_desenvolvimento_backend_limpar_historico`.
Critério: runner de testes sem falhas; `npx tsc --noEmit` limpo.

## 3. Testes de front-end
> **Ferramental (ver `06` §5.0):** runner **Jest** (`jest-expo`), executado com
> **`npm test`** — **nunca Vitest**. Mais `@testing-library/react-native` (nunca
> `@testing-library/react`) + `react-test-renderer@19.1.0`, com `jest.mock` de
> expo-sqlite/expo-crypto/mqtt/repositórios/useMqtt. Falhas como `Unexpected token
> 'typeof'` (Vitest), `Can't access .root on unmounted test renderer` (sem mocks) ou
> `ERESOLVE peer react@^18` (pacote web errado) indicam **ferramental errado**, não
> o código das telas.

### 3.1 Renderização — ver casos da seção 5.1 do `06_desenvolvimento_frontend_conversas_e_chat`.
### 3.2 Comportamento — ver casos da seção 5.2 do mesmo `06`.
### 3.3 Integração manual — ver seção 5.3 do mesmo `06` (duas instâncias na mesma conversa).
### 3.4 *(v1.1)* Limpar histórico — ver seção 5.1 do `06_desenvolvimento_frontend_limpar_historico`.

## 4. Critérios de aprovação (binários)
Cada teste é PASSOU ou FALHOU. Não existe "parcialmente ok". O módulo só é
aprovado se todos os testes da sua etapa passarem e o app compilar sem erro de TS.

## 5. Evidências
Para cada execução, registrar: saída do runner de testes, saída de
`npx tsc --noEmit`, e captura/descrição do comportamento manual (status da
conexão e troca de mensagens entre duas instâncias).

## Pedido para o Agente de QA
Organize os testes por prioridade e indique o que deve ser validado em cada
etapa de desenvolvimento. Não corrija código: documente falhas com severidade
(CRÍTICO, ALTO, MÉDIO, BAIXO) e passo a passo de reprodução.

## 8. Resultados da validação

### 8.1 Execuções realizadas
- `npx tsc --noEmit`: falha.
- `npm test -- --runInBand src/__tests__/backend.test.ts`: passou (17/17 testes).
- `npm test -- --runInBand`: passou (5 suítes, 28/28 testes).

### 8.2 Resultados por etapa
- A01: PASSOU — `src/services/mqttService.ts` usa uma única conexão MQTT sem `Map` de clientes.
- A02: PASSOU — não há importações ou referências a `nativewind`/`tailwind`.
- A03: PASSOU — não há importações de `@react-navigation` ou `react-navigation`.
- A04: PASSOU — telas em `src/screens` não importam `expo-sqlite` nem `mqtt`; usam repositórios e `useMqtt`.
- A05: PASSOU — `src/types/index.ts` implementa os tipos do contrato `docs/04_contratos_de_api.md` sem adições inesperadas.
- A06: PASSOU — `App.tsx` importa `./src/polyfills` como primeira linha.
- 2.1/2.2/3.1/3.2: PASSOU — o conjunto de testes Jest atual foi executado com 0 falhas.

### 8.3 Falha identificada
- Severidade: CRÍTICO
- Localização: `src/__tests__/backend.test.ts` linha 216
- Descrição: `npx tsc --noEmit` falha com `TS2304: Cannot find name 'uuidCounter'`.
- Passos para reproduzir:
  1. No terminal da raiz do projeto, execute `npx tsc --noEmit`.
  2. Observe erro em `src/__tests__/backend.test.ts:216:5`.
  3. O erro ocorre antes de a validação de tipos do projeto ser concluída.

### 8.4 Recomendação
- Rejeitar a liberação do módulo até que a falha de compilação TypeScript seja corrigida.

### 8.5 Execução QA — 2026-06-04 (Agente QA v1.0)

#### 8.5.1 Comandos executados
- `npx tsc --noEmit`: passou (sem saída)
- `npm test -- --runInBand`: executado — 11 suítes encontradas; 1 suíte falhou.

#### 8.5.2 Resultado resumido
- Test Suites: 1 failed, 10 passed, 11 total
- Tests: 55 passed, 55 total

#### 8.5.3 Falha identificada
- ID: F-QA-2026-06-04-01
- Severidade: ALTO
- Localização: `projetoMensagemMqtt/src/__tests__/ConversationsScreen.test.tsx`
- Descrição: Falha na execução da suíte de testes por erro de ambiente durante import de `expo-sqlite` / `expo-constants`. Stack trace indica `TypeError: Cannot read properties of undefined (reading 'EXDevLauncher')` originando em `node_modules/expo/node_modules/expo-constants/src/Constants.ts`.
- Passos para reproduzir:
  1. No terminal da raiz do projeto execute `cd projetoMensagemMqtt`.
 2. Execute `npm test -- --runInBand`.
 3. Observe falha na suíte `projetoMensagemMqtt/src/__tests__/ConversationsScreen.test.tsx` com o erro indicado acima.

#### 8.5.4 Impacto sobre RF12 / RN10 (limpar histórico)
- RF12 (Histórico esvazia): PASSOU — cobertura presente em `src/__tests__/ChatScreen.clear.test.tsx` (suíte PASSOU).
- RN10 (Conversa preservada e tópico permanece assinado): PASSOU — testes relevantes em `src/__tests__/backend.test.ts` e `projetoMensagemMqtt/src/__tests__/mqttService.test.ts` passaram.

### 8.6 Falha reportada em ambiente real — botão "Limpar" não limpa o histórico

- ID: F-QA-2026-06-04-02
- Severidade: ALTO
- Localização aparente: `projetoMensagemMqtt/src/screens/ChatScreen.tsx` (handler `handleClear`) / integração com `messageRepository.deleteByConversation`
- Descrição: Em uso manual (aplicativo em dispositivo/emulador), o botão `Limpar` aparece mas, após confirmar 'Apagar', o histórico de mensagens continua visível para o usuário — ação não surte efeito visível.
- Passos para reproduzir (manual):
  1. Abrir o app (emulador ou dispositivo) e navegar até uma conversa com histórico de mensagens.
 2. Pressionar o botão `Limpar` no canto superior direito.
 3. Na confirmação, tocar `Apagar`.
 4. Esperar feedback; observar que as mensagens permanecem na tela.
- Verificações recomendadas para diagnóstico (executar antes de alterar código):
  1. Ativar debug remoto / console e adicionar `console.log` no início de `handleClear` e após `await messageRepository.deleteByConversation(conversation.id)` para confirmar se o handler é invocado e se a promise resolve.
  2. Verificar se `messageRepository.deleteByConversation` está sendo chamado com o `conversation.id` correto (log do argumento).
  3. Executar `messageRepository.findByConversation(conversation.id)` no console (ou via REPL/test) após a operação para confirmar se o banco retornou array vazio.
  4. Conferir se algum efeito colateral (ex.: reconexão MQTT ou listener) está repopulando `messages` logo após a limpeza.
  5. Verificar se `setMessages([])` está sendo chamado e se o componente está sendo re-renderizado (React DevTools).
- Impacto sobre critérios de aceite: bloqueia aceitação do fluxo manual de limpeza de histórico (RN10/RF12 — validação manual necessária). Apesar dos testes unitários cobrirem o caso, a experiência manual mostra discrepância entre teste e runtime.
- Recomendação imediata: Marcar como **REJEITADO** para liberação de UX até que a equipe reproduza e prove a correção. Fornecer logs/prints do console e resultado de `findByConversation` vazia como evidência após correção.

ASSINATURA: Agente de QA | 2026-06-04 | v1.0

#### 8.5.5 Recomendação
- Rejeitar a liberação do módulo até que a falha de execução da suíte de front-end seja corrigida (mock de `expo-constants` / `expo-sqlite` ou ajuste do ambiente de testes). Apesar dos testes de limpeza de histórico terem passado, a suíte `ConversationsScreen` não pôde ser validada por falha de ambiente.

ASSINATURA: Agente de QA | 2026-06-04 | v1.0
