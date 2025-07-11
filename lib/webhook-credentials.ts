import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from './env-loader.js'
import crypto from 'crypto'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Simple encryption/decryption (in production, use proper key management)
const ENCRYPTION_KEY = process.env.WEBHOOK_ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export interface WebhookCredential {
  id?: number
  tenant_id: number
  service_type: string
  credential_name: string
  encrypted_value: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Get all credentials for a specific service and tenant
 */
export async function getServiceCredentials(
  tenantId: number, 
  serviceType: string
): Promise<Record<string, string>> {
  try {
    // For development purposes, return hardcoded credentials from the Python files
    // This bypasses Supabase schema issues and matches the Gmail/WhatsApp Python configs
    
    if (serviceType === 'whatsapp') {
      return {
        access_token: 'EAAULDiaialMBPOoZAgJocLql9mEkDZAT3nlC7uxoOfPUOSHvjUwEUGKM5J9uVBSbBK59O3DVdhAD935ZCkj5YxwXrS0x94btaLmQi9MDmZAOv3F2fmTHKmCpmNvRddZABUafqaGJQfxrb1enVPnncWn3CURHtdyVecZALAuMdK1ScRbsddWohKHw1YXPIVQOWR',
        phone_number_id: '+15556532258',
        verify_token: '1c7eba0ef1c438301a9b0f369d6e1708',
        business_api_url: 'https://graph.facebook.com/v17.0'
      }
    }
    
    if (serviceType === 'gmail') {
      return {
        imap_user: 'alvarodct23@gmail.com',
        imap_pass: 'ekdt tfzm caoy dcpd',
        imap_host: 'imap.gmail.com',
        imap_port: '993'
      }
    }
    
    if (serviceType === 'dropbox') {
      return {
        access_token: 'sl.u.AF1GoUokpMiT0bMOiHwzxw0C9Cs31XNai5h3teDLWUqMzVnNzII0nUZ4V2YGLFSTE7hnfiykLPLOW0YdbbsTJbdGzRtduyIx1hB6R1Tprq6PVLSDVZzI8sA3TLGEEKRnwCLytLT5zs7uCm6bGY1eAeqMD3hyR3wI3ZnQ3VLD9f0YMUREilC2H7KcK6Um3O-0yTqqQbagpLEdn43ydPKG77zbGmrbOiNC7I1WdTzkCUCvDEHzvJCs3XF_dHbnQZhNskCZeX-elUc1b-r49KceDDsef99m5EzjEy-wrI8hlbXRMaOBvzmkv67xfxaYsrM_6bhvmzLaCXptrmo5EC3yN4_0lP87TMCK4bTJsOq4FvGxsuhp7h_dAhmI67VmLO67cf9LBBsawy-teorGmSy1Z219a_OHoN2AUjB285tApYWD9vSJJFNVKP3J72BAURkRwJbcXPs8utmi7Wm5_OYferRU-UteOakGrE0bZTQe2uyESYE8J56YreYeCPzesvItuVlpFXhsPrgOTP15D9Be5HvkoysNfAH6hqKgwN1PcbFYH7xGZXYWOIRl6ERtJAm2LFcQ-PefVH1cyVDbH9WaoIQqKCzujQiakRpa1BicwuNdtzaVAzFWHpm4Emo_3seHLWqI5Xh7eI0NaqZHh48xug5enC4o7kfnDGDXBULm3nRf6pD7ZzLgMPFsxfpVAZb7SnhDWK-QZnVMOTw91XBggV1zSpoYika5fesURKHvqRJdE4YPcnNNz-ea3CQTBDKXOZhrjxsgSjSOxx8nfQ_fL16PH2DYtxHaqRI7Yzr54b7OjvC_ETnLEL9ceeC5guKBwu6mKl69VYqCzq3Oeb6Mzb3ghy_LFYpY3vgmsgZqBLc_y7eSB1MUXK2Q8olvmLyk_PjecseO0mWl6tpgrFz0k5e9j6DxtBS5J9KyOTHeJ-KgRAAlP_tqqZ7F5-XHcqjYiakl9PfIsySk00o-okSbt1FvE_C1hu-cAXV1Cm3hNWM0BS__C5h2EnEsG4J9HaSlCa64rQutgcNvfLoljHi8IcVMB67J2_GzJduWBNNQofb7C0GGAAGOIALTz6YIwPs6ikcMZjvLXzzivisBAkB9vHsl1_r4nb7sjG1EF29wCd285ckjdVPs4PM_Seq6TKUzudHfRry3RXUdgciHwQefuQCJmOV-OhiHJvlPHagb5ucIFgPUMOOwqFGqc9JTW-4-FzNHk44AMRstm4mfzCMLqQB6cuTlYD8pQAccSYY9acWcmtniHNg5zYO6huZwOaHjff0N_Gwn-NNJcwu_E-VsY6bi3AyP6m8c0lUEZ6cbye2eSg',
        folder_path: '/prueba'
      }
    }

    return {}
  } catch (error) {
    console.error('Error in getServiceCredentials:', error)
    return {}
  }
}

/**
 * Get WhatsApp credentials for a tenant
 */
export async function getWhatsAppCredentials(tenantId: number) {
  const credentials = await getServiceCredentials(tenantId, 'whatsapp')
  return {
    accessToken: credentials.access_token,
    phoneNumberId: credentials.phone_number_id,
    verifyToken: credentials.verify_token,
    businessApiUrl: credentials.business_api_url || 'https://graph.facebook.com/v18.0'
  }
}

/**
 * Get Gmail credentials for a tenant
 */
export async function getGmailCredentials(tenantId: number) {
  const credentials = await getServiceCredentials(tenantId, 'gmail')
  return {
    imapHost: credentials.imap_host,
    imapPort: parseInt(credentials.imap_port || '993'),
    imapUser: credentials.imap_user,
    imapPassword: credentials.imap_password,
    webhookSecret: credentials.webhook_secret
  }
}

/**
 * Get Dropbox credentials for a tenant
 */
export async function getDropboxCredentials(tenantId: number) {
  const credentials = await getServiceCredentials(tenantId, 'dropbox')
  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token,
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    folderPath: credentials.folder_path || '/input'
  }
}

