import base from './playwright.config.js'

// Cấu hình riêng cho bộ CHỤP ẢNH README (e2e/screenshots.spec.js).
//
// Vì sao tách khỏi playwright.config.js: bộ chụp không phải test. Nó chạy có giao
// diện và ghi đè docs/screenshots/, nên config chính đã `testIgnore` nó để
// `npm run test:e2e` không nháy cửa sổ và không sửa file trong repo. Ở đây đảo lại:
// chỉ nhận đúng tệp đó.
//
// Chạy:  npm run screenshots      (xem hướng dẫn đăng nhập ở đầu screenshots.spec.js)
export default {
  ...base,
  testIgnore: [],
  testMatch: ['**/screenshots.spec.js'],

  // Một worker: các case dùng chung thư mục ảnh đầu ra, và chạy song song thì nhiều
  // cửa sổ trình duyệt cùng bật lên chồng nhau.
  workers: 1,
  reporter: 'line',
}
