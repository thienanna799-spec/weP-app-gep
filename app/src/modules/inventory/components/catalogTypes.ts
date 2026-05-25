export interface CatalogProduct {
  id: string;
  sku: string;
  supplier: string;
  productName: string;
  subSku: string;
  color: string;
  specification: string;
  otherSpecs: string;
  costPrice: number | null;
  totalDeclared: number;
  inStock: number;
  exported: number;
  defective: number;
  totalRolls: number;
  createdAt: string;
  batches: { id: string; quantity: number; createdAt: string; note: string | null }[];
}
