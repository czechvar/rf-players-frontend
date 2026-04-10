import cs from '../i18n/cs'

/**
 * Simple i18n composable.
 *
 * Returns the full Czech translation object (`t`) so pages can do:
 *   const { t } = useI18n()
 *   t.events.title   // 'Akce'
 *
 * For strings with placeholders use the `tr()` helper:
 *   tr(t.dashboard.welcomeBack, { name: 'Honza' })  // 'Vítejte zpět, Honza!'
 */
export function useI18n() {
  return { t: cs, tr }
}

/**
 * Replace `{placeholder}` tokens inside a translation string.
 *
 * @example
 *   tr('Vítejte zpět, {name}!', { name: 'Honza' })
 *   // → 'Vítejte zpět, Honza!'
 */
export function tr(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  )
}
