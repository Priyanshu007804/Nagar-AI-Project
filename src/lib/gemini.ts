/**
 * Client-side Gemini API proxy.
 * Calls secure server-side routes to keep API keys hidden from the browser.
 */

export async function analyzeIssueImage(base64Image: string) {
  try {
    const response = await fetch("/api/gemini/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error analyzing issue image:", error);
    throw new Error("Failed to analyze image");
  }
}

export async function generateComplaintLetter(
  name: string,
  ward: string,
  issue: string,
  city?: string,
  phone?: string,
  email?: string
) {
  try {
    const response = await fetch("/api/gemini/generate-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ward, issue, city, phone, email }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data.letter;
  } catch (error) {
    console.error("Error generating complaint letter:", error);
    throw new Error("Failed to generate letter");
  }
}

export async function predictCivicRisks(reportsSummary: string) {
  try {
    const response = await fetch("/api/gemini/predict-risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: reportsSummary }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error predicting civic risks:", error);
    return [
      "Unable to generate predictions at this time.",
      "Please check back later when more data is available.",
      "Ensure all areas maintain basic civic hygiene.",
    ];
  }
}
