document.addEventListener('DOMContentLoaded', function() {
    // Lấy các phần tử giao diện
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Hàm thêm tin nhắn vào giao diện
    function addMessage(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const messageContent = document.createElement('div');
        messageContent.className = isUser ? 'user-message' : 'bot-message';
        messageContent.textContent = message;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Cuộn xuống để hiển thị tin nhắn mới nhất
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hàm gửi tin nhắn
    function sendMessage() {
        const message = userInput.value.trim();
        
        if (message) {
            // Hiển thị tin nhắn của người dùng
            addMessage(message, true);
            
            // Gửi tin nhắn đến server và nhận phản hồi
            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            })
            .then(response => response.json())
            .then(data => addMessage(data.response, false)) // Hiển thị phản hồi từ bot
            .catch(error => {
                console.error('Error:', error);
                addMessage('Đã xảy ra lỗi khi kết nối với server.', false);
            });
            
            // Xóa nội dung nhập sau khi gửi
            userInput.value = '';
        }
    }

    // Gửi tin nhắn khi click nút gửi
    sendButton.addEventListener('click', sendMessage);
    
    // Gửi tin nhắn khi nhấn Enter
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
});