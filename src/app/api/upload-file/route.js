import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    console.log('🚀 Upload API endpoint called')
    console.log('📡 Request method:', request.method)
    console.log('📡 Request URL:', request.url)
    console.log('📡 Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Check environment variables - Use SERVICE ROLE KEY for uploads
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    
    console.log('🔧 Supabase URL exists:', !!supabaseUrl)
    console.log('🔧 Supabase URL value:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('🔧 Service Role Key exists:', !!supabaseServiceKey)
    console.log('🔧 Service Role Key value:', supabaseServiceKey ? 'SET' : 'NOT SET')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      console.error('❌ Supabase URL missing:', !supabaseUrl)
      console.error('❌ Service Role Key missing:', !supabaseServiceKey)
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration missing. Need SERVICE ROLE KEY for uploads.',
        debug: {
          supabaseUrl: !!supabaseUrl,
          serviceRoleKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }
    
    // Create Supabase client with SERVICE ROLE KEY for uploads
    console.log('🔧 Creating Supabase client with SERVICE ROLE KEY...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client with SERVICE ROLE KEY created')
    
    // Parse the multipart form data
    console.log('📝 Parsing form data...')
    const formData = await request.formData()
    console.log('📝 Form data parsed successfully')
    
    const file = formData.get('file')
    const bucket = formData.get('bucket') || 'conproProjectsBucket'
    
    console.log('📁 File received:', file?.name)
    console.log('📁 File size:', file?.size)
    console.log('📁 File type:', file?.type)
    console.log('📁 File constructor:', file?.constructor?.name)
    console.log('🪣 Bucket:', bucket)
    console.log('📝 Form data keys:', Array.from(formData.keys()))
    
    if (!file) {
      console.error('❌ No file provided in form data')
      return NextResponse.json({
        success: false,
        error: 'No file provided',
        debug: {
          formDataKeys: Array.from(formData.keys()),
          fileExists: !!file
        }
      }, { status: 400 })
    }
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    console.log('📝 Generated filename:', uniqueFileName)
    
    // Check if bucket exists first
    console.log('🔍 Checking bucket access...')
    console.log('🔍 Calling supabase.storage.listBuckets()...')
    
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    console.log('📋 Bucket list response:', { buckets, bucketError })
    
    if (bucketError) {
      console.error('❌ Bucket access error:', bucketError)
      console.error('❌ Bucket error details:', JSON.stringify(bucketError, null, 2))
      return NextResponse.json({
        success: false,
        error: `Bucket access failed: ${bucketError.message}`,
        debug: {
          bucketError: bucketError,
          supabaseUrl: supabaseUrl,
          serviceRoleKeyLength: supabaseServiceKey?.length
        }
      }, { status: 500 })
    }
    
    console.log('📋 Available buckets:', buckets?.map(b => b.name))
    console.log('📋 Bucket count:', buckets?.length)
    
    // Check if our bucket exists
    const bucketExists = buckets?.some(b => b.name === bucket)
    console.log('🔍 Bucket exists check:', { bucket, bucketExists })
    
    if (!bucketExists) {
      console.error('❌ Bucket does not exist:', bucket)
      console.error('❌ Available buckets:', buckets?.map(b => b.name))
      return NextResponse.json({
        success: false,
        error: `Bucket '${bucket}' does not exist. Available buckets: ${buckets?.map(b => b.name).join(', ')}`,
        debug: {
          requestedBucket: bucket,
          availableBuckets: buckets?.map(b => b.name)
        }
      }, { status: 400 })
    }
    
    // Upload file to Supabase Storage
    console.log('📤 Uploading file to Supabase...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: `Upload failed: ${uploadError.message}`,
        details: uploadError
      }, { status: 500 })
    }
    
    console.log('✅ Upload successful:', uploadData)
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName)
    
    const publicUrl = urlData.publicUrl
    console.log('🔗 Public URL:', publicUrl)
    
    // Prepare response data
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      path: uploadData.path,
      publicUrl: publicUrl,
      bucket: bucket,
      uploadedAt: new Date().toISOString(),
      supabaseData: uploadData
    }
    
    console.log('📊 File data prepared:', fileData)
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileData: fileData
    })
    
  } catch (error) {
    console.error('💥 Upload API error:', error)
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message}`
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 Upload API health check')
    
    // Check environment variables - Use SERVICE ROLE KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    
    console.log('🔧 Health check - Supabase URL exists:', !!supabaseUrl)
    console.log('🔧 Health check - Service Role Key exists:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Health check - Missing environment variables')
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration missing. Need SERVICE ROLE KEY.',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!supabaseServiceKey
      }, { status: 500 })
    }
    
    // Create Supabase client with SERVICE ROLE KEY
    console.log('🔧 Health check - Creating Supabase client with SERVICE ROLE KEY...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Health check - Supabase client created')
    
    // Test bucket access
    console.log('🔍 Health check - Testing bucket access...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    console.log('📋 Health check - Bucket response:', { buckets, bucketError })
    
    return NextResponse.json({
      success: true,
      message: 'Upload API is working',
      supabaseUrl: !!supabaseUrl,
      serviceRoleKey: !!supabaseServiceKey,
      buckets: buckets?.map(b => b.name) || [],
      bucketError: bucketError?.message || null
    })
    
  } catch (error) {
    console.error('💥 Health check error:', error)
    return NextResponse.json({
      success: false,
      error: `Health check failed: ${error.message}`,
      stack: error.stack
    }, { status: 500 })
  }
}
