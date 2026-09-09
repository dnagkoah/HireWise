import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Chụp ảnh màn hình cho README — KHÔNG phải test kiểm tra hành vi.
//
// Vì sao là một file spec chứ không phải script rời: cấu hình Playwright đã lo sẵn
// việc dựng Vite, chọn Chromium và đặt baseURL. Viết lại những thứ đó trong một
// script riêng chỉ để đổi tên lệnh chạy là thừa.
//
// ─────────────────────────────────────────────────────────────────────────────
// CÁCH DÙNG — hai bước, và MẬT KHẨU KHÔNG BAO GIỜ ĐI QUA DÒNG LỆNH
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. Đăng nhập một lần rồi lưu phiên ra file (Playwright tự mở cửa sổ trình duyệt;
//    đăng nhập xong thì ĐÓNG cửa sổ, phiên được ghi lại):
//
//      cd src/frontend
//      npx playwright open --save-storage=e2e/.auth/hr.json http://localhost:5173/login
//
//    Muốn chụp cả Cổng quản trị thì làm thêm một lần nữa với tài khoản admin và
//    lưu vào e2e/.auth/admin.json.
//
// 2. Chụp (lệnh riêng — bộ chụp bị `testIgnore` khỏi `npm run test:e2e`
//    vì nó ghi đè docs/screenshots/ và bật cửa sổ trình duyệt):
//
//      npm run screenshots
//
// File phiên nằm dưới e2e/.auth/ — thư mục này đã bị .gitignore loại trừ vì nó
// CHỨA TOKEN THẬT. Đừng commit.
//
// Không có file phiên nào thì các case tương ứng tự `skip`, chỉ trang đăng nhập
// (vốn công khai) được chụp — nên lệnh trên vẫn chạy được trên máy sạch.

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(HERE, '../../../docs/screenshots')
const AUTH_DIR = path.resolve(HERE, '.auth')

const HR_STATE = path.join(AUTH_DIR, 'hr.json')
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json')

const hasHr = fs.existsSync(HR_STATE)
const hasAdmin = fs.existsSync(ADMIN_STATE)

// Khung hình 16:10 đủ rộng để bảng xếp hạng không bị cắt cột, và vẫn vừa chiều
// ngang mặc định của GitHub khi nhúng vào README.
//
// CHẠY CÓ GIAO DIỆN (headless: false) — bắt buộc, không phải sở thích. Chromium
// headless không có trình đọc PDF tích hợp, nên khung "CV GỐC" trong màn hình chi
// tiết ứng viên (một <iframe> trỏ vào blob PDF) chỉ hiện ra một ô trắng. Mà đó lại
// đúng là tấm ảnh đắt nhất: điểm số phân rã nằm ngay cạnh CV gốc.
//
// `headless` phải khai ở cấp TỆP: Playwright từ chối `test.use({ headless })` bên
// trong describe vì nó buộc phải mở một worker mới.
test.use({ viewport: { width: 1440, height: 900 }, headless: false })

fs.mkdirSync(OUT_DIR, { recursive: true })

/**
 * Chờ trang lặng rồi mới chụp. `networkidle` không đủ: vài màn hình poll
 * `/jds/{id}/candidates` khi đang chấm CV nên mạng không bao giờ "idle", và ảnh
 * chụp lúc skeleton còn hiện thì vô dụng.
 */
async function snap(page, name) {
  await page.waitForLoadState('domcontentloaded')
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 20_000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: false })
}

test('trang đăng nhập', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()
  await snap(page, '01-dang-nhap.png')
})

/** Dự án có nhiều ứng viên nhất — ảnh mới cho thấy bảng xếp hạng thật sự. */
async function busiestJdId(page) {
  const jds = await page.evaluate(async () => {
    const res = await fetch('/jds', {
      headers: { Authorization: `Bearer ${localStorage.getItem('autorecruit_token')}` },
    })
    return res.ok ? res.json() : []
  })
  return [...jds].sort((a, b) => (b.candidate_count ?? 0) - (a.candidate_count ?? 0))[0]?.id
}

