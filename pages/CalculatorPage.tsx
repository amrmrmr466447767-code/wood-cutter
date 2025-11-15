import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Board, Piece, Layout, PlacedPiece } from '../types';
import { getOptimalLayout } from '../services/geminiService';
import LayoutDiagram from '../components/LayoutDiagram';
import { PlusIcon, TrashIcon } from '../components/icons';
import { useHistory } from '../hooks/useHistory';

const PIECE_COLORS = [
    '#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80',
    '#34d399', '#2dd4bf', '#60a5fa', '#a78bfa', '#f472b6'
];

const parseDimension = (value: string): number => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return 0;

    const parts = trimmedValue.split(/\s+/).filter(Boolean);
    let total = 0;
    let hasFraction = false;

    if (parts.length > 2) return NaN;

    for (const part of parts) {
        if (part.includes('/')) {
            if (hasFraction) return NaN; // Only one fraction part allowed
            hasFraction = true;

            const fractionParts = part.split('/');
            if (fractionParts.length !== 2) return NaN;

            const numerator = parseFloat(fractionParts[0]);
            const denominator = parseFloat(fractionParts[1]);

            if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
                return NaN;
            }
            total += numerator / denominator;
        } else {
            const numberPart = parseFloat(part);
            if (isNaN(numberPart)) {
                return NaN;
            }
            total += numberPart;
        }
    }
    return total;
};

const validateInput = (value: string): string | null => {
    const isValidFormat = /^[0-9\s./]*$/.test(value);
    if (!isValidFormat) {
        return "الرجاء استخدام الأرقام والعلامة العشرية أو الكسرية فقط.";
    }

    const parsedValue = parseDimension(value);
    if (value.trim() !== '' && isNaN(parsedValue)) {
        return "تنسيق الرقم غير صالح. مثال: 10 أو 10.5 أو 10 1/2";
    }

    return null;
}


