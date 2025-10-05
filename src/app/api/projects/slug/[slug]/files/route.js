import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const phase = searchParams.get('phase')
    
    console.log('🚀 Fetching files for project slug:', slug, 'phase:', phase)

    if (!phase) {
      return NextResponse.json({
        success: false,
        error: 'Phase parameter is required'
      }, { status: 400 })
    }

    const { data: files, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_slug', slug)
      .eq('phase', phase)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch files',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ Files fetched successfully for phase "${phase}":`, files?.length || 0)

    return NextResponse.json({
      success: true,
      files: files || []
    })

  } catch (error) {
    console.error('💥 Get files error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = params
    console.log('🚀 Uploading files for project slug:', slug)

    // Get project details first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, project_slug')
      .eq('project_slug', slug)
      .single()

    if (projectError || !project) {
      console.error('❌ Project not found:', projectError)
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    const contentType = request.headers.get('content-type')
    let body
    let phaseMetadata = {} // Initialize phaseMetadata outside the if block

    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const filesData = formData.get('filesData')
      const phase = formData.get('phase')
      const phaseMetadataString = formData.get('phaseMetadata')
      
      if (!filesData || !phase) {
        return NextResponse.json({
          success: false,
          error: 'Files data and phase are required'
        }, { status: 400 })
      }

      // Parse phase metadata
      if (phaseMetadataString) {
        try {
          phaseMetadata = JSON.parse(phaseMetadataString)
        } catch (error) {
          console.error('❌ Error parsing phase metadata:', error)
        }
      }

      const filesMetadata = JSON.parse(filesData)
      
      // Attach actual File objects to the metadata
      const filesWithAttachments = filesMetadata.map((fileData, index) => {
        if (fileData.file_type === 'file') {
          let actualFile = null
          
          // Check if it's a new file or edited file
          if (fileData.isEdit) {
            // Find the corresponding edited file
            const editedIndex = filesMetadata.filter(f => f.isEdit).indexOf(fileData)
            actualFile = formData.get(`edited_file_${editedIndex}`)
            console.log(`🔍 Checking edited file ${editedIndex}:`, {
              fileData: fileData,
              hasActualFile: !!actualFile,
              actualFileName: actualFile?.name,
              actualFileSize: actualFile?.size
            })
          } else {
            // Regular new file
            actualFile = formData.get(`file_${index}`)
            console.log(`🔍 Checking new file ${index}:`, {
              fileData: fileData,
              hasActualFile: !!actualFile,
              actualFileName: actualFile?.name,
              actualFileSize: actualFile?.size
            })
          }
          
          if (actualFile) {
            return {
              ...fileData,
              file: actualFile
            }
          }
        }
        return fileData
      })

      body = {
        files: filesWithAttachments,
        phase: phase
      }
      
      console.log('📥 Received files data:', {
        filesCount: filesWithAttachments.length,
        phase: phase,
        phaseMetadata: phaseMetadata,
        phaseMetadataKeys: Object.keys(phaseMetadata),
        filesWithAttachments: filesWithAttachments.map(f => ({
          name: f.name,
          file_type: f.file_type,
          hasFile: !!f.file,
          comment: f.comment
        }))
      })
    } else {
      body = await request.json()
    }

    const { files, phase } = body

    // Allow empty files array for metadata-only saves
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid files data provided'
      }, { status: 400 })
    }

    if (!phase) {
      return NextResponse.json({
        success: false,
        error: 'Phase is required'
      }, { status: 400 })
    }

    console.log(`📁 Processing ${files.length} files for phase: ${phase}`)

    const uploadedFiles = []

    // If no files to process, skip the file processing loop
    if (files.length === 0) {
      console.log('📝 No files to process, only saving metadata')
    } else {
      for (const fileData of files) {
      try {
        console.log(`🔄 Processing file: ${fileData.name || fileData.link}, type: ${fileData.file_type}, isEdit: ${fileData.isEdit || false}`)
        
        // If this is an edited file, delete the old one first
        if (fileData.isEdit && fileData.id) {
          console.log(`🗑️ Deleting old file with ID: ${fileData.id}`)
          
          // Get the old file details
          const { data: oldFile, error: fetchError } = await supabase
            .from('project_files')
            .select('*')
            .eq('id', fileData.id)
            .single()

          if (!fetchError && oldFile) {
            // Delete old file from storage if it exists
            if (oldFile.file_link?.file_type === 'file' && oldFile.file_link?.data?.path) {
              const { error: deleteError } = await supabase.storage
                .from('conproProjectsBucket')
                .remove([oldFile.file_link.data.path])

              if (deleteError) {
                console.error('❌ Old file storage delete error:', deleteError)
              } else {
                console.log('✅ Old file deleted from storage')
              }
            }

            // Delete old file from database
            const { error: deleteError } = await supabase
              .from('project_files')
              .delete()
              .eq('id', fileData.id)

            if (deleteError) {
              console.error('❌ Old file database delete error:', deleteError)
            } else {
              console.log('✅ Old file deleted from database')
            }
          }
        }
        
        let fileLink = {
          file_type: fileData.file_type || 'file',
          link: '',
          data: {},
          comment: fileData.comment || ''
        }

        if (fileData.file_type === 'link') {
          // Handle link
          console.log(`🔗 Processing link: ${fileData.link}`)
          fileLink.link = fileData.link
          fileLink.data = fileData.data || {}
        } else {
          // Handle file upload
          console.log(`🔍 Processing file type: ${fileData.file_type}, has file: ${!!fileData.file}`)
          if (fileData.file) {
            console.log(`📁 Uploading file: ${fileData.file.name}, size: ${fileData.file.size}`)
            // Upload file to Supabase storage
            const file = fileData.file
            const fileName = `${Date.now()}-${file.name}`
            const filePath = `project-files/${slug}/${phase}/${fileName}`

            // Upload file to Supabase Storage (using same pattern as working route)
            console.log('📤 Uploading file to Supabase...')
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('conproProjectsBucket')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('❌ File upload error:', uploadError)
              console.error('❌ Upload details:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                filePath: filePath,
                bucket: 'conproProjectsBucket'
              })
              continue // Skip this file and continue with others
            }
            
            console.log('✅ File uploaded to storage successfully:', uploadData)

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('conproProjectsBucket')
              .getPublicUrl(filePath)

            fileLink.link = urlData.publicUrl
            fileLink.data = {
              filename: file.name,
              size: file.size,
              type: file.type,
              path: filePath,
              uploaded_at: new Date().toISOString()
            }
          } else {
            console.warn('⚠️ No file provided for file type')
            continue
          }
        }

        // Insert into database
        console.log(`💾 Inserting into database:`, {
          project_id: project.project_id,
          project_slug: project.project_slug,
          phase: phase,
          file_link: fileLink
        })
        
        console.log(`📝 Final fileLink object:`, fileLink)
        
        const { data: insertedFile, error: insertError } = await supabase
          .from('project_files')
          .insert({
            project_id: project.project_id,
            project_slug: project.project_slug,
            phase: phase,
            file_link: fileLink // Store as single object
          })
          .select()

        if (insertError) {
          console.error('❌ Database insert error:', insertError)
          continue
        }
        
        console.log(`✅ Database insert successful:`, insertedFile[0])

        uploadedFiles.push(insertedFile[0])
        console.log('✅ File uploaded successfully:', fileData.name || fileData.link)

      } catch (fileError) {
        console.error('❌ Error processing file:', fileError)
        continue
      }
    }
    }

    console.log(`✅ Successfully uploaded ${uploadedFiles.length} files`)

    // Update project metadata if phase metadata is provided
    if (Object.keys(phaseMetadata).length > 0) {
      try {
        console.log(`📝 Updating project metadata for phase: ${phase}`)
        console.log(`📝 Phase metadata to update:`, phaseMetadata)
        
        // Get current project data
        const { data: currentProject, error: projectError } = await supabase
          .from('projects')
          .select('meta_data')
          .eq('project_slug', slug)
          .single()

        if (projectError) {
          console.error('❌ Error fetching project:', projectError)
          console.log('⚠️ Continuing without metadata update...')
        } else {
          // Get current metadata or initialize with default structure
          let currentMetadata = currentProject?.meta_data || {
            phases: {}
          }

          // Ensure phases object exists
          if (!currentMetadata.phases) {
            currentMetadata.phases = {}
          }

          // Update the specific phase with new metadata
          currentMetadata.phases[phase] = {
            ...currentMetadata.phases[phase], // Keep existing data
            ...phaseMetadata // Override with new data
          }

          console.log(`📝 Updated phase ${phase} metadata:`, currentMetadata.phases[phase])

          // Update the project with new metadata
          const { error: updateError } = await supabase
            .from('projects')
            .update({ meta_data: currentMetadata })
            .eq('project_slug', slug)

          if (updateError) {
            console.error('❌ Error updating project metadata:', updateError)
            console.log('⚠️ Continuing without metadata update...')
          } else {
            console.log(`✅ Project metadata updated for phase: ${phase}`)
          }
        }
      } catch (metadataError) {
        console.error('❌ Error processing metadata:', metadataError)
        console.log('⚠️ Continuing without metadata update...')
      }
    }

    try {
      console.log('🎉 About to return success response:', {
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        filesCount: uploadedFiles.length
      })

      // Create a clean response object to avoid serialization issues
      const cleanFiles = uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        file_type: file.file_type,
        comment: file.comment,
        uploadDate: file.uploadDate
      }))

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        files: cleanFiles
      })
    } catch (responseError) {
      console.error('💥 Error creating response:', responseError)
      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        files: []
      })
    }

  } catch (error) {
    console.error('💥 Upload files error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'File ID is required'
      }, { status: 400 })
    }

    console.log('🚀 Deleting file:', fileId)

    // Get file details first
    const { data: file, error: fetchError } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .eq('project_slug', slug)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 })
    }

    // If it's a file (not a link), delete from storage
    if (file.file_link?.file_type === 'file' && file.file_link?.data?.path) {
      const { error: deleteError } = await supabase.storage
        .from('conproProjectsBucket')
        .remove([file.file_link.data.path])

      if (deleteError) {
        console.error('❌ Storage delete error:', deleteError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId)
      .eq('project_slug', slug)

    if (deleteError) {
      console.error('❌ Database delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete file',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('✅ File deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('💥 Delete file error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
