export type LeetCodeMasteryStatus =
  | 'unsolved'
  | 'independent'
  | 'hint_used'
  | 'solution_learned'
  | 'resolved'
  | 'mastered';

export interface LeetCode100Chapter {
  id: string;
  number: string;
  partId: string;
  partTitle: string;
  dayRange: string;
  title: string;
  goal: string;
  lectures: string[];
  javaFocus: string;
  note?: string;
}

export interface LeetCode100Problem {
  num: number;
  chapterId: string;
  title: string;
  difficulty: 'Easy' | 'Medium';
  slug: string;
  isReview?: boolean;
  reviewNote?: string;
}

export const LEETCODE_90DAY_SCHEDULE = [
  { part: 'PHẦN I', stage: 'Foundations', days: 'Ngày 1–14', count: 15, chapters: 'Ch.01 – Ch.02' },
  { part: 'PHẦN II', stage: 'Core Data Structures', days: 'Ngày 15–35', count: 20, chapters: 'Ch.03 – Ch.05' },
  { part: 'PHẦN III', stage: 'Algorithm Patterns', days: 'Ngày 36–55', count: 20, chapters: 'Ch.06 – Ch.08' },
  { part: 'PHẦN IV', stage: 'Trees & Graphs', days: 'Ngày 56–72', count: 15, chapters: 'Ch.09 – Ch.11' },
  { part: 'PHẦN V', stage: 'Advanced Algorithms', days: 'Ngày 73–84', count: 15, chapters: 'Ch.12 – Ch.14' },
  { part: 'PHẦN VI', stage: 'Review & Interview', days: 'Ngày 85–90', count: 15, chapters: 'Ch.15 (#78–#100)' },
];

export const LEETCODE_PARALLEL_RESOURCES = [
  {
    title: 'LeetCode 75',
    subtitle: 'Bộ bài luyện tập có cấu trúc',
    url: 'https://leetcode.com/studyplan/leetcode-75/',
  },
  {
    title: 'NeetCode Roadmap',
    subtitle: 'Học theo từng pattern và chủ đề',
    url: 'https://neetcode.io/roadmap',
  },
  {
    title: 'VisuAlgo',
    subtitle: 'Trực quan hóa cấu trúc dữ liệu và thuật toán',
    url: 'https://visualgo.net/en',
  },
  {
    title: 'Big-O Cheat Sheet',
    subtitle: 'Tra cứu độ phức tạp thuật toán',
    url: 'https://www.bigocheatsheet.com/',
  },
  {
    title: 'Java 21 Documentation',
    subtitle: 'Tra cứu Java Collections và API',
    url: 'https://docs.oracle.com/en/java/javase/21/docs/api/',
  },
];

export const LEETCODE_MASTERY_META: Record<
  LeetCodeMasteryStatus,
  { label: string; shortLabel: string; meaning: string; color: string; bg: string }
> = {
  unsolved: {
    label: 'Unsolved',
    shortLabel: 'Chưa giải',
    meaning: 'Chưa bắt đầu hoặc đang đọc đề',
    color: 'var(--os-ivory-faint)',
    bg: 'var(--os-obsidian)',
  },
  independent: {
    label: 'Independent',
    shortLabel: 'Independent',
    meaning: 'Tự giải được không cần gợi ý',
    color: 'var(--os-dusty-blue)',
    bg: 'rgba(167, 182, 210, 0.14)',
  },
  hint_used: {
    label: 'Hint Used',
    shortLabel: 'Hint Used',
    meaning: 'Cần gợi ý để tìm ra hướng giải',
    color: 'var(--os-brass)',
    bg: 'rgba(185, 155, 121, 0.14)',
  },
  solution_learned: {
    label: 'Solution Learned',
    shortLabel: 'Solution Learned',
    meaning: 'Đã xem lời giải, hiểu ý tưởng & tự code lại',
    color: 'var(--os-crimson)',
    bg: 'rgba(194, 123, 118, 0.14)',
  },
  resolved: {
    label: 'Re-solved',
    shortLabel: 'Re-solved',
    meaning: 'Tự giải lại được sau 1 ngày & 7 ngày',
    color: 'var(--os-ivory-bright)',
    bg: 'rgba(217, 213, 203, 0.16)',
  },
  mastered: {
    label: 'Mastered',
    shortLabel: 'Mastered',
    meaning: 'Hiểu sâu và áp dụng được pattern cho bài mới',
    color: 'var(--os-sage)',
    bg: 'rgba(155, 170, 152, 0.18)',
  },
};

