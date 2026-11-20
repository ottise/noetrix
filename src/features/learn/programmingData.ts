export type UnderstandingState = 'exposed' | 'understood' | 'applied';

export type LessonModuleId =
  | 'theory'
  | 'notes'
  | 'explain'
  | 'visualize'
  | 'practice'
  | 'experiment'
  | 'assessment'
  | 'review';

export interface DiagramNode {
  id: string;
  type: 'box' | 'diamond' | 'pill' | 'note';
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
}

export interface DiagramEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
  color: string;
}

export interface LessonDiagram {
  title: string;
  kind: 'Memory' | 'Data Structure' | 'Flowchart' | 'Architecture' | 'Sequence' | 'State';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface LessonPracticeTask {
  id: string;
  level: 'Easy' | 'Medium' | 'Hard' | 'Mini Project';
  title: string;
  prompt: string;
  testCasesText: string;
  starterJava: string;
  starterJs: string;
  referenceSolution: string;
  solutionNotes: string;
  /** Optional automated assertions evaluated against user JS code */
  jsVerifierFnBody?: string;
}

export interface LessonExperiment {
  id: string;
  title: string;
  hypothesis: string;
  experimentSteps: string;
  codeSnippet: string;
  observation: string;
  verified: boolean;
}

export interface AssessmentItem {
  id: string;
  kind: 'predict_output' | 'debug' | 'recall' | 'compare';
  prompt: string;
  code?: string;
  options?: string[];
  correctAnswer: string;
  userAnswer: string;
  revealed: boolean;
  explanation: string;
  isCorrect?: boolean;
}

export interface LessonTopic {
  id: string;
  subjectId: string;
  moduleGroup: string; // e.g., "01 · Runtime & Memory", "02 · Collections & Data"
  title: string;
  subtitle: string;
  understanding: UnderstandingState;
  lastStudiedModule: LessonModuleId;
  updatedAt: number;
  relatedTopicIds: string[];

  // 01. Theory
  theory: {
    definition: string;
    why: string;
    how: string;
    internalMechanism: string[];
    codeExample: string;
    codeLanguage: string;
    tradeOffs: { pros: string[]; cons: string[] };
    misconceptions: string[];
    references: { label: string; url: string }[];
  };

  // 02. Notes (Markdown + Snippets + Errors)
  notes: {
    markdown: string;
    pitfallsAndFixes: string;
    tags: string[];
  };

  // 03. Explain (Feynman Retrieval Practice)
  explain: {
    whatIsIt: string;
    whyItExists: string;
    howItWorks: string;
    whatHappensInternally: string;
    whatIfScenarioPrompt: string;
    whatIfAnswer: string;
    canExplainWithoutLooking: boolean;
    selfGapNotes: string;
  };

  // 04. Visualize (Mechanism Diagram)
  visualize: LessonDiagram;

  // 05. Practice (Coding & Sandbox)
  practice: {
    activeTaskId: string;
    tasks: LessonPracticeTask[];
  };

  // 06. Experiment (Hypothesis -> Experiment -> Observation)
  experiments: LessonExperiment[];

  // 07. Assessment (Predict Output, Debug, Compare)
  assessments: AssessmentItem[];

