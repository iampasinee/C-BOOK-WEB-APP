document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 1. ตั้งค่าตัวแปรต่างๆ
    // ==========================================
    let searchTimer;
    let currentAbortController = null;

    const searchInput = document.getElementById('searchBookInput');
    const searchBtn = document.querySelector('.search-btn');
    
    // ตัวแปรของ Dropdown Category
    const wrapper = document.querySelector('.custom-select-wrapper');
    const trigger = document.querySelector('.custom-select-trigger');
    const options = document.querySelectorAll('.custom-option');

    // ==========================================
    // 2. ฟังก์ชันหลักสำหรับค้นหา (รวบยอดคำค้นหา + หมวดหมู่)
    // ==========================================
    function performSearch() {
        // ดึงคำค้นหา
        const query = searchInput ? searchInput.value : '';
        
        // ดึงหมวดหมู่ที่เลือกอยู่ปัจจุบัน
        const selectedOption = document.querySelector('.custom-option.selected');
        const category = selectedOption ? selectedOption.dataset.value : 'all';

        // ยกเลิก Request เก่าถ้าพิมพ์เร็วเกินไป
        if (currentAbortController) currentAbortController.abort();
        currentAbortController = new AbortController();
        const signal = currentAbortController.signal;

        // 🚨 ส่งทั้ง search และ category ไปที่เซิร์ฟเวอร์
        const url = `/?search=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;

        fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            signal: signal
        })
        .then(res => res.json())
        .then(data => {
            updateBookGrid(data.books, data.userLoggedIn);
            // ส่ง category ไปให้ Pagination ด้วย
            updatePagination(data.currentPage, data.totalPages, query, category);
        })
        .catch(err => {
            if (err.name !== 'AbortError') console.error('Search error:', err);
        });
    }

    // ==========================================
    // 3. Event Listeners (ดักจับการกระทำของ User)
    // ==========================================
    
    // 3.1 ดักตอนพิมพ์ช่องค้นหา (หน่วงเวลา 300ms)
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(performSearch, 300);
        });
    }

    // 3.2 ดักตอนกดปุ่มแว่นขยาย
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault(); // กันหน้าเว็บรีเฟรช
            performSearch();
        });
    }

    // 3.3 ระบบ Dropdown หมวดหมู่
    if (wrapper && trigger) {
        // คลิกเพื่อเปิด/ปิด
        trigger.addEventListener('click', function(e) {
            e.stopPropagation(); // กันการคลิกทะลุไปที่ window
            wrapper.classList.toggle('open');
        });

        // เมื่อกดเลือกหมวดหมู่ย่อย
        options.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // สลับคลาส selected
                const currentSelected = document.querySelector('.custom-option.selected');
                if (currentSelected) currentSelected.classList.remove('selected');
                this.classList.add('selected');
                
                // เปลี่ยนข้อความหน้าจอ
                trigger.querySelector('span').textContent = this.textContent;
                
                // ปิดเมนู
                wrapper.classList.remove('open');
                
                // 🚨 สำคัญ: พอเปลี่ยนหมวดหมู่ปุ๊บ สั่งค้นหาใหม่ทันที!
                performSearch(); 
            });
        });

        // ปิดเมนูเมื่อคลิกข้างนอก
        window.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });
    }
});

// ==========================================
// 4. ฟังก์ชันแสดงผล (ทำงานนอก DOMContentLoaded ได้)
// ==========================================

// ฟังก์ชันอัปเดตหน้าจอส่วนของตารางหนังสือ
function updateBookGrid(books, userLoggedIn) {
    const grid = document.querySelector('.book-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (books.length === 0) {
        grid.innerHTML = `<div class="no-books" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888; background: #fff; border-radius: 12px; border: 1px dashed var(--border-color);">
            <i class="fa-solid fa-book-open" style="font-size: 40px; color: #ddd; margin-bottom: 15px; display: block;"></i>
            No books found matching your search.
        </div>`;
        return;
    }

    books.forEach(book => {
        const categoryName = book.category ? book.category.category_name : 'Uncategorized';
        const price = parseFloat(book.price).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const img = book.book_img || 'default_book.png';
        
        let buttonHtml = userLoggedIn 
            ? `<button class="btn-action btn-add-cart" onclick="addToCart('${book.book_id}')"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>`
            : `<a href="/login" class="btn-action btn-must-login"><i class="fa-solid fa-lock"></i> Login to Buy</a>`;

        const cardHtml = `
            <div class="book-card">
                <div class="book-img-wrapper">
                    <img src="/images/${img}" alt="${book.title}" class="book-img">
                    <span class="category-badge">${categoryName}</span>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <div class="book-price">฿${price}</div>
                    ${buttonHtml}
                </div>
            </div>`;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// ฟังก์ชันอัปเดตปุ่มเปลี่ยนหน้า (ปรับให้จำค่าหมวดหมู่ด้วย)
function updatePagination(currentPage, totalPages, query, category) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    // แนบค่า query และ category เข้าไปในปุ่มลิงก์
    const getUrl = (p) => `?page=${p}&search=${encodeURIComponent(query || '')}&category=${encodeURIComponent(category || 'all')}`;
    let html = `<a href="${currentPage > 1 ? getUrl(currentPage - 1) : '#'}" class="page-link ${currentPage === 1 ? 'disabled' : ''}"><i class="fa-solid fa-chevron-left"></i></a>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<a href="${getUrl(i)}" class="page-link ${currentPage === i ? 'active' : ''}">${i}</a>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }

    html += `<a href="${currentPage < totalPages ? getUrl(currentPage + 1) : '#'}" class="page-link ${currentPage === totalPages ? 'disabled' : ''}"><i class="fa-solid fa-chevron-right"></i></a>`;
    container.innerHTML = html;
}


