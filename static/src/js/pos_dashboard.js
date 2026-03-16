/** @odoo-module **/

import { Component, useState, onWillStart, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";

/**
 * Enhanced POS Dashboard with modern ES6+ features
 * Includes error handling, performance optimizations, and accessibility improvements
 */
export class POSDashboard extends Component {
    static template = "shop_pos_frontend.Dashboard";
    
    // Custom error class for POS operations
    static POSError = class extends Error {
        constructor(message, code = 'POS_ERROR') {
            super(message);
            this.name = 'POSError';
            this.code = code;
        }
    };

    // =========================
    // UTILITY METHODS (must be defined before setup)
    // =========================
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    setup() {
        // Initialize submenu state with Map for better performance
        this.submenuState = {};
        
        // Debounced search handlers
        this.debouncedSearch = this.debounce(this.handleSearch.bind(this), 300);
        this.debouncedFilter = this.debounce(this.handleFilter.bind(this), 250);
        
        // Performance monitoring
        this.performanceMetrics = {
            renderCount: 0,
            lastRenderTime: Date.now()
        };
        
        // Keyboard shortcuts
        this.keyboardShortcuts = new Map([
            ['ctrl+k', () => this.focusSearch()],
            ['escape', () => this.closeModals()],
            ['ctrl+b', () => this.toggleSidebar()]
        ]);
        
        // Setup lifecycle hooks
        onWillStart(() => this.initializeDashboard());
        onWillUnmount(() => this.cleanup());
        
        // Reactive state with useState
        this.state = useState({
            // UI State
            activeMenu: "dashboard",
            sidebarCollapsed: false,
            viewMode: 'slide',  // 'slide' or 'grid'
            loading: false,
            error: null,
            notifications: [],
            
            // Modal states
            showProductModal: false,
            showStockModal: false,
            showCategoryModal: false,
            showSupplierModal: false,
            showCustomerModal: false,
            selectedProduct: null,
            selectedCategory: null,
            selectedSupplier: null,
            selectedCustomer: null,
            editingProduct: false,
            editingSupplier: false,
            editingCustomer: false,
            productForm: {},
            supplierForm: {},
            customerForm: {},
            
            // Search and filter state
            searchQuery: '',
            posSearch: '',
            posCategoryFilter: '',
            cart: [],
            filters: {
                category: '',
                priceRange: { min: 0, max: Infinity },
                stockStatus: 'all'
            },
            
            // Modal states
            modals: {
                stock: false,
                category: false,
                product: false,
                order: false
            },
            
            // Settings and preferences
            settings: {
                theme: 'light',
                autoSave: true,
                notifications: true,
                compactMode: false
            },
            products: [
                { id: 1, name: "Antivirus Software License", price: 25, stock: 100, movement: 45, image: "/shop_pos_frontend/static/src/img/Antivirus Software License.jpg", category: "Software", minStock: 20, lastRestocked: "2024-03-01" },
                { id: 2, name: "Accounting Software", price: 120, stock: 50, movement: 28, image: "/shop_pos_frontend/static/src/img/Accounting Software.jpg", category: "Software", minStock: 15, lastRestocked: "2024-03-05" },
                { id: 3, name: "Computer Repair Service", price: 30, stock: 0, movement: 35, image: "/shop_pos_frontend/static/src/img/Computer Repair Service.jpg", category: "IT Support", minStock: 0, lastRestocked: "2024-03-10" },
                { id: 4, name: "Network Setup Service", price: 80, stock: 0, movement: 15, image: "/shop_pos_frontend/static/src/img/Network Setup Service.jpg", category: "IT Support", minStock: 0, lastRestocked: "2024-03-08" },
                { id: 5, name: "Business Website Development", price: 500, stock: 0, movement: 8, image: "/shop_pos_frontend/static/src/img/Business Website Development.jpg", category: "Web Development", minStock: 0, lastRestocked: "2024-03-12" },
                { id: 6, name: "E-commerce Website Development", price: 800, stock: 0, movement: 12, image: "/shop_pos_frontend/static/src/img/E-commerce Website Development.jpg", category: "Web Development", minStock: 0, lastRestocked: "2024-03-15" },
                { id: 7, name: "Office Laptop", price: 900, stock: 20, movement: 18, image: "/shop_pos_frontend/static/src/img/Office Laptop.jpg", category: "Hardware", minStock: 5, lastRestocked: "2024-03-14" },
                { id: 8, name: "Laser Printer", price: 150, stock: 15, movement: 22, image: "/shop_pos_frontend/static/src/img/Laser Printer.jpg", category: "Hardware", minStock: 3, lastRestocked: "2024-03-16" },
                { id: 9, name: "Cloud Hosting Package", price: 100, stock: 0, movement: 30, image: "/shop_pos_frontend/static/src/img/Cloud Hosting Package.jpg", category: "Cloud Services", minStock: 0, lastRestocked: "2024-03-11" },
                { id: 10, name: "Firewall Security Software", price: 200, stock: 40, movement: 25, image: "/shop_pos_frontend/static/src/img/Firewall Security Software.jpg", category: "Cyber Security", minStock: 10, lastRestocked: "2024-03-09" },
                { id: 11, name: "Mobile App Development", price: 1200, stock: 0, movement: 6, image: "/shop_pos_frontend/static/src/img/Mobile%20App%20Development.jpg", category: "Mobile App Development", minStock: 0, lastRestocked: "2024-03-13" },
                { id: 12, name: "UI/UX Design Service", price: 350, stock: 0, movement: 14, image: "/shop_pos_frontend/static/src/img/UI%20UX%20Design%20Service.jpg", category: "UI/UX Design", minStock: 0, lastRestocked: "2024-03-07" },
                { id: 13, name: "Database Setup Service", price: 450, stock: 0, movement: 10, image: "/shop_pos_frontend/static/src/img/Database%20Setup%20Service.jpg", category: "Database Services", minStock: 0, lastRestocked: "2024-03-06" },
                { id: 14, name: "Network Solutions", price: 280, stock: 0, movement: 16, image: "/shop_pos_frontend/static/src/img/Network%20Solutions.jpg", category: "Network Solutions", minStock: 0, lastRestocked: "2024-03-04" }
            ],
            suppliers: [
                { id: 1, name: "Tech Supplies Inc.", email: "contact@techsupplies.com", phone: "555-0123-4567", address: "123 Tech Street, City, State 12345", contactPerson: "John Smith", status: "active", totalOrders: 15 },
                { id: 2, name: "Office Depot", email: "orders@officedepot.com", phone: "555-0987-6543", address: "456 Office Ave, Town, State 67890", contactPerson: "Jane Doe", status: "active", totalOrders: 8 },
                { id: 3, name: "Global Hardware", email: "info@globalhardware.com", phone: "555-0321-9876", address: "789 Hardware Blvd, City, State 13579", contactPerson: "Mike Johnson", status: "on_hold", totalOrders: 3 }
            ],
            customers: [
                { id: 1, name: "Alice Johnson", email: "alice@email.com", phone: "555-123-4567", address: "123 Main St, City, State 12345", totalSpent: 1250.50, totalOrders: 12, loyaltyPoints: 250, lastPurchase: "2024-03-15" },
                { id: 2, name: "Bob Smith", email: "bob@email.com", phone: "555-987-6543", address: "456 Oak Ave, City, State 67890", totalSpent: 890.25, totalOrders: 8, loyaltyPoints: 180, lastPurchase: "2024-03-10" },
                { id: 3, name: "Carol Davis", email: "carol@email.com", phone: "555-246-8135", address: "789 Pine St, City, State 13579", totalSpent: 2100.75, totalOrders: 18, loyaltyPoints: 420, lastPurchase: "2024-03-18" }
            ],
            stockHistory: [
                { id: 1, productId: 1, productName: "Antivirus Software License", adjustment: 20, oldStock: 80, newStock: 100, reason: "Weekly restock", timestamp: "2024-03-10T10:00:00.000Z" },
                { id: 2, productId: 2, productName: "Accounting Software", adjustment: -5, oldStock: 55, newStock: 50, reason: "Sale adjustment", timestamp: "2024-03-09T14:30:00.000Z" },
                { id: 3, productId: 7, productName: "Office Laptop", adjustment: 10, oldStock: 10, newStock: 20, reason: "New inventory", timestamp: "2024-03-08T09:15:00.000Z" },
                { id: 4, productId: 10, productName: "Firewall Security Software", adjustment: 15, oldStock: 25, newStock: 40, reason: "Security update batch", timestamp: "2024-03-07T16:45:00.000Z" },
                { id: 5, productId: 8, productName: "Laser Printer", adjustment: -3, oldStock: 18, newStock: 15, reason: "Office setup", timestamp: "2024-03-06T11:20:00.000Z" },
            ],
            inventoryFilter: '',
            inventoryCategoryFilter: '',
            inventorySortBy: 'name',
            inventorySortOrder: 'asc',
            showStockModal: false,
            selectedProduct: null,
            stockAdjustment: 0,
            adjustmentReason: '',
            categoryFilter: '',
            categorySortBy: 'name',
            categorySortOrder: 'asc',
            showCategoryModal: false,
            selectedCategory: null,
            newCategoryName: '',
            editingCategory: false,
            
            // Orders state
            orders: [
                // Mock orders data
                { 
                    id: 1, 
                    customerName: "Alice Johnson", 
                    customerPhone: "555-123-4567", 
                    customerEmail: "alice@email.com", 
                    items: [
                        { id: 1, name: "Antivirus Software License", price: 25, quantity: 2, total: 50 },
                        { id: 2, name: "Accounting Software", price: 120, quantity: 1, total: 120 }
                    ], 
                    total: 170, 
                    status: 'completed', 
                    paymentMethod: 'Credit Card',
                    createdAt: "2024-03-15T10:30:00.000Z",
                    completedAt: "2024-03-15T10:45:00.000Z",
                    notes: "Customer requested installation service"
                },
                { 
                    id: 2, 
                    customerName: "Bob Smith", 
                    items: [
                        { id: 7, name: "Office Laptop", price: 900, quantity: 1, total: 900 }
                    ], 
                    total: 900, 
                    status: 'pending', 
                    paymentMethod: 'Cash',
                    createdAt: "2024-03-16T14:20:00.000Z"
                },
                { 
                    id: 3, 
                    customerName: "Walk-in Customer", 
                    items: [
                        { id: 10, name: "Firewall Security Software", price: 200, quantity: 1, total: 200 }
                    ], 
                    total: 200, 
                    status: 'completed', 
                    paymentMethod: 'Cash',
                    createdAt: "2024-03-14T16:15:00.000Z",
                    completedAt: "2024-03-14T16:30:00.000Z"
                }
            ],
            showOrderModal: false,
            currentOrder: null,
            
            // Settings state
            settingsConfig: {
                darkMode: false,
                soundEnabled: true,
                autoPrintReceipt: false
            }
        });
    }

    // =========================
    // LIFECYCLE METHODS
    // =========================
    
    async initializeDashboard() {
        try {
            this.state.loading = true;
            await this.loadInitialData();
            this.setupKeyboardShortcuts();
            this.loadUserPreferences();
        } catch (error) {
            this.handleError(error, 'Failed to initialize dashboard');
        } finally {
            this.state.loading = false;
        }
    }
    
    cleanup() {
        this.removeKeyboardShortcuts();
        this.saveUserPreferences();
    }
    
    // =========================
    // SEARCH AND FILTER HANDLERS
    // =========================
    
    handleSearch(event) {
        const query = event.target.value;
        this.state.searchQuery = query;
    }
    
    handleFilter(event) {
        const { name, value } = event.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            this.state.filters[parent][child] = value;
        } else {
            this.state.filters[name] = value;
        }
    }
    
    // =========================
    // KEYBOARD SHORTCUT HANDLERS
    // =========================
    
    focusSearch() {
        const searchInput = document.querySelector('.search_input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    closeModals() {
        Object.keys(this.state.modals).forEach(key => {
            this.state.modals[key] = false;
        });
    }
    
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    }
    
    // =========================
    // ERROR HANDLING
    // =========================
    
    handleError(error, context = '') {
        console.error(`[POS Dashboard Error] ${context}:`, error);
        this.state.error = error.message || context;
        this.addNotification('error', error.message || 'An error occurred');
        
        if (error instanceof POSDashboard.POSError) {
            this.handlePOSError(error);
        }
    }
    
    handlePOSError(error) {
        switch (error.code) {
            case 'STOCK_ERROR':
                this.addNotification('warning', 'Stock operation failed');
                break;
            case 'VALIDATION_ERROR':
                this.addNotification('warning', 'Please check your input');
                break;
            default:
                this.addNotification('error', error.message);
        }
    }
    
    // =========================
    // NOTIFICATION SYSTEM
    // =========================
    
    addNotification(type, message, duration = 5000) {
        const notification = {
            id: Date.now(),
            type,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.state.notifications.push(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
    }
    
    removeNotification(id) {
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    }
    
    // =========================
    // USER PREFERENCES
    // =========================
    
    loadUserPreferences() {
        try {
            const preferences = localStorage.getItem('pos_dashboard_preferences');
            if (preferences) {
                const parsed = JSON.parse(preferences);
                this.state.settings = { ...this.state.settings, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    }
    
    saveUserPreferences() {
        try {
            localStorage.setItem('pos_dashboard_preferences', JSON.stringify(this.state.settings));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }
    
    // =========================
    // KEYBOARD SHORTCUTS
    // =========================
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this));
    }
    
    removeKeyboardShortcuts() {
        document.removeEventListener('keydown', this.handleKeyboardShortcut.bind(this));
    }
    
    handleKeyboardShortcut(event) {
        const key = [];
        if (event.ctrlKey) key.push('ctrl');
        if (event.altKey) key.push('alt');
        if (event.shiftKey) key.push('shift');
        key.push(event.key.toLowerCase());
        
        const shortcut = key.join('+');
        const handler = this.keyboardShortcuts.get(shortcut);
        
        if (handler) {
            event.preventDefault();
            handler();
        }
    }
    
    // =========================
    // DATA LOADING
    // =========================
    
    async loadInitialData() {
        try {
            await this.loadProducts();
            await this.loadOrders();
        } catch (error) {
            throw new POSDashboard.POSError('Failed to load initial data', 'LOAD_ERROR');
        }
    }
    
    async loadProducts() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.state.products);
            }, 100);
        });
    }
    
    async loadOrders() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([]);
            }, 100);
        });
    }
    
    // =========================
    // ORIGINAL METHODS (needed for compatibility)
    // =========================
    
    setActiveMenu = (menuId, parentId = null) => {
        this.state.activeMenu = menuId;
        if (parentId) {
            this.submenuState[parentId] = !this.submenuState[parentId];
        }
    }
    
    getCurrentPageName() {
        const pageNames = {
            'dashboard': 'Dashboard',
            'pos_sale': 'POS',
            'sale_history': 'Sale History',
            'products': 'Products',
            'categories': 'Categories',
            'inventory': 'Inventory Management',
            'suppliers': 'Suppliers',
            'orders': 'Orders',
            'customers': 'Customers',
            'reports': 'Reports',
            'employees': 'Employees',
            'settings': 'Settings'
        };
        return pageNames[this.state.activeMenu] || 'Dashboard';
    }
    
    handleImageError(event) {
        event.target.src = '/shop_pos_frontend/static/src/img/bkname.png';
    }
    
    // =========================
    // MODAL MANAGEMENT
    // =========================
    
    openSupplierModal(supplier = null) {
        this.state.selectedSupplier = supplier;
        this.state.editingSupplier = !!supplier;
        this.state.supplierForm = {
            name: supplier ? supplier.name : '',
            email: supplier ? supplier.email : '',
            phone: supplier ? supplier.phone : '',
            address: supplier ? supplier.address : '',
            contactPerson: supplier ? supplier.contactPerson : ''
        };
        this.state.showSupplierModal = true;
    }
    
    openCustomerModal(customer = null) {
        this.state.selectedCustomer = customer;
        this.state.editingCustomer = !!customer;
        this.state.customerForm = {
            name: customer ? customer.name : '',
            email: customer ? customer.email : '',
            phone: customer ? customer.phone : '',
            address: customer ? customer.address : '',
            loyaltyPoints: customer ? customer.loyaltyPoints : 0
        };
        this.state.showCustomerModal = true;
    }
    
    closeSupplierModal() {
        this.state.showSupplierModal = false;
        this.state.selectedSupplier = null;
    }
    
    closeCustomerModal() {
        this.state.showCustomerModal = false;
        this.state.selectedCustomer = null;
    }
    
    // =========================
    // SUPPLIER MANAGEMENT
    // =========================
    
    getSupplierStats() {
        return {
            totalSuppliers: this.state.suppliers.length,
            activeSuppliers: this.state.suppliers.filter(s => s.status === 'active').length,
            onHoldSuppliers: this.state.suppliers.filter(s => s.status === 'on_hold').length,
            totalPurchaseOrders: this.state.suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0)
        };
    }
    
    getPurchaseOrdersBySupplier(supplierId) {
        // Mock purchase orders data
        return [
            { id: 1, supplierId: 1, orderNumber: "PO-001", date: "2024-03-10", total: 2500.00, status: "delivered", items: "Antivirus Software License x10" },
            { id: 2, supplierId: 1, orderNumber: "PO-002", date: "2024-03-05", total: 1800.50, status: "pending", items: "Accounting Software x15" },
            { id: 3, supplierId: 2, orderNumber: "PO-003", date: "2024-03-08", total: 3200.00, status: "delivered", items: "Office Supplies Package" }
        ].filter(order => order.supplierId === supplierId);
    }
    
    // =========================
    // CUSTOMER MANAGEMENT
    // =========================
    
    getCustomerStats() {
        return {
            totalCustomers: this.state.customers.length,
            totalCustomerRevenue: this.state.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
            totalLoyaltyPoints: this.state.customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
            vipCustomers: this.state.customers.filter(c => c.loyaltyPoints > 300).length
        };
    }
    
    getCustomerOrders(customerId) {
        // Mock customer orders data
        return [
            { id: 1, customerId: 1, orderNumber: "ORD-001", date: "2024-03-15", total: 125.50, status: "delivered", items: "Antivirus License" },
            { id: 2, customerId: 1, orderNumber: "ORD-002", date: "2024-03-10", total: 89.99, status: "delivered", items: "Accounting Software" },
            { id: 3, customerId: 1, orderNumber: "ORD-003", date: "2024-03-05", total: 450.00, status: "delivered", items: "Office Laptop" }
        ].filter(order => order.customerId === customerId);
    }
    
    getMenuItems() {
        return [
            { id: "dashboard", name: "Dashboard", icon: "fa-tachometer" },
            {
                id: "pos_sale",
                name: "POS",
                icon: "fa-shopping-cart",
                children: [
                    { id: "new_sale", name: "New Sale" },
                    { id: "sale_history", name: "Sale History" }
                ]
            },
            { id: "products", name: "Products", icon: "fa-cube" },
            { id: "categories", name: "Categories", icon: "fa-tags" },
            { id: "inventory", name: "Inventory", icon: "fa-list" },
            { id: "suppliers", name: "Suppliers", icon: "fa-truck" },
            { id: "orders", name: "Orders", icon: "fa-list" },
            { id: "customers", name: "Customers", icon: "fa-users" },
            { id: "reports", name: "Reports", icon: "fa-file" },
            { id: "employees", name: "Employees", icon: "fa-user" },
            { id: "settings", name: "Settings", icon: "fa-cog" },
            { id: "logout", name: "Logout", icon: "fa-sign-out" }
        ];
    }
    
    // =========================
    // DASHBOARD CALCULATIONS
    // =========================
    
    getTotalStock() {
        return this.state.products.reduce((sum, p) => sum + (p.stock || 0), 0);
    }
    
    getLowStockItems(threshold = 5) {
        return this.state.products.filter(p => (p.stock || 0) <= threshold);
    }
    
    getFastMovingItems(threshold = 15) {
        return this.state.products.filter(p => (p.movement || 0) >= threshold);
    }
    
    getTopLowStockProducts(limit = 5) {
        return this.getLowStockItems()
            .sort((a, b) => (a.stock || 0) - (b.stock || 0))
            .slice(0, limit);
    }
    
    getCriticalStockItems() {
        return this.state.products.filter(p => p.stock <= Math.floor(p.minStock / 2));
    }
    
    getStockValue() {
        return this.state.products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    }
    
    // =========================
    // CATEGORY MANAGEMENT
    // =========================
    
    getCategories() {
        const categoryMap = new Map();
        
        this.state.products.forEach(p => {
            const categoryName = p.category || 'Uncategorized';
            
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    productCount: 0,
                    totalStock: 0,
                    lowStockCount: 0,
                    totalValue: 0,
                    products: []
                });
            }
            
            const category = categoryMap.get(categoryName);
            category.productCount++;
            category.totalStock += p.stock || 0;
            category.totalValue += (p.stock || 0) * p.price;
            category.products.push(p);
            
            if (p.stock <= p.minStock) {
                category.lowStockCount++;
            }
        });
        
        return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    getPosCategories() {
        const categories = new Set();
        this.state.products.forEach(p => {
            if (p.category) {
                categories.add(p.category);
            }
        });
        return Array.from(categories).sort();
    }
    
    getPOSVisibleProducts() {
        let products = this.state.products;
        
        // Filter by search
        if (this.state.posSearch) {
            const search = this.state.posSearch.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search)
            );
        }
        
        // Filter by category
        if (this.state.posCategoryFilter) {
            products = products.filter(p => p.category === this.state.posCategoryFilter);
        }
        
        return products;
    }
    
    toggleViewMode() {
        this.state.viewMode = this.state.viewMode === 'slide' ? 'grid' : 'slide';
    }
    
    addToCart(product) {
        const existing = this.state.cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
    }
    
    updateCartQuantity(productId, delta) {
        const item = this.state.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            }
        }
    }
    
    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
    }
    
    getTotal() {
        return this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    checkout() {
        if (this.state.cart.length === 0) {
            alert('Cart is empty');
            return;
        }
        alert(`Checkout total: $${this.getTotal().toFixed(2)}`);
        this.state.cart = [];
    }
    
    getCategoryStats() {
        const categories = this.getCategories();
        return {
            totalCategories: categories.length,
            totalProducts: categories.reduce((sum, cat) => sum + cat.productCount, 0),
            lowStockCategories: categories.filter(cat => cat.lowStockCount > 0).length,
            totalValue: categories.reduce((sum, cat) => sum + cat.totalValue, 0)
        };
    }
    
    getProductStats() {
        const totalProducts = this.state.products.length;
        const lowStock = this.getLowStockItems().length;
        const avgPrice = totalProducts
            ? this.state.products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts
            : 0;
        const totalCategories = this.getCategories().length;
        return { totalProducts, lowStock, avgPrice, totalCategories };
    }
    
    getFilteredAndSortedProducts() {
        let filtered = this.state.products;
        
        // Apply text filter
        if (this.state.inventoryFilter) {
            const filter = this.state.inventoryFilter.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(filter) ||
                p.category.toLowerCase().includes(filter)
            );
        }
        
        // Apply category filter
        if (this.state.inventoryCategoryFilter) {
            filtered = filtered.filter(p => p.category === this.state.inventoryCategoryFilter);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[this.state.inventorySortBy];
            let bVal = b[this.state.inventorySortBy];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.state.inventorySortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        return filtered;
    }
    
    getFilteredAndSortedCategories() {
        let categories = this.getCategories();
        
        // Apply filter
        if (this.state.categoryFilter) {
            const filter = this.state.categoryFilter.toLowerCase();
            categories = categories.filter(cat => 
                cat.name.toLowerCase().includes(filter)
            );
        }
        
        // Apply sorting
        categories.sort((a, b) => {
            let aVal = a[this.state.categorySortBy];
            let bVal = b[this.state.categorySortBy];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.state.categorySortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        return categories;
    }
    
    openCategoryModal(category = null) {
        this.state.selectedCategory = category;
        this.state.newCategoryName = category ? category.name : '';
        this.state.editingCategory = !!category;
        this.state.showCategoryModal = true;
    }
    
    closeCategoryModal() {
        this.state.showCategoryModal = false;
        this.state.selectedCategory = null;
        this.state.newCategoryName = '';
        this.state.editingCategory = false;
    }
    
    saveCategory() {
        if (!this.state.newCategoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        if (this.state.editingCategory) {
            const oldName = this.state.selectedCategory.name;
            const newName = this.state.newCategoryName.trim();
            
            this.state.products.forEach(product => {
                if (product.category === oldName) {
                    product.category = newName;
                }
            });
        } else {
            alert(`Category "${this.state.newCategoryName.trim()}" added successfully`);
        }
        
        this.closeCategoryModal();
    }
    
    // =========================
    // ENHANCED PRODUCT MANAGEMENT
    // =========================
    
    openProductModal(product = null) {
        this.state.selectedProduct = product;
        this.state.productForm = {
            name: product ? product.name : '',
            category: product ? product.category : '',
            price: product ? product.price : 0,
            stock: product ? product.stock : 0,
            minStock: product ? product.minStock : 5,
            image: product ? product.image : '',
            description: product ? product.description || '' : '',
            sku: product ? product.sku || '' : '',
            barcode: product ? product.barcode || '' : ''
        };
        this.state.editingProduct = !!product;
        this.state.showProductModal = true;
    }
    
    closeProductModal() {
        this.state.showProductModal = false;
        this.state.selectedProduct = null;
        this.state.productForm = {};
        this.state.editingProduct = false;
    }
    
    saveProduct() {
        const form = this.state.productForm;
        
        if (!form.name.trim()) {
            this.addNotification('error', 'Product name is required');
            return;
        }
        
        if (form.price < 0) {
            this.addNotification('error', 'Price must be positive');
            return;
        }
        
        if (form.stock < 0) {
            this.addNotification('error', 'Stock must be positive');
            return;
        }
        
        if (this.state.editingProduct) {
            // Update existing product
            const index = this.state.products.findIndex(p => p.id === this.state.selectedProduct.id);
            if (index !== -1) {
                this.state.products[index] = {
                    ...this.state.products[index],
                    ...form,
                    lastUpdated: new Date().toISOString()
                };
                this.addNotification('success', `Product "${form.name}" updated successfully`);
            }
        } else {
            // Add new product
            const newProduct = {
                id: Date.now(),
                ...form,
                movement: 0,
                lastRestocked: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };
            this.state.products.push(newProduct);
            this.addNotification('success', `Product "${form.name}" added successfully`);
        }
        
        this.closeProductModal();
    }
    
    deleteProduct(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;
        
        if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            this.state.products = this.state.products.filter(p => p.id !== productId);
            this.addNotification('info', `Product "${product.name}" deleted`);
        }
    }
    
    setInventoryFilter(value) {
        this.state.inventoryFilter = value;
    }
    
    setInventorySort(sortBy) {
        if (this.state.inventorySortBy === sortBy) {
            this.state.inventorySortOrder = this.state.inventorySortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.inventorySortBy = sortBy;
            this.state.inventorySortOrder = 'asc';
        }
    }
    
    // =========================
    // ENHANCED STOCK MANAGEMENT
    // =========================
    
    openStockModal(product) {
        this.state.selectedProduct = product;
        this.state.stockAdjustment = 0;
        this.state.adjustmentReason = '';
        this.state.showStockModal = true;
    }
    
    closeStockModal() {
        this.state.showStockModal = false;
        this.state.selectedProduct = null;
        this.state.stockAdjustment = 0;
        this.state.adjustmentReason = '';
    }
    
    adjustStock() {
        const product = this.state.selectedProduct;
        const adjustment = this.state.stockAdjustment;
        const reason = this.state.adjustmentReason;
        
        if (!reason) {
            this.addNotification('error', 'Please select a reason for adjustment');
            return;
        }
        
        const oldStock = product.stock;
        const newStock = oldStock + adjustment;
        
        if (newStock < 0) {
            this.addNotification('error', 'Stock cannot be negative');
            return;
        }
        
        // Update product stock
        product.stock = newStock;
        product.lastRestocked = new Date().toISOString().split('T')[0];
        
        // Add to stock history
        this.state.stockHistory.unshift({
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            adjustment: adjustment,
            oldStock: oldStock,
            newStock: newStock,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        
        this.addNotification('success', `Stock adjusted for "${product.name}": ${oldStock} → ${newStock}`);
        this.closeStockModal();
    }
    
    viewProductDetails(product) {
        // Could open a detailed view modal
        console.log('View product details:', product);
    }
    
    // =========================
    // ENHANCED ANALYTICS
    // =========================
    
    getSalesAnalytics() {
        return {
            totalRevenue: this.getStockValue(),
            averageProductPrice: this.state.products.reduce((sum, p) => sum + p.price, 0) / this.state.products.length,
            topCategories: this.getCategories().sort((a, b) => b.totalValue - a.totalValue).slice(0, 5),
            stockTurnover: this.calculateStockTurnover(),
            lowStockPercentage: (this.getLowStockItems().length / this.state.products.length) * 100
        };
    }
    
    calculateStockTurnover() {
        const totalMovement = this.state.products.reduce((sum, p) => sum + (p.movement || 0), 0);
        const totalStock = this.getTotalStock();
        return totalStock > 0 ? (totalMovement / totalStock).toFixed(2) : 0;
    }
    
    getRecentActivity(limit = 10) {
        return this.state.stockHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    // =========================
    // EXPORT FUNCTIONALITY
    // =========================
    
    exportInventoryData() {
        const data = this.state.products.map(p => ({
            Name: p.name,
            Category: p.category,
            Stock: p.stock,
            'Min Stock': p.minStock,
            Price: p.price,
            'Total Value': p.stock * p.price,
            Movement: p.movement || 0,
            'Last Restocked': p.lastRestocked
        }));
        
        this.downloadCSV(data, 'inventory_export.csv');
        this.addNotification('success', 'Inventory data exported successfully');
    }
    
    exportSalesData() {
        const analytics = this.getSalesAnalytics();
        const data = [
            { Metric: 'Total Revenue', Value: analytics.totalRevenue },
            { Metric: 'Average Product Price', Value: analytics.averageProductPrice },
            { Metric: 'Stock Turnover', Value: analytics.stockTurnover },
            { Metric: 'Low Stock Percentage', Value: `${analytics.lowStockPercentage.toFixed(1)}%` }
        ];
        
        this.downloadCSV(data, 'sales_analytics.csv');
        this.addNotification('success', 'Sales analytics exported successfully');
    }
    
    downloadCSV(data, filename) {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    deleteCategory(categoryName) {
        if (categoryName === 'Uncategorized') {
            this.addNotification('error', 'Cannot delete the Uncategorized category');
            return;
        }

        if (confirm(`Are you sure you want to delete category "${categoryName}"? Products in this category will be moved to Uncategorized.`)) {
            this.state.products.forEach(product => {
                if (product.category === categoryName) {
                    product.category = 'Uncategorized';
                }
            });
            this.addNotification('info', `Category "${categoryName}" deleted`);
        }
    }
    
    // =========================
    // SUPPLIER MANAGEMENT FUNCTIONS
    // =========================
    
    getSupplierProducts(supplier) {
        // Return products associated with this supplier
        // For demo purposes, return a subset of products based on supplier
        const supplierProductMap = {
            1: [1, 2, 10], // Tech Supplies Inc. - Software products
            2: [7, 8],     // Office Depot - Hardware products  
            3: [3, 4]      // Global Hardware - IT Support services
        };
        
        const productIds = supplierProductMap[supplier.id] || [];
        return this.state.products.filter(p => productIds.includes(p.id));
    }
    
    viewSupplierDetails(supplier) {
        this.state.selectedSupplier = supplier;
    }
    
    clearSelectedSupplier() {
        this.state.selectedSupplier = null;
    }
    
    setCategorySort(sortBy) {
        if (this.state.categorySortBy === sortBy) {
            this.state.categorySortOrder = this.state.categorySortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.categorySortBy = sortBy;
            this.state.categorySortOrder = 'asc';
        }
    }
    
    saveSupplier() {
        const form = this.state.supplierForm;
        
        if (!form.name.trim()) {
            this.addNotification('error', 'Supplier name is required');
            return;
        }
        
        if (!form.email.trim()) {
            this.addNotification('error', 'Supplier email is required');
            return;
        }
        
        if (this.state.editingSupplier) {
            // Update existing supplier
            const index = this.state.suppliers.findIndex(s => s.id === this.state.selectedSupplier.id);
            if (index !== -1) {
                this.state.suppliers[index] = {
                    ...this.state.suppliers[index],
                    ...form,
                    lastUpdated: new Date().toISOString()
                };
                this.addNotification('success', `Supplier "${form.name}" updated successfully`);
            }
        } else {
            // Add new supplier
            const newSupplier = {
                id: Date.now(),
                ...form,
                status: 'active',
                totalOrders: 0,
                createdAt: new Date().toISOString()
            };
            this.state.suppliers.push(newSupplier);
            this.addNotification('success', `Supplier "${form.name}" added successfully`);
        }
        
        this.closeSupplierModal();
    }
    
    // =========================
    // CUSTOMER MANAGEMENT FUNCTIONS
    // =========================
    
    saveCustomer() {
        const form = this.state.customerForm;
        
        if (!form.name.trim()) {
            this.addNotification('error', 'Customer name is required');
            return;
        }
        
        if (!form.email.trim()) {
            this.addNotification('error', 'Customer email is required');
            return;
        }
        
        if (this.state.editingCustomer) {
            // Update existing customer
            const index = this.state.customers.findIndex(c => c.id === this.state.selectedCustomer.id);
            if (index !== -1) {
                this.state.customers[index] = {
                    ...this.state.customers[index],
                    ...form,
                    lastUpdated: new Date().toISOString()
                };
                this.addNotification('success', `Customer "${form.name}" updated successfully`);
            }
        } else {
            // Add new customer
            const newCustomer = {
                id: Date.now(),
                ...form,
                totalSpent: 0,
                totalOrders: 0,
                loyaltyPoints: 0,
                lastPurchase: null,
                createdAt: new Date().toISOString()
            };
            this.state.customers.push(newCustomer);
            this.addNotification('success', `Customer "${form.name}" added successfully`);
        }
        
        this.closeCustomerModal();
    }
    
    viewCustomerDetails(customer) {
        this.state.selectedCustomer = customer;
    }
    
    clearSelectedCustomer() {
        this.state.selectedCustomer = null;
    }
    
    addLoyaltyPoints(customerId, points) {
        const customer = this.state.customers.find(c => c.id === customerId);
        if (customer) {
            customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
            this.addNotification('success', `Added ${points} loyalty points to ${customer.name}`);
        }
    }
    
    // =========================
    // ORDERS MANAGEMENT FUNCTIONS
    // =========================
    
    getOrderStats() {
        const orders = this.state.orders || [];
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            completed: orders.filter(o => o.status === 'completed').length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }
    
    viewOrderDetails(order) {
        this.state.currentOrder = order;
        this.state.showOrderModal = true;
    }
    
    closeOrderModal() {
        this.state.showOrderModal = false;
        this.state.currentOrder = null;
    }
    
    completeOrder(orderId) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (order && order.status === 'pending') {
            order.status = 'completed';
            order.completedAt = new Date().toISOString();
            this.addNotification('success', `Order #${orderId} completed successfully`);
        }
    }
    
    cancelOrder(orderId) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (order && order.status === 'pending') {
            order.status = 'cancelled';
            this.addNotification('info', `Order #${orderId} cancelled`);
        }
    }
    
    printReceipt(order) {
        // Mock print functionality
        this.addNotification('info', `Printing receipt for Order #${order.id}...`);
        setTimeout(() => {
            this.addNotification('success', `Receipt printed successfully`);
        }, 2000);
    }
    
    // =========================
    // REPORTS FUNCTIONS
    // =========================
    
    getSalesSummary() {
        const orders = this.state.orders || [];
        const completedOrders = orders.filter(o => o.status === 'completed');
        
        return {
            totalSales: completedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            totalOrders: completedOrders.length,
            avgOrderValue: completedOrders.length > 0 
                ? completedOrders.reduce((sum, o) => sum + (o.total || 0), 0) / completedOrders.length 
                : 0,
            totalProducts: this.state.products.length
        };
    }
    
    getTopProductsBySales(limit = 5) {
        const orders = this.state.orders || [];
        const completedOrders = orders.filter(o => o.status === 'completed');
        const productSales = new Map();
        
        completedOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const existing = productSales.get(item.id) || { 
                        productId: item.id, 
                        name: item.name, 
                        qty: 0, 
                        total: 0 
                    };
                    existing.qty += item.quantity || 1;
                    existing.total += item.total || (item.price * item.quantity);
                    productSales.set(item.id, existing);
                });
            }
        });
        
        return Array.from(productSales.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // =========================
    // EMPLOYEES FUNCTIONS
    // =========================
    
    getStaffList() {
        // Mock staff data
        return [
            { id: 1, name: "John Manager", role: "Manager", status: "active", lastLogin: "2024-03-16 14:30" },
            { id: 2, name: "Sarah Cashier", role: "Cashier", status: "active", lastLogin: "2024-03-16 12:15" },
            { id: 3, name: "Mike Stock", role: "Stock Clerk", status: "inactive", lastLogin: "2024-03-15 09:45" },
            { id: 4, name: "Emily Sales", role: "Sales Associate", status: "active", lastLogin: "2024-03-16 10:20" }
        ];
    }
    
    // =========================
    // SETTINGS FUNCTIONS
    // =========================
    
    toggleSettingFlag(setting) {
        if (!this.state.settingsConfig) {
            this.state.settingsConfig = {};
        }
        this.state.settingsConfig[setting] = !this.state.settingsConfig[setting];
        this.addNotification('info', `Setting "${setting}" ${this.state.settingsConfig[setting] ? 'enabled' : 'disabled'}`);
    }
}

// Register the component
registry.category("actions").add("shop_pos_dashboard", POSDashboard);
