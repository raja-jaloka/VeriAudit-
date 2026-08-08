"""
Semantic sentence and paragraph chunker with character-level span tracking.
"""

import re
from typing import List, Dict, Any, Optional
from ..models.schemas import DocumentSpan


class DocumentChunker:
    """
    Chunks unstructured text into granular spans while retaining absolute character indices.
    """

    HEADING_OR_SPEAKER = re.compile(
        r"^(?:(?:Section|Clause|Article|Policy|Rule)\s+[\d.]+|[A-Z][A-Za-z0-9\s.,()/-]{1,30}:)\s*",
        re.MULTILINE
    )

    @classmethod
    def chunk_document(cls, cleaned_text: str) -> List[DocumentSpan]:
        if not cleaned_text:
            return []

        spans: List[DocumentSpan] = []
        lines = cleaned_text.split("\n")

        current_offset = 0
        current_speaker: Optional[str] = None
        chunk_counter = 1

        for line_idx, line in enumerate(lines):
            line_num = line_idx + 1
            line_len = len(line)
            line_start = current_offset
            line_end = current_offset + line_len

            trimmed = line.strip()
            if not trimmed:
                current_offset += line_len + 1
                continue

            # Check if this line introduces a new speaker or heading
            speaker_match = re.match(r"^([A-Z][A-Za-z0-9\s.,()/-]{1,25}):", trimmed)
            heading_match = re.match(r"^((?:Section|Clause|Article|Policy|Rule)\s+[\d.]+[:\s\-]+[^\n]+)", trimmed, re.IGNORECASE)

            if speaker_match:
                current_speaker = speaker_match.group(1).strip()
            elif heading_match:
                current_speaker = heading_match.group(1).strip()

            # Split line into sentences if it's a long paragraph
            sentence_splits = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", trimmed)
            if len(sentence_splits) > 1 and len(trimmed) > 120:
                sentence_start = line_start
                for s in sentence_splits:
                    s_clean = s.strip()
                    if not s_clean:
                        continue
                    # Find exact pos in line
                    pos_in_line = line.find(s_clean)
                    actual_start = line_start + (pos_in_line if pos_in_line >= 0 else 0)
                    actual_end = actual_start + len(s_clean)

                    spans.append(
                        DocumentSpan(
                            chunk_id=chunk_counter,
                            start_char=actual_start,
                            end_char=actual_end,
                            line_number=line_num,
                            text=s_clean,
                            speaker_or_heading=current_speaker
                        )
                    )
                    chunk_counter += 1
            else:
                spans.append(
                    DocumentSpan(
                        chunk_id=chunk_counter,
                        start_char=line_start,
                        end_char=line_end,
                        line_number=line_num,
                        text=trimmed,
                        speaker_or_heading=current_speaker
                    )
                )
                chunk_counter += 1

            current_offset += line_len + 1

        return spans
