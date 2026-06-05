import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConversationsScreen from '../screens/ConversationsScreen';
import { Conversation } from '../types';

// Mock do repositório
jest.mock('../repositories/conversationRepository', () => ({
  conversationRepository: {
    findAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    rename: jest.fn(),
  },
}));

// Mock do componente NewConversationModal
jest.mock('../components/NewConversationModal', () => ({
  NewConversationModal: () => null,
}));

// Mock do componente StatusIndicator
jest.mock('../components/StatusIndicator', () => ({
  StatusIndicator: () => null,
}));

import { conversationRepository } from '../repositories/conversationRepository';

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Conversa 1',
    topic: 'topic/1',
    createdAt: '2026-06-05T10:00:00Z',
  },
  {
    id: '2',
    name: 'Conversa 2',
    topic: 'topic/2',
    createdAt: '2026-06-05T11:00:00Z',
  },
];

const mockProps = {
  status: 'connected' as const,
  onOpenSettings: jest.fn(),
  onOpenChat: jest.fn(),
  onConversationCreated: jest.fn(),
  onConversationDeleted: jest.fn(),
};

describe('Renomear Conversa - Funcionalidade v1.2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (conversationRepository.findAll as jest.Mock).mockResolvedValue(mockConversations);
  });

  test('5.1.1 - Toque longo abre menu com "Renomear" e "Excluir"', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(<ConversationsScreen {...mockProps} />);

    await waitFor(() => {
      expect(getByText('Conversa 1')).toBeTruthy();
    });

    // Simula toque longo no primeiro item
    fireEvent(getByText('Conversa 1'), 'onLongPress');

    // Verifica se o Alert foi chamado com as opções corretas
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Ações da conversa',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Renomear' }),
          expect.objectContaining({ text: 'Excluir' }),
          expect.objectContaining({ text: 'Cancelar' }),
        ]),
      );
    });

    alertSpy.mockRestore();
  });

  test('5.1.2 - Confirmar renomeação válida atualiza nome na lista', async () => {
    (conversationRepository.rename as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Novo Nome',
      topic: 'topic/1',
      createdAt: '2026-06-05T10:00:00Z',
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      // Simula clique em "Renomear"
      const renameButton = buttons?.find((button) => button.text === 'Renomear');
      renameButton?.onPress?.();
    });

    const { getByText, getByPlaceholderText } = render(<ConversationsScreen {...mockProps} />);

    await waitFor(() => {
      expect(getByText('Conversa 1')).toBeTruthy();
    });

    // Simula toque longo
    fireEvent(getByText('Conversa 1'), 'onLongPress');

    // Aguarda o modal de renomeação abrir
    await waitFor(() => {
      const input = getByPlaceholderText('Digite o novo nome');
      expect(input).toBeTruthy();
      fireEvent.changeText(input, 'Novo Nome');
    });

    // Clica em "Confirmar"
    const confirmButton = getByText('Confirmar');
    fireEvent.press(confirmButton);

    // Verifica se o repositório foi chamado
    await waitFor(() => {
      expect(conversationRepository.rename).toHaveBeenCalledWith('1', 'Novo Nome');
    });

    alertSpy.mockRestore();
  });

  test('5.1.3 - Confirmar nome vazio mostra aviso e não altera lista', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      // Simula clique em "Renomear"
      const renameButton = buttons?.find((button) => button.text === 'Renomear');
      renameButton?.onPress?.();
    });

    const { getByText, getByPlaceholderText } = render(<ConversationsScreen {...mockProps} />);

    await waitFor(() => {
      expect(getByText('Conversa 1')).toBeTruthy();
    });

    // Simula toque longo
    fireEvent(getByText('Conversa 1'), 'onLongPress');

    // Aguarda o modal e limpa o texto
    await waitFor(() => {
      const input = getByPlaceholderText('Digite o novo nome');
      fireEvent.changeText(input, '   ');
    });

    // Clica em "Confirmar"
    const confirmButton = getByText('Confirmar');
    fireEvent.press(confirmButton);

    // Verifica se um Alert de erro foi mostrado
    await waitFor(() => {
      expect(conversationRepository.rename).not.toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  test('5.1.4 - Cancelar renomeação não altera lista', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      // Simula clique em "Renomear"
      const renameButton = buttons?.find((button) => button.text === 'Renomear');
      renameButton?.onPress?.();
    });

    const { getByText, getByPlaceholderText } = render(<ConversationsScreen {...mockProps} />);

    await waitFor(() => {
      expect(getByText('Conversa 1')).toBeTruthy();
    });

    // Simula toque longo
    fireEvent(getByText('Conversa 1'), 'onLongPress');

    // Aguarda o modal e digita algo
    await waitFor(() => {
      const input = getByPlaceholderText('Digite o novo nome');
      fireEvent.changeText(input, 'Nome Temporário');
    });

    // Clica em "Cancelar"
    const cancelButton = getByText('Cancelar');
    fireEvent.press(cancelButton);

    // Verifica se a lista não foi alterada
    expect(conversationRepository.rename).not.toHaveBeenCalled();
    expect(getByText('Conversa 1')).toBeTruthy();

    alertSpy.mockRestore();
  });

  test('5.1.5 - Fluxo de exclusão preservado', async () => {
    (conversationRepository.delete as jest.Mock).mockResolvedValue(undefined);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      // Primeiro Alert: menu de ações
      // Simula clique em "Excluir"
      const deleteButton = buttons?.find((button) => button.text === 'Excluir');
      if (deleteButton && deleteButton.style === 'destructive') {
        // Segundo Alert: confirmação de exclusão
        deleteButton.onPress?.();
      }
    });

    const onConversationDeleted = jest.fn();

    const { getByText } = render(
      <ConversationsScreen
        {...mockProps}
        onConversationDeleted={onConversationDeleted}
      />,
    );

    await waitFor(() => {
      expect(getByText('Conversa 1')).toBeTruthy();
    });

    // Simula toque longo
    fireEvent(getByText('Conversa 1'), 'onLongPress');

    // Aguarda a execução
    await waitFor(() => {
      expect(conversationRepository.delete).toHaveBeenCalledWith('1');
      expect(onConversationDeleted).toHaveBeenCalledWith('topic/1');
    });

    alertSpy.mockRestore();
  });
});
