<template>
  <main id="va-admin-main" class="va-admin-main" tabindex="-1">
    <slot />
  </main>
</template>

<style scoped>
.va-admin-main {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  padding: 20px;
  overflow: auto;
  background: var(--color-body);
}

.va-admin-main:focus {
  outline: none;
}

@media (max-width: 768px) {
  .va-admin-main {
    padding: 16px;
  }
}
</style>
