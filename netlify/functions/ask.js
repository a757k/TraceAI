export default async (request) => {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "POST required."
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = await request.json();

    const question = String(body.question || "").trim();
    const evidence = Array.isArray(body.evidence)
      ? body.evidence
      : [];

    if (!question) {
      return new Response(
        JSON.stringify({
          error: "Enter a question."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    /*
      AI PROVIDER HOOK

      Add your preferred AI API here later.

      The frontend already sends:

      {
        question,
        evidence
      }

      This means the rest of the application does not
      need to change when an AI provider is connected.
    */

    const sourceText = evidence
      .slice(0, 10)
      .map(
        (item, index) =>
          `${index + 1}. ${item.title}\n${item.description}\n${item.url}`
      )
      .join("\n\n");

    const answer =
      "AI analysis is not connected yet.\n\n" +
      "Question:\n" +
      question +
      "\n\n" +
      "Available public evidence:\n" +
      (sourceText || "No evidence has been collected yet.");

    return new Response(
      JSON.stringify({
        answer,
        sources: evidence.slice(0, 10)
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
        error: "Unable to process the case.",
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
