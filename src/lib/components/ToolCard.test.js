import { render, screen } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import ToolCard from "./ToolCard.svelte";

describe("ToolCard", () => {
  const mockTool = {
    id: "test-tool",
    name: "Test Tool",
    description: "A tool for testing",
    icon: "🧪",
    model: "gpt-4o-mini",
  };

  it("renders tool information correctly", () => {
    render(ToolCard, { props: { tool: mockTool } });

    expect(screen.getByText("Test Tool")).toBeInTheDocument();
    expect(screen.getByText("A tool for testing")).toBeInTheDocument();
    expect(screen.getByText("🧪")).toBeInTheDocument();
    expect(screen.getByText("gpt-4o-mini")).toBeInTheDocument();
    expect(screen.getByText("Start Chat")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(ToolCard, { props: { tool: mockTool } });

    const button = screen.getByText("Start Chat");
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe("BUTTON");
  });
});
