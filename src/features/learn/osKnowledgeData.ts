export type OsLearningStatus = 'not_started' | 'learning' | 'completed';
export type OsUnderstandingLevel = 'surface' | 'solid' | 'deep';

export interface OsComparisonRow {
  criterion: string;
  items: string[];
}

export interface OsComparisonTable {
  id: string;
  title: string;
  columns: string[];
  rows: OsComparisonRow[];
}

export interface OsInterviewQA {
  question: string;
  answer: string;
}

export interface OsExerciseItem {
  id: string;
  prompt: string;
  solutionHint: string;
  done: boolean;
}

export interface OsDiagramBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  accent?: string;
}

export interface OsDiagramArrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
}

export interface OsTopicDiagram {
  title: string;
  boxes: OsDiagramBox[];
  arrows: OsDiagramArrow[];
}

export interface OsTopic {
  id: string;
  moduleId: string;
  code: string; // e.g. '07.04'
  title: string;
  subtitle: string;
  status: OsLearningStatus;
  understanding: OsUnderstandingLevel;
  bookmarked: boolean;
  weakFlag: boolean;
  tags: string[];
  relatedTopicIds: string[];
  updatedAt: number;
  lastReviewedAt?: number;

  // 14 Structured Components
  overview: string;
  coreConcepts: string[];
  definitions: { term: string; meaning: string }[];
  detailedTheory: string; // Supports Markdown, Code blocks, Tables, Math notation
  howItWorks: string[];
  diagram: OsTopicDiagram;
  diagramNotes: string;
  algorithms: { name: string; summary: string; complexity?: string }[];
  codeExample: { language: string; title: string; code: string };
  comparisons: { aspect: string; optionA: string; optionB: string }[];
  realWorldApplications: string[];
  commonMistakes: string[];
  interviewQuestions: OsInterviewQA[];
  exercises: OsExerciseItem[];
  references: { label: string; source: string; url?: string }[];
}

export interface OsModuleMeta {
  id: string;
  code: string; // '01'..'12'
  title: string;
  description: string;
  accent: string;
}

export interface OsFlashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  confidence: 'learning' | 'mastered';
  createdAt: number;
}

