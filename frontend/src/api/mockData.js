/* Mock Data for Odoo Cafe POS */

let nextId = 1000;
export const generateId = () => String(++nextId);

export const mockCategories = [
  { id: '1', name: 'Coffee', color: '#8B5CF6' },
  { id: '2', name: 'Tea', color: '#10B981' },
  { id: '3', name: 'Pastries', color: '#F59E0B' },
  { id: '4', name: 'Sandwiches', color: '#EF4444' },
  { id: '5', name: 'Smoothies', color: '#EC4899' },
  { id: '6', name: 'Desserts', color: '#6366F1' },
  { id: '7', name: 'Beverages', color: '#14B8A6' },
];

export const mockProducts = [
  { id: '1', name: 'Espresso', categoryId: '1', price: 3.50, tax: 5, uom: 'Per Piece', description: 'Rich single-shot espresso' },
  { id: '2', name: 'Cappuccino', categoryId: '1', price: 4.50, tax: 5, uom: 'Per Piece', description: 'Espresso with steamed milk foam' },
  { id: '3', name: 'Latte', categoryId: '1', price: 5.00, tax: 5, uom: 'Per Piece', description: 'Smooth espresso with milk' },
  { id: '4', name: 'Americano', categoryId: '1', price: 3.75, tax: 5, uom: 'Per Piece', description: 'Espresso with hot water' },
  { id: '5', name: 'Mocha', categoryId: '1', price: 5.50, tax: 5, uom: 'Per Piece', description: 'Chocolate espresso with milk' },
  { id: '6', name: 'Green Tea', categoryId: '2', price: 3.00, tax: 5, uom: 'Per Piece', description: 'Organic Japanese green tea' },
  { id: '7', name: 'Chai Latte', categoryId: '2', price: 4.25, tax: 5, uom: 'Per Piece', description: 'Spiced tea with steamed milk' },
  { id: '8', name: 'Earl Grey', categoryId: '2', price: 3.25, tax: 5, uom: 'Per Piece', description: 'Classic bergamot-infused black tea' },
  { id: '9', name: 'Croissant', categoryId: '3', price: 3.50, tax: 8, uom: 'Per Piece', description: 'Buttery French pastry' },
  { id: '10', name: 'Blueberry Muffin', categoryId: '3', price: 3.75, tax: 8, uom: 'Per Piece', description: 'Fresh blueberry muffin' },
  { id: '11', name: 'Chocolate Cake', categoryId: '6', price: 6.00, tax: 8, uom: 'Per Piece', description: 'Rich dark chocolate cake slice' },
  { id: '12', name: 'Club Sandwich', categoryId: '4', price: 8.50, tax: 10, uom: 'Per Piece', description: 'Triple-decker with chicken, bacon, lettuce' },
  { id: '13', name: 'Grilled Panini', categoryId: '4', price: 7.50, tax: 10, uom: 'Per Piece', description: 'Pressed Italian panini with mozzarella' },
  { id: '14', name: 'Mango Smoothie', categoryId: '5', price: 5.50, tax: 5, uom: 'Per Piece', description: 'Fresh mango blended with yogurt' },
  { id: '15', name: 'Berry Blast', categoryId: '5', price: 6.00, tax: 5, uom: 'Per Piece', description: 'Mixed berry smoothie' },
  { id: '16', name: 'Tiramisu', categoryId: '6', price: 7.00, tax: 8, uom: 'Per Piece', description: 'Classic Italian coffee dessert' },
  { id: '17', name: 'Fresh Orange Juice', categoryId: '7', price: 4.00, tax: 5, uom: 'Per Piece', description: 'Freshly squeezed orange juice' },
  { id: '18', name: 'Sparkling Water', categoryId: '7', price: 2.50, tax: 5, uom: 'Per Piece', description: 'Italian sparkling mineral water' },
  { id: '19', name: 'Macchiato', categoryId: '1', price: 4.00, tax: 5, uom: 'Per Piece', description: 'Espresso stained with milk' },
  { id: '20', name: 'Iced Coffee', categoryId: '1', price: 4.50, tax: 5, uom: 'Per Piece', description: 'Cold brew over ice' },
];

export const mockFloors = [
  { id: '1', name: 'Ground Floor' },
  { id: '2', name: 'Terrace' },
  { id: '3', name: 'VIP Lounge' },
];

