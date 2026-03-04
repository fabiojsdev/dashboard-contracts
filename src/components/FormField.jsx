/** Campo de formulário reutilizável */
export function Field({ label, children, className = '' }) {
  return (
    <div className={className} style={{ marginBottom: 16 }}>
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <input className="field-input" {...props} />
    </Field>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <select className="field-input" {...props}>
        {children}
      </select>
    </Field>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <textarea className="field-input" style={{ resize: 'vertical', minHeight: 70 }} {...props} />
    </Field>
  )
}

/** Grid de 2 colunas */
export function Grid2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {children}
    </div>
  )
}

/** Grid de 3 colunas */
export function Grid3({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }) {
  return <div className="form-section-title">{children}</div>
}
