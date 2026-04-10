-- Content calendar for AI-powered article generation
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_keyword VARCHAR(255),
  secondary_keywords TEXT[],
  planned_date DATE,
  status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'draft', 'published'
  generated_title TEXT,
  generated_description TEXT,
  generated_keywords TEXT[],
  generated_content TEXT, -- HTML content
  image_suggestion TEXT,
  blog_post_id UUID REFERENCES blog_posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-seed content calendar with 12 articles
INSERT INTO content_calendar (title, target_keyword, secondary_keywords, planned_date, status) VALUES
  (
    'Comprendre l''autisme : guide complet pour les parents',
    'autisme enfant',
    ARRAY['TSA', 'trouble du spectre autistique', 'diagnostic autisme', 'signes autisme'],
    '2026-05-01',
    'planned'
  ),
  (
    'TDAH chez l''enfant : reconnaître les premiers signes',
    'TDAH enfant symptômes',
    ARRAY['trouble déficit attention', 'hyperactivité', 'concentration enfant', 'diagnostic TDAH'],
    '2026-05-15',
    'planned'
  ),
  (
    'Les troubles DYS expliqués : dyslexie, dyspraxie, dyscalculie',
    'troubles DYS',
    ARRAY['dyslexie', 'dyspraxie', 'dyscalculie', 'dysorthographie', 'troubles apprentissage'],
    '2026-06-01',
    'planned'
  ),
  (
    'Comment accompagner un enfant autiste à l''école',
    'scolarisation autisme',
    ARRAY['inclusion scolaire', 'AESH', 'aménagements scolaires', 'école inclusive'],
    '2026-06-15',
    'planned'
  ),
  (
    'Les méthodes éducatives pour enfants TSA : ABA, TEACCH, PECS',
    'méthodes éducatives autisme',
    ARRAY['ABA', 'TEACCH', 'PECS', 'méthode comportementale', 'éducation structurée'],
    '2026-07-01',
    'planned'
  ),
  (
    'Gestion des crises sensorielles chez l''enfant neuroatypique',
    'crise sensorielle enfant',
    ARRAY['surcharge sensorielle', 'hypersensibilité', 'régulation sensorielle', 'environnement adapté'],
    '2026-07-15',
    'planned'
  ),
  (
    'Le rôle de l''éducateur spécialisé dans l''accompagnement TSA',
    'éducateur spécialisé autisme',
    ARRAY['accompagnement professionnel', 'éducation spécialisée', 'intervention précoce', 'suivi éducatif'],
    '2026-08-01',
    'planned'
  ),
  (
    'Droits et aides financières pour les familles d''enfants handicapés',
    'aides financières handicap enfant',
    ARRAY['AEEH', 'MDPH', 'PCH', 'droits handicap', 'allocation handicap'],
    '2026-08-15',
    'planned'
  ),
  (
    'Sommeil et autisme : solutions pour des nuits apaisées',
    'troubles sommeil autisme',
    ARRAY['insomnie enfant autiste', 'routine sommeil', 'mélatonine', 'hygiène du sommeil'],
    '2026-09-01',
    'planned'
  ),
  (
    'L''alimentation de l''enfant autiste : défis et solutions',
    'alimentation autisme',
    ARRAY['sélectivité alimentaire', 'néophobie', 'régime alimentaire TSA', 'nutrition enfant'],
    '2026-09-15',
    'planned'
  ),
  (
    'Fratrie et handicap : comment accompagner les frères et soeurs',
    'fratrie handicap',
    ARRAY['frères soeurs handicap', 'famille neuroatypique', 'soutien fratrie', 'groupe fratrie'],
    '2026-10-01',
    'planned'
  ),
  (
    'Préparer la transition vers l''âge adulte pour les jeunes TSA',
    'transition adulte autisme',
    ARRAY['autonomie adulte TSA', 'insertion professionnelle', 'vie adulte handicap', 'ESAT'],
    '2026-10-15',
    'planned'
  );
