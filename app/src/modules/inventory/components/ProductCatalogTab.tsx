import React, { useState, useEffect, useCallback } from 'react';
import { Package, RefreshCw, Search, Boxes } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { inventoryService } from '../services/inventory.service';
import { useTranslation } from 'react-i18next';
import { CatalogProduct } from './catalogTypes';
import { CatalogGrid } from './CatalogGrid';
import { CatalogDetailPanel } from './CatalogDetailPanel';

const ProductCatalogTab: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryService.getProductCatalog();
      setProducts(result.products || []);
    } catch (err: any) {
      console.error('Error fetching product catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await inventoryService.getProductCatalogItem(id);
      setDetailData(data);
    } catch (err: any) {
      console.error('Error fetching product detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    fetchDetail(product.id);
  };

  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (p.sku || '').toLowerCase().includes(s)
      || (p.productName || '').toLowerCase().includes(s)
      || (p.supplier || '').toLowerCase().includes(s)
      || (p.subSku || '').toLowerCase().includes(s)
      || (p.color || '').toLowerCase().includes(s);
  });

  // Summary stats
  const stats = {
    totalProducts: products.length,
    totalDeclared: products.reduce((a, p) => a + p.totalDeclared, 0),
    totalInStock: products.reduce((a, p) => a + p.inStock, 0),
    totalExported: products.reduce((a, p) => a + p.exported, 0),
    totalDefective: products.reduce((a, p) => a + p.defective, 0),
  };

  if (loading && products.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-200">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('inventory.product_catalog.title')}</h3>
            <p className="text-xs text-slate-500">{t('inventory.product_catalog.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchProducts} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: t('inventory.product_catalog.total_products'), value: stats.totalProducts, color: 'slate', icon: Boxes, suffix: t('common.products') },
        ].map((s, i) => (
          <Card key={i} className={`p-3 border-l-4 border-${s.color}-400 bg-${s.color}-50/20`}>
            <div className="flex items-center gap-2">
              <s.icon className={`w-4 h-4 text-${s.color}-500`} />
              <p className={`text-[10px] font-bold text-${s.color}-500 uppercase tracking-wider`}>{s.label}</p>
            </div>
            <p className={`text-xl font-black text-${s.color}-700 mt-1`}>
              {s.value.toLocaleString('vi-VN')}
              {s.suffix && <span className="text-xs font-normal text-slate-400 ml-1">{s.suffix}</span>}
            </p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('inventory.product_catalog.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
      </Card>

      {/* Product Table */}
      <Card className="overflow-hidden shadow-md">
        <CatalogGrid 
          products={products}
          filteredProducts={filteredProducts}
          selectedProduct={selectedProduct}
          onSelectProduct={handleSelectProduct}
        />
      </Card>

      {/* Product Detail Panel */}
      {selectedProduct && (
        <CatalogDetailPanel 
          selectedProduct={selectedProduct}
          onClose={() => { setSelectedProduct(null); setDetailData(null); }}
        />
      )}
    </div>
  );
};

export default ProductCatalogTab;