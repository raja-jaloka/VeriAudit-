"""
Universal Multi-Domain Structured Data & Fact Extraction Engine.
Extracts grounded factual entities for ANY document type:
- School Lesson Plans, Curricula & Academic Syllabi
- Books, Literature, Scripts & Narrative Prose
- Scientific Studies & Technical Engineering Specs
- Instructional Manuals, Procedures & Recipes
- Corporate Memos, Policies & Legal Agreements
"""

import re
from typing import List, Dict, Any
from ..models.schemas import ExtractedEntity, ExtractionResponse


class EntityExtractor:
    """
    Universal entity and fact extraction across arbitrary domains with exact character offsets.
    """

    PATTERNS = {
        "People, Roles, Authors & Characters": re.compile(
            r"\b(Dr\.\s+[A-Z][a-z]+|Prof\.\s+[A-Z][a-z]+|Teacher|Instructor|Student|Author|Narrator|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*\((?:Teacher|Student|Author|Character|Lead|Director|CFO|VP|Manager|Counsel|Researcher|Engineer)[A-Za-z0-9\s.,/-]*\))\b|"
            r"\b(Mrs?\.\s+[A-Z][a-z]+|Ms\.\s+[A-Z][a-z]+|[A-Z][a-z]+\s+[A-Z][a-z]+(?=\s+(?:teaches|wrote|said|concluded|argued|observed)))\b",
            re.MULTILINE
        ),
        "Learning Objectives, Concepts & Topics": re.compile(
            r"\b(?:Objective|Topic|Unit|Chapter|Lesson|Hypothesis|Theorem|Concept|Standard|Theme):\s*([^.\n]+)|"
            r"\b(?:students will learn|understand how to|able to|introduction to|analysis of)\s+([A-Za-z0-9\s,/-]{5,40})\b",
            re.IGNORECASE
        ),
        "Deliverables, Assignments & Action Items": re.compile(
            r"\b(?:Homework|Assignment|Project|Task|Deliverable|Step\s*\d+|Quiz|Exam|Milestone):\s*([^.\n]+)|"
            r"\b(?:submit by|complete the|read pages?|prepare for)\s+([A-Za-z0-9\s,/-]{4,40})\b",
            re.IGNORECASE
        ),
        "Dates, Durations, Schedules & Times": re.compile(
            r"\b(\d+\s*(?:minutes|hours|days|weeks|months|years|class periods|pages|chapters|semesters))\b|"
            r"\b(?:Due|Date|Published|Period|Semester):\s*([A-Za-z0-9\s,/-]{4,30})\b|"
            r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}/\d{1,2}/\d{2,4})\b",
            re.IGNORECASE
        ),
        "Numeric Figures, Metrics & Measurements": re.compile(
            r"\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|k|thousand|USD))?|"
            r"\b\d+(?:\.\d+)?\s*(?:%|percent|points|grade|°[CF]|mg|kg|km|mph|GB|MB|ms|Hz)\b|"
            r"\b(?:Grade|Score|Target|Budget|Total):\s*([A-Za-z0-9$.%]+)\b",
            re.IGNORECASE
        ),
        "Institutions, Settings, Tools & Systems": re.compile(
            r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:University|School|Academy|College|Laboratory|Institute|High School|Middle School))\b|"
            r"\b(Python|JavaScript|AWS|Google Classroom|Canvas|Blackboard|Zoom|Okta|Linux|PostgreSQL|GitHub|Excel)\b",
            re.IGNORECASE
        ),
        "Rules, Requirements & Safety Warnings": re.compile(
            r"\b(?:Warning|Caution|Prerequisite|Requirement|Mandate|Policy|Rule):\s*([^.\n]+)|"
            r"\b(mandatory|strictly forbidden|unauthorized|required reading|penalty|prerequisites?)\b",
            re.IGNORECASE
        ),
    }

    @classmethod
    def extract_all(cls, source_text: str, document_title: str = "Untitled Document") -> ExtractionResponse:
        entities: List[ExtractedEntity] = []
        by_category: Dict[str, List[ExtractedEntity]] = {}

        for category, regex in cls.PATTERNS.items():
            by_category[category] = []
            for match in regex.finditer(source_text):
                val = match.group(0).strip()
                if not val or len(val) < 2:
                    continue
                start_char = match.start()
                end_char = match.end()
                line_no = source_text[:start_char].count("\n") + 1
                
                # Context snippet
                ctx_start = max(0, start_char - 40)
                ctx_end = min(len(source_text), end_char + 40)
                prefix = "..." if ctx_start > 0 else ""
                suffix = "..." if ctx_end < len(source_text) else ""
                context = f"{prefix}{source_text[ctx_start:ctx_end].strip()}{suffix}"

                entity = ExtractedEntity(
                    category=category,
                    value=val,
                    context=context,
                    start_char=start_char,
                    end_char=end_char,
                    line_number=line_no,
                    confidence=1.0
                )
                entities.append(entity)
                by_category[category].append(entity)

        return ExtractionResponse(
            document_title=document_title,
            total_entities=len(entities),
            entities_by_category=by_category,
            entities=entities
        )