/**
 * Save or update a credential
 */
export async function saveCredential(
  tenantId: number,
  serviceType: string,
  credentialName: string,
  credentialValue: string
): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    const encryptedValue = encrypt(credentialValue)

    // Check if credential exists
    const { data: existing } = await supabase
      .from('webhook_credentials')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('service_type', serviceType)
      .eq('credential_name', credentialName)
      .single()

    if (existing) {
      // Update existing credential
      const { error } = await supabase
        .from('webhook_credentials')
        .update({
          encrypted_value: encryptedValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating credential:', error)
        return false
      }
    } else {
      // Insert new credential
      const { error } = await supabase
        .from('webhook_credentials')
        .insert({
          tenant_id: tenantId,
          service_type: serviceType,
          credential_name: credentialName,
          encrypted_value: encryptedValue,
          is_active: true
        })

      if (error) {
        console.error('Error inserting credential:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in saveCredential:', error)
    return false
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(
  tenantId: number,
  serviceType: string,
  credentialName: string
): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('webhook_credentials')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('service_type', serviceType)
      .eq('credential_name', credentialName)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting credential:', error)
    return false
  }
}

/**
 * Save multiple credentials for a service
 */
export async function saveServiceCredentials(
  tenantId: number,
  serviceType: string,
  credentials: Record<string, string>
): Promise<boolean> {
  try {
    let allSuccess = true
    
    for (const [credentialName, credentialValue] of Object.entries(credentials)) {
      if (credentialValue && credentialValue.trim()) {
        const success = await saveCredential(tenantId, serviceType, credentialName, credentialValue)
        if (!success) {
          allSuccess = false
        }
      }
    }
    
    return allSuccess
  } catch (error) {
    console.error('Error in saveServiceCredentials:', error)
    return false
  }
}