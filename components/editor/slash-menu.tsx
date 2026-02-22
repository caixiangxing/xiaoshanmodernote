'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Image as ImageIcon,
  Mic,
  Video,
  Quote,
  Code2,
  Minus,
  Type,
} from 'lucide-react';

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  execute: (editor: Editor) => void;
}

const COMMANDS: SlashCommand[] = [
  {
    id: 'h1',
    label: '大标题',
    description: '一级标题',
    icon: <Heading1 className="w-4 h-4" />,
    keywords: ['h1', 'heading', '标题', '大'],
    execute: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: '中标题',
    description: '二级标题',
    icon: <Heading2 className="w-4 h-4" />,
    keywords: ['h2', 'heading', '标题', '中'],
    execute: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: '小标题',
    description: '三级标题',
    icon: <Heading3 className="w-4 h-4" />,
    keywords: ['h3', 'heading', '标题', '小'],
    execute: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet',
    label: '无序列表',
    description: '创建项目列表',
    icon: <List className="w-4 h-4" />,
    keywords: ['bullet', 'list', '列表', '无序'],
    execute: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered',
    label: '有序列表',
    description: '创建编号列表',
    icon: <ListOrdered className="w-4 h-4" />,
    keywords: ['ordered', 'list', '列表', '编号', '有序'],
    execute: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'blockquote',
    label: '引用块',
    description: '添加引用内容',
    icon: <Quote className="w-4 h-4" />,
    keywords: ['quote', 'blockquote', '引用'],
    execute: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code',
    label: '代码块',
    description: '插入代码',
    icon: <Code2 className="w-4 h-4" />,
    keywords: ['code', '代码'],
    execute: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'divider',
    label: '分隔线',
    description: '水平分隔线',
    icon: <Minus className="w-4 h-4" />,
    keywords: ['divider', 'hr', '分隔'],
    execute: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: 'image',
    label: '插入图片',
    description: '上传本地图片',
    icon: <ImageIcon className="w-4 h-4" />,
    keywords: ['image', 'img', '图片'],
    execute: () => {
      const input = document.getElementById('slash-image-upload') as HTMLInputElement;
      if (input) input.click();
    },
  },
  {
    id: 'audio',
    label: '录制音频',
    description: '录制或上传音频',
    icon: <Mic className="w-4 h-4" />,
    keywords: ['audio', 'record', '录音', '音频'],
    execute: () => {
      const input = document.getElementById('slash-audio-upload') as HTMLInputElement;
      if (input) input.click();
    },
  },
  {
    id: 'video',
    label: '插入视频',
    description: '上传视频文件',
    icon: <Video className="w-4 h-4" />,
    keywords: ['video', '视频'],
    execute: () => {
      const input = document.getElementById('slash-video-upload') as HTMLInputElement;
      if (input) input.click();
    },
  },
];

interface SlashMenuProps {
  editor: Editor;
  open: boolean;
  query: string;
  position: { top: number; left: number };
  onClose: () => void;
}

export function SlashMenu({ editor, open, query, position, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter(
    (cmd) =>
      query === '' ||
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [open, filtered, selectedIndex]);

  const handleSelect = (cmd: SlashCommand) => {
    editor.chain().focus().deleteRange({
      from: editor.state.selection.from - query.length - 1,
      to: editor.state.selection.from,
    }).run();
    cmd.execute(editor);
    onClose();
  };

  if (!open || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-400 px-2">块类型</p>
      </div>
      <div className="max-h-72 overflow-y-auto p-1">
        {filtered.map((cmd, index) => (
          <button
            key={cmd.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(cmd);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              index === selectedIndex
                ? 'bg-slate-100 dark:bg-slate-800'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {cmd.icon}
            </span>
            <div>
              <p className="text-sm font-medium">{cmd.label}</p>
              <p className="text-xs text-slate-500">{cmd.description}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-400 px-2">
          ↑↓ 导航 · Enter 选择 · Esc 关闭
        </p>
      </div>
    </div>
  );
}
