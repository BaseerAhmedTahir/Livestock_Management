import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Switch between light and dark mode
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              Dark Mode
            </>
          )}
        </button>
      </div>
    </div>
  );
}