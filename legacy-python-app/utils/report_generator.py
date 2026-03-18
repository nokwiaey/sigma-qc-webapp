from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import plotly.io as pio
import os

# 配置plotly导出设置
pio.kaleido.scope.plotlyjs = None

class ReportGenerator:
    def __init__(self):
        # 注册基本字体
        self.styles = getSampleStyleSheet()
        # 使用Courier字体，这是ReportLab内置的基本字体之一
        self.chinese_style = ParagraphStyle(
            'ChineseStyle',
            parent=self.styles['Normal'],
            fontName='Courier',
            fontSize=10,
            leading=14
        )
    
    def generate_report(self, 
                       output_path: str,
                       lab_info: Dict,
                       projects: List[Dict],
                       chart_fig) -> str:
        """生成PDF报告
        
        Args:
            output_path: 输出文件路径
            lab_info: 实验室信息
            projects: 项目数据列表
            chart_fig: Plotly图表对象
            
        Returns:
            str: 生成的PDF文件路径
        """
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # 创建文档内容
        story = []
        
        # 添加标题
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Title'],
            fontName='Courier',
            fontSize=16,
            spaceAfter=30
        )
        story.append(Paragraph("Sigma Performance Verification Report", title_style))
        story.append(Spacer(1, 12))
        
        # 添加实验室信息
        story.append(Paragraph("Laboratory Information", self.styles['Heading2']))
        lab_info_data = [
            ["Lab Code", lab_info.get("lab_code", "")],
            ["Lab Name", lab_info.get("lab_name", "")],
            ["Department", lab_info.get("department", "")],
            ["Contact", lab_info.get("contact", "")],
            ["Phone", lab_info.get("phone", "")],
            ["Mobile", lab_info.get("mobile", "")],
            ["Email", lab_info.get("email", "")]
        ]
        
        lab_info_table = Table(lab_info_data, colWidths=[100, 300])
        lab_info_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Courier'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(lab_info_table)
        story.append(Spacer(1, 20))
        
        # 添加项目数据表格
        story.append(Paragraph("Project Data", self.styles['Heading2']))
        project_headers = ['Project Name', 'TEa', 'CV', 'Bias', 'Sigma', 'Performance', 'QC Rules']
        project_data = [project_headers]
        
        for project in projects:
            project_data.append([
                project['project_name'],
                f"{project['tea']}%",
                f"{project['cv']}%",
                f"{project['bias']}%",
                str(project['sigma']),
                project['performance'],
                project['control_rules']
            ])
        
        project_table = Table(project_data, colWidths=[80, 70, 70, 70, 60, 60, 120])
        project_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (6, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Courier'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(project_table)
        story.append(Spacer(1, 20))
        
        # 添加图表
        story.append(Paragraph("Performance Chart", self.styles['Heading2']))
        # 保存图表为临时图片
        temp_image = "temp_chart.png"
        pio.write_image(chart_fig, temp_image, format='png', width=800, height=600)
        img = Image(temp_image, width=6*inch, height=4.5*inch)
        story.append(img)
        
        # 添加生成时间
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            self.chinese_style
        ))
        
        # 生成PDF
        doc.build(story)
        
        # 删除临时图片
        Path(temp_image).unlink()
        
        return output_path