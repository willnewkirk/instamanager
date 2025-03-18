from instaloader import Instaloader, Profile
from instagrapi import Client
import os
import time
from datetime import datetime, timedelta
import shutil

class InstagramRepostBot:
    def __init__(self, username, password):
        # Initialize Instaloader for downloading
        self.L = Instaloader()
        self.L.login(username, password)
        
        # Initialize Instagrapi for uploading
        self.cl = Client()
        self.cl.login(username, password)
        
        self.username = username
        self.download_path = "temp_downloads"
        
        # Create download directory if it doesn't exist
        if not os.path.exists(self.download_path):
            os.makedirs(self.download_path)

    def get_trending_reels(self, days_back=7, min_likes=1000):
        """Get trending reels from the user's profile"""
        profile = Profile.from_username(self.L.context, self.username)
        trending_reels = []
        
        # Get posts from last week
        time_threshold = datetime.now() - timedelta(days=days_back)
        
        for post in profile.get_posts():
            if post.is_video and post.date > time_threshold:
                if post.likes > min_likes:
                    trending_reels.append({
                        'post': post,
                        'likes': post.likes,
                        'url': post.video_url
                    })
        
        # Sort by likes
        trending_reels.sort(key=lambda x: x['likes'], reverse=True)
        return trending_reels

    def download_reel(self, post):
        """Download a single reel"""
        try:
            filename = f"{self.download_path}/{post.date_utc:%Y-%m-%d_%H-%M-%S}.mp4"
            self.L.download_post(post, target=self.download_path)
            
            # Find the downloaded video file and rename it
            for file in os.listdir(self.download_path):
                if file.endswith('.mp4'):
                    old_path = os.path.join(self.download_path, file)
                    os.rename(old_path, filename)
                    return filename
        except Exception as e:
            print(f"Error downloading reel: {e}")
            return None

    def repost_reel(self, video_path, caption="🔥 Trending Reel #repost"):
        """Repost the downloaded reel"""
        try:
            self.cl.clip_upload(video_path, caption)
            print(f"Successfully reposted: {video_path}")
            return True
        except Exception as e:
            print(f"Error reposting reel: {e}")
            return False

    def cleanup(self):
        """Clean up downloaded files"""
        if os.path.exists(self.download_path):
            shutil.rmtree(self.download_path)
            os.makedirs(self.download_path)

    def run(self, num_reels=3):
        """Main function to run the repost bot"""
        try:
            # Get trending reels
            trending_reels = self.get_trending_reels()
            
            # Process top N reels
            for reel in trending_reels[:num_reels]:
                # Download the reel
                video_path = self.download_reel(reel['post'])
                if video_path:
                    # Add some delay between actions
                    time.sleep(5)
                    
                    # Repost the reel
                    self.repost_reel(video_path)
                    
                    # Add longer delay between posts
                    time.sleep(30)
            
            # Cleanup downloaded files
            self.cleanup()
            
        except Exception as e:
            print(f"Error in main execution: {e}")
            self.cleanup()

if __name__ == "__main__":
    USERNAME = "evilesmerelda"  # Your Instagram username
    PASSWORD = "your_password"   # Your Instagram password
    
    bot = InstagramRepostBot(USERNAME, PASSWORD)
    bot.run(num_reels=3) 