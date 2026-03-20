import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import './App.css'

type Language = 'en' | 'ms' | 'es'
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox'

type Field = {
  id: string
  type: FieldType
  label: Record<Language, string>
  placeholder?: Record<Language, string>
  required: boolean
  options?: string[]
}

type Template = {
  id: string
  name: string
  category: string
  description: string
  badge: string
  accent: string
  intro: Record<Language, string>
  fields: Field[]
}

type Submission = {
  id: string
  createdAt: string
  formName: string
  answers: Record<string, string>
  items: Array<{ label: string; value: string }>
}

const languages: { key: Language; label: string }[] = [
  { key: 'en', label: 'EN' },
  { key: 'ms', label: 'BM' },
  { key: 'es', label: 'ES' },
]

const createId = () => Math.random().toString(36).slice(2, 10)

const storageKeys = {
  builder: 'wf-clone-builder',
  responses: 'wf-clone-responses',
}

const templateLibrary: Template[] = [
  {
    id: 'lead-capture',
    name: 'Lead Capture',
    category: 'Marketing',
    description: 'Collect leads from ads and route every answer straight to WhatsApp.',
    badge: 'Popular',
    accent: '#25d366',
    intro: {
      en: 'Tell us about your project and we will reply on WhatsApp.',
      ms: 'Ceritakan tentang projek anda dan kami akan balas di WhatsApp.',
      es: 'Cuentanos sobre tu proyecto y responderemos por WhatsApp.',
    },
    fields: [
      {
        id: createId(),
        type: 'text',
        label: { en: 'Full name', ms: 'Nama penuh', es: 'Nombre completo' },
        placeholder: {
          en: 'Type your name',
          ms: 'Taip nama anda',
          es: 'Escribe tu nombre',
        },
        required: true,
      },
      {
        id: createId(),
        type: 'text',
        label: { en: 'Phone number', ms: 'Nombor telefon', es: 'Telefono' },
        placeholder: { en: '60123456789', ms: '60123456789', es: '34123456789' },
        required: true,
      },
      {
        id: createId(),
        type: 'select',
        label: { en: 'Budget range', ms: 'Julat bajet', es: 'Rango de presupuesto' },
        required: true,
        options: ['Under RM1,000', 'RM1,000 - RM5,000', 'Above RM5,000'],
      },
      {
        id: createId(),
        type: 'textarea',
        label: { en: 'What do you need?', ms: 'Apa yang anda perlukan?', es: 'Que necesitas?' },
        placeholder: {
          en: 'Share project details',
          ms: 'Kongsi detail projek',
          es: 'Comparte detalles del proyecto',
        },
        required: true,
      },
    ],
  },
  {
    id: 'booking',
    name: 'Booking Form',
    category: 'Services',
    description: 'Take service bookings, class registrations, or consultation requests.',
    badge: 'Business',
    accent: '#0f7aff',
    intro: {
      en: 'Pick your preferred slot and we will confirm it on WhatsApp.',
      ms: 'Pilih slot pilihan anda dan kami akan sahkan di WhatsApp.',
      es: 'Elige tu horario preferido y lo confirmaremos por WhatsApp.',
    },
    fields: [
      {
        id: createId(),
        type: 'text',
        label: { en: 'Customer name', ms: 'Nama pelanggan', es: 'Nombre del cliente' },
        placeholder: { en: 'Your name', ms: 'Nama anda', es: 'Tu nombre' },
        required: true,
      },
      {
        id: createId(),
        type: 'select',
        label: { en: 'Service type', ms: 'Jenis servis', es: 'Tipo de servicio' },
        required: true,
        options: ['Consultation', 'Site visit', 'Demo session'],
      },
      {
        id: createId(),
        type: 'text',
        label: { en: 'Preferred date', ms: 'Tarikh pilihan', es: 'Fecha preferida' },
        placeholder: { en: '22 March 2026', ms: '22 Mac 2026', es: '22 marzo 2026' },
        required: true,
      },
      {
        id: createId(),
        type: 'textarea',
        label: { en: 'Extra notes', ms: 'Nota tambahan', es: 'Notas adicionales' },
        placeholder: {
          en: 'Anything we should know?',
          ms: 'Apa-apa yang kami perlu tahu?',
          es: 'Algo que debamos saber?',
        },
        required: false,
      },
    ],
  },
  {
    id: 'support',
    name: 'Support Intake',
    category: 'Operations',
    description: 'Collect issues, order numbers, and context before jumping into chat.',
    badge: 'Support',
    accent: '#ff8a00',
    intro: {
      en: 'Send your issue and our team will continue on WhatsApp.',
      ms: 'Hantar masalah anda dan team kami akan sambung di WhatsApp.',
      es: 'Envia tu problema y nuestro equipo seguira por WhatsApp.',
    },
    fields: [
      {
        id: createId(),
        type: 'text',
        label: { en: 'Order ID', ms: 'ID pesanan', es: 'ID del pedido' },
        placeholder: { en: 'ORD-001', ms: 'ORD-001', es: 'ORD-001' },
        required: true,
      },
      {
        id: createId(),
        type: 'checkbox',
        label: { en: 'Issue category', ms: 'Kategori isu', es: 'Categoria del problema' },
        required: true,
        options: ['Payment', 'Delivery', 'Technical issue', 'Refund'],
      },
      {
        id: createId(),
        type: 'textarea',
        label: { en: 'Describe the issue', ms: 'Terangkan isu', es: 'Describe el problema' },
        placeholder: {
          en: 'Tell us what happened',
          ms: 'Beritahu apa yang berlaku',
          es: 'Cuentanos que paso',
        },
        required: true,
      },
    ],
  },
]

