export interface BeginnerTopicGuide {
  analogy: string;
  whyNeeded: string;
  deepExplanation: string[];
  jargonBuster: { term: string; plain: string }[];
  takeaway: string;
}

import { OS_BEGINNER_GUIDES_PART2 } from './osBeginnerGuidesPart2';

const OS_BEGINNER_GUIDES_PART1: Record<string, BeginnerTopicGuide> = {
  // =========================================================================
  // MODULE 01: INTRODUCTION TO OPERATING SYSTEMS
  // =========================================================================
  os_01_01: {
    analogy:
      'Hãy tưởng tượng phần cứng máy tính (CPU, thanh RAM, ổ SSD, loa, chuột) giống như một căn bếp có đúng 1 cái chảo (CPU), 1 mặt bàn sơ chế (RAM) và 1 cái tủ lạnh (SSD). Các ứng dụng bạn mở (Chrome, Spotify, VS Code) giống như 10 vị khách cùng bước vào bếp nấu món của riêng họ. Nếu không có Quản Lý Bếp (Hệ điều hành - OS), 10 người sẽ giành nhau cái chảo, đổ nhầm muối vào nồi của nhau và làm cháy bếp. OS đứng giữa phân lịch: người này xào 5 giây rồi nhường chảo cho người kia, chia mặt bàn thành từng ô riêng có vách ngăn để không ai đụng đồ của ai.',
    whyNeeded:
      'Nếu không có OS, mỗi khi viết một chương trình nhỏ in chữ ra màn hình, lập trình viên phải tự viết hàng ngàn dòng lệnh điều khiển điện áp từng chân cắm CPU, tự nhớ địa chỉ vật lý từng ô nhớ RAM và tự lái đầu đọc ổ cứng. Hơn nữa bạn chỉ chạy được đúng 1 app tại một thời điểm.',
    deepExplanation: [
      'Trụ cột 1 — Virtualization (Ảo hóa CPU & RAM): Máy chỉ có vài nhân CPU, nhưng bạn mở được 50 app cùng lúc vì OS liên tục tráo đổi chúng cực nhanh (vài mili-giây một lần). Mỗi app có cảm giác như nó đang độc chiếm nguyên một chiếc CPU và nguyên thanh RAM riêng.',
      'Trụ cột 2 — Concurrency (Điều phối chạy song song): Khi nhiều luồng việc cùng chạm vào một dữ liệu (ví dụ 2 tab cùng trừ tiền một tài khoản), OS cung cấp ổ khóa (Lock) và luật xếp hàng để kết quả không bị sai lệch.',
      'Trụ cột 3 — Persistence (Lưu trữ bền vững): RAM sẽ mất sạch dữ liệu ngay khi mất điện. OS biến các dãy số 0/1 vô nghĩa trên ổ cứng thành khái niệm Thư mục và Tệp tin (File) để lưu an toàn lâu dài.',
      'Nguyên tắc vàng Mechanism vs Policy: OS luôn tách "cách làm" (Mechanism - ví dụ cách lưu trạng thái CPU để đổi app) khỏi "luật quyết định" (Policy - ví dụ app nào quan trọng hơn để được chạy trước).',
    ],
    jargonBuster: [
      { term: 'Operating System (OS)', plain: 'Phần mềm quản lý tối cao (như Windows, macOS, Linux) điều khiển phần cứng và phục vụ các ứng dụng.' },
      { term: 'Virtualization', plain: 'Đánh lừa mỗi ứng dụng rằng nó có CPU và RAM riêng, dù thực tế tất cả đang dùng chung phần cứng.' },
      { term: 'Abstraction', plain: 'Che giấu chi tiết phần cứng phức tạp bên dưới, chỉ đưa ra nút bấm/lệnh đơn giản cho lập trình viên dùng.' },
    ],
    takeaway: 'Hệ điều hành là "người quản lý tài nguyên" biến phần cứng thô sơ, khó dùng thành môi trường gọn gàng, an toàn cho nhiều app chạy cùng lúc.',
  },
  os_01_02: {
    analogy:
      'OS giống như Ban Quản Lý một tòa chung cư lớn: lo điện nước (CPU), chia căn hộ riêng từng nhà không cho hàng xóm đi lạc vào (RAM), quản lý kho đồ dưới hầm (Ổ cứng), tiếp nhận shipper ra vào cổng (Chuột/Bàn phím/Mạng) và kiểm tra thẻ cư dân ở quầy bảo vệ (Bảo mật).',
    whyNeeded:
      'Một máy tính có hàng chục thiết bị chạy ở tốc độ chênh lệch nhau hàng triệu lần (CPU chạy theo nano-giây, ổ cứng/mạng tính bằng mili-giây). Cần một bộ não trung tâm giữ trật tự và không cho ứng dụng lỗi làm sập cả máy.',
    deepExplanation: [
      '1. Quản lý Tiến trình (Process): Tạo, tạm dừng, cấp thời gian CPU và dọn dẹp khi chương trình đóng.',
      '2. Quản lý Bộ nhớ (RAM): Theo dõi từng MB RAM nào đang thuộc về app nào, cấp thêm khi cần và thu hồi ngay khi app tắt.',
      '3. Quản lý Lưu trữ (File System): Tạo cây thư mục, ghi đọc file và giữ file không bị hỏng kể cả khi đột ngột rút phích điện.',
      '4. Quản lý Thiết bị Vào/Ra (I/O): Đóng vai trò phiên dịch thống nhất — app chỉ cần gọi lệnh "In" hay "Lưu file", không cần biết bạn cắm chuột Logitech hay ổ Samsung.',
      '5. Bảo vệ & Phân quyền: Ngăn app thường đọc trộm mật khẩu hoặc phá hủy dữ liệu của hệ thống và người dùng khác.',
    ],
    jargonBuster: [
      { term: 'Time-multiplexing', plain: 'Chia theo thời gian: dùng chung 1 CPU bằng cách luân phiên mỗi người chạy một chút.' },
      { term: 'Space-multiplexing', plain: 'Chia theo không gian: cắt RAM và ổ cứng thành nhiều lô riêng biệt cho từng app.' },
      { term: 'I/O (Input/Output)', plain: 'Mọi hoạt động nhận dữ liệu vào (bàn phím, chuột, mạng) và xuất ra (màn hình, loa, ổ đĩa).' },
    ],
    takeaway: 'OS lo trọn 5 việc sống còn: Tiến trình (CPU), Bộ nhớ (RAM), Lưu trữ (File), Thiết bị (I/O) và Bảo mật.',
  },
  os_01_03: {
    analogy:
      'Lịch sử OS giống quá trình nâng cấp một quán ăn: Ban đầu chỉ 1 khách vào ăn xong mới tới khách sau (Single-tasking). Sau đó khách gọi món theo xấp phiếu (Batch). Tiếp đến phục vụ chạy qua chạy lại châm trà cho 10 bàn cùng lúc để không bàn nào phải đợi lâu (Time-sharing). Rồi có nhiều bếp nấu đồng thời (Multicore & Cloud).',
    whyNeeded:
      'Hiểu lịch sử giúp bạn hiểu tại sao OS ngày nay lại có cơ chế ngắt, chia thời gian và đa nhân: mọi tính năng đều sinh ra để không lãng phí tiền mua CPU đắt đỏ khi CPU phải ngồi chờ ổ đĩa chậm chạp.',
    deepExplanation: [
      'Thế hệ 1 (1940s–1950s): Không có OS. Nạp 1 chương trình bằng thẻ đục lỗ, CPU ngồi rảnh 90% thời gian chờ người ta bấm nút và đợi băng từ quay.',
      'Thế hệ 2 (Batch Systems): Gom nhiều việc chạy liên tiếp tự động, nhưng vẫn chỉ chạy xong bài 1 mới tới bài 2. Nếu bài 1 đọc file chậm, CPU vẫn đứng nhìn.',
      'Thế hệ 3 (Multiprogramming & Time-sharing - 1960s–1970s): Bước ngoặt lớn! Trong lúc App A đợi đọc ổ đĩa, OS lập tức đẩy CPU sang chạy App B. Sau đó nhờ đồng hồ nhịp (Timer Interrupt), OS cắt thời gian cực nhỏ (vài mili-giây) đổi qua đổi lại, tạo ra kỷ nguyên UNIX và gõ phím phản hồi tức thì.',
      'Thế hệ 4 (PC, Mobile & Cloud ngày nay): Thêm giao diện đồ họa, nhiều nhân CPU thật sự chạy song song, và công nghệ ảo hóa/Docker chạy hàng nghìn máy ảo trên một máy chủ vật lý.',
    ],
    jargonBuster: [
      { term: 'Batch Processing', plain: 'Chạy theo lô: gom sẵn hàng loạt việc rồi bấm chạy một lèo từ đầu tới cuối không tương tác.' },
      { term: 'Time-sharing', plain: 'Chia sẻ thời gian: đổi app liên tục siêu nhanh để con người có cảm giác mọi thứ chạy đồng thời.' },
      { term: 'CPU Idle', plain: 'Tình trạng CPU ngồi chơi không làm gì trong khi chờ thiết bị chậm (như ổ cứng hoặc mạng).' },
    ],
    takeaway: 'OS tiến hóa xoay quanh đúng một mục tiêu: tận dụng tối đa từng mili-giây của CPU và phản hồi mượt mà cho con người.',
  },
  os_01_04: {
    analogy:
      'Không phải chiếc xe nào cũng giống nhau: Xe F1 ưu tiên phản xạ từng mili-giây (Real-time OS như phanh ABS ô tô), xe tải hạng nặng chở hàng ổn định ngày đêm (Server OS như Linux), còn xe tay ga đi làm hàng ngày phải êm, đẹp và dễ lái (Desktop/Mobile OS như Windows, macOS, iOS).',
    whyNeeded:
      'Mỗi môi trường đặt ra ưu tiên sống còn khác nhau. Hệ điều hành của túi khí ô tô mà bỗng dưng đứng lại 1 giây để "quét rác bộ nhớ" giống điện thoại là chết người!',
    deepExplanation: [
      'Desktop & Mobile OS (Windows, macOS, iOS, Android): Tối ưu trải nghiệm người dùng, mượt mà cảm ứng/đồ họa và tiết kiệm pin (trên điện thoại).',
      'Server / Cloud OS (Ubuntu, Debian, RHEL Linux): Có thể không cần màn hình đồ họa, chỉ tập trung chạy bền bỉ hàng năm trời không tắt máy, chịu hàng trăm nghìn kết nối mạng cùng lúc.',
      'Real-Time OS — RTOS (FreeRTOS, QNX trong y tế, tên lửa, xe hơi): Điểm ăn tiền không phải "chạy nhanh nhất" mà là "đúng hạn tuyệt đối" (Deterministic). Mọi tác vụ phanh xe phải xong trước 2 mili-giây, trễ 1 giây là hỏng.',
      'Distributed OS & Embedded: Chạy trên chip siêu nhỏ trong máy giặt, router Wi-Fi hoặc điều phối cụm hàng nghìn máy chủ như một hệ thống thống nhất.',
    ],
    jargonBuster: [
      { term: 'Real-Time (RTOS)', plain: 'Hệ điều hành thời gian thực — cam kết phản hồi trong giới hạn thời gian cứng không được phép trễ.' },
      { term: 'Throughput', plain: 'Thông lượng: tổng số công việc hoàn thành được trong một khoảng thời gian (quan trọng với Server).' },
      { term: 'Latency', plain: 'Độ trễ: thời gian từ lúc bạn bấm chuột/gõ phím tới lúc máy phản hồi.' },
    ],
    takeaway: 'Tùy mục đích (ưu tiên phản hồi mượt, chịu tải server, hay đúng hạn tuyệt đối) mà kiến trúc OS bên trong khác nhau hoàn toàn.',
  },
  os_01_05: {
    analogy:
      'Khi bạn bấm nút nguồn máy tính, CPU hoàn toàn "mất trí nhớ" vì RAM đang trống trơn. Giống như một người vừa tỉnh dậy: phải đọc tờ giấy ghi chú dán sẵn trên đầu giường (BIOS/UEFI ở chip ROM), tờ giấy chỉ ra chìa khóa tủ chính (Bootloader trên ổ cứng), rồi người đó mở tủ lấy toàn bộ sách hướng dẫn quản lý nhà (Kernel) vào não (RAM) để bắt đầu làm việc.',
    whyNeeded:
      'Một máy tính cần quy trình khởi động an toàn theo từng nấc để nạp OS vào RAM, và đồng thời kích hoạt "hai chế độ quyền lực" (User Mode & Kernel Mode) trước khi cho bất kỳ app nào chạy, tránh trường hợp một app dởm phá hỏng phần cứng ngay lúc bật máy.',
    deepExplanation: [
      'Bước 1 — Bật nguồn & Firmware (BIOS/UEFI): Chip điện gửi xung Reset, CPU nhảy tới địa chỉ cố định trên chip ROM bo mạch chủ để chạy BIOS/UEFI nhằm kiểm tra nhanh phần cứng (POST: có RAM, bàn phím chưa?).',
      'Bước 2 — Bootloader (vd: GRUB trên Linux): Firmware tìm phân vùng khởi động trên ổ SSD/NVMe để chạy một chương trình siêu nhỏ tên Bootloader.',
      'Bước 3 — Nạp Kernel vào RAM: Bootloader tìm file lõi Hệ điều hành (ví dụ vmlinuz), giải nén nạp vào RAM và trao quyền điều khiển cho nó.',
      'Bước 4 — Thiết lập Dual-Mode & PID 1: Kernel bật chế độ bảo vệ phần cứng (Kernel Mode là quyền Vua tối cao; User Mode là quyền dân thường bị giới hạn), rồi chạy tiến trình đầu tiên ở User Space (PID 1 như systemd hoặc launchd) để mở màn hình đăng nhập.',
    ],
    jargonBuster: [
      { term: 'BIOS / UEFI', plain: 'Phần mềm siêu nhỏ nằm chết trong chip trên mainboard, thức dậy đầu tiên khi ấn nút nguồn.' },
      { term: 'Bootloader', plain: 'Người đưa đò: chương trình nhỏ xíu làm đúng một việc là lôi Hệ điều hành từ ổ cứng lên RAM.' },
      { term: 'Dual-Mode', plain: 'Cơ chế phần cứng CPU chia làm 2 chế độ: Kernel Mode (làm được tất cả) và User Mode (bị canh gác).' },
    ],
    takeaway: 'Boot là chuỗi rước đuốc: Power -> BIOS/UEFI -> Bootloader -> OS Kernel -> User Apps, thiết lập rào bảo vệ ngay từ đầu.',
  },

  // =========================================================================
  // MODULE 02: OS ARCHITECTURE & SYSTEM CALLS
  // =========================================================================
  os_02_01: {
    analogy:
      'Hãy hình dung một Ngân Hàng. Khu vực sảnh khách hàng là **User Space** — ai cũng được vào viết giấy rút tiền, ngồi chờ. Khu vực kho két sắt phía sau kính chống đạn là **Kernel Space** — chỉ nhân viên mặc đồng phục (Hệ điều hành) mới được chạm vào tiền thật (RAM, CPU, Ổ cứng). Khách hàng tuyệt đối không được tự chạy vào kho móc tiền; muốn rút tiền phải đưa phiếu qua khe cửa kính cho nhân viên kiểm tra.',
    whyNeeded:
      'Nếu cho mọi app (game, trình duyệt web, app tải từ mạng) chạy tự do trực tiếp với phần cứng, chỉ cần 1 dòng code sai (hoặc virus) có thể ghi đè lên dữ liệu app khác, xóa sạch ổ cứng, hoặc làm treo cả máy.',
    deepExplanation: [
      'User Space (Không gian người dùng): Nơi chạy Chrome, Word, game, code Python/Java của bạn. App ở đây chỉ thấy không gian RAM riêng của chính nó; không thấy RAM của app khác và không được chạm trực tiếp ổ đĩa hay card mạng.',
      'Kernel Space (Không gian nhân): Nơi phần lõi OS cư trú. Kernel nhìn thấy toàn bộ RAM vật lý, điều khiển mọi thiết bị, quyết định ai được chạy lúc nào.',
      'Biên giới thép: Khi một app ở User Space thử lén đọc RAM của app khác hoặc tự đụng phần cứng, chính con chip CPU sẽ báo lỗi vi phạm (Segmentation Fault / General Protection Fault) và Kernel lập tức "giết" app vi phạm đó ngay, giúp hệ thống còn lại không hề bị vạ lây.',
    ],
    jargonBuster: [
      { term: 'Kernel', plain: 'Phần cốt lõi tối cao của Hệ điều hành, làm việc trực tiếp với phần cứng.' },
      { term: 'User Space', plain: 'Vùng an toàn dành cho các phần mềm thông thường chạy, bị giới hạn quyền lực.' },
      { term: 'Crash Isolation', plain: 'Cách ly lỗi: một tab Chrome chết chỉ sập tab đó, không làm máy tính tắt nguồn.' },
    ],
    takeaway: 'Chia đôi User Space và Kernel Space là tường lửa nội bộ giúp máy tính vừa an toàn vừa không bị sập dây chuyền khi 1 app lỗi.',
  },
  os_02_02: {
    analogy:
      'Cùng một con người (CPU), khi ở ngoài đường bạn là **User Mode** (không được tự ý phá cửa vào kho bạc), nhưng khi quẹt thẻ biến hình vào ca làm việc sau quầy giao dịch thì trở thành **Kernel Mode** (có chìa khóa két). Hành động quẹt thẻ chuyển qua lại đó gọi là **Mode Switch**.',
    whyNeeded:
      'Phần cứng CPU phải có một bit cờ vật lý nhớ rõ ngay lúc này lệnh đang chạy thuộc phe "thường dân" hay phe "chủ hệ thống". Nếu không, virus chỉ việc tự gọi hàm đọc đĩa của OS là qua mặt được.',
    deepExplanation: [
      'Bit đặc quyền trong CPU (Privilege Ring): Trên chip Intel/AMD có 4 vòng nhưng OS hiện đại dùng 2 vòng chính: Ring 3 (User Mode) và Ring 0 (Kernel Mode). Một số lệnh nguy hiểm như tắt máy, bật tắt ngắt, đổi bảng nhớ RAM chỉ chạy được khi CPU đang ở Ring 0.',
      '3 cách hợp pháp để từ User Mode bước sang Kernel Mode:',
      '1. System Call (Chủ động xin): App muốn mở file -> chạy lệnh đặc biệt `syscall` / `svc` -> CPU tự động lưu vị trí cũ, bật sang Ring 0, nhảy đúng tới điểm gác cửa an toàn của Kernel.',
      '2. Hardware Interrupt (Phần cứng gõ cửa): Bạn gõ phím hoặc có gói tin Wi-Fi tới -> card phát tín hiệu điện -> CPU dừng app đang chạy, sang Ring 0 xử lý.',
      '3. Exception / Trap (App gặp lỗi): App chia cho 0 hoặc đọc vùng nhớ trống -> CPU chuyển sang Ring 0 cho Kernel giải quyết.',
    ],
    jargonBuster: [
      { term: 'Ring 0 / Ring 3', plain: 'Cấp bậc quyền lực trong chip CPU: Ring 0 là Vua (Kernel), Ring 3 là Dân (App).' },
      { term: 'Trap / Syscall instruction', plain: 'Lệnh đặc biệt buộc CPU gõ cửa gọi Kernel ở đúng cổng kiểm tra an toàn chứ không nhảy bừa.' },
      { term: 'Mode Switch', plain: 'Việc CPU chuyển quyền từ User Mode sang Kernel Mode và ngược lại.' },
    ],
    takeaway: 'App không thể "tự phong" làm Kernel; nó chỉ có thể gõ đúng cửa System Call để CPU tạm trao quyền vào Kernel xử lý hộ.',
  },
  os_02_03: {
    analogy:
      'Trong nhà hàng: Thực khách (App của bạn) không được vào bếp. Thực đơn (POSIX API như `printf`, `fopen` trong C/Python/Java) là thứ thân thiện để bạn chọn món. Còn **System Call** (`write`, `open`, `read`) là tờ phiếu order chuẩn mà người bồi bàn bắt buộc phải chuyển qua khe bếp để Đầu bếp (Kernel) thực hiện.',
    whyNeeded:
      'Nếu mỗi lập trình viên tự thao tác phần cứng theo kiểu khác nhau thì hỗn loạn. System Call là hợp đồng cố định duy nhất để hàng triệu app giao tiếp với Kernel.',
    deepExplanation: [
      'Tại sao gọi `printf("Hi")` không phải là 1 System Call trực tiếp? `printf` là hàm thư viện chạy ở User Space: nó format chữ cho đẹp, gom vào bộ đệm rồi mới gọi System Call `write(1, "Hi", 2)` một lần gửi xuống Kernel — giúp giảm số lần vượt biên giới sang Kernel Mode vốn tốn thời gian.',
      'Quy trình 1 System Call: (1) App đặt mã số lệnh (vd: syscall số 1 là `write`) và tham số vào thanh ghi CPU -> (2) Gọi lệnh `syscall` -> (3) CPU bật Kernel Mode, tra bảng địa chỉ hàm an toàn (Syscall Table) -> (4) Kernel kiểm tra quyền rồi thực thi ghi ra màn hình -> (5) Trả kết quả về User Mode.',
      'Mẹo hiệu năng cho người làm Backend: Gọi `read()` 1 byte 1 triệu lần (1 triệu syscall) chậm gấp trăm lần so với gọi `read()` 1 lần lấy 1 MB! Vì mỗi lần chuyển Mode Switch đều có chi phí.',
    ],
    jargonBuster: [
      { term: 'System Call (Syscall)', plain: 'Các hàm cổng dịch vụ chính thức mà Kernel cung cấp cho app bên ngoài gọi vào (như open, read, write, fork).' },
      { term: 'POSIX API', plain: 'Bộ chuẩn hàm lập trình chung trên Linux/macOS/UNIX để code C viết một lần chạy được trên nhiều hệ điều hành.' },
      { term: 'Overhead', plain: 'Chi phí phụ trội về thời gian/tài nguyên phải trả khi chuyển đổi qua lại giữa các chế độ.' },
    ],
    takeaway: 'System Call là "cổng hải quan" duy nhất nối ứng dụng với phần cứng; làm chủ nó giúp bạn hiểu sâu hiệu năng I/O và bảo mật.',
  },
  os_02_04: {
    analogy:
      'Monolithic Kernel (Nhân nguyên khối - như Linux) giống một công ty lớn mà toàn bộ các phòng ban (Nhân sự, Kế toán, Kho, Bảo vệ, Lái xe) ngồi chung trong **cùng một tầng nhà không có vách ngăn**. Giao tiếp giữa các phòng cực nhanh (quay mặt là nói chuyện được), nhưng nếu một ông lái xe (Driver) say xỉn làm đổ bàn làm việc, cả tầng công ty dễ sập theo.',
    whyNeeded:
      'Khi thiết kế nhân OS, kỹ sư luôn phải đánh đổi giữa tốc độ chạy siêu nhanh (mọi thứ gọi trực tiếp hàm của nhau trong Kernel) với độ an toàn cô lập lỗi.',
    deepExplanation: [
      'Cách hoạt động của Monolithic Kernel: Toàn bộ quản lý tiến trình, quản lý RAM, hệ thống file, mạng TCP/IP và hầu hết Driver thiết bị đều nằm chung một khối chương trình chạy ở Kernel Mode (Ring 0).',
      'Ưu điểm vượt trội: Nhanh! Khi gói tin mạng vào, card mạng giao thẳng cho module TCP/IP, rồi đẩy sang File System trong cùng một không gian nhớ mà không phải copy dữ liệu đi lại qua tin nhắn IPC.',
      'Nhược điểm: Một lỗi nhỏ trong 1 driver card đồ họa hoặc module Wi-Fi bên thứ 3 viết ẩu có thể làm toàn bộ máy tính sập nguồn (Kernel Panic trên Linux hoặc Màn hình xanh BSOD trên Windows). Linux khắc phục bớt bằng Loadable Kernel Modules (có thể nạp/gỡ từng module lúc chạy mà không phải biên dịch lại nhân).',
    ],
    jargonBuster: [
      { term: 'Monolithic Kernel', plain: 'Kiến trúc nhân gộp toàn bộ thành phần OS (CPU, RAM, File, Driver) vào chung một vùng đặc quyền cao nhất.' },
      { term: 'Kernel Panic / BSOD', plain: 'Lỗi nghiêm trọng bên trong Kernel khiến toàn bộ hệ điều hành phải dừng khẩn cấp để tránh hỏng dữ liệu.' },
      { term: 'Loadable Kernel Module', plain: 'Mảnh ghép cắm nóng vào nhân Linux (như driver USB/Wi-Fi) khi cần dùng.' },
    ],
    takeaway: 'Linux chọn Monolithic Kernel vì tốc độ tuyệt đối: mọi bộ phận lõi chia sẻ chung nhà Kernel Space.',
  },
  os_02_05: {
    analogy:
      'Microkernel (như QNX trên xe hơi) giống một vị Tổng giám đốc tối giản: trong phòng Chủ tịch chỉ giữ đúng 3 việc (chuyển thư, phân lịch, chia phòng RAM). Còn Kế toán (File System), Lái xe (Driver mạng), Bảo vệ (Security) đều bị đẩy ra làm các công ty con bên ngoài ở User Space. Nếu ông Lái xe đâm xe, Tổng giám đốc chỉ việc thay ông Lái xe mới — tòa nhà chính vẫn bình yên vô sự.',
    whyNeeded:
      'Trong máy bay, xe tự hành hay thiết bị y tế, tính ổn định không được phép sập toàn hệ thống quan trọng hơn việc nhanh hơn vài phần trăm hiệu năng.',
    deepExplanation: [
      'Microkernel: Nhân ở Kernel Mode chỉ nhỏ vài chục nghìn dòng code (làm đúng IPC gửi tin nhắn, lập lịch cơ bản, cấp trang nhớ). Còn Driver USB, hệ thống file, mạng chạy như các Process bình thường ở User Space. Nếu driver USB crash, OS tự khởi động lại mỗi driver đó trong 10 mili-giây!',
      'Đánh đổi của Microkernel: Chậm hơn Monolithic thuần túy vì mỗi lần đọc file, app phải gửi tin nhắn (IPC) qua Kernel -> tới File Server -> qua Kernel -> tới Disk Driver -> rồi trả ngược về.',
      'Hybrid Kernel (Windows NT, macOS XNU): Lấy ý tưởng pha trộn — đặt hầu hết thành phần quan trọng (File System, Network, Graphic driver) lại vào Kernel Mode cho nhanh giống Monolithic, nhưng giữ cấu trúc module hóa và một số dịch vụ ở User Space cho gọn gàng.',
    ],
    jargonBuster: [
      { term: 'Microkernel', plain: 'Nhân tối giản: chỉ giữ đúng vài việc tối thiểu ở Ring 0, đẩy File System và Driver ra User Space.' },
      { term: 'IPC (Inter-Process Communication)', plain: 'Cơ chế các tiến trình gửi tin nhắn qua lại cho nhau.' },
      { term: 'Hybrid Kernel', plain: 'Kiến trúc lai (dùng trên macOS và Windows), kết hợp sự gọn nhẹ của Microkernel và tốc độ của Monolithic.' },
    ],
    takeaway: 'Monolithic chạy nhanh nhất (Linux); Microkernel bền bỉ cô lập lỗi tốt nhất (xe/y tế); Hybrid cân bằng cả hai (Windows/macOS).',
  },

  // =========================================================================
  // MODULE 03: PROCESS MANAGEMENT & LIFECYCLE
  // =========================================================================
  os_03_01: {
    analogy:
      'Nếu **Program** (chương trình, file `.exe`) giống như một **cuốn sách công thức nấu ăn** nằm im trên kệ sách (ổ cứng), thì **Process** (tiến trình) chính là **quá trình người đầu bếp đang mở sách ra nấu thật trong bếp**! Bạn có thể mở 2 bản Chrome cùng lúc: chung 1 file chương trình trên đĩa, nhưng thành 2 Process độc lập với 2 không gian nhớ riêng.',
    whyNeeded:
      'Cần phân biệt rõ chương trình tĩnh nằm trên ổ đĩa và thực thể sống đang chạy trong RAM. Và mỗi Process cần được sắp xếp bộ nhớ gọn thành từng ngăn rõ ràng để biết biến toàn cục, biến tạm hàm, và bộ nhớ cấp phát nằm ở đâu.',
    deepExplanation: [
      '4 khu vực bộ nhớ kinh điển bên trong 1 Process (từ thấp lên cao):',
      '1. Text (Code) Segment: Chứa mã máy chỉ đọc (Read-only) các câu lệnh chương trình của bạn.',
      '2. Data & BSS Segment: Chứa các biến toàn cục (Global/Static variables) sống suốt đời Process.',
      '3. Heap (Mọc từ dưới lên): Vùng nhớ động khi code gọi `malloc()`, `new Object()`. Dùng xong không dọn dễ bị Memory Leak.',
      '4. Stack (Mọc từ trên xuống): Lưu biến cục bộ trong hàm và địa chỉ quay về khi gọi hàm lồng nhau. Đệ quy vô tận không có điểm dừng làm Stack chạm đáy -> tràn bộ nhớ (Stack Overflow)!',
    ],
    jargonBuster: [
      { term: 'Program vs Process', plain: 'Program là file tĩnh trên ổ đĩa; Process là chương trình đang sống, chạy trong RAM và có CPU riêng.' },
      { term: 'Stack', plain: 'Vùng nhớ ngăn xếp cho lời gọi hàm và biến cục bộ, tự động cấp và tự dọn rất nhanh khi thoát hàm.' },
      { term: 'Heap', plain: 'Kho nhớ tự do cho dữ liệu lớn/động (new, malloc), kích thước thay đổi linh hoạt lúc chạy.' },
    ],
    takeaway: 'Process = Chương trình đang chạy + Bộ nhớ riêng gồm 4 khu: Code, Data, Heap (mọc lên) và Stack (mọc xuống).',
  },
  os_03_02: {
    analogy:
      'Vòng đời của 1 Process giống một bệnh nhân vào phòng khám: Vừa tới cổng đăng ký (**New**) -> Ngồi ghế hành lang chờ bác sĩ gọi tên (**Ready**) -> Được bác sĩ khám trực tiếp (**Running**) -> Bác sĩ bảo đi chụp X-quang đợi kết quả thì ra sảnh chờ kết quả (**Blocked/Waiting**) -> Có kết quả lại vào hàng chờ khám tiếp (**Ready**) -> Khám xong ra về (**Terminated**).',
    whyNeeded:
      'Tại sao phải có cả trạng thái `Ready` và `Waiting`? Vì nếu CPU đang bận chạy app khác thì app sẵn sàng phải xếp vào `Ready`. Còn nếu app đang đợi gõ phím hoặc đọc file từ đĩa thì nhét CPU cho nó cũng vô ích — phải đẩy sang `Waiting` để nhường CPU cho việc khác.',
    deepExplanation: [
      '5 trạng thái kinh điển:',
      '- New: OS đang khởi tạo không gian bộ nhớ và hồ sơ cho Process.',
      '- Ready (Sẵn sàng): Đủ mọi thứ, chỉ chờ CPU rảnh là nhảy vào chạy ngay.',
      '- Running (Đang chạy): CPU đang thực sự chạy từng câu lệnh của Process này.',
      '- Blocked / Waiting (Đang chờ I/O): Process đang đợi đọc ổ đĩa, đợi mạng hoặc `sleep()`. Nó tự nguyện rời khỏi CPU.',
      '- Terminated / Zombie: Process đã chạy xong `exit()`. Nếu tiến trình cha chưa đọc mã kết thúc của nó, nó tạm nằm ở trạng thái Zombie (đã chết nhưng tên vẫn còn trong bảng danh sách).',
    ],
    jargonBuster: [
      { term: 'Ready vs Waiting', plain: 'Ready là "chỉ thiếu mỗi CPU là chạy"; Waiting là "có đưa CPU cũng chẳng làm gì được vì đang đợi đĩa/mạng".' },
      { term: 'Zombie Process', plain: 'Tiến trình đã chạy xong hết và giải phóng RAM, chỉ còn giữ lại đúng dòng trạng thái chờ tiến trình cha thu nhận.' },
      { term: 'Preemption', plain: 'Tước quyền: OS chủ động ngắt app đang chạy để nhường CPU cho app khác (Running -> Ready).' },
    ],
    takeaway: 'Process chuyển qua lại liên tục giữa Ready, Running và Waiting; phân biệt được Ready vs Waiting là nắm được gốc rễ tối ưu I/O.',
  },
  os_03_03: {
    analogy:
      'Process Control Block (PCB) giống như **Hồ sơ bệnh án** hoặc **Thẻ căn cước** của mỗi Process đặt trên bàn bác sĩ (Kernel). Khi bác sĩ tạm dừng khám cho Anh A để sang khám cho Chị B, bác sĩ phải ghi vội vào hồ sơ Anh A: "Đang khám dở tới bước 3, nhịp tim 80" — lát nữa quay lại mới biết khám tiếp từ đâu chứ không phải hỏi lại từ đầu.',
    whyNeeded:
      'Một OS phải quản lý hàng trăm Process. Kernel không thể nhớ bằng đầu được Process nào đang chạy tới dòng lệnh thứ mấy, đang mở những file nào, còn bao nhiêu RAM.',
    deepExplanation: [
      'Bên trong một cấu trúc PCB (`task_struct` trong Linux) lưu mọi thông tin tối quan trọng của một Process:',
      '1. PID (Process ID): Mã số định danh duy nhất (vd: PID 1245) và PPID (PID của tiến trình cha đẻ ra nó).',
      '2. CPU State (Registers & Program Counter): Địa chỉ câu lệnh tiếp theo sẽ chạy và toàn bộ giá trị tạm trong thanh ghi CPU lúc bị tạm dừng.',
      '3. Memory Pointers: Con trỏ tới bảng trang bộ nhớ (Page Table) giúp CPU biết vùng RAM nào thuộc về Process này.',
      '4. I/O & Open Files: Bảng File Descriptor chứa danh sách các file và kết nối mạng (Socket) mà Process đang mở.',
      '5. Scheduling Info: Độ ưu tiên, thời gian CPU đã dùng.',
    ],
    jargonBuster: [
      { term: 'PCB (Process Control Block)', plain: 'Bản hồ sơ dữ liệu trong Kernel chứa toàn bộ thông tin sống của một tiến trình.' },
      { term: 'PID', plain: 'Số CMND duy nhất của một tiến trình đang chạy trong hệ thống.' },
      { term: 'Program Counter (PC)', plain: 'Con trỏ đánh dấu dòng lệnh máy chính xác mà CPU sắp sửa chạy tiếp theo.' },
    ],
    takeaway: 'PCB là "bản sao linh hồn" của tiến trình; lưu lại PCB giúp OS đóng băng và rã đông bất kỳ app nào mà app không hề hay biết.',
  },
  os_03_04: {
    analogy:
      'Context Switch giống như một kỳ thủ đánh cờ nhiều bàn cùng lúc: anh ta dừng suy nghĩ ở Bàn 1, ghi lại thế cờ và đồng hồ của Bàn 1 xuống giấy, đi bộ sang Bàn 2, đọc lại thế cờ Bàn 2 rồi mới nghĩ nước đi tiếp. Thời gian đi bộ + đọc lại giấy đó không tạo ra nước đi nào — gọi là chi phí Context Switch.',
    whyNeeded:
      'Chính cơ chế Context Switch cho phép 1 nhân CPU chạy hàng trăm app đồng thời. Tuy nhiên nếu chuyển đổi quá dày đặc (hàng trăm nghìn lần/giây), CPU sẽ dành hết thời gian chỉ để... ghi chép hồ sơ thay vì làm việc thật!',
    deepExplanation: [
      'Quy trình 4 bước của một lần Context Switch (từ Process A sang Process B):',
      '1. Timer Interrupt phát tín hiệu hết lượt chạy -> CPU chuyển vào Kernel Mode.',
      '2. Save State: Kernel lưu toàn bộ thanh ghi CPU và Program Counter của A vào hồ sơ `PCB_A`.',
      '3. Switch Address Space: Kernel đổi bảng bản đồ bộ nhớ (thanh ghi CR3 trên x86) từ bản đồ của A sang của B -> điều này khiến bộ nhớ đệm CPU (TLB & L1/L2 Cache) của A bị "lạnh"/mất hiệu lực.',
      '4. Restore State & Return: Nạp thanh ghi từ `PCB_B` lên CPU, chuyển về User Mode -> Process B chạy tiếp ngay tại dòng lệnh nó từng dừng.',
      'Lưu ý quan trọng: Chi phí tốn nhất không phải vài micro-giây copy thanh ghi, mà là **Cache Pollution** — app mới chạy phải mất công nạp lại dữ liệu từ RAM chậm chạp vào L1/L2 Cache.',
    ],
    jargonBuster: [
      { term: 'Context Switch', plain: 'Hành động lưu trạng thái của app hiện tại và nạp trạng thái của app khác lên CPU để chạy.' },
      { term: 'CPU Cache / TLB', plain: 'Bộ nhớ đệm siêu nhỏ, siêu nhanh ngay trong chip CPU để khỏi phải chạy ra thanh RAM chậm chạp.' },
      { term: 'Cache Pollution', plain: 'Hiện tượng đổi sang app khác khiến toàn bộ dữ liệu đệm quý giá của app cũ trong chip bị ghi đè mất.' },
    ],
    takeaway: 'Context Switch đem lại đa nhiệm, nhưng chuyển đổi quá nhiều sẽ đốt sạch hiệu năng vì làm mất dữ liệu đệm trong CPU.',
  },
  os_03_05: {
    analogy:
      'Vì các Process bị cô lập bộ nhớ hoàn toàn (nhà nào biết nhà nấy), khi 2 Process muốn nói chuyện (ví dụ web server Nginx muốn chuyển request cho app Python xử lý), chúng không thể thò tay sang RAM của nhau mà phải dùng **IPC**: như viết thư bỏ vào ống dẫn (**Pipe**), gọi điện nội bộ (**Unix Socket**), hoặc cùng xin một phòng họp chung (**Shared Memory**).',
    whyNeeded:
      'Bảo mật cô lập giữ máy an toàn, nhưng phần mềm hiện đại luôn phối hợp nhiều Process (trình duyệt Chrome tách riêng Process cho từng Tab). IPC là những đường dây liên lạc được Kernel cấp phép và kiểm soát.',
    deepExplanation: [
      'Kernel sắp xếp các Process vào nhiều hàng đợi: Job Queue (tất cả), Ready Queue (đang chờ CPU), và Device Wait Queues (ví dụ danh sách app đang chờ đọc ổ đĩa).',
      'Hai mô hình IPC kinh điển để các Process trao đổi dữ liệu:',
      '1. Message Passing (Pipe, Message Queue, Sockets): Process A gửi tin nhắn vào Kernel -> Kernel copy sang cho Process B. Rất an toàn, dễ đồng bộ (vd lệnh `ls | grep txt` dùng Pipe nối output của `ls` vào input của `grep`), nhưng tốn công copy dữ liệu qua Kernel.',
      '2. Shared Memory (Bộ nhớ dùng chung): Hai Process xin Kernel ánh xạ chung 1 dải RAM vật lý vào địa chỉ ảo của cả hai. Sau đó A viết vào là B đọc thấy tức thì ở tốc độ RAM (nhanh nhất!), không qua Kernel nữa — nhưng cả 2 phải tự đặt khóa đồng bộ để không viết đè lên nhau.',
    ],
    jargonBuster: [
      { term: 'Ready Queue', plain: 'Hàng đợi các tiến trình đã đủ điều kiện chạy và chỉ đang xếp hàng chờ tới lượt CPU.' },
      { term: 'Pipe (Đường ống)', plain: 'Kênh truyền dữ liệu 1 chiều nối đầu ra của lệnh này thẳng vào đầu vào của lệnh kia.' },
      { term: 'Shared Memory', plain: 'Một vùng RAM chung được Kernel cho phép 2 tiến trình cùng nhìn thấy để trao đổi dữ liệu siêu tốc.' },
    ],
    takeaway: 'Process cô lập nhau để an toàn; khi cần hợp tác thì dùng Pipe/Socket (dễ dùng, an toàn) hoặc Shared Memory (nhanh nhất).',
  },

  // =========================================================================
  // MODULE 04: THREADS & CONCURRENCY FOUNDATIONS
  // =========================================================================
  os_04_01: {
    analogy:
      'Một **Process** giống như một **Ngôi nhà riêng**, còn **Thread (Luồng)** giống như **những thành viên sống bên trong ngôi nhà đó**. Trong một ngôi nhà (app Word): 1 người chuyên nhận gõ chữ từ bàn phím, 1 người chuyên kiểm tra lỗi chính tả, 1 người âm thầm bấm lưu file. Tất cả dùng chung 1 tủ lạnh (Heap RAM) và chung địa chỉ nhà, chỉ mỗi người có cuốn sổ nháp nhỏ riêng (Stack riêng).',
    whyNeeded:
      'Tạo hẳn một Process mới rất tốn RAM và liên lạc phải đi vòng qua Kernel (IPC). Trong một ứng dụng như web browser hay game, ta cần nhiều tác vụ cùng chạy trên chung dữ liệu một lúc mà không phải copy RAM.',
    deepExplanation: [
      'Thread là "đơn vị thực thi nhỏ nhất" mà CPU lập lịch chạy.',
      'Những gì các Thread trong cùng 1 Process CHIA SẺ CHUNG: Code, Biến toàn cục (Data), Vùng nhớ Heap, và bảng các File/Socket đang mở. Nhờ vậy Thread A tạo một object trên Heap là Thread B dùng được ngay.',
      'Những gì mỗi Thread CÓ RIÊNG: Mã ID (TID), tập thanh ghi CPU riêng (Program Counter riêng để mỗi luồng chạy ở một hàm khác nhau), và **Stack riêng** (để biến cục bộ của luồng này không trộn với luồng khác).',
      'Lợi ích & Nguy hiểm: Chuyển đổi giữa 2 Thread cùng nhà nhanh hơn nhiều so với chuyển Process vì không cần đổi bảng trang nhớ (Page Table). Nhưng vì dùng chung Heap nên 2 Thread dễ giẫm chân lên nhau (Race Condition).',
    ],
    jargonBuster: [
      { term: 'Thread (Luồng)', plain: 'Một đường chạy câu lệnh độc lập nằm bên trong một Process.' },
      { term: 'Shared Address Space', plain: 'Việc nhiều Thread dùng chung toàn bộ không gian nhớ Heap và biến toàn cục của cùng một Process.' },
      { term: 'Thread Stack', plain: 'Vùng nhớ ngăn xếp riêng cho từng Thread lưu biến tạm và các bước gọi hàm của riêng nó.' },
    ],
    takeaway: 'Process chia sẻ tài nguyên khó vì tách nhà; Threads chạy trong cùng 1 nhà Process nên giao tiếp siêu nhanh nhưng dễ xung đột dữ liệu chung.',
  },
  os_04_02: {
    analogy:
      'Hãy hình dung việc phân công **User Threads** (việc do app tạo) lên **Kernel Threads** (nhân lực thật sự mà OS nhìn thấy và chia cho nhân CPU): Mô hình `N:1` giống 10 việc nhưng giao đúng cho 1 anh công nhân làm hết (anh này nghỉ uống nước là 9 việc kia đứng hình); Mô hình `1:1` là 1 việc = 1 công nhân thật từ OS; Mô hình `M:N` là một nhóm nhỏ công nhân lành nghề luân phiên bốc khéo léo hàng nghìn việc nhẹ.',
    whyNeeded:
      'Lập trình viên có thể tạo 10.000 goroutines hoặc threads trong code, nhưng CPU vật lý chỉ có 8 nhân. OS và ngôn ngữ lập trình phải ánh xạ thế nào để tận dụng đủ 8 nhân mà không làm sập RAM?',
    deepExplanation: [
      '1. Mô hình Many-to-One (N:1 — User-level Threads cổ điển): OS không hề biết app tạo nhiều thread; nó chỉ thấy 1 Process. Nhược: nếu 1 thread đọc file bị block hoặc CPU nhiều nhân rảnh, cả app vẫn không chạy được trên nhiều nhân.',
      '2. Mô hình One-to-One (1:1 — Chuẩn của Linux/Windows hiện đại, Java/C++ pthread): Mỗi Thread bạn tạo trong code tương ứng 1 Thread thật trong Kernel. Ưu: Tận dụng tối đa 8–64 nhân CPU cùng lúc! Nhược: Tạo 100.000 thread theo kiểu 1:1 sẽ tốn hàng trăm MB RAM chỉ để giữ Stack của Kernel.',
      '3. Mô hình Many-to-Many (M:N — Green Threads, Go Goroutines, Java Virtual Threads): Tạo một số ít Kernel Thread (vd đúng 8 cái bằng 8 nhân CPU), rồi runtime của ngôn ngữ tự điều phối hàng trăm nghìn tác vụ nhẹ (vài KB mỗi tác vụ) chạy lên 8 nhân đó.',
    ],
    jargonBuster: [
      { term: '1:1 Model', plain: 'Mỗi thread của chương trình tương ứng đúng 1 thread thật do nhân hệ điều hành quản lý.' },
      { term: 'Green Thread / Goroutine', plain: 'Luồng siêu nhẹ do ngôn ngữ (Go, Java) quản lý ở User Space để chạy hàng trăm nghìn việc đồng thời không tốn RAM.' },
      { term: 'Blocking Syscall', plain: 'Lệnh gọi OS khiến luồng đang chạy phải đứng chờ xong (vd đọc ổ đĩa chậm) mới chạy tiếp.' },
    ],
    takeaway: 'Hệ điều hành hiện đại dùng mô hình 1:1 để tận dụng đa nhân; các ngôn ngữ backend dùng thêm M:N (Goroutines/Virtual Threads) để xử lý triệu kết nối.',
  },
  os_04_03: {
    analogy:
      '**Concurrency (Đồng thời)** giống như **1 người đầu bếp** rất giỏi xử lý nhiều việc xen kẽ: bật bếp luộc mì, trong lúc đợi nước sôi quay sang thái hành, rồi đảo thịt -> vẫn chỉ có 1 người (1 nhân CPU) nhưng mọi món đều tiến triển. **Parallelism (Song song)** là thuê hẳn **2 người đầu bếp đứng ở 2 bếp khác nhau** thực sự cắt thịt và luộc mì ở cùng một khoảnh khắc!',
    whyNeeded:
      'Nhiều người mới cứ nghĩ cài nhiều Thread trên máy 1 nhân là đang "chạy song song", hoặc tưởng code đa luồng trên nhiều nhân CPU lúc nào cũng nhanh hơn 1 nhân (thực tế nếu nhiều nhân tranh giành cùng 1 ổ khóa còn chạy chậm hơn 1 nhân!).',
    deepExplanation: [
      'Concurrency (Cấu trúc thiết kế): Bài toán chia chương trình thành nhiều tác vụ độc lập có thể xen kẽ nhau (Dealing with lots of things at once). Một máy 1 nhân CPU vẫn làm Concurrency tốt (chỉ là luân phiên qua lại).',
      'Parallelism (Thực thi phần cứng): Thực sự chạy hai lệnh ở cùng đúng một nano-giây trên ít nhất 2 nhân CPU vật lý (Doing lots of things at once).',
      'Định luật Amdahl: Nếu một chương trình có 50% phần việc bắt buộc chạy tuần tự (không chia nhỏ được), thì dù bạn mua chip 1.000 nhân CPU, tốc độ tổng thể tối đa cũng chỉ tăng được 2 lần! Điều này nhắc nhở dân làm backend không lạm dụng đa luồng bừa bãi.',
    ],
    jargonBuster: [
      { term: 'Concurrency', plain: 'Xử lý xen kẽ nhiều việc trong cùng một khoảng thời gian (có thể chỉ cần 1 nhân CPU).' },
      { term: 'Parallelism', plain: 'Chạy đồng thời tại đúng 1 thời điểm (bắt buộc phải có từ 2 nhân CPU trở lên).' },
      { term: 'Multicore', plain: 'Bộ vi xử lý chứa nhiều nhân xử lý vật lý thật sự bên trong một con chip.' },
    ],
    takeaway: 'Concurrency là cách tổ chức nhiều việc xen kẽ; Parallelism là chạy thật sự cùng một khoảnh khắc nhờ phần cứng đa nhân.',
  },
  os_04_04: {
    analogy:
      'Hai vợ chồng cùng dùng chung 1 thẻ ATM rút từ tài khoản có 100k. Đúng cùng một giây, cả hai máy ATM hỏi ngân hàng: "Còn đủ 100k không?" -> Ngân hàng đều gật đầu: "Còn 100k!". Thế là cả hai máy đều nhả 100k rồi trừ còn 0đ. Kết quả: tài khoản có 100k mà rút được 200k! Đó chính là **Race Condition (Tranh chấp dữ liệu)**.',
    whyNeeded:
      'Một dòng code tưởng chỉ có 1 bước như `balance = balance + 1` thực chất dưới con mắt CPU bị xé thành 3 bước rời rạc (Đọc từ RAM -> Cộng 1 trong CPU -> Ghi lại vào RAM). OS có thể cắt ngang giữa 3 bước này bất cứ lúc nào!',
    deepExplanation: [
      'Tại sao `count++` bị mất số khi chạy 2 Thread?',
      'Giả sử `count = 5`. Thread 1 đọc `count` thấy `5`, chưa kịp cộng thì OS tạm dừng Thread 1 để cho Thread 2 chạy. Thread 2 cũng đọc `count` thấy `5`, cộng thành `6` và ghi `6` vào RAM. Sau đó OS cho Thread 1 chạy tiếp: trong sổ nháp CPU của Thread 1 vẫn giữ số `5` cũ, nó cộng `1` thành `6` rồi ghi đè `6` lên RAM! Hai lần cộng mà `count` chỉ tăng từ 5 lên 6 thay vì 7.',
      'Tính bất định (Heisenbug): Lỗi Race Condition cực kỳ quái ác vì nó phụ thuộc vào thời điểm may rủi của OS; chạy thử trên máy mình 100 lần đúng, lên server đông người mới sập!',
    ],
    jargonBuster: [
      { term: 'Race Condition', plain: 'Lỗi kết quả sai lệch ngẫu nhiên phụ thuộc vào thứ tự chạy nhanh/chậm hên xui giữa các luồng.' },
      { term: 'Atomic Operation', plain: 'Thao tác "bất khả phân": hoặc chạy trọn vẹn từ đầu tới cuối không bị cắt ngang, hoặc chưa chạy chút nào.' },
      { term: 'Data Race', plain: 'Hai luồng cùng chạm vào 1 ô nhớ tại cùng thời điểm trong đó ít nhất 1 luồng đang ghi dữ liệu mà không dùng khóa.' },
    ],
    takeaway: 'Mọi thao tác Đọc -> Sửa -> Ghi trên dữ liệu dùng chung đều KHÔNG tự động an toàn nếu thiếu khóa bảo vệ.',
  },
  os_04_05: {
    analogy:
      'Nhà vệ sinh công cộng trên máy bay là một **Critical Section (Vùng găng)**: tại một thời điểm chỉ được phép đúng 1 người bước vào và gài chốt cửa (`Lock`). Nếu cửa đang có người (`Mutual Exclusion`), người tới sau phải xếp hàng đợi chứ không xô cửa vào chung; và người trong đó không được khóa cửa ngủ luôn trong đó (`Progress` & `Bounded Waiting`).',
    whyNeeded:
      'Để xóa bỏ Race Condition ở bài trước, ta cần khoanh vùng những dòng code có chạm vào dữ liệu chung và đặt ra 3 tiêu chuẩn toán học bắt buộc mọi giải pháp khóa (Mutex/Semaphore) phải thỏa mãn.',
    deepExplanation: [
      'Cấu trúc bảo vệ: Entry Section (xin khóa) -> **Critical Section** (đoạn code sửa biến chung) -> Exit Section (trả khóa) -> Remainder Section (code bình thường).',
      '3 tiêu chí vàng của bài toán Critical Section:',
      '1. Mutual Exclusion (Loại trừ tương hỗ): Tuyệt đối không bao giờ có từ 2 luồng trở lên cùng ở trong vùng găng một lúc.',
      '2. Progress (Tiến triển): Nếu vùng găng đang trống và có người muốn vào, việc chọn ai vào tiếp theo không được trì hoãn vô thời hạn.',
      '3. Bounded Waiting (Chờ hữu hạn): Không một luồng nào bị "bỏ đói" đứng chờ mãi mãi trong khi các luồng khác cứ chen ngang vào trước mặt nó.',
    ],
    jargonBuster: [
      { term: 'Critical Section', plain: 'Đoạn code ngắn chứa thao tác đọc/ghi dữ liệu dùng chung giữa nhiều luồng.' },
      { term: 'Mutual Exclusion', plain: 'Luật độc quyền: cùng một lúc chỉ duy nhất 1 người được bước vào vùng nhạy cảm.' },
      { term: 'Starvation (Đói CPU/Khóa)', plain: 'Tình trạng một luồng xui xẻo đứng chờ mãi không bao giờ tới lượt được phục vụ.' },
    ],
    takeaway: 'Chỉ khóa đúng đoạn Critical Section ngắn nhất có thể; khóa đúng phải đảm bảo an toàn (Mutual Exclusion) và không bỏ đói ai.',
  },

  // =========================================================================
  // MODULE 05: CPU SCHEDULING ALGORITHMS
  // =========================================================================
  os_05_01: {
    analogy:
      'FCFS (First-Come, First-Served) y hệt xếp hàng thanh toán ở siêu thị chỉ có 1 quầy thu ngân: Ai tới trước tính tiền trước. Nhưng nếu có 1 ông khách đẩy 2 xe hàng đầy ắp đứng ngay đầu hàng mất 30 phút, 5 người phía sau chỉ mua mỗi chai nước suối cũng phải đứng chôn chân đợi 30 phút — đó gọi là **Convoy Effect**.',
    whyNeeded:
      'Đây là thuật toán lập lịch đơn giản nhất (chỉ là một hàng đợi FIFO), giúp làm quen hai thước đo quan trọng: thời gian hoàn thành trọn vẹn và độ trễ phản hồi ban đầu.',
    deepExplanation: [
      'Cách tính 2 chỉ số lập lịch bạn bắt buộc phải biết:',
      '- Turnaround Time (Thời gian hoàn tất) = Lúc xong việc − Lúc bắt đầu xếp hàng.',
      '- Response Time (Thời gian phản hồi) = Lúc lần đầu được CPU sờ tới − Lúc bắt đầu xếp hàng. (Với app gõ chữ/UI, Response Time quyết định máy "mượt" hay "giật lag").',
      'Bẫy của FCFS: Convoy Effect (Hiệu ứng đoàn xe). Chỉ cần 1 việc nặng chạy trước mặt, toàn bộ các việc nhẹ xíu phía sau bị kéo thời gian chờ trung bình vọt lên gấp chục lần!',
    ],
    jargonBuster: [
      { term: 'FIFO / FCFS', plain: 'Vào trước phục vụ trước — giống xếp hàng mua vé xem phim không ưu tiên.' },
      { term: 'Convoy Effect', plain: 'Một tác vụ nặng chạy chậm chặn hết đường khiến cả đoàn tác vụ nhẹ phía sau kẹt cứng.' },
      { term: 'Response Time', plain: 'Độ lâu phải đợi tính từ lúc bấm mở app tới khi thấy app bắt đầu phản hồi.' },
    ],
    takeaway: 'FCFS dễ viết nhất nhưng cực kỳ tệ cho hệ thống tương tác vì 1 tác vụ nặng sẽ làm kẹt cả hàng.',
  },
  os_05_02: {
    analogy:
      'Đi siêu thị có làn thu ngân nhanh: Nếu đứng đầu quầy toàn người mua 1 chai nước thì cho tính trước hết (30 giây mỗi người), rồi mới tính tới ông mua 2 xe hàng sau cùng -> tổng thời gian chờ trung bình của mọi người giảm xuống mức thấp nhất có thể!',
    whyNeeded:
      'Để khắc phục lỗi kẹt xe của FCFS ở bài trước, toán học chứng minh: nếu ưu tiên việc ngắn nhất làm trước (**SJF**) hoặc cho phép ngắt ngang nếu có việc ngắn hơn nữa nhảy vào (**SRTF**), thời gian hoàn tất trung bình là tối ưu nhất!',
    deepExplanation: [
      'SJF (Shortest Job First - Non-preemptive): Trong số những việc đang nằm chờ, việc nào cần ít thời gian CPU nhất thì chạy trước. Nhưng nếu việc dài đang chạy dở thì không bị cắt ngang.',
      'SRTF (Shortest Remaining Time First - Preemptive): Đang chạy việc dài 10 giây, mới chạy được 2 giây (còn 8 giây) thì bỗng có việc ngắn 3 giây tới -> OS cắt ngang ngay, cho việc 3 giây chạy trước!',
      'Tại sao ngoài đời OS không dùng thuần SJF/SRTF? Vì thực tế khi bạn vừa bấm mở Chrome hoặc chạy 1 câu lệnh, **OS không thể bói trước được** app đó sắp tốn 1 mili-giây hay chạy suốt 5 tiếng đồng hồ!',
    ],
    jargonBuster: [
      { term: 'SJF / SRTF', plain: 'Ưu tiên chạy công việc ngắn nhất (hoặc còn ít thời gian nhất) trước để giảm thời gian chờ chung.' },
      { term: 'Non-preemptive', plain: 'Không ngắt ngang: một khi đã cho chạy thì để nó chạy tới lúc xong hoặc tự nhường.' },
      { term: 'Optimal Turnaround', plain: 'Thời gian hoàn thành trung bình ngắn nhất có thể về mặt toán học.' },
    ],
    takeaway: 'Ưu tiên việc ngắn trước là tối ưu về thời gian chờ, nhưng nhược điểm chí mạng ngoài đời là không đoán trước được độ dài tương lai của app.',
  },
  os_05_03: {
    analogy:
      'Phòng cấp cứu bệnh viện phân loại theo mức độ khẩn cấp (xe cấp cứu đi trước xe máy). Nhưng có một sự cố trớ trêu (**Priority Inversion**): Ông Giám đốc VIP (Priority cao) phải đứng chờ Anh Bảo vệ (Priority thấp) mở cổng, nhưng Anh Bảo vệ lại bị đám công nhân bình thường (Priority trung bình) kéo vào hỏi đường mãi không tới cổng được — thành ra Ông VIP bị bọn Trung bình kẹt gián tiếp!',
    whyNeeded:
      'Thực tế âm thanh cuộc gọi hoặc thao tác chạm màn hình phải được ưu tiên hơn tiến trình quét virus nền. Nhưng chia cấp bậc ưu tiên mà thiếu luật bảo vệ sẽ gây ra treo cứng hoặc bỏ đói.',
    deepExplanation: [
      'Hai thảm họa của Priority Scheduling thuần túy:',
      '1. Starvation (Đói CPU): Nếu liên tục có việc ưu tiên cao nhảy vào, việc ưu tiên thấp có thể chờ đến tận ngày mai chưa được chạy. Giải pháp: **Aging** — xếp hàng càng lâu thì điểm ưu tiên tự động nhích dần lên.',
      '2. Priority Inversion (Đảo ngược ưu tiên — từng suýt làm hỏng tàu tự hành Mars Pathfinder của NASA!): Tác vụ Thấp đang giữ 1 ổ khóa (Lock) mà tác vụ Cao cần dùng; tác vụ Trung bình không liên quan gì lại nhảy vào cướp CPU của tác vụ Thấp -> tác vụ Cao ngồi chờ dài cổ. Giải pháp: **Priority Inheritance** — tạm mượn quyền Cao cho người đang giữ khóa chạy lẹ cho xong rồi trả khóa!',
    ],
    jargonBuster: [
      { term: 'Aging', plain: 'Kỹ thuật tăng dần độ ưu tiên theo thời gian chờ để không ai bị bỏ rơi vĩnh viễn.' },
      { term: 'Priority Inversion', plain: 'Nghịch lý việc cực quan trọng bị kẹt gián tiếp vì một việc bình thường đè lên việc thấp đang giữ khóa.' },
      { term: 'Priority Inheritance', plain: 'Cho tác vụ thấp tạm "mượn danh" ưu tiên cao của tác vụ đang đợi mình để giải phóng ổ khóa thật nhanh.' },
    ],
    takeaway: 'Phân ưu tiên luôn phải đi kèm Aging (chống đói) và Priority Inheritance (chống kẹt khóa ngược đời).',
  },
  os_05_04: {
    analogy:
      'Giống trò chơi xoay vòng: Cả bàn 4 người chơi mỗi người được cầm tay cầm đúng **20 giây (Time Quantum)**, hết giờ còi hú bắt buộc chuyển tay cầm cho người kế tiếp dù ván chưa xong. Nhờ vậy ai cũng nhanh chóng được sờ tới lượt mình, không phải chờ ai chơi xong hẳn cả tiếng.',
    whyNeeded:
      'Khắc phục điểm yếu phản hồi chậm của FCFS và không cần đoán trước độ dài như SJF: Round Robin sinh ra để màn hình gõ phím và nhiều ứng dụng cùng phản hồi đều đặn.',
    deepExplanation: [
      'Cách hoạt động: Hàng đợi Ready chạy theo vòng tròn. OS định một lát thời gian (Time Quantum / Time Slice, thường 4ms – 20ms). App chạy hết lát này tự động quay về cuối hàng.',
      'Nghệ thuật chọn Time Quantum:',
      '- Nếu Quantum quá lớn (vd: 5 giây): Máy bị giật lag, bấm chuột 3 giây mới thấy con trỏ nhúc nhích (biến thành FCFS).',
      '- Nếu Quantum quá nhỏ (vd: 0.05 mili-giây): Đáp ứng siêu nhanh nhưng CPU mất quá nhiều thời gian cho việc Context Switch đổi tới đổi lui (lãng phí 50% sức mạnh CPU).',
      '- Đánh đổi: Round Robin cho **Response Time rất tốt**, nhưng **Turnaround Time hơi kém** nếu nhiều app ngang nhau cùng chạy vì tất cả cùng về đích sát giờ nhau thay vì xong dứt điểm từng cái.',
    ],
    jargonBuster: [
      { term: 'Round Robin (RR)', plain: 'Lập lịch xoay vòng: chia thời gian CPU thành từng lát đều nhau, mỗi app chạy một lát rồi nhường.' },
      { term: 'Time Quantum (Time Slice)', plain: 'Khoảng thời gian tối đa một ứng dụng được chạy liên tục trước khi phải nhường cho app khác.' },
      { term: 'Fairness', plain: 'Tính công bằng: bảo đảm app nào cũng nhận được phần CPU tương xứng trong thời gian ngắn.' },
    ],
    takeaway: 'Round Robin mang lại sự mượt mà nhờ xoay vòng lát thời gian; chọn Quantum chuẩn là cân bằng giữa độ mượt và chi phí chuyển đổi.',
  },
  os_05_05: {
    analogy:
      'Làm sao OS vừa không biết trước app nặng hay nhẹ, vừa muốn app gõ phím phản hồi tức thì lại không bỏ đói việc render video? **MLFQ** dùng chiêu: Mới vào cho ngồi ghế VIP (ưu tiên cao nhất). Nếu mới chạy chút đã tự đi nghỉ (app gõ phím đợi gõ tiếp) -> giữ ở ghế VIP; nếu ngốn hết trọn lượt CPU mà chưa xong (app render video nặng) -> giáng xuống hàng dưới với lượt chạy dài hơn! Sau một lúc lại reset đẩy hết lên VIP để không ai bị đói.',
    whyNeeded:
      'Đây chính là thuật toán thật sự đứng sau các Hệ điều hành đời thực (Windows, macOS, Linux CFS) giải quyết cùng lúc cả độ mượt tương tác lẫn hiệu năng tính toán nặng.',
    deepExplanation: [
      '5 luật cốt lõi của MLFQ (Multi-Level Feedback Queue): chia nhiều hàng đợi ưu tiên từ cao xuống thấp.',
      '- Mọi app mới sinh ra nằm ở tầng cao nhất vì biết đâu nó là thao tác gõ phím nhanh.',
      '- Nếu app dùng hết sạch Time Slice của tầng cao -> tụt xuống tầng thấp hơn (được nhận diện là CPU-heavy).',
      '- Nếu app tự nhường CPU sớm để chờ I/O (như đợi click chuột/gói mạng) -> giữ nguyên ở tầng cao để lần sau người dùng bấm là phản hồi ngay!',
      '- Priority Boost (Đẩy định kỳ): Mỗi 1 giây chẳng hạn, đưa tất cả các app ở tầng đáy lên lại tầng đỉnh để chống bỏ đói (Starvation).',
      'Linux CFS (Completely Fair Scheduler): Thay vì chia tầng rời rạc, CFS dùng một sổ theo dõi `vruntime` (ai mới ăn ít thời gian CPU nhất trong lịch sử thì luôn được xếp chạy tiếp theo bằng cây Đỏ-Đen `O(log N)`).',
    ],
    jargonBuster: [
      { term: 'MLFQ', plain: 'Hàng đợi đa mức tự học: tự quan sát hành vi quá khứ của app để xếp nó vào nhóm tương tác nhanh hay nhóm tính nặng.' },
      { term: 'Linux CFS', plain: 'Bộ lập lịch công bằng của Linux — luôn chọn tiến trình có tổng thời gian CPU đã hưởng ít nhất chạy tiếp.' },
      { term: 'Priority Boost', plain: 'Định kỳ nâng mọi tiến trình lên hàng ưu tiên cao để việc cũ nặng không bị chết đói ở đáy.' },
    ],
    takeaway: 'MLFQ và Linux CFS tự đoán bản chất app qua hành vi thực tế mà không cần lập trình viên khai báo trước.',
  },

  // =========================================================================
  // MODULE 06: SYNCHRONIZATION & DEADLOCK
  // =========================================================================
  os_06_01: {
    analogy:
      'Mutex (Mutual Exclusion Lock) chính là **chiếc chìa khóa duy nhất của một phòng họp**. Muốn sửa dữ liệu chung, Thread phải cầm được chìa khóa (`lock()`). Nếu Thread khác tới thấy phòng đang khóa: cách thô là đứng ngay trước cửa bấm tay nắm liên tục mỗi giây xem mở chưa (**Spinlock** — tốn pin/CPU vô ích); cách khôn là để lại số điện thoại rồi về giường ngủ, lúc người kia trả chìa khóa thì lễ tân gọi dậy (**Sleeping Mutex / Futex**).',
    whyNeeded:
      'Để thực thi "vùng găng" trong thực tế, OS cung cấp công cụ phần cứng (lệnh nguyên tử CAS / Test-and-Set) ghép với hàng đợi ngủ của Kernel thành chiếc khóa Mutex vừa đúng vừa không đốt CPU.',
    deepExplanation: [
      'Spinlock (Khóa quay): Thread đứng vòng lặp `while (locked) ;` đốt 100% 1 nhân CPU để canh cửa. Chỉ nên dùng bên trong Kernel khi đoạn code giữ khóa siêu ngắn (vài nano-giây) để đỡ tốn công đi ngủ rồi thức dậy (Context Switch).',
      'Sleeping Mutex: Nếu cửa đang khóa -> Thread báo Kernel cho mình ngủ (`Blocked`), nhường CPU cho app khác. Khi chủ khóa gọi `unlock()`, Kernel đánh thức một Thread đang đợi lên `Ready`.',
      'Futex (Fast Userspace Mutex — Vũ khí bí mật của Linux): Khi không có ai tranh giành khóa (99% trường hợp), việc khóa và mở chạy hoàn toàn bằng lệnh nguyên tử ở User Space tốn đúng vài nano-giây mà **không cần gọi System Call**! Chỉ khi thực sự có người đụng cửa trùng lúc mới nhờ Kernel cho đi ngủ.',
    ],
    jargonBuster: [
      { term: 'Mutex', plain: 'Ổ khóa độc quyền (0 hoặc 1): chỉ 1 Thread đang giữ nó mới được đụng vào tài nguyên, và chính người khóa mới được mở.' },
      { term: 'Spinlock', plain: 'Kiểu chờ kiểm tra liên tục trong vòng lặp khiến CPU nóng rực mà không chịu ngủ nhường lượt.' },
      { term: 'Futex', plain: 'Khóa thông minh trên Linux: bình thường chạy siêu nhanh ở User Space, có tranh chấp mới gọi Kernel cho ngủ.' },
    ],
    takeaway: 'Luôn dùng Mutex (Futex) khi bảo vệ dữ liệu chung ở ứng dụng; chỉ dùng Spinlock cho khóa siêu ngắn ở tầng Kernel.',
  },
  os_06_02: {
    analogy:
      'Nếu Mutex là **chìa khóa 1 chỗ** (nhà vệ sinh 1 phòng), thì **Semaphore** giống như **bảng đếm số chỗ trống của bãi giữ xe có 5 ô (`S = 5`)**. Mỗi xe vào bảng trừ 1 (`wait`); tới khi bảng về `0` (hết chỗ), xe thứ 6 phải đợi trước barrier. Cứ có 1 xe ra (`signal`/`post`), bảng cộng 1 và barrier nhấc lên cho 1 xe kế vào!',
    whyNeeded:
      'Nhiều bài toán không chỉ khóa đúng 1 người, mà cần giới hạn tối đa N người (vd Database chỉ cho tối đa 10 kết nối cùng lúc), hoặc báo hiệu "Anh A làm xong bước 1 rồi, Anh B mới được chạy bước 2".',
    deepExplanation: [
      'Hai thao tác kinh điển (do Edsger Dijkstra đặt tên):',
      '- `wait()` (hay `P()`, `acquire()`): Giảm biến đếm đi 1. Nếu đếm < 0 (hết vé), luồng hiện tại ngủ chờ.',
      '- `post()` (hay `V()`, `release()`): Tăng biến đếm lên 1 và đánh thức 1 luồng đang đợi nếu có.',
      'Ba bài toán đa luồng kinh điển giải bằng Semaphore:',
      '1. Producer–Consumer (Nhà sản xuất & Người tiêu dùng): Bếp nấu bỏ bánh lên khay tối đa 10 cái; shipper tới lấy. Dùng 2 semaphore đếm số chỗ trống và số bánh có sẵn để bếp không làm tràn khay và shipper không lấy khay rỗng.',
      '2. Readers–Writers: Cho 100 người cùng đọc sách một lúc thoải mái, nhưng hễ có 1 người muốn sửa nội dung sách thì phải chờ hết người đọc rồi khóa cửa viết một mình.',
      '3. Dining Philosophers: 5 triết gia ngồi bàn tròn chỉ có 5 chiếc đũa -> minh họa cách cầm đũa khéo để không chết đói tập thể (Deadlock).',
    ],
    jargonBuster: [
      { term: 'Semaphore', plain: 'Biến đếm tài nguyên có vé giới hạn N: còn vé (> 0) thì vào, hết vé (= 0) thì xếp hàng đợi.' },
      { term: 'Producer–Consumer', plain: 'Mô hình truyền việc qua hàng đợi: một bên đẻ việc vào hàng, bên kia bốc việc ra xử lý.' },
      { term: 'Signaling', plain: 'Dùng Semaphore khởi đầu bằng 0 để bắt buộc Thread B phải chờ Thread A bắn tín hiệu xong việc mới chạy.' },
    ],
    takeaway: 'Mutex để giữ quyền sở hữu dữ liệu (ai khóa người đó mở); Semaphore là vé đếm số lượng hoặc bắn pháo hiệu báo xong việc.',
  },
  os_06_03: {
    analogy:
      'Semaphore dùng tay rất dễ quên `signal()` hoặc đảo thứ tự làm treo app. **Monitor** giống như gói gọn dữ liệu + ổ khóa + phòng chờ thành một **căn phòng tự động quản lý**: cứ bước vào cửa lớp/hàm là tự khóa, bên trong có sẵn chiếc chuông báo (**Condition Variable**): nếu chưa có hàng thì bấm "tạm đi ngủ ngoài phòng chờ (`wait`)", tới lúc có hàng mới người kia nhấn "báo thức cho người đang đợi (`notify/signal`)".',
    whyNeeded:
      'Trong Java (`synchronized`), Python (`threading.Condition`), hay C++ (`std::condition_variable`), Monitor là công cụ bậc cao giúp code đa luồng sạch hơn và ít lỗi vặt hơn tự viết Semaphore.',
    deepExplanation: [
      'Tại sao phải có Condition Variable (`wait` + `notify`) đi cùng Mutex? Vì nếu Thread A giữ khóa `Mutex` để kiểm tra `if (queue.isEmpty())` mà thấy rỗng rồi đứng ngủ luôn tại chỗ khi vẫn ôm khóa `Mutex`, thì Thread B không thể nào cầm được `Mutex` để bỏ hàng mới vào queue -> cả hai đứng nhìn nhau mãi mãi! `cond.wait(mutex)` làm một việc thần kỳ nguyên tử: **vừa nhả khóa Mutex vừa đi ngủ** cùng một khoảnh khắc!',
      'Quy tắc VÀNG (Mesa Semantics) luôn phải nhớ: **Luôn dùng `while (chưa_có_dữ_liệu) cond.wait()`, TUYỆT ĐỐI không dùng `if`!** Vì từ lúc bạn được đánh thức tới lúc thực sự nhận lại khóa, có thể có người khác đã nhanh tay lấy mất phần dữ liệu đó (hoặc bị đánh thức nhầm - Spurious Wakeup).',
    ],
    jargonBuster: [
      { term: 'Condition Variable', plain: 'Cơ chế giúp luồng đang giữ khóa có thể tạm nhả khóa để ngủ chờ một điều kiện đúng (vd: hàng đợi có dữ liệu).' },
      { term: 'Spurious Wakeup', plain: 'Hiện tượng hệ điều hành vô tình đánh thức luồng đang ngủ dù điều kiện chưa hẳn đã thỏa, nên phải kiểm tra lại bằng vòng while.' },
      { term: 'Monitor', plain: 'Kiến trúc đóng gói dữ liệu chung, khóa Mutex và Condition Variable vào chung một đối tượng an toàn.' },
    ],
    takeaway: 'Gặp Condition Variable là nhớ hai câu thần chú: `wait` tự nhả khóa khi ngủ, và luôn bọc kiểm tra điều kiện trong vòng `while`.',
  },
  os_06_04: {
    analogy:
      'Bốn chiếc ô tô đi tới ngã tư 4 hướng cùng một lúc. Mỗi xe giữ chặt làn dưới bánh mình (Hold) và nhất định không chịu lùi, chờ chiếc xe bên phải nhường đường (Wait) -> Xe 1 chờ Xe 2 -> Xe 2 chờ Xe 3 -> Xe 3 chờ Xe 4 -> Xe 4 chờ Xe 1. Tất cả đứng im tới hết ngày -> Đó là **Deadlock (Khóa chết)**!',
    whyNeeded:
      'Đây là lỗi cực kỳ nổi tiếng trong lập trình đa luồng và Database. Chỉ cần hiểu đúng 4 điều kiện sinh ra Deadlock, bạn có thể bẻ gãy hoàn toàn lỗi này ngay từ lúc viết code.',
    deepExplanation: [
      '4 Điều kiện Coffman — Deadlock CHỈ xảy ra nếu cả 4 điều kiện sau ĐỒNG THỜI đúng:',
      '1. Mutual Exclusion: Tài nguyên chỉ dùng 1 người một lúc (không chia sẻ chung được).',
      '2. Hold and Wait: Đang ôm chặt ổ khóa A trong tay, nhưng vẫn đòi xin thêm ổ khóa B.',
      '3. No Preemption: Không ai được giật ổ khóa khỏi tay người đang cầm.',
      '4. Circular Wait: Tạo thành vòng tròn chờ nhau (A chờ của B, B chờ của A).',
      'Cách chống Deadlock đơn giản và hiệu quả nhất thực chiến: **Phá điều kiện thứ 4 (Lock Ordering)**! Quy ước chung toàn team: hễ cần cả 2 khóa `Account_1` và `Account_2`, mọi người LUÔN PHẢI khóa cái có ID nhỏ trước, ID lớn sau. Không bao giờ tạo được vòng tròn chờ -> 100% không bao giờ Deadlock!',
    ],
    jargonBuster: [
      { term: 'Deadlock', plain: 'Tình trạng hai hay nhiều luồng đứng im chờ vĩnh viễn vì mỗi bên đang giữ thứ bên kia cần.' },
      { term: 'Coffman Conditions', plain: '4 điều kiện bắt buộc cùng tồn tại mới tạo nên Deadlock; chỉ cần phá vỡ 1 trong 4 là hết Deadlock.' },
      { term: 'Lock Ordering', plain: 'Quy tắc sắp thứ tự khóa cố định (vd luôn khóa ID nhỏ trước) để triệt tiêu hoàn toàn vòng tròn chờ.' },
    ],
    takeaway: 'Muốn triệt tiêu Deadlock trong code: áp dụng **Lock Ordering** (luôn lấy các ổ khóa theo một thứ tự thống nhất từ nhỏ đến lớn).',
  },
  os_06_05: {
    analogy:
      'Hai người đi ngược chiều đụng mặt nhau trong hành lang hẹp. Cả hai đều quá lịch sự: Anh A bước sang trái nhường đường thì đúng lúc Anh B cũng bước sang phía đó để nhường -> Lại đụng -> Lại cùng bước sang bên kia nhường tiếp -> Cả hai nhảy qua nhảy lại mãi không ai đi qua được! Đó là **Livelock**: CPU chạy 100% hì hục làm việc nhưng không ai tiến lên được bước nào.',
    whyNeeded:
      'Nhiều người sửa Deadlock bằng cách "nếu không lấy được khóa B thì nhả khóa A ra làm lại", nhưng nếu hai luồng cứ làm lại cùng nhịp thì sinh ra Livelock còn tốn CPU hơn cả Deadlock.',
    deepExplanation: [
      'Phân biệt 3 trạng thái kẹt: Deadlock (tất cả ngủ im chờ nhau, CPU 0%); Starvation (1 người bị kẹt chờ hoài trong khi người khác vẫn qua phà phà); Livelock (hai bên cứ nhường qua nhường lại liên tục, CPU 100% mà không xong việc).',
      'Cách phá Livelock: Thêm độ trễ ngẫu nhiên (**Randomized Backoff** - như cách Ethernet/Wi-Fi khi đụng nhau mỗi bên chờ ngẫu nhiên một vài mili-giây khác nhau rồi mới thử lại).',
      'Lock-Free & CAS (Compare-And-Swap): Cho các biến đếm đơn giản (như `AtomicInteger` trong Java hay `std::atomic` trong C++), CPU hỗ trợ lệnh phần cứng kiểm tra và thay giá trị trực tiếp mà không cần dựng ổ khóa -> nhanh hơn và miễn nhiễm hoàn toàn Deadlock!',
    ],
    jargonBuster: [
      { term: 'Livelock', plain: 'Kẹt sống: hai bên liên tục đổi trạng thái để nhường nhau một cách đối xứng nên không ai tiến triển được.' },
      { term: 'Randomized Backoff', plain: 'Chờ một khoảng thời gian ngẫu nhiên trước khi thử lại để hai bên không đụng nhau cùng một nhịp nữa.' },
      { term: 'CAS (Compare-And-Swap)', plain: 'Lệnh phần cứng siêu nhanh: "Nếu ô nhớ đúng bằng giá trị X cũ thì mới đổi sang Y", giúp lập trình không cần ổ khóa.' },
    ],
    takeaway: 'Deadlock là đứng im, Livelock là nhảy múa tại chỗ; các biến đếm nhỏ nên dùng `Atomic` (CAS) thay vì khóa nặng.',
  },
};

export const OS_BEGINNER_GUIDES: Record<string, BeginnerTopicGuide> = {
  ...OS_BEGINNER_GUIDES_PART1,
  ...OS_BEGINNER_GUIDES_PART2,
};
