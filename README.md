# NOETRIX — The Art of Becoming (iOS PWA + Windows PC + Cloudinary + Firebase)

Ứng dụng quản lý học tập, sáng tạo nội dung Instagram, rèn tư duy và chống xao nhãng được thiết kế riêng để bạn **tự duy trì mãi mãi** trên iPhone (cài như App thật qua PWA) và máy tính Windows.

## Các phân hệ tích hợp trong v1

1. **Hôm nay (`Today`)**:
   - Vòng tròn kỷ luật hằng ngày: **Học Code** (Web Core, Java Core, C# Core, LeetCode, Workflow AI + bấm giờ nhanh), **Học Tiếng Anh**, **Tập Gym** (chọn split) kèm **Streak linh hoạt** (tha thứ 1 ngày nghỉ phép) và **XP / Level** nhẹ nhàng.
   - Bộ đếm ngược tự động cho 2 lịch đăng Instagram: **Workflow (3 ngày/bài)** & **Tâm lý (7 ngày/bài)**.
   - Nút kích hoạt nhanh **Vòng quay chống TikTok** và ghi nhanh đọc sách / vẽ / đi bơi.

2. **Content Studio (`Content`)**:
   - **Kho Bài Giảng Workflow (nhịp 3 ngày/bài)**: Quản lý như hệ thống bài giảng cá nhân — checklist 5 bước, soạn **Doc song ngữ Việt / Anh** (hỗ trợ xem song song trên PC), **thư viện hình ảnh minh họa** (tự nén gọn, chú thích, phóng to), **phòng ghi âm bài giảng trực tiếp** trên iPhone/PC (nghe lại có chỉnh tốc độ `1x–2x`), và khu vực **Notes** riêng cho từng bài.
   - **IG Giải mã Hành vi Tâm lý (nhịp 7 ngày/bài)**: Quy trình chuẩn hóa `Viết Raw (VI)` → `Nghiên cứu chuẩn xác & Fact-check nguồn` → `Viết lại English` (có khung đối chiếu song song + nút copy nhanh).

3. **Vòng Quay Chống TikTok (`Quay!`)**:
   - Đặt ngay giữa thanh điều hướng iPhone để chạm 1 cái là quay khi sắp lướt TikTok vô ích.
   - Lọc theo thời gian rảnh (`Nhanh 5–10p`, `Vừa 15–20p`, `Sâu 30p+`, `Thư giãn`), tự thêm/sửa các ô, đi kèm **đồng hồ đếm ngược tập trung** và bộ đếm số lần thắng TikTok.

4. **Học Tập Chuyên Sâu (`Học tập`)**:
   - **Code Core**: Lộ trình 5 trụ cột (Web, Java, C#, LeetCode, Workflow AI) + Nhật ký LeetCode theo Pattern.
   - **Cờ Vua nghiêm túc từ đầu**: Giáo trình 5 giai đoạn bài bản + 4 Nguyên tắc Vàng chống blunder + Nhật ký phân tích ván đấu.
   - **Sudoku Logic Lab**: Bỏ thói quen chơi Expert cảm tính — sổ tay kỹ thuật logic (Locked Candidates, Pairs, X-Wing, XY-Wing, Skyscraper, Swordfish, Unique Rectangle, Simple Coloring) + Nhật ký ván Expert đo tỷ lệ **0 Đoán mò (Pure Logic %)**.

5. **Kho Riêng (`Kho riêng`)**:
   - **Tủ Sách (Chống bệnh mua mà không đọc)**: Theo dõi sách tồn kho chưa đọc, nút **Bốc ngẫu nhiên 1 cuốn**, lưu lại *"Lý do hồi xưa từng mua"*, nút `+10 trang` và lưu trích dẫn hay.
   - **Xưởng Viết Truyện dài hơi**: Lưu nhiều dự án truyện với Chương (có **Focus Writing Mode** toàn màn hình + đếm từ), Nhân vật, Thế giới quan/Lore, Hộp Ý tưởng rời, và nút **Xuất bản thảo `.md`**.
   - **Vẽ & Đi bơi**: Sổ tay không áp lực — chụp lưu tranh vẽ thành gallery và ghi cự ly bơi.

---

## 1. Chạy thử trên máy tính Windows

```powershell
cd D:\FPT\game\noetrix
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`. App hoạt động **Offline Local-First 100%** ngay lập tức không cần cấu hình gì trước.

---

## 2. Cấu hình & Deploy lên Firebase (Dùng mãi mãi trên iPhone & PC)

### Bước 1: Tạo dự án trên Firebase Console
1. Truy cập https://console.firebase.google.com → tạo project mới (ví dụ: `my-life-os`).
2. Vào **Authentication** → **Sign-in method** → bật **Google**.
3. Vào **Firestore Database** → tạo database (chọn region `asia-southeast1` Singapore cho nhanh ở Việt Nam).
4. *(Để đồng bộ ảnh & file ghi âm giữa iPhone và PC)* Vào **Storage** → bật Cloud Storage.
5. Vào **Project Settings** → **Your apps** → bấm biểu tượng Web (`</>`) để lấy `firebaseConfig`.

### Bước 2: Điền cấu hình vào `.env.local`
Copy file `.env.example` thành `.env.local` và điền thông tin từ bước 1:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ALLOWED_EMAIL=email_google_cua_ban@gmail.com
```

> **Mẹo khóa bảo mật 1 mình bạn dùng:** Mở `firestore.rules` và `storage.rules`, thay `YOUR_EMAIL@gmail.com` bằng email Google của bạn và bỏ dấu `//` trước dòng kiểm tra email!

### Bước 3: Deploy lên Firebase Hosting
```powershell
cd D:\FPT\game\noetrix
firebase login
firebase use --add   # Chọn project Firebase bạn vừa tạo
npm run deploy
```

Firebase sẽ trả về link HTTPS cố định dạng `https://<project-id>.web.app`.

---

## 3. Cài như App thật lên màn hình chính iPhone

1. Mở link `https://<project-id>.web.app` bằng trình duyệt **Safari** trên iPhone.
2. Bấm biểu tượng **Chia sẻ (Share)** ở cạnh dưới màn hình.
3. Kéo xuống chọn **Thêm vào MH chính (Add to Home Screen)** → bấm **Thêm**.
4. Mở icon **LifeOS** ngay trên màn hình chính iPhone — chạy full-screen, không thanh địa chỉ, hỗ trợ ghi âm bài giảng, lưu ảnh, chạy offline và không bao giờ hết hạn!
