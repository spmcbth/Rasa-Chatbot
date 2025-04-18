from __future__ import annotations
from typing import List
import regex

from rasa.engine.recipes.default_recipe import DefaultV1Recipe
from rasa.nlu.tokenizers.whitespace_tokenizer import WhitespaceTokenizer
from rasa.shared.nlu.training_data.message import Message
from rasa.shared.nlu.constants import TEXT
from rasa.nlu.tokenizers.tokenizer import Token

@DefaultV1Recipe.register(
    DefaultV1Recipe.ComponentType.MESSAGE_TOKENIZER, is_trainable=False
)
class CustomTokenizer(WhitespaceTokenizer):

    def tokenize(self, message: Message, attribute: str = TEXT) -> List[Token]:
        text = message.get(attribute)
        if not text:  # Nếu văn bản rỗng thì trả về danh sách rỗng
            return []

        # Chuẩn hóa ký hiệu B+, C+, D+
        text = regex.sub(r'\b([BCD])\s*\+\s*\b', r'\1+', text)

        # Dùng dấu `+` làm ký tự hợp lệ, không tách riêng
        split_tokens = regex.findall(r'\w+\+?|\d+', text)

        tokens = []
        start_pos = 0
        for word in split_tokens:
            start_index = text.find(word, start_pos)  # Định vị lại start position
            tokens.append(Token(word, start_index))
            start_pos = start_index + len(word)  # Cập nhật vị trí tiếp theo

        return tokens
