import { create } from 'zustand';

const API_BASE = 'http://localhost:4000/api/v1';

// Direct request wrapper sending Bearer Authorization and handling JSON
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // Attempt Token Refresh (calling refresh route)
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST' });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newToken = refreshJson.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        // Re-attempt request
        const retryRes = await fetch(`${API_BASE}${url}`, { ...options, headers });
        if (retryRes.ok) return await retryRes.json();
      }
    } catch (err) {
      console.error('Refresh token failed:', err);
    }
    
    // Clear token if refresh fails
    localStorage.removeItem('accessToken');
    // Dispatch custom event to let App.jsx handle logout/auth reset
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Unauthorized');
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'API request failed');
  }
  return json;
};

// Map payment methods: UI names vs Database enums
const mapPaymentMethodToDB = (method) => {
  if (method === 'Credit Card' || method === 'CARD') return 'CARD';
  if (method === 'Bank Transfer' || method === 'BANK_TRANSFER') return 'BANK_TRANSFER';
  if (method === 'UPI') return 'UPI';
  if (method === 'Cash' || method === 'CASH') return 'CASH';
  return 'CARD'; // Default
};

const mapPaymentMethodToUI = (method) => {
  if (method === 'CARD') return 'Credit Card';
  if (method === 'BANK_TRANSFER') return 'Bank Transfer';
  if (method === 'UPI') return 'UPI';
  if (method === 'CASH') return 'Cash';
  return method;
};

