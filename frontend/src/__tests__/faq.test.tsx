import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { FaqList } from "../components/FaqList";
import { FAQ_ITEMS } from "../lib/faq";

describe("FaqList", () => {
  test("reveals an answer when its question is clicked", () => {
    render(<FaqList items={FAQ_ITEMS} />);
    const q = screen.getByRole("button", { name: /What does CukaiPandai do/i });
    expect(screen.queryByText(/turns a Malaysian company/i)).not.toBeInTheDocument();
    fireEvent.click(q);
    expect(screen.getByText(/turns a Malaysian company/i)).toBeInTheDocument();
  });

  test("search filters the list", () => {
    render(<FaqList items={FAQ_ITEMS} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "sovereign" } });
    expect(screen.getByRole("button", { name: /Where does inference run/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /What does CukaiPandai do/i })).not.toBeInTheDocument();
  });
});
