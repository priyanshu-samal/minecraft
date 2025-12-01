require('dotenv').config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY found");
    return;
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }
    
    const data = await response.json();
    if (data.models) {
      console.log("--- ALL AVAILABLE MODELS ---");
      data.models.forEach(m => {
        console.log(m.name);
      });
      console.log("----------------------------");
    } else {
      console.log("No models found");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

checkModels();
