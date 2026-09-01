// Synapse Clinical Summarizer Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const elNoteInput = document.getElementById('clinical-note-input');
  const elTemplateSelect = document.getElementById('template-select');
  const elCharCount = document.getElementById('char-count');
  const elWordCount = document.getElementById('word-count');
  const elBtnClear = document.getElementById('btn-clear-note');
  const elBtnDictate = document.getElementById('btn-simulate-dictation');
  const elBtnSummarize = document.getElementById('btn-summarize');
  const elBtnPrint = document.getElementById('btn-print-summary');
  
  // Views
  const elEmptyState = document.getElementById('empty-state-view');
  const elLoadingState = document.getElementById('loading-state-view');
  const elDashboardActive = document.getElementById('dashboard-active-view');
  const elLoadingStep = document.getElementById('loading-step');
  const elLoadingDetail = document.getElementById('loading-detail');
  const elProgressBarFill = document.getElementById('progress-bar-fill');
  
  // Settings Modal
  const elBtnOpenSettings = document.getElementById('btn-open-settings');
  const elSettingsModal = document.getElementById('settings-modal');
  const elBtnCloseSettings = document.getElementById('btn-close-settings');
  const elBtnCancelSettings = document.getElementById('btn-cancel-settings');
  const elBtnSaveSettings = document.getElementById('btn-save-settings');
  const elBtnClearSettings = document.getElementById('btn-clear-settings');
  const elInputGeminiKey = document.getElementById('gemini-key-input');
  const elBtnToggleKeyVis = document.getElementById('btn-toggle-key-visibility');
  const elKeyTestStatus = document.getElementById('key-test-status');
  const elEngineBadge = document.getElementById('engine-badge');

  // Tabs
  const elTabLinks = document.querySelectorAll('.tab-link');
  const elTabPanes = document.querySelectorAll('.tab-pane');
  const elAlertsCount = document.getElementById('alerts-count');

  // Summary Dashboard Outlets
  const elOutGender = document.getElementById('summary-gender');
  const elOutAge = document.getElementById('summary-age');
  const elOutUrgentBadge = document.getElementById('badge-urgent-case');
  const elOutNarrative = document.getElementById('summary-narrative-text');
  const elOutComplaint = document.getElementById('summary-chief-complaint');
  const elOutHpi = document.getElementById('summary-hpi');
  
  // Vital Outlets
  const elVitalCardBp = document.getElementById('vital-card-bp');
  const elVitalBpVal = document.getElementById('vital-bp-val');
  const elVitalBpStatus = document.getElementById('vital-bp-status');
  
  const elVitalCardHr = document.getElementById('vital-card-hr');
  const elVitalHrVal = document.getElementById('vital-hr-val');
  const elVitalHrStatus = document.getElementById('vital-hr-status');
  
  const elVitalCardTemp = document.getElementById('vital-card-temp');
  const elVitalTempVal = document.getElementById('vital-temp-val');
  const elVitalTempStatus = document.getElementById('vital-temp-status');
  
  const elVitalCardSpo2 = document.getElementById('vital-card-spo2');
  const elVitalSpo2Val = document.getElementById('vital-spo2-val');
  const elVitalSpo2Status = document.getElementById('vital-spo2-status');
  
  const elVitalCardRr = document.getElementById('vital-card-rr');
  const elVitalRrVal = document.getElementById('vital-rr-val');
  const elVitalRrStatus = document.getElementById('vital-rr-status');

  // Other Dashboard Outlets
  const elOutHistory = document.getElementById('summary-med-history');
  const elOutExam = document.getElementById('summary-exam-findings');
  const elOutLabs = document.getElementById('summary-labs');
  const elOutAssessment = document.getElementById('summary-assessment');
  const elOutMedications = document.getElementById('summary-medications');
  const elOutPlan = document.getElementById('summary-plan');
  const elOutFollowup = document.getElementById('summary-followup');
  
  // Alerts Feed & Checklist Outlets
  const elAlertsFeed = document.getElementById('alerts-feed-container');
  const elChkDemographics = document.getElementById('chk-demographics');
  const elChkVitals = document.getElementById('chk-vitals');
  const elChkComplaint = document.getElementById('chk-complaint');
  const elChkMeds = document.getElementById('chk-meds');
  const elChkAllergies = document.getElementById('chk-allergies');
  const elChkFollowup = document.getElementById('chk-followup');

  // Markdown Outlets
  const elOutMarkdown = document.getElementById('markdown-text-area');
  const elBtnCopyMarkdown = document.getElementById('btn-copy-markdown');

  // --- State Variables ---
  let appState = {
    apiKey: localStorage.getItem('synapse_gemini_key') || '',
    currentSummary: null,
    isTyping: false
  };

  // Initialize Lucide Icons
  lucide.createIcons();
  updateEngineBadge();
  setupEditorGutter();

  // --- API Setup & Engine Status ---
  function updateEngineBadge() {
    if (appState.apiKey) {
      elEngineBadge.classList.add('live-ai');
      elEngineBadge.querySelector('.engine-text').textContent = 'Gemini Active';
      elBtnClearSettings.classList.remove('hidden');
    } else {
      elEngineBadge.classList.remove('live-ai');
      elEngineBadge.querySelector('.engine-text').textContent = 'Simulation Mode';
      elBtnClearSettings.classList.add('hidden');
    }
  }

  // Toggle API Key visibility
  elBtnToggleKeyVis.addEventListener('click', () => {
    const isPass = elInputGeminiKey.type === 'password';
    elInputGeminiKey.type = isPass ? 'text' : 'password';
    const icon = elBtnToggleKeyVis.querySelector('i');
    icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
    lucide.createIcons();
  });

  // Open settings modal
  elBtnOpenSettings.addEventListener('click', () => {
    elInputGeminiKey.value = appState.apiKey;
    elKeyTestStatus.className = 'modal-status-box idle';
    elKeyTestStatus.innerHTML = '<i data-lucide="help-circle"></i><span>Enter API Key to test connection.</span>';
    lucide.createIcons();
    elSettingsModal.classList.remove('hidden');
  });

  // Close settings modal
  const closeSettings = () => elSettingsModal.classList.add('hidden');
  elBtnCloseSettings.addEventListener('click', closeSettings);
  elBtnCancelSettings.addEventListener('click', closeSettings);

  // Save settings
  elBtnSaveSettings.addEventListener('click', async () => {
    const enteredKey = elInputGeminiKey.value.trim();
    if (!enteredKey) {
      // Clear key
      localStorage.removeItem('synapse_gemini_key');
      appState.apiKey = '';
      updateEngineBadge();
      closeSettings();
      return;
    }

    // Test connection before saving
    elKeyTestStatus.className = 'modal-status-box connecting';
    elKeyTestStatus.innerHTML = '<i class="animate-pulse" data-lucide="loader"></i><span>Validating key with Gemini API...</span>';
    lucide.createIcons();

    try {
      const isConnected = await testGeminiConnection(enteredKey);
      if (isConnected) {
        localStorage.setItem('synapse_gemini_key', enteredKey);
        appState.apiKey = enteredKey;
        updateEngineBadge();
        elKeyTestStatus.className = 'modal-status-box success';
        elKeyTestStatus.innerHTML = '<i data-lucide="check-circle-2"></i><span>Connection Successful! Settings saved.</span>';
        lucide.createIcons();
        setTimeout(closeSettings, 1000);
      } else {
        throw new Error('Key validation failed.');
      }
    } catch (e) {
      elKeyTestStatus.className = 'modal-status-box error';
      elKeyTestStatus.innerHTML = '<i data-lucide="x-circle"></i><span>Invalid API Key. Connection failed.</span>';
      lucide.createIcons();
    }
  });

  // Clear settings
  elBtnClearSettings.addEventListener('click', () => {
    localStorage.removeItem('synapse_gemini_key');
    appState.apiKey = '';
    elInputGeminiKey.value = '';
    updateEngineBadge();
    elKeyTestStatus.className = 'modal-status-box idle';
    elKeyTestStatus.innerHTML = '<i data-lucide="help-circle"></i><span>API connection details removed.</span>';
    lucide.createIcons();
    setTimeout(closeSettings, 800);
  });

  // API key connection validator
  async function testGeminiConnection(key) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the word "OK"' }] }]
        })
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      return data.candidates[0].content.parts[0].text.includes('OK');
    } catch (err) {
      return false;
    }
  }

  // --- Dynamic Editor Gutter ---
  function setupEditorGutter() {
    const updateGutter = () => {
      const text = elNoteInput.value;
      const lines = text.split('\n').length;
      const gutter = document.querySelector('.editor-gutter');
      gutter.innerHTML = '';
      for (let i = 1; i <= Math.max(lines, 15); i++) {
        const span = document.createElement('span');
        span.textContent = i;
        gutter.appendChild(span);
      }
    };

    elNoteInput.addEventListener('input', updateGutter);
    elNoteInput.addEventListener('scroll', () => {
      document.querySelector('.editor-gutter').scrollTop = elNoteInput.scrollTop;
    });

    // Stats counter
    elNoteInput.addEventListener('input', () => {
      const text = elNoteInput.value;
      elCharCount.textContent = `${text.length} characters`;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      elWordCount.textContent = `${words} words`;
    });
  }

  // --- Template Loading ---
  const templates = {
    cardiology: `CHIEF COMPLAINT:
Intermittent chest discomfort over the last 2 days.

HISTORY OF PRESENT ILLNESS:
The patient is a 54-year-old male, compliant with some medicines but admits to neglecting others, who presents with intermittent central chest pressure radiating down the left arm. Symptoms first occurred 2 days ago while walking up stairs. The pressure is described as 6/10 in severity, lasting approximately 10 to 15 minutes per episode, and resolving completely with rest. He had another episode this morning while brushing his teeth, which prompted him to seek care. He denies shortness of breath, diaphoresis, palpitations, nausea, or lightheadedness.

MEDICAL HISTORY:
- Essential Hypertension, diagnosed 6 years ago.
- Hyperlipidemia.
- Family history of premature CAD (father had MI at age 52).
- No known drug allergies (NKDA).

MEDICATIONS:
- Lisinopril 20 mg PO daily (admits to missing several doses this week).
- Atorvastatin 40 mg PO daily at bedtime.

VITAL SIGNS:
Blood pressure is 142/88 mmHg. Heart rate is 88 bpm. Temperature is 98.4°F (36.9°C) orally. Respiratory rate is 16/min. SpO2 is 97% on room air. Weight is 88 kg.

EXAMINATION FINDINGS:
Alert and oriented x3, in no acute distress.
Cardiovascular: S1, S2 regular rate and rhythm, no murmurs, rubs, or gallops. Radial pulses 2+ bilaterally.
Lungs: Clear to auscultation bilaterally, normal respiratory effort.
Extremities: Warm, well-perfused, trace pedal edema bilaterally.

INVESTIGATIONS:
- Outpatient 12-Lead ECG: Normal sinus rhythm at 85 bpm, no acute ST elevations or depression, no T-wave inversions.
- Point-of-care Troponin I: <0.01 ng/mL (negative).

ASSESSMENT:
1. Atypical chest pain - suspected myocardial ischemia, rule out acute coronary syndrome (ACS).
2. Essential Hypertension - poorly controlled, likely secondary to medication non-compliance.
3. Hyperlipidemia.

TREATMENT & PLAN:
- Initiated Aspirin 81 mg daily in clinic.
- Rescheduled for outpatient Exercise Myocardial Perfusion Imaging (Stress Test) within 48 hours.
- Counseled extensively on strict adherence to Lisinopril 20 mg daily.
- Patient instructed to go immediately to the Emergency Room if chest pressure returns and lasts more than 15 minutes, or is accompanied by shortness of breath, heavy sweating, or pain radiating to the jaw, neck, or back.`,

    orthopedics: `CHIEF COMPLAINT:
Right knee pain and inability to bear weight.

HISTORY OF PRESENT ILLNESS:
A 24-year-old female college soccer player presents following an acute injury to her right knee during a match yesterday afternoon. She describes planting her right foot and pivoting to make a pass, at which point she felt a popping sensation in the knee accompanied by immediate severe pain. She fell to the ground and was unable to continue playing. The knee swelled rapidly within 1 hour of the injury. She has been unable to put any weight on her right leg since the incident. She denies any previous injury to either knee.

MEDICAL HISTORY:
- History of childhood asthma, inactive.
- Left wrist fracture, surgically repaired in 2018.
- Allergies: NKDA.

MEDICATIONS:
- Multivitamin daily.

VITAL SIGNS:
BP 118/76 mmHg. Heart rate 74 bpm. Temp 98.6°F. RR 12/min. SpO2 99% on room air. Weight 62 kg.

EXAMINATION FINDINGS:
Right Knee Physical Exam:
- Inspection: Moderate to severe joint effusion present.
- Palpation: Diffuse tenderness over the joint line, particularly on the lateral aspect.
- Range of Motion: Limited active flexion to 90 degrees due to pain and swelling; extension limited to -5 degrees.
- Stability Tests: Positive Lachman test (demonstrating anterior translation with soft endpoint). Positive McMurray test laterally, though limited by guarding. Anterior drawer test is positive. Posterior drawer and varus/valgus stress tests at 0 and 30 degrees are stable.

INVESTIGATIONS:
- Right Knee X-rays (AP, Lateral, Sunrise): Negative for acute fracture or dislocation. Joint effusion noted.

ASSESSMENT:
1. Right knee joint effusion with suspected acute Anterior Cruciate Ligament (ACL) tear.
2. Suspected lateral meniscus tear.

TREATMENT & PLAN:
- Placed in a knee immobilizer.
- Provided crutches and instructed on non-weight bearing status.
- Prescribed RICE protocol (Rest, Ice, Compression, Elevation).
- Prescribed Ibuprofen 600 mg PO every 6 hours as needed for pain.
- Scheduled MRI of the right knee within 3 days.
- Patient to follow up in Orthopedic Clinic in 1 week with MRI results.
- Warned patient to go to the emergency department if she develops severe calf pain, swelling, warmth, or redness (to rule out DVT).`,

    neurology: `CHIEF COMPLAINT:
Transient left-sided facial numbness and left arm weakness.

HISTORY OF PRESENT ILLNESS:
The patient is a 36-year-old female who presents to urgent care complaining of sudden onset left-sided facial tingling and subjective weakness in her left hand, which started approximately 2 hours ago while sitting at her desk. She also describes seeing a "shimmering, zigzagging line" in her left peripheral visual field about 20 minutes prior to the onset of the numbness. The visual symptom has resolved, but the facial numbness and hand weakness persist. She has a history of severe episodic headaches. She denies speech difficulty, confusion, chest pain, or leg weakness.

MEDICAL HISTORY:
- Migraine headache with aura (diagnosed at age 18, episodes occur 1-2 times per month).
- Mild depression.
- Allergies: Penicillin (causes hives).

MEDICATIONS:
- Sertraline 50 mg daily.
- Sumatriptan 50 mg PO as needed at onset of migraine.

VITAL SIGNS:
BP is 128/80 mmHg. HR is 72 bpm. Temp is 98.9°F. RR is 14/min. SpO2 is 99%.

EXAMINATION FINDINGS:
Neurological Exam:
- Mental Status: Alert, oriented, normal speech and language.
- Cranial Nerves: Sensation to light touch slightly decreased over the left cheek. Cranial nerves II-XII otherwise intact. No facial droop, normal extraocular movements.
- Motor: 5/5 strength throughout upper and lower extremities bilaterally. Left hand grip strength is symmetric and 5/5, despite subjective feeling of weakness.
- Sensory: Subjective decrease in sensation to pinprick in the left hand, resolving at the wrist.
- Coordination: Normal finger-to-nose and rapid alternating movements. Gait is normal.

INVESTIGATIONS:
- Non-contrast CT of the head: Normal brain parenchyma, no signs of acute hemorrhage or mass effect.

ASSESSMENT:
1. Stroke mimic - likely hemiplegic migraine vs. sensory migraine aura. Fully resolved visual aura.
2. Migraine with aura - history of same.

TREATMENT & PLAN:
- Administered Sumatriptan 50 mg PO in clinic, with significant improvement in numbness within 45 minutes.
- Prescribed Magnesium oxide 400 mg daily for migraine prophylaxis.
- Instructed patient to follow up with neurology outpatient within 2-3 weeks.
- Crucial warning: Patient must seek immediate emergency medical care (call 911) if she experiences slurred speech, facial drooping, objective limb weakness, loss of vision, or a sudden "thunderclap" headache.`,

    pediatrics: `CHIEF COMPLAINT:
Difficulty breathing and coughing.

HISTORY OF PRESENT ILLNESS:
A 7-year-old male is brought to the pediatric ER by his mother due to acute respiratory distress and wheezing. The mother states the child developed a cold 2 days ago with runny nose and mild cough. Overnight, his cough became barky and dry, and this morning he developed rapid breathing and noticeable sucking in of his ribs. He has had difficulty speaking in full sentences. The mother administered two puffs of albuterol via spacer at home 1 hour ago with minimal improvement.

MEDICAL HISTORY:
- Moderate Persistent Asthma (diagnosed at age 4, history of one hospitalization).
- Severe peanut allergy.
- Atopic dermatitis.

MEDICATIONS:
- Flovent (fluticasone) HFA 44 mcg, 2 puffs twice daily (mother admits she hasn't refilled it in 2 months).
- Albuterol HFA 90 mcg, 2 puffs inhaled every 4 hours as needed.

VITAL SIGNS:
BP 100/60 mmHg. Heart rate is elevated at 118 bpm (tachycardia). Temperature is 100.2°F (38.8°C) tympanic. Respiratory rate is 28/min (tachypnea). SpO2 is 93% on room air (hypoxia). Weight is 22 kg.

EXAMINATION FINDINGS:
General: Alert but appears anxious, speaking in short 3-4 word phrases.
Respiratory: Moderate subcostal and intercostal retractions. Nasal flaring present. Diffuse, high-pitched expiratory wheezes throughout all lung fields, with decreased aeration at the bases.
HEENT: Clear rhinorrhea, pharynx is mildly erythematous without exudate.
Skin: Dry skin with mild eczematous patches on antecubital fossae. No hives.

INVESTIGATIONS:
- Point-of-care SpO2: 93% on room air (abnormal).

ASSESSMENT:
1. Acute asthma exacerbation - triggered by viral upper respiratory infection.
2. Hypoxia (SpO2 93%).
3. Chronic asthma - uncontrolled secondary to maintenance inhaler non-adherence.

TREATMENT & PLAN:
- Administered continuous albuterol nebulizer treatments (2.5 mg x3) in emergency bay.
- Administered Oral Prednisolone liquid 20 mg (1 mg/kg) in clinic.
- Placed on 1 L/min nasal cannula oxygen, bringing SpO2 up to 98%.
- Plan: Discharge home once wheezing resolves, retractions subside, and patient maintains SpO2 >94% on room air for 2 hours.
- Discharge meds: Oral Prednisolone 20 mg daily for 5 days. Resume Flovent HFA 44 mcg 2 puffs twice daily (refill sent to pharmacy).
- Follow up: Pediatrician visit scheduled in 48 hours.
- Warning Signs: Mother instructed to return to ER immediately if child has retractions that don't improve with albuterol, blue lips or tongue, extreme lethargy, or if he is unable to speak.`
  };

  elTemplateSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (templates[key]) {
      elNoteInput.value = templates[key];
      // Trigger input event to update counts/gutter
      elNoteInput.dispatchEvent(new Event('input'));
    }
  });

  // --- Dictation Simulator ---
  elBtnDictate.addEventListener('click', () => {
    const dictationText = `CHIEF COMPLAINT:\nSevere chest pain radiating to left shoulder.\n\nHISTORY OF PRESENT ILLNESS:\nPatient is a 62-year-old female presenting to triage with severe retrosternal chest pain that began 4 hours ago. Pain is described as a heavy crushing sensation, graded 8/10, radiating to the left shoulder and neck. She reports associated nausea, cold sweat, and mild dyspnea. Symptoms are constant and did not improve after taking one nitroglycerin tablet from her husband.\n\nMEDICAL HISTORY:\n- Coronary artery disease with PCI in 2021.\n- Type 2 Diabetes.\n- Hypercholesterolemia.\n- NKDA.\n\nMEDICATIONS:\n- Metformin 1000mg BID.\n- Atorvastatin 80mg daily.\n- Clopidogrel 75mg daily.\n\nVITAL SIGNS:\nBP 148/94 mmHg. HR 105 bpm. Temp 98.0°F. RR 20/min. SpO2 94% on room air. Weight 75 kg.\n\nEXAMINATION FINDINGS:\nPatient appears acutely diaphoretic and anxious. Normal heart sounds S1, S2, no murmurs. Lungs are clear to auscultation. Radial pulses are symmetrical and intact.\n\nINVESTIGATIONS:\nECG shows 2mm ST-elevation in leads V2-V4. Troponin is pending.\n\nASSESSMENT:\n1. Acute Anterior ST-Elevation Myocardial Infarction (STEMI).\n2. Uncontrolled Type 2 Diabetes.\n\nTREATMENT & PLAN:\n- Loaded Aspirin 325mg chewable and Clopidogrel 300mg PO.\n- Initiated IV Heparin protocol.\n- Activated the cardiac catheterization lab for immediate emergency angiography.\n- Emergency Cardiology consult called.\n- Warning: Monitor continuously for arrhythmias and cardiovascular collapse.`;

    if (appState.isTyping) return;
    appState.isTyping = true;
    elNoteInput.value = '';
    elBtnDictate.disabled = true;

    let index = 0;
    const typeWriter = () => {
      if (index < dictationText.length) {
        // Type in chunks for realistic speed
        const chunk = dictationText.substring(index, index + 8);
        elNoteInput.value += chunk;
        index += 8;
        elNoteInput.dispatchEvent(new Event('input'));
        // Scroll to bottom
        elNoteInput.scrollTop = elNoteInput.scrollHeight;
        setTimeout(typeWriter, 15);
      } else {
        appState.isTyping = false;
        elBtnDictate.disabled = false;
      }
    };
    typeWriter();
  });

  // Clear note
  elBtnClear.addEventListener('click', () => {
    elNoteInput.value = '';
    elNoteInput.dispatchEvent(new Event('input'));
    elTemplateSelect.value = '';
  });

  // --- Processing and Summarization ---
  elBtnSummarize.addEventListener('click', async () => {
    const text = elNoteInput.value.trim();
    if (!text) {
      alert('Please enter or load a clinical note before summarizing.');
      return;
    }

    // Toggle View State to Loading
    elEmptyState.classList.add('hidden');
    elDashboardActive.classList.add('hidden');
    elLoadingState.classList.remove('hidden');
    elBtnPrint.disabled = true;

    // Run processing animations
    const steps = [
      { text: 'Parsing clinical note...', detail: 'Scanning document structures...', progress: 15 },
      { text: 'Extracting medical components...', detail: 'Identifying patient age, gender, and symptoms...', progress: 40 },
      { text: 'Parsing vital signs...', detail: 'Analyzing BP, heart rate, and oxygen levels against safety ranges...', progress: 70 },
      { text: 'Structuring clinical summary...', detail: 'Drafting EHR-compatible medical output...', progress: 95 }
    ];

    for (let step of steps) {
      elLoadingStep.textContent = step.text;
      elLoadingDetail.textContent = step.detail;
      elProgressBarFill.style.width = `${step.progress}%`;
      // Allow visual update
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      if (appState.apiKey) {
        // Run Live AI Call
        await runLiveAI(text);
      } else {
        // Run Simulation Engine
        await runSimulation(text);
      }

      // Display Dashboard
      elLoadingState.classList.add('hidden');
      elDashboardActive.classList.remove('hidden');
      elBtnPrint.disabled = false;
      
      // Update Lucide Icons in dashboard
      lucide.createIcons();

      // Reset Active Tab to Structured Summary
      document.querySelector('.tab-link[data-tab="summary-view"]').click();

    } catch (e) {
      console.error(e);
      alert('An error occurred while generating the summary. Please check your API configuration or note content.');
      elLoadingState.classList.add('hidden');
      elEmptyState.classList.remove('hidden');
    }
  });

  // --- Simulation Engine ---
  async function runSimulation(text) {
    // Check if the input matches any known template text
    let matchedTemplate = null;
    if (text.includes('twisting injury of her right knee')) {
      matchedTemplate = 'orthopedics';
    } else if (text.includes('54-year-old male') && text.includes('chest discomfort')) {
      matchedTemplate = 'cardiology';
    } else if (text.includes('transient left-sided facial numbness')) {
      matchedTemplate = 'neurology';
    } else if (text.includes('Difficulty breathing and coughing') && text.includes('7-year-old')) {
      matchedTemplate = 'pediatrics';
    } else if (text.includes('retrosternal chest pain') && text.includes('62-year-old')) {
      // Dictation mock
      matchedTemplate = 'dictation';
    }

    let summaryObj;

    if (matchedTemplate === 'cardiology') {
      summaryObj = getCardiologyMock();
    } else if (matchedTemplate === 'orthopedics') {
      summaryObj = getOrthopedicsMock();
    } else if (matchedTemplate === 'neurology') {
      summaryObj = getNeurologyMock();
    } else if (matchedTemplate === 'pediatrics') {
      summaryObj = getPediatricsMock();
    } else if (matchedTemplate === 'dictation') {
      summaryObj = getDictationMock();
    } else {
      // General Fallback Parser (custom notes in Simulation Mode)
      summaryObj = parseClinicalNoteWithRegex(text);
    }

    appState.currentSummary = summaryObj;
    renderSummaryDashboard(summaryObj);
  }

  // --- Live AI Execution via Gemini ---
  async function runLiveAI(text) {
    const prompt = `You are an expert AI clinical summarizer. Your task is to analyze the unstructured clinical note below and output a strict JSON object mapping clinical sections. Do not assume or extrapolate facts; if details are not explicitly present, write "Not mentioned".

Input Clinical Note:
"""
${text}
"""

You MUST reply with a valid JSON object matching this schema:
{
  "patientInfo": {
    "age": "Age in years, months or 'Not mentioned'",
    "gender": "Gender or 'Not mentioned'",
    "overview": "Short narrative summary (1-2 sentences) of patient's background and visit context."
  },
  "chiefComplaint": "Primary reason for visit.",
  "hpi": "History of Present Illness details (symptoms, duration, course, etc.)",
  "medicalHistory": ["list of medical conditions, surgical history, and family/social history. List NKDA/allergies here."],
  "medications": [
    { "name": "Medication Name", "dose": "dosage details (frequency/amount) or 'Not mentioned'" }
  ],
  "vitals": {
    "bp": "Blood pressure e.g. 120/80 or 'Not mentioned'",
    "hr": "Heart rate value as number/string or 'Not mentioned'",
    "temp": "Temperature in F or C or 'Not mentioned'",
    "spo2": "SpO2 percentage or 'Not mentioned'",
    "rr": "Respiratory rate value or 'Not mentioned'"
  },
  "examFindings": ["Physical exam observations."],
  "labs": ["Relevant laboratory results, ECG, imaging findings."],
  "assessment": [
    { 
      "name": "Diagnosis/Assessment title", 
      "status": "One of: 'confirmed' | 'suspected' | 'symptom' | 'finding'" 
    }
  ],
  "plan": ["List of medications prescribed, referrals, counseling, procedures, or scheduled tests."],
  "followUp": "Explicit follow-up timelines, warnings, pending investigations, or appointments.",
  "summary": "A concise 2-4 sentence clinical overview summarizing the condition, key findings, and clinical plan.",
  "urgentWarnings": ["Explicitly extract warning signs, high-risk flags, or abnormal clinical readings."]
}

Ensure all JSON structures are compliant, fields have strings or arrays as defined, and no backticks or extra text outside the JSON. Return only the JSON object.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${appState.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const resData = await response.json();
    const jsonString = resData.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(jsonString.trim());
    
    appState.currentSummary = parsedData;
    renderSummaryDashboard(parsedData);
  }

  // --- Dynamic Dashboard Rendering ---
  function renderSummaryDashboard(data) {
    // 1. Patient Demographics & Overview
    elOutGender.textContent = (data.patientInfo.gender || 'Not mentioned').toUpperCase();
    elOutAge.textContent = (data.patientInfo.age || 'Not mentioned').toUpperCase();
    elOutNarrative.textContent = data.patientInfo.overview || 'Not mentioned';

    // 2. Chief Complaint & HPI
    elOutComplaint.textContent = data.chiefComplaint || 'Not mentioned';
    elOutHpi.textContent = data.hpi || 'Not mentioned';

    // 3. Vital Signs Formatting and Color coding
    renderVitalCard(elVitalCardBp, elVitalBpVal, elVitalBpStatus, data.vitals.bp, 'bp');
    renderVitalCard(elVitalCardHr, elVitalHrVal, elVitalHrStatus, data.vitals.hr, 'hr');
    renderVitalCard(elVitalCardTemp, elVitalTempVal, elVitalTempStatus, data.vitals.temp, 'temp');
    renderVitalCard(elVitalCardSpo2, elVitalSpo2Val, elVitalSpo2Status, data.vitals.spo2, 'spo2');
    renderVitalCard(elVitalCardRr, elVitalRrVal, elVitalRrStatus, data.vitals.rr, 'rr');

    // 4. Medical History
    renderListToDom(elOutHistory, data.medicalHistory);

    // 5. Examination Findings
    renderListToDom(elOutExam, data.examFindings);

    // 6. Investigations & Labs
    if (data.labs && data.labs.length > 0 && data.labs[0] !== 'Not mentioned') {
      elOutLabs.innerHTML = '';
      data.labs.forEach(lab => {
        const li = document.createElement('li');
        
        let labelClass = '';
        if (/elevated|abnormal|positive|st-elevation|hypoxia|high|low/i.test(lab)) {
          li.classList.add('abnormal');
          labelClass = 'abnormal';
        } else if (/borderline|mild/i.test(lab)) {
          li.classList.add('warn');
          labelClass = 'warn';
        }

        const spanName = document.createElement('span');
        spanName.className = 'lab-name';
        spanName.textContent = lab;

        li.appendChild(spanName);
        elOutLabs.appendChild(li);
      });
    } else {
      elOutLabs.innerHTML = '<li class="empty-list-msg">Not mentioned</li>';
    }

    // 7. Assessment & Diagnoses
    if (data.assessment && data.assessment.length > 0 && data.assessment[0] !== 'Not mentioned') {
      elOutAssessment.innerHTML = '';
      data.assessment.forEach(diag => {
        const badge = document.createElement('div');
        const status = (diag.status || 'symptom').toLowerCase();
        badge.className = `diagnosis-badge ${status}`;
        
        badge.innerHTML = `
          <span class="diag-name">${diag.name}</span>
          <span class="diag-status">${status}</span>
        `;
        elOutAssessment.appendChild(badge);
      });
    } else {
      elOutAssessment.innerHTML = '<div class="empty-list-msg">Not mentioned</div>';
    }

    // 8. Medications
    if (data.medications && data.medications.length > 0 && data.medications[0] !== 'Not mentioned') {
      elOutMedications.innerHTML = '';
      data.medications.forEach(med => {
        // If the medication element is a simple string, convert to object
        const medName = typeof med === 'string' ? med : (med.name || 'Not mentioned');
        const medDose = typeof med === 'string' ? '' : (med.dose || '');

        const li = document.createElement('li');
        li.className = 'med-item';
        li.innerHTML = `
          <div class="med-icon-wrapper"><i data-lucide="pill"></i></div>
          <div class="med-details">
            <span class="med-name">${medName}</span>
            ${medDose ? `<span class="med-dose">${medDose}</span>` : ''}
          </div>
        `;
        elOutMedications.appendChild(li);
      });
    } else {
      elOutMedications.innerHTML = '<li class="empty-list-msg">Not mentioned</li>';
    }

    // 9. Plan
    renderListToDom(elOutPlan, data.plan);

    // 10. Follow-up
    elOutFollowup.textContent = data.followUp || 'Not mentioned';

    // 11. Clinical Alerts & Checklist Calculations
    calculateClinicalAlerts(data);

    // 12. Markdown Preview Generation
    generateMarkdownOutput(data);
  }

  // Helper: Lists to Bullet Lists
  function renderListToDom(element, list) {
    if (list && list.length > 0 && list[0] !== 'Not mentioned') {
      element.innerHTML = '';
      list.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        element.appendChild(li);
      });
    } else {
      element.innerHTML = '<li>Not mentioned</li>';
    }
  }

  // Helper: Vital Signs Color Coding
  function renderVitalCard(card, valEl, statusEl, value, type) {
    card.className = 'vital-card';
    valEl.textContent = value || '--';
    
    if (!value || value === 'Not mentioned' || value === '--') {
      statusEl.textContent = 'No data';
      return;
    }

    let status = 'normal';
    let label = 'Normal';

    if (type === 'bp') {
      const parts = value.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0], 10);
        const dia = parseInt(parts[1], 10);
        if (sys >= 140 || dia >= 90) {
          status = 'critical';
          label = 'Hypertensive';
        } else if (sys <= 90 || dia <= 60) {
          status = 'critical';
          label = 'Hypotensive';
        } else if (sys >= 121 || dia >= 81) {
          status = 'warning';
          label = 'Prehypertension';
        }
      }
    } else if (type === 'hr') {
      const hrVal = parseInt(value, 10);
      if (!isNaN(hrVal)) {
        if (hrVal > 100) {
          status = 'critical';
          label = 'Tachycardia';
        } else if (hrVal < 60) {
          status = 'warning';
          label = 'Bradycardia';
        }
      }
    } else if (type === 'temp') {
      const tempVal = parseFloat(value);
      if (!isNaN(tempVal)) {
        if (tempVal >= 100.4) {
          status = 'warning';
          label = 'Fever';
        } else if (tempVal <= 95.0) {
          status = 'critical';
          label = 'Hypothermia';
        }
      }
    } else if (type === 'spo2') {
      const spo2Val = parseInt(value, 10);
      if (!isNaN(spo2Val)) {
        if (spo2Val < 95) {
          status = 'critical';
          label = 'Hypoxia';
        }
      }
    } else if (type === 'rr') {
      const rrVal = parseInt(value, 10);
      if (!isNaN(rrVal)) {
        if (rrVal > 20) {
          status = 'warning';
          label = 'Tachypnea';
        } else if (rrVal < 12) {
          status = 'warning';
          label = 'Bradypnea';
        }
      }
    }

    card.classList.add(status);
    statusEl.textContent = label;
  }

  // --- Safety Checklist & Clinical Warnings ---
  function calculateClinicalAlerts(data) {
    const alerts = [];
    
    // Check Vital signs
    // BP
    if (data.vitals.bp && data.vitals.bp !== 'Not mentioned') {
      const parts = data.vitals.bp.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0], 10);
        const dia = parseInt(parts[1], 10);
        if (sys >= 140 || dia >= 90) {
          alerts.push({
            severity: 'warning',
            title: 'Hypertension Detected',
            desc: `Systolic/diastolic blood pressure readings (${data.vitals.bp} mmHg) indicate stage 1/2 hypertension. Consider compliance review.`
          });
        } else if (sys <= 90 || dia <= 60) {
          alerts.push({
            severity: 'danger',
            title: 'Hypotension Alert',
            desc: `Blood pressure reading is critically low (${data.vitals.bp} mmHg). Monitor for orthostatic symptoms or shock.`
          });
        }
      }
    }

    // HR
    if (data.vitals.hr && data.vitals.hr !== 'Not mentioned') {
      const hrVal = parseInt(data.vitals.hr, 10);
      if (hrVal > 100) {
        alerts.push({
          severity: 'danger',
          title: 'Tachycardia Alert',
          desc: `Elevated heart rate noted at ${hrVal} bpm. Verify cardiorespiratory status.`
        });
      }
    }

    // SpO2
    if (data.vitals.spo2 && data.vitals.spo2 !== 'Not mentioned') {
      const spo2Val = parseInt(data.vitals.spo2, 10);
      if (spo2Val < 95) {
        alerts.push({
          severity: 'danger',
          title: 'Hypoxia Alert',
          desc: `Oxygen saturation reading is deficient at ${spo2Val}%. Immediate respiratory/oxygen support evaluation recommended.`
        });
      }
    }

    // Urgent warnings from notes
    if (data.urgentWarnings && data.urgentWarnings.length > 0 && data.urgentWarnings[0] !== 'Not mentioned') {
      data.urgentWarnings.forEach(warn => {
        alerts.push({
          severity: 'danger',
          title: 'Clinical Risk Alert',
          desc: warn
        });
      });
    }

    // Allergy check
    const mentionsAllergy = data.medicalHistory.some(h => /allergy|nkda/i.test(h)) || 
                             data.hpi.toLowerCase().includes('allergy') ||
                             data.hpi.toLowerCase().includes('nkda');

    // Populate Alerts UI
    elAlertsFeed.innerHTML = '';
    if (alerts.length > 0) {
      elAlertsCount.textContent = alerts.length;
      elAlertsCount.classList.remove('hidden');
      elOutUrgentBadge.classList.remove('hidden');

      alerts.forEach(alert => {
        const item = document.createElement('div');
        item.className = `alert-item ${alert.severity}`;
        item.innerHTML = `
          <i data-lucide="${alert.severity === 'danger' ? 'alert-triangle' : 'alert-circle'}" class="alert-feed-icon"></i>
          <div class="alert-feed-info">
            <h4>${alert.title}</h4>
            <p>${alert.desc}</p>
          </div>
        `;
        elAlertsFeed.appendChild(item);
      });
    } else {
      elAlertsCount.textContent = '0';
      elAlertsCount.classList.add('hidden');
      elOutUrgentBadge.classList.add('hidden');

      elAlertsFeed.innerHTML = `
        <div class="alert-item success">
          <i data-lucide="shield-check" class="alert-feed-icon"></i>
          <div class="alert-feed-info">
            <h4>No Clinical Anomalies Detected</h4>
            <p>All extracted vital signs are within normal clinical thresholds. No urgent alerts parsed.</p>
          </div>
        </div>
      `;
    }

    // Completeness Checklist
    updateChecklistItem(elChkDemographics, data.patientInfo.age !== 'Not mentioned' && data.patientInfo.gender !== 'Not mentioned');
    updateChecklistItem(elChkVitals, data.vitals.bp !== 'Not mentioned' || data.vitals.hr !== 'Not mentioned' || data.vitals.spo2 !== 'Not mentioned');
    updateChecklistItem(elChkComplaint, data.chiefComplaint !== 'Not mentioned');
    updateChecklistItem(elChkMeds, data.medications && data.medications.length > 0 && data.medications[0] !== 'Not mentioned');
    updateChecklistItem(elChkAllergies, mentionsAllergy);
    updateChecklistItem(elChkFollowup, data.followUp !== 'Not mentioned');
  }

  function updateChecklistItem(el, condition) {
    const existingIcon = el.querySelector('i, svg');
    if (existingIcon) {
      existingIcon.remove();
    }
    const newIcon = document.createElement('i');
    if (condition) {
      newIcon.className = 'checked';
      newIcon.setAttribute('data-lucide', 'check-square');
    } else {
      newIcon.className = 'unchecked';
      newIcon.setAttribute('data-lucide', 'x-square');
    }
    el.insertBefore(newIcon, el.firstChild);
  }

  // --- Output Markdown Generation ---
  function generateMarkdownOutput(data) {
    const lines = [];
    lines.push(`**Medical Note Summary**`);
    lines.push(``);
    lines.push(`**Chief Complaint:**`);
    lines.push(data.chiefComplaint || 'Not mentioned');
    lines.push(``);
    lines.push(`**History of Present Illness:**`);
    lines.push(data.hpi || 'Not mentioned');
    lines.push(``);
    lines.push(`**Medical History:**`);
    if (data.medicalHistory && data.medicalHistory.length > 0 && data.medicalHistory[0] !== 'Not mentioned') {
      data.medicalHistory.forEach(item => lines.push(`* ${item}`));
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Medications:**`);
    if (data.medications && data.medications.length > 0 && data.medications[0] !== 'Not mentioned') {
      data.medications.forEach(med => {
        const medName = typeof med === 'string' ? med : (med.name || 'Not mentioned');
        const medDose = typeof med === 'string' ? '' : (med.dose || '');
        lines.push(`* ${medName}${medDose ? ` - ${medDose}` : ''}`);
      });
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Vital Signs:**`);
    const vitalsStr = [];
    if (data.vitals.bp && data.vitals.bp !== 'Not mentioned') vitalsStr.push(`BP: ${data.vitals.bp} mmHg`);
    if (data.vitals.hr && data.vitals.hr !== 'Not mentioned') vitalsStr.push(`HR: ${data.vitals.hr} bpm`);
    if (data.vitals.temp && data.vitals.temp !== 'Not mentioned') vitalsStr.push(`Temp: ${data.vitals.temp}°F`);
    if (data.vitals.spo2 && data.vitals.spo2 !== 'Not mentioned') vitalsStr.push(`SpO2: ${data.vitals.spo2}%`);
    if (data.vitals.rr && data.vitals.rr !== 'Not mentioned') vitalsStr.push(`RR: ${data.vitals.rr}/min`);
    
    if (vitalsStr.length > 0) {
      lines.push(vitalsStr.join(', '));
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Examination Findings:**`);
    if (data.examFindings && data.examFindings.length > 0 && data.examFindings[0] !== 'Not mentioned') {
      data.examFindings.forEach(item => lines.push(`* ${item}`));
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Investigations & Lab Results:**`);
    if (data.labs && data.labs.length > 0 && data.labs[0] !== 'Not mentioned') {
      data.labs.forEach(item => lines.push(`* ${item}`));
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Assessment / Diagnoses:**`);
    if (data.assessment && data.assessment.length > 0 && data.assessment[0] !== 'Not mentioned') {
      data.assessment.forEach(diag => {
        lines.push(`* ${diag.name} (${diag.status || 'Symptom'})`);
      });
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Treatment & Plan:**`);
    if (data.plan && data.plan.length > 0 && data.plan[0] !== 'Not mentioned') {
      data.plan.forEach(item => lines.push(`* ${item}`));
    } else {
      lines.push('Not mentioned');
    }
    lines.push(``);
    lines.push(`**Important Findings / Follow-up:**`);
    lines.push(data.followUp || 'Not mentioned');
    lines.push(``);
    lines.push(`**Summary:**`);
    lines.push(data.summary || 'Not mentioned');

    const markdownOutput = lines.join('\n');
    elOutMarkdown.textContent = markdownOutput;
  }

  // Copy Markdown to Clipboard
  elBtnCopyMarkdown.addEventListener('click', () => {
    const text = elOutMarkdown.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const origText = elBtnCopyMarkdown.innerHTML;
      elBtnCopyMarkdown.innerHTML = '<i data-lucide="check"></i> Copied!';
      lucide.createIcons();
      setTimeout(() => {
        elBtnCopyMarkdown.innerHTML = origText;
        lucide.createIcons();
      }, 1500);
    });
  });

  // --- Tab Interactivity ---
  elTabLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Deactivate other tabs
      elTabLinks.forEach(t => t.classList.remove('active'));
      elTabPanes.forEach(p => p.classList.add('hidden'));

      // Activate current
      link.classList.add('active');
      const targetId = link.getAttribute('data-tab');
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

  // --- Print Summary ---
  elBtnPrint.addEventListener('click', () => {
    window.print();
  });

  // --- Regex Parser for Custom Notes in Simulation Mode ---
  function parseClinicalNoteWithRegex(text) {
    // Attempt standard regex extractions
    const ageMatch = text.match(/\b([0-9]{1,3})\s*(?:-year-old|-yo|y\.o\.|y\/o|years\s+old)\b/i);
    const genderMatch = text.match(/\b(male|female|man|woman|boy|girl|gentleman|lady)\b/i);
    
    // Vitals extraction
    const bpMatch = text.match(/\b(BP|blood\s+pressure)\s*(?:is|of|at)?\s*([0-9]{2,3}\s*\/\s*[0-9]{2,3})\b/i);
    const hrMatch = text.match(/\b(HR|heart\s+rate|pulse|PR)\s*(?:is|of|at)?\s*([0-9]{2,3})\b/i);
    const tempMatch = text.match(/\b(temp|temperature)\s*(?:is|of|at)?\s*([0-9]{2,3}(?:\.[0-9])?)\s*(?:F|C|°F|°C)?\b/i);
    const spo2Match = text.match(/\b(SpO2|oxygen\s+sat|O2\s+sat)\s*(?:is|of|at)?\s*([0-9]{2,3})\s*%/i);
    const rrMatch = text.match(/\b(RR|resp\s+rate|respiratory\s+rate)\s*(?:is|of|at)?\s*([0-9]{1,2})\b/i);

    // Sections split estimation
    const ccMatch = text.match(/(?:CHIEF COMPLAINT|CC):([\s\S]*?)(?=\n\n|\n[A-Z\s]{4,}:)/i) || 
                    text.match(/(?:presents\s+complaining\s+of|presents\s+with|reason\s+for\s+visit\s+is)\s+([^.\n]+)/i);

    const hpiMatch = text.match(/(?:HISTORY OF PRESENT ILLNESS|HPI):([\s\S]*?)(?=\n\n|\n[A-Z\s]{4,}:)/i);

    // Compile dynamic object
    const age = ageMatch ? ageMatch[1] + " years old" : "Not mentioned";
    const gender = genderMatch ? genderMatch[1] : "Not mentioned";
    const bpVal = bpMatch ? bpMatch[2].replace(/\s+/g, '') : "Not mentioned";
    const hrVal = hrMatch ? hrMatch[2] : "Not mentioned";
    const tempVal = tempMatch ? tempMatch[2] : "Not mentioned";
    const spo2Val = spo2Match ? spo2Match[2] : "Not mentioned";
    const rrVal = rrMatch ? rrMatch[2] : "Not mentioned";

    const chief = ccMatch ? ccMatch[1].trim() : "Review unstructured clinical input for chief complaint details.";
    const hpi = hpiMatch ? hpiMatch[1].trim() : "Review unstructured clinical input for timeline details.";

    // Medical history scan
    const medHistory = [];
    const medicalKeywords = ['hypertension', 'diabetes', 'asthma', 'gerd', 'copd', 'hyperlipidemia', 'cad', 'ckd', 'anxiety', 'depression'];
    medicalKeywords.forEach(kw => {
      if (new RegExp('\\b' + kw + '\\b', 'i').test(text)) {
        medHistory.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    });
    if (text.toLowerCase().includes('nkda') || text.toLowerCase().includes('no known drug allergies')) {
      medHistory.push('NKDA (No Known Drug Allergies)');
    }
    if (medHistory.length === 0) medHistory.push('Not mentioned');

    // Exam findings estimation
    const examFindings = [];
    if (/lungs?:?\s*clear/i.test(text)) examFindings.push('Lungs clear to auscultation');
    if (/s1\s*,?\s*s2/i.test(text)) examFindings.push('Normal S1, S2 regular heart rhythm');
    if (/no\s+edema/i.test(text)) examFindings.push('No peripheral lower extremity edema');
    if (/alert/i.test(text)) examFindings.push('Patient alert and oriented');
    if (examFindings.length === 0) examFindings.push('Not mentioned');

    // Medications estimation
    const medications = [];
    const medicationKeywords = ['lisinopril', 'metformin', 'atorvastatin', 'aspirin', 'albuterol', 'sertraline', 'ibuprofen', 'sumatriptan', 'prednisolone', 'flovent', 'fluticasone'];
    medicationKeywords.forEach(kw => {
      const match = text.match(new RegExp('\\b(' + kw + '\\s*[0-9mgmcg\\s]+(?:daily|bid|tid|qid|po|prn)?)\\b', 'i'));
      if (match) {
        medications.push({ name: match[1], dose: '' });
      } else if (new RegExp('\\b' + kw + '\\b', 'i').test(text)) {
        medications.push({ name: kw.charAt(0).toUpperCase() + kw.slice(1), dose: 'dose/frequency not mentioned' });
      }
    });
    if (medications.length === 0) medications.push('Not mentioned');

    // Labs/Investigations estimation
    const labs = [];
    if (/ecg|electrocardiogram/i.test(text)) labs.push('ECG documented in note');
    if (/troponin/i.test(text)) labs.push('Troponin laboratory check performed');
    if (/x-ray|xray/i.test(text)) labs.push('Plain film X-ray performed');
    if (/ct\s+head|head\s+ct/i.test(text)) labs.push('Non-contrast CT brain scan performed');
    if (labs.length === 0) labs.push('Not mentioned');

    // Assessment estimation
    const assessment = [];
    const assessMatch = text.match(/(?:ASSESSMENT|DIAGNOSES):([\s\S]*?)(?=\n\n|\n[A-Z\s]{4,}:)/i);
    if (assessMatch) {
      const lines = assessMatch[1].trim().split('\n');
      lines.forEach(l => {
        if (l.trim()) {
          assessment.push({ name: l.replace(/^[0-9.\-\s]+/, '').trim(), status: 'confirmed' });
        }
      });
    } else {
      assessment.push({ name: 'Clinical examination and evaluation completed.', status: 'finding' });
    }

    // Plan estimation
    const plan = [];
    const planMatch = text.match(/(?:TREATMENT\s*&\s*PLAN|PLAN):([\s\S]*?)(?=\n\n|\n[A-Z\s]{4,}:)/i);
    if (planMatch) {
      const lines = planMatch[1].trim().split('\n');
      lines.forEach(l => {
        if (l.trim()) plan.push(l.replace(/^[0-9.\-\*\s]+/, '').trim());
      });
    } else {
      plan.push('Refer to primary notes for treatment guidance.');
    }

    // FollowUp estimation
    const followMatch = text.match(/(?:follow up|follow-up|return)\s+in\s+([a-z0-9\s]+)/i);
    const followUp = followMatch ? `Follow up in ${followMatch[1].trim()}` : "Not mentioned";

    // Summary calculation
    const summary = `Patient is a ${age} ${gender} presenting with complaint of "${chief.substring(0, 50)}...". Core vitals indicate BP is ${bpVal}, HR is ${hrVal}, and SpO2 is ${spo2Val}. Plan of action includes clinical monitoring and outpatient support.`;

    const urgentWarnings = [];
    if (bpVal !== 'Not mentioned' && (parseInt(bpVal.split('/')[0]) >= 140 || parseInt(bpVal.split('/')[1]) >= 90)) {
      urgentWarnings.push('Elevated hypertensive BP readings detected.');
    }
    if (spo2Val !== 'Not mentioned' && parseInt(spo2Val) < 95) {
      urgentWarnings.push('Hypoxia risk. Low SpO2 value recorded.');
    }

    return {
      patientInfo: { age, gender, overview: `Unstructured text evaluation of a ${age} ${gender} case.` },
      chiefComplaint: chief,
      hpi: hpi,
      medicalHistory: medHistory,
      medications,
      vitals: { bp: bpVal, hr: hrVal, temp: tempVal, spo2: spo2Val, rr: rrVal },
      examFindings,
      labs,
      assessment,
      plan,
      followUp,
      summary,
      urgentWarnings
    };
  }

  // --- Template Data Helpers ---
  function getCardiologyMock() {
    return {
      patientInfo: {
        age: "54 years old",
        gender: "Male",
        overview: "54-year-old male with a history of hypertension and hyperlipidemia presenting with atypical chest discomfort."
      },
      chiefComplaint: "Intermittent chest discomfort over the last 2 days.",
      hpi: "Patient reports central chest pressure radiating down the left arm. Symptoms first occurred 2 days ago during mild exertion (walking up stairs). Pain is described as pressure-like, 6/10 intensity, lasting 10-15 minutes, and fully resolving with rest. A recurrence this morning prompted evaluation. Denies dyspnea, sweating, palpitations, or syncope.",
      medicalHistory: [
        "Essential Hypertension, diagnosed 6 years ago",
        "Hyperlipidemia",
        "Family history of premature CAD (father had MI at age 52)",
        "NKDA (No Known Drug Allergies)"
      ],
      medications: [
        { name: "Lisinopril", dose: "20 mg PO daily (admits to missing several doses this week)" },
        { name: "Atorvastatin", dose: "40 mg PO daily at bedtime" },
        { name: "Aspirin", dose: "81 mg daily (initiated in clinic)" }
      ],
      vitals: { bp: "142/88", hr: "88", temp: "98.4", spo2: "97", rr: "16" },
      examFindings: [
        "Alert and oriented x3, in no acute distress",
        "Cardiovascular: S1, S2 regular rate and rhythm, no murmurs, rubs, or gallops. Radial pulses 2+ bilaterally",
        "Lungs: Clear to auscultation bilaterally, normal respiratory effort",
        "Extremities: Warm, well-perfused, trace pedal edema bilaterally"
      ],
      labs: [
        "12-Lead ECG: Normal sinus rhythm at 85 bpm, no acute ST elevations/depressions or T-wave inversions",
        "Point-of-care Troponin I: <0.01 ng/mL (negative)"
      ],
      assessment: [
        { name: "Atypical chest pain (rule out ACS)", status: "suspected" },
        { name: "Essential Hypertension (uncontrolled)", status: "confirmed" },
        { name: "Hyperlipidemia", status: "confirmed" }
      ],
      plan: [
        "Initiated Aspirin 81 mg daily in clinic",
        "Schedule outpatient Exercise Myocardial Perfusion Imaging (Stress Test) within 48 hours",
        "Counseled on strict compliance to Lisinopril 20 mg daily",
        "Seek emergency room care immediately if chest pain lasts > 15 mins, or is accompanied by dyspnea, diaphoresis, or jaw/back radiation"
      ],
      followUp: "Outpatient Cardiology clinic follow-up in 2 weeks with stress test results, or emergency room immediately if symptoms worsen.",
      summary: "54-year-old male with hypertension and hyperlipidemia presenting with exertional chest pressure. Workup in clinic reveals normal ECG and negative Troponin. Plan includes scheduling an outpatient stress test, resuming hypertensive medication compliance, starting low-dose aspirin, and counseling on emergency red flag warnings.",
      urgentWarnings: [
        "Poorly controlled hypertension (BP 142/88 mmHg). Med compliance reinforced."
      ]
    };
  }

  function getOrthopedicsMock() {
    return {
      patientInfo: {
        age: "24 years old",
        gender: "Female",
        overview: "24-year-old female athlete presenting with acute right knee injury and inability to bear weight."
      },
      chiefComplaint: "Right knee pain and inability to bear weight.",
      hpi: "Soccer player injured right knee yesterday pivoting. Felt popping sensation with immediate severe pain. Fell and could not continue. Knee swelled within 1 hour. Non-weight bearing since. Denies past knee injuries.",
      medicalHistory: [
        "History of childhood asthma (inactive)",
        "Left wrist fracture, surgically repaired in 2018",
        "NKDA (No Known Drug Allergies)"
      ],
      medications: [
        { name: "Multivitamin", dose: "daily" },
        { name: "Ibuprofen", dose: "600 mg PO every 6 hours as needed for pain" }
      ],
      vitals: { bp: "118/76", hr: "74", temp: "98.6", spo2: "99", rr: "12" },
      examFindings: [
        "Right knee inspect: Moderate to severe joint effusion present",
        "Right knee palpate: Diffuse tenderness, worst over lateral joint line",
        "Range of Motion: limited flexion (90 degrees), limited extension (-5 degrees)",
        "Stability: Positive Lachman test, Positive McMurray test laterally (limited by guarding), Positive anterior drawer test. Stable varus/valgus stress."
      ],
      labs: [
        "Right Knee X-rays: AP, Lateral, Sunrise negative for acute fracture or dislocation. Joint effusion present."
      ],
      assessment: [
        { name: "Right knee joint effusion", status: "finding" },
        { name: "Acute Anterior Cruciate Ligament (ACL) tear", status: "suspected" },
        { name: "Lateral meniscus tear", status: "suspected" }
      ],
      plan: [
        "Placed in right knee immobilizer",
        "Provide crutches and strictly enforce non-weight bearing status",
        "Initiate RICE protocol (Rest, Ice, Compression, Elevation)",
        "Scheduled MRI of the right knee within 3 days",
        "Go to emergency department if calf pain, warmth, swelling, or redness develops"
      ],
      followUp: "Follow up in Orthopedic Clinic in 1 week with MRI findings.",
      summary: "24-year-old female soccer player presenting with right knee swelling and pain after a pivoting injury. Exam findings suggest an ACL tear and lateral meniscus injury. Initial treatment comprises a knee immobilizer, crutches, and pain control. Follow-up is arranged in 1 week following a scheduled MRI.",
      urgentWarnings: [
        "Severe right knee injury with complete inability to bear weight.",
        "Deep Vein Thrombosis (DVT) education provided: watch for calf pain/warmth."
      ]
    };
  }

  function getNeurologyMock() {
    return {
      patientInfo: {
        age: "36 years old",
        gender: "Female",
        overview: "36-year-old female presenting with transient neurological symptoms, history of migraines with aura."
      },
      chiefComplaint: "Transient left-sided facial numbness and left arm weakness.",
      hpi: "Onset 2 hours ago of sudden left facial tingling and subjective left hand weakness while sitting. Resolved visual scintilla 20 mins prior. History of severe headaches. Denies speech difficulty, confusion, or leg weakness.",
      medicalHistory: [
        "Migraine headache with aura, diagnosed at age 18 (occurs 1-2 times/month)",
        "Mild depression",
        "Allergies: Penicillin (causes hives)"
      ],
      medications: [
        { name: "Sertraline", dose: "50 mg daily" },
        { name: "Sumatriptan", dose: "50 mg PO as needed (taken in clinic)" },
        { name: "Magnesium oxide", dose: "400 mg daily (prescribed for prophylaxis)" }
      ],
      vitals: { bp: "128/80", hr: "72", temp: "98.9", spo2: "99", rr: "14" },
      examFindings: [
        "Mental status: Alert, oriented, normal speech and language",
        "CN: Sensation slightly decreased to light touch over left cheek, CN II-XII otherwise intact. No facial droop",
        "Motor: 5/5 strength throughout all four extremities. Symmetric hand grip strength",
        "Sensory: Subjective pinprick sensory decrease left hand, resolving at wrist"
      ],
      labs: [
        "Head CT (Non-contrast): Normal brain parenchyma, no hemorrhage, no mass effect"
      ],
      assessment: [
        { name: "Stroke mimic (hemiplegic migraine vs. sensory aura)", status: "suspected" },
        { name: "Migraine with aura", status: "confirmed" }
      ],
      plan: [
        "Administered Sumatriptan 50 mg PO in clinic (numbness improved by 45 mins)",
        "Initiated Magnesium oxide 400 mg daily for migraine prevention",
        "Outpatient neurology referral scheduled",
        "Go to ER (call 911) if slurred speech, facial droop, objective arm/leg weakness, visual loss, or sudden thunderclap headache occurs"
      ],
      followUp: "Outpatient neurology clinic follow-up within 2-3 weeks, or immediate ER evaluation for neurological deficits.",
      summary: "36-year-old female with a history of migraines presents with transient left-sided facial numbness and hand tingling. Diagnostic CT is negative, and symptoms improve with Sumatriptan. Condition is assessed as a hemiplegic/sensory migraine stroke mimic, with plans for prophylactic magnesium and neurology follow-up.",
      urgentWarnings: [
        "Penicillin allergy noted: causes hives.",
        "Stroke mimic symptoms: requires careful follow-up and emergency counseling."
      ]
    };
  }

  function getPediatricsMock() {
    return {
      patientInfo: {
        age: "7 years old",
        gender: "Male",
        overview: "7-year-old male with history of asthma presenting with acute respiratory distress triggered by viral URI."
      },
      chiefComplaint: "Difficulty breathing and coughing.",
      hpi: "Child developed cold 2 days ago with rhinorrhea and mild cough. Overnight cough became dry and barky. Developed tachypnea and rib retractions this morning. Difficulty speaking in full sentences. Two puffs of albuterol at home had no effect.",
      medicalHistory: [
        "Moderate Persistent Asthma, diagnosed at age 4 (history of 1 hospitalization)",
        "Severe peanut allergy",
        "Atopic dermatitis",
        "NKDA (No Known Drug Allergies)"
      ],
      medications: [
        { name: "Flovent HFA 44 mcg", dose: "2 puffs twice daily (non-compliant, out of medication)" },
        { name: "Albuterol HFA 90 mcg", dose: "2 puffs every 4 hours as needed" },
        { name: "Prednisolone liquid", dose: "20 mg daily for 5 days (prescribed)" }
      ],
      vitals: { bp: "100/60", hr: "118", temp: "100.2", spo2: "93", rr: "28" },
      examFindings: [
        "General: Alert but anxious, speaking in 3-4 word phrases",
        "Respiratory: Moderate subcostal and intercostal retractions, nasal flaring. Diffuse high-pitched expiratory wheezes throughout, decreased aeration at bases",
        "HEENT: Rhinorrhea, mild pharyngeal erythema",
        "Skin: Eczematous patches on antecubital fossae. No urticaria"
      ],
      labs: [
        "Point-of-care SpO2: 93% on room air (severe hypoxia for pediatric patient)"
      ],
      assessment: [
        { name: "Acute asthma exacerbation (viral trigger)", status: "confirmed" },
        { name: "Pediatric Hypoxia", status: "confirmed" },
        { name: "Uncontrolled asthma secondary to inhaler non-compliance", status: "confirmed" }
      ],
      plan: [
        "Administered continuous albuterol nebulizers (2.5 mg x3) in emergency bay",
        "Administered Oral Prednisolone liquid 20 mg (1 mg/kg) in ER",
        "Initiated 1 L/min nasal cannula oxygen (SpO2 improved to 98%)",
        "Discharged home once wheezing resolves, retractions subside, and SpO2 >94% on room air for 2 hours",
        "Prescribed Prednisolone 20 mg daily for 5 days and refilled Flovent HFA inhaler",
        "Mother warned to return immediately if child has non-responsive retractions, cyanosis, extreme lethargy, or inability to speak"
      ],
      followUp: "Follow-up pediatrician appointment scheduled in 48 hours. ER return warnings reviewed with parent.",
      summary: "7-year-old male with asthma presenting with an acute viral-induced exacerbation, presenting with tachypnea, retractions, and 93% SpO2. Treated in ER with albuterol nebs, oral prednisolone, and oxygen. Discharged with oral steroids, maintenance inhaler restart, and a 48-hour pediatrician follow-up.",
      urgentWarnings: [
        "Pediatric Hypoxia (SpO2 93% on room air) and Tachycardia (HR 118 bpm).",
        "Severe peanut allergy documented.",
        "Uncontrolled chronic asthma - mother hasn't filled maintenance Flovent in 2 months."
      ]
    };
  }

  function getDictationMock() {
    return {
      patientInfo: {
        age: "62 years old",
        gender: "Female",
        overview: "62-year-old female with CAD history presenting with acute crushing chest pain, concerning for acute coronary event."
      },
      chiefComplaint: "Severe chest pain radiating to left shoulder.",
      hpi: "Onset 4 hours ago of retrosternal crushing pain (8/10) radiating to left shoulder and neck. Associated with nausea, cold sweat, and mild dyspnea. Constant, unimproved by nitroglycerin.",
      medicalHistory: [
        "Coronary Artery Disease (CAD) with PCI in 2021",
        "Type 2 Diabetes",
        "Hypercholesterolemia",
        "NKDA (No Known Drug Allergies)"
      ],
      medications: [
        { name: "Metformin", dose: "1000mg BID" },
        { name: "Atorvastatin", dose: "80mg daily" },
        { name: "Clopidogrel", dose: "75mg daily" },
        { name: "Aspirin", dose: "325mg chewable loaded in clinic" },
        { name: "Clopidogrel", dose: "300mg PO loading dose in clinic" }
      ],
      vitals: { bp: "148/94", hr: "105", temp: "98.0", spo2: "94", rr: "20" },
      examFindings: [
        "General: Patient appears acutely diaphoretic, pale, and anxious",
        "Cardiovascular: Normal S1, S2, no murmurs. Radial pulses symmetrical",
        "Respiratory: Lungs clear to auscultation bilaterally"
      ],
      labs: [
        "12-Lead ECG: 2mm ST-segment elevation in leads V2-V4 (Anterior STEMI)",
        "Troponin: Pending"
      ],
      assessment: [
        { name: "Acute Anterior ST-Elevation Myocardial Infarction (STEMI)", status: "confirmed" },
        { name: "Uncontrolled Type 2 Diabetes", status: "confirmed" }
      ],
      plan: [
        "Administered Aspirin 325mg chewable and Clopidogrel 300mg PO loading dose",
        "Initiated IV Heparin protocol",
        "Activated Cardiac Catheterization Lab for immediate angiography and revascularization",
        "Emergency Cardiology consult called",
        "Continuous cardiac and vital monitor setup"
      ],
      followUp: "Immediate cardiac catheterization laboratory transfer for emergency angioplasty. Continuous monitoring in coronary care unit.",
      summary: "62-year-old female with CAD history presenting with severe retrosternal crushing chest pain, nausea, and diaphoresis. Clinic ECG demonstrates 2mm ST-elevation in V2-V4, confirming an acute anterior STEMI. Plan involves immediate loading of dual antiplatelet therapy, heparin initiation, and urgent transfer to the cardiac catheterization lab.",
      urgentWarnings: [
        "ACUTE ANTERIOR STEMI confirmed on ECG. Urgent intervention required.",
        "Tachycardia (HR 105 bpm) and hypertensive blood pressure (148/94 mmHg) noted."
      ]
    };
  }
});
