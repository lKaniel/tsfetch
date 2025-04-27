import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettierConfig from "./prettier.config.js";
import prettier from "eslint-plugin-prettier";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";

import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    {
        ignores: ["dist/*", ".next/*", "node_modules/*"],
    },
    ...compat.extends( "prettier"),
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "prettier/prettier": ["error", prettierConfig],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "off", // turned off in favor of unused-imports
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "import/no-unresolved": "warn",
            "import/prefer-default-export": "off",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "react/no-children-prop": "off",
            "unicorn/filename-case": [
                "error",
                {
                    cases: {
                        kebabCase: true,
                        pascalCase: true,
                    },
                },
            ],
            "unicorn/prevent-abbreviations": "off",
        },
        plugins: {
            prettier,
            "@typescript-eslint": tsPlugin,
            "simple-import-sort": simpleImportSort,
            unicorn: unicorn,
            "unused-imports": unusedImports,
        },
        settings: {
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                },
            },
        },
    },
];

export default eslintConfig;
