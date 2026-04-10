import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";
import fs from "fs";
import * as AuthService from "./auth.service.js";
import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey:
//     "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",
// });

// const response = openai.responses.create({
//   model: "gpt-5-nano",
//   input: "write a haiku about ai",
//   store: true,
// });

// response.then((result) => console.log(result.output_text));

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");

// 👇 try these fallbacks in order
const pdf = pdfModule?.default || pdfModule?.pdf || pdfModule;

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI("AIzaSyB5JldzQfN3kccpwbhxrXpR0GpSAT1tCXY");
async function listModels() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${genAI.apiKey}`,
  );
  const data = await response.json();
  console.log("Your available models:");
  data.models.forEach((m) => console.log(m.name));
}

// listModels();
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

function getFileType(file) {
  if (file.mimetype === "application/pdf") return "pdf";

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.filetype === "docx"
  )
    return "docx";

  if (file.mimetype === "application/msword" || file.filetype === "doc")
    return "doc";

  return "unknown";
}

async function extractText(buffer, type) {
  try {
    if (type === "pdf") {
      const data = await pdf(buffer);
      return data.text;
    }

    if (type === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }

    if (type === "doc") {
      return new Promise((resolve, reject) => {
        textract.fromBufferWithMime(
          "application/msword",
          buffer,
          (err, text) => {
            if (err) return reject(err);
            resolve(text);
          },
        );
      });
    }

    return "";
  } catch (err) {
    console.error("Extraction failed:", err);
    return "";
  }
}

async function fetchWithRetry(url, options, retries = 10) {
  console.log(`Fetching ${url} with retries...`);
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("pdf")) {
        return res.arrayBuffer();
      }
    }

    console.log(`Retry ${i + 1}...`);
    await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // exponential backoff
  }

  throw new Error("Failed to fetch valid PDF after retries");
}

export async function parseResume(files) {
  let promptText = "Resume:\n";

  for (const file of files) {
    const type = getFileType(file);

    if (type === "unknown") {
      console.log("Skipping unsupported:", file.name);
      continue;
    }

    const fileBuffer = await fetchWithRetry(file.url_private, {
      headers: {
        Authorization: `Bearer ${await AuthService.getSlackBotToken()}`,
      },
    });

    const text = await extractText(Buffer.from(fileBuffer), type);

    promptText += `Resume\nResumeUrl:${file.url_private}\n (${file.name}):\n${text}\n\n`;
  }

  // put stopwatch here to measure how long the API call takes
  try {
    const finalPromptText = `
    ${promptText}\n\n
    
    It can happen some file is not resume as well. Please ignore that file and just extract information from the resume file.
    For invalid resume return empty array, don't generate any JSON. If out of 5 files 4 are valid and 1 is invalid, just extract information from the 4 valid resumes and ignore the invalid one, don't mention anything about the invalid one.
    Extract the following fields from this list of resume and return ONLY JSON NO OTHER DATA, RESPONSE SHOULD BE JSON ARRAY, each element in the array should have these fields: name, email, phone, currentCompany, currentTitle, experienceInMonths, resumeUrl. If you can't find any information for a field, just return empty string for that field. Remember to return ONLY JSON and nothing else:
    [{
      "name": "",
      "email": "",
      "phone": "",
      "currentCompany": "",
      "currentTitle": "",
      "experienceInMonths": "",
      "resumeUrl": ""
    }]
    `;
    console.log("Final prompt text:", finalPromptText);
    const start = process.hrtime.bigint(); // upsert user — first time they open the app
    // const result = await model.generateContent(finalPromptText);
    const result = await fetch("http://wizard.taila441a7.ts.net:8765/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: finalPromptText,
      }),
    });
    // console.log("Raw API response:", result.response.text());
    // console.log("Raw API response:", result.response.text());
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    console.log(`API call took ${durationMs.toFixed(2)} ms`);
    // return JSON.parse(result.response.text());
    const data = await result.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error("Failed to parse resume:", err);
    return [];
  }
}
