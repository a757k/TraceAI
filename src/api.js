const headers = {
  Accept: "application/json"
};

export async function searchWeb(query) {
  const clean = query.trim();

  if (!clean) {
    throw new Error("Enter a name, username, or search term.");
  }

  const encoded = encodeURIComponent(clean);

  const searches = await Promise.allSettled([
    searchWikipedia(clean),
    searchGitHub(clean),
    searchReddit(clean),
    searchDuckDuckGo(clean)
  ]);

  const results = searches
    .filter((item) => item.status === "fulfilled")
    .flatMap((item) => item.value);

  const unique = [];
  const seen = new Set();

  for (const result of results) {
    if (!result.url || seen.has(result.url)) continue;

    seen.add(result.url);
    unique.push(result);
  }

  return {
    query: clean,
    results: unique.slice(0, 30)
  };
}


/* =========================
   DIGITAL FOOTPRINT
========================= */

export async function digitalFootprint(query) {
  const clean = query.trim();

  if (!clean) {
    throw new Error("Enter a name or username.");
  }

  const [
    wikipedia,
    github,
    reddit,
    duckduckgo
  ] = await Promise.allSettled([
    searchWikipedia(clean),
    searchGitHub(clean),
    searchReddit(clean),
    searchDuckDuckGo(clean)
  ]);

  const groups = {
    profiles: [],
    websites: [],
    social: [],
    code: []
  };

  if (github.status === "fulfilled") {
    groups.code.push(...github.value);
    groups.profiles.push(...github.value);
  }

  if (reddit.status === "fulfilled") {
    groups.social.push(...reddit.value);
    groups.profiles.push(...reddit.value);
  }

  if (wikipedia.status === "fulfilled") {
    groups.websites.push(...wikipedia.value);
  }

  if (duckduckgo.status === "fulfilled") {
    groups.websites.push(...duckduckgo.value);
  }

  for (const key of Object.keys(groups)) {
    groups[key] = removeDuplicates(groups[key]).slice(0, 15);
  }

  return {
    query: clean,
    total:
      groups.profiles.length +
      groups.websites.length +
      groups.social.length +
      groups.code.length,
    groups
  };
}


/* =========================
   WIKIPEDIA
========================= */

async function searchWikipedia(query) {
  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: "8",
      format: "json",
      origin: "*"
    });

  const response = await fetch(url, {
    headers
  });

  if (!response.ok) return [];

  const data = await response.json();

  return (data.query?.search || []).map((item) => ({
    title: item.title,
    url:
      "https://en.wikipedia.org/wiki/" +
      encodeURIComponent(item.title.replace(/ /g, "_")),
    description: cleanText(item.snippet),
    source: "Wikipedia",
    category: "website"
  }));
}


/* =========================
   GITHUB
========================= */

async function searchGitHub(query) {
  const url =
    "https://api.github.com/search/users?q=" +
    encodeURIComponent(query) +
    "&per_page=8";

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) return [];

  const data = await response.json();

  return (data.items || []).map((item) => ({
    title: item.login,
    url: item.html_url,
    description:
      `Public GitHub account. Type: ${item.type || "User"}.`,
    source: "GitHub",
    category: "code"
  }));
}


/* =========================
   REDDIT
========================= */

async function searchReddit(query) {
  const url =
    "https://www.reddit.com/search.json?" +
    new URLSearchParams({
      q: query,
      limit: "8",
      sort: "relevance",
      raw_json: "1"
    });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) return [];

  const data = await response.json();

  const children = data.data?.children || [];

  return children.map((item) => {
    const post = item.data;

    return {
      title: post.title || "Reddit post",
      url: post.permalink
        ? "https://www.reddit.com" + post.permalink
        : "https://www.reddit.com",
      description:
        post.selftext?.slice(0, 300) ||
        `Public Reddit post in r/${post.subreddit || "unknown"}.`,
      source: "Reddit",
      category: "social"
    };
  });
}


/* =========================
   DUCKDUCKGO
========================= */

async function searchDuckDuckGo(query) {
  const url =
    "https://api.duckduckgo.com/?" +
    new URLSearchParams({
      q: query,
      format: "json",
      no_html: "1",
      skip_disambig: "0"
    });

  const response = await fetch(url);

  if (!response.ok) return [];

  const data = await response.json();

  const results = [];

  if (data.AbstractURL) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL,
      description: data.AbstractText || "",
      source: "DuckDuckGo",
      category: "website"
    });
  }

  for (const topic of data.RelatedTopics || []) {
    if (topic.FirstURL) {
      results.push({
        title: topic.Text?.split(" - ")[0] || "Related result",
        url: topic.FirstURL,
        description: topic.Text || "",
        source: "DuckDuckGo",
        category: "website"
      });
    }
  }

  return results.slice(0, 8);
}


/* =========================
   CASE AI
========================= */

export async function askCase(question, evidence) {
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    throw new Error("Enter a question.");
  }

  const sources = Array.isArray(evidence)
    ? evidence
    : [];

  const words = cleanQuestion
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const relevant = sources
    .map((source) => {
      const text = (
        `${source.title} ${source.description} ${source.url}`
      ).toLowerCase();

      const score = words.reduce(
        (total, word) =>
          total + (text.includes(word) ? 1 : 0),
        0
      );

      return {
        ...source,
        score
      };
    })
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!relevant.length) {
    return {
      answer:
        "No collected source directly matched the question. " +
        "Search for more information first.",
      sources: []
    };
  }

  const answer =
    `I found ${relevant.length} potentially relevant public source` +
    `${relevant.length === 1 ? "" : "s"}.\n\n` +
    relevant
      .slice(0, 6)
      .map(
        (item, index) =>
          `${index + 1}. ${item.title}\n` +
          `${item.description || "No description available."}\n` +
          `${item.url}`
      )
      .join("\n\n") +
    "\n\nVerify important information using the original sources.";

  return {
    answer,
    sources: relevant.slice(0, 10)
  };
}


function removeDuplicates(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) {
      return false;
    }

    seen.add(item.url);
    return true;
  });
}


function cleanText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
