CREATE TYPE activity_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE activity_entity AS ENUM ('book', 'member', 'loan', 'fine');
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin(id) ON DELETE SET NULL,
    admin_email TEXT,
    action activity_action NOT NULL,
    entity activity_entity NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_log_created_at_idx ON activity_log (created_at DESC);
CREATE INDEX activity_log_entity_idx ON activity_log (entity, entity_id);