const CalculatorPage: React.FC = () => {
  const initialPieceId = React.useRef(crypto.randomUUID());
  
  const [board, setBoard] = useState<Board>({ width: 100, height: 100 });
  const [pieces, setPieces] = useState<Piece[]>([{ id: initialPieceId.current, width: 20, height: 30 }]);
  
  const [boardForm, setBoardForm] = useState({ width: '100', height: '100' });
  const [piecesForm, setPiecesForm] = useState<{ id: string; width: string; height: string; }[]>([{ id: initialPieceId.current, width: '20', height: '30' }]);

  const [layout, setLayout] = useState<Layout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputErrors, setInputErrors] = useState<Record<string, string | null>>({});

  const { addHistoryEntry } = useHistory();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state) {
      const { board: historyBoard, pieces: historyPieces } = location.state as { board: Board, pieces: Piece[] };
      setBoard(historyBoard);
      setPieces(historyPieces);
      setBoardForm({ width: String(historyBoard.width), height: String(historyBoard.height) });
      setPiecesForm(historyPieces.map(p => ({ id: p.id, width: String(p.width), height: String(p.height) })));
      setLayout(null);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  const handleBoardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, id } = e.target;
    setBoardForm(prev => ({ ...prev, [name]: value }));

    const error = validateInput(value);
    setInputErrors(prev => ({...prev, [id]: error}));

    if (!error) {
        const parsedValue = parseDimension(value);
        if (!isNaN(parsedValue)) {
          setBoard(prev => ({ ...prev, [name]: parsedValue }));
        }
    }
  };

  const handlePieceInputChange = (pieceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, id: inputId } = e.target;
    setPiecesForm(prev => prev.map(p => p.id === pieceId ? { ...p, [name]: value } : p));
    
    const error = validateInput(value);
    setInputErrors(prev => ({...prev, [inputId]: error}));
    
    if(!error) {
        const parsedValue = parseDimension(value);
        if (!isNaN(parsedValue)) {
          setPieces(prev => prev.map(p => p.id === pieceId ? { ...p, [name]: parsedValue } : p));
        }
    }
  };

  const addPiece = () => {
    const newId = crypto.randomUUID();
    setPieces(prev => [...prev, { id: newId, width: 10, height: 10 }]);
    setPiecesForm(prev => [...prev, { id: newId, width: '10', height: '10' }]);
  };

  const removePiece = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
    setPiecesForm(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.values(inputErrors).some(error => error !== null)) {
        setError("الرجاء تصحيح الأخطاء في الحقول قبل المتابعة.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setLayout(null);

    if (board.width <= 0 || board.height <= 0 || pieces.some(p => p.width <= 0 || p.height <= 0)) {
        setError("يجب أن تكون جميع الأبعاد أكبر من صفر.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await getOptimalLayout(board, pieces);
      const placedPiecesWithColors: PlacedPiece[] = result.placedPieces.map((p, index) => {
          const originalPiece = pieces.find(op => op.id === p.id)!;
          return {
              ...originalPiece,
              x: p.x,
              y: p.y,
              color: PIECE_COLORS[index % PIECE_COLORS.length]
          };
      });
      const unplacedPiecesData = result.unplacedPieces.map(up => pieces.find(p => p.id === up.id)!);
      
      const newLayout = { placedPieces: placedPiecesWithColors, unplacedPieces: unplacedPiecesData };
      setLayout(newLayout);
      addHistoryEntry({ board, pieces, layout: newLayout });

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">أبعاد اللوح الأساسي</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="board-width" className="block text-sm font-medium text-gray-300 mb-1">العرض</label>
                  <input type="text" id="board-width" name="width" value={boardForm.width} onChange={handleBoardInputChange} className={`w-full p-2 bg-gray-700 rounded-md border ${inputErrors['board-width'] ? 'border-red-500' : 'border-gray-600'} focus:ring-cyan-500 focus:border-cyan-500`}/>
                  {inputErrors['board-width'] && <p className="text-red-400 text-xs mt-1">{inputErrors['board-width']}</p>}
                </div>
                <div>
                  <label htmlFor="board-height" className="block text-sm font-medium text-gray-300 mb-1">الطول</label>
                  <input type="text" id="board-height" name="height" value={boardForm.height} onChange={handleBoardInputChange} className={`w-full p-2 bg-gray-700 rounded-md border ${inputErrors['board-height'] ? 'border-red-500' : 'border-gray-600'} focus:ring-cyan-500 focus:border-cyan-500`}/>
                  {inputErrors['board-height'] && <p className="text-red-400 text-xs mt-1">{inputErrors['board-height']}</p>}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">أبعاد القطع</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {piecesForm.map((piece, index) => (
                  <div key={piece.id} className="flex items-end gap-2">
                    <span className="text-gray-400 pb-2">{index + 1}.</span>
                    <div className="flex-1">
                      <label htmlFor={`piece-${piece.id}-width`} className="block text-xs font-medium text-gray-400 mb-1">العرض</label>
                      <input type="text" id={`piece-${piece.id}-width`} name="width" value={piece.width} onChange={(e) => handlePieceInputChange(piece.id, e)} className={`w-full p-2 bg-gray-700 rounded-md border ${inputErrors[`piece-${piece.id}-width`] ? 'border-red-500' : 'border-gray-600'} focus:ring-cyan-500 focus:border-cyan-500`}/>
                      {inputErrors[`piece-${piece.id}-width`] && <p className="text-red-400 text-xs mt-1">{inputErrors[`piece-${piece.id}-width`]}</p>}
                    </div>
                    <div className="flex-1">
                       <label htmlFor={`piece-${piece.id}-height`} className="block text-xs font-medium text-gray-400 mb-1">الطول</label>
                      <input type="text" id={`piece-${piece.id}-height`} name="height" value={piece.height} onChange={(e) => handlePieceInputChange(piece.id, e)} className={`w-full p-2 bg-gray-700 rounded-md border ${inputErrors[`piece-${piece.id}-height`] ? 'border-red-500' : 'border-gray-600'} focus:ring-cyan-500 focus:border-cyan-500`}/>
                      {inputErrors[`piece-${piece.id}-height`] && <p className="text-red-400 text-xs mt-1">{inputErrors[`piece-${piece.id}-height`]}</p>}
                    </div>
                    <button type="button" onClick={() => removePiece(piece.id)} className="p-2 text-red-400 hover:text-red-300">
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addPiece} className="mt-4 w-full flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                <PlusIcon /> إضافة قطعة
              </button>
            </div>
            
            <button type="submit" disabled={isLoading} className="w-full p-3 bg-cyan-600 hover:bg-cyan-500 rounded-md font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'جاري الحساب...' : 'إحسب'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
            {error && <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg mb-4">{error}</div>}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 flex justify-center items-center bg-gray-900 bg-opacity-75 rounded-lg z-10">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                )}
    
                {layout && layout.unplacedPieces.length > 0 && (
                    <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-4 animate-fade-in">
                        <h3 className="font-bold">قطع لم يتم وضعها ({layout.unplacedPieces.length})</h3>
                        <p className="text-sm">لم يكن هناك مساحة كافية للقطع التالية:</p>
                        <ul className="list-disc list-inside text-sm">
                            {layout.unplacedPieces.map(p => <li key={p.id}>{`قطعة ${p.width}x${p.height}`}</li>)}
                        </ul>
                    </div>
                )}

                <LayoutDiagram 
                    board={board} 
                    placedPieces={layout ? layout.placedPieces : []} 
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;