export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type Product = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  specifications?: Array<{ label: string; value: string }>;
  isVisible?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: ProductCategory | null;
};

export type CartProduct = {
  id: number;
  title: string;
  slug: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  category?: ProductCategory | null;
};

export type CartItem = {
  id: number | string;
  quantity: number;
  product: CartProduct;
};

export type Cart = {
  id: number;
  userId: number;
  items: CartItem[];
};

export type AuthUser = {
  userId: number;
  email: string;
  role?: string;
};

export type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  authReady: boolean;
  cartCount: number;
  login: (nextToken: string) => void;
  logout: () => void;
  refreshCartCount: () => Promise<void>;
};

export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number | string;
};

export type PaymentMethod = 'bank_transfer';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export type AdminOrderStatusOption = OrderStatus;

export type Order = {
  id: number;
  userId?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: string;
  paymentMethod?: PaymentMethod;
  total: number | string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
  customerType?: 'guest' | 'registered';
  accountName?: string | null;
  accountEmail?: string | null;
};

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
};

export type ProductSpecificationFormState = {
  label: string;
  value: string;
};

export type ProductFormState = {
  id?: number;
  title: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  categoryId: string;
  isVisible: boolean;
  featured: boolean;
  specifications: ProductSpecificationFormState[];
};
