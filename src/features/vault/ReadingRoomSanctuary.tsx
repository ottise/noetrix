import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { db, createId, getLocalDateStr } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import {
  compressImageFile,
  saveMediaLocalAndMaybeUpload,
  isCloudinaryConfigured,
} from '../../lib/media';
import { useLanguage } from '../../lib/i18n';
import { scheduleSourceCodeSave } from '../../lib/sourceStore';
import type { Book, BookQuote } from '../../types';
import { ResolvedImage } from '../../components/ImageGallery';
import { ProgressBar, useToast } from '../../components/ui/Primitives';

const READING_TEXT_STORAGE_KEY = 'noetrix_reading_room_texts_v1';

interface BookReadingManuscript {
  ebookText: string;
  deepReflection: string;
  coreThesis: string;
  personalApplication: string;
  updatedAt: number;
}

type AmbientSoundMode = 'silent' | 'rain' | 'fireplace' | 'brown';
type PaperSurface = 'noir' | 'parchment' | 'midnight';
type DeskTab = 'reader' | 'pages' | 'journal';

function loadManuscripts(): Record<string, BookReadingManuscript> {
  try {
    const raw = localStorage.getItem(READING_TEXT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function ReadingRoomSanctuary({
  books,
  activeBook,
  onSelectBookId,
  onAddPages,
  onCloseRoom,
  onOpenAddBook,
}: {
  books: Book[];
  activeBook: Book | null;
  onSelectBookId: (id: string) => void;
  onAddPages: (book: Book, delta: number) => Promise<void>;
  onCloseRoom: () => void;
  onOpenAddBook: () => void;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [fullViewport, setFullViewport] = useState(false);
  const [deskTab, setDeskTab] = useState<DeskTab>('reader');
  const [surface, setSurface] = useState<PaperSurface>('noir');
  const [fontSize, setFontSize] = useState<number>(18);
  const [useSerif, setUseSerif] = useState<boolean>(true);
  const [ambientMode, setAmbientMode] = useState<AmbientSoundMode>('silent');

  // Reading Session Timer (default 25 min)
  const [timerPresetMin, setTimerPresetMin] = useState<number>(25);
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Per-book manuscript & uploaded PDF blob URL
  const [manuscripts, setManuscripts] = useState<Record<string, BookReadingManuscript>>(() =>
    loadManuscripts()
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [selectedSnippet, setSelectedSnippet] = useState<string>('');

  // Marginalia / Quote Composer
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);

  const ebookInputRef = useRef<HTMLInputElement>(null);
  const quoteFileRef = useRef<HTMLInputElement>(null);
  const quoteCameraRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  const currentMs: BookReadingManuscript = (activeBook && manuscripts[activeBook.id]) || {
    ebookText: '',
    deepReflection: '',
    coreThesis: '',
    personalApplication: '',
    updatedAt: Date.now(),
  };

  const updateManuscript = (patch: Partial<BookReadingManuscript>) => {
    if (!activeBook) return;
    setManuscripts((prev) => {
      const next = {
        ...prev,
        [activeBook.id]: {
          ...(prev[activeBook.id] || {
            ebookText: '',
            deepReflection: '',
            coreThesis: '',
            personalApplication: '',
            updatedAt: Date.now(),
          }),
          ...patch,
          updatedAt: Date.now(),
        },
      };
      try {
        localStorage.setItem(READING_TEXT_STORAGE_KEY, JSON.stringify(next));
        scheduleSourceCodeSave();
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Web Audio Procedural Soundscape Generator (Rain / Fireplace / Brown Noise)
  useEffect(() => {
    const stopSound = () => {
      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.disconnect();
        } catch {
          // ignore
        }
        noiseNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };

    if (ambientMode === 'silent') {
      stopSound();
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      stopSound();
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.2;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      if (ambientMode === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 950;
        filter.Q.value = 0.55;
      } else if (ambientMode === 'fireplace') {
        filter.type = 'lowpass';
        filter.frequency.value = 420;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 240;
      }

      const gain = ctx.createGain();
      gain.gain.value = ambientMode === 'rain' ? 0.055 : 0.075;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      noiseNodeRef.current = gain;
    } catch {
      // ignore autoplay block
    }

    return () => stopSound();
  }, [ambientMode]);

  // Reading Timer Countdown
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          triggerHaptic('success');
          awardXp(35);
          const today = getLocalDateStr();
          db.dailyLogs.get(today).then((existing) => {
            db.dailyLogs.put({
              date: today,
              codeDone: existing?.codeDone || false,
              codePillars: existing?.codePillars || [],
              codeMinutes: existing?.codeMinutes || 0,
              englishDone: existing?.englishDone || false,
              englishNote: existing?.englishNote || '',
              gymDone: existing?.gymDone || false,
              gymSplit: existing?.gymSplit || '',
              readDone: true,
              createDone: existing?.createDone,
              dailyNote: existing?.dailyNote || '',
              xpEarned: (existing?.xpEarned || 0) + 35,
              updatedAt: Date.now(),
            });
          });
          showToast(
            t(
              'Reading session complete! Logged to Life Balance · +35 XP',
              'Hoàn thành phiên đọc sách! Đã ghi nhận vào Nhịp sống · +35 XP'
            )
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerSeconds, showToast, t]);

  // Keyboard shortcut F to toggle Full Space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setFullViewport((v) => !v);
      } else if (e.key === 'Escape' && fullViewport) {
        setFullViewport(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullViewport]);

  // Clean up object URL for PDF
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleImportBookFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfFileName(file.name);
      showToast(t(`Opened PDF: ${file.name}`, `Đã mở sách PDF: ${file.name}`));
      return;
    }
    try {
      const text = await file.text();
      updateManuscript({ ebookText: text });
      showToast(
        t(
          `Loaded "${file.name}" into Reading Desk`,
          `Đã nạp nội dung "${file.name}" vào bàn đọc`
        )
      );
    } catch {
      showToast(t('Could not read file', 'Không thể đọc định dạng file này'), 'error');
    }
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook || (!quoteText.trim() && !quoteFile)) return;
    setSavingQuote(true);
    try {
      let imageMediaId: string | undefined;
      let imageRemoteUrl: string | undefined;
      let uploadedToCloud = false;

      if (quoteFile) {
        const compressed = await compressImageFile(quoteFile);
        const saved = await saveMediaLocalAndMaybeUpload('image', compressed.blob, compressed.fileName, {
          subFolder: 'books/quotes',
        });
        imageMediaId = saved.mediaId;
        imageRemoteUrl = saved.remoteUrl;
        uploadedToCloud = saved.provider === 'cloudinary';
      }

      const newQuote: BookQuote = {
        id: createId('qt'),
        text:
          quoteText.trim() ||
          (quoteFile ? `${t('Captured page', 'Trang sách chụp')} ${quotePage.trim() || ''}`.trim() : ''),
        page: quotePage.trim() || (activeBook.currentPage ? `p.${activeBook.currentPage}` : ''),
        imageMediaId,
        imageRemoteUrl,
        createdAt: Date.now(),
      };

      const nextQuotes = [newQuote, ...activeBook.quotes];
      await db.books.update(activeBook.id, { quotes: nextQuotes, updatedAt: Date.now() });
      await awardXp(15);
      setQuoteText('');
      setQuotePage('');
      setQuoteFile(null);
      showToast(
        uploadedToCloud
          ? t('Saved quote & page photo to Cloudinary · +15 XP', 'Đã lưu trích dẫn & ảnh lên Cloudinary · +15 XP')
          : t('Saved highlight to book · +15 XP', 'Đã lưu trích dẫn vào sách · +15 XP')
      );
    } finally {
      setSavingQuote(false);
    }
  };

  const surfaceStyles: Record<
    PaperSurface,
    { bg: string; cardBg: string; border: string; text: string; muted: string }
  > = {
    noir: {
      bg: '#0b0d11',
      cardBg: '#12151c',
      border: '#222834',
      text: '#edeae2',
      muted: '#9ca3af',
    },
    parchment: {
      bg: '#16130f',
      cardBg: '#1f1a14',
      border: '#362d22',
      text: '#f3ead8',
      muted: '#b8a992',
    },
    midnight: {
      bg: '#06080c',
      cardBg: '#0d1118',
      border: '#1b2230',
      text: '#e2e8f0',
      muted: '#8f98a8',
    },
  };

  const theme = surfaceStyles[surface];
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const pct =
    activeBook && activeBook.totalPages > 0
      ? Math.round((activeBook.currentPage / activeBook.totalPages) * 100)
      : 0;

  const pagePhotos = (activeBook?.quotes || []).filter((q) => Boolean(q.imageMediaId || q.imageRemoteUrl));

  const sanctuaryContent = (
    <div
      className={
        fullViewport
          ? 'fixed inset-0 z-[100] w-screen h-dvh overflow-y-auto p-4 sm:p-7'
          : 'rounded-2xl p-4 sm:p-6'
      }
      style={{
        backgroundColor: theme.bg,
        border: fullViewport ? 'none' : `1px solid ${theme.border}`,
        color: theme.text,
      }}
    >
      <div className={fullViewport ? 'max-w-[1600px] mx-auto space-y-5' : 'space-y-5'}>
        {/* ================================================================
            TOP SANCTUARY BAR: Navigation · Book Switcher · Ambient · Timer · Expand
            ================================================================ */}
        <header
          className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAmbientMode('silent');
                onCloseRoom();
              }}
              className="px-3 py-1.5 rounded-lg metadata text-[11px] uppercase tracking-wider cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'rgba(203, 168, 106, 0.12)',
                color: '#cba86a',
                border: '1px solid rgba(203, 168, 106, 0.3)',
              }}
            >
              {t('← Exit Reading Room', '← Thu gọn về Kệ Sách')}
            </button>

            {books.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="metadata text-[10.5px] uppercase tracking-wider" style={{ color: theme.muted }}>
                  {t('BOOK:', 'ĐANG ĐỌC:')}
                </span>
                <select
                  value={activeBook?.id || ''}
                  onChange={(e) => onSelectBookId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-[13.5px] font-semibold cursor-pointer max-w-[260px] sm:max-w-[340px] truncate"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.currentPage}/{b.totalPages})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAddBook}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer"
                style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
              >
                {t('+ Add First Book', '+ Thêm cuốn sách đầu tiên')}
              </button>
            )}
          </div>

          {/* Right Controls: Delete Book · Expand Space */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {activeBook && (
              <button
                type="button"
                onClick={async () => {
                  if (
                    !window.confirm(
                      t(
                        `Remove "${activeBook.title}" from your library?`,
                        `Xóa cuốn "${activeBook.title}" khỏi thư viện?`
                      )
                    )
                  ) {
                    return;
                  }
                  const remaining = books.filter((b) => b.id !== activeBook.id);
                  await db.books.delete(activeBook.id);
                  showToast(t('Deleted book', 'Đã xóa sách'), 'info');
                  if (remaining.length > 0) {
                    onSelectBookId(remaining[0].id);
                  } else {
                    onCloseRoom();
                  }
                }}
                className="px-3 py-1.5 rounded-lg metadata text-[11px] font-semibold cursor-pointer transition-colors hover:bg-red-500/15"
                style={{
                  backgroundColor: theme.bg,
                  color: '#f87171',
                  border: '1px solid rgba(248, 113, 113, 0.35)',
                }}
              >
                {t('Delete', 'Xóa sách')}
              </button>
            )}

            {/* Fullscreen Spatial Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFullViewport((v) => !v);
              }}
              className="px-3 py-1.5 rounded-lg metadata text-[11px] font-semibold cursor-pointer transition-all"
              style={{
                backgroundColor: fullViewport ? '#cba86a' : theme.bg,
                color: fullViewport ? '#0c0f13' : '#cba86a',
                border: '1px solid rgba(203, 168, 106, 0.45)',
              }}
              title={t('Press F to toggle full reading space', 'Nhấn phím F để mở rộng toàn màn hình')}
            >
              {fullViewport
                ? t('Exit Full Space (F)', 'Thu nhỏ khung (F)')
                : t('Expand Full Space (F)', 'Mở rộng toàn màn hình (F)')}
            </button>
          </div>
        </header>

        {!activeBook ? (
          <div
            className="rounded-xl p-12 text-center space-y-3"
            style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
          >
            <p className="font-editorial text-[26px]">
              {t('Your Reading Desk is ready.', 'Bàn đọc sách của bạn đã sẵn sàng.')}
            </p>
            <p className="text-[14px]" style={{ color: theme.muted }}>
              {t(
                'Add a book to your shelf to open the full reading canvas, timer, and marginalia.',
                'Hãy thêm một cuốn sách vào kệ để mở không gian đọc tập trung, bấm giờ và lưu trích dẫn.'
              )}
            </p>
            <button
              type="button"
              onClick={onOpenAddBook}
              className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
            >
              {t('+ Add Book to Library', '+ Thêm sách vào Thư Viện')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ==============================================================
                LEFT / CENTER 8 COLS: THE READING DESK CANVAS
                ============================================================== */}
            <div
              className="lg:col-span-8 rounded-xl p-5 sm:p-7 space-y-5"
              style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
            >
              {/* Book Header & Desk Mode Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: theme.border }}>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="metadata text-[10px] uppercase tracking-[0.16em]" style={{ color: '#cba86a' }}>
                      {activeBook.category}
                    </span>
                    <span style={{ color: theme.muted }}>·</span>
                    <span className="metadata text-[10.5px]" style={{ color: theme.muted }}>
                      {activeBook.author}
                    </span>
                  </div>
                  <h2 className="font-editorial text-[26px] sm:text-[30px] leading-tight truncate">
                    {activeBook.title}
                  </h2>
                </div>

                {/* 3 Desk Modes */}
                <div
                  className="flex items-center gap-1 p-1 rounded-xl shrink-0"
                  style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                >
                  {(
                    [
                      ['reader', t('Book Reader', 'Bàn Đọc Sách')],
                      ['pages', t(`Captured Pages (${pagePhotos.length})`, `Trang Sách (${pagePhotos.length})`)],
                      ['journal', t('Deep Notes', 'Sổ Tay Đọc Sâu')],
                    ] as const
                  ).map(([id, lbl]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDeskTab(id)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
                      style={{
                        backgroundColor: deskTab === id ? '#cba86a' : 'transparent',
                        color: deskTab === id ? '#0c0f13' : theme.muted,
                        fontWeight: deskTab === id ? 600 : 500,
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: BOOK READER (E-Text / Chapter Reader / PDF Viewer) */}
              {deskTab === 'reader' && (
                <div className="space-y-4">
                  {/* Reader Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => ebookInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg metadata text-[11px] font-semibold cursor-pointer"
                        style={{
                          backgroundColor: 'rgba(203, 168, 106, 0.14)',
                          color: '#cba86a',
                          border: '1px solid rgba(203, 168, 106, 0.35)',
                        }}
                      >
                        {t('Open Book File (.PDF / .TXT / .MD)', 'Mở File Sách (.PDF / .TXT / .MD)')}
                      </button>
                      {pdfUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(pdfUrl);
                            setPdfUrl(null);
                            setPdfFileName('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg metadata text-[10.5px] cursor-pointer text-red-400 border border-red-400/30"
                        >
                          {t(`Close PDF (${pdfFileName})`, `Đóng PDF (${pdfFileName})`)}
                        </button>
                      )}
                      <input
                        ref={ebookInputRef}
                        type="file"
                        accept=".pdf,.txt,.md,text/plain,application/pdf"
                        className="hidden"
                        onChange={(e) => handleImportBookFile(e.target.files?.[0])}
                      />
                    </div>

                    {/* Typography Controls */}
                    <div className="flex items-center gap-2 metadata text-[11px]">
                      <button
                        type="button"
                        onClick={() => setUseSerif((s) => !s)}
                        className="px-2.5 py-1 rounded-md cursor-pointer"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                      >
                        {useSerif ? 'Serif' : 'Sans'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                        className="w-7 h-7 rounded-md cursor-pointer"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                      >
                        A-
                      </button>
                      <span className="tabular-nums" style={{ color: theme.muted }}>
                        {fontSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => setFontSize((s) => Math.min(26, s + 1))}
                        className="w-7 h-7 rounded-md cursor-pointer"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Selected Text -> 1-Click Quote Highlight */}
                  {selectedSnippet && (
                    <div
                      className="p-3 rounded-xl flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'rgba(203, 168, 106, 0.14)',
                        border: '1px solid rgba(203, 168, 106, 0.4)',
                      }}
                    >
                      <p className="text-[12.5px] italic line-clamp-2 flex-1">“{selectedSnippet}”</p>
                      <button
                        type="button"
                        onClick={async () => {
                          const newQuote: BookQuote = {
                            id: createId('qt'),
                            text: selectedSnippet,
                            page: activeBook.currentPage ? `p.${activeBook.currentPage}` : '',
                            createdAt: Date.now(),
                          };
                          await db.books.update(activeBook.id, {
                            quotes: [newQuote, ...activeBook.quotes],
                            updatedAt: Date.now(),
                          });
                          await awardXp(15);
                          setSelectedSnippet('');
                          showToast(t('Highlighted passage saved · +15 XP', 'Đã lưu đoạn bôi đen vào Trích dẫn · +15 XP'));
                        }}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold shrink-0 cursor-pointer"
                        style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
                      >
                        {t('+ Save Highlight', '+ Lưu đoạn bôi đen')}
                      </button>
                    </div>
                  )}

                  {/* PDF Reader Canvas OR Spacious Text / Chapter Reading Canvas */}
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      title={pdfFileName || activeBook.title}
                      className="w-full h-[640px] rounded-xl border"
                      style={{ borderColor: theme.border, backgroundColor: '#000' }}
                    />
                  ) : (
                    <textarea
                      rows={fullViewport ? 22 : 16}
                      value={currentMs.ebookText}
                      onChange={(e) => updateManuscript({ ebookText: e.target.value })}
                      onSelect={(e) => {
                        const target = e.currentTarget;
                        const sel = target.value.slice(target.selectionStart, target.selectionEnd).trim();
                        if (sel.length >= 10) setSelectedSnippet(sel);
                      }}
                      placeholder={t(
                        'Paste a chapter, essay, or book excerpt here to read in calm typography — or click "Open Book File (.PDF / .TXT / .MD)" above.\n\nTip: Highlight any sentence here with your cursor to save it directly to your Marginalia quotes.',
                        'Dán chương sách, bài luận hoặc mở file sách (.PDF / .TXT / .MD) ở nút phía trên để đọc trong không gian tĩnh lặng...\n\nMẹo: Bôi đen bất kỳ câu văn tâm đắc nào trong khung này để lưu nhanh thành Trích dẫn bên lề.'
                      )}
                      className={`w-full p-5 sm:p-7 rounded-xl leading-[1.85] resize-y focus:outline-none ${
                        useSerif ? 'font-editorial-vi' : 'font-sans'
                      }`}
                      style={{
                        fontSize: `${fontSize}px`,
                        backgroundColor: theme.bg,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                      }}
                    />
                  )}
                </div>
              )}

              {/* TAB 2: CAPTURED PHYSICAL BOOK PAGES */}
              {deskTab === 'pages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[13px]" style={{ color: theme.muted }}>
                      {t(
                        'Reading a physical book? Capture or upload photos of key pages to inspect and annotate here.',
                        'Đang đọc sách giấy? Chụp hoặc tải ảnh các trang sách tâm đắc để phóng to và đối chiếu ngay tại bàn đọc.'
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => quoteCameraRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
                        style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
                      >
                        {t('Capture Page', 'Chụp trang sách')}
                      </button>
                      <button
                        type="button"
                        onClick={() => quoteFileRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                      >
                        {t('Upload Photo', 'Chọn ảnh')}
                      </button>
                    </div>
                  </div>

                  {pagePhotos.length === 0 ? (
                    <div
                      className="py-16 rounded-xl text-center space-y-2 border border-dashed"
                      style={{ borderColor: theme.border }}
                    >
                      <p className="text-[14.5px] font-medium">
                        {t('No captured book pages yet.', 'Chưa có ảnh chụp trang sách nào.')}
                      </p>
                      <p className="text-[12.5px]" style={{ color: theme.muted }}>
                        {t(
                          'Use the Marginalia box on the right or the button above to attach a page photo.',
                          'Bấm nút chụp ảnh phía trên hoặc đính kèm ảnh ở cột Trích dẫn bên phải.'
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pagePhotos.map((q) => (
                        <div
                          key={q.id}
                          className="rounded-xl overflow-hidden p-3 space-y-2"
                          style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                        >
                          <div className="rounded-lg overflow-hidden bg-black/40 max-h-[380px]">
                            <ResolvedImage
                              mediaId={q.imageMediaId}
                              remoteUrl={q.imageRemoteUrl}
                              alt={q.text}
                              className="w-full h-full object-contain max-h-[380px]"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-medium truncate">{q.text}</span>
                            {q.page && (
                              <span className="metadata text-[11px]" style={{ color: '#cba86a' }}>
                                {q.page}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DEEP READING JOURNAL & DIALOGUE WITH THE AUTHOR */}
              {deskTab === 'journal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="metadata text-[10.5px] uppercase tracking-wider" style={{ color: '#cba86a' }}>
                        {t('01 · AUTHOR’S CORE THESIS', '01 · LUẬN ĐIỂM CỐT LÕI CỦA TÁC GIẢ')}
                      </label>
                      <textarea
                        rows={4}
                        value={currentMs.coreThesis}
                        onChange={(e) => updateManuscript({ coreThesis: e.target.value })}
                        placeholder={t(
                          'What is the single most important argument or mental model in this book?',
                          'Tác giả đang giải quyết câu hỏi lớn nào? Mô hình tư duy cốt lõi của cuốn sách là gì?'
                        )}
                        className="w-full p-3.5 rounded-xl text-[13.5px] leading-relaxed"
                        style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="metadata text-[10.5px] uppercase tracking-wider" style={{ color: '#34d399' }}>
                        {t('02 · PERSONAL APPLICATION & ACTION', '02 · ỨNG DỤNG THỰC TẾ VÀO BẢN THÂN')}
                      </label>
                      <textarea
                        rows={4}
                        value={currentMs.personalApplication}
                        onChange={(e) => updateManuscript({ personalApplication: e.target.value })}
                        placeholder={t(
                          'How does this change how you think, build, or live?',
                          'Ý tưởng nào trong sách có thể áp dụng ngay vào tư duy, công việc hoặc cuộc sống của bạn?'
                        )}
                        className="w-full p-3.5 rounded-xl text-[13.5px] leading-relaxed"
                        style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="metadata text-[10.5px] uppercase tracking-wider" style={{ color: '#A7B6D2' }}>
                      {t('03 · CHAPTER NOTES & DIALOGUE WITH THE BOOK', '03 · GHI CHÉP CHƯƠNG SÁCH & ĐỐI THOẠI TƯ DUY')}
                    </label>
                    <textarea
                      rows={10}
                      value={currentMs.deepReflection}
                      onChange={(e) => updateManuscript({ deepReflection: e.target.value })}
                      placeholder={t(
                        'Write your chapter-by-chapter synthesis, critiques, and connections to other domains...',
                        'Tóm tắt từng chương theo ngôn ngữ của bạn, phản biện hoặc liên kết với các lĩnh vực khác...'
                      )}
                      className="w-full p-4 rounded-xl text-[14px] leading-relaxed"
                      style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ==============================================================
                RIGHT 4 COLS: PAGE PROGRESS TRACKER & MARGINALIA QUOTES
                ============================================================== */}
            <aside className="lg:col-span-4 space-y-5">
              {/* Live Page Progress Card */}
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#cba86a' }}>
                      {t('READING PROGRESS', 'TIẾN ĐỘ ĐỌC')}
                    </span>
                    <p className="font-editorial text-[26px] leading-none mt-1 tabular-nums">
                      {t('Page', 'Trang')} {activeBook.currentPage}{' '}
                      <span className="text-[15px]" style={{ color: theme.muted }}>
                        / {activeBook.totalPages}
                      </span>
                    </p>
                  </div>
                  <span className="metadata text-[15px] font-bold tabular-nums" style={{ color: '#34d399' }}>
                    {pct}%
                  </span>
                </div>

                <ProgressBar
                  value={activeBook.currentPage}
                  max={activeBook.totalPages}
                  positive={activeBook.status === 'finished'}
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddPages(activeBook, 1)}
                    className="px-2.5 py-1.5 rounded-lg metadata text-[11.5px] cursor-pointer"
                    style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                  >
                    +1 {t('p', 'tr')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddPages(activeBook, 5)}
                    className="px-2.5 py-1.5 rounded-lg metadata text-[11.5px] cursor-pointer"
                    style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: '#cba86a' }}
                  >
                    +5 {t('p', 'tr')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddPages(activeBook, 15)}
                    className="px-3 py-1.5 rounded-lg metadata text-[11.5px] font-semibold cursor-pointer"
                    style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
                  >
                    +15 {t('pages', 'trang')}
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={activeBook.totalPages}
                    value={activeBook.currentPage}
                    onChange={(e) =>
                      db.books.update(activeBook.id, {
                        currentPage: Math.min(
                          activeBook.totalPages,
                          Math.max(0, Number(e.target.value) || 0)
                        ),
                        status:
                          Number(e.target.value) >= activeBook.totalPages ? 'finished' : 'reading',
                        updatedAt: Date.now(),
                      })
                    }
                    className="w-16 px-2 py-1.5 rounded-lg metadata text-[12px] tabular-nums ml-auto"
                    style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                    title={t('Jump to page', 'Nhập trang hiện tại')}
                  />
                </div>
              </div>

              {/* Marginalia & Quote Capture Box */}
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10.5px] uppercase tracking-[0.14em]" style={{ color: '#cba86a' }}>
                    {t(`MARGINALIA & QUOTES (${activeBook.quotes.length})`, `TRÍCH DẪN & GHI CHÚ TRANG (${activeBook.quotes.length})`)}
                  </span>
                </div>

                <form onSubmit={handleAddQuote} className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder={t(
                      'Capture a memorable quote or insight from the page you are reading...',
                      'Ghi lại câu trích dẫn tâm đắc hoặc suy ngẫm ngay tại trang đang đọc...'
                    )}
                    className="w-full p-3 rounded-xl text-[13.5px] leading-relaxed"
                    style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                  />

                  {quoteFile && (
                    <div
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11.5px]"
                      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                    >
                      <span className="truncate text-emerald-400">
                        ✓ {quoteFile.name} {isCloudinaryConfigured() ? '(Cloudinary)' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuoteFile(null)}
                        className="text-red-400 ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={quotePage}
                      onChange={(e) => setQuotePage(e.target.value)}
                      placeholder={t(`Page (e.g. p.${activeBook.currentPage || 42})`, `Trang (vd: tr.${activeBook.currentPage || 42})`)}
                      className="w-28 px-2.5 py-1.5 rounded-lg text-[12px]"
                      style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                    />
                    <button
                      type="button"
                      onClick={() => quoteCameraRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg text-[11.5px] cursor-pointer"
                      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: '#cba86a' }}
                      title={t('Capture page photo', 'Chụp ảnh trang sách')}
                    >
                      {t('Capture', 'Chụp ảnh')}
                    </button>
                    <button
                      type="button"
                      onClick={() => quoteFileRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg text-[11.5px] cursor-pointer"
                      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: '#A7B6D2' }}
                      title={t('Attach image', 'Đính kèm ảnh')}
                    >
                      {t('Photo', 'Chọn ảnh')}
                    </button>
                    <button
                      type="submit"
                      disabled={savingQuote}
                      className="ml-auto px-3.5 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
                    >
                      {savingQuote ? '...' : t('+ Save Quote', '+ Lưu trích dẫn')}
                    </button>
                  </div>

                  <input
                    ref={quoteCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                  />
                  <input
                    ref={quoteFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                  />
                </form>

                {/* Saved Quotes Stream */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {activeBook.quotes.length === 0 ? (
                    <p className="text-[12.5px] py-4 text-center" style={{ color: theme.muted }}>
                      {t('No highlights saved for this book yet.', 'Chưa có trích dẫn nào cho cuốn sách này.')}
                    </p>
                  ) : (
                    activeBook.quotes.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl space-y-2"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-editorial-vi text-[14.5px] leading-relaxed">
                            “{q.text}”
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              db.books.update(activeBook.id, {
                                quotes: activeBook.quotes.filter((x) => x.id !== q.id),
                                updatedAt: Date.now(),
                              })
                            }
                            className="text-[11px] text-[#6b7280] hover:text-red-400 shrink-0 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        {q.page && (
                          <p className="metadata text-[10.5px]" style={{ color: '#cba86a' }}>
                            — {q.page}
                          </p>
                        )}
                        {(q.imageMediaId || q.imageRemoteUrl) && (
                          <div className="rounded-lg overflow-hidden max-h-[200px] bg-black/30">
                            <ResolvedImage
                              mediaId={q.imageMediaId}
                              remoteUrl={q.imageRemoteUrl}
                              alt={q.text}
                              className="w-full h-full object-contain max-h-[200px]"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );

  if (fullViewport && typeof document !== 'undefined') {
    return (
      <>
        <div className="min-h-[320px] rounded-2xl" style={{ backgroundColor: theme.bg }} />
        {createPortal(sanctuaryContent, document.body)}
      </>
    );
  }

  return sanctuaryContent;
}
