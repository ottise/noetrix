import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createId } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/i18n';
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
  useRoomBack,
  useToast,
} from '../../components/ui/Primitives';
import { SFChevronRight } from '../../components/ui/SFSymbols';
import { ReadingRoomSanctuary } from './ReadingRoomSanctuary';

export function Bookshelf() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const books = useLiveQuery(() => db.books.orderBy('updatedAt').reverse().toArray()) || [];

  const [filter, setFilter] = useState<'reading' | 'unread' | 'finished'>('reading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readingRoomOpen, setReadingRoomOpen] = useState(false);

  useRoomBack(Boolean(selectedId) && !readingRoomOpen, () => setSelectedId(null));
  const [readingBookId, setReadingBookId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState<Book | null>(null);
  const [pickedBook, setPickedBook] = useState<Book | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(t('Psychology / Mindset', 'Tâm lý / Tư duy'));
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

  const activeRoomBook =
    books.find((b) => b.id === readingBookId) ||
    selected ||
    readingBooks[0] ||
    unreadBooks[0] ||
    books[0] ||
    null;

  const enterReadingRoom = (book?: Book | null) => {
    triggerHaptic('selection');
    const target = book || activeRoomBook;
    if (target) {
      setReadingBookId(target.id);
    }
    setReadingRoomOpen(true);
  };

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
        ? t(`Finished "${book.title}"`, `Đọc xong "${book.title}"`)
        : t(`+${delta} pages in "${book.title}"`, `+${delta} trang "${book.title}"`)
    );
  };

  const handleRandomPick = () => {
    triggerHaptic('medium');
    const pool = unreadBooks.length > 0 ? unreadBooks : readingBooks;
    if (pool.length === 0) {
      showToast(
        t('Add a few books to your shelf first!', 'Hãy thêm vài cuốn sách bạn đã mua vào kệ trước nhé!'),
        'info'
      );
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
      author: author.trim() || t('Unknown Author', 'Chưa rõ tác giả'),
      category: category.trim() || t('General', 'Tổng hợp'),
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
    showToast(t('Added book to shelf', 'Đã xếp sách lên kệ'));
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
          ? t('Saved quote & page image to Cloudinary', 'Đã lưu trích dẫn & ảnh trang sách lên Cloudinary')
          : t('Saved quote', 'Đã lưu trích dẫn')
      );
    } finally {
      setSavingQuote(false);
    }
  };

  const addBookModal = (
    <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('Add Book', 'Thêm Sách')}>
      <form onSubmit={handleAddBook} className="space-y-3">
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('Book title...', 'Tên sách...')}
          className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[15px]"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t('Author', 'Tác giả')}
            className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px]"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t('Category', 'Thể loại')}
            className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={10}
            value={totalPages}
            onChange={(e) => setTotalPages(Number(e.target.value))}
            placeholder={t('Total pages', 'Tổng số trang')}
            className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px] tabular-nums"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Book['status'])}
            className="px-3 py-2.5 rounded-[10px] ios-fill text-[14px]"
          >
            <option value="unread">{t('Owned — Unread', 'Đã mua — Chưa đọc')}</option>
            <option value="reading">{t('Currently Reading', 'Đang đọc')}</option>
            <option value="finished">{t('Finished', 'Đã đọc xong')}</option>
          </select>
        </div>
        <textarea
          rows={2}
          value={whyBought}
          onChange={(e) => setWhyBought(e.target.value)}
          placeholder={t('Why you bought this book...', 'Lý do bạn từng mua cuốn này...')}
          className="w-full px-3.5 py-2.5 rounded-[10px] ios-fill text-[14px]"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-[12px] text-white text-[15px] font-semibold ios-pressable cursor-pointer"
          style={{ backgroundColor: 'var(--ios-blue)' }}
        >
          {t('Place on Shelf', 'Xếp lên kệ')}
        </button>
      </form>
    </Modal>
  );

  if (readingRoomOpen) {
    return (
      <>
        <ReadingRoomSanctuary
          books={books}
          activeBook={activeRoomBook}
          onSelectBookId={(id) => setReadingBookId(id)}
          onAddPages={addPages}
          onCloseRoom={() => setReadingRoomOpen(false)}
          onOpenAddBook={() => setAddOpen(true)}
        />
        {addBookModal}
      </>
    );
  }

  if (selected) {
    const pct = selected.totalPages > 0 ? Math.round((selected.currentPage / selected.totalPages) * 100) : 0;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => enterReadingRoom(selected)}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer"
              style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
            >
              {t('Enter Reading Room', 'Mở Phòng Đọc Sách')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteBook(selected)}
              className="text-[14px] font-medium cursor-pointer"
              style={{ color: 'var(--ios-red)' }}
            >
              {t('Delete', 'Xóa')}
            </button>
          </div>
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
              <option value="unread">{t('Unread', 'Chưa đọc')}</option>
              <option value="reading">{t('Reading', 'Đang đọc')}</option>
              <option value="finished">{t('Finished', 'Đã xong')}</option>
            </select>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[13px] tabular-nums">
              <span className="font-medium">
                {t('Page', 'Trang')} {selected.currentPage} / {selected.totalPages}
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
                {t('+5 pages', '+5 trang')}
              </button>
              <button
                type="button"
                onClick={() => addPages(selected, 15)}
                className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer"
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                {t('+15 pages', '+15 trang')}
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
              {t('Why you bought this book', 'Lý do hồi xưa bạn mua cuốn này')}
            </label>
            <textarea
              rows={2}
              value={selected.whyBought}
              onChange={(e) =>
                db.books.update(selected.id, { whyBought: e.target.value, updatedAt: Date.now() })
              }
              placeholder={t('Remind yourself what drew you to this book...', 'Nhắc lại lý do bạn từng hứng thú mua nó...')}
              className="w-full p-3 rounded-[10px] ios-fill text-[14px]"
            />
          </div>
        </Card>

        <IOSListGroup
          header={t(
            `Favorite Quotes & Book Pages (${selected.quotes.length})`,
            `Trích dẫn tâm đắc & Ảnh trang sách (${selected.quotes.length})`
          )}
        >
          <form onSubmit={addQuote} className="p-4 space-y-3">
            <textarea
              rows={2}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder={t('Write a memorable quote or attach a page photo...', 'Ghi lại câu văn hay hoặc chụp lại trang sách...')}
              className="w-full p-3 rounded-[10px] ios-fill text-[14px]"
            />

            {quoteFile && (
              <div className="flex items-center justify-between px-3 py-2 rounded-[10px] ios-fill text-[12.5px]">
                <span style={{ color: 'var(--os-sage)' }}>
                  ✓ {t('Selected:', 'Đã chọn ảnh:')} {quoteFile.name}{' '}
                  {isCloudinaryConfigured()
                    ? t('(Auto-upload to Cloudinary)', '(Tự động tải lên Cloudinary)')
                    : t('(Local storage)', '(Lưu cục bộ)')}
                </span>
                <button
                  type="button"
                  onClick={() => setQuoteFile(null)}
                  className="font-medium cursor-pointer"
                  style={{ color: 'var(--os-crimson)' }}
                >
                  {t('Remove', 'Bỏ ảnh')}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={quotePage}
                onChange={(e) => setQuotePage(e.target.value)}
                placeholder={t('Page (e.g. p.42)', 'Trang (vd: tr.42)')}
                className="w-28 px-3 py-1.5 rounded-[10px] ios-fill text-[13px]"
              />

              <button
                type="button"
                onClick={() => quoteCameraRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full ios-fill text-[12.5px] font-medium cursor-pointer"
                style={{ color: 'var(--os-brass)' }}
              >
                {t('Capture Page', 'Chụp trang sách')}
              </button>

              <button
                type="button"
                onClick={() => quoteFileRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full ios-fill text-[12.5px] font-medium cursor-pointer"
                style={{ color: 'var(--os-dusty-blue)' }}
              >
                {t('Choose Photo', 'Chọn ảnh')}
              </button>

              <button
                type="submit"
                disabled={savingQuote}
                className="px-4 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                {savingQuote ? t('Saving...', 'Đang lưu...') : t('+ Save Quote', '+ Lưu trích dẫn')}
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
                  {t('Delete', 'Xóa')}
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

        <Modal
          open={confirmDeleteBook !== null}
          onClose={() => setConfirmDeleteBook(null)}
          title={t('Remove Book', 'Xóa Sách')}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <p className="text-[14px] text-[var(--ios-label-secondary)] leading-relaxed">
              {t(
                `Remove "${confirmDeleteBook?.title || ''}" from your shelf?`,
                `Bạn có chắc muốn xóa "${confirmDeleteBook?.title || ''}" khỏi kệ sách?`
              )}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteBook(null)}
                className="px-4 py-2 rounded-[10px] ios-fill text-[13.5px] font-medium cursor-pointer"
              >
                {t('Cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirmDeleteBook) return;
                  await db.books.delete(confirmDeleteBook.id);
                  setConfirmDeleteBook(null);
                  setSelectedId(null);
                  showToast(t('Removed book from shelf', 'Đã xóa sách khỏi kệ'), 'info');
                }}
                className="px-4 py-2 rounded-[10px] text-[13.5px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--ios-red)' }}
              >
                {t('Delete', 'Xóa')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  const displayed =
    filter === 'reading' ? readingBooks : filter === 'unread' ? unreadBooks : finishedBooks;

  return (
    <div className="space-y-5">
      {/* ================================================================
          READING ROOM HERO BANNER WITH "ENTER READING ROOM" LAUNCHER
          ================================================================ */}
      <div
        className="relative rounded-[14px] overflow-hidden grid grid-cols-1 md:grid-cols-12 items-center"
        style={{ backgroundColor: 'var(--os-graphite)', border: '1px solid var(--os-border)' }}
      >
        <div className="md:col-span-4 h-36 md:h-44 relative">
          <img
            src="/art/room-library.jpg"
            alt="The Library Reading Room"
            className="w-full h-full object-cover"
          />
          <div
            className="hidden md:block absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(16,17,20,0) 40%, var(--os-graphite) 100%)',
            }}
          />
        </div>
        <div className="md:col-span-8 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.015em]" style={{ color: 'var(--os-ivory-bright)' }}>
              {t('Bookshelf & Reading Sanctuary', 'Kệ Sách & Không Gian Đọc Tập Trung')}
            </h2>
            <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: 'var(--os-ivory-muted)' }}>
              {t(
                'Open the dedicated Reading Room with ambient rain/hearth soundscapes, PDF & text reader, reading timer, and marginalia quotes.',
                'Mở rộng không gian Phòng Đọc Sách với âm thanh mưa/lò sưởi, bàn đọc file PDF/văn bản, đồng hồ đọc sâu và sổ trích dẫn bên lề.'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => enterReadingRoom()}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-semibold shrink-0 cursor-pointer transition-transform hover:scale-[1.02] shadow-lg"
            style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
          >
            {t('Enter Reading Room', 'Mở Phòng Đọc Sách')}
          </button>
        </div>
      </div>

      {/* Borderless Summary Widget with Vertical Hairlines */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="ios-title-3">{t('Bookshelf', 'Tủ Sách')}</h3>
            <p className="text-[13px] text-[var(--ios-label-secondary)] mt-0.5">
              {t(
                'Read steadily a few pages each day rather than letting books collect dust.',
                'Đọc đều từng chút thay vì mua để trên kệ'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => enterReadingRoom()}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer border border-[#cba86a]/50 text-[#cba86a] hover:bg-[#cba86a]/10"
            >
              {t('Open Reading Space', 'Mở Không Gian Đọc')}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setAddOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium ios-pressable cursor-pointer"
              style={{ backgroundColor: 'var(--ios-blue)' }}
            >
              {t('+ Add Book', '+ Thêm sách')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 pt-1">
          <div className="pr-3">
            <p className="text-[12px] text-[var(--ios-label-secondary)]">{t('Unread', 'Chưa đọc')}</p>
            <p className="text-[20px] leading-tight font-semibold tabular-nums mt-0.5">
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
            <p className="text-[12px] text-[var(--ios-label-secondary)]">{t('Reading', 'Đang đọc')}</p>
            <p
              className="text-[20px] leading-tight font-semibold tabular-nums mt-0.5"
              style={{ color: 'var(--ios-blue)' }}
            >
              {readingBooks.length}
            </p>
          </div>
          <div className="pl-3">
            <p className="text-[12px] text-[var(--ios-label-secondary)]">{t('Finished', 'Đã xong')}</p>
            <p
              className="text-[20px] leading-tight font-semibold tabular-nums mt-0.5"
              style={{ color: 'var(--ios-green)' }}
            >
              {finishedBooks.length}
            </p>
          </div>
        </div>
      </Card>

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'reading', label: t('Reading', 'Đang đọc'), badge: readingBooks.length },
          { value: 'unread', label: t('Unread', 'Chưa đọc'), badge: unreadBooks.length },
          { value: 'finished', label: t('Finished', 'Đã xong'), badge: finishedBooks.length },
        ]}
      />

      {displayed.length === 0 ? (
        <EmptyState
          title={t('This shelf is currently empty', 'Kệ này đang trống')}
          subtitle={
            filter === 'reading' && unreadBooks.length > 0
              ? t(
                  `You have ${unreadBooks.length} unread book(s) waiting. Open the Reading Room or switch to Unread to start one!`,
                  `Bạn đang có ${unreadBooks.length} cuốn ở mục Chưa đọc. Bấm Mở Phòng Đọc Sách để bắt đầu đọc ngay!`
                )
              : t(
                  'Add books you own to track your reading progress a few pages every day.',
                  'Nhập những cuốn sách bạn đã mua để theo dõi tiến độ đọc từng chút mỗi ngày.'
                )
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {books.length > 0 && (
                <button
                  type="button"
                  onClick={() => enterReadingRoom()}
                  className="px-4 py-2 rounded-full text-[13.5px] font-semibold cursor-pointer"
                  style={{ backgroundColor: '#cba86a', color: '#0c0f13' }}
                >
                  {t('Enter Reading Room', 'Mở Phòng Đọc Sách')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="px-4 py-2 rounded-full text-white text-[13.5px] font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--ios-blue)' }}
              >
                {t('+ Add New Book', '+ Thêm sách mới')}
              </button>
            </div>
          }
        />
      ) : (
        <IOSListGroup header={t(`Books (${displayed.length})`, `Danh sách (${displayed.length})`)}>
          {displayed.map((b) => {
            const pct = b.totalPages > 0 ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
            return (
              <div key={b.id} className="px-4 py-3.5 space-y-2.5">
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
                      {b.author} · {b.currentPage}/{b.totalPages} {t('pages', 'trang')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <span
                      className="text-[14px] font-medium tabular-nums"
                      style={{ color: b.status === 'finished' ? 'var(--ios-green)' : 'var(--ios-blue)' }}
                    >
                      {b.status === 'finished' ? t('Done', 'Xong') : `${pct}%`}
                    </span>
                    <SFChevronRight className="w-4 h-4 text-[var(--ios-label-tertiary)]" />
                  </div>
                </div>

                <ProgressBar
                  value={b.currentPage}
                  max={b.totalPages}
                  positive={b.status === 'finished'}
                />

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => enterReadingRoom(b)}
                    className="px-3 py-1 rounded-lg text-[12px] font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(203, 168, 106, 0.14)',
                      color: '#cba86a',
                      border: '1px solid rgba(203, 168, 106, 0.35)',
                    }}
                  >
                    {t('Enter Reading Room', 'Mở Phòng Đọc')}
                  </button>

                  {b.status !== 'finished' && (
                    <button
                      type="button"
                      onClick={() => addPages(b, 10)}
                      className="text-[13px] font-medium cursor-pointer"
                      style={{ color: 'var(--ios-blue)' }}
                    >
                      {t('+10 pages', '+10 trang')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </IOSListGroup>
      )}

      {addBookModal}
    </div>
  );
}
