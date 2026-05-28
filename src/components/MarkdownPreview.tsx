/** Lightweight Markdown → HTML renderer */

const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g;
const HEADING_RE = /^(#{1,6})\s+(.+)$/gm;
const PARAGRAPH_SPLIT = /\n\n+/;

// Inline syntax
const BOLD_RE = /\*\*(.+?)\*\*/g;
const ITALIC_RE = /\*(.+?)\*/g;
const CODE_RE = /`(.+?)`/g;
const LINK_RE = /\[([^\]]+)]\(([^)]+)\)/g;
const IMAGE_RE = /!\[([^\]]*)]\(([^)]+)\)/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(
      IMAGE_RE,
      '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />',
    )
    .replace(
      LINK_RE,
      '<a href="$2" class="text-rts-accent underline hover:opacity-80" target="_blank" rel="noopener">$1</a>',
    )
    .replace(CODE_RE, '<code class="bg-rts-border/50 px-1.5 py-0.5 rounded text-[0.9em]">$1</code>')
    .replace(BOLD_RE, "<strong>$1</strong>")
    .replace(ITALIC_RE, "<em>$1</em>");
}

function renderLine(line: string): string {
  line = line.trim();

  // Empty line
  if (!line) return "";

  // Horizontal rule
  if (/^(?:---|\*\*\*|___)$/.test(line)) {
    return '<hr class="my-4 border-rts-border" />';
  }

  return `<p class="mb-3 leading-relaxed">${renderInline(line)}</p>`;
}

function markdownToHtml(md: string): string {
  if (!md.trim()) {
    return '<p class="text-rts-mute italic">暂无内容，在编辑器中开始书写...</p>';
  }

  // Extract code blocks and replace with placeholders
  const codeBlocks: string[] = [];
  const noCode = md.replace(CODE_BLOCK_RE, (_match, lang, code) => {
    const i = codeBlocks.length;
    codeBlocks.push(
      `<pre class="bg-rts-bg border border-rts-border rounded-lg p-4 my-3 overflow-x-auto"><code class="text-[13px] leading-relaxed font-mono">${escapeHtml(code.trim())}</code></pre>`,
    );
    return `\n%%CODEBLOCK_${i}%%\n`;
  });

  // Split into blocks by blank lines
  const blocks = noCode.split(PARAGRAPH_SPLIT);
  const htmlParts: string[] = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // Check if block contains code block placeholders
    if (block.includes("%%CODEBLOCK_")) {
      // Placeholder on its own line → replace directly
      const lines = block.split("\n");
      for (const line of lines) {
        const placeholderMatch = line.trim().match(/^%%CODEBLOCK_(\d+)%%$/);
        if (placeholderMatch) {
          htmlParts.push(codeBlocks[Number(placeholderMatch[1])]);
        } else {
          htmlParts.push(renderLine(line));
        }
      }
      continue;
    }

    // Heading
    const headingMatch = block.match(HEADING_RE);
    if (headingMatch && headingMatch[0] === block) {
      const level = block.match(/^(#{1,6})/)?.[1].length ?? 1;
      const text = block.replace(/^#{1,6}\s+/, "");
      const tag = `h${level}` as keyof JSX.IntrinsicElements;
      const sizes: Record<number, string> = {
        1: "text-2xl font-bold mb-4 mt-2",
        2: "text-xl font-bold mb-3 mt-2",
        3: "text-lg font-semibold mb-2",
        4: "text-base font-semibold mb-1",
        5: "text-sm font-semibold mb-1",
        6: "text-xs font-semibold mb-1",
      };
      htmlParts.push(
        `<${tag} class="${sizes[level]} text-rts-text">${renderInline(text)}</${tag}>`,
      );
      continue;
    }

    // Blockquote
    if (block.startsWith(">")) {
      const lines = block.split("\n");
      const quoteContent = lines
        .map((l) => l.replace(/^>\s?/, "").trim())
        .filter(Boolean)
        .map((l) => renderInline(l))
        .join("<br />");
      htmlParts.push(
        `<blockquote class="border-l-4 border-rts-accent/50 pl-4 my-3 text-rts-mute italic">${quoteContent}</blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (block.startsWith("- ") || block.startsWith("* ") || block.startsWith("+ ")) {
      const items = block
        .split("\n")
        .map((l) => l.replace(/^[-*+]\s+/, "").trim())
        .filter(Boolean)
        .map((item) => `<li class="mb-1">${renderInline(item)}</li>`)
        .join("");
      htmlParts.push(`<ul class="list-disc pl-6 mb-3 space-y-1">${items}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(block)) {
      const items = block
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s+/, "").trim())
        .filter(Boolean)
        .map((item) => `<li class="mb-1">${renderInline(item)}</li>`)
        .join("");
      htmlParts.push(`<ol class="list-decimal pl-6 mb-3 space-y-1">${items}</ol>`);
      continue;
    }

    // Regular paragraph
    if (block.includes("\n")) {
      const lines = block.split("\n").filter(Boolean);
      for (const line of lines) {
        htmlParts.push(renderLine(line));
      }
    } else {
      htmlParts.push(renderLine(block));
    }
  }

  return htmlParts.filter(Boolean).join("\n");
}

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = markdownToHtml(content);

  return (
    <div
      className="w-full flex-1 min-h-[350px] bg-rts-panel border border-rts-border rounded-lg p-4 overflow-y-auto text-sm leading-relaxed [&_*]:text-rts-text [&_code]:text-emerald-400 [&_pre]:!text-emerald-400 [&_strong]:text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
