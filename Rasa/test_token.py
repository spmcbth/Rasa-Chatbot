from rasa.shared.nlu.training_data.message import Message
from rasa.shared.nlu.constants import TEXT
from custom_components.custom_tokenizer import CustomTokenizer  # Import tokenizer custom

# Cấu hình
config = {
    "case_sensitive": False,
    "intent_tokenization_flag": False,
    "intent_split_symbol": "_",
}

# Khởi tạo tokenizer
tokenizer = CustomTokenizer(config)

# Các câu để kiểm tra token
test_texts = [
    "Tôi đạt B + môn Toán.",
    "Điểm C + có thể cải thiện được không?",
    "Kết quả D + có ý nghĩa gì?",
    "Môn này tôi đạt B+ nhưng muốn học lại.",
    "Tôi được điểm B",
    "Điểm của tôi là B  +"
]

# Chạy tokenizer
for text in test_texts:
    message = Message(data={TEXT: text})
    tokens = tokenizer.tokenize(message)

    print(f"Input: {text}")
    print("Tokens:", [t.text for t in tokens])
    print("-" * 30)
