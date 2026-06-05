import type { ContentPlugin } from './types';

const superscripts: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  i: 'ⁱ',
  k: 'ᵏ',
  m: 'ᵐ',
  n: 'ⁿ',
  p: 'ᵖ',
  q: 'ᑫ',
  r: 'ʳ',
  t: 'ᵗ',
  x: 'ˣ',
  y: 'ʸ',
};

const subscripts: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

const latexEnvironments = 'cases|aligned|align|array|split|gathered|matrix|pmatrix|bmatrix';

const replacements: Array<[RegExp, string]> = [
  [/\\oplus\b/g, '⊕'],
  [/\\otimes\b/g, '⊗'],
  [/\\land\b/g, '∧'],
  [/\\lor\b/g, '∨'],
  [/\\lnot\b/g, '¬'],
  [/\\not\b/g, '¬'],
  [/\\neg\b/g, '¬'],
  [/\\xor\b/g, '⊕'],
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\sum\b/g, '∑'],
  [/\\prod\b/g, '∏'],
  [/\\Sigma\b/g, 'Σ'],
  [/\\sigma\b/g, 'σ'],
  [/\\Delta\b/g, 'Δ'],
  [/\\delta\b/g, 'δ'],
  [/\\lambda\b/g, 'λ'],
  [/\\mu\b/g, 'μ'],
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\gamma\b/g, 'γ'],
  [/\\theta\b/g, 'θ'],
  [/\\phi\b/g, 'φ'],
  [/\\varphi\b/g, 'φ'],
  [/\\Phi\b/g, 'Φ'],
  [/\\equiv\b/g, '≡'],
  [/\\neq\b/g, '≠'],
  [/\\leq?\b/g, '≤'],
  [/\\geq?\b/g, '≥'],
  [/\\lt\b/g, '<'],
  [/\\gt\b/g, '>'],
  [/\\approx\b/g, '≈'],
  [/\\pm\b/g, '±'],
  [/\\infty\b/g, '∞'],
  [/\\ggg\b/g, '>>>'],
  [/\\gg\b/g, '>>'],
  [/\\ll\b/g, '<<'],
  [/\\mod\b/g, 'mod'],
  [/\\pmod\s*\{([^}]+)\}/g, '(mod $1)'],
  [/\\left\s*/g, ''],
  [/\\right\s*/g, ''],
  [/\\,/g, ' '],
  [/\\;/g, ' '],
  [/\\:/g, ' '],
  [/\\[ \t]/g, ' '],
];

function toScript(value: string, map: Record<string, string>) {
  return value
    .split('')
    .map((char) => map[char] ?? char)
    .join('');
}

function normalizeLatexEnvironmentMarkers(text: string): string {
  const envPattern = new RegExp(`\\\\begin\\s*\\{(?:${latexEnvironments})\\}|\\\\end\\s*\\{(?:${latexEnvironments})\\}`, 'g');
  const compactEnvPattern = new RegExp(`\\\\begin(?:${latexEnvironments})\\b|\\\\end(?:${latexEnvironments})\\b`, 'g');
  const slashEnvPattern = new RegExp(`/begin(?:${latexEnvironments})\\b|/end(?:${latexEnvironments})\\b`, 'g');

  return text.replace(envPattern, '').replace(compactEnvPattern, '').replace(slashEnvPattern, '');
}

function normalizeLatexMathText(text: string): string {
  let normalized = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+)\$/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\text\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\operatorname\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\mathrm\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\mathbf\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\mathit\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\text([A-Za-z\u4e00-\u9fff]+)/g, '$1')
    .replace(/\\\\[ \t]*/g, '\n');

  normalized = normalizeLatexEnvironmentMarkers(normalized);

  for (const [pattern, value] of replacements) {
    normalized = normalized.replace(pattern, value);
  }

  return normalized
    .replace(/\^\{([^{}]{1,12})\}/g, (_, value: string) => toScript(value, superscripts))
    .replace(/\^([0-9a-zA-Z])/g, (_, value: string) => toScript(value, superscripts))
    .replace(/_\{([^{}]{1,12})\}/g, (_, value: string) => toScript(value, subscripts))
    .replace(/_([0-9a-zA-Z])/g, (_, value: string) => toScript(value, subscripts))
    .replace(/\s*&=\s*/g, ' = ')
    .replace(/\s*&\s*/g, '  |  ')
    .replace(/\s*\\\s*/g, ' ')
    .replace(/\s*\/\s*(?=end(?:cases|aligned|align|array|split|gathered|matrix|pmatrix|bmatrix)\b)/g, '\n')
    .replace(/\{([^{}]+)\}/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

export const latexMathPlugin: ContentPlugin = {
  id: 'latex-math',
  label: 'LaTeX Math',
  description: 'Turns common LaTeX math and cryptography tokens into readable plain-text symbols.',
  transformText: normalizeLatexMathText,
};
