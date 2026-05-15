import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const BomView: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Định mức cho sản phẩm</h3>
            <p className="text-sm text-gray-500">Thiết lập tiêu hao nguyên liệu chuẩn</p>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            <span>Thêm định mức</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-blue-900">Cuộn bọc chống sốc loại A (K50)</span>
              <button className="text-blue-600 hover:underline text-xs">Chỉnh sửa</button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">• Hạt nhựa LDPE</span>
                <span className="font-medium text-gray-900">2.5 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">• Màng PE</span>
                <span className="font-medium text-gray-900">30 mét</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">• Tem QR</span>
                <span className="font-medium text-gray-900">1 cái</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-dashed border-2 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="font-bold text-gray-900 mb-2">Chọn sản phẩm xem định mức</h4>
        <p className="text-sm text-gray-500 max-w-[250px]">
          Định mức giúp hệ thống tự động tính toán nhu cầu nguyên liệu khi tạo lệnh sản xuất.
        </p>
      </Card>
    </div>
  );
};

export default BomView;
