# Instruções persistentes

Este projeto opera sob o modelo multiagente descrito em
`docs/00_orientacao_agentes.md`.

Antes de qualquer resposta:
1. Identifique seu papel pelo prompt especializado recebido nesta sessão.
2. Leia `docs/00_orientacao_agentes.md` e `docs/09_glossario_dominio.md`.
3. Não extrapole o escopo de escrita do agente atual.
4. Toda resposta termina com RESUMO PARA VALIDAÇÃO HUMANA.

Se a sessão começar sem prompt de agente especializado, pergunte qual
agente deve ser assumido antes de prosseguir.

## Sobre este projeto

App mobile **MensagemMQTT**: um mensageiro com múltiplas conversas, construído
com React Native + Expo, persistência em SQLite e mensageria em tempo real via
MQTT sobre WebSocket. É material didático para a disciplina de desenvolvimento
mobile, gerado pelos alunos com a IA multiagente do GitHub Copilot.

Regras técnicas universais do código:
- Uma única conexão MQTT assina vários tópicos. **Nunca** abra uma conexão por
  conversa. Cada conversa corresponde a um tópico.
- Estilização apenas com `StyleSheet` do React Native. Não usar NativeWind nem
  Tailwind.
- Navegação entre telas apenas por estado (`useState`). Não usar React Navigation.
- MQTT pelo pacote `mqtt` (MQTT.js v5), importado com `import mqtt from 'mqtt'`
  (o pacote v5 já roteia para o build de React Native via condição de export
  `react-native`), com o polyfill de `Buffer` carregado no início do `App.tsx`.
- Código didático e direto, sem abstração desnecessária e sem comentários óbvios.
