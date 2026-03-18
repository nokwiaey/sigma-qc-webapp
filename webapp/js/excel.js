/**
 * 标准化西格玛性能验证图及自动选择质控程序
 * Excel 导入导出模块
 * 
 * 使用 SheetJS (xlsx.js) 进行 Excel 文件的读写操作
 */

/**
 * Excel 导入器类
 * 负责从 Excel 文件读取数据并解析为项目数据
 */
class ExcelImporter {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls'];
    }

    /**
     * 检查文件格式是否支持
     * @param {File} file - 文件对象
     * @returns {boolean} 是否支持
     */
    isSupported(file) {
        if (!file) return false;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        return this.supportedFormats.includes(ext);
    }

    /**
     * 读取 Excel 文件
     * @param {File} file - 文件对象
     * @returns {Promise<Array>} 解析后的数据数组
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            if (!this.isSupported(file)) {
                reject(new Error('不支持的文件格式，请上传 .xlsx 或 .xls 文件'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 获取第一个工作表
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // 转换为 JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('解析 Excel 文件失败: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 解析项目数据
     * 支持解析列：项目名称、分析系统、TEa、CV、Bias
     * @param {Array} data - Excel 数据数组
     * @returns {Array} 解析后的项目数据数组
     */
    parseProjects(data) {
        if (!Array.isArray(data) || data.length < 2) {
            console.log('parseProjects: 数据为空或少于2行');
            return [];
        }

        const headers = data[0];
        console.log('parseProjects: 表头 =', headers);
        
        const projects = [];

        // 查找列索引
        const columnMap = this._mapColumns(headers);
        console.log('parseProjects: 列映射 =', columnMap);

        // 解析数据行
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const project = this._parseRow(row, columnMap);
            console.log(`parseProjects: 第${i}行解析结果 =`, project);
            
            if (project && project.projectName) {
                // 验证必填字段
                if (!project.tea || !project.cv || project.bias === undefined) {
                    console.warn(`parseProjects: 第${i}行数据不完整，跳过`);
                    continue;
                }
                
                // 计算西格玛值
                try {
                    const sigma = calculateSigma(project.tea, project.cv, project.bias);
                    const performance = evaluatePerformance(sigma);
                    const controlRule = getControlRules(performance);
                    const controlRuleText = getControlRulesText(performance);
                    const batchLength = getBatchLength(performance);
                    const color = getPerformanceColor(performance);
                    
                    project.sigma = sigma;
                    project.performance = performance;
                    project.controlRule = controlRule;
                    project.controlRuleText = controlRuleText;
                    project.batchLength = batchLength;
                    project.color = color;
                    project.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    project.createdAt = new Date().toISOString();
                    project.updatedAt = new Date().toISOString();
                    
                    projects.push(project);
                    console.log(`parseProjects: 第${i}行成功导入`);
                } catch (error) {
                    console.warn('计算西格玛值失败:', error.message);
                }
            } else {
                console.log(`parseProjects: 第${i}行项目名称为空，跳过`);
            }
        }

        console.log('parseProjects: 共导入', projects.length, '个项目');
        return projects;
    }

    /**
     * 映射列名到索引
     * @param {Array} headers - 表头数组
     * @returns {Object} 列名映射
     */
    _mapColumns(headers) {
        const map = {
            projectName: -1,
            year: -1,
            group: -1,
            analyticalSystem: -1,
            tea: -1,
            cv: -1,
            bias: -1
        };

        const headerMap = {
            // 项目名称
            '项目名称': 'projectName',
            '项目': 'projectName',
            '名称': 'projectName',
            'project': 'projectName',
            'projectname': 'projectName',
            
            // 年份
            '年份': 'year',
            'year': 'year',
            '年度': 'year',
            
            // 分组
            '分组': 'group',
            'group': 'group',
            '科室': 'group',
            '部门': 'group',
            
            // 分析系统
            '分析系统': 'analyticalSystem',
            '系统': 'analyticalSystem',
            '仪器': 'analyticalSystem',
            'analyticalsystem': 'analyticalSystem',
            'system': 'analyticalSystem',
            
            // 允许总误差 - 多种格式
            '允许总误差': 'tea',
            '允许总误差tea': 'tea',
            '允许总误差tea%': 'tea',      // 去括号后
            '允许总误差%': 'tea',          // 去括号后
            'tea': 'tea',
            'tea%': 'tea',
            
            // 变异系数 - 多种格式
            '变异系数': 'cv',
            '变异系数cv': 'cv',            // 去括号和%后
            '变异系数cv%': 'cv',           // 去括号后
            'cv': 'cv',
            'cv%': 'cv',
            
            // 偏倚 - 多种格式
            '偏倚': 'bias',
            '偏倚bias': 'bias',            // 去括号和%后
            '偏倚bias%': 'bias',           // 去括号后
            'bias': 'bias',
            'bias%': 'bias'
        };

        headers.forEach((header, index) => {
            if (header) {
                // 清理表头：转小写、去空格、去中英文括号、去百分号
                const normalizedHeader = String(header).trim().toLowerCase()
                    .replace(/[()（）]/g, '')  // 去掉中英文括号
                    .replace(/%/g, '')         // 去掉百分号
                    .replace(/\s+/g, '');      // 去掉所有空格
                
                console.log(`_mapColumns: 表头"${header}" -> 规范化"${normalizedHeader}"`);
                
                const key = headerMap[normalizedHeader];
                if (key && map[key] === -1) {
                    map[key] = index;
                    console.log(`_mapColumns: 匹配成功 ${key} -> 索引 ${index}`);
                }
            }
        });

        return map;
    }

    /**
     * 解析数字值（处理各种格式）
     * @param {*} value - 原始值
     * @returns {number|null} 解析后的数字，失败返回null
     */
    _parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        // 如果已经是数字类型
        if (typeof value === 'number') {
            return isNaN(value) ? null : value;
        }
        
        // 转换为字符串并清理
        let str = String(value).trim();
        
        // 处理百分比格式 (如 "10%" -> 10)
        if (str.endsWith('%')) {
            str = str.slice(0, -1).trim();
        }
        
        // 处理千分位分隔符 (如 "1,000.50" -> "1000.50")
        str = str.replace(/,/g, '');
        
        // 尝试解析
        const num = parseFloat(str);
        
        return isNaN(num) ? null : num;
    }

    /**
     * 解析单行数据
     * @param {Array} row - 行数据
     * @param {Object} columnMap - 列映射
     * @returns {Object} 项目数据对象
     */
    _parseRow(row, columnMap) {
        const project = {
            projectName: '',
            year: null,
            group: '',
            analyticalSystem: '',
            tea: 0,
            cv: 0,
            bias: 0
        };

        if (columnMap.projectName >= 0) {
            project.projectName = String(row[columnMap.projectName] || '').trim();
        }

        if (columnMap.year >= 0) {
            const yearVal = parseInt(row[columnMap.year]);
            project.year = isNaN(yearVal) ? null : yearVal;
        }

        if (columnMap.group >= 0) {
            project.group = String(row[columnMap.group] || '').trim();
        }

        if (columnMap.analyticalSystem >= 0) {
            project.analyticalSystem = String(row[columnMap.analyticalSystem] || '').trim();
        }

        if (columnMap.tea >= 0) {
            const teaVal = this._parseNumber(row[columnMap.tea]);
            project.tea = teaVal !== null ? teaVal : 0;
        }

        if (columnMap.cv >= 0) {
            const cvVal = this._parseNumber(row[columnMap.cv]);
            project.cv = cvVal !== null ? cvVal : 0;
        }

        if (columnMap.bias >= 0) {
            const biasVal = this._parseNumber(row[columnMap.bias]);
            project.bias = biasVal !== null ? biasVal : 0;
        }

        return project;
    }

    /**
     * 导入 Excel 文件
     * @param {File} file - 文件对象
     * @returns {Promise<Object>} 导入结果
     */
    async import(file) {
        try {
            console.log('import: 开始导入文件', file.name);
            const data = await this.readFile(file);
            console.log('import: 读取到数据行数', data.length);
            
            const projects = this.parseProjects(data);
            
            if (projects.length === 0) {
                return {
                    success: false,
                    projects: [],
                    count: 0,
                    message: '未找到有效的项目数据，请检查文件格式是否正确（需要包含：项目名称、允许总误差、CV、偏倚列）'
                };
            }
            
            return {
                success: true,
                projects: projects,
                count: projects.length,
                message: `成功导入 ${projects.length} 个项目`
            };
        } catch (error) {
            console.error('import: 导入失败', error);
            return {
                success: false,
                projects: [],
                count: 0,
                message: error.message
            };
        }
    }
}

