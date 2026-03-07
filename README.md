# Project_Full-Stack
assignment javascript webapplicaion : C-BOOK


# รายละเอียดเว็บแอปพลิเคชัน
ชื่อเว็บแอปพลิเคชัน : C-BOOK
แอปพลิเคชันจำหน่ายหนังสือออนไลน์ ที่สามารถสั่งซื้อ ค้นหาหนังสือตามชื่อ/ประเภทหนังสือ และระบบจัดการคำสั่งซื้อและหน้า Dashboard สำหรับวิเคราะห์ข้อมูลรายงาน สำหรับผู้ดูแลระบบ

รายชื่อตาราง
- Users : user_id (PK), username, email, user_status
- Books: book_id (PK), title, author, price, stock_quantity,book_satus, category_id (FK)
- Categories: category_id (PK), category_name,
- Orders : order_id (PK), user_id (FK), order_date, status
- OrderDetails : detail_id (PK), order_id (FK), book_id (FK), quantity, unit_price

อธิบายความสัมพันธ์ระหว่างตาราง (Relationships)
- Categories <-- 1 to Many --> Books : แต่ละหมวดหมู่จะมีหนังสือได้หลายเล่ม
- Users <-- 1 to Many --> Orders : ลูกค้าแต่ละคนสามารถสั่งซื้อหนังสือได้หลายเล่ม
- Orders <-- Many to Many --> Books : คำสั่งซื้อแต่ละรายการสามารถสั่งหนังสือได้หลายเล่ม หนังสือหลายเล่มสามารถถูกสั่งซื้อได้ในหลายคำสั่งซื้อ โดยเชื่อมผ่านตาราง OrderDetails

รายงาน 2 หน้าที่วางแผนจะทำ
- รายงานสรุปยอดขายแยกตามหมวดหมู่ (Sales by Category Report): แสดงผลข้อมูลรายได้รวมและจำนวนเล่มที่ขายได้ โดยแบ่งตามประเภทหนังสือ
- รายงานวิเคราะห์สต็อกสินค้าคงเหลือ (Inventory Status Report): แสดงรายการหนังสือที่เหลือจำนวนน้อยกว่าเกณฑ์ที่กำหนด เพื่อช่วยในการวางแผนสั่งซื้อสินค้าเติมสต็อก
