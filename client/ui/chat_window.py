from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QListWidget, 
                               QLineEdit, QPushButton, QLabel, QTextEdit, QScrollArea, QFrame, QInputDialog, QMessageBox)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QColor, QPalette
import qasync
from ..state import state

class ChatWindow(QWidget):
    def __init__(self, network_manager):
        super().__init__()
        self.network = network_manager
        self.current_chat_id = None # User ID of the person we are chatting with
        self.init_ui()
        self.connect_signals()
        
        # Poll for contacts initially
        QTimer.singleShot(100, self.refresh_contacts)

    def init_ui(self):
        self.setWindowTitle(f"E_Chat - {state.email}")
        self.resize(800, 600)
        
        main_layout = QHBoxLayout()
        
        # Sidebar (Contacts)
        sidebar_layout = QVBoxLayout()
        self.add_contact_btn = QPushButton("Add Contact")
        sidebar_layout.addWidget(self.add_contact_btn)
        
        self.contact_list = QListWidget()
        sidebar_layout.addWidget(self.contact_list)
        
        sidebar_widget = QWidget()
        sidebar_widget.setLayout(sidebar_layout)
        sidebar_widget.setFixedWidth(200)
        main_layout.addWidget(sidebar_widget)
        
        # Chat Area
        chat_layout = QVBoxLayout()
        
        self.chat_header = QLabel("Select a contact to start chatting")
        self.chat_header.setStyleSheet("font-weight: bold; font-size: 14px; padding: 10px;")
        chat_layout.addWidget(self.chat_header)
        
        # Message History
        self.messages_area = QTextEdit()
        self.messages_area.setReadOnly(True)
        chat_layout.addWidget(self.messages_area)
        
        # Input Area
        input_layout = QHBoxLayout()
        self.msg_input = QLineEdit()
        self.msg_input.setPlaceholderText("Type a message...")
        input_layout.addWidget(self.msg_input)
        
        self.voice_btn = QPushButton("🎤") # Placeholder for voice
        self.voice_btn.setFixedWidth(40)
        input_layout.addWidget(self.voice_btn)
        
        self.send_btn = QPushButton("Send")
        input_layout.addWidget(self.send_btn)
        
        chat_layout.addLayout(input_layout)
        
        chat_widget = QWidget()
        chat_widget.setLayout(chat_layout)
        main_layout.addWidget(chat_widget)
        
        self.setLayout(main_layout)

    def connect_signals(self):
        self.add_contact_btn.clicked.connect(self.add_contact_dialog)
        self.contact_list.itemClicked.connect(self.on_contact_selected)
        self.send_btn.clicked.connect(self.send_message)
        self.msg_input.returnPressed.connect(self.send_message)
        self.voice_btn.clicked.connect(self.record_voice) # TODO
        
        self.network.contact_list_updated.connect(self.update_contact_list)
        self.network.message_received.connect(self.on_message_received)

    @qasync.asyncSlot()
    async def refresh_contacts(self):
        await self.network.fetch_contacts()

    @qasync.asyncSlot()
    async def add_contact_dialog(self):
        email, ok = QInputDialog.getText(self, "Add Contact", "Enter Email Address:")
        if ok and email:
            success = await self.network.add_contact(email)
            if not success:
                QMessageBox.warning(self, "Error", "Could not add contact. Check email or self-add.")

    def update_contact_list(self, contacts):
        self.contact_list.clear()
        for contact in contacts:
            # Store ID in UserRole or just use parallel list?
            # QListWidgetItem can store data
            from PySide6.QtWidgets import QListWidgetItem
            item = QListWidgetItem(contact["email"])
            item.setData(Qt.UserRole, contact["id"])
            self.contact_list.addItem(item)

    def on_contact_selected(self, item):
        contact_id = item.data(Qt.UserRole)
        self.current_chat_id = contact_id
        self.chat_header.setText(f"Chatting with {item.text()}")
        self.messages_area.clear()
        # Fetch history (we need to add this method to network/state)
        # For now, just clear
        # In a real app, we'd call await self.network.get_history(contact_id)
        # I'll implement a quick fetch history in network or here if needed

    @qasync.asyncSlot()
    async def send_message(self):
        if not self.current_chat_id:
            return
        text = self.msg_input.text().strip()
        if not text:
            return
            
        await self.network.send_message(self.current_chat_id, content=text)
        self.append_message("Me", text)
        self.msg_input.clear()

    def on_message_received(self, msg):
        # msg = {type, content, sender_id, etc}
        msg_type = msg.get("type")
        if msg_type == "new_message":
            sender_id = msg.get("sender_id")
            content = msg.get("content")
            
            # If from current chat, append
            if sender_id == self.current_chat_id:
                self.append_message("Them", content)
            elif sender_id == state.user_id:
                # Should handle ack
                pass
            else:
                # Notify or highlight other contact
                pass

    def append_message(self, sender, text):
        self.messages_area.append(f"<b>{sender}:</b> {text}")

    def record_voice(self):
        QMessageBox.information(self, "Info", "Voice recording not fully implemented in UI MVP yet.")
