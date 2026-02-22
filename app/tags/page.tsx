'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase, Tag } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Tags as TagsIcon } from 'lucide-react';

export default function TagsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  const loadTags = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) setTags(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update({ name: tagName })
          .eq('id', editingTag.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({ title: '标签已更新' });
      } else {
        const { error } = await supabase.from('tags').insert({
          name: tagName,
          user_id: user.id,
        });

        if (error) throw error;
        toast({ title: '标签已创建' });
      }

      setDialogOpen(false);
      setEditingTag(null);
      setTagName('');
      loadTags();
    } catch (error: any) {
      toast({ title: '操作失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return;

    const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', user?.id);

    if (!error) {
      toast({ title: '标签已删除' });
      loadTags();
    } else {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setTagName('');
    setDialogOpen(true);
  };

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">标签管理</h1>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 w-4 h-4" />
            新建标签
          </Button>
        </div>

        {tags.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <TagsIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">还没有标签</h3>
              <p className="text-muted-foreground mb-4">创建标签来标记您的笔记</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 w-4 h-4" />
                新建标签
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="font-medium">#{tag.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(tag)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tag.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? '编辑标签' : '新建标签'}</DialogTitle>
              <DialogDescription>设置标签名称</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  placeholder="输入标签名称"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTag ? '保存' : '创建'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
