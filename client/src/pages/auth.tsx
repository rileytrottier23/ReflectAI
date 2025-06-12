import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout, Eye, EyeOff, Check, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/\d/, "Password must contain a number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain a special character"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Auth() {
  const [location] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Check URL parameter to determine if we should show register form
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [location]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to log in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      console.log("Attempting registration with:", { email: data.email });
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: (userData) => {
      console.log("Registration successful:", userData);
      toast({
        title: "Welcome to ReflectAI!",
        description: "Your account has been created successfully",
        variant: "default",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Unable to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const password = isLogin ? loginForm.watch("password") : registerForm.watch("password");

  // Password strength requirements for registration
  const requirements = [
    { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
    { label: "Contains uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "Contains lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "Contains number", test: (pwd: string) => /\d/.test(pwd) },
    { label: "Contains special character", test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  return (
    <div className="min-h-screen bg-beige-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center mb-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Sprout className="text-sage-600 h-12 w-12 mr-3" />
              <h1 className="text-4xl font-display font-bold text-black">ReflectAI</h1>
            </div>
          </Link>
          <p className="text-gray-700 text-lg">Your personal journaling companion</p>
        </div>

        {/* Auth Card */}
        <Card className="border-beige-300 bg-white shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-display font-semibold text-black">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              {isLogin 
                ? "Sign in to continue your journaling journey" 
                : "Start your mindful reflection practice"
              }
            </p>
          </CardHeader>
          
          <CardContent>
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-black">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    {...loginForm.register("email")}
                    placeholder="Enter your email"
                    type="email"
                    className="mt-1 border-beige-300 focus:ring-sage-500 focus:border-sage-500"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-black">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register("password")}
                      placeholder="Enter your password"
                      className="border-beige-300 focus:ring-sage-500 focus:border-sage-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-sage-500 hover:bg-sage-600 text-white py-3 text-base font-medium"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-black">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    {...registerForm.register("email")}
                    placeholder="Enter your email"
                    type="email"
                    className="mt-1 border-beige-300 focus:ring-sage-500 focus:border-sage-500"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-black">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...registerForm.register("password")}
                      placeholder="Create a strong password"
                      className="border-beige-300 focus:ring-sage-500 focus:border-sage-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Password Requirements */}
                {password && password.length > 0 && (
                  <div className="bg-beige-100 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-black mb-2">Password Requirements:</h4>
                    <div className="space-y-1">
                      {requirements.map((req, index) => {
                        const isMet = req.test(password);
                        return (
                          <div key={index} className="flex items-center text-xs">
                            {isMet ? (
                              <Check className="w-3 h-3 text-sage-600 mr-2" />
                            ) : (
                              <X className="w-3 h-3 text-gray-400 mr-2" />
                            )}
                            <span className={isMet ? 'text-sage-600' : 'text-gray-600'}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-sage-500 hover:bg-sage-600 text-white py-3 text-base font-medium"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <span className="text-gray-600 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sage-600 hover:text-sage-700 font-medium text-sm"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-beige-300">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Your data is secure and encrypted.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Need help? <Link href="/contact"><span className="text-sage-600 hover:text-sage-700 cursor-pointer">Contact Support</span></Link>
          </p>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-beige-300">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © 2025 ReflectAI. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy-policy">
                <span className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/contact">
                <span className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
                  Contact Support
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}