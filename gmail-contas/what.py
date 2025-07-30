import requests
import os
import json
import time
import dropbox
from flask import Flask, request, jsonify
from datetime import datetime
import threading
import mimetypes

# ============================
# CONFIGURACIÓN
# ============================
WHATSAPP_ACCESS_TOKEN = "EAAULDiaialMBPOoZAgJocLql9mEkDZAT3nlC7uxoOfPUOSHvjUwEUGKM5J9uVBSbBK59O3DVdhAD935ZCkj5YxwXrS0x94btaLmQi9MDmZAOv3F2fmTHKmCpmNvRddZABUafqaGJQfxrb1enVPnncWn3CURHtdyVecZALAuMdK1ScRbsddWohKHw1YXPIVQOWR"
WHATSAPP_PHONE_NUMBER_ID = "+15556532258"
WHATSAPP_BUSINESS_API_URL = "https://graph.facebook.com/v17.0"
WEBHOOK_VERIFY_TOKEN = "1c7eba0ef1c438301a9b0f369d6e1708"  # Cambia esto por tu token de verificación

DROPBOX_TOKEN = "sl.u.AF4SKa1wTX3Wxs0GLk-N0YVNkBhybyuX1xsem9C1vpEXRBgBnnmPMbYkKtvZnZ_Pmm0wm9e_LDX9kV05mWT8aaLh3UGRXmBvgE0EZu0zYk5lMU_I5OpmBn66EwN21FR0GUaD9xIAjq-avkj4W71dqy5aXgp-cuGun6-SO6ACHpeuXHev_BL9bT2X_iG4m3vwf7YTeFmnxk4L9zxnTLwMylbpe-qSIKHplsUb73OrkXfQ8tSFuMmgXbBXPO2LB-DRdBPEz9lLstYA45WlAIwzn0SIU6B0vyHwVQEw3gNIlTKCvNNXRXy5uwV4AOKZiM-Wc_G0CVhgc_yvg5mbYm58Jw4p9V41vChOMpGHUs6iAkMMlTTkD-qtxrK-WY2fSpeQvD_K1qfVSiHISePxR3pPplE-TQeLZjdWlOaZF4KwiXJDQYXk_jEsxDh70UNb6H4fsdp8YnnkL3U9YhCsxvuya6HkmkqYsyu27rB8A_sFEPpV8rxrof1lcckBkYYGdBDGCA8rSpKG8dYtbA8_zObOPF3AyliuCa1DbOYuQWQGyGJY6XXw6iLwOKILYeJIhKQoz2aiUThV79y2vSjTP8kBn8W3C7J_Joo5Ak7jMwTJDpjUi-0BnJ4jMbAbJqbf-5nRrTJt1ENszbzFx6yrJV6KRUh-1e-xHUDGfbwgiSToQMiM07sG4cusGJzyu8jA0ZH5NEgdO_XvBQlCqz-1VBPiWFU40moLcXZ1CkSDUGyFG-7TXSB1C--Z3Gsvg_6fMS3X5kZ4nEAlK7ZFw6BA0UFreP0lre5QNENQgpM3f7GizATpRTl_fSx3yHb3LgXNPspZhQ3AGje8UnTWy0_94KGShSVI8jxMd8wgNBf4N1wLW3NMz_Y1x3HwOcPgn1YmfEwGkaXqCGcFzWnPdBQ0ab9S7sWAQuAeX23cMRYrEupy6N2j1SPK8WezVkAymJzc30IgzYk9J3WZXkvFEVAFZaikp-fD_N390-B9deR9Xj4XfwCup0urmEzo93582fh97hZ4CHSSculyz8G3ZPe0QZgJU5eBPedPnhZFrNDS0elieSLgXrCRTal6z9pX8M3lky5tcwzymVuxUbfXgbeYUpfTKFJm0nkKBQzfNrFeSmfi8srFOiuWIWiZGlSRpHU8M3z7E_SrNqsPgqaeAd48t4rZV0a3PW39N6UR6JFjiV6ejczBSnAEMlhf5iu7sK3ycbeC63kiEip2S58qVSS4toklTuI0StqHTYCv1rpjQuvxzbxJ6AByLyJKGoskNR9sZk4C6JLflNZrV-9dLEoSNoYTtKB6HeYaryan-CVm3s2SexmaTA"
DROPBOX_FOLDER = "/prueba"

# Variable global para controlar el timestamp de inicio
SERVER_START_TIME = None

# Modo de prueba (para testing sin hacer llamadas reales a WhatsApp API)
DEBUG_MODE = False

# ============================
# CONFIGURACIÓN FLASK
# ============================
app = Flask(__name__)

# ============================
# CONEXIÓN DROPBOX
# ============================
def init_dropbox():
    try:
        dbx = dropbox.Dropbox(DROPBOX_TOKEN)
        dbx.users_get_current_account()
        print("✅ Conectado a Dropbox exitosamente")
        return dbx
    except Exception as e:
        print(f"❌ Error al conectar con Dropbox: {e}")
        return None

