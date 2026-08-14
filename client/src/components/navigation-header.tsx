import { useState, useRef, useEffect } from "react";
import { Sprout, BookOpen, BarChart3, LogOut, ChevronDown, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";

interface NavigationHeaderProps {
  currentTab: "journal" | "reports";
}

export default function NavigationHeader({ currentTab }: NavigationHeaderProps) {
  const { signOut } = useClerk();
  const [location] = useLocation();
  const [reportsOpen, setReportsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setReportsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMonthly = location === "/counselor-reports";
  const isAnnual = location === "/annual-report";
  const isReportsActive = isMonthly || isAnnual;

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
              <nav className="hidden md:flex space-x-6 items-center">
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

                {/* Reports Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setReportsOpen((o) => !o)}
                    className={`hover:text-beige-100 transition-colors duration-200 font-medium ${
                      isReportsActive ? "text-black bg-white/20" : "text-white"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Counselor Reports
                    <ChevronDown className={`w-3.5 h-3.5 ml-1.5 transition-transform duration-200 ${reportsOpen ? "rotate-180" : ""}`} />
                  </Button>

                  {reportsOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-beige-200 overflow-hidden z-50">
                      <Link href="/counselor-reports" onClick={() => setReportsOpen(false)}>
                        <button
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors duration-150 ${
                            isMonthly ? "bg-sage-50 text-sage-700 font-medium" : "text-gray-700 hover:bg-beige-50"
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-sage-600 flex-shrink-0" />
                          Monthly
                        </button>
                      </Link>
                      <Link href="/annual-report" onClick={() => setReportsOpen(false)}>
                        <button
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors duration-150 ${
                            isAnnual ? "bg-sage-50 text-sage-700 font-medium" : "text-gray-700 hover:bg-beige-50"
                          }`}
                        >
                          <CalendarDays className="w-4 h-4 text-sage-600 flex-shrink-0" />
                          Annual
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
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
                isMonthly ? "text-black bg-white/20" : "text-white hover:text-beige-100"
              }`}
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-xs">Monthly</span>
            </Button>
          </Link>
          <Link href="/annual-report">
            <Button
              variant="ghost"
              className={`transition-colors duration-200 font-medium flex flex-col items-center ${
                isAnnual ? "text-black bg-white/20" : "text-white hover:text-beige-100"
              }`}
            >
              <CalendarDays className="w-5 h-5 mb-1" />
              <span className="text-xs">Annual</span>
            </Button>
          </Link>
        </div>
      </nav>
    </>
  );
}
