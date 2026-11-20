import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import {
  compressImageFile,
  saveMediaLocalAndMaybeUpload,
  isCloudinaryConfigured,
} from '../../lib/media';
import type { Book, BookQuote } from '../../types';
import { ResolvedImage } from '../../components/ImageGallery';
import {
  Card,
  EmptyState,
  IOSListGroup,
  Modal,
  ProgressBar,
  SegmentedControl,
  useToast,
} from '../../components/ui/Primitives';
import { SFChevronBack, SFChevronRight } from '../../components/ui/SFSymbols';

export function Bookshelf() {
  const { showToast } = useToast();
  const books = useLiveQuery(() => db.books.orderBy('updatedAt').reverse().toArray()) || [];

  const [filter, setFilter] = useState<'reading' | 'unread' | 'finished'>('reading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pickedBook, setPickedBook] = useState<Book | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Tâm lý / Tư duy');
  const [totalPages, setTotalPages] = useState(250);
  const [status, setStatus] = useState<Book['status']>('unread');
  const [whyBought, setWhyBought] = useState('');

  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const quoteFileRef = useRef<HTMLInputElement>(null);
  const quoteCameraRef = useRef<HTMLInputElement>(null);

  const selected = books.find((b) => b.id === selectedId) || null;
  const readingBooks = books.filter((b) => b.status === 'reading');
  const unreadBooks = books.filter((b) => b.status === 'unread');
  const finishedBooks = books.filter((b) => b.status === 'finished');

  const addPages = async (book: Book, delta: number) => {
    triggerHaptic('light');
    const nextPage = Math.max(0, Math.min(book.totalPages || 9999, book.currentPage + delta));
    const finished = book.totalPages > 0 && nextPage >= book.totalPages;
    await db.books.update(book.id, {
      currentPage: nextPage,
      status: finished ? 'finished' : 'reading',
      updatedAt: Date.now(),
    });
    const xp = delta >= 15 ? 25 : 15;
    await awardXp(xp);
    showToast(
      finished
        ? `Đọc xong "${book.title}" · +${xp} XP`
        : `+${delta} trang "${book.title}" · +${xp} XP`
    );
  };

  const handleRandomPick = () => {
    triggerHaptic('medium');
    const pool = unreadBooks.length > 0 ? unreadBooks : readingBooks;
    if (pool.length === 0) {
      showToast('Hãy thêm vài cuốn sách bạn đã mua vào kệ trước nhé!', 'info');
      return;
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setPickedBook(chosen);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const item: Book = {
      id: createId('bk'),
      title: title.trim(),
      author: author.trim() || 'Chưa rõ tác giả',
      category: category.trim() || 'Tổng hợp',
      status,
      totalPages: Math.max(10, Number(totalPages) || 200),
      currentPage: status === 'finished' ? Math.max(10, Number(totalPages) || 200) : 0,
      whyBought: whyBought.trim(),
      quotes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.books.put(item);
    setTitle('');
    setAuthor('');
    setWhyBought('');
    setAddOpen(false);
    setFilter(status);
    showToast('Đã xếp sách lên kệ');
  };

  const addQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || (!quoteText.trim() && !quoteFile)) return;
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
        text: quoteText.trim() || (quoteFile ? `Ảnh chụp trang sách ${quotePage.trim() || ''}`.trim() : ''),
        page: quotePage.trim(),
        imageMediaId,
        imageRemoteUrl,
        createdAt: Date.now(),
      };

      const nextQuotes = [newQuote, ...selected.quotes];
      await db.books.update(selected.id, { quotes: nextQuotes, updatedAt: Date.now() });
      await awardXp(15);
      setQuoteText('');
      setQuotePage('');
      setQuoteFile(null);
      showToast(
        uploadedToCloud
          ? 'Đã lưu trích dẫn & ảnh trang sách lên Cloudinary · +15 XP'
          : 'Đã lưu trích dẫn · +15 XP'
      );
    } finally {
      setSavingQuote(false);
    }
  };

  if (selected) {
    const pct = selected.totalPages > 0 ? Math.round((selected.currentPage / selected.totalPages) * 100) : 0;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1 text-[16px] font-medium ios-pressable cursor-pointer"
            style={{ color: 'var(--ios-blue)' }}
          >
            <SFChevronBack className="w-4 h-4" />
            Tủ sách
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('Xóa cuốn sách này khỏi kệ?')) return;
              await db.books.delete(selected.id);
              setSelectedId(null);
            }}
            className="text-[14px] font-medium cursor-pointer"
            style={{ color: 'var(--ios-red)' }}
          >
            Xóa
          </button>
        </div>

        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="ios-title-3">{selected.title}</h3>
              <p className="text-[13px] text-[var(--ios-label-secondary)] mt-0.5">
                {selected.author} · {selected.category}
              </p>
            </div>
            <select
              value={selected.status}
              onChange={(e) =>
                db.books.update(selected.id, {
                  status: e.target.value as Book['status'],
                  updatedAt: Date.now(),
                })
              }
              className="px-3 py-1.5 rounded-[10px] ios-fill text-[13px] font-medium"
            >
              <option value="unread">Chưa đọc</option>
              <option value="reading">Đang đọc</option>
              <option value="finished">Đã xong</option>
            </select>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[13px] tabular-nums">
              <span className="font-medium">
                Trang {selected.currentPage} / {selected.totalPages}
              </span>
              <span
                className="font-semibold"
                style={{ color: selected.status === 'finished' ? 'var(--ios-green)' : 'var(--ios-blue)' }}
              >
                {pct}%
              </span>
            </div>
            <ProgressBar
              value={selected.currentPage}
              max={selected.totalPages}
              positive={selected.status === 'finished'}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => addPages(selected, 5)}
                className="px-3.5 py-1.5 rounded-full ios-fill text-[13px] font-medium ios-pressable cursor-pointer"
                style={{ color: 'var(--ios-blue)' }}
              >
                +5 trang
              </button>
              <button
                type="button"
                onClick={() => addPages(selected, 15)}
                className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer"
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                +15 trang (+25 XP)
              </button>
              <input
                type="number"
                min={0}
                max={selected.totalPages}
                value={selected.currentPage}
                onChange={(e) =>
                  db.books.update(selected.id, {
                    currentPage: Math.min(selected.totalPages, Math.max(0, Number(e.target.value) || 0)),
                    updatedAt: Date.now(),
                  })
                }
                className="w-20 px-2.5 py-1.5 rounded-[10px] ios-fill text-[13px] tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[var(--ios-label-secondary)]">
              Lý do hồi xưa bạn mua cuốn này
            </label>
            <textarea
              rows={2}
              value={selected.whyBought}
              onChange={(e) =>
                db.books.update(selected.id, { whyBought: e.target.value, updatedAt: Date.now() })
              }
              placeholder="Nhắc lại lý do bạn từng hứng thú mua nó..."
              className="w-full p-3 rounded-[10px] ios-fill text-[14px]"
            />
          </div>
        </Card>

        <IOSListGroup header={`Trích dẫn tâm đắc & Ảnh trang sách (${selected.quotes.length})`}>
          <form onSubmit={addQuote} className="p-4 space-y-3">
            <textarea
              rows={2}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Ghi lại câu văn hay hoặc chụp lại trang sách..."
              className="w-full p-3 rounded-[10px] ios-fill text-[14px]"
            />

            {quoteFile && (
              <div className="flex items-center justify-between px-3 py-2 rounded-[10px] ios-fill text-[12.5px]">
                <span style={{ color: 'var(--os-sage)' }}>
                  ✓ Đã chọn ảnh: {quoteFile.name}{' '}
                  {isCloudinaryConfigured() ? '(Tự động tải lên Cloudinary)' : '(Lưu cục bộ)'}
                </span>
                <button
                  type="button"
                  onClick={() => setQuoteFile(null)}
                  className="font-medium cursor-pointer"
                  style={{ color: 'var(--os-crimson)' }}
                >
                  Bỏ ảnh
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={quotePage}
                onChange={(e) => setQuotePage(e.target.value)}
                placeholder="Trang (vd: tr.42)"
                className="w-28 px-3 py-1.5 rounded-[10px] ios-fill text-[13px]"
              />

              <button
                type="button"
                onClick={() => quoteCameraRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full ios-fill text-[12.5px] font-medium cursor-pointer"
                style={{ color: 'var(--os-brass)' }}
              >
                Chụp trang sách
              </button>

              <button
                type="button"
                onClick={() => quoteFileRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full ios-fill text-[12.5px] font-medium cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                Chọn ảnh
              </button>

              <button
                type="submit"
                disabled={savingQuote}
                className="px-4 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                {savingQuote ? 'Đang lưu...' : '+ Lưu trích dẫn'}
              </button>

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
            </div>
          </form>

          {selected.quotes.map((q) => (
            <div key={q.id} className="px-4 py-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] leading-relaxed" style={{ color: 'var(--os-ivory-bright)' }}>
                    “{q.text}”
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {q.page && (
                      <span className="text-[12px] text-[var(--ios-label-secondary)]">— {q.page}</span>
                    )}
                    {q.imageRemoteUrl?.includes('cloudinary.com') && (
                      <a
                        href={q.imageRemoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="metadata text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'rgba(155, 170, 152, 0.14)',
                          color: 'var(--os-sage)',
                        }}
                      >
                        CLOUDINARY ↗
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    db.books.update(selected.id, {
                      quotes: selected.quotes.filter((x) => x.id !== q.id),
                      updatedAt: Date.now(),
                    })
                  }
                  className="text-[13px] font-medium cursor-pointer shrink-0"
                  style={{ color: 'var(--ios-red)' }}
                >
                  Xóa
                </button>
              </div>

              {(q.imageMediaId || q.imageRemoteUrl) && (
                <div className="rounded-[10px] overflow-hidden max-h-[300px] bg-black/25">
                  <ResolvedImage
                    mediaId={q.imageMediaId}
                    remoteUrl={q.imageRemoteUrl}
                    alt={q.text}
                    className="w-full h-full object-contain max-h-[300px]"
                  />
                </div>
              )}
            </div>
          ))}
        </IOSListGroup>
      </div>
    );
  }

  const displayed =
    filter === 'reading' ? readingBooks : filter === 'unread' ? unreadBooks : finishedBooks;

  return (
    <div className="space-y-5">
      {/* Borderless Summary Widget with Vertical Hairlines */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="ios-title-3">Tủ Sách</h3>
            <p className="text-[13px] text-[var(--ios-label-secondary)] mt-0.5">
              Đọc đều từng chút thay vì mua để trên kệ
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setAddOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer shrink-0"
            style={{ backgroundColor: 'var(--ios-blue)' }}
          >
            + Thêm sách
          </button>
        </div>

        <div className="grid grid-cols-3 pt-1">
          <div className="pr-3">
            <p className="text-[12px] text-[var(--ios-label-secondary)]">Chưa đọc</p>
            <p className="text-[24px] leading-[29px] font-bold tabular-nums mt-0.5">
              {unreadBooks.length}
            </p>
          </div>
          <div
            className="px-3"
            style={{
              borderLeft: '0.5px solid var(--ios-hairline)',
              borderRight: '0.5px solid var(--ios-hairline)',
            }}
          >
            <p className="text-[12px] text-[var(--ios-label-secondary)]">Đang đọc</p>
            <p
              className="text-[24px] leading-[29px] font-bold tabular-nums mt-0.5"
              style={{ color: 'var(--ios-blue)' }}
            >
              {readingBooks.length}
            </p>
          </div>
          <div className="pl-3">
            <p className="text-[12px] text-[var(--ios-label-secondary)]">Đã xong</p>
            <p
              className="text-[24px] leading-[29px] font-bold tabular-nums mt-0.5"
              style={{ color: 'var(--ios-green)' }}
            >
              {finishedBooks.length}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRandomPick}
          className="w-full py-2.5 rounded-[12px] ios-fill text-[14px] font-semibold ios-pressable cursor-pointer"
          style={{ color: 'var(--ios-blue)' }}
        >
          Bốc ngẫu nhiên 1 cuốn để đọc 10 trang
        </button>

        {pickedBook && (
          <div className="p-3.5 rounded-[12px] ios-fill space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--ios-blue)' }}>
                Sách được chọn hôm nay
              </span>
              <button
                type="button"
                onClick={() => setPickedBook(null)}
                className="text-[12px] text-[var(--ios-label-secondary)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
            <p className="text-[16px] font-semibold">{pickedBook.title}</p>
            {pickedBook.whyBought && (
              <p className="text-[13px] text-[var(--ios-label-secondary)] italic">
                “{pickedBook.whyBought}”
              </p>
            )}
            <button
              type="button"
              onClick={async () => {
                await db.books.update(pickedBook.id, { status: 'reading', updatedAt: Date.now() });
                setSelectedId(pickedBook.id);
                setPickedBook(null);
                showToast(`Bắt đầu đọc "${pickedBook.title}"`);
              }}
              className="px-4 py-1.5 rounded-full text-white text-[13px] font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--ios-green)' }}
            >
              Mở ra đọc ngay →
            </button>
          </div>
        )}
      </Card>

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'reading', label: 'Đang đọc', badge: readingBooks.length },
          { value: 'unread', label: 'Chưa đọc', badge: unreadBooks.length },
          { value: 'finished', label: 'Đã xong', badge: finishedBooks.length },
        ]}
      />

      {displayed.length === 0 ? (
        <EmptyState
          title="Kệ này đang trống"
          subtitle="Nhập những cuốn sách bạn đã mua để theo dõi tiến độ đọc từng chút mỗi ngày."
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="px-4 py-2 rounded-full text-white text-[14px] font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              + Thêm cuốn sách đầu tiên
            </button>
          }
        />
      ) : (
        <IOSListGroup header={`Danh sách (${displayed.length})`}>
          {displayed.map((b) => {
            const pct = b.totalPages > 0 ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
            return (
              <div key={b.id} className="px-4 py-3.5 space-y-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedId(b.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(b.id);
                    }
                  }}
                  className="flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] leading-[22px] font-semibold">{b.title}</p>
                    <p className="text-[13px] text-[var(--ios-label-secondary)] mt-0.5">
                      {b.author} · {b.currentPage}/{b.totalPages} trang
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <span
                      className="text-[14px] font-medium tabular-nums"
                      style={{ color: b.status === 'finished' ? 'var(--ios-green)' : 'var(--ios-blue)' }}
                    >
                      {b.status === 'finished' ? 'Xong' : `${pct}%`}
                    </span>
                    <SFChevronRight className="w-4 h-4 text-[var(--ios-label-tertiary)]" />
                  </div>
                </div>

                <ProgressBar
                  value={b.currentPage}
                  max={b.totalPages}
                  positive={b.status === 'finished'}
                />

                {b.status !== 'finished' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => addPages(b, 10)}
                      className="text-[13px] font-medium cursor-pointer"
                      style={{ color: 'var(--ios-blue)' }}
                    >
                      +10 trang
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </IOSListGroup>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm Sách">
        <form onSubmit={handleAddBook} className="space-y-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên sách..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[15px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Tác giả"
              className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Thể loại"
              className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={10}
              value={totalPages}
              onChange={(e) => setTotalPages(Number(e.target.value))}
              placeholder="Tổng số trang"
              className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px] tabular-nums"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Book['status'])}
              className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px]"
            >
              <option value="unread">Đã mua — Chưa đọc</option>
              <option value="reading">Đang đọc</option>
              <option value="finished">Đã đọc xong</option>
            </select>
          </div>
          <textarea
            rows={2}
            value={whyBought}
            onChange={(e) => setWhyBought(e.target.value)}
            placeholder="Lý do bạn từng mua cuốn này..."
            className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-[12px] text-white text-[15px] font-semibold ios-pressable cursor-pointer"
            style={{ backgroundColor: 'var(--ios-blue)' }}
          >
            Xếp lên kệ
          </button>
        </form>
      </Modal>
    </div>
  );
}
