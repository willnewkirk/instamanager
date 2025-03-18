from instagram_repost import InstagramRepostBot
import os
from dotenv import load_dotenv

# Load credentials from environment variables
load_dotenv()

USERNAME = os.getenv("INSTAGRAM_USERNAME")
PASSWORD = os.getenv("INSTAGRAM_PASSWORD")

bot = InstagramRepostBot(USERNAME, PASSWORD)
bot.run(num_reels=3)  # Change number of reels as needed 