/**
 * 标准化西格玛性能验证图及自动选择质控程序
 * 西格玛性能验证图模块
 * 
 * 基于原始网页版本 (https://a.clinet.com.cn/SigmaPV/)
 * 使用 Chart.js 绘制标准化的西格玛性能验证图
 * 
 * 原始版本特点:
 * - 5条σ等值线: σ=2,3,4,5,6
 * - 等值线颜色: ["#FF8080", "#FFFF00", "#00FF40", "#4032EB", "#969EED"]
 * - X轴: 不精密度(CV/TEa), 范围0-50
 * - Y轴: 偏倚(Bias/TEa), 范围0-100
 * - 图表上标注质控规则区域
 */

/**
 * 西格玛性能验证图类
 */
class SigmaChart {
    constructor(canvasId, options = {}) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.chart = null;
        this.projects = [];
        this.options = {
            showBatchLength: options.showBatchLength || false,  // 是否显示批长度
            showRuleLabels: options.showRuleLabels !== false    // 是否显示质控规则标注
        };
    }

    /**
     * 初始化图表
     */
    init() {
        if (!this.canvas) {
            console.error('Canvas element not found:', this.canvasId);
            return;
        }

        this._resizeCanvas();

        window.addEventListener('resize', () => {
            this._resizeCanvas();
            if (this.chart) {
                this.chart.resize();
            }
        });
    }

    /**
     * 调整画布大小
     */
    _resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
        }
    }

    /**
     * 设置项目数据
     * @param {Array} projects - 项目数据数组
     */
    setProjects(projects) {
        this.projects = projects || [];
    }

    /**
     * 绘制标准化的西格玛性能验证图
     * 与原始版本一致，使用归一化的CV和Bias (除以TEa)
     */
    drawSigmaVerificationChart() {
        if (!this.ctx) return;

        this._destroyChart();

        // 准备散点数据（使用归一化坐标：CV/TEa * 100, Bias/TEa * 100）
        const scatterData = this.projects.map(p => {
            const normalizedCV = (p.cv / p.tea) * 100;
            const normalizedBias = (Math.abs(p.bias) / p.tea) * 100;
            
            return {
                x: normalizedCV,
                y: normalizedBias,
                xo: normalizedCV,  // 原始值用于tooltip
                yo: normalizedBias,
                project: p
            };
        });

        // 按性能等级分组（6个等级）
        const groupedData = {
            [PerformanceLevel.WORLD_CLASS]: [],
            [PerformanceLevel.EXCELLENT]: [],
            [PerformanceLevel.GOOD]: [],
            [PerformanceLevel.MARGINAL]: [],
            [PerformanceLevel.POOR]: [],
            [PerformanceLevel.UNACCEPTABLE]: []
        };

        scatterData.forEach(point => {
            const level = point.project.performance || PerformanceLevel.UNACCEPTABLE;
            if (groupedData[level]) {
                groupedData[level].push(point);
            }
        });

        // 创建散点数据集（按性能等级）- 进一步减小点的大小
        const scatterDatasets = [
            {
                label: '世界一流',
                data: groupedData[PerformanceLevel.WORLD_CLASS],
                backgroundColor: PerformanceLevelColors[PerformanceLevel.WORLD_CLASS],
                borderColor: PerformanceLevelColors[PerformanceLevel.WORLD_CLASS],
                pointRadius: 4,
                pointHoverRadius: 6,
                pointStyle: 'circle'
            },
            {
                label: '优秀',
                data: groupedData[PerformanceLevel.EXCELLENT],
                backgroundColor: PerformanceLevelColors[PerformanceLevel.EXCELLENT],
                borderColor: PerformanceLevelColors[PerformanceLevel.EXCELLENT],
                pointRadius: 4,
                pointHoverRadius: 6,
                pointStyle: 'circle'
            },
            {
                label: '良好',
                data: groupedData[PerformanceLevel.GOOD],
                backgroundColor: PerformanceLevelColors[PerformanceLevel.GOOD],
                borderColor: PerformanceLevelColors[PerformanceLevel.GOOD],
                pointRadius: 4,
                pointHoverRadius: 6,
                pointStyle: 'circle'
            },
            {
                label: '临界',
                data: groupedData[PerformanceLevel.MARGINAL],
                backgroundColor: PerformanceLevelColors[PerformanceLevel.MARGINAL],
                borderColor: PerformanceLevelColors[PerformanceLevel.MARGINAL],
                pointRadius: 4,
                pointHoverRadius: 6,
                pointStyle: 'circle'
            },
            {
                label: '欠佳',
                data: groupedData[PerformanceLevel.POOR],
                backgroundColor: PerformanceLevelColors[PerformanceLevel.POOR],
                borderColor: PerformanceLevelColors[PerformanceLevel.POOR],
                pointRadius: 4,
                pointHoverRadius: 6,
                pointStyle: 'circle'
            },
            {
                label: '不可接受',
                data: groupedData[PerformanceLevel.UNACCEPTABLE],
                backgroundColor: PerformanceLevelColors[PerformanceLevel.UNACCEPTABLE],
                borderColor: PerformanceLevelColors[PerformanceLevel.UNACCEPTABLE],
                pointRadius: 4,
                pointHoverRadius: 6,
                pointStyle: 'circle'
            }
        ].filter(ds => ds.data.length > 0);  // 只显示有数据的等级

        // 创建σ等值线（5条线：σ=2,3,4,5,6）
        const lineDatasets = this._createSigmaLines();

        // 创建性能区域标注
        const annotationPlugin = this.options.showRuleLabels ? this._createAnnotations() : {};

        this.chart = new Chart(this.ctx, {
            type: 'scatter',
            data: {
                datasets: [...lineDatasets, ...scatterDatasets]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: this.options.showBatchLength ? 
                            '具有批长度的标准化西格玛性能验证图' : 
                            '标准化西格玛性能验证图法选择质量控制规则',
                        font: { 
                            size: 18,
                            family: 'Arial, Helvetica, sans-serif',
                            weight: 'bold'
                        },
                        color: '#000',
                        padding: 10
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12 },
                            filter: (item) => !item.text.startsWith('σ=')
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#000',
                        bodyColor: '#000',
                        borderColor: '#ccc',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                // 单个项目：显示项目名称
                                // 多个项目：显示项目数量
                                if (context.length > 1) {
                                    return `${context.length} 个项目`;
                                }
                                return '';
                            },
                            label: (context) => {
                                const point = context.raw;
                                if (!point.project) return context.dataset.label;
                                
                                // 使用 afterBody 来显示详细信息
                                return null;
                            },
                            afterBody: (context) => {
                                // 为每个项目显示详细信息
                                const lines = [];
                                const isSingle = context.length === 1;
                                
                                context.forEach((item, index) => {
                                    const point = item.raw;
                                    if (!point.project) return;
                                    
                                    // 项目之间添加分隔线（除了第一个）
                                    if (index > 0) {
                                        lines.push('─────────────────');
                                    }
                                    
                                    // 单个项目时，项目名称作为第一行（不加大括号）
                                    // 多个项目时，项目名称加大括号以区分
                                    if (isSingle) {
                                        lines.push(point.project.projectName);
                                    } else {
                                        lines.push(`【${point.project.projectName}】`);
                                    }
                                    
                                    // 年份、分组、分析系统
                                    const yearStr = point.project.year ? `${point.project.year}年` : '';
                                    const groupStr = point.project.group || '';
                                    const systemStr = point.project.analyticalSystem || '';
                                    const infoParts = [yearStr, groupStr, systemStr].filter(s => s);
                                    if (infoParts.length > 0) {
                                        lines.push(infoParts.join(' | '));
                                    }
                                    // σ水平和性能等级
                                    lines.push(`σ水平: ${point.project.sigma?.toFixed(2) || 0} (${getPerformanceName(point.project.performance)})`);
                                    // 坐标值
                                    lines.push(`CV/TEa: ${point.x.toFixed(2)}%, Bias/TEa: ${point.y.toFixed(2)}%`);
                                    // 原始数据
                                    lines.push(`TEa: ${point.project.tea}%, CV: ${point.project.cv}%, Bias: ${point.project.bias}%`);
                                    // 批长度
                                    if (point.project.batchLength) {
                                        lines.push(`批长度: ${point.project.batchLength}个患者样品`);
                                    }
                                });
                                return lines;
                            }
                        }
                    },
                    annotation: annotationPlugin
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 50,
                        title: {
                            display: true,
                            text: '不精密度(CV/TEa)',
                            font: {
                                family: 'Times New Roman',
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#000'
                        },
                        ticks: {
                            stepSize: 5,
                            font: {
                                family: 'Times New Roman',
                                size: 12
                            },
                            color: '#000'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: true
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: '偏倚(bias/TEa)',
                            font: {
                                family: 'Times New Roman',
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#000'
                        },
                        ticks: {
                            stepSize: 10,
                            font: {
                                family: 'Times New Roman',
                                size: 12
                            },
                            color: '#000'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: true
                        }
                    }
                }
                // 移除点击事件，不再显示弹窗
            }
        });
    }

    /**
     * 创建σ等值线（5条线：σ=2,3,4,5,6）
     * 与原始版本 GetLineData 函数一致
     */
    _createSigmaLines() {
        // 原始颜色顺序（从外到内）
        const lineColors = ["#FF8080", "#FFFF00", "#00FF40", "#4032EB", "#969EED"];
        const sigmaValues = [2, 3, 4, 5, 6];
        
        return sigmaValues.map((sigma, index) => {
            const points = [];
            
            // 等值线方程: y = 100 - sigma * x
            // 当 x = 0, y = 100
            // 当 y = 0, x = 100 / sigma
            
            const xMax = Math.min(50, 100 / sigma);
            const steps = 50;
            
            for (let i = 0; i <= steps; i++) {
                const x = (xMax / steps) * i;
                const y = 100 - sigma * x;
                
                if (y >= 0 && y <= 100 && x <= 50) {
                    points.push({ x: x, y: y });
                }
            }

            return {
                label: `σ=${sigma}`,
                data: points,
                type: 'line',
                borderColor: lineColors[index],
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                tension: 0,
                order: 10  // 确保线条在散点下方
            };
        });
    }

    /**
     * 创建性能区域标注
     * 与原始版本 display_chart_and_zhushi 函数一致
     */
    _createAnnotations() {
        // 质控规则标注配置
        const annotations = {};
        
        // 世界一流区域 (CV/TEa: 0-10%)
        annotations.worldClass = {
            type: 'label',
            xValue: 5,
            yValue: 50,
            backgroundColor: 'rgba(255,255,255,0.8)',
            content: this.options.showBatchLength ? 
                ['1₃ₛ', '(N=2,R=1)', '批长度=1000个患者样品'] : 
                ['1₃ₛ', '(N=2,R=1)'],
            font: {
                family: 'Times New Roman, Georgia, Serif',
                size: 11
            },
            color: '#000'
        };

        // 优秀区域 (CV/TEa: 10-11%)
        annotations.excellent = {
            type: 'label',
            xValue: 10.5,
            yValue: 45,
            backgroundColor: 'rgba(255,255,255,0.8)',
            content: this.options.showBatchLength ?
                ['1₃ₛ/2₂ₛ/R₄ₛ(N=2,R=1)', '批长度=450个患者样品'] :
                ['1₃ₛ2₂ₛR₄ₛ(N=2,R=1)'],
            font: {
                family: 'Times New Roman, Georgia, Serif',
                size: 10
            },
            color: '#000',
            rotation: 65
        };

        // 良好区域 (CV/TEa: 12-13%)
        annotations.good = {
            type: 'label',
            xValue: 12.5,
            yValue: 40,
            backgroundColor: 'rgba(255,255,255,0.8)',
            content: this.options.showBatchLength ?
                ['1₃ₛ/2₂ₛ/R₄ₛ/4₁ₛ(N=4,R=1)', '批长度=200个患者样品'] :
                ['1₃ₛ2₂ₛR₄ₛ4₁ₛ(N=4,R=1或N=2,R=2)'],
            font: {
                family: 'Times New Roman, Georgia, Serif',
                size: 10
            },
            color: '#000',
            rotation: 60
        };

        // 临界区域 (CV/TEa: 16-18%)
        annotations.marginal = {
            type: 'label',
            xValue: 17,
            yValue: 30,
            backgroundColor: 'rgba(255,255,255,0.8)',
            content: this.options.showBatchLength ?
                ['1₃ₛ/2₂ₛ/R₄ₛ/4₁ₛ/6ₓ(N=6,R=1)', '批长度=45个患者样品'] :
                ['1₃ₛ2₂ₛR₄ₛ4₁ₛ8ₓ(N=4,R=2或N=2,R=4)'],
            font: {
                family: 'Times New Roman, Georgia, Serif',
                size: 10
            },
            color: '#000',
            rotation: 50
        };

        return { annotations };
    }

    /**
     * 显示质控规则详情弹窗
     */
    _showRuleDetail(project) {
        // 根据性能等级显示对应的质控规则图片或说明
        const performance = project.performance;
        let ruleImage = '';
        let ruleName = '';

        switch (performance) {
            case PerformanceLevel.WORLD_CLASS:
                ruleName = '13S单规则';
                break;
            case PerformanceLevel.EXCELLENT:
                ruleName = '13S/22S/R4S多规则';
                break;
            case PerformanceLevel.GOOD:
                ruleName = '13S/22S/R4S/41S多规则';
                break;
            case PerformanceLevel.MARGINAL:
                ruleName = '13S/22S/R4S/41S/8X多规则';
                break;
            default:
                ruleName = '性能欠佳，建议改进';
        }

        // 使用简单的alert或自定义弹窗
        alert(`项目：${project.projectName}\n性能等级：${getPerformanceName(performance)}\n推荐质控规则：${ruleName}\n${project.batchLength ? '批长度：' + project.batchLength + '个患者样品' : ''}`);
    }

    /**
     * 绘制西格玛值分布柱状图
     */
    drawSigmaDistribution() {
        if (!this.ctx) return;

        const labels = this.projects.map(p => p.projectName);
        const sigmaValues = this.projects.map(p => p.sigma || 0);
        const colors = this.projects.map(p => getPerformanceColor(p.performance));

        this._destroyChart();

        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '西格玛值',
                    data: sigmaValues,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '项目西格玛值分布',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const project = this.projects[context.dataIndex];
                                return [
                                    `性能等级: ${getPerformanceName(project.performance)}`,
                                    `TEa: ${project.tea}%`,
                                    `CV: ${project.cv}%`,
                                    `Bias: ${project.bias}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '西格玛值 (σ)'
                        },
                        grid: {
                            color: (ctx) => {
                                const value = ctx.tick.value;
                                if (value === 6) return 'rgba(0, 255, 0, 0.5)';
                                if (value === 5) return 'rgba(0, 128, 128, 0.5)';
                                if (value === 4) return 'rgba(135, 206, 235, 0.5)';
                                if (value === 3) return 'rgba(128, 0, 128, 0.5)';
                                if (value === 2) return 'rgba(128, 0, 0, 0.5)';
                                return 'rgba(0, 0, 0, 0.1)';
                            },
                            lineWidth: (ctx) => {
                                const value = ctx.tick.value;
                                if ([2, 3, 4, 5, 6].includes(value)) return 2;
                                return 1;
                            }
                        }
                    },
                    x: {
                        title: { display: true, text: '项目名称' },
                        ticks: { maxRotation: 45, minRotation: 45 }
                    }
                }
            }
        });
    }

    /**
     * 绘制性能等级分布饼图
     */
    drawPerformanceDistribution() {
        if (!this.ctx) return;

        const counts = countPerformanceLevels(this.projects.map(p => new ProjectData(p)));
        
        const data = [
            counts[PerformanceLevel.WORLD_CLASS] || 0,
            counts[PerformanceLevel.EXCELLENT] || 0,
            counts[PerformanceLevel.GOOD] || 0,
            counts[PerformanceLevel.MARGINAL] || 0,
            counts[PerformanceLevel.POOR] || 0,
            counts[PerformanceLevel.UNACCEPTABLE] || 0
        ];

        const labels = ['世界一流(σ≥6)', '优秀(5≤σ<6)', '良好(4≤σ<5)', '临界(3≤σ<4)', '欠佳(2≤σ<3)', '不可接受(σ<2)'];
        const colors = [
            PerformanceLevelColors[PerformanceLevel.WORLD_CLASS],
            PerformanceLevelColors[PerformanceLevel.EXCELLENT],
            PerformanceLevelColors[PerformanceLevel.GOOD],
            PerformanceLevelColors[PerformanceLevel.MARGINAL],
            PerformanceLevelColors[PerformanceLevel.POOR],
            PerformanceLevelColors[PerformanceLevel.UNACCEPTABLE]
        ];

        this._destroyChart();

        this.chart = new Chart(this.ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '性能等级分布',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: { padding: 15, boxWidth: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 根据类型绘制图表
     * @param {string} type - 图表类型
     */
    draw(type = 'verification') {
        switch (type) {
            case 'verification':
                this.drawSigmaVerificationChart();
                break;
            case 'batch':
                this.options.showBatchLength = true;
                this.drawSigmaVerificationChart();
                break;
            case 'sigma':
                this.drawSigmaDistribution();
                break;
            case 'performance':
                this.drawPerformanceDistribution();
                break;
            default:
                this.drawSigmaVerificationChart();
        }
    }

    /**
     * 刷新图表
     */
    refresh() {
        if (this.chart) {
            this.chart.update('active');
        }
    }

    /**
     * 销毁图表
     */
    _destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * 导出图表为 PNG
     * @param {string} filename - 文件名
     */
    exportToPNG(filename = 'sigma_chart.png') {
        if (!this.canvas) return;

        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 获取图表统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const counts = countPerformanceLevels(this.projects.map(p => new ProjectData(p)));
        const stats = calculateSigmaStatistics(this.projects.map(p => new ProjectData(p)));

        return {
            total: this.projects.length,
            worldClass: counts[PerformanceLevel.WORLD_CLASS] || 0,
            excellent: counts[PerformanceLevel.EXCELLENT] || 0,
            good: counts[PerformanceLevel.GOOD] || 0,
            marginal: counts[PerformanceLevel.MARGINAL] || 0,
            poor: counts[PerformanceLevel.POOR] || 0,
            unacceptable: counts[PerformanceLevel.UNACCEPTABLE] || 0,
            minSigma: stats.min,
            maxSigma: stats.max,
            meanSigma: stats.mean,
            medianSigma: stats.median
        };
    }
}

// 创建全局实例
let sigmaChart = null;

/**
 * 初始化图表
 * @param {string} canvasId - 画布元素 ID
 * @param {Object} options - 配置选项
 * @returns {SigmaChart} 图表实例
 */
function initChart(canvasId, options = {}) {
    sigmaChart = new SigmaChart(canvasId, options);
    sigmaChart.init();
    return sigmaChart;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SigmaChart,
        initChart,
        sigmaChart
    };
}
