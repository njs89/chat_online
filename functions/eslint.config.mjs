import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,  // This adds Node.js globals, including 'process'
        ...globals.browser
      }
    }
  },
  pluginJs.configs.recommended,
];