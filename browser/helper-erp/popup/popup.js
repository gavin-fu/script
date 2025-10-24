let generatedReport = '';

// 自定义日期选择器类
class CustomDatePicker {
  constructor(inputElement, pickerElement) {
    this.input = inputElement;
    this.picker = pickerElement;
    this.currentDate = new Date();
    this.selectedDate = null;
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    this.renderCalendar();
    this.bindEvents();
  }
  
  bindEvents() {
    // 输入框点击事件
    this.input.addEventListener('click', () => this.toggle());
    
    // 日历图标点击事件
    const icon = this.input.parentElement.querySelector('.calendar-icon');
    if (icon) {
      icon.addEventListener('click', () => this.toggle());
    }
    
    // 月份导航事件
    const prevBtn = this.picker.querySelector('.prev-month');
    const nextBtn = this.picker.querySelector('.next-month');
    
    prevBtn.addEventListener('click', () => this.previousMonth());
    nextBtn.addEventListener('click', () => this.nextMonth());
    
    // Today按钮事件
    const todayBtn = this.picker.querySelector('.today-button');
    todayBtn.addEventListener('click', () => this.selectToday());
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.picker.contains(e.target) && !this.input.contains(e.target)) {
        this.close();
      }
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    this.picker.classList.add('show');
    this.isOpen = true;
  }
  
  close() {
    this.picker.classList.remove('show');
    this.isOpen = false;
  }
  
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }
  
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }
  
  selectToday() {
    this.selectedDate = new Date();
    this.currentDate = new Date(); // 更新当前显示月份
    this.renderCalendar(); // 重新渲染以显示选中状态
    this.updateInput();
    this.close();
  }
  
  selectDate(date) {
    this.selectedDate = new Date(date);
    this.currentDate = new Date(date); // 更新当前显示月份
    this.renderCalendar(); // 重新渲染以显示选中状态
    this.updateInput();
    this.close();
  }
  
  updateInput() {
    if (this.selectedDate) {
      const formattedDate = this.formatDate(this.selectedDate);
      this.input.value = formattedDate;
      this.input.dispatchEvent(new Event('change'));
    }
  }
  
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // 更新标题
    const title = this.picker.querySelector('.datepicker-title');
    title.textContent = `${year}年${month + 1}月`;
    
    // 获取月份的第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一天是星期几（0=周日）
    const firstDayOfWeek = firstDay.getDay();
    
    // 获取上个月的最后几天
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    // 渲染日期
    const daysContainer = this.picker.querySelector('.datepicker-days');
    daysContainer.innerHTML = '';
    
    // 上个月的日期
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      const dayElement = this.createDayElement(date, true);
      daysContainer.appendChild(dayElement);
    }
    
    // 当前月的日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayElement = this.createDayElement(date, false);
      daysContainer.appendChild(dayElement);
    }
    
    // 下个月的日期（填充到42个格子）
    const totalDays = firstDayOfWeek + lastDay.getDate();
    const remainingDays = 42 - totalDays;
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayElement = this.createDayElement(date, true);
      daysContainer.appendChild(dayElement);
    }
  }
  
  createDayElement(date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'datepicker-day';
    dayElement.textContent = date.getDate();
    
    if (isOtherMonth) {
      dayElement.classList.add('other-month');
    }
    
    // 检查是否是今天
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }
    
    // 检查是否是选中的日期
    if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
              dayElement.classList.add('selected');
      }
    
    // 添加点击事件
    dayElement.addEventListener('click', () => {
      this.selectDate(date);
    });
    
    return dayElement;
  }
}

// 获取上周六的日期
function getLastSaturday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 6 ? 7 : dayOfWeek + 1;
  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() - daysToSubtract);
  return lastSaturday;
}

// 获取本周五的日期
function getThisFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToAdd = dayOfWeek === 5 ? 0 : (dayOfWeek < 5 ? 5 - dayOfWeek : 12 - dayOfWeek);
  const thisFriday = new Date(today);
  thisFriday.setDate(today.getDate() + daysToAdd);
  return thisFriday;
}