export const useFinanceStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  
  summary: {
    totalCapital: '0.00',
    totalIncome: '0.00',
    totalExpenses: '0.00',
    netBurn: '0.00',
    currentBalance: '0.00',
    burnRate: '0.00',
    runway: '0.00',
    expensesByCategory: [],
    dailySpend: []
  },

  expenses: [],
  income: [],
  capital: [],
  ledger: [],
  vendors: [],
  categories: [],
  invitations: [],
  
  // Auth Operations
  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isAuthenticated: false, isInitialized: true, user: null });
      return;
    }
    try {
      const profile = await apiRequest('/auth/me');
      set({ user: profile.data, isAuthenticated: true, isInitialized: true });
    } catch (err) {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || 'Login failed');
    }
    localStorage.setItem('accessToken', json.data.accessToken);
    set({ user: json.data.user, isAuthenticated: true });
  },

  signup: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || 'Signup failed');
    }
    localStorage.setItem('accessToken', json.data.accessToken);
    set({ user: json.data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  // Fetch Data Actions
  fetchSummary: async () => {
    try {
      const json = await apiRequest('/dashboard/summary');
      set({ summary: json.data });
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    }
  },

  fetchExpenses: async (filters = {}) => {
    try {
      const query = new URLSearchParams({
        page: 1,
        limit: 1000,
        ...filters
      }).toString();
      const json = await apiRequest(`/expenses?${query}`);
      
      const mapped = json.data.map(exp => ({
        id: exp.id,
        date: exp.date.split('T')[0],
        category: exp.category,
        vendor: exp.vendor ? exp.vendor.name : 'N/A',
        vendorId: exp.vendorId,
        description: exp.description,
        baseAmount: Number(exp.baseAmount),
        gstRate: Number(exp.gstPercent),
        gstAmount: Number(exp.gstAmount),
        total: Number(exp.totalAmount),
        paymentMethod: mapPaymentMethodToUI(exp.paymentMethod),
        paidBy: exp.paidBy ? exp.paidBy.name : 'N/A',
        status: exp.status === 'PAID' ? 'Paid' : (exp.status === 'PENDING' ? 'Pending' : exp.status),
        notes: exp.notes
      }));

      set({ expenses: mapped });
    } catch (e) {
      console.error('Failed to fetch expenses:', e);
    }
  },

  fetchIncome: async () => {
    try {
      const json = await apiRequest('/income?page=1&limit=1000');
      const mapped = json.data.map(inc => ({
        id: inc.id,
        date: inc.date.split('T')[0],
        category: inc.category,
        source: inc.category,
        description: inc.description,
        amount: Number(inc.totalAmount),
        paymentMethod: mapPaymentMethodToUI(inc.paymentMethod),
        receivedBy: inc.paidBy ? inc.paidBy.name : 'N/A',
        status: inc.status === 'COMPLETED' ? 'Completed' : inc.status
      }));
      set({ income: mapped });
    } catch (e) {
      console.error('Failed to fetch income:', e);
    }
  },

  fetchCapital: async () => {
    try {
      const json = await apiRequest('/capital');
      const mapped = json.data.map(cap => ({
        id: cap.id,
        date: cap.date.split('T')[0],
        source: cap.contributor ? cap.contributor.name : 'Founder Equity',
        description: cap.description,
        amount: Number(cap.amount),
        paymentMethod: mapPaymentMethodToUI(cap.paymentMethod),
        status: 'Completed'
      }));
      set({ capital: mapped });
    } catch (e) {
      console.error('Failed to fetch capital:', e);
    }
  },

  fetchLedger: async () => {
    try {
      const json = await apiRequest('/ledger?page=1&limit=1000');
      const mapped = json.data.map(item => ({
        id: item.id,
        date: item.date.split('T')[0],
        type: item.type === 'EXPENSE' ? 'debit' : 'credit',
        description: item.description,
        amount: Number(item.type === 'EXPENSE' ? item.debit : item.credit),
        balance: Number(item.balance)
      }));
      set({ ledger: mapped });
    } catch (e) {
      console.error('Failed to fetch ledger:', e);
    }
  },

  fetchVendors: async () => {
    try {
      const json = await apiRequest('/vendors');
      set({ vendors: json.data });
    } catch (e) {
      console.error('Failed to fetch vendors:', e);
    }
  },

  fetchCategories: async () => {
    try {
      const json = await apiRequest('/categories');
      set({ categories: json.data });
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  },

  fetchInvitations: async () => {
    try {
      const json = await apiRequest('/invitations');
      set({ invitations: json.data });
    } catch (e) {
      console.error('Failed to fetch invitations:', e);
    }
  },

  // Mutations
  addExpense: async (expense) => {
    // Lookup vendor ID or create it dynamically if it doesn't exist
    let vendorId = null;
    if (expense.vendor) {
      const match = get().vendors.find(v => v.name.toLowerCase() === expense.vendor.toLowerCase());
      if (match) {
        vendorId = match.id;
      } else {
        const created = await apiRequest('/vendors', {
          method: 'POST',
          body: JSON.stringify({ name: expense.vendor })
        });
        vendorId = created.data.id;
        await get().fetchVendors();
      }
    }

    await apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date(expense.date).toISOString(),
        category: expense.category,
        vendorId,
        description: expense.description || 'N/A',
        baseAmount: Number(expense.baseAmount),
        gstPercent: Number(expense.gstRate),
        paymentMethod: mapPaymentMethodToDB(expense.paymentMethod),
        status: expense.status === 'Paid' ? 'PAID' : 'PENDING',
        notes: expense.notes || ''
      })
    });

    await get().fetchExpenses();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  updateExpense: async (id, updated) => {
    let vendorId = null;
    if (updated.vendor) {
      const match = get().vendors.find(v => v.name.toLowerCase() === updated.vendor.toLowerCase());
      if (match) {
        vendorId = match.id;
      } else {
        const created = await apiRequest('/vendors', {
          method: 'POST',
          body: JSON.stringify({ name: updated.vendor })
        });
        vendorId = created.data.id;
        await get().fetchVendors();
      }
    }

    await apiRequest(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        date: updated.date ? new Date(updated.date).toISOString() : undefined,
        category: updated.category,
        vendorId,
        description: updated.description,
        baseAmount: updated.baseAmount !== undefined ? Number(updated.baseAmount) : undefined,
        gstPercent: updated.gstRate !== undefined ? Number(updated.gstRate) : undefined,
        paymentMethod: updated.paymentMethod ? mapPaymentMethodToDB(updated.paymentMethod) : undefined,
        status: updated.status ? (updated.status === 'Paid' ? 'PAID' : 'PENDING') : undefined,
        notes: updated.notes
      })
    });

    await get().fetchExpenses();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  deleteExpense: async (id) => {
    await apiRequest(`/expenses/${id}`, {
      method: 'DELETE'
    });
    await get().fetchExpenses();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  addIncome: async (inc) => {
    await apiRequest('/income', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date(inc.date).toISOString(),
        category: inc.category,
        description: inc.description || 'N/A',
        totalAmount: Number(inc.amount),
        paymentMethod: mapPaymentMethodToDB(inc.paymentMethod),
        status: 'COMPLETED'
      })
    });
    await get().fetchIncome();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  deleteIncome: async (id) => {
    await apiRequest(`/income/${id}`, {
      method: 'DELETE'
    });
    await get().fetchIncome();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  addCapital: async (cap) => {
    await apiRequest('/capital', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date(cap.date).toISOString(),
        description: cap.description || 'N/A',
        amount: Number(cap.amount),
        paymentMethod: mapPaymentMethodToDB(cap.paymentMethod)
      })
    });
    await get().fetchCapital();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  deleteCapital: async (id) => {
    await apiRequest(`/capital/${id}`, {
      method: 'DELETE'
    });
    await get().fetchCapital();
    await get().fetchSummary();
    await get().fetchLedger();
  },

  inviteCoFounder: async (email) => {
    const json = await apiRequest('/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, role: 'CO_FOUNDER' })
    });
    await get().fetchInvitations();
    return json.data;
  },

  revokeInvitation: async (id) => {
    await apiRequest(`/invitations/${id}`, {
      method: 'DELETE'
    });
    await get().fetchInvitations();
  },

  verifyInviteToken: async (token) => {
    const res = await fetch(`${API_BASE}/invitations/token/${token}`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || 'Invalid token');
    }
    return json.data;
  },

  resetDatabase: async () => {
    await fetch(`${API_BASE}/debug/reset`, { method: 'POST' });
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  // Helpers for synchronous templates / views
  getTotalCapital: () => Number(get().summary.totalCapital),
  getTotalExpenses: () => Number(get().summary.totalExpenses),
  getTotalIncome: () => Number(get().summary.totalIncome),
  getCurrentBalance: () => Number(get().summary.currentBalance),
  getNetBurn: () => Number(get().summary.netBurn)
}));
