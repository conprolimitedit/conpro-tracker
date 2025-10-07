import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

// GET /api/projects/slug/[slug]/gallery - Get all gallery items for a project
export async function GET(request, { params }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const offset = (page - 1) * limit
    const album = searchParams.get('album') || null

    console.log(`🚀 Fetching gallery items for project slug: ${slug}, page: ${page}, limit: ${limit}`)

    // Get total count
    let countQuery = supabase
      .from('project_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)
    if (album && album.trim() !== '') {
      countQuery = countQuery.eq('album_name', album)
    }
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Count error:', countError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch gallery count',
        details: countError.message
      }, { status: 500 })
    }

    // Get paginated items
    let listQuery = supabase
      .from('project_gallery')
      .select('*')
      .eq('project_slug', slug)
    if (album && album.trim() !== '') {
      listQuery = listQuery.eq('album_name', album)
    }
    const { data: galleryItems, error } = await listQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch gallery items',
        details: error.message
      }, { status: 500 })
    }

    const hasMore = offset + galleryItems.length < count
    const total = count || 0

    console.log(`✅ Gallery items fetched successfully: ${galleryItems?.length || 0} items (page ${page}/${Math.ceil(total / limit)})`)

    return NextResponse.json({
      success: true,
      items: galleryItems || [],
      total,
      hasMore,
      page,
      limit
    })

  } catch (error) {
    console.error('💥 Get gallery items error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/projects/slug/[slug]/gallery - Upload new gallery items
export async function POST(request, { params }) {
  try {
    const { slug } = params
    console.log('🚀 Uploading gallery items for project slug:', slug)

    const contentType = request.headers.get('content-type')
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        error: 'Content-Type must be multipart/form-data'
      }, { status: 400 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files')
    const descriptions = formData.getAll('descriptions') || []
    const comments = formData.getAll('comments') || []
    const album = (formData.get('album') || '').toString()

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 })
    }

    // Get project ID from slug
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id')
      .eq('project_slug', slug)
      .single()

    if (projectError || !project) {
      console.error('❌ Project not found:', projectError)
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    const uploadedItems = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const description = descriptions[i] || ''
      const comment = comments[i] || ''

      if (!file || file.size === 0) continue

      try {
        // Generate unique filename
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `projects/${slug}/gallery/${fileName}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('conproProjectsBucket')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error(`❌ Upload error for ${file.name}:`, uploadError)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('conproProjectsBucket')
          .getPublicUrl(filePath)

        // Create thumbnail URL (for images)
        const isImage = file.type.startsWith('image/')
        const thumbnailUrl = isImage ? urlData.publicUrl : null

        // Prepare file data JSON
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
          thumbnail: thumbnailUrl,
          description: description,
          file_type: 'file',
          comment: comment,
          upload_response: {
            path: uploadData.path,
            id: uploadData.id,
            fullPath: uploadData.fullPath,
            name: uploadData.name,
            size: uploadData.size,
            mimeType: uploadData.mimeType,
            etag: uploadData.etag,
            createdAt: uploadData.createdAt,
            updatedAt: uploadData.updatedAt,
            bucketId: uploadData.bucketId,
            lastAccessedAt: uploadData.lastAccessedAt,
            metadata: uploadData.metadata
          }
        }

         // Save to database
        const { data: dbData, error: dbError } = await supabase
           .from('project_gallery')
           .insert({
             project_id: project.project_id,
             project_slug: slug,
            file_data: fileData,
            album_name: album || null
           })
           .select()
           .single()

        if (dbError) {
          console.error(`❌ Database error for ${file.name}:`, dbError)
          continue
        }

        uploadedItems.push({
          id: dbData.id,
          ...fileData,
          created_at: dbData.created_at,
          updated_at: dbData.updated_at
        })

        console.log(`✅ Successfully uploaded: ${file.name}`)

      } catch (fileError) {
        console.error(`❌ Error processing file ${file.name}:`, fileError)
        continue
      }
    }

    console.log(`✅ Gallery upload completed: ${uploadedItems.length} items uploaded`)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedItems.length} gallery items`,
      items: uploadedItems
    })

  } catch (error) {
    console.error('💥 Upload gallery items error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/projects/slug/[slug]/gallery - Delete gallery items
export async function DELETE(request, { params }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')
    const albumName = searchParams.get('album')

    console.log('🚀 Deleting gallery content for project slug:', slug, 'itemId:', itemId, 'album:', albumName)

    // Delete entire album (all items)
    if (albumName && albumName.trim() !== '') {
      // Fetch all items in album to collect storage paths
      const { data: albumItems, error: fetchAlbumErr } = await supabase
        .from('project_gallery')
        .select('id, file_data')
        .eq('project_slug', slug)
        .eq('album_name', albumName)

      if (fetchAlbumErr) {
        console.error('❌ Failed to fetch album items:', fetchAlbumErr)
        return NextResponse.json({ success: false, error: 'Failed to fetch album items' }, { status: 500 })
      }

      const pathsToDelete = (albumItems || [])
        .map(i => i?.file_data?.upload_response?.path)
        .filter(Boolean)

      if (pathsToDelete.length > 0) {
        const { error: removeErr } = await supabase.storage
          .from('conproProjectsBucket')
          .remove(pathsToDelete)
        if (removeErr) {
          console.warn('⚠️ Some storage files could not be deleted:', removeErr)
        }
      }

      const { error: dbDeleteErr } = await supabase
        .from('project_gallery')
        .delete()
        .eq('project_slug', slug)
        .eq('album_name', albumName)

      if (dbDeleteErr) {
        console.error('❌ Failed to delete album records:', dbDeleteErr)
        return NextResponse.json({ success: false, error: 'Failed to delete album records' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Album deleted successfully' })
    }

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Gallery item ID or album is required' }, { status: 400 })
    }

    // Get the gallery item first to get file path
    const { data: galleryItem, error: fetchError } = await supabase
      .from('project_gallery')
      .select('*')
      .eq('id', itemId)
      .eq('project_slug', slug)
      .single()

    if (fetchError || !galleryItem) {
      console.error('❌ Gallery item not found:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Gallery item not found'
      }, { status: 404 })
    }

    // Extract file path from file_data
    const filePath = galleryItem.file_data?.upload_response?.path
    if (filePath) {
      // Delete file from Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('conproProjectsBucket')
        .remove([filePath])

      if (deleteError) {
        console.error('❌ Storage delete error:', deleteError)
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log('✅ File deleted from storage:', filePath)
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('project_gallery')
      .delete()
      .eq('id', itemId)
      .eq('project_slug', slug)

    if (dbError) {
      console.error('❌ Database delete error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete gallery item',
        details: dbError.message
      }, { status: 500 })
    }

    console.log('✅ Gallery item deleted successfully')

    return NextResponse.json({ success: true, message: 'Gallery item deleted successfully' })

  } catch (error) {
    console.error('💥 Delete gallery item error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/projects/slug/[slug]/gallery - Update album name or single item fields
export async function PUT(request, { params }) {
  try {
    const { slug } = params
    const body = await request.json()
    const { action, oldAlbumName, newAlbumName, itemId, fields } = body || {}

    if (action === 'renameAlbum') {
      if (!oldAlbumName || !newAlbumName) {
        return NextResponse.json({ success: false, error: 'oldAlbumName and newAlbumName are required' }, { status: 400 })
      }
      const { error } = await supabase
        .from('project_gallery')
        .update({ album_name: newAlbumName })
        .eq('project_slug', slug)
        .eq('album_name', oldAlbumName)
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: 'Album renamed successfully' })
    }

    if (action === 'updateItem') {
      if (!itemId || !fields || typeof fields !== 'object') {
        return NextResponse.json({ success: false, error: 'itemId and fields are required' }, { status: 400 })
      }
      const allowed = ['album_name', 'file_data']
      const updatePayload = {}
      for (const k of Object.keys(fields)) {
        if (allowed.includes(k)) updatePayload[k] = fields[k]
      }
      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
      }
      const { error } = await supabase
        .from('project_gallery')
        .update(updatePayload)
        .eq('id', itemId)
        .eq('project_slug', slug)
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: 'Item updated successfully' })
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('💥 Update gallery error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
