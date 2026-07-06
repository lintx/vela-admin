import { extractDominantColorFromImageData } from '../../theme/theme-generator-service'
import { recommendedColors } from './theme-generator-options'

export function normalizeSourceColorInput(value: string): string | null {
  const trimmedValue = value.trim()
  const match = trimmedValue.match(/^#?([0-9a-fA-F]{6})$/)

  return match ? `#${match[1].toUpperCase()}` : null
}

export function normalizeSourceColorText(value: string): string {
  return normalizeSourceColorInput(value) ?? '#6750A4'
}

export function getThemeColorLabel(color: string): string {
  const normalizedColor = normalizeSourceColorText(color)
  const recommendedColor = recommendedColors.find((item) => item.color === normalizedColor)

  return recommendedColor?.label ?? `自定义 ${normalizedColor}`
}

export async function extractSourceColorFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file)

  try {
    const image = await loadImage(url)
    const maxSize = 96
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      throw new Error('Canvas context unavailable')
    }

    canvas.width = width
    canvas.height = height
    context.drawImage(image, 0, 0, width, height)

    return extractDominantColorFromImageData(context.getImageData(0, 0, width, height))
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = url
  })
}
