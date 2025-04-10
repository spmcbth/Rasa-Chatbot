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
    const historyButton = document.getElementById("history-button");

    // Biến cờ để theo dõi hành động đang xử lý
    let isProcessingAction = false;

    // Tạo và thêm favorites panel vào DOM
    const favoritesPanel = document.createElement("div");
    favoritesPanel.className = "favorites-panel";
    favoritesPanel.id = "favorites-panel";
    favoritesPanel.innerHTML = `
        <div class="favorites-header">
            <h3>Yêu thích</h3>
            <button id="close-favorites" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="favorites-list" id="favorites-list"></div>
    `;
    document.body.appendChild(favoritesPanel);
    
    // Tạo và thêm history panel vào DOM
    const historyPanel = document.createElement("div");
    historyPanel.className = "history-panel";
    historyPanel.id = "history-panel";
    historyPanel.innerHTML = `
        <div class="history-header">
            <h3>Lịch sử hội thoại</h3>
            <button id="close-history" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="history-list" id="history-list"></div>
    `;
    document.body.appendChild(historyPanel);

    const closeFavoritesButton = document.getElementById("close-favorites");
    const favoritesList = document.getElementById("favorites-list");
    const closeHistoryButton = document.getElementById("close-history");
    const historyList = document.getElementById("history-list");

    // Hiển thị thông báo
    const toastNotification = document.createElement("div");
    toastNotification.className = "toast-notification";
    toastNotification.id = "toast-notification";
    document.body.appendChild(toastNotification);

    favoritesPanel.addEventListener('transitionend', function() {
        isProcessingAction = false;
    });
    
    historyPanel.addEventListener('transitionend', function() {
        isProcessingAction = false;
    });

    userInput.focus();

    loadChatHistory();  // Load lại chat history

    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMessage();
    });

    newChatButton.addEventListener("click", startNewChat);
    favMessagesButton.addEventListener("click", toggleFavoritesPanel);
    historyButton.addEventListener("click", toggleHistoryPanel);
    closeFavoritesButton.addEventListener("click", closeFavoritesPanel);
    closeHistoryButton.addEventListener("click", closeHistoryPanel);

    // Event listeners cho phần yêu thích
    document.addEventListener("click", function(e) {
        if (e.target && e.target.closest(".like-message-btn")) {
            e.preventDefault();
            
            // Nếu đang xử lý, bỏ qua click
            if (isProcessingAction) return;
            isProcessingAction = true;
            
            const messageContainer = e.target.closest(".message");
            toggleFavorite(messageContainer);
            
            // Đặt lại cờ sau khi xử lý
            setTimeout(() => {
                isProcessingAction = false;
            }, 300);
        }
        
        if (e.target && e.target.closest(".delete-favorite")) {
            e.preventDefault();
            
            if (isProcessingAction) return;
            isProcessingAction = true;
            
            const favoriteItem = e.target.closest(".favorite-item");
            const favoriteId = favoriteItem.getAttribute("data-id");
                        
            removeFavorite(favoriteId);

            isProcessingAction = false;
        }
        
        // Xử lý khi click vào hội thoại trong lịch sử
        if (e.target && e.target.closest(".history-item")) {
            e.preventDefault();
            
            if (isProcessingAction) return;
            isProcessingAction = true;
            
            const historyItem = e.target.closest(".history-item");
            const historyConvId = historyItem.getAttribute("data-conversation-id");
            
            loadConversation(historyConvId);
            closeHistoryPanel();
            
            isProcessingAction = false;
        }
    });

    // Gửi tin nhắn
    function sendMessage() {
        const message = userInput.value.trim();
        if (message.length === 0) return;

        addMessage(message, "user");
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
            })
            .catch((error) => {
                console.error("Lỗi:", error);
                removeTypingIndicator();
                addMessage("Có lỗi xảy ra khi xử lý tin nhắn của bạn.", "bot");
            });
    }

    // Thêm tin nhắn vào chatbox
    function addMessage(text, sender) {
        const messageContainer = document.createElement("div");
        messageContainer.className = "message";
        const timestamp = new Date().toLocaleString();
        messageContainer.setAttribute("data-timestamp", timestamp);
        const messageId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        messageContainer.setAttribute("data-message-id", messageId);
        messageContainer.setAttribute("data-conversation-id", conversationId);

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
        
        // Lưu lịch sử chat vào local storage để hiển thị khi reload
        saveChatToLocalStorage();
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

    // Lưu chat history vào local storage
    function saveChatToLocalStorage() {
        localStorage.setItem("chat_history_" + conversationId, chatMessages.innerHTML);
    }

    // Load chat history từ local storage
    function loadChatHistory() {
        const savedChat = localStorage.getItem("chat_history_" + conversationId);
        if (savedChat) {
            chatMessages.innerHTML = savedChat;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            // Nếu không có chat history trong localStorage, hiển thị tin nhắn chào
            addMessage("Xin chào! Mình là chatbot hỗ trợ giải đáp quy chế học vụ. Bạn cần giúp gì?", "bot");
        }
    }

    // New chat
    function startNewChat() {
        conversationId = "conv_" + Date.now();
        localStorage.setItem("current_conversation_id", conversationId);

        chatMessages.innerHTML = "";
        addMessage("Xin chào! Mình là chatbot hỗ trợ giải đáp quy chế học vụ. Bạn cần giúp gì?", "bot");
    }

    // Thêm/xóa trạng thái yêu thích
    function toggleFavorite(messageContainer) {
        const messageId = messageContainer.getAttribute("data-message-id");
        const timestamp = messageContainer.getAttribute("data-timestamp") || new Date().toLocaleString();
        const likeButton = messageContainer.querySelector('.like-message-btn');
        
        // Xác định loại tin nhắn
        let messageType = 'bot';
        if (messageContainer.querySelector('.user-message')) {
            messageType = 'user';
        }
        
        // Gửi yêu cầu API để thêm/xóa yêu thích
        fetch("/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                message_id: messageId,
                conversation_id: conversationId,
                content: messageContainer.innerHTML,
                message_type: messageType
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "added") {
                likeButton.classList.add('active');
                showNotification(data.message);
            } else if (data.status === "removed") {
                likeButton.classList.remove('active');
                showNotification(data.message);
            }
            
            // Cập nhật lại danh sách yêu thích
            if (document.getElementById("favorites-panel").classList.contains("show")) {
                loadFavorites();
            }
        })
        .catch(error => {
            console.error("Lỗi khi thao tác yêu thích:", error);
            showNotification("Đã xảy ra lỗi khi thao tác yêu thích!");
        });
    }

    // Xóa yêu thích
    function removeFavorite(favoriteId) {
        fetch(`/favorites/${favoriteId}?user_id=${userId}`, {
            method: "DELETE"
        })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message);
            loadFavorites();
        })
        .catch(error => {
            console.error("Lỗi khi xóa yêu thích:", error);
            showNotification("Đã xảy ra lỗi khi xóa yêu thích!");
        });
    }

    // Load danh sách yêu thích
    function loadFavorites() {
        fetch(`/favorites?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            favoritesList.innerHTML = "";
            
            if (!data.favorites || data.favorites.length === 0) {
                favoritesList.innerHTML = "<p class='no-favorites'>Chưa có đoạn hội thoại nào được yêu thích</p>";
                return;
            }
            
            data.favorites.forEach(favorite => {
                const favoriteItem = document.createElement("div");
                favoriteItem.className = "favorite-item";
                favoriteItem.setAttribute("data-id", favorite.id);
                
                const favoriteHeader = document.createElement("div");
                favoriteHeader.className = "favorite-header";
                
                const favoriteDate = document.createElement("span");
                favoriteDate.className = "favorite-date";
                favoriteDate.textContent = new Date(favorite.created_at).toLocaleString();
                
                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-favorite";
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.title = "Xóa khỏi yêu thích";
                
                favoriteHeader.appendChild(favoriteDate);
                favoriteHeader.appendChild(deleteButton);
                
                const favoriteContent = document.createElement("div");
                favoriteContent.className = "favorite-content";
                favoriteContent.innerHTML = favorite.content;
                
                // Xóa nút like trong nội dung yêu thích
                const likeButtons = favoriteContent.querySelectorAll('.like-message-btn');
                likeButtons.forEach(btn => btn.style.display = 'none');
                
                favoriteItem.appendChild(favoriteHeader);
                favoriteItem.appendChild(favoriteContent);
                
                favoritesList.appendChild(favoriteItem);
            });
        })
        .catch(error => {
            console.error("Lỗi khi tải danh sách yêu thích:", error);
            favoritesList.innerHTML = "<p class='no-favorites'>Đã xảy ra lỗi khi tải yêu thích</p>";
        });
    }

    // Ẩn/hiện panel yêu thích
    function toggleFavoritesPanel() {
        if (isProcessingAction) return;
        isProcessingAction = true;
        
        const panel = document.getElementById("favorites-panel");
        const historyPanl = document.getElementById("history-panel");
        historyPanl.classList.remove("show");  // Đóng chat history panel nếu đang mở
        
        const isVisible = panel.classList.contains("show");
        
        if (isVisible) {
            panel.classList.remove("show");
        } else {
            loadFavorites();
            panel.classList.add("show");
        }
    }

    // Đóng panel yêu thích
    function closeFavoritesPanel() {
        const panel = document.getElementById("favorites-panel");
        panel.classList.remove("show");
    }

    // Ẩn/hiện chat history panel
    function toggleHistoryPanel() {
        if (isProcessingAction) return;
        isProcessingAction = true;
        
        const panel = document.getElementById("history-panel");
        const favPanel = document.getElementById("favorites-panel");
        favPanel.classList.remove("show");  // Đóng panel yêu thích nếu đang mở
        
        const isVisible = panel.classList.contains("show");
        
        if (isVisible) {
            panel.classList.remove("show");
        } else {
            loadConversationHistory();
            panel.classList.add("show");
        }
    }

    // Đóng chat history panel
    function closeHistoryPanel() {
        const panel = document.getElementById("history-panel");
        panel.classList.remove("show");
    }

    // Load hội thoại
    function loadConversationHistory() {
        fetch(`/conversations?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            historyList.innerHTML = "";
            
            if (!data.conversations || data.conversations.length === 0) {
                historyList.innerHTML = "<p class='no-history'>Chưa có cuộc hội thoại nào</p>";
                return;
            }
            
            data.conversations.forEach(conv => {
                const historyItem = document.createElement("div");
                historyItem.className = "history-item";
                historyItem.setAttribute("data-conversation-id", conv.conversation_id);
                
                // Định dạng ngày tháng
                const startDate = new Date(conv.start_time).toLocaleDateString();
                const lastDate = new Date(conv.last_time).toLocaleDateString();
                const lastTime = new Date(conv.last_time).toLocaleTimeString();
                
                historyItem.innerHTML = `
                    <div class="history-item-header">
                        <span class="history-date">${startDate === lastDate ? lastDate : startDate + ' - ' + lastDate}</span>
                        <span class="history-time">${lastTime}</span>
                    </div>
                    <div class="history-item-content">
                        <span class="message-count">${conv.message_count} tin nhắn</span>
                        <button class="load-conversation-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            });
        })
        .catch(error => {
            console.error("Lỗi khi tải lịch sử hội thoại:", error);
            historyList.innerHTML = "<p class='no-history'>Đã xảy ra lỗi khi tải lịch sử</p>";
        });
    }

    // Load hội thoại theo Id
    function loadConversation(convId) {
        // Cập nhật ID cuộc hội thoại hiện tại
        conversationId = convId;
        localStorage.setItem("current_conversation_id", conversationId);
        
        // Xóa chatbox hiện tại
        chatMessages.innerHTML = "";
        
        // Thông báo đang load hội thoại
        chatMessages.innerHTML = "<div class='loading-chat'>Đang tải cuộc hội thoại...</div>";
        
        // Lấy lịch sử hội thoại từ server theo Id
        fetch(`/history?user_id=${userId}&conversation_id=${convId}`)
        .then(response => response.json())
        .then(data => {
            chatMessages.innerHTML = "";
            
            if (!data.history || data.history.length === 0) {
                addMessage("Không tìm thấy nội dung hội thoại", "bot");
                return;
            }
            
            // Thêm từng tin nhắn vào chat
            data.history.forEach(item => {
                // Thêm tin nhắn người dùng trước
                addMessage(item.user_message, "user");
                
                // Sau đó thêm phản hồi của bot
                addMessage(item.bot_response, "bot");
            });
            
            // Lưu vào local storage sau khi load
            saveChatToLocalStorage();
            
            // Cuộn xuống dưới cùng
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(error => {
            console.error("Lỗi khi tải hội thoại:", error);
            chatMessages.innerHTML = "";
            addMessage("Đã xảy ra lỗi khi tải hội thoại", "bot");
        });
    }

    // Hiển thị thông báo
    function showNotification(message) {
        const notification = document.getElementById("toast-notification");
        notification.textContent = message;
        notification.classList.add("show");
        
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }
});