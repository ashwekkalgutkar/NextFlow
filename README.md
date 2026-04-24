<img src="https://plain-apac-prod-public.komododecks.com/202604/23/KVDPGqHxpZk38VsRrw63/image.png" width="48" />

# NextFlow

NextFlow is a high-fidelity, node-based AI workflow editor designed for complex multimodal processing. It allows for the construction of parallel directed acyclic graphs (DAGs) that bridge large language models with specialized image and video processing tasks.

---

## Overview

The platform provides a seamless, interactive canvas where users can orchestrate AI workflows. By connecting modular nodes, users can automate tasks ranging from simple text generation to complex multi-step media processing involving cropping, frame extraction, and multimodal analysis.

## Key Functionality

### Parallel Execution Engine
The core of NextFlow is a robust orchestration layer built on Trigger.dev. It handles topological sorting of node dependencies and executes independent branches in parallel, ensuring maximum efficiency for complex workflows.

### Multimodal AI Integration
Direct integration with Google Gemini 2.0 Flash enables high-speed text and image analysis. LLM nodes support system prompts, user messages, and multiple image inputs for sophisticated reasoning tasks.

### Media Processing Utilities
Hardware-accelerated processing via FFmpeg tasks running in background workers.
*   **Crop Image**: Precise percentage-based cropping for focused AI analysis.
*   **Extract Frame**: High-fidelity frame extraction from video files at specific timestamps.

### Dynamic Design System
A premium, dark-mode focused interface featuring:
*   Animated edge transitions for data flow visualization.
*   Dynamic node glows reflecting real-time execution states.
*   Interactive history tracking with per-node execution details.

---

## Project Demo

[Watch the Demo Video](https://drive.google.com/file/d/1col3Fhx-RZP7ritsh9lO8nBvHUyhwIYv/view?usp=sharing)

## Screenshots

### Dashboard
![Dashboard Dark](./public/screenshots/dashboard-dark.png)
![Dashboard Light](./public/screenshots/dashboard-light.png)

### Workflow Presets
![Presets Dark](./public/screenshots/presets-dark.png)
![Presets Light](./public/screenshots/presets-light.png)

### Node Canvas
![Canvas Editor](./public/screenshots/canvas-editor.png)

---

## Technical Stack

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **State Management**: Zustand
*   **Graph Engine**: React Flow / XYFlow
*   **Database**: Neon (PostgreSQL) with Prisma ORM
*   **Background Jobs**: Trigger.dev v3
*   **AI Engine**: Google Generative AI (Gemini)
*   **Media Processing**: FFmpeg & Transloadit SDK
*   **Authentication**: Clerk

---

## Installation

### Prerequisites

*   Node.js 20 or higher
*   Git
*   FFmpeg (for local background worker execution)

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/ashwekkalgutkar/NextFlow.git
    cd NextFlow
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  Configure environment variables (see below).

5.  Start the development server:
    ```bash
    npm run dev
    ```

6.  Start the Trigger.dev background worker:
    ```bash
    npx trigger.dev@latest dev
    ```

---

## Environment Configuration

Create a `.env` file in the root directory and provide the following credentials:

```env
# Database
DATABASE_URL="your_postgresql_url"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_pub_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# AI & Orchestration
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
TRIGGER_SECRET_KEY="your_trigger_dev_secret"

# Media Processing (Transloadit)
TRANSLOADIT_KEY="your_transloadit_key"
TRANSLOADIT_SECRET="your_transloadit_secret"
```

---

## License

This project is private and intended for internal use.
