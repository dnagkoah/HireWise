# Ảnh màn hình

Ảnh trong thư mục này được **sinh tự động**, đừng chụp tay rồi thả vào — chụp tay
thì mỗi lần một kích thước, một tỷ lệ zoom, và README trông vá víu.

Bộ chụp là [`src/frontend/e2e/screenshots.spec.js`](../../src/frontend/e2e/screenshots.spec.js).
Nó dùng lại cấu hình Playwright của frontend nên tự dựng Vite, tự chọn Chromium và
chụp ở khung 1440×900.

## Chụp lại

Hệ thống phải đang chạy (`docker compose up -d`) và tài khoản dùng để chụp phải có
sẵn dự án lẫn ứng viên — tài khoản trống thì mọi màn hình đều là trạng thái rỗng.

**Bước 1 — đăng nhập một lần rồi lưu phiên.** Playwright mở một cửa sổ trình duyệt;
đăng nhập xong thì đóng cửa sổ lại, phiên được ghi ra file:

```bash
cd src/frontend
npx playwright open --save-storage=e2e/.auth/hr.json http://localhost:5173/login
```

Làm thêm một lần với tài khoản admin, lưu vào `e2e/.auth/admin.json`, nếu muốn chụp
cả Cổng quản trị.

**Bước 2 — chụp:**

```bash
npm run screenshots
```

> Mật khẩu **không bao giờ đi qua dòng lệnh hay biến môi trường** — nó sẽ nằm lại
> trong lịch sử shell. Thư mục `e2e/.auth/` chứa token đăng nhập thật và đã bị
> `.gitignore` loại trừ; đừng commit.
>
> Chưa có file phiên nào thì các case tương ứng tự `skip` và chỉ trang đăng nhập
> (vốn công khai) được chụp — nên lệnh trên vẫn chạy được trên máy sạch.

## Danh sách ảnh

| Tệp | Màn hình | Dùng trong README |
|---|---|:--:|
| `01-dang-nhap.png` | Đăng nhập | |
| `02-bang-dieu-khien.png` | Bảng điều khiển — lưới dự án | ✓ |
| `03-tao-du-an.png` | Tạo dự án — nhập JD và đính kèm ZIP CV | ✓ |
| `04-chi-tiet-du-an.png` | Chi tiết dự án — JD do AI sinh, tiến độ chấm CV | ✓ |
| `05-bang-xep-hang.png` | Bảng xếp hạng ứng viên | ✓ |
| `06-chi-tiet-ung-vien.png` | Chi tiết ứng viên — điểm theo trục + CV gốc | ✓ |
| `07-copilot.png` | Khung chat Copilot | ✓ |
| `08-mau-email.png` | Mẫu email | ✓ |
| `09-thung-rac.png` | Thùng rác | |
| `10-cong-quan-tri.png` | Cổng quản trị | |

Ảnh không đánh dấu vẫn được chụp nhưng không nhúng vào README: trang đăng nhập không
nói lên điều gì về sản phẩm, còn Thùng rác trên máy đang chụp đang trống nên chỉ ra
một trạng thái rỗng.

## Dữ liệu cá nhân

Ảnh 04, 05 và 06 chụp từ dữ liệu thật nên **hiện tên và địa chỉ email của ứng viên
thật**. Repo này để công khai (ví dụ đính kèm CV xin việc) thì phải xử lý trước: chụp
lại bằng một tài khoản chứa CV giả, hoặc bôi vùng chứa tên và email.
