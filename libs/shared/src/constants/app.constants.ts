/** Category-based commission rates (percentage) */
export const COMMISSION_RATES: Record<string, number> = {
  grains: 5,
  spices: 10,
  oils: 8,
  nuts_dry_fruits: 10,
  pickles: 12,
  sweets: 12,
  fresh_produce: 7,
  herbs: 10,
  value_added: 15,
  default: 10,
};

/** Order number prefix */
export const ORDER_PREFIX = 'CF';

/** Cart expiry in seconds (Redis TTL) */
export const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** OTP expiry in seconds */
export const OTP_TTL_SECONDS = 300; // 5 minutes

/** Maximum items per cart */
export const MAX_CART_ITEMS = 50;

/** Minimum order amount in INR */
export const MIN_ORDER_AMOUNT = 99;

/** Free delivery threshold in INR */
export const FREE_DELIVERY_THRESHOLD = 499;

/** Default delivery charge in INR */
export const DEFAULT_DELIVERY_CHARGE = 40;

/** Vendor payout schedule */
export const VENDOR_PAYOUT_DAY = 'monday'; // weekly payouts

/** Image transformation presets for Cloudinary */
export const CLOUDINARY_PRESETS = {
  PRODUCT_THUMBNAIL: { width: 300, height: 300, crop: 'fill', quality: 'auto', format: 'webp' },
  PRODUCT_DETAIL: { width: 800, height: 800, crop: 'limit', quality: 'auto', format: 'webp' },
  VENDOR_AVATAR: { width: 200, height: 200, crop: 'fill', quality: 'auto', format: 'webp' },
  CATEGORY_BANNER: { width: 1200, height: 400, crop: 'fill', quality: 'auto', format: 'webp' },
} as const;

/** Supported delivery areas (Telangana pin code ranges) */
export const SUPPORTED_STATES = ['Telangana'] as const;
