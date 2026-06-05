# Glossário de domínio

## 1. Termos do negócio

| Termo | Definição | Sinônimos proibidos | Exemplo de uso |
|---|---|---|---|
| Conversa | Uma sala de troca de mensagens, associada a um único tópico MQTT. | "chat", "canal", "grupo" | "Crie uma conversa com o tópico `sala/futebol`." |
| Mensagem | Um texto enviado ou recebido dentro de uma conversa. | "post", "recado" | "A mensagem foi salva no histórico." |
| Apelido | Nome de exibição do usuário, mostrado como remetente. | "username", "login", "nick" | "O apelido aparece nas mensagens enviadas." |
| Broker | Servidor MQTT que roteia mensagens entre quem publica e quem assina. | "servidor", "host" (isolado) | "O broker padrão é `broker.hivemq.com`." |
| Status da conexão | Estado atual da ligação com o broker. | "estado", "conexão" (isolado) | "O status mudou para conectado." |
| Limpar histórico | *(v1.1)* Apagar todas as mensagens de uma conversa, mantendo a conversa e a assinatura do tópico. | "apagar conversa", "excluir conversa" | "Limpar o histórico não remove a conversa." |
| Excluir conversa | Remover a conversa, seu histórico e cancelar a assinatura do tópico. | "limpar conversa" | "Excluir a conversa some com ela da lista." |
| Renomear conversa | *(v1.2)* Alterar o nome de exibição de uma conversa sem modificar o tópico MQTT, o histórico ou a assinatura. | "editar conversa", "atualizar conversa" | "Renomear não muda o tópico da conversa." |

## 2. Termos técnicos

| Termo | Definição | Contexto de uso |
|---|---|---|
| Tópico (topic) | String hierárquica MQTT que identifica o canal de uma conversa. | `conversations.topic`; usado em subscribe/publish. |
| Publicar (publish) | Enviar uma mensagem a um tópico no broker. | `MqttService.publish`. |
| Assinar (subscribe) | Registrar interesse em receber mensagens de um tópico. | `MqttService.subscribe`. |
| Payload | Conteúdo JSON trafegado em uma mensagem MQTT. | Tipo `MqttPayload` no `04`. |
| clientId | Identificador único de cada instância do app na conexão MQTT. | Evita duplicar o eco da própria mensagem (RN04). |
| WSS | WebSocket seguro (TLS). Transporte do MQTT neste app. | URL `wss://host:port/mqtt`. |
| Eco | A própria mensagem publicada retornando ao app por estar assinado no mesmo tópico. | Ignorado quando o `clientId` é o próprio. |

## 3. Convenções de nomenclatura
- Tabelas e colunas do banco: `snake_case` (`broker_host`, `created_at`).
- Campos em TypeScript: `camelCase` (`brokerHost`, `createdAt`).
- Arquivos de código: `camelCase.ts` para módulos, `PascalCase.tsx` para componentes/telas.
- Tópicos de conversa: texto livre informado pelo usuário; sugestão de padrão `area/assunto`.

## 4. Termos ambíguos resolvidos

| Termo | Decisão final | Data |
|---|---|---|
| "Conexão" | Refere-se sempre à única conexão MQTT do app; nunca "uma por conversa". | 2026-06-03 |
| "Sala" / "Conversa" | Usar sempre "Conversa" no código e na UI; "sala" só como explicação informal. | 2026-06-03 |
| "Renomear" vs "Editar" | Usar sempre "Renomear" quando a operação altera apenas o `name`; "editar" é genérico e ambíguo. | 2026-06-05 |

## Pedido para o Agente Documentador
Manter consistente. Toda nova definição passa por validação humana.
