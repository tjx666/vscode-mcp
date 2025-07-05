import { z } from 'zod';

/**
 * 基础输入 Schema（可被复用）
 */
export const OpenDiffBaseInputSchema = z
  .object({
    before: z.string().optional().describe('URI of the first file to compare'),
    after: z.string().optional().describe('URI of the second file to compare'),
    beforeText: z.string().optional().describe('Text content of the first document'),
    afterText: z.string().optional().describe('Text content of the second document'),
    beforeLabel: z.string().optional().describe('Label for the first document (used when comparing text)'),
    afterLabel: z.string().optional().describe('Label for the second document (used when comparing text)'),
    language: z.string().optional().describe('Language identifier for syntax highlighting'),
  })
  .strict();

/**
 * 完整输入 Schema（带验证）
 */
export const OpenDiffInputSchema = OpenDiffBaseInputSchema.refine(
  (data) => {
    // 至少需要有一对可比较的内容
    const hasBeforeContent = data.before || data.beforeText;
    const hasAfterContent = data.after || data.afterText;
    return hasBeforeContent && hasAfterContent;
  },
  {
    message: 'Must provide either URIs or text content for both before and after',
  }
);

/**
 * 输出 Schema
 */
export const OpenDiffOutputSchema = z
  .object({
    success: z.boolean().describe('Whether the diff editor was opened successfully'),
    message: z.string().describe('Status message'),
  })
  .strict();

/**
 * 类型定义
 */
export type OpenDiffPayload = z.infer<typeof OpenDiffInputSchema>;
export type OpenDiffResult = z.infer<typeof OpenDiffOutputSchema>; 