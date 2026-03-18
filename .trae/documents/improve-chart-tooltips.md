# 改进图表散点和提示框计划

## 问题分析

当前性能验证图存在以下问题：
1. 散点（圆点）太大，导致重叠时难以区分
2. 鼠标悬停时只显示第一个项目的名称
3. 缺少坐标值显示（CV/TEa 和 Bias/TEa）
4. 多个重叠点时无法清晰区分每个项目

## 改进目标

参考原始网页的实现方式，改进图表的散点显示和提示框内容。

## 实施步骤

### Step 1: 减小散点大小
- 修改 `chart.js` 中的 `pointRadius` 从 10 改为 6
- 修改 `pointHoverRadius` 从 12 改为 8

### Step 2: 改进提示框内容
- 显示项目名称
- 显示 σ 水平
- 显示坐标值：
  - CV/TEa: xx%
  - Bias/TEa: xx%
- 显示 TEa、CV、Bias 原始值
- 显示批长度（如果有）

### Step 3: 处理重叠点
- Chart.js 的 tooltip 默认会显示所有重叠的数据点
- 确保 tooltip 的 `mode` 设置为 `'point'` 或 `'nearest'`
- 在 `callbacks.label` 中返回完整的项目信息

### Step 4: 格式化提示框
- 使用清晰的格式显示多行信息
- 每个项目的信息之间用分隔线区分

## 关键代码修改

### chart.js 修改点

```javascript
// 散点大小
pointRadius: 6,        // 从 10 减小
pointHoverRadius: 8,   // 从 12 减小

// 提示框配置
tooltip: {
    mode: 'point',  // 确保显示所有重叠点
    callbacks: {
        title: (context) => {
            // 返回项目名
        },
        label: (context) => {
            // 返回完整信息：
            // - σ水平
            // - CV/TEa: xx%
            // - Bias/TEa: xx%
            // - TEa、CV、Bias
            // - 批长度
        }
    }
}
```

## 预期效果

1. 散点变小，减少重叠
2. 鼠标悬停时清晰显示每个项目的完整信息
3. 显示坐标值，方便定位
4. 多个重叠项目都能显示各自的名称和数值
