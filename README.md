# Rasa-Chatbot

## 1. Tạo và kích hoạt môi trường ảo
### Tạo môi trường ảo
```bash
python -m venv rasa_env
```
### Kích hoạt môi trường ảo
Trên Windows
```bash
rasa_env\Scripts\activate
```
Trên macOS/Linux
```bash
source rasa_env/bin/activate
```

## 2. Cài đặt các thư viện
```bash
pip install -r requirements.txt
```

## 3. Chạy dự án
### Chạy Rasa Server
```bash
# Di chuyển đến thư mục Rasa
cd Rasa

# Chạy Rasa Server
rasa run --enable-api --cors "*"
```

### Chạy Flask server
Mở một terminal mới (giữ terminal Rasa đang chạy)
```bash
# Di chuyển đến thư mục flask_app
cd flask_app

# Chạy ứng dụng Flask
python app.py
```
