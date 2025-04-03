document.addEventListener("DOMContentLoaded", function () {
    // Tạo ID người dùng ngẫu nhiên nếu chưa có
    let userId = localStorage.getItem("chatbot_user_id");
    if (!userId) {
        userId = "user_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("chatbot_user_id", userId);
    }

    // Lấy hoặc tạo ID cuộc hội thoại
    let conversationId = localStorage.getItem("current_conversation_id");
    if (!conversationId) {
        conversationId = "conv_" + Date.now();
        localStorage.setItem("current_conversation_id", conversationId);
    }

    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const newChatButton = document.getElementById("new-chat-button");

    userInput.focus();

    // Tải lại hội thoại khi reload
    loadChatHistory();

    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMessage();
    });

    newChatButton.addEventListener("click", startNewChat);

    // Gửi tin nhắn
    function sendMessage() {
        const message = userInput.value.trim();
        if (message.length === 0) return;

        addMessage(message, "user");
        saveChatHistory(); // Lưu lịch sử hội thoại
        userInput.value = "";

        showTypingIndicator();

        // Gửi tin nhắn đến server
        fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, user_id: userId, conversation_id: conversationId }),
        })
            .then((response) => response.json())
            .then((data) => {
                removeTypingIndicator();
                addMessage(data.response, "bot");
                saveChatHistory();
            })
            .catch((error) => {
                console.error("Lỗi:", error);
                removeTypingIndicator();
                addMessage("Có lỗi xảy ra khi xử lý tin nhắn của bạn.", "bot");
                saveChatHistory();
            });
    }

    // Thêm tin nhắn vào giao diện
    function addMessage(text, sender) {
        const messageContainer = document.createElement("div");
        messageContainer.className = "message";

        if (sender === "user") {
            const messageElement = document.createElement("div");
            messageElement.className = "user-message";
            messageElement.textContent = text;
            messageContainer.appendChild(messageElement);
        } else {
            const botMessageContainer = document.createElement("div");
            botMessageContainer.className = "bot-message-container";

            const botIcon = document.createElement("div");
            botIcon.className = "bot-icon";
            const botIconImg = document.createElement("img");
            botIconImg.src = "../static/images/chatbot.png";
            botIconImg.alt = "Chatbot";
            botIconImg.className = "bot-icon-img";
            botIcon.appendChild(botIconImg);

            const messageElement = document.createElement("div");
            messageElement.className = "bot-message";
            messageElement.textContent = text;

            botMessageContainer.appendChild(botIcon);
            botMessageContainer.appendChild(messageElement);
            messageContainer.appendChild(botMessageContainer);
        }

        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        userInput.focus();
    }

    // Hiệu ứng typing
    function showTypingIndicator() {
        const messageContainer = document.createElement("div");
        messageContainer.className = "message typing-indicator-container";
        messageContainer.id = "typing-indicator";

        const botMessageContainer = document.createElement("div");
        botMessageContainer.className = "bot-message-container";

        const botIcon = document.createElement("div");
        botIcon.className = "bot-icon";
        const botIconImg = document.createElement("img");
        botIconImg.src = "../static/images/chatbot.png";
        botIconImg.alt = "Chatbot";
        botIconImg.className = "bot-icon-img";
        botIcon.appendChild(botIconImg);

        const typingIndicator = document.createElement("div");
        typingIndicator.className = "bot-message typing-indicator";
        for (let i = 0; i < 3; i++) {
            let dot = document.createElement("span");
            dot.className = "dot";
            typingIndicator.appendChild(dot);
        }

        botMessageContainer.appendChild(botIcon);
        botMessageContainer.appendChild(typingIndicator);
        messageContainer.appendChild(botMessageContainer);

        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) typingIndicator.remove();
    }

    // Lưu tin nhắn vào LocalStorage
    function saveChatHistory() {
        localStorage.setItem("chat_history_" + conversationId, chatMessages.innerHTML);
    }

    // Load hội thoại từ LocalStorage
    function loadChatHistory() {
        const savedChat = localStorage.getItem("chat_history_" + conversationId);
        if (savedChat) {
            chatMessages.innerHTML = savedChat;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Bắt đầu cuộc hội thoại mới (Xóa lịch sử)
    function startNewChat() {
        conversationId = "conv_" + Date.now();
        localStorage.setItem("current_conversation_id", conversationId);

        chatMessages.innerHTML = "";
        addMessage("Xin chào! Mình là chatbot hỗ trợ. Bạn cần giúp gì?", "bot");
        saveChatHistory();
    }
});
