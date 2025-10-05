import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with SERVICE ROLE KEY for uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables for financials API')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    // Get project_id from slug
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id')
      .eq('project_slug', slug)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get financial documents with pagination
    console.log('🔍 Querying financials table for project:', slug)
    const { data: documents, error: documentsError } = await supabase
      .from('financials')
      .select(`
        *,
        finance_documents!document_type_id(documentType, category, description)
      `)
      .eq('project_slug', slug)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (documentsError) {
      console.error('❌ Error fetching financial documents:', documentsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch financial documents', 
        details: documentsError.message 
      }, { status: 500 })
    }

    console.log('✅ Found financial documents:', documents?.length || 0)

    // Get total count
    const { count, error: countError } = await supabase
      .from('financials')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)

    if (countError) {
      console.error('❌ Error counting financial documents:', countError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to count financial documents', 
        details: countError.message 
      }, { status: 500 })
    }

    console.log('✅ Total count:', count)

    return NextResponse.json({
      success: true,
      documents: documents || [],
      total: count || 0,
      page,
      limit,
      hasMore: (offset + limit) < count
    })

  } catch (error) {
    console.error('Error in GET /api/projects/slug/[slug]/financials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params
    const contentType = request.headers.get('content-type')

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
    }

    // Get project_id from slug
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id')
      .eq('project_slug', slug)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const formData = await request.formData()
    
    // Extract form data
    const documentTypeId = formData.get('documentType')
    const projectPhase = formData.get('projectPhase')
    const subMenu = formData.get('subMenu')
    const financialAmount = formData.get('financialAmount')
    const documentDate = formData.get('documentDate')
    const dueDate = formData.get('dueDate')
    const priority = formData.get('priority')
    const specialNotes = formData.get('specialNotes')
    const generalComments = formData.get('generalComments')

    // Validate required fields
    if (!documentTypeId) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }

    // Process files and links - each creates a separate financials record
    const files = []
    const links = []
    
    console.log('🔍 Processing FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`  - ${key}: ${value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value}`)
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value)
        console.log(`✅ Added file: ${value.name}`)
      } else if (key.startsWith('link_')) {
        links.push(value)
        console.log(`✅ Added link: ${value}`)
      }
    }
    
    console.log(`📊 Summary: ${files.length} files, ${links.length} links`)

    const createdRecords = []

    // Process each file as a separate financials record
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i]
        
        // Generate unique filename with timestamp and sanitize special characters
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniqueFileName = `${timestamp}-${sanitizedName}`
        
        console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`)
        console.log(`📝 Sanitized filename: ${uniqueFileName}`)
        
        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('conproProjectsBucket')
          .upload(`financials/${slug}/${uniqueFileName}`, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Error uploading file:', uploadError)
          console.error('❌ Upload error details:', JSON.stringify(uploadError, null, 2))
          // Don't continue, return error immediately for better debugging
          return NextResponse.json({ 
            success: false, 
            error: `Failed to upload file: ${uploadError.message}`,
            details: uploadError,
            debug: {
              fileName: file.name,
              sanitizedFileName: uniqueFileName,
              fileSize: file.size,
              fileType: file.type
            }
          }, { status: 500 })
        }

        console.log('✅ File uploaded successfully:', uploadData)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('conproProjectsBucket')
          .getPublicUrl(uploadData.path)

        console.log('🔗 Public URL:', urlData.publicUrl)

        // Get comment for this file
        const fileComment = formData.get(`comment_${file.name}`) || ''

        // Create file_data object matching FileUpload structure
        const fileData = {
          data: {
            path: uploadData.path,
            size: file.size,
            type: file.type,
            filename: file.name,
            uploaded_at: new Date().toISOString()
          },
          link: urlData.publicUrl,
          comment: fileComment,
          file_type: 'file'
        }

        console.log('📝 File data structure:', fileData)

        // Insert financials record for this file
        const { data: newRecord, error: insertError } = await supabase
          .from('financials')
          .insert({
            project_id: project.project_id,
            project_slug: slug,
            document_type_id: parseInt(documentTypeId),
            project_phase: projectPhase || 'general',
            sub_menu: subMenu || 'general',
            financial_amount: financialAmount ? parseFloat(financialAmount) : null,
            document_date: documentDate || null,
            due_date: dueDate || null,
            priority: priority || 'medium',
            special_notes: specialNotes || null,
            general_comments: generalComments || null,
            file_data: fileData
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error inserting financials record:', insertError)
          continue
        }

        console.log('✅ Financials record created:', newRecord)
        createdRecords.push(newRecord)
      } catch (fileError) {
        console.error('❌ Error processing file:', fileError)
      }
    }

    // Process each link as a separate financials record
    for (let i = 0; i < links.length; i++) {
      try {
        // Link is just a string URL, not JSON
        const linkUrl = links[i].toString()
        
        // Get comment for this link
        const linkComment = formData.get(`link_comment_${i}`) || ''
        
        // Create file_data object matching FileUpload structure
        const fileData = {
          data: {},
          link: linkUrl,
          comment: linkComment,
          file_type: 'link'
        }

        // Insert financials record for this link
        const { data: newRecord, error: insertError } = await supabase
          .from('financials')
          .insert({
            project_id: project.project_id,
            project_slug: slug,
            document_type_id: parseInt(documentTypeId),
            project_phase: projectPhase || 'general',
            sub_menu: subMenu || 'general',
            financial_amount: financialAmount ? parseFloat(financialAmount) : null,
            document_date: documentDate || null,
            due_date: dueDate || null,
            priority: priority || 'medium',
            special_notes: specialNotes || null,
            general_comments: generalComments || null,
            file_data: fileData
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error inserting financials record:', insertError)
          continue
        }

        createdRecords.push(newRecord)
      } catch (linkError) {
        console.error('Error processing link:', linkError)
      }
    }

    if (createdRecords.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No records were created. This could be due to storage bucket issues, filename problems, or database constraints.',
        details: 'Check console logs for specific error details. Common issues: special characters in filenames, storage permissions, or database constraints.',
        debug: {
          filesAttempted: files.length,
          linksAttempted: links.length,
          recordsCreated: createdRecords.length
        }
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdRecords.length} financial record(s)`,
      records: createdRecords,
      uploadedFiles: files.length,
      uploadedLinks: links.length,
      count: createdRecords.length
    })

  } catch (error) {
    console.error('Error in POST /api/projects/slug/[slug]/financials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { slug } = await params
    const contentType = request.headers.get('content-type')

    let documentId, updateData

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle file replacement
      const formData = await request.formData()
      documentId = formData.get('documentId')
      const replacementFile = formData.get('replacementFile')
      
      // Extract form data
      updateData = {
        documentType: formData.get('documentType'),
        projectPhase: formData.get('projectPhase'),
        subMenu: formData.get('subMenu'),
        financialAmount: formData.get('financialAmount'),
        documentDate: formData.get('documentDate'),
        dueDate: formData.get('dueDate'),
        priority: formData.get('priority'),
        specialNotes: formData.get('specialNotes'),
        generalComments: formData.get('generalComments'),
        fileComment: formData.get('fileComment')
      }

      console.log('🔍 Updating financial document with file replacement:', documentId)

      // Get current document to access old file data
      const { data: currentDoc, error: fetchError } = await supabase
        .from('financials')
        .select('file_data')
        .eq('id', documentId)
        .eq('project_slug', slug)
        .single()

      if (fetchError || !currentDoc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Delete old file from storage if it exists
      if (currentDoc.file_data?.data?.path) {
        try {
          console.log('🗑️ Deleting old file from storage:', currentDoc.file_data.data.path)
          const { error: deleteError } = await supabase.storage
            .from('conproProjectsBucket')
            .remove([currentDoc.file_data.data.path])
          
          if (deleteError) {
            console.error('❌ Error deleting old file from storage:', deleteError)
          } else {
            console.log('✅ Old file deleted from storage successfully')
          }
        } catch (fileError) {
          console.error('❌ Error deleting old file from storage:', fileError)
        }
      }

      // Upload new file
      if (replacementFile instanceof File) {
        // Generate unique filename with timestamp and sanitize special characters
        const timestamp = Date.now()
        const sanitizedName = replacementFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniqueFileName = `${timestamp}-${sanitizedName}`
        
        console.log(`📤 Uploading replacement file: ${replacementFile.name} (${replacementFile.size} bytes)`)
        console.log(`📝 Sanitized filename: ${uniqueFileName}`)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('conproProjectsBucket')
          .upload(`financials/${slug}/${uniqueFileName}`, replacementFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Error uploading replacement file:', uploadError)
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to upload replacement file', 
            details: uploadError.message 
          }, { status: 500 })
        }

        console.log('✅ Replacement file uploaded successfully:', uploadData)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('conproProjectsBucket')
          .getPublicUrl(uploadData.path)

        console.log('🔗 Public URL:', urlData.publicUrl)

        // Create new file_data object
        const newFileData = {
          data: {
            path: uploadData.path,
            size: replacementFile.size,
            type: replacementFile.type,
            filename: replacementFile.name,
            uploaded_at: new Date().toISOString()
          },
          link: urlData.publicUrl,
          comment: updateData.fileComment || '',
          file_type: 'file'
        }

        console.log('📝 New file data structure:', newFileData)

        // Update the document with new file data
        const { data: updatedDoc, error: updateError } = await supabase
          .from('financials')
          .update({
            document_type_id: updateData.documentType ? parseInt(updateData.documentType) : null,
            project_phase: updateData.projectPhase || null,
            sub_menu: updateData.subMenu || null,
            financial_amount: updateData.financialAmount ? parseFloat(updateData.financialAmount) : null,
            document_date: updateData.documentDate || null,
            due_date: updateData.dueDate || null,
            priority: updateData.priority || 'medium',
            special_notes: updateData.specialNotes || null,
            general_comments: updateData.generalComments || null,
            file_data: newFileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
          .eq('project_slug', slug)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating financial document:', updateError)
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to update financial document', 
            details: updateError.message 
          }, { status: 500 })
        }

        console.log('✅ Financial document updated with replacement file successfully')

        return NextResponse.json({
          success: true,
          message: 'Financial document updated with replacement file successfully',
          document: updatedDoc
        })
      }
    } else {
      // Handle JSON update (no file replacement)
      const body = await request.json()
      documentId = body.documentId
      updateData = body

      console.log('🔍 Updating financial document (JSON):', documentId, updateData)

      // Update the document record
      const { data: updatedDoc, error: updateError } = await supabase
        .from('financials')
        .update({
          document_type_id: updateData.documentType ? parseInt(updateData.documentType) : null,
          project_phase: updateData.projectPhase || null,
          sub_menu: updateData.subMenu || null,
          financial_amount: updateData.financialAmount ? parseFloat(updateData.financialAmount) : null,
          document_date: updateData.documentDate || null,
          due_date: updateData.dueDate || null,
          priority: updateData.priority || 'medium',
          special_notes: updateData.specialNotes || null,
          general_comments: updateData.generalComments || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('project_slug', slug)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating financial document:', updateError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to update financial document', 
          details: updateError.message 
        }, { status: 500 })
      }

      // Update file_data if provided
      if (updateData.fileComment !== undefined || updateData.linkUrl !== undefined || updateData.fileName !== undefined) {
        const currentFileData = updatedDoc.file_data || {}
        const updatedFileData = {
          ...currentFileData,
          comment: updateData.fileComment !== undefined ? updateData.fileComment : currentFileData.comment
        }

        // Update link URL if provided
        if (updateData.linkUrl !== undefined && currentFileData.file_type === 'link') {
          updatedFileData.link = updateData.linkUrl
        }

        // Update file name if provided
        if (updateData.fileName !== undefined && currentFileData.file_type === 'file') {
          updatedFileData.data = {
            ...currentFileData.data,
            filename: updateData.fileName
          }
        }

        const { error: fileDataError } = await supabase
          .from('financials')
          .update({ file_data: updatedFileData })
          .eq('id', documentId)
          .eq('project_slug', slug)

        if (fileDataError) {
          console.error('❌ Error updating file data:', fileDataError)
          // Don't fail the whole request for file data update
        }
      }

      console.log('✅ Financial document updated successfully')

      return NextResponse.json({
        success: true,
        message: 'Financial document updated successfully',
        document: updatedDoc
      })
    }

  } catch (error) {
    console.error('❌ Error in PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Get the document to access file data
    const { data: document, error: fetchError } = await supabase
      .from('financials')
      .select('file_data')
      .eq('id', documentId)
      .eq('project_slug', slug)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from storage if it exists
    if (document.file_data && document.file_data.data && document.file_data.data.path) {
      try {
        console.log('🗑️ Deleting file from storage:', document.file_data.data.path)
        const { error: deleteError } = await supabase.storage
          .from('conproProjectsBucket')
          .remove([document.file_data.data.path])
        
        if (deleteError) {
          console.error('❌ Error deleting file from storage:', deleteError)
        } else {
          console.log('✅ File deleted from storage successfully')
        }
      } catch (fileError) {
        console.error('❌ Error deleting file from storage:', fileError)
      }
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from('financials')
      .delete()
      .eq('id', documentId)
      .eq('project_slug', slug)

    if (deleteError) {
      console.error('Error deleting financial document:', deleteError)
      return NextResponse.json({ error: 'Failed to delete financial document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Financial document deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/projects/slug/[slug]/financials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
