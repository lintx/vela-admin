<script setup>
defineProps({
  code: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <svg
    class="admin-exception-artwork"
    viewBox="0 0 560 440"
    role="img"
    :aria-label="`${code} 异常插画`"
  >
    <defs>
      <linearGradient :id="`art-${code}-accent`" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="var(--exception-accent)" />
        <stop offset="1" stop-color="var(--exception-accent-strong)" />
      </linearGradient>
      <linearGradient :id="`art-${code}-surface`" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="var(--color-surface-container-highest)" />
        <stop offset="1" stop-color="var(--color-surface-container)" />
      </linearGradient>
      <filter :id="`art-${code}-shadow`" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="var(--color-primary)" flood-opacity="0.14" />
      </filter>
    </defs>

    <circle class="admin-exception-artwork__halo" cx="280" cy="212" r="172" />
    <path class="admin-exception-artwork__orbit" d="M72 266C134 106 398 62 492 214C548 304 453 384 300 377C161 371 49 344 72 266Z" />
    <path class="admin-exception-artwork__orbit admin-exception-artwork__orbit--secondary" d="M126 120C234 46 444 117 458 259C467 357 346 397 222 342C107 291 49 174 126 120Z" />

    <g class="admin-exception-artwork__dots">
      <circle cx="88" cy="180" r="7" />
      <circle cx="111" cy="158" r="3" />
      <circle cx="474" cy="158" r="6" />
      <circle cx="499" cy="181" r="3" />
      <circle cx="440" cy="350" r="5" />
    </g>

    <g v-if="code === '403'" filter="url(#art-403-shadow)">
      <rect x="164" y="116" width="226" height="162" rx="26" fill="url(#art-403-surface)" stroke="var(--color-outline-variant)" />
      <path d="M202 160H352M202 190H306M202 220H272" stroke="var(--color-primary)" stroke-linecap="round" stroke-width="11" opacity="0.2" />
      <rect x="214" y="245" width="126" height="12" rx="6" fill="var(--color-primary)" opacity="0.14" />
      <path d="M278 175V160C278 137 296 119 318 119C340 119 358 137 358 160V175" fill="none" stroke="url(#art-403-accent)" stroke-linecap="round" stroke-width="18" />
      <rect x="251" y="164" width="134" height="112" rx="24" fill="url(#art-403-accent)" />
      <circle cx="318" cy="215" r="15" fill="var(--color-on-primary)" opacity="0.9" />
      <path d="M318 217V242" stroke="var(--color-on-primary)" stroke-linecap="round" stroke-width="8" opacity="0.9" />
      <path d="M142 315H418" stroke="var(--exception-accent)" stroke-linecap="round" stroke-width="12" opacity="0.18" />
    </g>

    <g v-else-if="code === '404'" filter="url(#art-404-shadow)">
      <path d="M121 289C168 223 213 188 274 194C340 201 358 268 420 257C457 250 479 219 497 189" fill="none" stroke="url(#art-404-accent)" stroke-dasharray="5 15" stroke-linecap="round" stroke-width="7" opacity="0.8" />
      <circle cx="121" cy="289" r="15" fill="var(--color-surface-container-highest)" stroke="var(--exception-accent)" stroke-width="7" />
      <circle cx="497" cy="189" r="15" fill="var(--color-surface-container-highest)" stroke="var(--exception-accent-strong)" stroke-width="7" />
      <rect x="171" y="119" width="142" height="108" rx="22" transform="rotate(-8 171 119)" fill="url(#art-404-surface)" stroke="var(--color-outline-variant)" />
      <circle cx="210" cy="163" r="18" fill="var(--exception-accent)" opacity="0.72" />
      <path d="M245 155H278M245 178H292" stroke="var(--color-primary)" stroke-linecap="round" stroke-width="9" opacity="0.2" />
      <rect x="303" y="225" width="138" height="112" rx="22" transform="rotate(9 303 225)" fill="url(#art-404-surface)" stroke="var(--color-outline-variant)" />
      <path d="M334 269L360 243L383 265L404 244L422 281H334Z" fill="url(#art-404-accent)" opacity="0.86" />
      <circle cx="354" cy="248" r="8" fill="var(--color-on-primary)" opacity="0.9" />
    </g>

    <g v-else filter="url(#art-500-shadow)">
      <rect x="169" y="117" width="228" height="56" rx="18" fill="url(#art-500-surface)" stroke="var(--color-outline-variant)" />
      <rect x="149" y="181" width="268" height="66" rx="20" fill="url(#art-500-accent)" opacity="0.92" />
      <rect x="169" y="255" width="228" height="62" rx="19" fill="url(#art-500-surface)" stroke="var(--color-outline-variant)" />
      <path d="M206 145H290M206 211H312M206 283H274" stroke="var(--color-primary)" stroke-linecap="round" stroke-width="11" opacity="0.24" />
      <circle cx="360" cy="214" r="28" fill="var(--exception-accent-strong)" />
      <path d="M360 198V219M360 231V233" stroke="var(--color-on-primary)" stroke-linecap="round" stroke-width="9" />
      <path d="M119 345H446" stroke="var(--exception-accent)" stroke-linecap="round" stroke-width="12" opacity="0.18" />
    </g>
  </svg>
</template>

<style scoped>
.admin-exception-artwork {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.admin-exception-artwork__halo {
  fill: color-mix(in srgb, var(--exception-accent) 9%, transparent);
}

.admin-exception-artwork__orbit {
  fill: none;
  stroke: color-mix(in srgb, var(--exception-accent) 28%, transparent);
  stroke-dasharray: 2 15;
  stroke-linecap: round;
  stroke-width: 2;
}

.admin-exception-artwork__orbit--secondary {
  stroke: color-mix(in srgb, var(--color-primary) 12%, transparent);
  stroke-dasharray: 1 12;
}

.admin-exception-artwork__dots circle {
  fill: var(--exception-accent);
  opacity: 0.52;
}
</style>
