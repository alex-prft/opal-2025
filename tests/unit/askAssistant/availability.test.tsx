/**
 * Unit tests for Ask Assistant Availability Logic
 *
 * Tests the context provider and button availability logic to prevent
 * regressions where the button appears disabled despite valid configuration.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AskAssistantProvider, useAskAssistant } from '@/lib/askAssistant/context';
import { AskAssistantButton } from '@/components/ask-assistant/AskAssistantButton';
import { ASK_ASSISTANT_CONFIG } from '@/lib/askAssistant/config';

// Mock the tooltip components to avoid testing complexity
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the modal to avoid testing complexity
jest.mock('@/components/ask-assistant/AskAssistantModal', () => ({
  AskAssistantModal: () => <div data-testid="ask-assistant-modal">Modal</div>,
}));

// Test component to access context
const TestContextConsumer = () => {
  const context = useAskAssistant();
  return (
    <div data-testid="context-data">
      <span data-testid="section-key">{context.sectionKey}</span>
      <span data-testid="is-available">{context.isAvailable.toString()}</span>
      <span data-testid="prompt-config-label">{context.promptConfig?.label || 'null'}</span>
    </div>
  );
};

describe('Ask Assistant Availability Logic', () => {
  describe('AskAssistantProvider', () => {
    it('should provide correct context for strategy:quick-wins section', () => {
      render(
        <AskAssistantProvider sectionKey="strategy:quick-wins" sourcePath="/engine/results/strategy-plans/quick-wins">
          <TestContextConsumer />
        </AskAssistantProvider>
      );

      expect(screen.getByTestId('section-key')).toHaveTextContent('strategy:quick-wins');
      expect(screen.getByTestId('is-available')).toHaveTextContent('true');
      expect(screen.getByTestId('prompt-config-label')).toHaveTextContent('Quick Wins');
    });

    it('should provide correct context for strategy:osa section', () => {
      render(
        <AskAssistantProvider sectionKey="strategy:osa" sourcePath="/engine/results/strategy-plans/osa">
          <TestContextConsumer />
        </AskAssistantProvider>
      );

      expect(screen.getByTestId('section-key')).toHaveTextContent('strategy:osa');
      expect(screen.getByTestId('is-available')).toHaveTextContent('true');
      expect(screen.getByTestId('prompt-config-label')).toHaveTextContent('OSA Strategy Overview');
    });

    it('should mark as unavailable for sections with TODO placeholder', () => {
      // Test with a section that has TODO placeholder
      render(
        <AskAssistantProvider sectionKey="strategy:maturity" sourcePath="/engine/results/strategy-plans/maturity">
          <TestContextConsumer />
        </AskAssistantProvider>
      );

      expect(screen.getByTestId('section-key')).toHaveTextContent('strategy:maturity');
      expect(screen.getByTestId('is-available')).toHaveTextContent('false');
      expect(screen.getByTestId('prompt-config-label')).toHaveTextContent('Maturity Assessment');
    });

    it('should mark as unavailable for non-existent sections', () => {
      render(
        <AskAssistantProvider sectionKey="non-existent:section" sourcePath="/test">
          <TestContextConsumer />
        </AskAssistantProvider>
      );

      expect(screen.getByTestId('section-key')).toHaveTextContent('non-existent:section');
      expect(screen.getByTestId('is-available')).toHaveTextContent('false');
      expect(screen.getByTestId('prompt-config-label')).toHaveTextContent('null');
    });
  });

  describe('AskAssistantButton', () => {
    it('should render enabled button for available section', () => {
      render(
        <AskAssistantProvider sectionKey="strategy:quick-wins" sourcePath="/engine/results/strategy-plans/quick-wins">
          <AskAssistantButton />
        </AskAssistantProvider>
      );

      const button = screen.getByRole('button', { name: /ask assistant/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass('opacity-60');
    });

    it('should render disabled button for section with TODO placeholder', () => {
      render(
        <AskAssistantProvider sectionKey="strategy:maturity" sourcePath="/engine/results/strategy-plans/maturity">
          <AskAssistantButton />
        </AskAssistantProvider>
      );

      const button = screen.getByRole('button', { name: /ask assistant/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-60');
    });

    it('should render disabled button for non-existent section', () => {
      render(
        <AskAssistantProvider sectionKey="non-existent:section" sourcePath="/test">
          <AskAssistantButton />
        </AskAssistantProvider>
      );

      const button = screen.getByRole('button', { name: /ask assistant/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-60');
    });

    it('should handle missing context gracefully', () => {
      // Render button without provider context
      render(<AskAssistantButton />);

      const button = screen.getByRole('button', { name: /ask assistant/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-60');
    });
  });

  describe('Configuration validation', () => {
    it('should have complete configuration for strategy:quick-wins', () => {
      const config = ASK_ASSISTANT_CONFIG['strategy:quick-wins'];

      expect(config).toBeDefined();
      expect(config.id).toBe('strategy-quick-wins');
      expect(config.label).toBe('Quick Wins');
      expect(config.description).toContain('strategic improvements');
      expect(config.expertPromptExample).not.toStartWith('TODO:');
      expect(config.recommendedPrompts).toHaveLength(6);
    });

    it('should have complete configuration for strategy:osa', () => {
      const config = ASK_ASSISTANT_CONFIG['strategy:osa'];

      expect(config).toBeDefined();
      expect(config.id).toBe('strategy-osa');
      expect(config.label).toBe('OSA Strategy Overview');
      expect(config.description).toContain('strategic guidance');
      expect(config.expertPromptExample).not.toStartWith('TODO:');
      expect(config.recommendedPrompts.length).toBeGreaterThan(0);
    });

    it('should identify sections with TODO placeholders', () => {
      const sectionsWithTodo = Object.entries(ASK_ASSISTANT_CONFIG)
        .filter(([, config]) => config.expertPromptExample.startsWith('TODO:'))
        .map(([key]) => key);

      // These sections should have TODO placeholders (incomplete)
      expect(sectionsWithTodo).toContain('strategy:maturity');
      expect(sectionsWithTodo).toContain('strategy:phases');
      expect(sectionsWithTodo).toContain('strategy:roadmap');

      // These sections should NOT have TODO placeholders (complete)
      expect(sectionsWithTodo).not.toContain('strategy:quick-wins');
      expect(sectionsWithTodo).not.toContain('strategy:osa');
    });
  });

  describe('Regression test for specific bug', () => {
    it('should correctly identify strategy:quick-wins as available (not strategy:osa)', () => {
      // This test ensures that the section mapping returns the correct key
      // and that the Quick Wins configuration is properly loaded and available

      render(
        <AskAssistantProvider sectionKey="strategy:quick-wins" sourcePath="/engine/results/strategy-plans/quick-wins">
          <TestContextConsumer />
          <AskAssistantButton />
        </AskAssistantProvider>
      );

      // Verify correct section key
      expect(screen.getByTestId('section-key')).toHaveTextContent('strategy:quick-wins');
      expect(screen.getByTestId('section-key')).not.toHaveTextContent('strategy:osa');

      // Verify correct configuration
      expect(screen.getByTestId('prompt-config-label')).toHaveTextContent('Quick Wins');
      expect(screen.getByTestId('prompt-config-label')).not.toHaveTextContent('OSA Strategy Overview');

      // Verify button is available
      expect(screen.getByTestId('is-available')).toHaveTextContent('true');
      const button = screen.getByRole('button', { name: /ask assistant/i });
      expect(button).not.toBeDisabled();
    });
  });
});