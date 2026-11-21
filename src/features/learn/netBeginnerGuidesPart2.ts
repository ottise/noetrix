import type { BeginnerTopicGuide } from './osBeginnerGuides';

export const NET_BEGINNER_GUIDES_PART2: Record<string, BeginnerTopicGuide> = {
  // =========================================================================
  // MODULE 08: NETWORK DEVICES & INFRASTRUCTURE
  // =========================================================================
  net_08_01: {
    analogy:
      'Tưởng tượng hệ thống giao thông một tập đoàn lớn: **Switch (L2)** là bảng phân làn **bên trong sân nội bộ tòa nhà** (nhận biết nhau qua MAC để đưa gói tới đúng máy cùng LAN). **Router (L3)** là **trạm thu phí ở cổng biên giới** nối tòa nhà ra quốc lộ Internet (đọc IP để dẫn đường xuyên mạng). **Default Gateway** là chính con Router đứng ngay cửa ngõ bạn nhìn thấy đầu tiên khi muốn bước chân ra ngoài vùng Subnet của mình.',
    whyNeeded:
      'Phân biệt chính xác L2 Switch, L3 Switch, Router và Gateway giúp bạn thiết kế mạng văn phòng không bị sập hoặc nghẽn cổng ra ngoài.',
    deepExplanation: [
      '1. Layer-2 Switch: Làm việc bằng MAC Table, mỗi cổng nằm trong cùng 1 mạng LAN (Collision Domain riêng cho từng dây, nhưng chung 1 Broadcast Domain).',
      '2. Router (Layer-3): Nối các Broadcast Domain khác nhau lại, chạy Routing Table / NAT / Firewall. Chặn Broadcast.',
      '3. Layer-3 Switch: Một thiết bị lai phần cứng siêu tốc vừa làm Switch trong LAN vừa định tuyến IP giữa các VLAN nội bộ công ty bằng chip ASIC tốc độ hàng chục Gbps!',
      '4. Application Gateway: Thiết bị/phần mềm đứng ở Tầng 7 phiên dịch hai giao thức khác nhau (ví dụ API Gateway dịch HTTP JSON bên ngoài thành gRPC nội bộ).',
    ],
    jargonBuster: [
      { term: 'L2 Switch vs L3 Router', plain: 'L2 Switch chuyển mạch theo MAC trong cùng LAN; L3 Router dẫn đường theo IP giữa các mạng khác nhau.' },
      { term: 'Gateway', plain: 'Điểm cửa ngõ nối hai mạng (hoặc hai giao thức) khác nhau.' },
      { term: 'ASIC Forwarding', plain: 'Chuyển gói tin bằng mạch điện tử chuyên dụng thay vì CPU phần mềm nên đạt tốc độ siêu nhanh.' },
    ],
    takeaway: 'Cùng LAN dùng L2 Switch (MAC); khác LAN / nối VLAN dùng Router hoặc L3 Switch (IP); cửa thoát mặc định là Default Gateway.',
  },
  net_08_02: {
    analogy:
      'Bảo vệ cổng (**Firewall**) có 3 cấp độ khôn ngoan: **Stateless ACL** giống ông bảo vệ mù quáng chỉ nhìn danh sách cấm từng lượt rời rạc ("Cấm IP ngoài gọi port 22", nhưng lại quên mất người bên trong vừa gọi ra ngoài cần cho người ta trả lời về!). **Stateful Firewall** thông minh nhớ được trạng thái hội thoại ("À, hồi nãy máy trong nhà chủ động gọi ra Google, vậy giờ cho phép gói trả lời từ Google đi vào!"). Còn **NGFW (Next-Gen Firewall)** mở luôn ruột gói tin Tầng 7 soi xem có chữ SQL Injection hay virus ẩn bên trong hay không!',
    whyNeeded:
      'Mở một máy chủ lên Internet mà không bật Firewall, chỉ sau vài phút hàng trăm bot tự động toàn cầu sẽ quét port 22/3306 thử dò mật khẩu ngay lập tức!',
    deepExplanation: [
      '1. **Stateless Packet Filter**: Kiểm tra từng gói độc lập dựa vào 5-tuple `(Src IP, Dst IP, Proto, Src Port, Dst Port)`. Nhanh nhưng không hiểu bối cảnh kết nối (dễ bị lừa hoặc khó viết luật cho chiều về).',
      '2. **Stateful Inspection Firewall** (như `iptables conntrack`, `nftables`, `pf`, Security Group trên AWS): Giữ một **Connection State Table** (`NEW`, `ESTABLISHED`, `RELATED`). Chỉ cần cho phép chiều đi ra (`OUTBOUND`), chiều trả về tương ứng của chính kết nối đó (`ESTABLISHED`) tự động được thông qua — còn kết nối lạ từ ngoài tự gọi vào (`NEW`) bị chặn đứng!',
      '3. **WAF / NGFW (Layer 7)**: Chặn tấn công ứng dụng web (XSS, SQLi, Path Traversal) và kiểm tra tên miền HTTPS (SNI).',
    ],
    jargonBuster: [
      { term: 'Stateful Firewall', plain: 'Tường lửa nhớ trạng thái phiên kết nối: tự cho phép luồng trả lời của các kết nối hợp lệ do máy mình mở ra.' },
      { term: 'Default Deny', plain: 'Nguyên tắc vàng cài tường lửa: mặc định CẤM HẾT mọi cổng, chỉ mở đúng cổng nào thật sự cần (như 80/443).' },
      { term: 'WAF', plain: 'Web Application Firewall — tường lửa tầng 7 soi nội dung HTTP để chặn SQL Injection, XSS.' },
    ],
    takeaway: 'Luôn cấu hình tường lửa theo nguyên tắc **Default Deny** (chỉ mở port cần thiết) và dùng **Stateful Firewall** cho cả cloud lẫn server.',
  },
  net_08_03: {
    analogy:
      'Khi website đông khách, 1 máy chủ (1 anh đầu bếp) không nấu kịp -> bạn thuê 5 máy chủ đặt sau một **Anh Điều Phối Sảnh (Load Balancer)**! Người dùng chỉ biết mỗi địa chỉ của Anh Điều Phối, còn anh ta âm thầm chia đều khách sang 5 máy chủ (`Round Robin`, hay gửi cho máy đang vắng nhất `Least Connections`), đồng thời cứ 5 giây lại hỏi thăm (**Health Check**): "Máy #3 còn sống không?" -> Máy #3 chết thì lập tức gạch tên khỏi danh sách để khách không bao giờ gặp lỗi trang trắng!',
    whyNeeded:
      'Load Balancer đem lại 2 thứ sống còn cho mọi hệ thống lớn: **High Availability** (1 server sập thì khách không hề biết) và **Horizontal Scaling** (đông khách thì cắm thêm máy ngang vào).',
    deepExplanation: [
      'Phân biệt 2 loại Load Balancer:',
      '- **L4 Load Balancer** (Transport Layer - như AWS NLB, HAProxy TCP mode): Chỉ nhìn `IP + Port`, chuyển thẳng luồng TCP xuống backend mà **không thèm giải mã HTTPS**! Độ trễ siêu thấp (hàng triệu request/giây), thích hợp cho Game, Database, MQTT, WebSocket.',
      '- **L7 Load Balancer** (Application Layer - như Nginx, AWS ALB, Envoy): Giải mã TLS (SSL Termination), đọc được URL `/api/users` vs `/images/logo.png` hay Cookie -> có thể điều hướng `/api/*` sang cụm server Backend, `/static/*` sang cụm CDN/Storage!',
      'Thuật toán chia tải phổ biến: Round Robin (chia đều lần lượt), Weighted Round Robin (máy to gánh nhiều hơn), Least Connections (ai rảnh nhất nhận việc), IP Hash (cùng 1 khách về 1 máy).',
    ],
    jargonBuster: [
      { term: 'Load Balancer', plain: 'Bộ cân bằng tải chia đều lượng truy cập sang nhiều server backend để vừa nhanh vừa chống sập.' },
      { term: 'Health Check', plain: 'Cơ chế kiểm tra sức khỏe định kỳ giúp LB tự động ngắt server bị treo ra khỏi vòng phục vụ.' },
      { term: 'L4 vs L7 LB', plain: 'L4 chỉ nhìn IP/Port (siêu nhanh); L7 đọc được URL/Header HTTP (định tuyến thông minh, kết thúc TLS).' },
    ],
    takeaway: 'Cần tốc độ tối đa không cần đọc URL chọn L4 LB; cần chia tuyến theo `/api`, giải mã HTTPS và WAF chọn L7 LB.',
  },
  net_08_04: {
    analogy:
      'Hai người đại diện đứng ở hai đầu chiến tuyến: **Forward Proxy (Ủy quyền cho Client)** giống như bạn nhờ **Anh Trợ Lý đi mua đồ hộ** — cửa hàng ngoài kia chỉ thấy mặt Anh Trợ Lý (giấu danh tính của bạn, hoặc công ty dùng để chặn nhân viên vào Facebook!). Ngược lại, **Reverse Proxy (Ủy quyền cho Server)** giống như **Cô Lễ Tân đứng trước 10 phòng làm việc của công ty (Server Backend)** — khách hàng chỉ nói chuyện với Cô Lễ Tân (Nginx/Cloudflare), không bao giờ biết đằng sau cô ấy có bao nhiêu server thật đang chạy ở đâu!',
    whyNeeded:
      'Hầu như mọi Backend trên Internet không bao giờ phơi thẳng app Node/Java/Python ra cổng 80/443 mà luôn đặt một **Reverse Proxy** (như Nginx, Caddy, Cloudflare) chắn phía trước.',
    deepExplanation: [
      'Nhiệm vụ vàng của **Reverse Proxy** (Nginx / Caddy / Envoy):',
      '1. TLS Termination: Đứng ra giữ chứng chỉ HTTPS và giải mã giúp dàn backend bên trong đỡ tốn CPU.',
      '2. Caching & Compression: Nhớ sẵn ảnh/trang tĩnh (Cache) và nén Gzip/Brotli cho khách tải nhanh hơn.',
      '3. Security & Hide Topology: Che giấu IP thật của các máy chủ Backend; chặn bớt request rác (Rate Limiting).',
      '4. **API Gateway**: Là một Reverse Proxy siêu nâng cấp cho Microservices — kiêm luôn kiểm tra JWT Token đăng nhập, giới hạn lượt gọi theo từng API key, biến đổi định dạng request.',
    ],
    jargonBuster: [
      { term: 'Forward Proxy', plain: 'Máy chủ đứng thay mặt người dùng đi ra ngoài mạng lấy dữ liệu về (bảo vệ/kiểm soát phía Client).' },
      { term: 'Reverse Proxy', plain: 'Máy chủ đứng chắn phía trước mặt cụm Backend Server (như Nginx/Cloudflare), tiếp nhận request giúp Server.' },
      { term: 'TLS Termination', plain: 'Việc Reverse Proxy tự giải mã HTTPS ở cổng ngoài rồi chuyển dữ liệu sạch vào các server nội bộ.' },
    ],
    takeaway: 'Forward Proxy đại diện cho Client; Reverse Proxy đại diện đứng chắn trước Server (Nginx/Cloudflare là ví dụ điển hình nhất).',
  },
  net_08_05: {
    analogy:
      'Làm sao kỹ sư mạng bắt được gói tin đang chạy trên dây để phân tích lỗi mà không làm chậm mạng chính? Họ dùng **Port Mirroring (SPAN)** (Switch tự copy âm thầm bản sao mọi gói tin ở cổng số 1 đưa ra cổng số 8 nơi cắm máy phân tích Wireshark) hoặc **Network Tap** (chẻ tín hiệu quang vật lý bằng gương bán mạ!). Còn **Bastion Host (Jump Box)** giống một **phòng cách ly an toàn duy nhất được mở cửa ra ngoài** để kỹ sư SSH vào đó rồi mới đi tiếp vào các máy chủ Database khóa kín bên trong.',
    whyNeeded:
      'Database và Server chứa dữ liệu khách hàng tuyệt đối không được mở cổng SSH 22 thẳng ra Internet! Bastion Host và kỹ thuật bắt gói thụ động là chuẩn an ninh hạ tầng công ty.',
    deepExplanation: [
      'Network Tap vs SPAN (Port Mirroring):',
      '- Hardware TAP: Cắm nối tiếp vật lý trên sợi cáp -> sao chép 100% gói tin (kể cả gói lỗi vật lý) với 0% độ trễ, không thể bị hack ngược.',
      '- SPAN (Port Mirroring): Cấu hình bằng phần mềm trên Switch -> tiện, miễn phí nhưng khi Switch quá tải có thể bỏ bớt gói copy.',
      '**Bastion Host (Jump Server)**: Đặt 1 máy chủ tối giản duy nhất ở vùng **DMZ** (vùng đệm) có Public IP, bật bảo mật tối đa (chỉ nhận SSH key, tắt mật khẩu, cài MFA, ghi lại mọi phím gõ). Toàn bộ cụm Database/Backend nằm ở **Private Subnet** (không có Public IP!) chỉ cho phép SSH đi từ IP của con Bastion này!',
    ],
    jargonBuster: [
      { term: 'Bastion Host / Jump Box', plain: 'Máy chủ trạm trung chuyển kiên cố duy nhất mở SSH ra ngoài để từ đó bước an toàn vào mạng nội bộ kín.' },
      { term: 'Port Mirroring (SPAN)', plain: 'Tính năng của Switch nhân bản toàn bộ gói tin đi qua một cổng sang cổng khác để máy kỹ sư phân tích.' },
      { term: 'DMZ', plain: 'Vùng mạng đệm trung gian nằm giữa Internet nguy hiểm và mạng nội bộ tuyệt mật của công ty.' },
    ],
    takeaway: 'Không bao giờ mở thẳng cổng quản trị Database ra Internet — luôn đi qua Bastion Host (hoặc Zero-Trust VPN).',
  },

  // =========================================================================
  // MODULE 09: WIRELESS & MOBILE NETWORKS
  // =========================================================================
  net_09_01: {
    analogy:
      'Các thế hệ **Wi-Fi (802.11)** nâng cấp giống mở rộng đường cao tốc trên không: **Wi-Fi 4/5 (ac)** chạy băng tần 5 GHz khá thoáng; **Wi-Fi 6 (ax)** học lỏm kỹ thuật từ 4G/5G (**OFDMA**) chia 1 chuyến xe lớn thành nhiều ngăn nhỏ phục vụ đồng thời 10 điện thoại trong quán cà phê khỏi phải xếp hàng chờ nhau! **Wi-Fi 6E / Wi-Fi 7 (be)** mở hẳn làn đường cao tốc mới tinh **6 GHz** siêu rộng (kênh 320 MHz) không hề bị nhiễu bởi lò vi sóng hay Wi-Fi nhà hàng xóm!',
    whyNeeded:
      'Trong nhà chung cư hoặc văn phòng đông người, rớt mạng Wi-Fi thường không phải tại nhà mạng mà tại nhiễu sóng chồng kênh ở băng tần 2.4 GHz quá chật chội.',
    deepExplanation: [
      'So sánh 3 băng tần sóng vô tuyến Wi-Fi:',
      '- **2.4 GHz**: Sóng dài -> **xuyên tường tốt, đi xa**, NHƯNG chỉ có **3 kênh không chồng lấn (1, 6, 11)** -> cực dễ nhiễu với hàng xóm, Bluetooth, lò vi sóng -> tốc độ chậm.',
      '- **5 GHz**: Hàng chục kênh sạch, **nhanh gấp bội**, nhưng đâm qua bê tông/tường dày yếu hơn 2.4 GHz.',
      '- **6 GHz (Wi-Fi 6E & Wi-Fi 7)**: Siêu rộng, gần như không nhiễu, Wi-Fi 7 còn có **MLO (Multi-Link Operation)** ghép 2 băng tần 5GHz + 6GHz chạy song song một lúc tăng tốc và giảm giật lag tối đa!',
      'Công nghệ **MU-MIMO** (nhiều ăng-ten bắn nhiều tia cùng lúc tới nhiều máy) & **OFDMA** (chia nhỏ sóng mang phụ phục vụ gói nhỏ IoT/chat cực mượt).',
    ],
    jargonBuster: [
      { term: '2.4 GHz vs 5 GHz vs 6 GHz', plain: '2.4 đi xa xuyên tường tốt nhưng chậm và hay nhiễu; 5 & 6 GHz siêu nhanh sạch nhiễu nhưng tầm ngắn hơn.' },
      { term: 'OFDMA (Wi-Fi 6)', plain: 'Kỹ thuật nhét dữ liệu của nhiều thiết bị vào chung một lượt phát sóng giúp giảm tắc nghẽn ở nơi đông người.' },
      { term: 'MLO (Wi-Fi 7)', plain: 'Cho phép điện thoại kết nối cùng lúc cả sóng 5 GHz và 6 GHz giống gộp 2 làn đường thành một.' },
    ],
    takeaway: 'Cần xa/thiết bị IoT dùng 2.4 GHz (chỉ chọn kênh 1, 6 hoặc 11); cần nhanh mượt dùng 5 GHz / 6 GHz.',
  },
  net_09_02: {
    analogy:
      'Kết nối Wi-Fi giống việc bạn bước vào hội chợ có nhiều gian hàng: mỗi gian hàng phát loa thông báo tên mình mỗi 0.1 giây (**Beacon Frame**: *"Tôi là Cafe_WiFi!"*). Điện thoại bạn nghe thấy thì bắt tay xác thực mật khẩu (**WPA2/WPA3**) rồi đăng ký nhập hộ (**Association**). Khi bạn cầm điện thoại đi bộ từ tầng 1 lên tầng 3, điện thoại tự ngắt trạm tầng 1 sang bám trạm tầng 3 gọi là **Roaming**!',
    whyNeeded:
      'Tại sao ở nhà lắp 2 cục Wi-Fi khác nhau mà đi lên tầng lầu điện thoại vẫn "bám rịt" cục cũ 1 vạch sóng rùa bò không chịu đổi? Hiểu Beacon & Roaming chuẩn `802.11k/v/r` sẽ giải quyết dứt điểm!',
    deepExplanation: [
      'Quy trình kết nối Wi-Fi:',
      '1. Scanning: Nghe **Beacon Frame** (Passive) hoặc chủ động phát **Probe Request** hỏi (Active).',
      '2. Authentication & WPA2/WPA3 4-Way Handshake: Đổi khóa mật mã mà không gửi thẳng mật khẩu lên sóng không khí!',
      '3. Association: Nhận **AID (Association ID)** để chính thức vào mạng LAN -> sau đó mới chạy DHCP lấy IP.',
      '**Roaming mượt (`802.11k/v/r` trong Wi-Fi Mesh)**: Do chính **điện thoại (Client)** tự quyết định khi nào bỏ trạm cũ sang trạm mới (Router không ép được trừ khi đạp thẳng ra ngoài). Hệ thống Mesh hỗ trợ `802.11k` (cho sẵn danh sách trạm hàng xóm đỡ quét), `802.11v` (gợi ý trạm mới sóng mạnh hơn) và `802.11r` (chuyển khóa WPA siêu nhanh < 20ms không rớt cuộc gọi Zalo/Zoom!).',
    ],
    jargonBuster: [
      { term: 'Beacon Frame', plain: 'Gói tin ngắn Router Wi-Fi bắn đều đặn mỗi 100ms để quảng bá tên Wi-Fi (SSID) và chuẩn bảo mật.' },
      { term: 'SSID / BSSID', plain: 'SSID là tên Wi-Fi chữ dễ đọc; BSSID là địa chỉ MAC riêng của từng cục phát sóng.' },
      { term: 'Roaming (802.11k/v/r)', plain: 'Chuyển vùng mượt giữa các cục phát cùng tên Wi-Fi khi bạn di chuyển quanh nhà/tòa nhà mà không rớt mạng.' },
    ],
    takeaway: 'Wi-Fi Mesh dùng chung SSID kèm chuẩn `802.11k/v/r` giúp điện thoại chuyển cục phát êm ru khi di chuyển qua nhiều tầng.',
  },
  net_09_03: {
    analogy:
      'Trong phòng tối không nhìn thấy mặt nhau, mọi người giao tiếp qua không khí chung nên không thể vừa nói vừa nghe xem có ai đè tiếng mình không! Nên Wi-Fi dùng phép lịch sự **CSMA/CA (Nghe trước khi nói, và có tránh va chạm)**: Lắng nghe phòng im lặng vài mili-giây -> chờ thêm một số nhịp ngẫu nhiên -> mới cất tiếng nói, rồi chờ bên kia hô `"Ok tôi nghe rõ rồi!" (ACK)`. Nếu 2 người đứng 2 đầu góc nhà bị bức tường che (**Hidden Terminal** — không nghe thấy tiếng nhau nhưng cùng nói tới cục Wi-Fi ở giữa làm nhiễu chồng lên nhau!) -> dùng cơ chế xin phép **RTS/CTS** ("Mọi người giữ trật tự 5 giây cho tôi nói nhé!").',
    whyNeeded:
      'Đây là lý do cốt lõi giải thích tại sao tốc độ thật trên Wi-Fi thường chỉ đạt 50–60% thông số ghi trên vỏ hộp!',
    deepExplanation: [
      'Ethernet dây cũ dùng **CSMA/CD** (Collision Detection: vừa gửi vừa đo điện áp, đụng là ngắt ngay). Wi-Fi sóng vô tuyến KHÔNG phát hiện va chạm ngay lúc đang phát vì sóng tự phát quá mạnh làm điếc tai thu của chính mình -> bắt buộc dùng **CSMA/CA (Collision Avoidance)**!',
      'Cơ chế **RTS / CTS (Request to Send / Clear to Send)** giải quyết **Hidden Terminal Problem**:',
      '- Máy A ở đầu nhà không nghe thấy Máy B ở cuối nhà -> cùng phát sóng đâm sầm vào nhau tại Access Point.',
      '- Máy A gửi một mẩu tin siêu ngắn **RTS** xin phép AP -> AP phát ra cho cả vùng **CTS** ("Tất cả im lặng trong X mili-giây, chỉ mỗi A được truyền!") -> Máy B nghe thấy CTS từ AP nên ngoan ngoãn chờ!',
    ],
    jargonBuster: [
      { term: 'CSMA/CA', plain: 'Luật chia sóng Wi-Fi: nghe ngóng kênh trống + chờ ngẫu nhiên rồi mới truyền để tránh đụng sóng.' },
      { term: 'Hidden Terminal', plain: 'Hai máy đặt hai bên Router bị khuất sóng nhau nên nói đè lên nhau tại điểm phát ở giữa.' },
      { term: 'RTS / CTS', plain: 'Cơ chế xin phép trước khi truyền gói dữ liệu lớn trên Wi-Fi nhằm ngăn các máy ở xa nói chen vào.' },
    ],
    takeaway: 'Sóng Wi-Fi là kênh dùng chung Half-Duplex: CSMA/CA + gói ACK khiến tốc độ thực chỉ bằng ~50-65% tốc độ quảng cáo trên vỏ hộp.',
  },
  net_09_04: {
    analogy:
      'Không phải thiết bị nào cũng cần truyền file nhanh tốn pin như Wi-Fi! **Bluetooth Classic** dùng cho tai nghe nghe nhạc liên tục. **BLE (Bluetooth Low Energy)** cực tiết kiệm pin dùng cho Apple Watch, AirTag, cân điện tử gửi vài byte dữ liệu rồi ngủ li bì cả năm trên 1 viên pin cúc áo! Còn **Zigbee / Thread / MQTT** dùng cho hàng trăm cảm biến nhà thông minh (Smart Home) kết nối kiểu mạng lưới tiết kiệm điện nhất.',
    whyNeeded:
      'Khi làm ứng dụng kết nối phần cứng (iPhone nói chuyện với đồng hồ sức khỏe, cân Bluetooth, hay cảm biến phòng), bạn bắt buộc phải phân biệt Wi-Fi, BLE GATT và MQTT.',
    deepExplanation: [
      '**BLE (Bluetooth Low Energy)**: Chạy ở băng tần 2.4 GHz nhưng nhảy tần nhanh (FHSS) tránh nhiễu. Giao tiếp qua mô hình **GATT (Generic Attribute Profile)**: thiết bị ngoại vi đóng vai trò bảng dữ liệu gồm các **Service** (ví dụ `Heart Rate Service`) chứa **Characteristic** (`Nhịp tim = 75`) để điện thoại đọc hoặc đăng ký nhận thông báo (`Notify`).',
      '**MQTT (IoT Messaging Protocol)**: Giao thức Publish/Subscribe siêu nhẹ (header chỉ 2 byte!) chạy trên TCP. Cảm biến nhiệt độ chỉ việc Publish lên Broker (`home/room1/temp`), app điện thoại Subscribe nghe trực tiếp — tiết kiệm băng thông 3G/Wi-Fi cực kỳ.',
      '**Zigbee / Thread / Matter**: Tạo **Mesh Network** không dây công suất siêu nhỏ: công tắc đèn cắm điện trong tường làm luôn trạm chuyển tiếp cho cảm biến cửa chạy pin ở xa!',
    ],
    jargonBuster: [
      { term: 'BLE (GATT)', plain: 'Bluetooth siêu tiết kiệm pin (Smartwatch, AirTag), trao đổi dữ liệu theo cấu trúc Service & Characteristic.' },
      { term: 'MQTT', plain: 'Giao thức nhắn tin Pub/Sub siêu nhẹ dành cho thiết bị IoT và cảm biến gửi nhận qua Broker.' },
      { term: 'Mesh IoT (Zigbee/Thread)', plain: 'Các thiết bị nhà thông minh tự chuyền tiếp tín hiệu cho nhau để phủ sóng cả nhà mà cực kỳ ít tốn pin.' },
    ],
    takeaway: 'Âm thanh liên tục dùng Bluetooth Classic; Đồng hồ/Cân dùng BLE (GATT); Nhà thông minh dùng Thread/Zigbee + MQTT.',
  },
  net_09_05: {
    analogy:
      'Mạng di động **4G LTE / 5G** giống mạng đường sắt siêu tốc phủ kín khắp quốc gia: Các trạm cột sóng (**eNodeB / gNodeB**) chia mặt đất thành từng **ô lục giác (Cell)** như tổ ong. Điện thoại bạn cầm thẻ định danh **SIM** đi trên ô tô 100 km/h chuyển mượt mà từ cột sóng này sang cột sóng kia (**Handover**) không hề mất cuộc gọi, trước khi dữ liệu từ cột sóng đi qua **Core Network** của nhà mạng nối ra Internet!',
    whyNeeded:
      'Hiểu mạng di động giúp bạn giải thích tại sao 4G/5G có độ trễ Ping cao hơn cáp quang và tại sao IP điện thoại hay rơi vào **CGNAT** (không mở server từ 4G được!).',
    deepExplanation: [
      'Cấu trúc 2 phần của mạng di động 4G/5G:',
      '1. **RAN (Radio Access Network)**: Hệ thống cột phát sóng (`eNodeB` ở 4G, `gNodeB` ở 5G) giao tiếp vô tuyến với điện thoại (UE). **5G** dùng thêm ăng-ten **Massive MIMO** + **Beamforming** (bắn chùm sóng tập trung thẳng vào điện thoại bạn thay vì tỏa đều tốn năng lượng!) và băng tần mmWave siêu nhanh.',
      '2. **Core Network (EPC ở 4G / 5GC ở 5G)**: Lo xác thực thẻ SIM (**HSS/UDM**), quản lý di chuyển khi bạn đi xe chuyển trạm (**Handover**), tính cước data, và đẩy gói ra cổng Internet (**PGW / UPF**).',
      '**CGNAT (Carrier-Grade NAT)**: Vì số thuê bao di động quá đông, nhà mạng dùng thêm 1 lớp NAT khổng lồ chung cho hàng chục nghìn người dùng 4G — nên IP bạn kiểm tra thấy trên máy khác với Public IP thật nhìn từ Google!',
    ],
    jargonBuster: [
      { term: 'Cell & Handover', plain: 'Vùng phủ sóng hình ô tổ ong của mỗi trạm thu phát và quá trình chuyển tiếp liên tục không rớt mạng khi bạn di chuyển.' },
      { term: 'Beamforming (5G)', plain: 'Kỹ thuật bẻ hướng chùm sóng vô tuyến hội tụ thẳng về phía điện thoại đang dùng.' },
      { term: 'CGNAT', plain: 'Lớp NAT cấp nhà mạng khiến hàng nghìn thuê bao 4G/5G dùng chung một nhóm Public IPv4.' },
    ],
    takeaway: 'Mạng di động gồm cột sóng (RAN) + lõi quản lý SIM/di chuyển (Core); 5G giảm độ trễ và chia lát mạng (Network Slicing) cực linh hoạt.',
  },

  // =========================================================================
  // MODULE 10: NETWORK SECURITY & ENCRYPTION
  // =========================================================================
  net_10_01: {
    analogy:
      'Gửi dữ liệu bằng HTTP thường giống viết bưu thiếp: bất kỳ ai ở quán Wi-Fi hay nhà mạng đều đọc trộm và sửa chữ được! **TLS 1.3 (lớp bảo mật tạo nên HTTPS)** thực hiện hai bước cực thông minh chỉ trong **đúng 1 vòng khứ hồi (1-RTT)**: Đầu tiên dùng **Mã hóa Bất đối xứng** (ổ khóa Công khai mở cho mọi người khóa hộp, chỉ Server giữ Chìa khóa Bí mật mở hộp) để trao đổi an toàn một **Chiếc chìa khóa Đối xứng dùng chung tạm thời**, sau đó toàn bộ dữ liệu web/API được khóa bằng chiếc chìa khóa đối xứng siêu tốc đó!',
    whyNeeded:
      'Mã hóa bất đối xứng (RSA/ECDHE) rất an toàn nhưng cực kỳ chậm nếu mã hóa cả file phim 1GB; còn mã hóa đối xứng (AES) nhanh như chớp nhưng làm sao đưa được mật khẩu chung qua mạng công cộng? TLS kết hợp điểm mạnh của cả hai!',
    deepExplanation: [
      'Quy trình **TLS 1.3 Handshake (chỉ 1 RTT!)**:',
      '1. `ClientHello`: Trình duyệt gửi tên miền cần vào (**SNI**), các thuật toán hỗ trợ, và luôn phần chia sẻ khóa **ECDHE** của mình.',
      '2. `ServerHello` + **Certificate** + Signature: Server gửi lại phần ECDHE của nó + Chứng chỉ số (chứng minh tôi là `google.com` thật) + Chữ ký số xác nhận. Ngay sau gói này cả 2 bên đã tính ra được cùng một khóa phiên AES bí mật chung (Session Key) nhờ toán học **Diffie-Hellman (ECDHE)**!',
      '3. Dữ liệu từ đây được mã hóa bằng **AES-GCM / ChaCha20-Poly1305** (**AEAD**: vừa bí mật vừa chống sửa đổi 1 bit!).',
      'Siêu tính năng **Perfect Forward Secrecy (PFS)**: Nhờ ECDHE tạo khóa phiên mới tinh dùng 1 lần cho mỗi phiên rồi vứt đi -> dù 10 năm sau hacker có đánh cắp được Private Key gốc của Server cũng **KHÔNG THỂ giải mã lại** dữ liệu mạng đã thu lén hôm nay!',
    ],
    jargonBuster: [
      { term: 'TLS 1.3', plain: 'Giao thức mã hóa hiện đại nhất cho HTTPS: nhanh (1-RTT), an toàn tuyệt đối và mặc định bảo vệ khóa phiên.' },
      { term: 'Symmetric vs Asymmetric', plain: 'Đối xứng (AES) 1 chìa dùng chung siêu nhanh; Bất đối xứng (RSA/ECC) 2 chìa Public/Private để trao đổi khóa và ký tên an toàn.' },
      { term: 'Forward Secrecy (PFS)', plain: 'Bảo mật tiến tới: mỗi phiên chat có khóa tạm riêng nên lộ khóa chủ sau này cũng không đọc lén lại được lịch sử cũ.' },
    ],
    takeaway: 'TLS dùng Bất đối xứng để xác thực + thỏa thuận khóa chung an toàn qua ECDHE, rồi dùng Đối xứng (AES/ChaCha20) mã hóa toàn bộ dữ liệu siêu tốc.',
  },
  net_10_02: {
    analogy:
      'Làm sao trình duyệt tin chắc cái Public Key nhận được lúc mở `vietcombank.com.vn` đúng là của Vietcombank thật chứ không phải máy hacker giả mạo? Nhờ hệ thống **PKI & Chứng chỉ X.509** giống hệ thống **Công chứng & Căn cước công dân**: Trình duyệt Chrome/iPhone cài sẵn danh sách khoảng ~150 **Tổ chức Cấp Chứng chỉ Gốc uy tín (Root CA - như Let\'s Encrypt, DigiCert)**. Vietcombank đi đăng ký kiểm tra với CA và được cấp **Tờ Chứng Chỉ X.509 có chữ ký số của CA**: *"Tôi xác nhận Public Key này thuộc về `vietcombank.com.vn`"*!',
    whyNeeded:
      'Mã hóa mà không xác thực danh tính thì vô nghĩa — bạn sẽ mã hóa rất kỹ gửi mật khẩu thẳng cho... máy của kẻ lừa đảo!',
    deepExplanation: [
      'Chuỗi tin cậy (**Chain of Trust**): Root CA (được cài sẵn trong OS/Browser) -> ký bảo lãnh cho Intermediate CA -> ký cấp chứng chỉ Leaf Certificate cho `noetrix.app` (ngày nay thường gia hạn tự động miễn phí qua **Let\'s Encrypt** mỗi 90 ngày bằng giao thức ACME!).',
      'Khi Chrome nhận được Certificate của website, nó kiểm tra 4 điều:',
      '1. Tên miền có khớp với ô SAN (Subject Alternative Name) trong chứng chỉ không?',
      '2. Chứng chỉ còn hạn ngày sử dụng không? (Nếu đồng hồ máy tính bạn chỉnh sai năm 2099 là cả Web báo lỗi SSL!).',
      '3. Chữ ký số có khớp lần ngược về được Root CA tin cậy trong máy không?',
      '4. Chứng chỉ đã bị thu hồi khẩn cấp vì lộ khóa chưa (OCSP Stapling)?',
      '**mTLS (Mutual TLS)**: Bình thường chỉ Client kiểm tra chứng chỉ Server. Trong Microservices nội bộ hay ngân hàng, **Server cũng bắt Client xuất trình chứng chỉ** mới cho gọi API!',
    ],
    jargonBuster: [
      { term: 'CA (Certificate Authority)', plain: 'Tổ chức công chứng số uy tín (như DigiCert, Let\'s Encrypt) xác nhận chủ sở hữu hợp pháp của một tên miền.' },
      { term: 'X.509 Certificate', plain: 'Tờ "CCCD điện tử" của website chứa tên miền, Public Key, ngày hết hạn và chữ ký của CA.' },
      { term: 'mTLS', plain: 'Xác thực hai chiều: cả Server và Client đều phải đưa chứng chỉ số chứng minh danh tính cho nhau.' },
    ],
    takeaway: 'Ổ khóa xanh trên trình duyệt hoạt động nhờ chuỗi chữ ký số **Chain of Trust** từ Root CA có sẵn trong OS tới từng tên miền.',
  },
  net_10_03: {
    analogy:
      '**VPN (Mạng riêng ảo)** giống như xây một **đường hầm ngầm bọc thép kín mít đi xuyên qua lòng thành phố Internet công cộng**: Dù bạn đang ngồi dùng Wi-Fi công cộng ở sân bay đầy hacker, mọi gói tin từ máy bạn đi ra được gói kín, mã hóa từ đầu tới chân, chui tọt vào đường hầm nối thẳng về máy chủ công ty hoặc server ở nước ngoài — người ngoài ở sân bay chỉ thấy các cục dữ liệu vô nghĩa đi về phía máy chủ VPN đó chứ không đọc được bạn làm gì!',
    whyNeeded:
      'Cho phép nhân viên ở nhà truy cập an toàn vào máy chủ nội bộ công ty, hoặc nối liền mạng 2 văn phòng ở 2 thành phố qua Internet công cộng mà giá rẻ hơn rất nhiều so với kéo cáp riêng.',
    deepExplanation: [
      'Nguyên lý **IP Tunneling (Gói lồng gói)**: Toàn bộ gói IP nội bộ gốc (tới Database `10.0.5.10`) được mã hóa sạch sẽ -> rồi bọc vào payload của một gói IP/UDP ngoài cùng gửi tới Public IP của VPN Server -> VPN Server giải mã rồi thả gói gốc vào mạng công ty.',
      'So sánh 3 công nghệ VPN phổ biến nhất:',
      '1. **IPSec**: Chuẩn lâu đời chạy sâu trong tầng IP, hay dùng nối Site-to-Site giữa 2 Router doanh nghiệp/Cloud VPC. Cấu hình khá phức tạp.',
      '2. **OpenVPN**: Chạy trên SSL/TLS (TCP hoặc UDP port 1194/443). Xuyên Firewall rất tốt (vì giả dạng lưu lượng HTTPS được), nhưng nặng CPU vì nằm ở User Space.',
      '3. **WireGuard**: Thế hệ mới làm mưa làm gió! Chỉ dài ~4.000 dòng code cực kỳ gọn sạch nằm ngay trong **Linux Kernel Space**, dùng mật mã hiện đại siêu nhanh (`ChaCha20`, `Noise`) — kết nối tức thì khi mở điện thoại, ít hao pin hơn hẳn OpenVPN/IPSec!',
    ],
    jargonBuster: [
      { term: 'VPN Tunneling', plain: 'Bọc và mã hóa toàn bộ gói tin gốc bên trong một gói tin mới để đi an toàn qua Internet công cộng.' },
      { term: 'WireGuard', plain: 'Giao thức VPN thế hệ mới siêu nhẹ, nhanh, ít tốn pin và tích hợp thẳng trong nhân Linux.' },
      { term: 'Site-to-Site vs Remote Access', plain: 'Site-to-Site nối 2 văn phòng/Cloud với nhau; Remote Access cho laptop/iPhone cá nhân chui về công ty.' },
    ],
    takeaway: 'VPN mã hóa toàn bộ gói tin đi xuyên mạng công cộng; ngày nay **WireGuard** là lựa chọn nhanh, nhẹ và ít hao pin nhất cho iOS/Linux.',
  },
  net_10_04: {
    analogy:
      'Ngoài tường lửa chốt cửa (**Firewall**), công ty còn lắp thêm **Camera AI phát hiện trộm (IDS)** và **Cửa bẫy tự động khóa cổ trộm (IPS)**: **IDS** chỉ đứng bên lề nghe bản sao lưu lượng, thấy dấu hiệu tấn công là hú còi báo động cho quản trị viên (an toàn, không bao giờ chặn nhầm người tốt làm sập web!). Còn **IPS** đứng chắn thẳng giữa đường đi, thấy gói tin nghi mã độc là lập tức cắt phăng ngay tại chỗ!',
    whyNeeded:
      'Mở cổng 443 cho khách hàng truy cập web đồng nghĩa Firewall vẫn phải cho gói tin đi qua. IDS/IPS kiểm tra sâu hành vi bất thường bên trong chính luồng dữ liệu hợp lệ đó.',
    deepExplanation: [
      '**IDS (Intrusion Detection System)**: Đặt thụ động bên cạnh (qua Port Mirroring/SPAN). Nếu bị sai luật báo nhầm (`False Positive`), chỉ làm ồn ào log chứ không ảnh hưởng kết nối của khách thật.',
      '**IPS (Intrusion Prevention System)**: Đặt nối tiếp trực tiếp trên đường truyền (**Inline**). Có thể tự động Drop gói tin tấn công ngay tức thì — nhưng đòi hỏi máy cực mạnh (không làm trễ mạng) và tinh chỉnh chuẩn (tránh chặn nhầm khách hàng thật).',
      '**Hardening Firewall thực chiến**: Tách vùng **DMZ** (chứa Web Server) với vùng nội bộ (chứa Database); bật **Fail2ban** tự động khóa IP nào thử sai mật khẩu SSH 5 lần; bật **SYN Cookies** chống tràn hàng đợi mở kết nối.',
    ],
    jargonBuster: [
      { term: 'IDS vs IPS', plain: 'IDS chỉ phát hiện và báo động thụ động; IPS đứng giữa đường chủ động chặn đứng lưu lượng độc hại.' },
      { term: 'False Positive', plain: 'Báo động nhầm: hệ thống bảo mật nhận nhầm người dùng bình thường thành kẻ tấn công.' },
      { term: 'Fail2ban', plain: 'Công cụ tự đọc log lỗi đăng nhập và tự động thêm lệnh tường lửa chặn IP dò mật khẩu.' },
    ],
    takeaway: 'IDS để theo dõi cảnh báo an toàn; IPS để chặn trực tiếp; kết hợp tách vùng DMZ và Fail2ban bảo vệ server toàn diện.',
  },
  net_10_05: {
    analogy:
      '**DoS / DDoS (Tấn công Từ chối Dịch vụ Phân tán)** giống như một kẻ xấu thuê **100.000 người cùng lúc giả vờ gọi điện thoại tới tổng đài quán ăn hoặc đứng chật kín cửa ra vào không gọi món gì** — khiến khách hàng thật muốn vào ăn không thể nào vào được và tổng đài sập luôn! Vì lưu lượng đổ về từ hàng trăm nghìn máy bị nhiễm mã độc khắp thế giới, không thể chặn bằng 1–2 IP đơn lẻ được!',
    whyNeeded:
      'Một website nhỏ chỉ cần 1 đợt DDoS vài Gbps là sập nguồn hoặc nhận hóa đơn Cloud Bandwidth khổng lồ nếu không có chiến lược phòng thủ phân lớp.',
    deepExplanation: [
      '3 tầng tấn công DDoS phổ biến:',
      '1. **Volumetric (L3/L4 — Làm ngập băng thông)**: Ví dụ **DNS/NTP Amplification** — kẻ tấn công giả mạo IP nạn nhân gửi câu hỏi siêu nhỏ 60 byte tới server DNS công cộng để server DNS trả về gói khổng lồ 3000 byte dội thẳng vào nhà nạn nhân -> tắc nghẽn sạch đường cáp!',
      '2. **Protocol Exhaustion (Làm kiệt quệ bảng trạng thái OS)**: Ví dụ **SYN Flood** — gửi hàng triệu gói `SYN` xin bắt tay TCP với IP nguồn giả mạo rồi lặn mất tăm không bao giờ gửi bước `ACK` thứ 3 -> làm đầy cứng hàng đợi `SYN Queue` của Server! Giải pháp nhân Linux: **`SYN Cookies`** (không cấp RAM lưu trạng thái trước khi nhận được ACK thứ 3!).',
      '3. **Application Layer (L7 — HTTP Flood)**: Mở kết nối hợp lệ hoàn toàn rồi spam hàng triệu request tới endpoint nặng (như `/search` hay `/login`). Giải pháp: Đặt **Cloudflare / Anycast Edge**, **Rate Limiting** theo IP/Token, và Caching.',
    ],
    jargonBuster: [
      { term: 'DDoS', plain: 'Tấn công huy động hàng trăm nghìn máy tính/thiết bị khắp nơi dội lưu lượng làm tê liệt băng thông hoặc CPU server.' },
      { term: 'SYN Flood & SYN Cookies', plain: 'SYN Flood lừa server mở chờ kết nối nửa chừng tới sập; SYN Cookies giúp server xác nhận không cần tốn RAM trước.' },
      { term: 'Anycast / Scrubbing Center', plain: 'Dùng hàng trăm điểm biên Cloudflare khắp thế giới hấp thụ và lọc sạch lưu lượng tấn công trước khi đưa về máy chủ gốc.' },
    ],
    takeaway: 'Phòng DDoS luôn dùng **Anycast CDN (Cloudflare)** hấp thụ ở rìa + **SYN Cookies** ở OS + **Rate Limit & Cache** ở Backend.',
  },

  // =========================================================================
  // MODULE 11: PERFORMANCE, DIAGNOSTICS & PACKET ANALYSIS
  // =========================================================================
  net_11_01: {
    analogy:
      'Phân biệt **Bandwidth (Băng thông)** và **Latency (Độ trễ)** bằng hình ảnh đường ống và xe chở hàng: **Latency** là **thời gian 1 chiếc xe máy chạy từ Hà Nội vào Sài Gòn** (ví dụ 20 giờ — đường có mở rộng thành 100 làn thì 1 chiếc xe máy vẫn mất gần 20 giờ vì giới hạn tốc độ!). Còn **Bandwidth** là **chiều rộng con đường có bao nhiêu làn xe** (100 làn cho phép chở 100 xe đi song song cùng lúc!). **Throughput** là **số lượng hàng hóa THẬT SỰ tới được đích trong 1 giây** sau khi trừ kẹt xe và mất gói!',
    whyNeeded:
      'Rất nhiều người lắp gói mạng 1 Gbps (Bandwidth siêu to) nhưng chơi game hay lướt web vẫn thấy giật khựng — lý do là vì **Latency / Tail Latency** cao chứ không thiếu Bandwidth!',
    deepExplanation: [
      '4 yếu tố cộng dồn thành tổng độ trễ (Latency) của một gói tin:',
      '1. Transmission Delay: Thời gian đẩy tất cả các bit lên dây (`PacketSize / Bandwidth`).',
      '2. Propagation Delay: Thời gian sóng ánh sáng bay trên quãng đường vật lý (`Distance / Speed`). Không bao giờ nhanh hơn tốc độ ánh sáng trong cáp quang (~200.000 km/s -> VN đi Mỹ luôn mất ít nhất ~150ms!).',
      '3. Processing & Queuing Delay: Thời gian xếp hàng chờ ở Router.',
      '**Tail Latency (P95 / P99)**: Trung bình độ trễ API là 20ms nghe rất ngon, nhưng nếu 1% request chậm bất thường tới **2000ms (P99 = 2s)** -> trong kiến trúc Microservices mà 1 trang web gọi 20 API khác nhau, xác suất dính ít nhất 1 thằng chậm sẽ tăng vọt làm khách hàng thấy trang web quay vòng 2 giây!',
    ],
    jargonBuster: [
      { term: 'Bandwidth vs Throughput', plain: 'Bandwidth là tốc độ tối đa lý thuyết của đường dây; Throughput là tốc độ truyền thực tế đo được.' },
      { term: 'Latency (RTT)', plain: 'Độ trễ: thời gian đi một chiều (hoặc đi-về RTT) để tín hiệu tới đích; quyết định độ nhạy game & tải trang.' },
      { term: 'P99 (Tail Latency)', plain: 'Mức độ trễ của 1% yêu cầu chậm nhất hệ thống — thước đo quan trọng hơn số trung bình (Average).' },
    ],
    takeaway: 'Cáp quang VN->Mỹ dù tăng gói cước 10 Gbps vẫn có Ping ~150ms vì giới hạn tốc độ ánh sáng; làm hệ thống luôn đo P95/P99 chứ không nhìn mỗi Average.',
  },
  net_11_02: {
    analogy:
      '**Jitter** là độ **lúc nhanh lúc chậm thất thường** của các gói tin tới nơi (gói 1 mất 20ms, gói 2 mất 120ms, gói 3 mất 30ms -> làm cuộc gọi Zoom bị méo tiếng như robot!). Còn **Bufferbloat** là căn bệnh cực hài hước của Router/Modem nhà mạng: Hãng gắn bộ nhớ đệm (Buffer) quá to để đừng bao giờ rớt gói khi ai đó đang tải phim 4K -> hậu quả là hàng nghìn gói tải phim xếp hàng dài cả trăm mét trong Router -> gói chơi game của bạn đứng sau cùng phải đợi tận 1–2 giây (**Ping nhảy vọt lên 1500ms!**) mới tới lượt!',
    whyNeeded:
      'Giải thích chính xác hiện tượng cực kỳ phổ biến: Cứ có người trong nhà bật tải file lớn hay backup iCloud là máy bạn đang chơi game/gọi video bị lag điên đảo dù băng thông mạng vẫn còn!',
    deepExplanation: [
      '**Jitter & Jitter Buffer**: Các app gọi VoIP/Video dựng một hàng đợi nhỏ (Jitter Buffer, ~30–60ms) ở đầu nhận để gom gói đến trễ sắp lại cho âm thanh êm đều. Nếu Jitter vượt quá sức chứa hàng đợi đó -> âm thanh bị vấp/rớt chữ!',
      '**Bufferbloat**: Theo lý thuyết TCP cũ (Loss-based CUBIC), TCP chỉ chịu giảm tốc khi thấy rớt gói. Nhưng Router có buffer khổng lồ giữ hết hàng đợi không chịu rớt -> TCP tưởng đường còn thông nên cứ bơm căng ứ hàng giây độ trễ!',
      'Giải pháp trị Bufferbloat hiệu quả 100%: Thuật toán quản lý hàng đợi thông minh **FQ-CoDel / CAKE (Smart Queue Management)** trên Router hoặc **TCP BBR** — chủ động thả dấu hiệu nghẽn sớm ngay khi hàng đợi mới nhú lên vài mili-giây!',
    ],
    jargonBuster: [
      { term: 'Jitter', plain: 'Sự biến thiên thất thường của độ trễ giữa các gói tin liên tiếp, gây giật âm thanh/hình ảnh gọi video.' },
      { term: 'Bufferbloat', plain: 'Lỗi nghẽn hàng đợi quá lớn trong Router khiến Ping tăng vọt hàng trăm ms ngay khi có người tải nặng.' },
      { term: 'FQ-CoDel / SQM', plain: 'Thuật toán xếp hàng công bằng trên Router giúp tách luồng game/gọi video đi trước luồng tải phim.' },
    ],
    takeaway: 'Tải phim làm game lag chính là bệnh **Bufferbloat**; bật SQM (FQ-CoDel/CAKE) trên Router hoặc TCP BBR sẽ giữ Ping luôn thấp.',
  },
  net_11_03: {
    analogy:
      'Khi mạng lỗi không vào được một server, kỹ sư dùng bộ 3 kính lúp kinh điển: **`ping`** giống ném 1 quả bóng xem server có còn sống và mất bao lâu dội lại; **`traceroute`** giống thả con chip dò đường đi qua từng ngã tư Router từ nhà bạn sang tận Singapore xem bị kẹt/đứt ở chính xác ngã tư nào; còn **`mtr` (My Traceroute)** kết hợp cả hai — theo dõi liên tục từng ngã tư theo thời gian thực để tóm sống xem ngã tư nào hay chập chờn rớt gói!',
    whyNeeded:
      'Thay vì đoán mò "hình như mạng chậm" hay gọi lên tổng đài nói chung chung, 3 lệnh này chỉ ra ngay thủ phạm là Wi-Fi nhà bạn, dây nhà mạng hay chính server đích đang sập.',
    deepExplanation: [
      'Cách đọc chuẩn lệnh `mtr` / `traceroute` (tránh bẫy hiểu nhầm hay gặp!):',
      '- Nếu Hop số 1 (`192.168.1.1`) bị rớt gói `Loss 5%` hoặc Ping cao -> Lỗi ngay tại Wi-Fi / dây nhà bạn!',
      '- **Bẫy đọc nhầm kinh điển ở Hop giữa**: Thấy Hop số 4 hiện `Loss 60%` nhưng các Hop số 5, 6 và Đích cuối vẫn `Loss 0%, Ping 30ms` mượt mà! ĐỪNG HOẢNG -> Đó KHÔNG phải lỗi mạng, mà chỉ vì con Router số 4 bận chuyển gói chính nên nó cố tình lờ đi không trả lời tin nhắn thăm dò ICMP (`Rate Limit ICMP`)!',
      '- Chỉ khi thấy **từ Hop X trở đi TẤT CẢ các Hop sau và Đích cuối đều rớt gói / đứt hẳn** -> lúc đó mới chắc chắn đứt/nghẽn tại Hop X!',
    ],
    jargonBuster: [
      { term: 'ping', plain: 'Lệnh gửi gói ICMP kiểm tra kết nối, độ trễ khứ hồi (ms) và tỷ lệ mất gói.' },
      { term: 'traceroute / tracert', plain: 'Lệnh vẽ ra từng địa chỉ Router trung gian từ máy bạn tới server đích nhờ mẹo tăng dần TTL 1, 2, 3...' },
      { term: 'mtr', plain: 'Công cụ kết hợp ping + traceroute chạy liên tục, chuẩn nhất để phát hiện ngã tư mạng chập chờn.' },
    ],
    takeaway: 'Đọc `mtr`: rớt ở Hop 1 = Wi-Fi nhà; rớt ở giữa nhưng đích 0% loss = bình thường (Router chặn ICMP); rớt kéo dài tới tận đích = nghẽn thật!',
  },
  net_11_04: {
    analogy:
      'Khi bạn nghi ngờ một app đang mở cổng lén, hay port 3000 đang bị app khác chiếm mất chỗ không khởi động Server lên được, hay Server đang có quá nhiều kết nối treo: bộ lệnh **`ip`**, **`ss`** (bản mới siêu nhanh thay thế `netstat`) giống như **mở nắp ca-pô máy tính ra soi thẳng từng dây mạng, bảng định tuyến và danh sách từng cổng Port + PID phần mềm nào đang giữ cổng đó**!',
    whyNeeded:
      'Mọi lỗi thường gặp khi lập trình Backend (`Address already in use`, `Connection refused`, không gọi được API từ máy khác) đều soi ra trong 5 giây bằng đúng 1 dòng `ss`.',
    deepExplanation: [
      'Những câu lệnh Linux/macOS thực chiến nhớ dùng suốt đời:',
      '- **`ip addr`** (`ip a`): Xem card mạng có được gán đúng IP chưa.',
      '- **`ip route`** (`ip r`): Xem máy đang đẩy gói mặc định qua Gateway nào.',
      '- **`ss -tulnp`**: Lệnh thần thánh! (`-t` TCP, `-u` UDP, `-l` Listening đang mở cửa chờ, `-n` hiện số Port khỏi dịch tên chậm, `-p` hiện tên/PID Process đang giữ cổng!). Nhìn vào cột `Local Address`: nếu thấy **`127.0.0.1:3000`** -> app chỉ nghe nội bộ máy bạn, bên ngoài không truy cập được; muốn máy khác truy cập phải bind **`0.0.0.0:3000`**!',
      '- **`ss -tan`**: Xem các kết nối đang chạy (`ESTABLISHED`, `SYN-RECV`, `TIME-WAIT`) để phát hiện nghẽn hay rò rỉ kết nối.',
    ],
    jargonBuster: [
      { term: 'ss -tulnp', plain: 'Lệnh Linux liệt kê mọi cổng TCP/UDP đang mở lắng nghe kèm tên phần mềm đang giữ cổng.' },
      { term: '127.0.0.1 vs 0.0.0.0', plain: 'Bind vào 127.0.0.1 chỉ cho chính máy mình gọi; bind vào 0.0.0.0 là lắng nghe trên tất cả card mạng của máy.' },
      { term: 'Connection Refused', plain: 'Lỗi tới được đúng IP máy đích nhưng ở cổng Port đó không có app nào đang mở lắng nghe.' },
    ],
    takeaway: 'Gặp lỗi `Address already in use` hoặc máy khác không gọi được API -> chạy ngay `ss -tulnp` xem app đang bind `127.0.0.1` hay `0.0.0.0`!',
  },
  net_11_05: {
    analogy:
      'Log ứng dụng có thể nói dối, nhưng **dữ liệu thật chạy trên dây mạng không bao giờ biết nói dối**! **`tcpdump`** (dòng lệnh trên server không có màn hình) và **Wireshark** (giao diện đồ họa trực quan) giống như gắn **máy chụp X-quang siêu chi tiết vào sợi cáp**: ghi lại từng gói tin 0/1 đi qua, rồi mổ xẻ sạch từng tầng từ Ethernet -> IP -> TCP Handshake -> HTTP/DNS cho bạn nhìn tận mắt xem bên nào quên trả lời, bên nào tự ngắt `RST`!',
    whyNeeded:
      'Khi mọi giả thuyết đều bế tắc ("Code tôi gửi đúng mà bên đối tác bảo không nhận được!"), bắt gói PCAP bằng tcpdump và mở bằng Wireshark là bằng chứng cuối cùng dứt điểm tranh cãi.',
    deepExplanation: [
      'Quy trình bắt gói chuyên nghiệp (trên Production Server không cài GUI Wireshark):',
      '1. Chạy `tcpdump` trực tiếp trên Linux server lọc đúng thứ cần bắt (tránh ổ đĩa đầy!), ghi ra file `.pcap`: `sudo tcpdump -i eth0 host 10.0.1.5 and port 443 -w debug.pcap`.',
      '2. Tải `debug.pcap` về máy cá nhân, mở bằng **Wireshark** để soi màu sắc & dòng chảy (**Follow TCP Stream**).',
      'Những dấu hiệu đỏ rực dễ nhìn thấy ngay trên Wireshark: Gói đen chữ đỏ **`TCP Retransmission`** (đứt/rớt gói phải gửi lại), **`TCP Reset (RST)`** (một bên đóng sập kết nối phũ phàng), hoặc `TLS Alert: Certificate Unknown` (lỗi chứng chỉ SSL).',
    ],
    jargonBuster: [
      { term: 'PCAP (.pcap)', plain: 'Định dạng file chuẩn lưu lại nguyên bản từng gói tin mạng bắt được để mở phân tích trên Wireshark.' },
      { term: 'tcpdump', plain: 'Công cụ dòng lệnh bắt gói tin cực nhẹ tích hợp sẵn trên gần như mọi Linux server.' },
      { term: 'Wireshark', plain: 'Phần mềm đồ họa số 1 thế giới để soi mổ chi tiết từng byte và từng tầng giao thức trong file PCAP.' },
    ],
    takeaway: '"Khi hết cách, hãy bắt gói tin!": Dùng `tcpdump -w out.pcap` trên Server rồi mở bằng Wireshark xem đích xác bên nào lỗi.',
  },

  // =========================================================================
  // MODULE 12: SOCKET PROGRAMMING & NETWORK I/O
  // =========================================================================
  net_12_01: {
    analogy:
      'Làm sao code Python, Java, Go của bạn thật sự gửi được chuỗi chữ ra tận Internet? Trình biên dịch không tự phát ra điện được — nó phải gọi vào **Socket API** của Hệ điều hành! Và nhớ lại bài OS `08.01`: đối với OS Linux/macOS, một **Network Socket** cũng chính là **một con số File Descriptor (FD)** nằm chung trong bảng FD của tiến trình! Mở 1 kết nối mạng giống hệt mở 1 file: `socket()` trả về số `fd = 4`, sau đó code chỉ việc gọi `write(4, data)` để gửi ra mạng và `read(4, buf)` để đọc dữ liệu mạng về!',
    whyNeeded:
      'Đây là cầu nối trực tiếp gắn kết kiến thức môn **Hệ điều hành** và môn **Mạng máy tính** lại làm một!',
    deepExplanation: [
      'Chuỗi System Call kinh điển tạo nên 1 Server TCP chuẩn POSIX:',
      '1. `server_fd = socket(AF_INET, SOCK_STREAM, 0)`: Xin Kernel tạo một hồ sơ Socket IPv4 TCP.',
      '2. `bind(server_fd, 0.0.0.0:8080)`: Gắn Socket đó với IP và Port cụ thể (cẩn thận cài option `SO_REUSEADDR` để restart server ngay không bị kẹt lỗi `Address already in use` do kết nối cũ đang ở `TIME_WAIT`!).',
      '3. `listen(server_fd, backlog)`: Chuyển từ chủ động sang **lắng nghe bị động**, nhờ Kernel dựng 2 hàng đợi chứa khách bắt tay (SYN Queue + Accept Queue).',
      '4. `client_fd = accept(server_fd)`: Bốc 1 khách đã bắt tay 3 bước xong xuôi ra cấp một **FD mới riêng (`client_fd = 5`)** để nói chuyện riêng với đúng vị khách này — còn `server_fd = 4` vẫn đứng ở cổng đón khách tiếp theo!',
    ],
    jargonBuster: [
      { term: 'POSIX Socket API', plain: 'Bộ hàm chuẩn của Hệ điều hành (socket, bind, listen, accept, connect) để phần mềm giao tiếp qua mạng.' },
      { term: 'SO_REUSEADDR', plain: 'Cờ tùy chọn cho phép Server khởi động lại và chiếm lại ngay cổng Port cũ đang có kết nối cũ chờ đóng TIME_WAIT.' },
      { term: 'ulimit -n', plain: 'Giới hạn số lượng File Descriptor (tức số File + Kết nối mạng tối đa) 1 tiến trình được phép mở cùng lúc.' },
    ],
    takeaway: 'Trên UNIX/Linux, kết nối mạng chính là File Descriptor: Server cần mở 1 `listen_fd` ở cổng chính và cấp thêm 1 `client_fd` riêng cho mỗi khách.',
  },
  net_12_02: {
    analogy:
      '**TCP KHÔNG PHẢI LÀ TIN NHẮN TÁCH RỜI — TCP LÀ MỘT DÒNG SUỐI CHẢY LIÊN TỤC KHÔNG RÀO CHẮN!** Ví dụ bạn gọi `send("HELLO")` rồi gọi tiếp `send("WORLD")`: Bên nhận đọc một phát có thể nhận gọn cả `"HELLOWORLD"` dính chùm vào nhau (**TCP Sticky Packet**), hoặc nhận lẻ `"HEL"` trước rồi 5ms sau mới nhận nốt `"LOWORLD"`! Vì vậy mọi giao thức trên TCP (như HTTP) bắt buộc phải tự đặt **dấu ngắt khung (Framing)** — như ghi rõ chiều dài trước `"5:HELLO"` hoặc gắn ký tự xuống dòng `\\n` chốt câu!',
    whyNeeded:
      '99% người mới tập viết Chat Server bằng Socket TCP đều dính lỗi 2 tin nhắn bị dính vào nhau hoặc 1 JSON bị cắt làm đôi vì lầm tưởng `1 lần send() = 1 lần recv()`!',
    deepExplanation: [
      'Cách thiết kế Framing chuẩn để không bao giờ bị dính hay rách gói trên TCP:',
      '1. **Delimiter-based (Dấu phân cách)**: Như HTTP/1.1 dùng `\\r\\n\\r\\n` để báo hết phần Header, Redis RESP dùng `\\r\\n`. Đơn giản nhưng phải cẩn thận nếu ruột dữ liệu cũng chứa ký tự xuống dòng.',
      '2. **Length-Prefixed (Khai báo độ dài ở đầu — Chuẩn vàng cho Protocol nhị phân như Protobuf/gRPC/Kafka)**: Trước mỗi tin nhắn, gửi cố định **4 byte số nguyên cho biết độ dài N**, rồi theo sau là đúng N byte ruột! Bên nhận cứ đọc đủ 4 byte đầu biết `N = 1200`, rồi vòng lặp `read()` gom đủ đúng 1200 byte mới giao cho tầng xử lý JSON/Protobuf.',
    ],
    jargonBuster: [
      { term: 'Byte Stream (TCP)', plain: 'Dòng dữ liệu liên tục không tự chia ranh giới từng tin nhắn rời như UDP.' },
      { term: 'Message Framing', plain: 'Quy tắc tự đánh dấu điểm đầu và điểm cuối mỗi tin nhắn (dùng độ dài đứng trước hoặc ký tự ngăn cách).' },
      { term: 'Partial Read', plain: 'Hiện tượng một lần gọi read() chỉ mới lấy được một nửa tin nhắn lớn vì nửa sau vẫn đang bay trên đường.' },
    ],
    takeaway: 'TCP là dòng byte chứ không phải từng gói tin nhắn! Viết giao thức trên TCP luôn phải tự làm Framing (ưu tiên gắn 4-byte độ dài ở đầu).',
  },
  net_12_03: {
    analogy:
      'Khi quán (Server) bắt đầu có **10.000 khách hàng (Connections)** cùng ngồi kết nối chat một lúc, bạn phục vụ cách nào? Cách 1 (**Thread-per-Connection**): Cứ mỗi 1 khách vào lại thuê riêng 1 nhân viên (1 OS Thread ~1MB RAM) đứng kè kè phục vụ -> 10.000 khách tốn 10 GB RAM chỉ để... 9.900 nhân viên đứng ngủ đợi khách gõ chữ! Cách 2 (**Thread Pool**): Chỉ thuê 100 nhân viên xoay vòng, nhưng nếu 100 khách đầu tiên giữ kết nối mở lâu (như WebSocket chat), khách thứ 101 đứng ngoài cửa chết dí luôn!',
    whyNeeded:
      'Đây chính là bài toán kinh điển **C10K Problem** (làm sao 1 server phục vụ 10.000 – 1.000.000 kết nối đồng thời) thúc đẩy ra đời Node.js, Nginx, Netty, Go!',
    deepExplanation: [
      'Sự tiến hóa mô hình Server Socket Concurrency:',
      '- **Blocking I/O + Process/Thread-per-Connection** (Apache cổ điển): Dễ lập trình nhưng tốn RAM Stack (~1–8MB/thread) và nghẽn **Context Switch** khủng khiếp khi vượt vài nghìn thread.',
      '- **Connection Pooling** & Timeouts: Với DB chậm, luôn đặt giới hạn Thread Pool + đặt Timeout rõ ràng để không treo chết worker.',
      '- **Non-Blocking I/O + Event Loop** (Nginx, Node.js, Redis, Netty): Chỉ dùng 1 (hoặc vài = số nhân CPU) luồng cực nhanh! Mở kết nối nhưng KHÔNG đứng đợi; hễ khách nào thực sự gửi dữ liệu tới thì Kernel mới gọi ra xử lý ngay!',
    ],
    jargonBuster: [
      { term: 'C10K Problem', plain: 'Bài toán kỹ thuật kinh điển: thiết kế một máy chủ chịu tải trên 10.000 kết nối mạng đồng thời hiệu quả.' },
      { term: 'Blocking vs Non-Blocking', plain: 'Blocking bắt luồng ngủ chờ tới khi có dữ liệu; Non-Blocking trả lời ngay lập tức dù chưa có gì để luồng đi làm việc khác.' },
      { term: 'Thread Pool', plain: 'Đội nhân viên cố định nhận việc từ hàng đợi dùng chung thay vì tạo/hủy luồng liên tục.' },
    ],
    takeaway: 'Đừng bao giờ mở 1 OS Thread riêng cho mỗi kết nối khi phục vụ hàng chục nghìn user; chuyển sang mô hình Event Loop Non-Blocking (hoặc Goroutines/Virtual Threads).',
  },
  net_12_04: {
    analogy:
      'Nếu TCP Socket giống thuê đường dây điện thoại riêng 1-1 (`accept()` ra riêng từng số máy cho từng khách), thì **UDP Server Socket** giống như **một chiếc hộp thư duy nhất mở ngoài cổng nhà** (`recvfrom()`): Bất kỳ ai ngoài phố đi ngang qua cũng có thể ném một bức thư vào chung cái hộp thư `port 53` đó — mỗi bức thư cầm lên đều ghi kèm "Địa chỉ người vừa ném" để bạn biết đường ném trả lời lại (`sendto()`).',
    whyNeeded:
      'Viết DNS Server, Game Server tốc độ cao hay giao thức QUIC cần nắm rõ UDP Socket và mẹo "Connected UDP" (`connect()` trên UDP) để xử lý lỗi và tăng tốc.',
    deepExplanation: [
      'Cách UDP Server hoạt động chỉ với **1 Socket duy nhất** cho 100.000 khách hàng: Không có `listen()`, không có `accept()`! Chỉ `socket(AF_INET, SOCK_DGRAM)` -> `bind()` -> vòng lặp `recvfrom()` lấy `(data, client_ip_port)` -> xử lý -> `sendto(..., client_ip_port)`.',
      '**Connected UDP Socket**: Bình thường khi gửi UDP tới một địa chỉ không mở cổng, lỗi ICMP Port Unreachable trả về bị Kernel giấu nhẹm đi khiến app không biết! Khi Client gọi `connect()` trên UDP socket, OS **không** gửi gói bắt tay mạng nào cả — nó chỉ nhớ cố định sẵn đích vào Kernel để: (1) Dùng luôn `send()/recv()` gọn và nhanh hơn (khỏi tra Routing Table lại mỗi gói!), và (2) Nhận được ngay báo lỗi ICMP nếu đích đóng cổng!',
    ],
    jargonBuster: [
      { term: 'SOCK_DGRAM', plain: 'Loại Socket gửi nhận theo từng gói tin rời rạc độc lập (dùng cho UDP).' },
      { term: 'recvfrom / sendto', plain: 'Hàm đọc/gửi trên UDP luôn phải đọc/truyền kèm địa chỉ IP + Port của đối phương trong từng gói.' },
      { term: 'Connected UDP', plain: 'Gắn cố định 1 địa chỉ đích vào UDP Socket trong Kernel để gửi nhanh hơn và bắt được lỗi ICMP.' },
    ],
    takeaway: 'UDP Server dùng 1 Socket phục vụ tất cả khách; Client chỉ nói chuyện với 1 server cố định nên dùng Connected UDP cho nhanh và nhận được lỗi.',
  },
  net_12_05: {
    analogy:
      'Một anh phục vụ (1 Thread CPU) phải chăm **50.000 bàn khách (Socket FDs)** đang ngồi ăn. Làm sao biết bàn nào đang giơ tay gọi tính tiền mà không phải đi hỏi từng bàn? **`select` / `poll`** giống việc anh phục vụ cứ mỗi giây cầm sổ đi **hỏi từng bàn từ bàn 1 tới bàn 50.000** ("Bàn 1 có gọi gì không?... Bàn 2 có không?...") — cực kỳ mệt dù chỉ có 3 bàn gọi (`O(N)`)! Còn **`epoll` (Linux) / `kqueue` (macOS/iOS)** giống gắn **nút chuông gọi bàn không dây**: 50.000 bàn ngồi im ăn -> anh phục vụ ngồi nghỉ 0% CPU; bàn số #312 và #8999 bấm chuông -> bảng điện tử hiện thẳng đúng 2 số `[312, 8999]` (`O(1)`) để anh chạy thẳng tới phục vụ!',
    whyNeeded:
      'Chính `epoll` (trên Linux) và `kqueue` (trên macOS/iOS/BSD) là động cơ bí mật đứng sau hiệu năng khủng khiếp của **Nginx, Node.js (`libuv`), Redis, Netty, Go, Tokio Rust**!',
    deepExplanation: [
      'So sánh 4 thế hệ I/O Multiplexing:',
      '- **`select()` (cổ điển)**: Giới hạn cứng tối đa **1024 FD**, mỗi lần gọi phải copy cả mảng bit từ User lên Kernel rồi quét `O(N)`.',
      '- **`poll()`**: Bỏ giới hạn 1024 FD, nhưng vẫn phải copy toàn bộ danh sách N socket mỗi lần gọi (`O(N)`).',
      '- **`epoll()` (Linux) & `kqueue` (macOS/FreeBSD)**: Đăng ký danh sách FD vào Kernel đúng 1 lần (`epoll_ctl`). Sau đó gọi `epoll_wait()` chỉ trả về **đúng danh sách những FD thực sự có dữ liệu sẵn sàng (`O(1)` theo số kết nối đang hoạt động!)** -> 1 triệu kết nối nhàn rỗi vẫn gần 0% CPU! (Hỗ trợ cả Level-Triggered dễ viết và Edge-Triggered siêu nhanh cho Nginx).',
      '- **`io_uring` (Linux thế hệ mới nhất)**: Hai hàng đợi vòng Submission/Completion dùng chung RAM giữa User & Kernel -> làm cả Disk I/O lẫn Network I/O hoàn toàn bất đồng bộ với **gần như 0 System Call**!',
    ],
    jargonBuster: [
      { term: 'I/O Multiplexing', plain: 'Kỹ thuật cho phép 1 Thread duy nhất theo dõi hàng trăm nghìn kết nối mạng (FD) cùng một lúc.' },
      { term: 'epoll / kqueue', plain: 'Cơ chế Kernel thông báo sự kiện chuẩn trên Linux (epoll) và macOS/iOS (kqueue), chỉ trả về đúng các socket đang có dữ liệu.' },
      { term: 'io_uring', plain: 'Hệ thống I/O bất đồng bộ mới nhất trên Linux dùng ring buffer dùng chung RAM để đạt tốc độ kỷ lục.' },
    ],
    takeaway: '`epoll` (Linux) / `kqueue` (macOS) giúp 1 thread gánh hàng trăm nghìn kết nối nhàn rỗi ở độ phức tạp `O(1)` — nền tảng của Nginx, Redis, Node.js.',
  },

  // =========================================================================
  // MODULE 13: ENTERPRISE & INTERNET NETWORKING
  // =========================================================================
  net_13_01: {
    analogy:
      'Một công ty có phòng Kế toán, phòng Kỹ thuật và mạng Wi-Fi cho Khách ngồi cùng một tòa nhà cắm vào chung mấy con Switch vật lý. Để tiết kiệm tiền không phải mua 3 dàn Switch rời mà vẫn đảm bảo máy Khách không quét trộm được máy Kế toán, người ta dùng **VLAN (802.1Q)**: dán một cái **nhãn màu (Tag VLAN ID)** vào từng Ethernet Frame! Cùng đi chung trên một sợi dây nối các Switch (**Trunk Port** mang nhiều màu), nhưng ra tới cổng máy tính (**Access Port**) thì Switch tự bóc nhãn ra và chỉ cho máy cùng màu (cùng VLAN) thấy nhau!',
    whyNeeded:
      'Mạng doanh nghiệp chuẩn luôn tách VLAN Nhân viên, VLAN Server, VLAN Camera và VLAN Khách dù dùng chung phần cứng Switch để bảo mật và thu gọn Broadcast Domain.',
    deepExplanation: [
      'Cơ chế **IEEE 802.1Q VLAN Tagging**: Chèn thêm đúng **4 bytes Tag** vào giữa Ethernet Header (chứa 12-bit VLAN ID từ `1` đến `4094`).',
      '- **Access Port**: Cổng cắm thẳng tới 1 máy tính/camera — chỉ thuộc **1 VLAN duy nhất**; máy tính không biết gì về VLAN Tag.',
      '- **Trunk Port**: Cổng nối giữa 2 Switch với nhau (hoặc Switch lên Router) — cho phép nhiều VLAN cùng chạy qua trên 1 sợi dây bằng cách giữ nguyên 4-byte VLAN Tag để phân biệt!',
      'Giao tiếp giữa 2 VLAN (vd Nhân viên ở VLAN 10 muốn gọi máy in ở VLAN 20): Vì hai VLAN là hai mạng IP và Broadcast Domain tách rời nhau hoàn toàn -> bắt buộc phải đi qua **Router / Layer-3 Switch (Router-on-a-Stick)** để kiểm tra luật Firewall trước khi sang nhau!',
    ],
    jargonBuster: [
      { term: 'VLAN (802.1Q)', plain: 'Chia 1 dàn Switch vật lý thành nhiều mạng LAN ảo tách biệt hoàn toàn nhau bằng nhãn 4-byte.' },
      { term: 'Access Port vs Trunk Port', plain: 'Access cắm máy đầu cuối (1 VLAN); Trunk nối giữa các Switch/Router (chở nhiều VLAN cùng lúc).' },
      { term: 'Inter-VLAN Routing', plain: 'Định tuyến cho phép dữ liệu đi qua lại giữa hai VLAN khác nhau (qua Router hoặc L3 Switch).' },
    ],
    takeaway: 'VLAN (802.1Q) chia nhỏ mạng LAN ở Tầng 2 trên cùng phần cứng Switch: Access port cho 1 mạng, Trunk port cõng nhiều VLAN cùng lúc.',
  },
  net_13_02: {
    analogy:
      'Ngày xưa bảo mật công ty dùng kiểu **"Lâu đài & Hào nước"** (Perimeter Security): cứ ai bước chân vào được VPN hoặc văn phòng công ty rồi thì mặc định được tin cậy hoàn toàn, đi lại tự do khắp server bên trong -> hậu quả là hacker chỉ cần lừa chiếm 1 laptop nhân viên qua email phishing là quét sạch toàn bộ database công ty! **Zero-Trust (ZTNA)** thay đổi hoàn toàn tư duy: **"Không bao giờ mặc định tin ai, luôn luôn xác minh lại!"** — mỗi yêu cầu truy cập từng dịch vụ đều phải kiểm tra cả danh tính user, độ sạch thiết bị và quyền chi tiết bất kể ngồi ở nhà hay ngồi trong văn phòng!',
    whyNeeded:
      'Nhân viên ngày nay làm việc từ xa khắp nơi, app nằm rải ở AWS/GCP/SaaS -> "hào nước văn phòng" truyền thống không còn bảo vệ được dữ liệu doanh nghiệp nữa.',
    deepExplanation: [
      '3 nguyên tắc cốt lõi của **Zero-Trust Network Architecture (ZTNA)**:',
      '1. Verify Explicitly: Xác thực + Phân quyền mọi request dựa trên User + Thiết bị (đã cập nhật OS chưa?) + Vị trí + Hành vi bất thường.',
      '2. Least Privilege Access: Không cấp VPN chui vào nguyên dải mạng LAN `10.0.0.0/16`; chỉ cấp truy cập đúng 1 ứng dụng/port cụ thể cần làm việc (Identity-Aware Proxy).',
      '3. Assume Breach (Luôn giả định kẻ địch đã lọt vào trong): Dùng **Micro-segmentation** chặn cả lưu lượng đi ngang giữa các server nội bộ (East-West traffic) bằng mTLS và chính sách chặt chẽ.',
      'Enterprise Mesh VPN (như Tailscale, WireGuard Mesh): Tự động nối thẳng P2P bảo mật giữa laptop nhân viên và server nội bộ qua một bảng điều khiển phân quyền trung tâm mà không dồn nghẽn qua 1 con VPN cổng cũ.',
    ],
    jargonBuster: [
      { term: 'Zero-Trust (ZTNA)', plain: 'Kiến trúc an ninh "không mặc định tin tưởng bất kỳ ai kể cả khi đã vào mạng nội bộ" — xác minh từng ứng dụng.' },
      { term: 'Micro-segmentation', plain: 'Dựng tường lửa cô lập chi tiết tới từng dịch vụ/container bên trong mạng nội bộ để chặn hacker lây lan ngang.' },
      { term: 'Identity-Aware Proxy', plain: 'Cổng trung gian xác thực danh tính người dùng từng request trước khi cho chạm vào công cụ/server nội bộ.' },
    ],
    takeaway: 'Thay thế VPN chui vào cả mạng lớn bằng tư duy **Zero-Trust**: xác minh từng người, từng thiết bị và cấp quyền tới từng ứng dụng riêng lẻ.',
  },
  net_13_03: {
    analogy:
      'Mạng truyền thống giống việc muốn đổi luật giao thông toàn thành phố thì kỹ sư phải chạy xe tới **từng ngã tư đăng nhập cấu hình tay từng con Switch/Router**. **SDN (Software-Defined Networking)** gom hết bộ não (Control Plane) về **một Bảng điều khiển phần mềm trung tâm duy nhất**: ngồi 1 chỗ viết code điều khiển 1000 Switch! Còn **eBPF (trong Linux Kernel)** giống một **siêu năng lực lập trình thẳng vào mạch xử lý gói tin bên trong nhân Linux**: bạn viết đoạn code nhỏ an toàn chạy ở tốc độ dây mạng để lọc DDoS, đo hiệu năng hay thay thế `iptables` rùa bò trong Kubernetes!',
    whyNeeded:
      'Trong Data Center đám mây nơi hàng vạn Container bật tắt mỗi phút, cấu hình mạng bằng tay là bất khả thi — mọi thứ phải lập trình hóa bằng SDN và tăng tốc bằng eBPF.',
    deepExplanation: [
      '**SDN Architecture**: Tách Control Plane ra thành một Controller phần mềm tập trung (giao tiếp xuống Switch qua OpenFlow/OVSDB). Cho phép tự động tạo mạng ảo VPC ngay khi khách hàng bấm nút tạo Server trên Cloud!',
      '**eBPF (Extended Berkeley Packet Filter)**: Cách mạng lớn nhất của Linux Networking thập kỷ qua! Cho phép nạp các chương trình nhỏ đã được Kernel kiểm chứng an toàn (Verifier — đảm bảo không treo vòng lặp vô tận hay làm sập Kernel) gắn trực tiếp vào điểm nhận gói tin sớm nhất của card mạng (**XDP - eXpress Data Path**)!',
      'Sức mạnh thực tế: **Cilium** (dùng eBPF) thay thế `kube-proxy`/`iptables` trong Kubernetes giúp lọc DDoS và định tuyến hàng vạn dịch vụ cực nhanh không cần đi vòng qua bảng `iptables` chậm chạp!',
    ],
    jargonBuster: [
      { term: 'SDN', plain: 'Mạng định nghĩa bằng phần mềm: điều khiển tập trung toàn bộ Switch/Router qua API và code lập trình.' },
      { term: 'eBPF', plain: 'Công nghệ cho phép chạy các đoạn mã nhỏ an toàn trực tiếp bên trong nhân Linux để xử lý mạng/giám sát siêu tốc.' },
      { term: 'XDP', plain: 'Móc xử lý gói tin ngay tại driver card mạng trước khi Linux cấp phát bộ nhớ — dùng chặn DDoS hàng chục triệu gói/s.' },
    ],
    takeaway: 'SDN giúp lập trình mạng quy mô Cloud; **eBPF / XDP** cho phép xử lý gói tin ngay tại rìa nhân Linux nhanh gấp nhiều lần tường lửa `iptables` cũ.',
  },
  net_13_04: {
    analogy:
      'Server chính của website bạn đặt ở Mỹ, khách hàng ở Hà Nội mở web mà cứ mỗi cái ảnh logo, file JS, CSS lại phải bay nửa vòng Trái Đất sang Mỹ lấy về thì vừa chậm (300ms/lần!) vừa cháy máy chủ ở Mỹ! **CDN (Content Delivery Network - như Cloudflare, Akamai, CloudFront)** giống như việc mở **hàng trăm chi nhánh Cửa Hàng Tiện Lợi (Edge Server) ở ngay sát nhà người dùng tại Hà Nội, TP.HCM, Tokyo, London**! Khách ở Hà Nội bấm mở web -> chạy ra ngay chi nhánh ở Hà Nội lấy sẵn bản copy ảnh/JS trong 10ms (**Cache Hit**), chỉ khi nào chi nhánh chưa có (**Cache Miss**) mới chạy về Mỹ lấy 1 lần rồi cất luôn ở Hà Nội cho vạn người sau!',
    whyNeeded:
      'CDN vừa tăng tốc tải web gấp 5–10 lần cho người dùng toàn cầu, vừa giảm 80–90% tải và tiền băng thông cho Server gốc, vừa chắn luôn đòn tấn công DDoS ngoài rìa!',
    deepExplanation: [
      'Cách hoạt động kết hợp **Anycast DNS/IP + HTTP Caching**:',
      '1. Người dùng truy cập `cdn.site.com` -> BGP Anycast tự động dẫn tới **Edge PoP (Point of Presence)** gần địa lý nhất (Hà Nội/HCM).',
      '2. Edge kiểm tra `Cache-Control` (vd `max-age=31536000, immutable` cho file JS/CSS có gắn mã hash ở tên file như `index-BkUHMf94.js` -> lưu đệm cả năm không cần hỏi lại server gốc!).',
      '3. Nếu **Cache Hit**: trả ngay lập tức từ RAM/SSD của Edge trong 5–15ms! Nếu **Cache Miss**: Edge gọi về **Origin Server** lấy về, trả khách rồi tự lưu lại.',
      '4. **Cache Invalidation**: Khi cập nhật nội dung mới, có thể phát lệnh Purge Cache hoặc tốt nhất là đổi tên file theo hash (Content-Addressable URL).',
    ],
    jargonBuster: [
      { term: 'CDN Edge / PoP', plain: 'Các trạm máy chủ lưu đệm đặt tại hàng trăm thành phố khắp thế giới sát ngay người dùng cuối.' },
      { term: 'Cache Hit vs Cache Miss', plain: 'Hit = có sẵn bản sao tại trạm gần trả về ngay lập tức; Miss = chưa có nên phải chạy về Origin lấy.' },
      { term: 'Cache-Control Header', plain: 'Chỉ thị HTTP quy định xem trình duyệt và CDN được phép lưu nhớ bản sao trong bao nhiêu giây.' },
    ],
    takeaway: 'Gắn hash vào tên file tĩnh + `Cache-Control: max-age=31536000, immutable` + CDN Edge giúp web tải nhanh như điện khắp thế giới.',
  },
  net_13_05: {
    analogy:
      'Khi hệ thống có nhiều chi nhánh Server ở nhiều châu lục, ta cần những chiến thuật điều phối cao cấp: **Consistent Hashing** (chia tải sao cho khi 1 server Cache thêm vào hay chết đi, chỉ ~1/N người dùng bị đổi máy thay vì đảo lộn sạch cả hệ thống!); **Circuit Breaker (Cầu dao ngắt mạch)** giống cầu dao điện trong nhà: nếu thấy Backend B đang quá tải chết liên tiếp 5 lần, cầu dao tự ngắt lập tức trong 30 giây trả lỗi nhanh hoặc dữ liệu dự phòng để B có thời gian hồi sức chứ không giết chết dây chuyền toàn bộ app!',
    whyNeeded:
      'Khi làm việc ở quy mô hệ thống lớn, một dịch vụ con bị chậm có thể kéo theo toàn bộ các dịch vụ khác chết chùm (**Cascading Failure**) nếu không có Retry khôn ngoan + Timeout + Circuit Breaker.',
    deepExplanation: [
      '4 kỹ thuật chống sập dây chuyền ở Load Balancer / Service Mesh:',
      '1. **Consistent Hashing**: Sắp các Server và Key trên một vòng tròn Hash 360°. Thêm/bớt 1 máy chỉ làm dịch chuyển dữ liệu của vùng kề cạnh, giữ nguyên tỷ lệ Cache Hit của Redis/CDN!',
      '2. **Circuit Breaker (Closed -> Open -> Half-Open)**: Bình thường chạy bình thường (`Closed`); khi tỷ lệ lỗi vượt ngưỡng -> bật ngắt (`Open`) từ chối tức thì không dội thêm tải vào máy đang thoi thóp; sau 30s thử hé cửa (`Half-Open`) cho vài request qua thăm dò xem sống lại chưa.',
      '3. **Retry with Exponential Backoff + Jitter**: Lỡ lỗi mạng tạm thời đừng thử lại ngay lập tức 0ms hàng loạt (gây bão **Thundering Herd**!) — hãy đợi `1s -> 2s -> 4s` cộng thêm một khoảng ngẫu nhiên (`Jitter`).',
      '4. **Global Load Balancing (GSLB)** & **BGP Anycast**: Dẫn khách hàng châu Á về server Singapore, châu Âu về Frankfurt.',
    ],
    jargonBuster: [
      { term: 'Consistent Hashing', plain: 'Cách chia tải lên vòng tròn hash giúp thêm/rút bớt máy chủ mà không làm xáo trộn toàn bộ cache cũ.' },
      { term: 'Circuit Breaker', plain: 'Cầu dao tự ngắt: tạm ngưng gửi request vào dịch vụ con đang lỗi để nó kịp hồi phục và không làm treo toàn hệ thống.' },
      { term: 'Exponential Backoff + Jitter', plain: 'Chờ tăng dần theo cấp số nhân kèm độ lệch ngẫu nhiên trước khi thử gọi lại API lỗi, tránh bão kết nối.' },
    ],
    takeaway: 'Mọi lời gọi qua mạng đều bắt buộc phải có: **Timeout** ngắn + **Retry có Backoff & Jitter** + **Circuit Breaker** chống sập dây chuyền.',
  },

  // =========================================================================
  // MODULE 14: CLOUD, VPC & CONTAINER NETWORKING
  // =========================================================================
  net_14_01: {
    analogy:
      '**Cloud VPC (Virtual Private Cloud trên AWS/GCP)** giống như bạn thuê riêng **một khu đất rào kín rộng lớn trên Đám mây (`10.0.0.0/16`)**: Bên trong khu đất đó bạn tự chia làm 2 khu: **Public Subnet** (khu sảnh mặt tiền có cửa nối ra **Internet Gateway** — đặt Load Balancer/Web để khách bên ngoài vào) và **Private Subnet** (khu văn phòng hậu trường khóa kín không có cửa mở thẳng ra ngoài — đặt Database bảo mật tuyệt đối!). Khi máy ở Private Subnet cần ra ngoài tải bản vá phần mềm, nó phải mượn đường đi qua **NAT Gateway** một chiều!',
    whyNeeded:
      'Mọi lập trình viên/DevOps triển khai lên AWS, Google Cloud hay Azure đều phải vẽ được VPC, Subnet, Route Table, IGW và NAT Gateway ngay từ bước đầu tiên.',
    deepExplanation: [
      '4 thành phần xương sống của một Cloud VPC chuẩn sản xuất:',
      '1. **Public Subnet**: Route Table có dòng `0.0.0.0/0 -> Internet Gateway (IGW)`, và máy ở đây được gán Public IP để nhận truy cập 2 chiều từ Internet.',
      '2. **Private Subnet**: Route Table không trỏ thẳng ra IGW -> máy tính bên trong hoàn toàn ẩn khỏi Internet! Nếu muốn đi ra ngoài (tải gói `apt`, gọi API bên thứ 3) thì Route Table đẩy `0.0.0.0/0 -> NAT Gateway` (đặt ở Public Subnet) — chỉ cho phép **đi ra một chiều**, cấm người ngoài tự gọi vào!',
      '3. **Security Group (Stateful Firewall gắn vào từng máy)** vs **NACL (Stateless Firewall gắn ở cổng Subnet)**.',
      '4. **VPC Peering / PrivateLink**: Nối 2 VPC riêng với nhau qua mạng cáp nội bộ riêng của AWS/GCP với độ trễ cực thấp mà không hề chạm ra Internet công cộng!',
    ],
    jargonBuster: [
      { term: 'VPC (Virtual Private Cloud)', plain: 'Mạng ảo riêng tư biệt lập hoàn toàn của bạn nằm trên hạ tầng Đám mây AWS/GCP/Azure.' },
      { term: 'IGW vs NAT Gateway', plain: 'Internet Gateway mở đường 2 chiều cho Public Subnet; NAT Gateway cho Private Subnet đi ra ngoài 1 chiều an toàn.' },
      { term: 'Security Group', plain: 'Tường lửa ảo có nhớ trạng thái (Stateful) bọc xung quanh từng máy ảo EC2 hoặc Database.' },
    ],
    takeaway: 'Quy tắc vàng thiết kế Cloud VPC: Load Balancer/Bastion đặt ở **Public Subnet**; Backend Server & Database luôn giấu kín trong **Private Subnet**.',
  },
  net_14_02: {
    analogy:
      'Khi có hệ thống ở cả Tokyo, Singapore và Mỹ, **Cloud DNS (Route53 / Cloudflare DNS)** không chỉ là cuốn danh bạ tĩnh bình thường nữa — nó biến thành **Người Điều Hướng Giao Thông Toàn Cầu**: Bấm vào `api.myapp.com`, nếu bạn ở Việt Nam nó trả về IP máy chủ Singapore cho gần; nếu máy chủ Singapore bỗng nhiên chết (**DNS Health Check Failover**), trong vòng 30 giây nó tự đổi câu trả lời DNS trả IP của Tokyo để app tự hồi sinh! Còn **Private DNS** dùng nội bộ trong VPC giúp các app gọi nhau bằng tên đẹp `orders-db.internal` thay vì IP nhớ khó!',
    whyNeeded:
      'Không ai gắn chết địa chỉ IP bằng số vào code Backend nữa vì trên Cloud các máy chủ bật tắt đổi IP liên tục; DNS nội bộ và DNS toàn cầu là chất kết dính toàn bộ hệ thống.',
    deepExplanation: [
      'Các chính sách điều phối thông minh của Cloud DNS:',
      '- **Latency-Based / Geolocation Routing**: Trả IP Data Center có độ trễ thấp nhất hoặc đúng quốc gia của người dùng (tuân thủ luật dữ liệu từng nước).',
      '- **Weighted Routing (Canary Testing)**: Chia 95% người dùng vào phiên bản server cũ, 5% vào phiên bản mới để thử nghiệm an toàn!',
      '- **Failover Routing**: Gắn Health Check vào IP chính -> sập thì tự chuyển toàn bộ sang IP dự phòng.',
      '- **Split-Horizon (Private Hosted Zone)**: Cùng tên miền `auth.company.com`, người ngoài Internet hỏi -> ra IP cổng công cộng; máy chủ bên trong VPC hỏi -> trả thẳng Private IP `10.0.2.55` để đi đường nội bộ cho nhanh và đỡ tốn tiền cước ngoài!',
    ],
    jargonBuster: [
      { term: 'GSLB / Traffic Routing', plain: 'Điều hướng người dùng tới cụm server gần nhất hoặc chia % lưu lượng bằng DNS thông minh.' },
      { term: 'Canary Release (Weighted DNS)', plain: 'Cho 5% khách hàng thử nghiệm bản server mới trước khi nâng lên 100%.' },
      { term: 'Split-Horizon DNS', plain: 'Cùng một tên miền nhưng trả IP công cộng cho người ngoài và trả IP nội bộ cho máy trong cùng mạng VPC.' },
    ],
    takeaway: 'Cloud DNS làm luôn nhiệm vụ chia tải đa khu vực, chuyển hướng dự phòng tự động khi sập vùng và định danh dịch vụ nội bộ trong VPC.',
  },
  net_14_03: {
    analogy:
      'Trong hệ thống Microservices hiện đại với hàng trăm Container tự bật thêm hoặc tắt bớt liên tục theo tải (**Autoscaling**), IP của dịch vụ Thanh Toán sáng nay là `10.0.1.8`, chiều nay máy cũ chết bật lại 2 máy mới thành `.42` và `.99` -> Nếu dịch vụ Đặt Hàng lưu cứng IP cũ là đứt gánh ngay! **Service Discovery (như Consul, etcd, Kubernetes DNS)** giống một **Bảng Tin Sống Cập Nhật Từng Giây**: máy mới bật lên tự ghi tên *"Tôi là Payment tại 10.0.1.42, khỏe mạnh!"*, máy chết tự gạch tên; ai cần gọi Payment chỉ việc tra bảng tin theo tên!',
    whyNeeded:
      'Microservices chết là chuyện xảy ra hàng giờ trên Cloud. Service Discovery tự động hóa hoàn toàn việc tìm địa chỉ sống của nhau mà không cần con người sửa config.',
    deepExplanation: [
      '2 mô hình Service Discovery:',
      '1. **Client-Side Discovery**: App A tự hỏi Service Registry (Consul/Eureka) lấy danh sách 5 IP của App B đang sống -> rồi app A tự chọn 1 IP theo Round Robin gọi thẳng.',
      '2. **Server-Side Discovery (Phổ biến nhất trên Kubernetes)**: App A không cần code gì thông minh hết — chỉ việc gọi thẳng tên DNS cố định (`http://payment-service`), phía dưới **Load Balancer / `kube-proxy` / eBPF** tự tra bảng đăng ký mới nhất và chuyển tiếp tới 1 Pod Payment đang khỏe mạnh!',
      'Cơ chế **Heartbeat / Lease (TTL)**: Mỗi service phải gửi nhịp tim báo sống đều đặn mỗi 10 giây; tắt máy hay treo mất nhịp 30 giây là bị Registry gạch khỏi danh sách ngay.',
    ],
    jargonBuster: [
      { term: 'Service Discovery', plain: 'Hệ thống tự động đăng ký và tìm kiếm địa chỉ IP hiện thời của các dịch vụ đang thay đổi liên tục.' },
      { term: 'Service Registry', plain: 'Kho danh bạ thời gian thực (như etcd, Consul) lưu danh sách dịch vụ nào đang sống ở IP:Port nào.' },
      { term: 'Heartbeat / Health Lease', plain: 'Tín hiệu định kỳ chứng minh dịch vụ còn sống để khỏi bị xóa khỏi danh bạ.' },
    ],
    takeaway: 'Đừng bao giờ hardcode IP giữa các Microservice; dùng Service Discovery (như Kubernetes Service DNS) để mọi lời gọi tự tìm đúng instance đang sống.',
  },
  net_14_04: {
    analogy:
      'Làm sao 2 Docker Container trên cùng 1 máy chủ có IP riêng nói chuyện được với nhau và ra được Internet? Linux dùng phép ảo thuật cực hay: Đưa mỗi Container vào một **Network Namespace** riêng (giống một căn phòng có ổ cắm mạng riêng), rồi tạo ra một **Sợi Dây Mạng Ảo Hai Đầu (`veth pair`)** — một đầu cắm vào phòng Container (`eth0`), đầu kia cắm vào một **Cục Switch Ảo (`docker0 bridge`)** nằm ở máy thật! Khi 2 Container nằm ở 2 máy chủ vật lý khác nhau muốn nối mạng phẳng với nhau (**Overlay Network / VXLAN**), người ta bọc Ethernet Frame của Container vào bên trong một gói **UDP** gửi qua mạng vật lý giữa 2 máy!',
    whyNeeded:
      'Docker và Kubernetes Networking trông như ma thuật đen với người mới, nhưng thực chất toàn bộ đều lắp ghép từ các viên gạch Linux cực kỳ đơn giản bạn đã học ở các bài trên!',
    deepExplanation: [
      'Giải phẫu mạng 1 Container trên cùng máy:',
      '1. Network Namespace: Tạo không gian mạng riêng (`eth0`, Routing Table riêng, Port riêng -> 2 Container cùng chạy Port 80 không hề đụng nhau!).',
      '2. **`veth pair` (Virtual Ethernet Cable)**: Cặp cổng ảo sinh đôi — bit đi vào đầu này lập tức chui ra đầu kia!',
      '3. **Linux Bridge (`docker0`)**: Đóng vai trò Switch L2 ảo nối hàng chục đầu `veth` lại với nhau; kết hợp **NAT (`iptables` MASQUERADE)** để Container từ Private IP ảo đi ké Public IP của máy thật ra Internet.',
      '**Overlay VXLAN (CNI cho đa máy chủ)**: Bọc nguyên gói Layer-2 Ethernet của Pod A bên trong gói UDP port `4789` gửi từ Server 1 sang Server 2 -> Pod ở 2 máy khác nhau nói chuyện thẳng bằng IP riêng như thể cắm chung một con Switch!',
    ],
    jargonBuster: [
      { term: 'veth pair', plain: 'Sợi dây cáp mạng ảo trong nhân Linux nối không gian mạng của Container ra máy thật.' },
      { term: 'Linux Bridge', plain: 'Con Switch ảo chạy bằng phần mềm trong nhân Linux nối nhiều Container lại thành một mạng LAN ảo.' },
      { term: 'VXLAN Overlay / CNI', plain: 'Kỹ thuật bọc gói mạng ảo qua UDP để kết nối phẳng các Container nằm rải rác trên nhiều máy chủ khác nhau.' },
    ],
    takeaway: 'Mạng Container không có gì thần bí: chỉ là `Network Namespace` + dây ảo `veth pair` + `Linux Bridge` (và bọc VXLAN nếu chạy xuyên nhiều máy chủ).',
  },
  net_14_05: {
    analogy:
      'Trong một cụm **Kubernetes (K8s)**, các **Pod** (chứa Container) giống như **khách ở khách sạn đổi phòng liên tục**: Pod chết đi bật lại là có IP mới ngay! Để bên ngoài và các app khác không bị lạc mất nhau, K8s dựng 2 lớp biển hiệu cố định: **Service (`ClusterIP`)** làm **Số điện thoại nội bộ cố định bất biến** (tự động Load Balance qua `kube-proxy` / eBPF sang các Pod sống phía sau), còn **Ingress / Gateway API** chính là **Cổng L7 Lễ Tân duy nhất** ngoài mặt đường nhận tên miền `https://shop.com/api`, `https://shop.com/admin` rồi phân phát về đúng Service bên trong!',
    whyNeeded:
      'Đây là đỉnh cao tổng hợp của mọi bài Computer Networking trước đó: DNS + IP + NAT/eBPF + Reverse Proxy L7 + TLS + Container VXLAN hợp sức thành Kubernetes!',
    deepExplanation: [
      '4 đối tượng mạng cốt lõi trong Kubernetes:',
      '1. **Pod Networking**: Mọi Pod trong cả cụm có 1 IP riêng và giao tiếp trực tiếp được với nhau không cần NAT (nhờ plugin **CNI** như Calico, Cilium, Flannel).',
      '2. **K8s Service (`ClusterIP`, `NodePort`, `LoadBalancer`)**: Tạo một **Virtual IP (VIP)** cố định và tên miền tự động (nhờ **CoreDNS**, vd `my-db.default.svc.cluster.local`). `kube-proxy` (hoặc Cilium eBPF) tự viết luật dịch VIP đó sang IP thật của các Pod còn sống!',
      '3. **Ingress / Gateway API (Layer 7)**: Cho phép dùng chung 1 Public IP duy nhất cho hàng chục tên miền & đường dẫn HTTPS khác nhau (`api.a.com`, `web.a.com`), lo luôn SSL Termination!',
      '4. **NetworkPolicy**: Tường lửa nội bộ Kubernetes (mặc định Pod nào cũng gọi được nhau -> gắn NetworkPolicy để chỉ cho phép Pod Backend gọi vào Pod Database port `5432`, chặn thẳng tay mọi Pod khác!).',
    ],
    jargonBuster: [
      { term: 'Pod & CNI', plain: 'Pod là đơn vị chạy app nhỏ nhất trong K8s; CNI là plugin gán IP và nối mạng cho tất cả các Pod.' },
      { term: 'Service (ClusterIP) & CoreDNS', plain: 'Tạo địa chỉ IP ảo và tên miền nội bộ cố định, tự cân bằng tải sang nhóm Pod thay đổi phía sau.' },
      { term: 'Ingress / NetworkPolicy', plain: 'Ingress là cổng HTTP/HTTPS L7 vào cụm từ Internet; NetworkPolicy là tường lửa giới hạn Pod nào được gọi Pod nào.' },
    ],
    takeaway: 'K8s Networking ghép từ **CNI** (mạng Pod) + **Service + CoreDNS** (IP/tên ổn định) + **Ingress** (cổng L7 ngoài vào) + **NetworkPolicy** (tường lửa).',
  },
};