/**
 * Excel 导出器类
 * 负责将项目数据和实验室信息导出为 Excel 文件
 */
class ExcelExporter {
    constructor() {
        this.defaultFilename = 'sigma_qc_data.xlsx';
    }

    /**
     * 导出项目数据到 Excel
     * @param {Array} projects - 项目数据数组
     * @param {Object} labInfo - 实验室信息（已弃用）
     * @param {string} filename - 文件名
     */
    export(projects, labInfo = null, filename = null) {
        const workbook = XLSX.utils.book_new();

        // 创建项目数据工作表（包含计算结果）
        const projectSheet = this._createProjectSheet(projects);
        XLSX.utils.book_append_sheet(workbook, projectSheet, '项目数据');

        // 下载文件
        const finalFilename = filename || this.defaultFilename;
        XLSX.writeFile(workbook, finalFilename);
    }

    /**
     * 创建项目数据工作表
     * @param {Array} projects - 项目数据数组
     * @returns {Object} 工作表对象
     */
    _createProjectSheet(projects) {
        // 导出完整格式（包含原始数据和计算结果）
        const headers = [
            '项目名称',
            '年份',
            '分组',
            '分析系统',
            '允许总误差(TEa%)',
            '变异系数(CV%)',
            '偏倚(Bias%)',
            '西格玛值',
            '性能评价',
            '推荐质控规则',
            '批长度'
        ];

        const data = projects.map(p => [
            p.projectName || '',
            p.year || '',
            p.group || '',
            p.analyticalSystem || '',
            p.tea || 0,
            p.cv || 0,
            p.bias || 0,
            p.sigma ? p.sigma.toFixed(2) : '0.00',
            p.performance ? getPerformanceName(p.performance) : '',
            p.controlRuleText || '',
            p.batchLength ? p.batchLength + '个' : ''
        ]);

        const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        
        // 设置列宽
        sheet['!cols'] = [
            { wch: 20 },  // 项目名称
            { wch: 10 },  // 年份
            { wch: 15 },  // 分组
            { wch: 20 },  // 分析系统
            { wch: 20 },  // 允许总误差
            { wch: 18 },  // 变异系数
            { wch: 15 },  // 偏倚
            { wch: 12 },  // 西格玛值
            { wch: 12 },  // 性能评价
            { wch: 30 },  // 推荐质控规则
            { wch: 12 }   // 批长度
        ];

        return sheet;
    }

