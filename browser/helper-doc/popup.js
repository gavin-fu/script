// 配置常量
const DOMAIN = 'https://www.uenjoydental.com';
let HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json;charset=UTF-8',
    'Origin': 'https://www.uenjoydental.com',
    'Referer': 'https://www.uenjoydental.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'token': '', // 将动态获取
};

// DOM 元素
let statusEl, resultsEl;
let currentCalendarTarget = null;
let currentCalendarDate = new Date();

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    statusEl = document.getElementById('status');
    resultsEl = document.getElementById('results');
    
    // 初始化时隐藏结果区域
    hideResults();
    
    // 绑定事件
    document.getElementById('processAppointmentsBtn').addEventListener('click', processAppointments);
    

    

    
    // 初始化日期选择器
    initDatePickers();
    
    // 设置默认日期
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + 3);
    
    const currentDateFormatted = formatDate(today);
    const appointmentDateFormatted = formatDate(futureDate);
    
    console.log('设置默认日期:', {
        today: currentDateFormatted,
        futureDate: appointmentDateFormatted
    });
    
    document.getElementById('currentDate').value = currentDateFormatted;
    document.getElementById('appointmentDate').value = appointmentDateFormatted;
    
    // 初始化日历显示当前月份
    currentCalendarDate = new Date(today);
    
    // 初始化时尝试获取已捕获的token
    initializeToken();
});

// 初始化token
async function initializeToken() {
    await refreshToken();
}

// 刷新Token
async function refreshToken() {
    try {
        // 隐藏结果区域
        hideResults();
        
        // 方法1: 尝试从background script获取已捕获的token
        const backgroundResponse = await chrome.runtime.sendMessage({ action: 'getCapturedToken' });
        if (backgroundResponse && backgroundResponse.success && backgroundResponse.token) {
            HEADERS.token = backgroundResponse.token;
            console.log('从background script获取到token:', backgroundResponse.token.substring(0, 50) + '...');
            return;
        }
        
        // 方法2: 尝试从当前标签页获取token
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('uenjoydental.com')) {
            try {
                const contentResponse = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getToken' });
                if (contentResponse && contentResponse.success && contentResponse.token) {
                    HEADERS.token = contentResponse.token;
                    console.log('从content script获取到token:', contentResponse.token.substring(0, 50) + '...');
                    return;
                }
            } catch (error) {
                console.log('从content script获取token失败:', error);
            }
        }
        
        // 方法3: 尝试从storage获取token
        const storageResult = await chrome.storage.local.get(['capturedToken']);
        if (storageResult.capturedToken) {
            HEADERS.token = storageResult.capturedToken;
            console.log('从storage获取到token:', storageResult.capturedToken.substring(0, 50) + '...');
            return;
        }
        
        console.log('未找到有效的token');
        showStatus('请登录 www.uenjoydental.com 后执行操作', 'info');
        
    } catch (error) {
        console.log('刷新token时出错:', error);
        showStatus('获取登录信息失败，请刷新页面重试', 'warning');
    }
}

// 格式化日期为 YYYY/MM/DD 格式
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 解析日期字符串
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

// 初始化日期选择器
function initDatePickers() {
    const currentDateInput = document.getElementById('currentDate');
    const appointmentDateInput = document.getElementById('appointmentDate');
    
    // 绑定点击事件
    currentDateInput.addEventListener('click', () => showCalendar(currentDateInput));
    appointmentDateInput.addEventListener('click', () => showCalendar(appointmentDateInput));
    
    // 绑定日历导航事件
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
    
    // 绑定Today按钮事件
    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
        todayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Today按钮被点击');
            goToToday();
        });
    } else {
        console.error('Today按钮未找到');
    }
    
    // 点击外部关闭日历
    document.addEventListener('click', (e) => {
        const calendar = document.getElementById('calendar');
        if (!calendar.contains(e.target) && !e.target.closest('.date-input-wrapper')) {
            calendar.style.display = 'none';
        }
    });
}

// 显示日历
function showCalendar(targetInput) {
    currentCalendarTarget = targetInput;
    const calendar = document.getElementById('calendar');
    
    // 设置日历位置
    const rect = targetInput.getBoundingClientRect();
    calendar.style.position = 'absolute';
    calendar.style.top = `${rect.bottom + 5}px`;
    calendar.style.left = `${rect.left}px`;
    calendar.style.width = `${rect.width}px`;
    
    // 显示日历
    calendar.style.display = 'block';
    
    // 渲染日历
    renderCalendar();
}

