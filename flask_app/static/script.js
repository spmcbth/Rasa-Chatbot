document.addEventListener('DOMContentLoaded', function() {
    // Tạo ID người dùng ngẫu nhiên nếu chưa có
    let userId = localStorage.getItem('chatbot_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('chatbot_user_id', userId);
    }

    // Lấy ID cuộc hội thoại hiện tại, nếu chưa có thì tạo mới
    let conversationId = localStorage.getItem('current_conversation_id');
    if (!conversationId) {
        conversationId = 'conv_' + Date.now();
        localStorage.setItem('current_conversation_id', conversationId);
    }

    const chatMessages = document.getElementById('chat-messages'); 
    const userInput = document.getElementById('user-input'); 
    const sendButton = document.getElementById('send-button'); 
    const newChatButton = document.getElementById('new-chat-button');

    userInput.focus();

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    newChatButton.addEventListener('click', startNewChat);

    // Hàm gửi tin nhắn
    function sendMessage() {
        const message = userInput.value.trim();
        if (message.length === 0) return; 

        addMessage(message, 'user');
        userInput.value = ''; 

        // Hiệu ứng "đang nhập..."
        showTypingIndicator();

        // Gửi tin nhắn đến server
        fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                user_id: userId,
                conversation_id: conversationId
            }),
        })
        .then(response => response.json())
        .then(data => {
            removeTypingIndicator();
            addMessage(data.response, 'bot');
        })
        .catch(error => {
            console.error('Lỗi:', error);
            removeTypingIndicator();
            addMessage('Có lỗi xảy ra khi xử lý tin nhắn của bạn.', 'bot');
        });
    }

    // Hiển thị tin nhắn trên giao diện
    function addMessage(text, sender) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message';

        if (sender === 'user') {
            const messageElement = document.createElement('div');
            messageElement.className = 'user-message';
            messageElement.textContent = text;
            messageContainer.appendChild(messageElement);
        } else {
            const botMessageContainer = document.createElement('div');
            botMessageContainer.className = 'bot-message-container';
            
            const botIcon = document.createElement('div');
            botIcon.className = 'bot-icon';
            
            const botIconImg = document.createElement('img');
            botIconImg.src = '../static/images/chatbot.png';
            botIconImg.alt = 'Chatbot';
            botIconImg.className = 'bot-icon-img';
            
            botIcon.appendChild(botIconImg);
            
            const messageElement = document.createElement('div');
            messageElement.className = 'bot-message';
            messageElement.textContent = text;
            
            botMessageContainer.appendChild(botIcon);
            botMessageContainer.appendChild(messageElement);
            messageContainer.appendChild(botMessageContainer);
        }

        chatMessages.appendChild(messageContainer);

        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        userInput.focus();
    }

    // Hiệu ứng typing cho chatbot
    function showTypingIndicator() {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message typing-indicator-container';
        messageContainer.id = 'typing-indicator';
    
        const botMessageContainer = document.createElement('div');
        botMessageContainer.className = 'bot-message-container';
        
        const botIcon = document.createElement('div');
        botIcon.className = 'bot-icon';
        
        const botIconImg = document.createElement('img');
        botIconImg.src = '../static/images/chatbot.png';
        botIconImg.alt = 'Chatbot';
        botIconImg.className = 'bot-icon-img';
        
        botIcon.appendChild(botIconImg);
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'bot-message typing-indicator';
    
        for (let i = 0; i < 3; i++) {
            let dot = document.createElement('span');
            dot.className = 'dot';
            typingIndicator.appendChild(dot);
        }
    
        botMessageContainer.appendChild(botIcon);
        botMessageContainer.appendChild(typingIndicator);
        messageContainer.appendChild(botMessageContainer);
        
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Xóa hiệu ứng typing
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function startNewChat() {
        conversationId = 'conv_' + Date.now();
        localStorage.setItem('current_conversation_id', conversationId);

        chatMessages.innerHTML = '';
        
        addMessage('Xin chào! Mình là chatbot hỗ trợ giải đáp quy chế học vụ. Bạn cần giúp gì?', 'bot');
        
        userInput.focus();
    }
});