# ============================
# FUNCIONES WHATSAPP
# ============================
def get_media_url(media_id):
    """Obtiene la URL del archivo multimedia de WhatsApp"""
    url = f"{WHATSAPP_BUSINESS_API_URL}/{media_id}"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"
    }
    
    try:
        print(f"🔍 Obteniendo URL para media ID: {media_id}")
        response = requests.get(url, headers=headers)
        print(f"📡 Respuesta de WhatsApp API: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        media_url = data.get("url")
        print(f"🔗 URL obtenida: {media_url}")
        return media_url
    except Exception as e:
        print(f"❌ Error al obtener URL del archivo: {e}")
        print(f"📝 URL solicitada: {url}")
        print(f"📝 Headers: {headers}")
        return None

def download_media(media_url, filename):
    """Descarga el archivo multimedia de WhatsApp"""
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"
    }
    
    try:
        response = requests.get(media_url, headers=headers)
        response.raise_for_status()
        
        # Crear carpeta temporal si no existe
        temp_dir = os.path.join(os.path.expanduser("~"), "Downloads", "whatsapp_temp")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Guardar archivo temporalmente
        local_path = os.path.join(temp_dir, filename)
        with open(local_path, "wb") as f:
            f.write(response.content)
        
        print(f"📥 Archivo descargado: {local_path}")
        return local_path
    except Exception as e:
        print(f"❌ Error al descargar archivo: {e}")
        return None

def upload_to_dropbox(file_path, filename, dbx):
    """Sube el archivo a Dropbox"""
    try:
        # Crear nombre seguro para el archivo
        safe_filename = "".join(c if c.isalnum() or c in (' ','.','_','-') else "_" for c in filename)
        
        # Agregar timestamp para evitar conflictos
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name_parts = safe_filename.rsplit('.', 1)
        if len(name_parts) == 2:
            safe_filename = f"{name_parts[0]}_{timestamp}.{name_parts[1]}"
        else:
            safe_filename = f"{safe_filename}_{timestamp}"
        
        dropbox_path = f"{DROPBOX_FOLDER}/{safe_filename}"
        
        with open(file_path, "rb") as f:
            dbx.files_upload(f.read(), dropbox_path, mode=dropbox.files.WriteMode.overwrite)
        
        print(f"☁️  Archivo subido a Dropbox: {dropbox_path}")
        
        # Eliminar archivo temporal
        os.remove(file_path)
        print(f"🗑️  Archivo temporal eliminado")
        
        return True
    except Exception as e:
        print(f"❌ Error al subir a Dropbox: {e}")
        return False

def process_whatsapp_message(message_data):
    """Procesa un mensaje de WhatsApp y maneja archivos multimedia"""
    try:
        messages = message_data.get("messages", [])
        
        if not messages:
            return
        
        message = messages[0]
        message_type = message.get("type")
        
        # Verificar timestamp del mensaje - solo procesar mensajes nuevos
        message_timestamp = int(message.get("timestamp", 0))
        if SERVER_START_TIME and message_timestamp < SERVER_START_TIME:
            print(f"⏭️  Mensaje anterior al inicio del servidor - Ignorado (timestamp: {message_timestamp})")
            return
        
        from_number = message.get("from", "Número desconocido")
        print(f"📱 Nuevo mensaje de WhatsApp - Tipo: {message_type} - De: {from_number}")
        print(f"⏰ Timestamp del mensaje: {message_timestamp}")
        
        # Inicializar Dropbox
        dbx = init_dropbox()
        if not dbx:
            print("❌ No se pudo conectar a Dropbox")
            return
        
        # Procesar según el tipo de mensaje
        if message_type == "image":
            image_data = message.get("image", {})
            media_id = image_data.get("id")
            caption = image_data.get("caption", "")
            
            if media_id:
                print(f"🖼️  Procesando imagen: {media_id}")
                if caption:
                    print(f"   💬 Descripción: {caption}")
                
                if DEBUG_MODE:
                    # Modo debug - simular proceso sin hacer llamadas reales
                    print("🧪 MODO DEBUG: Simulando descarga de imagen...")
                    filename = f"whatsapp_image_{media_id}.jpg"
                    print(f"📥 Simulando descarga: {filename}")
                    print(f"☁️  Simulando subida a Dropbox: {DROPBOX_FOLDER}/{filename}")
                    print("✅ Imagen procesada exitosamente (simulado)")
                else:
                    # Obtener URL del archivo
                    media_url = get_media_url(media_id)
                    if media_url:
                        # Crear nombre de archivo
                        filename = f"whatsapp_image_{media_id}.jpg"
                        
                        # Descargar archivo
                        local_path = download_media(media_url, filename)
                        if local_path:
                            # Subir a Dropbox
                            upload_to_dropbox(local_path, filename, dbx)
                            print("✅ Imagen procesada exitosamente")
                        else:
                            print("❌ Error al descargar imagen")
                    else:
                        print("❌ No se pudo obtener URL de la imagen")
        
        elif message_type == "document":
            document_data = message.get("document", {})
            media_id = document_data.get("id")
            filename = document_data.get("filename", f"whatsapp_document_{media_id}")
            mime_type = document_data.get("mime_type", "")
            
            if media_id:
                print(f"📄 Procesando documento: {filename}")
                print(f"   📝 Tipo MIME: {mime_type}")
                
                # Verificar si es PDF o imagen
                is_pdf = mime_type == "application/pdf" or filename.lower().endswith('.pdf')
                is_image = mime_type.startswith("image/") or filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'))
                
                if is_pdf or is_image:
                    if DEBUG_MODE:
                        # Modo debug - simular proceso sin hacer llamadas reales
                        print("🧪 MODO DEBUG: Simulando descarga de documento...")
                        print(f"📥 Simulando descarga: {filename}")
                        print(f"☁️  Simulando subida a Dropbox: {DROPBOX_FOLDER}/{filename}")
                        print("✅ Documento procesado exitosamente (simulado)")
                    else:
                        # Obtener URL del archivo
                        media_url = get_media_url(media_id)
                        if media_url:
                            # Descargar archivo
                            local_path = download_media(media_url, filename)
                            if local_path:
                                # Subir a Dropbox
                                upload_to_dropbox(local_path, filename, dbx)
                                print("✅ Documento procesado exitosamente")
                            else:
                                print("❌ Error al descargar documento")
                        else:
                            print("❌ No se pudo obtener URL del documento")
                else:
                    print(f"⏭️  Tipo de archivo no soportado: {mime_type}")
        
        else:
            print(f"⏭️  Tipo de mensaje no soportado: {message_type}")
            
    except Exception as e:
        print(f"❌ Error al procesar mensaje: {e}")

