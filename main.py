from flask import Flask, request, jsonify
import socket

app = Flask(__name__)

DICTD_HOST = 'localhost'
DICTD_PORT = 2628

# This part is crucial for CORS
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*' # Allows any origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS' # Allow GET and OPTIONS methods
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization' # Allow specific headers
    return response

@app.route('/define')
def define_word():
    word = request.args.get('word')
    if not word:
        return jsonify({'error': 'Word parameter is missing'}), 400

    try:
        # Connect to dictd server
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((DICTD_HOST, DICTD_PORT))
            s.sendall(f'DEFINE * {word}\r\n'.encode('utf-8')) # '*' for all databases
            s.sendall(b'QUIT\r\n')

            response_lines = []
            while True:
                data = s.recv(4096).decode('utf-8', errors='ignore')
                if not data:
                    break
                response_lines.append(data)

        full_response = "".join(response_lines)

        # --- Simple parsing (you'll need more robust parsing here) ---
        definition = "Definition not found."
        # DICT protocol responses start with a 3-digit code. 150/151 means definition.
        # You'll need to parse the actual content between the '250 ok' and '.' line endings.
        if "150" in full_response or "151" in full_response:
            lines = full_response.split('\r\n')
            definition_started = False
            parsed_definition_lines = []
            for line in lines:
                if line.startswith('150') or line.startswith('151'):
                    definition_started = True
                    continue
                if line == '.': # End of definition marker
                    definition_started = False
                    break
                if definition_started:
                    parsed_definition_lines.append(line)
            definition = "\n".join(parsed_definition_lines).strip()
            if not definition: # If only headers were present but no actual text
                definition = "Definition found, but no text content."
        elif "552 No match" in full_response:
            definition = "No definition found for this word."
        elif "550 Invalid database" in full_response:
            definition = "Error: Invalid database specified or dictd misconfigured."
        else:
            definition = "Unknown dictd error or response: \n" + full_response[:200] # show part of response for debugging

        return jsonify({'word': word, 'definition': definition})

    except ConnectionRefusedError:
        return jsonify({'error': f'Could not connect to dictd at {DICTD_HOST}:{DICTD_PORT}. Is it running?'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=8000) # Run on port 8000
