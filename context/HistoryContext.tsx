import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { HistoryEntry } from '../types';

interface HistoryContextType {
  history: HistoryEntry[];
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  updateHistoryEntry: (updatedEntry: HistoryEntry) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
}

export const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const localData = localStorage.getItem('layoutHistory');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Could not parse history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('layoutHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Could not save history to localStorage", error);
    }
  }, [history]);

  const addHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setHistory(prevHistory => [newEntry, ...prevHistory]);
  };

  const updateHistoryEntry = (updatedEntry: HistoryEntry) => {
    setHistory(prevHistory => 
      prevHistory.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry))
    );
  };

  const removeHistoryEntry = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <HistoryContext.Provider value={{ history, addHistoryEntry, updateHistoryEntry, removeHistoryEntry, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};