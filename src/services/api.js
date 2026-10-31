const getCsrfToken = () => (window.frappe ? window.frappe.csrf_token : "");

async function postFrappeMethod(method, values) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => body.append(key, value));

  const response = await fetch(
    `https://erp.itgenie.online/api/method/${method}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Frappe-CSRF-Token": getCsrfToken(),
      },
      body: body.toString(),
    },
  );

  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = null;
  }

  if (data === null) {
    const isLocalPreview = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );
    if (isLocalPreview) {
      throw new Error(
        "The Frappe API is not available in the local preview. Open the page on your ERPNext/Frappe website to create the Sales Order and Razorpay payment link.",
      );
    }
    throw new Error(
      `Frappe method "${method}" returned an empty or non-JSON response (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : `Frappe request failed (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error._server_messages = data._server_messages;
    error.userMessage = typeof data.message === "string" ? data.message : "";
    error.excType = data.exc_type;
    throw error;
  }

  return data;
}

export function createBioCultureOrder(values) {
  return postFrappeMethod("create_bioculture_order", values);
}
export async function getBioCultureStates(signal) {
  const response = await fetch(
    "https://erp.itgenie.online/api/method/create_bioculture_order?action=get_states",
    { method: "GET", credentials: "include", signal },
  );
  if (!response.ok) throw new Error("Unable to load states");
  const data = await response.json();
  const states = data?.message?.states;
  if (
    data?.message?.status !== "success" ||
    !Array.isArray(states) ||
    states.length === 0 ||
    !states.every((state) => typeof state === "string" && state.trim())
  ) {
    throw new Error("Invalid states response");
  }
  return states;
}
export function createSupportIssue({ customer_name, customer_number, subject, issue_type }) {
  return postFrappeMethod("create_bioculture_order", {
    action: "create_issue",
    customer_name,
    customer_number,
    subject,
    issue_type,
  });
}
