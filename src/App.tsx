import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { User } from 'firebase/auth';
import { db } from './db/database';
import { ensureSeedData } from './db/seed';
import { initSourceCodeAutoSync, scheduleSourceCodeSave } from './lib/sourceStore';
import { subscribeAuth } from './lib/firebase';
import { syncWithFirebaseCloud } from './lib/sync';
import { triggerHaptic } from './lib/haptics';
import type { WorkspaceId } from './types';
import { Modal, SegmentedControl, ToastProvider, useToast } from './components/ui/Primitives';
import { SettingsModal } from './components/SettingsModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AmbientHubModal } from './components/AmbientHubModal';
import { NoetrixManifestoModal } from './components/NoetrixManifestoModal';
import { MiniDashboard } from './features/ambient/MiniDashboard';
import { TodayView } from './features/today/TodayView';
import { CodeLab } from './features/learn/CodeLab';
import { LeetCode100Lab } from './features/learn/LeetCode100Lab';
import { ChessLab } from './features/learn/ChessLab';
import { SudokuLab } from './features/learn/SudokuLab';
import { WorkflowVault } from './features/studio/WorkflowVault';
import { ExcalidrawCanvas } from './features/studio/ExcalidrawCanvas';
import { PsychologyPipeline } from './features/studio/PsychologyPipeline';
import { ContentCalendar } from './features/studio/ContentCalendar';
import { StoryStudio } from './features/vault/StoryStudio';
import { Bookshelf } from './features/vault/Bookshelf';
import { HobbiesJournal } from './features/vault/HobbiesJournal';
import { HabitsWellnessView } from './features/life/HabitsWellnessView';
import { SpinWheelView } from './features/wheel/SpinWheelView';

// Section 3: Spatial Navigation ("Không gian thay vì danh sách chức năng")
const ROOMS: {
  id: WorkspaceId;
  index: string;
  label: string;
  micro: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'home',
    index: '00',
    label: 'Home',
    micro: 'Sanctuary & Daily Orbit',
    eyebrow: 'THE LIVING SPACE / 00',
    title: 'Home.',
    subtitle: 'Your private digital room.',
  },
  {
    id: 'learning',
    index: '01',
    label: 'The Lab',
    micro: 'Research & Deep Systems',
    eyebrow: 'YOUR RESEARCH SPACE / 01',
    title: 'The Lab.',
    subtitle: 'Explore ideas. Understand deeply. Build things.',
  },
  {
    id: 'knowledge',
    index: '02',
    label: 'The Library',
    micro: 'Knowledge & Curated Vault',
    eyebrow: 'A PLACE FOR KNOWLEDGE / 02',
    title: 'The Library.',
    subtitle: 'Collect ideas. Keep them alive.',
  },
  {
    id: 'creative',
    index: '03',
    label: 'The Studio',
    micro: 'Writing, Screenplay & Mind',
    eyebrow: 'A SPACE TO CREATE / 03',
    title: 'The Studio.',
    subtitle: 'Ideas are worth exploring.',
  },
  {
    id: 'playground',
    index: '04',
    label: 'The Playground',
    micro: 'Logic, Chess & Play',
    eyebrow: 'QUIET LEISURE / 04',
    title: 'The Playground.',
    subtitle: 'Take a little break. Not everything needs to be productive.',
  },
  {
    id: 'life',
    index: '05',
    label: 'Life',
    micro: 'Rhythm & Everyday Life',
    eyebrow: 'YOUR EVERYDAY LIFE / 05',
    title: 'Life, outside the screen.',
    subtitle: 'Take care of yourself.',
  },
];

const SIDEBAR_WHISPERS = [
  '01 / READY',
  '02 / CURIOUS',
  '03 / PROVE FIRST',
  '04 / PURE PURSUIT',
];