// 渲染日历
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // 更新标题
    document.getElementById('calendarTitle').textContent = `${year}年${month + 1}月`;
    
    // 获取月份的第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = '';
    
    // 渲染6周的日期
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + week * 7 + day);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = date.getDate();
            
            // 检查是否是当前月份
            if (date.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // 检查是否是今天
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // 检查是否是选中的日期
            if (currentCalendarTarget && currentCalendarTarget.value) {
                const selectedDate = parseDate(currentCalendarTarget.value);
                if (date.toDateString() === selectedDate.toDateString()) {
                    dayElement.classList.add('selected');
                }
            }
            
            // 绑定点击事件
            dayElement.addEventListener('click', () => selectDate(date));
            
            daysContainer.appendChild(dayElement);
        }
    }
}

// 选择日期
function selectDate(date) {
    if (currentCalendarTarget) {
        currentCalendarTarget.value = formatDate(date);
        document.getElementById('calendar').style.display = 'none';
    }
}

// 导航月份
function navigateMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

// 跳转到今天
function goToToday() {
    console.log('goToToday函数被调用');
    
    const today = new Date();
    currentCalendarDate = new Date(today);
    
    console.log('当前日历目标:', currentCalendarTarget);
    console.log('今天的日期:', formatDate(today));
    
    // 更新当前输入框的值为今天
    if (currentCalendarTarget) {
        currentCalendarTarget.value = formatDate(today);
        console.log('已更新输入框值为:', currentCalendarTarget.value);
    } else {
        console.warn('没有当前日历目标');
    }
    
    // 重新渲染日历
    renderCalendar();
    
    // 关闭日历
    const calendar = document.getElementById('calendar');
    if (calendar) {
        calendar.style.display = 'none';
        console.log('日历已关闭');
    }
}

// 显示状态信息
function showStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// 隐藏结果区域
function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
}

// 显示结果
function showResults(data) {
    // 显示结果区域
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
        resultsEl.innerHTML = '<div class="no-data">暂无数据</div>';
        return;
    }
    
    // 如果是数组，显示为表格
    if (Array.isArray(data)) {
        resultsEl.innerHTML = createTableFromArray(data);
    }
    // 如果是对象，显示为表格或格式化JSON
    else if (typeof data === 'object') {
        // 检查是否是处理预约的结果对象
        if (data.results && Array.isArray(data.results)) {
            resultsEl.innerHTML = createTableFromArray(data.results, data);
        } else {
            resultsEl.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    }
    // 其他情况显示为文本
    else {
        resultsEl.innerHTML = `<pre>${data}</pre>`;
    }
}

