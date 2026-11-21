import React, { useEffect, useMemo, useState } from 'react';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
import { Modal, useRoomBack } from '../../components/ui/Primitives';
import type { BeginnerTopicGuide } from './osBeginnerGuides';
import { BeginnerGuidePanel } from './BeginnerGuidePanel';

export interface CourseModuleItem {
  id: string;
  code: string;
  title: string;
  description: string;
  accent: string;
}

export interface CourseTopicItem {
  id: string;
  moduleId: string;
  code: string;
  title: string;
  subtitle: string;
  status: 'not_started' | 'learning' | 'completed';
  overview: string;
  detailedTheory: string;
}

export interface CourseComparisonTable {
  id: string;
  title: string;
  columns: string[];
  rows: { criterion: string; items: string[] }[];
}

export interface CourseFlashcardItem {
  id: string;
  topicId: string;
  front: string;
  back: string;
  confidence: 'learning' | 'mastered';
  createdAt: number;
}

export interface CourseExtraTab {
  id: string;
  label: string;
  render: (openLessonById: (topicId: string) => void) => React.ReactNode;
}

interface SubjectCourseViewProps {
  subjectTitle: string;
  subjectOverview: string;
  accentColor: string;
  modules: CourseModuleItem[];
  topics: CourseTopicItem[];
  guides: Record<string, BeginnerTopicGuide>;
  activeTopicId: string;
  viewMode: 'dashboard' | 'lesson';
  onChangeView: (view: 'dashboard' | 'lesson') => void;
  onSelectTopic: (topicId: string) => void;
  onToggleCompleted: (topicId: string) => void;
  onUpdateNote: (topicId: string, noteText: string) => void;
  onExitSubject?: () => void;
  renderDiagram?: (topicId: string) => React.ReactNode;
  extraTabs?: CourseExtraTab[];
  comparisons?: CourseComparisonTable[];
  flashcards?: CourseFlashcardItem[];
  onToggleCardMastered?: (cardId: string) => void;
  onCreateFlashcard?: (front: string, back: string) => void;
}

