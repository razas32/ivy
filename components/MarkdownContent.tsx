import { Fragment, ReactNode } from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

type ListItem = {
  ordered: boolean;
  text: string;
};

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code key={`code-${key++}`} className="ai-md-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`strong-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`em-${key++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          <a
            key={`link-${key++}`}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="ai-md-link"
          >
            {label}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function flushList(listBuffer: ListItem[], blockIndex: number): ReactNode | null {
  if (listBuffer.length === 0) return null;
  const isOrdered = listBuffer[0].ordered;
  const items = listBuffer.map((item, index) => <li key={`li-${blockIndex}-${index}`}>{renderInline(item.text)}</li>);
  return isOrdered ? (
    <ol key={`ol-${blockIndex}`} className="ai-md-ol">
      {items}
    </ol>
  ) : (
    <ul key={`ul-${blockIndex}`} className="ai-md-ul">
      {items}
    </ul>
  );
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return null;

  const lines = normalized.split('\n');
  const blocks: ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: ListItem[] = [];
  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let blockIndex = 0;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    blocks.push(
      <p key={`p-${blockIndex++}`} className="ai-md-p">
        {renderInline(paragraphBuffer.join(' '))}
      </p>
    );
    paragraphBuffer = [];
  };

  const flushListBuffer = () => {
    const list = flushList(listBuffer, blockIndex++);
    if (list) blocks.push(list);
    listBuffer = [];
  };

  const flushCode = () => {
    if (!codeBuffer.length && !codeLang) return;
    blocks.push(
      <pre key={`pre-${blockIndex++}`} className="ai-md-pre">
        {codeLang ? <span className="ai-md-code-lang">{codeLang}</span> : null}
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
    codeBuffer = [];
    codeLang = '';
  };

  for (const line of lines) {
    const codeFence = line.match(/^```(.*)$/);
    if (codeFence) {
      flushParagraph();
      flushListBuffer();
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        codeLang = (codeFence[1] || '').trim();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushListBuffer();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushListBuffer();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const classNameByLevel =
        level === 1 ? 'ai-md-h1' : level === 2 ? 'ai-md-h2' : 'ai-md-h3';
      blocks.push(
        <Fragment key={`h-${blockIndex++}`}>
          {level === 1 && <h1 className={classNameByLevel}>{renderInline(text)}</h1>}
          {level === 2 && <h2 className={classNameByLevel}>{renderInline(text)}</h2>}
          {level === 3 && <h3 className={classNameByLevel}>{renderInline(text)}</h3>}
        </Fragment>
      );
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const ordered = Boolean(orderedMatch);
      const text = (ordered ? orderedMatch?.[1] : unorderedMatch?.[1])?.trim() || '';
      if (listBuffer.length > 0 && listBuffer[0].ordered !== ordered) {
        flushListBuffer();
      }
      listBuffer.push({ ordered, text });
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  if (inCode) {
    flushCode();
  }
  flushParagraph();
  flushListBuffer();

  return <div className={className ? `ai-markdown ${className}` : 'ai-markdown'}>{blocks}</div>;
}
