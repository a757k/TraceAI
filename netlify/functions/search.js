export default async (request) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({
          error: "Enter a search query."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Search API is not configured. Add BRAVE_SEARCH_API_KEY in Netlify."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const searchUrl =
      "https://api.search.brave.com/res/v1/web/search?" +
      new URLSearchParams({
        q: query.slice(0, 600),
        count: "10",
        safesearch: "moderate",
        search_lang: "en"
      });

    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "The search provider returned an error.",
          details: data?.message || data?.error?.detail || null
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const results = (data.web?.results || []).map((item) => ({
      title: item.title || "Untitled result",
      url: item.url || "",
      description: item.description || "",
      age: item.age || null,
      profile: item.profile || null
    }));

    return new Response(
      JSON.stringify({
        query,
        results
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unable to complete the search.",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