document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // ระบบตะกร้าสินค้า (Cart Sidebar)
    // ==========================================
    const cartIconBtn = document.getElementById('cartIconBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');

    // เปิดตะกร้า
    function openCart() {
        if(cartSidebar && cartOverlay) {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            loadCartItems(); // โหลดข้อมูลทุกครั้งที่เปิด
        }
    }

    // ปิดตะกร้า
    function closeCart() {
        if(cartSidebar && cartOverlay) {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
        }
    }

    if(cartIconBtn) cartIconBtn.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    if(closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if(cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // ฟังก์ชันโหลดข้อมูลมาใส่ตาราง
    function loadCartItems() {
        fetch('/cart/get')
        .then(res => res.json())
        .then(data => renderCartUI(data.cart, data.totalPrice, data.totalItems))
        .catch(err => console.error(err));
    }

    // อัปเดตฟังก์ชันวาด UI + / -
    function renderCartUI(cart, totalPrice, totalItems) {
        const container = document.getElementById('cartItemsContainer');
        const badge = document.getElementById('cartBadgeCount');
        const priceDisplay = document.getElementById('cartTotalPrice');

        if(badge) badge.innerText = totalItems;
        if(priceDisplay) priceDisplay.innerText = `฿${parseFloat(totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}`;

        if (!cart || cart.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; color: #888;">
                    <i class="fa-solid fa-basket-shopping" style="font-size: 40px; color: #ddd; margin-bottom: 10px;"></i>
                    <p>Your cart is empty.</p>
                </div>`;
            return;
        }

        let html = '';
        cart.forEach(item => {
            // เช็กว่าถึงลิมิตสต็อกหรือยัง
            const isMax = item.quantity >= item.maxStock;
            
            html += `
            <div class="cart-item">
                <img src="/images/${item.img}" alt="${item.title}">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <div class="cart-item-price">฿${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    
                    <div class="cart-qty-wrapper">
                        <div class="cart-qty-controls">
                            <button onclick="updateCartItem('${item.bookId}', 'decrease')" ${item.quantity <= 1 ? 'disabled' : ''}><i class="fa-solid fa-minus"></i></button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartItem('${item.bookId}', 'increase')" ${isMax ? 'disabled' : ''}><i class="fa-solid fa-plus"></i></button>
                        </div>
                        <button class="cart-item-remove" onclick="updateCartItem('${item.bookId}', 'remove')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    ${isMax ? '<div style="color: #ef4444; font-size: 11px; margin-top: 4px;">Max stock reached</div>' : ''}
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }

    // 🚨 สร้างฟังก์ชันใหม่สำหรับจัดการปุ่ม + / - / ถังขยะ
    window.updateCartItem = function(bookId, action) {
        fetch('/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, action })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                renderCartUI(data.cart, data.totalPrice, data.totalItems);
            }
        })
        .catch(err => console.error("Error updating cart:", err));
    };

    // อัปเดตปุ่ม Add to Cart จากหน้า Home
    window.addToCart = function(bookId) {
        fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: bookId })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                const badge = document.getElementById('cartBadgeCount');
                if(badge) badge.innerText = data.totalItems;
                openCart(); // เปิด Sidebar
            } else if (data.isMax) {
                alert("Cannot add more. Max stock reached!");
                openCart();
            } else {
                alert("Error adding to cart.");
            }
        })
        .catch(err => console.error("Error adding to cart:", err));
    };
});