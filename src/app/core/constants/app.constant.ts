export const APP_ROUTES = {
  LOGIN: '/login',
  DOCUMENTS: '/evd/documents',
} as const;

export const ROLE_ADMIN = 'ADMIN' as const;
export const ROLE_STAFF = 'STAFF' as const;
export const USER_ROLES = [ROLE_ADMIN, ROLE_STAFF] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const APP_API_PATHS = {
  DOCUMENTS: '/documents',
} as const;

export const STORAGE_KEYS = {
  SESSION: 'evd_session',
} as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
export const FILTER_ALL_LABEL = 'Tất cả';

export const DEMO_USERS = [
  { username: 'admin', password: 'admin123', email: 'admin@lotte.com', role: ROLE_ADMIN },
  { username: 'staff', password: 'staff123', email: 'staff@lotte.com', role: ROLE_STAFF },
] as const;

export const APP_MENU_ITEMS = [{ label: 'Quản lý tài liệu', route: APP_ROUTES.DOCUMENTS }];
