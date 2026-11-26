export const RESET_FROM = "GSR <no-reply@gsr.surf>";

export type ResetMailResult = { sent: true } | { sent: false; reason: "not_configured" | "rejected" };

/** Sends one reset email through Resend. A missing key returns a result and does not throw. */
export async function sendResetEmail(input: {
  apiKey: string | undefined;
  to: string;
  resetUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<ResetMailResult> {
  const apiKey = input.apiKey?.trim() ?? "";
  if (!apiKey) return { sent: false, reason: "not_configured" };
  try {
    const response = await (input.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESET_FROM,
        to: [input.to],
        subject: "Reset your GSR password",
        text: [
          "Reset your GSR password.",
          "",
          input.resetUrl,
          "",
          "This link expires in 60 minutes and works once.",
          "If you did not ask for this, you can ignore this email.",
        ].join("\n"),
      }),
    });
    if (!response.ok) return { sent: false, reason: "rejected" };
    return { sent: true };
  } catch {
    return { sent: false, reason: "rejected" };
  }
}
