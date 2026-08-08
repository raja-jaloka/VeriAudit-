"""
Transcript, OCR, and messy unstructured document cleaner with character-offset preservation.
"""

import re
from typing import Tuple, List, Dict, Any


class CleaningResult:
    def __init__(self, raw_text: str, cleaned_text: str, line_mappings: List[Dict[str, Any]]):
        self.raw_text = raw_text
        self.cleaned_text = cleaned_text
        self.line_mappings = line_mappings


class DocumentCleaner:
    """
    Cleans messy unstructured text (OCR noise, speech transcripts, garbled spacing)
    while preserving faithful references and mapping line numbers.
    """

    # Speech transcript filler patterns
    SPEECH_FILLERS = re.compile(r"\b(um|uh|erm|like\s+you\s+know|you\s+know|sort\s+of|kind\s+of)\b", re.IGNORECASE)
    TIMESTAMP_PATTERN = re.compile(r"\[\d{1,2}:\d{2}(?::\d{2})?\]|\(\d{1,2}:\d{2}\)")
    TRANSCRIPT_TAGS = re.compile(r"\[(laughter|applause|inaudible|crosstalk|silence|sighs|cheering)\]", re.IGNORECASE)
    OCR_LINEBREAK_HYPHEN = re.compile(r"(\w+)-\s*\n\s*(\w+)")
    MULTIPLE_SPACES = re.compile(r"[ \t]+")
    MULTIPLE_NEWLINES = re.compile(r"\n{3,}")

    @classmethod
    def clean(cls, raw_text: str, doc_type: str = "unstructured_raw") -> CleaningResult:
        if not raw_text:
            return CleaningResult("", "", [])

        text = raw_text

        # 1. Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # 2. Fix broken OCR hyphens (e.g. "compli-\nance" -> "compliance")
        text = cls.OCR_LINEBREAK_HYPHEN.sub(r"\1\2", text)

        # 3. Clean transcript timestamps & audio artifacts if transcript mode or general
        if doc_type in ["meeting_transcript", "speech", "unstructured_raw"]:
            # Remove audio event annotations like [laughter]
            text = cls.TRANSCRIPT_TAGS.sub("", text)
            # Remove timestamps like [00:12:44]
            text = cls.TIMESTAMP_PATTERN.sub("", text)

        # 4. Collapse consecutive empty lines
        text = cls.MULTIPLE_NEWLINES.sub("\n\n", text)

        # 5. Clean trailing spaces on lines
        lines = [line.strip() for line in text.split("\n")]
        cleaned_text = "\n".join(lines).strip()

        # 6. Build line mappings for line-number lookups
        line_mappings = []
        current_offset = 0
        for idx, line in enumerate(cleaned_text.split("\n")):
            length = len(line)
            line_mappings.append({
                "line_number": idx + 1,
                "start_char": current_offset,
                "end_char": current_offset + length,
                "content": line
            })
            current_offset += length + 1  # include newline char

        return CleaningResult(raw_text=raw_text, cleaned_text=cleaned_text, line_mappings=line_mappings)

    @classmethod
    def extract_speakers(cls, text: str) -> List[Dict[str, Any]]:
        """
        Parses speaker tags in dialogue documents e.g. "Sarah (VP Eng):", "Speaker 2:", "Alice: "
        """
        speaker_pattern = re.compile(r"^([A-Z][A-Za-z0-9\s.,()/-]{1,30}):\s*(.*)$", re.MULTILINE)
        turns = []
        for match in speaker_pattern.finditer(text):
            speaker = match.group(1).strip()
            utterance = match.group(2).strip()
            turns.append({
                "speaker": speaker,
                "utterance": utterance,
                "start_char": match.start(),
                "end_char": match.end()
            })
        return turns