// 从数组创建表格
function createTableFromArray(data, summaryData = null) {
    if (!data || data.length === 0) {
        return '<div class="no-data">暂无数据</div>';
    }
    
    // 获取表头，过滤掉患者ID字段
    const headers = Object.keys(data[0]).filter(header => header !== 'patientId');
    
    // 创建表格HTML
    let tableHTML = '<div class="table-container">';
    
    // 如果有汇总数据，显示汇总信息
    if (summaryData) {
        tableHTML += `
            <div class="summary-info">
                <div class="summary-item">院区患者总数: ${summaryData.totalAppointments || 0}</div>
                <div class="summary-item">医生名下患者数: ${summaryData.processedCount || 0}</div>
                <div class="summary-item">预约成功数: ${summaryData.successCount || 0}</div>
            </div>
        `;
    }
    
    tableHTML += '<table class="results-table">';
    
    // 表头
    tableHTML += '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${formatHeader(header)}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // 表体
    data.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            const value = row[header];
            tableHTML += `<td>${formatCellValue(value, header)}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody>';
    
    tableHTML += '</table></div>';
    
    return tableHTML;
}

// 格式化表头
function formatHeader(header) {
    const headerMap = {
        'name': '姓名',
        'patientName': '患者姓名',
        'patientId': '患者ID',
        'doctorName': '医生姓名',
        'doctorId': '医生ID',
        'subscribeType': '预约类型',
        'symptomaticType': '症状类型',
        'counselor': '咨询师',
        'departmentId': '科室ID',
        'assistant': '助理',
        'consultingRoomId': '诊室ID',
        'status': '状态',
        'message': '预约详情',
        'id': 'ID',
        'createTime': '创建时间',
        'updateTime': '更新时间'
    };
    
    return headerMap[header] || header;
}

// 格式化单元格值
function formatCellValue(value, header) {
    if (value === null || value === undefined) {
        return '-';
    }
    
    // 状态列特殊处理
    if (header === 'status') {
        const statusMap = {
            'success': '<span class="status-success">成功</span>',
            'error': '<span class="status-error">错误</span>',
            'skipped': '<span class="status-skipped">跳过</span>'
        };
        return statusMap[value] || value;
    }
    
    // 时间列格式化
    if (header === 'createTime' || header === 'updateTime') {
        if (typeof value === 'string' && value.length > 10) {
            return value.substring(0, 19).replace('T', ' ');
        }
    }
    
    // 长文本截断
    if (typeof value === 'string' && value.length > 50) {
        return `<span title="${value}">${value.substring(0, 50)}...</span>`;
    }
    
    return value;
}

// 处理登录错误
function handleLoginError(response) {
    if (response.code === 402 || response.msg === "请登录系统再操作！") {
        console.warn('检测到登录错误:', response);
        showStatus('Token已过期，正在尝试重新获取...', 'warning');
        
        // 清空当前token
        HEADERS.token = '';
        
        // 自动尝试重新获取token
        setTimeout(() => {
            updateTokenFromWebsite();
        }, 2000);
        
        return true; // 表示已处理登录错误
    }
    return false; // 表示不是登录错误
}

// 获取表单数据
function getFormData() {
    const currentDateObj = parseDate(document.getElementById('currentDate').value);
    const appointmentDateObj = parseDate(document.getElementById('appointmentDate').value);
    
    // 使用本地时间格式化日期，避免时区问题
    const formatDateToYYYYMMDD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    return {
        clinicId: document.getElementById('clinicId').value,
        currentDate: formatDateToYYYYMMDD(currentDateObj),
        appointmentDate: formatDateToYYYYMMDD(appointmentDateObj),
        doctorName: document.getElementById('doctorName').value
    };
}

// 发送请求的通用函数
async function makeRequest(url, options = {}) {
    try {
        // 检查token是否存在
        if (!HEADERS.token || HEADERS.token.trim() === '') {
            console.warn('Token不存在，尝试获取Token...');
            showStatus('正在获取Token，请稍后重试...', 'info');
            
            // 尝试获取token
            await updateTokenFromWebsite();
            
            // 如果仍然没有token，提示用户
            if (!HEADERS.token || HEADERS.token.trim() === '') {
                showStatus('未找到有效Token，请在目标网站上登录并执行一些操作（如点击按钮、刷新页面等）', 'warning');
                throw new Error('获取登录信息失败，请先登录系统后，再执行操作！');
            }
        }
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...HEADERS,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const jsonResponse = await response.json();
            
            // 检查是否是登录错误
            if (jsonResponse.code === 402 || jsonResponse.msg === "请登录系统再操作！") {
                console.warn('Token已过期，需要重新登录');
                showStatus('Token已过期，请重新登录系统', 'warning');
                
                // 清空当前token
                HEADERS.token = '';
                
                throw new Error('登录信息已过期，请重新登录系统后操作！');
            }
            
            return jsonResponse;
        } else {
            // 如果不是JSON，尝试解析为JSON，如果失败则返回文本
            try {
                return await response.json();
            } catch (jsonError) {
                const text = await response.text();
                console.warn('Response is not valid JSON, returning as text:', text);
                return { data: text, isText: true };
            }
        }
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}





// 获取预约用户统计信息
async function getAppointmentUserStatistics(patientId) {
    try {
        const url = `${DOMAIN}/medical-manage-web/appointmentRegister/clcRegistration/getAppointmentUserStatistics?patientId=${patientId}`;
        const response = await makeRequest(url, {
            method: 'GET'
        });
        
        if (response.isText) {
            console.warn('用户统计信息响应不是JSON格式:', response.data);
            return {};
        }
        
        // 检查是否是登录错误
        if (handleLoginError(response)) {
            return {};
        }
        
        return response.data || {};
    } catch (error) {
        console.error('获取用户统计信息失败:', error);
        return {};
    }
}

// 保存预约
async function saveAppointment(clinicId, appointment, dateStr) {
    try {
        const url = `${DOMAIN}/medical-manage-web/appointmentRegister/clcRegistration/saveAppointment`;
        
        const formData = new FormData();
        formData.append('clinicId', clinicId);
        formData.append('patientId', appointment.patientId);
        formData.append('name', appointment.name);
        formData.append('subscribeType', appointment.subscribeType);
        formData.append('symptomaticType', appointment.symptomaticType);
        formData.append('appointmentPeriodBegin', `${dateStr} 09:30`);
        formData.append('appointmentPeriodEnd', `${dateStr} 09:45`);
        formData.append('counselor', appointment.counselor);
        formData.append('departmentId', appointment.departmentId);
        formData.append('doctorId', appointment.doctorId);
        formData.append('assistant', appointment.assistant);
        formData.append('consultingRoomId', appointment.consultingRoomId);
        formData.append('anamnesisNo', 'BF250701100004');
        formData.append('clcRegistrationProjectRelIds[0]', 'e42e65e470e74933be8c58de38decffc');
        formData.append('clcRegistrationProjectRels[0].projectId', 'e42e65e470e74933be8c58de38decffc');
        formData.append('sendMessage', 'false');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(formData)
        });
        
        if (!response.ok) {
            throw new Error(`保存预约失败: ${response.status}`);
        }
        
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const jsonResponse = await response.json();
            
            // 检查是否是登录错误
            if (handleLoginError(jsonResponse)) {
                throw new Error('Token已过期，请重新登录');
            }
            
            return jsonResponse;
        } else {
            // 如果不是JSON，返回文本响应
            const text = await response.text();
            return { success: true, message: text };
        }
    } catch (error) {
        console.error('保存预约失败:', error);
        throw error;
    }
}

// 处理预约（主要逻辑）
async function processAppointments() {
    const formData = getFormData();
    
    try {
        showStatus('正在处理预约...', 'info');
        
        // 1. 获取预约列表
        const url = `${DOMAIN}/medical-manage-web//appointmentRegister/clcRegistration/getAppointmentList?clinicId=${formData.clinicId}&subscribeType=1&searchesDateType=2&dateStart=${formData.currentDate}+00:00:00&dateEnd=${formData.currentDate}+23:59:59&pageNo=1&pageSize=-1`;
        
        const response = await makeRequest(url, {
            method: 'GET'
        });
        
        // 处理响应数据
        let appointments = [];
        if (response.isText) {
            showStatus(`处理预约响应: ${response.data}`, 'info');
            return;
        } else {
            // 检查是否是登录错误
            if (handleLoginError(response)) {
                return;
            }
            appointments = response.page?.list || [];
        }
        
        if (appointments.length === 0) {
            showStatus('没有找到预约记录', 'info');
            return;
        }
        
        let processedCount = 0;
        let successCount = 0;
        const results = [];
        
        // 2. 处理每个预约
        for (const appointment of appointments) {
            // 检查医生姓名
            if (appointment.doctorName !== formData.doctorName) {
                continue;
            }
            
            // 检查患者ID
            if (!appointment.patientId) {
                continue;
            }
            
            processedCount++;
            
            try {
                // 3. 获取用户统计信息
                const statistics = await getAppointmentUserStatistics(appointment.patientId);
                
                // 4. 检查是否需要保存预约
                if (statistics.laterDate === 0) {
                    await saveAppointment(formData.clinicId, appointment, formData.appointmentDate);
                    successCount++;
                    results.push({
                        patientName: appointment.name,
                        patientId: appointment.patientId,
                        status: 'success',
                        message: '预约成功'
                    });
                } else {
                    results.push({
                        patientName: appointment.name,
                        patientId: appointment.patientId,
                        status: 'skipped',
                        message: '已存在预约记录'
                    });
                }
            } catch (error) {
                results.push({
                    patientName: appointment.name,
                    patientId: appointment.patientId,
                    status: 'error',
                    message: error.message
                });
            }
        }
        
        showResults({
            totalAppointments: appointments.length,
            processedCount: processedCount,
            successCount: successCount,
            results: results
        });
        
        showStatus(`处理完成！${formData.currentDate} ${formData.doctorName}医生名下就诊患者 ${processedCount} 个，本次预约成功 ${successCount} 个`, 'success');
        
    } catch (error) {
        showStatus(`处理预约失败: ${error.message}`, 'error');
    }
}

