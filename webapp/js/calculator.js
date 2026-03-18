/**
 * 标准化西格玛性能验证图及自动选择质控程序
 * 西格玛计算逻辑模块
 * 
 * 基于原始网页版本 (https://a.clinet.com.cn/SigmaPV/)
 * 性能等级划分:
 * - σ ≥ 6: 世界一流
 * - 5 ≤ σ < 6: 优秀
 * - 4 ≤ σ < 5: 良好
 * - 3 ≤ σ < 4: 临界
 * - 2 ≤ σ < 3: 欠佳
 * - σ < 2: 不可接受
 */

/**
 * 性能等级定义（6个等级）
 */
const PerformanceLevel = {
    WORLD_CLASS: 'world_class',    // 世界一流: σ ≥ 6
    EXCELLENT: 'excellent',        // 优秀: 5 ≤ σ < 6
    GOOD: 'good',                  // 良好: 4 ≤ σ < 5
    MARGINAL: 'marginal',          // 临界: 3 ≤ σ < 4
    POOR: 'poor',                  // 欠佳: 2 ≤ σ < 3
    UNACCEPTABLE: 'unacceptable'   // 不可接受: σ < 2
};

/**
 * 性能等级中文名称（与原始版本一致）
 */
const PerformanceLevelNames = {
    [PerformanceLevel.WORLD_CLASS]: '世界一流',
    [PerformanceLevel.EXCELLENT]: '优秀',
    [PerformanceLevel.GOOD]: '良好',
    [PerformanceLevel.MARGINAL]: '临界',
    [PerformanceLevel.POOR]: '欠佳',
    [PerformanceLevel.UNACCEPTABLE]: '不可接受'
};

/**
 * 性能等级颜色映射（与原始版本一致）
 * 原始代码: GetScatterColor(per) 函数
 */
const PerformanceLevelColors = {
    [PerformanceLevel.WORLD_CLASS]: '#00ff00',      // 绿色
    [PerformanceLevel.EXCELLENT]: '#008080',        // 青色
    [PerformanceLevel.GOOD]: '#87CEEB',             // 天蓝色
    [PerformanceLevel.MARGINAL]: '#800080',         // 紫色
    [PerformanceLevel.POOR]: '#800000',             // 深红色
    [PerformanceLevel.UNACCEPTABLE]: '#FF0000'      // 红色
};

/**
 * 批长度数据（与原始版本一致）
 * 原始代码: display_chart_p_len 函数
 */
const BatchLengths = {
    [PerformanceLevel.WORLD_CLASS]: 1000,   // 世界一流: 1000个患者样品
    [PerformanceLevel.EXCELLENT]: 450,      // 优秀: 450个患者样品
    [PerformanceLevel.GOOD]: 200,           // 良好: 200个患者样品
    [PerformanceLevel.MARGINAL]: 45,        // 临界: 45个患者样品
    [PerformanceLevel.POOR]: null,          // 欠佳: 无
    [PerformanceLevel.UNACCEPTABLE]: null   // 不可接受: 无
};

/**
 * 计算西格玛值
 * 
 * 西格玛值计算公式: σ = (TEa - |Bias|) / CV
 * 
 * @param {number} tea - 允许总误差 (TEa%)，必须为正数
 * @param {number} cv - 变异系数 (CV%)，必须为正数
 * @param {number} bias - 偏倚 (Bias%)，可为正或负
 * @returns {number} 西格玛值，保留2位小数
 * @throws {Error} 当参数无效时抛出错误
 */
function calculateSigma(tea, cv, bias) {
    // 参数验证
    if (typeof tea !== 'number' || isNaN(tea)) {
        throw new Error('TEa必须是有效的数字');
    }
    if (typeof cv !== 'number' || isNaN(cv)) {
        throw new Error('CV必须是有效的数字');
    }
    if (typeof bias !== 'number' || isNaN(bias)) {
        throw new Error('Bias必须是有效的数字');
    }
    
    // 数值范围验证
    if (tea <= 0) {
        throw new Error('TEa必须大于0');
    }
    if (cv <= 0) {
        throw new Error('CV必须大于0');
    }
    
    // 计算西格玛值
    const absBias = Math.abs(bias);
    
    // 如果偏倚大于等于TEa，西格玛值为0或负数
    if (absBias >= tea) {
        return 0;
    }
    
    const sigma = (tea - absBias) / cv;
    
    // 保留2位小数
    return Math.round(sigma * 100) / 100;
}

