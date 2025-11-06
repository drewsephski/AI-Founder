import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Changed to process.env.API_KEY
if (!process.env.API_KEY) { 
  throw new Error("API_KEY environment variable not set");
}

// Changed to process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 

export const editImage = async (
  prompt: string,
  base64ImageData: string,
  mimeType: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

export const analyzeComplexQuery = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error with complex query:", error);
    throw error;
  }
};

export const getStandardChatStream = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
    });
    const responseStream = await chat.sendMessageStream({ message: newMessage });
    return responseStream;
  } catch (error) {
    console.error("Error getting chat stream:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const analyzeVideo = async (
  prompt: string,
  videoFrames: { mimeType: string, data: string }[]
): Promise<string> => {
  try {
    const imageParts = videoFrames.map(frame => ({
      inlineData: {
        mimeType: frame.mimeType,
        data: frame.data,
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          { text: prompt },
          ...imageParts
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
};

export const searchWithGoogle = async (prompt: string): Promise<{ text: string; sources: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
  } catch (error) {
    console.error("Error with Google Search query:", error);
    throw error;
  }
};