import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home Page", () => {
  it("renders without crashing and displays the heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: /to get started, edit the page\.tsx file\./i,
    });

    expect(heading).toBeDefined();
  });
});