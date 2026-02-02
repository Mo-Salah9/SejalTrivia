import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.GEMINI_API_KEY;

export const generateNewQuestions = async (categoryName: string) => {
  if (!apiKey) {
    console.info('Gemini API key not set. AI question generation is disabled.');
    return null;
  }

  try {
    const {GoogleGenAI, Type} = await import('@google/genai');
    const ai = new GoogleGenAI({apiKey});

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 6 trivia questions for the category "${categoryName}" in Arabic.
      The questions should follow a progressive difficulty: 2 easy (200 points), 2 medium (400 points), 2 hard (600 points).
      Format as a JSON array.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {type: Type.STRING},
              options: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
              },
              correctIndex: {type: Type.INTEGER},
              points: {type: Type.INTEGER},
            },
            required: ['text', 'options', 'correctIndex', 'points'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error('Error generating questions:', error);
    return null;
  }
};
