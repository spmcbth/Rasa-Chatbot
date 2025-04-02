from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Đường dẫn API của Rasa server
RASA_API_URL = "http://localhost:5005/webhooks/rest/webhook"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        logger.info(f"Nhận tin nhắn từ người dùng: {user_message}")
        
        # Gửi tin nhắn đến Rasa server
        rasa_response = requests.post(
            RASA_API_URL,
            json={"sender": "user", "message": user_message},
            timeout=5
        )
        
        # Kiểm tra status code
        if rasa_response.status_code != 200:
            logger.error(f"Lỗi khi gọi Rasa API: {rasa_response.status_code} - {rasa_response.text}")
            return jsonify({"response": "Có lỗi khi xử lý yêu cầu của bạn."})
        
        # Xử lý phản hồi từ Rasa
        responses = rasa_response.json()
        logger.info(f"Nhận phản hồi từ Rasa: {responses}")
        
        if not responses:
            return jsonify({"response": "Xin lỗi, tôi không hiểu câu hỏi của bạn."})
        
        # Lấy tin nhắn đầu tiên từ phản hồi
        bot_response = responses[0].get('text', 'Không có phản hồi')
        
        return jsonify({"response": bot_response})
    
    except requests.exceptions.ConnectionError:
        logger.error("Không thể kết nối đến Rasa server")
        return jsonify({"response": "Không thể kết nối đến chatbot server. Vui lòng kiểm tra xem Rasa đã được khởi động chưa."})
    
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        return jsonify({"response": "Đã xảy ra lỗi khi xử lý yêu cầu của bạn."})

if __name__ == '__main__':
    app.run(debug=True, port=3000)