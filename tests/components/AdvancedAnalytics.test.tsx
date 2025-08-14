import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { expect, describe, it, beforeEach, jest } from '@jest/globals';

import AdvancedAnalytics from '../../client/src/pages/AdvancedAnalytics';

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockAnalyticsData = {
  projects: {
    total_projects: "7",
    completed_projects: "2",
    active_projects: "5"
  },
  utilization: {
    total_employees: "150",
    assigned_employees: "125"
  },
  equipment: {
    total_equipment: "75",
    assigned_equipment: "60"
  },
  period_days: 30
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdvancedAnalytics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsData,
    } as Response);
  });

  describe('Initial Rendering', () => {
    it('should render analytics page title', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive insights into your operations')).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should render time period selector', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('30 Days')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('should display project analytics correctly', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('metric-total-projects')).toHaveTextContent('7');
        expect(screen.getByTestId('metric-completed-projects')).toHaveTextContent('2');
        expect(screen.getByTestId('metric-active-projects')).toHaveTextContent('5');
      });
    });

    it('should display utilization metrics', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('metric-total-employees')).toHaveTextContent('150');
        expect(screen.getByTestId('metric-assigned-employees')).toHaveTextContent('125');
      });
    });

    it('should display equipment metrics', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('metric-total-equipment')).toHaveTextContent('75');
        expect(screen.getByTestId('metric-assigned-equipment')).toHaveTextContent('60');
      });
    });

    it('should calculate utilization rates correctly', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        // Employee utilization: 125/150 = 83.33%
        expect(screen.getByTestId('rate-employee-utilization')).toHaveTextContent('83%');
        
        // Equipment utilization: 60/75 = 80%
        expect(screen.getByTestId('rate-equipment-utilization')).toHaveTextContent('80%');
      });
    });
  });

  describe('Interactive Features', () => {
    it('should update data when time period changes', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('30 Days')).toBeInTheDocument();
      });

      // Mock response for different time period
      const sevenDayData = { ...mockAnalyticsData, period_days: 7 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sevenDayData,
      } as Response);

      // Change time period
      const selector = screen.getByDisplayValue('30 Days');
      fireEvent.change(selector, { target: { value: '7' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/overview?days=7')
        );
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-refresh-analytics')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('button-refresh-analytics');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('should export data when export button is clicked', async () => {
      // Mock URL.createObjectURL and link creation
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      const mockClick = jest.fn();
      const mockLink = {
        click: mockClick,
        href: '',
        download: '',
        style: { display: '' }
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-export-analytics')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('button-export-analytics');
      fireEvent.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
      expect(mockLink.download).toContain('analytics');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading analytics data')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-retry-analytics')).toBeInTheDocument();
      });
    });

    it('should retry loading data when retry button is clicked', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAnalyticsData,
        } as Response);
      
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-retry-analytics')).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('button-retry-analytics');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('metric-total-projects')).toHaveTextContent('7');
      });
    });

    it('should handle empty/null data gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: null,
          utilization: null,
          equipment: null,
          period_days: 30
        }),
      } as Response);
      
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('metric-total-projects')).toHaveTextContent('0');
        expect(screen.getByTestId('metric-total-employees')).toHaveTextContent('0');
        expect(screen.getByTestId('metric-total-equipment')).toHaveTextContent('0');
      });
    });
  });

  describe('Chart Components', () => {
    it('should render utilization chart when data is available', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByTestId('chart-utilization')).toBeInTheDocument();
      });
    });

    it('should show chart placeholder when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: { total_projects: "0" },
          utilization: { total_employees: "0", assigned_employees: "0" },
          equipment: { total_equipment: "0", assigned_equipment: "0" },
          period_days: 30
        }),
      } as Response);
      
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText('No data available for chart')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display performance indicators', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        // Check for performance indicators based on utilization rates
        expect(screen.getByTestId('performance-employee-utilization')).toBeInTheDocument();
        expect(screen.getByTestId('performance-equipment-utilization')).toBeInTheDocument();
      });
    });

    it('should show appropriate status colors for different utilization rates', async () => {
      // Test high utilization (should be green/good)
      const highUtilizationData = {
        ...mockAnalyticsData,
        utilization: {
          total_employees: "100",
          assigned_employees: "95"
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => highUtilizationData,
      } as Response);

      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        const performanceIndicator = screen.getByTestId('performance-employee-utilization');
        expect(performanceIndicator).toHaveClass('text-green-600');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Analytics time period selector')).toBeInTheDocument();
        expect(screen.getByLabelText('Refresh analytics data')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        const timePeriodSelector = screen.getByDisplayValue('30 Days');
        expect(timePeriodSelector).toBeInTheDocument();
        
        // Simulate keyboard navigation
        timePeriodSelector.focus();
        expect(document.activeElement).toBe(timePeriodSelector);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render properly on mobile screens', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<AdvancedAnalytics />);
      
      await waitFor(() => {
        const container = screen.getByTestId('analytics-container');
        expect(container).toHaveClass('mobile-responsive');
      });
    });
  });
});