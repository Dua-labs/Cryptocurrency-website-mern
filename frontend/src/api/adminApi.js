import api from './axiosConfig';

export const fetchAdminStats = () =>
  api.get('/admin/stats').then((r) => r.data.data);

export const fetchAdminUsers = (page = 1, limit = 20) =>
  api.get('/admin/users', { params: { page, limit } }).then((r) => r.data);

export const updateUserRole = (id, role) =>
  api.put(`/admin/users/${id}/role`, { role }).then((r) => r.data.data);

export const deleteAdminUser = (id) =>
  api.delete(`/admin/users/${id}`).then((r) => r.data);
