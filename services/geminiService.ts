
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { UserAppearance } from "../types";

/**
 * Helper to get the AI instance.
 */
function getAI() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Helper to convert ArrayBuffer to Base64 in browser
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Generates speech from text using the Gemini 2.5 Flash TTS model.
 * Returns the raw PCM audio data as a base64 encoded string.
 */
export async function generateSpeech(text: string): Promise<string | undefined> {
  if (!text || !text.trim()) return undefined;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: [Modality.AUDIO], // MUST use Enum
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e: any) {
    // Graceful fallback logging
    const msg = e.toString();
    console.warn("Gemini TTS Error (fallback triggered):", msg);
    return undefined;
  }
}

/**
 * Analyzes user audio input (blob) and generates a contextual, empathetic response
 * that explicitly mentions the refinement of their avatar model.
 */
export async function generateResponsiveReply(audioBlob: Blob, context: string): Promise<string> {
  try {
    const ai = getAI();
    
    // Convert Blob to Base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);

    const promptText = `
你是一个处于虚空裂缝中的神秘向导（NPC）。
场景背景：用户之前选择了“${context}”作为他们心中的困扰。
你刚刚听到了用户关于这个困扰的语音倾诉。

任务：
1. 倾听用户的录音，理解他们的情绪和故事。
2. 给予一句深刻、治愈且富有哲理的回应（不要像普通客服）。
3. **重要**：在回应的最后，请描述用户在裂缝中的“方块模型/灵魂形态”发生了什么变化。告诉用户，因为他们的坦诚，他们的模型变得更加“精细”、“清晰”或“平滑”了。

输出要求：
- 语言：中文。
- 风格：神秘、空灵、甚至带一点点代码/数字化的隐喻。
- 篇幅：60字以内。
- 直接输出向导要说的话。
`;

    const response = await ai.models.generateContent({
      // Using gemini-flash-latest which supports multi-modal input
      model: "gemini-flash-latest",
      contents: {
        parts: [
          {
            inlineData: {
              // Ensure mimeType is safe, fallback to webm if blob type is missing
              mimeType: audioBlob.type || "audio/webm",
              data: base64Audio
            }
          },
          {
            text: promptText
          }
        ]
      }
    });

    return response.text || "你的声音让数据的噪点平息了。看，你灵魂的轮廓正在变得清晰。";
  } catch (e) {
    console.error("Error generating responsive reply:", e);
    return "我听到了。随着你的诉说，这里混乱的线条正在重新排列，你的形态变得更加完整了。"; // Fallback
  }
}

/**
 * Analyzes a base64 image (camera frame) to extract simplified colors 
 * for the blocky avatar.
 */
export async function analyzeUserAppearance(base64Image: string): Promise<UserAppearance> {
  try {
    const ai = getAI();
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze the person in this image. Identify the dominant color of their skin, hair, and upper body clothing. Return ONLY a valid JSON object with keys: 'skinColor', 'hairColor', 'clothingColor' using Hex codes (e.g. #FFFFFF)."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinColor: { type: Type.STRING },
            hairColor: { type: Type.STRING },
            clothingColor: { type: Type.STRING },
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response text");
    
    // Clean potential markdown blocks just in case
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as UserAppearance;

  } catch (e: any) {
    console.error("Analysis failed, using defaults", e);
    return {
      skinColor: "#F5C396", 
      hairColor: "#333333", 
      clothingColor: "#5DADE2" 
    };
  }
}
