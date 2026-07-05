import client from './client';

// Auth
export const signup = (data) => client.post('/auth/signup', data);
export const login = (data) => client.post('/auth/login', data);
export const getMe = () => client.get('/auth/me');

// Users
export const searchUsers = (q) => client.get('/users/search', { params: { q } });
export const getFriends = () => client.get('/users/friends');

// Groups
export const createGroup = (data) => client.post('/groups', data);
export const getMyGroups = () => client.get('/groups');
export const getGroup = (id) => client.get(`/groups/${id}`);
export const addGroupMember = (id, user_id) => client.post(`/groups/${id}/members`, { user_id });
export const removeGroupMember = (id, userId) => client.delete(`/groups/${id}/members/${userId}`);
export const deleteGroup = (id) => client.delete(`/groups/${id}`);

// Expenses
export const createExpense = (data) => client.post('/expenses', data);
export const getGroupExpenses = (groupId) => client.get(`/expenses/group/${groupId}`);
export const getFriendExpenses = (friendId) => client.get(`/expenses/friend/${friendId}`);
export const getExpense = (id) => client.get(`/expenses/${id}`);
export const deleteExpense = (id) => client.delete(`/expenses/${id}`);

// Balances
export const getGroupBalances = (groupId) => client.get(`/balances/group/${groupId}`);
export const getMySummary = () => client.get('/balances/summary');

// Settlements
export const createSettlement = (data) => client.post('/settlements', data);
export const getGroupSettlements = (groupId) => client.get(`/settlements/group/${groupId}`);
