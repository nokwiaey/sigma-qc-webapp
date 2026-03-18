# Tasks

- [x] Task 1: 创建项目基础结构
  - [x] SubTask 1.1: 创建 index.html 主页面框架
  - [x] SubTask 1.2: 创建 css/style.css 样式文件
  - [x] SubTask 1.3: 创建 js/app.js 主应用逻辑
  - [x] SubTask 1.4: 引入必要的 CDN 库（Chart.js、SheetJS、Tailwind CSS）

- [x] Task 2: 实现西格玛计算核心逻辑
  - [x] SubTask 2.1: 实现 calculateSigma(tea, cv, bias) 函数
  - [x] SubTask 2.2: 实现 evaluatePerformance(sigma) 函数
  - [x] SubTask 2.3: 实现 getControlRules(performance) 函数
  - [x] SubTask 2.4: 实现数据验证函数

- [x] Task 3: 实现 Excel 导入功能
  - [x] SubTask 3.1: 集成 SheetJS 库
  - [x] SubTask 3.2: 实现文件选择和处理逻辑
  - [x] SubTask 3.3: 解析 Excel 数据并转换为项目对象
  - [x] SubTask 3.4: 处理导入错误和格式验证

- [x] Task 4: 实现 Excel 导出功能
  - [x] SubTask 4.1: 实现项目数据导出为 Excel
  - [x] SubTask 4.2: 实现实验室信息工作表
  - [x] SubTask 4.3: 添加导出模板下载功能（方便用户了解格式）

- [x] Task 5: 实现数据管理界面
  - [x] SubTask 5.1: 创建实验室信息表单
  - [x] SubTask 5.2: 创建项目数据表格展示
  - [x] SubTask 5.3: 实现项目增删改查功能
  - [x] SubTask 5.4: 实现年份和分组筛选功能

- [x] Task 6: 实现西格玛性能验证图
  - [x] SubTask 6.1: 集成 Chart.js
  - [x] SubTask 6.2: 绘制基础坐标系和网格
  - [x] SubTask 6.3: 绘制 σ = 3,4,5,6 等值线
  - [x] SubTask 6.4: 添加性能区域标注
  - [x] SubTask 6.5: 绘制项目散点并添加悬停提示
  - [x] SubTask 6.6: 实现图表导出为 PNG 功能

- [x] Task 7: 实现浏览器本地存储
  - [x] SubTask 7.1: 封装 localStorage 操作
  - [x] SubTask 7.2: 实现项目数据持久化
  - [x] SubTask 7.3: 实现实验室信息持久化
  - [x] SubTask 7.4: 添加清除数据功能

- [x] Task 8: 配置 GitHub Pages 部署
  - [x] SubTask 8.1: 创建 .github/workflows/deploy.yml
  - [x] SubTask 8.2: 配置 GitHub Actions 工作流
  - [x] SubTask 8.3: 测试部署流程

- [x] Task 9: 完善用户体验
  - [x] SubTask 9.1: 添加加载状态提示
  - [x] SubTask 9.2: 添加操作成功/失败提示
  - [x] SubTask 9.3: 添加使用说明
  - [x] SubTask 9.4: 优化移动端适配

# Task Dependencies
- Task 2 必须在 Task 3、Task 4、Task 5 之前完成
- Task 3 和 Task 4 可以并行
- Task 5 必须在 Task 6 之前完成（需要项目数据）
- Task 7 可以与其他任务并行
- Task 8 必须在所有功能完成后进行
