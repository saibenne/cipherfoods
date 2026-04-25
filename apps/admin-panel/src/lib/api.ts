const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

interface ApiError {
  message: string;
  statusCode: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('admin_access_token', access);
  localStorage.setItem('admin_refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('admin_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const json = await res.json();
    const data = json?.data ?? json;
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, auth = true, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const fetchBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers,
    body: fetchBody,
  });

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...rest,
        headers,
        body: fetchBody,
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      error: { message: 'Something went wrong', statusCode: res.status },
    })) as { error?: ApiError; message?: string; statusCode?: number };
    const error: ApiError = body.error ?? { message: body.message ?? 'Something went wrong', statusCode: body.statusCode ?? res.status };
    throw error;
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T>(endpoint: string, opts?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...opts, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, opts?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...opts, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, opts?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...opts, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, opts?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...opts, method: 'PATCH', body }),

  delete: <T>(endpoint: string, opts?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...opts, method: 'DELETE' }),
};

export const auth = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: AdminUser }>(
      '/auth/login',
      { email, password },
      { auth: false },
    ),
  getToken,
  setTokens,
  clearTokens,
};

// --- Admin API ---

export const dashboard = {
  getStats: () => api.get<DashboardStats>('/admin/dashboard'),
};

export const orders = {
  list: (params?: string) => api.get<OrderListResponse>(`/admin/orders${params ? `?${params}` : ''}`),
  getById: (id: string) => api.get<Order>(`/admin/orders/${encodeURIComponent(id)}`),
};

export const vendors = {
  list: (params?: string) => api.get<VendorListResponse>(`/vendors${params ? `?${params}` : ''}`),
  getById: (id: string) => api.get<Vendor>(`/vendors/${encodeURIComponent(id)}`),
  approve: (id: string) => api.post(`/vendors/${encodeURIComponent(id)}/approve`),
  reject: (id: string, reason?: string) =>
    api.post(`/vendors/${encodeURIComponent(id)}/reject`, { reason }),
};

export const promotions = {
  list: (params?: string) =>
    api.get<CouponListResponse>(`/promotions/coupons${params ? `?${params}` : ''}`),
  create: (data: CreateCouponPayload) => api.post<Coupon>('/promotions/coupons', data),
  deactivate: (id: string) => api.put(`/promotions/coupons/${encodeURIComponent(id)}/deactivate`),
};

export const support = {
  listTickets: (params?: string) =>
    api.get<TicketListResponse>(`/support/admin/tickets${params ? `?${params}` : ''}`),
  getTicket: (id: string) => api.get<Ticket>(`/support/admin/tickets/${encodeURIComponent(id)}`),
  reply: (id: string, message: string) =>
    api.post(`/support/admin/tickets/${encodeURIComponent(id)}/reply`, { message }),
  resolve: (id: string) =>
    api.put(`/support/admin/tickets/${encodeURIComponent(id)}/resolve`),
};

export const faq = {
  list: () => api.get<FAQ[]>('/support/faq'),
  create: (data: CreateFAQPayload) => api.post<FAQ>('/support/faq', data),
  update: (id: string, data: Partial<CreateFAQPayload>) =>
    api.put<FAQ>(`/support/faq/${encodeURIComponent(id)}`, data),
  delete: (id: string) => api.delete(`/support/faq/${encodeURIComponent(id)}`),
};

export const config = {
  get: async (): Promise<PlatformConfig> => {
    const res = await api.get<{key: string, value: string}[]>('/admin/config');
    const obj: any = {};
    if (Array.isArray(res)) {
      res.forEach(item => {
        let val: any = item.value;
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === 'object' && parsed !== null) val = parsed;
        } catch {
          if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val);
        }
        obj[item.key] = val;
      });
    }
    return obj as PlatformConfig;
  },
  updateKey: (key: string, value: any) => api.put('/admin/config', { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) }),
  update: async (data: Partial<PlatformConfig>) => {
    for (const [key, value] of Object.entries(data)) {
      await api.put('/admin/config', { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) });
    }
    return config.get();
  },
};

