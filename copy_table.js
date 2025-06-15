// ==UserScript==
// @name         表格复制到Excel工具
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在网页表格右上角添加复制按钮，可将表格内容复制为Excel格式
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        .table-copy-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 24px;
            height: 24px;
            background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23444444"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>') no-repeat center;
            background-size: 18px;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
            z-index: 1000;
        }
        .table-copy-btn:hover {
            opacity: 1;
            background-color: #f5f5f5;
        }
        .table-container {
            position: relative;
        }
    `);

    // 主函数：查找并处理所有表格
    function processTables() {
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            // 如果已经处理过这个表格，跳过
            if (table.dataset.copyProcessed) return;
            table.dataset.copyProcessed = 'true';

            // 创建容器包裹表格（用于定位按钮）
            const container = document.createElement('div');
            container.className = 'table-container';
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);

            // 添加复制按钮
            const copyBtn = document.createElement('div');
            copyBtn.className = 'table-copy-btn';
            copyBtn.title = '复制表格到剪贴板';
            container.appendChild(copyBtn);

            // 添加点击事件
            copyBtn.addEventListener('click', () => {
                copyTableToExcel(table);
            });
        });
    }

    // 复制表格内容为Excel格式
    function copyTableToExcel(table) {
        let textToCopy = '';

        // 遍历所有行
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            const rowData = [];

            // 遍历所有单元格
            for (let j = 0; j < row.cells.length; j++) {
                rowData.push(row.cells[j].textContent.trim());
            }

            // 用制表符分隔单元格，换行符分隔行
            textToCopy += rowData.join('\t') + '\n';
        }

        // 使用Clipboard API复制文本
        navigator.clipboard.writeText(textToCopy.trim())
            .then(() => {
                showNotification('表格内容已复制，可粘贴到Excel中');
            })
            .catch(err => {
                console.error('复制失败:', err);
                showNotification('复制失败，请尝试手动选择表格内容复制', 'error');
            });
    }

    // 显示通知
    function showNotification(message, type = 'info') {
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                text: message,
                title: '表格复制工具',
                image: type === 'error' ? 'https://via.placeholder.com/48/ff0000/ffffff?text=!' : 'https://via.placeholder.com/48/00ff00/ffffff?text=✓'
            });
        } else {
            alert(message);
        }
    }

    // 初始处理页面中的表格
    processTables();

    // 使用MutationObserver监听DOM变化，处理动态加载的表格
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                processTables();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
