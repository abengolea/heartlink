import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 [Debug Firestore] Testing Firestore connection...');
    
    // Test importing Firestore functions
    const { createStudy, getAllStudies, findOrCreatePatient } = await import('@/lib/firestore');
    
    console.log('✅ [Debug Firestore] Firestore functions imported successfully');
    
    // Test getting all studies
    console.log('🔍 [Debug Firestore] Getting all studies...');
    const studies = await getAllStudies();
    console.log(`✅ [Debug Firestore] Retrieved ${studies.length} studies`);
    
    return NextResponse.json({
      success: true,
      message: 'Firestore connection working',
      studiesCount: studies.length,
      sampleStudies: studies.slice(0, 2), // Show first 2 studies as sample
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
      }
    });
    
  } catch (error) {
    console.error('❌ [Debug Firestore] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'firestore_connection'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔍 [Debug Firestore POST] Testing Firestore write operations...');
    
    const { createStudy, findOrCreatePatient } = await import('@/lib/firestore');
    
    // Test creating a patient
    console.log('🔍 [Debug Firestore POST] Creating test patient...');
    const patientId = await findOrCreatePatient(
      'Test Patient Debug',
      'user1',
      'user2'
    );
    console.log(`✅ [Debug Firestore POST] Patient created/found: ${patientId}`);
    
    // Test creating a study
    console.log('🔍 [Debug Firestore POST] Creating test study...');
    const studyId = await createStudy({
      patientId,
      videoUrl: 'https://example.com/test-video.mp4',
      reportUrl: '',
      date: new Date().toISOString(),
      isUrgent: false,
      description: 'Debug test study',
      diagnosis: 'Test diagnosis',
      comments: []
    });
    console.log(`✅ [Debug Firestore POST] Study created: ${studyId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Firestore write operations working',
      createdPatientId: patientId,
      createdStudyId: studyId
    });
    
  } catch (error) {
    console.error('❌ [Debug Firestore POST] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'firestore_write_operations'
    }, { status: 500 });
  }
}