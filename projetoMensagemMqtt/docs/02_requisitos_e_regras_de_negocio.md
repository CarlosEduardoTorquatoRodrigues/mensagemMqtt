# Requisitos e regras de negócio
Status: APROVADO

## 1. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | O usuário define um apelido na primeira vez que abre o app. |
| RF02 | O usuário pode ver e editar o apelido e os dados do broker (host, porta, SSL) na tela de Ajustes. |
| RF03 | O app conecta a um único broker MQTT sobre WebSocket usando os dados dos Ajustes. |
| RF04 | O app exibe o status da conexão: conectado, conectando, desconectado ou erro. |
| RF05 | O usuário pode criar uma conversa informando um nome e um tópico. |
| RF06 | O app lista todas as conversas salvas, ordenadas da mais recente para a mais antiga. |
| RF07 | Ao abrir uma conversa, o usuário vê o histórico de mensagens daquela conversa. |
| RF08 | O usuário pode enviar uma mensagem de texto em uma conversa. |
| RF09 | O app recebe em tempo real as mensagens publicadas no tópico de qualquer conversa salva. |
| RF10 | Toda mensagem enviada e recebida é salva localmente no histórico da conversa. |
| RF11 | O usuário pode excluir uma conversa; o app deixa de assinar o tópico e remove o histórico dela. |
| RF12 | *(v1.1)* O usuário pode limpar o histórico de uma conversa, apagando todas as suas mensagens **sem** excluir a conversa. |

## 2. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | O app deve funcionar com uma única conexão MQTT, independente do número de conversas. |
| RNF02 | O app deve reconectar automaticamente após queda de conexão, sem ação do usuário. |
| RNF03 | A interface não pode travar enquanto conecta ou recebe mensagens (operações assíncronas). |
| RNF04 | O histórico de mensagens deve persistir após o app ser fechado e reaberto. |
| RNF05 | O app deve compilar sem erros de TypeScript (`npx tsc --noEmit` limpo). |
| RNF06 | O app deve poder ser empacotado via EAS Build e instalado em um celular real. |
| RNF07 | Uma falha de conexão (broker inválido ou inacessível) **nunca derruba o app** nem leva a uma tela de erro sem retorno. O status vira `error` e a tela de **Ajustes continua acessível** para o usuário corrigir o broker. |
| RNF08 | Na tela de Chat, o teclado do celular **não pode cobrir** o campo de digitação: o `TextInput` e o botão enviar permanecem visíveis ao digitar (uso de `KeyboardAvoidingView`). |

## 3. Regras de negócio

| ID | Regra |
|---|---|
| RN01 | Cada conversa corresponde a exatamente um tópico MQTT, único no app. |
| RN02 | Não é permitido criar duas conversas com o mesmo tópico. |
| RN03 | O app mantém uma só conexão e assina o tópico de cada conversa salva. |
| RN04 | Uma mensagem publicada carrega o `clientId` de quem enviou; ao receber o eco da própria mensagem (mesmo `clientId`), o app ignora para não duplicar o histórico. |
| RN05 | Mensagens enviadas pelo próprio usuário têm `direction = 'sent'`; as demais, `direction = 'received'`. |
| RN06 | Excluir uma conversa remove também todas as suas mensagens (cascata) e cancela a assinatura do seu tópico. |
| RN07 | Apelido, host e porta do broker são obrigatórios para conectar. |
| RN08 | O tópico de uma conversa não pode ser vazio nem conter espaços ou os curingas MQTT `#` e `+`. Nome e tópico são obrigatórios na criação. |
| RN09 | Não é permitido enviar mensagem com corpo vazio ou composto só por espaços. |
| RN10 | *(v1.1)* Limpar o histórico remove apenas as mensagens da conversa; a conversa e a assinatura do tópico permanecem ativas. |
| RN11 | O host do broker é apenas o domínio ou IP — **sem espaços e sem esquema** (`ws://`, `wss://`, `http://`) nem caminho; a porta é numérica. Entradas fora disso são bloqueadas no formulário de Ajustes com aviso, antes de tentar conectar. |

## 4. Casos de uso prioritários

- **CU01 — Configurar perfil e broker:** primeira abertura, o usuário informa apelido; o broker já vem pré-preenchido e pode ser editado.
- **CU02 — Criar conversa:** o usuário cria uma conversa com nome e tópico; o app passa a assinar o tópico.
- **CU03 — Conversar em tempo real:** o usuário abre uma conversa, envia mensagens e recebe as dos outros participantes do mesmo tópico.

## 5. Critérios de aceite
- Apelido pedido na primeira abertura e persistido.
- Conexão estabelecida e status exibido corretamente.
- Conversa criada aparece na lista e seu tópico passa a ser assinado.
- Mensagem enviada aparece à direita; mensagem recebida de outro participante aparece à esquerda com o apelido do remetente.
- Mensagens persistem após fechar e reabrir o app.
- Nenhuma mensagem duplicada pelo eco do próprio envio.
- Excluir uma conversa a remove da lista, apaga seu histórico e cancela a assinatura do tópico.
- Tópico inválido (vazio, com espaço ou com `#`/`+`) e mensagem vazia são bloqueados com aviso.
- Broker inválido não derruba o app: o status vira `error` e os Ajustes continuam acessíveis para corrigir o endereço.

## 6. Dependências entre requisitos
- RF03 depende de RF01/RF02 (precisa de apelido e broker).
- RF08 e RF09 dependem de RF03 (conexão ativa) e RF05 (conversa existente).
- RF10 depende de RF08/RF09.

## 7. Pedido para o Agente Arquiteto
Organize, identifique inconsistências e aponte lacunas que precisam de decisão
antes do desenvolvimento.
