require("dotenv").config();

const apiKey = process.env.GROQ_API_KEY;
console.log("API Key loaded (first 8 chars):", apiKey ? apiKey.substring(0, 8) + "..." : "undefined");

if (!apiKey) {
  console.error("GROQ_API_KEY is not defined in the .env file.");
  process.exit(1);
}

async function testGroq() {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: "Hello, reply with exactly the word 'SUCCESS' if you receive this."
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response text:", data.choices?.[0]?.message?.content);
      console.log("✅ Groq API Key is WORKING!");
    } else {
      const errorText = await response.text();
      console.error("❌ Groq API Key failed with status:", response.status);
      console.error("Error body:", errorText);
    }
  } catch (err) {
    console.error("❌ Error while testing Groq API:", err);
  }
}

testGroq();
