import assert from "node:assert/strict";
import test from "node:test";
import { buildWelcomeApplicant, buildWelcomeNewTenant } from "./src/lib/whatsapp-templates.js";

test("tenant welcome uses only name and room", () => {
  const { contentVariables } = buildWelcomeNewTenant({
    name: "Ada",
    roomNumber: "24",
    moveInDate: "2026-11-22",
    rentExpiryDate: "2027-11-22",
  });
  assert.deepEqual(contentVariables, { "1": "Ada", "2": "24" });
});

test("applicant welcome uses name and application ID", () => {
  const { contentVariables } = buildWelcomeApplicant({ name: "Ada", applicationId: "APP-24" });
  assert.deepEqual(contentVariables, { "1": "Ada", "2": "APP-24" });
});
