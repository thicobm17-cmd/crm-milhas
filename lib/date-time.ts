export const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo'

export function parseSaoPauloDateTime(value?: string | null) {
  if (!value) return null

  // datetime-local chega sem timezone. No Railway o servidor roda em UTC,
  // entao anexamos -03:00 para preservar o horario escolhido no Brasil.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    const withSeconds = value.length === 16 ? `${value}:00` : value
    return new Date(`${withSeconds}-03:00`)
  }

  return new Date(value)
}

export function formatSaoPauloDateTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value)
}

export function formatSaoPauloDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    dateStyle: 'short',
  }).format(value)
}

export function formatSaoPauloTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export function formatSaoPauloWeekdayShort(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    weekday: 'short',
  }).format(value).replace('.', '')
}
