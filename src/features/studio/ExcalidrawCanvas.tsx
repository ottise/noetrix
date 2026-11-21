import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createId } from '../../db/database';
import { awardXp } from '../../lib/gamification';
import { triggerHaptic } from '../../lib/haptics';
import { saveMediaLocalAndMaybeUpload } from '../../lib/media';
import { persistAllDataToSourceCode, scheduleSourceCodeSave } from '../../lib/sourceStore';
import { useToast } from '../../components/ui/Primitives';
import type { MediaAttachmentRef } from '../../types';

export const EXCALIDRAW_STORAGE_KEY = 'noetrix_excalidraw_boards_v1';

export type CanvasTool =
  | 'hand'
  | 'select'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'sticky'
  | 'eraser';

export type FillStyle = 'none' | 'tint' | 'hachure' | 'solid';
export type StrokeDash = 'solid' | 'dashed' | 'dotted';

export interface CanvasElement {
  id: string;
  type: 'rectangle' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'freedraw' | 'text' | 'sticky' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[];
  text: string;
  strokeColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeDash: StrokeDash;
  sketchy: boolean;
  fontSize: number;
  imageDataUrl?: string;
}

export interface WhiteboardFolder {
  id: string;
  name: string;
  color: string;
}

export interface WhiteboardScene {
  id: string;
  title: string;
  folderId?: string;
  elements: CanvasElement[];
  gridMode: 'dots' | 'grid' | 'none';
  updatedAt: number;
  lastSavedAt?: number;
}

interface PersistedWhiteboardState {
  activeBoardId: string;
  folders: WhiteboardFolder[];
  boards: WhiteboardScene[];
}

const STARTER_FOLDERS: WhiteboardFolder[] = [
  { id: 'fld_ai', name: 'AI & Systems', color: '#A7B6D2' },
  { id: 'fld_story', name: 'Story & Screenplay', color: '#B99B79' },
  { id: 'fld_code', name: 'Architecture & Code', color: '#9BAA98' },
  { id: 'fld_general', name: 'Phác thảo tự do', color: '#EDEAE2' },
];

const STROKE_COLORS = [
  { label: 'Ivory', value: '#EDEAE2' },
  { label: 'Antique Brass', value: '#B99B79' },
  { label: 'Dusty Blue', value: '#A7B6D2' },
  { label: 'Sage Green', value: '#9BAA98' },
  { label: 'Crimson', value: '#C27B76' },
  { label: 'Amber', value: '#E0A96D' },
  { label: 'Lavender', value: '#B39DDB' },
];

const TOOLS: {
  id: CanvasTool;
  shortcut: string;
  label: string;
}[] = [
  { id: 'hand', shortcut: 'H', label: 'Kéo bảng (Pan)' },
  { id: 'select', shortcut: '1', label: 'Chọn & Kéo thả (V/1)' },
  { id: 'rectangle', shortcut: '2', label: 'Hình chữ nhật (R/2)' },
  { id: 'diamond', shortcut: '3', label: 'Hình thoi / Điều kiện (D/3)' },
  { id: 'ellipse', shortcut: '4', label: 'Hình tròn / Elip (O/4)' },
  { id: 'arrow', shortcut: '5', label: 'Mũi tên luồng (A/5)' },
  { id: 'line', shortcut: '6', label: 'Đường thẳng (L/6)' },
  { id: 'freedraw', shortcut: '7', label: 'Bút vẽ tự do (P/7)' },
  { id: 'text', shortcut: '8', label: 'Văn bản (T/8)' },
  { id: 'sticky', shortcut: '9', label: 'Thẻ Sticky Note (N/9)' },
  { id: 'eraser', shortcut: '0', label: 'Tẩy xóa (E/0)' },
];

function ToolSvgIcon({ id }: { id: CanvasTool }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'hand':
      return (
        <svg {...props}>
          <path d="M18 11V6a2 2 0 0 0-4 0v5" />
          <path d="M14 10V4a2 2 0 0 0-4 0v6" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      );
    case 'select':
      return (
        <svg {...props}>
          <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
        </svg>
      );
    case 'rectangle':
      return (
        <svg {...props}>
          <rect x="4" y="5" width="16" height="14" rx="2.5" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...props}>
          <path d="M12 3l9 9-9 9-9-9z" />
        </svg>
      );
    case 'ellipse':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case 'line':
      return (
        <svg {...props}>
          <line x1="5" y1="19" x2="19" y2="5" />
        </svg>
      );
    case 'freedraw':
      return (
        <svg {...props}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      );
    case 'text':
      return (
        <svg {...props}>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case 'sticky':
      return (
        <svg {...props}>
          <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
          <path d="M15 3v4a2 2 0 0 0 2 2h4" />
        </svg>
      );
    case 'eraser':
      return (
        <svg {...props}>
          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
          <path d="M22 21H7" />
          <path d="m5 11 9 9" />
        </svg>
      );
  }
}

function buildStarterBoards(): PersistedWhiteboardState {
  const now = Date.now();

  const board1: WhiteboardScene = {
    id: 'wb_agent_workflow',
    title: '01 · Kiến trúc AI Agentic Workflow',
    folderId: 'fld_ai',
    gridMode: 'dots',
    updatedAt: now,
    lastSavedAt: now,
    elements: [
      {
        id: 'el_title_1',
        type: 'text',
        x: 90,
        y: 55,
        width: 440,
        height: 40,
        text: 'AGENTIC WORKFLOW PIPELINE · NOETRIX CANVAS',
        strokeColor: '#B99B79',
        fillStyle: 'none',
        strokeWidth: 2,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 18,
      },
      {
        id: 'el_in',
        type: 'rectangle',
        x: 80,
        y: 140,
        width: 175,
        height: 84,
        text: '1. User Trigger\n(Raw Input / Webhook)',
        strokeColor: '#EDEAE2',
        fillStyle: 'hachure',
        strokeWidth: 2,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 14,
      },
      {
        id: 'el_arr_1',
        type: 'arrow',
        x: 260,
        y: 182,
        width: 82,
        height: 0,
        text: '',
        strokeColor: '#B99B79',
        fillStyle: 'none',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 13,
      },
      {
        id: 'el_router',
        type: 'diamond',
        x: 348,
        y: 122,
        width: 192,
        height: 120,
        text: '2. Intent Router\n(Classify & Plan)',
        strokeColor: '#B99B79',
        fillStyle: 'tint',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 14,
      },
      {
        id: 'el_arr_2',
        type: 'arrow',
        x: 545,
        y: 182,
        width: 88,
        height: 0,
        text: 'Tool Call',
        strokeColor: '#A7B6D2',
        fillStyle: 'none',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 12,
      },
      {
        id: 'el_llm',
        type: 'rectangle',
        x: 638,
        y: 135,
        width: 215,
        height: 94,
        text: '3. LLM Reasoning\n+ Structured JSON Output',
        strokeColor: '#A7B6D2',
        fillStyle: 'hachure',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 14,
      },
      {
        id: 'el_mem',
        type: 'ellipse',
        x: 360,
        y: 315,
        width: 168,
        height: 82,
        text: 'Vector & Local DB\nMemory Store',
        strokeColor: '#9BAA98',
        fillStyle: 'tint',
        strokeWidth: 2,
        strokeDash: 'dashed',
        sketchy: true,
        fontSize: 13,
      },
      {
        id: 'el_arr_3',
        type: 'arrow',
        x: 444,
        y: 245,
        width: 0,
        height: 65,
        text: 'Context',
        strokeColor: '#9BAA98',
        fillStyle: 'none',
        strokeWidth: 2,
        strokeDash: 'dashed',
        sketchy: true,
        fontSize: 12,
      },
      {
        id: 'el_note_1',
        type: 'sticky',
        x: 642,
        y: 285,
        width: 220,
        height: 112,
        text: 'Ghi chú:\nNhấp đúp vào bất kỳ khối nào để sửa chữ. Kéo thả tự do hoặc xuất ảnh PNG / Cloudinary!',
        strokeColor: '#B99B79',
        fillStyle: 'solid',
        strokeWidth: 1.5,
        strokeDash: 'solid',
        sketchy: false,
        fontSize: 13,
      },
    ],
  };

  const board2: WhiteboardScene = {
    id: 'wb_story_map',
    title: '02 · Sơ đồ Nhân vật & Cốt truyện',
    folderId: 'fld_story',
    gridMode: 'dots',
    updatedAt: now - 3600 * 1000,
    lastSavedAt: now - 3600 * 1000,
    elements: [
      {
        id: 'st_1',
        type: 'rectangle',
        x: 120,
        y: 150,
        width: 185,
        height: 85,
        text: 'LÀNH (Người mẹ)\nBí mật đêm mưa 4 năm trước',
        strokeColor: '#B99B79',
        fillStyle: 'hachure',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 14,
      },
      {
        id: 'st_arr_1',
        type: 'arrow',
        x: 310,
        y: 192,
        width: 142,
        height: 0,
        text: 'Im lặng bảo bọc',
        strokeColor: '#C27B76',
        fillStyle: 'none',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 12,
      },
      {
        id: 'st_2',
        type: 'rectangle',
        x: 458,
        y: 150,
        width: 185,
        height: 85,
        text: 'ÚT (17 tuổi)\nGiữ tấm vé phà cũ',
        strokeColor: '#A7B6D2',
        fillStyle: 'hachure',
        strokeWidth: 2.5,
        strokeDash: 'solid',
        sketchy: true,
        fontSize: 14,
      },
    ],
  };

  return {
    activeBoardId: board1.id,
    folders: STARTER_FOLDERS,
    boards: [board1, board2],
  };
}

function loadWhiteboardState(): PersistedWhiteboardState {
  try {
    const raw = localStorage.getItem(EXCALIDRAW_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedWhiteboardState>;
      if (Array.isArray(parsed.boards) && parsed.boards.length > 0) {
        const folders =
          Array.isArray(parsed.folders) && parsed.folders.length > 0
            ? parsed.folders
            : STARTER_FOLDERS;
        const boards = parsed.boards.map((b) => ({
          ...b,
          folderId:
            b.folderId ||
            (b.id === 'wb_agent_workflow'
              ? 'fld_ai'
              : b.id === 'wb_story_map'
              ? 'fld_story'
              : 'fld_general'),
        }));
        return {
          activeBoardId: parsed.activeBoardId || boards[0].id,
          folders,
          boards,
        };
      }
    }
  } catch {
    // ignore corrupt JSON
  }
  return buildStarterBoards();
}

