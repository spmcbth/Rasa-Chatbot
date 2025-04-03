from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import logging
import mysql.connector
from datetime import datetime

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Đường dẫn API của Rasa server
RASA_API_URL = "http://localhost:5005/webhooks/rest/webhook"

# Cấu hình MySQL
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'rasa_user',
    'password': '4510471',  
    'database': 'chatbot_rasa'  
}

def init_db():
    """Khởi tạo kết nối đến database và tạo bảng nếu chưa tồn tại"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        # Tạo bảng lưu lịch sử chat nếu chưa tồn tại với conversation_id
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(100),
                conversation_id VARCHAR(100),
                user_message TEXT,
                bot_response TEXT,
                timestamp DATETIME
            )
        ''')
        
        conn.commit()
        logger.info("Kết nối MySQL và khởi tạo bảng thành công")
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Lỗi khi khởi tạo database: {str(e)}")

def save_chat_history(user_id, conversation_id, user_message, bot_response):
    """Lưu lịch sử hội thoại vào database"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        # Lưu thông tin chat
        query = '''
            INSERT INTO chat_history (user_id, conversation_id, user_message, bot_response, timestamp)
            VALUES (%s, %s, %s, %s, %s)
        '''
        current_time = datetime.now()
        cursor.execute(query, (user_id, conversation_id, user_message, bot_response, current_time))
        
        conn.commit()
        logger.info(f"Đã lưu hội thoại vào database cho user: {user_id}, conversation: {conversation_id}")
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Lỗi khi lưu lịch sử chat: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        user_id = request.json.get('user_id', 'anonymous')
        conversation_id = request.json.get('conversation_id', 'default')
        
        logger.info(f"Nhận tin nhắn từ người dùng {user_id}, cuộc hội thoại {conversation_id}: {user_message}")
        
        # Gửi tin nhắn đến Rasa server
        rasa_response = requests.post(
            RASA_API_URL,
            json={"sender": user_id, "message": user_message},
            timeout=5
        )
        
        # Kiểm tra status code
        if rasa_response.status_code != 200:
            logger.error(f"Lỗi khi gọi Rasa API: {rasa_response.status_code} - {rasa_response.text}")
            error_message = "Có lỗi khi xử lý yêu cầu của bạn."
            save_chat_history(user_id, conversation_id, user_message, error_message)
            return jsonify({"response": error_message})
        
        # Xử lý phản hồi từ Rasa
        responses = rasa_response.json()
        logger.info(f"Nhận phản hồi từ Rasa: {responses}")
        
        if not responses:
            bot_response = "Xin lỗi, tôi không hiểu câu hỏi của bạn."
            save_chat_history(user_id, conversation_id, user_message, bot_response)
            return jsonify({"response": bot_response})
        
        # Lấy tin nhắn đầu tiên từ phản hồi
        bot_response = responses[0].get('text', 'Không có phản hồi')
        
        # Lưu lịch sử chat vào database
        save_chat_history(user_id, conversation_id, user_message, bot_response)
        
        return jsonify({"response": bot_response})
    
    except requests.exceptions.ConnectionError:
        logger.error("Không thể kết nối đến Rasa server")
        error_message = "Không thể kết nối đến chatbot server. Vui lòng kiểm tra xem Rasa đã được khởi động chưa."
        try:
            save_chat_history(user_id, conversation_id, user_message, error_message)
        except:
            pass
        return jsonify({"response": error_message})
    
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        error_message = "Đã xảy ra lỗi khi xử lý yêu cầu của bạn."
        try:
            save_chat_history(user_id, conversation_id, user_message, error_message)
        except:
            pass
        return jsonify({"response": error_message})

@app.route('/history', methods=['GET'])
def get_history():
    """API endpoint để lấy lịch sử chat của một user theo conversation"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        conversation_id = request.args.get('conversation_id')
        
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        if conversation_id:
            # Lấy lịch sử của một cuộc hội thoại cụ thể
            query = '''
                SELECT user_message, bot_response, timestamp
                FROM chat_history
                WHERE user_id = %s AND conversation_id = %s
                ORDER BY timestamp ASC
            '''
            cursor.execute(query, (user_id, conversation_id))
        else:
            # Lấy tất cả lịch sử chat của user
            query = '''
                SELECT conversation_id, user_message, bot_response, timestamp
                FROM chat_history
                WHERE user_id = %s
                ORDER BY timestamp DESC
                LIMIT 100
            '''
            cursor.execute(query, (user_id,))
        
        history = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({"history": history})
    except Exception as e:
        logger.error(f"Lỗi khi lấy lịch sử chat: {str(e)}")
        return jsonify({"error": "Không thể lấy lịch sử chat"})

@app.route('/conversations', methods=['GET'])
def get_conversations():
    """API endpoint để lấy danh sách các cuộc hội thoại của một user"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Lấy danh sách các cuộc hội thoại riêng biệt
        query = '''
            SELECT DISTINCT conversation_id, 
                   MIN(timestamp) as start_time,
                   MAX(timestamp) as last_time,
                   COUNT(*) as message_count
            FROM chat_history
            WHERE user_id = %s
            GROUP BY conversation_id
            ORDER BY last_time DESC
        '''
        cursor.execute(query, (user_id,))
        conversations = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({"conversations": conversations})
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách cuộc hội thoại: {str(e)}")
        return jsonify({"error": "Không thể lấy danh sách cuộc hội thoại"})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=3000)