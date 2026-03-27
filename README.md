# EduPulse Safe AI Classroom (Funding-Ready MVP)

EduPulse is an EDB-aligned AI teaching assistant prototype for Hong Kong schools, designed around four funding-critical requirements:

1. EDB framework alignment
2. Privacy and safety by design
3. Teacher-governed workflow
4. Compliance report generation

This repository now goes beyond a pure prompt demo and includes governance controls needed for pilot deployment and funding documentation.

## What is implemented

### 1) EDB Alignment
- Multi-subject tracking from generated reports
- Funding readiness checklist in UI (`EDB Governance` tab)
- Teaching-case counter based on teacher-approved reports

### 2) Privacy and Safety
- Optional anonymization before AI call (student identifier masking)
- Local-only storage option for reports and logs
- Content safety filter to block unsafe model output before release

### 3) Teacher Workflow Integration
- Role switching: `Teacher`, `Student`, `Admin`
- AI output is created as a **draft** report
- Student can only view teacher-approved reports
- Teacher note + approval gate before release

### 4) Compliance Reporting
- Structured audit logs for key actions
- CSV export for compliance logs
- JSON export for funding package draft data

## Run locally

Prerequisite: Node.js 20+

1. Install dependencies
   - `npm install`
2. Create `.env.local` and set:
   - `OPENROUTER_API_KEY=your_key`
   - `OPENROUTER_MODEL=openrouter/hunter-alpha`
   - `APP_URL=http://localhost:3000`
   - `SCHOOL_NAME=your_pilot_school`
   - `ALLOWED_ORIGINS=http://localhost:3000`
3. Start app
   - `npm run dev`
4. For end-to-end local testing with API routes
   - `npm run dev:full`

## Current architecture notes

- Storage: browser `localStorage` only (MVP mode)
- AI model: OpenRouter via Vercel serverless functions in `api/`
- Build: Vite + React + Tailwind

## Security hardening in this version

- OpenRouter key remains server-side only
- API routes reject disallowed browser origins
- Basic per-IP rate limiting is enabled on serverless routes
- Client-facing error messages are sanitized in production
- Request payloads are validated before upstream AI calls

This is better than a frontend-only Vite setup, but it is still not a substitute for real authentication and persistent server-side audit storage.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo into Vercel
3. Set environment variables in Vercel:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `APP_URL`
   - `ALLOWED_ORIGINS`
   - `SCHOOL_NAME`
4. Deploy

## Information still requiring your input

- Real school or organization name for funding exports
- Production OpenRouter API key and approved model choice
- Privacy policy / consent wording for the pilot school
- Real teacher/admin authentication provider
- Final funding report schema required by your target program

## Model note

Default model is `openrouter/hunter-alpha`.
Per the OpenRouter model page, prompts and completions for this model are logged by the provider and may be used to improve the model. Keep anonymization enabled for student data and do not send raw PII.

## Suggested next steps for school pilots

1. Add real auth + role-based access control (teacher/student/admin accounts)
2. Move storage to managed DB with encryption and audit retention policies
3. Add school-level settings (retention period, export templates, policy text)
4. Add curriculum mapping fields for HK subject outcomes
5. Add report templates aligned with target funding application format
