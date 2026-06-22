import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PricingPage from "../app/pricing/page";

describe("Pricing", () => {
  test("renders the heading and the three tiers", () => {
    render(<PricingPage />);
    expect(screen.getByRole("heading", { name: /Start Free/i })).toBeInTheDocument();
    expect(screen.getByText("Pilot")).toBeInTheDocument();
    expect(screen.getByText("Tax-Agent Firm")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });
});
