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
    function renderSuggestionChips() {
        const suggestionsContainer = document.querySelector('.suggestion-chips');
        suggestionsContainer.innerHTML = '';
        
        const selectedPrompts = getRandomPrompts();
        selectedPrompts.forEach(prompt => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = prompt;
            chip.addEventListener('click', () => {
                chatInput.value = prompt;
                sendMessage();
            });
            suggestionsContainer.appendChild(chip);
        });
    }

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
                    <path d="${isUser ? 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' : 'M20 12a8 8 0 0 0-8-8A8 8 0 0 0 4 12a8 8 0 0 0 8 8 8 8 0 0 0 8-8m2 0A10 10 0 0 1 12 22 10 10 0 0 1 2 12 10 10 0 0 1 12 2a10 10 0 0 1 10 10'}"/>
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

        const thinking = addThinkingIndicator();

        try {
            console.log('Sending request to API...');
            console.log('Message:', message);
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: message
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            thinking.remove();
            addMessage(data.response);
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            thinking.remove();
            addMessage('Error: Could not get a response. Please try again.');
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

    // Add this function to select random prompts
    function getRandomPrompts(count = 3) {
        const shuffled = [...suggestionPrompts].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // Function to render suggestion chips
    function renderSuggestionChips() {
        const suggestionsContainer = document.querySelector('.suggestion-chips');
        suggestionsContainer.innerHTML = ''; // Clear existing chips
        
        const selectedPrompts = getRandomPrompts();
        selectedPrompts.forEach(prompt => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = prompt;
            chip.addEventListener('click', () => {
                chatInput.value = prompt;
                sendMessage();
            });
            suggestionsContainer.appendChild(chip);
        });
    }

    // Render initial suggestions
    renderSuggestionChips();

    // Remove the old suggestion chips event listeners since we're now adding them
    // when we create the chips
});