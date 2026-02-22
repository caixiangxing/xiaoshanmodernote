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
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase, Category } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, FolderOpen } from 'lucide-react';
import * as Icons from 'lucide-react';

const iconOptions = ['Folder', 'BookOpen', 'Lightbulb', 'Heart', 'Music', 'Video', 'Image', 'User', 'BookMarked'];

const colorOptions = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f43f5e',
];

export default function CategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'Folder',
  });

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) setCategories(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({ title: '分类已更新' });
      } else {
        const { error } = await supabase.from('categories').insert({
          ...formData,
          user_id: user.id,
        });

        if (error) throw error;
        toast({ title: '分类已创建' });
      }

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', color: '#3b82f6', icon: 'Folder' });
      loadCategories();
    } catch (error: any) {
      toast({ title: '操作失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return;

    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user?.id);

    if (!error) {
      toast({ title: '分类已删除' });
      loadCategories();
    } else {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', color: '#3b82f6', icon: 'Folder' });
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
          <h1 className="text-3xl font-bold">分类管理</h1>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 w-4 h-4" />
            新建分类
          </Button>
        </div>

        {categories.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">还没有分类</h3>
              <p className="text-muted-foreground mb-4">创建分类来组织您的笔记</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 w-4 h-4" />
                新建分类
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = (Icons as any)[category.icon] || Icons.Folder;
              return (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{category.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? '编辑分类' : '新建分类'}</DialogTitle>
              <DialogDescription>设置分类的名称、颜色和图标</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  placeholder="输入分类名称"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>颜色</Label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>图标</Label>
                <div className="grid grid-cols-7 gap-2">
                  {iconOptions.map((iconName) => {
                    const IconComponent = (Icons as any)[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={`p-2 rounded-lg border transition-colors ${
                          formData.icon === iconName
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingCategory ? '保存' : '创建'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
