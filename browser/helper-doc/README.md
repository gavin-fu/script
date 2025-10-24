# 牙科预约助手 - Edge浏览器插件

这是一个专为牙科诊所预约管理系统设计的Edge浏览器插件，基于您提供的Python代码功能开发。

## 功能特性

- ⚡ **一键预约** - 自动处理符合条件的预约记录
- 🎯 **智能筛选** - 根据医生姓名和患者统计信息进行筛选
- 💾 **自动保存** - 将符合条件的预约保存到指定日期

## 安装说明

### 方法一：开发者模式安装

1. 打开Edge浏览器，进入扩展管理页面
   - 地址栏输入：`edge://extensions/`
   - 或点击菜单 → 扩展 → 管理扩展

2. 开启"开发人员模式"
   - 在页面右上角找到"开发人员模式"开关并开启

3. 加载插件
   - 点击"加载解压缩的扩展"
   - 选择本项目的文件夹

4. 完成安装
   - 插件将出现在扩展列表中
   - 点击插件图标即可使用

### 方法二：打包安装

1. 在扩展管理页面点击"打包扩展"
2. 选择项目文件夹
3. 生成.crx文件后安装

## 使用方法

1. **配置参数**
   - 诊所ID：输入目标诊所的ID
   - 就诊日期：选择要查询的日期
   - 预约日期：选择要保存预约的目标日期
   - 医生姓名：输入要筛选的医生姓名

2. **执行操作**
   - **一键预约**：自动处理符合条件的预约（主要功能）

3. **查看结果**
   - 操作结果会显示在下方结果区域
   - 状态信息会实时更新

## 技术实现

### 核心功能

插件实现了与原始Python代码相同的API调用：

- `getAppointmentList()` - 获取预约列表  
- `getAppointmentUserStatistics()` - 获取用户统计
- `saveAppointment()` - 保存预约

### 文件结构

```
doc-helper/
├── manifest.json          # 插件配置文件
├── popup.html            # 主界面HTML
├── popup.css             # 界面样式
├── popup.js              # 主要逻辑
├── background.js         # 后台脚本
├── content.js            # 内容脚本
├── icons/                # 图标文件夹
└── README.md             # 说明文档
```

### API接口

插件使用以下API接口：

- `GET /medical-manage-web//appointmentRegister/clcRegistration/getAppointmentList`
- `GET /medical-manage-web/appointmentRegister/clcRegistration/getAppointmentUserStatistics`
- `POST /medical-manage-web/appointmentRegister/clcRegistration/saveAppointment`

## 注意事项

1. **Token有效期**：插件中的token有有效期限制，需要定期更新
2. **网络权限**：插件需要访问 `https://www.uenjoydental.com` 域名
3. **数据安全**：请确保在安全的环境中使用，避免敏感信息泄露
4. **使用频率**：建议合理控制API调用频率，避免对服务器造成压力

## 故障排除

### 常见问题

1. **插件无法加载**
   - 检查manifest.json文件格式是否正确
   - 确认所有必需文件都存在

2. **API请求失败**
   - 检查网络连接
   - 确认token是否有效
   - 查看浏览器控制台错误信息

3. **权限问题**
   - 确认插件已获得必要的权限
   - 检查目标网站是否在允许列表中

### 调试方法

1. 打开浏览器开发者工具
2. 查看Console标签页的错误信息
3. 检查Network标签页的请求状态
4. 在popup页面右键选择"检查"进行调试

## 更新日志

### v1.0.0
- 初始版本发布
- 实现基本的预约管理功能
- 支持用户查询和预约处理

## 许可证

本项目仅供学习和研究使用，请遵守相关法律法规和网站使用条款。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目地址：[GitHub仓库地址]
- 邮箱：[联系邮箱]