// 格式化日期为YYYY-MM-DD格式
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 初始化日期选择器
function initDatePickers() {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const startDatePicker = document.getElementById('startDatePicker');
  const endDatePicker = document.getElementById('endDatePicker');
  
  // 创建日期选择器实例
  const startPicker = new CustomDatePicker(startDateInput, startDatePicker);
  const endPicker = new CustomDatePicker(endDateInput, endDatePicker);
  
  // 设置默认值
  const lastSaturday = getLastSaturday();
  const thisFriday = getThisFriday();
  
  // 设置开始日期选择器
  startPicker.selectedDate = lastSaturday;
  startPicker.currentDate = new Date(lastSaturday); // 设置当前显示月份
  startPicker.renderCalendar(); // 重新渲染日历
  startPicker.updateInput();
  
  // 设置结束日期选择器
  endPicker.selectedDate = thisFriday;
  endPicker.currentDate = new Date(thisFriday); // 设置当前显示月份
  endPicker.renderCalendar(); // 重新渲染日历
  endPicker.updateInput();
  
  
  
  return { startPicker, endPicker };
}

// 验证日期
function validateDates() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const generateButton = document.getElementById('generateReport');
  
  
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert('开始日期不能晚于结束日期');
      generateButton.disabled = true;
      return false;
    }
    
    generateButton.disabled = false;
  } else {
    generateButton.disabled = true;
  }
  
  return true;
}

// 复制到剪贴板函数
async function copyToClipboard(text) {
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard-api' };
    } else {
      // 降级到传统方法
      return await fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error('复制失败:', error);
    return { success: false, error: error.message };
  }
}

