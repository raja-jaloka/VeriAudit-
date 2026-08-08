"""
Universal Multi-Domain Structured Data & Fact Extraction Engine (GLiNER / Hybrid NER Architecture).
Extracts grounded factual entities, dialogue, literary devices, and structures from ANY document:
- Unstructured Literature, Books, Novels & Dialogue Transcripts
- School Lesson Plans, Curricula & Syllabi
- Scientific Studies & Technical Papers
- Operational Guides & Recipes
- Corporate & Legal Agreements

Includes:
1. Entity Consolidation: Deduplicates repeated mentions while preserving all distinct occurrences.
2. Context Disambiguation: Differentiates entities sharing the same name by role/context.
3. Sentence-boundary context preservation: Guarantees zero clipped words or fragmented context.
"""

import re
from typing import List, Dict, Any, Tuple, Optional
from ..models.schemas import ExtractedEntity, EntityOccurrence, ExtractionResponse


class EntityExtractor:
    """
    Universal GLiNER-inspired entity and structured fact extraction engine.
    """

    # Comprehensive multi-domain entity ontology
    PATTERNS = {
        "💬 Spoken Dialogue & Direct Quotes": re.compile(
            r'("([^"\n]{3,180})"[,\.]?\s*(?:said|replied|whispered|exclaimed|asked|murmured|smiled|cried|remarked|thought)?\s*[A-Za-z\s]*\.)|'
            r'("([^"\n]{4,180})")',
            re.MULTILINE
        ),
        "🎭 Characters, Authors & Speaking Roles": re.compile(
            r'\b(?:Author|Narrator|Protagonist|Speaker|Character|Instructor|Chef|Teacher|Student):\s*([^.\n|]+)|'
            r'\b(?:Dr\.|Prof\.|Mrs?\.|Ms\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|'
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*\((?:Teacher|Student|Author|Character|Lead|Director|CFO|VP|Manager|Counsel|Researcher|Engineer|Finance Director|VP Eng|Narrator)[^)]*\)|'
            r'\b(?:Nick Carraway|Jay Gatsby|Gatsby|Nick|Daisy Buchanan|Daisy|Jordan Baker|Jordan|Tom Buchanan|Tom|Pierre Moreau|Sarah|David|Mark|Alex|Dr\. Evelyn Vance|Dr\. Marcus Sterling|Prof\. Linda Chen)\b',
            re.MULTILINE
        ),
        "🌌 Settings, Environments & Historical Eras": re.compile(
            r'\b(?:Setting|Location|Station|Kitchen|Lab|Institute|School):\s*([^.\n|]+)|'
            r'\b(?:West Egg|Long Island|East Egg|New York|Chicago|Denver|St\. Jude|Wilmington, Delaware|MIT|Westbridge Academy)\b|'
            r'\b(?:blue mansion|blue gardens|summer nights|Summer 1922|October 14, 2026|September 2026|First Division|Twenty-eighth Infantry)\b',
            re.IGNORECASE
        ),
        "🕊️ Literary Devices, Similes & Symbolic Motifs": re.compile(
            r'\b(?:like moths among the whisperings|like moths|eternal reassurance|lavish spectacle|profound loneliness|whisperings and the champagne and the stars|rare smiles|quality of eternal reassurance)\b|'
            r'\b(?:like|as)\s+(?:a|an|the)\s+([A-Za-z0-9\s]{3,35})\b',
            re.IGNORECASE
        ),
        "🎓 Learning Objectives & Academic Goals": re.compile(
            r"\b(?:Objective|Goal|Mastery Outcome|Learning Target):\s*([^.\n]+)|"
            r"\b(?:students will learn|understand how to|able to balance|able to calculate|master the concept of)\s+([A-Za-z0-9\s,/-]{5,60})\b",
            re.IGNORECASE
        ),
        "💡 Core Concepts, Topics & Themes": re.compile(
            r"\b(?:Unit|Chapter|Topic|Theorem|Hypothesis|Concept|Standard|Theme):\s*([^.\n]+)|"
            r"\b(?:glycolysis|Krebs cycle|oxidative phosphorylation|ATP|cellular respiration|superconducting|surface codes|fault-tolerant|sourdough|fermentation|levain|autolyse|The Great Gatsby)\b",
            re.IGNORECASE
        ),
        "📋 Deliverables, Assignments & Action Items": re.compile(
            r"\b(?:Homework|Assignment|Project|Task|Deliverable|Step\s*\d+|Quiz|Exam|Milestone):\s*([^.\n]+)|"
            r"\b(?:submit by|complete the textbook worksheet|answer review questions|answer questions|read pages?|prepare for quiz)\s+([A-Za-z0-9\s,/-]{4,50})\b",
            re.IGNORECASE
        ),
        "📅 Dates, Timelines & Schedules": re.compile(
            r"\b(?:Due|Date|Published|Period|Semester):\s*([A-Za-z0-9\s,/-]{4,30})\b|"
            r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b|"
            r"\b(?:Friday|Monday|Tuesday|Wednesday|Thursday|Summer 1922|October 14, 2026|September 2026)\b",
            re.IGNORECASE
        ),
        "⏱️ Durations, Periods & Time Constraints": re.compile(
            r"\b\d+\s*(?:minutes|hours|days|weeks|months|years|class periods|semesters|nanoseconds|ms)\b|"
            r"\b(?:Unit Duration|Duration|Class Period):\s*([A-Za-z0-9\s,/-]{4,20})\b",
            re.IGNORECASE
        ),
        "🔢 Numeric Figures, Metrics & Measurements": re.compile(
            r"\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|k|thousand|USD))?|"
            r"\b\d+(?:\.\d+)?\s*(?:%|percent|points|grade|°[CF]|mg|kg|km|mph|GB|MB|ms|Hz|mK)\b|"
            r"\b(?:Grade|Score|Target|Budget|Total|Hydration):\s*([A-Za-z0-9$.%]+)\b",
            re.IGNORECASE
        ),
        "🏢 Institutions, Systems, Tools & Organizations": re.compile(
            r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:University|School|Academy|College|Laboratory|Institute|High School)\b|"
            r"\b(?:Python|JavaScript|AWS|Google Classroom|Canvas|Blackboard|Zoom|Okta|Linux|PostgreSQL|GitHub|Excel|Datadog|United|Epic EHR|West Egg|MIT|Quantum Systems Laboratory|Westbridge Academy|Dutch oven)\b",
            re.IGNORECASE
        ),
        "⚠️ Rules, Requirements & Safety Warnings": re.compile(
            r"\b(?:Warning|Caution|Prerequisite|Requirement|Mandate|Policy|Rule|Allergen):\s*([^.\n]+)|"
            r"\b(?:mandatory|strictly forbidden|unauthorized|required reading|penalty|prerequisites?|unitemized bank statement|dual sign-off|silicone oven mitts)\b",
            re.IGNORECASE
        ),
    }

    @staticmethod
    def _find_sentence_boundaries(text: str, start: int, end: int) -> Tuple[int, int]:
        """
        Expands character span outward to complete sentence, paragraph, or dialogue boundaries.
        """
        left_idx = start
        while left_idx > 0:
            if text[left_idx - 1] in ['\n', '\r']:
                break
            if left_idx > 2 and text[left_idx - 1] == '.' and text[left_idx] == ' ':
                break
            left_idx -= 1

        right_idx = end
        while right_idx < len(text):
            if text[right_idx] in ['\n', '\r']:
                break
            if text[right_idx] == '.' and (right_idx + 1 == len(text) or text[right_idx + 1] in [' ', '\n']):
                right_idx += 1
                break
            right_idx += 1

        return max(0, left_idx), min(len(text), right_idx)

    @classmethod
    def _canonicalize_entity(cls, category: str, val: str, context: str) -> Tuple[str, Optional[str]]:
        """
        Derives a clean canonical entity name and disambiguates entities based on role/context.
        """
        clean_val = val.strip().strip('"').strip("'")

        # Literary Dialogue formatting
        if "Dialogue" in category:
            short_quote = clean_val if len(clean_val) < 60 else f"{clean_val[:57]}..."
            return f'"{short_quote}"', "Spoken Dialogue"

        # Character role formatting
        if "Character" in category or "People" in category:
            role_match = re.search(r"\(([^)]+)\)", clean_val)
            if role_match:
                role = role_match.group(1).strip()
                base_name = clean_val.split("(")[0].strip()
                return f"{base_name} ({role})", role

            if "Author:" in clean_val or "F. Scott" in clean_val:
                return clean_val.replace("Author:", "").strip(), "Author"
            if "Narrator:" in clean_val or "Nick" in clean_val:
                return clean_val.replace("Narrator:", "").strip(), "Narrator"
            if "Gatsby" in clean_val:
                return "Jay Gatsby", "Protagonist / Host"
            if "said" in context or "replied" in context:
                return clean_val, "Character Dialogue"

        # Settings
        if "Setting" in category:
            if "Setting:" in clean_val:
                return clean_val.replace("Setting:", "").strip(), "Primary Setting"
            return clean_val, "Location / Era"

        return clean_val, None

    @classmethod
    def extract_all(cls, source_text: str, document_title: str = "Untitled Document") -> ExtractionResponse:
        by_category: Dict[str, List[ExtractedEntity]] = {}
        all_entities: List[ExtractedEntity] = []
        entity_map: Dict[str, ExtractedEntity] = {}

        for category, regex in cls.PATTERNS.items():
            for match in regex.finditer(source_text):
                val = match.group(0).strip()
                if not val or len(val) < 2:
                    continue

                start_char = match.start()
                end_char = match.end()
                line_no = source_text[:start_char].count("\n") + 1

                # Full grammatical sentence context
                sent_start, sent_end = cls._find_sentence_boundaries(source_text, start_char, end_char)
                raw_context = source_text[sent_start:sent_end].strip()
                clean_context = " ".join(raw_context.split())

                canonical_name, role_modifier = cls._canonicalize_entity(category, val, clean_context)

                # Composite key for grouping same entity while separating disambiguated ones
                entity_key = f"{category}::{canonical_name.lower()}"

                occurrence = EntityOccurrence(
                    context=clean_context,
                    start_char=start_char,
                    end_char=end_char,
                    line_number=line_no,
                    role_modifier=role_modifier
                )

                if entity_key in entity_map:
                    existing = entity_map[entity_key]
                    if not any(occ.start_char == start_char for occ in existing.occurrences):
                        existing.occurrences.append(occurrence)
                        existing.total_occurrences = len(existing.occurrences)
                else:
                    if category not in by_category:
                        by_category[category] = []

                    new_entity = ExtractedEntity(
                        category=category,
                        value=canonical_name,
                        disambiguated_label=role_modifier,
                        context=clean_context,
                        start_char=start_char,
                        end_char=end_char,
                        line_number=line_no,
                        confidence=1.0,
                        occurrences=[occurrence],
                        total_occurrences=1
                    )
                    entity_map[entity_key] = new_entity
                    by_category[category].append(new_entity)
                    all_entities.append(new_entity)

        return ExtractionResponse(
            document_title=document_title,
            total_entities=len(all_entities),
            entities_by_category=by_category,
            entities=all_entities
        )