export const mockTables = [
  { id: '1', floorId: '1', number: 1, seats: 2, active: true, status: 'available' },
  { id: '2', floorId: '1', number: 2, seats: 4, active: true, status: 'occupied' },
  { id: '3', floorId: '1', number: 3, seats: 4, active: true, status: 'available' },
  { id: '4', floorId: '1', number: 4, seats: 6, active: true, status: 'available' },
  { id: '5', floorId: '1', number: 5, seats: 2, active: true, status: 'occupied' },
  { id: '6', floorId: '1', number: 6, seats: 8, active: true, status: 'available' },
  { id: '7', floorId: '2', number: 7, seats: 4, active: true, status: 'available' },
  { id: '8', floorId: '2', number: 8, seats: 4, active: true, status: 'available' },
  { id: '9', floorId: '2', number: 9, seats: 6, active: true, status: 'occupied' },
  { id: '10', floorId: '2', number: 10, seats: 2, active: true, status: 'available' },
  { id: '11', floorId: '3', number: 11, seats: 4, active: true, status: 'available' },
  { id: '12', floorId: '3', number: 12, seats: 8, active: true, status: 'available' },
];

export const mockPaymentMethods = [
  { id: '1', type: 'cash', name: 'Cash', enabled: true },
  { id: '2', type: 'card', name: 'Digital / Card', enabled: true },
  { id: '3', type: 'upi', name: 'UPI QR', enabled: true, upiId: 'cafe@ybl' },
];

