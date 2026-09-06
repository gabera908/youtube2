const API = {
  async getAll(endpoint) {
    try {
      const result = await window.electronAPI.apiGet(endpoint);
      if (result.success) {
        return { success: true, data: result.data };
      }
      throw new Error(result.error || 'فشل في جلب البيانات');
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message || 'حدث خطأ غير متوقع' };
    }
  },

  async getOne(endpoint, id) {
    try {
      const result = await window.electronAPI.apiGet(`${endpoint}/${id}`);
      if (result.success) {
        return { success: true, data: result.data };
      }
      throw new Error(result.error || 'فشل في جلب البيانات');
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message || 'حدث خطأ غير متوقع' };
    }
  },

  async create(endpoint, data) {
    try {
      const result = await window.electronAPI.apiPost(endpoint, data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      throw new Error(result.error || 'فشل في إنشاء البيانات');
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message || 'حدث خطأ أثناء الإنشاء' };
    }
  },

  async update(endpoint, id, data) {
    try {
      const result = await window.electronAPI.apiPut(`${endpoint}/${id}`, data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      throw new Error(result.error || 'فشل في تحديث البيانات');
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message || 'حدث خطأ أثناء التحديث' };
    }
  },

  async remove(endpoint, id) {
    try {
      const result = await window.electronAPI.apiDelete(`${endpoint}/${id}`);
      if (result.success) {
        return { success: true, data: result.data };
      }
      throw new Error(result.error || 'فشل في حذف البيانات');
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message || 'حدث خطأ أثناء الحذف' };
    }
  },
};
