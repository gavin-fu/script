// 后台脚本 - 处理插件的后台逻辑
let capturedToken = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log('牙科预约助手插件已安装');
});

// 监听网络请求以捕获token
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        console.log('拦截到网络请求:', details.url);
        
        // 检查是否是目标网站的请求
        if (details.url.includes('uenjoydental.com')) {
            // 查找请求头中的token
            const tokenHeader = details.requestHeaders.find(header => 
                header.name.toLowerCase() === 'token' ||
                header.name.toLowerCase() === 'authorization' ||
                header.name.toLowerCase() === 'x-auth-token' ||
                header.name.toLowerCase() === 'x-access-token'
            );
            
            if (tokenHeader && tokenHeader.value && tokenHeader.value.length > 20) {
                console.log('从请求头中捕获到token:', tokenHeader.name, tokenHeader.value.substring(0, 50) + '...');
                capturedToken = tokenHeader.value.replace('Bearer ', '');
                
                // 保存到storage
                chrome.storage.local.set({capturedToken: capturedToken}, () => {
                    console.log('Token已保存到storage');
                });
                
                // 通知content script
                chrome.tabs.query({url: '*://*.uenjoydental.com/*'}, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'tokenCaptured',
                            token: capturedToken
                        }).catch(() => {
                            // content script可能还没有加载，忽略错误
                        });
                    });
                });
            }
        }
        
        return {requestHeaders: details.requestHeaders};
    },
    {urls: ["*://*.uenjoydental.com/*"]},
    ["requestHeaders"]
);

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTabInfo') {
        // 获取当前标签页信息
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            sendResponse({tab: tabs[0]});
        });
        return true; // 保持消息通道开放
    }
    
    if (request.action === 'getCapturedToken') {
        // 获取已捕获的token
        sendResponse({success: true, token: capturedToken});
        return true;
    }
    
    if (request.action === 'clearCapturedToken') {
        // 清理已捕获的token
        capturedToken = null;
        chrome.storage.local.remove('capturedToken', () => {
            console.log('Token已从storage中清理');
        });
        sendResponse({success: true, message: 'Token已清理'});
        return true;
    }
});
