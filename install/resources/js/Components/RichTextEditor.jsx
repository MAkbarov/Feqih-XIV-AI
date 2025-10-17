import { useEffect, useRef, useState } from 'react';

export default function RichTextEditor({ value = '', onChange, className = '' }) {
  const editorRef = useRef(null);
  const [html, setHtml] = useState(value || '');

  // Sanitize inline direction styles/attributes that can flip typing order
  const sanitizeHTML = (rawHtml) => {
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = rawHtml || '';
      const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT, null);
      while (walker.nextNode()) {
        const el = walker.currentNode;
        if (el.removeAttribute) {
          if (el.hasAttribute('dir')) el.removeAttribute('dir');
          const style = el.getAttribute('style');
          if (style) {
            const filtered = style
              .split(';')
              .filter(rule => {
                const key = rule.split(':')[0]?.trim().toLowerCase();
                return key && !['direction','unicode-bidi','text-align'].includes(key);
              })
              .join(';');
            if (filtered.trim() === '') el.removeAttribute('style');
            else el.setAttribute('style', filtered);
          }
        }
      }
      return wrapper.innerHTML;
    } catch {
      return rawHtml || '';
    }
  };

  useEffect(() => {
    setHtml(sanitizeHTML(value || ''));
    if (editorRef.current) {
      editorRef.current.setAttribute('dir', 'ltr');
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.unicodeBidi = 'plaintext';
      editorRef.current.style.textAlign = 'left';
    }
  }, [value]);

  const exec = (cmd, arg = null) => {
    editorRef.current?.focus();
    try {
      document.execCommand(cmd, false, arg);
      handleInput();
    } catch {}
  };

  const makeLink = () => {
    const url = prompt('Keçid URL daxil edin:');
    if (url) exec('createLink', url);
  };

  const handleInput = () => {
    const newHtml = editorRef.current?.innerHTML || '';
    const cleaned = sanitizeHTML(newHtml);
    setHtml(cleaned);
    onChange && onChange(cleaned);
  };

  const setBlock = (tag) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    handleInput();
  };

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 shadow ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
        <button type="button" onClick={() => setBlock('h2')} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">H2</button>
        <button type="button" onClick={() => setBlock('p')} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">P</button>
        <span className="mx-1 w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <button type="button" onClick={() => exec('bold')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">Q</button>
        <button type="button" onClick={() => exec('italic')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">İ</button>
        <button type="button" onClick={() => exec('underline')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">A</button>
        <span className="mx-1 w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">1. List</button>
        <button type="button" onClick={makeLink} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">Link</button>
        <span className="mx-1 w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <button type="button" onClick={() => exec('removeFormat')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">Təmizlə</button>
        <button type="button" onClick={() => exec('undo')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">Geri</button>
        <button type="button" onClick={() => exec('redo')} className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700">İrəli</button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[200px] p-3 outline-none text-gray-800 dark:text-gray-100 rte-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: html }}
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}
      />
    </div>
  );
}
