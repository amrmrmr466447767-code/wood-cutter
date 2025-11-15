
import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import CalculatorPage from './pages/CalculatorPage';
import HistoryPage from './pages/HistoryPage';
import { HistoryProvider } from './context/HistoryContext';
import { HistoryIcon } from './components/icons';

function App() {
  return (
    <HistoryProvider>
      <HashRouter>
        <div className="bg-gray-900 text-white min-h-screen flex flex-col">
          <header className="bg-gray-800 shadow-md">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
              <h1 className="text-xl font-bold text-cyan-400">wood - calculator</h1>
              <Link to="/history" className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-cyan-500 rounded-md transition-colors">
                <HistoryIcon />
                <span>المحفوظات</span>
              </Link>
            </nav>
          </header>
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<CalculatorPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
          <footer className="text-center py-4 text-gray-500 text-sm">
            powered by Amr Mohamed Younis
          </footer>
        </div>
      </HashRouter>
    </HistoryProvider>
  );
}

export default App;