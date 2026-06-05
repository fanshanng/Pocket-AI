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
  [/\\mathcal\s*\{?N\}?/g, '𝒩'],
  [/\\mathcal\s*\{?([A-Za-z])\}?/g, '$1'],
  [/\\mathbb\s*\{?R\}?/g, 'ℝ'],
  [/\\mathbb\s*\{?N\}?/g, 'ℕ'],
  [/\\mathbb\s*\{?Z\}?/g, 'ℤ'],
  [/\\mathbb\s*\{?Q\}?/g, 'ℚ'],
  [/\\mathbb\s*\{?C\}?/g, 'ℂ'],
  [/\\mathbf\s*\{([^{}]*)\}/g, '$1'],
  [/\\mathrm\s*\{([^{}]*)\}/g, '$1'],
  [/\\mathit\s*\{([^{}]*)\}/g, '$1'],
  [/\\operatorname\s*\{([^{}]*)\}/g, '$1'],
  [/\\text\s*\{([^{}]*)\}/g, '$1'],
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
  [/\\int\b/g, '∫'],
  [/\\partial\b/g, '∂'],
  [/\\nabla\b/g, '∇'],
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
  [/\\Omega\b/g, 'Ω'],
  [/\\omega\b/g, 'ω'],
  [/\\rho\b/g, 'ρ'],
  [/\\eta\b/g, 'η'],
  [/\\varepsilon\b/g, 'ε'],
  [/\\epsilon\b/g, 'ε'],
  [/\\pi\b/g, 'π'],
  [/\\sim\b/g, '~'],
  [/\\quad\b/g, ' '],
  [/\\equiv\b/g, '≡'],
  [/\\neq\b/g, '≠'],
  [/\\ne\b/g, '≠'],
  [/\\leq?\b/g, '≤'],
  [/\\geq?\b/g, '≥'],
  [/\\in\b/g, '∈'],
  [/\\notin\b/g, '∉'],
  [/\\subseteq\b/g, '⊆'],
  [/\\subset\b/g, '⊂'],
  [/\\cup\b/g, '∪'],
  [/\\cap\b/g, '∩'],
  [/\\forall\b/g, '∀'],
  [/\\exists\b/g, '∃'],
  [/\\lt\b/g, '<'],
  [/\\gt\b/g, '>'],
  [/\\approx\b/g, '≈'],
  [/\\pm\b/g, '±'],
  [/\\infty\b/g, '∞'],
  [/\\oo\b/g, '∞'],
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
    .replace(/\\text([A-Za-z\u4e00-\u9fff]+)/g, '$1')
    .replace(/\\\\[ \t]*/g, '\n');

  normalized = normalizeLatexEnvironmentMarkers(normalized);

  for (const [pattern, value] of replacements) {
    normalized = normalized.replace(pattern, value);
  }

  return normalized
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\s+([^\s{}]+)/g, '√$1')
    .replace(/\\exp\s*\{([^{}]+)\}/g, 'exp($1)')
    .replace(/\\exp\b/g, 'exp')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\frac\s+([^\s{}]+)\s+([^\s{}]+)/g, '($1)/($2)')
    .replace(/\bmathcal\s*\{?N\}?/g, '𝒩')
    .replace(/\bmathcal([A-Za-z])\b/g, '$1')
    .replace(/\bmathbb\s*\{?R\}?/g, 'ℝ')
    .replace(/\bmathbbR\b/g, 'ℝ')
    .replace(/\bmathbb\s*\{?N\}?/g, 'ℕ')
    .replace(/\bmathbbN\b/g, 'ℕ')
    .replace(/\bmathbb\s*\{?Z\}?/g, 'ℤ')
    .replace(/\bmathbbZ\b/g, 'ℤ')
    .replace(/\bmathbb\s*\{?Q\}?/g, 'ℚ')
    .replace(/\bmathbbQ\b/g, 'ℚ')
    .replace(/\bmathbb\s*\{?C\}?/g, 'ℂ')
    .replace(/\bmathbbC\b/g, 'ℂ')
    .replace(/\bsqrt\s*\{([^{}]+)\}/g, '√($1)')
    .replace(/\bsqrt\s*([0-9A-Za-zπσμ]+)/g, '√($1)')
    .replace(/\bfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\bfrac\s*([^{}\s]+)\s*\{\s*([^{}]+)\}/g, '($1)/($2)')
    .replace(/\bfrac\s+([^\s{}]+)\s+([^\s{}]+)/g, '($1)/($2)')
    .replace(/\bexp\s*\{([^{}]+)\}/g, 'exp($1)')
    .replace(/\bint\b/g, '∫')
    .replace(/∫_oo\^([A-Za-z0-9]+)/g, '∫₋∞^$1')
    .replace(/∫_(-?∞)\^([A-Za-z0-9]+)/g, '∫_$1^$2')
    .replace(/\boo\b/g, '∞')
    .replace(/\bpi\b/g, 'π')
    .replace(/([A-Za-z0-9)\]])\s+sim\s+/g, '$1 ~ ')
    .replace(/([A-Za-z0-9)\]])\s+in\s*([([{])/g, '$1 ∈ $2')
    .replace(/\bquad\b/g, ' ')
    .replace(/\^\{([^{}]{1,12})\}/g, (_, value: string) => toScript(value, superscripts))
    .replace(/\^([0-9a-zA-Z])/g, (_, value: string) => toScript(value, superscripts))
    .replace(/_\{([^{}]{1,12})\}/g, (_, value: string) => toScript(value, subscripts))
    .replace(/_([0-9a-zA-Z])/g, (_, value: string) => toScript(value, subscripts))
    .replace(/\s*&=\s*/g, ' = ')
    .replace(/\s*&\s*/g, '  |  ')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/,\s*/g, ', ')
    .replace(/√\(([^()]+)\)/g, '√$1')
    .replace(/\(1\)\/\(([^()]+)\)/g, '1/($1)')
    .replace(/\(([^()]+)\)\/\(([^()]+)\)/g, '($1)/($2)')
    .replace(/exp\(-\(\(([^()]+)\)\)\/\(([^()]+)\)\)/g, 'exp(-($1)/($2))')
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
