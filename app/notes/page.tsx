'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, Note, Category, Tag } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Search, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<(Note & { category?: Category; tags?: Tag[] })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (data) {
      const notesWithTags = await Promise.all(
        data.map(async (note) => {
          const { data: noteTags } = await supabase
            .from('note_tags')
            .select('tag_id, tags(*)')
            .eq('note_id', note.id);

          return {
            ...note,
            tags: noteTags?.map((nt: any) => nt.tags) || [],
          };
        })
      );

      setNotes(notesWithTags);
    }

    setLoading(false);
  };

  const getPlainText = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const filteredNotes = notes.filter((note) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      getPlainText(note.content).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">我的笔记</h1>
          <Link href="/notes/new">
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              新建笔记
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredNotes.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? '没有找到匹配的笔记' : '还没有笔记'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? '尝试其他搜索关键词' : '创建您的第一条笔记开始记录'}
              </p>
              {!searchQuery && (
                <Link href="/notes/new">
                  <Button>
                    <Plus className="mr-2 w-4 h-4" />
                    新建笔记
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow h-full">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {note.title || '无标题'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {getPlainText(note.content) || '暂无内容'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.category && (
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: note.category.color + '20',
                          color: note.category.color,
                        }}
                      >
                        {note.category.name}
                      </span>
                    )}
                    {note.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        #{tag.name}
                      </span>
                    ))}
                    {note.tags && note.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-muted-foreground">
                      更新于 {format(new Date(note.updated_at), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