export const LEETCODE_100_CHAPTERS: LeetCode100Chapter[] = [
  // PHẦN I — FOUNDATIONS (DAY 1–14)
  {
    id: 'ch01',
    number: '01',
    partId: 'part1',
    partTitle: 'PHẦN I — FOUNDATIONS (DAY 1–14)',
    dayRange: 'Day 1–5',
    title: 'Chapter 01. Problem Solving Fundamentals',
    goal: 'Xây dựng tư duy giải quyết vấn đề, phân tích độ phức tạp Big-O và quy trình trace code chuẩn.',
    lectures: [
      'Input, Output, Constraints',
      'Brute Force là gì?',
      'Time Complexity và Space Complexity',
      'Big O: O(1), O(log n), O(n), O(n log n), O(n²)',
      'Cách đọc và phân tích đề bài',
      'Cách xây dựng Test Cases',
      'Edge Cases và Boundary Conditions',
      'Cách debug và trace code',
    ],
    javaFocus:
      'Làm quen kiểu nguyên thủy (int, long tránh tràn số), vòng lặp, mảng 1D/2D và tham chiếu ListNode trong Java.',
  },
  {
    id: 'ch02',
    number: '02',
    partId: 'part1',
    partTitle: 'PHẦN I — FOUNDATIONS (DAY 1–14)',
    dayRange: 'Day 6–14',
    title: 'Chapter 02. Array & String',
    goal: 'Nắm vững bố cục bộ nhớ mảng, tính bất biến của String trong Java, Two Pointers và Prefix Sum cơ bản.',
    lectures: [
      'Array và Memory Layout',
      'Static Array vs Dynamic Array (ArrayList)',
      'String và String Immutability trong Java',
      'Traversal và In-place Modification',
      'Two Pointers',
      'Frequency Counting (int[26] / int[128])',
      'Prefix Sum cơ bản',
    ],
    javaFocus:
      'Sử dụng StringBuilder thay vì nối chuỗi `+` trong vòng lặp (tránh O(n²)); dùng char[] vàtoCharArray(), Arrays.sort().',
  },

  // PHẦN II — CORE DATA STRUCTURES (DAY 15–35)
  {
    id: 'ch03',
    number: '03',
    partId: 'part2',
    partTitle: 'PHẦN II — CORE DATA STRUCTURES (DAY 15–35)',
    dayRange: 'Day 15–21',
    title: 'Chapter 03. HashMap & HashSet',
    goal: 'Hiểu cơ chế băm, xử lý đụng độ (collision) và tra cứu trung bình O(1) với HashMap/HashSet trong Java.',
    lectures: [
      'Hash Function',
      'Hash Collision (Chaining & Red-Black Tree từ Java 8)',
      'HashMap Internals',
      'HashSet và Duplicate Detection',
      'Frequency Map',
      'Average O(1) Lookup',
      'equals() và hashCode() contract trong Java',
    ],
    javaFocus:
      'Thành thạo map.getOrDefault(k, 0), map.putIfAbsent(), map.computeIfAbsent() và hợp đồng equals()/hashCode() trong Java Backend.',
    note: 'Two Sum đã xuất hiện ở Chapter 02; ở đây sử dụng lại để giải bằng HashMap O(n) và so sánh trực tiếp với cách tiếp cận Brute Force / Two Pointers.',
  },
  {
    id: 'ch04',
    number: '04',
    partId: 'part2',
    partTitle: 'PHẦN II — CORE DATA STRUCTURES (DAY 15–35)',
    dayRange: 'Day 22–28',
    title: 'Chapter 04. Stack & Queue',
    goal: 'Ứng dụng LIFO, FIFO, Deque và Monotonic Stack để giải quyết bài toán ngoặc, biểu thức và phần tử lớn hơn kế tiếp.',
    lectures: [
      'LIFO và FIFO',
      'Stack Operations',
      'Queue Operations',
      'Deque (Double-ended Queue)',
      'Monotonic Stack',
      'ArrayDeque trong Java',
      'Khi nào sử dụng Stack thay vì Queue?',
    ],
    javaFocus:
      'Trong Java hiện đại, luôn ưu tiên Deque<Integer> stack = new ArrayDeque<>() thay vì lớp java.util.Stack cũ kỹ (synchronized overhead).',
  },
  {
    id: 'ch05',
    number: '05',
    partId: 'part2',
    partTitle: 'PHẦN II — CORE DATA STRUCTURES (DAY 15–35)',
    dayRange: 'Day 29–35',
    title: 'Chapter 05. Linked List',
    goal: 'Làm chủ thao tác trỏ tham chiếu (references), Dummy Node, đảo ngược danh sách liên kết và kỹ thuật Fast & Slow Pointers.',
    lectures: [
      'Node và Pointer References',
      'Singly Linked List',
      'Doubly Linked List',
      'Traversal',
      'Insert và Delete',
      'Fast & Slow Pointers (Floyd’s Tortoise and Hare)',
      'Reverse Linked List',
      'Dummy Node technique',
    ],
    javaFocus:
      'Vẽ sơ đồ mũi tên `prev`, `curr`, `nextTemp` trước khi gán tham chiếu để tránh NullPointerException hoặc tạo vòng lặp vô tận.',
  },

  // PHẦN III — ALGORITHM PATTERNS (DAY 36–55)
  {
    id: 'ch06',
    number: '06',
    partId: 'part3',
    partTitle: 'PHẦN III — ALGORITHM PATTERNS (DAY 36–55)',
    dayRange: 'Day 36–42',
    title: 'Chapter 06. Binary Search',
    goal: 'Tìm kiếm nhị phân không lệch biên (off-by-one) và nâng cấp lên Binary Search on Answer trên không gian nghiệm đơn điệu.',
    lectures: [
      'Linear Search vs Binary Search',
      'Search Space (Không gian tìm kiếm)',
      'Left Boundary và Right Boundary',
      'Mid Calculation: left + (right - left) / 2 (chống tràn số int)',
      'Binary Search on Answer',
      'Điều kiện đơn điệu (Monotonicity) để sử dụng Binary Search',
    ],
    javaFocus:
      'Luôn viết `int mid = left + (right - left) / 2;` để tránh tràn số khi `left + right > Integer.MAX_VALUE`.',
  },
  {
    id: 'ch07',
    number: '07',
    partId: 'part3',
    partTitle: 'PHẦN III — ALGORITHM PATTERNS (DAY 36–55)',
    dayRange: 'Day 43–49',
    title: 'Chapter 07. Sliding Window & Prefix Sum',
    goal: 'Tối ưu các bài toán mảng con / chuỗi con liên tiếp từ O(n²) xuống O(n) bằng cửa sổ trượt và HashMap + Prefix Sum.',
    lectures: [
      'Fixed-size Sliding Window',
      'Variable-size Sliding Window',
      'Expand và Shrink Window invariant',
      'Prefix Sum',
      'Subarray vs Subsequence',
      'HashMap kết hợp Prefix Sum (Subarray Sum Equals K)',
    ],
    javaFocus:
      'Phân biệt khi nào dùng Sliding Window (các số dương / điều kiện đơn điệu) vs khi nào bắt buộc dùng Prefix Sum + HashMap (có số âm).',
  },
  {
    id: 'ch08',
    number: '08',
    partId: 'part3',
    partTitle: 'PHẦN III — ALGORITHM PATTERNS (DAY 36–55)',
    dayRange: 'Day 50–55',
    title: 'Chapter 08. Recursion & Backtracking',
    goal: 'Hiểu sâu Call Stack, vẽ cây quyết định (Decision Tree) và áp dụng khung mẫu Choose → Explore → Undo.',
    lectures: [
      'Recursion và Call Stack',
      'Base Case',
      'Recursive Case',
      'Decision Tree',
      'Backtracking Template',
      'Choose → Explore → Undo',
      'Pruning (Cắt tỉa nhánh thừa)',
    ],
    javaFocus:
      'Khi lưu kết quả vào `res.add(new ArrayList<>(path))`, nhớ tạo bản sao `new ArrayList<>(path)` vì `path` sẽ bị thay đổi khi backtrack.',
  },

  // PHẦN IV — TREES & GRAPHS (DAY 56–72)
  {
    id: 'ch09',
    number: '09',
    partId: 'part4',
    partTitle: 'PHẦN IV — TREES & GRAPHS (DAY 56–72)',
    dayRange: 'Day 56–62',
    title: 'Chapter 09. Binary Tree & BST',
    goal: 'Tư duy đệ quy trên cây nhị phân, duyệt DFS (Pre/In/Post-order), BFS theo tầng và khai thác tính chất thứ tự của BST.',
    lectures: [
      'Tree Terminology',
      'Root, Leaf, Height, Depth',
      'Binary Tree',
      'Binary Search Tree (BST Inorder = Sorted)',
      'DFS: Preorder, Inorder, Postorder',
      'BFS: Level Order Traversal với Queue',
      'Recursive vs Iterative Traversal',
    ],
    javaFocus:
      'Tách biệt rõ "Thông tin truyền từ cha xuống con (tham số hàm)" và "Thông tin tổng hợp từ con trả về cha (giá trị return)".',
  },
  {
    id: 'ch10',
    number: '10',
    partId: 'part4',
    partTitle: 'PHẦN IV — TREES & GRAPHS (DAY 56–72)',
    dayRange: 'Day 63–66',
    title: 'Chapter 10. Heap & Priority Queue',
    goal: 'Hiểu cấu trúc Binary Heap và sử dụng PriorityQueue trong Java để giải nhanh họ bài toán Top-K / Kth Largest trong O(n log k).',
    lectures: [
      'Min Heap và Max Heap',
      'Heap Property',
      'Insert O(log n) và Extract O(log n)',
      'Priority Queue',
      'Top K Problems (Dùng Min-Heap kích thước K để tìm K phần tử lớn nhất)',
      'Java PriorityQueue & Custom Comparator',
    ],
    javaFocus:
      'Mặc định `new PriorityQueue<>()` trong Java là Min-Heap; dùng `new PriorityQueue<>(Collections.reverseOrder())` hoặc `(a, b) -> Integer.compare(b, a)` cho Max-Heap.',
  },
  {
    id: 'ch11',
    number: '11',
    partId: 'part4',
    partTitle: 'PHẦN IV — TREES & GRAPHS (DAY 56–72)',
    dayRange: 'Day 67–72',
    title: 'Chapter 11. Graph',
    goal: 'Biểu diễn đồ thị, duyệt lưới 2D (Grid Matrix) & danh sách kề bằng DFS/BFS, đếm thành phần liên thông và BFS đa nguồn.',
    lectures: [
      'Graph Terminology',
      'Directed vs Undirected Graph',
      'Weighted vs Unweighted Graph',
      'Adjacency List và Adjacency Matrix',
      'DFS và BFS trên Graph / Grid 2D',
      'Visited Set (Tránh lặp vô hạn)',
      'Connected Components',
      'Cycle Detection',
    ],
    javaFocus:
      'Đánh dấu `visited` NGAY KHI đẩy đỉnh vào Queue trong BFS (không đợi tới lúc lấy ra khỏi Queue mới đánh dấu để tránh đẩy trùng nhiều lần).',
  },

  // PHẦN V — ADVANCED ALGORITHMS (DAY 73–84)
  {
    id: 'ch12',
    number: '12',
    partId: 'part5',
    partTitle: 'PHẦN V — ADVANCED ALGORITHMS (DAY 73–84)',
    dayRange: 'Day 73–77',
    title: 'Chapter 12. Dynamic Programming',
    goal: 'Chuyển từ đệ quy có nhớ (Top-Down Memoization) sang quy hoạch động bảng (Bottom-Up Tabulation) qua việc định nghĩa State & Transition.',
    lectures: [
      'What is Dynamic Programming?',
      'Overlapping Subproblems',
      'Optimal Substructure',
      'Memoization (Top-Down)',
      'Tabulation (Bottom-Up)',
      'State Definition (dp[i] hoặc dp[i][j] đại diện cho điều gì?)',
      'Transition Function (Công thức truy hồi)',
      'Base Cases',
    ],
    javaFocus:
      'Luôn viết rõ bằng lời câu hỏi: `dp[i]` có ý nghĩa là gì trước khi viết vòng lặp.',
  },
  {
    id: 'ch13',
    number: '13',
    partId: 'part5',
    partTitle: 'PHẦN V — ADVANCED ALGORITHMS (DAY 73–84)',
    dayRange: 'Day 78–81',
    title: 'Chapter 13. Greedy & Intervals',
    goal: 'Phân biệt khi nào tham lam (Greedy) đạt tối ưu toàn cục và thành thạo kỹ thuật sắp xếp đoạn thẳng (Intervals).',
    lectures: [
      'Greedy Strategy (Kadane’s Algorithm, Reachability)',
      'Local vs Global Optimal',
      'Sorting Intervals theo start hoặc end',
      'Overlapping Intervals',
      'Scheduling Problems',
    ],
    javaFocus:
      'Khi sort mảng 2D intervals trong Java: luôn dùng `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]))` thay vì `a[0] - b[0]` để tránh lỗi tràn số âm.',
  },
  {
    id: 'ch14',
    number: '14',
    partId: 'part5',
    partTitle: 'PHẦN V — ADVANCED ALGORITHMS (DAY 73–84)',
    dayRange: 'Day 82–84',
    title: 'Chapter 14. Bit Manipulation & Trie',
    goal: 'Vận dụng phép toán bit (XOR, Brian Kernighan’s trick) và xây dựng cây tiền tố Trie cho bài toán tìm kiếm chuỗi tốc độ cao.',
    lectures: [
      'Binary Representation',
      'AND (&), OR (|), XOR (^), NOT (~)',
      'Bit Shifting (<<, >>, >>>)',
      'XOR Properties (a ^ a = 0, a ^ 0 = a)',
      'Trie / Prefix Tree (TrieNode[26] + isEndOfWord)',
      'Prefix Search',
    ],
    javaFocus:
      'Mẹo xóa bit 1 thấp nhất: `n & (n - 1)` giúp đếm số bit 1 hoặc kiểm tra lũy thừa của 2 trong O(1).',
  },

  // PHẦN VI — CONSOLIDATION & INTERVIEW PREPARATION (DAY 85–90)
  {
    id: 'ch15',
    number: '15',
    partId: 'part6',
    partTitle: 'PHẦN VI — CONSOLIDATION & INTERVIEW PREPARATION (DAY 85–90)',
    dayRange: 'Day 85–90',
    title: 'Chapter 15. Review & Mock Interview',
    goal: 'Củng cố toàn bộ 14 chương, tự nhận diện pattern khi không biết trước chủ đề và giải bài độc lập trong áp lực thời gian phỏng vấn thực tế.',
    lectures: [
      'Nhận diện Pattern từ Constraints (n ≤ 20 → Backtracking/Bitmask; n ≤ 10⁵ → O(n) hoặc O(n log n))',
      'Kỹ năng trình bày giải pháp (Think out loud: Clarify → Brute Force → Optimize → Dry Run → Complexity)',
      'Tổng kết 23 bài chuẩn phỏng vấn Backend / Software Engineering (#78–#100)',
      'Thiết kế cấu trúc dữ liệu kết hợp (LRU Cache = HashMap + Doubly Linked List)',
    ],
    javaFocus:
      'Tự code trọn vẹn từ đầu đến cuối trong 25–35 phút/bài không dùng gợi ý, tự viết test cases kiểm tra biên.',
  },
];

