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
  return localStorage.getItem('vendor_access_token');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('vendor_access_token', access);
  localStorage.setItem('vendor_refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('vendor_access_token');
  localStorage.removeItem('vendor_refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('vendor_refresh_token');
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
    ...customHeaders as Record<string, string>,
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

  delete: <T>(endpoint: string, opts?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...opts, method: 'DELETE' }),
};

// --- Auth ---
export const auth = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: VendorUser }>(
      '/auth/login', { email, password, role: 'vendor' }, { auth: false }
    ),
  register: (name: string, email: string, password: string, phoneNumber: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: VendorUser }>(
      '/auth/register', { name, email, password, phoneNumber, role: 'vendor' }, { auth: false }
    ),
  getToken,
  setTokens,
  clearTokens,
};

// --- Vendor profile ---
export const vendor = {
  getProfile: () => api.get<VendorProfile>('/vendors/me'),
  updateProfile: (data: Partial<VendorProfile>) => api.put<VendorProfile>('/vendors/me', data),
  register: (data: { businessName: string; description?: string; phoneNumber: string; email?: string; address: { addressLine1: string; district: string; state: string; pincode: string } }) =>
    api.post<VendorProfile>('/vendors/register', data),
  submitKyc: (data: KycData) => api.post<VendorProfile>('/vendors/me/kyc', data),
  getEarnings: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<EarningsResponse>(`/vendors/me/earnings${qs}`);
  },
};

// --- Catalog (vendor-scoped) ---
export const catalog = {
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ProductsResponse>(`/products/vendor/my-products${qs}`);
  },
  getProduct: (id: string) => api.get<Product>(`/products/${encodeURIComponent(id)}`),
  createProduct: (data: ProductFormData) => api.post<Product>('/products', data),
  updateProduct: (id: string, data: ProductFormData) =>
    api.put<Product>(`/products/${encodeURIComponent(id)}`, data),
  deleteProduct: (id: string) =>
    api.delete(`/products/${encodeURIComponent(id)}`),
  getCategories: () => api.get<Category[]>('/categories', { auth: false }),
};

// --- Inventory ---
export const inventory = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<InventoryItem[]>(`/inventory${qs}`);
  },
  update: (productId: string, data: { stock: number }) =>
    api.put<InventoryItem>(`/inventory/${encodeURIComponent(productId)}`, data),
  getLowStock: () => api.get<InventoryItem[]>('/inventory/low-stock/list'),
  getExpiring: () => api.get<InventoryItem[]>('/inventory/expiring/list'),
};

// --- Orders (vendor-scoped) ---
export const orders = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<OrdersResponse>(`/orders/vendor${qs}`);
  },
  get: (id: string) => api.get<Order>(`/orders/${encodeURIComponent(id)}`),
  updateStatus: (id: string, status: string) =>
    api.put<Order>(`/orders/${encodeURIComponent(id)}/status`, { status }),
};

// --- Reviews ---
export const reviews = {
  getVendorReviews: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ReviewsResponse>(`/reviews/vendor/me${qs}`);
  },
  reply: (reviewId: string, reply: string) =>
    api.post<Review>(`/reviews/${encodeURIComponent(reviewId)}/reply`, { reply }),
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

// Helper to upload file to Cloudinary directly
export async function uploadToCloudinary(
  file: File,
  type: string,
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  const params = await media.getSignedParams(type);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', params.apiKey);
  formData.append('timestamp', String(params.timestamp));
  formData.append('signature', params.signature);
  formData.append('folder', params.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
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

// --- Delivery ---
export const delivery = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<DeliveriesResponse>(`/delivery/vendor${qs}`);
  },
  create: (data: { orderId: string; method: string }) =>
    api.post<DeliveryInfo>('/delivery', data),
  getByOrder: (orderId: string) =>
    api.get<DeliveryInfo>(`/delivery/order/${encodeURIComponent(orderId)}`),
  estimate: (data: { origin: string; destination: string; weight: number }) =>
    api.post<DeliveryEstimate>('/delivery/estimate', data),
};

// --- Notifications ---
export const notifications = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<NotificationsResponse>(`/notifications${qs}`);
  },
  markAsRead: (id: string) => api.put<void>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllAsRead: () => api.put<void>('/notifications/read-all'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
};

// --- Customers ---
export const customers = {
  list: () => api.get<CustomerRow[]>('/vendors/me/customers'),
};

// --- Helpers ---
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Types ---
export interface VendorUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
  };
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  kycDocuments?: {
    aadhaarUrl?: string;
    panUrl?: string;
    fssaiUrl?: string;
    bankPassbookUrl?: string;
  };
  businessHours?: Record<string, { open: string; close: string }>;
  logo?: string;
  status: string;
  kycStatus: string;
  isActive: boolean;
  totalEarnings: number;
  totalOrders: number;
  averageRating: number;
  commissionRate: number;
  createdAt: string;
}

export interface KycData {
  aadhaarUrl?: string;
  panUrl?: string;
  fssaiUrl?: string;
  bankPassbookUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  images: { url: string; publicId: string; alt?: string }[];
  category?: Category;
  categoryId?: string;
  variants?: Variant[];
  unit: string;
  weight?: number;
  isFeatured?: boolean;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface Variant {
  id?: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  weight?: number;
  unit?: string;
  stockQuantity?: number;
}

export interface ProductFormData {
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  images: { url: string; publicId: string; alt?: string }[];
  categoryId?: string;
  variants?: Omit<Variant, 'id'>[];
  unit: string;
  weight?: number;
  isFeatured?: boolean;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface InventoryItem {
  id: string;
  product: { id: string; name: string; images: string[] };
  stock: number;
  lowStockThreshold: number;
  expiryDate?: string;
  isLowStock: boolean;
  isExpiring: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  customer: { id: string; name: string; phone: string; email: string };
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  id: string;
  product: { id: string; name: string; image?: string };
  variant?: { id: string; name: string };
  quantity: number;
  price: number;
}

export interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reply?: string;
  customer: { id: string; name: string };
  product: { id: string; name: string };
  createdAt: string;
}

export interface ReviewsResponse {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EarningsResponse {
  totalRevenue: number;
  thisMonthRevenue: number;
  pendingPayout: number;
  totalOrders: number;
  payouts: Payout[];
  monthlyBreakdown: { month: string; revenue: number; orders: number }[];
}

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  reference?: string;
}

export interface DeliveryInfo {
  id: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  events: { status: string; timestamp: string; description: string }[];
}

export interface DeliveryEstimate {
  estimatedDays: number;
  cost: number;
  carrier: string;
}

export interface DeliveriesResponse {
  items: DeliveryInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerRow {
  userId: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}
