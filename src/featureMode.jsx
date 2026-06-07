import { createContext, useContext, useState } from 'react'

/**
 * Global feature-visibility mode.
 *   'mvp'  — only the minimal feature set is shown.
 *   'full' — the full production feature set is shown.
 *
 * Gate any feature with:
 *   const { full } = useFeatureMode()
 *   {full && <AdvancedThing />}
 */
const FeatureModeContext = createContext({ mode: 'full', full: true, mvp: false, setMode: () => {} })

export function FeatureModeProvider({ children, initial = 'full' }) {
  const [mode, setMode] = useState(initial)
  const value = { mode, full: mode === 'full', mvp: mode === 'mvp', setMode }
  return <FeatureModeContext.Provider value={value}>{children}</FeatureModeContext.Provider>
}

export function useFeatureMode() {
  return useContext(FeatureModeContext)
}