/**
 * 评估性能等级（6个等级）
 * 
 * 根据西格玛值判断性能等级:
 * - σ ≥ 6: 世界一流
 * - 5 ≤ σ < 6: 优秀
 * - 4 ≤ σ < 5: 良好
 * - 3 ≤ σ < 4: 临界
 * - 2 ≤ σ < 3: 欠佳
 * - σ < 2: 不可接受
 * 
 * @param {number} sigma - 西格玛值
 * @returns {string} 性能等级，值为 PerformanceLevel 之一
 * @throws {Error} 当参数无效时抛出错误
 */
function evaluatePerformance(sigma) {
    if (typeof sigma !== 'number' || isNaN(sigma)) {
        throw new Error('西格玛值必须是有效的数字');
    }
    
    if (sigma >= 6) {
        return PerformanceLevel.WORLD_CLASS;
    } else if (sigma >= 5) {
        return PerformanceLevel.EXCELLENT;
    } else if (sigma >= 4) {
        return PerformanceLevel.GOOD;
    } else if (sigma >= 3) {
        return PerformanceLevel.MARGINAL;
    } else if (sigma >= 2) {
        return PerformanceLevel.POOR;
    } else {
        return PerformanceLevel.UNACCEPTABLE;
    }
}

/**
 * 获取性能等级的中文名称
 * 
 * @param {string} performance - 性能等级代码
 * @returns {string} 性能等级中文名称
 */
function getPerformanceName(performance) {
    return PerformanceLevelNames[performance] || '未知';
}

/**
 * 获取性能等级的颜色（与原始版本一致）
 * 
 * @param {string} performance - 性能等级
 * @returns {string} 颜色代码
 */
function getPerformanceColor(performance) {
    return PerformanceLevelColors[performance] || '#000000';
}

/**
 * 获取批长度
 * 
 * @param {string} performance - 性能等级
 * @returns {number|null} 批长度，无则返回null
 */
function getBatchLength(performance) {
    return BatchLengths[performance] !== undefined ? BatchLengths[performance] : null;
}

/**
 * 获取推荐的质控规则（与原始版本一致）
 * 原始代码: GetGuize(per) 函数
 * 
 * @param {string} performance - 性能等级
 * @returns {string} 质控规则HTML字符串（含下标）
 */
function getControlRules(performance) {
    switch (performance) {
        case PerformanceLevel.WORLD_CLASS:
            return '1₃ₛ(N=2,R=1)';
        case PerformanceLevel.EXCELLENT:
            return '1₃ₛ2₂ₛR₄ₛ<br>(N=2,R=1)';
        case PerformanceLevel.GOOD:
            return '1₃ₛ2₂ₛR₄ₛ4₁ₛ<br>(N=4,R=1或N=2,R=2)';
        case PerformanceLevel.MARGINAL:
            return '1₃ₛ2₂ₛR₄ₛ4₁ₛ8ₓ<br>(N=4,R=2或N=2,R=4)';
        case PerformanceLevel.POOR:
        case PerformanceLevel.UNACCEPTABLE:
        default:
            return '';
    }
}

/**
 * 获取质控规则（纯文本格式，用于Excel导出）
 * 
 * @param {string} performance - 性能等级
 * @returns {string} 质控规则纯文本
 */
function getControlRulesText(performance) {
    switch (performance) {
        case PerformanceLevel.WORLD_CLASS:
            return '13S(N=2,R=1)';
        case PerformanceLevel.EXCELLENT:
            return '13S/22S/R4S(N=2,R=1)';
        case PerformanceLevel.GOOD:
            return '13S/22S/R4S/41S(N=4,R=1或N=2,R=2)';
        case PerformanceLevel.MARGINAL:
            return '13S/22S/R4S/41S/8X(N=4,R=2或N=2,R=4)';
        case PerformanceLevel.POOR:
        case PerformanceLevel.UNACCEPTABLE:
        default:
            return '';
    }
}

/**
 * 验证项目数据
 * 
 * @param {Object} data - 项目数据对象
 * @param {string} data.projectName - 项目名称
 * @param {number} data.tea - 允许总误差 (TEa%)
 * @param {number} data.cv - 变异系数 (CV%)
 * @param {number} data.bias - 偏倚 (Bias%)
 * @returns {Object} 验证结果对象 { valid: boolean, errors: string[] }
 */