  // 08. Review (Spaced Repetition & Weak Spots)
  review: {
    weakConcepts: string;
    realProjectApplication: string;
    nextReviewDate: string; // YYYY-MM-DD
    intervalDays: number;
    reviewCount: number;
  };
}

export interface ProgrammingSubject {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  focusArea: string;
  accent: string;
}

export interface CodeLearningEnvState {
  activeLevel: 'directory' | 'subject' | 'lesson';
  activeSubjectId: string;
  activeTopicId: string;
  activeModule: LessonModuleId;
  subjects: ProgrammingSubject[];
  topics: LessonTopic[];
}

export const LESSON_MODULES: {
  id: LessonModuleId;
  num: string;
  label: string;
  subtitle: string;
}[] = [
  { id: 'theory', num: '01', label: 'Theory', subtitle: 'Cơ chế & Bản chất' },
  { id: 'notes', num: '02', label: 'Notes', subtitle: 'Ghi chép Markdown' },
  { id: 'explain', num: '03', label: 'Explain', subtitle: 'Diễn giải từ trí nhớ' },
  { id: 'visualize', num: '04', label: 'Visualize', subtitle: 'Vẽ luồng & Bộ nhớ' },
  { id: 'practice', num: '05', label: 'Practice', subtitle: 'Code & Test Cases' },
  { id: 'experiment', num: '06', label: 'Experiment', subtitle: 'Giả thuyết & Kiểm chứng' },
  { id: 'assessment', num: '07', label: 'Assessment', subtitle: 'Dự đoán & Phản biện' },
  { id: 'review', num: '08', label: 'Review', subtitle: 'Ôn tập & Spaced Rep' },
];

export const UNDERSTANDING_META: Record<
  UnderstandingState,
  { label: string; vi: string; color: string; desc: string }
> = {
  exposed: {
    label: 'Exposed',
    vi: 'Đã tiếp xúc',
    color: 'var(--os-dusty-blue)',
    desc: 'Đã đọc lý thuyết và nắm khái niệm tổng quan.',
  },
  understood: {
    label: 'Understood',
    vi: 'Hiểu bản chất',
    color: 'var(--os-brass)',
    desc: 'Có thể gấp tài liệu lại và tự giải thích cơ chế bên trong.',
  },
  applied: {
    label: 'Applied',
    vi: 'Vận dụng được',
    color: 'var(--os-sage)',
    desc: 'Đã tự viết code, thử nghiệm edge cases và kiểm chứng đầu ra.',
  },
};

function addDaysIso(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildInitialCodeLearningState(): CodeLearningEnvState {
  const now = Date.now();

  const subjects: ProgrammingSubject[] = [
    {
      id: 'subj_java',
      code: 'SUBJ.01',
      title: 'Java Core',
      subtitle: 'JVM Runtime · Collections · Concurrency · Backend Architecture',
      focusArea: 'Memory Model & Data Structures under the hood',
      accent: 'var(--os-brass)',
    },
    {
      id: 'subj_csharp',
      code: 'SUBJ.02',
      title: 'C# / .NET',
      subtitle: 'CLR Internals · Value vs Reference · async/await State Machine',
      focusArea: 'Cross-runtime comparison with Java JVM',
      accent: 'var(--os-dusty-blue)',
    },
    {
      id: 'subj_web',
      code: 'SUBJ.03',
      title: 'Web Core',
      subtitle: 'HTTP/2 · CORS · JWT & Session Security · Browser Event Loop',
      focusArea: 'Network transport & Browser execution mechanics',
      accent: 'var(--os-sage)',
    },
    {
      id: 'subj_ai',
      code: 'SUBJ.04',
      title: 'AI Workflow & Agents',
      subtitle: 'Prompt Chaining · Routing · Tool Calling · Deterministic Guardrails',
      focusArea: 'Building reliable systems on top of probabilistic models',
      accent: 'var(--os-brass)',
    },
    {
      id: 'subj_sql',
      code: 'SUBJ.05',
      title: 'SQL & Storage Engine',
      subtitle: 'B-Tree Indexing · Query Execution Plan · ACID & Isolation Levels',
      focusArea: 'How disk pages, locks and indexes shape latency',
      accent: 'var(--os-dusty-blue)',
    },
  ];

  const topics: LessonTopic[] = [
    // =========================================================================
    // JAVA CORE #1: Java HashMap & Hashing Internals
    // =========================================================================
    {
      id: 'top_java_hashmap',
      subjectId: 'subj_java',
      moduleGroup: '01 · Collections Framework',
      title: 'Java HashMap & Hashing Internals',
      subtitle: 'Hashing · Buckets · Collision Handling · Red-Black Tree · Resize & Load Factor',
      understanding: 'understood',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 18,
      relatedTopicIds: ['top_java_jvm', 'top_sql_btree'],
      theory: {
        definition:
          'HashMap<K, V> là cấu trúc dữ liệu lưu cặp Key-Value dựa trên bảng băm (Hash Table), cho phép truy xuất, chèn và xóa với độ phức tạp trung bình O(1).',
        why:
          'Tìm kiếm tuyến tính trong mảng/List tốn O(n), còn TreeMap giữ thứ tự tốn O(log n). Khi hệ thống cần tra cứu tức thời theo khóa (cache, index, frequency map, routing table), ta cần chuyển Key thành chỉ số mảng trực tiếp trong O(1).',
        how:
          'HashMap duy trì một mảng `Node<K,V>[] table` (gọi là các Bucket). Khi gọi `put(key, value)`, Java lấy `key.hashCode()`, trộn bit cao xuống bit thấp để giảm va chạm, rồi dùng `(n - 1) & hash` tính ra index của Bucket.',
        internalMechanism: [
          '1. Perturbation Function `hash(key)`: `(h = key.hashCode()) ^ (h >>> 16)` — XOR 16 bit cao với 16 bit thấp để ngay cả khi kích thước bảng nhỏ (n = 16), các bit cao vẫn tham gia phân bố bucket.',
          '2. Index Bitmask: Thay vì phép chia lấy dư `% n` chậm hơn, Java dùng `(n - 1) & hash` (yêu cầu capacity `n` luôn là lũy thừa của 2: 16, 32, 64...).',
          '3. Collision Handling: Nếu hai key rơi vào cùng một bucket, HashMap móc nối thành Linked List. Từ Java 8+, nếu số node trong 1 bucket vượt ngưỡng `TREEIFY_THRESHOLD = 8` (và `table.length >= 64`), Linked List tự động chuyển thành Red-Black Tree để giảm worst-case từ O(n) xuống O(log n).',
          '4. Load Factor & Resize: Ngưỡng mặc định `0.75`. Khi `size > capacity * 0.75`, HashMap cấp phát mảng mới gấp đôi (`newCap = oldCap << 1`). Nhờ `n` là lũy thừa của 2, mỗi node cũ chỉ ở lại vị trí cũ `j` hoặc nhảy đúng sang `j + oldCap` dựa vào 1 bit kiểm tra `(e.hash & oldCap) == 0`.',
        ],
        codeLanguage: 'java',
        codeExample: `// Minh họa quy trình nội bộ khi HashMap put(key, value)
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// Tính bucket index (n là lũy thừa của 2, vd: 16 -> n - 1 = 0b1111)
int index = (table.length - 1) & hash(key);

// Cảnh báo kinh điển: Dùng mutable object làm Key
class MutableKey {
    int id;
    @Override public int hashCode() { return id; }
    @Override public boolean equals(Object o) { ... }
}
MutableKey k = new MutableKey(10);
map.put(k, "Secret");
k.id = 99; // Đổi trạng thái sau khi put -> hashCode() đổi!
map.get(k); // Trả về null (Memory leak vì không bao giờ tìm lại được bucket cũ!)`,
        tradeOffs: {
          pros: [
            'Tra cứu, thêm, xóa trung bình O(1).',
            'Cho phép 1 khóa `null` (luôn nằm ở bucket 0) và nhiều giá trị `null`.',
            'Java 8+ chống tấn công HashDoS nhờ chuyển Red-Black Tree khi bucket quá dài.',
          ],
          cons: [
            'Không giữ thứ tự phần tử (cần thứ tự dùng LinkedHashMap).',
            'Không thread-safe: hai thread cùng resize trong đa luồng có thể gây mất dữ liệu hoặc race condition (dùng ConcurrentHashMap).',
            'Tiêu tốn bộ nhớ hơn Array vì mỗi entry bọc trong object Node + overhead bảng trống.',
          ],
        },
        misconceptions: [
          'Hiểu lầm 1: "Cùng hashCode() thì hai object bằng nhau" → SAI. Hai object khác nhau hoàn toàn có thể trùng hashCode (Collision); `equals()` mới là tiêu chuẩn quyết định.',
          'Hiểu lầm 2: "Chỉ cần override equals() là dùng làm key HashMap được" → SAI. Nếu không override `hashCode()`, hai instance có cùng dữ liệu sẽ rơi vào 2 bucket khác nhau.',
          'Hiểu lầm 3: "Resize luôn phải tính lại hashCode() cho mọi phần tử" → SAI. `hash` được cache sẵn trong từng `Node`, resize chỉ kiểm tra thêm 1 bit `oldCap`.',
        ],
        references: [
          { label: 'Oracle Java SE — HashMap Source & Javadoc', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html' },
          { label: 'JEP 180 — Handle Frequent HashMap Collisions with Balanced Trees', url: 'https://openjdk.org/jeps/180' },
        ],
      },
      notes: {
        markdown: `### Ghi nhớ cốt lõi khi dùng HashMap trong Backend Java
- **Hợp đồng bất biến**: \`a.equals(b) == true\` $\\Rightarrow$ \`a.hashCode() == b.hashCode()\`. Chiều ngược lại không bắt buộc.
- **Chọn Capacity khởi tạo**: Nếu biết trước cần lưu 1000 phần tử, khởi tạo \`new HashMap<>(2048)\` hoặc \`HashMap.newHashMap(1000)\` (Java 19+) để tránh resize nhiều lần giữa chừng.

| Tham số nội bộ | Giá trị mặc định | Ý nghĩa |
| :--- | :--- | :--- |
| \`DEFAULT_INITIAL_CAPACITY\` | \`16\` | Số bucket ban đầu ($2^4$) |
| \`DEFAULT_LOAD_FACTOR\` | \`0.75f\` | Điểm cân bằng giữa RAM và Collision |
| \`TREEIFY_THRESHOLD\` | \`8\` | Chiều dài bucket kích hoạt Red-Black Tree |`,
        pitfallsAndFixes:
          'Lỗi hay gặp khi dùng DTO có annotation `@Data` (Lombok) làm key Map: nếu thay đổi field sau khi put vào Map, `hashCode()` thay đổi khiến entry bị lạc mãi mãi. Cách sửa: Chỉ dùng Immutable object (`String`, `Integer`, `record`) làm Map key.',
        tags: ['java-core', 'hashing', 'collections', 'backend'],
      },
      explain: {
        whatIsIt:
          'HashMap là một mảng các "xô" (buckets), trong đó vị trí của dữ liệu được quyết định trực tiếp bằng phép băm khóa thay vì duyệt tìm tuần tự.',
        whyItExists:
          'Giải quyết bài toán tra cứu nhanh O(1) khi lượng dữ liệu lớn, tránh việc phải quét qua hàng triệu phần tử như ArrayList.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt:
          'Điều gì xảy ra nếu ta đặt `loadFactor = 10.0f` hoặc mọi object đều trả về `hashCode() { return 1; }`?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'HashMap Bucket Array & Collision Treeify Flow',
        kind: 'Data Structure',
        nodes: [
          { id: 'n1', type: 'box', x: 40, y: 40, w: 170, h: 64, label: 'Key.hashCode()\n^ (h >>> 16)', color: '#B99B79' },
          { id: 'n2', type: 'diamond', x: 260, y: 34, w: 160, h: 76, label: 'Index:\n(n - 1) & hash', color: '#A7B6D2' },
          { id: 'n3', type: 'box', x: 480, y: 38, w: 185, h: 68, label: 'table[i] Bucket\n(Node Linked List)', color: '#EDEAE2' },
          { id: 'n4', type: 'box', x: 480, y: 168, w: 185, h: 70, label: 'len >= 8 & n >= 64\nRed-Black Tree O(log n)', color: '#9BAA98' },
          { id: 'n5', type: 'note', x: 40, y: 168, w: 220, h: 72, label: 'Resize 2x khi size > n * 0.75\n(e.hash & oldCap) == 0', color: '#B99B79' },
        ],
        edges: [
          { id: 'e1', fromX: 210, fromY: 72, toX: 260, toY: 72, label: 'hash', color: '#B99B79' },
          { id: 'e2', fromX: 420, fromY: 72, toX: 480, toY: 72, label: 'slot i', color: '#A7B6D2' },
          { id: 'e3', fromX: 572, fromY: 106, toX: 572, toY: 168, label: 'collision > 8', color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_hm_1',
        tasks: [
          {
            id: 'pr_hm_1',
            level: 'Medium',
            title: 'Tự triển khai SimpleHashMap (Put, Get, Collision Bucket)',
            prompt:
              'Không dùng thư viện Map có sẵn (`new Map()` hay object dict trực tiếp). Hãy tự cài đặt một bảng băm mảng `buckets` kích thước 8 dùng Separate Chaining (mảng lồng các cặp `[key, value]`) với hàm `put(key, val)` và `get(key)`.',
            testCasesText:
              'Test 1: map.put("apple", 10); map.get("apple") === 10\nTest 2: map.put("apple", 99); map.get("apple") === 99 (ghi đè key trùng)\nTest 3: map.get("missing") === null',
            starterJava: `class SimpleHashMap<K, V> {
    private static class Node<K, V> {
        K key; V val; Node<K, V> next;
        Node(K k, V v) { key = k; val = v; }
    }
    private Node<K, V>[] buckets = new Node[8];

    private int index(K key) {
        return key == null ? 0 : Math.abs(key.hashCode()) % buckets.length;
    }

    public void put(K key, V val) {
        // TODO: Tìm xem key đã tồn tại chưa -> cập nhật, hoặc thêm vào đầu/cuối bucket
    }

    public V get(K key) {
        // TODO: Duyệt linked list tại bucket[index(key)]
        return null;
    }
}`,
            starterJs: `class SimpleHashMap {
  constructor(capacity = 8) {
    this.buckets = Array.from({ length: capacity }, () => []);
  }
  _hash(key) {
    const str = String(key);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % this.buckets.length;
  }
  put(key, value) {
    const idx = this._hash(key);
    const bucket = this.buckets[idx];
    for (const pair of bucket) {
      if (pair[0] === key) {
        pair[1] = value;
        return;
      }
    }
    bucket.push([key, value]);
  }
  get(key) {
    const idx = this._hash(key);
    for (const pair of this.buckets[idx]) {
      if (pair[0] === key) return pair[1];
    }
    return null;
  }
}`,
            referenceSolution: `// Java Reference Implementation
public void put(K key, V val) {
    int idx = index(key);
    Node<K, V> curr = buckets[idx];
    while (curr != null) {
        if (Objects.equals(curr.key, key)) {
            curr.val = val;
            return;
        }
        curr = curr.next;
    }
    Node<K, V> node = new Node<>(key, val);
    node.next = buckets[idx];
    buckets[idx] = node;
}`,
            solutionNotes:
              'Chú ý bước kiểm tra `Objects.equals(curr.key, key)` trước khi chèn node mới để đảm bảo key trùng được cập nhật giá trị chứ không tạo bản sao trong bucket.',
            jsVerifierFnBody: `
              const m = new SimpleHashMap(4);
              m.put("java", 21);
              m.put("jvm", 100);
              m.put("java", 23);
              m.put("a", 1); m.put("e", 2); m.put("i", 3);
              return m.get("java") === 23 && m.get("jvm") === 100 && m.get("e") === 2 && m.get("unknown") === null;
            `,
          },
          {
            id: 'pr_hm_2',
            level: 'Easy',
            title: 'Đếm tần suất & Tìm phần tử đầu tiên không lặp lại',
            prompt:
              'Cho chuỗi `s`, dùng HashMap đếm tần suất ký tự rồi trả về index của ký tự đầu tiên xuất hiện đúng 1 lần (trả về -1 nếu không có).',
            testCasesText: 'firstUniq("noetrixn") -> 1 (\'o\')\nfirstUniq("aabb") -> -1',
            starterJava: `int firstUniqChar(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : s.toCharArray()) freq.put(c, freq.getOrDefault(c, 0) + 1);
    for (int i = 0; i < s.length(); i++) {
        if (freq.get(s.charAt(i)) == 1) return i;
    }
    return -1;
}`,
            starterJs: `function firstUniq(s) {
  const freq = new Map();
  for (const ch of s) freq.set(ch, (freq.get(ch) || 0) + 1);
  for (let i = 0; i < s.length; i++) {
    if (freq.get(s[i]) === 1) return i;
  }
  return -1;
}`,
            referenceSolution: 'Duyệt 2 lần O(n) với HashMap tần suất: lần 1 đếm, lần 2 quét lại chuỗi gốc để giữ đúng thứ tự index.',
            solutionNotes: 'Đừng duyệt qua `freq.entrySet()` để tìm index vì HashMap không bảo toàn thứ tự chèn!',
            jsVerifierFnBody: `return firstUniq("noetrixn") === 1 && firstUniq("aabb") === -1;`,
          },
        ],
      },
      experiments: [
        {
          id: 'exp_hm_1',
          title: 'Khi hai Key trùng hashCode() nhưng khác equals()',
          hypothesis:
            'Nếu object A và B cùng trả về `hashCode() = 42` nhưng `A.equals(B) == false`, khi `put(A, 1)` rồi `put(B, 2)` thì B sẽ không ghi đè A mà nằm chung bucket.',
          experimentSteps:
            '1. Tạo class `Key` cố định `hashCode() { return 42; }`.\n2. Đặt `equals` so sánh theo field `id`.\n3. Put `new Key(1)` và `new Key(2)` vào HashMap.\n4. Kiểm tra `map.size()` và `map.get(new Key(1))`.',
          codeSnippet: `Map<Key, String> map = new HashMap<>();
map.put(new Key(1), "First");
map.put(new Key(2), "Second");
System.out.println(map.size()); // ?`,
          observation:
            '`map.size()` in ra `2`! Cả hai cùng rơi vào bucket của hash `42` nhưng nhờ `equals()` trả về `false`, HashMap tạo 2 node nối nhau trong Linked List (hoặc Red-Black Tree nếu >= 8).',
          verified: true,
        },
        {
          id: 'exp_hm_2',
          title: 'Nếu chỉ override equals() mà quên override hashCode()?',
          hypothesis:
            'Khi gọi `map.get(new Key(1))` bằng một instance mới có cùng `id = 1`, HashMap sẽ trả về `null` dù `k1.equals(k2)` là `true`.',
          experimentSteps:
            '1. Xóa method `hashCode()` khỏi class `Key`.\n2. Put `k1 = new Key(1)` vào map.\n3. Tìm lại bằng `map.get(new Key(1))`.',
          codeSnippet: `map.put(new Key(1), "Vance");
System.out.println(map.get(new Key(1))); // null!`,
          observation:
            'Đúng như giả thuyết! `Object.hashCode()` mặc định sinh mã dựa trên địa chỉ/identity của object, nên `new Key(1)` lần 2 nhảy sang bucket khác hoàn toàn và không bao giờ gặp `k1`.',
          verified: false,
        },
      ],
      assessments: [
        {
          id: 'as_hm_1',
          kind: 'predict_output',
          prompt: 'Đoạn code Java sau in ra kết quả gì và tại sao?',
          code: `Map<String, Integer> m = new HashMap<>(16, 0.75f);
String s1 = new String("abc");
String s2 = new String("abc");
m.put(s1, 100);
m.put(s2, 200);
System.out.println(m.size() + " : " + m.get("abc"));`,
          options: ['1 : 200', '2 : 100', '2 : 200', '1 : null'],
          correctAnswer: '1 : 200',
          userAnswer: '',
          revealed: false,
          explanation:
            'Dù `s1 != s2` về tham chiếu bộ nhớ (`new String`), lớp `String` đã override cả `hashCode()` và `equals()` dựa trên nội dung chuỗi. Do đó `s2` ghi đè giá trị của `s1` trong cùng bucket.',
        },
        {
          id: 'as_hm_2',
          kind: 'compare',
          prompt: 'So sánh HashMap vs LinkedHashMap vs ConcurrentHashMap: Khi nào dùng loại nào trong dự án thật?',
          correctAnswer:
            'HashMap: đơn luồng, tốc độ thuần cao nhất. LinkedHashMap: cần giữ thứ tự chèn hoặc xây LRU Cache (accessOrder = true). ConcurrentHashMap: đa luồng, dùng CAS + khóa từng bucket (synchronized head node) thay vì khóa toàn bảng.',
          userAnswer: '',
          revealed: false,
          explanation: 'Cần nêu rõ điểm khác biệt ở cơ chế lưu thứ tự (doubly-linked list) và cơ chế lock-striping/CAS.',
        },
      ],
      review: {
        weakConcepts: 'Cơ chế chia lại bucket khi resize `(e.hash & oldCap) == 0` — cần tự nháp lại bằng tay trên giấy 1 lần.',
        realProjectApplication: 'Dùng `ConcurrentHashMap` cho in-memory rate limiter hoặc cache token ngắn hạn ở Java backend.',
        nextReviewDate: addDaysIso(3),
        intervalDays: 3,
        reviewCount: 1,
      },
    },

    // =========================================================================
    // JAVA CORE #2: JVM Runtime Memory Model
    // =========================================================================
    {
      id: 'top_java_jvm',
      subjectId: 'subj_java',
      moduleGroup: '02 · JVM Internals',
      title: 'JVM Runtime Memory Model',
      subtitle: 'Heap · JVM Stack · Frames · Method Area (Metaspace) · PC Register · GC Roots',
      understanding: 'exposed',
      lastStudiedModule: 'visualize',
      updatedAt: now - 1000 * 60 * 60 * 4,
      relatedTopicIds: ['top_java_hashmap', 'top_csharp_clr'],
      theory: {
        definition:
          'JVM Runtime Data Areas là cách máy ảo Java phân chia bộ nhớ khi chạy chương trình, tách biệt vùng dùng chung cho mọi Thread (Heap, Metaspace) và vùng riêng của từng Thread (Stack, PC Register).',
        why:
          'Hiểu rõ phân vùng bộ nhớ giúp lập trình viên lý giải ngay tại sao xảy ra `StackOverflowError` vs `OutOfMemoryError`, vì sao biến local an toàn đa luồng còn instance field thì không, và Garbage Collector dọn rác thế nào.',
        how:
          'Mỗi khi một Thread khởi tạo, JVM cấp riêng một Stack chứa các Stack Frame cho mỗi lần gọi hàm. Mọi object tạo bằng `new` nằm trên Heap chung và được biến trên Stack trỏ tham chiếu tới.',
        internalMechanism: [
          '1. Heap (Shared): Chứa toàn bộ Objects và Arrays. Chia thành Young Generation (Eden + Survivor S0/S1) và Old Generation để GC tối ưu theo giả thuyết "hầu hết object chết sớm".',
          '2. JVM Stack (Per-Thread): Mỗi lần gọi hàm sẽ push một Stack Frame gồm Local Variable Array, Operand Stack và Frame Data. Thoát hàm là pop ngay lập tức.',
          '3. Method Area / Metaspace (Shared - Native Memory từ Java 8+): Lưu cấu trúc Class metadata, bytecode phương thức, static variables, runtime constant pool.',
          '4. PC Register (Per-Thread): Giữ địa chỉ lệnh bytecode đang thực thi hiện tại của Thread đó để OS có thể context-switch chính xác.',
        ],
        codeLanguage: 'java',
        codeExample: `public class MemoryTrace {
    static int sharedCounter = 0; // Tham chiếu ở Metaspace (Class metadata)

    public void run() {
        int localVal = 10;              // Nằm trực tiếp trong Stack Frame của run()
        User u = new User("Vance");     // Reference 'u' ở Stack, Object User ở Heap!
        process(u);                     // Tạo Stack Frame mới trỏ cùng tới Object User trên Heap
    }
}`,
        tradeOffs: {
          pros: [
            'Tự động thu gom rác trên Heap giúp loại bỏ lỗi rò rỉ `free()` thủ công như C/C++.',
            'Cô lập Stack theo từng Thread giúp tránh xung đột biến cục bộ.',
          ],
          cons: [
            'Stop-The-World pauses khi Garbage Collector quét và nén Heap nếu cấu hình không chuẩn.',
            'Cấp phát Object nhỏ tràn lan gây áp lực lên Young Gen GC.',
          ],
        },
        misconceptions: [
          'Hiểu lầm: "Biến `static` luôn làm tràn Stack" → SAI. Thông tin lớp và biến static nằm ở Method Area / Metaspace, còn đối tượng mà nó trỏ tới nằm trên Heap.',
          'Hiểu lầm: "Java truyền tham chiếu (Pass by Reference) với Object" → SAI. Java LUÔN truyền tham trị (Pass by Value); với Object, giá trị được sao chép chính là bản sao của địa chỉ tham chiếu.',
        ],
        references: [
          { label: 'JVM Specification §2.5 — Run-Time Data Areas', url: 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5' },
        ],
      },
      notes: {
        markdown: `### Ghi nhớ nhanh Heap vs Stack
- **Stack**: Tự dọn (LIFO), cực nhanh, kích thước nhỏ (~1MB/thread), lỗi tràn là \`StackOverflowError\`.
- **Heap**: Cần GC (G1GC / ZGC), chia sẻ toàn app, lỗi tràn là \`OutOfMemoryError: Java heap space\`.`,
        pitfallsAndFixes: 'Giữ reference trong `static List` hoặc quên đóng `ThreadLocal` trong Thread Pool sẽ biến object thành GC Root vĩnh viễn -> Memory Leak!',
        tags: ['jvm', 'memory-model', 'gc'],
      },
      explain: {
        whatIsIt: '',
        whyItExists: '',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Điều gì xảy ra nếu hàm đệ quy không có điều kiện dừng, và bộ nhớ nào bị tràn trước?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'JVM Runtime Data Areas',
        kind: 'Memory',
        nodes: [
          { id: 'jvm1', type: 'box', x: 50, y: 40, w: 230, h: 95, label: 'HEAP (Shared)\nObjects · Arrays · String Pool', color: '#B99B79' },
          { id: 'jvm2', type: 'box', x: 50, y: 170, w: 230, h: 85, label: 'METHOD AREA / METASPACE\nClass Metadata · Bytecode', color: '#A7B6D2' },
          { id: 'jvm3', type: 'box', x: 360, y: 40, w: 240, h: 95, label: 'JVM STACK (Per-Thread)\nFrames · Local Variables', color: '#9BAA98' },
          { id: 'jvm4', type: 'pill', x: 360, y: 170, w: 240, h: 72, label: 'PC REGISTER\nCurrent Thread Instruction', color: '#EDEAE2' },
        ],
        edges: [
          { id: 'je1', fromX: 360, fromY: 85, toX: 280, toY: 85, label: 'Object Ref', color: '#9BAA98' },
          { id: 'je2', fromX: 165, fromY: 135, toX: 165, toY: 170, label: 'Class Ptr', color: '#A7B6D2' },
        ],
      },
      practice: {
        activeTaskId: 'pr_jvm_1',
        tasks: [
          {
            id: 'pr_jvm_1',
            level: 'Easy',
            title: 'Phân tích Pass-by-Value của Tham chiếu trong Java/JS',
            prompt: 'Viết hàm `mutateUser(u)` thử gán lại `u = { name: "New" }` so với sửa `u.name = "Mutated"`. Chạy kiểm tra xem biến ngoài thay đổi thế nào.',
            testCasesText: 'Sửa thuộc tính thay đổi Heap object; gán lại tham số chỉ đổi tham chiếu local trong Stack Frame.',
            starterJava: `void test(User u) {
    u.name = "Mutated";
    u = new User("Shadow");
}`,
            starterJs: `function testRef(u) {
  u.name = "Mutated";
  u = { name: "Shadow" };
}`,
            referenceSolution: 'Biến `u` gốc bên ngoài vẫn trỏ tới object `{ name: "Mutated" }`, không bị đổi thành `"Shadow"`.',
            solutionNotes: 'Gán lại biến tham số `u = ...` chỉ làm thay đổi ô nhớ tham chiếu cục bộ bên trong Stack Frame của hàm.',
            jsVerifierFnBody: `const user = { name: "Init" }; testRef(user); return user.name === "Mutated";`,
          },
        ],
      },
      experiments: [
        {
          id: 'exp_jvm_1',
          title: 'Kiểm chứng String Pool (== vs .equals)',
          hypothesis: 'String literal dùng chung ô nhớ trong String Pool nên `==` đúng, còn `new String()` ép tạo Object mới trên Heap.',
          experimentSteps: 'So sánh `String a = "noetrix"; String b = "noetrix";` với `new String("noetrix")`.',
          codeSnippet: `String a = "noetrix";
String b = "noetrix";
String c = new String("noetrix");
System.out.println(a == b); // true
System.out.println(a == c); // false`,
          observation: 'Literal chia sẻ cùng địa chỉ tham chiếu trong String Pool; `new String()` luôn cấp phát đối tượng độc lập.',
          verified: true,
        },
      ],
      assessments: [
        {
          id: 'as_jvm_1',
          kind: 'predict_output',
          prompt: 'Thứ tự kết quả in ra của `swap(a, b)` với Integer/Object là gì?',
          code: `Integer a = 10, b = 20;
swap(a, b); // Bên trong chỉ hoán đổi 2 tham số Integer a, b
System.out.println(a + "," + b);`,
          options: ['10,20', '20,10', 'NullPointerException', 'Compile error'],
          correctAnswer: '10,20',
          userAnswer: '',
          revealed: false,
          explanation: 'Vì Java luôn Pass-by-Value (sao chép tham chiếu) và `Integer` là immutable, hoán đổi tham số trong Stack Frame của `swap()` không ảnh hưởng đến `a, b` ở `main()`.',
        },
      ],
      review: {
        weakConcepts: 'Phân biệt Metaspace và Heap khi lưu static fields.',
        realProjectApplication: 'Tuning JVM `-Xms`, `-Xmx` khi deploy microservice Spring Boot trong Docker.',
        nextReviewDate: addDaysIso(5),
        intervalDays: 5,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // C# / .NET: CLR & async/await State Machine
    // =========================================================================
    {
      id: 'top_csharp_clr',
      subjectId: 'subj_csharp',
      moduleGroup: '01 · .NET Runtime',
      title: 'CLR Memory, Value vs Reference & async/await',
      subtitle: 'Stack Structs · Managed Heap · Boxing/Unboxing · IAsyncStateMachine',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 60 * 12,
      relatedTopicIds: ['top_java_jvm'],
      theory: {
        definition:
          'CLR (Common Language Runtime) là máy ảo thực thi của .NET, phân biệt rạch ròi giữa `struct` (Value Type — lưu trực tiếp dữ liệu) và `class` (Reference Type — lưu trên Managed Heap), cùng cơ chế `async/await` biên dịch thành State Machine.',
        why:
          'Khác với Java hiện đại (trước Project Valhalla) buộc mọi Object phải nằm trên Heap, C# cho phép dùng `struct` và `Span<T>` để giảm áp lực Garbage Collector tới mức tối đa, còn `async/await` giải phóng Thread trong khi chờ I/O.',
        how:
          'Khi đánh dấu một hàm `async Task`, trình biên dịch C# sinh ra một cấu trúc `IAsyncStateMachine` chia thân hàm thành từng state trước và sau mỗi từ khóa `await`, giúp không chặn luồng (non-blocking).',
        internalMechanism: [
          '1. Value Type (`struct`, `int`) lưu trực tiếp giá trị tại nơi nó được khai báo (trên Stack nếu là biến local, hoặc nằm liền kề bên trong Heap object nếu là field của class).',
          '2. Boxing & Unboxing: Ép một Value Type thành `object` hoặc `interface` buộc CLR phải bọc nó vào một hộp trên Heap (tốn cấp phát + GC).',
          '3. `async/await` không tự sinh ra Thread mới! Nó đăng ký Continuation callback vào TaskAwaiter để trả Thread hiện tại về ThreadPool ngay khi I/O đang chờ.',
        ],
        codeLanguage: 'csharp',
        codeExample: `public async Task<string> FetchUserAsync(int id) {
    // State 0: Chạy đồng bộ trên caller thread tới trước await
    var cached = CheckLocalCache(id);
    if (cached != null) return cached;

    // Trả Thread về ThreadPool, compiler đóng gói phần sau thành State 1
    var data = await _httpClient.GetStringAsync($"/users/{id}");
    return data;
}`,
        tradeOffs: {
          pros: ['Hiệu năng bộ nhớ vượt trội với `struct`, `ref struct`, `Span<T>`.', 'Code bất đồng bộ đọc tuần tự như đồng bộ nhưng throughput I/O cực cao.'],
          cons: ['Gọi `.Result` hoặc `.Wait()` lên async Task rất dễ gây Deadlock nếu có SynchronizationContext.', 'Boxing ngầm trong các hàm nhận `object` làm giảm hiệu năng âm thầm.'],
        },
        misconceptions: [
          'Hiểu lầm: "`await` luôn tạo ra một Thread nền mới chạy song song" → SAI. `await` cho I/O không dùng Thread nào trong lúc chờ phần cứng trả về.',
        ],
        references: [{ label: '.NET Docs — Async in Depth', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/' }],
      },
      notes: {
        markdown: '### So sánh C# CLR vs Java JVM\n- C# có `struct` (Value Type thật) + Generic Reification (List<int> không bị box thành Object như Java ArrayList<Integer>).\n- Không bao giờ dùng `async void` trừ event handler vì không catch được exception!',
        pitfallsAndFixes: 'Lỗi Deadlock khi gọi `.Result` trong ASP.NET cũ hoặc UI Thread. Luôn dùng `await` từ trên xuống dưới (Async all the way).',
        tags: ['csharp', 'clr', 'async-await'],
      },
      explain: {
        whatIsIt: '',
        whyItExists: '',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Điều gì xảy ra khi đưa 1 triệu `int` vào `ArrayList` (non-generic) so với `List<int>` trong C#?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'async / await State Machine Execution',
        kind: 'State',
        nodes: [
          { id: 'c1', type: 'box', x: 40, y: 50, w: 170, h: 66, label: 'State 0:\nSync prefix before await', color: '#A7B6D2' },
          { id: 'c2', type: 'diamond', x: 260, y: 42, w: 165, h: 82, label: 'IsCompleted?', color: '#B99B79' },
          { id: 'c3', type: 'box', x: 480, y: 46, w: 185, h: 72, label: 'Return Thread to Pool\nRegister Continuation', color: '#9BAA98' },
        ],
        edges: [
          { id: 'ce1', fromX: 210, fromY: 83, toX: 260, toY: 83, color: '#A7B6D2' },
          { id: 'ce2', fromX: 425, fromY: 83, toX: 480, toY: 83, label: 'False (I/O Wait)', color: '#B99B79' },
        ],
      },
      practice: {
        activeTaskId: 'pr_cs_1',
        tasks: [
          {
            id: 'pr_cs_1',
            level: 'Easy',
            title: 'Thực hành Promise/Task State Continuation',
            prompt: 'Viết hàm async `fetchPair(a, b)` chạy 2 thao tác song song (dùng `Promise.all` tương đương `Task.WhenAll`) thay vì await tuần tự.',
            testCasesText: 'fetchPair(() => Promise.resolve(2), () => Promise.resolve(3)) -> [2, 3]',
            starterJava: '// C# Task.WhenAll(t1, t2)',
            starterJs: `async function fetchPair(fn1, fn2) {
  return await Promise.all([fn1(), fn2()]);
}`,
            referenceSolution: 'Dùng `Task.WhenAll(t1, t2)` hoặc `Promise.all([p1, p2])` để tổng thời gian chờ bằng `max(t1, t2)` thay vì `t1 + t2`.',
            solutionNotes: 'Avoid sequential awaits when tasks are independent.',
            jsVerifierFnBody: `return true;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_cs_1',
          kind: 'recall',
          prompt: 'Tại sao gọi `await` giúp tăng khả năng phục vụ hàng nghìn request đồng thời dù số lượng Thread trong ThreadPool có hạn?',
          correctAnswer: 'Vì khi chờ I/O (DB/HTTP), Thread được giải phóng ngay về ThreadPool để phục vụ request khác thay vì đứng block chờ kết quả.',
          userAnswer: '',
          revealed: false,
          explanation: 'Scalability của async I/O đến từ việc không giữ Thread khi không có CPU work.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Áp dụng `ValueTask` và `Span<T>` trong các endpoint API hiệu năng cao.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // WEB CORE: HTTP, CORS, Cookies & JWT Security
    // =========================================================================
    {
      id: 'top_web_http',
      subjectId: 'subj_web',
      moduleGroup: '01 · Network & Browser Security',
      title: 'HTTP, CORS, Cookies & JWT Security',
      subtitle: 'Same-Origin Policy · Preflight OPTIONS · HttpOnly Cookies · Stateless Auth',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 60 * 24,
      relatedTopicIds: ['top_ai_agents'],
      theory: {
        definition:
          'Giao thức HTTP và cơ chế bảo mật trình duyệt (Same-Origin Policy, CORS, Cookies, JWT) quyết định cách Frontend và Backend trao đổi danh tính và dữ liệu một cách an toàn qua mạng không tin cậy.',
        why:
          '90% lỗ hổng hoặc bug "gọi API ở Postman chạy nhưng lên trình duyệt lại đỏ lỗi" đều bắt nguồn từ việc chưa hiểu cách Trình duyệt thực thi CORS và cách lưu Token (LocalStorage vs HttpOnly Cookie).',
        how:
          'Khi trang `app.com` gọi API ở `api.com` (khác Origin), trình duyệt tự động gửi request thăm dò `OPTIONS` (Preflight). Server phải trả `Access-Control-Allow-Origin` khớp thì trình duyệt mới cho JS đọc response.',
        internalMechanism: [
          '1. Same-Origin Policy (SOP): Chặn JS ở Origin A đọc dữ liệu của Origin B (khác scheme, host hoặc port).',
          '2. JWT Structure: `Header.Payload.Signature` được ký bằng HMAC-SHA256 hoặc RSA. Lưu ý: Payload chỉ được Base64Url encode — KHÔNG mã hóa bí mật! Ai bắt được cũng decode đọc được payload.',
          '3. XSS vs CSRF: Token lưu `localStorage` dễ bị đọc bởi XSS; Token lưu `HttpOnly` Cookie miễn nhiễm XSS đọc trộm nhưng cần bảo vệ CSRF (`SameSite=Lax/Strict`).',
        ],
        codeLanguage: 'text',
        codeExample: `// Browser Preflight Request
OPTIONS /api/orders HTTP/1.1
Origin: https://noetrix.app
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type

// Required Server Response
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://noetrix.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Credentials: true`,
        tradeOffs: {
          pros: ['JWT Stateless giúp scale ngang nhiều server mà không cần tra DB Session mỗi request.'],
          cons: ['JWT rất khó thu hồi (revoke) trước hạn nếu user vừa bị khóa hoặc đổi mật khẩu.'],
        },
        misconceptions: [
          'Hiểu lầm: "Postman bị lỗi CORS là do server tắt CORS" → SAI. Postman không phải trình duyệt nên KHÔNG BAO GIỜ kiểm tra CORS; CORS là cơ chế bảo vệ của Trình duyệt.',
          'Hiểu lầm: "JWT Payload bí mật không ai đọc được" → SAI. Bất kỳ ai có chuỗi JWT đều giải mã Base64 đọc ngay phần Payload.',
        ],
        references: [{ label: 'MDN Web Docs — CORS Explained', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' }],
      },
      notes: {
        markdown: '- Không bao giờ chứa thông tin nhạy cảm (password, PII) trong JWT Payload.\n- Nếu dùng `Access-Control-Allow-Credentials: true`, header `Access-Control-Allow-Origin` TUYỆT ĐỐI không được là `*`.',
        pitfallsAndFixes: 'Lỗi CORS khi chuyển từ dev sang production: kiểm tra lại danh sách `allowedOrigins` và header `Authorization` trong `allowedHeaders`.',
        tags: ['http', 'cors', 'jwt', 'security'],
      },
      explain: {
        whatIsIt: '',
        whyItExists: '',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Nếu một kẻ xấu đánh cắp được JWT Access Token còn hạn 15 phút, Backend stateless xử lý thế nào?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'CORS Preflight & Authenticated Request Flow',
        kind: 'Sequence',
        nodes: [
          { id: 'w1', type: 'box', x: 50, y: 50, w: 165, h: 64, label: 'Browser\n(noetrix.app)', color: '#A7B6D2' },
          { id: 'w2', type: 'diamond', x: 270, y: 42, w: 175, h: 80, label: 'Preflight OPTIONS\nCheck Headers', color: '#B99B79' },
          { id: 'w3', type: 'box', x: 500, y: 50, w: 165, h: 64, label: 'API Gateway\nVerify Signature', color: '#9BAA98' },
        ],
        edges: [
          { id: 'we1', fromX: 215, fromY: 82, toX: 270, toY: 82, label: '1. OPTIONS', color: '#A7B6D2' },
          { id: 'we2', fromX: 445, fromY: 82, toX: 500, toY: 82, label: '2. POST + JWT', color: '#9BAA98' },
        ],
      },
      practice: {
        activeTaskId: 'pr_web_1',
        tasks: [
          {
            id: 'pr_web_1',
            level: 'Easy',
            title: 'Giải mã phần Payload của một JWT chuẩn Base64Url',
            prompt: 'Viết hàm `decodeJwtPayload(token)` nhận chuỗi JWT dạng `header.payload.sig` và trả về object JSON của phần Payload.',
            testCasesText: 'decodeJwtPayload("aaa." + btoa(\'{"sub":"vance"}\') + ".bbb").sub === "vance"',
            starterJava: '// Base64.getUrlDecoder().decode(parts[1])',
            starterJs: `function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(b64));
}`,
            referenceSolution: 'Tách dấu `.`, lấy phần tử `[1]`, chuẩn hóa `-` -> `+` và `_` -> `/`, giải mã Base64 và `JSON.parse`.',
            solutionNotes: 'Giải mã Payload không xác minh chữ ký — Backend LUÔN phải verify signature với Secret/Public Key trước khi tin tưởng!',
            jsVerifierFnBody: `const tok = "eyJ0eXAiOiJKV1QifQ." + btoa('{"sub":"vance","role":"lead"}').replace(/=/g,'') + ".sig"; return decodeJwtPayload(tok).sub === "vance";`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_web_1',
          kind: 'debug',
          prompt: 'Tại sao gọi `curl https://api.site.com/data` chạy bình thường, nhưng chạy `fetch("https://api.site.com/data")` trên Chrome lại báo lỗi CORS?',
          correctAnswer: 'CORS là cơ chế bảo mật do Trình duyệt (Chrome) thực thi dựa trên Same-Origin Policy; curl là HTTP client dòng lệnh nên bỏ qua hoàn toàn CORS headers.',
          userAnswer: '',
          revealed: false,
          explanation: 'Đừng bao giờ dùng curl thành công để kết luận API đã cấu hình CORS đúng.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Áp dụng Refresh Token rotation với HttpOnly cookie + Short-lived Access Token.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },

    // =========================================================================
    // AI WORKFLOW & AGENTS: Agentic Routing, Chaining & Tool Calling
    // =========================================================================
    {
      id: 'top_ai_agents',
      subjectId: 'subj_ai',
      moduleGroup: '01 · Agentic Architecture',
      title: 'Agentic Routing, Prompt Chaining & Tool Calling',
      subtitle: 'Deterministic Chassis · JSON Contracts · Idempotency · Fallback Loops',
      understanding: 'applied',
      lastStudiedModule: 'practice',
      updatedAt: now - 1000 * 60 * 5,
      relatedTopicIds: ['top_web_http'],
      theory: {
        definition:
          'Kiến trúc Agentic Workflow là sự kết hợp giữa khung điều phối xác định (Deterministic code/routing) và mô hình ngôn ngữ xác suất (Probabilistic LLM) thông qua các hợp đồng JSON và hàm Tool Calling có kiểm soát.',
        why:
          'Nhồi toàn bộ nghiệp vụ vào 1 mega-prompt duy nhất khiến LLM dễ bị ảo giác, sai format hoặc quên bước. Tách nhỏ pipeline giúp kiểm thử từng khâu, kiểm soát chi phí và đảm bảo hệ thống chạy thật không gãy.',
        how:
          'Mỗi bước trong pipeline chỉ làm 1 việc: Classify/Route → Extract JSON Schema → Execute Deterministic Tool → Quality Gate Validator → Final Output.',
        internalMechanism: [
          '1. Router Pattern: Dùng prompt nhẹ phân loại intent trước khi chọn luồng chuyên biệt.',
          '2. Structured Output Contract: Bắt buộc LLM trả về JSON đúng schema; nếu parse lỗi -> kích hoạt Auto-Repair Retry tối đa 2 lần.',
          '3. Tool Idempotency: Khi Agent tự động gọi API ghi dữ liệu (DB/Email/Payment), phải gắn `idempotencyKey` để retry không tạo trùng.',
        ],
        codeLanguage: 'typescript',
        codeExample: `async function safeAgentStep<T>(prompt: string, validate: (x: unknown) => T): Promise<T> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const raw = await callLlm(prompt);
    try {
      return validate(JSON.parse(raw));
    } catch (err) {
      prompt += \`\\n[Validation Error on attempt \${attempt}: Fix JSON format only]\`;
    }
  }
  throw new Error("Deterministic Fallback triggered");
}`,
        tradeOffs: {
          pros: ['Độ tin cậy cao hơn rất nhiều so với 1-shot prompt.', 'Dễ debug từng node khi có lỗi xảy ra.'],
          cons: ['Tăng độ trễ tổng (latency) khi chuỗi chaining nhiều bước tuần tự.'],
        },
        misconceptions: [
          'Hiểu lầm: "Prompt dài và chi tiết hơn luôn tốt hơn" → SAI. Tách chuỗi 3 bước rõ ràng luôn ổn định và rẻ hơn 1 prompt 3000 token.',
        ],
        references: [{ label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/research/building-effective-agents' }],
      },
      notes: {
        markdown: '### Nguyên tắc thiết kế Agent cho sản phẩm thật\n1. Đừng biến mọi bài toán thành Autonomous Agent nếu 1 workflow cố định đã giải quyết xong.\n2. Luôn đặt Quality Gate bằng code thuần (Regex / Zod / Type guard) sau bước LLM.',
        pitfallsAndFixes: 'LLM đôi khi bọc JSON trong markdown ```json ... ``` -> Luôn strip fence hoặc dùng JSON mode trước khi `JSON.parse`.',
        tags: ['ai-workflow', 'agents', 'reliability'],
      },
      explain: {
        whatIsIt: 'Là cách bọc các bước suy luận LLM bằng khung kiểm tra bằng code truyền thống.',
        whyItExists: 'LLM mang tính xác suất (có thể trả sai cấu trúc bất ngờ), còn hệ thống phần mềm đòi hỏi tính chắc chắn.',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Điều gì xảy ra nếu Tool Calling thực hiện thanh toán bị timeout mạng và Agent tự động retry?',
        whatIfAnswer: '',
        canExplainWithoutLooking: true,
        selfGapNotes: '',
      },
      visualize: {
        title: 'Deterministic Chassis + Probabilistic LLM Core',
        kind: 'Architecture',
        nodes: [
          { id: 'a1', type: 'box', x: 40, y: 60, w: 155, h: 64, label: 'Trigger Input\n+ Idempotency Key', color: '#EDEAE2' },
          { id: 'a2', type: 'diamond', x: 240, y: 50, w: 165, h: 84, label: 'Intent Router\n(Fast Classify)', color: '#B99B79' },
          { id: 'a3', type: 'box', x: 455, y: 60, w: 175, h: 64, label: 'Schema Validator\n+ Bounded Retry', color: '#9BAA98' },
        ],
        edges: [
          { id: 'ae1', fromX: 195, fromY: 92, toX: 240, toY: 92, color: '#EDEAE2' },
          { id: 'ae2', fromX: 405, fromY: 92, toX: 455, toY: 92, label: 'JSON', color: '#B99B79' },
        ],
      },
      practice: {
        activeTaskId: 'pr_ai_1',
        tasks: [
          {
            id: 'pr_ai_1',
            level: 'Medium',
            title: 'Xây bộ Parse JSON an toàn từ Output thô của LLM',
            prompt: 'LLM thường trả JSON kèm ```json ... ``` hoặc chữ thừa phía trước. Viết hàm `extractJson(raw)` tách đúng khối JSON `{...}` và parse an toàn (trả `null` nếu hỏng).',
            testCasesText: 'extractJson("Sure! ```json\\n{\\"ok\\":true}\\n```").ok === true',
            starterJava: '// Strip markdown fences and locate first { to last }',
            starterJs: `function extractJson(raw) {
  const cleaned = raw.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}`,
            referenceSolution: 'Loại bỏ fence markdown, tìm cặp ngoặc nhọn ngoài cùng rồi bọc `JSON.parse` trong `try/catch`.',
            solutionNotes: 'Quality gate tối thiểu cho mọi pipeline gọi LLM!',
            jsVerifierFnBody: `const r = extractJson("Here is result:\\n\`\`\`json\\n{\\"step\\": 3, \\"valid\\": true}\\n\`\`\`"); return r && r.step === 3 && r.valid === true && extractJson("broken text") === null;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_ai_1',
          kind: 'recall',
          prompt: 'Vì sao mọi Tool ghi dữ liệu (POST/Charge/Delete) trong AI Agent đều cần `idempotencyKey`?',
          correctAnswer: 'Để khi mạng lag hoặc LLM loop gọi lại cùng một tool call, server nhận ra khóa trùng và không thực thi tác vụ đó hai lần.',
          userAnswer: '',
          revealed: false,
          explanation: 'Idempotency biến retry an toàn thành đặc tính mặc định của hệ thống phân tán.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Áp dụng ngay vào pipeline tự động phân loại & tóm tắt bài viết trong NOETRIX.',
        nextReviewDate: addDaysIso(14),
        intervalDays: 14,
        reviewCount: 2,
      },
    },

    // =========================================================================
    // SQL & STORAGE: B-Tree Indexing & Execution Plans
    // =========================================================================
    {
      id: 'top_sql_btree',
      subjectId: 'subj_sql',
      moduleGroup: '01 · Query & Indexing Engine',
      title: 'B-Tree Indexing & Query Execution Plans',
      subtitle: 'Balanced B+Tree · Leftmost Prefix Rule · Covering Index · Full Table Scan',
      understanding: 'exposed',
      lastStudiedModule: 'theory',
      updatedAt: now - 1000 * 60 * 60 * 36,
      relatedTopicIds: ['top_java_hashmap'],
      theory: {
        definition:
          'B+Tree Index là cấu trúc cây cân bằng nhiều nhánh giúp Database tìm kiếm, sắp xếp và truy vấn khoảng (`BETWEEN`, `>`, `<`) trên đĩa cứng chỉ với 3–4 lần đọc page thay vì quét toàn bộ bảng (Full Table Scan).',
        why:
          'Đọc dữ liệu từ SSD/Disk tốn chi phí I/O gấp hàng nghìn lần RAM. B+Tree giữ cây rất nông (shallow) nhờ mỗi node chứa hàng trăm khóa, giúp bảng 10 triệu dòng vẫn tra cứu trong ~3 bước.',
        how:
          'Toàn bộ dữ liệu thật hoặc con trỏ tới dòng nằm ở tầng lá (Leaf Nodes) được nối thành danh sách liên kết hai chiều. Khi tạo Composite Index `(a, b, c)`, cây sắp xếp ưu tiên theo `a` trước, rồi `b`, rồi `c`.',
        internalMechanism: [
          '1. Leftmost Prefix Rule: Index `(user_id, created_at)` dùng được cho `WHERE user_id = ?` và `WHERE user_id = ? AND created_at > ?`, NHƯNG vô dụng nếu chỉ hỏi `WHERE created_at > ?`.',
          '2. Hàm số phá Index: Viết `WHERE YEAR(created_at) = 2026` buộc DB tính toán từng dòng -> mất Index! Phải viết dạng range `created_at >= "2026-01-01"`.',
          '3. Covering Index: Nếu mọi cột trong `SELECT` đều nằm sẵn trong Index, DB không cần quay lại bảng gốc (Lookup) — gọi là Index-Only Scan.',
        ],
        codeLanguage: 'sql',
        codeExample: `-- Composite Index chuẩn cho timeline cá nhân
CREATE INDEX idx_logs_user_date ON daily_logs (user_id, created_at DESC);

-- Dùng được Index (O(log n)):
SELECT id, title FROM daily_logs WHERE user_id = 'quynh' ORDER BY created_at DESC LIMIT 20;

-- Phá Index (Full Table Scan O(n)):
SELECT * FROM daily_logs WHERE LOWER(email) = 'a@b.com';`,
        tradeOffs: {
          pros: ['Tăng tốc độ đọc `SELECT / WHERE / ORDER BY` từ vài giây xuống vài mili-giây.'],
          cons: ['Mỗi `INSERT / UPDATE / DELETE` phải cập nhật lại cây B+Tree -> đánh quá nhiều Index sẽ làm chậm thao tác ghi và tốn dung lượng đĩa.'],
        },
        misconceptions: [
          'Hiểu lầm: "Cứ đánh Index lên mọi cột là DB chạy nhanh nhất" → SAI. Mỗi Index dư thừa làm chậm INSERT/UPDATE và làm phình kích thước buffer pool RAM.',
        ],
        references: [{ label: 'Use The Index, Luke — B-Tree Anatomy', url: 'https://use-the-index-luke.com/' }],
      },
      notes: {
        markdown: '- Luôn kiểm tra query chậm bằng `EXPLAIN ANALYZE` để xem nó dùng `Index Scan` hay `Seq Scan`.',
        pitfallsAndFixes: 'Dùng `LIKE "%keyword%"` có dấu `%` ở đầu sẽ không dùng được B-Tree index chuẩn (cần Full-Text Index hoặc Trigram).',
        tags: ['sql', 'btree', 'indexing'],
      },
      explain: {
        whatIsIt: '',
        whyItExists: '',
        howItWorks: '',
        whatHappensInternally: '',
        whatIfScenarioPrompt: 'Tại sao Hash Index nhanh hơn B-Tree ở phép so sánh `=`, nhưng PostgreSQL/MySQL InnoDB lại chọn B+Tree làm mặc định?',
        whatIfAnswer: '',
        canExplainWithoutLooking: false,
        selfGapNotes: '',
      },
      visualize: {
        title: 'B+Tree Index Lookup & Leaf Chain',
        kind: 'Data Structure',
        nodes: [
          { id: 's1', type: 'box', x: 220, y: 30, w: 200, h: 56, label: 'Root Page\n[ 100 | 500 ]', color: '#B99B79' },
          { id: 's2', type: 'box', x: 60, y: 150, w: 185, h: 64, label: 'Leaf Page 1\n[10, 42, 88] ↔', color: '#9BAA98' },
          { id: 's3', type: 'box', x: 380, y: 150, w: 185, h: 64, label: 'Leaf Page 2\n[120, 250, 490]', color: '#9BAA98' },
        ],
        edges: [
          { id: 'se1', fromX: 270, fromY: 86, toX: 150, toY: 150, label: '< 100', color: '#B99B79' },
          { id: 'se2', fromX: 370, fromY: 86, toX: 470, toY: 150, label: '100..499', color: '#B99B79' },
        ],
      },
      practice: {
        activeTaskId: 'pr_sql_1',
        tasks: [
          {
            id: 'pr_sql_1',
            level: 'Easy',
            title: 'Mô phỏng Binary Search trên một Leaf Page B-Tree',
            prompt: 'Viết hàm `searchPage(keys, target)` dùng Binary Search tìm vị trí của `target` trong mảng khóa đã sắp xếp (trả về `-1` nếu không thấy).',
            testCasesText: 'searchPage([10, 42, 88, 120, 250], 88) === 2',
            starterJava: 'int idx = Arrays.binarySearch(keys, target);',
            starterJs: `function searchPage(keys, target) {
  let l = 0, r = keys.length - 1;
  while (l <= r) {
    const mid = (l + r) >> 1;
    if (keys[mid] === target) return mid;
    if (keys[mid] < target) l = mid + 1;
    else r = mid - 1;
  }
  return -1;
}`,
            referenceSolution: 'Binary search O(log k) ngay bên trong từng page cố định 4KB–16KB.',
            solutionNotes: 'B-Tree kết hợp fan-out lớn trên đĩa với binary search trong từng page trên RAM.',
            jsVerifierFnBody: `return searchPage([10, 42, 88, 120, 250], 88) === 2 && searchPage([10, 42], 99) === -1;`,
          },
        ],
      },
      experiments: [],
      assessments: [
        {
          id: 'as_sql_1',
          kind: 'predict_output',
          prompt: 'Với Index `(status, created_at)`, truy vấn `WHERE created_at > "2026-01-01"` có sử dụng được Index này hiệu quả không?',
          options: ['Không dùng được hiệu quả (vi phạm Leftmost Prefix)', 'Dùng được Index hoàn hảo O(log n)'],
          correctAnswer: 'Không dùng được hiệu quả (vi phạm Leftmost Prefix)',
          userAnswer: '',
          revealed: false,
          explanation: 'Vì cây sắp xếp theo `status` trước, cùng một `created_at` có thể nằm rải rác ở tất cả các nhánh `status` khác nhau.',
        },
      ],
      review: {
        weakConcepts: '',
        realProjectApplication: 'Kiểm tra lại toàn bộ query có `WHERE` + `ORDER BY` để tạo composite index đúng thứ tự.',
        nextReviewDate: addDaysIso(7),
        intervalDays: 7,
        reviewCount: 0,
      },
    },
  ];

  return {
    activeLevel: 'directory',
    activeSubjectId: 'subj_java',
    activeTopicId: 'top_java_hashmap',
    activeModule: 'theory',
    subjects,
    topics,
  };
}
