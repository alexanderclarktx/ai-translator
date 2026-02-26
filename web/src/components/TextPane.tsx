import { ReactNode } from "react"

type TextPaneProps = {
  id: string
  title: string
  placeholder: string
  ariaLabel: string
  value: string
  footer?: ReactNode
  readOnly: boolean
  autoFocus: boolean
  onChange?: (value: string) => void
  showHeader: boolean
}

const TextPane = ({
  id, title, placeholder, ariaLabel, value, footer, readOnly, autoFocus, onChange, showHeader
}: TextPaneProps) => {
  return (
    <section
      className={showHeader ? "pane" : "pane pane-no-header"}
      aria-labelledby={showHeader ? id : undefined}
      aria-label={showHeader ? undefined : ariaLabel}
    >
      {showHeader ? (
        <div className="pane-header">
          <h2 id={id}>{title}</h2>
        </div>
      ) : null}

      <textarea
        className="pane-textarea"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        readOnly={readOnly}
        autoFocus={autoFocus}
        onChange={(event) => onChange?.(event.target.value)}
        style={{
          textAlign: "center",
          // transform: "translate(-50%)"
        }}
      />

      {footer ? <div className="pane-footer">{footer}</div> : null}
    </section>
  )
}

export { TextPane }
