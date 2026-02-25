import type { LanguageOption } from "./LanguagePicker"
import { LanguagePicker } from "./LanguagePicker"

type TranslateToolbarProps = {
  errorText: string
  inputText: string
  isTranslating: boolean
  languageOptions: LanguageOption[]
  targetLanguage: string
  onLanguageSelect: (language: string) => void
  onTranslate: () => void
}

const TranslateToolbar = ({
  errorText,
  inputText,
  isTranslating,
  languageOptions,
  targetLanguage,
  onLanguageSelect,
  onTranslate
}: TranslateToolbarProps) => {
  return (
    <section className="toolbar" aria-label="Translation controls">
      <LanguagePicker
        options={languageOptions}
        targetLanguage={targetLanguage}
        onSelect={onLanguageSelect}
      />

      <button
        className="translate-button"
        type="button"
        onClick={onTranslate}
        disabled={isTranslating || !inputText.trim()}
      >
        {isTranslating ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Translating...
          </>
        ) : (
          "Translate"
        )}
      </button>

      {errorText ? (
        <p className="status-text status-text-error" role="status">
          {errorText}
        </p>
      ) : null}
    </section>
  )
}

export { TranslateToolbar }