function LifeOSShell() {
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);

  const [workspace, setWorkspace] = useState<WorkspaceId>('home');
  const [labSub, setLabSub] = useState<'code' | 'leetcode' | 'chess' | 'sudoku'>('code');
  const [librarySub, setLibrarySub] = useState<'lectures' | 'books' | 'whiteboard'>('lectures');
  const [studioSub, setStudioSub] = useState<'psychology' | 'calendar' | 'stories' | 'drawing'>('psychology');
  const [playgroundSub, setPlaygroundSub] = useState<'wheel' | 'sudoku' | 'chess'>('wheel');
  const [lifeSub, setLifeSub] = useState<'habits' | 'books' | 'hobbies'>('habits');
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
        const target = ROOMS[Number(e.key)];
        if (target) handleNavigate(target.id);
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
    if (
      nextWs === 'learning' &&
      (sub === 'code' || sub === 'leetcode' || sub === 'chess' || sub === 'sudoku')
    ) {
      setLabSub(sub);
    } else if (nextWs === 'knowledge' && (sub === 'lectures' || sub === 'books' || sub === 'whiteboard')) {
      setLibrarySub(sub);
    } else if (
      nextWs === 'creative' &&
      (sub === 'psychology' || sub === 'calendar' || sub === 'stories' || sub === 'drawing')
    ) {
      setStudioSub(sub);
    } else if (nextWs === 'playground' && (sub === 'wheel' || sub === 'sudoku' || sub === 'chess')) {
      setPlaygroundSub(sub);
    } else if (nextWs === 'life' && (sub === 'habits' || sub === 'books' || sub === 'hobbies')) {
      setLifeSub(sub);
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
      showToast(`Đã đồng bộ · ↑${res.pushed} · ↓${res.pulled}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể đồng bộ lúc này', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="editorial-eyebrow">Entering Personal OS...</p>
      </div>
    );
  }

  const currentRoom = ROOMS.find((r) => r.id === workspace) || ROOMS[0];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* ================================================================
          DESKTOP SIDEBAR — Narrow Minimal Spatial Directory (232px)
          Zero icon clutter; pure room names & refined hover states
          ================================================================ */}
      <aside
        className="hidden md:flex md:flex-col w-[232px] shrink-0 sticky top-0 h-dvh px-5 py-7 justify-between ios-hairline-r"
        style={{ backgroundColor: 'var(--os-obsidian)' }}
      >
        <div className="space-y-9">
          {/* NOETRIX Identity Crest */}
          <div className="px-2 space-y-1.5">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="text-left block cursor-pointer group"
            >
              <p
                className="noetrix-logo text-[21px] leading-none"
                style={{ color: 'var(--os-ivory-bright)' }}
              >
                {profile?.appName || 'NOETRIX'}
              </p>
              <p
                className="text-[10px] font-medium uppercase tracking-[0.18em] mt-1.5"
                style={{ color: 'var(--os-brass)' }}
              >
                The Art of Becoming
              </p>
            </button>
            <div className="flex items-center justify-between gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setWhisperIdx((i) => (i + 1) % SIDEBAR_WHISPERS.length)}
                title="Curious by nature. Mischievous by design. Pure in pursuit."
                className="metadata text-[10px] tracking-[0.06em] whitespace-nowrap cursor-pointer transition-colors hover:text-[var(--os-brass)]"
                style={{ color: 'var(--os-ivory-faint)' }}
              >
                {SIDEBAR_WHISPERS[whisperIdx]}
              </button>
              <button
                type="button"
                onClick={() => setManifestoOpen(true)}
                className="metadata text-[10px] tracking-[0.08em] uppercase hover:underline cursor-pointer whitespace-nowrap"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                LEXICON ↗
              </button>
            </div>
          </div>

          {/* Spatial Room List — Editorial Directory with Left Brass Hairline */}
          <nav aria-label="Rooms" className="space-y-1">
            {ROOMS.map((room) => {
              const active = workspace === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleNavigate(room.id)}
                  className="relative w-full flex items-center justify-between pl-3 pr-2.5 py-2.5 rounded-r-[8px] transition-colors duration-200 cursor-pointer group text-left hover:bg-[rgba(217,213,203,0.03)]"
                  style={{
                    backgroundColor: active ? 'rgba(27, 29, 34, 0.72)' : 'transparent',
                    borderLeft: active
                      ? '2px solid var(--os-brass)'
                      : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="metadata text-[10px] tabular-nums shrink-0 mt-0.5 transition-colors"
                      style={{
                        color: active ? 'var(--os-brass)' : 'var(--os-ivory-faint)',
                      }}
                    >
                      {room.index}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-[13.5px] font-medium leading-none truncate transition-colors"
                        style={{
                          color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)',
                        }}
                      >
                        {room.label}
                      </p>
                      <p
                        className="text-[10.5px] mt-1.5 truncate"
                        style={{
                          color: active ? 'var(--os-ivory-muted)' : 'var(--os-ivory-faint)',
                        }}
                      >
                        {room.micro}
                      </p>
                    </div>
                  </div>
                  <span
                    className="metadata text-[9.5px] shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--os-ivory-faint)' }}
                  >
                    ⌥{Number(room.index)}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quiet Utility Footer — Quick Capture, Command Palette & Resume Lab */}
        <div className="space-y-1 pt-4 ios-hairline-t">
          {workspace !== 'learning' && (
            <button
              type="button"
              onClick={() => handleNavigate('learning', 'code')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[7px] text-[12px] transition-colors hover:bg-[var(--os-graphite)] cursor-pointer"
              style={{ color: 'var(--os-brass)' }}
            >
              <span>Resume The Lab</span>
              <span className="metadata text-[10.5px]">↗</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCaptureOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[7px] text-[12.5px] transition-colors hover:bg-[var(--os-graphite)] cursor-pointer"
            style={{ color: 'var(--os-ivory)' }}
          >
            <span>Quick Capture</span>
            <span className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
              ⇧N
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[7px] text-[12.5px] transition-colors hover:bg-[var(--os-graphite)] cursor-pointer"
            style={{ color: 'var(--os-ivory-muted)' }}
          >
            <span>Command Palette</span>
            <span className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
              ⌘K
            </span>
          </button>
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

            <div className="flex items-center gap-4 text-[12.5px]">
              <button
                type="button"
                onClick={() => setCaptureOpen(true)}
                className="font-medium cursor-pointer"
                style={{ color: 'var(--os-brass)' }}
              >
                + Capture
              </button>
            </div>
          </div>
        </header>

        {/* Generous Horizontal Editorial Reading/Living Container */}
        <main
          className={`flex-1 w-full ${
            workspace === 'learning' ||
            workspace === 'playground' ||
            (workspace === 'creative' &&
              (studioSub === 'psychology' || studioSub === 'stories' || studioSub === 'drawing')) ||
            (workspace === 'knowledge' && librarySub === 'whiteboard')
              ? 'max-w-[1440px] px-4 sm:px-8'
              : 'max-w-[1040px] px-5 sm:px-10 lg:px-14'
          } mx-auto pt-4 md:pt-10 pb-[96px] md:pb-16`}
        >
          {/* Room Header for inner rooms (Home renders its own full cinematic hero) */}
          {workspace !== 'home' && (
            <header className="mb-8 space-y-2">
              <p className="editorial-eyebrow">{currentRoom.eyebrow}</p>
              <h1 className="editorial-h1">{currentRoom.title}</h1>
              <p className="text-[14.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
                {currentRoom.subtitle}
              </p>
            </header>
          )}

          <div key={workspace} className="animate-ios-view space-y-6">
            {workspace === 'home' && (
              <TodayView
                onNavigate={handleNavigate}
                onOpenCapture={() => setCaptureOpen(true)}
                onOpenAmbient={() => setAmbientOpen(true)}
                onOpenManifesto={() => setManifestoOpen(true)}
              />
            )}

            {workspace === 'learning' && (
              <>
                <nav
                  aria-label="Lab Disciplines"
                  className="grid grid-cols-2 sm:grid-cols-4 border-b"
                  style={{ borderColor: 'var(--os-border)' }}
                >
                  {(
                    [
                      { value: 'code', code: '01.A', label: 'Programming & AI', hint: 'Systems & Agents' },
                      { value: 'leetcode', code: '01.B', label: 'LeetCode 100 · Java', hint: '90-Day Roadmap' },
                      { value: 'chess', code: '01.C', label: 'Chess · Think Ahead', hint: 'Calculation' },
                      { value: 'sudoku', code: '01.D', label: 'Sudoku · Prove First', hint: 'Zero-Guess Logic' },
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
                        className="relative px-3.5 py-3 text-left transition-colors cursor-pointer hover:bg-[rgba(217,213,203,0.025)]"
                        style={{
                          borderBottom: active
                            ? '2px solid var(--os-brass)'
                            : '2px solid transparent',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="metadata text-[9.5px] uppercase tracking-[0.12em]"
                            style={{ color: active ? 'var(--os-brass)' : 'var(--os-ivory-faint)' }}
                          >
                            {item.code}
                          </span>
                          {active && (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: 'var(--os-brass)' }}
                            />
                          )}
                        </div>
                        <p
                          className="text-[13.5px] font-medium mt-1 truncate"
                          style={{ color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-muted)' }}
                        >
                          {item.label}
                        </p>
                        <p
                          className="text-[11px] mt-0.5 truncate"
                          style={{ color: 'var(--os-ivory-faint)' }}
                        >
                          {item.hint}
                        </p>
                      </button>
                    );
                  })}
                </nav>
                {labSub === 'code' && <CodeLab onSwitchTrack={(track) => setLabSub(track)} />}
                {labSub === 'leetcode' && <LeetCode100Lab />}
                {labSub === 'chess' && <ChessLab />}
                {labSub === 'sudoku' && <SudokuLab />}
              </>
            )}

            {workspace === 'knowledge' && (
              <>
                <SegmentedControl
                  value={librarySub}
                  onChange={setLibrarySub}
                  options={[
                    { value: 'lectures', label: 'AI Workflow Archive' },
                    { value: 'whiteboard', label: 'Whiteboard · Excalidraw' },
                    { value: 'books', label: 'Bookshelf' },
                  ]}
                />
                {librarySub === 'lectures' && <WorkflowVault />}
                {librarySub === 'whiteboard' && <ExcalidrawCanvas />}
                {librarySub === 'books' && <Bookshelf />}
              </>
            )}

            {workspace === 'creative' && (
              <>
                <SegmentedControl
                  value={studioSub}
                  onChange={setStudioSub}
                  options={[
                    { value: 'psychology', label: 'Psychology · Research' },
                    { value: 'stories', label: 'Writing Room' },
                    { value: 'drawing', label: 'Whiteboard · Excalidraw' },
                    { value: 'calendar', label: 'Calendar' },
                  ]}
                />
                {studioSub === 'psychology' && <PsychologyPipeline />}
                {studioSub === 'stories' && <StoryStudio />}
                {studioSub === 'calendar' && (
                  <ContentCalendar
                    onJump={(target) => {
                      if (target === 'workflow') handleNavigate('knowledge', 'lectures');
                      else setStudioSub('psychology');
                    }}
                  />
                )}
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
                        CHESS · VARIATION & STRATEGY
                      </span>
                      <p className="font-editorial text-[23px] leading-tight mt-0.5" style={{ color: '#EDEAE2' }}>
                        Chess Room
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'rgba(217,213,203,0.82)' }}>
                        “Think ahead before you move.”
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
                      SUDOKU · FROM LOGIC TO MASTERY
                    </span>
                    <div>
                      <p className="font-editorial text-[24px] leading-tight" style={{ color: 'var(--os-ivory-bright)' }}>
                        Sudoku Training
                      </p>
                      <p className="text-[12.5px] mt-1" style={{ color: 'var(--os-ivory-muted)' }}>
                        “Prove before you place.” · Zero-guess deduction
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
                      SURPRISE ME
                    </span>
                    <div className="space-y-1">
                      <p className="font-editorial text-[22px] leading-snug" style={{ color: 'var(--os-ivory-bright)' }}>
                        Let the next little adventure be random.
                      </p>
                      <p className="text-[12.5px] font-medium" style={{ color: 'var(--os-brass)' }}>
                        Spin the wheel ↗
                      </p>
                    </div>
                  </button>
                </div>

                {playgroundSub === 'wheel' && <SpinWheelView />}
                {playgroundSub === 'sudoku' && <SudokuLab />}
                {playgroundSub === 'chess' && <ChessLab />}
              </div>
            )}

            {workspace === 'life' && (
              <>
                <SegmentedControl
                  value={lifeSub}
                  onChange={setLifeSub}
                  options={[
                    { value: 'habits', label: 'Movement & Rhythm' },
                    { value: 'books', label: 'Reading' },
                    { value: 'hobbies', label: 'Swimming & Art' },
                  ]}
                />
                {lifeSub === 'habits' && <HabitsWellnessView />}
                {lifeSub === 'books' && <Bookshelf />}
                {lifeSub === 'hobbies' && <HobbiesJournal />}
              </>
            )}
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
          {(
            [
              ['home', 'Home'],
              ['learning', 'Lab'],
              ['knowledge', 'Library'],
              ['creative', 'Studio'],
            ] as const
          ).map(([id, label]) => {
            const active = workspace === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavigate(id)}
                className="flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer"
                style={{
                  color: active ? 'var(--os-ivory-bright)' : 'var(--os-ivory-faint)',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <span className="text-[12px] tracking-[0.01em]">{label}</span>
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
            <span className="text-[12px] tracking-[0.01em]">Rooms</span>
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
      <Modal open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Your Private World">
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
    <ToastProvider>
      {isMiniMode ? <MiniDashboard /> : <LifeOSShell />}
    </ToastProvider>
  );
}
