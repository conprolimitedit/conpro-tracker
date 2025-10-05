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

    console.log(`🚀 Fetching gallery items for project slug: ${slug}, page: ${page}, limit: ${limit}`)

    // Get total count
    const { count, error: countError } = await supabase
      .from('project_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)

    if (countError) {
      console.error('❌ Count error:', countError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch gallery count',
        details: countError.message
      }, { status: 500 })
    }

    // Get paginated items
    const { data: galleryItems, error } = await supabase
      .from('project_gallery')
      .select('*')
      .eq('project_slug', slug)
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
             file_data: fileData
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

    console.log('🚀 Deleting gallery item:', itemId, 'for project slug:', slug)

    if (!itemId) {
      return NextResponse.json({
        success: false,
        error: 'Gallery item ID is required'
      }, { status: 400 })
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

    return NextResponse.json({
      success: true,
      message: 'Gallery item deleted successfully'
    })

  } catch (error) {
    console.error('💥 Delete gallery item error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