function getElementBounds(el: CanvasElement): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (el.type === 'freedraw' && el.points && el.points.length > 0) {
    const xs = el.points.map((p) => p.x);
    const ys = el.points.map((p) => p.y);
    return {
      minX: Math.min(...xs) - 6,
      minY: Math.min(...ys) - 6,
      maxX: Math.max(...xs) + 6,
      maxY: Math.max(...ys) + 6,
    };
  }
  const x1 = el.x;
  const y1 = el.y;
  const x2 = el.x + el.width;
  const y2 = el.y + el.height;
  return {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };
}

function isPointInsideElement(px: number, py: number, el: CanvasElement): boolean {
  if (el.type === 'arrow' || el.type === 'line') {
    const x1 = el.x;
    const y1 = el.y;
    const x2 = el.x + el.width;
    const y2 = el.y + el.height;
    const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1) <= 12;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY) <= 14;
  }
  const b = getElementBounds(el);
  return px >= b.minX - 6 && px <= b.maxX + 6 && py >= b.minY - 6 && py <= b.maxY + 6;
}

export function ExcalidrawCanvas({
  onSaveImageToArticle,
}: {
  onSaveImageToArticle?: (img: MediaAttachmentRef) => void;
} = {}) {
  const { showToast } = useToast();
  const [state, setState] = useState<PersistedWhiteboardState>(() => loadWhiteboardState());

  const activeBoard =
    state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];

  // Tool & Style state
  const [tool, setTool] = useState<CanvasTool>('select');
  const [lockTool, setLockTool] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // UI Visibility & Rename & Folders
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [folderSearch, setFolderSearch] = useState('');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingBoard, setRenamingBoard] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  // Default drawing styles
  const [strokeColor, setStrokeColor] = useState('#EDEAE2');
  const [fillStyle, setFillStyle] = useState<FillStyle>('hachure');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [strokeDash, setStrokeDash] = useState<StrokeDash>('solid');
  const [sketchy, setSketchy] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(15);

  // Infinite Canvas Viewport (Pan & Zoom)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [spacePressed, setSpacePressed] = useState<boolean>(false);
  const [uploadingCloud, setUploadingCloud] = useState<boolean>(false);

  // Undo / Redo Stacks per session
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);

  // Interaction State (Dragging, Resizing, Drawing, Panning)
  const interactionRef = useRef<{
    mode:
      | 'none'
      | 'panning'
      | 'moving'
      | 'resizing_se'
      | 'resizing_nw'
      | 'resizing_ne'
      | 'resizing_sw'
      | 'line_start'
      | 'line_end'
      | 'creating';
    startScreenX: number;
    startScreenY: number;
    startWorldX: number;
    startWorldY: number;
    initialPanX: number;
    initialPanY: number;
    elementId?: string;
    initialElement?: CanvasElement;
  }>({
    mode: 'none',
    startScreenX: 0,
    startScreenY: 0,
    startWorldX: 0,
    startWorldY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const fullscreenRootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importJsonRef = useRef<HTMLInputElement>(null);

  const selectedElement =
    activeBoard.elements.find((e) => e.id === selectedId) || null;

  // Auto-save to localStorage & `src/data/noetrix-store.json`
  useEffect(() => {
    try {
      localStorage.setItem(EXCALIDRAW_STORAGE_KEY, JSON.stringify(state));
      scheduleSourceCodeSave();
    } catch {
      // ignore
    }
  }, [state]);

  // Sync inspector controls when selecting an existing element
  useEffect(() => {
    if (selectedElement) {
      setStrokeColor(selectedElement.strokeColor);
      setFillStyle(selectedElement.fillStyle);
      setStrokeWidth(selectedElement.strokeWidth);
      setStrokeDash(selectedElement.strokeDash);
      setSketchy(selectedElement.sketchy);
      setFontSize(selectedElement.fontSize || 15);
    }
  }, [selectedElement?.id]);

  // Lock body scroll and sync native Fullscreen API safely when entering/leaving Zen Mode
  useEffect(() => {
    if (zenMode) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [zenMode]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && zenMode) {
        // User exited browser fullscreen via native Esc — keep portal sync intuitive
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [zenMode]);

  const toggleFullscreen = async () => {
    triggerHaptic('selection');
    const next = !zenMode;
    setZenMode(next);
    try {
      if (next) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Portal fullscreen works cleanly even if OS Fullscreen API is blocked
    }
  };

  const exitFullscreen = async () => {
    setZenMode(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const updateBoardElements = (
    nextElements: CanvasElement[] | ((curr: CanvasElement[]) => CanvasElement[]),
    recordHistory = true
  ) => {
    setState((prev) => {
      const board = prev.boards.find((b) => b.id === prev.activeBoardId) || prev.boards[0];
      const computed =
        typeof nextElements === 'function' ? nextElements(board.elements) : nextElements;
      if (recordHistory) {
        setUndoStack((u) => [...u.slice(-29), board.elements]);
        setRedoStack([]);
      }
      return {
        ...prev,
        boards: prev.boards.map((b) =>
          b.id === board.id
            ? { ...b, elements: computed, updatedAt: Date.now() }
            : b
        ),
      };
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, activeBoard.elements]);
    setUndoStack((u) => u.slice(0, -1));
    updateBoardElements(previous, false);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, activeBoard.elements]);
    setRedoStack((r) => r.slice(0, -1));
    updateBoardElements(next, false);
  };

  const startInlineEdit = (el: CanvasElement) => {
    setEditingId(el.id);
    setEditingText(el.text);
  };

  const commitInlineEdit = () => {
    if (!editingId) return;
    updateBoardElements((els) =>
      els.map((el) => (el.id === editingId ? { ...el, text: editingText } : el))
    );
    setEditingId(null);
  };

  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const copyId = createId('el');
    const copy: CanvasElement = {
      ...selectedElement,
      id: copyId,
      x: selectedElement.x + 28,
      y: selectedElement.y + 28,
      points: selectedElement.points?.map((p) => ({ x: p.x + 28, y: p.y + 28 })),
    };
    updateBoardElements((els) => [...els, copy]);
    setSelectedId(copyId);
    showToast('Đã nhân bản khối (Ctrl+D)');
  };

  // Keyboard shortcuts via latest ref so listener binds cleanly once
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    const tag = (document.activeElement?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editingId) {
      if (e.key === 'Escape') {
        if (editingId) commitInlineEdit();
        if (renamingBoard) setRenamingBoard(false);
      }
      return;
    }

    if (e.key === 'Escape') {
      if (selectedId) {
        setSelectedId(null);
        return;
      }
      if (zenMode) {
        e.preventDefault();
        exitFullscreen();
        return;
      }
    }

    if (e.code === 'Space') {
      e.preventDefault();
      setSpacePressed(true);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleManualSave();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) handleRedo();
      else handleUndo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedElement) {
      e.preventDefault();
      duplicateSelectedElement();
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      updateBoardElements((els) => els.filter((el) => el.id !== selectedId));
      setSelectedId(null);
      return;
    }

    if (e.key === 'Enter' && selectedElement) {
      e.preventDefault();
      startInlineEdit(selectedElement);
      return;
    }

    const k = e.key.toLowerCase();
    if (k === 'h') setTool('hand');
    else if (k === 'v' || k === '1') setTool('select');
    else if (k === 'r' || k === '2') setTool('rectangle');
    else if (k === 'd' || k === '3') setTool('diamond');
    else if (k === 'o' || k === '4') setTool('ellipse');
    else if (k === 'a' || k === '5') setTool('arrow');
    else if (k === 'l' || k === '6') setTool('line');
    else if (k === 'p' || k === '7') setTool('freedraw');
    else if (k === 't' || k === '8') setTool('text');
    else if (k === 'n' || k === '9') setTool('sticky');
    else if (k === 'e' || k === '0') setTool('eraser');
    else if (k === 'f') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keyHandlerRef.current(e);
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const insertImageFileOnCanvas = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const id = createId('img_el');
      const newEl: CanvasElement = {
        id,
        type: 'image',
        x: Math.round((280 - pan.x) / zoom),
        y: Math.round((140 - pan.y) / zoom),
        width: 280,
        height: 200,
        text: file.name,
        strokeColor: '#B99B79',
        fillStyle: 'none',
        strokeWidth: 2,
        strokeDash: 'solid',
        sketchy: false,
        fontSize: 13,
        imageDataUrl: dataUrl,
      };
      updateBoardElements((els) => [...els, newEl]);
      setSelectedId(id);
      setTool('select');
      showToast('Đã chèn ảnh lên bảng vẽ — Kéo góc để chỉnh kích thước');
    };
    reader.readAsDataURL(file);
  };

  // Support Ctrl+V image paste straight onto canvas
  const pasteRef = useRef<(e: ClipboardEvent) => void>(() => {});
  pasteRef.current = (e: ClipboardEvent) => {
    const tag = (document.activeElement?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          insertImageFileOnCanvas(file);
          break;
        }
      }
    }
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => pasteRef.current(e);
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const screenToWorld = (clientX: number, clientY: number): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: Math.round((sx - pan.x) / zoom),
      y: Math.round((sy - pan.y) / zoom),
    };
  };

  // =========================================================================
  // POINTER DOWN / MOVE / UP HANDLERS
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (editingId) {
      commitInlineEdit();
    }

    const world = screenToWorld(e.clientX, e.clientY);

    if (tool === 'hand' || spacePressed || e.button === 1) {
      interactionRef.current = {
        mode: 'panning',
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        startWorldX: world.x,
        startWorldY: world.y,
        initialPanX: pan.x,
        initialPanY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'eraser') {
      const hit = [...activeBoard.elements]
        .reverse()
        .find((el) => isPointInsideElement(world.x, world.y, el));
      if (hit) {
        triggerHaptic('light');
        updateBoardElements((els) => els.filter((el) => el.id !== hit.id));
        if (selectedId === hit.id) setSelectedId(null);
      }
      return;
    }

    if (tool === 'select') {
      if (selectedElement) {
        if (selectedElement.type === 'arrow' || selectedElement.type === 'line') {
          const sx = selectedElement.x;
          const sy = selectedElement.y;
          const ex = selectedElement.x + selectedElement.width;
          const ey = selectedElement.y + selectedElement.height;
          if (Math.hypot(world.x - sx, world.y - sy) <= 12) {
            interactionRef.current = {
              mode: 'line_start',
              startScreenX: e.clientX,
              startScreenY: e.clientY,
              startWorldX: world.x,
              startWorldY: world.y,
              initialPanX: pan.x,
              initialPanY: pan.y,
              elementId: selectedElement.id,
              initialElement: { ...selectedElement },
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          if (Math.hypot(world.x - ex, world.y - ey) <= 12) {
            interactionRef.current = {
              mode: 'line_end',
              startScreenX: e.clientX,
              startScreenY: e.clientY,
              startWorldX: world.x,
              startWorldY: world.y,
              initialPanX: pan.x,
              initialPanY: pan.y,
              elementId: selectedElement.id,
              initialElement: { ...selectedElement },
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
        } else if (selectedElement.type !== 'freedraw') {
          const b = getElementBounds(selectedElement);
          if (Math.hypot(world.x - b.maxX, world.y - b.maxY) <= 12) {
            interactionRef.current = {
              mode: 'resizing_se',
              startScreenX: e.clientX,
              startScreenY: e.clientY,
              startWorldX: world.x,
              startWorldY: world.y,
              initialPanX: pan.x,
              initialPanY: pan.y,
              elementId: selectedElement.id,
              initialElement: { ...selectedElement },
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          if (Math.hypot(world.x - b.minX, world.y - b.minY) <= 12) {
            interactionRef.current = {
              mode: 'resizing_nw',
              startScreenX: e.clientX,
              startScreenY: e.clientY,
              startWorldX: world.x,
              startWorldY: world.y,
              initialPanX: pan.x,
              initialPanY: pan.y,
              elementId: selectedElement.id,
              initialElement: { ...selectedElement },
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          if (Math.hypot(world.x - b.maxX, world.y - b.minY) <= 12) {
            interactionRef.current = {
              mode: 'resizing_ne',
              startScreenX: e.clientX,
              startScreenY: e.clientY,
              startWorldX: world.x,
              startWorldY: world.y,
              initialPanX: pan.x,
              initialPanY: pan.y,
              elementId: selectedElement.id,
              initialElement: { ...selectedElement },
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          if (Math.hypot(world.x - b.minX, world.y - b.maxY) <= 12) {
            interactionRef.current = {
              mode: 'resizing_sw',
              startScreenX: e.clientX,
              startScreenY: e.clientY,
              startWorldX: world.x,
              startWorldY: world.y,
              initialPanX: pan.x,
              initialPanY: pan.y,
              elementId: selectedElement.id,
              initialElement: { ...selectedElement },
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
        }
      }

      const hit = [...activeBoard.elements]
        .reverse()
        .find((el) => isPointInsideElement(world.x, world.y, el));

      if (hit) {
        setSelectedId(hit.id);
        setUndoStack((u) => [...u.slice(-29), activeBoard.elements]);
        interactionRef.current = {
          mode: 'moving',
          startScreenX: e.clientX,
          startScreenY: e.clientY,
          startWorldX: world.x,
          startWorldY: world.y,
          initialPanX: pan.x,
          initialPanY: pan.y,
          elementId: hit.id,
          initialElement: {
            ...hit,
            points: hit.points ? hit.points.map((p) => ({ ...p })) : undefined,
          },
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        setSelectedId(null);
      }
      return;
    }

    const newId = createId('el');
    if (tool === 'text' || tool === 'sticky') {
      const isSticky = tool === 'sticky';
      const created: CanvasElement = {
        id: newId,
        type: isSticky ? 'sticky' : 'text',
        x: world.x,
        y: world.y,
        width: isSticky ? 210 : 185,
        height: isSticky ? 115 : 44,
        text: isSticky ? 'Ghi chú mới...' : 'Văn bản mới',
        strokeColor,
        fillStyle: isSticky ? 'solid' : 'none',
        strokeWidth,
        strokeDash,
        sketchy,
        fontSize,
      };
      updateBoardElements((els) => [...els, created]);
      setSelectedId(newId);
      startInlineEdit(created);
      if (!lockTool) setTool('select');
      return;
    }

    const newElement: CanvasElement = {
      id: newId,
      type: tool as CanvasElement['type'],
      x: world.x,
      y: world.y,
      width: tool === 'freedraw' ? 0 : 4,
      height: tool === 'freedraw' ? 0 : 4,
      points: tool === 'freedraw' ? [{ x: world.x, y: world.y }] : undefined,
      text: '',
      strokeColor,
      fillStyle,
      strokeWidth,
      strokeDash,
      sketchy,
      fontSize,
    };

    updateBoardElements((els) => [...els, newElement]);
    setSelectedId(newId);

    interactionRef.current = {
      mode: 'creating',
      startScreenX: e.clientX,
      startScreenY: e.clientY,
      startWorldX: world.x,
      startWorldY: world.y,
      initialPanX: pan.x,
      initialPanY: pan.y,
      elementId: newId,
      initialElement: newElement,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const act = interactionRef.current;
    if (act.mode === 'none') return;

    if (act.mode === 'panning') {
      const dx = e.clientX - act.startScreenX;
      const dy = e.clientY - act.startScreenY;
      setPan({
        x: act.initialPanX + dx,
        y: act.initialPanY + dy,
      });
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY);
    const dx = world.x - act.startWorldX;
    const dy = world.y - act.startWorldY;

    if (act.mode === 'moving' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      updateBoardElements(
        (els) =>
          els.map((el) => {
            if (el.id !== act.elementId) return el;
            if (el.type === 'freedraw' && init.points) {
              return {
                ...el,
                points: init.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            }
            return {
              ...el,
              x: init.x + dx,
              y: init.y + dy,
            };
          }),
        false
      );
      return;
    }

    if (act.mode === 'resizing_se' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      updateBoardElements(
        (els) =>
          els.map((el) =>
            el.id === act.elementId
              ? {
                  ...el,
                  width: Math.max(30, init.width + dx),
                  height: Math.max(30, init.height + dy),
                }
              : el
          ),
        false
      );
      return;
    }

    if (act.mode === 'resizing_nw' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      const nw = Math.max(30, init.width - dx);
      const nh = Math.max(30, init.height - dy);
      updateBoardElements(
        (els) =>
          els.map((el) =>
            el.id === act.elementId
              ? {
                  ...el,
                  x: init.x + (init.width - nw),
                  y: init.y + (init.height - nh),
                  width: nw,
                  height: nh,
                }
              : el
          ),
        false
      );
      return;
    }

    if (act.mode === 'resizing_ne' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      const nw = Math.max(30, init.width + dx);
      const nh = Math.max(30, init.height - dy);
      updateBoardElements(
        (els) =>
          els.map((el) =>
            el.id === act.elementId
              ? {
                  ...el,
                  y: init.y + (init.height - nh),
                  width: nw,
                  height: nh,
                }
              : el
          ),
        false
      );
      return;
    }

    if (act.mode === 'resizing_sw' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      const nw = Math.max(30, init.width - dx);
      const nh = Math.max(30, init.height + dy);
      updateBoardElements(
        (els) =>
          els.map((el) =>
            el.id === act.elementId
              ? {
                  ...el,
                  x: init.x + (init.width - nw),
                  width: nw,
                  height: nh,
                }
              : el
          ),
        false
      );
      return;
    }

    if (act.mode === 'line_start' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      const endX = init.x + init.width;
      const endY = init.y + init.height;
      updateBoardElements(
        (els) =>
          els.map((el) =>
            el.id === act.elementId
              ? {
                  ...el,
                  x: world.x,
                  y: world.y,
                  width: endX - world.x,
                  height: endY - world.y,
                }
              : el
          ),
        false
      );
      return;
    }

    if (act.mode === 'line_end' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      updateBoardElements(
        (els) =>
          els.map((el) =>
            el.id === act.elementId
              ? {
                  ...el,
                  width: world.x - init.x,
                  height: world.y - init.y,
                }
              : el
          ),
        false
      );
      return;
    }

    if (act.mode === 'creating' && act.elementId && act.initialElement) {
      const init = act.initialElement;
      updateBoardElements(
        (els) =>
          els.map((el) => {
            if (el.id !== act.elementId) return el;
            if (el.type === 'freedraw') {
              return {
                ...el,
                points: [...(el.points || []), { x: world.x, y: world.y }],
              };
            }
            if (el.type === 'arrow' || el.type === 'line') {
              return {
                ...el,
                width: dx,
                height: dy,
              };
            }
            const nx = dx < 0 ? world.x : init.x;
            const ny = dy < 0 ? world.y : init.y;
            return {
              ...el,
              x: nx,
              y: ny,
              width: Math.max(16, Math.abs(dx)),
              height: Math.max(16, Math.abs(dy)),
            };
          }),
        false
      );
    }
  };

  const handlePointerUp = () => {
    const act = interactionRef.current;
    if (act.mode === 'creating' && act.elementId) {
      const created = activeBoard.elements.find((e) => e.id === act.elementId);
      if (
        created &&
        created.type !== 'freedraw' &&
        Math.abs(created.width) < 20 &&
        Math.abs(created.height) < 20
      ) {
        updateBoardElements(
          (els) =>
            els.map((el) =>
              el.id === created.id
                ? {
                    ...el,
                    width: el.type === 'arrow' || el.type === 'line' ? 120 : 170,
                    height: el.type === 'arrow' || el.type === 'line' ? 0 : 88,
                  }
                : el
            ),
          false
        );
      }
      if (!lockTool && tool !== 'freedraw') {
        setTool('select');
      }
    }
    interactionRef.current = {
      mode: 'none',
      startScreenX: 0,
      startScreenY: 0,
      startWorldX: 0,
      startWorldY: 0,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const hit = [...activeBoard.elements]
      .reverse()
      .find((el) => isPointInsideElement(world.x, world.y, el));
    if (hit && hit.type !== 'freedraw') {
      setSelectedId(hit.id);
      startInlineEdit(hit);
    } else {
      const newId = createId('el');
      const txtEl: CanvasElement = {
        id: newId,
        type: 'text',
        x: world.x,
        y: world.y,
        width: 185,
        height: 44,
        text: 'Văn bản mới',
        strokeColor,
        fillStyle: 'none',
        strokeWidth,
        strokeDash,
        sketchy,
        fontSize,
      };
      updateBoardElements((els) => [...els, txtEl]);
      setSelectedId(newId);
      startInlineEdit(txtEl);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((z) => Math.min(3, Math.max(0.25, Number((z * factor).toFixed(2)))));
    } else {
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  };

  // =========================================================================
  // QUICK STAMP TEMPLATES & BOARD MANAGEMENT
  // =========================================================================
  const stampWorkflowTemplate = () => {
    triggerHaptic('light');
    const ox = Math.round((240 - pan.x) / zoom);
    const oy = Math.round((150 - pan.y) / zoom);
    const n1: CanvasElement = {
      id: createId('el'),
      type: 'rectangle',
      x: ox,
      y: oy,
      width: 165,
      height: 80,
      text: 'Trigger / Input',
      strokeColor: '#EDEAE2',
      fillStyle: 'hachure',
      strokeWidth: 2,
      strokeDash: 'solid',
      sketchy: true,
      fontSize: 14,
    };
    const arr1: CanvasElement = {
      id: createId('el'),
      type: 'arrow',
      x: ox + 170,
      y: oy + 40,
      width: 85,
      height: 0,
      text: '',
      strokeColor: '#B99B79',
      fillStyle: 'none',
      strokeWidth: 2.5,
      strokeDash: 'solid',
      sketchy: true,
      fontSize: 12,
    };
    const n2: CanvasElement = {
      id: createId('el'),
      type: 'diamond',
      x: ox + 260,
      y: oy - 12,
      width: 175,
      height: 104,
      text: 'Decision / Router',
      strokeColor: '#B99B79',
      fillStyle: 'tint',
      strokeWidth: 2.5,
      strokeDash: 'solid',
      sketchy: true,
      fontSize: 14,
    };
    const arr2: CanvasElement = {
      id: createId('el'),
      type: 'arrow',
      x: ox + 440,
      y: oy + 40,
      width: 85,
      height: 0,
      text: '',
      strokeColor: '#A7B6D2',
      fillStyle: 'none',
      strokeWidth: 2.5,
      strokeDash: 'solid',
      sketchy: true,
      fontSize: 12,
    };
    const n3: CanvasElement = {
      id: createId('el'),
      type: 'rectangle',
      x: ox + 530,
      y: oy,
      width: 175,
      height: 80,
      text: 'Action / Output',
      strokeColor: '#9BAA98',
      fillStyle: 'hachure',
      strokeWidth: 2,
      strokeDash: 'solid',
      sketchy: true,
      fontSize: 14,
    };
    updateBoardElements((els) => [...els, n1, arr1, n2, arr2, n3]);
    showToast('Đã chèn mẫu luồng Workflow 3 bước');
  };

  const activeFolder =
    state.folders.find((f) => f.id === activeBoard.folderId) || state.folders[0];

  const handleManualSave = async (targetFolderId?: string) => {
    setSavingManual(true);
    triggerHaptic('light');
    const nowTs = Date.now();
    const resolvedFolderId = targetFolderId || activeBoard.folderId || state.folders[0]?.id || 'fld_general';
    const nextState: PersistedWhiteboardState = {
      ...state,
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? { ...b, folderId: resolvedFolderId, lastSavedAt: nowTs, updatedAt: nowTs }
          : b
      ),
    };
    setState(nextState);
    try {
      localStorage.setItem(EXCALIDRAW_STORAGE_KEY, JSON.stringify(nextState));
      await persistAllDataToSourceCode();
    } catch {
      // ignore
    } finally {
      setSavingManual(false);
    }
    const fName = state.folders.find((f) => f.id === resolvedFolderId)?.name || 'Kho lưu trữ';
    showToast(`Đã lưu “${activeBoard.title}” vào thư mục ${fName}`);
  };

  const createNewFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newFolderName.trim();
    if (!clean) return;
    triggerHaptic('light');
    const palette = ['#A7B6D2', '#B99B79', '#9BAA98', '#E0A96D', '#B39DDB'];
    const id = createId('fld');
    const folder: WhiteboardFolder = {
      id,
      name: clean,
      color: palette[state.folders.length % palette.length],
    };
    setState((prev) => ({ ...prev, folders: [...prev.folders, folder] }));
    setSelectedFolderId(id);
    setNewFolderName('');
    setNewFolderOpen(false);
    showToast(`Đã tạo thư mục “${clean}”`);
  };

  const deleteFolder = (folderId: string) => {
    if (state.folders.length <= 1) return;
    const fallbackId = state.folders.find((f) => f.id !== folderId)?.id || 'fld_general';
    setState((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== folderId),
      boards: prev.boards.map((b) =>
        b.folderId === folderId ? { ...b, folderId: fallbackId } : b
      ),
    }));
    if (selectedFolderId === folderId) setSelectedFolderId('all');
    showToast('Đã xóa thư mục (các bảng vẽ được chuyển sang thư mục mặc định)');
  };

  const moveBoardToFolder = (boardId: string, folderId: string) => {
    triggerHaptic('selection');
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) =>
        b.id === boardId ? { ...b, folderId, updatedAt: Date.now() } : b
      ),
    }));
    const fName = state.folders.find((f) => f.id === folderId)?.name || 'Folder';
    showToast(`Đã chuyển bảng vẽ vào thư mục ${fName}`);
  };

  const createNewBoard = (folderOverrideId?: string) => {
    triggerHaptic('light');
    const id = createId('wb');
    const num = String(state.boards.length + 1).padStart(2, '0');
    const fId =
      folderOverrideId ||
      (selectedFolderId !== 'all' ? selectedFolderId : activeBoard.folderId) ||
      state.folders[0]?.id ||
      'fld_general';
    const newB: WhiteboardScene = {
      id,
      title: `${num} · Bảng vẽ mới`,
      folderId: fId,
      gridMode: 'dots',
      elements: [],
      updatedAt: Date.now(),
      lastSavedAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      activeBoardId: id,
      boards: [...prev.boards, newB],
    }));
    setSelectedId(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    showToast('Đã tạo bảng vẽ mới');
  };

  const deleteBoard = (boardId: string) => {
    if (state.boards.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 bảng vẽ', 'error');
      return;
    }
    if (!window.confirm('Xóa vĩnh viễn bảng vẽ này?')) return;
    setState((prev) => {
      const remaining = prev.boards.filter((b) => b.id !== boardId);
      const nextActive =
        prev.activeBoardId === boardId ? remaining[0]?.id || '' : prev.activeBoardId;
      return { ...prev, activeBoardId: nextActive, boards: remaining };
    });
    setSelectedId(null);
    showToast('Đã xóa bảng vẽ');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '')) as Partial<WhiteboardScene>;
        if (Array.isArray(parsed.elements)) {
          const id = createId('wb');
          const imported: WhiteboardScene = {
            id,
            title: parsed.title || file.name.replace(/\.json$/i, ''),
            folderId:
              parsed.folderId && state.folders.some((f) => f.id === parsed.folderId)
                ? parsed.folderId
                : selectedFolderId !== 'all'
                ? selectedFolderId
                : activeBoard.folderId || state.folders[0]?.id || 'fld_general',
            gridMode: parsed.gridMode || 'dots',
            elements: parsed.elements,
            updatedAt: Date.now(),
            lastSavedAt: Date.now(),
          };
          setState((prev) => ({
            ...prev,
            activeBoardId: id,
            boards: [...prev.boards, imported],
          }));
          setSelectedId(null);
          showToast('Đã nhập bảng vẽ từ JSON');
        } else {
          showToast('File JSON không đúng định dạng bảng vẽ', 'error');
        }
      } catch {
        showToast('Không thể đọc file JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  // =========================================================================
  // EXPORT PNG / JSON & UPLOAD TO CLOUDINARY
  // =========================================================================
  const renderBoardToPngBlob = async (): Promise<Blob | null> => {
    const svgEl = svgRef.current;
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const width = svgEl.clientWidth || 1280;
    const height = svgEl.clientHeight || 760;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.scale(2, 2);
        ctx.fillStyle = '#101114';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => resolve(b), 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  const handleExportPng = async () => {
    const blob = await renderBoardToPngBlob();
    if (!blob) {
      showToast('Không thể kết xuất PNG lúc này', 'error');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBoard.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống ảnh sơ đồ PNG sắc nét');
  };

  const handleSaveToCloudinaryAndJournal = async () => {
    setUploadingCloud(true);
    try {
      const blob = await renderBoardToPngBlob();
      if (!blob) throw new Error('Không thể tạo ảnh từ bảng vẽ.');
      const fileName = `excalidraw-${Date.now()}.png`;
      const saved = await saveMediaLocalAndMaybeUpload('image', blob, fileName, {
        subFolder: 'whiteboards',
      });
      await awardXp(30);

      if (onSaveImageToArticle) {
        onSaveImageToArticle({
          mediaId: saved.mediaId,
          caption: activeBoard.title,
          fileName,
          remoteUrl: saved.remoteUrl,
          createdAt: Date.now(),
        });
        showToast('Đã lưu bảng vẽ vào Figures & Architecture Diagrams');
      } else if (saved.provider === 'cloudinary') {
        showToast('Đã lưu ảnh bảng vẽ trực tiếp lên Cloudinary');
      } else {
        showToast('Đã lưu ảnh bảng vẽ vào kho Studio');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi lưu bản vẽ', 'error');
    } finally {
      setUploadingCloud(false);
    }
  };

  const handleExportExcalidrawJson = () => {
    const data = JSON.stringify(activeBoard, null, 2);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBoard.title.toLowerCase().replace(/\s+/g, '-')}.excalidraw.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file .excalidraw.json');
  };

  const applyStyleToSelection = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    updateBoardElements((els) =>
      els.map((el) => (el.id === selectedId ? { ...el, ...patch } : el))
    );
  };

  const dashArrayFor = (dash: StrokeDash) => {
    if (dash === 'dashed') return '8 6';
    if (dash === 'dotted') return '2.5 5';
    return undefined;
  };

  const fillFor = (el: CanvasElement) => {
    if (el.type === 'sticky') return '#25221B';
    if (el.fillStyle === 'none') return 'transparent';
    if (el.fillStyle === 'tint') return `${el.strokeColor}22`;
    if (el.fillStyle === 'solid') return `${el.strokeColor}3D`;
    if (el.fillStyle === 'hachure') return `url(#hachure-${el.strokeColor.replace('#', '')})`;
    return 'transparent';
  };

  const editingElement =
    activeBoard.elements.find((e) => e.id === editingId) || null;

  const studioShell = (
    <div
      ref={fullscreenRootRef}
      className={
        zenMode
          ? 'fixed inset-0 z-[999] flex flex-col bg-[#101114] w-screen h-dvh'
          : 'rounded-[16px] overflow-hidden flex flex-col'
      }
      style={
        zenMode
          ? undefined
          : {
              backgroundColor: '#121418',
              border: '1px solid rgba(217, 213, 203, 0.09)',
            }
      }
    >
      {/* ================================================================
          UNIFIED SINGLE-ROW STUDIO HEADER BAR
          Sleek board selector + inline rename + templates + cloud & fullscreen
          ================================================================ */}
      <header
        className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0"
        style={{
          backgroundColor: '#14161B',
          borderBottom: '1px solid rgba(217, 213, 203, 0.08)',
        }}
      >
        {/* Left: Folders Toggle + Board Switcher + Quick Inserts */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            type="button"
            onClick={() => setFolderDrawerOpen((o) => !o)}
            title="Mở/Đóng Kho Lưu Trữ & Thư mục"
            className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: folderDrawerOpen ? '#242731' : '#1B1D23',
              color: folderDrawerOpen ? '#B99B79' : '#EDEAE2',
              border: folderDrawerOpen
                ? '1px solid rgba(185, 155, 121, 0.45)'
                : '1px solid rgba(217, 213, 203, 0.09)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Thư mục ({state.boards.length})</span>
          </button>

          <div
            className="flex items-center gap-1 px-2 py-1 rounded-[8px]"
            style={{
              backgroundColor: '#1B1D23',
              border: '1px solid rgba(217, 213, 203, 0.09)',
            }}
          >
            {renamingBoard ? (
              <input
                autoFocus
                type="text"
                value={activeBoard.title}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    boards: prev.boards.map((b) =>
                      b.id === activeBoard.id ? { ...b, title: e.target.value } : b
                    ),
                  }))
                }
                onBlur={() => setRenamingBoard(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setRenamingBoard(false);
                }}
                className="bg-transparent text-[12.5px] font-medium w-44 px-1"
                style={{ color: '#EDEAE2' }}
              />
            ) : (
              <select
                value={activeBoard.id}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    createNewBoard();
                    return;
                  }
                  setState((prev) => ({ ...prev, activeBoardId: e.target.value }));
                  setSelectedId(null);
                }}
                className="bg-transparent text-[12.5px] font-medium cursor-pointer pr-1 max-w-[190px] truncate"
                style={{ color: '#EDEAE2' }}
              >
                {state.boards.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    style={{ backgroundColor: '#1B1D22', color: '#EDEAE2' }}
                  >
                    {b.title}
                  </option>
                ))}
                <option
                  value="__new__"
                  style={{ backgroundColor: '#1B1D22', color: '#B99B79' }}
                >
                  + Tạo bảng vẽ mới...
                </option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setRenamingBoard((r) => !r)}
              title="Đổi tên bảng vẽ"
              className="p-1 rounded-[5px] text-[11px] hover:bg-white/10 cursor-pointer transition-colors"
              style={{ color: renamingBoard ? '#B99B79' : 'rgba(217,213,203,0.5)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => createNewBoard()}
              title="Tạo bảng vẽ mới"
              className="p-1 rounded-[5px] text-[11px] hover:bg-white/10 cursor-pointer transition-colors"
              style={{ color: '#B99B79' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div className="hidden sm:block w-[1px] h-5 bg-[rgba(217,213,203,0.09)]" />

          <button
            type="button"
            onClick={stampWorkflowTemplate}
            className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-[#23262E] cursor-pointer"
            style={{
              backgroundColor: '#1B1D23',
              color: '#A7B6D2',
              border: '1px solid rgba(217, 213, 203, 0.08)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="6" height="6" rx="1" />
              <rect x="15" y="15" width="6" height="6" rx="1" />
              <path d="M9 6h4a2 2 0 0 1 2 2v7" />
            </svg>
            <span>Mẫu Workflow</span>
          </button>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-[#23262E] cursor-pointer"
            style={{
              backgroundColor: '#1B1D23',
              color: '#EDEAE2',
              border: '1px solid rgba(217, 213, 203, 0.08)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>Chèn ảnh</span>
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) insertImageFileOnCanvas(f);
            }}
          />
          <input
            ref={importJsonRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportJson(f);
            }}
          />
        </div>

        {/* Right: Folder Save + Export & Cloud & Fullscreen */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Active Folder Selector + Explicit Save Button */}
          <div
            className="flex items-center rounded-[8px] overflow-hidden"
            style={{
              backgroundColor: '#1B1D23',
              border: '1px solid rgba(155, 170, 152, 0.3)',
            }}
          >
            <select
              value={activeBoard.folderId || state.folders[0]?.id || 'fld_general'}
              onChange={(e) => moveBoardToFolder(activeBoard.id, e.target.value)}
              title="Chọn thư mục lưu bảng vẽ này"
              className="bg-transparent px-2 py-1.5 text-[11.5px] font-medium cursor-pointer max-w-[130px] truncate"
              style={{ color: '#9BAA98' }}
            >
              {state.folders.map((f) => (
                <option key={f.id} value={f.id} style={{ backgroundColor: '#1B1D22', color: '#EDEAE2' }}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="w-[1px] h-4 bg-[rgba(217,213,203,0.1)]" />
            <button
              type="button"
              disabled={savingManual}
              onClick={() => handleManualSave()}
              title="Lưu ngay vào thư mục & mã nguồn (Ctrl+S)"
              className="px-2.5 py-1.5 text-[11.5px] font-semibold flex items-center gap-1 hover:bg-white/10 cursor-pointer"
              style={{ color: '#9BAA98' }}
            >
              <span>{savingManual ? 'Đang lưu...' : '✓ Lưu (Ctrl+S)'}</span>
            </button>
          </div>

          <div
            className="flex items-center rounded-[8px] overflow-hidden"
            style={{
              backgroundColor: '#1B1D23',
              border: '1px solid rgba(217, 213, 203, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={handleExportPng}
              className="px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-white/5 cursor-pointer"
              style={{ color: '#EDEAE2' }}
            >
              PNG
            </button>
            <div className="w-[1px] h-4 bg-[rgba(217,213,203,0.08)]" />
            <button
              type="button"
              onClick={handleExportExcalidrawJson}
              className="px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-white/5 cursor-pointer"
              style={{ color: 'rgba(217,213,203,0.65)' }}
            >
              JSON
            </button>
            <div className="w-[1px] h-4 bg-[rgba(217,213,203,0.08)]" />
            <button
              type="button"
              onClick={() => importJsonRef.current?.click()}
              title="Mở file .excalidraw.json"
              className="px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-white/5 cursor-pointer"
              style={{ color: 'rgba(217,213,203,0.65)' }}
            >
              Mở
            </button>
          </div>

          <button
            type="button"
            disabled={uploadingCloud}
            onClick={handleSaveToCloudinaryAndJournal}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#B99B79',
              color: '#101114',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m16 16-4-4-4 4" />
            </svg>
            <span>{uploadingCloud ? 'Đang lưu...' : onSaveImageToArticle ? 'Lưu vào bài' : 'Lưu Cloudinary'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={zenMode ? 'Thoát toàn màn hình (F hoặc Esc)' : 'Mở toàn màn hình (F)'}
            className="px-2.5 py-1.5 rounded-[8px] text-[11.5px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor: zenMode ? '#EDEAE2' : '#1B1D23',
              color: zenMode ? '#101114' : '#EDEAE2',
              border: '1px solid rgba(217, 213, 203, 0.12)',
            }}
          >
            {zenMode ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
                <span>Thoát (Esc)</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
                <span>Full (F)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ================================================================
          WORKSPACE BODY: FOLDERS & SAVED DRAWER + INFINITE VECTOR CANVAS
          ================================================================ */}
      <div className={`flex flex-col md:flex-row min-h-0 ${zenMode ? 'flex-1' : 'h-[700px]'}`}>
        {folderDrawerOpen && (
          <aside
            className="w-full md:w-[252px] shrink-0 p-3.5 flex flex-col justify-between gap-3 overflow-y-auto border-b md:border-b-0 md:border-r max-h-[260px] md:max-h-none"
            style={{
              backgroundColor: '#13151A',
              borderColor: 'rgba(217, 213, 203, 0.08)',
            }}
          >
            <div className="space-y-4">
              {/* Folders Header + Create Folder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: '#B99B79' }}>
                    THƯ MỤC LƯU TRỮ
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewFolderOpen((v) => !v)}
                    className="metadata text-[10.5px] hover:underline cursor-pointer"
                    style={{ color: '#A7B6D2' }}
                  >
                    {newFolderOpen ? 'Đóng' : '+ Tạo Folder'}
                  </button>
                </div>

                {newFolderOpen && (
                  <form onSubmit={createNewFolder} className="flex gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Tên folder mới..."
                      className="flex-1 px-2.5 py-1 rounded-[6px] text-[12px] bg-[#0D0E11] border border-[rgba(217,213,203,0.12)] text-[#EDEAE2]"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer"
                      style={{ backgroundColor: '#B99B79', color: '#101114' }}
                    >
                      Lưu
                    </button>
                  </form>
                )}

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId('all')}
                    className="w-full px-2.5 py-1.5 rounded-[7px] text-left flex items-center justify-between text-[12px] cursor-pointer"
                    style={{
                      backgroundColor: selectedFolderId === 'all' ? '#1E2028' : 'transparent',
                      color: selectedFolderId === 'all' ? '#EDEAE2' : 'rgba(217,213,203,0.65)',
                    }}
                  >
                    <span>Tất cả bảng vẽ</span>
                    <span className="metadata text-[10px]" style={{ color: 'rgba(217,213,203,0.45)' }}>
                      {state.boards.length}
                    </span>
                  </button>

                  {state.folders.map((fld) => {
                    const count = state.boards.filter((b) => (b.folderId || 'fld_general') === fld.id).length;
                    const active = selectedFolderId === fld.id;
                    return (
                      <div
                        key={fld.id}
                        className="group flex items-center justify-between rounded-[7px] pr-1.5"
                        style={{
                          backgroundColor: active ? '#1E2028' : 'transparent',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedFolderId(fld.id)}
                          className="flex-1 px-2.5 py-1.5 text-left flex items-center gap-2 text-[12px] cursor-pointer truncate"
                          style={{
                            color: active ? '#EDEAE2' : 'rgba(217,213,203,0.68)',
                          }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fld.color }} />
                          <span className="truncate">{fld.name}</span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="metadata text-[10px]" style={{ color: 'rgba(217,213,203,0.4)' }}>
                            {count}
                          </span>
                          {state.folders.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteFolder(fld.id)}
                              title="Xóa thư mục"
                              className="opacity-0 group-hover:opacity-100 text-[11px] hover:text-red-400 cursor-pointer"
                              style={{ color: 'rgba(217,213,203,0.4)' }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saved Boards in Selected Folder */}
              <div className="space-y-2 pt-3 border-t border-[rgba(217,213,203,0.08)]">
                <div className="flex items-center justify-between">
                  <span className="metadata text-[10px] uppercase tracking-[0.12em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                    BẢNG VẼ ĐÃ LƯU
                  </span>
                </div>

                <input
                  type="text"
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  placeholder="Tìm bảng vẽ..."
                  className="w-full px-2.5 py-1.5 rounded-[7px] text-[12px] bg-[#0D0E11] border border-[rgba(217,213,203,0.08)] text-[#EDEAE2]"
                />

                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5">
                  {state.boards
                    .filter((b) => {
                      if (selectedFolderId !== 'all' && (b.folderId || 'fld_general') !== selectedFolderId) {
                        return false;
                      }
                      if (folderSearch.trim()) {
                        return b.title.toLowerCase().includes(folderSearch.toLowerCase());
                      }
                      return true;
                    })
                    .map((b) => {
                      const isCur = b.id === activeBoard.id;
                      const bFolder = state.folders.find((f) => f.id === (b.folderId || 'fld_general'));
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            setState((prev) => ({ ...prev, activeBoardId: b.id }));
                            setSelectedId(null);
                          }}
                          className="p-2.5 rounded-[9px] space-y-1.5 cursor-pointer group transition-colors"
                          style={{
                            backgroundColor: isCur ? '#1E212B' : '#17191F',
                            border: isCur
                              ? '1px solid rgba(185, 155, 121, 0.55)'
                              : '1px solid rgba(217, 213, 203, 0.06)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <p className="text-[12.5px] font-medium leading-snug line-clamp-1" style={{ color: isCur ? '#EDEAE2' : 'rgba(237,234,226,0.82)' }}>
                              {b.title}
                            </p>
                            {state.boards.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBoard(b.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[11px] hover:text-red-400 cursor-pointer shrink-0"
                                style={{ color: 'rgba(217,213,203,0.4)' }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between metadata text-[9.5px]" style={{ color: 'rgba(217,213,203,0.45)' }}>
                            <span style={{ color: bFolder?.color || '#B99B79' }}>
                              {bFolder?.name || 'Phác thảo'} · {b.elements.length} khối
                            </span>
                            <span>
                              {new Date(b.lastSavedAt || b.updatedAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => createNewBoard(selectedFolderId !== 'all' ? selectedFolderId : undefined)}
              className="w-full py-2 px-3 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[#1E212A]"
              style={{
                backgroundColor: '#17191F',
                color: '#B99B79',
                border: '1px dashed rgba(185, 155, 121, 0.4)',
              }}
            >
              + Bảng mới trong Folder này
            </button>
          </aside>
        )}

        <div
          ref={containerRef}
          onWheel={handleWheel}
          className="relative flex-1 w-full h-full overflow-hidden select-none"
          style={{
            backgroundColor: '#101114',
            cursor:
              tool === 'hand' || spacePressed
                ? 'grab'
                : tool === 'select'
                ? 'default'
                : 'crosshair',
          }}
        >
        {/* --------------------------------------------------------------
            1. EXCALIDRAW TOP FLOATING ISLAND TOOLBAR (Vector Icons)
            -------------------------------------------------------------- */}
        <div
          className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 px-2 py-1.5 rounded-[12px] flex items-center gap-0.5 shadow-2xl"
          style={{
            backgroundColor: 'rgba(24, 26, 32, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          <button
            type="button"
            onClick={() => setLockTool((l) => !l)}
            title="Khóa công cụ (Giữ nguyên công cụ sau khi vẽ)"
            className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors"
            style={{
              backgroundColor: lockTool ? 'rgba(185, 155, 121, 0.2)' : 'transparent',
              color: lockTool ? '#B99B79' : 'rgba(217, 213, 203, 0.45)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {lockTool ? (
                <>
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              ) : (
                <>
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </>
              )}
            </svg>
          </button>

          <div className="w-[1px] h-5 mx-1 bg-[rgba(217,213,203,0.1)]" />

          {TOOLS.map((t, idx) => {
            const active = tool === t.id;
            const showDivider = idx === 2 || idx === 5 || idx === 7 || idx === 10;
            return (
              <React.Fragment key={t.id}>
                {showDivider && (
                  <div className="w-[1px] h-5 mx-0.5 bg-[rgba(217,213,203,0.08)]" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setTool(t.id);
                  }}
                  title={t.label}
                  className="relative w-9 h-9 rounded-[8px] flex items-center justify-center transition-all cursor-pointer hover:bg-white/5"
                  style={{
                    backgroundColor: active ? '#B99B79' : 'transparent',
                    color: active ? '#101114' : '#EDEAE2',
                  }}
                >
                  <ToolSvgIcon id={t.id} />
                  <span
                    className="absolute bottom-0.5 right-1 metadata text-[8px] leading-none"
                    style={{
                      color: active ? '#101114' : 'rgba(217, 213, 203, 0.4)',
                    }}
                  >
                    {t.shortcut}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* --------------------------------------------------------------
            2. SLEEK COLLAPSIBLE LEFT STYLE INSPECTOR
            -------------------------------------------------------------- */}
        {inspectorOpen && (
          <div
            className="absolute top-[68px] left-3.5 z-20 w-[212px] p-3.5 rounded-[12px] space-y-3.5 shadow-2xl max-h-[calc(100%-130px)] overflow-y-auto"
            style={{
              backgroundColor: 'rgba(24, 26, 32, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          >
            {/* Stroke Color */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                  Màu nét
                </span>
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  title="Thu gọn bảng thuộc tính"
                  className="metadata text-[10px] hover:text-[#EDEAE2] cursor-pointer"
                  style={{ color: 'rgba(217,213,203,0.35)' }}
                >
                  Ẩn ×
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {STROKE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setStrokeColor(c.value);
                      applyStyleToSelection({ strokeColor: c.value });
                    }}
                    title={c.label}
                    className="w-5 h-5 rounded-[6px] cursor-pointer transition-transform"
                    style={{
                      backgroundColor: c.value,
                      transform: strokeColor === c.value ? 'scale(1.16)' : 'scale(1)',
                      boxShadow:
                        strokeColor === c.value ? '0 0 0 2px #14161B, 0 0 0 3.5px #B99B79' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Background Fill Style */}
            <div className="space-y-1.5">
              <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                Kiểu tô nền
              </span>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ['none', 'Trống'],
                    ['hachure', 'Gạch'],
                    ['tint', 'Mờ'],
                    ['solid', 'Đặc'],
                  ] as const
                ).map(([fs, lbl]) => (
                  <button
                    key={fs}
                    type="button"
                    onClick={() => {
                      setFillStyle(fs);
                      applyStyleToSelection({ fillStyle: fs });
                    }}
                    className="py-1 rounded-[6px] text-[10.5px] font-medium cursor-pointer transition-colors"
                    style={{
                      backgroundColor: fillStyle === fs ? '#2A2D36' : '#121418',
                      color: fillStyle === fs ? '#B99B79' : 'rgba(217,213,203,0.6)',
                      border: fillStyle === fs ? '1px solid rgba(185,155,121,0.4)' : '1px solid rgba(217,213,203,0.06)',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Width & Dash */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                  Độ dày
                </span>
                <div className="flex gap-1">
                  {[1.5, 2.5, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        setStrokeWidth(w);
                        applyStyleToSelection({ strokeWidth: w });
                      }}
                      className="flex-1 py-1 rounded-[6px] metadata text-[10px] cursor-pointer"
                      style={{
                        backgroundColor: strokeWidth === w ? '#2A2D36' : '#121418',
                        color: strokeWidth === w ? '#B99B79' : 'rgba(217,213,203,0.6)',
                        border: strokeWidth === w ? '1px solid rgba(185,155,121,0.4)' : '1px solid rgba(217,213,203,0.06)',
                      }}
                    >
                      {w === 1.5 ? 'S' : w === 2.5 ? 'M' : 'L'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                  Kiểu nét
                </span>
                <div className="flex gap-1">
                  {(
                    [
                      ['solid', '—'],
                      ['dashed', '--'],
                      ['dotted', '··'],
                    ] as const
                  ).map(([d, sym]) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setStrokeDash(d);
                        applyStyleToSelection({ strokeDash: d });
                      }}
                      className="flex-1 py-1 rounded-[6px] metadata text-[10px] cursor-pointer"
                      style={{
                        backgroundColor: strokeDash === d ? '#2A2D36' : '#121418',
                        color: strokeDash === d ? '#B99B79' : 'rgba(217,213,203,0.6)',
                        border: strokeDash === d ? '1px solid rgba(185,155,121,0.4)' : '1px solid rgba(217,213,203,0.06)',
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Font Size & Sketch Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                  Cỡ chữ
                </span>
                <div className="flex gap-1">
                  {[13, 15, 19].map((fs) => (
                    <button
                      key={fs}
                      type="button"
                      onClick={() => {
                        setFontSize(fs);
                        applyStyleToSelection({ fontSize: fs });
                      }}
                      className="flex-1 py-1 rounded-[6px] metadata text-[10px] cursor-pointer"
                      style={{
                        backgroundColor: fontSize === fs ? '#2A2D36' : '#121418',
                        color: fontSize === fs ? '#B99B79' : 'rgba(217,213,203,0.6)',
                        border: fontSize === fs ? '1px solid rgba(185,155,121,0.4)' : '1px solid rgba(217,213,203,0.06)',
                      }}
                    >
                      {fs === 13 ? 'S' : fs === 15 ? 'M' : 'L'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: 'rgba(217,213,203,0.5)' }}>
                  Nét vẽ
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSketchy(true);
                      applyStyleToSelection({ sketchy: true });
                    }}
                    className="flex-1 py-1 rounded-[6px] text-[10.5px] cursor-pointer"
                    style={{
                      backgroundColor: sketchy ? '#2A2D36' : '#121418',
                      color: sketchy ? '#B99B79' : 'rgba(217,213,203,0.6)',
                      border: sketchy ? '1px solid rgba(185,155,121,0.4)' : '1px solid rgba(217,213,203,0.06)',
                    }}
                  >
                    Tay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSketchy(false);
                      applyStyleToSelection({ sketchy: false });
                    }}
                    className="flex-1 py-1 rounded-[6px] text-[10.5px] cursor-pointer"
                    style={{
                      backgroundColor: !sketchy ? '#2A2D36' : '#121418',
                      color: !sketchy ? '#B99B79' : 'rgba(217,213,203,0.6)',
                      border: !sketchy ? '1px solid rgba(185,155,121,0.4)' : '1px solid rgba(217,213,203,0.06)',
                    }}
                  >
                    Thẳng
                  </button>
                </div>
              </div>
            </div>

            {/* Contextual Selection Actions */}
            {selectedElement && (
              <div className="pt-2.5 space-y-1.5 border-t border-[rgba(217,213,203,0.08)]">
                <span className="metadata text-[9.5px] uppercase tracking-[0.08em]" style={{ color: '#A7B6D2' }}>
                  Khối đang chọn
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => startInlineEdit(selectedElement)}
                    className="py-1.5 rounded-[7px] text-[11px] font-medium cursor-pointer bg-[#121418] hover:bg-[#1F222A] text-[#EDEAE2]"
                  >
                    Sửa chữ (↵)
                  </button>
                  <button
                    type="button"
                    onClick={duplicateSelectedElement}
                    className="py-1.5 rounded-[7px] text-[11px] font-medium cursor-pointer bg-[#121418] hover:bg-[#1F222A] text-[#A7B6D2]"
                  >
                    Nhân bản
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateBoardElements((els) => {
                        const target = els.find((e) => e.id === selectedElement.id);
                        if (!target) return els;
                        return [...els.filter((e) => e.id !== selectedElement.id), target];
                      });
                    }}
                    className="py-1.5 rounded-[7px] text-[11px] font-medium cursor-pointer bg-[#121418] hover:bg-[#1F222A] text-[rgba(217,213,203,0.65)]"
                  >
                    Lên trên
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateBoardElements((els) =>
                        els.filter((e) => e.id !== selectedElement.id)
                      );
                      setSelectedId(null);
                    }}
                    className="py-1.5 rounded-[7px] text-[11px] font-medium cursor-pointer bg-[#121418] hover:bg-[#1F222A] text-[#C27B76]"
                  >
                    Xóa (Del)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Re-open inspector pill when hidden */}
        {!inspectorOpen && (
          <button
            type="button"
            onClick={() => setInspectorOpen(true)}
            className="absolute top-[68px] left-3.5 z-20 px-3 py-1.5 rounded-[9px] text-[11.5px] font-medium shadow-xl cursor-pointer hover:bg-[#23262E]"
            style={{
              backgroundColor: 'rgba(24, 26, 32, 0.92)',
              color: '#EDEAE2',
              border: '1px solid rgba(217, 213, 203, 0.1)',
            }}
          >
            Kiểu nét ↗
          </button>
        )}

        {/* --------------------------------------------------------------
            3. BOTTOM ISLANDS: ZOOM + UNDO/REDO (LEFT) · HINT · GRID (RIGHT)
            -------------------------------------------------------------- */}
        <div
          className="absolute bottom-3.5 left-3.5 z-20 px-2 py-1 rounded-[10px] flex items-center gap-1 shadow-xl"
          style={{
            backgroundColor: 'rgba(24, 26, 32, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.15).toFixed(2))))}
            className="w-7 h-7 rounded-[6px] text-[14px] cursor-pointer hover:bg-white/5 text-[#EDEAE2]"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-2 py-1 rounded-[6px] metadata text-[10.5px] tabular-nums cursor-pointer hover:bg-white/5 text-[#EDEAE2]"
            title="Reset 100% & về tâm bảng vẽ"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
            className="w-7 h-7 rounded-[6px] text-[14px] cursor-pointer hover:bg-white/5 text-[#EDEAE2]"
          >
            +
          </button>

          <div className="w-[1px] h-4 mx-1 bg-[rgba(217,213,203,0.1)]" />

          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            title="Hoàn tác (Ctrl+Z)"
            className="px-2 py-1 rounded-[6px] text-[11.5px] cursor-pointer disabled:opacity-30 hover:bg-white/5 text-[#EDEAE2]"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            title="Làm lại (Ctrl+Y)"
            className="px-2 py-1 rounded-[6px] text-[11.5px] cursor-pointer disabled:opacity-30 hover:bg-white/5 text-[#EDEAE2]"
          >
            ↷ Redo
          </button>
        </div>

        {/* Quiet Shortcut Hint Pill */}
        <div
          className="hidden lg:flex absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full metadata text-[10px] pointer-events-none"
          style={{
            backgroundColor: 'rgba(24, 26, 32, 0.72)',
            color: 'rgba(217, 213, 203, 0.48)',
            border: '1px solid rgba(217, 213, 203, 0.06)',
          }}
        >
          Nhấp đúp để gõ chữ · Giữ Space để kéo bảng · Ctrl + Cuộn để phóng to
        </div>

        <div
          className="absolute bottom-3.5 right-3.5 z-20 px-2 py-1 rounded-[10px] flex items-center gap-1 shadow-xl"
          style={{
            backgroundColor: 'rgba(24, 26, 32, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(217, 213, 203, 0.1)',
          }}
        >
          {(
            [
              ['dots', 'Chấm'],
              ['grid', 'Lưới'],
              ['none', 'Trơn'],
            ] as const
          ).map(([gm, label]) => (
            <button
              key={gm}
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  boards: prev.boards.map((b) =>
                    b.id === activeBoard.id ? { ...b, gridMode: gm } : b
                  ),
                }))
              }
              className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: activeBoard.gridMode === gm ? '#2A2D36' : 'transparent',
                color: activeBoard.gridMode === gm ? '#B99B79' : 'rgba(217,213,203,0.55)',
              }}
            >
              {label}
            </button>
          ))}

          <div className="w-[1px] h-4 mx-1 bg-[rgba(217,213,203,0.1)]" />

          <button
            type="button"
            onClick={() => {
              if (!window.confirm('Xóa toàn bộ các phần tử trên bảng vẽ hiện tại?')) return;
              updateBoardElements([]);
              setSelectedId(null);
            }}
            className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer hover:bg-white/5"
            style={{ color: '#C27B76' }}
          >
            Xóa bảng
          </button>
        </div>

        {/* --------------------------------------------------------------
            4. INLINE TEXT EDITOR OVERLAY (Double-click or Enter on any shape)
            -------------------------------------------------------------- */}
        {editingElement && (
          <div
            className="absolute z-30 flex items-center justify-center"
            style={{
              left: pan.x + editingElement.x * zoom,
              top: pan.y + editingElement.y * zoom,
              width: Math.max(170, Math.abs(editingElement.width) * zoom),
              height: Math.max(60, Math.abs(editingElement.height) * zoom),
            }}
          >
            <textarea
              autoFocus
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={commitInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                  e.preventDefault();
                  commitInlineEdit();
                }
              }}
              className="w-full h-full p-2.5 rounded-[10px] text-center resize-none shadow-2xl"
              style={{
                backgroundColor: 'rgba(16, 17, 20, 0.96)',
                border: '2px solid #B99B79',
                color: editingElement.strokeColor || '#EDEAE2',
                fontSize: `${Math.max(13, editingElement.fontSize * zoom)}px`,
                fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            />
          </div>
        )}

        {/* --------------------------------------------------------------
            5. SVG INFINITE VECTOR CANVAS
            -------------------------------------------------------------- */}
        <svg
          ref={svgRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          className="w-full h-full block touch-none"
        >
          <defs>
            <pattern
              id="excalidraw-dots"
              x={pan.x}
              y={pan.y}
              width={24 * zoom}
              height={24 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={2 * zoom}
                cy={2 * zoom}
                r={Math.max(0.8, 1.15 * zoom)}
                fill="rgba(217, 213, 203, 0.16)"
              />
            </pattern>

            <pattern
              id="excalidraw-grid"
              x={pan.x}
              y={pan.y}
              width={32 * zoom}
              height={32 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${32 * zoom} 0 L 0 0 0 ${32 * zoom}`}
                fill="none"
                stroke="rgba(217, 213, 203, 0.065)"
                strokeWidth="1"
              />
            </pattern>

            {STROKE_COLORS.map((c) => {
              const id = `hachure-${c.value.replace('#', '')}`;
              return (
                <pattern
                  key={id}
                  id={id}
                  width="10"
                  height="10"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke={c.value}
                    strokeOpacity="0.24"
                    strokeWidth="2"
                  />
                </pattern>
              );
            })}
          </defs>

          {activeBoard.gridMode !== 'none' && (
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={
                activeBoard.gridMode === 'dots'
                  ? 'url(#excalidraw-dots)'
                  : 'url(#excalidraw-grid)'
              }
            />
          )}

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {activeBoard.elements.map((el) => {
              const isSelected = el.id === selectedId;
              const dash = dashArrayFor(el.strokeDash);
              const fill = fillFor(el);
              const lines = el.text ? el.text.split('\n') : [];

              return (
                <g key={el.id}>
                  {(el.type === 'rectangle' || el.type === 'sticky') && (
                    <>
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rx={el.type === 'sticky' ? 6 : 12}
                        fill={fill}
                        stroke={el.strokeColor}
                        strokeWidth={el.strokeWidth}
                        strokeDasharray={dash}
                      />
                      {el.sketchy && (
                        <rect
                          x={el.x - 1.2}
                          y={el.y + 1.2}
                          width={el.width + 1.6}
                          height={el.height - 1.2}
                          rx={13}
                          fill="none"
                          stroke={el.strokeColor}
                          strokeOpacity="0.45"
                          strokeWidth={Math.max(1, el.strokeWidth - 0.6)}
                          strokeDasharray={dash}
                        />
                      )}
                      {lines.length > 0 && editingId !== el.id && (
                        <text
                          x={el.x + el.width / 2}
                          y={
                            el.y +
                            el.height / 2 -
                            ((lines.length - 1) * (el.fontSize * 1.25)) / 2
                          }
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#EDEAE2"
                          fontSize={el.fontSize}
                          fontWeight="500"
                          fontFamily='"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        >
                          {lines.map((ln, idx) => (
                            <tspan
                              key={idx}
                              x={el.x + el.width / 2}
                              dy={idx === 0 ? 0 : el.fontSize * 1.28}
                            >
                              {ln}
                            </tspan>
                          ))}
                        </text>
                      )}
                    </>
                  )}

                  {el.type === 'diamond' && (
                    <>
                      <polygon
                        points={`${el.x + el.width / 2},${el.y} ${el.x + el.width},${
                          el.y + el.height / 2
                        } ${el.x + el.width / 2},${el.y + el.height} ${el.x},${
                          el.y + el.height / 2
                        }`}
                        fill={fill}
                        stroke={el.strokeColor}
                        strokeWidth={el.strokeWidth}
                        strokeDasharray={dash}
                        strokeLinejoin="round"
                      />
                      {el.sketchy && (
                        <polygon
                          points={`${el.x + el.width / 2 + 1.4},${el.y - 1} ${
                            el.x + el.width + 1
                          },${el.y + el.height / 2 + 1.2} ${el.x + el.width / 2 - 1.2},${
                            el.y + el.height + 1
                          } ${el.x - 1},${el.y + el.height / 2 - 1}`}
                          fill="none"
                          stroke={el.strokeColor}
                          strokeOpacity="0.42"
                          strokeWidth={Math.max(1, el.strokeWidth - 0.6)}
                          strokeDasharray={dash}
                        />
                      )}
                      {lines.length > 0 && editingId !== el.id && (
                        <text
                          x={el.x + el.width / 2}
                          y={
                            el.y +
                            el.height / 2 -
                            ((lines.length - 1) * (el.fontSize * 1.25)) / 2
                          }
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#EDEAE2"
                          fontSize={el.fontSize}
                          fontWeight="500"
                          fontFamily='"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        >
                          {lines.map((ln, idx) => (
                            <tspan
                              key={idx}
                              x={el.x + el.width / 2}
                              dy={idx === 0 ? 0 : el.fontSize * 1.25}
                            >
                              {ln}
                            </tspan>
                          ))}
                        </text>
                      )}
                    </>
                  )}

                  {el.type === 'ellipse' && (
                    <>
                      <ellipse
                        cx={el.x + el.width / 2}
                        cy={el.y + el.height / 2}
                        rx={el.width / 2}
                        ry={el.height / 2}
                        fill={fill}
                        stroke={el.strokeColor}
                        strokeWidth={el.strokeWidth}
                        strokeDasharray={dash}
                      />
                      {el.sketchy && (
                        <ellipse
                          cx={el.x + el.width / 2 + 1}
                          cy={el.y + el.height / 2 - 1}
                          rx={el.width / 2 + 1.2}
                          ry={el.height / 2 - 0.8}
                          fill="none"
                          stroke={el.strokeColor}
                          strokeOpacity="0.42"
                          strokeWidth={Math.max(1, el.strokeWidth - 0.6)}
                          strokeDasharray={dash}
                        />
                      )}
                      {lines.length > 0 && editingId !== el.id && (
                        <text
                          x={el.x + el.width / 2}
                          y={
                            el.y +
                            el.height / 2 -
                            ((lines.length - 1) * (el.fontSize * 1.25)) / 2
                          }
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#EDEAE2"
                          fontSize={el.fontSize}
                          fontWeight="500"
                          fontFamily='"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                        >
                          {lines.map((ln, idx) => (
                            <tspan
                              key={idx}
                              x={el.x + el.width / 2}
                              dy={idx === 0 ? 0 : el.fontSize * 1.25}
                            >
                              {ln}
                            </tspan>
                          ))}
                        </text>
                      )}
                    </>
                  )}

                  {(el.type === 'arrow' || el.type === 'line') && (() => {
                    const x1 = el.x;
                    const y1 = el.y;
                    const x2 = el.x + el.width;
                    const y2 = el.y + el.height;
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const headLen = 13;
                    const hx1 = x2 - headLen * Math.cos(angle - Math.PI / 6);
                    const hy1 = y2 - headLen * Math.sin(angle - Math.PI / 6);
                    const hx2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
                    const hy2 = y2 - headLen * Math.sin(angle + Math.PI / 6);

                    return (
                      <>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={el.strokeColor}
                          strokeWidth={el.strokeWidth}
                          strokeDasharray={dash}
                          strokeLinecap="round"
                        />
                        {el.type === 'arrow' && (
                          <polyline
                            points={`${hx1},${hy1} ${x2},${y2} ${hx2},${hy2}`}
                            fill="none"
                            stroke={el.strokeColor}
                            strokeWidth={el.strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        {el.text && editingId !== el.id && (
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 10}
                            textAnchor="middle"
                            fill={el.strokeColor}
                            fontSize={el.fontSize || 12}
                            fontWeight="500"
                            fontFamily='"SF Mono", ui-monospace, monospace'
                          >
                            {el.text}
                          </text>
                        )}
                      </>
                    );
                  })()}

                  {el.type === 'freedraw' && el.points && el.points.length > 1 && (
                    <polyline
                      points={el.points.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={el.strokeColor}
                      strokeWidth={el.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {el.type === 'text' && editingId !== el.id && (
                    <text
                      x={el.x}
                      y={el.y + el.fontSize}
                      fill={el.strokeColor}
                      fontSize={el.fontSize}
                      fontWeight="600"
                      fontFamily='"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    >
                      {lines.map((ln, idx) => (
                        <tspan key={idx} x={el.x} dy={idx === 0 ? 0 : el.fontSize * 1.3}>
                          {ln}
                        </tspan>
                      ))}
                    </text>
                  )}

                  {el.type === 'image' && el.imageDataUrl && (
                    <image
                      href={el.imageDataUrl}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      preserveAspectRatio="none"
                    />
                  )}

                  {isSelected && (() => {
                    if (el.type === 'arrow' || el.type === 'line') {
                      const sx = el.x;
                      const sy = el.y;
                      const ex = el.x + el.width;
                      const ey = el.y + el.height;
                      return (
                        <g>
                          <circle
                            cx={sx}
                            cy={sy}
                            r={5.5}
                            fill="#101114"
                            stroke="#A7B6D2"
                            strokeWidth={2}
                          />
                          <circle
                            cx={ex}
                            cy={ey}
                            r={5.5}
                            fill="#101114"
                            stroke="#A7B6D2"
                            strokeWidth={2}
                          />
                        </g>
                      );
                    }

                    const b = getElementBounds(el);
                    return (
                      <g>
                        <rect
                          x={b.minX - 5}
                          y={b.minY - 5}
                          width={b.maxX - b.minX + 10}
                          height={b.maxY - b.minY + 10}
                          rx={6}
                          fill="none"
                          stroke="#A7B6D2"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />
                        {el.type !== 'freedraw' && (
                          <>
                            <rect
                              x={b.minX - 9}
                              y={b.minY - 9}
                              width={8}
                              height={8}
                              rx={2}
                              fill="#101114"
                              stroke="#A7B6D2"
                              strokeWidth={1.5}
                            />
                            <rect
                              x={b.maxX + 1}
                              y={b.minY - 9}
                              width={8}
                              height={8}
                              rx={2}
                              fill="#101114"
                              stroke="#A7B6D2"
                              strokeWidth={1.5}
                            />
                            <rect
                              x={b.minX - 9}
                              y={b.maxY + 1}
                              width={8}
                              height={8}
                              rx={2}
                              fill="#101114"
                              stroke="#A7B6D2"
                              strokeWidth={1.5}
                            />
                            <rect
                              x={b.maxX + 1}
                              y={b.maxY + 1}
                              width={8}
                              height={8}
                              rx={2}
                              fill="#101114"
                              stroke="#A7B6D2"
                              strokeWidth={1.5}
                            />
                          </>
                        )}
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        </svg>
        </div>
      </div>
    </div>
  );

  if (zenMode && typeof document !== 'undefined') {
    return createPortal(studioShell, document.body);
  }

  return studioShell;
}
