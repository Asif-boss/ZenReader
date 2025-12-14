import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizePageContent = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert academic and technical reader. Summarize the following text concisely in markdown format. Highlight key points with bullet points if applicable.\n\nText:\n${text}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error communicating with AI service.";
  }
};

export const askQuestionAboutContext = async (question: string, context: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Context from the current PDF page:\n"""${context}"""\n\nUser Question: ${question}\n\nAnswer the user's question based strictly on the provided context if possible. If the context doesn't have the answer, use your general knowledge but mention that it wasn't in the text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Q&A Error:", error);
    return "Error generating answer.";
  }
};

export const translateText = async (text: string, targetLang: string = 'English'): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text to ${targetLang}. Return ONLY the translation, no preamble.\n\nText: "${text}"`,
    });
    return response.text || "Translation failed.";
  } catch (error) {
    return "Error translating text.";
  }
};

export const explainText = async (text: string, mode: 'simple' | 'detailed'): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = mode === 'simple' 
      ? `Explain the following text in simple terms suitable for a beginner or a 5-year old. Keep it concise.\n\nText: "${text}"`
      : `Provide a detailed, academic explanation of the following text. Include context, definitions of key terms, and implications.\n\nText: "${text}"`;
      
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Explanation failed.";
  } catch (error) {
    return "Error explaining text.";
  }
};

export const generateExamQuestions = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following text, generate 3 multiple-choice questions (MCQs) and 1 short-answer question to test understanding. Provide the answers and brief explanations at the end.\n\nText: "${text}"`,
    });
    return response.text || "Generation failed.";
  } catch (error) {
    return "Error generating questions.";
  }
};

export const extractTopics = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Identify the top 5 key topics or concepts in the following text. For each topic, provide a one-sentence definition or explanation.\n\nText: "${text}"`,
    });
    return response.text || "Topic extraction failed.";
  } catch (error) {
    return "Error extracting topics.";
  }
};
