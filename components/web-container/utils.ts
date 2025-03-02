import { File } from "./types";
import { GLOBALS_CSS, BUTTON_COMPONENT, UTILS_LIB, POSTCSS_CONFIG, TAILWIND_CONFIG } from "./constants";

export function formatTerminalOutput(output: string): string {
  return output
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][0-9];/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\[[\d;]+[a-zA-Z]/g, '')
    .replace(/\[\?25[hl]/g, '')
    .replace(/\[K/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .replace(/\n+/g, '\n')
    .trim();
}

export function processFiles(files: File[]) {
  const result: Record<string, any> = {
    lib: { directory: {} },
    components: { 
      directory: {
        ui: { directory: {} }
      }
    },
    app: { directory: {} }
  };

  files.forEach(file => {
    // Remove src/ prefix if it exists and normalize the path
    const normalizedPath = file.path.replace(/^src\//, '');
    const parts = normalizedPath.split('/');
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = { directory: {} };
      }
      current = current[part].directory;
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = {
      file: {
        contents: file.content,
      },
    };
  });

  // Add shadcn UI theme and components
  result.components.directory.ui.directory["button.tsx"] = {
    file: {
      contents: BUTTON_COMPONENT,
    },
  };

  result.lib.directory["utils.ts"] = {
    file: {
      contents: UTILS_LIB,
    },
  };

  result.app.directory["globals.css"] = {
    file: {
      contents: GLOBALS_CSS,
    },
  };

  // Add other config files
  result["components.json"] = {
    file: {
      contents: JSON.stringify({
        "$schema": "https://ui.shadcn.com/schema.json",
        "style": "default",
        "rsc": true,
        "tsx": true,
        "tailwind": {
          "config": "tailwind.config.js",
          "css": "app/globals.css",
          "baseColor": "slate",
          "cssVariables": true
        },
        "aliases": {
          "components": "@/components",
          "utils": "@/lib/utils"
        }
      }, null, 2),
    },
  };

  result["package.json"] = {
    file: {
      contents: JSON.stringify({
        name: "next-project",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
          "shadcn:add": "npx shadcn add"
        },
        dependencies: {
          "@radix-ui/react-dialog": "^1.0.5",
          "@radix-ui/react-icons": "^1.3.0",
          "@radix-ui/react-slot": "^1.0.2",
          "class-variance-authority": "^0.7.0",
          "clsx": "^2.1.0",
          "lucide-react": "^0.344.0",
          "next": "14.1.0",
          "react": "^18",
          "react-dom": "^18",
          "tailwind-merge": "^2.2.1",
          "tailwindcss-animate": "^1.0.7",
          "@next/swc-wasm-nodejs": "14.1.4",
          "@next/swc-linux-x64-gnu": "14.1.4",
          "@next/swc-linux-x64-musl": "14.1.4"
        },
        devDependencies: {
          "@types/node": "^20",
          "@types/react": "^18",
          "@types/react-dom": "^18",
          "autoprefixer": "^10.0.1",
          "eslint": "^8",
          "eslint-config-next": "14.1.0",
          "postcss": "^8",
          "tailwindcss": "^3.3.0",
          "typescript": "^5"
        }
      }, null, 2),
    },
  };

  result["tailwind.config.js"] = {
    file: {
      contents: TAILWIND_CONFIG,
    },
  };

  result["postcss.config.js"] = {
    file: {
      contents: POSTCSS_CONFIG,
    },
  };

  result["tsconfig.json"] = {
    file: {
      contents: JSON.stringify({
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [
            {
              name: "next"
            }
          ],
          paths: {
            "@/*": ["./*"]
          }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      }, null, 2),
    },
  };

  return result;
} 