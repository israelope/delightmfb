<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Number inputs

Always use `FormattedNumberInput` (from `@/components/ui/FormattedNumberInput`) instead of raw `<input type="number">` for any monetary or large numeric input. It displays comma-separated values (e.g. 1,000,000) and passes the raw numeric string to state. Do not use `<input type="number">` for money fields.
