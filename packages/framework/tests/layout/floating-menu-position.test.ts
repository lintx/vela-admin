import { describe, expect, it } from 'vitest'

import { resolveFloatingChildPanelPosition } from '../../src/layout/components/floating-menu-position'

describe('resolveFloatingChildPanelPosition', () => {
  const rootRect = {
    left: 380,
    top: 64,
  }
  const parentPanelRect = {
    left: 380,
    right: 600,
  }
  const parentItemRect = {
    left: 380,
    right: 600,
    top: 120,
    bottom: 164,
  }

  it('places child panels on the right when there is enough viewport space', () => {
    const position = resolveFloatingChildPanelPosition({
      rootRect,
      parentPanelRect,
      parentItemRect,
      viewportWidth: 960,
      viewportHeight: 720,
      panelWidth: 220,
      panelHeight: 240,
      panelPadding: 8,
      panelBorderTop: 1,
    })

    expect(position).toEqual({
      left: '219px',
      top: '47px',
    })
  })

  it('flips child panels to the left when the right edge would overflow', () => {
    const position = resolveFloatingChildPanelPosition({
      rootRect,
      parentPanelRect,
      parentItemRect,
      viewportWidth: 760,
      viewportHeight: 720,
      panelWidth: 220,
      panelHeight: 240,
      panelPadding: 8,
      panelBorderTop: 1,
    })

    expect(position).toEqual({
      left: '-219px',
      top: '47px',
    })
  })

  it('keeps child panels inside the viewport vertically', () => {
    const position = resolveFloatingChildPanelPosition({
      rootRect,
      parentPanelRect,
      parentItemRect: {
        ...parentItemRect,
        top: 620,
        bottom: 664,
      },
      viewportWidth: 960,
      viewportHeight: 720,
      panelWidth: 220,
      panelHeight: 180,
      panelPadding: 8,
      panelBorderTop: 1,
    })

    expect(position).toEqual({
      left: '219px',
      top: '468px',
    })
  })
})
