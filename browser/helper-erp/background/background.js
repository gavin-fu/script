// ==================== 配置区域 ====================
// 用户ID映射表 - 请根据实际的用户ID进行配置
const USER_ID_MAP = {
  '付家旺': '612f23fd1f9f03000118a1ae'
};

// API配置
const API_CONFIG = {
  // 工单系统配置
  ERP: {
    baseUrl: 'http://tjerp.superboss.cc',
    endpoints: {
      search: '/wo/search'
    },
    defaultParams: {
      flag: '0',
      pageSize: '150',
      pageNo: '1'
    }
  },
  
  // 任务管理系统配置
  TASK: {
    baseUrl: 'https://tb.raycloud.com',
    endpoints: {
      tasks: '/api/v2/projects/{projectId}/tasks'
    },
    projectId: '5b757f62188bc70018b1d470',
    defaultParams: {
      pageSize: '200'
    }
  }
};

// 默认配置
const DEFAULT_CONFIG = {
  defaultUser: '付家旺',
  defaultWorkDays: [0, 1, 2, 3, 4], // 周一到周五
  dateFormat: 'YYYY-MM-DD',
  maxContentLength: 200 // 内容最大长度，超过此长度将自动截断
};

// ==================== 功能区域 ====================
// 当前活动的标签页ID
let activeTabId = null;

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    activeTabId = tabId;
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
});

// 时间戳转换函数 - 转换为东八区时间戳
function timestamp(dateStr, isEndDate = false) {
  // 创建日期对象并设置为东八区
  const timeStr = isEndDate ? 'T23:59:59+08:00' : 'T00:00:00+08:00';
  const date = new Date(dateStr + timeStr);
  return Math.floor(date.getTime() / 1000);
}

// URL编码函数
function encodeFilter(filter) {
  return encodeURIComponent(filter);
}

// 获取cookies
async function getCookies(domain) {
  try {
    const cookies = await chrome.cookies.getAll({ domain: domain });
    return cookies;
  } catch (error) {
    console.error('获取cookies失败:', error);
    return [];
  }
}

