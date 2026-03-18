# 标准化西格玛性能验证图及自动选择质控程序

基于六西格玛理论的临床检验质量评价与质控规则选择系统。

## 在线访问

GitHub Pages: https://your-username.github.io/sigma-qc-webapp/

> 请将 `your-username` 替换为您的 GitHub 用户名

## 项目简介

本项目是一个用于临床检验质量控制的 Web 应用程序，主要功能包括：

- **西格玛性能验证**：根据检验项目的允许总误差(TEa)、不精密度(CV)和偏倚(Bias)计算西格玛(σ)值
- **性能等级评定**：自动评定项目性能等级（世界一流/优秀/良好/临界/问题）
- **质控规则推荐**：根据性能等级自动推荐合适的 Westgard 质控规则
- **可视化图表**：生成标准化西格玛性能验证图、性能等级分布图等
- **数据管理**：支持 Excel 导入导出，本地数据持久化存储

### 性能等级标准

| 等级 | 西格玛值 | 说明 | 推荐质控规则 |
|------|----------|------|--------------|
| 世界一流 | σ ≥ 6 | 卓越性能 | 13S 单规则 |
| 优秀 | 5 ≤ σ < 6 | 优秀性能 | 13S 单规则 |
| 良好 | 4 ≤ σ < 5 | 良好性能 | 12.5S/13S 多规则 |
| 临界 | 3 ≤ σ < 4 | 临界性能 | 12S/13S/22S 多规则 |
| 问题 | σ < 3 | 需改进 | Westgard 完整多规则 |

## 使用说明

### 在线使用

1. 访问 GitHub Pages 链接
2. 在「实验室信息」页面填写实验室基本信息
3. 在「项目数据」页面添加检验项目数据
4. 在「性能验证图」页面查看分析结果和推荐质控规则

### 添加项目数据

#### 方式一：手动添加

1. 点击「添加项目」按钮
2. 填写项目名称、分析系统、TEa%、CV%、Bias%
3. 系统自动计算西格玛值和推荐质控规则

#### 方式二：Excel 导入

1. 点击「导入 Excel」按钮
2. 选择符合模板格式的 Excel 文件
3. 系统自动解析并导入数据

### 导出数据

- **导出 Excel**：将当前所有项目数据导出为 Excel 文件
- **导出图表**：将性能验证图保存为 PNG 图片

## Excel 模板格式

导入的 Excel 文件需要包含以下列：

| 列名 | 说明 | 必填 | 示例 |
|------|------|------|------|
| 项目名称 | 检验项目名称 | 是 | 血糖 |
| 分析系统 | 使用的分析仪器/方法 | 否 | 生化分析仪A |
| TEa% | 允许总误差(%) | 是 | 10.0 |
| CV% | 变异系数(%) | 是 | 2.5 |
| Bias% | 偏倚(%) | 是 | 1.5 |

### 模板示例

```
项目名称    分析系统        TEa%    CV%    Bias%
血糖        生化分析仪A     10.0    2.5    1.5
肌酐        生化分析仪A     15.0    3.0    2.0
尿酸        生化分析仪B     12.0    2.8    1.2
```

### 下载空白模板

当没有项目数据时，点击「导出 Excel」按钮可下载空白模板文件。

## 本地开发

### 环境要求

- 现代浏览器（Chrome、Firefox、Edge、Safari 等）
- 支持 ES6+ 和 LocalStorage

### 本地运行

由于这是一个纯前端应用，无需服务器环境，可以直接在浏览器中打开：

```bash
# 进入 webapp 目录
cd webapp

# 使用 Python 简易 HTTP 服务器（可选）
python -m http.server 8000

# 或使用 Node.js 的 http-server（需安装）
npx http-server -p 8000
```

然后访问 `http://localhost:8000` 即可。

### 项目结构

```
webapp/
├── index.html          # 主页面
├── .nojekyll          # 禁用 Jekyll 处理
├── css/
│   └── style.css      # 样式文件
└── js/
    ├── app.js         # 主应用逻辑
    ├── calculator.js  # 西格玛计算
    ├── chart.js       # 图表绘制
    ├── excel.js       # Excel 导入导出
    └── storage.js     # 本地存储
```

### 技术栈

- **UI 框架**: Tailwind CSS
- **图表库**: Chart.js
- **Excel 处理**: SheetJS (xlsx.js)
- **数据存储**: LocalStorage

## 部署说明

本项目使用 GitHub Actions 自动部署到 GitHub Pages：

1. 推送代码到 `main` 分支时自动触发部署
2. 也可在 Actions 页面手动触发部署

### 首次部署配置

1. 在 GitHub 仓库设置中启用 GitHub Pages
2. 选择 Source 为 "GitHub Actions"
3. 推送代码到 main 分支即可自动部署

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13.1+

## 许可证

MIT License

## 参考资料

- [Westgard 多规则质控](https://www.westgard.com/)
- [六西格玛质量管理](https://en.wikipedia.org/wiki/Six_Sigma)
- [临床检验质量指标](https://www.ifcc.org/)
