import yutengjingEslintConfigTypescript from '@yutengjing/eslint-config-typescript';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    yutengjingEslintConfigTypescript,
    {
        rules: {
            'n/prefer-global/process': 'off',
        },
    },
]);