function validateProjectData(data) {
    const errors = [];
    
    // 验证项目名称
    if (!data.projectName || typeof data.projectName !== 'string') {
        errors.push('项目名称不能为空');
    } else if (data.projectName.trim().length === 0) {
        errors.push('项目名称不能为空');
    } else if (data.projectName.trim().length > 100) {
        errors.push('项目名称不能超过100个字符');
    }
    
    // 验证TEa
    if (data.tea === undefined || data.tea === null || data.tea === '') {
        errors.push('允许总误差(TEa%)不能为空');
    } else {
        const teaNum = parseFloat(data.tea);
        if (isNaN(teaNum)) {
            errors.push('允许总误差(TEa%)必须是有效的数字');
        } else if (teaNum <= 0) {
            errors.push('允许总误差(TEa%)必须大于0');
        } else if (teaNum > 100) {
            errors.push('允许总误差(TEa%)不能超过100%');
        }
    }
    
    // 验证CV
    if (data.cv === undefined || data.cv === null || data.cv === '') {
        errors.push('变异系数(CV%)不能为空');
    } else {
        const cvNum = parseFloat(data.cv);
        if (isNaN(cvNum)) {
            errors.push('变异系数(CV%)必须是有效的数字');
        } else if (cvNum <= 0) {
            errors.push('变异系数(CV%)必须大于0');
        } else if (cvNum > 100) {
            errors.push('变异系数(CV%)不能超过100%');
        }
    }
    
    // 验证Bias
    if (data.bias === undefined || data.bias === null || data.bias === '') {
        errors.push('偏倚(Bias%)不能为空');
    } else {
        const biasNum = parseFloat(data.bias);
        if (isNaN(biasNum)) {
            errors.push('偏倚(Bias%)必须是有效的数字');
        } else if (Math.abs(biasNum) > 100) {
            errors.push('偏倚(Bias%)绝对值不能超过100%');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * 项目数据类
 */
class ProjectData {
    /**
     * 创建项目数据实例
     */
    constructor(params = {}) {
        this.id = params.id || this.generateId();
        this.projectName = params.projectName || '';
        this.analyticalSystem = params.analyticalSystem || '';
        this.year = params.year || new Date().getFullYear();
        this.group = params.group || '';
        this.tea = parseFloat(params.tea) || 0;
        this.cv = parseFloat(params.cv) || 0;
        this.bias = parseFloat(params.bias) || 0;
        this.createdAt = params.createdAt ? new Date(params.createdAt) : new Date();
        this.updatedAt = params.updatedAt ? new Date(params.updatedAt) : new Date();
        
        // 计算派生值
        this.calculateDerivedValues();
    }
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 计算派生值（西格玛值、性能等级、质控规则、批长度）
     */
    calculateDerivedValues() {
        try {
            this.sigma = calculateSigma(this.tea, this.cv, this.bias);
            this.performance = evaluatePerformance(this.sigma);
            this.controlRule = getControlRules(this.performance);
            this.controlRuleText = getControlRulesText(this.performance);
            this.batchLength = getBatchLength(this.performance);
            this.color = getPerformanceColor(this.performance);
        } catch (error) {
            this.sigma = 0;
            this.performance = PerformanceLevel.UNACCEPTABLE;
            this.controlRule = '';
            this.controlRuleText = '';
            this.batchLength = null;
            this.color = '#FF0000';
            this.calculationError = error.message;
        }
    }
    
    /**
     * 更新项目数据
     */
    update(data) {
        if (data.projectName !== undefined) this.projectName = data.projectName;
        if (data.analyticalSystem !== undefined) this.analyticalSystem = data.analyticalSystem;
        if (data.year !== undefined) this.year = data.year;
        if (data.group !== undefined) this.group = data.group;
        if (data.tea !== undefined) this.tea = parseFloat(data.tea) || 0;
        if (data.cv !== undefined) this.cv = parseFloat(data.cv) || 0;
        if (data.bias !== undefined) this.bias = parseFloat(data.bias) || 0;
        
        this.updatedAt = new Date();
        this.calculateDerivedValues();
        
        return this;
    }
    
    /**
     * 验证项目数据有效性
     */
    validate() {
        return validateProjectData({
            projectName: this.projectName,
            tea: this.tea,
            cv: this.cv,
            bias: this.bias
        });
    }
    
    /**
     * 获取性能等级的中文名称
     */
    getPerformanceName() {
        return getPerformanceName(this.performance);
    }
    
    /**
     * 获取西格玛值的显示文本
     */
    getSigmaDisplay() {
        return this.sigma.toFixed(2);
    }
    
    /**
     * 转换为普通对象
     */
    toJSON() {
        return {
            id: this.id,
            projectName: this.projectName,
            analyticalSystem: this.analyticalSystem,
            year: this.year,
            group: this.group,
            tea: this.tea,
            cv: this.cv,
            bias: this.bias,
            sigma: this.sigma,
            performance: this.performance,
            performanceName: this.getPerformanceName(),
            controlRule: this.controlRule,
            controlRuleText: this.controlRuleText,
            batchLength: this.batchLength,
            color: this.color,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }
    
    /**
     * 从普通对象创建实例
     */
    static fromJSON(json) {
        return new ProjectData(json);
    }
    
    /**
     * 创建项目数据的副本
     */
    clone() {
        return new ProjectData(this.toJSON());
    }
}

/**
 * 批量计算西格玛值
 */
function batchCalculateSigma(projects) {
    if (!Array.isArray(projects)) {
        throw new Error('projects必须是数组');
    }
    
    return projects.map(project => {
        if (project instanceof ProjectData) {
            return project;
        }
        return new ProjectData(project);
    });
}

/**
 * 统计性能等级分布
 */
function countPerformanceLevels(projects) {
    const counts = {
        [PerformanceLevel.WORLD_CLASS]: 0,
        [PerformanceLevel.EXCELLENT]: 0,
        [PerformanceLevel.GOOD]: 0,
        [PerformanceLevel.MARGINAL]: 0,
        [PerformanceLevel.POOR]: 0,
        [PerformanceLevel.UNACCEPTABLE]: 0
    };
    
    projects.forEach(project => {
        if (project instanceof ProjectData && counts[project.performance] !== undefined) {
            counts[project.performance]++;
        }
    });
    
    return counts;
}

/**
 * 计算西格玛值的统计信息
 */
function calculateSigmaStatistics(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
        return {
            count: 0,
            min: 0,
            max: 0,
            mean: 0,
            median: 0
        };
    }
    
    const sigmaValues = projects
        .filter(p => p instanceof ProjectData)
        .map(p => p.sigma)
        .sort((a, b) => a - b);
    
    const count = sigmaValues.length;
    const min = sigmaValues[0];
    const max = sigmaValues[count - 1];
    const sum = sigmaValues.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    
    let median;
    const mid = Math.floor(count / 2);
    if (count % 2 === 0) {
        median = (sigmaValues[mid - 1] + sigmaValues[mid]) / 2;
    } else {
        median = sigmaValues[mid];
    }
    
    return {
        count,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100
    };
}

/**
 * 获取性能等级的背景颜色（带透明度，用于图表）
 */
function getPerformanceBackgroundColor(performance) {
    const colors = {
        [PerformanceLevel.WORLD_CLASS]: 'rgba(0, 255, 0, 0.2)',
        [PerformanceLevel.EXCELLENT]: 'rgba(0, 128, 128, 0.2)',
        [PerformanceLevel.GOOD]: 'rgba(135, 206, 235, 0.2)',
        [PerformanceLevel.MARGINAL]: 'rgba(128, 0, 128, 0.2)',
        [PerformanceLevel.POOR]: 'rgba(128, 0, 0, 0.2)',
        [PerformanceLevel.UNACCEPTABLE]: 'rgba(255, 0, 0, 0.2)'
    };
    
    return colors[performance] || 'rgba(0, 0, 0, 0.2)';
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceLevel,
        PerformanceLevelNames,
        PerformanceLevelColors,
        BatchLengths,
        calculateSigma,
        evaluatePerformance,
        getPerformanceName,
        getPerformanceColor,
        getBatchLength,
        getControlRules,
        getControlRulesText,
        validateProjectData,
        ProjectData,
        batchCalculateSigma,
        countPerformanceLevels,
        calculateSigmaStatistics,
        getPerformanceBackgroundColor
    };
}
