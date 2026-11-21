import type { BeginnerTopicGuide } from './osBeginnerGuides';

export const OS_BEGINNER_GUIDES_PART2: Record<string, BeginnerTopicGuide> = {
  // =========================================================================
  // MODULE 07: MEMORY MANAGEMENT & VIRTUAL MEMORY
  // =========================================================================
  os_07_01: {
    analogy:
      'Hãy tưởng tượng thanh RAM như một bãi đỗ xe dài 100 mét chỉ đỗ xe theo kích thước xe thật: Xe A (20m) đỗ, Xe B (15m) đỗ, Xe C (25m) đỗ. Sau đó Xe B lái đi -> trống 15m ở giữa. Lát sau có 1 xe buýt 30m tới: dù tổng chỗ trống của bãi cộng lại là 55m, nhưng nó bị xé lẻ chỗ này 15m chỗ kia 15m -> không chỗ nào đủ 30m liền mạch cho xe buýt đỗ! Đó là **External Fragmentation (Phân mảnh ngoài)**.',
    whyNeeded:
      'Trước khi có Virtual Memory & Paging, OS cấp phát RAM kiểu liền kề (Contiguous) bị lãng phí hàng đống RAM vụn không dùng nổi.',
    deepExplanation: [
      'Internal Fragmentation (Phân mảnh trong): Cấp cho app một hộp cố định 4 KB, nhưng app chỉ xài 1 KB -> dư 3 KB nằm chết bên trong hộp đó không ai lấy dùng được.',
      'External Fragmentation (Phân mảnh ngoài): Khoảng trống RAM thừa rất nhiều nhưng nằm rải rác từng khe nhỏ giữa các khối đang dùng -> không ghép thành một dải liền lớn để cấp phát được.',
      '3 chiến lược tìm chỗ trống cổ điển:',
      '- First-Fit: Quét từ đầu bãi thấy khe nào vừa đầu tiên thì nhét vô ngay (Nhanh).',
      '- Best-Fit: Tìm khe nhỏ nhất mà vẫn vừa khít để tiết kiệm (Dễ đẻ ra vô số khe vụn siêu nhỏ vô dụng).',
      '- Slab / Buddy Allocator (Linux dùng trong Kernel): Chia sẵn RAM thành các khối lũy thừa của 2 hoặc rổ có kích thước cố định để cấp/trả tức thì.',
    ],
    jargonBuster: [
      { term: 'Internal Fragmentation', plain: 'Lãng phí chỗ thừa nằm BÊN TRONG phần bộ nhớ đã giao cho một app nhưng nó không xài hết.' },
      { term: 'External Fragmentation', plain: 'RAM còn nhiều tổng cộng nhưng bị xé thành từng mảnh lẻ rải rác không ghép liền được.' },
      { term: 'Contiguous Allocation', plain: 'Kiểu cấp phát cũ bắt buộc toàn bộ bộ nhớ của một app phải nằm thành 1 dải liên tục không ngắt quãng.' },
    ],
    takeaway: 'Cấp phát RAM liền kề bị nạn phân mảnh; đó là lý do người ta phát minh ra Paging (cắt nhỏ RAM thành từng miếng 4KB bằng nhau).',
  },
  os_07_02: {
    analogy:
      'Thay vì bắt cả cuốn sách phải in trên 1 tờ giấy khổng lồ liền nhau, **Paging** cắt nhỏ mọi app thành từng **Trang (Page)** kích thước đúng bằng nhau (thường 4 KB), và cắt thanh RAM vật lý thành các **Khung trang (Frame)** cũng đúng 4 KB! Trang 1 có thể nhét vào Khung #88, Trang 2 nhét vào Khung #5 — hoàn toàn không cần nằm cạnh nhau. OS giữ một **Bảng mục lục (Page Table)** ghi lại: "Trang 1 của App A ở Khung 88".',
    whyNeeded:
      'Paging xóa sổ hoàn toàn External Fragmentation! Nhưng nếu mỗi lần đọc 1 biến, CPU lại phải chạy ra RAM xem Page Table tốn 1 lượt đọc chậm chạp thì sao? Ta gắn thêm một trí nhớ siêu tốc ngay trong CPU tên là **TLB** để ghi nhớ các trang vừa tra gần đây.',
    deepExplanation: [
      'Virtual Address -> Physical Address: Khi code của bạn đụng tới địa chỉ `0x00001004`, phần cứng **MMU** bên trong CPU tách nó làm 2 khúc: Số Trang ảo (VPN) + Độ lệch bên trong trang (Offset).',
      'MMU hỏi nhanh **TLB (Translation Lookaside Buffer)** xem Trang ảo đó ánh xạ sang Khung RAM thật nào. 99% trường hợp là **TLB Hit** -> dịch xong trong < 1 nano-giây!',
      'Nếu TLB Miss -> MMU đi tra bảng **Page Table** (thường thiết kế nhiều tầng như 4-level paging trên x86-64 để không tốn hàng GB RAM chỉ để lưu bảng mục lục trống).',
      'Thấy mặt trái của `Context Switch` chưa? Đổi sang Process khác = Page Table khác -> TLB cũ vô dụng -> làm chậm hàng nghìn lần truy cập RAM đầu tiên của app mới!',
    ],
    jargonBuster: [
      { term: 'Page & Frame', plain: 'Page là mảnh 4KB phía bộ nhớ ảo của app; Frame là ô 4KB thật trên thanh RAM vật lý.' },
      { term: 'Page Table & MMU', plain: 'Page Table là bảng tra bản đồ ghép Page -> Frame; MMU là mạch điện tử trên CPU làm việc tra bản đồ đó.' },
      { term: 'TLB', plain: 'Bộ nhớ đệm siêu tốc nằm trong CPU chỉ làm đúng một việc: nhớ tắt kết quả tra Page Table gần nhất.' },
    ],
    takeaway: 'Paging băm RAM thành từng ô 4KB đều tăm tắp để ghép linh hoạt; MMU + TLB giúp việc dịch địa chỉ ảo sang thật diễn ra siêu tốc.',
  },
  os_07_03: {
    analogy:
      'Nếu Paging là chia đều thành các ô 4KB máy móc, thì **Segmentation** giống như chia nhà theo đúng **công năng từng khu**: Khu Bếp (Code — chỉ được đọc, cấm ghi đè), Khu Kho (Heap — được đọc/ghi), Khu Sổ Nháp (Stack — mọc ngược). Mỗi khu có điểm bắt đầu (`Base`) và chiều dài tối đa (`Limit`) để ai đi quá hàng rào là báo động ngay.',
    whyNeeded:
      'Ban đầu x86 dùng Segmentation để cô lập rõ quyền Đọc/Ghi/Thực thi cho từng khúc của chương trình (vd cấm Hacker nhét mã độc vào Stack rồi chạy!). Ngày nay OS hiện đại chủ yếu dựa vào bit quyền ngay trong từng dòng của Page Table.',
    deepExplanation: [
      'Cách hoạt động: Mỗi địa chỉ gồm `(Segment Selector, Offset)`. CPU kiểm tra xem `Offset < Limit` không? Nếu vượt quá ranh giới `Limit` -> bắn lỗi **Segmentation Fault**!',
      'Trên Linux/Windows 64-bit hiện đại: Segmentation thực chất đã được đặt ở chế độ phẳng (Flat Memory Model: Base = 0, Limit = toàn bộ 64-bit), còn phân quyền Read/Write/Execute (R/W/X - ví dụ bit NX chặn chạy code trên vùng dữ liệu) được nhúng trực tiếp vào từng ô của **Paging**!',
      'Tuy nhiên cái tên lỗi huyền thoại **"Segmentation Fault (Core Dumped)"** trong C/C++ vẫn được giữ lại tới tận hôm nay mỗi khi bạn truy cập con trỏ `NULL` hoặc tràn ra ngoài vùng nhớ hợp lệ.',
    ],
    jargonBuster: [
      { term: 'Segmentation Fault', plain: 'Lỗi "đụng nhầm rào": app truy cập vào vùng địa chỉ RAM mà OS không cho phép (như con trỏ NULL).' },
      { term: 'Base & Limit', plain: 'Địa chỉ điểm đầu và kích thước chiều dài cho phép của một phân vùng nhớ.' },
      { term: 'NX Bit (No-Execute)', plain: 'Cờ đánh dấu vùng RAM nào chỉ chứa dữ liệu thuần túy, cấm CPU chạy nó như lệnh code (chống hacker).' },
    ],
    takeaway: 'Hệ thống 64-bit hiện đại dùng Paging làm chính (kèm bit quyền Read/Write/NX); lỗi đọc nhầm vùng nhớ vẫn mang tên Segmentation Fault.',
  },
  os_07_04: {
    analogy:
      '**Virtual Memory (Bộ nhớ ảo)** giống như bạn thuê một căn hộ ảo rộng mênh mông (vài TB không gian địa chỉ), dù tủ thực (RAM thật) chỉ có 8 GB! Khi mở game 50 GB, OS áp dụng chiêu **Demand Paging (Dùng tới đâu nạp tới đó)**: mới vào menu chỉ nạp đúng 500 MB ảnh menu vào RAM, phần 49.5 GB bản đồ màn cuối vẫn nằm yên trên SSD, chừng nào nhân vật đi tới đó OS mới lôi lên RAM! Còn **Copy-on-Write (COW)** là 2 anh em sinh đôi dùng chung 1 cuốn vở mẫu; khi nào 1 người đặt bút gạch sửa trang nào thì mới photo riêng đúng trang đó ra cho anh ta sửa.',
    whyNeeded:
      'Giúp bạn mở cùng lúc nhiều phần mềm có tổng dung lượng lớn hơn thanh RAM thật đang cắm trong máy, và giúp lệnh tạo tiến trình con `fork()` chạy gần như tức thì dù tiến trình cha đang ôm 10 GB RAM.',
    deepExplanation: [
      'Demand Paging & Page Fault: Lúc đầu bảng Page Table đánh dấu mọi trang là "Chưa nằm trên RAM (`Present = 0`)". Khi code chạy tới dòng truy cập trang đó, CPU phát tín hiệu **Page Fault** vào Kernel. Kernel mở file trên SSD, tìm 1 khung RAM trống nạp trang 4KB đó lên, sửa lại Page Table `Present = 1`, rồi cho app chạy lại đúng dòng lệnh đó như chưa hề có gì xảy ra!',
      'Swap Space: Nếu RAM đã chật kín 100%, OS đẩy tạm các trang RAM lâu không ai đụng xuống một vùng trên SSD gọi là **Swap** để nhường chỗ cho app đang dùng.',
      'Copy-on-Write (COW): Khi Linux gọi `fork()` nhân bản tiến trình 8 GB, OS KHÔNG hề copy 8 GB! Nó chỉ trỏ cả cha và con vào chung các khung RAM cũ ở chế độ Read-Only. Nếu cả hai chỉ đọc -> tốn 0 byte copy! Chỉ trang 4KB nào bị một bên sửa đổi mới kích hoạt Page Fault để OS copy riêng đúng 4KB trang đó.',
    ],
    jargonBuster: [
      { term: 'Virtual Memory', plain: 'Không gian bộ nhớ ảo rộng lớn, tách biệt mà OS cấp riêng cho mỗi app, ghép từ RAM thật + SSD (Swap).' },
      { term: 'Page Fault', plain: 'Tín hiệu báo cho OS: "App cần dùng trang nhớ này nhưng nó chưa được nạp lên RAM, mau nạp giúp!".' },
      { term: 'Copy-on-Write (COW)', plain: 'Chỉ thực sự sao chép dữ liệu khi có người sửa đổi; nếu chỉ đọc thì cho dùng chung để tiết kiệm RAM và thời gian.' },
    ],
    takeaway: 'Virtual Memory biến RAM nhỏ thành không gian vô tận qua Demand Paging; Copy-on-Write là phép màu giúp `fork()` và Database snapshot chạy siêu nhanh.',
  },
  os_07_05: {
    analogy:
      'Bàn làm việc (RAM thật) chỉ để vừa đúng 4 cuốn sách, mà bạn đang học 10 cuốn. Khi cần mở cuốn thứ 5 không có trên bàn (Page Fault), bạn buộc phải cất 1 cuốn trên bàn về lại kệ sách (SSD Swap). Bạn chọn cất cuốn nào để lát đỡ phải đứng dậy lấy lại? **LRU** thông minh bảo: "Cất cuốn nào mà từ nãy tới giờ mình **lâu không đụng tới nhất**!" (Vì cuốn vừa mới xem khả năng cao lát nữa mình lại mở tiếp).',
    whyNeeded:
      'Vì tốc độ SSD chậm hơn RAM hàng trăm nghìn lần! Chọn bừa trang RAM để đuổi xuống đĩa sẽ làm máy đơ cứng (**Thrashing** — suốt ngày chỉ nạp qua nạp lại chứ chẳng chạy được việc gì).',
    deepExplanation: [
      '1. Optimal (OPT — Bélády): Đuổi trang nào ở tương lai xa nhất mới bị đụng lại. Đây là chuẩn vàng lý tưởng nhưng không chạy thật được vì OS không nhìn thấy tương lai.',
      '2. FIFO: Cuốn nào mang lên bàn sớm nhất thì đuổi ra trước. Rất ngây thơ! Dễ gặp **Bélády Anomaly** (tăng thêm RAM đôi khi lại bị lỗi trang nhiều hơn!).',
      '3. LRU (Least Recently Used): Đuổi trang lâu nhất chưa được chạm tới -> hiệu quả sát với thực tế nhất. Tuy nhiên OS không đủ thời gian ghi timestamp mỗi nano-giây lên từng trang RAM, nên Linux/Windows xấp xỉ LRU bằng **Clock / Second-Chance Algorithm**: xếp các trang thành vòng tròn kim đồng hồ; mỗi trang có 1 bit `Referenced (R = 1)` tự bật khi CPU chạm vào; kim quét thấy `R = 1` thì xóa thành `0` tha cho một mạng, tới lúc quét thấy `R = 0` mới đuổi!',
      'Thrashing: Khi bạn mở 100 tab Chrome vượt xa RAM thật, CPU 99% thời gian ngồi đợi đĩa swap qua lại — giải pháp duy nhất là đóng bớt app (hoặc Linux OOM Killer tự tay tiêu diệt 1 app nặng nhất để cứu cả máy).',
    ],
    jargonBuster: [
      { term: 'LRU (Least Recently Used)', plain: 'Thuật toán đuổi phần tử nào lâu không được đụng tới nhất khi bộ nhớ đầy.' },
      { term: 'Thrashing', plain: 'Thảm họa "giật đơ toàn máy": RAM thiếu nghiêm trọng khiến OS liên tục nạp từ đĩa rồi lại đẩy xuống đĩa không ngừng.' },
      { term: 'Clock Algorithm', plain: 'Cách làm giả LRU siêu nhẹ và nhanh bằng kim đồng hồ quét bit đánh dấu truy cập.' },
    ],
    takeaway: 'Khi đầy RAM, OS xấp xỉ LRU (qua Clock algorithm) để giữ lại trang hay dùng; quá tải nặng sẽ gây Thrashing đơ máy.',
  },

  // =========================================================================
  // MODULE 08: FILE SYSTEMS & PERSISTENCE
  // =========================================================================
  os_08_01: {
    analogy:
      'Trong UNIX/Linux có một triết lý huyền thoại: **"Everything is a file" (Mọi thứ đều là File)** — dù là file `.txt`, màn hình, bàn phím hay đường truyền mạng Internet! Và khi app mở một file lên, OS không trả nguyên file mà cấp cho app một **chiếc vé giữ đồ ghi một con số nguyên (`0, 1, 2, 3...`) gọi là File Descriptor (FD)**. Lần sau app chỉ việc đưa vé số `3` bảo OS "Đọc hộ tao 100 byte từ vé số 3"!',
    whyNeeded:
      'Nếu không có **VFS (Virtual File System)** làm lớp phiên dịch chung, app viết cho ổ C: chuẩn NTFS sẽ không đọc được USB chuẩn FAT32 hay ổ cứng Linux ext4.',
    deepExplanation: [
      '3 con số File Descriptor mặc định MỌI tiến trình sinh ra đều có sẵn:',
      '- `0` = Standard Input (`stdin` - mặc định gắn với Bàn phím)',
      '- `1` = Standard Output (`stdout` - mặc định gắn với Màn hình)',
      '- `2` = Standard Error (`stderr` - kênh in thông báo lỗi)',
      'Đường đi ẩn bên dưới 1 lần `read(fd, buf, n)`: Process giữ bảng **FD Table** riêng (số `3`) -> trỏ sang **System Open File Table** chung của Kernel (ghi vị trí con trỏ đọc hiện tại `offset`) -> trỏ vào **Inode / Vnode** (thông tin thật của file trên ổ đĩa).',
      'VFS (Virtual File System): Lớp giao diện chuẩn hóa (`open`, `read`, `write`, `close`). Bên dưới nó, bạn cắm USB FAT32, ổ cứng ext4, hay ổ mạng NFS — app ở trên gọi chung một hàm duy nhất, VFS tự lái xuống driver đúng định dạng đó.',
    ],
    jargonBuster: [
      { term: 'File Descriptor (FD)', plain: 'Số nguyên đại diện cho một file, thư mục hay kết nối mạng mà tiến trình đang mở (0=stdin, 1=stdout, 2=stderr).' },
      { term: 'VFS', plain: 'Hệ thống file ảo đóng vai trò bộ chuyển đổi đa năng để 1 app đọc được mọi định dạng ổ cứng (ext4, NTFS, FAT32).' },
      { term: 'lseek / File Offset', plain: 'Vị trí con trỏ đang đọc/ghi dở bên trong một file.' },
    ],
    takeaway: 'File Descriptor là thẻ bài đánh số từ 0 trở lên cho mọi kênh vào/ra; VFS giúp mọi ổ đĩa khác định dạng dùng chung một bộ lệnh.',
  },
  os_08_02: {
    analogy:
      'Một **Thư mục (Directory)** thực chất chỉ là **một bảng danh bạ** ghép nối **Tên file đọc cho người -> Mã số Inode thật của dữ liệu**! **Hard Link** giống như một người có 2 cái tên gọi (ví dụ tên thật ở nhà & biệt danh ở công ty cùng chỉ về 1 con người thật — xóa 1 cái tên thì người đó vẫn sống!). Còn **Soft Link / Symlink** (Shortcut) chỉ là **tờ giấy ghi mũi tên "Hãy qua mở tên file kia"** — nếu xóa file gốc đi thì tờ giấy mũi tên bị đứt gãy (Broken Link)!',
    whyNeeded:
      'File trên ổ cứng thật sự không biết tên mình là gì; tên nằm ở thư mục! Hiểu sự khác biệt giữa tên (Directory Entry) và bản thân nội dung file (Inode) là bí kíp hiểu về quản lý file Linux và Docker.',
    deepExplanation: [
      'Cấu trúc thư mục: Lưu danh sách các cặp `(FileName, InodeNumber)`. Khi bạn mở `/home/an/anh.jpg`, OS lần lượt đọc Inode gốc `/` -> tìm mã của `home` -> tìm mã của `an` -> tìm mã của `anh.jpg`.',
      'Hard Link (`ln fileA fileB`): Cả `fileA` và `fileB` trỏ trực tiếp vào **cùng 1 Inode number**! Inode có bộ đếm `link_count = 2`. Khi bạn bấm xóa `fileA`, hệ thống chỉ xóa cái tên `fileA` trong danh bạ và giảm `link_count` còn `1`. Dữ liệu trên đĩa CHỈ BỊ XÓA THẬT sự khi `link_count == 0` và không còn app nào đang mở file đó!',
      'Symbolic / Soft Link (`ln -s fileA shortcutB`): `shortcutB` có Inode riêng hẳn hoi, nhưng bên trong nó chỉ chứa chuỗi đường dẫn văn bản `"/path/to/fileA"`. Nó có thể trỏ tới thư mục hoặc trỏ xuyên sang phân vùng ổ cứng khác (điều Hard Link không làm được).',
    ],
    jargonBuster: [
      { term: 'Hard Link', plain: 'Nhiều tên file khác nhau cùng chỉ thẳng vào một hồ sơ Inode gốc duy nhất; xóa một tên không mất dữ liệu.' },
      { term: 'Soft Link (Symlink)', plain: 'Lối tắt (Shortcut) chứa đường dẫn văn bản trỏ tới tên file kia; xóa file gốc là lối tắt hỏng theo.' },
      { term: 'Link Count', plain: 'Số lượng tên file đang cùng trỏ tới một Inode; về 0 mới thực sự giải phóng dung lượng đĩa.' },
    ],
    takeaway: 'Thư mục chỉ là danh bạ Tên -> Inode; xóa file thực chất là xóa tên (unlink), file chỉ mất khi không còn tên và không còn app mở.',
  },
  os_08_03: {
    analogy:
      'Một **Inode (Index Node)** giống như **Hồ sơ lý lịch của một file** trên ổ đĩa: ghi kích thước, ngày tạo, ai sở hữu, quyền đọc/ghi và quan trọng nhất là **Bản đồ chỉ đường tới các mẩu dữ liệu (Data Blocks)** nằm rải rác trên ổ cứng. Inode giữ tất cả mọi thứ về file **TRỪ tên file**!',
    whyNeeded:
      'Một file video nặng 10 GB không nằm liền 1 cục trên ổ cứng vì sửa file khác sẽ đè vào nó. Cần cấu trúc chỉ mục thông minh để vừa đọc tuần tự nhanh, vừa nhảy thẳng tới phút thứ 50 của video ngay trong nháy mắt (Random Access).',
    deepExplanation: [
      '3 cách xếp khối dữ liệu lịch sử:',
      '1. Contiguous (Xếp liền kề): Đọc siêu nhanh nhưng khi file lớn thêm lại bị kẹt không nới rộng được (y như External Fragmentation).',
      '2. Linked List (Kiểu FAT32 ngày xưa): Mỗi cục trỏ nối đuôi cục kế tiếp. Nếu muốn nhảy tới byte thứ 1 tỷ, phải đọc lần lượt từ cục 1 -> cực kỳ chậm!',
      '3. Multi-Level Indexed Allocation (Unix Inode / Ext4 Extent): Trong mỗi Inode có ~12 con trỏ **Direct** (trỏ thẳng vào 12 cục dữ liệu đầu — file nhỏ đọc xong ngay trong 1 lần!), rồi tới con trỏ **Indirect** (trỏ vào 1 bảng chứa hàng ngàn địa chỉ khác), **Double/Triple Indirect** cho file siêu khổng lồ hàng TB!',
    ],
    jargonBuster: [
      { term: 'Inode', plain: 'Cấu trúc lưu toàn bộ metadata của file (quyền, kích thước, vị trí các khối dữ liệu), được đánh số duy nhất.' },
      { term: 'Data Block', plain: 'Đơn vị lưu trữ cơ bản (thường 4 KB) nơi nội dung thật của file được ghi lên ổ đĩa.' },
      { term: 'Direct / Indirect Pointer', plain: 'Con trỏ trực tiếp (tới ngay dữ liệu) và gián tiếp (tới 1 danh sách chứa nhiều con trỏ dữ liệu khác).' },
    ],
    takeaway: 'Inode là trái tim của hệ thống file UNIX: giữ quyền + kích thước + cây con trỏ đa tầng giúp đọc cả file siêu nhỏ lẫn file khổng lồ cực nhanh.',
  },
  os_08_04: {
    analogy:
      'Quyền file kiểu UNIX (`rwxr-xr--`) giống như quy định chìa khóa của một cuốn sổ ghi chép cho 3 nhóm người: **Chủ nhân cuốn sổ (`u`)**, **Nhóm bạn thân (`g`)**, và **Người lạ (`o`)**. Mỗi nhóm có 3 nút quyền: **Đọc (`r`=4)**, **Sửa (`w`=2)**, **Chạy như phần mềm (`x`=1)**.',
    whyNeeded:
      'Trên một máy chủ có nhiều tài khoản người dùng và nhiều app chạy ngầm (web server, database). Nếu ai cũng sửa được file mật khẩu hệ thống thì chỉ 1 lỗi nhỏ ở web server là hacker kiểm soát trọn vẹn toàn máy.',
    deepExplanation: [
      'Cách đọc nhanh con số quyền kinh điển như `chmod 755` hoặc `644`:',
      '- `r` (Read) = 4, `w` (Write) = 2, `x` (Execute) = 1. Cộng 3 số lại cho từng nhóm!',
      '- Ví dụ `644` = Chủ `(4+2=6: Đọc+Sửa)` · Nhóm `(4: Chỉ đọc)` · Người khác `(4: Chỉ đọc)` -> chuẩn cho file tài liệu / cấu hình.',
      '- Ví dụ `755` = Chủ `(4+2+1=7: Full)` · Nhóm `(4+1=5: Đọc+Chạy)` · Người khác `(5: Đọc+Chạy)` -> chuẩn cho chương trình & thư mục.',
      'Chú ý đặc biệt với Thư mục: Quyền `x` trên một thư mục KHÔNG phải là chạy, mà là quyền **được bước chân đi xuyên qua thư mục đó (`cd` vào)**! Còn quyền `w` trên thư mục cho phép xóa file bên trong thậm chí ngay cả khi file đó đặt read-only!',
      'ACL (Access Control List): Dùng khi mô hình 3 nhóm `u/g/o` không đủ (ví dụ muốn cấp quyền riêng cho đúng 2 user cụ thể khác nhóm).',
    ],
    jargonBuster: [
      { term: 'r / w / x', plain: 'Read (4 = xem), Write (2 = sửa/xóa), Execute (1 = chạy file hoặc bước vào thư mục).' },
      { term: 'chmod 755 / 644', plain: 'Lệnh đổi quyền truy cập file nhanh theo tổng 3 con số cho Chủ - Nhóm - Người ngoài.' },
      { term: 'ACL', plain: 'Danh sách phân quyền chi tiết cho phép cấp/cấm riêng từng người dùng cụ thể chứ không chỉ gói gọn 3 nhóm.' },
    ],
    takeaway: 'Nhớ 4-2-1 (`r-w-x`): 644 cho file thường, 755 cho thư mục/script, 600 (chỉ mình tôi) cho khóa bí mật SSH.',
  },
  os_08_05: {
    analogy:
      'Hãy hình dung bạn đang chuyển khoản cập nhật 2 sổ kế toán: (1) Ghi tên file mới vào thư mục, (2) Đánh dấu khối ổ đĩa đã dùng. Đúng lúc ghi xong bước (1) chưa kịp ghi bước (2) thì... cúp điện đột ngột! Sáng hôm sau sổ bị lệch nhau nghiêm trọng -> dễ hỏng sạch dữ liệu! Giải pháp **Journaling (Ghi nhật ký trước - WAL)** giống việc viết nhanh vào sổ nháp dự phòng: "Sắp ghi file A vào khối 55", làm xong hết 2 bước chính mới gạch bỏ dòng nháp. Nếu mất điện giữa chừng, bật máy lên chỉ việc nhìn sổ nháp làm nốt hoặc hủy bỏ trọn vẹn!',
    whyNeeded:
      'Ngày xưa rút điện ngang khi chưa có Journaling, máy bật lên phải chạy `fsck` quét từng gigabyte hàng tiếng đồng hồ mà file vẫn có nguy cơ nát bét.',
    deepExplanation: [
      'Tại sao lưu 1 file lại có thể gãy làm đôi? Vì hệ thống file phải sửa ít nhất 3 thứ rời rạc trên đĩa (Data block mới, Inode bitmap đánh dấu đã xài, và Inode/Directory trỏ vào). Đĩa cứng chỉ đảm bảo từng sector riêng lẻ, không đảm bảo 3 nơi tự xong cùng lúc khi cúp điện.',
      'Cơ chế **Write-Ahead Logging (WAL / Journaling)** trên NTFS, ext4, APFS:',
      '1. Journal Write: Ghi bản nháp mô tả những thay đổi sắp làm vào vùng nhật ký (`Journal`) kèm thẻ kết thúc giao dịch (`Commit`).',
      '2. Checkpoint: Thực sự ghi thay đổi vào đúng vị trí Inode & Data trên ổ đĩa.',
      '3. Free Journal: Ghi xong an toàn hết thì xóa ghi chú trong Journal.',
      'Khi gặp sự cố mất điện -> Bật máy lên OS chỉ cần đọc lại vài MB nhật ký gần nhất trong chưa tới 1 giây (`Replay`), khôi phục trạng thái nhất quán hoàn hảo!',
    ],
    jargonBuster: [
      { term: 'Crash Consistency', plain: 'Đảm bảo dữ liệu ổ cứng không bị rơi vào trạng thái lửng lơ hỏng hóc khi đột ngột mất điện/treo máy.' },
      { term: 'Journaling / WAL', plain: 'Ghi nhật ký kế hoạch trước khi thực sự sửa dữ liệu chính; nguyên lý sống còn của mọi File System và Database hiện đại.' },
      { term: 'fsck', plain: 'Công cụ kiểm tra và sửa chữa cấu trúc hệ thống file khi bị lỗi (xưa phải quét cả ổ rất lâu).' },
    ],
    takeaway: 'Mọi ổ cứng và Database hiện đại đều sống nhờ nguyên lý **WAL (Write-Ahead Logging)**: luôn ghi ra sổ nhật ký trước khi sửa sổ chính.',
  },

  // =========================================================================
  // MODULE 09: I/O SYSTEMS & DEVICE MANAGEMENT
  // =========================================================================
  os_09_01: {
    analogy:
      'Thiết bị phần cứng (như cái máy in Epson) là người máy chỉ hiểu những tín hiệu điện đặc thù của riêng hãng nó (**Device Controller**). **Device Driver** giống như **người phiên dịch viên** biết cả tiếng nói chung của OS lẫn tiếng điện của hãng Epson. Nhờ vậy Word chỉ việc hô "In trang này!" -> OS đưa cho Driver phiên dịch -> Controller điều khiển đầu phun in thật.',
    whyNeeded:
      'Thế giới có hàng triệu loại chuột, card âm thanh, SSD khác nhau. OS không thể nào viết sẵn lệnh riêng cho từng hãng trong phần nhân nếu không tách lớp Device Driver cắm rời.',
    deepExplanation: [
      'Device Controller: Con chip mạch điện tử nằm ngay trên bo mạch thiết bị (hoặc mainboard), có bộ nhớ đệm nhỏ và các thanh ghi trạng thái (`Control`, `Status`, `Data`).',
      'Device Driver: Phần mềm (thường chạy trong Kernel Space) do hãng phần cứng hoặc cộng đồng Linux viết, biết chính xác thanh ghi nào của con chip đó nhận lệnh gì.',
      '3 nhóm thiết bị chính trong Linux (`/dev`):',
      '- Character Device (Luồng ký tự tuần tự): Bàn phím, chuột, cổng serial — đọc từng dòng/byte nối tiếp, không nhảy tới nhảy lui.',
      '- Block Device (Theo khối): Ổ SSD, USB, HDD — đọc/ghi từng block (512B / 4KB), nhảy tới bất kỳ vị trí nào được.',
      '- Network Interface: Card Wi-Fi/Ethernet — làm việc theo từng gói tin (Packet) chứ không dùng read/write file thông thường.',
    ],
    jargonBuster: [
      { term: 'Device Controller', plain: 'Con chip phần cứng điều khiển trực tiếp một thiết bị ngoại vi (như chip điều khiển cổng USB/SATA).' },
      { term: 'Device Driver', plain: 'Phần mềm phiên dịch giúp Hệ điều hành nói chuyện được với một phần cứng cụ thể.' },
      { term: 'Block vs Character Device', plain: 'Block (ổ đĩa) nhảy tới đọc bất cứ đâu theo từng cục 4KB; Character (chuột/bàn phím) đọc nối tiếp như dòng chảy.' },
    ],
    takeaway: 'Controller là phần cứng trên thiết bị, Driver là phần mềm phiên dịch trong OS giúp mọi phần mềm dùng thiết bị dễ dàng.',
  },
  os_09_02: {
    analogy:
      '**Polling** giống như bạn đặt nồi nước rồi đứng nhìn chằm chằm cái ấm suốt 5 phút, cứ 1 giây thò tay sờ thử: "Sôi chưa? Sôi chưa? Sôi chưa?" — tốn sạch thời gian chẳng làm được việc khác! Còn **Interrupt (Ngắt phần cứng)** giống như dùng **ấm siêu tốc có còi hú**: bật công tắc xong bạn đi làm việc khác (CPU chạy app khác), tới khi nước sôi ấm tự bấm còi *Bíp!* báo hiệu cho bạn quay ra rót nước.',
    whyNeeded:
      'Thiết bị I/O chậm hơn CPU hàng trăm ngàn lần. CPU không thể đứng chờ ngây người hay hỏi thăm liên tục mà phải làm việc khác cho tới khi thiết bị báo xong.',
    deepExplanation: [
      'Polling (Busy-Waiting): CPU lặp đi lặp lại đọc thanh ghi Status của thiết bị cho tới khi báo xong. Ưu điểm: phản ứng cực lẹ (0 độ trễ chờ ngắt) nếu thiết bị xong trong tích tắc (như card mạng 100 Gbps!). Nhược: đốt 100% CPU vô ích nếu thiết bị chậm.',
      'Interrupt (IRQ): Thiết bị làm xong phát xung điện lên chân ngắt CPU -> CPU dừng nhẹ việc đang chạy, lưu trạng thái, tra bảng **IVT / IDT** để chạy hàm xử lý ngắt (`Interrupt Handler / ISR`), rồi quay lại làm việc cũ.',
      'NAPI (Hybrid trên Linux Network): Khi có 10 gói mạng -> dùng Interrupt cho tiết kiệm CPU; nhưng khi bão 10 triệu gói/giây tràn về -> Linux tự chuyển sang **Polling** hàng loạt để CPU không bị "điên đầu" vì tiếng còi Interrupt reo liên tục không kịp thở (**Interrupt Storm**)!',
    ],
    jargonBuster: [
      { term: 'Polling', plain: 'Hỏi thăm liên tục theo chu kỳ xem thiết bị làm xong chưa; nhanh với tải cực lớn nhưng tốn CPU nếu rảnh.' },
      { term: 'Interrupt (IRQ)', plain: 'Tín hiệu phần cứng chủ động "gõ cửa báo hiệu" cho CPU biết khi vừa có phím bấm hoặc đĩa đọc xong.' },
      { term: 'Interrupt Storm', plain: 'Hiện tượng hàng triệu tín hiệu ngắt đổ về mỗi giây khiến CPU chỉ lo nghe chuông mà tê liệt.' },
    ],
    takeaway: 'Thiết bị chậm/vừa dùng Interrupt để giải phóng CPU; thiết bị siêu tốc độ cao (card mạng 100Gbps, NVMe) kết hợp Polling để tránh bão ngắt.',
  },
  os_09_03: {
    analogy:
      'Không có **DMA**, việc copy 1 GB phim từ ổ SSD lên RAM giống như bắt **Tổng Giám Đốc (CPU)** phải tự tay bê từng viên gạch 4 byte một từ cửa kho (SSD) đặt vào tủ (RAM) — làm giám đốc kiệt sức chẳng ký được hợp đồng nào! **DMA Controller** là thuê riêng một **Anh Phụ Kho chuyên nghiệp**: Giám đốc chỉ cần ký đúng 1 tờ lệnh "Chuyển 1 GB từ chỗ X vào RAM chỗ Y, xong hú tôi!", rồi quay lại làm việc của Giám đốc. Anh Phụ Kho tự chuyển hết 1 GB vào RAM xong mới bấm chuông báo Interrupt!',
    whyNeeded:
      'Khi ổ SSD NVMe đọc tới 7 GB/giây hoặc card mạng chạy hàng chục Gbps, nếu bắt CPU tự copy từng byte sẽ đốt cạn 100% CPU chỉ để khuân vác dữ liệu.',
    deepExplanation: [
      'Chuỗi 4 bước của DMA (Direct Memory Access):',
      '1. OS đặt lệnh cho chip **DMA Controller**: Địa chỉ nguồn trên thiết bị, địa chỉ đích vật lý trên RAM, và số lượng byte cần chuyển.',
      '2. CPU hoàn toàn tự do đi chạy các ứng dụng khác!',
      '3. DMA Controller tự bắt tay với Bus hệ thống để bơm hàng loạt dữ liệu từ bộ đệm của thiết bị đổ thẳng vào RAM (Bus Mastering).',
      '4. Khi hoàn tất trọn vẹn cả khối MB lớn, DMA gửi **duy nhất 1 Interrupt** báo CPU: "Hàng đã sẵn sàng trong RAM!".',
      'Ứng dụng đỉnh cao — **Zero-Copy (`sendfile` trong Nginx/Kafka)**: Thay vì đọc file từ Kernel lên User Space rồi lại đẩy xuống Kernel gửi qua card mạng (4 lần copy!), OS kết hợp DMA đọc từ đĩa vào Page Cache rồi DMA thẳng từ Page Cache ra card mạng — giảm tải CPU thần kỳ!',
    ],
    jargonBuster: [
      { term: 'DMA (Direct Memory Access)', plain: 'Cơ chế phần cứng cho phép ổ đĩa/card mạng đổ thẳng dữ liệu vào RAM mà không cần làm phiền CPU từng byte.' },
      { term: 'Zero-Copy', plain: 'Kỹ thuật truyền file từ đĩa ra mạng không sao chép thừa qua User Space, nhờ DMA & Page Cache.' },
      { term: 'Scatter-Gather DMA', plain: 'DMA thông minh cho phép gom dữ liệu nằm rải rác nhiều nơi trong RAM gửi đi cùng một lượt.' },
    ],
    takeaway: 'DMA giải phóng CPU khỏi việc khuân vác dữ liệu thô; đây là nền móng cho tốc độ cao của SSD, Card đồ họa GPU và Web Server hiện đại.',
  },
  os_09_04: {
    analogy:
      '**Page Cache** giống như một **cái rổ để sẵn ngay trên bàn (RAM)** chứa bản sao những file bạn vừa mới mở xem gần đây. Lần thứ 2 bạn mở lại file đó, thay vì phải lếch thếch đi bộ xuống tận kho lạnh dưới hầm (ổ SSD/HDD chậm gấp vạn lần), OS thò tay lấy ngay từ cái rổ trên bàn RAM — nhanh như chớp! Còn **Buffering** là gom từng giọt nhỏ cho đầy 1 xô rồi hẵng đổ ra ổ đĩa một lượt để đỡ phải chạy đi chạy lại nhiều lần.',
    whyNeeded:
      'Nhiều người mở Task Manager thấy Linux/Windows ăn gần hết RAM dù mới mở vài app và hoảng hốt tưởng hết RAM — thực chất phần lớn đó là **Page Cache** thông minh OS đang giữ sẵn để tăng tốc máy, và OS sẵn sàng nhả ngay lập tức trong 0.1ms khi app bạn cần RAM!',
    deepExplanation: [
      'Read Cache (Page Cache): Khi bạn đọc 4KB từ file, OS lén đọc luôn các khối lân cận (Read-Ahead) và cất vào phần RAM còn dư. Lần đọc tiếp theo là **Cache Hit** ngay trên RAM ở tốc độ vài chục GB/s!',
      'Write Buffering / Write-Back (Dirty Pages): Khi app bấm lưu file `write()`, OS thường chỉ ghi vào Page Cache trong RAM, đánh dấu trang đó là **Dirty Page**, rồi báo ngay cho app "Đã lưu xong!" để app chạy tiếp cực mượt. Vài giây sau (hoặc khi gọi `fsync()`), nhân Kernel âm thầm đẩy hết xuống đĩa một lượt.',
      'Chú ý cho Backend & Database: Chính vì OS ghi ngầm vào RAM trước, nếu Database chỉ gọi `write()` mà không gọi `fsync()` ép đẩy thật xuống ổ đĩa vật lý thì khi cúp điện sẽ mất dữ liệu vừa lưu!',
      'Spooling: Xếp hàng in nhiều file lên một vùng đệm đĩa cho máy in chậm chạp lần lượt kéo từng tờ mà không bắt app Word đứng đợi.',
    ],
    jargonBuster: [
      { term: 'Page Cache', plain: 'Phần RAM dư được OS tận dụng làm bộ đệm tốc độ cao cho các file trên ổ đĩa vừa đọc/ghi.' },
      { term: 'Dirty Page', plain: 'Trang dữ liệu vừa được sửa mới trên RAM nhưng chưa kịp ghi xuống ổ cứng vật lý.' },
      { term: 'fsync()', plain: 'Lệnh bắt buộc Hệ điều hành phải đẩy sạch mọi dữ liệu đang nằm đệm trong RAM xuống ổ cứng thật ngay lập tức.' },
    ],
    takeaway: 'RAM trống không dùng là RAM lãng phí — OS luôn dùng RAM dư làm Page Cache tăng tốc đọc/ghi file lên gấp nghìn lần.',
  },
  os_09_05: {
    analogy:
      'Đầu đọc của ổ đĩa cơ HDD giống như **chiếc thang máy phục vụ khách từ tầng 1 đến tầng 100**: Nếu có người bấm tầng 95, rồi người bấm tầng 4, rồi người bấm tầng 92, nếu thang chạy nhảy cóc `95 -> 4 -> 92` (FCFS) thì mất cả buổi chỉ để chạy lên chạy xuống! Giải pháp **SCAN (Elevator Algorithm)** là chạy một mạch từ tầng 1 lên tới tầng 100 đón hết các tầng thuận chiều, rồi mới quay đầu đi xuống!',
    whyNeeded:
      'Với ổ cứng quay HDD truyền thống, thời gian lớn nhất không phải đọc dữ liệu mà là thời gian di chuyển tay cơ học (Seek Time) và chờ đĩa quay. Với SSD hiện đại thì không còn tay cơ học nữa.',
    deepExplanation: [
      'Cách hoạt động trên HDD cơ học:',
      '- FCFS: Chạy theo thứ tự gọi -> đầu từ nhảy loạn xạ khắp mặt đĩa.',
      '- SSTF (Shortest Seek Time First): Phục vụ vị trí gần đầu từ nhất -> nhanh nhưng các rãnh ngoài bìa dễ bị "bỏ đói" mãi nếu vùng giữa bận rộn.',
      '- SCAN / C-SCAN (Thang máy): Đi quét một chiều từ đầu đến cuối mặt đĩa, gom sạch yêu cầu nằm trên đường đi rồi mới quay đầu (hoặc nhảy thẳng về 0 quét lại một chiều ở C-SCAN cho đều thời gian chờ).',
      'Kỷ nguyên SSD NVMe ngày nay: Vì chip nhớ Flash truy cập ngẫu nhiên vị trí nào cũng nhanh y như nhau (không có đầu từ di chuyển!), nên trên Linux hiện đại người ta tắt thuật toán thang máy nặng nề và dùng bộ lập lịch siêu nhẹ (`none` hoặc `kyber` / `bfq`) giữ nhiều hàng đợi song song.',
    ],
    jargonBuster: [
      { term: 'Seek Time', plain: 'Thời gian chờ cánh tay cơ học trên ổ HDD di chuyển đến đúng rãnh đĩa cần đọc.' },
      { term: 'Elevator (SCAN)', plain: 'Thuật toán điều phối đầu đĩa kiểu thang máy: đi một chiều gom sạch yêu cầu trên đường rồi mới quay đầu.' },
      { term: 'IOPS', plain: 'Số lượng thao tác Đọc/Ghi độc lập thực hiện được trong mỗi giây.' },
    ],
    takeaway: 'Ổ HDD quay cần thuật toán thang máy (SCAN) gom đường đi đầu từ; SSD Flash không có bộ phận chuyển động nên xử lý hàng nghìn luồng song song tức thì.',
  },

  // =========================================================================
  // MODULE 10: STORAGE ARCHITECTURE (HDD, SSD, RAID)
  // =========================================================================
  os_10_01: {
    analogy:
      'Ổ cứng cơ **HDD (Hard Disk Drive)** bên trong giống hệt một chiếc **máy hát đĩa than** nhiều tầng: gồm nhiều đĩa kim loại quay tít (5400–7200 vòng/phút) và một cánh tay cơ học bay sát mặt đĩa ở khoảng cách mỏng hơn sợi tóc để đọc/ghi từ tính.',
    whyNeeded:
      'Hiểu cấu tạo vật lý giúp bạn lý giải ngay tại sao đọc liên tiếp một file phim lớn trên HDD lại nhanh (150 MB/s), nhưng copy 10.000 file chữ cái nhỏ xíu nằm rải rác trên HDD lại lê lết chỉ 1 MB/s (Random I/O)!',
    deepExplanation: [
      'Cấu tạo hình học bên trong 1 ổ HDD:',
      '- Platter (Đĩa từ): Các đĩa tròn phủ vật liệu từ tính, có 2 mặt trên/dưới.',
      '- Track (Rãnh đồng tâm): Hàng trăm nghìn vòng tròn đồng tâm trên mặt đĩa. Tập hợp các Track cùng bán kính trên nhiều tầng đĩa gọi là **Cylinder**.',
      '- Sector: Đơn vị vật lý nhỏ nhất trên một Track (thường 512 bytes hoặc 4096 bytes).',
      'Công thức tính độ trễ 1 lần đọc HDD = `Seek Time` (~4–9ms chờ tay cơ bay tới đúng Track) + `Rotational Latency` (~4ms chờ đĩa quay đúng Sector đi ngang qua đầu đọc) + `Transfer Time` (cực nhanh). Tổng ~10ms một lần! Đó là lý do HDD tối đa chỉ đạt ~100 IOPS khi đọc ngẫu nhiên.',
    ],
    jargonBuster: [
      { term: 'Track & Sector', plain: 'Track là đường ray tròn trên mặt đĩa cứng; Sector là từng ô nhỏ chứa dữ liệu nằm dọc trên đường ray đó.' },
      { term: 'Rotational Latency', plain: 'Thời gian chờ mặt đĩa quay đúng nửa vòng/một vòng để vị trí dữ liệu lướt qua ngay dưới đầu đọc.' },
      { term: 'Sequential vs Random I/O', plain: 'Đọc nối tiếp 1 mạch thẳng hàng (rất nhanh) đối lập với đọc nhảy cóc khắp nơi (cực chậm trên HDD).' },
    ],
    takeaway: 'HDD cực rẻ để lưu trữ file lớn nối tiếp, nhưng yếu ở đọc/ghi ngẫu nhiên nhiều file nhỏ vì tốn thời gian xoay đĩa và dịch tay cơ.',
  },
  os_10_02: {
    analogy:
      'Ổ **SSD (Solid State Drive)** dùng chip điện tử giống bộ nhớ thẻ USB khổng lồ — không có bất cứ bộ phận cơ học nào xoay cả! Nhưng chip NAND Flash lại có một tật kỳ lạ: **Ghi theo từng Trang (4–16KB), nhưng muốn Xóa để ghi đè lên chỗ cũ thì lại phải Xóa nguyên cả Khối khổng lồ (Block hàng MB)**! Vậy nên bên trong mỗi ổ SSD luôn có một bộ vi xử lý ngầm tên là **FTL** âm thầm làm việc dọn rác và đảo vị trí sao cho chip Flash không bị mòn cục bộ.',
    whyNeeded:
      'Biết cơ chế vật lý của SSD sẽ hiểu ngay vì sao người ta cấm chống phân mảnh (Defrag) trên SSD (vì làm mòn chip vô ích) và tại sao SSD đầy 95% bỗng dưng chạy chậm rì!',
    deepExplanation: [
      'Quy tắc khắc nghiệt của chip NAND Flash: Bạn không thể ghi đè trực tiếp 1 bit từ `0` thành `1` tại chỗ cũ. Phải xóa sạch toàn bộ Block lớn (hàng trăm Page) về `1` hết rồi mới ghi lại được -> sinh ra hiện tượng **Write Amplification (Khuếch đại ghi)**.',
      'FTL (Flash Translation Layer): Bộ não chạy ngay trên chip điều khiển bên trong SSD. Khi OS bảo "Ghi đè vào vị trí logic số 5", FTL ngầm ghi dữ liệu mới vào một Page trống khác tinh tươm, cập nhật bản đồ ánh xạ, rồi đánh dấu Page số 5 cũ là "Rác (Stale)".',
      'TRIM & Garbage Collection: Lúc rảnh, SSD gom các Page còn sống trong một Block cũ sang chỗ khác rồi xóa sạch Block cũ dùng lại. Lệnh `TRIM` giúp OS báo cho SSD biết ngay những file nào người dùng vừa xóa để SSD đỡ mất công giữ lại rác! Và **Wear Leveling** giúp dàn đều số lần ghi lên mọi ô nhớ để 1 vùng hay sửa không bị chết sớm (vì Flash có giới hạn số lần xóa/ghi P/E cycles).',
    ],
    jargonBuster: [
      { term: 'NAND Flash', plain: 'Loại chip nhớ điện tử không mất dữ liệu khi tắt nguồn, làm nên ổ SSD và thẻ nhớ.' },
      { term: 'FTL (Flash Translation Layer)', plain: 'Phần mềm bên trong con chip của ổ SSD đứng ra đánh tráo vị trí thật để ghi nhanh và dàn đều độ mòn.' },
      { term: 'TRIM & Wear Leveling', plain: 'TRIM báo file đã xóa cho SSD dọn rác; Wear Leveling chia đều số lần ghi để kéo dài tuổi thọ ổ.' },
    ],
    takeaway: 'SSD nhanh gấp hàng trăm lần HDD nhờ chạy điện tử song song; FTL tự động lo dọn rác (TRIM) và chia đều hao mòn (Wear Leveling).',
  },
  os_10_03: {
    analogy:
      'Một ổ SSD 1TB thô mới mua về giống như một **mảnh đất trống chưa chia lô**. **Partition Table (MBR / GPT)** giống bản vẽ quy hoạch chia mảnh đất đó thành `Ổ C:` và `Ổ D:` (phân vùng cứng, sau muốn nới rộng `Ổ C:` phải dời tường cực khổ). Còn **LVM (Logical Volume Manager)** giống như dùng **vách ngăn di động thông minh**: bạn gộp cả mảnh đất 1TB + mới mua thêm miếng 2TB vào chung một **Hồ chứa (Volume Group)** khổng lồ 3TB, rồi muốn nới hay co phòng nào chỉ cần kéo vách ngăn trong vài giây mà không phải format mất dữ liệu!',
    whyNeeded:
      'Trên Server thật, bạn cần biết cách chia ổ cài OS, tách riêng vùng chứa dữ liệu người dùng và mở rộng dung lượng mượt mà khi server hết ổ đĩa mà không phải tắt máy.',
    deepExplanation: [
      'MBR vs GPT (2 chuẩn bảng phân vùng):',
      '- MBR (Master Boot Record - cũ): Chỉ hỗ trợ tối đa ổ 2 TB và tối đa 4 phân vùng chính.',
      '- GPT (GUID Partition Table - chuẩn hiện đại cùng UEFI): Hỗ trợ ổ đĩa tới hàng tỷ TB, tới 128 phân vùng mặc định và có bản sao lưu bảng phân vùng ở cuối đĩa để chống hỏng!',
      'Kiến trúc 3 tầng của LVM trên Linux:',
      '1. PV (Physical Volume): Các ổ đĩa hoặc phân vùng vật lý rời (vd: `/dev/sda2`, `/dev/sdb`).',
      '2. VG (Volume Group): Gom nhiều PV lại thành 1 kho dung lượng tổng hợp lớn.',
      '3. LV (Logical Volume): Cắt từ kho VG thành các "ổ đĩa ảo" để format (`ext4`/`xfs`) và mount lên xài. Khi hết chỗ, chỉ việc gắn thêm 1 ổ SSD mới vào VG rồi nới LV ngay khi hệ thống đang chạy!',
    ],
    jargonBuster: [
      { term: 'Partition (GPT / MBR)', plain: 'Việc cắt một ổ cứng vật lý thành các khu vực tách biệt nhau (GPT là chuẩn mới vượt mốc 2TB).' },
      { term: 'Mount Point', plain: 'Trên Linux không có C:/D:; mọi ổ đĩa đều được "gắn kết" vào một thư mục trên cây (vd /mnt/data hoặc /home).' },
      { term: 'LVM', plain: 'Trình quản lý ổ đĩa logic cho phép gộp nhiều ổ cứng rời thành một bể chung và co giãn dung lượng linh hoạt.' },
    ],
    takeaway: 'Luôn chọn chuẩn phân vùng GPT cho ổ hiện đại; trên Server dùng LVM để dễ dàng ghép thêm ổ cứng mở rộng dung lượng không cần cài lại máy.',
  },
  os_10_04: {
    analogy:
      '**RAID** là nghệ thuật ghép nhiều ổ đĩa rời rạc thành một đội hình phối hợp: **RAID 0** là 2 người cùng đọc/viết 1 trang sách (nhanh gấp đôi, nhưng 1 người nghỉ việc là mất cả 2 nửa cuốn sách!). **RAID 1** là 2 người chép y hệt giống nhau (hỏng 1 ổ vẫn còn nguyên bản sao!). **RAID 5/6** là mẹo toán học dự phòng thông minh để tiết kiệm tiền ổ mà vẫn cứu được dữ liệu khi chết ổ; **RAID 10** kết hợp cả nhanh của 0 lẫn an toàn của 1!',
    whyNeeded:
      'Một ổ cứng dù xịn tới đâu cũng có ngày chết bất đắc kỳ tử! Hệ thống Server và NAS dùng RAID để chết 1–2 ổ cứng giữa đêm thì dịch vụ vẫn chạy tiếp bình thường không mất một byte dữ liệu.',
    deepExplanation: [
      'Bảng tóm tắt 4 cấp RAID phổ biến nhất ngoài đời:',
      '- **RAID 0 (Striping)**: Chia đều từng mảnh dữ liệu rải sang 2+ ổ. Tốc độ x2, tận dụng 100% dung lượng, NHƯNG chết 1 ổ = mất sạch 100% dữ liệu! (Chỉ dùng lưu cache/tạm dựng phim).',
      '- **RAID 1 (Mirroring)**: Sao chép song sinh y hệt sang 2 ổ. An toàn cao (chết 1 ổ vẫn chạy), đọc nhanh, nhưng tốn 50% chi phí (mua 2 ổ 4TB chỉ dùng được 4TB).',
      '- **RAID 5 (Parity) / RAID 6**: Rải dữ liệu kèm thông tin tính bù toán học (`Parity`) trên ít nhất 3 ổ (RAID 5 chịu chết 1 ổ; RAID 6 chịu chết cùng lúc 2 ổ). Tiết kiệm tiền ổ hơn RAID 1 nhưng ghi chậm hơn một chút và rebuild lại khi thay ổ dung lượng lớn rất lâu.',
      '- **RAID 10 (1+0)**: Cặp đôi song sinh (Mirror) rồi ghép chạy song song (Stripe), cần tối thiểu 4 ổ. Vừa nhanh vừa cực kỳ an toàn — tiêu chuẩn vàng cho Database!',
      'Cảnh giác sống còn: **RAID KHÔNG PHẢI LÀ BACKUP!** Nếu bạn lỡ tay chạy lệnh xóa nhầm bảng Database hoặc dính mã độc mã hóa, RAID sẽ nhanh chóng... đồng bộ thao tác xóa đó sang cả ổ dự phòng trong 1 giây!',
    ],
    jargonBuster: [
      { term: 'Striping (RAID 0)', plain: 'Chia nhỏ dữ liệu rải sang nhiều ổ cùng lúc để tăng tốc độ truyền tải.' },
      { term: 'Mirroring (RAID 1)', plain: 'Nhân bản y hệt dữ liệu sang ổ song song để làm bản dự phòng nóng.' },
      { term: 'Parity (RAID 5/6)', plain: 'Mã toán học bù khuyết (kiểu XOR) cho phép suy ngược lại trọn vẹn dữ liệu của 1 ổ bị hỏng từ các ổ còn lại.' },
    ],
    takeaway: 'Database chọn RAID 10 hoặc RAID 1; lưu file dung lượng lớn chọn RAID 6; và luôn nhớ RAID chỉ chống chết phần cứng chứ không thay thế được Backup!',
  },
  os_10_05: {
    analogy:
      'Hệ thống file truyền thống (`ext4`, `NTFS`) khi sửa file có nguy cơ hỏng dữ liệu nếu cúp điện và không tự kiểm tra lỗi âm thầm (Bit Rot). Các hệ thống file thế hệ mới như **ZFS / Btrfs** dùng triết lý **Copy-on-Write (COW)** toàn diện: Không bao giờ viết đè lên chỗ dữ liệu cũ đang sống — luôn ghi sang chỗ mới an toàn, gán mã kiểm tra chống sai bit (**Checksum**), xong xuôi hết mới tráo con trỏ gốc trong tích tắc! Nhờ vậy vừa miễn nhiễm hỏng file khi cúp điện, vừa chụp được ảnh trạng thái (**Snapshot**) toàn ổ đĩa chỉ trong 0.1 giây!',
    whyNeeded:
      'Khi dữ liệu lưu trữ tăng lên hàng chục Terabyte, lỗi vật lý lật bit âm thầm trên ổ đĩa có thể âm thầm làm hỏng ảnh/tài liệu mà OS truyền thống không hề hay biết.',
    deepExplanation: [
      '3 siêu năng lực của Modern Copy-on-Write File System (ZFS, Btrfs, APFS):',
      '1. Atomic COW & Instant Snapshots: Vì không xóa dữ liệu cũ khi sửa file, việc "chụp ảnh toàn bộ ổ đĩa lúc 12h trưa" (`Snapshot`) thực chất chỉ là giữ lại con trỏ gốc lúc 12h không cho xóa! Tốn 0 giây và gần như 0 byte dung lượng ban đầu — lỡ cài lỗi chỉ cần rollback về 12h trong chớp mắt!',
      '2. End-to-End Checksums & Self-Healing: Mọi khối dữ liệu ghi xuống đều được tính mã băm (hash) cất vào nút cha. Khi đọc lên, ZFS tự kiểm tra hash -> nếu phát hiện 1 bit bị hỏng tự nhiên trên ổ A, ZFS tự động lấy bản sạch từ ổ B (nếu dùng Mirror/RAID-Z) sửa lành lại ngay tại chỗ!',
      '3. Software Pool + Compression: Gộp quản lý mảng đĩa (giống LVM + RAID) và File System vào chung 1 lớp, hỗ trợ nén dữ liệu trong suốt (Transparent Compression `lz4`/`zstd`) vừa đỡ tốn ổ đĩa vừa đọc nhanh hơn!',
    ],
    jargonBuster: [
      { term: 'Snapshot', plain: 'Bản chụp trạng thái tức thì của cả ổ đĩa/thư mục tại một mốc thời gian, không tốn thời gian copy.' },
      { term: 'Bit Rot (Silent Corruption)', plain: 'Hiện tượng một vài bit dữ liệu trên ổ cứng lâu ngày tự bị lật sai mà ổ cứng không báo lỗi.' },
      { term: 'Self-Healing', plain: 'Khả năng tự phát hiện khối dữ liệu hỏng qua mã kiểm tra và tự lấy bản sao sạch chép đè vá lại lỗi.' },
    ],
    takeaway: 'ZFS / Btrfs / APFS kết hợp Copy-on-Write + Checksum giúp tạo Snapshot tức thì và tự phát hiện sửa lỗi dữ liệu âm thầm.',
  },

  // =========================================================================
  // MODULE 11: OS SECURITY & ISOLATION
  // =========================================================================
  os_11_01: {
    analogy:
      '**Authentication (Xác thực)** là bước bạn xuất trình **Căn cước công dân / Mật khẩu / FaceID** cho bảo vệ tòa nhà xem để chứng minh "Tôi đúng là Anh An". Còn **Authorization (Phân quyền)** là bảo vệ kiểm tra xem "Anh An có được phép lên tầng Giám đốc (tầng 10) hay chỉ được vào tầng làm việc của mình (tầng 3)". Và nguyên tắc **Least Privilege (Quyền tối thiểu)** bảo: Nhân viên thực tập chỉ cần chìa khóa phòng họp tầng 3 — tuyệt đối không phát chùm chìa khóa mở cả két sắt công ty cho anh ta!',
    whyNeeded:
      'Nhiều hệ thống sập chỉ vì chạy app web hoặc script với quyền tối cao (`root` / `Administrator`): khi app web có 1 lỗ hổng nhỏ, kẻ tấn công nghiễm nhiên chiếm trọn quyền Vua của cả máy chủ.',
    deepExplanation: [
      'Phân biệt dứt điểm 3 chữ dễ nhầm trong Security:',
      '- Authentication (`AuthN` - Ai đấy?): Xác minh danh tính (Mật khẩu, SSH Key, Token, Sinh trắc học).',
      '- Authorization (`AuthZ` - Được làm gì?): Kiểm tra quyền đối với từng tài nguyên sau khi đã biết bạn là ai (User thường không chạy được `sudo`).',
      '- Accounting / Auditing: Ghi nhật ký lại bạn đã làm gì lúc mấy giờ.',
      'Principle of Least Privilege (Đặc quyền tối thiểu): Một chương trình/người dùng chỉ được cấp ĐÚNG những quyền tối thiểu cần thiết để hoàn thành nhiệm vụ của nó, không dư 1 quyền nào. Ví dụ Nginx chỉ cần quyền đọc thư mục web và mở port 80/443 — không cần quyền xóa ổ đĩa hay đọc thư mục `/home` của người khác.',
    ],
    jargonBuster: [
      { term: 'Authentication (AuthN)', plain: 'Xác thực danh tính: chứng minh bạn đúng là người bạn tự nhận.' },
      { term: 'Authorization (AuthZ)', plain: 'Phân quyền: kiểm tra bạn được phép đọc/sửa/xóa tài nguyên nào.' },
      { term: 'Least Privilege', plain: 'Chỉ cấp đủ đúng quyền cần thiết để làm việc, giảm thiểu thiệt hại tối đa nếu phần mềm đó bị hack.' },
    ],
    takeaway: 'Nhớ rõ: AuthN = Bạn là ai; AuthZ = Bạn được làm gì; và không bao giờ chạy ứng dụng thường dưới quyền Root/Admin.',
  },
  os_11_02: {
    analogy:
      'Để quản lý xem ai vào được phòng nào có 2 cách ghi sổ ngược nhau: **ACL (Access Control List)** giống **Tờ danh sách dán ngay trên cửa mỗi phòng** ghi tên những ai được vào phòng đó ("Phòng Họp: An được xem, Bình được sửa"). Còn **Capabilities** giống **Chùm vé cầm trong tay từng người** ("Anh An giữ vé vào phòng Họp và vé mở máy in") — đi đâu giơ vé đó ra là qua cổng, khỏi cần kiểm tra tên tuổi lằng nhằng!',
    whyNeeded:
      'Hiểu hai mô hình kiểm soát truy cập này giúp bạn làm chủ từ quyền file Linux (`ACL`, `Linux Capabilities`) đến bảo mật API Cloud hiện đại (OAuth Tokens / JWT thực chất chính là mô hình Capabilities!).',
    deepExplanation: [
      'Access Control Matrix: Bảng hai chiều khổng lồ với Hàng = Chủ thể (Users/Processes), Cột = Tài nguyên (Files/Sockets), Ô giao nhau = Quyền (`r/w`). Thực tế bảng này rất thưa thớt nên người ta cắt theo Cột thành **ACL** hoặc cắt theo Hàng thành **Capability List**.',
      'ACL (Theo tài nguyên): Rất dễ xem "Hiện tại ai có quyền đụng vào file mật khẩu này?" và dễ gạch tên thu hồi quyền của 1 người. Nhược điểm: khó trả lời nhanh "Một nhân viên X đang nắm quyền gì trên khắp cả công ty?".',
      'Capabilities (Theo chủ thể - "Tấm vé không thể làm giả"): Một Process được trao thẳng những thẻ quyền nhỏ gọi là Capabilities (vd Linux xé nhỏ quyền tối thượng `root` thành 40+ mẩu nhỏ như `CAP_NET_BIND_SERVICE`: chỉ cho phép app mở cổng mạng 80 chứ KHÔNG trao full quyền `root`!).',
    ],
    jargonBuster: [
      { term: 'ACL (Access Control List)', plain: 'Danh sách gắn trên từng tài nguyên liệt kê rõ người nào có quyền gì với nó.' },
      { term: 'Capability', plain: 'Thẻ quyền nhỏ cấp cho tiến trình/người dùng: cầm thẻ nào thì làm được đúng việc đó mà không cần thành Root.' },
      { term: 'Confused Deputy Problem', plain: 'Lỗ hổng phần mềm có quyền cao bị người ngoài lừa làm bậy hộ; Capabilities giải quyết vấn đề này tốt hơn ACL.' },
    ],
    takeaway: 'Thay vì cấp full quyền `root` cho app web chỉ để mở cổng 80/443, Linux dùng **Capabilities** (`CAP_NET_BIND_SERVICE`) cấp đúng 1 thẻ quyền nhỏ an toàn.',
  },
  os_11_03: {
    analogy:
      '**Sandboxing (Hộp cát)** giống như cho một vị khách lạ (như 1 tab trang web nghi chứa virus, hoặc 1 container Docker) vào chơi bên trong một **chiếc lồng kính vô trùng riêng**: bên trong đó anh ta thấy cả bàn ghế (cứ tưởng mình ở nhà bình thường), nhưng mọi dụng cụ nguy hiểm như búa rìu (System Calls xóa đĩa, nghe lén bàn phím, tắt máy) đều bị dán băng dính khóa cổng (**seccomp-bpf**)!',
    whyNeeded:
      'Chrome chạy code JavaScript từ hàng nghìn website lạ mỗi ngày, Docker chạy code từ Internet. Sandboxing đảm bảo dù hacker khai thác được lỗi trong code đó, nó cũng bị nhốt cứng trong hộp cát không thoát ra máy chủ thật được.',
    deepExplanation: [
      'Hai lớp áo giáp của Sandbox hiện đại trên Linux/macOS/Android:',
      '1. **seccomp-bpf (System Call Filtering)**: Mặc định Linux có hơn 350 System Call mạnh mẽ, nhưng một tiến trình xử lý ảnh/JSON chỉ cần đúng ~15 syscall cơ bản (`read`, `write`, `brk`, `exit`). Kernel cho phép gắn bộ lọc **seccomp** chặn toàn bộ 335 syscall còn lại -> nếu hacker chèn mã độc gọi `execve("/bin/sh")` mở terminal phá máy -> Kernel giết tiến trình ngay lập tức!',
      '2. **Mandatory Access Control (SELinux / AppArmor) & Chroot/Namespaces**: Giới hạn tuyệt đối những thư mục nào tiến trình được nhìn thấy và chạm vào bất chấp quyền User.',
      'Ứng dụng thực tế: Mọi trình duyệt (Chrome Site Isolation), Container (Docker/containerd mặc định gắn profile seccomp chặn ~44 syscall nguy hiểm), và sandbox App Store của iOS/macOS.',
    ],
    jargonBuster: [
      { term: 'Sandbox', plain: 'Môi trường cách ly chặt chẽ giam giữ ứng dụng để nếu có bị hack hay chạy mã độc cũng không ảnh hưởng ra máy thật.' },
      { term: 'seccomp-bpf', plain: 'Lưới lọc System Call trong nhân Linux: chỉ cho phép tiến trình gọi đúng danh sách lệnh hệ thống đã duyệt trước.' },
      { term: 'MAC (AppArmor / SELinux)', plain: 'Chính sách bảo mật bắt buộc của hệ thống áp đặt quy tắc nghiêm ngặt cho từng chương trình cụ thể.' },
    ],
    takeaway: 'Càng ít System Call được mở thì bề mặt tấn công càng nhỏ; Sandboxing (seccomp + Namespaces) là khiên chắn cuối cùng khi code ứng dụng bị lỗi.',
  },
  os_11_04: {
    analogy:
      'Nếu phần mềm C/C++ có lỗi tràn bộ nhớ (như viết lố ra ngoài trang giấy), ngày xưa hacker rất dễ lợi dụng vì địa chỉ mọi hàm quan trọng của OS luôn nằm im một chỗ cố định (giống nhà kho lúc nào cũng nằm ở đúng "Số nhà 100"). Để chống lại, OS dựng 3 hàng rào: **NX** (vùng ghi chép cấm chạy như mệnh lệnh), **ASLR** (mỗi lần mở app là xáo trộn ngẫu nhiên số nhà để hacker đoán mò là trật!), và **Stack Canary** (đặt một chú chim hoàng yến canh cửa ngay ranh giới; nếu dữ liệu viết tràn đụng chết chú chim là tắt app ngay trước khi nhảy tới địa chỉ điều khiển!).',
    whyNeeded:
      'Hàng thập kỷ qua, lỗi bộ nhớ (Buffer Overflow) là lỗ hổng bảo mật chết người phổ biến nhất. Các cơ chế bảo vệ ở tầng OS + Trình biên dịch giúp nâng độ khó khai thác lên gấp bội.',
    deepExplanation: [
      '1. **Memory Isolation**: Mỗi Process có bảng phân trang Page Table riêng -> không thể nhìn thấy địa chỉ vật lý của Process khác.',
      '2. **W^X / NX (Write XOR Execute)**: Quy tắc vàng: Một trang RAM chỉ được quyền **Hoặc Ghi (Write)** (như Heap/Stack), **Hoặc Chạy Code (Execute)** (như Text Segment), tuyệt đối không cho phép vừa Ghi vừa Chạy cùng lúc! Ngăn hacker bơm mã shellcode vào ô nhập liệu rồi ép CPU chạy ô đó.',
      '3. **ASLR (Address Space Layout Randomization)**: Mỗi lần chạy app, Kernel đảo ngẫu nhiên vị trí đặt Stack, Heap và các thư viện (`libc`) trong không gian nhớ ảo. Muốn đoán trúng địa chỉ để nhảy tới gần như bất khả thi nếu không có lỗ hổng làm rò rỉ địa chỉ trước.',
      '4. **Meltdown / Spectre & KPTI**: Các lỗ hổng phần cứng đọc lén bộ nhớ qua đoán nhánh CPU đã buộc OS tách hẳn bảng trang của Kernel (`KPTI` - Kernel Page-Table Isolation) ra khỏi User Space.',
    ],
    jargonBuster: [
      { term: 'NX / DEP (W^X)', plain: 'Cấm CPU thực thi dữ liệu như lệnh chương trình: vùng nào cho phép viết chữ vào thì tuyệt đối không cho chạy như code.' },
      { term: 'ASLR', plain: 'Xáo trộn ngẫu nhiên vị trí các vùng nhớ mỗi lần khởi động app để kẻ tấn công không đoán trước được địa chỉ.' },
      { term: 'Stack Canary', plain: 'Giá trị bí mật đặt ngay cạnh địa chỉ trả về trên Stack để phát hiện ngay nếu có lỗi ghi tràn bộ nhớ.' },
    ],
    takeaway: 'Bảo mật bộ nhớ hiện đại kết hợp: Cách ly Page Table + W^X (NX) + Xáo trộn địa chỉ (ASLR) + Stack Canary.',
  },
  os_11_05: {
    analogy:
      'Phần cứng CPU giống một pháo đài nhiều lớp tường thành: Bên ngoài là tường dân thường (**Ring 3 - User**), vào trong là lâu đài của Vua (**Ring 0 - OS Kernel**), sâu hơn nữa thậm chí có hẳn một **Hầm bí mật chống trộm (**Ring -1 Hypervisor** & **Secure Enclave / TPM**)** — nơi cất chìa khóa FaceID / Vân tay / Khóa mã hóa ổ cứng mà ngay cả khi Vua (OS Kernel) bị hacker chiếm đoạt thì vẫn không thò tay vào lấy trộm khóa gốc ra được!',
    whyNeeded:
      'Ngày nay máy chủ Cloud chạy nhiều khách hàng trên cùng CPU, và điện thoại chứa ví tiền/FaceID. Cần ranh giới phần cứng cao hơn cả OS để bảo vệ khóa bí mật và phần mềm khởi động.',
    deepExplanation: [
      'Phân cấp vòng quyền lực từ ngoài vào sâu bên trong chip:',
      '- Ring 3 (User Mode): Chrome, Word, app thường.',
      '- Ring 0 (Kernel Mode): Windows/Linux Kernel.',
      '- Hypervisor Mode (Intel VT-x Root / ARM EL2): Nơi chạy Hypervisor quản lý nhiều Máy ảo (VM), kiểm soát ngược lại được cả Ring 0 của từng máy ảo!',
      '- Hardware Root of Trust (**TPM 2.0**, **Apple Secure Enclave**, **ARM TrustZone**): Bộ xử lý bảo mật độc lập vật lý trên chip. Khóa vân tay/FaceID và khóa giải mã đĩa (BitLocker/FileVault) không bao giờ rời khỏi con chip này. Đi kèm là **Secure Boot**: chuỗi kiểm tra chữ ký số từ UEFI -> Bootloader -> Kernel để đảm bảo không ai lén cài phần mềm gián điệp (Rootkit) lúc khởi động.',
    ],
    jargonBuster: [
      { term: 'Secure Boot', plain: 'Cơ chế kiểm tra chữ ký mật mã ngay lúc bật nguồn, chỉ cho phép chạy hệ điều hành chính hãng chưa bị chỉnh sửa.' },
      { term: 'TPM / Secure Enclave', plain: 'Con chip bảo mật riêng biệt giống chiếc két sắt vật lý để giữ khóa sinh trắc học và khóa mã hóa, tách hẳn khỏi RAM thường.' },
      { term: 'Privilege Escalation', plain: 'Tấn công leo thang đặc quyền: kẻ xấu từ quyền User thường tìm lỗ hổng nhảy lên chiếm quyền Root/Kernel.' },
    ],
    takeaway: 'Phần cứng bảo vệ phân tầng từ Secure Boot -> Enclave/TPM giữ khóa gốc -> Hypervisor -> Kernel Ring 0 -> App Ring 3.',
  },

  // =========================================================================
  // MODULE 12: VIRTUALIZATION, CONTAINERS & DISTRIBUTED OS
  // =========================================================================
  os_12_01: {
    analogy:
      'Ảo hóa **Virtual Machine (VM)** giống như mua một **căn nhà biệt thự to**, rồi chia thành **3 căn nhà khép kín độc lập hoàn toàn** — mỗi căn cài một hệ điều hành riêng (1 cái chạy Windows, 2 cái chạy Linux), mỗi căn tự tưởng nó có cả CPU, thanh RAM và ổ cứng vật lý của riêng mình! Nhưng mọi lệnh "đặc quyền" của Hệ điều hành khách (`Guest OS`) bên trong đều bị "Quản gia tối cao" (**Hypervisor**) lén chặn lại kiểm tra và giả lập hộ (**Trap-and-Emulate**).',
    whyNeeded:
      'Trước khi có VM, mỗi công ty mua một server chỉ dám chạy 1 app vì sợ xung đột OS, khiến CPU chạy có 10% công suất — cực kỳ tốn điện và tiền! Cloud (AWS EC2, Google Cloud) ra đời nhờ VM cho thuê hàng triệu máy ảo trên cùng phần cứng.',
    deepExplanation: [
      'Vấn đề khó ban đầu: Guest OS cứ nghĩ mình là Vua (Ring 0), nhưng thực tế chỉ có Hypervisor mới nắm phần cứng thật! Nếu để Guest OS chạy thẳng lệnh tắt máy thật là sập luôn các máy ảo hàng xóm!',
      'Giải pháp phần cứng **Intel VT-x / AMD-V**: Con chip CPU hỗ trợ thêm chế độ VMX Root (cho Hypervisor) và VMX Non-Root (cho VM). Hệ điều hành trong VM vẫn chạy mượt mà các lệnh thường trực tiếp trên CPU vật lý, nhưng hễ đụng tới lệnh nhạy cảm hoặc I/O -> CPU tự động **VM Exit** thoát ra báo cho Hypervisor xử lý hộ rồi lại **VM Entry** trả về cho VM.',
      'Memory Virtualization (EPT / Nested Paging): Hai tầng dịch địa chỉ: Địa chỉ ảo của App -> Địa chỉ vật lý giả của Guest OS -> Địa chỉ RAM thật của máy chủ. Phần cứng EPT trên CPU tăng tốc cả 2 tầng này để chạy gần nhanh như máy thật!',
    ],
    jargonBuster: [
      { term: 'Virtual Machine (VM)', plain: 'Một máy tính ảo hoàn chỉnh gồm cả Hệ điều hành riêng, giả lập chạy bên trong một máy thật.' },
      { term: 'Trap-and-Emulate', plain: 'Kỹ thuật chặn các lệnh đặc quyền của máy ảo và giả lập kết quả an toàn mà không làm ảnh hưởng máy chủ thật.' },
      { term: 'VT-x / EPT', plain: 'Tính năng tích hợp ngay trong chip CPU để chạy máy ảo mượt gần bằng tốc độ máy vật lý.' },
    ],
    takeaway: 'VM cô lập tới tận nhân OS (chạy được Windows trong Linux), nhờ tăng tốc phần cứng VT-x/EPT mà hiệu năng đạt gần như máy thật.',
  },
  os_12_02: {
    analogy:
      'Có 2 kiểu chủ thầu dựng Máy ảo (**Hypervisor**): **Type-1 (Bare-Metal - như KVM trên AWS/GCP, VMware ESXi)** giống như xây khách sạn thẳng lên nền đất phần cứng — cực kỳ nhẹ, nhanh, chuyên dùng cho Server Cloud; còn **Type-2 (Hosted - như VirtualBox, VMware Workstation trên máy tính bạn)** giống như dựng cái lều cắm trại bên trên sàn của căn nhà Windows/macOS sẵn có — tiện cài để học tập nhưng phải đi vòng qua OS chủ nên nặng hơn chút.',
    whyNeeded:
      'Khi triển khai hạ tầng thực tế, hiểu rõ Type-1 vs Type-2 và **Paravirtualization (VirtIO)** giúp giải thích vì sao cloud server nhanh gấp nhiều lần chạy VirtualBox giả lập phần cứng cũ.',
    deepExplanation: [
      'Type-1 Hypervisor: Chạy trực tiếp trên phần cứng không cần Windows/macOS ở giữa (hoặc như **Linux KVM**: chính Linux Kernel biến mình thành Hypervisor Type-1 nhờ module `kvm`!).',
      'Type-2 Hypervisor: Chạy như 1 ứng dụng bình thường trên Windows/macOS (VirtualBox). Dễ cài đặt test giao diện nhưng mỗi lần I/O phải đi qua 2 lớp hệ điều hành.',
      'Full Virtualization vs **Paravirtualization (VirtIO)**: Nếu bắt Hypervisor giả lập y hệt con chip card mạng Realtek cổ lỗ sĩ năm 1995 cho Guest OS tin sái cổ thì siêu chậm! Với **VirtIO**, Guest OS biết mình đang là máy ảo -> nó dùng driver VirtIO giao tiếp trực tiếp với Hypervisor qua hàng đợi vòng dùng chung RAM tốc độ cao (Ring Buffer), đẩy tốc độ mạng và SSD ảo đạt gần 100% tốc độ gốc!',
    ],
    jargonBuster: [
      { term: 'Type-1 vs Type-2 Hypervisor', plain: 'Type-1 chạy thẳng trên phần cứng (Cloud/Server); Type-2 chạy ké như phần mềm trên Windows/macOS (VirtualBox).' },
      { term: 'KVM (Kernel-based VM)', plain: 'Công nghệ biến nhân Linux thành Hypervisor Type-1 cực mạnh, nền tảng của hầu hết Cloud thế giới.' },
      { term: 'VirtIO', plain: 'Bộ driver thông minh giúp máy ảo giao tiếp thẳng với máy thật cực nhanh thay vì giả vờ làm thiết bị phần cứng cũ.' },
    ],
    takeaway: 'Cloud chọn KVM (Type-1) + driver VirtIO để vừa có độ cô lập thép của máy ảo vừa đạt tốc độ mạng/ổ cứng sát phần cứng thật.',
  },
  os_12_03: {
    analogy:
      'Nếu **VM (Máy ảo)** giống xây nguyên **3 ngôi nhà riêng biệt** (mỗi nhà tự xây móng OS riêng nặng vài GB RAM & mất 30 giây khởi động), thì **Container (Docker)** giống như một **tòa chung cư hiện đại chia thành 10 căn hộ dùng chung phần móng (chung 1 Linux Kernel)**! Chỉ việc dựng vách ngăn mắt nhìn (**Namespaces**), gắn đồng hồ điện nước riêng (**cgroups**) và chồng lớp ảnh thư mục (**OverlayFS**). Khởi động mất 0.2 giây, tốn vài MB RAM!',
    whyNeeded:
      'Sự thật thú vị cho người mới: "Docker Container" không phải là công nghệ mới hoàn toàn bí ẩn — nó thực chất là **một Process Linux bình thường** được nhân Linux đeo thêm 3 cặp kính chắn bảo vệ!',
    deepExplanation: [
      '3 mảnh ghép tạo nên phép màu Docker Container từ chính Linux Kernel:',
      '1. **Linux Namespaces ("Cô lập tầm nhìn")**: Khiến tiến trình bên trong ảo tưởng nó đang ở một máy riêng! Có PID Namespace (nó thấy mình là PID 1, không thấy app khác ngoài máy thật), Net Namespace (có IP và cổng mạng riêng), Mount Namespace (chỉ thấy cây thư mục của Container).',
      '2. **cgroups (Control Groups - "Giới hạn tài nguyên")**: Gắn trần tối đa: Container này chỉ được ăn tối đa 512 MB RAM và 1 nhân CPU, nếu ngốn lố thì giết mỗi nó chứ không kéo sập cả server.',
      '3. **OverlayFS (Union File System - "Xếp lớp ổ đĩa Copy-on-Write")**: Hàng chục Container Ubuntu có thể dùng chung 1 lớp ảnh Ubuntu nền Read-Only bên dưới, mỗi Container chỉ có 1 lớp mỏng Writeable trên cùng cho các file nó sửa -> cực kỳ tiết kiệm dung lượng đĩa!',
    ],
    jargonBuster: [
      { term: 'Namespaces', plain: 'Tính năng Linux cô lập tầm nhìn (Process ID, Mạng, File) khiến tiến trình tưởng nó đang chạy trên 1 máy riêng.' },
      { term: 'cgroups', plain: 'Cơ chế giới hạn hạn mức CPU, RAM, Băng thông tối đa một nhóm tiến trình được phép sử dụng.' },
      { term: 'OverlayFS', plain: 'Hệ thống file xếp nhiều lớp ảnh lên nhau: lớp dưới dùng chung Read-Only, lớp trên cùng chỉ ghi phần thay đổi.' },
    ],
    takeaway: 'Container = Process bình thường + Namespaces (tách tầm nhìn) + cgroups (giới hạn RAM/CPU) + OverlayFS (dùng chung layer đĩa).',
  },
  os_12_04: {
    analogy:
      'Khi hệ thống mở rộng thành **100 máy chủ đặt ở 3 nước khác nhau (Distributed OS / Distributed Systems)**, xuất hiện một vấn đề đau đầu: Đồng hồ vật lý trên mỗi máy chạy lệch nhau vài mili-giây! Máy A ghi đơn hàng lúc `12:00:00.005`, sang Máy B đồng hồ chạy chậm nên nó ghi giao hàng lúc `12:00:00.002` -> Nhìn vào giờ lại thấy... **giao hàng trước khi đặt hàng**! Vì vậy người ta phát minh ra **Đồng hồ Logic (Lamport Clock)** chỉ đếm thứ tự "Ai gây ra ai" chứ không tin giờ trên đồng hồ treo tường.',
    whyNeeded:
      'Khi bạn học lên Backend lớn / Microservices / Kafka / Kubernetes, mọi nguyên lý ở 1 máy đơn (Khóa, Đồng hồ, Bộ nhớ) đều thay đổi hoàn toàn khi trải ra qua đường mạng hay bị đứt cáp.',
    deepExplanation: [
      'Tại sao không tin được đồng hồ vật lý (NTP)? Mạng có độ trễ không đều và dao động tinh thể đồng hồ máy tính luôn trôi lệch (**Clock Skew**). Nếu tin `Date.now()` của 2 server khác nhau để quyết định giao dịch nào xảy ra trước là hỏng ngay!',
      'Giải pháp **Lamport Logical Clock (`Happens-Before ->`)**: Không cần biết chính xác lúc mấy giờ, chỉ giữ quy luật nhân quả: Nếu A gửi tin nhắn sang B, số thứ tự sự kiện của B bắt buộc phải lớn hơn của A (`max(local, msgTime) + 1`).',
      'Distributed Consensus (Raft / Paxos) & Split-Brain: Khi 5 server cùng quản lý dữ liệu chung mà đứt mạng chia làm 2 phe (2 máy vs 3 máy), chỉ phe nắm **đa số (> N/2, tức 3 máy)** mới được bầu ra Thủ lĩnh (Leader) cho phép ghi dữ liệu — phe thiểu số 2 máy tự khóa không nhận ghi để tránh đẻ ra **2 phiên bản dữ liệu mâu thuẫn nhau (Split-Brain)**!',
    ],
    jargonBuster: [
      { term: 'Clock Skew', plain: 'Sự sai lệch thời gian giữa đồng hồ vật lý của các máy chủ khác nhau trong mạng.' },
      { term: 'Lamport / Logical Clock', plain: 'Bộ đếm thứ tự nhân quả các sự kiện thay thế cho giờ đồng hồ thực tế trong hệ thống phân tán.' },
      { term: 'Split-Brain', plain: 'Thảm họa khi đứt mạng làm 2 nhóm server tách rời đều tưởng mình là Leader chính và ghi dữ liệu đè chéo nhau.' },
    ],
    takeaway: 'Trong hệ thống nhiều máy chủ: không bao giờ tin tuyệt đối đồng hồ tường của từng máy, và luôn dùng luật Đa số (Quorum) chống Split-Brain.',
  },
  os_12_05: {
    analogy:
      'Ổ cứng máy bạn chỉ gắn được tối đa vài chục TB. Khi Google/Facebook cần lưu hàng trăm Petabyte ảnh và video, không có cái máy tính đơn lẻ nào chứa nổi! **Distributed File System (như HDFS, Ceph, GFS)** ghép hàng nghìn ổ cứng trên hàng nghìn máy chủ thường lại thành một **Kho khổng lồ thống nhất**: chặt mỗi file video ra thành nhiều khúc (Chunks 64MB), copy mỗi khúc cất rải vào **3 máy ở 3 tủ rack khác nhau** -> cháy mất 1 tủ điện cả server vẫn không mất một video nào!',
    whyNeeded:
      'Đây là cầu nối cuối cùng nối kiến thức File System của môn Hệ điều hành sang Cloud Storage thực tế (AWS S3, Kubernetes Persistent Volumes, Google Drive).',
    deepExplanation: [
      'Cách thiết kế kinh điển của Hệ thống File Phân tán (GFS / HDFS):',
      '1. Tách đôi **Metadata Node (NameNode)** — giữ bản đồ chỉ mục "File X gồm 3 mảnh nằm ở những máy nào" (nằm gọn trên RAM để trả lời cực nhanh) — và hàng nghìn **Data Nodes** chỉ lo cất các mảnh dữ liệu thô (Chunks).',
      '2. **Replication (Nhân bản mặc định x3)**: Mảnh 1 ghi vào Máy A (Rack 1), tự động copy sang Máy B (Rack 2) và Máy C (Rack 2) để chịu chết cả ổ đĩa lẫn mất điện cả tủ rack.',
      '3. **File Storage vs Block Storage vs Object Storage (S3)**:',
      '- Block Storage (như AWS EBS): Giả lập 1 ổ cứng thô gắn cho 1 máy ảo chạy Database (độ trễ siêu thấp).',
      '- File Storage (NFS/EFS): Chia sẻ 1 thư mục mạng cho nhiều máy cùng mount vào đọc ghi như thư mục chung.',
      '- Object Storage (AWS S3 / Cloudflare R2 / Cloudinary): Không còn cây thư mục lồng nhau kiểu POSIX; mỗi file là một Object chứa Key + Data + Metadata truy xuất qua HTTPS REST API, mở rộng vô hạn!',
    ],
    jargonBuster: [
      { term: 'Chunk / Shard', plain: 'Mảnh nhỏ của một file lớn được chặt ra để cất rải trên nhiều máy chủ khác nhau.' },
      { term: 'Replication Factor', plain: 'Số bản sao dự phòng của cùng một mảnh dữ liệu cất rải ở nhiều máy khác nhau (thường là 3).' },
      { term: 'Object Storage (S3)', plain: 'Kho lưu trữ đám mây tối ưu cho ảnh, video, backup qua HTTP URL, mở rộng vô hạn nhưng không cài OS lên được.' },
    ],
    takeaway: 'Từ Inode trên 1 đĩa đơn, Cloud nâng cấp thành NameNode + Chunk Replicas x3; ảnh/video dùng Object Storage (S3), Database dùng Block Storage.',
  },
};
