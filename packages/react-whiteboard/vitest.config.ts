import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/core/store/**',
        'src/utils/**',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/__tests__/**',
        // Store modules not in scope for initial test suite
        'src/core/store/boundTextActions.ts',
        'src/core/store/groupActions.ts',
        'src/core/store/zOrderActions.ts',
        'src/core/store/imagePasteActions.ts',
        'src/core/store/shapeStyleActions.ts',
        'src/core/store/exportImportActions.ts',
        'src/core/store/createStore.ts',
        'src/core/store/types.ts',
        'src/core/store/index.ts',
        // Utility modules not in scope for initial test suite
        'src/utils/exportPng.ts',
        'src/utils/exportSvg.ts',
        'src/utils/svgShapeRenderers.ts',
        'src/utils/fonts.ts',
        'src/utils/imageBlobStore.ts',
        'src/utils/rotationHandle.ts',
        'src/utils/resizeHandles.ts',
        'src/utils/shapeBounds.ts',
        'src/utils/dom.ts',
        'src/utils/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
})
