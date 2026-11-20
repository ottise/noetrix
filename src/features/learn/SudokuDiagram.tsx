import React from 'react';
import { useLanguage } from '../../lib/i18n';

interface CellSpec {
  r: number; // 0..8
  c: number; // 0..8
  given?: number;
  placed?: number; // confirmed deduced digit (green/sage)
  cands?: number[];
  strike?: number[]; // eliminated candidates shown crossed out in red
  accentCands?: number[]; // highlighted candidates in brass/blue
  bg?: 'focus' | 'unit' | 'blue' | 'amber' | 'danger' | 'fin' | 'sage';
  note?: string;
}

interface RayLine {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  kind: 'strong' | 'weak' | 'elim' | 'ray';
  color?: string;
}

interface DiagramSpec {
  captionEn: string;
  captionVi: string;
  badge: string;
  shadedRows?: number[];
  shadedCols?: number[];
  shadedBoxes?: number[]; // 0..8
  cells: CellSpec[];
  rays?: RayLine[];
}

const DIAGRAM_SPECS: Record<string, DiagramSpec> = {
  sd_01_rules: {
    badge: 'UNIT INTERSECTION · 20 PEERS',
    captionEn: 'Cell R5C5 belongs simultaneously to Row 5, Column 5, and Box 5 (20 peer cells).',
    captionVi: 'Ô R5C5 thuộc đồng thời Hàng 5, Cột 5 và Box 5 (tạo thành 20 ô peer nhìn thấy nhau).',
    shadedRows: [4],
    shadedCols: [4],
    shadedBoxes: [4],
    cells: [
      { r: 4, c: 4, placed: 5, bg: 'focus' },
      { r: 4, c: 0, given: 2 },
      { r: 4, c: 7, given: 8 },
      { r: 1, c: 4, given: 7 },
      { r: 7, c: 4, given: 1 },
      { r: 3, c: 3, given: 9 },
      { r: 5, c: 5, given: 4 },
    ],
  },
  sd_01_scanning: {
    badge: 'CROSS-HATCHING · TOP BAND',
    captionEn: '7 in Row 1 (R1C2) and Row 2 (R2C5) block top two rows of Box 3 → 7 must sit on Row 3.',
    captionVi: 'Số 7 ở Hàng 1 (R1C2) và Hàng 2 (R2C5) chặn 2 hàng trên của Box 3 → 7 buộc nằm ở Hàng 3.',
    shadedBoxes: [2],
    cells: [
      { r: 0, c: 1, given: 7, bg: 'blue' },
      { r: 1, c: 4, given: 7, bg: 'blue' },
      { r: 2, c: 6, given: 3 },
      { r: 2, c: 8, given: 6 },
      { r: 2, c: 7, placed: 7, bg: 'sage' },
    ],
    rays: [
      { r1: 0, c1: 1, r2: 0, c2: 8, kind: 'ray' },
      { r1: 1, c1: 4, r2: 1, c2: 8, kind: 'ray' },
    ],
  },
  sd_01_hidden_single: {
    badge: 'HIDDEN SINGLE · COLUMN 4',
    captionEn: 'In Col 4, three empty cells see a 9 in their Boxes/Rows → only R6C4 can hold 9.',
    captionVi: 'Trên Cột 4 còn 4 ô trống, nhưng 3 ô bị chặn bởi số 9 ở Hàng/Box khác → chỉ R6C4 chứa được 9.',
    shadedCols: [3],
    cells: [
      { r: 0, c: 3, given: 4 },
      { r: 1, c: 3, cands: [2, 6, 9], strike: [9], bg: 'danger' },
      { r: 1, c: 7, given: 9, bg: 'blue' },
      { r: 2, c: 3, given: 1 },
      { r: 3, c: 3, cands: [5, 7, 9], strike: [9], bg: 'danger' },
      { r: 3, c: 0, given: 9, bg: 'blue' },
      { r: 4, c: 3, given: 8 },
      { r: 5, c: 3, placed: 9, cands: [2, 4, 9], accentCands: [9], bg: 'sage' },
      { r: 6, c: 3, given: 3 },
      { r: 7, c: 3, cands: [2, 5, 9], strike: [9], bg: 'danger' },
      { r: 7, c: 5, given: 9, bg: 'blue' },
      { r: 8, c: 3, given: 6 },
    ],
    rays: [
      { r1: 1, c1: 7, r2: 1, c2: 3, kind: 'elim' },
      { r1: 3, c1: 0, r2: 3, c2: 3, kind: 'elim' },
      { r1: 7, c1: 5, r2: 7, c2: 3, kind: 'elim' },
    ],
  },
  sd_01_naked_single: {
    badge: 'NAKED SINGLE · R2C8',
    captionEn: 'R2C8 sees {1,2,3,4} in Row 2, {5,6,7} in Col 8, and {8} in Box 3 → sole candidate is 9.',
    captionVi: 'Ô R2C8 nhìn thấy {1,2,3,4} ở Hàng 2, {5,6,7} ở Cột 8 và {8} trong Box 3 → duy nhất còn số 9.',
    shadedRows: [1],
    shadedCols: [7],
    shadedBoxes: [2],
    cells: [
      { r: 1, c: 0, given: 1 },
      { r: 1, c: 2, given: 2 },
      { r: 1, c: 4, given: 3 },
      { r: 1, c: 5, given: 4 },
      { r: 3, c: 7, given: 5 },
      { r: 5, c: 7, given: 6 },
      { r: 7, c: 7, given: 7 },
      { r: 0, c: 6, given: 8 },
      { r: 1, c: 7, placed: 9, bg: 'sage' },
    ],
  },
  sd_01_candidates: {
    badge: 'SNYDER NOTATION · BOX 1',
    captionEn: 'Marking digits that appear in only 2 spots per Box locks {4,6} at R1C1 and R1C2 immediately.',
    captionVi: 'Ghi Snyder khi 1 số chỉ có 2 chỗ trong Box 1 giúp khóa ngay cặp {4,6} tại R1C1 và R1C2.',
    shadedBoxes: [0],
    cells: [
      { r: 0, c: 0, cands: [4, 6], accentCands: [4, 6], bg: 'focus' },
      { r: 0, c: 1, cands: [4, 6], accentCands: [4, 6], bg: 'focus' },
      { r: 0, c: 2, given: 1 },
      { r: 1, c: 0, given: 9 },
      { r: 1, c: 1, cands: [2, 8], bg: 'unit' },
      { r: 1, c: 2, given: 5 },
      { r: 2, c: 0, given: 3 },
      { r: 2, c: 1, given: 7 },
      { r: 2, c: 2, cands: [2, 8], bg: 'unit' },
    ],
  },
  sd_01_direct_elim: {
    badge: 'PEER CLEANUP · CASCADE',
    captionEn: 'Placing 5 at R3C3 cleans candidate 5 along Row 3 → R3C7 drops {5̶,8} to reveal Naked Single 8.',
    captionVi: 'Điền 5 vào R3C3 xóa candidate 5 dọc Hàng 3 → R3C7 từ {5̶,8} lộ ngay Naked Single 8.',
    shadedRows: [2],
    shadedCols: [2],
    shadedBoxes: [0],
    cells: [
      { r: 2, c: 2, placed: 5, bg: 'focus' },
      { r: 2, c: 6, cands: [5, 8], strike: [5], accentCands: [8], bg: 'sage' },
      { r: 5, c: 2, cands: [2, 5], strike: [5], bg: 'unit' },
      { r: 0, c: 1, cands: [4, 5], strike: [5], bg: 'unit' },
    ],
    rays: [{ r1: 2, c1: 2, r2: 2, c2: 6, kind: 'elim' }],
  },
  sd_02_pointing: {
    badge: 'LOCKED CANDIDATES TYPE 1 · POINTING',
    captionEn: 'Digit 3 in Box 1 only fits R2C1 & R2C3 (Row 2) → eliminates 3̶ from Box 2 & Box 3 on Row 2.',
    captionVi: 'Số 3 trong Box 1 chỉ đứng được ở R2C1 & R2C3 (Hàng 2) → loại 3̶ khỏi Box 2 & Box 3 trên Hàng 2.',
    shadedRows: [1],
    shadedBoxes: [0],
    cells: [
      { r: 1, c: 0, cands: [3, 7], accentCands: [3], bg: 'focus' },
      { r: 1, c: 2, cands: [3, 9], accentCands: [3], bg: 'focus' },
      { r: 1, c: 4, cands: [3, 6], strike: [3], bg: 'danger' },
      { r: 1, c: 7, cands: [3, 8], strike: [3], bg: 'danger' },
      { r: 0, c: 0, given: 4 },
      { r: 2, c: 1, given: 1 },
    ],
    rays: [{ r1: 1, c1: 0, r2: 1, c2: 8, kind: 'elim' }],
  },
  sd_02_claiming: {
    badge: 'LOCKED CANDIDATES TYPE 2 · CLAIMING',
    captionEn: 'On Col 7, digit 8 appears only in R1C7 & R3C7 (Box 3) → Box 3 claims 8, clearing R2C8 & R2C9.',
    captionVi: 'Trên Cột 7, số 8 chỉ có ở R1C7 & R3C7 (cùng Box 3) → xóa ứng viên 8̶ ở các ô khác trong Box 3.',
    shadedCols: [6],
    shadedBoxes: [2],
    cells: [
      { r: 0, c: 6, cands: [2, 8], accentCands: [8], bg: 'focus' },
      { r: 2, c: 6, cands: [5, 8], accentCands: [8], bg: 'focus' },
      { r: 1, c: 7, cands: [4, 8], strike: [8], bg: 'danger' },
      { r: 1, c: 8, cands: [1, 8], strike: [8], bg: 'danger' },
      { r: 4, c: 6, given: 9 },
      { r: 7, c: 6, given: 3 },
    ],
    rays: [
      { r1: 0, c1: 6, r2: 1, c2: 7, kind: 'elim' },
      { r1: 2, c1: 6, r2: 1, c2: 8, kind: 'elim' },
    ],
  },
  sd_02_naked_subsets: {
    badge: 'NAKED TRIPLE · {2, 5, 9}',
    captionEn: 'Row 6 cells R6C1={2,5}, R6C4={5,9}, R6C8={2,5,9} lock {2,5,9} → strike them from other Row 6 cells.',
    captionVi: 'Trên Hàng 6, 3 ô {2,5}, {5,9}, {2,5,9} khóa bộ 3 số → xóa {2̶,5̶,9̶} khỏi các ô còn lại trên Hàng 6.',
    shadedRows: [5],
    cells: [
      { r: 5, c: 0, cands: [2, 5], accentCands: [2, 5], bg: 'focus' },
      { r: 5, c: 3, cands: [5, 9], accentCands: [5, 9], bg: 'focus' },
      { r: 5, c: 7, cands: [2, 5, 9], accentCands: [2, 5, 9], bg: 'focus' },
      { r: 5, c: 1, cands: [1, 2, 7], strike: [2], bg: 'danger' },
      { r: 5, c: 5, cands: [3, 5, 9], strike: [5, 9], bg: 'danger' },
      { r: 5, c: 6, given: 4 },
    ],
  },
  sd_02_hidden_subsets: {
    badge: 'HIDDEN PAIR · {1, 7} IN BOX 9',
    captionEn: 'In Box 9, digits 1 & 7 only exist in R7C8 and R9C9 → remove extraneous 4̶, 6̶, 9̶ from both cells.',
    captionVi: 'Trong Box 9, số 1 và 7 chỉ xuất hiện ở R7C8 và R9C9 → xóa các ứng viên thừa 4̶, 6̶, 9̶ khỏi 2 ô này.',
    shadedBoxes: [8],
    cells: [
      { r: 6, c: 7, cands: [1, 4, 7, 9], accentCands: [1, 7], strike: [4, 9], bg: 'focus' },
      { r: 8, c: 8, cands: [1, 6, 7], accentCands: [1, 7], strike: [6], bg: 'focus' },
      { r: 6, c: 6, cands: [4, 6], bg: 'unit' },
      { r: 7, c: 6, cands: [6, 9], bg: 'unit' },
      { r: 7, c: 7, given: 2 },
      { r: 8, c: 7, given: 5 },
    ],
  },
  sd_02_xwing: {
    badge: 'BASIC FISH · X-WING 2×2 ON DIGIT 6',
    captionEn: 'Row 2 & Row 7 restrict digit 6 to Columns 2 & 8 → eliminates 6̶ everywhere else in Col 2 & Col 8.',
    captionVi: 'Số 6 ở Hàng 2 & Hàng 7 đều khóa vào Cột 2 & Cột 8 → xóa toàn bộ 6̶ ở các ô khác thuộc 2 Cột này.',
    shadedRows: [1, 6],
    shadedCols: [1, 7],
    cells: [
      { r: 1, c: 1, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 1, c: 7, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 6, c: 1, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 6, c: 7, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 3, c: 1, cands: [2, 6], strike: [6], bg: 'danger' },
      { r: 4, c: 7, cands: [4, 6], strike: [6], bg: 'danger' },
      { r: 8, c: 1, cands: [1, 6], strike: [6], bg: 'danger' },
    ],
    rays: [
      { r1: 1, c1: 1, r2: 6, c2: 7, kind: 'strong' },
      { r1: 1, c1: 7, r2: 6, c2: 1, kind: 'strong' },
      { r1: 1, c1: 1, r2: 1, c2: 7, kind: 'weak' },
      { r1: 6, c1: 1, r2: 6, c2: 7, kind: 'weak' },
    ],
  },
  sd_02_swordfish: {
    badge: 'BASIC FISH · SWORDFISH 3×3 ON DIGIT 4',
    captionEn: 'Rows 1, 4, 8 contain 4 only inside Columns {1, 5, 9} → eliminates 4̶ elsewhere along C1, C5, C9.',
    captionVi: 'Số 4 ở Hàng 1, 4, 8 gói gọn trong 3 Cột {C1, C5, C9} → loại 4̶ khỏi mọi ô khác thuộc 3 cột này.',
    shadedCols: [0, 4, 8],
    cells: [
      { r: 0, c: 0, cands: [4], accentCands: [4], bg: 'focus' },
      { r: 0, c: 4, cands: [4], accentCands: [4], bg: 'focus' },
      { r: 3, c: 4, cands: [4], accentCands: [4], bg: 'focus' },
      { r: 3, c: 8, cands: [4], accentCands: [4], bg: 'focus' },
      { r: 7, c: 0, cands: [4], accentCands: [4], bg: 'focus' },
      { r: 7, c: 8, cands: [4], accentCands: [4], bg: 'focus' },
      { r: 5, c: 0, cands: [2, 4], strike: [4], bg: 'danger' },
      { r: 6, c: 4, cands: [4, 7], strike: [4], bg: 'danger' },
      { r: 1, c: 8, cands: [4, 9], strike: [4], bg: 'danger' },
    ],
    rays: [
      { r1: 0, c1: 0, r2: 0, c2: 4, kind: 'strong' },
      { r1: 0, c1: 4, r2: 3, c2: 4, kind: 'weak' },
      { r1: 3, c1: 4, r2: 3, c2: 8, kind: 'strong' },
      { r1: 3, c1: 8, r2: 7, c2: 8, kind: 'weak' },
      { r1: 7, c1: 8, r2: 7, c2: 0, kind: 'strong' },
      { r1: 7, c1: 0, r2: 0, c2: 0, kind: 'weak' },
    ],
  },
  sd_02_xy_xyz_wing: {
    badge: 'BENT TRIPLE · XY-WING ON {3, 5, 8}',
    captionEn: 'Pivot R4C4={3,8} sees Pincer R4C9={3,5} & R6C5={8,5} → cells seeing both pincers (R4C5, R4C6) lose 5̶.',
    captionVi: 'Trục R4C4={3,8} nhìn thấy 2 cánh R4C9={3,5} & R6C5={8,5} → R4C5, R4C6 nhìn thấy cả 2 cánh bị loại 5̶.',
    shadedBoxes: [4],
    cells: [
      { r: 3, c: 3, cands: [3, 8], accentCands: [3, 8], bg: 'focus' },
      { r: 3, c: 8, cands: [3, 5], accentCands: [5], bg: 'blue' },
      { r: 5, c: 4, cands: [5, 8], accentCands: [5], bg: 'blue' },
      { r: 3, c: 4, cands: [2, 5], strike: [5], bg: 'danger' },
      { r: 3, c: 5, cands: [1, 5], strike: [5], bg: 'danger' },
    ],
    rays: [
      { r1: 3, c1: 3, r2: 3, c2: 8, kind: 'strong' },
      { r1: 3, c1: 3, r2: 5, c2: 4, kind: 'strong' },
      { r1: 3, c1: 8, r2: 3, c2: 4, kind: 'elim' },
      { r1: 5, c1: 4, r2: 3, c2: 5, kind: 'elim' },
    ],
  },
  sd_02_skyscraper_kite: {
    badge: 'TURBOT FISH · SKYSCRAPER ON 9',
    captionEn: 'Shared base C2 connects R1C2–R8C2; one of the two tops R1C6 or R8C7 must be 9 → eliminates R2C7.',
    captionVi: 'Đáy C2 nối R1C2–R8C2; ít nhất 1 trong 2 đỉnh R1C6 hoặc R8C7 phải là 9 → loại 9̶ ở ô R2C7 giao nhau.',
    shadedCols: [1],
    cells: [
      { r: 0, c: 1, cands: [9], accentCands: [9], bg: 'blue' },
      { r: 0, c: 5, cands: [9], accentCands: [9], bg: 'focus' },
      { r: 7, c: 1, cands: [9], accentCands: [9], bg: 'blue' },
      { r: 7, c: 6, cands: [9], accentCands: [9], bg: 'focus' },
      { r: 1, c: 6, cands: [3, 9], strike: [9], bg: 'danger' },
      { r: 6, c: 5, cands: [4, 9], strike: [9], bg: 'danger' },
    ],
    rays: [
      { r1: 0, c1: 1, r2: 0, c2: 5, kind: 'strong' },
      { r1: 0, c1: 1, r2: 7, c2: 1, kind: 'weak' },
      { r1: 7, c1: 1, r2: 7, c2: 6, kind: 'strong' },
      { r1: 0, c1: 5, r2: 1, c2: 6, kind: 'elim' },
      { r1: 7, c1: 6, r2: 1, c2: 6, kind: 'elim' },
    ],
  },
  sd_03_simple_coloring: {
    badge: 'SIMPLE COLORING · COLOR TRAP',
    captionEn: 'Conjugate chain alternates Blue & Amber. Cell R1C9 sees both Blue (R1C4) & Amber (R7C9) → cannot be 2.',
    captionVi: 'Tô màu luân phiên Xanh / Vàng theo cặp mạnh. Ô R1C9 nhìn thấy cả Xanh (R1C4) & Vàng (R7C9) → loại 2̶.',
    cells: [
      { r: 0, c: 3, cands: [2], accentCands: [2], bg: 'blue' },
      { r: 4, c: 3, cands: [2], accentCands: [2], bg: 'amber' },
      { r: 4, c: 6, cands: [2], accentCands: [2], bg: 'blue' },
      { r: 6, c: 8, cands: [2], accentCands: [2], bg: 'amber' },
      { r: 0, c: 8, cands: [2, 6], strike: [2], bg: 'danger' },
    ],
    rays: [
      { r1: 0, c1: 3, r2: 4, c2: 3, kind: 'strong', color: '#60A5FA' },
      { r1: 4, c1: 3, r2: 4, c2: 6, kind: 'strong', color: '#EAB308' },
      { r1: 4, c1: 6, r2: 6, c2: 8, kind: 'strong', color: '#B99B79' },
      { r1: 0, c1: 3, r2: 0, c2: 8, kind: 'elim' },
      { r1: 6, c1: 8, r2: 0, c2: 8, kind: 'elim' },
    ],
  },
  sd_03_aic: {
    badge: 'ALTERNATING INFERENCE CHAIN · EUREKA',
    captionEn: '(R2C3=5)==(R2C3=8)--(R2C9=8)==(R7C9=8)--(R7C4=8)==(R7C4=5) → R2C4 & R7C3 cannot contain 5.',
    captionVi: 'Chuỗi luân phiên (R2C3=5)==(8)--(R2C9=8)==(R7C9=8)--(R7C4=8)==(5) → loại 5̶ tại R2C4 & R7C3.',
    cells: [
      { r: 1, c: 2, cands: [5, 8], accentCands: [5], bg: 'focus' },
      { r: 1, c: 8, cands: [3, 8], accentCands: [8], bg: 'blue' },
      { r: 6, c: 8, cands: [2, 8], accentCands: [8], bg: 'blue' },
      { r: 6, c: 3, cands: [5, 8], accentCands: [5], bg: 'focus' },
      { r: 1, c: 3, cands: [4, 5], strike: [5], bg: 'danger' },
      { r: 6, c: 2, cands: [5, 9], strike: [5], bg: 'danger' },
    ],
    rays: [
      { r1: 1, c1: 2, r2: 1, c2: 8, kind: 'weak' },
      { r1: 1, c1: 8, r2: 6, c2: 8, kind: 'strong' },
      { r1: 6, c1: 8, r2: 6, c2: 3, kind: 'weak' },
      { r1: 1, c1: 2, r2: 1, c2: 3, kind: 'elim' },
      { r1: 6, c1: 3, r2: 1, c2: 3, kind: 'elim' },
    ],
  },
  sd_03_forcing_chains: {
    badge: 'CELL FORCING CHAIN · CONVERGENCE',
    captionEn: 'Both branches from R5C5={2,7} force the conclusion: R2C8=9 → converges onto target R5C8≠9.',
    captionVi: 'Từ ô nguồn R5C5={2,7}, cả 2 nhánh suy luận (=2 và =7) đều hội tụ tại ô đích → khóa kết quả 100%.',
    cells: [
      { r: 4, c: 4, cands: [2, 7], accentCands: [2, 7], bg: 'focus' },
      { r: 4, c: 7, cands: [4, 9], strike: [9], bg: 'danger' },
      { r: 1, c: 4, cands: [3, 7], bg: 'blue' },
      { r: 1, c: 7, cands: [7, 9], bg: 'blue' },
      { r: 7, c: 4, cands: [2, 6], bg: 'amber' },
    ],
    rays: [
      { r1: 4, c1: 4, r2: 1, c2: 4, kind: 'strong', color: '#60A5FA' },
      { r1: 1, c1: 4, r2: 1, c2: 7, kind: 'weak', color: '#60A5FA' },
      { r1: 1, c1: 7, r2: 4, c2: 7, kind: 'elim' },
      { r1: 4, c1: 4, r2: 4, c2: 7, kind: 'elim' },
    ],
  },
  sd_03_unique_rectangle: {
    badge: 'UNIQUENESS · UR TYPE 1',
    captionEn: 'Three corners have {4,9}; roof R5C3={4̶,9̶,7} must reject 4 & 9 to avoid deadly two-solution loop → 7.',
    captionVi: '3 góc là {4,9} trên 2 Box; góc thứ 4 R5C3={4̶,9̶,7} không được phép thành Deadly Pattern → bắt buộc là 7.',
    shadedBoxes: [0, 3],
    cells: [
      { r: 0, c: 0, cands: [4, 9], accentCands: [4, 9], bg: 'blue' },
      { r: 0, c: 2, cands: [4, 9], accentCands: [4, 9], bg: 'blue' },
      { r: 4, c: 0, cands: [4, 9], accentCands: [4, 9], bg: 'blue' },
      { r: 4, c: 2, placed: 7, cands: [4, 7, 9], strike: [4, 9], accentCands: [7], bg: 'sage' },
    ],
    rays: [
      { r1: 0, c1: 0, r2: 0, c2: 2, kind: 'weak' },
      { r1: 0, c1: 0, r2: 4, c2: 0, kind: 'weak' },
      { r1: 0, c1: 2, r2: 4, c2: 2, kind: 'weak' },
      { r1: 4, c1: 0, r2: 4, c2: 2, kind: 'weak' },
    ],
  },
  sd_03_bug_plus_1: {
    badge: 'BIVALUE UNIVERSAL GRAVE + 1',
    captionEn: 'Every empty cell has 2 candidates except R6C6={2,5,8}; digit 8 appears 3 times in Row 6 → R6C6 = 8.',
    captionVi: 'Mọi ô trống chỉ còn 2 số trừ R6C6={2,5,8}. Trong Hàng 6, số 8 xuất hiện 3 lần → R6C6 bắt buộc là 8.',
    shadedRows: [5],
    cells: [
      { r: 5, c: 0, cands: [2, 8], bg: 'blue' },
      { r: 5, c: 2, cands: [2, 5], bg: 'unit' },
      { r: 5, c: 5, placed: 8, cands: [2, 5, 8], accentCands: [8], bg: 'sage' },
      { r: 5, c: 7, cands: [5, 8], bg: 'blue' },
      { r: 2, c: 5, cands: [3, 8], bg: 'unit' },
      { r: 7, c: 2, cands: [1, 4], bg: 'unit' },
    ],
  },
  sd_03_als: {
    badge: 'ALMOST LOCKED SETS · ALS-XZ',
    captionEn: 'ALS A {1,3,7} and ALS B {3,5,7} share restricted common 3 (gold bridge) → eliminates 7̶ in common peers.',
    captionVi: 'ALS A {1,3,7} và ALS B {3,5,7} nối nhau qua ứng viên chung bị giới hạn X=3 → loại 7̶ ở vùng giao.',
    cells: [
      { r: 1, c: 1, cands: [1, 3], accentCands: [3], bg: 'blue' },
      { r: 1, c: 2, cands: [1, 7], accentCands: [7], bg: 'blue' },
      { r: 4, c: 1, cands: [3, 5], accentCands: [3], bg: 'amber' },
      { r: 4, c: 5, cands: [5, 7], accentCands: [7], bg: 'amber' },
      { r: 4, c: 2, cands: [6, 7], strike: [7], bg: 'danger' },
      { r: 1, c: 5, cands: [4, 7], strike: [7], bg: 'danger' },
    ],
    rays: [
      { r1: 1, c1: 1, r2: 4, c2: 1, kind: 'strong' },
      { r1: 1, c1: 2, r2: 4, c2: 2, kind: 'elim' },
      { r1: 4, c1: 5, r2: 1, c2: 5, kind: 'elim' },
    ],
  },
  sd_03_finned_fish: {
    badge: 'FINNED X-WING · BOX 9 RESTRICTION',
    captionEn: 'Extra candidate 5 (Fin) at R8C8 restricts X-Wing elimination on Col 7 strictly inside Box 9 (R7C7, R9C7).',
    captionVi: 'Ứng viên dư 5 (Vây/Fin) ở R8C8 thu hẹp vùng loại của Cột 7 về đúng Box 9: chỉ xóa 5̶ tại R7C7 & R9C7.',
    shadedRows: [1, 7],
    shadedBoxes: [8],
    cells: [
      { r: 1, c: 0, cands: [5], accentCands: [5], bg: 'focus' },
      { r: 1, c: 6, cands: [5], accentCands: [5], bg: 'focus' },
      { r: 7, c: 0, cands: [5], accentCands: [5], bg: 'focus' },
      { r: 7, c: 6, cands: [5], accentCands: [5], bg: 'focus' },
      { r: 7, c: 7, cands: [5], accentCands: [5], bg: 'fin' },
      { r: 6, c: 6, cands: [3, 5], strike: [5], bg: 'danger' },
      { r: 8, c: 6, cands: [5, 9], strike: [5], bg: 'danger' },
    ],
    rays: [
      { r1: 1, c1: 0, r2: 1, c2: 6, kind: 'strong' },
      { r1: 7, c1: 0, r2: 7, c2: 7, kind: 'strong' },
      { r1: 1, c1: 0, r2: 7, c2: 0, kind: 'weak' },
    ],
  },
  sd_03_sue_de_coq: {
    badge: 'SUE DE COQ · TWO-SECTOR SUBSET',
    captionEn: 'Intersection {1,2,3,4} splits with Row cell {1,2} & Box cell {3,4} → locks {1,2} in Row 1, {3,4} in Box 1.',
    captionVi: 'Giao điểm R1C1-R1C2={1,2,3,4} kết hợp R1C8={1,2} và R2C3={3,4} → khóa đồng thời Hàng 1 & Box 1.',
    shadedRows: [0],
    shadedBoxes: [0],
    cells: [
      { r: 0, c: 0, cands: [1, 2, 3], accentCands: [1, 2, 3], bg: 'focus' },
      { r: 0, c: 1, cands: [2, 3, 4], accentCands: [2, 3, 4], bg: 'focus' },
      { r: 0, c: 7, cands: [1, 2], accentCands: [1, 2], bg: 'blue' },
      { r: 1, c: 2, cands: [3, 4], accentCands: [3, 4], bg: 'amber' },
      { r: 0, c: 4, cands: [1, 8], strike: [1], bg: 'danger' },
      { r: 2, c: 0, cands: [4, 7], strike: [4], bg: 'danger' },
    ],
  },
  sd_04_board_structure: {
    badge: 'GLOBAL TOPOLOGY · STRONG-LINK GRAPH',
    captionEn: 'Viewing conjugate pairs & bi-value hubs as one connected graph spotlights breakthrough nodes immediately.',
    captionVi: 'Nhìn bàn cờ như đồ thị liên kết mạnh–yếu giúp nhận diện ngay chữ số xương sống để mở khóa thế cờ.',
    cells: [
      { r: 0, c: 2, cands: [8], accentCands: [8], bg: 'focus' },
      { r: 0, c: 6, cands: [8], accentCands: [8], bg: 'blue' },
      { r: 3, c: 6, cands: [8], accentCands: [8], bg: 'focus' },
      { r: 3, c: 1, cands: [8], accentCands: [8], bg: 'blue' },
      { r: 6, c: 1, cands: [8], accentCands: [8], bg: 'focus' },
      { r: 6, c: 8, cands: [8], accentCands: [8], bg: 'amber' },
      { r: 2, c: 8, cands: [8], accentCands: [8], bg: 'amber' },
    ],
    rays: [
      { r1: 0, c1: 2, r2: 0, c2: 6, kind: 'strong' },
      { r1: 0, c1: 6, r2: 3, c2: 6, kind: 'weak' },
      { r1: 3, c1: 6, r2: 3, c2: 1, kind: 'strong' },
      { r1: 3, c1: 1, r2: 6, c2: 1, kind: 'weak' },
      { r1: 6, c1: 1, r2: 6, c2: 8, kind: 'strong' },
      { r1: 6, c1: 8, r2: 2, c2: 8, kind: 'weak' },
    ],
  },
  sd_04_combined_elimination: {
    badge: 'CASCADING DEDUCTION · CHAIN REACTION',
    captionEn: 'An XY-Wing removes 6̶ from Col 4 → leaving only 2 candidates of 6 in Col 4, triggering an X-Wing next!',
    captionVi: 'Xóa 6̶ nhờ XY-Wing biến Cột 4 từ 3 vị trí xuống còn 2 (tạo Strong Link mới) → mở khóa X-Wing kế tiếp.',
    shadedCols: [3, 7],
    cells: [
      { r: 2, c: 3, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 2, c: 7, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 6, c: 3, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 6, c: 7, cands: [6], accentCands: [6], bg: 'focus' },
      { r: 4, c: 3, cands: [4, 6], strike: [6], bg: 'danger' },
      { r: 5, c: 7, cands: [1, 6], strike: [6], bg: 'danger' },
    ],
    rays: [
      { r1: 2, c1: 3, r2: 6, c2: 7, kind: 'strong' },
      { r1: 2, c1: 7, r2: 6, c2: 3, kind: 'strong' },
    ],
  },
  sd_04_contradiction: {
    badge: 'PROOF BY CONTRADICTION · R3C4 ≠ 7',
    captionEn: 'Assuming R3C4=7 forces R3C9=2 → R8C9=5 → Box 9 loses all 7 spots (Contradiction!) ∴ R3C4 ≠ 7.',
    captionVi: 'Giả sử R3C4=7 kéo theo R3C9=2 → R8C9=5 → Box 9 hết chỗ cho số 7 (Mâu thuẫn!) → Chứng minh R3C4 ≠ 7.',
    shadedBoxes: [8],
    cells: [
      { r: 2, c: 3, cands: [4, 7], strike: [7], bg: 'danger' },
      { r: 2, c: 8, cands: [2, 7], bg: 'amber' },
      { r: 7, c: 8, cands: [2, 5], bg: 'amber' },
      { r: 6, c: 6, given: 1 },
      { r: 6, c: 7, given: 9 },
      { r: 8, c: 7, given: 3 },
      { r: 8, c: 8, given: 6 },
    ],
    rays: [
      { r1: 2, c1: 3, r2: 2, c2: 8, kind: 'strong', color: '#EAB308' },
      { r1: 2, c1: 8, r2: 7, c2: 8, kind: 'weak', color: '#EAB308' },
      { r1: 7, c1: 8, r2: 7, c2: 6, kind: 'elim' },
    ],
  },
  sd_04_chain_construction: {
    badge: 'EUREKA SYNTAX · (A=B) - (B=C) - (C=D)',
    captionEn: 'Valid AIC always starts & ends on Strong Links (=) alternating strictly with Weak Links (-) between units.',
    captionVi: 'Chuỗi AIC chuẩn Eureka luôn mở đầu và kết thúc bằng Strong Link (=), xen kẽ chặt chẽ với Weak Link (-).',
    cells: [
      { r: 1, c: 1, cands: [3, 9], accentCands: [3], bg: 'focus' },
      { r: 1, c: 6, cands: [2, 9], accentCands: [9], bg: 'blue' },
      { r: 5, c: 6, cands: [2, 7], accentCands: [7], bg: 'blue' },
      { r: 5, c: 1, cands: [3, 7], accentCands: [3], bg: 'focus' },
      { r: 3, c: 1, cands: [3, 5], strike: [3], bg: 'danger' },
    ],
    rays: [
      { r1: 1, c1: 1, r2: 1, c2: 6, kind: 'weak' },
      { r1: 1, c1: 6, r2: 5, c2: 6, kind: 'strong' },
      { r1: 5, c1: 6, r2: 5, c2: 1, kind: 'weak' },
      { r1: 1, c1: 1, r2: 3, c2: 1, kind: 'elim' },
      { r1: 5, c1: 1, r2: 3, c2: 1, kind: 'elim' },
    ],
  },
  sd_04_search_optimization: {
    badge: 'COGNITIVE SEARCH HIERARCHY',
    captionEn: 'Scan in ascending cognitive cost: Singles → Locked → Pairs → Fish/Skyscraper → XY-Wing → Coloring & AIC.',
    captionVi: 'Quét theo thứ tự chi phí não tăng dần: Singles → Pointing/Claiming → Subsets → Fish → Wings → AIC.',
    cells: [
      { r: 0, c: 0, given: 1, bg: 'sage' },
      { r: 0, c: 1, cands: [2, 4], accentCands: [2, 4], bg: 'blue' },
      { r: 1, c: 1, cands: [2, 4], accentCands: [2, 4], bg: 'blue' },
      { r: 4, c: 4, cands: [5, 7], accentCands: [5], bg: 'focus' },
      { r: 4, c: 8, cands: [5, 9], accentCands: [5], bg: 'focus' },
      { r: 8, c: 4, cands: [7, 9], accentCands: [9], bg: 'amber' },
      { r: 8, c: 8, cands: [4, 9], strike: [9], bg: 'danger' },
    ],
    rays: [
      { r1: 4, c1: 4, r2: 4, c2: 8, kind: 'strong' },
      { r1: 4, c1: 4, r2: 8, c2: 4, kind: 'weak' },
      { r1: 8, c1: 4, r2: 8, c2: 8, kind: 'elim' },
    ],
  },
  sd_04_uniqueness_analysis: {
    badge: 'BOTTLENECK STEP · SE / HODOKU PEAK',
    captionEn: 'Even an Expert puzzle resolves 70 cells by Singles before hitting the single key Bottleneck step (#71).',
    captionVi: 'Một đề Expert có thể chạy mượt 70 ô đầu bằng Singles nhưng dừng tại nút thắt #71 đòi hỏi 1 đòn AIC/Wing.',
    shadedBoxes: [4],
    cells: [
      { r: 3, c: 3, given: 6 },
      { r: 3, c: 4, given: 1 },
      { r: 3, c: 5, given: 8 },
      { r: 4, c: 3, given: 4 },
      { r: 4, c: 4, placed: 9, cands: [3, 9], accentCands: [9], bg: 'sage' },
      { r: 4, c: 5, given: 2 },
      { r: 5, c: 3, given: 7 },
      { r: 5, c: 4, given: 5 },
      { r: 5, c: 5, given: 3 },
    ],
  },
};

