import { describe, expect, it } from "vitest";
import contract from "../data/api-contract.json";
import { agentMarkdown } from "./api-agent.js";

function definitions(markdown) {
  return JSON.parse(markdown.split("```json\n")[1].split("\n```")[0]).$defs;
}

describe("API documentation for agents", () => {
  it("explains empty-ledger setup using real supported resources before expense writes", () => {
    const markdown = agentMarkdown("https://api.norulo.com");
    const setup = markdown.split("## From an empty ledger to useful expense records")[1].split("## Authentication")[0];
    for (const path of ["/api/v1/me", "/api/v1/categories", "/api/v1/projects", "/api/v1/expenses", "/api/v1/reports/summary", "/api/v1/expense-recurring-rules"])
      expect(contract.paths[path]).toBeDefined();
    expect(setup.indexOf("POST /api/v1/categories")).toBeLessThan(setup.indexOf("POST /api/v1/expenses,"));
    expect(markdown).toContain("Categories belong to the ledger");
    expect(markdown).toContain("the shared pool is a cost destination inside that ledger");
    expect(markdown).toContain("Read-only defaults cannot add expenses");
    expect(markdown).toContain("has no image/PDF receipt-upload endpoint");
    expect(markdown).toContain("ask for secure configuration, not the plaintext token");
    expect(setup).toContain("skipped duplicates, unresolved inputs and failed/uncertain writes");
    expect(setup).toContain("do not also import that same initial cost");
  });
  it("covers every Bearer endpoint with its current scope, write headers and success shape", () => {
    const markdown = agentMarkdown("https://api.norulo.com");
    for (const [path, item] of Object.entries(contract.paths)) {
      for (const [method, operation] of Object.entries(item)) {
        if (!operation.responses) continue;
        const heading = `### ${method.toUpperCase()} ${path}`;
        const bearer = (operation.security ?? contract.security).some((entry) => entry.bearerKey);
        if (!bearer) {
          expect(markdown).not.toContain(heading);
          continue;
        }
        const section = markdown.split(heading + "\n")[1]?.split("### ")[0];
        expect(section, heading).toBeDefined();
        expect(section).toContain(`Scope: ${operation["x-norulo-scope"]}`);
        for (const [status] of Object.entries(operation.responses))
          if (status.startsWith("2")) expect(section).toContain(status);
        for (const raw of operation.parameters || []) {
          const parameter = raw.$ref
            ? contract.components.parameters[raw.$ref.split("/").at(-1)]
            : raw;
          if (parameter.required && parameter.in === "header")
            expect(section).toContain(parameter.name);
        }
      }
    }
  });

  it("deduplicates schemas while retaining validation, unions and read-only fields", () => {
    const schemas = definitions(agentMarkdown("https://api.norulo.com"));
    expect(schemas.ExpenseFields.required).toEqual(
      contract.components.schemas.ExpenseFields.required
    );
    expect(schemas.ExpenseFields.properties.amount.pattern).toBe(
      contract.components.schemas.ExpenseFields.properties.amount.pattern
    );
    expect(schemas.ExpenseFields.properties.purpose.maxLength).toBe(500);
    expect(schemas.ProjectInput.properties.githubRepoIds.maxItems).toBe(30);
    expect(schemas.ProjectInput.properties.description).toEqual({
      type: "string",
      maxLength: 2000,
    });
    expect(schemas.ProjectInput.allOf[0].then.required).toContain("name");
    expect(schemas.Target.oneOf).toHaveLength(2);
    expect(schemas.RecurringExpenseSchedule.allOf).toHaveLength(4);
    expect(schemas.ExpenseLastSource.readOnly).toBe(true);
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (node.$ref) {
        expect(node.$ref).toMatch(/^#\/\$defs\//);
        expect(schemas[node.$ref.split("/").at(-1)]).toBeDefined();
      }
      Object.values(node).forEach(walk);
    };
    walk(schemas);
    expect(JSON.stringify(schemas)).not.toContain('"description":"');
  });

  it("preserves conditional authority, exact money and recovery rules", () => {
    const markdown = agentMarkdown("https://norulo.com/api/");
    expect(markdown).toContain("Base URL: https://norulo.com/api\n");
    expect(markdown).toContain("https://norulo.com/api/api/v1/expenses");
    for (const rule of [
      "Expense PATCH replaces",
      "Changed input/new intent needs a new key",
      "412",
      "428",
      "9007199254740991",
      "keep currencies separate",
      "CATEGORY_REQUIRED",
      "immutable target",
      "retryPeriodKey",
      "Cookie writes require",
      "Only the original inviter",
      "16:10 UTC",
      "RETENTION_TARGET_FORBIDDEN",
    ])
      expect(markdown).toContain(rule);
  });
});
