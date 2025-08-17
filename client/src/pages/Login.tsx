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
      console.log("Login successful:", result);
      
      // Update user context with token (user first, then token)
      login(result.user, result.token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${result.user.username}`,
      });

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
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
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background: brandConfig?.loginBackgroundUrl 
          ? `url(${brandConfig.loginBackgroundUrl}) center/cover`
          : 'linear-gradient(135deg, #0a0f1c 0%, #1a1f2e 25%, #2d1b69 50%, #1e293b 75%, #0f172a 100%)'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-40">
          <div className="grid-pattern"></div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
      
      {/* Main login card with advanced styling */}
      <div className="relative z-10 w-full max-w-md">
        {/* Outer glow container */}
        <div className="relative p-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 shadow-2xl">
          <Card className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-0 rounded-2xl shadow-2xl overflow-hidden">
            {/* Inner gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl"></div>
            
            {/* Content container */}
            <div className="relative p-8">
              {/* Logo and branding with enhanced styling */}
              <div className="text-center mb-8">
                {brandConfig?.logoUrl ? (
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-lg"></div>
                    <img 
                      src={brandConfig.logoUrl} 
                      alt="Logo" 
                      className="relative h-16 mx-auto mb-4 object-contain drop-shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-2xl blur-lg scale-110"></div>
                    <div className="relative h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#4A90E2] via-[#667eea] to-[#BB86FC] flex items-center justify-center shadow-2xl">
                      <LogIn size={28} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}
                
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2 tracking-tight">
                  {brandConfig?.appName || "StaffTrak"}
                </h1>
                <p className="text-gray-300 text-sm font-medium">
                  {isLogin ? "Welcome back to your workspace" : "Join our professional platform"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username field with enhanced styling */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-200 font-medium text-sm">Username</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none group-focus-within:scale-105 transition-all duration-300"></div>
                    <Input
                      id="username"
                      data-testid="input-username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="Enter your username"
                      required
                      className="relative bg-gray-800/80 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-300 hover:bg-gray-700/80"
                    />
                  </div>
                </div>

                {/* Email field (registration only) with enhanced styling */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200 font-medium text-sm">Email Address</Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none group-focus-within:scale-105 transition-all duration-300"></div>
                      <Input
                        id="email"
                        data-testid="input-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className="relative bg-gray-800/80 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-300 hover:bg-gray-700/80"
                      />
                    </div>
                  </div>
                )}

                {/* Password field with enhanced styling */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 font-medium text-sm">Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none group-focus-within:scale-105 transition-all duration-300"></div>
                    <div className="relative">
                      <Input
                        id="password"
                        data-testid="input-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="relative bg-gray-800/80 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 px-4 pr-12 transition-all duration-300 hover:bg-gray-700/80"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-700/50"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm password field (registration only) with enhanced styling */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-200 font-medium text-sm">Confirm Password</Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none group-focus-within:scale-105 transition-all duration-300"></div>
                      <Input
                        id="confirmPassword"
                        data-testid="input-confirm-password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="relative bg-gray-800/80 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-300 hover:bg-gray-700/80"
                      />
                    </div>
                  </div>
                )}

                {/* Enhanced submit button with gradients and animations */}
                <div className="pt-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl blur group-hover:blur-lg transition-all duration-300 opacity-70 group-hover:opacity-100"></div>
                    <Button
                      type="submit"
                      data-testid="button-submit"
                      disabled={isLoading}
                      className="relative w-full h-12 text-white font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 border-0 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-sm">{isLogin ? "Signing in..." : "Creating account..."}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {isLogin ? <LogIn size={18} className="drop-shadow-lg" /> : <UserPlus size={18} className="drop-shadow-lg" />}
                          <span className="text-sm font-semibold tracking-wide">
                            {isLogin ? "Sign In" : "Create Account"}
                          </span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhanced toggle between login and register */}
                <div className="text-center pt-6">
                  <button
                    type="button"
                    data-testid="button-toggle-mode"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
                    }}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-all duration-200 font-medium group"
                  >
                    {isLogin ? (
                      <>
                        Don't have an account?{" "}
                        <span className="text-blue-400 group-hover:text-blue-300 group-hover:underline transition-all duration-200">
                          Sign up
                        </span>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <span className="text-blue-400 group-hover:text-blue-300 group-hover:underline transition-all duration-200">
                          Sign in
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}