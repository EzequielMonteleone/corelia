import {createHash} from 'node:crypto';

const MAX_CHARS = 2000;
const OVERLAP_CHARS = 300;

export type TextChunk = {
  heading: string | null;
  content: string;
  ordinal: number;
};

const ARTICLE_HEADING =
  /^(?:Artículo|ARTÍCULO|Articulo|ART\.)\s+\d+[^\n]*/;

export function contentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function splitParagraphs(text: string, heading: string | null): TextChunk[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(part => part.length > 0);

  const pieces: string[] = [];
  let current = '';

  const push = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) pieces.push(trimmed);
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > MAX_CHARS) {
      push(current);
      current = '';
      let offset = 0;
      while (offset < paragraph.length) {
        const end = Math.min(offset + MAX_CHARS, paragraph.length);
        pieces.push(paragraph.slice(offset, end).trim());
        if (end === paragraph.length) break;
        offset = Math.max(end - OVERLAP_CHARS, offset + 1);
      }
      continue;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > MAX_CHARS && current) {
      push(current);
      const tail = current.slice(-OVERLAP_CHARS);
      current = `${tail}\n\n${paragraph}`.trim();
    } else {
      current = next;
    }
  }
  push(current);

  return pieces.map(content => ({heading, content, ordinal: 0}));
}

function splitArticles(text: string): {heading: string | null; body: string}[] {
  const lines = text.split('\n');
  const sections: {heading: string | null; body: string}[] = [];
  let heading: string | null = null;
  let body: string[] = [];
  let sawArticle = false;

  const flush = () => {
    const content = body.join('\n').trim();
    if (heading || content) {
      sections.push({heading, body: content});
    }
    body = [];
  };

  for (const line of lines) {
    const match = ARTICLE_HEADING.exec(line.trim());
    if (match && match[0]) {
      sawArticle = true;
      flush();
      heading = match[0].trim();
      const rest = line.trim().slice(match[0].length).trim();
      body = rest ? [rest] : [];
      continue;
    }
    body.push(line);
  }
  flush();

  if (!sawArticle) {
    return [{heading: null, body: text.trim()}];
  }
  return sections.filter(section => section.body.length > 0 || section.heading);
}

/** Short texts stay whole. Longer texts split on Artículo, then paragraphs. */
export function chunkText(input: string): TextChunk[] {
  const text = input.trim();
  if (!text) return [];
  if (text.length <= MAX_CHARS) {
    return [{heading: null, content: text, ordinal: 0}];
  }

  const chunks = splitArticles(text).flatMap(section => {
    const body = section.heading
      ? `${section.heading}\n${section.body}`.trim()
      : section.body;
    if (body.length <= MAX_CHARS) {
      return [{heading: section.heading, content: body, ordinal: 0}];
    }
    return splitParagraphs(body, section.heading);
  });

  return chunks.map((chunk, ordinal) => ({...chunk, ordinal}));
}
