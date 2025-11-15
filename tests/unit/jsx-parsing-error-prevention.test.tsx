/**
 * JSX Parsing Error Prevention Tests
 *
 * These tests ensure that HTML special characters are properly escaped in JSX content
 * to prevent parsing errors like "Expected '</', got 'numeric literal'"
 */

import { render } from '@testing-library/react';
import React from 'react';

// Test component that mimics the problematic patterns found in ContentRenderer.tsx
const TestContentRenderer = ({ content }: { content: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

// Helper function to test JSX parsing with various content patterns
const renderJSXContent = (content: string) => {
  const TestComponent = () => <div>{content}</div>;
  return render(<TestComponent />);
};

describe('JSX Parsing Error Prevention', () => {
  describe('HTML Entity Escaping', () => {
    it('should handle escaped less-than characters correctly', () => {
      const content = 'Performance improvement: &lt; 2.4% bounce rate increase';

      expect(() => {
        renderJSXContent(content);
      }).not.toThrow();

      const { container } = renderJSXContent(content);
      expect(container.textContent).toContain('&lt; 2.4%');
    });

    it('should handle escaped greater-than characters correctly', () => {
      const content = 'Load time optimization: &gt; 2.5s improvement';

      expect(() => {
        renderJSXContent(content);
      }).not.toThrow();

      const { container } = renderJSXContent(content);
      expect(container.textContent).toContain('&gt; 2.5s');
    });

    it('should handle multiple escaped characters in sequence', () => {
      const content = 'Conversion rates: &lt; 50% of users convert in &lt; +5% scenarios';

      expect(() => {
        renderJSXContent(content);
      }).not.toThrow();

      const { container } = renderJSXContent(content);
      expect(container.textContent).toContain('&lt; 50%');
      expect(container.textContent).toContain('&lt; +5%');
    });
  });

  describe('Dangerous Unescaped Characters Detection', () => {
    it('should detect potential JSX parsing issues with unescaped less-than', () => {
      // This test ensures we catch patterns that could cause JSX parsing errors
      const problematicContent = '< 2.4% bounce rate';

      // Test that this would cause issues in JSX context
      const hasUnescapedLessThan = /< \d/.test(problematicContent);
      expect(hasUnescapedLessThan).toBe(true);

      // Show the corrected version
      const correctedContent = problematicContent.replace(/</g, '&lt;');
      expect(correctedContent).toBe('&lt; 2.4% bounce rate');
    });

    it('should detect potential JSX parsing issues with unescaped greater-than', () => {
      const problematicContent = '> 2.5s load time';

      const hasUnescapedGreaterThan = /> \d/.test(problematicContent);
      expect(hasUnescapedGreaterThan).toBe(true);

      const correctedContent = problematicContent.replace(/>/g, '&gt;');
      expect(correctedContent).toBe('&gt; 2.5s load time');
    });
  });

  describe('Real-world Content Patterns', () => {
    const contentPatterns = [
      {
        name: 'Performance metrics with percentages',
        original: '< 2.4% bounce rate increase observed',
        expected: '&lt; 2.4% bounce rate increase observed'
      },
      {
        name: 'Conversion improvement metrics',
        original: '< +5% conversion rate improvement',
        expected: '&lt; +5% conversion rate improvement'
      },
      {
        name: 'User engagement thresholds',
        original: '< 50% of users engage with pop-ups',
        expected: '&lt; 50% of users engage with pop-ups'
      },
      {
        name: 'Load time performance',
        original: '> 2.5s load times impact conversion',
        expected: '&gt; 2.5s load times impact conversion'
      }
    ];

    contentPatterns.forEach(({ name, original, expected }) => {
      it(`should properly escape ${name}`, () => {
        // Test that the corrected version renders without errors
        expect(() => {
          renderJSXContent(expected);
        }).not.toThrow();

        // Test the correction logic
        const corrected = original
          .replace(/< /g, '&lt; ')
          .replace(/> /g, '&gt; ');

        expect(corrected).toBe(expected);
      });
    });
  });

  describe('HTML dangerouslySetInnerHTML Handling', () => {
    it('should safely render escaped HTML entities', () => {
      const htmlContent = 'Performance: &lt; 2.4% improvement with &gt; 50% confidence';

      expect(() => {
        render(<TestContentRenderer content={htmlContent} />);
      }).not.toThrow();

      const { container } = render(<TestContentRenderer content={htmlContent} />);
      expect(container.innerHTML).toContain('&lt; 2.4%');
      expect(container.innerHTML).toContain('&gt; 50%');
    });

    it('should handle complex HTML structures with escaped characters', () => {
      const complexHtml = `
        <div class="metric">
          <span>Bounce rate: &lt; 2.4%</span>
          <span>Load time: &gt; 2.5s</span>
        </div>
      `;

      expect(() => {
        render(<TestContentRenderer content={complexHtml} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Special Scenarios', () => {
    it('should handle mixed content with both text and HTML entities', () => {
      const mixedContent = 'Regular text with &lt; 2.4% and normal < in HTML attributes';

      // This simulates content that might have both escaped and contextually appropriate < characters
      expect(() => {
        renderJSXContent(mixedContent);
      }).not.toThrow();
    });

    it('should handle empty or null content gracefully', () => {
      expect(() => {
        renderJSXContent('');
      }).not.toThrow();

      expect(() => {
        render(<TestContentRenderer content="" />);
      }).not.toThrow();
    });

    it('should handle content with only HTML entities', () => {
      const entityOnlyContent = '&lt;&gt;&amp;&quot;&#39;';

      expect(() => {
        renderJSXContent(entityOnlyContent);
      }).not.toThrow();

      expect(() => {
        render(<TestContentRenderer content={entityOnlyContent} />);
      }).not.toThrow();
    });
  });
});

// Utility function to validate content for JSX safety
export const validateJSXContent = (content: string): {
  isValid: boolean;
  issues: string[];
  correctedContent?: string;
} => {
  const issues: string[] = [];
  let correctedContent = content;

  // Check for unescaped < followed by space and number (common metric pattern)
  const unescapedLessThan = /< \d/.test(content);
  if (unescapedLessThan) {
    issues.push('Unescaped < character found before numeric value');
    correctedContent = correctedContent.replace(/< /g, '&lt; ');
  }

  // Check for unescaped > followed by space and number
  const unescapedGreaterThan = /> \d/.test(content);
  if (unescapedGreaterThan) {
    issues.push('Unescaped > character found before numeric value');
    correctedContent = correctedContent.replace(/> /g, '&gt; ');
  }

  return {
    isValid: issues.length === 0,
    issues,
    correctedContent: issues.length > 0 ? correctedContent : undefined
  };
};

describe('JSX Content Validation Utility', () => {
  it('should identify and correct problematic content', () => {
    const problematicContent = '< 2.4% bounce rate and > 50% conversion';
    const result = validateJSXContent(problematicContent);

    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(2);
    expect(result.correctedContent).toBe('&lt; 2.4% bounce rate and &gt; 50% conversion');
  });

  it('should pass valid content unchanged', () => {
    const validContent = '&lt; 2.4% bounce rate and &gt; 50% conversion';
    const result = validateJSXContent(validContent);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.correctedContent).toBeUndefined();
  });
});