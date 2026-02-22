'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle2, Smartphone, Code, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface ApiSyncGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiSyncGuide({ open, onOpenChange }: ApiSyncGuideProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (user && open) {
      const getToken = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setApiKey(data.session.access_token);
        }
      };
      getToken();
    }
  }, [user, open]);

  const apiEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fitness-api`;

  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "steps": 10000,
    "calories": 450,
    "workout_minutes": 30,
    "source": "ios_shortcuts"
  }'`;

  const shortcutInstructions = `1. 打开 iOS 快捷指令应用
2. 创建新的快捷指令
3. 添加"获取 URL 内容"操作
4. 设置 URL: ${apiEndpoint}
5. 方法：POST
6. 请求体：JSON
7. 添加请求头：
   - Authorization: Bearer YOUR_TOKEN
   - Content-Type: application/json
8. 请求正文示例：
   {
     "steps": [步数],
     "calories": [卡路里],
     "workout_minutes": [运动分钟数],
     "source": "ios_shortcuts"
   }`;

  const pythonExample = `import requests
import os

API_ENDPOINT = "${apiEndpoint}"
ACCESS_TOKEN = os.getenv("LIFEOS_TOKEN")

def sync_fitness_data(steps, calories, workout_minutes):
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    data = {
        "steps": steps,
        "calories": calories,
        "workout_minutes": workout_minutes,
        "source": "python_script"
    }

    response = requests.post(API_ENDPOINT, json=data, headers=headers)
    return response.json()

# 使用示例
result = sync_fitness_data(steps=8500, calories=320, workout_minutes=25)
print(result)`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API 自动同步指南
          </DialogTitle>
          <DialogDescription>
            使用 API 自动推送健康数据，支持 iOS 快捷指令、Python 脚本等
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">API 端点</Label>
            <div className="flex gap-2 mt-2">
              <Input value={apiEndpoint} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(apiEndpoint)}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">访问令牌</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={apiKey}
                readOnly
                type="password"
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(apiKey)}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              此令牌会过期，如果 API 调用失败，请重新登录获取新令牌
            </p>
          </div>

          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="shortcuts">
                <Smartphone className="w-4 h-4 mr-1" />
                iOS 快捷指令
              </TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="space-y-3">
              <div>
                <Label className="text-sm font-medium">命令示例</Label>
                <div className="relative mt-2">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {curlExample}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(curlExample)}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-3">
              <div>
                <Label className="text-sm font-medium">设置步骤</Label>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mt-2">
                  <pre className="whitespace-pre-wrap text-xs">{shortcutInstructions}</pre>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://support.apple.com/zh-cn/guide/shortcuts/welcome/ios"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  查看 Apple 快捷指令官方文档
                </a>
              </Button>
            </TabsContent>

            <TabsContent value="python" className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Python 脚本示例</Label>
                <div className="relative mt-2">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {pythonExample}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(pythonExample)}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">API 响应格式</h4>
            <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded">
{`{
  "success": true,
  "message": "Fitness data recorded successfully",
  "data": {
    "id": "...",
    "steps": 10000,
    "calories": 450,
    "workout_minutes": 30,
    "date": "2026-02-17",
    "source": "ios_shortcuts"
  }
}`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
