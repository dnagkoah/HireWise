import { defineConfig, devices } from '@playwright/test'

// Test end-to-end cho frontend HireWise.
//
// Chạy:  npm run test:e2e          (headless, dùng cho CI / chạy nhanh)
//        npm run test:e2e:ui       (mở giao diện, xem từng bước, sửa test tại chỗ)
//
// Playwright TỰ khởi động Vite dev server trước khi test (xem khối `webServer`
// bên dưới) nên không cần mở sẵn `npm run dev` ở terminal khác.
const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',

  // screenshots.spec.js KHÔNG phải test — nó là bộ chụp ảnh cho README: chạy có giao
  // diện (bật cửa sổ trình duyệt) và GHI ĐÈ docs/screenshots/. Để nó nằm trong lượt
  // `npm run test:e2e` thì mỗi lần chạy test lại nháy cửa sổ và sửa file trong repo.
  // Chụp bằng lệnh riêng:  npm run screenshots
  testIgnore: ['**/screenshots.spec.js'],

  // Chạy các file test song song. Mỗi file là một worker riêng nên test ở file
  // này không thấy state (cookie, localStorage) của file kia.
  fullyParallel: true,

  // Trên CI, `test.only` bị bỏ quên trong code sẽ khiến cả bộ test chỉ chạy đúng
  // một case mà vẫn báo xanh. Cấu hình này biến nó thành lỗi build.
  forbidOnly: !!process.env.CI,

  // Máy cá nhân: fail là fail, khỏi retry cho nhanh. CI thì cho 2 lần vì runner
  // hay chậm bất thường (mạng, cold start) gây fail giả.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? 'line' : [['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,

    // Ghi lại trace khi một test fail rồi được retry. Mở xem bằng:
    //   npx playwright show-trace test-results/<ten-test>/trace.zip
    // Trace tua lại từng bước kèm ảnh DOM, network, console — debug nhanh hơn
    // nhiều so với đọc log.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // CHỈ khai báo chromium. Máy này mới tải mỗi Chromium (xem
  // PLAYWRIGHT_BROWSERS_PATH -> D:\DevTools\playwright-browsers). Thêm firefox
  // hoặc webkit vào đây mà chưa chạy `playwright install firefox webkit` thì
  // test sẽ fail với "Executable doesn't exist" chứ không phải lỗi code.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,

    // Đang mở sẵn `npm run dev` thì dùng luôn server đó thay vì bật cái thứ hai
    // (cổng 5173 bị chiếm sẽ làm Vite nhảy sang 5174 và test gõ nhầm cổng).
    // Trên CI luôn bật server sạch.
    reuseExistingServer: !process.env.CI,

    // Vite khởi động nhanh, nhưng lần đầu sau khi cài thêm package thì nó phải
    // pre-bundle dependency (esbuild) nên có thể lâu hơn mặc định 60s.
    timeout: 120_000,

    // Đổi thành 'pipe' nếu cần đọc log của Vite khi test fail lúc khởi động.
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
