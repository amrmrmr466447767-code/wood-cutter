
import React, { useState, useCallback } from 'react';
import { Board, PlacedPiece } from '../types';
import { DownloadIcon } from './icons';

interface LayoutDiagramProps {
  board: Board;
  placedPieces: PlacedPiece[];
}

const LayoutDiagram: React.FC<LayoutDiagramProps> = ({ board, placedPieces }) => {
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const isPreview = placedPieces.length === 0;

  const viewBoxWidth = board.width > 0 ? board.width : 100;
  const viewBoxHeight = board.height > 0 ? board.height : 100;
  
  const strokeWidth = Math.min(viewBoxWidth, viewBoxHeight) * 0.005;

  const handleDownload = useCallback(() => {
    const svgNode = document.getElementById('layout-svg');
    if (!svgNode) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgNode);

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    const link = document.createElement("a");
    link.href = url;
    link.download = "layout-plan.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const selectedPiece = placedPieces.find(p => p.id === selectedPieceId);

  // Reset selected piece if it's no longer in the placed pieces (e.g., after a recalculation)
  React.useEffect(() => {
    if (selectedPieceId && !placedPieces.some(p => p.id === selectedPieceId)) {
        setSelectedPieceId(null);
    }
  }, [placedPieces, selectedPieceId]);


  return (
    <div className="w-full bg-gray-800 p-4 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-cyan-400">
            {isPreview ? 'معاينة اللوح' : 'مخطط القص'}
        </h3>
        {!isPreview && (
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors text-sm">
            <DownloadIcon />
            تنزيل المخطط
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 aspect-w-1 aspect-h-1 bg-gray-700 rounded-md p-2 overflow-auto">
          <svg
            id="layout-svg"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width={board.width} height={board.height} fill="#374151" />
            <text x={board.width / 2} y={strokeWidth * 5} textAnchor="middle" fill="white" fontSize={strokeWidth * 4}>
                {board.width}
            </text>
            <text x={strokeWidth * 5} y={board.height/2} textAnchor="middle" fill="white" fontSize={strokeWidth * 4} transform={`rotate(-90 ${strokeWidth * 5},${board.height/2})`}>
                {board.height}
            </text>

            {placedPieces.map((piece) => (
              <g key={piece.id} onClick={() => setSelectedPieceId(piece.id)} className="cursor-pointer animate-fade-in">
                <rect
                  x={piece.x}
                  y={piece.y}
                  width={piece.width}
                  height={piece.height}
                  fill={piece.color}
                  stroke={selectedPieceId === piece.id ? '#34d399' : 'black'}
                  strokeWidth={selectedPieceId === piece.id ? strokeWidth * 2 : strokeWidth}
                  className="transition-all duration-300"
                  transform={selectedPieceId === piece.id ? `scale(1.02, 1.02)` : 'scale(1, 1)'}
                  style={{transformOrigin: `${piece.x + piece.width / 2}px ${piece.y + piece.height / 2}px`}}
                />
                 <text 
                    x={piece.x + piece.width / 2} 
                    y={piece.y + piece.height / 2}
                    textAnchor="middle" 
                    dy=".3em"
                    fill="black" 
                    fontSize={Math.min(piece.width, piece.height) * 0.2}
                    className="font-mono pointer-events-none"
                    >
                    {`${piece.width}x${piece.height}`}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col justify-center">
            {selectedPiece ? (
                <div className="text-center animate-fade-in">
                    <h4 className="font-bold text-lg mb-4 text-emerald-400">القطعة المحددة</h4>
                    <div style={{backgroundColor: selectedPiece.color}} className="w-20 h-20 mx-auto mb-4 rounded-md border-2 border-emerald-400"></div>
                    <p><span className="font-semibold">العرض:</span> {selectedPiece.width}</p>
                    <p><span className="font-semibold">الطول:</span> {selectedPiece.height}</p>
                    <p><span className="font-semibold">الموقع (س, ص):</span> {`(${selectedPiece.x.toFixed(2)}, ${selectedPiece.y.toFixed(2)})`}</p>
                </div>
            ) : (
                <div className="text-center text-gray-400">
                    {isPreview ? (
                        <p>هذا هو شكل اللوح الأساسي. سيتم عرض القطع هنا بعد الحساب.</p>
                    ) : (
                        <p>إضغط على أي قطعة في المخطط لعرض تفاصيلها.</p>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LayoutDiagram;