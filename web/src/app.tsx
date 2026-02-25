import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import type { LanguageOption } from "./components/LanguagePicker"
import { TextPane } from "./components/TextPane"
import { TranslateToolbar } from "./components/TranslateToolbar"

type TranslateResponse = {
  text?: string
  error?: string
}

const languageOptions: LanguageOption[] = [
  { label: "English", value: "English" },
  { label: "Chinese", value: "Chinese (simplified)" },
  { label: "French", value: "French" },
  { label: "Spanish", value: "Spanish" },
  { label: "Italian", value: "Italian" },
  { label: "Japanese", value: "Japanese" },
  { label: "Korean", value: "Korean" },
  { label: "Russian", value: "Russian" }
]

const getTranslateApiUrl = () => {
  const { protocol, hostname, port } = window.location

  if (port === "5000") {
    return `${protocol}//${hostname}:5001/api/translate`
  }

  return "/api/translate"
}

const App = () => {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [errorText, setErrorText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState(
    languageOptions[1]?.value || "Chinese (simplified)"
  )
  const lastRequestedSignatureRef = useRef("")

  const handleTranslate = async (nextTargetLanguage = targetLanguage) => {
    const trimmedText = inputText.trim()

    if (!trimmedText || isTranslating) {
      return
    }

    setErrorText("")
    setIsTranslating(true)
    lastRequestedSignatureRef.current = `${trimmedText}::${nextTargetLanguage}`

    try {
      const response = await fetch(getTranslateApiUrl(), {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          text: trimmedText,
          targetLanguage: nextTargetLanguage
        })
      })

      const data = (await response.json()) as TranslateResponse

      if (!response.ok) {
        throw new Error(data.error || "Translation failed")
      }

      setOutputText(data.text || "")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Translation failed"
      setErrorText(message)
    } finally {
      setIsTranslating(false)
    }
  }

  useEffect(() => {
    const trimmedText = inputText.trim()

    if (!trimmedText) {
      setOutputText("")
      setErrorText("")
      lastRequestedSignatureRef.current = ""
      return
    }

    const nextSignature = `${trimmedText}::${targetLanguage}`

    if (isTranslating || lastRequestedSignatureRef.current === nextSignature) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void handleTranslate()
    }, 450)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [inputText, targetLanguage, isTranslating])

  return (
    <main>
      <header>
        <h1>AI Translator</h1>
      </header>

      <TranslateToolbar
        errorText={errorText}
        languageOptions={languageOptions}
        targetLanguage={targetLanguage}
        onLanguageSelect={(language) => {
          setTargetLanguage(language)
        }}
      />

      <section className="pane-stack" aria-label="Translator workspace">
        <TextPane
          id="input-pane-title"
          title="Input"
          placeholder="Type or paste text to translate"
          ariaLabel="Text to translate"
          value={inputText}
          onChange={setInputText}
        />

        <TextPane
          id="output-pane-title"
          title="Translated Output"
          placeholder="Translation will appear here"
          ariaLabel="Translated text"
          value={outputText}
          readOnly
        />

        {isTranslating ? (
          <span className="spinner pane-stack-spinner" aria-hidden="true" />
        ) : null}
      </section>
    </main>
  )
}

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing root div with id 'root'")
}

createRoot(rootElement).render(<App />)
