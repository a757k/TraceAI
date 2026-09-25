export async function searchWeb(query) {
  const response = await fetch(
    `/.netlify/functions/search?q=${encodeURIComponent(query)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Search failed.");
  }

  return data;
}

export async function askCase(question, evidence) {
  const response = await fetch("/.netlify/functions/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      evidence
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI request failed.");
  }

  return data;
}
