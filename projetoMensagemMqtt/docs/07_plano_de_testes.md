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

## 6. Resultados de validação de QA
| ID | Resultado | Observação |
|---|---|---|
| A01 | PASSOU | `mqttService.ts` usa única instância `client` e não há `Map` de clientes. |
| A02 | PASSOU | Busca em `src/**/*.{ts,tsx}` não retornou `nativewind` ou `tailwind`. |
| A03 | PASSOU | Busca em `src/**/*.{ts,tsx}` não retornou `@react-navigation`. |
| A04 | PASSOU | Telas consomem só repositórios e `useMqtt`; não acessam DB ou cliente MQTT direto. |
| A05 | PASSOU | `src/types/index.ts` corresponde ponto a ponto com `docs/04` §1. |
| A06 | PASSOU | `App.tsx` importa `./src/polyfills` na primeira linha. |
| Testes de compilação | PASSOU | `npx tsc --noEmit` rodou limpo. |
| Testes Jest | FALHOU | `npm test` retornou 3 suites falhas de UI/front-end. |

### Observações adicionais
- `npm test` executou 5 suites e 20 testes; 17 passaram e 3 falharam.
- As falhas front-end ocorreram em `StatusIndicator`, `MessageBubble` e `ConversationsScreen`.
- `ConversationsScreen` falhou em `npm test` devido a erro de parsing de `expo-crypto` no ambiente Jest (`import` fora de módulo).
- Há um risco de funcionalidade em `App.tsx`: a navegação para Chat define `topic: ''`, o que deve ser investigado.

## Pedido para o Agente de QA
Organize os testes por prioridade e indique o que deve ser validado em cada
etapa de desenvolvimento. Não corrija código: documente falhas com severidade
(CRÍTICO, ALTO, MÉDIO, BAIXO) e passo a passo de reprodução.
