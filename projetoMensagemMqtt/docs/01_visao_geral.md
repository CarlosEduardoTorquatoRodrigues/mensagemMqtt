# Visão geral do sistema
Status: APROVADO

## 1. Objetivo do projeto
Aplicativo mobile de troca de mensagens instantâneas usando o protocolo MQTT,
com suporte a múltiplas conversas. O projeto é material didático para a
disciplina de desenvolvimento mobile e demonstra o uso de IA multiagente
(GitHub Copilot no Codespaces) na construção de um app React Native real.

## 2. Problema que o sistema resolve
Permitir que pessoas conversem em tempo real de forma descentralizada,
conectando-se a um broker MQTT público ou privado, sem depender de servidor
próprio. Cada "sala" de conversa é um tópico MQTT; quem assina o mesmo tópico
recebe as mensagens.

## 3. Atores envolvidos
- **Usuário final:** pessoa que cria conversas, envia e recebe mensagens.
- **Broker MQTT (sistema externo):** servidor que roteia as mensagens entre
  quem publica e quem assina um tópico. Público ou privado, configurado pelo
  usuário na tela de Ajustes.

## 4. Escopo: dentro e fora

### Dentro desta fase (v1.0)
- Tela de **Ajustes**: apelido do usuário e configuração do broker (host, porta, SSL).
- Tela de **Conversas**: lista as conversas salvas e permite criar novas.
- Tela de **Chat**: envia e recebe mensagens em tempo real em uma conversa.
- Persistência local em SQLite (configurações, conversas e histórico de mensagens).
- Indicação do status da conexão (conectado, conectando, desconectado, erro).

### Fora desta fase
- Notificações push de mensagem recebida em segundo plano.
- Autenticação de usuário no app.
- Anexos (imagens, áudio, arquivos).
- Confirmação de leitura e indicadores de "digitando".
- Criptografia ponta a ponta.

## 5. Restrições técnicas
- **Framework:** React Native com Expo (managed workflow), **Expo SDK 54 (fixada)**.
  Justificativa: Expo permite build via EAS sem Mac nem Android Studio local,
  e o app instala em celular real a partir do Codespace. A SDK 54 é fixada na
  criação do projeto por ser a versão estável validada (o `create-expo-app` traz
  a mais recente; voltamos para a 54 com `npm install expo@~54.0.0` + `expo install --fix`).
- **Protocolo:** MQTT sobre WebSocket seguro (WSS).
  Justificativa: MQTT raw (porta 1883) não funciona em React Native sem módulo
  nativo; WebSocket é a única forma viável no Expo managed.
- **Conexão única:** uma só conexão MQTT assina vários tópicos.
  Justificativa: uma conexão por conversa é complexidade desnecessária e fonte
  de erro; o MQTT já permite múltiplas assinaturas na mesma conexão.
- **Cliente MQTT:** pacote `mqtt` (MQTT.js v5), o único cliente MQTT JavaScript
  ativamente mantido. Importado com `import mqtt from 'mqtt'` — a v5 tem condição de
  export `react-native` e roteia sozinha para o build seguro de RN; mantém-se um
  polyfill de `Buffer` por segurança.
- **Armazenamento local:** SQLite via `expo-sqlite`.
  Justificativa: consultas por conversa em um histórico crescente de mensagens
  pedem um banco relacional, não chave-valor.
- **Estilização:** `StyleSheet` nativo do React Native. Sem NativeWind/Tailwind.
  Justificativa: zero configuração extra; remove uma fonte recorrente de erro.
- **Navegação:** troca de tela por estado (`useState`). Sem React Navigation.
  Justificativa: três telas não justificam cinco dependências de navegação.
- **Ambiente de desenvolvimento:** GitHub Codespaces com Copilot Student.
  Restrição de tokens: todos os arquivos devem ser concisos.

## 6. Premissas
1. O usuário conhece o broker que vai usar (host, porta). O app não fornece broker,
   apenas vem com um broker público pré-preenchido nos Ajustes.
2. Mensagens em brokers públicos não são privadas. O app não garante privacidade —
   isso é responsabilidade do broker escolhido.
3. Cada conversa corresponde a exatamente um tópico MQTT, usado tanto para enviar
   (publish) quanto para receber (subscribe).
4. O app mantém **uma única conexão MQTT**, que assina o tópico de cada conversa salva.
5. Cada instância do app tem um `clientId` único, usado para ignorar o eco das
   próprias mensagens e evitar duplicação no histórico.

## 7. Riscos conhecidos
1. Brokers públicos podem ter instabilidade ou latência. O app deve indicar o
   status da conexão de forma clara e tentar reconectar de forma transparente.
2. O ambiente Codespaces pode restringir conexões WebSocket externas durante o
   desenvolvimento; o teste principal é via Expo web e o teste real no celular
   pela rede do aluno. Usar broker público confiável (ex.: `broker.hivemq.com`).
3. Build via Expo EAS requer conta Expo (gratuita).
4. Se o broker público pré-configurado for descontinuado, o usuário troca o host
   na tela de Ajustes — por isso a configuração do broker é editável na interface,
   e não fixa no código.

## 8. Pedido para o Agente Arquiteto
Analise o cenário e proponha a estrutura inicial considerando arquitetura,
módulos, dependências e riscos.