// MỖI MÀN HÌNH MỘT TEST, không gộp thành một lượt dài.
//
// Bản gộp từng vượt trần 30 giây của Playwright ở màn hình thứ sáu, và thông báo
// khi đó ("locator.click timeout") chỉ tay vào nút Copilot chứ không phải nguyên
// nhân thật. Tách ra thì mỗi ảnh có ngân sách thời gian riêng, và ảnh nào hỏng thì
// biết đúng ảnh đó.
test.describe('các màn hình của HR', () => {
  test.skip(!hasHr, 'Chưa có e2e/.auth/hr.json — xem hướng dẫn đầu file')
  test.use({ storageState: hasHr ? HR_STATE : undefined })

  test('bảng điều khiển', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15_000 })
    await snap(page, '02-bang-dieu-khien.png')
  })

  test('tạo dự án', async ({ page }) => {
    await page.goto('/projects/new')
    await snap(page, '03-tao-du-an.png')
  })

  test('chi tiết dự án', async ({ page }) => {
    await page.goto('/')
    const id = await busiestJdId(page)
    expect(id, 'tài khoản này chưa có dự án nào để chụp').toBeTruthy()
    await page.goto(`/projects/${id}`)
    await snap(page, '04-chi-tiet-du-an.png')
  })

  // Trang /shortlisting mở ra là màn hình CHỌN DỰ ÁN, trông gần như hệt bảng điều
  // khiển — chụp ngay ở đó thì được một tấm ảnh thừa. Bảng xếp hạng thật nằm sau
  // một cú bấm, và không deep-link được: Shortlisting đọc `location.state.projectId`
  // của react-router chứ không đọc query param.
  async function moBangXepHang(page) {
    await page.goto('/shortlisting')
    // getByRole, KHÔNG phải locator('button'): thẻ dự án là <div role="button">
    // (ProjectCard.jsx L49 — vì nút xoá nằm bên trong, mà <button> lồng <button>
    // là HTML không hợp lệ). Bộ chọn theo tên thẻ không khớp được nó.
    const the = page.getByRole('button').filter({ hasText: 'Rút gọn' }).first()
    await expect(the).toBeVisible({ timeout: 15_000 })
    await the.click()
    await expect(page.getByText('Bảng xếp hạng')).toBeVisible({ timeout: 15_000 })
  }

  test('bảng xếp hạng ứng viên', async ({ page }) => {
    await moBangXepHang(page)
    await snap(page, '05-bang-xep-hang.png')
  })

  test('chi tiết ứng viên', async ({ page }) => {
    await moBangXepHang(page)
    await page.getByRole('button', { name: 'Xem chi tiết ứng viên' }).first().click()

    // Bảng điểm theo trục là thứ đáng chụp: điểm tổng, trọng số từng trục, và các
    // dòng bằng chứng trích từ CV.
    await expect(page.getByText('ĐIỂM THEO TỪNG TRỤC')).toBeVisible({ timeout: 20_000 })

    // Khung "CV GỐC" là <iframe> trỏ vào blob URL — modal phải tải PDF kèm token rồi
    // mới dựng được URL đó (CandidateDetailModal.jsx L36).
    await expect(page.locator('iframe')).toHaveAttribute('src', /^blob:/, {
      timeout: 30_000,
    })
    await page.waitForTimeout(3_000) // trình đọc PDF vẽ xong trang đầu

    await snap(page, '06-chi-tiet-ung-vien.png')
  })

  test('khung chat Copilot', async ({ page }) => {
    // Một lượt hỏi đáp thật (LLM + tool qua MCP) nên rộng tay hơn 30 giây mặc định.
    test.setTimeout(120_000)
    await page.goto('/')

    // KHÔNG có nút mở ở khung 1440px: thanh chứa nút Sparkles là `lg:hidden`, còn
    // khung chat từ `lg` trở lên là CỘT CỐ ĐỊNH bên phải (xem CopilotChat.jsx L227).
    // Bản trước bấm nút đó nên treo tới hết giờ rồi báo nhầm là "không thấy nút".
    const goiY = page.getByRole('button', { name: 'Đang mở tuyển những vị trí nào?' })
    await expect(goiY).toBeVisible({ timeout: 15_000 })
    await goiY.click()

    // Các nút gợi ý biến mất khi cuộc trò chuyện bắt đầu; "Đang xử lý…" biến mất
    // khi agent trả lời xong.
    await expect(goiY).toHaveCount(0)
    await expect(page.getByText('Đang xử lý…')).toHaveCount(0, { timeout: 90_000 })

    await snap(page, '07-copilot.png')
  })

  test('mẫu email', async ({ page }) => {
    await page.goto('/settings/email-templates')
    await snap(page, '08-mau-email.png')
  })

  test('thùng rác', async ({ page }) => {
    await page.goto('/trash')
    await snap(page, '09-thung-rac.png')
  })
})

test.describe('cổng quản trị', () => {
  test.skip(!hasAdmin, 'Chưa có e2e/.auth/admin.json — xem hướng dẫn đầu file')
  test.use({ storageState: hasAdmin ? ADMIN_STATE : undefined })

  test('chụp Cổng quản trị', async ({ page }) => {
    await page.goto('/admin')
    await snap(page, '10-cong-quan-tri.png')
  })
})
