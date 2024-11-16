// ==UserScript==
// @name         Kimi预览插件
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  预览kimi中的HTML代码
// @author       YouXing
// @match        https://kimi.moonshot.cn/**
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建悬浮按钮
    const floatButton = document.createElement('button');
    floatButton.innerHTML = '👁️'; // 小眼睛emoji
    floatButton.style.position = 'fixed';
    floatButton.style.bottom = '20px';
    floatButton.style.right = '20px';
    floatButton.style.zIndex = '9999';
    floatButton.style.padding = '10px';
    floatButton.style.borderRadius = '50%';
    floatButton.style.backgroundColor = '#4CAF50';
    floatButton.style.color = 'white';
    floatButton.style.border = 'none';
    floatButton.style.cursor = 'pointer';
    floatButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    floatButton.style.fontSize = '12px';
    floatButton.style.outline = 'none';
    floatButton.style.transition = 'background-color 0.3s';
    document.body.appendChild(floatButton);

    // 鼠标悬停效果
    floatButton.onmouseenter = function() {
        floatButton.style.backgroundColor = '#45a049';
    };
    floatButton.onmouseleave = function() {
        floatButton.style.backgroundColor = '#4CAF50';
    };

    // 创建悬浮div
    const resizableDiv = document.createElement('div');
    resizableDiv.style.position = 'fixed';
    resizableDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    resizableDiv.style.border = '1px solid #ccc';
    resizableDiv.style.padding = '10px';
    resizableDiv.style.bottom = '60px';
    resizableDiv.style.right = '20px';
    resizableDiv.style.width = '350px';
    resizableDiv.style.height = '600px';
    resizableDiv.style.zIndex = '9998';
    resizableDiv.style.display = 'none'; // 初始隐藏
    resizableDiv.style.borderRadius = '5px';
    resizableDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    const ife = document.createElement('iframe');
    ife.style.width = '100%';
    ife.style.height = '100%';
    ife.style.border = 'none';
    resizableDiv.appendChild(ife);
    document.body.appendChild(resizableDiv);

    // 创建拖动手柄
    const resizeHandle = document.createElement('div');
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.top = '0';
    resizeHandle.style.left = '0';
    resizeHandle.style.width = '15px';
    resizeHandle.style.height = '15px';
    resizeHandle.style.cursor = 'nw-resize';
    resizeHandle.style.borderRadius = '3px';
    resizableDiv.appendChild(resizeHandle);

    // 显示/隐藏div
    floatButton.onclick = function() {
        resizableDiv.style.display = resizableDiv.style.display === 'none' ? 'block' : 'none';
        let nodes = document.querySelectorAll('pre.language-html')
        let content = nodes[nodes.length-1].textContent
        ife.srcdoc = content
        console.log(content)
    };

    // 使div可调整大小
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    resizeHandle.onmousedown = function(e) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = resizableDiv.offsetWidth;
        startHeight = resizableDiv.offsetHeight;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    function onMouseMove(e) {
        if (isResizing) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            resizableDiv.style.width = Math.max(50, startWidth - dx) + 'px'; // 防止宽度小于50px
            resizableDiv.style.height = Math.max(50, startHeight - dy) + 'px'; // 防止高度小于50px
        }
    }

    function onMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
})();