export const mockCoupons = [
  { id: '1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10 },
  { id: '2', code: 'FLAT50', discountType: 'fixed', discountValue: 50 },
  { id: '3', code: 'COFFEE20', discountType: 'percentage', discountValue: 20 },
];

export const mockPromotions = [
  { id: '1', appliedTo: 'product', productId: '1', productName: 'Espresso', minimumQuantity: 3, discountType: 'percentage', discountValue: 15 },
  { id: '2', appliedTo: 'order', minimumOrderAmount: 50, discountType: 'fixed', discountValue: 10 },
  { id: '3', appliedTo: 'product', productId: '9', productName: 'Croissant', minimumQuantity: 2, discountType: 'percentage', discountValue: 10 },
];

export const mockUsers = [
  { id: '1', name: 'John Admin', email: 'admin@cafe.com', role: 'admin', status: 'active' },
  { id: '2', name: 'Sarah Cashier', email: 'sarah@cafe.com', role: 'employee', status: 'active' },
  { id: '3', name: 'Mike Barista', email: 'mike@cafe.com', role: 'employee', status: 'active' },
  { id: '4', name: 'Jane Former', email: 'jane@cafe.com', role: 'employee', status: 'archived' },
];

export const mockCustomers = [
  { id: '1', name: 'Alice Johnson', email: 'alice@email.com', phone: '+1-555-0101' },
  { id: '2', name: 'Bob Smith', email: 'bob@email.com', phone: '+1-555-0102' },
  { id: '3', name: 'Carol Williams', email: 'carol@email.com', phone: '+1-555-0103' },
  { id: '4', name: 'David Brown', email: 'david@email.com', phone: '+1-555-0104' },
];

export const mockOrders = [
  {
    id: '1001', date: '2026-06-13T08:30:00Z', customerId: '1', customerName: 'Alice Johnson',
    tableId: '2', tableNumber: 2, status: 'paid', paymentMethod: 'cash',
    items: [
      { productId: '2', name: 'Cappuccino', quantity: 2, price: 4.50, total: 9.00 },
      { productId: '9', name: 'Croissant', quantity: 1, price: 3.50, total: 3.50 },
    ],
    subtotal: 12.50, tax: 0.75, discount: 0, total: 13.25,
  },
  {
    id: '1002', date: '2026-06-13T09:15:00Z', customerId: '2', customerName: 'Bob Smith',
    tableId: '5', tableNumber: 5, status: 'paid', paymentMethod: 'upi',
    items: [
      { productId: '3', name: 'Latte', quantity: 1, price: 5.00, total: 5.00 },
      { productId: '10', name: 'Blueberry Muffin', quantity: 2, price: 3.75, total: 7.50 },
      { productId: '17', name: 'Fresh Orange Juice', quantity: 1, price: 4.00, total: 4.00 },
    ],
    subtotal: 16.50, tax: 1.10, discount: 0, total: 17.60,
  },
  {
    id: '1003', date: '2026-06-13T09:45:00Z', customerId: null, customerName: 'Walk-in',
    tableId: '9', tableNumber: 9, status: 'draft', paymentMethod: null,
    items: [
      { productId: '12', name: 'Club Sandwich', quantity: 2, price: 8.50, total: 17.00 },
      { productId: '14', name: 'Mango Smoothie', quantity: 2, price: 5.50, total: 11.00 },
    ],
    subtotal: 28.00, tax: 2.35, discount: 0, total: 30.35,
  },
];

export const mockKDSOrders = [
  {
    id: 'K001', orderNumber: '1004', stage: 'to_cook', createdAt: '2026-06-13T10:00:00Z',
    items: [
      { id: 'ki1', name: 'Cappuccino', quantity: 2, completed: false },
      { id: 'ki2', name: 'Croissant', quantity: 1, completed: false },
    ],
  },
  {
    id: 'K002', orderNumber: '1005', stage: 'to_cook', createdAt: '2026-06-13T10:05:00Z',
    items: [
      { id: 'ki3', name: 'Club Sandwich', quantity: 1, completed: false },
      { id: 'ki4', name: 'Mango Smoothie', quantity: 1, completed: false },
      { id: 'ki5', name: 'Latte', quantity: 2, completed: false },
    ],
  },
  {
    id: 'K003', orderNumber: '1006', stage: 'preparing', createdAt: '2026-06-13T09:50:00Z',
    items: [
      { id: 'ki6', name: 'Grilled Panini', quantity: 2, completed: true },
      { id: 'ki7', name: 'Espresso', quantity: 3, completed: false },
    ],
  },
  {
    id: 'K004', orderNumber: '1007', stage: 'completed', createdAt: '2026-06-13T09:30:00Z',
    items: [
      { id: 'ki8', name: 'Green Tea', quantity: 2, completed: true },
      { id: 'ki9', name: 'Chocolate Cake', quantity: 1, completed: true },
    ],
  },
];

export const mockSession = {
  id: 'S001',
  isOpen: true,
  openedAt: '2026-06-13T08:00:00Z',
  closedAt: null,
  employeeId: '2',
  employeeName: 'Sarah Cashier',
  totalOrders: 3,
  totalRevenue: 61.20,
};

export const mockReportData = {
  totalOrders: 156,
  revenue: 4280.50,
  averageOrderValue: 27.44,
  salesTrend: [
    { date: 'Mon', revenue: 580, orders: 22 },
    { date: 'Tue', revenue: 620, orders: 25 },
    { date: 'Wed', revenue: 540, orders: 20 },
    { date: 'Thu', revenue: 710, orders: 28 },
    { date: 'Fri', revenue: 830, orders: 32 },
    { date: 'Sat', revenue: 950, orders: 38 },
    { date: 'Sun', revenue: 680, orders: 26 },
  ],
  topCategories: [
    { name: 'Coffee', revenue: 1450, color: '#8B5CF6' },
    { name: 'Sandwiches', revenue: 980, color: '#EF4444' },
    { name: 'Pastries', revenue: 750, color: '#F59E0B' },
    { name: 'Smoothies', revenue: 520, color: '#EC4899' },
    { name: 'Desserts', revenue: 380, color: '#6366F1' },
    { name: 'Tea', revenue: 320, color: '#10B981' },
    { name: 'Beverages', revenue: 280, color: '#14B8A6' },
  ],
  topProducts: [
    { name: 'Cappuccino', qtySold: 85, revenue: 382.50 },
    { name: 'Club Sandwich', qtySold: 52, revenue: 442.00 },
    { name: 'Latte', qtySold: 68, revenue: 340.00 },
    { name: 'Croissant', qtySold: 45, revenue: 157.50 },
    { name: 'Mango Smoothie', qtySold: 38, revenue: 209.00 },
  ],
  topOrders: [
    { orderNumber: '1050', date: '2026-06-13', customer: 'Alice Johnson', amount: 85.50 },
    { orderNumber: '1042', date: '2026-06-12', customer: 'Bob Smith', amount: 72.30 },
    { orderNumber: '1038', date: '2026-06-12', customer: 'Carol Williams', amount: 65.00 },
    { orderNumber: '1025', date: '2026-06-11', customer: 'David Brown', amount: 58.75 },
    { orderNumber: '1018', date: '2026-06-11', customer: 'Walk-in', amount: 52.40 },
  ],
};

/* Helper to simulate async delay */
export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
