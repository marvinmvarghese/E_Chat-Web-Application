from PySide6.QtWidgets import QWidget, QVBoxLayout, QLineEdit, QPushButton, QLabel, QMessageBox
from PySide6.QtCore import Qt
import qasync

class LoginWindow(QWidget):
    def __init__(self, network_manager):
        super().__init__()
        self.network = network_manager
        self.init_ui()
        self.connect_signals()

    def init_ui(self):
        self.setWindowTitle("E_Chat Login")
        self.setFixedSize(300, 250)
        
        layout = QVBoxLayout()
        
        self.label = QLabel("Welcome to E_Chat")
        self.label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.label)
        
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Enter your email")
        layout.addWidget(self.email_input)
        
        self.otp_input = QLineEdit()
        self.otp_input.setPlaceholderText("Enter OTP")
        self.otp_input.setVisible(False)
        layout.addWidget(self.otp_input)
        
        self.action_btn = QPushButton("Request OTP")
        layout.addWidget(self.action_btn)
        
        self.setLayout(layout)

    def connect_signals(self):
        self.action_btn.clicked.connect(self.handle_action)
        self.network.otp_sent.connect(self.on_otp_sent)
        self.network.otp_fail.connect(self.on_error)
        self.network.login_fail.connect(self.on_error)

    @qasync.asyncSlot()
    async def handle_action(self):
        email = self.email_input.text()
        if not self.otp_input.isVisible():
            # Request OTP
            if "@" not in email:
                QMessageBox.warning(self, "Error", "Invalid Email")
                return
            await self.network.request_otp(email)
        else:
            # Verify OTP
            otp = self.otp_input.text()
            await self.network.verify_otp(email, otp)

    def on_otp_sent(self, msg):
        self.otp_input.setVisible(True)
        self.action_btn.setText("Login")
        self.email_input.setDisabled(True)
        QMessageBox.information(self, "Success", msg)

    def on_error(self, msg):
        QMessageBox.critical(self, "Error", msg)
