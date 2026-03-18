import plotly.graph_objects as go
import numpy as np
from typing import List, Dict

class ChartGenerator:
    @staticmethod
    def create_sigma_verification_chart(projects: List[Dict]) -> go.Figure:
        """创建标准化西格玛性能验证图
        
        Args:
            projects: 项目数据列表
            
        Returns:
            go.Figure: Plotly图表对象
        """
        # 创建基础图表
        fig = go.Figure()
        
        # 添加网格线
        fig.add_shape(
            type="rect",
            x0=0, y0=0, x1=50, y1=100,
            line=dict(color="gray", width=1),
            fillcolor="white",
            layer="below"
        )
        
        # 添加σ等级线
        sigma_levels = [3, 4, 5, 6]
        x = np.linspace(0, 50, 1000)
        for sigma in sigma_levels:
            y = 100 - sigma * x
            y = np.clip(y, 0, 100)
            fig.add_trace(go.Scatter(
                x=x,
                y=y,
                mode='lines',
                name=f'σ = {sigma}',
                line=dict(color='gray', width=1, dash='dot'),
                hoverinfo='skip'
            ))
        
        # 添加项目散点
        for project in projects:
            normalized_cv = (project['cv'] / project['tea']) * 100
            normalized_bias = (project['bias'] / project['tea']) * 100
            
            fig.add_trace(go.Scatter(
                x=[normalized_cv],
                y=[normalized_bias],
                mode='markers',
                name=project['project_name'],
                marker=dict(
                    size=10,
                    color=project['color'],
                    symbol='circle'
                ),
                text=f"项目：{project['project_name']}<br>" \
                     f"σ水平：{project['sigma']}<br>" \
                     f"性能：{project['performance']}",
                hoverinfo='text'
            ))
        
        # 设置布局
        fig.update_layout(
            title=dict(
                text='标准化西格玛性能验证图',
                x=0.5,
                y=0.95,
                xanchor='center',
                yanchor='top',
                font=dict(size=20)
            ),
            xaxis=dict(
                title='不精密度(CV/TEa)',
                range=[0, 50],
                dtick=5,
                gridcolor='lightgray'
            ),
            yaxis=dict(
                title='偏倚(Bias/TEa)',
                range=[0, 100],
                dtick=10,
                gridcolor='lightgray'
            ),
            showlegend=True,
            legend=dict(
                yanchor="top",
                y=0.99,
                xanchor="left",
                x=0.01,
                bgcolor='rgba(255,255,255,0.8)'
            ),
            plot_bgcolor='white',
            width=800,
            height=600,
            margin=dict(t=100)
        )
        
        return fig
    
    @staticmethod
    def add_performance_zones(fig: go.Figure) -> go.Figure:
        """添加性能区域标注
        
        Args:
            fig: Plotly图表对象
            
        Returns:
            go.Figure: 更新后的图表对象
        """
        # 添加性能区域注释
        annotations = [
            dict(
                x=45,
                y=10,
                text="世界一流",
                showarrow=False,
                font=dict(size=12, color="#00ff00")
            ),
            dict(
                x=45,
                y=30,
                text="优秀",
                showarrow=False,
                font=dict(size=12, color="#008080")
            ),
            dict(
                x=45,
                y=50,
                text="良好",
                showarrow=False,
                font=dict(size=12, color="#87CEEB")
            ),
            dict(
                x=45,
                y=70,
                text="临界",
                showarrow=False,
                font=dict(size=12, color="#800080")
            ),
            dict(
                x=45,
                y=85,
                text="欠佳",
                showarrow=False,
                font=dict(size=12, color="#FFA500")
            ),
            dict(
                x=45,
                y=95,
                text="不可接受",
                showarrow=False,
                font=dict(size=12, color="#ff0000")
            )
        ]
        
        fig.update_layout(annotations=annotations)
        return fig