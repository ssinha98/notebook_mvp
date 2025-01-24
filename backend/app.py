from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from openai import OpenAI
import os
from dotenv import load_dotenv
import PyPDF2
from PIL import Image
import io
import base64
from functools import wraps

# Load environment variables immediately after imports
load_dotenv()

# Verify API key is loaded
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client after environment variables are loaded
client = OpenAI(api_key=api_key)

# Reset counter on application start
api_call_count = 0
user_api_key = None
MAX_FREE_CALLS = 3

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_active_api_key():
    """Returns user API key if set, otherwise falls back to env key"""
    global user_api_key
    return user_api_key if user_api_key else os.getenv('OPENAI_API_KEY')

def check_api_key_usage():
    """Tracks API usage and returns whether user needs their own key"""
    global api_call_count
    api_call_count += 1
    if api_call_count > 3 and not user_api_key:
        return False
    return True

@app.route('/api/set-api-key', methods=['POST'])
def set_api_key():
    """Endpoint to set user's API key"""
    global user_api_key
    data = request.json
    user_api_key = data.get('api_key')
    return jsonify({"success": True})

def process_file(file, file_type):
    """Process different file types and return their data"""
    if file_type == "pdf":
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    
    elif file_type == "image":
        # Convert image to base64 for easy transmission
        img = Image.open(file)
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return img_str

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    file_type = request.form.get('type')
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save file
        filename = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filename)
        
        # Process file based on type
        with open(filename, 'rb') as f:
            processed_data = process_file(f, file_type)
        
        return jsonify({
            'success': True,
            'filename': file.filename,
            'filepath': filename,
            'processed_data': processed_data
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def call_model(system_prompt: str, user_prompt: str, sources: dict = None) -> dict:
    """Sends prompts to OpenAI and returns the response"""
    try:
        if not check_api_key_usage():
            return {
                "response": "Please add your own API key to continue using the service.",
                "success": False,
                "needs_api_key": True
            }

        client = OpenAI(api_key=get_active_api_key())
        # Prepare context from sources
        context = ""
        if sources:
            for name, data in sources.items():
                if name in user_prompt:  # Only include referenced sources
                    context += f"\nContent for {name}: {data}\n"
        
        # Modify the content to include context if it exists
        content = f"{system_prompt} {context} {user_prompt}" if context else f"{system_prompt} {user_prompt}"
        
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": content,
                }
            ],
            model="gpt-4",
        )
        return {
            "response": response.choices[0].message.content,
            "success": True
        }
    except Exception as e:
        return {
            "response": str(e),
            "success": False
        }

@app.route('/api/call-model', methods=['POST'])
def api_call_model():
    """Standard LLM call without source"""
    data = request.json
    system_prompt = data.get('system_prompt', '')
    user_prompt = data.get('user_prompt', '')
    
    result = call_model(system_prompt, user_prompt)
    response = make_response(jsonify(result))
    response.set_cookie('session_active', 'true')
    return response

@app.route('/api/call-model-with-source', methods=['POST'])
def api_call_model_with_source():
    """LLM call with a source attached"""
    data = request.json
    system_prompt = data.get('system_prompt', '')
    user_prompt = data.get('user_prompt', '')
    processed_data = data.get('processed_data', '')
    
    # Prepend the source context to system prompt
    source_system_prompt = f"You are a helpful assistant. The user has given you the following source to use to answer questions. Please only use this source, and this source only, when helping the user. Source: {processed_data}\n\n{system_prompt}"
    
    result = call_model(source_system_prompt, user_prompt)
    response = make_response(jsonify(result))
    response.set_cookie('session_active', 'true')
    return response

@app.route('/api/reset-count', methods=['POST'])
def reset_count():
    """Reset the API call counter"""
    global api_call_count
    api_call_count = 0
    return jsonify({"success": True})

def increment_api_call_count():
    global api_call_count, user_api_key
    if not user_api_key:  # Only increment if using free tier
        api_call_count += 1

@app.route('/api/check-api-key', methods=['GET'])
def check_api_key():
    """Check if custom API key exists and return count"""
    global user_api_key, api_call_count
    return jsonify({
        'hasCustomKey': bool(user_api_key),
        'apiKey': user_api_key if user_api_key else '',
        'count': api_call_count
    })

@app.route('/api/remove-api-key', methods=['POST'])
def remove_api_key():
    """Remove custom API key and reset count"""
    global user_api_key, api_call_count
    user_api_key = None
    api_call_count = 0
    return jsonify({'success': True})

@app.route('/api/get-count', methods=['GET'])
def get_count():
    """Get current API call count"""
    global api_call_count
    return jsonify({'count': api_call_count})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

