import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Contact Support
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              We're here to help with any questions or concerns
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                For any questions, technical support, or feedback about your journaling experience, 
                please don't hesitate to reach out to us.
              </p>
              
              <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-300">Email us at:</span>
                <a 
                  href="mailto:riley.a.trottier@gmail.com" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  riley.a.trottier@gmail.com
                </a>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">What can we help you with?</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Technical issues or bugs</li>
                  <li>• Account questions</li>
                  <li>• Feature requests</li>
                  <li>• Privacy and security concerns</li>
                  <li>• General feedback</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => window.location.href = 'mailto:riley.a.trottier@gmail.com'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}