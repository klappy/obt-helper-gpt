import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateSummary, summarizeAndStore, fetchUserSummaries } from "./llm-client.js";

// Mock fetch for OpenAI API calls
global.fetch = vi.fn();

// Mock Netlify Blobs
vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(() => ({
    setJSON: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
  })),
}));

describe("Issue 1.1.2: LLM Summary Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe("generateSummary", () => {
    it("should call OpenAI API with correct parameters", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: "User discussed recipe modifications and cooking techniques.",
                },
              },
            ],
          }),
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const chatHistory =
        "user: How do I make better pasta?\nassistant: Try using salted water and...";
      const summary = await generateSummary(chatHistory);

      expect(fetch).toHaveBeenCalledWith("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Summarize this conversation in 2-3 sentences, focusing on key topics and outcomes.",
            },
            {
              role: "user",
              content: chatHistory,
            },
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      expect(summary).toBe("User discussed recipe modifications and cooking techniques.");
    });

    it("should throw error when API key is missing", async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(generateSummary("test chat")).rejects.toThrow("OpenAI API key not configured");
    });

    it("should handle API errors gracefully", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(generateSummary("test chat")).rejects.toThrow(
        "OpenAI API error: 401 Unauthorized"
      );
    });
  });

  describe("summarizeAndStore", () => {
    it("should generate summary and store in Blobs", async () => {
      const { getStore } = await import("@netlify/blobs");
      const mockStore = {
        setJSON: vi.fn(),
      };
      getStore.mockReturnValue(mockStore);

      // Mock successful OpenAI response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: "User asked about cooking pasta properly.",
                },
              },
            ],
          }),
      });

      const sessionId = "whatsapp_1234567890";
      const messages = [
        { role: "user", content: "How to cook pasta?" },
        { role: "assistant", content: "Boil salted water first..." },
      ];

      const result = await summarizeAndStore(sessionId, messages);

      expect(result).toEqual({
        sessionId,
        summary: "User asked about cooking pasta properly.",
        messageCount: 2,
        timestamp: expect.any(String),
      });

      expect(mockStore.setJSON).toHaveBeenCalledWith(
        `summary-${sessionId}`,
        expect.objectContaining({
          sessionId,
          summary: "User asked about cooking pasta properly.",
          messageCount: 2,
        })
      );
    });

    it("should format chat history correctly", async () => {
      const { getStore } = await import("@netlify/blobs");
      getStore.mockReturnValue({ setJSON: vi.fn() });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "Test summary" } }],
          }),
      });

      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "Goodbye" },
      ];

      await summarizeAndStore("test-session", messages);

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.messages[1].content).toBe("user: Hello\nassistant: Hi there!\nuser: Goodbye");
    });
  });

  describe("fetchUserSummaries", () => {
    it("should retrieve and sort summaries by timestamp", async () => {
      const { getStore } = await import("@netlify/blobs");
      const mockStore = {
        list: vi.fn().mockResolvedValue({
          blobs: [{ key: "summary-session1" }, { key: "summary-session2" }],
        }),
        get: vi
          .fn()
          .mockResolvedValueOnce({
            sessionId: "session1",
            summary: "First summary",
            timestamp: "2025-01-01T10:00:00Z",
          })
          .mockResolvedValueOnce({
            sessionId: "session2",
            summary: "Second summary",
            timestamp: "2025-01-02T10:00:00Z",
          }),
      };
      getStore.mockReturnValue(mockStore);

      const summaries = await fetchUserSummaries();

      expect(summaries).toHaveLength(2);
      expect(summaries[0].summary).toBe("Second summary"); // Newer first
      expect(summaries[1].summary).toBe("First summary");
      expect(mockStore.list).toHaveBeenCalledWith({ prefix: "summary-" });
    });

    it("should handle errors gracefully and return empty array", async () => {
      const { getStore } = await import("@netlify/blobs");
      getStore.mockReturnValue({
        list: vi.fn().mockRejectedValue(new Error("Storage error")),
      });

      const summaries = await fetchUserSummaries();
      expect(summaries).toEqual([]);
    });
  });
});
