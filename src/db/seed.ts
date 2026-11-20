import { db } from './database';
import type {
  ProfileState,
  CodeTopic,
  ChessModule,
  SudokuTechnique,
  WheelOption,
  Book,
  Story,
} from '../types';

const LEGACY_MOCK_TASK_IDS = [
  'tsk_starter_1',
  'tsk_starter_2',
  'tsk_starter_3',
  'tsk_starter_4',
  'tsk_starter_5',
];

const LEGACY_MOCK_WORKFLOW_IDS = [
  'wf_starter_1',
  'wf_mwoqh7zd_0vwaop4',
  'wf_mwot1l9m_tyr3w5b',
];

const LEGACY_MOCK_PSYCH_IDS = [
  'psy_starter_1',
  'psy_res_001',
];

export async function purgeLegacyMockSchedule(): Promise<void> {
  await db.tasks.bulkDelete(LEGACY_MOCK_TASK_IDS);
  await db.workflowLectures.bulkDelete(LEGACY_MOCK_WORKFLOW_IDS);
  await db.psychologyPosts.bulkDelete(LEGACY_MOCK_PSYCH_IDS);
  const excalidrawLogs = await db.hobbyLogs
    .filter(
      (l) =>
        l.id === 'hb_mwoqjkee_30ht9ao' ||
        l.title.startsWith('Sơ đồ / Bản vẽ:') ||
        l.details.includes('Excalidraw Canvas')
    )
    .primaryKeys();
  if (excalidrawLogs.length > 0) {
    await db.hobbyLogs.bulkDelete(excalidrawLogs);
  }
}

