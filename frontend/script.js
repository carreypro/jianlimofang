/**
 * AI简历优化工具 - 前端交互脚本
 * 实现与后端API交互，发送简历文本并接收优化结果
 */

// 等待DOM完全加载后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const resumeInput = document.getElementById('resumeInput');
    const resumeOutput = document.getElementById('resumeOutput');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const clearInputBtn = document.getElementById('clearInput');
    const copyOutputBtn = document.getElementById('copyOutput');
    const navCopyBtn = document.getElementById('navCopyBtn'); // 添加导航栏复制按钮
    const notificationArea = document.getElementById('notificationArea');
    
    // 设置API端点 - Worker的URL
    const API_URL = 'https://resume-optimizer-api.nafiuriak.workers.dev/api/optimize';
    
    // 注释掉默认显示错误信息的行 - 生产环境下不需要
    // showErrorMessage('简历优化失败，请稍后再试');
    
    /**
     * 发送简历文本到API并处理响应
     */
    async function optimizeResume() {
        // 获取用户输入的简历文本
        const resumeText = resumeInput.value.trim();
        
        // 验证输入不为空
        if (!resumeText) {
            showNotification('请输入简历文本', 'error');
            return;
        }
        
        try {
            // 显示加载指示器
            loadingIndicator.style.display = 'flex';
            optimizeBtn.disabled = true;
            navCopyBtn.disabled = true; // 也禁用复制按钮
            
            // 发送API请求
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ resumeText })
            });
            
            // 解析响应
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '优化失败，请稍后重试');
            }
            
            const data = await response.json();
            
            // 显示优化后的简历
            resumeOutput.value = data.optimizedResume;
            showNotification('简历优化成功！', 'success');
            
            // 如果是移动设备，滚动到输出区域
            if (window.innerWidth <= 768) {
                document.querySelector('.output-section').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('优化简历时出错:', error);
            showNotification(error.message || '优化失败，请稍后重试', 'error');
        } finally {
            // 隐藏加载指示器
            loadingIndicator.style.display = 'none';
            optimizeBtn.disabled = false;
            navCopyBtn.disabled = false; // 重新启用复制按钮
        }
    }
    
    /**
     * 显示通知消息
     * @param {string} message - 通知消息内容
     * @param {string} type - 通知类型 ('success' 或 'error')
     */
    function showNotification(message, type) {
        // 移除任何现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 创建新通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 在主容器的顶部插入通知
        notificationArea.appendChild(notification);
        
        // 5秒后自动移除通知
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    /**
     * 直接显示错误消息
     * @param {string} message - 错误消息内容
     */
    function showErrorMessage(message) {
        // 创建错误通知元素
        const errorNotification = document.createElement('div');
        errorNotification.className = 'notification error';
        errorNotification.textContent = message;
        
        // 清空现有内容并添加新通知
        notificationArea.innerHTML = '';
        notificationArea.appendChild(errorNotification);
    }
    
    /**
     * 复制优化后的简历到剪贴板
     */
    function copyToClipboard() {
        const outputText = resumeOutput.value.trim();
        
        if (!outputText) {
            showNotification('没有可复制的内容', 'error');
            return;
        }
        
        // 复制到剪贴板
        navigator.clipboard.writeText(outputText)
            .then(() => {
                showNotification('已复制到剪贴板', 'success');
            })
            .catch(err => {
                console.error('复制失败:', err);
                showNotification('复制失败，请手动复制', 'error');
            });
    }
    
    /**
     * 清空输入框
     */
    function clearInput() {
        resumeInput.value = '';
        resumeInput.focus();
    }
    
    // 绑定事件监听器
    optimizeBtn.addEventListener('click', optimizeResume);
    clearInputBtn.addEventListener('click', clearInput);
    copyOutputBtn.addEventListener('click', copyToClipboard);
    navCopyBtn.addEventListener('click', copyToClipboard); // 为导航栏的复制按钮绑定事件
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter 优化简历
        if (e.ctrlKey && e.key === 'Enter' && document.activeElement === resumeInput) {
            optimizeResume();
        }
    });
});