const defaultTemplate = templateLibrary[0]

const deepCloneTemplate = (template: Template): Template => ({
  ...template,
  intro: { ...template.intro },
  fields: template.fields.map((field) => ({
    ...field,
    label: { ...field.label },
    placeholder: field.placeholder ? { ...field.placeholder } : undefined,
    options: field.options ? [...field.options] : undefined,
  })),
})

const createBlankField = (): Field => ({
  id: createId(),
  type: 'text',
  label: { en: 'New question', ms: 'Soalan baru', es: 'Nueva pregunta' },
  placeholder: {
    en: 'Write something...',
    ms: 'Tulis sesuatu...',
    es: 'Escribe algo...',
  },
  required: false,
})

const initialAnswersFromFields = (fields: Field[]) =>
  fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.id] = ''
    return acc
  }, {})

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [activeTemplateId, setActiveTemplateId] = useState(defaultTemplate.id)
  const [builderTemplate, setBuilderTemplate] = useState<Template>(() => {
    const saved = localStorage.getItem(storageKeys.builder)
    return saved ? (JSON.parse(saved) as Template) : deepCloneTemplate(defaultTemplate)
  })
  const [aiPrompt, setAiPrompt] = useState('')
  const [whatsAppNumber, setWhatsAppNumber] = useState('60123456789')
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    initialAnswersFromFields(builderTemplate.fields),
  )
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(storageKeys.responses)
    return saved ? (JSON.parse(saved) as Submission[]) : []
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKeys.builder, JSON.stringify(builderTemplate))
  }, [builderTemplate])

  useEffect(() => {
    localStorage.setItem(storageKeys.responses, JSON.stringify(submissions))
  }, [submissions])

  const activeTemplate = useMemo(
    () => templateLibrary.find((template) => template.id === activeTemplateId) ?? defaultTemplate,
    [activeTemplateId],
  )

  const completionRate = useMemo(() => {
    const required = builderTemplate.fields.filter((field) => field.required)
    if (!required.length) return 100
    const complete = required.filter((field) => answers[field.id]?.trim()).length
    return Math.round((complete / required.length) * 100)
  }, [answers, builderTemplate.fields])

  const shareLink = useMemo(() => {
    const slug = builderTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `https://yourdomain.com/forms/${slug}`
  }, [builderTemplate.name])

  const metrics = [
    { label: 'Templates', value: '45+' },
    { label: 'Languages', value: '3' },
    { label: 'Delivery', value: 'WhatsApp' },
    { label: 'Response time', value: '< 1 min' },
  ]

  const handleTemplateApply = (template: Template) => {
    setActiveTemplateId(template.id)
    setBuilderTemplate(deepCloneTemplate(template))
  }

  const handleAIBuilder = () => {
    const prompt = aiPrompt.toLowerCase()
    const next = deepCloneTemplate(defaultTemplate)

    if (prompt.includes('booking') || prompt.includes('appointment')) {
      handleTemplateApply(templateLibrary[1])
      return
    }

    if (prompt.includes('support') || prompt.includes('issue')) {
      handleTemplateApply(templateLibrary[2])
      return
    }

    if (prompt.includes('restaurant') || prompt.includes('order')) {
      next.name = 'Order Request'
      next.category = 'Sales'
      next.description = 'Receive order details before opening chat.'
      next.badge = 'AI Draft'
      next.intro = {
        en: 'Place your order details here and we will continue on WhatsApp.',
        ms: 'Letak detail pesanan di sini dan kami akan sambung di WhatsApp.',
        es: 'Deja aqui los detalles de tu pedido y seguiremos por WhatsApp.',
      }
      next.fields = [
        {
          id: createId(),
          type: 'text',
          label: { en: 'Customer name', ms: 'Nama pelanggan', es: 'Nombre del cliente' },
          placeholder: {
            en: 'Type your name',
            ms: 'Taip nama anda',
            es: 'Escribe tu nombre',
          },
          required: true,
        },
        {
          id: createId(),
          type: 'checkbox',
          label: { en: 'Order items', ms: 'Item pesanan', es: 'Productos' },
          required: true,
          options: ['Set A', 'Set B', 'Set C'],
        },
        {
          id: createId(),
          type: 'textarea',
          label: { en: 'Delivery notes', ms: 'Nota penghantaran', es: 'Notas de entrega' },
          placeholder: {
            en: 'Address, delivery time, extras',
            ms: 'Alamat, masa penghantaran, tambahan',
            es: 'Direccion, hora, extras',
          },
          required: true,
        },
      ]
      setBuilderTemplate(next)
      return
    }

    next.badge = 'AI Refined'
    next.description = 'A ready-to-use WhatsApp form draft based on your prompt.'
    next.intro.en = `Built from prompt: ${aiPrompt || 'General intake form'}`
    next.intro.ms = `Dibina dari prompt: ${aiPrompt || 'Borang umum'}`
    next.intro.es = `Creado desde el prompt: ${aiPrompt || 'Formulario general'}`
    setBuilderTemplate(next)
  }

  const handleFieldUpdate = (fieldId: string, updater: (field: Field) => Field) => {
    setBuilderTemplate((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === fieldId ? updater(field) : field)),
    }))
  }

  const handleSubmitPreview = (event: FormEvent) => {
    event.preventDefault()

    const missing = builderTemplate.fields.find(
      (field) => field.required && !answers[field.id]?.trim(),
    )

    if (missing) {
      alert(`Please fill "${missing.label[language]}" first.`)
      return
    }

    const summaryLines = builderTemplate.fields.map((field) => {
      const value = answers[field.id] || '-'
      return `${field.label[language]}: ${value}`
    })

    const message = encodeURIComponent(
      [`${builderTemplate.name} submission`, ...summaryLines].join('\n'),
    )

    const submission: Submission = {
      id: createId(),
      createdAt: new Date().toLocaleString(),
      formName: builderTemplate.name,
      answers,
      items: builderTemplate.fields.map((field) => ({
        label: field.label[language],
        value: answers[field.id] || '-',
      })),
    }

    setSubmissions((current) => [submission, ...current].slice(0, 8))
    window.open(`https://wa.me/${whatsAppNumber}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-icon">zf</div>
          <div>
            <strong>Zack Form</strong>
            <p>Self-hosted WhatsApp form builder</p>
          </div>
        </div>
        <nav className="topnav">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#builder">Builder</a>
          <a href="#responses">Responses</a>
        </nav>
      </header>

      <main>
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">WhatsApp-native forms for your own workflow</span>
            <h1>Create forms with Zack Form and push every answer into chat.</h1>
            <p className="hero-text">
              This clone gives you landing sections, templates, AI-assisted drafting,
              multilingual labels, a live preview, and direct WhatsApp delivery in one place.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#builder">
                Build your form
              </a>
              <a className="button button-secondary" href="#templates">
                Browse templates
              </a>
            </div>
            <div className="metric-grid">
              {metrics.map((metric) => (
                <article key={metric.label} className="metric-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-preview">
            <div className="floating-card">
              <div className="status-dot" />
              <span>Live campaign intake</span>
            </div>
            <div className="phone-frame">
              <div className="phone-header">
                <div>
                  <strong>{builderTemplate.name}</strong>
                  <p>{activeTemplate.category}</p>
                </div>
                <span className="pill">{builderTemplate.badge}</span>
              </div>
              <div className="chat-card">
                <p>{builderTemplate.intro[language]}</p>
                <div className="chat-bubbles">
                  <span>Customer fills your form</span>
                  <span>You continue in WhatsApp instantly</span>
                </div>
              </div>
              <div className="progress-block">
                <div>
                  <strong>{completionRate}%</strong>
                  <p>Preview completion</p>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${completionRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section-grid">
          <article className="feature-card highlight">
            <span>01</span>
            <h2>Drag-free builder</h2>
            <p>Edit questions, change languages, and preview the result live.</p>
          </article>
          <article className="feature-card">
            <span>02</span>
            <h2>WhatsApp delivery</h2>
            <p>Every submission is formatted and opened in a `wa.me` thread ready for follow-up.</p>
          </article>
          <article className="feature-card">
            <span>03</span>
            <h2>Template-first workflow</h2>
            <p>Start from lead capture, booking, support, or let the AI draft a new intake flow.</p>
          </article>
        </section>

        <section id="templates" className="templates-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Template gallery</span>
              <h2>Start from a working structure instead of a blank page</h2>
            </div>
            <p>These starter forms mirror the kind of presets users expect from modern WhatsApp form tools.</p>
          </div>

          <div className="template-grid">
            {templateLibrary.map((template) => (
              <article
                key={template.id}
                className={`template-card ${activeTemplateId === template.id ? 'active' : ''}`}
                style={{ '--template-accent': template.accent } as CSSProperties}
              >
                <div className="template-header">
                  <span className="template-category">{template.category}</span>
                  <span className="pill">{template.badge}</span>
                </div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => handleTemplateApply(template)}
                >
                  Use template
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="builder" className="builder-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Builder studio</span>
              <h2>Customize the form, then test the WhatsApp flow immediately</h2>
            </div>
            <p>Everything here runs locally so you can use it yourself without setting up a heavy backend first.</p>
          </div>

          <div className="builder-layout">
            <aside className="builder-sidebar">
              <div className="panel">
                <label className="label">
                  Form name
                  <input
                    value={builderTemplate.name}
                    onChange={(event) =>
                      setBuilderTemplate((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>

                <label className="label">
                  WhatsApp number
                  <input
                    value={whatsAppNumber}
                    onChange={(event) => setWhatsAppNumber(event.target.value)}
                  />
                </label>

                <label className="label">
                  AI prompt
                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="e.g. restaurant pre-order form in Malay"
                  />
                </label>

                <button className="button button-primary full" type="button" onClick={handleAIBuilder}>
                  Generate with AI
                </button>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h3>Languages</h3>
                  <div className="segmented">
                    {languages.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={language === item.key ? 'active' : ''}
                        onClick={() => setLanguage(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="muted">Switch language to edit labels and see the customer-facing preview.</p>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h3>Share form</h3>
                  <button className="link-button" type="button" onClick={copyShareLink}>
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <div className="share-box">{shareLink}</div>
              </div>
            </aside>

            <section className="editor-panel">
              <div className="panel">
                <div className="panel-head">
                  <h3>Questions</h3>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() =>
                      setBuilderTemplate((current) => ({
                        ...current,
                        fields: [...current.fields, createBlankField()],
                      }))
                    }
                  >
                    Add field
                  </button>
                </div>

                <div className="field-stack">
                  {builderTemplate.fields.map((field, index) => (
                    <article key={field.id} className="field-card">
                      <div className="field-card-head">
                        <strong>
                          {index + 1}. {field.label[language]}
                        </strong>
                        <button
                          className="link-button danger"
                          type="button"
                          onClick={() =>
                            setBuilderTemplate((current) => ({
                              ...current,
                              fields: current.fields.filter((item) => item.id !== field.id),
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>

                      <div className="field-grid">
                        <label className="label">
                          Label
                          <input
                            value={field.label[language]}
                            onChange={(event) =>
                              handleFieldUpdate(field.id, (current) => ({
                                ...current,
                                label: { ...current.label, [language]: event.target.value },
                              }))
                            }
                          />
                        </label>

                        <label className="label">
                          Type
                          <select
                            value={field.type}
                            onChange={(event) =>
                              handleFieldUpdate(field.id, (current) => ({
                                ...current,
                                type: event.target.value as FieldType,
                                options:
                                  event.target.value === 'select' || event.target.value === 'checkbox'
                                    ? current.options ?? ['Option 1', 'Option 2']
                                    : undefined,
                              }))
                            }
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </label>

                        <label className="label field-span">
                          Placeholder
                          <input
                            value={field.placeholder?.[language] ?? ''}
                            onChange={(event) =>
                              handleFieldUpdate(field.id, (current) => ({
                                ...current,
                                placeholder: {
                                  ...(current.placeholder ?? { en: '', ms: '', es: '' }),
                                  [language]: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>

                        {(field.type === 'select' || field.type === 'checkbox') && (
                          <label className="label field-span">
                            Options
                            <textarea
                              value={(field.options ?? []).join('\n')}
                              onChange={(event) =>
                                handleFieldUpdate(field.id, (current) => ({
                                  ...current,
                                  options: event.target.value
                                    .split('\n')
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                }))
                              }
                            />
                          </label>
                        )}

                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              handleFieldUpdate(field.id, (current) => ({
                                ...current,
                                required: event.target.checked,
                              }))
                            }
                          />
                          Required field
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="preview-panel">
              <div className="preview-frame">
                <div className="preview-head">
                  <div>
                    <span className="eyebrow">Live form preview</span>
                    <h3>{builderTemplate.name}</h3>
                  </div>
                  <span className="pill success">Ready to share</span>
                </div>

                <p className="preview-intro">{builderTemplate.intro[language]}</p>

                <form className="form-stack" onSubmit={handleSubmitPreview}>
                  {builderTemplate.fields.map((field) => (
                    <label key={field.id} className="label">
                      {field.label[language]}
                      {field.type === 'textarea' ? (
                        <textarea
                          value={answers[field.id] ?? ''}
                          placeholder={field.placeholder?.[language] ?? ''}
                          onChange={(event) =>
                            setAnswers((current) => ({ ...current, [field.id]: event.target.value }))
                          }
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={answers[field.id] ?? ''}
                          onChange={(event) =>
                            setAnswers((current) => ({ ...current, [field.id]: event.target.value }))
                          }
                        >
                          <option value="">Choose one</option>
                          {(field.options ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="checkbox-group">
                          {(field.options ?? []).map((option) => {
                            const selected = (answers[field.id] ?? '').split(', ').filter(Boolean)
                            const checked = selected.includes(option)
                            return (
                              <label key={option} className="checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    const next = event.target.checked
                                      ? [...selected, option]
                                      : selected.filter((item) => item !== option)
                                    setAnswers((current) => ({
                                      ...current,
                                      [field.id]: next.join(', '),
                                    }))
                                  }}
                                />
                                {option}
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                        <input
                          value={answers[field.id] ?? ''}
                          placeholder={field.placeholder?.[language] ?? ''}
                          onChange={(event) =>
                            setAnswers((current) => ({ ...current, [field.id]: event.target.value }))
                          }
                        />
                      )}
                    </label>
                  ))}

                  <button className="button button-primary full" type="submit">
                    Submit to WhatsApp
                  </button>
                </form>
              </div>
            </section>
          </div>
        </section>

        <section id="responses" className="responses-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Responses</span>
              <h2>Recent preview submissions saved locally</h2>
            </div>
            <p>This gives you a quick mini-dashboard while you test the app for your own process.</p>
          </div>

          <div className="response-list">
            {submissions.length ? (
              submissions.map((submission) => (
                <article key={submission.id} className="response-card">
                  <div className="response-head">
                    <strong>{submission.formName}</strong>
                    <span>{submission.createdAt}</span>
                  </div>
                  <div className="response-body">
                    {submission.items.map((item) => (
                      <div key={`${submission.id}-${item.label}`} className="response-row">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>No responses yet</strong>
                <p>Use the preview form above and your test submissions will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
