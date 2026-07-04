import type { RichDoc, RichNode } from '@domain/blocks';
import { TABLE_BLOCK, type TableData } from '@domain/table';

/**
 * Serialize a document's block tree to Markdown for export (zero lock-in).
 * Covers the block and mark vocabulary RNOTE produces today; unknown nodes fall
 * back to serializing their children so nothing is silently dropped.
 */
export function richDocToMarkdown(doc: RichDoc): string {
  const body = (doc.content ?? [])
    .map((node) => serializeBlock(node, 0))
    .filter((s) => s.length > 0)
    .join('\n\n');
  return `${body}\n`.replace(/\n{3,}/g, '\n\n');
}

function serializeBlock(node: RichNode, depth: number): string {
  switch (node.type) {
    case 'heading':
      return `${'#'.repeat((node.attrs?.level as number) ?? 1)} ${inline(node)}`;
    case 'paragraph':
      return inline(node);
    case 'blockquote':
      return prefixLines(childBlocks(node, depth), '> ');
    case 'bulletList':
      return (node.content ?? []).map((li) => listItem(li, depth, '-')).join('\n');
    case 'orderedList':
      return (node.content ?? []).map((li, i) => listItem(li, depth, `${i + 1}.`)).join('\n');
    case 'taskList':
      return (node.content ?? [])
        .map((item) => {
          const checked = item.attrs?.checked ? 'x' : ' ';
          return `${'  '.repeat(depth)}- [${checked}] ${inline(firstParagraph(item) ?? item)}`;
        })
        .join('\n');
    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? '';
      return `\`\`\`${lang}\n${textContent(node)}\n\`\`\``;
    }
    case 'horizontalRule':
      return '---';
    case 'image':
      return `![${(node.attrs?.alt as string) ?? ''}](${(node.attrs?.src as string) ?? ''})`;
    case 'callout': {
      const icon = (node.attrs?.icon as string) ?? '💡';
      return prefixLines(childBlocks(node, depth), '> ').replace(/^> /, `> ${icon} `);
    }
    case TABLE_BLOCK: {
      const data = (node.attrs as { data?: TableData } | undefined)?.data;
      if (!data || !Array.isArray(data.columns) || data.columns.length === 0) return '';
      const esc = (v: unknown): string =>
        v === null || v === undefined ? '' : String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const header = `| ${data.columns.map((c) => esc(c.name)).join(' | ')} |`;
      const divider = `| ${data.columns.map(() => '---').join(' | ')} |`;
      const rows = data.rows.map(
        (r) =>
          `| ${data.columns
            .map((c) => {
              const v = r.cells[c.id];
              if (c.type === 'checkbox') return v ? '☑' : '☐';
              return esc(v);
            })
            .join(' | ')} |`,
      );
      return [header, divider, ...rows].join('\n');
    }
    case 'details': {
      const summary = (node.content ?? []).find((c) => c.type === 'detailsSummary');
      const content = (node.content ?? []).find((c) => c.type === 'detailsContent');
      const head = `**${summary ? inline(summary) : 'Toggle'}**`;
      const body = content ? childBlocks(content, depth) : '';
      return body ? `${head}\n\n${body}` : head;
    }
    default:
      return node.content ? childBlocks(node, depth) : inline(node);
  }
}

function childBlocks(node: RichNode, depth: number): string {
  return (node.content ?? []).map((c) => serializeBlock(c, depth)).join('\n\n');
}

function listItem(item: RichNode, depth: number, marker: string): string {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];
  for (const child of item.content ?? []) {
    if (child.type === 'bulletList' || child.type === 'orderedList' || child.type === 'taskList') {
      lines.push(serializeBlock(child, depth + 1));
    } else {
      lines.push(inline(child));
    }
  }
  const first = lines.shift() ?? '';
  return `${indent}${marker} ${first}${lines.length ? `\n${lines.join('\n')}` : ''}`;
}

function firstParagraph(node: RichNode): RichNode | undefined {
  return (node.content ?? []).find((c) => c.type === 'paragraph');
}

function prefixLines(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function inline(node: RichNode): string {
  if (node.text !== undefined) return applyMarks(node);
  return (node.content ?? []).map(inline).join('');
}

function applyMarks(node: RichNode): string {
  let text = node.text ?? '';
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `*${text}*`;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'link':
        text = `[${text}](${(mark.attrs?.href as string) ?? ''})`;
        break;
      default:
        break;
    }
  }
  return text;
}

function textContent(node: RichNode): string {
  if (node.text !== undefined) return node.text;
  return (node.content ?? []).map(textContent).join('');
}