// 动态获取token
async function updateTokenFromWebsite() {
    try {
        console.log('开始动态获取token...');
        showStatus('正在获取token...', 'info');
        
        // 首先尝试从background script获取已捕获的token
        try {
            const backgroundResponse = await chrome.runtime.sendMessage({ action: 'getCapturedToken' });
            if (backgroundResponse && backgroundResponse.success && backgroundResponse.token) {
                HEADERS.token = backgroundResponse.token;
                console.log('从background script获取到token:', backgroundResponse.token.substring(0, 50) + '...');
                showStatus('Token已更新，请重试操作', 'success');
                return;
            }
        } catch (backgroundError) {
            console.log('从background script获取token失败，尝试其他方式...');
        }
        
        // 获取当前活动标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url.includes('uenjoydental.com')) {
            console.warn('当前页面不是目标网站，无法获取token');
            showStatus('请在 uenjoydental.com 网站上使用此插件', 'info');
            return;
        }
        
        try {
            // 通过content script获取token
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getToken' });
            
            if (response && response.success && response.token) {
                HEADERS.token = response.token;
                console.log('成功获取token:', response.token.substring(0, 50) + '...');
                showStatus('Token已更新，请重试操作', 'success');
            } else {
                console.warn('页面中未找到有效的token');
                showStatus('未找到有效token，请确保已登录系统并在页面上进行一些操作以触发网络请求', 'warning');
            }
        } catch (messageError) {
            // 如果content script没有响应，尝试直接注入脚本
            console.log('Content script未响应，尝试直接注入脚本...');
            await injectAndGetToken(tab.id);
        }
        
    } catch (error) {
        console.error('动态获取token时出错:', error);
        showStatus(`获取token失败: ${error.message}`, 'error');
    }
}





