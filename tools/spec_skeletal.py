"""Diagram spec for the Skeletal System unit (bones, skeleton, joints).

Figures come from the three class slide decks (saved in source/skeletal/).
Boxes are (x, y, w, h) in the original image's pixels, measured with OCR and
then padded by PAD on every side by the build script. A term may appear more
than once on a diagram (e.g. "Compact bone"); the app treats repeats as one item.
"""

UNIT = "skeletal"
PAD = 3
FONT_PX = 13

DIAGRAMS = [
    # ------------------------------------------------------------ Bones
    {
        "id": "long-bone", "section": "bones", "title": "Long bone (Fig 5.2)",
        "source": "source/skeletal/long-bone.png", "crop": (20, 70, 775, 570),
        "labels": [
            ("Proximal epiphysis", (27, 126, 70, 35)),
            ("Diaphysis", (28, 328, 70, 16)),
            ("Distal epiphysis", (27, 509, 70, 35)),
            ("Spongy bone", (228, 81, 56, 32)),
            ("Articular cartilage", (251, 148, 64, 33)),
            ("Epiphyseal line", (251, 182, 78, 33)),
            ("Periosteum", (232, 221, 81, 14)),
            ("Compact bone", (231, 247, 104, 16)),
            ("Medullary cavity", (230, 272, 71, 34)),
            ("Spongy bone", (617, 88, 95, 17)),
            ("Compact bone", (617, 110, 105, 17)),
            ("Articular cartilage", (618, 133, 63, 33)),
            ("Endosteum", (684, 211, 81, 14)),
            ("Yellow bone marrow", (450, 318, 95, 31)),
            ("Compact bone", (450, 359, 104, 16)),
            ("Periosteum", (451, 387, 81, 14)),
            ("Perforating (Sharpey's) fibers", (449, 415, 81, 32)),
            ("Nutrient arteries", (450, 461, 58, 32)),
        ],
    },
    {
        "id": "bone-shapes", "section": "bones", "title": "Bone shapes (Fig 5.1)", "noun": "bone type",
        "source": "source/skeletal/bone-shapes.jpg", "crop": (30, 110, 765, 540),
        "labels": [
            ("Long bone", (66, 222, 91, 16)),
            ("Short bone", (69, 422, 99, 15)),
            ("Flat bone", (627, 270, 81, 16)),
            ("Irregular bone", (627, 453, 120, 16)),
        ],
    },
    {
        "id": "osteon", "section": "bones", "title": "Microscopic bone (Fig 5.3)",
        "source": "source/skeletal/osteon.jpg", "crop": (25, 75, 775, 570),
        "labels": [
            ("Osteon (Haversian system)", (245, 98, 139, 35)),
            ("Lamella", (415, 86, 57, 14)),
            ("Osteocyte", (414, 113, 74, 16)),
            ("Lamellae", (212, 176, 65, 13)),
            ("Lacuna", (634, 257, 53, 14)),
            ("Canaliculus", (634, 278, 85, 14)),
            ("Central (Haversian) canal", (634, 303, 83, 50)),
            ("Matrix", (634, 366, 45, 14)),
            ("Perforating (Sharpey's) fibers", (34, 398, 81, 32)),
            ("Compact bone", (33, 444, 65, 31)),
            ("Blood vessel", (33, 486, 93, 14)),
            ("Spongy bone", (592, 471, 96, 17)),
            ("Central (Haversian) canal", (398, 504, 181, 16)),
            ("Periosteum", (33, 532, 82, 14)),
            ("Perforating (Volkmann's) canal", (399, 532, 221, 17)),
            ("Blood vessel", (399, 555, 93, 14)),
        ],
    },
    {
        "id": "fracture-types", "section": "bones", "title": "Common fractures (Table 5.2)", "noun": "fracture",
        "source": "source/skeletal/fracture-types.jpg", "crop": (35, 105, 760, 560),
        "labels": [
            ("Comminuted", (44, 195, 82, 14)),
            ("Compression", (44, 253, 83, 15)),
            ("Depressed", (44, 294, 68, 15)),
            ("Impacted", (45, 366, 58, 15)),
            ("Spiral", (44, 441, 35, 16)),
            ("Greenstick", (44, 500, 67, 14)),
        ],
    },
    {
        "id": "fracture-healing", "section": "bones", "title": "Fracture repair (Fig 5.5)",
        "source": "source/skeletal/fracture-healing.jpg", "crop": (15, 170, 775, 485),
        "labels": [
            ("Hematoma formation", (66, 440, 94, 36)),
            ("Fibrocartilage callus formation", (262, 440, 136, 36)),
            ("Bony callus formation", (463, 440, 98, 36)),
            ("Bone remodeling", (655, 440, 95, 36)),
            ("Hematoma", (178, 216, 78, 16)),
            ("External callus", (382, 238, 64, 36)),
            ("Internal callus (fibrous tissue and cartilage)", (181, 299, 72, 108)),
            ("New blood vessels", (384, 313, 60, 54)),
            ("Spongy bone trabecula", (370, 373, 72, 54)),
            ("Bony callus of spongy bone", (572, 238, 66, 72)),
            ("Healed fracture", (570, 323, 60, 36)),
        ],
    },

    # ------------------------------------------------------------ Skeleton
    {
        "id": "skeleton", "section": "skeleton", "title": "The human skeleton (Fig 5.6)", "noun": "bone",
        "source": "source/skeletal/skeleton.jpg", "crop": (40, 100, 600, 705),
        "labels": [
            ("Skull", (82, 129, 46, 20)),
            ("Cranium", (280, 111, 66, 16)),
            ("Facial bones", (230, 137, 95, 16)),
            ("Bony thorax (ribs and sternum)", (57, 200, 80, 54)),
            ("Vertebral column", (50, 303, 58, 38)),
            ("Clavicle", (295, 176, 62, 16)),
            ("Scapula", (295, 203, 63, 18)),
            ("Sternum", (295, 227, 64, 16)),
            ("Rib", (295, 247, 30, 16)),
            ("Humerus", (295, 267, 68, 16)),
            ("Vertebra", (295, 289, 64, 16)),
            ("Radius", (295, 311, 52, 12)),
            ("Ulna", (295, 328, 38, 12)),
            ("Carpals", (298, 345, 58, 18)),
            ("Phalanges", (287, 433, 74, 18)),
            ("Metacarpals", (288, 455, 90, 17)),
            ("Femur", (289, 475, 50, 16)),
            ("Patella", (289, 498, 51, 16)),
            ("Tibia", (288, 533, 38, 16)),
            ("Fibula", (288, 560, 47, 16)),
            ("Tarsals", (246, 633, 56, 16)),
            ("Metatarsals", (246, 651, 86, 13)),
            ("Phalanges", (246, 666, 78, 14)),
            ("Bones of pectoral girdle", (511, 146, 72, 50)),
            ("Upper limb", (534, 226, 54, 36)),
            ("Bones of pelvic girdle", (502, 327, 82, 50)),
            ("Lower limb", (534, 502, 54, 38)),
        ],
    },
    {
        "id": "vertebral-column", "section": "skeleton", "title": "Vertebral column (Fig 5.14)",
        "source": "source/skeletal/vertebral-column.jpg", "crop": (90, 50, 560, 752),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (145, 133, 122, 387),
            (401, 174, 93, 34),
            (401, 378, 102, 34),
            (401, 570, 93, 34),
            (395, 658, 93, 50),
            (401, 733, 133, 34),
            (151, 132, 106, 37),  # 2nd cervical vertebra (axis)
            (169, 218, 90, 34),  # 1st thoracic vertebra
            (166, 264, 84, 36),  # Transverse process
            (167, 299, 62, 37),  # Spinous process
            (167, 371, 98, 34),  # Intervertebral disc
            (167, 425, 98, 33),  # Intervertebral foramen
            (172, 486, 85, 34),  # 1st lumbar vertebra
        ],
        "labels": [
            ("1st cervical vertebra (atlas)", (152, 86, 110, 36)),
            ("Cervical curvature", (401, 138, 82, 36)),
            ("Thoracic curvature", (399, 342, 82, 36)),
            ("Lumbar curvature", (399, 533, 82, 36)),
            ("Sacrum", (399, 638, 64, 16)),
            ("Coccyx", (399, 715, 62, 16)),
        ],
    },
    {
        "id": "skull-lateral", "section": "skeleton", "title": "Skull, side view (Fig 5.7)",
        "source": "source/skeletal/skull-lateral.jpg", "crop": (20, 95, 775, 535),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (21, 112, 115, 24),
            (14, 238, 115, 35),
            (26, 286, 143, 24),
            (26, 354, 155, 24),
            (26, 394, 185, 24),
            (88, 422, 155, 24),
            (128, 460, 115, 24),
            (232, 511, 170, 24),
            (640, 430, 131, 24),
            (640, 480, 115, 24),
            (640, 498, 115, 24),
            (30, 116, 106, 12),  # Coronal suture
            (30, 237, 71, 30),  # Lambdoid suture
            (30, 293, 126, 14),  # Squamous suture
            (30, 356, 136, 15),  # Zygomatic process
            (31, 400, 179, 12),  # External acoustic meatus
            (97, 428, 117, 14),  # Mastoid process
            (128, 464, 110, 14),  # Styloid process
            (234, 516, 128, 12),  # Mandibular ramus
            (640, 428, 122, 15),  # Alveolar margins
            (640, 485, 114, 14),  # Mandible (body)
            (640, 503, 109, 12),  # Mental foramen
        ],
        "labels": [
            ("Parietal bone", (31, 150, 92, 11)),
            ("Temporal bone", (30, 199, 107, 14)),
            ("Occipital bone", (30, 318, 102, 14)),
            ("Frontal bone", (640, 117, 89, 11)),
            ("Sphenoid bone", (639, 158, 107, 14)),
            ("Ethmoid bone", (640, 204, 99, 11)),
            ("Lacrimal bone", (640, 244, 100, 12)),
            ("Nasal bone", (640, 306, 79, 12)),
            ("Zygomatic bone", (639, 349, 115, 14)),
            ("Maxilla", (640, 370, 50, 15)),
        ],
    },
    {
        "id": "skull-anterior", "section": "skeleton", "title": "Skull, front view (Fig 5.11)",
        "source": "source/skeletal/skull-anterior.jpg", "crop": (40, 170, 600, 650),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (52, 196, 112, 23),
            (487, 318, 112, 30),
            (487, 372, 112, 23),
            (487, 440, 112, 168),
            (54, 198, 106, 12),  # Coronal suture
            (488, 318, 100, 30),  # Superior orbital fissure
            (489, 380, 79, 14),  # Optic canal
            (488, 441, 99, 48),  # Middle nasal concha of ethmoid bone
            (487, 499, 92, 29),  # Inferior nasal concha
            (488, 542, 46, 11),  # Vomer
            (488, 573, 59, 32),  # Alveolar margins
        ],
        "labels": [
            ("Parietal bone", (55, 235, 92, 11)),
            ("Nasal bone", (54, 310, 79, 11)),
            ("Sphenoid bone", (54, 345, 107, 14)),
            ("Ethmoid bone", (55, 391, 98, 12)),
            ("Lacrimal bone", (55, 413, 100, 12)),
            ("Zygomatic bone", (54, 437, 114, 15)),
            ("Maxilla", (54, 490, 49, 11)),
            ("Mandible", (54, 540, 64, 11)),
            ("Frontal bone", (489, 213, 89, 11)),
            ("Temporal bone", (488, 402, 66, 29)),
        ],
    },
    {
        "id": "skull-superior", "section": "skeleton", "title": "Skull floor, from above (Fig 5.8)",
        "source": "source/skeletal/skull-superior.jpg", "crop": (60, 100, 775, 560),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (530, 206, 121, 166),
            (65, 382, 141, 35),
            (104, 526, 136, 22),
            (524, 163, 121, 30),
            (533, 162, 108, 15),  # Cribriform plate
            (533, 182, 75, 15),  # Crista galli
            (533, 208, 79, 15),  # Optic canal
            (533, 257, 87, 12),  # Sella turcica
            (534, 280, 104, 11),  # Foramen ovale
            (533, 342, 117, 14),  # Jugular foramen
            (74, 385, 117, 29),  # Internal acoustic meatus
            (107, 530, 129, 15),  # Foramen magnum
        ],
        "labels": [
            ("Frontal bone", (534, 123, 89, 12)),
            ("Ethmoid bone", (660, 170, 62, 32)),
            ("Sphenoid bone", (74, 193, 67, 30)),
            ("Temporal bone", (74, 310, 107, 14)),
            ("Parietal bone", (75, 451, 93, 12)),
            ("Occipital bone", (74, 491, 102, 15)),
        ],
    },
    {
        "id": "sinuses", "section": "skeleton", "title": "Paranasal sinuses (Fig 5.10)", "noun": "sinus",
        "source": "source/skeletal/sinuses.jpg", "crop": (15, 170, 775, 436),
        "labels": [
            ("Frontal sinus", (309, 215, 50, 30)),
            ("Ethmoid sinus", (308, 268, 59, 30)),
            ("Sphenoid sinus", (308, 310, 68, 32)),
            ("Maxillary sinus", (308, 377, 64, 32)),
            ("Sphenoid sinus", (421, 204, 68, 32)),
            ("Frontal sinus", (694, 203, 50, 30)),
            ("Ethmoid sinus", (694, 249, 59, 31)),
            ("Maxillary sinus", (694, 300, 63, 32)),
        ],
    },
    {
        "id": "fetal-skull", "section": "skeleton", "title": "Fetal skull (Fig 5.13)",
        "source": "source/skeletal/fetal-skull.jpg", "crop": (90, 90, 560, 690),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (137, 590, 68, 40),
            (428, 430, 85, 40),
            (429, 434, 82, 30),  # Sphenoidal fontanel
            (145, 592, 58, 30),  # Mastoid fontanel
        ],
        "labels": [
            ("Frontal bone", (162, 147, 90, 12)),
            ("Anterior fontanel", (453, 149, 60, 30)),
            ("Parietal bone", (161, 233, 54, 30)),
            ("Posterior fontanel", (162, 316, 127, 12)),
            ("Occipital bone", (452, 331, 63, 31)),
            ("Anterior fontanel", (316, 416, 120, 12)),
            ("Parietal bone", (143, 451, 93, 12)),
            ("Posterior fontanel", (120, 489, 67, 30)),
            ("Frontal bone", (477, 494, 50, 30)),
            ("Occipital bone", (112, 550, 63, 31)),
            ("Temporal bone", (267, 649, 107, 15)),
        ],
    },
    {
        "id": "thorax", "section": "skeleton", "title": "Bony thorax (Fig 5.19a)",
        "source": "source/skeletal/thorax.png", "crop": (30, 75, 700, 575),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (332, 68, 154, 76),
            (412, 164, 83, 21),
            (412, 185, 95, 34),
            (412, 219, 88, 40),
            (412, 258, 57, 40),
            (400, 486, 83, 40),
            (350, 531, 113, 40),
            (332, 88, 80, 17),  # T1 vertebra
            (347, 107, 99, 16),  # Jugular notch
            (361, 127, 117, 13),  # Clavicular notch
            (413, 162, 81, 13),  # Manubrium
            (412, 183, 95, 16),  # Sternal angle
            (413, 204, 38, 16),  # Body (of sternum)
            (412, 222, 87, 34),  # Xiphisternal joint
            (412, 257, 59, 34),  # Xiphoid process
            (405, 489, 76, 35),  # Intercostal spaces
            (349, 535, 113, 16),  # Costal cartilage
        ],
        "labels": [
            ("Sternum", (524, 215, 61, 13)),
            ("True ribs (1–7)", (39, 240, 37, 53)),
            ("False ribs (8–12)", (40, 438, 44, 53)),
            ("Floating ribs (11, 12)", (177, 519, 59, 53)),
            ("L1 vertebra", (237, 462, 64, 30)),
        ],
    },
    {
        "id": "shoulder-girdle", "section": "skeleton", "title": "Shoulder (pectoral) girdle (Fig 5.20)",
        "source": "source/skeletal/shoulder-girdle.jpg", "crop": (15, 70, 760, 570),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (186, 126, 75, 64),
            (435, 77, 332, 386),
            (186, 137, 72, 53),  # Acromioclavicular joint
            (633, 94, 111, 34),  # Medial (sternal) end
            (435, 187, 126, 34),  # Lateral (acromial) end
            (650, 262, 83, 13),  # Sternal end
            (435, 278, 96, 13),  # Acromial end
        ],
        "labels": [
            ("Clavicle", (264, 154, 58, 13)),
            ("Scapula", (105, 396, 59, 16)),
        ],
    },
    {
        "id": "radius-ulna", "section": "skeleton", "title": "Radius and ulna (Fig 5.21c)",
        "source": "source/skeletal/radius-ulna.jpg", "crop": (100, 60, 520, 712),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (205, 139, 95, 110),
            (397, 72, 80, 188),
            (397, 409, 80, 53),
            (220, 636, 66, 58),
            (419, 617, 66, 58),
            (344, 659, 84, 53),
            (400, 75, 70, 33),  # Trochlear notch
            (403, 112, 75, 35),  # Olecranon process
            (403, 149, 68, 36),  # Coronoid process
            (227, 148, 37, 14),  # Head (of radius)
            (227, 178, 37, 14),  # Neck (of radius)
            (225, 204, 75, 35),  # Radial tuberosity
            (397, 197, 75, 53),  # Proximal radioulnar joint
            (400, 410, 77, 50),  # Interosseous membrane
            (424, 622, 58, 52),  # Styloid process of ulna
            (222, 641, 66, 52),  # Styloid process of radius
            (349, 659, 75, 53),  # Distal radioulnar joint
        ],
        "labels": [
            ("Radius", (226, 270, 51, 14)),
            ("Ulna", (415, 351, 33, 14)),
        ],
    },
    {
        "id": "hand", "section": "skeleton", "title": "Bones of the hand (Fig 5.22)",
        "source": "source/skeletal/hand.jpg", "crop": (180, 95, 620, 545),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (286, 238, 49, 41),
            (286, 286, 63, 26),
            (316, 412, 57, 73),
            (510, 415, 82, 88),
            (288, 239, 39, 14),  # Distal phalanx
            (287, 264, 47, 13),  # Middle phalanx
            (288, 301, 61, 14),  # Proximal phalanx
            (316, 412, 55, 14),  # Hamate
            (316, 431, 60, 15),  # Pisiform
            (315, 450, 70, 16),  # Triquetral
            (316, 471, 50, 14),  # Lunate
            (511, 421, 72, 16),  # Trapezoid
            (511, 443, 76, 16),  # Trapezium
            (512, 465, 68, 16),  # Scaphoid
            (512, 486, 60, 16),  # Capitate
        ],
        "labels": [
            ("Phalanges (fingers)", (202, 269, 73, 34)),
            ("Metacarpals (palm)", (202, 366, 89, 34)),
            ("Carpals (wrist)", (203, 440, 57, 34)),
            ("Ulna", (315, 493, 34, 13)),
            ("Radius", (442, 521, 51, 13)),
        ],
    },
    {
        "id": "pelvis", "section": "skeleton", "title": "The pelvis (Fig 5.23a)",
        "source": "source/skeletal/pelvis.jpg", "crop": (10, 70, 770, 500),
        # Teacher's gray boxes from the slide (not on the test), plus the labels they hid.
        "gray": [
            (643, 158, 75, 74),
            (643, 316, 94, 85),
            (363, 481, 79, 29),
            (28, 301, 99, 44),
            (27, 305, 94, 35),  # Coxal bone (hip bone)
            (641, 163, 72, 14),  # Iliac crest
            (642, 192, 72, 35),  # Sacroiliac joint
            (642, 321, 81, 14),  # Pelvic brim
            (641, 345, 91, 16),  # Ischial spine
            (641, 383, 87, 14),  # Acetabulum
            (362, 481, 78, 14),  # Pubic arch
        ],
        "labels": [
            ("Ilium", (139, 281, 45, 14)),
            ("Pubic bone", (142, 361, 92, 14)),
            ("Ischium", (144, 421, 66, 14)),
            ("Coccyx", (141, 464, 55, 16)),
            ("Sacrum", (312, 327, 52, 15)),
            ("Pubic symphysis", (641, 423, 79, 35)),
        ],
    },

    # ------------------------------------------------------------ Joints
    {
        "id": "joint-classes", "section": "joints", "title": "Joint classes (Fig 5.27)",
        "source": "source/skeletal/joint-classes.png", "crop": (30, 80, 600, 712),
        "labels": [
            ("Fibrous joints", (244, 90, 110, 13)),
            ("Cartilaginous joints", (55, 184, 104, 32)),
            ("Synovial joints", (435, 184, 63, 32)),
            ("Fibrous connective tissue", (362, 129, 75, 49)),
            ("Fibrocartilage", (156, 358, 93, 15)),
            ("Vertebrae", (165, 393, 66, 13)),
            ("Pubis", (164, 511, 39, 13)),
            ("Fibrocartilage", (163, 531, 60, 33)),
            ("Articular capsule", (519, 218, 59, 33)),
            ("Articular (hyaline) cartilage", (526, 262, 59, 50)),
            ("Humerus", (437, 329, 62, 13)),
            ("Articular (hyaline) cartilage", (526, 362, 59, 50)),
            ("Articular capsule", (526, 417, 59, 33)),
            ("Ulna", (429, 462, 31, 13)),
            ("Radius", (469, 462, 48, 13)),
            ("Articular capsule", (526, 528, 59, 33)),
            ("Tibia", (231, 608, 35, 13)),
            ("Fibula", (364, 637, 42, 13)),
            ("Fibrous connective tissue", (363, 656, 75, 50)),
        ],
    },
    {
        "id": "synovial-joint", "section": "joints", "title": "Synovial joint (Fig 5.28)", "font_px": 15,
        "source": "source/skeletal/synovial-joint.jpg", "crop": (0, 0, 432, 471),
        "labels": [
            ("Periosteum", (274, 72, 77, 15)),
            ("Ligament", (274, 111, 64, 18)),
            ("Joint cavity (contains synovial fluid)", (274, 150, 96, 50)),
            ("Articular (hyaline) cartilage", (274, 224, 121, 34)),
            ("Fibrous capsule", (274, 295, 53, 35)),
            ("Synovial membrane", (274, 345, 73, 34)),
            ("Articular capsule", (366, 319, 61, 35)),
        ],
    },
    {
        "id": "shoulder-joint", "section": "joints", "title": "Shoulder joint",
        "source": "source/skeletal/shoulder-joint.jpg", "crop": (140, 135, 700, 485),
        "labels": [
            ("Acromion of scapula", (153, 149, 90, 35)),
            ("Ligament", (154, 210, 67, 18)),
            ("Bursa", (154, 238, 43, 14)),
            ("Ligament", (154, 262, 67, 18)),
            ("Tendon sheath", (153, 328, 55, 33)),
            ("Tendon of biceps muscle", (153, 414, 106, 35)),
            ("Joint cavity (contains synovial fluid)", (497, 210, 98, 53)),
            ("Articular (hyaline) cartilage", (497, 290, 64, 53)),
            ("Synovial membrane", (497, 371, 143, 17)),
            ("Fibrous articular capsule", (498, 408, 119, 35)),
            ("Humerus", (404, 463, 65, 14)),
        ],
    },
    {
        "id": "knee", "section": "joints", "title": "Knee joint ligaments", "font_px": 22,
        "source": "source/skeletal/knee.jpg", "crop": (0, 20, 731, 470),
        "labels": [
            ("Anterior cruciate ligament (ACL)", (37, 124, 193, 52)),
            ("Posterior cruciate ligament (PCL)", (515, 153, 201, 53)),
            ("Lateral meniscus", (62, 255, 106, 47)),
            ("Medial meniscus", (585, 241, 106, 50)),
            ("Lateral collateral ligament (LCL)", (6, 406, 190, 53)),
            ("Medial collateral ligament (MCL)", (494, 397, 192, 53)),
        ],
    },
    {
        "id": "synovial-types", "section": "joints", "title": "Types of synovial joints (Fig 5.29)", "noun": "joint type",
        "source": "source/skeletal/synovial-types.png", "crop": (40, 140, 600, 665),
        "labels": [
            ("Plane joint", (77, 330, 53, 37)),
            ("Hinge joint", (202, 374, 93, 17)),
            ("Pivot joint", (369, 427, 46, 36)),
            ("Condyloid joint", (77, 560, 78, 37)),
            ("Saddle joint", (225, 617, 58, 36)),
            ("Ball-and-socket joint", (375, 648, 172, 17)),
        ],
    },
]
