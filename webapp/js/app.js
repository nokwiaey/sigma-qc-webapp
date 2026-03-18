/**
 * 标准化西格玛性能验证图及自动选择质控程序
 * 主应用逻辑模块
 * 
 * 初始化应用、处理用户交互、管理数据和视图
 */

/**
 * 主应用类
 */
class App {
    constructor() {
        this.currentTab = 'projectData';
        this.editingProjectId = null;
        this.projects = [];
        this.filteredProjects = [];
        this.filters = {
            projectName: '',
            year: '',
            group: '',
            analyticalSystem: '',
            performance: ''
        };
    }

    /**
     * 初始化应用
     */
    init() {
        this.loadProjects();
        this.initEventListeners();
        this.initChart();
        this.render();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 标签页切换
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.closest('.nav-tab').dataset.tab;
                this.switchTab(tabId);
            });
        });

        // 筛选功能
        const filterProjectName = document.getElementById('filterProjectName');
        const filterYear = document.getElementById('filterYear');
        const filterGroup = document.getElementById('filterGroup');
        const filterAnalyticalSystem = document.getElementById('filterAnalyticalSystem');
        const filterPerformance = document.getElementById('filterPerformance');
        const resetFiltersBtn = document.getElementById('resetFilters');

        if (filterProjectName) {
            filterProjectName.addEventListener('input', () => this.applyFilters());
        }
        if (filterYear) {
            filterYear.addEventListener('change', () => this.applyFilters());
        }
        if (filterGroup) {
            filterGroup.addEventListener('change', () => this.applyFilters());
        }
        if (filterAnalyticalSystem) {
            filterAnalyticalSystem.addEventListener('change', () => this.applyFilters());
        }
        if (filterPerformance) {
            filterPerformance.addEventListener('change', () => this.applyFilters());
        }
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }

        // 项目操作
        const addProjectBtn = document.getElementById('addProject');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => this.openProjectModal());
        }

        const importExcelBtn = document.getElementById('importExcel');
        if (importExcelBtn) {
            importExcelBtn.addEventListener('click', () => this.importExcel());
        }

        const exportExcelBtn = document.getElementById('exportExcel');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportExcel());
        }

        const clearAllProjectsBtn = document.getElementById('clearAllProjects');
        if (clearAllProjectsBtn) {
            clearAllProjectsBtn.addEventListener('click', () => this.clearAllProjects());
        }

        // Excel 文件输入
        const excelFileInput = document.getElementById('excelFileInput');
        if (excelFileInput) {
            excelFileInput.addEventListener('change', (e) => this.handleExcelFile(e));
        }

        // 项目表单
        const projectForm = document.getElementById('projectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.saveProject(e));
        }

        const cancelProjectBtn = document.getElementById('cancelProject');
        if (cancelProjectBtn) {
            cancelProjectBtn.addEventListener('click', () => this.closeProjectModal());
        }

        // 图表筛选
        const chartFilterProjectName = document.getElementById('chartFilterProjectName');
        const chartFilterYear = document.getElementById('chartFilterYear');
        const chartFilterGroup = document.getElementById('chartFilterGroup');
        const chartFilterAnalyticalSystem = document.getElementById('chartFilterAnalyticalSystem');
        const chartFilterPerformance = document.getElementById('chartFilterPerformance');
        const resetChartFiltersBtn = document.getElementById('resetChartFilters');

        if (chartFilterProjectName) {
            chartFilterProjectName.addEventListener('input', () => this.applyChartFilters());
        }
        if (chartFilterYear) {
            chartFilterYear.addEventListener('change', () => this.applyChartFilters());
        }
        if (chartFilterGroup) {
            chartFilterGroup.addEventListener('change', () => this.applyChartFilters());
        }
        if (chartFilterAnalyticalSystem) {
            chartFilterAnalyticalSystem.addEventListener('change', () => this.applyChartFilters());
        }
        if (chartFilterPerformance) {
            chartFilterPerformance.addEventListener('change', () => this.applyChartFilters());
        }
        if (resetChartFiltersBtn) {
            resetChartFiltersBtn.addEventListener('click', () => this.resetChartFilters());
        }

        // 图表控制
        const refreshChartBtn = document.getElementById('refreshChart');
        if (refreshChartBtn) {
            refreshChartBtn.addEventListener('click', () => this.refreshChart());
        }

        const exportChartBtn = document.getElementById('exportChart');
        if (exportChartBtn) {
            exportChartBtn.addEventListener('click', () => this.exportChart());
        }

        const chartTypeSelect = document.getElementById('chartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', () => this.refreshChart());
        }

        // 点击模态框外部关闭
        const projectModal = document.getElementById('projectModal');
        if (projectModal) {
            projectModal.addEventListener('click', (e) => {
                if (e.target === projectModal) {
                    this.closeProjectModal();
                }
            });
        }
    }

    /**
     * 初始化图表
     */
    initChart() {
        if (typeof initChart === 'function') {
            initChart('sigmaChart');
        }
    }

    /**
     * 切换标签页
     * @param {string} tabId - 标签页 ID
     */
    switchTab(tabId) {
        this.currentTab = tabId;

        // 更新导航标签样式
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active', 'border-blue-600', 'text-blue-600');
                tab.classList.remove('border-transparent', 'text-gray-600');
            } else {
                tab.classList.remove('active', 'border-blue-600', 'text-blue-600');
                tab.classList.add('border-transparent', 'text-gray-600');
            }
        });

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabId) {
                content.classList.remove('hidden');
                content.classList.add('active');
            } else {
                content.classList.add('hidden');
                content.classList.remove('active');
            }
        });

        // 如果切换到性能验证图页，刷新图表
        if (tabId === 'performanceChart' && sigmaChart) {
            this.refreshChart();
        }
    }

    /**
     * 加载项目数据
     */
    loadProjects() {
        if (typeof projectStorage !== 'undefined') {
            this.projects = projectStorage.getAll();
            this.filteredProjects = [...this.projects];
            this.updateFilterOptions();
            this.updateChartFilterOptions();
            this.renderProjects();
        }
    }

    /**
     * 更新筛选选项
     */
    updateFilterOptions() {
        const years = [...new Set(this.projects.map(p => p.year).filter(y => y))].sort((a, b) => b - a);
        const groups = [...new Set(this.projects.map(p => p.group).filter(g => g))].sort();
        const systems = [...new Set(this.projects.map(p => p.analyticalSystem).filter(s => s))].sort();

        const filterYear = document.getElementById('filterYear');
        const filterGroup = document.getElementById('filterGroup');
        const filterAnalyticalSystem = document.getElementById('filterAnalyticalSystem');

        if (filterYear) {
            const currentValue = filterYear.value;
            filterYear.innerHTML = '<option value="">全部年份</option>' +
                years.map(y => `<option value="${y}">${y}</option>`).join('');
            filterYear.value = currentValue;
        }

        if (filterGroup) {
            const currentValue = filterGroup.value;
            filterGroup.innerHTML = '<option value="">全部分组</option>' +
                groups.map(g => `<option value="${this.escapeHtml(g)}">${this.escapeHtml(g)}</option>`).join('');
            filterGroup.value = currentValue;
        }

        if (filterAnalyticalSystem) {
            const currentValue = filterAnalyticalSystem.value;
            filterAnalyticalSystem.innerHTML = '<option value="">全部系统</option>' +
                systems.map(s => `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`).join('');
            filterAnalyticalSystem.value = currentValue;
        }
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        const filterProjectName = document.getElementById('filterProjectName');
        const filterYear = document.getElementById('filterYear');
        const filterGroup = document.getElementById('filterGroup');
        const filterAnalyticalSystem = document.getElementById('filterAnalyticalSystem');
        const filterPerformance = document.getElementById('filterPerformance');

        this.filters = {
            projectName: filterProjectName ? filterProjectName.value.toLowerCase() : '',
            year: filterYear ? filterYear.value : '',
            group: filterGroup ? filterGroup.value : '',
            analyticalSystem: filterAnalyticalSystem ? filterAnalyticalSystem.value : '',
            performance: filterPerformance ? filterPerformance.value : ''
        };

        this.filteredProjects = this.projects.filter(project => {
            if (this.filters.projectName && !project.projectName.toLowerCase().includes(this.filters.projectName)) {
                return false;
            }
            if (this.filters.year && String(project.year) !== this.filters.year) {
                return false;
            }
            if (this.filters.group && project.group !== this.filters.group) {
                return false;
            }
            if (this.filters.analyticalSystem && project.analyticalSystem !== this.filters.analyticalSystem) {
                return false;
            }
            if (this.filters.performance && project.performance !== this.filters.performance) {
                return false;
            }
            return true;
        });

        this.renderProjects();
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        const filterProjectName = document.getElementById('filterProjectName');
        const filterYear = document.getElementById('filterYear');
        const filterGroup = document.getElementById('filterGroup');
        const filterAnalyticalSystem = document.getElementById('filterAnalyticalSystem');
        const filterPerformance = document.getElementById('filterPerformance');

        if (filterProjectName) filterProjectName.value = '';
        if (filterYear) filterYear.value = '';
        if (filterGroup) filterGroup.value = '';
        if (filterAnalyticalSystem) filterAnalyticalSystem.value = '';
        if (filterPerformance) filterPerformance.value = '';

        this.filters = {
            projectName: '',
            year: '',
            group: '',
            analyticalSystem: '',
            performance: ''
        };

        this.filteredProjects = [...this.projects];
        this.renderProjects();
    }

    /**
     * 应用图表筛选
     */
    applyChartFilters() {
        const chartFilterProjectName = document.getElementById('chartFilterProjectName');
        const chartFilterYear = document.getElementById('chartFilterYear');
        const chartFilterGroup = document.getElementById('chartFilterGroup');
        const chartFilterAnalyticalSystem = document.getElementById('chartFilterAnalyticalSystem');
        const chartFilterPerformance = document.getElementById('chartFilterPerformance');
        const chartTypeSelect = document.getElementById('chartType');

        const chartFilters = {
            projectName: chartFilterProjectName ? chartFilterProjectName.value.toLowerCase() : '',
            year: chartFilterYear ? chartFilterYear.value : '',
            group: chartFilterGroup ? chartFilterGroup.value : '',
            analyticalSystem: chartFilterAnalyticalSystem ? chartFilterAnalyticalSystem.value : '',
            performance: chartFilterPerformance ? chartFilterPerformance.value : ''
        };

        // 筛选项目
        let filteredProjects = this.projects.filter(project => {
            if (chartFilters.projectName && !project.projectName.toLowerCase().includes(chartFilters.projectName)) {
                return false;
            }
            if (chartFilters.year && String(project.year) !== chartFilters.year) {
                return false;
            }
            if (chartFilters.group && project.group !== chartFilters.group) {
                return false;
            }
            if (chartFilters.analyticalSystem && project.analyticalSystem !== chartFilters.analyticalSystem) {
                return false;
            }
            if (chartFilters.performance && project.performance !== chartFilters.performance) {
                return false;
            }
            return true;
        });

        // 刷新图表（保持当前图表类型）
        if (sigmaChart) {
            const chartType = chartTypeSelect ? chartTypeSelect.value : 'verification';
            sigmaChart.setProjects(filteredProjects);
            sigmaChart.draw(chartType);
        }
    }

    /**
     * 重置图表筛选
     */
    resetChartFilters() {
        const chartFilterProjectName = document.getElementById('chartFilterProjectName');
        const chartFilterYear = document.getElementById('chartFilterYear');
        const chartFilterGroup = document.getElementById('chartFilterGroup');
        const chartFilterAnalyticalSystem = document.getElementById('chartFilterAnalyticalSystem');
        const chartFilterPerformance = document.getElementById('chartFilterPerformance');

        if (chartFilterProjectName) chartFilterProjectName.value = '';
        if (chartFilterYear) chartFilterYear.value = '';
        if (chartFilterGroup) chartFilterGroup.value = '';
        if (chartFilterAnalyticalSystem) chartFilterAnalyticalSystem.value = '';
        if (chartFilterPerformance) chartFilterPerformance.value = '';

        // 刷新图表显示所有项目
        if (sigmaChart) {
            sigmaChart.setProjects(this.projects);
            sigmaChart.draw();
        }
    }

    /**
     * 更新图表筛选选项
     */
    updateChartFilterOptions() {
        const years = [...new Set(this.projects.map(p => p.year).filter(y => y))].sort((a, b) => b - a);
        const groups = [...new Set(this.projects.map(p => p.group).filter(g => g))].sort();
        const systems = [...new Set(this.projects.map(p => p.analyticalSystem).filter(s => s))].sort();

        const chartFilterYear = document.getElementById('chartFilterYear');
        const chartFilterGroup = document.getElementById('chartFilterGroup');
        const chartFilterAnalyticalSystem = document.getElementById('chartFilterAnalyticalSystem');

        if (chartFilterYear) {
            const currentValue = chartFilterYear.value;
            chartFilterYear.innerHTML = '<option value="">全部年份</option>' +
                years.map(y => `<option value="${y}">${y}</option>`).join('');
            chartFilterYear.value = currentValue;
        }

        if (chartFilterGroup) {
            const currentValue = chartFilterGroup.value;
            chartFilterGroup.innerHTML = '<option value="">全部分组</option>' +
                groups.map(g => `<option value="${this.escapeHtml(g)}">${this.escapeHtml(g)}</option>`).join('');
            chartFilterGroup.value = currentValue;
        }

        if (chartFilterAnalyticalSystem) {
            const currentValue = chartFilterAnalyticalSystem.value;
            chartFilterAnalyticalSystem.innerHTML = '<option value="">全部系统</option>' +
                systems.map(s => `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`).join('');
            chartFilterAnalyticalSystem.value = currentValue;
        }
    }

    /**
     * 渲染项目表格
     */
    renderProjects() {
        const tbody = document.getElementById('projectTableBody');
        const emptyState = document.getElementById('emptyState');
        const table = document.getElementById('projectTable');

        if (!tbody) return;

        const projectsToRender = this.filteredProjects || this.projects;

        if (projectsToRender.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (table) table.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (table) table.classList.remove('hidden');

        tbody.innerHTML = projectsToRender.map((project, index) => {
            const performanceName = getPerformanceName ? getPerformanceName(project.performance) : project.performance;
            const performanceColor = this.getPerformanceColorStyle(project.performance);
            const sigmaDisplay = project.sigma ? project.sigma.toFixed(2) : '0.00';
            const batchLengthDisplay = project.batchLength ? `${project.batchLength}个` : '-';
            // 使用 HTML 格式的质控规则（带下标）
            const controlRuleDisplay = project.controlRule || '-';

            return `
                <tr class="hover:bg-gray-50">
                    <td class="border border-gray-300 px-4 py-3 text-sm">${index + 1}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm font-medium">${this.escapeHtml(project.projectName)}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${project.year || '-'}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${this.escapeHtml(project.group || '-')}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${this.escapeHtml(project.analyticalSystem || '-')}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${project.tea}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${project.cv}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${project.bias}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm font-semibold">${sigmaDisplay}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">
                        <span class="px-2 py-1 rounded text-xs font-medium" style="background-color: ${performanceColor.bg}; color: ${performanceColor.text}; border: 1px solid ${performanceColor.border};">
                            ${performanceName}
                        </span>
                    </td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${controlRuleDisplay}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">${batchLengthDisplay}</td>
                    <td class="border border-gray-300 px-4 py-3 text-sm">
                        <div class="flex space-x-2">
                            <button onclick="app.editProject('${project.id}')" class="text-blue-600 hover:text-blue-800" title="编辑">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button onclick="app.deleteProject('${project.id}')" class="text-red-600 hover:text-red-800" title="删除">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // 更新统计信息
        this.updateStatistics();
    }

    /**
     * 获取性能等级对应的样式
     * @param {string} performance - 性能等级
     * @returns {Object} 样式对象
     */
    getPerformanceColorStyle(performance) {
        const styles = {
            [PerformanceLevel.WORLD_CLASS]: { bg: 'rgba(0, 255, 0, 0.2)', text: '#00aa00', border: '#00ff00' },
            [PerformanceLevel.EXCELLENT]: { bg: 'rgba(0, 128, 128, 0.2)', text: '#006060', border: '#008080' },
            [PerformanceLevel.GOOD]: { bg: 'rgba(135, 206, 235, 0.2)', text: '#5a9bb8', border: '#87CEEB' },
            [PerformanceLevel.MARGINAL]: { bg: 'rgba(128, 0, 128, 0.2)', text: '#600060', border: '#800080' },
            [PerformanceLevel.POOR]: { bg: 'rgba(128, 0, 0, 0.2)', text: '#600000', border: '#800000' },
            [PerformanceLevel.UNACCEPTABLE]: { bg: 'rgba(255, 0, 0, 0.2)', text: '#aa0000', border: '#FF0000' }
        };
        return styles[performance] || { bg: 'rgba(128, 128, 128, 0.2)', text: '#666666', border: '#999999' };
    }

    /**
     * 转义 HTML 特殊字符
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        if (typeof countPerformanceLevels !== 'function') return;

        const counts = countPerformanceLevels(this.projects.map(p => new ProjectData(p)));

        const worldClassCount = document.getElementById('worldClassCount');
        const excellentCount = document.getElementById('excellentCount');
        const goodCount = document.getElementById('goodCount');
        const marginalCount = document.getElementById('marginalCount');
        const poorCount = document.getElementById('poorCount');
        const unacceptableCount = document.getElementById('unacceptableCount');

        if (worldClassCount) worldClassCount.textContent = counts[PerformanceLevel.WORLD_CLASS] || 0;
        if (excellentCount) excellentCount.textContent = counts[PerformanceLevel.EXCELLENT] || 0;
        if (goodCount) goodCount.textContent = counts[PerformanceLevel.GOOD] || 0;
        if (marginalCount) marginalCount.textContent = counts[PerformanceLevel.MARGINAL] || 0;
        if (poorCount) poorCount.textContent = counts[PerformanceLevel.POOR] || 0;
        if (unacceptableCount) unacceptableCount.textContent = counts[PerformanceLevel.UNACCEPTABLE] || 0;
    }

    /**
     * 打开项目模态框
     * @param {string|null} projectId - 项目 ID（编辑时传入）
     */
    openProjectModal(projectId = null) {
        const modal = document.getElementById('projectModal');
        const modalTitle = document.getElementById('modalTitle');
        const projectIdInput = document.getElementById('projectId');

        this.editingProjectId = projectId;

        if (projectId) {
            // 编辑模式
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                modalTitle.textContent = '编辑项目';
                projectIdInput.value = projectId;
                document.getElementById('projectName').value = project.projectName;
                document.getElementById('projectYear').value = project.year || '';
                document.getElementById('projectGroup').value = project.group || '';
                document.getElementById('analyticalSystem').value = project.analyticalSystem || '';
                document.getElementById('tea').value = project.tea;
                document.getElementById('cv').value = project.cv;
                document.getElementById('bias').value = project.bias;
            }
        } else {
            // 新增模式
            modalTitle.textContent = '添加项目';
            projectIdInput.value = '';
            document.getElementById('projectForm').reset();
            // 设置默认年份为当前年
            document.getElementById('projectYear').value = new Date().getFullYear();
        }

        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    /**
     * 关闭项目模态框
     */
    closeProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingProjectId = null;
    }

    /**
     * 保存项目
     * @param {Event} e - 表单提交事件
     */
    saveProject(e) {
        e.preventDefault();

        const projectId = document.getElementById('projectId').value;
        const projectData = {
            projectName: document.getElementById('projectName').value.trim(),
            year: parseInt(document.getElementById('projectYear').value) || new Date().getFullYear(),
            group: document.getElementById('projectGroup').value.trim(),
            analyticalSystem: document.getElementById('analyticalSystem').value.trim(),
            tea: parseFloat(document.getElementById('tea').value),
            cv: parseFloat(document.getElementById('cv').value),
            bias: parseFloat(document.getElementById('bias').value)
        };

        // 验证数据
        if (typeof validateProjectData === 'function') {
            const validation = validateProjectData(projectData);
            if (!validation.valid) {
                this.showToast('验证失败: ' + validation.errors.join(', '), 'error');
                return;
            }
        }

        // 计算西格玛值等派生数据
        try {
            projectData.sigma = calculateSigma(projectData.tea, projectData.cv, projectData.bias);
            projectData.performance = evaluatePerformance(projectData.sigma);
            projectData.controlRule = getControlRules(projectData.performance);
            projectData.controlRuleText = getControlRulesText(projectData.performance);
            projectData.batchLength = getBatchLength(projectData.performance);
            projectData.color = getPerformanceColor(projectData.performance);
        } catch (error) {
            this.showToast('计算失败: ' + error.message, 'error');
            return;
        }

        if (projectId) {
            // 更新现有项目
            projectData.id = projectId;
            projectData.updatedAt = new Date().toISOString();
            const index = this.projects.findIndex(p => p.id === projectId);
            if (index >= 0) {
                projectData.createdAt = this.projects[index].createdAt;
                this.projects[index] = projectData;
            }
        } else {
            // 添加新项目
            projectData.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            projectData.createdAt = new Date().toISOString();
            projectData.updatedAt = new Date().toISOString();
            this.projects.push(projectData);
        }

        // 保存到存储
        if (typeof projectStorage !== 'undefined') {
            projectStorage.save(projectData);
        }

        this.closeProjectModal();
        this.renderProjects();
        this.showToast(projectId ? '项目更新成功' : '项目添加成功');
    }

    /**
     * 编辑项目
     * @param {string} projectId - 项目 ID
     */
    editProject(projectId) {
        this.openProjectModal(projectId);
    }

    /**
     * 删除项目
     * @param {string} projectId - 项目 ID
     */
    deleteProject(projectId) {
        if (!confirm('确定要删除这个项目吗？')) {
            return;
        }

        this.projects = this.projects.filter(p => p.id !== projectId);

        if (typeof projectStorage !== 'undefined') {
            projectStorage.delete(projectId);
        }

        this.renderProjects();
        this.showToast('项目删除成功');
    }

    /**
     * 清空所有项目
     */
    clearAllProjects() {
        if (this.projects.length === 0) {
            this.showToast('没有项目需要清空');
            return;
        }

        if (!confirm('确定要清空所有项目数据吗？此操作不可恢复。')) {
            return;
        }

        this.projects = [];

        if (typeof projectStorage !== 'undefined') {
            projectStorage.clear();
        }

        this.renderProjects();
        this.showToast('所有项目已清空');
    }

    /**
     * 导入 Excel
     */
    importExcel() {
        const input = document.getElementById('excelFileInput');
        if (input) {
            input.click();
        }
    }

    /**
     * 处理 Excel 文件
     * @param {Event} e - 文件选择事件
     */
    async handleExcelFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (typeof excelImporter === 'undefined') {
            this.showToast('Excel 导入模块未加载', 'error');
            return;
        }

        const result = await excelImporter.import(file);

        if (result.success) {
            if (result.projects.length > 0) {
                // 保存导入的项目
                result.projects.forEach(project => {
                    if (typeof projectStorage !== 'undefined') {
                        projectStorage.save(project);
                    }
                });

                // 重新加载项目列表
                this.loadProjects();
                this.showToast(result.message);
            } else {
                this.showToast('未找到有效的项目数据', 'warning');
            }
        } else {
            this.showToast(result.message, 'error');
        }

        // 清空文件输入
        e.target.value = '';
    }

    /**
     * 导出 Excel
     */
    exportExcel() {
        if (typeof excelExporter === 'undefined') {
            this.showToast('Excel 导出模块未加载', 'error');
            return;
        }

        if (this.projects.length === 0) {
            // 没有数据时下载模板
            if (confirm('当前没有项目数据，是否下载空白模板？')) {
                excelExporter.downloadTemplate();
            }
            return;
        }

        const filename = `sigma_qc_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
        excelExporter.export(this.projects, null, filename);
        this.showToast('Excel 导出成功');
    }

    /**
     * 刷新图表
     */
    refreshChart() {
        if (!sigmaChart) {
            this.showToast('图表模块未加载', 'error');
            return;
        }

        const chartTypeSelect = document.getElementById('chartType');
        const chartType = chartTypeSelect ? chartTypeSelect.value : 'verification';

        // 获取当前筛选后的项目
        const chartFilterProjectName = document.getElementById('chartFilterProjectName');
        const chartFilterYear = document.getElementById('chartFilterYear');
        const chartFilterGroup = document.getElementById('chartFilterGroup');
        const chartFilterAnalyticalSystem = document.getElementById('chartFilterAnalyticalSystem');
        const chartFilterPerformance = document.getElementById('chartFilterPerformance');

        const chartFilters = {
            projectName: chartFilterProjectName ? chartFilterProjectName.value.toLowerCase() : '',
            year: chartFilterYear ? chartFilterYear.value : '',
            group: chartFilterGroup ? chartFilterGroup.value : '',
            analyticalSystem: chartFilterAnalyticalSystem ? chartFilterAnalyticalSystem.value : '',
            performance: chartFilterPerformance ? chartFilterPerformance.value : ''
        };

        // 应用筛选
        let filteredProjects = this.projects.filter(project => {
            if (chartFilters.projectName && !project.projectName.toLowerCase().includes(chartFilters.projectName)) {
                return false;
            }
            if (chartFilters.year && String(project.year) !== chartFilters.year) {
                return false;
            }
            if (chartFilters.group && project.group !== chartFilters.group) {
                return false;
            }
            if (chartFilters.analyticalSystem && project.analyticalSystem !== chartFilters.analyticalSystem) {
                return false;
            }
            if (chartFilters.performance && project.performance !== chartFilters.performance) {
                return false;
            }
            return true;
        });

        sigmaChart.setProjects(filteredProjects);
        sigmaChart.draw(chartType);

        // 更新统计卡片（基于筛选后的数据）
        this.updateStatisticsForFiltered(filteredProjects);
    }

    /**
     * 更新筛选后数据的统计信息
     */
    updateStatisticsForFiltered(filteredProjects) {
        if (typeof countPerformanceLevels !== 'function') return;

        const counts = countPerformanceLevels(filteredProjects.map(p => new ProjectData(p)));

        const worldClassCount = document.getElementById('worldClassCount');
        const excellentCount = document.getElementById('excellentCount');
        const goodCount = document.getElementById('goodCount');
        const marginalCount = document.getElementById('marginalCount');
        const poorCount = document.getElementById('poorCount');
        const unacceptableCount = document.getElementById('unacceptableCount');

        if (worldClassCount) worldClassCount.textContent = counts[PerformanceLevel.WORLD_CLASS] || 0;
        if (excellentCount) excellentCount.textContent = counts[PerformanceLevel.EXCELLENT] || 0;
        if (goodCount) goodCount.textContent = counts[PerformanceLevel.GOOD] || 0;
        if (marginalCount) marginalCount.textContent = counts[PerformanceLevel.MARGINAL] || 0;
        if (poorCount) poorCount.textContent = counts[PerformanceLevel.POOR] || 0;
        if (unacceptableCount) unacceptableCount.textContent = counts[PerformanceLevel.UNACCEPTABLE] || 0;
    }

    /**
     * 导出图表
     */
    exportChart() {
        if (!sigmaChart) {
            this.showToast('图表模块未加载', 'error');
            return;
        }

        const filename = `sigma_chart_${new Date().toISOString().slice(0, 10)}.png`;
        sigmaChart.exportToPNG(filename);
        this.showToast('图表导出成功');
    }

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型: 'success', 'error', 'warning'
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;

        // 设置颜色
        toast.className = 'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50';
        switch (type) {
            case 'error':
                toast.classList.add('bg-red-600', 'text-white');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-600', 'text-white');
                break;
            default:
                toast.classList.add('bg-gray-800', 'text-white');
        }

        // 显示
        toast.classList.remove('translate-y-20', 'opacity-0');

        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }

    /**
     * 渲染整个应用
     */
    render() {
        this.renderProjects();
    }
}

// 创建全局应用实例
const app = new App();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        App,
        app
    };
}
