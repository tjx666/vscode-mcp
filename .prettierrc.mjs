// const config = require('@yutengjing/prettier-config');
import config from '@yutengjing/prettier-config';

/** @type {import('prettier').Config} */
export default {
    ...config,
    quoteProps: 'as-needed',
    overrides: [
        ...config.overrides,
        {
            files: ['.cursorrules', 'mdc-editor-*', '.cursor/rules/**/*'],
            options: {
                parser: 'markdown',
                tabWidth: 2,
            },
        },
        {
            // for .markdownlint.jsonc
            files: '*.jsonc',
            options: {
                trailingComma: 'none',
            },
        },
    ],
};
