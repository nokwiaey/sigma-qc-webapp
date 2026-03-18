import numpy as np
from typing import Dict, Tuple, List

class SigmaCalculator:
    @staticmethod
    def calculate_sigma(tea: float, cv: float, bias: float) -> float:
        """计算σ水平
        
        Args:
            tea: 允许总误差
            cv: 不精密度
            bias: 偏倚
            
        Returns:
            float: σ水平
        """
        if tea <= 0 or cv < 0 or bias < 0:
            raise ValueError("参数值无效：TEa必须大于0，CV和Bias必须大于等于0")
            
        try:
            sigma = (tea - abs(bias)) / cv
            return round(sigma, 2)
        except ZeroDivisionError:
            raise ValueError("CV不能为0")
    
    @staticmethod
    def evaluate_performance(sigma: float) -> Tuple[str, str, int]:
        """评估性能等级
        
        Args:
            sigma: σ水平
            
        Returns:
            Tuple[str, str, int]: (性能等级, 颜色代码, 推荐批长度)
        """
        if sigma >= 6:
            return "世界一流", "#00ff00", 1000  # 绿色
        elif 5 <= sigma < 6:
            return "优秀", "#008080", 450  # 青色
        elif 4 <= sigma < 5:
            return "良好", "#87CEEB", 200  # 天蓝色
        elif 3 <= sigma < 4:
            return "临界", "#800080", 45  # 紫色
        else:
            return "不可接受", "#ff0000", None  # 红色
    
    @staticmethod
    def get_control_rules(performance: str) -> str:
        """获取质控规则
        
        Args:
            performance: 性能等级
            
        Returns:
            str: 质控规则描述
        """
        rules = {
            "世界一流": "1₃ₛ(N=2,R=1)",
            "优秀": "1₃ₛ2₂ₛR₄ₛ\n(N=2,R=1)",
            "良好": "1₃ₛ2₂ₛR₄ₛ4₁ₛ\n(N=4,R=1或N=2,R=2)",
            "临界": "1₃ₛ2₂ₛR₄ₛ4₁ₛ8ₓ\n(N=4,R=2或N=2,R=4)",
            "欠佳": "",
            "不可接受": ""
        }
        return rules.get(performance, "未知等级")

class DataValidator:
    @staticmethod
    def validate_project_data(project_name: str, tea: float, cv: float, bias: float, year: int = None, group: str = None) -> List[str]:
        """
        验证项目数据是否合法
        
        Args:
            project_name: 项目名称
            tea: 允许总误差
            cv: 不精密度
            bias: 偏倚
            year: 年份
            group: 分组
            
        Returns:
            List[str]: 错误信息列表，如果没有错误则为空列表
        """
        errors = []
        
        if not project_name.strip():
            errors.append("项目名称不能为空")
        
        if tea <= 0:
            errors.append("允许总误差必须大于0")
            
        if cv <= 0:
            errors.append("不精密度必须大于0")
            
        if bias < 0:
            errors.append("偏倚必须大于等于0")

        if year is not None and (year < 2000 or year > 2100):
            errors.append("年份必须在2000-2100之间")
            
        return errors

class ProjectData:
    def __init__(self, project_name: str, tea: float, cv: float, bias: float, year: int = None, group: str = None):
        self.project_name = project_name
        self.tea = tea
        self.cv = cv
        self.bias = bias
        self.year = year
        self.group = group
        self.sigma = SigmaCalculator.calculate_sigma(tea, cv, bias)
        self.performance, self.color, self.recommended_batch_size = SigmaCalculator.evaluate_performance(self.sigma)
        self.control_rules = SigmaCalculator.get_control_rules(self.performance)
    
    def to_dict(self) -> Dict:
        """转换为字典格式"""
        return {
            "project_name": self.project_name,
            "tea": self.tea,
            "cv": self.cv,
            "bias": self.bias,
            "year": self.year,
            "group": self.group,
            "sigma": self.sigma,
            "performance": self.performance,
            "color": self.color,
            "control_rules": self.control_rules,
            "recommended_batch_size": self.recommended_batch_size
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ProjectData':
        """从字典创建实例"""
        return cls(
            project_name=data["project_name"],
            tea=data["tea"],
            cv=data["cv"],
            bias=data["bias"]
        )