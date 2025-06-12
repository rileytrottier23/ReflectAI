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
            <Sprout className="text-sage-600 h-12 w-12 mr-3" />
            <h1 className="text-4xl font-display font-bold text-black">ReflectAI</h1>
          </div>
          <p className="text-gray-700 text-lg">Your personal journaling companion</p>
        </div>

        {/* Auth Card */}
        <Card className="border-beige-300 bg-white shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-display font-semibold text-black">
              Sign in with Replit
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              ReflectAI uses Replit's secure authentication system
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">How to get started:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Click "Continue with Replit" below</li>
                <li>Create a free Replit account if you don't have one</li>
                <li>Return to ReflectAI and start journaling</li>
              </ol>
            </div>
            
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="w-full bg-sage-500 hover:bg-sage-600 text-white py-3 text-base font-medium"
              >
                Continue with Replit
              </Button>
            </div>
            
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