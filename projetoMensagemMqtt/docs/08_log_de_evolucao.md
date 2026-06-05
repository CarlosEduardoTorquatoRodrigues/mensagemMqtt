# Log de evolução do projeto

## 1. Entradas de execução
Formato: Data | Agente | Versão do prompt | Artefato | Validador | Status

| Data | Agente | Versão | Artefato | Validador | Status |
|---|---|---|---|---|---|
| 2026-06-03 | Humano | — | docs/01, docs/02, docs/03 | Rafael | APROVADO |
| 2026-06-03 | Humano | — | docs/04 (contratos) | Rafael | APROVADO |
| 2026-06-03 | Humano | — | docs/05, docs/06, docs/07 (specs de módulo) | Rafael | PRONTO PARA VALIDAÇÃO |
| 2026-06-03 | Humano | — | docs/04 — correções pós-validação (merge do save com DEFAULT_BROKER; dono do descarte do eco; limpeza do AppError e forma de lançamento) | Rafael | APROVADO |
| 2026-06-03 | Humano | — | docs/02 e docs/03 — correções pós-validação (PRAGMA foreign_keys por conexão; RF11 excluir conversa; RN08 validação de tópico; RN09 mensagem não-vazia) e reflexo em docs/05/06 | Rafael | APROVADO |
| 2026-06-03 | Humano | — | Abertura da fase v1.1 (limpar histórico): RF12, RN10, método deleteByConversation no docs/04, docs/05 e docs/06 de módulo, testes no docs/07, glossário e roteiro_alunos_v1.1 | Rafael | PRONTO PARA VALIDAÇÃO |
| 2026-06-03 | Humano | — | Ajustes pós-teste no Codespace: (a) SDK fixada na 54 e import correto do mqtt; (b) web do expo-sqlite exige metro.config.js (.wasm + COOP/COEP) — validado com `expo export -p web`; (c) RNF07/RN11 — broker inválido não derruba o app e Ajustes sempre acessível para corrigir | Rafael | PRONTO PARA VALIDAÇÃO |
| 2026-06-03 | Humano | — | Convenção de testes de frontend fixada (docs/06 §5.0, docs/07, prompt do Agente Front-end, roteiro Etapa 2 passos 7-8): usar @testing-library/react-native (nunca @testing-library/react) + jest-expo + react-test-renderer@19.1.0, com jest.mock de expo-sqlite/mqtt/repositórios/useMqtt. Resolve ERESOLVE (react@18 vs 19) e "Can't access .root on unmounted test renderer" | Rafael | PRONTO PARA VALIDAÇÃO |
| 2026-06-03 | Humano | — | Runner de teste fixado: Jest (jest-expo) via `npm test`; NUNCA vitest (causa "Unexpected token 'typeof'"). Atualizado docs/06 §5.0, docs/07, roteiro (Etapa 5 + erros comuns) e prompt do Agente QA | Rafael | PRONTO PARA VALIDAÇÃO |
| 2026-06-04 | QA | 1.0 | docs/07 + testes de arquitetura, v1.1 back-end e v1.1 front-end (`npm test`, `npx tsc --noEmit`) — 35 testes | QA | APROVADO |
| 2026-06-04 | Documentador | 1.0 | Fechamento da fase v1.1: back-end (limpar histórico) e front-end (limpar histórico) implementados/testados; QA real aprovado | GitHub Copilot | CONCLUÍDO |
| 2026-06-03 | Humano | — | RNF08: teclado do celular cobria o TextInput no Chat. ChatScreen passa a usar KeyboardAvoidingView + FlatList (keyboardShouldPersistTaps). Atualizado docs/02 (RNF08), docs/06 (ChatScreen, experiência, validação manual, critérios) e prompt do Agente Front-end | Rafael | PRONTO PARA VALIDAÇÃO |

> As próximas entradas são preenchidas pelos agentes durante a prática (back-end,
> front-end, QA) e consolidadas pelo Documentador ao fim do ciclo.

## 2. Status por módulo
| Módulo | Versão | Implementação | Testes | Agente responsável |
|---|---|---|---|---|
| Dados e mensageria (back-end) | v1.0 | implementado | aprovado | Back-end |
| Conversas e chat (front-end) | v1.0 | implementado | aprovado | Front-end |
| Limpar histórico (back-end) | v1.1 | implementado | aprovado | Back-end |
| Limpar histórico (front-end) | v1.1 | implementado | aprovado | Front-end |

## 3. Pendências ativas
| Tag | Agente que abriu | Data | Status |
|---|---|---|---|
| — | — | — | — |

## 4. Decisões técnicas
| Decisão | Justificativa | Proponente | Aprovador | Data |
|---|---|---|---|---|
| Conexão MQTT única assinando vários tópicos | Uma conexão por conversa é complexidade desnecessária e fonte de erro | Arquiteto | Rafael | 2026-06-03 |
| Pacote `mqtt` (MQTT.js) em vez de paho-mqtt | Único cliente MQTT JS mantido (v5, 2026); alternativas paradas desde 2022 | Arquiteto | Rafael | 2026-06-03 |
| `StyleSheet` em vez de NativeWind | Remove configuração frágil e fonte recorrente de erro | Arquiteto | Rafael | 2026-06-03 |
| Troca de tela por `useState` em vez de React Navigation | Três telas não justificam 5 dependências | Arquiteto | Rafael | 2026-06-03 |
| Broker editável na tela de Ajustes | App é instalado via EAS no celular; usuário precisa trocar broker sem recompilar | Arquiteto | Rafael | 2026-06-03 |
| `PRAGMA foreign_keys = ON` em toda abertura de conexão | É configuração por conexão; sem isso a cascata RN06 falha após a 1ª execução | Arquiteto | Rafael | 2026-06-03 |
| Excluir conversa na v1.0 (RF11) | Torna a cascata RN06 usada e testável; UI trivial (toque longo) | Arquiteto | Rafael | 2026-06-03 |

## 5. Erros e correções
| Falha | Causa | Detectado por | Corrigido por | Evidência |
|---|---|---|---|---|
| — | — | — | — | — |

## 6. Divergências ativas
| ID | Tipo | Agente | Arquivo de origem | Descrição | Status | Decisão final |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

## 7. Histórico de versões
| Tag | Módulos incluídos | Data de fechamento |
|---|---|---|
| v1.0 (fechado) | Dados e mensageria; Conversas e chat | 2026-06-04 |
| v1.1 (fechado) | Limpar histórico (back-end + front-end) | 2026-06-04 |

## 8. Resumo para validação humana
- **Agente responsável:** Agente Documentador
- **Validador humano:** GitHub Copilot
- **Data:** 2026-06-04
- **Itens consolidados neste ciclo:**
	- Back-end (limpar histórico): implementação e testes de exclusão de conversa, repositório deleteByConversation, e manutenção de integridade de dados conforme docs/04 e docs/05.
	- Front-end (limpar histórico): implementação da funcionalidade de limpar histórico no app e verificação de comportamento da interface de Conversas e Chat conforme docs/06.
	- QA: execução de testes automatizados (`npm test`, `npx tsc --noEmit`) e verificação manual de operações de limpeza de histórico; resultado aprovado.
- **Status de validação:** APROVADO POR QA

ASSINATURA: Agente Documentador | 2026-06-04 | v1.0
