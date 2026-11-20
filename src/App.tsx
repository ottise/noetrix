import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { User } from 'firebase/auth';
import { db } from './db/database';
import { ensureSeedData } from './db/seed';
import { initSourceCodeAutoSync, scheduleSourceCodeSave } from './lib/sourceStore';
import { subscribeAuth } from './lib/firebase';
import { syncWithFirebaseCloud } from './lib/sync';
import { triggerHaptic } from './lib/haptics';
import { getRoomsMeta, LanguageProvider, useLanguage } from './lib/i18n';
import type { WorkspaceId } from './types';
import { Modal, SegmentedControl, ToastProvider, useToast } from './components/ui/Primitives';
import { SettingsModal } from './components/SettingsModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AmbientHubModal } from './components/AmbientHubModal';
import { NoetrixManifestoModal } from './components/NoetrixManifestoModal';
import { MiniDashboard } from './features/ambient/MiniDashboard';
import { TodayView } from './features/today/TodayView';
import { PersonalCalendar } from './features/today/PersonalCalendar';
import { CodeLab } from './features/learn/CodeLab';
import { LeetCode100Lab } from './features/learn/LeetCode100Lab';
import { ChessLab } from './features/learn/ChessLab';
import { SudokuLab } from './features/learn/SudokuLab';
import { WorkflowVault } from './features/studio/WorkflowVault';
import { ExcalidrawCanvas } from './features/studio/ExcalidrawCanvas';
import { PsychologyPipeline } from './features/studio/PsychologyPipeline';
import { StoryStudio } from './features/vault/StoryStudio';
import { Bookshelf } from './features/vault/Bookshelf';
import { HobbiesJournal } from './features/vault/HobbiesJournal';
import { SpinWheelView } from './features/wheel/SpinWheelView';

const SIDEBAR_WHISPERS_EN = [
  '01 / READY',
  '02 / CURIOUS',
  '03 / PROVE FIRST',
  '04 / PURE PURSUIT',
];

const SIDEBAR_WHISPERS_VI = [
  '01 / SẴN SÀNG',
  '02 / TÒ MÒ',
  '03 / CHỨNG MINH TRƯỚC',
  '04 / THUẦN KHIẾT',
];

