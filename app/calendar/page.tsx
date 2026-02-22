'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase, Note, Category } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon, BookOpen, X } from 'lucide-react';
import Link from 'next/link';
import * as Icons from 'lucide-react';

interface MoodLog {
  logged_at: string;
  mood_score: number;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<(Note & { category?: Category })[]>([]);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayNotes, setSelectedDayNotes] = useState<(Note & { category?: Category })[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [notesResult, moodsResult] = await Promise.all([
      supabase
        .from('notes')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('mood_logs')
        .select('logged_at, mood_score')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false }),
    ]);

    if (notesResult.data) setNotes(notesResult.data);
    if (moodsResult.data) setMoods(moodsResult.data);
    setLoading(false);
  };

  const handleDateClick = (arg: any) => {
    const clickedDate = arg.date;
    setSelectedDate(clickedDate);

    const y = clickedDate.getFullYear();
    const m = clickedDate.getMonth();
    const day = clickedDate.getDate();
    const dayStart = new Date(y, m, day, 0, 0, 0, 0);
    const dayEnd = new Date(y, m, day, 23, 59, 59, 999);

    const dayNotes = notes.filter((note) => {
      const noteDate = new Date(note.created_at);
      return noteDate >= dayStart && noteDate <= dayEnd;
    });

    setSelectedDayNotes(dayNotes);
    setSheetOpen(true);
  };

  const getPlainText = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'rgba(34, 197, 94, 0.15)';
    if (score >= 6) return 'rgba(59, 130, 246, 0.15)';
    if (score >= 4) return 'rgba(250, 204, 21, 0.15)';
    if (score >= 2) return 'rgba(251, 146, 60, 0.15)';
    return 'rgba(239, 68, 68, 0.15)';
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😄';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    if (score >= 2) return '😔';
    return '😢';
  };

  const notesByDate = notes.reduce((acc, note) => {
    const d = new Date(note.created_at);
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[localDate]) {
      acc[localDate] = [];
    }
    acc[localDate].push(note);
    return acc;
  }, {} as Record<string, (Note & { category?: Category })[]>);

  const moodsByDate = moods.reduce((acc, mood) => {
    const d = new Date(mood.logged_at);
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    acc[localDate] = mood.mood_score;
    return acc;
  }, {} as Record<string, number>);

  const calendarEvents = Object.entries(notesByDate).map(([date, dayNotes]) => ({
    date,
    display: 'background',
    backgroundColor: 'transparent',
    classNames: ['calendar-event-dots'],
  }));

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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">日历视图</h1>
            <p className="text-muted-foreground">按日期查看您的笔记与心情</p>
          </div>
        </div>

        <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-lg">
          <style jsx global>{`
            .fc {
              font-family: inherit;
            }
            .fc-theme-standard td,
            .fc-theme-standard th {
              border-color: rgb(226 232 240);
            }
            .dark .fc-theme-standard td,
            .dark .fc-theme-standard th {
              border-color: rgb(51 65 85);
            }
            .fc-daygrid-day-number {
              color: inherit;
              font-size: 1.1rem;
              font-weight: 600;
              padding: 8px;
            }
            .fc-col-header-cell-cushion {
              color: inherit;
              padding: 12px 0;
              font-weight: 600;
            }
            .fc-button {
              background-color: rgb(59 130 246) !important;
              border-color: rgb(59 130 246) !important;
              text-transform: capitalize;
              border-radius: 8px !important;
              padding: 8px 16px !important;
            }
            .fc-button:hover {
              background-color: rgb(37 99 235) !important;
              border-color: rgb(37 99 235) !important;
            }
            .fc-button-active {
              background-color: rgb(29 78 216) !important;
              border-color: rgb(29 78 216) !important;
            }
            .fc-daygrid-day:hover {
              background-color: rgb(248 250 252);
              cursor: pointer;
            }
            .dark .fc-daygrid-day:hover {
              background-color: rgb(30 41 59);
            }
            .fc-daygrid-day-frame {
              position: relative;
              min-height: 120px;
              padding: 4px;
            }
            .calendar-event-dots {
              pointer-events: none;
            }
            .fc-daygrid-day-top {
              flex-direction: row;
              justify-content: space-between;
              align-items: flex-start;
            }
            .day-notes-container {
              padding: 4px 8px;
              font-size: 0.75rem;
              color: rgb(71 85 105);
              display: flex;
              flex-direction: column;
              gap: 2px;
              max-height: 80px;
              overflow: hidden;
            }
            .dark .day-notes-container {
              color: rgb(148 163 184);
            }
            .day-note-item {
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .mood-emoji {
              position: absolute;
              top: 8px;
              right: 8px;
              font-size: 1.2rem;
            }
          `}</style>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="zh-cn"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            buttonText={{
              today: '今天',
              month: '月',
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            height="auto"
            dayCellDidMount={(arg) => {
              const d = arg.date;
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const dayNotes = notesByDate[dateStr];
              const moodScore = moodsByDate[dateStr];

              if (moodScore) {
                const bgColor = getMoodColor(moodScore);
                arg.el.style.backgroundColor = bgColor;

                const moodEmoji = document.createElement('span');
                moodEmoji.className = 'mood-emoji';
                moodEmoji.textContent = getMoodEmoji(moodScore);
                moodEmoji.title = `心情: ${moodScore}/10`;
                arg.el.querySelector('.fc-daygrid-day-frame')?.appendChild(moodEmoji);
              }

              if (dayNotes && dayNotes.length > 0) {
                const notesContainer = document.createElement('div');
                notesContainer.className = 'day-notes-container';

                const displayNotes = dayNotes.slice(0, 3);
                displayNotes.forEach((note) => {
                  const noteEl = document.createElement('div');
                  noteEl.className = 'day-note-item';
                  noteEl.innerHTML = `
                    <span style="font-size: 0.9rem;">📝</span>
                    <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${note.title || '无标题'}</span>
                  `;
                  notesContainer.appendChild(noteEl);
                });

                if (dayNotes.length > 3) {
                  const moreEl = document.createElement('div');
                  moreEl.className = 'day-note-item';
                  moreEl.style.fontWeight = '600';
                  moreEl.style.color = 'rgb(59 130 246)';
                  moreEl.textContent = `+${dayNotes.length - 3} 更多`;
                  notesContainer.appendChild(moreEl);
                }

                arg.el.querySelector('.fc-daygrid-day-frame')?.appendChild(notesContainer);
              }
            }}
          />
        </Card>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>
                {selectedDate && format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              {selectedDayNotes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">这一天没有笔记</p>
                  <Link href="/notes/new" className="mt-4 inline-block">
                    <Button>创建笔记</Button>
                  </Link>
                </div>
              ) : (
                selectedDayNotes.map((note) => {
                  const IconComponent = note.category
                    ? (Icons as any)[note.category.icon] || Icons.Folder
                    : Icons.FileText;
                  return (
                    <Link key={note.id} href={`/notes/${note.id}`}>
                      <Card className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-blue-950/30 cursor-pointer">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-lg flex-1 line-clamp-2">
                              {note.title || '无标题'}
                            </h3>
                            {note.category && (
                              <div
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: note.category.color + '20' }}
                              >
                                <IconComponent
                                  className="w-5 h-5"
                                  style={{ color: note.category.color }}
                                />
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {getPlainText(note.content) || '暂无内容'}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t">
                            {note.category && (
                              <span
                                className="text-xs px-3 py-1 rounded-full font-medium"
                                style={{
                                  backgroundColor: note.category.color + '20',
                                  color: note.category.color,
                                }}
                              >
                                {note.category.name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(note.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