export const auditLogs = {
  list: (params?: string) =>
    api.get<AuditLogListResponse>(`/admin/audit-logs${params ? `?${params}` : ''}`),
};

export const categories = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; description?: string; imageUrl?: string }) =>
    api.post<Category>('/categories', data),
  update: (id: string, data: { name?: string; description?: string; imageUrl?: string }) =>
    api.put<Category>(`/categories/${encodeURIComponent(id)}`, data),
  delete: (id: string) => api.delete(`/categories/${encodeURIComponent(id)}`),
};

export const products = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any>(`/products${qs}`, { auth: false });
  }
};

export const users = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ items: AdminManagedUser[]; total: number }>(`/admin/users${qs}`);
  },
  getById: (id: string) => api.get<AdminManagedUser>(`/admin/users/${encodeURIComponent(id)}`),
  ban: (id: string) => api.put(`/admin/users/${encodeURIComponent(id)}/ban`),
  unban: (id: string) => api.put(`/admin/users/${encodeURIComponent(id)}/unban`),
  changeRole: (id: string, role: string) =>
    api.put(`/admin/users/${encodeURIComponent(id)}/role`, { role }),
};

export const adminNotifications = {
  list: () => api.get<AdminNotification[]>('/notifications'),
  send: (data: { title: string; message: string; target: string }) =>
    api.post('/admin/notifications/broadcast', data),
};

// --- Media ---
export interface MediaRecord {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  type: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  alt?: string;
}

export const media = {
  getSignedParams: (type: string, folder?: string) =>
    api.post<{ signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string }>('/media/sign', { type, folder }),
  confirm: (data: { publicId: string; url: string; secureUrl: string; type: string; format?: string; width?: number; height?: number; bytes?: number; alt?: string }) =>
    api.post<MediaRecord>('/media/confirm', data),
};

export async function uploadToCloudinary(
  file: File,
  type: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  const params = await media.getSignedParams(type);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', params.apiKey);
  formData.append('timestamp', String(params.timestamp));
  formData.append('signature', params.signature);
  formData.append('folder', params.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${params.cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();

  // Confirm upload with backend
  await media.confirm({
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
    type,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  });

  return { url: data.secure_url, publicId: data.public_id, secureUrl: data.secure_url };
}

// --- Types ---

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalVendors: number;
  totalUsers: number;
  recentOrders: Order[];
  ordersByStatus: Record<string, number>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description: string | null;
  phoneNumber: string;
  email: string | null;
  address: {
    addressLine1: string;
    addressLine2?: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
  } | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  status: string;
  kycStatus: string;
  kycDocuments: {
    aadhaarUrl?: string;
    panUrl?: string;
    fssaiUrl?: string;
    bankPassbookUrl?: string;
  } | null;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  } | null;
  averageRating: number;
  totalOrders: number;
  totalEarnings: number;
  commissionRate: number;
  isActive: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorListResponse {
  items: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  usageLimit: number;
  expiresAt: string;
}

export interface CouponListResponse {
  coupons: Coupon[];
  total: number;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: string;
  priority: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQPayload {
  question: string;
  answer: string;
  category: string;
  order?: number;
}

export interface HomeSlide {
  id: string;
  imageUrl: string;
  type: 'category' | 'product';
  targetId: string;
}

export interface PlatformConfig {
  commissionRate: number;
  minOrderValue: number;
  deliveryFeeBase: number;
  deliveryFeePerKm: number;
  freeDeliveryThreshold: number;
  maxDeliveryRadius: number;
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  heroVideoUrl?: string;
  homeSlideshow?: HomeSlide[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'banned';
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body?: string;
  message?: string;
  type: string;
  target: string;
  createdAt: string;
}
