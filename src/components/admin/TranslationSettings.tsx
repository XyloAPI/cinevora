import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Select from '@/components/ui/select'

type TranslationProvider = 'gtx' | 'deepl'

interface TranslationSettingsResponse {
  provider: TranslationProvider
  hasDeepLKey: boolean
  deeplApiKey?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export default function TranslationSettings() {
  const [provider, setProvider] = useState<TranslationProvider>('gtx')
  const [hasDeepLKey, setHasDeepLKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [clearApiKey, setClearApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem('admin_token')

    fetch(`${API_BASE}/admin/translation-settings`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null) as TranslationSettingsResponse & { error?: string } | null
        if (!response.ok) throw new Error(data?.error || `Failed to load settings (${response.status})`)
        if (active && data) {
          setProvider(data.provider)
          setHasDeepLKey(data.hasDeepLKey)
          setApiKey(data.deeplApiKey || '')
        }
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : 'Failed to load translation settings')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const token = sessionStorage.getItem('admin_token')
      const response = await fetch(`${API_BASE}/admin/translation-settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          ...(apiKey.trim() ? { deeplApiKey: apiKey.trim() } : {}),
          clearDeepLKey: clearApiKey,
        }),
      })
      const data = await response.json().catch(() => null) as TranslationSettingsResponse & { error?: string } | null
      if (!response.ok) throw new Error(data?.error || `Failed to save settings (${response.status})`)
      if (data) {
        setProvider(data.provider)
        setHasDeepLKey(data.hasDeepLKey)
        setApiKey(data.deeplApiKey || '')
      }
      setClearApiKey(false)
      toast.success('Translation settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save translation settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="max-w-2xl">
      <h2 className="text-base font-bold mb-4">Translation Settings</h2>
      <form onSubmit={saveSettings} className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4 space-y-4">
        <div className="text-[12px] text-white/60">
          <label className="block mb-1.5">Translation provider</label>
          <div className="w-full [&>div]:block [&>div]:w-full">
            <Select
              value={provider}
              onChange={(value) => setProvider(value as TranslationProvider)}
              disabled={loading || saving}
              options={[
                { value: 'gtx', label: 'Google Translate (GTX)' },
                { value: 'deepl', label: 'DeepL' },
              ]}
              className="w-full px-3 py-2 text-[12px]"
            />
          </div>
        </div>

        {provider === 'deepl' ? (
          <>
            <label className="block text-[12px] text-white/60">
              DeepL API key
              <input
                type="text"
                autoComplete="new-password"
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value)
                  setClearApiKey(false)
                }}
                disabled={loading || saving}
                placeholder="Masukkan DeepL API key"
                className="block w-full mt-1.5 select-text bg-cinema-800 text-white px-3 py-2 rounded border border-white/[0.08] outline-none focus:border-cinema-red/50 disabled:opacity-50"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className={hasDeepLKey && !clearApiKey ? 'text-green-400' : 'text-white/40'}>
                {clearApiKey ? 'Key akan dihapus saat disimpan' : hasDeepLKey ? 'Key tersimpan di database' : 'Belum ada key tersimpan'}
              </span>
              {hasDeepLKey && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKey('')
                    setClearApiKey((current) => !current)
                  }}
                  disabled={loading || saving}
                  className="text-cinema-red hover:text-red-300 disabled:opacity-50"
                >
                  {clearApiKey ? 'Batalkan hapus' : 'Hapus key'}
                </button>
              )}
            </div>

          </>
        ) : null}

        <button
          type="submit"
          disabled={loading || saving}
          className="px-4 py-2 bg-cinema-red text-white text-[12px] font-medium rounded hover:bg-cinema-red-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan pengaturan'}
        </button>
      </form>
    </section>
  )
}
