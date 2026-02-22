'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, Highlighter } from 'lucide-react';

const TEXT_COLORS = [
  { label: '默认', value: '' },
  { label: '红色', value: '#ef4444' },
  { label: '橙色', value: '#f97316' },
  { label: '黄色', value: '#eab308' },
  { label: '绿色', value: '#22c55e' },
  { label: '蓝色', value: '#3b82f6' },
  { label: '灰色', value: '#6b7280' },
];

interface EditorBubbleMenuProps {
  editor: Editor;
}

interface MenuPosition {
  top: number;
  left: number;
  visible: boolean;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0, visible: false });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMenu = () => {
      const { from, to, empty } = editor.state.selection;

      if (empty || from === to) {
        setPosition((prev) => ({ ...prev, visible: false }));
        return;
      }

      const startCoords = editor.view.coordsAtPos(from);
      const menuWidth = menuRef.current?.offsetWidth ?? 320;
      const endCoords = editor.view.coordsAtPos(to);
      const centerX = (startCoords.left + endCoords.left) / 2;
      const top = startCoords.top - 52 + window.scrollY;
      const left = Math.max(8, centerX - menuWidth / 2 + window.scrollX);

      setPosition({ top, left, visible: true });
    };

    const hideMenu = () => setPosition((prev) => ({ ...prev, visible: false }));

    editor.on('selectionUpdate', updateMenu);
    editor.on('blur', hideMenu);

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('blur', hideMenu);
    };
  }, [editor]);

  if (!position.visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex items-center gap-0.5 bg-slate-900 dark:bg-slate-800 rounded-lg shadow-xl p-1 border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`h-7 w-7 p-0 text-white hover:bg-slate-700 ${editor.isActive('bold') ? 'bg-slate-600' : ''}`}
      >
        <Bold className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`h-7 w-7 p-0 text-white hover:bg-slate-700 ${editor.isActive('italic') ? 'bg-slate-600' : ''}`}
      >
        <Italic className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`h-7 w-7 p-0 text-white hover:bg-slate-700 ${editor.isActive('strike') ? 'bg-slate-600' : ''}`}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`h-7 w-7 p-0 text-white hover:bg-slate-700 ${editor.isActive('code') ? 'bg-slate-600' : ''}`}
      >
        <Code className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`h-7 w-7 p-0 text-white hover:bg-slate-700 ${editor.isActive('highlight') ? 'bg-slate-600' : ''}`}
      >
        <Highlighter className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-5 bg-slate-600 mx-0.5" />

      <div className="flex items-center gap-0.5 px-1">
        {TEXT_COLORS.map((color) => (
          <button
            key={color.value || 'default'}
            type="button"
            title={color.label}
            onClick={() => {
              if (!color.value) {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().setColor(color.value).run();
              }
            }}
            className="w-4 h-4 rounded-full border border-slate-500 hover:scale-125 transition-transform flex-shrink-0 focus:outline-none"
            style={{ backgroundColor: color.value || 'white' }}
          />
        ))}
      </div>
    </div>
  );
}
