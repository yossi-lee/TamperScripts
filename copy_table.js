// ==UserScript==
// @name         表格复制工具（网页内提示版）
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在网页表格添加复制按钮，支持复制整个表格或单独列到Excel，使用网页内提示
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        .table-tools-container {
            position: absolute;
            top: 5px;
            right: 5px;
            display: flex;
            gap: 5px;
            z-index: 1000;
        }
        
        .table-copy-btn, .column-copy-btn {
            width: 24px;
            height: 24px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.2s;
            background-size: 18px;
            background-position: center;
            background-repeat: no-repeat;
        }
        
        .table-copy-btn {
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23444444"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>');
        }
        
        .column-copy-btn {
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23444444"><path d="M10 18v-8h4v8h-4zm-6 0V6h4v12H4zm12 0V6h4v12h-4z"/></svg>');
            display: none;
        }
        
        .table-copy-btn:hover, .column-copy-btn:hover {
            opacity: 1;
            background-color: #f5f5f5;
        }
        
        .table-container {
            position: relative;
        }
        
        th:hover .column-copy-btn, td:hover .column-copy-btn {
            display: block;
        }
        
        .column-copy-btn {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 18px;
            height: 18px;
            background-size: 14px;
            border: none;
            opacity: 0;
        }
        
        th, td {
            position: relative;
        }
        
        th:hover .column-copy-btn, td:hover .column-copy-btn {
            opacity: 0.7;
        }
        
        th:hover .column-copy-btn:hover, td:hover .column-copy-btn:hover {
            opacity: 1;
        }
        
        /* 网页内提示样式 */
        .table-copy-notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .table-copy-notification.show {
            opacity: 1;
        }
        
        .table-copy-notification.error {
            background-color: rgba(214, 48, 49, 0.9);
        }
    `);

    // 创建网页内提示元素
    const notification = document.createElement('div');
    notification.className = 'table-copy-notification';
    document.body.appendChild(notification);

    // 显示网页内提示
    function showPageNotification(message, isError = false) {
        notification.textContent = message;
        notification.className = isError ? 
            'table-copy-notification show error' : 
            'table-copy-notification show';
        
        // 3秒后自动淡出
        clearTimeout(notification.timer);
        notification.timer = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 主函数：查找并处理所有表格
    function processTables() {
        const tables = document.querySelectorAll('table:not([data-copy-processed])');
        
        tables.forEach(table => {
            table.dataset.copyProcessed = 'true';
            
            // 创建容器包裹表格（用于定位按钮）
            const container = document.createElement('div');
            container.className = 'table-container';
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);
            
            // 添加工具按钮容器
            const toolsContainer = document.createElement('div');
            toolsContainer.className = 'table-tools-container';
            container.appendChild(toolsContainer);
            
            // 添加整表复制按钮
            const tableCopyBtn = document.createElement('button');
            tableCopyBtn.className = 'table-copy-btn';
            tableCopyBtn.title = '复制整个表格';
            toolsContainer.appendChild(tableCopyBtn);
            
            // 添加整表复制事件
            tableCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyTableToExcel(table);
            });
            
            // 为每列添加复制按钮
            addColumnCopyButtons(table);
        });
    }

    // 为表格每列添加复制按钮
    function addColumnCopyButtons(table) {
        // 获取列数（以第一行的单元格数为准）
        const colCount = table.rows[0]?.cells?.length || 0;
        
        // 为每个表头单元格添加复制按钮
        if (table.rows[0]) {
            for (let i = 0; i < colCount; i++) {
                const headerCell = table.rows[0].cells[i];
                if (headerCell) {
                    addColumnCopyButton(headerCell, i, table);
                }
            }
        }
        
        // 为数据行单元格也添加按钮（可选）
        for (let row = 1; row < table.rows.length; row++) {
            for (let col = 0; col < colCount; col++) {
                const dataCell = table.rows[row].cells[col];
                if (dataCell) {
                    addColumnCopyButton(dataCell, col, table);
                }
            }
        }
    }

    // 为单个单元格添加列复制按钮
    function addColumnCopyButton(cell, columnIndex, table) {
        // 如果已经添加过按钮，跳过
        if (cell.querySelector('.column-copy-btn')) return;
        
        const columnCopyBtn = document.createElement('button');
        columnCopyBtn.className = 'column-copy-btn';
        columnCopyBtn.title = '复制此列';
        cell.appendChild(columnCopyBtn);
        
        columnCopyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyTableColumnToExcel(table, columnIndex);
        });
    }

    // 复制整个表格
    function copyTableToExcel(table) {
        let textToCopy = '';
        
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            const rowData = [];
            
            for (let j = 0; j < row.cells.length; j++) {
                rowData.push(row.cells[j].textContent.trim());
            }
            
            textToCopy += rowData.join('\t') + '\n';
        }
        
        copyToClipboard(textToCopy.trim(), '表格内容已复制，可粘贴到Excel');
    }

    // 复制表格单列
    function copyTableColumnToExcel(table, columnIndex) {
        let textToCopy = '';
        
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            if (row.cells[columnIndex]) {
                textToCopy += row.cells[columnIndex].textContent.trim() + '\n';
            }
        }
        
        copyToClipboard(textToCopy.trim(), '列内容已复制，可粘贴到Excel');
    }

    // 通用复制到剪贴板函数
    function copyToClipboard(text, successMessage) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showPageNotification(successMessage);
            })
            .catch(err => {
                console.error('复制失败:', err);
                showPageNotification('复制失败，请重试', true);
                // 降级方案：使用textarea和execCommand
                fallbackCopyToClipboard(text, successMessage);
            });
    }

    // 降级复制方案
    function fallbackCopyToClipboard(text, successMessage) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showPageNotification(successMessage);
            } else {
                throw new Error('复制命令执行失败');
            }
        } catch (err) {
            console.error('降级复制失败:', err);
            showPageNotification('复制失败，请手动选择内容复制', true);
        } finally {
            document.body.removeChild(textarea);
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
