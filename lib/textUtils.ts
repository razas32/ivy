const COMMON_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'you', 'your', 'our', 'we', 'this', 'those', 'these', 'their', 'they',
  'them', 'about', 'into', 'over', 'under', 'between', 'within', 'across',
]);

const SENIORITY_TERMS = [
  'intern', 'junior', 'mid', 'senior', 'staff', 'lead', 'principal', 'manager', 'director',
];

function normalizeText(input: string) {
  return input.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9+.#\-\s]/g, ' ');
}

export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function extractKeywords(input: string, max = 120): string[] {
  const normalized = normalizeText(input);
  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 32 && !COMMON_STOP_WORDS.has(t));

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

export function detectSeniorityCues(text: string) {
  const lower = text.toLowerCase();
  return SENIORITY_TERMS.filter((term) => lower.includes(term));
}
