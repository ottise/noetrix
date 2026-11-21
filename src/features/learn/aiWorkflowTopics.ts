import type { LessonTopic } from './programmingData';

export function buildAiWorkflowCarTopics(now: number, addDaysIso: (d: number) => string): LessonTopic[] {
  return [
    // =========================================================================
    // BÀI 01: BẢN CHẤT HỆ THỐNG WORKFLOW (9 PHÒNG XƯỞNG XE 3D) & CLEAN ARCH
    // =========================================================================
    {
      id: 'top_ai_intro_clean_arch',
      subjectId: 'subj_ai',
      moduleGroup: '01 · Nền tảng Workflow & Kiến trúc',
      title: '01. Bản chất Workflow (9 Phòng Xưởng Xe 3D) & Clean Architecture',
      subtitle: 'Hiểu từ con số 0 qua ví dụ xưởng độ mô hình xe + cách chia 4 tầng không phụ thuộc DB',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 60,
      relatedTopicIds: ['top_ai_fsm_queue', 'top_ai_pipeline_watcher'],
      theory: {
        definition:
          'Một hệ thống Workflow chuẩn là một "nhà máy ảo" chia quy trình lớn thành nhiều phòng ban chuyên biệt phối hợp qua hàng đợi và trạng thái rõ ràng — giống như một xưởng độ mô hình xe 3D ngoài đời gồm 9 phòng: (1) Lễ tân nhận xe → (2) An ninh quét virus/script → (3) Pháp chế soi bản quyền L0..L3 → (4) Kỹ thuật quét hình học S0..S8 → (5) Xưởng sửa A..H → (6) Kho chờ on_hold → (7) Staging chụp ảnh & đóng gói in → (8) Showroom trưng bày.',
        why:
          'Người mới code hay nhét hết nhận_file() -> quét_virus() -> kiểm_tra_luật() -> sửa_3D() -> lưu_showroom() vào 1 hàm dài 500 dòng. Cách đó sập ngay ngoài đời thật vì: (1) Đang sửa 20 giây mà cúp điện -> mất sạch dấu không biết xe ở đâu; (2) Gửi 10 xe một lúc -> treo cứng máy; (3) Sửa code phòng Pháp chế làm vạ lây phòng Kỹ thuật; (4) AI đoán bậy lỡ tay đưa hàng ăn cắp bản quyền lên bán ở Showroom.',
        how:
          'Giải quyết triệt để bằng **Clean Architecture** (4 vòng tròn đồng tâm từ trong ra ngoài): lớp lõi **Domain** chỉ định nghĩa luật chơi ("xe có 14 trạng thái nào"), không biết tới PostgreSQL hay Fastify. Lớp **Application** điều phối nghiệp vụ từng phòng qua "ổ cắm trừu tượng" (Port/Interface). Lớp **Infrastructure** mới cắm đồ thật vào (Postgres thật hoặc file `embedded-db.json`, `chokidar` canh Downloads). Lớp **Presentation** nhận HTTP API & giao diện.',
        internalMechanism: [
          'Vòng 1 — Domain (`backend/src/domain/`): Chứa thực thể Xe, 14 trạng thái và luật chuyển trạng thái. Tuyệt đối KHÔNG import Postgres, Fastify, hay `fs`.',
          'Vòng 2 — Application (`backend/src/application/`): Các Use Case (`WorkflowOrchestrator`, `EvaluateTechQualityUseCase`, `AssetManagementUseCase`) chỉ nói chuyện qua Port Interface ("Hãy lưu kết quả giúp tôi").',
          'Vòng 3 — Infrastructure (`backend/src/infrastructure/`): Các Adapter thật như `pg-asset-repositories.ts` (PostgreSQL), `embedded-local-pg.pool.ts` (JSON khi không chạy Docker), `local-file-storage.ts`, `chokidar-inbox.watcher.ts`.',
          'Vòng 4 — Presentation (`backend/src/presentation/`): Controller HTTP (`assets.controller.ts`) và Worker khởi chạy. Nhờ tách 4 lớp, máy không có Docker vẫn tự chạy JSON mode không cần sửa 1 dòng nghiệp vụ (kiểm chứng bằng `clean-architecture.test.ts`).',
        ],
        codeLanguage: 'typescript',
        codeExample: `// Minh họa Port & Adapter (Dependency Inversion trong Clean Architecture)
interface AssetRepositoryPort {
  findByCode(code: string): Promise<{ code: string; state: string } | null>;
  saveState(code: string, nextState: string): Promise<void>;
}

// Application Use Case KHÔNG biết dữ liệu nằm ở Postgres hay file JSON!
class PromoteCarUseCase {
  constructor(private readonly repo: AssetRepositoryPort) {}

  async execute(code: string) {
    const car = await this.repo.findByCode(code);
    if (!car || car.state !== 'staging') throw new Error('Xe chưa qua Staging');
    await this.repo.saveState(code, 'published');
  }
}`,
        tradeOffs: {
          pros: [
            'Đổi Database (Postgres ↔ JSON), đổi nơi lưu file (Local ↔ S3) hay viết Unit Test giả lập mà không sửa 1 chữ ở logic nghiệp vụ.',
            'Sửa code một phòng ban không làm hỏng dây chuyền các phòng khác.',
          ],
          cons: [
            'Ban đầu nhiều thư mục và Interface hơn so với viết gộp 1 file; đòi hỏi kỷ luật kiểm tra hướng phụ thuộc (từ ngoài trỏ vào trong).',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Clean Architecture nghĩa là code phải chia thành hàng trăm file phức tạp." → Thực chất chỉ là 1 quy tắc vàng: Lõi Domain & Nghiệp vụ KHÔNG BAO GIỜ được import thẳng thư viện Database hay Web framework.',
        ],
        references: [
          { label: 'Dự án mẫu: backend/src/domain & infrastructure/container.ts', url: '' },
        ],
      },
      notes: {
        markdown:
          '### Tóm tắt 9 phòng ban Xưởng Xe 3D\n- Lễ tân (`received`/`normalizing`) → An ninh (`security_scan` / `quarantined`) → Pháp chế (`legal_check` L0..L3) → Kỹ thuật (`tech_review` S0..S8) → Xưởng sửa (`repair_eval`/`repair_plan`/`repair_exec` A..H) → Kho chờ (`on_hold`) → Trưng bày (`staging`/`final_review`) → Showroom (`published`).',
        pitfallsAndFixes: 'Luôn kiểm tra `clean-architecture.test.ts` hoặc ESLint import boundary để cấm tầng Domain import thư viện Infrastructure.',
        tags: ['workflow', 'clean-architecture', '3d-factory'],
      },
      explain: {
        whatIsIt: 'Kiến trúc tách phần mềm thành dây chuyền nhiều phòng độc lập theo 4 vòng tròn Domain → Application → Infrastructure → Presentation.',
        whyItExists: 'Tránh thảm họa "1 hàm 500 dòng" mất dấu khi cúp điện, treo máy khi đông việc và phụ thuộc cứng vào Database.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Nếu một ngày công ty đổi kho lưu trữ từ file ổ cứng sang AWS S3 và đổi Database từ JSON sang PostgreSQL, tầng Domain và Use Case phải sửa bao nhiêu dòng?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Clean Architecture & Luồng 9 Phòng Xưởng Xe 3D',
        kind: 'Architecture',
        nodes: [
          { id: 'c1', type: 'box', x: 30, y: 40, w: 150, h: 64, label: '01. Lễ tân / Inbox\n& Security Scan', color: '#EDEAE2' },
          { id: 'c2', type: 'box', x: 225, y: 40, w: 160, h: 64, label: '02. Pháp chế (L0-L3)\n& Kỹ thuật (S0-S8)', color: '#A7B6D2' },
          { id: 'c3', type: 'box', x: 430, y: 40, w: 165, h: 64, label: '03. Xưởng sửa (A-H)\nhoặc Kho chờ (Hold)', color: '#B99B79' },
          { id: 'c4', type: 'box', x: 225, y: 165, w: 205, h: 64, label: '04. Staging → CEO Duyệt\n→ Showroom (garage.html)', color: '#9BAA98' },
        ],
        edges: [
          { id: 'ce1', fromX: 180, fromY: 72, toX: 225, toY: 72, color: '#EDEAE2' },
          { id: 'ce2', fromX: 385, fromY: 72, toX: 430, toY: 72, label: 'Lỗi?', color: '#B99B79' },
          { id: 'ce3', fromX: 305, fromY: 104, toX: 305, toY: 165, label: 'Đạt chuẩn', color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_ca_1',
        tasks: [
          {
            id: 'pr_ai_ca_1',
            level: 'Easy',
            title: 'Áp dụng Port/Adapter cho kho lưu xe giả lập',
            prompt: 'Viết hàm `createUseCase(repo)` nhận bất kỳ object `repo` nào có hàm `get(id)` và `set(id, state)`. Hàm trả về `promote(id)`: nếu hiện tại là `"staging"` thì gọi `repo.set(id, "published")` và trả `true`, ngược lại trả `false`.',
            testCasesText: 'promote("c1") chuyển từ staging -> published; không đổi nếu đang received',
            starterJava: '// Implement Repository interface & UseCase',
            starterJs: `function createPromoteUseCase(repo) {
  return function promote(id) {
    const curr = repo.get(id);
    if (curr !== 'staging') return false;
    repo.set(id, 'published');
    return true;
  };
}`,
            referenceSolution: 'Kiểm tra `curr === "staging"`, chỉ đổi trạng thái qua `repo` được tiêm vào.',
            solutionNotes: 'Use Case hoàn toàn không biết `repo` bên dưới dùng Map, JSON hay PostgreSQL.',
            jsVerifierFnBody: `const m = new Map([['c1','staging'],['c2','received']]); const promote = createPromoteUseCase({get:k=>m.get(k), set:(k,v)=>m.set(k,v)}); return promote('c1')===true && m.get('c1')==='published' && promote('c2')===false;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_ca_1',
          kind: 'recall',
          prompt: 'Vì sao trong dự án Xe 3D, tắt Docker PostgreSQL đi thì toàn bộ quy trình 9 phòng ban vẫn chạy mượt mà bằng file `embedded-db.json`?',
          correctAnswer: 'Nhờ Clean Architecture: Use Case giao tiếp qua Port Interface nên chỉ cần thay Infrastructure Adapter từ pg-asset-repositories sang embedded-local-pg.pool mà không sửa logic nghiệp vụ.',
          userAnswer: '',
          revealed: false,
          explanation: 'Tách Port/Adapter giúp hệ thống sống sót và test dễ dàng không lệ thuộc phần cứng/DB cụ thể.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Kiểm tra lại xem Use Case của bạn có đang import thẳng thư viện DB không.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // BÀI 02: FSM, MESSAGE QUEUE, TRANSACTION & ROW LOCK
    // =========================================================================
    {
      id: 'top_ai_fsm_queue',
      subjectId: 'subj_ai',
      moduleGroup: '02 · Trạng thái, Hàng đợi & Giao dịch',
      title: '02. FSM (Máy Trạng Thái), Job Queue, Row Lock & Transaction',
      subtitle: 'Cách đảm bảo 100% xe không bao giờ nhảy cóc trạng thái hay mất dấu khi cúp điện',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 50,
      relatedTopicIds: ['top_ai_intro_clean_arch', 'top_ai_pipeline_watcher'],
      theory: {
        definition:
          '1) **FSM (Finite State Machine)**: Một chiếc xe tại một thời điểm chỉ đứng ở ĐÚNG 1 trong 14 trạng thái (`received` → `normalizing` → ... → `published`) và chỉ được đi theo bản đồ `ALLOWED_TRANSITIONS`. 2) **Message Queue & Worker**: Thay vì bắt khách đợi 30 giây, Lễ tân bỏ phiếu việc (`Job`) vào 8 hộp thư phòng (`q.normalize`, `q.tech`, `q.repair_exec`...) trả lời ngay "Đã nhận!"; nhân viên Worker rảnh sẽ tự bốc ra làm. 3) **Transaction + Row Lock**: Mọi bước đổi trạng thái + ghi sổ lịch sử + nhét hộp thư tiếp theo phải nằm trong CÙNG MỘT giao dịch nguyên tử có khóa dòng (`lockById`).',
        why:
          'Nếu không có FSM -> code lỗi có thể đẩy thẳng xe chưa quét virus (`received`) ra Showroom (`published`)! Nếu không có Idempotency -> lỡ gửi 2 lần làm sửa 1 xe 2 lần! Nếu không có Row Lock + Transaction -> hai worker sửa đè nhau hoặc đổi state xong cúp điện trước khi thả Job vào Queue làm chiếc xe kẹt chết vĩnh viễn!',
        how:
          'Trong `workflow-orchestrator.service.ts`, hàm `applyTransitionInTx` khóa cứng dòng xe bằng `tx.assets.lockById(assetId)` → kiểm tra `canTransition(from, to)` → cập nhật `state` → ghi Audit Event (`tx.events.create`) → thả Job có mã chống trùng `singletonKey` (vd `q.tech:4:2`) vào hàng đợi. Xong hết cả 4 bước mới Commit cùng một lúc!',
        internalMechanism: [
          '14 trạng thái & `ALLOWED_TRANSITIONS` (`asset-state-machine.ts`): `received` chỉ đi được tới `normalizing` hoặc `rejected`; từ `rejected` là mảng rỗng `[]` (không tự hồi sinh trừ khi CEO Override).',
          '8 Hộp thư Queue: `q.normalize`, `q.security`, `q.legal`, `q.tech`, `q.repair_eval`, `q.repair_plan`, `q.repair_exec`, `q.staging`. Nếu CEO bấm Tạm dừng phòng nào, Worker thấy cờ `paused = true` sẽ trả Job về trạng thái hoãn chứ không vứt mất xe.',
          'Idempotency (`singletonKey = "q.tech:4:2"`): Dù bấm nạp lại 2 lần, hệ thống chỉ chạy đúng 1 lần cho xe #4 phiên bản v2.',
          'Atomicity: Đổi State + Ghi Event Log + Enqueue Job nằm chung 1 Database Transaction ("được ăn cả, ngã về không").',
        ],
        codeLanguage: 'typescript',
        codeExample: `const ALLOWED: Record<string, string[]> = {
  received: ['normalizing', 'rejected'],
  normalizing: ['security_scan', 'rejected'],
  security_scan: ['legal_check', 'quarantined'],
  staging: ['final_review', 'published', 'on_hold'],
  rejected: [],
};

function canTransition(from: string, to: string): boolean {
  return (ALLOWED[from] || []).includes(to);
}

// Trong Transaction có khóa dòng:
// 1) lockById(id)  2) if (!canTransition) throw!
// 3) updateState() 4) logEvent() + enqueueJob({ singletonKey })`,
        tradeOffs: {
          pros: [
            'Loại bỏ 100% lỗi nhảy cóc quy trình, kẹt xe mồ côi khi sập nguồn giữa chừng hay đụng độ song song.',
            'Hỗ trợ Tạm dừng/Khôi phục từng phòng ban mà không mất job nào.',
          ],
          cons: [
            'Xử lý bất đồng bộ (Asynchronous): người dùng không thấy kết quả ngay sau lệnh POST mà cần SSE/Polling cập nhật sau.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Đổi state xong ở dòng 1, rồi dòng 2 gọi `queue.push()` bình thường là được." → SAI! Nếu dòng 1 thành công mà dòng 2 mất kết nối, xe sẽ kẹt mãi ở trạng thái đó vì không có Job nào trong Queue bốc nó đi tiếp.',
        ],
        references: [{ label: 'Dự án mẫu: asset-state-machine.ts & workflow-orchestrator.service.ts', url: '' }],
      },
      notes: {
        markdown:
          '- **FSM**: Kiểm soát đường đi hợp lệ bằng bảng `ALLOWED_TRANSITIONS`.\n- **Row Lock + TX**: Lock dòng → Check FSM → Update State → Log Event → Enqueue Job (cùng 1 TX).\n- **Idempotency**: Dùng `singletonKey = "${queue}:${assetId}:${version}"`.',
        pitfallsAndFixes: 'Không bao giờ đặt thao tác gửi HTTP/IO nặng bên trong Database Transaction đang giữ `lockById`, vì sẽ giữ khóa DB quá lâu làm nghẽn cả hệ thống.',
        tags: ['fsm', 'queue', 'transaction', 'idempotency'],
      },
      explain: {
        whatIsIt: 'Sự kết hợp giữa bản đồ trạng thái hợp lệ (FSM), hộp thư việc nền (Queue) và khóa giao dịch nguyên tử (Row Lock + Transaction).',
        whyItExists: 'Để dây chuyền tự động chạy hàng trăm xe song song mà không bao giờ nhảy cóc, chạy trùng hay mất dấu khi sập server.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Điều gì xảy ra nếu 2 Worker cùng đọc 1 chiếc xe đang ở trạng thái `staging` mà KHÔNG dùng `lockById`?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Transaction Nguyên Tử: Lock → FSM Check → Update → Queue',
        kind: 'Sequence',
        nodes: [
          { id: 'f1', type: 'box', x: 25, y: 50, w: 140, h: 64, label: '1. TX Begin\n+ Row Lock(id)', color: '#EDEAE2' },
          { id: 'f2', type: 'diamond', x: 205, y: 42, w: 155, h: 80, label: '2. FSM Check\ncanTransition?', color: '#B99B79' },
          { id: 'f3', type: 'box', x: 400, y: 50, w: 205, h: 64, label: '3. Update State + Log\n+ Enqueue(singletonKey)', color: '#9BAA98' },
        ],
        edges: [
          { id: 'fe1', fromX: 165, fromY: 82, toX: 205, toY: 82, color: '#EDEAE2' },
          { id: 'fe2', fromX: 360, fromY: 82, toX: 400, toY: 82, label: 'valid -> Commit', color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_fsm_1',
        tasks: [
          {
            id: 'pr_ai_fsm_1',
            level: 'Medium',
            title: 'Viết hàm chuyển trạng thái FSM có chống lặp Idempotent',
            prompt: 'Cho `ALLOWED = { received: ["normalizing", "rejected"], normalizing: ["published"] }`. Viết `transition(asset, nextState, jobKey, seenKeys)`: nếu `seenKeys.has(jobKey)` trả `"SKIPPED"`; nếu không hợp lệ ném Error `"INVALID"`; hợp lệ thì thêm `jobKey` vào `seenKeys`, đổi `asset.state = nextState` và trả `"OK"`.',
            testCasesText: 'Nhảy từ received -> published phải báo INVALID; gọi trùng jobKey trả SKIPPED.',
            starterJava: '// Implement FSM transition with Set<String> idempotency',
            starterJs: `const ALLOWED = { received: ['normalizing', 'rejected'], normalizing: ['published'] };
function transition(asset, nextState, jobKey, seenKeys) {
  if (seenKeys.has(jobKey)) return 'SKIPPED';
  const nexts = ALLOWED[asset.state] || [];
  if (!nexts.includes(nextState)) throw new Error('INVALID');
  seenKeys.add(jobKey);
  asset.state = nextState;
  return 'OK';
}`,
            referenceSolution: 'Kiểm tra `seenKeys.has(jobKey)` trước, sau đó check `ALLOWED[asset.state].includes(nextState)` rồi mới cập nhật.',
            solutionNotes: 'Giống y hệt nguyên lý trong `asset-state-machine.ts` và `singletonKey` của Queue.',
            jsVerifierFnBody: `const a = {state:'received'}; const s = new Set(); let err=false; try{transition(a,'published','k0',s);}catch(e){err=true;} return err && transition(a,'normalizing','k1',s)==='OK' && transition(a,'published','k1',s)==='SKIPPED' && a.state==='normalizing';`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_fsm_1',
          kind: 'recall',
          prompt: 'Chữ `q.tech:4:2` trong `singletonKey` có ý nghĩa gì đối với hệ thống hàng đợi?',
          correctAnswer: 'Là khóa định danh duy nhất cho Job của phòng Kỹ thuật (`q.tech`) đối với xe id=4 ở phiên bản v2, giúp chống chạy trùng lặp nếu lỡ gửi lại.',
          userAnswer: '',
          revealed: false,
          explanation: 'Idempotency key là lá chắn bắt buộc ở mọi hệ thống Queue/Webhook.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Mọi hệ thống đơn hàng, thanh toán, duyệt hồ sơ đều dùng đúng bộ ba FSM + Outbox/Queue + Row Lock này.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // BÀI 03: STAGED PIPELINE, INVARIANT ROLLBACK, WATCHER & SSE
    // =========================================================================
    {
      id: 'top_ai_pipeline_watcher',
      subjectId: 'subj_ai',
      moduleGroup: '03 · Dây chuyền từng chặng & Tự động hóa',
      title: '03. Staged Pipeline (S0→S8, A→H), Invariant Rollback & Watcher/SSE',
      subtitle: 'Làm từng bước có hoàn tác khi sai bất biến + tự hốt file từ Downloads & cập nhật Realtime',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 40,
      relatedTopicIds: ['top_ai_fsm_queue', 'top_ai_guardrails'],
      theory: {
        definition:
          '1) **Staged Pipeline & Invariant Rollback**: Không sửa 10 thứ cùng một lúc. Chia việc quét (`S0→S8`) và việc sửa (`A→H`) thành từng chặng nhỏ; chạy xong mỗi chặng lập tức đo xem các **Bất biến (Invariants)** như `no_regression` (số lỗi không tăng thêm, bánh xe không lệch) có giữ vững không — nếu vi phạm, **Rollback** khôi phục ngay bản snapshot trước chặng đó! 2) **File Watcher & SSE**: Dùng `chokidar` canh thư mục Downloads đợi tải ổn định rồi hốt vào Xưởng + xóa rác, đồng thời phát loa `EventBus -> SSE` cho trình duyệt tự di chuyển xe trên 3D Office không cần F5.',
        why:
          'Nếu gộp sửa trục, sửa kích thước, sửa vật liệu vào 1 lệnh khổng lồ: lỡ file ra bị lộn ngược hay hỏng texture thì không biết lỗi tại bước nào để cứu! Còn ở đầu vào Downloads, nếu thấy file mới xuất hiện là hốt ngay khi Chrome đang tải dở (`.crdownload`) thì file sẽ bị cụt hỏng.',
        how:
          'Trong `tech-scan-pipeline.service.ts`, nếu bước `S0` phát hiện định dạng đóng gói `.uasset`, hệ thống **Early Stop** dừng luôn không tốn công quét S1–S8. Trong `staged-repair-executor.service.ts`, trước khi chạy công thức (vd `R03`), luôn lưu bản snapshot file; chạy xong test lại bất biến — tệ hơn thì Rollback! Còn `chokidar-inbox.watcher.ts` bỏ qua file `.crdownload/.tmp`, gọi `waitForStableFile()` đợi kích thước đứng yên 3 nhịp rồi mới copy vào `originals/` và xóa khỏi Downloads.',
        internalMechanism: [
          'Quét 9 chặng cố định S0→S8 với **Early Stop** nếu phát hiện lỗi chí tử ngay đầu.',
          'Sửa 8 chặng A→H: Snapshot trước bước sửa → Thực thi công thức (R01..R16) → Kiểm tra bất biến `no_regression` → Pass thì đi tiếp, Fail thì Rollback lại file snapshot ngay trước bước đó.',
          'Inbox Watcher (`chokidar-inbox.watcher.ts`): Lọc bỏ file tạm trình duyệt, kiểm tra kích thước ổn định 3 nhịp liên tiếp (`waitForStableFile`), copy an toàn vào kho Xưởng trước khi xóa file trong Downloads.',
          'Event-Driven Realtime UI: Backend phát sự kiện qua `EventBus`, trình duyệt giữ kết nối `EventSource` (SSE — Server-Sent Events) để xe 3D chạy mượt qua từng phòng.',
        ],
        codeLanguage: 'typescript',
        codeExample: `async function runStageWithRollback(fileBuf: Buffer, stepFn: (b: Buffer) => Buffer, checkInvariant: (before: Buffer, after: Buffer) => boolean) {
  const snapshot = Buffer.from(fileBuf); // 1. Lưu bản dự phòng trước khi sửa
  const next = stepFn(fileBuf);          // 2. Chạy một công đoạn nhỏ
  if (!checkInvariant(snapshot, next)) {
    return { ok: false, result: snapshot, rolledBack: true }; // 3. Vi phạm bất biến -> Hoàn tác!
  }
  return { ok: true, result: next, rolledBack: false };
}`,
        tradeOffs: {
          pros: [
            'Tuyệt đối không làm hỏng nặng thêm file của khách hàng; sai bước nào cô lập và hoàn tác bước đó.',
            'Tự động hóa trọn vẹn từ lúc tải file ở trình duyệt tới khi hiện realtime trên màn hình.',
          ],
          cons: [
            'Chụp snapshot và kiểm tra bất biến qua từng chặng tốn thêm chút ổ cứng tạm và thời gian I/O.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Thấy file rơi vào thư mục là đọc xử lý luôn." → SAI! Trình duyệt ghi file lớn mất vài giây; đọc vội sẽ đọc nửa file hỏng — bắt buộc dùng `waitForStableFile`.',
        ],
        references: [{ label: 'Dự án mẫu: staged-repair-executor.service.ts & chokidar-inbox.watcher.ts', url: '' }],
      },
      notes: {
        markdown:
          '- **Staged Pipeline**: Chia nhỏ S0→S8 (có Early Stop) và A→H.\n- **Invariant Check**: Kiểm tra bất biến `no_regression` sau mỗi bước sửa, sai là **Rollback**.\n- **Watcher an toàn**: Bỏ `.crdownload/.tmp`, đợi ổn định kích thước (`waitForStableFile`), copy xong mới xóa gốc.',
        pitfallsAndFixes: 'Khi xóa file trên Windows ngay sau khi copy xong, đôi khi trình duyệt/Antivirus còn khóa file gây `EBUSY` -> luôn bọc xóa bằng retry ngắn.',
        tags: ['pipeline', 'rollback', 'watcher', 'sse'],
      },
      explain: {
        whatIsIt: 'Dây chuyền xử lý chia nhỏ từng chặng có kiểm tra bất biến & hoàn tác (Rollback), kết hợp Watcher theo dõi file ổn định và SSE realtime.',
        whyItExists: 'Để quá trình tự động sửa lỗi không bao giờ làm hỏng tệ hơn bản gốc và tự động cập nhật giao diện trực tiếp.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Nếu một file 3D nặng 150 MB đang được Chrome tải xuống `Downloads` (mới được 50 MB), điều gì xảy ra nếu Watcher không dùng `waitForStableFile()`?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Vòng lặp An toàn của Mỗi Chặng Sửa (A → H)',
        kind: 'Flowchart',
        nodes: [
          { id: 'p1', type: 'box', x: 30, y: 60, w: 150, h: 62, label: '1. Snapshot File\ntrước chặng', color: '#EDEAE2' },
          { id: 'p2', type: 'box', x: 220, y: 60, w: 155, h: 62, label: '2. Chạy công thức\n(vd R03 Axis/Scale)', color: '#B99B79' },
          { id: 'p3', type: 'diamond', x: 415, y: 48, w: 165, h: 86, label: '3. Invariant\nno_regression?', color: '#A7B6D2' },
          { id: 'p4', type: 'note', x: 415, y: 178, w: 165, h: 56, label: 'Fail → Rollback\nkhôi phục Snapshot', color: '#C27B76' },
        ],
        edges: [
          { id: 'pe1', fromX: 180, fromY: 91, toX: 220, toY: 91, color: '#EDEAE2' },
          { id: 'pe2', fromX: 375, fromY: 91, toX: 415, toY: 91, color: '#B99B79' },
          { id: 'pe3', fromX: 497, fromY: 134, toX: 497, toY: 178, label: 'false', color: '#C27B76' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_pipe_1',
        tasks: [
          {
            id: 'pr_ai_pipe_1',
            level: 'Medium',
            title: 'Cài đặt Staged Pipeline có Rollback khi tăng lỗi',
            prompt: 'Cho `doc = { bugs: 5, log: [] }` và mảng các hàm `stages`. Trước mỗi stage, sao chép bản snapshot `{ bugs: doc.bugs, log: [...doc.log] }`. Chạy `next = fn(snapshotCopy)`: nếu `next.bugs > doc.bugs` (vi phạm bất biến!) thì giữ nguyên `doc` (Rollback), ngược lại cập nhật `doc = next`. Trả về `doc` cuối.',
            testCasesText: 'Stage làm tăng bugs từ 5 lên 8 phải bị bỏ qua, chỉ giữ stage giảm bugs.',
            starterJava: '// Keep snapshot before each stage, rollback if next.bugs > curr.bugs',
            starterJs: `function runSafePipeline(initialDoc, stages) {
  let curr = { bugs: initialDoc.bugs, log: [...initialDoc.log] };
  for (const stage of stages) {
    const draft = { bugs: curr.bugs, log: [...curr.log] };
    const next = stage(draft);
    if (next && next.bugs <= curr.bugs) {
      curr = next;
    }
  }
  return curr;
}`,
            referenceSolution: 'Chỉ chấp nhận kết quả chặng khi `next.bugs <= curr.bugs`; nếu tăng lỗi thì giữ nguyên bản trước đó.',
            solutionNotes: 'Đúng tinh thần bất biến `no_regression` trong `staged-repair-executor.service.ts`.',
            jsVerifierFnBody: `const r = runSafePipeline({bugs:5,log:[]}, [d=>({bugs:d.bugs-2,log:[...d.log,'R1']}), d=>({bugs:d.bugs+4,log:[...d.log,'BAD']}), d=>({bugs:d.bugs-1,log:[...d.log,'R2']})]); return r.bugs===2 && r.log.join(',')==='R1,R2';`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_pipe_1',
          kind: 'recall',
          prompt: 'Trong quét kỹ thuật `S0→S8`, "Early Stop" nghĩa là gì và có tác dụng gì?',
          correctAnswer: 'Nếu ngay chặng đầu S0 phát hiện lỗi không thể cứu/đọc (như file đóng gói .uasset), dừng pipeline sớm lập tức để tiết kiệm CPU/thời gian không cần quét tiếp S1..S8.',
          userAnswer: '',
          revealed: false,
          explanation: 'Fail-fast tiết kiệm tài nguyên lớn khi xử lý hàng loạt.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Áp dụng mẫu Snapshot + Invariant Check cho mọi script biến đổi file hoặc dữ liệu quan trọng.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // BÀI 04: LUẬT CỨNG & HÀNG RÀO AI (AiDecisionGate - 8 LUẬT VÀNG)
    // =========================================================================
    {
      id: 'top_ai_guardrails',
      subjectId: 'subj_ai',
      moduleGroup: '04 · Hàng rào Bảo vệ AI',
      title: '04. Luật Cứng YAML & Hàng Rào AiDecisionGate (8 Luật Vàng)',
      subtitle: 'Tại sao không thả xích gọi thẳng LLM và cách dựng 8 chốt chặn bảo vệ hệ thống',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 30,
      relatedTopicIds: ['top_ai_ml_models', 'top_ai_agents'],
      theory: {
        definition:
          'Người mới hay nghĩ "làm AI là cứ gọi API ChatGPT/Gemini trả lời hết". Trong công nghiệp, làm vậy sẽ chết vì: AI dễ trả chữ linh tinh làm crash app, chạy chậm/tốn tiền, và có thể lỡ tay cho xe ăn cắp bản quyền (L3) lên Showroom! Vì vậy phải có **Rule Engine (Luật cứng YAML đi trước)** + **AiDecisionGate (Hàng rào 8 luật kiểm soát mọi quyết định AI)**.',
        why:
          'Trong một xưởng tự động, **Luật cứng (Deterministic)** đóng vai Luật pháp tối thượng không thể bẻ cong; còn **AI** chỉ là Nhân viên tư vấn thông minh bị giám sát nghiêm ngặt từng câu trả lời. Nếu AI chết hoặc đoán mờ, hệ thống lập tức hạ cánh an toàn về luật cứng (`Fallback`), không bao giờ đứng dây chuyền.',
        how:
          'Mọi lời gọi AI trong Xưởng 3D đều phải chui qua cổng `ai-decision-gate.service.ts`, áp dụng trọn vẹn **8 luật vàng (`GLB-AI-001` đến `GLB-AI-008`)** định nghĩa trong `global.rules.yaml`.',
        internalMechanism: [
          'GLB-AI-001: AI KHÔNG BAO GIỜ được tự đổi `assets.state`; chỉ `WorkflowOrchestrator` mới có quyền đổi trạng thái.',
          'GLB-AI-002 & 003: Output bắt buộc đúng Schema JSON (`validateOutput`) và Action phải nằm trong danh sách cho phép (`allowed_actions`) của phòng đó.',
          'GLB-AI-004: AI phải kèm điểm tự tin (`confidence`). Nếu `< min_confidence` (mặc định `0.75`) -> không tự áp dụng, đẩy vào Kho chờ cho người duyệt!',
          'GLB-AI-005: AI không được phép tự hạ mức nghiêm trọng của luật cứng HARD (vd `LEG-H-009` cấm AI tự hạ xe game-rip L3 xuống L0, chỉ được nâng cảnh báo!).',
          'GLB-AI-006..008: Bắt buộc ghi Log đầy đủ (`prompt_hash`, `input_hash`, `output`, `confidence`, `applied`, `reason_rejected`, `latency_ms`) vào bảng `ai_decisions`; nếu AI sập/timeout -> Fallback về heuristic; `temperature = 0` để tái lập kết quả.',
        ],
        codeLanguage: 'typescript',
        codeExample: `function runAiDecisionGate(
  aiOut: { action?: string; confidence?: number } | null,
  allowedActions: string[],
  hardLevel: 'PASS' | 'WARN' | 'BLOCK',
  minConfidence = 0.75
) {
  if (hardLevel === 'BLOCK') return { applied: false, reason: 'HARD_RULE_BLOCKED' };
  if (!aiOut || typeof aiOut.action !== 'string') return { applied: false, reason: 'INVALID_JSON' };
  if (!allowedActions.includes(aiOut.action)) return { applied: false, reason: 'DISALLOWED_ACTION' };
  if ((aiOut.confidence ?? 0) < minConfidence) return { applied: false, reason: 'LOW_CONFIDENCE_TO_HUMAN' };
  return { applied: true, action: aiOut.action };
}`,
        tradeOffs: {
          pros: [
            '100% không bao giờ sập hệ thống hay vi phạm pháp lý dù AI nói sảng hoặc server AI bị sập.',
            'Audit truy vết rõ từng lần AI chạy: tại sao bị chặn, mất bao nhiêu ms, tự tin bao nhiêu %.',
          ],
          cons: [
            'Cần viết lớp Schema & Luật cứng rõ ràng và giữ file log `ai_decisions` sạch sẽ.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Gọi GPT/Gemini với prompt dặn \'Hãy trả về đúng JSON và đừng phạm luật\' là an toàn rồi." → SAI! Prompt chỉ là lời khuyên xác suất, bắt buộc phải kiểm chứng bằng code thật tại `AiDecisionGate`!',
        ],
        references: [{ label: 'Dự án mẫu: global.rules.yaml & ai-decision-gate.service.ts', url: '' }],
      },
      notes: {
        markdown:
          '### 8 Chốt chặn của AiDecisionGate\n1. Không tự đổi `assets.state`\n2. Đúng Schema JSON\n3. Nằm trong `allowed_actions`\n4. `confidence >= 0.75`\n5. Không hạ mức `HARD` rule\n6. Log mọi quyết định (`ai_decisions`)\n7. Timeout/Crash -> Fallback Heuristic\n8. `temperature = 0` để tái lập.',
        pitfallsAndFixes: 'Khi thấy AI hay bị từ chối ở log `ai_decisions` với lý do `LOW_CONFIDENCE`, đó chính là tín hiệu vàng cần lấy dữ liệu đó cho người gán nhãn (Active Learning).',
        tags: ['guardrails', 'rules-engine', 'deterministic'],
      },
      explain: {
        whatIsIt: 'Cổng kiểm duyệt xác định bằng code thuần đứng giữa mô hình AI và hệ thống nghiệp vụ thực thi.',
        whyItExists: 'AI luôn có xác suất đoán sai; Guardrails biến AI thành trợ lý hữu ích mà vẫn giữ kỷ luật thép cho doanh nghiệp.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Xe CAR-0009 bị Luật cứng Pháp chế LEG-H-009 chấm là hàng game-rip L3 (Cấm), nhưng mô hình AI chấm 0.99 điểm tự tin cho rằng xe hợp lệ L0. Điều gì sẽ xảy ra tại AiDecisionGate?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Luồng Kiểm Duyệt AiDecisionGate (GLB-AI-001 → 008)',
        kind: 'Flowchart',
        nodes: [
          { id: 'g1', type: 'box', x: 25, y: 55, w: 145, h: 64, label: '1. HARD Rules\n(YAML Deterministic)', color: '#C27B76' },
          { id: 'g2', type: 'box', x: 210, y: 55, w: 155, h: 64, label: '2. AI Model Output\n(JSON, temp=0)', color: '#A7B6D2' },
          { id: 'g3', type: 'diamond', x: 405, y: 44, w: 185, h: 86, label: '3. Gate Check:\nSchema + Allowed + >=0.75', color: '#B99B79' },
          { id: 'g4', type: 'box', x: 410, y: 175, w: 175, h: 56, label: 'Pass -> Đề xuất Orchestrator\nFail -> Fallback / Hold + Log', color: '#9BAA98' },
        ],
        edges: [
          { id: 'ge1', fromX: 170, fromY: 87, toX: 210, toY: 87, label: 'not blocked', color: '#EDEAE2' },
          { id: 'ge2', fromX: 365, fromY: 87, toX: 405, toY: 87, color: '#A7B6D2' },
          { id: 'ge3', fromX: 497, fromY: 130, toX: 497, toY: 175, label: 'audit log', color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_gate_1',
        tasks: [
          {
            id: 'pr_ai_gate_1',
            level: 'Medium',
            title: 'Code hàm AiDecisionGate thực thi đủ 4 chốt chặn',
            prompt: 'Viết `gateCheck(aiOut, allowed, isHardBlocked)`: nếu `isHardBlocked` trả `{applied:false, reason:"HARD_BLOCK"}`; nếu `!aiOut || !allowed.includes(aiOut.action)` trả `{applied:false, reason:"INVALID_ACTION"}`; nếu `(aiOut.confidence||0) < 0.75` trả `{applied:false, reason:"LOW_CONF"}`; ngược lại trả `{applied:true, action: aiOut.action}`.',
            testCasesText: 'Hợp lệ với confidence=0.85 -> applied:true; hardBlocked -> applied:false kể cả confidence=0.99.',
            starterJava: '// Guardrail gate validating hardBlock, allowed action & threshold 0.75',
            starterJs: `function gateCheck(aiOut, allowed, isHardBlocked) {
  if (isHardBlocked) return { applied: false, reason: 'HARD_BLOCK' };
  if (!aiOut || !allowed.includes(aiOut.action)) return { applied: false, reason: 'INVALID_ACTION' };
  if ((aiOut.confidence || 0) < 0.75) return { applied: false, reason: 'LOW_CONF' };
  return { applied: true, action: aiOut.action };
}`,
            referenceSolution: 'Kiểm tra tuần tự từ Hard Rule -> Schema/Allowed Action -> Min Confidence `0.75`.',
            solutionNotes: 'Giống hệt cốt lõi `ai-decision-gate.service.ts` bảo vệ dây chuyền thật.',
            jsVerifierFnBody: `return gateCheck({action:'L0',confidence:0.99},['L0','L2'],true).reason==='HARD_BLOCK' && gateCheck({action:'L0',confidence:0.6},['L0'],false).reason==='LOW_CONF' && gateCheck({action:'L0',confidence:0.8},['L0'],false).applied===true;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_gate_1',
          kind: 'recall',
          prompt: 'Vì sao đặt `temperature = 0` trong lời gọi AI sản xuất lại là một trong 8 luật vàng (`GLB-AI-008`)?',
          correctAnswer: 'Để đảm bảo tính tái lập (Reproducibility): cùng một đầu vào và phiên bản model thì kết quả luôn ổn định nhất quán, dễ debug và kiểm thử.',
          userAnswer: '',
          revealed: false,
          explanation: 'AI sáng tạo văn học cần temperature cao, AI vận hành quy trình cần ổn định tuyệt đối.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Bất kỳ tính năng AI nào trong sản phẩm đều nên gói sau 1 lớp Gate như thế này.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // BÀI 05: 5 MÔ HÌNH AI/ML THỰC CHIẾN CHO 5 PHÒNG BAN
    // =========================================================================
    {
      id: 'top_ai_ml_models',
      subjectId: 'subj_ai',
      moduleGroup: '05 · 5 Mô hình AI/ML Thực Chiến',
      title: '05. 5 Mô hình AI/ML Cho 5 Phòng Ban (Naive Bayes · Logistic · Bandit · RAG · 3-Sigma)',
      subtitle: 'Hiểu bản chất từng thuật toán không cần toán hàn lâm & tự chạy trên CPU siêu nhẹ',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 20,
      relatedTopicIds: ['top_ai_guardrails', 'top_ai_sidecar_vision'],
      theory: {
        definition:
          'Thay vì dùng 1 LLM khổng lồ tốn tiền cho mọi việc, hệ thống dùng **5 thuật toán ML/Thống kê đúng người đúng việc** chạy tức thì trên CPU và tự học giỏi dần lên: (1) **Naive Bayes 3-gram** đoán hãng xe từ tên file; (2) **Logistic Regression SGD** chấm rủi ro bản quyền giấy phép; (3) **Contextual Bandit UCB1** học chọn công thức sửa tốt nhất; (4) **RAG (TF-IDF + Cosine Similarity)** tra tiền lệ xử lý cũ của Giám đốc; (5) **Thống kê 3-Sigma (Z-Score)** phát hiện ngày có tỷ lệ lỗi bất thường.',
        why:
          'Mỗi bài toán có độ phức tạp khác nhau: đoán chữ `avntdr_svj_v12.glb` là Lamborghini chỉ mất < 1ms bằng Naive Bayes 3-gram thay vì tốn 3 giây gọi LLM! Chọn công thức sửa `R03` hay `R16` lại là bài toán học từ thưởng/phạt thực tế (Bandit RL) mà LLM không tự rút kinh nghiệm được qua từng lần sửa.',
        how:
          '1) **Naive Bayes 3-gram** (`intake`): Băm tên file thành chuỗi 3 ký tự (`lam`, `amb`, `mbo`...) cộng xác suất ra hãng (và bắt buộc nằm trong `brands.yaml`). 2) **Logistic Regression** (`legal`): Học trọng số cặp 2 từ (`bigrams` như `"personal use"`, `"forza"`). 3) **Bandit UCB1** (`repair`): Khai thác công thức điểm cao + thử nhẹ công thức ít dùng, tính Reward (`+10` mỗi lỗi hết, `-5` lỗi mới, `-15` rollback, `-1` nếu `>30s`). 4) **RAG Cosine** (`hold`): Biến lỗi thành Vector số và tìm tiền lệ góc gần 0° nhất. 5) **Z-Score 3-Sigma** (`report`): Lỗi hôm nay `> μ + 3σ` thì hú còi!',
        internalMechanism: [
          '1. `naive-bayes-brand.model.ts`: Char 3-gram + từ khóa -> đoán hãng xe siêu nhanh, ép phải khớp danh sách `brands.yaml` (`INT-AI-001`).',
          '2. `logistic-legal-risk.model.ts`: Word bigrams + SGD -> xếp hạng `L0..L3`, không bao giờ hạ mức L3 do luật cứng kết luận (`LEG-H-009`).',
          '3. `linucb-repair-bandit.model.ts` & `local-department-trainer.ts`: Mỗi công thức R01..R16 là một "cần gạt"; `Reward = +10*fixed - 5*newBugs - 15*rollback - 1*slow`.',
          '4. `precedent-rag.model.ts`: TF-IDF / Dense 32-d vector + Cosine Similarity tìm lại các vụ CEO từng giải quyết (Active Learning + Reverse Learning v1→v2).',
          '5. `kpi-anomaly-detector.model.ts`: Tính trung bình μ và độ lệch chuẩn σ; vượt ngưỡng 3σ bật cờ đỏ bất thường (`RPT-AI-001`) + bộ dịch hỏi tiếng Việt sang SQL `SELECT` chỉ đọc (`RPT-AI-002`).',
        ],
        codeLanguage: 'javascript',
        codeExample: `// 1) Tính điểm thưởng cho Bandit Xưởng Sửa (Reward Function)
function computeRepairReward(fixed: number, addedBugs: number, rolledBack: boolean, sec: number) {
  return fixed * 10 - addedBugs * 5 - (rolledBack ? 15 : 0) - (sec > 30 ? 1 : 0);
}

// 2) Đo độ giống nhau giữa 2 vector lỗi cho RAG (Cosine Similarity: 0 -> 1)
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return (na && nb) ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}`,
        tradeOffs: {
          pros: [
            'Chạy siêu nhanh (vài mili-giây trên CPU, tốn 0 đồng API cloud), giải thích được vì sao chọn.',
            'Càng nhiều xe chạy qua xưởng và được con người duyệt, hệ thống càng tự học thông minh lên theo thời gian.',
          ],
          cons: [
            'Cần tích lũy đủ dữ liệu thực tế ban đầu (Cold Start) và thiết kế bộ trích xuất đặc trưng (n-gram, bigram, vector) gọn gàng.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Machine Learning cổ điển (Naive Bayes, Logistic, Bandit, Z-Score) đã lỗi thời." → SAI! Trong hệ thống thực tế, chúng nhanh gấp 1000 lần LLM, chạy offline, giải thích minh bạch và tiết kiệm cực nhiều tiền.',
        ],
        references: [{ label: 'Dự án mẫu: backend/src/infrastructure/ai/models/ (5 models)', url: '' }],
      },
      notes: {
        markdown:
          '- **Intake**: Naive Bayes 3-gram (đoán hãng).\n- **Legal**: Logistic Regression Bigrams (rủi ro L0..L3).\n- **Repair**: Bandit UCB1 + Reward (`+10/-5/-15/-1`).\n- **Hold**: RAG Vector + Cosine Similarity (tìm tiền lệ CEO).\n- **Report**: 3-Sigma Z-Score (báo bất thường).',
        pitfallsAndFixes: 'Trong Bandit UCB1, nếu không có bước "Khám phá" (Exploration), thuật toán sẽ bám mãi vào 1 công thức cũ mà không bao giờ thử công thức mới tốt hơn.',
        tags: ['naive-bayes', 'bandit', 'rag', 'cosine-similarity', 'z-score'],
      },
      explain: {
        whatIsIt: 'Bộ 5 thuật toán học máy & thống kê gọn nhẹ được chọn riêng cho đúng tính chất từng phòng ban.',
        whyItExists: 'Không dùng dao mổ trâu (LLM nặng chậm đắt) để gọt táo (phân loại tên file hay tính bất thường số liệu).',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Nếu công thức sửa R07 xử lý hết 2 lỗi nhưng gây ra 1 lỗi mới và mất 40 giây, tổng điểm thưởng (Reward) theo công thức của Xưởng là bao nhiêu?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: '5 Phòng Ban ↔ 5 Thuật Toán AI/ML Đúng Chỗ',
        kind: 'Architecture',
        nodes: [
          { id: 'm1', type: 'box', x: 25, y: 25, w: 185, h: 52, label: '1. Lễ tân: Naive Bayes\n(Char 3-gram đoán hãng)', color: '#EDEAE2' },
          { id: 'm2', type: 'box', x: 235, y: 25, w: 195, h: 52, label: '2. Pháp chế: Logistic Reg\n(Bigrams rủi ro L0..L3)', color: '#C27B76' },
          { id: 'm3', type: 'box', x: 455, y: 25, w: 195, h: 52, label: '3. Xưởng sửa: Bandit UCB1\n(Reward +10/-5/-15/-1)', color: '#B99B79' },
          { id: 'm4', type: 'box', x: 110, y: 120, w: 210, h: 54, label: '4. Kho chờ: RAG Cosine\n(Tìm tiền lệ CEO duyệt)', color: '#A7B6D2' },
          { id: 'm5', type: 'box', x: 355, y: 120, w: 210, h: 54, label: '5. Báo cáo: Z-Score 3-Sigma\n(Phát hiện tỷ lệ lỗi lạ)', color: '#9BAA98' },
        ],
        edges: [
          { id: 'me1', fromX: 210, fromY: 51, toX: 235, toY: 51, color: '#EDEAE2' },
          { id: 'me2', fromX: 430, fromY: 51, toX: 455, toY: 51, color: '#B99B79' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_ml_1',
        tasks: [
          {
            id: 'pr_ai_ml_1',
            level: 'Medium',
            title: 'Cài đặt Hàm Thưởng Bandit & Cosine Similarity cho RAG',
            prompt: 'Viết hàm `findMostSimilar(queryVec, cases)` nhận `cases` gồm `[{id, vec}]` và trả về `id` có Cosine Similarity lớn nhất (gần 1 nhất) với `queryVec`.',
            testCasesText: 'query=[1,0], cases=[{id:"A",vec:[0,1]},{id:"B",vec:[0.9,0.1]}] -> trả "B".',
            starterJava: '// Compute dot(a,b) / (|a| * |b|) and pick max id',
            starterJs: `function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return (na && nb) ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
function findMostSimilar(queryVec, cases) {
  let bestId = null, bestScore = -1;
  for (const c of cases) {
    const score = cosine(queryVec, c.vec);
    if (score > bestScore) { bestScore = score; bestId = c.id; }
  }
  return bestId;
}`,
            referenceSolution: 'Tính độ đo Cosine trong `[0..1]` rồi chọn phần tử đạt giá trị cao nhất.',
            solutionNotes: 'Cosine Similarity đo góc lệch giữa 2 vector nên không bị ảnh hưởng bởi độ dài văn bản.',
            jsVerifierFnBody: `return findMostSimilar([1,0], [{id:'A',vec:[0,1]},{id:'B',vec:[0.9,0.2]}]) === 'B';`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_ml_1',
          kind: 'recall',
          prompt: 'Thước đo 3-Sigma (`Z-Score > 3`) ở Phòng Báo cáo dùng để phát hiện điều gì?',
          correctAnswer: 'Phát hiện sự tăng vọt bất thường của tỷ lệ lỗi hôm nay so với trung bình và độ lệch chuẩn lịch sử những ngày trước.',
          userAnswer: '',
          revealed: false,
          explanation: 'Giúp báo động ngay khi một nguồn tải hoặc công đoạn bỗng dưng lỗi hàng loạt.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Thử thay Cosine Similarity bằng việc tìm kiếm bài viết/ghi chú liên quan ngay trong NOETRIX.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // BÀI 06: PYTHON AI SIDECAR, VISION-LLM QA & GEOMETRY FINGERPRINTING
    // =========================================================================
    {
      id: 'top_ai_sidecar_vision',
      subjectId: 'subj_ai',
      moduleGroup: '06 · Sidecar, Vision QA & 3D Geometry',
      title: '06. Python AI Sidecar (:5180), Vision-LLM QA & Geometry Fingerprinting',
      subtitle: 'Kết nối Node.js ↔ Python PyTorch/Vision AI và đối chiếu hình học 3D ghép phụ tùng',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 10,
      relatedTopicIds: ['top_ai_ml_models', 'top_ai_roadmap_0to1'],
      theory: {
        definition:
          '1) **Sidecar Pattern**: Backend chính viết bằng TypeScript/Node.js cực mạnh về web/queue/I/O, còn các model AI nặng (PyTorch, DeBERTa, Qwen2.5-VL, Ollama) chạy ở một tiến trình Python riêng biệt (`server.py` tại `http://127.0.0.1:5180`), giao tiếp qua HTTP JSON gọn nhẹ! 2) **Multimodal Vision QA**: Chụp ảnh 4 góc xe 3D gửi AI nhìn bằng mắt kiểm tra xem xe có bị lật ngửa, bay lơ lửng hay kính đục không. 3) **Geometry Fingerprinting**: Đo tỷ lệ Dài-Rộng-Cao, hình bóng 2D hông/trên và vị trí bánh xe so với xe mẫu chuẩn trong Showroom — chỉ cho phép ghép gầm/nội thất donor khi khớp `>= 55%`.',
        why:
          'Không thể chạy thẳng PyTorch hay CUDA bên trong Node.js, và cũng không nên viết cả Web Backend chỉ bằng Python nếu đội ngũ đã tối ưu TypeScript + Three.js! Mô hình Sidecar giúp kết hợp tinh hoa của cả hai thế giới và giữ **Active Learning Loop** (xuất dữ liệu JSONL từ thao tác duyệt của con người -> Python train lại model mới).',
        how:
          'Node.js gọi `http-sidecar-ai-advisor.ts` với timeout chặt -> Python `server.py` chạy suy luận và trả JSON. Nếu Python Sidecar tắt hoặc lỗi -> `AiDecisionGate` tự động rơi về mô hình nhẹ cục bộ (`GLB-AI-007`), dây chuyền vẫn chạy không bị treo! Còn ở ghép phụ tùng (`part-completeness-inspector.ts` & `showroom-donor-library.adapter.ts`), hệ thống ưu tiên xe có sẵn `cabin.glb` / `underbody.glb` và chỉ ghép khi độ khớp hình học `>= 0.55`.',
        internalMechanism: [
          'Sidecar Pattern (`server.py` ↔ `http-sidecar-ai-advisor.ts`): Tách biệt tiến trình giúp Python crash cũng KHÔNG làm sập Node.js Backend.',
          'Active Learning Export (`train_from_export.py`): Mọi thao tác CEO xử lý xe ở Kho chờ hoặc kỹ thuật viên nạp file v1 → v2 được xuất ra file `.jsonl` để huấn luyện lại model định kỳ.',
          'Multimodal Vision QA (`trained-workflow-ai-advisor.ts`): Gửi ảnh chụp 4 góc nhìn (Front, Side, Rear, 3/4) cho Vision-LLM (`llava` / Gemini Vision) phát hiện lỗi thị giác mà thông số tam giác thuần không nhìn ra (xe lộn ngược, kính đen kịt).',
          'Geometry Fingerprinting: Đo Bounding Box ratios (Dài:Rộng:Cao), hình chiếu 2D silhouette, tỷ lệ bánh -> ngưỡng `similarity >= 55%` mới ghép sidecar donor!',
        ],
        codeLanguage: 'typescript',
        codeExample: `// Kiểm tra độ khớp tỷ lệ Bounding Box 3D trước khi ghép khoang lái Donor
function boxSimilarity(a: [number, number, number], b: [number, number, number]): number {
  // Chuẩn hóa theo chiều dài trục lớn nhất = 1
  const norm = (v: [number, number, number]) => {
    const m = Math.max(...v) || 1;
    return [v[0] / m, v[1] / m, v[2] / m];
  };
  const na = norm(a), nb = norm(b);
  const diff = (Math.abs(na[0] - nb[0]) + Math.abs(na[1] - nb[1]) + Math.abs(na[2] - nb[2])) / 3;
  return Math.max(0, 1 - diff); // >= 0.55 mới cho phép ghép donor part
}`,
        tradeOffs: {
          pros: [
            'Tách rời môi trường Python GPU/ML khỏi Node.js Backend giúp deploy, nâng cấp model độc lập.',
            'Phát hiện lỗi thị giác thật sự bằng Vision AI và tránh ghép nhầm phụ tùng xe tải vào xe đua.',
          ],
          cons: [
            'Tốn thêm độ trễ gọi HTTP nội bộ giữa 2 tiến trình và cần quản lý thêm tiến trình Python.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Phải viết lại toàn bộ Backend bằng Python thì mới dùng được AI PyTorch." → SAI! Sidecar Pattern qua localhost HTTP JSON là chuẩn công nghiệp để ghép Node.js/Go/Java với Python AI.',
        ],
        references: [{ label: 'Dự án mẫu: http-sidecar-ai-advisor.ts & part-completeness-inspector.ts', url: '' }],
      },
      notes: {
        markdown:
          '- **Sidecar (`:5180`)**: Node.js lo Workflow, Python chạy AI nặng; Sidecar sập -> Fallback an toàn.\n- **Active Learning Loop**: Người duyệt/sửa v1→v2 → xuất JSONL → `train_from_export.py` → Model mới khôn hơn.\n- **Donor Match**: Đo hình học + tỷ lệ bánh đạt `>= 55%` mới ghép.',
        pitfallsAndFixes: 'Khi gọi Sidecar HTTP từ Node.js, LUÔN đặt `AbortSignal.timeout(3000)` để tránh Python treo kéo nghẽn hàng đợi Worker.',
        tags: ['sidecar', 'vision-llm', 'active-learning', 'geometry'],
      },
      explain: {
        whatIsIt: 'Kiến trúc chạy mô hình AI Python ở một tiến trình kề bên (Sidecar) phục vụ Backend chính qua HTTP JSON, kết hợp Vision QA và so khớp hình học 3D.',
        whyItExists: 'Tận dụng hệ sinh thái ML vô địch của Python mà vẫn giữ sự gọn nhẹ, ổn định của TypeScript Backend.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Điều gì xảy ra nếu tiến trình Python Sidecar ở port `5180` đột nhiên bị tắt khi Backend đang xử lý 5 xe 3D?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Sidecar Pattern & Vòng Lặp Active Learning',
        kind: 'Architecture',
        nodes: [
          { id: 's1', type: 'box', x: 30, y: 55, w: 170, h: 66, label: 'Node.js Backend\n(Workflow + Gate)', color: '#EDEAE2' },
          { id: 's2', type: 'box', x: 250, y: 55, w: 175, h: 66, label: 'Python Sidecar :5180\n(ML / Vision-LLM)', color: '#A7B6D2' },
          { id: 's3', type: 'box', x: 470, y: 55, w: 185, h: 66, label: 'Human / CEO Override\n& JSONL Export Train', color: '#9BAA98' },
        ],
        edges: [
          { id: 'se1', fromX: 200, fromY: 88, toX: 250, toY: 88, label: 'HTTP+Timeout', color: '#B99B79' },
          { id: 'se2', fromX: 425, fromY: 88, toX: 470, toY: 88, label: 'low conf', color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_side_1',
        tasks: [
          {
            id: 'pr_ai_side_1',
            level: 'Easy',
            title: 'Viết hàm đối chiếu tỷ lệ hộp 3D chọn Donor (ngưỡng >= 0.55)',
            prompt: 'Viết `canMergeDonor(carBox, donorBox)`: chuẩn hóa mỗi mảng `[L, W, H]` bằng cách chia cho giá trị lớn nhất của chính nó, tính `diff = tổng(|na[i] - nb[i]|) / 3`, độ khớp `sim = 1 - diff`. Trả `true` nếu `sim >= 0.55`.',
            testCasesText: 'Xe thể thao [4.4, 1.9, 1.2] ghép với donor [4.5, 1.95, 1.25] -> true; với xe buýt [12, 2.5, 3.2] -> kiểm tra độ khớp.',
            starterJava: '// Normalize [L,W,H] by max axis and check 1 - avgAbsDiff >= 0.55',
            starterJs: `function canMergeDonor(a, b) {
  const norm = v => { const m = Math.max(...v) || 1; return v.map(x => x / m); };
  const na = norm(a), nb = norm(b);
  const diff = (Math.abs(na[0]-nb[0]) + Math.abs(na[1]-nb[1]) + Math.abs(na[2]-nb[2])) / 3;
  return (1 - diff) >= 0.55;
}`,
            referenceSolution: 'Chuẩn hóa tỷ lệ theo trục lớn nhất giúp bỏ qua sai lệch đơn vị mét/centimet mà vẫn so đúng dáng xe.',
            solutionNotes: 'Giống bước đầu của Geometry Fingerprinting trong Xưởng 3D.',
            jsVerifierFnBody: `return canMergeDonor([4.4,1.9,1.2],[4.5,1.95,1.25])===true && canMergeDonor([4.4,1.9,1.2],[2.0,2.0,4.0])===false;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_side_1',
          kind: 'recall',
          prompt: 'Tại sao gọi thao tác duyệt xe ở Kho chờ và nạp bản sửa tay `v1 -> v2` là vòng lặp Active Learning?',
          correctAnswer: 'Vì những ca mà AI chưa chắc chắn được đẩy cho con người xử lý; quyết định của con người lại được lưu thành nhãn chuẩn để huấn luyện lại model giỏi hơn cho lần sau.',
          userAnswer: '',
          revealed: false,
          explanation: 'Human-in-the-loop là động cơ tiến hóa thực sự của AI trong doanh nghiệp.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Luôn thiết kế sẵn cơ chế thu thập phản hồi sửa tay của người dùng để làm dữ liệu train lại AI.',
        nextReviewDate: addDaysIso(10),
        intervalDays: 10,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // BÀI 07: LỘ TRÌNH TỰ HỌC 8 GIAI ĐOẠN (0 → TỰ LÀM ĐƯỢC)
    // =========================================================================
    {
      id: 'top_ai_roadmap_0to1',
      subjectId: 'subj_ai',
      moduleGroup: '07 · Lộ Trình Thực Hành 8 Giai Đoạn',
      title: '07. Lộ Trình Tự Học 8 Giai Đoạn (0 → Tự Làm Hệ Thống Workflow + AI)',
      subtitle: 'Kế hoạch 12 tuần chi tiết từng bước & bài tập mini project tự code cho người mới hoàn toàn',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 5,
      relatedTopicIds: ['top_ai_intro_clean_arch', 'top_ai_fsm_queue', 'top_ai_ml_models'],
      theory: {
        definition:
          'Nếu xuất phát từ con số 0, ĐỪNG nhảy ngay vào đọc 3D Three.js hay Docker phức tạp! Hãy đi tuần tự đúng 8 giai đoạn (12 tuần), mỗi giai đoạn học đúng 1 mảnh ghép và tự tay gõ xong 1 bài mini-project rồi mới sang chặng sau. Kim chỉ nam suốt hành trình: **Workflow giữ hệ thống chạy bền bỉ không rớt việc + Luật cứng chống phạm sai lầm chết người + AI tăng tốc và tự học giỏi lên dưới giám sát con người**.',
        why:
          'Người mới học hay bị ngợp vì ôm quá nhiều thứ cùng lúc (Docker + Three.js + PyTorch + Clean Architecture). Tách thành 8 viên gạch nhỏ giúp bạn nhìn thấy sản phẩm chạy được sau mỗi tuần.',
        how:
          'Tuần 1–2: TypeScript + HTTP API cơ bản → Tuần 3: Tách lớp Clean Architecture → Tuần 4: FSM & Audit Log + Unit Test → Tuần 5–6: Job Queue, Transaction, Row Lock & Watcher thư mục → Tuần 7: Luật YAML + `AiDecisionGate` → Tuần 8–10: Tự code 5 model ML/Bandit/RAG/3-Sigma → Tuần 11: Python Sidecar & JSONL Active Learning → Tuần 12+: Dashboard SSE Realtime + 3D Showroom.',
        internalMechanism: [
          'Giai đoạn 1 (Tuần 1–2): Biến, `async/await`, JSON, HTTP (`GET/POST/DELETE`, status 200/400/404/409), TypeScript interface/class. → Bài tập: Viết API `POST /cars` & `GET /cars` bằng Fastify lưu trong RAM.',
          'Giai đoạn 2 (Tuần 3): Dependency Injection, Port & Adapter (`container.ts`, `clean-architecture.test.ts`). → Bài tập: Đổi API Tuần 1–2 qua lại giữa lưu RAM và lưu file JSON không sửa logic.',
          'Giai đoạn 3 (Tuần 4): Finite State Machine & Event Audit Log (`asset-state-machine.ts`). → Bài tập: Quy trình duyệt bài `draft -> review -> published/rejected` + test chặn nhảy cóc bằng `node:test`.',
          'Giai đoạn 4 (Tuần 5–6): Job Queue Producer/Consumer, Idempotency, Transaction + `chokidar` Watcher (`in-process-job-queue.ts`, `chokidar-inbox.watcher.ts`). → Bài tập: Ném file `.txt` vào `inbox/` → tự chuyển `work/` → chạy Queue xong → xóa ở `inbox/`.',
          'Giai đoạn 5 (Tuần 7): YAML Rule Engine + `AiDecisionGate` (`global.rules.yaml`, `ai-decision-gate.service.ts`). → Bài tập: Viết hàm `AiGate` chặn JSON lỗi, timeout 3s, confidence < 0.75 và log lý do từ chối.',
          'Giai đoạn 6 (Tuần 8–10): Code 50–100 dòng cho mỗi thuật toán: Naive Bayes 3-gram, Logistic Regression SGD, Bandit UCB1 + Reward, TF-IDF + Cosine RAG, 3-Sigma Z-Score.',
          'Giai đoạn 7 (Tuần 11): Giao tiếp Node.js ↔ Python HTTP Sidecar + xuất JSONL train lại model (`server.py`, `train_from_export.py`).',
          'Giai đoạn 8 (Tuần 12+): Frontend gọi API + nghe `EventSource` (SSE) realtime + nút CEO duyệt/can thiệp + Three.js (`Scene`, `Camera`, `Renderer`, `GLTFLoader`).',
        ],
        codeLanguage: 'typescript',
        codeExample: `// Bản đồ tóm tắt 1 dòng để kiểm tra kiến thức toàn hệ thống:
type SystemPillars = {
  workflow: 'FSM + JobQueue + RowLock/TX + Watcher (Không bao giờ rớt việc)';
  guardrail: 'YAML HARD Rules + AiDecisionGate (Không bao giờ phạm sai lầm chết người)';
  intelligence: '5 ML/Bandit/RAG Models + Python Sidecar + Active Learning (Tự học mỗi ngày)';
};`,
        tradeOffs: {
          pros: [
            'Lộ trình tuyến tính từ dễ đến khó, không bị kẹt công nghệ phụ ngay tuần đầu.',
            'Học xong dùng được cho mọi ngành (thương mại điện tử, duyệt hồ sơ, xử lý tài liệu AI), không riêng xe 3D.',
          ],
          cons: [
            'Đòi hỏi tự gõ lại code bài tập nhỏ ở cuối mỗi giai đoạn thay vì chỉ đọc lướt.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Phải học thuộc hết toán Đại số tuyến tính và học xong PyTorch 6 tháng mới bắt đầu làm được hệ thống AI Workflow." → SAI! Chỉ cần nắm trực giác cộng trừ nhân chia ở 5 thuật toán cốt lõi + Clean Architecture là đã dựng được khung xương cực kỳ chắc chắn.',
        ],
        references: [{ label: 'Toàn bộ mã nguồn đối chiếu trong dự án Công ty Model 3D', url: '' }],
      },
      notes: {
        markdown:
          '### Checklist 8 chặng tự luyện\n- [ ] GĐ1: TypeScript + Fastify `POST/GET /cars`\n- [ ] GĐ2: Port/Adapter (RAM ↔ JSON)\n- [ ] GĐ3: FSM + Unit Test\n- [ ] GĐ4: Queue + Watcher thư mục `inbox/`\n- [ ] GĐ5: YAML Rules + `AiDecisionGate`\n- [ ] GĐ6: 5 mô hình ML/Bandit/RAG/Z-Score\n- [ ] GĐ7: Python Sidecar + JSONL Train\n- [ ] GĐ8: SSE Realtime + UI / Three.js',
        pitfallsAndFixes: 'Nếu thấy chặng nào bị bí, đừng bỏ qua nhảy cóc — quay lại viết 1 test case `node:test` nhỏ cho đúng chặng đó sẽ sáng ra ngay.',
        tags: ['roadmap', 'learning-path', 'workflow-ai'],
      },
      explain: {
        whatIsIt: 'Lộ trình 8 chặng trong 12 tuần đi từ lập trình TypeScript cơ bản tới tự dựng hoàn chỉnh một công ty tự động Workflow + AI.',
        whyItExists: 'Biến một hệ thống đồ sộ thành từng bước thực hành khả thi cho người xuất phát từ con số 0.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Nếu tự tay dựng lại phiên bản mini của hệ thống này trong 1 cuối tuần, 3 thành phần cốt lõi tối thiểu cần viết trước là gì?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Lộ Trình 8 Giai Đoạn Từ Con Số 0 → Hệ Thống Hoàn Chỉnh',
        kind: 'Flowchart',
        nodes: [
          { id: 'r1', type: 'box', x: 25, y: 35, w: 180, h: 56, label: 'GĐ 1–2 (Tuần 1–3)\nTS API + Clean Arch', color: '#EDEAE2' },
          { id: 'r2', type: 'box', x: 235, y: 35, w: 195, h: 56, label: 'GĐ 3–4 (Tuần 4–6)\nFSM + Queue + Watcher', color: '#A7B6D2' },
          { id: 'r3', type: 'box', x: 460, y: 35, w: 190, h: 56, label: 'GĐ 5–6 (Tuần 7–10)\nAiGate + 5 ML Models', color: '#B99B79' },
          { id: 'r4', type: 'box', x: 235, y: 140, w: 225, h: 58, label: 'GĐ 7–8 (Tuần 11–12+)\nPython Sidecar + SSE + 3D UI', color: '#9BAA98' },
        ],
        edges: [
          { id: 're1', fromX: 205, fromY: 63, toX: 235, toY: 63, color: '#EDEAE2' },
          { id: 're2', fromX: 430, fromY: 63, toX: 460, toY: 63, color: '#A7B6D2' },
          { id: 're3', fromX: 555, fromY: 91, toX: 347, toY: 140, color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_road_1',
        tasks: [
          {
            id: 'pr_ai_road_1',
            level: 'Mini Project',
            title: 'Thử thách tổng hợp: Phát hiện ngày bất thường bằng 3-Sigma',
            prompt: 'Viết hàm `isAnomaly(historyRates, todayRate)`: tính trung bình `mean`, độ lệch chuẩn `std` của `historyRates` (`sqrt(sum((x-mean)^2)/n)`). Nếu `std > 0` và `todayRate > mean + 3 * std`, trả `true` (cảnh báo đỏ bất thường!).',
            testCasesText: 'history=[0.05,0.06,0.05,0.04,0.05], today=0.60 -> true; today=0.06 -> false.',
            starterJava: '// Compute mean, standard deviation, and check today > mean + 3 * std',
            starterJs: `function isAnomaly(historyRates, todayRate) {
  const n = historyRates.length;
  if (!n) return false;
  const mean = historyRates.reduce((a, b) => a + b, 0) / n;
  const variance = historyRates.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return std > 0 && todayRate > mean + 3 * std;
}`,
            referenceSolution: 'Tính `mean`, `variance`, `std = sqrt(variance)`, kiểm tra vượt ngưỡng `mean + 3 * std`.',
            solutionNotes: 'Đúng logic `kpi-anomaly-detector.model.ts` ở Phòng Báo cáo!',
            jsVerifierFnBody: `return isAnomaly([0.05,0.06,0.05,0.04,0.05], 0.60) === true && isAnomaly([0.05,0.06,0.05,0.04,0.05], 0.06) === false;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_road_1',
          kind: 'recall',
          prompt: 'Đọc câu tổng kết 1 câu: Vai trò khác nhau của Workflow, Rule Engine và AI trong một hệ thống hoàn chỉnh là gì?',
          correctAnswer: 'Workflow (FSM + Queue + TX + Watcher) giữ dây chuyền chạy bền bỉ không rớt việc; Rule Engine (Luật cứng + AiDecisionGate) ngăn sai lầm chết người; AI (ML/Bandit/RAG/Sidecar) tăng tốc và tự học giỏi dần dưới giám sát con người.',
          userAnswer: '',
          revealed: false,
          explanation: 'Ba lớp này kết hợp mới tạo ra một hệ thống phần mềm AI dùng thật ngoài đời.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Theo từng chặng trong Notes để thực hành tuần tự.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },
  ];
}
