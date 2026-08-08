"""
Deterministic Character-Level Grounding and Faithfulness Validator.
Ensures that every citation is grounded in verbatim source text with zero hallucinated quotes.
"""

import re
from typing import Optional, Tuple
from ..models.schemas import GroundedCitation


class GroundingValidator:
    """
    Validates and anchors citations against the original document text.
    Computes mathematical faithfulness and exact character offsets.
    """

    @classmethod
    def validate_and_anchor(
        cls,
        source_text: str,
        raw_quote: str,
        speaker_hint: Optional[str] = None
    ) -> Optional[GroundedCitation]:
        if not source_text or not raw_quote:
            return None

        quote_clean = raw_quote.strip()
        if len(quote_clean) < 3:
            return None

        # 1. Direct exact substring match
        idx = source_text.find(quote_clean)
        if idx != -1:
            start_char = idx
            end_char = idx + len(quote_clean)
            line_no = cls._get_line_number(source_text, start_char)
            context = cls._extract_context(source_text, start_char, end_char)
            return GroundedCitation(
                quote=quote_clean,
                start_char=start_char,
                end_char=end_char,
                line_number=line_no,
                context_snippet=context,
                faithfulness_score=1.0,
                is_exact_match=True,
                source_speaker=speaker_hint
            )

        # 2. Case-insensitive exact match
        idx_ci = source_text.lower().find(quote_clean.lower())
        if idx_ci != -1:
            start_char = idx_ci
            end_char = idx_ci + len(quote_clean)
            verbatim_text = source_text[start_char:end_char]
            line_no = cls._get_line_number(source_text, start_char)
            context = cls._extract_context(source_text, start_char, end_char)
            return GroundedCitation(
                quote=verbatim_text,
                start_char=start_char,
                end_char=end_char,
                line_number=line_no,
                context_snippet=context,
                faithfulness_score=0.98,
                is_exact_match=False,
                source_speaker=speaker_hint
            )

        # 3. Normalized whitespace / punctuation fuzzy sliding window
        normalized_match = cls._fuzzy_span_search(source_text, quote_clean)
        if normalized_match:
            start_char, end_char, score = normalized_match
            verbatim_text = source_text[start_char:end_char]
            line_no = cls._get_line_number(source_text, start_char)
            context = cls._extract_context(source_text, start_char, end_char)
            return GroundedCitation(
                quote=verbatim_text,
                start_char=start_char,
                end_char=end_char,
                line_number=line_no,
                context_snippet=context,
                faithfulness_score=score,
                is_exact_match=(score >= 0.99),
                source_speaker=speaker_hint
            )

        # If citation is completely hallucinated / missing from source, return None
        return None

    @staticmethod
    def _get_line_number(text: str, start_char: int) -> int:
        return text[:start_char].count("\n") + 1

    @staticmethod
    def _extract_context(text: str, start_char: int, end_char: int, pad: int = 60) -> str:
        ctx_start = max(0, start_char - pad)
        ctx_end = min(len(text), end_char + pad)
        prefix = "..." if ctx_start > 0 else ""
        suffix = "..." if ctx_end < len(text) else ""
        return f"{prefix}{text[ctx_start:ctx_end].strip()}{suffix}"

    @classmethod
    def _fuzzy_span_search(cls, source: str, target: str) -> Optional[Tuple[int, int, float]]:
        """
        Fuzzy aligns target words with source text words to locate the true span
        when minor OCR or formatting discrepancies exist.
        """
        target_words = [w.lower() for w in re.findall(r"\w+", target)]
        if not target_words or len(target_words) < 2:
            return None

        # Search for first 2-3 words as anchor
        anchor = r"\b" + r"\s+".join(map(re.escape, target_words[:2])) + r"\b"
        match = re.search(anchor, source, re.IGNORECASE)
        if match:
            start_pos = match.start()
            # Find end anchor using last 2 words
            end_anchor = r"\b" + r"\s+".join(map(re.escape, target_words[-2:])) + r"\b"
            end_match = re.search(end_anchor, source[start_pos:], re.IGNORECASE)
            if end_match:
                end_pos = start_pos + end_match.end()
                matched_str = source[start_pos:end_pos]
                source_words = [w.lower() for w in re.findall(r"\w+", matched_str)]
                
                # Compute word-overlap Jaccard / token precision
                matched_set = set(source_words)
                target_set = set(target_words)
                overlap = len(matched_set.intersection(target_set))
                total = max(len(target_set), 1)
                score = round(overlap / total, 3)

                if score >= 0.75:
                    return (start_pos, end_pos, score)

        return None