    /**
     * 下载空白模板
     * @param {string} filename - 文件名
     */
    downloadTemplate(filename = 'sigma_qc_template.xlsx') {
        const workbook = XLSX.utils.book_new();

        // 创建模板工作表（包含年份和分组列）
        const headers = ['项目名称', '年份', '分组', '分析系统', '允许总误差(TEa%)', '变异系数(CV%)', '偏倚(Bias%)'];
        const example = ['血糖', 2025, '生化室', '生化分析仪A', 10.00, 2.50, 1.50];

        const sheet = XLSX.utils.aoa_to_sheet([
            headers,
            example,
            ['肌酐', 2025, '生化室', '生化分析仪A', 15.00, 3.00, 2.00],
            ['尿酸', 2025, '生化室', '生化分析仪A', 17.00, 2.80, 1.80]
        ]);

        // 设置列宽
        sheet['!cols'] = [
            { wch: 20 },  // 项目名称
            { wch: 10 },  // 年份
            { wch: 15 },  // 分组
            { wch: 20 },  // 分析系统
            { wch: 20 },  // 允许总误差
            { wch: 18 },  // 变异系数
            { wch: 15 }   // 偏倚
        ];

        XLSX.utils.book_append_sheet(workbook, sheet, '项目数据模板');

        // 添加说明工作表
        const helpData = [
            ['数据导入说明'],
            [''],
            ['1. 请按照模板格式填写数据'],
            ['2. 必填字段：项目名称、TEa、CV、Bias'],
            ['3. 可选字段：年份、分组、分析系统'],
            ['4. TEa、CV、Bias 必须为正数'],
            ['5. 西格玛值将自动计算: σ = (TEa - |Bias|) / CV'],
            ['6. 性能等级将自动评估'],
            [''],
            ['字段说明'],
            ['项目名称', '检验项目名称，如：血糖、肌酐等（必填）'],
            ['年份', '数据年份，如：2025（可选）'],
            ['分组', '科室或分组名称，如：生化室（可选）'],
            ['分析系统', '分析仪器或系统名称（可选）'],
            ['允许总误差(TEa%)', '允许的总误差百分比（必填）'],
            ['变异系数(CV%)', '精密度指标，标准差/平均值（必填）'],
            ['偏倚(Bias%)', '准确度指标，与参考值的偏差（必填）']
        ];

        const helpSheet = XLSX.utils.aoa_to_sheet(helpData);
        helpSheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, helpSheet, '使用说明');

        XLSX.writeFile(workbook, filename);
    }
}

// 创建全局实例
const excelImporter = new ExcelImporter();
const excelExporter = new ExcelExporter();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ExcelImporter,
        ExcelExporter,
        excelImporter,
        excelExporter
    };
}
