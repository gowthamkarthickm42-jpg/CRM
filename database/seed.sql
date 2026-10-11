INSERT INTO users (full_name, email, password_hash, role)
VALUES
('Admin User', 'admin@crm.local', 'demo-password-hash', 'admin'),
('Arun Kumar', 'arun@crm.local', 'demo-password-hash', 'sales_rep'),
('Priya S', 'priya@crm.local', 'demo-password-hash', 'sales_rep');
INSERT INTO companies (company_name, industry, website, phone, email, address)
VALUES
('Kovai Tech Solutions', 'Information Technology', 'https://example.com', '9876543210', 'contact@kovaitech.example', 'Coimbatore, Tamil Nadu'),
('BlueWave Retail', 'Retail', 'https://example.com', '9876501234', 'hello@bluewave.example', 'Chennai, Tamil Nadu'),
('GreenLeaf Foods', 'Food & Beverage', 'https://example.com', '9843012345', 'info@greenleaf.example', 'Erode, Tamil Nadu');
INSERT INTO contacts (
    company_id,
    first_name,
    last_name,
    email,
    phone,
    job_title,
    status,
    assigned_to
)
VALUES
(1, 'Rahul', 'Krishnan', 'rahul@kovaitech.example', '9876543211', 'IT Manager', 'qualified', 2),
(2, 'Divya', 'Ramesh', 'divya@bluewave.example', '9876501235', 'Purchase Manager', 'contacted', 3),
(3, 'Karthik', 'S', 'karthik@greenleaf.example', '9843012346', 'Operations Manager', 'lead', 2);
INSERT INTO deals (
    contact_id,
    assigned_to,
    title,
    stage,
    deal_value,
    expected_close_date
)
VALUES
(1, 2, 'CRM Software Implementation', 'qualified', 150000.00, '2026-11-15'),
(2, 3, 'Retail Management Solution', 'proposal_sent', 225000.00, '2026-12-05'),
(3, 2, 'Business Management System', 'new', 95000.00, '2026-12-20');
INSERT INTO activities (
    contact_id,
    deal_id,
    user_id,
    activity_type,
    subject,
    description,
    activity_date
)
VALUES
(
    1,
    1,
    2,
    'call',
    'Initial discovery call',
    'Discussed CRM requirements and business workflow.',
    '2026-10-05 10:30:00'
),
(
    2,
    2,
    3,
    'email',
    'Proposal sent',
    'Sent the initial CRM solution proposal by email.',
    '2026-10-05 14:00:00'
),
(
    3,
    3,
    2,
    'meeting',
    'Requirement meeting',
    'Discussed current business process and CRM requirements.',
    '2026-10-06 11:00:00'
);INSERT INTO tasks (
    contact_id,
    deal_id,
    assigned_to,
    title,
    description,
    due_date,
    status
)
VALUES
(
    1,
    1,
    2,
    'Follow up with Rahul',
    'Call and confirm the CRM proposal requirements.',
    '2026-10-10 10:00:00',
    'pending'
),
(
    2,
    2,
    3,
    'Follow up on proposal',
    'Check whether the client reviewed the proposal.',
    '2026-10-12 14:30:00',
    'pending'
),
(
    3,
    3,
    2,
    'Schedule product meeting',
    'Arrange a meeting to discuss the CRM solution.',
    '2026-10-15 11:00:00',
    'pending'
);