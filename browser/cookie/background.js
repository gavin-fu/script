// 插件安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    // 创建右键菜单项
    chrome.contextMenus.create({
        id: "copyCookies",
        title: "Copy Cookie",
        contexts: ["all"]
    });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "copyCookies") {
        try {
            // 获取当前网站的 Cookie
            const cookies = await chrome.cookies.getAll({ url: tab.url });
            
            if (cookies.length === 0) {
                // 如果没有cookie，显示提示
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: showMessage,
                    args: ["当前页面没有Cookie"]
                });
                return;
            }
            
            // 格式化cookie字符串
            const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            
            // 复制到剪贴板
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: async (text) => {
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
                                        console.log("Cookie已复制到剪贴板（传统方法）");
                                        resolve({ success: true, method: 'fallback' });
                                    } else {
                                        reject(new Error('execCommand copy failed'));
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        }
                        
                        try {
                            // 优先使用现代 Clipboard API
                            if (navigator.clipboard && window.isSecureContext) {
                                await navigator.clipboard.writeText(text);
                                console.log("Cookie已复制到剪贴板");
                                return { success: true, method: 'clipboard-api' };
                            } else {
                                // 降级到传统方法
                                return await fallbackCopyToClipboard(text);
                            }
                        } catch (error) {
                            console.error('复制失败:', error);
                            throw error;
                        }
                    },
                    args: [cookieString]
                });
                
                // 显示成功消息
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: showMessage,
                    args: ["Cookie复制成功！\n\n" + cookieString]
                });
            } catch (copyError) {
                console.error("复制操作失败:", copyError);
                // 显示失败消息
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: showMessage,
                    args: ["Cookie复制失败，请重试"]
                });
            }
            
        } catch (error) {
            console.error("获取 Cookie 失败: ", error);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: showMessage,
                args: ["Cookie复制失败: " + error.message]
            });
        }
    }
});

// 复制到剪贴板的函数
function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        try {
            // 优先使用现代 Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        console.log("Cookie已复制到剪贴板");
                        resolve({ success: true, method: 'clipboard-api' });
                    })
                    .catch((error) => {
                        console.error("复制失败：", error);
                        reject(error);
                    });
            } else {
                // 降级到传统方法
                fallbackCopyToClipboard(text)
                    .then(() => {
                        console.log("Cookie已复制到剪贴板（传统方法）");
                        resolve({ success: true, method: 'fallback' });
                    })
                    .catch((error) => {
                        console.error("复制失败：", error);
                        reject(error);
                    });
            }
        } catch (error) {
            console.error('复制失败:', error);
            reject(error);
        }
    });
}

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

// 显示消息的函数
function showMessage(message) {
    // 创建临时提示元素
    const notification = document.createElement('div');
    
    // 检查是否包含Cookie信息（长文本）
    const isLongMessage = message.includes('Cookie复制成功！\n\n');
    
    if (isLongMessage) {
        // 对于包含Cookie信息的消息，使用可滚动的容器
        const cookieInfo = message.replace('Cookie复制成功！\n\n', '');
        notification.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #4CAF50;">Cookie复制成功！</div>
            <div style="max-height: 200px; overflow-y: auto; font-size: 11px; line-height: 1.3; word-break: break-all; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px;">
                ${cookieInfo}
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 15px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            max-width: 400px;
            max-height: 300px;
            overflow: hidden;
        `;
        
        // 长消息显示更长时间
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    } else {
        // 短消息使用原来的样式
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        // 短消息显示3秒
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    document.body.appendChild(notification);
}
