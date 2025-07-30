import imaplib
import email
import os
from email import policy
from email.parser import BytesParser
import dropbox

# ============================
# CONFIGURACIÓN
# ============================
IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
IMAP_USER = "alvarodct23@gmail.com"
IMAP_PASS = "ekdt tfzm caoy dcpd"

DROPBOX_TOKEN = "sl.u.AF4SKa1wTX3Wxs0GLk-N0YVNkBhybyuX1xsem9C1vpEXRBgBnnmPMbYkKtvZnZ_Pmm0wm9e_LDX9kV05mWT8aaLh3UGRXmBvgE0EZu0zYk5lMU_I5OpmBn66EwN21FR0GUaD9xIAjq-avkj4W71dqy5aXgp-cuGun6-SO6ACHpeuXHev_BL9bT2X_iG4m3vwf7YTeFmnxk4L9zxnTLwMylbpe-qSIKHplsUb73OrkXfQ8tSFuMmgXbBXPO2LB-DRdBPEz9lLstYA45WlAIwzn0SIU6B0vyHwVQEw3gNIlTKCvNNXRXy5uwV4AOKZiM-Wc_G0CVhgc_yvg5mbYm58Jw4p9V41vChOMpGHUs6iAkMMlTTkD-qtxrK-WY2fSpeQvD_K1qfVSiHISePxR3pPplE-TQeLZjdWlOaZF4KwiXJDQYXk_jEsxDh70UNb6H4fsdp8YnnkL3U9YhCsxvuya6HkmkqYsyu27rB8A_sFEPpV8rxrof1lcckBkYYGdBDGCA8rSpKG8dYtbA8_zObOPF3AyliuCa1DbOYuQWQGyGJY6XXw6iLwOKILYeJIhKQoz2aiUThV79y2vSjTP8kBn8W3C7J_Joo5Ak7jMwTJDpjUi-0BnJ4jMbAbJqbf-5nRrTJt1ENszbzFx6yrJV6KRUh-1e-xHUDGfbwgiSToQMiM07sG4cusGJzyu8jA0ZH5NEgdO_XvBQlCqz-1VBPiWFU40moLcXZ1CkSDUGyFG-7TXSB1C--Z3Gsvg_6fMS3X5kZ4nEAlK7ZFw6BA0UFreP0lre5QNENQgpM3f7GizATpRTl_fSx3yHb3LgXNPspZhQ3AGje8UnTWy0_94KGShSVI8jxMd8wgNBf4N1wLW3NMz_Y1x3HwOcPgn1YmfEwGkaXqCGcFzWnPdBQ0ab9S7sWAQuAeX23cMRYrEupy6N2j1SPK8WezVkAymJzc30IgzYk9J3WZXkvFEVAFZaikp-fD_N390-B9deR9Xj4XfwCup0urmEzo93582fh97hZ4CHSSculyz8G3ZPe0QZgJU5eBPedPnhZFrNDS0elieSLgXrCRTal6z9pX8M3lky5tcwzymVuxUbfXgbeYUpfTKFJm0nkKBQzfNrFeSmfi8srFOiuWIWiZGlSRpHU8M3z7E_SrNqsPgqaeAd48t4rZV0a3PW39N6UR6JFjiV6ejczBSnAEMlhf5iu7sK3ycbeC63kiEip2S58qVSS4toklTuI0StqHTYCv1rpjQuvxzbxJ6AByLyJKGoskNR9sZk4C6JLflNZrV-9dLEoSNoYTtKB6HeYaryan-CVm3s2SexmaTA"
DROPBOX_FOLDER = "/prueba"

# ============================
# INICIO
# ============================
print("🚀 Gmail PDF Sync - Iniciando...")
print("🔍 Buscando emails NUEVOS con PDFs adjuntos")
print("=" * 50)

# ============================
# CONEXIÓN IMAP
# ============================
print("📡 Conectando a Gmail...")
mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
mail.login(IMAP_USER, IMAP_PASS)
mail.select("INBOX")
print("✅ Conectado exitosamente")

# Busca solo emails NUEVOS (no leídos)
status, messages = mail.search(None, 'UNSEEN')
if status != 'OK' or not messages[0]:
    print("📭 No hay emails nuevos")
    mail.logout()
    exit()

mail_ids = messages[0].split()
print(f"📧 Encontrados {len(mail_ids)} emails nuevos")

# ============================
# CONEXIÓN DROPBOX
# ============================
print("☁️  Conectando a Dropbox...")
try:
    dbx = dropbox.Dropbox(DROPBOX_TOKEN)
    # Verificar que la conexión funciona
    dbx.users_get_current_account()
    print("✅ Conectado a Dropbox exitosamente")
except Exception as e:
    print(f"❌ Error al conectar con Dropbox: {e}")
    print("🔧 Verifica tu token de Dropbox")
    mail.logout()
    exit()

# ============================
# RECORRER EMAILS NUEVOS
# ============================
pdfs_encontrados = 0

for mail_id in mail_ids:
    status, data = mail.fetch(mail_id, "(RFC822)")
    raw_email = data[0][1]

    # parsear el email
    msg = BytesParser(policy=policy.default).parsebytes(raw_email)
    
    # Obtener información del email
    subject = msg.get('Subject', 'Sin asunto')
    sender = msg.get('From', 'Remitente desconocido')
    print(f"\n📨 Procesando email de: {sender}")
    print(f"   Asunto: {subject}")
    
    email_tiene_pdf = False

    for part in msg.walk():
        content_disposition = part.get("Content-Disposition")
        if content_disposition and "attachment" in content_disposition:
            filename = part.get_filename()
            if filename and filename.lower().endswith(".pdf"):
                email_tiene_pdf = True
                pdfs_encontrados += 1
                
                file_data = part.get_payload(decode=True)
                safe_filename = "".join(c if c.isalnum() or c in (' ','.','_','-') else "_" for c in filename)
                local_path = os.path.join(os.path.expanduser("~"), "Downloads", safe_filename)

                # Guardar local
                with open(local_path, "wb") as f:
                    f.write(file_data)

                print(f"   📎 PDF encontrado: {filename}")
                print(f"   💾 Descargado: {local_path}")

                # Subir a Dropbox
                dropbox_dest = f"{DROPBOX_FOLDER}/{safe_filename}"
                try:
                    with open(local_path, "rb") as f:
                        dbx.files_upload(f.read(), dropbox_dest, mode=dropbox.files.WriteMode.overwrite)
                    print(f"   ✅ Subido a Dropbox: {dropbox_dest}")
                    
                    # Opcional: eliminar archivo local después de subirlo
                    # os.remove(local_path)
                    
                except Exception as e:
                    print(f"   ❌ Error al subir a Dropbox: {e}")
                    print(f"   📁 Archivo mantenido localmente")
    
    # Marcar email como leído (para que no se vuelva a procesar)
    mail.store(mail_id, '+FLAGS', '\\Seen')
    
    if not email_tiene_pdf:
        print(f"   ⏭️  Sin PDFs adjuntos - Email marcado como leído")

# ============================
# RESUMEN Y CERRAR
# ============================
print(f"\n📊 RESUMEN:")
print(f"   📧 Emails nuevos procesados: {len(mail_ids)}")
print(f"   📎 PDFs encontrados y subidos: {pdfs_encontrados}")
print(f"   ✅ Proceso completado")

mail.logout()
