import { Sprout, BookOpen, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-beige-200">
      {/* Navigation Header */}
      <header className="bg-leather-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Sprout className="text-white text-2xl mr-4" />
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
                onClick={handleLogin}
                className="bg-white text-leather-600 hover:bg-beige-100 hover:text-leather-700 font-medium px-6"
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
              onClick={handleLogin}
              className="bg-leather-500 hover:bg-leather-600 text-white px-8 py-3 text-lg font-medium"
            >
              Start Journaling
            </Button>
          </div>

          {/* Mock Journal Entry Card */}
          <div className="bg-white rounded-xl shadow-lg border border-beige-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold text-black">Today's Entry</h3>
              <p className="text-sm text-gray-700">May 6, 2025</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 mb-2">How are you feeling today?</label>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Not great</span>
                <span className="font-medium text-leather-600">7/10</span>
                <span>Excellent</span>
              </div>
              <div className="w-full h-2 bg-beige-300 rounded-lg relative">
                <div className="h-2 bg-leather-500 rounded-lg" style={{ width: '70%' }}></div>
              </div>
            </div>
            
            <div className="border border-beige-300 rounded-lg p-4 bg-beige-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                Today was quite productive. I finished the major project I've been working on for weeks, 
                and the client seemed really happy with the results...
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-display font-semibold text-center text-black mb-12">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="text-center border-beige-300 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-leather-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-leather-600" />
                </div>
                <CardTitle className="font-display text-lg font-semibold text-black">Daily Journaling</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-gray-700 text-sm leading-relaxed">
                  Record your thoughts, experiences, and emotions in a beautiful, easy-to-use interface.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-beige-300 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-sage-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-sage-600" />
                </div>
                <CardTitle className="font-display text-lg font-semibold text-black">AI Reflections</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-gray-700 text-sm leading-relaxed">
                  Get personalized monthly summaries and insights powered by advanced AI analysis.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-leather-500 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-display font-semibold mb-4">Start Your Journaling Journey Today</h2>
          <p className="text-lg text-beige-100 mb-8 max-w-2xl mx-auto">
            Join thousands of people who have improved their self-awareness and mental clarity 
            through regular journaling.
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-white text-black hover:bg-beige-100 hover:text-gray-800 px-8 py-3 text-lg font-medium"
          >
            Sign Up Now
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-leather-500 border-t border-leather-400 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sprout className="text-white text-2xl mr-3" />
              <span className="font-display font-bold text-white text-2xl">ReflectAI</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-beige-100">
              <span>Contact</span>
              <span>Privacy Policy</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-beige-100">
            © 2025 ReflectAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
