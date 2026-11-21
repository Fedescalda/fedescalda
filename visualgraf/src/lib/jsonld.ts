/** Serializa JSON-LD de forma segura para incrustarlo en <script>. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
