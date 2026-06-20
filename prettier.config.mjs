/** @type {import('prettier').Config} */
const config = {
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-sql'],
  overrides: [
    {
      files: '*.sql',
      options: {
        language: 'postgresql',
        keywordCase: 'upper',
        dataTypeCase: 'upper',
        functionCase: 'upper',
      },
    },
    {
      files: '*.webmanifest',
      options: {
        parser: 'json',
      },
    },
  ],
};

export default config;
