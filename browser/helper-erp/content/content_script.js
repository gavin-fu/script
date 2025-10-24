// 从页面提取特定数据
function extractData() {
    // 这里可以根据实际需求修改选择器
    const dataElements = document.querySelectorAll('.data-to-copy');
    const data = Array.from(dataElements).map(el => el.textContent.trim()).join('\n');
    
    return data || '未找到可提取的数据';
  }
  
  // 监听来自后台脚本的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
      const data = extractData();
      sendResponse({data: data});
    }
    return true; // 保持消息通道开放以支持异步响应
  });