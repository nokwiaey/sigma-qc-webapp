import json
from pathlib import Path
from typing import List, Dict, Optional
from .calculator import ProjectData

class DataManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.projects_file = self.data_dir / "projects.json"
        self.lab_info_file = self.data_dir / "lab_info.json"
        
        # 确保数据目录存在
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化文件
        if not self.projects_file.exists():
            self.save_projects([])
        if not self.lab_info_file.exists():
            self.save_lab_info({})
    
    def load_projects(self) -> List[Dict]:
        """加载所有项目数据"""
        try:
            with open(self.projects_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def save_projects(self, projects: List[Dict]) -> None:
        """保存项目数据"""
        with open(self.projects_file, "w", encoding="utf-8") as f:
            json.dump(projects, f, ensure_ascii=False, indent=4)
    
    def add_project(self, project: ProjectData) -> None:
        """添加新项目"""
        projects = self.load_projects()
        projects.append(project.to_dict())
        self.save_projects(projects)
    
    def delete_project(self, project_name: str) -> bool:
        """删除项目
        
        Returns:
            bool: 是否成功删除
        """
        projects = self.load_projects()
        original_length = len(projects)
        projects = [p for p in projects if p["project_name"] != project_name]
        
        if len(projects) < original_length:
            self.save_projects(projects)
            return True
        return False
    
    def update_project(self, project: ProjectData) -> bool:
        """更新项目数据
        
        Returns:
            bool: 是否成功更新
        """
        projects = self.load_projects()
        for i, p in enumerate(projects):
            if p["project_name"] == project.project_name:
                projects[i] = project.to_dict()
                self.save_projects(projects)
                return True
        return False
    
    def get_project(self, project_name: str) -> Optional[Dict]:
        """获取指定项目数据"""
        projects = self.load_projects()
        for project in projects:
            if project["project_name"] == project_name:
                return project
        return None
    
    def load_lab_info(self) -> Dict:
        """加载实验室信息"""
        try:
            with open(self.lab_info_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {
                "lab_code": "",
                "lab_name": "",
                "department": "",
                "contact": "",
                "phone": "",
                "mobile": "",
                "email": ""
            }
    
    def save_lab_info(self, info: Dict) -> None:
        """保存实验室信息"""
        with open(self.lab_info_file, "w", encoding="utf-8") as f:
            json.dump(info, f, ensure_ascii=False, indent=4)
    
    def clear_all_data(self) -> None:
        """清除所有数据（谨慎使用）"""
        if self.projects_file.exists():
            self.projects_file.unlink()
        if self.lab_info_file.exists():
            self.lab_info_file.unlink()
        self.__init__(self.data_dir)