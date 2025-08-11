import axios from "axios";

export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

export interface WikipediaPageContent {
  title: string;
  content: string;
  url: string;
}

const WIKIPEDIA_BASE_URL = "https://en.wikipedia.org/w/api.php";

export async function searchWikipediaPages(
  query: string,
  limit: number = 5
): Promise<WikipediaSearchResult[]> {
  try {
    const response = await axios.get(WIKIPEDIA_BASE_URL, {
      params: {
        action: "query",
        list: "search",
        srsearch: query,
        srlimit: limit,
        format: "json",
        origin: "*",
      },
    });

    return response.data.query.search.map((result: any) => ({
      title: result.title,
      snippet: result.snippet.replace(/<[^>]*>/g, ""), // Remove HTML tags
      pageid: result.pageid,
    }));
  } catch (error) {
    console.error("Error searching Wikipedia:", error);
    throw new Error("Failed to search Wikipedia");
  }
}

export async function getWikipediaPageContent(
  title: string
): Promise<WikipediaPageContent> {
  try {
    const response = await axios.get(WIKIPEDIA_BASE_URL, {
      params: {
        action: "query",
        titles: title,
        prop: "extracts",
        exintro: false,
        explaintext: true,
        format: "json",
        origin: "*",
      },
    });

    const pages = response.data.query.pages;
    const page = Object.values(pages)[0] as any;

    if (page.missing) {
      throw new Error(`Page "${title}" not found`);
    }

    return {
      title: page.title,
      content: page.extract || "No content available",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        title.replace(/ /g, "_")
      )}`,
    };
  } catch (error) {
    console.error("Error fetching Wikipedia page:", error);
    throw new Error(`Failed to fetch page: ${title}`);
  }
}

export async function getWikipediaPageSummary(
  title: string
): Promise<WikipediaPageContent> {
  try {
    const response = await axios.get(WIKIPEDIA_BASE_URL, {
      params: {
        action: "query",
        titles: title,
        prop: "extracts",
        exintro: true,
        explaintext: true,
        exsectionformat: "plain",
        format: "json",
        origin: "*",
      },
    });

    const pages = response.data.query.pages;
    const page = Object.values(pages)[0] as any;

    if (page.missing) {
      throw new Error(`Page "${title}" not found`);
    }

    return {
      title: page.title,
      content: page.extract || "No summary available",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        title.replace(/ /g, "_")
      )}`,
    };
  } catch (error) {
    console.error("Error fetching Wikipedia summary:", error);
    throw new Error(`Failed to fetch summary: ${title}`);
  }
}
