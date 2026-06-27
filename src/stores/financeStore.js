import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api/v1`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function with exponential backoff
const fetchWithRetry = async (url, options = {}, retries = 3, initialDelay = 1000) => {
  let delay = initialDelay;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(`[Network] Attempt ${attempt + 1} failed for ${url}. Retrying in ${delay}ms... Error:`, err);
      await wait(delay);
      delay *= 2; // exponential backoff
    }
  }
};

// Help diagnose the specific network issue
// Help diagnose the specific network issue
const diagnoseNetworkError = async (url, error, options = {}) => {
  let category;
  let message;
  
  const parsedUrl = new URL(url, window.location.origin);
  const isHttps = parsedUrl.protocol === 'https:';
  const isCurrentHttps = window.location.protocol === 'https:';

  if (!navigator.onLine) {
    category = 'Offline';
    message = 'Unable to connect. Your device appears to be offline. Please verify your internet connection.';
  } else if (isCurrentHttps && !isHttps) {
    category = 'Mixed HTTP/HTTPS Content';
    message = `Security Block: Mixed Content. The frontend is served securely over HTTPS, but the API URL '${url}' is configured as insecure HTTP. Browsers block insecure requests in secure contexts.`;
  } else if (error.name === 'AbortError') {
    category = 'Timeout';
    message = 'Request timed out. The Luminexis server took too long to respond. Please try again.';
  } else {
    try {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 2000);
      await fetch(parsedUrl.origin, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(tId);
      
      category = 'CORS / Route Inaccessible';
      message = `Connection established to server host but the endpoint '${parsedUrl.pathname}' was blocked or is incorrect. This might be due to a CORS configuration mismatch or an invalid API route.`;
    } catch {
      category = 'Server Offline';
      if (!import.meta.env.VITE_API_URL) {
        message = `Unable to connect to Luminexis servers at ${parsedUrl.host}. The server might be offline, or VITE_API_URL environment variable is missing/incorrect.`;
      } else {
        message = `Unable to connect to Luminexis servers at ${parsedUrl.host}. The server is offline or unavailable.`;
      }
    }
  }

  // Developer diagnostics print to the browser console
  console.group('%cDeveloper Diagnostics - Network Failure', 'color: #E53E3E; font-weight: bold; font-size: 12px;');
  console.error(`Root Cause Category: ${category}`);
  console.error(`Request URL: ${url}`);
  console.error(`Request Method: ${options.method || 'GET'}`);
  if (options.body) {
    try {
      const parsed = JSON.parse(options.body);
      if (parsed.password) parsed.password = '••••••••';
      console.error('Request Payload:', parsed);
    } catch {
      console.error('Request Payload:', options.body);
    }
  }
  console.error('Original Error:', error);
  console.error('Call Stack:', error.stack || new Error().stack);
  console.groupEnd();

  const errObj = new Error(message);
  errObj.category = category;
  errObj.originalError = error;
  return errObj;
};

// Direct request wrapper sending Bearer Authorization and handling JSON
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  let res;
  const fullUrl = `${API_BASE}${url}`;
  try {
    res = await fetchWithRetry(fullUrl, { ...options, headers });
  } catch (networkError) {
    const diagnosed = await diagnoseNetworkError(fullUrl, networkError, options);
    throw new Error(diagnosed.message, { cause: networkError });
  }

  if (res.status === 401) {
    // Attempt Token Refresh (calling refresh route)
    try {
      const refreshRes = await fetchWithRetry(`${API_BASE}/auth/refresh`, { method: 'POST' });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newToken = refreshJson.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        // Re-attempt request
        const retryRes = await fetchWithRetry(`${API_BASE}${url}`, { ...options, headers });
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

  let json;
  try {
    json = await res.json();
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError);
    throw new Error('Server returned an unreadable response. This may indicate a server crash or database connection failure.', { cause: parseError });
  }

  if (!res.ok) {
    throw new Error(json.message || json.error?.message || 'API request failed');
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
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    const url = `${API_BASE}/auth/login`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    };
    let res;
    try {
      res = await fetchWithRetry(url, options);
    } catch (networkError) {
      const diagnosed = await diagnoseNetworkError(url, networkError, options);
      throw new Error(diagnosed.message, { cause: networkError });
    }

    let json;
    try {
      json = await res.json();
    } catch (parseError) {
      throw new Error('Server returned an unreadable response.', { cause: parseError });
    }

    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Login failed');
    }
    localStorage.setItem('accessToken', json.data.accessToken);
    set({ user: json.data.user, isAuthenticated: true });
  },

  signup: async (userData) => {
    const url = `${API_BASE}/auth/signup`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    };
    let res;
    try {
      res = await fetchWithRetry(url, options);
    } catch (networkError) {
      const diagnosed = await diagnoseNetworkError(url, networkError, options);
      throw new Error(diagnosed.message, { cause: networkError });
    }

    let json;
    try {
      json = await res.json();
    } catch (parseError) {
      throw new Error('Server returned an unreadable response. This may indicate a server crash or database connection failure.', { cause: parseError });
    }

    if (!res.ok) {
      const errMsg = json.message || json.error?.message || 'Signup failed';
      const apiError = new Error(errMsg);
      apiError.status = res.status;
      
      console.group('%cDeveloper Diagnostics - API Error Response', 'color: #D97706; font-weight: bold;');
      console.error(`Request URL: ${url}`);
      console.error(`Response Status: ${res.status}`);
      console.error('Response Body:', json);
      console.groupEnd();
      
      throw apiError;
    }

    localStorage.setItem('accessToken', json.data.accessToken);
    set({ user: json.data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await fetchWithRetry(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {
      // Clear token locally anyway
      localStorage.removeItem('accessToken');
    }
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  // Reset database (dev only) — wipes all tables so a fresh Founder can register
  resetDatabase: async () => {
    const url = `${API_BASE}/debug/reset`;
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    let res;
    try {
      res = await fetchWithRetry(url, options);
    } catch (networkError) {
      const diagnosed = await diagnoseNetworkError(url, networkError, options);
      throw new Error(diagnosed.message, { cause: networkError });
    }

    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error('Server returned an unreadable response.');
    }

    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Database reset failed');
    }

    // Clear local auth state after wipe
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
    return json;
  },

  // Verify an invitation token to get invite details (email, role)
  verifyInviteToken: async (token) => {
    const url = `${API_BASE}/invitations/token/${encodeURIComponent(token)}`;
    let res;
    try {
      res = await fetchWithRetry(url);
    } catch (networkError) {
      const diagnosed = await diagnoseNetworkError(url, networkError);
      throw new Error(diagnosed.message, { cause: networkError });
    }

    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error('Server returned an unreadable response.');
    }

    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Invalid or expired invitation link.');
    }
    return json.data;
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
      const json = await apiRequest('/ledger/bank?page=1&limit=1000');
      const mapped = json.data.map(item => ({
        id: item.id,
        date: item.date.split('T')[0],
        type: item.type === 'EXPENSE' || Number(item.debit) > 0 ? 'debit' : 'credit',
        description: item.description,
        amount: Number(Number(item.debit) > 0 ? item.debit : item.credit),
        balance: Number(item.balance),
        debit: Number(item.debit || 0),
        credit: Number(item.credit || 0)
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
        category: inc.source || 'Gross Revenue',
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

  updateIncome: async (id, updated) => {
    await apiRequest(`/income/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        date: updated.date ? new Date(updated.date).toISOString() : undefined,
        category: updated.source,
        description: updated.description,
        totalAmount: updated.amount !== undefined ? Number(updated.amount) : undefined,
        paymentMethod: updated.paymentMethod ? mapPaymentMethodToDB(updated.paymentMethod) : undefined,
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

  addLedgerEntry: async (entry) => {
    await apiRequest('/ledger/bank', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date(entry.date).toISOString(),
        description: entry.description,
        debit: Number(entry.debit || 0),
        credit: Number(entry.credit || 0),
        type: 'MANUAL'
      })
    });
    await get().fetchLedger();
    await get().fetchSummary();
  },

  updateLedgerEntry: async (id, updated) => {
    await apiRequest(`/ledger/bank/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        date: updated.date ? new Date(updated.date).toISOString() : undefined,
        description: updated.description,
        debit: updated.debit !== undefined ? Number(updated.debit) : undefined,
        credit: updated.credit !== undefined ? Number(updated.credit) : undefined,
        type: 'MANUAL'
      })
    });
    await get().fetchLedger();
    await get().fetchSummary();
  },

  deleteLedgerEntry: async (id) => {
    await apiRequest(`/ledger/bank/${id}`, {
      method: 'DELETE'
    });
    await get().fetchLedger();
    await get().fetchSummary();
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

  updateCapital: async (id, updated) => {
    await apiRequest(`/capital/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        date: updated.date ? new Date(updated.date).toISOString() : undefined,
        description: updated.description,
        amount: updated.amount !== undefined ? Number(updated.amount) : undefined,
        paymentMethod: updated.paymentMethod ? mapPaymentMethodToDB(updated.paymentMethod) : undefined
      })
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
    const url = `${API_BASE}/invitations/token/${token}`;
    let res;
    try {
      res = await fetchWithRetry(url);
    } catch (networkError) {
      const diagnosed = await diagnoseNetworkError(url, networkError);
      throw new Error(diagnosed.message, { cause: networkError });
    }

    let json;
    try {
      json = await res.json();
    } catch (parseError) {
      throw new Error('Server returned an unreadable response.', { cause: parseError });
    }

    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Invalid token');
    }
    return json.data;
  },

  resetDatabase: async () => {
    const url = `${API_BASE}/debug/reset`;
    let res;
    try {
      res = await fetchWithRetry(url, { method: 'POST' });
    } catch (networkError) {
      const diagnosed = await diagnoseNetworkError(url, networkError, { method: 'POST' });
      throw new Error(diagnosed.message, { cause: networkError });
    }

    if (!res.ok) {
      let json = null;
      try {
        const parsed = await res.json();
        json = parsed;
      } catch {
        console.warn('Could not parse database reset error JSON.');
      }
      throw new Error(json?.message || json?.error?.message || 'Failed to reset database');
    }
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
