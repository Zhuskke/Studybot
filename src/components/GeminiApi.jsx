// Gemini API utility
export const callGeminiApi = async (messages, systemInstruction) => {
  const userQuery = messages[messages.length - 1].text;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ google_search: {} }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`API call failed: ${response.status}`);

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      const text = candidate.content.parts[0].text;
      const groundingMetadata = candidate.groundingMetadata;
      const sources =
        groundingMetadata?.groundingAttributions
          ?.map((a) => ({
            uri: a.web?.uri,
            title: a.web?.title,
          }))
          .filter((s) => s.uri && s.title) || [];
      return { text, sources };
    }

    return {
      text: "I couldn't generate a complete response. Please try rephrasing your question.",
      sources: [],
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      text: "An error occurred while connecting to the AI. Please check your connection or try again later.",
      sources: [],
    };
  }
};
