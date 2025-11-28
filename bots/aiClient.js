import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // good + cheap

export async function thinker(name, state) {
  const prompt = `
You are a villager named ${name}.
Your society rule: deposit 10% of collected wood items into the town chest.

State:
Inventory: ${JSON.stringify(state.inventory)}
Chest Location: ${JSON.stringify(state.chestPos)}

Return ONLY one JSON object in this structure:
{
 "action": "collect | deposit | idle | move",
 "resource": "wood | none",
 "amount": number
}

Do not explain or add text. Only JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const output = result.response.text().trim();

    try {
      return JSON.parse(output);
    } catch {
      console.log("❗ Parsing Failed. Output was:\n", output);
      return null;
    }

  } catch (err) {
    console.error("Gemini Error:", err);
    return null;
  }
}
