import React, { useState } from 'react';
import { createId, getLocalDateStr } from '../../db/database';
import {
  formatSourceCitation,
  RESEARCH_SECTIONS_META,
  SOURCE_CATEGORIES,
  type CitationFormat,
  type KnowledgeSource,
  type KnowledgeSourceCategory,
  type RawJournalEntry,
  type ResearchCoreSectionKey,
  type ResearchProject,
  type ResearchTimelineEvent,
  type SourceClaimLink,
} from './researchJournalData';

/**
 * Shared styled input/label primitives kept local to Research Workspace
 * so styling remains crisp Obsidian + Graphite editorial without external clutter.
 */
export function FieldBlock({
  label,
  hint,
  optionalLabel,
  onRemoveOptional,
  children,
}: {
  label: string;
  hint?: string;
  optionalLabel?: string;
  onRemoveOptional?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <label
            className="text-[13.5px] font-medium block"
            style={{ color: 'var(--os-ivory-bright)' }}
          >
            {label}
          </label>
          {hint && (
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--os-ivory-faint)' }}>
              {hint}
            </p>
          )}
        </div>
        {optionalLabel && (
          <div className="flex items-center gap-2">
            <span
              className="metadata text-[9.5px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-[5px]"
              style={{
                backgroundColor: 'rgba(167, 182, 210, 0.08)',
                color: 'var(--os-dusty-blue)',
              }}
            >
              {optionalLabel}
            </span>
            {onRemoveOptional && (
              <button
                type="button"
                onClick={onRemoveOptional}
                className="text-[11px] hover:underline cursor-pointer"
                style={{ color: 'var(--os-ivory-faint)' }}
              >
                Ẩn trường
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Inline component shown inside 05 Literature, 07 Evidence, and 09 Discussion
 * so sources from Source Manager attach directly to specific claims/arguments.
 */
export function InlineSectionSources({
  sectionKey,
  project,
  sources,
  sourceLinks,
  onAddLink,
  onRemoveLink,
  onOpenSourceManager,
}: {
  sectionKey: 'literature' | 'evidence' | 'discussion';
  project: ResearchProject;
  sources: KnowledgeSource[];
  sourceLinks: SourceClaimLink[];
  onAddLink: (link: SourceClaimLink) => void;
  onRemoveLink: (linkId: string) => void;
  onOpenSourceManager: () => void;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sources[0]?.id || '');
  const [claimLabel, setClaimLabel] = useState('');
  const [stance, setStance] = useState<SourceClaimLink['stance']>('supports');
  const [excerpt, setExcerpt] = useState('');

  const linksHere = sourceLinks.filter(
    (l) => l.researchId === project.id && l.section === sectionKey
  );

  const sectionTitle =
    sectionKey === 'evidence'
      ? 'Evidence'
      : sectionKey === 'discussion'
      ? 'Discussion'
      : 'Literature Review';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceId || !claimLabel.trim()) return;
    onAddLink({
      id: createId('sl'),
      researchId: project.id,
      sourceId: selectedSourceId,
      section: sectionKey,
      claimLabel: claimLabel.trim(),
      stance,
      excerpt: excerpt.trim(),
      createdAt: Date.now(),
    });
    setClaimLabel('');
    setExcerpt('');
    setComposerOpen(false);
  };

  return (
    <div
      className="rounded-[10px] p-4 space-y-3"
      style={{
        backgroundColor: '#13151B',
        border: '1px solid rgba(217, 213, 203, 0.08)',
      }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
            SOURCE LINKS · {sectionTitle.toUpperCase()}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
            Gắn tài liệu từ Source Manager vào đúng luận điểm trong {sectionTitle}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSourceManager}
            className="text-[11.5px] px-2.5 py-1 rounded-[6px] cursor-pointer hover:bg-white/5"
            style={{
              color: 'var(--os-ivory-muted)',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          >
            Mở Source Manager ↗
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedSourceId && sources[0]) setSelectedSourceId(sources[0].id);
              setComposerOpen((v) => !v);
            }}
            className="text-[11.5px] font-medium px-2.5 py-1 rounded-[6px] cursor-pointer"
            style={{
              backgroundColor: composerOpen ? '#23262F' : 'rgba(185, 155, 121, 0.14)',
              color: '#B99B79',
              border: '1px solid rgba(185, 155, 121, 0.3)',
            }}
          >
            {composerOpen ? 'Đóng' : '+ Gắn nguồn vào luận điểm'}
          </button>
        </div>
      </div>

      {composerOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-3.5 rounded-[8px] space-y-3"
          style={{
            backgroundColor: '#101114',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          {sources.length === 0 ? (
            <p className="text-[12.5px]" style={{ color: 'var(--os-ivory-muted)' }}>
              Chưa có nguồn nào trong Source Manager. Hãy thêm tài liệu trước.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="md:col-span-2">
                  <label className="metadata text-[9.5px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--os-ivory-faint)' }}>
                    Chọn tài liệu nguồn
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-[7px] text-[12.5px]"
                    style={{
                      backgroundColor: '#171920',
                      color: 'var(--os-ivory-bright)',
                      border: '1px solid rgba(217, 213, 203, 0.12)',
                    }}
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.author || 'Unknown'} ({s.publicationYear || 'n.d.'}) — {s.paperTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="metadata text-[9.5px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--os-ivory-faint)' }}>
                    Vai trò với luận điểm
                  </label>
                  <select
                    value={stance}
                    onChange={(e) => setStance(e.target.value as SourceClaimLink['stance'])}
                    className="w-full px-2.5 py-2 rounded-[7px] text-[12.5px]"
                    style={{
                      backgroundColor: '#171920',
                      color: 'var(--os-ivory-bright)',
                      border: '1px solid rgba(217, 213, 203, 0.12)',
                    }}
                  >
                    <option value="supports">Ủng hộ (Supports)</option>
                    <option value="contrasts">Phản biện / Trái chiều (Contrasts)</option>
                    <option value="context">Bối cảnh (Context)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="metadata text-[9.5px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--os-ivory-faint)' }}>
                  Luận điểm / Đoạn cần chứng minh
                </label>
                <input
                  type="text"
                  required
                  value={claimLabel}
                  onChange={(e) => setClaimLabel(e.target.value)}
                  placeholder="Ví dụ: Cơ chế Dopamine tăng ở pha kỳ vọng chứ không phải khi hoàn thành..."
                  className="w-full px-3 py-2 rounded-[7px] text-[13px]"
                  style={{
                    backgroundColor: '#171920',
                    color: 'var(--os-ivory-bright)',
                    border: '1px solid rgba(217, 213, 203, 0.12)',
                  }}
                />
              </div>

              <div>
                <label className="metadata text-[9.5px] uppercase tracking-[0.1em] block mb-1" style={{ color: 'var(--os-ivory-faint)' }}>
                  Trích dẫn / Ghi chú trang (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Đoạn trích hoặc số liệu cụ thể từ nguồn..."
                  className="w-full px-3 py-2 rounded-[7px] text-[12.5px] resize-y"
                  style={{
                    backgroundColor: '#171920',
                    color: 'var(--os-ivory-bright)',
                    border: '1px solid rgba(217, 213, 203, 0.12)',
                  }}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold cursor-pointer"
                  style={{ backgroundColor: '#B99B79', color: '#101114' }}
                >
                  Lưu liên kết nguồn
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {linksHere.length === 0 ? (
        <p className="text-[12px] italic" style={{ color: 'var(--os-ivory-faint)' }}>
          Chưa có nguồn nào gắn trực tiếp vào luận điểm của {sectionTitle}.
        </p>
      ) : (
        <div className="space-y-2">
          {linksHere.map((lnk) => {
            const src = sources.find((s) => s.id === lnk.sourceId);
            const stanceMeta =
              lnk.stance === 'supports'
                ? { label: 'SUPPORTS', color: '#9BAA98', bg: 'rgba(155, 170, 152, 0.12)' }
                : lnk.stance === 'contrasts'
                ? { label: 'CONTRASTS', color: '#C98A82', bg: 'rgba(201, 138, 130, 0.12)' }
                : { label: 'CONTEXT', color: '#A7B6D2', bg: 'rgba(167, 182, 210, 0.12)' };

            return (
              <div
                key={lnk.id}
                className="p-3 rounded-[8px] flex items-start justify-between gap-3"
                style={{
                  backgroundColor: '#101114',
                  border: '1px solid rgba(217, 213, 203, 0.07)',
                }}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="metadata text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-[4px]"
                      style={{ backgroundColor: stanceMeta.bg, color: stanceMeta.color }}
                    >
                      {stanceMeta.label}
                    </span>
                    <span className="text-[12.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                      {lnk.claimLabel}
                    </span>
                  </div>
                  {lnk.excerpt && (
                    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--os-ivory-muted)' }}>
                      “{lnk.excerpt}”
                    </p>
                  )}
                  <p className="metadata text-[11px]" style={{ color: '#B99B79' }}>
                    Nguồn: {src ? `${src.author} (${src.publicationYear || 'n.d.'}) · ${src.paperTitle}` : 'Nguồn đã xóa'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLink(lnk.id)}
                  className="text-[11px] shrink-0 hover:underline cursor-pointer"
                  style={{ color: 'var(--os-ivory-faint)' }}
                >
                  Gỡ
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Auxiliary View 1: Research Notes
 */
export function ResearchNotesPanel({
  project,
  notes,
  onAddNote,
  onDeleteNote,
  onPushNoteToSection,
}: {
  project: ResearchProject;
  notes: RawJournalEntry[];
  onAddNote: (entry: RawJournalEntry) => void;
  onDeleteNote: (id: string) => void;
  onPushNoteToSection: (note: RawJournalEntry, sectionKey: ResearchCoreSectionKey) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetSection, setTargetSection] = useState<ResearchCoreSectionKey | ''>('');
  const [filterSection, setFilterSection] = useState<string>('all');

  const projectNotes = notes.filter(
    (n) =>
      (n.relatedResearchIds.length === 0 || n.relatedResearchIds.includes(project.id)) &&
      (filterSection === 'all' || n.targetSection === filterSection)
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) return;
    const now = Date.now();
    onAddNote({
      id: createId('note'),
      title: title.trim() || 'Ghi chú nhanh',
      date: getLocalDateStr(),
      rawContent: content.trim(),
      tags: [],
      targetSection: targetSection || undefined,
      relatedResearchIds: [project.id],
      createdAt: now,
      updatedAt: now,
    });
    setTitle('');
    setContent('');
    setTargetSection('');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap border-b pb-4" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
        <div>
          <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
            AUXILIARY WORKSPACE · RESEARCH NOTES
          </p>
          <h2 className="text-[22px] font-semibold mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
            Research Notes
          </h2>
          <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
            Ghi chú nhanh trong quá trình đọc và suy nghĩ — chuyển thẳng vào các đầu mục nghiên cứu khi cần.
          </p>
        </div>

        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="px-3 py-1.5 rounded-[7px] text-[12px]"
          style={{
            backgroundColor: '#16181E',
            color: 'var(--os-ivory-bright)',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          <option value="all">Tất cả ghi chú</option>
          {RESEARCH_SECTIONS_META.map((sec) => (
            <option key={sec.key} value={sec.key}>
              Gắn mục {sec.code} · {sec.shortLabel}
            </option>
          ))}
        </select>
      </header>

      <form
        onSubmit={handleCreate}
        className="p-4 rounded-[10px] space-y-3"
        style={{
          backgroundColor: '#14161C',
          border: '1px solid rgba(217, 213, 203, 0.09)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề ngắn hoặc ý tưởng..."
            className="md:col-span-2 px-3 py-2 rounded-[7px] text-[13px]"
            style={{
              backgroundColor: '#101114',
              color: 'var(--os-ivory-bright)',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          />
          <select
            value={targetSection}
            onChange={(e) => setTargetSection(e.target.value as ResearchCoreSectionKey | '')}
            className="px-3 py-2 rounded-[7px] text-[12.5px]"
            style={{
              backgroundColor: '#101114',
              color: 'var(--os-ivory-muted)',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          >
            <option value="">Chưa gắn mục cụ thể</option>
            {RESEARCH_SECTIONS_META.map((sec) => (
              <option key={sec.key} value={sec.key}>
                {sec.code}. {sec.shortLabel}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết suy nghĩ thô, câu hỏi thoáng qua, hoặc ghi chú khi đang đọc tài liệu..."
          className="w-full px-3 py-2.5 rounded-[7px] text-[13.5px] leading-relaxed resize-y"
          style={{
            backgroundColor: '#101114',
            color: 'var(--os-ivory-bright)',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#B99B79', color: '#101114' }}
          >
            Lưu ghi chú
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {projectNotes.length === 0 ? (
          <p className="text-[13px] italic py-4" style={{ color: 'var(--os-ivory-faint)' }}>
            Chưa có ghi chú nào phù hợp bộ lọc.
          </p>
        ) : (
          projectNotes.map((note) => {
            const linkedMeta = RESEARCH_SECTIONS_META.find((m) => m.key === note.targetSection);
            return (
              <article
                key={note.id}
                className="p-4 rounded-[10px] space-y-2.5"
                style={{
                  backgroundColor: '#14161C',
                  border: '1px solid rgba(217, 213, 203, 0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="metadata text-[10.5px]" style={{ color: 'var(--os-ivory-faint)' }}>
                        {note.date}
                      </span>
                      {linkedMeta && (
                        <span
                          className="metadata text-[9.5px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px]"
                          style={{ backgroundColor: 'rgba(167, 182, 210, 0.12)', color: '#A7B6D2' }}
                        >
                          {linkedMeta.code} {linkedMeta.shortLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-medium mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const sec = e.target.value as ResearchCoreSectionKey;
                        if (sec) {
                          onPushNoteToSection(note, sec);
                          e.target.value = '';
                        }
                      }}
                      className="px-2 py-1 rounded-[6px] text-[11.5px] cursor-pointer"
                      style={{
                        backgroundColor: '#101114',
                        color: '#9BAA98',
                        border: '1px solid rgba(155, 170, 152, 0.25)',
                      }}
                    >
                      <option value="">Đưa vào mục...</option>
                      <option value="problem">02 · Problem Observation</option>
                      <option value="questions">03 · Sub-questions</option>
                      <option value="literature">05 · Literature Review</option>
                      <option value="evidence">07 · Evidence Notes</option>
                      <option value="discussion">09 · Discussion</option>
                      <option value="reflection">11 · Reflection</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="text-[11.5px] hover:underline cursor-pointer"
                      style={{ color: 'var(--os-ivory-faint)' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--os-ivory-muted)' }}>
                  {note.rawContent}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Auxiliary View 2: Source Manager
 */
export function SourceManagerPanel({
  project,
  sources,
  sourceLinks,
  citationFormat,
  onAddSource,
  onDeleteSource,
  onAddLink,
  onRemoveLink,
}: {
  project: ResearchProject;
  sources: KnowledgeSource[];
  sourceLinks: SourceClaimLink[];
  citationFormat: CitationFormat;
  onAddSource: (src: KnowledgeSource) => void;
  onDeleteSource: (id: string) => void;
  onAddLink: (link: SourceClaimLink) => void;
  onRemoveLink: (linkId: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<KnowledgeSourceCategory>('Scientific Papers');
  const [paperTitle, setPaperTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [journalOrPublisher, setJournalOrPublisher] = useState('');
  const [doiOrUrl, setDoiOrUrl] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');

  // Inline claim attach per source card
  const [attachingSourceId, setAttachingSourceId] = useState<string | null>(null);
  const [targetSec, setTargetSec] = useState<'evidence' | 'discussion' | 'literature'>('evidence');
  const [claimLabel, setClaimLabel] = useState('');
  const [stance, setStance] = useState<SourceClaimLink['stance']>('supports');
  const [excerpt, setExcerpt] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperTitle.trim()) return;
    const now = Date.now();
    onAddSource({
      id: createId('src'),
      category,
      paperTitle: paperTitle.trim(),
      author: author.trim(),
      publicationYear: publicationYear.trim(),
      journalOrPublisher: journalOrPublisher.trim(),
      doiOrUrl: doiOrUrl.trim(),
      abstractText: '',
      keyFindings: keyFindings.trim(),
      limitations: '',
      personalNotes: personalNotes.trim(),
      relatedResearchIds: [project.id],
      createdAt: now,
      updatedAt: now,
    });
    setPaperTitle('');
    setAuthor('');
    setPublicationYear('');
    setJournalOrPublisher('');
    setDoiOrUrl('');
    setKeyFindings('');
    setPersonalNotes('');
    setFormOpen(false);
  };

  const handleAttachClaim = (e: React.FormEvent, sourceId: string) => {
    e.preventDefault();
    if (!claimLabel.trim()) return;
    onAddLink({
      id: createId('sl'),
      researchId: project.id,
      sourceId,
      section: targetSec,
      claimLabel: claimLabel.trim(),
      stance,
      excerpt: excerpt.trim(),
      createdAt: Date.now(),
    });
    setClaimLabel('');
    setExcerpt('');
    setAttachingSourceId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap border-b pb-4" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
        <div>
          <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
            AUXILIARY WORKSPACE · SOURCE MANAGER
          </p>
          <h2 className="text-[22px] font-semibold mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
            Source Manager
          </h2>
          <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
            Quản lý tài liệu tham khảo và gắn trực tiếp nguồn vào từng luận điểm trong Evidence hoặc Discussion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="px-3.5 py-2 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
          style={{ backgroundColor: '#B99B79', color: '#101114' }}
        >
          {formOpen ? 'Đóng form' : '+ Thêm tài liệu nguồn'}
        </button>
      </header>

      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="p-4 rounded-[10px] space-y-3"
          style={{
            backgroundColor: '#14161C',
            border: '1px solid rgba(185, 155, 121, 0.35)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KnowledgeSourceCategory)}
              className="px-3 py-2 rounded-[7px] text-[12.5px]"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            >
              {SOURCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              placeholder="Tên bài nghiên cứu / Sách / Bài viết *"
              className="md:col-span-3 px-3 py-2 rounded-[7px] text-[13px]"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Tác giả (VD: Schultz, W.)"
              className="px-3 py-2 rounded-[7px] text-[12.5px]"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
            <input
              type="text"
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value)}
              placeholder="Năm (VD: 1998)"
              className="px-3 py-2 rounded-[7px] text-[12.5px]"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
            <input
              type="text"
              value={journalOrPublisher}
              onChange={(e) => setJournalOrPublisher(e.target.value)}
              placeholder="Tạp chí / NXB"
              className="px-3 py-2 rounded-[7px] text-[12.5px]"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
            <input
              type="text"
              value={doiOrUrl}
              onChange={(e) => setDoiOrUrl(e.target.value)}
              placeholder="DOI hoặc URL"
              className="px-3 py-2 rounded-[7px] text-[12.5px]"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <textarea
              rows={2}
              value={keyFindings}
              onChange={(e) => setKeyFindings(e.target.value)}
              placeholder="Phát hiện cốt lõi từ tài liệu này..."
              className="px-3 py-2 rounded-[7px] text-[12.5px] resize-y"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
            <textarea
              rows={2}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Ghi chú riêng khi đọc..."
              className="px-3 py-2 rounded-[7px] text-[12.5px] resize-y"
              style={{
                backgroundColor: '#101114',
                color: 'var(--os-ivory-bright)',
                border: '1px solid rgba(217, 213, 203, 0.1)',
              }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#B99B79', color: '#101114' }}
            >
              Lưu tài liệu
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sources.map((src) => {
          const linksForSource = sourceLinks.filter(
            (l) => l.researchId === project.id && l.sourceId === src.id
          );
          const isAttaching = attachingSourceId === src.id;

          return (
            <div
              key={src.id}
              className="p-4 rounded-[10px] space-y-3"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="metadata text-[9.5px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-[4px]"
                      style={{ backgroundColor: 'rgba(185, 155, 121, 0.12)', color: '#B99B79' }}
                    >
                      {src.category}
                    </span>
                    <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                      {src.author || 'Unknown'} · {src.publicationYear || 'n.d.'}
                    </span>
                  </div>
                  <h3 className="text-[15.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                    {src.paperTitle}
                  </h3>
                  <p className="metadata text-[11.5px] break-all" style={{ color: 'var(--os-ivory-faint)' }}>
                    {formatSourceCitation(src, citationFormat)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAttachingSourceId(isAttaching ? null : src.id)}
                    className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(155, 170, 152, 0.12)',
                      color: '#9BAA98',
                      border: '1px solid rgba(155, 170, 152, 0.3)',
                    }}
                  >
                    {isAttaching ? 'Đóng' : '+ Gắn vào luận điểm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSource(src.id)}
                    className="text-[11.5px] hover:underline cursor-pointer"
                    style={{ color: 'var(--os-ivory-faint)' }}
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {(src.keyFindings || src.personalNotes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[12.5px]">
                  {src.keyFindings && (
                    <div className="p-2.5 rounded-[7px]" style={{ backgroundColor: '#101114' }}>
                      <span className="metadata text-[9.5px] uppercase tracking-[0.1em] block mb-1" style={{ color: '#A7B6D2' }}>
                        Key Findings
                      </span>
                      <p style={{ color: 'var(--os-ivory-muted)' }}>{src.keyFindings}</p>
                    </div>
                  )}
                  {src.personalNotes && (
                    <div className="p-2.5 rounded-[7px]" style={{ backgroundColor: '#101114' }}>
                      <span className="metadata text-[9.5px] uppercase tracking-[0.1em] block mb-1" style={{ color: '#B99B79' }}>
                        Personal Notes
                      </span>
                      <p style={{ color: 'var(--os-ivory-muted)' }}>{src.personalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {linksForSource.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="metadata text-[9.5px] uppercase tracking-[0.1em]" style={{ color: 'var(--os-ivory-faint)' }}>
                    Đang hỗ trợ cho các luận điểm ({linksForSource.length}):
                  </span>
                  {linksForSource.map((lnk) => (
                    <div
                      key={lnk.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px]"
                      style={{ backgroundColor: '#101114', border: '1px solid rgba(217, 213, 203, 0.06)' }}
                    >
                      <div className="min-w-0">
                        <span className="metadata uppercase text-[10px] mr-2" style={{ color: '#9BAA98' }}>
                          [{lnk.section}]
                        </span>
                        <span style={{ color: 'var(--os-ivory-bright)' }}>{lnk.claimLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveLink(lnk.id)}
                        className="text-[11px] hover:underline cursor-pointer shrink-0"
                        style={{ color: 'var(--os-ivory-faint)' }}
                      >
                        Gỡ
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isAttaching && (
                <form
                  onSubmit={(e) => handleAttachClaim(e, src.id)}
                  className="p-3 rounded-[8px] space-y-2.5"
                  style={{ backgroundColor: '#101114', border: '1px solid rgba(155, 170, 152, 0.25)' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={targetSec}
                      onChange={(e) =>
                        setTargetSec(e.target.value as 'evidence' | 'discussion' | 'literature')
                      }
                      className="px-2.5 py-1.5 rounded-[6px] text-[12px]"
                      style={{
                        backgroundColor: '#171920',
                        color: 'var(--os-ivory-bright)',
                        border: '1px solid rgba(217, 213, 203, 0.1)',
                      }}
                    >
                      <option value="evidence">07 · Evidence & Analysis</option>
                      <option value="discussion">09 · Discussion</option>
                      <option value="literature">05 · Literature Review</option>
                    </select>
                    <select
                      value={stance}
                      onChange={(e) => setStance(e.target.value as SourceClaimLink['stance'])}
                      className="px-2.5 py-1.5 rounded-[6px] text-[12px]"
                      style={{
                        backgroundColor: '#171920',
                        color: 'var(--os-ivory-bright)',
                        border: '1px solid rgba(217, 213, 203, 0.1)',
                      }}
                    >
                      <option value="supports">Ủng hộ (Supports)</option>
                      <option value="contrasts">Phản biện (Contrasts)</option>
                      <option value="context">Bối cảnh (Context)</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={claimLabel}
                      onChange={(e) => setClaimLabel(e.target.value)}
                      placeholder="Luận điểm liên kết..."
                      className="px-2.5 py-1.5 rounded-[6px] text-[12.5px]"
                      style={{
                        backgroundColor: '#171920',
                        color: 'var(--os-ivory-bright)',
                        border: '1px solid rgba(217, 213, 203, 0.1)',
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Trích dẫn ngắn (tùy chọn)..."
                      className="flex-1 px-2.5 py-1.5 rounded-[6px] text-[12px]"
                      style={{
                        backgroundColor: '#171920',
                        color: 'var(--os-ivory-bright)',
                        border: '1px solid rgba(217, 213, 203, 0.1)',
                      }}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-[6px] text-[12px] font-semibold cursor-pointer"
                      style={{ backgroundColor: '#9BAA98', color: '#101114' }}
                    >
                      Gắn nguồn
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Auxiliary View 3: Research Timeline
 */
export function ResearchTimelinePanel({
  project,
  events,
  onAddEvent,
  onDeleteEvent,
}: {
  project: ResearchProject;
  events: ResearchTimelineEvent[];
  onAddEvent: (ev: ResearchTimelineEvent) => void;
  onDeleteEvent: (id: string) => void;
}) {
  const [category, setCategory] = useState<ResearchTimelineEvent['category']>('question');
  const [summary, setSummary] = useState('');
  const [snapshot, setSnapshot] = useState('');

  const projectEvents = events
    .filter((e) => e.researchId === project.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onAddEvent({
      id: createId('tl'),
      researchId: project.id,
      dateStr: getLocalDateStr(),
      timestamp: Date.now(),
      category,
      summary: summary.trim(),
      snapshot: snapshot.trim() || undefined,
    });
    setSummary('');
    setSnapshot('');
  };

  const catColor = (c: ResearchTimelineEvent['category']) => {
    if (c === 'question') return '#A7B6D2';
    if (c === 'hypothesis') return '#B99B79';
    if (c === 'conclusion') return '#9BAA98';
    return 'var(--os-ivory-muted)';
  };

  return (
    <div className="space-y-6">
      <header className="border-b pb-4" style={{ borderColor: 'rgba(217, 213, 203, 0.08)' }}>
        <p className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#B99B79' }}>
          AUXILIARY WORKSPACE · RESEARCH TIMELINE
        </p>
        <h2 className="text-[22px] font-semibold mt-1" style={{ color: 'var(--os-ivory-bright)' }}>
          Research Timeline
        </h2>
        <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--os-ivory-muted)' }}>
          Theo dõi quá trình tiến hóa của câu hỏi nghiên cứu, giả thuyết và kết luận theo thời gian.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-[10px] space-y-3"
        style={{
          backgroundColor: '#14161C',
          border: '1px solid rgba(217, 213, 203, 0.09)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ResearchTimelineEvent['category'])}
            className="px-3 py-2 rounded-[7px] text-[12.5px]"
            style={{
              backgroundColor: '#101114',
              color: 'var(--os-ivory-bright)',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          >
            <option value="question">Thay đổi Câu hỏi (Question)</option>
            <option value="hypothesis">Điều chỉnh Giả thuyết (Hypothesis)</option>
            <option value="conclusion">Cập nhật Kết luận (Conclusion)</option>
            <option value="reflection">Chuyển biến Nhận thức (Reflection)</option>
            <option value="milestone">Mốc ghi nhận khác (Milestone)</option>
          </select>
          <input
            type="text"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Tóm tắt sự thay đổi (VD: Thu hẹp câu hỏi từ trì hoãn chung sang ma sát 15 phút đầu)..."
            className="md:col-span-2 px-3 py-2 rounded-[7px] text-[13px]"
            style={{
              backgroundColor: '#101114',
              color: 'var(--os-ivory-bright)',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          />
        </div>
        <textarea
          rows={2}
          value={snapshot}
          onChange={(e) => setSnapshot(e.target.value)}
          placeholder="Phiên bản câu hỏi / giả thuyết / kết luận tại thời điểm này (tùy chọn)..."
          className="w-full px-3 py-2 rounded-[7px] text-[12.5px] resize-y"
          style={{
            backgroundColor: '#101114',
            color: 'var(--os-ivory-bright)',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#B99B79', color: '#101114' }}
          >
            Ghi vào Timeline
          </button>
        </div>
      </form>

      <div className="relative pl-5 space-y-4 border-l" style={{ borderColor: 'rgba(217, 213, 203, 0.12)' }}>
        {projectEvents.length === 0 ? (
          <p className="text-[13px] italic" style={{ color: 'var(--os-ivory-faint)' }}>
            Chưa có mốc thay đổi nào. Khi bạn bấm Save section ở Questions, Hypothesis, Conclusion hoặc Reflection, thay đổi quan trọng sẽ được ghi lại tại đây.
          </p>
        ) : (
          projectEvents.map((ev) => (
            <div
              key={ev.id}
              className="relative p-4 rounded-[10px] space-y-1.5"
              style={{
                backgroundColor: '#14161C',
                border: '1px solid rgba(217, 213, 203, 0.08)',
              }}
            >
              <span
                className="absolute -left-[25px] top-5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  backgroundColor: catColor(ev.category),
                  borderColor: '#101114',
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="metadata text-[9.5px] uppercase tracking-[0.1em]"
                    style={{ color: catColor(ev.category) }}
                  >
                    {ev.category}
                  </span>
                  <span className="metadata text-[11px]" style={{ color: 'var(--os-ivory-faint)' }}>
                    · {ev.dateStr}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(ev.id)}
                  className="text-[11px] hover:underline cursor-pointer"
                  style={{ color: 'var(--os-ivory-faint)' }}
                >
                  Xóa
                </button>
              </div>
              <p className="text-[13.5px] font-medium" style={{ color: 'var(--os-ivory-bright)' }}>
                {ev.summary}
              </p>
              {ev.snapshot && (
                <p
                  className="text-[12.5px] p-2.5 rounded-[7px] whitespace-pre-wrap"
                  style={{ backgroundColor: '#101114', color: 'var(--os-ivory-muted)' }}
                >
                  {ev.snapshot}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
