# 🩺 SYNAPSE — Clinical Note Summarizer

> **Intelligent Unstructured-to-Structured EHR & Clinical Note Analysis Platform**

SYNAPSE is a web-based clinical documentation tool designed to transform free-text, unstructured medical notes, EHR transcriptions, and doctor-patient encounters into structured, actionable clinical summaries. It features an automated vitals extraction engine, clinical alert highlights, interactive specialty templates, and seamless integration with **Google Gemini 1.5 Flash**.

---

## ✨ Features

- **⚡ Dual Engine Processing**
  - **Simulation Mode**: Instant local heuristic parsing using built-in clinical entity extraction regex and rules. Works completely offline with zero API key requirement.
  - **Gemini AI Mode**: Full natural language processing powered by Google's `gemini-1.5-flash` model for advanced entity recognition, narrative synthesis, and clinical reasoning.

- **📊 Interactive Vitals Dashboard**
  - Extracts Blood Pressure, Heart Rate, Temperature, $\text{SpO}_2$, and Respiratory Rate.
  - Displays real-time status badges (*Normal*, *Elevated*, *High*, *Critical*, *Low*) evaluated against clinical standard reference ranges.

- **🚨 Clinical Safety Alerts & Risk Flags**
  - Flags urgent/critical patient findings, medication warnings, drug interactions, and documented allergies.
  - Generates real-time visual alerts and counter badges for immediate clinician triage.

- **📑 Multi-Tab Executive Overview**
  - **Structured Summary**: Chief Complaint, History of Present Illness (HPI), Patient Demographics, Physical Exam, Diagnostics, Assessment & Plan.
  - **Clinical Alerts**: Triage panel highlighting severe risks and actionable warnings.
  - **Markdown Report**: Full copyable Markdown document suitable for copying into EHR systems (Epic, Cerner, etc.).

- **📋 Specialty Clinical Templates & Dictation Simulation**
  - Pre-loaded templates for **Cardiology**, **Orthopedics**, **Neurology**, and **Pediatrics**.
  - Interactive speech dictation simulation for testing clinical transcription inputs.

- **🖨️ PDF & Print Export**
  - Formatted print styling for generating professional, print-ready PDF clinical summaries with one click.

- **🔒 Privacy & Client-Side Security**
  - Zero backend overhead — runs entirely client-side.
  - Gemini API keys are saved strictly in browser `localStorage` and sent directly to Google API endpoints.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Pure HTML5, Modern Vanilla JavaScript (ES6 Modules) |
| **Styling** | Custom Vanilla CSS (Dark Theme, Glassmorphism, HSL Design Tokens) |
| **Build System** | [Vite](https://vitejs.dev/) |
| **Icons & Fonts** | [Lucide Icons](https://lucide.dev/), Google Fonts (*Outfit* & *Inter*) |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18.0.0 or higher) and `npm` installed.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/amritsharan/medical-note-summariser.git
   cd medical-note-summariser
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

---

## ⚙️ Usage & API Configuration

### 1. Running in Simulation Mode (Default)
When you launch the app, SYNAPSE operates in **Simulation Mode** by default. You can paste any clinical note or select a specialty template from the dropdown and click **"Process & Summarize Note"**.

### 2. Enabling Gemini AI Mode
To unlock full AI-driven summarization:
1. Click the **API Setup** button in the header navigation.
2. Enter your **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/)).
3. Click **Save & Test Connection**.
4. The engine badge will switch to **Gemini Active**.

---

## 📁 Project Structure

```
medical-note-summariser/
├── index.html         # Main dashboard layout, tab panels, and modal UI
├── style.css          # Design system, CSS variables, glassmorphism, responsive grid
├── app.js             # Clinical parsing engine, Gemini API integration, UI handlers
├── vite.config.js     # Vite server configuration (port 3000, host binding)
├── package.json       # Dependencies and npm scripts
└── README.md          # Project documentation
```

---

## 📜 Available Scripts

- `npm run dev` — Launches local dev server with hot module reloading (`http://localhost:3000`).
- `npm run build` — Compiles production-ready static assets into the `dist/` folder.
- `npm run preview` — Locally previews the compiled production build.

---

## ⚠️ Disclaimer

> [!WARNING]
> **For Demonstration & Educational Purposes Only**
> 
> SYNAPSE is designed as an administrative and clinical workflow demonstration tool. It is not certified as a medical device and should not be used as the sole basis for clinical diagnosis or treatment decisions without verification by a qualified healthcare professional.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
