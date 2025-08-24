import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { CreditCard, DollarSign, Calendar, Users, Building, Wrench } from "lucide-react";

import { billingUtils } from "@/lib/billing";

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    
    try {
      await billingUtils.createCheckout(email, name);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          data-testid="input-billing-email"
        />
      </div>
      
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="John Doe"
          data-testid="input-billing-name"
        />
      </div>

      <Button 
        type="submit" 
        disabled={processing}
        className="w-full"
        data-testid="button-create-subscription"
      >
        {processing ? "Creating..." : "Subscribe with Stripe Checkout"}
      </Button>
    </form>
  );
};

export default function BillingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingStatus, isLoading } = useQuery({
    queryKey: ["/api/billing/status"],
    queryFn: () => 
      fetch("/api/billing/status")
        .then(res => res.json())
  });

  const { data: usage } = useQuery({
    queryKey: ["/api/billing/usage"],
    queryFn: () => 
      fetch("/api/billing/usage")
        .then(res => res.json())
  });

  const handleSubscriptionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/billing/usage"] });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your subscription and usage</p>
      </div>

      {/* Stripe Configuration Status */}
      {!billingStatus?.stripe_configured && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-200">
                Stripe is not configured. Contact your administrator to set up billing.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billingStatus?.has_customer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge 
                    variant={billingStatus.subscription?.status === 'active' ? 'default' : 'destructive'}
                    data-testid="badge-subscription-status"
                  >
                    {billingStatus.subscription?.status || 'No subscription'}
                  </Badge>
                </div>
                
                {billingStatus.subscription && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Current Period:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(billingStatus.subscription.current_period_start).toLocaleDateString()} - 
                        {new Date(billingStatus.subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Auto-renew:</span>
                      <span>{billingStatus.subscription.cancel_at_period_end ? 'No' : 'Yes'}</span>
                    </div>
                    
                    <Button 
                      onClick={() => billingUtils.openPortal()}
                      variant="outline"
                      className="w-full mt-4"
                      data-testid="button-manage-billing"
                    >
                      Manage Billing
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  No active subscription found.
                </p>
                
                {billingStatus?.stripe_configured && (
                  <CheckoutForm onSuccess={handleSubscriptionSuccess} />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Current Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usage?.current_usage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>Projects:</span>
                  </div>
                  <span className="font-medium" data-testid="text-usage-projects">
                    {usage.current_usage.projects}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Employees:</span>
                  </div>
                  <span className="font-medium" data-testid="text-usage-employees">
                    {usage.current_usage.employees}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4" />
                    <span>Equipment:</span>
                  </div>
                  <span className="font-medium" data-testid="text-usage-equipment">
                    {usage.current_usage.equipment}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No usage data available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Billing history will appear here once you have an active subscription.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}