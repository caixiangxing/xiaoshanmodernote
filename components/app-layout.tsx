'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FolderOpen,
  Tags,
  LogOut,
  Menu,
  X,
  Plus,
  Heart,
  Brain,
  Activity,
  FileText,
  Dna,
  Smile,
  Settings,
  ChevronDown,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { supabase, Category, Tag } from '@/lib/supabase';
import * as Icons from 'lucide-react';
import { DailyCheckInModal } from './daily-checkin-modal';
import { SoulAvatar } from './soul-avatar';

const pillars = [
  {
    name: '身体 (Body)',
    icon: Heart,
    color: 'text-red-500',
    children: [
      { name: '健康日志', href: '/health', icon: Activity },
      { name: '医疗档案', href: '/medical', icon: FileText },
      { name: '基因洞察', href: '/genetic', icon: Dna },
    ],
  },
  {
    name: '财务 (Finance)',
    icon: Wallet,
    color: 'text-emerald-500',
    children: [
      { name: '财务管理', href: '/finance', icon: Wallet },
    ],
  },
  {
    name: '心灵 (Soul)',
    icon: Smile,
    color: 'text-amber-500',
    children: [
      { name: '情绪追踪', href: '/mood', icon: Smile },
    ],
  },
  {
    name: '认知 (Mind)',
    icon: Brain,
    color: 'text-blue-500',
    children: [
      { name: '分类管理', href: '/categories', icon: FolderOpen },
      { name: '标签管理', href: '/tags', icon: Tags },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<(Category & { count: number })[]>([]);
  const [tags, setTags] = useState<(Tag & { count: number })[]>([]);
  const [openPillars, setOpenPillars] = useState<{ [key: string]: boolean }>({
    'Body': true,
    '财务': true,
    'Soul': true,
    'Mind': true,
  });
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadCategoriesAndTags();
    }
  }, [user]);

  const loadCategoriesAndTags = async () => {
    if (!user) return;

    const [categoriesResult, tagsResult] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('tags').select('*').eq('user_id', user.id).order('name'),
    ]);

    if (categoriesResult.data) {
      const categoriesWithCounts = await Promise.all(
        categoriesResult.data.map(async (cat) => {
          const { count } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('category_id', cat.id);
          return { ...cat, count: count || 0 };
        })
      );
      setCategories(categoriesWithCounts);
    }

    if (tagsResult.data) {
      const tagsWithCounts = await Promise.all(
        tagsResult.data.map(async (tag) => {
          const { count } = await supabase
            .from('note_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
          return { ...tag, count: count || 0 };
        })
      );
      setTags(tagsWithCounts);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="lg:flex">
        <div
          className={`fixed inset-0 z-50 bg-slate-900/50 lg:hidden ${
            sidebarOpen ? 'block' : 'hidden'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LifeOS</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4 py-5">
              <div className="space-y-5">
                <Link href="/notes/new">
                  <Button className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md">
                    <Plus className="w-5 h-5" />
                    新建笔记
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button
                    variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3 h-11"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    指挥中心
                  </Button>
                </Link>

                <div className="space-y-2">
                  <Link href="/notes">
                    <Button
                      variant={pathname === '/notes' ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-3 h-11"
                    >
                      <BookOpen className="w-5 h-5" />
                      所有笔记
                    </Button>
                  </Link>

                  <Link href="/calendar">
                    <Button
                      variant={pathname === '/calendar' ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-3 h-11"
                    >
                      <Calendar className="w-5 h-5" />
                      日历视图
                    </Button>
                  </Link>
                </div>

                <Separator />

                {pillars.map((pillar, idx) => (
                  <Collapsible
                    key={pillar.name}
                    open={openPillars[pillar.name.split(' ')[0]] ?? true}
                    onOpenChange={(open) => {
                      setOpenPillars({
                        ...openPillars,
                        [pillar.name.split(' ')[0]]: open,
                      });
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between gap-3 font-semibold h-11"
                      >
                        <div className="flex items-center gap-3">
                          <pillar.icon className={`w-5 h-5 ${pillar.color}`} />
                          <span>{pillar.name}</span>
                        </div>
                        {openPillars[pillar.name.split(' ')[0]] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      {pillar.children.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link key={item.name} href={item.href}>
                            <Button
                              variant={isActive ? 'secondary' : 'ghost'}
                              className="w-full justify-start gap-3 pl-10 h-10"
                            >
                              <item.icon className="w-4 h-4" />
                              {item.name}
                            </Button>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                <Separator />

                <Link href="/settings">
                  <Button
                    variant={pathname === '/settings' ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3 h-11"
                  >
                    <Settings className="w-5 h-5" />
                    设置
                  </Button>
                </Link>
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-2"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{profile?.full_name || '用户'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.email}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <header className="sticky top-0 z-10 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 lg:hidden">
            <div className="flex items-center justify-between h-full px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LifeOS</span>
              </Link>
              <div className="w-10" />
            </div>
          </header>

          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
      <DailyCheckInModal
        externalOpen={checkInModalOpen}
        onExternalOpenChange={setCheckInModalOpen}
      />
      <SoulAvatar onAvatarClick={() => setCheckInModalOpen(true)} />
    </div>
  );
}