function getBgColor(bg: CellSpec['bg'], inBoxShade: boolean): string {
  switch (bg) {
    case 'focus':
      return 'rgba(203, 168, 106, 0.24)';
    case 'sage':
      return 'rgba(52, 211, 153, 0.22)';
    case 'blue':
      return 'rgba(96, 165, 250, 0.20)';
    case 'amber':
      return 'rgba(234, 179, 8, 0.20)';
    case 'danger':
      return 'rgba(239, 68, 68, 0.18)';
    case 'fin':
      return 'rgba(194, 123, 118, 0.28)';
    case 'unit':
      return 'rgba(203, 168, 106, 0.09)';
    default:
      return inBoxShade ? 'rgba(203, 168, 106, 0.06)' : '#101318';
  }
}

export function SudokuTechniqueIllustration({ techId }: { techId: string }) {
  const { t } = useLanguage();
  const spec = DIAGRAM_SPECS[techId] || DIAGRAM_SPECS.sd_01_rules;

  const cellMap = new Map<string, CellSpec>();
  for (const c of spec.cells) {
    cellMap.set(`${c.r}:${c.c}`, c);
  }

  const size = 288; // 9 * 32px crisp SVG coordinate system
  const step = 32;

  return (
    <div
      className="rounded-[12px] p-4 sm:p-5 space-y-3"
      style={{ backgroundColor: '#12151C', border: '1px solid rgba(203, 168, 106, 0.22)' }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="metadata text-[10px] uppercase tracking-[0.14em]" style={{ color: '#cba86a' }}>
          {t('VISUAL BOARD DIAGRAM', 'HÌNH MINH HỌA TRÊN BẢNG 9×9')}
        </span>
        <span
          className="metadata text-[9.5px] uppercase px-2 py-0.5 rounded-[5px]"
          style={{ backgroundColor: 'rgba(203, 168, 106, 0.12)', color: '#cbd5e1', border: '1px solid rgba(203, 168, 106, 0.25)' }}
        >
          {spec.badge}
        </span>
      </div>

      {/* Centered Crisp 9x9 Vector Board */}
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[330px] aspect-square rounded-[8px] shadow-inner select-none"
          style={{ backgroundColor: '#0C0E13', border: '1.5px solid rgba(203, 168, 106, 0.38)' }}
          role="img"
          aria-label={t(spec.captionEn, spec.captionVi)}
        >
          {/* Cells */}
          {Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (__, c) => {
              const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
              const isShaded =
                spec.shadedRows?.includes(r) ||
                spec.shadedCols?.includes(c) ||
                spec.shadedBoxes?.includes(boxIdx);
              const cell = cellMap.get(`${r}:${c}`);
              const x = c * step;
              const y = r * step;
              const fill = getBgColor(cell?.bg, Boolean(isShaded));

              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={x}
                    y={y}
                    width={step}
                    height={step}
                    fill={fill}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={0.6}
                  />

                  {/* Given Digit */}
                  {cell?.given !== undefined && (
                    <text
                      x={x + step / 2}
                      y={y + step / 2 + 4.5}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="700"
                      fontFamily="monospace"
                      fill="#E2E8F0"
                    >
                      {cell.given}
                    </text>
                  )}

                  {/* Deduced Placed Digit */}
                  {cell?.placed !== undefined && (
                    <>
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={step - 4}
                        height={step - 4}
                        rx={4}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={1.4}
                      />
                      <text
                        x={x + step / 2}
                        y={y + step / 2 + 5}
                        textAnchor="middle"
                        fontSize="15"
                        fontWeight="800"
                        fontFamily="monospace"
                        fill="#34d399"
                      >
                        {cell.placed}
                      </text>
                    </>
                  )}

                  {/* Candidates & Strikeouts (when no given/placed overlays full cell) */}
                  {cell?.placed === undefined && cell?.given === undefined && cell?.cands && (
                    <g>
                      {cell.cands.slice(0, 4).map((cand, idx) => {
                        const cols = cell.cands!.length <= 2 ? 2 : 2;
                        const cx = x + 9 + (idx % cols) * 14;
                        const cy =
                          cell.cands!.length <= 2
                            ? y + step / 2 + 3.5
                            : y + 11.5 + Math.floor(idx / 2) * 12;
                        const isStruck = cell.strike?.includes(cand);
                        const isAcc = cell.accentCands?.includes(cand);
                        return (
                          <g key={cand}>
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              fontSize={cell.cands!.length === 1 ? '12' : '9.5'}
                              fontWeight={isAcc || isStruck ? '700' : '500'}
                              fontFamily="monospace"
                              fill={isStruck ? '#f87171' : isAcc ? '#e4c489' : '#94a3b8'}
                            >
                              {cand}
                            </text>
                            {isStruck && (
                              <line
                                x1={cx - 4.5}
                                y1={cy - 3}
                                x2={cx + 4.5}
                                y2={cy - 3}
                                stroke="#f87171"
                                strokeWidth={1.4}
                              />
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* 3x3 Thick Box Borders */}
          {[3, 6].map((idx) => (
            <React.Fragment key={idx}>
              <line
                x1={idx * step}
                y1={0}
                x2={idx * step}
                y2={size}
                stroke="rgba(203, 168, 106, 0.55)"
                strokeWidth={1.6}
              />
              <line
                x1={0}
                y1={idx * step}
                x2={size}
                y2={idx * step}
                stroke="rgba(203, 168, 106, 0.55)"
                strokeWidth={1.6}
              />
            </React.Fragment>
          ))}

          {/* Deduction Rays & Strong/Weak Links */}
          {spec.rays?.map((ray, i) => {
            const x1 = ray.c1 * step + step / 2;
            const y1 = ray.r1 * step + step / 2;
            const x2 = ray.c2 * step + step / 2;
            const y2 = ray.r2 * step + step / 2;
            const stroke =
              ray.color ||
              (ray.kind === 'strong'
                ? '#cba86a'
                : ray.kind === 'weak'
                ? '#94a3b8'
                : ray.kind === 'elim'
                ? '#f87171'
                : '#60a5fa');
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={ray.kind === 'strong' ? 1.8 : 1.3}
                strokeDasharray={
                  ray.kind === 'weak' || ray.kind === 'elim' || ray.kind === 'ray' ? '4 3' : undefined
                }
                opacity={0.82}
              />
            );
          })}
        </svg>
      </div>

      {/* Concise Legend + Bilingual Explanation */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center justify-center gap-3 metadata text-[9.5px] text-[#94a3b8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#cba86a]/60 inline-block" />
            {t('Focus / Hinge', 'Trọng tâm / Bản lề')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#34d399]/60 inline-block" />
            {t('Proven Answer', 'Đáp án chứng minh')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#f87171]/60 inline-block" />
            {t('Eliminated ✗', 'Loại bỏ ✗')}
          </span>
        </div>

        <p className="text-[12.5px] leading-relaxed text-center" style={{ color: 'var(--os-ivory-muted)' }}>
          {t(spec.captionEn, spec.captionVi)}
        </p>
      </div>
    </div>
  );
}