export interface OsResearchNote {
  id: string;
  topicId?: string;
  title: string;
  question: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface OsRevisionEntry {
  id: string;
  topicId: string;
  dateStr: string;
  timestamp: number;
  note: string;
  statusAfter: OsLearningStatus;
}

export interface OsKnowledgeBaseState {
  activeTab:
    | 'dashboard'
    | 'curriculum'
    | 'graph'
    | 'comparisons'
    | 'flashcards'
    | 'notes'
    | 'revisions';
  activeModuleId: string;
  activeTopicId: string;
  topics: OsTopic[];
  flashcards: OsFlashcard[];
  researchNotes: OsResearchNote[];
  revisionLogs: OsRevisionEntry[];
}

export const OS_TEXTBOOKS = [
  {
    id: 'book_ostep',
    title: 'Operating Systems: Three Easy Pieces (OSTEP)',
    authors: 'Remzi H. & Andrea C. Arpaci-Dusseau',
    role: 'Free online textbook',
    url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    note: 'Xuất sắc cho Virtualization (CPU, Memory), Concurrency và Persistence.',
  },
  {
    id: 'book_dino',
    title: 'Operating System Concepts (10th Edition)',
    authors: 'Silberschatz, Galvin & Gagne',
    role: 'Core textbook',
    url: 'https://www.os-book.com/',
    note: 'Giáo trình kinh điển phủ toàn diện từ Process, Synchronization đến Storage & Security.',
  },
  {
    id: 'book_tanenbaum',
    title: 'Modern Operating Systems (5th Edition)',
    authors: 'Andrew S. Tanenbaum & Herbert Bos',
    role: 'Advanced reference',
    url: 'https://csc-knu.github.io/sys-prog/books/Andrew%20S.%20Tanenbaum%20-%20Modern%20Operating%20Systems.pdf',
    note: 'Đi sâu vào thiết kế nhân, kiến trúc thực tế UNIX/Linux/Windows và hệ phân tán.',
  },
];

export const OS_MODULES: OsModuleMeta[] = [
  {
    id: 'os_m01',
    code: '01',
    title: 'Introduction to Operating Systems',
    description: 'Khái niệm OS, vai trò, chức năng, lịch sử, phân loại hệ điều hành.',
    accent: '#EDEAE2',
  },
  {
    id: 'os_m02',
    code: '02',
    title: 'OS Architecture',
    description: 'Kernel, User Mode, Kernel Mode, System Calls, Monolithic, Microkernel, Hybrid Kernel.',
    accent: '#B99B79',
  },
  {
    id: 'os_m03',
    code: '03',
    title: 'Process Management',
    description: 'Process, Process States, PCB, Context Switching, Process Scheduling.',
    accent: '#A7B6D2',
  },
  {
    id: 'os_m04',
    code: '04',
    title: 'Threads & Concurrency',
    description: 'Threads, Multithreading, Multicore, Race Conditions, Critical Sections.',
    accent: '#9BAA98',
  },
  {
    id: 'os_m05',
    code: '05',
    title: 'CPU Scheduling',
    description: 'FCFS, SJF, SRTF, Priority Scheduling, Round Robin, Multilevel Queue.',
    accent: '#B99B79',
  },
  {
    id: 'os_m06',
    code: '06',
    title: 'Process Synchronization',
    description: 'Mutex, Semaphore, Monitor, Locks, Deadlock, Starvation.',
    accent: '#A7B6D2',
  },
  {
    id: 'os_m07',
    code: '07',
    title: 'Memory Management',
    description: 'Memory Allocation, Paging, Segmentation, Virtual Memory, Page Replacement.',
    accent: '#9BAA98',
  },
  {
    id: 'os_m08',
    code: '08',
    title: 'File Systems',
    description: 'Files, Directories, Inodes, File Allocation, Permissions, Journaling.',
    accent: '#EDEAE2',
  },
  {
    id: 'os_m09',
    code: '09',
    title: 'I/O & Device Management',
    description: 'Device Drivers, Interrupts, DMA, Buffering, Caching, Disk Scheduling.',
    accent: '#B99B79',
  },
  {
    id: 'os_m10',
    code: '10',
    title: 'Storage Management',
    description: 'HDD, SSD, Disk Structure, RAID, Storage Allocation.',
    accent: '#A7B6D2',
  },
  {
    id: 'os_m11',
    code: '11',
    title: 'Security & Protection',
    description: 'Authentication, Authorization, Access Control, Isolation, Privilege Levels.',
    accent: '#C98A82',
  },
  {
    id: 'os_m12',
    code: '12',
    title: 'Distributed & Virtualized Systems',
    description: 'Virtual Machines, Hypervisors, Containers, Distributed OS concepts.',
    accent: '#9BAA98',
  },
];

export const OS_COMPARISON_MATRICES: OsComparisonTable[] = [
  {
    id: 'cmp_proc_thread',
    title: 'Process vs Thread vs Coroutine',
    columns: ['Process', 'Kernel Thread', 'User/Green Thread'],
    rows: [
      { criterion: 'Address Space', items: ['Riêng biệt hoàn toàn', 'Chia sẻ Heap/Global cùng Process', 'Chia sẻ Heap cùng Process'] },
      { criterion: 'Context Switch Cost', items: ['Cao (đổi Page Table, flush TLB)', 'Trung bình (lưu/khôi phục registers qua Kernel)', 'Rất thấp (User space stack swap)'] },
      { criterion: 'Fault Isolation', items: ['Crash 1 process không ảnh hưởng process khác', 'Crash 1 thread có thể kéo sập cả process', 'Lỗi ở 1 coroutine cần xử lý cẩn thận'] },
      { criterion: 'IPC / Communication', items: ['Pipe, Socket, Shared Memory, Message Queue', 'Biến chung + Mutex/Condition Var', 'Channel / Async queue'] },
    ],
  },
  {
    id: 'cmp_sched',
    title: 'CPU Scheduling Algorithms',
    columns: ['FCFS', 'SJF / SRTF', 'Round Robin (RR)', 'MLFQ'],
    rows: [
      { criterion: 'Preemptive?', items: ['Không', 'SJF: Không · SRTF: Có', 'Có (theo Time Quantum q)', 'Có (đa hàng đợi ưu tiên)'] },
      { criterion: 'Average Waiting Time', items: ['Có thể rất tệ (Convoy Effect)', 'Tối ưu về mặt lý thuyết', 'Trung bình (phụ thuộc q)', 'Cân bằng tốt Response & Throughput'] },
      { criterion: 'Starvation Risk', items: ['Không', 'Có (tiến trình dài bị bỏ đói)', 'Không', 'Không nếu có Priority Boost định kỳ'] },
      { criterion: 'Use Case', items: ['Batch queue đơn giản', 'Mô hình ước lượng thời gian CPU burst', 'Time-sharing / Interactive OS', 'Linux/Windows General-purpose OS'] },
    ],
  },
  {
    id: 'cmp_sync',
    title: 'Synchronization Primitives',
    columns: ['Mutex', 'Binary Semaphore', 'Counting Semaphore', 'Monitor'],
    rows: [
      { criterion: 'Ownership', items: ['Có (thread khóa phải tự mở)', 'Không có ownership cứng', 'Không', 'Tự động đóng gói trong đối tượng'] },
      { criterion: 'Primary Purpose', items: ['Mutual Exclusion', 'Signaling / Mutual Exclusion', 'Quản lý N tài nguyên hữu hạn', 'Đồng bộ cấu trúc cấp cao + Condition Var'] },
      { criterion: 'Deadlock Risk', items: ['Cao nếu lock ordering sai', 'Cao nếu wait/signal lệch', 'Trung bình', 'Thấp hơn nhờ cấu trúc OOP'] },
    ],
  },
  {
    id: 'cmp_mem',
    title: 'Paging vs Segmentation vs Virtual Memory',
    columns: ['Paging', 'Segmentation', 'Virtual Memory (Demand Paging)'],
    rows: [
      { criterion: 'Unit Size', items: ['Kích thước cố định (Page / Frame, vd 4 KB)', 'Kích thước biến đổi theo logic (Code, Stack, Heap)', 'Kết hợp Page Table + Swap / Backing Store'] },
      { criterion: 'Fragmentation', items: ['Không có External · Có Internal nhỏ', 'Có External Fragmentation', 'Giảm tải RAM nhờ nạp trang theo yêu cầu'] },
      { criterion: 'Hardware Support', items: ['MMU + TLB', 'Segment Descriptor Table', 'MMU + Page Fault Handler + Dirty/Present bits'] },
    ],
  },
  {
    id: 'cmp_virt',
    title: 'Virtual Machine (Hypervisor) vs Container',
    columns: ['Virtual Machine (VM)', 'Container (Docker / OCI)'],
    rows: [
      { criterion: 'Abstraction Layer', items: ['Ảo hóa phần cứng (CPU, RAM, NIC giả lập)', 'Ảo hóa ở mức OS (Linux Namespaces + cgroups)'] },
      { criterion: 'Kernel', items: ['Mỗi VM chạy một Guest OS Kernel riêng', 'Chia sẻ chung Host OS Kernel'] },
      { criterion: 'Startup & Overhead', items: ['Giây đến phút · Tốn RAM cho Guest OS', 'Mili-giây · Overhead cực thấp'] },
      { criterion: 'Isolation Boundary', items: ['Rất mạnh (Hardware VT-x/AMD-V)', 'Mức process/kernel namespace (yếu hơn VM nếu kernel bug)'] },
    ],
  },
];

interface TopicSeed {
  id: string;
  moduleId: string;
  code: string;
  title: string;
  subtitle: string;
  tags: string[];
  relatedTopicIds: string[];
  overview: string;
  coreConcepts: string[];
  definitions: { term: string; meaning: string }[];
  detailedTheory: string;
  howItWorks: string[];
  diagram: OsTopicDiagram;
  algorithms: { name: string; summary: string; complexity?: string }[];
  codeExample: { language: string; title: string; code: string };
  comparisons: { aspect: string; optionA: string; optionB: string }[];
  realWorldApplications: string[];
  commonMistakes: string[];
  interviewQuestions: OsInterviewQA[];
  exercises: { id: string; prompt: string; solutionHint: string }[];
  refs?: { label: string; source: string; url?: string }[];
}

function makeTopic(seed: TopicSeed): OsTopic {
  return {
    id: seed.id,
    moduleId: seed.moduleId,
    code: seed.code,
    title: seed.title,
    subtitle: seed.subtitle,
    status: 'not_started',
    understanding: 'surface',
    bookmarked: false,
    weakFlag: false,
    tags: seed.tags,
    relatedTopicIds: seed.relatedTopicIds,
    updatedAt: Date.now() - 86400000,
    overview: seed.overview,
    coreConcepts: seed.coreConcepts,
    definitions: seed.definitions,
    detailedTheory: seed.detailedTheory,
    howItWorks: seed.howItWorks,
    diagram: seed.diagram,
    diagramNotes:
      'Sơ đồ mô tả luồng dữ liệu, biên giới đặc quyền (privilege boundary) và thành phần điều phối liên quan.',
    algorithms: seed.algorithms,
    codeExample: seed.codeExample,
    comparisons: seed.comparisons,
    realWorldApplications: seed.realWorldApplications,
    commonMistakes: seed.commonMistakes,
    interviewQuestions: seed.interviewQuestions,
    exercises: seed.exercises.map((ex) => ({ ...ex, done: false })),
    references: seed.refs || [
      {
        label: 'Operating Systems: Three Easy Pieces (OSTEP)',
        source: 'Arpaci-Dusseau',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
      },
      {
        label: 'Operating System Concepts (10th Ed.)',
        source: 'Silberschatz, Galvin & Gagne',
      },
    ],
  };
}

function defaultDiagram(title: string, a: string, b: string, c: string): OsTopicDiagram {
  return {
    title,
    boxes: [
      { id: 'b1', x: 30, y: 55, w: 175, h: 68, label: a, sub: 'Trigger / Input', accent: '#A7B6D2' },
      { id: 'b2', x: 255, y: 55, w: 195, h: 68, label: b, sub: 'Core OS Mechanism', accent: '#B99B79' },
      { id: 'b3', x: 500, y: 55, w: 175, h: 68, label: c, sub: 'Hardware / State', accent: '#9BAA98' },
    ],
    arrows: [
      { fromX: 205, fromY: 89, toX: 255, toY: 89, label: 'invoke' },
      { fromX: 450, fromY: 89, toX: 500, toY: 89, label: 'manage' },
    ],
  };
}

const RAW_TOPIC_SEEDS: TopicSeed[] = [
  // =========================================================================
  // MODULE 01: INTRODUCTION TO OPERATING SYSTEMS
  // =========================================================================
  {
    id: 'os_01_01',
    moduleId: 'os_m01',
    code: '01.01',
    title: 'OS Concepts & Three Easy Pieces',
    subtitle: 'Virtualization, Concurrency và Persistence — 3 trụ cột cốt lõi của mọi hệ điều hành.',
    tags: ['Fundamentals', 'Virtualization', 'Resource Manager'],
    relatedTopicIds: ['os_02_02', 'os_03_01', 'os_07_04', 'os_08_01'],
    overview:
      'Hệ điều hành (Operating System) là lớp phần mềm hệ thống đứng giữa ứng dụng người dùng và phần cứng vật lý, biến phần cứng rời rạc thành giao diện trừu tượng sạch sẽ và an toàn.',
    coreConcepts: [
      'Resource Manager (Điều phối CPU, RAM, I/O công bằng)',
      'Extended Machine / Abstraction (Biến thanh ghi thô thành Process, Virtual Memory, File)',
      'Virtualization (Ảo hóa CPU & RAM khiến mỗi app tưởng mình sở hữu toàn bộ máy)',
      'Concurrency & Persistence (Điều phối song song an toàn và lưu dữ liệu bền vững)',
    ],
    definitions: [
      { term: 'Virtualization', meaning: 'Kỹ thuật OS lấy 1 tài nguyên vật lý (CPU/RAM) biến thành nhiều bản sao ảo độc lập cho từng tiến trình.' },
      { term: 'Policy vs Mechanism', meaning: 'Mechanism trả lời "làm thế nào" (vd: context switch); Policy trả lời "chọn ai/khi nào" (vd: thuật toán scheduling).' },
    ],
    detailedTheory: `### Tại sao cần tách Policy và Mechanism?\nThiết kế OS tốt tách rời:\n- **Mechanism**: cơ chế kỹ thuật cấp thấp (vd: chuyển đổi ngữ cảnh CPU hoặc tra bảng phân trang).\n- **Policy**: chiến lược ra quyết định cấp cao (vd: ưu tiên tiến trình tương tác thay vì batch).\n\n### Ba trụ cột theo OSTEP\n1. **Virtualization**: CPU Scheduling + Virtual Memory.\n2. **Concurrency**: Threads, Locks, Semaphores, Deadlock.\n3. **Persistence**: Disk I/O, File Systems, Journaling.`,
    howItWorks: [
      'Phần cứng khởi động BIOS/UEFI và nạp Bootloader.',
      'Bootloader nạp OS Kernel vào RAM và trao quyền điều khiển.',
      'Kernel khởi tạo bảng quản lý tiến trình, bộ nhớ ảo và các trình điều khiển thiết bị.',
      'OS khởi chạy tiến trình đầu tiên ở User Space (vd: PID 1 / systemd) và lắng nghe System Calls.',
    ],
    diagram: defaultDiagram('OS Layering', 'User Applications', 'OS Kernel (Syscalls)', 'CPU · RAM · Disk'),
    algorithms: [{ name: 'Trap & Dispatch Loop', summary: 'Cơ chế Kernel nhận ngắt/trap, điều phối công việc và trả quyền về User Mode.', complexity: 'O(1) dispatch' }],
    codeExample: {
      language: 'c',
      title: 'Ví dụ 3 trụ cột trên POSIX (fork, malloc, open)',
      code: `#include <stdio.h>\n#include <stdlib.h>\n#include <unistd.h>\n#include <fcntl.h>\n\nint main() {\n  // 1. Virtualization (RAM): địa chỉ ảo trả về bởi OS\n  int *x = malloc(sizeof(int));\n  *x = 42;\n  // 2. Virtualization (CPU): tạo tiến trình con độc lập\n  if (fork() == 0) printf("Child PID=%d, x=%d\\n", getpid(), *x);\n  // 3. Persistence: ghi bền vững qua File System\n  int fd = open("note.txt", O_CREAT | O_WRONLY, 0644);\n  write(fd, "OS\\n", 3);\n  close(fd);\n  return 0;\n}`,
    },
    comparisons: [
      { aspect: 'Mục tiêu chính', optionA: 'Resource Manager: chia sẻ tài nguyên công bằng', optionB: 'Abstraction: che giấu độ phức tạp phần cứng' },
    ],
    realWorldApplications: ['Linux Kernel quản lý server cloud & Android', 'JVM/Docker dựa trực tiếp vào syscall ảo hóa của OS'],
    commonMistakes: ['Nhầm lẫn OS với toàn bộ ứng dụng GUI/Shell đi kèm (Shell chỉ là chương trình chạy ở User Space).'],
    interviewQuestions: [
      { question: 'Phân biệt Mechanism và Policy trong thiết kế OS?', answer: 'Mechanism là cơ chế thực thi (vd: cách context switch thanh ghi), còn Policy là thuật toán ra quyết định (vd: Round Robin hay Priority Scheduling).' },
    ],
    exercises: [
      { id: 'ex_0101_1', prompt: 'Chạy 2 tiến trình in cùng địa chỉ con trỏ từ malloc() và giải thích vì sao địa chỉ giống nhau nhưng giá trị không đè lên nhau.', solutionHint: 'Mỗi tiến trình có không gian địa chỉ ảo (Virtual Address Space) riêng ánh xạ sang physical frame khác nhau.' },
    ],
  },
  {
    id: 'os_01_02',
    moduleId: 'os_m01',
    code: '01.02',
    title: 'Roles & Functions of OS',
    subtitle: '5 chức năng xương sống: Process, Memory, Storage, I/O và Security.',
    tags: ['Architecture', 'Resource Control'],
    relatedTopicIds: ['os_01_01', 'os_03_01', 'os_07_01', 'os_11_01'],
    overview: 'Hệ điều hành điều phối 5 nhóm tài nguyên chính của máy tính để nhiều chương trình cùng chạy mà không giẫm đạp lên nhau.',
    coreConcepts: ['Process & CPU Allocation', 'Main Memory Management', 'File & Storage Abstraction', 'Device I/O Multiplexing', 'Protection & Accounting'],
    definitions: [{ term: 'Multiplexing', meaning: 'Chia sẻ một tài nguyên vật lý cho nhiều đối tượng theo thời gian (time-multiplexing như CPU) hoặc không gian (space-multiplexing như RAM/Disk).' }],
    detailedTheory: `### Time-multiplexing vs Space-multiplexing\n- **CPU** được chia sẻ theo *thời gian*: mỗi tiến trình dùng một lát cắt thời gian (time slice).\n- **RAM và Ổ cứng** được chia sẻ theo *không gian*: mỗi tiến trình nhận các khung trang hoặc khối dữ liệu tách biệt.`,
    howItWorks: ['Nhận yêu cầu qua System Call.', 'Kiểm tra quyền truy cập.', 'Cấp phát hoặc xếp hàng chờ tài nguyên.', 'Thu hồi tài nguyên khi tiến trình kết thúc.'],
    diagram: defaultDiagram('5 Core OS Functions', 'Syscall Interface', 'Proc · Mem · FS · I/O', 'Protection Ring 0'),
    algorithms: [{ name: 'Resource Accounting', summary: 'Theo dõi CPU time, RSS memory, I/O bytes theo từng PID.', complexity: 'O(1) per tick' }],
    codeExample: { language: 'bash', title: 'Quan sát tài nguyên OS đang quản lý trên Linux', code: `ps -eo pid,comm,%cpu,%mem --sort=-%mem | head -n 8\nvmstat 1 3` },
    comparisons: [{ aspect: 'Chia sẻ tài nguyên', optionA: 'Time-multiplexing (CPU, Bus)', optionB: 'Space-multiplexing (RAM, SSD)' }],
    realWorldApplications: ['Container resource limits (cgroups) thực chất giới hạn chính các chức năng cấp phát CPU/RAM của OS.'],
    commonMistakes: ['Nghĩ OS chỉ chạy khi người dùng mở ứng dụng, thực tế timer interrupt đánh thức OS liên tục mỗi vài mili-giây.'],
    interviewQuestions: [{ question: 'OS chia sẻ CPU và RAM bằng cơ chế gì?', answer: 'CPU dùng Time-multiplexing (scheduling + context switch), RAM dùng Space-multiplexing (paging/virtual memory).' }],
    exercises: [{ id: 'ex_0102_1', prompt: 'Liệt kê 4 loại tài nguyên mà lệnh top/htop hiển thị và gán chúng vào 5 chức năng của OS.', solutionHint: 'CPU % -> Scheduling, RES/VIRT -> Memory, I/O wait -> I/O, UID -> Security.' }],
  },
  {
    id: 'os_01_03',
    moduleId: 'os_m01',
    code: '01.03',
    title: 'History & Evolution of OS',
    subtitle: 'Từ Batch Processing, Spooling, Multiprogramming đến Time-Sharing và Cloud OS.',
    tags: ['History', 'Time-Sharing', 'Multiprogramming'],
    relatedTopicIds: ['os_01_01', 'os_05_01', 'os_09_04'],
    overview: 'Lịch sử OS là hành trình tối ưu hóa hiệu suất sử dụng CPU và trải nghiệm phản hồi thời gian thực cho con người.',
    coreConcepts: ['Single-stream Batch', 'Multiprogramming (giữ nhiều job trong RAM)', 'Time-Sharing (CTSS, UNIX)', 'Personal, Mobile & Distributed Systems'],
    definitions: [{ term: 'Multiprogramming', meaning: 'Khi job A đang chờ I/O chậm chạp, OS chuyển CPU sang chạy job B để CPU không bị nhàn rỗi.' }],
    detailedTheory: `### Tiến hóa cốt lõi\n| Thế hệ | Vấn đề giải quyết | Bước nhảy vọt |\n|---|---|---|\n| Batch Systems | Giảm thời gian gá băng thủ công | Chạy hàng loạt tự động |\n| Multiprogramming | CPU nhàn rỗi khi đợi Disk/I/O | Đổi sang tiến trình khác khi block |\n| Time-Sharing | Người dùng phải đợi hết batch mới có kết quả | Chuyển đổi cực nhanh (vài ms) tạo ảo giác đồng thời |`,
    howItWorks: ['Batch xếp hàng tuần tự.', 'Multiprogramming thêm interrupt khi I/O xong.', 'Time-Sharing thêm timer interrupt định kỳ để preempt CPU.'],
    diagram: defaultDiagram('Evolution Path', 'Batch Sequential', 'Multiprogramming', 'Time-Sharing / Cloud'),
    algorithms: [{ name: 'Timer Preemption', summary: 'Ngắt phần cứng định kỳ ngăn 1 tiến trình chiếm CPU vô hạn.', complexity: 'Fixed quantum' }],
    codeExample: { language: 'text', title: 'Hiệu suất CPU với độ đa chương (Multiprogramming)', code: `CPU Utilization ≈ 1 - p^n\n(p = tỉ lệ thời gian tiến trình đợi I/O, n = số tiến trình trong RAM)\nVí dụ p = 0.8, n = 1 -> CPU dùng 20%\nNếu n = 10 -> CPU Utilization = 1 - 0.8^10 ≈ 89.3%` },
    comparisons: [{ aspect: 'Mục tiêu tối ưu', optionA: 'Multiprogramming: tối đa hóa CPU Utilization', optionB: 'Time-Sharing: tối thiểu hóa Response Time' }],
    realWorldApplications: ['Node.js/Nginx event loop áp dụng lại triết lý không để CPU rảnh khi đợi I/O mạng.'],
    commonMistakes: ['Đồng nhất Multiprogramming với Multiprocessing (Multiprogramming chỉ cần 1 nhân CPU).'],
    interviewQuestions: [{ question: 'Sự khác biệt cốt lõi giữa Multiprogramming và Time-Sharing là gì?', answer: 'Multiprogramming chỉ chuyển CPU khi tiến trình tự block vì I/O nhằm tăng throughput; Time-Sharing chủ động ngắt bằng timer mỗi vài ms để mọi user thấy phản hồi tức thì.' }],
    exercises: [{ id: 'ex_0103_1', prompt: 'Tính hiệu suất CPU nếu mỗi tiến trình đợi I/O 70% thời gian và chạy song song 4 tiến trình.', solutionHint: '1 - 0.7^4 = 1 - 0.2401 = 75.99%.' }],
  },
  {
    id: 'os_01_04',
    moduleId: 'os_m01',
    code: '01.04',
    title: 'Classification of Operating Systems',
    subtitle: 'Phân loại: Batch, Interactive, Real-Time (RTOS), Embedded và Distributed OS.',
    tags: ['RTOS', 'Embedded', 'Distributed'],
    relatedTopicIds: ['os_05_03', 'os_12_04'],
    overview: 'Không có một OS duy nhất hoàn hảo cho mọi bài toán; lựa chọn OS phụ thuộc vào ràng buộc thời gian, năng lượng và độ tin cậy.',
    coreConcepts: ['General-Purpose OS (Linux, Windows, macOS)', 'Hard vs Soft Real-Time OS (FreeRTOS, QNX)', 'Mobile & Embedded OS', 'Cluster / Cloud OS'],
    definitions: [{ term: 'Hard Real-Time OS', meaning: 'Hệ điều hành cam kết đáp ứng deadline tuyệt đối — trễ deadline đồng nghĩa hệ thống thất bại (vd: túi khí ô tô, y tế).' }],
    detailedTheory: `### Hard RTOS vs Soft RTOS\n- **Hard RTOS**: Độ trễ ngắt và scheduling phải có cận trên xác định (deterministic). Không chấp nhận garbage collection bất định.\n- **Soft RTOS**: Ưu tiên tác vụ quan trọng (vd: phát âm thanh/video) nhưng thỉnh thoảng trễ nhẹ vẫn chấp nhận được.`,
    howItWorks: ['Xác định SLA của phần cứng/ứng dụng.', 'Chọn scheduler phù hợp (EDF / Rate Monotonic cho RTOS, CFS/EEVDF cho Linux).', 'Thiết kế dấu chân bộ nhớ tương ứng.'],
    diagram: defaultDiagram('OS Spectrum', 'Hard RTOS (µs bound)', 'General OS (Throughput)', 'Distributed OS (Cluster)'),
    algorithms: [{ name: 'Rate Monotonic Scheduling', summary: 'Gán độ ưu tiên tĩnh tỉ lệ nghịch với chu kỳ của tác vụ định kỳ trong RTOS.', complexity: 'O(n) schedulability test' }],
    codeExample: { language: 'text', title: 'Điều kiện lập lịch Rate Monotonic (Liu & Layland)', code: `Tổng (Ci / Ti) <= n * (2^(1/n) - 1)\nKhi n -> vô cực, cận đủ ≈ 69.3% CPU utilization.` },
    comparisons: [{ aspect: 'Cam kết thời gian', optionA: 'Hard RTOS: Deterministic deadline', optionB: 'General OS: Best-effort throughput & fairness' }],
    realWorldApplications: ['QNX/VxWorks trong xe tự hành & hàng không', 'Linux PREEMPT_RT cho hệ thống giao dịch tần suất cao'],
    commonMistakes: ['Nghĩ RTOS có nghĩa là "chạy nhanh nhất có thể" — thực ra RTOS nghĩa là "có thể dự đoán chính xác thời điểm hoàn thành".'],
    interviewQuestions: [{ question: 'Tại sao Linux mặc định không phải Hard RTOS?', answer: 'Vì các cơ chế như paging, page cache, non-preemptible kernel paths và CFS tạo ra độ trễ đuôi (tail latency) khó đảm bảo cận trên cứng.' }],
    exercises: [{ id: 'ex_0104_1', prompt: 'Phân loại: Hệ thống phanh ABS ô tô và Máy chủ web Nginx cần loại OS nào?', solutionHint: 'ABS cần Hard RTOS; Nginx chạy trên General-Purpose OS (Linux).' }],
  },
  {
    id: 'os_01_05',
    moduleId: 'os_m01',
    code: '01.05',
    title: 'Boot Process & Dual-Mode Foundation',
    subtitle: 'Từ nút nguồn → BIOS/UEFI → Bootloader (GRUB) → Kernel Init → User Space.',
    tags: ['Booting', 'UEFI', 'Kernel Init'],
    relatedTopicIds: ['os_02_01', 'os_02_02', 'os_03_01'],
    overview: 'Hiểu quá trình khởi động giúp bóc tách ranh giới giữa Firmware phần cứng, OS Kernel và chương trình đầu tiên của người dùng.',
    coreConcepts: ['POST & BIOS/UEFI', 'MBR / GPT Partition & ESP', 'Bootloader (GRUB / systemd-boot)', 'initramfs & PID 1 (init/systemd)'],
    definitions: [{ term: 'initramfs', meaning: 'Hệ thống tệp tạm trong RAM chứa driver thiết yếu giúp Kernel mount được phân vùng root thật trên ổ cứng/NVMe.' }],
    detailedTheory: `### Chuỗi khởi động Linux hiện đại\n1. CPU bật và nhảy tới địa chỉ reset của UEFI Firmware.\n2. UEFI kiểm tra phần cứng (POST), đọc EFI System Partition và chạy Bootloader (GRUB).\n3. Bootloader nạp ảnh nén \`vmlinuz\` (Kernel) + \`initramfs\` vào RAM.\n4. Kernel giải nén, bật MMU/paging, khởi tạo driver, mount root FS và sinh ra **PID 1 (/sbin/init)** ở User Mode.`,
    howItWorks: ['Power-on reset CPU.', 'UEFI xác thực & nạp Bootloader.', 'Bootloader chuyển tham số nhân vào RAM.', 'Kernel chuyển sang Protected/Long Mode và chạy PID 1.'],
    diagram: defaultDiagram('Boot Sequence', 'UEFI Firmware', 'Bootloader -> vmlinuz', 'Kernel -> PID 1 (init)'),
    algorithms: [{ name: 'Chain Booting', summary: 'Mỗi tầng nạp, kiểm tra chữ ký (Secure Boot) và bàn giao quyền điều khiển cho tầng kế tiếp.', complexity: 'Sequential stages' }],
    codeExample: { language: 'bash', title: 'Kiểm tra thời gian boot Kernel vs Userspace trên Linux', code: `systemd-analyze\ndmesg | head -n 20` },
    comparisons: [{ aspect: 'Chuẩn khởi động', optionA: 'Legacy BIOS + MBR (tối đa 2TB, 16-bit real mode)', optionB: 'UEFI + GPT (hỗ trợ >2TB, Secure Boot, giao thức hiện đại)' }],
    realWorldApplications: ['Debug lỗi Kernel Panic không mount được ổ đĩa trong môi trường Cloud VM / Docker host.'],
    commonMistakes: ['Tưởng Bootloader là một phần của hệ điều hành — Bootloader chạy trước khi Kernel khởi động.'],
    interviewQuestions: [{ question: 'PID 1 trong hệ thống Unix/Linux là gì và tại sao nó đặc biệt?', answer: 'Là tiến trình đầu tiên khởi chạy ở User Space (init/systemd); nó nhận nuôi các tiến trình mồ côi (orphan processes) và nếu PID 1 chết, Kernel sẽ panic.' }],
    exercises: [{ id: 'ex_0105_1', prompt: 'Tìm hiểu vai trò của initramfs khi boot hệ thống dùng ổ đĩa mã hóa LUKS.', solutionHint: 'Kernel chưa đọc được phân vùng mã hóa nên cần initramfs hỏi passphrase và nạp dm-crypt trước khi mount root.' }],
  },

  // =========================================================================
  // MODULE 02: OS ARCHITECTURE
  // =========================================================================
  {
    id: 'os_02_01',
    moduleId: 'os_m02',
    code: '02.01',
    title: 'Kernel vs User Space',
    subtitle: 'Phân tách ranh giới phần mềm để ngăn một ứng dụng lỗi làm sập toàn hệ thống.',
    tags: ['Kernel', 'User Space', 'Memory Isolation'],
    relatedTopicIds: ['os_02_02', 'os_02_03', 'os_11_04', 'os_11_05'],
    overview: 'Toàn bộ không gian bộ nhớ và lệnh CPU được chia làm hai miền: Kernel Space (đặc quyền cao nhất) và User Space (bị cô lập).',
    coreConcepts: ['Kernel Space (Ring 0)', 'User Space (Ring 3)', 'Address Space Separation', 'Hardware Privilege Enforcement'],
    definitions: [{ term: 'Kernel', meaning: 'Phần lõi thường trực trong RAM của hệ điều hành, có toàn quyền truy cập phần cứng và thực thi lệnh đặc quyền.' }],
    detailedTheory: `### Tại sao không để mọi code chạy chung một miền?\nNếu trình duyệt web hoặc một app JavaScript bị lỗi con trỏ có thể ghi thẳng vào vùng nhớ của Driver mạng hoặc bảng tiến trình, cả máy sẽ treo hoặc mất an ninh.\nCPU phần cứng thực thi ranh giới này ở **mức thanh ghi trạng thái (Privilege Level)**. Ứng dụng ở User Space cố tình gọi lệnh đặc quyền (như \`HLT\` hoặc truy cập I/O port trực tiếp) sẽ bị CPU ném ngoại lệ **General Protection Fault / SIGSEGV**.`,
    howItWorks: [
      'MMU đánh dấu các trang bộ nhớ của Kernel bằng bit U/S = 0 (chỉ Supervisor đọc/ghi).',
      'Khi chạy code app thường, CPU đặt CPL = 3 (User Mode).',
      'Mọi truy cập trực tiếp địa chỉ Kernel từ Ring 3 bị MMU chặn ngay lập tức.',
    ],
    diagram: defaultDiagram('Privilege Boundary', 'User App (Ring 3)', 'MMU / Trap Gate', 'OS Kernel (Ring 0)'),
    algorithms: [{ name: 'Page-level U/S Bit Check', summary: 'Phần cứng MMU kiểm tra quyền User/Supervisor trên từng truy cập trang nhớ.', complexity: 'O(1) hardware gate' }],
    codeExample: { language: 'c', title: 'Truy cập sai vùng nhớ ở User Space gây SIGSEGV', code: `int *kernel_ptr = (int *)0xffffffff81000000;\n*kernel_ptr = 1; // Hardware trap -> OS gửi SIGSEGV giết tiến trình user` },
    comparisons: [{ aspect: 'Phạm vi lỗi', optionA: 'User Space Crash: Chỉ tiến trình đó bị kill', optionB: 'Kernel Space Bug: Kernel Panic / Blue Screen toàn máy' }],
    realWorldApplications: ['eBPF cho phép chạy code sandbox an toàn trong Kernel mà không lo crash nhân', 'DPDK đưa driver mạng lên User Space để bỏ qua overhead copy'],
    commonMistakes: ['Nghĩ User Space và Kernel Space nằm trên 2 thanh RAM vật lý khác nhau — cả hai dùng chung RAM vật lý nhưng tách biệt qua Virtual Address Space & Page Table permissions.'],
    interviewQuestions: [{ question: 'Điều gì xảy ra nếu một tiến trình User Mode tự ý đọc địa chỉ bộ nhớ của Kernel?', answer: 'MMU phát hiện bit đặc quyền không hợp lệ, kích hoạt Page Fault / Protection Fault bẫy về Kernel, và Kernel gửi tín hiệu SIGSEGV kết thúc tiến trình đó.' }],
    exercises: [{ id: 'ex_0201_1', prompt: 'Kiểm tra trên Linux tỉ lệ không gian địa chỉ ảo 64-bit dành cho User vs Kernel.', solutionHint: 'Thường 0x0000...–0x00007FFF... là User Space (128TB), phần nửa cao 0xFFFF8000... trở lên là Kernel Space.' }],
  },
  {
    id: 'os_02_02',
    moduleId: 'os_m02',
    code: '02.02',
    title: 'User Mode, Kernel Mode & Mode Switch',
    subtitle: 'Cơ chế chuyển đổi chế độ phần cứng (Mode Bit) khi có Interrupt, Exception hoặc Trap.',
    tags: ['Mode Switch', 'Ring 0', 'Interrupts'],
    relatedTopicIds: ['os_02_01', 'os_02_03', 'os_03_04', 'os_09_02'],
    overview: 'Mode Switch chuyển CPU giữa User Mode và Kernel Mode — nhẹ hơn Context Switch nhưng vẫn làm mất hàng trăm chu kỳ CPU và có thể làm nguội CPU Cache.',
    coreConcepts: ['Mode Bit (0 = Kernel, 1 = User)', 'Trap (Synchronous Software Interrupt)', 'Hardware Interrupt (Asynchronous)', 'Kernel Stack per Thread'],
    definitions: [{ term: 'Mode Switch vs Context Switch', meaning: 'Mode Switch chỉ đổi đặc quyền trên CÙNG một luồng thực thi; Context Switch đổi từ Process/Thread này sang Process/Thread khác.' }],
    detailedTheory: `### Khi nào CPU nhảy từ User Mode sang Kernel Mode?\nChỉ qua 3 cửa ngõ phần cứng hợp lệ:\n1. **System Call (Trap)**: App chủ động gọi (vd: \`read()\`, \`write()\`).\n2. **Exception / Fault**: Lỗi chia 0 hoặc **Page Fault**.\n3. **Hardware Interrupt**: Timer hết quantum hoặc card mạng nhận gói tin.`,
    howItWorks: [
      'App nạp số hiệu syscall vào thanh ghi (vd RAX trên x86-64) và gọi lệnh `syscall`.',
      'CPU tự động lưu RIP/RSP user vào kernel stack/registers, đổi CPL = 0.',
      'Kernel thực thi handler tại địa chỉ cố định (LSTAR MSR).',
      'Kernel gọi `sysret` khôi phục thanh ghi và hạ CPL = 3.',
    ],
    diagram: defaultDiagram('Mode Transition', 'User Code (CPL=3)', 'syscall / IRQ Trap', 'Kernel Handler (CPL=0)'),
    algorithms: [{ name: 'Limited Direct Execution (OSTEP)', summary: 'Cho app chạy trực tiếp trên CPU ở User Mode để đạt tốc độ gốc, nhưng Kernel giành lại quyền qua timer & trap table.', complexity: '~100-500 CPU cycles' }],
    codeExample: { language: 'nasm', title: 'Gọi syscall write(1, msg, len) trực tiếp bằng x86-64 Assembly', code: `mov rax, 1       ; sys_write\nmov rdi, 1       ; fd = stdout\nlea rsi, [msg]   ; buffer\nmov rdx, 14      ; length\nsyscall          ; Chuyển User Mode -> Kernel Mode` },
    comparisons: [{ aspect: 'Chi phí CPU', optionA: 'Function call thường: vài ns, giữ nguyên stack & cache', optionB: 'System call (Mode Switch): đắt hơn ~50–100x do kiểm tra bảo mật & KPTI' }],
    realWorldApplications: ['Lý do Buffered I/O (BufferedReader trong Java, stdio FILE* trong C) gom nhiều dòng rồi mới gọi `write()` syscall 1 lần.'],
    commonMistakes: ['Đánh đồng Mode Switch với Process Context Switch — gọi `getpid()` chỉ gây Mode Switch mà không đổi sang tiến trình khác.'],
    interviewQuestions: [{ question: 'Tại sao đọc 1MB bằng 1.000.000 lần read(1 byte) chậm hơn nhiều so với 1 lần read(1MB)?', answer: 'Mỗi lần read() tốn 1 cặp Mode Switch (User -> Kernel -> User) kèm overhead sao chép buffer và kiểm tra bảo mật, nên gọi 1 triệu lần tốn gấp hàng trăm lần thời gian.' }],
    exercises: [{ id: 'ex_0202_1', prompt: 'Dùng `strace` đếm số lượng syscall khi chạy chương trình C dùng `printf` 1000 lần vs `write` 1000 lần.', solutionHint: '`printf` buffer sẵn trong User Space rồi gọi `write` ít lần hơn hẳn.' }],
  },
  {
    id: 'os_02_03',
    moduleId: 'os_m02',
    code: '02.03',
    title: 'System Calls & POSIX API',
    subtitle: 'Cánh cổng chuẩn hóa để ứng dụng yêu cầu Kernel thực hiện I/O, cấp phát RAM và sinh tiến trình.',
    tags: ['System Call', 'POSIX', 'glibc', 'io_uring'],
    relatedTopicIds: ['os_02_02', 'os_03_01', 'os_08_01', 'os_09_01'],
    overview: 'Ứng dụng hiếm khi gọi trực tiếp lệnh `syscall` của CPU; chúng gọi qua thư viện chuẩn (như `glibc` trên Linux hoặc `ntdll.dll` trên Windows) bọc System Call thành hàm C/Java quen thuộc.',
    coreConcepts: ['5 Nhóm Syscall chính', 'Wrapper Library (glibc / Win32)', 'Syscall Table', 'Zero-copy & Async Syscalls (sendfile, io_uring)'],
    definitions: [{ term: 'vDSO (Virtual Dynamic Shared Object)', meaning: 'Cơ chế Linux map một số hàm chỉ đọc (như `gettimeofday`) thẳng vào User Space để tránh tốn Mode Switch.' }],
    detailedTheory: `### 5 nhóm System Call cốt lõi\n1. **Process Control**: \`fork\`, \`execve\`, \`exit\`, \`waitpid\`.\n2. **File Management**: \`open\`, \`read\`, \`write\`, \`close\`, \`lseek\`.\n3. **Device Management**: \`ioctl\`, \`mmap\`.\n4. **Information Maintenance**: \`getpid\`, \`clock_gettime\`.\n5. **Communication & Protection**: \`pipe\`, \`socket\`, \`chmod\`, \`kill\`.`,
    howItWorks: ['App gọi hàm wrapper `read()` trong libc.', 'libc đặt syscall number & đối số vào thanh ghi CPU.', 'Trap vào Kernel tra `sys_call_table`.', 'Kernel thực hiện, copy kết quả về User Space và trả lỗi qua `errno` nếu < 0.'],
    diagram: defaultDiagram('Syscall Path', 'App calls open()', 'libc wrapper + trap', 'sys_call_table[2] -> VFS'),
    algorithms: [{ name: 'io_uring Ring Buffer', summary: 'Chia sẻ cặp Submission/Completion Ring giữa User & Kernel để batch hàng nghìn I/O với ít syscall nhất.', complexity: 'O(1) amortized syscall' }],
    codeExample: { language: 'c', title: 'Đo thời gian thực thi bằng strace / syscall trace', code: `// Chạy trong terminal để quan sát mọi syscall của ls:\n// strace -c ls -la\n// Quan sát các lệnh openat, getdents64, write, close` },
    comparisons: [{ aspect: 'Tầng thực thi', optionA: 'Library Call (vd malloc gộp pool, strlen): ở User Space', optionB: 'System Call (vd brk, mmap, read): vượt ranh giới vào Kernel' }],
    realWorldApplications: ['Kafka dùng `sendfile()` (zero-copy syscall) đẩy dữ liệu từ Page Cache thẳng ra NIC không qua User Space.', 'Redis/RocksDB dùng `io_uring` hoặc `epoll`.'],
    commonMistakes: ['Tưởng `malloc()` luôn gọi syscall mỗi lần cấp phát — `malloc()` là hàm của `glibc` quản lý heap trong User Space và chỉ gọi `brk`/`mmap` khi hết vùng nhớ trống.'],
    interviewQuestions: [{ question: 'So sánh hàm thư viện chuẩn C (như printf, malloc) với System Call (như write, mmap)?', answer: 'Hàm thư viện chạy ở User Space, tối ưu hóa bằng buffer hoặc allocator nội bộ; chỉ khi thực sự cần dịch vụ phần cứng/OS mới gọi xuống System Call gây chuyển mode.' }],
    exercises: [{ id: 'ex_0203_1', prompt: 'Chạy `strace -e trace=memory ls` để xem lệnh `ls` dùng những syscall bộ nhớ nào.', solutionHint: 'Sẽ thấy `brk` và `mmap` dùng để cấp phát vùng nhớ động.' }],
  },
  {
    id: 'os_02_04',
    moduleId: 'os_m02',
    code: '02.04',
    title: 'Monolithic Kernel Design',
    subtitle: 'Toàn bộ dịch vụ lõi (FS, Scheduler, Network, Drivers) chạy chung trong Kernel Space.',
    tags: ['Monolithic', 'Linux', 'Kernel Architecture'],
    relatedTopicIds: ['os_02_05', 'os_02_06', 'os_09_01'],
    overview: 'Linux, FreeBSD và các biến thể UNIX truyền thống dùng kiến trúc Monolithic Kernel (có hỗ trợ nạp module động LKM) để đạt hiệu năng tối đa.',
    coreConcepts: ['Single Kernel Address Space', 'Fast In-Kernel Function Calls', 'Loadable Kernel Modules (LKM)', 'High Throughput vs Fault Surface'],
    definitions: [{ term: 'Loadable Kernel Module (.ko)', meaning: 'Đoạn mã driver hoặc file system có thể nạp/gỡ nóng vào Monolithic Kernel đang chạy mà không cần biên dịch lại toàn nhân.' }],
    detailedTheory: `### Tại sao Linux chọn Monolithic?\nKhi các thành phần như VFS, Page Cache, Network Stack và Device Driver nằm chung một không gian bộ nhớ nhân, việc giao tiếp giữa chúng chỉ là **lời gọi hàm C trực tiếp (nanoseconds)** thay vì gửi thông điệp qua lại giữa các tiến trình ở User Space (microseconds).`,
    howItWorks: ['Mọi phân hệ biên dịch hoặc load module vào cùng Ring 0.', 'Giao tiếp nội bộ bằng pointer & direct function call.', 'Lỗi nghiêm trọng ở 1 driver có thể gây Kernel Panic.'],
    diagram: defaultDiagram('Monolithic Kernel', 'User Apps (Ring 3)', 'Single Syscall Gate', 'VFS · Net · Sched · Drivers (Ring 0)'),
    algorithms: [{ name: 'Direct Pointer Dispatch (VFS Ops)', summary: 'Bảng con trỏ hàm `file_operations` gọi thẳng từ VFS xuống driver cụ thể.', complexity: 'O(1) indirect call' }],
    codeExample: { language: 'bash', title: 'Xem các Kernel Modules đang chạy trong Monolithic Kernel Linux', code: `lsmod | head -n 12\nmodinfo ext4` },
    comparisons: [{ aspect: 'Giao tiếp nội bộ', optionA: 'Monolithic: Direct function call (~vài ns)', optionB: 'Microkernel: Inter-Process Message Passing (IPC)' }],
    realWorldApplications: ['Linux trên 90%+ hạ tầng Cloud, Kubernetes, Android và siêu máy tính.'],
    commonMistakes: ['Nghĩ Monolithic nghĩa là "một cục mã cứng không thể mở rộng" — Linux dùng Loadable Kernel Modules để mở rộng rất linh hoạt.'],
    interviewQuestions: [{ question: 'Ưu và nhược điểm lớn nhất của Monolithic Kernel so với Microkernel?', answer: 'Ưu: hiệu năng rất cao nhờ gọi hàm trực tiếp không tốn IPC; Nhược: một lỗi nhỏ ở driver có thể làm crash toàn bộ nhân (tính cô lập lỗi thấp hơn).' }],
    exercises: [{ id: 'ex_0204_1', prompt: 'Kiểm tra tên các module đang nạp cho card mạng hoặc hệ thống tệp trên máy bằng `lsmod`.', solutionHint: 'Tìm các module như `nvme`, `ext4`, `e1000e`, `iwlwifi`.' }],
  },
  {
    id: 'os_02_05',
    moduleId: 'os_m02',
    code: '02.05',
    title: 'Microkernel & Hybrid Kernel',
    subtitle: 'Tối giản nhân xuống mức chỉ còn IPC, Scheduling cơ bản, đẩy FS & Drivers ra User Space.',
    tags: ['Microkernel', 'Hybrid Kernel', 'IPC', 'seL4'],
    relatedTopicIds: ['os_02_04', 'os_02_01', 'os_11_04'],
    overview: 'Microkernel đặt tính an toàn và cô lập lên hàng đầu; Hybrid Kernel (macOS XNU, Windows NT) pha trộn ranh giới để cân bằng độ ổn định và tốc độ.',
    coreConcepts: ['Minimal Ring 0 (IPC, VM, Thread Sched)', 'User-space Servers (FS Server, Net Server)', 'Formal Verification (seL4)', 'Hybrid Kernel (Windows NT, XNU Mach+BSD)'],
    definitions: [{ term: 'Microkernel', meaning: 'Kiến trúc nhân chỉ giữ lại tối thiểu những gì bắt buộc phải chạy ở Kernel Mode (~10k dòng code), mọi dịch vụ khác chạy như tiến trình User bình thường.' }],
    detailedTheory: `### Cuộc tranh luận Tanenbaum–Torvalds\n- **Microkernel (MINIX, QNX, seL4, Zircon)**: Nếu Driver mạng bị crash, tiến trình User quản lý driver đó khởi động lại mà không làm sập cả OS. Thậm chí seL4 có thể chứng minh toán học không có lỗi bộ nhớ.\n- **Hybrid Kernel (Windows NT, macOS XNU)**: Giữ cấu trúc phân lớp dạng Microkernel ở thiết kế nhưng kéo các driver và hệ thống tệp vào chung Kernel Space để tránh chi phí IPC.`,
    howItWorks: ['Client app gửi IPC request vào Microkernel.', 'Microkernel chuyển tiếp message tới File Server (ở User Space).', 'File Server xử lý và gửi lại IPC reply qua Microkernel.'],
    diagram: defaultDiagram('Microkernel IPC', 'App & User FS Server', 'Microkernel (IPC + MM)', 'Hardware (Ring 0)'),
    algorithms: [{ name: 'Fast Synchronous IPC', summary: 'Truyền thông điệp ngắn trực tiếp qua thanh ghi CPU thay vì copy qua RAM để giảm chi phí Microkernel.', complexity: '2–4x slower than direct syscall' }],
    codeExample: { language: 'text', title: 'So sánh số lần chuyển ngữ cảnh khi đọc File', code: `Monolithic: App -> [Syscall -> Kernel VFS -> Driver] -> App  (2 mode switches)\nMicrokernel: App -> Kernel -> FS Server -> Kernel -> Driver -> Kernel -> App (tốn nhiều IPC switches)` },
    comparisons: [{ aspect: 'Tính cô lập lỗi', optionA: 'Microkernel: Rất cao (driver crash chỉ restart service)', optionB: 'Hybrid: Đặt hiệu năng lên trên nên vẫn chạy driver trong Ring 0' }],
    realWorldApplications: ['QNX trong hệ thống nhúng ô tô', 'seL4 trong quân sự & bảo mật cao', 'Windows NT & macOS XNU dùng kiến trúc Hybrid'],
    commonMistakes: ['Nghĩ macOS hoặc Windows là Microkernel thuần túy — cả hai thực chất là Hybrid Kernel.'],
    interviewQuestions: [{ question: 'Tại sao Microkernel truyền thống thường chậm hơn Monolithic Kernel?', answer: 'Vì mỗi dịch vụ (FS, Network, Driver) là một User process riêng nên giao tiếp giữa chúng đòi hỏi nhiều lần context switch và truyền thông điệp IPC qua nhân.' }],
    exercises: [{ id: 'ex_0205_1', prompt: 'Vẽ sơ đồ 4 bước giao tiếp khi 1 app trên Microkernel muốn đọc dữ liệu từ ổ cứng.', solutionHint: 'App -> Kernel IPC -> FS Server -> Kernel IPC -> Disk Driver -> ngược lại.' }],
  },
];

// Compact helper to define the remaining 50 topics cleanly across Modules 03–12
RAW_TOPIC_SEEDS.push(
  // =========================================================================
  // MODULE 03: PROCESS MANAGEMENT
  // =========================================================================
  {
    id: 'os_03_01',
    moduleId: 'os_m03',
    code: '03.01',
    title: 'Process Concept & Memory Layout',
    subtitle: 'Chương trình đang thực thi và 4 phân vùng bộ nhớ: Text, Data, Heap, Stack.',
    tags: ['Process', 'Virtual Memory', 'Stack', 'Heap'],
    relatedTopicIds: ['os_03_02', 'os_03_03', 'os_04_01', 'os_07_04'],
    overview: 'Program chỉ là file thực thi thụ động trên đĩa; Process là một thực thể sống động gồm mã lệnh đang chạy, trạng thái thanh ghi, con trỏ lệnh PC và không gian địa chỉ riêng.',
    coreConcepts: ['Text (Code) Segment (Read-only)', 'Initialized & Uninitialized Data (BSS)', 'Heap (Dynamic allocation — grows up)', 'Stack (Local vars & Call frames — grows down)'],
    definitions: [{ term: 'Process', meaning: 'Một thể hiện (instance) của chương trình đang thực thi cùng toàn bộ tài nguyên (bộ nhớ ảo, file descriptors, thanh ghi) thuộc sở hữu riêng.' }],
    detailedTheory: `### Bố cục Address Space của 1 Process\n\`\`\`\n+------------------------+ High Address\n|   Command args & Env   |\n|   Stack (grows down ↓) |\n|          ...           |\n|   Heap (grows up ↑)    |\n|   BSS (uninit static)  |\n|   Data (init globals)  |\n|   Text (machine code)  |\n+------------------------+ Low Address\n\`\`\`\nHeap mọc từ dưới lên qua \`brk\`/\`mmap\`, Stack mọc từ trên xuống khi gọi hàm đệ quy.`,
    howItWorks: ['OS gọi `execve()` đọc định dạng ELF/PE.', 'Cấp phát không gian địa chỉ ảo cho Text, Data, BSS, Stack.', 'Đặt Program Counter (RIP) vào hàm `_start` và đưa vào Ready Queue.'],
    diagram: defaultDiagram('Process Address Space', 'Text & Data (Static)', 'Heap ↑  <--->  Stack ↓', 'OS File Descriptors'),
    algorithms: [{ name: 'Lazy Loading / Demand Paging', summary: 'Không nạp toàn bộ file binary vào RAM ngay lúc execve; chỉ nạp trang nhớ khi CPU chạm tới.', complexity: 'O(1) startup' }],
    codeExample: { language: 'c', title: 'Kiểm tra địa chỉ Text, Data, Heap, Stack ngay trong C', code: `int g = 10; // Data segment\nint main() {\n  int local = 5; // Stack\n  int *heap = malloc(16); // Heap\n  printf("code=%p data=%p heap=%p stack=%p\\n", main, &g, heap, &local);\n}` },
    comparisons: [{ aspect: 'Tính chất', optionA: 'Program: File tĩnh trên ổ đĩa', optionB: 'Process: Thực thể động trong RAM + CPU state' }],
    realWorldApplications: ['Giải thích lỗi StackOverflowError trong Java/C++ (Stack đụng vùng giới hạn) và OutOfMemoryError (Heap cạn).'],
    commonMistakes: ['Tưởng 2 tiến trình chạy cùng 1 file thực thi (vd 2 cửa sổ Chrome) nhân đôi phần Code Text trong RAM vật lý — OS chia sẻ chung các trang Read-Only Text frames!'],
    interviewQuestions: [{ question: 'Khác nhau giữa Stack và Heap trong không gian nhớ của một Process?', answer: 'Stack lưu frame gọi hàm và biến cục bộ theo LIFO, tự giải phóng và cấp phát cực nhanh bằng cách dời con trỏ RSP; Heap cho cấp phát động sống qua nhiều hàm, quản lý phức tạp hơn bởi allocator.' }],
    exercises: [{ id: 'ex_0301_1', prompt: 'Biên dịch đoạn code C ở trên và so sánh thứ tự tăng dần của địa chỉ main, &g, heap và &local.', solutionHint: 'Thứ tự tăng địa chỉ thường là Text < Data < Heap < Stack.' }],
  },
  {
    id: 'os_03_02',
    moduleId: 'os_m03',
    code: '03.02',
    title: 'Process States & Lifecycle',
    subtitle: '5 trạng thái kinh điển: New, Ready, Running, Waiting (Blocked), Terminated (+ Zombie/Orphan).',
    tags: ['Lifecycle', 'Zombie', 'Wait'],
    relatedTopicIds: ['os_03_01', 'os_03_03', 'os_03_05', 'os_05_01'],
    overview: 'Trong vòng đời, tiến trình liên tục luân chuyển giữa các hàng đợi dựa trên khả năng sẵn sàng chạy hay đang phải chờ I/O.',
    coreConcepts: ['New → Ready → Running', 'Running → Waiting (I/O or Lock)', 'Preemption (Running → Ready)', 'Zombie vs Orphan Process'],
    definitions: [{ term: 'Zombie Process', meaning: 'Tiến trình con đã chạy xong (Terminated) nhưng tiến trình cha chưa gọi `wait()` để đọc exit code, nên mục lục PCB của con vẫn còn trong bảng tiến trình.' }],
    detailedTheory: `### Không thể nhảy trực tiếp từ Waiting sang Running!\nKhi đang \`Waiting\` (chờ đọc đĩa xong), tiến trình chuyển về **Ready** chứ không thể nhảy thẳng lên **Running**, vì CPU lúc đó đang bận phục vụ tiến trình khác và cần bộ lập lịch (Scheduler) cấp lượt.`,
    howItWorks: ['`fork()` sinh tiến trình ở trạng thái New → Ready.', 'Scheduler chọn 1 Ready process đưa lên Running.', 'Gọi I/O → Blocked/Waiting.', 'Xong I/O → IRQ đánh thức đưa lại vào Ready.', '`exit()` → Terminated / Zombie chờ cha `wait()`.'],
    diagram: defaultDiagram('Process State Machine', 'Ready Queue', 'Running (CPU)', 'Waiting / Blocked (I/O)'),
    algorithms: [{ name: 'Wait/Reap Protocol', summary: 'Cha dùng `waitpid()` hoặc xử lý `SIGCHLD` để giải phóng PCB của tiến trình con.', complexity: 'O(1)' }],
    codeExample: { language: 'c', title: 'Tránh tạo Zombie process bằng wait()', code: `pid_t pid = fork();\nif (pid == 0) { _exit(0); }\nelse {\n  int status;\n  waitpid(pid, &status, 0); // Thu dọn PCB của con\n}` },
    comparisons: [{ aspect: 'Nguyên nhân tồn tại', optionA: 'Zombie: Con chết trước, cha sống nhưng quên wait()', optionB: 'Orphan: Cha chết trước, con được PID 1 nhận nuôi' }],
    realWorldApplications: ['Container Docker chạy app Node/Python làm PID 1 thường bị rò rỉ Zombie nếu không dùng `tini` hoặc `dumb-init` để reap tiến trình con.'],
    commonMistakes: ['Nghĩ có thể `kill -9` một Zombie process — Zombie đã chết rồi, chỉ có cách bảo tiến trình cha `wait()` hoặc kill tiến trình cha để PID 1 dọn hộ.'],
    interviewQuestions: [{ question: 'Làm thế nào để xử lý hoặc tiêu diệt một Zombie process?', answer: 'Không thể kill tiến trình đã chết; cần sửa tiến trình cha gọi wait()/waitpid() (hoặc bắt SIGCHLD), hoặc kill tiến trình cha để init (PID 1) nhận nuôi và thu dọn.' }],
    exercises: [{ id: 'ex_0302_1', prompt: 'Viết kịch bản shell kiểm tra trạng thái `Z` trong `ps aux`.', solutionHint: 'Tìm cột STAT chứa chữ Z (Zombie), D (Uninterruptible Sleep), R (Running), S (Sleeping).' }],
  },
  {
    id: 'os_03_03',
    moduleId: 'os_m03',
    code: '03.03',
    title: 'Process Control Block (PCB)',
    subtitle: 'Tấm thẻ căn cước `task_struct` trong Kernel lưu mọi thông tin của một tiến trình.',
    tags: ['PCB', 'task_struct', 'Kernel Data'],
    relatedTopicIds: ['os_03_01', 'os_03_02', 'os_03_04'],
    overview: 'Mỗi tiến trình trong hệ điều hành được đại diện bởi đúng một cấu trúc dữ liệu PCB trong bộ nhớ Kernel (trên Linux gọi là `struct task_struct`).',
    coreConcepts: ['PID & Parent PID', 'Process State & Priority', 'Saved CPU Registers & Program Counter', 'Page Table Pointer (CR3) & Open Files Table'],
    definitions: [{ term: 'PCB (Process Control Block)', meaning: 'Cấu trúc dữ liệu lưu ngữ cảnh của tiến trình để Kernel tạm dừng và khôi phục chính xác trạng thái như chưa từng bị ngắt.' }],
    detailedTheory: `### Bên trong PCB chứa gì?\n1. **Định danh**: PID, UID, GID.\n2. **Ngữ cảnh CPU**: Program Counter (RIP), Stack Pointer (RSP), các thanh ghi đa dụng.\n3. **Lập lịch**: Priority, vruntime, con trỏ hàng đợi.\n4. **Bộ nhớ**: Con trỏ Page Table gốc (\`mm_struct\` / thanh ghi \`CR3\`).\n5. **I/O**: Danh sách File Descriptors đang mở (\`fd 0, 1, 2...\`).`,
    howItWorks: ['Kernel cấp phát PCB khi `fork()`.', 'Lưu giá trị thanh ghi vào PCB khi bị ngắt.', 'Đọc PCB để nạp lại trạng thái khi đến lượt chạy tiếp.'],
    diagram: defaultDiagram('PCB Structure', 'PID · State · Priority', 'Registers · RIP · RSP', 'Page Table (CR3) · FDs'),
    algorithms: [{ name: 'PID Hash / Radix Tree (IDR)', summary: 'Linux tra cứu nhanh `task_struct` từ số PID qua cấu trúc XArray/Radix Tree.', complexity: 'O(1) / O(log N)' }],
    codeExample: { language: 'bash', title: 'Đọc thông tin PCB công khai qua /proc/<pid>', code: `cat /proc/self/status | head -n 15\nls -l /proc/self/fd` },
    comparisons: [{ aspect: 'Phạm vi quản lý', optionA: 'PCB: cấp Process (Page Table + FDs)', optionB: 'TCB (Thread Control Block): cấp Thread (Registers + Stack riêng)' }],
    realWorldApplications: ['Thư mục `/proc` trên Linux phản chiếu trực tiếp cấu trúc `task_struct` của từng tiến trình ra hệ thống tệp ảo.'],
    commonMistakes: ['Tưởng PCB nằm trong không gian nhớ của User App — PCB nằm hoàn toàn trong Kernel Space để user không thể tự sửa PID hay quyền hạn.'],
    interviewQuestions: [{ question: 'PCB lưu những thông tin tối thiểu nào để một tiến trình có thể tạm dừng và chạy tiếp?', answer: 'Program Counter, CPU registers, Stack Pointer, Process State, thông tin lập lịch và con trỏ đến Page Table/Open Files.' }],
    exercises: [{ id: 'ex_0303_1', prompt: 'Mở `/proc/$$/maps` trên Linux để quan sát cách Kernel mô tả các vùng nhớ của shell hiện tại.', solutionHint: 'Sẽ thấy r-xp (text), rw-p (heap), [stack], [vdso].' }],
  },
  {
    id: 'os_03_04',
    moduleId: 'os_m03',
    code: '03.04',
    title: 'Context Switching Mechanics',
    subtitle: 'Quá trình lưu trạng thái CPU của tiến trình A, đổi bảng phân trang và nạp tiến trình B.',
    tags: ['Context Switch', 'TLB Flush', 'Overhead'],
    relatedTopicIds: ['os_02_02', 'os_03_03', 'os_04_01', 'os_07_02'],
    overview: 'Context Switch là trái tim của multitasking: phần lớn thời gian nó mang lại tính đa nhiệm, nhưng quá nhiều context switch sẽ đốt sạch năng lực CPU vào việc quản trị.',
    coreConcepts: ['Save Registers to PCB_A', 'Switch Page Directory (CR3)', 'TLB Invalidation & Cache Coldness', 'Voluntary vs Involuntary Switch'],
    definitions: [{ term: 'Context Switch Overhead', meaning: 'Khoảng thời gian thuần túy vô ích đối với ứng dụng (từ vài µs tới hàng chục µs kể cả hiệu ứng nguội L1/L2 cache & TLB) khi chuyển giữa 2 tiến trình.' }],
    detailedTheory: `### Chi phí ẩn đằng sau Context Switch\nChi phí trực tiếp của việc cất/nạp thanh ghi chỉ mất vài trăm nanoseconds. Cái giá đắt đỏ thật sự là **Indirect Overhead**:\n- **TLB Misses**: Nếu đổi Process, bộ đệm dịch địa chỉ TLB bị vô hiệu hóa (trừ khi có PCID/ASID).\n- **CPU Cache Pollution**: Dữ liệu nóng của Process A trong L1/L2 Cache bị Process B đẩy ra ngoài.`,
    howItWorks: [
      'Timer IRQ hoặc blocking syscall dừng Process A vào Kernel Mode.',
      'Lưu tập thanh ghi phần cứng của A vào Kernel Stack / PCB A.',
      'Scheduler chọn Process B.',
      'Đổi thanh ghi `CR3` trỏ tới Page Table của B (nếu khác process).',
      'Nạp thanh ghi của B và trả về User Mode tiếp tục lệnh kế tiếp của B.',
    ],
    diagram: defaultDiagram('Context Switch', 'Save State -> PCB A', 'Kernel Scheduler + CR3 Swap', 'Restore PCB B -> Run B'),
    algorithms: [{ name: 'PCID / ASID Tagging', summary: 'Gắn ID không gian địa chỉ vào mỗi mục TLB để tránh xóa sạch TLB khi đổi process.', complexity: 'Giảm đáng kể TLB miss' }],
    codeExample: { language: 'bash', title: 'Đo Voluntary vs Non-voluntary Context Switches trên Linux', code: `grep ctxt /proc/self/status\n# voluntary_ctxt_switches: chủ động nhường CPU (đợi I/O)\n# nonvoluntary_ctxt_switches: bị timer preempt hết time-slice` },
    comparisons: [{ aspect: 'Chi phí chuyển đổi', optionA: 'Process Context Switch: Đổi CR3 Page Table + Cache cold', optionB: 'Thread Context Switch (cùng process): Giữ nguyên Page Table & TLB' }],
    realWorldApplications: ['Thiết kế kiến trúc Thread-per-core (ScyllaDB, Seastar, Nginx) ghim 1 thread/core để triệt tiêu Context Switch.'],
    commonMistakes: ['Tạo hàng nghìn thread trên máy 8 nhân và nghĩ nó nhanh hơn — CPU sẽ chết chìm trong Context Switch thrashing.'],
    interviewQuestions: [{ question: 'Tại sao chuyển ngữ cảnh giữa 2 Process tốn kém hơn giữa 2 Thread cùng Process?', answer: 'Chuyển Process phải thay đổi Address Space (nạp lại thanh ghi CR3 Page Table) dẫn đến làm mất hiệu lực TLB và làm nguội CPU Cache, trong khi 2 Thread cùng Process dùng chung không gian địa chỉ.' }],
    exercises: [{ id: 'ex_0304_1', prompt: 'Giải thích khi nào `voluntary_ctxt_switches` tăng vọt so với `nonvoluntary_ctxt_switches`.', solutionHint: 'Chương trình I/O-bound chờ mạng/đĩa nhiều có voluntary cao; chương trình CPU-bound tranh giành lõi có nonvoluntary cao.' }],
  },
  {
    id: 'os_03_05',
    moduleId: 'os_m03',
    code: '03.05',
    title: 'Process Queues & IPC Basics',
    subtitle: 'Các hàng đợi lập lịch và giao tiếp liên tiến trình: Pipe, Shared Memory, Sockets.',
    tags: ['IPC', 'Pipe', 'Shared Memory', 'Fork'],
    relatedTopicIds: ['os_03_02', 'os_05_01', 'os_06_01'],
    overview: 'Vì các tiến trình bị cô lập bộ nhớ, chúng cần các kênh IPC (Inter-Process Communication) do Kernel kiểm soát để trao đổi dữ liệu.',
    coreConcepts: ['Ready Queue & Device Wait Queues', 'Message Passing (Pipe, FIFO, Socket)', 'Shared Memory (`shm_open` + `mmap`)', 'Copy-on-Write (CoW) in `fork()`'],
    definitions: [{ term: 'Copy-on-Write (CoW)', meaning: 'Tối ưu hóa khi gọi `fork()`: cha và con dùng chung các trang RAM ở chế độ Read-Only; OS chỉ sao chép trang vật lý khi một bên thực sự ghi đè.' }],
    detailedTheory: `### Hai trường phái IPC\n- **Shared Memory**: Tốc độ nhanh nhất (không cần copy qua Kernel sau khi thiết lập), nhưng lập trình viên phải tự đồng bộ bằng Mutex/Semaphore.\n- **Message Passing (Pipe / Socket)**: Dễ dùng và an toàn đồng bộ sẵn, nhưng phải copy dữ liệu 2 lần (User → Kernel → User).`,
    howItWorks: ['Hai tiến trình mở cùng file/segment hoặc cặp pipe fds.', 'Với Shared Memory, OS map cùng Physical Frames vào 2 Virtual Address Spaces.', 'Với Pipe, Kernel cấp vòng đệm buffer nội bộ.'],
    diagram: defaultDiagram('IPC Paradigms', 'Process A', 'Pipe (Kernel Buffer) / SHM', 'Process B'),
    algorithms: [{ name: 'Copy-on-Write Page Fault', summary: 'Đánh dấu trang cha/con là Read-Only khi fork(); khi có write fault, nhân bản trang đó và cấp quyền ghi.', complexity: 'O(1) fork time' }],
    codeExample: { language: 'c', title: 'Truyền dữ liệu qua Anonymous Pipe giữa Cha và Con', code: `int fd[2]; pipe(fd);\nif (fork() == 0) {\n  close(fd[0]); write(fd[1], "ping", 4);\n} else {\n  char buf[8]; close(fd[1]); read(fd[0], buf, 4);\n}` },
    comparisons: [{ aspect: 'Tốc độ & Đồng bộ', optionA: 'Shared Memory: Cực nhanh, phải tự lo Mutex', optionB: 'Pipe / Socket: Tốn copy qua Kernel, đồng bộ sẵn luồng byte' }],
    realWorldApplications: ['Redis RDB snapshot gọi `fork()` tận dụng Copy-on-Write để dump RAM ra đĩa mà không chặn luồng chính.', 'Unix domain sockets kết nối Nginx ↔ PHP-FPM/Gunicorn.'],
    commonMistakes: ['Tưởng `fork()` nhân đôi ngay lập tức toàn bộ 10GB RAM của tiến trình cha — nhờ CoW, `fork()` gần như tức thì.'],
    interviewQuestions: [{ question: 'Tại sao Shared Memory nhanh hơn Pipe/Socket nhưng khó viết đúng hơn?', answer: 'Shared Memory chỉ mất công Kernel map chung frame lúc đầu, mọi đọc/ghi sau đó đi thẳng qua RAM không cần syscall hay copy; nhưng thiếu đồng bộ tích hợp nên dễ xảy ra Race Condition.' }],
    exercises: [{ id: 'ex_0305_1', prompt: 'Giải thích điều gì xảy ra nếu Redis đang dùng 8GB RAM thực hiện `fork()` để lưu RDB khi traffic ghi đang rất cao.', solutionHint: 'Tỉ lệ ghi cao kích hoạt nhiều Page Fault Copy-on-Write, khiến mức RAM thực có thể phình gần gấp đôi.' }],
  },

  // =========================================================================
  // MODULE 04: THREADS & CONCURRENCY
  // =========================================================================
  {
    id: 'os_04_01',
    moduleId: 'os_m04',
    code: '04.01',
    title: 'Threads & Shared Address Space',
    subtitle: 'Đơn vị thực thi nhẹ nhất trên CPU: chia sẻ Code/Heap/Files nhưng giữ Stack & Registers riêng.',
    tags: ['Thread', 'TCB', 'Concurrency'],
    relatedTopicIds: ['os_03_01', 'os_03_04', 'os_04_02', 'os_04_04'],
    overview: 'Thread cho phép một tiến trình thực hiện đồng thời nhiều luồng công việc (như vừa tải mạng vừa render UI) mà không phải trả giá đắt cho việc tách biệt hoàn toàn địa chỉ nhớ.',
    coreConcepts: ['Thread-Private: PC, Registers, Stack, Thread ID', 'Process-Shared: Code, Heap, Global Vars, Open FDs', 'User Threads vs Kernel Threads'],
    definitions: [{ term: 'Thread Control Block (TCB)', meaning: 'Cấu trúc nhỏ lưu thông tin riêng của một luồng (registers, stack pointer, state), nằm bên trong hoặc liên kết tới PCB.' }],
    detailedTheory: `### Chia sẻ vs Riêng tư trong 1 Process đa luồng\n- **Dùng chung**: Heap, Global/Static variables, Text code, Open File Descriptors.\n- **Riêng tư**: Program Counter, CPU Registers, Call Stack.\n\nNhờ chia sẻ Heap, giao tiếp giữa 2 thread chỉ mất 1 phép gán con trỏ — nhưng cũng vì thế mà **1 thread ghi nhầm hoặc dereference null sẽ sập cả Process**.`,
    howItWorks: ['Gọi `pthread_create()` hoặc `new Thread().start()` (gọi `clone()` trên Linux).', 'Kernel cấp Stack riêng cho luồng mới nhưng trỏ tới cùng Page Table (`CLONE_VM`).', 'Scheduler lập lịch độc lập từng thread lên các lõi CPU.'],
    diagram: defaultDiagram('Threads in Process', 'Shared Heap & FDs', 'Thread 1 (Stack+Reg)', 'Thread 2 (Stack+Reg)'),
    algorithms: [{ name: 'Linux `clone()` Flagging', summary: 'Linux coi Process và Thread đều là `task_struct`; Thread chỉ là task gọi `clone()` có bật cờ chia sẻ `CLONE_VM | CLONE_FILES`.', complexity: 'O(1) shared setup' }],
    codeExample: { language: 'java', title: 'Hai Java Threads dùng chung đối tượng trên Heap nhưng Stack tách biệt', code: `class SharedCounter {\n  int count = 0; // Trên Heap -> dùng chung!\n}\n// Mỗi Thread có call stack riêng cho biến cục bộ int localTemp.` },
    comparisons: [{ aspect: 'Tài nguyên', optionA: 'Multi-Process: Cô lập mạnh, tốn RAM & IPC', optionB: 'Multi-Thread: Nhẹ, chia sẻ Heap nhanh, dễ Race Condition' }],
    realWorldApplications: ['Web Server (Tomcat, Netty worker pool)', 'Database engine xử lý đồng thời nhiều truy vấn trên cùng Buffer Pool.'],
    commonMistakes: ['Tưởng biến cục bộ khai báo trong hàm `run()` bị các thread khác ghi đè — biến cục bộ nằm trên Stack riêng của từng thread (trừ khi bạn truyền tham chiếu ra Heap).'],
    interviewQuestions: [{ question: 'Hai thread trong cùng một process dùng chung gì và có gì riêng?', answer: 'Dùng chung Code, Heap, biến toàn cục và File Descriptors; có riêng Thread ID, Program Counter, tập thanh ghi và Call Stack.' }],
    exercises: [{ id: 'ex_0401_1', prompt: 'Chạy `ps -eLf` trên Linux để quan sát cột LWP (Light Weight Process / Thread ID) thuộc cùng một PID.', solutionHint: 'Sẽ thấy nhiều TID (LWP) cùng chia sẻ một giá trị PID.' }],
  },
  {
    id: 'os_04_02',
    moduleId: 'os_m04',
    code: '04.02',
    title: 'Multithreading Models (1:1, N:1, M:N)',
    subtitle: 'Cách ánh xạ User Threads xuống Kernel Threads: Linux/Java truyền thống vs Go/Java Virtual Threads.',
    tags: ['1:1 Model', 'M:N Model', 'Virtual Threads', 'Goroutines'],
    relatedTopicIds: ['os_04_01', 'os_04_03', 'os_05_01'],
    overview: 'Hiểu mô hình ánh xạ User-Kernel Thread giải thích vì sao Go Goroutines và Java Project Loom Virtual Threads mở được hàng triệu tác vụ đồng thời.',
    coreConcepts: ['Many-to-One (N:1)', 'One-to-One (1:1 — Linux NPTL, Java Platform Thread)', 'Many-to-Many (M:N — Go Runtime, Java Virtual Threads)'],
    definitions: [{ term: 'M:N Scheduling', meaning: 'Hàng nghìn hoặc hàng triệu User-space fibers/coroutines được runtime đa hợp (multiplex) chạy trên một số lượng nhỏ Kernel Threads (thường bằng số lõi CPU).' }],
    detailedTheory: `### Tại sao N:1 thất bại trên Multicore?\nNếu nhiều User Thread ánh xạ vào chỉ **1 Kernel Thread**:\n1. Một luồng gọi blocking I/O → **cả process bị block**.\n2. Không thể tận dụng nhiều lõi CPU.\n\n### Tại sao 1:1 có giới hạn số lượng?\nMỗi OS Kernel Thread tốn ~1MB Stack mặc định + chi phí lập lịch trong Kernel → khó tạo >10.000 thread. Do đó **M:N** (Go, Java Virtual Threads) ra đời kết hợp độ nhẹ của User Space và sức mạnh đa lõi của Kernel Threads.`,
    howItWorks: ['Runtime duy trì hàng đợi Task nhẹ ở User Space.', 'Mỗi Kernel Thread đóng vai trò Carrier/Worker lấy task ra chạy.', 'Khi gặp I/O không chặn (epoll/kqueue), Runtime park task đó và nhường Carrier cho task khác không cần Context Switch Kernel.'],
    diagram: defaultDiagram('M:N Threading', '100k Virtual Threads', 'User-Space Scheduler', '8 Kernel Carrier Threads'),
    algorithms: [{ name: 'Work-Stealing Scheduler', summary: 'Worker rảnh tự động đánh cắp task từ hàng đợi cục bộ của Worker đang quá tải (dùng trong Go & ForkJoinPool).', complexity: 'O(1) local push/pop' }],
    codeExample: { language: 'java', title: 'Java 21+ Virtual Threads (M:N) vs Platform Thread (1:1)', code: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n  for (int i = 0; i < 50_000; i++) {\n    executor.submit(() -> { Thread.sleep(100); return 1; });\n  }\n}` },
    comparisons: [{ aspect: 'Quy mô & Chi phí', optionA: '1:1 OS Thread: ~1MB stack, vài nghìn luồng', optionB: 'M:N Virtual Thread / Goroutine: vài KB stack, hàng trăm nghìn luồng' }],
    realWorldApplications: ['Go Scheduler (GMP model)', 'Java 21 Virtual Threads (Project Loom)', 'Tokio Async Runtime trong Rust'],
    commonMistakes: ['Pinning Virtual Thread (gọi code synchronized block lâu hoặc JNI) khiến Carrier Kernel Thread bị kẹt theo, mất lợi thế M:N.'],
    interviewQuestions: [{ question: 'So sánh mô hình luồng 1:1 và M:N?', answer: '1:1 (như pthread) tận dụng tốt đa nhân và không bị block chéo nhưng tốn RAM & Kernel context switch nên khó mở rộng hàng trăm nghìn luồng; M:N ghép hàng vạn user-space threads lên ít kernel threads để đạt độ đồng thời cực cao.' }],
    exercises: [{ id: 'ex_0402_1', prompt: 'Phân tích vì sao Work-Stealing lấy task từ đuôi (tail) hàng đợi của luồng khác còn luồng chủ lấy từ đầu (head).', solutionHint: 'Giảm tranh chấp khóa (lock contention) và giữ Cache locality nóng cho luồng chủ.' }],
  },
  {
    id: 'os_04_03',
    moduleId: 'os_m04',
    code: '04.03',
    title: 'Concurrency vs Parallelism & Multicore',
    subtitle: 'Đa nhiệm cấu trúc (Concurrency) vs chạy song song vật lý (Parallelism) & Định luật Amdahl.',
    tags: ['Multicore', 'Amdahl Law', 'False Sharing'],
    relatedTopicIds: ['os_04_02', 'os_05_01', 'os_06_01'],
    overview: 'Concurrency là cách cấu trúc bài toán xử lý nhiều việc xen kẽ (kể cả trên 1 lõi CPU); Parallelism là chạy thực sự cùng một thời điểm trên nhiều lõi vật lý.',
    coreConcepts: ['Concurrency (Dealing with many things at once)', 'Parallelism (Doing many things at once)', 'Amdahl’s Law Speedup Ceiling', 'CPU Cache Line & False Sharing'],
    definitions: [{ term: 'False Sharing', meaning: 'Hai thread trên 2 lõi CPU khác nhau sửa 2 biến độc lập nhưng nằm chung một Cache Line (64 bytes), khiến phần cứng phải liên tục vô hiệu hóa cache của nhau làm tụt hiệu năng nặng nề.' }],
    detailedTheory: `### Định luật Amdahl\n$$Speedup \\le \\frac{1}{(1 - P) + \\frac{P}{N}}$$\nNếu **10% chương trình phải chạy tuần tự** (ví dụ vì giữ một khóa Mutex toàn cục), thì dù bạn mua CPU **1.000 lõi**, tốc độ tối đa cũng **không bao giờ vượt quá 10x**!`,
    howItWorks: ['Phân tách phần tuần tự và phần song song được.', 'Chia dữ liệu theo từng lõi (Thread-local / Sharding).', 'Căn lề bộ nhớ (Cache line padding) nếu biến hay bị ghi đồng thời.'],
    diagram: defaultDiagram('Multicore Execution', 'Core 0 (L1/L2)', 'Cache Coherence (MESI)', 'Core 1 (L1/L2)'),
    algorithms: [{ name: 'MESI Cache Coherence Protocol', summary: 'Giao thức phần cứng giữ dữ liệu đồng nhất giữa các L1/L2 cache riêng qua 4 trạng thái Modified, Exclusive, Shared, Invalid.', complexity: 'Hardware bus traffic' }],
    codeExample: { language: 'java', title: 'Tránh False Sharing bằng @Contended / Padding', code: `// Nếu counterA và counterB nằm cạnh nhau (< 64 bytes),\n// 2 thread ghi liên tục vào 2 biến này vẫn gây cache bounce!\n@jdk.internal.vm.annotation.Contended\nvolatile long threadLocalCounter = 0;` },
    comparisons: [{ aspect: 'Bản chất', optionA: 'Concurrency: Giao thoa trên 1 hoặc nhiều lõi (Architecture)', optionB: 'Parallelism: Thực thi đồng thời vật lý trên nhiều lõi (Execution)' }],
    realWorldApplications: ['LMAX Disruptor dùng Cache Line Padding đạt hàng triệu sự kiện/giây trên JVM.'],
    commonMistakes: ['Nghĩ cứ tăng từ 4 cores lên 16 cores thì app sẽ nhanh gấp 4 lần — phần tuần tự (I/O, locks) quyết định giới hạn theo Amdahl.'],
    interviewQuestions: [{ question: 'False Sharing là gì và khắc phục ra sao?', answer: 'Xảy ra khi hai biến độc lập nằm chung 1 Cache Line (64B) bị hai core khác nhau liên tục ghi vào gây cache invalidation qua lại. Khắc phục bằng cache-line padding hoặc dùng biến cục bộ rồi gộp sau.' }],
    exercises: [{ id: 'ex_0403_1', prompt: 'Áp dụng Định luật Amdahl: Nếu P = 0.8 (80% song song hóa được) và N = 4 cores, speedup tối đa là bao nhiêu?', solutionHint: '1 / (0.2 + 0.8/4) = 1 / 0.4 = 2.5x.' }],
  },
  {
    id: 'os_04_04',
    moduleId: 'os_m04',
    code: '04.04',
    title: 'Race Conditions & Data Races',
    subtitle: 'Vì sao phép tính tưởng như 1 dòng `count++` lại sai kết quả khi chạy đa luồng.',
    tags: ['Race Condition', 'Atomicity', 'Memory Ordering'],
    relatedTopicIds: ['os_04_05', 'os_06_01', 'os_06_02'],
    overview: 'Race Condition xảy ra khi kết quả đúng đắn của chương trình phụ thuộc vào thứ tự xen kẽ không xác định của các luồng khi truy cập trạng thái dùng chung.',
    coreConcepts: ['Non-atomic Read-Modify-Write', 'Check-Then-Act Race', 'CPU Instruction Reordering', 'Atomicity vs Visibility'],
    definitions: [{ term: 'Data Race', meaning: 'Hai luồng truy cập cùng một ô nhớ đồng thời, ít nhất một luồng là ghi (write), và không có cơ chế đồng bộ hóa nào ngăn cách giữa chúng.' }],
    detailedTheory: `### Giải phẫu \`count++\` ở mức mã máy\nMột dòng \`count++\` thực chất tách thành **3 lệnh máy**:\n1. \`LOAD reg, [count]\`\n2. \`ADD reg, 1\`\n3. \`STORE [count], reg\`\n\nNếu Thread A xong bước 2 (reg=1) rồi bị Timer ngắt; Thread B đọc \`count=0\`, cộng thành 1 và ghi xuống; sau đó A thức dậy ghi đè 1 xuống → **Mất 1 lần tăng (Lost Update)**!`,
    howItWorks: ['Hai luồng đọc cùng giá trị cũ trước khi luồng kia kịp ghi.', 'Không có tính nguyên tử (Atomicity).', 'Kết quả phụ thuộc ngẫu nhiên vào timing của Scheduler.'],
    diagram: defaultDiagram('Lost Update Trace', 'T1: LOAD 0 -> ADD 1', 'Preempt! T2 writes 1', 'T1: STORE 1 (Mất 1!)'),
    algorithms: [{ name: 'Compare-And-Swap (CAS)', summary: 'Lệnh phần cứng `CMPXCHG` kiểm tra giá trị hiện tại và ghi giá trị mới trong đúng 1 bước nguyên tử.', complexity: 'O(1) lock-free atomic' }],
    codeExample: { language: 'java', title: 'Sửa Race Condition bằng AtomicInteger (CAS) hoặc Lock', code: `// Sai: private int count = 0; count++;\n// Đúng (Lock-free CAS):\nAtomicInteger count = new AtomicInteger(0);\ncount.incrementAndGet();` },
    comparisons: [{ aspect: 'Phạm vi bảo đảm', optionA: 'volatile (Java/C++ atomic load): Bảo đảm Visibility/Ordering, KHÔNG bảo đảm compound count++', optionB: 'Atomic / Mutex: Bảo đảm cả Atomicity cho Read-Modify-Write' }],
    realWorldApplications: ['Lỗi trừ tiền kép trong hệ thống thanh toán nếu không khóa hàng/giao dịch hoặc dùng atomic update.'],
    commonMistakes: ['Nghĩ `volatile` trong Java là đủ để làm `count++` an toàn đa luồng — `volatile` không làm phép cộng trở thành nguyên tử!'],
    interviewQuestions: [{ question: 'Tại sao khai báo `volatile int count = 0` rồi nhiều thread cùng gọi `count++` vẫn bị sai?', answer: '`volatile` chỉ đảm bảo đọc/ghi đơn lẻ thấy ngay giá trị mới nhất từ RAM, còn `count++` là tổ hợp 3 bước Đọc-Cộng-Ghi có thể bị xen ngang giữa chừng.' }],
    exercises: [{ id: 'ex_0404_1', prompt: 'Viết 2 Java Threads mỗi thread cộng 100.000 lần vào biến `int` thường và quan sát kết quả nhỏ hơn 200.000.', solutionHint: 'Thử nghiệm xác nhận Lost Update rồi thay bằng `AtomicInteger`.' }],
  },
  {
    id: 'os_04_05',
    moduleId: 'os_m04',
    code: '04.05',
    title: 'Critical Sections & Synchronization Criteria',
    subtitle: '4 tiêu chuẩn vàng cho vùng găng: Mutual Exclusion, Progress, Bounded Waiting, Hardware Support.',
    tags: ['Critical Section', 'Petersons', 'TAS', 'CAS'],
    relatedTopicIds: ['os_04_04', 'os_06_01', 'os_06_04'],
    overview: 'Critical Section là đoạn mã truy cập tài nguyên dùng chung; mọi giải pháp đồng bộ hóa đúng đắn bắt buộc phải thỏa mãn 3 điều kiện chuẩn.',
    coreConcepts: ['Mutual Exclusion (Tối đa 1 luồng trong CS)', 'Progress (Không cản trở khi CS đang rảnh)', 'Bounded Waiting (Chống bỏ đói vô hạn)', 'Hardware Primitives (Test-And-Set, CAS)'],
    definitions: [{ term: 'Bounded Waiting', meaning: 'Phải có một giới hạn hữu hạn số lần các luồng khác được vào Critical Section trước khi một luồng đang chờ được phép vào.' }],
    detailedTheory: `### 3 Yêu cầu bắt buộc của lời giải Critical Section\n1. **Mutual Exclusion**: Tại một thời điểm chỉ có duy nhất 1 luồng được thực thi bên trong Critical Section.\n2. **Progress**: Nếu không có luồng nào đang ở trong CS, chỉ những luồng thực sự muốn vào mới tham gia quyết định và không được trì hoãn vô hạn.\n3. **Bounded Waiting**: Không luồng nào phải chờ mãi mãi vì luồng khác chen ngang liên tục.`,
    howItWorks: ['Entry Section: Xin phép vào vùng găng (Lock / CAS loop).', 'Critical Section: Đọc/ghi tài nguyên chung an toàn.', 'Exit Section: Nhả quyền để luồng kế tiếp vào.', 'Remainder Section: Code bình thường.'],
    diagram: defaultDiagram('Critical Section Guard', 'Entry Section (Acquire)', 'Critical Section (1 Thread)', 'Exit Section (Release)'),
    algorithms: [{ name: 'Test-And-Set (TAS)', summary: 'Lệnh phần cứng đọc giá trị cũ của biến lock và đặt nó thành 1 trong cùng 1 chu kỳ không thể ngắt.', complexity: 'O(1) hardware op' }],
    codeExample: { language: 'c', title: 'Cơ chế Spinlock đơn giản dùng C11 atomic_flag (Test-And-Set)', code: `atomic_flag lock = ATOMIC_FLAG_INIT;\nvoid enter_cs() { while (atomic_flag_test_and_set(&lock)) { /* spin */ } }\nvoid exit_cs()  { atomic_flag_clear(&lock); }` },
    comparisons: [{ aspect: 'Chiến lược chờ', optionA: 'Busy-Wait (Spinlock): Đốt CPU quay vòng liên tục', optionB: 'Sleep-Wait (Mutex OS): Nhường CPU đi ngủ chờ đánh thức' }],
    realWorldApplications: ['Kernel dùng Spinlock cho các Critical Section cực ngắn (chỉ vài lệnh) ở ngữ cảnh ngắt (Interrupt handler không được sleep!).'],
    commonMistakes: ['Dùng giải pháp phần mềm Peterson’s Algorithm trên CPU hiện đại mà quên Memory Barrier — CPU/Compiler có thể đảo thứ tự đọc/ghi làm vỡ logic.'],
    interviewQuestions: [{ question: 'Spinlock thỏa mãn Mutual Exclusion và Progress, nhưng nó có luôn đảm bảo Bounded Waiting không?', answer: 'Spinlock cơ bản dùng Test-And-Set KHÔNG đảm bảo Bounded Waiting; một luồng kém may mắn có thể thua liên tục trong cuộc đua TAS nếu không dùng Ticket Lock / Queue Lock.' }],
    exercises: [{ id: 'ex_0405_1', prompt: 'Giải thích cơ chế Ticket Lock hoạt động giống máy lấy số thứ tự ở ngân hàng để đảm bảo Bounded Waiting.', solutionHint: 'Gồm 2 biến `next_ticket` (dùng fetch_and_add) và `now_serving`; luồng chỉ vào khi `my_ticket == now_serving`.' }],
  },

  // =========================================================================
  // MODULE 05: CPU SCHEDULING
  // =========================================================================
  {
    id: 'os_05_01',
    moduleId: 'os_m05',
    code: '05.01',
    title: 'FCFS & Scheduling Metrics',
    subtitle: 'Tiêu chí đánh giá lập lịch (Turnaround, Waiting, Response Time) và hiện tượng Convoy Effect của FCFS.',
    tags: ['Scheduling', 'FCFS', 'Metrics'],
    relatedTopicIds: ['os_05_02', 'os_05_04', 'os_03_02'],
    overview: 'Trước khi học thuật toán lập lịch phức tạp, ta cần nắm 5 thước đo đánh giá và hiểu vì sao FIFO đơn giản (FCFS) thất bại khi tác vụ dài chạy trước tác vụ ngắn.',
    coreConcepts: ['Turnaround Time = Completion - Arrival', 'Waiting Time = Turnaround - Burst', 'Response Time = First Run - Arrival', 'Throughput vs Fairness & Convoy Effect'],
    definitions: [{ term: 'Convoy Effect', meaning: 'Hiện tượng một tiến trình CPU-bound cực nặng chạy trước khiến hàng loạt tiến trình ngắn phía sau phải xếp hàng chờ dài dằng dặc, làm tụt mạnh cả I/O utilization.' }],
    detailedTheory: `### Công thức cốt lõi\n- **Turnaround Time**: Tổng thời gian từ lúc tiến trình xuất hiện đến lúc hoàn tất.\n- **Response Time**: Thời gian từ lúc xuất hiện đến lúc được chạy *lần đầu tiên* (rất quan trọng với UI/Interactive).\n- **FCFS (First-Come, First-Served)**: Non-preemptive, đơn giản, không starvation, nhưng trung bình waiting time có thể rất lớn nếu job nặng đến trước.`,
    howItWorks: ['Duy trì hàng đợi FIFO theo thời điểm đến.', 'Lấy phần tử đầu hàng đợi giao cho CPU.', 'Chạy cho tới khi xong hoặc tự block I/O mới lấy phần tử tiếp theo.'],
    diagram: defaultDiagram('FCFS Convoy Effect', 'P1 (Burst 100ms) [Runs]', 'P2 (Burst 2ms) [Waits 100ms]', 'P3 (Burst 2ms) [Waits 102ms]'),
    algorithms: [{ name: 'FCFS (FIFO Queue)', summary: 'Chạy đúng theo thứ tự tiến trình vào Ready Queue.', complexity: 'O(1) enqueue/dequeue' }],
    codeExample: { language: 'text', title: 'Ví dụ tính Turnaround & Waiting cho FCFS', code: `Jobs đến cùng lúc t=0: P1=24, P2=3, P3=3\nThứ tự P1 -> P2 -> P3:\nWaiting: P1=0, P2=24, P3=27 -> Avg Wait = (0+24+27)/3 = 17\nNếu P2 -> P3 -> P1:\nWaiting: P2=0, P3=3, P1=6 -> Avg Wait = (0+3+6)/3 = 3!` },
    comparisons: [{ aspect: 'Ưu tiên hệ thống', optionA: 'Batch: Tối ưu Turnaround & Throughput', optionB: 'Interactive: Tối ưu Response Time' }],
    realWorldApplications: ['Hàng đợi tuần tự đơn giản trong các background job queue không cần độ ưu tiên.'],
    commonMistakes: ['Nhầm lẫn Turnaround Time (từ lúc đến đến lúc xong hẳn) với Response Time (từ lúc đến đến lúc có phản hồi đầu tiên).'],
    interviewQuestions: [{ question: 'Convoy Effect trong FCFS là gì?', answer: 'Khi một tiến trình tốn nhiều CPU chiếm dụng lõi lâu ở đầu hàng đợi, mọi tiến trình ngắn phía sau phải chờ đợi dây chuyền, làm tăng vọt thời gian chờ trung bình.' }],
    exercises: [{ id: 'ex_0501_1', prompt: 'Tính Turnaround trung bình cho 3 job A(0, 8), B(1, 4), C(2, 2) theo FCFS.', solutionHint: 'A xong t=8 (TA=8), B xong t=12 (TA=11), C xong t=14 (TA=12). Avg TA = 31/3 = 10.33.' }],
  },
  {
    id: 'os_05_02',
    moduleId: 'os_m05',
    code: '05.02',
    title: 'SJF & SRTF (Shortest Job / Remaining Time First)',
    subtitle: 'Thuật toán tối ưu hóa Average Waiting Time và bài toán khó: làm sao biết trước tương lai?',
    tags: ['SJF', 'SRTF', 'Preemptive'],
    relatedTopicIds: ['os_05_01', 'os_05_03', 'os_05_04'],
    overview: 'Chạy công việc ngắn nhất trước chứng minh được là tối ưu cho Average Waiting Time, nhưng trong thực tế OS không thể biết trước chính xác độ dài CPU burst.',
    coreConcepts: ['SJF (Non-preemptive)', 'SRTF (Preemptive Shortest Remaining Time First)', 'Exponential Averaging Prediction', 'Starvation of Long Jobs'],
    definitions: [{ term: 'SRTF', meaning: 'Biến thể có quyền ngắt (preemptive) của SJF: nếu có job mới đến với thời gian còn lại nhỏ hơn phần còn lại của job đang chạy, OS ngắt ngay để nhường job mới.' }],
    detailedTheory: `### Công thức dự đoán CPU Burst tiếp theo\n$$\\tau_{n+1} = \\alpha t_n + (1 - \\alpha)\\tau_n$$\nTrong đó $t_n$ là độ dài thực tế của burst vừa qua, $\\tau_n$ là dự đoán cũ, $\\alpha \\in [0, 1]$ (thường chọn 0.5).`,
    howItWorks: ['Dùng Min-Heap theo thời gian burst dự kiến (hoặc remaining time).', 'Mỗi lần có job mới hoặc job cũ xong, kiểm tra đỉnh Min-Heap.', 'Với SRTF, ngắt job hiện tại nếu đỉnh heap nhỏ hơn phần còn lại.'],
    diagram: defaultDiagram('SRTF Preemption', 'P1 (rem: 6ms) running', 'P2 arrives (burst: 2ms)', 'Preempt -> Run P2 first'),
    algorithms: [{ name: 'SJF / SRTF', summary: 'Chọn tiến trình có thời gian thực thi còn lại ngắn nhất.', complexity: 'O(log n) với Min-Heap' }],
    codeExample: { language: 'text', title: 'Minh họa SRTF: A(0, 8), B(1, 4)', code: `t=0..1: chạy A (còn 7)\nt=1: B đến với burst=4 < A_rem=7 -> Preempt!\nt=1..5: chạy B xong\nt=5..12: chạy nốt A` },
    comparisons: [{ aspect: 'Tối ưu vs Thực tế', optionA: 'SJF/SRTF: Tối ưu Average Waiting Time', optionB: 'Hạn chế: Cần biết trước burst time & gây Starvation cho job dài' }],
    realWorldApplications: ['Hệ thống batch phân tích dữ liệu biết trước kích thước job hoặc ước lượng từ lịch sử chạy.'],
    commonMistakes: ['Quên rằng SRTF không tối ưu Response Time tổng thể nếu có luồng job ngắn liên tục chen ngang làm job dài bị bỏ đói.'],
    interviewQuestions: [{ question: 'Tại sao OS thực tế (Linux/Windows) không cài đặt SJF thuần túy?', answer: 'Vì OS không thể biết trước chính xác một tiến trình sẽ dùng CPU bao lâu trước khi nó block hoặc kết thúc, đồng thời SJF dễ làm tiến trình dài bị starvation.' }],
    exercises: [{ id: 'ex_0502_1', prompt: 'Tính Avg Waiting Time cho A(0,7), B(2,4), C(4,1) theo SRTF.', solutionHint: 't=0..2(A:5), t=2..4(B:2), t=4..5(C xong), t=5..7(B xong), t=7..12(A xong). Avg Wait = ((12-7) + (7-2-4) + (5-4-1))/3 = 2.' }],
  },
  {
    id: 'os_05_03',
    moduleId: 'os_m05',
    code: '05.03',
    title: 'Priority Scheduling & Priority Inversion',
    subtitle: 'Lập lịch theo mức độ quan trọng, lỗi sập tàu Mars Pathfinder và giải pháp Priority Inheritance.',
    tags: ['Priority', 'Aging', 'Priority Inversion'],
    relatedTopicIds: ['os_05_02', 'os_06_01', 'os_01_04'],
    overview: 'Gán độ ưu tiên giúp tác vụ quan trọng chạy trước, nhưng có hai cạm bẫy kinh điển: Starvation và Priority Inversion.',
    coreConcepts: ['Static vs Dynamic Priority', 'Aging (Tăng dần độ ưu tiên khi chờ lâu)', 'Priority Inversion Bug', 'Priority Inheritance Protocol'],
    definitions: [{ term: 'Priority Inversion', meaning: 'Tiến trình ưu tiên Cao bị kẹt chờ Lock do tiến trình ưu tiên Thấp giữ, nhưng tiến trình Thấp đó lại bị tiến trình Trung bình cướp CPU khiến cả hai cùng đứng hình.' }],
    detailedTheory: `### Vụ lỗi Mars Pathfinder (1997)\nTàu tự hành sao Hỏa liên tục tự reboot vì lỗi **Priority Inversion**:\n1. Task Low giữ Mutex bus dữ liệu.\n2. Task High cần Mutex đó nên bị block chờ Low.\n3. Hàng loạt Task Medium không liên quan cướp CPU của Task Low → Task Low không chạy xong để nhả Mutex → Task High quá hạn Watchdog → Reboot!\n\n**Cách sửa**: Bật **Priority Inheritance** — tạm thời nâng độ ưu tiên của Task Low lên bằng Task High khi đang giữ Mutex đó.`,
    howItWorks: ['Gán số ưu tiên cho mỗi tiến trình/thread.', 'Scheduler luôn lấy mức ưu tiên cao nhất.', 'Áp dụng Aging sau mỗi T chu kỳ để chống Starvation.', 'Áp dụng Priority Inheritance trên Mutex thời gian thực.'],
    diagram: defaultDiagram('Priority Inversion Fix', 'High Task (Needs Lock)', 'Medium Tasks (Preempt)', 'Low Task (Inherits High!)'),
    algorithms: [{ name: 'Aging + Priority Inheritance', summary: 'Tăng priority theo thời gian chờ và truyền tạm priority cao cho chủ sở hữu lock.', complexity: 'O(1) priority update' }],
    codeExample: { language: 'c', title: 'Bật Priority Inheritance cho POSIX Mutex', code: `pthread_mutexattr_t attr;\npthread_mutexattr_init(&attr);\npthread_mutexattr_setprotocol(&attr, PTHREAD_PRIO_INHERIT);` },
    comparisons: [{ aspect: 'Chiến lược', optionA: 'Strict Priority: Nhanh cho tác vụ khẩn cấp, dễ starvation', optionB: 'Priority + Aging: Bảo đảm công bằng dài hạn' }],
    realWorldApplications: ['Linux `nice` values (-20 đến +19) và Real-Time Mutex `PI_FUTEX`.'],
    commonMistakes: ['Quên rằng ở một số hệ thống (như Linux `nice`), số CÀNG NHỎ thì độ ưu tiên CÀNG CAO.'],
    interviewQuestions: [{ question: 'Priority Inversion là gì và cách khắc phục?', answer: 'Là tình huống luồng ưu tiên cao bị gián tiếp chặn bởi luồng trung bình vì phải chờ khóa từ luồng ưu tiên thấp. Khắc phục bằng Priority Inheritance hoặc Priority Ceiling.' }],
    exercises: [{ id: 'ex_0503_1', prompt: 'Mô tả kịch bản 3 luồng L, M, H gây Priority Inversion.', solutionHint: 'L giữ lock -> H cần lock nên block -> M đến chạy đè L -> H kẹt chờ M.' }],
  },
  {
    id: 'os_05_04',
    moduleId: 'os_m05',
    code: '05.04',
    title: 'Round Robin (RR) Scheduling',
    subtitle: 'Time-sharing công bằng với Time Quantum `q`: cân bằng Response Time và Context Switch Overhead.',
    tags: ['Round Robin', 'Time Quantum', 'Time-Sharing'],
    relatedTopicIds: ['os_05_01', 'os_05_05', 'os_03_04'],
    overview: 'Round Robin chia đều từng lát cắt thời gian cố định `q` (Time Quantum) xoay vòng cho tất cả tiến trình trong Ready Queue.',
    coreConcepts: ['Time Quantum (q)', 'Circular FIFO Ready Queue', 'No Starvation Guarantee', 'Trade-off: q quá nhỏ vs q quá lớn'],
    definitions: [{ term: 'Time Quantum', meaning: 'Khoảng thời gian tối đa một tiến trình được chạy liên tục trên CPU trước khi bị timer ngắt và đưa xuống cuối hàng đợi.' }],
    detailedTheory: `### Nghệ thuật chọn Time Quantum \`q\`\n- Nếu \`q\` **quá lớn** (vd 10 giây) → Round Robin thoái hóa thành **FCFS**, giết chết độ mượt UI.\n- Nếu \`q\` **quá nhỏ** (vd 0.05ms, gần bằng chi phí Context Switch) → **CPU đốt phần lớn năng lực cho việc chuyển ngữ cảnh** thay vì làm việc có ích.\n- Thực tế hiện đại thường chọn lát cắt từ **4ms – 20ms** (chi phí context switch chiếm <1–5%).`,
    howItWorks: ['Đưa tất cả tiến trình sẵn sàng vào hàng đợi vòng.', 'Chạy tiến trình đầu trong tối đa `q` ms.', 'Nếu xong sớm hoặc block I/O → chuyển ngay tiến trình kế tiếp.', 'Nếu hết `q` → Preempt và đưa xuống cuối hàng đợi.'],
    diagram: defaultDiagram('Round Robin Cycle', 'Queue: [P1, P2, P3]', 'CPU Slice (q = 10ms)', 'End of q -> Back of Queue'),
    algorithms: [{ name: 'Round Robin', summary: 'Nếu có n tiến trình, mỗi tiến trình đợi tối đa `(n-1)*q` cho lần phản hồi kế tiếp.', complexity: 'O(1) queue rotation' }],
    codeExample: { language: 'text', title: 'Gantt Chart với q = 4ms cho P1(24), P2(3), P3(3)', code: `[0..4: P1] [4..7: P2 xong] [7..10: P3 xong] [10..14: P1] ... [30: P1 xong]\nResponse Time: P1=0, P2=4, P3=7 (cực tốt so với FCFS!)` },
    comparisons: [{ aspect: 'Tính chất', optionA: 'FCFS: Avg Turnaround có thể nhỏ hơn RR nếu job đều nhau', optionB: 'RR: Vượt trội về Response Time & không bỏ đói job ngắn' }],
    realWorldApplications: ['Nền tảng của hầu hết hệ thống chia sẻ thời gian và một phần logic bên dưới Linux Real-Time `SCHED_RR`.'],
    commonMistakes: ['Nghĩ giảm `q` càng nhỏ thì máy càng mượt — `q` nhỏ hơn 1ms sẽ khiến Context Switch overhead ăn hết CPU.'],
    interviewQuestions: [{ question: 'Điều gì xảy ra khi Time Quantum tiến tới vô cực hoặc tiến tới 0?', answer: 'Tiến tới vô cực: RR trở thành FCFS. Tiến tới 0: tốn quá nhiều Context Switch, throughput gần bằng 0.' }],
    exercises: [{ id: 'ex_0504_1', prompt: 'Nếu Context Switch mất 1ms và Time Quantum là 4ms, phần trăm CPU bị hao phí tối đa là bao nhiêu?', solutionHint: '1 / (4 + 1) = 20% CPU dành cho context switch!' }],
  },
  {
    id: 'os_05_05',
    moduleId: 'os_m05',
    code: '05.05',
    title: 'Multilevel Feedback Queue (MLFQ) & Linux CFS',
    subtitle: 'Bộ lập lịch thông minh ngoài đời thực: tự học hành vi I/O vs CPU mà không cần đoán trước tương lai.',
    tags: ['MLFQ', 'CFS', 'EEVDF', 'Linux Scheduler'],
    relatedTopicIds: ['os_05_02', 'os_05_03', 'os_05_04'],
    overview: 'MLFQ (và trên Linux hiện đại là CFS / EEVDF) giải quyết bài toán tưởng như bất khả thi: vừa tối ưu Response cho tác vụ tương tác (giống SJF), vừa công bằng không bỏ đói tiến trình nặng.',
    coreConcepts: ['5 Quy tắc vàng của MLFQ (OSTEP)', 'Priority Boost chống Starvation', 'Linux Completely Fair Scheduler (vruntime + Red-Black Tree)', 'EEVDF (Linux 6.6+)'],
    definitions: [{ term: 'vruntime (Virtual Runtime)', meaning: 'Trong Linux CFS, thước đo lượng thời gian CPU mà tiến trình đã tiêu thụ (đã hiệu chỉnh theo trọng số nice); CFS luôn chọn tiến trình có `vruntime` nhỏ nhất.' }],
    detailedTheory: `### 5 Luật của MLFQ (OSTEP)\n1. Nếu Priority(A) > Priority(B), A chạy.\n2. Nếu Priority(A) == Priority(B), A và B chạy Round Robin.\n3. Tiến trình mới vào luôn được đặt ở **hàng đợi cao nhất** (giả định nó ngắn/tương tác).\n4. Dùng hết toàn bộ Time Allotment ở mức hiện tại → **bị giáng cấp** xuống hàng đợi thấp hơn (nhận diện CPU-bound).\n5. Sau mỗi chu kỳ $S$ → **Priority Boost** đẩy toàn bộ lên hàng đợi cao nhất (chống Starvation & thích nghi khi job đổi hành vi).`,
    howItWorks: ['Interactive job nhả CPU sớm cho I/O nên giữ nguyên độ ưu tiên cao.', 'CPU-bound job xài hết time slice nên bị hạ dần xuống hàng đợi nền.', 'Linux CFS dùng Red-Black Tree sắp xếp theo `vruntime` với thời gian chọn O(1) (cached leftmost node).'],
    diagram: defaultDiagram('MLFQ Hierarchy', 'Q3 [High - Interactive]', 'Q2 [Medium - Demoted]', 'Q1 [Low - CPU Batch] -> Boost ↑'),
    algorithms: [{ name: 'CFS Red-Black Tree', summary: 'Cây nhị phân cân bằng sắp theo `vruntime`; chọn nút trái nhất làm tiến trình kế tiếp.', complexity: 'O(1) pick, O(log n) insert' }],
    codeExample: { language: 'bash', title: 'Xem thông số lập lịch & vruntime của tiến trình hiện tại trên Linux', code: `cat /proc/self/sched | head -n 15\n# Quan sát se.vruntime, nr_switches, wait_sum` },
    comparisons: [{ aspect: 'Chiến lược công bằng', optionA: 'MLFQ: Nhiều tầng hàng đợi tách biệt I/O vs CPU', optionB: 'Linux CFS/EEVDF: Chia tỷ lệ thời gian CPU liên tục qua vruntime' }],
    realWorldApplications: ['Windows Dispatcher, FreeBSD ULE, macOS Mach Scheduler dùng biến thể MLFQ; Linux kernel dùng CFS (từ 2.6.23) và chuyển dần sang EEVDF (từ 6.6).'],
    commonMistakes: ['Không có quy tắc số 4 (tính tổng thời gian ở mỗi tầng) khiến tiến trình gian lận: dùng 99% quantum rồi gọi 1 I/O giả để mãi ở hàng ưu tiên cao nhất.'],
    interviewQuestions: [{ question: 'MLFQ giải quyết nhược điểm "không biết trước thời gian chạy" của SJF bằng cách nào?', answer: 'Mọi tiến trình mới được ưu tiên như job ngắn; nếu nó ngốn hết CPU liên tục thì bị hạ dần mức ưu tiên, còn nếu nó hay nhả CPU đợi I/O thì vẫn giữ được phản hồi nhanh.' }],
    exercises: [{ id: 'ex_0505_1', prompt: 'Giải thích điều gì xảy ra với một tiến trình batch lâu năm nếu MLFQ thiếu quy tắc Priority Boost.', solutionHint: 'Nếu liên tục có tác vụ tương tác đến ở tầng trên, tiến trình batch ở tầng đáy sẽ bị bỏ đói (starvation) vĩnh viễn.' }],
  }
);

// Modules 06–12 (35 topics, covering Memory, Sync, FS, I/O, Storage, Security, Virtualization/Distributed)
RAW_TOPIC_SEEDS.push(
  // =========================================================================
  // MODULE 06: PROCESS SYNCHRONIZATION
  // =========================================================================
  {
    id: 'os_06_01',
    moduleId: 'os_m06',
    code: '06.01',
    title: 'Mutex Locks & Futex',
    subtitle: 'Khóa loại trừ tương hỗ, quyền sở hữu khóa và cách Linux Futex kết hợp Spin + Sleep.',
    tags: ['Mutex', 'Futex', 'Ownership'],
    relatedTopicIds: ['os_04_04', 'os_04_05', 'os_06_02', 'os_06_05'],
    overview: 'Mutex (Mutual Exclusion) là khóa nhị phân bảo vệ tài nguyên dùng chung với khái niệm Ownership: chỉ luồng nào khóa thì luồng đó mới được phép mở.',
    coreConcepts: ['Lock / Unlock Semantics', 'Strict Ownership', 'Futex (Fast Userspace Mutex)', 'Reentrant vs Non-reentrant Mutex'],
    definitions: [{ term: 'Futex (Fast Userspace Mutex)', meaning: 'Cơ chế Linux kiểm tra xem khóa có tranh chấp không ở ngay User Space (nhờ atomic CAS); chỉ gọi syscall vào Kernel ngủ khi thực sự có tranh chấp.' }],
    detailedTheory: `### Uncontended vs Contended Path\nNếu bạn chạy đơn luồng hoặc ít va chạm, gọi Kernel syscall cho mỗi \`lock()/unlock()\` quá tốn kém. **Futex** kiểm tra số nguyên trạng thái ở User Space: nếu khóa rảnh, chiếm luôn trong vài nanoseconds mà **không hề gọi Kernel**. Chỉ khi khóa đã bị giữ, thread mới gọi \`futex(FUTEX_WAIT)\` đi ngủ.`,
    howItWorks: ['Thread thử chiếm khóa qua CAS.', 'Thành công → vào Critical Section.', 'Thất bại → đưa vào wait queue của Kernel ngủ cho đến khi chủ sở hữu gọi `unlock()` và `FUTEX_WAKE`.'],
    diagram: defaultDiagram('Futex Fast Path', 'Atomic CAS in User Space', 'Free? Acquire immediately', 'Busy? Syscall FUTEX_WAIT'),
    algorithms: [{ name: 'Adaptive Mutex', summary: 'Thử spin vài chục vòng đề phòng chủ khóa sắp nhả; nếu chưa xong mới chuyển sang ngủ.', complexity: 'O(1) uncontended' }],
    codeExample: { language: 'java', title: 'ReentrantLock bảo vệ Critical Section luôn dùng try-finally', code: `private final ReentrantLock lock = new ReentrantLock();\nlock.lock();\ntry { /* critical section */ } finally { lock.unlock(); }` },
    comparisons: [{ aspect: 'Đặc tính', optionA: 'Mutex: Có ownership, dùng để bảo vệ vùng nhớ/tài nguyên', optionB: 'Binary Semaphore: Không có ownership, luồng B có thể post mở cho luồng A' }],
    realWorldApplications: ['`std::mutex` C++', '`pthread_mutex_t`', '`java.util.concurrent.locks.ReentrantLock`'],
    commonMistakes: ['Quên `unlock()` khi xảy ra ngoại lệ hoặc `return` sớm, gây treo vĩnh viễn mọi luồng khác.'],
    interviewQuestions: [{ question: 'Mutex và Binary Semaphore khác nhau ở điểm quan trọng nhất nào?', answer: 'Mutex có khái niệm ownership (chỉ thread nào lock mới unlock được và hỗ trợ Priority Inheritance), còn Semaphore là cơ chế phát tín hiệu không sở hữu (thread này wait, thread khác có thể signal).' }],
    exercises: [{ id: 'ex_0601_1', prompt: 'Điều gì xảy ra nếu Thread 1 khóa một Non-reentrant Mutex hai lần liên tiếp trong đệ quy?', solutionHint: 'Self-deadlock: Thread 1 tự chờ chính mình nhả khóa!' }],
  },
  {
    id: 'os_06_02',
    moduleId: 'os_m06',
    code: '06.02',
    title: 'Semaphores & Classic Concurrency Problems',
    subtitle: 'Counting Semaphore, bài toán Producer–Consumer và Readers–Writers.',
    tags: ['Semaphore', 'Producer-Consumer', 'Bounded Buffer'],
    relatedTopicIds: ['os_06_01', 'os_06_03', 'os_04_04'],
    overview: 'Phát minh bởi Edsger Dijkstra, Semaphore là biến đếm nguyên tử hỗ trợ hai thao tác `wait(P)` và `signal(V)` để giới hạn số luồng hoặc báo hiệu thứ tự thực thi.',
    coreConcepts: ['Counting Semaphore (K permits)', 'wait() / sem_wait (giảm, block nếu < 0)', 'signal() / sem_post (tăng, đánh thức)', 'Producer–Consumer & Readers–Writers'],
    definitions: [{ term: 'Counting Semaphore', meaning: 'Semaphore khởi tạo bằng K cho phép tối đa K luồng truy cập đồng thời một nhóm tài nguyên (vd: Connection Pool 10 kết nối).' }],
    detailedTheory: `### Mô hình Producer–Consumer chuẩn với 3 đồng bộ\n- \`empty = N\`: đếm số ô trống trong buffer.\n- \`full = 0\`: đếm số phần tử đã sẵn sàng.\n- \`mutex = 1\`: bảo vệ thao tác chèn/lấy khỏi buffer.\n\n**Quy tắc thứ tự**: Luôn \`wait(empty)\` hoặc \`wait(full)\` **TRƯỚC** khi \`wait(mutex)\` để tránh Deadlock!`,
    howItWorks: ['Producer gọi `wait(empty)`, khóa `mutex`, ghi dữ liệu, mở `mutex`, gọi `post(full)`.', 'Consumer gọi `wait(full)`, khóa `mutex`, đọc dữ liệu, mở `mutex`, gọi `post(empty)`.'],
    diagram: defaultDiagram('Producer-Consumer', 'Producer -> wait(empty)', 'Ring Buffer [Mutex]', 'Consumer -> wait(full)'),
    algorithms: [{ name: 'Semaphore Ordering', summary: 'Dùng semaphore khởi tạo bằng 0 làm rào chắn thứ tự (Thread A xong mới post cho Thread B chạy).', complexity: 'O(1) wait/post' }],
    codeExample: { language: 'java', title: 'Giới hạn số luồng truy cập DB Pool bằng Java Semaphore', code: `Semaphore dbPool = new Semaphore(10);\ndbPool.acquire();\ntry { queryDatabase(); } finally { dbPool.release(); }` },
    comparisons: [{ aspect: 'Ứng dụng', optionA: 'Semaphore: Quản lý N slot hữu hạn / Ordering', optionB: 'Mutex: Bảo vệ quyền độc quyền 1 luồng tại vùng găng' }],
    realWorldApplications: ['Rate limiter / Connection Pool', 'Backpressure giữa Producer và Consumer trong pipeline dữ liệu.'],
    commonMistakes: ['Đảo ngược thứ tự thành `wait(mutex)` rồi mới `wait(empty)` → Khi buffer đầy, Producer giữ `mutex` đi ngủ khiến Consumer không bao giờ vào lấy được hàng để nhả `empty` → Deadlock!'],
    interviewQuestions: [{ question: 'Trong Producer-Consumer dùng Semaphore, tại sao phải khóa `empty`/`full` trước `mutex`?', answer: 'Nếu giữ `mutex` trước rồi mới chờ `empty` khi buffer đầy (hoặc chờ `full` khi buffer rỗng), luồng còn lại không thể lấy được `mutex` để thay đổi trạng thái buffer, dẫn đến Deadlock.' }],
    exercises: [{ id: 'ex_0602_1', prompt: 'Phân tích cách dùng Read-Write Lock để nhiều Reader đọc cùng lúc nhưng Writer phải độc quyền.', solutionHint: 'Reader đầu tiên khóa write_lock cho nhóm; Reader cuối cùng mới nhả write_lock.' }],
  },
  {
    id: 'os_06_03',
    moduleId: 'os_m06',
    code: '06.03',
    title: 'Monitors & Condition Variables',
    subtitle: 'Tránh bẫy Lost Wakeup & Spurious Wakeup bằng cấu trúc `while (!cond) wait()`.',
    tags: ['Monitor', 'Condition Variable', 'Mesa Semantics'],
    relatedTopicIds: ['os_06_01', 'os_06_02'],
    overview: 'Monitor đóng gói dữ liệu chung, khóa Mutex và các Condition Variable vào một lớp an toàn, giúp code đồng bộ sạch và ít lỗi hơn Semaphore thuần.',
    coreConcepts: ['Mutual Exclusion + Wait Set', 'Condition Variable (`wait`, `signal/notify`, `broadcast/notifyAll`)', 'Mesa Semantics vs Hoare Semantics', 'Spurious Wakeups'],
    definitions: [{ term: 'Mesa Semantics', meaning: 'Khi Thread A gọi `signal()` đánh thức Thread B, A tiếp tục giữ lock chạy tiếp; khi B tỉnh lại và giành lại lock, điều kiện có thể đã bị luồng C chen ngang làm thay đổi — nên B BẮT BUỘC dùng vòng lặp `while`.' }],
    detailedTheory: `### Luật vàng bất biến của Condition Variable\n**Không bao giờ viết \`if (!ready) wait()\`, LUÔN viết \`while (!ready) wait()\`!**\nLý do:\n1. **Mesa semantics**: Một luồng thứ ba có thể lấy tài nguyên ngay giữa lúc \`notify()\` và lúc bạn nhận lại Mutex.\n2. **Spurious wakeup**: Hệ điều hành (POSIX/JVM) được phép đánh thức luồng vô cớ để tối ưu hóa nhân.`,
    howItWorks: ['Thread vào Monitor (chiếm Mutex).', 'Kiểm tra điều kiện bằng vòng `while (!cond)`.', 'Gọi `wait()` → OS **tự động nhả Mutex và đưa thread vào ngủ trong 1 bước nguyên tử**.', 'Khi được `signal()`, thread tranh lại Mutex rồi kiểm tra tiếp vòng `while`.'],
    diagram: defaultDiagram('Monitor Entry & Wait', 'Acquire Monitor Lock', 'while(!cond) cond.wait()', 'Re-acquire Lock & Proceed'),
    algorithms: [{ name: 'Atomic Release-and-Sleep', summary: '`cond_wait(cv, mutex)` mở khóa và ngủ nguyên tử để tránh Lost Wakeup giữa bước kiểm tra và bước ngủ.', complexity: 'O(1)' }],
    codeExample: { language: 'java', title: 'Blocking Queue dùng ReentrantLock + 2 Condition Variables', code: `lock.lock();\ntry {\n  while (queue.isEmpty()) notEmpty.await(); // LUÔN dùng while!\n  T item = queue.remove();\n  notFull.signal();\n  return item;\n} finally { lock.unlock(); }` },
    comparisons: [{ aspect: 'Ngữ nghĩa signal()', optionA: 'Hoare: Nhường CPU & Lock ngay cho luồng vừa được gọi (ít dùng)', optionB: 'Mesa (Java/POSIX/C++): Luồng gọi chạy tiếp, bắt buộc dùng `while`' }],
    realWorldApplications: ['`synchronized` + `wait()`/`notifyAll()` trong Java', '`std::condition_variable` C++', '`BlockingQueue`'],
    commonMistakes: ['Dùng `if` thay `while` khi gọi `await()`/`wait()`.', 'Gọi `notify()` mà quên thay đổi biến điều kiện bên trong khóa, gây Lost Wakeup.'],
    interviewQuestions: [{ question: 'Tại sao thao tác `cond.wait(mutex)` bắt buộc phải nhận vào Mutex và nhả Mutex một cách nguyên tử?', answer: 'Nếu kiểm tra điều kiện xong, nhả Mutex rồi mới gọi ngủ làm 2 bước rời, luồng khác có thể chen vào đúng khe hở đó và gọi `signal()` trước khi luồng này ngủ → Lost Wakeup vĩnh viễn.' }],
    exercises: [{ id: 'ex_0603_1', prompt: 'Phân biệt khi nào dùng `notify()` (`signal`) và khi nào bắt buộc dùng `notifyAll()` (`broadcast`).', solutionHint: 'Nếu nhiều thread chờ các điều kiện khác nhau trên cùng 1 lock hoặc wake-up nhiều reader cùng lúc, dùng `notifyAll()`.' }],
  },
  {
    id: 'os_06_04',
    moduleId: 'os_m06',
    code: '06.04',
    title: 'Deadlock: 4 Coffman Conditions & Handling',
    subtitle: 'Nhận diện, phòng ngừa (Lock Ordering), tránh né (Banker) và phát hiện bế tắc.',
    tags: ['Deadlock', 'Coffman', 'Lock Ordering'],
    relatedTopicIds: ['os_06_01', 'os_06_05'],
    overview: 'Deadlock là trạng thái bế tắc vĩnh viễn khi một nhóm luồng mỗi luồng đang giữ một tài nguyên và đồng thời chờ tài nguyên do luồng khác trong nhóm nắm giữ.',
    coreConcepts: ['1. Mutual Exclusion', '2. Hold and Wait', '3. No Preemption', '4. Circular Wait', 'Prevention / Avoidance / Detection'],
    definitions: [{ term: 'Coffman Conditions', meaning: '4 điều kiện CẦN xảy ra đồng thời mới tạo thành Deadlock; chỉ cần phá vỡ 1 trong 4 điều kiện là Deadlock không thể xảy ra.' }],
    detailedTheory: `### Phá vỡ 1 trong 4 điều kiện Coffman\nCách hiệu quả và phổ biến nhất ngoài đời thực là **phá Circular Wait (Chờ vòng tròn)** bằng **Total Lock Ordering**:\n- Quy ước mọi nơi trong codebase đều phải khóa \`L1\` trước \`L2\` (theo thứ tự ID tăng dần), không bao giờ ngược lại.\n- Hoặc dùng \`tryLock()\` với backoff (phá Hold-and-Wait).`,
    howItWorks: ['Xây dựng Wait-For Graph (đồ thị có hướng).', 'Nếu đồ thị có chu trình (cycle) → Deadlock đã xảy ra.', 'Để phòng ngừa, sắp thứ tự mọi tài nguyên trước khi khóa.'],
    diagram: defaultDiagram('Deadlock Cycle', 'T1 holds R1, wants R2', 'Circular Wait Cycle', 'T2 holds R2, wants R1'),
    algorithms: [{ name: 'Resource Allocation Graph / Cycle Detection', summary: 'Dùng DFS tìm chu trình trên đồ thị Wait-For để phát hiện Deadlock.', complexity: 'O(V + E)' }],
    codeExample: { language: 'java', title: 'Sửa Deadlock chuyển tiền giữa 2 Account bằng Lock Ordering', code: `Account first = a.id < b.id ? a : b;\nAccount second = a.id < b.id ? b : a;\nsynchronized (first) {\n  synchronized (second) { transfer(a, b, amount); }\n}` },
    comparisons: [{ aspect: 'Chiến lược', optionA: 'Lock Ordering: Đơn giản, không tốn chi phí runtime', optionB: 'Banker’s Algorithm: Cần biết trước max tài nguyên (chủ yếu lý thuyết)' }],
    realWorldApplications: ['Database InnoDB tự động phát hiện deadlock giữa các transaction bằng wait-for graph và rollback transaction ít tốn kém hơn.'],
    commonMistakes: ['Bỏ qua thứ tự khóa khi 2 phương thức ở 2 class khác nhau khóa lồng nhau ngược chiều.'],
    interviewQuestions: [{ question: 'Nêu 4 điều kiện cần để xảy ra Deadlock và cách khắc phục thực tế nhất?', answer: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Cách thực tế nhất là ép thứ tự khóa thống nhất (Lock Ordering) để triệt tiêu Circular Wait.' }],
    exercises: [{ id: 'ex_0604_1', prompt: 'Phân tích bài toán 5 Nhà Triết Gia Ăn Tối (Dining Philosophers) và cách dùng thứ tự đũa để hết deadlock.', solutionHint: 'Cho 4 triết gia cầm đũa trái trước, riêng triết gia cuối cùng cầm đũa phải trước (phá đối xứng/chu trình).' }],
  },
  {
    id: 'os_06_05',
    moduleId: 'os_m06',
    code: '06.05',
    title: 'Livelock, Starvation & Lock-Free Basics',
    subtitle: 'Phân biệt Deadlock (đứng im) vs Livelock (nhường nhau mãi) vs Starvation (bị bỏ đói).',
    tags: ['Livelock', 'Starvation', 'Lock-Free', 'ABA Problem'],
    relatedTopicIds: ['os_06_04', 'os_05_03', 'os_04_04'],
    overview: 'Không bị Deadlock không có nghĩa là hệ thống đã chạy xong: các luồng vẫn có thể tự triệt tiêu tiến độ qua Livelock hoặc Starvation.',
    coreConcepts: ['Deadlock (Blocked)', 'Livelock (Active nhưng không tiến triển)', 'Starvation (Mất lượt vĩnh viễn)', 'ABA Problem trong CAS Lock-Free'],
    definitions: [{ term: 'Livelock', meaning: 'Hai luồng liên tục đổi trạng thái để phản ứng với nhau (giống hai người tránh nhau qua lại ở hành lang hẹp) nên đều bận CPU 100% mà chẳng ai đi qua được.' }],
    detailedTheory: `### Bẫy ABA trong lập trình Lock-Free (CAS)\nThread 1 đọc giá trị \`A\`, bị tạm dừng.\nThread 2 đổi \`A -> B -> A\`.\nThread 1 tỉnh dậy gọi \`CAS(expected=A, new=C)\` thấy vẫn là \`A\` nên thành công — dù cấu trúc danh sách liên kết phía sau đã đổi hoàn toàn!\n**Cách giải**: Dùng Tagged Pointer / Version Stamp (\`(ptr, version)\`).`,
    howItWorks: ['Phát hiện luồng chờ bất thường.', 'Thêm Randomized Exponential Backoff để phá Livelock.', 'Dùng Fair Lock / Aging để phá Starvation.'],
    diagram: defaultDiagram('Progress Failures', 'Deadlock (Sleep Forever)', 'Livelock (Retry Loop Forever)', 'Starvation (Low Prio Skipped)'),
    algorithms: [{ name: 'Randomized Backoff', summary: 'Chờ ngẫu nhiên trước khi thử khóa lại để tránh hai luồng đụng độ đồng pha mãi mãi.', complexity: 'Probabilistic O(1)' }],
    codeExample: { language: 'java', title: 'Sửa ABA Problem bằng AtomicStampedReference', code: `AtomicStampedReference<Node> head = new AtomicStampedReference<>(init, 0);\nint stamp = head.getStamp();\nhead.compareAndSet(oldNode, newNode, stamp, stamp + 1);` },
    comparisons: [{ aspect: 'Trạng thái CPU', optionA: 'Deadlock: Các luồng ngủ (0% CPU)', optionB: 'Livelock: Các luồng chạy quay vòng liên tục (100% CPU)' }],
    realWorldApplications: ['Ethernet CSMA/CD & Retry HTTP client dùng Exponential Backoff + Jitter để chống Livelock diện rộng.'],
    commonMistakes: ['Thấy không dùng Mutex nên kết luận thuật toán không thể treo — Livelock vẫn có thể làm kẹt hoàn toàn ngay cả với CAS!'],
    interviewQuestions: [{ question: 'Phân biệt Deadlock, Livelock và Starvation?', answer: 'Deadlock là kẹt đứng im chờ lẫn nhau; Livelock là các luồng chủ động nhường/thử lại đồng pha nên bận rộn nhưng không tiến lên; Starvation là một luồng hợp lệ bị xếp sau mãi mãi không được cấp tài nguyên.' }],
    exercises: [{ id: 'ex_0605_1', prompt: 'Thêm Jitter ngẫu nhiên vào vòng `tryLock()` giữa 2 thread để loại bỏ Livelock.', solutionHint: 'Nếu `lockB.tryLock()` thất bại, nhả `lockA` và `Thread.sleep(random(1..5))`.' }],
  },

  // =========================================================================
  // MODULE 07: MEMORY MANAGEMENT
  // =========================================================================
  {
    id: 'os_07_01',
    moduleId: 'os_m07',
    code: '07.01',
    title: 'Memory Allocation & Fragmentation',
    subtitle: 'First-Fit, Best-Fit, Slab Allocator, Buddy System và bài toán phân mảnh bộ nhớ.',
    tags: ['Allocation', 'Fragmentation', 'Buddy System', 'Slab'],
    relatedTopicIds: ['os_07_02', 'os_07_03', 'os_03_01'],
    overview: 'Trước hoặc song song với phân trang, OS và trình cấp phát (allocator) phải chia các khối bộ nhớ kích thước biến đổi một cách nhanh chóng và ít lãng phí nhất.',
    coreConcepts: ['Internal vs External Fragmentation', 'First-Fit / Best-Fit / Next-Fit', 'Buddy Allocator (Power-of-2)', 'Slab / SLUB Allocator cho Object nhân'],
    definitions: [{ term: 'External Fragmentation', meaning: 'Tổng bộ nhớ trống còn dư nhiều nhưng bị xé lẻ thành từng mảnh nhỏ không liền kề, nên không đáp ứng được yêu cầu cấp phát một khối lớn liên tục.' }],
    detailedTheory: `### Buddy System & Slab trong Linux Kernel\n- **Buddy Allocator**: Chia RAM thành các khối $2^k$ trang ($4KB, 8KB, 16KB...$). Khi giải phóng hai khối "anh em" (buddies) kề nhau, nó tự gộp lại thành khối $2^{k+1}$ cực nhanh.\n- **Slab / SLUB Allocator**: Giữ sẵn pool các đối tượng cùng kích thước hay dùng trong Kernel (như \`task_struct\`, \`inode\`) để cấp phát O(1) không phân mảnh.`,
    howItWorks: ['Allocator tìm lỗ trống phù hợp trong Free List.', 'Cắt phần vừa đủ trả về cho caller.', 'Phần dư giữ lại hoặc gộp (Coalescing) với hàng xóm khi `free()`.'],
    diagram: defaultDiagram('Buddy System', '64 KB Block', 'Split -> 32 KB + 32 KB', 'Coalesce when both free'),
    algorithms: [{ name: 'Buddy System', summary: 'Chia đôi theo lũy thừa 2; kiểm tra bit địa chỉ để gộp cặp buddy liền kề khi giải phóng.', complexity: 'O(log N) split/merge' }],
    codeExample: { language: 'text', title: 'So sánh Internal vs External Fragmentation', code: `Internal Fragmentation: Cấp khối cố định 4KB cho dữ liệu 2.1KB -> Lãng phí 1.9KB BÊN TRONG khối đã cấp.\nExternal Fragmentation: Còn 10 lỗ trống mỗi lỗ 2KB (=20KB) nhưng cấp khối 3KB liên tục vẫn thất bại!` },
    comparisons: [{ aspect: 'Tốc độ vs Mức phí', optionA: 'First-Fit: Nhanh, ít tìm kiếm nhưng dồn mảnh nhỏ về đầu danh sách', optionB: 'Best-Fit: Tối ưu kích thước thừa trước mắt nhưng sinh nhiều mảnh vụn cực nhỏ khó tái dùng' }],
    realWorldApplications: ['`jemalloc` (Meta/Redis/Rust) & `tcmalloc` (Google) dùng kiến trúc thread-cache + size-classes gần giống Slab để tăng tốc `malloc/free`.'],
    commonMistakes: ['Lầm tưởng `free()` trong C/C++ trả RAM ngay lập tức về cho OS — thường `glibc` giữ lại trong free-list của tiến trình để tái dùng cho lần `malloc` sau.'],
    interviewQuestions: [{ question: 'Phân biệt Internal Fragmentation và External Fragmentation?', answer: 'Internal là bộ nhớ thừa nằm bên trong vùng đã cấp phát cho đối tượng nhưng không dùng hết; External là bộ nhớ tự do nằm rải rác giữa các vùng đã cấp khiến không đủ 1 khối liên tục đủ lớn.' }],
    exercises: [{ id: 'ex_0701_1', prompt: 'Cho vùng nhớ 256KB dùng Buddy System, cấp phát lần lượt 20KB, 60KB, 100KB. Vẽ các khối sau phân tách.', solutionHint: '20KB->32KB; 60KB->64KB; 100KB->128KB (tổng 32+64+128=224KB, còn dư 32KB).' }],
  },
  {
    id: 'os_07_02',
    moduleId: 'os_m07',
    code: '07.02',
    title: 'Paging, Page Tables & TLB',
    subtitle: 'Dịch địa chỉ ảo (VPN + Offset) sang khung trang vật lý (PFN) qua MMU, Multi-level Page Table và TLB.',
    tags: ['Paging', 'MMU', 'TLB', 'Address Translation'],
    relatedTopicIds: ['os_07_01', 'os_07_04', 'os_07_05', 'os_03_04'],
    overview: 'Paging chia không gian ảo thành các Pages cố định (thường 4KB) và RAM vật lý thành các Frames cùng kích thước, giúp triệt tiêu hoàn toàn External Fragmentation.',
    coreConcepts: ['Virtual Page Number (VPN) & Offset', 'Page Table Entry (PTE: PFN, Present, R/W, U/S, Dirty)', 'TLB (Translation Lookaside Buffer)', '4-Level Multi-Level Page Table (x86-64)'],
    definitions: [{ term: 'TLB (Translation Lookaside Buffer)', meaning: 'Bộ nhớ đệm phần cứng cực nhanh nằm ngay trong MMU, lưu các ánh xạ VPN -> PFN vừa dùng gần đây để tránh phải đọc Page Table chậm chạp trong RAM.' }],
    detailedTheory: `### Công thức dịch địa chỉ ảo (Page Size = 4KB = $2^{12}$)\n- **12 bit thấp** = \`Offset\` (giữ nguyên không đổi khi dịch!).\n- **Các bit cao còn lại** = \`VPN\`.\n\n### Tại sao dùng Multi-level Page Table (4 tầng trên x86-64)?\nMột bảng 1 tầng phẳng cho không gian 48-bit sẽ ngốn **512 GB RAM cho MỖI tiến trình**! Bảng phân trang nhiều tầng (PGD → P4D → PUD → PMD → PTE) tổ chức dạng cây thưa: chỉ cấp phát nhánh Page Table cho vùng nhớ mà app thực sự dùng.`,
    howItWorks: [
      'CPU phát sinh Virtual Address.',
      'MMU tách (VPN, Offset) và tra **TLB** trước.',
      'Nếu **TLB Hit**: ghép PFN + Offset thành địa chỉ vật lý ngay trong < 1ns.',
      'Nếu **TLB Miss**: MMU Page Walker đi qua 4 tầng Page Table trong RAM (lấy gốc từ `CR3`), cập nhật TLB rồi mới truy cập dữ liệu.',
    ],
    diagram: defaultDiagram('MMU & TLB Lookup', 'Virtual Addr (VPN | Off)', 'TLB Cache -> 4-Lvl Table', 'Physical Addr (PFN | Off)'),
    algorithms: [{ name: 'Multi-level Radix Page Walk', summary: 'Dùng từng lát 9 bit của địa chỉ ảo làm chỉ mục qua 4 tầng bảng 512 mục.', complexity: 'O(1) — cố định 4 lần đọc RAM khi TLB miss' }],
    codeExample: { language: 'text', title: 'Ví dụ tính địa chỉ vật lý (32-bit, Page = 4KB)', code: `Virtual Address = 0x00003456\nOffset (12 bit cuối) = 0x456\nVPN = 0x00003 (Trang số 3)\nTra PTE[3] -> PFN = 0x0001A\n=> Physical Address = 0x0001A456` },
    comparisons: [{ aspect: 'Kích thước trang', optionA: '4KB Standard Page: Ít internal fragmentation', optionB: '2MB / 1GB Huge Pages: Giảm mạnh TLB Misses cho DB/JVM' }],
    realWorldApplications: ['PostgreSQL, Oracle và JVM bật **Transparent Huge Pages / Large Pages** để giảm hàng triệu TLB Miss khi quét heap hàng chục GB.'],
    commonMistakes: ['Tưởng Page Table nằm trong bộ nhớ của chính tiến trình hoặc nằm trong MMU — Page Table nằm trong RAM vật lý do Kernel quản lý, chỉ có TLB mới nằm trong chip MMU.'],
    interviewQuestions: [{ question: 'Tại sao phải dùng Multi-Level Page Table thay vì mảng Page Table 1 chiều?', answer: 'Vì không gian địa chỉ 64-bit cực lớn nhưng phần lớn bị trống; bảng 1 chiều phải cấp liên tục hàng trăm GB cho mỗi process, còn Multi-level chỉ cấp bảng con cho những vùng nhớ thực sự được sử dụng.' }],
    exercises: [{ id: 'ex_0702_1', prompt: 'Với máy 32-bit, kích thước trang 4KB và mỗi PTE 4 bytes, một Single-level Page Table tốn bao nhiêu MB cho 1 process?', solutionHint: '2^32 / 2^12 = 2^20 trang (1 triệu). 1 triệu × 4 bytes = 4 MB cho mỗi process.' }],
  },
  {
    id: 'os_07_03',
    moduleId: 'os_m07',
    code: '07.03',
    title: 'Segmentation & x86 Protection',
    subtitle: 'Chia bộ nhớ theo góc nhìn logic của lập trình viên (Code, Stack, Heap) với cặp Base + Limit.',
    tags: ['Segmentation', 'MMU', 'Base-Limit'],
    relatedTopicIds: ['os_07_02', 'os_03_01', 'os_11_04'],
    overview: 'Segmentation ánh xạ các phân đoạn kích thước biến đổi theo ngữ nghĩa logic chương trình, bổ sung cho Paging về mặt phân tách quyền hạn và kích thước.',
    coreConcepts: ['Segment Selector & Offset', 'Segment Table (Base Address + Limit Length)', 'Grows-down bit cho Stack', 'Flat Memory Model trên x86-64'],
    definitions: [{ term: 'Segmentation Fault', meaning: 'Lỗi xảy ra khi Offset vượt quá Limit của phân đoạn hoặc truy cập vi phạm quyền (vd: ghi vào phân đoạn Code Read-Only).' }],
    detailedTheory: `### Paging kết hợp Segmentation\n- Trong kiến trúc 32-bit x86 cổ điển, địa chỉ đi qua Segmentation trước để thành Linear Address, rồi qua Paging thành Physical Address.\n- Ở chế độ 64-bit hiện đại, Linux/Windows dùng **Flat Memory Model** (đặt Base=0, Limit=Max cho hầu hết segment), giao toàn quyền bảo vệ và chia trang cho Paging (4KB pages + NX bit).`,
    howItWorks: ['CPU phát sinh (SegmentID, Offset).', 'MMU kiểm tra `Offset < Limit` và permission bits.', 'Nếu hợp lệ, cộng `Base + Offset` (rồi đi tiếp qua Paging nếu bật).'],
    diagram: defaultDiagram('Segment Translation', 'Selector + Offset', 'Check Offset < Limit', 'Base + Offset -> Linear Addr'),
    algorithms: [{ name: 'Bounds Check Relocation', summary: 'Kiểm tra giới hạn phần cứng song song với phép cộng dịch Base.', complexity: 'O(1) hardware check' }],
    codeExample: { language: 'c', title: 'Truy cập sai Segment permission gây Segmentation Fault', code: `char *ro_str = "NOETRIX"; // Nằm ở .rodata (Read-only)\nro_str[0] = 'X';         // Vi phạm quyền ghi -> SIGSEGV!` },
    comparisons: [{ aspect: 'Đơn vị quản lý', optionA: 'Segmentation: Biến đổi theo logic (gây External Fragmentation)', optionB: 'Paging: Cố định 4KB (dễ cấp phát, không có External Fragmentation)' }],
    realWorldApplications: ['Thanh ghi `FS`/`GS` trên x86-64 vẫn dùng cơ chế base segment để trỏ cực nhanh tới Thread-Local Storage (TLS) của mỗi thread.'],
    commonMistakes: ['Nghe chữ "Segmentation Fault" trên Linux và nghĩ Linux chia RAM bằng Segmentation thuần — ngày nay hầu hết SIGSEGV xuất phát từ Page Fault bất hợp lệ trong Paging!'],
    interviewQuestions: [{ question: 'Tại sao hệ điều hành 64-bit hiện đại ưa chuộng Paging hơn Segmentation?', answer: 'Paging dùng kích thước trang cố định nên loại bỏ External Fragmentation, hỗ trợ Swap/Demand Paging linh hoạt và đơn giản hóa trình cấp phát vật lý.' }],
    exercises: [{ id: 'ex_0703_1', prompt: 'Cho Segment Table: Seg 0 (Base=1000, Limit=400), Seg 1 (Base=2500, Limit=1000). Địa chỉ (1, 450) hợp lệ không và ra địa chỉ bao nhiêu?', solutionHint: '450 < 1000 nên hợp lệ; địa chỉ = 2500 + 450 = 2950.' }],
  },
  {
    id: 'os_07_04',
    moduleId: 'os_m07',
    code: '07.04',
    title: 'Virtual Memory, Demand Paging & Copy-on-Write',
    subtitle: 'Chạy ứng dụng 20GB trên máy 8GB RAM: Page Fault không phải lỗi crash mà là cơ chế nạp trang theo yêu cầu.',
    tags: ['Virtual Memory', 'Page Fault', 'Demand Paging', 'CoW'],
    relatedTopicIds: ['os_07_02', 'os_07_05', 'os_03_05', 'os_10_01'],
    overview: 'Virtual Memory kết hợp RAM và Disk (Swap/Backing Store) để tạo không gian nhớ lớn hơn RAM thật, cô lập tiến trình và nạp dữ liệu lười (lazy) khi thực sự chạm tới.',
    coreConcepts: ['Present / Valid Bit trong PTE', 'Minor vs Major Page Fault', 'Demand Paging', 'Thrashing & Working Set'],
    definitions: [{ term: 'Page Fault', meaning: 'Ngoại lệ phần cứng kích hoạt khi chương trình truy cập một Virtual Page hợp lệ nhưng bit `Present = 0` (chưa được nạp vào RAM vật lý).' }],
    detailedTheory: `### Quy trình xử lý Page Fault (7 bước)\n1. CPU truy cập địa chỉ ảo → tra PTE thấy \`Present = 0\` → bẫy vào Kernel Page Fault Handler.\n2. Kernel kiểm tra xem địa chỉ có hợp lệ trong VMA (\`vm_area_struct\`) của process không? Nếu KHÔNG → **Invalid Access (SIGSEGV)**.\n3. Nếu hợp lệ → Tìm 1 Physical Frame trống (nếu hết RAM thì chạy **Page Replacement** đẩy trang cũ ra Swap).\n4. Đọc dữ liệu trang từ Disk/Swap (hoặc cấp trang toàn số 0 cho Anonymous Memory).\n5. Cập nhật \`PTE[VPN] = PFN, Present = 1\`.\n6. Khôi phục CPU chạy lại **chính lệnh vừa gây lỗi** như chưa có gì xảy ra!\n\n- **Minor Page Fault**: Trang đã có sẵn trong RAM (Page Cache/CoW) chỉ cần map PTE (vài µs).\n- **Major Page Fault**: Phải đọc từ SSD/HDD chậm hàng nghìn lần (vài ms).`,
    howItWorks: ['Đánh dấu trang chưa nạp bằng bit Present = 0.', 'Chạm trang lần đầu gây bẫy vào OS.', 'OS cấp frame, nạp dữ liệu từ đĩa hoặc zero-fill.', 'Tái thực thi lệnh ban đầu.'],
    diagram: defaultDiagram('Page Fault Handling', 'Access VA (Present=0)', 'Trap -> Allocate Frame / Swap In', 'Update PTE & Restart Instruction'),
    algorithms: [{ name: 'Working Set Model (Denning)', summary: 'Theo dõi tập trang nóng mà tiến trình dùng trong cửa sổ $\\Delta$ gần nhất để phòng Thrashing.', complexity: 'O(pages in window)' }],
    codeExample: { language: 'bash', title: 'Đo Minor vs Major Page Faults của một lệnh bất kỳ', code: `/usr/bin/time -v ls -la\n# Xem Minor (reclaiming a frame) page faults vs Major (requiring I/O) page faults` },
    comparisons: [{ aspect: 'Tốc độ xử lý', optionA: 'Minor Page Fault: Trang đã có trong RAM/Cache (~microsecond)', optionB: 'Major Page Fault: Phải đợi I/O từ SSD/HDD (~millisecond, chậm hơn ~1000x)' }],
    realWorldApplications: ['`mmap()` ánh xạ file 50GB trực tiếp vào bộ nhớ để xử lý mà không phải load toàn bộ vào RAM một lần (dùng trong SQLite, LMDB, Kafka).'],
    commonMistakes: ['Nghe từ "Page Fault" tưởng là lỗi bug crash app — Page Fault hợp lệ là cơ chế bình thường giúp Demand Paging và Copy-on-Write hoạt động!'],
    interviewQuestions: [{ question: 'Phân biệt Minor Page Fault, Major Page Fault và Segmentation Fault?', answer: 'Minor Fault là trang hợp lệ đã ở RAM (chỉ thiếu ánh xạ PTE); Major Fault là trang hợp lệ nhưng phải đọc từ ổ cứng/swap vào RAM; Segmentation Fault là truy cập địa chỉ bất hợp pháp hoặc sai quyền.' }],
    exercises: [{ id: 'ex_0704_1', prompt: 'Giải thích hiện tượng Thrashing và cách OS nhận diện qua CPU Utilization vs Disk Paging rate.', solutionHint: 'Khi tổng Working Set vượt quá RAM thật, tiến trình liên tục đá trang của nhau ra Swap rồi nạp lại → Disk bận 100% còn CPU Utilization tụt thê thảm.' }],
  },
  {
    id: 'os_07_05',
    moduleId: 'os_m07',
    code: '07.05',
    title: 'Page Replacement Algorithms',
    subtitle: 'OPT, FIFO (Bélády Anomaly), LRU, Clock (Second-Chance) và Linux Active/Inactive Lists.',
    tags: ['Page Replacement', 'LRU', 'Clock', 'Belady Anomaly'],
    relatedTopicIds: ['os_07_02', 'os_07_04', 'os_09_05'],
    overview: 'Khi RAM vật lý đầy và xảy ra Page Fault, OS buộc phải chọn một Victim Frame để thay thế — chọn sai sẽ khiến trang vừa đẩy ra lại bị nạp lại ngay sau đó.',
    coreConcepts: ['Optimal (Belady MIN — cận trên lý thuyết)', 'FIFO & Bélády’s Anomaly', 'LRU (Least Recently Used)', 'Clock / Second-Chance Algorithm', 'Dirty Bit (Avoid needless disk write)'],
    definitions: [{ term: 'Bélády’s Anomaly', meaning: 'Hiện tượng nghịch lý ở thuật toán FIFO: cấp THÊM số lượng frame RAM nhưng số Page Fault lại TĂNG LÊN thay vì giảm!' }],
    detailedTheory: `### Tại sao OS thật dùng Clock (xấp xỉ LRU) thay vì LRU thuần?\nLRU chính xác đòi hỏi cập nhật danh sách liên kết hoặc timestamp trên **mọi lần đọc/ghi bộ nhớ** (quá đắt về phần cứng).\nThuật toán **Clock** tận dụng 1 bit phần cứng có sẵn trong PTE là **Referenced / Accessed Bit ($A$)**:\n- Sắp xếp các frame thành vòng tròn đồng hồ có kim chỉ.\n- Khi cần đuổi trang: nếu bit $A = 1$ → cho cơ hội thứ hai (đặt $A = 0$ rồi nhích kim); nếu bit $A = 0$ → chọn làm Victim!`,
    howItWorks: ['RAM hết frame trống.', 'Kiểm tra vòng đồng hồ với bit Referenced (và ưu tiên giữ trang Dirty nếu muốn tránh ghi đĩa).', 'Nếu victim có bit Dirty=1 → flush ra Swap/Disk.', 'Nạp trang mới vào frame đó và cập nhật PTE.'],
    diagram: defaultDiagram('Clock Algorithm', 'Clock Hand checks Frame', 'Ref Bit == 1? Set 0 & Skip', 'Ref Bit == 0? Evict Victim'),
    algorithms: [{ name: 'Clock / Second-Chance (OSTEP)', summary: 'Quét vòng qua các frame dựa trên Accessed Bit; chi phí gần O(1) thay thế gần tốt như LRU.', complexity: 'Amortized O(1)' }],
    codeExample: { language: 'text', title: 'Bélády Anomaly với chuỗi: 1,2,3,4,1,2,5,1,2,3,4,5 (FIFO)', code: `Với 3 frames: 9 Page Faults\nVới 4 frames: 10 Page Faults! (Tăng RAM lại lỗi nhiều hơn!)\nThuật toán Stack-property (LRU, OPT) KHÔNG BAO GIỜ bị Bélády Anomaly.` },
    comparisons: [{ aspect: 'Chi phí vs Độ chính xác', optionA: 'LRU chuẩn: Rất tốt nhưng đắt khi cập nhật mỗi access', optionB: 'Clock / 2Q / Linux MGLRU: Xấp xỉ LRU rẻ bằng phần cứng Accessed Bit' }],
    realWorldApplications: ['Cơ chế quản lý Page Cache của Linux (Multi-Gen LRU / Active-Inactive Clock)', 'Buffer Pool eviction trong PostgreSQL (dùng Clock-Sweep!) và MySQL InnoDB (LRU cải tiến có midpoint insertion).'],
    commonMistakes: ['Quên **Dirty Bit**: đuổi 1 trang chỉ đọc (clean) không cần ghi lại ra đĩa, chỉ cần ghi đè thẳng lên nó; chỉ trang bị sửa (dirty=1) mới phải viết ra đĩa trước khi đuổi.'],
    interviewQuestions: [{ question: 'Tại sao PostgreSQL và Linux Kernel không dùng LRU thuần mà dùng Clock-Sweep / Two-list LRU?', answer: 'LRU thuần có chi phí đồng bộ & lock contention rất cao ở mỗi lần đọc dữ liệu (mỗi đọc đều phải dời node lên đầu list), còn Clock chỉ cần xoay bit Accessed (hoặc usage count) nhẹ hơn rất nhiều.' }],
    exercises: [{ id: 'ex_0705_1', prompt: 'Mô phỏng số Page Faults của chuỗi `7, 0, 1, 2, 0, 3, 0, 4` với 3 frames dùng LRU vs FIFO.', solutionHint: 'Kiểm tra từng bước bảng 3 frame để thấy LRU ít fault hơn FIFO.' }],
  },

  // =========================================================================
  // MODULE 08: FILE SYSTEMS
  // =========================================================================
  {
    id: 'os_08_01',
    moduleId: 'os_m08',
    code: '08.01',
    title: 'Files, File Descriptors & VFS',
    subtitle: 'Trừu tượng hóa File trên UNIX, bảng Open File Table và tầng Virtual File System (VFS).',
    tags: ['Files', 'VFS', 'File Descriptor'],
    relatedTopicIds: ['os_08_02', 'os_08_03', 'os_02_03'],
    overview: 'Triết lý "Everything is a file" của UNIX cho phép lập trình viên dùng cùng các syscall `read`/`write` cho ổ đĩa, terminal, pipe và socket mạng thông qua tầng VFS.',
    coreConcepts: ['File Descriptor (fd 0, 1, 2...)', 'Per-Process FD Table -> System Open File Table -> Inode Table', 'VFS (Virtual File System) Abstraction', 'Sequential vs Random Access (`lseek`)'],
    definitions: [{ term: 'VFS (Virtual File System)', meaning: 'Lớp trừu tượng hướng đối tượng bên trong Kernel giúp ứng dụng thao tác đồng nhất dù bên dưới là ext4, XFS, NTFS hay NFS qua mạng.' }],
    detailedTheory: `### Cấu trúc 3 tầng khi mở 1 File\n1. **Process FD Table**: Riêng mỗi tiến trình (\`fd=3\` trỏ vào System Open File Table).\n2. **System-wide Open File Table**: Lưu \`current file offset\` và chế độ mở (\`R/W\`). Hai tiến trình mở cùng file riêng rẽ có 2 offset độc lập; cha và con sau \`fork()\` chia sẻ cùng 1 open file entry nên dùng chung offset!\n3. **Inode Table**: Đại diện cho bản thân file vật lý trên đĩa.`,
    howItWorks: ['Gọi `open(path)` → VFS phân giải đường dẫn qua các thư mục.', 'Tạo mục trong System Open File Table chứa `offset = 0`.', 'Trả về số nguyên `fd` nhỏ nhất chưa dùng cho Process.'],
    diagram: defaultDiagram('3-Level Open File', 'Process FD Table [fd=3]', 'Open File Entry (offset)', 'Inode Table (Metadata)'),
    algorithms: [{ name: 'Path Resolution & Dentry Cache', summary: 'Đệm lại ánh xạ tên thư mục -> inode trong RAM (dcache) để không phải đọc đĩa mỗi lần mở path.', complexity: 'O(path depth) cached' }],
    codeExample: { language: 'c', title: 'Chuyển hướng stdout (fd=1) ra file bằng dup2()', code: `int fd = open("out.log", O_WRONLY | O_CREAT | O_TRUNC, 0644);\ndup2(fd, 1); // Từ giờ printf() ghi thẳng vào out.log!\nclose(fd);` },
    comparisons: [{ aspect: 'Phạm vi', optionA: 'File Descriptor: Số nguyên cục bộ bên trong 1 Process', optionB: 'Inode Number: Định danh duy nhất file trên 1 phân vùng đĩa' }],
    realWorldApplications: ['Shell redirection (`cmd > out.txt`) thực chất là `fork()` + `dup2()` + `execve()`.'],
    commonMistakes: ['Quên đóng File Descriptor làm rò rỉ tài nguyên (`EMFILE: Too many open files`) trên server chạy dài ngày.'],
    interviewQuestions: [{ question: 'Điều gì xảy ra khi bạn xóa (`rm` / `unlink`) một file đang được một tiến trình khác mở để đọc/ghi?', answer: 'Tên file biến mất khỏi thư mục (link count giảm 1), nhưng dữ liệu và Inode vẫn tồn tại trên đĩa cho đến khi tiến trình cuối cùng đóng File Descriptor của file đó.' }],
    exercises: [{ id: 'ex_0801_1', prompt: 'Giải thích lỗi ổ đĩa báo 100% đầy dù `du -sh` báo ít dung lượng hơn `df -h` rất nhiều.', solutionHint: 'Một tiến trình vẫn đang giữ open file descriptor tới một file log cực lớn đã bị `rm` (unlinked-but-open file).' }],
  },
  {
    id: 'os_08_02',
    moduleId: 'os_m08',
    code: '08.02',
    title: 'Directories, Hard Links & Soft Links',
    subtitle: 'Thư mục thực chất là một bảng ánh xạ `Tên file -> Số Inode`, nền tảng của Hard Link và Symlink.',
    tags: ['Directories', 'Hard Link', 'Symbolic Link'],
    relatedTopicIds: ['os_08_01', 'os_08_03'],
    overview: 'Thư mục không chứa nội dung các file con bên trong nó — thư mục chỉ là một loại file đặc biệt lưu danh sách cặp `(File Name, Inode Number)`.',
    coreConcepts: ['Directory Entry (dentry)', 'Link Count trong Inode', 'Hard Link (cùng Inode)', 'Symbolic / Soft Link (file chứa chuỗi path)'],
    definitions: [{ term: 'Hard Link', meaning: 'Một tên gọi thứ hai nằm trong thư mục trỏ tới CÙNG một Inode Number với file gốc; xóa một tên không làm mất dữ liệu nếu link count > 0.' }],
    detailedTheory: `### Hard Link vs Soft (Symbolic) Link\n- **Hard Link**: Chỉ dùng được trong cùng 1 file system/partition, không trỏ vào thư mục (để tránh tạo vòng lặp vô hạn khi duyệt cây thư mục).\n- **Symbolic Link**: Là một file riêng có Inode riêng, nội dung lưu chuỗi đường dẫn tới đích. Có thể trỏ xuyên ổ đĩa hoặc trỏ tới thư mục, nhưng nếu đích bị xóa sẽ thành **dangling link**.`,
    howItWorks: ['Đọc từng khối dữ liệu của thư mục cha.', 'So khớp tên file để lấy Inode Number.', 'Tăng `st_nlink` khi tạo Hard Link (`ln`).', 'Tạo file đặc biệt `S_IFLNK` khi tạo Symlink (`ln -s`).'],
    diagram: defaultDiagram('Hard vs Soft Link', 'nameA & nameB -> Same Inode 102', 'Hard Link (link_count=2)', 'symlink -> Inode 205 ("/path/to/A")'),
    algorithms: [{ name: 'HTree Directory Indexing', summary: 'ext4 dùng B-tree/HTree băm tên file để tìm file trong thư mục chứa hàng trăm nghìn tệp.', complexity: 'O(log N) lookup' }],
    codeExample: { language: 'bash', title: 'Kiểm chứng Inode number của Hard Link và Symlink', code: `echo "hello" > a.txt\nln a.txt a_hard.txt\nln -s a.txt a_soft.txt\nls -li a*.txt   # Cột 1 là Inode: a.txt == a_hard.txt != a_soft.txt` },
    comparisons: [{ aspect: 'Hành vi khi xóa file gốc', optionA: 'Hard Link: Dữ liệu vẫn đọc bình thường vì link_count giảm từ 2 xuống 1', optionB: 'Soft Link: Đứt liên kết (Broken/Dangling symlink)' }],
    realWorldApplications: ['Triển khai Zero-downtime deployment thường trỏ symlink `current -> releases/v2` rồi swap symlink nguyên tử.', 'Docker overlay & Git object deduplication.'],
    commonMistakes: ['Tưởng copy file tạo ra Hard Link — `cp` tạo Inode mới và nhân đôi dữ liệu (trừ khi dùng `--reflink` trên Btrfs/XFS).'],
    interviewQuestions: [{ question: 'Tại sao UNIX cấm tạo Hard Link tới một thư mục (directory)?', answer: 'Vì hard link tới thư mục có thể tạo thành chu trình (cycle) trong đồ thị cây thư mục, khiến các công cụ duyệt cây (`find`, `rm -rf`, `du`) lặp vô hạn và làm hỏng bộ đếm tham chiếu khi xóa.' }],
    exercises: [{ id: 'ex_0802_1', prompt: 'Tạo hard link `h1` từ `f1`, sau đó xóa `f1`. Dữ liệu trong `h1` có còn không và `stat h1` báo `Links:` bằng mấy?', solutionHint: 'Còn nguyên dữ liệu và `Links: 1`.' }],
  },
  {
    id: 'os_08_03',
    moduleId: 'os_m08',
    code: '08.03',
    title: 'Inodes & File Allocation Methods',
    subtitle: 'Contiguous, Linked, FAT, Indexed Allocation và cây con trỏ nhiều tầng của UNIX Inode (Direct/Indirect/Extents).',
    tags: ['Inode', 'Extents', 'FAT', 'File Allocation'],
    relatedTopicIds: ['os_08_01', 'os_08_02', 'os_10_05'],
    overview: 'File System phải giải bài toán lưu một file kích thước thay đổi lên các khối đĩa 4KB sao cho cả đọc tuần tự và đọc ngẫu nhiên (`lseek`) đều cực nhanh.',
    coreConcepts: ['Contiguous Allocation', 'Linked / FAT Table', 'Indexed Allocation & Multi-level Inode', 'Extents (ext4, XFS, Btrfs)'],
    definitions: [{ term: 'Inode (Index Node)', meaning: 'Cấu trúc metadata chứa kích thước, quyền, timestamps và mảng con trỏ tới các khối dữ liệu (Data Blocks) của file — LƯU Ý: Inode KHÔNG chứa tên file!' }],
    detailedTheory: `### Cấu trúc con trỏ cổ điển trong Inode\n- **12 Direct Pointers**: Trỏ thẳng Data Block → File nhỏ (< 48KB) đọc xong chỉ với 1 lần đọc Inode!\n- **Single Indirect**: Trỏ tới 1 khối chứa 1024 con trỏ.\n- **Double / Triple Indirect**: Hỗ trợ file hàng TB.\n\n**Modern Extents (ext4/XFS)**: Thay vì liệt kê 1000 con trỏ cho 1000 block liền kề, chỉ lưu đúng 1 Extent \`(start_block, length=1000)\`, gọn nhẹ hơn rất nhiều cho file lớn.`,
    howItWorks: ['Tính `block_index = offset / 4096`.', 'Nếu `< 12` → đọc trực tiếp từ `inode.direct[block_index]`.', 'Nếu lớn hơn → duyệt gián tiếp hoặc tìm nhị phân trên cây Extent.'],
    diagram: defaultDiagram('Inode Data Mapping', 'Inode Metadata', '12 Direct + Indirect / Extents', '4KB Disk Data Blocks'),
    algorithms: [{ name: 'Extent B-Tree Lookup', summary: 'Tìm khối đĩa chứa offset file trên cây extent của ext4.', complexity: 'O(log extents)' }],
    codeExample: { language: 'bash', title: 'Xem chi tiết Inode và Extents thật của một file bằng stat/filefrag', code: `stat README.md\nfilefrag -v README.md` },
    comparisons: [{ aspect: 'Truy cập ngẫu nhiên (Random lseek)', optionA: 'Linked Allocation: O(n) phải lần theo từng block từ đầu', optionB: 'Indexed / Inode / Extents: O(1) hoặc O(log N) nhảy thẳng tới offset' }],
    realWorldApplications: ['Giải thích lỗi "No space left on device" dù `df -h` vẫn còn 50% dung lượng trống — do **cạn kiệt Inode (`df -i`)** vì có hàng triệu file nhỏ 1KB!'],
    commonMistakes: ['Nghĩ tên file nằm bên trong Inode — tên file nằm ở **Directory Entry** của thư mục cha, giúp 1 Inode có thể có nhiều tên (Hard Links).'],
    interviewQuestions: [{ question: 'Tại sao ổ đĩa còn nhiều GB trống vẫn báo lỗi "No space left on device" khi tạo file mới?', answer: 'Vì hệ thống file (như ext4) có số lượng Inode cố định khi format; nếu tạo quá nhiều file cực nhỏ làm cạn bảng Inode (`df -i` = 100%), không thể tạo thêm file mới dù còn data blocks.' }],
    exercises: [{ id: 'ex_0803_1', prompt: 'Chạy `df -i` trên hệ thống để xem số lượng Inode đã dùng vs tổng số Inode.', solutionHint: 'Quan sát cột `IUsed` và `IFree`.' }],
  },
  {
    id: 'os_08_04',
    moduleId: 'os_m08',
    code: '08.04',
    title: 'File Permissions & ACLs',
    subtitle: 'UNIX RWX (User/Group/Other), SUID/SGID/Sticky Bit và POSIX Access Control Lists.',
    tags: ['Permissions', 'chmod', 'SUID', 'ACL'],
    relatedTopicIds: ['os_11_02', 'os_11_03', 'os_08_02'],
    overview: 'Mỗi Inode mang theo bộ bit quyền hạn kiểm tra ngay tại VFS mỗi khi có tiến trình mở, đọc, ghi hoặc thực thi tệp.',
    coreConcepts: ['RWX Bits (Read=4, Write=2, Execute=1)', 'Owner / Group / Others (e.g. 0755, 0644)', 'Special Bits: SetUID, SetGID, Sticky Bit (`/tmp`)', 'Extended ACL (`getfacl`/`setfacl`)'],
    definitions: [{ term: 'Sticky Bit (1777 trên /tmp)', meaning: 'Cho phép mọi user tạo file trong thư mục dùng chung `/tmp`, nhưng CHỈ chủ sở hữu file hoặc root mới được xóa/đổi tên file của mình.' }],
    detailedTheory: `### Ý nghĩa thực sự của \`rwx\` trên Thư mục (khác với File!)\n- \`r\` (Read): Liệt kê tên các file trong thư mục (\`ls\`).\n- \`w\` (Write): Tạo, xóa hoặc đổi tên entry bên trong thư mục (dù bạn không có quyền ghi vào bản thân file đó!).\n- \`x\` (Execute): Đi xuyên qua thư mục (\`cd\`, truy cập inode con).`,
    howItWorks: ['Tiến trình gọi `open()`.', 'Kernel so sánh `effective UID/GID` của process với `uid/gid/mode` trong Inode.', 'Nếu SetUID bật trên binary (vd `/usr/bin/passwd`), process tạm nhận EUID của chủ binary (root).'],
    diagram: defaultDiagram('Permission Check', 'Process EUID / EGID', 'VFS Checks Inode Mode (rwx)', 'Allow / EACCES Denied'),
    algorithms: [{ name: 'DAC Mode Evaluation', summary: 'Kiểm tra theo thứ tự: Root? -> Owner match? -> Group match? -> Others.', complexity: 'O(1) bitmask' }],
    codeExample: { language: 'bash', title: 'Đọc các bit quyền đặc biệt như SetUID trên /usr/bin/passwd', code: `ls -ld /tmp /usr/bin/passwd\n# drwxrwxrwt -> chữ 't' là Sticky Bit\n# -rwsr-xr-x -> chữ 's' là SetUID bit` },
    comparisons: [{ aspect: 'Khả năng phân quyền', optionA: 'POSIX Mode 9-bit: Đơn giản, cố định 3 nhóm U/G/O', optionB: 'POSIX ACL: Cấp quyền chi tiết cho nhiều user/group cụ thể' }],
    realWorldApplications: ['Bảo mật SSH key bắt buộc quyền `0600` (`-rw-------`); lỗi phân quyền thư mục thường chặn Nginx/Docker đọc volume.'],
    commonMistakes: ['Hiểu sai rằng để xóa một file, bạn cần quyền Write (`w`) trên chính file đó — thực chất xóa file là sửa bảng entry của **thư mục cha**, nên cần quyền `wx` trên thư mục cha!'],
    interviewQuestions: [{ question: 'Quyền `x` (Execute) trên một thư mục có tác dụng gì khác với trên file thường?', answer: 'Trên file thường là quyền chạy chương trình; trên thư mục `x` là quyền traverse (đi qua) để truy xuất inode/nội dung các mục con bên trong.' }],
    exercises: [{ id: 'ex_0804_1', prompt: 'Thử nghiệm tạo file chỉ đọc `chmod 444 test.txt` trong thư mục bạn có quyền `rwx`, rồi thử `rm -f test.txt`. Giải thích.', solutionHint: 'Xóa được vì `rm` thay đổi nội dung thư mục cha chứ không ghi vào dữ liệu của `test.txt`.' }],
  },
  {
    id: 'os_08_05',
    moduleId: 'os_m08',
    code: '08.05',
    title: 'Crash Consistency & Journaling (WAL)',
    subtitle: 'Vì sao rút điện giữa lúc lưu file không làm hỏng File System: FSCK vs Write-Ahead Journaling & Copy-on-Write.',
    tags: ['Journaling', 'WAL', 'fsync', 'Crash Recovery'],
    relatedTopicIds: ['os_08_03', 'os_09_05', 'os_10_04'],
    overview: 'Cập nhật 1 file đòi hỏi ghi tối thiểu 3 chỗ khác nhau (Data block, Bitmap, Inode). Nếu mất điện ở giữa, hệ thống tệp sẽ bị mất đồng bộ trừ khi có cơ chế Crash Consistency.',
    coreConcepts: ['Crash Inconsistency (Dangling Pointer / Space Leak)', 'FSCK (Quét toàn đĩa chậm)', 'Write-Ahead Logging / Journaling (ext4, XFS)', 'Metadata vs Ordered vs Full Data Journaling', 'fsync() Durability'],
    definitions: [{ term: 'Journaling (Write-Ahead Log)', meaning: 'Ghi trước nhật ký ý định thay đổi vào một vùng log tuần tự trên đĩa kèm điểm commit trước khi sửa các cấu trúc rải rác (Inode, Bitmap).' }],
    detailedTheory: `### Quy trình Ordered Journaling (mặc định của ext4)\n1. **Data Write**: Ghi Data block mới ra đĩa trước để tránh Inode trỏ vào dữ liệu rác cũ.\n2. **Journal Metadata Write**: Ghi thay đổi của Bitmap & Inode vào vùng Journal.\n3. **Journal Commit**: Ghi cờ TxEnd đánh dấu giao dịch hoàn tất.\n4. **Checkpoint**: Ghi thong thả Bitmap & Inode vào vị trí thật.\n5. Nếu mất điện giữa chừng → Khi bật lại chỉ cần **replay Journal** mất vài mili-giây thay vì quét cả ổ TB bằng \`fsck\`!`,
    howItWorks: ['Ghi tuần tự vào vùng Journal.', 'Chờ đĩa xác nhận commit block.', 'Áp dụng checkpoint vào vị trí chính.', 'Giải phóng đoạn log đã checkpoint.'],
    diagram: defaultDiagram('Journaling Pipeline', '1. Write Data Blocks', '2. Journal Log + Commit', '3. Checkpoint Inode/Bitmap'),
    algorithms: [{ name: 'Write-Ahead Logging (WAL)', summary: 'Mọi thay đổi metadata phải bền vững trong log tuần tự trước khi cập nhật tại chỗ (in-place).', complexity: 'Sequential I/O recovery' }],
    codeExample: { language: 'c', title: 'Đảm bảo dữ liệu thật sự xuống đĩa vật lý với fsync()', code: `int fd = open("wal.log", O_WRONLY | O_APPEND);\nwrite(fd, record, len);\nfsync(fd); // Ép Kernel đẩy từ Page Cache xuống ổ cứng thật!` },
    comparisons: [{ aspect: 'Tốc độ vs Độ an toàn', optionA: 'Data Journaling: Ghi mọi data 2 lần (rất an toàn, chậm 2x)', optionB: 'Ordered Journaling (ext4 default): Chỉ journal metadata sau khi đã ghi data (cân bằng tốt)' }],
    realWorldApplications: ['PostgreSQL WAL, MySQL InnoDB Redo Log, RocksDB WAL và Kafka log đều áp dụng chính xác cùng một nguyên lý Write-Ahead Logging này!'],
    commonMistakes: ['Tưởng gọi xong `write()` là dữ liệu đã nằm an toàn trên SSD — thực chất nó mới nằm trong **RAM Page Cache** của OS; mất điện sẽ mất sạch nếu chưa gọi `fsync()`!'],
    interviewQuestions: [{ question: 'Chế độ `Ordered` trong Journaling của ext4 giải quyết vấn đề gì?', answer: 'Đảm bảo Data block được ghi ra đĩa trước khi Metadata trỏ tới nó được commit vào Journal, nên nếu sập nguồn, file không bao giờ trỏ nhầm vào khối rác/dữ liệu của người khác mà vẫn tránh phải ghi dữ liệu 2 lần.' }],
    exercises: [{ id: 'ex_0805_1', prompt: 'Giải thích tại sao một hàm lưu file an toàn hay ghi ra file tạm `.tmp`, gọi `fsync(tmp)`, rồi mới `rename(tmp, target)`.', solutionHint: 'Vì `rename()` trong cùng filesystem là thao tác nguyên tử trên metadata, không bao giờ để lại file đích bị cắt nửa chừng.' }],
  },

  // =========================================================================
  // MODULE 09: I/O & DEVICE MANAGEMENT
  // =========================================================================
  {
    id: 'os_09_01',
    moduleId: 'os_m09',
    code: '09.01',
    title: 'Device Controllers & Device Drivers',
    subtitle: 'Cách CPU nói chuyện với phần cứng đa dạng qua Memory-Mapped I/O, Ports và Driver Architecture.',
    tags: ['Device Driver', 'MMIO', 'I/O Subsystem'],
    relatedTopicIds: ['os_02_04', 'os_09_02', 'os_09_03'],
    overview: 'Hệ điều hành không thể viết code riêng cho hàng triệu thiết bị phần cứng; Driver đóng vai trò bộ chuyển đổi chuẩn hóa giữa giao diện Kernel và thanh ghi thiết bị.',
    coreConcepts: ['Device Controller (Chip phần cứng trên thiết bị)', 'Status / Command / Data Registers', 'Port-mapped I/O vs Memory-mapped I/O (MMIO)', 'Block vs Character vs Network Devices'],
    definitions: [{ term: 'MMIO (Memory-Mapped I/O)', meaning: 'Ánh xạ các thanh ghi điều khiển của thiết bị phần cứng vào không gian địa chỉ vật lý chung của CPU để driver đọc/ghi bằng lệnh `LOAD/STORE` bình thường.' }],
    detailedTheory: `### Block Device vs Character Device\n- **Character Device** (Bàn phím, chuột, \`/dev/tty\`, \`/dev/urandom\`): Truyền dòng byte tuần tự, thường không hỗ trợ seek ngẫu nhiên.\n- **Block Device** (NVMe SSD, HDD): Đọc ghi theo từng khối kích thước cố định (512B / 4KB), hỗ trợ truy cập ngẫu nhiên và caching.`,
    howItWorks: ['App gọi syscall chuẩn (read/write/ioctl).', 'VFS/I/O layer định tuyến tới Device Driver đã đăng ký.', 'Driver ghi lệnh vào thanh ghi MMIO của Device Controller.'],
    diagram: defaultDiagram('OS to Hardware I/O', 'User Syscall / VFS', 'Device Driver (Ring 0)', 'MMIO Registers -> Controller'),
    algorithms: [{ name: 'Device Dispatch Table', summary: 'Bảng `file_operations` hoặc `blk_mq_ops` ánh xạ thao tác OS xuống mã driver hãng phần cứng.', complexity: 'O(1)' }],
    codeExample: { language: 'bash', title: 'Xem Block vs Character Devices trong /dev', code: `ls -l /dev/nvme0n1 /dev/tty /dev/null\n# Chữ 'b' đầu dòng = block device, 'c' = character device` },
    comparisons: [{ aspect: 'Giao tiếp phần cứng', optionA: 'Port I/O (`in`/`out` x86): Không gian cổng riêng biệt', optionB: 'MMIO: Dùng chung không gian địa chỉ bộ nhớ (phổ biến trên PCIe/ARM)' }],
    realWorldApplications: ['Driver GPU NVIDIA, Driver NVMe PCIe, hoặc các thiết bị ảo `/dev/null`, `/dev/zero`.'],
    commonMistakes: ['Lầm tưởng Device Driver chạy trên con chip phần cứng — Device Driver là **mã phần mềm** nằm trong Kernel OS, còn Firmware mới nằm trên thiết bị.'],
    interviewQuestions: [{ question: 'Phân biệt Block Device và Character Device?', answer: 'Character device truyền dữ liệu từng dòng byte tuần tự không địa chỉ hóa từng khối (bàn phím, serial); Block device truyền theo khối cố định và cho phép nhảy vị trí đọc/ghi ngẫu nhiên (SSD, HDD).' }],
    exercises: [{ id: 'ex_0901_1', prompt: 'Kiểm tra danh sách các thiết bị PCIe và driver đang gắn trên Linux bằng `lspci -k`.', solutionHint: 'Cột `Kernel driver in use` hiển thị tên driver điều khiển thiết bị đó.' }],
  },
  {
    id: 'os_09_02',
    moduleId: 'os_m09',
    code: '09.02',
    title: 'Polling vs Interrupts (IRQ)',
    subtitle: 'Vì sao CPU không ngồi hỏi thiết bị liên tục, và khi nào Interrupt Storm lại khiến Polling thắng ngược!',
    tags: ['Interrupts', 'IRQ', 'Polling', 'NAPI'],
    relatedTopicIds: ['os_02_02', 'os_09_01', 'os_09_03'],
    overview: 'Interrupt giải phóng CPU khỏi vòng lặp hỏi thăm thiết bị chậm chạp, nhưng ở băng thông cực cao (100Gbps NIC), Polling lại cần thiết để tránh quá tải ngắt.',
    coreConcepts: ['Programmed I/O (Polling)', 'Interrupt Request Line (IRQ) & IDT', 'Top Half (Hard IRQ) vs Bottom Half (SoftIRQ / Workqueue)', 'Interrupt Coalescing & Hybrid NAPI'],
    definitions: [{ term: 'Top Half vs Bottom Half', meaning: 'Top Half xử lý tối thiểu cực nhanh ngay khi ngắt (tắt ngắt, cất buffer) rồi nhả CPU; Bottom Half xử lý phần nặng về sau để không làm mất các ngắt khác.' }],
    detailedTheory: `### Nghịch lý Interrupt ở tốc độ cao (Interrupt Storm)\n- Thiết bị **chậm / thưa** (bàn phím, đĩa): **Interrupt** cực kỳ hiệu quả vì CPU có thể ngủ hoặc làm việc khác.\n- Thiết bị **cực nhanh / dày đặc** (card mạng 100Gbps nhận 14 triệu gói/giây, NVMe triệu IOPS): Nếu mỗi gói tin đều bắn 1 Interrupt → CPU bị ngắt liên tục không làm nổi việc gì (**Receive Livelock**)!\n- **Giải pháp**: Hybrid Polling (**Linux NAPI** / \`io_uring\` \`IOPOLL\`): Khi gói đầu tiên tới → kích 1 IRQ → chuyển sang tắt IRQ và dùng **Polling** quét cạn hàng loạt gói tin trong ring buffer rồi mới bật lại IRQ.`,
    howItWorks: ['Thiết bị hoàn tất việc và kéo đường IRQ lên.', 'Controller (APIC) gửi số hiệu ngắt vào CPU.', 'CPU dừng việc hiện tại, tra Interrupt Descriptor Table (IDT).', 'Chạy Top Half ngắn gọn, lên lịch Bottom Half, rồi `iret` quay lại.'],
    diagram: defaultDiagram('Interrupt Handling', 'Hardware asserts IRQ', 'APIC -> IDT Top Half', 'SoftIRQ Bottom Half -> User'),
    algorithms: [{ name: 'NAPI Hybrid Poll', summary: 'Ngắt kích hoạt vòng polling giới hạn budget, giảm mạnh số lần nhảy ngữ cảnh khi tải cao.', complexity: 'O(batch) per interrupt' }],
    codeExample: { language: 'bash', title: 'Quan sát thống kê ngắt phần cứng theo từng lõi CPU', code: `cat /proc/interrupts | head -n 15\ncat /proc/softirqs` },
    comparisons: [{ aspect: 'Phù hợp tải', optionA: 'Interrupt: Tuyệt vời khi sự kiện thưa & độ trễ thiết bị dài', optionB: 'Polling / NAPI: Tối ưu khi throughput cực lớn (100G NIC, NVMe)' }],
    realWorldApplications: ['Linux Network Stack NAPI', 'SPDK (Storage Performance Development Kit) cho NVMe tốc độ siêu cao'],
    commonMistakes: ['Viết thao tác ngủ (`sleep`, `kmalloc(GFP_KERNEL)` có thể block) bên trong Hard Interrupt Handler (Top Half) → làm treo chết lõi CPU!'],
    interviewQuestions: [{ question: 'Khi nào Polling có hiệu năng tốt hơn Interrupt?', answer: 'Khi thiết bị phản hồi cực nhanh hoặc tần suất sự kiện quá dày đặc (như card mạng 100Gbps hay NVMe), chi phí xử lý hàng triệu ngắt gây Interrupt Storm đắt hơn việc CPU chủ động poll theo lô (batch).' }],
    exercises: [{ id: 'ex_0902_1', prompt: 'Mở `/proc/interrupts` và giải thích cột `LOC` (Local timer interrupts) tăng nhanh ra sao.', solutionHint: 'Timer interrupt đánh nhịp đều đặn cho scheduler preemption trên từng core.' }],
  },
  {
    id: 'os_09_03',
    moduleId: 'os_m09',
    code: '09.03',
    title: 'DMA (Direct Memory Access)',
    subtitle: 'Giải phóng CPU khỏi việc chép từng byte dữ liệu giữa Card mạng/SSD và RAM.',
    tags: ['DMA', 'Bus Mastering', 'Zero-Copy'],
    relatedTopicIds: ['os_09_01', 'os_09_02', 'os_02_03'],
    overview: 'Nếu CPU phải trực tiếp copy từng byte từ bộ đệm đĩa vào RAM (Programmed I/O), thì khi đọc file 1GB/s CPU sẽ bị chiếm dụng phần lớn chu kỳ chỉ để làm "phu khuân vác". DMA giải quyết triệt để điều này.',
    coreConcepts: ['DMA Controller / Bus Mastering', 'Scatter-Gather I/O', 'Ring Descriptors', 'Cache Coherency & IOMMU Protection'],
    definitions: [{ term: 'DMA', meaning: 'Cơ chế phần cứng cho phép bộ điều khiển DMA hoặc thiết bị PCIe đọc/ghi trực tiếp vào RAM vật lý mà không cần CPU can thiệp từng byte.' }],
    detailedTheory: `### Quy trình đọc 1 khối 1MB từ SSD bằng DMA\n1. CPU ra lệnh duy nhất cho DMA Controller: *"Đọc sector X dài 1MB từ SSD đổ vào địa chỉ RAM vật lý \`0x800000\`"* (chỉ tốn vài µs).\n2. CPU quay sang chạy tiến trình khác bình thường.\n3. DMA Controller làm chủ bus hệ thống, tự chuyển từng trang dữ liệu thẳng vào RAM.\n4. Chuyển xong đủ 1MB, DMA mới bắn **đúng 1 Interrupt** báo CPU đã xong!`,
    howItWorks: ['Driver cấp phát DMA-safe contiguous (hoặc scatter-gather) buffer trong RAM.', 'Lập trình địa chỉ vật lý & kích thước vào DMA descriptors.', 'Thiết bị tự truyền trực tiếp tới RAM.', 'Thiết bị gửi IRQ báo hoàn thành.'],
    diagram: defaultDiagram('DMA Transfer', 'CPU programs DMA (1 time)', 'DMA <-> RAM Bus (No CPU!)', '1 Final IRQ when done'),
    algorithms: [{ name: 'Scatter-Gather DMA', summary: 'Cho phép DMA gom/rải dữ liệu vào nhiều Physical Frames không liền kề nhau bằng 1 danh sách descriptors.', complexity: '1 IRQ per batch' }],
    codeExample: { language: 'c', title: 'Zero-Copy với sendfile() tận dụng DMA', code: `// Chuyển thẳng dữ liệu từ Page Cache -> NIC DMA buffer không qua User Space!\nsendfile(socket_fd, file_fd, &offset, count);` },
    comparisons: [{ aspect: 'Can thiệp CPU', optionA: 'Programmed I/O: CPU sao chép từng word vào thanh ghi', optionB: 'DMA: CPU chỉ khởi tạo và nhận 1 IRQ cuối cùng' }],
    realWorldApplications: ['Kafka dùng `FileChannel.transferTo()` (gọi `sendfile`) kết hợp DMA để đạt throughput mạng tối đa.', 'Virtualization dùng VFIO/IOMMU gán thiết bị DMA an toàn cho VM.'],
    commonMistakes: ['Cấp phát địa chỉ Ảo (Virtual Address) cho phần cứng DMA cũ không có IOMMU — thiết bị DMA trên bus làm việc với Physical Address (hoặc IOVA).'],
    interviewQuestions: [{ question: 'DMA giúp tăng hiệu năng hệ thống bằng cách nào và tương tác với CPU Cache ra sao?', answer: 'DMA giải phóng CPU không phải tự copy từng byte I/O mà chỉ thiết lập lệnh 1 lần rồi nhận 1 ngắt khi xong. Cần bảo đảm cache coherence (flush/invalidate cache line hoặc hardware snooping) để CPU không đọc phải dữ liệu cũ trong L1/L2 sau khi DMA ghi xuống RAM.' }],
    exercises: [{ id: 'ex_0903_1', prompt: 'Vẽ số lần copy dữ liệu giữa trường hợp dùng `read()+write()` thông thường vs `sendfile()`.', solutionHint: 'read+write tốn 4 lần copy (2 DMA + 2 CPU) và 4 mode switches; sendfile rút xuống còn 2 lần DMA + 0 CPU copy (với NIC hỗ trợ scatter-gather).' }],
  },
  {
    id: 'os_09_04',
    moduleId: 'os_m09',
    code: '09.04',
    title: 'Buffering, Spooling & Page Cache',
    subtitle: 'Làm mượt chênh lệch tốc độ giữa CPU (ns), RAM và Thiết bị ngoại vi (ms).',
    tags: ['Buffering', 'Page Cache', 'Write-Back', 'Dirty Pages'],
    relatedTopicIds: ['os_08_05', 'os_09_03', 'os_07_05'],
    overview: 'Chênh lệch tốc độ hàng triệu lần giữa CPU và Đĩa/Mạng đòi hỏi OS sử dụng vùng đệm Buffer, Spooling và đặc biệt là Page Cache dùng RAM dư để tăng tốc I/O.',
    coreConcepts: ['Single vs Double Buffering', 'Spooling (Simultaneous Peripheral Operations On-Line)', 'OS Page Cache', 'Write-Through vs Write-Back'],
    definitions: [{ term: 'Linux Page Cache', meaning: 'Toàn bộ RAM rảnh mà các ứng dụng chưa dùng đến sẽ được OS tận dụng tự động để cache các khối file vừa đọc/ghi trên đĩa.' }],
    detailedTheory: `### Write-Back Caching & ` + '`pdflush`' + `\nKhi app gọi \`write()\`, Linux ghi vào **Page Cache trong RAM**, đánh dấu trang là **Dirty**, và trả về thành công ngay cho app (tốc độ RAM!). Sau vài giây (hoặc khi tỷ lệ dirty pages vượt \`vm.dirty_ratio\`), kernel background threads âm thầm đẩy dữ liệu xuống SSD.`,
    howItWorks: ['Đọc: Kiểm tra Page Cache trước; miss mới gọi DMA xuống ổ đĩa.', 'Ghi (Write-Back): Ghi vào RAM, đánh dấu Dirty, flush định kỳ.', 'Giải phóng tự động Page Cache ngay lập tức khi có app cần thêm RAM.'],
    diagram: defaultDiagram('Linux Page Cache', 'App read()/write()', 'RAM Page Cache (Dirty/Clean)', 'Async Flush -> SSD/NVMe'),
    algorithms: [{ name: 'Write-Back Coalescing', summary: 'Gộp nhiều lần ghi nhỏ vào cùng 1 trang trong RAM rồi mới flush xuống đĩa 1 lần.', complexity: 'Giảm mạnh Write Amplification' }],
    codeExample: { language: 'bash', title: 'Xem lượng RAM đang làm Page Cache (buff/cache) trên Linux', code: `free -h\n# Cột available = free + phần buff/cache có thể thu hồi ngay lập tức!` },
    comparisons: [{ aspect: 'Độ trễ vs Rủi ro mất nguồn', optionA: 'Write-Through: Đẩy thẳng xuống đĩa ngay (an toàn, chậm)', optionB: 'Write-Back: Báo xong ngay trong RAM (nhanh, cần fsync cho DB)' }],
    realWorldApplications: ['Giải thích trang web nổi tiếng "Linux ate my RAM!" — RAM nhìn có vẻ đầy nhưng thực chất là Page Cache có thể thu hồi tức thì.', 'Database đôi khi bật `O_DIRECT` để bỏ qua OS Page Cache, tự quản lý Buffer Pool.'],
    commonMistakes: ['Đọc cột `free` trong lệnh `free -h` thấy thấp rồi hoảng hốt tưởng hết RAM — phải xem cột **`available`**!'],
    interviewQuestions: [{ question: 'Tại sao một số Database (như MySQL InnoDB, PostgreSQL hay RocksDB) hay dùng Direct I/O (`O_DIRECT`) thay vì phụ thuộc hoàn toàn vào OS Page Cache?', answer: 'Để tránh Double Buffering (lưu 2 bản ở cả OS Page Cache và DB Buffer Pool), chủ động thuật toán eviction thông minh hơn theo query và kiểm soát chính xác thứ tự flush xuống đĩa.' }],
    exercises: [{ id: 'ex_0904_1', prompt: 'Giải thích Double Buffering giúp ích gì khi đọc file liên tục kết hợp xử lý.', solutionHint: 'Trong khi CPU xử lý Buffer A, DMA đồng thời nạp trước khối tiếp theo vào Buffer B.' }],
  },
  {
    id: 'os_09_05',
    moduleId: 'os_m09',
    code: '09.05',
    title: 'I/O & Disk Scheduling',
    subtitle: 'Từ FCFS, SSTF, SCAN (Elevator), C-SCAN đến kyber/none cho NVMe SSD đa hàng đợi.',
    tags: ['Disk Scheduling', 'Elevator', 'blk-mq', 'NVMe'],
    relatedTopicIds: ['os_10_01', 'os_10_02', 'os_09_01'],
    overview: 'Với HDD có đầu đọc cơ học, sắp xếp thứ tự đọc giúp giảm hàng trăm lần thời gian tìm track; với NVMe SSD hiện đại, thuật toán lại tối giản để song song hóa nhiều hàng đợi phần cứng.',
    coreConcepts: ['Seek Time + Rotational Latency (HDD)', 'SSTF (Shortest Seek Time First)', 'SCAN (Elevator) & C-SCAN', 'Multi-Queue Block Layer (`blk-mq`) cho SSD/NVMe'],
    definitions: [{ term: 'SCAN / Elevator Algorithm', meaning: 'Đầu đọc đĩa đi quét một chiều từ đầu tới cuối như thang máy, phục vụ tất cả yêu cầu nằm trên đường đi rồi mới đảo chiều để vừa giảm seek vừa tránh starvation.' }],
    detailedTheory: `### Tiến hóa từ HDD sang NVMe SSD\n- **HDD**: Seek đầu từ tốn 5–10ms nên cần SCAN/C-SCAN hoặc BFQ sắp xếp theo vị trí LBA.\n- **NVMe SSD**: Truy cập ngẫu nhiên không có chi phí di chuyển đầu từ, lại hỗ trợ tới **64K hàng đợi phần cứng** → Linux dùng tầng \`blk-mq\` (Multi-Queue) với scheduler **\`none\`** hoặc **\`mq-deadline\`** để giảm tối đa độ trễ khóa.`,
    howItWorks: ['Gom và trộn (Merge) các yêu cầu I/O kề nhau.', 'Sắp xếp (trên HDD) hoặc phân thẳng vào per-CPU submission queue (trên NVMe).', 'Ưu tiên yêu cầu đọc (Read) đồng bộ không bị nghẽn sau hàng loạt ghi nền.'],
    diagram: defaultDiagram('I/O Schedulers', 'Bio Merge & Sort', 'HDD: SCAN / C-SCAN', 'NVMe: blk-mq (none / mq-deadline)'),
    algorithms: [{ name: 'C-SCAN (Circular SCAN)', summary: 'Quét một chiều từ đầu đến cuối đĩa rồi nhảy về đầu mà không phục vụ lượt về để thời gian chờ đồng đều mọi track.', complexity: 'O(n log n) batch sort' }],
    codeExample: { language: 'bash', title: 'Kiểm tra I/O Scheduler đang kích hoạt cho từng ổ đĩa Linux', code: `cat /sys/block/*/queue/scheduler\n# Ví dụ NVMe thường hiện: [none] mq-deadline kyber` },
    comparisons: [{ aspect: 'Mục tiêu tối ưu', optionA: 'HDD (SCAN/C-SCAN): Giảm quãng đường di chuyển đầu đọc cơ học', optionB: 'NVMe SSD (`none`/`kyber`): Triệt tiêu lock contention đa lõi CPU' }],
    realWorldApplications: ['Tuning server Database chạy NVMe thường kiểm tra `queue/scheduler` và `read_ahead_kb`.'],
    commonMistakes: ['Áp dụng kinh nghiệm tuning HDD cũ (như bật CFQ) lên ổ NVMe tốc độ cao khiến CPU bị nghẽn khóa hàng đợi.'],
    interviewQuestions: [{ question: 'Tại sao I/O Scheduler trên Linux cho ổ NVMe hiện đại thường để là `none` thay vì thuật toán Elevator như HDD?', answer: 'Vì SSD không có đầu từ cơ học nên seek time gần bằng 0; hơn nữa NVMe hỗ trợ hàng nghìn queue song song theo từng core CPU nên sắp xếp lại thành 1 hàng đợi sẽ tạo nghẽn lock vô ích.' }],
    exercises: [{ id: 'ex_0905_1', prompt: 'Đầu đọc đang ở cylinder 53, hàng đợi: 98, 183, 37, 122, 14, 124, 65, 67 (đĩa 0..199). Tính tổng bước di chuyển với FCFS vs SSTF.', solutionHint: 'FCFS = 640 cylinders; SSTF (53->65->67->37->14->98->122->124->183) = 236 cylinders.' }],
  },

  // =========================================================================
  // MODULE 10: STORAGE MANAGEMENT
  // =========================================================================
  {
    id: 'os_10_01',
    moduleId: 'os_m10',
    code: '10.01',
    title: 'HDD Internals & Physical Geometry',
    subtitle: 'Platter, Track, Sector, Seek Time, Rotational Latency và sự chênh lệch Sequential vs Random I/O.',
    tags: ['HDD', 'Seek Time', 'LBA'],
    relatedTopicIds: ['os_09_05', 'os_10_02', 'os_10_03'],
    overview: 'Ổ cứng từ (HDD) vẫn giữ vai trò lưu trữ dung lượng khổng lồ chi phí thấp; hiểu vật lý chuyển động cơ học giúp giải thích vì sao ghi tuần tự nhanh gấp trăm lần ghi ngẫu nhiên.',
    coreConcepts: ['Platter, Track, Cylinder, Sector (512B / 4KB)', 'Seek Time (~4–9ms)', 'Rotational Latency (~4.17ms ở 7200 RPM)', 'LBA (Logical Block Addressing)'],
    definitions: [{ term: 'Seek + Rotational Latency', meaning: 'Tổng thời gian cơ học để đưa đầu đọc tới đúng rãnh (Track) và đợi đĩa quay đưa đúng cung từ (Sector) lướt qua dưới đầu đọc.' }],
    detailedTheory: `### Công thức tính thời gian truy cập 1 Sector ngẫu nhiên\n$$T_{I/O} = T_{seek} + T_{rotation} + T_{transfer}$$\nVới ổ 7200 RPM (120 vòng/giây → 1 vòng = 8.33ms): thời gian xoay trung bình $T_{rotation} \\approx 4.17\\text{ ms}$.\nVì mỗi I/O ngẫu nhiên mất ~10ms nên 1 ổ HDD chỉ đạt khoảng **100 IOPS ngẫu nhiên**, trong khi đọc tuần tự không phải seek lại có thể đạt **150–250 MB/s**!`,
    howItWorks: ['OS phát lệnh đọc LBA N.', 'Controller quy đổi LBA thành vị trí vật lý trên đĩa.', 'Cánh tay cơ học di chuyển tới track.', 'Đợi đĩa quay tới sector và đọc tín hiệu từ.'],
    diagram: defaultDiagram('HDD Access Cost', 'Move Arm (Seek ~5ms)', 'Wait Spin (Rot ~4ms)', 'Transfer Bytes (~0.01ms)'),
    algorithms: [{ name: 'Zoned Bit Recording (ZBR)', summary: 'Các track vòng ngoài dài hơn chứa nhiều sector hơn vòng trong → tốc độ đọc tuần tự ngoài rìa nhanh hơn trong tâm.', complexity: 'O(1) LBA map' }],
    codeExample: { language: 'text', title: 'Tại sao LSM-Tree / WAL lại nhanh trên HDD lẫn SSD?', code: `Random Write 4KB trên HDD: ~100 ops/sec = 0.4 MB/s!\nSequential Append (WAL / LSM): ~150 MB/s -> Nhanh hơn >350 lần!` },
    comparisons: [{ aspect: 'Bản chất hiệu năng', optionA: 'Random I/O trên HDD: Cực chậm (~100 IOPS) do giới hạn cơ học', optionB: 'Sequential I/O trên HDD: Nhanh hơn hàng trăm lần' }],
    realWorldApplications: ['Thiết kế Write-Ahead Log (WAL) và LSM-Tree (Cassandra, RocksDB, Kafka) chuyển Random Writes thành Sequential Appends.'],
    commonMistakes: ['Lầm tưởng dung lượng lớn đi kèm tốc độ IOPS cao — dung lượng tăng nhanh hơn tốc độ quay cơ học (vẫn kẹt ở 5400–7200 RPM).'],
    interviewQuestions: [{ question: 'Tại sao đọc/ghi tuần tự (Sequential) trên HDD lại nhanh hơn đọc/ghi ngẫu nhiên (Random) tới vài trăm lần?', answer: 'Vì truy cập ngẫu nhiên tốn phần lớn thời gian cho chuyển động cơ học (Seek arm + chờ đĩa quay ~8–12ms mỗi lần) cho vài KB, còn truy cập tuần tự đầu đọc gần như đứng yên và luồng sector tự chạy liên tục dưới đầu đọc.' }],
    exercises: [{ id: 'ex_1001_1', prompt: 'Tính Rotational Latency trung bình của ổ 15.000 RPM và ước lượng IOPS lý thuyết nếu $T_{seek} = 3\\text{ ms}$.', solutionHint: '15000 RPM = 250 rps -> 4ms/vòng -> avg rot = 2ms. Tổng 5ms/I/O -> ~200 IOPS.' }],
  },
  {
    id: 'os_10_02',
    moduleId: 'os_m10',
    code: '10.02',
    title: 'SSD, NAND Flash & FTL (Flash Translation Layer)',
    subtitle: 'Erase-Before-Write, Wear Leveling, Write Amplification và vai trò của lệnh TRIM.',
    tags: ['SSD', 'NAND Flash', 'FTL', 'TRIM'],
    relatedTopicIds: ['os_10_01', 'os_09_05', 'os_08_05'],
    overview: 'SSD không có bộ phận chuyển động cơ học nhưng có một ràng buộc phần cứng kỳ lạ: bạn có thể ghi theo từng Page (4–16KB), nhưng CHỈ CÓ THỂ XÓA theo cả một Block lớn (vài MB)!',
    coreConcepts: ['Page (Read/Program ~4KB) vs Erase Block (~256 Pages)', 'Out-of-Place Write & Garbage Collection', 'FTL (Flash Translation Layer)', 'Wear Leveling & TRIM (`fstrim`)'],
    definitions: [{ term: 'TRIM Command', meaning: 'Lệnh OS gửi xuống SSD báo rằng các trang của một file vừa bị xóa giờ đã vô hiệu, giúp FTL Garbage Collection không tốn công chép lại rác vô ích.' }],
    detailedTheory: `### Tại sao SSD phải có FTL bên trong?\n1. Flash NAND **không ghi đè trực tiếp tại chỗ (no in-place overwrite)** được trước khi Erase cả Block.\n2. Vì thế khi bạn sửa 1 trang 4KB, bộ điều khiển SSD ghi phiên bản mới sang một trang trống khác, đánh dấu trang cũ là **Stale/Invalid**, và cập nhật bảng ánh xạ **LBA → Physical Flash Page** bên trong FTL.\n3. Mỗi cell nhớ chỉ chịu được số lần Erase hữu hạn → **Wear Leveling** luân chuyển việc ghi đều khắp các cell để SSD không chết cục bộ.`,
    howItWorks: ['OS gửi lệnh ghi LBA X.', 'FTL chọn trang trống ở block mới, ghi dữ liệu và cập nhật bảng ánh xạ LBA -> PBA.', 'Đánh dấu trang vật lý cũ là Invalid.', 'Garbage Collector chạy nền chép trang Valid sang block khác rồi Erase block cũ.'],
    diagram: defaultDiagram('SSD FTL Architecture', 'OS LBA Write', 'FTL Mapping + Wear Leveling', 'NAND Blocks (Erase > Write)'),
    algorithms: [{ name: 'Dynamic & Static Wear Leveling', summary: 'Dời cả dữ liệu ít thay đổi (static cold data) khỏi các block ít mòn để nhường block đó cho vùng hay ghi.', complexity: 'Background GC' }],
    codeExample: { language: 'bash', title: 'Kiểm tra hỗ trợ TRIM/Discard trên SSD Linux', code: `lsblk --discard\n# Nếu DISC-MAX > 0B thì ổ hỗ trợ TRIM (fstrim -av)` },
    comparisons: [{ aspect: 'Đặc tính ghi', optionA: 'HDD: Ghi đè trực tiếp tại chỗ (Overwrite in-place)', optionB: 'SSD: Out-of-place write + cần Erase block trước khi tái dùng' }],
    realWorldApplications: ['Nếu đổ đầy >90% SSD không có over-provisioning và tắt TRIM, Garbage Collection bị nghẽn khiến tốc độ ghi tụt thảm hại (Write Amplification cao).'],
    commonMistakes: ['Chạy Defragment (chống phân mảnh kiểu HDD) lên ổ SSD — làm vậy vô nghĩa vì SSD không có seek time và còn đốt tuổi thọ ghi/xóa của cell Flash!'],
    interviewQuestions: [{ question: 'Tại sao không nên chống phân mảnh (Defragment) ổ SSD như HDD, mà lại cần lệnh TRIM?', answer: 'SSD truy cập trang ngẫu nhiên nhanh như tuần tự nên defrag không tăng tốc đáng kể mà chỉ làm tăng số chu kỳ Erase mòn cell Flash; còn TRIM báo cho FTL biết khối dữ liệu đã xóa để GC dọn dẹp sớm, giữ tốc độ ghi ổn định và giảm Write Amplification.' }],
    exercises: [{ id: 'ex_1002_1', prompt: 'Giải thích thuật ngữ Write Amplification Factor (WAF) trong SSD.', solutionHint: 'Tỉ số giữa lượng dữ liệu thực sự ghi xuống chip NAND (bao gồm cả GC copy) chia cho lượng dữ liệu mà OS yêu cầu ghi.' }],
  },
  {
    id: 'os_10_03',
    moduleId: 'os_m10',
    code: '10.03',
    title: 'Disk Structure, Partitions & LVM',
    subtitle: 'Từ Physical Disk, GPT Partition Table, Logical Volume Manager (LVM) tới Mount Points.',
    tags: ['GPT', 'Partitions', 'LVM', 'Mount'],
    relatedTopicIds: ['os_01_05', 'os_08_01', 'os_10_01'],
    overview: 'Trước khi tạo hệ thống tệp (`mkfs.ext4`), ổ đĩa vật lý được chia phân vùng hoặc gộp qua tầng Logical Volume Manager để linh hoạt mở rộng dung lượng.',
    coreConcepts: ['MBR vs GPT (GUID Partition Table)', 'Physical Volume -> Volume Group -> Logical Volume (LVM)', 'Mounting vào Unified VFS Tree', 'Swap Partition vs Swap File'],
    definitions: [{ term: 'Mount Point', meaning: 'Thư mục trong cây thư mục gốc `/` được gắn kết để đại diện cho gốc của một hệ thống tệp/phân vùng mới.' }],
    detailedTheory: `### Lớp phân cấp lưu trữ trên Linux\n\`Physical Disk (/dev/nvme0n1)\` → \`Partition (/dev/nvme0n1p1)\` → \`LVM PV/VG/LV\` → \`File System (ext4/xfs)\` → \`Mount (/var/lib/data)\`.\nNhờ LVM, bạn có thể ghép 2 ổ 1TB thành 1 ổ logic 2TB hoặc mở rộng dung lượng phân vùng ngay khi hệ thống đang chạy (online resize).`,
    howItWorks: ['Kernel đọc bảng phân vùng GPT ở đầu & cuối đĩa.', 'LVM ánh xạ Logical Extents xuống Physical Extents.', 'Lệnh `mount` liên kết VFS node với Superblock của File System.'],
    diagram: defaultDiagram('Linux Storage Stack', 'Physical Disks -> LVM', 'File System (mkfs)', 'Mount Point (/data)'),
    algorithms: [{ name: 'GPT CRC32 Checksum', summary: 'Lưu bảng phân vùng dự phòng ở cuối đĩa kèm CRC32 chống hỏng header.', complexity: 'O(partitions)' }],
    codeExample: { language: 'bash', title: 'Quan sát cấu trúc cây đĩa, phân vùng và điểm mount', code: `lsblk -f\nmount | column -t | head -n 10` },
    comparisons: [{ aspect: 'Tính linh hoạt', optionA: 'Raw Partition: Kích thước cố định liền kề, khó kéo dài nếu vướng phân vùng sau', optionB: 'LVM Logical Volume: Gộp nhiều đĩa và co giãn linh hoạt' }],
    realWorldApplications: ['AWS EBS / Cloud Disk resize mở rộng dung lượng ổ đĩa server production không cần downtime.'],
    commonMistakes: ['Chỉnh sửa nhầm `/etc/fstab` sai UUID khiến hệ thống không thể boot vào chế độ bình thường.'],
    interviewQuestions: [{ question: 'Khác nhau giữa phân vùng đĩa (Partitioning) và định dạng (Formatting / mkfs)?', answer: 'Partitioning chia không gian LBA vật lý của đĩa thành các phân đoạn ranh giới; Formatting (mkfs) tạo cấu trúc siêu dữ liệu File System (Superblock, Inode table, Journal) bên trong một phân vùng.' }],
    exercises: [{ id: 'ex_1003_1', prompt: 'Dùng `lsblk -f` kiểm tra UUID và FSTYPE các phân vùng đang gắn.', solutionHint: 'Xem cột NAME, FSTYPE, UUID, MOUNTPOINTS.' }],
  },
  {
    id: 'os_10_04',
    moduleId: 'os_m10',
    code: '10.04',
    title: 'RAID Levels (0, 1, 5, 6, 10)',
    subtitle: 'Đánh đổi giữa Dung lượng, Hiệu năng IOPS và Khả năng chịu lỗi phần cứng.',
    tags: ['RAID', 'Parity', 'Fault Tolerance'],
    relatedTopicIds: ['os_10_01', 'os_10_02', 'os_08_05'],
    overview: 'RAID (Redundant Array of Independent Disks) ghép nhiều ổ đĩa độc lập thành một ổ logic để tăng tốc độ (Striping) hoặc tăng độ an toàn khi ổ chết (Mirroring/Parity).',
    coreConcepts: ['RAID 0 (Striping — 0 chịu lỗi)', 'RAID 1 (Mirroring — phí 50% dung lượng)', 'RAID 5 (Single Parity — chịu 1 ổ hỏng, Write Penalty 4x)', 'RAID 6 (Dual Parity — chịu 2 ổ hỏng)', 'RAID 10 (Stripe of Mirrors)'],
    definitions: [{ term: 'RAID 5 Write Penalty', meaning: 'Để ghi nhỏ 1 block mới trên RAID 5, controller phải ĐỌC dữ liệu cũ + ĐỌC parity cũ, tính XOR, rồi mới GHI dữ liệu mới + GHI parity mới (tổng 4 thao tác I/O!).' }],
    detailedTheory: `### Bảng tổng hợp với $N$ ổ đĩa dung lượng $C$\n| Level | Dung lượng dùng được | Số ổ chịu hỏng | Đặc điểm chính |\n|---|---|---|---|\n| RAID 0 | $N \\cdot C$ | 0 | Tốc độ cao, mất 1 ổ là mất sạch |\n| RAID 1 | $C$ (nếu N=2) | $N - 1$ | Đọc nhanh, ghi 2 lần |\n| RAID 5 | $(N - 1) \\cdot C$ | 1 | Đọc nhanh, ghi chậm (4x I/O), rebuild rủi ro |\n| RAID 10 | $(N / 2) \\cdot C$ | 1/cặp | Tối ưu cho Database (nhanh + an toàn) |`,
    howItWorks: ['Chia dữ liệu thành các Stripe Units.', 'Với RAID 1/10: ghi song song xuống bản mirror.', 'Với RAID 5/6: tính toán khối Parity bằng phép XOR (`P = D1 ^ D2 ^ D3`).'],
    diagram: defaultDiagram('RAID 5 Parity Stripe', 'Disk 0: Data A1', 'Disk 1: Data A2', 'Disk 2: Parity (A1^A2)'),
    algorithms: [{ name: 'XOR Parity Reconstruction', summary: 'Nếu Disk 1 hỏng, khôi phục `A2 = A1 ^ Parity` ngay tức thì.', complexity: 'O(1) bitwise XOR' }],
    codeExample: { language: 'text', title: 'Kiểm chứng tính chất hoàn nguyên của XOR', code: `D1 = 1010, D2 = 1100 => P = D1 ^ D2 = 0110\nGiả sử D2 chết! Khôi phục: D1 ^ P = 1010 ^ 0110 = 1100 == D2!` },
    comparisons: [{ aspect: 'Database Workload', optionA: 'RAID 5: Tiết kiệm tiền ổ nhưng Read-Modify-Write parity làm chậm ghi ngẫu nhiên', optionB: 'RAID 10: Chấp nhận tốn 50% dung lượng để đạt ghi ngẫu nhiên và rebuild cực nhanh' }],
    realWorldApplications: ['Database Production ưu tiên RAID 10; NAS lưu trữ file media ưu tiên RAID 5/6 hoặc ZFS RAID-Z2.'],
    commonMistakes: ['Nghĩ **"RAID là Backup"** — RAID chỉ bảo vệ khi hỏng phần cứng ổ đĩa; nếu bạn lỡ tay chạy `DROP TABLE` hoặc `rm -rf`, RAID nhân bản ngay lệnh xóa đó lên tất cả các ổ trong chớp mắt!'],
    interviewQuestions: [{ question: 'Tại sao người ta hay cảnh báo "RAID is not a backup" và vì sao Database ít dùng RAID 5?', answer: 'RAID nhân bản cả lỗi xóa nhầm hoặc virus tức thì nên không thay thế được backup. Database nhiều ghi ngẫu nhiên tránh RAID 5 vì Write Penalty (1 logical write cần 4 physical I/O để cập nhật parity) và quá trình rebuild đĩa TB dễ kéo dài làm chết thêm ổ thứ 2.' }],
    exercises: [{ id: 'ex_1004_1', prompt: 'Có 4 ổ 4TB cấu hình RAID 5 vs RAID 10: mỗi loại cho bao nhiêu TB khả dụng?', solutionHint: 'RAID 5 = (4-1)*4 = 12 TB. RAID 10 = (4/2)*4 = 8 TB.' }],
  },
  {
    id: 'os_10_05',
    moduleId: 'os_m10',
    code: '10.05',
    title: 'Storage Virtualization & Modern Copy-on-Write FS (ZFS/Btrfs)',
    subtitle: 'Free-space Bitmaps, Checksums chống Bit Rot và Snapshots tức thì bằng Copy-on-Write.',
    tags: ['ZFS', 'Btrfs', 'CoW', 'Bit Rot'],
    relatedTopicIds: ['os_08_05', 'os_10_03', 'os_10_04'],
    overview: 'Hệ thống lưu trữ hiện đại như ZFS và Btrfs hợp nhất Volume Manager và File System lại làm một, bổ sung checksum đầu-cuối và khả năng Snapshot tức thì.',
    coreConcepts: ['Free Space Bitmap & B-Tree Allocators', 'End-to-End Data Checksums (Chống Bit Rot)', 'Copy-on-Write File System Tree', 'Zero-cost Atomic Snapshots'],
    definitions: [{ term: 'Silent Data Corruption (Bit Rot)', meaning: 'Lỗi bit tự phát âm thầm trên đĩa hoặc cáp truyền khiến dữ liệu bị biến đổi mà OS truyền thống không hề hay biết.' }],
    detailedTheory: `### Snapshot trong 1 mili-giây hoạt động thế nào?\nVới File System dùng **Copy-on-Write (CoW)** (như Btrfs/ZFS/APFS):\n- Khi chụp Snapshot, OS **không copy bất kỳ GB dữ liệu nào** — nó chỉ đóng băng con trỏ gốc của cây B-Tree hiện tại!\n- Khi có chỉnh sửa mới, dữ liệu mới được ghi vào **khối trống khác** và tạo nhánh gốc mới; khối cũ vẫn giữ nguyên cho Snapshot.`,
    howItWorks: ['Ghi dữ liệu vào khối trống mới kèm mã băm SHA256/Fletcher.', 'Cập nhật cây con trỏ từ dưới lên (wandering trees).', 'Chuyển đổi nguyên tử con trỏ Root Uberblock cuối cùng.'],
    diagram: defaultDiagram('CoW Snapshot Tree', 'Root V1 (Snapshot Frozen)', 'Shared Unchanged Blocks', 'Root V2 (New CoW Blocks)'),
    algorithms: [{ name: 'Copy-on-Write Tree Update', summary: 'Không bao giờ ghi đè block cũ đang sống; đảm bảo crash consistency không cần Journal riêng.', complexity: 'O(tree height) per tx' }],
    codeExample: { language: 'bash', title: 'Tạo Snapshot tức thì trên Btrfs / ZFS', code: `btrfs subvolume snapshot -r /data /data/.snapshots/snap_today\n# Hoàn thành tức thì bất kể /data nặng nhiều TB!` },
    comparisons: [{ aspect: 'Kiến trúc lưu trữ', optionA: 'ext4 / XFS: In-place update + Write-Ahead Journal', optionB: 'ZFS / Btrfs / APFS: Copy-on-Write + Native Snapshot & Checksum' }],
    realWorldApplications: ['Apple APFS trên macOS/iOS', 'ZFS cho NAS & lưu trữ doanh nghiệp', 'Btrfs snapshot trước khi nâng cấp gói hệ thống Linux.'],
    commonMistakes: ['Bỏ qua tình trạng phân mảnh tăng cao khi chạy Database heavy random-write trên CoW filesystem nếu không tinh chỉnh `nodatacow` hoặc record size.'],
    interviewQuestions: [{ question: 'Làm thế nào APFS/ZFS/Btrfs có thể tạo Snapshot của thư mục 500GB trong chưa đầy 1 giây?', answer: 'Nhờ kiến trúc Copy-on-Write: Snapshot chỉ lưu tham chiếu tới nút gốc B-tree tại thời điểm đó mà không sao chép dữ liệu; chỉ khi file thay đổi về sau mới ghi block mới.' }],
    exercises: [{ id: 'ex_1005_1', prompt: 'Giải thích tại sao CoW File System vừa chống được Crash Inconsistency vừa tránh được Write Hole của RAID 5.', solutionHint: 'Vì block mới luôn viết sang vùng trống hoàn toàn mới trước khi trỏ lại root.' }],
  },

  // =========================================================================
  // MODULE 11: SECURITY & PROTECTION
  // =========================================================================
  {
    id: 'os_11_01',
    moduleId: 'os_m11',
    code: '11.01',
    title: 'Authentication vs Authorization & Principle of Least Privilege',
    subtitle: 'Xác thực danh tính (PAM, UID, Cryptographic Keys) và phân quyền tối thiểu.',
    tags: ['Authentication', 'Authorization', 'Least Privilege'],
    relatedTopicIds: ['os_11_02', 'os_11_03', 'os_08_04'],
    overview: 'Bảo mật hệ điều hành bắt đầu từ hai câu hỏi tách biệt: "Bạn là ai?" (Authentication) và "Bạn được phép làm gì?" (Authorization), tuân thủ nguyên tắc Đặc quyền tối thiểu.',
    coreConcepts: ['Authentication (Who you are: Password Hash/PAM, SSH Key, Biometric)', 'Authorization (What you can do)', 'Principle of Least Privilege (PoLP)', 'Real UID vs Effective UID'],
    definitions: [{ term: 'Principle of Least Privilege', meaning: 'Mỗi tiến trình, người dùng hoặc module chỉ được cấp đúng những quyền tối thiểu cần thiết để hoàn thành nhiệm vụ, nhằm thu hẹp bán kính thiệt hại nếu bị chiếm quyền.' }],
    detailedTheory: `### Cơ chế mật khẩu an toàn trên OS\nOS hiện đại **không bao giờ lưu mật khẩu dạng chữ rõ**. Trên Linux, mật khẩu được băm bằng thuật toán chậm có **Salt** ngẫu nhiên (SHA-512 crypt / yescrypt) lưu trong \`/etc/shadow\` (chỉ \`root\` mới đọc được).`,
    howItWorks: ['PAM (Pluggable Authentication Modules) xác thực user lúc login.', 'Kernel gán UID/GID và danh sách Groups vào credentials của tiến trình đầu tiên.', 'Tiến trình con kế thừa tập credentials từ cha trừ khi có SetUID hoặc drop privileges.'],
    diagram: defaultDiagram('AuthN -> AuthZ', 'PAM / SSH Key (AuthN)', 'Assign UID / Capabilities', 'Kernel Enforces AuthZ'),
    algorithms: [{ name: 'Salted Slow Password Hashing', summary: 'Trộn chuỗi Salt ngẫu nhiên + lặp hàng chục nghìn vòng băm để chống Rainbow Table & Brute-force.', complexity: 'Deliberately slow (ms)' }],
    codeExample: { language: 'bash', title: 'Kiểm tra định danh UID/GID hiện tại của shell', code: `id\n# Phân biệt uid= (Real), euid= (Effective), groups=` },
    comparisons: [{ aspect: 'Câu hỏi bảo mật', optionA: 'Authentication: Chứng minh danh tính hợp lệ', optionB: 'Authorization: Kiểm tra hành động có được cấp phép không' }],
    realWorldApplications: ['Nginx khởi động bằng `root` để mở cổng 80/443, sau đó lập tức hạ quyền xuống user `www-data` theo Principle of Least Privilege.'],
    commonMistakes: ['Chạy ứng dụng Web hoặc Docker container dưới quyền `root` chỉ vì lười cấu hình quyền thư mục.'],
    interviewQuestions: [{ question: 'Tại sao Real UID và Effective UID lại tồn tại song song trong một tiến trình UNIX?', answer: 'Real UID cho biết ai đã chạy tiến trình; Effective UID là danh tính Kernel dùng để kiểm tra quyền truy cập tài nguyên (giúp cơ chế SetUID nâng quyền tạm thời hoặc hạ quyền an toàn).' }],
    exercises: [{ id: 'ex_1101_1', prompt: 'Tìm hiểu cấu trúc 1 dòng trong `/etc/shadow`: `$y$j9T$...` gồm những thành phần nào.', solutionHint: 'Gồm mã thuật toán (`$y$` yescrypt hoặc `$6$` SHA-512), chuỗi Salt, và chuỗi Hash.' }],
  },
  {
    id: 'os_11_02',
    moduleId: 'os_m11',
    code: '11.02',
    title: 'Access Control Matrix, ACLs & Capabilities',
    subtitle: 'Cách biểu diễn quyền: theo Cột (ACL) vs theo Hàng (Capability Tokens & Linux Capabilities).',
    tags: ['Access Control', 'ACL', 'Capabilities', 'DAC', 'MAC'],
    relatedTopicIds: ['os_11_01', 'os_08_04', 'os_11_03'],
    overview: 'Ma trận kiểm soát truy cập gồm Hàng (Subjects/Processes) và Cột (Objects/Files) có hai cách lưu trữ đối xứng trong thực tế.',
    coreConcepts: ['Access Control Matrix', 'ACL (Access Control List — gắn vào Object)', 'Capability List (gắn vào Subject)', 'Linux Capabilities (`CAP_NET_BIND_SERVICE`)', 'DAC vs MAC (SELinux/AppArmor)'],
    definitions: [{ term: 'Linux Capabilities', meaning: 'Chia nhỏ toàn quyền tối thượng của `root` thành gần 40 mảnh quyền độc lập (vd chỉ cho phép mở port < 1024 mà không cần cấp toàn quyền đọc/xóa mọi file).' }],
    detailedTheory: `### DAC vs MAC\n- **DAC (Discretionary Access Control)**: Chủ sở hữu file tự quyết định cho ai đọc/ghi (rất dễ lỡ tay \`chmod 777\`).\n- **MAC (Mandatory Access Control — SELinux, AppArmor)**: Chính sách do quản trị viên/hệ thống cưỡng chế cứng ở cấp Kernel; kể cả tiến trình chạy dưới quyền \`root\` cũng bị chặn nếu chính sách MAC không cho phép!`,
    howItWorks: ['ACL kiểm tra danh sách user gắn trên mỗi File/Object.', 'Capability kiểm tra vé thông hành mang theo bên người Subject/Process.', 'SELinux/AppArmor kiểm tra thêm chính sách MAC thông qua LSM (Linux Security Modules).'],
    diagram: defaultDiagram('Access Models', 'ACL: File asks "Who can touch me?"', 'Capability: Process holds unforgeable key', 'MAC: Kernel global policy'),
    algorithms: [{ name: 'Linux Security Modules (LSM)', summary: 'Cung cấp các hook bảo mật chuẩn hóa trong Kernel để SELinux/AppArmor kiểm tra sau khi DAC đã qua.', complexity: 'O(1) policy cache lookup' }],
    codeExample: { language: 'bash', title: 'Cấp riêng quyền mở port 80 cho binary Java/Node không cần chạy root', code: `sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node\ngetcap /usr/bin/node` },
    comparisons: [{ aspect: 'Hướng lưu ma trận', optionA: 'ACL (Theo cột): Dễ thu hồi quyền 1 user trên 1 file cụ thể', optionB: 'Capabilities (Theo hàng): Dễ biết 1 tiến trình đang giữ những quyền gì & tránh Confused Deputy' }],
    realWorldApplications: ['Container runtime (Docker/Kubernetes) thả hầu hết Linux Capabilities mặc định để thu hẹp quyền container.', 'Web JWT / OAuth Token thực chất chính là mô hình **Capability** phân tán!'],
    commonMistakes: ['Tắt ngay SELinux/AppArmor mỗi khi gặp lỗi permission thay vì xem log audit để cấp đúng label.'],
    interviewQuestions: [{ question: 'Linux Capabilities giải quyết vấn đề gì của mô hình phân quyền `root` toàn năng truyền thống?', answer: 'Thay vì "tất cả hoặc không có gì" (muốn mở port 80 hoặc gửi raw packet phải chạy bằng root toàn quyền), Capabilities chia quyền root thành từng quyền nhỏ riêng lẻ để gán đúng thứ cần thiết.' }],
    exercises: [{ id: 'ex_1102_1', prompt: 'Liệt kê các capabilities của shell hiện tại bằng lệnh `capsh --print`.', solutionHint: 'Kiểm tra các mục `Current:` và `Bounding set:`.' }],
  },
  {
    id: 'os_11_03',
    moduleId: 'os_m11',
    code: '11.03',
    title: 'Process Sandboxing & System Call Filtering',
    subtitle: 'Cách trình duyệt Chrome và Docker cô lập tiến trình nguy hiểm bằng `seccomp-bpf` và `chroot`/`pivot_root`.',
    tags: ['Sandbox', 'seccomp', 'Isolation'],
    relatedTopicIds: ['os_11_02', 'os_11_04', 'os_12_03'],
    overview: 'Ngay cả khi kẻ tấn công chiếm được luồng thực thi của một ứng dụng User Space (Remote Code Execution), Sandboxing ở tầng OS sẽ bóp nghẹt khả năng tương tác của nó với phần còn lại của máy.',
    coreConcepts: ['Attack Surface Reduction', 'seccomp-bpf (Lọc danh sách Syscall)', 'chroot vs pivot_root', 'Landlock LSM'],
    definitions: [{ term: 'seccomp-bpf', meaning: 'Cơ chế của Linux Kernel cho phép gắn một bộ lọc eBPF kiểm tra từng số hiệu & đối số System Call mà tiến trình gọi, chặn hoặc kill ngay nếu gọi syscall bị cấm.' }],
    detailedTheory: `### Bên trong Chrome / Docker Sandbox\nMột tab trình duyệt render HTML/JS bị sandbox nghiêm ngặt:\n- Không được gọi \`open()\` đọc file cá nhân của bạn.\n- Không được gọi \`socket()\` kết nối lung tung.\n- Chỉ được gọi tập rất nhỏ syscall an toàn (\`read\`, \`write\` trên các fd đã mở sẵn, \`futex\`, \`brk\`, \`exit\`) thông qua **seccomp-bpf**.`,
    howItWorks: ['Tiến trình nạp bộ lọc BPF trước khi xử lý dữ liệu không tin cậy.', 'Mỗi syscall đi qua bộ lọc seccomp trong Kernel.', 'Nếu khớp luật cấm → trả lỗi `EPERM` hoặc gửi `SIGSYS` kill ngay.'],
    diagram: defaultDiagram('seccomp-bpf Filter', 'Untrusted Worker App', 'seccomp BPF Filter (Whitelist)', 'Kernel Syscalls'),
    algorithms: [{ name: 'BPF Allowlist Verification', summary: 'Kiểm duyệt tĩnh bytecode BPF bảo đảm không có vòng lặp vô hạn trước khi nạp vào Kernel.', complexity: 'O(rules) per syscall' }],
    codeExample: { language: 'json', title: 'Trích đoạn tư tưởng seccomp allowlist cho container', code: `{\n  "defaultAction": "SCMP_ACT_ERRNO",\n  "architectures": ["SCMP_ARCH_X86_64"],\n  "syscalls": [{ "names": ["read", "write", "futex", "exit_group"], "action": "SCMP_ACT_ALLOW" }]\n}` },
    comparisons: [{ aspect: 'Độ chặt cô lập', optionA: 'chroot: Chỉ đổi thư mục gốc ảo, root vẫn dễ thoát (escape)', optionB: 'pivot_root + Mount Namespace + seccomp: Cô lập toàn diện bề mặt syscall' }],
    realWorldApplications: ['Docker mặc định chặn ~44+ syscall nguy hiểm bằng seccomp.', 'Chromium, Firefox, OpenSSH và systemd (`SystemCallFilter=`).'],
    commonMistakes: ['Dùng `chroot` đơn lẻ như một rào chắn bảo mật tuyệt đối — nếu tiến trình giữ quyền root hoặc fd bên ngoài, nó có thể `chroot` lần hai để thoát ra ngoài.'],
    interviewQuestions: [{ question: '`seccomp-bpf` bảo vệ hệ thống theo nguyên tắc nào?', answer: 'Giảm bề mặt tấn công (attack surface) vào Kernel bằng cách lọc các System Call và đối số mà một tiến trình được phép gọi dựa trên chính sách allowlist.' }],
    exercises: [{ id: 'ex_1103_1', prompt: 'Kiểm tra trạng thái Seccomp của 1 tiến trình qua `grep Seccomp /proc/<pid>/status`.', solutionHint: '0 = disabled, 1 = strict, 2 = filter mode (seccomp-bpf).' }],
  },
  {
    id: 'os_11_04',
    moduleId: 'os_m11',
    code: '11.04',
    title: 'Memory Isolation & Exploitation Mitigations',
    subtitle: 'ASLR, NX/DEP Bit, Stack Canaries và các lỗ hổng phần cứng Meltdown/Spectre.',
    tags: ['ASLR', 'NX Bit', 'Meltdown', 'Buffer Overflow'],
    relatedTopicIds: ['os_02_01', 'os_07_02', 'os_11_05'],
    overview: 'Bảo vệ bộ nhớ không chỉ ngăn lỗi vô tình mà còn phải chống lại khai thác chủ đích (Buffer Overflow, Return-Oriented Programming).',
    coreConcepts: ['NX / DEP (Non-Executable Stack/Heap)', 'ASLR (Address Space Layout Randomization)', 'Stack Canary', 'Meltdown & KPTI (Kernel Page-Table Isolation)'],
    definitions: [{ term: 'ASLR', meaning: 'Ngẫu nhiên hóa vị trí nạp của Stack, Heap và thư viện chia sẻ mỗi lần chạy chương trình để kẻ tấn công không đoán được địa chỉ nhảy tới.' }],
    detailedTheory: `### Tam giác phòng thủ Bộ nhớ Hiện đại\n1. **NX Bit (W^X — Write XOR Execute)**: Một trang nhớ có quyền Ghi (Stack/Heap) thì **không bao giờ được phép Thực thi mã máy**, chặn việc tiêm shellcode vào Stack.\n2. **ASLR**: Xáo trộn địa chỉ nền khiến mã khai thác khó trỏ đúng gadget.\n3. **Stack Canary**: Đặt 1 giá trị bí mật ngay trước Return Address trên Stack; trước khi hàm \`ret\`, CPU kiểm tra Canary có bị ghi đè bởi tràn mảng không.`,
    howItWorks: ['Linker/OS bật flag NX và PIE (Position Independent Executable).', 'Kernel dùng bộ sinh ngẫu nhiên đặt offset cho VMA lúc `execve`.', 'Nếu vi phạm NX → Hardware page fault kill ngay tiến trình.'],
    diagram: defaultDiagram('Memory Mitigations', 'Stack Canary (Overflow Guard)', 'W^X / NX Bit (No Exec Data)', 'ASLR (Random Base Addr)'),
    algorithms: [{ name: 'W^X Policy', summary: 'Bất biến phần cứng trong PTE: trang vừa `Writable` vừa `Executable` bị từ chối.', complexity: 'Hardware PTE NX bit' }],
    codeExample: { language: 'bash', title: 'Kiểm tra ASLR trên Linux và cờ bảo vệ binary', code: `cat /proc/sys/kernel/randomize_va_space\n# 2 = Full randomization (Stack, VDSO, Heap, mmap)` },
    comparisons: [{ aspect: 'Đối tượng chặn', optionA: 'NX Bit: Chặn thực thi shellcode tiêm trực tiếp lên Stack/Heap', optionB: 'ASLR: Chống tấn công tái sử dụng code có sẵn (ROP / Return-to-libc)' }],
    realWorldApplications: ['Sau lỗ hổng CPU **Meltdown (2018)**, Linux bật **KPTI** tách riêng Page Table User/Kernel khi chạy User Mode để ngăn đọc trộm Kernel memory qua Speculative Execution.'],
    commonMistakes: ['Nghĩ bật ASLR/NX là miễn nhiễm hoàn toàn với lỗi an toàn bộ nhớ trong C/C++ — các lỗi logic hoặc rò rỉ con trỏ vẫn có thể đánh bại ASLR.'],
    interviewQuestions: [{ question: 'NX (Non-Executable) bit và ASLR bổ trợ cho nhau như thế nào?', answer: 'NX ngăn kẻ tấn công chèn và chạy mã mới trên Stack/Heap; buộc họ phải tái sử dụng đoạn mã hợp lệ sẵn có (ROP), và ASLR ngẫu nhiên hóa địa chỉ khiến việc tìm các đoạn mã sẵn có đó trở nên khó khăn.' }],
    exercises: [{ id: 'ex_1104_1', prompt: 'Chạy 2 lần liên tiếp một lệnh đọc địa chỉ stack hoặc `cat /proc/self/maps` để quan sát địa chỉ thay đổi do ASLR.', solutionHint: 'Các dải địa chỉ hex của `[stack]` và `libc.so` sẽ khác nhau giữa 2 lần chạy.' }],
  },
  {
    id: 'os_11_05',
    moduleId: 'os_m11',
    code: '11.05',
    title: 'Hardware Privilege Rings & Trusted Execution',
    subtitle: 'Kiến trúc Protection Rings (Ring 0..3), Hypervisor Ring -1 và TEE (SGX / TrustZone).',
    tags: ['Protection Rings', 'Hardware Security', 'TEE'],
    relatedTopicIds: ['os_02_01', 'os_02_02', 'os_12_02'],
    overview: 'Bảo mật phần mềm cuối cùng phải đứng trên nền tảng phần cứng: CPU chia các mức đặc quyền hình đồng tâm để tầng ngoài không thể giả mạo tầng trong.',
    coreConcepts: ['x86 Rings 0–3 (Thực tế dùng Ring 0 & Ring 3)', 'ARM Exception Levels (EL0 User, EL1 Kernel, EL2 Hypervisor, EL3 Secure)', 'Ring -1 (Hypervisor / VT-x)', 'Hardware Enclave (TEE)'],
    definitions: [{ term: 'ARM Exception Levels (EL0–EL3)', meaning: 'Mô hình phân cấp đặc quyền hiện đại trên chip ARM (Apple Silicon, Cloud Graviton, Điện thoại) tách rạch ròi App (EL0), OS (EL1), Hypervisor (EL2) và Secure Monitor (EL3).' }],
    detailedTheory: `### Tiến hóa mô hình Ring\nKiến trúc x86 gốc thiết kế 4 vòng (Ring 0, 1, 2, 3), nhưng hầu hết OS hiện đại chỉ dùng **Ring 0 (Kernel)** và **Ring 3 (User)** vì Paging chỉ phân biệt nhị phân Supervisor/User.\nKhi ảo hóa phần cứng (Intel VT-x / AMD-V) ra đời, Hypervisor được đặt ở **VMX Root Mode** (thường ví là "Ring -1") nằm dưới cả Guest OS Kernel.`,
    howItWorks: ['Lệnh nhảy đặc quyền kiểm tra Current Privilege Level (CPL).', 'Tăng quyền chỉ đi qua cổng hợp lệ (Syscall/Hypercall/SMC).', 'Hạ quyền khi trả điều khiển về App.'],
    diagram: defaultDiagram('Privilege Hierarchy', 'EL0 / Ring 3 (User App)', 'EL1 / Ring 0 (OS Kernel)', 'EL2 / VMX Root (Hypervisor)'),
    algorithms: [{ name: 'Gate Descriptor Privilege Check', summary: 'Kiểm tra `CPL <= DPL` khi gọi qua gate chuyển mức đặc quyền.', complexity: 'Hardware gate check' }],
    codeExample: { language: 'text', title: 'Ánh xạ đặc quyền x86-64 vs ARM64', code: `App User Space:      x86 Ring 3        | ARM64 EL0\nOS Kernel:           x86 Ring 0        | ARM64 EL1\nHypervisor (KVM):    x86 VMX Root      | ARM64 EL2\nFirmware / TEE:      x86 SMM / SGX     | ARM64 EL3 / TrustZone` },
    comparisons: [{ aspect: 'Tầng kiểm soát', optionA: 'Kernel (Ring 0): Kiểm soát 1 hệ điều hành', optionB: 'Hypervisor (EL2 / VMX Root): Kiểm soát nhiều Guest OS cùng lúc' }],
    realWorldApplications: ['ARM TrustZone lưu vân tay/FaceID trên điện thoại tách biệt hoàn toàn khỏi Android/iOS Kernel.', 'AWS Nitro / Confidential Computing chạy VM mã hóa RAM.'],
    commonMistakes: ['Tưởng Ring 1 và Ring 2 vẫn đang được Linux hoặc Windows dùng cho Device Drivers — hầu hết tất cả đều bỏ qua Ring 1 & 2.'],
    interviewQuestions: [{ question: 'Tại sao hệ điều hành hiện đại thường chỉ dùng 2 vòng (Ring 0 và Ring 3) thay vì cả 4 vòng của x86?', answer: 'Vì cấu trúc Page Table phần cứng chủ yếu chỉ có bit phân tách 2 cấp (User/Supervisor) và việc chuẩn hóa 2 cấp giúp nhân OS dễ di chuyển (portable) sang các kiến trúc CPU khác ngoài x86.' }],
    exercises: [{ id: 'ex_1105_1', prompt: 'Sắp xếp thứ tự quyền lực tăng dần từ thấp lên cao trên ARM64: EL0, EL1, EL2, EL3.', solutionHint: 'EL0 (App) < EL1 (OS) < EL2 (Hypervisor) < EL3 (Secure Monitor).' }],
  },

  // =========================================================================
  // MODULE 12: DISTRIBUTED & VIRTUALIZED SYSTEMS
  // =========================================================================
  {
    id: 'os_12_01',
    moduleId: 'os_m12',
    code: '12.01',
    title: 'Virtual Machines & CPU Virtualization',
    subtitle: 'Trap-and-Emulate, Binary Translation và ảo hóa hỗ trợ phần cứng Intel VT-x / AMD-V.',
    tags: ['Virtual Machine', 'VT-x', 'Popek-Goldberg'],
    relatedTopicIds: ['os_12_02', 'os_12_03', 'os_11_05', 'os_07_02'],
    overview: 'Máy ảo (VM) ảo hóa toàn bộ phần cứng vật lý để một Guest OS nguyên vẹn chạy như thể đang độc chiếm một máy tính thật.',
    coreConcepts: ['Popek & Goldberg Virtualization Requirements', 'Trap-and-Emulate', 'VM Exit vs VM Entry', 'Two-Dimensional Paging (EPT / NPT)'],
    definitions: [{ term: 'EPT (Extended Page Tables)', meaning: 'Hỗ trợ phần cứng cho ảo hóa bộ nhớ 2 lớp: Guest Virtual -> Guest Physical -> Host Physical, giảm thiểu VM Exit mỗi lần Guest đổi trang nhớ.' }],
    detailedTheory: `### Cái giá của Ảo hóa Bộ nhớ 2 chiều\nTrong VM, một lần TLB Miss phải đi qua **2 tầng Page Table**:\n- Guest Page Table 4 tầng (Guest Virtual → Guest Physical)\n- Mỗi bước dịch Guest Physical lại phải tra qua Host EPT 4 tầng!\nTổng số lần đọc RAM có thể lên tới **$4 \\times 4 + 4 = 20$ lần** nếu không có **TLB & Huge Pages**! Đó là lý do Huge Pages cực kỳ quan trọng trên Cloud VM.`,
    howItWorks: ['Hypervisor thiết lập cấu trúc VMCS và gọi `VM Entry` chạy Guest OS.', 'Guest chạy trực tiếp trên CPU thật ở tốc độ gốc (VMX Non-Root).', 'Khi Guest đụng lệnh nhạy cảm (I/O, HLT) → gây `VM Exit` về Hypervisor giả lập.', 'Xong → `VM Entry` trả lại Guest.'],
    diagram: defaultDiagram('CPU Virtualization', 'Guest VM (VMX Non-Root)', 'Sensitive Op -> VM Exit', 'Hypervisor (VMX Root)'),
    algorithms: [{ name: '2D Page Walk (EPT)', summary: 'Phần cứng MMU kết hợp Guest CR3 + Host EPTP để dịch địa chỉ tự động không cần bẫy Hypervisor.', complexity: 'O(levels_guest * levels_host) on TLB miss' }],
    codeExample: { language: 'bash', title: 'Kiểm tra CPU có bật cờ ảo hóa phần cứng VT-x / AMD-V và KVM chưa', code: `lscpu | grep -E "Virtualization|VT-x|AMD-V"\nls -l /dev/kvm` },
    comparisons: [{ aspect: 'Cơ chế chạy', optionA: 'Software Emulation (QEMU TCG): Dịch từng lệnh rất chậm', optionB: 'Hardware-Assisted Virtualization (KVM + VT-x): Chạy trực tiếp trên silicon vật lý' }],
    realWorldApplications: ['AWS EC2, Google Compute Engine và Firecracker MicroVM (chạy AWS Lambda).'],
    commonMistakes: ['Tưởng mọi câu lệnh trong VM đều bị Hypervisor "giả lập từng dòng" — với VT-x/KVM, các lệnh tính toán bình thường chạy thẳng trên CPU vật lý gần đạt 100% tốc độ gốc.'],
    interviewQuestions: [{ question: 'Extended Page Tables (EPT) giải quyết vấn đề hiệu năng nào trong máy ảo?', answer: 'Loại bỏ việc Hypervisor phải bẫy (VM Exit) mỗi lần Guest OS cập nhật Page Table hoặc bị Page Fault; phần cứng tự động thực hiện dịch 2 tầng Guest Virtual -> Guest Physical -> Host Physical.' }],
    exercises: [{ id: 'ex_1201_1', prompt: 'Tính số lần đọc RAM tối đa khi TLB miss trong máy ảo 4-level Page Table + 4-level EPT.', solutionHint: '4 tầng Guest + 4 lần tra EPT cho mỗi tầng (4*4) + 4 bước dịch địa chỉ bảng cuối = ~24 lần truy cập bộ nhớ!' }],
  },
  {
    id: 'os_12_02',
    moduleId: 'os_m12',
    code: '12.02',
    title: 'Hypervisors: Type-1, Type-2 & Paravirtualization (VirtIO)',
    subtitle: 'Bare-Metal Hypervisor (ESXi/Xen/KVM) vs Hosted Hypervisor (VirtualBox) và giao thức VirtIO tăng tốc I/O.',
    tags: ['Hypervisor', 'KVM', 'VirtIO', 'Paravirtualization'],
    relatedTopicIds: ['os_12_01', 'os_12_03', 'os_09_01'],
    overview: 'Hypervisor (VMM) là trình giám sát điều phối phần cứng giữa nhiều máy ảo; hiểu Type-1/Type-2 và VirtIO giải thích cách Cloud đạt I/O mạng và đĩa hàng chục Gbps.',
    coreConcepts: ['Type-1 (Bare-Metal: ESXi, Xen, Hyper-V, KVM)', 'Type-2 (Hosted: VirtualBox, VMware Workstation)', 'Full Virtualization vs Paravirtualization', 'VirtIO Ring Buffers (High-speed I/O)'],
    definitions: [{ term: 'VirtIO', meaning: 'Chuẩn Paravirtualization giúp Guest OS nhận biết mình đang chạy trong VM và giao tiếp thẳng với Hypervisor qua các hàng đợi vòng (Virtqueues) tốc độ cao thay vì giả lập chip card mạng Intel cũ kỹ.' }],
    detailedTheory: `### Vị trí đặc biệt của KVM trên Linux\nKVM biến bản thân Linux Kernel thành một **Type-1 Bare-Metal Hypervisor**:\n- Mỗi VM chỉ là một **Linux Process** bình thường được lập lịch bởi CFS.\n- Nhờ thế KVM thừa hưởng toàn bộ bộ nhớ, trình lập lịch, driver NVMe và network stack tối tân đã được Linux phát triển hàng chục năm.`,
    howItWorks: ['Type-1 chạy trực tiếp trên phần cứng không qua Host OS trung gian.', 'Type-2 chạy như một ứng dụng bên trên Host OS.', 'VirtIO chia sẻ vùng nhớ vòng đệm (virtqueue) giữa Guest Driver và QEMU/KVM backend.'],
    diagram: defaultDiagram('Type-1 KVM + VirtIO', 'Guest VM (virtio-net)', 'Shared Virtqueue Ring', 'Host Kernel (KVM / vhost)'),
    algorithms: [{ name: 'Virtqueue Split/Packed Ring', summary: 'Hàng đợi lockless chia sẻ descriptor giữa Guest và Host giảm số lần VM Exit.', complexity: 'Batched notifications' }],
    codeExample: { language: 'bash', title: 'Kiểm tra xem Linux VM hiện tại có đang dùng driver VirtIO không', code: `lspci | grep -i virtio\n# Sẽ thấy Virtio network device, Virtio SCSI / block device` },
    comparisons: [{ aspect: 'Hiệu năng I/O VM', optionA: 'Emulated Device (e1000 / IDE): Giả lập từng thanh ghi cũ -> Nhiều VM Exit, chậm', optionB: 'Paravirtualized (VirtIO): Giao tiếp batch qua shared ring -> Gần đạt tốc độ thật' }],
    realWorldApplications: ['Hầu hết VM trên GCP, AWS Nitro, OpenStack và Proxmox đều dùng KVM + VirtIO.'],
    commonMistakes: ['Chạy Virtual Machine gắn driver đĩa cứng giả lập IDE thay vì `virtio-blk` / `virtio-scsi` làm IOPS tụt gấp nhiều lần.'],
    interviewQuestions: [{ question: 'Phân biệt Type-1 và Type-2 Hypervisor và giải thích vai trò của VirtIO?', answer: 'Type-1 chạy trực tiếp trên phần cứng (ESXi, KVM, Hyper-V) cho hiệu năng cao; Type-2 chạy trên Host OS có sẵn (VirtualBox). VirtIO dùng cơ chế paravirtualization qua ring buffer giúp Guest không phải giả lập phần cứng cũ nên giảm mạnh VM Exit cho Disk và Network.' }],
    exercises: [{ id: 'ex_1202_1', prompt: 'Giải thích vì sao mỗi Guest vCPU trong KVM thực chất tương ứng với 1 thread trên Host Linux.', solutionHint: 'QEMU tạo mỗi vCPU là một POSIX thread gọi `ioctl(KVM_RUN)` để chạy vào VMX Non-Root.' }],
  },
  {
    id: 'os_12_03',
    moduleId: 'os_m12',
    code: '12.03',
    title: 'Containers: Linux Namespaces, cgroups & OverlayFS',
    subtitle: 'Docker không hề là phép thuật: Container chính là tiến trình Linux bình thường được đeo kính râm cô lập!',
    tags: ['Containers', 'Namespaces', 'cgroups', 'OverlayFS'],
    relatedTopicIds: ['os_12_02', 'os_11_03', 'os_08_02', 'os_03_01'],
    overview: 'Container không cần Guest OS Kernel riêng như VM; nó kết hợp 3 tính năng có sẵn trong nhân Linux: Namespaces (cô lập tầm nhìn), cgroups (giới hạn tài nguyên) và Union File System (OverlayFS).',
    coreConcepts: ['Namespaces (PID, NET, MNT, UTS, IPC, USER)', 'cgroups v2 (CPU, Memory, I/O Limits)', 'OverlayFS (`lowerdir`, `upperdir`, `merged`)', 'Shared Host Kernel Trade-off'],
    definitions: [{ term: 'Linux Namespaces vs cgroups', meaning: 'Namespaces quyết định một tiến trình NHÌN THẤY được gì (chỉ thấy PID, IP, thư mục của riêng nó); cgroups quyết định nó ĐƯỢC DÙNG BAO NHIÊU (tối đa mấy lõi CPU, mấy GB RAM).' }],
    detailedTheory: `### Công thức tạo ra 1 Container = ` + '`Namespaces + cgroups + chroot/OverlayFS + seccomp`' + `\n- **PID Namespace**: Tiến trình chính trong container thấy mình là \`PID 1\`, nhưng ở ngoài Host nó vẫn có \`PID 24910\` như bao tiến trình khác!\n- **cgroups v2**: Nếu container vượt hạn mức RAM \`--memory=512m\`, Kernel OOM-killer bắn chết tiến trình bên trong container mà không ảnh hưởng toàn server.\n- **OverlayFS**: Cho phép 100 container cùng chia sẻ một Image gốc (\`lowerdir\` read-only) và mỗi container chỉ tốn dung lượng cho lớp ghi mới (\`upperdir\`).`,
    howItWorks: ['Containerd/runc gọi `clone()` kèm các cờ `CLONE_NEWPID | CLONE_NEWNET | CLONE_NEWNS...`.', 'Đưa PID vào nhóm cgroup để áp quota CPU/RAM.', 'Mount OverlayFS + `pivot_root` + hạ capabilities + nạp seccomp rồi `execve` app.'],
    diagram: defaultDiagram('Container Internals', 'Namespaces (PID/NET/MNT)', 'cgroups v2 (RAM/CPU Quota)', 'Shared Host Linux Kernel'),
    algorithms: [{ name: 'OverlayFS Copy-Up', summary: 'Nếu container sửa 1 file nằm trong lớp Image Read-Only (`lowerdir`), file đó được copy lên `upperdir` trước khi sửa.', complexity: 'O(file size) on first modify' }],
    codeExample: { language: 'bash', title: 'Tự tạo một "mini container" bằng lệnh thuần Linux không cần Docker', code: `# Cách ly thư mục, PID và Hostname ngay lập tức:\nsudo unshare --pid --fork --mount-proc --uts bash\nhostname mini-box && ps aux` },
    comparisons: [{ aspect: 'Kiến trúc', optionA: 'Container: Chia sẻ Host Kernel, khởi động ms, rất nhẹ', optionB: 'VM: Kernel riêng hoàn toàn, khởi động s, biên giới bảo mật phần cứng mạnh hơn' }],
    realWorldApplications: ['Docker, Kubernetes, ECS và CI/CD runners — thực tế Cloud hay chạy **Container bên trong VM** để hưởng cả sự tiện lợi đóng gói của Container và lớp bảo vệ cứng của VM!'],
    commonMistakes: ['Nghĩ có thể chạy trực tiếp Docker image nhân Linux trên Windows Kernel mà không có máy ảo — Docker Desktop thực chất âm thầm chạy một VM Linux (WSL2/HyperKit) để chứa các Linux containers!'],
    interviewQuestions: [{ question: 'Container được tạo nên từ những cơ chế cốt lõi nào của Linux Kernel và tại sao nó khởi động nhanh hơn VM?', answer: 'Container dựa trên Linux Namespaces (cô lập tầm nhìn PID/Mạng/Mount), cgroups (giới hạn CPU/RAM) và OverlayFS (lớp file system). Vì nó dùng chung Host OS Kernel mà không phải boot nguyên một Guest OS Kernel mới nên khởi động chỉ mất vài mili-giây.' }],
    exercises: [{ id: 'ex_1203_1', prompt: 'Chạy `unshare --uts --fork bash` rồi đổi `hostname` trong shell con; kiểm tra xem `hostname` máy thật có bị đổi theo không.', solutionHint: 'Không, vì UTS namespace đã cô lập hostname giữa shell con và host.' }],
  },
  {
    id: 'os_12_04',
    moduleId: 'os_m12',
    code: '12.04',
    title: 'Distributed OS Concepts & Logical Clocks',
    subtitle: 'Không có Shared Memory & Global Clock: Lamport Timestamps, Vector Clocks và Consensus (Raft/Paxos).',
    tags: ['Distributed Systems', 'Lamport Clock', 'Raft', 'CAP'],
    relatedTopicIds: ['os_12_05', 'os_06_04', 'os_08_05'],
    overview: 'Khi hệ thống mở rộng vượt khỏi 1 máy tính vật lý, hai giả định hiển nhiên của OS đơn máy sụp đổ hoàn toàn: không còn bộ nhớ chung và không có đồng hồ vật lý đồng bộ tuyệt đối.',
    coreConcepts: ['Eight Fallacies of Distributed Computing', 'Happened-Before Relation (->)', 'Lamport Logical Clocks & Vector Clocks', 'State Machine Replication & Raft Consensus'],
    definitions: [{ term: 'Happened-Before (a -> b)', meaning: 'Quan hệ nhân quả logic (Lamport): nếu sự kiện a gửi thông điệp dẫn tới sự kiện b, bất kể đồng hồ vật lý trên hai máy lệch nhau ra sao, ta chắc chắn a xảy ra trước b.' }],
    detailedTheory: `### Tại sao Đồng hồ vật lý (NTP) không đáng tin cậy để sắp thứ tự sự kiện?\nĐồng hồ thạch anh trên 2 server luôn bị trôi (Clock Skew / Drift). Thậm chí khi NTP đồng bộ lại, thời gian vật lý trên một máy có thể **nhảy lùi về quá khứ**!\nDo đó hệ phân tán dùng **Logical Clocks (Lamport/Vector)** để xác định quan hệ nhân quả và **Consensus (Raft/Paxos)** để bầu Leader và đồng bộ Replicated Log an toàn khi một phần cụm bị sập mạng.`,
    howItWorks: ['Mỗi node giữ bộ đếm logic `L`.', 'Mỗi sự kiện cục bộ tăng `L = L + 1`.', 'Khi gửi tin nhắn, đính kèm `L`; máy nhận cập nhật `L = max(L_local, L_msg) + 1`.'],
    diagram: defaultDiagram('Distributed Consensus', 'Node A (Leader + WAL)', 'AppendEntries RPC (Raft)', 'Quorum Nodes B & C'),
    algorithms: [{ name: 'Raft Leader Election & Log Replication', summary: 'Chia bài toán đồng thuận thành Leader Election (randomized timeout) và Replicated Log (majority quorum).', complexity: 'O(N) messages per commit' }],
    codeExample: { language: 'text', title: 'Quy tắc cập nhật Lamport Clock giữa 2 Nodes', code: `Node 1 (L=1) gửi msg(t=2) ---> Node 2 đang có L=0\nNode 2 cập nhật: L = max(0, 2) + 1 = 3` },
    comparisons: [{ aspect: 'Khả năng phát hiện đồng thời', optionA: 'Lamport Clock: Nếu a -> b thì L(a) < L(b) (nhưng ngược lại chưa chắc)', optionB: 'Vector Clock: So sánh được chính xác cả quan hệ nhân quả lẫn 2 sự kiện Concurrent!' }],
    realWorldApplications: ['etcd (bộ não trạng thái của Kubernetes dùng Raft)', 'ZooKeeper', 'CockroachDB & TiKV (Multi-Raft + HLC Hybrid Logical Clocks).'],
    commonMistakes: ['Dùng `System.currentTimeMillis()` của các server khác nhau để quyết định "Last-Write-Wins" trong cơ sở dữ liệu phân tán — sẽ bị mất dữ liệu vì lệch đồng hồ!'],
    interviewQuestions: [{ question: 'Tại sao hệ thống phân tán (như etcd, ZooKeeper) cần thuật toán Consensus như Raft thay vì dùng đồng hồ NTP?', answer: 'Vì mạng có thể đứt/chậm bất định và đồng hồ vật lý trên các máy luôn bị lệch hoặc nhảy lùi bởi NTP; Raft đảm bảo đa số (quorum) đồng ý một thứ tự log duy nhất bất chấp node chết hay gói tin đến muộn.' }],
    exercises: [{ id: 'ex_1204_1', prompt: 'Trong cụm Raft có 5 nodes, cụm chịu được tối đa bao nhiêu node chết mà vẫn còn bầu được Leader và ghi dữ liệu?', solutionHint: 'Quorum = floor(5/2) + 1 = 3 nodes sống -> chịu được tối đa 2 node chết.' }],
  },
  {
    id: 'os_12_05',
    moduleId: 'os_m12',
    code: '12.05',
    title: 'Distributed File Systems & Cloud Storage Mapping',
    subtitle: 'Từ NFS, GFS/HDFS tới Object Storage (S3): khi File System của OS bước lên mạng lưới.',
    tags: ['NFS', 'Distributed FS', 'Object Storage', 'CAP'],
    relatedTopicIds: ['os_08_01', 'os_08_05', 'os_12_04'],
    overview: 'Nối tiếp tri thức File System ở Module 08 sang quy mô nhiều máy chủ: làm sao nhiều máy cùng chia sẻ file nhất quán mà không bị nút cổ chai?',
    coreConcepts: ['NFS (Stateless Protocol & Client Caching)', 'GFS / HDFS (Chunkserver + Single Metadata Master)', 'POSIX Consistency vs Eventual Consistency', 'Block vs File (NFS) vs Object Storage (S3)'],
    definitions: [{ term: 'NFS Close-to-Open Consistency', meaning: 'Thay đổi bạn ghi vào file trên máy A có thể chưa thấy ngay trên máy B cho đến khi máy A gọi `close()` (flush về server) và máy B gọi `open()` mới.' }],
    detailedTheory: `### Ba mô hình lưu trữ hạ tầng Cloud\n1. **Block Storage (EBS)**: Giống ổ đĩa thô gắn vào 1 VM (nhanh cho Database, định dạng ext4/xfs).\n2. **Shared File System (NFS/EFS)**: Nhiều máy mount chung 1 cây thư mục POSIX.\n3. **Object Storage (S3/MinIO)**: Bỏ cấu trúc cây thư mục lồng sâu & không sửa từng byte giữa file — chỉ có \`Bucket + Key -> Immutable Blob\`, mở rộng gần như vô hạn.`,
    howItWorks: ['Tách Metadata Server (Namenode) khỏi Data Chunkservers.', 'Client hỏi Metadata Server lấy danh sách IP chứa các chunk 64MB/128MB.', 'Client đọc/ghi trực tiếp từ Chunkservers không đi qua Master để tránh nghẽn cổ chai.'],
    diagram: defaultDiagram('Distributed FS (GFS/HDFS)', 'Client asks Master', 'Master returns Chunk IPs', 'Client streams <-> Chunkservers'),
    algorithms: [{ name: 'Consistent Hashing (Storage Ring)', summary: 'Ánh xạ khóa/object lên vòng băm để khi thêm/bớt máy chủ chỉ phải dời O(K/N) dữ liệu.', complexity: 'O(log N) ring lookup' }],
    codeExample: { language: 'text', title: 'So sánh khi nào chọn Block vs Shared FS vs Object Storage', code: `- Chạy PostgreSQL/MySQL: Block Storage (EBS / NVMe)\n- Chia sẻ file config/media nhiều pod K8s: Shared File (NFS/EFS)\n- Lưu hàng tỷ ảnh, video, backup, Data Lake: Object Storage (S3)` },
    comparisons: [{ aspect: 'Khả năng scale & API', optionA: 'Distributed POSIX FS (NFS/CephFS): Hỗ trợ sửa byte giữa file, khó scale hàng tỷ file', optionB: 'Object Storage (S3): Immutable blob, HTTP API, dễ scale vô hạn' }],
    realWorldApplications: ['AWS S3, MinIO, HDFS (Big Data), Ceph và Google File System (GFS).'],
    commonMistakes: ['Cố gắng mount một kho Object Storage (như `s3fs`) như ổ đĩa thật rồi chạy Database lên đó — mỗi thao tác sửa vài byte sẽ phải tải và ghi lại cả file khổng lồ!'],
    interviewQuestions: [{ question: 'Kiến trúc GFS/HDFS tách Metadata và Data bằng cách nào để tránh Master trở thành điểm nghẽn băng thông?', answer: 'Master chỉ lưu metadata và vị trí các chunk (trong RAM) để trả danh sách địa chỉ cho Client; toàn bộ luồng dữ liệu nặng (GB/TB) sau đó được Client truyền thẳng với các Chunkserver.' }],
    exercises: [{ id: 'ex_1205_1', prompt: 'Giải thích vì sao không nên chạy file SQLite nằm trên ổ mạng NFS nếu nhiều máy cùng ghi vào nó.', solutionHint: 'NFS client caching và khóa file phân tán (`flock`) qua mạng rất dễ hỏng/race condition khi nhiều node ghi đồng thời vào 1 file SQLite.' }],
  }
);

// Helper to ensure 12 modules x 5 topics = 60 topics cleanly!
// Let's verify Modules 01..12 counts carefully. Currently:
// M01: 5, M02: 5, M03: 5, M04: 5, M05: 5, M06: 5, M07: 5, M08: 5, M09: 5, M10: 5, M11: 5, M12: 5 => 12 * 5 = 60 topics!

export const INITIAL_OS_FLASHCARDS: OsFlashcard[] = [
  {
    id: 'fc_os_1',
    topicId: 'os_02_02',
    front: 'Mode Switch khác Context Switch ở điểm cốt lõi nào?',
    back: 'Mode Switch chỉ đổi mức đặc quyền (User Mode ↔ Kernel Mode) trên CÙNG một luồng; Context Switch chuyển CPU sang chạy Process/Thread khác và có thể phải đổi Page Table (CR3) & làm nguội TLB/Cache.',
    confidence: 'learning',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'fc_os_2',
    topicId: 'os_07_04',
    front: 'Minor Page Fault vs Major Page Fault?',
    back: 'Minor Page Fault: trang hợp lệ đã nằm sẵn trong RAM (Page Cache/CoW), chỉ cần nối PTE (~µs). Major Page Fault: buộc phải đọc trang từ Disk/Swap vào RAM (~ms, chậm hơn ~1000x).',
    confidence: 'learning',
    createdAt: Date.now() - 7100000,
  },
  {
    id: 'fc_os_3',
    topicId: 'os_06_03',
    front: 'Tại sao Condition Variable luôn dùng `while (!cond) wait()` thay vì `if (!cond) wait()`?',
    back: 'Vì 2 lý do: (1) Mesa Semantics — luồng khác có thể chen vào đổi điều kiện giữa lúc signal() và lúc giành lại Lock; (2) Spurious Wakeups — OS có thể đánh thức luồng vô cớ.',
    confidence: 'learning',
    createdAt: Date.now() - 7000000,
  },
  {
    id: 'fc_os_4',
    topicId: 'os_12_03',
    front: 'Ba cơ chế Linux Kernel tạo nên một Container là gì?',
    back: 'Namespaces (cô lập tầm nhìn PID/NET/MNT), cgroups (giới hạn tài nguyên CPU/RAM/I/O) và Union FS/OverlayFS (chia sẻ Image Read-Only với lớp ghi riêng) — tất cả dùng chung Host OS Kernel.',
    confidence: 'learning',
    createdAt: Date.now() - 6900000,
  },
];

export const INITIAL_OS_NOTES: OsResearchNote[] = [
  {
    id: 'os_rn_1',
    topicId: 'os_07_04',
    title: 'Liên hệ Virtual Memory & Copy-on-Write với Redis `BGSAVE`',
    question: 'Tại sao khi Redis dump RDB bằng `fork()`, RAM thực không tăng gấp đôi ngay lập tức?',
    content:
      'Nhờ Copy-on-Write (CoW): sau `fork()`, tiến trình con chia sẻ chung các trang RAM vật lý của tiến trình cha ở chế độ Read-Only. OS chỉ nhân bản trang vật lý khi tiến trình cha xử lý lệnh ghi (write) mới làm chạm tới trang đó.',
    tags: ['Virtual Memory', 'CoW', 'Backend'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'os_rn_2',
    topicId: 'os_08_05',
    title: 'Tại sao Database vẫn phải dùng `fsync()` dù đã gọi `write()`?',
    question: 'Hành vi của Linux Page Cache khi `write()` xong nhưng bị mất điện đột ngột là gì?',
    content:
      '`write()` mặc định chỉ chép dữ liệu vào Write-Back Page Cache trên RAM. Muốn giao dịch bền vững (Durability trong ACID), DB buộc phải gọi `fsync()` để ép Kernel đẩy Dirty Pages qua Disk Controller xuống NAND/Platter.',
    tags: ['Page Cache', 'fsync', 'Database'],
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
  },
];

export function buildInitialOsKnowledgeBaseState(): OsKnowledgeBaseState {
  const topics = RAW_TOPIC_SEEDS.map(makeTopic);
  // Seed realistic initial study trail on 2 foundational topics without marking everything done
  const t0 = topics.find((t) => t.id === 'os_01_01');
  if (t0) {
    t0.status = 'completed';
    t0.understanding = 'solid';
    t0.bookmarked = true;
  }
  const tMem = topics.find((t) => t.id === 'os_07_04');
  if (tMem) {
    tMem.status = 'learning';
    tMem.understanding = 'solid';
    tMem.bookmarked = true;
  }

  return {
    activeTab: 'dashboard',
    activeModuleId: 'os_m07',
    activeTopicId: 'os_07_04',
    topics,
    flashcards: INITIAL_OS_FLASHCARDS,
    researchNotes: INITIAL_OS_NOTES,
    revisionLogs: [
      {
        id: 'os_rev_1',
        topicId: 'os_07_04',
        dateStr: '2026-11-20',
        timestamp: Date.now() - 3600000,
        note: 'Kết nối Virtual Memory → Paging (07.02) → Page Replacement (07.05) → Copy-on-Write (03.05).',
        statusAfter: 'learning',
      },
    ],
  };
}