// 导出工单数据
async function exportWo(startDate, endDate, user = '付家旺') {
  const url = `${API_CONFIG.ERP.baseUrl}${API_CONFIG.ERP.endpoints.search}`;
  const params = new URLSearchParams({
    'participant': user,
    'flag': API_CONFIG.ERP.defaultParams.flag,
    'createdStartEnd': `${timestamp(startDate) * 1000},${timestamp(endDate, true) * 1000}`,
    'pageSize': API_CONFIG.ERP.defaultParams.pageSize,
    'pageNo': API_CONFIG.ERP.defaultParams.pageNo
  });


  // 获取cookies
  const cookies = await getCookies('superboss.cc');
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  const headers = {
    'Cookie': cookieStr,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: params
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = [];
    
    if (data.data && data.data.content) {
      for (const item of data.data.content) {
        const content = item.description.replace(/[\s，]+/g, ',').trim();
        result.push(`【${item.id}】${content}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('导出工单失败:', error);
    return [];
  }
}

// 导出任务数据
async function exportTb(startDate, endDate, user = '付家旺') {
  // 获取用户ID，如果不存在则使用默认用户ID
  const userId = USER_ID_MAP[user] || USER_ID_MAP['付家旺'];
  
  // 构建新的API URL
  const projectId = API_CONFIG.TASK.projectId;
  const filterStr = `_projectId=${projectId} AND taskLayer IN (0,1,2,3,4,5,6,7,8) AND ((executorId = ${userId}) AND ((dueDate >= ${startDate}T00:00:00+08:00) AND (dueDate <= ${endDate}T23:59:59+08:00))) ORDER BY isDone ASC, created DESC`;
  const encodedFilter = encodeFilter(filterStr);
  
  const url = `${API_CONFIG.TASK.baseUrl}${API_CONFIG.TASK.endpoints.tasks.replace('{projectId}', projectId)}?filter=${encodedFilter}&pageToken=&pageSize=${API_CONFIG.TASK.defaultParams.pageSize}`;
  


  // 获取cookies
  const cookies = await getCookies('raycloud.com');
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  const headers = {
    'Cookie': cookieStr
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = [];
    

    
    // 新的API返回结构是 { result: [...] }
    if (data.result && Array.isArray(data.result)) {
      for (const item of data.result) {
        if (item.content) {
          result.push(item.content);
        }
      }
    }
    

    return result;
  } catch (error) {
    console.error('导出任务失败:', error);
    return [];
  }
}

// 默认工作日字典
const DEFAULT_W_DICT = {
  0: '周一',
  1: '周二',
  2: '周三',
  3: '周四',
  4: '周五',
  5: '周六',
  6: '周日'
};

// 生成周报
function generateWeeklyReport(wData, tData, days = 1, weekConfig = null) {
  let report = '';
  
  // 使用传入的工作日配置或默认配置
  const weekDict = weekConfig || DEFAULT_W_DICT;
  
  // 内容截断长度配置
  const maxLength = DEFAULT_CONFIG.maxContentLength;
  
  // 获取选中的工作日数量
  const selectedWorkDays = Object.keys(weekDict).length;
  
  // 如果没有选择工作日，返回空报告
  if (selectedWorkDays === 0) {
    return '未选择任何工作日';
  }
  
  // 将选中的工作日转换为数组并排序
  const workDayKeys = Object.keys(weekDict).map(Number).sort((a, b) => a - b);
  
  // 计算每个工作日应该分配的数据数量
  const wDataPerDay = Math.floor(wData.length / selectedWorkDays);
  const tDataPerDay = Math.floor(tData.length / selectedWorkDays);
  
  // 计算剩余数据数量
  const wRemainder = wData.length % selectedWorkDays;
  const tRemainder = tData.length % selectedWorkDays;
  
  // 为每一天生成报告
  for (let i = 0; i < days; i++) {
    // 检查当前日期是否在选中的工作日中
    const currentWeekDay = i % 7; // 0-6 表示周一到周日
    const workDayIndex = workDayKeys.indexOf(currentWeekDay);
    
    if (workDayIndex === -1) {
      continue; // 跳过未选中的工作日
    }
    
    report += `\n### ${weekDict[currentWeekDay]}\n`;
    let index = 0;
    
    // 计算当前工作日应该分配的工单数据
    let wStartIndex = workDayIndex * wDataPerDay;
    let wEndIndex = wStartIndex + wDataPerDay;
    
    // 分配剩余的工单数据
    if (workDayIndex < wRemainder) {
      wStartIndex += workDayIndex;
      wEndIndex += workDayIndex + 1;
    } else {
      wStartIndex += wRemainder;
      wEndIndex += wRemainder;
    }
    
    // 处理工单数据
    for (let wi = wStartIndex; wi < wEndIndex; wi++) {
      if (wi < wData.length) {
        index++;
        let content = wData[wi].replace(/.*\n/, '');
        
        // 如果内容超过配置长度，则截断并添加省略号
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '...';
        }
        
        report += `${index}. 【工单】${content}\n`;
      }
    }
    
    // 计算当前工作日应该分配的任务数据
    let tStartIndex = workDayIndex * tDataPerDay;
    let tEndIndex = tStartIndex + tDataPerDay;
    
    // 分配剩余的任务数据
    if (workDayIndex < tRemainder) {
      tStartIndex += workDayIndex;
      tEndIndex += workDayIndex + 1;
    } else {
      tStartIndex += tRemainder;
      tEndIndex += tRemainder;
    }
    
    // 处理任务数据
    for (let ti = tStartIndex; ti < tEndIndex; ti++) {
      if (ti < tData.length) {
        index++;
        let content = tData[ti];
        
        // 如果内容超过配置长度，则截断并添加省略号
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '...';
        }
        
        report += `${index}. ${content}\n`;
      }
    }
  }
  
  return report;
}

// 生成周报的主要函数
async function generateWeeklyReportHandler(startDate, endDate, user = '付家旺', weekConfig = null) {
  try {

    
    // 获取工单数据
    const wData = await exportWo(startDate, endDate, user);
    
    // 获取任务数据
    const tData = await exportTb(startDate, endDate, user);
    
    // 计算天数差
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // 生成周报
    const report = generateWeeklyReport(wData, tData, days, weekConfig);
    
    // 统计信息
    const stats = {
      workOrderCount: wData.length,
      taskCount: tData.length,
      totalCount: wData.length + tData.length
    };
    
    return { 
      success: true, 
      data: report,
      stats: stats
    };
  } catch (error) {
    console.error('生成周报失败:', error);
    return { success: false, error: error.message };
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateWeeklyReport') {
    const { user, startDate, endDate, weekConfig } = request.data;
    generateWeeklyReportHandler(startDate, endDate, user, weekConfig).then(result => {
      sendResponse(result);
    });
    return true; // 保持消息通道开放以支持异步响应
  }
  
  if (request.action === 'extractAndCopyData') {
    extractAndCopyData().then(result => sendResponse(result));
    return true;
  }
});

// 执行数据提取并复制到剪贴板（保留原有功能）
async function extractAndCopyData() {
  if (!activeTabId) {
    console.error('没有活动的标签页');
    return { success: false, error: '没有活动的标签页' };
  }

  try {
    // 注入内容脚本
    await chrome.scripting.executeScript({
      target: {tabId: activeTabId},
      files: ['content/content_script.js']
    });

    // 发送消息获取数据
    const response = await chrome.tabs.sendMessage(activeTabId, {action: 'extractData'});
    
    if (response && response.data) {
      // 复制到剪贴板
      await navigator.clipboard.writeText(response.data);
  
      return {success: true, data: response.data};
    }
  } catch (error) {
    console.error('操作失败:', error);
    return {success: false, error: error.message};
  }
}