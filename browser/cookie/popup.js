document.getElementById("copyCookie").addEventListener("click", async () => {
    const statusElement = document.getElementById("status");
    
    try {
        // 获取当前激活的标签页
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || tab.url.startsWith('chrome://')) {
            statusElement.innerText = "无法在此页面获取Cookie";
            return;
        }
        
        let cookies = await chrome.cookies.getAll({ url: tab.url });

        if (cookies.length === 0) {
            statusElement.innerText = "当前页面没有Cookie";
            return;
        }

        // 格式化 Cookie 数据
        let cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");

        // 复制到剪贴板 - 添加降级方案
        try {
            // 优先使用现代 Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(cookieString);
            } else {
                // 降级到传统方法
                await fallbackCopyToClipboard(cookieString);
            }
            
            statusElement.innerText = "Cookie 复制成功！";
        } catch (copyError) {
            console.error("复制失败:", copyError);
            statusElement.innerText = "复制失败，请重试";
        }
        
        // 2秒后清除状态消息
        setTimeout(() => {
            statusElement.innerText = "";
        }, 2000);
        
    } catch (error) {
        console.error("获取 Cookie 失败:", error);
        statusElement.innerText = "获取Cookie失败，请检查权限";
    }
});

// 传统复制方法的降级方案
function fallbackCopyToClipboard(text) {
    return new Promise((resolve, reject) => {
        try {
            // 创建临时文本区域
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                resolve();
            } else {
                reject(new Error('execCommand copy failed'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cookie复制插件弹窗已加载');
});
