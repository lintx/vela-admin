import type { Component } from 'vue'

export type AdminIconLibrary = 'phosphor' | 'tabler'

export type AdminPhosphorWeight =
  | 'thin'
  | 'light'
  | 'regular'
  | 'bold'
  | 'fill'
  | 'duotone'

export interface AdminIconConfig {
  defaultLibrary: AdminIconLibrary
  fallbackLibrary: AdminIconLibrary
  phosphor: {
    weight: AdminPhosphorWeight
  }
}

export interface AdminSemanticIconEntry {
  name: string
  label: string
  usage: string
  phosphor: string
  tabler: string
}

export interface ResolvedAdminIcon {
  key: string
  library: AdminIconLibrary
  name: string
  componentName: string
  component: Component
  fallback: boolean
}
