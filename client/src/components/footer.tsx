import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 Personal Journal. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy-policy">
              <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </a>
            </Link>
            <Link href="/contact">
              <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Contact Support
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}