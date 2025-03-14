import os
import subprocess
import sys

def print_quicktime_instructions(video_file, audio_file):
    """Print instructions for using QuickTime Player to add background music."""
    print("\n" + "="*80)
    print("INSTRUCTIONS FOR ADDING BACKGROUND MUSIC USING QUICKTIME PLAYER")
    print("="*80)
    print(f"1. Open QuickTime Player on your Mac")
    print(f"2. Open the video file: {os.path.abspath(video_file)}")
    print(f"3. Go to Edit > Add Clip > File...")
    print(f"4. Select the audio file: {os.path.abspath(audio_file)}")
    print(f"5. Adjust the volume of the background music if needed")
    print(f"6. Save the video (File > Export As... > {os.path.abspath('sesame_call_with_music.mp4')})")
    print("="*80)

def try_ffmpeg_direct(video_file, audio_file, output_file, audio_volume=0.3):
    """Try to use ffmpeg directly if it's available."""
    try:
        # Check if ffmpeg is available
        result = subprocess.run(['which', 'ffmpeg'], capture_output=True, text=True)
        if result.returncode != 0:
            print("FFmpeg not found. Skipping direct FFmpeg method.")
            return False
        
        print("FFmpeg found. Trying to add background music directly...")
        
        # Use FFmpeg to add background music
        cmd = [
            'ffmpeg',
            '-i', video_file,
            '-i', audio_file,
            '-filter_complex', f'[1:a]volume={audio_volume}[a1];[0:a][a1]amix=inputs=2:duration=first',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-strict', 'experimental',
            output_file,
            '-y'
        ]
        
        subprocess.run(cmd, check=True)
        print(f"Success! Video with background music saved as: {output_file}")
        return True
    except Exception as e:
        print(f"Error using FFmpeg: {e}")
        return False

def try_open_quicktime(video_file):
    """Try to open the video file in QuickTime Player."""
    try:
        print(f"Opening {video_file} in QuickTime Player...")
        subprocess.run(['open', '-a', 'QuickTime Player', video_file])
        return True
    except Exception as e:
        print(f"Error opening QuickTime Player: {e}")
        return False

if __name__ == "__main__":
    # Input video file
    input_video = "sesame_call.mp4"
    
    # Background music file (already downloaded)
    background_music = "background_music.webm"
    
    # Output video file
    output_video = "sesame_call_with_music.mp4"
    
    # Check if the background music file exists
    if not os.path.exists(background_music):
        print(f"Error: Background music file {background_music} not found.")
        sys.exit(1)
    
    # Try to use FFmpeg directly
    success = try_ffmpeg_direct(input_video, background_music, output_video)
    
    if success:
        print("\nProcess completed successfully!")
        
        # Try to open the output video in QuickTime Player
        try_open_quicktime(output_video)
    else:
        # If FFmpeg fails, provide instructions for QuickTime Player
        print("\nCouldn't add background music automatically.")
        print_quicktime_instructions(input_video, background_music)
        
        # Try to open the input video in QuickTime Player
        try_open_quicktime(input_video) 