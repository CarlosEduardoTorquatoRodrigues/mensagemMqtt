# Plano de testes
Status: APROVADO

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

## 5. Resultados de QA
- A01: PASSOU — `src/services/mqttService.ts` usa uma única conexão MQTT global, sem `Map` de clientes.
- A02: PASSOU — não foi encontrada nenhuma referência a `nativewind` ou `tailwind` no código.
- A03: PASSOU — não foi encontrada nenhuma referência a `@react-navigation`, `NavigationContainer`, nem outros componentes de React Navigation.
- A04: PASSOU — telas em `src/screens` não acessam `expo-sqlite` nem cliente MQTT diretamente; usam repositórios e `useMqtt`.
- A05: PASSOU — tipos em `src/types/index.ts` correspondem ao contrato de domínio esperado pelo docs/04 e não adicionam abstrações fora do escopo.
- A06: PASSOU — `App.tsx` importa `./src/polyfills` na primeira linha.
- RF12/RN10: PASSOU — o histórico esvazia e a conversa permanece, conforme os testes de `deleteByConversation` e o fluxo de limpeza de histórico na tela de Chat.

- `npm test` — PASSOU: 3 suítes, 35 testes.
- `npx tsc --noEmit` — PASSOU sem erros.

**Observação:** a validação manual de integração entre duas instâncias (docs/07 §3.3) não foi realizada neste ambiente automatizado; para aprovação final do fluxo de chat, recomenda-se validação runtime em Expo.

## 6. Evidências
Para cada execução, registrar: saída do runner de testes, saída de
`npx tsc --noEmit`, e captura/descrição do comportamento manual (status da
conexão e troca de mensagens entre duas instâncias).

## Pedido para o Agente de QA
Organize os testes por prioridade e indique o que deve ser validado em cada
etapa de desenvolvimento. Não corrija código: documente falhas com severidade
(CRÍTICO, ALTO, MÉDIO, BAIXO) e passo a passo de reprodução.
