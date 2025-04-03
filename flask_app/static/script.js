document.addEventListener("DOMContentLoaded", function () {
    // Tạo ID người dùng ngẫu nhiên
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
    const favMessagesButton = document.getElementById("fav-messages");

    // Biến cờ để theo dõi hành động đang xử lý
    let isProcessingAction = false;

    // Tạo và thêm favorites panel vào DOM
    const favoritesPanel = document.createElement("div");
    favoritesPanel.className = "favorites-panel";
    favoritesPanel.id = "favorites-panel";
    favoritesPanel.innerHTML = `
        <div class="favorites-header">
            <h3>Đoạn hội thoại yêu thích</h3>
            <button id="close-favorites" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="favorites-list" id="favorites-list"></div>
    `;
    document.body.appendChild(favoritesPanel);

    favoritesPanel.addEventListener('transitionend', function() {
        isProcessingAction = false;
    });

    const closeFavoritesButton = document.getElementById("close-favorites");
    const favoritesList = document.getElementById("favorites-list");

    userInput.focus();

    // Tải lại hội thoại khi reload
    loadChatHistory();
    loadFavorites();

    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMessage();
    });

    newChatButton.addEventListener("click", startNewChat);
    favMessagesButton.addEventListener("click", toggleFavoritesPanel);
    closeFavoritesButton.addEventListener("click", closeFavoritesPanel);

    // Thêm các event listeners cho nút thích trong chat và xóa yêu thích
    document.addEventListener("click", function(e) {
        if (e.target && e.target.closest(".like-message-btn")) {
            e.preventDefault();
            
            // Nếu đang xử lý, bỏ qua click
            if (isProcessingAction) return;
            isProcessingAction = true;
            
            const messageContainer = e.target.closest(".message");
            addToFavorites(messageContainer);
            
            // Đặt lại cờ sau khi xử lý
            setTimeout(() => {
                isProcessingAction = false;
            }, 300);
        }
        
        if (e.target && e.target.closest(".delete-favorite")) {
            e.preventDefault();
            
            // Nếu đang xử lý, bỏ qua click
            if (isProcessingAction) return;
            isProcessingAction = true;
            
            const favoriteItem = e.target.closest(".favorite-item");
            const favoriteId = favoriteItem.getAttribute("data-id");
                        
            removeFavorite(favoriteId);

            isProcessingAction = false;
        }
    });

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
        const timestamp = new Date().toLocaleString();
        messageContainer.setAttribute("data-timestamp", timestamp);
        messageContainer.setAttribute("data-message-id", "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9));

        if (sender === "user") {
            const messageElement = document.createElement("div");
            messageElement.className = "user-message-container";
            
            const messageContent = document.createElement("div");
            messageContent.className = "user-message";
            messageContent.textContent = text;
            
            const likeButton = document.createElement("button");
            likeButton.className = "like-message-btn user-like-btn";
            likeButton.innerHTML = '<i class="far fa-heart"></i>';
            likeButton.title = "Thêm vào yêu thích";
            
            messageElement.appendChild(messageContent);
            messageElement.appendChild(likeButton);
            messageContainer.appendChild(messageElement);
        } 
        else {
            const botMessageContainer = document.createElement("div");
            botMessageContainer.className = "bot-message-container";

            const botIcon = document.createElement("div");
            botIcon.className = "bot-icon";
            const botIconImg = document.createElement("img");
            botIconImg.src = "../static/images/chatbot.png";
            botIconImg.alt = "Chatbot";
            botIconImg.className = "bot-icon-img";
            botIcon.appendChild(botIconImg);

            const messageWrapper = document.createElement("div");
            messageWrapper.className = "bot-message-wrapper";
            
            const messageElement = document.createElement("div");
            messageElement.className = "bot-message";
            messageElement.textContent = text;
            
            const likeButton = document.createElement("button");
            likeButton.className = "like-message-btn bot-like-btn";
            likeButton.innerHTML = '<i class="far fa-heart"></i>';
            likeButton.title = "Thêm vào yêu thích";
            
            messageWrapper.appendChild(messageElement);
            messageWrapper.appendChild(likeButton);
            
            botMessageContainer.appendChild(botIcon);
            botMessageContainer.appendChild(messageWrapper);
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

    // New chat
    function startNewChat() {
        conversationId = "conv_" + Date.now();
        localStorage.setItem("current_conversation_id", conversationId);

        chatMessages.innerHTML = "";
        addMessage("Xin chào! Mình là chatbot hỗ trợ giải đáp quy chế học vụ. Bạn cần giúp gì?", "bot");
        saveChatHistory();
    }

    // Thêm tin nhắn vào yêu thích
    function addToFavorites(messageContainer) {
        const favorites = getFavoritesFromStorage();
        const timestamp = messageContainer.getAttribute("data-timestamp") || new Date().toLocaleString();
        const messageId = messageContainer.getAttribute("data-message-id") || "msg_" + Date.now();
        
        // Kiểm tra xem tin nhắn đã được yêu thích chưa
        const existingIndex = favorites.findIndex(fav => fav.messageId === messageId);
        if (existingIndex !== -1) {
            // Nếu đã yêu thích, xóa và hiển thị thông báo đã bỏ yêu thích
            favorites.splice(existingIndex, 1);
            localStorage.setItem("chat_favorites", JSON.stringify(favorites));
            updateFavoritesList();
            showNotification("Đã bỏ yêu thích!");
            return;
        }
        
        // Tạo ID duy nhất cho mục yêu thích
        const favoriteId = "fav_" + Date.now();
        
        // Tạo đối tượng yêu thích mới
        const favorite = {
            id: favoriteId,
            messageId: messageId,
            content: messageContainer.innerHTML,
            timestamp: timestamp,
            date: new Date().toLocaleString()
        };
        
        // Thêm vào mảng yêu thích
        favorites.push(favorite);
        
        // Lưu lại vào LocalStorage
        localStorage.setItem("chat_favorites", JSON.stringify(favorites));
        
        // Cập nhật giao diện yêu thích
        updateFavoritesList();
        
        // Hiển thị thông báo
        showNotification("Đã thêm vào yêu thích!");
    }

    // Lấy danh sách yêu thích từ localStorage
    function getFavoritesFromStorage() {
        const favoritesJson = localStorage.getItem("chat_favorites");
        return favoritesJson ? JSON.parse(favoritesJson) : [];
    }

    // Cập nhật danh sách yêu thích
    function updateFavoritesList() {
        const favorites = getFavoritesFromStorage();
        favoritesList.innerHTML = "";
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = "<p class='no-favorites'>Chưa có đoạn hội thoại nào được yêu thích</p>";
            return;
        }
        
        // Sắp xếp theo thời gian - mới nhất lên đầu
        favorites.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        favorites.forEach(favorite => {
            const favoriteItem = document.createElement("div");
            favoriteItem.className = "favorite-item";
            favoriteItem.setAttribute("data-id", favorite.id);
            
            const favoriteHeader = document.createElement("div");
            favoriteHeader.className = "favorite-header";
            
            const favoriteDate = document.createElement("span");
            favoriteDate.className = "favorite-date";
            favoriteDate.textContent = favorite.date;
            
            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-favorite";
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = "Xóa khỏi yêu thích";
            
            favoriteHeader.appendChild(favoriteDate);
            favoriteHeader.appendChild(deleteButton);
            
            const favoriteContent = document.createElement("div");
            favoriteContent.className = "favorite-content";
            favoriteContent.innerHTML = favorite.content;
            
            favoriteItem.appendChild(favoriteHeader);
            favoriteItem.appendChild(favoriteContent);
            
            favoritesList.appendChild(favoriteItem);
        });
    }

    // Hiển thị danh sách yêu thích
    function loadFavorites() {
        updateFavoritesList();
    }

    // Xóa mục yêu thích
    function removeFavorite(favoriteId) {
        let favorites = getFavoritesFromStorage();
        favorites = favorites.filter(fav => fav.id !== favoriteId);
        localStorage.setItem("chat_favorites", JSON.stringify(favorites));
        updateFavoritesList();
        showNotification("Đã xóa khỏi yêu thích!");
    }

    // Hiển thị/ẩn bảng yêu thích
    function toggleFavoritesPanel() {
        if (isProcessingAction) return;
        isProcessingAction = true;
        
        const panel = document.getElementById("favorites-panel");
        const isVisible = panel.classList.contains("show");
        
        if (isVisible) {
            panel.classList.remove("show");
        } else {
            updateFavoritesList();
            panel.classList.add("show");
        }
    }

    // Đóng bảng yêu thích
    function closeFavoritesPanel() {
        if (isProcessingAction) return;
        isProcessingAction = true;
        
        const panel = document.getElementById("favorites-panel");
        panel.classList.remove("show");
    }

    // Hiển thị thông báo
    function showNotification(message) {
        // Kiểm tra xem đã có thông báo hiện tại chưa
        let notification = document.getElementById("toast-notification");
        
        // Nếu đã có, xóa nó để hiển thị thông báo mới
        if (notification) {
            notification.remove();
        }
        
        // Tạo thông báo mới
        notification = document.createElement("div");
        notification.id = "toast-notification";
        notification.className = "toast-notification";
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Hiển thị thông báo
        setTimeout(() => {
            notification.classList.add("show");
        }, 10);
        
        // Tự động ẩn thông báo sau khi hiệu ứng hoàn thành
        setTimeout(() => {
            notification.classList.remove("show");
            notification.addEventListener('transitionend', function handler() {
                notification.removeEventListener('transitionend', handler);
                notification.remove();
            });
        }, 3000);
    }
});