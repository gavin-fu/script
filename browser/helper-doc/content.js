// 内容脚本 - 在目标网页中运行
console.log('牙科预约助手内容脚本已加载');

// 存储从background script获取的token
let capturedToken = null;

// 监听来自popup和background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.action);
    
    if (request.action === 'getPageInfo') {
        // 获取页面信息
        const pageInfo = {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname
        };
        sendResponse(pageInfo);
        return true; // 保持消息通道开放
    }
    
    if (request.action === 'getToken') {
        // 获取已捕获的token
        try {
            const token = capturedToken || localStorage.getItem('capturedToken');
            console.log('Token获取结果:', token ? '成功' : '失败');
            sendResponse({success: true, token: token});
        } catch (error) {
            console.error('Token获取失败:', error);
            sendResponse({success: false, error: error.message});
        }
        return true; // 保持消息通道开放
    }
    
    if (request.action === 'tokenCaptured') {
        // 从background script接收到新捕获的token
        console.log('从background script接收到新token:', request.token ? request.token.substring(0, 50) + '...' : 'null');
        capturedToken = request.token;
        localStorage.setItem('capturedToken', request.token);
        
        // 更新页面状态显示
        updateTokenStatus('Token已更新');
        
        sendResponse({success: true});
        return true;
    }
    
    if (request.action === 'clearToken') {
        // 清理token
        try {
            capturedToken = null;
            localStorage.removeItem('capturedToken');
            console.log('Token已清理');
            sendResponse({success: true, message: 'Token已清理'});
        } catch (error) {
            console.error('Token清理失败:', error);
            sendResponse({success: false, error: error.message});
        }
        return true; // 保持消息通道开放
    }
    
    // 如果没有匹配的action，返回false
    return false;
});

// 在页面中提取token的函数
function extractTokenFromPage() {
    try {
        // 优先使用从请求头中捕获的token
        if (capturedToken) {
            console.log('使用从请求头中捕获的token');
            return capturedToken;
        }
        
        // 方法1: 从localStorage获取已捕获的token
        const capturedTokenFromStorage = localStorage.getItem('capturedToken');
        if (capturedTokenFromStorage) {
            console.log('从localStorage获取到已捕获的token');
            capturedToken = capturedTokenFromStorage;
            return capturedTokenFromStorage;
        }
        
        // 方法2: 从localStorage获取其他token
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



// 检测页面是否为目标网站
if (window.location.hostname === 'www.uenjoydental.com') {
    console.log('检测到目标网站，牙科预约助手已激活');
    console.log('开始监听XHR和Fetch请求以捕获Token...');
    
    // 设置请求拦截器
    setupXHRInterceptor();
    setupFetchInterceptor();
    
    // 在页面上显示监听状态
    const statusDiv = document.createElement('div');
    statusDiv.id = 'token-capture-status';
    statusDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    statusDiv.textContent = 'Token监听器已启动';
    document.body.appendChild(statusDiv);
    
    // 3秒后隐藏状态显示
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.parentNode.removeChild(statusDiv);
        }
    }, 3000);
    
    // 监听页面加载完成后的网络请求
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('页面加载完成，开始监听网络请求');
            // 延迟一段时间后尝试获取token，确保页面完全加载
            setTimeout(() => {
                console.log('尝试获取已捕获的token');
                if (capturedToken) {
                    console.log('已捕获到token:', capturedToken.substring(0, 50) + '...');
                }
                // 主动扫描页面中的token
                scanPageForToken();
            }, 2000);
        });
    } else {
        console.log('页面已加载完成，开始监听网络请求');
        // 延迟一段时间后尝试获取token
        setTimeout(() => {
            console.log('尝试获取已捕获的token');
            if (capturedToken) {
                console.log('已捕获到token:', capturedToken.substring(0, 50) + '...');
            }
            // 主动扫描页面中的token
            scanPageForToken();
        }, 2000);
    }
}

// 更新页面上的token状态显示
function updateTokenStatus(message) {
    let statusDiv = document.getElementById('token-capture-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'token-capture-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(statusDiv);
    }
    
    statusDiv.textContent = message;
    statusDiv.style.background = '#4CAF50';
    
    // 3秒后隐藏
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.parentNode.removeChild(statusDiv);
        }
    }, 3000);
}

// 主动扫描页面中的token
function scanPageForToken() {
    console.log('开始扫描页面中的token...');
    
    // 扫描所有script标签中的token
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.textContent) {
            const tokenMatch = script.textContent.match(/['"]token['"]\s*:\s*['"]([^'"]+)['"]/i);
            if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 20) {
                console.log('从script标签中捕获到token:', tokenMatch[1].substring(0, 50) + '...');
                capturedToken = tokenMatch[1];
            }
        }
    });
    
    // 扫描所有meta标签中的token
    const metas = document.querySelectorAll('meta[name*="token"], meta[property*="token"]');
    metas.forEach(meta => {
        const content = meta.getAttribute('content');
        if (content && content.length > 20) {
            console.log('从meta标签中捕获到token:', content.substring(0, 50) + '...');
            capturedToken = content;
        }
    });
    
    // 扫描所有data属性中的token
    const elementsWithToken = document.querySelectorAll('[data-token], [data-auth-token], [data-access-token]');
    elementsWithToken.forEach(element => {
        const token = element.getAttribute('data-token') || 
                     element.getAttribute('data-auth-token') || 
                     element.getAttribute('data-access-token');
        if (token && token.length > 20) {
            console.log('从data属性中捕获到token:', token.substring(0, 50) + '...');
            capturedToken = token;
        }
    });
    
    // 扫描全局变量中的token
    if (window.token && window.token.length > 20) {
        console.log('从全局变量中捕获到token:', window.token.substring(0, 50) + '...');
        capturedToken = window.token;
    }
    
    if (window.authToken && window.authToken.length > 20) {
        console.log('从全局变量中捕获到authToken:', window.authToken.substring(0, 50) + '...');
        capturedToken = window.authToken;
    }
    
    if (window.accessToken && window.accessToken.length > 20) {
        console.log('从全局变量中捕获到accessToken:', window.accessToken.substring(0, 50) + '...');
        capturedToken = window.accessToken;
    }
}
