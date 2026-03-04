export function Field({ label, children, className = '' }) {
  return (
    <div className={`field-wrap ${className}`}>
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
      <select className="field-input" {...props}>{children}</select>
    </Field>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <textarea className="field-input" {...props} />
    </Field>
  )
}

/** Grid responsivo: 2 colunas no desktop, 1 no mobile */
export function Grid2({ children }) {
  return <div className="grid-2">{children}</div>
}

/** Grid responsivo: 3 colunas no desktop, 1 no mobile */
export function Grid3({ children }) {
  return <div className="grid-3">{children}</div>
}

export function SectionTitle({ children }) {
  return <div className="form-section-title">{children}</div>
}
