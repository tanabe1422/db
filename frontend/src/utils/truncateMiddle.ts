export function truncateMiddle(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  const keep = maxLength - 3
  const front = Math.ceil(keep / 2)
  const back = Math.floor(keep / 2)

  return `${text.slice(0, front)}...${text.slice(-back)}`
}
