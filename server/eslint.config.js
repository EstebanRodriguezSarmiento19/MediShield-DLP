import security from 'eslint-plugin-security';
export default [{ignores:['node_modules/**','../client/dist/**']},security.configs.recommended,
 {files:['src/**/*.js'],languageOptions:{ecmaVersion:'latest',sourceType:'module'},
 rules:{'no-eval':'error','no-implied-eval':'error','no-new-func':'error',
 'security/detect-object-injection':'warn','security/detect-non-literal-regexp':'warn'}}];
