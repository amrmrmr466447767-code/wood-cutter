
export interface Board {
  width: number;
  height: number;
}

export interface Piece {
  id: string;
  width: number;
  height: number;
}

export interface PlacedPiece extends Piece {
  x: number;
  y: number;
  color: string;
}

export interface Layout {
  placedPieces: PlacedPiece[];
  unplacedPieces: Piece[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  board: Board;
  pieces: Piece[];
  layout: Layout;
}
