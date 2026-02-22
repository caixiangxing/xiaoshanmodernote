'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { TiptapEditor } from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase, Note, Category, Tag } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMood } from '@/lib/mood-context';
import { useAvatar } from '@/lib/avatar-context';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromJSON, isJSONContent } from '@/lib/editor-utils';
import {
  Save,
  Trash2,
  Download,
  Sparkles,
  Loader2,
  X,
  Check,
  FileText,
  Lightbulb,
  Heart,
  Wind,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import * as Icons from 'lucide-react';
import { BreathingExercise } from '@/components/breathing-exercise';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getPlaceholder } = useMood();
  const { analyzeAndRespond } = useAvatar();
  const { toast } = useToast();
  const noteId = params.id as string;
  const isNew = noteId === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ summary: string; keywords: string[] } | null>(null);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [editableAiSummary, setEditableAiSummary] = useState('');
  const [showPromptsDialog, setShowPromptsDialog] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [mockAiAnalysis, setMockAiAnalysis] = useState<string | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [emotionalLabel, setEmotionalLabel] = useState<string | null>(null);
  const [showGuardianCard, setShowGuardianCard] = useState(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [detectedMoodScore, setDetectedMoodScore] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadCategoriesAndTags();
      if (!isNew) {
        loadNote();
      }
    }
  }, [user, noteId]);

  const loadNote = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setTitle(data.title);
      setContent(data.content);
      setCategoryId(data.category_id || undefined);

      const { data: noteTags } = await supabase
        .from('note_tags')
        .select('tag_id')
        .eq('note_id', noteId);

      if (noteTags) {
        setSelectedTags(noteTags.map((nt) => nt.tag_id));
      }
    }

    setLoading(false);
  };

  const loadCategoriesAndTags = async () => {
    if (!user) return;

    const [categoriesResult, tagsResult] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('tags').select('*').eq('user_id', user.id).order('name'),
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (tagsResult.data) setTags(tagsResult.data);
  };

  const getPlainText = (raw: string): string => {
    if (!raw) return '';
    if (isJSONContent(raw)) return extractTextFromJSON(raw);
    try {
      return new DOMParser().parseFromString(raw, 'text/html').body.textContent || '';
    } catch {
      return raw;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const plainText = getPlainText(content);
    const emotionalAnalysis = analyzeEmotionalContent(plainText);

    if (emotionalAnalysis.needsSupport) {
      setSaving(false);
      return;
    }

    if (emotionalAnalysis.score && emotionalAnalysis.score <= 4) {
      await supabase.from('mood_logs').insert({
        user_id: user.id,
        mood_score: emotionalAnalysis.score,
        logged_at: new Date().toISOString(),
        notes: `Auto-detected from note: ${title || '无标题'}`,
      });
    }

    setSaving(true);

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title: title || '无标题',
            content,
            category_id: categoryId || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data && selectedTags.length > 0) {
          await supabase
            .from('note_tags')
            .insert(selectedTags.map((tagId) => ({ note_id: data.id, tag_id: tagId })));
        }

        toast({ title: '笔记已创建' });
        router.push(`/notes/${data.id}`);
      } else {
        const { error } = await supabase
          .from('notes')
          .update({
            title: title || '无标题',
            content,
            category_id: categoryId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', noteId)
          .eq('user_id', user.id);

        if (error) throw error;

        await supabase.from('note_tags').delete().eq('note_id', noteId);

        if (selectedTags.length > 0) {
          await supabase
            .from('note_tags')
            .insert(selectedTags.map((tagId) => ({ note_id: noteId, tag_id: tagId })));
        }

        toast({ title: '笔记已保存' });
      }

      const afterSavePlainText = getPlainText(content);
      const emotionalAnalysis = analyzeEmotionalContent(afterSavePlainText);
      analyzeAndRespond(afterSavePlainText, emotionalAnalysis.score).catch(console.error);

    } catch (error: any) {
      toast({ title: '保存失败', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || isNew) return;

    if (!confirm('确定要删除这条笔记吗？')) return;

    const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', user.id);

    if (!error) {
      toast({ title: '笔记已删除' });
      router.push('/notes');
    } else {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    }
  };

  const handleAiAnalysis = async () => {
    setAiAnalyzing(true);
    setShowAiDialog(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const plainText = getPlainText(content);
    const words = plainText.split(/\s+/).filter((w) => w.length > 2);
    const uniqueWords = Array.from(new Set(words.slice(0, 10)));

    const summary = plainText.slice(0, 200) + '...';
    setAiResult({
      summary,
      keywords: uniqueWords,
    });
    setEditableAiSummary(summary);
    setAiAnalyzing(false);
  };

  const handleAppendToNote = () => {
    if (!aiResult) return;

    try {
      const existing = isJSONContent(content) ? JSON.parse(content) : { type: 'doc', content: [] };
      const appendNodes = [
        { type: 'horizontalRule' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'AI 分析结果' }] },
        { type: 'paragraph', content: [
          { type: 'text', marks: [{ type: 'bold' }], text: '摘要：' },
          { type: 'text', text: editableAiSummary },
        ]},
        { type: 'paragraph', content: [
          { type: 'text', marks: [{ type: 'bold' }], text: '关键词：' },
          { type: 'text', text: aiResult.keywords.join(', ') },
        ]},
      ];
      const merged = {
        ...existing,
        content: [...(existing.content || []), ...appendNodes],
      };
      setContent(JSON.stringify(merged));
    } catch {
      setContent(content + `\n\n## AI 分析结果\n\n**摘要：**${editableAiSummary}\n\n**关键词：**${aiResult.keywords.join(', ')}`);
    }
    setShowAiDialog(false);
    toast({ title: 'AI 分析已添加到笔记' });
  };

  const handleGenerateShareCard = async () => {
    const cardElement = document.getElementById('share-card');
    if (!cardElement) return;

    const canvas = await html2canvas(cardElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const link = document.createElement('a');
    link.download = `${title || '笔记'}-分享卡片.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({ title: '分享卡片已下载' });
    setShowShareDialog(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleGeneratePrompts = async () => {
    setPromptsLoading(true);
    setShowPromptsDialog(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const plainText = getPlainText(content);

    const prompts = [
      plainText.length < 50
        ? '这个主题让你有什么感受？能否详细描述一下？'
        : '在这次经历中，什么是最让你难忘的时刻？',
      plainText.includes('人') || plainText.includes('朋友') || plainText.includes('同事')
        ? '这次交流与上次相比有什么不同？你们之间的关系发生了什么变化？'
        : '这个经历对你的未来计划有什么影响？',
      '如果让你给自己一年后的自己写一段话，你会说什么？'
    ];

    setAiPrompts(prompts);
    setPromptsLoading(false);
  };

  const handleGenerateMockAnalysis = async () => {
    setGeneratingAnalysis(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const plainText = getPlainText(content);
    const wordCount = plainText.length;

    const analysis = wordCount > 100
      ? `这篇笔记体现了深刻的战略性思维。您的观察细腻且富有洞察力，展现出对主题的全面理解。文字中蕴含着理性与感性的平衡，既有逻辑推理，又不失人文关怀。\n\n关键主题：自我反思、成长轨迹、价值观探索\n\n建议：您可以进一步探索这些想法如何与您的长期目标相连接。`
      : wordCount > 20
      ? `这是一个简洁而有力的记录。虽然篇幅不长，但核心思想清晰可见。这种精炼的表达方式往往能够直击要害。\n\n建议：可以尝试展开某个特别触动您的细节，让思考更加立体。`
      : `您开启了一个新的思考。即使是最简短的记录，也是思维旅程的重要起点。\n\n建议：继续写下去，让想法自然流淌。`;

    setMockAiAnalysis(analysis);
    setGeneratingAnalysis(false);
  };

  const handleInsertPrompt = (prompt: string) => {
    try {
      const existing = isJSONContent(content) ? JSON.parse(content) : { type: 'doc', content: [] };
      const promptNode = {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: prompt }],
      };
      const merged = {
        ...existing,
        content: [...(existing.content || []), promptNode, { type: 'paragraph', content: [] }],
      };
      setContent(JSON.stringify(merged));
    } catch {
      setContent(content + `\n\n### ${prompt}\n\n`);
    }
    toast({ title: '问题已添加到笔记' });
    setShowPromptsDialog(false);
  };

  const analyzeEmotionalContent = (text: string) => {
    const lowerText = text.toLowerCase();

    const distressKeywords = ['hopeless', '绝望', '放弃', '不想活', '没意义', '痛苦', '无助', '累了'];
    const sadKeywords = ['sad', '悲伤', 'tired', '疲惫', 'pain', '痛', '难过', '失落', '孤独', '迷茫'];
    const happyKeywords = ['happy', '开心', 'excited', '兴奋', '快乐', '高兴', '幸福', '美好', '棒', '太好了'];
    const anxiousKeywords = ['worried', '担心', 'anxious', '焦虑', '紧张', '害怕', '恐惧', '不安'];
    const angryKeywords = ['angry', '生气', 'frustrated', '沮丧', '烦躁', '愤怒', '讨厌'];

    const hasDistress = distressKeywords.some(keyword => lowerText.includes(keyword));
    const hasSad = sadKeywords.some(keyword => lowerText.includes(keyword));
    const hasHappy = happyKeywords.some(keyword => lowerText.includes(keyword));
    const hasAnxious = anxiousKeywords.some(keyword => lowerText.includes(keyword));
    const hasAngry = angryKeywords.some(keyword => lowerText.includes(keyword));

    if (hasDistress) {
      setEmotionalLabel('🆘 需要关怀');
      setDetectedMoodScore(1);
      setShowGuardianCard(true);
      return { label: '需要关怀', score: 1, needsSupport: true };
    } else if (hasSad) {
      setEmotionalLabel('💙 忧郁');
      setDetectedMoodScore(3);
      return { label: '忧郁', score: 3, needsSupport: false };
    } else if (hasAnxious) {
      setEmotionalLabel('😰 焦虑');
      setDetectedMoodScore(4);
      return { label: '焦虑', score: 4, needsSupport: false };
    } else if (hasAngry) {
      setEmotionalLabel('😤 愤怒');
      setDetectedMoodScore(4);
      return { label: '愤怒', score: 4, needsSupport: false };
    } else if (hasHappy) {
      setEmotionalLabel('🎉 愉悦');
      setDetectedMoodScore(8);
      return { label: '愉悦', score: 8, needsSupport: false };
    }

    setEmotionalLabel(null);
    setDetectedMoodScore(null);
    return { label: null, score: null, needsSupport: false };
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
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          <div className={`flex-1 space-y-6 transition-all duration-300 ${aiPanelOpen ? 'mr-0' : 'mr-0'}`}>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">{isNew ? '新建笔记' : '编辑笔记'}</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiPanelOpen ? '隐藏' : '显示'} AI 洞察
                </Button>
            {!isNew && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowAiDialog(true)}>
                  <Sparkles className="mr-2 w-4 h-4" />
                  AI 归纳
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                  <Download className="mr-2 w-4 h-4" />
                  分享卡片
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-2 w-4 h-4" />
                  删除
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  保存中
                </>
              ) : (
                <>
                  <Save className="mr-2 w-4 h-4" />
                  保存
                </>
              )}
            </Button>
          </div>
        </div>

        {showGuardianCard && !showBreathingExercise && (
          <Alert className="border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/50 dark:via-pink-950/50 dark:to-blue-950/50 backdrop-blur-sm shadow-xl animate-in slide-in-from-top duration-500">
            <Heart className="h-6 w-6 text-purple-500 fill-purple-500" />
            <AlertTitle className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-3">
              你并不孤单
            </AlertTitle>
            <AlertDescription className="space-y-4">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                听起来这是一段很艰难的时光。请记住，这里是一个安全的空间。你的感受是真实且重要的。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowGuardianCard(false);
                    setShowBreathingExercise(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
                >
                  <Wind className="w-4 h-4" />
                  开始 1 分钟呼吸练习
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGuardianCard(false)}
                  className="gap-2"
                >
                  暂时关闭
                </Button>
              </div>
              <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-sm text-muted-foreground">
                  💙 如果你正在经历严重的情绪困扰，请考虑联系专业心理咨询师或拨打心理援助热线：<strong>400-161-9995</strong>
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showBreathingExercise && (
          <div className="animate-in fade-in zoom-in duration-500">
            <BreathingExercise onClose={() => setShowBreathingExercise(false)} />
          </div>
        )}

        {emotionalLabel && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">AI 情绪标签：{emotionalLabel}</span>
          </div>
        )}

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                placeholder="输入笔记标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>分类</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const IconComponent = (Icons as any)[cat.icon] || Icons.Folder;
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(isSelected ? undefined : cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-current shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      style={{
                        backgroundColor: isSelected ? cat.color + '20' : 'transparent',
                        color: isSelected ? cat.color : 'inherit',
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="font-medium">{cat.name}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[40px]">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="ml-1 w-3 h-3" onClick={() => toggleTag(tag.id)} />
                    )}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">暂无标签</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>内容</Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder={getPlaceholder()}
                onInspireClick={handleGeneratePrompts}
              />
            </div>

          </CardContent>
        </Card>
          </div>

          {aiPanelOpen && (
            <div className="w-80 flex-shrink-0">
              <Card className="sticky top-4 bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/30 dark:to-pink-950/30 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/30 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <CardTitle className="text-lg">AI 洞察</CardTitle>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    智能分析您的笔记内容
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!mockAiAnalysis && !generatingAnalysis && (
                    <div className="text-center py-8">
                      <Lightbulb className="w-16 h-16 text-purple-300 dark:text-purple-700 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        AI 分析将在这里显示
                      </p>
                      <Button
                        onClick={handleGenerateMockAnalysis}
                        variant="outline"
                        className="gap-2 bg-white/50 dark:bg-slate-800/50"
                        disabled={!content || content.length < 10}
                      >
                        <Sparkles className="w-4 h-4" />
                        生成摘要 (演示)
                      </Button>
                      {(!content || content.length < 10) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          请先输入一些内容
                        </p>
                      )}
                    </div>
                  )}

                  {generatingAnalysis && (
                    <div className="text-center py-8">
                      <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        AI 正在分析中...
                      </p>
                    </div>
                  )}

                  {mockAiAnalysis && !generatingAnalysis && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl text-sm leading-relaxed whitespace-pre-line">
                        {mockAiAnalysis}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleGenerateMockAnalysis}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-white/50 dark:bg-slate-800/50"
                        >
                          重新生成
                        </Button>
                        <Button
                          onClick={() => setMockAiAnalysis(null)}
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                        >
                          清除
                        </Button>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/50 dark:to-blue-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          未来功能预告
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          完整版将支持真实的 AI 分析、关键词提取、相关笔记推荐和思维导图生成。
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI 智能归纳</DialogTitle>
              <DialogDescription>使用 AI 分析笔记内容，提取关键信息</DialogDescription>
            </DialogHeader>
            {!aiResult || aiAnalyzing ? (
              <div className="py-12 text-center">
                {!aiAnalyzing ? (
                  <>
                    <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">点击下方按钮开始分析</p>
                    <Button onClick={handleAiAnalysis}>开始分析</Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">AI 正在分析中...</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">内容摘要</h3>
                    <span className="text-xs text-muted-foreground">可编辑</span>
                  </div>
                  <Textarea
                    value={editableAiSummary}
                    onChange={(e) => setEditableAiSummary(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="编辑摘要内容..."
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-2">关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiResult.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAppendToNote} className="flex-1">
                    <FileText className="mr-2 w-4 h-4" />
                    添加到笔记
                  </Button>
                  <Button onClick={() => setShowAiDialog(false)} variant="outline" className="flex-1">
                    关闭
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>生成分享卡片</DialogTitle>
              <DialogDescription>将笔记生成精美的分享卡片</DialogDescription>
            </DialogHeader>
            <div
              id="share-card"
              className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-xl text-white space-y-4"
            >
              <h2 className="text-2xl font-bold">{title || '无标题'}</h2>
              <div className="text-sm opacity-90 line-clamp-4">
                {getPlainText(content) || '暂无内容'}
              </div>
              <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                <div className="text-xs opacity-75">知识管理系统</div>
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-xs text-slate-900">
                  二维码
                </div>
              </div>
            </div>
            <Button onClick={handleGenerateShareCard} className="w-full">
              <Download className="mr-2 w-4 h-4" />
              下载卡片
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={showPromptsDialog} onOpenChange={setShowPromptsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI 写作引导</DialogTitle>
              <DialogDescription>基于你的内容，AI 为你生成了以下问题来深化思考</DialogDescription>
            </DialogHeader>
            {promptsLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">AI 正在生成问题...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiPrompts.map((prompt, index) => (
                  <Card
                    key={index}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-500"
                    onClick={() => handleInsertPrompt(prompt)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                        {index + 1}
                      </div>
                      <p className="flex-1 pt-1">{prompt}</p>
                    </div>
                  </Card>
                ))}
                <p className="text-xs text-center text-muted-foreground pt-2">
                  点击任意问题将其添加到笔记中
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
