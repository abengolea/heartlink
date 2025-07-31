
import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/services/firebase';
import '@/ai/flows/study-upload-flow.ts';
import '@/ai/flows/transcribe-audio-flow.ts';
