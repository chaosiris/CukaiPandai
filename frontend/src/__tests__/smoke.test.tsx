import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import Home from "../app/page";

describe("landing", () => {
  test("hero shows the tagline", () => {
    render(<Home />);
    expect(screen.getByText(/Shows Its Receipts/i)).toBeInTheDocument();
  });
});
