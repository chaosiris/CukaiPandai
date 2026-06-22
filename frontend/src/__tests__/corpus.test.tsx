import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ClauseList } from "../components/ClauseList";
import { CLAUSES } from "../lib/corpus";

describe("ClauseList", () => {
  test("lists clauses backing citations", () => {
    render(<ClauseList clauses={CLAUSES} />);
    expect(screen.getByText("ITA-1967-s33(1)")).toBeInTheDocument();
  });

  test("search narrows to penalty clauses", () => {
    render(<ClauseList clauses={CLAUSES} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "penalty" } });
    expect(screen.getByText("ITA-1967-s112")).toBeInTheDocument();
    expect(screen.getByText("ITA-1967-s113")).toBeInTheDocument();
    expect(screen.queryByText("ITA-1967-s33(1)")).not.toBeInTheDocument();
  });

  test("search matches the source field, not just text", () => {
    // 's.107C' appears only in the source string (clause_id has no dot), proving multi-field search.
    render(<ClauseList clauses={CLAUSES} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "s.107C" } });
    expect(screen.getByText("ITA-1967-s107C")).toBeInTheDocument();
    expect(screen.queryByText("ITA-1967-s33(1)")).not.toBeInTheDocument();
  });

  test("category chip filters by category", () => {
    // 'Procedure' is only s.107C's category, and that word appears in no clause text.
    render(<ClauseList clauses={CLAUSES} />);
    fireEvent.click(screen.getByRole("button", { name: /^Procedure$/i }));
    expect(screen.getByText("ITA-1967-s107C")).toBeInTheDocument();
    expect(screen.queryByText("ITA-1967-s112")).not.toBeInTheDocument();
  });

  test("shows the empty state when nothing matches", () => {
    render(<ClauseList clauses={CLAUSES} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzzzz" } });
    expect(screen.getByText(/No matching clauses/i)).toBeInTheDocument();
    expect(screen.queryByText("ITA-1967-s33(1)")).not.toBeInTheDocument();
  });
});
