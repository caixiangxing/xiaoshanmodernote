'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code2,
  Lightbulb,
  Minus,
  Image as ImageIcon,
  Mic,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { countWords } from '@/lib/word-count';
import { compressImage } from '@/lib/editor-utils';
import { AudioNode, VideoNode } from '@/lib/media-nodes';
import { SlashMenu } from '@/components/editor/slash-menu';
import { EditorBubbleMenu } from '@/components/editor/editor-bubble-menu';
import { VoiceRecorder } from '@/components/editor/voice-recorder';
import { useToast } from '@/hooks/use-toast';

const AUDIO_SIZE_LIMIT = 5 * 1024 * 1024;
const VIDEO_SIZE_LIMIT = 10 * 1024 * 1024;

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onInspireClick?: () => void;
}

interface SlashState {
  open: boolean;
  query: string;
  position: { top: number; left: number };
}

const SlashCommandExtension = Extension.create({
  name: 'slashCommand',
  addKeyboardShortcuts() {
    return {
      '/': () => {
        this.editor.commands.insertContent('/');
        return true;
      },
    };
  },
});

export function TiptapEditor({ content, onChange, placeholder, onInspireClick }: TiptapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [slash, setSlash] = useState<SlashState>({
    open: false,
    query: '',
    position: { top: 0, left: 0 },
  });
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const getEditorInitialContent = () => {
    if (!content) return '';
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
        return parsed;
      }
    } catch {
      // It's HTML content
    }
    return content;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || '输入 / 以插入内容块，或开始写作...',
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg my-4 cursor-pointer' },
        inline: false,
        allowBase64: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      AudioNode,
      VideoNode,
      SlashCommandExtension,
    ],
    content: getEditorInitialContent(),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onChange(json);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
      handleDrop(view, event, slice, moved) {
        if (
          !moved &&
          event.dataTransfer?.files &&
          event.dataTransfer.files.length > 0
        ) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter((f) => f.type.startsWith('image/'));

          if (imageFiles.length > 0) {
            event.preventDefault();
            imageFiles.forEach(async (file) => {
              try {
                const base64 = await compressImage(file);
                const { tr } = view.state;
                const pos = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (pos) {
                  view.dispatch(
                    tr.insert(
                      pos.pos,
                      view.state.schema.nodes.image.create({ src: base64, alt: file.name })
                    )
                  );
                }
              } catch (err) {
                console.error('Drop image error:', err);
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            compressImage(file).then((base64) => {
              const { tr, selection } = view.state;
              view.dispatch(
                tr.insert(
                  selection.from,
                  view.state.schema.nodes.image.create({ src: base64, alt: 'pasted image' })
                )
              );
            }).catch(console.error);

            return true;
          }
        }
        return false;
      },
    },
  });

  const updateSlashMenu = useCallback(() => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
      '\n',
      '\0'
    );

    const slashIdx = textBefore.lastIndexOf('/');

    if (slashIdx === -1) {
      if (slash.open) setSlash((s) => ({ ...s, open: false }));
      return;
    }

    const queryStr = textBefore.slice(slashIdx + 1);
    if (queryStr.includes(' ') || queryStr.includes('\n')) {
      if (slash.open) setSlash((s) => ({ ...s, open: false }));
      return;
    }

    const coords = editor.view.coordsAtPos(from);
    const containerRect = editorContainerRef.current?.getBoundingClientRect();

    const top = coords.bottom + 8 - (containerRect?.top ?? 0) + (editorContainerRef.current?.scrollTop ?? 0);
    const left = Math.max(0, coords.left - (containerRect?.left ?? 0));

    setSlash({
      open: true,
      query: queryStr,
      position: { top, left },
    });
  }, [editor, slash.open]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => updateSlashMenu();
    editor.on('update', handler);
    editor.on('selectionUpdate', handler);
    return () => {
      editor.off('update', handler);
      editor.off('selectionUpdate', handler);
    };
  }, [editor, updateSlashMenu]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const base64 = await compressImage(file);
      editor.chain().focus().setImage({ src: base64, alt: file.name }).run();
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > AUDIO_SIZE_LIMIT) {
      toast({ title: '文件过大', description: '音频文件不能超过 5MB，请使用更短的片段。', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      insertAudioBlock(base64, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > VIDEO_SIZE_LIMIT) {
      toast({ title: '文件过大', description: '视频文件不能超过 10MB，请使用更短的片段。', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      insertVideoBlock(base64, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const insertAudioBlock = (src: string, title?: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'audioBlock',
      attrs: { src, title: title || null },
    }).run();
  };

  const insertVideoBlock = (src: string, title?: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'videoBlock',
      attrs: { src, title: title || null },
    }).run();
  };

  const handleVoiceRecordingComplete = (base64Audio: string) => {
    if (base64Audio.length > AUDIO_SIZE_LIMIT * 1.4) {
      toast({ title: '录音过长', description: '录音超过 5MB 限制，请录制更短的片段。', variant: 'destructive' });
      setShowVoiceRecorder(false);
      return;
    }
    insertAudioBlock(base64Audio, '语音录音');
    setShowVoiceRecorder(false);
  };

  const stats = useMemo(() => {
    if (!editor) return { words: 0, characters: 0, readingTime: 0 };
    const text = editor.getText();
    const words = countWords(text);
    return { words, characters: text.length, readingTime: Math.ceil(words / 200) };
  }, [editor?.state.doc.content]);

  if (!editor) return null;

  return (
    <div
      ref={editorContainerRef}
      className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
    >
      <input
        ref={imageInputRef}
        id="slash-image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        id="slash-audio-upload"
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        id="slash-video-upload"
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
        >
          <Code2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          className="h-8 w-8 p-0"
          title="插入图片"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
          className={`h-8 w-8 p-0 ${showVoiceRecorder ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : ''}`}
          title="录制或上传音频"
        >
          <Mic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          className="h-8 w-8 p-0"
          title="插入视频"
        >
          <Video className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="w-4 h-4" />
        </Button>

        {onInspireClick && (
          <>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onInspireClick}
              className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline text-xs">引导</span>
            </Button>
          </>
        )}
      </div>

      {showVoiceRecorder && (
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4">
          <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => audioInputRef.current?.click()}
          >
            上传音频文件
          </Button>
        </div>
      )}

      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
      >
        <EditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />

        {slash.open && (
          <SlashMenu
            editor={editor}
            open={slash.open}
            query={slash.query}
            position={slash.position}
            onClose={() => setSlash((s) => ({ ...s, open: false }))}
          />
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-2.5 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{stats.words.toLocaleString()}</span> 字
            </span>
            <span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{stats.characters.toLocaleString()}</span> 字符
            </span>
            <span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{stats.readingTime}</span> 分钟阅读
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">输入 / 插入块</span>
        </div>
      </div>
    </div>
  );
}
