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

DROPBOX_TOKEN = "sl.u.AF1GoUokpMiT0bMOiHwzxw0C9Cs31XNai5h3teDLWUqMzVnNzII0nUZ4V2YGLFSTE7hnfiykLPLOW0YdbbsTJbdGzRtduyIx1hB6R1Tprq6PVLSDVZzI8sA3TLGEEKRnwCLytLT5zs7uCm6bGY1eAeqMD3hyR3wI3ZnQ3VLD9f0YMUREilC2H7KcK6Um3O-0yTqqQbagpLEdn43ydPKG77zbGmrbOiNC7I1WdTzkCUCvDEHzvJCs3XF_dHbnQZhNskCZeX-elUc1b-r49KceDDsef99m5EzjEy-wrI8hlbXRMaOBvzmkv67xfxaYsrM_6bhvmzLaCXptrmo5EC3yN4_0lP87TMCK4bTJsOq4FvGxsuhp7h_dAhmI67VmLO67cf9LBBsawy-teorGmSy1Z219a_OHoN2AUjB285tApYWD9vSJJFNVKP3J72BAURkRwJbcXPs8utmi7Wm5_OYferRU-UteOakGrE0bZTQe2uyESYE8J56YreYeCPzesvItuVlpFXhsPrgOTP15D9Be5HvkoysNfAH6hqKgwN1PcbFYH7xGZXYWOIRl6ERtJAm2LFcQ-PefVH1cyVDbH9WaoIQqKCzujQiakRpa1BicwuNdtzaVAzFWHpm4Emo_3seHLWqI5Xh7eI0NaqZHh48xug5enC4o7kfnDGDXBULm3nRf6pD7ZzLgMPFsxfpVAZb7SnhDWK-QZnVMOTw91XBggV1zSpoYika5fesURKHvqRJdE4YPcnNNz-ea3CQTBDKXOZhrjxsgSjSOxx8nfQ_fL16PH2DYtxHaqRI7Yzr54b7OjvC_ETnLEL9ceeC5guKBwu6mKl69VYqCzq3Oeb6Mzb3ghy_LFYpY3vgmsgZqBLc_y7eSB1MUXK2Q8olvmLyk_PjecseO0mWl6tpgrFz0k5e9j6DxtBS5J9KyOTHeJ-KgRAAlP_tqqZ7F5-XHcqjYiakl9PfIsySk00o-okSbt1FvE_C1hu-cAXV1Cm3hNWM0BS__C5h2EnEsG4J9HaSlCa64rQutgcNvfLoljHi8IcVMB67J2_GzJduWBNNQofb7C0GGAAGOIALTz6YIwPs6ikcMZjvLXzzivisBAkB9vHsl1_r4nb7sjG1EF29wCd285ckjdVPs4PM_Seq6TKUzudHfRry3RXUdgciHwQefuQCJmOV-OhiHJvlPHagb5ucIFgPUMOOwqFGqc9JTW-4-FzNHk44AMRstm4mfzCMLqQB6cuTlYD8pQAccSYY9acWcmtniHNg5zYO6huZwOaHjff0N_Gwn-NNJcwu_E-VsY6bi3AyP6m8c0lUEZ6cbye2eSg"
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
