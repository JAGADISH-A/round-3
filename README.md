# CareerSpark AI - Interview Simulator Bot

A technical interview simulation bot for Telegram, powered by AI Intelligence and Vision services.

## Prerequisites
- Python 3.11+
- [FFmpeg](https://ffmpeg.org/) (for Voice Note handling)
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

## Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd nm
    ```

2.  **Configure Environment Variables**
    Copy the `.env.example` to `.env` in the `ai-service/intelligence-service/` directory:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and add your `TELEGRAM_BOT_TOKEN`.

3.  **Install Dependencies**
    Navigate to the intelligence service and set up a virtual environment:
    ```powershell
    cd ai-service\intelligence-service
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    ```

4.  **Run the Bot**
    ```powershell
    python run_telegram_bot.py
    ```

## Usage
- `/start`: Initialize the bot and view commands.
- `/practice`: Begin a structured 5-question interview session.
- `/coach`: Switch to regular AI career coaching mode (text-based).
- `/help`: View instructions.

## AI Engine Features
- **Strict Latency Control**: Guaranteed responses under 8 seconds.
- **Automated Evaluation**: Real-time scoring and feedback for interview answers.
- **Speech Pipeline**: Integrated TTS feedback for a more realistic interview feel.
