const loginPanel = document.getElementById("login-panel");
const invoicePanel = document.getElementById("invoice-panel");
const loginForm = document.getElementById("login-form");
const invoiceForm = document.getElementById("invoice-form");
const loginMessage = document.getElementById("login-message");
const invoiceMessage = document.getElementById("invoice-message");
const invoiceHistory = document.getElementById("invoice-history");
const logoutButton = document.querySelector(".admin-logout");
const sendInvoiceButton = document.getElementById("send-invoice-button");

init();

async function init() {
  const session = await api("/api/session");
  if (session.authenticated) {
    showInvoicePanel();
    await loadInvoices();
  } else {
    showLoginPanel();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "");

  const formData = new FormData(loginForm);
  const password = formData.get("password");

  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    loginForm.reset();
    showInvoicePanel();
    await loadInvoices();
  } catch (error) {
    setMessage(loginMessage, error.message, true);
  }
});

invoiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(invoiceMessage, "");

  const formData = new FormData(invoiceForm);
  const payload = {
    customerName: formData.get("customerName"),
    customerAddress: formData.get("customerAddress"),
    customerEmail: formData.get("customerEmail"),
    workDescription: formData.get("workDescription"),
    amount: formData.get("amount"),
  };

  sendInvoiceButton.disabled = true;
  sendInvoiceButton.textContent = "Sending…";

  try {
    const result = await api("/api/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    invoiceForm.reset();
    setMessage(
      invoiceMessage,
      `Invoice ${result.invoice.invoice_number} sent to ${result.invoice.customer_email}.`,
      false,
      true
    );
    await loadInvoices();
  } catch (error) {
    setMessage(invoiceMessage, error.message, true);
  } finally {
    sendInvoiceButton.disabled = false;
    sendInvoiceButton.textContent = "Send invoice";
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  showLoginPanel();
  loginForm.reset();
  setMessage(loginMessage, "");
  setMessage(invoiceMessage, "");
});

function showLoginPanel() {
  loginPanel.hidden = false;
  invoicePanel.hidden = true;
  logoutButton.hidden = true;
}

function showInvoicePanel() {
  loginPanel.hidden = true;
  invoicePanel.hidden = false;
  logoutButton.hidden = false;
}

async function loadInvoices() {
  const result = await api("/api/invoices");
  const invoices = result.invoices || [];

  if (!invoices.length) {
    invoiceHistory.innerHTML = `<p class="history-empty">No invoices yet.</p>`;
    return;
  }

  invoiceHistory.innerHTML = invoices
    .map((invoice) => {
      const amount = formatMoney(invoice.amount_pence);
      const date = formatDate(invoice.created_at);
      return `
        <article class="invoice-item">
          <div class="invoice-item-top">
            <span class="invoice-item-number">${escapeHtml(invoice.invoice_number)}</span>
            <span class="invoice-item-amount">${escapeHtml(amount)}</span>
          </div>
          <p class="invoice-item-meta">
            ${escapeHtml(invoice.customer_name)} · ${escapeHtml(invoice.customer_email)} · ${escapeHtml(date)}
          </p>
          <p class="invoice-item-work">${escapeHtml(invoice.work_description)}</p>
        </article>
      `;
    })
    .join("");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = data.detail
      ? `${data.error} ${data.detail}`
      : data.error || "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data;
}

function setMessage(element, message, isError = false, isSuccess = false) {
  element.textContent = message;
  element.classList.toggle("is-error", Boolean(message && isError));
  element.classList.toggle("is-success", Boolean(message && isSuccess));
}

function formatMoney(amountPence) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
