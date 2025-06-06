import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout, Eye, EyeOff, Check, X } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password strength requirements
  const requirements = [
    { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
    { label: "Contains uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "Contains lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "Contains number", test: (pwd: string) => /\d/.test(pwd) },
    { label: "Contains special character", test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For registration, validate password requirements and matching
    if (!isLogin) {
      const allRequirementsMet = requirements.every(req => req.test(password));
      if (!allRequirementsMet || !passwordsMatch) {
        return;
      }
    }
    
    // Redirect to Replit auth
    window.location.href = "/api/login";
  };

  // Check if form is valid for submission
  const isFormValid = isLogin || (
    requirements.every(req => req.test(password)) && passwordsMatch
  );

  return (
    <div className="min-h-screen bg-beige-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sprout className="text-sage-600 text-4xl mr-3" />
            <h1 className="text-4xl font-display font-bold text-black">ReflectAI</h1>
          </div>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-black">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="mt-1 border-beige-300 focus:ring-sage-500 focus:border-sage-500"
                    required
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-black">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="mt-1 border-beige-300 focus:ring-sage-500 focus:border-sage-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-black">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-beige-300 focus:ring-sage-500 focus:border-sage-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-black">
                      Confirm Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`border-beige-300 focus:ring-sage-500 focus:border-sage-500 pr-10 ${
                          confirmPassword.length > 0 && !passwordsMatch 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : ''
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                      <p className="text-sage-600 text-xs mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Passwords match
                      </p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  {password.length > 0 && (
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
                </>
              )}
              
              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-beige-300 text-sage-500 focus:ring-sage-500" />
                    <span className="ml-2 text-gray-600">Remember me</span>
                  </label>
                  <button type="button" className="text-sage-600 hover:text-sage-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}
              
              <Button
                type="submit"
                disabled={!isFormValid}
                className="w-full bg-sage-500 hover:bg-sage-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 text-base font-medium"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            
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
            Need help? <span className="text-sage-600 hover:text-sage-700 cursor-pointer">Contact Support</span>
          </p>
        </div>
      </div>
    </div>
  );
}