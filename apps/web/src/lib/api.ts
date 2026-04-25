function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === 'undefined') return 'http://localhost:3000/api/v1';
  return '/api/v1';
}

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
  return localStorage.getItem('access_token');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${getApiBase()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const json = await res.json();
    const data = (json?.data ?? json) as { accessToken: string; refreshToken: string };
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
    'Content-Type': 'application/json',
    ...customHeaders as Record<string, string>,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const base = getApiBase();
  const isServer = typeof window === 'undefined';
  let res = await fetch(`${base}${endpoint}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...(isServer ? { cache: 'no-store' as const } : {}),
  });

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${base}${endpoint}`, {
        ...rest,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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

export const auth = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login', { email, password }, { auth: false }
    ),

  register: (data: RegisterData) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/register', data, { auth: false }
    ),

  setTokens,
  clearTokens,
  getToken,
};

export const catalog = {
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ProductsResponse>(`/products${qs}`, { auth: false });
  },

  getProduct: (id: string) =>
    api.get<Product>(`/products/${encodeURIComponent(id)}`, { auth: false }),

  getCategories: () =>
    api.get<Category[]>('/categories', { auth: false }),
};

export const config = {
  getPublic: () =>
    api.get<{ platformName?: string; supportEmail?: string; supportPhone?: string; heroVideoUrl?: string }>('/public-config', { auth: false }),
};

export const cart = {
  get: () => api.get<Cart>('/cart'),

  addItem: (productId: string, quantity: number, variantId?: string) =>
    api.post<Cart>('/cart/items', { productId, quantity, variantId }),

  updateItem: (itemId: string, quantity: number) =>
    api.put<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity }),

  removeItem: (itemId: string) =>
    api.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`),
};

export const orders = {
  create: (data: CreateOrderData) =>
    api.post<Order>('/orders', data),

  list: () =>
    api.get<Order[]>('/orders'),

  get: (id: string) =>
    api.get<Order>(`/orders/${encodeURIComponent(id)}`),
};

export const payments = {
  createOrder: (orderId: string) =>
    api.post<RazorpayOrder>('/payments/create-order', { orderId }),

  verify: (data: PaymentVerification) =>
    api.post<{ success: boolean }>('/payments/verify', data),
};

export const reviews = {
  getByProduct: (productId: string) =>
    api.get<Review[]>(`/reviews/product/${encodeURIComponent(productId)}`, { auth: false }),

  create: (data: CreateReviewData) =>
    api.post<Review>('/reviews', data),
};

export const promotions = {
  validateCoupon: (code: string, cartTotal: number) =>
    api.post<CouponResult>('/promotions/coupons/validate', { code, cartTotal }),

  getActive: () =>
    api.get<Promotion[]>('/promotions/active', { auth: false }),
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  images: { url: string; publicId: string; alt?: string }[];
  category?: Category;
  categoryId?: string;
  vendorId?: string;
  variants?: Variant[];
  unit: string;
  weight?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
}

export interface Variant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  salePrice?: number;
  stockQuantity?: number;
  weight?: number;
  unit?: string;
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
  imageUrl?: string;
  description?: string;
  productCount?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: Variant;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

export interface CreateOrderData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  paymentMethod: 'online' | 'cod';
  couponCode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
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
  product: Product;
  variant?: Variant;
  quantity: number;
  price: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface Review {
  id: string;
  user: { id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewData {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface CouponResult {
  valid: boolean;
  discount: number;
  message?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  image?: string;
  expiresAt: string;
}
