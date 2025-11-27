import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIPlanResponse } from "../types";

const apiKey = process.env.API_KEY;

// Define the schema for the structured output
const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    schedule: {
      type: Type.OBJECT,
      description: "A mapping of hour (integer 6-24) to activity description.",
      properties: {
        "6": { type: Type.STRING },
        "7": { type: Type.STRING },
        "8": { type: Type.STRING },
        "9": { type: Type.STRING },
        "10": { type: Type.STRING },
        "11": { type: Type.STRING },
        "12": { type: Type.STRING },
        "13": { type: Type.STRING },
        "14": { type: Type.STRING },
        "15": { type: Type.STRING },
        "16": { type: Type.STRING },
        "17": { type: Type.STRING },
        "18": { type: Type.STRING },
        "19": { type: Type.STRING },
        "20": { type: Type.STRING },
        "21": { type: Type.STRING },
        "22": { type: Type.STRING },
        "23": { type: Type.STRING },
        "24": { type: Type.STRING },
      },
    },
    todos: {
      type: Type.ARRAY,
      description: "A list of 5-8 actionable items to achieve the goal.",
      items: { type: Type.STRING },
    },
    notes: {
      type: Type.STRING,
      description: "A short motivational quote or strategy tip related to the goal.",
    },
  },
  required: ["schedule", "todos", "notes"],
};

export const generatePlanFromGoal = async (priorities: string[]): Promise<AIPlanResponse | null> => {
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Filter out empty priorities
    const activePriorities = priorities.filter(p => p.trim() !== "");
    const goalDescription = activePriorities.length > 0 
      ? activePriorities.join(", ") 
      : "일반적인 생산성 향상";

    const prompt = `
      오늘의 주요 우선순위(목표)는 다음과 같습니다: "${goalDescription}".
      이 우선순위들을 달성하기 위한 현실적인 일일 일정(오전 8시 또는 적절한 시간부터 시작)과 할 일 목록을 작성해 주세요.
      활동 내용은 간결하게(5단어 이내) 작성해 주세요.
      일정에는 최소 6-8개의 슬롯을 채우고, 여유 시간을 두세요.
      모든 응답 내용은 한국어로 작성해 주세요.
      The output must be strictly JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIPlanResponse;

  } catch (error) {
    console.error("Error generating plan:", error);
    return null;
  }
};