QUY TẮC KIẾN TRÚC CODE CHO DỰ ÁN CÁ NHÂN / SAAS

MỤC TIÊU:

* Code sạch
* Dễ maintain
* Dễ scale
* Dễ debug
* Dễ build tiếp
* Dễ dùng AI hỗ trợ code
* Không tạo file khổng lồ
* Không logic chồng chéo

========================================

1. QUY TẮC SỐ DÒNG TỐI ƯU
   ========================================

UI Component:

* Tốt nhất: 30–80 dòng
* Cho phép: tối đa ~150 dòng

Custom Hook:

* Tốt nhất: 50–120 dòng
* Logic lớn có thể 200 dòng

Service/API:

* Tốt nhất: 50–150 dòng

Utils:

* Nên cực nhỏ
* 10–80 dòng

Validation Schema:

* 20–120 dòng

Types:

* Càng nhỏ càng tốt

Page lớn:

* Có thể 150–300 dòng
* Nhưng phải chia sub-components

========================================
2. QUY TẮC TÁCH FILE
====================

BẮT BUỘC tách nếu file có:

* nhiều hơn 1 responsibility
* quá nhiều useState
* quá nhiều useEffect
* quá nhiều if/else
* API gọi trực tiếp nhiều nơi
* validation dài
* transform data lớn
* modal + table + form chung 1 file
* khó đọc trong 30 giây

Nguyên tắc:
“Nếu phải scroll liên tục để hiểu file → tách.”

========================================
3. KIẾN TRÚC CHUẨN
==================

src/
├── app/
├── modules/
├── shared/
├── services/
├── hooks/
├── utils/
├── store/
├── layouts/
├── routes/
├── constants/
├── configs/
└── types/

========================================
4. KIẾN TRÚC MODULE
===================

Ví dụ:

modules/
└── customers/
├── pages/
├── components/
├── hooks/
├── services/
├── api/
├── utils/
├── types/
├── validations/
├── constants/
└── store/

========================================
5. UI KHÔNG ĐƯỢC CHỨA LOGIC LỚN
===============================

Component chỉ nên:

* render UI
* handle event đơn giản
* gọi hook/service

KHÔNG nên:

* xử lý nghiệp vụ lớn
* query database
* validate phức tạp
* transform data lớn
* gọi API khắp nơi

========================================
6. BUSINESS LOGIC
=================

Business logic phải nằm ở:

* hooks/
* services/
* utils/

Flow chuẩn:

UI
→ Hook
→ Service
→ API
→ Database

========================================
7. COMPONENT RULES
==================

Mỗi component:

* chỉ làm 1 nhiệm vụ chính
* reusable nếu có thể
* không nested quá sâu
* props rõ ràng
* không truyền props loạn

Ví dụ xấu:
CustomerPage.tsx

* table
* form
* modal
* upload
* filter
* export excel
* pagination
* websocket
  => sai

========================================
8. KHÔNG OVER-ENGINEERING
=========================

KHÔNG tạo:

* quá nhiều abstraction
* wrapper vô nghĩa
* file chỉ 3 dòng nhưng không reusable
* architecture enterprise quá nặng

Ưu tiên:

* practical
* dễ hiểu
* dễ maintain

========================================
9. TÁCH NHỎ THÔNG MINH
======================

Ưu tiên tách:

* modal
* form
* table
* filter
* item row
* card
* upload
* api logic
* validation
* pagination
* export/import excel
* realtime/socket
* permission/auth

========================================
10. CUSTOM HOOK RULES
=====================

Tạo custom hook khi:

* logic dùng lại
* state phức tạp
* fetch data
* pagination
* filter
* debounce
* upload
* realtime

Ví dụ:
useCustomers()
usePagination()
useUpload()
useFuelLogs()

========================================
11. SERVICE RULES
=================

Service xử lý:

* API
* transform data
* mapping
* cache
* business rules

KHÔNG gọi fetch trực tiếp trong component.

========================================
12. SHARED COMPONENTS
=====================

shared/components/

* Button
* Modal
* Table
* Input
* Select
* Card
* Loader
* EmptyState

Re-use toàn hệ thống.

========================================
13. PERFORMANCE
===============

Bắt buộc tối ưu:

