require('dotenv').config();

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    const fs = require('fs');
    
    let output = "--- AVAILABLE MODELS ---\n";
    if (data.models) {
      data.models.forEach(m => {
        output += `${m.name}\n`;
      });
    } else {
      output += "No models found.\n";
    }
    
    fs.writeFileSync('final_model_list.txt', output);
    console.log("List saved to final_model_list.txt");
    
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

listAllModels();
