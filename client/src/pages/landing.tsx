import { Sprout, BookOpen, TrendingUp, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/sign-in");
  };

  const handleRegister = () => {
    setLocation("/sign-up");
  };

  return (
    <div className="min-h-screen bg-beige-200">
      {/* Navigation Header */}
      <header className="bg-sage-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Sprout className="text-white h-10 w-10 mr-4" />
              <h1 className="text-white font-display font-bold text-3xl">ReflectAI</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost"
                onClick={handleLogin}
                className="text-white hover:text-beige-100 font-medium"
              >
                Login
              </Button>
              <Button 
                onClick={handleRegister}
                className="bg-white text-sage-700 hover:bg-beige-100 hover:text-sage-800 font-medium px-6"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-black mb-6">
              Keep your thoughts organized
            </h1>
            <p className="text-lg text-gray-800 mb-8 leading-relaxed">
              ReflectAI helps you record daily reflections and gain insights through personalized analytics and monthly summaries.
            </p>
            
            <Button 
              onClick={handleRegister}
              className="bg-sage-600 hover:bg-sage-700 text-white px-8 py-3 text-lg font-medium"
            >
              Start Journaling
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <BookOpen className="text-sage-600 h-8 w-8 mb-2" />
                <CardTitle className="text-lg font-display text-black">Daily Journaling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Record your daily thoughts and mood with our intuitive journaling interface.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <TrendingUp className="text-sage-600 h-8 w-8 mb-2" />
                <CardTitle className="text-lg font-display text-black">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Monitor your happiness scores and identify patterns over time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <Star className="text-sage-600 h-8 w-8 mb-2" />
                <CardTitle className="text-lg font-display text-black">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Get personalized counselor-style reports powered by AI analysis.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-beige-300 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <Sprout className="text-sage-600 h-8 w-8 mb-2" />
                <CardTitle className="text-lg font-display text-black">Personal Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Cultivate mindfulness and self-awareness through consistent reflection.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-8 border-t border-beige-300">
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
      </footer>
    </div>
  );
}
