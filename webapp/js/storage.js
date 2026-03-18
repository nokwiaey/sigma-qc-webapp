/**
 * 标准化西格玛性能验证图及自动选择质控程序
 * 浏览器本地存储模块
 * 
 * 封装 localStorage 操作，提供项目数据的持久化存储
 */

/**
 * Storage 类 - 封装 localStorage 操作
 */
class Storage {
    constructor() {
        this.prefix = 'sigma_qc_';
    }

    /**
     * 获取完整的存储键名
     * @param {string} key - 原始键名
     * @returns {string} 带前缀的完整键名
     */
    _getKey(key) {
        return this.prefix + key;
    }

    /**
     * 设置存储项
     * @param {string} key - 键名
     * @param {*} value - 要存储的值
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this._getKey(key), serialized);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * 获取存储项
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 存储的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this._getKey(key));
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    /**
     * 移除存储项
     * @param {string} key - 键名
     */
    remove(key) {
        try {
            localStorage.removeItem(this._getKey(key));
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * 清空所有应用相关的存储
     */
    clear() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * 获取所有存储的键名
     * @returns {string[]} 键名数组
     */
    keys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }

    /**
     * 检查是否存在某个键
     * @param {string} key - 键名
     * @returns {boolean} 是否存在
     */
    has(key) {
        return localStorage.getItem(this._getKey(key)) !== null;
    }
}

/**
 * 项目数据存储管理
 */
class ProjectStorage {
    constructor(storage) {
        this.storage = storage;
        this.key = 'projects';
    }

    /**
     * 获取所有项目数据
     * @returns {Array} 项目数据数组
     */
    getAll() {
        return this.storage.get(this.key, []);
    }

    /**
     * 根据ID获取项目
     * @param {string} id - 项目ID
     * @returns {Object|null} 项目数据
     */
    getById(id) {
        const projects = this.getAll();
        return projects.find(p => p.id === id) || null;
    }

    /**
     * 保存项目（新增或更新）
     * @param {Object} project - 项目数据
     * @returns {boolean} 是否成功
     */
    save(project) {
        const projects = this.getAll();
        const index = projects.findIndex(p => p.id === project.id);
        
        if (index >= 0) {
            projects[index] = { ...projects[index], ...project, updatedAt: new Date().toISOString() };
        } else {
            projects.push({ ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        
        return this.storage.set(this.key, projects);
    }

    /**
     * 批量保存项目
     * @param {Array} projects - 项目数据数组
     * @returns {boolean} 是否成功
     */
    saveBatch(projects) {
        const existing = this.getAll();
        const now = new Date().toISOString();
        
        projects.forEach(project => {
            const index = existing.findIndex(p => p.id === project.id);
            if (index >= 0) {
                existing[index] = { ...existing[index], ...project, updatedAt: now };
            } else {
                existing.push({ ...project, createdAt: now, updatedAt: now });
            }
        });
        
        return this.storage.set(this.key, existing);
    }

    /**
     * 删除项目
     * @param {string} id - 项目ID
     * @returns {boolean} 是否成功
     */
    delete(id) {
        const projects = this.getAll();
        const filtered = projects.filter(p => p.id !== id);
        
        if (filtered.length === projects.length) {
            return false;
        }
        
        return this.storage.set(this.key, filtered);
    }

    /**
     * 清空所有项目
     * @returns {boolean} 是否成功
     */
    clear() {
        return this.storage.set(this.key, []);
    }

    /**
     * 获取项目数量
     * @returns {number} 项目数量
     */
    count() {
        return this.getAll().length;
    }
}

/**
 * 数据导出/导入管理
 */
class DataExportImport {
    constructor(projectStorage) {
        this.projectStorage = projectStorage;
    }

    /**
     * 导出所有数据为JSON对象
     * @returns {Object} 包含所有数据的JSON对象
     */
    exportToJSON() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            projects: this.projectStorage.getAll()
        };
    }

    /**
     * 导出数据为JSON字符串
     * @returns {string} JSON字符串
     */
    exportToJSONString() {
        return JSON.stringify(this.exportToJSON(), null, 2);
    }

    /**
     * 下载JSON文件
     * @param {string} filename - 文件名
     */
    downloadJSON(filename = 'sigma_qc_data.json') {
        const jsonStr = this.exportToJSONString();
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 从JSON对象导入数据
     * @param {Object} data - 数据对象
     * @param {boolean} merge - 是否合并（true: 合并，false: 替换）
     * @returns {Object} 导入结果 { success: boolean, message: string, imported: number }
     */
    importFromJSON(data, merge = false) {
        try {
            if (!data || typeof data !== 'object') {
                return { success: false, message: '无效的数据格式', imported: 0 };
            }

            // 导入项目数据
            let importedCount = 0;
            if (Array.isArray(data.projects)) {
                if (!merge) {
                    this.projectStorage.clear();
                }
                
                const projects = data.projects.filter(p => p && p.projectName);
                this.projectStorage.saveBatch(projects);
                importedCount = projects.length;
            }

            return {
                success: true,
                message: `成功导入 ${importedCount} 个项目`,
                imported: importedCount
            };
        } catch (error) {
            return {
                success: false,
                message: '导入失败: ' + error.message,
                imported: 0
            };
        }
    }

    /**
     * 从JSON字符串导入数据
     * @param {string} jsonStr - JSON字符串
     * @param {boolean} merge - 是否合并
     * @returns {Object} 导入结果
     */
    importFromJSONString(jsonStr, merge = false) {
        try {
            const data = JSON.parse(jsonStr);
            return this.importFromJSON(data, merge);
        } catch (error) {
            return {
                success: false,
                message: 'JSON解析失败: ' + error.message,
                imported: 0
            };
        }
    }

    /**
     * 从文件导入数据
     * @param {File} file - 文件对象
     * @param {boolean} merge - 是否合并
     * @returns {Promise<Object>} 导入结果
     */
    importFromFile(file, merge = false) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const result = this.importFromJSONString(e.target.result, merge);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }
}

// 创建全局实例
const storage = new Storage();
const projectStorage = new ProjectStorage(storage);
const dataExportImport = new DataExportImport(projectStorage);

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Storage,
        ProjectStorage,
        DataExportImport,
        storage,
        projectStorage,
        dataExportImport
    };
}
