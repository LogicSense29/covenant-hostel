/**
 * Utility for sending SMS via BulkSMSNigeria
 */

export async function sendSMS({ to, body }) {
  const apiToken = process.env.BULKSMSNIGERIA_API_TOKEN;
  
  if (!apiToken) {
    console.warn("SMS skipped: BULKSMSNIGERIA_API_TOKEN is not configured in environment variables.");
    return false;
  }

  if (!to) {
    console.warn("SMS skipped: No destination phone number provided.");
    return false;
  }

  try {
    const url = new URL("https://www.bulksmsnigeria.com/api/v1/sms/create");
    url.searchParams.append("api_token", apiToken);
    url.searchParams.append("from", "CovenantHst"); // Note: BulkSMSNigeria limits Sender ID to 11 chars
    url.searchParams.append("to", to);
    url.searchParams.append("body", body);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok && data.data?.status === "success") {
      console.log(`SMS sent successfully to ${to}.`);
      return true;
    } else {
      console.error(`Failed to send SMS to ${to}:`, data.error?.message || data.message || "Unknown error");
      return false;
    }
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error.message || error);
    return false;
  }
}
