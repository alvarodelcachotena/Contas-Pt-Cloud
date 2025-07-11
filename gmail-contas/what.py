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

DROPBOX_TOKEN = "sl.u.AF1GoUokpMiT0bMOiHwzxw0C9Cs31XNai5h3teDLWUqMzVnNzII0nUZ4V2YGLFSTE7hnfiykLPLOW0YdbbsTJbdGzRtduyIx1hB6R1Tprq6PVLSDVZzI8sA3TLGEEKRnwCLytLT5zs7uCm6bGY1eAeqMD3hyR3wI3ZnQ3VLD9f0YMUREilC2H7KcK6Um3O-0yTqqQbagpLEdn43ydPKG77zbGmrbOiNC7I1WdTzkCUCvDEHzvJCs3XF_dHbnQZhNskCZeX-elUc1b-r49KceDDsef99m5EzjEy-wrI8hlbXRMaOBvzmkv67xfxaYsrM_6bhvmzLaCXptrmo5EC3yN4_0lP87TMCK4bTJsOq4FvGxsuhp7h_dAhmI67VmLO67cf9LBBsawy-teorGmSy1Z219a_OHoN2AUjB285tApYWD9vSJJFNVKP3J72BAURkRwJbcXPs8utmi7Wm5_OYferRU-UteOakGrE0bZTQe2uyESYE8J56YreYeCPzesvItuVlpFXhsPrgOTP15D9Be5HvkoysNfAH6hqKgwN1PcbFYH7xGZXYWOIRl6ERtJAm2LFcQ-PefVH1cyVDbH9WaoIQqKCzujQiakRpa1BicwuNdtzaVAzFWHpm4Emo_3seHLWqI5Xh7eI0NaqZHh48xug5enC4o7kfnDGDXBULm3nRf6pD7ZzLgMPFsxfpVAZb7SnhDWK-QZnVMOTw91XBggV1zSpoYika5fesURKHvqRJdE4YPcnNNz-ea3CQTBDKXOZhrjxsgSjSOxx8nfQ_fL16PH2DYtxHaqRI7Yzr54b7OjvC_ETnLEL9ceeC5guKBwu6mKl69VYqCzq3Oeb6Mzb3ghy_LFYpY3vgmsgZqBLc_y7eSB1MUXK2Q8olvmLyk_PjecseO0mWl6tpgrFz0k5e9j6DxtBS5J9KyOTHeJ-KgRAAlP_tqqZ7F5-XHcqjYiakl9PfIsySk00o-okSbt1FvE_C1hu-cAXV1Cm3hNWM0BS__C5h2EnEsG4J9HaSlCa64rQutgcNvfLoljHi8IcVMB67J2_GzJduWBNNQofb7C0GGAAGOIALTz6YIwPs6ikcMZjvLXzzivisBAkB9vHsl1_r4nb7sjG1EF29wCd285ckjdVPs4PM_Seq6TKUzudHfRry3RXUdgciHwQefuQCJmOV-OhiHJvlPHagb5ucIFgPUMOOwqFGqc9JTW-4-FzNHk44AMRstm4mfzCMLqQB6cuTlYD8pQAccSYY9acWcmtniHNg5zYO6huZwOaHjff0N_Gwn-NNJcwu_E-VsY6bi3AyP6m8c0lUEZ6cbye2eSg"
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
