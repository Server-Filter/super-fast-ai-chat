document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.querySelector('.chat-container');
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsPanel = document.querySelector('.settings-panel');
    const settingsClose = document.querySelector('.settings-close');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const welcomeScreen = document.querySelector('.welcome-screen');
    
    let isProcessing = false;

    // Settings Panel
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('open');
    });

    settingsClose.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
    });

    // Model Selection
    modelSelect.addEventListener('click', () => {
        modelSelect.classList.toggle('active');
    });

    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', () => {
            currentModel = option.dataset.model;
            selectedModelSpan.textContent = currentModel;
            modelSelect.classList.remove('active');
        });
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Handle suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.textContent;
            sendMessage();
        });
    });

    // Send message on Enter (without Shift)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    function addMessage(content, isUser = false) {
        if (welcomeScreen) {
            welcomeScreen.remove();
        }

        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user-message' : ''}`;
        
        message.innerHTML = `
            <div class="avatar ${isUser ? 'user-avatar' : ''}">
                <svg viewBox="0 0 24 24">
                    <path d="${isUser ? 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' : 'M20 12a8 8 0 0 0-8-8A8 8 0 0 0 4 12a8 8 0 0 0 8 8 8 8 0 0 0 8-8m2 0A10 10 0 0 1 12 22 10 10 0 0 1 2 12 10 10 0 0 1 12 2a10 10 0 0 1 10 10M6.94 14.24c-.6.45-.6 1.07 0 1.52.6.45 1.57.45 2.17 0 .6-.45.6-1.07 0-1.52-.6-.45-1.57-.45-2.17 0m8.83 0c-.6.45-.6 1.07 0 1.52.6.45 1.57.45 2.17 0 .6-.45.6-1.07 0-1.52-.6-.45-1.57-.45-2.17 0M12 17.25c2.69 0 3.88-1.69 3.88-1.69l-1.88-1.06c0 .7-1.37 1.06-2 1.06-.64 0-2-.36-2-1.06l-1.88 1.06s1.19 1.69 3.88 1.69z'}"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${isUser ? 'You' : 'AI'}</span>
                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="message-text">${content}</div>
            </div>
        `;

        chatMessages.appendChild(message);
        message.scrollIntoView({ behavior: 'smooth' });
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isProcessing) return;

        isProcessing = true;
        addMessage(message, true);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        const apiUrl = document.getElementById('apiUrl').value;
        const thinking = addThinkingIndicator();

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: currentModel,
                    prompt: message,
                    stream: false
                })
            });

            const data = await response.json();
            thinking.remove();
            addMessage(data.response);
        } catch (error) {
            thinking.remove();
            addMessage('Sorry, there was an error processing your request. Please make sure Ollama is running and try again.');
        }

        isProcessing = false;
    }

    function addThinkingIndicator() {
        const thinking = document.createElement('div');
        thinking.className = 'message';
        thinking.innerHTML = `
            <div class="avatar">
                <svg viewBox="0 0 24 24">
                    <path d="M20 12a8 8 0 0 0-8-8A8 8 0 0 0 4 12a8 8 0 0 0 8 8 8 8 0 0 0 8-8m2 0A10 10 0 0 1 12 22 10 10 0 0 1 2 12 10 10 0 0 1 12 2a10 10 0 0 1 10 10"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="thinking">
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(thinking);
        thinking.scrollIntoView({ behavior: 'smooth' });
        return thinking;
    }
});