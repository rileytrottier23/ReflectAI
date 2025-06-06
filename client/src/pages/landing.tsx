import { Sprout, BookOpen, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Navigation Header */}
      <header className="bg-sage-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sprout className="text-white text-xl mr-3" />
              <h1 className="text-white font-display font-semibold text-xl">ReflectAI</h1>
              <p className="text-cream-200 text-sm ml-3 hidden sm:block">Your personal space for reflection</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleLogin}
                className="bg-white text-sage-600 hover:bg-cream-100 hover:text-sage-700 font-medium"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-800 mb-6">
              Document your journey, one day at a time
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              ReflectAI helps you capture your thoughts, track your mood, and gain insights through beautiful 
              visualizations and AI-powered reflections.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-sage-400 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Daily Journaling</span>
              </div>
              <p className="text-sm text-gray-600 ml-5">
                Record your thoughts and experiences in a beautiful interface
              </p>
              
              <div className="flex items-center">
                <div className="w-2 h-2 bg-sage-400 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Mood Tracking</span>
              </div>
              <p className="text-sm text-gray-600 ml-5">
                Visualize your emotional wellbeing over time
              </p>
              
              <div className="flex items-center">
                <div className="w-2 h-2 bg-sage-400 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Monthly Reflections</span>
              </div>
              <p className="text-sm text-gray-600 ml-5">
                Get AI-generated insights about your month
              </p>
            </div>

            <Button 
              onClick={handleLogin}
              className="bg-sage-500 hover:bg-sage-600 text-white px-8 py-3 text-lg font-medium"
            >
              Start Journaling
            </Button>
          </div>

          {/* Mock Journal Entry Card */}
          <div className="bg-white rounded-xl shadow-lg border border-cream-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold text-gray-800">Today's Entry</h3>
              <p className="text-sm text-gray-600">May 6, 2025</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling today?</label>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Not great</span>
                <span className="font-medium text-sage-600">7/10</span>
                <span>Excellent</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-lg relative">
                <div className="h-2 bg-sage-500 rounded-lg" style={{ width: '70%' }}></div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600 leading-relaxed">
                Today was quite productive. I finished the major project I've been working on for weeks, 
                and the client seemed really happy with the results...
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-display font-semibold text-center text-gray-800 mb-12">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-cream-200">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-sage-500 mx-auto mb-4" />
                <CardTitle className="font-display">Daily Journaling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Record your thoughts, experiences, and emotions in a beautiful, easy-to-use interface.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center border-cream-200">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-sage-500 mx-auto mb-4" />
                <CardTitle className="font-display">Mood Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your emotional well-being over time with visual charts and statistics.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center border-cream-200">
              <CardHeader>
                <Star className="w-12 h-12 text-sage-500 mx-auto mb-4" />
                <CardTitle className="font-display">AI Reflections</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get personalized monthly summaries and insights powered by advanced AI analysis.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-sage-500 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-display font-semibold mb-4">Start Your Journaling Journey Today</h2>
          <p className="text-lg text-cream-200 mb-8 max-w-2xl mx-auto">
            Join thousands of people who have improved their self-awareness and mental clarity 
            through regular journaling.
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-white text-sage-600 hover:bg-cream-100 hover:text-sage-700 px-8 py-3 text-lg font-medium"
          >
            Sign Up Now
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-cream-200 border-t border-cream-300 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sprout className="text-sage-600 text-lg mr-2" />
              <span className="font-display font-semibold text-sage-800">ReflectAI</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Contact</span>
              <span>Privacy Policy</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            © 2025 ReflectAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
