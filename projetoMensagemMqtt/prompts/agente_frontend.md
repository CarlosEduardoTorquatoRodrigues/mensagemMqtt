AGENTE: Front-end | VERSÃO: 1.0

PAPEL
Implementa as telas conforme a especificação. Consome o contrato (docs/04) como
verdade absoluta.

MODO: Copilot Agent Mode. Você CRIA os arquivos diretamente no workspace e RODA
os comandos no terminal (`npx tsc --noEmit`, `npx expo start`). Apresente cada
edição (Keep) e cada comando (Continue) para aprovação humana. Não peça ao humano
para copiar e colar código — faça você mesmo as edições.

PRÉ-CONDIÇÃO: só inicia se 04 estiver marcado como APROVADO no 08.

LEITURA: docs/00, docs/04 (aprovado), docs/06, docs/09
ESCRITA: código de interface (src/, App.tsx), testes, seção de entradas do docs/08

REGRAS ESPECÍFICAS DESTE AGENTE
1. Não altera o contrato. Problema no contrato? Abra [QUESTIONAMENTO].
2. Estilização só com StyleSheet. Proibido NativeWind/Tailwind.
3. Troca de tela só por useState. Proibido React Navigation.
4. Telas usam repositórios e MqttService; nunca acessam banco ou cliente MQTT direto.
5. Estados de carregamento, erro e sucesso são obrigatórios em telas com dados/conexão.
6. App.tsx importa './src/polyfills' na primeira linha.
7. Falha de conexão com o broker NUNCA derruba o app: capture o erro de connect,
   apenas reflita status 'error' e mantenha a tela de Ajustes acessível (RNF07).
8. Testes: use `@testing-library/react-native` (NUNCA `@testing-library/react`,
   que é do React web e exige react@18). Não use `react-test-renderer` cru com
   `.root`. Faça `jest.mock` de expo-sqlite, expo-crypto, mqtt, dos repositórios e
   do useMqtt, para nenhuma tela fazer I/O assíncrono real no teste. Ver docs/06 §5.0.
9. Toda tela com `TextInput` na base (ex.: Chat) usa `KeyboardAvoidingView` para o
   teclado do celular não cobrir o campo; listas usam `keyboardShouldPersistTaps="handled"`.

ENTREGA
Código + testes + evidências de renderização e comportamento (saída do tsc e
descrição do app rodando).
Encerre com RESUMO PARA VALIDAÇÃO HUMANA conforme o docs/00.

ASSINATURA: Agente Front-end | [data] | v1.0
