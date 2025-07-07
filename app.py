
from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import os
import json
from datetime import datetime
import openai
import PyPDF2
from werkzeug.utils import secure_filename
import logging

app = Flask(__name__)
CORS(app)

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# OpenAI API configuration
openai.api_key = os.getenv('OPENAI_API_KEY', 'your-api-key-here')

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global storage for PDF content
pdf_contents = {
    'material': [],
    'electrical': []
}

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    """Extract text content from PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ""

def get_chatbot_response(user_message, domain, pdf_context):
    """Get response from OpenAI based on domain and PDF context"""
    try:
        if domain == 'material':
            system_prompt = """You are a Material Specification Expert. Your role is to:
            1. Analyze material properties, grades, and specifications
            2. Provide detailed information about material characteristics
            3. Help with material selection based on requirements
            4. Explain material standards and compliance
            5. Only respond to material-related queries

            Use the provided PDF context to answer questions accurately."""

        elif domain == 'electrical':
            system_prompt = """You are an Electrical Specification Expert. Your role is to:
            1. Analyze electrical component specifications
            2. Provide information about electrical ratings and parameters
            3. Help with electrical component selection
            4. Explain electrical standards and compliance
            5. Only respond to electrical-related queries

            Use the provided PDF context to answer questions accurately."""

        else:
            return "Invalid domain specified."

        # Prepare context from PDFs
        context = "\n".join(pdf_context) if pdf_context else "No PDF context available."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context from uploaded PDFs:\n{context}\n\nUser Question: {user_message}"}
        ]

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Error getting chatbot response: {str(e)}")
        return f"I apologize, but I encountered an error while processing your request. Please try again."

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle PDF file uploads"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        domain = request.form.get('domain', 'material')

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            # Extract text from PDF
            pdf_text = extract_text_from_pdf(file_path)

            if pdf_text:
                # Store PDF content based on domain
                pdf_info = {
                    'filename': filename,
                    'content': pdf_text,
                    'upload_time': datetime.now().isoformat()
                }

                if domain in pdf_contents:
                    pdf_contents[domain].append(pdf_info)
                else:
                    pdf_contents['material'].append(pdf_info)

                return jsonify({
                    'message': f'PDF uploaded successfully to {domain} domain',
                    'filename': filename,
                    'domain': domain
                }), 200
            else:
                return jsonify({'error': 'Failed to extract text from PDF'}), 400

        return jsonify({'error': 'Invalid file type. Please upload PDF files only.'}), 400

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': 'File upload failed'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        domain = data.get('domain', 'material')

        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        # Get PDF context for the specific domain
        domain_pdfs = pdf_contents.get(domain, [])
        pdf_context = [pdf['content'] for pdf in domain_pdfs]

        # Get chatbot response
        response = get_chatbot_response(user_message, domain, pdf_context)

        return jsonify({
            'response': response,
            'domain': domain,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return jsonify({'error': 'Chat request failed'}), 500

@app.route('/api/pdfs/<domain>')
def get_pdfs(domain):
    """Get list of uploaded PDFs for a domain"""
    try:
        domain_pdfs = pdf_contents.get(domain, [])
        pdf_list = [
            {
                'filename': pdf['filename'],
                'upload_time': pdf['upload_time']
            }
            for pdf in domain_pdfs
        ]

        return jsonify({
            'domain': domain,
            'pdfs': pdf_list,
            'count': len(pdf_list)
        }), 200

    except Exception as e:
        logger.error(f"Error getting PDFs: {str(e)}")
        return jsonify({'error': 'Failed to retrieve PDFs'}), 500

@app.route('/api/clear/<domain>')
def clear_pdfs(domain):
    """Clear all PDFs for a domain"""
    try:
        if domain in pdf_contents:
            pdf_contents[domain] = []
            return jsonify({'message': f'All PDFs cleared for {domain} domain'}), 200
        else:
            return jsonify({'error': 'Invalid domain'}), 400

    except Exception as e:
        logger.error(f"Error clearing PDFs: {str(e)}")
        return jsonify({'error': 'Failed to clear PDFs'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
