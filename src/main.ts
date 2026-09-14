const API_URL =
  "https://script.google.com/macros/s/AKfycbwjXStP3vkPsiAIu2UeodHpBoGGkz0dAecHkIKCypR6a75Aw7y7ZiqMDQi9KyOP15Hu/exec";

interface Translation {
  number: string;
  date: string;

  sourceLanguage: string;
  documentNameSource: string;
  issuingAuthoritySource: string;

  targetLanguage: string;
  documentNameTarget: string;
  issuingAuthorityTarget: string;

  withdrawn: boolean;
}

interface ApiResponse {
  success: boolean;
  found?: boolean;
  error?: string;
  translation?: Translation;
}

const form = document.querySelector<HTMLFormElement>("#verification-form")!;
const numberInput =
  document.querySelector<HTMLInputElement>("#request-number")!;
const dateInput =
  document.querySelector<HTMLInputElement>("#request-date")!;
const result = document.querySelector<HTMLDivElement>("#result")!;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const number = numberInput.value.trim();
  const date = dateInput.value;

  if (!number || !date) {
    showError("Please enter both the request number and date.");
    return;
  }

  setLoading(true);

  try {
    const url = new URL(API_URL);

    url.searchParams.set("number", number);
    url.searchParams.set("date", date);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      showError(data.error ?? "Verification failed.");
      return;
    }

    if (!data.found || !data.translation) {
      showNotFound();
      return;
    }

    showTranslation(data.translation);
  } catch (error) {
    console.error(error);
    showError(
      "The verification service could not be reached. Please try again later."
    );
  } finally {
    setLoading(false);
  }
});

function showTranslation(translation: Translation) {
  const status = translation.withdrawn
    ? `<div class="status withdrawn">THIS TRANSLATION HAS BEEN MARKED AS WITHDRAWN</div>`
    : `<div class="status valid">THIS TRANSLATION IS VALID</div>`;

  result.innerHTML = `
    <div class="result-card">
      ${status}

      <h2>Translation found</h2>

      <dl>
        <dt>Request number</dt>
        <dd>${escapeHtml(translation.number)}</dd>

        <dt>Request date</dt>
        <dd>${escapeHtml(translation.date)}</dd>

        <dt>Source language</dt>
        <dd>${escapeHtml(translation.sourceLanguage)}</dd>

        <dt>Document</dt>
        <dd>${escapeHtml(translation.documentNameSource)}</dd>

        <dt>Issuing authority</dt>
        <dd>${escapeHtml(translation.issuingAuthoritySource)}</dd>

        <dt>Target language</dt>
        <dd>${escapeHtml(translation.targetLanguage)}</dd>

        <dt>Translated document</dt>
        <dd>${escapeHtml(translation.documentNameTarget)}</dd>

        <dt>Issuing authority</dt>
        <dd>${escapeHtml(translation.issuingAuthorityTarget)}</dd>
      </dl>
    </div>
  `;
}

function showNotFound() {
  result.innerHTML = `
    <div class="result-card not-found">
      <h2>Translation not found</h2>
      <p>
        No translation request matching the supplied number and date
        was found.
      </p>
    </div>
  `;
}

function showError(message: string) {
  result.innerHTML = `
    <div class="result-card error">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function setLoading(loading: boolean) {
  const button =
    form.querySelector<HTMLButtonElement>("button[type='submit']")!;

  button.disabled = loading;
  button.textContent = loading ? "Verifying..." : "Verify translation";
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}