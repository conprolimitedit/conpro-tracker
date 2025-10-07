import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

// GET /api/video?id=galleryItemId
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return new NextResponse('Missing id', { status: 400 })
    }

    // Fetch gallery item to get file path and mime type
    const { data: item, error } = await supabase
      .from('project_gallery')
      .select('file_data')
      .eq('id', id)
      .single()

    if (error || !item) {
      return new NextResponse('Item not found', { status: 404 })
    }

    const fileData = item.file_data || {}
    const path = fileData?.upload_response?.path
    const contentType = fileData?.type || 'video/mp4'

    if (!path) {
      return new NextResponse('File path missing', { status: 404 })
    }

    // Generate a signed URL (works with private or public buckets)
    const { data: signed } = supabase.storage
      .from('conproProjectsBucket')
      .createSignedUrl(path, 60) // 60 seconds

    const fileUrl = signed?.signedUrl
    if (!fileUrl) {
      return new NextResponse('Unable to sign URL', { status: 500 })
    }

    const range = request.headers.get('range')
    // Do a HEAD to get the content length from storage
    const headRes = await fetch(fileUrl, { method: 'HEAD' })
    if (!headRes.ok) {
      return new NextResponse('Upstream not available', { status: 502 })
    }
    const sizeHeader = headRes.headers.get('content-length')
    const fileSize = sizeHeader ? parseInt(sizeHeader, 10) : undefined

    let start = 0
    let end = (fileSize || 0) - 1
    const chunkSize = 1 * 1024 * 1024 // 1MB default chunk

    if (range && fileSize) {
      const match = /bytes=(\d+)-(\d*)/.exec(range)
      if (match) {
        start = parseInt(match[1], 10)
        const endStr = match[2]
        end = endStr ? parseInt(endStr, 10) : Math.min(start + chunkSize - 1, fileSize - 1)
      }
    } else if (fileSize) {
      end = Math.min(start + chunkSize - 1, fileSize - 1)
    }

    const headers = new Headers()
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Type', contentType)

    const upstreamHeaders = {}
    if (fileSize) {
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      headers.set('Content-Length', String(end - start + 1))
      upstreamHeaders['Range'] = `bytes=${start}-${end}`
    }

    const upstream = await fetch(fileUrl, { headers: upstreamHeaders })
    if (!upstream.ok && upstream.status !== 206 && upstream.status !== 200) {
      return new NextResponse('Upstream fetch failed', { status: 502 })
    }

    const status = fileSize ? 206 : 200
    return new NextResponse(upstream.body, { status, headers })

  } catch (e) {
    return new NextResponse('Server error', { status: 500 })
  }
}