# ============================
# WEBHOOK ENDPOINTS
# ============================
@app.route('/webhook', methods=['GET'])
def webhook_verification():
    """Verificación del webhook de WhatsApp"""
    verify_token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    
    print(f"🔐 Verificando webhook - Token recibido: {verify_token}")
    
    if verify_token == WEBHOOK_VERIFY_TOKEN:
        print("✅ Webhook verificado exitosamente")
        return challenge
    else:
        print("❌ Token de verificación incorrecto")
        return "Error de verificación", 403

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    """Maneja los mensajes entrantes de WhatsApp"""
    try:
        data = request.json
        print(f"📨 Webhook recibido: {json.dumps(data, indent=2)}")
        
        # Verificar que hay cambios en los mensajes
        if 'entry' in data:
            for entry in data['entry']:
                if 'changes' in entry:
                    for change in entry['changes']:
                        if change.get('field') == 'messages':
                            value = change.get('value', {})
                            if 'messages' in value:
                                print("🔄 Procesando mensaje...")
                                # Procesar el mensaje en un hilo separado
                                threading.Thread(
                                    target=process_whatsapp_message,
                                    args=(value,)
                                ).start()
        
        return jsonify({"status": "ok"}), 200
    
    except Exception as e:
        print(f"❌ Error en webhook: {e}")
        return jsonify({"error": str(e)}), 500

# ============================
# FUNCIÓN PRINCIPAL
# ============================
def main():
    """Función principal para iniciar el servidor"""
    global SERVER_START_TIME
    
    print("🚀 WhatsApp Media Sync - Iniciando...")
    print("📱 Esperando mensajes de WhatsApp con imágenes y PDFs")
    print("☁️  Los archivos se subirán a Dropbox: /prueba/")
    if DEBUG_MODE:
        print("🧪 MODO DEBUG ACTIVADO - Las descargas serán simuladas")
    print("=" * 50)
    
    # Verificar conexión inicial a Dropbox
    dbx = init_dropbox()
    if not dbx:
        print("❌ No se pudo verificar la conexión a Dropbox")
        print("🔧 Verifica tu token de Dropbox")
        return
    
    # Establecer timestamp de inicio del servidor
    SERVER_START_TIME = int(time.time())
    print(f"⏰ Servidor iniciado en timestamp: {SERVER_START_TIME}")
    print("🔄 Solo se procesarán mensajes NUEVOS (posteriores a este momento)")
    
    print("🌐 Iniciando servidor webhook...")
    print("📡 Webhook URL: http://localhost:5000/webhook")
    print("🔗 Configura esta URL en tu aplicación de WhatsApp Business")
    print(f"🔐 Token de verificación: {WEBHOOK_VERIFY_TOKEN}")
    print("=" * 50)
    
    # Iniciar servidor Flask
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == "__main__":
    main()
