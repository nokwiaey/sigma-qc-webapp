import streamlit as st
from streamlit_option_menu import option_menu
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime
from pathlib import Path
from utils import (
    DataManager,
    ProjectData,
    DataValidator,
    ChartGenerator,
    ReportGenerator,
    charts
)

# 初始化数据管理器
data_manager = DataManager()

# 设置页面配置
st.set_page_config(
    page_title="标准化西格玛性能验证图及自动选择质控程序",
    page_icon="📊",
    layout="wide"
)

# 设置样式
st.markdown("""
<style>
    .reportview-container {
        background: #fafafa;
    }
    .main {
        background: #fafafa;
    }
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 24px;
        border: none;
        border-radius: 4px;
    }
    .stTextInput>div>div>input {
        background-color: white;
    }
</style>
""", unsafe_allow_html=True)

# 创建导航菜单
selected = option_menu(
    menu_title=None,
    options=["基本信息", "数据管理", "图表分析", "报告导出"],
    icons=["person", "table", "graph-up", "file-earmark-pdf"],
    menu_icon="cast",
    default_index=0,
    orientation="horizontal",
)

# 加载或初始化数据
# 页面配置和样式已经设置完成

# 基本信息页面
if selected == "基本信息":
    st.title("实验室基本信息")
    
    lab_info = data_manager.load_lab_info()
    
    with st.form("lab_info_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            lab_code = st.text_input("实验室编码", value=lab_info.get("lab_code", ""))
            lab_name = st.text_input("实验室名称", value=lab_info.get("lab_name", ""))
            department = st.text_input("科室", value=lab_info.get("department", ""))
            contact = st.text_input("联系人", value=lab_info.get("contact", ""))
            
        with col2:
            phone = st.text_input("电话", value=lab_info.get("phone", ""))
            mobile = st.text_input("手机", value=lab_info.get("mobile", ""))
            email = st.text_input("Email", value=lab_info.get("email", ""))
        
        if st.form_submit_button("保存信息"):
            new_info = {
                "lab_code": lab_code,
                "lab_name": lab_name,
                "department": department,
                "contact": contact,
                "phone": phone,
                "mobile": mobile,
                "email": email
            }
            data_manager.save_lab_info(new_info)
            st.success("信息保存成功！")

# 数据管理页面
elif selected == "数据管理":
    st.title("项目数据管理")
    
    # 显示现有项目数据
    projects = data_manager.load_projects()
    if projects:
        st.subheader("现有项目数据")
        project_df = pd.DataFrame(projects)
        # 确保year和group列存在
        if 'year' not in project_df.columns:
            project_df['year'] = None
        if 'group' not in project_df.columns:
            project_df['group'] = None

        # 添加筛选功能
        col1, col2 = st.columns(2)
        with col1:
            if project_df['year'].notna().any():
                selected_year = st.selectbox(
                    "选择年份",
                    options=["全部"] + sorted(project_df['year'].unique().tolist()),
                    index=0
                )
        with col2:
            if project_df['group'].notna().any():
                selected_group = st.selectbox(
                    "选择分组",
                    options=["全部"] + sorted(project_df['group'].unique().tolist()),
                    index=0
                )

        # 根据筛选条件过滤数据
        if selected_year != "全部":
            project_df = project_df[project_df['year'] == selected_year]
        if selected_group != "全部":
            project_df = project_df[project_df['group'] == selected_group]
            
        st.dataframe(
            project_df[['project_name', 'year', 'group', 'tea', 'cv', 'bias', 'sigma', 'performance', 'control_rules', 'recommended_batch_size']].rename(
                columns={
                    'project_name': '项目名称',
                    'year': '年份',
                    'group': '分组',
                    'tea': '允许总误差(TEa)(%)',
                    'cv': '不精密度(CV)(%)',
                    'bias': '偏倚(Bias)(%)',
                    'sigma': 'σ水平',
                    'performance': '性能等级',
                    'control_rules': '质控规则',
                    'recommended_batch_size': '推荐批长度'
                }
            ).reindex(columns=['项目名称', '年份', '分组', '允许总误差(TEa)(%)', '不精密度(CV)(%)', '偏倚(Bias)(%)', 'σ水平', '性能等级', '质控规则', '推荐批长度']),
            use_container_width=True,
            hide_index=True
        )
    
    # 添加新项目表单
    st.subheader("添加新项目")
    with st.form("project_form"):
        project_name = st.text_input("项目名称")
        tea = st.number_input("总允许误差(TEa)(%)", min_value=0.0, format="%f")
        cv = st.number_input("变异系数(CV)(%)", min_value=0.0, format="%f")
        bias = st.number_input("偏倚(Bias)(%)", min_value=0.0, format="%f")
        year = st.number_input("年份", min_value=2000, max_value=2100, value=datetime.now().year)
        
        # 分组选择
        group = st.selectbox("分组选择", ["生化室", "免疫室", "电化学室", "临检室", "分子生物室", "微生物室", "其他"])
        
        if st.form_submit_button("添加项目"):
            if not group:
                st.error("请选择或输入分组")
            else:
                errors = DataValidator.validate_project_data(project_name, tea, cv, bias, year, group)
                if errors:
                    for error in errors:
                        st.error(error)
                else:
                    try:
                        project = ProjectData(project_name, tea, cv, bias, year, group)
                        data_manager.add_project(project)
                        st.success(f"项目 {project_name} 添加成功！")
                        st.rerun()
                    except Exception as e:
                        st.error(f"添加项目失败：{str(e)}")

# 图表分析页面
elif selected == "图表分析":
    st.title("标准化西格玛性能验证图")
    
    projects = data_manager.load_projects()
    if not projects:
        st.warning("暂无项目数据，请先在数据管理页面添加项目。")
    else:
        project_df = pd.DataFrame(projects)
        # 确保year和group列存在
        if 'year' not in project_df.columns:
            project_df['year'] = None
        if 'group' not in project_df.columns:
            project_df['group'] = None

        # 添加筛选功能
        col1, col2 = st.columns(2)
        with col1:
            if project_df['year'].notna().any():
                selected_year = st.selectbox(
                    "选择年份",
                    options=["全部"] + sorted(project_df['year'].unique().tolist()),
                    index=0,
                    key="chart_year"
                )
        with col2:
            if project_df['group'].notna().any():
                selected_group = st.selectbox(
                    "选择分组",
                    options=["全部"] + sorted(project_df['group'].unique().tolist()),
                    index=0,
                    key="chart_group"
                )

        # 根据筛选条件过滤数据
        filtered_df = project_df.copy()
        if selected_year != "全部":
            filtered_df = filtered_df[filtered_df['year'] == selected_year]
        if selected_group != "全部":
            filtered_df = filtered_df[filtered_df['group'] == selected_group]

        if not filtered_df.empty:
            chart_generator = ChartGenerator()
            fig = chart_generator.create_sigma_verification_chart(filtered_df.to_dict('records'))
            fig = chart_generator.add_performance_zones(fig)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning("没有符合筛选条件的数据可供生成图表。")

# 报告导出页面
elif selected == "报告导出":
    st.title("报告导出")
    
    projects = data_manager.load_projects()
    if not projects:
        st.warning("暂无项目数据，请先在数据管理页面添加项目。")
    else:
        project_df = pd.DataFrame(projects)
        # 确保year和group列存在
        if 'year' not in project_df.columns:
            project_df['year'] = None
        if 'group' not in project_df.columns:
            project_df['group'] = None

        # 添加筛选功能
        col1, col2 = st.columns(2)
        with col1:
            if project_df['year'].notna().any():
                selected_year = st.selectbox(
                    "选择年份",
                    options=["全部"] + sorted(project_df['year'].unique().tolist()),
                    index=0,
                    key="report_year"
                )
        with col2:
            if project_df['group'].notna().any():
                selected_group = st.selectbox(
                    "选择分组",
                    options=["全部"] + sorted(project_df['group'].unique().tolist()),
                    index=0,
                    key="report_group"
                )

        # 根据筛选条件过滤数据
        filtered_df = project_df.copy()
        if selected_year != "全部":
            filtered_df = filtered_df[filtered_df['year'] == selected_year]
        if selected_group != "全部":
            filtered_df = filtered_df[filtered_df['group'] == selected_group]

        if st.button("生成报告"):
            try:
                if not filtered_df.empty:
                    report_generator = ReportGenerator()
                    # 生成图表
                    chart_generator = ChartGenerator()
                    chart_fig = chart_generator.create_sigma_verification_chart(filtered_df.to_dict('records'))
                    # 获取实验室信息
                    lab_info = data_manager.load_lab_info()
                    # 生成报告
                    output_path = f"reports/性能验证报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                    report_path = report_generator.generate_report(
                        output_path=output_path,
                        lab_info=lab_info,
                        projects=filtered_df.to_dict('records'),
                        chart_fig=chart_fig
                    )
                    st.success(f"报告生成成功！")
                    
                    # 添加下载按钮
                    with open(report_path, "rb") as pdf_file:
                        pdf_bytes = pdf_file.read()
                    st.download_button(
                        label="下载报告",
                        data=pdf_bytes,
                        file_name=Path(report_path).name,
                        mime="application/pdf"
                    )
                else:
                    st.warning("没有符合筛选条件的数据可供生成报告。")
            except Exception as e:
                st.error(f"生成报告失败：{str(e)}")