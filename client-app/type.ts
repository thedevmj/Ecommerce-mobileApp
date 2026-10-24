export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  images?: string[];
  brand?: string;
  stock?: number;
  compareAtPrice?: number;
  rating: { rate: number; count: number };
}

export interface CartItem {
  product: Product;
  quantity: number;
}