export const LEETCODE_100_PROBLEMS: LeetCode100Problem[] = [
  // Chapter 01 (#1–#5)
  { num: 1, chapterId: 'ch01', title: 'Running Sum of 1d Array', difficulty: 'Easy', slug: 'running-sum-of-1d-array' },
  { num: 2, chapterId: 'ch01', title: 'Richest Customer Wealth', difficulty: 'Easy', slug: 'richest-customer-wealth' },
  { num: 3, chapterId: 'ch01', title: 'Fizz Buzz', difficulty: 'Easy', slug: 'fizz-buzz' },
  { num: 4, chapterId: 'ch01', title: 'Number of Steps to Reduce a Number to Zero', difficulty: 'Easy', slug: 'number-of-steps-to-reduce-a-number-to-zero' },
  { num: 5, chapterId: 'ch01', title: 'Middle of the Linked List', difficulty: 'Easy', slug: 'middle-of-the-linked-list' },

  // Chapter 02 (#6–#15)
  { num: 6, chapterId: 'ch02', title: 'Two Sum', difficulty: 'Easy', slug: 'two-sum' },
  { num: 7, chapterId: 'ch02', title: 'Contains Duplicate', difficulty: 'Easy', slug: 'contains-duplicate' },
  { num: 8, chapterId: 'ch02', title: 'Valid Anagram', difficulty: 'Easy', slug: 'valid-anagram' },
  { num: 9, chapterId: 'ch02', title: 'Move Zeroes', difficulty: 'Easy', slug: 'move-zeroes' },
  { num: 10, chapterId: 'ch02', title: 'Merge Strings Alternately', difficulty: 'Easy', slug: 'merge-strings-alternately' },
  { num: 11, chapterId: 'ch02', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', slug: 'best-time-to-buy-and-sell-stock' },
  { num: 12, chapterId: 'ch02', title: 'Find Pivot Index', difficulty: 'Easy', slug: 'find-pivot-index' },
  { num: 13, chapterId: 'ch02', title: 'Product of Array Except Self', difficulty: 'Medium', slug: 'product-of-array-except-self' },
  { num: 14, chapterId: 'ch02', title: 'Is Subsequence', difficulty: 'Easy', slug: 'is-subsequence' },
  { num: 15, chapterId: 'ch02', title: 'Majority Element', difficulty: 'Easy', slug: 'majority-element' },

  // Chapter 03 (#16–#20)
  {
    num: 16,
    chapterId: 'ch03',
    title: 'Two Sum (HashMap O(n) Approach)',
    difficulty: 'Easy',
    slug: 'two-sum',
    isReview: true,
    reviewNote: 'Giải lại bằng HashMap O(n) và đối chiếu với cách giải ở Chapter 02.',
  },
  { num: 17, chapterId: 'ch03', title: 'Ransom Note', difficulty: 'Easy', slug: 'ransom-note' },
  { num: 18, chapterId: 'ch03', title: 'First Unique Character in a String', difficulty: 'Easy', slug: 'first-unique-character-in-a-string' },
  { num: 19, chapterId: 'ch03', title: 'Group Anagrams', difficulty: 'Medium', slug: 'group-anagrams' },
  { num: 20, chapterId: 'ch03', title: 'Top K Frequent Elements', difficulty: 'Medium', slug: 'top-k-frequent-elements' },

  // Chapter 04 (#21–#25)
  { num: 21, chapterId: 'ch04', title: 'Valid Parentheses', difficulty: 'Easy', slug: 'valid-parentheses' },
  { num: 22, chapterId: 'ch04', title: 'Implement Queue using Stacks', difficulty: 'Easy', slug: 'implement-queue-using-stacks' },
  { num: 23, chapterId: 'ch04', title: 'Implement Stack using Queues', difficulty: 'Easy', slug: 'implement-stack-using-queues' },
  { num: 24, chapterId: 'ch04', title: 'Daily Temperatures', difficulty: 'Medium', slug: 'daily-temperatures' },
  { num: 25, chapterId: 'ch04', title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', slug: 'evaluate-reverse-polish-notation' },

  // Chapter 05 (#26–#31)
  { num: 26, chapterId: 'ch05', title: 'Reverse Linked List', difficulty: 'Easy', slug: 'reverse-linked-list' },
  { num: 27, chapterId: 'ch05', title: 'Merge Two Sorted Lists', difficulty: 'Easy', slug: 'merge-two-sorted-lists' },
  { num: 28, chapterId: 'ch05', title: 'Linked List Cycle', difficulty: 'Easy', slug: 'linked-list-cycle' },
  {
    num: 29,
    chapterId: 'ch05',
    title: 'Middle of the Linked List (Fast & Slow Pointers)',
    difficulty: 'Easy',
    slug: 'middle-of-the-linked-list',
    isReview: true,
    reviewNote: 'Ôn tập có chủ đích: dùng chuẩn Fast & Slow Pointers trong 1 lần duyệt.',
  },
  { num: 30, chapterId: 'ch05', title: 'Remove Nth Node From End of List', difficulty: 'Medium', slug: 'remove-nth-node-from-end-of-list' },
  { num: 31, chapterId: 'ch05', title: 'Reorder List', difficulty: 'Medium', slug: 'reorder-list' },

  // Chapter 06 (#32–#37)
  { num: 32, chapterId: 'ch06', title: 'Binary Search', difficulty: 'Easy', slug: 'binary-search' },
  { num: 33, chapterId: 'ch06', title: 'Search Insert Position', difficulty: 'Easy', slug: 'search-insert-position' },
  { num: 34, chapterId: 'ch06', title: 'Guess Number Higher or Lower', difficulty: 'Easy', slug: 'guess-number-higher-or-lower' },
  { num: 35, chapterId: 'ch06', title: 'Find First and Last Position of Element in Sorted Array', difficulty: 'Medium', slug: 'find-first-and-last-position-of-element-in-sorted-array' },
  { num: 36, chapterId: 'ch06', title: 'Search in Rotated Sorted Array', difficulty: 'Medium', slug: 'search-in-rotated-sorted-array' },
  { num: 37, chapterId: 'ch06', title: 'Koko Eating Bananas', difficulty: 'Medium', slug: 'koko-eating-bananas' },

  // Chapter 07 (#38–#42)
  { num: 38, chapterId: 'ch07', title: 'Maximum Average Subarray I', difficulty: 'Easy', slug: 'maximum-average-subarray-i' },
  { num: 39, chapterId: 'ch07', title: 'Minimum Size Subarray Sum', difficulty: 'Medium', slug: 'minimum-size-subarray-sum' },
  { num: 40, chapterId: 'ch07', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', slug: 'longest-substring-without-repeating-characters' },
  { num: 41, chapterId: 'ch07', title: 'Max Consecutive Ones III', difficulty: 'Medium', slug: 'max-consecutive-ones-iii' },
  { num: 42, chapterId: 'ch07', title: 'Subarray Sum Equals K', difficulty: 'Medium', slug: 'subarray-sum-equals-k' },

  // Chapter 08 (#43–#47)
  { num: 43, chapterId: 'ch08', title: 'Fibonacci Number', difficulty: 'Easy', slug: 'fibonacci-number' },
  { num: 44, chapterId: 'ch08', title: 'Climbing Stairs', difficulty: 'Easy', slug: 'climbing-stairs' },
  { num: 45, chapterId: 'ch08', title: 'Subsets', difficulty: 'Medium', slug: 'subsets' },
  { num: 46, chapterId: 'ch08', title: 'Permutations', difficulty: 'Medium', slug: 'permutations' },
  { num: 47, chapterId: 'ch08', title: 'Combination Sum', difficulty: 'Medium', slug: 'combination-sum' },

  // Chapter 09 (#48–#55)
  { num: 48, chapterId: 'ch09', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', slug: 'maximum-depth-of-binary-tree' },
  { num: 49, chapterId: 'ch09', title: 'Invert Binary Tree', difficulty: 'Easy', slug: 'invert-binary-tree' },
  { num: 50, chapterId: 'ch09', title: 'Same Tree', difficulty: 'Easy', slug: 'same-tree' },
  { num: 51, chapterId: 'ch09', title: 'Path Sum', difficulty: 'Easy', slug: 'path-sum' },
  { num: 52, chapterId: 'ch09', title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', slug: 'binary-tree-level-order-traversal' },
  { num: 53, chapterId: 'ch09', title: 'Diameter of Binary Tree', difficulty: 'Easy', slug: 'diameter-of-binary-tree' },
  { num: 54, chapterId: 'ch09', title: 'Validate Binary Search Tree', difficulty: 'Medium', slug: 'validate-binary-search-tree' },
  { num: 55, chapterId: 'ch09', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'Medium', slug: 'lowest-common-ancestor-of-a-binary-search-tree' },

  // Chapter 10 (#56–#58)
  { num: 56, chapterId: 'ch10', title: 'Kth Largest Element in an Array', difficulty: 'Medium', slug: 'kth-largest-element-in-an-array' },
  { num: 57, chapterId: 'ch10', title: 'Last Stone Weight', difficulty: 'Easy', slug: 'last-stone-weight' },
  { num: 58, chapterId: 'ch10', title: 'K Closest Points to Origin', difficulty: 'Medium', slug: 'k-closest-points-to-origin' },

  // Chapter 11 (#59–#63)
  { num: 59, chapterId: 'ch11', title: 'Find if Path Exists in Graph', difficulty: 'Easy', slug: 'find-if-path-exists-in-graph' },
  { num: 60, chapterId: 'ch11', title: 'Number of Islands', difficulty: 'Medium', slug: 'number-of-islands' },
  { num: 61, chapterId: 'ch11', title: 'Max Area of Island', difficulty: 'Medium', slug: 'max-area-of-island' },
  { num: 62, chapterId: 'ch11', title: 'Number of Provinces', difficulty: 'Medium', slug: 'number-of-provinces' },
  { num: 63, chapterId: 'ch11', title: 'Rotting Oranges', difficulty: 'Medium', slug: 'rotting-oranges' },

  // Chapter 12 (#64–#68)
  {
    num: 64,
    chapterId: 'ch12',
    title: 'Climbing Stairs (DP Tabulation & Space Optimization)',
    difficulty: 'Easy',
    slug: 'climbing-stairs',
    isReview: true,
    reviewNote: 'Ôn tập có chủ đích: chuyển từ đệ quy ở Ch.08 sang DP O(n) và tối ưu bộ nhớ O(1).',
  },
  { num: 65, chapterId: 'ch12', title: 'Min Cost Climbing Stairs', difficulty: 'Easy', slug: 'min-cost-climbing-stairs' },
  { num: 66, chapterId: 'ch12', title: 'House Robber', difficulty: 'Medium', slug: 'house-robber' },
  { num: 67, chapterId: 'ch12', title: 'Coin Change', difficulty: 'Medium', slug: 'coin-change' },
  { num: 68, chapterId: 'ch12', title: 'Longest Common Subsequence', difficulty: 'Medium', slug: 'longest-common-subsequence' },

  // Chapter 13 (#69–#73)
  { num: 69, chapterId: 'ch13', title: 'Maximum Subarray', difficulty: 'Medium', slug: 'maximum-subarray' },
  { num: 70, chapterId: 'ch13', title: 'Can Place Flowers', difficulty: 'Easy', slug: 'can-place-flowers' },
  { num: 71, chapterId: 'ch13', title: 'Merge Intervals', difficulty: 'Medium', slug: 'merge-intervals' },
  { num: 72, chapterId: 'ch13', title: 'Non-overlapping Intervals', difficulty: 'Medium', slug: 'non-overlapping-intervals' },
  { num: 73, chapterId: 'ch13', title: 'Jump Game', difficulty: 'Medium', slug: 'jump-game' },

  // Chapter 14 (#74–#77)
  { num: 74, chapterId: 'ch14', title: 'Single Number', difficulty: 'Easy', slug: 'single-number' },
  { num: 75, chapterId: 'ch14', title: 'Number of 1 Bits', difficulty: 'Easy', slug: 'number-of-1-bits' },
  { num: 76, chapterId: 'ch14', title: 'Counting Bits', difficulty: 'Easy', slug: 'counting-bits' },
  { num: 77, chapterId: 'ch14', title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', slug: 'implement-trie-prefix-tree' },

  // Chapter 15 (#78–#100)
  { num: 78, chapterId: 'ch15', title: 'Container With Most Water', difficulty: 'Medium', slug: 'container-with-most-water' },
  { num: 79, chapterId: 'ch15', title: '3Sum', difficulty: 'Medium', slug: '3sum' },
  { num: 80, chapterId: 'ch15', title: 'Longest Consecutive Sequence', difficulty: 'Medium', slug: 'longest-consecutive-sequence' },
  { num: 81, chapterId: 'ch15', title: 'Course Schedule', difficulty: 'Medium', slug: 'course-schedule' },
  { num: 82, chapterId: 'ch15', title: 'Binary Tree Right Side View', difficulty: 'Medium', slug: 'binary-tree-right-side-view' },
  { num: 83, chapterId: 'ch15', title: 'Search Suggestions System', difficulty: 'Medium', slug: 'search-suggestions-system' },
  { num: 84, chapterId: 'ch15', title: 'Decode String', difficulty: 'Medium', slug: 'decode-string' },
  { num: 85, chapterId: 'ch15', title: 'Asteroid Collision', difficulty: 'Medium', slug: 'asteroid-collision' },
  { num: 86, chapterId: 'ch15', title: 'Combination Sum III', difficulty: 'Medium', slug: 'combination-sum-iii' },
  { num: 87, chapterId: 'ch15', title: 'Unique Paths', difficulty: 'Medium', slug: 'unique-paths' },
  { num: 88, chapterId: 'ch15', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'Medium', slug: 'best-time-to-buy-and-sell-stock-with-cooldown' },
  { num: 89, chapterId: 'ch15', title: 'Find Peak Element', difficulty: 'Medium', slug: 'find-peak-element' },
  { num: 90, chapterId: 'ch15', title: 'Longest Palindromic Substring', difficulty: 'Medium', slug: 'longest-palindromic-substring' },
  { num: 91, chapterId: 'ch15', title: 'Add Two Numbers', difficulty: 'Medium', slug: 'add-two-numbers' },
  { num: 92, chapterId: 'ch15', title: 'Sort Colors', difficulty: 'Medium', slug: 'sort-colors' },
  { num: 93, chapterId: 'ch15', title: 'Rotate Array', difficulty: 'Medium', slug: 'rotate-array' },
  { num: 94, chapterId: 'ch15', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', slug: 'find-minimum-in-rotated-sorted-array' },
  { num: 95, chapterId: 'ch15', title: 'Kth Smallest Element in a BST', difficulty: 'Medium', slug: 'kth-smallest-element-in-a-bst' },
  { num: 96, chapterId: 'ch15', title: 'Word Search', difficulty: 'Medium', slug: 'word-search' },
  {
    num: 97,
    chapterId: 'ch15',
    title: 'Product of Array Except Self (Mock Interview Re-solve)',
    difficulty: 'Medium',
    slug: 'product-of-array-except-self',
    isReview: true,
    reviewNote: 'Ôn tập có chủ đích: tự giải không nhìn code cũ với O(1) extra space.',
  },
  { num: 98, chapterId: 'ch15', title: 'Permutation in String', difficulty: 'Medium', slug: 'permutation-in-string' },
  {
    num: 99,
    chapterId: 'ch15',
    title: 'Daily Temperatures (Mock Interview Re-solve)',
    difficulty: 'Medium',
    slug: 'daily-temperatures',
    isReview: true,
    reviewNote: 'Ôn tập có chủ đích: tự dựng Monotonic Stack bằng ArrayDeque trong dưới 15 phút.',
  },
  { num: 100, chapterId: 'ch15', title: 'LRU Cache', difficulty: 'Medium', slug: 'lru-cache' },
];
