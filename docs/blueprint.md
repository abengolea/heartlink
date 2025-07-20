# **App Name**: HeartLink

## Core Features:

- Secure User Authentication: User authentication and authorization via Firebase Auth for secure access to the platform, differentiating between 'operator' and 'requester' roles.
- Patient Management: Patient management module to add, view, and manage patient data, including linking patients to operators and requesters.
- Study Upload and Display: Study upload functionality to upload videos (MP4) and reports (PDF), with descriptions, diagnoses, urgency levels, and dates. The system provides a display of all previous studies for the same patient.
- Access Control: Controlled viewing permissions to restrict study access based on user role.
- Secure Public Links: Optional public link generation for studies with PIN protection and expiration settings, allowing secure external access.
- WhatsApp Study Upload: Automated WhatsApp integration to receive studies from operators. The system will tool an AI-based approach to extract patient and requester names from the message text or voice notes and upload the study automatically, and then send a confirmation message to the requester.
- Advanced Search: Advanced search functionality to search patients by name, ID, dates, urgency, and physician.

## Style Guidelines:

- Primary color: Soft blue (#64B5F6) to convey trust and medical professionalism.
- Background color: Light grey (#F0F4F8) to provide a clean, clinical feel.
- Accent color: Teal (#4DB6AC) to highlight key actions and information, ensureing clarity.
- Body and headline font: 'Inter' (sans-serif) for a modern, neutral, and readable interface.
- Code font: 'Source Code Pro' (monospace) for any displayed code or system IDs.
- Use of simple, clear icons from a consistent set (e.g., Material Design Icons) for easy navigation and quick comprehension.
- Clean, intuitive layout with a focus on quick access to patient data and study uploads; use of card-based layouts for study summaries.