* tránh re-render
* lazy loading
* memoization hợp lý
* pagination
* virtual list nếu data lớn
* debounce search
* cache API

========================================
14. IMPORT RULES
================

Dùng alias:

@/modules
@/shared
@/services
@/hooks

KHÔNG relative import quá sâu:

../../../../../../

========================================
15. FILE KHỔNG LỒ PHẢI BỊ TÁCH
==============================

Nếu file:

* > 300 dòng
* khó debug
* nhiều responsibility

=> phải chia nhỏ.

KHÔNG được để:

* page 2000 dòng
* component 1500 dòng
* hook 1000 dòng

========================================
16. CLEAN CODE
==============

Ưu tiên:

* tên dễ hiểu
* function ngắn
* return sớm
* ít nesting
* ít duplicate
* dễ search
* dễ AI đọc

========================================
17. MỤC TIÊU CUỐI CÙNG
======================

Codebase phải:

* sạch
* modular
* dễ scale
* dễ build thêm
* dễ maintain nhiều năm
* dễ onboarding
* dễ cho AI hỗ trợ code
* dễ refactor sau này

Không cần enterprise quá mức.
Không cần perfect architecture.
Ưu tiên:

* thực dụng
* rõ ràng
* ổn định
* dễ phát triển lâu dài.


1. THỰC HIỆN THEO TỪNG PHASE + REVIEW

Không nên refactor toàn bộ 1 lần vì:

* dễ phát sinh lỗi dây chuyền
* khó debug
* khó rollback
* AI dễ làm lệch logic hệ thống

Yêu cầu:

* thực hiện từng phase
* sau mỗi phase:

  * review structure
  * kiểm tra lỗi
  * test tính năng
  * đảm bảo build thành công
  * đảm bảo không ảnh hưởng database/API

Flow mong muốn:
Phase
→ Refactor
→ Review
→ Test
→ Commit
→ Sang phase tiếp theo

Ưu tiên an toàn và ổn định hơn tốc độ.

==================================================

2. ƯU TIÊN MODULE QUAN TRỌNG TRƯỚC

Ưu tiên refactor trước:

* pages/components quá lớn
* dashboard
* customers
* orders
* fuel
* drivers
* vehicles
* upload/image
* realtime/socket
* form validation
* api/services
* table/filter/pagination

Đặc biệt ưu tiên:

* file >300 dòng
* component nhiều responsibility
* logic duplicate
* api gọi lặp lại
* state management lộn xộn

Tạm thời KHÔNG cần:

* tối ưu UI nhỏ
* animation
* micro component quá nhỏ
* over-engineering architecture

Mục tiêu:
ổn định hệ thống trước rồi mới tối ưu sâu.

==================================================

3. TÁCH CẢ NHÓM 150–300 DÒNG NẾU HỢP LÝ

Không chỉ nhóm >300 dòng.

Quy tắc:

* nếu file 150–300 dòng nhưng:

  * nhiều responsibility
  * khó đọc
  * khó maintain
  * chứa nhiều logic khác nhau
    => vẫn nên tách

* nếu file 200 dòng nhưng:

  * rõ ràng
  * single responsibility
  * dễ maintain
    => có thể giữ nguyên

Ưu tiên:

* cấu trúc sạch
* dễ maintain
* dễ scale
* dễ build tiếp

KHÔNG tách máy móc theo số dòng.
Tách theo:

* responsibility
* độ phức tạp
* khả năng maintain.

==================================================

MỤC TIÊU CUỐI CÙNG:

* Không phá logic hệ thống
* Không ảnh hưởng production
* Không đổi flow người dùng
* Không đổi database/API behavior
* Giữ toàn bộ tính năng hoạt động
* Codebase sạch hơn rõ rệt
* Dễ build thêm nhiều năm sau
* AI có thể đọc và maintain dễ dàng








Rõ ràng! Bắt đầu Phase 1: Finance Module ngay. Tôi sẽ tạo task list và thực hiện từng bước.

Bắt đầu thực hiện! Đọc lại chi tiết FinanceTabs.tsx và page.tsx để extract chính xác.

Tôi đã có đủ thông tin từ lần đọc trước. Bắt đầu tạo các file mới. Tôi sẽ thực hiện theo thứ tự: types → constants → utils → hooks → components → page.

Bước 1: Tạo types.ts và constants.ts


