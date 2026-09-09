# HireWise — Frontend

Single-page app React + Vite + Tailwind CSS v4. Toàn bộ dữ liệu lấy từ FastAPI
backend ở [`../backend`](../backend) — không còn dữ liệu giả nào trong mã nguồn.

## Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Khung | React 18 + react-router-dom 6 |
| Build | Vite 6 |
| CSS | Tailwind CSS v4 (plugin `@tailwindcss/vite`, không cần file config) |
| Icon | lucide-react |
| Biểu đồ | SVG viết tay, không thêm thư viện chart |
| Test | Playwright (chromium) |

## Chạy

```bash
cd src/frontend
npm install
npm run dev        # http://localhost:5173
```

`npm run build` sinh bản production trong `dist/`, `npm run preview` phục vụ bản đó.

Dev server **proxy** mọi prefix của backend (`/auth`, `/jds`, `/candidates`,
`/shortlists`, `/interviews`, `/agent`, `/admin/`, ...) sang
`http://localhost:8000`, nên phía Python **không cần cấu hình CORS**. Danh sách
đầy đủ nằm trong [`vite.config.js`](vite.config.js).

> **Bẫy đã gặp:** vài route SPA trùng tên với prefix router của backend. `/admin`
> phải khớp bằng regex `^/admin/` thì trang Cổng quản trị mới không bị proxy nuốt,
> còn trang mẫu email phải đặt ở `/settings/email-templates` vì backend có endpoint
> trần `/email-templates`. Nhấn F5 trên một route bị nuốt sẽ trả JSON thay vì ứng
> dụng. Đọc chú thích trong `vite.config.js` trước khi thêm route mới.

## Luồng sử dụng

App xoay quanh **dự án** — mỗi dự án là một chiến dịch tuyển cho một JD.

1. **Bảng điều khiển** (`/`) — lưới thẻ dự án, hoặc trạng thái rỗng mời tạo dự án đầu tiên.
2. **Tạo dự án** (`/projects/new`) — nhập mô tả công việc bằng ngôn ngữ tự nhiên,
   LLM sinh JD có cấu trúc; đính kèm file `.zip` chứa CV ngay ở bước này.
3. **Chi tiết dự án** (`/projects/:id`) — JD do AI sinh, các lô upload và tiến độ
   chấm điểm, bảng xếp hạng ứng viên, nút mở danh sách rút gọn.
4. **Danh sách rút gọn** (`/shortlisting`) — bảng xếp hạng theo dự án, so sánh ứng
   viên, sinh câu hỏi phỏng vấn, chấm câu trả lời, chốt nhận/loại và gửi mail.
5. **Mẫu email** (`/settings/email-templates`) — soạn thư mời phỏng vấn / báo kết
   quả bằng trình soạn thảo có token động và tệp đính kèm.
6. **Thùng rác** (`/trash`) — dự án đã xoá mềm, khôi phục hoặc xoá vĩnh viễn.
7. **Cổng quản trị** (`/admin`, chỉ role `admin`) — quản lý tài khoản, nhật ký hệ
   thống / audit / lời gọi LLM, chỉ số nghiệp vụ, thông báo toàn hệ thống.

Khung **Copilot** nổi trên mọi trang: HR gõ yêu cầu bằng tiếng Việt, agent gọi
tool qua MCP để tra cứu, tạo JD, sinh câu hỏi phỏng vấn hay gửi thư — và điều
hướng luôn màn hình đang mở tới đúng chỗ vừa nhắc tới.

## Phân quyền phía client

`RoleRoute` trong [`App.jsx`](src/App.jsx) đẩy người dùng về "nhà" của role mình
(`admin` → `/admin`, `hr_staff` → `/`) khi vào nhầm route. Đây **chỉ là tiện ích
điều hướng** — lớp chặn thật nằm ở backend: mọi endpoint nghiệp vụ đều lọc theo
chủ sở hữu (`app/core/ownership.py`) và kiểm tra role (`app/core/dependencies.py`).

Đăng ký yêu cầu tên, email, mật khẩu và xác nhận mật khẩu. Phần khớp mật khẩu và
tối thiểu 8 ký tự kiểm tra **hoàn toàn trong trình duyệt**; chỉ
`{ username, email, password }` được gửi lên `POST /auth/register`.

## Kiểm thử

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # xem từng bước, sửa test tại chỗ
npm run test:e2e:report   # mở báo cáo HTML lần chạy trước
```

Playwright tự khởi động Vite trước khi chạy (hoặc dùng lại server đang mở ở cổng
5173). Bộ test đăng nhập hiện tại **chạy được khi backend đang tắt** — nó chỉ kiểm
tra phần frontend tự quyết: route guard, render, điều hướng, validation của trình
duyệt. Xem [`playwright.config.js`](playwright.config.js) và [`e2e/`](e2e).

## Chụp ảnh cho README

```bash
npm run screenshots
```

[`e2e/screenshots.spec.js`](e2e/screenshots.spec.js) sinh toàn bộ ảnh trong
[`docs/screenshots/`](../../docs/screenshots). Nó **không** nằm trong `npm run
test:e2e` (config chính `testIgnore` nó) vì đây là công cụ, không phải test: nó chạy
có giao diện và ghi đè file trong repo. Cách lưu phiên đăng nhập để chụp các màn hình
cần quyền HR nằm ở đầu tệp spec và trong
[`docs/screenshots/README.md`](../../docs/screenshots/README.md).

## Cấu trúc

```
src/
├── api/            Một file cho mỗi nhóm endpoint; client.js là wrapper fetch
│                     (gắn Bearer token, dịch lỗi backend sang thông báo tiếng Việt)
├── components/     Layout, Sidebar, Topbar, CopilotChat, các modal ứng viên /
│                     phỏng vấn / đánh giá, TokenEditor + RichTextToolbar cho mẫu
│                     email, ui.jsx chứa primitive dùng chung
├── context/        AuthContext (token + user), ProjectContext (dự án & ứng viên),
│                     ToastContext, PageContext (trang hiện tại công bố ngữ cảnh
│                     cho Copilot biết mà tô sáng / mở đúng bản ghi)
├── pages/          Một file cho mỗi màn hình trong danh sách ở trên
├── utils/          Định dạng ngày giờ và tên, chuẩn hoá thông báo lỗi,
│                     làm sạch HTML mẫu email, hook tải lại sau thao tác của agent
├── App.jsx         Bảng route + RoleRoute
└── main.jsx        Điểm vào
```
