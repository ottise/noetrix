import type { BeginnerTopicGuide } from './osBeginnerGuides';
import { NET_BEGINNER_GUIDES_PART2 } from './netBeginnerGuidesPart2';

const NET_BEGINNER_GUIDES_PART1: Record<string, BeginnerTopicGuide> = {
  // =========================================================================
  // MODULE 01: INTRODUCTION TO COMPUTER NETWORKING
  // =========================================================================
  net_01_01: {
    analogy:
      'Hãy tưởng tượng bạn muốn chuyển toàn bộ tủ sách 500 cuốn qua thành phố khác. **Circuit Switching** (như điện thoại bàn ngày xưa) giống việc thuê bao riêng hẳn 1 làn đường cao tốc từ nhà bạn tới nhà bạn bè: đường trống trơn dù bạn dừng nghỉ không chở sách cũng không cho xe khác chạy — cực tốn! Còn **Packet Switching (Chuyển mạch gói - cách Internet chạy)** giống việc chia 500 cuốn vào 500 thùng nhỏ gọn có dán tên người nhận + số thứ tự (`Thùng 1/500`, `2/500`...) rồi thả chung lên đường cao tốc với hàng triệu xe khác! Đường đi được chia sẻ tối đa; tới nơi người nhận chỉ việc ghép lại theo số thứ tự.',
    whyNeeded:
      'Lưu lượng mạng máy tính mang tính từng đợt (bạn bấm mở 1 web tốn 0.5 giây tải dữ liệu, rồi đọc báo 2 phút chẳng tải gì). Nếu thuê riêng dây dẫn cho mỗi người, Internet sẽ tắc nghẽn và đắt gấp trăm lần.',
    deepExplanation: [
      'Host (End System): Bất kỳ thiết bị nào nằm ở rìa mạng (laptop, iPhone, máy chủ web) tạo ra hoặc tiêu thụ dữ liệu.',
      'Cơ chế Store-and-Forward trên Router: Mỗi Router dọc đường phải nhận trọn vẹn 100% các bit của gói tin nhỏ rồi kiểm tra địa chỉ đích, sau đó mới đẩy gói tin sang sợi cáp kế tiếp.',
      'Statistical Multiplexing (Ghép kênh thống kê): Vì nhiều người hiếm khi bấm tải nặng ở cùng đúng 1 mili-giây, dùng chung một đường truyền cho phép phục vụ số người đông gấp 3–4 lần đường riêng cố định.',
      'Nhược điểm nhỏ: Nếu cùng lúc có quá nhiều gói tràn tới một Router, gói đến sau phải đứng xếp vào hàng đợi (**Queue**) gây trễ (**Queuing Delay**) hoặc tràn bộ nhớ đệm thì bị rơi rớt (**Packet Loss**).',
    ],
    jargonBuster: [
      { term: 'Packet (Gói tin)', plain: 'Mẩu dữ liệu nhỏ (thường tối đa ~1500 byte) được chặt ra từ file/tin nhắn lớn để gửi đi qua mạng.' },
      { term: 'Store-and-Forward', plain: 'Router nhận đủ nguyên 1 gói tin rồi mới kiểm tra địa chỉ và chuyển tiếp đi.' },
      { term: 'Packet Loss', plain: 'Mất gói tin: khi hàng đợi của Router bị đầy tràn không chứa thêm được nữa, gói mới tới bị vứt bỏ.' },
    ],
    takeaway: 'Internet chọn Packet Switching: chặt dữ liệu thành từng gói nhỏ đi chung đường truyền, tận dụng tối đa băng thông toàn cầu.',
  },
  net_01_02: {
    analogy:
      '**LAN** giống mạng lưới liên lạc **bên trong một ngôi nhà hay văn phòng** (Wi-Fi nhà bạn kết nối điện thoại, laptop, máy in). **MAN** giống đường giao thông **trong phạm vi một thành phố**. Còn **WAN** giống **hệ thống đường cao tốc quốc gia & quốc tế** nối hàng triệu ngôi nhà/thành phố lại với nhau tạo nên Internet — nơi mỗi tập đoàn lớn (VNPT, Viettel, Google, AWS) quản lý một **Autonomous System (AS - Khu tự trị)** giống một tỉnh lộ tự quản.',
    whyNeeded:
      'Không ai có thể kéo dây cáp nối thẳng từ nhà bạn ở Việt Nam sang tận máy chủ YouTube ở Mỹ. Mạng phải phân cấp từ nhỏ (LAN) -> vừa (ISP/MAN) -> lõi liên lục địa (WAN/AS) để dễ quản lý và định tuyến.',
    deepExplanation: [
      'LAN (Local Area Network): Phạm vi nhỏ (phòng, nhà, công ty), tốc độ rất cao (1 Gbps – 10 Gbps), độ trễ siêu thấp (< 1 ms), sử dụng Switch & Wi-Fi Access Point.',
      'MAN (Metropolitan Area Network): Nối các chi nhánh trong cùng một đô thị bằng cáp quang.',
      'WAN (Wide Area Network): Kết nối xuyên quốc gia, xuyên lục địa qua cáp quang biển và vệ tinh; tốc độ phụ thuộc gói thuê, độ trễ từ vài chục tới vài trăm ms.',
      'AS (Autonomous System): Một hệ thống mạng lớn dưới một quyền quản trị duy nhất (như Viettel, VNPT, Cloudflare), được cấp một mã số **ASN** toàn cầu để tự trao đổi bản đồ đường đi với nhau bằng giao thức BGP.',
    ],
    jargonBuster: [
      { term: 'LAN / WAN', plain: 'LAN là mạng nội bộ trong nhà/công ty; WAN là mạng diện rộng kết nối nhiều vùng địa lý xa nhau.' },
      { term: 'ISP', plain: 'Nhà cung cấp dịch vụ Internet (Viettel, FPT, VNPT) bán đường truyền nối nhà bạn ra mạng thế giới.' },
      { term: 'AS (Autonomous System)', plain: 'Một cụm mạng lớn có chủ quản riêng (như cả mạng lưới Viettel hoặc Google) có mã số ASN định danh trên Internet.' },
    ],
    takeaway: 'Internet là "mạng của các mạng": máy nhà bạn (LAN) nối qua nhà mạng (ISP/AS) đi trên hạ tầng xuyên lục địa (WAN).',
  },
  net_01_03: {
    analogy:
      'Cách nối dây giữa các máy (**Topology**) có nhiều kiểu: **Bus** (tất cả cắm chung 1 sợi dây — đứt 1 chỗ chết cả hàng), **Ring** (nối vòng tròn chuyền tay nhau), **Star (Hình sao — phổ biến nhất nhà bạn)** mọi máy đều cắm về 1 cái Switch/Router ở giữa (đứt dây máy nào chỉ mỗi máy đó mất mạng), và **Mesh (Lưới)** các thiết bị nối chéo nhau nhiều đường để đứt 1 đường vẫn tự đi đường vòng!',
    whyNeeded:
      'Chọn sai cách nối dây sẽ làm cả công ty rớt mạng chỉ vì 1 sợi cáp lỏng, hoặc bị nghẽn cổ chai ở một thiết bị trung tâm.',
    deepExplanation: [
      'Star Topology (Hình sao): Chuẩn mực cho mọi văn phòng và nhà ở (Switch/Router làm tâm). Dễ sửa: máy nào lỗi chỉ rút dây máy đó. Điểm yếu (Single Point of Failure): nếu con Switch trung tâm hỏng thì cả phòng mất mạng.',
      'Mesh Topology (Full Mesh / Partial Mesh): Dùng ở tầng lõi Internet, Data Center và Wi-Fi Mesh trong nhà nhiều tầng. Nhiều đường dự phòng -> không sợ đứt 1 đường, nhưng tốn rất nhiều dây và cổng cắm (`N*(N-1)/2` đường nếu nối kín hoàn toàn).',
      'Spine-Leaf (Clos Topology trong Data Center hiện đại): Mọi server cắm vào Switch Leaf (tầng lá), mọi Leaf nối chéo lên toàn bộ Switch Spine (tầng xương sống) -> mọi server chỉ cách nhau đúng 2 bước nhảy, băng thông mở rộng đều!',
    ],
    jargonBuster: [
      { term: 'Topology', plain: 'Sơ đồ hình học mô tả các máy tính và thiết bị mạng được nối dây với nhau theo cấu trúc nào.' },
      { term: 'Single Point of Failure', plain: 'Điểm yếu chí tử: một thiết bị duy nhất mà nếu nó hỏng thì kéo sập toàn bộ mạng.' },
      { term: 'Redundancy', plain: 'Dự phòng đường đi: luôn có ít nhất 2 đường phụ để mạng tự chuyển hướng khi đứt cáp.' },
    ],
    takeaway: 'Văn phòng dùng Star (đơn giản, dễ quản); Data Center và mạng lõi dùng Mesh/Spine-Leaf để chống sập khi đứt đường.',
  },
  net_01_04: {
    analogy:
      'Phân biệt 4 thiết bị mạng hay bị gọi nhầm nhất: **Hub/Repeater** giống cái **loa phường** (nói gì hét to cho cả xóm cùng nghe, ồn ào mất an toàn); **Switch** giống **tổng đài nội bộ trong tòa nhà** (nhớ từng số phòng/địa chỉ MAC để đưa thư tận tay đúng người); **Router** giống **người gác cổng giữa các quận/quốc gia** (dùng địa chỉ IP dẫn đường ra Internet); **Modem** là **phiên dịch viên chuyển tín hiệu cáp quang/đồng** thành tín hiệu số 0/1.',
    whyNeeded:
      'Cục Wi-Fi ở nhà bạn thực chất thường là thiết bị 4-trong-1 (Modem + Router + Switch + Wi-Fi Access Point). Tách bạch từng vai trò giúp bạn biết phải cấu hình cái nào khi gặp sự cố.',
    deepExplanation: [
      'Repeater / Hub (Tầng 1 - Physical): Chỉ khuếch đại điện/tín hiệu ngây thơ. Gói tin vào 1 cổng sẽ bị nhân bản hét ra TẤT CẢ các cổng còn lại -> gây va chạm (Collision) và ai cũng nghe lén được! Ngày nay đã tuyệt chủng.',
      'Switch (Tầng 2 - Data Link): Nhìn vào địa chỉ phần cứng **MAC Address**, học thuộc xem MAC nào nằm ở lỗ cắm số mấy, rồi chuyển gói tin đi ĐÚNG 1 lỗ cắm người nhận! Giúp mạng nội bộ LAN chạy hết công suất mà không đụng độ.',
      'Router (Tầng 3 - Network): Nối các mạng khác nhau (như mạng LAN nhà bạn với mạng Internet của VNPT). Nhìn **địa chỉ IP** để tra bản đồ định tuyến đường đi ngắn nhất.',
      'Access Point (AP): Chỉ làm nhiệm vụ phát sóng Wi-Fi nối thiết bị không dây vào dây mạng LAN.',
    ],
    jargonBuster: [
      { term: 'Switch', plain: 'Bộ chia mạng thông minh trong mạng nội bộ LAN: chuyển dữ liệu đúng cổng người nhận bằng địa chỉ MAC.' },
      { term: 'Router', plain: 'Bộ định tuyến nối giữa các mạng khác nhau (như nối LAN ra Internet), dẫn đường bằng địa chỉ IP.' },
      { term: 'Access Point (AP)', plain: 'Điểm phát sóng Wi-Fi nối các máy không dây vào mạng dây nội bộ.' },
    ],
    takeaway: 'Switch dùng MAC nối các máy trong cùng 1 nhà (LAN); Router dùng IP nối nhà này với thế giới bên ngoài (WAN/Internet).',
  },
  net_01_05: {
    analogy:
      'Gửi dữ liệu qua mạng giống gửi bưu phẩm vào một tòa chung cư lớn: **Địa chỉ MAC** là **Số CMND gắn chết trên mặt con chip** của mỗi người từ lúc xuất xưởng (chỉ dùng nhận diện khi đi qua bưu tá trong cùng khu phố LAN). **Địa chỉ IP** là **Địa chỉ nhà có Quận/Thành phố** (vd `192.168.1.10` hay `142.250.190.46`) giúp bưu điện dẫn đường xuyên qua nhiều thành phố tới đúng tòa nhà! Còn **Số Port (`80`, `443`, `5432`)** là **Số căn hộ/Tên ứng dụng** bên trong máy tính đó ("Gửi cho trình duyệt Web chứ không phải gửi cho Game!").',
    whyNeeded:
      'Người mới học mạng 90% bị rối vì không phân biệt khi nào dùng MAC, khi nào dùng IP và Port để làm gì!',
    deepExplanation: [
      '1. **MAC Address (Layer 2 - Physical Hardware ID)**: Dài 48-bit (6 cặp chữ số Hex như `A4:83:E7:12:9B:0C`). Gắn cố định vào card mạng. **Lưu ý cực quan trọng**: Địa chỉ MAC CHỈ dùng để nhảy từng chặng một trong cùng mạng LAN! Qua mỗi Router, gói tin được bọc lại bằng MAC của chặng mới.',
      '2. **IP Address (Layer 3 - Logical Network Address)**: Gắn tạm theo vị trí mạng bạn đang đứng (mang laptop từ nhà ra quán cà phê, MAC giữ nguyên còn IP đổi theo Wi-Fi mới!). Giữ nguyên từ máy gửi tới tận máy nhận (trừ khi đi qua NAT).',
      '3. **Port Number (Layer 4 - Application Endpoint)**: Con số 16-bit (`0` đến `65535`) phân biệt nhiều phần mềm chạy chung trên 1 máy tính (chung 1 IP): `80` = HTTP, `443` = HTTPS, `22` = SSH, `5432` = PostgreSQL.',
    ],
    jargonBuster: [
      { term: 'MAC Address', plain: 'Mã số phần cứng duy nhất của card mạng, chỉ dùng truyền trong phạm vi cùng 1 mạng LAN.' },
      { term: 'IP Address', plain: 'Địa chỉ logic chỉ định vị trí của máy trên mạng lớn/Internet để Router dẫn đường tới đúng máy.' },
      { term: 'Port (Cổng)', plain: 'Con số đánh dấu từng phần mềm/dịch vụ cụ thể đang mở lắng nghe bên trong một máy tính.' },
    ],
    takeaway: 'MAC = chặng này nhảy sang chặng kế trong LAN; IP = từ máy nguồn tới tận máy đích; Port = chọn đúng phần mềm nhận.',
  },

  // =========================================================================
  // MODULE 02: OSI MODEL & TCP/IP ARCHITECTURE
  // =========================================================================
  net_02_01: {
    analogy:
      '**Mô hình OSI 7 tầng** giống một dây chuyền gửi thư chuyên nghiệp chia làm 7 bàn: Bàn 7 bạn viết lá thư (Application - Chrome/App), Bàn 6 dịch ra tiếng Anh & mã hóa (Presentation), Bàn 5 mở phiên hẹn (Session), Bàn 4 đánh số trang & đóng thùng chống mất (Transport - TCP), Bàn 3 ghi địa chỉ đường phố xuyên quốc gia (Network - IP), Bàn 2 ghi địa chỉ xe giao chặng đầu trong phường (Data Link - Ethernet/MAC), Bàn 1 biến thành tia sáng bắn qua cáp quang (Physical).',
    whyNeeded:
      'Chia mạng làm nhiều tầng giúp công việc không rối tung: người làm trình duyệt web (Tầng 7) không cần biết bạn dùng cáp đồng hay sóng Wi-Fi hay 5G (Tầng 1–2) — thay Wi-Fi bằng cáp quang thì mọi website vẫn chạy nguyên vẹn!',
    deepExplanation: [
      '7 tầng OSI từ trên xuống dưới (nhớ câu: *All People Seem To Need Data Processing*):',
      '- Tầng 7 Application: Giao tiếp trực tiếp với App (HTTP, DNS, SMTP).',
      '- Tầng 6 Presentation: Định dạng, nén, mã hóa (TLS, UTF-8, JSON/JPEG).',
      '- Tầng 5 Session: Quản lý phiên hội thoại đăng nhập.',
      '- Tầng 4 Transport: Chia đoạn, đảm bảo độ tin cậy & đánh số Port (TCP, UDP).',
      '- Tầng 3 Network: Địa chỉ IP & tìm đường xuyên nhiều mạng (IP, Router, ICMP).',
      '- Tầng 2 Data Link: Đóng khung Frame, địa chỉ MAC, chạy qua Switch (Ethernet, Wi-Fi MAC, ARP).',
      '- Tầng 1 Physical: Tín hiệu điện, ánh sáng laser cáp quang, sóng radio (Bit 0/1).',
    ],
    jargonBuster: [
      { term: 'OSI Model', plain: 'Mô hình tham chiếu 7 tầng lý thuyết dùng làm ngôn ngữ chung cho kỹ sư mạng toàn thế giới chẩn đoán lỗi.' },
      { term: 'Layer Isolation', plain: 'Tách biệt tầng: sửa đổi tầng dưới (vd đổi cáp thành Wi-Fi) không bắt app tầng trên phải viết lại.' },
      { term: 'PDU', plain: 'Tên gọi gói dữ liệu ở từng tầng: Tầng 4 là Segment, Tầng 3 là Packet, Tầng 2 là Frame, Tầng 1 là Bit.' },
    ],
    takeaway: 'OSI chia 7 tầng giúp tách biệt phần mềm (tầng cao), địa chỉ/đường đi (tầng giữa) và phần cứng truyền tín hiệu (tầng đáy).',
  },
  net_02_02: {
    analogy:
      'Nếu **OSI 7 tầng** là **giáo trình lý thuyết hoàn hảo** của trường đại học, thì **TCP/IP 4 tầng** là **phiên bản thực chiến ngoài đời** đã tạo nên toàn bộ mạng Internet ngày nay! Thực tế người ta gộp 3 tầng trên cùng (Application + Presentation + Session) làm 1 tầng **Application** cho gọn, giữ nguyên **Transport (TCP/UDP)** và **Internet (IP)**, rồi gộp 2 tầng đáy thành **Link / Network Access**.',
    whyNeeded:
      'Không có thiết bị nào trên Internet dùng hết 7 tầng tách biệt của OSI; toàn bộ Linux, Windows, iOS và Router đều lập trình theo mô hình 4 (hoặc 5) tầng TCP/IP.',
    deepExplanation: [
      'Mô hình hình đồng hồ cát (Hourglass Model) của Internet:',
      '- Tầng trên cùng (Application): Hàng trăm giao thức đa dạng (HTTP, DNS, SSH, WebSocket, BitTorrent).',
      '- Tầng Transport: Chọn 1 trong 2: TCP (chắc chắn không mất) hoặc UDP (siêu nhanh).',
      '- **Eo thắt duy nhất ở giữa — Tầng Internet (IP)**: Gần như MỌI thứ trên thế giới đều đi qua chuẩn IP (IPv4 / IPv6)! Chính nhờ cái eo chung một chuẩn IP này mà app tầng trên và phần cứng tầng dưới bùng nổ sáng tạo mà vẫn nói chuyện được với nhau.',
      '- Tầng đáy (Network Link/Physical): Ethernet, Wi-Fi, 5G, Cáp quang biển.',
    ],
    jargonBuster: [
      { term: 'TCP/IP Suite', plain: 'Bộ giao thức thực tế vận hành Internet gồm 4 lớp: Application, Transport, Internet (IP), Link.' },
      { term: 'Hourglass Architecture', plain: 'Kiến trúc đồng hồ cát với IP làm chuẩn chung duy nhất ở giữa nối mọi app với mọi phần cứng mạng.' },
      { term: 'RFC', plain: 'Tài liệu đặc tả kỹ thuật chính thức của mọi chuẩn mạng Internet (do tổ chức IETF phát hành).' },
    ],
    takeaway: 'OSI để học và chẩn đoán lỗi 7 bước; TCP/IP là bộ giao thức thật chạy Internet với trái tim chung là giao thức IP.',
  },
  net_02_03: {
    analogy:
      '**Encapsulation (Đóng gói)** giống như trò **Búp bê Nga Matryoshka** hoặc gói quà nhiều lớp: Dữ liệu JSON của bạn đặt vào hộp **HTTP** -> nhét tiếp vào thùng carton **TCP** (dán nhãn Port `443`) -> bỏ tiếp vào phong bì **IP** (ghi IP gửi/nhận) -> bọc ngoài bằng bao tải **Ethernet Frame** (ghi MAC chặng tới) rồi bắn thành tín hiệu sáng! Khi tới máy đích (**Decapsulation**), máy đích bóc từng lớp vỏ từ ngoài vào trong để lấy lại đúng dòng JSON ban đầu.',
    whyNeeded:
      'Mỗi thiết bị dọc đường chỉ đọc đúng lớp vỏ thuộc phận sự của nó mà không thèm mở xem ruột bên trong: Switch chỉ xem vỏ Ethernet ngoài cùng, Router bóc vỏ Ethernet ra xem địa chỉ IP rồi bọc lại vỏ Ethernet mới gửi đi tiếp!',
    deepExplanation: [
      'Chuỗi đóng gói (Từ App đi xuống dây mạng):',
      '1. Application tạo dữ liệu + Header HTTP -> gọi là **Data/Message**.',
      '2. Transport cắt nhỏ thành từng đoạn <= MSS, gắn Header TCP (Port nguồn, Port đích, Sequence Number) -> gọi là **Segment**.',
      '3. Network gắn Header IP (IP nguồn, IP đích, TTL) -> gọi là **Packet**.',
      '4. Data Link gắn Ethernet Header (MAC nguồn, MAC đích) + mã kiểm lỗi **FCS** ở đuôi -> gọi là **Frame**.',
      '5. Physical biến thành chuỗi bit `010110...` truyền lên dây hoặc sóng Wi-Fi.',
      'Chú ý: Kích thước tối đa một Frame thường là **1500 Bytes (MTU)**; trừ 20 byte IP header và 20 byte TCP header -> tối đa ~1460 byte dữ liệu thật (MSS) mỗi gói!',
    ],
    jargonBuster: [
      { term: 'Encapsulation', plain: 'Đóng gói: mỗi tầng mạng bọc thêm 1 lớp nhãn Header riêng ra bên ngoài gói dữ liệu tầng trên.' },
      { term: 'Header & Payload', plain: 'Header là nhãn thông tin chỉ đường ở đầu gói; Payload là ruột dữ liệu thật cần gửi.' },
      { term: 'MTU / MSS', plain: 'MTU (thường 1500 byte) là kích thước tối đa của 1 gói đi trên dây; MSS là phần ruột tối đa trong đó.' },
    ],
    takeaway: 'Gửi đi là bọc vỏ từng tầng (Data -> Segment -> Packet -> Frame); nhận về là bóc ngược từ ngoài vào trong.',
  },
  net_02_04: {
    analogy:
      '**Protocol (Giao thức)** giống như **luật giao tiếp lịch sự**: Khi gọi điện thoại, bên gọi nói "Alo?" -> bên kia đáp "Alo, tôi nghe" -> rồi mới trao đổi -> cuối cùng nói "Tạm biệt nhé!" rồi cúp máy. **State Machine (Máy trạng thái)** là trí nhớ giữ biết cuộc gọi đang ở bước nào ("Đã Alo xong, đang nói chuyện", chứ chưa nói "Tạm biệt").',
    whyNeeded:
      'Máy tính từ các hãng khác nhau (Apple, Dell, Linux server) không bao giờ nói chuyện được nếu không thống nhất từng bit, từng câu hỏi-đáp và biết cách xử lý khi một câu bị mất giữa chừng.',
    deepExplanation: [
      'Một giao thức chuẩn mạng quy định 3 thứ: **Format** (cấu trúc từng bit trong gói tin), **Order** (trình tự ai nói trước, ai đáp sau), và **Actions** (làm gì nếu chờ 3 giây không thấy trả lời -> Timeout & Retry).',
      'Ví dụ TCP State Machine: Trạng thái khởi đầu `CLOSED` -> Server mở cổng `LISTEN` -> Client gửi SYN chuyển sang `SYN_SENT` -> nhận lại SYN-ACK chuyển sang `ESTABLISHED` (kết nối thành công!) -> khi đóng chuyển qua `FIN_WAIT` / `TIME_WAIT`.',
      'Stateless (như HTTP, IP, UDP): Xử lý từng gói độc lập, xong là quên sạch không giữ trạng thái phiên (dễ mở rộng cho hàng triệu user!). Stateful (như TCP): Phải nhớ trạng thái từng kết nối đang mở trong RAM.',
    ],
    jargonBuster: [
      { term: 'Protocol', plain: 'Bộ quy tắc chuẩn về định dạng và thứ tự tin nhắn bắt buộc giữa 2 máy tính khi giao tiếp.' },
      { term: 'State Machine', plain: 'Sơ đồ các trạng thái hợp lệ (như Chờ -> Đang kết nối -> Đang đóng) giúp giao thức không bị rối.' },
      { term: 'Stateless vs Stateful', plain: 'Stateless xử lý từng yêu cầu riêng lẻ xong là quên; Stateful ghi nhớ lịch sử trạng thái suốt phiên làm việc.' },
    ],
    takeaway: 'Giao thức là "ngôn ngữ và nghi thức chung" của mạng; hiểu State Machine (như trạng thái TCP) giúp debug ngay lỗi treo kết nối.',
  },
  net_02_05: {
    analogy:
      'Trong hệ thống điều hành một thành phố hay Router lớn: **Control Plane (Mặt phẳng Điều khiển)** giống **Phòng vẽ bản đồ & Sở giao thông** (ngồi tính toán suy nghĩ xem tuyến đường nào tắc, cập nhật bảng chỉ đường). Còn **Data Plane (Mặt phẳng Dữ liệu)** giống **Cảnh sát đứng tại ngã tư** cầm tấm biển có sẵn, cứ thấy xe lao tới là nhìn liếc biển chỉ tay cho đi ngay trong tích tắc không cần suy nghĩ!',
    whyNeeded:
      'Một Router cao cấp phải chuyển tiếp hàng chục triệu gói tin mỗi giây (`Data Plane`). Nó không thể vừa chuyển từng gói vừa chạy thuật toán tìm đường phức tạp (`Control Plane`) nên phải tách đôi!',
    deepExplanation: [
      'Control Plane: Chạy bằng phần mềm trên CPU (tính bằng mili-giây). Nơi chạy OSPF, BGP để trao đổi thông tin đường đi với Router hàng xóm và đúc kết thành một bảng tra cứu nhanh (**FIB - Forwarding Information Base**).',
      'Data Plane: Chạy trên chip phần cứng chuyên dụng **ASIC** (tính bằng nano-giây!). Gói tin vào là chip tra bảng FIB có sẵn và đẩy ngay ra cổng đích không cần làm phiền CPU.',
      'Trong Data Center Cloud & Linux hiện đại (**SDN & eBPF**): Kỹ sư có thể lập trình Control Plane tập trung từ xa để điều khiển cả nghìn Switch/Router cùng lúc, thậm chí dùng eBPF gắn bộ lọc chạy thẳng trong nhân Linux ở Data Plane để lọc DDoS ở tốc độ hàng chục triệu gói/giây.',
    ],
    jargonBuster: [
      { term: 'Control Plane', plain: 'Bộ não chậm rãi nhưng thông minh: tính toán bảng chỉ đường mạng và chính sách điều phối.' },
      { term: 'Data Plane', plain: 'Tay chân siêu tốc: nhìn vào bảng đã tính sẵn để bắn gói tin đi ngay trong vài nano-giây.' },
      { term: 'eBPF / ASIC', plain: 'Công nghệ phần cứng/nhân Linux giúp Data Plane xử lý gói tin với tốc độ cực khủng.' },
    ],
    takeaway: 'Tách Control Plane (bộ não tính đường) khỏi Data Plane (chân chạy chuyển gói) là bí mật giúp mạng Cloud đạt tốc độ cực lớn.',
  },

  // =========================================================================
  // MODULE 03: PHYSICAL & DATA LINK LAYER (ETHERNET, SWITCHING, ARP)
  // =========================================================================
  net_03_01: {
    analogy:
      'Tầng vật lý giống như **chất liệu con đường và phương tiện phát tín hiệu**: **Dây đồng Cat6** truyền xung điện (dễ bị nhiễu điện từ, đi xa tầm 100m); **Cáp quang (Fiber Optic)** bắn chùm tia sáng laser chạy xuyên lòng thủy tinh siêu mảnh (nhanh kinh khủng, không bị nhiễu sét, đi xa hàng trăm km dưới đáy biển); **Wi-Fi / Sóng vô tuyến** bắn sóng qua không khí (tiện di chuyển nhưng xuyên tường kém và ai ở gần cũng dễ bắt sóng).',
    whyNeeded:
      'Mọi dữ liệu phần mềm cuối cùng đều biến thành bit `0` và `1` truyền qua môi trường vật lý thật. Biết giới hạn vật lý giúp bạn hiểu vì sao Ping cáp quang ổn định hơn Wi-Fi.',
    deepExplanation: [
      '3 môi trường truyền dẫn chính:',
      '1. Cáp xoắn đôi đồng (**Twisted Pair - RJ45 Cat5e/Cat6/Cat6a**): Xoắn các đôi dây lại để khử nhiễu điện từ. Giá rẻ, cấp điện qua dây được (PoE cho camera/Wi-Fi), chạy tới 10 Gbps ở cự ly dưới 55–100m.',
      '2. Cáp quang (**Fiber Optic - Single-mode / Multi-mode**): Không dẫn điện nên miễn nhiễm nhiễu điện; suy hao cực thấp nên nối xuyên thành phố và xuyên đại dương.',
      '3. Vô tuyến (**Wi-Fi / 4G / 5G**): Dùng chung không gian không khí (Half-Duplex: tại 1 kênh tần số chỉ 1 thiết bị phát một lúc, nhiều thiết bị phát cùng lúc là nhiễu nhau!).',
      'Khái niệm **Bit Rate** (băng thông lý thuyết: 1000 Mbps) vs **Propagation Speed** (tốc độ ánh sáng/điện trên dây ~ 200.000 km/s quyết định độ trễ Ping xa gần!).',
    ],
    jargonBuster: [
      { term: 'Bandwidth / Bitrate', plain: 'Độ rộng ống nước: truyền được tối đa bao nhiêu triệu bit trong 1 giây (Mbps / Gbps).' },
      { term: 'Propagation Delay', plain: 'Thời gian tín hiệu ánh sáng/điện thực sự bay dọc chiều dài sợi dây từ điểm A tới điểm B.' },
      { term: 'Full-Duplex vs Half-Duplex', plain: 'Full-Duplex là đường 2 chiều (vừa nói vừa nghe cùng lúc như cáp Ethernet); Half-Duplex như bộ đàm (1 người nói, người kia nghe).' },
    ],
    takeaway: 'Cáp mạng cho độ ổn định Full-Duplex; Cáp quang đi xa siêu tốc; Wi-Fi tiện nhưng dễ nhiễu và phải chia sẻ sóng chung.',
  },
  net_03_02: {
    analogy:
      'Nếu Tầng 1 chỉ là một dòng suối bit `01010101...` chảy liên tục không có điểm đầu điểm cuối, thì **Ethernet Frame** giống như đóng một **khung phong bì chuẩn** quanh dòng bit: Đầu khung đánh tiếng chuông báo hiệu "Chú ý bắt đầu khung mới!" (**Preamble**), dán tên người nhận + người gửi (**MAC**), nhét ruột gói IP vào giữa, và cuối khung gắn thêm **mã kiểm tra toán học FCS** (nếu đường dây bị sét làm méo 1 bit là phát hiện ra vứt ngay!).',
    whyNeeded:
      'Trên sợi dây đồng hay cáp quang luôn có nhiễu điện. Ethernet Frame giúp card mạng biết chỗ nào bắt đầu một gói, gói đó gửi cho ai trong LAN, và gói có bị lỗi bit dọc đường không.',
    deepExplanation: [
      'Cấu trúc một Ethernet II Frame chuẩn:',
      '- Preamble (7 bytes) + SFD (1 byte): Nhịp đồng bộ giúp card mạng căn đồng hồ để bắt đầu đọc bit.',
      '- Destination MAC (6 bytes) + Source MAC (6 bytes): Địa chỉ phần cứng nhận & gửi trong chặng LAN hiện tại.',
      '- EtherType (2 bytes): Khai báo cho máy nhận biết bên trong ruột đang đựng cái gì (`0x0800` = IPv4, `0x0806` = ARP, `0x86DD` = IPv6).',
      '- Payload (46–1500 bytes): Ruột gói tin (IP Packet). Con số **1500** này chính là **MTU** huyền thoại của Internet!',
      '- FCS / CRC-32 (4 bytes ở đuôi): Mã kiểm lỗi toán học; tính lại thấy sai 1 bit là card mạng vứt bỏ frame im lặng luôn.',
    ],
    jargonBuster: [
      { term: 'Ethernet Frame', plain: 'Gói tin chuẩn ở Tầng 2 mang địa chỉ MAC và mã kiểm lỗi bao bọc bên ngoài gói IP khi đi trong LAN.' },
      { term: 'EtherType', plain: 'Trường 2-byte nói rõ bên trong Frame là gói IPv4, IPv6 hay gói hỏi đường ARP.' },
      { term: 'CRC / FCS', plain: 'Mã kiểm tra ở đuôi gói tin giúp phát hiện ngay dữ liệu bị sứt mẻ bit do nhiễu đường truyền.' },
    ],
    takeaway: 'Ethernet đóng gói bit thô thành từng Frame tối đa 1500 byte (MTU) có MAC nguồn/đích và mã tự kiểm lỗi FCS.',
  },
  net_03_03: {
    analogy:
      'Trong một căn phòng họp (mạng LAN), có 3 kiểu nói chuyện bằng địa chỉ MAC: **Unicast** là đi tới ghé tai nói riêng với đúng 1 người (`A4:83:...`); **Multicast** là thông báo chỉ dành cho nhóm câu lạc bộ cờ vua trong phòng cùng nghe; còn **Broadcast (`FF:FF:FF:FF:FF:FF`)** là đứng giữa phòng hét to bằng loa để **MỌI máy tính trong cùng mạng LAN** bắt buộc phải dừng lại nghe xem có việc gì!',
    whyNeeded:
      'Đôi khi máy mới cắm dây vào chưa biết địa chỉ IP của mình (DHCP) hoặc chưa biết máy bên cạnh MAC là gì (ARP) -> bắt buộc phải dùng Broadcast hét lên hỏi chung cả phòng!',
    deepExplanation: [
      'Cấu trúc 48-bit MAC (viết thành 6 cặp Hex, vd `00:1A:2B:3C:4D:5E`):',
      '- 3 cặp đầu (24-bit đầu — **OUI**): Mã định danh hãng sản xuất do tổ chức IEEE cấp (nhìn là biết card mạng của Apple, Intel hay Cisco!).',
      '- 3 cặp sau (24-bit cuối): Số serial riêng của chiếc card mạng đó.',
      'Địa chỉ **Broadcast (`FF:FF:FF:FF:FF:FF`)**: Khi Switch nhận Frame có MAC đích toàn chữ `F`, nó tự động nhân bản gửi ra TẤT CẢ các cổng khác trong cùng mạng LAN đó (trừ cổng vừa nhận). **Lưu ý cực hay**: **Router KHÔNG BAO GIỜ chuyển tiếp gói Broadcast ra ngoài!** -> Mỗi cổng của Router là một ranh giới kết thúc **Broadcast Domain** để tránh làm tắc cả Internet!',
    ],
    jargonBuster: [
      { term: 'Unicast / Broadcast / Multicast', plain: 'Unicast = 1-1; Broadcast = hét cho tất cả trong LAN; Multicast = gửi cho một nhóm đăng ký trước.' },
      { term: 'Broadcast Domain', plain: 'Phạm vi mà một tiếng hét Broadcast lan tới được (bị chặn đứng lại bởi Router hoặc VLAN).' },
      { term: 'OUI', plain: 'Nửa đầu địa chỉ MAC giúp tra ra hãng nào đã sản xuất con chip Wi-Fi/Ethernet đó.' },
    ],
    takeaway: 'MAC Broadcast (`FF:FF...`) giúp tìm nhau trong LAN, nhưng được Router chặn lại để bão Broadcast không tràn ra Internet.',
  },
  net_03_04: {
    analogy:
      'Switch thông minh như một cô lễ tân cầm cuốn **Sổ Tay Bàn Làm Việc (MAC Address Table)**: Ban đầu sổ trắng tinh. Khi Anh An (cổng 1) gửi thư cho Chị Bình (chưa biết ngồi đâu), cô ghi vội vào sổ: `"An ở Cổng 1"`, rồi photo gửi tất cả các cổng hỏi xem Chị Bình ở đâu (**Flood**). Chị Bình (cổng 4) trả lời lại -> cô ghi ngay `"Bình ở Cổng 4"`. Từ lần sau An gửi cho Bình, cô đưa thẳng cổng 1 -> cổng 4 không làm phiền ai khác! Còn **STP (Spanning Tree)** là luật tự động khóa 1 cầu dự phòng nếu bạn lỡ cắm 2 Switch thành vòng tròn khiến thư chạy lòng vòng vô tận (**Broadcast Storm**)!',
    whyNeeded:
      'Switch cắm Plug-and-Play không cần cấu hình tay mà vẫn nhanh là nhờ tự học bảng MAC; còn STP ngăn không cho nhân viên cắm nhầm dây vòng làm tê liệt toàn bộ mạng công ty trong vài giây.',
    deepExplanation: [
      'Chu trình 3 bước của Switch (Learning -> Forwarding/Flooding):',
      '- Learning: Cứ thấy Frame từ cổng nào đi vào, nhìn **MAC nguồn** và ghi nhớ "MAC này ở cổng đó" vào bảng CAM/MAC Table (giữ khoảng 5 phút).',
      '- Forwarding vs Flooding: Nếu **MAC đích** có trong sổ -> gửi ra ĐÚNG 1 cổng đó. Nếu chưa biết MAC đích -> Flood (gửi ra mọi cổng trừ cổng nguồn).',
      'Thảm họa **Switching Loop & STP**: Nếu 2 Switch nối với nhau bằng 2 sợi dây thành vòng tròn, 1 gói Broadcast sẽ xoay tròn tăng cấp số nhân lên hàng triệu gói/giây làm sập sạch mạng vì Header Layer 2 không có trường đếm nhảy TTL như IP! **STP (Spanning Tree Protocol)** tự động bầu 1 Root Switch và tạm khóa logic một nhánh thừa (Blocking) để thành sơ đồ cây không vòng lặp; khi dây chính đứt, nhánh khóa kia tự mở trong vài giây!',
    ],
    jargonBuster: [
      { term: 'MAC Table (CAM Table)', plain: 'Bảng tra nhớ nhanh của Switch ghép mỗi địa chỉ MAC với số thứ tự cổng cắm vật lý.' },
      { term: 'Flooding', plain: 'Hành động Switch tạm gửi gói tin ra mọi cổng khi nó chưa biết máy nhận đang cắm ở cổng nào.' },
      { term: 'STP (Spanning Tree)', plain: 'Giao thức tự động chặn tạm một nhánh dây dư thừa để mạng LAN nối vòng không bị bão lặp vô tận.' },
    ],
    takeaway: 'Switch tự học bảng MAC để chuyển mạch chính xác; STP khóa các vòng lặp thừa để mạng LAN không bị Broadcast Storm.',
  },
  net_03_05: {
    analogy:
      'Máy bạn muốn gửi dữ liệu tới Gateway `192.168.1.1`. Bạn đã biết **IP** của nó (`192.168.1.1`), nhưng để Switch trong phòng chuyển được gói tin thì Ethernet Frame Tầng 2 lại BẮT BUỘC phải ghi **địa chỉ MAC** của `192.168.1.1`! Vậy làm sao biết MAC? Giao thức **ARP** giống việc bạn đứng giữa văn phòng hét to (Broadcast): **"Ai là `192.168.1.1` thì giơ tay đọc giùm tôi địa chỉ MAC với!"**. Router `192.168.1.1` nghe thấy liền trả lời riêng lại: **"Tôi là `192.168.1.1` đây, MAC của tôi là `AA:BB:CC...`!"**. Máy bạn ghi nhớ vào sổ **ARP Cache**.',
    whyNeeded:
      'ARP là cầu nối bắt buộc giữa Tầng 3 (IP logic) và Tầng 2 (MAC vật lý). Thiếu ARP thì dù biết địa chỉ IP ngay trong phòng vẫn không gửi nổi một gói tin!',
    deepExplanation: [
      'Hai bước của ARP (Address Resolution Protocol):',
      '1. ARP Request (Broadcast): Gửi tới `FF:FF:FF:FF:FF:FF`: "Who has 192.168.1.1? Tell 192.168.1.25". Mọi máy trong LAN đều nhận nhưng chỉ máy có IP khớp mới trả lời.',
      '2. ARP Reply (Unicast): Máy đích đáp trả thẳng vào MAC của người hỏi: "192.168.1.1 is at d4:5d:64:..."',
      'ARP Cache (`arp -a` hoặc `ip neigh`): Lưu cặp `IP -> MAC` trong vài phút để khỏi phải hét hỏi lại mỗi gói tin.',
      'Lỗ hổng bảo mật kinh điển — **ARP Spoofing (Giả mạo ARP)**: Vì ARP không có mật khẩu hay chữ ký kiểm chứng, máy hacker trong cùng quán cà phê Wi-Fi có thể gửi ARP Reply giả liên tục nói dối mọi người: "Tao mới là Router `192.168.1.1`!" -> Toàn bộ lưu lượng của nạn nhân đi qua máy hacker trước khi ra mạng (Man-in-the-Middle)!',
    ],
    jargonBuster: [
      { term: 'ARP', plain: 'Giao thức dịch "Tôi biết IP rồi -> Cho tôi xin địa chỉ MAC tương ứng trong mạng LAN".' },
      { term: 'ARP Cache', plain: 'Bảng bộ nhớ tạm lưu các cặp IP ↔ MAC vừa hỏi được để dùng lại nhanh.' },
      { term: 'ARP Spoofing', plain: 'Trò tấn công trong mạng LAN công cộng bằng cách nhận vơ IP của Router để nghe lén dữ liệu.' },
    ],
    takeaway: 'ARP dịch IP thành MAC bằng cách Broadcast hỏi cả LAN; vì không xác thực nên cần cẩn trọng Wi-Fi công cộng (và luôn dùng HTTPS).',
  },

  // =========================================================================
  // MODULE 04: NETWORK LAYER — IP ADDRESSING & SUBNETTING
  // =========================================================================
  net_04_01: {
    analogy:
      'Một địa chỉ **IPv4** (như `192.168.1.25`) thực chất là một con số nhị phân 32-bit dài ngoằng, được chia làm 4 khúc 8-bit viết sang số thập phân cho dễ nhớ (mỗi số từ `0` đến `255`). Còn phần đầu của mỗi gói IP (**IPv4 Header**, tối thiểu 20 byte) giống như **Mặt trước một chiếc phong bì bưu điện quốc tế**: có IP người gửi, IP người nhận, mã chống đi vòng tròn mãi mãi (**TTL - Hạn sử dụng số bước nhảy**), và báo hiệu bên trong phong bì là TCP hay UDP.',
    whyNeeded:
      'Không hiểu cấu trúc IP Header bạn sẽ không hiểu tại sao lệnh `traceroute` đo được từng chặng đường đi trên Internet, hay làm thế nào Router phân mảnh gói tin nếu qua đường cáp chật hơn.',
    deepExplanation: [
      'Những trường quan trọng nhất trong 20 byte IPv4 Header:',
      '- Version: Số `4` (hoặc `6`).',
      '- Source IP (32-bit) & Destination IP (32-bit): Điểm xuất phát & Điểm đến cuối cùng.',
      '- **TTL (Time To Live - 8-bit)**: Thường khởi tạo là `64` (Linux) hoặc `128` (Windows). Qua mỗi con Router trên đường đi, TTL bị trừ đi `1`! Nếu mạng bị cấu hình lặp vòng, tới khi `TTL == 0` Router lập tức vứt bỏ gói tin và báo lỗi ICMP ngược lại cho người gửi -> đây chính là mẹo mà lệnh `traceroute` dùng để lộ tên mọi Router dọc đường!',
      '- Protocol (8-bit): `6` = bên trong là TCP, `17` = UDP, `1` = ICMP.',
      '- Total Length & Fragmentation Flags: Tổng kích thước gói; nếu cờ `DF (Don\'t Fragment)` bật mà gói quá MTU thì Router từ chối và báo về để giảm kích thước.',
    ],
    jargonBuster: [
      { term: 'IPv4 Address', plain: 'Số 32-bit viết dưới dạng 4 số từ 0–255 cách nhau dấu chấm (tổng ~4.3 tỷ địa chỉ).' },
      { term: 'TTL (Time To Live)', plain: 'Số chặng Router tối đa một gói tin được phép đi qua trước khi bị hủy (chống gói tin bay vòng vô tận).' },
      { term: 'Header Checksum', plain: 'Mã kiểm lỗi bảo vệ phần nhãn IP Header không bị sai lệch bit khi qua các Router.' },
    ],
    takeaway: 'IPv4 Header (20 byte) mang IP nguồn/đích, loại giao thức bên trong (`6=TCP, 17=UDP`), và TTL ngăn gói tin đi lạc vĩnh viễn.',
  },
  net_04_02: {
    analogy:
      'Nhìn vào địa chỉ IP `192.168.1.25` giống như nhìn số điện thoại `028 38123456` — bạn cần biết **khúc nào là Mã Vùng Thành Phố (Network ID)** và **khúc nào là Số Thuê Bao Nhà (Host ID)**! **Subnet Mask** (như `255.255.255.0` hay `/24`) chính là tấm mặt nạ đặt lên trên: chỗ nào là `255` (`11111111`) thì giữ lại làm **Tên Khu Phố**, chỗ nào là `0` thì làm **Số Nhà riêng** bên trong khu phố đó!',
    whyNeeded:
      'Máy tính dựa vào Subnet Mask để quyết định ngay một việc sống còn: "Máy kia là hàng xóm cùng nhà với mình (hỏi thẳng MAC qua ARP rồi gửi luôn!), hay nó ở thành phố khác (phải đưa cho Router Default Gateway mang đi)?".',
    deepExplanation: [
      'Cách tính cực nhanh bằng ví dụ `/24` (`255.255.255.0`):',
      '- IP có 32 bit. `/24` nghĩa là **24 bit đầu (3 số đầu `192.168.1`) là Tên Mạng**, còn lại `32 - 24 = 8` bit cuối cho Số Máy.',
      '- Tổng địa chỉ trong 8 bit là $2^8 = 256$ (từ `.0` tới `.255`), NHƯNG luôn phải trừ 2 địa chỉ đặc biệt: số đầu tiên (`.0` = **Network Address** đại diện tên cả khu mạng) và số cuối cùng (`.255` = **Broadcast Address** gửi chung toàn khu). Vậy còn **$256 - 2 = 254$ máy xài được**!',
      '- Ví dụ `/26`: `32 - 26 = 6` bit cuối -> $2^6 - 2 = 62$ máy xài được!',
      'VLSM (Variable Length Subnet Mask): Thay vì chia mọi phòng bằng nhau, phòng lớn 100 người chia `/25` (126 chỗ), hai con Router nối điểm-điểm nhau chỉ cần 2 IP thì chia `/30` (2 chỗ) hoặc `/31` -> không phí IP!',
    ],
    jargonBuster: [
      { term: 'Subnet Mask', plain: 'Mặt nạ nhị phân phân chia ranh giới phần nào của IP là tên Mạng (Network) và phần nào là số Máy (Host).' },
      { term: 'Network & Broadcast IP', plain: 'Địa chỉ đầu tiên (tên mạng) và cuối cùng (gửi cho cả mạng) của mỗi dải Subnet — không gán cho máy cá nhân.' },
      { term: 'VLSM', plain: 'Chia mạng con với kích thước linh hoạt vừa khít nhu cầu từng phòng/tuyến để không lãng phí IP.' },
    ],
    takeaway: 'Công thức vàng chia mạng: Còn `h` bit cho Host thì có đúng $2^h - 2$ máy dùng được; Subnet Mask quyết định "gửi thẳng hàng xóm" hay "nhờ Router".',
  },
  net_04_03: {
    analogy:
      'Ngày xưa chia IP kiểu cổ điển (**Classful: Class A/B/C**) quá cứng nhắc: hễ công ty có 300 người thì gói Class C (254 chỗ) không đủ -> bắt buộc phải xin gói Class B (65.534 chỗ), thế là lãng phí hơn 65.000 IP bỏ không! **CIDR** dẹp bỏ luôn kiểu chia hạng cứng nhắc đó, thay bằng ký hiệu gọn lẹ **dấu gạch chéo `/N`** (`10.0.0.0/20`) cho phép cắt dải IP với bất kỳ độ dài bit nào, và gộp hàng nghìn đường mạng nhỏ cạnh nhau thành 1 dòng ngắn gọn trong sổ Router (**Route Aggregation**).',
    whyNeeded:
      'Nhờ CIDR mà kho địa chỉ IPv4 4.3 tỷ số không bị cạn kiệt ngay từ thập niên 1990 và sổ tay bảng định tuyến của Router toàn cầu không phình to đến mức nổ RAM.',
    deepExplanation: [
      'Cách đọc ký hiệu CIDR: `A.B.C.D/N` (ví dụ `192.168.10.0/24` hay `10.20.0.0/16`).',
      '- `/16`: 2 số đầu cố định (`10.20.*.*`) -> có $2^{16} = 65.536$ địa chỉ.',
      '- `/24`: 3 số đầu cố định -> 256 địa chỉ (254 máy).',
      '- `/32`: Cố định cả 32 bit -> chỉ đúng **1 IP duy nhất** (hay gặp trong Firewall rule hay Loopback!).',
      '- `0.0.0.0/0` ("Khớp với TẤT CẢ mọi IP"): Chính là dòng **Default Route** — nếu Router không biết IP kia ở đâu thì đẩy qua lối ra mặc định này ra Internet!',
      'Quy tắc tìm đường của Router (**Longest Prefix Match**): Nếu bảng định tuyến có 2 dòng cùng khớp với đích (vd `10.0.0.0/8` và `10.0.1.0/24`), Router LUÔN ưu tiên đường dài hơn, cụ thể hơn (`/24` thắng `/8`)!',
    ],
    jargonBuster: [
      { term: 'CIDR (/N)', plain: 'Cách viết gọn số lượng bit phần Mạng sau dấu gạch chéo (vd /24, /16, /32) thay cho cách viết dài 255.255...' },
      { term: '0.0.0.0/0', plain: 'Ký hiệu đại diện cho "Mọi địa chỉ Internet" (dùng cho Default Gateway hoặc mở Firewall tất cả).' },
      { term: 'Longest Prefix Match', plain: 'Luật vàng của Router: hễ nhiều tuyến cùng khớp đích thì chọn tuyến có /N dài nhất (chi tiết nhất).' },
    ],
    takeaway: 'Nhớ nhanh các mốc CIDR hay dùng nhất: `/32` = 1 IP; `/24` = 256 IP; `/16` = 65k IP; `0.0.0.0/0` = Toàn Internet.',
  },
  net_04_04: {
    analogy:
      '**Public IP** giống **Số điện thoại bàn chính thức của một công ty trên danh bạ quốc gia** (duy nhất trên toàn thế giới, ai ngoài đường cũng gọi thẳng tới được). Còn **Private IP (RFC 1918)** giống **Số máy nhánh nội bộ (`101`, `102`)** bên trong mỗi công ty: công ty bạn ở Hà Nội dùng `192.168.1.5`, công ty tôi ở TP.HCM cũng dùng `192.168.1.5` hoàn toàn không đụng nhau — vì hai dải số nội bộ này KHÔNG BAO GIỜ đi thẳng ra ngoài đường lớn Internet!',
    whyNeeded:
      'Thế giới có hơn 20 tỷ thiết bị nhưng IPv4 chỉ có 4.3 tỷ số! Việc cho hàng tỷ ngôi nhà/công ty dùng chung đi dùng lại các dải Private IP ở bên trong đã cứu sống IPv4 suốt hàng chục năm.',
    deepExplanation: [
      '3 dải **Private IPv4 (RFC 1918)** miễn phí ai cũng tự gán trong mạng nội bộ được:',
      '1. `10.0.0.0/8` (`10.0.0.0` – `10.255.255.255`): ~16.7 triệu IP — tập đoàn lớn & Cloud VPC (AWS, Docker, Kubernetes) rất hay dùng!',
      '2. `172.16.0.0/12` (`172.16.0.0` – `172.31.255.255`): ~1 triệu IP — Docker bridge network mặc định hay dùng `172.17.0.0/16`!',
      '3. `192.168.0.0/16` (`192.168.0.0` – `192.168.255.255`): 65.536 IP — cực quen thuộc trên mọi Router Wi-Fi gia đình!',
      'Các dải đặc biệt phải thuộc lòng:',
      '- **`127.0.0.1` (`127.0.0.0/8` - Loopback / `localhost`)**: Gói tin tự vòng quay lại chính máy tính bạn, KHÔNG BAO GIỜ ra tới card mạng vật lý!',
      '- `169.254.0.0/16` (Link-Local / APIPA): Khi máy tính hỏi xin IP từ Router (DHCP) bị lỗi không ai trả lời, nó tự gán đại số này (và thường là dấu hiệu "Mạng chấm than mất kết nối").',
    ],
    jargonBuster: [
      { term: 'Public vs Private IP', plain: 'Public IP định danh duy nhất trên toàn cầu; Private IP dùng miễn phí lặp lại ở khắp mọi mạng nội bộ.' },
      { term: '127.0.0.1 (localhost)', plain: 'Địa chỉ tự nói chuyện với chính phần mềm đang chạy trên cùng máy tính đó.' },
      { term: 'RFC 1918', plain: 'Văn bản tiêu chuẩn quy định 3 dải IP nội bộ (10.x, 172.16-31.x, 192.168.x) cấm định tuyến trên Internet.' },
    ],
    takeaway: 'Thuộc 3 dải nội bộ (`10.x`, `172.16-31.x`, `192.168.x`) + `127.0.0.1` là bạn đọc hiểu ngay 90% cấu hình mạng và Docker!',
  },
  net_04_05: {
    analogy:
      'IPv4 dài 32-bit chỉ đủ khoảng 4.3 tỷ số — đã hết sạch từ lâu khi mỗi người có điện thoại, laptop, đồng hồ, bóng đèn thông minh! **IPv6** mở rộng lên **128-bit** — tức là nhiều đến mức bạn có thể cấp riêng **hàng tỷ địa chỉ IP cho mỗi hạt cát trên Trái Đất**! Mọi thiết bị có thể lấy thẳng địa chỉ công khai trực tiếp mà chẳng còn phải khổ sở đi qua NAT nữa.',
    whyNeeded:
      'Kho IPv4 đã cạn; các nhà mạng di động 4G/5G và Cloud hiện đại đều triển khai Dual-Stack (chạy song song IPv4 + IPv6) hoặc thuần IPv6 bên trong.',
    deepExplanation: [
      'Cách viết IPv6 (8 nhóm 4 ký tự Hex, ngăn bởi dấu `:`, vd `2001:0db8:0000:0000:0000:ff00:0042:8329`):',
      '- Quy tắc rút gọn cho dễ đọc: Bỏ các số `0` đứng đầu mỗi nhóm, và một dãy toàn số `0` liên tiếp được nén thành đúng 1 cặp dấu `::` -> thành `2001:db8::ff00:42:8329`! Loopback của IPv6 gọn cực kỳ: **`::1`**!',
      'Những nâng cấp cực sướng ở IPv6:',
      '- Không cần Broadcast nữa (thay bằng Multicast tinh gọn hơn, và không dùng ARP nữa mà dùng **NDP - Neighbor Discovery**).',
      '- Header cố định sạch sẽ đúng **40 byte**, bỏ bớt Checksum rườm rà ở Router để Router đẩy gói cực nhanh!',
      '- **SLAAC**: Thiết bị tự cắm vào mạng là tự ghép ra IPv6 hợp lệ ngay từ Router Advertisement mà không nhất thiết phải có máy chủ DHCP.',
    ],
    jargonBuster: [
      { term: 'IPv6 (128-bit)', plain: 'Thế hệ địa chỉ IP mới có 3.4 × 10^38 địa chỉ (gần như vô tận), viết bằng chữ Hex có dấu hai chấm.' },
      { term: '::1', plain: 'Địa chỉ localhost của IPv6 (tương đương 127.0.0.1 của IPv4).' },
      { term: 'Dual-Stack', plain: 'Cấu hình chạy song song cả IPv4 và IPv6 trên cùng máy chủ/mạng để tương thích cả cũ lẫn mới.' },
    ],
    takeaway: 'IPv6 giải quyết triệt để nạn cạn IP bằng không gian 128-bit khổng lồ, header cố định 40 byte siêu gọn và tự động cấu hình.',
  },

  // =========================================================================
  // MODULE 05: ROUTING, ICMP & NAT
  // =========================================================================
  net_05_01: {
    analogy:
      '**Routing (Định tuyến)** là công việc **vẽ tấm bản đồ chỉ đường** chung cho cả mạng lưới (đi đường nào ngắn/ít tắc nhất); còn **Forwarding (Chuyển tiếp)** là hành động cụ thể tại mỗi ngã tư **lái một gói tin đi đúng cái cổng rẽ** theo bản đồ sẵn có! Khi laptop gửi dữ liệu ra Google: nếu IP Google không nằm trong mạng nhà bạn, laptop ném gói tin cho **Default Gateway (Router nhà)** — và trên đường đi, qua mỗi Router, **IP nguồn/đích giữ nguyên, chỉ có vỏ MAC ngoài cùng bị thay đổi ở từng chặng**!',
    whyNeeded:
      'Rất nhiều người mới tưởng qua mỗi Router thì gói tin biến mất hoặc đổi địa chỉ IP đích; hiểu rõ điều gì đổi (MAC) và điều gì giữ nguyên (IP) ở mỗi chặng là nắm được linh hồn Internet.',
    deepExplanation: [
      'Quyết định 2 nhánh ở mọi thiết bị gửi:',
      '1. Kiểm tra `IP_đích` với Subnet Mask của mình: Có cùng mạng LAN không? -> Nếu CÙNG: dùng ARP hỏi thẳng MAC máy đích rồi gửi trực tiếp qua Switch.',
      '2. Nếu KHÁC mạng LAN: Dùng ARP hỏi MAC của **Default Gateway (Router)**, đóng Ethernet Frame ghi MAC đích là **Router**, nhưng bên trong IP đích vẫn ghi là **Google (`142.250...`)**!',
      'Khi gói tin đi xuyên qua 10 con Router tới Google:',
      '- Tại mỗi Router: bóc vỏ Ethernet Frame cũ -> kiểm tra **TTL - 1** -> tra Routing Table bằng **Longest Prefix Match** -> biết cần đẩy ra cổng số mấy -> đóng vỏ Ethernet Frame mới (với MAC nguồn là Router này, MAC đích là Router kế tiếp!) rồi đẩy đi.',
    ],
    jargonBuster: [
      { term: 'Default Gateway', plain: 'Địa chỉ IP của con Router cửa ngõ trong mạng LAN — hễ muốn ra ngoài mạng khác đều gửi qua cửa này.' },
      { term: 'Routing vs Forwarding', plain: 'Routing là lập bản đồ đường đi chung (chậm, thông minh); Forwarding là bốc từng gói đẩy ra đúng cổng (siêu nhanh).' },
      { term: 'Hop', plain: 'Một chặng nhảy từ Router này sang Router kế tiếp trên hành trình tới đích.' },
    ],
    takeaway: 'Xuyên suốt hành trình trên Internet: IP nguồn & đích giữ nguyên qua từng Router (trừ NAT), còn địa chỉ MAC thay đổi mới ở mọi chặng nhảy!',
  },
  net_05_02: {
    analogy:
      '**ICMP** giống như **hệ thống biển báo & nhân viên báo sự cố giao thông** trên cao tốc: Nó không chở hàng hóa của bạn (không chở web hay video), mà chuyên bắn tin nhắn thông báo lỗi hoặc kiểm tra đường: "Đường trước sập rồi không tới đích được!", "Xe chạy quá hạn số trạm `TTL=0` rồi!", hoặc tiếng còi dò đường huyền thoại **`ping` (Echo Request / Echo Reply)**!',
    whyNeeded:
      'IP hoạt động kiểu "gửi đi cầu may" (Best-Effort) và tự nó không biết báo lỗi. ICMP là công cụ chẩn đoán số 1 giúp kỹ sư mạng nhìn xuyên vào điểm tắc/đứt trên mạng.',
    deepExplanation: [
      'ICMP nằm ở tầng Network (chạy ngay bên trên IP, Protocol #1), không dùng số Port như TCP/UDP!',
      'Các thông điệp ICMP gặp hằng ngày:',
      '- **Echo Request & Echo Reply (`ping`)**: Hỏi "Còn sống không?" -> Trả lời "Còn! Mất 15ms cả đi lẫn về!".',
      '- **Destination Unreachable**: Không tìm thấy đường tới mạng/host hoặc bị Firewall từ chối.',
      '- **Time Exceeded (TTL = 0)**: Đã cạn số bước nhảy! Đây chính là phép thuật giúp `traceroute`: lần 1 gửi gói đặt `TTL=1` -> tới Router số 1 hết hạn, Router 1 trả tin báo lộ diện IP của nó -> lần 2 gửi `TTL=2` -> lộ diện Router số 2... cứ thế vẽ ra toàn bộ lộ trình đi tới Google!',
    ],
    jargonBuster: [
      { term: 'ICMP', plain: 'Giao thức gửi thông báo kiểm tra sức khỏe và báo lỗi đường truyền (tạo nên lệnh ping & traceroute).' },
      { term: 'Ping (RTT)', plain: 'Đo thời gian khứ hồi (Round-Trip Time) từ lúc gửi 1 gói ICMP hỏi thăm tới khi nhận hồi âm.' },
      { term: 'Time Exceeded', plain: 'Thông báo của Router khi gói tin bị giảm TTL về 0, giúp traceroute phát hiện từng chặng Router.' },
    ],
    takeaway: 'ICMP là tai mắt chẩn đoán mạng: `ping` (Echo) kiểm tra thông suốt và độ trễ; `traceroute` lợi dụng `TTL=0` để soi từng chặng Router.',
  },
  net_05_03: {
    analogy:
      '**Routing Table (Bảng định tuyến)** chính là **cuốn sổ chỉ đường đặt cạnh người điều phối (Router hoặc máy tính bạn)**: Mỗi dòng ghi: *"Muốn tới Khu phố X -> hãy đi qua Cổng ra Y / Giao cho trạm trung chuyển Z"*. **Static Routing** là chủ nhà tự viết tay từng dòng chỉ đường (đơn giản, không tốn CPU nhưng đứt đường thì không tự đổi được!).',
    whyNeeded:
      'Mọi máy tính Windows, Linux, macOS và mọi Router đều có Routing Table riêng (gõ `ip route` hoặc `route print` là thấy ngay!). Đọc được bảng này là hiểu ngay máy bạn đang đẩy lưu lượng đi ngả nào.',
    deepExplanation: [
      'Các cột trong 1 bảng Routing Table chuẩn (xem bằng lệnh `ip route`):',
      '- Destination Network (CIDR): Mạng đích muốn tới (vd `192.168.1.0/24` hoặc `0.0.0.0/0`).',
      '- Next Hop (Gateway): IP của Router kế tiếp để giao gói (hoặc "Direct / On-link" nếu cùng LAN).',
      '- Interface: Tên card mạng đi ra (`eth0`, `wlan0`, `docker0`).',
      '- Metric / Cost: Độ ưu tiên (số nhỏ hơn thắng) khi có 2 đường tới cùng 1 mạng đích (vd ưu tiên dây Ethernet hơn Wi-Fi!).',
      'Khi cắm 2 mạng cùng lúc (vd vừa cắm mạng LAN công ty vừa nối VPN), hiểu Static Route giúp bạn chỉ định: riêng dải IP server công ty đi qua cổng VPN, còn xem YouTube cứ đi thẳng ra mạng Wi-Fi cho nhanh (**Split Tunneling**)!',
    ],
    jargonBuster: [
      { term: 'Routing Table', plain: 'Bảng chỉ đường lưu danh sách: muốn tới mạng đích nào thì đẩy gói tin ra card mạng / Gateway nào.' },
      { term: 'Next Hop', plain: 'Địa chỉ IP của con Router kế tiếp ngay trước mắt để chuyển gói tin đi thêm 1 chặng.' },
      { term: 'Static Route', plain: 'Tuyến đường được người quản trị gõ cố định bằng tay chứ không tự cập nhật theo biến động mạng.' },
    ],
    takeaway: 'Mọi thiết bị nối mạng đều tra Routing Table trước khi đẩy gói đi; luôn khớp theo **Longest Prefix Match** trước rồi mới xét Metric nhỏ nhất.',
  },
  net_05_04: {
    analogy:
      'Khi Internet có hàng trăm nghìn Router, không ai gõ tay Static Route nổi nữa — các Router tự nói chuyện cập nhật bản đồ cho nhau bằng **Dynamic Routing**: Trong nội bộ **cùng một công ty/tòa nhà (IGP)** dùng **OSPF** (như anh nhân viên siêng năng đi đo xem hành lang nào rộng, hành lang nào đang kẹt để tìm đường nhanh nhất bằng thuật toán Dijkstra!). Còn **giữa các quốc gia/nhà mạng lớn với nhau (EGP)** dùng **BGP** (ngoại giao tin tưởng giữa các tập đoàn: chọn đường dựa trên hợp đồng tiền bạc & chính trị chứ không chỉ nhìn khoảng cách ngắn!).',
    whyNeeded:
      'Hiểu OSPF vs BGP giúp bạn giải thích được tại sao khi một sợi cáp quang biển AA đứt, lưu lượng Việt Nam tự động vòng sang hướng khác trong vài phút mà chẳng ai phải cấu hình lại máy bạn.',
    deepExplanation: [
      '1. **OSPF (Open Shortest Path First — Trong 1 AS/Doanh nghiệp)**: Mỗi Router gửi thông tin về các dây nối quanh nó cho tất cả Router cùng khu vực (`Link-State`), dựng chung 1 bản đồ hoàn chỉnh rồi dùng thuật toán **Dijkstra** tìm đường có tổng Cost nhỏ nhất (băng thông càng to Cost càng nhỏ). Phản ứng cực nhanh khi đứt 1 đường dây nội bộ!',
      '2. **BGP (Border Gateway Protocol — Đường xương sống toàn bộ Internet)**: Giao thức chạy trên TCP port 179 nối các Autonomous System (Viettel, VNPT, Google, Cloudflare) lại với nhau. BGP là **Path-Vector** dựa theo chính sách kinh tế: "Đường này qua ít AS hơn nhưng phải trả tiền trung chuyển -> ưu tiên đi qua đường đối tác miễn phí (Peering) trước!". Nếu kỹ sư cấu hình nhầm BGP (BGP Hijack) có thể làm sập truy cập YouTube/Facebook của cả một quốc gia!',
    ],
    jargonBuster: [
      { term: 'OSPF', plain: 'Giao thức định tuyến tự động bên trong 1 mạng doanh nghiệp/AS, tìm đường nhanh nhất bằng thuật toán Dijkstra.' },
      { term: 'BGP', plain: 'Giao thức keo dán toàn bộ mạng Internet — kết nối các nhà mạng và hãng Cloud khổng lồ với nhau.' },
      { term: 'Peering', plain: 'Thỏa thuận hai nhà mạng nối dây trực tiếp trao đổi lưu lượng miễn phí cho nhau khỏi đi vòng tốn tiền.' },
    ],
    takeaway: 'Nội bộ công ty/Data Center dùng OSPF (nhanh, đo băng thông); ra mạng Internet toàn cầu dùng BGP (nối các nhà mạng theo chính sách).',
  },
  net_05_05: {
    analogy:
      '**NAT / PAT (Network/Port Address Translation)** chính là **bác bảo vệ ngồi ở cổng chính một trường học**: Bên trong trường có 500 học sinh dùng số hiệu nội bộ (`192.168.1.2`, `.3`...), nhưng cả trường chỉ đăng ký **đúng 1 số điện thoại bàn ngoài đời (1 Public IP)**! Khi em An (`.15`) muốn nhắn ra thế giới ở port `51200`, bác bảo vệ đổi địa chỉ người gửi thành **IP chung của trường + Số cổng riêng `#40001`**, ghi sổ: `40001 -> Em An 192.168.1.15:51200`. Khi thế giới trả lời về `#40001`, bác tra sổ đưa lại cho đúng máy em An!',
    whyNeeded:
      'Không có NAT/PAT, mỗi thiết bị trong nhà bạn (điện thoại, TV, laptop, tủ lạnh) phải tốn tiền mua riêng một địa chỉ IPv4 công cộng! Router Wi-Fi ở nhà bạn đang chạy PAT từng mili-giây.',
    deepExplanation: [
      'Cách Router nhà bạn thực hiện PAT (NAPT / IP Masquerading):',
      '- Chiều đi ra (**SNAT**): Đổi Source IP nội bộ `192.168.1.15:51200` thành Public IP của nhà mạng `113.160.x.y:40001` và lưu vào **NAT State Table**.',
      '- Chiều quay về (**DNAT tự động**): Gói từ Google trả về `113.160.x.y:40001` -> Router tra bảng thấy thuộc về `.15:51200` -> sửa ngược lại thành `192.168.1.15:51200` đưa vào LAN.',
      'Tại sao máy ở ngoài Internet KHÔNG tự kết nối ngược vào laptop nhà bạn được? Vì bảng NAT chưa có dòng ghi trước nào cho kết nối lạ từ ngoài! Muốn mở server game/web từ nhà -> phải cài đặt **Port Forwarding (DNAT tĩnh)**; hoặc gọi video Call P2P xuyên NAT phải dùng kỹ thuật **STUN / TURN / ICE (NAT Traversal)**!',
    ],
    jargonBuster: [
      { term: 'NAT / PAT', plain: 'Cơ chế dịch địa chỉ IP nội bộ + Port thành 1 Public IP chung của Router giúp cả nhà dùng chung 1 đường Internet.' },
      { term: 'Port Forwarding', plain: 'Mở cổng cố định trên Router: hễ có người ngoài gọi vào port X thì đưa thẳng vào máy tính cụ thể trong nhà.' },
      { term: 'NAT Traversal (STUN/TURN)', plain: 'Kỹ thuật giúp 2 điện thoại nằm sau Router ở 2 nhà khác nhau kết nối thẳng gọi video cho nhau xuyên qua NAT.' },
    ],
    takeaway: 'NAT/PAT cho cả nghìn máy nội bộ dùng chung 1 Public IP bằng cách ánh xạ Port; chính NAT cũng vô tình làm lá chắn che máy trong LAN khỏi kết nối lạ từ ngoài.',
  },

  // =========================================================================
  // MODULE 06: TRANSPORT LAYER — TCP, UDP & CONGESTION CONTROL
  // =========================================================================
  net_06_01: {
    analogy:
      'Nếu IP đưa thư tới được đúng **cổng Tòa nhà chung cư (Máy tính)**, thì Tầng Transport (TCP/UDP) lo bước cuối cùng là **đưa tận tay từng Cư dân (Phần mềm đang chạy)** bằng **Số Phòng (Port Number)**! Và **Socket** giống như một **ổ cắm điện thoại riêng** gồm cặp 5 thông số `(Protocol, Src IP, Src Port, Dst IP, Dst Port)` để khi có 10 tab Chrome cùng mở tới cùng server `google.com:443`, máy bạn không bao giờ nhầm nội dung tab 1 sang tab 2!',
    whyNeeded:
      'Trên 1 máy tính chỉ có 1 IP, bạn vừa lướt web, vừa mở Zoom, vừa kéo database, vừa chạy SSH. Tầng Transport thực hiện **Multiplexing / Demultiplexing** phân luồng đúng app.',
    deepExplanation: [
      'Phân loại 3 dải số Port (`0` – `65535`):',
      '- **Well-known Ports (`0–1023`)**: Dành cho dịch vụ chuẩn nổi tiếng (22 SSH, 53 DNS, 80 HTTP, 443 HTTPS). Trên Linux thường cần quyền đặc biệt để mở.',
      '- **Registered Ports (`1024–49151`)**: App chuyên dụng & Database (3000 Node/React, 3306 MySQL, 5432 PostgreSQL, 6379 Redis, 8080 HTTP dev).',
      '- **Ephemeral / Dynamic Ports (`49152–65535`)**: Cổng tạm ngẫu nhiên mà OS tự cấp cho trình duyệt Chrome của bạn mỗi lần bạn bấm mở một trang web!',
      'Sự khác biệt Socket UDP vs Socket TCP: UDP chỉ phân biệt dựa vào 2 số `(Dst IP, Dst Port)` (nhiều người gửi cùng vào chung 1 hòm thư của server); còn TCP phân biệt bằng cả **4-tuple `(Src IP, Src Port, Dst IP, Dst Port)`** nên mỗi kết nối có một ống dẫn riêng biệt!',
    ],
    jargonBuster: [
      { term: 'Port (0–65535)', plain: 'Con số định danh ứng dụng đích hoặc kết nối gửi trên một máy tính.' },
      { term: 'Ephemeral Port', plain: 'Số cổng tạm thời ngẫu nhiên mà OS tự cấp cho phía máy khách (Client) mỗi khi mở kết nối ra ngoài.' },
      { term: 'Multiplexing / Demultiplexing', plain: 'Gom dữ liệu nhiều app đi chung 1 dây mạng (Mux) và chia về đúng từng app ở đầu nhận (Demux).' },
    ],
    takeaway: 'IP dẫn đường tới đúng MÁY; Port + Socket (4-tuple) dẫn dữ liệu vào đúng PHẦN MỀM và đúng TAB đang mở.',
  },
  net_06_02: {
    analogy:
      '**UDP** giống như **gửi bưu thiếp không có biên nhận** hoặc **ném từng quả bóng bàn qua hàng rào**: Cứ thế ném sang thật nhanh, không thèm gọi điện bắt tay trước, không đánh số thứ tự, quả nào rơi mất dọc đường thì mất luôn không ném lại! Nghe có vẻ ẩu nhưng với **gọi Video Call / Game bắn súng / DNS**, thà bỏ qua một khung hình bị rớt lúc nãy để xem tiếp khoảnh khắc trực tiếp ngay lúc này còn hơn là khựng đứng hình lại 2 giây để chờ ném lại khung hình cũ!',
    whyNeeded:
      'TCP rất đảm bảo nhưng quá chậm chạp cho các app thời gian thực (Real-time) hoặc câu hỏi ngắn 1 gói (như DNS). UDP giữ độ trễ thấp nhất có thể và cho phép app tự tùy chỉnh luật gửi ở tầng trên (như HTTP/3 QUIC!).',
    deepExplanation: [
      'Cấu trúc UDP Header siêu tối giản chỉ đúng **8 bytes** (gồm: Src Port, Dst Port, Length, Checksum) — nhẹ gấp 2.5 lần TCP Header (20+ bytes)!',
      '4 đặc điểm của UDP:',
      '1. Connectionless: Gửi ngay lập tức, tốn 0ms bắt tay!',
      '2. No Reliability & No Ordering: Gói gửi trước có thể tới sau, rớt giữa đường không tự gửi lại.',
      '3. No Congestion Control: UDP không tự hãm phanh khi nghẽn mạng (nên app tự viết trên UDP phải tự kiểm soát kẻo làm tắc nghẽn mạng).',
      '4. Message-Oriented: Gửi 1 gói 500 byte thì đầu kia nhận trọn vẹn đúng 1 gói 500 byte (khác TCP chỉ là dòng byte liên tục).',
      'Dùng khi nào? DNS (1 hỏi 1 đáp xong ngay), Game Online/WebRTC/Zoom, Streaming, và làm nền tảng cho **QUIC (HTTP/3)**!',
    ],
    jargonBuster: [
      { term: 'UDP', plain: 'Giao thức vận chuyển "bắn và quên" tối giản (8-byte header): nhanh nhất, 0ms bắt tay, không bảo đảm mất gói.' },
      { term: 'Connectionless', plain: 'Không cần thiết lập phiên kết nối trước khi gửi gói dữ liệu đầu tiên.' },
      { term: 'Real-time / Tail Latency', plain: 'Các ứng dụng trực tiếp cần phản hồi tức thì (Video/Game), thà mất 1 chút còn hơn bị khựng trễ.' },
    ],
    takeaway: 'UDP siêu nhẹ (8 byte), 0ms bắt tay, không đảm bảo mất gói — lý tưởng cho DNS, Video Call, Game và làm nền cho HTTP/3 (QUIC).',
  },
  net_06_03: {
    analogy:
      'Trước khi truyền bất kỳ dữ liệu nào qua **TCP**, hai máy phải thực hiện nghi thức **Bắt tay 3 bước (3-Way Handshake)** giống gọi điện thoại chắc chắn nghe rõ cả 2 chiều: Máy A gọi: *"Alo, tôi muốn nói chuyện, số thứ tự của tôi bắt đầu là 100 (`SYN`)"* -> Máy B đáp: *"Ok tôi nghe rõ 100 rồi (`ACK 101`), còn của tôi bắt đầu từ 500 nhé (`SYN`)"* -> Máy A xác nhận: *"Ok tôi nghe rõ 500 của bạn rồi (`ACK 501`), bắt đầu truyền!"*. Còn khi chia tay (**4-Way Teardown**), mỗi bên phải nói lời chào đóng chiều gửi riêng của mình (`FIN -> ACK`, rồi bên kia `FIN -> ACK`).',
    whyNeeded:
      'Hai máy tính phải đồng bộ trước Sequence Number (số thứ tự từng byte) và xác nhận cả chiều đi lẫn chiều về đều thông suốt trước khi gửi dữ liệu.',
    deepExplanation: [
      '3 bước bắt tay TCP (tốn 1 RTT trước khi byte HTTP đầu tiên được gửi đi!):',
      '1. Client -> Server: `SYN` (kèm Initial Sequence Number `ISN = x` ngẫu nhiên để chống giả mạo).',
      '2. Server -> Client: `SYN + ACK` (vừa xác nhận `ack = x + 1`, vừa gửi `ISN = y` của Server).',
      '3. Client -> Server: `ACK` (`ack = y + 1`). Kể từ bước 3 có thể kẹp luôn dữ liệu HTTP request đầu tiên!',
      'Đóng kết nối 4 bước & Bí ẩn `TIME_WAIT`: Khi bên chủ động đóng gửi `FIN` cuối cùng và nhận `ACK`, nó phải giữ trạng thái **`TIME_WAIT` (~60 giây)** trước khi xóa hẳn socket để: (1) Đảm bảo gói `ACK` cuối không bị rơi làm bên kia gửi lại `FIN`, và (2) Chờ các gói tin lạc đường cũ tan biến khỏi mạng để không chui nhầm vào kết nối mới cùng Port!',
    ],
    jargonBuster: [
      { term: '3-Way Handshake', plain: 'Nghi thức 3 gói SYN -> SYN-ACK -> ACK đồng bộ hai bên trước khi truyền dữ liệu TCP.' },
      { term: 'ISN (Sequence Number)', plain: 'Số thứ tự đánh dấu cho từng byte truyền đi trong TCP để ghép đúng thứ tự và phát hiện mất gói.' },
      { term: 'TIME_WAIT', plain: 'Trạng thái chờ an toàn ~60s sau khi đóng TCP để tránh gói tin lạc cũ làm nhiễu kết nối mới.' },
    ],
    takeaway: 'TCP bắt tay 3 bước (SYN / SYN-ACK / ACK) tốn 1 RTT; nắm rõ trạng thái TIME_WAIT và SYN Queue giúp sửa được 90% sự cố kết nối server.',
  },
  net_06_04: {
    analogy:
      'Làm sao TCP đảm bảo **100% không mất 1 byte nào** trên đường Internet đầy ổ gà? TCP đánh số thứ tự cho từng byte (**Sequence Number**). Bên nhận cứ nhận được tới đâu thì gửi biên nhận tới đó (**ACK**: *"Đã nhận đủ tới byte 2000!"*). Để khỏi gửi 1 gói rồi ngồi đợi biên nhận rất chậm, TCP dùng **Sliding Window (Cửa sổ trượt)**: bắn liên tiếp một loạt gói (vd 10 gói một lúc) trong phạm vi sức chứa của bên nhận (**Flow Control - `rwnd`** - không đổ nhanh hơn tốc độ uống của người nhận!). Gói nào quá hạn không thấy ACK -> gửi lại ngay!',
    whyNeeded:
      'Đường mạng luôn có thể làm rơi, làm trễ hoặc đảo lộn thứ tự gói tin. TCP gánh toàn bộ gánh nặng sửa sai đó để lập trình viên làm app ở trên cứ ngỡ đường dây hoàn hảo tuyệt đối!',
    deepExplanation: [
      '1. **Reliability (Độ tin cậy)**: Dùng **Sequence Number + ACK + Retransmission**. Hai cách phát hiện mất gói: (a) **RTO Timeout** (chờ lâu quá không thấy ACK -> gửi lại), và (b) **Fast Retransmit (3 Duplicate ACKs)** — nếu gói #2 bị rớt nhưng gói #3, #4, #5 tới nơi, bên nhận liên tục kêu *"Tôi vẫn đang chờ #2!"* -> nhận đủ 3 tiếng kêu lặp lại đó là bên gửi bắn lại ngay gói #2 mà không cần chờ hết giờ Timeout!',
      '2. **SACK (Selective ACK)**: Báo rõ: "Tôi bị thiếu đúng gói #2, còn #3 #4 #5 tôi giữ giúp rồi nhé!" -> khỏi phải gửi lại thừa #3 #4 #5.',
      '3. **Flow Control (`rwnd` - Receive Window)**: Trong mỗi gói ACK, bên nhận ghi kèm "Bộ đệm RAM của tôi hiện chỉ còn trống 32 KB thôi nhé!". Bên gửi tuyệt đối không bắn quá 32 KB chưa được xác nhận để tránh làm tràn RAM của app nhận đang xử lý chậm!',
    ],
    jargonBuster: [
      { term: 'ACK / Duplicate ACK', plain: 'Biên nhận báo đã nhận tới byte thứ mấy; nhận trùng 3 ACK cùng số là dấu hiệu mất 1 gói ngay chỗ đó.' },
      { term: 'Sliding Window', plain: 'Cho phép gửi nối tiếp nhiều gói cùng lúc mà chưa cần chờ ACK từng gói một, tăng tốc gấp bội.' },
      { term: 'Flow Control (rwnd)', plain: 'Hãm tốc độ gửi để không làm tràn bộ nhớ đệm của máy nhận (tránh gửi nhanh quá người nhận nuốt không kịp).' },
    ],
    takeaway: 'TCP đảm bảo toàn vẹn nhờ Đánh số + ACK + Gửi lại; Sliding Window tăng tốc độ; Flow Control (`rwnd`) bảo vệ máy nhận khỏi ngộp RAM.',
  },
  net_06_05: {
    analogy:
      'Nếu Flow Control (`rwnd`) là xem **người nhận ăn kịp không**, thì **Congestion Control (`cwnd`)** là xem **đường cao tốc Internet ở giữa có đang kẹt xe không**! Nếu thấy mạng thoáng, TCP tự tăng dần số gói bắn ra mỗi nhịp; tới lúc thấy đường bắt đầu rớt gói (tắc ngã tư Router!), **Reno/CUBIC** lập tức đạp phanh giảm tốc độ xuống ngay một nửa để giải tỏa kẹt xe! Còn **Google BBR** thông minh hơn: không đợi tới lúc kẹt làm rớt gói mới phanh, mà chủ động đo **tốc độ ống + độ trễ tối thiểu** để chạy sát mức tối đa mà không gây hàng đợi!',
    whyNeeded:
      'Nếu mọi máy tính đều cố bắn dữ liệu hết tốc lực khi mạng đang tắc, hàng đợi Router tràn ngập -> rớt gói liên tục -> ai cũng gửi lại -> cả Internet đứng hình sập toàn tập (**Congestion Collapse**)!',
    deepExplanation: [
      'Cách hoạt động của Congestion Window (`cwnd`) — Máy gửi giới hạn thực tế = `min(cwnd, rwnd)`:',
      '1. **Slow Start (Khởi động tăng theo hàm mũ)**: Ban đầu thử gửi ít (10 MSS), mỗi RTT tăng gấp đôi (`10 -> 20 -> 40...`) để dò nhanh ngưỡng tối đa của đường truyền.',
      '2. **Congestion Avoidance**: Khi chạm ngưỡng nghi tắc (`ssthresh`), chuyển sang tăng từ từ từng chút một (`+1` mỗi RTT).',
      '3. **Loss Reaction (Phản ứng khi tắc)**: Khi thấy 3 Duplicate ACKs (mất nhẹ) -> giảm `cwnd` xuống còn một nửa (**CUBIC** trên Linux giảm còn 0.7 rồi tăng lại theo hàm bậc 3 cực mượt cho mạng tốc độ cao!). Khi RTO Timeout (tắc nặng!) -> tụt thẳng `cwnd` về `1 MSS`!',
      '4. **Google BBR**: Thay vì coi Mất gói = Tắc mạng (vì Wi-Fi có thể mất gói do nhiễu sóng chứ không phải do tắc!), BBR liên tục ước lượng **BDP (Bandwidth × MinRTT)** để giữ đường ống vừa đầy đủ mà hàng đợi Router gần như rỗng -> giảm giật lag cực mạnh!',
    ],
    jargonBuster: [
      { term: 'Congestion Control (cwnd)', plain: 'Cơ chế TCP tự dò và hãm tốc độ gửi để không làm kẹt hàng đợi của các Router trên đường đi.' },
      { term: 'Slow Start', plain: 'Giai đoạn khởi đầu của kết nối TCP tăng tốc độ gửi gấp đôi sau mỗi vòng khứ hồi để nhanh chóng tìm giới hạn đường.' },
      { term: 'CUBIC & BBR', plain: 'Hai thuật toán kiểm soát nghẽn phổ biến nhất trên Linux hiện nay (BBR của Google giảm lag rất tốt trên Wi-Fi/4G).' },
    ],
    takeaway: 'Flow Control bảo vệ máy nhận; Congestion Control (`CUBIC` / `BBR`) bảo vệ đường mạng khỏi kẹt xe tập thể.',
  },

  // =========================================================================
  // MODULE 07: APPLICATION LAYER PROTOCOLS
  // =========================================================================
  net_07_01: {
    analogy:
      'Máy tính chỉ hiểu địa chỉ số như `142.250.190.46`, nhưng con người không thể nhớ nổi số của 100 trang web -> nên có tên miền `google.com`. **DNS (Domain Name System)** chính là **Cuốn Danh Bạ Toàn Cầu**: bạn gõ `google.com`, máy bạn tra nhanh trí nhớ của trình duyệt/OS trước; không có thì hỏi bộ giải mã của nhà mạng (**Recursive Resolver**) -> ông này đi hỏi dần từ **Root (`.`)** -> tới **`.com` (TLD)** -> tới **Máy chủ quản lý của Google (Authoritative)** lấy đúng dãy IP trả về cho bạn!',
    whyNeeded:
      'Mọi thao tác lướt web, gọi API, gửi mail đều phải chạy qua DNS đầu tiên! DNS mà chết thì dù cả hạ tầng mạng thông suốt, người dùng vẫn thấy "Không vào được trang web nào".',
    deepExplanation: [
      'Chuỗi tra cứu DNS đầy đủ từ con số 0:',
      '1. Browser Cache -> OS Cache -> File `hosts` trên máy bạn. (Có sẵn thì xong ngay trong 0ms!).',
      '2. Không có -> Hỏi **Recursive Resolver** (như `8.8.8.8` của Google hoặc `1.1.1.1` của Cloudflare) qua UDP Port `53`.',
      '3. Resolver hỏi theo cây phân cấp nếu chưa cache: **Root Server (`.`)** ("Hỏi máy chủ `.com` xem") -> **TLD Server (`.com`)** ("Hỏi `ns1.google.com` xem") -> **Authoritative Server (`google.com`)** trả lời chính xác IP + thời hạn được phép nhớ đệm (**TTL**, vd 300 giây)!',
      'Các loại bản ghi (DNS Records) bắt buộc phải biết: **`A`** (Tên -> IPv4), **`AAAA`** (Tên -> IPv6), **`CNAME`** (Tên bí danh trỏ sang 1 tên miền khác), **`MX`** (Server nhận Email), **`TXT`** (Chuỗi xác minh chủ sở hữu / SPF chống mail giả).',
    ],
    jargonBuster: [
      { term: 'DNS', plain: 'Hệ thống danh bạ dịch tên miền dễ nhớ (google.com) thành địa chỉ IP máy tính cần.' },
      { term: 'Record A / CNAME / MX', plain: 'A trỏ tên miền ra IPv4; CNAME trỏ sang tên miền khác; MX chỉ định máy chủ nhận Email.' },
      { term: 'DNS TTL', plain: 'Số giây các máy được phép lưu nhớ kết quả DNS vừa hỏi trước khi phải đi hỏi lại bản mới.' },
    ],
    takeaway: 'DNS là danh bạ phân cấp toàn cầu (dùng UDP/53); nhớ 4 bản ghi chính: A (IPv4), AAAA (IPv6), CNAME (trỏ tên), TXT (xác thực).',
  },
  net_07_02: {
    analogy:
      '**HTTP** là ngôn ngữ hỏi–đáp chuẩn trên Web giữa Trình duyệt (Client) và Máy chủ (Server): bạn gửi một **Request** (phương thức `GET` xin xem trang, `POST` gửi dữ liệu form mới, `PUT`/`PATCH` sửa, `DELETE` xóa) và Server trả về **Response** kèm mã số trạng thái (**Status Code**: `200 OK`, `404 Không tìm thấy`, `500 Lỗi Server`)! Từ **HTTP/1.1** gửi tuần tự dễ tắc đầu hàng -> nâng cấp lên **HTTP/2** cho phép tách nhiều luồng song song chạy trên cùng 1 đường ống TCP duy nhất (**Multiplexing**)!',
    whyNeeded:
      'Mọi website, app điện thoại iOS/Android và Backend API (REST) ngày nay đều giao tiếp bằng HTTP.',
    deepExplanation: [
      'Cấu trúc một HTTP Request / Response: Start-line (`GET /api/cars HTTP/1.1` hoặc `200 OK`) + Headers (`Authorization`, `Content-Type: application/json`, `Cache-Control`) + Body dữ liệu (JSON/HTML).',
      'Bảng Status Code bắt buộc thuộc: **`2xx`** Thành công (`200 OK`, `201 Created`), **`3xx`** Chuyển hướng (`301`/`302 Redirect`, `304 Not Modified`), **`4xx`** Lỗi do người gọi (`400 Bad Request`, `401 Chưa đăng nhập`, `403 Cấm quyền`, `404 Không có`), **`5xx`** Lỗi tại Server (`500 Internal Error`, `502/504 Gateway`).',
      'Tiến hóa HTTP/1.1 -> HTTP/2: Ở HTTP/1.1 trên cùng 1 kết nối TCP, tải xong ảnh 1 mới tới ảnh 2 (**Application Head-of-Line Blocking**) nên trình duyệt phải mở tới 6 kết nối TCP song song! **HTTP/2** đổi sang khung nhị phân, nén Header (`HPACK`) và **Multiplexing**: tải 50 file JS/CSS/Ảnh xen kẽ nhau trên ĐÚNG 1 kết nối TCP!',
    ],
    jargonBuster: [
      { term: 'HTTP Methods & Status', plain: 'Methods (GET/POST/PUT/DELETE) nói muốn làm gì; Status Code (2xx/4xx/5xx) báo kết quả thành công hay lỗi ở ai.' },
      { term: 'REST API', plain: 'Phong cách thiết kế API sạch dùng URL đại diện tài nguyên (/users/1) và HTTP method để thao tác.' },
      { term: 'HTTP/2 Multiplexing', plain: 'Gửi/nhận hàng chục file ảnh, CSS, API xen kẽ nhau cùng lúc trên duy nhất 1 kết nối TCP.' },
    ],
    takeaway: 'HTTP là chuẩn giao tiếp Request/Response Stateless; HTTP/2 tăng tốc vượt bậc nhờ Multiplexing nhiều luồng trên 1 TCP.',
  },
  net_07_03: {
    analogy:
      'HTTP/2 dù ghép nhiều luồng rất giỏi nhưng vẫn chạy trên nền TCP — hễ rớt 1 gói tin của file ảnh A là toàn bộ TCP khựng lại kéo theo file B, C đứng chờ theo (**TCP HoL Blocking**), cộng thêm bắt tay TCP + TLS mất tới 2–3 vòng đi về! **HTTP/3 (chạy trên QUIC / UDP)** phá bỏ luôn TCP: tự xây cơ chế chống mất gói riêng trên nền **UDP**, gộp luôn bắt tay bảo mật TLS 1.3 thành **1–0 RTT**, và độc lập từng luồng — mất gói của ảnh A thì ảnh B cứ thế chạy tiếp phà phà! Thậm chí bạn chuyển từ Wi-Fi sang 4G trên iPhone cũng KHÔNG bị rớt kết nối (**Connection Migration**)!',
    whyNeeded:
      'Trên mạng di động 4G/5G và Wi-Fi hay đổi trạm phát sóng và hay rớt gói nhẹ, HTTP/3 + QUIC đem lại tốc độ tải trang và xem video YouTube nhanh hơn rõ rệt.',
    deepExplanation: [
      'HTTPS là HTTP bọc thêm lớp mã hóa **TLS** chống nghe lén và giả mạo.',
      'Tại sao phải sinh ra **QUIC (HTTP/3)** trên nền UDP port `443`?',
      '1. Bỏ TCP Head-of-Line Blocking: Mỗi Stream trong QUIC độc lập hoàn toàn với nhau khi rớt gói.',
      '2. Kết nối siêu nhanh (1-RTT hoặc **0-RTT** với server đã từng gặp): Gộp bắt tay vận chuyển và bắt tay mã hóa TLS 1.3 làm một!',
      '3. **Connection Migration**: TCP nhận diện kết nối bằng IP máy bạn -> từ nhà dùng Wi-Fi bước ra cửa nhảy sang 4G bị đổi IP -> mọi kết nối TCP cũ đứt phựt hết! QUIC nhận diện bằng một **Connection ID** riêng nên chuyển Wi-Fi <-> 4G mượt không gián đoạn!',
    ],
    jargonBuster: [
      { term: 'HTTPS', plain: 'HTTP chạy bên trong đường hầm mã hóa TLS, bảo vệ mật khẩu và dữ liệu khỏi bị nghe lén dọc đường.' },
      { term: 'QUIC (HTTP/3)', plain: 'Giao thức vận chuyển thế hệ mới chạy trên UDP, tích hợp sẵn TLS 1.3 và giải quyết dứt điểm lỗi nghẽn dây chuyền của TCP.' },
      { term: 'Connection Migration', plain: 'Khả năng giữ nguyên phiên tải/video của QUIC dù điện thoại đổi IP khi chuyển giữa Wi-Fi và 4G/5G.' },
    ],
    takeaway: 'HTTP/3 (QUIC trên UDP) là tương lai của Web: vào web nhanh hơn (1-RTT/0-RTT), không nghẽn chéo luồng và chuyển Wi-Fi <-> 4G không đứt kết nối.',
  },
  net_07_04: {
    analogy:
      'Ba giao thức nền âm thầm phục vụ mỗi ngày: **DHCP** giống nhân viên phát phòng khách sạn tự động ("Xin chào máy mới vào Wi-Fi! Số phòng của bạn là `192.168.1.42`, Subnet `/24`, cổng ra là `.1`, danh bạ DNS là `8.8.8.8`, hạn thuê 24 giờ!"). **SMTP** là bưu tá chuyên **Gửi đi** Email, còn **IMAP** là hòm thư thông minh cho bạn đọc đồng bộ Email trên cả laptop lẫn iPhone.',
    whyNeeded:
      'Nếu không có DHCP, mỗi lần vào quán cà phê bạn phải mở Settings gõ tay IP, Subnet Mask, Gateway và DNS mới vào mạng được!',
    deepExplanation: [
      '4 bước xin IP tự động **DHCP (DORA — chạy trên UDP port 67/68)**:',
      '1. **D**iscover (Broadcast): Máy mới hét lên: "Có bác DHCP Server nào ở đây cấp cho tôi cái IP không?".',
      '2. **O**ffer: Router chào giá: "Tôi có số `192.168.1.42` đây, lấy không?".',
      '3. **R**equest (Broadcast): "Ok chốt cho tôi xin số `.42` đó!".',
      '4. **A**cknowledge: Router đóng dấu cấp sổ: "Xác nhận của bạn, kèm DNS & Gateway!".',
      'Email Stack: App gửi mail đẩy lên máy chủ bằng **SMTP** (port 587/465); máy chủ dùng DNS bản ghi **MX** tìm máy chủ nhận của đối phương đẩy sang cũng bằng **SMTP**; người nhận mở app Mail đọc về bằng **IMAP** (port 993 - đồng bộ nhiều thiết bị) hoặc **POP3** (cũ, tải về máy rồi xóa trên server).',
    ],
    jargonBuster: [
      { term: 'DHCP (DORA)', plain: 'Quy trình 4 bước (Discover-Offer-Request-Ack) tự động cấp IP, Gateway, DNS cho máy mới vào mạng.' },
      { term: 'DHCP Lease Time', plain: 'Thời hạn tạm mượn địa chỉ IP; hết nửa hạn máy tự gia hạn tiếp, tắt máy lâu Router lấy số đó cấp cho người khác.' },
      { term: 'SMTP vs IMAP', plain: 'SMTP dùng để gửi/chuyển phát Email đi; IMAP dùng để xem và đồng bộ hộp thư đến trên nhiều thiết bị.' },
    ],
    takeaway: 'Cắm dây/bắt Wi-Fi là chạy DHCP (DORA) lấy IP + Gateway + DNS; gửi thư dùng SMTP, nhận đồng bộ trên nhiều máy dùng IMAP.',
  },
  net_07_05: {
    analogy:
      '**SSH (Port 22)** giống như chiếc **chìa khóa điều khiển từ xa được bọc thép mã hóa**: giúp bạn ngồi ở quán cà phê Việt Nam mở màn hình dòng lệnh điều khiển trực tiếp một Server Linux đặt tận Singapore an toàn tuyệt đối! Còn **WebSocket** giống như từ **nhắn tin gửi từng lá thư rời rạc (HTTP thông thường)** chuyển sang **mở sẵn một cuộc gọi điện thoại hai chiều thông suốt** — hễ Server có giá chứng khoán hoặc tin nhắn chat mới là đẩy thẳng xuống trình duyệt ngay lập tức (`Server Push`) chứ trình duyệt không cần hỏi đi hỏi lại!',
    whyNeeded:
      'Mọi kỹ sư quản trị Server đều sống bằng SSH mỗi ngày; và mọi ứng dụng Realtime (Chat, Game web, Chứng khoán, Bảng giá trực tiếp) đều cần WebSocket.',
    deepExplanation: [
      '**SSH (Secure Shell - TCP Port 22)**: Mã hóa toàn bộ lệnh gõ và kết quả màn hình. Đăng nhập an toàn nhất dùng **Public-Private Keypair**: bạn giữ Private Key bí mật tuyệt đối trên máy mình, dán Public Key lên `~/.ssh/authorized_keys` trên server — không cần gõ mật khẩu, chống dò pass Brute-force! Còn dùng làm **SSH Tunnel** để chui an toàn vào Database nội bộ.',
      '**WebSocket (`ws://` / `wss://`)**: Khởi đầu bằng đúng 1 gói HTTP GET có header `Upgrade: websocket` (`101 Switching Protocols`). Sau khi server gật đầu, chính kết nối TCP đó được nâng cấp thành đường ống **Full-Duplex** gửi hai chiều tự do với frame header siêu nhỏ chỉ 2 byte!',
    ],
    jargonBuster: [
      { term: 'SSH (Port 22)', plain: 'Giao thức điều khiển dòng lệnh từ xa và truyền file bảo mật (SCP/SFTP) qua đường hầm mã hóa.' },
      { term: 'SSH Keypair', plain: 'Cặp khóa Công khai (đặt trên Server) & Khóa Bí mật (giữ trên máy mình) để đăng nhập không cần mật khẩu cực an toàn.' },
      { term: 'WebSocket (Full-Duplex)', plain: 'Kênh kết nối liên tục 2 chiều trên Web, cho phép Server chủ động bắn dữ liệu xuống Client bất kỳ lúc nào.' },
    ],
    takeaway: 'Điều khiển Server từ xa an toàn bằng SSH Key; làm Chat/Realtime trên Web thì nâng cấp HTTP sang WebSocket.',
  },
};

export const NET_BEGINNER_GUIDES: Record<string, BeginnerTopicGuide> = {
  ...NET_BEGINNER_GUIDES_PART1,
  ...NET_BEGINNER_GUIDES_PART2,
};
