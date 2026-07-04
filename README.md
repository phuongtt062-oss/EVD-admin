# EVD · Quản lý tài liệu

Portal Angular quản lý tài liệu (EVD) — UI HTML/CSS thuần, không dùng thư viện component.

## Yêu cầu

- **Node.js** 20+
- **npm** 10+

## Cài đặt & chạy

```bash
npm install
npm run dev
```

Lệnh `dev` khởi động đồng thời:

- **API mock** — `http://localhost:3000` (json-server, dữ liệu `server/db.json`)
- **Web app** — `http://localhost:4200` (proxy `/api` → API mock)

Chỉ chạy frontend (cần API đang chạy riêng):

```bash
npm start
```

## Đăng nhập

| Vai trò | Username | Password   | Quyền |
|---------|----------|------------|-------|
| ADMIN   | `admin`  | `admin123` | Xem / sửa / xóa tất cả tài liệu |
| STAFF   | `staff`  | `staff123` | Chỉ xem / sửa tài liệu của mình, không xóa |

URL: [http://localhost:4200/login](http://localhost:4200/login)

## Tính năng

- Danh sách tài liệu: mã, tiêu đề, danh mục, trạng thái, người tạo, ngày tạo
- Phân trang, tìm kiếm theo mã/tiêu đề, lọc theo trạng thái & danh mục
- Thêm mới qua modal form (có validation)
- Sửa trực tiếp trên bảng (inline edit), lưu từng dòng hoặc hàng loạt
- Import CSV / Excel (`.xlsx`) — parse bằng Web Worker, upload theo batch, hiển thị progress & lỗi
- Xóa có xác nhận (chỉ ADMIN)
- Phân quyền theo tài khoản đăng nhập

## Import file

Cột bắt buộc: `code`, `title`, `category`, `status`

| Cột      | Giá trị hợp lệ |
|----------|----------------|
| category | `CONTRACT`, `INVOICE`, `REPORT` |
| status   | `DRAFT`, `ACTIVE`, `ARCHIVED` |

File mẫu trong `src/assets/`:

- `sample-import.csv` — 3 dòng
- `sample-import-100.csv` — 100 dòng
- `sample-import.xlsx` — Excel

Rule validation dùng chung FE/BE: `shared/document-rules.json`

### Test import lại (reset dữ liệu)

Sau khi import, dữ liệu được ghi vào `server/db.json`. Import **cùng file lần nữa** sẽ báo lỗi `code already exists` vì mã tài liệu đã tồn tại.

Để reset về trạng thái ban đầu và test import lại:

1. **Dừng** `npm run dev` (Ctrl+C).
2. **Khôi phục** `server/db.json` về bản gốc:

   ```bash
   git checkout -- server/db.json
   ```

   Hoặc xóa thủ công các bản ghi import (giữ lại 5 tài liệu mẫu `EVD-001` … `EVD-005`).

3. **Chạy lại** app:

   ```bash
   npm run dev
   ```

4. **Reload** trang trình duyệt (F5) — json-server nạp lại file khi khởi động.

> **Lưu ý:** Sửa `db.json` khi API đang chạy có thể không có hiệu lực ngay vì json-server giữ bản copy trong memory. Luôn restart server sau khi reset file.

**Không cần reset session:** Đăng nhập lưu riêng trong `localStorage` (`evd_session`), reset `db.json` không làm đăng xuất.

## Dữ liệu

- Lưu tại `server/db.json` qua API mock
- Session đăng nhập lưu `localStorage` (key `evd_session`)

## Cấu trúc thư mục

```
src/app/
├── core/              # Auth, guards, interceptors, constants, services dùng chung
├── shared/            # Layout, modal, toast, pagination, ...
└── features/
    ├── auth/          # Trang đăng nhập
    └── evd/           # Quản lý tài liệu
        ├── components/
        ├── pages/
        ├── services/
        ├── workers/   # Web Worker parse CSV/Excel
        └── utils/

server/                # API mock (json-server)
shared/                # Validation rules dùng chung FE + BE
```

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | API + frontend (khuyến nghị) |
| `npm start` | Chỉ frontend (port 4200) |
| `npm run server` | Chỉ API mock (port 3000) |
| `npm run build` | Build production |
| `npm test` | Unit tests (Karma) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier format |

## Tech stack

- Angular 20 — standalone components, signals, lazy routes
- RxJS
- HTML/CSS thuần
- SheetJS (`xlsx`) — parse Excel trong Web Worker
- json-server — API mock
