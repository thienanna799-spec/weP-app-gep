import React, { useState, useEffect, useRef } from 'react';
import { PackagePlus, Plus, Zap, Loader2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { inventoryService } from '../services/inventory.service';

interface Props {
  sku: string; setSku: (v: string) => void;
  productName: string; setProductName: (v: string) => void;
  subSku: string; setSubSku: (v: string) => void;
  specification: string; setSpecification: (v: string) => void;
  color: string; setColor: (v: string) => void;
  otherSpecs: string; setOtherSpecs: (v: string) => void;
  costPrice: string; setCostPrice: (v: string) => void;
  supplier: string; setSupplier: (v: string) => void;
  note: string; setNote: (v: string) => void;
  quickImport: boolean; setQuickImport: (v: boolean) => void;
  quantity: string; setQuantity: (v: string) => void;
  creating: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

const BatchCreateForm: React.FC<Props> = ({
  sku, setSku, productName, setProductName, subSku, setSubSku,
  specification, setSpecification, color, setColor, otherSpecs, setOtherSpecs,
  costPrice, setCostPrice, supplier, setSupplier, note, setNote,
  quickImport, setQuickImport, quantity, setQuantity, creating, onSubmit, onCancel,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState<'sku' | 'subSku' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string, type: 'sku' | 'subSku') => {
    if (type === 'sku') setSku(val);
    else setSubSku(val);
    
    setShowDropdown(type);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoadingSuggestions(true);
    try {
      const results = await inventoryService.lookupSubSku(val.trim());
      setSuggestions(results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    setSku(item.sku || '');
    setSubSku(item.subSku || '');
    setProductName(item.productName || '');
    setSpecification(item.specification || '');
    setColor(item.color || '');
    setOtherSpecs(item.otherSpecs || '');
    setCostPrice(item.costPrice ? item.costPrice.toString() : '');
    setSupplier(item.supplier || '');
    setShowDropdown(null);
  };

  return (
    <Card className="p-5 space-y-4 border-2 border-violet-200 bg-violet-50/30 animate-in fade-in slide-in-from-top-2 overflow-visible">
      <h4 className="text-sm font-bold text-violet-700 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Tạo lô nhập mới
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative" ref={dropdownRef}>
        <div className="space-y-1 relative">
          <label className="text-xs font-bold text-slate-600">SKU</label>
          <Input 
            placeholder="VD: BWP-OPP" 
            value={sku} 
            onChange={(e: any) => handleSearch(e.target.value, 'sku')}
            onFocus={() => { if (sku.length >= 2) handleSearch(sku, 'sku'); }}
            className="h-9 text-sm" 
          />
          {showDropdown === 'sku' && suggestions.length > 0 && (
            <div className="absolute z-50 w-full top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <div key={idx} onClick={() => handleSelectSuggestion(item)} className="px-3 py-2 hover:bg-violet-50 cursor-pointer border-b border-slate-100 last:border-0">
                  <div className="font-bold text-sm text-slate-800">{item.sku || '—'}</div>
                  <div className="text-[10px] text-slate-500">{item.productName} • {item.supplier}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600">XƯỞNG (Nhà cung cấp)</label>
          <Input placeholder="Tùy chọn..." value={supplier} onChange={(e: any) => setSupplier(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1 lg:col-span-2">
          <label className="text-xs font-bold text-slate-600">TÊN SP <span className="text-red-500">*</span></label>
          <Input placeholder="VD: Băng keo OPP trong" value={productName} onChange={(e: any) => setProductName(e.target.value)} className="h-9 text-sm" />
        </div>
        
        <div className="space-y-1 relative">
          <label className="text-xs font-bold text-slate-600">SUB-SKU</label>
          <Input 
            placeholder="VD: TT-BWP-BLACK" 
            value={subSku} 
            onChange={(e: any) => handleSearch(e.target.value, 'subSku')}
            onFocus={() => { if (subSku.length >= 2) 