function TheoryMarkdownFallback({ content, accentColor }: { content: string; accentColor: string }) {
  const lines = content.split('\n');
  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('`') && p.endsWith('`') && p.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-[4px] font-mono text-[12px]"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: accentColor }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      if (p.startsWith('**') && p.endsWith('**') && p.length >= 4) {
        return (
          <strong key={idx} style={{ color: '#EDEAE2', fontWeight: 600 }}>
            {p.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{p}</React.Fragment>;
    });
  };

  return (
    <div
      className="rounded-[12px] p-4 sm:p-5 space-y-2.5"
      style={{ backgroundColor: '#13161D', border: '1px solid rgba(217, 213, 203, 0.09)' }}
    >
      {lines.map((ln, idx) => {
        const trimmed = ln.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[15px] font-semibold pt-2" style={{ color: accentColor }}>
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
          return (
            <p key={idx} className="text-[13.5px] leading-relaxed pl-3 text-[#c7cdd8]">
              {renderInline(trimmed)}
            </p>
          );
        }
        return (
          <p key={idx} className="text-[13.5px] leading-relaxed text-[#c7cdd8]">
            {renderInline(ln)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Clean 2-step subject learning experience with diagrams & interactive tools:
 * 1) Subject Dashboard (Overview + Lesson List, plus Diagram/Comparison/Flashcard tabs)
 * 2) Lesson Page (Diagram + Lesson Content + Personal Note + 1 completion tick)
 */
export function SubjectCourseView({
  subjectTitle,
  subjectOverview,
  accentColor,
  modules,
  topics,
  guides,
  activeTopicId,
  viewMode,
  onChangeView,
  onSelectTopic,
  onToggleCompleted,
  onUpdateNote,
  onExitSubject,
  renderDiagram,
  extraTabs = [],
  comparisons = [],
  flashcards = [],
  onToggleCardMastered,
  onCreateFlashcard,
}: SubjectCourseViewProps) {
  const { t } = useLanguage();

  useRoomBack(viewMode === 'lesson' || Boolean(onExitSubject), () => {
    if (viewMode === 'lesson') {
      onChangeView('dashboard');
    } else {
      onExitSubject?.();
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileChaptersOpen, setMobileChaptersOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<string>('lessons');

  // Flashcards viewer state
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcModalOpen, setFcModalOpen] = useState(false);
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');

  const activeTopic = topics.find((tp) => tp.id === activeTopicId) || topics[0];
  const activeModule = modules.find((m) => m.id === activeTopic.moduleId) || modules[0];

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => ({
    [activeTopic.moduleId]: true,
  }));

  useEffect(() => {
    setExpandedModules((prev) => ({ ...prev, [activeTopic.moduleId]: true }));
  }, [activeTopic.moduleId]);

  const completedCount = useMemo(
    () => topics.filter((tp) => tp.status === 'completed').length,
    [topics]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return topics.filter(
      (tp) =>
        tp.title.toLowerCase().includes(q) ||
        tp.code.toLowerCase().includes(q) ||
        tp.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery, topics]);

  const activeIdx = topics.findIndex((tp) => tp.id === activeTopic.id);
  const prevTopic = activeIdx > 0 ? topics[activeIdx - 1] : null;
  const nextTopic = activeIdx >= 0 && activeIdx < topics.length - 1 ? topics[activeIdx + 1] : null;

  const openLesson = (topicId: string) => {
    triggerHaptic('selection');
    setMobileChaptersOpen(false);
    setSearchQuery('');
    onSelectTopic(topicId);
    onChangeView('lesson');
  };

  const chapterTreeBody = (
    <>
      <div className="flex items-center justify-between gap-2 pb-1">
        <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: accentColor }}>
          {t('Lessons', 'Danh sách bài')}
        </span>
        <button
          type="button"
          onClick={() => setMobileChaptersOpen(false)}
          aria-label="Close chapters"
          className="lg:hidden w-7 h-7 rounded-md bg-white/[0.06] text-[#d1d5db] flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5">
        {modules.map((mod) => {
          const modTopics = topics.filter((tp) => tp.moduleId === mod.id);
          const isOpen = expandedModules[mod.id] || mod.id === activeTopic.moduleId;
          return (
            <div
              key={mod.id}
              className="rounded-[8px] overflow-hidden"
              style={{
                backgroundColor: '#101114',
                border: '1px solid rgba(217, 213, 203, 0.06)',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedModules((prev) => ({ ...prev, [mod.id]: !isOpen }))}
                className="w-full px-2.5 py-2 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-white/[0.03]"
              >
                <span className="text-[12px] font-medium truncate" style={{ color: '#EDEAE2' }}>
                  <span className="metadata text-[10px] mr-1.5" style={{ color: mod.accent }}>
                    {mod.code}
                  </span>
                  {mod.title}
                </span>
                <span className="text-[10px] shrink-0 text-[#8b92a1]">{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className="px-1.5 pb-1.5 space-y-0.5">
                  {modTopics.map((tp) => {
                    const isSelected = tp.id === activeTopic.id;
                    return (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => openLesson(tp.id)}
                        className="w-full px-2 py-1.5 rounded-[6px] text-left flex items-center justify-between gap-2 cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                          color: isSelected ? accentColor : '#bfc6d4',
                        }}
                      >
                        <span className="text-[11.5px] truncate">
                          <span className="metadata text-[9.5px] mr-1.5 opacity-70">{tp.code}</span>
                          {tp.title}
                        </span>
                        {tp.status === 'completed' && (
                          <span className="text-[11px] font-bold shrink-0" style={{ color: '#9BAA98' }}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  if (viewMode === 'dashboard') {
    const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
    const allTabs: { id: string; label: string }[] = [
      { id: 'lessons', label: t('Lessons', 'Bài học') },
      ...extraTabs.map((et) => ({ id: et.id, label: et.label })),
      ...(comparisons.length > 0
        ? [{ id: 'comparisons', label: t('Comparisons', 'Bảng so sánh') }]
        : []),
      ...(flashcards.length > 0 || onCreateFlashcard
        ? [{ id: 'flashcards', label: `Flashcards (${flashcards.length})` }]
        : []),
    ];

    const matchedExtraTab = extraTabs.find((et) => et.id === dashboardTab);
    const currentCard = flashcards.length > 0 ? flashcards[fcIndex % flashcards.length] : null;

    return (
      <div className="space-y-4">
        {/* Clean Subject Header + Back + Search + Tool Tabs */}
        <header
          className="rounded-[14px] p-4 sm:p-5 space-y-4"
          style={{
            backgroundColor: '#13151B',
            border: '1px solid rgba(217, 213, 203, 0.09)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <h2 className="text-[20px] sm:text-[22px] font-semibold leading-tight tracking-[-0.02em]" style={{ color: '#EDEAE2' }}>
                {subjectTitle}
              </h2>
              <span
                className="metadata text-[11px] px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(155, 170, 152, 0.12)',
                  color: '#9BAA98',
                  border: '1px solid rgba(155, 170, 152, 0.25)',
                }}
              >
                {completedCount}/{topics.length} ✓
              </span>
            </div>

            <div className="relative w-full md:w-[300px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search lesson...', 'Tìm nhanh bài học...')}
                className="w-full px-3 py-1.5 rounded-[8px] text-[12.5px]"
                style={{
                  backgroundColor: '#101114',
                  color: '#EDEAE2',
                  border: '1px solid rgba(217, 213, 203, 0.12)',
                }}
              />
              {searchQuery.trim() && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-[10px] p-2 max-h-[280px] overflow-y-auto shadow-2xl space-y-1"
                  style={{
                    backgroundColor: '#16181F',
                    border: '1px solid rgba(217, 213, 203, 0.16)',
                  }}
                >
                  {searchResults.length === 0 ? (
                    <p className="text-[12px] px-2 py-1.5 text-[#8b92a1]">
                      {t('No matching lessons', 'Không tìm thấy bài phù hợp')}
                    </p>
                  ) : (
                    searchResults.slice(0, 12).map((tp) => (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => openLesson(tp.id)}
                        className="w-full text-left px-2.5 py-2 rounded-[7px] hover:bg-white/5 cursor-pointer"
                      >
                        <p className="text-[12.5px] font-medium text-[#EDEAE2]">
                          <span className="metadata text-[10.5px] mr-2" style={{ color: accentColor }}>
                            {tp.code}
                          </span>
                          {tp.title}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {allTabs.length > 1 && (
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap pt-2 border-t border-white/[0.07]">
              {allTabs.map((tab) => {
                const active = dashboardTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setDashboardTab(tab.id);
                    }}
                    className="shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors"
                    style={{
                      backgroundColor: active ? '#22252F' : '#101114',
                      color: active ? accentColor : '#9ca3af',
                      border: active
                        ? `1px solid color-mix(in srgb, ${accentColor} 45%, transparent)`
                        : '1px solid rgba(217, 213, 203, 0.08)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        {/* Tab 1: Overview + Lesson List */}
        {dashboardTab === 'lessons' && (
          <>
            <div
              className="p-4 rounded-[12px] space-y-2.5"
              style={{
                backgroundColor: '#13151B',
                border: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <p className="text-[13.5px] leading-relaxed text-[#cfd5e0]">{subjectOverview}</p>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%`, backgroundColor: accentColor }}
                />
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="metadata text-[11px] uppercase tracking-[0.14em]" style={{ color: accentColor }}>
                {t('CURRICULUM & LESSONS', 'DANH SÁCH BÀI HỌC')} ({topics.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {modules.map((mod) => {
                  const modTopics = topics.filter((tp) => tp.moduleId === mod.id);
                  const modDone = modTopics.filter((tp) => tp.status === 'completed').length;
                  return (
                    <div
                      key={mod.id}
                      className="rounded-[12px] p-4 space-y-2.5"
                      style={{
                        backgroundColor: '#14161C',
                        border: '1px solid rgba(217, 213, 203, 0.08)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/[0.06]">
                        <div>
                          <span className="metadata text-[10.5px]" style={{ color: mod.accent }}>
                            {mod.code}
                          </span>
                          <h4 className="text-[15px] font-semibold text-[#EDEAE2]">{mod.title}</h4>
                          <p className="text-[12px] text-[#98a0b0] mt-0.5">{mod.description}</p>
                        </div>
                        <span className="metadata text-[10.5px] shrink-0 text-[#98a0b0]">
                          {modDone}/{modTopics.length}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {modTopics.map((tp) => (
                          <button
                            key={tp.id}
                            type="button"
                            onClick={() => openLesson(tp.id)}
                            className="w-full px-2.5 py-2 rounded-[8px] text-left flex items-center justify-between gap-2 hover:bg-white/[0.05] cursor-pointer transition-colors"
                            style={{ backgroundColor: '#101114' }}
                          >
                            <div className="min-w-0">
                              <span className="metadata text-[10.5px] mr-2" style={{ color: mod.accent }}>
                                {tp.code}
                              </span>
                              <span className="text-[13px] text-[#EDEAE2]">{tp.title}</span>
                            </div>
                            <span
                              className="text-[12px] shrink-0 font-bold"
                              style={{ color: tp.status === 'completed' ? '#9BAA98' : 'rgba(217,213,203,0.22)' }}
                            >
                              {tp.status === 'completed' ? '✓' : '→'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Subject-specific Extra Diagram / Lab Tabs */}
        {matchedExtraTab && matchedExtraTab.render(openLesson)}

        {/* Comparison Tables Tab */}
        {dashboardTab === 'comparisons' && (
          <div className="space-y-4">
            {comparisons.map((tbl) => (
              <div
                key={tbl.id}
                className="rounded-[12px] overflow-hidden"
                style={{
                  backgroundColor: '#14161C',
                  border: '1px solid rgba(217, 213, 203, 0.09)',
                }}
              >
                <div className="px-4 py-3 border-b border-white/[0.08]">
                  <h3 className="text-[15px] font-semibold text-[#EDEAE2]">{tbl.title}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08]" style={{ backgroundColor: '#101114' }}>
                        <th className="px-4 py-2.5 font-medium text-[#A7B6D2]">{t('Criterion', 'Tiêu chí')}</th>
                        {tbl.columns.map((c) => (
                          <th key={c} className="px-4 py-2.5 font-semibold" style={{ color: accentColor }}>
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {tbl.rows.map((row) => (
                        <tr key={row.criterion}>
                          <td className="px-4 py-2.5 font-medium text-[#EDEAE2]">{row.criterion}</td>
                          {row.items.map((cell, idx) => (
                            <td key={idx} className="px-4 py-2.5 text-[#c7cdd8]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Flashcards Tab */}
        {dashboardTab === 'flashcards' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-editorial text-[22px] text-[#EDEAE2]">
                Flashcards ({flashcards.length})
              </h3>
              {onCreateFlashcard && (
                <button
                  type="button"
                  onClick={() => setFcModalOpen(true)}
                  className="px-3.5 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
                  style={{ backgroundColor: accentColor, color: '#101114' }}
                >
                  + {t('Add Flashcard', 'Tạo Flashcard')}
                </button>
              )}
            </div>

            {currentCard && (
              <div
                onClick={() => setFcFlipped((f) => !f)}
                className="p-6 sm:p-8 rounded-[14px] min-h-[220px] flex flex-col justify-between cursor-pointer select-none"
                style={{
                  backgroundColor: '#14161C',
                  border: `1px solid color-mix(in srgb, ${accentColor} 35%, transparent)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10.5px]" style={{ color: accentColor }}>
                    CARD {(fcIndex % flashcards.length) + 1} / {flashcards.length} ·{' '}
                    {fcFlipped ? 'ANSWER' : 'QUESTION'}
                  </span>
                  <span
                    className="metadata text-[10px]"
                    style={{ color: currentCard.confidence === 'mastered' ? '#9BAA98' : '#A7B6D2' }}
                  >
                    {currentCard.confidence.toUpperCase()}
                  </span>
                </div>

                <p className="text-[17px] leading-relaxed py-4 text-[#EDEAE2]">
                  {fcFlipped ? currentCard.back : currentCard.front}
                </p>

                <div
                  className="flex items-center justify-between pt-3 border-t border-white/[0.08]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFcIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
                      setFcFlipped(false);
                    }}
                    className="px-3 py-1 rounded-[6px] text-[12px] cursor-pointer bg-[#101114] text-[#c7cdd8]"
                  >
                    ← {t('Prev', 'Trước')}
                  </button>
                  <div className="flex gap-2">
                    {onToggleCardMastered && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleCardMastered(currentCard.id);
                          setFcIndex((i) => (i + 1) % flashcards.length);
                          setFcFlipped(false);
                        }}
                        className="px-3 py-1 rounded-[6px] text-[12px] font-medium cursor-pointer"
                        style={{ backgroundColor: 'rgba(155, 170, 152, 0.16)', color: '#9BAA98' }}
                      >
                        ✓ {t('Mastered', 'Đã nhớ')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFcIndex((i) => (i + 1) % flashcards.length);
                        setFcFlipped(false);
                      }}
                      className="px-3 py-1 rounded-[6px] text-[12px] cursor-pointer bg-[#101114]"
                      style={{ color: accentColor }}
                    >
                      {t('Next', 'Tiếp')} →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Modal open={fcModalOpen} onClose={() => setFcModalOpen(false)} title={t('New Flashcard', 'Tạo Flashcard mới')}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!fcFront.trim() || !fcBack.trim() || !onCreateFlashcard) return;
                  onCreateFlashcard(fcFront.trim(), fcBack.trim());
                  setFcFront('');
                  setFcBack('');
                  setFcModalOpen(false);
                }}
                className="space-y-3"
              >
                <textarea
                  rows={2}
                  required
                  value={fcFront}
                  onChange={(e) => setFcFront(e.target.value)}
                  placeholder={t('Question / Concept...', 'Mặt trước (Câu hỏi / Thuật ngữ)...')}
                  className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]"
                />
                <textarea
                  rows={3}
                  required
                  value={fcBack}
                  onChange={(e) => setFcBack(e.target.value)}
                  placeholder={t('Answer / Core idea...', 'Mặt sau (Giải thích cốt lõi)...')}
                  className="w-full px-3 py-2 rounded-[8px] ios-fill text-[13.5px]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-[8px] text-[13px] font-semibold cursor-pointer"
                  style={{ backgroundColor: accentColor, color: '#101114' }}
                >
                  {t('Save', 'Lưu Flashcard')}
                </button>
              </form>
            </Modal>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // LESSON VIEW: DIAGRAM + LESSON CONTENT + PERSONAL NOTE
  // =========================================================================
  return (
    <div className="space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileChaptersOpen(true)}
            className="lg:hidden px-3 py-1.5 min-h-[32px] rounded-full text-[12px] font-medium cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: '#14161C',
              color: accentColor,
              border: '1px solid rgba(217, 213, 203, 0.12)',
            }}
          >
            <span>☰</span>
            <span>{t('Chapters', 'Mục lục')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!prevTopic}
            onClick={() => prevTopic && openLesson(prevTopic.id)}
            aria-label="Previous lesson"
            className="w-8 h-8 rounded-full border border-white/[0.09] bg-[#14161C] text-[#d1d5db] flex items-center justify-center cursor-pointer disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={!nextTopic}
            onClick={() => nextTopic && openLesson(nextTopic.id)}
            aria-label="Next lesson"
            className="w-8 h-8 rounded-full border border-white/[0.09] bg-[#14161C] text-[#d1d5db] flex items-center justify-center cursor-pointer disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* Lesson Workspace Container */}
      <div
        className="flex flex-col lg:flex-row rounded-[14px] overflow-hidden"
        style={{
          backgroundColor: '#111216',
          border: '1px solid rgba(217, 213, 203, 0.09)',
        }}
      >
        {/* Mobile Chapters Drawer */}
        {mobileChaptersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileChaptersOpen(false)}
            />
            <aside
              className="relative z-10 w-[86%] max-w-[330px] h-full p-4 space-y-3 overflow-y-auto border-r shadow-2xl"
              style={{
                backgroundColor: '#13151B',
                borderColor: 'rgba(217, 213, 203, 0.14)',
              }}
            >
              {chapterTreeBody}
            </aside>
          </div>
        )}

        {/* Desktop Left Chapter Navigation */}
        <aside
          className="hidden lg:block w-[290px] shrink-0 p-3.5 space-y-3 border-r max-h-[960px] overflow-y-auto"
          style={{
            backgroundColor: '#13151B',
            borderColor: 'rgba(217, 213, 203, 0.08)',
          }}
        >
          {chapterTreeBody}
        </aside>

        {/* Right: Diagram + Lesson Content + Personal Note */}
        <section className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* Lesson Title + Single Completion Tick */}
          <div
            className="pb-4 border-b space-y-2.5"
            style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium" style={{ color: accentColor }}>
                {activeTopic.code} · {activeModule.title}
              </span>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onToggleCompleted(activeTopic.id);
                }}
                aria-label="Đánh dấu đã hoàn thành"
                title={activeTopic.status === 'completed' ? 'Đã hoàn thành (nhấn để bỏ)' : 'Đánh dấu đã hoàn thành'}
                className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] font-semibold cursor-pointer transition-colors shrink-0"
                style={{
                  backgroundColor: activeTopic.status === 'completed' ? 'rgba(155, 170, 152, 0.14)' : '#16181E',
                  color: activeTopic.status === 'completed' ? '#9BAA98' : 'rgba(217, 213, 203, 0.3)',
                  border: activeTopic.status === 'completed'
                    ? '1px solid rgba(155, 170, 152, 0.5)'
                    : '1px solid rgba(217, 213, 203, 0.12)',
                }}
              >
                ✓
              </button>
            </div>

            <h2 className="text-[20px] sm:text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#EDEAE2]">
              {activeTopic.title}
            </h2>
            <p className="text-[12px] text-[#a7b0bf]">{activeTopic.subtitle}</p>
          </div>

          {/* Topic Visual Diagram */}
          {renderDiagram && renderDiagram(activeTopic.id)}

          {/* Lesson Content */}
          {guides[activeTopic.id] ? (
            <BeginnerGuidePanel guide={guides[activeTopic.id]} accentColor={accentColor} />
          ) : (
            <TheoryMarkdownFallback content={activeTopic.detailedTheory} accentColor={accentColor} />
          )}

          {/* Personal Note */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="metadata text-[11px] uppercase tracking-[0.12em]" style={{ color: accentColor }}>
                {t('Personal Note', 'Ghi chú bài học')}
              </span>
              <span className="metadata text-[10px] text-[#7a8291]">{t('Auto-saved', 'Tự lưu')}</span>
            </div>
            <textarea
              rows={6}
              value={activeTopic.overview}
              onChange={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.max(150, el.scrollHeight)}px`;
                onUpdateNote(activeTopic.id, el.value);
              }}
              placeholder={t('Write your notes or summary here...', 'Ghi chú hoặc tóm tắt nhanh ý chính của bài học...')}
              className="w-full min-h-[150px] px-4 py-3 rounded-[12px] text-[14px] leading-relaxed resize-y"
              style={{
                backgroundColor: '#14161C',
                color: '#EDEAE2',
                border: '1px solid rgba(217, 213, 203, 0.12)',
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
