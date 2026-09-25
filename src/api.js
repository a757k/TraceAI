export async function searchWeb(query) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    throw new Error("Enter a search query.");
  }

  /*
    Free public search sources.

    We use Wikipedia's public API directly from the browser.
    No API key or paid service is required.
  */

  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: cleanQuery,
      srlimit: "10",
      format: "json",
      origin: "*"
    });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Free search is currently unavailable.");
  }

  const data = await response.json();

  const results = (data.query?.search || []).map((item) => {
    const title = item.title;

    return {
      title,
      url:
        "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(title.replace(/ /g, "_")),
      description: cleanWikiText(item.snippet),
      age: null,
      profile: null
    };
  });

  return {
    query: cleanQuery,
    results
  };
}

function cleanWikiText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}


export async function askCase(question, evidence) {
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    throw new Error("Enter a question.");
  }

  const sources = Array.isArray(evidence)
    ? evidence.slice(0, 10)
    : [];

  /*
    Free local case analysis.

    No AI API.
    No API key.
    No database.
    No paid service.

    This analyses the evidence already collected in the browser.
  */

  const questionWords = cleanQuestion
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const relevant = sources
    .map((source) => {
      const text = (
        `${source.title} ${source.description} ${source.url}`
      ).toLowerCase();

      let score = 0;

      for (const word of questionWords) {
        if (text.includes(word)) {
          score++;
        }
      }

      return {
        ...source,
        score
      };
    })
    .sort((a, b) => b.score - a.score);

  const useful = relevant.filter(
    (source) => source.score > 0
  );

  let answer = "";

  if (useful.length === 0) {
    answer =
      "I could not find a collected source that directly matches " +
      "your question. Search for more public sources and then ask " +
      "the question again.";
  } else {
    answer =
      `I found ${useful.length} collected source` +
      `${useful.length === 1 ? "" : "s"} that may be relevant.\n\n`;

    answer += useful
      .slice(0, 5)
      .map(
        (source, index) =>
          `${index + 1}. ${source.title}\n` +
          `${source.description || "No description available."}`
      )
      .join("\n\n");

    answer +=
      "\n\nThis is a source-based summary, not a verified " +
      "conclusion. Check the original pages before relying on " +
      "important information.";
  }

  return {
    answer,
    sources: useful.slice(0, 10)
  };
}
