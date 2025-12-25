import sys
import asyncio

from PySide6.QtWidgets import QApplication
from qasync import QEventLoop

from client.state import state
from client.network import NetworkManager
from client.ui.chat_window import ChatWindow


def main():
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)

    loop = QEventLoop(app)
    asyncio.set_event_loop(loop)

    network_manager = NetworkManager(state)
    window = ChatWindow(network_manager)
    window.show()

    with loop:
        loop.run_forever()


if __name__ == "__main__":
    main()