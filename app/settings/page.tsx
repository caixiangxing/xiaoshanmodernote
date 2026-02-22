'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Shield, Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [aiTrainingConsent, setAiTrainingConsent] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setAiTrainingConsent(data.ai_training_consent || false);
      setPrivacyMode(data.privacy_mode || false);
    } else if (!error || error.code === 'PGRST116') {
      await supabase.from('user_settings').insert({
        user_id: user.id,
        ai_training_consent: false,
        privacy_mode: false,
      });
    }

    setLoading(false);
  };

  const updateSetting = async (field: string, value: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        [field]: value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '设置已更新',
        description: '您的偏好设置已保存',
      });
    }
  };

  const handleAiConsentChange = async (checked: boolean) => {
    setAiTrainingConsent(checked);
    await updateSetting('ai_training_consent', checked);
  };

  const handlePrivacyModeChange = async (checked: boolean) => {
    setPrivacyMode(checked);
    await updateSetting('privacy_mode', checked);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">设置</h1>
          <p className="text-muted-foreground">
            管理您的 LifeOS 偏好设置和隐私选项
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <CardTitle>AI 与数字永生</CardTitle>
            </div>
            <CardDescription>
              配置 AI 如何与您的数据交互，为未来的数字永生做准备
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="ai-training" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  AI 训练许可
                </Label>
                <p className="text-sm text-muted-foreground">
                  允许 AI 从您的笔记中学习思维模式。这将为未来的个性化 AI 助手和数字永生功能做准备。
                  启用后，您的写作风格、思考方式和知识结构将被用于训练专属的 AI 模型。
                </p>
              </div>
              <Switch
                id="ai-training"
                checked={aiTrainingConsent}
                onCheckedChange={handleAiConsentChange}
              />
            </div>

            <Separator />

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                数字永生计划
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                LifeOS 的终极愿景是帮助您创建一个数字化的思维副本。通过持续记录您的想法、情绪和健康数据，
                未来的 AI 技术将能够重现您独特的思考方式和个性特征。这个功能目前处于 UI 准备阶段，
                实际的模型训练将在未来版本中实现。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <CardTitle>隐私与安全</CardTitle>
            </div>
            <CardDescription>
              控制您的数据隐私和安全设置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="privacy-mode">隐私模式</Label>
                <p className="text-sm text-muted-foreground">
                  启用后，将禁用所有第三方分析和追踪功能，确保您的数据完全私密
                </p>
              </div>
              <Switch
                id="privacy-mode"
                checked={privacyMode}
                onCheckedChange={handlePrivacyModeChange}
              />
            </div>

            <Separator />

            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                本地优先架构
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                LifeOS 采用隐私优先设计。所有敏感数据都存储在您的 Supabase 实例中，
                AI 处理支持本地 LLM，确保您的个人信息永远不会被发送到第三方服务器。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