// 注入脚本并获取token
async function injectAndGetToken(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: extractTokenFromPage
        });
        
        if (results && results[0] && results[0].result) {
            const token = results[0].result;
            if (token) {
                HEADERS.token = token;
                console.log('成功获取token:', token.substring(0, 50) + '...');
                showStatus('Token已更新，请重试操作', 'success');
            } else {
                console.warn('页面中未找到有效的token');
                showStatus('未找到有效token，请确保已登录系统', 'warning');
            }
        } else {
            console.warn('页面中未找到有效的token');
            showStatus('未找到有效token，请确保已登录系统', 'warning');
        }
    } catch (error) {
        console.error('注入脚本获取token失败:', error);
        showStatus('获取token失败，请刷新页面后重试', 'error');
    }
}

// 在页面中提取token的函数（用于直接注入）
function extractTokenFromPage() {
    try {
        // 方法1: 从localStorage获取
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('authToken') || 
                     localStorage.getItem('accessToken') ||
                     localStorage.getItem('userToken');
        
        if (token) {
            console.log('从localStorage获取到token');
            return token;
        }
        
        // 方法2: 从sessionStorage获取
        const sessionToken = sessionStorage.getItem('token') || 
                           sessionStorage.getItem('authToken') || 
                           sessionStorage.getItem('accessToken') ||
                           sessionStorage.getItem('userToken');
        
        if (sessionToken) {
            console.log('从sessionStorage获取到token');
            return sessionToken;
        }
        
        // 方法3: 从cookie获取
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token' || name === 'authToken' || name === 'accessToken' || name === 'userToken') {
                console.log('从cookie获取到token');
                return value;
            }
        }
        
        // 方法4: 从页面元素获取（如果token显示在页面上）
        const tokenElements = document.querySelectorAll('[data-token], [class*="token"], [id*="token"]');
        for (const element of tokenElements) {
            const token = element.textContent || element.value || element.getAttribute('data-token');
            if (token && token.length > 50) { // 假设token长度大于50
                console.log('从页面元素获取到token');
                return token;
            }
        }
        
        console.log('未找到有效的token');
        return null;
        
    } catch (error) {
        console.error('提取token时出错:', error);
        return null;
    }
}
