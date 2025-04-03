document.addEventListener('DOMContentLoaded', function() {
    // Tạo ID người dùng ngẫu nhiên nếu chưa có
    let userId = localStorage.getItem('chatbot_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('chatbot_user_id', userId);
    }

    // Lấy ID cuộc hội thoại hiện tại
    let conversationId = localStorage.getItem('current_conversation_id');
    if (!conversationId) {
        conversationId = 'conv_' + Date.now();
        localStorage.setItem('current_conversation_id', conversationId);
    }

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-button');

    // Event listener cho nút gửi
    sendButton.addEventListener('click', sendMessage);

    // Event listener cho phím Enter
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Event listener cho nút New Chat
    newChatButton.addEventListener('click', startNewChat);

    function sendMessage() {
        const message = userInput.value.trim();
        if (message.length === 0) return;

        // Hiển thị tin nhắn của người dùng
        addMessage(message, 'user');
        userInput.value = '';

        // Gửi tin nhắn đến server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                user_id: userId,
                conversation_id: conversationId
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Hiển thị phản hồi từ bot
            addMessage(data.response, 'bot');
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('Có lỗi xảy ra khi xử lý tin nhắn của bạn.', 'bot');
        });
    }

    function addMessage(text, sender) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message';

        const messageElement = document.createElement('div');
        messageElement.className = sender === 'user' ? 'user-message' : 'bot-message';
        messageElement.textContent = text;

        messageContainer.appendChild(messageElement);
        chatMessages.appendChild(messageContainer);

        // Cuộn xuống dưới cùng
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function startNewChat() {
        // Tạo conversation ID mới
        conversationId = 'conv_' + Date.now();
        localStorage.setItem('current_conversation_id', conversationId);

        // Xóa tin nhắn hiện tại trong giao diện
        chatMessages.innerHTML = '';
        
        // Thêm tin nhắn chào mừng mới
        addMessage('Xin chào! Mình là chatbot hỗ trợ giải đáp quy chế học vụ. Bạn cần giúp gì?', 'bot');
    }
});