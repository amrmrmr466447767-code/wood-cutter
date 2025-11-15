import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useHistory } from '../hooks/useHistory';
import { HistoryEntry } from '../types';
import { BackIcon, TrashIcon } from '../components/icons';

const HistoryPage: React.FC = () => {
  const { history, removeHistoryEntry, clearHistory } = useHistory();
  const navigate = useNavigate();

  const handleEdit = (entry: HistoryEntry) => {
    navigate('/', { state: { board: entry.board, pieces: entry.pieces } });
  };

  const handleRemove = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإدخال؟')) {
      removeHistoryEntry(id);
    }
  };

  const totalWaste = (entry: HistoryEntry) => {
      const boardArea = entry.board.width * entry.board.height;
      if (boardArea === 0) return 100;
      const piecesArea = entry.layout.placedPieces.reduce((acc, p) => acc + (p.width * p.height), 0);
      const wastePercentage = ((boardArea - piecesArea) / boardArea) * 100;
      return wastePercentage.toFixed(2);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">سجل الحسابات</h1>
        <div className="flex items-center gap-2">
            <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md transition-colors text-sm font-medium disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <TrashIcon />
                <span>إفراغ الكل</span>
            </button>
            <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-cyan-500 rounded-md transition-colors text-sm font-medium">
              <BackIcon />
              <span>العودة للرئيسية</span>
            </Link>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">لا يوجد حسابات محفوظة حتى الآن.</p>
          <p className="text-gray-500">سيتم عرض الحسابات التي تقوم بها هنا تلقائياً.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="bg-gray-800 p-5 rounded-lg shadow-md hover:bg-gray-700 transition-colors">
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(entry.timestamp).toLocaleString('ar-EG')}
                  </p>
                  <h2 className="font-bold text-lg text-white">
                    لوح {entry.board.width} x {entry.board.height} مع {entry.pieces.length} قطعة
                  </h2>
                   <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-300">
                        <span>القطع الموضوعة: <span className="font-semibold text-green-400">{entry.layout.placedPieces.length}</span></span>
                        <span>القطع المتبقية: <span className="font-semibold text-yellow-400">{entry.layout.unplacedPieces.length}</span></span>
                        <span>الهدر التقريبي: <span className="font-semibold text-red-400">{totalWaste(entry)}%</span></span>
                   </div>
                </div>
                <div className="mt-4 md:mt-0 flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold transition-colors"
                  >
                    تعديل وإعادة حساب
                  </button>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="p-2 text-red-400 hover:text-red-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                    aria-label="حذف الإدخال"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;