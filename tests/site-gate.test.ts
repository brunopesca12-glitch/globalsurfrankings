import { afterEach, describe, expect, it } from "vitest";
import { decideSiteGate, siteGateResponse } from "@/lib/site-gate";

function basic(user: string, password: string): string {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

describe("site gate", () => {
  afterEach(() => {
    delete process.env.SITE_GATE_PASSWORD;
    delete process.env.SITE_GATE_USER;
  });

  it("stays off when the password is unset or empty", () => {
    expect(decideSiteGate({ password: undefined, user: undefined, authorization: null })).toBe("off");
    expect(decideSiteGate({ password: "", user: "gsr", authorization: null })).toBe("off");
  });

  it("defaults the user to gsr and accepts that pair", () => {
    expect(decideSiteGate({ password: "preview-secret", user: undefined, authorization: null })).toBe("deny");
    expect(
      decideSiteGate({ password: "preview-secret", user: undefined, authorization: basic("gsr", "preview-secret") }),
    ).toBe("allow");
    expect(
      decideSiteGate({ password: "preview-secret", user: "", authorization: basic("gsr", "preview-secret") }),
    ).toBe("allow");
  });

  it("challenges with an HTTP-safe private-preview realm", () => {
    process.env.SITE_GATE_PASSWORD = "preview-secret";
    const response = siteGateResponse(null);
    const header = response?.headers.get("WWW-Authenticate") ?? "";
    expect(response?.status).toBe(401);
    expect(header).toContain('realm="GSR - private preview"');
    expect([...header].every((char) => char.charCodeAt(0) <= 255)).toBe(true);
  });

  it("honors SITE_GATE_USER and rejects a wrong password", () => {
    expect(
      decideSiteGate({ password: "preview-secret", user: "visitor", authorization: basic("visitor", "preview-secret") }),
    ).toBe("allow");
    expect(
      decideSiteGate({ password: "preview-secret", user: "visitor", authorization: basic("gsr", "preview-secret") }),
    ).toBe("deny");
    expect(
      decideSiteGate({ password: "preview-secret", user: "gsr", authorization: basic("gsr", "nope") }),
    ).toBe("deny");
  });
});