function buildSudokuCurriculum(now: number): SudokuTechnique[] {
  return [
    // =========================================================================
    // 01. BEGINNER — Nền tảng (Easy – Medium)
    // Mục tiêu: hiểu luật, biết tìm số bằng suy luận trực tiếp.
    // =========================================================================
    {
      id: 'sd_01_rules',
      tier: 'basic',
      skillBranch: 'fundamentals',
      difficultyRange: 'Easy – Medium',
      name: '01. Luật Sudoku 9×9 & Cấu trúc 3 Đơn vị (Row · Column · Box)',
      summary:
        'Mỗi hàng ngang (Row), cột dọc (Column) và khối vuông 3×3 (Box) chứa đúng 9 chữ số từ 1–9 không trùng lặp. Mỗi ô là giao điểm đồng thời của 3 đơn vị (20 ô peer nhìn thấy nhau).',
      howToSpot:
        'Trước khi điền bất kỳ số nào, luôn kiểm tra cả 3 đơn vị giao tại ô đó (Hàng + Cột + Box 3×3). Quy tắc cốt lõi: Prove before you place.',
      example:
        'Ô R5C5 (tâm bàn cờ) chịu ràng buộc đồng thời từ Hàng 5, Cột 5 và Box 5 (R4..6, C4..6).',
      mastery: 'mastered',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_01_scanning',
      tier: 'basic',
      skillBranch: 'fundamentals',
      difficultyRange: 'Easy – Medium',
      name: '02. Scanning & Cross-Hatching (Quét hàng, cột và vùng)',
      summary:
        'Quét có hệ thống theo từng dải 3 khối ngang (Band) và 3 khối dọc (Stack) cho từng chữ số từ 1→9 để khoanh vùng vị trí bắt buộc của số đó.',
      howToSpot:
        'Chọn số xuất hiện nhiều nhất trên bàn cờ, chiếu các đường thẳng ngang/dọc xuyên qua các Box 3×3 lân cận để thu hẹp ô trống.',
      example:
        'Số 7 đã có ở Hàng 1 và Hàng 2 → trong Box 3 (góc trên phải), số 7 bắt buộc phải nằm ở Hàng 3.',
      mastery: 'mastered',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_01_hidden_single',
      tier: 'basic',
      skillBranch: 'fundamentals',
      difficultyRange: 'Easy – Medium',
      name: '03. Hidden Single (Ứng viên ẩn duy nhất trong vùng)',
      summary:
        'Một chữ số chỉ có thể nằm ở duy nhất 1 vị trí trong một Hàng, Cột hoặc Box 3×3 (dù ô đó có thể đang chứa nhiều ứng viên khác).',
      howToSpot:
        'Đặt câu hỏi: "Trong Box/Hàng/Cột này, số X có thể đứng ở đâu?" Nếu 8 vị trí kia đều bị chặn bởi số X ở đơn vị khác → vị trí còn lại chính là X.',
      example:
        'Trong Cột 4 còn 4 ô trống, nhưng 3 ô đã nhìn thấy số 9 ở các Box/Hàng tương ứng → ô thứ 4 bắt buộc là 9.',
      mastery: 'mastered',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_01_naked_single',
      tier: 'basic',
      skillBranch: 'fundamentals',
      difficultyRange: 'Easy – Medium',
      name: '04. Naked Single (Ô chỉ còn một ứng viên duy nhất)',
      summary:
        'Một ô trống đã nhìn thấy đủ 8 chữ số khác nhau từ Hàng, Cột và Box 3×3 của nó → chỉ còn đúng 1 ứng viên duy nhất có thể điền.',
      howToSpot:
        'Tập trung vào các ô nằm ở giao điểm của Hàng, Cột và Box đã điền từ 5–6 số trở lên, đếm từ 1→9 để tìm chữ số duy nhất chưa xuất hiện.',
      example:
        'Ô R2C8 nhìn thấy {1,2,3,4} trong Hàng 2, {5,6,7} trong Cột 8 và {8} trong Box 3 → R2C8 bắt buộc là 9.',
      mastery: 'mastered',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_01_candidates',
      tier: 'basic',
      skillBranch: 'fundamentals',
      difficultyRange: 'Easy – Medium',
      name: '05. Candidate Notes & Snyder Notation (Hệ thống ghi chú ứng viên)',
      summary:
        'Ghi chú kỷ luật các ứng viên có thể xuất hiện. Bắt đầu bằng Snyder Notation (chỉ ghi khi 1 số có đúng 2 vị trí trong 1 Box 3×3), sau đó mở rộng sang Full Candidates khi cần tìm chuỗi.',
      howToSpot:
        'Không ghi tràn lan ngay từ đầu. Ghi Snyder giúp mắt nhận diện ngay lập tức Pointing Pairs và Hidden Pairs khi 2 cặp số trùng đúng 2 ô.',
      example:
        'Nếu số 4 và số 6 đều chỉ xuất hiện ở đúng 2 ô R1C1 và R1C2 của Box 1 → khóa ngay cặp {4,6} tại 2 ô đó.',
      mastery: 'practicing',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_01_direct_elim',
      tier: 'basic',
      skillBranch: 'fundamentals',
      difficultyRange: 'Easy – Medium',
      name: '06. Loại trừ trực tiếp & Dọn ứng viên tức thì (Peer Cleanup)',
      summary:
        'Mỗi khi điền được 1 số chính thức vào ô, lập tức xóa ứng viên đó khỏi toàn bộ 20 ô peer (cùng Hàng, cùng Cột, cùng Box) và kiểm tra dây chuyền Singles mới sinh ra.',
      howToSpot:
        'Biến việc dọn pencil marks thành phản xạ kỷ luật để không bao giờ bỏ sót Naked Single vừa lộ diện.',
      example:
        'Điền số 5 vào R3C3 → xóa ngay candidate 5 ở Hàng 3, Cột 3, Box 1 → ô R3C7 từ {5,8} lộ ngay Naked Single 8.',
      mastery: 'mastered',
      notes: '',
      updatedAt: now,
    },

    // =========================================================================
    // 02. INTERMEDIATE — Kỹ thuật loại trừ (Medium – Hard)
    // Mục tiêu: nhìn ra quan hệ giữa nhiều ô và ứng viên.
    // =========================================================================
    {
      id: 'sd_02_pointing',
      tier: 'intermediate',
      skillBranch: 'elimination',
      difficultyRange: 'Medium – Hard',
      name: '07. Pointing Pairs / Triples (Locked Candidates Type 1)',
      summary:
        'Khi tất cả vị trí có thể của số X trong một Box 3×3 đều nằm thẳng hàng trên cùng 1 Hàng (hoặc Cột) → loại bỏ ứng viên X khỏi phần còn lại của Hàng (hoặc Cột) đó ngoài Box.',
      howToSpot:
        'Rà các ghi chú Snyder trong từng Box 3×3: hễ cặp ghi chú của số X nằm ngang hoặc dọc, phóng tia loại trừ dọc theo đường đó sang 2 Box kế bên.',
      example:
        'Trong Box 1, số 3 chỉ nằm ở R2C1 và R2C3 (cùng Hàng 2) → xóa toàn bộ ứng viên 3 ở Hàng 2 thuộc Box 2 và Box 3.',
      mastery: 'practicing',
      notes: 'Bước đầu tiên để bỏ hoàn toàn thói quen đoán mò.',
      updatedAt: now,
    },
    {
      id: 'sd_02_claiming',
      tier: 'intermediate',
      skillBranch: 'elimination',
      difficultyRange: 'Medium – Hard',
      name: '08. Box-Line Reduction / Claiming (Locked Candidates Type 2)',
      summary:
        'Khi tất cả vị trí có thể của số X trên một Hàng (hoặc Cột) đều nằm gọn trong cùng 1 Box 3×3 → loại bỏ ứng viên X khỏi các ô còn lại trong Box 3×3 đó.',
      howToSpot:
        'Quét từng Hàng/Cột: nếu số X trên Hàng 4 chỉ xuất hiện ở các cột C4, C5, C6 (thuộc Box 5) → Box 5 phải dành số X cho Hàng 4.',
      example:
        'Trên Cột 7, số 8 chỉ có thể ở R1C7 và R3C7 (cùng Box 3) → xóa ứng viên 8 khỏi tất cả các ô khác trong Box 3.',
      mastery: 'practicing',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_02_naked_subsets',
      tier: 'intermediate',
      skillBranch: 'elimination',
      difficultyRange: 'Medium – Hard',
      name: '09. Naked Pair / Triple / Quad (Bộ ứng viên lộ diện)',
      summary:
        'Khi N ô trong cùng một đơn vị (Hàng/Cột/Box) chỉ chứa tổ hợp của đúng N ứng viên (N = 2, 3, 4) → N số đó bị khóa vào N ô này, xóa chúng khỏi mọi ô còn lại trong đơn vị.',
      howToSpot:
        'Chú ý: Naked Triple không đòi hỏi cả 3 ô đều chứa đủ 3 số — ví dụ 3 ô {1,2}, {2,3}, {1,3} đã tạo thành một Naked Triple {1,2,3} hoàn chỉnh!',
      example:
        'Trong Hàng 6 có 3 ô R6C1={2,5}, R6C4={5,9}, R6C8={2,5,9} → xóa {2,5,9} khỏi toàn bộ 6 ô còn lại của Hàng 6.',
      mastery: 'practicing',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_02_hidden_subsets',
      tier: 'intermediate',
      skillBranch: 'elimination',
      difficultyRange: 'Medium – Hard',
      name: '10. Hidden Pair / Triple (Bộ ứng viên ẩn)',
      summary:
        'Khi N chữ số trong một đơn vị (Hàng/Cột/Box) chỉ xuất hiện tại đúng N ô chung → xóa toàn bộ các ứng viên ngoại lai khác bên trong N ô đó.',
      howToSpot:
        'Đếm tần suất xuất hiện của từng số 1→9 trong một Hàng/Cột/Box: nếu hai số A và B đều chỉ xuất hiện ở đúng 2 ô giống hệt nhau → khóa {A,B} tại đó.',
      example:
        'Trong Box 9, số 1 và số 7 chỉ xuất hiện ở R7C8={1,4,7,9} và R9C9={1,6,7} → xóa 4,6,9 khỏi 2 ô này, chỉ giữ lại {1,7}.',
      mastery: 'practicing',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_02_xwing',
      tier: 'intermediate',
      skillBranch: 'patterns',
      difficultyRange: 'Medium – Hard',
      name: '11. X-Wing (Cấu trúc Cánh chữ X 2×2)',
      summary:
        'Một chữ số X chỉ xuất hiện đúng 2 vị trí ở 2 Hàng khác nhau và cùng thẳng hàng trên 2 Cột giống nhau (tạo 4 góc hình chữ nhật) → loại X khỏi toàn bộ phần còn lại của 2 Cột đó (hoặc ngược lại).',
      howToSpot:
        'Highlight từng số 1→9: tìm 2 Hàng (Base sets) chỉ có đúng 2 ứng viên X rơi vào cùng 2 Cột (Cover sets). Đường chéo chữ X bắt buộc X phải chiếm 2 cột đó.',
      example:
        'Số 6 ở Hàng 2 chỉ có tại C2, C8; ở Hàng 7 cũng chỉ có tại C2, C8 → xóa toàn bộ ứng viên 6 ở các ô khác trên Cột 2 và Cột 8.',
      mastery: 'unknown',
      notes: 'Kỹ thuật nền tảng của họ Fish (Basic Fish).',
      updatedAt: now,
    },
    {
      id: 'sd_02_swordfish',
      tier: 'intermediate',
      skillBranch: 'patterns',
      difficultyRange: 'Medium – Hard',
      name: '12. Swordfish (Cấu trúc Cá kiếm 3×3)',
      summary:
        'Mở rộng 3×3 của X-Wing: ở 3 Hàng khác nhau, ứng viên X chỉ xuất hiện trong phạm vi tối đa 3 Cột chung (mỗi hàng có 2 hoặc 3 vị trí) → loại bỏ X khỏi mọi ô khác thuộc 3 Cột đó.',
      howToSpot:
        'Khi highlight số X, tìm 3 Hàng mà mỗi hàng chỉ có 2–3 vị trí ứng viên; kiểm tra xem hợp (union) các cột của 3 hàng đó có đúng bằng 3 cột hay không.',
      example:
        'Số 4 ở Hàng 1 (C1,C5), Hàng 4 (C5,C9), Hàng 8 (C1,C9) — cả 3 hàng đều nằm gọn trong 3 cột {C1,C5,C9} → xóa 4 ở phần còn lại của C1, C5, C9.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_02_xy_xyz_wing',
      tier: 'intermediate',
      skillBranch: 'patterns',
      difficultyRange: 'Medium – Hard',
      name: '13. XY-Wing (Y-Wing) & XYZ-Wing',
      summary:
        'XY-Wing: Ô trục (Pivot) {X,Y} nhìn thấy 2 ô cánh (Pincers) {X,Z} và {Y,Z} → mọi ô nhìn thấy cả 2 cánh đều không thể là Z. XYZ-Wing: Trục có 3 số {X,Y,Z} nhìn thấy 2 cánh {X,Z} và {Y,Z} → ô nhìn thấy cả 3 ô (Trục + 2 Cánh) không thể là Z.',
      howToSpot:
        'Quét các ô bi-value (chỉ có 2 ứng viên): chọn 1 ô {X,Y} làm bản lề, tìm trong các peer của nó một ô {X,Z} và một ô {Y,Z} không cùng đơn vị.',
      example:
        'Pivot R4C4={3,8} nhìn thấy Pincer 1 R4C9={3,5} và Pincer 2 R6C5={8,5}. Dù R4C4 là 3 hay 8 thì một trong hai cánh phải là 5 → xóa 5 ở R4C5, R4C6.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_02_skyscraper_kite',
      tier: 'intermediate',
      skillBranch: 'patterns',
      difficultyRange: 'Medium – Hard',
      name: '14. Skyscraper & Two-String Kite (Turbot Fish)',
      summary:
        'Chuỗi ngắn 2 liên kết mạnh (Conjugate Pairs) của cùng 1 chữ số X: Skyscraper dùng 2 Hàng (hoặc 2 Cột) nối qua 1 đáy chung; Two-String Kite dùng 1 Hàng + 1 Cột nối qua 1 Box 3×3 chung → ô nhìn thấy cả 2 đầu mút còn lại không thể chứa X.',
      howToSpot:
        'Khi soi X-Wing mà thấy 2 hàng chỉ thẳng hàng ở 1 cột, còn 2 đầu kia bị lệch cột (hình tòa nhà cao thấp) → đó chính là Skyscraper!',
      example:
        'Số 9 trên Hàng 1 chỉ ở (R1C2, R1C6); trên Hàng 8 chỉ ở (R8C2, R8C7). Đáy chung C2 nối R1C2–R8C2 → ít nhất một trong hai đỉnh R1C6 hoặc R8C7 phải là 9 → xóa 9 ở các ô nhìn thấy cả R1C6 và R8C7.',
      mastery: 'unknown',
      notes: 'Cực kỳ hay gặp và dễ nhìn hơn cả Swordfish trong thực chiến.',
      updatedAt: now,
    },

    // =========================================================================
    // 03. ADVANCED — Suy luận chuyên sâu (Hard – Expert)
    // Mục tiêu: xử lý cấu trúc ứng viên phức tạp và chuỗi suy luận.
    // =========================================================================
    {
      id: 'sd_03_simple_coloring',
      tier: 'expert',
      skillBranch: 'chains',
      difficultyRange: 'Hard – Expert',
      name: '15. Simple Coloring (Single’s Chains — Tô màu liên kết mạnh)',
      summary:
        'Nối mạng lưới các cặp liên kết mạnh (Conjugate Pairs — đúng 2 vị trí của số X trong 1 đơn vị) bằng 2 màu luân phiên Xanh / Vàng. Luật 1 (Color Trap): Ô ngoài nhìn thấy cả Xanh lẫn Vàng → loại X. Luật 2 (Color Wrap): 2 ô cùng màu nhìn thấy nhau → toàn bộ màu đó sai, màu kia đúng.',
      howToSpot:
        'Khi một chữ số X có nhiều hàng/cột/box chỉ còn đúng 2 vị trí, hãy bắt đầu tô màu A → B → A → B dọc theo các cặp đó.',
      example:
        'Chuỗi liên kết mạnh của số 2 làm R1C4 mang màu Xanh và R7C9 mang màu Vàng → ô R1C9 nhìn thấy cả hai màu nên không thể là 2.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_03_aic',
      tier: 'expert',
      skillBranch: 'chains',
      difficultyRange: 'Hard – Expert',
      name: '16. AIC — Alternating Inference Chains (Chuỗi suy luận luân phiên)',
      summary:
        'Chuỗi luân phiên giữa Liên kết Mạnh (Strong Link: nếu A sai thì B bắt buộc đúng) và Liên kết Yếu (Weak Link: nếu B đúng thì C bắt buộc sai), có thể đi qua nhiều chữ số khác nhau và kết thúc bằng Liên kết Mạnh.',
      howToSpot:
        'Bắt đầu từ một liên kết mạnh (trong 1 ô bi-value {X,Y} hoặc 1 cặp conjugate pair của số X), nối tiếp =X–X=Y–Y=X. Nếu hai đầu chuỗi cùng là số X → mọi ô nhìn thấy cả 2 đầu chuỗi đều bị loại X.',
      example:
        '(R2C3=5) == (R2C3=8) -- (R2C9=8) == (R7C9=8) -- (R7C4=8) == (R7C4=5) → ít nhất một trong hai ô R2C3 hoặc R7C4 phải là 5 → xóa 5 khỏi R2C4 và R7C3.',
      mastery: 'unknown',
      notes: 'Vũ khí mạnh nhất để giải Sudoku Expert/Master không cần đoán.',
      updatedAt: now,
    },
    {
      id: 'sd_03_forcing_chains',
      tier: 'expert',
      skillBranch: 'chains',
      difficultyRange: 'Hard – Expert',
      name: '17. Forcing Chains (Cell & Region Forcing Chains)',
      summary:
        'Từ một ô chỉ có 2–3 ứng viên (hoặc 1 số chỉ có 2–3 vị trí trong vùng), lần theo tất cả các nhánh suy luận. Nếu MỌI nhánh đều dẫn tới cùng một kết quả tại ô T (T=k hoặc T≠k) → kết quả đó được chứng minh chắc chắn 100%.',
      howToSpot:
        'Chọn một ô bi-value {A,B} có nhiều kết nối mạnh xung quanh: kiểm tra nhanh "Nếu là A thì sao?" và "Nếu là B thì sao?".',
      example:
        'Tại R5C5={2,7}: Nhánh R5C5=2 dẫn tới R5C8=9; nhánh R5C5=7 kéo theo R2C5=7 → R2C8=9 → R5C8≠9. Vậy nếu thử từ góc nhìn hội tụ, ta khóa được ứng viên chung của 2 nhánh.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_03_unique_rectangle',
      tier: 'expert',
      skillBranch: 'patterns',
      difficultyRange: 'Hard – Expert',
      name: '18. Unique Rectangle (Type 1, 2, 3, 4 — Quy tắc nghiệm duy nhất)',
      summary:
        'Sudoku chuẩn chỉ có duy nhất 1 lời giải → không bao giờ được phép xuất hiện "Deadly Pattern" gồm 4 ô tạo thành hình chữ nhật nằm trên 2 Hàng, 2 Cột và 2 Box mà cả 4 ô chỉ chứa đúng cặp {A,B}.',
      howToSpot:
        'Tìm 3 góc hình chữ nhật (trên 2 Box) chỉ chứa đúng cặp {A,B}. Tại góc thứ 4 (UR Type 1), nếu có {A,B,X,Y} → xóa ngay A và B khỏi góc thứ 4 để tránh Deadly Pattern!',
      example:
        'R1C1={4,9}, R1C3={4,9}, R5C1={4,9} và R5C3={4,9,7} (nằm trên Box 1 và Box 4) → R5C3 không được phép là 4 hoặc 9 → R5C3 bắt buộc là 7.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_03_bug_plus_1',
      tier: 'expert',
      skillBranch: 'patterns',
      difficultyRange: 'Hard – Expert',
      name: '19. BUG+1 (Bivalue Universal Grave + 1)',
      summary:
        'Khi gần cuối ván, tất cả các ô trống trên toàn bàn cờ đều chỉ còn đúng 2 ứng viên (bi-value), NGOẠI TRỪ duy nhất 1 ô có 3 ứng viên → ứng viên nào trong ô 3 số đó xuất hiện 3 lần trong Hàng/Cột/Box của nó thì chính là đáp án của ô đó.',
      howToSpot:
        'Khi bàn cờ toàn các cặp 2 số và chỉ sót lại đúng 1 ô có 3 số {A,B,C}: đếm nhanh trong Hàng của ô đó xem A, B hay C xuất hiện 3 lần.',
      example:
        'Toàn bộ ô trống đều còn 2 số, riêng R6C6={2,5,8}. Trong Hàng 6, số 2 và 5 xuất hiện 2 lần, còn số 8 xuất hiện 3 lần → R6C6 bắt buộc là 8.',
      mastery: 'unknown',
      notes: 'Kỹ thuật kết liễu ván Expert cực nhanh trong 3 giây.',
      updatedAt: now,
    },
    {
      id: 'sd_03_als',
      tier: 'expert',
      skillBranch: 'chains',
      difficultyRange: 'Hard – Expert',
      name: '20. ALS — Almost Locked Sets (ALS-XZ & ALS-XY-Wing)',
      summary:
        'Một tập N ô trong cùng 1 đơn vị chứa N+1 ứng viên được gọi là một ALS (Almost Locked Set — chỉ thiếu 1 ràng buộc nữa là trở thành Locked Set). Hai ALS chia sẻ một ứng viên chung bị giới hạn (Restricted Common Candidate - X) sẽ khóa ứng viên chung Z ở mọi ô nhìn thấy toàn bộ Z trong cả 2 ALS.',
      howToSpot:
        'Bắt đầu từ ALS nhỏ nhất: 1 ô bi-value (1 ô có 2 số) hoặc 2 ô có 3 số {A,B,C} trong cùng 1 hàng/cột/box, tìm ứng viên cầu nối X chỉ có thể đúng ở tối đa 1 trong 2 ALS.',
      example:
        'ALS A gồm 2 ô {1,3,7} và ALS B gồm 2 ô {3,5,7}. Nếu số 3 của hai ALS nhìn thấy hết nhau (Restricted Common X=3), thì ít nhất một ALS phải chứa 7 → xóa 7 khỏi các ô nhìn thấy tất cả số 7 của A và B.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_03_finned_fish',
      tier: 'expert',
      skillBranch: 'patterns',
      difficultyRange: 'Hard – Expert',
      name: '21. Finned X-Wing / Finned Swordfish (Cá có vây)',
      summary:
        'Cấu trúc X-Wing hoặc Swordfish gần hoàn chỉnh nhưng ở 1 hàng có dư ra 1–2 ứng viên (gọi là Vây / Fin) nằm trong cùng 1 Box với góc cá → ta vẫn loại trừ được ứng viên X ở những ô vừa nằm trên Cột của cá vừa nhìn thấy toàn bộ Vây (Fin).',
      howToSpot:
        'Khi tìm X-Wing mà 1 hàng có 2 vị trí, hàng thứ hai có 3 vị trí (2 vị trí cùng box + 1 vị trí thẳng cột với hàng đầu) → thu hẹp vùng loại trừ về đúng Box chứa Fin.',
      example:
        'Hàng 2 có số 5 ở C1, C7; Hàng 8 có số 5 ở C1, C7 và thêm Fin ở C8 (cùng Box 9 với R8C7) → xóa ứng viên 5 ở R7C7 và R9C7 (vừa thuộc Cột 7 vừa cùng Box 9 với Fin R8C8).',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_03_sue_de_coq',
      tier: 'expert',
      skillBranch: 'chains',
      difficultyRange: 'Hard – Expert',
      name: '22. Sue de Coq (Two-Sector Disjoint Subsets)',
      summary:
        'Tại giao điểm của một Box 3×3 và một Hàng (hoặc Cột), một nhóm ô chứa nhiều ứng viên được phân tách thành hai tập con rời nhau: một tập thuộc phần còn lại của Hàng và một tập thuộc phần còn lại của Box → khóa đồng thời cả Hàng lẫn Box.',
      howToSpot:
        'Tìm đoạn giao 2–3 ô giữa một Box và một Hàng chứa 4–5 ứng viên, sau đó tìm 1 ô bi-value trên Hàng đó và 1 ô bi-value trong Box đó hoàn chỉnh hóa số lượng ứng viên.',
      example:
        'Giao điểm R1C1, R1C2 chứa {1,2,3,4}. Trên Hàng 1 có R1C8={1,2} và trong Box 1 có R2C3={3,4} → xóa {1,2} khỏi phần còn lại của Hàng 1 và xóa {3,4} khỏi phần còn lại của Box 1.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },

    // =========================================================================
    // 04. MASTERY — Tư duy giải Sudoku (Expert – Master)
    // Mục tiêu: giải những bài khó bằng chuỗi logic có thể chứng minh.
    // =========================================================================
    {
      id: 'sd_04_board_structure',
      tier: 'mastery',
      skillBranch: 'expert_solving',
      difficultyRange: 'Expert – Master',
      name: '23. Phân tích cấu trúc toàn bảng (Global Topology & Strong-Link Graph)',
      summary:
        'Nhìn bàn cờ như một đồ thị liên kết mạnh – yếu thay vì 81 ô rời rạc. Nhận diện ngay những chữ số "xương sống" (chữ số có nhiều conjugate pairs và ô bi-value) để chọn điểm đột phá.',
      howToSpot:
        'Khi bước vào giai đoạn giữa ván Master: dừng 20 giây quét tổng thể xem chữ số nào chỉ còn 2 vị trí ở nhiều đơn vị nhất và ô nào là nút giao (hub) của nhiều bi-value cells.',
      example:
        'Thay vì thử ngẫu nhiên từ số 1, thấy số 8 có 5 cặp liên kết mạnh trên toàn bảng → lập tức dựng đồ thị chuỗi trên số 8.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_04_combined_elimination',
      tier: 'mastery',
      skillBranch: 'expert_solving',
      difficultyRange: 'Expert – Master',
      name: '24. Kết hợp nhiều kỹ thuật loại trừ liên hoàn (Cascading Deductions)',
      summary:
        'Một bài Master hiếm khi sụp đổ chỉ sau 1 kỹ thuật đơn lẻ: dùng Locked Candidates để rút gọn ứng viên → lộ ra Naked Pair → mở đường cho Skyscraper/XY-Wing → tạo liên kết mạnh mới cho AIC.',
      howToSpot:
        'Sau mỗi lần xóa được dù chỉ 1 ứng viên bằng Fish hoặc Wing, luôn kiểm tra lại xem đơn vị vừa bị xóa có vừa biến từ 3 vị trí xuống còn 2 vị trí (tạo Strong Link mới) hay không!',
      example:
        'Xóa 1 ứng viên 6 nhờ XY-Wing giúp Cột 4 chỉ còn đúng 2 vị trí cho số 6 → lập tức kích hoạt một X-Wing trên số 6 ở bước kế tiếp.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_04_contradiction',
      tier: 'mastery',
      skillBranch: 'expert_solving',
      difficultyRange: 'Expert – Master',
      name: '25. Chứng minh phản chứng (Proof by Contradiction — Không phải đoán mò)',
      summary:
        'Khác hoàn toàn với điền bừa may rủi: Chứng minh phản chứng là giả sử mệnh đề P đúng trong đầu/nháp, suy luận thuần logic để chỉ ra một mâu thuẫn tất yếu (1 ô mất sạch ứng viên hoặc 1 đơn vị có 2 số trùng) → từ đó CHỨNG MINH P bắt buộc sai (¬P đúng).',
      howToSpot:
        'Tuyệt đối không điền đại vào bảng rồi hy vọng không sai. Chỉ đặt một ứng viên khi bạn đã nhìn thấy trọn vẹn đường dẫn tới mâu thuẫn của nhánh ngược lại.',
      example:
        'Nếu R3C4=7 → R3C9=2 → R8C9=5 → Box 9 không còn vị trí nào cho số 7 (Mâu thuẫn!) → Chứng minh được R3C4 ≠ 7.',
      mastery: 'unknown',
      notes: 'Ranh giới giữa người đoán mò và bậc thầy suy luận: Prove before you place.',
      updatedAt: now,
    },
    {
      id: 'sd_04_chain_construction',
      tier: 'mastery',
      skillBranch: 'expert_solving',
      difficultyRange: 'Expert – Master',
      name: '26. Đọc, Ký hiệu Eureka & Xây dựng chuỗi suy luận hai chiều',
      summary:
        'Sử dụng ký hiệu chuẩn Eureka `(A=B) - (B=C) - (C=D)` để viết và kiểm chứng chuỗi suy luận hai chiều (Bidirectional AIC / Nice Loops), đảm bảo không có mắt xích nào bị đứt gãy logic.',
      howToSpot:
        'Một chuỗi AIC hợp lệ luôn bắt đầu bằng `=` (Strong) và kết thúc bằng `=` (Strong), với các dấu `=` và `-` (Weak) xen kẽ nghiêm ngặt. Mọi liên kết mạnh cũng có thể đóng vai trò là liên kết yếu khi cần.',
      example:
        'Ghi lại chuỗi đẹp nhất của ván vào sổ tay sau mỗi buổi luyện 30 phút để rèn tư duy mạch lạc.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_04_search_optimization',
      tier: 'mastery',
      skillBranch: 'expert_solving',
      difficultyRange: 'Expert – Master',
      name: '27. Tối ưu thứ tự tìm kiếm ứng viên (Systematic Search Hierarchy)',
      summary:
        'Tuân thủ quy trình quét theo chi phí nhận thức tăng dần: (1) Singles & Snyder → (2) Pointing/Claiming & Subsets → (3) Turbot Fish (Skyscraper/Kite/X-Wing) → (4) XY/XYZ-Wing & UR → (5) Coloring, AIC & ALS.',
      howToSpot:
        'Khi bị kẹt quá 2 phút, đừng nhảy cóc sang tìm chuỗi AIC phức tạp trước khi đã rà hết 9 chữ số cho Locked Candidates, Naked/Hidden Pairs và Skyscraper.',
      example:
        '80% các điểm tưởng như phải dùng chuỗi dài thực chất lại là một Hidden Pair hoặc Box-Line Reduction bị bỏ sót.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
    {
      id: 'sd_04_uniqueness_analysis',
      tier: 'mastery',
      skillBranch: 'expert_solving',
      difficultyRange: 'Expert – Master',
      name: '28. Phân tích cấu trúc độ khó (SE / HoDoKu Rating) & Tính duy nhất của lời giải',
      summary:
        'Hiểu điều gì làm nên độ khó thực sự của một đề Sudoku (Bottleneck step — nút thắt cổ chai quyết định điểm Sudoku Explainer / HoDoKu) và cách kiểm chứng tính duy nhất của lời giải.',
      howToSpot:
        'Sau mỗi ván giải trong mục Nhật ký 30 phút, xác định chính xác "Bottleneck step" — nước đi duy nhất tháo gỡ thế bế tắc lớn nhất của toàn ván.',
      example:
        'Một ván Expert có thể giải trơn tru 70 ô đầu bằng Singles, nhưng dừng hẳn ở ô thứ 71 vì đòi hỏi 1 đòn AIC hoặc XY-Wing duy nhất.',
      mastery: 'unknown',
      notes: '',
      updatedAt: now,
    },
  ];
}

async function ensureFullSudokuCurriculum(): Promise<void> {
  const now = Date.now();
  const existing = await db.sudokuTechniques.toArray();
  const fullCurriculum = buildSudokuCurriculum(now);

  // Map legacy sd1..sd9 mastery & notes if user already interacted with them
  const legacyByNewId: Record<string, string> = {
    sd_01_naked_single: 'sd1',
    sd_02_pointing: 'sd2',
    sd_02_naked_subsets: 'sd3',
    sd_02_xwing: 'sd4',
    sd_02_xy_xyz_wing: 'sd5',
    sd_02_skyscraper_kite: 'sd6',
    sd_02_swordfish: 'sd7',
    sd_03_unique_rectangle: 'sd8',
    sd_03_simple_coloring: 'sd9',
  };

  const existingMap = new Map(existing.map((item) => [item.id, item]));
  const alreadyUpgraded = existing.some((item) => item.id.startsWith('sd_04_'));

  if (alreadyUpgraded && existing.length >= fullCurriculum.length) {
    return;
  }

  const merged: SudokuTechnique[] = fullCurriculum.map((item) => {
    const direct = existingMap.get(item.id);
    const legacy = legacyByNewId[item.id] ? existingMap.get(legacyByNewId[item.id]) : undefined;
    const source = direct || legacy;
    if (!source) return item;
    return {
      ...item,
      mastery: source.mastery || item.mastery,
      notes: source.notes || item.notes,
      updatedAt: source.updatedAt || now,
    };
  });

  await db.transaction('rw', db.sudokuTechniques, async () => {
    // Remove legacy sd1..sd9 ids so there are no duplicates
    const legacyIds = ['sd1', 'sd2', 'sd3', 'sd4', 'sd5', 'sd6', 'sd7', 'sd8', 'sd9'];
    await db.sudokuTechniques.bulkDelete(legacyIds);
    await db.sudokuTechniques.bulkPut(merged);
  });
}

function buildChessCurriculum(now: number): ChessModule[] {
  return [
    // =========================================================================
    // GIAI ĐOẠN 1 — BEGINNER (0–1000 Elo tham khảo)
    // Mục tiêu: biết chơi đúng, không tự mất quân, hiểu những nguyên tắc cơ bản.
    // =========================================================================
    {
      id: 'ch_01_rules_special',
      phase: 1,
      stage: 'beginner',
      eloRange: '0–1000 Elo tham khảo',
      trackPillar: 'foundation',
      phaseTitle: 'Giai đoạn 1 — Beginner (0–1000 Elo)',
      title: '01. Luật cờ, cách di chuyển, nhập thành, bắt tốt qua đường & phong cấp',
      description:
        'Nắm vững quỹ đạo di chuyển của 6 loại quân và 3 luật đặc biệt: Nhập thành (Castling), Bắt tốt qua đường (En Passant) và Phong cấp (Promotion).',
      concept:
        'Nhập thành là nước đi duy nhất giúp an toàn Vua đồng thời kích hoạt Xe chỉ trong 1 lượt. Điều kiện: Vua và Xe chưa di chuyển, không có quân chắn giữa, Vua không đang bị chiếu và không đi qua ô bị kiểm soát.',
      example:
        'Trong Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5), Trắng dọn sạch hai ô f1 và g1 để sẵn sàng nhập thành ngắn O-O ngay ở nước thứ 4 hoặc 5.',
      exercise:
        'Hoàn thành toàn bộ phần "Chess Basics" và "Special Moves" tương tác trên Lichess Learn.',
      mistake:
        'Quên luật Bắt tốt qua đường (En Passant chỉ có hiệu lực ngay ở nước kế tiếp) hoặc trì hoãn nhập thành quá lâu khiến Vua kẹt ở trung tâm.',
      openQuestion: 'Khi nào nên nhập thành dài (O-O-O) thay vì nhập thành ngắn (O-O)?',
      reviewDate: '',
      resources: [
        {
          label: 'Lichess – Learn Chess',
          url: 'https://lichess.org/learn',
          note: 'Bài tập tương tác về luật và các kỹ năng nền tảng.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_01_piece_value_safety',
      phase: 1,
      stage: 'beginner',
      eloRange: '0–1000 Elo tham khảo',
      trackPillar: 'foundation',
      phaseTitle: 'Giai đoạn 1 — Beginner (0–1000 Elo)',
      title: '02. Giá trị quân & Nguyên tắc bảo vệ quân (Chấm dứt lỗi treo quân)',
      description:
        'Hiểu thang giá trị tương đối (Tốt = 1, Mã/Tượng = 3, Xe = 5, Hậu = 9) và nguyên tắc đếm số quân tấn công vs số quân bảo vệ.',
      concept:
        'Ở mốc 0–1000 Elo, 85% các ván đấu được định đoạt bởi việc một bên tự để quân không được bảo vệ (Hanging Pieces) hoặc đổi quân lỗ (ví dụ đổi Xe lấy Mã).',
      example:
        'Nếu đối phương có 2 quân nhắm vào ô e4 (Mã c6 và Tượng b7) còn bạn chỉ có 1 quân bảo vệ (Mã d2) → tốt e4 đang bị treo và sẽ mất.',
      exercise:
        'Trong 5 ván Rapid tiếp theo, trước khi buông tay khỏi quân cờ, luôn tự hỏi: "Ô mình sắp đặt quân xuống có bị đối phương ăn không? Quân mình vừa rời đi có bỏ mặc quân nào khác không?"',
      mistake:
        'Chỉ nhìn vào nước mình muốn tấn công mà không thấy đối phương vừa đe dọa ăn không Hậu hoặc Xe của mình.',
      openQuestion:
        'Trong trường hợp nào một quân Tượng (3 điểm) lại mạnh hơn một quân Xe (5 điểm)?',
      reviewDate: '',
      resources: [
        {
          label: 'Play Winning Chess — Yasser Seirawan',
          author: 'Yasser Seirawan',
          note: 'Học tư duy Force, Time, Space, Pawn Structure và nguyên tắc bảo vệ quân.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_01_opening_principles',
      phase: 1,
      stage: 'beginner',
      eloRange: '0–1000 Elo tham khảo',
      trackPillar: 'foundation',
      phaseTitle: 'Giai đoạn 1 — Beginner (0–1000 Elo)',
      title: '03. Ba nguyên tắc mở cờ: Chiếm trung tâm, Phát triển quân, Bảo vệ Vua',
      description:
        'Đừng học cờ vua bằng cách thuộc thật nhiều nước đi. Hãy học cách hiểu tại sao một nước đi tốt.',
      concept:
        '1. Kiểm soát 4 ô trung tâm (e4, d4, e5, d5) bằng tốt và quân nhẹ. 2. Phát triển Mã trước Tượng, không đi 1 quân hai lần trong khai cuộc khi chưa cần. 3. Nhập thành sớm trước nước thứ 8–10.',
      example:
        'Thực hành ngay trên "Bàn cờ thực hành đầu tiên: Italian Game · Bài 01" ở trên: mỗi nước 1.e4, 2.Nf3, 3.Bc4 đều tuân thủ tuyệt đối 3 nguyên lý vàng.',
      exercise:
        'Đọc 5 ván đầu tiên trong cuốn Logical Chess: Move by Move (Irving Chernev) để thấy vì sao mọi nước đi tuân thủ nguyên lý đều tạo ra thế trận thắng.',
      mistake:
        'Đưa Hậu ra quá sớm (như 2.Qh5) để săn chiếu hết ăn may nhưng lại bị các quân nhẹ đối phương đuổi chạy mất hết nhịp phát triển (tempo).',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Logical Chess: Move by Move — Irving Chernev',
          author: 'Irving Chernev',
          note: 'Hiểu lý do đằng sau từng nước đi từ đầu đến cuối ván.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_01_checkmates_stalemate',
      phase: 1,
      stage: 'beginner',
      eloRange: '0–1000 Elo tham khảo',
      trackPillar: 'foundation',
      phaseTitle: 'Giai đoạn 1 — Beginner (0–1000 Elo)',
      title: '04. Chiếu, Chiếu hết, Hòa cờ (Stalemate) & Các mẫu chiếu hết cơ bản',
      description:
        'Phân biệt rõ Chiếu (Check) vs Chiếu hết (Checkmate) vs Hòa do hết nước đi hợp lệ (Stalemate); thuộc lòng 3 cách hóa giải nước chiếu (Chạy, Chắn, Ăn).',
      concept:
        'Nhận diện các mẫu chiếu hết kinh điển (Checkmate Patterns): Back-Rank Mate (Chiếu hết hàng cuối), Kiss of Death (Hậu áp sát Vua có quân bảo vệ), Smothered Mate và Ladder Mate.',
      example:
        'Khi hơn hẳn 1 Hậu ở cuối ván, đừng vội ăn sạch mọi quân tốt của đối phương nếu Vua họ không bị chiếu và không còn nước đi hợp lệ → sẽ biến ván thắng thành Hòa Stalemate!',
      exercise:
        'Làm 30 bài "Checkmate in 1" và "Checkmate Patterns I" trên Lichess Practice.',
      mistake:
        'Chiếu vô tội vạ ("Thấy chiếu là chiếu") dù nước chiếu đó chỉ giúp Vua đối phương chạy vào chỗ an toàn hơn.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Lichess – Basic Checkmates Practice',
          url: 'https://lichess.org/practice/checkmates/piece-checkmates-i/BJy6fEDf',
          note: 'Luyện chiếu hết cơ bản tương tác trực tiếp.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_01_core_tactics',
      phase: 1,
      stage: 'beginner',
      eloRange: '0–1000 Elo tham khảo',
      trackPillar: 'foundation',
      phaseTitle: 'Giai đoạn 1 — Beginner (0–1000 Elo)',
      title: '05. Năm đòn chiến thuật cốt lõi: Fork, Pin, Skewer, Discovered & Double Attack',
      description:
        'Ngôn ngữ chiến thuật căn bản: Chĩa đôi (Fork), Ghim (Pin tuyệt đối & tương đối), Xiên (Skewer), Tấn công mở (Discovered Attack) và Tấn công đôi.',
      concept:
        'Chiến thuật xuất hiện khi quân đối phương không được bảo vệ (undefended), thẳng hàng với Vua/Hậu (alignment), hoặc quá tải nhiệm vụ phòng thủ (overloaded).',
      example:
        'Mã Trắng nhảy vào f7 tấn công đồng thời Hậu d8 và Xe h8 (Knight Fork); Tượng g5 ghim Mã f6 vào Hậu d8 (Relative Pin) hoặc vào Vua e8 (Absolute Pin).',
      exercise:
        'Mỗi ngày dành 15 phút giải bài tập chiến thuật theo từng chủ đề (Motif) thay vì giải ngẫu nhiên.',
      mistake:
        'Bấm đi ngay nước đầu tiên nhìn thấy trong bài tập Tactics mà chưa tính xem đối phương phản công ra sao.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Yusupov: Build Up Your Chess 1 (The Fundamentals)',
          author: 'Artur Yusupov',
          url: 'https://chesseduca.com/series/yusupovs-chess-school/',
          note: 'Các chương chiến thuật cơ bản kèm bài test cuối chương.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_01_basic_endgames',
      phase: 1,
      stage: 'beginner',
      eloRange: '0–1000 Elo tham khảo',
      trackPillar: 'foundation',
      phaseTitle: 'Giai đoạn 1 — Beginner (0–1000 Elo)',
      title: '06. Tàn cuộc cơ bản: Vua + Hậu, Vua + Xe, Vua + Tốt vs Vua',
      description:
        'Biết cách chuyển hóa ưu thế thắng tuyệt đối ở tàn cuộc căn bản mà không bao giờ để trượt hòa.',
      concept:
        '1. K+Q vs K & K+R vs K: Dùng phương pháp thu hẹp hình hộp (Box Method) kết hợp Vua mình ép Vua đối phương vào cạnh bàn cờ. 2. K+P vs K: Quy tắc Hình vuông (Rule of the Square), Thế Đối Vua (Opposition) và Ô then chốt (Key Squares).',
      example:
        'Trong tàn cuộc Vua + Tốt vs Vua: Vua BẮT BUỘC phải đi trước Tốt để chiếm các ô then chốt ở hàng thứ 6, tuyệt đối không đẩy tốt chạy trước Vua.',
      exercise:
        'Đọc Phần 1–3 (Unranked to Class D) trong cuốn Silman’s Complete Endgame Course và thực hành chiếu hết K+R vs K với máy trong dưới 25 nước.',
      mistake:
        'Đẩy tốt lên trước Vua trong tàn cuộc K+P vs K khiến đối phương chiếm được thế Đối Vua (Opposition) và cầm hòa.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: "Silman's Complete Endgame Course",
          author: 'Jeremy Silman',
          note: 'Đọc đúng các chương dành cho mốc Beginner (dưới 1200 Elo).',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },

    // =========================================================================
    // GIAI ĐOẠN 2 — INTERMEDIATE (1000–1800 Elo tham khảo)
    // Mục tiêu: tính toán biến, xây dựng kế hoạch, đánh giá vị trí.
    // =========================================================================
    {
      id: 'ch_02_cct_calculation',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'calculation',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '07. Tính toán biến có kỷ luật: Checks → Captures → Threats (CCT)',
      description:
        'Hệ thống hóa thứ tự tính toán ở mọi lượt đi cho cả đối phương lẫn chính mình.',
      concept:
        'Các nước cưỡng bức (Forcing Moves) làm hẹp cây biến số của đối phương: luôn xét (1) Mọi nước Chiếu, (2) Mọi nước Ăn quân, (3) Mọi nước Đe dọa tạo chiếu hết hoặc bắt quân.',
      example:
        'Trước khi thực hiện một nước phát triển tĩnh lặng, quét CCT của đối phương xem ở lượt sau họ có nước chiếu, ăn quân hay đòn chiến thuật nào không.',
      exercise:
        'Khi giải bài tập 15 phút mỗi ngày, viết (hoặc đọc thầm) đầy đủ biến chính từ nước 1 đến khi thế cờ tĩnh lại hoàn toàn rồi mới chạm quân.',
      mistake:
        'Dừng tính toán quá sớm ngay sau khi mình ăn được quân mà quên mất nước phản đòn (Zwischenzug / In-between move) của đối phương ở nửa nước kế tiếp.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Lichess – Intermediate Chess Course',
          url: 'https://lichess.org/study/QjfpcMCD',
          note: 'Giáo trình trung cấp về tính toán và kế hoạch trung cuộc.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_02_candidate_moves',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'calculation',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '08. Candidate Moves — Tìm nhiều nước ứng viên trước khi quyết định',
      description:
        'Phương pháp Kotov: liệt kê 2–3 nước ứng viên hợp lý nhất ở đầu lượt suy nghĩ thay vì lao vào tính 1 nước duy nhất theo bản năng.',
      concept:
        'Nếu bạn chỉ nhìn 1 nước ứng viên, bạn đang hy vọng nó đúng. Nếu bạn đặt lên bàn cân 3 nước ứng viên (Candidate A, B, C) và bác bỏ từng nước bằng tính toán, bạn đang thực sự chơi cờ.',
      example:
        'Trong một thế cờ tấn công, thay vì chỉ tính nước ăn ngay tượng f6, hãy liệt kê thêm nước điều Xe sang e1 (đưa thêm quân vào cuộc) và nước đẩy h4.',
      exercise:
        'Trong mục Nhật ký phân tích ván đấu bên dưới, luôn điền trung thực ô: "Mày đã bỏ qua nước ứng viên nào?" sau mỗi ván Rapid.',
      mistake:
        'Nhảy qua nhảy lại rối loạn giữa biến A và biến B nhiều lần làm cạn sạch thời gian đồng hồ.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Yusupov: Build Up Your Chess 1–3',
          author: 'Artur Yusupov',
          url: 'https://chesseduca.com/series/yusupovs-chess-school/',
          note: 'Các chương Calculation và Candidate Moves.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_02_pawn_structure',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'strategy',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '09. Pawn Structure — Cấu trúc tốt: Tốt cô lập, Tốt chồng, Tốt thông',
      description:
        'Philidor: "Tốt là linh hồn của cờ vua." Cấu trúc tốt quyết định kế hoạch dài hạn và vị trí đặt quân của cả hai bên.',
      concept:
        '1. Tốt cô lập (IQP): tạo không gian và ô đứng cho quân nhẹ ở trung cuộc nhưng là mục tiêu yếu ở tàn cuộc (cần phong tỏa ô ngay trước mặt nó). 2. Tốt chồng (Doubled Pawns) & Tốt lạc hậu (Backward Pawn). 3. Tốt thông (Passed Pawn): "Tốt thông là một tên tội phạm cần phải bị còng tay bằng Mã" (Nimzowitsch).',
      example:
        'Khi đối phương có tốt cô lập d5, bước đầu tiên không phải là ăn nó ngay mà là đặt một quân Mã vững chắc vào ô d4 để phong tỏa (Blockade).',
      exercise:
        'Đọc chương Pawn Structure trong The Amateur’s Mind của Jeremy Silman.',
      mistake:
        'Đổi quân bừa bãi làm tự hỏng cấu trúc tốt quanh Vua hoặc vô tình giúp đối phương nối liền cặp tốt chồng của họ.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: "The Amateur's Mind — Jeremy Silman",
          author: 'Jeremy Silman',
          note: 'Cách nhận diện sự mất cân bằng (Imbalances) và cấu trúc tốt.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_02_positional_play',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'strategy',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '10. Positional Play — Ô yếu (Outpost), Cột mở, Quân tốt và Quân xấu',
      description:
        'Biết làm gì khi trên bàn cờ không có đòn chiến thuật ăn quân trực tiếp.',
      concept:
        '1. Ô tiền đồn (Outpost): ô ở hàng 4, 5, 6 không thể bị tốt đối phương xua đuổi — thiên đường của Mã. 2. Cột mở & Hàng ngang thứ 7 cho Xe chồng (Doubled Rooks). 3. Good vs Bad Bishop: Tượng xấu là tượng bị chính các quân tốt của mình cản đường chéo. 4. Quy tắc vàng: Cải thiện quân đang đứng tệ nhất của mình!',
      example:
        'Nếu tất cả các tốt trung tâm của bạn đang đứng ở ô trắng, thì Tượng ô trắng của bạn là "Bad Bishop" — hãy tìm cách đổi nó hoặc đưa nó ra ngoài dây xích tốt.',
      exercise:
        'Trong mỗi ván Rapid, khi thế cờ tĩnh lặng, hãy chỉ tay vào quân đang làm ít việc nhất của bạn và tìm một ô đẹp hơn cho nó.',
      mistake:
        'Đổi mất quân Tượng cực mạnh của mình chỉ để lấy một quân Mã đang đứng thụ động ở góc bàn cờ đối phương.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: "The Amateur's Mind — Jeremy Silman",
          author: 'Jeremy Silman',
          note: 'Chuyên sâu về Minor Pieces (Mã vs Tượng) và Cột mở cho Xe.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_02_middlegame_plans',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'strategy',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '11. Middlegame — Tấn công Vua, Phòng thủ & Chuyển hóa lợi thế',
      description:
        'Kết nối khai cuộc với tàn cuộc bằng những kế hoạch trung cuộc rõ ràng.',
      concept:
        '1. Khi hai bên nhập thành cùng phía: tấn công bằng quân kết hợp đột phá trung tâm. 2. Khi hai bên nhập thành ngược phía: đua bão tốt (Pawn Storm) mở cột công Vua. 3. Nguyên tắc cổ điển: Đòn phản công ở trung tâm là câu trả lời tốt nhất cho cuộc tấn công ở cánh!',
      example:
        'Khi đã hơn 1 quân nhẹ hoặc 2 tốt: đừng chơi cầu toàn thụ động mà hãy chủ động đổi bớt các quân tấn công chủ lực của đối phương để đơn giản hóa về tàn cuộc thắng.',
      exercise:
        'Phân tích 3 ván bạn từng dẫn trước rất lớn ở trung cuộc nhưng lại bị lật ngược thế cờ.',
      mistake:
        'Tấn công cánh Vua đối phương khi trung tâm của mình vẫn đang mở toang và lỏng lẻo.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Understanding Chess Middlegames — John Nunn',
          author: 'John Nunn',
          note: '100 chủ đề trung cuộc cốt lõi được trình bày ngắn gọn, rõ ràng.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_02_practical_endgames',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'strategy',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '12. Endgame Thực chiến — Vua & Tốt nâng cao, Tàn cuộc Xe (Lucena & Philidor), Tượng & Mã',
      description:
        'Làm chủ các thế tàn cuộc xuất hiện nhiều nhất trong thực chiến để tự tin đổi quân từ trung cuộc.',
      concept:
        '1. Thế cờ Philidor (Cách phòng thủ hòa trong tàn cuộc Xe + Tốt vs Xe bằng phòng tuyến hàng ngang thứ 3). 2. Thế cờ Lucena (Cách bắc cầu / Building a Bridge để thắng chắc chắn khi tốt đã lên hàng 7). 3. Quy tắc Tarrasch: Xe luôn phải đứng ĐẰNG SAU tốt thông (cả tốt thông của mình lẫn của đối phương).',
      example:
        'Trong thế Philidor: Giữ Xe ở hàng ngang thứ 6 (hoặc thứ 3 của bên phòng thủ) để ngăn Vua đối phương bước lên; ngay khi đối phương đẩy tốt lên hàng 6 mới kéo Xe xuống hàng 1 chiếu lưng liên tục!',
      exercise:
        'Học thuộc và thực hành nhuần nhuyễn thế Lucena và thế Philidor trong Silman’s Complete Endgame Course & 100 Endgames You Must Know.',
      mistake:
        'Đặt Xe ở ĐẰNG TRƯỚC tốt thông của mình khiến Xe bị trói chân và không thể hỗ trợ tốt phong cấp.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: "Silman's Complete Endgame Course (Class C – Class A)",
          author: 'Jeremy Silman',
          note: 'Học đúng phần tàn cuộc tương ứng mốc 1200–1800 Elo.',
        },
        {
          label: '100 Endgames You Must Know — Jesús de la Villa',
          author: 'Jesús de la Villa',
          note: 'Dùng khi đã vững tàn cuộc cơ bản.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_02_self_analysis',
      phase: 2,
      stage: 'intermediate',
      eloRange: '1000–1800 Elo tham khảo',
      trackPillar: 'calculation',
      phaseTitle: 'Giai đoạn 2 — Intermediate (1000–1800 Elo)',
      title: '13. Quy trình tự phân tích ván đấu của chính mình (Phân tích trước, Engine sau)',
      description:
        '10 phút tự phân tích sau mỗi ván Rapid mang lại nhiều tiến bộ hơn 10 ván Blitz chơi liền tù tì.',
      concept:
        'Sau mỗi ván Rapid 10+5 hoặc 15+10, tắt thanh đánh giá Stockfish và tự trả lời 4 câu hỏi cốt lõi: (1) Nước đi nào khiến mình mất lợi thế? (2) Mình đã bỏ qua nước ứng viên nào? (3) Mình có tính toán hay chỉ đoán? (4) Sai lầm đó thuộc chiến thuật, chiến lược hay quản lý thời gian?',
      example:
        'Khi phát hiện mình thua vì đi nước 18.Bxf6 chỉ sau 3 giây suy nghĩ mà không tính biến phản công 18...gxf6 mở cột g của đối phương → nguyên nhân gốc rễ là "Đoán cảm tính / Không xét Candidate Moves".',
      exercise:
        'Sử dụng biểu mẫu "+ Log ván (4 câu hỏi tư duy)" ngay trong phòng Chess này sau mỗi ván Rapid hằng ngày.',
      mistake:
        'Bật Engine ngay giây đầu tiên sau khi ván cờ kết thúc, nhìn máy báo "-3.5" rồi gật gù "À nước đó sai" mà não không hề tự suy nghĩ tại sao.',
      openQuestion: '',
      reviewDate: '',
      resources: [],
      done: false,
      notes: '',
      updatedAt: now,
    },

    // =========================================================================
    // GIAI ĐOẠN 3 — ADVANCED (1800–2200+ Elo tham khảo)
    // Mục tiêu: tư duy chiến lược sâu, tính toán chính xác và xây dựng hệ thống thi đấu.
    // =========================================================================
    {
      id: 'ch_03_deep_calculation',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'calculation',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '14. Deep Calculation — Tính toán biến sâu, loại bỏ biến thừa & Visualization',
      description:
        'Rèn độ chính xác và khả năng nhìn bàn cờ tưởng tượng rõ nét sau 5–7 nước đi.',
      concept:
        'Kỹ thuật Pruning (Cắt tỉa cây tính toán), Comparison (So sánh các biến tương đồng), Elimination (Phương pháp loại trừ) và Blunder-check cuối cùng trước khi đặt tay lên quân cờ.',
      example:
        'Khi một biến bắt buộc dẫn tới thế thua rõ ràng, lập tức loại bỏ nó và dùng thông tin vừa phát hiện từ biến đó để sửa thứ tự nước đi (Move-order refinement).',
      exercise:
        'Giải các bài tập trong Yusupov (Beyond the Basics / Mastery) hoặc Grandmaster Preparation: Calculation trên bàn cờ thật không chạm quân.',
      mistake:
        'Hình ảnh bàn cờ trong đầu bị mờ (Residual Image Error) — quên mất một quân đã rời khỏi ô cũ từ 3 nước trước trong biến đang tính.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Grandmaster Preparation: Calculation — Jacob Aagaard',
          author: 'Jacob Aagaard',
          note: 'Tài liệu rèn tính toán biến chuyên sâu.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_03_positional_evaluation',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'strategy',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '15. Positional Evaluation — Đánh giá cấu trúc tốt, hoạt động quân, an toàn Vua & thế trận',
      description:
        'Cân đo đong đếm chính xác giữa các yếu tố tĩnh (Static: cấu trúc tốt, vật chất) và yếu tố động (Dynamic: sáng kiến, hoạt động quân, an toàn Vua).',
      concept:
        'Ba câu hỏi của Jacob Aagaard khi đánh giá thế cờ: (1) Điểm yếu của hai bên ở đâu? (2) Quân nào đang đứng tệ nhất trên bàn cờ? (3) Ý đồ của đối phương là gì?',
      example:
        'Chấp nhận một quân tốt cô lập hoặc thí 1 tốt (Positional Pawn Sacrifice) để đổi lấy quyền kiểm soát tuyệt đối các ô màu đen và khóa chặt Xe đối phương.',
      exercise:
        'Thực hành đánh giá các thế cờ trung cuộc phức tạp trong Mastering Chess Strategy (Johan Hellsten).',
      mistake:
        'Đánh giá thế cờ chỉ dựa trên việc đếm số quân tốt mà bỏ qua việc 2 quân Xe của đối phương đã chiếm hoàn toàn cột mở.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Grandmaster Preparation: Positional Play — Jacob Aagaard',
          author: 'Jacob Aagaard',
          note: 'Ba câu hỏi định hướng chiến lược trung cuộc.',
        },
        {
          label: 'Mastering Chess Strategy — Johan Hellsten',
          author: 'Johan Hellsten',
          note: 'Hệ thống bài giảng và bài tập chiến lược toàn diện.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_03_prophylaxis',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'strategy',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '16. Prophylaxis (Tư duy phòng ngừa) — Dự đoán và ngăn chặn ý đồ đối phương',
      description:
        'Đỉnh cao của cờ vua chiến lược: vô hiệu hóa kế hoạch đẹp nhất của đối phương trước cả khi họ kịp bắt đầu.',
      concept:
        'Trước khi thực hiện kế hoạch của riêng mình, hãy giả sử đối phương được đi thêm 1 lượt nữa ngay lúc này ("Nếu đến lượt họ, họ muốn đi đâu nhất?"). Nếu kế hoạch của họ nguy hiểm hoặc giúp họ giải phóng thế cờ, hãy dập tắt nó trước.',
      example:
        'Một nước đi nhỏ như a4 hoặc h3 vào đúng thời điểm có thể bóp nghẹt hoàn toàn ý đồ phản công b5 hoặc g5 của đối phương, buộc họ rơi vào thế bị động tuyệt vọng.',
      exercise:
        'Tìm 1 nước đi Prophylaxis trong mỗi ván cờ của Karpov hoặc Petrosian.',
      mistake:
        'Phòng thủ thụ động thái quá khi không hề có mối đe dọa thực sự từ đối phương.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: 'Yusupov: Boost Your Chess & Chess Evolution (Mastery)',
          author: 'Artur Yusupov',
          url: 'https://chesseduca.com/series/yusupovs-chess-school/',
          note: 'Các chương Positional Play & Prophylaxis cấp cao.',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_03_advanced_endgame',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'mastery',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '17. Advanced Endgame — Kỹ thuật tàn cuộc phức tạp & Nguyên tắc hai điểm yếu',
      description:
        'Chuyển hóa những ưu thế nhỏ nhất ở tàn cuộc nhiều quân và xây dựng pháo đài (Fortress) khi phòng thủ.',
      concept:
        '1. Principle of Two Weaknesses (Nguyên tắc hai điểm yếu): Một điểm yếu duy nhất thường có thể phòng thủ được; hãy kéo giãn hàng thủ đối phương bằng cách mở mặt trận thứ hai ở cánh đối diện. 2. Do Not Rush (Không vội vàng): Cải thiện tối đa vị trí Vua và quân trước khi đẩy tốt quyết định.',
      example:
        'Trong tàn cuộc Xe + 4 tốt vs Xe + 3 tốt cùng một cánh, thường cần tạo thêm điểm yếu hoặc dùng Vua đột nhập sang cánh bên kia mới phá vỡ được thế hòa.',
      exercise:
        'Nghiên cứu các chương chữ xanh (Tragicomedies / Core Knowledge) trong Dvoretsky’s Endgame Manual.',
      mistake:
        'Vội vàng đẩy tốt quá sớm ở tàn cuộc làm mất đi các ô đột nhập của Vua mình.',
      openQuestion: '',
      reviewDate: '',
      resources: [
        {
          label: "Dvoretsky's Endgame Manual — Mark Dvoretsky",
          author: 'Mark Dvoretsky',
          note: 'Kinh thánh tàn cuộc nâng cao (chỉ học khi đã vững Silman).',
        },
      ],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_03_opening_repertoire',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'mastery',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '18. Opening Repertoire — Xây dựng hệ thống khai cuộc phù hợp phong cách',
      description:
        'Xây dựng 1 hệ thống khai cuộc gắn liền với cấu trúc tốt trung cuộc và tàn cuộc điển hình thay vì học vẹt biến máy móc.',
      concept:
        'Một Opening Repertoire bền vững được xây bằng cách hiểu các kế hoạch trung cuộc tiêu biểu (Typical Middlegame Plans) và các cuộc đột phá tốt (Pawn Breaks) của khai cuộc đó, rồi mới mở rộng dần từng nhánh sau mỗi ván thực chiến.',
      example:
        'Nếu chọn Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4): hiểu sâu kế hoạch xây trung tâm c3–d3 (hoặc c3–d4), hành trình điều Mã Nb1–d2–f1–g3 và thời điểm mở cột f.',
      exercise:
        'Sau mỗi ván rời khỏi lý thuyết khai cuộc (Out of book), chỉ tra cứu và bổ sung thêm đúng 1–2 nước tại điểm mình vừa đi lệch, không học nhồi nhét 20 biến cùng lúc.',
      mistake:
        'Đổi khai cuộc liên tục sau mỗi trận thua thay vì tìm hiểu tại sao kế hoạch trung cuộc của mình trong khai cuộc đó chưa đúng.',
      openQuestion: '',
      reviewDate: '',
      resources: [],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_03_tournament_prep',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'mastery',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '19. Tournament Preparation — Quản lý thời gian, tâm lý & thực chiến',
      description:
        'Kiểm soát đồng hồ (Time Management), giữ sự khách quan khi đang ưu thế hoặc thất thế, và tránh rơi vào khủng hoảng thời gian (Time Trouble).',
      concept:
        'Phân bổ thời gian thông minh: không tiêu tốn 10 phút cho một nước tái chiếm quân hiển nhiên hoặc chọn giữa 2 nước phát triển tương đương, để dành thời gian cho 2–3 thời điểm bước ngoặt (Critical Moments) của ván cờ.',
      example:
        'Khi vừa mắc một sai lầm trên bàn cờ: hít sâu, chấp nhận đánh giá lại thế cờ mới một cách hoàn toàn khách quan thay vì cay cú đi nhanh liên tiếp để rồi thua luôn.',
      exercise:
        'Theo dõi sát chỉ số "Sai lầm thuộc Quản lý thời gian" trong Nhật ký ván đấu.',
      mistake:
        'Suy nghĩ quá lâu ở nước thứ 6–8 dẫn đến việc chỉ còn dưới 1 phút ở nước thứ 25 khi thế cờ phức tạp nhất.',
      openQuestion: '',
      reviewDate: '',
      resources: [],
      done: false,
      notes: '',
      updatedAt: now,
    },
    {
      id: 'ch_03_deep_game_analysis',
      phase: 3,
      stage: 'advanced',
      eloRange: '1800–2200+ Elo tham khảo',
      trackPillar: 'mastery',
      phaseTitle: 'Giai đoạn 3 — Advanced (1800–2200+ Elo)',
      title: '20. Phân tích ván đấu cấp cao — Tự tìm lời giải trước khi dùng Engine',
      description:
        'Biến mỗi ván đấu của chính mình thành một bài học nghiên cứu chuyên sâu.',
      concept:
        'Chọn 1–2 ván cờ dài nhất trong tuần, tự viết bình luận bằng lời và phân tích các biến nhánh mà không bật Engine. Sau khi hoàn tất bản phân tích của con người, mới bật Stockfish để kiểm tra những điểm mù trong quá trình tính toán của chính mình.',
      example:
        'So sánh "Biến mình đã tính trong ván" với "Biến mình tự tìm ra khi phân tích nguội" và cuối cùng là "Biến tối ưu của Engine" — khoảng cách giữa bước 1 và bước 2 chính là thứ bạn có thể cải thiện ngay lập tức.',
      exercise:
        'Mỗi cuối tuần chọn 1 ván Rapid đáng nhớ nhất để phân tích sâu theo 4 câu hỏi tư duy trong NOETRIX.',
      mistake:
        'Phụ thuộc hoàn toàn vào đánh giá của máy tính mà mất đi tiếng nói chiến lược và trực giác của chính mình.',
      openQuestion: '',
      reviewDate: '',
      resources: [],
      done: false,
      notes: '',
      updatedAt: now,
    },
  ];
}

async function ensureFullChessCurriculum(): Promise<void> {
  const now = Date.now();
  const existing = await db.chessModules.toArray();
  const fullCurriculum = buildChessCurriculum(now);

  const legacyByNewId: Record<string, string> = {
    ch_02_cct_calculation: 'ch1',
    ch_01_checkmates_stalemate: 'ch2',
    ch_01_core_tactics: 'ch3',
    ch_01_opening_principles: 'ch5',
    ch_03_opening_repertoire: 'ch6',
    ch_01_basic_endgames: 'ch7',
    ch_02_practical_endgames: 'ch8',
    ch_02_positional_play: 'ch9',
    ch_02_self_analysis: 'ch10',
  };

  const existingMap = new Map(existing.map((item) => [item.id, item]));
  const alreadyUpgraded = existing.some((item) => item.id.startsWith('ch_03_'));

  if (alreadyUpgraded && existing.length >= fullCurriculum.length) {
    return;
  }

  const merged: ChessModule[] = fullCurriculum.map((item) => {
    const direct = existingMap.get(item.id);
    const legacy = legacyByNewId[item.id] ? existingMap.get(legacyByNewId[item.id]) : undefined;
    const source = direct || legacy;
    if (!source) return item;
    return {
      ...item,
      done: source.done ?? item.done,
      notes: source.notes || item.notes,
      concept: source.concept || item.concept,
      example: source.example || item.example,
      exercise: source.exercise || item.exercise,
      mistake: source.mistake || item.mistake,
      openQuestion: source.openQuestion || item.openQuestion,
      reviewDate: source.reviewDate || item.reviewDate,
      updatedAt: source.updatedAt || now,
    };
  });

  await db.transaction('rw', db.chessModules, async () => {
    const legacyIds = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10'];
    await db.chessModules.bulkDelete(legacyIds);
    await db.chessModules.bulkPut(merged);
  });
}

export async function ensureSeedData(): Promise<void> {
  const existingProfile = await db.profile.get('main');
  if (existingProfile) {
    // Auto-upgrade brand identity to NOETRIX if still using default LifeOS / Personal OS name
    if (
      existingProfile.appName === 'LifeOS' ||
      existingProfile.appName === 'Personal OS' ||
      existingProfile.motto.includes('Kỷ luật nhẹ nhàng')
    ) {
      await db.profile.update('main', {
        appName: 'NOETRIX',
        motto: 'Curious by nature. Mischievous by design. Pure in pursuit.',
        updatedAt: Date.now(),
      });
    }
    // Purge legacy mock schedule tasks &Ensure full Sudoku + Chess curricula exist
    await purgeLegacyMockSchedule();
    await ensureFullSudokuCurriculum();
    await ensureFullChessCurriculum();
    // Normalize any legacy ASCII arrows '->' to clean typographic '→'
    const techs = await db.sudokuTechniques.toArray();
    for (const t of techs) {
      if (t.summary.includes('->') || t.howToSpot.includes('->')) {
        await db.sudokuTechniques.update(t.id, {
          summary: t.summary.replace(/->/g, '→'),
          howToSpot: t.howToSpot.replace(/->/g, '→'),
        });
      }
    }
    const topics = await db.codeTopics.toArray();
    for (const ct of topics) {
      if (ct.title.includes('->')) {
        await db.codeTopics.update(ct.id, { title: ct.title.replace(/->/g, '→') });
      }
    }
    return;
  }

  const now = Date.now();

  const profile: ProfileState = {
    id: 'main',
    appName: 'NOETRIX',
    motto: 'Curious by nature. Mischievous by design. Pure in pursuit.',
    xp: 60,
    tiktokRescues: 0,
    streakShields: 1,
    theme: 'dark',
    soundEnabled: true,
    updatedAt: now,
  };

  const wheelOptions: WheelOption[] = [
    { id: 'w1', label: 'Đọc 10 trang sách đang nằm trên kệ', category: 'Đọc sách', duration: 'quick', suggestedMinutes: 10, color: '#3b82f6', enabled: true, xpReward: 25 },
    { id: 'w2', label: 'Làm 10 bài Chess Tactics (suy nghĩ kỹ trước khi đi!)', category: 'Cờ vua', duration: 'quick', suggestedMinutes: 10, color: '#8b5cf6', enabled: true, xpReward: 25 },
    { id: 'w3', label: 'Đọc 1 kỹ thuật Sudoku Expert & soi ván không đoán mò', category: 'Sudoku', duration: 'medium', suggestedMinutes: 15, color: '#06b6d4', enabled: true, xpReward: 30 },
    { id: 'w4', label: 'Giải 1 bài LeetCode hoặc ôn 1 pattern cốt lõi', category: 'Code', duration: 'deep', suggestedMinutes: 30, color: '#10b981', enabled: true, xpReward: 40 },
    { id: 'w5', label: 'Viết nháp 150 chữ cho bài IG Tâm lý tuần này', category: 'IG Tâm lý', duration: 'medium', suggestedMinutes: 15, color: '#f59e0b', enabled: true, xpReward: 30 },
    { id: 'w6', label: 'Ghi chú / vẽ sơ đồ cho bài Workflow 3 ngày tới', category: 'Workflow AI', duration: 'medium', suggestedMinutes: 20, color: '#6366f1', enabled: true, xpReward: 35 },
    { id: 'w7', label: 'Viết thêm 1 cảnh nhỏ hoặc 2 ý tưởng cho truyện', category: 'Viết truyện', duration: 'medium', suggestedMinutes: 20, color: '#ec4899', enabled: true, xpReward: 30 },
    { id: 'w8', label: 'Phác thảo nhanh (Sketch) 10 phút vật trước mặt', category: 'Vẽ', duration: 'relax', suggestedMinutes: 10, color: '#f97316', enabled: true, xpReward: 20 },
    { id: 'w9', label: 'Shadowing / đọc to 10 phút tiếng Anh chủ động', category: 'Tiếng Anh', duration: 'quick', suggestedMinutes: 10, color: '#14b8a6', enabled: true, xpReward: 25 },
    { id: 'w10', label: 'Hít đất 20 cái + giãn cơ + uống 1 cốc nước lớn', category: 'Thể chất', duration: 'quick', suggestedMinutes: 5, color: '#ef4444', enabled: true, xpReward: 20 },
  ];

  const codeTopics: CodeTopic[] = [
    { id: 'ct1', pillar: 'workflow_ai', title: 'Kiến trúc Agentic Workflow: Prompt Chaining, Routing & Tool Calling', status: 'learning', notes: 'Tập trung vào cách tách bước rõ ràng, kiểm soát JSON output và fallback khi LLM trả sai format.', resourceUrl: '', updatedAt: now },
    { id: 'ct2', pillar: 'workflow_ai', title: 'Webhook, Retry, Idempotency & Error Handling trong n8n / Automation', status: 'todo', notes: 'Hiểu sâu cách đảm bảo workflow chạy thật không bị trùng dữ liệu.', resourceUrl: '', updatedAt: now },
    { id: 'ct3', pillar: 'leetcode', title: 'Two Pointers & Sliding Window Patterns', status: 'learning', notes: 'Nhận diện bài toán mảng/chuỗi con liên tiếp O(n).', resourceUrl: '', updatedAt: now },
    { id: 'ct4', pillar: 'leetcode', title: 'Tree / Graph Traversal (DFS, BFS, Topological Sort)', status: 'todo', notes: '', resourceUrl: '', updatedAt: now },
    { id: 'ct5', pillar: 'java', title: 'JVM Internals: Heap, Stack, Garbage Collector & Memory Model', status: 'learning', notes: 'Cốt lõi ngôn ngữ Java — hiểu cách object được cấp phát và thu gom.', resourceUrl: '', updatedAt: now },
    { id: 'ct6', pillar: 'java', title: 'Java Collections Framework, HashMap internals & Concurrency (Thread/Executor)', status: 'todo', notes: '', resourceUrl: '', updatedAt: now },
    { id: 'ct7', pillar: 'csharp', title: 'CLR, Value Type vs Reference Type, Boxing/Unboxing & GC trong .NET', status: 'todo', notes: 'So sánh trực tiếp với Java JVM để nhớ cực sâu.', resourceUrl: '', updatedAt: now },
    { id: 'ct8', pillar: 'csharp', title: 'LINQ Deferred Execution, async/await State Machine & Dependency Injection', status: 'todo', notes: '', resourceUrl: '', updatedAt: now },
    { id: 'ct9', pillar: 'web', title: 'HTTP/1.1 -> HTTP/2 -> HTTPS, CORS, Cookies, JWT & Session Security', status: 'learning', notes: 'Xương sống của Web Developer.', resourceUrl: '', updatedAt: now },
    { id: 'ct10', pillar: 'web', title: 'Browser Rendering Pipeline, Event Loop, Caching & Web Performance', status: 'todo', notes: '', resourceUrl: '', updatedAt: now },
  ];

  const chessModules: ChessModule[] = buildChessCurriculum(now);

  const sudokuTechniques: SudokuTechnique[] = buildSudokuCurriculum(now);

  const starterBook: Book = {
    id: 'bk_starter_1',
    title: 'Thêm cuốn sách đầu tiên đang nằm trên kệ của bạn',
    author: 'Tác giả',
    category: 'Tâm lý / Tư duy',
    status: 'unread',
    totalPages: 280,
    currentPage: 0,
    whyBought: 'Ghi lại lý do hồi xưa bạn thích cuốn này — mỗi lần nhìn lại sẽ có động lực mở ra đọc 10 trang!',
    quotes: [],
    createdAt: now,
    updatedAt: now,
  };

  const starterStory: Story = {
    id: 'st_starter_1',
    title: 'Dự án Truyện Đầu Tiên (Chỉnh sửa tên tại đây)',
    genre: 'Kỳ ảo / Tâm lý',
    logline: 'Viết 1–2 câu tóm gọn linh hồn câu chuyện của bạn tại đây.',
    synopsis: 'Nơi lưu giữ toàn bộ cốt truyện lớn, nhân vật, thế giới quan và từng chương kịch bản cho hành trình viết dài hơi của bạn.',
    targetWords: 50000,
    characters: [
      {
        id: 'chr_1',
        name: 'Nhân vật chính (Mẫu)',
        role: 'Protagonist',
        traits: 'Quan sát sắc bén, hay nghi ngờ chính mình',
        motivation: 'Tìm ra sự thật bị che giấu',
        arc: 'Từ thụ động né tránh -> chủ động đối diện lựa chọn',
      },
    ],
    worldItems: [
      {
        id: 'wld_1',
        category: 'Quy tắc',
        title: 'Luật cốt lõi của thế giới',
        content: 'Ghi chép những quy luật bất biến để kịch bản về sau không bị mâu thuẫn (plot hole).',
      },
    ],
    chapters: [
      {
        id: 'chp_1',
        order: 1,
        title: 'Chương 1: Khởi đầu',
        status: 'outline',
        summary: 'Giới thiệu bối cảnh thường ngày và biến cố đầu tiên.',
        content: '',
        notes: 'Nhớ cài cắm chi tiết nhỏ để dùng cho bước ngoặt ở chương 5.',
        updatedAt: now,
      },
    ],
    sparks: [
      {
        id: 'spk_1',
        text: 'Mẹo: Bất cứ lúc nào đang đi bơi hay tập gym mà nảy ra 1 câu thoại đắt giá, lưu ngay vào Hộp Ý Tưởng này!',
        tag: 'Mẹo viết',
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction(
    'rw',
    [
      db.profile,
      db.wheelOptions,
      db.codeTopics,
      db.chessModules,
      db.sudokuTechniques,
      db.workflowLectures,
      db.psychologyPosts,
      db.books,
      db.stories,
    ],
    async () => {
      await db.profile.put(profile);
      await db.wheelOptions.bulkPut(wheelOptions);
      await db.codeTopics.bulkPut(codeTopics);
      await db.chessModules.bulkPut(chessModules);
      await db.sudokuTechniques.bulkPut(sudokuTechniques);
      await db.books.put(starterBook);
      await db.stories.put(starterStory);
    }
  );
  await purgeLegacyMockSchedule();
}
