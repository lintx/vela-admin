<script>
export const route = {
  path: '/:path(.*)',
  name: 'not-found',
}
</script>

<script setup>
import Exception404 from './404.vue'
</script>

<template>
  <Exception404 />
</template>
