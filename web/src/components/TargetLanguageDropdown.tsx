import { LanguageOption } from ".."
import { useState } from "react"

type TargetLanguageDropdownProps = {
  options: LanguageOption[]
  targetLanguage: string
  onSelect: (language: string) => void
}

const TargetLanguageDropdown = ({ options, targetLanguage, onSelect }: TargetLanguageDropdownProps) => {
  const selectedLanguageLabel = options.find((option) => option.value === targetLanguage)?.label || targetLanguage
  const unselectedOptions = options.filter((option) => option.value !== targetLanguage)

  const [show, setShow] = useState(false)

  return (
    <section
      className={`input-pane-language-menu${show ? " input-pane-language-menu-dismissed" : ""}`}
      aria-label="Target language selector"
      onMouseLeave={() => {
        setShow(false)
      }}
    >
      <button
        type="button"
        className="input-pane-target-language fade-in"
        onMouseDown={() => {
          // if (!show) setShow(true)
        }}
        onMouseEnter={() => {
          // if (show) {
          //   setShow(false)
          // }
          // console.log("mouseenter")
        }}
      >
        {selectedLanguageLabel}
      </button>

      <div className="input-pane-target-language-dropdown" role="listbox" aria-label="Select target language">
        {unselectedOptions.map((option) => {
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={false}
              className="input-pane-target-language-option"
              data-selected="false"
              onClick={() => {
                // setIsDismissed(true)
                console.log("option click")
                setShow(false)
                onSelect(option.value)
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export { TargetLanguageDropdown }
