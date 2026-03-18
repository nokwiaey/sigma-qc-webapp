# 转换为静态网页工具 Spec

## 目录结构

```
项目根目录/
├── .trae/specs/convert-to-webapp/  # 规格文档
│   ├── spec.md
│   ├── tasks.md
│   └── checklist.md
├── legacy-python-app/              # 原有 Python 代码（已归档）
│   ├── app.py
│   ├── utils/
│   ├── data/
│   └── ...
├── webapp/                         # 新的静态网页应用
│   ├── index.html                  # 主页面
│   ├── css/
│   │   └── style.css              # 样式文件
│   ├── js/
│   │   ├── app.js                 # 主应用逻辑
│   │   ├── calculator.js          # 西格玛计算逻辑
│   │   ├── storage.js             # 本地存储封装
│   │   ├── excel.js               # Excel 导入导出
│   │   └── chart.js               # 图表绘制
│   └── .github/
│       └── workflows/
│           └── deploy.yml         # GitHub Pages 部署
└── README.md
```

## Why
当前项目是一个基于 Streamlit 的桌面应用，需要本地部署 Python 环境运行。由于使用频率较低（一年仅几次），本地部署维护成本高。将其改造为纯前端静态网页工具并部署到 GitHub Pages，可以实现：
1. 用完即走，无需安装
2. 零服务器成本
3. 数据由用户通过 Excel 文件自行管理，保护隐私
4. 固定项目数据可在 Excel 中保存，来年只需修改变化项

## What Changes
- **BREAKING**: 从 Streamlit Python 应用转换为纯 HTML/CSS/JavaScript 静态网页
- **BREAKING**: 移除服务器端数据存储，改为浏览器本地存储 + Excel 导入导出
- 新增 Excel 文件导入功能，支持读取项目数据和实验室信息
- 新增 Excel 文件导出功能，支持保存计算结果和图表
- 使用原生 JavaScript 实现西格玛计算逻辑
- 使用 Chart.js 或 ECharts 替代 Plotly 绘制西格玛性能验证图
- 使用 SheetJS (xlsx.js) 处理 Excel 文件读写
- 添加 GitHub Actions 工作流自动部署到 GitHub Pages

## Impact
- 受影响功能：所有现有功能（数据管理、图表分析、报告导出）
- 受影响代码：全部重写，从 Python 转为 JavaScript
- 部署方式：从本地运行改为 GitHub Pages 托管

## ADDED Requirements

### Requirement: Excel 导入功能
系统 SHALL 支持从 Excel 文件导入数据

#### Scenario: 导入项目数据
- **GIVEN** 用户有一个包含项目数据的 Excel 文件
- **WHEN** 用户选择并上传该文件
- **THEN** 系统读取文件内容并加载项目列表
- **AND** 系统根据 TEa、CV、Bias 自动计算 σ 水平、性能等级和质控规则

#### Scenario: Excel 格式规范
- **GIVEN** Excel 文件需要符合特定格式
- **THEN** 系统 SHALL 支持以下列：项目名称、允许总误差(TEa%)、不精密度(CV%)、偏倚(Bias%)、年份、分组
- **AND** 年份和分组列为可选

### Requirement: Excel 导出功能
系统 SHALL 支持将数据导出为 Excel 文件

#### Scenario: 导出项目数据
- **GIVEN** 用户已完成数据录入或计算
- **WHEN** 用户点击导出按钮
- **THEN** 系统生成包含所有项目数据（含计算结果）的 Excel 文件
- **AND** 文件包含实验室信息工作表

#### Scenario: 导出图表
- **GIVEN** 用户已生成西格玛性能验证图
- **WHEN** 用户点击保存图表按钮
- **THEN** 系统导出图表为 PNG 图片

### Requirement: 浏览器本地存储
系统 SHALL 使用 localStorage 保存用户当前会话数据

#### Scenario: 页面刷新数据保留
- **GIVEN** 用户已导入或录入数据
- **WHEN** 用户刷新页面
- **THEN** 数据仍然保留在浏览器中

#### Scenario: 隐私保护
- **GIVEN** 用户关闭浏览器或清除数据
- **WHEN** 用户选择清除数据或关闭标签页
- **THEN** 数据仅在本地存储，不会上传到任何服务器

### Requirement: 西格玛计算功能
系统 SHALL 在浏览器端实现西格玛计算逻辑

#### Scenario: 计算 σ 水平
- **GIVEN** 输入 TEa、CV、Bias
- **THEN** σ = (TEa - |Bias|) / CV

#### Scenario: 评估性能等级
- **GIVEN** 计算出的 σ 水平
- **THEN** 系统按以下规则分级：
  - σ ≥ 6: 世界一流
  - 5 ≤ σ < 6: 优秀
  - 4 ≤ σ < 5: 良好
  - 3 ≤ σ < 4: 临界
  - σ < 3: 不可接受

#### Scenario: 推荐质控规则
- **GIVEN** 性能等级
- **THEN** 系统返回对应的质控规则：
  - 世界一流: 1₃ₛ (N=2,R=1)
  - 优秀: 1₃ₛ2₂ₛR₄ₛ (N=2,R=1)
  - 良好: 1₃ₛ2₂ₛR₄ₛ4₁ₛ (N=4,R=1 或 N=2,R=2)
  - 临界: 1₃ₛ2₂ₛR₄ₛ4₁ₛ8ₓ (N=4,R=2 或 N=2,R=4)
  - 不可接受: 无

### Requirement: 西格玛性能验证图
系统 SHALL 绘制标准化西格玛性能验证图

#### Scenario: 图表元素
- **GIVEN** 项目数据列表
- **THEN** 图表 SHALL 包含：
  - X轴：不精密度 (CV/TEa) %，范围 0-50
  - Y轴：偏倚 (Bias/TEa) %，范围 0-100
  - σ = 3, 4, 5, 6 的等值线
  - 性能区域标注（世界一流、优秀、良好、临界、欠佳、不可接受）
  - 各项目散点，颜色根据性能等级区分
  - 悬停提示显示项目详情

### Requirement: GitHub Pages 部署
系统 SHALL 支持自动部署到 GitHub Pages

#### Scenario: 自动部署
- **GIVEN** 代码推送到 main 分支
- **WHEN** GitHub Actions 工作流触发
- **THEN** 自动构建并部署到 GitHub Pages

## MODIFIED Requirements

### Requirement: 用户界面
从 Streamlit 组件改为原生 HTML + CSS + JavaScript

#### Scenario: 页面布局
- **THEN** 页面包含以下功能区：
  - 实验室信息设置
  - Excel 导入/导出
  - 项目数据管理（增删改查）
  - 西格玛性能验证图展示
  - 图表导出

## REMOVED Requirements

### Requirement: PDF 报告生成
**Reason**: 静态网页环境难以生成 PDF，且 Excel 导出已满足数据保存需求
**Migration**: 用户可通过浏览器打印功能保存页面为 PDF，或导出 Excel 后自行处理

### Requirement: 服务器端数据存储
**Reason**: 静态网页无服务器端，数据存储改为浏览器 localStorage 和 Excel 文件
**Migration**: 用户定期导出 Excel 备份数据
