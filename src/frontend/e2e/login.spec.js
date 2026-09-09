import { test, expect } from '@playwright/test'

// Bộ test mẫu cho luồng đăng nhập.
//
// Cả 4 case dưới đây CHẠY ĐƯỢC KHI BACKEND ĐANG TẮT — chúng chỉ kiểm tra phần
// frontend tự quyết: route guard, render, điều hướng, validation của trình duyệt.
// Nhờ vậy chạy `npm run test:e2e` không cần dựng Docker/FastAPI trước.
//
// Muốn test đăng nhập THẬT (gọi /auth/login) thì phải có backend chạy + tài khoản
// seed sẵn — xem ghi chú ở cuối file.

test.describe('Trang đăng nhập', () => {
  test('chưa đăng nhập mà vào trang chủ thì bị đẩy về /login', async ({ page }) => {
    await page.goto('/')

    // Layout.jsx: `if (!user) return <Navigate to="/login" .../>`
    await expect(page).toHaveURL(/\/login$/)
  })

  test('hiển thị đủ tiêu đề, 2 ô nhập và nút đăng nhập', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()

    // CHÚ Ý: trong Login.jsx các <label> không có htmlFor và <input> không có id,
    // nên chúng KHÔNG liên kết với nhau. Vì vậy ở đây không dùng được
    // getByLabel('Email') — phải bắt theo type. Nếu sau này thêm id/htmlFor cho
    // form (nên làm, vừa hợp chuẩn accessibility vừa giúp trình đọc màn hình)
    // thì đổi 2 dòng dưới sang getByLabel cho dễ đọc hơn.
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled()
  })

  test('bấm "Đăng ký" thì sang trang /signup', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: 'Đăng ký' }).click()

    await expect(page).toHaveURL(/\/signup$/)
  })

  test('submit form rỗng thì không rời khỏi trang login', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    // Hai input đều có thuộc tính `required` nên trình duyệt chặn submit tại chỗ.
    // Không có request nào bay đi, URL giữ nguyên.
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })
})

// ---------------------------------------------------------------------------
// Bước tiếp theo khi muốn test luồng cần backend
// ---------------------------------------------------------------------------
// 1. Bật backend:  docker compose up -d  (ở thư mục gốc đồ án)
// 2. Viết test đăng nhập thật:
//
//      await page.locator('input[type="email"]').fill('hr@hirewise.test')
//      await page.locator('input[type="password"]').fill('matkhau')
//      await page.getByRole('button', { name: 'Đăng nhập' }).click()
//      await expect(page).toHaveURL('/')
//
// 3. Để khỏi phải đăng nhập lại ở MỌI test, đăng nhập một lần rồi lưu phiên:
//      npx playwright codegen --save-storage=e2e/.auth/hr.json http://localhost:5173/login
//    rồi trong config thêm `use: { storageState: 'e2e/.auth/hr.json' }`.
//    NHỚ cho e2e/.auth/ vào .gitignore — file đó chứa token đăng nhập thật.
