import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const localRules = {
  'no-empty-state-on-error': {
    meta: {
      type: 'suggestion',
      docs: {
        description:
          'Require ErrorState when a file uses EmptyState and tracks isError.',
      },
      schema: [],
    },
    create(context) {
      let hasEmptyState = false
      let hasErrorState = false
      let hasIsError = false

      function checkObjectPattern(node) {
        if (node.type !== 'ObjectPattern') return
        for (const prop of node.properties) {
          if (prop?.type === 'Property') {
            const key = prop.key
            if (key && key.type === 'Identifier' && key.name === 'isError') {
              hasIsError = true
              return
            }
          }
        }
      }

      return {
        JSXOpeningElement(node) {
          if (node.name?.type === 'JSXIdentifier') {
            if (node.name.name === 'EmptyState') hasEmptyState = true
            if (node.name.name === 'ErrorState') hasErrorState = true
          }
        },
        VariableDeclarator(node) {
          if (node.id?.type === 'Identifier' && node.id.name === 'isError') {
            hasIsError = true
          }
          if (node.id?.type === 'ObjectPattern') {
            checkObjectPattern(node.id)
          }
        },
        'Program:exit'(node) {
          if (hasEmptyState && hasIsError && !hasErrorState) {
            context.report({
              node,
              message:
                'File uses EmptyState and tracks isError but does not render ErrorState.',
            })
          }
        },
      }
    },
  },
}

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      local: {
        rules: localRules,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'local/no-empty-state-on-error': 'warn',
    },
  },
]
