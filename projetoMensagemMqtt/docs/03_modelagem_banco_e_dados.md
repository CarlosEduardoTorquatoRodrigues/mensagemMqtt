# Modelagem de banco de dados
Status: APROVADO

## 1. Entidades principais

| Tabela | Função no sistema |
|---|---|
| `settings` | Guarda o perfil do usuário e a configuração do broker. Tem sempre uma única linha. |
| `conversations` | Cada linha é uma conversa (uma sala). Define o tópico MQTT correspondente. |
| `messages` | Histórico de mensagens, cada uma vinculada a uma conversa. |

## 2. Relacionamentos
- `conversations` 1 → N `messages`: uma conversa tem muitas mensagens.
- `messages.conversation_id` é chave estrangeira para `conversations.id`,
  com `ON DELETE CASCADE` (apagar a conversa apaga suas mensagens — RN06).
- `settings` não se relaciona com as demais; é configuração global do app.

## 3. Normalização e justificativa
Modelo na 3FN, simples e suficiente. O apelido fica em `settings` (não em cada
mensagem) porque é do dono do app; o campo `sender` em `messages` guarda o
apelido de quem publicou, necessário para exibir mensagens recebidas de outros.

## 4. Padrões obrigatórios
- Chaves primárias `id` do tipo `TEXT`, preenchidas com UUID v4 (`expo-crypto`).
- Datas em `TEXT` no formato ISO 8601 (`new Date().toISOString()`).
- Booleanos em `INTEGER` (0 ou 1) — SQLite não tem tipo booleano.
- Nomes de tabela e coluna em `snake_case`.
- Índice em `messages(conversation_id)` para consulta de histórico por conversa.
- `topic` é `UNIQUE` em `conversations` (RN02).
- Versão do schema controlada por `PRAGMA user_version`.

## 5. Estratégia de migração
Na primeira abertura, se `PRAGMA user_version = 0`, criar as tabelas e definir
`user_version = 1`. Migrações futuras incrementam a versão e aplicam o `ALTER`
correspondente. Nesta fase v1.0 só existe a versão 1.

> **Atenção (chaves estrangeiras):** `PRAGMA foreign_keys` é uma configuração
> **por conexão** e volta ao padrão `OFF` toda vez que o app reabre. Por isso ela
> **não** faz parte do script de criação (que roda só uma vez). O `database.ts`
> deve executar `PRAGMA foreign_keys = ON` **em toda abertura de conexão**, antes
> de qualquer operação — caso contrário o `ON DELETE CASCADE` (RN06) não funciona
> nas execuções seguintes à primeira.

## 6. Estados e domínios de valor
- `messages.direction`: `'sent'` ou `'received'`.
- `settings.use_ssl`: `0` ou `1`.

## 7. Script inicial (versão 1)

> Executado **uma única vez**, quando `user_version = 0`. O `PRAGMA foreign_keys = ON`
> NÃO entra aqui — ele roda a cada abertura de conexão (ver seção 5).

```sql
CREATE TABLE IF NOT EXISTS settings (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  nickname    TEXT    NOT NULL,
  broker_host TEXT    NOT NULL,
  broker_port INTEGER NOT NULL,
  use_ssl     INTEGER NOT NULL DEFAULT 1,
  client_id   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  topic      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender          TEXT NOT NULL,
  body            TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  created_at      TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id);
```

## 8. Pedido para o Agente Arquiteto
Analise a modelagem e indique riscos, melhorias e possíveis simplificações.
