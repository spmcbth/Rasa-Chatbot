const API_URL = "http://127.0.0.1:8000/chat";  // URL của FastAPI

function sendMessage() {
    let userInput = document.getElementById("user-input").value;
    if (!userInput) return;

    let chatBox = document.getElementById("chat-box");

    // Hiển thị tin nhắn của người dùng
    let userMessage = document.createElement("div");
    userMessage.className = "user-message";
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    // Gửi tin nhắn đến FastAPI
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "user123", message: userInput })
    })
    .then(response => response.json())
    .then(data => {
        let botReply = document.createElement("div");
        botReply.className = "bot-message";
        botReply.textContent = data.reply || "Lỗi khi nhận phản hồi.";
        chatBox.appendChild(botReply);
    })
    .catch(error => console.error("Lỗi:", error));

    document.getElementById("user-input").value = "";
}
