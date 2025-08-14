import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { expect, describe, it, beforeEach, jest } from '@jest/globals';

import BillingSettings from '../../client/src/pages/BillingSettings';

// Mock the billing utilities
jest.mock('../../client/src/lib/billing', () => ({
  billingUtils: {
    openPortal: jest.fn(),
    createCheckout: jest.fn(),
    handleCheckoutSuccess: jest.fn()
  },
  stripeConfig: {
    publicKey: 'pk_test_mock',
    isConfigured: () => true
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock toast hook
const mockToast = jest.fn();
jest.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

const mockBillingStatusNoCustomer = {
  has_customer: false,
  customer: null,
  subscription: null,
  stripe_configured: true
};

const mockBillingStatusWithSubscription = {
  has_customer: true,
  customer: {
    id: 'cus_test123',
    email: 'test@example.com',
    name: 'Test Customer'
  },
  subscription: {
    id: 'sub_test123',
    status: 'active',
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2024-02-01T00:00:00Z',
    cancel_at_period_end: false
  },
  stripe_configured: true
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

describe('BillingSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default billing status response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockBillingStatusNoCustomer,
    } as Response);
  });

  describe('Initial Rendering', () => {
    it('should render billing settings page title', async () => {
      renderWithProviders(<BillingSettings />);
      
      expect(screen.getByText('Billing Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your subscription and billing details')).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      renderWithProviders(<BillingSettings />);
      
      expect(screen.getByText('Loading billing information...')).toBeInTheDocument();
    });
  });

  describe('No Subscription State', () => {
    it('should display subscription form for new customers', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('No active subscription found.')).toBeInTheDocument();
        expect(screen.getByTestId('input-billing-email')).toBeInTheDocument();
        expect(screen.getByTestId('input-billing-name')).toBeInTheDocument();
        expect(screen.getByTestId('button-create-subscription')).toBeInTheDocument();
      });
    });

    it('should validate email field', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-billing-email');
        const nameInput = screen.getByTestId('input-billing-name');
        const submitButton = screen.getByTestId('button-create-subscription');
        
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitButton);
        
        // HTML5 validation should prevent form submission
        expect(emailInput).toBeInvalid();
      });
    });

    it('should validate name field', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-billing-email');
        const nameInput = screen.getByTestId('input-billing-name');
        const submitButton = screen.getByTestId('button-create-subscription');
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);
        
        // Name field is required
        expect(nameInput).toBeInvalid();
      });
    });

    it('should call createCheckout when form is submitted', async () => {
      const { billingUtils } = await import('../../client/src/lib/billing');
      
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-billing-email');
        const nameInput = screen.getByTestId('input-billing-name');
        const submitButton = screen.getByTestId('button-create-subscription');
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.click(submitButton);
        
        expect(billingUtils.createCheckout).toHaveBeenCalledWith('test@example.com', 'Test User');
      });
    });
  });

  describe('Active Subscription State', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockBillingStatusWithSubscription,
      } as Response);
    });

    it('should display subscription details', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Subscription')).toBeInTheDocument();
        expect(screen.getByTestId('subscription-status')).toHaveTextContent('active');
        expect(screen.getByTestId('subscription-start-date')).toBeInTheDocument();
        expect(screen.getByTestId('subscription-end-date')).toBeInTheDocument();
      });
    });

    it('should show customer information', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });
    });

    it('should display manage billing button', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-manage-billing')).toBeInTheDocument();
      });
    });

    it('should call openPortal when manage billing is clicked', async () => {
      const { billingUtils } = await import('../../client/src/lib/billing');
      
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const manageButton = screen.getByTestId('button-manage-billing');
        fireEvent.click(manageButton);
        
        expect(billingUtils.openPortal).toHaveBeenCalled();
      });
    });

    it('should show auto-renew status', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Auto-renew:')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument(); // cancel_at_period_end is false
      });
    });
  });

  describe('Cancelled Subscription State', () => {
    beforeEach(() => {
      const cancelledSubscriptionData = {
        ...mockBillingStatusWithSubscription,
        subscription: {
          ...mockBillingStatusWithSubscription.subscription,
          status: 'canceled'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => cancelledSubscriptionData,
      } as Response);
    });

    it('should display cancelled subscription status', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByTestId('subscription-status')).toHaveTextContent('canceled');
      });
    });

    it('should show reactivation option', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Subscription Cancelled')).toBeInTheDocument();
        expect(screen.getByTestId('button-reactivate-subscription')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when billing status fails to load', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading billing information')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-retry-billing')).toBeInTheDocument();
      });
    });

    it('should handle Stripe not configured', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockBillingStatusNoCustomer,
          stripe_configured: false
        }),
      } as Response);
      
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Stripe billing is not configured')).toBeInTheDocument();
      });
    });

    it('should show error toast when checkout fails', async () => {
      const { billingUtils } = await import('../../client/src/lib/billing');
      (billingUtils.createCheckout as jest.Mock).mockRejectedValueOnce(new Error('Checkout failed'));
      
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-billing-email');
        const nameInput = screen.getByTestId('input-billing-name');
        const submitButton = screen.getByTestId('button-create-subscription');
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to create checkout session',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Subscription Plans', () => {
    it('should display available plans', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Subscription Plans')).toBeInTheDocument();
        expect(screen.getByTestId('plan-starter')).toBeInTheDocument();
        expect(screen.getByTestId('plan-professional')).toBeInTheDocument();
        expect(screen.getByTestId('plan-enterprise')).toBeInTheDocument();
      });
    });

    it('should highlight current plan', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockBillingStatusWithSubscription,
          subscription: {
            ...mockBillingStatusWithSubscription.subscription,
            plan: 'professional'
          }
        }),
      } as Response);

      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const professionalPlan = screen.getByTestId('plan-professional');
        expect(professionalPlan).toHaveClass('current-plan');
      });
    });
  });

  describe('Billing History', () => {
    it('should display recent invoices', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
        expect(screen.getByTestId('invoices-table')).toBeInTheDocument();
      });
    });

    it('should handle empty invoice history', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/invoices')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockBillingStatusNoCustomer,
        } as Response);
      });

      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByText('No invoices found')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render properly on mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const container = screen.getByTestId('billing-container');
        expect(container).toHaveClass('mobile-responsive');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-billing-email');
        const nameInput = screen.getByTestId('input-billing-name');
        const submitButton = screen.getByTestId('button-create-subscription');
        
        // Test tab order
        emailInput.focus();
        expect(document.activeElement).toBe(emailInput);
        
        // Simulate tab to next element
        fireEvent.keyDown(emailInput, { key: 'Tab' });
        expect(document.activeElement).toBe(nameInput);
      });
    });

    it('should announce status changes to screen readers', async () => {
      renderWithProviders(<BillingSettings />);
      
      await waitFor(() => {
        const statusElement = screen.getByTestId('billing-status');
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});