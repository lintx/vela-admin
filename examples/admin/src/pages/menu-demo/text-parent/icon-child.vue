<script setup>
import MenuLevelShowcase from '../../../components/MenuLevelShowcase.vue'
</script>

<template>
  <MenuLevelShowcase
    :active="1"
    title="父无图标，子有图标"
    description="当前页面用于验证无图标父菜单下，有图标子菜单以自身图标左侧继续按字号递进。"
  />
</template>
