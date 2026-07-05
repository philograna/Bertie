import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GOOGLE_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? ''

// Mappa tipi Google → categorie Bertie
function classify(types: string[]): string {
  if (types.includes('park') || types.includes('natural_feature')) return 'parco'
  if (types.includes('veterinary_care')) return 'veterinario'
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('bar')) return 'ristorante'
  if (types.includes('lodging')) return 'hotel'
  if (types.includes('pet_store')) return 'toelettatore'
  return 'altro'
}

async function searchPlaces(lat: number, lng: number, type: string, keyword?: string) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '3000',
    type,
    language: 'it',
    key: GOOGLE_KEY,
    ...(keyword ? { keyword } : {}),
  })
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { lat, lng } = await req.json()
    if (!lat || !lng) return new Response(JSON.stringify({ error: 'missing coords' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    })

    // Ricerche parallele per categoria
    const [parks, vets, restaurants, hotels, groomers] = await Promise.all([
      searchPlaces(lat, lng, 'park'),
      searchPlaces(lat, lng, 'veterinary_care'),
      searchPlaces(lat, lng, 'restaurant', 'cani ammessi'),
      searchPlaces(lat, lng, 'lodging', 'pet friendly'),
      searchPlaces(lat, lng, 'pet_store', 'toelettatura cani'),
    ])

    const seen = new Set<string>()
    const places: object[] = []

    for (const p of [...parks, ...vets, ...restaurants, ...hotels, ...groomers]) {
      if (seen.has(p.place_id)) continue
      seen.add(p.place_id)

      const cat = classify(p.types ?? [])
      if (cat === 'altro') continue

      places.push({
        id: p.place_id,
        name: p.name,
        address: p.vicinity ?? '',
        city: '',
        lat: p.geometry?.location?.lat,
        lng: p.geometry?.location?.lng,
        type: cat,
        rating: p.rating ?? null,
        open_now: p.opening_hours?.open_now ?? null,
      })
    }

    return new Response(JSON.stringify({ places }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
