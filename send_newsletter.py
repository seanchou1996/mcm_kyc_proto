import asyncio
import requests
from dotenv import load_dotenv
from assistant.research_newsletter_runner import NewsletterRunner
import datetime
import pytz

# Load environment variables from .env file
load_dotenv()

async def generate_newsletter(use_two_phase=True, max_normal_categories=2):
    # Initialize the runner
    runner = NewsletterRunner()
    
    # Define categories (optional - will use defaults if not specified)
    categories = [
        "Gold & Silver Markets",
        "Oil & Energy Markets",
        "Weather Impact on Commodities",
        "Index Derivatives Trading",
        # Add more relevant categories if needed
    ]
    
    print("Generating newsletter...")
    print("This may take a few minutes as it performs searches for each category.")
    
    # Run the newsletter generation
    result = await runner.run(
        categories=categories,
        date="2025-03-04"  # You can change this date
    )
    
    return result

async def main():
    # Generate the newsletter
    result = await generate_newsletter()
    
    # Prepare the data to send
    current_timestamp = datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d-%H-%M-%S')
    data = {
        "query": "mutation CreatePost($data: PostCreateInput!) { createPost(data: $data) { id title excerpt slug language published content { document } } }",
        "variables": {
            "data": {
                "title": result["title"],
                "excerpt": result["excerpt"],
                "content": [
                    {
                        "type": "paragraph",
                        "children": [
                            {
                                "text": result["tldr_summary"]
                            }
                        ]
                    }
                ],
                "slug": f"newsletter-{current_timestamp}",  # Use timestamp as unique slug
                "language": "en",  # Default language
                "published": True,
                "createdAt": datetime.datetime.now(pytz.utc).isoformat()
            }
        }
    }
    
    # Send the newsletter to the API
    headers = {"Content-Type": "application/json"}
    response = requests.post("https://bitcoinwildtalk.com/api/graphql", json=data, headers=headers)
    
    # Check the response
    print("Status Code:", response.status_code)
    print("Response Text:", response.text)
    if response.status_code == 200:
        print("Newsletter sent successfully!")
    else:
        print("Failed to send newsletter.")

if __name__ == "__main__":
    asyncio.run(main()) 