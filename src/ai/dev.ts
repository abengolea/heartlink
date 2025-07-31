
import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/services/firebase';
import '@/ai/flows/whatsapp-study-upload.ts';
import '@/ai/flows/transcribe-audio-flow.ts';
