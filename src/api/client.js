import { BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

let token = localStorage.getItem('token');
let onUnauthorized = () => {};
export const setToken = (t) => { token = t; t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const clean = (o) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined));

async function request(method, path, { params, body } = {}) {
  const qs = params ? '?' + new URLSearchParams(clean(params)) : '';
  let res;
  try {
    res = await fetch(BASE_URL + path + qs, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your network and the base URL.', 0);
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized();
  if (!res.ok || json.success === false)
    throw new ApiError(json.errors?.[0]?.message || json.message || 'Request failed', res.status);
  return json; // { success, message, data, meta }
}

const get = (p, params) => request('GET', p, { params });
const post = (p, body) => request('POST', p, { body });
const put = (p, body) => request('PUT', p, { body });
const patch = (p, body) => request('PATCH', p, { body });
const del = (p) => request('DELETE', p);

export const auth = { login: (b) => post('/auth/login', b) };

export const admin = {
  dashboard: () => get('/admin/dashboard'),
  mavshis: (p) => get('/admin/mavshis', p),
  mavshi: (id) => get(`/admin/mavshis/${id}`),
  approve: (id, b) => patch(`/admin/mavshis/${id}/approve`, clean(b)),
  reject: (id, b) => patch(`/admin/mavshis/${id}/reject`, b),
  setPlan: (id, b) => patch(`/admin/mavshis/${id}/plan`, b),
  plans: () => get('/admin/plans'),
  createPlan: (b) => post('/admin/plans', b),
  updatePlan: (id, b) => put(`/admin/plans/${id}`, b),
  deletePlan: (id) => del(`/admin/plans/${id}`),
  users: (p) => get('/admin/users', p),
  createUser: (b) => post('/admin/users', clean(b)),
  updateUser: (id, b) => put(`/admin/users/${id}`, clean(b)),
  setStatus: (id, b) => patch(`/admin/users/${id}/status`, clean(b)),
  deleteUser: (id) => del(`/admin/users/${id}`),
  orders: (p) => get('/admin/orders', p),
  order: (id) => get(`/admin/orders/${id}`),
  acceptOrder: (id, b) => patch(`/admin/orders/${id}/accept`, clean(b)),
  rejectOrder: (id, b) => patch(`/admin/orders/${id}/reject`, b),
  assignOrder: (id, b) => patch(`/admin/orders/${id}/assign`, b),
  availableBoys: (pincode) => get('/admin/delivery-boys/available', { pincode }),
  cancelOrder: (id, b) => patch(`/admin/orders/${id}/cancel`, b),
  deliveryBoys: (p) => get('/admin/delivery-boys', p),
  resetPassword: (id, b) => patch(`/admin/users/${id}/password`, b),
  sendNotification: (b) => post('/admin/notifications/send', clean(b)),
  sentNotifications: (p) => get('/admin/notifications/sent', p),
  settings: () => get('/admin/settings'),
  saveSettings: (b) => put('/admin/settings', b),
};

// Admin's own inbox (shared /notifications routes)
export const inbox = {
  list: () => get('/notifications'),
  read: (id) => patch(`/notifications/${id}/read`),
  readAll: () => patch('/notifications/read-all'),
  remove: (id) => del(`/notifications/${id}`),
};