function LifeOSShell() {
  const { showToast } = useToast();
  const { lang, setLang, toggleLang, t } = useLanguage();
  const ROOMS = React.useMemo(() => getRoomsMeta(lang), [lang]);
  const whispers = lang === 'en' ? SIDEBAR_WHISPERS_EN : SIDEBAR_WHISPERS_VI;
  const [ready, setReady] = useState(false);

  const [workspace, setWorkspace] = useState<WorkspaceId>('home');
  const [homeSub, setHomeSub] = useState<'today' | 'calendar'>('today');
  const [labSub, setLabSub] = useState<'code' | 'leetcode' | 'chess' | 'sudoku'>('code');
  const [studioSub, setStudioSub] = useState<'psychology' | 'lectures' | 'stories' | 'drawing'>('psychology');
  const [playgroundSub, setPlaygroundSub] = useState<'wheel' | 'sudoku' | 'chess'>('wheel');
  const [whisperIdx, setWhisperIdx] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profile = useLiveQuery(() => db.profile.get('main'));

  useEffect(() => {
    ensureSeedData()
      .then(() => initSourceCodeAutoSync())
      .then(() => setReady(true));
  }, []);

  // Automatically save any IndexedDB modifications directly into src/data/noetrix-store.json
  const allDataVersion = useLiveQuery(async () => {
    const counts = await Promise.all([
      db.tasks.count(),
      db.dailyLogs.count(),
      db.workflowLectures.count(),
      db.psychologyPosts.count(),
      db.codeTopics.count(),
      db.leetcodeEntries.count(),
      db.chessModules.count(),
      db.chessGames.count(),
      db.sudokuTechniques.count(),
      db.sudokuRuns.count(),
      db.books.count(),
      db.stories.count(),
      db.hobbyLogs.count(),
    ]);
    return counts.join(':');
  });

  useEffect(() => {
    if (ready) {
      scheduleSourceCodeSave();
    }
  }, [ready, allDataVersion]);

  useEffect(() => {
    const unsub = subscribeAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'n' && !isTyping) {
        e.preventDefault();
        setCaptureOpen(true);
      } else if (e.altKey && !isTyping && ['0', '1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const order: WorkspaceId[] = ['home', 'learning', 'knowledge', 'creative', 'playground', 'life'];
        const targetId = order[Number(e.key)];
        if (targetId) handleNavigate(targetId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const theme = profile?.theme || 'dark';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const meta = document.getElementById('theme-color-meta');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#101114' : '#f4f1ea');
    }
  }, [profile?.theme]);

  const handleNavigate = (nextWs: WorkspaceId, sub?: string) => {
    triggerHaptic('selection');
    setWorkspace(nextWs);
    setMobileMenuOpen(false);
    if (nextWs === 'home' && (sub === 'today' || sub === 'calendar')) {
      setHomeSub(sub);
    } else if (
      nextWs === 'learning' &&
      (sub === 'code' || sub === 'leetcode' || sub === 'chess' || sub === 'sudoku')
    ) {
      setLabSub(sub);
    } else if (
      nextWs === 'creative' &&
      (sub === 'psychology' || sub === 'lectures' || sub === 'stories' || sub === 'drawing')
    ) {
      setStudioSub(sub);
    } else if (nextWs === 'playground' && (sub === 'wheel' || sub === 'sudoku' || sub === 'chess')) {
      setPlaygroundSub(sub);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSyncNow = async () => {
    triggerHaptic('light');
    if (!user) {
      setSettingsOpen(true);
      return;
    }
    setSyncing(true);
    try {
      const res = await syncWithFirebaseCloud();
      showToast(t(`Synced · ↑${res.pushed} · ↓${res.pulled}`, `Đã đồng bộ · ↑${res.pushed} · ↓${res.pulled}`));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t('Unable to sync right now', 'Không thể đồng bộ lúc này'),
        'error'
      );
    } finally {
      setSyncing(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="editorial-eyebrow">{t('Entering Personal OS...', 'Đang mở Personal OS...')}</p>
      </div>
    );
  }

  const currentRoom = ROOMS.find((r) => r.id === workspace) || ROOMS[0];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* ================================================================
          DESKTOP SIDEBAR — Editorial Noir Spatial Directory (264px)
          Cinzel Crest · Space Mono Indices · Montserrat Navigation
          ================================================================ */}
      <aside
        className="hidden md:flex md:flex-col w-[264px] shrink-0 sticky top-0 h-dvh justify-between border-r border-[#1b2029]"
        style={{ backgroundColor: 'var(--os-sidebar)' }}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* NOETRIX Brand & Status Header */}
          <div className="px-6 pt-7 pb-5 border-b border-[#1b2029]">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="text-left block cursor-pointer group min-w-0"
              >
                <p className="noetrix-logo text-[20px] leading-none text-[#f5f7fa] flex items-center gap-2">
                  <span>{profile?.appName || 'NOETRIX'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#cba86a] inline-block shadow-[0_0_8px_#cba86a]" />
                </p>
                <p className="metadata text-[10.5px] font-medium uppercase tracking-[0.22em] text-[#cba86a] mt-1.5">
                  {t('The Art of Becoming', 'Nghệ Thuật Trở Thành')}
                </p>
              </button>

              {/* EN / VI Mode Switcher */}
              <div
                role="group"
                aria-label="Language mode"
                className="inline-flex items-center rounded-md border border-[#242b38] bg-[#11151d] p-0.5 metadata text-[10px] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (lang !== 'en') {
                      triggerHaptic('selection');
                      setLang('en');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${
                    lang === 'en'
                      ? 'bg-[#cba86a] text-[#0c0f13]'
                      : 'text-[#6b7280] hover:text-[#e5e7eb]'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (lang !== 'vi') {
                      triggerHaptic('selection');
                      setLang('vi');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${
                    lang === 'vi'
                      ? 'bg-[#cba86a] text-[#0c0f13]'
                      : 'text-[#6b7280] hover:text-[#e5e7eb]'
                  }`}
                >
                  VI
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#1a1f29] metadata text-[12px]">
              <button
                type="button"
                onClick={() => setWhisperIdx((i) => (i + 1) % whispers.length)}
                title={t(
                  'Curious by nature. Mischievous by design. Pure in pursuit.',
                  'Tò mò bẩm sinh. Tinh nghịch có chủ đích. Thuần khiết trong hành trình.'
                )}
                className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-85"
              >
                <span className="text-[#cba86a] font-semibold">01</span>
                <span className="text-[#4b5563]">/</span>
                <span className="tracking-wider text-emerald-400 font-medium">
                  {whisperIdx === 0 ? t('READY', 'SẴN SÀNG') : whispers[whisperIdx]}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setManifestoOpen(true)}
                className="group flex items-center gap-1 text-[#e5e7eb] hover:text-[#cba86a] transition-colors uppercase metadata tracking-wider font-semibold text-[11.5px] cursor-pointer"
              >
                <span>{t('LEXICON', 'TỪ ĐIỂN')}</span>
                <span className="text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#cba86a]">
                  ↗
                </span>
              </button>
            </div>
          </div>

          {/* Spatial Room List — Editorial Noir Cards with Left Gold Bar */}
          <nav aria-label="Rooms" className="px-3.5 py-6 space-y-2.5 flex-1">
            {ROOMS.map((room) => {
              const active = workspace === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleNavigate(room.id)}
                  className={`relative w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all duration-200 cursor-pointer group text-left ${
                    active
                      ? 'bg-[#181d26] text-white border border-[#2a3242] shadow-sm'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#161a22] border border-transparent'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#cba86a] rounded-r" />
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`metadata text-[11.5px] tabular-nums shrink-0 transition-colors ${
                        active ? 'text-[#cba86a] font-bold' : 'text-[#6b7280] font-semibold group-hover:text-[#cba86a]'
                      }`}
                    >
                      {room.index}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-[14.5px] leading-tight truncate transition-colors ${
                          active ? 'font-bold text-white tracking-wide' : 'font-semibold text-[#d1d5db] group-hover:text-white'
                        }`}
                      >
                        {room.label}
                      </p>
                      <p
                        className={`text-[11.5px] mt-0.5 truncate transition-colors ${
                          active ? 'text-[#9ca3af] font-medium' : 'text-[#6b7280] group-hover:text-[#9ca3af]'
                        }`}
                      >
                        {room.micro}
                      </p>
                    </div>
                  </div>
                  <span className="metadata text-[9.5px] shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#6b7280]">
                    ⌥{Number(room.index)}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ================================================================
          MAIN CANVAS
          ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Minimal Header */}
        <header
          className={`md:hidden sticky top-0 z-30 safe-top transition-all duration-250 ${
            scrolled ? 'ios-nav-frosted' : 'bg-transparent'
          }`}
        >
          <div className="h-[46px] px-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setManifestoOpen(true)}
              className="noetrix-logo text-[18px] cursor-pointer"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              {profile?.appName || 'NOETRIX'}
            </button>

            <div className="flex items-center gap-3 text-[12.5px]">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  toggleLang();
                }}
                className="metadata px-2 py-0.5 rounded border border-[#2a3242] bg-[#141821] text-[10.5px] font-semibold tracking-wider cursor-pointer"
                style={{ color: 'var(--os-ivory-bright)' }}
                title={t('Switch to Vietnamese', 'Chuyển sang Tiếng Anh')}
              >
                {lang.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setCaptureOpen(true)}
                className="font-medium cursor-pointer"
                style={{ color: 'var(--os-brass)' }}
              >
                {t('+ Capture', '+ Ghi nhanh')}
              </button>
            </div>
          </div>
        </header>

        {/* Generous Horizontal Editorial Reading/Living Container */}
        <main
          className={`flex-1 w-full ${
            (workspace === 'home' && homeSub === 'calendar') ||
            workspace === 'learning' ||
            workspace === 'knowledge' ||
            workspace === 'playground' ||
            (workspace === 'creative' &&
              (studioSub === 'psychology' ||
                studioSub === 'lectures' ||
                studioSub === 'stories' ||
                studioSub === 'drawing'))
              ? 'max-w-[1440px] px-4 sm:px-8'
              : 'max-w-[1040px] px-5 sm:px-10 lg:px-14'
          } mx-auto pt-3 md:pt-5 pb-[96px] md:pb-16`}
        >
          {/* Room Header for inner rooms (Home renders its own full cinematic hero) */}
          {workspace !== 'home' && (
            <header className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div className="space-y-1">
                <p className="editorial-eyebrow">{currentRoom.eyebrow}</p>
                <h1 className="editorial-h1">{currentRoom.title}</h1>
                {currentRoom.subtitle && (
                  <p className="text-[14.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                    {currentRoom.subtitle}
                  </p>
                )}
              </div>
            </header>
          )}

          <div key={workspace} className="animate-ios-view space-y-4">
            {workspace === 'home' && (
              <div className="space-y-4">
                {homeSub === 'today' ? (
                  <>
                    <div className="max-w-xs">
                      <SegmentedControl
                        value={homeSub}
                        onChange={setHomeSub}
                        options={[
                          { value: 'today', label: t('Today · Sanctuary', 'Hôm nay · Tổng quan') },
                          { value: 'calendar', label: t('Calendar · Schedule', 'Lịch · Kế hoạch') },
                        ]}
                      />
                    </div>
                    <TodayView
                      onNavigate={handleNavigate}
                      onOpenCapture={() => setCaptureOpen(true)}
                      onOpenAmbient={() => setAmbientOpen(true)}
                      onOpenManifesto={() => setManifestoOpen(true)}
                    />
                  </>
                ) : (
                  <PersonalCalendar onNavigate={handleNavigate} onSwitchHomeTab={setHomeSub} />
                )}
              </div>
            )}

            {workspace === 'learning' && (
              <>
                <div className="space-y-3">
                  <nav aria-label="Lab Disciplines" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(
                      [
                        {
                          value: 'code',
                          code: '01.A',
                          label: t('Programming & AI', 'Lập Trình & AI'),
                          hint: t('Systems & Agents', 'Hệ thống & Agents'),
                          metaLeft: t('Active Directory', 'Thư mục chính'),
                          badge: '●',
                        },
                        {
                          value: 'leetcode',
                          code: '01.B',
                          label: 'LeetCode 100 · Java',
                          hint: t('90-Day Roadmap', 'Lộ trình 90 ngày'),
                          metaLeft: t('100 Problems', '100 Bài tập'),
                          badge: t('Phase 01', 'Giai đoạn 01'),
                        },
                        {
                          value: 'chess',
                          code: '01.C',
                          label: t('Chess · Think Ahead', 'Cờ Vua · Tư Duy Sâu'),
                          hint: t('Calculation', 'Tính toán biến'),
                          metaLeft: t('Tactics & Depth', 'Chiến thuật & Chiều sâu'),
                          badge: t('Cognitive', 'Nhận thức'),
                        },
                        {
                          value: 'sudoku',
                          code: '01.D',
                          label: t('Sudoku · Prove First', 'Sudoku · Chứng Minh'),
                          hint: t('Zero-Guess Logic', 'Logic không đoán mò'),
                          metaLeft: t('Deductive Engine', 'Tư duy suy diễn'),
                          badge: t('Daily Drills', 'Luyện mỗi ngày'),
                        },
                      ] as const
                    ).map((item) => {
                      const active = labSub === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            if (!active) {
                              triggerHaptic('selection');
                              setLabSub(item.value);
                            }
                          }}
                          className={`relative group rounded-xl p-4 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer ${
                            active
                              ? 'bg-[#161a23] border border-[#cba86a]/60 shadow-[0_0_20px_-5px_rgba(203,168,106,0.18)]'
                              : 'bg-[#12151c] hover:bg-[#161a23] border border-[#222834] hover:border-[#384152] glow-gold-hover'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`metadata text-[11px] tracking-wider ${
                                  active
                                    ? 'font-bold text-[#cba86a]'
                                    : 'font-semibold text-[#6b7280] group-hover:text-[#cba86a]'
                                }`}
                              >
                                {item.code}
                              </span>
                              {active ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#cba86a] shadow-[0_0_8px_#cba86a]" />
                              ) : (
                                <span className="text-xs metadata text-[#475569] group-hover:text-[#9ca3af]">
                                  ↗
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[15.5px] leading-snug pt-1 truncate ${
                                active
                                  ? 'font-bold text-white tracking-tight'
                                  : 'font-semibold text-[#cbd5e1] group-hover:text-white tracking-tight'
                              }`}
                            >
                              {item.label}
                            </p>
                            <p className="metadata text-[11px] text-[#6b7280] group-hover:text-[#9ca3af] tracking-wide truncate">
                              {item.hint}
                            </p>
                          </div>

                          <div
                            className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                              active ? 'border-[#262e3d]' : 'border-[#1b2029]'
                            }`}
                          >
                            <span
                              className={`metadata text-[10.5px] uppercase tracking-wider ${
                                active ? 'text-[#cba86a] font-semibold' : 'text-[#64748b]'
                              }`}
                            >
                              {item.metaLeft}
                            </span>
                            {active ? (
                              <span className="text-xs text-[#cba86a]">●</span>
                            ) : (
                              <span className="metadata text-[10.5px] text-[#9ca3af] bg-[#1a1f29] px-2 py-0.5 rounded border border-[#262e3d]">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {active && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#cba86a] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                {labSub === 'code' && <CodeLab onSwitchTrack={(track) => setLabSub(track)} />}
                {labSub === 'leetcode' && <LeetCode100Lab />}
                {labSub === 'chess' && <ChessLab />}
                {labSub === 'sudoku' && <SudokuLab />}
              </>
            )}

            {workspace === 'knowledge' && <Bookshelf />}

            {workspace === 'creative' && (
              <>
                <SegmentedControl
                  value={studioSub}
                  onChange={setStudioSub}
                  options={[
                    { value: 'psychology', label: t('Psychology · Research', 'Tâm lý học · Nghiên cứu') },
                    { value: 'lectures', label: t('AI Workflow', 'AI Workflow') },
                    { value: 'stories', label: t('Writing Room', 'Phòng Viết') },
                    { value: 'drawing', label: t('Whiteboard · Excalidraw', 'Bảng vẽ · Excalidraw') },
                  ]}
                />
                {studioSub === 'psychology' && <PsychologyPipeline />}
                {studioSub === 'lectures' && <WorkflowVault />}
                {studioSub === 'stories' && <StoryStudio />}
                {studioSub === 'drawing' && <ExcalidrawCanvas />}
              </>
            )}

            {workspace === 'playground' && (
              <div className="space-y-8">
                {/* Spec Section 7: The Playground Leisure Chambers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setPlaygroundSub('chess')}
                    className="group relative aspect-[16/10] rounded-[12px] overflow-hidden text-left cursor-pointer"
                    style={{
                      backgroundColor: 'var(--os-graphite)',
                      border:
                        playgroundSub === 'chess'
                          ? '1px solid rgba(185, 155, 121, 0.5)'
                          : '1px solid var(--os-border)',
                    }}
                  >
                    <img
                      src="/art/room-playground.jpg"
                      alt="Chess Room"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(16,17,20,0.12) 0%, rgba(16,17,20,0.88) 100%)',
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
                        {t('CHESS · VARIATION & STRATEGY', 'CỜ VUA · BIẾN THỂ & CHIẾN LƯỢC')}
                      </span>
                      <p className="font-editorial text-[23px] leading-tight mt-0.5" style={{ color: '#EDEAE2' }}>
                        {t('Chess Room', 'Phòng Cờ Vua')}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'rgba(217,213,203,0.82)' }}>
                        {t('“Think ahead before you move.”', '“Nghĩ trước vài bước trước khi đi.”')}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlaygroundSub('sudoku')}
                    className="p-5 rounded-[12px] text-left flex flex-col justify-between cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--os-graphite)',
                      border:
                        playgroundSub === 'sudoku'
                          ? '1px solid rgba(185, 155, 121, 0.5)'
                          : '1px solid var(--os-border)',
                    }}
                  >
                    <span className="editorial-eyebrow" style={{ color: 'var(--os-dusty-blue)' }}>
                      {t('SUDOKU · FROM LOGIC TO MASTERY', 'SUDOKU · TỪ LOGIC ĐẾN TINH THÔNG')}
                    </span>
                    <div>
                      <p className="font-editorial text-[24px] leading-tight" style={{ color: 'var(--os-ivory-bright)' }}>
                        {t('Sudoku Training', 'Luyện Sudoku')}
                      </p>
                      <p className="text-[12.5px] mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
                        {t('“Prove before you place.” · Zero-guess deduction', '“Chứng minh trước khi điền.” · Suy luận thuần túy')}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlaygroundSub('wheel')}
                    className="p-5 rounded-[12px] text-left flex flex-col justify-between cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--os-graphite)',
                      border:
                        playgroundSub === 'wheel'
                          ? '1px solid rgba(185, 155, 121, 0.5)'
                          : '1px solid var(--os-border)',
                    }}
                  >
                    <span className="editorial-eyebrow" style={{ color: 'var(--os-brass)' }}>
                      {t('SURPRISE ME', 'NGẪU HỨNG')}
                    </span>
                    <div className="space-y-1">
                      <p className="font-editorial text-[22px] leading-snug" style={{ color: 'var(--os-ivory-bright)' }}>
                        {t('Let the next little adventure be random.', 'Để cuộc phiêu lưu nhỏ tiếp theo thật ngẫu nhiên.')}
                      </p>
                      <p className="text-[12.5px] font-medium" style={{ color: 'var(--os-brass)' }}>
                        {t('Spin the wheel ↗', 'Quay vòng chọn việc ↗')}
                      </p>
                    </div>
                  </button>
                </div>

                {playgroundSub === 'wheel' && <SpinWheelView />}
                {playgroundSub === 'sudoku' && <SudokuLab />}
                {playgroundSub === 'chess' && <ChessLab />}
              </div>
            )}

            {workspace === 'life' && <HobbiesJournal />}
          </div>
        </main>
      </div>

      {/* ================================================================
          MOBILE BOTTOM NAVIGATION — Calm Editorial Typography Bar + Rooms Sheet
          ================================================================ */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 ios-tab-frosted safe-bottom"
      >
        <div className="max-w-lg mx-auto grid grid-cols-5 items-center pt-2.5 pb-1.5 px-2">
          {ROOMS.slice(0, 4).map((rm) => {
            const active = workspace === rm.id;
            return (
              <button
                key={rm.id}
                type="button"
                onClick={() => handleNavigate(rm.id)}
                className="flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer"
                style={{
                  color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-faint)',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <span className="text-[12px] tracking-[0.01em]">{rm.mobileLabel}</span>
                <span
                  className="w-1 h-1 rounded-full transition-opacity"
                  style={{
                    backgroundColor: 'var(--os-brass)',
                    opacity: active ? 1 : 0,
                  }}
                />
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer"
            style={{
              color:
                workspace === 'playground' || workspace === 'life'
                  ? 'var(--os-ivory-bright)'
                  : 'var(--os-ivory-faint)',
            }}
          >
            <span className="text-[12px] tracking-[0.01em]">{t('Rooms', 'Phòng')}</span>
            <span
              className="w-1 h-1 rounded-full transition-opacity"
              style={{
                backgroundColor: 'var(--os-brass)',
                opacity: workspace === 'playground' || workspace === 'life' ? 1 : 0,
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Rooms Drawer Sheet */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={t('Your Private World', 'Thế Giới Riêng Của Bạn')}
      >
        <div className="space-y-4">
          <div className="divide-y divide-[var(--os-border)] rounded-[12px] overflow-hidden" style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}>
            {ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleNavigate(r.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <p className="font-editorial text-[20px] leading-tight" style={{ color: 'var(--os-ivory-bright)' }}>
                    {r.label}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--os-ivory-muted)' }}>
                    {r.subtitle}
                  </p>
                </div>
                {workspace === r.id && (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--os-brass)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Global Panels */}
      <QuickCaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleNavigate}
      />
      <AmbientHubModal open={ambientOpen} onClose={() => setAmbientOpen(false)} />
      <NoetrixManifestoModal open={manifestoOpen} onClose={() => setManifestoOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        user={user}
        syncing={syncing}
        onSyncNow={handleSyncNow}
      />
    </div>
  );
}

export default function App() {
  const isMiniMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'mini';

  return (
    <LanguageProvider>
      <ToastProvider>
        {isMiniMode ? <MiniDashboard /> : <LifeOSShell />}
      </ToastProvider>
    </LanguageProvider>
  );
}
