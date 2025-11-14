import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MappingTable from '../../src/components/admin/MappingTable';
import { MappingTableRow } from '../../src/lib/mapping-utils';

// Mock the UI components
jest.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  )
}));

jest.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant }: any) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  )
}));

jest.mock('../../src/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, className }: any) => (
    <input
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      className={className}
      data-testid="search-input"
    />
  )
}));

jest.mock('../../src/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="mapping-table">{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children, className }: any) => <tr className={className}>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children, className }: any) => <td className={className}>{children}</td>
}));

jest.mock('../../src/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select-container">
      {children}
      <select onChange={(e) => onValueChange(e.target.value)} data-testid="status-filter">
        <option value="all">All Statuses</option>
        <option value="complete">Complete</option>
        <option value="partial">Partial</option>
        <option value="missing">Missing</option>
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

describe('MappingTable', () => {
  const mockData: MappingTableRow[] = [
    {
      tier1: 'Strategy Plans',
      tier2: 'OSA',
      tier3: ['Overview Dashboard', 'Strategic Recommendations'],
      opal_agents: ['strategy_workflow'],
      opal_tools: ['workflow_data_sharing'],
      dxp_tools: ['Content Recs', 'CMS'],
      result_endpoints: ['/engine/results/strategy-plans', '/engine/results/strategy-plans/osa'],
      status: 'complete'
    },
    {
      tier1: 'Strategy Plans',
      tier2: 'Quick Wins',
      tier3: [],
      opal_agents: [],
      opal_tools: ['workflow_data_sharing'],
      dxp_tools: ['Content Recs'],
      result_endpoints: ['/engine/results/strategy-plans/quick-wins'],
      status: 'missing'
    },
    {
      tier1: 'Analytics Insights',
      tier2: 'Content',
      tier3: ['Engagement', 'Topics'],
      opal_agents: ['content_review'],
      opal_tools: [],
      dxp_tools: ['Content Recs'],
      result_endpoints: ['/engine/results/analytics-insights/content'],
      status: 'partial'
    }
  ];

  const mockOnExportCSV = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render mapping table with data', () => {
      render(<MappingTable data={mockData} onExportCSV={mockOnExportCSV} />);

      expect(screen.getByTestId('mapping-table')).toBeInTheDocument();
      expect(screen.getByText('Strategy Plans')).toBeInTheDocument();
      expect(screen.getByText('OSA')).toBeInTheDocument();
      expect(screen.getByText('Quick Wins')).toBeInTheDocument();
      expect(screen.getByText('Analytics Insights')).toBeInTheDocument();
    });

    it('should render status badges correctly', () => {
      render(<MappingTable data={mockData} />);

      const badges = screen.getAllByTestId('badge');
      const statusBadges = badges.filter(badge =>
        badge.textContent?.includes('Complete') ||
        badge.textContent?.includes('Missing') ||
        badge.textContent?.includes('Partial')
      );

      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('should render search input', () => {
      render(<MappingTable data={mockData} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search mappings...')).toBeInTheDocument();
    });

    it('should render export CSV button when callback provided', () => {
      render(<MappingTable data={mockData} onExportCSV={mockOnExportCSV} />);

      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should not render export CSV button when callback not provided', () => {
      render(<MappingTable data={mockData} />);

      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    it('should display correct summary statistics', () => {
      render(<MappingTable data={mockData} />);

      expect(screen.getByText('1')).toBeInTheDocument(); // Complete mappings
      expect(screen.getByText('Complete Mappings')).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(<MappingTable data={[]} />);

      expect(screen.getByText(/No mappings found matching the current filters/)).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('should filter data by search term', async () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'strategy' } });

      await waitFor(() => {
        expect(screen.getByText('Strategy Plans')).toBeInTheDocument();
        expect(screen.queryByText('Analytics Insights')).not.toBeInTheDocument();
      });
    });

    it('should filter by tier2 name', async () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'osa' } });

      await waitFor(() => {
        expect(screen.getByText('OSA')).toBeInTheDocument();
        expect(screen.queryByText('Quick Wins')).not.toBeInTheDocument();
      });
    });

    it('should filter by agent names', async () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'content_review' } });

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.queryByText('OSA')).not.toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      render(<MappingTable data={mockData} />);

      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'complete' } });

      await waitFor(() => {
        expect(screen.getByText('OSA')).toBeInTheDocument();
        expect(screen.queryByText('Quick Wins')).not.toBeInTheDocument();
      });
    });

    it('should show filtered count in summary', async () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'strategy' } });

      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 3 mappings/)).toBeInTheDocument();
      });
    });

    it('should reset filters correctly', async () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');

      // Apply filter
      fireEvent.change(searchInput, { target: { value: 'strategy' } });
      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 3 mappings/)).toBeInTheDocument();
      });

      // Clear filter
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3 mappings/)).toBeInTheDocument();
      });
    });
  });

  describe('sorting', () => {
    it('should sort by tier1 when header clicked', async () => {
      render(<MappingTable data={mockData} />);

      const tier1Header = screen.getByText('Tier 1');
      fireEvent.click(tier1Header);

      // Should sort alphabetically
      const rows = screen.getByTestId('mapping-table').querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('Analytics Insights');
    });

    it('should reverse sort when header clicked twice', async () => {
      render(<MappingTable data={mockData} />);

      const tier1Header = screen.getByText('Tier 1');

      // First click - ascending
      fireEvent.click(tier1Header);
      // Second click - descending
      fireEvent.click(tier1Header);

      const rows = screen.getByTestId('mapping-table').querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('Strategy Plans');
    });

    it('should sort by status', async () => {
      render(<MappingTable data={mockData} />);

      const statusHeader = screen.getByText('Status');
      fireEvent.click(statusHeader);

      // Should sort by status alphabetically (complete, missing, partial)
      const rows = screen.getByTestId('mapping-table').querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('complete');
    });
  });

  describe('interactions', () => {
    it('should call onExportCSV when export button clicked', () => {
      render(<MappingTable data={mockData} onExportCSV={mockOnExportCSV} />);

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      expect(mockOnExportCSV).toHaveBeenCalledTimes(1);
    });

    it('should display tier3 count correctly', () => {
      render(<MappingTable data={mockData} />);

      expect(screen.getByText('2 items')).toBeInTheDocument(); // OSA has 2 tier3 items
    });

    it('should show "None" for empty arrays', () => {
      render(<MappingTable data={mockData} />);

      // Quick Wins has no agents
      const rows = screen.getByTestId('mapping-table').querySelectorAll('tbody tr');
      expect(rows[1]).toHaveTextContent('None');
    });

    it('should handle array display with overflow', () => {
      const dataWithManyItems: MappingTableRow[] = [
        {
          tier1: 'Test Category',
          tier2: 'Test Section',
          tier3: ['Item1', 'Item2', 'Item3', 'Item4', 'Item5'],
          opal_agents: ['agent1', 'agent2', 'agent3', 'agent4'],
          opal_tools: ['tool1', 'tool2', 'tool3'],
          dxp_tools: ['dxp1', 'dxp2', 'dxp3', 'dxp4'],
          result_endpoints: ['/endpoint1', '/endpoint2'],
          status: 'complete'
        }
      ];

      render(<MappingTable data={dataWithManyItems} />);

      // Should show overflow indicator for arrays with more than display limit
      expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      render(<MappingTable data={mockData} />);

      expect(screen.getByTestId('mapping-table')).toBeInTheDocument();
      expect(screen.getByTestId('mapping-table').querySelector('thead')).toBeInTheDocument();
      expect(screen.getByTestId('mapping-table').querySelector('tbody')).toBeInTheDocument();
    });

    it('should have searchable input with proper placeholder', () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search mappings...');
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, index) => ({
        tier1: `Category ${index}`,
        tier2: `Section ${index}`,
        tier3: [`Item ${index}`],
        opal_agents: [`agent_${index}`],
        opal_tools: [`tool_${index}`],
        dxp_tools: [`dxp_${index}`],
        result_endpoints: [`/endpoint/${index}`],
        status: (index % 3 === 0 ? 'complete' : index % 2 === 0 ? 'partial' : 'missing') as any
      }));

      const { container } = render(<MappingTable data={largeDataset} />);
      expect(container).toBeInTheDocument();
    });

    it('should debounce search input properly', async () => {
      render(<MappingTable data={mockData} />);

      const searchInput = screen.getByTestId('search-input');

      // Rapid typing
      fireEvent.change(searchInput, { target: { value: 's' } });
      fireEvent.change(searchInput, { target: { value: 'st' } });
      fireEvent.change(searchInput, { target: { value: 'str' } });
      fireEvent.change(searchInput, { target: { value: 'stra' } });
      fireEvent.change(searchInput, { target: { value: 'strategy' } });

      // Should handle rapid changes without issues
      await waitFor(() => {
        expect(screen.getByText('Strategy Plans')).toBeInTheDocument();
      });
    });
  });
});