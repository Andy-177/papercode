"manifest": {
    "name": "十六进制转换器",
    "packname": "com.papercode.hexconverter.v2",
    "description": "添加一个Hex按钮，用于将纸带二进制数据转换为十六进制值",
    "lib": [],
    "incompatible": []
}

// 插件主逻辑 - 修复了toggleHexViewer未定义的问题
(function() {
    // 等待页面完全加载后再执行
    function initWhenReady() {
        // 检查是否已有按钮，有则移除旧的
        const oldButton = document.getElementById('hex-button');
        if (oldButton) {
            oldButton.remove();
        }
        
        // 创建新按钮
        const hexButton = document.createElement('button');
        hexButton.id = 'hex-button';
        hexButton.className = 'control-button';
        hexButton.textContent = 'Hex';
        hexButton.title = '查看十六进制表示';
        
        // 强制设置按钮样式，确保显示在右侧
        hexButton.style.position = 'absolute';
        hexButton.style.right = '20px';
        hexButton.style.top = '90px'; // Bin按钮下方
        hexButton.style.width = '60px';
        hexButton.style.padding = '8px 0';
        hexButton.style.textAlign = 'center';
        hexButton.style.backgroundColor = '#333';
        hexButton.style.color = 'white';
        hexButton.style.border = 'none';
        hexButton.style.borderRadius = '4px';
        hexButton.style.cursor = 'pointer';
        hexButton.style.zIndex = '1000'; // 确保在最上层
        hexButton.style.display = 'block'; // 强制显示
        
        // 添加点击事件（直接使用函数引用，不依赖全局变量）
        hexButton.addEventListener('click', toggleHexViewer);
        
        // 直接添加到body
        document.body.appendChild(hexButton);
        
        // 验证按钮是否已添加
        setTimeout(() => {
            const addedButton = document.getElementById('hex-button');
            if (addedButton) {
                alert('Hex按钮已成功添加！请查看右侧。');
            } else {
                alert('Hex按钮添加失败，请检查控制台错误。');
            }
        }, 1000);

        // 创建十六进制查看器
        createHexViewer();
    }
    
    // 创建十六进制查看器
    function createHexViewer() {
        // 移除旧的查看器
        const oldViewer = document.getElementById('hex-viewer');
        if (oldViewer) {
            oldViewer.remove();
        }
        
        // 创建查看器容器
        const hexViewer = document.createElement('div');
        hexViewer.id = 'hex-viewer';
        hexViewer.className = 'viewer';
        
        // 查看器内容 - 移除onclick属性，后面会用JavaScript绑定事件
        hexViewer.innerHTML = `
            <div class="viewer-content">
                <h3>纸带十六进制表示</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">二进制数据转换后的十六进制值</p>
                <div id="hex-content" style="font-family: monospace; font-size: 16px; letter-spacing: 2px;"></div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 5px;">二进制原始数据:</p>
                    <div id="hex-original-binary" style="font-family: monospace; font-size: 14px; color: #555; word-break: break-all;"></div>
                </div>
            </div>
            <button class="close-button" id="hex-close-button">关闭</button>
        `;
        
        // 添加到页面
        document.body.appendChild(hexViewer);
        
        // 为关闭按钮绑定事件
        document.getElementById('hex-close-button').addEventListener('click', toggleHexViewer);
    }
    
    // 定义toggleHexViewer函数并暴露到全局
    window.toggleHexViewer = function() {
        const viewer = document.getElementById('hex-viewer');
        if (viewer.style.display === 'flex') {
            viewer.style.display = 'none';
        } else {
            viewer.style.display = 'flex';
            updateHexViewer();
        }
    };
    
    // 更新十六进制查看器内容
    function updateHexViewer() {
        // 直接使用应用中已有的函数获取二进制数据
        const binaryData = getTapeBinary();
        const hexContent = document.getElementById('hex-content');
        const originalBinary = document.getElementById('hex-original-binary');
        
        originalBinary.textContent = binaryData || '无有效二进制数据';
        
        if (!binaryData) {
            hexContent.textContent = '无法转换：没有有效二进制数据';
            return;
        }
        
        // 二进制转十六进制
        let paddedBinary = binaryData;
        const padding = (4 - (binaryData.length % 4)) % 4;
        if (padding > 0) {
            paddedBinary = '0'.repeat(padding) + binaryData;
        }
        
        let hexString = '';
        for (let i = 0; i < paddedBinary.length; i += 4) {
            const chunk = paddedBinary.substr(i, 4);
            const hex = parseInt(chunk, 2).toString(16).toUpperCase();
            hexString += hex + ' ';
        }
        
        hexContent.textContent = hexString.trim() + 
            (padding > 0 ? ` (补充了${padding}个前导0)` : '');
    }
    
    // 当页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
        initWhenReady();
    }
})();
