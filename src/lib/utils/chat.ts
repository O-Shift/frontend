export function cleanMessageContent(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = String(text);
  cleaned = cleaned.replace(/<\|tool_calls_section_begin\|>[\s\S]*?(?:<\|tool_calls_section_end\|>|$)/g, '');
  cleaned = cleaned.replace(/<\|tool_call_begin\|>[\s\S]*?(?:<\|tool_call_end\|>|$)/g, '');
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?(?:<\/tool_call>|$)/g, '');
  cleaned = cleaned.replace(/^TOOL_CALL:\s*\{[\s\S]*?\}\s*$/gm, '');
  cleaned = cleaned.replace(/TOOL_CALL:\s*\{[\s\S]*?\}/g, '');
  const tokens = [
    '<|tool_calls_section_begin|>',
    '<|tool_calls_section_end|>',
    '<|tool_call_begin|>',
    '<|tool_call_argument_begin|>',
    '<|tool_call_end|>',
    '<|im_start|>',
    '<|im_end|>',
    '<|eot_id|>',
  ];
  for (const token of tokens) {
    cleaned = cleaned.split(token).join('');
  }
  return cleaned.trim();
}
