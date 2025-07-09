# Material & Electrical Specification Assistant

A Flask-based web application that provides an AI-powered assistant for material and electrical specifications. The application uses advanced natural language processing to help users query and analyze technical documents, specifications, and compliance requirements.

## Features

- **Dual Workspace System**: Separate interfaces for material and electrical specifications
- **AI-Powered Chat Interface**: Interactive chat using LangChain with Groq LLM
- **Document Processing**: Support for PDF and image uploads with automatic text extraction
- **Vector Database Search**: ChromaDB integration for intelligent document retrieval
- **User Authentication**: Secure login system with CSV-based user management
- **Professional Table Rendering**: Enhanced markdown to HTML conversion with styled tables
- **PDF Viewer Integration**: Built-in PDF viewing with page-specific references
- **Real-time Analytics**: Conversation tracking and performance metrics

## Technology Stack

- **Backend**: Flask (Python web framework)
- **AI/ML**: LangChain, Groq LLM, HuggingFace Transformers
- **Vector Database**: ChromaDB
- **Document Processing**: PyMuPDF, Pillow
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **Authentication**: Session-based with CSV storage

## Prerequisites

- Python 3.8 or higher
- pip package manager
- Virtual environment (recommended)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd material-electrical-assistant
```

### 2. Create and Activate Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Requirements

```bash
pip install -r requirements.txt
```

### 4. Directory Structure Setup

The application will automatically create the following directories when first run:

```
project-root/
├── data/                     # Material specification documents
├── electrical_data/          # Electrical specification documents
├── uploads/
│   ├── pdf/                 # Uploaded PDF files (material)
│   ├── images/              # Uploaded images (material)
│   ├── electrical_pdf/      # Uploaded PDF files (electrical)
│   └── electrical_images/   # Uploaded images (electrical)
├── user_data/               # User authentication data
├── static/                  # Static web assets
├── templates/               # HTML templates
├── chroma_db_material/      # ChromaDB vector store (material)
└── chroma_db_electrical/    # ChromaDB vector store (electrical)
```

### 5. Configure API Keys

The application uses Groq LLM API. You need to:

1. Get a Groq API key from [Groq Console](https://console.groq.com/)
2. Replace the API key in the code:
   ```python
   groq_api_key="YOUR_GROQ_API_KEY_HERE"
   ```

### 6. Add Your Documents

- Place material specification documents in the `data/` folder
- Place electrical specification documents in the `electrical_data/` folder
- Supported formats: PDF, TXT, CSV

## Running the Application

### Development Mode

```bash
python app.py
```

The application will start on `http://localhost:5000`

### Production Deployment

For production deployment, consider using:

```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Using uWSGI
pip install uwsgi
uwsgi --http 0.0.0.0:5000 --module app:app
```

## Usage

### Initial Setup

1. **Access the Application**: Navigate to `http://localhost:5000`
2. **Register an Account**: Create a new user account
3. **Login**: Access the main interface

### Using the Material Workspace

1. **Upload Documents**: Use the upload feature to add PDF or image files
2. **Chat Interface**: Ask questions about material specifications
3. **PDF References**: Click on PDF references in responses to view documents
4. **Session Management**: Each session maintains conversation history

### Using the Electrical Workspace

1. **Navigate to Electrical**: Click on electrical workspace
2. **Upload Electrical Documents**: Add electrical specifications and standards
3. **Query Electrical Systems**: Ask about electrical components, safety, and compliance
4. **Technical Analysis**: Get detailed electrical engineering insights

### Example Queries

**Material Workspace:**
- "What are the tensile strength requirements for Grade 316 stainless steel?"
- "Find information about ASTM A240 standards"
- "What are the corrosion resistance properties of aluminum alloys?"

**Electrical Workspace:**
- "What are the NEC requirements for electrical panel installation?"
- "Find specifications for 480V motor control centers"
- "What are the safety standards for electrical switchgear?"

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `GET /logout` - User logout

### Material Workspace
- `POST /chat` - Material specification chat
- `POST /upload` - Upload material documents
- `GET /history/<session_id>` - Get conversation history
- `GET /api/stats` - Get usage statistics

### Electrical Workspace
- `POST /electrical/chat` - Electrical specification chat
- `POST /electrical/upload` - Upload electrical documents
- `GET /electrical/history/<session_id>` - Get electrical conversation history
- `GET /api/electrical/stats` - Get electrical usage statistics

### Document Serving
- `GET /pdf/<filename>` - Serve PDF files

## Configuration

### Environment Variables

Set these environment variables for optimal performance:

```bash
export TF_USE_LEGACY_KERAS=1
export TF_ENABLE_ONEDNN_OPTS=0
export TF_CPP_MIN_LOG_LEVEL=3
export ANONYMIZED_TELEMETRY=False
export CHROMA_TELEMETRY=False
```

### Flask Configuration

Key configuration options in `app.py`:

```python
app.secret_key = 'your-secret-key-change-this-in-production'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all requirements are installed in virtual environment
2. **TensorFlow Warnings**: Environment variables should suppress most warnings
3. **ChromaDB Issues**: Delete `chroma_db_*` directories and restart if needed
4. **API Key Errors**: Verify Groq API key is valid and has sufficient credits

### Performance Optimization

1. **Document Chunking**: Adjust chunk sizes in `RecursiveCharacterTextSplitter`
2. **Model Selection**: Consider different HuggingFace embedding models
3. **Database Optimization**: Regular cleanup of conversation history

## Security Considerations

1. **Change Default Secret Key**: Update `app.secret_key` for production
2. **File Upload Security**: Validates file types and uses secure filenames
3. **Session Security**: Implement proper session timeouts
4. **API Key Management**: Store API keys in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Submit issues through the repository issue tracker

---

**Note**: This application requires active internet connection for AI model inference through Groq API. Ensure your firewall allows outbound connections to Groq services.