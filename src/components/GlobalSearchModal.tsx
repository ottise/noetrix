import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useLanguage } from '../lib/i18n';
import type { WorkspaceId } from '../types';
import { IOSListGroup, Modal } from './ui/Primitives';
import { SFChevronRight } from './ui/SFSymbols';

interface SearchHit {
  id: string;
  domain: string;
  title: string;
  subtitle: string;
  workspace: WorkspaceId;
  sub?: string;
}

export function GlobalSearchModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (workspace: WorkspaceId, sub?: string) => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const tasks = useLiveQuery(() => db.tasks.toArray(), [open]) || [];
  const lectures = useLiveQuery(() => db.workflowLectures.toArray(), [open]) || [];
  const psych = useLiveQuery(() => db.psychologyPosts.toArray(), [open]) || [];
  const topics = useLiveQuery(() => db.codeTopics.toArray(), [open]) || [];
  const chess = useLiveQuery(() => db.chessModules.toArray(), [open]) || [];
  const sudoku = useLiveQuery(() => db.sudokuTechniques.toArray(), [open]) || [];
  const books = useLiveQuery(() => db.books.toArray(), [open]) || [];
  const stories = useLiveQuery(() => db.stories.toArray(), [open]) || [];

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    const hits: SearchHit[] = [];

    for (const tk of tasks) {
      if (!q || tk.title.toLowerCase().includes(q) || tk.description.toLowerCase().includes(q)) {
        hits.push({
          id: tk.id,
          domain: t('Task', 'Công việc'),
          title: tk.title,
          subtitle: tk.isTodayFocus ? t('Today’s Focus', 'Trọng tâm hôm nay') : tk.status,
          workspace: 'home',
        });
      }
    }
    for (const l of lectures) {
      if (
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.docVi.toLowerCase().includes(q) ||
        l.docEn.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q) ||
        l.tags.some((tg) => tg.toLowerCase().includes(q))
      ) {
        hits.push({
          id: l.id,
          domain: t('Workflow Vault', 'AI Workflow Studio'),
          title: l.title,
          subtitle: `${l.images.length} ${t('images', 'ảnh')} · ${l.audios.length} audio`,
          workspace: 'creative',
          sub: 'lectures',
        });
      }
    }
    for (const p of psych) {
      if (
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.behaviorConcept.toLowerCase().includes(q) ||
        p.rawVi.toLowerCase().includes(q)
      ) {
        hits.push({
          id: p.id,
          domain: t('Psychology Research', 'Nghiên cứu Tâm lý'),
          title: p.title,
          subtitle: p.behaviorConcept || p.status,
          workspace: 'creative',
          sub: 'psychology',
        });
      }
    }
    for (const c of topics) {
      if (!q || c.title.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q)) {
        hits.push({
          id: c.id,
          domain: 'Code Core',
          title: c.title,
          subtitle: c.pillar,
          workspace: 'learning',
          sub: 'code',
        });
      }
    }
    for (const ch of chess) {
      if (!q || ch.title.toLowerCase().includes(q) || ch.notes.toLowerCase().includes(q)) {
        hits.push({
          id: ch.id,
          domain: t('Chess Room', 'Cờ Vua'),
          title: ch.title,
          subtitle: ch.phaseTitle,
          workspace: 'learning',
          sub: 'chess',
        });
      }
    }
    for (const sd of sudoku) {
      if (!q || sd.name.toLowerCase().includes(q) || sd.summary.toLowerCase().includes(q)) {
        hits.push({
          id: sd.id,
          domain: 'Sudoku Logic',
          title: sd.name,
          subtitle: sd.tier,
          workspace: 'playground',
          sub: 'sudoku',
        });
      }
    }
    for (const b of books) {
      if (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) {
        hits.push({
          id: b.id,
          domain: t('Bookshelf', 'Tủ Sách'),
          title: b.title,
          subtitle: `${b.author} · ${b.currentPage}/${b.totalPages} ${t('pages', 'trang')}`,
          workspace: 'knowledge',
        });
      }
    }
    for (const s of stories) {
      if (!q || s.title.toLowerCase().includes(q) || s.synopsis.toLowerCase().includes(q)) {
        hits.push({
          id: s.id,
          domain: t('Writing Room', 'Viết Truyện'),
          title: s.title,
          subtitle: `${s.chapters.length} ${t('chapters', 'chương')}`,
          workspace: 'creative',
          sub: 'stories',
        });
      }
    }

    return hits.slice(0, 24);
  }, [query, tasks, lectures, psych, topics, chess, sudoku, books, stories, t]);

  return (
    <Modal open={open} onClose={onClose} title={t('Command Palette (Ctrl + K)', 'Tìm kiếm nhanh (Ctrl + K)')}>
      <div className="space-y-4">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            'Search tasks, lectures, psychology research, code, books, stories...',
            'Tìm task, bài giảng workflow, bài tâm lý, code, sách, truyện...'
          )}
          className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[15px] placeholder:text-[var(--ios-label-tertiary)]"
        />

        {results.length === 0 ? (
          <p className="text-[14px] text-center text-[var(--ios-label-secondary)] py-6">
            {t(`No results matching “${query}”.`, `Không tìm thấy kết quả khớp với “${query}”.`)}
          </p>
        ) : (
          <IOSListGroup
            header={
              query.trim()
                ? t(`Results (${results.length})`, `Kết quả (${results.length})`)
                : t('Recently accessed', 'Truy cập gần đây')
            }
          >
            {results.map((hit) => (
              <button
                key={`${hit.domain}_${hit.id}`}
                type="button"
                onClick={() => {
                  onSelect(hit.workspace, hit.sub);
                  setQuery('');
                  onClose();
                }}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left active:bg-[var(--ios-fill)] transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-blue)' }}>
                    {hit.domain}
                  </p>
                  <p className="text-[15px] font-semibold truncate mt-0.5">{hit.title}</p>
                  <p className="text-[12px] text-[var(--ios-label-secondary)] truncate">{hit.subtitle}</p>
                </div>
                <SFChevronRight className="w-4 h-4 text-[var(--ios-label-tertiary)] shrink-0" />
              </button>
            ))}
          </IOSListGroup>
        )}
      </div>
    </Modal>
  );
}
