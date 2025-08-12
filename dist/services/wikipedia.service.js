"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWikipediaPages = searchWikipediaPages;
exports.getWikipediaPageContent = getWikipediaPageContent;
exports.getWikipediaPageSummary = getWikipediaPageSummary;
const axios_1 = __importDefault(require("axios"));
const WIKIPEDIA_BASE_URL = "https://en.wikipedia.org/w/api.php";
function searchWikipediaPages(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, limit = 5) {
        try {
            const response = yield axios_1.default.get(WIKIPEDIA_BASE_URL, {
                params: {
                    action: "query",
                    list: "search",
                    srsearch: query,
                    srlimit: limit,
                    format: "json",
                    origin: "*",
                },
            });
            return response.data.query.search.map((result) => ({
                title: result.title,
                snippet: result.snippet.replace(/<[^>]*>/g, ""), // Remove HTML tags
                pageid: result.pageid,
            }));
        }
        catch (error) {
            console.error("Error searching Wikipedia:", error);
            throw new Error("Failed to search Wikipedia");
        }
    });
}
function getWikipediaPageContent(title) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(WIKIPEDIA_BASE_URL, {
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
            const page = Object.values(pages)[0];
            if (page.missing) {
                throw new Error(`Page "${title}" not found`);
            }
            return {
                title: page.title,
                content: page.extract || "No content available",
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
            };
        }
        catch (error) {
            console.error("Error fetching Wikipedia page:", error);
            throw new Error(`Failed to fetch page: ${title}`);
        }
    });
}
function getWikipediaPageSummary(title) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(WIKIPEDIA_BASE_URL, {
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
            const page = Object.values(pages)[0];
            if (page.missing) {
                throw new Error(`Page "${title}" not found`);
            }
            return {
                title: page.title,
                content: page.extract || "No summary available",
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
            };
        }
        catch (error) {
            console.error("Error fetching Wikipedia summary:", error);
            throw new Error(`Failed to fetch summary: ${title}`);
        }
    });
}
