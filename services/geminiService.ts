
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const findSongIdentity = async (userInput: string): Promise<{ query: string; artist?: string; title?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user typed this into a notes app during a magic trick: "${userInput}". 
      Clean this up into a perfect YouTube search query. Identify the song title and artist.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "The optimized search query for YouTube." },
            artist: { type: Type.STRING },
            title: { type: Type.STRING }
          },
          required: ["query"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Gemini interpretation error:", error);
    return { query: userInput };
  }
};
