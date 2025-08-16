import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

interface LoginProps {
  brandConfig?: any;
}

export default function Login({ brandConfig }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    confirmPassword: ""
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  
  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  useEffect(() => {
    // Apply brand colors to login page
    if (brandConfig) {
      document.documentElement.style.setProperty('--brand-primary', brandConfig.primaryColor || '#4A90E2');
      document.documentElement.style.setProperty('--brand-secondary', brandConfig.secondaryColor || '#BB86FC');
    }
  }, [brandConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isLogin) {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match.",
            variant: "destructive",
          });
          return;
        }
        
        // Register new user
        const registerResponse = await apiRequest("POST", "/api/auth/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          brandConfig: brandConfig || {}
        });
        
        if (!registerResponse.ok) {
          const error = await registerResponse.json();
          throw new Error(error.message || "Registration failed");
        }

        toast({
          title: "Registration successful!",
          description: "Please log in with your new account.",
        });
        
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        return;
      }

      // Login user
      const loginResponse = await apiRequest("POST", "/api/auth/login", {
        username: formData.username,
        password: formData.password
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.message || "Login failed");
      }

      const result = await loginResponse.json();
      
      // Update user context with token
      login(result.user, result.token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${result.user.username}`,
      });

      // Redirect to intended page
      navigate(from, { replace: true });
      
    } catch (error: any) {
      toast({
        title: isLogin ? "Login failed" : "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: brandConfig?.loginBackgroundUrl 
          ? `url(${brandConfig.loginBackgroundUrl}) center/cover`
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      
      <Card className="relative z-10 w-full max-w-md p-8 bg-[#1E1E2F]/95 backdrop-blur-sm border-gray-700">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          {brandConfig?.logoUrl ? (
            <img 
              src={brandConfig.logoUrl} 
              alt="Logo" 
              className="h-12 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-[#4A90E2] to-[#BB86FC] flex items-center justify-center">
              <LogIn size={24} className="text-white" />
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {brandConfig?.appName || "StaffTrak"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-200">Username</Label>
            <Input
              id="username"
              data-testid="input-username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Enter your username"
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Email field (registration only) */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                required
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[var(--brand-primary)]"
              />
            </div>
          )}

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">Password</Label>
            <div className="relative">
              <Input
                id="password"
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter your password"
                required
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[var(--brand-primary)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password field (registration only) */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                required
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[var(--brand-primary)]"
              />
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            data-testid="button-submit"
            disabled={isLoading}
            className="w-full text-white font-medium"
            style={{
              backgroundColor: 'var(--brand-primary)',
              borderColor: 'var(--brand-primary)'
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                {isLogin ? "Sign In" : "Create Account"}
              </div>
            )}
          </Button>

          {/* Toggle between login and register */}
          <div className="text-center pt-4">
            <button
              type="button"
              data-testid="button-toggle-mode"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
              }}
              className="text-sm text-gray-400 hover:text-[var(--brand-primary)] transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-medium">Sign up</span></>
              ) : (
                <>Already have an account? <span className="font-medium">Sign in</span></>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}