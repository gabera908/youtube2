const { contextBridge, ipcRenderer } = require('electron');

const API_BASE = 'http://localhost:3030/api';

async function safeInvoke(channel, data) {
  try {
    const result = await ipcRenderer.invoke(channel, data);
    return result;
  } catch (error) {
    return { success: false, error: error.message || 'IPC invoke failed' };
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  apiGet: (endpoint) => safeInvoke('api-request', { method: 'GET', url: `${API_BASE}${endpoint}` }),
  apiPost: (endpoint, data) =>
    safeInvoke('api-request', { method: 'POST', url: `${API_BASE}${endpoint}`, data }),
  apiPut: (endpoint, data) =>
    safeInvoke('api-request', { method: 'PUT', url: `${API_BASE}${endpoint}`, data }),
  apiDelete: (endpoint) =>
    safeInvoke('api-request', { method: 'DELETE', url: `${API_BASE}${endpoint}` }),

  onMenuAction: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
});
