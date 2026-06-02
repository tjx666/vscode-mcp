import type { z } from 'zod';

/**
 * Auto-generated commander option spec, derived from a single zod field.
 */
export interface OptionSpec {
  flags: string;
  description: string;
  defaultValue?: unknown;
  parse?: (value: string, previous?: unknown) => unknown;
  /** Original zod key, used by the action handler when rebuilding params. */
  key: string;
  /** commander camelCase property name produced from `flags`. */
  optName: string;
}

/**
 * Convert a zod key like `__NOT_RECOMMEND__filePaths` to `--not-recommend-file-paths`.
 * Strips surrounding underscores, then splits on snake_case and camelCase boundaries.
 */
function camelToKebab(input: string): string {
  return input
    .replaceAll(/_+/g, '-')
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * commander stores `--foo-bar` under `opts.fooBar`. Replicate its naming rule
 * so we can read the parsed value back by name.
 */
function kebabToCamel(input: string): string {
  return input.replaceAll(/-([a-z0-9])/g, (_, c) => (c as string).toUpperCase());
}

/**
 * Peel optional()/default() wrappers off a zod schema, surfacing the inner
 * type plus whether the field is optional and its default (if any).
 */
function unwrap(schema: z.ZodTypeAny): {
  inner: z.ZodTypeAny;
  optional: boolean;
  defaultValue: unknown | undefined;
} {
  let s: z.ZodTypeAny = schema;
  let optional = false;
  let defaultValue: unknown | undefined;

  // zod 4 stores discriminator under `_zod.def.type`. Cast through `any`
  // because that field is internal.
  while (true) {
    const def = (s as any)._zod?.def;
    if (!def) break;
    if (def.type === 'optional') {
      optional = true;
      s = def.innerType;
    } else if (def.type === 'default') {
      const dv = def.defaultValue;
      defaultValue = typeof dv === 'function' ? dv() : dv;
      optional = true;
      s = def.innerType;
    } else {
      break;
    }
  }

  return { inner: s, optional, defaultValue };
}

/**
 * Build a single commander option spec from one zod field. Returns null when
 * the field is too complex to express as a flat flag (the caller should fall
 * back to a custom `cli.options` definition in that case).
 */
function fieldToOption(key: string, schema: z.ZodTypeAny): OptionSpec | null {
  const { inner, optional, defaultValue } = unwrap(schema);
  const def = (inner as any)._zod?.def;
  const type: string | undefined = def?.type;
  const flagName = camelToKebab(key);
  const description = (schema as any).description ?? '';

  switch (type) {
    case 'string':
      return {
        key,
        optName: kebabToCamel(flagName),
        flags: optional ? `--${flagName} [value]` : `--${flagName} <value>`,
        description,
        defaultValue,
      };

    case 'number':
      return {
        key,
        optName: kebabToCamel(flagName),
        flags: optional ? `--${flagName} [number]` : `--${flagName} <number>`,
        description,
        defaultValue,
        parse: (v) => {
          const n = Number(v);
          if (Number.isNaN(n)) {
            throw new TypeError(`Expected a number for --${flagName}, got "${v}"`);
          }
          return n;
        },
      };

    case 'boolean': {
      // Use `--no-xxx` when the default is true so users can flip it off,
      // otherwise expose `--xxx` as a presence flag.
      const isNegated = defaultValue === true;
      const flags = isNegated ? `--no-${flagName}` : `--${flagName}`;
      // For `--no-xxx`, commander itself sets the camelCased opt to `true` by
      // default and to `false` when the flag is given — so we don't pass a
      // defaultValue (it would also work but is redundant).
      return {
        key,
        optName: kebabToCamel(flagName),
        flags,
        description,
        defaultValue: isNegated ? undefined : defaultValue,
      };
    }

    case 'enum': {
      const choices = Object.keys(def.entries).join('|');
      return {
        key,
        optName: kebabToCamel(flagName),
        flags: optional ? `--${flagName} [${choices}]` : `--${flagName} <${choices}>`,
        description: description ? `${description} (one of: ${choices})` : `One of: ${choices}`,
        defaultValue,
      };
    }

    case 'array': {
      const element = def.element;
      const elemDef = (element as any)._zod?.def;
      const elemType = elemDef?.type;
      let placeholder: string;
      if (elemType === 'enum') {
        placeholder = `<${Object.keys(elemDef.entries).join('|')}...>`;
      } else if (elemType === 'string' || elemType === 'number') {
        placeholder = '<items...>';
      } else {
        // Arrays of objects can't be expressed as a flat flag.
        return null;
      }
      // Required array fields with no schema default still need a usable CLI
      // default — otherwise commander rejects the bare flag and there's no
      // way to express "use the schema's empty-array meaning" without one.
      const resolvedDefault = defaultValue ?? [];
      return {
        key,
        optName: kebabToCamel(flagName),
        flags: `--${flagName} ${placeholder}`,
        description,
        defaultValue: resolvedDefault,
      };
    }

    default:
      // Unknown / unsupported type. Fall back to a raw string option so users
      // can still pass something through, but document it.
      return {
        key,
        optName: kebabToCamel(flagName),
        flags: optional ? `--${flagName} [value]` : `--${flagName} <value>`,
        description: description ? `${description} (raw JSON)` : 'Raw JSON value',
        defaultValue,
        parse: (v) => JSON.parse(v),
      };
  }
}

/**
 * Build commander option specs for every field of a zod object schema.
 * Throws if any field can't be expressed — that's the cue for the caller to
 * provide a custom `cli.options` + `cli.transform` instead.
 */
export function schemaToOptions(schema: z.ZodObject<z.ZodRawShape>): OptionSpec[] {
  const opts: OptionSpec[] = [];
  for (const [key, field] of Object.entries(schema.shape)) {
    const spec = fieldToOption(key, field as z.ZodTypeAny);
    if (!spec) {
      throw new Error(
        `Cannot auto-generate CLI option for field "${key}" — provide a custom \`cli.options\` definition.`,
      );
    }
    opts.push(spec);
  }
  return opts;
}
