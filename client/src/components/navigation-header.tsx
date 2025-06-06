import { Sprout, BookOpen, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface NavigationHeaderProps {
  currentTab: "journal" | "reports";
}

export default function NavigationHeader({ currentTab }: NavigationHeaderProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-sage-500 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sprout className="text-white h-8 w-8 mr-3" />
              <h1 className="text-white font-display font-semibold text-xl">ReflectAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-6">
                <Link href="/journal">
                  <Button
                    variant="ghost"
                    className={`hover:text-beige-100 transition-colors duration-200 font-medium ${
                      currentTab === "journal" ? "text-black bg-white/20" : "text-white"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Journal
                  </Button>
                </Link>
                <Link href="/counselor-reports">
                  <Button
                    variant="ghost"
                    className={`hover:text-beige-100 transition-colors duration-200 font-medium ${
                      currentTab === "reports" ? "text-black bg-white/20" : "text-white"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Counselor Reports
                  </Button>
                </Link>
              </nav>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-white hover:text-beige-100 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-sage-600 border-t border-sage-400">
        <div className="flex justify-around py-3">
          <Link href="/journal">
            <Button
              variant="ghost"
              className={`transition-colors duration-200 font-medium flex flex-col items-center ${
                currentTab === "journal" ? "text-black bg-white/20" : "text-white hover:text-beige-100"
              }`}
            >
              <BookOpen className="w-5 h-5 mb-1" />
              <span className="text-xs">Journal</span>
            </Button>
          </Link>
          <Link href="/counselor-reports">
            <Button
              variant="ghost"
              className={`transition-colors duration-200 font-medium flex flex-col items-center ${
                currentTab === "reports" ? "text-black bg-white/20" : "text-white hover:text-beige-100"
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Reports</span>
            </Button>
          </Link>
        </div>
      </nav>
    </>
  );
}
