export async function generateAudio(apiKey: string, text: string) {
  const response = await fetch("https://api.longcat.ai/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify({
      model: "longcat-chat",
      messages: [{ role: "user", content: text }]
    })
  });

  if (!response.ok) {
    console.error("Error desde LongCat API:", await response.text());
    throw new Error("Error al generar audio con LongCat");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function playPreview(text: string) {
  console.log("Preview de texto (simulado):", text);
}
