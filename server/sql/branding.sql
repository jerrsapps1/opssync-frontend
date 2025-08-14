-- Branding configuration table for white-label customization
CREATE TABLE IF NOT EXISTS branding_configs (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant',
    app_name VARCHAR(255) DEFAULT 'StaffTrak',
    primary_color VARCHAR(7) DEFAULT '#4A90E2',
    secondary_color VARCHAR(7) DEFAULT '#BB86FC',
    logo_url TEXT,
    favicon_url TEXT,
    custom_css TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id)
);

-- Insert default branding for default tenant
INSERT INTO branding_configs (tenant_id, app_name, primary_color, secondary_color) 
VALUES ('default-tenant', 'StaffTrak', '#4A90E2', '#BB86FC')
ON CONFLICT (tenant_id) DO NOTHING;