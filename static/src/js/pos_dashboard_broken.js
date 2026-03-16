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
        // Additional search logic can be added here
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
            // Handle specific POS errors
            this.handlePOSError(error);
        }
    }
    
    handlePOSError(error) {
        // Custom handling for POS-specific errors
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
            // Simulate API calls for initial data
            await this.loadProducts();
            await this.loadOrders();
            await this.loadCustomers();
            await this.loadSuppliers();
        } catch (error) {
            throw new POSDashboard.POSError('Failed to load initial data', 'LOAD_ERROR');
        }
    }
    
    async loadProducts() {
        // In a real implementation, this would fetch from an API
        return new Promise(resolve => {
            setTimeout(() => {
                // Products are already in state, just resolve
                resolve(this.state.products);
            }, 100);
        });
    }
    
    async loadOrders() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.state.orders);
            }, 100);
        });
    }
    
    async loadCustomers() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.state.customers);
            }, 100);
        });
    }
    
    // =========================
    // ORIGINAL METHODS (needed for compatibility)
    // =========================
    
    setActiveMenu(menuId, parentId = null) {
        this.state.activeMenu = menuId;
        if (parentId) {
            this.submenuState.set(parentId, !this.submenuState.get(parentId));
        }
    }
    
    handleImageError(event) {
        event.target.src = '/shop_pos_frontend/static/src/img/bkname.png';
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
            
            // Search and filter state
            searchQuery: '',
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
            // Products page management
            showProductModal: false,
            editingProduct: false,
            productForm: {
                id: null,
                name: '',
                price: 0,
                stock: 0,
                movement: 0,
                image: '',
                category: '',
                minStock: 0,
                lastRestocked: new Date().toISOString().split('T')[0],
            },
            // Orders management
            orders: [
                {
                    id: 1001,
                    customerName: 'John Smith',
                    customerPhone: '+1-555-0123',
                    customerEmail: 'john.smith@email.com',
                    items: [
                        { productId: 1, name: "Antivirus Software License", price: 25, quantity: 2, total: 50 },
                        { productId: 2, name: "Accounting Software", price: 120, quantity: 1, total: 120 }
                    ],
                    total: 170,
                    status: 'completed',
                    paymentMethod: 'cash',
                    notes: 'Regular customer',
                    createdAt: '2024-03-14T09:30:00.000Z',
                    completedAt: '2024-03-14T09:35:00.000Z'
                },
                {
                    id: 1002,
                    customerName: 'Sarah Johnson',
                    customerPhone: '+1-555-0456',
                    customerEmail: 'sarah.j@email.com',
                    items: [
                        { productId: 3, name: "Computer Repair Service", price: 30, quantity: 1, total: 30 },
                        { productId: 7, name: "Office Laptop", price: 900, quantity: 1, total: 900 },
                        { productId: 8, name: "Laser Printer", price: 150, quantity: 1, total: 150 }
                    ],
                    total: 1080,
                    status: 'completed',
                    paymentMethod: 'card',
                    notes: 'Office setup',
                    createdAt: '2024-03-14T10:15:00.000Z',
                    completedAt: '2024-03-14T10:20:00.000Z'
                },
                {
                    id: 1003,
                    customerName: '',
                    customerPhone: '',
                    customerEmail: '',
                    items: [
                        { productId: 5, name: "Business Website Development", price: 500, quantity: 1, total: 500 },
                        { productId: 9, name: "Cloud Hosting Package", price: 100, quantity: 2, total: 200 }
                    ],
                    total: 700,
                    status: 'pending',
                    paymentMethod: 'cash',
                    notes: '',
                    createdAt: '2024-03-14T11:00:00.000Z',
                    completedAt: null
                },
                {
                    id: 1004,
                    customerName: 'Mike Davis',
                    customerPhone: '+1-555-0789',
                    customerEmail: 'mike.davis@email.com',
                    items: [
                        { productId: 10, name: "Firewall Security Software", price: 200, quantity: 1, total: 200 },
                        { productId: 1, name: "Antivirus Software License", price: 25, quantity: 3, total: 75 },
                        { productId: 9, name: "Cloud Hosting Package", price: 100, quantity: 1, total: 100 }
                    ],
                    total: 375,
                    status: 'completed',
                    paymentMethod: 'card',
                    notes: 'Security package',
                    createdAt: '2024-03-14T12:30:00.000Z',
                    completedAt: '2024-03-14T12:35:00.000Z'
                },
                {
                    id: 1005,
                    customerName: 'Emma Wilson',
                    customerPhone: '+1-555-0321',
                    customerEmail: 'emma.w@email.com',
                    items: [
                        { productId: 2, name: "Accounting Software", price: 120, quantity: 1, total: 120 },
                        { productId: 3, name: "Computer Repair Service", price: 30, quantity: 1, total: 30 }
                    ],
                    total: 150,
                    status: 'pending',
                    paymentMethod: 'cash',
                    notes: 'Business software setup',
                    createdAt: '2024-03-14T08:45:00.000Z',
                    completedAt: null
                },
                {
                    id: 1006,
                    customerName: 'David Brown',
                    customerPhone: '+1-555-0654',
                    customerEmail: 'david.brown@email.com',
                    items: [
                        { productId: 6, name: "E-commerce Website Development", price: 800, quantity: 1, total: 800 },
                        { productId: 11, name: "Mobile App Development", price: 1200, quantity: 1, total: 1200 },
                        { productId: 12, name: "UI/UX Design Service", price: 350, quantity: 1, total: 350 }
                    ],
                    total: 2350,
                    status: 'cancelled',
                    paymentMethod: 'card',
                    notes: 'Customer changed mind',
                    createdAt: '2024-03-13T16:20:00.000Z',
                    completedAt: null
                },
                {
                    id: 1007,
                    customerName: '',
                    customerPhone: '',
                    customerEmail: '',
                    items: [
                        { productId: 1, name: "Antivirus Software License", price: 25, quantity: 4, total: 100 },
                        { productId: 9, name: "Cloud Hosting Package", price: 100, quantity: 2, total: 200 }
                    ],
                    total: 300,
                    status: 'completed',
                    paymentMethod: 'cash',
                    notes: '',
                    createdAt: '2024-03-13T14:10:00.000Z',
                    completedAt: '2024-03-13T14:15:00.000Z'
                },
                {
                    id: 1008,
                    customerName: 'Lisa Anderson',
                    customerPhone: '+1-555-0987',
                    customerEmail: 'lisa.anderson@email.com',
                    items: [
                        { productId: 8, name: "Laser Printer", price: 150, quantity: 1, total: 150 },
                        { productId: 2, name: "Accounting Software", price: 120, quantity: 1, total: 120 },
                        { productId: 3, name: "Computer Repair Service", price: 30, quantity: 2, total: 60 }
                    ],
                    total: 330,
                    status: 'completed',
                    paymentMethod: 'card',
                    notes: 'Office equipment and service',
                    createdAt: '2024-03-13T13:00:00.000Z',
                    completedAt: '2024-03-13T13:05:00.000Z'
                }
            ],
            currentOrder: null,
            showOrderModal: false,
            orderForm: {
                id: null,
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                items: [],
                total: 0,
                status: 'pending', // pending, completed, cancelled
                paymentMethod: 'cash',
                notes: '',
                createdAt: null,
                completedAt: null
            },
            // POS quick filters
            posSearch: '',
            posCategoryFilter: '',
            // Suppliers management
            suppliers: [
                {
                    id: 1,
                    name: 'TechSoft Solutions Inc',
                    contactName: 'Alice Green',
                    email: 'alice@techsoft.com',
                    phone: '+1-555-1001',
                    address: '123 Tech Park, Silicon Valley',
                    products: [1, 2, 10], // software products
                    status: 'active',
                    lastOrderDate: '2024-03-10',
                    totalOrders: 8
                },
                {
                    id: 2,
                    name: 'Hardware Hub International',
                    contactName: 'Brian White',
                    email: 'brian@hardwarehub.com',
                    phone: '+1-555-1002',
                    address: '45 Industrial Ave, Tech City',
                    products: [7, 8], // hardware products
                    status: 'active',
                    lastOrderDate: '2024-03-08',
                    totalOrders: 5
                },
                {
                    id: 3,
                    name: 'Cloud Services Pro',
                    contactName: 'Carla Brown',
                    email: 'carla@cloudservices.com',
                    phone: '+1-555-1003',
                    address: '78 Data Center Drive, Cloud Valley',
                    products: [9], // cloud services
                    status: 'on_hold',
                    lastOrderDate: '2024-02-28',
                    totalOrders: 3
                }
            ],
            purchaseOrders: [
                {
                    id: 5001,
                    supplierId: 1,
                    reference: 'PO-5001',
                    date: '2024-03-10',
                    total: 320,
                    status: 'received'
                },
                {
                    id: 5002,
                    supplierId: 2,
                    reference: 'PO-5002',
                    date: '2024-03-08',
                    total: 210,
                    status: 'received'
                },
                {
                    id: 5003,
                    supplierId: 3,
                    reference: 'PO-5003',
                    date: '2024-02-28',
                    total: 140,
                    status: 'pending'
                }
            ],
            showSupplierModal: false,
            editingSupplier: false,
            supplierForm: {
                id: null,
                name: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                status: 'active'
            },
            selectedSupplier: null,
            // Customers management
            customers: [
                {
                    id: 1,
                    name: 'John Smith',
                    email: 'john.smith@email.com',
                    phone: '+1-555-2001',
                    address: '12 Main Street, City',
                    totalSpent: 230.5,
                    totalOrders: 5,
                    loyaltyPoints: 80,
                    lastPurchaseDate: '2024-03-14'
                },
                {
                    id: 2,
                    name: 'Sarah Johnson',
                    email: 'sarah.j@email.com',
                    phone: '+1-555-2002',
                    address: '89 Pine Avenue, City',
                    totalSpent: 145.0,
                    totalOrders: 3,
                    loyaltyPoints: 40,
                    lastPurchaseDate: '2024-03-13'
                },
                {
                    id: 3,
                    name: 'Emma Wilson',
                    email: 'emma.w@email.com',
                    phone: '+1-555-2003',
                    address: '5 Lake Road, City',
                    totalSpent: 95.0,
                    totalOrders: 2,
                    loyaltyPoints: 25,
                    lastPurchaseDate: '2024-03-12'
                }
            ],
            showCustomerModal: false,
            editingCustomer: false,
            customerForm: {
                id: null,
                name: '',
                email: '',
                phone: '',
                address: '',
                loyaltyPoints: 0
            },
            selectedCustomer: null
        });
    }

    setActiveMenu = (menuId, parentId = null) => {
        this.state.activeMenu = menuId;
        if (parentId) {
            this.submenuState[parentId] = !this.submenuState[parentId];
        }
    }

    handleImageError = (event) => {
        event.target.src = '/shop_pos_frontend/static/src/img/bkname.png';
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

    addToCart = (product) => {
        const existing = this.state.cart.find(i => i.id === product.id);
        if (existing) {
            this.state.cart = this.state.cart.map(item =>
                item.id === product.id ? { ...item, quantity: (item.quantity || 0) + 1 } : item
            );
        } else {
            this.state.cart = [...this.state.cart, { ...product, quantity: 1 }];
        }
    }

    updateCartQuantity = (productId, delta) => {
        this.state.cart = this.state.cart
            .map(item =>
                item.id === productId
                    ? { ...item, quantity: Math.max(1, (item.quantity || 0) + delta) }
                    : item
            )
            .filter(item => item.quantity > 0);
    }

    removeFromCart = (id) => {
        this.state.cart = this.state.cart.filter(i => i.id !== id);
    }

    getTotal = () => {
        return this.state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    checkout = () => {
        if (this.state.cart.length === 0) {
            alert("Cart empty");
            return;
        }
        this.createOrderFromCart();
    }

    getTotalStock = () => {
        return this.state.products.reduce((sum, p) => sum + (p.stock || 0), 0);
    }

    getLowStockItems = (threshold = 5) => {
        return this.state.products.filter(p => (p.stock || 0) <= threshold);
    }

    getFastMovingItems = (threshold = 15) => {
        return this.state.products.filter(p => (p.movement || 0) >= threshold);
    }

    getSlowMovingItems = (threshold = 5) => {
        return this.state.products.filter(p => (p.movement || 0) <= threshold);
    }

    getReorderAlerts = (threshold = 5) => {
        return this.getLowStockItems(threshold).map(p => ({
            ...p,
            message: `Reorder needed: only ${p.stock} left`
        }));
    }

    getCategories = () => {
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

    // POS-specific helpers
    getPosCategories = () => {
        const names = new Set();
        this.state.products.forEach(p => {
            if (p.category) {
                names.add(p.category);
            }
        });
        return Array.from(names).sort();
    }

    getPOSVisibleProducts = () => {
        let products = [...this.state.products];
        if (this.state.posSearch) {
            const term = this.state.posSearch.toLowerCase();
            products = products.filter(
                p =>
                    p.name.toLowerCase().includes(term) ||
                    (p.category && p.category.toLowerCase().includes(term))
            );
        }
        if (this.state.posCategoryFilter) {
            products = products.filter(p => p.category === this.state.posCategoryFilter);
        }
        return products;
    }

    toggleViewMode = () => {
        this.state.viewMode = this.state.viewMode === 'slide' ? 'grid' : 'slide';
    }

    openStockModal = (product) => {
        this.state.selectedProduct = product;
        this.state.stockAdjustment = 0;
        this.state.adjustmentReason = '';
        this.state.showStockModal = true;
    }

    closeStockModal = () => {
        this.state.showStockModal = false;
        this.state.selectedProduct = null;
        this.state.stockAdjustment = 0;
        this.state.adjustmentReason = '';
    }

    adjustStock = () => {
        if (!this.state.selectedProduct || this.state.stockAdjustment === 0) {
            alert('Please enter a valid stock adjustment');
            return;
        }

        const product = this.state.products.find(p => p.id === this.state.selectedProduct.id);
        const oldStock = product.stock;
        const newStock = Math.max(0, oldStock + this.state.stockAdjustment);
        
        // Update product stock
        product.stock = newStock;
        product.lastRestocked = new Date().toISOString().split('T')[0];
        
        // Add to stock history
        this.state.stockHistory.unshift({
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            adjustment: this.state.stockAdjustment,
            oldStock: oldStock,
            newStock: newStock,
            reason: this.state.adjustmentReason || 'Manual adjustment',
            timestamp: new Date().toISOString()
        });
        
        this.closeStockModal();
    }

    setInventoryFilter = (filter) => {
        this.state.inventoryFilter = filter;
    }

    setInventorySort = (sortBy) => {
        if (this.state.inventorySortBy === sortBy) {
            this.state.inventorySortOrder = this.state.inventorySortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.inventorySortBy = sortBy;
            this.state.inventorySortOrder = 'asc';
        }
    }

    getFilteredAndSortedProducts = () => {
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

    getStockValue = () => {
        return this.state.products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    }

    getCriticalStockItems = () => {
        return this.state.products.filter(p => p.stock <= Math.floor(p.minStock / 2));
    }

    getOverstockItems = () => {
        return this.state.products.filter(p => p.stock >= p.minStock * 3);
    }

    getRecentStockMovements = (limit = 10) => {
        return this.state.stockHistory.slice(0, limit);
    }

    getTopLowStockProducts = (limit = 5) => {
        return this.getLowStockItems()
            .sort((a, b) => (a.stock || 0) - (b.stock || 0))
            .slice(0, limit);
    }

    getTopOverstockProducts = (limit = 5) => {
        return this.getOverstockItems()
            .sort((a, b) => (b.stock || 0) - (a.stock || 0))
            .slice(0, limit);
    }

    setCategoryFilter = (filter) => {
        this.state.categoryFilter = filter;
    }

    setCategorySort = (sortBy) => {
        if (this.state.categorySortBy === sortBy) {
            this.state.categorySortOrder = this.state.categorySortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.categorySortBy = sortBy;
            this.state.categorySortOrder = 'asc';
        }
    }

    getFilteredAndSortedCategories = () => {
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

    openCategoryModal = (category = null) => {
        this.state.selectedCategory = category;
        this.state.newCategoryName = category ? category.name : '';
        this.state.editingCategory = !!category;
        this.state.showCategoryModal = true;
    }

    closeCategoryModal = () => {
        this.state.showCategoryModal = false;
        this.state.selectedCategory = null;
        this.state.newCategoryName = '';
        this.state.editingCategory = false;
    }

    saveCategory = () => {
        if (!this.state.newCategoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        if (this.state.editingCategory) {
            // Update existing category name for all products
            const oldName = this.state.selectedCategory.name;
            const newName = this.state.newCategoryName.trim();
            
            this.state.products.forEach(product => {
                if (product.category === oldName) {
                    product.category = newName;
                }
            });
        } else {
            // Add new category (in a real app, this would be saved to backend)
            // For now, we'll just show a success message
            alert(`Category "${this.state.newCategoryName.trim()}" added successfully`);
        }
        
        this.closeCategoryModal();
    }

    deleteCategory = (categoryName) => {
        if (categoryName === 'Uncategorized') {
            alert('Cannot delete the Uncategorized category');
            return;
        }

        if (confirm(`Are you sure you want to delete category "${categoryName}"? Products in this category will be moved to Uncategorized.`)) {
            // Move all products to Uncategorized
            this.state.products.forEach(product => {
                if (product.category === categoryName) {
                    product.category = 'Uncategorized';
                }
            });
        }
    }

    getCategoryStats = () => {
        const categories = this.getCategories();
        return {
            totalCategories: categories.length,
            totalProducts: categories.reduce((sum, cat) => sum + cat.productCount, 0),
            lowStockCategories: categories.filter(cat => cat.lowStockCount > 0).length,
            totalValue: categories.reduce((sum, cat) => sum + cat.totalValue, 0)
        };
    }

    getProductStats = () => {
        const totalProducts = this.state.products.length;
        const lowStock = this.getLowStockItems().length;
        const avgPrice = totalProducts
            ? this.state.products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts
            : 0;
        const totalCategories = this.getCategories().length;
        return { totalProducts, lowStock, avgPrice, totalCategories };
    }

    openProductModal = (product = null) => {
        if (product) {
            this.state.productForm = {
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
                movement: product.movement,
                image: product.image,
                category: product.category,
                minStock: product.minStock,
                lastRestocked: product.lastRestocked || new Date().toISOString().split('T')[0],
            };
            this.state.editingProduct = true;
        } else {
            this.state.productForm = {
                id: null,
                name: '',
                price: 0,
                stock: 0,
                movement: 0,
                image: '',
                category: '',
                minStock: 0,
                lastRestocked: new Date().toISOString().split('T')[0],
            };
            this.state.editingProduct = false;
        }
        this.state.showProductModal = true;
    }

    closeProductModal = () => {
        this.state.showProductModal = false;
        this.state.editingProduct = false;
    }

    saveProduct = () => {
        const form = this.state.productForm;
        if (!form.name.trim()) {
            alert('Please enter a product name');
            return;
        }

        if (this.state.editingProduct && form.id != null) {
            // Update existing product
            this.state.products = this.state.products.map(p =>
                p.id === form.id ? { ...p, ...form } : p
            );
        } else {
            // Add new product with a new id
            const maxId = this.state.products.reduce((max, p) => Math.max(max, p.id), 0);
            const newProduct = {
                ...form,
                id: maxId + 1,
            };
            this.state.products = [...this.state.products, newProduct];
        }

        this.closeProductModal();
    }

    deleteProduct = (productId) => {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) {
            return;
        }
        if (!confirm(`Delete product "${product.name}"?`)) {
            return;
        }
        this.state.products = this.state.products.filter(p => p.id !== productId);
        // Also remove from cart if present
        this.state.cart = this.state.cart.filter(i => i.id !== productId);
    }

    exportInventory = () => {
        const products = this.getFilteredAndSortedProducts();
        const csvContent = [
            ['Product Name', 'Category', 'Stock', 'Min Stock', 'Price', 'Movement', 'Last Restocked', 'Status'],
            ...products.map(p => [
                p.name,
                p.category,
                p.stock,
                p.minStock,
                p.price,
                p.movement,
                p.lastRestocked,
                p.stock <= p.minStock ? 'Low Stock' : p.stock <= p.minStock * 1.5 ? 'Warning' : 'Good'
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    viewProductDetails = (product) => {
        alert(`Product Details:\n\nName: ${product.name}\nCategory: ${product.category}\nStock: ${product.stock}\nMin Stock: ${product.minStock}\nPrice: $${product.price}\nMovement: ${product.movement}\nLast Restocked: ${product.lastRestocked}`);
    }

    // Orders methods
    createOrderFromCart = () => {
        if (this.state.cart.length === 0) {
            alert("Cart is empty. Add items before creating an order.");
            return;
        }

        const orderItems = this.state.cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        }));

        const newOrder = {
            id: Date.now(),
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            items: orderItems,
            total: this.getTotal(),
            status: 'pending',
            paymentMethod: 'cash',
            notes: '',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.state.orders.push(newOrder);
        this.state.cart = []; // Clear cart after creating order
        alert(`Order #${newOrder.id} created successfully!`);
    }

    completeOrder = (orderId) => {
        const order = this.state.orders.find(o => o.id === orderId);
        if (!order) return;

        if (confirm(`Complete order #${orderId}? This will update inventory and mark the order as completed.`)) {
            // Update inventory
            order.items.forEach(item => {
                const product = this.state.products.find(p => p.id === item.productId);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                    product.movement += item.quantity;
                }
            });

            order.status = 'completed';
            order.completedAt = new Date().toISOString();
            alert(`Order #${orderId} completed successfully!`);
        }
    }

    cancelOrder = (orderId) => {
        const order = this.state.orders.find(o => o.id === orderId);
        if (!order) return;

        if (confirm(`Cancel order #${orderId}? This action cannot be undone.`)) {
            order.status = 'cancelled';
            alert(`Order #${orderId} cancelled.`);
        }
    }

    viewOrderDetails = (order) => {
        this.state.currentOrder = order;
        this.state.showOrderModal = true;
    }

    closeOrderModal = () => {
        this.state.showOrderModal = false;
        this.state.currentOrder = null;
    }

    printReceipt = (order) => {
        const receiptWindow = window.open('', '_blank', 'width=400,height=600');
        const receiptContent = `
            <html>
            <head>
                <title>Receipt #${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
                    .footer { margin-top: 20px; font-size: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Shop POS Receipt</h2>
                    <p>Order #${order.id}</p>
                    <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
                    ${order.customerName ? `<p>Customer: ${order.customerName}</p>` : ''}
                </div>
                
                <div class="items">
                    ${order.items.map(item => `
                        <div class="item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>$${item.total.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total">
                    <div class="item">
                        <span>Total</span>
                        <span>$${order.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Payment: ${order.paymentMethod}</p>
                    <p>Thank you for your business!</p>
                </div>
            </body>
            </html>
        `;
        receiptWindow.document.write(receiptContent);
        receiptWindow.document.close();
        receiptWindow.print();
    }

    getOrdersByStatus = (status) => {
        return this.state.orders.filter(order => order.status === status);
    }

    getOrderStats = () => {
        const total = this.state.orders.length;
        const pending = this.getOrdersByStatus('pending').length;
        const completed = this.getOrdersByStatus('completed').length;
        const cancelled = this.getOrdersByStatus('cancelled').length;
        const totalRevenue = this.state.orders
            .filter(o => o.status === 'completed')
            .reduce((sum, order) => sum + order.total, 0);

        return { total, pending, completed, cancelled, totalRevenue };
    }

    // Suppliers helpers
    getSupplierProducts = (supplier) => {
        if (!supplier || !supplier.products) {
            return [];
        }
        return this.state.products.filter(p => supplier.products.includes(p.id));
    }

    getPurchaseOrdersBySupplier = (supplierId) => {
        return this.state.purchaseOrders.filter(po => po.supplierId === supplierId);
    }

    getSupplierStats = () => {
        const totalSuppliers = this.state.suppliers.length;
        const activeSuppliers = this.state.suppliers.filter(s => s.status === 'active').length;
        const onHoldSuppliers = this.state.suppliers.filter(s => s.status === 'on_hold').length;
        const totalPurchaseOrders = this.state.purchaseOrders.length;
        return { totalSuppliers, activeSuppliers, onHoldSuppliers, totalPurchaseOrders };
    }

    openSupplierModal = (supplier = null) => {
        if (supplier) {
            this.state.supplierForm = {
                id: supplier.id,
                name: supplier.name,
                contactName: supplier.contactName,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
                status: supplier.status,
            };
            this.state.editingSupplier = true;
        } else {
            this.state.supplierForm = {
                id: null,
                name: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                status: 'active',
            };
            this.state.editingSupplier = false;
        }
        this.state.showSupplierModal = true;
    }

    closeSupplierModal = () => {
        this.state.showSupplierModal = false;
        this.state.editingSupplier = false;
    }

    saveSupplier = () => {
        const form = this.state.supplierForm;
        if (!form.name.trim()) {
            alert('Please enter a supplier name');
            return;
        }

        if (this.state.editingSupplier && form.id != null) {
            this.state.suppliers = this.state.suppliers.map(s =>
                s.id === form.id ? { ...s, ...form } : s
            );
        } else {
            const maxId = this.state.suppliers.reduce((max, s) => Math.max(max, s.id), 0);
            const newSupplier = {
                ...form,
                id: maxId + 1,
                products: [],
                lastOrderDate: null,
                totalOrders: 0,
            };
            this.state.suppliers = [...this.state.suppliers, newSupplier];
        }

        this.closeSupplierModal();
    }

    viewSupplierDetails = (supplier) => {
        this.state.selectedSupplier = supplier;
    }

    clearSelectedSupplier = () => {
        this.state.selectedSupplier = null;
    }

    // Customers helpers
    getCustomerOrders = (customer) => {
        if (!customer || !customer.name) {
            return [];
        }
        return this.state.orders.filter(
            o => o.customerName && o.customerName.toLowerCase() === customer.name.toLowerCase()
        );
    }

    getCustomerStats = () => {
        const totalCustomers = this.state.customers.length;
        const totalLoyaltyPoints = this.state.customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
        const totalCustomerRevenue = this.state.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const vipCustomers = this.state.customers.filter(c => (c.totalSpent || 0) >= 200).length;
        return { totalCustomers, totalLoyaltyPoints, totalCustomerRevenue, vipCustomers };
    }

    openCustomerModal = (customer = null) => {
        if (customer) {
            this.state.customerForm = {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                loyaltyPoints: customer.loyaltyPoints || 0,
            };
            this.state.editingCustomer = true;
        } else {
            this.state.customerForm = {
                id: null,
                name: '',
                email: '',
                phone: '',
                address: '',
                loyaltyPoints: 0,
            };
            this.state.editingCustomer = false;
        }
        this.state.showCustomerModal = true;
    }

    closeCustomerModal = () => {
        this.state.showCustomerModal = false;
        this.state.editingCustomer = false;
    }

    saveCustomer = () => {
        const form = this.state.customerForm;
        if (!form.name.trim()) {
            alert('Please enter a customer name');
            return;
        }

        if (this.state.editingCustomer && form.id != null) {
            this.state.customers = this.state.customers.map(c =>
                c.id === form.id ? { ...c, ...form } : c
            );
        } else {
            const maxId = this.state.customers.reduce((max, c) => Math.max(max, c.id), 0);
            const newCustomer = {
                ...form,
                id: maxId + 1,
                totalSpent: 0,
                totalOrders: 0,
                lastPurchaseDate: null,
            };
            this.state.customers = [...this.state.customers, newCustomer];
        }

        this.closeCustomerModal();
    }

    viewCustomerDetails = (customer) => {
        this.state.selectedCustomer = customer;
    }

    clearSelectedCustomer = () => {
        this.state.selectedCustomer = null;
    }

    addLoyaltyPoints = (customerId, points = 10) => {
        this.state.customers = this.state.customers.map(c =>
            c.id === customerId
                ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + points }
                : c
        );
    }

    // Reports helpers (simple analytics based on existing orders/products)
    getSalesSummary = () => {
        const completedOrders = this.getOrdersByStatus('completed');
        const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = completedOrders.length;
        const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;
        const totalProducts = this.state.products.length;
        return { totalSales, totalOrders, avgOrderValue, totalProducts };
    }

    getTopProductsBySales = (limit = 5) => {
        const salesByProduct = new Map();
        this.state.orders.forEach(order => {
            if (order.status !== 'completed') {
                return;
            }
            order.items.forEach(item => {
                const current = salesByProduct.get(item.productId) || { qty: 0, total: 0, name: item.name };
                current.qty += item.quantity;
                current.total += item.total;
                current.name = item.name;
                salesByProduct.set(item.productId, current);
            });
        });
        return Array.from(salesByProduct.entries())
            .map(([productId, data]) => ({ productId, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }

    getStaffList = () => {
        // Static seed for now; could be fetched from backend later
        return [
            { id: 1, name: 'Alice', role: 'Cashier', status: 'active', lastLogin: '2024-03-14 09:10' },
            { id: 2, name: 'Bob', role: 'Manager', status: 'active', lastLogin: '2024-03-14 08:50' },
            { id: 3, name: 'Charlie', role: 'Stock Keeper', status: 'inactive', lastLogin: '2024-03-10 16:20' },
        ];
    }

    // Simple settings state mutations (dark mode, sound, etc.) could be wired to real config later
    toggleSettingFlag = (key) => {
        // generic toggler for boolean settings kept in state.settingsConfig
        if (!this.state.settingsConfig) {
            this.state.settingsConfig = {
                darkMode: false,
                soundEnabled: true,
                autoPrintReceipt: false,
            };
        }
        this.state.settingsConfig = {
            ...this.state.settingsConfig,
            [key]: !this.state.settingsConfig[key],
        };
    }

    setSettingValue = (key, value) => {
        if (!this.state.settingsConfig) {
            this.state.settingsConfig = {};
        }
        this.state.settingsConfig = {
            ...this.state.settingsConfig,
            [key]: value,
        };
    }

    handleLogout = () => {
        // In real app, you might redirect or clear session.
        alert('You have been logged out from the POS Dashboard.');
        this.state.activeMenu = 'dashboard';
    }
}

POSDashboard.template = "shop_pos_frontend.Dashboard";
registry.category("actions").add("shop_pos_dashboard", POSDashboard);