export function cleanMessageContent(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = String(text);

  // Strip <think>...</think> reasoning blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "");

  // Strip <|tool_calls_section_begin|>... blocks
  cleaned = cleaned.replace(/<\|tool_calls_section_begin\|>[\s\S]*?(?:<\|tool_calls_section_end\|>|$)/g, "");

  // Strip <|tool_call_begin|>... blocks
  cleaned = cleaned.replace(/<\|tool_call_begin\|>[\s\S]*?(?:<\|tool_call_end\|>|$)/g, "");

  // Strip <tool_call>...</tool_call> blocks
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?(?:<\/tool_call>|$)/g, "");

  // Strip MiniMax <invoke name="...">...</invoke> blocks
  cleaned = cleaned.replace(/<invoke\s[^>]*>[\s\S]*?(?:<\/invoke>|$)/g, "");
  cleaned = cleaned.replace(/<invoke\s[^>]*\/>/g, "");

  // Strip TOOL_CALL: {...}
  cleaned = cleaned.replace(/^TOOL_CALL:\s*\{[\s\S]*?\}\s*$/gm, "");
  cleaned = cleaned.replace(/TOOL_CALL:\s*\{[\s\S]*?\}/g, "");

  // Strip leading stray closing braces or JSON bracket artifacts
  cleaned = cleaned.replace(/^\s*\}\s*/, "");

  // Strip any stray special tokens
  const tokens = [
    "<|tool_calls_section_begin|>",
    "<|tool_calls_section_end|>",
    "<|tool_call_begin|>",
    "<|tool_call_argument_begin|>",
    "<|tool_call_end|>",
    "<|im_start|>",
    "<|im_end|>",
    "<|eot_id|>",
    "[TOOL_CALL]",
    "TOOL_CALL:",
  ];
  for (const token of tokens) {
    cleaned = cleaned.split(token).join("");
  }

  // Final trim and leading brace cleanup
  cleaned = cleaned.replace(/^\s*\}\s*/, "");
  return cleaned.trim();
}
