<script setup>
import MenuLevelShowcase from '../../../components/MenuLevelShowcase.vue'
</script>

<template>
  <MenuLevelShowcase
    :active="1"
    title="父有图标，子无图标"
    description="当前页面用于验证有图标父菜单下，无图标子菜单以自身文字左侧对齐父菜单文字。"
  />
</template>
