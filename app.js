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

    // System prompt for thinking process
    const SYSTEM_PROMPT = `
    You are a helpful AI assistant. When you receive a question, first think about it and provide your thinking process in "think" tags.
    Example:
    Question: What is the capital of France?
    Answer: <think>
    The capital of France is Paris. Paris is known for the Eiffel Tower and is one of the largest cities in Europe.
    </think>
    The capital of France is Paris.

    Always keep your thoughts within these <think></think> tags and your final answer outside these tags.
    `;

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

    function formatThinkingBlock(text) {
        return text.split('\n').map(line => `> ${line}`).join('\n');
    }

    function addMessage(content, isUser = false, isThinking = false) {
        if (welcomeScreen) {
            welcomeScreen.remove();
        }

        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user-message' : ''}`;
        
        let formattedContent = content;
        if (isThinking) {
            formattedContent = formatThinkingBlock(content);
        }

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
                <div class="message-text">${formattedContent}</div>
            </div>
        `;

        chatMessages.appendChild(message);
        message.scrollIntoView({ behavior: 'smooth' });
        return message;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isProcessing) return;

        isProcessing = true;
        const userMessageElement = addMessage(message, true);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        const thinkingMessage = addMessage('🤔 Thinking...', false);

        try {
            console.log('Sending request to Ollama API...');
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: message,
                    system: SYSTEM_PROMPT,
                    stream: true
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const reader = response.body.getReader();
            let fullResponse = '';
            let thinkingPart = '';
            let finalAnswer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullResponse += data.response;
                            
                            const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
                            if (thinkMatch) {
                                thinkingPart = thinkMatch[1].trim();
                                finalAnswer = fullResponse.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                            } else {
                                finalAnswer = fullResponse;
                            }

                            // Update the thinking message
                            let displayContent = '';
                            if (thinkingPart) {
                                displayContent = `🧠 **Thinking Process:**\n${thinkingPart}\n\n`;
                            }
                            if (finalAnswer) {
                                displayContent += finalAnswer;
                            }

                            thinkingMessage.querySelector('.message-text').innerHTML = displayContent;
                            thinkingMessage.scrollIntoView({ behavior: 'smooth' });
                        }
                    } catch (error) {
                        console.error('Error parsing chunk:', error);
                    }
                }
            }

        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            thinkingMessage.querySelector('.message-text').textContent = 
                '⚠️ Error: Could not get a response. Please try again.';
        }

        isProcessing = false;
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