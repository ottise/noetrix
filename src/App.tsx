import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import { ensureSeedData } from './db/seed';
import { initSourceCodeAutoSync, scheduleSourceCodeSave } from './lib/sourceStore';
import { triggerHaptic } from './lib/haptics';
import { getRoomsMeta, LanguageProvider, useLanguage } from './lib/i18n';
import type { WorkspaceId } from './types';
import {
  BackButton,
  DisciplineSwitcher,
  Modal,
  RoomBackProvider,
  SegmentedControl,
  ToastProvider,
  useRoomBackState,
  useToast,
} from './components/ui/Primitives';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AmbientHubModal } from './components/AmbientHubModal';
import { NoetrixManifestoModal } from './components/NoetrixManifestoModal';
import { MiniDashboard } from './features/ambient/MiniDashboard';
import { PersonalCalendar } from './features/today/PersonalCalendar';
import { CodeLab } from './features/learn/CodeLab';
import { LeetCode100Lab } from './features/learn/LeetCode100Lab';
import { ChessLab } from './features/learn/ChessLab';
import { SudokuLab } from './features/learn/SudokuLab';
import { WorkflowVault } from './features/studio/WorkflowVault';
import { PsychologyPipeline } from './features/studio/PsychologyPipeline';
import { StudioIOSLite } from './features/studio/StudioIOSLite';
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
  const [labSub, setLabSub] = useState<'code' | 'leetcode'>('code');
  const [studioSub, setStudioSub] = useState<'psychology' | 'lectures' | 'stories'>('psychology');
  const [playgroundSub, setPlaygroundSub] = useState<'sudoku' | 'chess'>('chess');
  const [whisperIdx, setWhisperIdx] = useState(0);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const [scrolled, setScrolled] = useState(false);

  const profile = useLiveQuery(() => db.profile.get('main'));

  useEffect(() => {
    ensureSeedData()
      .then(() => initSourceCodeAutoSync())
      .then(() => db.books.where('id').equals('bk_mwojtdqh_7pw5pfa').delete().catch(() => 0))
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
      } else if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping) {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      } else if (e.key === 'Escape') {
        setFocusMode(false);
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
    if (nextWs === 'learning' && (sub === 'chess' || sub === 'sudoku')) {
      setWorkspace('playground');
      setPlaygroundSub(sub);
    } else {
      setWorkspace(nextWs);
      if (nextWs === 'learning' && (sub === 'code' || sub === 'leetcode')) {
        setLabSub(sub);
      } else if (
        nextWs === 'creative' &&
        (sub === 'psychology' || sub === 'lectures' || sub === 'stories')
      ) {
        setStudioSub(sub);
      } else if (nextWs === 'playground' && (sub === 'sudoku' || sub === 'chess')) {
        setPlaygroundSub(sub);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        className={`${focusMode ? 'hidden' : 'hidden md:flex'} md:flex-col w-[264px] shrink-0 sticky top-0 h-dvh justify-between border-r border-[#1b2029]`}
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
                <p className="noetrix-logo text-[17px] leading-none text-[#f5f7fa] flex items-center gap-2">
                  <span>{profile?.appName || 'NOETRIX'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#cba86a] inline-block shadow-[0_0_8px_#cba86a]" />
                </p>
                <p className="metadata text-[11px] font-medium text-[#cba86a] mt-1">
                  {t('The Art of Becoming', 'Nghệ thuật trở thành')}
                </p>
              </button>

              {/* EN / VI Mode Switcher + Small Spin Wheel Icon */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div
                  role="group"
                  aria-label="Language mode"
                  className="inline-flex items-center rounded-md border border-[#242b38] bg-[#11151d] p-0.5 metadata text-[10px]"
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

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setWheelOpen(true);
                  }}
                  title={t('Spin Wheel', 'Vòng quay ngẫu nhiên')}
                  aria-label={t('Spin Wheel', 'Vòng quay ngẫu nhiên')}
                  className="w-7 h-7 rounded-md border border-[#242b38] bg-[#11151d] hover:border-[#cba86a]/60 text-[#cba86a] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.64 5.64l4.95 4.95M13.41 13.41l4.95 4.95M18.36 5.64l-4.95 4.95M10.59 13.41l-4.95 4.95" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3.5 border-t border-[#1a1f29] text-[11px] font-medium whitespace-nowrap">
              <button
                type="button"
                onClick={() => setWhisperIdx((i) => (i + 1) % whispers.length)}
                title={t(
                  'Curious by nature. Mischievous by design. Pure in pursuit.',
                  'Tò mò bẩm sinh. Tinh nghịch có chủ đích. Thuần khiết trong hành trình.'
                )}
                className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-85 min-w-0 truncate"
              >
                <span className="text-[#cba86a] font-medium">01</span>
                <span className="text-[#4b5563]">/</span>
                <span className="text-emerald-400 font-medium truncate">
                  {whisperIdx === 0 ? t('Ready', 'Sẵn sàng') : whispers[whisperIdx]}
                </span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setFocusMode(true);
                  }}
                  title={t('Focus Mode (F)', 'Chế độ tập trung (F)')}
                  className="text-[#9ca3af] hover:text-[#cba86a] transition-colors font-medium text-[11px] cursor-pointer"
                >
                  {t('Focus', 'Focus')}
                </button>
                <span className="text-[#2a3242]">·</span>
                <button
                  type="button"
                  onClick={() => setManifestoOpen(true)}
                  className="group flex items-center gap-0.5 text-[#e5e7eb] hover:text-[#cba86a] transition-colors font-medium text-[11px] cursor-pointer"
                >
                  <span>{t('Lexicon', 'Từ điển')}</span>
                  <span className="text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#cba86a]">
                    ↗
                  </span>
                </button>
              </div>
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
                      className={`text-[11px] font-medium tabular-nums shrink-0 transition-colors ${
                        active ? 'text-[#cba86a]' : 'text-[#6b7280] group-hover:text-[#cba86a]'
                      }`}
                    >
                      {room.index}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-[14px] leading-tight truncate transition-colors ${
                          active ? 'font-semibold text-white' : 'font-medium text-[#d1d5db] group-hover:text-white'
                        }`}
                      >
                        {room.label}
                      </p>
                      <p
                        className={`text-[12px] mt-0.5 truncate transition-colors ${
                          active ? 'text-[#9ca3af]' : 'text-[#6b7280] group-hover:text-[#9ca3af]'
                        }`}
                      >
                        {room.micro}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#6b7280]">
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
      <div className="flex-1 flex flex-col min-w-0 relative">
        {focusMode && (
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            className="hidden md:inline-flex items-center gap-1.5 fixed top-4 right-5 z-40 px-3 py-1.5 rounded-full metadata text-[11px] font-semibold bg-[#141821]/90 backdrop-blur border border-[#2a3242] text-[#cba86a] hover:bg-[#1b202c] cursor-pointer shadow-lg"
          >
            <span>{t('Exit Focus (Esc)', 'Thoát tập trung (Esc)')}</span>
          </button>
        )}
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
              className="noetrix-logo text-[16px] cursor-pointer"
              style={{ color: 'var(--os-ivory-bright)' }}
            >
              {profile?.appName || 'NOETRIX'}
            </button>

            <div className="flex items-center gap-2 text-[12px]">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setWheelOpen(true);
                }}
                aria-label={t('Spin Wheel', 'Vòng quay')}
                className="w-8 h-8 rounded-md border border-[#2a3242] bg-[#141821] text-[#cba86a] flex items-center justify-center cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 3v7M12 14v7M3 12h7M14 12h7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  toggleLang();
                }}
                className="px-2 py-1 rounded border border-[#2a3242] bg-[#141821] text-[11px] font-medium cursor-pointer"
                style={{ color: 'var(--os-ivory-bright)' }}
                title={t('Switch to Vietnamese', 'Chuyển sang Tiếng Anh')}
              >
                {lang.toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        {/* Generous Horizontal Editorial Reading/Living Container */}
        <main
          className={`flex-1 w-full ${
            workspace === 'home' ||
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
          {workspace !== 'home' && <RoomHeader title={currentRoom.title} />}

          <div key={workspace} className="animate-ios-view space-y-4">
            {workspace === 'home' && (
              <PersonalCalendar onNavigate={handleNavigate} />
            )}

            {workspace === 'learning' && (
              <>
                <DisciplineSwitcher
                  ariaLabel="Lab Disciplines"
                  value={labSub}
                  onChange={setLabSub}
                  options={[
                    {
                      value: 'code',
                      code: '01',
                      label: t('Programming & AI', 'Lập Trình & AI'),
                      hint: t('Core Subjects', 'Môn học cốt lõi'),
                    },
                    {
                      value: 'leetcode',
                      code: '02',
                      label: 'LeetCode 100',
                      hint: t('Java Roadmap', 'Lộ trình Java'),
                    },
                  ]}
                />
                {labSub === 'code' && (
                  <CodeLab
                    onSwitchTrack={(track) => {
                      if (track === 'code' || track === 'leetcode') setLabSub(track);
                      else if (track === 'chess' || track === 'sudoku') handleNavigate('playground', track);
                    }}
                  />
                )}
                {labSub === 'leetcode' && <LeetCode100Lab />}
              </>
            )}

            {workspace === 'knowledge' && <Bookshelf />}

            {workspace === 'creative' && (
              isMobileViewport ? (
                <StudioIOSLite sub={studioSub} onChangeSub={setStudioSub} />
              ) : (
                <>
                  <SegmentedControl
                    value={studioSub}
                    onChange={setStudioSub}
                    options={[
                      { value: 'psychology', label: t('Psychology · Research', 'Tâm lý học · Nghiên cứu') },
                      { value: 'lectures', label: t('AI Workflow', 'AI Workflow') },
                      { value: 'stories', label: t('Writing Room', 'Phòng Viết') },
                    ]}
                  />
                  {studioSub === 'psychology' && <PsychologyPipeline />}
                  {studioSub === 'lectures' && <WorkflowVault />}
                  {studioSub === 'stories' && <StoryStudio />}
                </>
              )
            )}

            {workspace === 'playground' && (
              <>
                <DisciplineSwitcher
                  ariaLabel="Playground Disciplines"
                  value={playgroundSub}
                  onChange={setPlaygroundSub}
                  options={[
                    {
                      value: 'chess',
                      code: '01',
                      label: t('Chess Room', 'Cờ Vua'),
                      hint: t('Strategy & Tactics', 'Chiến lược & Chiến thuật'),
                    },
                    {
                      value: 'sudoku',
                      code: '02',
                      label: t('Sudoku Training', 'Sudoku'),
                      hint: t('Logic & Deduction', 'Logic & Suy luận'),
                    },
                  ]}
                />
                {playgroundSub === 'sudoku' && <SudokuLab />}
                {playgroundSub === 'chess' && <ChessLab />}
              </>
            )}

            {workspace === 'life' && <HobbiesJournal />}
          </div>
        </main>
      </div>

      {/* ================================================================
          MOBILE BOTTOM NAVIGATION — Floating Noir Capsule Dock (5 Tabs):
          Schedule · Lab · Playground · Life · Studio (Voice & Note)
          ================================================================ */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed inset-x-3 z-40 flex justify-center pointer-events-none"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          className="pointer-events-auto w-full max-w-[412px] p-1.5 rounded-full grid grid-cols-5 items-center gap-0.5 backdrop-blur-2xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--os-graphite) 86%, transparent)',
            border: '1px solid var(--os-border-hover)',
            boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          {(
            [
              { id: 'home', label: t('Schedule', 'Lịch') },
              { id: 'learning', label: t('Lab', 'Lab') },
              { id: 'playground', label: t('Play', 'Chơi') },
              { id: 'life', label: t('Life', 'Sống') },
              { id: 'creative', label: t('Studio', 'Studio') },
            ] as const
          ).map((tab) => {
            const active = workspace === tab.id;
            const sw = active ? 2.1 : 1.65;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavigate(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[48px] py-1.5 px-1 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
                  active ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'hover:bg-white/[0.03]'
                }`}
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--os-brass) 16%, transparent)'
                    : 'transparent',
                  border: active
                    ? '1px solid color-mix(in srgb, var(--os-brass) 38%, transparent)'
                    : '1px solid transparent',
                  color: active ? 'var(--os-brass)' : 'var(--os-ivory-muted)',
                }}
              >
                {tab.id === 'home' && (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
                    <path d="M8 2.8v3.4M16 2.8v3.4M3.5 9.5h17" />
                    <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
                  </svg>
                )}
                {tab.id === 'learning' && (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m8 9-3 3 3 3M16 9l3 3-3 3M13.5 6.5l-3 11" />
                  </svg>
                )}
                {tab.id === 'playground' && (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
                    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
                    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
                    <path d="M17 13.8v6.4M13.8 17h6.4" />
                  </svg>
                )}
                {tab.id === 'life' && (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4.5 8.5a2 2 0 0 1 2-2h2l1.3-1.8h4.4l1.3 1.8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9Z" />
                    <circle cx="12" cy="13" r="3.2" />
                  </svg>
                )}
                {tab.id === 'creative' && (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="3.5" width="6" height="10.5" rx="3" />
                    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
                  </svg>
                )}
                <span
                  className="text-[10.5px] leading-tight tracking-[0.01em] truncate max-w-full"
                  style={{ fontWeight: active ? 600 : 500 }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Panels */}
      <QuickCaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleNavigate}
      />
      <AmbientHubModal open={ambientOpen} onClose={() => setAmbientOpen(false)} />
      <NoetrixManifestoModal open={manifestoOpen} onClose={() => setManifestoOpen(false)} />
      <Modal
        open={wheelOpen}
        onClose={() => setWheelOpen(false)}
        title={t('Spin Wheel', 'Vòng Quay Ngẫu Nhiên')}
      >
        <SpinWheelView />
      </Modal>
    </div>
  );
}

function RoomHeader({ title }: { title: string }) {
  const { hasBack, triggerBack } = useRoomBackState();
  return (
    <header className="mb-3 flex items-center gap-2.5 min-w-0">
      {hasBack && <BackButton onClick={triggerBack} />}
      <h1 className="editorial-h1 truncate">{title}</h1>
    </header>
  );
}

export default function App() {
  const isMiniMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'mini';

  return (
    <LanguageProvider>
      <ToastProvider>
        <RoomBackProvider>
          {isMiniMode ? <MiniDashboard /> : <LifeOSShell />}
        </RoomBackProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
