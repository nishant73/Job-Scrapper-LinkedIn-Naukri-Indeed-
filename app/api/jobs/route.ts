import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Job, ScraperSource, WorkMode } from "@/types/jobs";

const backendDir =
  process.env.JOB_SCRAPER_DATA_DIR ??
  "C:\\Users\\Nishant Chandraker\\Downloads\\private-job-scraper-main\\private-job-scraper-main";

const jobsCsvPath = path.join(backendDir, "jobs.csv");

type CsvRow = Record<string, string>;

export async function GET() {
  try {
    const csv = await readFile(jobsCsvPath, "utf8");
    const rows = parseCsv(csv);
    const jobs = rows.map(mapRowToJob).sort((a, b) => Date.parse(b.scrapedTime) - Date.parse(a.scrapedTime));

    return NextResponse.json({ jobs, sourceFile: jobsCsvPath });
  } catch (error) {
    return NextResponse.json(
      {
        jobs: [],
        error: error instanceof Error ? error.message : "Unable to read scraper jobs.",
        sourceFile: jobsCsvPath
      },
      { status: 500 }
    );
  }
}

function parseCsv(csv: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), values[index]?.trim() ?? ""]))
  );
}

function mapRowToJob(row: CsvRow): Job {
  const finalScore = toNumber(row.final_score);
  const gptScore = toNumber(row.gpt_score);
  const preScore = toNumber(row.pre_score);
  const score = scoreToPercent(finalScore ?? gptScore ?? preScore ?? 0);
  const createdAt = normalizeDate(row.created_at);
  const description = row.job_description || "No description captured.";
  const source = normalizeSource(row.source);

  return {
    id: row.id ? `job_${row.id}` : row.url_hash || row.job_url,
    jobTitle: row.title || "Untitled job",
    company: row.company || "Unknown company",
    location: inferLocation(row.job_url, description),
    experienceRequired: row.experience_required || "Not mentioned",
    employmentType: inferEmploymentType(description),
    workMode: inferWorkMode(description),
    source,
    postedTime: createdAt,
    scrapedTime: createdAt,
    gptRelevanceScore: score,
    matchPercentage: score,
    applyLink: row.job_url || "#",
    status: "UNAPPLIED",
    notes: "",
    clickCount: 0,
    description,
    companyInfo: row.company ? `${row.company} job scraped from ${source}.` : "Company details not captured.",
    requiredSkills: inferSkills(description),
    benefits: [],
    gptSummary: summarizeDescription(description),
    gptReasoning: row.reason || "No GPT reasoning captured.",
    scoreBreakdown: {
      skillMatch: scoreToPercent(preScore ?? finalScore ?? 0),
      salaryMatch: 0,
      experienceMatch: scoreToPercent(gptScore ?? finalScore ?? 0),
      overallScore: score
    }
  };
}

function normalizeSource(source: string): ScraperSource {
  const normalized = source.toLowerCase();
  if (normalized.includes("linkedin")) return "LinkedIn";
  if (normalized.includes("naukri")) return "Naukri";
  if (normalized.includes("indeed")) return "Indeed";
  return "Company Site";
}

function inferWorkMode(text: string): WorkMode {
  const normalized = text.toLowerCase();
  if (normalized.includes("remote")) return "Remote";
  if (normalized.includes("hybrid")) return "Hybrid";
  return "Onsite";
}

function inferEmploymentType(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes("intern")) return "Internship";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("part time") || normalized.includes("part-time")) return "Part-time";
  return "Full-time";
}

function inferLocation(url: string, description: string) {
  const combined = `${url} ${description}`.toLowerCase();
  const locations = ["bengaluru", "bangalore", "hyderabad", "chennai", "pune", "mumbai", "delhi", "gurgaon", "noida"];
  const match = locations.find((location) => combined.includes(location));
  if (!match) return "Not specified";
  return match === "bengaluru" ? "Bengaluru" : match[0].toUpperCase() + match.slice(1);
}

function inferSkills(description: string) {
  const knownSkills = [
    "Java",
    "Spring Boot",
    "Microservices",
    "REST",
    "SQL",
    "Python",
    "React",
    "Next.js",
    "Node.js",
    "AWS",
    "Azure",
    "Docker",
    "Selenium"
  ];

  return knownSkills.filter((skill) => description.toLowerCase().includes(skill.toLowerCase())).slice(0, 8);
}

function summarizeDescription(description: string) {
  const trimmed = description.replace(/\s+/g, " ").trim();
  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
}

function normalizeDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function toNumber(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function scoreToPercent(score: number) {
  const normalized = score <= 10 ? score * 10 : score;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}
