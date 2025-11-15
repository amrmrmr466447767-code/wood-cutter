
import { GoogleGenAI, Type } from "@google/genai";
import { Board, Piece } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development; the environment should provide the key.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    placedPieces: {
      type: Type.ARRAY,
      description: "List of pieces that were successfully placed on the board.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "The unique ID of the piece." },
          x: { type: Type.NUMBER, description: "The x-coordinate of the top-left corner." },
          y: { type: Type.NUMBER, description: "The y-coordinate of the top-left corner." },
        },
        required: ['id', 'x', 'y'],
      },
    },
    unplacedPieces: {
      type: Type.ARRAY,
      description: "List of pieces that could not be placed on the board.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "The unique ID of the unplaced piece." },
        },
        required: ['id'],
      },
    },
  },
  required: ['placedPieces', 'unplacedPieces'],
};

export const getOptimalLayout = async (board: Board, pieces: Piece[]) => {
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  
  if (pieces.length === 0) {
    return { placedPieces: [], unplacedPieces: [] };
  }

  const systemInstruction = `You are an expert in 2D bin packing and layout optimization. Your task is to place a list of smaller rectangular pieces onto a larger rectangular board, minimizing waste and trying to fit as many pieces as possible.
- The origin (0,0) is the top-left corner of the board.
- Do NOT rotate any pieces; place them with the exact width and height provided.
- Pieces cannot overlap.
- Pieces must be placed entirely within the board's boundaries.
- Provide the coordinates (x, y) for the top-left corner of each placed piece.
- Return a JSON object matching the provided schema.`;

  const piecesDescription = pieces.map(p => `- ID: ${p.id}, Width: ${p.width}, Height: ${p.height}`).join('\n');
  const prompt = `
Board dimensions:
- Width: ${board.width}
- Height: ${board.height}

Pieces to place:
${piecesDescription}

Calculate the optimal layout and provide the JSON output.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const rawJson = response.text.trim();
  try {
    const parsed = JSON.parse(rawJson);
    return parsed as {
      placedPieces: { id: string; x: number; y: number }[];
      unplacedPieces: { id: string }[];
    };
  } catch (e) {
    console.error("Failed to parse Gemini response:", rawJson);
    throw new Error("Received an invalid layout from the AI service.");
  }
};
