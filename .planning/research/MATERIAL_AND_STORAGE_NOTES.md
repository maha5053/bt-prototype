# Material and Storage Notes

**Analysis Date:** 2026-05-15

## Purpose

Support the next BioTrack prototype milestone: configurable material types, registration collection fields, incoming control fields, and optional storage stage for production orders.

## Skin Material: Suggested Fields

External lab and pathology guidance repeatedly asks for the specimen source/site, biopsy type, collection date/time, fixative or transport medium, clinical indication/history, and container/specimen identification.

Recommended default fields for material type `Кожа`:

- **Анатомическая область / место биопсии** (`text`, required): examples include right forearm, left upper arm, lesion site.
- **Тип биопсии** (`select`, required): punch, shave, excisional, incisional, other.
- **Количество фрагментов** (`number`, optional): useful for multi-piece tissue submissions.
- **Размер фрагмента, мм** (`text`, optional): free text such as `4 мм punch` or `6 x 3 мм`.
- **Ориентация образца** (`text`, optional): sutures/marks/margins if relevant.
- **Контейнер / среда** (`select`, required): formalin, Michel's solution, transport medium, saline-moistened gauze/telfa, no fixative.
- **Время помещения в фиксатор** (`date` or datetime-like text until datetime control exists, optional/required per product): important when fixation timing matters.
- **Клинический диагноз / показание** (`text`, optional): can be prompted but not always required in the prototype.

Evidence:
- UF Dermatopathology asks for collection date, biopsy site, biopsy type, and clinical diagnosis/reason on requisitions, and labels containers with patient identity, collection date/time, and specimen type: https://dermatology.med.ufl.edu/dermpath/all-about-dermpath/specimen-collection-procedures/
- Ohio State anatomic pathology guidance lists tissue type, site, orientation, collection/procedure date/time, source, clinical history, number of containers, and fixative/preservative information: https://hrs.osu.edu/-/media/files/wexnermedical/healthcare-professionals/clinical-labs/forms-policies-procedures/general-polices-procedures-tip-sheets/specimen-collection-and-acceptable-specimen-types-1.pdf
- SLUCare notes separate containers for multiple specimens, correct anatomic site labeling, and formalin/Michel's solution or refrigerated saline-moistened material when formalin cannot be used: https://www.ssmhealth.com/slucare/services/pathology/reference-laboratories-pathology-consults/histopathology-laboratory/histopathology-laboratory-specimen-requirements
- ARUP skin biopsy chromosome analysis requires a sterile screw-top container with tissue culture transport medium, with fallback media listed: https://ltd.aruplab.com/Tests/Pub/2002286

## Blood Material: Existing Defaults

Keep the current registration collection fields as defaults for material type `Кровь`:

- **Объём забранной крови (мл)** (`number`, required unless current form says otherwise)
- **Тип контейнера** (`select` or `text`, required unless current form says otherwise)

Incoming control defaults should be copied from the current hard-coded order creation form and moved into material type configuration.

## Storage Stage: Suggested Fields

External biospecimen and pathology guidance focuses on condition, temperature, access/location, retrieval timestamps, deviations, and chain-of-custody style records.

Recommended default fields for product storage stage:

- **Условие хранения** (`select`, required): room temperature, 2-8 C, <= -20 C, <= -70 C, LN2/vapor phase, other.
- **Место хранения** (`text` or `select`, required): room/freezer/shelf/box/cell in prototype terms.
- **Дата и время начала хранения** (`date` or datetime-like text, required).
- **Дата и время окончания хранения** (`date` or datetime-like text, optional).
- **Фактическая температура** (`number`, optional, unit `C`).
- **Контейнер хранения** (`text` or `select`, optional).
- **Ответственный** (`text` or current user default, optional).
- **Отклонения условий хранения** (`checkbox` + `text` notes, optional): temperature excursion, damage, access/retrieval issue.

Evidence:
- University of Washington lab medicine guidance lists storage conditions for fresh tissue/fluids, cytogenetics/FISH, and surgical pathology/histology/cytology, including room temperature and 4 C options: https://testguide.labmed.uw.edu/guideline/ap_specimen_handling
- NCI best practices emphasize secure storage, limited access, retrieval records with date/time, and temperature deviations/damage tracking; shipping/storage temperature ranges include room-like 22-30 C, 2-8 C, <= -20 C, <= -70 C, and <= -150 C: https://dctd.cancer.gov/data-tools-biospecimens/biospecimens-biobanks/resources/best-practices/biospecimen-resources/appendices/2026-4th-edition-best-practices.pdf

## Product vs Material Type Decision

- Material type owns global field schemas for registration collection and incoming control.
- Product owns its selected material type and optional process-specific settings.
- For registration material balance, use material type defaults as a source/preset, but store the effective rows on the product/order snapshot so product changes only affect new orders and old orders remain stable.

## Implementation Notes

- Product changes must affect only newly created orders.
- Created order should snapshot product settings: material type, registration fields, incoming control fields, storage stage config, registration material balance, production step defaults, and QC config.
- The prototype should not decrement stock when material balance rows are marked "write off on completion"; only display/store the intended behavior.

