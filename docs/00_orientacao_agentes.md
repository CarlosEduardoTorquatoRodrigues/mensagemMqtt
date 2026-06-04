# Orientação para agentes

## Regras universais
1. Nenhum agente inventa informação. Em caso de dúvida, abre divergência.
2. Nenhum agente avança sem validação humana entre etapas.
3. Todo artefato gerado referencia o arquivo de origem.
4. Toda decisão técnica é justificada em uma frase.
5. Nenhum agente altera arquivo fora do seu escopo de escrita.
6. Todo termo novo exige proposta de adição ao glossário `09` antes de ser usado.

## Restrições técnicas do projeto (valem para todo agente)
1. Uma única conexão MQTT assina vários tópicos. Cada conversa é um tópico.
   Nunca abrir uma conexão por conversa.
2. Estilização só com `StyleSheet`. Proibido NativeWind/Tailwind.
3. Navegação só por estado (`useState`). Proibido React Navigation.
4. MQTT pelo pacote `mqtt` (v5) importado com `import mqtt from 'mqtt'` (v5 roteia
   sozinho para o build de React Native), com polyfill de `Buffer` via `globalThis`
   no início do `App.tsx`.
5. Sem abstração desnecessária. O código é didático e direto.

## Formato de entrega obrigatório
Toda resposta de agente termina com:

RESUMO PARA VALIDAÇÃO HUMANA
- O que foi feito:
- O que precisa de aprovação:
- Pendências:
- Próxima ação sugerida:

## Protocolo de divergência
Quando um agente identifica conflito, ambiguidade ou erro, ele para e abre
divergência no `08` em vez de improvisar. Tags válidas:

| Tag | Quando usar |
|---|---|
| `[PENDENTE]` | Informação ausente que precisa de decisão humana |
| `[QUESTIONAMENTO]` | Suspeita de erro em artefato já aprovado |
| `[CONFLITO]` | Contradição entre dois artefatos aprovados |
| `[BLOQUEIO]` | Impossibilidade técnica de cumprir o pedido |

## Identificação
Toda contribuição assinada com: nome do agente | data | versão do prompt.