// 备用复制方法
async function fallbackCopyToClipboard(text) {
  return new Promise((resolve) => {
    try {
      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // 选择文本并复制
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      
      // 清理
      document.body.removeChild(textArea);
      
      if (successful) {
        resolve({ success: true, method: 'exec-command' });
      } else {
        resolve({ success: false, error: 'execCommand 复制失败' });
      }
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

// 格式化周报内容
function formatReportForCopy(report, format = 'plain') {
  if (format === 'markdown') {
    // 保持原有的 Markdown 格式
    return report;
  } else if (format === 'plain') {
    // 转换为纯文本格式
    return report
      .replace(/###/g, '')  // 移除 Markdown 标题标记
      .replace(/\*\*/g, '') // 移除粗体标记
      .replace(/\*/g, '')   // 移除斜体标记
      .trim();
  } else if (format === 'html') {
    // 转换为 HTML 格式
    return report
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  return report;
}

// 生成报告按钮事件
document.getElementById('generateReport').addEventListener('click', async () => {

    
    const statusEl = document.getElementById('status');
    const reportContentEl = document.getElementById('reportContent');
    const copyButton = document.getElementById('copyToClipboard');
    const generateButton = document.getElementById('generateReport');
    
    // 获取用户、日期和工作日配置
    const selectedUser = document.getElementById('userInput').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // 获取工作日配置
    const weekConfig = {};
    const checkboxes = document.querySelectorAll('.week-config input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      weekConfig[parseInt(checkbox.value)] = checkbox.nextElementSibling.textContent;
    });
    

    
    // 验证用户输入
    if (!selectedUser) {
        statusEl.textContent = '请输入用户名';
        statusEl.className = 'error';
        statusEl.style.display = 'block';
        return;
    }
    
    if (!startDate || !endDate) {
        statusEl.textContent = '请选择开始和结束日期';
        statusEl.className = 'error';
        statusEl.style.display = 'block';
        return;
    }
    
    // 验证工作日配置
    if (Object.keys(weekConfig).length === 0) {
        statusEl.textContent = '请至少选择一个工作日';
        statusEl.className = 'error';
        statusEl.style.display = 'block';
        return;
    }
    
    // 验证日期
    if (!validateDates()) {
        return;
    }
    
    try {
        // 显示加载状态
        generateButton.disabled = true;
        statusEl.textContent = '正在生成周报，请稍候...';
        statusEl.className = 'loading';
        statusEl.style.display = 'block';
        reportContentEl.style.display = 'none';
        copyButton.style.display = 'none';
        

        
        const response = await chrome.runtime.sendMessage({
            action: 'generateWeeklyReport',
            data: {
                user: selectedUser,
                startDate: startDate,
                endDate: endDate,
                weekConfig: weekConfig
            }
        });
        

        
        if (response && response.success) {
            generatedReport = response.data;
            
            // 构建统计信息提示
            let statsMessage = '周报生成成功！';
            if (response.stats) {
                const { workOrderCount, taskCount, totalCount } = response.stats;
                statsMessage = `周报生成成功！共获取 ${workOrderCount} 个工单，${taskCount} 个任务，总计 ${totalCount} 条数据。`;
            }
            
            statusEl.textContent = statsMessage;
            statusEl.className = 'success';
            reportContentEl.textContent = generatedReport;
            reportContentEl.style.display = 'block';
            copyButton.style.display = 'block';
            
            // 显示复制提示
            setTimeout(() => {
                if (response.stats) {
                    const { workOrderCount, taskCount, totalCount } = response.stats;
                    statusEl.textContent = `周报生成成功！共 ${workOrderCount} 个工单，${taskCount} 个任务。`;
                } else {
                    statusEl.textContent = '周报生成成功！点击"复制到剪贴板"按钮复制内容。';
                }
            }, 3000);
        } else {
            const errorMsg = response ? response.error : '未知错误';
            statusEl.textContent = `生成失败: ${errorMsg}`;
            statusEl.className = 'error';
        }
    } catch (error) {
        statusEl.textContent = `通信错误: ${error.message}`;
        statusEl.className = 'error';
    } finally {
        generateButton.disabled = false;
    }
});

// 复制到剪贴板按钮事件
document.getElementById('copyToClipboard').addEventListener('click', async () => {

    
    if (!generatedReport) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = '没有可复制的内容，请先生成周报';
        statusEl.className = 'error';
        statusEl.style.display = 'block';
        return;
    }
    
    const statusEl = document.getElementById('status');
    const copyButton = document.getElementById('copyToClipboard');
    
    // 显示复制中状态
    copyButton.disabled = true;
    copyButton.textContent = '复制中...';
    statusEl.textContent = '正在复制到剪贴板...';
    statusEl.className = 'loading';
    statusEl.style.display = 'block';
    
    try {
        // 复制原始格式的周报
        const result = await copyToClipboard(generatedReport);
        
        if (result.success) {
            statusEl.textContent = `周报已成功复制到剪贴板！(使用${result.method === 'clipboard-api' ? '现代API' : '传统方法'})`;
            statusEl.className = 'success';
            
            // 显示复制成功动画
            copyButton.textContent = '✓ 已复制';
            setTimeout(() => {
                copyButton.textContent = '复制到剪贴板';
                copyButton.disabled = false;
            }, 2000);
            
            // 3秒后隐藏成功消息
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        statusEl.textContent = `复制失败: ${error.message}`;
        statusEl.className = 'error';
        copyButton.textContent = '复制到剪贴板';
        copyButton.disabled = false;
    }
});

// 添加右键菜单复制功能
document.getElementById('reportContent').addEventListener('contextmenu', function(e) {
    e.preventDefault();
    
    if (generatedReport) {
        // 创建自定义右键菜单
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            top: ${e.clientY}px;
            left: ${e.clientX}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            padding: 5px 0;
        `;
        
        const copyOption = document.createElement('div');
        copyOption.textContent = '复制周报内容';
        copyOption.style.cssText = `
            padding: 8px 15px;
            cursor: pointer;
            font-size: 13px;
        `;
        copyOption.addEventListener('mouseover', () => {
            copyOption.style.backgroundColor = '#f0f0f0';
        });
        copyOption.addEventListener('mouseout', () => {
            copyOption.style.backgroundColor = 'transparent';
        });
        copyOption.addEventListener('click', async () => {
            const result = await copyToClipboard(generatedReport);
            if (result.success) {
                alert('周报内容已复制到剪贴板！');
            } else {
                alert('复制失败: ' + result.error);
            }
            document.body.removeChild(menu);
        });
        
        menu.appendChild(copyOption);
        document.body.appendChild(menu);
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                }
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    const datePickers = initDatePickers();
});

// 添加错误处理
window.addEventListener('error', function(e) {
    // 静默处理错误
});

window.addEventListener('unhandledrejection', function(e) {
    // 静默处理Promise拒绝
});